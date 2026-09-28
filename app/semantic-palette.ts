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
 * 芽谱统一实体类别色板。画布、缩略图、图例和节点详情共用这组颜色。
 * 琥珀主色在宣纸底上对比不足，因此图谱用更深的琥珀色变体。
 */
export const SEMANTIC_PALETTE: Record<SemanticPaletteKey, SemanticColor> = {
  textbook: { fill: "#2E4A7D", stroke: "#20365D", soft: "#E9EDF6", label: "教材" },
  work: { fill: "#D2462C", stroke: "#9E311F", soft: "#F8E7E1", label: "音乐作品" },
  person: { fill: "#A66C0C", stroke: "#794F09", soft: "#F5EBD9", label: "音乐人物" },
  instrument: { fill: "#1F5C47", stroke: "#154431", soft: "#E6EFEA", label: "乐器" },
  genre: { fill: "#C1601E", stroke: "#8D4315", soft: "#F6E8DB", label: "音乐体裁" },
  element: { fill: "#3E9B4F", stroke: "#2B7138", soft: "#E6F1E5", label: "音乐要素" },
  theory: { fill: "#6680A7", stroke: "#405979", soft: "#E8EDF4", label: "音乐理论" },
  culture: { fill: "#78500A", stroke: "#573A05", soft: "#F1EADB", label: "地域文化" },
  activity: { fill: "#4C8168", stroke: "#335C49", soft: "#E6EDE7", label: "实践活动" },
  goal: { fill: "#A63C28", stroke: "#7C2B1D", soft: "#F4E6E1", label: "教学目标" },
};

export const semanticPaletteCssVariables = Object.fromEntries(
  Object.entries(SEMANTIC_PALETTE).flatMap(([key, color]) => [
    [`--semantic-${key}`, color.fill],
    [`--semantic-${key}-stroke`, color.stroke],
    [`--semantic-${key}-soft`, color.soft],
  ]),
) as Record<string, string>;

