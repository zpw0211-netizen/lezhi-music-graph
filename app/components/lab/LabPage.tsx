"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { bareWorkName, type BookDirectory, type CanonicalGraph } from "../../lib/app/types";
import { StageBookPicker } from "../StageBookPicker";
import { PUBLISHED_BOOK_SHORT_NAMES, availableBookStages, booksForStage, type BookStage } from "../../lib/app/books";
import { MELODIES, type Melody } from "../../lib/lesson/melodies";
import { getPianoAudioContext, loadPianoSampler, playPianoSample, type PianoSampler } from "../../lib/lesson/piano-sampler";
import { MELODY_PLAYBACK_STARTED, VOCAL_PLAYBACK_STARTED } from "../../lib/lesson/recordings";
import { MelodyPlayer } from "../lesson/MelodyPlayer";
import { CHROMATIC_PITCH_NAMES, HEPTATONIC_MODES, type HeptatonicModeId } from "./heptatonic";
import { findPentatonicWorks, PENTATONIC } from "./pentatonic";
import { makeLupanPhrase, normalizePitchClass, transposeTonicFromDrag, type LupanPitch } from "./lupan-model";
import { DIAL_NOTE_INFO, PITCH_NAME_READING } from "./lab-glossary";

type LabScale = "pentatonic" | HeptatonicModeId;
/** What the explanation card is showing: a scale tone, a fixed pitch name on the outer ring, or the 宫 hub. */
type Inspect = { kind: "note"; name: string } | { kind: "pitch"; pitchClass: number } | { kind: "hub" } | null;
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
  inspect,
  onPlayNote,
  onPlayPitch,
  onInspectHub,
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
  inspect: Inspect;
  onPlayNote: (note: ScaleNote, pitchClass: number) => void;
  onPlayPitch: (pitchClass: number) => void;
  onInspectHub: () => void;
  onTranspose: (steps: number) => void;
  onSetTonic: (pitchClass: number) => void;
  onBeginDrag: () => void;
}) {
  const activate = (event: ReactKeyboardEvent<SVGGElement>, action: () => void) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    action();
  };
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
          {/* Cast bronze face: warm gold in the light, umber toward the rim. */}
          <radialGradient id="lupan-metal-face" cx="38%" cy="30%" r="78%">
            <stop offset="0" stopColor="#F2DDA8" />
            <stop offset=".34" stopColor="#D8B776" />
            <stop offset=".68" stopColor="#B08A4E" />
            <stop offset=".9" stopColor="#8A6735" />
            <stop offset="1" stopColor="#6E5028" />
          </radialGradient>
          <linearGradient id="lupan-metal-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFF6DD" stopOpacity=".55" />
            <stop offset=".3" stopColor="#FFF6DD" stopOpacity="0" />
            <stop offset=".52" stopColor="#FFF0C8" stopOpacity=".22" />
            <stop offset=".7" stopColor="#3A2A14" stopOpacity="0" />
            <stop offset="1" stopColor="#2A1D0C" stopOpacity=".32" />
          </linearGradient>
          <linearGradient id="lupan-bronze-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5A3D20" />
            <stop offset=".2" stopColor="#D9BC82" />
            <stop offset=".45" stopColor="#8E6B3A" />
            <stop offset=".7" stopColor="#E8CF97" />
            <stop offset="1" stopColor="#5E4224" />
          </linearGradient>
          <radialGradient id="lupan-stud" cx="36%" cy="30%" r="78%">
            <stop offset="0" stopColor="#FFF4D2" />
            <stop offset=".42" stopColor="#E7C987" />
            <stop offset=".82" stopColor="#B48C4B" />
            <stop offset="1" stopColor="#7C5A2C" />
          </radialGradient>
          <radialGradient id="lupan-stud-lit" cx="36%" cy="30%" r="78%">
            <stop offset="0" stopColor="#FFFBEA" />
            <stop offset=".45" stopColor="#F6DB98" />
            <stop offset="1" stopColor="#C2913E" />
          </radialGradient>
          <radialGradient id="lupan-patina" cx="40%" cy="32%" r="80%">
            <stop offset="0" stopColor="#6E5432" />
            <stop offset=".6" stopColor="#47331B" />
            <stop offset="1" stopColor="#2C1F10" />
          </radialGradient>
          {/* Fine casting grain over the metal (the 颗粒感). */}
          <filter id="lupan-metal-grain" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed="11" result="grain" />
            <feColorMatrix in="grain" values="0 0 0 0 .2 0 0 0 0 .14 0 0 0 0 .05 0 0 0 .42 -.06" result="dark-grain" />
            <feComposite in="dark-grain" in2="SourceAlpha" operator="in" result="masked-grain" />
            <feBlend in="SourceGraphic" in2="masked-grain" mode="multiply" />
          </filter>
          {/* Letters cut into metal: a dark cut with a lit lower lip. */}
          <filter id="lupan-engrave" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feOffset in="SourceAlpha" dx="0" dy="1.1" result="lip" />
            <feFlood floodColor="#FFF1CC" floodOpacity=".55" />
            <feComposite in2="lip" operator="in" result="lit-lip" />
            <feMerge><feMergeNode in="lit-lip" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="lupan-ink-soft" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
        </defs>

        <circle className="lupan-disc-shadow" cx="300" cy="310" r="276" />
        <circle className="lupan-disc-edge" cx="300" cy="300" r="276" />
        <circle className="lupan-disc-knurl" cx="300" cy="300" r="268" />
        <circle className="lupan-disc-bevel" cx="300" cy="300" r="259" />
        <circle className="lupan-disc-face" cx="300" cy="300" r="253" />
        <g className="lupan-disc-lathe" aria-hidden="true">
          {Array.from({ length: 64 }, (_, ring) => <circle key={ring} cx="300" cy="300" r={60 + ring * 3} className={ring % 3 === 0 ? "is-dark" : ring % 3 === 1 ? "is-light" : ""} />)}
        </g>
        <circle className="lupan-disc-sheen" cx="300" cy="300" r="253" />
        <circle className="lupan-disc-etched" cx="300" cy="300" r="240" />
        <circle className="lupan-disc-etched-lip" cx="300" cy="300" r="241.2" />
        <circle className="lupan-disc-inner" cx="300" cy="300" r="226" />
        <circle className="lupan-disc-faint" cx="300" cy="300" r="184" />
        <circle className="lupan-disc-inner-rim" cx="300" cy="300" r="179" />

        <g className="lupan-pitch-ring" style={{ transform: `rotate(${-tonicPitchClass * 30}deg)` }}>
          {CHROMATIC_PITCH_NAMES.map((pitchName, pitchClass) => {
            const angle = (-90 + pitchClass * 30) * Math.PI / 180;
            const outer = { x: 300 + Math.cos(angle) * 239, y: 300 + Math.sin(angle) * 239 };
            const innerRadius = pitchClass % 3 === 0 ? 222 : 228;
            const inner = { x: 300 + Math.cos(angle) * innerRadius, y: 300 + Math.sin(angle) * innerRadius };
            const label = { x: 300 + Math.cos(angle) * 205, y: 300 + Math.sin(angle) * 205 };
            const isTonic = pitchClass === tonicPitchClass;
            const inspected = inspect?.kind === "pitch" && inspect.pitchClass === pitchClass;
            return <g key={pitchName}>
              <line className={`lupan-pitch-tick${pitchClass % 3 === 0 ? " is-major" : ""}`} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />
              <g
                className={`lupan-pitch-hit${inspected ? " is-inspected" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`音名 ${PITCH_NAME_READING[pitchName]}，点一下听它的音高并查看说明`}
                aria-pressed={inspected}
                onClick={() => onPlayPitch(pitchClass)}
                onKeyDown={(event) => activate(event, () => onPlayPitch(pitchClass))}
              >
                <circle className="lupan-pitch-plate" cx={label.x} cy={label.y} r="17" />
                <text
                  className={`lupan-pitch-name${isTonic ? " is-tonic" : ""}`}
                  x={label.x}
                  y={label.y}
                  transform={`rotate(${tonicPitchClass * 30} ${label.x} ${label.y})`}
                >{pitchName}</text>
              </g>
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

        <g
          className={`lupan-wheel-hub${inspect?.kind === "hub" ? " is-inspected" : ""}`}
          role="button"
          tabIndex={0}
          aria-label={`盘心：宫音 1=${currentKey}，查看说明`}
          aria-pressed={inspect?.kind === "hub"}
          onClick={onInspectHub}
          onKeyDown={(event) => activate(event, onInspectHub)}
        >
          <circle className="lupan-hub-ring" cx="300" cy="300" r="62" />
          <circle className="lupan-hub" cx="300" cy="300" r="57" />
          <circle className="lupan-hub-inner" cx="300" cy="300" r="49" />
          <text className="lupan-hub-main" x="300" y="286">宫</text>
          <text className="lupan-hub-key" x="300" y="311">1={currentKey}</text>
          <text className="lupan-hub-sub" x="300" y="331">宫音基准</text>
        </g>

        <g className="lupan-scale-notes">
          {notes.map((note, index) => {
            const point = positions[index];
            const pitchClass = normalizePitchClass(tonicPitchClass + note.semitone);
            const pitchName = CHROMATIC_PITCH_NAMES[pitchClass];
            const sounding = activePitchClasses.includes(pitchClass);
            const inspected = inspect?.kind === "note" && inspect.name === note.name;
            const ariaLabel = `${note.name}，${pitchName}，${note.altered ? "偏音" : "正声"}，简谱 ${note.degree}${note.altered ? "，拓展知识" : ""}`;
            return <g
              key={`${stampVersion}-${scale}-${note.name}`}
              className={`lupan-scale-note${note.altered ? " is-altered" : ""}${sounding ? " is-sounding" : ""}${inspected ? " is-inspected" : ""}`}
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

export function LabPage({ graph, books, stage, onStageChange, onOpenWork }: {
  graph: CanonicalGraph;
  books: BookDirectory[];
  stage: BookStage;
  onStageChange: (stage: BookStage) => void;
  onOpenWork: (work: string) => void;
}) {
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
  const [selectedBookKey, setSelectedBookKey] = useState("");
  const [workPlaying, setWorkPlaying] = useState(false);
  const [inspect, setInspect] = useState<Inspect>(null);
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

  const stageBooks = useMemo(() => booksForStage(books, stage), [books, stage]);
  const stageBookKeys = useMemo(() => new Set(stageBooks.map((book) => book.key)), [stageBooks]);
  const works = useMemo(() => findPentatonicWorks(graph)
    .filter(({ work }) => (work.bookKeys ?? []).some((key) => stageBookKeys.has(key))
      && (!selectedBookKey || work.bookKeys?.includes(selectedBookKey)))
    .slice(0, 8), [graph, selectedBookKey, stageBookKeys]);
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
    setInspect({ kind: "note", name: note.name });
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

  const playPitch = useCallback((pitchClass: number) => {
    setInspect({ kind: "pitch", pitchClass });
    if (loading) return;
    const semitone = normalizePitchClass(pitchClass - tonicPitchClass);
    const index = PENTATONIC.findIndex((note) => note.semitone === semitone);
    void playSequence([{ index: index < 0 ? null : index, midi: 60 + pitchClass }], {
      kind: "single",
      title: `音名 ${PITCH_NAME_READING[CHROMATIC_PITCH_NAMES[pitchClass]]}`,
    });
  }, [loading, playSequence, tonicPitchClass]);

  const inspectHub = useCallback(() => {
    setInspect({ kind: "hub" });
    if (loading) return;
    void playSequence([{ index: 0, midi: tonicMidi }], { kind: "single", title: `宫音（${CHROMATIC_PITCH_NAMES[tonicPitchClass]}）` });
  }, [loading, playSequence, tonicMidi, tonicPitchClass]);

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

  /** The right-hand explanation card for whatever was last clicked on the dial. */
  const renderInspectCard = () => {
    if (!inspect) {
      return <div className="lupan-card lupan-card-idle" key="idle">
        <p className="lupan-card-kicker">点盘上的音</p>
        <h2 className="lupan-card-title">看看它是谁</h2>
        <p className="lupan-card-text">盘上的宫、商、角、徵、羽，外圈的音名，还有盘心，都可以点。</p>
      </div>;
    }
    if (inspect.kind === "hub") {
      return <div className="lupan-card" key={`hub-${tonicPitchClass}`}>
        <p className="lupan-card-kicker">盘心</p>
        <h2 className="lupan-card-title">宫音 <span>1={keyName}</span></h2>
        <p className="lupan-card-text">宫音是一个调的基准。现在宫落在 {keyName} 上，所以记作 1={keyName}。</p>
        <dl className="lupan-card-facts">
          <div><dt>换宫</dt><dd>拖动外圈，或点下方 ＋ −，整串音一起移动，这就是“移宫”。</dd></div>
          <div><dt>当前音阶</dt><dd>{scaleTitle}，共 {scaleNotes.length} 个音。</dd></div>
        </dl>
      </div>;
    }
    if (inspect.kind === "pitch") {
      const pitchName = CHROMATIC_PITCH_NAMES[inspect.pitchClass];
      const semitone = normalizePitchClass(inspect.pitchClass - tonicPitchClass);
      const inScale = scaleNotes.find((note) => note.semitone === semitone);
      return <div className="lupan-card" key={`pitch-${inspect.pitchClass}-${tonicPitchClass}-${scale}`}>
        <p className="lupan-card-kicker">外圈 · 音名</p>
        <h2 className="lupan-card-title">{pitchName} <span>{PITCH_NAME_READING[pitchName]}</span></h2>
        <p className="lupan-card-text">音名是固定的音高名称，不随调改变。外圈一圈是十二个半音。</p>
        <dl className="lupan-card-facts">
          <div><dt>在 1={keyName} 里</dt><dd>{inScale
            ? <>它是 <b>{inScale.name}</b>（简谱 {inScale.degree}）{inScale.altered ? "，属于偏音" : ""}。</>
            : `它不在当前的${scaleTitle}音阶里。`}</dd></div>
          <div><dt>试一试</dt><dd>把外圈转到让 {pitchName} 对准顶端红点，它就成了新的宫音。</dd></div>
        </dl>
      </div>;
    }
    const note = scaleNotes.find((item) => item.name === inspect.name);
    const info = DIAL_NOTE_INFO[inspect.name];
    if (!note || !info) return null;
    const pitchClass = normalizePitchClass(tonicPitchClass + note.semitone);
    return <div className={`lupan-card${info.extension ? " is-extension" : ""}`} key={`note-${note.name}-${tonicPitchClass}`}>
      <p className="lupan-card-kicker">{info.extension ? "偏音 · 拓展知识" : "五声 · 正声"}</p>
      <h2 className="lupan-card-title">{note.name} <span>{info.pinyin}</span></h2>
      <p className="lupan-card-badges"><b>简谱 {note.degree}</b><b>{note.solfege}</b><b>此刻在 {CHROMATIC_PITCH_NAMES[pitchClass]}</b></p>
      <p className="lupan-card-text">{info.what}</p>
      <dl className="lupan-card-facts">
        <div><dt>与宫的距离</dt><dd>{info.interval}</dd></div>
      </dl>
      {!info.extension && works.length > 0 && <div className="lupan-card-works">
        <p>教材里的五声作品</p>
        <ul>{works.slice(0, 3).map(({ work }) => <li key={work.id}>
          <button type="button" onClick={() => onOpenWork(bareWorkName(work.name))}>《{bareWorkName(work.name)}》</button>
        </li>)}</ul>
      </div>}
    </div>;
  };

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
      <p className="lupan-kicker">五声实验室</p>
      <h1 id="lupan-title">律盘</h1>
      <div className="lupan-current-key" aria-live="polite"><span>当前宫</span><b>{keyName}</b></div>
    </header>

    <section className="lupan-stage" aria-label="律盘练习">
      <aside className="lupan-stick-board" aria-label="选择音阶">
        <p className="lupan-side-lead">转动外圈换宫，<br />抽一支竹签换音阶。</p>
        <p className="lupan-stage-label">四支竹签</p>
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
          inspect={inspect}
          onPlayNote={playDialNote}
          onPlayPitch={playPitch}
          onInspectHub={inspectHub}
          onTranspose={moveTonic}
          onSetTonic={setTonic}
          onBeginDrag={beginDialDrag}
        />
      </div>

      <aside className="lupan-inspector" aria-live="polite" aria-label="说明">
        {renderInspectCard()}
      </aside>
    </section>

    <section className="lupan-tape-row" aria-label="律盘走句">
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
        <p className="lupan-guide-note">十二半音位按平均律示范；七声部分属于拓展知识。</p>
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
        <p>作品与标注来自教材数据。<br />听旋律时，对应的五声键会亮起。</p>
      </div>
      {availableBookStages(books).length > 1 && <StageBookPicker
        allOption={{ key: "", label: "本学段全部" }}
        ariaLabel="按教材册别筛选"
        className="stage-book-picker--page"
        books={books}
        onSelectBook={setSelectedBookKey}
        onStageChange={onStageChange}
        selectedBookKey={selectedBookKey}
        stage={stage}
      />}
      <div className="lupan-works-grid">
        {works.map(({ work, evidence }) => {
          const melodies = MELODIES[work.name];
          const book = PUBLISHED_BOOK_SHORT_NAMES[work.bookKeys?.[0] ?? ""] ?? "教材";
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
        {!works.length && <p className="lupan-works-empty">教材数据中暂未找到五声调式标注。</p>}
      </div>
      <p className="lupan-works-foot"><span>作品与标注来自教材数据。</span><span>{works.length ? `${works.length} 首` : ""}</span></p>
    </section>

    <p className="lupan-credit">钢琴采样：<a href="https://archive.org/details/SalamanderGrandPianoV3" target="_blank" rel="noreferrer">Salamander Grand Piano</a> · Alexander Holm · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a></p>
  </section>;
}
