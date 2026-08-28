export type SemanticPaletteKey =
  | "textbook"
  | "work"
  | "person"
  | "instrument"
  | "genre"
  | "element"
  | "theory"
  | "culture"
  | "activity"
  | "goal";

export type SemanticColor = {
  fill: string;
  stroke: string;
  soft: string;
  label: string;
};

/**
 * 芽谱唯一语义色板。Canvas、SVG、Schema、Legend 与 Inspector 均从这里取色。
 */
export const SEMANTIC_PALETTE: Record<SemanticPaletteKey, SemanticColor> = {
  textbook: { fill: "#2F6BFF", stroke: "#1D49B2", soft: "#E8EFFF", label: "教材" },
  work: { fill: "#8B5CF6", stroke: "#5D35B4", soft: "#F0EBFF", label: "音乐作品" },
  person: { fill: "#F59E0B", stroke: "#AD6C05", soft: "#FFF3D9", label: "音乐人物" },
  instrument: { fill: "#06B6D4", stroke: "#087A8E", soft: "#E2F8FC", label: "乐器" },
  genre: { fill: "#EC4899", stroke: "#A52D69", soft: "#FCE7F2", label: "音乐体裁" },
  element: { fill: "#22C55E", stroke: "#17843F", soft: "#E6F8EC", label: "音乐要素" },
  theory: { fill: "#EAB308", stroke: "#9C7604", soft: "#FFF7D6", label: "音乐理论" },
  culture: { fill: "#EF4444", stroke: "#A62E2E", soft: "#FDE8E8", label: "地域文化" },
  activity: { fill: "#84CC16", stroke: "#56870D", soft: "#EFF9DB", label: "实践活动" },
  goal: { fill: "#14B8A6", stroke: "#0D7B70", soft: "#E2F7F4", label: "教学目标" },
};

export const semanticPaletteCssVariables = Object.fromEntries(
  Object.entries(SEMANTIC_PALETTE).flatMap(([key, color]) => [
    [`--semantic-${key}`, color.fill],
    [`--semantic-${key}-stroke`, color.stroke],
    [`--semantic-${key}-soft`, color.soft],
  ]),
) as Record<string, string>;

