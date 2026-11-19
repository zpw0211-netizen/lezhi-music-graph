import type { MelodyNote } from "./jianpu";

// Split a melody into sung phrases for 跟唱 (call and response). By default a
// phrase ends where a bar closes on a long note or a rest once the phrase has
// some length, or at a fixed number of bars. Songs with an upbeat (弱起) end a
// phrase inside the bar instead: the short run of notes after the closing rest
// or long note is the next phrase's pickup, so it starts the next phrase. A
// note tied or slurred from the one before never begins a phrase.

export type PhraseMode = "auto" | 2 | 4;

export type Phrase = {
  /** First bar and the bar after the last one (a pickup bar belongs to both of its phrases). */
  startBar: number;
  endBar: number;
  /** Indices into the flattened notes of the main line. */
  startNote: number;
  endNote: number;
  /** Quarter-note beats from the start of the melody. */
  startBeat: number;
  endBeat: number;
};

const EPS = 1e-6;
const beatsOf = (notes: MelodyNote[]) => notes.reduce((sum, note) => sum + note.b, 0);
/** Rests and bracketed instrumental notes: the singer is silent. */
const silent = (note: MelodyNote) => note.d === 0 || !!note.inst;
const joined = (note: MelodyNote | undefined) => !!note && (!!note.tie || !!note.slur);

/** Beats a note is held, counting the notes tied into it before it in the bar. */
function heldAt(bar: MelodyNote[], index: number) {
  let held = bar[index].b;
  for (let i = index; i > 0 && bar[i].tie; i -= 1) held += bar[i - 1].b;
  return held;
}

function endsOnRest(bar: MelodyNote[]) {
  const last = bar[bar.length - 1];
  if (!last) return false;
  if (silent(last)) return true;
  // Two beats, or most of a short bar (3/8, 6/8), like 「3 –」 or 「1 0」.
  return heldAt(bar, bar.length - 1) >= Math.min(2, beatsOf(bar) * 0.75);
}

/**
 * Beats of the opening upbeat: a first bar shorter than the bars after it, or
 * a full first bar that rests for at least half of it before the voice enters.
 */
function openingUpbeat(bars: MelodyNote[][]) {
  if (bars.length < 2) return 0;
  const first = beatsOf(bars[0]);
  const full = beatsOf(bars[1]);
  if (first > EPS && first < full - EPS) return first;
  let rest = 0;
  for (const note of bars[0]) { if (!silent(note)) break; rest += note.b; }
  return rest >= first / 2 - EPS && rest < first - EPS ? first - rest : 0;
}

/**
 * Index in the bar where the next phrase's pickup begins, or -1. A pickup is
 * a short run of notes (at most half the bar) at the end of the bar: after a
 * rest (「2 – – 0 1」), one or two notes within a beat after a held one (「2 – 5」), or, in a
 * song that opens with an upbeat, a run as long as that upbeat after a held note.
 */
export function pickupStart(bar: MelodyNote[], upbeat = 0) {
  const total = beatsOf(bar);
  let tail = 0;
  for (let i = bar.length - 1; i > 0; i -= 1) {
    tail += bar[i].b;
    if (tail > total / 2 + EPS) return -1;
    const before = bar[i - 1];
    if (silent(bar[i])) return -1;
    if (joined(bar[i])) continue;
    if (silent(before)) return bar.slice(0, i - 1).some((note) => !silent(note)) ? i : -1;
    if (heldAt(bar, i - 1) >= 2) {
      if (i >= bar.length - 2 && tail <= 1 + EPS) return i;
      if (upbeat > 0 && Math.abs(tail - upbeat) < EPS) return i;
    }
  }
  return -1;
}

export function splitPhrases(bars: MelodyNote[][], mode: PhraseMode = "auto"): Phrase[] {
  const phrases: Phrase[] = [];
  const upbeat = openingUpbeat(bars);
  let startBar = 0;
  let startNote = 0;
  let startBeat = 0;
  /** The current phrase began with a pickup in the bar before its first full bar (or with the opening upbeat bar). */
  let startsWithPickup = upbeat > 0;
  let noteCursor = 0;
  let beatCursor = 0;
  bars.forEach((bar, index) => {
    const barStartNote = noteCursor;
    const barStartBeat = beatCursor;
    noteCursor += bar.length;
    beatCursor += beatsOf(bar);
    if (index === bars.length - 1) {
      phrases.push({ startBar, endBar: index + 1, startNote, endNote: noteCursor, startBeat, endBeat: beatCursor });
      return;
    }
    const pickup = pickupStart(bar, upbeat);
    // Where this phrase would end: before the pickup, or at the bar line.
    const cutNote = pickup >= 0 ? barStartNote + pickup : noteCursor;
    const cutBeat = pickup >= 0 ? barStartBeat + beatsOf(bar.slice(0, pickup)) : beatCursor;
    if (joined(pickup >= 0 ? bar[pickup] : bars[index + 1][0])) return;
    const count = index + 1 - startBar - (startsWithPickup ? 1 : 0);
    const beats = cutBeat - startBeat;
    const split = mode === "auto"
      ? ((pickup >= 0 || endsOnRest(bar)) && beats >= 6) || beats >= 16 || (count >= 4 && beats >= 12)
      : count >= mode;
    if (!split || cutNote <= startNote) return;
    phrases.push({ startBar, endBar: index + 1, startNote, endNote: cutNote, startBeat, endBeat: cutBeat });
    startsWithPickup = pickup >= 0;
    startBar = pickup >= 0 ? index : index + 1;
    startNote = cutNote;
    startBeat = cutBeat;
  });
  // A lone closing bar (not counting a pickup bar) joins the phrase before it.
  const tail = phrases[phrases.length - 1];
  if (phrases.length > 1 && mode === "auto") {
    const previous = phrases[phrases.length - 2];
    const fullBars = tail.endBar - tail.startBar - (tail.startBar < previous.endBar ? 1 : 0);
    if (fullBars < 2) phrases.splice(-2, 2, { ...previous, endBar: tail.endBar, endNote: tail.endNote, endBeat: tail.endBeat });
  }
  return phrases;
}
