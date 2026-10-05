"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { bareWorkName, type CanonicalGraph } from "../../lib/app/types";
import { MELODIES, type Melody } from "../../lib/lesson/melodies";
import { getPianoAudioContext, loadPianoSampler, playPianoSample, type PianoSampler } from "../../lib/lesson/piano-sampler";
import { MELODY_PLAYBACK_STARTED, VOCAL_PLAYBACK_STARTED } from "../../lib/lesson/recordings";
import { MelodyPlayer } from "../lesson/MelodyPlayer";
import { CHROMATIC_PITCH_NAMES, HEPTATONIC_MODES, type HeptatonicModeId } from "./heptatonic";
import { findPentatonicWorks, PENTATONIC } from "./pentatonic";
import { makeLupanPhrase, normalizePitchClass, transposeTonicFromDrag, type LupanPitch } from "./lupan-model";

type LabScale = "pentatonic" | HeptatonicModeId;
type Question = { answer: number; round: number; score: number; chosen: number | null };
type Voice = ReturnType<typeof playPianoSample>;
type ScaleNote = LupanPitch & { altered: boolean; solfege: string };
type PhraseNote = ScaleNote & { midi: number; noteIndex: number; octave: boolean };
type PlaybackNote = { midi: number; index: number | null; scoreIndex?: number };
type PlayOptions = { kind: "single" | "phrase" | "question"; title?: string };
type DragState = { angle: number; tonic: number };

const MODES: Array<{ id: LabScale; title: string; subtitle: string; legend: string }> = [
  { id: "pentatonic", title: "五声 · 宫起", subtitle: "宫、商、角、徵、羽，沿着五个正声听一圈。", legend: "五正声" },
  { id: "qingyue", title: "清乐", subtitle: "在五正声间加入清角、变宫。", legend: "清角 · 变宫" },
  { id: "yayue", title: "雅乐", subtitle: "在五正声间加入变徵、变宫。", legend: "变徵 · 变宫" },
  { id: "yanyue", title: "燕乐", subtitle: "在五正声间加入清角、闰。", legend: "清角 · 闰" },
];

const BOOK_LABELS: Record<string, string> = {
  g7s1: "七上", g7s2: "七下", g8s1: "八上", g8s2: "八下", g9s1: "九上", g9s2: "九下",
};

function pointOnDial(semitone: number, radius: number) {
  const angle = (-90 + semitone * 30) * Math.PI / 180;
  return { x: 300 + Math.cos(angle) * radius, y: 300 + Math.sin(angle) * radius };
}

function createInkPath(start: { x: number; y: number }, end: { x: number; y: number }, index: number) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;
  const direction = index % 2 === 0 ? 1 : -1;
  const amplitude = 2.4 + (index % 3) * .35;
  const pointAt = (progress: number, offset: number) => ({
    x: start.x + dx * progress + normalX * offset,
    y: start.y + dy * progress + normalY * offset,
  });
  const firstBend = pointAt(.27, amplitude * direction);
  const middle = pointAt(.52, amplitude * direction * .2);
  const secondBend = pointAt(.78, -amplitude * direction * .55);
  return `M${start.x.toFixed(2)} ${start.y.toFixed(2)} Q${firstBend.x.toFixed(2)} ${firstBend.y.toFixed(2)} ${middle.x.toFixed(2)} ${middle.y.toFixed(2)} Q${secondBend.x.toFixed(2)} ${secondBend.y.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function wrapAngle(angle: number) {
  let result = angle;
  while (result > 180) result -= 360;
  while (result < -180) result += 360;
  return result;
}

function LupanWheel({
  wheelRef,
  scale,
  notes,
  tonicPitchClass,
  activePitchClasses,
  traceVersion,
  stampVersion,
  onPlayNote,
  onTranspose,
  onSetTonic,
  onBeginDrag,
}: {
  wheelRef: RefObject<SVGSVGElement | null>;
  scale: LabScale;
  notes: ScaleNote[];
  tonicPitchClass: number;
  activePitchClasses: number[];
  traceVersion: number;
  stampVersion: number;
  onPlayNote: (note: ScaleNote, pitchClass: number) => void;
  onTranspose: (steps: number) => void;
  onSetTonic: (pitchClass: number) => void;
  onBeginDrag: () => void;
}) {
  const dragRef = useRef<DragState | null>(null);
  const modeTitle = MODES.find((mode) => mode.id === scale)?.title ?? "五声 · 宫起";
  const currentKey = CHROMATIC_PITCH_NAMES[tonicPitchClass];
  const positions = notes.map((note) => pointOnDial(note.semitone, 151));
  const fullPath = positions.length
    ? `${positions.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ")} Z`
    : "";
  const brushWidths = [3.2, 4.3, 2.9, 3.8, 3.1, 4.1, 2.8];

  const pointerAngle = (event: ReactPointerEvent<SVGCircleElement>) => {
    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return 0;
    const x = (event.clientX - rect.left) * 600 / rect.width;
    const y = (event.clientY - rect.top) * 600 / rect.height;
    return Math.atan2(y - 300, x - 300) * 180 / Math.PI;
  };

  const beginDrag = (event: ReactPointerEvent<SVGCircleElement>) => {
    event.preventDefault();
    onBeginDrag();
    dragRef.current = { angle: pointerAngle(event), tonic: tonicPitchClass };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<SVGCircleElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = wrapAngle(pointerAngle(event) - drag.angle);
    onSetTonic(transposeTonicFromDrag(drag.tonic, delta));
  };

  const endDrag = () => { dragRef.current = null; };

  const handleWheelKeys = (event: ReactKeyboardEvent<SVGCircleElement>) => {
    const steps = event.key === "ArrowUp" || event.key === "ArrowRight"
      ? 1
      : event.key === "ArrowDown" || event.key === "ArrowLeft"
        ? -1
        : 0;
    if (!steps) return;
    event.preventDefault();
    onTranspose(steps);
  };

  return <div className="lupan-dial-column">
    <p className="lupan-dial-caption">十二半音位 · 平均律示范</p>
    <div className="lupan-dial-wrap">
      <svg
        ref={wheelRef}
        className="lupan-dial"
        viewBox="0 0 600 600"
        role="group"
        tabIndex={-1}
        aria-label={`律盘，${modeTitle}，当前宫音 1=${currentKey}`}
      >
        <defs>
          <radialGradient id="lupan-paper-face" cx="42%" cy="33%" r="73%">
            <stop offset="0" stopColor="#FFFCF4" />
            <stop offset=".48" stopColor="#F7F0E3" />
            <stop offset=".82" stopColor="#E8DCC5" />
            <stop offset="1" stopColor="#C9B48A" />
          </radialGradient>
          <radialGradient id="lupan-lacquer-depth" cx="36%" cy="28%" r="82%">
            <stop offset="0" stopColor="#FFFDF6" stopOpacity=".27" />
            <stop offset=".52" stopColor="#E9D7B4" stopOpacity=".06" />
            <stop offset=".82" stopColor="#8C693C" stopOpacity=".08" />
            <stop offset="1" stopColor="#563A20" stopOpacity=".28" />
          </radialGradient>
          <linearGradient id="lupan-bronze-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6B4A2E" />
            <stop offset=".18" stopColor="#D2B57F" />
            <stop offset=".46" stopColor="#9D7A47" />
            <stop offset=".72" stopColor="#E1C993" />
            <stop offset="1" stopColor="#73512F" />
          </linearGradient>
          <radialGradient id="lupan-hub-paper" cx="40%" cy="28%" r="85%">
            <stop offset="0" stopColor="#FBF8F0" />
            <stop offset="1" stopColor="#EAE2D0" />
          </radialGradient>
          <filter id="lupan-disc-grain" x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="2" seed="5" result="grain" />
            <feColorMatrix in="grain" values="0 0 0 0 .62 0 0 0 0 .49 0 0 0 0 .31 0 0 0 .11 0" result="tinted-grain" />
            <feComposite in="tinted-grain" in2="SourceAlpha" operator="in" result="masked-grain" />
            <feBlend in="SourceGraphic" in2="masked-grain" mode="multiply" />
          </filter>
          <filter id="lupan-ink-soft" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
        </defs>

        <circle className="lupan-disc-shadow" cx="300" cy="307" r="267" />
        <circle className="lupan-disc-edge" cx="300" cy="300" r="264" />
        <circle className="lupan-disc-bevel" cx="300" cy="300" r="258" />
        <circle className="lupan-disc-face" cx="300" cy="300" r="253" />
        <circle className="lupan-disc-lacquer" cx="300" cy="300" r="252" />
        <circle className="lupan-disc-rimlight" cx="300" cy="300" r="255.4" />
        <circle className="lupan-disc-etched" cx="300" cy="300" r="240" />
        <circle className="lupan-disc-inner" cx="300" cy="300" r="226" />
        <circle className="lupan-disc-faint" cx="300" cy="300" r="205" />
        <circle className="lupan-disc-inner-rim" cx="300" cy="300" r="190" />
        <circle className="lupan-disc-inner" cx="300" cy="300" r="179" />

        <g className="lupan-pitch-ring" style={{ transform: `rotate(${-tonicPitchClass * 30}deg)` }}>
          {CHROMATIC_PITCH_NAMES.map((pitchName, pitchClass) => {
            const angle = (-90 + pitchClass * 30) * Math.PI / 180;
            const outer = { x: 300 + Math.cos(angle) * 239, y: 300 + Math.sin(angle) * 239 };
            const innerRadius = pitchClass % 3 === 0 ? 222 : 228;
            const inner = { x: 300 + Math.cos(angle) * innerRadius, y: 300 + Math.sin(angle) * innerRadius };
            const label = { x: 300 + Math.cos(angle) * 205, y: 300 + Math.sin(angle) * 205 };
            const isTonic = pitchClass === tonicPitchClass;
            return <g key={pitchName}>
              <line className="lupan-pitch-tick-shadow" x1={inner.x + 1} y1={inner.y + 1} x2={outer.x + 1} y2={outer.y + 1} />
              <line className={`lupan-pitch-tick${pitchClass % 3 === 0 ? " is-major" : ""}`} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />
              <text
                className={`lupan-pitch-name${isTonic ? " is-tonic" : ""}`}
                x={label.x}
                y={label.y}
                transform={`rotate(${tonicPitchClass * 30} ${label.x} ${label.y})`}
              >{pitchName}</text>
            </g>;
          })}
        </g>

        <g className="lupan-constellation" aria-hidden="true">
          <path className="lupan-ink-under" d={fullPath} />
          {positions.map((point, index) => {
            const next = positions[(index + 1) % positions.length];
            const path = createInkPath(point, next, index);
            const dx = next.x - point.x;
            const dy = next.y - point.y;
            const length = Math.hypot(dx, dy) || 1;
            const step = Math.min(31, length * .28);
            const start = { x: point.x + dx / length * step, y: point.y + dy / length * step };
            const end = { x: next.x - dx / length * step, y: next.y - dy / length * step };
            return <g key={`${traceVersion}-${index}`}>
              <path
                className={`lupan-ink-stroke${traceVersion ? " is-tracing" : ""}`}
                d={path}
                pathLength="100"
                style={{ "--brush-width": `${brushWidths[index % brushWidths.length]}px`, "--trace-delay": `${Math.max(0, index - 1) * 70}ms` } as CSSProperties}
              />
              <circle className="lupan-ink-pool" cx={start.x} cy={start.y} r="2.2" />
              <circle className="lupan-ink-pool" cx={end.x} cy={end.y} r="1.8" />
            </g>;
          })}
        </g>

        <g className="lupan-wheel-hub" aria-hidden="true">
          <circle className="lupan-hub" cx="300" cy="300" r="57" />
          <circle className="lupan-hub-inner" cx="300" cy="300" r="49" />
          <text className="lupan-hub-main" x="300" y="286">宫</text>
          <text className="lupan-hub-key" x="300" y="311">{currentKey}</text>
          <text className="lupan-hub-sub" x="300" y="331">宫音基准</text>
        </g>

        <g className="lupan-scale-notes">
          {notes.map((note, index) => {
            const point = positions[index];
            const pitchClass = normalizePitchClass(tonicPitchClass + note.semitone);
            const pitchName = CHROMATIC_PITCH_NAMES[pitchClass];
            const sounding = activePitchClasses.includes(pitchClass);
            const ariaLabel = `${note.name}，${pitchName}，${note.altered ? "偏音" : "正声"}，简谱 ${note.degree}${note.altered ? "，拓展知识" : ""}`;
            return <g
              key={`${stampVersion}-${scale}-${note.name}`}
              className={`lupan-scale-note${note.altered ? " is-altered" : ""}${sounding ? " is-sounding" : ""}`}
              transform={`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`}
              role="button"
              tabIndex={0}
              aria-label={ariaLabel}
              aria-current={sounding ? "true" : undefined}
              onClick={() => onPlayNote(note, pitchClass)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                onPlayNote(note, pitchClass);
              }}
            >
              <circle className="lupan-note-hit" r="35" />
              <g className={note.altered && stampVersion ? "lupan-stamp-motion is-dropping" : "lupan-stamp-motion"}>
                <circle className="lupan-note-core" r="27" />
                <circle className="lupan-note-halo" r="31" />
                {note.altered
                  ? <>
                    <text className="lupan-note-degree lupan-note-degree-altered" y="-21">{note.degree}</text>
                    <rect className="lupan-bias-stamp" x="-25" y="-15" width="50" height="30" transform="rotate(-3)" />
                    <text className="lupan-bias-label" y="1">{note.name}</text>
                  </>
                  : <>
                    <text className="lupan-note-degree" y="-12">{note.degree}</text>
                    <text className="lupan-note-name" y="7">{note.name}</text>
                    <text className="lupan-note-solfege" y="21">{note.solfege}</text>
                  </>}
              </g>
            </g>;
          })}
        </g>

        <path className="lupan-fixed-marker" d="M300 24 L289 48 L311 48 Z" aria-hidden="true" />
        <circle
          className="lupan-drag-track"
          cx="300"
          cy="300"
          r="272"
          role="button"
          tabIndex={0}
          aria-label={`律盘外圈，当前宫音 1=${currentKey}；拖动或按方向键移宫`}
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={handleWheelKeys}
        />
      </svg>
    </div>
    <div className="lupan-turn-controls" aria-label="移宫控制">
      <button type="button" aria-label="移低半音" onClick={() => onTranspose(-1)}>−</button>
      <span>轻拖外圈，或按 ↑ ↓ 移宫</span>
      <button type="button" aria-label="移高半音" onClick={() => onTranspose(1)}>＋</button>
    </div>
  </div>;
}

function revealLabTarget(target: Element | null) {
  if (!target) return;
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "center",
    inline: "nearest",
  });
}

export function LabPage({ graph, onOpenWork }: { graph: CanonicalGraph; onOpenWork: (work: string) => void }) {
  const [tonicPitchClass, setTonicPitchClass] = useState(0);
  const [scale, setScale] = useState<LabScale>("pentatonic");
  const [traceVersion, setTraceVersion] = useState(0);
  const [stampVersion, setStampVersion] = useState(0);
  const [activeKeys, setActiveKeys] = useState<number[]>([]);
  const [activePitchClasses, setActivePitchClasses] = useState<number[]>([]);
  const [scorePosition, setScorePosition] = useState(-1);
  const [pulse, setPulse] = useState(0);
  const [message, setMessage] = useState("点一个徽位，听听它的声音。");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<{ name: string; index: number } | null>(null);
  const [workPlaying, setWorkPlaying] = useState(false);
  const sampler = useRef<PianoSampler | null>(null);
  const output = useRef<DynamicsCompressorNode | null>(null);
  const voices = useRef<Voice[]>([]);
  const timers = useRef<number[]>([]);
  const request = useRef(0);
  const mounted = useRef(true);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<SVGSVGElement>(null);
  const scoreWindowRef = useRef<HTMLDivElement>(null);
  const scoreTrackRef = useRef<HTMLOListElement>(null);
  const playerRef = useRef<HTMLElement>(null);
  const revealPlayerAfterRender = useRef(false);

  const works = useMemo(() => findPentatonicWorks(graph).slice(0, 8), [graph]);
  const selectedMelody: Melody | undefined = selected ? MELODIES[selected.name]?.[selected.index] : undefined;
  const tonicMidi = 60 + tonicPitchClass;
  const keyName = CHROMATIC_PITCH_NAMES[tonicPitchClass];
  const selectedMode = MODES.find((mode) => mode.id === scale) ?? MODES[0];
  const scaleTitle = scale === "pentatonic" ? "五声" : HEPTATONIC_MODES[scale].name;
  const displayKey = workPlaying && selectedMelody ? selectedMelody.key : `1=${keyName}`;

  const scaleNotes = useMemo<ScaleNote[]>(() => scale === "pentatonic"
    ? PENTATONIC.map((note) => ({ ...note, degree: String(note.degree), altered: false }))
    : HEPTATONIC_MODES[scale].notes.map((note) => ({ ...note })), [scale]);
  const scoreNotes = useMemo<PhraseNote[]>(() => makeLupanPhrase(
    scaleNotes,
    tonicMidi,
    scale === "pentatonic",
  ), [scale, scaleNotes, tonicMidi]);

  const stopLab = useCallback(() => {
    request.current += 1;
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    voices.current.forEach((voice) => voice.stop());
    voices.current = [];
    if (mounted.current) {
      setActiveKeys([]);
      setActivePitchClasses([]);
      setScorePosition(-1);
      setLoading(false);
      setWorkPlaying(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    window.addEventListener(MELODY_PLAYBACK_STARTED, stopLab);
    window.addEventListener(VOCAL_PLAYBACK_STARTED, stopLab);
    return () => {
      mounted.current = false;
      stopLab();
      output.current?.disconnect();
      window.removeEventListener(MELODY_PLAYBACK_STARTED, stopLab);
      window.removeEventListener(VOCAL_PLAYBACK_STARTED, stopLab);
    };
  }, [stopLab]);

  useLayoutEffect(() => {
    if (!revealPlayerAfterRender.current || !selected) return;
    revealPlayerAfterRender.current = false;
    revealLabTarget(playerRef.current);
  }, [selected]);

  useLayoutEffect(() => {
    const track = scoreTrackRef.current;
    if (!track) return;
    if (scorePosition < 0) {
      track.style.setProperty("--score-offset", "0px");
      return;
    }
    const view = scoreWindowRef.current;
    const target = track?.children[scorePosition] as HTMLElement | undefined;
    if (!view || !track || !target) return;
    const noteCenter = target.offsetLeft + target.offsetWidth / 2;
    track.style.setProperty("--score-offset", `${-noteCenter}px`);
  }, [scorePosition, scoreNotes.length]);

  const ensureAudio = useCallback(async () => {
    const context = getPianoAudioContext();
    if (context.state !== "running") await context.resume();
    if (!sampler.current) {
      setLoading(true);
      setMessage("正在载入钢琴采样音色…");
      sampler.current = await loadPianoSampler(context);
    }
    if (!output.current) {
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 18;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.002;
      compressor.release.value = 0.15;
      compressor.connect(context.destination);
      output.current = compressor;
    }
    return { context, bank: sampler.current, destination: output.current };
  }, []);

  const playSequence = useCallback(async (notes: PlaybackNote[], options: PlayOptions) => {
    window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED));
    stopLab();
    const token = request.current;
    try {
      const { context, bank, destination } = await ensureAudio();
      if (!mounted.current || token !== request.current) return;
      setLoading(false);
      const start = context.currentTime + 0.02;
      const beatSeconds = options.kind === "single" ? 0 : 0.36;
      voices.current = notes.map((note, index) => {
        const when = start + index * beatSeconds;
        if (options.kind !== "question") {
          timers.current.push(window.setTimeout(() => {
            if (!mounted.current || token !== request.current) return;
            setActiveKeys(note.index === null ? [] : [note.index]);
            setActivePitchClasses([normalizePitchClass(note.midi)]);
            if (note.scoreIndex !== undefined) setScorePosition(note.scoreIndex);
            setPulse((value) => value + 1);
          }, Math.max(0, (when - context.currentTime) * 1000)));
        }
        return playPianoSample(
          context,
          bank,
          note.midi,
          when,
          notes.length === 1 ? 0.62 : 0.34,
          destination,
          0.5,
        );
      });
      const label = options.title ?? "五声走句";
      if (options.kind === "single") setMessage(`正在弹奏：${label}。`);
      else if (options.kind === "phrase") setMessage(`正在听${label}上行再回宫。`);
      const length = notes.length * beatSeconds * 1000 + (options.kind === "single" ? 760 : 560);
      timers.current.push(window.setTimeout(() => {
        if (!mounted.current || token !== request.current) return;
        voices.current = [];
        setActiveKeys([]);
        setActivePitchClasses([]);
        setScorePosition(-1);
      }, length));
    } catch {
      if (mounted.current && token === request.current) {
        setLoading(false);
        setMessage("钢琴采样音色未能载入，请检查网络后再试。 ");
      }
    }
  }, [ensureAudio, stopLab]);

  const answerQuestion = useCallback((index: number) => {
    if (!question || question.chosen !== null) return false;
    const correct = index === question.answer;
    setQuestion({ ...question, chosen: index, score: question.score + Number(correct) });
    setMessage(correct
      ? `答对了，是${PENTATONIC[index].name}。`
      : `正确答案是${PENTATONIC[question.answer].name}（简谱 ${PENTATONIC[question.answer].degree}）。`);
    return true;
  }, [question]);

  const playKey = useCallback((index: number) => {
    if (loading) return;
    if (question?.chosen === null && answerQuestion(index)) return;
    const note = PENTATONIC[index];
    void playSequence([{ index, midi: tonicMidi + note.semitone }], { kind: "single", title: note.name });
  }, [answerQuestion, loading, playSequence, question, tonicMidi]);

  const playDialNote = useCallback((note: ScaleNote, pitchClass: number) => {
    if (loading) return;
    if (question?.chosen === null) {
      const index = PENTATONIC.findIndex((pentatonicNote) => pentatonicNote.semitone === note.semitone);
      if (index < 0) {
        setMessage("这不是五个正声中的一个，请选宫、商、角、徵或羽。");
        return;
      }
      if (answerQuestion(index)) return;
    }
    const index = PENTATONIC.findIndex((pentatonicNote) => pentatonicNote.semitone === note.semitone);
    void playSequence([{ index: index < 0 ? null : index, midi: tonicMidi + note.semitone }], {
      kind: "single",
      title: `${note.name}（${CHROMATIC_PITCH_NAMES[pitchClass]}）`,
    });
  }, [answerQuestion, loading, playSequence, question, tonicMidi]);

  const clearQuestion = useCallback(() => {
    setQuestion(null);
    setMessage("已回到自由试听。");
  }, []);

  const moveTonic = useCallback((steps: number) => {
    if (!steps) return;
    stopLab();
    window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED));
    setQuestion(null);
    setTonicPitchClass((current) => normalizePitchClass(current + steps));
    setMessage("宫位已移动，听听音高怎样改变。");
  }, [stopLab]);

  const setTonic = useCallback((pitchClass: number) => {
    setTonicPitchClass(normalizePitchClass(pitchClass));
  }, []);

  const beginDialDrag = useCallback(() => {
    stopLab();
    window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED));
    setQuestion(null);
  }, [stopLab]);

  const chooseScale = useCallback((nextScale: LabScale) => {
    if (nextScale === scale) return;
    stopLab();
    window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED));
    setScale(nextScale);
    setQuestion(null);
    setTraceVersion((value) => value + 1);
    setStampVersion((value) => value + 1);
    setMessage(nextScale === "pentatonic"
      ? "回到五声，听一听宫、商、角、徵、羽。"
      : `已选择${HEPTATONIC_MODES[nextScale].name}。朱砂色印记标出偏音，属于拓展知识。`);
  }, [scale, stopLab]);

  const playPhrase = useCallback(() => {
    setQuestion(null);
    const phrase: PlaybackNote[] = scoreNotes.map((note, scoreIndex) => ({
      midi: note.midi,
      index: PENTATONIC.findIndex((pentatonicNote) => pentatonicNote.semitone === note.semitone),
      scoreIndex,
    })).map((note) => ({ ...note, index: note.index < 0 ? null : note.index }));
    void playSequence(phrase, { kind: "phrase", title: scaleTitle });
  }, [playSequence, scaleTitle, scoreNotes]);

  const startQuestion = useCallback((round: number, score: number) => {
    const answer = Math.floor(Math.random() * PENTATONIC.length);
    setQuestion({ answer, round, score, chosen: null });
    setMessage(`第 ${round} / 5 题。听一遍，再按五声键作答。`);
    void playSequence([{ index: answer, midi: tonicMidi + PENTATONIC[answer].semitone }], { kind: "question" });
  }, [playSequence, tonicMidi]);

  const startQuiz = useCallback(() => {
    setQuestion(null);
    startQuestion(1, 0);
    revealLabTarget(keyboardRef.current);
  }, [startQuestion]);

  const nextQuestion = useCallback(() => {
    if (!question || question.chosen === null) return;
    if (question.round >= 5) {
      setMessage(`练习完成，答对 ${question.score} / 5 题。`);
      setQuestion({ ...question, round: 5, chosen: 5 });
      return;
    }
    startQuestion(question.round + 1, question.score);
  }, [question, startQuestion]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, select, textarea, [contenteditable=true]")) return;
      const index = PENTATONIC.findIndex((note) => String(note.degree) === event.key);
      if (index < 0) return;
      event.preventDefault();
      playKey(index);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playKey]);

  const soundingNotes = useCallback((notes: number[], playing: boolean) => {
    setWorkPlaying(playing);
    const tonic = selectedMelody?.tonicMidi ?? tonicMidi;
    setActiveKeys([...new Set(notes.flatMap((midi) => {
      const semitone = normalizePitchClass(midi - tonic);
      const index = PENTATONIC.findIndex((note) => note.semitone === semitone);
      return index < 0 ? [] : [index];
    }))]);
    setActivePitchClasses([...new Set(notes.map(normalizePitchClass))]);
    if (notes.length) setPulse((value) => value + 1);
  }, [selectedMelody, tonicMidi]);

  const finishOrRepeatQuiz = () => {
    if (!question) return;
    if (question.round === 5 && question.chosen === 5) {
      startQuestion(1, 0);
      return;
    }
    nextQuestion();
  };

  return <section className="lupan-lab" aria-labelledby="lupan-title">
    <header className="lupan-intro">
      <div className="lupan-intro-copy">
        <p className="lupan-kicker">五声实验室 · 听音与转调</p>
        <h1 id="lupan-title">律盘 <small>五声 · 七声</small></h1>
        <p className="lupan-intro-summary">点一处徽位听音；转动外圈，换一个宫位。再听音阶怎样在盘上排开。</p>
      </div>
      <div className="lupan-current-key" aria-live="polite"><span>当前宫</span><b>{keyName}</b></div>
    </header>

    <section className="lupan-stage" aria-label="律盘练习">
      <aside className="lupan-stick-board" aria-label="选择音阶">
        <p className="lupan-stage-label">选四支竹签</p>
        <div className="lupan-stick-list" role="group" aria-label="选择五声或七声示范">
          {MODES.map((item) => <button
            key={item.id}
            type="button"
            className="lupan-bamboo"
            data-mode={item.id}
            aria-pressed={scale === item.id}
            aria-label={item.id === "pentatonic" ? "五声" : item.title}
            onClick={() => chooseScale(item.id)}
          >
            <span>{item.id === "pentatonic" ? "五声" : item.title}</span>
            <small>{item.legend}</small>
          </button>)}
        </div>
        <p className="lupan-bamboo-legend"><b>{selectedMode.title}</b><span>{selectedMode.subtitle}</span></p>
        <p className="lupan-mode-note">{scale === "pentatonic" ? "先听熟这五个音，再试着换宫位。" : "拓展知识 · 一种七声音阶的等音高示范。"}</p>
      </aside>

      <div className="lupan-center-column">
        <LupanWheel
          wheelRef={wheelRef}
          scale={scale}
          notes={scaleNotes}
          tonicPitchClass={tonicPitchClass}
          activePitchClasses={activePitchClasses}
          traceVersion={traceVersion}
          stampVersion={stampVersion}
          onPlayNote={playDialNote}
          onTranspose={moveTonic}
          onSetTonic={setTonic}
          onBeginDrag={beginDialDrag}
        />
        <section className="lupan-score-tape" aria-label="自编简谱示例">
          <div className="lupan-score-head"><span>自编示例 · 非教材曲目</span><strong>{scale === "pentatonic" ? "五声走句" : `${scaleTitle}走句`}</strong></div>
          <div className="lupan-score-view" ref={scoreWindowRef}>
            <span className="lupan-score-playhead" aria-hidden="true" />
            <ol
              ref={scoreTrackRef}
              className={`lupan-score-track${scorePosition >= 0 ? " is-following" : ""}`}
              aria-label={`${scaleTitle}自编简谱示例`}
            >
              {scoreNotes.map((note, index) => <li
                key={`${index}-${note.name}`}
                className={`lupan-score-note${note.altered ? " is-altered" : ""}${scorePosition === index ? " is-current" : ""}`}
                aria-current={scorePosition === index ? "step" : undefined}
                aria-label={`${note.name}，简谱 ${note.degree}${note.octave ? "，高八度" : ""}${note.altered ? "，偏音，拓展知识" : ""}`}
              >
                <span className="lupan-score-degree">{note.degree}{note.octave && <sup aria-label="高八度">·</sup>}</span>
                {!note.altered && <span className="lupan-score-name">{note.name}</span>}
                {note.altered && <span className="lupan-score-bias"><i aria-hidden="true" /><b>{note.name}</b></span>}
              </li>)}
            </ol>
          </div>
          <div className="lupan-score-actions">
            <button type="button" disabled={loading} onClick={playPhrase}>听这一句</button>
            <span>听音与徽位同步亮起</span>
            <button type="button" className="is-stop" onClick={() => { stopLab(); window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED)); setMessage("已停止。"); }}>停止</button>
          </div>
        </section>
      </div>

      <aside className="lupan-guide" aria-labelledby="lupan-guide-title">
        <p className="lupan-guide-kicker">先听 · 再转</p>
        <h2 id="lupan-guide-title">让音在盘上走</h2>
        <p>轻点一个徽位，听听它的音高。选一支竹签，再转动外圈，看看一串音怎样换到另一个宫位。</p>
        <ol className="lupan-guide-list">
          <li><b>一</b><span>点徽位，听这一声。</span></li>
          <li><b>二</b><span>抽出一支竹签，换一种音阶。</span></li>
          <li><b>三</b><span>转外圈或按方向键，换宫位。</span></li>
        </ol>
        <div className="lupan-guide-actions">
          <button type="button" className="lupan-ink-button" disabled={loading} onClick={playPhrase}>听一遍上行再回宫</button>
          <button type="button" className="lupan-text-button" onClick={() => { wheelRef.current?.focus(); revealLabTarget(wheelRef.current); }}>回到律盘</button>
        </div>
        <p className="lupan-guide-note">七声部分为平均律教学示范，属于拓展知识。</p>
      </aside>
    </section>

    <section className="lupan-sound-panel" aria-labelledby="lupan-sound-title">
      <div className="lupan-keys-and-actions">
        <div className="lupan-section-title"><h2 id="lupan-sound-title">五声键</h2><span>按 1 · 2 · 3 · 5 · 6 试弹</span></div>
        <p className="lupan-sound-intro">听一声，记住它的位置；也可以让五个音上行再回到宫。</p>
        <div className="lupan-five-keys" ref={keyboardRef} role="group" aria-label={`宫商角徵羽五声键，${displayKey}`} aria-busy={loading}>
          {PENTATONIC.map((note, index) => <button
            key={note.name}
            type="button"
            className={`lupan-five-key${index === 0 ? " is-main" : ""}${activeKeys.includes(index) ? " is-sounding" : ""}${question?.chosen === index ? index === question.answer ? " is-correct" : " is-wrong" : ""}`}
            aria-label={`${note.name}，${note.solfege}，简谱 ${note.degree}，${displayKey}${index === 0 ? "，宫音" : ""}`}
            onClick={() => playKey(index)}
          >
            <span className="lupan-key-degree">{note.degree}</span>
            <strong>{note.name}</strong>
            <small>{note.solfege}</small>
            {activeKeys.includes(index) && <span key={pulse} className="lupan-key-ripple" aria-hidden="true" />}
          </button>)}
        </div>
        <div className="lupan-sound-row-actions">
          <button type="button" disabled={loading} onClick={() => { if (scale !== "pentatonic") chooseScale("pentatonic"); void playSequence(makeLupanPhrase(PENTATONIC.map((note) => ({ ...note, degree: String(note.degree), altered: false })), tonicMidi, true).map((note, scoreIndex) => ({ midi: note.midi, index: PENTATONIC.findIndex((item) => item.semitone === note.semitone), scoreIndex })), { kind: "phrase", title: "五声" }); }}>上行再下行</button>
          <span>按 1、2、3、5、6 键可直接试听</span>
        </div>
      </div>

      <aside className="lupan-quiz" aria-labelledby="lupan-quiz-title">
        <p className="lupan-kicker">试试耳朵</p>
        <h3 id="lupan-quiz-title">听音找键</h3>
        <p aria-live="polite" className="lupan-quiz-message">{question
          ? question.chosen === null
            ? `第 ${question.round} / 5 题。听一遍，再按上面的五声键作答。`
            : question.chosen === 5
              ? `练习完成，答对 ${question.score} / 5 题。`
              : question.chosen === question.answer
                ? `答对了，是${PENTATONIC[question.answer].name}。`
                : `正确答案是${PENTATONIC[question.answer].name}（简谱 ${PENTATONIC[question.answer].degree}）。`
          : "先听一个音，再按上面的五声键作答。共五题。"}</p>
        <div className="lupan-quiz-actions">
          {!question && <button type="button" disabled={loading} onClick={startQuiz}>开始练习</button>}
          {question?.chosen === null && <>
            <button type="button" disabled={loading} onClick={() => void playSequence([{ index: question.answer, midi: tonicMidi + PENTATONIC[question.answer].semitone }], { kind: "question" })}>再听一次</button>
            <button type="button" onClick={clearQuestion}>结束练习</button>
          </>}
          {question && question.chosen !== null && <button type="button" disabled={loading} onClick={finishOrRepeatQuiz}>
            {question.round === 5 && question.chosen === 5 ? "再练一轮" : question.round === 5 ? "查看结果" : "下一题"}
          </button>}
          {question?.chosen != null && question.chosen !== 5 && <button type="button" onClick={clearQuestion}>结束练习</button>}
        </div>
      </aside>
      <p className="lupan-live-message" role="status" aria-live="polite">{message}</p>
    </section>

    {selected && selectedMelody && <section className="lupan-work-player" ref={playerRef} aria-label={`${selected.name}旋律示范`}>
      <div className="lupan-player-heading">
        <h2>听《{bareWorkName(selected.name)}》</h2>
        <button type="button" onClick={() => { stopLab(); setSelected(null); }}>收起</button>
      </div>
      {MELODIES[selected.name].length > 1 && <div className="lupan-excerpts" role="group" aria-label="选择谱例片段">
        {MELODIES[selected.name].map((melody, index) => <button
          type="button"
          key={index}
          aria-pressed={selected.index === index}
          onClick={() => { stopLab(); setSelected({ ...selected, index }); }}
        >{melody.title ?? `片段 ${index + 1}`}</button>)}
      </div>}
      <MelodyPlayer key={`${selected.name}:${selected.index}`} melody={selectedMelody} onSoundingNotes={soundingNotes} />
    </section>}

    <section className="lupan-works-section" aria-labelledby="lupan-works-title">
      <div className="lupan-works-heading">
        <div><p className="lupan-kicker">回到教材</p><h2 id="lupan-works-title">教材里的五声作品</h2></div>
        <p>作品与标注来自教材关系数据。<br />听旋律时，对应的五声键会亮起。</p>
      </div>
      <div className="lupan-works-grid">
        {works.map(({ work, evidence }) => {
          const melodies = MELODIES[work.name];
          const book = BOOK_LABELS[work.bookKeys?.[0] ?? ""] ?? "教材";
          return <article className="lupan-work-slip" key={work.id}>
            <span className="lupan-work-book">{book}</span>
            <h3 title={bareWorkName(work.name)}>{bareWorkName(work.name)}</h3>
            <span className="lupan-work-evidence">{[...new Set(evidence.map((item) => item.value))].join("、")}</span>
            <button type="button" className="lupan-work-open" onClick={() => onOpenWork(bareWorkName(work.name))} aria-label={`在按课学习中打开《${bareWorkName(work.name)}》`}>去学习 →</button>
            {melodies?.length > 0 && <button
              type="button"
              className="lupan-work-listen"
              onClick={() => {
                stopLab();
                setQuestion(null);
                revealPlayerAfterRender.current = true;
                setSelected({ name: work.name, index: 0 });
                setMessage(`已选择${work.name}，点击「播放旋律」。`);
              }}
              aria-label={`听${work.name}旋律`}
            >▷ 听旋律{melodies.every((melody) => melody.quality === "draft") ? "（草稿）" : ""}</button>}
          </article>;
        })}
        {!works.length && <p className="lupan-works-empty">教材关系数据中暂未找到五声调式标注。</p>}
      </div>
      <p className="lupan-works-foot"><span>作品与标注来自教材关系数据。</span><span>{works.length ? `${works.length} 首` : ""}</span></p>
    </section>

    <p className="lupan-credit">钢琴采样：<a href="https://archive.org/details/SalamanderGrandPianoV3" target="_blank" rel="noreferrer">Salamander Grand Piano</a> · Alexander Holm · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a></p>
  </section>;
}
