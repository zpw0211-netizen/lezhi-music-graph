// Shared data shapes for the textbook graph payload (public/data/graph-index.json)
// and the helpers every page uses to read it.
import type { SchemaCategoryKey } from "../../graph-schema";

export type MediaAsset = {
  kind: "audio" | "video" | "score";
  url: string;
  title?: string;
  source?: string;
};
export type Entity = {
  id: string;
  name: string;
  type: string;
  aliases?: string[];
  description?: string;
  firstPage?: number | null;
  confidence?: number;
  media?: MediaAsset[];
  canonicalKey?: string;
  category?: SchemaCategoryKey;
  bookKeys?: string[];
  textbookCount?: number;
  occurrenceCount?: number;
  occurrenceIds?: string[];
  firstPageByBook?: Record<string, number>;
  degree?: number;
  relationCount?: number;
  visualImportance?: number;
  visualRank?: number;
  descriptions?: string[];
  rawTypes?: string[];
  layout?: { x: number; y: number };
  layouts?: {
    knowledge?: { x: number; y: number };
    textbook?: { x: number; y: number };
    schema?: { x: number; y: number };
  };
};
export type Triple = {
  id: string;
  subject: string;
  predicate: string;
  extended?: boolean;
  objectId?: string | null;
  literal?: string | null;
  objectKind?: string;
  sourcePage?: number | null;
  section?: string;
  confidence?: number;
  label?: string;
  bookKeys?: string[];
  crossBook?: boolean;
  provenance?: boolean;
  sources?: CanonicalSource[];
};
export type Evidence = {
  bookTitle?: string;
  tripleId: string;
  pdfPage?: number | null;
  textbookPage?: string;
  summary?: string;
  region?: string;
  confidence?: number;
};
export type Book = {
  key: string;
  title: string;
  grade: number;
  semester: string;
  pages: number;
  entityCount: number;
  tripleCount: number;
  evidenceCount?: number;
  workCount: number;
  reviewCount?: number;
  structureShare?: number;
  entities: Entity[];
  triples: Triple[];
  candidateTriples?: Triple[];
  evidenceByTriple: Record<string, Evidence[]>;
  relations: Record<string, string>;
};
export type Dataset = { books: Book[] };
export type GraphIndexPayload = {
  version: string;
  generatedAt: string;
  dataset: Dataset;
  canonicalGraph: CanonicalGraph;
};
export type CanonicalSource = {
  bookKey: string;
  bookTitle: string;
  tripleId?: string;
  occurrenceId?: string;
  sourceEntityId?: string;
  targetEntityId?: string | null;
  pdfPage?: number | null;
  evidence?: Evidence[];
};
export type KnowledgeOccurrence = {
  id: string;
  canonicalId: string;
  sourceEntityId: string;
  sourceName?: string;
  textbook: string;
  textbookTitle: string;
  unit?: string | null;
  lesson?: string | null;
  page?: number | null;
  sourceText?: string | null;
  evidence: Evidence[];
  occurrenceRole: string;
  entityType: string;
};
export type GraphQuality = {
  version: string;
  raw: {
    totalNodes: number;
    totalRelationships: number;
    isolatedNodeCount: number;
    danglingRelationshipCount: number;
    duplicateEntityGroupCount: number;
    duplicateEntityRecordCount: number;
    connectedComponentCount: number;
    largestConnectedComponentNodeCount: number;
  };
  canonical: {
    totalNodes: number;
    totalRelationships: number;
    occurrenceCount: number;
    occurrenceRelationshipCount?: number;
    isolatedNodeCount: number;
    danglingRelationshipCount: number;
    connectedComponentCount: number;
    largestConnectedComponentNodeCount: number;
    collapsedSelfRelationshipCount: number;
    sharedEntityCount: number;
    evidenceCoveredRelationshipCount?: number;
    evidenceCoverageRate?: number;
  };
};
export type CanonicalGraph = {
  version: string;
  books: Array<Pick<Book, "key" | "title" | "grade" | "semester">>;
  entities: Entity[];
  relationships: Triple[];
  occurrences: KnowledgeOccurrence[];
  occurrenceRelationships?: Array<{
    id: string;
    subject: string;
    predicate: "REFERS_TO" | "HAS_OCCURRENCE";
    label: string;
    objectId: string;
  }>;
  quality: GraphQuality;
  performance?: { layoutBuildMs?: number };
};
export type EvidencePayload = {
  bookKey: string;
  evidenceByTriple: Record<string, Evidence[]>;
  occurrences: KnowledgeOccurrence[];
  relationshipEvidenceById: Record<string, CanonicalSource[]>;
};

export const RELATION_LABELS: Record<string, string> = {
  BOOK_HAS_UNIT: "包含单元",
  UNIT_ORDER: "单元顺序",
  UNIT_SEQUENCE: "单元顺序",
  UNIT_THEME: "单元主题",
  WORK_IN_TEXTBOOK: "作品收录于教材",
  WORK_IN_UNIT: "作品属于单元",
  LEARNING_MODE: "学习方式",
  LYRICIST: "作词",
  COMPOSER: "作曲",
  GENRE: "体裁",
  TEMPO: "速度",
  LYRICS_ADAPTED_BY: "歌词改编",
  LYRIC_ADAPTER: "歌词改编",
  ORIGIN_REGION: "来源地区",
  TRANSLATOR: "翻译",
  ETHNIC_GROUP: "民族",
  SONG_ADAPTED_BY: "配歌",
  MUSICAL_STYLE: "音乐风格",
  PERFORMANCE_FORM: "演出形式",
  INSTRUMENT: "乐器",
  RECORDED_BY: "记录者",
  ARRANGER: "编曲",
  TONALITY: "调性",
  HAS_SCORE: "拥有乐谱",
  VOCAL_TYPE: "声乐类型",
  MELODY_CHARACTER: "旋律特点",
  PERFORMANCE_GUIDANCE: "演唱提示",
  THEME: "表现主题",
  CREATION_PERIOD: "创作时期",
  METER: "节拍",
  MUSICAL_FORM: "曲式",
  CREATION_YEAR: "创作年份",
  HISTORICAL_EVENT: "历史事件",
  DEPICTS: "描绘",
  RHYTHM_PATTERN: "节奏型",
  SOURCE_WORK: "改编来源",
  RELATED_WORK: "相关作品",
  CREDIT_NOTE: "署名说明",
  TEACHING_POINT: "教学要点",
  CONCEPT_CATEGORY: "概念类别",
  EXPLAINS_CONCEPT: "解释概念",
  TASK_ACTION: "教学活动",
  TASK_TARGET: "活动对象",
};
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
export const isWorkType = (type?: string) => Boolean(type && WORK_TYPES.has(type));
export const RELATION_PRIORITY = [
  "作曲",
  "作词",
  "音乐体裁",
  "来源于",
  "所属国家或地区",
  "所属民族",
  "使用乐器",
  "表演形式",
  "曲式结构",
  "速度特点",
  "节拍特点",
  "节奏特点",
  "旋律特点",
  "音乐风格",
  "表现主题",
  "表现情感",
  "描绘内容",
  "塑造形象",
  "改编自",
  "收录作品",
  "包含作品",
  "学习方式",
  "分析维度",
  "适合开展",
];
export const EMPTY_ENTITIES: Entity[] = [];
export const EMPTY_TRIPLES: Triple[] = [];
export const DEFAULT_BOOK_KEY = "g8s2";

export const fmt = (n: number) => new Intl.NumberFormat("zh-CN").format(n);
export const stableSeed = (value: string) => {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
};
/** Human-readable label for a predicate, preferring the fixed Chinese names. */
export const relationTextFor = (predicate: string, book?: Pick<Book, "relations">) =>
  RELATION_LABELS[predicate] ??
  book?.relations[predicate] ??
  predicate.replaceAll("_", " ");
/** Work names are stored with 《》; URLs and search use the bare title. */
export const bareWorkName = (name: string) => name.replace(/^《|》$/g, "");
