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
import WX_G1S1 from "./melodies-wx-g1s1";
import WX_G1S2 from "./melodies-wx-g1s2";
import WX_G2S1 from "./melodies-wx-g2s1";
import WX_G2S2 from "./melodies-wx-g2s2";
import WX_G3S1 from "./melodies-wx-g3s1";
import WX_G3S2 from "./melodies-wx-g3s2";
import WX_G4S1 from "./melodies-wx-g4s1";
import WX_G5S1 from "./melodies-wx-g5s1";
import WX_G6S1 from "./melodies-wx-g6s1";
import WX_G7S1 from "./melodies-wx-g7s1";
import WX_G7S2 from "./melodies-wx-g7s2";
import WX_G8S1 from "./melodies-wx-g8s1";
import WX_G8S2 from "./melodies-wx-g8s2";
import WX_G9S1 from "./melodies-wx-g9s1";
import WX_G9S2 from "./melodies-wx-g9s2";
import WX_PEP_G1S1 from "./melodies-wx-pep-g1s1";
import WX_PEP_G1S2 from "./melodies-wx-pep-g1s2";
import WX_PEP_G2S1 from "./melodies-wx-pep-g2s1";
import WX_PEP_G2S2 from "./melodies-wx-pep-g2s2";
import WX_PEP_G3S1 from "./melodies-wx-pep-g3s1";
import WX_PEP_G3S2 from "./melodies-wx-pep-g3s2";
import WX_PEP_G4S1 from "./melodies-wx-pep-g4s1";
import WX_PEP_G5S1 from "./melodies-wx-pep-g5s1";
import WX_PEP_G6S1 from "./melodies-wx-pep-g6s1";
import WX_PEP_G7S1 from "./melodies-wx-pep-g7s1";
import WX_PEP_G7S2 from "./melodies-wx-pep-g7s2";
import WX_PEP_G8S1 from "./melodies-wx-pep-g8s1";
import WX_PEP_G8S2 from "./melodies-wx-pep-g8s2";
import WX_PEP_G9S1 from "./melodies-wx-pep-g9s1";
import { DRAFT_MELODIES } from "./melodies-draft";
import { STAFF_KEYS } from "./staff-key-data";
import { STAFF_PLACEMENT } from "./staff-placement-data";
import type { Melody } from "./jianpu";

export type { Melody, MelodyNote } from "./jianpu";
export { checkMelody, displayMeter, jianpu, midiOf, notation } from "./jianpu";

const BOOKS: Array<[string, Record<string, Melody[]>]> = [
  ["g1s1", G1S1], ["g1s2", G1S2], ["g2s1", G2S1], ["g2s2", G2S2], ["g3s1", G3S1], ["g3s2", G3S2],
  ["g4s1", G4S1], ["g5s1", G5S1], ["g6s1", G6S1],
  ["g7s1", G7S1], ["g7s2", G7S2], ["g8s1", G8S1], ["g8s2", G8S2], ["g9s1", G9S1], ["g9s2", G9S2],
];
const WX_BOOKS: Array<[string, Record<string, Melody[]>]> = [
  ["wx-g1s1", WX_G1S1], ["wx-g1s2", WX_G1S2], ["wx-g2s1", WX_G2S1], ["wx-g2s2", WX_G2S2], ["wx-g3s1", WX_G3S1], ["wx-g3s2", WX_G3S2],
  ["wx-g4s1", WX_G4S1], ["wx-g5s1", WX_G5S1], ["wx-g6s1", WX_G6S1],
  ["wx-g7s1", WX_G7S1], ["wx-g7s2", WX_G7S2], ["wx-g8s1", WX_G8S1], ["wx-g8s2", WX_G8S2], ["wx-g9s1", WX_G9S1], ["wx-g9s2", WX_G9S2],
];
// People’s Education Press recordings stay keyed by edition so same-titled
// works cannot fall through to the People’s Music Publishing transcription.
// Keys drop the 《》 so they match the work names in the 人教版 textbook sources.
const pepKeys = (book: Record<string, Melody[]>) => Object.fromEntries(Object.entries(book).map(([name, melodies]) => [name.replace(/^《|》$/g, ""), melodies]));
/** 人教版 books whose transcriptions have been checked bar by bar against the pages; only these play on the site. */
const REVIEWED_PEP_BOOK_KEYS = ["pep-g1s1", "pep-g1s2", "pep-g2s1", "pep-g2s2", "pep-g3s1", "pep-g3s2", "pep-g4s1", "pep-g5s1", "pep-g6s1", "pep-g7s1", "pep-g7s2", "pep-g8s1", "pep-g8s2", "pep-g9s1"];
export const PEP_REVIEWED_BOOKS = new Set<string>([...REVIEWED_PEP_BOOK_KEYS, ...REVIEWED_PEP_BOOK_KEYS.map((key) => `wx-${key}`)]);
const PEP_BOOKS: Array<[string, Record<string, Melody[]>]> = ([["pep-g1s1", PEP_G1S1], ["pep-g1s2", PEP_G1S2], ["pep-g2s1", PEP_G2S1], ["pep-g2s2", PEP_G2S2], ["pep-g3s1", PEP_G3S1], ["pep-g3s2", PEP_G3S2], ["pep-g4s1", PEP_G4S1], ["pep-g5s1", PEP_G5S1], ["pep-g6s1", PEP_G6S1], ["pep-g7s1", PEP_G7S1], ["pep-g7s2", PEP_G7S2], ["pep-g8s1", PEP_G8S1], ["pep-g8s2", PEP_G8S2], ["pep-g9s1", PEP_G9S1]] as Array<[string, Record<string, Melody[]>]>).map(([key, book]) => [key, pepKeys(book)]);
const WX_PEP_BOOKS: Array<[string, Record<string, Melody[]>]> = ([
  ["wx-pep-g1s1", WX_PEP_G1S1], ["wx-pep-g1s2", WX_PEP_G1S2], ["wx-pep-g2s1", WX_PEP_G2S1], ["wx-pep-g2s2", WX_PEP_G2S2], ["wx-pep-g3s1", WX_PEP_G3S1], ["wx-pep-g3s2", WX_PEP_G3S2],
  ["wx-pep-g4s1", WX_PEP_G4S1], ["wx-pep-g5s1", WX_PEP_G5S1], ["wx-pep-g6s1", WX_PEP_G6S1], ["wx-pep-g7s1", WX_PEP_G7S1], ["wx-pep-g7s2", WX_PEP_G7S2],
  ["wx-pep-g8s1", WX_PEP_G8S1], ["wx-pep-g8s2", WX_PEP_G8S2], ["wx-pep-g9s1", WX_PEP_G9S1],
] as Array<[string, Record<string, Melody[]>]>).map(([key, book]) => [key, pepKeys(book)]);
const GRADE_LABELS: Record<string, string> = { "1": "一年级", "2": "二年级", "3": "三年级", "4": "四年级", "5": "五年级", "6": "六年级", "7": "七年级", "8": "八年级", "9": "九年级" };
export const PEP_MELODY_BOOKS = PEP_BOOKS.map(([key]) => {
  const match = key.match(/^pep-g(\d+)s([12])$/);
  if (!match) throw new Error(`Invalid PEP melody book key: ${key}`);
  const [, grade, semester] = match;
  const term = semester === "1" ? "上册" : "下册";
  return { key, grade: Number(grade), semester: term, title: `${GRADE_LABELS[grade]}${term}` };
});
/** Each book's own transcriptions. A work printed in several books (国歌, 草原上…) keeps each book's version apart. */
export const BOOK_MELODIES: Record<string, Record<string, Melody[]>> = Object.fromEntries([...BOOKS, ...PEP_BOOKS, ...WX_BOOKS, ...WX_PEP_BOOKS]);
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

/** The melodies for a work as printed in one book; falls back to the book-agnostic table. Tries each name in turn.
 *  Staff editions (wx-*) also get the textbook's clef and octave for voices that differ from the default placement. */
export function melodiesFor(bookKey: string | undefined, ...names: string[]): Melody[] {
  const found = findMelodies(bookKey, names);
  if (!bookKey?.startsWith("wx-") || !found.name) return found.melodies;
  const prefix = `${bookKey.slice(3)}|${found.name.replace(/^《|》$/g, "")}|`;
  return found.melodies.map((melody, index) => {
    const key = STAFF_KEYS[prefix + index];
    const placed = STAFF_PLACEMENT[prefix + index];
    // The staff textbook prints this excerpt in another key (same jianpu, other pitches), or spells it with another signature.
    const keyed = !key ? melody : "key" in key ? { ...melody, key: key.key, tonic: key.key.replace(/^1=/, ""), tonicMidi: key.tonicMidi } : { ...melody, staffSignature: key.signature };
    return placed ? { ...keyed, staff: placed } : keyed;
  });
}

function findMelodies(bookKey: string | undefined, names: string[]): { melodies: Melody[]; name?: string } {
  if (bookKey?.startsWith("pep-") || bookKey?.startsWith("wx-pep-")) {
    const fallbackKey = bookKey.startsWith("wx-pep-") ? bookKey.slice(3) : bookKey;
    if (!PEP_REVIEWED_BOOKS.has(bookKey) && !PEP_REVIEWED_BOOKS.has(fallbackKey)) return { melodies: [] };
    // 人教版的键不带《》；年表、地图等处传进来的是带《》的作品名，两种都要能查到。
    for (const name of names) {
      const own = BOOK_MELODIES[bookKey]?.[name.replace(/^《|》$/g, "")];
      if (own?.length) return { melodies: own, name };
      const fallback = BOOK_MELODIES[fallbackKey]?.[name.replace(/^《|》$/g, "")];
      if (fallback?.length) return { melodies: fallback, name };
    }
    // 组名下收录的作品（如《草原上的歌》里的《快乐的牧羊人》）按段落标题找；
    // 键名带括注（《伏尔塔瓦河（片段）》）或课名多出调名前缀（《c小调第五（命运）交响曲》）的也算同一首。
    for (const name of names) {
      const bare = name.replace(/^《|》$/g, "");
      for (const key of [bookKey, fallbackKey]) {
        const book = BOOK_MELODIES[key] ?? {};
        const parts = Object.values(book).flat().filter((melody) => melody.title === bare);
        if (parts.length) return { melodies: parts };
        const near = Object.keys(book).find((title) => title.replace(/（[^）]*）$/, "") === bare || (title.length >= 4 && bare.endsWith(title)));
        if (near) return { melodies: book[near], name: near };
      }
    }
    return { melodies: [] };
  }
  const fallbackKey = bookKey?.startsWith("wx-") ? bookKey.slice(3) : bookKey;
  for (const name of names) {
    const own = bookKey ? BOOK_MELODIES[bookKey]?.[name] : undefined;
    if (own?.length) return { melodies: KEY_MELODIES[name] ? [KEY_MELODIES[name], ...own] : own, name };
    const fallback = fallbackKey ? BOOK_MELODIES[fallbackKey]?.[name] : undefined;
    if (fallback?.length) return { melodies: KEY_MELODIES[name] ? [KEY_MELODIES[name], ...fallback] : fallback, name };
  }
  for (const name of names) if (MELODIES[name]?.length) return { melodies: MELODIES[name] };
  return { melodies: [] };
}
