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
import PEP_G1S1 from "./melodies-pep-g1s1";
import PEP_G1S2 from "./melodies-pep-g1s2";
import PEP_G2S1 from "./melodies-pep-g2s1";
import PEP_G2S2 from "./melodies-pep-g2s2";
import PEP_G3S1 from "./melodies-pep-g3s1";
import PEP_G3S2 from "./melodies-pep-g3s2";
import PEP_G4S1 from "./melodies-pep-g4s1";
import PEP_G5S1 from "./melodies-pep-g5s1";
import PEP_G6S1 from "./melodies-pep-g6s1";
import PEP_G7S1 from "./melodies-pep-g7s1";
import PEP_G7S2 from "./melodies-pep-g7s2";
import PEP_G8S1 from "./melodies-pep-g8s1";
import PEP_G8S2 from "./melodies-pep-g8s2";
import PEP_G9S1 from "./melodies-pep-g9s1";
import { DRAFT_MELODIES } from "./melodies-draft";
import type { Melody } from "./jianpu";

export type { Melody, MelodyNote } from "./jianpu";
export { checkMelody, displayMeter, jianpu, midiOf, notation } from "./jianpu";

const BOOKS: Array<[string, Record<string, Melody[]>]> = [
  ["g1s1", G1S1], ["g1s2", G1S2], ["g2s1", G2S1], ["g2s2", G2S2], ["g3s1", G3S1], ["g3s2", G3S2],
  ["g4s1", G4S1], ["g5s1", G5S1], ["g6s1", G6S1],
  ["g7s1", G7S1], ["g7s2", G7S2], ["g8s1", G8S1], ["g8s2", G8S2], ["g9s1", G9S1], ["g9s2", G9S2],
];
// People’s Education Press recordings stay keyed by edition so same-titled
// works cannot fall through to the People’s Music Publishing transcription.
// Keys drop the 《》 so they match the work names in the 人教版 textbook sources.
const pepKeys = (book: Record<string, Melody[]>) => Object.fromEntries(Object.entries(book).map(([name, melodies]) => [name.replace(/^《|》$/g, ""), melodies]));
/** 人教版 books whose transcriptions have been checked bar by bar against the pages; only these play on the site. */
export const PEP_REVIEWED_BOOKS = new Set<string>(["pep-g1s1", "pep-g1s2", "pep-g2s1", "pep-g2s2", "pep-g3s1", "pep-g3s2", "pep-g4s1", "pep-g5s1", "pep-g6s1", "pep-g7s1", "pep-g7s2", "pep-g8s1", "pep-g8s2", "pep-g9s1"]);
const PEP_BOOKS: Array<[string, Record<string, Melody[]>]> = ([["pep-g1s1", PEP_G1S1], ["pep-g1s2", PEP_G1S2], ["pep-g2s1", PEP_G2S1], ["pep-g2s2", PEP_G2S2], ["pep-g3s1", PEP_G3S1], ["pep-g3s2", PEP_G3S2], ["pep-g4s1", PEP_G4S1], ["pep-g5s1", PEP_G5S1], ["pep-g6s1", PEP_G6S1], ["pep-g7s1", PEP_G7S1], ["pep-g7s2", PEP_G7S2], ["pep-g8s1", PEP_G8S1], ["pep-g8s2", PEP_G8S2], ["pep-g9s1", PEP_G9S1]] as Array<[string, Record<string, Melody[]>]>).map(([key, book]) => [key, pepKeys(book)]);
const GRADE_LABELS: Record<string, string> = { "1": "一年级", "2": "二年级", "3": "三年级", "4": "四年级", "5": "五年级", "6": "六年级", "7": "七年级", "8": "八年级", "9": "九年级" };
export const PEP_MELODY_BOOKS = PEP_BOOKS.map(([key]) => {
  const match = key.match(/^pep-g(\d+)s([12])$/);
  if (!match) throw new Error(`Invalid PEP melody book key: ${key}`);
  const [, grade, semester] = match;
  const term = semester === "1" ? "上册" : "下册";
  return { key, grade: Number(grade), semester: term, title: `${GRADE_LABELS[grade]}${term}` };
});
/** Each book's own transcriptions. A work printed in several books (国歌, 草原上…) keeps each book's version apart. */
export const BOOK_MELODIES: Record<string, Record<string, Melody[]>> = Object.fromEntries([...BOOKS, ...PEP_BOOKS]);
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
  if (bookKey?.startsWith("pep-")) {
    if (!PEP_REVIEWED_BOOKS.has(bookKey)) return [];
    // 人教版的键不带《》；年表、地图等处传进来的是带《》的作品名，两种都要能查到。
    for (const name of names) {
      const own = BOOK_MELODIES[bookKey]?.[name.replace(/^《|》$/g, "")];
      if (own?.length) return own;
    }
    return [];
  }
  for (const name of names) {
    const own = bookKey ? BOOK_MELODIES[bookKey]?.[name] : undefined;
    if (own?.length) return KEY_MELODIES[name] ? [KEY_MELODIES[name], ...own] : own;
  }
  for (const name of names) if (MELODIES[name]?.length) return MELODIES[name];
  return [];
}
