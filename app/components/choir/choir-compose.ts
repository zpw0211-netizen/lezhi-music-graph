// 自己编合唱：高声部、低声部各写各的音、各填各的词，播放时高声部用钢琴、低声部用木吉他，
// 合起来就是一首二声部合唱，歌词由合唱队唱，再拿到下面分步练。这里放不依赖界面的部分：声部音域、音色、音块、
// 把作品变成播放器能读的 Melody 和合唱训练用的 ChoirPiece、写完后的提示、本机作品集。
import type { PartColor } from "../../lib/lesson/instrument-sampler";
import type { Melody, MelodyNote } from "../../lib/lesson/jianpu";
import { ALL_BLOCKS, barBeats, beatsOf, formatBeats, lyricSyllables, midiOfNote, type ComposeNote, type Meter } from "../compose/compose-model";
import type { ChoirPiece } from "./choir-model";

export type VoiceId = "high" | "low";
/**
 * Two parts, written in the middle register as the textbooks print them (the microphone check ignores the octave).
 * `low`–`high` is the range the palette offers (MIDI numbers, C4 = 60); `sound` is the instrument that plays the part,
 * different for each so the class can hear them apart. (The site's singers' voices cannot be used as samples: see their terms.)
 */
export const VOICES: Record<VoiceId, { label: string; instrument: string; low: number; high: number; clef: "treble" | "bass"; color: string; sound: PartColor }> = {
  high: { label: "高声部", instrument: "钢琴", low: 60, high: 79, clef: "treble", color: "#C8553D", sound: { timbre: "piano", pan: -0.2, level: 1 } },
  low: { label: "低声部", instrument: "木吉他", low: 55, high: 74, clef: "treble", color: "#2F7FA8", sound: { timbre: "guitar", pan: 0.2, level: 1.1 } },
};

export type EnsembleId = "duet";
export const ENSEMBLES: Record<EnsembleId, { label: string; caption: string; voices: VoiceId[] }> = {
  duet: { label: "二声部合唱", caption: "高声部 · 低声部", voices: ["high", "low"] },
};

export const CHOIR_METERS: Meter[] = ["2/4", "3/4", "4/4", "3/8", "6/8"];
export const CHOIR_BAR_COUNTS = [4, 8];

const NAMES = ["", "do", "re", "mi", "fa", "sol", "la", "si"];
export type VoiceBlock = { d: number; o: number; midi: number; name: string; color: string };
/** Every note of 1=C inside a voice's range, low to high. */
export function blocksFor(voice: VoiceId): VoiceBlock[] {
  const { low, high } = VOICES[voice];
  const blocks: VoiceBlock[] = [];
  for (let o = -3; o <= 2; o += 1) {
    for (let d = 1; d <= 7; d += 1) {
      const midi = midiOfNote({ d, o });
      if (midi >= low && midi <= high) blocks.push({ d, o, midi, name: NAMES[d], color: ALL_BLOCKS.find((block) => block.d === d)!.color });
    }
  }
  return blocks;
}

/** The block nearest to `previous` for a scale degree typed on the keyboard. */
export function nearestBlock(voice: VoiceId, d: number, previous?: Pick<ComposeNote, "d" | "o">) {
  const options = blocksFor(voice).filter((block) => block.d === d);
  if (!options.length) return undefined;
  const { low, high } = VOICES[voice];
  const anchor = previous && previous.d ? midiOfNote(previous) : (low + high) / 2;
  return options.reduce((best, block) => (Math.abs(block.midi - anchor) < Math.abs(best.midi - anchor) ? block : best));
}

export type ChoirWork = {
  id: string;
  title: string;
  author: string;
  ensemble: EnsembleId;
  meter: Meter;
  /** One row of bars per voice of the ensemble, in its order (highest first). */
  rows: ComposeNote[][][];
  /** The words each voice sings, by the same index; an empty entry borrows the top voice's words when the rhythm is the same. */
  words: string[];
  savedAt: number;
};

export const emptyRows = (ensemble: EnsembleId, bars: number) => ENSEMBLES[ensemble].voices.map(() => Array.from({ length: bars }, () => [] as ComposeNote[]));

export function blankWork(ensemble: EnsembleId = "duet", meter: Meter = "2/4", bars = 4): ChoirWork {
  return { id: "draft", title: "", author: "", ensemble, meter, rows: emptyRows(ensemble, bars), words: ENSEMBLES[ensemble].voices.map(() => ""), savedAt: 0 };
}

/**
 * The rest of a bar from beat `from` as rests a score can draw: a whole beat (a dotted quarter in 3/8 and 6/8)
 * wherever one starts on the beat, half beats to reach it.
 */
function restsFor(from: number, to: number, meter: Meter): MelodyNote[] {
  const beat = meter.endsWith("/8") ? 1.5 : 1;
  const rests: MelodyNote[] = [];
  let at = from;
  while (to - at > 1e-6) {
    const onBeat = Math.abs(at / beat - Math.round(at / beat)) < 1e-6;
    const b = onBeat && to - at >= beat - 1e-6 ? beat : Math.min(0.5, to - at);
    rests.push({ d: 0, b });
    at += b;
  }
  return rests;
}

const rhythmOf = (bars: ComposeNote[][]) => bars.map((bar) => bar.map((note) => `${note.d ? "n" : "r"}${note.b}`).join(",")).join("|");

/** Rows that have at least one note, with their voice. */
export function writtenRows(work: ChoirWork) {
  return ENSEMBLES[work.ensemble].voices.map((voice, index) => ({ voice, index, bars: work.rows[index] ?? [] })).filter((row) => row.bars.some((bar) => bar.length));
}

/**
 * What a voice sings: its own words, or the top written voice's words when it keeps the same rhythm.
 * `from` names the voice the words were borrowed from.
 */
export function wordsFor(work: ChoirWork, index: number): { text: string; from?: VoiceId } {
  const own = (work.words[index] ?? "").trim();
  if (own) return { text: own };
  const rows = writtenRows(work);
  const top = rows[0];
  if (!top || top.index === index) return { text: "" };
  const topText = (work.words[top.index] ?? "").trim();
  return topText && rhythmOf(work.rows[index] ?? []) === rhythmOf(top.bars) ? { text: topText, from: top.voice } : { text: "" };
}

/** Sung notes in a row (rests and empty bars left out). */
export const notesIn = (bars: ComposeNote[][]) => bars.flat().filter((note) => note.d).length;

/**
 * The work as a score the player reads: the written voices only, every bar filled up with rests so all voices line up,
 * bars after the last written one left out, each voice with its words.
 */
export function toChoirMelody(work: ChoirWork): Melody | null {
  const rows = writtenRows(work);
  if (!rows.length) return null;
  const beats = beatsOf(work.meter);
  const length = Math.max(...rows.map((row) => row.bars.reduce((last, bar, index) => (bar.length ? index + 1 : last), 0)));
  const lines = rows.map((row) => {
    const words = lyricSyllables(wordsFor(work, row.index).text);
    let w = 0;
    return Array.from({ length }, (_, index) => {
      const bar = row.bars[index] ?? [];
      const notes = bar.map((note) => {
        const out: MelodyNote = { d: note.d, b: note.b };
        if (note.o) out.o = note.o;
        if (note.d && words[w]) out.lyric = words[w++];
        return out;
      });
      return [...notes, ...restsFor(barBeats(bar), beats, work.meter)];
    });
  });
  const labels = rows.map((row) => VOICES[row.voice].label);
  return {
    title: work.title.trim() || "我的合唱",
    key: "1=C",
    tonic: "C",
    tonicMidi: 60,
    meter: work.meter,
    bpm: work.meter === "3/4" ? 88 : work.meter.endsWith("/8") ? 60 : 76,
    source: "自己编的合唱",
    bars: lines[0],
    ...(lines.length > 1 ? { label: labels[0], voices: lines.slice(1).map((bars, k) => ({ label: labels[k + 1], bars })) } : {}),
    staff: rows.map((row) => ({ clef: VOICES[row.voice].clef, octave: 0 })),
  };
}

/** A short fingerprint of the notes, so practice results are cleared as soon as the music changes. */
function fingerprint(text: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16);
}

/** The work as a piece for the practice panel, once at least two voices have notes. */
export function toChoirPiece(work: ChoirWork): ChoirPiece | null {
  const melody = toChoirMelody(work);
  const rows = writtenRows(work);
  if (!melody || rows.length < 2) return null;
  const labels = rows.map((row) => VOICES[row.voice].label);
  return {
    id: `mine|${fingerprint(JSON.stringify([work.ensemble, work.meter, work.rows, work.words]))}`,
    bookKey: "mine",
    bookName: "我的合唱",
    work: melody.title ?? "我的合唱",
    melody,
    labels,
    parts: labels.map((label, index) => ({ index, label, sung: false })),
    colors: rows.map((row) => VOICES[row.voice].sound),
  };
}

export type ChoirHint = { tone: "good" | "tip" | "todo"; text: string };

/** What sounds at `beat` in one row: the MIDI number, or null for a rest or an unwritten stretch. */
function soundingAt(bars: ComposeNote[][], beats: number, beat: number) {
  const bar = bars[Math.floor(beat / beats + 1e-9)];
  if (!bar) return null;
  let at = Math.floor(beat / beats + 1e-9) * beats;
  for (const note of bar) {
    if (beat >= at - 1e-9 && beat < at + note.b - 1e-9) return note.d ? midiOfNote(note) : null;
    at += note.b;
  }
  return null;
}

/** Plain facts about the work, phrased as something to try; never a grade. */
export function choirHints(work: ChoirWork): ChoirHint[] {
  const voices = ENSEMBLES[work.ensemble].voices;
  const beats = beatsOf(work.meter);
  const hints: ChoirHint[] = [];
  const written = writtenRows(work);
  if (!written.length) return [{ tone: "todo", text: `先选一个声部，点下面的音块写第一小节。通常先写${VOICES[voices[0]].label}的旋律，再给其他声部配音。` }];
  if (written.length < 2) hints.push({ tone: "todo", text: `再写一个声部，就能在下面合起来听、分声部练了。` });

  const barCount = work.rows[0]?.length ?? 0;
  voices.forEach((voice, index) => {
    const bars = work.rows[index] ?? [];
    if (!bars.some((bar) => bar.length)) return;
    const missing = bars.reduce((sum, bar) => sum + Math.max(0, beats - barBeats(bar)), 0);
    if (missing > 1e-6) hints.push({ tone: "todo", text: `${VOICES[voice].label}还差 ${formatBeats(missing, work.meter)}才写满 ${barCount} 小节，没写的地方会按休止来唱。` });
  });

  // 声部交叉：两个声部同时出声时，低声部比高声部还高。
  const step = work.meter.endsWith("/8") ? 0.5 : 0.25;
  outer: for (let k = 0; k + 1 < voices.length; k += 1) {
    for (let beat = 0; beat < barCount * beats - 1e-9; beat += step) {
      const upper = soundingAt(work.rows[k] ?? [], beats, beat);
      const lower = soundingAt(work.rows[k + 1] ?? [], beats, beat);
      if (upper != null && lower != null && lower > upper) {
        hints.push({ tone: "tip", text: `第 ${Math.floor(beat / beats) + 1} 小节${VOICES[voices[k + 1]].label}唱得比${VOICES[voices[k]].label}还高（声部交叉），合起来时容易听不清谁是旋律，可以把它往下挪一挪。` });
        break outer;
      }
    }
  }

  // 结尾：所有写了的声部都写满、并且都以一个音（不是休止）结束时，看最后一个和声。
  const complete = written.length >= 2 && written.every((row) => row.bars.every((bar) => Math.abs(barBeats(bar) - beats) < 1e-6));
  const finals = written.map((row) => row.bars.at(-1)?.at(-1));
  if (complete && finals.every((note) => note && note.d)) {
    const lowest = finals.at(-1)!;
    const triad = finals.every((note) => [1, 3, 5].includes(note!.d));
    if (triad && lowest.d === 1) {
      hints.push({ tone: "good", text: "最后一个和声由 do、mi、sol 组成，最低的声部落在 do 上，结束得很稳。" });
    } else if (lowest.d !== 1) {
      hints.push({ tone: "tip", text: `最低的${VOICES[written.at(-1)!.voice].label}最后落在 ${lowest.d} 上，试试让它落在 do，听听结束感有什么不同。` });
    } else {
      hints.push({ tone: "tip", text: "最后一个和声里有 do、mi、sol 以外的音，听起来还没结束。试试让每个声部都落在 do、mi、sol 上。" });
    }
  }

  // 填词：每个有词的声部，字数和音数对一对。
  for (const row of written) {
    const { text, from } = wordsFor(work, row.index);
    const syllables = lyricSyllables(text).length;
    if (!syllables || from) continue;
    const notes = notesIn(row.bars);
    const label = VOICES[row.voice].label;
    if (syllables === notes) hints.push({ tone: "good", text: `${label}的词和音一字一音，正好对上。` });
    else hints.push({ tone: "tip", text: `${label}的词有 ${syllables} 个字，音有 ${notes} 个（休止符不算），${syllables > notes ? "多出来的字唱不出来" : "后面几个音没有词"}，可以再对一对。` });
  }
  return hints;
}

const WORKS = "yapu-choir-works";
const DRAFT = "yapu-choir-draft";

/** A stored work in today's shape, or null; works saved before each voice had its own words carry one line for the top voice. */
function readWork(value: unknown): ChoirWork | null {
  const work = value as ChoirWork & { lyrics?: string };
  if (!work || typeof work !== "object" || !(work.ensemble in ENSEMBLES) || !CHOIR_METERS.includes(work.meter) || !Array.isArray(work.rows)) return null;
  const count = ENSEMBLES[work.ensemble].voices.length;
  if (work.rows.length !== count) return null;
  const words = Array.from({ length: count }, (_, index) => (Array.isArray(work.words) && typeof work.words[index] === "string" ? work.words[index] : ""));
  if (!Array.isArray(work.words) && typeof work.lyrics === "string") words[0] = work.lyrics;
  return { id: String(work.id ?? "draft"), title: String(work.title ?? ""), author: String(work.author ?? ""), ensemble: work.ensemble, meter: work.meter, rows: work.rows, words, savedAt: Number(work.savedAt) || 0 };
}

export function loadChoirWorks(): ChoirWork[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WORKS) ?? "[]");
    return Array.isArray(parsed) ? parsed.flatMap((item) => readWork(item) ?? []) : [];
  } catch {
    return [];
  }
}

export function storeChoirWorks(works: ChoirWork[]) {
  try {
    window.localStorage.setItem(WORKS, JSON.stringify(works.slice(0, 30)));
    return true;
  } catch {
    return false;
  }
}

export function loadDraft(): ChoirWork | null {
  try {
    return readWork(JSON.parse(window.localStorage.getItem(DRAFT) ?? "null"));
  } catch {
    return null;
  }
}

export function storeDraft(work: ChoirWork) {
  try { window.localStorage.setItem(DRAFT, JSON.stringify(work)); } catch { /* private mode: the draft just isn't kept */ }
}
