// 听音训练：九关题目的生成与判分，不依赖界面。唱名、音程、听写都在 C 大调里（1=C）；调式题用课本旋律的原调。
import { PITCH_SETS, midiOfNote, type PitchBlock, type PitchSet } from "../compose/compose-model";
import { midiOf, type Melody } from "../../lib/lesson/jianpu";
import { pentatonicMelodyMatch } from "../lab/pentatonic";

export type EarLevel = "duration" | "dynamics" | "timbre" | "updown" | "solfege" | "dictation" | "interval" | "chord" | "mode";
export type EarGroup = "low" | "mid" | "high";
export const ROUND = 10;

export const EAR_GROUPS: Array<{ id: EarGroup; label: string; caption: string }> = [
  { id: "low", label: "低年级", caption: "长短 强弱 音色 高低" },
  { id: "mid", label: "中年级", caption: "唱名 旋律" },
  { id: "high", label: "高年级·初中", caption: "音程 和弦 调式" },
];

export const EAR_LEVELS: Array<{ id: EarLevel; group: EarGroup; name: string; caption: string; grade: string }> = [
  { id: "duration", group: "low", name: "听长短", caption: "两个音哪个长", grade: "低年级" },
  { id: "dynamics", group: "low", name: "听强弱", caption: "声音变强还是变弱", grade: "低年级" },
  { id: "timbre", group: "low", name: "听音色", caption: "这是什么乐器在演奏", grade: "低中年级" },
  { id: "updown", group: "low", name: "听高低", caption: "第二个音更高还是更低", grade: "低年级" },
  { id: "solfege", group: "mid", name: "听唱名", caption: "听出是 do re mi 里的哪个音", grade: "中低年级" },
  { id: "dictation", group: "mid", name: "旋律听写", caption: "听一小段旋律，用音块写下来", grade: "中高年级" },
  { id: "interval", group: "high", name: "听音程", caption: "两个音相隔几度", grade: "高年级·初中" },
  { id: "chord", group: "high", name: "听和弦", caption: "大三和弦还是小三和弦", grade: "高年级·初中" },
  { id: "mode", group: "high", name: "听调式", caption: "宫调式还是羽调式", grade: "高年级·初中" },
];

export type Tone = { d: number; o: number };
export type UpDown = "up" | "down" | "same";
export type LongShort = "first" | "second" | "same";
export type Loudness = "louder" | "softer" | "same" | "cresc" | "dim";
export type ChordQuality = "major" | "minor" | "aug" | "dim";
export type ModeId = "gong" | "shang" | "jue" | "zhi" | "yu";
/** One note to play: MIDI, start beat, length in beats, optional loudness (0–1). */
export type SoundNote = [number, number, number, number?];
/** A textbook excerpt (or a made-up phrase) whose last note names its mode. */
export type ModeClip = { mode: ModeId; notes: SoundNote[]; bpm: number; title?: string };

export type Question =
  | { kind: "duration"; midi: number; first: number; second: number; answer: LongShort }
  | { kind: "dynamics"; midi: number; levels: number[]; answer: Loudness }
  | { kind: "timbre"; id: string; choices: string[] }
  | { kind: "updown"; first: number; second: number; answer: UpDown }
  | { kind: "solfege"; tone: Tone }
  | { kind: "interval"; low: number; high: number; steps: number; harmonic: boolean }
  | { kind: "chord"; root: number; quality: ChordQuality }
  | { kind: "mode"; clip: ModeClip }
  | { kind: "dictation"; tones: Tone[] };

export const LONG_SHORT: Array<{ id: LongShort; label: string }> = [
  { id: "first", label: "第一个长" },
  { id: "second", label: "第二个长" },
  { id: "same", label: "一样长" },
];
export const LOUDNESS: Record<Loudness, string> = { louder: "更强", softer: "更弱", same: "一样强", cresc: "渐强", dim: "渐弱" };
export const loudnessChoices = (question: Extract<Question, { kind: "dynamics" }>): Loudness[] =>
  question.levels.length > 2 ? ["cresc", "dim"] : ["louder", "softer", "same"];

export const CHORDS: Record<ChordQuality, { label: string; hint: string; intervals: number[] }> = {
  major: { label: "大三和弦", hint: "明亮", intervals: [0, 4, 7] },
  minor: { label: "小三和弦", hint: "柔和、暗淡", intervals: [0, 3, 7] },
  aug: { label: "增三和弦", hint: "紧张、悬着", intervals: [0, 4, 8] },
  dim: { label: "减三和弦", hint: "收紧、不安", intervals: [0, 3, 6] },
};
export const CHORD_SETS = {
  basic: { label: "基础", caption: "大三 小三", qualities: ["major", "minor"] as ChordQuality[] },
  full: { label: "全部", caption: "大三 小三 增三 减三", qualities: ["major", "minor", "aug", "dim"] as ChordQuality[] },
} as const;
export type ChordSet = keyof typeof CHORD_SETS;

/** 五声调式：主音落在哪个正声上。degree 是简谱唱名，semitone 是离宫音的半音数。 */
export const MODES: Record<ModeId, { label: string; tone: string; degree: number; semitone: number; index: number }> = {
  gong: { label: "宫调式", tone: "宫", degree: 1, semitone: 0, index: 0 },
  shang: { label: "商调式", tone: "商", degree: 2, semitone: 2, index: 1 },
  jue: { label: "角调式", tone: "角", degree: 3, semitone: 4, index: 2 },
  zhi: { label: "徵调式", tone: "徵", degree: 5, semitone: 7, index: 3 },
  yu: { label: "羽调式", tone: "羽", degree: 6, semitone: 9, index: 4 },
};
export const MODE_SETS = {
  basic: { label: "宫和羽", caption: "宫调式 羽调式", modes: ["gong", "yu"] as ModeId[] },
  full: { label: "五种调式", caption: "宫 商 角 徵 羽", modes: ["gong", "shang", "jue", "zhi", "yu"] as ModeId[] },
} as const;
export type ModeSet = keyof typeof MODE_SETS;
export const modeOfDegree = (degree: number) => (Object.keys(MODES) as ModeId[]).find((id) => MODES[id].degree === degree);

export type EarOptions = {
  pitchSet: PitchSet; intervals: IntervalSet; harmonic: boolean; length: number;
  timbreSet: string; chordSet: ChordSet; modeSet: ModeSet;
};
/** What the page has loaded for the question maker: the instruments of the chosen set, the textbook mode excerpts. */
export type EarPools = { timbres: string[]; modeClips: ModeClip[]; usedTitles?: string[] };

export const INTERVAL_NAMES: Record<number, string> = { 1: "二度", 2: "三度", 3: "四度", 4: "五度", 5: "六度", 6: "七度", 7: "八度" };
export const INTERVAL_SETS = {
  basic: { label: "基础", caption: "二度 三度 五度 八度", steps: [1, 2, 4, 7] },
  full: { label: "全部", caption: "二度到八度", steps: [1, 2, 3, 4, 5, 6, 7] },
} as const;
export type IntervalSet = keyof typeof INTERVAL_SETS;

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
/** MIDI of the n-th degree of C major counted from middle C (0 = do). */
export const degreeMidi = (n: number) => 60 + MAJOR[((n % 7) + 7) % 7] + 12 * Math.floor(n / 7);

const pick = <T,>(items: readonly T[], random: () => number) => items[Math.floor(random() * items.length)];

export function makeQuestion(level: EarLevel, index: number, options: EarOptions, previous: Question | null, random = Math.random, pools: EarPools = { timbres: [], modeClips: [] }): Question {
  const special = makeNewQuestion(level, index, options, previous, random, pools);
  if (special) return special;
  if (level === "updown") {
    // 前几题相差很远，越往后越接近；偶尔出一样高的音。
    const span = index < 3 ? [7, 9, 12] : index < 6 ? [4, 5, 7] : [1, 2, 3];
    const first = 57 + Math.floor(random() * 16);
    if (random() < 0.12) return { kind: "updown", first, second: first, answer: "same" };
    const up = random() < 0.5;
    const second = first + (up ? 1 : -1) * pick(span, random);
    return { kind: "updown", first, second, answer: up ? "up" : "down" };
  }
  if (level === "solfege") {
    const blocks = PITCH_SETS[options.pitchSet].blocks;
    let block: PitchBlock;
    do { block = pick(blocks, random); } while (previous?.kind === "solfege" && previous.tone.d === block.d && previous.tone.o === block.o && blocks.length > 1);
    return { kind: "solfege", tone: { d: block.d, o: block.o } };
  }
  if (level === "interval") {
    const steps = pick(INTERVAL_SETS[options.intervals].steps, random);
    const lowDegree = Math.floor(random() * 7);
    return { kind: "interval", low: degreeMidi(lowDegree), high: degreeMidi(lowDegree + steps), steps, harmonic: options.harmonic };
  }
  // 旋律听写：从 do 以外的音里任选一个开始（和上一题错开），以级进和小跳为主（不超过五度），最后落到最近的 do（三个音时落在 la）。
  // 这样一轮下来，音块里的每个音都会听到。
  const pitched = PITCH_SETS[options.pitchSet].blocks;
  const midiAt = (i: number) => midiOfNote(pitched[i]);
  const homesAt = pitched.flatMap((block, i) => (block.d === 1 ? [i] : []));
  const homes = homesAt.length ? homesAt : [pitched.length - 1];
  const homeDistance = (i: number) => Math.min(...homes.map((h) => Math.abs(h - i)));
  const previousStart = previous?.kind === "dictation" ? previous.tones[0] : null;
  // 结尾总是 do，开头就不再从 do 起，把机会留给其他音。
  const starts = pitched.map((_, i) => i).filter((i) => !homes.includes(i) && (!previousStart || pitched[i].d !== previousStart.d || pitched[i].o !== previousStart.o));
  let at = pick(starts.length ? starts : pitched.map((_, i) => i), random);
  const tones: Tone[] = [{ d: pitched[at].d, o: pitched[at].o }];
  for (let k = 1; k < options.length; k += 1) {
    const left = options.length - 1 - k;
    let next: number;
    if (left === 0) {
      next = homes.reduce((best, h) => (Math.abs(h - at) < Math.abs(best - at) ? h : best));
    } else {
      const moves = [-3, -2, -1, -1, 1, 1, 2, 3, 0];
      const choices = moves.map((move) => at + move).filter((i) => i >= 0 && i < pitched.length
        && Math.abs(midiAt(i) - midiAt(at)) <= 7 && homeDistance(i) <= left * 2);
      next = choices.length ? pick(choices, random) : at + Math.sign(homes.reduce((best, h) => (Math.abs(h - at) < Math.abs(best - at) ? h : best)) - at);
    }
    at = next;
    tones.push({ d: pitched[at].d, o: pitched[at].o });
  }
  return { kind: "dictation", tones };
}

/** 新加的五关：长短、强弱、音色、和弦、调式。其余关返回 null，交给原来的出题逻辑。 */
function makeNewQuestion(level: EarLevel, index: number, options: EarOptions, previous: Question | null, random: () => number, pools: EarPools): Question | null {
  if (level === "duration") {
    // 先长短悬殊，越往后越接近；偶尔一样长。
    const midi = 60 + pick([0, 2, 4, 5, 7, 9], random);
    if (random() < 0.12) return { kind: "duration", midi, first: 1.2, second: 1.2, answer: "same" };
    const [short, long] = index < 3 ? [0.5, 2.4] : index < 6 ? [0.7, 1.8] : [0.9, 1.5];
    const longFirst = random() < 0.5;
    return { kind: "duration", midi, first: longFirst ? long : short, second: longFirst ? short : long, answer: longFirst ? "first" : "second" };
  }
  if (level === "dynamics") {
    const midi = 60 + pick([0, 2, 4, 5, 7], random);
    // 后半轮掺进“渐强、渐弱”：同一个音连响五下。
    if (index >= 5 && random() < 0.5) {
      const rising = [0.1, 0.22, 0.4, 0.64, 0.95];
      const cresc = random() < 0.5;
      return { kind: "dynamics", midi, levels: cresc ? rising : [...rising].reverse(), answer: cresc ? "cresc" : "dim" };
    }
    if (random() < 0.12) return { kind: "dynamics", midi, levels: [0.6, 0.6], answer: "same" };
    const [soft, loud] = index < 3 ? [0.12, 0.95] : index < 6 ? [0.25, 0.9] : [0.4, 0.9];
    const louder = random() < 0.5;
    return { kind: "dynamics", midi, levels: louder ? [soft, loud] : [loud, soft], answer: louder ? "louder" : "softer" };
  }
  if (level === "timbre") {
    const ids = pools.timbres;
    if (!ids.length) return null;
    const last = previous?.kind === "timbre" ? previous.id : null;
    const pool = ids.length > 1 ? ids.filter((id) => id !== last) : ids;
    const id = pick(pool, random);
    if (ids.length <= 4) return { kind: "timbre", id, choices: [...ids] };
    const others = shuffle(ids.filter((item) => item !== id), random).slice(0, 3);
    return { kind: "timbre", id, choices: shuffle([id, ...others], random) };
  }
  if (level === "chord") {
    const quality = pick(CHORD_SETS[options.chordSet].qualities, random);
    return { kind: "chord", root: 53 + Math.floor(random() * 12), quality };
  }
  if (level === "mode") {
    const modes = MODE_SETS[options.modeSet].modes;
    const mode = pick(modes, random);
    const lastTitle = previous?.kind === "mode" ? previous.clip.title : undefined;
    const used = new Set([...(pools.usedTitles ?? []), lastTitle]);
    const fromBook = pools.modeClips.filter((clip) => clip.mode === mode && !used.has(clip.title));
    // 课本里有这种调式的旋律就用课本的，偶尔换成一句编的乐句。
    const clip = fromBook.length && random() < 0.85 ? pick(fromBook, random) : modePhrase(mode, random);
    return { kind: "mode", clip };
  }
  return null;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

const PENTA_STEPS = [0, 2, 4, 7, 9];
/** 编一句五声乐句：从主音出发，在主音附近级进或小跳，倒数第二个音挨着主音，最后落回主音。 */
export function modePhrase(mode: ModeId, random = Math.random): ModeClip {
  const home = MODES[mode].index;
  const gong = pick([60, 62, 65, 67], random);
  const pitchAt = (position: number) => gong + PENTA_STEPS[((position % 5) + 5) % 5] + 12 * Math.floor(position / 5);
  const shift = pitchAt(home) > 69 ? -12 : 0;
  const positions = [home];
  for (let k = 1; k < 6; k += 1) {
    const at = positions[k - 1];
    const choices = [-2, -1, -1, 1, 1, 2].map((move) => at + move).filter((p) => p >= home - 2 && p <= home + 5);
    positions.push(pick(choices, random));
  }
  positions.push(home + (random() < 0.5 ? 1 : -1), home);
  const lengths = [1, 1, 1, 1, 1, 1, 1, 2];
  let at = 0;
  const notes: SoundNote[] = positions.map((position, k) => {
    const note: SoundNote = [pitchAt(position) + shift, at, lengths[k] * 0.95];
    at += lengths[k];
    return note;
  });
  return { mode, notes, bpm: 84 };
}

/** 从课本歌曲里挑出只用五声的，取最后几小节（至少八拍），按最后一个音认调式。
 * 只认宫、羽两种：器乐节选和商、角、徵结尾的旋律，单凭最后一个音不一定能定调式，这几种改用编的乐句。 */
export function modeClipsFromMelodies(entries: Array<{ title: string; melody: Melody }>): ModeClip[] {
  const clips: ModeClip[] = [];
  for (const { title, melody } of entries) {
    if (melody.voices?.length || melody.quality === "draft" || !pentatonicMelodyMatch(melody.bars)) continue;
    if (!melody.bars.flat().some((note) => note.lyric)) continue;
    const pitched = melody.bars.flat().filter((note) => note.d > 0 && note.d !== 9);
    const mode = modeOfDegree(pitched[pitched.length - 1]?.d ?? 0);
    if (mode !== "gong" && mode !== "yu") continue;
    let from = melody.bars.length;
    let beats = 0;
    while (from > 0 && (beats < 8 || melody.bars.length - from < 2) && melody.bars.length - from < 4) {
      from -= 1;
      beats += melody.bars[from].reduce((sum, note) => sum + note.b, 0);
    }
    const notes: SoundNote[] = [];
    let at = 0;
    let tied = false;
    for (const note of melody.bars.slice(from).flat()) {
      if (note.d > 0 && note.d !== 9) {
        const midi = midiOf(melody, note);
        const last = notes[notes.length - 1];
        if (tied && last && last[0] === midi) last[2] += note.b;
        else notes.push([midi, at, note.b]);
      }
      tied = Boolean(note.tie);
      at += note.b;
    }
    if (notes.length < 5) continue;
    const start = notes[0][1];
    for (const note of notes) { note[1] -= start; note[2] *= 0.95; }
    notes[notes.length - 1][2] = Math.max(notes[notes.length - 1][2], 1.8);
    clips.push({ mode, notes, bpm: Math.min(108, Math.max(66, melody.bpm || 84)), title });
  }
  return clips;
}

/** Notes to play for a question: [midi, start beat, length in beats, loudness?][]. 音色题由页面单独播放录音。 */
export function questionSound(question: Question): SoundNote[] {
  switch (question.kind) {
    case "duration": return [[question.midi, 0, question.first], [question.midi, question.first + 0.7, question.second]];
    case "dynamics": return question.levels.length > 2
      ? question.levels.map((level, k) => [question.midi, k * 0.85, 0.75, level])
      : [[question.midi, 0, 1.2, question.levels[0]], [question.midi, 1.7, 1.3, question.levels[1]]];
    case "timbre": return [];
    case "updown": return [[question.first, 0, 1.2], [question.second, 1.6, 1.4]];
    case "solfege": return [[midiOfNote(question.tone), 0, 1.6]];
    case "interval": return question.harmonic
      ? [[question.low, 0, 2], [question.high, 0, 2]]
      : [[question.low, 0, 1.1], [question.high, 1.3, 1.5]];
    case "chord": {
      const pitches = CHORDS[question.quality].intervals.map((step) => question.root + step);
      return [...pitches.map((midi): SoundNote => [midi, 0, 1.8]), ...pitches.map((midi, k): SoundNote => [midi, 2.3 + k * 0.55, k === 2 ? 1.4 : 0.5])];
    }
    case "mode": return question.clip.notes;
    case "dictation": return question.tones.map((tone, k) => [midiOfNote(tone), k, k === question.tones.length - 1 ? 1.8 : 0.95]);
  }
}

export const questionBpm = (question: Question) => (question.kind === "mode" ? question.clip.bpm : question.kind === "dictation" ? 84 : 90);

/** 参照音：标准音 la（小字一组 a，440 赫兹，MIDI 69）。题目都在 1=C，la 正好是标准音。 */
export const REFERENCE: SoundNote[] = [[69, 0, 2.4]];

export function stars(correct: number) {
  return correct >= 10 ? 3 : correct >= 8 ? 2 : correct >= 6 ? 1 : 0;
}

export function praise(correct: number, level: EarLevel = "solfege") {
  if (correct >= 10) return "全部答对，耳朵真灵！";
  if (correct >= 8) return "很棒！再来一轮争取全对。";
  const pitch = level === "solfege" || level === "dictation" || level === "interval";
  if (correct >= 6) return pitch ? "不错，多听几遍标准音会更准。" : "不错，没把握的题多听几遍再答。";
  return pitch ? "先多听听标准音 la，再试一轮。" : "每题多听两遍，比一比再回答。";
}

export const toneName = (tone: Tone) => (tone.o > 0 ? "高音 do" : PITCH_SETS.seven.blocks.find((block) => block.d === tone.d)?.name ?? String(tone.d));

const BEST = "yapu-ear-best";
export function loadBest(): Record<string, number> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(BEST) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
export function saveBest(best: Record<string, number>) {
  try { window.localStorage.setItem(BEST, JSON.stringify(best)); } catch { /* 无法保存时只是不记星星 */ }
}
