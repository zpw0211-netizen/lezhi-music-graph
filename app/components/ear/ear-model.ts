// 听音训练：四关题目的生成与判分，不依赖界面。音高都在 C 大调里（1=C）。
import { PITCH_SETS, midiOfNote, type PitchBlock, type PitchSet } from "../compose/compose-model";

export type EarLevel = "updown" | "solfege" | "interval" | "dictation";
export const ROUND = 10;

export const EAR_LEVELS: Array<{ id: EarLevel; name: string; caption: string; grade: string }> = [
  { id: "updown", name: "听高低", caption: "第二个音更高还是更低", grade: "低年级" },
  { id: "solfege", name: "听唱名", caption: "听出是 do re mi 里的哪个音", grade: "中低年级" },
  { id: "interval", name: "听音程", caption: "两个音相隔几度", grade: "高年级·初中" },
  { id: "dictation", name: "旋律听写", caption: "听一小段旋律，用音块写下来", grade: "中高年级" },
];

export type Tone = { d: number; o: number };
export type UpDown = "up" | "down" | "same";

export type Question =
  | { kind: "updown"; first: number; second: number; answer: UpDown }
  | { kind: "solfege"; tone: Tone }
  | { kind: "interval"; low: number; high: number; steps: number; harmonic: boolean }
  | { kind: "dictation"; tones: Tone[] };

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

export function makeQuestion(level: EarLevel, index: number, options: { pitchSet: PitchSet; intervals: IntervalSet; harmonic: boolean; length: number }, previous: Question | null, random = Math.random): Question {
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
  // 旋律听写：从 do 出发，以级进为主，最后回到 do。
  const pitched = PITCH_SETS[options.pitchSet].blocks;
  const homes = pitched.flatMap((block, i) => (block.d === 1 && block.o === 0 ? [i] : []));
  const home = homes[0] ?? pitched.length - 1;
  let at = home;
  const tones: Tone[] = [];
  for (let k = 0; k < options.length; k += 1) {
    const left = options.length - 1 - k;
    if (k > 0) {
      let next = Math.min(pitched.length - 1, Math.max(0, at + pick([-2, -1, -1, 1, 1, 2], random)));
      if (Math.abs(home - next) > left) next = at + Math.sign(home - at) * Math.min(2, Math.max(0, Math.abs(home - at) - left));
      if (left === 0) next = home;
      at = next;
    }
    tones.push({ d: pitched[at].d, o: pitched[at].o });
  }
  return { kind: "dictation", tones };
}

/** Notes to play for a question: [midi, start beat, length in beats][]. */
export function questionSound(question: Question): Array<[number, number, number]> {
  switch (question.kind) {
    case "updown": return [[question.first, 0, 1.2], [question.second, 1.6, 1.4]];
    case "solfege": return [[midiOfNote(question.tone), 0, 1.6]];
    case "interval": return question.harmonic
      ? [[question.low, 0, 2], [question.high, 0, 2]]
      : [[question.low, 0, 1.1], [question.high, 1.3, 1.5]];
    case "dictation": return question.tones.map((tone, k) => [midiOfNote(tone), k, k === question.tones.length - 1 ? 1.8 : 0.95]);
  }
}

/** 参照音：标准音 la（小字一组 a，440 赫兹，MIDI 69）。题目都在 1=C，la 正好是标准音。 */
export const REFERENCE: Array<[number, number, number]> = [[69, 0, 2.4]];

export function stars(correct: number) {
  return correct >= 10 ? 3 : correct >= 8 ? 2 : correct >= 6 ? 1 : 0;
}

export function praise(correct: number) {
  if (correct >= 10) return "全部答对，耳朵真灵！";
  if (correct >= 8) return "很棒！再来一轮争取全对。";
  if (correct >= 6) return "不错，多听几遍标准音会更准。";
  return "先多听听标准音 la，再试一轮。";
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
