// 合唱训练的曲目：本版本各册课本里印出两个以上可唱声部的谱例。
// 器乐、前奏、打击乐这类声部不算可唱声部，但播放时照常作为伴奏响起。
import { EDITION, PUBLISHED_BOOKS } from "../../lib/app/books";
import type { PartColor } from "../../lib/lesson/instrument-sampler";
import { midiOf, type Melody } from "../../lib/lesson/jianpu";
import { BOOK_MELODIES, melodiesFor } from "../../lib/lesson/melodies";
import { IN_TUNE_CENTS, centsOff } from "../../lib/lesson/pitch";
import { findVocal } from "../../lib/lesson/vocal";

export type ChoirPart = { index: number; label: string; sung: boolean };
export type ChoirPiece = {
  id: string;
  bookKey: string;
  bookName: string;
  work: string;
  excerpt?: string;
  melody: Melody;
  /** Every line in the score (main line first); `parts` lists the ones a class can sing. */
  labels: string[];
  parts: ChoirPart[];
  /** A choir voice for each line, so the parts sound different (自己编的合唱). */
  colors?: PartColor[];
};

const INSTRUMENTAL = /器乐|前奏|间奏|尾奏|伴奏|打击/;
const bare = (name: string) => name.replace(/^《|》$/g, "");
const pitched = (bars: Melody["bars"]) => bars.some((bar) => bar.some((note) => note.d >= 1 && note.d <= 7));
const withWords = (bars: Melody["bars"]) => bars.some((bar) => bar.some((note) => note.lyric));
const melodyBook = (key: string) => (EDITION.notation === "staff" ? `wx-${key}` : key);

let cache: ChoirPiece[] | null = null;
export function choirPieces(): ChoirPiece[] {
  if (cache) return cache;
  const pieces: ChoirPiece[] = [];
  for (const book of PUBLISHED_BOOKS) {
    const key = melodyBook(book.key);
    const names = new Set([...Object.keys(BOOK_MELODIES[key] ?? {}), ...Object.keys(BOOK_MELODIES[book.key] ?? {})]);
    for (const name of names) {
      melodiesFor(key, name).forEach((melody, excerpt) => {
        if (melody.quality === "draft" || !melody.voices?.length) return;
        const lines = [melody.bars, ...melody.voices.map((voice) => voice.bars)];
        const labels = [melody.label ?? "第一声部", ...melody.voices.map((voice) => voice.label)];
        const parts = lines.flatMap((bars, index) =>
          !INSTRUMENTAL.test(labels[index]) && pitched(bars) && (withWords(bars) || (index > 0 && withWords(melody.bars)))
            ? [{ index, label: labels[index], sung: !!findVocal(melody, index) }]
            : []);
        if (parts.length < 2) return;
        pieces.push({ id: `${book.key}|${bare(name)}|${excerpt}`, bookKey: book.key, bookName: book.shortName, work: bare(name), excerpt: melody.title, melody, labels, parts });
      });
    }
  }
  cache = pieces;
  return pieces;
}

/** One note of a part to sing: from beat `start` to `end` (ties merged), rests left out. */
export type TargetNote = { start: number; end: number; midi: number; lyric?: string };

export function targetNotes(melody: Melody, part: number): TargetNote[] {
  const bars = part ? melody.voices?.[part - 1]?.bars ?? [] : melody.bars;
  const notes: TargetNote[] = [];
  let beat = 0;
  for (const note of bars.flat()) {
    const last = notes.at(-1);
    if (note.tie && last && last.end === beat) last.end += note.b;
    else if (note.d >= 1 && note.d <= 7) notes.push({ start: beat, end: beat + note.b, midi: midiOf(melody, note), lyric: note.lyric });
    beat += note.b;
  }
  return notes;
}

/** One pitch reading from the microphone, placed on the song's beat grid. */
export type Reading = { beat: number; midi: number };
export type Verdict = "ok" | "high" | "low" | "none";

/**
 * Judge each note on the middle of its length: the edges blur with breath, slides and the speakers' delay.
 * The median of the readings there decides, octave ignored (see centsOff).
 */
export function judge(notes: TargetNote[], readings: Reading[]): Verdict[] {
  return notes.map((note) => {
    const length = note.end - note.start;
    const from = note.start + Math.min(0.25 * length, 0.5);
    const to = note.end - Math.min(0.15 * length, 0.3);
    const cents = readings.filter((reading) => reading.beat >= from && reading.beat <= to).map((reading) => centsOff(reading.midi, note.midi)).sort((a, b) => a - b);
    if (cents.length < 2) return "none";
    const median = cents[Math.floor(cents.length / 2)];
    return Math.abs(median) <= IN_TUNE_CENTS ? "ok" : median > 0 ? "high" : "low";
  });
}

/** The sung pitch moved to the octave nearest the target, so a voice an octave lower draws on the same line. */
export const foldTo = (midi: number, target: number) => target + centsOff(midi, target) / 100;

/** The practice steps: hear the whole choir, then the three steps for my part. How loud my part and the other parts are. */
export const STEPS = [
  { id: "all", label: "听合唱", caption: "所有声部一起唱，先听听合起来的样子", mine: 1, others: 1 },
  { id: "listen", label: "听一听", caption: "只放我的声部", mine: 1, others: 0 },
  { id: "along", label: "跟着唱", caption: "范唱变轻，其他声部照常", mine: 0.3, others: 1 },
  { id: "alone", label: "独立唱", caption: "我的声部静音，只听别人", mine: 0, others: 1 },
] as const;
export type StepId = typeof STEPS[number]["id"];
