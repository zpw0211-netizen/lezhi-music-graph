import type { TimedToken } from "./patterns";

// Judge a pupil's drum taps against the notes of the exercise. Times are in
// seconds from the first beat; each note takes the nearest unused tap.

export type Verdict = "good" | "early" | "late" | "miss";

export type ScoreResult = {
  /** Verdict per sounding note, keyed by token key. */
  marks: Map<string, Verdict>;
  good: number;
  early: number;
  late: number;
  miss: number;
  extra: number;
  /** 0–100. */
  score: number;
  stars: 0 | 1 | 2 | 3;
};

/** Within this many seconds a tap counts as on time. */
export const ON_TIME = 0.08;
/** Beyond this a tap is not matched to the note at all. */
export const WINDOW = 0.2;

export function judgeTaps(tokens: TimedToken[], secPerQuarter: number, taps: number[]): ScoreResult {
  const notes = tokens.filter((t) => t.sounding);
  // Never let a window reach past the midpoint to a neighbouring note.
  const window = (index: number) => {
    const at = notes[index].start * secPerQuarter;
    const prev = index > 0 ? (at - notes[index - 1].start * secPerQuarter) / 2 : Infinity;
    const next = index < notes.length - 1 ? (notes[index + 1].start * secPerQuarter - at) / 2 : Infinity;
    return Math.min(WINDOW, prev, next);
  };
  const sorted = [...taps].sort((a, b) => a - b);
  const used = new Set<number>();
  const marks = new Map<string, Verdict>();
  let good = 0, early = 0, late = 0, miss = 0;

  notes.forEach((note, index) => {
    const at = note.start * secPerQuarter;
    const limit = window(index);
    let best = -1;
    let bestGap = Infinity;
    sorted.forEach((tap, tapIndex) => {
      if (used.has(tapIndex)) return;
      const gap = Math.abs(tap - at);
      if (gap <= limit && gap < bestGap) { best = tapIndex; bestGap = gap; }
    });
    if (best < 0) { marks.set(note.key, "miss"); miss++; return; }
    used.add(best);
    const offset = sorted[best] - at;
    if (Math.abs(offset) <= Math.min(ON_TIME, limit * 0.6)) { marks.set(note.key, "good"); good++; }
    else if (offset < 0) { marks.set(note.key, "early"); early++; }
    else { marks.set(note.key, "late"); late++; }
  });

  const extra = sorted.length - used.size;
  const total = notes.length || 1;
  const raw = (good + 0.6 * (early + late)) / total * 100 - extra * 3;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const stars = score >= 90 ? 3 : score >= 75 ? 2 : score >= 60 ? 1 : 0;
  return { marks, good, early, late, miss, extra, score, stars };
}
