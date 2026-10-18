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
type ToneRoot = "宫" | "商" | "角" | "徵" | "羽";
/** What the explanation card is showing: a scale tone, a fixed pitch name on the outer ring, or the 宫 hub. */
type Inspect = { kind: "note"; name: string } | { kind: "pitch"; pitchClass: number } | { kind: "hub" } | null;
type Question = { answer: number; round: number; score: number; chosen: number | null; total: 3 | 5 };
type LearningProgress = { heard: boolean; played: boolean; challenged: boolean; explored: boolean };
type Voice = ReturnType<typeof playPianoSample>;
type ScaleNote = LupanPitch & { altered: boolean; solfege: string };
type PhraseNote = ScaleNote & { midi: number; noteIndex: number; octave: boolean };
type PlaybackNote = { midi: number; index: number | null; scoreIndex?: number };
type PlayOptions = { kind: "single" | "phrase" | "question"; title?: string };
type DragState = { angle: number; tonic: number; lastTonic: number };

let dialTickNoise: AudioBuffer | null = null;

function playDialDetents(count: number) {
  let context: AudioContext;
  try {
    context = getPianoAudioContext();
  } catch {
    return;
  }
  if (context.state !== "running") void context.resume().catch(() => {});

  const tickCount = Math.min(4, Math.max(0, Math.floor(count)));
  if (!tickCount) return;
  if (!dialTickNoise || dialTickNoise.sampleRate !== context.sampleRate) {
    const length = Math.ceil(context.sampleRate * .014);
    dialTickNoise = context.createBuffer(1, length, context.sampleRate);
    const samples = dialTickNoise.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      samples[index] = (Math.random() * 2 - 1) * (1 - index / length) ** 2.4;
    }
  }

  const origin = context.currentTime;
  for (let index = 0; index < tickCount; index += 1) {
    const at = origin + index * .024;
    const noise = context.createBufferSource();
    const highPass = context.createBiquadFilter();
    const noiseGain = context.createGain();
    noise.buffer = dialTickNoise;
    highPass.type = "highpass";
    highPass.frequency.setValueAtTime(2100, at);
    noiseGain.gain.setValueAtTime(.004, at);
    noiseGain.gain.exponentialRampToValueAtTime(.0001, at + .012);
    noise.connect(highPass).connect(noiseGain).connect(context.destination);
    noise.start(at);
    noise.stop(at + .014);

    for (const [frequency, volume] of [[1840, .014], [2790, .0045]] as const) {
      const tone = context.createOscillator();
      const toneGain = context.createGain();
      tone.type = "sine";
      tone.frequency.setValueAtTime(frequency, at);
      tone.frequency.exponentialRampToValueAtTime(frequency * .78, at + .024);
      toneGain.gain.setValueAtTime(.0001, at);
      toneGain.gain.exponentialRampToValueAtTime(volume, at + .001);
      toneGain.gain.exponentialRampToValueAtTime(.0001, at + .032);
      tone.connect(toneGain).connect(context.destination);
      tone.start(at);
      tone.stop(at + .034);
    }
  }
}

const MODES: Array<{ id: LabScale; title: string; subtitle: string; legend: string }> = [
  { id: "pentatonic", title: "五声", subtitle: "宫、商、角、徵、羽，沿着五个正声听一圈。", legend: "五正声" },
  { id: "qingyue", title: "清乐", subtitle: "在五正声间加入清角、变宫。", legend: "清角 · 变宫" },
  { id: "yayue", title: "雅乐", subtitle: "在五正声间加入变徵、变宫。", legend: "变徵 · 变宫" },
  { id: "yanyue", title: "燕乐", subtitle: "在五正声间加入清角、闰。", legend: "清角 · 闰" },
];
const TONE_ROOTS: ToneRoot[] = ["宫", "商", "角", "徵", "羽"];
const SCALE_DEGREES: Record<number, string> = {
  0: "1", 1: "♭2", 2: "2", 3: "♭3", 4: "3", 5: "4",
  6: "♯4", 7: "5", 8: "♭6", 9: "6", 10: "♭7", 11: "7",
};
const MOVABLE_SOLFEGE: Record<number, string> = {
  0: "do", 1: "ra", 2: "re", 3: "me", 4: "mi", 5: "fa",
  6: "fi", 7: "sol", 8: "le", 9: "la", 10: "te", 11: "ti",
};

function rotateScaleToRoot(notes: readonly ScaleNote[], root: ToneRoot): ScaleNote[] {
  const rootNote = notes.find((note) => note.name === root);
  if (!rootNote) return [...notes];
  return notes.map((note) => {
    const semitone = normalizePitchClass(note.semitone - rootNote.semitone);
    return {
      ...note,
      semitone,
      degree: SCALE_DEGREES[semitone],
      solfege: MOVABLE_SOLFEGE[semitone],
    };
  }).sort((left, right) => left.semitone - right.semitone);
}

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
  modeRoot,
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
  onDialTick,
}: {
  wheelRef: RefObject<SVGSVGElement | null>;
  scale: LabScale;
  modeRoot: ToneRoot;
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
  onDialTick: (count: number) => void;
}) {
  const activate = (event: ReactKeyboardEvent<SVGGElement>, action: () => void) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    action();
  };
  const dragRef = useRef<DragState | null>(null);
  const modeTitle = `${MODES.find((mode) => mode.id === scale)?.title ?? "五声"} · ${modeRoot}调式`;
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
    dragRef.current = { angle: pointerAngle(event), tonic: tonicPitchClass, lastTonic: tonicPitchClass };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<SVGCircleElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = wrapAngle(pointerAngle(event) - drag.angle);
    const nextTonic = transposeTonicFromDrag(drag.tonic, delta);
    if (nextTonic !== drag.lastTonic) {
      const semitones = normalizePitchClass(nextTonic - drag.lastTonic);
      onDialTick(Math.min(semitones, 12 - semitones));
      drag.lastTonic = nextTonic;
    }
    onSetTonic(nextTonic);
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
      {/* Static bronze body on its own layer: painted once, so hovering the studs above never re-runs the surface texture. */}
      <svg className="lupan-dial-bg" viewBox="0 0 600 600" aria-hidden="true" focusable="false">
        <defs>
          {/* Cast bronze face with fine casting grain. */}
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
          <filter id="lupan-metal-grain" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="3" seed="11" result="grain" />
            <feColorMatrix in="grain" values="0 0 0 0 .2 0 0 0 0 .14 0 0 0 0 .05 0 0 0 .3 -.08" result="dark-grain" />
            <feComposite in="dark-grain" in2="SourceAlpha" operator="in" result="masked-grain" />
            <feBlend in="SourceGraphic" in2="masked-grain" mode="multiply" />
          </filter>
          <filter id="lupan-shadow-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>

        <circle className="lupan-disc-shadow" filter="url(#lupan-shadow-soft)" cx="300" cy="310" r="276" />
        <circle className="lupan-disc-edge" cx="300" cy="300" r="276" />
        <circle className="lupan-disc-knurl" cx="300" cy="300" r="268" />
        <circle className="lupan-disc-bevel" cx="300" cy="300" r="259" />
        <circle className="lupan-disc-face" cx="300" cy="300" r="253" />
        <g className="lupan-disc-lathe" aria-hidden="true">
          {Array.from({ length: 78 }, (_, ring) => <circle key={ring} cx="300" cy="300" r={60 + ring * 2.5} className={ring % 3 === 0 ? "is-dark" : ring % 3 === 1 ? "is-light" : ""} />)}
        </g>
        <circle className="lupan-disc-sheen" cx="300" cy="300" r="253" />
        <circle className="lupan-disc-etched" cx="300" cy="300" r="240" />
        <circle className="lupan-disc-etched-lip" cx="300" cy="300" r="241.2" />
        <circle className="lupan-disc-inner" cx="300" cy="300" r="226" />
        <circle className="lupan-disc-faint" cx="300" cy="300" r="184" />
        <circle className="lupan-disc-inner-rim" cx="300" cy="300" r="179" />

      </svg>
      <svg
        ref={wheelRef}
        className="lupan-dial"
        viewBox="0 0 600 600"
        role="group"
        tabIndex={-1}
        aria-label={`律盘，${modeTitle}，当前调式主音 1=${currentKey}`}
      >
        <defs>
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
          <filter id="lupan-ink-soft" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
        </defs>

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
                data-motion-ignore=""
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
          data-motion-ignore=""
          tabIndex={0}
          aria-label={`盘心：${modeRoot}调式，主音 1=${currentKey}，查看说明`}
          aria-pressed={inspect?.kind === "hub"}
          onClick={onInspectHub}
          onKeyDown={(event) => activate(event, onInspectHub)}
        >
          <circle className="lupan-hub-ring" cx="300" cy="300" r="62" />
          <circle className="lupan-hub-shadow" cx="300" cy="303" r="58" />
          <circle className="lupan-hub" cx="300" cy="300" r="57" />
          <circle className="lupan-hub-inner" cx="300" cy="300" r="49" />
          <text className="lupan-hub-main" x="300" y="286">{modeRoot}</text>
          <text className="lupan-hub-key" x="300" y="311">1={currentKey}</text>
          <text className="lupan-hub-sub" x="300" y="331">{modeRoot}调式</text>
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
              data-motion-ignore=""
              tabIndex={0}
              aria-label={ariaLabel}
              aria-current={sounding ? "true" : undefined}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                onPlayNote(note, pitchClass);
              }}
            >
              <g
                className={note.altered && stampVersion ? "lupan-stamp-motion is-dropping" : "lupan-stamp-motion"}
              >
                <circle className="lupan-note-shadow" cy="2.6" r="27.6" />
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
              <circle
                className="lupan-note-hit"
                r="35"
                aria-hidden="true"
                onClick={() => onPlayNote(note, pitchClass)}
              />
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
          data-motion-ignore=""
          tabIndex={0}
          aria-label={`律盘外圈，当前${modeRoot}调式主音 1=${currentKey}；拖动或按方向键移调`}
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={handleWheelKeys}
        />
      </svg>
    </div>
    <div className="lupan-turn-controls" aria-label="移调控制">
      <button type="button" aria-label="调式主音降低半音" onClick={() => onTranspose(-1)}>−</button>
      <span>轻拖外圈，或按 ↑ ↓ 移调</span>
      <button type="button" aria-label="调式主音升高半音" onClick={() => onTranspose(1)}>＋</button>
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
  onOpenWork: (work: string, bookKey?: string) => void;
}) {
  const [tonicPitchClass, setTonicPitchClass] = useState(0);
  const [scale, setScale] = useState<LabScale>("pentatonic");
  const [modeRoot, setModeRoot] = useState<ToneRoot>("宫");
  const [traceVersion, setTraceVersion] = useState(0);
  const [stampVersion, setStampVersion] = useState(0);
  const [activeKeys, setActiveKeys] = useState<number[]>([]);
  const [activePitchClasses, setActivePitchClasses] = useState<number[]>([]);
  const [scorePosition, setScorePosition] = useState(-1);
  const [pulse, setPulse] = useState(0);
  const [message, setMessage] = useState("点一个徽位，听听它的声音。");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [learningProgress, setLearningProgress] = useState<LearningProgress>({ heard: false, played: false, challenged: false, explored: false });
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
  const selectedMode = MODES.find((mode) => mode.id === scale) ?? MODES[0];
  const scaleTitle = selectedMode.title;
  const baseScaleNotes = useMemo<ScaleNote[]>(() => scale === "pentatonic"
    ? PENTATONIC.map((note) => ({ ...note, degree: String(note.degree), altered: false }))
    : HEPTATONIC_MODES[scale].notes.map((note) => ({ ...note })), [scale]);
  const modeRootSemitone = baseScaleNotes.find((note) => note.name === modeRoot)?.semitone ?? 0;
  const modeTonicPitchClass = normalizePitchClass(tonicPitchClass + modeRootSemitone);
  const tonicMidi = 60 + modeTonicPitchClass;
  const keyName = CHROMATIC_PITCH_NAMES[modeTonicPitchClass];
  const gongKeyName = CHROMATIC_PITCH_NAMES[tonicPitchClass];
  const displayKey = workPlaying && selectedMelody ? selectedMelody.key : `1=${keyName}`;
  const learningSteps = [
    { id: "played", label: "按一按", complete: learningProgress.played },
    { id: "heard", label: "听一听", complete: learningProgress.heard },
    { id: "challenged", label: "听音挑战", complete: learningProgress.challenged },
    { id: "explored", label: "作品里找", complete: learningProgress.explored },
  ];
  const lessonComplete = learningSteps.every((step) => step.complete);

  const scaleNotes = useMemo(() => rotateScaleToRoot(baseScaleNotes, modeRoot), [baseScaleNotes, modeRoot]);
  const scoreNotes = useMemo<PhraseNote[]>(() => makeLupanPhrase(
    scaleNotes,
    tonicMidi,
    scale === "pentatonic",
  ), [scale, scaleNotes, tonicMidi]);
  const demoNotes = useMemo(() => scoreNotes.slice(0, scaleNotes.length), [scaleNotes.length, scoreNotes]);

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
  }, [scorePosition, demoNotes.length]);

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
      else if (options.kind === "phrase") setMessage(`正在播放：${label}。`);
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
      ? `答对了，是${scaleNotes[index].name}。`
      : `正确答案是${scaleNotes[question.answer].name}（简谱 ${scaleNotes[question.answer].degree}）。`);
    return true;
  }, [question, scaleNotes]);

  const playKey = useCallback((index: number) => {
    if (loading) return;
    if (question?.chosen === null && answerQuestion(index)) return;
    setLearningProgress((progress) => ({ ...progress, played: true }));
    const note = scaleNotes[index];
    if (!note) return;
    void playSequence([{ index, midi: tonicMidi + note.semitone }], { kind: "single", title: note.name });
  }, [answerQuestion, loading, playSequence, question, scaleNotes, tonicMidi]);

  const playDialNote = useCallback((note: ScaleNote, pitchClass: number) => {
    setInspect({ kind: "note", name: note.name });
    if (loading) return;
    if (question?.chosen === null) {
      const index = scaleNotes.findIndex((scaleNote) => scaleNote.name === note.name);
      if (index < 0) {
        setMessage(`这不在当前${scaleTitle}音阶里，请在上方按键中作答。`);
        return;
      }
      if (answerQuestion(index)) return;
    }
    const index = scaleNotes.findIndex((scaleNote) => scaleNote.name === note.name);
    void playSequence([{ index: index < 0 ? null : index, midi: tonicMidi + note.semitone }], {
      kind: "single",
      title: `${note.name}（${CHROMATIC_PITCH_NAMES[pitchClass]}）`,
    });
  }, [answerQuestion, loading, playSequence, question, scaleNotes, scaleTitle, tonicMidi]);

  const playPitch = useCallback((pitchClass: number) => {
    setInspect({ kind: "pitch", pitchClass });
    if (loading) return;
    const semitone = normalizePitchClass(pitchClass - modeTonicPitchClass);
    const index = scaleNotes.findIndex((note) => note.semitone === semitone);
    void playSequence([{ index: index < 0 ? null : index, midi: 60 + pitchClass }], {
      kind: "single",
      title: `音名 ${PITCH_NAME_READING[CHROMATIC_PITCH_NAMES[pitchClass]]}`,
    });
  }, [loading, modeTonicPitchClass, playSequence, scaleNotes]);

  const inspectHub = useCallback(() => {
    setInspect({ kind: "hub" });
    if (loading) return;
    void playSequence([{ index: 0, midi: tonicMidi }], { kind: "single", title: `${modeRoot}调式主音（${keyName}）` });
  }, [keyName, loading, modeRoot, playSequence, tonicMidi]);

  const clearQuestion = useCallback(() => {
    setQuestion(null);
    setMessage("已回到自由试听。");
  }, []);

  const moveTonic = useCallback((steps: number) => {
    if (!steps) return;
    playDialDetents(Math.abs(steps));
    stopLab();
    window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED));
    setQuestion(null);
    setTonicPitchClass((current) => normalizePitchClass(current + steps));
    setMessage(`${modeRoot}调式主音已移动，听听音高怎样改变。`);
  }, [modeRoot, stopLab]);

  const setTonic = useCallback((pitchClass: number) => {
    setTonicPitchClass(normalizePitchClass(pitchClass - modeRootSemitone));
  }, [modeRootSemitone]);

  const beginDialDrag = useCallback(() => {
    try {
      const context = getPianoAudioContext();
      if (context.state !== "running") void context.resume().catch(() => {});
    } catch {
      // Keep pointer dragging available when Web Audio is unavailable.
    }
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
      ? "已选择五声音阶，听一听宫、商、角、徵、羽。"
      : `已选择${HEPTATONIC_MODES[nextScale].name}音阶。朱砂色印记标出偏音，属于拓展知识。`);
  }, [scale, stopLab]);

  const chooseModeRoot = useCallback((nextRoot: ToneRoot) => {
    if (nextRoot === modeRoot) return;
    stopLab();
    window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED));
    setModeRoot(nextRoot);
    setQuestion(null);
    setTraceVersion((value) => value + 1);
    setMessage(`已切换到${nextRoot}调式，律盘、按键和听音挑战都会以${nextRoot}为主音。`);
  }, [modeRoot, stopLab]);

  const playPhrase = useCallback(() => {
    setQuestion(null);
    setLearningProgress((progress) => ({ ...progress, heard: true }));
    const phrase: PlaybackNote[] = demoNotes.map((note, scoreIndex) => ({
      midi: note.midi,
      index: scaleNotes.findIndex((scaleNote) => scaleNote.semitone === note.semitone),
      scoreIndex,
    })).map((note) => ({ ...note, index: note.index < 0 ? null : note.index }));
    void playSequence(phrase, { kind: "phrase", title: `${scaleTitle} · ${modeRoot}调式上行示范` });
  }, [demoNotes, modeRoot, playSequence, scaleNotes, scaleTitle]);

  const startQuestion = useCallback((round: number, score: number, total: 3 | 5) => {
    const answer = Math.floor(Math.random() * scaleNotes.length);
    const note = scaleNotes[answer];
    setQuestion({ answer, round, score, chosen: null, total });
    setMessage(`第 ${round} / ${total} 题。听一遍，再按${scaleTitle}的按键作答。`);
    void playSequence([{ index: answer, midi: tonicMidi + note.semitone }], { kind: "question" });
  }, [playSequence, scaleNotes, scaleTitle, tonicMidi]);

  const startQuiz = useCallback((total: 3 | 5) => {
    setQuestion(null);
    startQuestion(1, 0, total);
    revealLabTarget(keyboardRef.current);
  }, [startQuestion]);

  const nextQuestion = useCallback(() => {
    if (!question || question.chosen === null) return;
    if (question.chosen === -1) return;
    if (question.round >= question.total) {
      setMessage(`挑战完成，答对 ${question.score} / ${question.total} 题。`);
      setQuestion({ ...question, chosen: -1 });
      setLearningProgress((progress) => ({ ...progress, challenged: true }));
      return;
    }
    startQuestion(question.round + 1, question.score, question.total);
  }, [question, startQuestion]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, select, textarea, [contenteditable=true]")) return;
      const index = scaleNotes.findIndex((_, noteIndex) => String(noteIndex + 1) === event.key);
      if (index < 0) return;
      event.preventDefault();
      playKey(index);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playKey, scaleNotes]);

  const soundingNotes = useCallback((notes: number[], playing: boolean) => {
    setWorkPlaying(playing);
    if (notes.length) setLearningProgress((progress) => ({ ...progress, explored: true }));
    const tonic = selectedMelody?.tonicMidi ?? tonicMidi;
    setActiveKeys([...new Set(notes.flatMap((midi) => {
      const semitone = normalizePitchClass(midi - tonic);
      const index = scaleNotes.findIndex((note) => note.semitone === semitone);
      return index < 0 ? [] : [index];
    }))]);
    setActivePitchClasses([...new Set(notes.map(normalizePitchClass))]);
    if (notes.length) setPulse((value) => value + 1);
  }, [scaleNotes, selectedMelody, tonicMidi]);

  /** The right-hand explanation card for whatever was last clicked on the dial. */
  const renderInspectCard = () => {
    if (!inspect) return null;
    if (inspect.kind === "hub") {
      return <div className="lupan-card" key={`hub-${tonicPitchClass}`}>
        <p className="lupan-card-kicker">盘心</p>
        <h2 className="lupan-card-title">{modeRoot}调式 <span>1={keyName}</span></h2>
        <p className="lupan-card-text">调式主音是 {keyName}。现在是{modeRoot}调式；这一组音的宫音在 {gongKeyName}，转动律盘会把整组音一起移调。</p>
        <dl className="lupan-card-facts">
          <div><dt>调式主音</dt><dd>{modeRoot}音为主音，记作 1={keyName}。</dd></div>
          <div><dt>当前音阶</dt><dd>{scaleTitle}，共 {scaleNotes.length} 个音；键盘、示范和听音挑战使用同一组音。</dd></div>
        </dl>
      </div>;
    }
    if (inspect.kind === "pitch") {
      const pitchName = CHROMATIC_PITCH_NAMES[inspect.pitchClass];
      const semitone = normalizePitchClass(inspect.pitchClass - modeTonicPitchClass);
      const inScale = scaleNotes.find((note) => note.semitone === semitone);
      return <div className="lupan-card" key={`pitch-${inspect.pitchClass}-${modeTonicPitchClass}-${scale}-${modeRoot}`}>
        <p className="lupan-card-kicker">外圈 · 音名</p>
        <h2 className="lupan-card-title">{pitchName} <span>{PITCH_NAME_READING[pitchName]}</span></h2>
        <p className="lupan-card-text">音名是固定的音高名称，不随调改变。外圈一圈是十二个半音。</p>
        <dl className="lupan-card-facts">
          <div><dt>在{modeRoot}调式里</dt><dd>{inScale
            ? <>它是 <b>{inScale.name}</b>（简谱 {inScale.degree}）{inScale.altered ? "，属于偏音" : ""}。</>
            : `它不在当前${scaleTitle}音阶里。`}</dd></div>
          <div><dt>试一试</dt><dd>把外圈转到让 {pitchName} 对准顶端红点，它就成了新的调式主音。</dd></div>
        </dl>
      </div>;
    }
    const note = scaleNotes.find((item) => item.name === inspect.name);
    const info = DIAL_NOTE_INFO[inspect.name];
    if (!note || !info) return null;
    const pitchClass = normalizePitchClass(modeTonicPitchClass + note.semitone);
    return <div className={`lupan-card${info.extension ? " is-extension" : ""}`} key={`note-${note.name}-${modeTonicPitchClass}-${modeRoot}`}>
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
          <button type="button" onClick={() => onOpenWork(bareWorkName(work.name), selectedBookKey || work.bookKeys?.[0])}>《{bareWorkName(work.name)}》</button>
        </li>)}</ul>
      </div>}
    </div>;
  };

  useEffect(() => {
    if (!inspect) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setInspect(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inspect]);

  const finishOrRepeatQuiz = () => {
    if (!question) return;
    if (question.chosen === -1) {
      startQuiz(question.total);
      return;
    }
    nextQuestion();
  };

  return <section className="lupan-lab" aria-labelledby="lupan-title">
    <header className="lupan-intro">
      <p className="lupan-kicker">五声律坊</p>
      <h2 id="lupan-title">律盘</h2>
      <div className="lupan-current-key" aria-live="polite"><span>当前{modeRoot}调式主音</span><b>{keyName}</b></div>
    </header>

    <section className="lupan-stage" aria-label="律盘练习">
      <aside className="lupan-stick-board" aria-label="选择音阶">
        <p className="lupan-side-lead">以耳朵认识五声，<br /><span>再从不同正声出发</span><span>听调式。</span></p>
        <p className="lupan-stage-label">当前音阶</p>
        <div className="lupan-current-scale-card">
          <b>{scaleTitle}</b>
          <span>{selectedMode.subtitle}</span>
          <small>{modeRoot}调式 · 主音 {keyName}</small>
        </div>
        <p className="lupan-bamboo-legend"><b>转动律盘</b><span>把当前调式整体移到新的音高。</span></p>
      </aside>

      <div className="lupan-center-column">
        <LupanWheel
          wheelRef={wheelRef}
          scale={scale}
          modeRoot={modeRoot}
          notes={scaleNotes}
          tonicPitchClass={modeTonicPitchClass}
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
          onDialTick={playDialDetents}
        />
      </div>

      {inspect && <aside className="lupan-inspector" aria-live="polite" aria-label="说明">
        <button type="button" className="lupan-card-close" aria-label="关闭说明" onClick={() => setInspect(null)}>×</button>
        {renderInspectCard()}
      </aside>}
    </section>

    <section className="lupan-learning-overview" aria-label="今天的学习任务">
      <div className="lupan-learning-copy">
        <p className="lupan-kicker">今天的音乐小任务</p>
        <h2>用耳朵认识{scaleNotes.length}个音</h2>
        <p>先按一按，再听一听音阶顺序，接着挑战一下，最后去熟悉的歌里找找看。</p>
      </div>
      <ol className="lupan-learning-progress">
        {learningSteps.map((step, index) => <li className={step.complete ? "is-complete" : ""} key={step.id}>
          <span className="lupan-progress-number">0{index + 1}</span>
          <span>{step.label}</span>
          <span className="lupan-progress-state">{step.complete ? "已完成" : "待完成"}</span>
        </li>)}
      </ol>
    </section>

    <section className="lupan-sound-panel" aria-label="按键练习和听音挑战">
      <div className="lupan-keys-and-actions">
        <div className="lupan-step-heading">
          <span className="lupan-step-number">01</span>
          <div><p className="lupan-step-caption">第一步 · 按一按</p><h2 id="lupan-sound-title">自己试着弹{scaleTitle}音阶</h2><p>先选择音阶和调式主音，再逐个试听，感受音与音之间的距离。</p></div>
          {learningProgress.played && <span className="lupan-step-done">完成</span>}
        </div>
        <div className="lupan-scale-options" role="group" aria-label="选择音阶类型">
          <span className="lupan-choice-label">音阶</span>
          <div className="lupan-scale-option-list">
            {MODES.map((item) => <button
              key={item.id}
              type="button"
              className={`lupan-scale-option${scale === item.id ? " is-selected" : ""}`}
              aria-pressed={scale === item.id}
              onClick={() => chooseScale(item.id)}
            >
              <b>{item.title}</b><small>{item.legend}</small>
            </button>)}
          </div>
        </div>
        <div className="lupan-root-options" role="group" aria-label="选择调式主音">
          <span className="lupan-choice-label">调式主音</span>
          <div className="lupan-root-option-list">
            {TONE_ROOTS.map((root) => <button
              key={root}
              type="button"
              className={`lupan-root-option${modeRoot === root ? " is-selected" : ""}`}
              aria-pressed={modeRoot === root}
              onClick={() => chooseModeRoot(root)}
            ><b>{root}</b><span>{root}调式</span></button>)}
          </div>
          <p>同一组音从不同正声开始，会形成不同的调式。律盘中心当前显示：{modeRoot}调式。</p>
        </div>
        <div className="lupan-five-keys" ref={keyboardRef} role="group" aria-label={`${scaleTitle}${modeRoot}调式按键，${displayKey}`} aria-busy={loading}>
          {scaleNotes.map((note, index) => <button
            key={note.name}
            type="button"
            className={`lupan-five-key${index === 0 ? " is-main" : ""}${activeKeys.includes(index) ? " is-sounding" : ""}${question?.chosen === index ? index === question.answer ? " is-correct" : " is-wrong" : ""}`}
            aria-label={`${note.name}，${note.solfege}，简谱 ${note.degree}，${displayKey}${index === 0 ? `，${modeRoot}调式主音` : ""}，键盘快捷键 ${index + 1}`}
            onClick={() => playKey(index)}
          >
            <span className="lupan-key-degree">{note.degree}</span>
            <strong>{note.name}</strong>
            <small>{note.solfege}</small>
            {activeKeys.includes(index) && <span key={pulse} className="lupan-key-ripple" aria-hidden="true" />}
          </button>)}
        </div>
        <div className="lupan-sound-row-actions">
          <button type="button" disabled={loading} onClick={() => {
            setQuestion(null);
            setLearningProgress((progress) => ({ ...progress, played: true }));
            const phrase = scoreNotes.map((note) => ({ midi: note.midi, index: note.noteIndex }));
            void playSequence(phrase, { kind: "phrase", title: `${modeRoot}调式上行再下行` });
          }}>上行再下行</button>
          <span>{modeRoot}调式 · {scaleNotes.length} 个音 · 按键 1–{scaleNotes.length} 可试听</span>
        </div>
      </div>

      <aside className="lupan-quiz" aria-labelledby="lupan-quiz-title">
        <div className="lupan-step-heading lupan-quiz-heading">
          <span className="lupan-step-number">03</span>
          <div><p className="lupan-step-caption">第三步 · 挑战一下</p>
        <h3 id="lupan-quiz-title">听音找键</h3>
          </div>
          {learningProgress.challenged && <span className="lupan-step-done">完成</span>}
        </div>
        <p aria-live="polite" className="lupan-quiz-message">{question
          ? question.chosen === null
            ? `第 ${question.round} / ${question.total} 题。听一遍，再按左边对应的${scaleTitle}键。`
            : question.chosen === -1
              ? `挑战完成，答对 ${question.score} / ${question.total} 题。`
              : question.chosen === question.answer
                ? `答对了，是${scaleNotes[question.answer].name}。`
                : `正确答案是${scaleNotes[question.answer].name}（简谱 ${scaleNotes[question.answer].degree}）。`
          : `听一个音，再点上方对应的按键。挑战范围：${scaleTitle} · ${modeRoot}调式。`}</p>
        <div className="lupan-quiz-actions">
          {!question && <>
            <button type="button" disabled={loading} onClick={() => startQuiz(3)}>开始三题挑战</button>
            <button type="button" className="is-secondary" disabled={loading} onClick={() => startQuiz(5)}>进阶五题</button>
          </>}
          {question?.chosen === null && <>
            <button type="button" disabled={loading} onClick={() => void playSequence([{ index: question.answer, midi: tonicMidi + scaleNotes[question.answer].semitone }], { kind: "question" })}>再听一次</button>
            <button type="button" className="is-secondary" onClick={clearQuestion}>结束挑战</button>
          </>}
          {question && question.chosen !== null && question.chosen !== -1 && <button type="button" disabled={loading} onClick={finishOrRepeatQuiz}>
            {question.round === question.total ? "看看结果" : "下一题"}
          </button>}
          {question?.chosen === -1 && <>
            <button type="button" disabled={loading} onClick={finishOrRepeatQuiz}>再玩一次</button>
            <button type="button" className="is-secondary" onClick={clearQuestion}>自由试弹</button>
          </>}
        </div>
      </aside>
      <p className="lupan-live-message" role="status" aria-live="polite">{message}</p>
    </section>

    <section className="lupan-tape-row lupan-lesson-step" aria-labelledby="lupan-listen-title">
      <div className="lupan-step-heading">
        <span className="lupan-step-number">02</span>
        <div><p className="lupan-step-caption">第二步 · 听一听</p><h3 id="lupan-listen-title">听见{scaleTitle}的顺序</h3><p>看简谱和律盘同步亮起，听听音高怎样一步步变化。</p></div>
        {learningProgress.heard && <span className="lupan-step-done">完成</span>}
      </div>
        <section className="lupan-score-tape" aria-label="自编简谱示例">
          <div className="lupan-score-head"><span>跟着音符看律盘</span><strong>{scaleTitle} · {modeRoot}调式上行</strong></div>
          <div className="lupan-score-view" ref={scoreWindowRef}>
            <span className="lupan-score-playhead" aria-hidden="true" />
            <ol
              ref={scoreTrackRef}
              className={`lupan-score-track${scorePosition >= 0 ? " is-following" : ""}`}
              aria-label={`${scaleTitle}上行简谱示范`}
            >
              {demoNotes.map((note, index) => <li
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
            <button type="button" disabled={loading} onClick={playPhrase}>听一遍</button>
            <span>{demoNotes.length} 个音依次亮起</span>
            <button type="button" className="is-stop" onClick={() => { stopLab(); window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED)); setMessage("已停止。"); }}>停止</button>
          </div>
        </section>
        <details className="lupan-extension-note"><summary>进阶知识</summary><p>外圈十二个音位按平均律排列；清乐、雅乐和燕乐中的七声音阶可继续拓展探索。</p></details>
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
        <div className="lupan-step-heading">
          <span className="lupan-step-number">04</span>
          <div><p className="lupan-step-caption">第四步 · 去作品里找</p><h2 id="lupan-works-title">熟悉的歌里也藏着五声</h2><p>听一段旋律，看看律盘上哪些音会亮起来。</p></div>
          {learningProgress.explored && <span className="lupan-step-done">完成</span>}
        </div>
        <p>可以按教材册别筛选，找到课上听过的作品。</p>
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
            <div className="lupan-work-actions">
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
              >▷ 听一听</button>}
              <button type="button" className="lupan-work-open" onClick={() => { setLearningProgress((progress) => ({ ...progress, explored: true })); onOpenWork(bareWorkName(work.name), selectedBookKey || work.bookKeys?.[0]); }} aria-label={`在按课学习中打开《${bareWorkName(work.name)}》`}>去学习 →</button>
            </div>
          </article>;
        })}
        {!works.length && <p className="lupan-works-empty">教材数据中暂未找到五声调式标注。</p>}
      </div>
      <p className="lupan-works-foot"><span>点开一首试听，观察宫、商、角、徵、羽怎样出现在旋律里。</span><span>{works.length ? `${works.length} 首` : ""}</span></p>
    </section>

    {lessonComplete && <aside className="lupan-completion-card" role="status">
      <span className="lupan-completion-mark" aria-hidden="true">♪</span>
      <div><p className="lupan-step-caption">今天的探索完成啦</p><h3>你已经听过、弹过，也在作品里找到五声。</h3></div>
      <button type="button" disabled={loading} onClick={playPhrase}>再听一遍{modeRoot}调式</button>
    </aside>}

    <p className="lupan-credit">钢琴采样：<a href="https://archive.org/details/SalamanderGrandPianoV3" target="_blank" rel="noreferrer">Salamander Grand Piano</a> · Alexander Holm · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a></p>
  </section>;
}
