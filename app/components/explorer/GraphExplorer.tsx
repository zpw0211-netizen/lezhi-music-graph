"use client";
// 知识图谱 page: sidebar filters, textbook tabs, the graph canvas and the
// node inspector. Explorer state comes from useGraphExplorer; everything here
// is derived for rendering and only computed while this page is shown.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import nextDynamic from "next/dynamic";
import { relationVisualKind, schemaCategoryFor, schemaCategoryMeta, type SchemaCategoryKey } from "../../graph-schema";
import { graphRuntimeFor } from "../../graph-runtime";
import { relationshipMatchesPerspective } from "../../lib/graph/graph-algorithms";
import { PUBLIC_BASE_PATH, publicAssetUrl } from "../../lib/app/assets";
import {
  EMPTY_ENTITIES,
  fmt,
  isWorkType,
  RELATION_PRIORITY,
  stableSeed,
  type Book,
  type Entity,
  type EvidencePayload,
  type KnowledgeOccurrence,
  type Triple,
} from "../../lib/app/types";
import { FullGraphCanvas, FullGraphMiniMap } from "../FullGraphCanvas";
import { GraphPathFinder } from "../graph/GraphPathFinder";
import { GraphRendererBoundary } from "../graph/GraphRendererBoundary";
import { GraphSidebar } from "../graph/GraphSidebar";
import { KnowledgeDetailDrawer } from "../graph/KnowledgeDetailDrawer";
import { SchemaExplorer } from "../graph/SchemaExplorer";
import type { SigmaGraphSceneProps } from "../graph/SigmaGraphScene";
import { WorkbenchIcon } from "../WorkbenchIcon";
import { GraphContextMenu } from "./GraphContextMenu";
import { NodeInspector, type InspectorEvidence, type InspectorFact } from "./NodeInspector";
import type { FullGraphLayoutMode, FullGraphView, GraphExplorerState } from "./useGraphExplorer";

const SigmaGraphScene = nextDynamic<SigmaGraphSceneProps<Entity>>(
  () => import("../graph/SigmaGraphScene").then((module) => module.SigmaGraphScene),
  { ssr: false },
);

type PositionedNode = { entity: Entity; triple: Triple; x: number; y: number };
type BookGroup = { book: Book; center: Entity; nodes: PositionedNode[] };
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
type SidebarView = Parameters<typeof GraphSidebar>[0]["view"];

const FOCUS_PRIORITY = [
  "作曲", "作词", "编曲", "音乐体裁", "节拍", "速度特点", "使用调性", "所属国家或地区", "所属民族", "使用乐器",
  "表现主题", "表演形式", "曲式", "预留乐谱资源", "收录作品", "学习方式",
  "COMPOSER", "LYRICIST", "ARRANGER", "GENRE", "METER", "TEMPO", "TONALITY", "ORIGIN_REGION", "ETHNIC_GROUP",
  "INSTRUMENT", "THEME", "PERFORMANCE_FORM", "MUSICAL_FORM", "HAS_SCORE", "WORK_IN_UNIT", "LEARNING_MODE",
];
const INSPECTOR_FACT_PATTERN = /作曲|作词|演唱|演奏|体裁|曲式|地域|民族|背景|速度|力度|节拍|调式|调性|节奏|旋律|乐器|情绪|主题|教材|单元|学习目标/;
const LAYOUT_TABS: Array<[FullGraphLayoutMode, string, string]> = [
  ["knowledge", "知识网络", "Knowledge Network"],
  ["textbook", "教材分簇", "Textbook Clusters"],
  ["schema", "知识模式", "Schema"],
];
const VIEW_TABS: Array<[FullGraphView, string]> = [
  ["all", "全部关系"],
  ["cross", "跨册关系"],
  ["ownership", "教材归属"],
  ["knowledge", "知识关系"],
];
const TEXTBOOK_POSITIONS: Record<string, { x: number; y: number }> = {
  g7s1: { x: 360, y: 260 },
  g7s2: { x: 1200, y: 170 },
  g8s1: { x: 2040, y: 260 },
  g8s2: { x: 360, y: 1240 },
  g9s1: { x: 1200, y: 1330 },
  g9s2: { x: 2040, y: 1240 },
};
const NO_IDS: string[] = [];
const ignoreMetrics = () => undefined;

/** Force-directed layout of one textbook around its textbook node (the SVG fallback renderer). */
function layoutBook(book: Book, center: Entity): BookGroup {
  const runtime = graphRuntimeFor(book, book.entities, book.triples);
  const base = [1200, 650];
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
    const radial = Math.sqrt((Math.floor(hash / 100000) % 1000) / 1000) * 520;
    return {
      x: base[0] + Math.cos(angle) * radial,
      y: base[1] + Math.sin(angle) * radial * 0.78,
      entity: runtime.entityMap.get(id) ?? { id, name: id, type: "音乐概念" },
      triple: map.get(id)!,
    };
  });
  const indexById = new Map(ids.map((id, index) => [id, index]));
  const links = book.triples.filter(
    (t) => t.objectId && indexById.has(t.subject) && indexById.has(t.objectId),
  );
  for (let iteration = 0; iteration < 48; iteration++) {
    const force = positions.map(() => ({ x: 0, y: 0 }));
    for (let a = 0; a < positions.length; a++)
      for (let b = a + 1; b < positions.length; b++) {
        const dx = positions[a].x - positions[b].x;
        const dy = positions[a].y - positions[b].y;
        const distance = Math.max(48, Math.hypot(dx, dy));
        const push = Math.min(58, 15000 / (distance * distance));
        force[a].x += (dx / distance) * push;
        force[a].y += (dy / distance) * push;
        force[b].x -= (dx / distance) * push;
        force[b].y -= (dy / distance) * push;
      }
    for (const link of links) {
      const fromIndex = indexById.get(link.subject)!;
      const toIndex = indexById.get(link.objectId!)!;
      const from = positions[fromIndex];
      const to = positions[toIndex];
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const spring = (distance - 245) * 0.005;
      force[fromIndex].x += (dx / distance) * spring;
      force[fromIndex].y += (dy / distance) * spring;
      force[toIndex].x -= (dx / distance) * spring;
      force[toIndex].y -= (dy / distance) * spring;
    }
    positions.forEach((node, nodeIndex) => {
      force[nodeIndex].x += (base[0] - node.x) * 0.0009;
      force[nodeIndex].y += (base[1] - node.y) * 0.0009;
      const distance = Math.max(1, Math.hypot(node.x - base[0], node.y - base[1]));
      if (distance < 195) {
        force[nodeIndex].x += ((node.x - base[0]) / distance) * 5;
        force[nodeIndex].y += ((node.y - base[1]) / distance) * 5;
      }
      node.x += force[nodeIndex].x;
      node.y += force[nodeIndex].y;
      const boundedX = node.x - base[0];
      const boundedY = node.y - base[1];
      const ellipse = Math.hypot(boundedX / 620, boundedY / 460);
      if (ellipse > 1) {
        node.x = base[0] + boundedX / ellipse;
        node.y = base[1] + boundedY / ellipse;
      }
    });
  }
  return { book, center, nodes: positions.map((node) => ({ ...node, x: node.x + 780, y: node.y + 450 })) };
}

/** Left column of the graph page: perspective, type / relation / property filters and the graph query box. */
export function ExplorerSidebar({ explorer, onView }: { explorer: GraphExplorerState; onView: (view: SidebarView) => void }) {
  return (
    <GraphSidebar
      view="graph"
      onView={onView}
      graph={explorer.canonicalGraph}
      books={explorer.books}
      scopeBook={explorer.graphMode === "all" ? undefined : explorer.bookKey}
      filters={explorer.graphFilters}
      perspective={explorer.graphPerspective}
      onPerspective={explorer.handlePerspective}
      onSchema={() => {
        explorer.setGraphMode("all");
        explorer.setFullGraphLayout("schema");
      }}
      onSources={() => explorer.setShowTextbookSources(true)}
      onReset={explorer.resetExplorer}
      execute={explorer.graphActions.execute}
      notice={explorer.graphActions.notice}
      assetUrl={publicAssetUrl}
      onGraphFocus={explorer.focusAnswer}
    />
  );
}

export function GraphExplorer({ explorer }: { explorer: GraphExplorerState }) {
  const {
    books, currentBook, canonicalBook, inspectionBook, inspectionRuntime, selected, selectedId, graphMode,
    fullGraphLayout, fullGraphView, fullGraphRenderer, graphPerspective, showTextbookSources, showLabels,
    zoom, canvasPan, dragPositions, pinnedNodeKeys, hiddenNodeKeys, expandedNodeIds, graphFilters,
    highlightedCanonicalIds, highlightedCanonicalRelationIds, inspectorOpen, knowledgeDetailOpen, motionEnabled,
    relationText, canonicalEntityById, canonicalEntityBySearchKey, datasetBookMap,
  } = explorer;
  const { visibleSchemaKeys, hiddenRelations } = graphFilters;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [panStart, setPanStart] = useState<{ pointerId: number; clientX: number; clientY: number; originX: number; originY: number } | null>(null);
  const [motionPhase, setMotionPhase] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sigmaViewport, setSigmaViewport] = useState<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);
  const [evidencePayloads, setEvidencePayloads] = useState<Record<string, EvidencePayload>>({});
  const evidenceRequestCache = useRef(new Map<string, Promise<EvidencePayload>>());
  const explorerRef = useRef(explorer);
  const mobileFilterTriggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    explorerRef.current = explorer;
  });

  useEffect(() => {
    const closeFilters = () => {
      setMobileFiltersOpen(false);
      mobileFilterTriggerRef.current?.focus();
    };
    window.addEventListener("yapu:graph-filters-closed", closeFilters);
    return () => window.removeEventListener("yapu:graph-filters-closed", closeFilters);
  }, []);

  useEffect(() => {
    if (!motionEnabled || graphMode === "all" || graphMode === "focus" || dragging) return;
    const timer = window.setInterval(() => setMotionPhase((value) => value + 0.055), 90);
    return () => window.clearInterval(timer);
  }, [dragging, graphMode, motionEnabled]);

  // ---- Selected node: relations, evidence, occurrences --------------------
  const directTriples = useMemo(
    () => (selected ? (inspectionRuntime.adjacencyMap.get(selected.id) ?? []).map((item) => item.edge) : []),
    [inspectionRuntime, selected],
  );
  const inspectorFacts = useMemo<InspectorFact[]>(() => {
    if (!selected) return [];
    const priority = (label: string) => {
      const index = RELATION_PRIORITY.indexOf(label);
      return index < 0 ? Number.MAX_SAFE_INTEGER : index;
    };
    return directTriples
      .map((triple) => {
        const targetId = triple.subject === selected.id ? triple.objectId : triple.subject;
        const target = targetId ? inspectionRuntime.entityMap.get(targetId) : undefined;
        return { triple, label: relationText(triple.predicate, inspectionBook), value: target?.name ?? triple.literal ?? "", target };
      })
      .filter((item) => item.value && INSPECTOR_FACT_PATTERN.test(item.label))
      .sort((a, b) => priority(a.label) - priority(b.label))
      .slice(0, 18);
  }, [directTriples, inspectionBook, inspectionRuntime.entityMap, relationText, selected]);
  useEffect(() => {
    if (!inspectorOpen || !selected) return;
    const keys = graphMode === "all" ? (selected.bookKeys ?? []) : [currentBook.key];
    for (const key of keys) {
      if (evidencePayloads[key]) continue;
      let request = evidenceRequestCache.current.get(key);
      if (!request) {
        request = fetch(publicAssetUrl(`data/evidence/${key}.json`)).then(async (response) => {
          if (!response.ok) throw new Error(`evidence ${key} unavailable`);
          return (await response.json()) as EvidencePayload;
        });
        evidenceRequestCache.current.set(key, request);
      }
      request
        .then((payload) => setEvidencePayloads((previous) => (previous[key] ? previous : { ...previous, [key]: payload })))
        .catch(() => evidenceRequestCache.current.delete(key));
    }
  }, [currentBook.key, evidencePayloads, graphMode, inspectorOpen, selected]);
  const evidence = useMemo<InspectorEvidence[]>(
    () =>
      directTriples.flatMap((triple) => {
        const local = inspectionBook.evidenceByTriple[triple.id] ?? [];
        const lazyLocal = Object.values(evidencePayloads).flatMap((payload) =>
          (payload.evidenceByTriple[triple.id] ?? []).map((item) => ({
            ...item,
            bookTitle: datasetBookMap.get(payload.bookKey)?.title ?? payload.bookKey,
          })),
        );
        const lazyCanonical = Object.values(evidencePayloads).flatMap((payload) =>
          (payload.relationshipEvidenceById[triple.id] ?? []).flatMap((source) =>
            source.evidence?.length
              ? source.evidence.map((item) => ({ ...item, bookTitle: source.bookTitle }))
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
        return [...local, ...lazyLocal, ...lazyCanonical].map((item) => ({ ...item, triple }));
      }),
    [directTriples, evidencePayloads, inspectionBook.evidenceByTriple, datasetBookMap],
  );
  const canonicalGraph = explorer.canonicalGraph;
  const selectedOccurrences = useMemo<KnowledgeOccurrence[]>(() => {
    if (!selected) return [];
    const loaded = [
      ...(canonicalGraph?.occurrences ?? []),
      ...Object.values(evidencePayloads).flatMap((payload) => payload.occurrences),
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
  }, [canonicalGraph, datasetBookMap, evidencePayloads, selected]);

  // ---- Six-book network ----------------------------------------------------
  const canonicalGroup = useMemo<BookGroup | null>(() => {
    if (!canonicalBook) return null;
    const relationByEntity = new Map<string, Triple>();
    for (const relationship of canonicalBook.triples) {
      if (!relationByEntity.has(relationship.subject)) relationByEntity.set(relationship.subject, relationship);
      if (relationship.objectId && !relationByEntity.has(relationship.objectId))
        relationByEntity.set(relationship.objectId, relationship);
    }
    const nodes = canonicalBook.entities.map((entity) => {
      const triple = relationByEntity.get(entity.id) ?? { id: `canonical-node-${entity.id}`, subject: entity.id, predicate: "规范实体" };
      const activeLayout = entity.layouts?.[fullGraphLayout] ?? entity.layout;
      if (activeLayout) return { entity, triple, x: activeLayout.x, y: activeLayout.y };
      const textbookKey = entity.bookKeys?.[0] ?? "g7s1";
      const seed = stableSeed(entity.canonicalKey ?? entity.id);
      let x = 1200;
      let y = 750;
      if (entity.type === "教材") {
        const fixed = TEXTBOOK_POSITIONS[textbookKey] ?? { x: 1200, y: 750 };
        x = fixed.x;
        y = fixed.y;
      } else if ((entity.textbookCount ?? 1) >= 2) {
        const angle = ((seed % 100000) / 100000) * Math.PI * 2;
        const radius = 90 + ((Math.floor(seed / 97) % 1000) / 1000) * 370;
        x = 1200 + Math.cos(angle) * radius;
        y = 750 + Math.sin(angle) * radius * 0.72;
      } else {
        const base = TEXTBOOK_POSITIONS[textbookKey] ?? { x: 1200, y: 750 };
        const angle = ((seed % 100000) / 100000) * Math.PI * 2;
        const radius = 90 + ((Math.floor(seed / 113) % 1000) / 1000) * 300;
        x = base.x + Math.cos(angle) * radius;
        y = base.y + Math.sin(angle) * radius * 0.62;
      }
      return { entity, triple, x, y };
    });
    return { book: canonicalBook, center: { id: "CANONICAL_NETWORK_CENTER", name: "六册规范知识网络", type: "教材" }, nodes };
  }, [canonicalBook, fullGraphLayout]);
  const perspectiveEntityIds = useMemo(() => {
    const ids = new Set<string>();
    if (!canonicalBook) return ids;
    if (graphPerspective === "comprehensive") {
      for (const entity of canonicalBook.entities) ids.add(entity.id);
      return ids;
    }
    if (graphPerspective === "music") {
      for (const entity of canonicalBook.entities)
        if (!["textbook", "activity", "goal"].includes(schemaCategoryFor(entity.type))) ids.add(entity.id);
      return ids;
    }
    for (const relationship of canonicalBook.triples) {
      if (relationship.objectId && relationshipMatchesPerspective(relationship, graphPerspective)) {
        ids.add(relationship.subject);
        ids.add(relationship.objectId);
      }
    }
    return ids;
  }, [canonicalBook, graphPerspective]);
  const fullGraphVisibleIds = useMemo(() => {
    const ids = new Set<string>();
    if (!canonicalBook) return ids;
    const sourceLayerVisible =
      graphPerspective === "textbook" || fullGraphLayout === "textbook" || showTextbookSources || fullGraphView === "ownership";
    for (const entity of canonicalBook.entities) {
      const isTextbook = entity.type === "教材";
      const isShared = (entity.textbookCount ?? 1) >= 2;
      const visibleInMode =
        (fullGraphView === "all" && (!isTextbook || sourceLayerVisible)) ||
        fullGraphView === "ownership" ||
        (fullGraphView === "cross" && (isShared || (isTextbook && sourceLayerVisible))) ||
        (fullGraphView === "knowledge" && !isTextbook);
      if (
        visibleInMode &&
        graphFilters.filteredEntityIds.has(entity.id) &&
        (!graphFilters.relationEndpointIds || graphFilters.relationEndpointIds.has(entity.id)) &&
        perspectiveEntityIds.has(entity.id) &&
        visibleSchemaKeys.includes(schemaCategoryFor(entity.type)) &&
        !hiddenNodeKeys.includes(`${canonicalBook.key}-${entity.id}`)
      )
        ids.add(entity.id);
    }
    return ids;
  }, [canonicalBook, fullGraphLayout, fullGraphView, graphPerspective, perspectiveEntityIds, hiddenNodeKeys, showTextbookSources, visibleSchemaKeys, graphFilters.filteredEntityIds, graphFilters.relationEndpointIds]);
  const fullGraphRelationships = useMemo(() => {
    if (!canonicalBook) return [] as Triple[];
    return canonicalBook.triples.filter((relationship) => {
      if (
        !relationship.objectId ||
        !fullGraphVisibleIds.has(relationship.subject) ||
        !fullGraphVisibleIds.has(relationship.objectId) ||
        hiddenRelations.includes(relationText(relationship.predicate, canonicalBook))
      )
        return false;
      if (!relationshipMatchesPerspective(relationship, graphPerspective)) return false;
      if (fullGraphView === "ownership") return Boolean(relationship.provenance);
      if (fullGraphLayout === "knowledge" && graphPerspective !== "textbook" && !showTextbookSources && relationship.provenance)
        return false;
      if (fullGraphView === "knowledge") return !relationship.provenance;
      if (fullGraphView === "cross") {
        const source = canonicalEntityById.get(relationship.subject);
        const target = canonicalEntityById.get(relationship.objectId);
        return Boolean(
          relationship.provenance ||
            relationship.crossBook ||
            ((source?.textbookCount ?? 1) >= 2 && (target?.textbookCount ?? 1) >= 2),
        );
      }
      return true;
    });
  }, [canonicalBook, canonicalEntityById, fullGraphLayout, fullGraphView, fullGraphVisibleIds, hiddenRelations, graphPerspective, relationText, showTextbookSources]);
  const visibleRelationshipIds = useMemo(() => new Set(fullGraphRelationships.map((edge) => edge.id)), [fullGraphRelationships]);
  const pinnedNodeIds = useMemo(
    () => pinnedNodeKeys.filter((key) => key.startsWith("canonical-")).map((key) => key.slice("canonical-".length)),
    [pinnedNodeKeys],
  );

  // ---- Single textbook -----------------------------------------------------
  const canonicalFor = useCallback(
    (entity: Entity) => canonicalEntityBySearchKey.get(`${entity.name.trim().toLowerCase()}|${schemaCategoryFor(entity.type)}`),
    [canonicalEntityBySearchKey],
  );
  const passesCanonicalFilters = useCallback(
    (entity: Entity) => {
      const canonical = canonicalFor(entity);
      return (
        !canonical ||
        (graphFilters.filteredEntityIds.has(canonical.id) &&
          perspectiveEntityIds.has(canonical.id) &&
          (!graphFilters.relationEndpointIds || graphFilters.relationEndpointIds.has(canonical.id)))
      );
    },
    [canonicalFor, graphFilters.filteredEntityIds, graphFilters.relationEndpointIds, perspectiveEntityIds],
  );
  const bookSceneVisibleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const entity of currentBook.entities) {
      if (entity.type === "教材" && !showTextbookSources) continue;
      if (!visibleSchemaKeys.includes(schemaCategoryFor(entity.type))) continue;
      if (hiddenNodeKeys.includes(`${currentBook.key}-${entity.id}`)) continue;
      if (!passesCanonicalFilters(entity)) continue;
      ids.add(entity.id);
    }
    return ids;
  }, [currentBook, hiddenNodeKeys, passesCanonicalFilters, showTextbookSources, visibleSchemaKeys]);
  const bookSceneRelationshipIds = useMemo(
    () =>
      new Set(
        currentBook.triples
          .filter((triple) => triple.objectId && !hiddenRelations.includes(relationText(triple.predicate, currentBook)))
          .map((triple) => triple.id),
      ),
    [currentBook, hiddenRelations, relationText],
  );
  const bookSceneNodes = useMemo(
    () => currentBook.entities.flatMap((entity) => (entity.layout ? [{ entity, x: entity.layout.x, y: entity.layout.y }] : [])),
    [currentBook],
  );

  // The SVG renderer is only a fallback (WebGL failure or the "Canvas 回退"
  // switch), so its layouts are computed only while it is on screen.
  const svgActive = graphMode !== "all" && fullGraphRenderer !== "sigma";
  const bookCenter = useMemo(
    () => currentBook.entities.find((e) => e.type === "教材") ?? { id: `BOOK_${currentBook.key}`, name: currentBook.title, type: "教材" },
    [currentBook],
  );
  const singleGroup = useMemo(() => (svgActive ? layoutBook(currentBook, bookCenter) : null), [bookCenter, currentBook, svgActive]);
  const focusGroup = useMemo<BookGroup | null>(() => {
    if (!svgActive || graphMode !== "focus" || !selected) return null;
    const runtime = graphRuntimeFor(currentBook, currentBook.entities, currentBook.triples);
    const direct = (runtime.adjacencyMap.get(selected.id) ?? [])
      .map((item) => item.edge)
      .sort((a, b) => {
        const ai = FOCUS_PRIORITY.indexOf(a.predicate);
        const bi = FOCUS_PRIORITY.indexOf(b.predicate);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      })
      .slice(0, 22);
    const focusEntities: Entity[] = [selected];
    const focusTriples: Triple[] = [];
    const seen = new Set<string>([selected.id]);
    for (const triple of direct) {
      if (triple.objectId) {
        const other = runtime.entityMap.get(triple.subject === selected.id ? triple.objectId : triple.subject);
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
        const inner = all.length <= 14 || index < 14;
        const ringIndex = inner ? index : index - 14;
        const ringCount = inner ? Math.min(all.length, 14) : all.length - 14;
        const angle = -Math.PI / 2 + (ringIndex / Math.max(1, ringCount)) * Math.PI * 2 + (inner ? 0 : 0.16);
        const radius = inner ? 450 : 700;
        return {
          entity,
          triple: focusTriples.find((t) => t.subject === entity.id || t.objectId === entity.id) ?? {
            id: "focus-" + entity.id,
            subject: selected.id,
            predicate: "RELATED_ENTITY",
            objectId: entity.id,
          },
          x: 1200 + Math.cos(angle) * radius,
          y: 750 + Math.sin(angle) * radius * 0.76,
        };
      });
    return {
      book: { ...currentBook, entities: focusEntities, triples: focusTriples, entityCount: focusEntities.length, tripleCount: focusTriples.length },
      center: selected,
      nodes,
    };
  }, [currentBook, graphMode, relationText, selected, svgActive]);
  const bookVisibleSeeds = useMemo(() => {
    if (!svgActive) return new Set<string>();
    const degree = new Map<string, number>();
    for (const triple of currentBook.triples) {
      degree.set(triple.subject, (degree.get(triple.subject) ?? 0) + 1);
      if (triple.objectId) degree.set(triple.objectId, (degree.get(triple.objectId) ?? 0) + 1);
    }
    const byDegree = (a: Entity, b: Entity) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0);
    const seeds = new Set<string>([bookCenter.id]);
    for (const entity of currentBook.entities.filter((e) => e.type === "单元").sort(byDegree).slice(0, 10)) seeds.add(entity.id);
    for (const entity of currentBook.entities.filter((e) => isWorkType(e.type)).sort(byDegree).slice(0, 42)) seeds.add(entity.id);
    for (const entity of [...currentBook.entities].sort(byDegree)) {
      if (seeds.size >= 82) break;
      seeds.add(entity.id);
    }
    for (const id of expandedNodeIds[currentBook.key] ?? []) seeds.add(id);
    if (selectedId) seeds.add(selectedId);
    return seeds;
  }, [bookCenter.id, currentBook, expandedNodeIds, selectedId, svgActive]);

  const displayedGraphStats = (() => {
    if (graphMode === "all") {
      return {
        nodes: fullGraphVisibleIds.size,
        relationships: fullGraphRelationships.length,
        labels: new Set(
          [...fullGraphVisibleIds].flatMap((id) => {
            const entity = canonicalEntityById.get(id);
            return entity ? [schemaCategoryFor(entity.type)] : [];
          }),
        ).size,
      };
    }
    if (!svgActive) {
      const relationships = currentBook.triples.filter(
        (triple) =>
          bookSceneRelationshipIds.has(triple.id) &&
          bookSceneVisibleIds.has(triple.subject) &&
          bookSceneVisibleIds.has(triple.objectId ?? ""),
      ).length;
      const labels = new Set(
        currentBook.entities.filter((entity) => bookSceneVisibleIds.has(entity.id)).map((entity) => schemaCategoryFor(entity.type)),
      ).size;
      return { nodes: bookSceneVisibleIds.size, relationships, labels };
    }
    const sourceIds = graphMode === "focus" && focusGroup ? new Set(focusGroup.book.entities.map((entity) => entity.id)) : bookVisibleSeeds;
    const visibleIds = new Set<string>([bookCenter.id]);
    const labels = new Set<SchemaCategoryKey>();
    for (const id of sourceIds) {
      const entity = currentBook.entities.find((item) => item.id === id);
      if (!entity) continue;
      const category = schemaCategoryFor(entity.type);
      if (!hiddenNodeKeys.includes(`${currentBook.key}-${id}`) && visibleSchemaKeys.includes(category)) {
        visibleIds.add(id);
        labels.add(category);
      }
    }
    const relationships = currentBook.triples.filter(
      (triple) =>
        triple.objectId &&
        visibleIds.has(triple.subject) &&
        visibleIds.has(triple.objectId) &&
        !hiddenRelations.includes(relationText(triple.predicate, currentBook)),
    ).length;
    return { nodes: visibleIds.size, relationships, labels: labels.size };
  })();

  // ---- SVG fallback interaction --------------------------------------------
  const nodePoint = (node: Pick<PositionedNode, "entity" | "x" | "y">, book: Book) => {
    const nodeKey = book.key + "-" + node.entity.id;
    const dragged = dragPositions[nodeKey];
    if (dragged) return dragged;
    if (pinnedNodeKeys.includes(nodeKey) || !motionEnabled || graphMode === "focus") return { x: node.x, y: node.y };
    const seed = stableSeed(nodeKey);
    return {
      x: node.x + Math.sin(motionPhase + (seed % 31)) * (8 + (seed % 4)),
      y: node.y + Math.cos(motionPhase * 0.82 + (seed % 47)) * (8 * 0.72 + (seed % 3)),
    };
  };
  const graphPointer = (event: ReactPointerEvent<SVGGElement>) => {
    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const rawX = ((event.clientX - rect.left) / rect.width) * 2400;
    const rawY = ((event.clientY - rect.top) / rect.height) * 1500;
    return { x: 1200 + (rawX - 1200 - canvasPan.x) / zoom, y: 750 + (rawY - 750 - canvasPan.y) / zoom };
  };
  const beginCanvasPan = (event: ReactPointerEvent<SVGRectElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPanStart({ pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, originX: canvasPan.x, originY: canvasPan.y });
  };
  const moveCanvasPan = (event: ReactPointerEvent<SVGRectElement>) => {
    if (!panStart || panStart.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;
    explorer.setCanvasPan({
      x: panStart.originX + ((event.clientX - panStart.clientX) / rect.width) * 2400,
      y: panStart.originY + ((event.clientY - panStart.clientY) / rect.height) * 1500,
    });
  };
  const endCanvasPan = (event: ReactPointerEvent<SVGRectElement>) => {
    if (!panStart || panStart.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setPanStart(null);
  };
  const beginDrag = (event: ReactPointerEvent<SVGGElement>, entity: Entity, book: Book, point: { x: number; y: number }) => {
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
    explorer.setDragPositions((previous) => ({
      ...previous,
      [dragging.nodeKey]: { x: cursor.x - dragging.offsetX, y: cursor.y - dragging.offsetY },
    }));
  };
  const endDrag = (event: ReactPointerEvent<SVGGElement>) => {
    if (!dragging || dragging.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const moved = Math.hypot(event.clientX - dragging.startClientX, event.clientY - dragging.startClientY);
    if (moved < 5) explorer.selectEntity(dragging.entity, dragging.book);
    else explorer.setPinnedNodeKeys((previous) => (previous.includes(dragging.nodeKey) ? previous : [...previous, dragging.nodeKey]));
    setDragging(null);
  };
  const openContextMenu = (event: ReactMouseEvent<SVGGElement>, entity: Entity, book: Book) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.ownerSVGElement?.closest(".neo-canvas")?.getBoundingClientRect();
    explorer.setContextMenu({ x: rect ? event.clientX - rect.left : 24, y: rect ? event.clientY - rect.top : 24, entity, book });
  };
  const renderNode = (node: PositionedNode, book: Book) => {
    const nodeKey = book.key + "-" + node.entity.id;
    const selectedNode = node.entity.id === selectedId;
    const semantic = schemaCategoryMeta(node.entity.type);
    const radius = selectedNode ? 25 : semantic.nodeSize === "large" ? 19 : semantic.nodeSize === "medium" ? 15 : 12;
    const label = node.entity.name.length > 14 ? node.entity.name.slice(0, 14) + "…" : node.entity.name;
    const point = nodePoint(node, book);
    return (
      <g
        key={nodeKey}
        className={
          "svg-node draggable " +
          `schema-${semantic.key}` +
          (selectedNode || hoveredId === nodeKey ? " highlighted" : "") +
          (dragging?.nodeKey === nodeKey ? " dragging" : "")
        }
        transform={"translate(" + point.x + " " + point.y + ")"}
        onMouseEnter={() => setHoveredId(nodeKey)}
        onMouseLeave={() => setHoveredId(null)}
        onPointerDown={(event) => beginDrag(event, node.entity, book, point)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={() => setDragging(null)}
        onDoubleClick={() => explorer.openKnowledge(node.entity, book)}
        onContextMenu={(event) => openContextMenu(event, node.entity, book)}
      >
        <title>{node.entity.name + " · " + node.entity.type}</title>
        <circle r={radius} />
        {showLabels && (
          <>
            <text className="node-glyph" y="-6">
              {semantic.key === "person" ? "✦" : semantic.key === "work" ? "♫" : semantic.key === "genre" ? "◒" : "◆"}
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
  const renderGroup = (group: BookGroup) => {
    const isFocus = graphMode === "focus" && group === focusGroup;
    const positions = new Map(group.nodes.map((node) => [node.entity.id, node]));
    const visible = (id: string) => {
      const entity = group.book.entities.find((item) => item.id === id);
      if (id === group.center.id) return visibleSchemaKeys.includes("textbook") && (!entity || passesCanonicalFilters(entity));
      return Boolean(
        entity &&
          !hiddenNodeKeys.includes(`${group.book.key}-${id}`) &&
          passesCanonicalFilters(entity) &&
          (graphMode === "focus" || bookVisibleSeeds.has(id)) &&
          visibleSchemaKeys.includes(schemaCategoryFor(entity.type)),
      );
    };
    const centerNode = { entity: group.center, x: 1200, y: 750 };
    const centerPoint = nodePoint(centerNode, group.book);
    const point = (id: string) =>
      id === group.center.id ? centerPoint : visible(id) && positions.get(id) ? nodePoint(positions.get(id)!, group.book) : undefined;
    const edges = group.book.triples.filter(
      (t) => t.objectId && point(t.subject) && point(t.objectId) && !hiddenRelations.includes(relationText(t.predicate, group.book)),
    );
    return (
      <g key={group.book.key}>
        {edges.map((t) => {
          const from = point(t.subject)!;
          const to = point(t.objectId!)!;
          const active = t.subject === selectedId || t.objectId === selectedId;
          return (
            <g key={"edge-" + group.book.key + "-" + t.id}>
              <line
                className={`neo-edge ${relationVisualKind(relationText(t.predicate, group.book))} ${active ? "active" : ""}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                markerEnd="url(#arrow)"
              />
              <text className={"edge-label " + (active ? "active" : "")} x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 4}>
                {showLabels && (zoom >= 0.85 || active) ? relationText(t.predicate, group.book) : ""}
              </text>
            </g>
          );
        })}
        <g
          className={
            "svg-node center draggable " +
            `schema-${schemaCategoryFor(group.center.type)}` +
            (dragging?.nodeKey === group.book.key + "-" + group.center.id ? " dragging" : "")
          }
          style={{ display: visible(group.center.id) ? undefined : "none" }}
          transform={"translate(" + centerPoint.x + " " + centerPoint.y + ")"}
          onPointerDown={(event) => beginDrag(event, group.center, group.book, centerPoint)}
          onPointerMove={moveDrag}
          onPointerUp={(event) => {
            const moved = dragging ? Math.hypot(event.clientX - dragging.startClientX, event.clientY - dragging.startClientY) : 0;
            endDrag(event);
            if (moved < 5 && !isFocus) {
              explorer.setBookKey(group.book.key);
              explorer.setGraphMode("book");
            }
          }}
          onPointerCancel={() => setDragging(null)}
          onDoubleClick={() => explorer.openKnowledge(group.center, group.book)}
          onContextMenu={(event) => openContextMenu(event, group.center, group.book)}
        >
          <circle r={isFocus ? 46 : 54} />
          <circle className="node-ring" r={isFocus ? 58 : 66} />
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
        {group.nodes.filter((node) => visible(node.entity.id)).map((node) => renderNode(node, group.book))}
      </g>
    );
  };
  const svgGroup = graphMode === "focus" ? focusGroup : singleGroup;
  const bookSvgFallback = svgActive && svgGroup ? (
    <svg viewBox="0 0 2400 1500" role="img" aria-label="教材知识图谱">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
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
      <g className="svg-zoom" transform={`translate(${1200 + canvasPan.x} ${750 + canvasPan.y}) scale(${zoom}) translate(-1200 -750)`}>
        {renderGroup(svgGroup)}
      </g>
    </svg>
  ) : null;

  // ---- Renderer callbacks (stable, read the latest explorer through a ref) --
  const { setHighlightedCanonicalIds, setHighlightedCanonicalRelationIds } = explorer;
  const clearCanonicalHighlight = useCallback(() => {
    setHighlightedCanonicalIds(NO_IDS);
    setHighlightedCanonicalRelationIds(NO_IDS);
  }, [setHighlightedCanonicalIds, setHighlightedCanonicalRelationIds]);
  const handleCanvasSelect = useCallback((entity: Entity) => {
    const current = explorerRef.current;
    current.setInspectorOpen(true);
    if (!current.canonicalBook) return;
    current.setShowLabels(true);
    clearCanonicalHighlight();
    current.selectEntity(entity, current.canonicalBook);
  }, [clearCanonicalHighlight]);
  const handleCanvasExpand = useCallback((entity: Entity) => {
    const current = explorerRef.current;
    if (!current.canonicalBook) return;
    current.selectEntity(entity, current.canonicalBook);
    current.setKnowledgeDetailOpen(true);
    clearCanonicalHighlight();
  }, [clearCanonicalHighlight]);
  const handleCanvasContextMenu = useCallback((x: number, y: number, entity: Entity) => {
    const current = explorerRef.current;
    if (current.canonicalBook) current.setContextMenu({ x, y, entity, book: current.canonicalBook });
  }, []);
  const handleNodePosition = useCallback((nodeKey: string, point: { x: number; y: number }) => {
    const current = explorerRef.current;
    current.setDragPositions((previous) => ({ ...previous, [nodeKey]: point }));
    const pinKey = nodeKey.startsWith("canonical:") ? nodeKey.replace(/^canonical:[^-]+-/, "canonical-") : nodeKey;
    current.setPinnedNodeKeys((previous) => (previous.includes(pinKey) ? previous : [...previous, pinKey]));
  }, []);
  const handleClearSigmaFocus = useCallback(() => {
    const current = explorerRef.current;
    current.setKnowledgeDetailOpen(false);
    clearCanonicalHighlight();
    current.setInspectorOpen(false);
  }, [clearCanonicalHighlight]);
  const handleBookSelect = useCallback((entity: Entity) => {
    const current = explorerRef.current;
    current.setShowLabels(true);
    current.selectEntity(entity, current.currentBook);
  }, []);
  const handleBookExpand = useCallback((entity: Entity) => {
    const current = explorerRef.current;
    current.selectEntity(entity, current.currentBook);
    current.setKnowledgeDetailOpen(true);
  }, []);
  const handleBookContextMenu = useCallback((x: number, y: number, entity: Entity) => {
    const current = explorerRef.current;
    current.setContextMenu({ x, y, entity, book: current.currentBook });
  }, []);
  const handleBookClearFocus = useCallback(() => {
    explorerRef.current.setKnowledgeDetailOpen(false);
    explorerRef.current.setInspectorOpen(false);
  }, []);
  const setZoom = explorer.setZoom;
  const setCanvasPan = explorer.setCanvasPan;

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
        onZoomChange={setZoom}
        onPanChange={setCanvasPan}
        onSelect={handleCanvasSelect}
        onExpand={handleCanvasExpand}
        onContextMenu={handleCanvasContextMenu}
        onNodePosition={handleNodePosition}
        onMetrics={ignoreMetrics}
      />
    ) : null;
  const fullGraphScene =
    canonicalGroup && canonicalBook && fullGraphLayout === "schema" ? (
      <SchemaExplorer entities={canonicalBook.entities} relationships={canonicalBook.triples} onInstances={explorer.openSchemaInstances} />
    ) : canonicalGroup && canonicalBook ? (
      <GraphRendererBoundary fallback={fullGraphCanvasFallback} onFallback={() => explorer.setFullGraphRenderer("canvas")}>
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
            cameraResetToken={explorer.cameraResetToken}
            focusSelectionToken={explorer.focusSelectionToken}
            draggedPositions={dragPositions}
            pinnedNodeIds={pinnedNodeIds}
            detailOpen={knowledgeDetailOpen}
            onSelect={handleCanvasSelect}
            onExpand={handleCanvasExpand}
            onContextMenu={handleCanvasContextMenu}
            onNodePosition={handleNodePosition}
            onMetrics={ignoreMetrics}
            onViewportChange={setSigmaViewport}
            onClearFocus={handleClearSigmaFocus}
          />
        ) : (
          fullGraphCanvasFallback
        )}
      </GraphRendererBoundary>
    ) : null;
  const bookScene = (
    <SigmaGraphScene
      nodes={bookSceneNodes}
      relationships={currentBook.triples}
      visibleNodeIds={bookSceneVisibleIds}
      visibleRelationshipIds={bookSceneRelationshipIds}
      selectedId={inspectorOpen ? selectedId : null}
      highlightedNodeIds={NO_IDS}
      highlightedRelationshipIds={NO_IDS}
      relationLabels={currentBook.relations}
      sceneKey={`book:${currentBook.key}`}
      showLabels={showLabels}
      zoom={zoom}
      cameraResetToken={explorer.cameraResetToken}
      focusSelectionToken={explorer.focusSelectionToken}
      draggedPositions={dragPositions}
      detailOpen={knowledgeDetailOpen}
      onSelect={handleBookSelect}
      onExpand={handleBookExpand}
      onContextMenu={handleBookContextMenu}
      onNodePosition={handleNodePosition}
      onMetrics={ignoreMetrics}
      onViewportChange={setSigmaViewport}
      onClearFocus={handleBookClearFocus}
    />
  );

  const fitCanvas = () => {
    const sigmaScene = graphMode === "all" || fullGraphRenderer === "sigma";
    setZoom(sigmaScene ? 0.64 : 0.92);
    setCanvasPan({ x: 0, y: 0 });
    if (sigmaScene) explorer.setCameraResetToken((value) => value + 1);
  };
  const fitSelection = () => {
    if (!selected) return;
    if (graphMode === "all" && canonicalGroup) {
      explorer.setFocusSelectionToken((value) => value + 1);
      const target = canonicalGroup.nodes.find((node) => node.entity.id === selected.id);
      if (target) {
        setCanvasPan({ x: 1200 - target.x, y: 750 - target.y });
        setZoom(1.55);
        explorer.setShowLabels(true);
      }
    } else explorer.selectEntity(selected, currentBook, true);
  };

  return (
    <>
      <div className="book-tabs">
        <button className={`book-tab ${graphMode === "all" ? "active" : ""}`} onClick={explorer.chooseFullGraph}>
          六册叠加
        </button>
        {books.map((book) => (
          <button
            key={book.key}
            className={`book-tab ${graphMode !== "all" && book.key === explorer.bookKey ? "active" : ""}`}
            onClick={() => explorer.chooseBook(book)}
          >
            {book.grade}年级{book.semester}
          </button>
        ))}
      </div>
      <div className="neo-layout">
        <div className="graph-main">
          <section className={"neo-card " + (explorer.expanded ? "expanded" : "")}>
            <div className="neo-toolbar">
              {/* Hidden by theme-light; kept because `.neo-toolbar>div:first-child` targets it. */}
              <div>
                <span className="eyebrow muted">DATA VIEW · LOCAL EXPLORATION</span>
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
                  <button onClick={fitCanvas}>
                    <WorkbenchIcon name="fit" /> 适配画布
                  </button>
                  <button
                    ref={mobileFilterTriggerRef}
                    type="button"
                    className="graph-mobile-filter-trigger"
                    aria-controls="mobile-graph-filter-drawer"
                    aria-expanded={mobileFiltersOpen}
                    onClick={() => {
                      setMobileFiltersOpen(true);
                      window.dispatchEvent(new Event("yapu:graph-filters-open"));
                    }}
                  >
                    <WorkbenchIcon name="tune" /> 筛选
                  </button>
                  <button className={explorer.pathFinderOpen ? "active" : ""} onClick={() => explorer.openPathFinder(selected)}>
                    <WorkbenchIcon name="path" /> 路径查询
                  </button>
                  <button onClick={explorer.resetEverything}>
                    <WorkbenchIcon name="reset" /> 重置视图
                  </button>
                </div>
                <details className="graph-toolbar-menu">
                  <summary>
                    <WorkbenchIcon name="tune" /> 视图与显示 <WorkbenchIcon name="down" />
                  </summary>
                  <div className="graph-toolbar-menu-content">
                    <button disabled={!selected} onClick={fitSelection}>
                      适配选中
                    </button>
                    <button onClick={() => explorer.setShowLabels((value) => !value)}>{showLabels ? "隐藏标签" : "显示标签"}</button>
                    {graphMode === "all" && (
                      <button
                        title="Sigma WebGL 为主渲染器，Canvas 2D 保留为兼容回退"
                        onClick={() => explorer.setFullGraphRenderer((value) => (value === "sigma" ? "canvas" : "sigma"))}
                      >
                        {fullGraphRenderer === "sigma" ? "WebGL 图谱" : "Canvas 回退"}
                      </button>
                    )}
                    <button onClick={() => explorer.setMotionEnabled((value) => !value)}>{motionEnabled ? "停止动态" : "动态演示"}</button>
                    <button
                      onClick={() => {
                        if (graphMode === "all") explorer.setGraphMode("book");
                        else if (graphMode === "focus") {
                          explorer.setGraphMode("book");
                          setZoom(1);
                        } else explorer.chooseFullGraph();
                      }}
                    >
                      {graphMode === "all" ? "进入单册" : graphMode === "focus" ? "返回单册" : "返回六册叠加"}
                    </button>
                  </div>
                </details>
                <div className="graph-toolbar-tools" aria-label="画布缩放与全屏">
                  <button aria-label="缩小图谱" onClick={() => setZoom(Math.max(0.3, zoom - 0.2))}>
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
                  <span className="zoom-value">{Math.round(zoom * 100)}%</span>
                  <button aria-label="放大图谱" onClick={() => setZoom(Math.min(3.2, zoom + 0.2))}>
                    <WorkbenchIcon name="plus" />
                  </button>
                  <button
                    aria-label={explorer.expanded ? "退出全屏" : "全屏画布"}
                    title={explorer.expanded ? "退出全屏" : "全屏画布"}
                    onClick={() => explorer.setExpanded((value) => !value)}
                  >
                    <WorkbenchIcon name={explorer.expanded ? "collapse" : "expand"} />
                  </button>
                </div>
              </div>
            </div>
            {graphMode === "all" && (
              <div className="full-graph-filterbar" aria-label="六册关系视图">
                <div className="graph-filter-primary">
                  <div className="full-graph-layout-tabs" aria-label="全景布局模式">
                    {LAYOUT_TABS.map(([key, label, english]) => (
                      <button
                        key={key}
                        className={fullGraphLayout === key ? "active" : ""}
                        title={english}
                        onClick={() => {
                          explorer.setFullGraphLayout(key);
                          setCanvasPan({ x: 0, y: 0 });
                          setZoom(0.64);
                          explorer.setCameraResetToken((value) => value + 1);
                          clearCanonicalHighlight();
                        }}
                      >
                        <strong>{label}</strong>
                        <small>{english}</small>
                      </button>
                    ))}
                  </div>
                  <div className="full-graph-view-tabs">
                    {VIEW_TABS.map(([key, label]) => (
                      <button
                        key={key}
                        className={fullGraphView === key ? "active" : ""}
                        onClick={() => {
                          explorer.setFullGraphView(key);
                          clearCanonicalHighlight();
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <details className="graph-filter-more">
                  <summary>
                    更多选项 <WorkbenchIcon name="down" />
                  </summary>
                  <div className="full-graph-operations">
                    <label className="source-layer-toggle">
                      <input
                        type="checkbox"
                        checked={showTextbookSources || fullGraphLayout === "textbook"}
                        disabled={fullGraphLayout === "textbook"}
                        onChange={(event) => explorer.setShowTextbookSources(event.target.checked)}
                      />
                      显示教材来源
                    </label>
                    <button onClick={explorer.undoView} disabled={!explorer.viewHistory.length}>
                      撤销展开
                    </button>
                    <button onClick={explorer.collapseExpansion}>收起子图</button>
                    <span>
                      规范实体 {fmt(canonicalBook?.entityCount ?? 0)} · 跨册实体{" "}
                      {fmt(canonicalGraph?.quality.canonical.sharedEntityCount ?? 0)}
                    </span>
                  </div>
                </details>
              </div>
            )}
            <GraphPathFinder
              open={explorer.pathFinderOpen}
              entities={canonicalBook?.entities ?? EMPTY_ENTITIES}
              startId={explorer.pathStartId}
              endId={explorer.pathEndId}
              paths={explorer.graphPaths}
              activePathIndex={explorer.safeActivePathIndex}
              onStartChange={(id) => {
                explorer.setPathStartId(id);
                explorer.setActivePathIndex(0);
              }}
              onEndChange={(id) => {
                explorer.setPathEndId(id);
                explorer.setActivePathIndex(0);
              }}
              onPathIndexChange={explorer.setActivePathIndex}
              onApply={explorer.applyGraphPath}
              onClose={() => explorer.setPathFinderOpen(false)}
            />
            <div
              className="neo-canvas"
              onClick={() => explorer.setContextMenu(null)}
              onWheel={
                svgActive
                  ? (event) => {
                      event.preventDefault();
                      setZoom((value) => Math.max(0.3, Math.min(3.2, value + (event.deltaY < 0 ? 0.12 : -0.12))));
                    }
                  : undefined
              }
            >
              {graphMode === "all" ? (
                <>
                  {fullGraphScene}
                  {fullGraphLayout !== "schema" && graphPerspective !== "progression" && fullGraphVisibleIds.size === 0 && (
                    <p className="graph-empty-overlay" role="status">
                      当前组合筛选没有匹配实体。可清除部分条件或恢复全部筛选；平台不会补造不存在的数据。
                    </p>
                  )}
                  {graphPerspective === "progression" && fullGraphVisibleIds.size === 0 && (
                    <p className="graph-empty-overlay">
                      当前数据没有经教材证据或人工确认的学习进阶关系。请切换其他视角；平台不会自动创建前置或深化关系。
                    </p>
                  )}
                </>
              ) : (
                <GraphRendererBoundary fallback={bookSvgFallback} onFallback={() => explorer.setFullGraphRenderer("canvas")}>
                  {fullGraphRenderer === "sigma" ? bookScene : bookSvgFallback}
                </GraphRendererBoundary>
              )}
              {graphMode === "all" && canonicalGroup && fullGraphLayout !== "schema" && (
                <div className="graph-minimap" aria-label="六册知识网络缩略图">
                  <div>
                    <strong>MINI MAP</strong>
                    <button
                      onClick={() => {
                        setCanvasPan({ x: 0, y: 0 });
                        setZoom(0.72);
                        explorer.setCameraResetToken((value) => value + 1);
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
              <GraphContextMenu explorer={explorer} />
              <div className="canvas-hint">
                {graphMode === "focus"
                  ? "查询结果已固定 · 节点仍可拖拽 · 滚轮或滑杆放大"
                  : motionEnabled
                    ? "动态演示已开启 · 节点可拖拽 · 滚轮缩放"
                    : "稳定研究模式 · 节点可拖拽 · 滚轮缩放 · 点击检查三元组"}
              </div>
              <div className="graph-statusbar">
                <span>
                  Nodes <b>{fmt(displayedGraphStats.nodes)}</b>
                </span>
                <span>
                  Relationships <b>{fmt(displayedGraphStats.relationships)}</b>
                </span>
                <span>
                  Labels <b>{displayedGraphStats.labels}</b>
                </span>
                <span className="status-mode">
                  当前视图：{graphMode === "all" ? "教材全景" : graphMode === "focus" ? "节点聚焦" : "单册探索"}
                </span>
              </div>
            </div>
          </section>
        </div>
        <NodeInspector
          explorer={explorer}
          directTriples={directTriples}
          facts={inspectorFacts}
          evidence={evidence}
          occurrences={selectedOccurrences}
        />
        {knowledgeDetailOpen && selected && (
          <KnowledgeDetailDrawer
            entity={selected}
            entities={inspectionRuntime.entityMap}
            relationships={directTriples}
            occurrences={selectedOccurrences}
            books={books}
            basePath={PUBLIC_BASE_PATH}
            onNavigate={(entity) => explorer.locateCanonical(entity.id)}
            onClose={() => {
              explorer.setKnowledgeDetailOpen(false);
              explorer.setFocusSelectionToken((value) => value + 1);
            }}
            onAsk={(name) => explorer.ask(`请介绍${name}的教材内容与相关知识`)}
          />
        )}
      </div>
    </>
  );
}
