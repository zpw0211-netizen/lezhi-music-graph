// 老师出题：把年级、用哪些音、拍号、长度、玩法和几条要求编进二维码，学生扫码打开就按这些设置写，
// 写的时候逐条打勾。要求只出谱面上数得出来的：写满、结束音、用上某张节奏卡、用到几个不同的音、配上歌词。
import { encodePayload, cleanText, oneOf } from "../../lib/share/share-codec";
import {
  LEVELS, PITCH_SETS, RHYTHM_CARDS, barBeats, beatsOf, formatBeats, lyricSyllables, questionsFor,
  type ComposeMode, type ComposeNote, type Level, type Meter, type PitchSet,
} from "./compose-model";

export type ComposeTask = {
  /** 老师写的一句任务，例如“写一段春天的旋律”。 */
  text: string;
  level: Level;
  pitchSet: PitchSet;
  meter: Meter;
  bars: number;
  mode: ComposeMode;
  question: number;
  /** 最后一个音落在 do（三个音 mi sol la 里没有 do，不出这一条）。 */
  end: boolean;
  /** 要用上的节奏卡（一整小节的节奏）。 */
  card: number[] | null;
  /** 至少用到几个不同的音，0 表示不要求。 */
  distinct: number;
  lyrics: boolean;
};

export const DISTINCT_CHOICES = [0, 3, 4, 5];

const taskData = (task: ComposeTask) => ({
  x: task.text, v: task.level, p: task.pitchSet, m: task.meter, n: task.bars, o: task.mode, q: task.question,
  e: task.end ? 1 : 0, r: task.card ?? 0, u: task.distinct, l: task.lyrics ? 1 : 0,
});
export const encodeTask = (task: ComposeTask) => encodePayload({ k: "t", ...taskData(task) });
/** 学生交作品时把任务一起带上，老师扫码打开就能看到逐条的结果。 */
export const taskForWork = taskData;

export function decodeTask(data: Record<string, unknown> | null | undefined): ComposeTask | null {
  if (!data || typeof data !== "object") return null;
  const level = oneOf(data.v, Object.keys(LEVELS) as Level[]);
  const pitchSet = oneOf(data.p, Object.keys(PITCH_SETS) as PitchSet[]);
  const meter = oneOf(data.m, ["2/4", "3/4", "4/4", "3/8", "6/8"] as Meter[]);
  const mode = oneOf(data.o, ["free", "answer"] as ComposeMode[]);
  if (!level || !pitchSet || !meter || !mode) return null;
  const info = LEVELS[level];
  if (!info.pitchSets.includes(pitchSet) || !info.meters.includes(meter)) return null;
  const bars = mode === "answer" ? 4 : Number(data.n);
  if (mode === "free" && !info.barCounts.includes(bars)) return null;
  const question = mode === "answer" ? Number(data.q) : 0;
  if (!Number.isInteger(question) || question < 0 || question >= questionsFor(meter, pitchSet).length) return null;
  const card = Array.isArray(data.r) ? RHYTHM_CARDS[meter].find((item) => item.join() === (data.r as unknown[]).join()) ?? null : null;
  if (Array.isArray(data.r) && !card) return null;
  const distinct = DISTINCT_CHOICES.includes(Number(data.u)) ? Number(data.u) : 0;
  return {
    text: cleanText(data.x, 40), level, pitchSet, meter, bars, mode, question,
    end: data.e === 1 && pitchSet !== "three", card, distinct: Math.min(distinct, PITCH_SETS[pitchSet].blocks.length), lyrics: data.l === 1,
  };
}

export type TaskCheck = { label: string; ok: boolean };

/** 逐条检查：学生写的旋律（含接龙的问句）和歌词是否达到任务要求。 */
export function checkTask(task: ComposeTask, bars: ComposeNote[][], lyrics: string): TaskCheck[] {
  const beats = beatsOf(task.meter);
  const lockedBars = task.mode === "answer" ? questionsFor(task.meter, task.pitchSet)[task.question].bars.length : 0;
  const own = bars.slice(lockedBars);
  const sounding = bars.flat().filter((note) => note.d);
  const checks: TaskCheck[] = [{
    label: task.mode === "answer" ? `写好 ${own.length} 小节的答句` : `写满 ${task.bars} 小节`,
    ok: bars.length === task.bars && bars.every((bar) => Math.abs(barBeats(bar) - beats) < 1e-6),
  }];
  if (task.end) checks.push({ label: "最后一个音落在 do", ok: sounding.at(-1)?.d === 1 });
  if (task.card) {
    const card = task.card;
    checks.push({ label: `用上节奏卡「${card.map((b) => formatBeats(b, task.meter)).join("、")}」`, ok: own.some((bar) => bar.map((note) => note.b).join() === card.join()) });
  }
  if (task.distinct) {
    const used = new Set(sounding.map((note) => `${note.d}:${note.o}`)).size;
    checks.push({ label: `至少用到 ${task.distinct} 个不同的音（现在 ${used} 个）`, ok: used >= task.distinct });
  }
  if (task.lyrics) {
    const count = lyricSyllables(lyrics).length;
    checks.push({ label: `配上歌词，一个字对一个音（${count} 字 / ${sounding.length} 音）`, ok: count > 0 && count === sounding.length });
  }
  return checks;
}

/** 任务的设置，读给学生听：年级 · 音 · 拍号 · 长度 · 玩法。 */
export function taskSetup(task: ComposeTask) {
  const questions = questionsFor(task.meter, task.pitchSet);
  return [
    LEVELS[task.level].caption, PITCH_SETS[task.pitchSet].label, task.meter,
    task.mode === "answer" ? `旋律接龙 · ${questions[task.question].label}` : `${task.bars} 小节`,
  ].join(" · ");
}
