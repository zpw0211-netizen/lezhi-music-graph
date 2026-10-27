// Export lyric melodies for the singer (scripts/vocal/synth.py).
//   npx tsx scripts/vocal/export.ts missing [out.json]   melodies with lyrics but no matching vocal (default)
//   npx tsx scripts/vocal/export.ts voiced  [out.json]   melodies that have a vocal (for audit.py)
//   npx tsx scripts/vocal/export.ts keys k1 k2 …         these fingerprints only (to re-sing), written to .vocal/work/keys.json
// Covers every book's transcriptions and the book-agnostic key melodies. Staff editions share the jianpu books' data.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { BOOK_MELODIES, MELODIES } from "../../app/lib/lesson/melodies";
import { midiOf, type Melody } from "../../app/lib/lesson/jianpu";
import { findVocal, vocalKey } from "../../app/lib/lesson/vocal";

// Left without a voice on purpose (an earlier decision; no sung pitch worth synthesizing).
const SKIP = new Set(["fb794de6" /* 人教一上 小兔子乖乖 */]);

const [mode = "missing", ...rest] = process.argv.slice(2);
const keys = mode === "keys" ? new Set(rest) : null;
const home = process.env.VOCAL_HOME ?? resolve(import.meta.dirname, "../../.vocal");
const outPath = mode === "keys" ? resolve(home, "work/keys.json") : rest[0] ?? resolve(home, `work/${mode}.json`);

const out: unknown[] = [];
const seen = new Set<string>();
const visit = (book: string, name: string, melody: Melody, index: number) => {
  const notes = melody.bars.flat();
  if (!notes.some((note) => note.lyric && /[\p{Script=Han}A-Za-z]/u.test(note.lyric))) return;
  const key = vocalKey(melody);
  if (seen.has(key)) return;
  seen.add(key);
  if (keys ? !keys.has(key) : SKIP.has(key) || (mode === "voiced") !== !!findVocal(melody)) return;
  out.push({
    key, book, name, index, bpm: melody.bpm, meter: melody.meter,
    notes: notes.map((note) => ({ d: note.d, b: note.b, midi: note.d > 0 && note.d < 8 ? midiOf(melody, note) : null, lyric: note.lyric ?? null, slur: !!note.slur, tie: !!note.tie })),
  });
};
for (const [book, works] of Object.entries(BOOK_MELODIES)) {
  if (book.startsWith("wx-")) continue;
  for (const [name, melodies] of Object.entries(works)) melodies.forEach((melody, index) => visit(book, name, melody, index));
}
for (const [name, melodies] of Object.entries(MELODIES)) melodies.forEach((melody, index) => visit("key", name, melody, index));

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(out));
console.log(`${out.length} melodies → ${outPath}`);
