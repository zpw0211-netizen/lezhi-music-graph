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
/** firstBars：歌太长时只拼前这么多小节。 */
export type PuzzleSong = { id: string; bookKey: string; bookName: string; work: string; excerpt?: string; melody: Melody; phrases: PuzzlePhrase[]; firstBars?: number };

const bare = (name: string) => name.replace(/^《|》$/g, "");
const melodyBook = (key: string) => (EDITION.notation === "staff" ? `wx-${key}` : key);
const sung = (note: MelodyNote) => note.d >= 1 && note.d <= 7 && !note.inst;

type Range = { startNote: number; endNote: number; startBeat: number; endBeat: number };
type Flat = { note: MelodyNote; bar: number; beat: number }[];
const MAX_CARD_BARS = 6;
const MAX_MERGED_BARS = 8;
const MAX_CARDS = 8;
const MAX_BARS = 40;

function flatten(bars: MelodyNote[][]): Flat {
  const flat: Flat = [];
  let beat = 0;
  bars.forEach((bar, index) => bar.forEach((note) => { flat.push({ note, bar: index, beat }); beat += note.b; }));
  return flat;
}
const sungIn = (flat: Flat, range: Range) => flat.slice(range.startNote, range.endNote).filter((item) => sung(item.note)).length;
const barsIn = (flat: Flat, range: Range) => (range.endNote > range.startNote ? flat[range.endNote - 1].bar - flat[range.startNote].bar + 1 : 0);

/** 把一句从中间某个小节线切成两半：挑离中点最近、最好落在长音或休止后面的小节线；切不开返回 null。 */
function halve(flat: Flat, range: Range): [Range, Range] | null {
  const mid = (range.startBeat + range.endBeat) / 2;
  const length = range.endBeat - range.startBeat;
  let best: { cut: number; score: number } | null = null;
  for (let cut = range.startNote + 1; cut < range.endNote; cut += 1) {
    if (flat[cut].bar === flat[cut - 1].bar) continue;
    if (flat[cut].note.tie || flat[cut].note.slur) continue;
    const left = { ...range, endNote: cut, endBeat: flat[cut].beat };
    const right = { ...range, startNote: cut, startBeat: flat[cut].beat };
    if (sungIn(flat, left) < 3 || sungIn(flat, right) < 3) continue;
    const before = flat[cut - 1].note;
    const breath = before.d === 0 || before.inst || before.b >= 2;
    const score = Math.abs(flat[cut].beat - mid) - (breath ? length / 4 : 0);
    if (!best || score < best.score) best = { cut, score };
  }
  if (!best) return null;
  const at = flat[best.cut].beat;
  return [{ ...range, endNote: best.cut, endBeat: at }, { ...range, startNote: best.cut, startBeat: at }];
}

const join = (a: Range, b: Range): Range => ({ startNote: a.startNote, endNote: b.endNote, startBeat: a.startBeat, endBeat: b.endBeat });

/**
 * 把分好的乐句整理成 3 到 8 张纸条：太长的句子对半切，只有一两句的歌每句再切开，
 * 句子太多就把相邻的短句并成一张，还是太多就只拼前半首（在小节线上收住）。
 * 返回纸条范围和要拼的小节数；拼不了返回 null。
 */
export function cardRanges(bars: MelodyNote[][]): { ranges: Range[]; endBar: number } | null {
  const flat = flatten(bars);

  const cards: Range[] = splitPhrases(bars).map(({ startNote, endNote, startBeat, endBeat }) => ({ startNote, endNote, startBeat, endBeat }));
  // 太长的句子对半切。
  for (let guard = 0; guard < 40; guard += 1) {
    const index = cards.findIndex((card) => barsIn(flat, card) > MAX_CARD_BARS);
    if (index < 0) break;
    const halves = halve(flat, cards[index]);
    if (!halves) return null;
    cards.splice(index, 1, ...halves);
  }
  // 只有两三句：先切最长的那句，切到至少 3 张（长句子多时切到 4 张）。
  for (let guard = 0; guard < 8; guard += 1) {
    const longest = cards.reduce((best, card, index) => (barsIn(flat, card) > barsIn(flat, cards[best]) ? index : best), 0);
    const size = barsIn(flat, cards[longest]);
    if (!(cards.length < 3 || (cards.length < 4 && size >= 4))) break;
    const halves = size >= 2 ? halve(flat, cards[longest]) : null;
    if (!halves) break;
    cards.splice(longest, 1, ...halves);
  }
  if (cards.length < 3) return null;
  // 音太少的半句并到旁边较短的那句里。
  for (let guard = 0; guard < 20; guard += 1) {
    const index = cards.findIndex((card) => sungIn(flat, card) < 3);
    if (index < 0 || cards.length < 2) break;
    const other = index === 0 ? 1 : index === cards.length - 1 ? index - 1
      : cards[index - 1].endBeat - cards[index - 1].startBeat <= cards[index + 1].endBeat - cards[index + 1].startBeat ? index - 1 : index + 1;
    const [a, b] = other < index ? [other, index] : [index, other];
    cards.splice(a, 2, join(cards[a], cards[b]));
  }
  if (cards.some((card) => sungIn(flat, card) < 3)) return null;
  // 句子太多：把相邻、合起来最短的两句并成一张（每张不超过 8 小节）。
  while (cards.length > MAX_CARDS) {
    let pick = -1;
    let shortest = Infinity;
    for (let i = 0; i + 1 < cards.length; i += 1) {
      const merged = join(cards[i], cards[i + 1]);
      if (barsIn(flat, merged) > MAX_MERGED_BARS) continue;
      // 同样长时优先并 1+2、3+4 这样成对的句子。
      const beats = merged.endBeat - merged.startBeat + (i % 2 ? 0.01 : 0);
      if (beats < shortest) { shortest = beats; pick = i; }
    }
    if (pick < 0) break;
    cards.splice(pick, 2, join(cards[pick], cards[pick + 1]));
  }
  const lastBar = flat.length ? flat[flat.length - 1].bar + 1 : 0;
  if (cards.length <= MAX_CARDS && lastBar <= MAX_BARS) return { ranges: cards, endBar: lastBar };
  // 还是太长：只拼前半首。在小节线上收住，至少 4 张，优先停在全曲最后那个音上（听起来完整）。
  const final = [...flat].reverse().find((item) => sung(item.note));
  const lastSung = (card: Range) => flat.slice(card.startNote, card.endNote).reverse().find((item) => sung(item.note));
  let fallback = -1;
  let home = -1;
  for (let k = 4; k <= Math.min(MAX_CARDS, cards.length); k += 1) {
    const end = cards[k - 1].endNote;
    const atBarLine = end >= flat.length || flat[end].bar !== flat[end - 1].bar;
    const endBar = flat[end - 1].bar + 1;
    if (!atBarLine || endBar > MAX_BARS) continue;
    fallback = k;
    const last = lastSung(cards[k - 1]);
    if (final && last && last.note.d === final.note.d && (last.note.a ?? 0) === (final.note.a ?? 0)) home = k;
  }
  const k = home >= 0 ? home : fallback;
  if (k < 0) return null;
  return { ranges: cards.slice(0, k), endBar: flat[cards[k - 1].endNote - 1].bar + 1 };
}

/** 按纸条范围切好，每张保留小节结构。 */
export function phrasesOf(melody: Melody, ranges: Range[]): PuzzlePhrase[] {
  const flat = melody.bars.flatMap((bar, barIndex) => bar.map((note) => ({ note, barIndex })));
  return ranges.map((phrase, index) => {
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

/** 只拼前半首时，把谱子收到第 endBar 小节。 */
function trimmed(melody: Melody, endBar: number): Melody {
  if (endBar >= melody.bars.length) return melody;
  const marks = melody.marks && Object.fromEntries(Object.entries(melody.marks).filter(([bar]) => Number(bar) < endBar));
  return {
    ...melody, bars: melody.bars.slice(0, endBar), lyricWords: undefined, lyricsEnd: undefined, marks,
    voices: melody.voices?.map((voice) => ({ ...voice, bars: voice.bars.slice(0, endBar), lyricWords: undefined })),
  };
}

let cache: PuzzleSong[] | null = null;
/** 本版本各册里能拼的歌：校对过、有歌词、不少于 6 小节，能整理成 3 到 8 张纸条。 */
export function puzzleSongs(): PuzzleSong[] {
  if (cache) return cache;
  const songs: PuzzleSong[] = [];
  for (const book of PUBLISHED_BOOKS) {
    const key = melodyBook(book.key);
    const names = new Set([...Object.keys(BOOK_MELODIES[key] ?? {}), ...Object.keys(BOOK_MELODIES[book.key] ?? {})]);
    for (const name of names) {
      melodiesFor(key, name).forEach((melody, excerpt) => {
        if (melody.quality === "draft" || melody.bars.length < 6) return;
        const notes = melody.bars.flat();
        if (notes.filter((note) => note.lyric).length < notes.filter(sung).length * 0.6) return;
        if (notes.some((note) => note.d === 9)) return;
        const cut = cardRanges(melody.bars);
        if (!cut) return;
        const part = trimmed(melody, cut.endBar);
        const phrases = phrasesOf(part, cut.ranges);
        songs.push({ id: `${book.key}|${bare(name)}|${excerpt}`, bookKey: book.key, bookName: book.shortName, work: bare(name), excerpt: part !== melody && melody.title?.includes("全曲") ? undefined : melody.title, melody: part, phrases, firstBars: part === melody ? undefined : cut.endBar });
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
    if (home.length) notes.push(`第 ${home.map((item) => item.index + 1).join("、")} 句停在 ${name} 上，和${song.firstBars ? "这一段" : "全曲"}最后一个音一样，听起来“回家了”。`);
    const open = phrases.map((phrase, index) => ({ index, last: lastOf(phrase) })).filter((item) => item.last && midiOf(melody, item.last) % 12 !== finalMidi % 12 && item.index < phrases.length - 1);
    if (open.length) notes.push(`第 ${open.map((item) => `${item.index + 1} 句停在 ${NAMES[item.last!.d]}`).join("、第 ")} 上，像话还没说完，要接着往下唱。`);
  }
  return { letters, notes };
}
