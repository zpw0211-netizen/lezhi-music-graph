// 旋律创编：学生用几个音写一段旋律。这里放不依赖界面的规则：年级设置、音块、时值、
// 节奏卡、问句开头、灵感小节、自动低音伴奏、把作品变成播放器能读的 Melody，以及写完后的温和提示。
import type { Melody, MelodyNote } from "../../lib/lesson/jianpu";

export type ComposeNote = { d: number; o: number; b: number };
export type Meter = "2/4" | "3/4" | "4/4" | "3/8" | "6/8";
export type PitchSet = "three" | "five" | "seven";
export type ComposeMode = "free" | "answer";
export type Level = "low" | "mid" | "high";

/** Length of a bar in quarter notes (the unit every note's `b` is counted in). */
export const beatsOf = (meter: Meter) => Number(meter[0]) * 4 / Number(meter[2]);
/** The note that counts as one beat: a quarter in x/4, an eighth in x/8. */
export const unitOf = (meter: Meter) => (meter.endsWith("/8") ? 0.5 : 1);

export const LEVELS: Record<Level, { label: string; caption: string; pitchSets: PitchSet[]; meters: Meter[]; barCounts: number[]; accompaniment: boolean }> = {
  low: { label: "低年级", caption: "一二年级", pitchSets: ["three", "five"], meters: ["2/4"], barCounts: [4], accompaniment: false },
  mid: { label: "中年级", caption: "三四年级", pitchSets: ["five"], meters: ["2/4", "3/4", "4/4", "3/8", "6/8"], barCounts: [4, 8], accompaniment: true },
  high: { label: "高年级·初中", caption: "五年级以上", pitchSets: ["five", "seven"], meters: ["2/4", "3/4", "4/4", "3/8", "6/8"], barCounts: [4, 8], accompaniment: true },
};

export type PitchBlock = { d: number; o: number; name: string; color: string };
const DO = { d: 1, o: 0, name: "do", color: "#C8553D" };
const RE = { d: 2, o: 0, name: "re", color: "#D98B2B" };
const MI = { d: 3, o: 0, name: "mi", color: "#C9A227" };
const FA = { d: 4, o: 0, name: "fa", color: "#7F9A2E" };
const SOL = { d: 5, o: 0, name: "sol", color: "#3E8E5A" };
const LA = { d: 6, o: 0, name: "la", color: "#2F7FA8" };
const SI = { d: 7, o: 0, name: "si", color: "#4B5BA8" };
const HIGH_DO = { d: 1, o: 1, name: "do", color: "#8E5BB0" };

export const PITCH_SETS: Record<PitchSet, { label: string; caption: string; blocks: PitchBlock[] }> = {
  three: { label: "三个音", caption: "mi sol la", blocks: [MI, SOL, LA] },
  five: { label: "五声音阶", caption: "do re mi sol la", blocks: [DO, RE, MI, SOL, LA, HIGH_DO] },
  seven: { label: "七声音阶", caption: "do re mi fa sol la si", blocks: [DO, RE, MI, FA, SOL, LA, SI, HIGH_DO] },
};
export const ALL_BLOCKS = PITCH_SETS.seven.blocks;
export const colorOf = (note: Pick<ComposeNote, "d" | "o">) =>
  ALL_BLOCKS.find((block) => block.d === note.d && block.o === note.o)?.color;

/** Note values offered for a meter, named by how many beats they last in it. */
export function durationsFor(meter: Meter) {
  return meter.endsWith("/8")
    ? [{ b: 0.5, name: "八分音符" }, { b: 1, name: "四分音符" }, { b: 1.5, name: "附点四分音符" }]
    : [{ b: 1, name: "四分音符" }, { b: 0.5, name: "八分音符" }, { b: 2, name: "二分音符" }];
}

/** 节奏卡：先定一个小节的节奏，再一个个填音高。 */
export const RHYTHM_CARDS: Record<Meter, number[][]> = {
  "2/4": [[1, 1], [0.5, 0.5, 1], [1, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5], [2]],
  "3/4": [[1, 1, 1], [0.5, 0.5, 1, 1], [1, 0.5, 0.5, 1], [2, 1], [1, 2]],
  "4/4": [[1, 1, 1, 1], [0.5, 0.5, 1, 1, 1], [1, 1, 2], [0.5, 0.5, 0.5, 0.5, 2], [2, 2]],
  "3/8": [[0.5, 0.5, 0.5], [1, 0.5], [0.5, 1], [1.5]],
  "6/8": [[0.5, 0.5, 0.5, 0.5, 0.5, 0.5], [1, 0.5, 1, 0.5], [1, 0.5, 1.5], [0.5, 0.5, 0.5, 1.5], [1.5, 1.5]],
};

/** 旋律接龙的问句：前两小节由系统给出，学生写后两小节作答句。 */
export const QUESTIONS: Record<Meter, Array<{ label: string; bars: ComposeNote[][] }>> = {
  "2/4": [
    { label: "问句一", bars: [[n(3), n(5)], [n(6), n(5)]] },
    { label: "问句二", bars: [[n(5), n(3)], [n(5, 0.5), n(6, 0.5), n(5)]] },
    { label: "问句三", bars: [[n(1), n(3)], [n(5, 2)]] },
  ],
  "3/4": [
    { label: "问句一", bars: [[n(3), n(5), n(6)], [n(5, 2), n(3)]] },
    { label: "问句二", bars: [[n(1), n(3), n(5)], [n(6, 2), n(5)]] },
  ],
  "4/4": [
    { label: "问句一", bars: [[n(3), n(5), n(6), n(5)], [n(3), n(5), n(6, 2)]] },
    { label: "问句二", bars: [[n(5), n(3), n(5, 0.5), n(6, 0.5), n(5)], [n(3), n(2), n(3, 2)]] },
  ],
  "3/8": [
    { label: "问句一", bars: [[n(3), n(5, 0.5)], [n(6), n(5, 0.5)]] },
    { label: "问句二", bars: [[n(1, 0.5), n(3, 0.5), n(5, 0.5)], [n(6, 1.5)]] },
  ],
  "6/8": [
    { label: "问句一", bars: [[n(3), n(5, 0.5), n(6), n(5, 0.5)], [n(3, 1.5), n(5, 1.5)]] },
    { label: "问句二", bars: [[n(5, 0.5), n(6, 0.5), n(5, 0.5), n(3), n(2, 0.5)], [n(3, 1.5), n(2, 1.5)]] },
  ],
};

/** 问句只用当前音块里有的音（三个音时不出现 do、re）。 */
export function questionsFor(meter: Meter, pitchSet: PitchSet) {
  const blocks = PITCH_SETS[pitchSet].blocks;
  const fits = QUESTIONS[meter].filter((q) => q.bars.flat().every((note) => !note.d || blocks.some((block) => block.d === note.d && block.o === note.o)));
  return fits.length ? fits : QUESTIONS[meter];
}

function n(d: number, b = 1, o = 0): ComposeNote {
  return { d, o, b };
}

export const barBeats = (bar: ComposeNote[]) => bar.reduce((sum, note) => sum + note.b, 0);

const SEMITONE = [0, 0, 2, 4, 5, 7, 9, 11];
export const midiOfNote = (note: Pick<ComposeNote, "d" | "o">) => 60 + SEMITONE[note.d] + 12 * note.o;

/** Height of a note in the editor's pitch staircase: 0 for the lowest block of the set. */
export function stepOf(note: Pick<ComposeNote, "d" | "o">, blocks: PitchBlock[]) {
  const index = blocks.findIndex((block) => block.d === note.d && block.o === note.o);
  if (index >= 0) return index / Math.max(1, blocks.length - 1);
  return Math.min(1, Math.max(0, (midiOfNote(note) - 60) / 12));
}

/** 灵感小节：在当前的音里按级进为主随机走一小节，接在前一个音后面。 */
export function inspireBar(previous: ComposeNote | undefined, blocks: PitchBlock[], meter: Meter, isLast: boolean, random = Math.random): ComposeNote[] {
  const pitched = blocks.filter((block) => block.d);
  let index = previous && previous.d
    ? Math.max(0, pitched.findIndex((block) => block.d === previous.d && block.o === previous.o))
    : Math.floor(random() * pitched.length);
  // 最后一小节一步步走回主音（三个音时回到 la），不在结尾突然大跳：音少的节奏卡只在离主音近时用。
  // 主音取离得近的那个 do（低 do 或高音 do）；三个音时回到 la。
  const homes = pitched.flatMap((block, i) => (block.d === 1 ? [i] : []));
  const home = homes.length ? homes.reduce((best, i) => (Math.abs(i - index) < Math.abs(best - index) ? i : best)) : pitched.length - 1;
  const distance = Math.abs(home - index);
  const fits = (card: number[]) => !isLast || (card.at(-1)! >= 1 && card.length * 2 >= distance);
  const cards = RHYTHM_CARDS[meter].filter(fits);
  const near = RHYTHM_CARDS[meter].filter((card) => card.length * 2 >= distance);
  const pool = cards.length ? cards : near.length ? near : RHYTHM_CARDS[meter];
  const rhythm = pool[Math.floor(random() * pool.length)];
  return rhythm.map((b, k) => {
    if (previous || k) {
      const move = [-2, -1, -1, 0, 1, 1, 2][Math.floor(random() * 7)];
      let next = Math.min(pitched.length - 1, Math.max(0, index + move));
      if (isLast) {
        const left = rhythm.length - 1 - k;
        if (Math.abs(home - next) > left) next = index + Math.sign(home - index) * Math.min(2, Math.max(0, Math.abs(home - index) - left));
        if (left === 0) next = home;
      }
      index = next;
    }
    return { d: pitched[index].d, o: pitched[index].o, b };
  });
}

/** Characters that take one note each; spaces and punctuation are skipped. */
export function lyricSyllables(text: string) {
  return [...text.replace(/[\s，。、！？；：,.!?;:“”"'‘’（）()《》—-]/g, "")];
}

/** 伴奏和弦：主、下属、属三和弦为主，再加 vi、ii 两个副三和弦，让低音更有变化。 */
const CHORDS = [
  { root: 1, tones: [1, 3, 5], bias: 0.3 },
  { root: 4, tones: [4, 6, 1], bias: 0.15 },
  { root: 5, tones: [5, 7, 2], bias: 0.15 },
  { root: 6, tones: [6, 1, 3], bias: 0 },
  { root: 2, tones: [2, 4, 6], bias: -0.05 },
] as const;
type Chord = (typeof CHORDS)[number];

/** 低音伴奏的织体：同一套和弦，换不同的走法。 */
export type BassStyle = "hold" | "broken" | "alberti" | "arpeggio" | "walking";
export const BASS_STYLES: Record<BassStyle, { label: string; caption: string }> = {
  hold: { label: "长音", caption: "每个和弦只拉一个长长的根音，最安静" },
  broken: { label: "分解和弦", caption: "根音、五音一拍一个，稳稳地走" },
  alberti: { label: "阿尔贝蒂低音", caption: "根音—五音—三音—五音，轻快地转" },
  arpeggio: { label: "琶音", caption: "根音、三音、五音一路往上爬" },
  walking: { label: "行进低音", caption: "一拍一个音，一步步走向下一个和弦" },
};

/** Chord roots sit in C3–E3 or F2–A2; a bass pitch is counted in scale steps (C4 = 1). */
const rootAt = (root: number) => root - (root <= 3 ? 7 : 14);
function bassAt(n: number, b: number): MelodyNote {
  const d = ((n - 1) % 7 + 7) % 7 + 1;
  const o = Math.floor((n - 1) / 7);
  return o ? { d, o, b } : { d, b };
}
/** A bass note counted in scale steps from the chord root (0 root, 2 third, 4 fifth, 7 octave). */
const bassNote = (root: number, steps: number, b: number) => bassAt(rootAt(root) + steps, b);

/** How well a chord fits the melody between two beats: time on chord tones, plus the note on the strong beat. */
function fitOf(chord: Chord, bar: ComposeNote[], from: number, to: number) {
  let at = 0;
  let score = chord.bias;
  for (const note of bar) {
    const start = at;
    at += note.b;
    if (!note.d) continue;
    const overlap = Math.min(at, to) - Math.max(start, from);
    if (overlap <= 1e-6) continue;
    const fits = (chord.tones as readonly number[]).includes(note.d);
    score += fits ? overlap : 0;
    if (Math.abs(start - from) < 1e-6) score += fits ? 0.5 : -0.5;
  }
  return score;
}

function pickChord(bar: ComposeNote[], from: number, to: number, prefer?: Chord, slack = 0) {
  const ranked = CHORDS.map((chord) => ({ chord, score: fitOf(chord, bar, from, to) })).sort((a, b) => b.score - a.score);
  if (prefer && ranked.find((item) => item.chord === prefer)!.score >= ranked[0].score - slack) return prefer;
  return ranked[0].chord;
}

/** 一段和弦（一小节，4/4、6/8 是半小节）按织体写成几个低音；next 是下一段和弦的根音，行进低音用它来接。 */
function bassFigure(style: BassStyle, root: number, length: number, compound: boolean, next?: number): MelodyNote[] {
  if (style === "hold") return [bassNote(root, 0, length)];
  if (style === "alberti" || style === "arpeggio") {
    const steps = style === "alberti" ? [0, 4, 2, 4, 2, 4] : [0, 2, 4, 7, 4, 2];
    return steps.slice(0, Math.round(length / 0.5)).map((step) => bassNote(root, step, 0.5));
  }
  // 八分音符为拍的拍子（3/8、6/8）：一长一短。
  if (compound) return [bassNote(root, 0, 1), bassNote(root, 4, 0.5)];
  if (style === "broken") return [0, 4, 7].slice(0, length).map((step) => bassNote(root, step, 1));
  // 行进低音：根音、三音（三拍子再加五音），最后一拍从旁边一级走向下一个根音。
  const notes = [0, 2, 4].slice(0, length).map((step) => rootAt(root) + step);
  if (next !== undefined && next !== root) {
    const target = rootAt(next);
    notes[notes.length - 1] = target > rootAt(root) ? target - 1 : target + 1;
  }
  return notes.map((n) => bassAt(n, 1));
}

/** 自动低音：按旋律给每小节（4/4、6/8 每半小节）配一个和弦，再按选的织体写成低音；开头配主和弦，倒数第二小节尽量用属和弦，最后回到主音。 */
export function bassLine(bars: ComposeNote[][], meter: Meter = "2/4", style: BassStyle = "broken"): MelodyNote[][] {
  const beats = beatsOf(meter);
  const halves = meter === "4/4" || meter === "6/8";
  const compound = meter.endsWith("/8");
  const [tonic, , dominant] = CHORDS;
  const half = beats / 2;
  const segments: Array<[number, number]> = halves ? [[0, half], [half, beats]] : [[0, beats]];
  // 先定每小节的和弦，再写音：行进低音要知道下一个和弦是什么。
  const plan = bars.map((bar, index) => {
    const filled = barBeats(bar);
    if (Math.abs(filled - beats) > 1e-6) return { partial: filled, roots: [pickChord(bar, 0, filled).root] };
    if (index === bars.length - 1) return { final: true, roots: [tonic.root] };
    return { roots: segments.map(([from, to], k) => {
      if (index === 0 && k === 0) return pickChord(bar, from, to, tonic, 1).root;
      if (index === bars.length - 2 && k === segments.length - 1) return pickChord(bar, from, to, dominant, 0.8).root;
      return pickChord(bar, from, to).root;
    }) };
  });
  return plan.map((item, index) => {
    if (item.partial !== undefined) return [bassNote(item.roots[0], 0, item.partial)];
    if (item.final) return [bassNote(tonic.root, 0, beats)];
    const [r0, r1] = item.roots;
    const after = plan[index + 1]?.roots[0];
    if (!halves) return bassFigure(style, r0, beats, compound, after);
    // 分解和弦在 4/4、6/8 里半小节不换和弦时，后半小节换个走法，不原样重复。
    if (style === "broken" && r1 === r0) {
      return compound
        ? [bassNote(r0, 0, 1), bassNote(r0, 4, 0.5), bassNote(r0, 2, 1), bassNote(r0, 4, 0.5)]
        : [bassNote(r0, 0, 1), bassNote(r0, 4, 1), bassNote(r0, 7, 1), bassNote(r0, 4, 1)];
    }
    if (style === "walking" && !compound && r1 === r0) {
      const notes = [0, 2, 4, 2].map((step) => rootAt(r0) + step);
      if (after !== undefined && after !== r0) notes[3] = rootAt(after) > rootAt(r0) ? rootAt(after) - 1 : rootAt(after) + 1;
      return notes.map((n) => bassAt(n, 1));
    }
    return [...bassFigure(style, r0, half, compound, r1), ...bassFigure(style, r1, half, compound, after)];
  });
}

export function toMelody(bars: ComposeNote[][], meter: Meter, lyrics: string, title: string, accompaniment: boolean, bassStyle: BassStyle = "broken"): Melody {
  const words = lyricSyllables(lyrics);
  let w = 0;
  const written = bars.filter((bar) => bar.length);
  const melodyBars: MelodyNote[][] = written.map((bar) => bar.map((note) => {
    const out: MelodyNote = { d: note.d, b: note.b };
    if (note.o) out.o = note.o;
    if (note.d && words[w]) out.lyric = words[w++];
    return out;
  }));
  return {
    title: title || "我的旋律",
    key: "1=C",
    tonic: "C",
    tonicMidi: 60,
    meter,
    bpm: meter === "3/4" ? 96 : meter.endsWith("/8") ? 66 : 84,
    source: "学生创编",
    bars: melodyBars,
    ...(accompaniment && written.length ? {
      label: "旋律",
      voices: [{ label: "低音伴奏", bars: bassLine(written, meter, bassStyle) }],
      staff: [undefined, { clef: "bass" as const }],
    } : {}),
  };
}

export type Hint = { tone: "good" | "tip" | "todo"; text: string };

/** Gentle feedback once the student writes: never a grade, always something to try. */
export function composeHints(bars: ComposeNote[][], meter: Meter, mode: ComposeMode, lyrics: string, lockedBars: number, pitchSet: PitchSet): Hint[] {
  const beats = beatsOf(meter);
  const hints: Hint[] = [];
  const remaining = bars.reduce((sum, bar) => sum + Math.max(0, beats - barBeats(bar)), 0);
  const written = bars.slice(lockedBars).flat();
  if (!written.length) {
    return [{ tone: "todo", text: mode === "answer" ? "先唱一唱前两小节的问句，再点下面的音块写答句。" : "点下面的音块，从第一小节开始写。每点一下就能听到这个音。" }];
  }
  if (remaining > 0) hints.push({ tone: "todo", text: `还差 ${formatBeats(remaining, meter)} 就写满 ${bars.length} 小节啦。` });

  const sounding = bars.flat().filter((note) => note.d);
  const last = sounding.at(-1);
  if (remaining === 0 && last) {
    if (last.d === 1) hints.push({ tone: "good", text: mode === "answer" ? "答句回到了 do，一问一答很完整。" : "结尾落在 do 上，听起来很安稳。" });
    else if (pitchSet === "three" && last.d === 6) hints.push({ tone: "good", text: "结尾落在 la 上，像童谣一样亲切。" });
    else if (last.d === 5) hints.push({ tone: "tip", text: pitchSet === "three" ? "结尾停在 sol，像一句还没说完的问句。想结束的话，试试让最后一个音落在 la。" : "结尾停在 sol，像一句还没说完的问句。想结束的话，试试让最后一个音落在 do。" });
    else hints.push({ tone: "tip", text: pitchSet === "three" ? "试试让最后一个音落在 la 或 sol，听听哪个更像“说完了”。" : "试试让最后一个音落在 do，旋律会更像“说完了”。" });
    const finalNote = bars.at(-1)?.at(-1);
    if (finalNote && finalNote.d && finalNote.b < Math.min(1, beats)) hints.push({ tone: "tip", text: "最后一个音可以拉长一点（一拍或两拍），结束感会更强。" });
  }

  // 大跳：相邻两个音相差五度以上，唱起来比较难。
  const flat = bars.flatMap((bar, barIndex) => bar.map((note) => ({ note, barIndex }))).filter(({ note }) => note.d);
  for (let i = lockedBars ? flat.findIndex(({ barIndex }) => barIndex >= lockedBars) : 1; i > 0 && i < flat.length; i += 1) {
    const jump = Math.abs(midiOfNote(flat[i].note) - midiOfNote(flat[i - 1].note));
    if (jump > 7) {
      hints.push({ tone: "tip", text: `第 ${flat[i].barIndex + 1} 小节有一个很大的跳进，唱起来有点难。可以在中间加一个音，让旋律一级一级走。` });
      break;
    }
  }

  // 重复与变化：同样的节奏出现两次，旋律更好记。
  const full = bars.filter((bar) => Math.abs(barBeats(bar) - beats) < 1e-6);
  const rhythmKey = (bar: ComposeNote[]) => bar.map((note) => note.b).join(",");
  const pitchKey = (bar: ComposeNote[]) => bar.map((note) => `${note.d}${note.o}`).join(",");
  const rhythms = full.map(rhythmKey);
  if (mode === "answer" && lockedBars && remaining === 0 && rhythmKey(bars[0]) === rhythmKey(bars[lockedBars])) {
    hints.push({ tone: "good", text: "答句开头和问句用了一样的节奏，前后呼应。" });
  } else if (full.length >= 3 && new Set(rhythms).size < rhythms.length) {
    hints.push({ tone: "good", text: "有的小节用了相同的节奏，旋律更好记、更好唱。" });
  }
  if (full.length >= 4 && new Set(full.map(pitchKey)).size === 1) {
    hints.push({ tone: "tip", text: "每个小节都一模一样，试试在重复里加一点变化。" });
  }

  const syllables = lyricSyllables(lyrics).length;
  if (syllables) {
    if (syllables === sounding.length) hints.push({ tone: "good", text: "歌词和音符一字一音，正好对上。" });
    else hints.push({ tone: "tip", text: `歌词有 ${syllables} 个字，音符有 ${sounding.length} 个（休止符不算），可以再对一对。` });
  }
  return hints;
}

/** "一拍", "半拍", "两拍半"… counted in the meter's own beat (an eighth in x/8). */
export function formatBeats(quarters: number, meter: Meter = "2/4") {
  const beats = quarters / unitOf(meter);
  const whole = Math.floor(beats + 1e-6);
  const half = beats - whole > 0.25;
  const words = ["", "一", "两", "三", "四", "五", "六"];
  if (!whole) return "半拍";
  return `${words[whole] ?? whole}拍${half ? "半" : ""}`;
}

/** How a note is written in jianpu text: dashes for long notes, a dot for dotted ones. */
export function noteShape(b: number) {
  return { eighth: b < 1, dotted: Math.abs(b - 1.5) < 1e-6 || Math.abs(b - 0.75) < 1e-6, dashes: b >= 2 ? Math.round(b) - 1 : 0 };
}

export type SavedWork = { id: string; title: string; author: string; meter: Meter; bars: ComposeNote[][]; lyrics: string; savedAt: number; accompaniment?: boolean; bassStyle?: BassStyle; level?: Level; pitchSet?: PitchSet };

/** 打开作品时要恢复的编辑设置。旧作品没存年级和音块，就按作品里用到的音和拍号推断。 */
export function setupOf(work: SavedWork): { level: Level; pitchSet: PitchSet } {
  const used = work.bars.flat().filter((note) => note.d);
  const needs: PitchSet = used.some((note) => note.d === 4 || note.d === 7) ? "seven"
    : used.some((note) => !PITCH_SETS.three.blocks.some((block) => block.d === note.d && block.o === note.o)) ? "five" : "three";
  const fits = (level: Level, pitchSet: PitchSet) => LEVELS[level].pitchSets.includes(pitchSet) && LEVELS[level].meters.includes(work.meter) && LEVELS[level].barCounts.includes(work.bars.length);
  const covers = (pitchSet: PitchSet) => used.every((note) => PITCH_SETS[pitchSet].blocks.some((block) => block.d === note.d && block.o === note.o));
  if (work.level && work.pitchSet && fits(work.level, work.pitchSet) && covers(work.pitchSet)) return { level: work.level, pitchSet: work.pitchSet };
  const order: PitchSet[] = needs === "three" ? ["three", "five", "seven"] : needs === "five" ? ["five", "seven"] : ["seven"];
  for (const pitchSet of order) {
    for (const level of ["low", "mid", "high"] as Level[]) if (fits(level, pitchSet)) return { level, pitchSet };
  }
  // 小节数对不上任何年级时，只按音和拍号挑。
  for (const pitchSet of order) {
    for (const level of ["low", "mid", "high"] as Level[]) if (LEVELS[level].pitchSets.includes(pitchSet) && LEVELS[level].meters.includes(work.meter)) return { level, pitchSet };
  }
  return { level: "high", pitchSet: "seven" };
}
const STORE = "yapu-compose-works";

export function loadWorks(): SavedWork[] {
  try {
    const raw = window.localStorage.getItem(STORE);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function storeWorks(works: SavedWork[]) {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(works.slice(0, 30)));
    return true;
  } catch {
    return false;
  }
}
