// 乐句拼图：把一首课本歌曲按乐句切开（和跟唱用同一套分句规则），打乱，学生边听边排回原样。
// 这里放不依赖界面的部分：挑歌、切句、打乱、检查、拼好后说说这首歌的结构。
import { EDITION, PUBLISHED_BOOKS } from "../../lib/app/books";
import { midiOf, type Melody, type MelodyNote } from "../../lib/lesson/jianpu";
import { BOOK_MELODIES, melodiesFor } from "../../lib/lesson/melodies";
import { splitPhrases } from "../../lib/lesson/phrases";

export type PuzzleLevel = "words" | "score" | "ear";
export const PUZZLE_LEVELS: Array<{ id: PuzzleLevel; label: string; caption: string }> = [
  { id: "words", label: "看歌词", caption: "卡片上有谱和歌词" },
  { id: "score", label: "只看谱", caption: "卡片上没有歌词" },
  { id: "ear", label: "只靠听", caption: "卡片上什么都不写" },
];

/** 一句：在整首歌里的位置，各小节的音（乐句从小节中间开始时，第一小节只取后半）。 */
export type PuzzlePhrase = {
  index: number;
  bars: MelodyNote[][];
  startBeat: number;
  endBeat: number;
  /** 不看歌词的音符指纹：两句一模一样时，放哪个位置都算对。 */
  key: string;
  rhythm: string;
};
export type PuzzleSong = { id: string; bookKey: string; bookName: string; work: string; excerpt?: string; melody: Melody; phrases: PuzzlePhrase[] };

const bare = (name: string) => name.replace(/^《|》$/g, "");
const melodyBook = (key: string) => (EDITION.notation === "staff" ? `wx-${key}` : key);
const sung = (note: MelodyNote) => note.d >= 1 && note.d <= 7 && !note.inst;

/** 按 splitPhrases 切好，每句保留小节结构。 */
export function phrasesOf(melody: Melody): PuzzlePhrase[] {
  const flat = melody.bars.flatMap((bar, barIndex) => bar.map((note) => ({ note, barIndex })));
  return splitPhrases(melody.bars).map((phrase, index) => {
    const bars: MelodyNote[][] = [];
    let lastBar = -1;
    for (const { note, barIndex } of flat.slice(phrase.startNote, phrase.endNote)) {
      if (barIndex !== lastBar) { bars.push([]); lastBar = barIndex; }
      bars[bars.length - 1].push(note);
    }
    const notes = bars.flat();
    return {
      index, bars, startBeat: phrase.startBeat, endBeat: phrase.endBeat,
      key: notes.map((note) => `${note.d}.${note.o ?? 0}.${note.b}${note.tie ? "~" : ""}`).join(" "),
      rhythm: notes.map((note) => `${note.d ? "n" : "r"}${note.b}`).join(" "),
    };
  });
}

let cache: PuzzleSong[] | null = null;
/** 本版本各册里适合拼的歌：有歌词、校对过，能切成 3 到 8 句，每句不超过 6 小节。 */
export function puzzleSongs(): PuzzleSong[] {
  if (cache) return cache;
  const songs: PuzzleSong[] = [];
  for (const book of PUBLISHED_BOOKS) {
    const key = melodyBook(book.key);
    const names = new Set([...Object.keys(BOOK_MELODIES[key] ?? {}), ...Object.keys(BOOK_MELODIES[book.key] ?? {})]);
    for (const name of names) {
      melodiesFor(key, name).forEach((melody, excerpt) => {
        if (melody.quality === "draft" || melody.bars.length < 6 || melody.bars.length > 40) return;
        const notes = melody.bars.flat();
        if (notes.filter((note) => note.lyric).length < notes.filter(sung).length * 0.6) return;
        if (notes.some((note) => note.d === 9)) return;
        const phrases = phrasesOf(melody);
        if (phrases.length < 3 || phrases.length > 8) return;
        if (phrases.some((phrase) => phrase.bars.length > 6 || phrase.bars.flat().filter(sung).length < 3)) return;
        songs.push({ id: `${book.key}|${bare(name)}|${excerpt}`, bookKey: book.key, bookName: book.shortName, work: bare(name), excerpt: melody.title, melody, phrases });
      });
    }
  }
  cache = songs;
  return songs;
}

/** 打乱：保证不和原来的顺序一样（一模一样的两句交换不算打乱）。 */
export function shuffled(phrases: PuzzlePhrase[], random = Math.random): number[] {
  const order = phrases.map((phrase) => phrase.index);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (order.some((index, at) => phrases[index].key !== phrases[at].key)) return order;
  }
  return order;
}

/** 放在第 slot 个空位上的这句对不对：音符一样就算对。 */
export const fits = (phrases: PuzzlePhrase[], card: number, slot: number) => phrases[card].key === phrases[slot].key;

/** 拼好以后说说结构：哪几句一样、哪几句像、每句停在哪个音上。 */
export function structureOf(song: PuzzleSong): { letters: string[]; notes: string[] } {
  const { phrases, melody } = song;
  const NAMES = ["", "do", "re", "mi", "fa", "sol", "la", "si"];
  const head = (phrase: PuzzlePhrase) => { const list = phrase.key.split(" "); return list.slice(0, Math.max(3, Math.floor(list.length / 2))).join(" "); };
  const letters: string[] = [];
  const baseOf: number[] = [];
  let count = 0;
  phrases.forEach((phrase, index) => {
    const same = phrases.findIndex((other, k) => k < index && other.key === phrase.key);
    if (same >= 0) { letters.push(letters[same]); baseOf.push(baseOf[same]); return; }
    const like = phrases.findIndex((other, k) => k < index && !letters[k].endsWith("′") && (other.rhythm === phrase.rhythm || head(other) === head(phrase)));
    if (like >= 0) { letters.push(`${letters[like]}′`); baseOf.push(like); return; }
    letters.push(String.fromCharCode(65 + count++));
    baseOf.push(index);
  });

  const notes: string[] = [];
  const final = [...melody.bars.flat()].reverse().find(sung);
  const lastOf = (phrase: PuzzlePhrase) => [...phrase.bars.flat()].reverse().find(sung);
  const groups = new Map<string, number[]>();
  letters.forEach((letter, index) => groups.set(letter, [...(groups.get(letter) ?? []), index]));
  for (const [letter, list] of groups) if (list.length > 1 && !letter.endsWith("′")) notes.push(`第 ${list.map((k) => k + 1).join("、")} 句一模一样，是重复。`);
  letters.forEach((letter, index) => {
    if (!letter.endsWith("′") || phrases.findIndex((other) => other.key === phrases[index].key) !== index) return;
    const first = baseOf[index];
    const sameRhythm = phrases[index].rhythm === phrases[first].rhythm;
    notes.push(`第 ${index + 1} 句${sameRhythm ? `和第 ${first + 1} 句节奏一样，音高变了` : `开头像第 ${first + 1} 句，后面变了`}，是变化重复。`);
  });
  if (final) {
    const finalMidi = midiOf(melody, final);
    const home = phrases.map((phrase, index) => ({ index, last: lastOf(phrase) })).filter((item) => item.last && midiOf(melody, item.last) % 12 === finalMidi % 12);
    const name = NAMES[final.d];
    if (home.length) notes.push(`第 ${home.map((item) => item.index + 1).join("、")} 句停在 ${name} 上，和全曲最后一个音一样，听起来“回家了”。`);
    const open = phrases.map((phrase, index) => ({ index, last: lastOf(phrase) })).filter((item) => item.last && midiOf(melody, item.last) % 12 !== finalMidi % 12 && item.index < phrases.length - 1);
    if (open.length) notes.push(`第 ${open.map((item) => `${item.index + 1} 句停在 ${NAMES[item.last!.d]}`).join("、第 ")} 上，像话还没说完，要接着往下唱。`);
  }
  return { letters, notes };
}
