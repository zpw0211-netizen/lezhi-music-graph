// 旋律变奏（三部曲）⇄ 分享链接里的数据：主题（示例只写编号，自己的主题写全谱）、三段各用了哪些手法、伴奏和速度。
import { cleanText, decodeBars, encodeBars, encodePayload } from "../../lib/share/share-codec";
import { SAMPLE_THEMES, TECHNIQUE_BY_ID, isAccompaniment, isTheme, type Accompaniment, type TechniqueId, type Theme } from "./vary-model";

export type VaryShare = { theme: Theme; recipe: TechniqueId[]; b: TechniqueId[] | null; a2: TechniqueId[]; bass: Accompaniment; tempo: number | null };

export function encodeVary(work: VaryShare) {
  const sample = SAMPLE_THEMES.some((item) => item.id === work.theme.id);
  return encodePayload({
    k: "v",
    ...(sample ? { i: work.theme.id } : { n: work.theme.title, m: work.theme.meter, t: encodeBars(work.theme.bars) }),
    r: work.recipe, B: work.b ?? [], A: work.a2, c: work.bass, ...(work.tempo ? { s: work.tempo } : {}),
  });
}

const recipeOf = (value: unknown): TechniqueId[] | null =>
  (Array.isArray(value) && value.length <= 3 && value.every((id) => TECHNIQUE_BY_ID.has(id as TechniqueId)) ? value as TechniqueId[] : null);

export function decodeVary(data: Record<string, unknown> | null): VaryShare | null {
  if (!data || data.k !== "v") return null;
  let theme: Theme | undefined;
  if (typeof data.i === "string") theme = SAMPLE_THEMES.find((item) => item.id === data.i);
  else {
    const bars = decodeBars(data.t, 16);
    const candidate = { id: "custom", title: cleanText(data.n, 16) || "分享来的主题", source: "分享来的主题", meter: data.m, bars: bars?.map((bar) => bar.map((note) => ({ d: note.d, o: note.o, b: note.b, ...(note.tie ? { tie: true } : {}) }))) };
    if (isTheme(candidate)) theme = candidate;
  }
  const recipe = recipeOf(data.r);
  const b = recipeOf(data.B);
  const a2 = recipeOf(data.A);
  if (!theme || !recipe || !b || !a2) return null;
  const tempo = typeof data.s === "number" && data.s >= 40 && data.s <= 160 ? Math.round(data.s) : null;
  return { theme, recipe, b: b.length ? b : null, a2, bass: isAccompaniment(data.c) ? data.c : "broken", tempo };
}
