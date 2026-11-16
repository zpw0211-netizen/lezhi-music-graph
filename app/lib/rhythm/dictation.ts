// 节奏听写：出一条能听写的题，再一小节一小节对答案。
// A bar is right when every note starts at the same place and rings as long as in the
// question (a 二分音符 is not a 四分音符 plus a rest: the piano holds it), and no beat is left empty.

import { RHYTHM_PATTERNS, fitsMeter, generateRhythm, packBars, timeline, type Meter, type RhythmBar, type RhythmLevel } from "./patterns";

const EPS = 1e-6;
/** Durations in 48ths of a quarter note, so triplets and sixteenths compare exactly. */
const ticks = (quarters: number) => Math.round(quarters * 48);

/** The patterns a dictation draws on: this meter's family, up to the chosen level. */
export function dictationPool(meter: Meter, level: RhythmLevel): string[] {
  return RHYTHM_PATTERNS.filter((pattern) => pattern.level <= level && fitsMeter(pattern, meter)).map((pattern) => pattern.id);
}

/** What a bar sounds like: each note's onset and length inside the bar, plus the beats left unwritten. */
export function barSignature(bar: RhythmBar, meter: Meter): string {
  const notes = timeline([bar], meter).filter((token) => token.sounding).map((token) => `${ticks(token.start)}+${ticks(token.length)}`);
  return `${notes.join(",")}|${ticks(bar.empty)}`;
}

/** A question that can be heard and written: it starts on a note and every bar has at least one note. */
export function dictationQuestion(pool: string[], meter: Meter, barCount: number, random = Math.random): string[] {
  let ids: string[] = [];
  for (let attempt = 0; attempt < 60; attempt += 1) {
    ids = generateRhythm(pool, meter, barCount, random);
    const bars = packBars(ids, meter);
    const notes = timeline(bars, meter).filter((token) => token.sounding);
    const startsOnNote = notes.length > 0 && notes[0].start < EPS;
    const everyBarSounds = bars.every((_, index) => notes.some((token) => token.start >= index * meter.beats - EPS && token.start < (index + 1) * meter.beats - EPS));
    if (startsOnNote && everyBarSounds) return ids;
  }
  return ids;
}

/** Bar by bar, whether the written answer matches the question. */
export function gradeDictation(question: string[], answer: string[], meter: Meter): boolean[] {
  const want = packBars(question, meter);
  const got = packBars(answer, meter);
  return want.map((bar, index) => got[index] !== undefined && barSignature(got[index], meter) === barSignature(bar, meter));
}
