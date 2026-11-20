// 听音色：每件乐器一段短录音（西洋乐器由 GeneralUser GS 离线合成，民族乐器和三角铁、沙锤、铃鼓是开放许可的真实录音，
// 见 public/media/timbre/SOURCES.md）；锣、镲、鼓、双响筒用站内已有的真实敲击录音（见 public/media/instruments/percussion/SOURCES.md）。
import { publicAssetUrl } from "../../lib/app/assets";
import { fetchWithRetry } from "../../lib/app/fetch-retry";
import { loadPercussionStrokes, playPercussion, type PercussionKind } from "../../lib/lesson/percussion";

export type TimbreSetId = "percussion" | "western" | "chinese";
type Source = { type: "stroke"; kind: PercussionKind } | { type: "hit"; file: string } | { type: "clip"; file: string };
export type Timbre = { id: string; label: string; set: TimbreSetId; hint: string; source: Source };

export const TIMBRES: Timbre[] = [
  { id: "drum", label: "鼓", set: "percussion", hint: "低沉、浑厚", source: { type: "stroke", kind: "roundDrum" } },
  { id: "smallGong", label: "小锣", set: "percussion", hint: "又高又亮，往上飘", source: { type: "stroke", kind: "smallGong" } },
  { id: "bigGong", label: "大锣", set: "percussion", hint: "低沉，余音很长", source: { type: "stroke", kind: "bigGong" } },
  { id: "cymbal", label: "镲", set: "percussion", hint: "金属片相击，哗哗响", source: { type: "stroke", kind: "bigCymbal" } },
  { id: "woodBlock", label: "双响筒", set: "percussion", hint: "木头的声音，清脆短促", source: { type: "stroke", kind: "woodBlock" } },
  { id: "triangle", label: "三角铁", set: "percussion", hint: "金属，叮——又细又亮，余音长", source: { type: "hit", file: "triangle" } },
  { id: "shaker", label: "沙锤", set: "percussion", hint: "沙沙响，像下小雨", source: { type: "hit", file: "shaker" } },
  { id: "tambourine", label: "铃鼓", set: "percussion", hint: "鼓面加小铃片，哗啦啦", source: { type: "hit", file: "tambourine" } },
  { id: "piano", label: "钢琴", set: "western", hint: "键盘乐器，颗粒清楚", source: { type: "clip", file: "piano" } },
  { id: "guitar", label: "吉他", set: "western", hint: "拨弦，温暖", source: { type: "clip", file: "guitar" } },
  { id: "violin", label: "小提琴", set: "western", hint: "拉弦，明亮柔美", source: { type: "clip", file: "violin" } },
  { id: "cello", label: "大提琴", set: "western", hint: "拉弦，低沉浑厚", source: { type: "clip", file: "cello" } },
  { id: "flute", label: "长笛", set: "western", hint: "吹奏，清亮像鸟鸣", source: { type: "clip", file: "flute" } },
  { id: "clarinet", label: "单簧管", set: "western", hint: "吹奏，圆润", source: { type: "clip", file: "clarinet" } },
  { id: "trumpet", label: "小号", set: "western", hint: "铜管，嘹亮", source: { type: "clip", file: "trumpet" } },
  { id: "erhu", label: "二胡", set: "chinese", hint: "拉弦，柔美，像人在歌唱", source: { type: "clip", file: "erhu" } },
  { id: "dizi", label: "笛子", set: "chinese", hint: "竹子做的吹管乐器，清脆明亮", source: { type: "clip", file: "dizi" } },
  { id: "guzheng", label: "古筝", set: "chinese", hint: "弹拨，像流水一样叮咚", source: { type: "clip", file: "guzheng" } },
];

export const TIMBRE_SETS: Array<{ id: TimbreSetId; label: string }> = [
  { id: "percussion", label: "打击乐器" },
  { id: "western", label: "西洋乐器" },
  { id: "chinese", label: "民族乐器" },
];
export const timbresIn = (set: string) => TIMBRES.filter((item) => item.set === set);
export const availableTimbreSets = () => TIMBRE_SETS.filter((set) => timbresIn(set.id).length >= 2);
export const timbreLabel = (id: string) => TIMBRES.find((item) => item.id === id)?.label ?? id;

const clipCache = new WeakMap<BaseAudioContext, Map<string, Promise<AudioBuffer>>>();
function loadClip(ctx: BaseAudioContext, file: string) {
  const cache = clipCache.get(ctx) ?? new Map<string, Promise<AudioBuffer>>();
  clipCache.set(ctx, cache);
  const hit = cache.get(file);
  if (hit) return hit;
  const loading = fetchWithRetry(publicAssetUrl(`media/timbre/${file}.mp3`))
    .then((response) => {
      if (!response.ok) throw new Error(`timbre ${file} ${response.status}`);
      return response.arrayBuffer();
    })
    .then((bytes) => ctx.decodeAudioData(bytes))
    .catch((error: unknown) => { cache.delete(file); throw error; });
  cache.set(file, loading);
  return loading;
}

/** 先把这一组乐器的录音都载进来，题目一出就能马上响。 */
export async function preloadTimbres(ctx: AudioContext, ids: string[]) {
  const items = TIMBRES.filter((item) => ids.includes(item.id));
  await Promise.all(items.map((item) => (item.source.type === "stroke" ? loadPercussionStrokes(ctx) : loadClip(ctx, item.source.file))));
}

/** 打击乐器敲一个小节奏型：X X | XX X。 */
const STROKE_PATTERN = [0, 0.6, 1.2, 1.5, 1.8];

export async function playTimbre(ctx: AudioContext, id: string, out: AudioNode) {
  const item = TIMBRES.find((timbre) => timbre.id === id);
  if (!item) return;
  const start = ctx.currentTime + 0.06;
  if (item.source.type === "stroke") {
    await loadPercussionStrokes(ctx);
    const kind = item.source.kind;
    // 锣和大镲余音长，只敲两下。
    const pattern = kind === "bigGong" || kind === "bigCymbal" ? [0, 1.2] : STROKE_PATTERN;
    for (const at of pattern) playPercussion(ctx, out, kind, start + at, 0.9);
    return;
  }
  const buffer = await loadClip(ctx, item.source.file);
  if (item.source.type === "hit") {
    const at = ctx.currentTime + 0.04;
    const pattern = item.id === "triangle" ? [0, 1.2] : STROKE_PATTERN;
    for (const offset of pattern) {
      const hit = ctx.createBufferSource();
      hit.buffer = buffer;
      hit.connect(out);
      hit.start(at + offset);
      hit.onended = () => hit.disconnect();
    }
    return;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(out);
  source.start(ctx.currentTime + 0.03);
  source.onended = () => source.disconnect();
}
