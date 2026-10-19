import type { MelodyNote } from "./jianpu";

// Split a melody into sung phrases for 跟唱 (call and response). Phrases end
// at bar lines: by default where a bar closes on a long note or a rest once
// the phrase has some length, or at a fixed number of bars. A bar that starts
// with a tie never begins a phrase.

export type PhraseMode = "auto" | 2 | 4;

export type Phrase = {
  /** First bar and the bar after the last one. */
  startBar: number;
  endBar: number;
  /** Indices into the flattened notes of the main line. */
  startNote: number;
  endNote: number;
  /** Quarter-note beats from the start of the melody. */
  startBeat: number;
  endBeat: number;
};

const barBeats = (bar: MelodyNote[]) => bar.reduce((sum, note) => sum + note.b, 0);

function endsOnRest(bar: MelodyNote[]) {
  const last = bar[bar.length - 1];
  if (!last) return false;
  if (last.d === 0) return true;
  // A note held to the end of the bar (with its ties) counts as a long ending.
  let held = last.b;
  for (let i = bar.length - 1; i > 0 && bar[i].tie; i -= 1) held += bar[i - 1].b;
  // Two beats, or most of a short bar (3/8, 6/8), like 「3 –」 or 「1 0」.
  return held >= Math.min(2, barBeats(bar) * 0.75);
}

export function splitPhrases(bars: MelodyNote[][], mode: PhraseMode = "auto"): Phrase[] {
  const phrases: Phrase[] = [];
  let startBar = 0;
  let startNote = 0;
  let startBeat = 0;
  let noteCursor = 0;
  let beatCursor = 0;
  bars.forEach((bar, index) => {
    noteCursor += bar.length;
    beatCursor += barBeats(bar);
    const count = index + 1 - startBar;
    const beats = beatCursor - startBeat;
    const last = index === bars.length - 1;
    const nextStartsTied = !last && !!bars[index + 1][0]?.tie;
    const split = last || (!nextStartsTied && (mode === "auto"
      ? (endsOnRest(bar) && beats >= 6) || beats >= 16 || (count >= 4 && beats >= 8)
      : count >= mode));
    if (!split) return;
    phrases.push({ startBar, endBar: index + 1, startNote, endNote: noteCursor, startBeat, endBeat: beatCursor });
    startBar = index + 1;
    startNote = noteCursor;
    startBeat = beatCursor;
  });
  // A lone closing bar joins the phrase before it.
  const tail = phrases[phrases.length - 1];
  if (phrases.length > 1 && tail.endBar - tail.startBar < 2 && mode === "auto") {
    const previous = phrases[phrases.length - 2];
    phrases.splice(-2, 2, { ...previous, endBar: tail.endBar, endNote: tail.endNote, endBeat: tail.endBeat });
  }
  return phrases;
}
