"use client";

export const dynamic = "force-static";

const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const publicAssetUrl = (path: string) =>
  `${PUBLIC_BASE_PATH}/${path.replace(/^\/+/, "")}`;

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import nextDynamic from "next/dynamic";
import type {
  ChangeEvent,
  CSSProperties,
  FormEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  ALL_SCHEMA_KEYS,
  SCHEMA_CATEGORIES,
  relationVisualKind,
  schemaCategoryFor,
  schemaCategoryMeta,
  type SchemaCategoryKey,
} from "./graph-schema";
import {
  FullGraphCanvas,
  FullGraphMiniMap,
  type CanvasPerformanceMetrics,
} from "./components/FullGraphCanvas";
import type { SigmaGraphSceneProps } from "./components/graph/SigmaGraphScene";
import { GraphRendererBoundary } from "./components/graph/GraphRendererBoundary";
import { GraphPathFinder } from "./components/graph/GraphPathFinder";
import { graphRuntimeFor, neighborhood } from "./graph-runtime";
import { useGraphPath } from "./hooks/useGraphPath";
import { relationshipMatchesPerspective } from "./lib/graph/graph-algorithms";
import type { GraphPerspective } from "./lib/graph/types";
import { ResearchAnalysis } from "./components/ResearchAnalysis";
import { ResearchInfo } from "./components/ResearchInfo";
import { designTokenCssVariables } from "./design-tokens";
import { semanticPaletteCssVariables } from "./semantic-palette";
import { AssistantPage } from "./components/assistant/AssistantPage";
import type { AnswerResult } from "./lib/ai/graph-rag";
import { GraphSidebar } from "./components/graph/GraphSidebar";
import { WorkbenchIcon } from "./components/WorkbenchIcon";
import { HomePortal } from "./components/home/HomePortal";
import { WorkLibrary } from "./components/records/WorkLibrary";
import { SchemaExplorer } from "./components/graph/SchemaExplorer";
import { KnowledgeDetailDrawer } from "./components/graph/KnowledgeDetailDrawer";
import { NodeAIInterpretation } from "./components/assistant/NodeAIInterpretation";
import { useGraphFilters } from "./hooks/useGraphFilters";
import { useGraphActions } from "./hooks/useGraphActions";
import type { GraphAction } from "./lib/graph/graph-actions";

const SigmaGraphScene = nextDynamic<SigmaGraphSceneProps<Entity>>(
  () =>
    import("./components/graph/SigmaGraphScene").then(
      (module) => module.SigmaGraphScene,
    ),
  { ssr: false },
);

type MediaAsset = {
  kind: "audio" | "video" | "score";
  url: string;
  title?: string;
  source?: string;
};
type Entity = {
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
type Triple = {
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
type Evidence = {
  bookTitle?: string;
  tripleId: string;
  pdfPage?: number | null;
  textbookPage?: string;
  summary?: string;
  region?: string;
  confidence?: number;
};
type Book = {
  key: string;
  title: string;
  grade: number;
  semester: string;
  pages: number;
  entityCount: number;
  tripleCount: number;
  evidenceCount: number;
  workCount: number;
  reviewCount: number;
  structureShare: number;
  entities: Entity[];
  triples: Triple[];
  candidateTriples?: Triple[];
  evidenceByTriple: Record<string, Evidence[]>;
  relations: Record<string, string>;
};
type Dataset = { books: Book[] };
type GraphIndexPayload = {
  version: string;
  generatedAt: string;
  dataset: Dataset;
  canonicalGraph: CanonicalGraph;
};
type CanonicalSource = {
  bookKey: string;
  bookTitle: string;
  tripleId?: string;
  occurrenceId?: string;
  sourceEntityId?: string;
  targetEntityId?: string | null;
  pdfPage?: number | null;
  evidence?: Evidence[];
};
type KnowledgeOccurrence = {
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
type GraphQuality = {
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
type CanonicalGraph = {
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
type PositionedNode = { entity: Entity; triple: Triple; x: number; y: number };
type BookGroup = {
  book: Book;
  center: Entity;
  nodes: PositionedNode[];
  layoutMs?: number;
};
type AssistantFact = {
  subject: string;
  predicate: string;
  object: string;
  bookTitle: string;
  page?: number | null;
  distance?: 1 | 2;
};
type SimilarWork = { name: string; bookTitle: string; shared: string[] };
type GraphAnalytics = {
  booksHit: number;
  directCount: number;
  multiHopCount: number;
  relationTypes: number;
  neighborCount: number;
  similarWorks: SimilarWork[];
};
type AssistantResult = {
  summary: string;
  answer: string;
  facts: AssistantFact[];
  analytics?: GraphAnalytics;
  entity?: Entity;
  book?: Book;
  poweredBy?: "gpt" | "graph";
};
type DragState = {
  nodeKey: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startClientX: number;
  startClientY: number;
  entity: Entity;
  book: Book;
};
type InspectorTab =
  | "overview"
  | "relations"
  | "occurrences"
  | "evidence"
  | "teaching";
type ContextMenuState = {
  x: number;
  y: number;
  entity: Entity;
  book: Book;
};
type FullGraphView = "all" | "cross" | "ownership" | "knowledge";
type FullGraphLayoutMode = "knowledge" | "textbook" | "schema";
type FullGraphRenderer = "sigma" | "canvas";
type ViewSnapshot = {
  expandedNodeIds: Record<string, string[]>;
  highlightedCanonicalIds: string[];
  highlightedCanonicalRelationIds: string[];
};
type EvidencePayload = {
  bookKey: string;
  evidenceByTriple: Record<string, Evidence[]>;
  occurrences: KnowledgeOccurrence[];
  relationshipEvidenceById: Record<string, CanonicalSource[]>;
};
type LoadPerformance = {
  jsonDownloadMs: number;
  jsonParseMs: number;
  preprocessingMs: number;
  firstRenderMs: number;
  graphIndexBytes: number;
};

const RELATION_LABELS: Record<string, string> = {
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
const isWorkType = (type?: string) => Boolean(type && WORK_TYPES.has(type));
const ENTITY_TYPE_ORDER = [
  "知识概念",
  "音乐概念",
  "人物",
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
  "音乐作品",
  "地域",
  "民族",
  "乐器",
  "音乐体裁",
  "音乐风格",
  "表演形式",
  "主题与情感",
  "历史事件",
  "学习活动",
  "单元",
  "教材",
];
const RELATION_PRIORITY = [
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
const EMPTY_ENTITIES: Entity[] = [];
const EMPTY_TRIPLES: Triple[] = [];
const fmt = (n: number) => new Intl.NumberFormat("zh-CN").format(n);
const stableSeed = (value: string) => {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
};
const factSentence = (fact: AssistantFact) => {
  const subject = fact.subject;
  const object = fact.object;
  const patterns: Record<string, string> = {
    作曲: `${subject}由${object}作曲`,
    作词: `${subject}由${object}作词`,
    编曲: `${subject}由${object}编曲`,
    体裁: `${subject}属于${object}`,
    速度: `${subject}的速度为${object}`,
    节拍: `${subject}采用${object}节拍`,
    来源地区: `${subject}来源于${object}`,
    民族: `${subject}与${object}相关`,
    乐器: `${subject}使用或关联${object}`,
    表现主题: `${subject}表现${object}`,
    拥有乐谱: `${subject}配有${object}`,
    学习方式: `教材建议以${object}方式学习${subject}`,
    作品属于单元: `${subject}编排在${object}`,
    作品收录于教材: `${subject}收录于${object}`,
    解释概念: `${subject}可解释为${object}`,
    指: `${subject}是指${object}`,
    是: `${subject}是${object}`,
  };
  return patterns[fact.predicate] ?? `${subject}${fact.predicate}${object}`;
};
const composeGraphAnswer = (
  entityName: string,
  bookTitle: string,
  facts: AssistantFact[],
  analytics: GraphAnalytics,
) => {
  if (!facts.length)
    return `图谱已经定位到“${entityName}”，但现有正式关系不足以形成可靠回答。你可以换一种问法，或等待补充教材证据。`;
  const pages = [
    ...new Set(
      facts
        .map((fact) => fact.page)
        .filter((page): page is number => typeof page === "number"),
    ),
  ];
  const evidence = pages.length
    ? `（教材 PDF 第 ${pages.slice(0, 4).join("、")} 页）`
    : "";
  const direct = facts
    .filter((fact) => fact.distance !== 2)
    .slice(0, 5)
    .map(factSentence);
  const linked = facts
    .filter((fact) => fact.distance === 2)
    .slice(0, 3)
    .map(factSentence);
  const similar = analytics.similarWorks
    .slice(0, 3)
    .map((item) => `${item.name}（共同维度：${item.shared.join("、")}）`)
    .join("、");
  return `根据《${bookTitle}》${evidence}，${direct.join("；")}。图谱还沿相邻节点分析出：${linked.length ? linked.join("；") : "目前没有足够的二跳关联"}。从六册教材的统计看，共命中 ${analytics.booksHit} 册、${analytics.relationTypes} 种关系和 ${analytics.neighborCount} 个邻接知识点${similar ? `；可进一步对比 ${similar}` : ""}。补充理解：这些关联可用于从“作品事实—音乐要素—文化语境—同类作品”四个层次组织课堂学习，但未在教材证据中出现的具体事实仍需核查。`;
};
const demoBook: Book = {
  key: "g8s2",
  title: "人音版八年级下册",
  grade: 8,
  semester: "下册",
  pages: 79,
  entityCount: 7,
  tripleCount: 8,
  evidenceCount: 8,
  workCount: 1,
  reviewCount: 0,
  structureShare: 0.2,
  relations: {},
  entities: [
    { id: "demo-book", name: "人音版八年级下册", type: "教材" },
    {
      id: "demo-work",
      name: "游击队歌",
      type: "音乐作品",
      description: "抗战题材歌曲，适合从节奏、力度和历史背景展开学习。",
      firstPage: 34,
    },
    { id: "demo-composer", name: "贺绿汀", type: "人物" },
    { id: "demo-unit", name: "第五单元 环球音乐", type: "单元" },
    { id: "demo-genre", name: "进行曲", type: "体裁" },
    { id: "demo-score", name: "教材乐谱·PDF第34页", type: "乐谱资源" },
    { id: "demo-theme", name: "抗战与人民力量", type: "主题" },
  ],
  triples: [
    {
      id: "demo-0",
      subject: "demo-book",
      predicate: "BOOK_HAS_UNIT",
      objectId: "demo-unit",
      sourcePage: 6,
      confidence: 1,
    },
    {
      id: "demo-1",
      subject: "demo-work",
      predicate: "WORK_IN_TEXTBOOK",
      objectId: "demo-book",
      sourcePage: 34,
    },
    {
      id: "demo-2",
      subject: "demo-work",
      predicate: "COMPOSER",
      objectId: "demo-composer",
      sourcePage: 34,
    },
    {
      id: "demo-3",
      subject: "demo-work",
      predicate: "GENRE",
      objectId: "demo-genre",
      sourcePage: 34,
    },
    {
      id: "demo-4",
      subject: "demo-work",
      predicate: "HAS_SCORE",
      objectId: "demo-score",
      sourcePage: 34,
    },
    {
      id: "demo-5",
      subject: "demo-work",
      predicate: "THEME",
      objectId: "demo-theme",
      sourcePage: 34,
    },
    {
      id: "demo-6",
      subject: "demo-work",
      predicate: "TEMPO",
      literal: "中速稍快",
      objectKind: "字面值",
      sourcePage: 34,
    },
    {
      id: "demo-7",
      subject: "demo-work",
      predicate: "LEARNING_MODE",
      literal: "演唱",
      objectKind: "字面值",
      sourcePage: 34,
    },
  ],
  evidenceByTriple: {},
};

export default function Home() {
  const [dataset, setDataset] = useState<Dataset>({ books: [demoBook] });
  const [canonicalGraph, setCanonicalGraph] = useState<CanonicalGraph | null>(
    null,
  );
  const [bookKey, setBookKey] = useState("g8s2");
  const [selectedId, setSelectedId] = useState("demo-work");
  const [query, setQuery] = useState("");
  const scope = "all" as const;
  const [view, setView] = useState<"home" | "graph" | "assistant" | "research" | "records" | "import">(() => {
    if (typeof window === "undefined") return "home";
    const requested = new URLSearchParams(window.location.search).get("view");
    return requested === "graph" || requested === "assistant" || requested === "research" || requested === "records" ? requested : "home";
  });
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [knowledgeDetailOpen, setKnowledgeDetailOpen] = useState(false);
  const schemaOpen = true;
  const [assistantEntry, setAssistantEntry] = useState({ question: "", token: 0 });
  const [graphMode, setGraphMode] = useState<"all" | "book" | "focus">("all");
  const [panel, setPanel] = useState<InspectorTab>("overview");
  const [loaded, setLoaded] = useState(false);
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [zoom, setZoom] = useState(0.64);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("全部");
  const [showLabels, setShowLabels] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantResult, setAssistantResult] =
    useState<AssistantResult | null>(null);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [motionPhase, setMotionPhase] = useState(0);
  const [canvasMetrics, setCanvasMetrics] = useState<CanvasPerformanceMetrics>({
    fps: 0,
    visibleNodes: 0,
    visibleEdges: 0,
    renderedLabels: 0,
    renderer: "Canvas 2D",
    domElementCount: 0,
    renderMode: "on-demand",
  });
  const [researchInfoOpen, setResearchInfoOpen] = useState(false);
  const [graphGeneratedAt, setGraphGeneratedAt] = useState<string>();
  const canvasMetricsRef = useRef(canvasMetrics);
  const loadStartedAtRef = useRef(0);
  const [loadPerformance, setLoadPerformance] = useState<LoadPerformance>({
    jsonDownloadMs: 0,
    jsonParseMs: 0,
    preprocessingMs: 0,
    firstRenderMs: 0,
    graphIndexBytes: 0,
  });
  const [evidencePayloads, setEvidencePayloads] = useState<
    Record<string, EvidencePayload>
  >({});
  const evidenceRequestCache = useRef(
    new Map<string, Promise<EvidencePayload>>(),
  );
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [dragPositions, setDragPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [expandedNodeIds, setExpandedNodeIds] = useState<
    Record<string, string[]>
  >({});
  const [hiddenNodeKeys, setHiddenNodeKeys] = useState<string[]>([]);
  const [pinnedNodeKeys, setPinnedNodeKeys] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [fullGraphView, setFullGraphView] = useState<FullGraphView>("all");
  const [fullGraphLayout, setFullGraphLayout] =
    useState<FullGraphLayoutMode>("knowledge");
  const [fullGraphRenderer, setFullGraphRenderer] =
    useState<FullGraphRenderer>("sigma");
  const [graphPerspective, setGraphPerspective] =
    useState<GraphPerspective>("comprehensive");
  const [showTextbookSources, setShowTextbookSources] = useState(false);
  const [highlightedCanonicalIds, setHighlightedCanonicalIds] = useState<
    string[]
  >([]);
  const [highlightedCanonicalRelationIds, setHighlightedCanonicalRelationIds] =
    useState<string[]>([]);
  const [viewHistory, setViewHistory] = useState<ViewSnapshot[]>([]);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{
    pointerId: number;
    clientX: number;
    clientY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [pathFinderOpen, setPathFinderOpen] = useState(false);
  const [pathStartId, setPathStartId] = useState("");
  const [pathEndId, setPathEndId] = useState("");
  const [activePathIndex, setActivePathIndex] = useState(0);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [focusSelectionToken, setFocusSelectionToken] = useState(0);
  const [sigmaViewport, setSigmaViewport] = useState<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);
  useEffect(() => {
    let active = true;
    const load = async () => {
      loadStartedAtRef.current = Date.now();
      const downloadStarted = Date.now();
      const response = await fetch(publicAssetUrl("data/graph-index.json"));
      if (!response.ok) throw new Error("graph-index unavailable");
      const text = await response.text();
      const downloadFinished = Date.now();
      const parseStarted = Date.now();
      const index = JSON.parse(text) as GraphIndexPayload;
      const parseFinished = Date.now();
      const preprocessStarted = Date.now();
      for (const book of index.dataset.books)
        graphRuntimeFor(book, book.entities, book.triples);
      const preprocessFinished = Date.now();
      if (!active) return;
      setLoadPerformance((previous) => ({
        ...previous,
        jsonDownloadMs: downloadFinished - downloadStarted,
        jsonParseMs: parseFinished - parseStarted,
        preprocessingMs: preprocessFinished - preprocessStarted,
        graphIndexBytes: new Blob([text]).size,
      }));
      const payload = index.dataset;
      const canonical = index.canonicalGraph;
      {
        if (!payload.books?.length) return;
        setDataset(payload);
        setCanonicalGraph(canonical);
        setGraphGeneratedAt(index.generatedAt);
        const book =
          payload.books.find((b) => b.key === "g8s2") ?? payload.books[0];
        setBookKey(book.key);
        const work =
          book.entities.find((e) => isWorkType(e.type)) ?? book.entities[0];
        const crossBookCore = [...canonical.entities]
          .filter((entity) => entity.type !== "教材")
          .sort(
            (a, b) =>
              (b.textbookCount ?? 1) - (a.textbookCount ?? 1) ||
              (b.degree ?? 0) - (a.degree ?? 0),
          )[0];
        if (crossBookCore) setSelectedId(crossBookCore.id);
        else if (work) setSelectedId(work.id);
      }
    };
    load()
      .catch(() => undefined)
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (
      !motionEnabled ||
      graphMode === "all" ||
      graphMode === "focus" ||
      dragging
    )
      return;
    const timer = window.setInterval(
      () => setMotionPhase((value) => value + 0.055),
      90,
    );
    return () => window.clearInterval(timer);
  }, [dragging, graphMode, motionEnabled]);
  const datasetBookMap = useMemo(
    () => new Map(dataset.books.map((book) => [book.key, book])),
    [dataset.books],
  );
  const currentBook = datasetBookMap.get(bookKey) ?? dataset.books[0];
  const canonicalBook = useMemo<Book | null>(() => {
    if (!canonicalGraph) return null;
    const relations = Object.fromEntries(
      canonicalGraph.relationships.map((relationship) => [
        relationship.predicate,
        relationship.label ?? relationship.predicate,
      ]),
    );
    const evidenceByTriple = Object.fromEntries(
      canonicalGraph.relationships.map((relationship) => [
        relationship.id,
        (relationship.sources ?? []).flatMap((source) =>
          source.evidence?.length
            ? source.evidence
            : [
                {
                  tripleId: relationship.id,
                  pdfPage: source.pdfPage ?? relationship.sourcePage ?? null,
                  summary: `${source.bookTitle}中的教材出现记录`,
                  confidence: relationship.confidence ?? 1,
                },
              ],
        ),
      ]),
    );
    return {
      key: "canonical",
      title: "六册教材规范知识网络",
      grade: 0,
      semester: "跨册",
      pages: dataset.books.reduce((total, book) => total + book.pages, 0),
      entityCount: canonicalGraph.entities.length,
      tripleCount: canonicalGraph.relationships.length,
      evidenceCount: canonicalGraph.relationships.reduce(
        (total, relationship) => total + (relationship.sources?.length ?? 0),
        0,
      ),
      workCount: canonicalGraph.entities.filter(
        (entity) => schemaCategoryFor(entity.type) === "work",
      ).length,
      reviewCount: 0,
      structureShare: 0,
      entities: canonicalGraph.entities,
      triples: canonicalGraph.relationships,
      evidenceByTriple,
      relations,
    };
  }, [canonicalGraph, dataset.books]);
  const graphFilters = useGraphFilters(canonicalBook?.entities ?? EMPTY_ENTITIES, canonicalBook?.triples ?? EMPTY_TRIPLES, dataset.books, publicAssetUrl);
  const { visibleSchemaKeys, setVisibleSchemaKeys, hiddenRelations, setHiddenRelations } = graphFilters;
  const resetGraphFilters = graphFilters.reset;
  const { paths: graphPaths } = useGraphPath(
    canonicalBook?.entities ?? EMPTY_ENTITIES,
    canonicalBook?.triples ?? EMPTY_TRIPLES,
    pathStartId,
    pathEndId,
  );
  const safeActivePathIndex = activePathIndex < graphPaths.length ? activePathIndex : 0;
  const activeGraphPath = graphPaths[safeActivePathIndex] ?? graphPaths[0];
  const inspectionBook =
    graphMode === "all" && canonicalBook ? canonicalBook : currentBook;
  const inspectionRuntime = useMemo(
    () =>
      graphRuntimeFor(
        inspectionBook,
        inspectionBook.entities,
        inspectionBook.triples,
      ),
    [inspectionBook],
  );
  const entityMap = inspectionRuntime.entityMap;
  const selected =
    entityMap.get(selectedId) ??
    inspectionBook.entities.find((e) => isWorkType(e.type)) ??
    inspectionBook.entities[0];
  const bookEntity = useCallback(
    (book: Book): Entity =>
      book.entities.find((e) => e.type === "教材") ?? {
        id: `BOOK_${book.key}`,
        name: book.title,
        type: "教材",
      },
    [],
  );
  const relationText = useCallback(
    (predicate: string, book: Book = inspectionBook) =>
      RELATION_LABELS[predicate] ??
      book.relations[predicate] ??
      predicate.replaceAll("_", " "),
    [inspectionBook],
  );
  const relationLabel = (t: Triple) => relationText(t.predicate);
  const objectLabel = (t: Triple) =>
    t.objectId
      ? (entityMap.get(t.objectId)?.name ?? t.objectId)
      : (t.literal ?? "未命名客体");
  const searchResults = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length)
      return [] as Array<{
        entity: Entity;
        book: Book;
        relationCount: number;
        matchedBy: string;
        score: number;
      }>;
    const books = scope === "all" ? dataset.books : [currentBook];
    const out: Array<{
      entity: Entity;
      book: Book;
      relationCount: number;
      matchedBy: string;
      score: number;
    }> = [];
    for (const book of books) {
      const runtime = graphRuntimeFor(book, book.entities, book.triples);
      for (const entity of book.entities) {
        const adjacent = runtime.adjacencyMap.get(entity.id) ?? [];
        const relationTerms = adjacent.map((item) =>
          relationText(item.edge.predicate, book),
        );
        const fields = {
          name: [entity.name, ...(entity.aliases ?? [])].join(" ").toLowerCase(),
          type: entity.type.toLowerCase(),
          book: book.title.toLowerCase(),
          relation: relationTerms.join(" ").toLowerCase(),
          description: (entity.description ?? "").toLowerCase(),
        };
        if (!terms.every((term) => Object.values(fields).some((value) => value.includes(term))))
          continue;
        const score = terms.reduce(
          (total, term) =>
            total +
            (fields.name === term ? 180 : fields.name.startsWith(term) ? 120 : fields.name.includes(term) ? 80 : 0) +
            (fields.type.includes(term) ? 30 : 0) +
            (fields.book.includes(term) ? 24 : 0) +
            (fields.relation.includes(term) ? 18 : 0) +
            (fields.description.includes(term) ? 8 : 0),
          0,
        );
        const matchedBy = fields.name.includes(terms[0])
          ? "名称/别名"
          : fields.type.includes(terms[0])
            ? "实体类型"
            : fields.book.includes(terms[0])
              ? "教材"
              : fields.relation.includes(terms[0])
                ? "关系"
                : "描述";
        out.push({
          entity,
          book,
          relationCount: adjacent.length,
          matchedBy,
          score,
        });
      }
    }
    return out
      .sort((a, b) => b.score - a.score || b.relationCount - a.relationCount)
      .slice(0, 12);
  }, [currentBook, dataset.books, query, relationText, scope]);
  const directTriples = useMemo(
    () =>
      selected
        ? (inspectionRuntime.adjacencyMap.get(selected.id) ?? []).map(
            (item) => item.edge,
          )
        : [],
    [inspectionRuntime, selected],
  );
  const inspectorFacts = useMemo(() => {
    if (!selected) return [];
    const preferred = /作曲|作词|演唱|演奏|体裁|曲式|地域|民族|背景|速度|力度|节拍|调式|调性|节奏|旋律|乐器|情绪|主题|教材|单元|学习目标/;
    return directTriples
      .map((triple) => {
        const outgoing = triple.subject === selected.id;
        const targetId = outgoing ? triple.objectId : triple.subject;
        const target = targetId ? inspectionRuntime.entityMap.get(targetId) : undefined;
        return {
          triple,
          label: relationText(triple.predicate, inspectionBook),
          value: target?.name ?? triple.literal ?? "",
          target,
        };
      })
      .filter((item) => item.value && preferred.test(item.label))
      .sort(
        (a, b) => {
          const priority = (label: string) => {
            const index = RELATION_PRIORITY.indexOf(label);
            return index < 0 ? Number.MAX_SAFE_INTEGER : index;
          };
          return priority(a.label) - priority(b.label);
        },
      )
      .slice(0, 18);
  }, [directTriples, inspectionBook, inspectionRuntime.entityMap, relationText, selected]);
  useEffect(() => {
    if (!inspectorOpen || !selected) return;
    const keys =
      graphMode === "all"
        ? (selected.bookKeys ?? [])
        : [currentBook.key];
    for (const key of keys) {
      if (evidencePayloads[key]) continue;
      let request = evidenceRequestCache.current.get(key);
      if (!request) {
        request = fetch(publicAssetUrl(`data/evidence/${key}.json`)).then(
          async (response) => {
            if (!response.ok) throw new Error(`evidence ${key} unavailable`);
            return (await response.json()) as EvidencePayload;
          },
        );
        evidenceRequestCache.current.set(key, request);
      }
      request
        .then((payload) =>
          setEvidencePayloads((previous) =>
            previous[key] ? previous : { ...previous, [key]: payload },
          ),
        )
        .catch(() => evidenceRequestCache.current.delete(key));
    }
  }, [
    currentBook.key,
    evidencePayloads,
    graphMode,
    inspectorOpen,
    panel,
    selected,
  ]);
  const evidence = useMemo(
    () =>
      directTriples.flatMap((triple) => {
        const local = inspectionBook.evidenceByTriple[triple.id] ?? [];
        const lazyLocal = Object.values(evidencePayloads).flatMap(
          (payload) => (payload.evidenceByTriple[triple.id] ?? []).map(item => ({ ...item, bookTitle: datasetBookMap.get(payload.bookKey)?.title ?? payload.bookKey })),
        );
        const lazyCanonical = Object.values(evidencePayloads).flatMap(
          (payload) =>
            (payload.relationshipEvidenceById[triple.id] ?? []).flatMap(
              (source) =>
                source.evidence?.length
                  ? source.evidence.map(item => ({ ...item, bookTitle: source.bookTitle }))
                  : [
                      {
                        tripleId: triple.id,
                        bookTitle: source.bookTitle,
                        pdfPage: source.pdfPage ?? triple.sourcePage ?? null,
                        summary: `${source.bookTitle}中的教材出现记录`,
                        confidence: triple.confidence ?? 1,
                      },
                    ],
            ),
        );
        return [...local, ...lazyLocal, ...lazyCanonical].map((item) => ({
          ...item,
          triple,
        }));
      }),
    [directTriples, evidencePayloads, inspectionBook.evidenceByTriple, datasetBookMap],
  );
  const selectedOccurrences = useMemo(
    () => {
      if (!selected) return [];
      const loaded = [
        ...(canonicalGraph?.occurrences ?? []),
        ...Object.values(evidencePayloads).flatMap(
          (payload) => payload.occurrences,
        ),
      ].filter((occurrence) => occurrence.canonicalId === selected.id);
      if (loaded.length) return loaded;
      return (selected.bookKeys ?? []).map((key) => ({
        id: `index-${selected.id}-${key}`,
        canonicalId: selected.id,
        sourceEntityId: selected.id,
        sourceName: selected.name,
        textbook: key,
        textbookTitle: datasetBookMap.get(key)?.title ?? key,
        unit: null,
        lesson: null,
        page: selected.firstPageByBook?.[key] ?? null,
        sourceText: null,
        evidence: [],
        occurrenceRole: "教材出现",
        entityType: selected.type,
      }));
    },
    [canonicalGraph, datasetBookMap, evidencePayloads, selected],
  );
  const activeBooks =
    graphMode === "all" && canonicalBook
      ? [canonicalBook]
      : graphMode === "all"
        ? dataset.books
        : [currentBook];
  const networkEntities = activeBooks.flatMap((book) => book.entities);
  const networkTriples = activeBooks.flatMap((book) => book.triples);
  const typeCounts: Record<string, number> = {};
  const relationCounts: Record<string, number> = {};
  for (const entity of networkEntities)
    typeCounts[entity.type] = (typeCounts[entity.type] ?? 0) + 1;
  for (const triple of networkTriples)
    relationCounts[
      relationText(
        triple.predicate,
        activeBooks.find((book) => book.triples.includes(triple)) ??
          currentBook,
      )
    ] =
      (relationCounts[
        relationText(
          triple.predicate,
          activeBooks.find((book) => book.triples.includes(triple)) ??
            currentBook,
        )
      ] ?? 0) + 1;
  const typeRows = Object.entries(typeCounts).sort((a, b) => {
    const ai = ENTITY_TYPE_ORDER.indexOf(a[0]);
    const bi = ENTITY_TYPE_ORDER.indexOf(b[0]);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || b[1] - a[1];
  });
  const relationRows = Object.entries(relationCounts).sort((a, b) => {
    const ai = RELATION_PRIORITY.indexOf(a[0]);
    const bi = RELATION_PRIORITY.indexOf(b[0]);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || b[1] - a[1];
  });
  const maxTypeCount = Math.max(1, ...typeRows.map(([, count]) => count));
  const buildGroup = useCallback(
    (
      book: Book,
      index: number,
      centerOverride?: Entity,
      layout: "all" | "book" = "all",
    ): BookGroup => {
      const center = centerOverride ?? bookEntity(book);
      const spacious = layout === "book";
      const runtime = graphRuntimeFor(book, book.entities, book.triples);
      const edgeList = book.triples.filter(
        (t) =>
          t.objectId &&
          runtime.entityIdSet.has(t.subject) &&
          runtime.entityIdSet.has(t.objectId),
      );
      const base = [
        [420, 300],
        [1200, 300],
        [1980, 300],
        [420, 1050],
        [1200, 1050],
        [1980, 1050],
      ][index] ?? [1200, 650];
      const map = new Map<string, Triple>();
      for (const entity of book.entities) {
        if (entity.id !== center.id)
          map.set(
            entity.id,
            runtime.adjacencyMap.get(entity.id)?.[0]?.edge ?? {
              id: "synthetic-" + book.key + "-" + entity.id,
              subject: center.id,
              predicate: "RELATED_ENTITY",
              objectId: entity.id,
            },
          );
      }
      const ids = [...map.keys()];
      const positions = ids.map((id) => {
        const hash = stableSeed(book.key + "-" + id);
        const angle = ((hash % 100000) / 100000) * Math.PI * 2;
        const radial =
          Math.sqrt((Math.floor(hash / 100000) % 1000) / 1000) *
          (spacious ? 520 : 360);
        return {
          x: base[0] + Math.cos(angle) * radial,
          y: base[1] + Math.sin(angle) * radial * (spacious ? 0.78 : 0.72),
          entity: runtime.entityMap.get(id) ?? {
            id,
            name: id,
            type: "音乐概念",
          },
          triple: map.get(id)!,
        };
      });
      const positionById = new Map(positions.map((node, i) => [ids[i], node]));
      const links = edgeList.filter(
        (t) => positionById.has(t.subject) && positionById.has(t.objectId!),
      );
      for (let iteration = 0; iteration < (spacious ? 48 : 34); iteration++) {
        const force = positions.map(() => ({ x: 0, y: 0 }));
        for (let a = 0; a < positions.length; a++)
          for (let b = a + 1; b < positions.length; b++) {
            const dx = positions[a].x - positions[b].x;
            const dy = positions[a].y - positions[b].y;
            const distance = Math.max(spacious ? 48 : 36, Math.hypot(dx, dy));
            const push = Math.min(
              spacious ? 58 : 44,
              (spacious ? 15000 : 9000) / (distance * distance),
            );
            force[a].x += (dx / distance) * push;
            force[a].y += (dy / distance) * push;
            force[b].x -= (dx / distance) * push;
            force[b].y -= (dy / distance) * push;
          }
        for (const link of links) {
          const from = positionById.get(link.subject)!;
          const to = positionById.get(link.objectId!)!;
          const fromIndex = ids.indexOf(link.subject);
          const toIndex = ids.indexOf(link.objectId!);
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const spring = (distance - (spacious ? 245 : 190)) * 0.005;
          force[fromIndex].x += (dx / distance) * spring;
          force[fromIndex].y += (dy / distance) * spring;
          force[toIndex].x -= (dx / distance) * spring;
          force[toIndex].y -= (dy / distance) * spring;
        }
        positions.forEach((node, nodeIndex) => {
          const dx = base[0] - node.x;
          const dy = base[1] - node.y;
          force[nodeIndex].x += dx * (spacious ? 0.0009 : 0.0013);
          force[nodeIndex].y += dy * (spacious ? 0.0009 : 0.0013);
          const distance = Math.max(
            1,
            Math.hypot(node.x - base[0], node.y - base[1]),
          );
          if (distance < (spacious ? 195 : 155)) {
            force[nodeIndex].x += ((node.x - base[0]) / distance) * 5;
            force[nodeIndex].y += ((node.y - base[1]) / distance) * 5;
          }
          node.x += force[nodeIndex].x;
          node.y += force[nodeIndex].y;
          const boundedX = node.x - base[0];
          const boundedY = node.y - base[1];
          const ellipse = Math.hypot(
            boundedX / (spacious ? 620 : 470),
            boundedY / (spacious ? 460 : 350),
          );
          if (ellipse > 1) {
            node.x = base[0] + boundedX / ellipse;
            node.y = base[1] + boundedY / ellipse;
          }
        });
      }
      return { book, center, nodes: positions };
    },
    [bookEntity],
  );
  const allGroups = useMemo(
    () =>
      dataset.books.map((book, index) =>
        buildGroup(book, index, undefined, "all"),
      ),
    [buildGroup, dataset],
  );
  const singleGroup = useMemo(() => {
    const group = buildGroup(currentBook, 0, undefined, "book");
    return {
      ...group,
      nodes: group.nodes.map((node) => ({
        ...node,
        x: node.x + 780,
        y: node.y + 450,
      })),
    };
  }, [buildGroup, currentBook]);
  const canonicalGroup = useMemo<BookGroup | null>(() => {
    if (!canonicalBook) return null;
    const textbookPositions: Record<string, { x: number; y: number }> = {
      g7s1: { x: 360, y: 260 },
      g7s2: { x: 1200, y: 170 },
      g8s1: { x: 2040, y: 260 },
      g8s2: { x: 360, y: 1240 },
      g9s1: { x: 1200, y: 1330 },
      g9s2: { x: 2040, y: 1240 },
    };
    const relationByEntity = new Map<string, Triple>();
    for (const relationship of canonicalBook.triples) {
      if (!relationByEntity.has(relationship.subject))
        relationByEntity.set(relationship.subject, relationship);
      if (relationship.objectId && !relationByEntity.has(relationship.objectId))
        relationByEntity.set(relationship.objectId, relationship);
    }
    const nodes = canonicalBook.entities.map((entity) => {
      const activeLayout = entity.layouts?.[fullGraphLayout] ?? entity.layout;
      if (activeLayout)
        return {
          entity,
          triple: relationByEntity.get(entity.id) ?? {
            id: `canonical-node-${entity.id}`,
            subject: entity.id,
            predicate: "规范实体",
          },
          x: activeLayout.x,
          y: activeLayout.y,
        };
      const textbookKey = entity.bookKeys?.[0] ?? "g7s1";
      const seed = stableSeed(entity.canonicalKey ?? entity.id);
      let x = 1200;
      let y = 750;
      if (entity.type === "教材") {
        const fixed = textbookPositions[textbookKey] ?? { x: 1200, y: 750 };
        x = fixed.x;
        y = fixed.y;
      } else if ((entity.textbookCount ?? 1) >= 2) {
        const angle = ((seed % 100000) / 100000) * Math.PI * 2;
        const radius = 90 + ((Math.floor(seed / 97) % 1000) / 1000) * 370;
        x = 1200 + Math.cos(angle) * radius;
        y = 750 + Math.sin(angle) * radius * 0.72;
      } else {
        const base = textbookPositions[textbookKey] ?? { x: 1200, y: 750 };
        const angle = ((seed % 100000) / 100000) * Math.PI * 2;
        const radius = 90 + ((Math.floor(seed / 113) % 1000) / 1000) * 300;
        x = base.x + Math.cos(angle) * radius;
        y = base.y + Math.sin(angle) * radius * 0.62;
      }
      return {
        entity,
        triple: relationByEntity.get(entity.id) ?? {
          id: `canonical-node-${entity.id}`,
          subject: entity.id,
          predicate: "规范实体",
        },
        x,
        y,
      };
    });
    return {
      book: canonicalBook,
      center: {
        id: "CANONICAL_NETWORK_CENTER",
        name: "六册规范知识网络",
        type: "教材",
      },
      nodes,
      layoutMs: 0,
    };
  }, [canonicalBook, fullGraphLayout]);
  const focusGroup = useMemo(() => {
    if (!selected) return singleGroup;
    const currentRuntime = graphRuntimeFor(
      currentBook,
      currentBook.entities,
      currentBook.triples,
    );
    const priority = [
      "作曲",
      "作词",
      "编曲",
      "音乐体裁",
      "节拍",
      "速度特点",
      "使用调性",
      "所属国家或地区",
      "所属民族",
      "使用乐器",
      "表现主题",
      "表演形式",
      "曲式",
      "预留乐谱资源",
      "收录作品",
      "学习方式",
      "COMPOSER",
      "LYRICIST",
      "ARRANGER",
      "GENRE",
      "METER",
      "TEMPO",
      "TONALITY",
      "ORIGIN_REGION",
      "ETHNIC_GROUP",
      "INSTRUMENT",
      "THEME",
      "PERFORMANCE_FORM",
      "MUSICAL_FORM",
      "HAS_SCORE",
      "WORK_IN_UNIT",
      "LEARNING_MODE",
    ];
    const direct = (currentRuntime.adjacencyMap.get(selected.id) ?? [])
      .map((item) => item.edge)
      .sort((a, b) => {
        const ai = priority.indexOf(a.predicate);
        const bi = priority.indexOf(b.predicate);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      })
      .slice(0, 22);
    const focusEntities: Entity[] = [selected];
    const focusTriples: Triple[] = [];
    const seen = new Set<string>([selected.id]);
    for (const triple of direct) {
      if (triple.objectId) {
        const otherId =
          triple.subject === selected.id ? triple.objectId : triple.subject;
        const other = currentRuntime.entityMap.get(otherId);
        if (other && !seen.has(other.id)) {
          seen.add(other.id);
          focusEntities.push(other);
        }
        focusTriples.push(triple);
      } else if (triple.literal) {
        const literal: Entity = {
          id: "literal-" + triple.id,
          name: triple.literal,
          type: "属性值",
          description: relationText(triple.predicate, currentBook),
        };
        focusEntities.push(literal);
        focusTriples.push({ ...triple, objectId: literal.id, literal: null });
      }
    }
    const nodes = focusEntities
      .filter((entity) => entity.id !== selected.id)
      .map((entity, index, all) => {
        const count = all.length;
        const inner = count <= 14 || index < 14;
        const ringIndex = inner ? index : index - 14;
        const ringCount = inner ? Math.min(count, 14) : count - 14;
        const angle =
          -Math.PI / 2 +
          (ringIndex / Math.max(1, ringCount)) * Math.PI * 2 +
          (inner ? 0 : 0.16);
        const radius = inner ? 450 : 700;
        return {
          entity,
          triple: focusTriples.find(
            (t) => t.subject === entity.id || t.objectId === entity.id,
          ) ?? {
            id: "focus-" + entity.id,
            subject: selected.id,
            predicate: "RELATED_ENTITY",
            objectId: entity.id,
          },
          x: 1200 + Math.cos(angle) * radius,
          y: 750 + Math.sin(angle) * radius * 0.76,
        };
      });
    const focusBook = {
      ...currentBook,
      entities: focusEntities,
      triples: focusTriples,
      entityCount: focusEntities.length,
      tripleCount: focusTriples.length,
    };
    return { book: focusBook, center: selected, nodes };
  }, [currentBook, relationText, selected, singleGroup]);
  const visibleNodeIdsByBook = useMemo(() => {
    const result: Record<string, Set<string>> = {};
    for (const book of dataset.books) {
      const center = bookEntity(book);
      const degree = new Map<string, number>();
      for (const triple of book.triples) {
        degree.set(triple.subject, (degree.get(triple.subject) ?? 0) + 1);
        if (triple.objectId)
          degree.set(triple.objectId, (degree.get(triple.objectId) ?? 0) + 1);
      }
      const limit =
        graphMode === "all" ? 26 : book.key === currentBook.key ? 82 : 0;
      const seeds = new Set<string>([center.id]);
      const rankedWorks = book.entities
        .filter((entity) => isWorkType(entity.type))
        .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0));
      const rankedUnits = book.entities
        .filter((entity) => entity.type === "单元")
        .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0));
      const rankedAll = [...book.entities].sort(
        (a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0),
      );
      for (const entity of rankedUnits.slice(0, graphMode === "all" ? 3 : 10))
        seeds.add(entity.id);
      for (const entity of rankedWorks.slice(0, graphMode === "all" ? 14 : 42))
        seeds.add(entity.id);
      for (const entity of rankedAll) {
        if (seeds.size >= limit) break;
        seeds.add(entity.id);
      }
      for (const id of expandedNodeIds[book.key] ?? []) seeds.add(id);
      if (book.key === currentBook.key && selectedId) seeds.add(selectedId);
      result[book.key] = seeds;
    }
    return result;
  }, [
    bookEntity,
    currentBook.key,
    dataset.books,
    expandedNodeIds,
    graphMode,
    selectedId,
  ]);
  const canonicalEntityById = useMemo(
    () =>
      canonicalBook
        ? graphRuntimeFor(
            canonicalBook,
            canonicalBook.entities,
            canonicalBook.triples,
          ).entityMap
        : new Map<string, Entity>(),
    [canonicalBook],
  );
  const canonicalEntityBySearchKey = useMemo(() => {
    const map = new Map<string, Entity>();
    for (const entity of canonicalBook?.entities ?? []) {
      if (entity.canonicalKey) map.set(entity.canonicalKey, entity);
      map.set(
        `${entity.name.trim().toLowerCase()}|${schemaCategoryFor(entity.type)}`,
        entity,
      );
      for (const alias of entity.aliases ?? [])
        map.set(
          `${alias.trim().toLowerCase()}|${schemaCategoryFor(entity.type)}`,
          entity,
        );
    }
    return map;
  }, [canonicalBook]);
  const perspectiveEntityIds = useMemo(() => {
    const ids = new Set<string>();
    if (!canonicalBook) return ids;
    if (graphPerspective === "comprehensive") {
      for (const entity of canonicalBook.entities) ids.add(entity.id);
      return ids;
    }
    if (graphPerspective === "music") {
      for (const entity of canonicalBook.entities) {
        const category = schemaCategoryFor(entity.type);
        if (!["textbook", "activity", "goal"].includes(category)) ids.add(entity.id);
      }
      return ids;
    }
    for (const relationship of canonicalBook.triples) {
      if (
        relationship.objectId &&
        relationshipMatchesPerspective(relationship, graphPerspective)
      ) {
        ids.add(relationship.subject);
        ids.add(relationship.objectId);
      }
    }
    return ids;
  }, [canonicalBook, graphPerspective]);
  const filteredSelectedId = typeFilter === "全部" ? null : selectedId;
  const fullGraphVisibleIds = useMemo(() => {
    const ids = new Set<string>();
    if (!canonicalBook) return ids;
    for (const entity of canonicalBook.entities) {
      const isTextbook = entity.type === "教材";
      const isShared = (entity.textbookCount ?? 1) >= 2;
      const sourceLayerVisible =
        graphPerspective === "textbook" ||
        fullGraphLayout === "textbook" ||
        showTextbookSources ||
        fullGraphView === "ownership";
      const visibleInMode =
        (fullGraphView === "all" && (!isTextbook || sourceLayerVisible)) ||
        fullGraphView === "ownership" ||
        (fullGraphView === "cross" &&
          (isShared || (isTextbook && sourceLayerVisible))) ||
        (fullGraphView === "knowledge" && !isTextbook);
      if (
        visibleInMode &&
        graphFilters.filteredEntityIds.has(entity.id) &&
        (!graphFilters.relationEndpointIds || graphFilters.relationEndpointIds.has(entity.id)) &&
        perspectiveEntityIds.has(entity.id) &&
        visibleSchemaKeys.includes(schemaCategoryFor(entity.type)) &&
        !hiddenNodeKeys.includes(`${canonicalBook.key}-${entity.id}`) &&
        (typeFilter === "全部" ||
          entity.type === typeFilter ||
          entity.id === filteredSelectedId)
      )
        ids.add(entity.id);
    }
    return ids;
  }, [
    canonicalBook,
    fullGraphLayout,
    fullGraphView,
    graphPerspective,
    perspectiveEntityIds,
    hiddenNodeKeys,
    filteredSelectedId,
    showTextbookSources,
    typeFilter,
    visibleSchemaKeys,
    graphFilters.filteredEntityIds,
    graphFilters.relationEndpointIds,
  ]);
  const fullGraphRelationships = useMemo(() => {
    if (!canonicalBook) return [] as Triple[];
    return canonicalBook.triples.filter((relationship) => {
      if (
        !relationship.objectId ||
        !fullGraphVisibleIds.has(relationship.subject) ||
        !fullGraphVisibleIds.has(relationship.objectId) ||
        hiddenRelations.includes(
          relationText(relationship.predicate, canonicalBook),
        )
      )
        return false;
      if (!relationshipMatchesPerspective(relationship, graphPerspective))
        return false;
      if (fullGraphView === "ownership")
        return Boolean(relationship.provenance);
      if (
        fullGraphLayout === "knowledge" &&
        graphPerspective !== "textbook" &&
        !showTextbookSources &&
        relationship.provenance
      )
        return false;
      if (fullGraphView === "knowledge") return !relationship.provenance;
      if (fullGraphView === "cross") {
        const source = canonicalEntityById.get(relationship.subject);
        const target = canonicalEntityById.get(relationship.objectId);
        return Boolean(
          relationship.provenance ||
          relationship.crossBook ||
          ((source?.textbookCount ?? 1) >= 2 &&
            (target?.textbookCount ?? 1) >= 2),
        );
      }
      return true;
    });
  }, [
    canonicalBook,
    canonicalEntityById,
    fullGraphLayout,
    fullGraphView,
    fullGraphVisibleIds,
    hiddenRelations,
    graphPerspective,
    relationText,
    showTextbookSources,
  ]);
  const bookSceneVisibleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const entity of currentBook.entities) {
      if (entity.type === "教材" && !showTextbookSources) continue;
      if (!visibleSchemaKeys.includes(schemaCategoryFor(entity.type))) continue;
      if (hiddenNodeKeys.includes(`${currentBook.key}-${entity.id}`)) continue;
      if (typeFilter !== "全部" && entity.type !== typeFilter && entity.id !== selectedId) continue;
      const canonical = canonicalEntityBySearchKey.get(`${entity.name.trim().toLowerCase()}|${schemaCategoryFor(entity.type)}`);
      if (canonical && (!graphFilters.filteredEntityIds.has(canonical.id) || !perspectiveEntityIds.has(canonical.id) || (graphFilters.relationEndpointIds && !graphFilters.relationEndpointIds.has(canonical.id)))) continue;
      ids.add(entity.id);
    }
    return ids;
  }, [canonicalEntityBySearchKey, currentBook, graphFilters.filteredEntityIds, graphFilters.relationEndpointIds, hiddenNodeKeys, perspectiveEntityIds, selectedId, showTextbookSources, typeFilter, visibleSchemaKeys]);
  const bookSceneRelationshipIds = useMemo(
    () => new Set(currentBook.triples.filter((triple) => triple.objectId && !hiddenRelations.includes(relationText(triple.predicate, currentBook))).map((triple) => triple.id)),
    [currentBook, hiddenRelations, relationText],
  );
  const displayedGraphStats = (() => {
    if (graphMode === "all" && canonicalBook) {
      return {
        nodes: fullGraphVisibleIds.size,
        relationships: fullGraphRelationships.length,
        labels: new Set(
          [...fullGraphVisibleIds]
            .map((id) => canonicalEntityById.get(id))
            .filter(Boolean)
            .map((entity) => schemaCategoryFor(entity!.type)),
        ).size,
      };
    }
    if (graphMode !== "all" && fullGraphRenderer === "sigma") {
      const relationships = currentBook.triples.filter((triple) =>
        bookSceneRelationshipIds.has(triple.id) &&
        bookSceneVisibleIds.has(triple.subject) &&
        bookSceneVisibleIds.has(triple.objectId ?? ""),
      ).length;
      const labels = new Set(
        currentBook.entities.filter((entity) => bookSceneVisibleIds.has(entity.id)).map((entity) => schemaCategoryFor(entity.type)),
      ).size;
      return { nodes: bookSceneVisibleIds.size, relationships, labels };
    }
    const books = graphMode === "all" ? dataset.books : [currentBook];
    let nodes = 0;
    let relationships = 0;
    const labels = new Set<SchemaCategoryKey>();
    for (const book of books) {
      const center = bookEntity(book);
      const visibleIds = new Set<string>([center.id]);
      const sourceIds =
        graphMode === "focus" && book.key === currentBook.key
          ? new Set(focusGroup.book.entities.map((entity) => entity.id))
          : (visibleNodeIdsByBook[book.key] ?? new Set<string>());
      for (const id of sourceIds) {
        const entity = book.entities.find((item) => item.id === id);
        if (!entity) continue;
        const key = `${book.key}-${id}`;
        const category = schemaCategoryFor(entity.type);
        if (
          !hiddenNodeKeys.includes(key) &&
          visibleSchemaKeys.includes(category)
        ) {
          visibleIds.add(id);
          labels.add(category);
        }
      }
      nodes += visibleIds.size;
      relationships += book.triples.filter(
        (triple) =>
          triple.objectId &&
          visibleIds.has(triple.subject) &&
          visibleIds.has(triple.objectId) &&
          !hiddenRelations.includes(relationText(triple.predicate, book)),
      ).length;
    }
    return { nodes, relationships, labels: labels.size };
  })();
  const rememberView = () => {
    const snapshot: ViewSnapshot = {
      expandedNodeIds,
      highlightedCanonicalIds,
      highlightedCanonicalRelationIds,
    };
    setViewHistory((previous) => [...previous.slice(-19), snapshot]);
  };
  const undoView = () => {
    const snapshot = viewHistory.at(-1);
    if (!snapshot) return;
    setExpandedNodeIds(snapshot.expandedNodeIds);
    setHighlightedCanonicalIds(snapshot.highlightedCanonicalIds);
    setHighlightedCanonicalRelationIds(
      snapshot.highlightedCanonicalRelationIds,
    );
    setViewHistory((previous) => previous.slice(0, -1));
  };
  const collapseExpansion = () => {
    rememberView();
    if (graphMode === "all") {
      setHighlightedCanonicalIds([]);
      setHighlightedCanonicalRelationIds([]);
    } else {
      setExpandedNodeIds((previous) => ({
        ...previous,
        [currentBook.key]: selected ? [selected.id] : [],
      }));
    }
  };
  const expandNode = (
    entity: Entity,
    book: Book,
    depth: 1 | 2 | 3 = 1,
    category?: SchemaCategoryKey,
    relationFilter?: string,
  ) => {
    rememberView();
    const runtime = graphRuntimeFor(book, book.entities, book.triples);
    const discovered = neighborhood(
      runtime,
      entity.id,
      depth,
      relationFilter
        ? (triple) =>
            relationText(triple.predicate, book) === relationFilter
        : undefined,
    );
    const allowed = [...discovered.nodeIds].filter((id) => {
      if (!category || id === entity.id) return true;
      const neighbor = runtime.entityMap.get(id);
      return neighbor ? schemaCategoryFor(neighbor.type) === category : false;
    });
    if (book.key === "canonical") {
      setHighlightedCanonicalIds(allowed);
      setHighlightedCanonicalRelationIds([...discovered.edgeIds]);
      const target = canonicalGroup?.nodes.find(
        (node) => node.entity.id === entity.id,
      );
      if (target) {
        setCanvasPan({ x: 1200 - target.x, y: 750 - target.y });
        setZoom((value) => Math.max(value, 1.05));
      }
    } else {
      setExpandedNodeIds((previous) => ({
        ...previous,
        [book.key]: [...new Set([...(previous[book.key] ?? []), ...allowed])],
      }));
      setBookKey(book.key);
      setGraphMode("book");
    }
    setSelectedId(entity.id);
    setPanel("relations");
    setContextMenu(null);
  };
  const hideNode = (entity: Entity, book: Book) => {
    const key = `${book.key}-${entity.id}`;
    setHiddenNodeKeys((previous) =>
      previous.includes(key) ? previous : [...previous, key],
    );
    setContextMenu(null);
  };
  const showNodeEvidence = (entity: Entity, book: Book) => {
    selectEntity(entity, book);
    setPanel("evidence");
    setContextMenu(null);
  };
  const selectEntity = (entity: Entity, book = currentBook, focus = false) => {
    setInspectorOpen(true);
    if (book.key !== "canonical" && book.key !== bookKey) setBookKey(book.key);
    setSelectedId(entity.id);
    setQuery("");
    setView("graph");
    setContextMenu(null);
    setPanel("overview");
    if (book.key === "canonical") {
      setGraphMode("all");
      setFocusSelectionToken((value) => value + 1);
      if (focus) expandNode(entity, book, 1);
      return;
    }
    if (focus) {
      setGraphMode("focus");
      setTypeFilter("全部");
      setShowLabels(true);
      setZoom(1.65);
      setFocusSelectionToken((value) => value + 1);
    }
  };
  const selectSearchResult = (entity: Entity, book: Book) => {
    setInspectorOpen(true);
    const canonical =
      (entity.canonicalKey
        ? canonicalEntityBySearchKey.get(entity.canonicalKey)
        : undefined) ??
      canonicalEntityBySearchKey.get(
        `${entity.name.trim().toLowerCase()}|${schemaCategoryFor(entity.type)}`,
      );
    if (canonical && canonicalBook) {
      resetGraphFilters();
      setView("graph");
      setGraphMode("all");
      setGraphPerspective("comprehensive");
      setFullGraphView("all");
      setTypeFilter("全部");
      setVisibleSchemaKeys((previous) => [...new Set([...previous, schemaCategoryFor(canonical.type)])]);
      setHiddenNodeKeys((previous) => previous.filter((key) => key !== `canonical-${canonical.id}`));
      if (canonical.type === "教材") setShowTextbookSources(true);
      setSelectedId(canonical.id);
      setFocusSelectionToken((value) => value + 1);
      setPanel("overview");
      setShowLabels(true);
      setHighlightedCanonicalIds([]);
      setHighlightedCanonicalRelationIds([]);
      setQuery("");
      return;
    }
    selectEntity(entity, book, true);
  };
  const chooseBook = (book: Book) => {
    setKnowledgeDetailOpen(false);
    setBookKey(book.key);
    const work =
      book.entities.find((e) => isWorkType(e.type)) ?? book.entities[0];
    if (work) setSelectedId(work.id);
    setGraphMode("book");
    setView("graph");
    setZoom(0.64);
    setCanvasPan({ x: 0, y: 0 });
    setCameraResetToken((value) => value + 1);
  };
  const chooseFullGraph = () => {
    setKnowledgeDetailOpen(false);
    setGraphMode("all");
    setView("graph");
    setZoom(0.64);
    setShowLabels(false);
    setCanvasPan({ x: 0, y: 0 });
    setHighlightedCanonicalIds([]);
    setHighlightedCanonicalRelationIds([]);
    setFullGraphLayout("knowledge");
    setGraphPerspective("comprehensive");
    setFocusSelectionToken(0);
    setCameraResetToken((value) => value + 1);
    setShowTextbookSources(false);
    const core = canonicalBook?.entities
      .filter((entity) => entity.type !== "教材")
      .sort(
        (a, b) =>
          (a.visualRank ?? Number.MAX_SAFE_INTEGER) -
            (b.visualRank ?? Number.MAX_SAFE_INTEGER) ||
          (b.textbookCount ?? 1) - (a.textbookCount ?? 1) ||
          (b.degree ?? 0) - (a.degree ?? 0),
      )[0];
    if (core) setSelectedId(core.id);
  };
  const openPathFinder = (entity?: Entity) => {
    setView("graph");
    setGraphMode("all");
    setPathFinderOpen(true);
    if (entity) {
      const canonical = canonicalEntityById.get(entity.id) ??
        (entity.canonicalKey ? canonicalEntityBySearchKey.get(entity.canonicalKey) : undefined) ??
        canonicalEntityBySearchKey.get(`${entity.name.trim().toLowerCase()}|${schemaCategoryFor(entity.type)}`);
      setPathStartId(canonical?.id ?? "");
    }
    if (entity) setPathEndId("");
    setActivePathIndex(0);
    setContextMenu(null);
  };
  const applyGraphPath = () => {
    if (!activeGraphPath) return;
    resetGraphFilters(); setFullGraphLayout("knowledge"); setInspectorOpen(true);
    setFocusSelectionToken(value => value + 1);
    setView("graph");
    setGraphMode("all");
    setFullGraphView("all");
    setGraphPerspective("comprehensive");
    setTypeFilter("全部");
    setVisibleSchemaKeys([...ALL_SCHEMA_KEYS]);
    setHiddenRelations([]);
    setHiddenNodeKeys((previous) => previous.filter((key) => !activeGraphPath.nodeIds.some((id) => key === `canonical-${id}`)));
    if (activeGraphPath.nodeIds.some((id) => canonicalEntityById.get(id)?.type === "教材") ||
      activeGraphPath.edgeIds.some((id) => canonicalBook?.triples.find((edge) => edge.id === id)?.provenance))
      setShowTextbookSources(true);
    setHighlightedCanonicalIds(activeGraphPath.nodeIds);
    setHighlightedCanonicalRelationIds(activeGraphPath.edgeIds);
    setSelectedId(activeGraphPath.nodeIds.at(-1) ?? activeGraphPath.nodeIds[0]);
    setShowLabels(true);
    setPanel("relations");
  };
  const openResearchPair = useCallback(
    (leftBookKey: string, rightBookKey: string, entityIds: string[]) => {
      if (!canonicalBook || !entityIds.length) return;
      resetGraphFilters(); setGraphPerspective("comprehensive"); setTypeFilter("全部"); setInspectorOpen(false);
      const idSet = new Set(entityIds);
      const relatedRelationships = canonicalBook.triples
        .filter(
          (relationship) =>
            relationship.objectId &&
            idSet.has(relationship.subject) &&
            idSet.has(relationship.objectId),
        )
        .map((relationship) => relationship.id);
      setView("graph");
      setGraphMode("all");
      setFullGraphLayout("knowledge");
      setFullGraphView("all");
      setHighlightedCanonicalIds(entityIds);
      setHighlightedCanonicalRelationIds(relatedRelationships);
      setSelectedId(entityIds[0]);
      setShowLabels(true);
      setZoom(0.95);
      const points = canonicalBook.entities
        .filter((entity) => idSet.has(entity.id) && entity.layout)
        .map((entity) => entity.layout as { x: number; y: number });
      if (points.length) {
        const average = points.reduce(
          (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
          { x: 0, y: 0 },
        );
        setCanvasPan({
          x: 1200 - average.x / points.length,
          y: 750 - average.y / points.length,
        });
      }
      const left = datasetBookMap.get(leftBookKey);
      const right = datasetBookMap.get(rightBookKey);
      if (left && right)
        setAssistantResult({
          summary: `${left.grade}${left.semester.slice(0, 1)} × ${right.grade}${right.semester.slice(0, 1)}共享知识`,
          answer: `已在六册全景中高亮两册教材共同覆盖的 ${entityIds.length} 个规范知识实体。该结果表示实体融合后的教材关联，不等同于因果或前置关系。`,
          facts: [],
          poweredBy: "graph",
        });
    },
    [canonicalBook, datasetBookMap, resetGraphFilters],
  );
  const openResearchEntity = useCallback(
    (entity: { id: string }) => {
      const target = canonicalEntityById.get(entity.id);
      if (!target || !canonicalBook) return;
      resetGraphFilters(); setGraphPerspective("comprehensive"); setTypeFilter("全部"); setInspectorOpen(true);
      setFullGraphView("all"); setFocusSelectionToken(value => value + 1);
      setView("graph");
      setGraphMode("all");
      setFullGraphLayout("knowledge");
      setSelectedId(target.id);
      setHighlightedCanonicalIds([]);
      setHighlightedCanonicalRelationIds([]);
      setShowLabels(true);
      setZoom(1.45);
      if (target.layout)
        setCanvasPan({ x: 1200 - target.layout.x, y: 750 - target.layout.y });
    },
    [canonicalBook, canonicalEntityById, resetGraphFilters],
  );
  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchResults[0])
      selectSearchResult(searchResults[0].entity, searchResults[0].book);
  };
  const askAssistant = async (e: FormEvent) => {
    e.preventDefault();
    const question = assistantQuestion.trim();
    if (!question) {
      setAssistantResult({
        summary: "需要一个问题",
        answer:
          "请输入作品、人物、体裁或音乐概念，我会从六册教材图谱中寻找证据。",
        facts: [],
        poweredBy: "graph",
      });
      return;
    }
    setAssistantBusy(true);
    const compact = (value: string) =>
      value.toLowerCase().replace(/[《》“”"'\s，。！？、：；·（）()]/g, "");
    const normalizedQuestion = compact(question);
    const matches: Array<{ entity: Entity; book: Book; score: number }> = [];
    for (const book of dataset.books)
      for (const entity of book.entities) {
        let score = 0;
        for (const term of [entity.name, ...(entity.aliases ?? [])]) {
          const normalizedTerm = compact(term);
          if (normalizedTerm && normalizedQuestion.includes(normalizedTerm))
            score = Math.max(score, 240 + normalizedTerm.length);
          else if (
            normalizedQuestion.length > 1 &&
            normalizedTerm.includes(normalizedQuestion)
          )
            score = Math.max(score, 100);
        }
        if (question.includes(entity.type)) score = Math.max(score, 30);
        if (score > 0) matches.push({ entity, book, score });
      }
    matches.sort((a, b) => b.score - a.score);
    const match =
      matches[0] ??
      (assistantResult?.entity &&
      assistantResult.book &&
      /[它这首这个该作品还有那么]/.test(question)
        ? {
            entity: assistantResult.entity,
            book: assistantResult.book,
            score: 50,
          }
        : undefined);
    if (!match) {
      setAssistantResult({
        summary: "没有找到教材证据",
        answer:
          "当前六册教材知识图谱中没有找到与这个问题直接对应的实体。请尝试输入完整的作品名、人物名或音乐概念。",
        facts: [],
        poweredBy: "graph",
      });
      setAssistantBusy(false);
      return;
    }
    const intentHints: Record<string, string[]> = {
      作曲: ["作曲", "谁创作", "曲作者", "作者"],
      作词: ["作词", "词作者"],
      体裁: ["体裁", "类型"],
      速度: ["速度", "快慢"],
      节拍: ["节拍", "拍子"],
      来源地区: ["来源", "地区", "国家"],
      民族: ["民族"],
      乐器: ["乐器", "演奏什么"],
      表现主题: ["主题", "表现什么"],
      拥有乐谱: ["乐谱", "谱子"],
      学习方式: ["学习方式", "怎么学习"],
    };
    const intent = Object.entries(intentHints).find(([, hints]) =>
      hints.some((hint) => question.includes(hint)),
    )?.[0];
    const anchors: Array<{ entity: Entity; book: Book }> = [];
    const anchorName = compact(match.entity.name);
    for (const book of dataset.books)
      for (const entity of book.entities)
        if (compact(entity.name) === anchorName) anchors.push({ entity, book });
    if (
      !anchors.some(
        (item) =>
          item.entity.id === match.entity.id &&
          item.book.key === match.book.key,
      )
    )
      anchors.unshift({ entity: match.entity, book: match.book });
    const seen = new Set<string>();
    const neighbors = new Set<string>();
    const hitBooks = new Set<string>();
    const facts: AssistantFact[] = [];
    const addFact = (book: Book, triple: Triple, distance: 1 | 2) => {
      const map = new Map(book.entities.map((entity) => [entity.id, entity]));
      const subject = map.get(triple.subject)?.name ?? triple.subject;
      const object = triple.objectId
        ? (map.get(triple.objectId)?.name ?? triple.objectId)
        : (triple.literal ?? "未记录");
      const predicate = relationText(triple.predicate, book);
      const key = subject + "|" + predicate + "|" + object + "|" + book.key;
      if (seen.has(key) || facts.length >= 32) return;
      seen.add(key);
      hitBooks.add(book.key);
      facts.push({
        subject,
        predicate,
        object,
        bookTitle: book.title,
        page: triple.sourcePage,
        distance,
      });
    };
    for (const anchor of anchors) {
      const direct = anchor.book.triples
        .filter(
          (t) =>
            t.subject === anchor.entity.id || t.objectId === anchor.entity.id,
        )
        .sort((a, b) => {
          const aIntent =
            intent && relationText(a.predicate, anchor.book).includes(intent)
              ? -1
              : 0;
          const bIntent =
            intent && relationText(b.predicate, anchor.book).includes(intent)
              ? -1
              : 0;
          return aIntent - bIntent + (b.confidence ?? 0) - (a.confidence ?? 0);
        })
        .slice(0, 18);
      for (const triple of direct) {
        addFact(anchor.book, triple, 1);
        if (triple.objectId)
          neighbors.add(
            anchor.book.key +
              "|" +
              (triple.subject === anchor.entity.id
                ? triple.objectId
                : triple.subject),
          );
      }
      const neighborIds = [
        ...new Set(
          direct.flatMap((triple) =>
            triple.objectId
              ? [
                  triple.subject === anchor.entity.id
                    ? triple.objectId
                    : triple.subject,
                ]
              : [],
          ),
        ),
      ].slice(0, 10);
      for (const neighborId of neighborIds) {
        for (const triple of anchor.book.triples
          .filter(
            (item) =>
              (item.subject === neighborId || item.objectId === neighborId) &&
              item.subject !== anchor.entity.id &&
              item.objectId !== anchor.entity.id,
          )
          .slice(0, 2))
          addFact(anchor.book, triple, 2);
      }
    }
    const comparePredicates = new Set([
      "作曲",
      "作词",
      "编曲",
      "音乐体裁",
      "所属国家或地区",
      "来源地区",
      "所属民族",
      "民族",
      "使用乐器",
      "乐器",
      "音乐风格",
      "表现主题",
      "表演形式",
      "曲式结构",
      "曲式",
    ]);
    const signatures = (book: Book, entity: Entity) => {
      const map = new Map(book.entities.map((item) => [item.id, item]));
      const values = new Map<string, string>();
      for (const triple of book.triples.filter(
        (item) => item.subject === entity.id,
      )) {
        const predicate = relationText(triple.predicate, book);
        if (!comparePredicates.has(predicate)) continue;
        const object = triple.objectId
          ? (map.get(triple.objectId)?.name ?? "")
          : (triple.literal ?? "");
        if (object)
          values.set(
            predicate + "|" + compact(object),
            predicate + "：" + object,
          );
      }
      return values;
    };
    const anchorSignatures = new Map<string, string>();
    for (const anchor of anchors)
      for (const [key, label] of signatures(anchor.book, anchor.entity))
        anchorSignatures.set(key, label);
    const similarWorks: Array<SimilarWork & { score: number }> = [];
    for (const book of dataset.books)
      for (const entity of book.entities) {
        if (!isWorkType(entity.type) || compact(entity.name) === anchorName)
          continue;
        const shared = [...signatures(book, entity)]
          .filter(([key]) => anchorSignatures.has(key))
          .map(([, label]) => label);
        if (shared.length)
          similarWorks.push({
            name: entity.name,
            bookTitle: book.title,
            shared: shared.slice(0, 4),
            score: shared.length,
          });
      }
    similarWorks.sort(
      (a, b) => b.score - a.score || a.name.localeCompare(b.name, "zh-CN"),
    );
    const analytics: GraphAnalytics = {
      booksHit: hitBooks.size,
      directCount: facts.filter((fact) => fact.distance === 1).length,
      multiHopCount: facts.filter((fact) => fact.distance === 2).length,
      relationTypes: new Set(facts.map((fact) => fact.predicate)).size,
      neighborCount: neighbors.size,
      similarWorks: similarWorks
        .slice(0, 5)
        .map(({ name, bookTitle, shared }) => ({ name, bookTitle, shared })),
    };
    const fallback = composeGraphAnswer(
      match.entity.name,
      match.book.title,
      facts,
      analytics,
    );
    let answer = fallback;
    let poweredBy: "gpt" | "graph" = "graph";
    if (!IS_STATIC_EXPORT) {
      try {
        const response = await fetch("/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            question,
            entityName: match.entity.name,
            bookTitle: match.book.title,
            facts,
            analytics,
            previousAnswer: assistantResult?.answer ?? "",
          }),
        });
        if (response.ok) {
          const payload = (await response.json()) as {
            answer?: string;
            poweredBy?: string;
          };
          if (payload.answer) {
            answer = payload.answer;
            poweredBy = payload.poweredBy === "gpt" ? "gpt" : "graph";
          }
        }
      } catch {
        /* 无模型密钥时继续使用本地图谱逻辑回答。 */
      }
    }
    const summary = `${poweredBy === "gpt" ? "AI 深度分析" : "图谱分析"} · ${analytics.booksHit} 册 · ${analytics.directCount} 条直接关系 · ${analytics.multiHopCount} 条二跳关系`;
    setAssistantResult({
      summary,
      answer,
      facts,
      analytics,
      entity: match.entity,
      book: match.book,
      poweredBy,
    });
    setAssistantBusy(false);
  };
  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text()) as { books?: Book[] };
      const books = payload.books?.length ?? 0;
      const triples =
        payload.books?.reduce((s, b) => s + (b.triples?.length ?? 0), 0) ?? 0;
      if (IS_STATIC_EXPORT) {
        setImportSummary(
          `已读取 ${file.name}：${books || 1} 册、${fmt(triples)} 条关系。静态公开版支持本地校验；在线持久化导入需连接独立后端。`,
        );
        return;
      }
      setImportSummary(
        `已读取 ${file.name}：${books || 1} 册、${fmt(triples)} 条关系，正在写入…`,
      );
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        statements?: number;
      };
      setImportSummary(
        response.ok && result.ok
          ? `导入成功：${fmt(result.statements ?? 0)} 条持久化记录。`
          : `格式已校验，但未写入：${result.message ?? "请检查登录状态。"}`,
      );
    } catch {
      setImportSummary("文件格式无法识别，请上传标准 JSON 导入包。");
    }
  };
  const nodePoint = (
    node: Pick<PositionedNode, "entity" | "x" | "y">,
    book: Book,
  ) => {
    const nodeKey = book.key + "-" + node.entity.id;
    const dragged = dragPositions[nodeKey];
    if (dragged) return dragged;
    if (pinnedNodeKeys.includes(nodeKey)) return { x: node.x, y: node.y };
    if (!motionEnabled || graphMode === "focus")
      return { x: node.x, y: node.y };
    const seed = stableSeed(nodeKey);
    const amplitude = graphMode === "all" ? 4.5 : 8;
    return {
      x:
        node.x + Math.sin(motionPhase + (seed % 31)) * (amplitude + (seed % 4)),
      y:
        node.y +
        Math.cos(motionPhase * 0.82 + (seed % 47)) *
          (amplitude * 0.72 + (seed % 3)),
    };
  };
  const graphPointer = (event: ReactPointerEvent<SVGGElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    const rect = svg?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const rawX = ((event.clientX - rect.left) / rect.width) * 2400;
    const rawY = ((event.clientY - rect.top) / rect.height) * 1500;
    return {
      x: 1200 + (rawX - 1200 - canvasPan.x) / zoom,
      y: 750 + (rawY - 750 - canvasPan.y) / zoom,
    };
  };
  const beginCanvasPan = (event: ReactPointerEvent<SVGRectElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPanStart({
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      originX: canvasPan.x,
      originY: canvasPan.y,
    });
  };
  const moveCanvasPan = (event: ReactPointerEvent<SVGRectElement>) => {
    if (!panStart || panStart.pointerId !== event.pointerId) return;
    const svg = event.currentTarget.ownerSVGElement;
    const rect = svg?.getBoundingClientRect();
    if (!rect) return;
    setCanvasPan({
      x:
        panStart.originX +
        ((event.clientX - panStart.clientX) / rect.width) * 2400,
      y:
        panStart.originY +
        ((event.clientY - panStart.clientY) / rect.height) * 1500,
    });
  };
  const endCanvasPan = (event: ReactPointerEvent<SVGRectElement>) => {
    if (!panStart || panStart.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setPanStart(null);
  };
  const beginDrag = (
    event: ReactPointerEvent<SVGGElement>,
    entity: Entity,
    book: Book,
    point: { x: number; y: number },
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const cursor = graphPointer(event);
    setDragging({
      nodeKey: book.key + "-" + entity.id,
      pointerId: event.pointerId,
      offsetX: cursor.x - point.x,
      offsetY: cursor.y - point.y,
      startClientX: event.clientX,
      startClientY: event.clientY,
      entity,
      book,
    });
  };
  const moveDrag = (event: ReactPointerEvent<SVGGElement>) => {
    if (!dragging || dragging.pointerId !== event.pointerId) return;
    const cursor = graphPointer(event);
    setDragPositions((previous) => ({
      ...previous,
      [dragging.nodeKey]: {
        x: cursor.x - dragging.offsetX,
        y: cursor.y - dragging.offsetY,
      },
    }));
  };
  const endDrag = (event: ReactPointerEvent<SVGGElement>) => {
    if (!dragging || dragging.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const moved = Math.hypot(
      event.clientX - dragging.startClientX,
      event.clientY - dragging.startClientY,
    );
    if (moved < 5) selectEntity(dragging.entity, dragging.book);
    else
      setPinnedNodeKeys((previous) =>
        previous.includes(dragging.nodeKey)
          ? previous
          : [...previous, dragging.nodeKey],
      );
    setDragging(null);
  };
  const openContextMenu = (
    event: ReactMouseEvent<SVGGElement>,
    entity: Entity,
    book: Book,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const canvas = event.currentTarget.ownerSVGElement?.closest(".neo-canvas");
    const rect = canvas?.getBoundingClientRect();
    setContextMenu({
      x: rect ? event.clientX - rect.left : 24,
      y: rect ? event.clientY - rect.top : 24,
      entity,
      book,
    });
  };
  const togglePin = (entity: Entity, book: Book) => {
    const key = `${book.key}-${entity.id}`;
    const pinned = pinnedNodeKeys.includes(key);
    setPinnedNodeKeys((previous) =>
      pinned ? previous.filter((item) => item !== key) : [...previous, key],
    );
    setContextMenu(null);
  };
  const restoreNodePosition = (entity: Entity, book: Book) => {
    const key = `${book.key}-${entity.id}`;
    setPinnedNodeKeys(previous => previous.filter(item => item !== key));
    setDragPositions((previous) => {
        const next = { ...previous };
        delete next[key];
        if (book.key === "canonical") {
          for (const positionKey of Object.keys(next)) {
            if (positionKey.startsWith("canonical:") && positionKey.endsWith(`-${entity.id}`)) delete next[positionKey];
          }
        }
        return next;
    });
    setContextMenu(null);
  };
  const renderNode = (node: PositionedNode, book: Book) => {
    const nodeKey = book.key + "-" + node.entity.id;
    const selectedNode = node.entity.id === selectedId;
    const highlighted = selectedNode || hoveredId === nodeKey;
    const semantic = schemaCategoryMeta(node.entity.type);
    const radius = selectedNode
      ? 25
      : semantic.nodeSize === "large"
        ? 19
        : semantic.nodeSize === "medium"
          ? 15
          : 12;
    const label =
      node.entity.name.length > 14
        ? node.entity.name.slice(0, 14) + "…"
        : node.entity.name;
    const point = nodePoint(node, book);
    return (
      <g
        key={nodeKey}
        className={
          "svg-node draggable " +
          `schema-${semantic.key}` +
          (highlighted ? " highlighted" : "") +
          (dragging?.nodeKey === nodeKey ? " dragging" : "")
        }
        transform={"translate(" + point.x + " " + point.y + ")"}
        onMouseEnter={() => setHoveredId(nodeKey)}
        onMouseLeave={() => setHoveredId(null)}
        onPointerDown={(event) => beginDrag(event, node.entity, book, point)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={() => setDragging(null)}
        onDoubleClick={() => openKnowledge(node.entity, book)}
        onContextMenu={(event) => openContextMenu(event, node.entity, book)}
      >
        <title>{node.entity.name + " · " + node.entity.type}</title>
        <circle r={radius} />
        {showLabels && (
          <>
            <text className="node-glyph" y="-6">
              {semantic.key === "person"
                ? "✦"
                : semantic.key === "work"
                  ? "♫"
                  : semantic.key === "genre"
                    ? "◒"
                    : "◆"}
            </text>
            <text className="node-name" y="15">
              {label}
            </text>
            <text className="node-type" y="29">
              {node.entity.type}
            </text>
          </>
        )}
      </g>
    );
  };
  // Retained as the measured SVG fallback for visual regression and rollback.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderCanonicalGraph = () => {
    if (!canonicalGroup || !canonicalBook) return null;
    const positions = new Map(
      canonicalGroup.nodes.map((node) => [node.entity.id, node]),
    );
    const highlightedNodes = new Set(highlightedCanonicalIds);
    const highlightedRelations = new Set(highlightedCanonicalRelationIds);
    const hasHighlight = highlightedNodes.size > 0;
    const point = (id: string) => {
      const node = positions.get(id);
      return node ? nodePoint(node, canonicalBook) : undefined;
    };
    return (
      <g key="canonical-full-graph" className="canonical-full-graph">
        {fullGraphRelationships.map((relationship) => {
          const from = point(relationship.subject);
          const to = relationship.objectId
            ? point(relationship.objectId)
            : undefined;
          if (!from || !to) return null;
          const active =
            relationship.subject === selected?.id ||
            relationship.objectId === selected?.id;
          const inHighlight =
            highlightedRelations.has(relationship.id) ||
            (highlightedNodes.has(relationship.subject) &&
              highlightedNodes.has(relationship.objectId!));
          const dimmed = hasHighlight && !inHighlight;
          const relationKind = relationVisualKind(
            relationText(relationship.predicate, canonicalBook),
          );
          const showRelationLabel =
            showLabels &&
            zoom >= 1.55 &&
            (active || inHighlight || zoom >= 2.25);
          return (
            <g
              key={`canonical-edge-${relationship.id}`}
              className={`${dimmed ? "graph-dimmed" : ""} ${relationship.provenance ? "provenance-edge" : "knowledge-edge"}`}
            >
              <line
                className={`neo-edge ${relationKind} ${active ? "active" : ""} ${relationship.crossBook ? "cross-book-edge" : ""}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                markerEnd={active || zoom >= 1.35 ? "url(#arrow)" : undefined}
              />
              {showRelationLabel && (
                <text
                  className={`edge-label ${active ? "active" : ""}`}
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 4}
                >
                  {relationText(relationship.predicate, canonicalBook)}
                </text>
              )}
            </g>
          );
        })}
        {canonicalGroup.nodes
          .filter((node) => fullGraphVisibleIds.has(node.entity.id))
          .map((node) => {
            const nodeKey = `${canonicalBook.key}-${node.entity.id}`;
            const pointValue = nodePoint(node, canonicalBook);
            const semantic = schemaCategoryMeta(node.entity.type);
            const isTextbook = node.entity.type === "教材";
            const isShared = (node.entity.textbookCount ?? 1) >= 2;
            const selectedNode = node.entity.id === selected?.id;
            const inHighlight = highlightedNodes.has(node.entity.id);
            const dimmed = hasHighlight && !inHighlight;
            const radius = selectedNode
              ? 25
              : isTextbook
                ? 23
                : isShared
                  ? 11 + Math.min(8, node.entity.textbookCount ?? 1)
                  : zoom < 0.75
                    ? 5.5
                    : semantic.nodeSize === "large"
                      ? 10
                      : 7;
            const labelVisible =
              isTextbook ||
              (showLabels &&
                ((isShared && zoom >= 0.62) ||
                  (!isShared && zoom >= 1.25) ||
                  selectedNode));
            const label =
              node.entity.name.length > 15
                ? `${node.entity.name.slice(0, 15)}…`
                : node.entity.name;
            return (
              <g
                key={nodeKey}
                className={`svg-node draggable schema-${semantic.key} ${isShared ? "shared-canonical-node" : ""} ${isTextbook ? "textbook-canonical-node" : ""} ${selectedNode ? "highlighted" : ""} ${dimmed ? "graph-dimmed" : ""} ${dragging?.nodeKey === nodeKey ? "dragging" : ""}`}
                transform={`translate(${pointValue.x} ${pointValue.y})`}
                onMouseEnter={() => setHoveredId(nodeKey)}
                onMouseLeave={() => setHoveredId(null)}
                onPointerDown={(event) =>
                  beginDrag(event, node.entity, canonicalBook, pointValue)
                }
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={() => setDragging(null)}
                onDoubleClick={() => openKnowledge(node.entity, canonicalBook)}
                onContextMenu={(event) =>
                  openContextMenu(event, node.entity, canonicalBook)
                }
              >
                <title>
                  {`${node.entity.name} · ${node.entity.type} · 覆盖${node.entity.textbookCount ?? 1}册`}
                </title>
                {isShared && (
                  <circle className="cross-book-halo" r={radius + 6} />
                )}
                <circle r={radius} />
                {labelVisible && (
                  <>
                    <text className="node-name" y={radius + 13}>
                      {label}
                    </text>
                    {(isTextbook || selectedNode || zoom >= 1.8) && (
                      <text className="node-type" y={radius + 26}>
                        {isTextbook
                          ? "教材中心"
                          : `覆盖${node.entity.textbookCount ?? 1}册`}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}
      </g>
    );
  };
  const renderGroup = (group: BookGroup) => {
    const isFocus = graphMode === "focus" && group === focusGroup;
    const groupIndex = allGroups.indexOf(group);
    const baseX =
      isFocus || group === singleGroup
        ? 1200
        : ([420, 1200, 1980][groupIndex % 3] ?? 1200);
    const baseY =
      isFocus || group === singleGroup
        ? 750
        : ([300, 300, 300, 1050, 1050, 1050][groupIndex] ?? 750);
    const positions = new Map(
      group.nodes.map((node) => [node.entity.id, node]),
    );
    const visible = (id: string) => {
      const entity = group.book.entities.find((item) => item.id === id);
      const canonical = entity ? canonicalEntityBySearchKey.get(`${entity.name.trim().toLowerCase()}|${schemaCategoryFor(entity.type)}`) : undefined;
      const nodeKey = `${group.book.key}-${id}`;
      return (
        (id === group.center.id && visibleSchemaKeys.includes("textbook") && (!canonical || (graphFilters.filteredEntityIds.has(canonical.id) && perspectiveEntityIds.has(canonical.id)))) ||
        (!hiddenNodeKeys.includes(nodeKey) &&
          (!canonical || (graphFilters.filteredEntityIds.has(canonical.id) && perspectiveEntityIds.has(canonical.id) && (!graphFilters.relationEndpointIds || graphFilters.relationEndpointIds.has(canonical.id)))) &&
          (graphMode === "focus" ||
            visibleNodeIdsByBook[group.book.key]?.has(id)) &&
          Boolean(
            entity &&
            visibleSchemaKeys.includes(schemaCategoryFor(entity.type)),
          ) &&
          (typeFilter === "全部" ||
            entity?.type === typeFilter ||
            id === selectedId))
      );
    };
    const centerNode = {
      entity: group.center,
      x: baseX,
      y: baseY,
      triple: {
        id: "center-" + group.book.key,
        subject: group.center.id,
        predicate: "教材中心",
      },
    };
    const centerPoint = nodePoint(centerNode, group.book);
    const point = (id: string) =>
      id === group.center.id
        ? centerPoint
        : visible(id) && positions.get(id)
          ? nodePoint(positions.get(id)!, group.book)
          : undefined;
    const edges = group.book.triples.filter(
      (t) =>
        t.objectId &&
        point(t.subject) &&
        point(t.objectId) &&
        !hiddenRelations.includes(relationText(t.predicate, group.book)),
    );
    return (
      <g key={group.book.key}>
        {edges.map((t) => {
          const from = point(t.subject)!;
          const to = point(t.objectId!)!;
          const active = t.subject === selectedId || t.objectId === selectedId;
          const relationKind = relationVisualKind(
            relationText(t.predicate, group.book),
          );
          return (
            <g key={"edge-" + group.book.key + "-" + t.id}>
              <line
                className={`neo-edge ${relationKind} ${active ? "active" : ""}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                markerEnd="url(#arrow)"
              />
              <text
                className={"edge-label " + (active ? "active" : "")}
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 4}
              >
                {showLabels && (zoom >= 0.85 || active)
                  ? relationText(t.predicate, group.book)
                  : ""}
              </text>
            </g>
          );
        })}
        <g
          className={
            "svg-node center draggable " +
            `schema-${schemaCategoryFor(group.center.type)}` +
            (dragging?.nodeKey === group.book.key + "-" + group.center.id
              ? " dragging"
              : "")
          }
          style={{ display: visible(group.center.id) ? undefined : "none" }}
          transform={"translate(" + centerPoint.x + " " + centerPoint.y + ")"}
          onPointerDown={(event) =>
            beginDrag(event, group.center, group.book, centerPoint)
          }
          onPointerMove={moveDrag}
          onPointerUp={(event) => {
            const moved = dragging
              ? Math.hypot(
                  event.clientX - dragging.startClientX,
                  event.clientY - dragging.startClientY,
                )
              : 0;
            endDrag(event);
            if (moved < 5 && !isFocus) {
              setBookKey(group.book.key);
              setGraphMode("book");
              setTypeFilter("全部");
            }
          }}
          onPointerCancel={() => setDragging(null)}
          onDoubleClick={() => openKnowledge(group.center, group.book)}
          onContextMenu={(event) =>
            openContextMenu(event, group.center, group.book)
          }
        >
          <circle r={isFocus ? 46 : graphMode === "all" ? 42 : 54} />
          <circle
            className="node-ring"
            r={isFocus ? 58 : graphMode === "all" ? 53 : 66}
          />
          <text className="node-glyph" y="-9">
            {isFocus ? "◎" : "▣"}
          </text>
          <text className="node-name" y="10">
            {isFocus
              ? group.center.name.length > 12
                ? group.center.name.slice(0, 12) + "…"
                : group.center.name
              : group.book.grade + "年级" + group.book.semester}
          </text>
          <text className="node-type" y="25">
            {isFocus ? group.center.type : "教材中心"}
          </text>
        </g>
        {group.nodes
          .filter((node) => visible(node.entity.id))
          .map((node) => renderNode(node, group.book))}
      </g>
    );
  };

  const selectEntityRef = useRef(selectEntity);
  const expandNodeRef = useRef(expandNode);
  const canonicalBookRef = useRef(canonicalBook);
  const currentBookRef = useRef(currentBook);
  useEffect(() => {
    selectEntityRef.current = selectEntity;
    expandNodeRef.current = expandNode;
    canonicalBookRef.current = canonicalBook;
    currentBookRef.current = currentBook;
  });
  const handleCanvasSelect = useCallback((entity: Entity) => {
    setInspectorOpen(true);
    const book = canonicalBookRef.current;
    if (book) {
      setShowLabels(true);
      setHighlightedCanonicalIds([]);
      setHighlightedCanonicalRelationIds([]);
      selectEntityRef.current(entity, book);
    }
  }, []);
  const handleCanvasExpand = useCallback((entity: Entity) => {
    const book = canonicalBookRef.current;
    if (book) {
      selectEntityRef.current(entity, book);
      setKnowledgeDetailOpen(true);
      setHighlightedCanonicalIds([]);
      setHighlightedCanonicalRelationIds([]);
    }
  }, []);
  const handleCanvasContextMenu = useCallback(
    (x: number, y: number, entity: Entity) => {
      const book = canonicalBookRef.current;
      if (book) setContextMenu({ x, y, entity, book });
    },
    [],
  );
  const handleCanvasNodePosition = useCallback(
    (nodeKey: string, point: { x: number; y: number }) => {
      setDragPositions((previous) => ({ ...previous, [nodeKey]: point }));
      const pinKey = nodeKey.startsWith("canonical:") ? nodeKey.replace(/^canonical:[^-]+-/, "canonical-") : nodeKey;
      setPinnedNodeKeys((previous) =>
        previous.includes(pinKey) ? previous : [...previous, pinKey],
      );
    },
    [],
  );
  const handleCanvasMetrics = useCallback(
    (metrics: CanvasPerformanceMetrics) => {
      canvasMetricsRef.current = metrics;
      if (process.env.NODE_ENV !== "production") setCanvasMetrics(metrics);
      if (loadStartedAtRef.current)
        setLoadPerformance((previous) =>
          previous.firstRenderMs
            ? previous
            : {
                ...previous,
                firstRenderMs: Date.now() - loadStartedAtRef.current,
              },
        );
    },
    [],
  );
  const handleCanvasZoom = useCallback((value: number) => setZoom(value), []);
  const handleCanvasPan = useCallback(
    (value: { x: number; y: number }) => setCanvasPan(value),
    [],
  );
  const handleSigmaViewport = useCallback(
    (bounds: { minX: number; minY: number; maxX: number; maxY: number }) => setSigmaViewport(bounds),
    [],
  );
  const handleClearSigmaFocus = useCallback(() => {
    setKnowledgeDetailOpen(false);
    setHighlightedCanonicalIds([]);
    setHighlightedCanonicalRelationIds([]);
    setInspectorOpen(false);
  }, []);

  const resetExplorer = useCallback(() => {
    setKnowledgeDetailOpen(false);
    resetGraphFilters(); setTypeFilter("全部"); setHiddenNodeKeys([]);
    setHighlightedCanonicalIds([]); setHighlightedCanonicalRelationIds([]);
    setGraphPerspective("comprehensive"); setFullGraphView("all");
    setShowTextbookSources(false); setInspectorOpen(false);
  }, [resetGraphFilters]);
  const handlePerspective = useCallback((value: GraphPerspective) => {
    setKnowledgeDetailOpen(false);
    setGraphPerspective(value); setHighlightedCanonicalIds([]); setHighlightedCanonicalRelationIds([]); setInspectorOpen(false);
  }, []);
  const graphActions = useGraphActions(canonicalGraph, {
    begin: () => { resetExplorer(); setView("graph"); setGraphMode("all"); setFullGraphLayout("knowledge"); setPathFinderOpen(false); setContextMenu(null); },
    focus: (ids, isolate) => {
      if (isolate) graphFilters.setFocusedEntityIds(ids);
      setHighlightedCanonicalIds(ids); setSelectedId(ids[0]); setInspectorOpen(true); setPanel("overview");
      setFocusSelectionToken(value => value + 1);
      if (ids.some(id => canonicalEntityById.get(id)?.type === "教材")) setShowTextbookSources(true);
    },
    entityTypes: types => setVisibleSchemaKeys(types as SchemaCategoryKey[]),
    relations: types => {
      setHiddenRelations([...new Set(canonicalGraph?.relationships.map(edge => edge.label ?? edge.predicate) ?? [])].filter(name => !types.includes(name)));
      if (canonicalGraph?.relationships.some(edge => edge.provenance && types.includes(edge.label ?? edge.predicate))) setShowTextbookSources(true);
    },
    books: keys => graphFilters.setProperties(current => ({ ...current, books: keys })),
    perspective: setGraphPerspective,
    path: (source, target, path) => {
      setPathFinderOpen(true); setPathStartId(source); setPathEndId(target); setActivePathIndex(0);
      setHighlightedCanonicalIds(path?.nodeIds ?? []); setHighlightedCanonicalRelationIds(path?.edgeIds ?? []);
      setSelectedId(source); setInspectorOpen(true); setPanel("relations");
      if (path?.nodeIds.some(id => canonicalEntityById.get(id)?.type === "教材") || path?.edgeIds.some(id => canonicalBook?.triples.find(edge => edge.id === id)?.provenance)) setShowTextbookSources(true);
      setFocusSelectionToken(value => value + 1);
    },
    expand: (ids, edges) => { setHighlightedCanonicalIds(ids); setHighlightedCanonicalRelationIds(edges); graphFilters.setFocusedEntityIds(current => current ? [...new Set([...current, ...ids])] : null); },
    highlightNodes: setHighlightedCanonicalIds,
    highlightEdges: setHighlightedCanonicalRelationIds,
  });
  const executeGraphActions = graphActions.execute;
  const handleAnswerFocus = useCallback((result: AnswerResult) => {
    const ids = [...new Set([...result.graphFocus.nodeIds, ...result.relatedEntities.map(entity => entity.id)])].slice(0, 500);
    const edges = [...new Set([...result.graphFocus.relationshipIds, ...result.relatedRelationships.map(edge => edge.id)])].slice(0, 500);
    const actions: GraphAction[] = ids.length ? [{ type: "focus_entities", entityIds: ids, isolate: true }] : [];
    if (edges.length) actions.push({ type: "highlight_relationships", relationshipIds: edges });
    if (actions.length) executeGraphActions(actions);
  }, [executeGraphActions]);
  const visibleRelationshipIds = useMemo(() => new Set(fullGraphRelationships.map(edge => edge.id)), [fullGraphRelationships]);
  const pinnedNodeIds = useMemo(() => pinnedNodeKeys.filter(key => key.startsWith("canonical-")).map(key => key.slice("canonical-".length)), [pinnedNodeKeys]);
  const openKnowledge = (entity: Entity, book: Book) => {
    selectSearchResult(entity, book);
    setKnowledgeDetailOpen(true);
    setContextMenu(null);
  };
  const openSchemaInstances = (types: SchemaCategoryKey[], relation?: string) => {
    const actions: GraphAction[] = [{ type: "filter_entity_types", entityTypes: [...new Set(types)] }];
    if (relation) actions.push({ type: "filter_relationship_types", relationshipTypes: [relation] });
    graphActions.execute(actions);
  };

  // Single-textbook view uses the same Sigma renderer as the six-book network,
  // with a per-book flower layout precomputed in build-graph-index.mjs.
  const handleBookSelect = useCallback((entity: Entity) => {
    setShowLabels(true);
    selectEntityRef.current(entity, currentBookRef.current);
  }, []);
  const handleBookExpand = useCallback((entity: Entity) => {
    selectEntityRef.current(entity, currentBookRef.current);
    setKnowledgeDetailOpen(true);
  }, []);
  const handleBookContextMenu = useCallback((x: number, y: number, entity: Entity) => {
    setContextMenu({ x, y, entity, book: currentBookRef.current });
  }, []);
  const handleBookClearFocus = useCallback(() => {
    setKnowledgeDetailOpen(false);
    setInspectorOpen(false);
  }, []);
  const bookSceneNodes = useMemo(
    () => currentBook.entities.flatMap((entity) => entity.layout ? [{ entity, x: entity.layout.x, y: entity.layout.y }] : []),
    [currentBook],
  );
  const emptyHighlight = useMemo<string[]>(() => [], []);
  const bookScene = (
    <SigmaGraphScene
      nodes={bookSceneNodes}
      relationships={currentBook.triples}
      visibleNodeIds={bookSceneVisibleIds}
      visibleRelationshipIds={bookSceneRelationshipIds}
      selectedId={inspectorOpen ? selectedId : null}
      highlightedNodeIds={emptyHighlight}
      highlightedRelationshipIds={emptyHighlight}
      relationLabels={currentBook.relations}
      sceneKey={`book:${currentBook.key}`}
      showLabels={showLabels}
      zoom={zoom}
      cameraResetToken={cameraResetToken}
      focusSelectionToken={focusSelectionToken}
      draggedPositions={dragPositions}
      detailOpen={knowledgeDetailOpen}
      onSelect={handleBookSelect}
      onExpand={handleBookExpand}
      onContextMenu={handleBookContextMenu}
      onNodePosition={handleCanvasNodePosition}
      onMetrics={handleCanvasMetrics}
      onViewportChange={handleSigmaViewport}
      onClearFocus={handleBookClearFocus}
    />
  );

  const bookSvgFallback = (
                    <svg
                      viewBox="0 0 2400 1500"
                      role="img"
                      aria-label="教材知识图谱"
                    >
                      <defs>
                        <marker
                          id="arrow"
                          viewBox="0 0 10 10"
                          refX="9"
                          refY="5"
                          markerWidth="7"
                          markerHeight="7"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#8295bd" />
                        </marker>
                      </defs>
                      <rect
                        className="graph-pan-surface"
                        x="0"
                        y="0"
                        width="2400"
                        height="1500"
                        onPointerDown={beginCanvasPan}
                        onPointerMove={moveCanvasPan}
                        onPointerUp={endCanvasPan}
                        onPointerCancel={() => setPanStart(null)}
                      />
                      <g
                        className="svg-zoom"
                        transform={`translate(${1200 + canvasPan.x} ${750 + canvasPan.y}) scale(${zoom}) translate(-1200 -750)`}
                      >
                        {(graphMode === "focus" ? [focusGroup] : [singleGroup]).map(
                          renderGroup,
                        )}
                      </g>
                    </svg>
  );

  const fullGraphCanvasFallback =
    canonicalGroup && canonicalBook ? (
      <FullGraphCanvas
        nodes={canonicalGroup.nodes}
        relationships={fullGraphRelationships}
        visibleNodeIds={fullGraphVisibleIds}
        selectedId={inspectorOpen ? selected?.id : null}
        highlightedNodeIds={highlightedCanonicalIds}
        highlightedRelationshipIds={highlightedCanonicalRelationIds}
        relationLabels={canonicalBook.relations}
        book={{ key: `${canonicalBook.key}:${fullGraphLayout}` }}
        zoom={zoom}
        pan={canvasPan}
        showLabels={showLabels}
        motionEnabled={motionEnabled}
        draggedPositions={dragPositions}
        onZoomChange={handleCanvasZoom}
        onPanChange={handleCanvasPan}
        onSelect={handleCanvasSelect}
        onExpand={handleCanvasExpand}
        onContextMenu={handleCanvasContextMenu}
        onNodePosition={handleCanvasNodePosition}
        onMetrics={handleCanvasMetrics}
      />
    ) : null;
  const fullGraphScene =
    canonicalGroup && canonicalBook && fullGraphLayout === "schema" ? <SchemaExplorer entities={canonicalBook.entities} relationships={canonicalBook.triples} onInstances={openSchemaInstances} /> : canonicalGroup && canonicalBook ? (
      <GraphRendererBoundary
        fallback={fullGraphCanvasFallback}
        onFallback={() => setFullGraphRenderer("canvas")}
      >
        {fullGraphRenderer === "sigma" ? (
          <SigmaGraphScene
            nodes={canonicalGroup.nodes}
            relationships={canonicalBook.triples}
            visibleNodeIds={fullGraphVisibleIds}
            visibleRelationshipIds={visibleRelationshipIds}
            selectedId={inspectorOpen ? selected?.id : null}
            highlightedNodeIds={highlightedCanonicalIds}
            highlightedRelationshipIds={highlightedCanonicalRelationIds}
            relationLabels={canonicalBook.relations}
            sceneKey={`${canonicalBook.key}:${fullGraphLayout}`}
            showLabels={showLabels}
            zoom={zoom}
            cameraResetToken={cameraResetToken}
            focusSelectionToken={focusSelectionToken}
            draggedPositions={dragPositions}
            pinnedNodeIds={pinnedNodeIds}
            detailOpen={knowledgeDetailOpen}
            onSelect={handleCanvasSelect}
            onExpand={handleCanvasExpand}
            onContextMenu={handleCanvasContextMenu}
            onNodePosition={handleCanvasNodePosition}
            onMetrics={handleCanvasMetrics}
            onViewportChange={handleSigmaViewport}
            onClearFocus={handleClearSigmaFocus}
          />
        ) : (
          fullGraphCanvasFallback
        )}
      </GraphRendererBoundary>
    ) : null;

  if (!hydrated)
    return (
      <div className="app-loading" aria-busy="true">
        正在载入芽谱…
      </div>
    );
  return (
    <main
      className={`app-shell theme-light ${knowledgeDetailOpen && view === "graph" ? "detail-open" : ""} ${inspectorOpen ? "inspector-open" : "inspector-closed"} ${schemaOpen ? "schema-open" : "schema-closed"} ${view === "assistant" ? "assistant-mode" : ""} ${view === "home" ? "home-mode" : ""} ${view === "graph" || view === "research" ? "graph-first" : ""}`}
      style={
        {
          ...designTokenCssVariables,
          ...semanticPaletteCssVariables,
        } as CSSProperties
      }
    >
      <GraphSidebar view={view} onView={value => { if (value === "assistant") setAssistantEntry(current => ({ question: "", token: current.token + 1 })); setView(value); }} graph={canonicalGraph} books={dataset.books} scopeBook={graphMode === "all" ? undefined : bookKey}
        filters={graphFilters} perspective={graphPerspective} onPerspective={handlePerspective}
        onSchema={() => { setGraphMode("all"); setFullGraphLayout("schema"); }} onSources={() => setShowTextbookSources(true)}
        onReset={resetExplorer} execute={graphActions.execute} notice={graphActions.notice} assetUrl={publicAssetUrl} onGraphFocus={handleAnswerFocus} />
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow muted">
              GRAPH EXPLORER /{" "}
              {graphMode === "all"
                ? "六册叠加"
                : graphMode === "focus"
                  ? "知识点聚焦"
                  : "单册展开"}
            </p>
            <h1>
              {view === "home"
                ? "首页"
                : view === "graph"
                ? "教材知识图谱"
                : view === "assistant"
                  ? "智能问答"
                : view === "research"
                  ? "研究分析"
                : view === "records"
                  ? "作品档案"
                  : "教材数据导入"}
            </h1>
          </div>
          <div className="search-zone">
            <form className="search-wrap" onSubmit={submitSearch}>
              <span className="search-icon"><WorkbenchIcon name="search" /></span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索作品、人物、体裁、乐理概念……"
              />
              <button type="submit" className="search-submit">
                定位
              </button>
              {query && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(
                    ({ entity, book, relationCount, matchedBy }) => (
                    <button
                      type="button"
                      className="search-result"
                      key={`${book.key}-${entity.id}`}
                      onClick={() => selectSearchResult(entity, book)}
                    >
                      <span>
                        <strong>{entity.name}</strong>
                        <small>
                          {book.grade}年级{book.semester} · {entity.type} ·{" "}
                          {relationCount} 条关系 · 命中{matchedBy}
                        </small>
                      </span>
                      <WorkbenchIcon name="arrow" />
                    </button>
                    ),
                  )}
                </div>
              )}
            </form>
            <details className="assistant-inline">
              <summary className="assistant-invite">
                <span>✦</span>
                <div>
                  <strong>有什么不懂的，可以来问问我</strong>
                  <small>
                    我会综合六册教材知识图谱中的关系，给出有依据的回答
                  </small>
                </div>
              </summary>
              <form className="assistant-query" onSubmit={askAssistant}>
                <input
                  aria-label="向图谱AI助手提问"
                  value={assistantQuestion}
                  onChange={(event) => setAssistantQuestion(event.target.value)}
                  placeholder="例如：《游击队歌》的音乐特点是什么？"
                />
                <button type="submit" disabled={assistantBusy}>
                  {assistantBusy ? "思考中…" : "问一问"}
                </button>
              </form>
              <div className="assistant-suggestions">
                <button
                  type="button"
                  onClick={() =>
                    setAssistantQuestion("《游击队歌》的创作和音乐特点是什么？")
                  }
                >
                  作品解读
                </button>
                <button
                  type="button"
                  onClick={() => setAssistantQuestion("节奏与节拍有什么区别？")}
                >
                  乐理辨析
                </button>
                <button
                  type="button"
                  onClick={() => setAssistantQuestion("进行曲有哪些相关作品？")}
                >
                  关联发现
                </button>
              </div>
              {assistantResult && (
                <div className="assistant-inline-answer">
                  <div className="assistant-answer-meta">
                    <span>
                      {assistantResult.poweredBy === "gpt"
                        ? "AI 辅助解释"
                        : "图谱关联查询"}
                    </span>
                    <b>{assistantResult.summary}</b>
                  </div>
                  <div className="assistant-evidence-boundary">
                    <section>
                      <strong>【图谱事实】</strong>
                      <p>
                        {assistantResult.facts.length
                          ? assistantResult.facts
                              .slice(0, 5)
                              .map(
                                (fact) =>
                                  `${fact.subject}—${fact.predicate}—${fact.object}`,
                              )
                              .join("；")
                          : "当前回答没有匹配到可追溯的教材三元组。"}
                      </p>
                    </section>
                    <section>
                      <strong>【AI辅助解释】</strong>
                      <p>{assistantResult.answer}</p>
                    </section>
                  </div>
                  {assistantResult.analytics && (
                    <div className="assistant-analysis-grid">
                      <span>
                        <b>{assistantResult.analytics.relationTypes}</b> 种关系
                      </span>
                      <span>
                        <b>{assistantResult.analytics.neighborCount}</b>{" "}
                        个邻接点
                      </span>
                      <span>
                        <b>{assistantResult.analytics.multiHopCount}</b>{" "}
                        条二跳关联
                      </span>
                      <span>
                        <b>{assistantResult.analytics.similarWorks.length}</b>{" "}
                        个相似作品
                      </span>
                    </div>
                  )}
                  <div className="assistant-answer-actions">
                    <small>
                      {[
                        ...new Set(
                          assistantResult.facts.map(
                            (fact) =>
                              fact.bookTitle +
                              (fact.page ? ` · PDF第${fact.page}页` : ""),
                          ),
                        ),
                      ]
                        .slice(0, 3)
                        .join("　")}
                    </small>
                    {assistantResult.entity && assistantResult.book && (
                      <button
                        type="button"
                        onClick={() =>
                          selectEntity(
                            assistantResult.entity as Entity,
                            assistantResult.book as Book,
                            true,
                          )
                        }
                      >
                        查看关系图 →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </details>
          </div>
          <div className="top-actions">
            <span className="live-pill">
              <span className="status-dot" />
              公开图谱
            </span>
            <button className="avatar">教</button>
            <button
              type="button"
              className="research-info-trigger"
              onClick={() => setResearchInfoOpen(true)}
            >
              研究信息
            </button>
          </div>
        </header>
        {view === "home" && (
          <HomePortal
            books={dataset.books}
            graph={canonicalGraph}
            query={query}
            onQuery={setQuery}
            results={searchResults}
            onPickResult={selectSearchResult}
            onSearch={submitSearch}
            onOpenBook={chooseBook}
            onOpenFullGraph={chooseFullGraph}
            onView={(value) => { if (value === "assistant") setAssistantEntry(current => ({ question: "", token: current.token + 1 })); setView(value); }}
            onPickEntityName={(name) => {
              const entity = canonicalBook?.entities.find((item) => item.name === name);
              if (entity && canonicalBook) selectSearchResult(entity, canonicalBook);
            }}
            onResearchInfo={() => setResearchInfoOpen(true)}
          />
        )}
        {view === "graph" && <div className="book-tabs">
          <button
            className={`book-tab ${graphMode === "all" ? "active" : ""}`}
            onClick={chooseFullGraph}
          >
            六册叠加
          </button>
          {dataset.books.map((book) => (
            <button
              key={book.key}
              className={`book-tab ${graphMode !== "all" && book.key === bookKey ? "active" : ""}`}
              onClick={() => chooseBook(book)}
            >
              {book.grade}年级{book.semester}
            </button>
          ))}
        </div>}
        {view === "graph" && (
          <div className="neo-layout">
            <div className="graph-main">
              <section className="graph-intro">
                <div>
                  <span className="tag violet">
                    {graphMode === "all"
                      ? "ALL TEXTBOOKS"
                      : graphMode === "focus"
                        ? "FOCUSED SUBGRAPH"
                        : "SINGLE TEXTBOOK"}
                  </span>
                  <h2>
                    {graphMode === "all"
                      ? "六本教材全量叠加知识图谱"
                      : graphMode === "focus"
                        ? (selected?.name ?? "知识点") + " · 关联子图"
                        : currentBook.title}
                  </h2>
                  <p>
                    {graphMode === "all"
                      ? `六册共享规范实体 · ${fmt(canonicalBook?.entityCount ?? dataset.books.reduce((s, b) => s + b.entityCount, 0))} 个节点 · ${fmt(canonicalBook?.tripleCount ?? dataset.books.reduce((s, b) => s + b.tripleCount, 0))} 条关系`
                      : graphMode === "focus"
                        ? `聚焦 ${selected?.name ?? "当前知识点"} · ${fmt(focusGroup.nodes.length + 1)} 个关联节点 · ${fmt(focusGroup.book.triples.length)} 条关系`
                        : `中心节点：${currentBook.title} · ${fmt(currentBook.entityCount)} 个节点 · ${fmt(currentBook.tripleCount)} 条正式关系`}
                  </p>
                </div>
                <div className="graph-kpis">
                  <div>
                    <strong>
                      {graphMode === "all"
                        ? fmt(
                            canonicalGraph?.quality.canonical
                              .sharedEntityCount ?? 0,
                          )
                        : fmt(currentBook.entityCount)}
                    </strong>
                    <span>{graphMode === "all" ? "跨册实体" : "节点"}</span>
                  </div>
                  <div>
                    <strong>
                      {graphMode === "all"
                        ? fmt(canonicalBook?.tripleCount ?? 0)
                        : fmt(currentBook.tripleCount)}
                    </strong>
                    <span>关系</span>
                  </div>
                  <div>
                    <strong>
                      {graphMode === "all" ? "全量" : currentBook.pages}
                    </strong>
                    <span>{graphMode === "all" ? "展示" : "页"}</span>
                  </div>
                </div>
                <div className="graph-metrics">
                  <div>
                    <span>实体总量</span>
                    <strong>{fmt(networkEntities.length)}</strong>
                  </div>
                  <div>
                    <span>关系总量</span>
                    <strong>{fmt(networkTriples.length)}</strong>
                  </div>
                  <div>
                    <span>关系类型</span>
                    <strong>{fmt(relationRows.length)}</strong>
                  </div>
                </div>
              </section>
              <section className={"neo-card " + (expanded ? "expanded" : "")}>
                <div className="neo-toolbar">
                  <div>
                    <span className="eyebrow muted">
                      DATA VIEW · LOCAL EXPLORATION
                    </span>
                    <h3>
                      {graphMode === "all"
                        ? fullGraphLayout === "knowledge"
                          ? "知识网络 · Knowledge Network"
                          : fullGraphLayout === "textbook"
                            ? "教材分簇 · Textbook Clusters"
                            : "知识模式 · Schema"
                        : graphMode === "focus"
                          ? (selected?.name ?? "知识点") + " · 聚焦关系网络"
                          : currentBook.title + " · 局部探索"}
                    </h3>
                  </div>
                  <div className="neo-actions" role="toolbar" aria-label="图谱操作">
                    <div className="graph-toolbar-core">
                    <button
                      onClick={() => {
                        const sigmaScene = graphMode === "all" || fullGraphRenderer === "sigma";
                        setZoom(sigmaScene ? 0.64 : 0.92);
                        setCanvasPan({ x: 0, y: 0 });
                        if (sigmaScene)
                          setCameraResetToken((value) => value + 1);
                      }}
                    >
                      <WorkbenchIcon name="fit" /> 适配画布
                    </button>
                    <button
                      className={pathFinderOpen ? "active" : ""}
                      onClick={() => openPathFinder(selected)}
                    >
                      <WorkbenchIcon name="path" /> 路径查询
                    </button>
                    <button
                      onClick={() => {
                        resetExplorer();
                        setZoom(1);
                        setExpandedNodeIds({});
                        setHiddenNodeKeys([]);
                        setHiddenRelations([]);
                        setVisibleSchemaKeys([...ALL_SCHEMA_KEYS]);
                        setHighlightedCanonicalIds([]);
                        setHighlightedCanonicalRelationIds([]);
                        setViewHistory([]);
                        setCanvasPan({ x: 0, y: 0 });
                        setDragPositions({});
                        setFullGraphLayout("knowledge");
                        setFullGraphView("all");
                        setShowTextbookSources(false);
                        setZoom(0.64);
                        setCameraResetToken((value) => value + 1);
                      }}
                    >
                      <WorkbenchIcon name="reset" /> 重置视图
                    </button>
                    </div>
                    <details className="graph-toolbar-menu">
                      <summary><WorkbenchIcon name="tune" /> 视图与显示 <WorkbenchIcon name="down" /></summary>
                      <div className="graph-toolbar-menu-content">
                      <button
                        disabled={!selected}
                        onClick={() => {
                          if (!selected) return;
                          if (graphMode === "all" && canonicalGroup) {
                            setFocusSelectionToken((value) => value + 1);
                            const target = canonicalGroup.nodes.find(
                              (node) => node.entity.id === selected.id,
                            );
                            if (target) {
                              setCanvasPan({ x: 1200 - target.x, y: 750 - target.y });
                              setZoom(1.55);
                              setShowLabels(true);
                            }
                          } else selectEntity(selected, currentBook, true);
                        }}
                      >
                        适配选中
                      </button>
                      <button onClick={() => setShowLabels((value) => !value)}>
                        {showLabels ? "隐藏标签" : "显示标签"}
                      </button>
                      {graphMode === "all" && (
                      <button
                        title="Sigma WebGL 为主渲染器，Canvas 2D 保留为兼容回退"
                        onClick={() =>
                          setFullGraphRenderer((value) =>
                            value === "sigma" ? "canvas" : "sigma",
                          )
                        }
                      >
                        {fullGraphRenderer === "sigma"
                          ? "WebGL 图谱"
                          : "Canvas 回退"}
                      </button>
                      )}
                    <button onClick={() => setMotionEnabled((value) => !value)}>
                      {motionEnabled ? "停止动态" : "动态演示"}
                    </button>
                    <button
                      onClick={() => {
                        if (graphMode === "all") setGraphMode("book");
                        else if (graphMode === "focus") {
                          setGraphMode("book");
                          setZoom(1);
                        } else chooseFullGraph();
                      }}
                    >
                      {graphMode === "all"
                        ? "进入单册"
                        : graphMode === "focus"
                          ? "返回单册"
                          : "返回六册叠加"}
                    </button>
                      </div>
                    </details>
                    <div className="graph-toolbar-tools" aria-label="画布缩放与全屏">
                    <button
                      aria-label="缩小图谱"
                      onClick={() => setZoom(Math.max(0.3, zoom - 0.2))}
                    >
                      <WorkbenchIcon name="minus" />
                    </button>
                    <input
                      className="zoom-slider"
                      aria-label="图谱缩放比例"
                      type="range"
                      min=".3"
                      max="3.2"
                      step=".05"
                      value={zoom}
                      onChange={(event) => setZoom(Number(event.target.value))}
                    />
                    <span className="zoom-value">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      aria-label="放大图谱"
                      onClick={() => setZoom(Math.min(3.2, zoom + 0.2))}
                    >
                      <WorkbenchIcon name="plus" />
                    </button>
                    <button aria-label={expanded ? "退出全屏" : "全屏画布"} title={expanded ? "退出全屏" : "全屏画布"} onClick={() => setExpanded((value) => !value)}>
                      <WorkbenchIcon name={expanded ? "collapse" : "expand"} />
                    </button>
                    </div>
                  </div>
                </div>
                {graphMode === "all" && (
                  <div
                    className="full-graph-filterbar"
                    aria-label="六册关系视图"
                  >
                    <div className="full-graph-layout-tabs" aria-label="全景布局模式">
                      {(
                        [
                          ["knowledge", "知识网络", "Knowledge Network"],
                          ["textbook", "教材分簇", "Textbook Clusters"],
                          ["schema", "知识模式", "Schema"],
                        ] as Array<[FullGraphLayoutMode, string, string]>
                      ).map(([key, label, english]) => (
                        <button
                          key={key}
                          className={fullGraphLayout === key ? "active" : ""}
                          title={english}
                          onClick={() => {
                            setFullGraphLayout(key);
                            setCanvasPan({ x: 0, y: 0 });
                            setZoom(0.64);
                            setCameraResetToken((value) => value + 1);
                            setHighlightedCanonicalIds([]);
                            setHighlightedCanonicalRelationIds([]);
                          }}
                        >
                          <strong>{label}</strong>
                          <small>{english}</small>
                        </button>
                      ))}
                    </div>
                    <div className="full-graph-view-tabs">
                      {(
                        [
                          ["all", "全部关系"],
                          ["cross", "跨册关系"],
                          ["ownership", "教材归属"],
                          ["knowledge", "知识关系"],
                        ] as Array<[FullGraphView, string]>
                      ).map(([key, label]) => (
                        <button
                          key={key}
                          className={fullGraphView === key ? "active" : ""}
                          onClick={() => {
                            setFullGraphView(key);
                            setHighlightedCanonicalIds([]);
                            setHighlightedCanonicalRelationIds([]);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="full-graph-operations">
                      <label className="source-layer-toggle">
                        <input
                          type="checkbox"
                          checked={
                            showTextbookSources || fullGraphLayout === "textbook"
                          }
                          disabled={fullGraphLayout === "textbook"}
                          onChange={(event) =>
                            setShowTextbookSources(event.target.checked)
                          }
                        />
                        显示教材来源
                      </label>
                      <button onClick={undoView} disabled={!viewHistory.length}>
                        撤销展开
                      </button>
                      <button onClick={collapseExpansion}>收起子图</button>
                      <span>
                        规范实体 {fmt(canonicalBook?.entityCount ?? 0)} ·
                        跨册实体{" "}
                        {fmt(
                          canonicalGraph?.quality.canonical.sharedEntityCount ??
                            0,
                        )}
                      </span>
                    </div>
                  </div>
                )}
                <GraphPathFinder
                  open={pathFinderOpen}
                  entities={canonicalBook?.entities ?? EMPTY_ENTITIES}
                  startId={pathStartId}
                  endId={pathEndId}
                  paths={graphPaths}
                  activePathIndex={safeActivePathIndex}
                  onStartChange={(id) => {
                    setPathStartId(id);
                    setActivePathIndex(0);
                  }}
                  onEndChange={(id) => {
                    setPathEndId(id);
                    setActivePathIndex(0);
                  }}
                  onPathIndexChange={setActivePathIndex}
                  onApply={applyGraphPath}
                  onClose={() => setPathFinderOpen(false)}
                />
                <div
                  className="neo-canvas"
                  onClick={() => setContextMenu(null)}
                  onWheel={
                    graphMode === "all" || fullGraphRenderer === "sigma"
                      ? undefined
                      : (event) => {
                          event.preventDefault();
                          setZoom((value) =>
                            Math.max(
                              0.3,
                              Math.min(
                                3.2,
                                value + (event.deltaY < 0 ? 0.12 : -0.12),
                              ),
                            ),
                          );
                        }
                  }
                >
                  {graphMode === "all" && canonicalGroup && canonicalBook ? (
                    <>
                      {fullGraphScene}
                      {fullGraphLayout !== "schema" && graphPerspective !== "progression" && fullGraphVisibleIds.size === 0 && <p className="graph-empty-overlay" role="status">当前组合筛选没有匹配实体。可清除部分条件或恢复全部筛选；平台不会补造不存在的数据。</p>}
                      {graphPerspective === "progression" && fullGraphVisibleIds.size === 0 && (
                        <p className="graph-empty-overlay">当前数据没有经教材证据或人工确认的学习进阶关系。请切换其他视角；平台不会自动创建前置或深化关系。</p>
                      )}
                    </>
                  ) : (
                    <GraphRendererBoundary
                      fallback={bookSvgFallback}
                      onFallback={() => setFullGraphRenderer("canvas")}
                    >
                      {fullGraphRenderer === "sigma" ? bookScene : bookSvgFallback}
                    </GraphRendererBoundary>
                  )}
                  {graphMode === "all" && canonicalGroup && fullGraphLayout !== "schema" && (
                    <div
                      className="graph-minimap"
                      aria-label="六册知识网络缩略图"
                    >
                      <div>
                        <strong>MINI MAP</strong>
                        <button
                          onClick={() => {
                            setCanvasPan({ x: 0, y: 0 });
                            setZoom(0.72);
                            setCameraResetToken((value) => value + 1);
                          }}
                        >
                          复位
                        </button>
                      </div>
                      <FullGraphMiniMap
                        nodes={canonicalGroup.nodes}
                        visibleNodeIds={fullGraphVisibleIds}
                        zoom={zoom}
                        pan={canvasPan}
                        viewport={fullGraphRenderer === "sigma" ? sigmaViewport : null}
                        draggedPositions={dragPositions}
                        sceneKey={`canonical:${fullGraphLayout}`}
                      />
                    </div>
                  )}
                  {process.env.NODE_ENV !== "production" &&
                    graphMode === "all" && (
                      <aside
                        className="performance-debug"
                        aria-label="Performance Debug"
                      >
                        <strong>PERFORMANCE DEBUG</strong>
                        <span>
                          Renderer {canvasMetrics.renderer} · FPS{" "}
                          {canvasMetrics.fps || "—"}
                        </span>
                        <span>
                          Nodes {fmt(canonicalBook?.entityCount ?? 0)} · Edges{" "}
                          {fmt(fullGraphRelationships.length)}
                        </span>
                        <span>
                          Visible {fmt(canvasMetrics.visibleNodes)} /{" "}
                          {fmt(canvasMetrics.visibleEdges)} · Labels{" "}
                          {fmt(canvasMetrics.renderedLabels)}
                        </span>
                        <span>
                          Graph DOM {fmt(canvasMetrics.domElementCount)} · Memory{" "}
                          {canvasMetrics.memoryMb
                            ? `${canvasMetrics.memoryMb} MB`
                            : "N/A"}
                        </span>
                        <span>
                          JSON {fmt(loadPerformance.graphIndexBytes)} B · Download{" "}
                          {loadPerformance.jsonDownloadMs} ms · Parse{" "}
                          {loadPerformance.jsonParseMs} ms
                        </span>
                        <span>
                          Preprocess {loadPerformance.preprocessingMs} ms · Layout{" "}
                          {canonicalGroup?.layoutMs ?? 0} ms · First render{" "}
                          {loadPerformance.firstRenderMs || "—"} ms
                        </span>
                      </aside>
                    )}
                  {contextMenu && (
                    <div
                      className="graph-context-menu"
                      style={{ left: contextMenu.x, top: contextMenu.y }}
                      onClick={(event) => event.stopPropagation()}
                      role="menu"
                    >
                      <div className="context-title">
                        <strong>{contextMenu.entity.name}</strong>
                        <small>
                          {schemaCategoryMeta(contextMenu.entity.type).label}
                        </small>
                      </div>
                      <button
                        onClick={() =>
                          expandNode(contextMenu.entity, contextMenu.book, 1)
                        }
                      >
                        展开全部 1 跳邻居
                      </button>
                      <button
                        onClick={() =>
                          expandNode(contextMenu.entity, contextMenu.book, 2)
                        }
                      >
                        展开全部 2 跳邻居
                      </button>
                      <button
                        onClick={() =>
                          expandNode(contextMenu.entity, contextMenu.book, 3)
                        }
                      >
                        展开全部 3 跳邻居
                      </button>
                      <button
                        onClick={() => {
                          setHighlightedCanonicalIds([contextMenu.entity.id]);
                          setHighlightedCanonicalRelationIds([]);
                          setSelectedId(contextMenu.entity.id);
                          setContextMenu(null);
                        }}
                      >
                        只看此节点
                      </button>
                      <button
                        onClick={() =>
                          expandNode(
                            contextMenu.entity,
                            contextMenu.book,
                            2,
                            "work",
                          )
                        }
                      >
                        查看关联作品
                      </button>
                      <button onClick={() => openPathFinder(contextMenu.entity)}>
                        查找路径
                      </button>
                      <div className="context-divider">按关系类型展开</div>
                      {Object.entries(contextMenu.book.relations)
                        .map(([, label]) => label)
                        .filter(
                          (label, index, all) => all.indexOf(label) === index,
                        )
                        .slice(0, 7)
                        .map((label) => (
                          <button
                            key={`relation-expand-${label}`}
                            onClick={() =>
                              expandNode(
                                contextMenu.entity,
                                contextMenu.book,
                                2,
                                undefined,
                                label,
                              )
                            }
                          >
                            {label}
                          </button>
                        ))}
                      <div className="context-divider">按实体类型展开</div>
                      {SCHEMA_CATEGORIES.filter((category) =>
                        [
                          "person",
                          "genre",
                          "instrument",
                          "element",
                          "textbook",
                        ].includes(category.key),
                      ).map((category) => (
                        <button
                          key={category.key}
                          onClick={() =>
                            expandNode(
                              contextMenu.entity,
                              contextMenu.book,
                              1,
                              category.key,
                            )
                          }
                        >
                          展开 → {category.label}
                        </button>
                      ))}
                      <button onClick={undoView} disabled={!viewHistory.length}>
                        撤销上次展开
                      </button>
                      <button onClick={collapseExpansion}>收起展开子图</button>
                      <div className="context-divider" />
                      <button
                        onClick={() =>
                          togglePin(contextMenu.entity, contextMenu.book)
                        }
                      >
                        {pinnedNodeKeys.includes(
                          `${contextMenu.book.key}-${contextMenu.entity.id}`,
                        )
                          ? "取消固定节点"
                          : "固定节点"}
                      </button>
                      <button onClick={() => restoreNodePosition(contextMenu.entity, contextMenu.book)}>恢复布局位置</button>
                      <button onClick={() => openKnowledge(contextMenu.entity, contextMenu.book)}>查看知识</button>
                      <button
                        onClick={() =>
                          selectEntity(
                            contextMenu.entity,
                            contextMenu.book,
                            true,
                          )
                        }
                      >
                        聚焦此节点
                      </button>
                      <button
                        onClick={() =>
                          showNodeEvidence(contextMenu.entity, contextMenu.book)
                        }
                      >
                        查看教材证据
                      </button>
                      <button
                        className="danger"
                        onClick={() =>
                          hideNode(contextMenu.entity, contextMenu.book)
                        }
                      >
                        隐藏节点
                      </button>
                    </div>
                  )}
                  <div className="canvas-hint">
                    {graphMode === "focus"
                      ? "查询结果已固定 · 节点仍可拖拽 · 滚轮或滑杆放大"
                      : motionEnabled
                        ? "动态演示已开启 · 节点可拖拽 · 滚轮缩放"
                        : "稳定研究模式 · 节点可拖拽 · 滚轮缩放 · 点击检查三元组"}
                  </div>
                  <div className="graph-legend">
                    <span>
                      <i className="legend-dot book" />
                      教材中心
                    </span>
                    <span>
                      <i className="legend-dot work" />
                      作品分类
                    </span>
                    <span>
                      <i className="legend-dot person" />
                      人物
                    </span>
                    <span>
                      <i className="legend-dot genre" />
                      音乐概念
                    </span>
                    <span>
                      <i className="legend-dot region" />
                      地域
                    </span>
                  </div>
                  <div className="graph-statusbar">
                    <span>
                      Nodes <b>{fmt(displayedGraphStats.nodes)}</b>
                    </span>
                    <span>
                      Relationships{" "}
                      <b>{fmt(displayedGraphStats.relationships)}</b>
                    </span>
                    <span>
                      Labels <b>{displayedGraphStats.labels}</b>
                    </span>
                    <span className="status-mode">
                      当前视图：
                      {graphMode === "all"
                        ? "教材全景"
                        : graphMode === "focus"
                          ? "节点聚焦"
                          : "单册探索"}
                    </span>
                  </div>
                </div>
              </section>
              <section className="network-stats">
                <div className="stats-panel">
                  <div className="stats-head">
                    <div>
                      <h3>实体分布</h3>
                    </div>
                    <b>{fmt(networkEntities.length)}</b>
                  </div>
                  <div className="type-bars">
                    {typeRows.slice(0, 18).map(([type, count]) => (
                      <button
                        key={type}
                        className={
                          "type-bar " + (typeFilter === type ? "active" : "")
                        }
                        onClick={() => setTypeFilter(type)}
                      >
                        <span className="type-bar-label">{type}</span>
                        <span className="type-bar-track">
                          <i
                            style={{
                              width: (count / maxTypeCount) * 100 + "%",
                            }}
                          />
                        </span>
                        <b>{fmt(count)}</b>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="stats-panel">
                  <div className="stats-head">
                    <div>
                      <h3>关系类型</h3>
                    </div>
                    <b>{fmt(networkTriples.length)}</b>
                  </div>
                  <div className="relation-cloud">
                    {relationRows.slice(0, 24).map(([relation, count]) => (
                      <button
                        className="relation-chip"
                        key={relation}
                        onClick={() => setTypeFilter("全部")}
                      >
                        <span>{relation}</span>
                        <b>{fmt(count)}</b>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
              <section className="triple-dock">
                <div className="dock-head">
                  <div>
                    <h3>{selected?.name ?? "当前节点"} 的三元组</h3>
                  </div>
                  <span className="dock-count">{directTriples.length} 条</span>
                </div>
                <div className="triple-list">
                  {directTriples.slice(0, 12).map((t) => (
                    <button
                      key={t.id}
                      className="triple-row"
                      onClick={() =>
                        t.objectId &&
                        entityMap.get(t.objectId) &&
                        selectEntity(
                          entityMap.get(t.objectId) as Entity,
                          inspectionBook,
                        )
                      }
                    >
                      <span className="triple-subject">{selected?.name}</span>
                      <span className="triple-predicate">
                        {relationLabel(t)}
                      </span>
                      <span className="triple-object">{objectLabel(t)}</span>
                      <span className="triple-page">
                        第{t.sourcePage ?? "—"}页
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
            <aside className="inspector" aria-label="节点检查器">
              <div className="inspector-titlebar"><span>知识档案</span><button className="inspector-close" aria-label="关闭节点检查器" onClick={() => setInspectorOpen(false)}><WorkbenchIcon name="close" /></button></div>
              <section className="inspector-card">
                <header className="inspector-header">
                  <div
                    className={`inspector-icon schema-${schemaCategoryFor(selected?.type ?? "音乐概念")}`}
                  >
                    <WorkbenchIcon name={schemaCategoryFor(selected?.type ?? "音乐概念") === "person" ? "person" : "music"} />
                  </div>
                  <div>
                    <span>
                      {
                        schemaCategoryMeta(selected?.type ?? "音乐概念")
                          .neoLabel
                      }
                    </span>
                    <h2>{selected?.name ?? "未选择实体"}</h2>
                    <small>{selected?.type ?? "实体"}</small>
                  </div>
                </header>
                <button className="knowledge-open-button" aria-label="查看知识 ↗" onClick={() => selected && openKnowledge(selected, inspectionBook)}>查看知识 <WorkbenchIcon name="arrow" /></button>
                <div className="inspector-tabs">
                  {(
                    [
                      ["overview", "概览"],
                      ["relations", `关系 ${directTriples.length}`],
                      [
                        "occurrences",
                        `跨册 ${selected?.textbookCount ?? 1}/6`,
                      ],
                      ["evidence", `教材证据 ${evidence.length}`],
                      ["teaching", "教学应用"],
                    ] as Array<[InspectorTab, string]>
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      className={panel === key ? "active" : ""}
                      onClick={() => setPanel(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {panel === "overview" && (
                  <div className="inspector-body">
                    <p>
                      {selected?.description ||
                        "该节点来自教材知识图谱，可继续查看关系、来源证据与教学应用。"}
                    </p>
                    {!!selected?.media?.some((asset) => asset.kind === "score") && (
                      <section className="inspector-scores" aria-label="教材谱例">
                        <h3>教材谱例</h3>
                        {selected.media.filter((asset) => asset.kind === "score").map((asset) => (
                          <a key={asset.url} href={publicAssetUrl(asset.url)} target="_blank" rel="noreferrer" title="打开原尺寸谱例">
                            {/* Score crops are static WebP files; no image optimizer on GitHub Pages. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img loading="lazy" src={publicAssetUrl(asset.url)} alt={asset.title ?? "教材谱例"} />
                            <small>{asset.source}</small>
                          </a>
                        ))}
                      </section>
                    )}
                    <dl>
                      <div>
                        <dt>语义标签</dt>
                        <dd>
                          {
                            schemaCategoryMeta(selected?.type ?? "音乐概念")
                              .label
                          }
                        </dd>
                      </div>
                      <div>
                        <dt>首次出现</dt>
                        <dd>PDF 第 {selected?.firstPage ?? "—"} 页</dd>
                      </div>
                      <div>
                        <dt>关系数量</dt>
                        <dd>{directTriples.length} 条</dd>
                      </div>
                      <div>
                        <dt>当前教材</dt>
                        <dd>
                          {graphMode === "all"
                            ? `六册共享 · 覆盖${selected?.textbookCount ?? 1}册`
                            : `${currentBook.grade}年级${currentBook.semester}`}
                        </dd>
                      </div>
                      <div>
                        <dt>可信度</dt>
                        <dd>
                          {selected?.confidence
                            ? `${Math.round(selected.confidence * 100)}%`
                            : "教材已收录"}
                        </dd>
                      </div>
                    </dl>
                    {isWorkType(selected?.type) && inspectorFacts.length > 0 && (
                      <section className="inspector-fact-grid">
                        <h3>作品知识属性</h3>
                        <div>
                          {inspectorFacts.map(({ triple, label, value, target }) => (
                            <button
                              type="button"
                              key={triple.id}
                              disabled={!target}
                              onClick={() => target && selectEntity(target, inspectionBook)}
                            >
                              <span>{label}{triple.extended && <em className="fact-extended" title="教材之外的拓展知识（已审阅）">拓展</em>}</span>
                              <strong>{value}</strong>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}
                    {graphMode === "all" && selected?.canonicalKey && (
                      <section className="cross-book-inspector-summary">
                        <h3>跨册出现分析</h3>
                        <div className="cross-book-metrics">
                          <span>
                            <b>{selected.textbookCount ?? 1}</b>出现教材数
                          </span>
                          <span>
                            <b>{selected.occurrenceCount ?? 1}</b>出现次数
                          </span>
                          <span>
                            <b>
                              {Math.round(
                                ((selected.textbookCount ?? 1) /
                                  Math.max(1, dataset.books.length)) *
                                  100,
                              )}
                              %
                            </b>
                            教材覆盖率
                          </span>
                        </div>
                        <ol>
                          {selectedOccurrences.slice(0, 6).map((occurrence) => (
                            <li key={occurrence.id}>
                              <strong>{occurrence.textbookTitle}</strong>
                              <span>
                                {occurrence.unit ?? "所属单元待细化"} · PDF第
                                {occurrence.page ?? "—"}页
                              </span>
                            </li>
                          ))}
                        </ol>
                        <p>
                          前置、复现、深化和扩展关系仅在具备教材证据或人工确认后显示；当前不会自动推断创建。
                        </p>
                      </section>
                    )}
                    <NodeAIInterpretation name={selected?.name ?? "当前节点"} onAsk={question => { setAssistantEntry(current => ({ question, token: current.token + 1 })); setView("assistant"); }} />
                    <div className="inspector-actions-grid">
                      <button
                        onClick={() =>
                          selected && expandNode(selected, inspectionBook, 1)
                        }
                      >
                        展开 1 跳
                      </button>
                      <button
                        onClick={() =>
                          selected && expandNode(selected, inspectionBook, 2)
                        }
                      >
                        展开 2 跳
                      </button>
                      <button
                        onClick={() => selected && openPathFinder(selected)}
                      >
                        查找路径
                      </button>
                      <button
                        onClick={() =>
                          selected &&
                          selectEntity(selected, inspectionBook, true)
                        }
                      >
                        定位节点
                      </button>
                      <button onClick={() => setPanel("evidence")}>
                        查看证据
                      </button>
                      <button onClick={() => setView("records")}>作品档案</button>
                    </div>
                  </div>
                )}
                {panel === "relations" && (
                  <div className="inspector-relations">
                    {directTriples.length ? (
                      directTriples.slice(0, 30).map((triple) => {
                        const outgoing = triple.subject === selected?.id;
                        const targetId = outgoing
                          ? triple.objectId
                          : triple.subject;
                        const target = targetId
                          ? entityMap.get(targetId)
                          : undefined;
                        return (
                          <button
                            key={triple.id}
                            onClick={() =>
                              target && selectEntity(target, inspectionBook)
                            }
                          >
                            <span className="relation-direction">
                              {outgoing ? "→" : "←"}
                            </span>
                            <span>
                              <b>{relationLabel(triple)}</b>
                              <small>
                                {target?.name ?? triple.literal ?? "属性值"}
                              </small>
                            </span>
                            <em>P{triple.sourcePage ?? "—"}</em>
                          </button>
                        );
                      })
                    ) : (
                      <p className="empty-state">当前节点暂无正式关系。</p>
                    )}
                  </div>
                )}
                {panel === "occurrences" && (
                  <div className="inspector-occurrences">
                    <section className="occurrence-summary">
                      <span className="eyebrow muted">CANONICAL OCCURRENCE</span>
                      <h3>跨册出现</h3>
                      <div className="cross-book-metrics">
                        <span>
                          <b>{selected?.textbookCount ?? 1} / 6</b>覆盖教材
                        </span>
                        <span>
                          <b>{selected?.occurrenceCount ?? 1}</b>出现次数
                        </span>
                        <span>
                          <b>{directTriples.length}</b>相关关系
                        </span>
                      </div>
                    </section>
                    <ol className="occurrence-list">
                      {(selectedOccurrences.length
                        ? selectedOccurrences
                        : (selected?.bookKeys ?? []).map((key, index) => ({
                            id: `${selected?.id}-${key}`,
                            textbook: key,
                            textbookTitle:
                              datasetBookMap.get(key)?.title ?? key,
                            unit: null,
                            lesson: null,
                            page: selected?.firstPageByBook?.[key] ?? null,
                            sourceText: null,
                            evidence: [],
                            occurrenceRole: "教材出现",
                            canonicalId: selected?.id ?? "",
                            sourceEntityId: `${selected?.id}-${index}`,
                            entityType: selected?.type ?? "实体",
                          }))).map((occurrence, index) => (
                        <li key={occurrence.id}>
                          <b>{String(index + 1).padStart(2, "0")}</b>
                          <span>
                            <strong>{occurrence.textbookTitle}</strong>
                            <small>
                              {occurrence.unit ?? "所属单元待细化"} · PDF 第
                              {occurrence.page ?? "—"}页
                            </small>
                          </span>
                        </li>
                      ))}
                    </ol>
                    <section className="related-knowledge-summary">
                      <h3>相关作品与知识</h3>
                      <div>
                        {directTriples
                          .map((triple) =>
                            entityMap.get(
                              triple.subject === selected?.id
                                ? (triple.objectId ?? "")
                                : triple.subject,
                            ),
                          )
                          .filter((entity): entity is Entity => Boolean(entity))
                          .filter(
                            (entity, index, values) =>
                              values.findIndex((item) => item.id === entity.id) ===
                              index,
                          )
                          .slice(0, 12)
                          .map((entity) => (
                            <button
                              key={entity.id}
                              onClick={() =>
                                selectEntity(entity, inspectionBook)
                              }
                            >
                              <i
                                style={{
                                  background:
                                    schemaCategoryMeta(entity.type).color,
                                }}
                              />
                              {entity.name}
                            </button>
                          ))}
                      </div>
                    </section>
                  </div>
                )}
                {panel === "evidence" && (
                  <div className="evidence-list inspector-evidence">
                    {evidence.length ? (
                      evidence.slice(0, 30).map((item, index) => (
                        <div
                          className="evidence-item"
                          key={`${item.triple.id}-${item.pdfPage}-${index}`}
                        >
                          <div className="evidence-page">
                            {item.pdfPage ?? "—"}
                            <small>PDF</small>
                          </div>
                          <div>
                            <strong>
                              {relationLabel(item.triple)} ·{" "}
                              {objectLabel(item.triple)}
                            </strong>
                            <p>{item.summary || "教材关系证据记录"}</p>
                            <small>
                              {item.bookTitle ?? inspectionBook.title} ·{" "}
                              {item.textbookPage
                                ? `教材第${item.textbookPage}页`
                                : "教材页码待对应"}
                            </small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="empty-state">
                        该节点暂未绑定可显示的教材证据。
                      </p>
                    )}
                  </div>
                )}
                {panel === "teaching" && (
                  <div className="inspector-teaching">
                    <section className="teaching-path">
                      <span className="eyebrow muted">课堂路径</span>
                      <h3>从作品事实到音乐理解</h3>
                      <ol>
                        <li>观察节点的作品、人物与教材位置</li>
                        <li>展开体裁、乐器和音乐要素关系</li>
                        <li>结合教材证据组织欣赏或实践活动</li>
                      </ol>
                    </section>
                    <section className="media-card">
                      <div className="media-head">
                        <div>
                          <span className="eyebrow muted">多模态资料</span>
                          <h3>音频 · 视频 · 乐谱</h3>
                        </div>
                        <b>{selected?.media?.length ?? 0}</b>
                      </div>
                      {selected?.media?.length ? (
                        <div className="media-list">
                          {selected.media.map((asset, index) => (
                            <div className="media-item" key={asset.url + index}>
                              <strong>
                                {asset.title ??
                                  (asset.kind === "audio"
                                    ? "音频资料"
                                    : asset.kind === "video"
                                      ? "视频资料"
                                      : "乐谱资料")}
                              </strong>
                              {asset.kind === "audio" && (
                                <audio
                                  controls
                                  preload="none"
                                  src={asset.url}
                                />
                              )}
                              {asset.kind === "video" && (
                                <video
                                  controls
                                  preload="metadata"
                                  src={asset.url}
                                />
                              )}
                              {asset.kind === "score" && (
                                <a
                                  href={publicAssetUrl(asset.url)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img loading="lazy" src={publicAssetUrl(asset.url)} alt={asset.title ?? "教材谱例"} />
                                </a>
                              )}
                              <small>{asset.source ?? "外部资源链接"}</small>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>
                          已保留多模态挂载位，后续可直接关联教材乐谱、音频、视频或教学链接。
                        </p>
                      )}
                    </section>
                  </div>
                )}
              </section>
            </aside>
            {knowledgeDetailOpen && selected && <KnowledgeDetailDrawer
              entity={selected} entities={entityMap} relationships={directTriples}
              occurrences={selectedOccurrences} books={dataset.books} basePath={PUBLIC_BASE_PATH}
              onNavigate={entity => { const target = canonicalEntityById.get(entity.id); if (target && canonicalBook) selectSearchResult(target, canonicalBook); }}
              onClose={() => { setKnowledgeDetailOpen(false); setFocusSelectionToken(value => value + 1); }}
              onAsk={name => { setAssistantEntry(current => ({ question: `请介绍${name}的教材内容与相关知识`, token: current.token + 1 })); setView("assistant"); }}
            />}
          </div>
        )}
        {view === "assistant" && canonicalGraph && (
          <AssistantPage key={assistantEntry.token} graph={canonicalGraph} assetUrl={publicAssetUrl} initialQuestion={assistantEntry.question} onGraphFocus={handleAnswerFocus} />
        )}
        {view === "research" && canonicalGraph && (
          <ResearchAnalysis
            books={canonicalGraph.books}
            entities={canonicalGraph.entities}
            relationships={canonicalGraph.relationships}
            quality={canonicalGraph.quality}
            onSelectPair={openResearchPair}
            onSelectEntity={openResearchEntity}
          />
        )}
        {view === "records" && (
          <WorkLibrary
            books={dataset.books}
            bookKey={currentBook.key}
            isWork={isWorkType}
            onBook={(book) => setBookKey(book.key)}
            onOpen={(work, book) => selectSearchResult(work, book)}
          />
        )}
        {view === "import" && (
          <section className="import-view">
            <div className="import-hero">
              <span className="tag cyan">DATA PIPELINE</span>
              <h2>持续接入更多教材与资源</h2>
              <p>
                {IS_STATIC_EXPORT
                  ? "当前为 GitHub Pages 静态公开版；JSON 可在本地校验，在线持久化需连接独立后端。"
                  : "结构化数据进入 D1，乐谱图片、音频、视频和 PDF 进入 R2，再通过中文关系边挂回作品节点。"}
              </p>
            </div>
            <div className="import-grid">
              <div className="import-card">
                <div className="import-icon">⇧</div>
                <h3>导入 JSON 数据包</h3>
                <p>
                  {IS_STATIC_EXPORT
                    ? "上传标准包后进行本地格式校验，不会把文件发送到第三方。"
                    : "上传包含 books、entities、triples、evidenceByTriple 的标准包，网站会先校验，再写入持久化层。"}
                </p>
                <label className="upload-button">
                  选择 JSON 文件
                  <input type="file" accept=".json" onChange={onImport} />
                </label>
                {importSummary && (
                  <div className="import-result">{importSummary}</div>
                )}
              </div>
              <div className="import-card">
                <div className="import-icon">◉</div>
                <h3>中文关系标准</h3>
                <ul className="schema-list">
                  <li>
                    作品关系 <span>作曲 · 作词 · 属于单元 · 表现主题</span>
                  </li>
                  <li>
                    乐理关系 <span>是 · 指 · 凭借 · 解释概念</span>
                  </li>
                  <li>
                    证据关系 <span>教材页码 · PDF页码 · 原文摘要</span>
                  </li>
                  <li>
                    资源关系 <span>拥有乐谱 · 音频 · 视频</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}
        <footer className="site-footer">
          芽谱 · {loaded ? "六册数据已载入" : "正在载入完整数据"} ·
          默认六册叠加，点击教材中心可独立查看
        </footer>
      </section>
      <ResearchInfo
        open={researchInfoOpen}
        version={canonicalGraph?.version ?? "V2.2"}
        generatedAt={graphGeneratedAt}
        onClose={() => setResearchInfoOpen(false)}
      />
    </main>
  );
}
