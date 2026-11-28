"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { displayMeter, midiOf, notation } from "../../lib/lesson/melodies";
import type { Melody, MelodyNote } from "../../lib/lesson/melodies";
import { getPianoAudioContext } from "../../lib/lesson/piano-sampler";
import { INSTRUMENTS, loadInstrumentSampler, playInstrumentSample } from "../../lib/lesson/instrument-sampler";
import type { InstrumentId, InstrumentSampler, PartColor } from "../../lib/lesson/instrument-sampler";
import { MELODY_PLAYBACK_STARTED, VOCAL_PLAYBACK_STARTED } from "../../lib/lesson/recordings";
import { SlidingIndicator } from "../graph/SlidingIndicator";
import { MelodyLine } from "./MelodyLine";
import { StaffNotation, type MelodyLineData } from "./StaffNotation";
import { splitPhrases, type PhraseMode } from "../../lib/lesson/phrases";
import { findVocal, vocalCredit, type Vocal } from "../../lib/lesson/vocal";
import { loadPercussionStrokes, percussionKind, playPercussion } from "../../lib/lesson/percussion";
import { sharedAssetUrl } from "../../lib/app/assets";
import { ACC_STYLES, accompaniment, type AccStyle } from "../../lib/lesson/accompany";
import { barBeatSpans, countInBeatsOf, normalizeLoopRange, transposedKeyLabel, VOCAL_RATES, type VocalRate } from "../../lib/lesson/classroom-helpers";

type Line = { label: string; bars: MelodyNote[][] };
type BeamRun = { start: number; end: number; level: number };
type BeamFragment = { level: number; edge: "start" | "middle" | "end" | "single" };

const UNDERLINE_TOP = 1.42;
const UNDERLINE_GAP = 0.16;

/** Low octave dots sit below this note's diminution lines, as in the textbook. */
function lowDotTop(note: MelodyNote) {
  const { lines } = notation(note);
  return lines ? UNDERLINE_TOP + (lines - 1) * UNDERLINE_GAP + 0.15 : 1.48;
}

function noteHeadHeight(notes: MelodyNote[]) {
  return Math.max(1.72, ...notes.map((note) => {
    const lowDots = Math.max(0, -(note.o ?? 0));
    if (lowDots) return lowDotTop(note) + 0.13 + (lowDots - 1) * 0.2 + 0.08;
    const { lines } = notation(note);
    return lines ? UNDERLINE_TOP + (lines - 1) * UNDERLINE_GAP + 0.14 : 1.5;
  }));
}

/** Simplified-notation beams stay inside the metrical group, never across a bar line. */
function getBeamRuns(notes: MelodyNote[], meter: string): BeamRun[] {
  if (!notes.length || meter.includes("散")) return [];
  const signatures = [...meter.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map((match) => ({
    numerator: Number(match[1]),
    denominator: Number(match[2]),
  }));
  if (!signatures.length) return [];

  const total = notes.reduce((sum, note) => sum + note.b, 0);
  const signature = signatures.find(({ numerator, denominator }) => Math.abs(total - numerator * 4 / denominator) < 1e-6) ?? signatures[0];
  const { numerator, denominator } = signature;
  const runs: BeamRun[] = [];
  const maxLines = Math.max(...notes.map((note) => notation(note).lines));
  const unit = 4 / denominator;
  const baseBeatPattern = denominator === 8
    ? numerator >= 6 && numerator % 3 === 0
      ? Array(numerator / 3).fill(unit * 3)
      : numerator === 5
        ? [unit * 3, unit * 2] // common 3+2 grouping
        : numerator === 7
          ? [unit * 3, unit * 2, unit * 2] // common 3+2+2 grouping
          : Array(numerator).fill(unit)
    : Array(numerator).fill(unit);
  const beatPatternForLevel = (level: number) => {
    // Keep the first two beam levels inside the notated pulse (including dotted-quarter
    // pulses in compound meter). Split only higher levels into progressively smaller groups.
    const subdivisions = level > 2 ? 2 ** (level - 2) : 1;
    return baseBeatPattern.flatMap((beat) => Array(subdivisions).fill(beat / subdivisions));
  };

  for (let level = 1; level <= maxLines; level += 1) {
    const beatPattern = beatPatternForLevel(level);
    const beatRanges: Array<{ start: number; end: number }> = [];
    let beatStart = 0;
    for (let index = 0; beatStart < total - 1e-6; index += 1) {
      const end = Math.min(total, beatStart + beatPattern[index % beatPattern.length]);
      beatRanges.push({ start: beatStart, end });
      beatStart = end;
    }

    let cursor = 0;
    const noteBeats = notes.map((note) => {
      const start = cursor;
      const end = start + note.b;
      cursor = end;
      return beatRanges.findIndex((beat) => start >= beat.start - 1e-6 && end <= beat.end + 1e-6);
    });
    let runStart = -1;
    let runBeat = -1;
    const flush = (end: number) => {
      if (runStart >= 0) {
        const runEnd = end - 1;
        // Jianpu uses a full short underline beneath an isolated subdivision,
        // rather than the sideways beam hook used in staff notation.
        runs.push({ start: runStart, end: runEnd, level });
      }
      runStart = -1;
      runBeat = -1;
    };

    notes.forEach((note, index) => {
      const lines = notation(note).lines;
      const beatIndex = noteBeats[index];
      // Rests share the underline with the notes of their beat, as in the textbooks (「0 5」 under one line).
      const canBeam = lines >= level && beatIndex >= 0;
      if (!canBeam || (runStart >= 0 && beatIndex !== runBeat)) flush(index);
      if (canBeam && runStart < 0) {
        runStart = index;
        runBeat = beatIndex;
      }
    });
    flush(notes.length);
  }
  return runs;
}

// Keep decoded instrument banks for the session so switching excerpts does not re-decode samples.
const sharedSamplers: Partial<Record<InstrumentId, InstrumentSampler>> = {};
const sharedVocals: Record<string, Promise<AudioBuffer>> = {};
const sharedVocalUrls: Record<string, Promise<string>> = {};

async function loadCachedSampler(ctx: AudioContext, id: InstrumentId): Promise<InstrumentSampler> {
  const cached = sharedSamplers[id];
  if (cached) return cached;
  const loaded = await loadInstrumentSampler(ctx, id);
  sharedSamplers[id] = loaded;
  return loaded;
}

function loadCachedVocalBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  sharedVocals[url] ??= fetch(url).then((response) => {
    if (!response.ok) throw new Error(String(response.status));
    return response.arrayBuffer();
  }).then((data) => ctx.decodeAudioData(data));
  return sharedVocals[url].catch((error) => { delete sharedVocals[url]; throw error; });
}

function loadCachedVocalBlobUrl(url: string): Promise<string> {
  sharedVocalUrls[url] ??= fetch(url).then((response) => {
    if (!response.ok) throw new Error(String(response.status));
    return response.blob();
  }).then((blob) => URL.createObjectURL(blob));
  return sharedVocalUrls[url].catch((error) => { delete sharedVocalUrls[url]; throw error; });
}
type Timbre = InstrumentId | "vocal" | "choir";
const VOCAL_LABEL = "人声（童声）";
/** With a male recording for a lower part: women's voice on top, men's voice below. */
const CHOIR_LABEL = "人声（女声＋男声）";
/** Every recorded part sung by the male voice (男声合唱, 男低音独唱). */
const MALE_LABEL = "人声（男声）";
/** Seconds of the recording played before a phrase's first beat, so its opening consonant is not clipped. */
const VOCAL_PREROLL = 0.15;
/** 人声伴奏的音量：实测比人声低约 9 dB，听得清又不盖过人声。 */
const ACC_GAIN = 2.6;
// Voice colours: main line in green, second voice in blue so parts stay distinct.
const TIMBRES = [
  { wave: "triangle" as OscillatorType, overtone: 0.5, level: 1 },
  { wave: "sine" as OscillatorType, overtone: 0.3, level: 0.65 },
  { wave: "sine" as OscillatorType, overtone: 0.2, level: 0.55 },
];
const VISUALLY_HIDDEN = {
  position: "absolute" as const,
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden" as const,
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap" as const,
  border: 0,
};

/** Excerpts of one work: tabs when there are several themes, one player each. */
type ScoreNotation = "jianpu" | "staff";

export function MelodySet({ melodies, large, notationStyle = "jianpu" }: { melodies: Melody[]; large?: boolean; notationStyle?: ScoreNotation }) {
  const [index, setIndex] = useState(0);
  const melody = melodies[Math.min(index, melodies.length - 1)];
  return <div className="melody-set">
    {melodies.length > 1 && <div className="melody-tabs motion-tabs" role="tablist" aria-label="谱例片段">
      <SlidingIndicator activeKey={index} />
      {melodies.map((item, k) => <button key={k} type="button" role="tab" aria-selected={k === index} className={k === index ? "active" : ""} onClick={() => setIndex(k)}>{item.title ?? `片段 ${k + 1}`}</button>)}
    </div>}
    <MelodyPlayer key={index} melody={melody} large={large} notationStyle={notationStyle} />
  </div>;
}

/** A part's seat, left to right, so two parts on different instruments are also apart in space. */
function colorChain(ctx: AudioContext, color: PartColor, destination: AudioNode): AudioNode {
  if (!color.pan || typeof ctx.createStereoPanner !== "function") return destination;
  const panner = ctx.createStereoPanner();
  panner.pan.value = color.pan;
  panner.connect(destination);
  return panner;
}

/** Plays a jianpu melody (and any extra voices) with WebAudio, highlighting each sounding note. */
/** When playback starts: the audio clock, the time beat 0 sounds and the length of a beat (合唱训练 times the singer against it). */
export type PlaybackClock = { ctx: AudioContext; start: number; secondsPerBeat: number };

export function MelodyPlayer({ melody, large, notationStyle = "jianpu", onSoundingNotes, partLevels, onPlayback, preferVocal, partColors }: {
  melody: Melody; large?: boolean; notationStyle?: ScoreNotation; onSoundingNotes?: (notes: number[], playing: boolean) => void;
  /** Volume of each part, 0–1, changeable while playing (合唱训练). Replaces the part checkboxes. */
  partLevels?: number[];
  /** Called with the clock when playback starts and with null when it stops. */
  onPlayback?: (clock: PlaybackClock | null) => void;
  /** Start on the sung recording when there is one. */
  preferVocal?: boolean;
  /** An instrument for each part (合唱训练 自己编): offered as the 分声部 timbre and chosen first, so the parts sound different. */
  partColors?: Array<PartColor | undefined>;
}) {
  const soundingCallback = useRef(onSoundingNotes);
  useEffect(() => { soundingCallback.current = onSoundingNotes; }, [onSoundingNotes]);
  const playbackCallback = useRef(onPlayback);
  useEffect(() => { playbackCallback.current = onPlayback; }, [onPlayback]);
  const lines = useMemo<Line[]>(() => [{ label: melody.label ?? "旋律", bars: melody.bars }, ...(melody.voices ?? [])], [melody]);
  const [playing, setPlaying] = useState(false);
  /** One recording per part where one was sung: the main line (绮萱) and lower choral parts (Ria, male). */
  const vocals = useMemo(() => lines.map((_, part) => findVocal(melody, part)), [lines, melody]);
  const hasColors = !!partColors?.some(Boolean);
  const [instrument, setInstrument] = useState<Timbre>(() => (preferVocal && vocals.some(Boolean) ? "vocal" : hasColors ? "choir" : "piano"));
  const choirMode = instrument === "choir" && hasColors;
  const partColorsRef = useRef(partColors);
  useEffect(() => { partColorsRef.current = partColors; }, [partColors]);
  /** Each part's instrument loaded for this run. */
  const choirSamplers = useRef<Partial<Record<InstrumentId, InstrumentSampler>>>({});
  const vocal = vocals[0];
  /** Each part's own gain node while playing, so partLevels can change mid-song. */
  const partGains = useRef<{ ctx: AudioContext; nodes: GainNode[] } | null>(null);
  const partLevelsRef = useRef(partLevels);
  useEffect(() => {
    partLevelsRef.current = partLevels;
    const gains = partGains.current;
    if (gains) partLevels?.forEach((level, part) => gains.nodes[part]?.gain.setTargetAtTime(level, gains.ctx.currentTime, 0.04));
  }, [partLevels]);
  /** Several lines with words are a choir; without words (打击乐合奏, 铝板琴 accompaniment) an ensemble. */
  const playLabel = lines.length < 2 ? "播放旋律" : lines.some((line) => line.bars.some((bar) => bar.some((note) => note.lyric))) ? "播放合唱" : "播放合奏";
  const anyVocal = vocals.some(Boolean);
  const singers = new Set(vocals.flatMap((v) => (v ? [v.singer] : [])));
  const vocalLabel = !singers.has("ria") ? VOCAL_LABEL : singers.has("qixuan") ? CHOIR_LABEL : MALE_LABEL;
  const timbres = useMemo(() => [
    ...(hasColors ? [{ id: "choir" as const, label: partColors!.map((color) => INSTRUMENTS.find((item) => item.id === color?.timbre)?.label ?? "钢琴").join("＋") }] : []),
    ...INSTRUMENTS,
    ...(anyVocal ? [{ id: "vocal" as const, label: vocalLabel }] : []),
  ], [anyVocal, vocalLabel, hasColors, partColors]);
  /** Sampled instrument for everything the recorded voices do not sing (other parts, cues). */
  const sampleInstrument: InstrumentId = instrument === "vocal" || instrument === "choir" ? "piano" : instrument;
  const singing = instrument === "vocal" && anyVocal;
  /** 人声伴奏: a piano accompaniment under the recording (single-line songs); its style is picked from the song or chosen. */
  const [accChoice, setAccChoice] = useState<AccStyle | "auto" | "off">("auto");
  const autoAccomp = useMemo(() => (anyVocal ? accompaniment(melody) : null), [anyVocal, melody]);
  const accomp = useMemo(() => (accChoice === "auto" || accChoice === "off" ? autoAccomp : accompaniment(melody, accChoice)), [accChoice, autoAccomp, melody]);
  const accompany = accChoice !== "off";
  const accompanyRef = useRef(accompany);
  const accGain = useRef<{ ctx: AudioContext; node: GainNode } | null>(null);
  useEffect(() => {
    accompanyRef.current = accompany;
    const gain = accGain.current;
    if (gain) gain.node.gain.setTargetAtTime(accompany ? ACC_GAIN : 0, gain.ctx.currentTime, 0.05);
  }, [accompany]);
  const [loadingSampler, setLoadingSampler] = useState(false);
  const [audioMode, setAudioMode] = useState<"unknown" | "sampled" | "synth">("unknown");
  const [current, setCurrent] = useState<number[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [tempo, setTempo] = useState(melody.bpm);
  const [vocalRate, setVocalRate] = useState<VocalRate>(1);
  const [transpose, setTranspose] = useState(0);
  const [countIn, setCountIn] = useState(false);
  const [loopOpen, setLoopOpen] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(() => Math.min(3, Math.max(0, melody.bars.length - 1)));
  const [loopActive, setLoopActive] = useState(false);
  const [loopPick, setLoopPick] = useState<"start" | "end">("start");
  const pitchShift = singing ? 0 : transpose;
  // 人声支持 0.75× / 0.85× / 原速不变调带唱；乐器走自由速度滑块。
  const playTempo = singing ? Math.round(melody.bpm * vocalRate) : tempo;
  const barSpans = useMemo(() => barBeatSpans(melody.bars), [melody.bars]);
  const loopRange = useMemo(() => normalizeLoopRange(loopStart, loopEnd, melody.bars.length), [loopEnd, loopStart, melody.bars.length]);
  const canLoop = melody.bars.length > 1 && !partLevels;
  const [enabled, setEnabled] = useState<boolean[]>(() => lines.map(() => true));
  const rhythmOnly = melody.bars.every((bar) => bar.every((note) => note.d === 0 || note.d === 9));
  const canTranspose = !rhythmOnly && !partLevels;
  const mounted = useRef(true);
  const playbackActive = useRef(false);
  const samplerLoading = useRef(false);
  const stopRef = useRef<() => void>(() => {});
  const playRequestRef = useRef(0);
  /** Continuous position of the main line in beats (−1 when silent), for the melody line's orb. */
  const beatRef = useRef(-1);
  const flats = useMemo(() => lines.map((line) => line.bars.flat()), [lines]);
  const headHeights = useMemo(() => flats.map(noteHeadHeight), [flats]);
  const offsets = useMemo(() => lines.map((line) => line.bars.reduce<number[]>((acc, bar, i) => [...acc, i ? acc[i - 1] + line.bars[i - 1].length : 0], [])), [lines]);
  const beamRuns = useMemo(() => lines.map((line) => line.bars.map((notes) => {
    const byLevel = new Map<number, Map<number, BeamRun>>();
    getBeamRuns(notes, melody.meter).forEach((run) => {
      const levelRuns = byLevel.get(run.level) ?? new Map<number, BeamRun>();
      levelRuns.set(run.start, run);
      byLevel.set(run.level, levelRuns);
    });
    return byLevel;
  })), [lines, melody.meter]);
  // Widest bar in note-size units, to choose how many bars share a score row.
  const widestBar = useMemo(() => Math.max(1, ...melody.bars.map((_, barIndex) => Math.max(...lines.map((line, voice) => {
    const notes = line.bars[barIndex] ?? [];
    const groups = [...(beamRuns[voice]?.[barIndex]?.get(1)?.values() ?? [])].length;
    return notes.reduce((sum, note) => sum + (note.a != null ? 1.5 : 1.1) + notation(note).dashes * 1.1, 0) + groups * 0.22;
  })))), [melody.bars, lines, beamRuns]);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const [barsPerRow, setBarsPerRow] = useState(4);
  const [noteFit, setNoteFit] = useState(1);
  const [staffRoom, setStaffRoom] = useState(640);
  const [staffHeight, setStaffHeight] = useState(0);
  const fitRef = useRef(1);
  const [view, setView] = useState<"score" | "line">("score");
  const [followOpen, setFollowOpen] = useState(false);
  const [follow, setFollow] = useState<null | { phrase: number; kind: "listen" | "sing"; beat: number; beats: number }>(null);
  const [phraseMode, setPhraseMode] = useState<PhraseMode>("auto");
  const [listenTimes, setListenTimes] = useState(1);
  const [singClick, setSingClick] = useState(true);
  const [cueFirst, setCueFirst] = useState(false);
  const phrases = useMemo(() => splitPhrases(melody.bars, phraseMode), [melody.bars, phraseMode]);
  const activePhrase = follow ? phrases[follow.phrase] : null;
  const canFollow = !rhythmOnly && phrases.length > 1;
  const instrumentLabel = timbres.find((item) => item.id === instrument)?.label ?? "钢琴";

  const stop = useCallback(() => {
    const shouldAnnounceStop = playbackActive.current || samplerLoading.current;
    playRequestRef.current += 1;
    playbackActive.current = false;
    samplerLoading.current = false;
    stopRef.current();
    stopRef.current = () => {};
    setPlaying(false);
    setLoopActive(false);
    setFollow(null);
    beatRef.current = -1;
    setCurrent([]);
    partGains.current = null;
    soundingCallback.current?.([], false);
    playbackCallback.current?.(null);
    if (shouldAnnounceStop && mounted.current) setAnnouncement("已停止");
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; stop(); };
  }, [stop]);
  useEffect(() => {
    window.addEventListener(VOCAL_PLAYBACK_STARTED, stop);
    return () => window.removeEventListener(VOCAL_PLAYBACK_STARTED, stop);
  }, [stop]);
  // Keep the existing even-grid layout for jianpu; staff systems lay themselves out from the measured width.
  useEffect(() => {
    const score = scoreRef.current;
    if (!score) return;
    const fit = () => {
      const voice = score.querySelector<HTMLElement>(".melody-voice");
      const notePx = (voice ? parseFloat(getComputedStyle(voice).fontSize) || 20 : 20) / fitRef.current;
      const style = getComputedStyle(score);
      const room = score.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (notationStyle === "staff") {
        setStaffRoom(room);
        // 上课模式 caps the score box; the staff sizes itself to fit it instead of scrolling.
        const cap = parseFloat(style.maxHeight);
        setStaffHeight(Number.isFinite(cap) ? cap - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) : 0);
        return;
      }
      const barPx = (n: number, scale: number) => n * (widestBar * notePx * scale + 26);
      const count = Math.min([8, 4, 2].find((n) => barPx(n, 0.8) <= room) ?? 1, melody.bars.length);
      const scale = barPx(count, 1) <= room ? 1 : Math.max(0.8, room / barPx(count, 1));
      fitRef.current = scale;
      setBarsPerRow(count);
      setNoteFit(scale);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(score);
    return () => observer.disconnect();
  }, [notationStyle, melody.bars.length, widestBar, view]);

  // Jianpu ties and slurs: measured from the laid-out digits, so they follow the row wrapping.
  const [arcs, setArcs] = useState<string[]>([]);
  useEffect(() => {
    const score = scoreRef.current;
    if (!score || notationStyle === "staff" || view !== "score") { setArcs([]); return; }
    let frame = 0;
    const measure = () => {
      const box = score.getBoundingClientRect();
      if (!box.width) return; // on a closed page of the book: measured again when it opens (the observer sees the size change)
      // 上课模式 shrinks a slide with CSS zoom: getBoundingClientRect is in screen pixels, but the arcs' SVG sits inside
      // the zoomed box and gets zoomed again, so convert back to the score's own pixels.
      const scale = score.offsetWidth ? box.width / score.offsetWidth : 1;
      const at = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { left: (r.left - box.left) / scale + score.scrollLeft, right: (r.right - box.left) / scale + score.scrollLeft, top: (r.top - box.top) / scale + score.scrollTop, height: r.height / scale };
      };
      const digits = new Map<string, Element>();
      score.querySelectorAll("[data-arc]").forEach((el) => digits.set(el.getAttribute("data-arc")!, el));
      const bars = [...score.querySelectorAll(".melody-bar")].map(at);
      const paths: string[] = [];
      const curve = (x1: number, x2: number, y: number, em: number) => {
        const h = Math.min(em * 0.42, 2.5 + (x2 - x1) * 0.06);
        const mx = (x1 + x2) / 2;
        paths.push(`M${x1.toFixed(1)} ${y.toFixed(1)}Q${mx.toFixed(1)} ${(y - h - em * 0.07).toFixed(1)} ${x2.toFixed(1)} ${y.toFixed(1)}Q${mx.toFixed(1)} ${(y - h).toFixed(1)} ${x1.toFixed(1)} ${y.toFixed(1)}Z`);
      };
      const rowOf = (top: number) => bars.filter((bar) => bar.top <= top && bar.top + bar.height >= top);
      /** `from` -1: the line comes in from before the excerpt (a tie or slur carried over from the previous one). */
      const draw = (voice: number, notes: MelodyNote[], from: number, to: number, raise: number) => {
        const a = from >= 0 ? digits.get(`${voice}:${from}`) : undefined;
        const b = digits.get(`${voice}:${to}`);
        if (!b || (from >= 0 && !a)) return;
        const q = at(b);
        const em = q.height || 16;
        const high = notes.slice(Math.max(0, from), to + 1).some((note) => (note.o ?? 0) > 0);
        const lift = em * (0.12 + (high ? 0.3 : 0) + raise);
        const x2 = (q.left + q.right) / 2 - em * 0.1;
        const rowStart = () => Math.min(...rowOf(q.top).map((bar) => bar.left)) + em * 0.2;
        if (!a) { curve(rowStart(), x2, q.top - lift, em); return; }
        const p = at(a);
        const x1 = (p.left + p.right) / 2 + em * 0.1;
        if (Math.abs(p.top - q.top) < em / 2) { curve(x1, x2, Math.min(p.top, q.top) - lift, em); return; }
        // Across a row break: one half runs out of the first row, the other comes into the next.
        curve(x1, Math.max(...rowOf(p.top).map((bar) => bar.right)) - em * 0.2, p.top - lift, em);
        curve(rowStart(), x2, q.top - lift, em);
      };
      lines.forEach((line, voice) => {
        const notes = line.bars.flat();
        // A tie after a rest has nothing to hold: no line.
        for (let i = 0; i < notes.length; i += 1) if (notes[i].tie && (i === 0 || notes[i - 1].d)) draw(voice, notes, i - 1, i, 0);
        // A slur spans the syllable's note and every new pitch sung on it (ties inside it included).
        for (let i = 0; i < notes.length; i += 1) {
          if (!notes[i].slur) continue;
          let start = i - 1;
          while (start >= 0 && (notes[start].slur || notes[start].tie)) start -= 1;
          let end = i;
          while (end + 1 < notes.length && (notes[end + 1].slur || notes[end + 1].tie)) end += 1;
          i = end;
          // After a breath (「源 0 1 2 3」) the slur starts on the first note after the rest.
          if (start >= 0 && notes[start].d === 0) start += 1;
          if (start === end) continue;
          const ties = notes.slice(start + 1, end + 1).some((note) => note.tie);
          draw(voice, notes, start, end, ties ? 0.28 : 0);
        }
      });
      setArcs((old) => (old.length === paths.length && old.every((d, k) => d === paths[k]) ? old : paths));
    };
    const schedule = () => { clearTimeout(frame); frame = window.setTimeout(measure, 30); };
    schedule();
    void document.fonts?.ready.then(schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(score);
    return () => { clearTimeout(frame); observer.disconnect(); };
  }, [notationStyle, view, lines, barsPerRow, noteFit]);

  /** Unlock audio and load the chosen instrument; null when the request was superseded. */
  const prepareAudio = async (request: number) => {
    window.dispatchEvent(new Event(MELODY_PLAYBACK_STARTED));
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) {
      setAudioMode("synth");
      setAnnouncement(instrumentLabel + "音色加载失败，改用电子音色");
      return null;
    }
    const ctx = getPianoAudioContext();
    // Percussion parts play recorded strokes; if they cannot be fetched the synthesised sounds are used.
    if (lines.some((line) => percussionKind(line.label))) await loadPercussionStrokes(ctx);
    let sampler = sharedSamplers[sampleInstrument] ?? null;
    let samplerLoadFailed = false;
    // 分声部音色: each part's instrument; a part without one, or one that cannot load, falls back to the piano.
    choirSamplers.current = {};
    const colors = choirMode ? lines.map((_, part) => partColorsRef.current?.[part]) : [];
    if (choirMode) {
      const needed = [...new Set(colors.flatMap((color) => (color ? [color.timbre] : [])))];
      samplerLoading.current = true;
      setLoadingSampler(true);
      setAnnouncement("载入分声部音色…");
      try {
        await ctx.resume();
        await Promise.all(needed.map(async (timbre) => {
          const loaded = await loadCachedSampler(ctx, timbre);
          choirSamplers.current[timbre] = loaded;
        }));
      } catch {
        samplerLoadFailed = true;
      } finally {
        samplerLoading.current = false;
        if (mounted.current) setLoadingSampler(false);
      }
    }
    const pianoNeeded = !choirMode || colors.some((color) => !color || !choirSamplers.current[color.timbre]);
    let voices: (AudioBuffer | null)[] = vocals.map(() => null);
    let voiceUrls: (string | null)[] = vocals.map(() => null);
    if (singing) {
      samplerLoading.current = true;
      setLoadingSampler(true);
      setAnnouncement("载入" + vocalLabel + "…");
      try {
        await ctx.resume();
        const loaded = await Promise.all(vocals.map(async (part) => {
          if (!part) return { buffer: null as AudioBuffer | null, blobUrl: null as string | null };
          const url = sharedAssetUrl(part.file);
          if (vocalRate !== 1 && typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
            const blobUrl = await loadCachedVocalBlobUrl(url);
            return { buffer: null as AudioBuffer | null, blobUrl };
          }
          const buffer = await loadCachedVocalBuffer(ctx, url);
          return { buffer, blobUrl: null as string | null };
        }));
        voices = loaded.map((item) => item.buffer);
        voiceUrls = loaded.map((item) => item.blobUrl);
      } catch {
        voices = vocals.map(() => null);
        voiceUrls = vocals.map(() => null);
        samplerLoadFailed = true;
      } finally {
        samplerLoading.current = false;
        if (mounted.current) setLoadingSampler(false);
      }
    }
    if (!rhythmOnly && !sampler && pianoNeeded) {
      samplerLoading.current = true;
      setLoadingSampler(true);
      setAnnouncement("载入" + instrumentLabel + "音色…");
      try {
        await ctx.resume();
        sampler = await loadCachedSampler(ctx, sampleInstrument);
        if (mounted.current) setAudioMode("sampled");
      } catch {
        samplerLoadFailed = true;
        if (mounted.current) setAudioMode("synth");
      } finally {
        samplerLoading.current = false;
        if (mounted.current) setLoadingSampler(false);
      }
    } else {
      await ctx.resume().catch(() => undefined);
      if (sampler && mounted.current) setAudioMode("sampled");
    }
    // The reader may have left the lesson while the samples were loading.
    if (!mounted.current || request !== playRequestRef.current) return null;
    return { ctx, sampler, samplerLoadFailed, voices, voice: voices[0], voiceUrls, voiceUrl: voiceUrls[0] };
  };

  /** Play 1 measure of woodblock clicks before beat 0; returns count-in duration in seconds. */
  const scheduleCountIn = (ctx: AudioContext, out: AudioNode, t0: number, beat: number) => {
    const { count, beatLen } = countInBeatsOf(melody.meter);
    for (let i = 0; i < count; i += 1) {
      const at = t0 + i * beatLen * beat;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = i === 0 ? 1480 : 1040;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(i === 0 ? 0.22 : 0.14, at + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.055);
      osc.connect(gain).connect(out);
      osc.start(at);
      osc.stop(at + 0.07);
    }
    return count * beatLen * beat;
  };

  /** Pitch-preserved HTMLAudio playback for slowed vocal rates (0.75x / 0.85x). */
  const scheduleSlowVocal = (
    ctx: AudioContext,
    blobUrl: string,
    from: number,
    at: number,
    rate: number,
    to: number | undefined,
    part: Vocal | null,
    cleanups: Array<() => void>,
  ) => {
    if (!part || typeof Audio === "undefined") return;
    const origBeat = 60 / melody.bpm;
    let offset = part.offset + (from - part.leadBeats) * origBeat - VOCAL_PREROLL;
    let when = at - VOCAL_PREROLL / rate;
    if (offset < 0) { when -= offset / rate; offset = 0; }
    const delayMs = Math.max(0, (when - ctx.currentTime) * 1000);
    const el = new Audio(blobUrl);
    el.preload = "auto";
    el.playbackRate = rate;
    const pitchEl = el as HTMLAudioElement & { preservesPitch?: boolean; webkitPreservesPitch?: boolean; mozPreservesPitch?: boolean };
    if ("preservesPitch" in pitchEl) pitchEl.preservesPitch = true;
    if ("webkitPreservesPitch" in pitchEl) pitchEl.webkitPreservesPitch = true;
    if ("mozPreservesPitch" in pitchEl) pitchEl.mozPreservesPitch = true;
    el.volume = 0.92;
    let stopTimer: number | undefined;
    const startTimer = window.setTimeout(() => {
      try { el.currentTime = offset; } catch { /* ignore */ }
      void el.play().catch(() => undefined);
      if (to != null) {
        const durMs = Math.max(40, ((to - from) * origBeat / rate + VOCAL_PREROLL / rate) * 1000);
        stopTimer = window.setTimeout(() => { el.pause(); }, durMs);
      }
    }, delayMs);
    cleanups.push(() => {
      window.clearTimeout(startTimer);
      if (stopTimer !== undefined) window.clearTimeout(stopTimer);
      el.pause();
      el.src = "";
    });
  };

  /**
   * Play a part's recorded voice for melody beats [from, to) so that beat `from` sounds at `at`;
   * without `to` the recording runs to its end.
   */
  const scheduleVocal = (ctx: AudioContext, out: AudioNode, buffer: AudioBuffer, from: number, at: number, beat: number, to?: number, part: Vocal | null = vocal) => {
    if (!part) return;
    let offset = part.offset + (from - part.leadBeats) * beat - VOCAL_PREROLL;
    let when = at - VOCAL_PREROLL;
    if (offset < 0) { when -= offset; offset = 0; }
    const stopAt = to == null ? when + buffer.duration - offset : at + (to - from) * beat;
    if (stopAt <= when + 0.02 || offset >= buffer.duration) return;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(2.5, when + 0.03);
    if (to != null) {
      gain.gain.setValueAtTime(2.5, Math.max(when + 0.03, stopAt - 0.08));
      gain.gain.linearRampToValueAtTime(0, stopAt);
    }
    source.connect(gain).connect(out);
    source.start(when, offset, stopAt - when);
  };

  /** Schedule notes [from, to) of one voice from time t0; returns each note's start time and the end. */
  const scheduleRange = (ctx: AudioContext, master: AudioNode, sampler: InstrumentSampler | null, voice: number, from: number, to: number, t0: number, beat: number, levelScale = 1, voiced = false) => {
    const notes = flats[voice];
    const times: number[] = [];
    let t = t0;
    for (let index = from; index < to; index += 1) {
      const note = notes[index];
      times.push(t);
      const duration = note.b * beat;
      // A tied note extends the previous tone instead of re-attacking.
      // `voiced`: the recorded voice sings the pitched notes; only clapped X notes still sound.
      if (note.d && !note.tie && !(voiced && note.d !== 9)) {
        let length = duration;
        for (let k = index + 1; k < to && notes[k].tie; k += 1) length += notes[k].b * beat;
        const kind = note.d === 9 ? percussionKind(lines[voice]?.label) : null;
        if (kind) {
          // Parts named after a percussion instrument (小锣, 圆鼓…) get their own timbre, so they can be told apart.
          playPercussion(ctx, master, kind, t, levelScale);
        } else if (note.d === 9) {
          const percussion = { wave: "triangle" as OscillatorType, overtone: 0.15, level: 0.8 * levelScale };
          length = Math.min(length, 0.12);
          for (const [wave, level, multiple] of [[percussion.wave, percussion.level, 1], ["sine" as OscillatorType, percussion.level * percussion.overtone, 2]] as const) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = wave; osc.frequency.value = 160 * multiple;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(level, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(level * 0.55, t + Math.min(0.25, length * 0.5));
            gain.gain.exponentialRampToValueAtTime(0.0001, t + length * 0.96);
            osc.connect(gain).connect(master);
            osc.start(t); osc.stop(t + length);
          }
        } else if (choirMode && partColorsRef.current?.[voice] && choirSamplers.current[partColorsRef.current[voice]!.timbre]) {
          const color = partColorsRef.current[voice]!;
          playInstrumentSample(ctx, color.timbre, choirSamplers.current[color.timbre]!, midiOf(melody, note) + pitchShift, t, length, master, (color.level ?? 1) * levelScale);
        } else if (sampler) {
          const level = (voice === 0 ? 1 : voice === 1 ? 0.7 : 0.58) * levelScale;
          playInstrumentSample(ctx, sampleInstrument, sampler, midiOf(melody, note) + pitchShift, t, length, master, level);
        } else {
          const frequency = 440 * Math.pow(2, (midiOf(melody, note) + pitchShift - 69) / 12);
          const timbre = TIMBRES[voice] ?? TIMBRES[2];
          for (const [wave, level, multiple] of [[timbre.wave, timbre.level * levelScale, 1], ["sine" as OscillatorType, timbre.level * timbre.overtone * levelScale, 2]] as const) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = wave; osc.frequency.value = frequency * multiple;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(level, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(level * 0.55, t + Math.min(0.25, length * 0.5));
            gain.gain.exponentialRampToValueAtTime(0.0001, t + length * 0.96);
            osc.connect(gain).connect(master);
            osc.start(t); osc.stop(t + length);
          }
        }
      }
      t += duration;
    }
    return { times, end: t };
  };

  const playFrom = async (startBar = 0, endBar = melody.bars.length - 1, shouldLoop = false) => {
    stop();
    const firstBar = Math.max(0, Math.min(melody.bars.length - 1, startBar));
    const lastBar = Math.max(firstBar, Math.min(melody.bars.length - 1, endBar));
    const isFullStart = firstBar === 0;
    const isFullEnd = lastBar === melody.bars.length - 1;
    const request = ++playRequestRef.current;
    const audio = await prepareAudio(request);
    if (!audio) return;
    const { ctx, sampler, samplerLoadFailed, voices, voiceUrls } = audio;
    const slowVocal = singing && vocalRate !== 1 && voiceUrls.some(Boolean);
    const voiced = voices.some(Boolean) || slowVocal;
    const beat = singing ? (60 / melody.bpm) / vocalRate : 60 / tempo;
    const startBeat = barSpans[firstBar]?.start ?? 0;
    const endBeat = barSpans[lastBar]?.end ?? barSpans.at(-1)?.end ?? 0;
    const acc = singing && voiced && sampler ? accomp : null;
    const on = (part: number) => !!partLevelsRef.current || enabled[part];

    let activeRaf = 0;
    let activeMaster: GainNode | null = null;
    let cleanups: Array<() => void> = [];

    const tearDownPass = () => {
      cancelAnimationFrame(activeRaf);
      cleanups.forEach((fn) => fn());
      cleanups = [];
      if (activeMaster) {
        const node = activeMaster;
        activeMaster = null;
        node.gain.cancelScheduledValues(ctx.currentTime);
        node.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
        setTimeout(() => node.disconnect(), 100);
      }
    };

    const runPass = (withLeadAndCountIn: boolean) => {
      if (!mounted.current || request !== playRequestRef.current) return;
      tearDownPass();
      const master = ctx.createGain();
      master.gain.value = lines.length > 1 ? 0.24 : 0.34;
      master.connect(ctx.destination);
      activeMaster = master;

      const wantIntro = withLeadAndCountIn && isFullStart && !shouldLoop && !countIn && acc && accompanyRef.current;
      const lead = wantIntro ? acc.intro * beat : 0;
      const baseT0 = ctx.currentTime + (voiced ? 0.12 + VOCAL_PREROLL / (slowVocal ? vocalRate : 1) : 0.12);
      const countDur = withLeadAndCountIn && countIn ? scheduleCountIn(ctx, master, baseT0, beat) : 0;
      const start = baseT0 + countDur + lead;

      accGain.current = null;
      if (acc && sampler) {
        const accOut = ctx.createGain();
        accOut.gain.value = accompanyRef.current ? ACC_GAIN : 0;
        accOut.connect(master);
        accGain.current = { ctx, node: accOut };
        for (const note of acc.notes) {
          if (note.at < 0) {
            if (!wantIntro) continue;
          } else if (note.at < startBeat - 1e-6 || note.at >= endBeat - 1e-6) {
            continue;
          }
          playInstrumentSample(ctx, "piano", sampler, note.midi + pitchShift, start + (note.at - startBeat) * beat, note.length * beat, accOut, note.level);
        }
      }
      const outs = lines.map((_, part) => {
        const gain = ctx.createGain();
        gain.gain.value = partLevelsRef.current?.[part] ?? 1;
        const color = choirMode ? partColorsRef.current?.[part] : undefined;
        gain.connect(color ? colorChain(ctx, color, master) : master);
        return gain;
      });
      partGains.current = { ctx, nodes: outs };

      let end = start;
      const fromNotes = lines.map((_, part) => offsets[part][firstBar] ?? 0);
      const toNotes = lines.map((_, part) => (lastBar + 1 < melody.bars.length ? (offsets[part][lastBar + 1] ?? flats[part].length) : flats[part].length));
      const timeline = flats.map((notes, part) => {
        const from = fromNotes[part];
        const to = toNotes[part];
        if (!on(part)) {
          let t = start;
          return notes.slice(from, to).map((note) => { const at = t; t += note.b * beat; end = Math.max(end, t); return at; });
        }
        const partVoiced = Boolean(voices[part] || (slowVocal && voiceUrls[part]));
        const scheduled = scheduleRange(ctx, outs[part], sampler, part, from, to, start, beat, 1, partVoiced);
        end = Math.max(end, scheduled.end);
        return scheduled.times;
      });
      if (slowVocal) {
        voiceUrls.forEach((blobUrl, part) => {
          if (blobUrl && on(part)) scheduleSlowVocal(ctx, blobUrl, startBeat, start, vocalRate, isFullEnd && !shouldLoop ? undefined : endBeat, vocals[part], cleanups);
        });
      } else {
        voices.forEach((buffer, part) => {
          if (buffer && on(part)) scheduleVocal(ctx, outs[part], buffer, startBeat, start, beat, isFullEnd && !shouldLoop ? undefined : endBeat, vocals[part]);
        });
      }
      if (acc && isFullEnd && !shouldLoop) end += 1.2;
      if (withLeadAndCountIn) playbackCallback.current?.({ ctx, start, secondsPerBeat: beat });

      let previousNotes = "";
      let previousIndices = "";
      const tick = () => {
        const now = ctx.currentTime;
        if (now >= end) {
          if (shouldLoop && playbackActive.current && request === playRequestRef.current) {
            runPass(false);
            return;
          }
          stop();
          return;
        }
        beatRef.current = now < start ? -1 : startBeat + (now - start) / beat;
        const indices = timeline.map((times, part) => {
          if (now < start || !times.length) return -1;
          let idx = times.length - 1;
          while (idx > 0 && times[idx] > now) idx -= 1;
          return fromNotes[part] + idx;
        });
        const indicesKey = indices.join(",");
        if (indicesKey !== previousIndices) { previousIndices = indicesKey; setCurrent(indices); }
        const notes = indices.flatMap((idx, voice) => {
          const note = idx >= 0 ? flats[voice][idx] : undefined;
          return on(voice) && note?.d && note.d !== 9 ? [midiOf(melody, note) + pitchShift] : [];
        });
        if (notes.join(",") !== previousNotes) {
          previousNotes = notes.join(",");
          soundingCallback.current?.(notes, true);
        }
        activeRaf = requestAnimationFrame(tick);
      };
      activeRaf = requestAnimationFrame(tick);
    };

    stopRef.current = tearDownPass;
    playbackActive.current = true;
    setPlaying(true);
    setLoopActive(shouldLoop);
    runPass(true);
    const scopeText = shouldLoop
      ? `循环播放第 ${firstBar + 1}–${lastBar + 1} 小节`
      : firstBar > 0
        ? `从第 ${firstBar + 1} 小节开始播放`
        : "开始播放";
    setAnnouncement(samplerLoadFailed ? instrumentLabel + "音色加载失败，改用" + (singing ? "钢琴" : "电子音色") + "。" + scopeText : scopeText);
  };

  const play = async () => {
    if (playing || follow) { stop(); return; }
    await playFrom(0, melody.bars.length - 1, false);
  };

  /**
   * 跟唱: the instrument plays a phrase (once or twice), then the class sings
   * it back in the same time while the beat lights flash, phrase by phrase.
   */
  const startFollow = async (fromPhrase: number) => {
    stop();
    const first = Math.max(0, Math.min(phrases.length - 1, fromPhrase));
    const request = ++playRequestRef.current;
    const audio = await prepareAudio(request);
    if (!audio) return;
    const { ctx, sampler, voice, voiceUrl } = audio;
    const slowVocal = singing && vocalRate !== 1 && Boolean(voiceUrl);
    const beat = singing ? (60 / melody.bpm) / vocalRate : 60 / tempo;
    const master = ctx.createGain();
    master.gain.value = 0.34;
    master.connect(ctx.destination);
    type Segment = { phrase: number; kind: "listen" | "sing"; t0: number; t1: number; times: number[] };
    const segments: Segment[] = [];
    const followCleanups: Array<() => void> = [];
    let t = ctx.currentTime + 0.15 + (voice || slowVocal ? VOCAL_PREROLL / (slowVocal ? vocalRate : 1) : 0);
    for (let p = first; p < phrases.length; p += 1) {
      const phrase = phrases[p];
      let lastListen: Segment | null = null;
      for (let round = 0; round < listenTimes; round += 1) {
        const scheduled = scheduleRange(ctx, master, sampler, 0, phrase.startNote, phrase.endNote, t, beat, 1, Boolean(voice || slowVocal));
        if (slowVocal && voiceUrl) scheduleSlowVocal(ctx, voiceUrl, phrase.startBeat, t, vocalRate, phrase.endBeat, vocal, followCleanups);
        else if (voice) scheduleVocal(ctx, master, voice, phrase.startBeat, t, beat, phrase.endBeat);
        lastListen = { phrase: p, kind: "listen", t0: t, t1: scheduled.end, times: scheduled.times };
        segments.push(lastListen);
        t = scheduled.end;
      }
      const singStart = t;
      const singTimes = lastListen!.times.map((at) => at - lastListen!.t0 + singStart);
      const singEnd = singStart + (phrase.endBeat - phrase.startBeat) * beat;
      if (cueFirst) {
        // A quiet reminder of the first sung pitch, as a teacher would hum it.
        const offset = flats[0].slice(phrase.startNote, phrase.endNote).findIndex((note) => note.d >= 1 && note.d <= 7);
        if (offset >= 0) {
          const index = phrase.startNote + offset;
          const cueLength = Math.min(0.45, beat * 0.6);
          scheduleRange(ctx, master, sampler, 0, index, index + 1, singStart - cueLength - 0.05, cueLength / flats[0][index].b, 0.32);
        }
      }
      if (singClick) {
        for (let at = singStart; at < singEnd - 1e-3; at += beat) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine"; osc.frequency.value = 1320;
          gain.gain.setValueAtTime(0.0001, at);
          gain.gain.exponentialRampToValueAtTime(0.09, at + 0.004);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
          osc.connect(gain).connect(master);
          osc.start(at); osc.stop(at + 0.08);
        }
      }
      segments.push({ phrase: p, kind: "sing", t0: singStart, t1: singEnd, times: singTimes });
      t = singEnd;
    }
    const end = t;
    let raf = 0;
    let previous = "";
    const tick = () => {
      const now = ctx.currentTime;
      if (now >= end) { stop(); setAnnouncement("跟唱完成"); return; }
      const segment = segments.find((item) => now < item.t1) ?? segments[segments.length - 1];
      const started = now >= segment.t0;
      let index = segment.times.length - 1;
      while (index > 0 && segment.times[index] > now) index -= 1;
      const phrase = phrases[segment.phrase];
      const beatInPhrase = started ? Math.floor((now - segment.t0) / beat) : -1;
      beatRef.current = started ? phrase.startBeat + (now - segment.t0) / beat : -1;
      const key = `${segment.phrase}:${segment.kind}:${beatInPhrase}:${started ? index : -1}`;
      if (key !== previous) {
        previous = key;
        setCurrent(started ? [phrase.startNote + index] : [-1]);
        setFollow({ phrase: segment.phrase, kind: segment.kind, beat: beatInPhrase, beats: Math.round(phrase.endBeat - phrase.startBeat) });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    stopRef.current = () => {
      cancelAnimationFrame(raf);
      followCleanups.forEach((fn) => fn());
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
      setTimeout(() => master.disconnect(), 100);
    };
    playbackActive.current = true;
    setFollow({ phrase: first, kind: "listen", beat: -1, beats: Math.round(phrases[first].endBeat - phrases[first].startBeat) });
    setAnnouncement(`跟唱开始，第 ${first + 1} 句`);
  };

  const renderNoteHead = (note: MelodyNote, key: number | string, active: boolean, beamSegments?: BeamFragment[], arcId?: string) => {
    const { lines: underlines, dotted, dots, dashes } = notation(note);
    const fragments = beamSegments ?? Array.from({ length: underlines }, (_, index) => ({ level: index + 1, edge: "single" as const }));
    const octave = note.o ?? 0;
    const hasAccidental = note.a != null;
    return <span key={key} aria-hidden="true" className={`melody-head-cell ${active ? "is-active" : ""} ${note.tie ? "is-tie" : ""} ${hasAccidental ? "has-accidental" : ""}`}>
      <span className="melody-digit" data-arc={arcId}>
        <span className="melody-digit-highlight" />
        {hasAccidental ? <sup className="melody-accidental">{note.a === 0 ? "♮" : note.a! > 0 ? "♯" : "♭"}</sup> : null}
        {note.d === 9 ? "×" : note.d || "0"}
        {dotted && Array.from({ length: dots }, (_, index) => <i key={`dot-${index}`} className="melody-dot">·</i>)}
        {Array.from({ length: Math.abs(octave) }, (_, index) => <i key={`octave-${index}`} className="melody-octave-dot" style={{ top: `${octave > 0 ? -0.18 - index * 0.2 : lowDotTop(note) - 0.4 + index * 0.2}em` }} />)}
      </span>
      {fragments.map((run, index) => <i key={`beam-${run.level}-${index}`} className={`melody-beam-segment is-${run.edge}`} style={{ top: `${UNDERLINE_TOP + (run.level - 1) * UNDERLINE_GAP}em` }} />)}
      {/* Each dash sits where its beat starts, lined up with the digit above the beat. */}
      {Array.from({ length: dashes }, (_, k) => <span key={k} className="melody-dash" style={{ left: `calc(${((k + 1) / (dashes + 1)) * 100}% + ${hasAccidental ? 0.52 : 0.32}em)` }}>–</span>)}
    </span>;
  };
  const renderNoteLyric = (note: MelodyNote, active: boolean, key: number | string) => {
    const hasAccidental = note.a != null;
    return <span key={key} aria-hidden="true" className={`melody-lyric-cell ${active ? "is-active" : ""} ${hasAccidental ? "has-accidental" : ""}`}><span className="melody-lyric">{note.lyric || " "}</span></span>;
  };
  // Every note or beam group takes room in proportion to its beats, so parallel voices line up.
  const renderNote = (note: MelodyNote, key: number, active: boolean, arcId?: string) =>
    <span key={key} aria-hidden="true" className={`melody-note ${active ? "is-active" : ""} ${note.tie ? "is-tie" : ""}`} style={{ flex: `${note.b} 1 0%`, minWidth: `${(note.a != null ? 1.5 : 1.1) + notation(note).dashes * 1.1}em` }}>
      {renderNoteHead(note, `head-${key}`, active, undefined, arcId)}
      {renderNoteLyric(note, active, `lyric-${key}`)}
    </span>;

  const onBarClick = (barIndex: number) => {
    if (loadingSampler || follow) return;
    if (loopOpen) {
      if (loopPick === "start") {
        setLoopStart(barIndex);
        setLoopEnd((prev) => (prev < barIndex ? barIndex : prev));
        setLoopPick("end");
      } else {
        setLoopEnd(barIndex);
        setLoopPick("start");
      }
      return;
    }
    void playFrom(barIndex, melody.bars.length - 1, false);
  };

  return <div className={`melody-player ${large ? "is-large" : ""} ${lines.length > 1 ? "is-choral" : ""}`}>
    {melody.title && !large && <p className="melody-title">{melody.title}</p>}
    {melody.quality === "draft" && <p className="melody-draft">自动识谱草稿 · 待人工核对。音高、节奏或调号可能有误，请对照教材原谱。</p>}
    <div className="melody-controls">
      <button type="button" className={`melody-play ${playing ? "is-playing" : ""}`} onClick={() => void play()} disabled={loadingSampler || !!follow} aria-label={loadingSampler ? "载入" + instrumentLabel + "音色…" : playing ? "停止" : rhythmOnly ? "播放节奏" : playLabel}>
        {!loadingSampler && (playing ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>)}
        {loadingSampler ? "载入" + instrumentLabel + "音色…" : playing ? "停止" : rhythmOnly ? "播放节奏" : playLabel}
      </button>
      {canFollow && <button type="button" className={`melody-follow-toggle${followOpen ? " is-open" : ""}`} aria-expanded={followOpen} onClick={() => { if (follow) stop(); setFollowOpen((open) => !open); setLoopOpen(false); }}>跟唱</button>}
      {canLoop && <button type="button" className={`melody-follow-toggle melody-loop-toggle${loopOpen || loopActive ? " is-open" : ""}`} aria-expanded={loopOpen} onClick={() => { setLoopOpen((open) => !open); setFollowOpen(false); setLoopPick("start"); }}>{loopActive && loopRange ? `循环 ${loopRange.start + 1}–${loopRange.end + 1}` : "循环"}</button>}
      <span role="status" aria-live="polite" aria-atomic="true" style={VISUALLY_HIDDEN}>{announcement}</span>
      <span className="melody-key">{transposedKeyLabel(melody.key, melody.tonicMidi, pitchShift)} · {displayMeter(melody.meter)}</span>
      <label className="melody-instrument">音色
        <select value={instrument} disabled={playing || loadingSampler} onChange={(event) => { setInstrument(event.target.value as Timbre); setAudioMode("unknown"); }}>
          {timbres.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      {singing && autoAccomp && <label className="melody-instrument melody-accomp">伴奏
        <select value={accChoice} disabled={playing || loadingSampler} onChange={(event) => setAccChoice(event.target.value as AccStyle | "auto" | "off")}>
          <option value="auto">自动：{ACC_STYLES[autoAccomp.style]}</option>
          {(Object.keys(ACC_STYLES) as AccStyle[]).map((style) => <option key={style} value={style}>{ACC_STYLES[style]}</option>)}
          <option value="off">不要伴奏（清唱）</option>
        </select>
      </label>}
      {canTranspose && !singing && <span className="melody-transpose" role="group" aria-label="一键移调">
        <span>移调</span>
        <button type="button" disabled={playing || loadingSampler || !!follow || transpose <= -4} onClick={() => setTranspose((v) => Math.max(-4, v - 1))} aria-label="降低半音">−</button>
        <b>{transpose === 0 ? "原调" : `${transpose > 0 ? "+" : ""}${transpose}`}</b>
        <button type="button" disabled={playing || loadingSampler || !!follow || transpose >= 4} onClick={() => setTranspose((v) => Math.min(4, v + 1))} aria-label="升高半音">＋</button>
      </span>}
      {!partLevels && <label className="melody-countin">
        <input type="checkbox" checked={countIn} disabled={playing || loadingSampler || !!follow} onChange={(event) => setCountIn(event.target.checked)} />
        预备拍
      </label>}
      {lines.length > 1 && !partLevels && <span className="melody-voices" role="group" aria-label="选择声部">
        {lines.map((line, k) => <label key={line.label} className={`voice-${k}`}>
          <input type="checkbox" checked={enabled[k]} disabled={playing || loadingSampler} onChange={(event) => setEnabled((value) => value.map((item, i) => (i === k ? event.target.checked : item)))} />
          {line.label}
        </label>)}
      </span>}
      {!rhythmOnly && <span className="melody-view" role="radiogroup" aria-label="显示方式">
        {([["score", "谱子"], ["line", "旋律线"]] as const).map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={view === value} className={view === value ? "is-active" : ""} onClick={() => setView(value)}>{label}</button>)}
      </span>}
      {singing ? <span className="melody-vocal-rate" role="radiogroup" aria-label="人声带唱速度">
        <span>速度</span>
        {VOCAL_RATES.map((rate) => <button key={rate} type="button" role="radio" aria-checked={vocalRate === rate} className={vocalRate === rate ? "is-active" : ""} disabled={playing || loadingSampler || !!follow} onClick={() => setVocalRate(rate)}>{rate === 1 ? "原速" : `${rate}×`}</button>)}
      </span> : <label className="melody-tempo">速度
        <input type="range" min={40} max={160} step={4} value={playTempo} aria-valuetext={`每分钟 ${playTempo} 拍`} disabled={playing || loadingSampler || !!follow} onChange={(event) => setTempo(Number(event.target.value))} />
        <b>♩={playTempo}</b>
      </label>}
    </div>
    {canLoop && loopOpen && loopRange && <div className="melody-loop-bar" role="group" aria-label="小节循环练习">
      <label>第
        <select value={loopRange.start} disabled={playing || loadingSampler} onChange={(event) => setLoopStart(Number(event.target.value))}>
          {melody.bars.map((_, idx) => <option key={idx} value={idx}>{idx + 1}</option>)}
        </select>
        小节
      </label>
      <span>至</span>
      <label>第
        <select value={loopRange.end} disabled={playing || loadingSampler} onChange={(event) => setLoopEnd(Number(event.target.value))}>
          {melody.bars.map((_, idx) => <option key={idx} value={idx}>{idx + 1}</option>)}
        </select>
        小节
      </label>
      <button type="button" className="melody-follow-go" disabled={loadingSampler || !!follow} onClick={() => (loopActive ? stop() : void playFrom(loopRange.start, loopRange.end, true))}>
        {loopActive ? "■ 停止循环" : "↻ 循环播放"}
      </button>
      <small>也可直接点击下方谱面小节号选起止范围；关闭本栏后点击任意小节号可从该小节起播。</small>
    </div>}
    {canFollow && followOpen && <div className={`melody-follow${follow ? ` is-${follow.kind}` : ""}`} role="group" aria-label="跟唱">
      {follow ? <>
        <div className="melody-follow-status">
          <span className="melody-follow-count">第 {follow.phrase + 1} / {phrases.length} 句</span>
          <strong>{follow.kind === "listen" ? "先听这一句" : "轮到你们唱！"}</strong>
          <span className="melody-follow-beats" aria-hidden="true">{Array.from({ length: follow.beats }, (_, k) => <i key={k} className={k === follow.beat ? "is-on" : k < follow.beat ? "is-past" : ""} />)}</span>
        </div>
        <div className="melody-follow-actions">
          <button type="button" onClick={() => void startFollow(follow.phrase - 1)} disabled={follow.phrase === 0}>上一句</button>
          <button type="button" onClick={() => void startFollow(follow.phrase)}>重来这句</button>
          <button type="button" onClick={() => void startFollow(follow.phrase + 1)} disabled={follow.phrase >= phrases.length - 1}>下一句</button>
          <button type="button" className="is-end" onClick={stop}>结束跟唱</button>
        </div>
      </> : <>
        <div className="melody-follow-settings">
          <span className="melody-follow-field">分句
            {([["auto", "自动"], [2, "2 小节"], [4, "4 小节"]] as const).map(([value, label]) => <button key={label} type="button" aria-pressed={phraseMode === value} className={phraseMode === value ? "is-active" : ""} onClick={() => setPhraseMode(value)}>{label}</button>)}
          </span>
          <span className="melody-follow-field">每句听
            {[1, 2].map((times) => <button key={times} type="button" aria-pressed={listenTimes === times} className={listenTimes === times ? "is-active" : ""} onClick={() => setListenTimes(times)}>{times} 遍</button>)}
          </span>
          <label className="melody-follow-check"><input type="checkbox" checked={singClick} onChange={(event) => setSingClick(event.target.checked)} />学生唱时有轻声拍点</label>
          <label className="melody-follow-check"><input type="checkbox" checked={cueFirst} onChange={(event) => setCueFirst(event.target.checked)} />轻声提示第一个音</label>
        </div>
        <div className="melody-follow-start">
          <button type="button" className="melody-follow-go" onClick={() => void startFollow(0)} disabled={loadingSampler}>▶ 开始跟唱</button>
          <span>共 {phrases.length} 句，从第
            {phrases.map((phrase, k) => <button key={k} type="button" className="melody-follow-chip" onClick={() => void startFollow(k)} aria-label={`从第 ${k + 1} 句开始（第 ${phrase.startBar + 1}–${phrase.endBar} 小节）`}>{k + 1}</button>)}
          句开始</span>
        </div>
      </>}
    </div>}
    {view === "line" && !rhythmOnly ? <MelodyLine notes={flats[0]} bars={melody.bars} phrases={phrases} current={current[0] ?? -1} activePhrase={follow ? follow.phrase : null} singing={follow?.kind === "sing"} beatRef={beatRef} /> :
    <div ref={scoreRef} className={`melody-score${notationStyle === "staff" ? " is-staff" : ""}${melody.marks ? " has-marks" : ""}`} style={{ "--bars": barsPerRow, "--melody-fit": noteFit } as CSSProperties} role="img" aria-label={`${notationStyle === "staff" ? "五线谱" : "简谱"}旋律，共 ${melody.bars.length} 小节，${melody.key}，${displayMeter(melody.meter)} 拍`}>
      {notationStyle === "staff" ? <StaffNotation melody={melody} lines={lines as MelodyLineData[]} current={current} offsets={offsets} width={staffRoom} height={staffHeight} activePhrase={activePhrase} large={large} /> : melody.bars.map((_, barIndex) => {
        const inLoop = Boolean((loopOpen || loopActive) && loopRange && barIndex >= loopRange.start && barIndex <= loopRange.end);
        const dimmed = Boolean((activePhrase && (barIndex < activePhrase.startBar || barIndex >= activePhrase.endBar))
          || (loopActive && loopRange && (barIndex < loopRange.start || barIndex > loopRange.end)));
        return <span key={barIndex} className={`melody-bar${melody.marks?.[barIndex] ? " has-mark" : ""}${inLoop ? " is-loop-bar" : ""}${dimmed ? " is-dim" : ""}`}>
        {canLoop && <button type="button" className="melody-bar-num" onClick={() => onBarClick(barIndex)} title={loopOpen ? `设为循环${loopPick === "start" ? "起" : "止"}点（第 ${barIndex + 1} 小节）` : `从第 ${barIndex + 1} 小节起播`} aria-label={`第 ${barIndex + 1} 小节`}>{barIndex + 1}</button>}
        {melody.marks?.[barIndex] && <b className="melody-mark">{melody.marks[barIndex]}</b>}
        {lines.map((line, voice) => {
          const rowStart = Math.floor(barIndex / barsPerRow) * barsPerRow;
          const rowEnd = Math.min(melody.bars.length, rowStart + barsPerRow);
          if (voice > 0 && line.bars.slice(rowStart, rowEnd).flat().every((note) => note.d === 0)) return null;
          const notes = line.bars[barIndex] ?? [];
          const runsByLevel = beamRuns[voice]?.[barIndex] ?? new Map<number, Map<number, BeamRun>>();
          const rendered: ReturnType<typeof renderNote>[] = [];

          function renderBeamGroup(start: number, end: number): ReturnType<typeof renderNote> {
            const groupNotes = notes.slice(start, end + 1);
            const containedRuns = [...runsByLevel.entries()].flatMap(([level, levelRuns]) =>
              [...levelRuns.values()].filter((run) => run.start >= start && run.end <= end).map((run) => ({ ...run, level })),
            );
            return <span key={`beam-${start}-${end}`} className="melody-beam-group" style={{ gridTemplateColumns: `repeat(${groupNotes.length}, max-content)`, flex: `${groupNotes.reduce((sum, note) => sum + note.b, 0)} 1 0%` }}>
              {groupNotes.map((note, offset) => {
                const index = start + offset;
                const active = offsets[voice][barIndex] + index === current[voice];
                const noteBeams: BeamFragment[] = containedRuns.filter((run) => index >= run.start && index <= run.end).map((run) => ({
                  level: run.level,
                  edge: run.start === run.end ? "single" : run.start === index ? "start" : run.end === index ? "end" : "middle",
                }));
                return renderNoteHead(note, `head-${index}`, active, noteBeams, `${voice}:${offsets[voice][barIndex] + index}`);
              })}
              {groupNotes.map((note, offset) => renderNoteLyric(note, offsets[voice][barIndex] + start + offset === current[voice], `lyric-${start + offset}`))}
            </span>;
          }

          for (let noteIndex = 0; noteIndex < notes.length;) {
            const run = runsByLevel.get(1)?.get(noteIndex);
            if (run) {
              rendered.push(renderBeamGroup(run.start, run.end));
              noteIndex = run.end + 1;
            } else {
              const note = notes[noteIndex];
              rendered.push(renderNote(note, noteIndex, offsets[voice][barIndex] + noteIndex === current[voice], `${voice}:${offsets[voice][barIndex] + noteIndex}`));
              noteIndex += 1;
            }
          }
          return <span key={voice} className={`melody-voice voice-${voice}`} style={{ "--melody-head-height": `${headHeights[voice]}em` } as CSSProperties}>{rendered}</span>;
        })}
      </span>; })}
      {notationStyle !== "staff" && arcs.length > 0 && <svg className="melody-arcs" aria-hidden="true">{arcs.map((d, k) => <path key={k} d={d} />)}</svg>}
    </div>}
    {/* Source notes and sample credits live in the home page footer; only a fallback warning shows here. */}
    {!rhythmOnly && audioMode === "synth" && <p className="melody-source">所选音色未能载入，暂用电子音色示范。</p>}
    {singing && <p className="melody-source melody-vocal-credit">人声为 {vocalCredit(vocals.flatMap((v) => (v ? [v.singer] : [])))}，按谱面歌词自动演唱。</p>}
  </div>;
}
