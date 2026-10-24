import { Fragment, type CSSProperties, type ReactElement } from "react";
import { midiOf, type Melody, type MelodyNote } from "../../lib/lesson/melodies";

// Engraved five-line staff for the 五线谱 editions, drawn from the same Melody data as jianpu.
// Units: one staff space = 10. Positions count half-spaces up from the bottom line (0 = bottom
// line, 8 = top line). Every song staff uses one clef and one octave placement for the whole
// piece, chosen to keep notes on the staff the way the textbooks print children's songs.

export type MelodyLineData = { label: string; bars: MelodyNote[][] };
type Clef = "treble" | "bass" | "percussion";

const SPACE = 10;
const STAFF_H = 4 * SPACE;
const STEM = 35;
const HEAD_RX = 5.9;
const STEM_DX = 5.5;
const BEAM_W = 4.6;
const BEAM_GAP = 7.5;
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];
const SHARP_KEYS: Record<string, number> = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7 };
const FLAT_KEYS: Record<string, number> = { F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6, Cb: 7 };
// Key-signature positions (half-spaces above the bottom line), in the usual engraving order.
const SIGNATURE_POS: Record<"treble" | "bass", { sharp: number[]; flat: number[] }> = {
  treble: { sharp: [8, 5, 9, 6, 3, 7, 4], flat: [4, 7, 3, 6, 2, 5, 1] },
  bass: { sharp: [6, 3, 7, 4, 1, 5, 2], flat: [2, 5, 1, 4, 0, 3, -1] },
};
const BOTTOM_STEP = { treble: 30, bass: 18 }; // E4, G2 as diatonic steps (C4 = 28)
const DURATIONS: Array<{ value: number; base: number; dots: number }> = [
  { value: 4, base: 4, dots: 0 }, { value: 3.5, base: 2, dots: 2 }, { value: 3, base: 2, dots: 1 }, { value: 2, base: 2, dots: 0 },
  { value: 1.75, base: 1, dots: 2 }, { value: 1.5, base: 1, dots: 1 }, { value: 1, base: 1, dots: 0 },
  { value: 0.875, base: 0.5, dots: 2 }, { value: 0.75, base: 0.5, dots: 1 }, { value: 0.5, base: 0.5, dots: 0 },
  { value: 0.375, base: 0.25, dots: 1 }, { value: 0.25, base: 0.25, dots: 0 }, { value: 0.1875, base: 0.125, dots: 1 },
  { value: 0.125, base: 0.125, dots: 0 }, { value: 0.0625, base: 0.0625, dots: 0 },
];
const EPS = 1e-6;

type Glyph = {
  note: MelodyNote; noteIndex: number; first: boolean; start: number; dur: number;
  base: number; dots: number; tuplet?: number; rest: boolean; spoken: boolean;
  pos: number; accidental?: number; tieNext: boolean;
};
type Placed = Glyph & { x: number; y: number; up: boolean; stemEnd?: number; beamed: boolean };

function tonicOf(key: string) {
  const match = key.replace(/\s/g, "").match(/^1=([♭♯#b]?)([A-G])/);
  if (!match) return { letter: "C", accidental: "" };
  return { letter: match[2], accidental: match[1] === "♭" || match[1] === "b" ? "b" : match[1] ? "#" : "" };
}

function keySignature(key: string) {
  if (key === "节奏") return { flats: false, count: 0, alteration: {} as Record<string, number> };
  const tonic = tonicOf(key);
  const name = tonic.letter + tonic.accidental;
  const flats = tonic.accidental === "b" || (!tonic.accidental && Object.hasOwn(FLAT_KEYS, name));
  const count = flats ? FLAT_KEYS[name] ?? 0 : SHARP_KEYS[name] ?? 0;
  const order = flats ? FLAT_ORDER : SHARP_ORDER;
  return { flats, count, alteration: Object.fromEntries(order.slice(0, count).map((letter) => [letter, flats ? -1 : 1])) as Record<string, number> };
}

/** Letter-name spelling of a jianpu degree (keeps 4 as F in C, ♯4 as F♯), octave from the sounding MIDI. */
function spell(melody: Melody, note: MelodyNote) {
  const tonic = tonicOf(melody.key);
  const letter = LETTERS[(LETTERS.indexOf(tonic.letter) + Math.max(0, Math.min(6, note.d - 1))) % 7];
  const midi = midiOf(melody, note);
  const octave = Math.round((midi - NATURAL_PC[letter]) / 12) - 1;
  return { letter, octave, alteration: midi - ((octave + 1) * 12 + NATURAL_PC[letter]), step: octave * 7 + LETTERS.indexOf(letter) };
}

function meterAt(melody: Melody, index: number) {
  const entries = melody.meter.split("、").filter(Boolean);
  return entries.length === melody.bars.length ? entries[index] ?? entries[0] : entries[0] ?? "";
}

function timeSignature(value: string) {
  const match = value.match(/(\d+)\s*\/\s*(\d+)/);
  return match ? { top: match[1], bottom: match[2], length: Number(match[1]) * 4 / Number(match[2]) } : null;
}

/** Beat groups (in quarter notes) that beams may not cross. */
function beatGroups(meter: string) {
  const sig = timeSignature(meter);
  if (!sig) return 1;
  const top = Number(sig.top);
  if (sig.bottom === "8" && top % 3 === 0) return 1.5;
  return 4 / Number(sig.bottom);
}

function ledgers(pos: number) {
  return pos < -1 ? Math.floor(-pos / 2) : pos > 9 ? Math.floor((pos - 8) / 2) : 0;
}

/** Clef and octave placement for one voice over the whole piece. */
function placement(melody: Melody, bars: MelodyNote[][], voice: number): { clef: Clef; shift: number } {
  const sounding = bars.flat().filter((note) => note.d !== 0);
  if (melody.key === "节奏" || (sounding.length && sounding.every((note) => note.d === 9))) return { clef: "percussion", shift: 0 };
  const override = melody.staff?.[voice];
  const clef = override?.clef ?? "treble";
  if (override?.octave != null) return { clef, shift: override.octave };
  const steps = bars.flat().filter((note) => note.d > 0 && note.d < 8).map((note) => spell(melody, note).step - BOTTOM_STEP[clef]);
  if (!steps.length) return { clef, shift: 0 };
  // The jianpu octave (unmarked 1 = the tonic above middle C) is how the textbooks print songs;
  // move a voice only when it would sit mostly on ledger lines.
  const costAt = (shift: number) => steps.reduce((sum, pos) => sum + ledgers(pos + shift * 7), 0) / steps.length;
  const home = costAt(0);
  if (home <= 0.6) return { clef, shift: 0 };
  const best = [1, -1, 2, -2].reduce((a, shift) => (costAt(shift) < costAt(a) ? shift : a), 0);
  return { clef, shift: costAt(best) < home / 2 ? best : 0 };
}

/** Clef and written first pitch (e.g. "G4") of each voice, for checking against the textbook tables. */
export function voiceOpenings(melody: Melody, lines: MelodyLineData[]) {
  return lines.map((line, voice) => {
    const { clef, shift } = placement(melody, line.bars, voice);
    const first = line.bars.flat().find((note) => note.d > 0 && note.d < 8);
    if (clef === "percussion" || !first) return { clef, shift, first: "" };
    const pitch = spell(melody, first);
    const accidental = pitch.alteration > 0 ? "♯" : pitch.alteration < 0 ? "♭" : "";
    return { clef, shift, first: `${pitch.letter}${accidental}${pitch.octave + shift}` };
  });
}

function splitDuration(note: MelodyNote, length: number) {
  const exact = DURATIONS.find((entry) => Math.abs(entry.value - length) < EPS && (note.dots == null || entry.dots === note.dots));
  if (exact) return [exact];
  const parts: typeof DURATIONS = [];
  let left = length;
  while (left > 0.06) {
    const entry = DURATIONS.find((candidate) => candidate.value <= left + EPS) ?? DURATIONS[DURATIONS.length - 1];
    parts.push(entry);
    left -= entry.value;
  }
  return parts;
}

/** Notes of one voice as drawable glyphs, bar by bar, with accidentals resolved against the key and the bar. */
function voiceGlyphs(melody: Melody, bars: MelodyNote[][], clef: Clef, shift: number): Glyph[][] {
  const signature = keySignature(melody.staffSignature ?? melody.key);
  return bars.map((bar) => {
    const seen = new Map<string, number>();
    const glyphs: Glyph[] = [];
    let time = 0;
    bar.forEach((note, noteIndex) => {
      const rest = note.d === 0;
      const spoken = note.d === 9;
      const tuplet = note.tuplet ?? (note.tri ? 3 : undefined);
      let pos = 4;
      let accidental: number | undefined;
      if (!rest && !spoken && clef !== "percussion") {
        const pitch = spell(melody, note);
        pos = pitch.step - BOTTOM_STEP[clef] + shift * 7;
        const key = `${pitch.letter}${pitch.octave}`;
        const current = seen.get(key) ?? signature.alteration[pitch.letter] ?? 0;
        if (current !== pitch.alteration && !note.tie) accidental = pitch.alteration;
        seen.set(key, pitch.alteration);
      }
      const parts = tuplet
        ? [{ value: note.b, base: Math.pow(2, Math.round(Math.log2(note.b * tuplet / (tuplet - 1)))), dots: 0 }]
        : splitDuration(note, note.b);
      parts.forEach((part, index) => {
        glyphs.push({
          note, noteIndex, first: index === 0, start: time, dur: part.value, base: part.base, dots: part.dots, tuplet,
          rest, spoken, pos, accidental: index === 0 ? accidental : undefined, tieNext: !rest && index < parts.length - 1,
        });
        time += part.value;
      });
    });
    // A note tied from the previous one: link the previous glyph forward.
    glyphs.forEach((glyph, index) => { if (glyph.first && glyph.note.tie && index > 0 && !glyphs[index - 1].rest) glyphs[index - 1].tieNext = true; });
    return glyphs;
  });
}

export function flagCount(base: number) {
  return base <= 0.5 ? Math.round(Math.log2(1 / base)) : 0;
}

/** Indices of glyphs beamed together: runs of flagged notes inside one beat group. */
function beamRuns(glyphs: Glyph[], group: number) {
  const runs: number[][] = [];
  let run: number[] = [];
  let runGroup = -1;
  const close = () => { if (run.length > 1) runs.push(run); run = []; };
  glyphs.forEach((glyph, index) => {
    const g = Math.floor((glyph.start + EPS) / group);
    const endGroup = Math.floor((glyph.start + glyph.dur - EPS) / group);
    const beamable = !glyph.rest && flagCount(glyph.base) > 0 && g === endGroup;
    if (!beamable || g !== runGroup) close();
    if (beamable) { run.push(index); runGroup = g; }
  });
  close();
  return runs;
}

// ---------- glyph drawing ----------

const PATHS = {
  treble: "M2 -1 C2 -9 15 -10 15 -1 C15 7 -6 9 -7 -6 C-8 -20 7 -26 10 -36 C12 -44 8 -50 5 -46 C1 -41 0 -30 3 -10 L7 22",
  bass: "M-2 -3 C3 -11 20 -10 20 2 C20 14 8 24 -3 29 L-3.5 27.6 C6 21 14 13 14 2 C14 -8 4 -9 0 -3 Z",
  quarterRest: "M-2 -15 L4 -8 C2 -6 0 -3 0 -1 L5 5 C1 4 -3 6 1 11 C-5 9 -5 2 0 2 L-5 -4 C-2 -6 0 -9 -2 -15 Z",
};

function clefGlyph(clef: Clef, x: number, staffTop: number) {
  if (clef === "treble") return <g transform={`translate(${x + 8} ${staffTop + 30})`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth="2.2" d={PATHS.treble} />
    <circle cx="3" cy="21" r="3.2" fill="currentColor" stroke="none" />
    <path strokeWidth="1.6" d="M7 22 C8 27 2 29 -1 25" />
  </g>;
  if (clef === "bass") return <g transform={`translate(${x + 5} ${staffTop + 10})`} fill="currentColor">
    <circle r="3.4" /><path d={PATHS.bass} /><circle cx="25" cy="-5" r="1.7" /><circle cx="25" cy="5" r="1.7" />
  </g>;
  return <g fill="currentColor"><rect x={x + 6} y={staffTop + 10} width="3.2" height="20" /><rect x={x + 13} y={staffTop + 10} width="3.2" height="20" /></g>;
}

function accidentalGlyph(value: number, x: number, y: number, key?: string) {
  if (value === 1) return <g key={key} transform={`translate(${x} ${y})`} stroke="currentColor"><path strokeWidth="1.1" d="M-1.6 -9 V10 M1.8 -10 V9" /><path strokeWidth="2.6" d="M-4 -1.6 L4 -4 M-4 4.4 L4 2" /></g>;
  if (value === -1) return <g key={key} transform={`translate(${x} ${y})`}><path stroke="currentColor" strokeWidth="1.2" d="M-2.5 -13 V4" /><path fill="currentColor" d="M-2.5 4 C2 1 5 -2 4 -4.5 C3 -7 0 -6.5 -2.5 -3.5 L-2.5 -1.8 C0 -4.6 2.4 -4.8 2.4 -3 C2.4 -1 0 1.6 -2.5 3 Z" /></g>;
  if (value === 0) return <g key={key} transform={`translate(${x} ${y})`} stroke="currentColor"><path strokeWidth="1.1" d="M-2.6 -10 V5 M2.6 -5 V10" /><path strokeWidth="2.6" d="M-2.6 -1.6 L2.6 -3 M-2.6 4 L2.6 2.6" /></g>;
  if (value === 2) return <g key={key} transform={`translate(${x} ${y})`} stroke="currentColor" strokeWidth="1.8"><path d="M-3.5 -3.5 L3.5 3.5 M3.5 -3.5 L-3.5 3.5" /></g>;
  return <g key={key}>{accidentalGlyph(-1, x - 3.5, y)}{accidentalGlyph(-1, x + 3.5, y)}</g>;
}

export function restGlyph(base: number, x: number, staffTop: number, wholeBar: boolean) {
  if (wholeBar || base >= 4) return <rect x={x - 6} y={staffTop + 10} width="12" height="5" fill="currentColor" />;
  if (base >= 2) return <rect x={x - 6} y={staffTop + 15} width="12" height="5" fill="currentColor" />;
  if (base >= 1) return <path transform={`translate(${x} ${staffTop + 20})`} fill="currentColor" d={PATHS.quarterRest} />;
  const flags = flagCount(base);
  const parts: ReactElement[] = [];
  for (let i = 0; i < flags; i += 1) {
    const y = staffTop + 14 + i * 8;
    const cx = x - i * 1.6;
    parts.push(<circle key={`d${i}`} cx={cx - 3.5} cy={y} r="2.6" fill="currentColor" />);
    parts.push(<path key={`c${i}`} d={`M${cx - 3.5} ${y + 1.5} C${cx - 1} ${y + 3} ${cx + 2} ${y + 2} ${cx + 4} ${y - 2}`} stroke="currentColor" strokeWidth="1.3" fill="none" />);
  }
  parts.push(<path key="s" d={`M${x + 4} ${staffTop + 12} L${x - 2 - flags * 1.6} ${staffTop + 27 + (flags - 1) * 8}`} stroke="currentColor" strokeWidth="1.3" />);
  return <g>{parts}</g>;
}

export function flagGlyph(stemX: number, stemEnd: number, up: boolean, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const y = up ? stemEnd + i * 7 : stemEnd - i * 7;
    const d = up
      ? `M${stemX} ${y} C${stemX + 1} ${y + 7} ${stemX + 11} ${y + 10} ${stemX + 8} ${y + 22} C${stemX + 9} ${y + 13} ${stemX + 4} ${y + 10} ${stemX} ${y + 9} Z`
      : `M${stemX} ${y} C${stemX + 1} ${y - 7} ${stemX + 11} ${y - 10} ${stemX + 8} ${y - 22} C${stemX + 9} ${y - 13} ${stemX + 4} ${y - 10} ${stemX} ${y - 9} Z`;
    return <path key={`f${i}`} d={d} fill="currentColor" />;
  });
}

/** A curved tie or slur, as a thin filled crescent. */
function arc(x1: number, y1: number, x2: number, y2: number, below: boolean, key: string) {
  const dir = below ? 1 : -1;
  const height = Math.min(12, 4 + (x2 - x1) * 0.08);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return <path key={key} fill="currentColor" d={`M${x1} ${y1} Q${mx} ${my + dir * (height + 1.6)} ${x2} ${y2} Q${mx} ${my + dir * height} ${x1} ${y1} Z`} />;
}

// ---------- layout ----------

const segmentWidth = (duration: number) => 11 + 19 * Math.sqrt(duration);
const HEADER_PAD = 6;

/** Room for voice names ("第一声部", "木鱼") when a score has several staves. */
export function labelWidth(lines: MelodyLineData[]) {
  return lines.length > 1 ? Math.min(56, Math.max(...lines.map((line) => line.label.length)) * 10.5 + 6) : 0;
}

/** A piano part (treble over bass, two staves) is printed as one grand staff: brace, shared bar lines, no voice names. */
function isGrandStaff(plan: StaffPlan) {
  return plan.placements.length === 2 && plan.placements[0].clef === "treble" && plan.placements[1].clef === "bass";
}

const BRACE_ROOM = 14;

function labelRoom(lines: MelodyLineData[], plan: StaffPlan) {
  return isGrandStaff(plan) ? BRACE_ROOM : labelWidth(lines);
}

/** A curly brace from y1 to y2 whose points face right, ending at x + width. */
function braceGlyph(x: number, y1: number, y2: number) {
  const w = 10;
  const h = y2 - y1;
  const p = (fx: number, fy: number) => `${x + fx * w} ${y1 + fy * h}`;
  // Outer edge down to the middle point and back, then the thicker inner edge up again.
  return <path key="brace" fill="currentColor" d={`M${p(1, 0)} C${p(0.05, 0.04)} ${p(0.75, 0.44)} ${p(0, 0.5)} C${p(0.75, 0.56)} ${p(0.05, 0.96)} ${p(1, 1)} L${p(1, 0.985)} C${p(0.55, 0.95)} ${p(1.45, 0.58)} ${p(0.12, 0.5)} C${p(1.45, 0.42)} ${p(0.55, 0.05)} ${p(1, 0.015)} Z`} />;
}

function headerWidth(melody: Melody, showMeter: boolean, label: number) {
  const sig = keySignature(melody.staffSignature ?? melody.key);
  return HEADER_PAD + label + 32 + sig.count * 8.5 + (showMeter ? 24 : 0) + 6;
}

type BarLayout = { onsets: number[]; widths: number[]; lead: number; tail: number; wholeRest: boolean; total: number };

function barLayout(voices: Glyph[][][], barIndex: number, meterLength: number | undefined, meterChange: boolean): BarLayout {
  const glyphs = voices.map((bars) => bars[barIndex] ?? []);
  const total = Math.max(EPS, ...glyphs.map((list) => list.reduce((sum, glyph) => sum + glyph.dur, 0)));
  const wholeRest = glyphs.every((list) => list.length === 1 && list[0].rest) && (!meterLength || Math.abs(total - meterLength) < EPS || total >= meterLength);
  if (wholeRest) return { onsets: [0], widths: [56], lead: meterChange ? 26 : 8, tail: 6, wholeRest: true, total };
  const onsets = [...new Set(glyphs.flat().map((glyph) => Math.round(glyph.start * 1e4) / 1e4))].sort((a, b) => a - b);
  const widths = onsets.map((onset, index) => {
    const next = onsets[index + 1] ?? total;
    let width = segmentWidth(next - onset);
    for (const glyph of glyphs.flat()) {
      if (Math.abs(glyph.start - onset) > 1e-4) continue;
      if (glyph.dots) width += 4 * glyph.dots;
      if (glyph.first && glyph.note.lyric) width = Math.max(width, glyph.note.lyric.length * 14 + 4);
    }
    // Leave room for an accidental in front of the next onset.
    if (glyphs.flat().some((glyph) => glyph.accidental != null && Math.abs(glyph.start - next) < 1e-4)) width += 9;
    return width;
  });
  const leadAccidental = glyphs.flat().some((glyph) => glyph.accidental != null && glyph.start < 1e-4);
  return { onsets, widths, lead: (meterChange ? 26 : 10) + (leadAccidental ? 9 : 0), tail: 6, wholeRest: false, total };
}

type StaffPlan = { voices: Glyph[][][]; placements: Array<{ clef: Clef; shift: number }>; bars: BarLayout[]; meterShown: boolean[] };

export function planStaff(melody: Melody, lines: MelodyLineData[]): StaffPlan {
  const placements = lines.map((line, voice) => placement(melody, line.bars, voice));
  const voices = lines.map((line, voice) => voiceGlyphs(melody, line.bars, placements[voice].clef, placements[voice].shift));
  const meterShown = melody.bars.map((_, index) => index === 0 || meterAt(melody, index) !== meterAt(melody, index - 1));
  const bars = melody.bars.map((_, index) => barLayout(voices, index, timeSignature(meterAt(melody, index))?.length, index > 0 && meterShown[index] && !!timeSignature(meterAt(melody, index))));
  return { voices, placements, bars, meterShown };
}

const SQUEEZE = 0.8;

/** One header width for every system (clef, key, and the time signature where it is shown), so bar lines line up. */
function gridHeader(melody: Melody, plan: StaffPlan, perRow: number, label: number) {
  let widest = 0;
  for (let start = 0; start < melody.bars.length; start += perRow)
    widest = Math.max(widest, headerWidth(melody, plan.meterShown[start] && !!timeSignature(meterAt(melody, start)), label));
  return widest;
}

const onsetKey = (time: number) => Math.round(time * 1e4) / 1e4;

type Column = { onsets: number[]; widths: number[]; lead: number; tail: number; natural: number; flexible: number };

/**
 * Bar columns shared by all systems. Column j takes the onsets of every bar in that position, so notes
 * on the same beat sit under each other; each stretch of time is as wide as the bar that needs most room there.
 */
function gridColumns(plan: StaffPlan, perRow: number): Column[] {
  return Array.from({ length: perRow }, (_, column) => {
    const bars: BarLayout[] = [];
    for (let index = column; index < plan.bars.length; index += perRow) bars.push(plan.bars[index]);
    const lead = Math.max(...bars.map((bar) => bar.lead));
    const tail = Math.max(...bars.map((bar) => bar.tail));
    const end = Math.max(...bars.map((bar) => bar.total));
    const playing = bars.filter((bar) => !bar.wholeRest);
    const onsets = playing.length ? [...new Set(playing.flatMap((bar) => bar.onsets.map(onsetKey)))].sort((a, b) => a - b) : [0];
    const spans = onsets.map((onset, k) => (onsets[k + 1] ?? end) - onset);
    const widths = onsets.map(() => 0);
    // Each bar's own spacing is a minimum over the stretch of time it covers; short stretches first.
    const needs = bars.flatMap((bar) => bar.wholeRest
      ? [{ from: 0, to: end, width: bar.widths[0] }]
      : bar.onsets.map((onset, k) => ({ from: onsetKey(onset), to: onsetKey(bar.onsets[k + 1] ?? bar.total), width: bar.widths[k] })));
    needs.sort((a, b) => a.to - a.from - (b.to - b.from));
    for (const need of needs) {
      const inside = onsets.map((onset, k) => k).filter((k) => onsets[k] >= need.from - 1e-4 && onsets[k] < need.to - 1e-4);
      if (!inside.length) continue;
      const have = inside.reduce((sum, k) => sum + widths[k], 0);
      if (have >= need.width) continue;
      const time = inside.reduce((sum, k) => sum + spans[k], 0) || inside.length;
      for (const k of inside) widths[k] += (need.width - have) * ((spans[k] || 1) / time);
    }
    const flexible = widths.reduce((a, b) => a + b, 0);
    return { onsets, widths, lead, tail, natural: lead + flexible + tail, flexible };
  });
}

/** Bar columns fitted to the width: stretched to fill it, or squeezed down to SQUEEZE of the note spacing. */
function fitColumns(melody: Melody, plan: StaffPlan, perRow: number, label: number, width: number) {
  const header = gridHeader(melody, plan, perRow, label);
  const columns = gridColumns(plan, perRow);
  const natural = columns.reduce((sum, column) => sum + column.natural, 0);
  const flexible = columns.reduce((sum, column) => sum + column.flexible, 0);
  const room = width - header - 4;
  const factor = 1 + (room - natural) / Math.max(1, flexible);
  return { header, factor, columns, widths: columns.map((column) => column.natural + (factor - 1) * column.flexible) };
}

/** Bars per system: all of them, else 8 or 4 so phrases line up, else the most that fit spread evenly over the rows. */
export function staffBarsPerRow(melody: Melody, plan: StaffPlan, width: number, label: number) {
  const count = melody.bars.length;
  const fits = (n: number) => fitColumns(melody, plan, n, label, width).factor >= SQUEEZE;
  if (fits(count)) return count;
  let most = Math.min(count - 1, 8);
  while (most > 1 && !fits(most)) most -= 1;
  // Rows of 4 or 8 bars follow the phrases; below that, rows of even length (5 bars → 3 + 2).
  if (most >= 8 && count % 8 === 0) return 8;
  if (most >= 4) return 4;
  const even = Math.ceil(count / Math.ceil(count / most));
  return fits(even) ? even : most;
}

// ---------- one system ----------

type SystemProps = {
  melody: Melody; lines: MelodyLineData[]; plan: StaffPlan; start: number; end: number; width: number; scale: number;
  /** Shared grid: header width and the width of each bar column. */
  grid: { header: number; widths: number[]; columns: Column[] };
  current: number[]; offsets: number[][]; activePhrase: { startBar: number; endBar: number } | null;
};

function StaffSystem({ melody, lines, plan, start, end, width, scale, grid, current, offsets, activePhrase }: SystemProps) {
  const grand = isGrandStaff(plan);
  const label = labelRoom(lines, plan);
  const signature = keySignature(melody.staffSignature ?? melody.key);
  const meter = meterAt(melody, start);
  const showMeter = plan.meterShown[start] && !!timeSignature(meter);
  const header = grid.header;
  const totalWidth = width;

  // Horizontal positions of bars and onsets.
  const barX: number[] = [];
  const onsetX: Array<Map<number, number>> = [];
  let cursor = header;
  for (let index = start; index < end; index += 1) {
    const bar = plan.bars[index];
    barX.push(cursor);
    // Notes sit on the column's shared time grid.
    const column = grid.columns[index - start];
    const columnWidth = grid.widths[index - start];
    const factor = (columnWidth - column.lead - column.tail) / Math.max(1, column.flexible);
    const at = new Map<number, number>();
    let x = cursor + column.lead;
    column.onsets.forEach((onset, k) => { at.set(onset, x + 6); x += column.widths[k] * factor; });
    const map = new Map<number, number>();
    bar.onsets.forEach((onset) => map.set(onset, bar.wholeRest
      ? cursor + column.lead + (columnWidth - column.lead - column.tail) / 2
      : at.get(onsetKey(onset)) ?? x));
    onsetX.push(map);
    cursor += columnWidth;
  }
  // A shorter last system ends at its last column, under the bar lines above it.
  const endX = cursor;
  barX.push(cursor);

  // Each voice: place glyphs, then draw.
  const staves: Array<{ above: number; below: number; body: ReactElement[]; lyricY: number }> = [];
  lines.forEach((line, voice) => {
    const { clef } = plan.placements[voice];
    const rhythm = clef === "percussion";
    const body: ReactElement[] = [];
    let minY = 0;
    let maxY = STAFF_H;
    const placed: Placed[][] = [];
    for (let index = start; index < end; index += 1) {
      const glyphs = plan.voices[voice][index] ?? [];
      const map = onsetX[index - start];
      placed.push(glyphs.map((glyph) => {
        const x = map.get(Math.round(glyph.start * 1e4) / 1e4) ?? map.values().next().value ?? 0;
        const pos = rhythm ? 4 : glyph.pos;
        const y = STAFF_H - pos * (SPACE / 2);
        return { ...glyph, x, y: rhythm ? SPACE * 2 : y, up: rhythm ? true : pos < 4, beamed: false };
      }));
    }

    // Beams decide stem direction and length for their notes.
    const beamShapes: ReactElement[] = [];
    placed.forEach((glyphs, local) => {
      const group = beatGroups(meterAt(melody, start + local));
      for (const run of beamRuns(glyphs, group)) {
        const notes = run.map((index) => glyphs[index]);
        const far = notes.reduce((a, b) => (Math.abs(b.pos - 4) > Math.abs(a.pos - 4) ? b : a));
        const up = rhythm ? true : far.pos < 4;
        const levels = Math.max(...notes.map((note) => flagCount(note.base)));
        const xs = notes.map((note) => note.x + (up ? STEM_DX : -STEM_DX));
        const dx = xs[xs.length - 1] - xs[0] || 1;
        const slope = Math.max(-0.12, Math.min(0.12, (notes[notes.length - 1].y - notes[0].y) / dx * 0.4));
        const reach = 30 + (levels - 1) * 5;
        let base = up
          ? Math.min(...notes.map((note, k) => note.y - reach - slope * (xs[k] - xs[0])))
          : Math.max(...notes.map((note, k) => note.y + reach - slope * (xs[k] - xs[0])));
        // Keep beams of notes far off the staff reaching the middle line.
        if (up && base > SPACE * 2 && notes.every((note) => note.pos < 0)) base = Math.min(base, SPACE * 2);
        if (!up && base < SPACE * 2 && notes.every((note) => note.pos > 8)) base = Math.max(base, SPACE * 2);
        const beamY = (x: number) => base + slope * (x - xs[0]);
        notes.forEach((note, k) => { note.up = up; note.beamed = true; note.stemEnd = beamY(xs[k]); });
        for (let level = 1; level <= levels; level += 1) {
          const offset = (level - 1) * BEAM_GAP * (up ? 1 : -1);
          const thickness = up ? BEAM_W : -BEAM_W;
          let k = 0;
          while (k < notes.length) {
            if (flagCount(notes[k].base) < level) { k += 1; continue; }
            let j = k;
            while (j + 1 < notes.length && flagCount(notes[j + 1].base) >= level) j += 1;
            let x1 = xs[k];
            let x2 = xs[j];
            if (j === k) {
              const left = k === notes.length - 1 || (k > 0 && flagCount(notes[k - 1].base) >= flagCount(notes[k + 1]?.base ?? 0));
              if (left) x1 = x2 - 9; else x2 = x1 + 9;
            }
            const y1 = beamY(x1) + offset;
            const y2 = beamY(x2) + offset;
            beamShapes.push(<path key={`beam-${local}-${run[0]}-${level}-${k}`} d={`M${x1} ${y1} L${x2} ${y2} L${x2} ${y2 + thickness} L${x1} ${y1 + thickness} Z`} fill="currentColor" />);
            minY = Math.min(minY, y1, y2, y1 + thickness, y2 + thickness);
            maxY = Math.max(maxY, y1, y2, y1 + thickness, y2 + thickness);
            k = j + 1;
          }
        }
      }
    });

    // Staff lines.
    if (rhythm) body.push(<line key="rule" x1={label} x2={endX} y1={SPACE * 2} y2={SPACE * 2} className="staff-rule" />);
    else for (let i = 0; i < 5; i += 1) body.push(<line key={`rule-${i}`} x1={label} x2={endX} y1={i * SPACE} y2={i * SPACE} className="staff-rule" />);
    if (label && !grand) body.push(<text key="label" x={0} y={SPACE * 2 + 4} className="staff-voice-label">{line.label}</text>);

    // Clef, key signature, time signature.
    const clefX = HEADER_PAD + label;
    body.push(<g key="clef">{clefGlyph(clef, clefX, 0)}</g>);
    if (clef !== "percussion") {
      const positions = SIGNATURE_POS[clef][signature.flats ? "flat" : "sharp"];
      for (let i = 0; i < signature.count; i += 1)
        body.push(accidentalGlyph(signature.flats ? -1 : 1, clefX + 36 + i * 8.5, STAFF_H - positions[i] * (SPACE / 2), `key-${i}`));
    }
    const timeGlyph = (value: string, x: number, key: string) => {
      const sig = timeSignature(value);
      if (!sig) return null;
      return <g key={key} className="staff-time-signature">
        <text x={x} y={rhythm ? 17 : 18.5} textAnchor="middle">{sig.top}</text>
        <text x={x} y={rhythm ? 37 : 38.5} textAnchor="middle">{sig.bottom}</text>
      </g>;
    };
    if (showMeter) body.push(timeGlyph(meter, header - 18, "meter")!);

    // Bar lines, mid-system meter changes.
    for (let local = 1; local < end - start; local += 1) {
      const x = barX[local];
      body.push(<line key={`bar-${local}`} x1={x} x2={x} y1={rhythm ? SPACE : 0} y2={rhythm ? SPACE * 3 : STAFF_H} className="staff-barline" />);
      const index = start + local;
      if (plan.meterShown[index] && timeSignature(meterAt(melody, index))) body.push(timeGlyph(meterAt(melody, index), x + 13, `meter-${index}`)!);
    }
    const last = barX[end - start];
    if (end === melody.bars.length) {
      body.push(<line key="final-thin" x1={last - 6} x2={last - 6} y1={rhythm ? SPACE : 0} y2={rhythm ? SPACE * 3 : STAFF_H} className="staff-barline" />);
      body.push(<rect key="final-thick" x={last - 3.5} y={rhythm ? SPACE : 0} width="3.5" height={rhythm ? SPACE * 2 : STAFF_H} fill="currentColor" />);
    } else body.push(<line key="bar-end" x1={last} x2={last} y1={rhythm ? SPACE : 0} y2={rhythm ? SPACE * 3 : STAFF_H} className="staff-barline" />);

    // Notes.
    const flat = placed.flat();
    placed.forEach((glyphs, local) => {
      const barIndex = start + local;
      const dimmed = !!activePhrase && (barIndex < activePhrase.startBar || barIndex >= activePhrase.endBar);
      const wholeRest = plan.bars[barIndex].wholeRest;
      const parts: ReactElement[] = [];
      glyphs.forEach((glyph, k) => {
        const active = offsets[voice]?.[barIndex] + glyph.noteIndex === current[voice];
        const items: ReactElement[] = [];
        if (glyph.rest) {
          items.push(<g key="rest">{restGlyph(glyph.base, glyph.x, 0, wholeRest)}</g>);
          for (let d = 0; d < glyph.dots; d += 1) items.push(<circle key={`rd${d}`} cx={glyph.x + 9 + d * 4.5} cy={SPACE * 1.5} r="1.7" fill="currentColor" />);
        } else {
          const { x, y, up } = glyph;
          if (!rhythm) {
            for (let p = -2; p >= glyph.pos; p -= 2) items.push(<line key={`l${p}`} x1={x - 9.5} x2={x + 9.5} y1={STAFF_H - p * 5} y2={STAFF_H - p * 5} className="staff-ledger" />);
            for (let p = 10; p <= glyph.pos; p += 2) items.push(<line key={`l${p}`} x1={x - 9.5} x2={x + 9.5} y1={STAFF_H - p * 5} y2={STAFF_H - p * 5} className="staff-ledger" />);
          }
          if (glyph.accidental != null) items.push(accidentalGlyph(glyph.accidental, x - 13, y, "acc"));
          const hollow = glyph.base >= 2;
          if (glyph.spoken) items.push(<path key="head" d={`M${x - 4.5} ${y - 4.5} L${x + 4.5} ${y + 4.5} M${x + 4.5} ${y - 4.5} L${x - 4.5} ${y + 4.5}`} stroke="currentColor" strokeWidth="1.8" />);
          else if (hollow) items.push(<g key="head" transform={`rotate(-20 ${x} ${y})`}><ellipse cx={x} cy={y} rx={glyph.base >= 4 ? 6.8 : HEAD_RX} ry="4.3" fill="currentColor" /><ellipse cx={x} cy={y} rx={glyph.base >= 4 ? 3.2 : 3.8} ry={glyph.base >= 4 ? 2.6 : 2.1} fill="var(--sheet, #fffdf7)" transform={glyph.base >= 4 ? `rotate(60 ${x} ${y})` : undefined} /></g>);
          else items.push(<ellipse key="head" cx={x} cy={y} rx={HEAD_RX} ry="4.2" transform={`rotate(-20 ${x} ${y})`} fill="currentColor" className="staff-notehead" />);
          if (glyph.base < 4) {
            const stemX = x + (up ? STEM_DX : -STEM_DX);
            const flags = glyph.beamed ? 0 : flagCount(glyph.base);
            let stemEnd = glyph.stemEnd ?? (up ? y - STEM - Math.max(0, flags - 2) * 5 : y + STEM + Math.max(0, flags - 2) * 5);
            if (glyph.stemEnd == null && !rhythm) stemEnd = up ? Math.min(stemEnd, SPACE * 2) : Math.max(stemEnd, SPACE * 2);
            items.push(<line key="stem" x1={stemX} x2={stemX} y1={y + (up ? -1 : 1)} y2={stemEnd} stroke="currentColor" strokeWidth="1.3" />);
            if (flags) items.push(...flagGlyph(stemX, stemEnd, up, flags));
            minY = Math.min(minY, stemEnd - (flags ? 0 : 0));
            maxY = Math.max(maxY, stemEnd);
          }
          for (let d = 0; d < glyph.dots; d += 1) items.push(<circle key={`d${d}`} cx={x + 10 + d * 4.5} cy={glyph.pos % 2 === 0 && !rhythm ? y - 5 : y} r="1.7" fill="currentColor" />);
          minY = Math.min(minY, y - 6);
          maxY = Math.max(maxY, y + 6);
        }
        parts.push(<g key={`g-${k}`} className={active ? "staff-note is-active" : "staff-note"}>{items}</g>);
      });

      // Tuplet numbers.
      for (let k = 0; k < glyphs.length;) {
        const n = glyphs[k].tuplet;
        if (!n) { k += 1; continue; }
        const group = glyphs.slice(k, k + n);
        const up = group.some((glyph) => glyph.beamed) ? group[0].up : group.every((glyph) => glyph.pos < 4);
        const ends = group.map((glyph) => glyph.stemEnd ?? (glyph.up ? glyph.y - STEM : glyph.y + STEM));
        const y = up ? Math.min(...ends, 0) - 6 : Math.max(...ends, STAFF_H) + 13;
        const x = (group[0].x + group[group.length - 1].x) / 2 + (up ? STEM_DX : -STEM_DX);
        parts.push(<text key={`tuplet-${k}`} x={x} y={y} textAnchor="middle" className="staff-tuplet">{n}</text>);
        minY = Math.min(minY, y - 10);
        maxY = Math.max(maxY, y);
        k += group.length;
      }
      body.push(<g key={`m-${barIndex}`} className={dimmed ? "staff-measure is-dim" : "staff-measure"}>{parts}</g>);
    });
    body.push(<g key="beams">{beamShapes}</g>);

    // Ties and slurs, including ones that run into the next system.
    flat.forEach((glyph, index) => {
      if (glyph.rest) return;
      const next = flat[index + 1];
      const below = !glyph.up;
      const off = below ? 7 : -7;
      if (glyph.tieNext) {
        if (next) body.push(arc(glyph.x + 4, glyph.y + off * 0.8, next.x - 4, next.y + off * 0.8, glyph.up ? true : false, `tie-${index}`));
        else body.push(arc(glyph.x + 4, glyph.y + off * 0.8, endX - 2, glyph.y + off * 0.8, glyph.up, `tie-${index}`));
      }
      if (index === 0 && glyph.first && glyph.note.tie) body.push(arc(header - 4, glyph.y + off * 0.8, glyph.x - 4, glyph.y + off * 0.8, glyph.up, "tie-in"));
    });
    for (let index = 0; index < flat.length; index += 1) {
      const glyph = flat[index];
      const slurStart = glyph.first && glyph.note.slur && (index === 0 || !(flat[index - 1].first && flat[index - 1].note.slur));
      if (!slurStart) continue;
      let to = index;
      while (to + 1 < flat.length && (flat[to + 1].note.slur || !flat[to + 1].first)) to += 1;
      const from = index > 0 ? flat[index - 1] : null;
      const startGlyph = from ?? glyph;
      const end = flat[to];
      const below = startGlyph.up && end.up;
      const off = below ? 8 : -8;
      const y1 = (from ? from.y : glyph.y) + off;
      const y2 = end.y + off;
      const x1 = from ? from.x + 2 : header - 4;
      body.push(arc(x1, y1, end.x - 2, y2, below, `slur-${index}`));
      if (below) maxY = Math.max(maxY, y1 + 12, y2 + 12); else minY = Math.min(minY, y1 - 12, y2 - 12);
    }

    // Lyrics.
    const lyricY = Math.max(STAFF_H + 24, maxY + 17);
    const hasLyrics = flat.some((glyph) => glyph.first && glyph.note.lyric);
    if (hasLyrics) flat.forEach((glyph, index) => {
      if (!glyph.first || !glyph.note.lyric) return;
      const barIndex = start + placed.findIndex((bar) => bar.includes(glyph));
      const active = offsets[voice]?.[barIndex] + glyph.noteIndex === current[voice];
      body.push(<text key={`lyric-${index}`} x={glyph.x} y={lyricY} textAnchor="middle" className={active ? "staff-lyric is-active" : "staff-lyric"}>{glyph.note.lyric}</text>);
    });
    staves.push({ above: Math.max(16, -minY + 8), below: hasLyrics ? lyricY + 8 - STAFF_H : Math.max(14, maxY - STAFF_H + 8), body, lyricY });
  });

  // Stack the staves.
  const tops: number[] = [];
  let height = 0;
  staves.forEach((staff) => { height += staff.above; tops.push(height); height += STAFF_H + staff.below; });
  const bottom = tops[tops.length - 1] + STAFF_H;
  const bracket = !grand
    ? staves.length > 1 ? <path d={`M${label + 1} ${tops[0]} V${bottom}`} stroke="currentColor" strokeWidth="2.4" /> : null
    : <g>
      {braceGlyph(1, tops[0], bottom)}
      <line x1={label} x2={label} y1={tops[0]} y2={bottom} className="staff-barline" />
      {barX.slice(1, -1).map((x, k) => <line key={`gap-${k}`} x1={x} x2={x} y1={tops[0] + STAFF_H} y2={tops[1]} className="staff-barline" />)}
      {end === melody.bars.length
        ? <><line x1={barX[barX.length - 1] - 6} x2={barX[barX.length - 1] - 6} y1={tops[0] + STAFF_H} y2={tops[1]} className="staff-barline" /><rect x={barX[barX.length - 1] - 3.5} y={tops[0] + STAFF_H} width="3.5" height={tops[1] - tops[0] - STAFF_H} fill="currentColor" /></>
        : <line x1={barX[barX.length - 1]} x2={barX[barX.length - 1]} y1={tops[0] + STAFF_H} y2={tops[1]} className="staff-barline" />}
    </g>;
  const style: CSSProperties = { width: totalWidth * scale };
  return <svg className="staff-system" style={style} viewBox={`0 0 ${totalWidth} ${height}`} role="img" aria-label={`五线谱，第 ${start + 1} 至 ${end} 小节`}>
    {bracket}
    {staves.map((staff, voice) => <g key={voice} transform={`translate(0 ${tops[voice]})`}>{staff.body}</g>)}
  </svg>;
}

const SYSTEM_GAP = 10;

/** Systems at one size: bars per row from the width, each system laid out as an SVG. */
function layoutAt(props: Omit<SystemProps, "plan" | "start" | "end" | "width" | "scale" | "grid">, plan: StaffPlan, width: number, scale: number) {
  const { melody, lines } = props;
  const room = Math.max(160, width / scale);
  const label = labelRoom(lines, plan);
  const perRow = staffBarsPerRow(melody, plan, room, label);
  const grid = fitColumns(melody, plan, perRow, label, room);
  const systems: ReactElement[] = [];
  let height = 0;
  for (let start = 0; start < melody.bars.length; start += perRow) {
    const end = Math.min(melody.bars.length, start + perRow);
    const svg = StaffSystem({ ...props, plan, start, end, width: room, scale, grid });
    height += Number(String(svg.props.viewBox).split(" ")[3]) * scale + (systems.length ? SYSTEM_GAP : 0);
    systems.push(<Fragment key={start}>{svg}</Fragment>);
  }
  return { systems, height, perRow };
}

const LARGE_SCALES = [1.3, 1.2, 1.1, 1, 0.9, 0.8];

export function StaffNotation({ melody, lines, current, offsets, width, height, activePhrase, large }: {
  melody: Melody; lines: MelodyLineData[]; current: number[]; offsets: number[][]; width: number;
  /** Height the score box allows (上课模式); the score shrinks until it fits without scrolling. */
  height?: number;
  activePhrase: { startBar: number; endBar: number } | null; large?: boolean;
}) {
  const plan = planStaff(melody, lines);
  const props = { melody, lines, current, offsets, activePhrase };
  if (!large) return <div className="staff-score">{layoutAt(props, plan, width, width < 520 ? 0.85 : 1).systems}</div>;
  // 上课模式：先保证一行 4 小节（放不下就 3 小节），像课本一样按乐句成行，再按框高缩小。
  const layouts = LARGE_SCALES.map((scale) => layoutAt(props, plan, width, scale));
  const firstWith = (bars: number) => layouts.findIndex((layout) => layout.perRow >= Math.min(bars, melody.bars.length));
  let index = firstWith(4);
  if (index < 0) index = firstWith(3);
  if (index < 0) index = layouts.length - 1;
  while (height && height > 0 && index < layouts.length - 1 && layouts[index].height > height) index += 1;
  const layout = layouts[index];
  return <div className="staff-score">{layout.systems}</div>;
}
