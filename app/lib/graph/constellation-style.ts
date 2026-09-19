import type { GraphRelationship } from "./types";

export const RELATION_STYLES = {
  creator: { color: "#9a7965", label: "创作" },
  "music-feature": { color: "#658c83", label: "音乐特征" },
  "culture-region": { color: "#aa8089", label: "地域文化" },
  textbook: { color: "#939eae", label: "教材来源" },
  learning: { color: "#96916b", label: "学习" },
  semantic: { color: "#85809e", label: "知识关联" },
} as const;

export function relationFamily(edge: GraphRelationship) {
  const text = `${edge.predicate} ${edge.label ?? ""}`;
  if (edge.provenance || /TEXTBOOK|OCCURRENCE|UNIT|教材|单元|收录/.test(text)) return "textbook";
  if (/COMPOS|LYRIC|ARRANG|作曲|作词|改编|创作|编曲|翻译/.test(text)) return "creator";
  if (/REGION|CULTURE|民族|地区|地域|风格|国家|流派/.test(text)) return "culture-region";
  if (/LEARN|PREREQUISITE|DEEPENS|REVISIT|学习|教学|前置|深化|实践|演唱/.test(text)) return "learning";
  if (/TEMPO|RHYTHM|METER|GENRE|FORM|速度|节奏|节拍|拍号|旋律|曲式|体裁|调式|力度/.test(text)) return "music-feature";
  return "semantic";
}

export const semanticZoomTier = (ratio: number): 0 | 1 | 2 | 3 => ratio > .72 ? 0 : ratio > .38 ? 1 : ratio > .18 ? 2 : 3;
export const LABEL_BUDGETS = [28, 80, 160, 260] as const;
