export type SchemaCategoryKey =
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

export type SchemaCategory = {
  key: SchemaCategoryKey;
  label: string;
  neoLabel: string;
  color: string;
  nodeSize: "large" | "medium" | "small";
};

export const SCHEMA_CATEGORIES: SchemaCategory[] = [
  {
    key: "textbook",
    label: "教材结构",
    neoLabel: "Textbook / Unit",
    color: "#2F6BFF",
    nodeSize: "large",
  },
  {
    key: "work",
    label: "音乐作品",
    neoLabel: "MusicWork",
    color: "#8B5CF6",
    nodeSize: "large",
  },
  {
    key: "person",
    label: "音乐人物",
    neoLabel: "Person",
    color: "#F59E0B",
    nodeSize: "medium",
  },
  {
    key: "instrument",
    label: "乐器与人声",
    neoLabel: "InstrumentVoice",
    color: "#06B6D4",
    nodeSize: "medium",
  },
  {
    key: "genre",
    label: "体裁与曲式",
    neoLabel: "GenreForm",
    color: "#EC4899",
    nodeSize: "medium",
  },
  {
    key: "element",
    label: "音乐基本要素",
    neoLabel: "MusicElement",
    color: "#22C55E",
    nodeSize: "small",
  },
  {
    key: "theory",
    label: "音乐理论",
    neoLabel: "MusicTheory",
    color: "#EAB308",
    nodeSize: "small",
  },
  {
    key: "culture",
    label: "地域与文化",
    neoLabel: "CultureRegion",
    color: "#EF4444",
    nodeSize: "medium",
  },
  {
    key: "activity",
    label: "实践活动",
    neoLabel: "LearningActivity",
    color: "#84CC16",
    nodeSize: "small",
  },
  {
    key: "goal",
    label: "学习目标与教学",
    neoLabel: "LearningGoal",
    color: "#14B8A6",
    nodeSize: "small",
  },
];

const WORK_TYPES = new Set([
  "音乐作品",
  "歌曲",
  "民歌",
  "器乐曲",
  "戏曲歌曲",
  "戏曲选段",
  "舞蹈音乐",
  "影视音乐",
  "交响作品",
  "合唱作品",
  "歌剧音乐",
  "进行曲",
  "朗诵作品",
]);

const CATEGORY_BY_TYPE: Record<string, SchemaCategoryKey> = {
  教材: "textbook",
  单元: "textbook",
  人物: "person",
  创作主体: "person",
  创作群体: "person",
  署名主体: "person",
  机构: "person",
  乐器: "instrument",
  表演形式: "instrument",
  音乐体裁: "genre",
  戏曲行当: "genre",
  来源作品: "genre",
  速度术语: "element",
  调性: "element",
  节奏型: "element",
  主题与情感: "element",
  音乐概念: "theory",
  知识概念: "theory",
  拍号: "theory",
  地域: "culture",
  民族: "culture",
  历史事件: "culture",
  音乐风格: "culture",
  学习活动: "activity",
  学习目标: "goal",
  核心素养: "goal",
  教学重点: "goal",
  教学难点: "goal",
  课堂任务: "goal",
};

export function schemaCategoryFor(type: string): SchemaCategoryKey {
  if (WORK_TYPES.has(type)) return "work";
  return CATEGORY_BY_TYPE[type] ?? "theory";
}

export function schemaCategoryMeta(type: string): SchemaCategory {
  const key = schemaCategoryFor(type);
  return (
    SCHEMA_CATEGORIES.find((item) => item.key === key) ?? SCHEMA_CATEGORIES[6]
  );
}

export function relationVisualKind(
  label: string,
): "fact" | "semantic" | "learning" {
  if (/前置|路径|学习目标|适合开展|学习方式|教学/.test(label))
    return "learning";
  if (/相关|分析维度|概念类别|解释|帮助辨识|关联/.test(label))
    return "semantic";
  return "fact";
}

export const ALL_SCHEMA_KEYS = SCHEMA_CATEGORIES.map((item) => item.key);
