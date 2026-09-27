"use client";
// State and actions of the knowledge-graph explorer. It lives above the page
// switch so the explorer keeps its filters, selection and camera while the
// reader visits a lesson or asks a question, and so other pages can open the
// graph on a given node. Rendering-only data is derived in GraphExplorer.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ALL_SCHEMA_KEYS, schemaCategoryFor, type SchemaCategoryKey } from "../../graph-schema";
import { graphRuntimeFor, neighborhood } from "../../graph-runtime";
import { useGraphActions } from "../../hooks/useGraphActions";
import { useGraphFilters } from "../../hooks/useGraphFilters";
import { useGraphPath } from "../../hooks/useGraphPath";
import type { AnswerResult } from "../../lib/ai/graph-rag";
import { publicAssetUrl } from "../../lib/app/assets";
import {
  DEFAULT_BOOK_KEY,
  EMPTY_ENTITIES,
  EMPTY_TRIPLES,
  isWorkType,
  relationTextFor,
  type Book,
  type CanonicalGraph,
  type Dataset,
  type Entity,
} from "../../lib/app/types";
import type { GraphAction } from "../../lib/graph/graph-actions";
import type { GraphPerspective } from "../../lib/graph/types";

export type InspectorTab = "overview" | "relations" | "occurrences" | "evidence" | "teaching";
export type ContextMenuState = { x: number; y: number; entity: Entity; book: Book };
export type FullGraphView = "all" | "cross" | "ownership" | "knowledge";
export type FullGraphLayoutMode = "knowledge" | "textbook" | "schema";
export type FullGraphRenderer = "sigma" | "canvas";
export type GraphMode = "all" | "book" | "focus";
type ViewSnapshot = {
  expandedNodeIds: Record<string, string[]>;
  highlightedCanonicalIds: string[];
  highlightedCanonicalRelationIds: string[];
};

/** How the explorer reaches the rest of the site. */
export type ExplorerLinks = {
  showGraph: () => void;
  openLesson: (entity: Entity) => void;
  openRecords: () => void;
  ask: (question: string) => void;
};

const EMPTY_BOOKS: Book[] = [];
const EMPTY_BOOK: Book = {
  key: "none",
  title: "",
  grade: 0,
  semester: "",
  pages: 0,
  entityCount: 0,
  tripleCount: 0,
  evidenceCount: 0,
  workCount: 0,
  reviewCount: 0,
  structureShare: 0,
  entities: [],
  triples: [],
  evidenceByTriple: {},
  relations: {},
};
const searchKey = (entity: Pick<Entity, "name" | "type">) =>
  `${entity.name.trim().toLowerCase()}|${schemaCategoryFor(entity.type)}`;

/**
 * @param initialNodeId canonical entity to open in the inspector on first load (from `?node=`).
 */
export function useGraphExplorer(
  dataset: Dataset | null,
  canonicalGraph: CanonicalGraph | null,
  links: ExplorerLinks,
  initialNodeId?: string,
) {
  const books = dataset?.books ?? EMPTY_BOOKS;
  const linksRef = useRef(links);
  useEffect(() => {
    linksRef.current = links;
  });

  const [bookKey, setBookKey] = useState(DEFAULT_BOOK_KEY);
  const [chosenId, setSelectedId] = useState(initialNodeId ?? "");
  const [graphMode, setGraphMode] = useState<GraphMode>("all");
  const [inspectorOpen, setInspectorOpen] = useState(Boolean(initialNodeId));
  const [knowledgeDetailOpen, setKnowledgeDetailOpen] = useState(false);
  const [panel, setPanel] = useState<InspectorTab>("overview");
  const [zoom, setZoom] = useState(0.64);
  const [showLabels, setShowLabels] = useState(Boolean(initialNodeId));
  const [expanded, setExpanded] = useState(false);
  // Motion stays off by default: the research view must hold still.
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, string[]>>({});
  const [hiddenNodeKeys, setHiddenNodeKeys] = useState<string[]>([]);
  const [pinnedNodeKeys, setPinnedNodeKeys] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [fullGraphView, setFullGraphView] = useState<FullGraphView>("all");
  const [fullGraphLayout, setFullGraphLayout] = useState<FullGraphLayoutMode>("knowledge");
  const [fullGraphRenderer, setFullGraphRenderer] = useState<FullGraphRenderer>("sigma");
  const [graphPerspective, setGraphPerspective] = useState<GraphPerspective>("comprehensive");
  const [showTextbookSources, setShowTextbookSources] = useState(false);
  const [highlightedCanonicalIds, setHighlightedCanonicalIds] = useState<string[]>([]);
  const [highlightedCanonicalRelationIds, setHighlightedCanonicalRelationIds] = useState<string[]>([]);
  const [viewHistory, setViewHistory] = useState<ViewSnapshot[]>([]);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [pathFinderOpen, setPathFinderOpen] = useState(false);
  const [pathStartId, setPathStartId] = useState("");
  const [pathEndId, setPathEndId] = useState("");
  const [activePathIndex, setActivePathIndex] = useState(0);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [focusSelectionToken, setFocusSelectionToken] = useState(initialNodeId ? 1 : 0);

  // Until the reader picks a node, the most widely shared cross-book concept is the selection.
  const defaultSelectedId = useMemo(
    () =>
      [...(canonicalGraph?.entities ?? [])]
        .filter((entity) => entity.type !== "教材")
        .sort((a, b) => (b.textbookCount ?? 1) - (a.textbookCount ?? 1) || (b.degree ?? 0) - (a.degree ?? 0))[0]?.id ?? "",
    [canonicalGraph],
  );
  const selectedId = chosenId || defaultSelectedId;

  const datasetBookMap = useMemo(() => new Map(books.map((book) => [book.key, book])), [books]);
  const currentBook = datasetBookMap.get(bookKey) ?? books[0] ?? EMPTY_BOOK;
  const canonicalBook = useMemo<Book | null>(() => {
    if (!canonicalGraph) return null;
    const relations = Object.fromEntries(
      canonicalGraph.relationships.map((relationship) => [relationship.predicate, relationship.label ?? relationship.predicate]),
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
      pages: books.reduce((total, book) => total + book.pages, 0),
      entityCount: canonicalGraph.entities.length,
      tripleCount: canonicalGraph.relationships.length,
      evidenceCount: canonicalGraph.relationships.reduce((total, relationship) => total + (relationship.sources?.length ?? 0), 0),
      workCount: canonicalGraph.entities.filter((entity) => schemaCategoryFor(entity.type) === "work").length,
      reviewCount: 0,
      structureShare: 0,
      entities: canonicalGraph.entities,
      triples: canonicalGraph.relationships,
      evidenceByTriple,
      relations,
    };
  }, [canonicalGraph, books]);

  const graphFilters = useGraphFilters(canonicalBook?.entities ?? EMPTY_ENTITIES, canonicalBook?.triples ?? EMPTY_TRIPLES, books, publicAssetUrl);
  const { setVisibleSchemaKeys, setHiddenRelations } = graphFilters;
  const resetGraphFilters = graphFilters.reset;
  const { paths: graphPaths } = useGraphPath(
    canonicalBook?.entities ?? EMPTY_ENTITIES,
    canonicalBook?.triples ?? EMPTY_TRIPLES,
    pathStartId,
    pathEndId,
  );
  const safeActivePathIndex = activePathIndex < graphPaths.length ? activePathIndex : 0;
  const activeGraphPath = graphPaths[safeActivePathIndex] ?? graphPaths[0];

  const inspectionBook = graphMode === "all" && canonicalBook ? canonicalBook : currentBook;
  const inspectionRuntime = useMemo(
    () => graphRuntimeFor(inspectionBook, inspectionBook.entities, inspectionBook.triples),
    [inspectionBook],
  );
  const selected: Entity | undefined =
    inspectionRuntime.entityMap.get(selectedId) ??
    inspectionBook.entities.find((e) => isWorkType(e.type)) ??
    inspectionBook.entities[0];
  const relationText = useCallback(
    (predicate: string, book: Book = inspectionBook) => relationTextFor(predicate, book),
    [inspectionBook],
  );
  const canonicalEntityById = useMemo(
    () =>
      canonicalBook
        ? graphRuntimeFor(canonicalBook, canonicalBook.entities, canonicalBook.triples).entityMap
        : new Map<string, Entity>(),
    [canonicalBook],
  );
  const canonicalEntityBySearchKey = useMemo(() => {
    const map = new Map<string, Entity>();
    for (const entity of canonicalBook?.entities ?? []) {
      if (entity.canonicalKey) map.set(entity.canonicalKey, entity);
      map.set(searchKey(entity), entity);
      for (const alias of entity.aliases ?? [])
        map.set(`${alias.trim().toLowerCase()}|${schemaCategoryFor(entity.type)}`, entity);
    }
    return map;
  }, [canonicalBook]);
  /** The canonical (six-book) entity behind a per-book entity. */
  const toCanonical = (entity: Entity) =>
    canonicalEntityById.get(entity.id) ??
    (entity.canonicalKey ? canonicalEntityBySearchKey.get(entity.canonicalKey) : undefined) ??
    canonicalEntityBySearchKey.get(searchKey(entity));

  const rememberView = () => {
    const snapshot: ViewSnapshot = { expandedNodeIds, highlightedCanonicalIds, highlightedCanonicalRelationIds };
    setViewHistory((previous) => [...previous.slice(-19), snapshot]);
  };
  const undoView = () => {
    const snapshot = viewHistory.at(-1);
    if (!snapshot) return;
    setExpandedNodeIds(snapshot.expandedNodeIds);
    setHighlightedCanonicalIds(snapshot.highlightedCanonicalIds);
    setHighlightedCanonicalRelationIds(snapshot.highlightedCanonicalRelationIds);
    setViewHistory((previous) => previous.slice(0, -1));
  };
  const collapseExpansion = () => {
    rememberView();
    if (graphMode === "all") {
      setHighlightedCanonicalIds([]);
      setHighlightedCanonicalRelationIds([]);
    } else {
      setExpandedNodeIds((previous) => ({ ...previous, [currentBook.key]: selected ? [selected.id] : [] }));
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
      relationFilter ? (triple) => relationText(triple.predicate, book) === relationFilter : undefined,
    );
    const allowed = [...discovered.nodeIds].filter((id) => {
      if (!category || id === entity.id) return true;
      const neighbor = runtime.entityMap.get(id);
      return neighbor ? schemaCategoryFor(neighbor.type) === category : false;
    });
    if (book.key === "canonical") {
      setHighlightedCanonicalIds(allowed);
      setHighlightedCanonicalRelationIds([...discovered.edgeIds]);
      const target = entity.layouts?.[fullGraphLayout] ?? entity.layout;
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
    setHiddenNodeKeys((previous) => (previous.includes(key) ? previous : [...previous, key]));
    setContextMenu(null);
  };
  const selectEntity = (entity: Entity, book = currentBook, focus = false) => {
    setInspectorOpen(true);
    if (book.key !== "canonical" && book.key !== bookKey) setBookKey(book.key);
    setSelectedId(entity.id);
    linksRef.current.showGraph();
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
      setShowLabels(true);
      setZoom(1.65);
      setFocusSelectionToken((value) => value + 1);
    }
  };
  const showNodeEvidence = (entity: Entity, book: Book) => {
    selectEntity(entity, book);
    setPanel("evidence");
    setContextMenu(null);
  };
  /** Open the six-book graph on an entity picked from search or another page. */
  const selectSearchResult = (entity: Entity, book: Book) => {
    setInspectorOpen(true);
    const canonical =
      (entity.canonicalKey ? canonicalEntityBySearchKey.get(entity.canonicalKey) : undefined) ??
      canonicalEntityBySearchKey.get(searchKey(entity));
    if (canonical && canonicalBook) {
      resetGraphFilters();
      linksRef.current.showGraph();
      setGraphMode("all");
      setGraphPerspective("comprehensive");
      setFullGraphView("all");
      setVisibleSchemaKeys((previous) => [...new Set([...previous, schemaCategoryFor(canonical.type)])]);
      setHiddenNodeKeys((previous) => previous.filter((key) => key !== `canonical-${canonical.id}`));
      if (canonical.type === "教材") setShowTextbookSources(true);
      setSelectedId(canonical.id);
      setFocusSelectionToken((value) => value + 1);
      setPanel("overview");
      setShowLabels(true);
      setHighlightedCanonicalIds([]);
      setHighlightedCanonicalRelationIds([]);
      return;
    }
    selectEntity(entity, book, true);
  };
  const locateCanonical = (id: string) => {
    const target = canonicalEntityById.get(id);
    if (target && canonicalBook) selectSearchResult(target, canonicalBook);
  };
  const openLesson = (entity: Entity) => {
    const canonical = toCanonical(entity);
    if (canonical) linksRef.current.openLesson(canonical);
  };
  const openKnowledge = (entity: Entity, book: Book) => {
    selectSearchResult(entity, book);
    setKnowledgeDetailOpen(true);
    setContextMenu(null);
  };
  const chooseBook = (book: Book) => {
    setKnowledgeDetailOpen(false);
    setBookKey(book.key);
    const work = book.entities.find((e) => isWorkType(e.type)) ?? book.entities[0];
    if (work) setSelectedId(work.id);
    setGraphMode("book");
    linksRef.current.showGraph();
    setZoom(0.64);
    setCanvasPan({ x: 0, y: 0 });
    setCameraResetToken((value) => value + 1);
  };
  const chooseFullGraph = () => {
    setKnowledgeDetailOpen(false);
    setGraphMode("all");
    linksRef.current.showGraph();
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
          (a.visualRank ?? Number.MAX_SAFE_INTEGER) - (b.visualRank ?? Number.MAX_SAFE_INTEGER) ||
          (b.textbookCount ?? 1) - (a.textbookCount ?? 1) ||
          (b.degree ?? 0) - (a.degree ?? 0),
      )[0];
    if (core) setSelectedId(core.id);
  };
  const openPathFinder = (entity?: Entity) => {
    linksRef.current.showGraph();
    setGraphMode("all");
    setPathFinderOpen(true);
    if (entity) {
      setPathStartId(toCanonical(entity)?.id ?? "");
      setPathEndId("");
    }
    setActivePathIndex(0);
    setContextMenu(null);
  };
  const applyGraphPath = () => {
    if (!activeGraphPath) return;
    resetGraphFilters();
    setFullGraphLayout("knowledge");
    setInspectorOpen(true);
    setFocusSelectionToken((value) => value + 1);
    linksRef.current.showGraph();
    setGraphMode("all");
    setFullGraphView("all");
    setGraphPerspective("comprehensive");
    setVisibleSchemaKeys([...ALL_SCHEMA_KEYS]);
    setHiddenRelations([]);
    setHiddenNodeKeys((previous) => previous.filter((key) => !activeGraphPath.nodeIds.some((id) => key === `canonical-${id}`)));
    if (
      activeGraphPath.nodeIds.some((id) => canonicalEntityById.get(id)?.type === "教材") ||
      activeGraphPath.edgeIds.some((id) => canonicalBook?.triples.find((edge) => edge.id === id)?.provenance)
    )
      setShowTextbookSources(true);
    setHighlightedCanonicalIds(activeGraphPath.nodeIds);
    setHighlightedCanonicalRelationIds(activeGraphPath.edgeIds);
    setSelectedId(activeGraphPath.nodeIds.at(-1) ?? activeGraphPath.nodeIds[0]);
    setShowLabels(true);
    setPanel("relations");
  };
  /** 研究分析: highlight what two textbooks share. */
  const openResearchPair = (entityIds: string[]) => {
    if (!canonicalBook || !entityIds.length) return;
    resetGraphFilters();
    setGraphPerspective("comprehensive");
    setInspectorOpen(false);
    const idSet = new Set(entityIds);
    const relatedRelationships = canonicalBook.triples
      .filter((relationship) => relationship.objectId && idSet.has(relationship.subject) && idSet.has(relationship.objectId))
      .map((relationship) => relationship.id);
    linksRef.current.showGraph();
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
      const average = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
      setCanvasPan({ x: 1200 - average.x / points.length, y: 750 - average.y / points.length });
    }
  };
  const openResearchEntity = (entity: { id: string }) => {
    const target = canonicalEntityById.get(entity.id);
    if (!target || !canonicalBook) return;
    resetGraphFilters();
    setGraphPerspective("comprehensive");
    setInspectorOpen(true);
    setFullGraphView("all");
    setFocusSelectionToken((value) => value + 1);
    linksRef.current.showGraph();
    setGraphMode("all");
    setFullGraphLayout("knowledge");
    setSelectedId(target.id);
    setHighlightedCanonicalIds([]);
    setHighlightedCanonicalRelationIds([]);
    setShowLabels(true);
    setZoom(1.45);
    if (target.layout) setCanvasPan({ x: 1200 - target.layout.x, y: 750 - target.layout.y });
  };
  const togglePin = (entity: Entity, book: Book) => {
    const key = `${book.key}-${entity.id}`;
    const pinned = pinnedNodeKeys.includes(key);
    setPinnedNodeKeys((previous) => (pinned ? previous.filter((item) => item !== key) : [...previous, key]));
    setContextMenu(null);
  };
  const restoreNodePosition = (entity: Entity, book: Book) => {
    const key = `${book.key}-${entity.id}`;
    setPinnedNodeKeys((previous) => previous.filter((item) => item !== key));
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
  const resetExplorer = useCallback(() => {
    setKnowledgeDetailOpen(false);
    resetGraphFilters();
    setHiddenNodeKeys([]);
    setHighlightedCanonicalIds([]);
    setHighlightedCanonicalRelationIds([]);
    setGraphPerspective("comprehensive");
    setFullGraphView("all");
    setShowTextbookSources(false);
    setInspectorOpen(false);
  }, [resetGraphFilters]);
  /** 重置视图: every filter, expansion, pin and camera change back to the default. */
  const resetEverything = () => {
    resetExplorer();
    setExpandedNodeIds({});
    setHiddenRelations([]);
    setVisibleSchemaKeys([...ALL_SCHEMA_KEYS]);
    setViewHistory([]);
    setCanvasPan({ x: 0, y: 0 });
    setDragPositions({});
    setFullGraphLayout("knowledge");
    setFullGraphView("all");
    setZoom(0.64);
    setCameraResetToken((value) => value + 1);
  };
  const handlePerspective = useCallback((value: GraphPerspective) => {
    setKnowledgeDetailOpen(false);
    setGraphPerspective(value);
    setHighlightedCanonicalIds([]);
    setHighlightedCanonicalRelationIds([]);
    setInspectorOpen(false);
  }, []);
  const graphActions = useGraphActions(canonicalGraph, {
    begin: () => {
      resetExplorer();
      linksRef.current.showGraph();
      setGraphMode("all");
      setFullGraphLayout("knowledge");
      setPathFinderOpen(false);
      setContextMenu(null);
    },
    focus: (ids, isolate) => {
      if (isolate) graphFilters.setFocusedEntityIds(ids);
      setHighlightedCanonicalIds(ids);
      setSelectedId(ids[0]);
      setInspectorOpen(true);
      setPanel("overview");
      setFocusSelectionToken((value) => value + 1);
      if (ids.some((id) => canonicalEntityById.get(id)?.type === "教材")) setShowTextbookSources(true);
    },
    entityTypes: (types) => setVisibleSchemaKeys(types as SchemaCategoryKey[]),
    relations: (types) => {
      setHiddenRelations(
        [...new Set(canonicalGraph?.relationships.map((edge) => edge.label ?? edge.predicate) ?? [])].filter((name) => !types.includes(name)),
      );
      if (canonicalGraph?.relationships.some((edge) => edge.provenance && types.includes(edge.label ?? edge.predicate)))
        setShowTextbookSources(true);
    },
    books: (keys) => graphFilters.setProperties((current) => ({ ...current, books: keys })),
    perspective: setGraphPerspective,
    path: (source, target, path) => {
      setPathFinderOpen(true);
      setPathStartId(source);
      setPathEndId(target);
      setActivePathIndex(0);
      setHighlightedCanonicalIds(path?.nodeIds ?? []);
      setHighlightedCanonicalRelationIds(path?.edgeIds ?? []);
      setSelectedId(source);
      setInspectorOpen(true);
      setPanel("relations");
      if (
        path?.nodeIds.some((id) => canonicalEntityById.get(id)?.type === "教材") ||
        path?.edgeIds.some((id) => canonicalBook?.triples.find((edge) => edge.id === id)?.provenance)
      )
        setShowTextbookSources(true);
      setFocusSelectionToken((value) => value + 1);
    },
    expand: (ids, edges) => {
      setHighlightedCanonicalIds(ids);
      setHighlightedCanonicalRelationIds(edges);
      graphFilters.setFocusedEntityIds((current) => (current ? [...new Set([...current, ...ids])] : null));
    },
    highlightNodes: setHighlightedCanonicalIds,
    highlightEdges: setHighlightedCanonicalRelationIds,
  });
  const executeGraphActions = graphActions.execute;
  /** Show an assistant answer's entities and relations in the graph. */
  const focusAnswer = useCallback((result: AnswerResult) => {
    const ids = [...new Set([...result.graphFocus.nodeIds, ...result.relatedEntities.map((entity) => entity.id)])].slice(0, 500);
    const edges = [...new Set([...result.graphFocus.relationshipIds, ...result.relatedRelationships.map((edge) => edge.id)])].slice(0, 500);
    const actions: GraphAction[] = ids.length ? [{ type: "focus_entities", entityIds: ids, isolate: true }] : [];
    if (edges.length) actions.push({ type: "highlight_relationships", relationshipIds: edges });
    if (actions.length) executeGraphActions(actions);
  }, [executeGraphActions]);
  const openSchemaInstances = (types: SchemaCategoryKey[], relation?: string) => {
    const actions: GraphAction[] = [{ type: "filter_entity_types", entityTypes: [...new Set(types)] }];
    if (relation) actions.push({ type: "filter_relationship_types", relationshipTypes: [relation] });
    executeGraphActions(actions);
  };
  const ask = (question: string) => linksRef.current.ask(question);
  const openRecords = () => linksRef.current.openRecords();

  return {
    books,
    canonicalGraph,
    // state
    bookKey, setBookKey,
    selectedId, setSelectedId,
    graphMode, setGraphMode,
    inspectorOpen, setInspectorOpen,
    knowledgeDetailOpen, setKnowledgeDetailOpen,
    panel, setPanel,
    zoom, setZoom,
    showLabels, setShowLabels,
    expanded, setExpanded,
    motionEnabled, setMotionEnabled,
    dragPositions, setDragPositions,
    expandedNodeIds,
    hiddenNodeKeys,
    pinnedNodeKeys, setPinnedNodeKeys,
    contextMenu, setContextMenu,
    fullGraphView, setFullGraphView,
    fullGraphLayout, setFullGraphLayout,
    fullGraphRenderer, setFullGraphRenderer,
    graphPerspective,
    showTextbookSources, setShowTextbookSources,
    highlightedCanonicalIds, setHighlightedCanonicalIds,
    highlightedCanonicalRelationIds, setHighlightedCanonicalRelationIds,
    viewHistory,
    canvasPan, setCanvasPan,
    pathFinderOpen, setPathFinderOpen,
    pathStartId, setPathStartId,
    pathEndId, setPathEndId,
    setActivePathIndex,
    cameraResetToken, setCameraResetToken,
    focusSelectionToken, setFocusSelectionToken,
    graphFilters,
    graphPaths,
    safeActivePathIndex,
    graphActions,
    // derived
    datasetBookMap,
    currentBook,
    canonicalBook,
    inspectionBook,
    inspectionRuntime,
    selected,
    relationText,
    canonicalEntityById,
    canonicalEntityBySearchKey,
    // actions
    undoView,
    collapseExpansion,
    expandNode,
    hideNode,
    selectEntity,
    showNodeEvidence,
    selectSearchResult,
    locateCanonical,
    openLesson,
    openKnowledge,
    chooseBook,
    chooseFullGraph,
    openPathFinder,
    applyGraphPath,
    openResearchPair,
    openResearchEntity,
    togglePin,
    restoreNodePosition,
    resetExplorer,
    resetEverything,
    handlePerspective,
    focusAnswer,
    openSchemaInstances,
    ask,
    openRecords,
  };
}

export type GraphExplorerState = ReturnType<typeof useGraphExplorer>;
