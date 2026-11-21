// 听音色：每件乐器一段短录音（西洋乐器和小军鼓、响板、定音鼓、木琴由 GeneralUser GS 离线合成，民族乐器和三角铁、沙锤、铃鼓、木鱼是开放许可的真实录音，
// 见 public/media/timbre/SOURCES.md）；锣、镲、鼓、双响筒用站内已有的真实敲击录音（见 public/media/instruments/percussion/SOURCES.md）。
import { publicAssetUrl } from "../../lib/app/assets";
import { fetchWithRetry } from "../../lib/app/fetch-retry";
import { loadPercussionStrokes, playPercussion, type PercussionKind } from "../../lib/lesson/percussion";

export type TimbreSetId = "percussion" | "western" | "winds" | "chinese";
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
  { id: "muyu", label: "木鱼", set: "percussion", hint: "木头挖空做的，笃笃笃，声音空空的", source: { type: "hit", file: "muyu" } },
  { id: "snare", label: "小军鼓", set: "percussion", hint: "鼓底下绷着响弦，又脆又亮", source: { type: "hit", file: "snare" } },
  { id: "castanets", label: "响板", set: "percussion", hint: "两片木头一合，咔嗒咔嗒", source: { type: "hit", file: "castanets" } },
  { id: "timpani", label: "定音鼓", set: "percussion", hint: "像大铜锅的鼓，能敲出音高，咚咚隆隆", source: { type: "clip", file: "timpani" } },
  { id: "xylophone", label: "木琴", set: "percussion", hint: "敲木条，清脆又跳跃", source: { type: "clip", file: "xylophone" } },
  { id: "piano", label: "钢琴", set: "western", hint: "键盘乐器，颗粒清楚", source: { type: "clip", file: "piano" } },
  { id: "accordion", label: "手风琴", set: "western", hint: "一拉一合风箱，声音明亮带点颤", source: { type: "clip", file: "accordion" } },
  { id: "guitar", label: "吉他", set: "western", hint: "拨弦，温暖", source: { type: "clip", file: "guitar" } },
  { id: "harp", label: "竖琴", set: "western", hint: "拨弦，像水波一样流动", source: { type: "clip", file: "harp" } },
  { id: "violin", label: "小提琴", set: "western", hint: "拉弦，明亮柔美", source: { type: "clip", file: "violin" } },
  { id: "cello", label: "大提琴", set: "western", hint: "拉弦，低沉浑厚", source: { type: "clip", file: "cello" } },
  { id: "contrabass", label: "低音提琴", set: "western", hint: "拉弦乐器里个子最大，声音最低", source: { type: "clip", file: "contrabass" } },
  { id: "flute", label: "长笛", set: "winds", hint: "吹奏，清亮像鸟鸣", source: { type: "clip", file: "flute" } },
  { id: "recorder", label: "竖笛", set: "winds", hint: "课堂上常吹的笛子，干净单纯", source: { type: "clip", file: "recorder" } },
  { id: "clarinet", label: "单簧管", set: "winds", hint: "吹奏，圆润", source: { type: "clip", file: "clarinet" } },
  { id: "oboe", label: "双簧管", set: "winds", hint: "吹奏，带一点鼻音，悠扬", source: { type: "clip", file: "oboe" } },
  { id: "saxophone", label: "萨克斯", set: "winds", hint: "吹奏，圆润里带点沙哑", source: { type: "clip", file: "saxophone" } },
  { id: "trumpet", label: "小号", set: "winds", hint: "铜管，嘹亮", source: { type: "clip", file: "trumpet" } },
  { id: "horn", label: "圆号", set: "winds", hint: "铜管，柔和温暖", source: { type: "clip", file: "horn" } },
  { id: "trombone", label: "长号", set: "winds", hint: "铜管，浑厚有力", source: { type: "clip", file: "trombone" } },
  { id: "tuba", label: "大号", set: "winds", hint: "铜管里个子最大，声音最低", source: { type: "clip", file: "tuba" } },
  { id: "erhu", label: "二胡", set: "chinese", hint: "拉弦，柔美，像人在歌唱", source: { type: "clip", file: "erhu" } },
  { id: "matouqin", label: "马头琴", set: "chinese", hint: "蒙古族的拉弦乐器，浑厚又辽阔", source: { type: "clip", file: "matouqin" } },
  { id: "dizi", label: "笛子", set: "chinese", hint: "竹子做的吹管乐器，清脆明亮", source: { type: "clip", file: "dizi" } },
  { id: "xiao", label: "箫", set: "chinese", hint: "竖着吹的竹管，低沉柔和", source: { type: "clip", file: "xiao" } },
  { id: "hulusi", label: "葫芦丝", set: "chinese", hint: "吹奏，柔美，底下一直有一个持续的音", source: { type: "clip", file: "hulusi" } },
  { id: "guzheng", label: "古筝", set: "chinese", hint: "弹拨，像流水一样叮咚", source: { type: "clip", file: "guzheng" } },
  { id: "pipa", label: "琵琶", set: "chinese", hint: "弹拨，颗粒清脆，像大珠小珠落玉盘", source: { type: "clip", file: "pipa" } },
  { id: "guqin", label: "古琴", set: "chinese", hint: "弹拨，低沉古朴，余音悠长", source: { type: "clip", file: "guqin" } },
];

export const TIMBRE_SETS: Array<{ id: TimbreSetId; label: string }> = [
  { id: "percussion", label: "打击乐器" },
  { id: "western", label: "西洋弦乐和键盘" },
  { id: "winds", label: "西洋管乐" },
  { id: "chinese", label: "民族乐器" },
];
export const timbresIn = (set: string) => TIMBRES.filter((item) => item.set === set);
/** 选组按钮上的小字：乐器多时只写前四个，后面写共几种。 */
export const timbreSetSummary = (set: string) => {
  const labels = timbresIn(set).map((item) => item.label);
  return labels.length > 5 ? `${labels.slice(0, 4).join(" ")} 等 ${labels.length} 种` : labels.join(" ");
};
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
