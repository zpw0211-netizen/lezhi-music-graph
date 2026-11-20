// 旋律创编作品 ⇄ 分享链接里的数据。解码时逐项检查，不合规矩的链接返回 null。
import { cleanText, decodeBars, encodeBars, encodePayload, oneOf } from "../../lib/share/share-codec";
import { taskForWork, type ComposeTask } from "./compose-task";
import { BASS_STYLES, LEVELS, PITCH_SETS, type BassStyle, type ComposeNote, type Level, type Meter, type PitchSet, type SavedWork } from "./compose-model";

export const METERS: Meter[] = ["2/4", "3/4", "4/4", "3/8", "6/8"];

/** task：学生按老师的任务写的，把任务一起带上。 */
export function encodeCompose(work: Pick<SavedWork, "title" | "author" | "meter" | "bars" | "lyrics" | "accompaniment" | "bassStyle" | "level" | "pitchSet">, task?: ComposeTask | null) {
  return encodePayload({
    k: "c", n: work.title, a: work.author, m: work.meter, b: encodeBars(work.bars), l: work.lyrics,
    v: work.level, p: work.pitchSet, c: work.accompaniment ? work.bassStyle ?? "broken" : 0,
    ...(task ? { t: taskForWork(task) } : {}),
  });
}

export function decodeCompose(data: Record<string, unknown> | null): SavedWork | null {
  if (!data || data.k !== "c") return null;
  const meter = oneOf(data.m, METERS);
  const bars = decodeBars(data.b, 16);
  if (!meter || !bars) return null;
  if (bars.some((bar) => bar.some((note) => note.d > 7 || Math.abs(note.o) > 1))) return null;
  const level = oneOf(data.v, Object.keys(LEVELS) as Level[]) ?? "mid";
  const pitchSet = oneOf(data.p, Object.keys(PITCH_SETS) as PitchSet[]) ?? "five";
  const bassStyle = oneOf(data.c, Object.keys(BASS_STYLES) as BassStyle[]);
  return {
    id: "shared",
    title: cleanText(data.n, 16) || "分享的旋律",
    author: cleanText(data.a, 12),
    meter,
    bars: bars.map((bar) => bar.map((note): ComposeNote => ({ d: note.d, o: note.o, b: note.b }))),
    lyrics: cleanText(data.l, 60),
    savedAt: Date.now(),
    accompaniment: Boolean(bassStyle),
    bassStyle: bassStyle ?? "broken",
    level,
    pitchSet,
  };
}
