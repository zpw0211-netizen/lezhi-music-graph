// Export lyric melodies for the singer (scripts/vocal/synth.py).
//   npx tsx scripts/vocal/export.ts missing [out.json]   melodies with lyrics but no matching vocal (default)
//   npx tsx scripts/vocal/export.ts voiced  [out.json]   melodies that have a vocal (for audit.py)
//   npx tsx scripts/vocal/export.ts keys k1 k2 …         these fingerprints only (to re-sing), written to .vocal/work/keys.json
//   npx tsx scripts/vocal/export.ts parts [out.json]     choral parts for the male voice: lower parts without a recording
//                                                        (and main lines labelled 男…), each with "voice": "ria" | "qixuan"
// Covers every book's transcriptions and the book-agnostic key melodies; staff editions as they show them
// (their own transcriptions, and jianpu excerpts moved to the key the staff textbook prints).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { BOOK_MELODIES, MELODIES, melodiesFor } from "../../app/lib/lesson/melodies";
import { STAFF_KEYS } from "../../app/lib/lesson/staff-key-data";
import { midiOf, type Melody, type MelodyNote } from "../../app/lib/lesson/jianpu";
import { findVocal, vocalKey } from "../../app/lib/lesson/vocal";

// Left without a voice on purpose (none at present; 人教一上《小兔子乖乖》 was here until 2026-10-28).
const SKIP = new Set<string>([]);

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
const sungWord = (note: MelodyNote) => !!note.lyric && /[\p{Script=Han}A-Za-z]/u.test(note.lyric);
const pitched = (note: MelodyNote) => note.d > 0 && note.d < 8;
/** Onsets (in beats) of the syllable-bearing notes: a part with the main line's rhythm can borrow its words. */
const onsets = (bars: MelodyNote[][]) => {
  let t = 0;
  const out: string[] = [];
  for (const note of bars.flat()) { if (pitched(note) && !note.tie && !note.slur) out.push(t.toFixed(4)); t += note.b; }
  return out.join(",");
};
// Not choral voices: instruments, clapping, cues.
const NOT_SUNG = /打击|拍手|拟声|伴奏|左手|右手|钢琴|铝板琴|竖笛|器乐|前奏|应答句|括号|和弦/;
/** Lower parts are the men's (Ria) unless marked for women; a main line marked 男 is the men's too. */
const singerOf = (label: string | undefined, part: number) => (/女/.test(label ?? "") ? "qixuan" : /男/.test(label ?? "") || part > 0 ? "ria" : "qixuan");

const visitParts = (book: string, name: string, melody: Melody, index: number) => {
  const main = melody.bars.flat();
  if (!main.some(sungWord)) return;
  const parts = [{ label: melody.label, bars: melody.bars }, ...(melody.voices ?? [])];
  parts.forEach((line, part) => {
    if (part === 0 && singerOf(line.label, 0) !== "ria") return;
    if (!line.bars.flat().some(pitched) || NOT_SUNG.test(line.label ?? "")) return;
    const key = vocalKey(melody, part);
    if (seen.has(key)) return;
    seen.add(key);
    if (part > 0 ? findVocal(melody, part) : findVocal(melody)?.singer === "ria") return;
    const notes = line.bars.flat();
    let words = notes;
    if (!notes.some(sungWord)) {
      if (onsets(line.bars) !== onsets(melody.bars)) return; // own rhythm and no words: cannot be sung reliably
      // borrow the main line's syllables note for note
      const syllables = main.filter((note) => pitched(note) && !note.tie && !note.slur).map((note) => note.lyric);
      let k = 0;
      words = notes.map((note) => (pitched(note) && !note.tie && !note.slur ? { ...note, lyric: syllables[k++] } : note));
    }
    // In a choral part a note without a syllable right after a sung one ("~" in its lyrics) carries that syllable on.
    let held = false;
    const melisma = words.map((note) => {
      if (!pitched(note)) { held = false; return false; }
      if (note.lyric) { held = true; return false; }
      return held && !note.inst && !note.tie && !note.slur;
    });
    out.push({
      key, book, name, index, part, label: line.label ?? "", voice: singerOf(line.label, part), bpm: melody.bpm, meter: melody.meter,
      notes: words.map((note, i) => ({ d: note.d, b: note.b, midi: pitched(note) ? midiOf(melody, note) : null, lyric: note.lyric ?? null, slur: !!note.slur || melisma[i], tie: !!note.tie })),
    });
  });
};

const each = (fn: typeof visit) => {
  for (const [book, works] of Object.entries(BOOK_MELODIES)) {
    // staff books: as the staff edition shows them (its own transcriptions, moved to the key it prints)
    if (book.startsWith("wx-")) for (const name of Object.keys(works)) melodiesFor(book, name).forEach((melody, index) => fn(book, name, melody, index));
    else for (const [name, melodies] of Object.entries(works)) melodies.forEach((melody, index) => fn(book, name, melody, index));
  }
  for (const [name, melodies] of Object.entries(MELODIES)) melodies.forEach((melody, index) => fn("key", name, melody, index));
  // jianpu excerpts the staff edition prints in another key: a different fingerprint, so a recording of their own
  for (const [entry, value] of Object.entries(STAFF_KEYS)) {
    if (!("key" in value)) continue;
    const [book, work] = entry.split("|");
    melodiesFor(`wx-${book}`, work, `《${work}》`).forEach((melody, index) => fn(`wx-${book}`, work, melody, index));
  }
};
each(mode === "parts" ? visitParts : visit);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(out));
console.log(`${out.length} melodies → ${outPath}`);
