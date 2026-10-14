// Lesson melodies, hand-transcribed from the textbook scores. A work may have
// several excerpts (themes printed separately), each possibly with extra voices.
import { KEY_MELODIES } from "./melodies-key";
import G1S1 from "./melodies-g1s1";
import G1S2 from "./melodies-g1s2";
import G2S1 from "./melodies-g2s1";
import G2S2 from "./melodies-g2s2";
import G3S1 from "./melodies-g3s1";
import G3S2 from "./melodies-g3s2";
import G4S1 from "./melodies-g4s1";
import G5S1 from "./melodies-g5s1";
import G6S1 from "./melodies-g6s1";
import G7S1 from "./melodies-g7s1";
import G7S2 from "./melodies-g7s2";
import G8S1 from "./melodies-g8s1";
import G8S2 from "./melodies-g8s2";
import G9S1 from "./melodies-g9s1";
import G9S2 from "./melodies-g9s2";
import { DRAFT_MELODIES } from "./melodies-draft";
import type { Melody } from "./jianpu";

export type { Melody, MelodyNote } from "./jianpu";
export { checkMelody, jianpu, midiOf, notation } from "./jianpu";

const BOOKS: Array<[string, Record<string, Melody[]>]> = [
  ["g1s1", G1S1], ["g1s2", G1S2], ["g2s1", G2S1], ["g2s2", G2S2], ["g3s1", G3S1], ["g3s2", G3S2],
  ["g4s1", G4S1], ["g5s1", G5S1], ["g6s1", G6S1],
  ["g7s1", G7S1], ["g7s2", G7S2], ["g8s1", G8S1], ["g8s2", G8S2], ["g9s1", G9S1], ["g9s2", G9S2],
];
/** Each book's own transcriptions. A work printed in several books (国歌, 草原上…) keeps each book's version apart. */
export const BOOK_MELODIES: Record<string, Record<string, Melody[]>> = Object.fromEntries(BOOKS);
/** Book-agnostic lookup (律坊, fallbacks): the key melody plus the first book that prints the work. */
export const MELODIES: Record<string, Melody[]> = Object.fromEntries(Object.entries(KEY_MELODIES).map(([name, melody]) => [name, [melody]]));
const fromBook = new Set<string>();
for (const [, book] of BOOKS)
  for (const [name, segments] of Object.entries(book)) {
    if (fromBook.has(name)) continue;
    fromBook.add(name);
    MELODIES[name] = [...(MELODIES[name] ?? []), ...segments];
  }
for (const [name, segments] of Object.entries(DRAFT_MELODIES))
  if (!MELODIES[name]?.length) MELODIES[name] = segments;

/** The melodies for a work as printed in one book; falls back to the book-agnostic table. Tries each name in turn. */
export function melodiesFor(bookKey: string | undefined, ...names: string[]): Melody[] {
  for (const name of names) {
    const own = bookKey ? BOOK_MELODIES[bookKey]?.[name] : undefined;
    if (own?.length) return KEY_MELODIES[name] ? [KEY_MELODIES[name], ...own] : own;
  }
  for (const name of names) if (MELODIES[name]?.length) return MELODIES[name];
  return [];
}
