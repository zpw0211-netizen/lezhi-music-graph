"use client";

import {
  SigmaContainer,
  useRegisterEvents,
  useSigma,
} from "@react-sigma/core";
import { MultiDirectedGraph } from "graphology";
import { EdgeArrowProgram, EdgeLineProgram } from "sigma/rendering";
import { animateNodes } from "sigma/utils";
import type { NodeHoverDrawingFunction } from "sigma/rendering";
import { NodeRingProgram, drawLabelBelow } from "../../lib/graph/node-ring-program";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CanvasPerformanceMetrics } from "../FullGraphCanvas";
import { schemaCategoryFor, schemaCategoryMeta } from "../../graph-schema";
import { LABEL_BUDGETS, RELATION_STYLES, RELATION_VISIBILITY, relationFamily, semanticZoomTier } from "../../lib/graph/constellation-style";
import {
  buildGraphIndexes,
  focusNeighborhood,
} from "../../lib/graph/graph-algorithms";
import type { GraphIndexes } from "../../lib/graph/graph-algorithms";
import type {
  GraphEntity,
  GraphPositionedNode,
  GraphRelationship,
} from "../../lib/graph/types";

export type SigmaGraphSceneProps<E extends GraphEntity = GraphEntity> = {
  nodes: GraphPositionedNode<E>[];
  relationships: GraphRelationship[];
  visibleNodeIds: Set<string>;
  visibleRelationshipIds: Set<string>;
  selectedId?: string | null;
  highlightedNodeIds: string[];
  highlightedRelationshipIds: string[];
  relationLabels: Record<string, string>;
  sceneKey: string;
  showLabels: boolean;
  zoom: number;
  cameraResetToken: number;
  focusSelectionToken: number;
  draggedPositions: Record<string, { x: number; y: number }>;
  pinnedNodeIds?: string[];
  detailOpen?: boolean;
  onSelect: (entity: E) => void;
  onExpand: (entity: E) => void;
  onContextMenu: (x: number, y: number, entity: E) => void;
  onNodePosition: (nodeKey: string, point: { x: number; y: number }) => void;
  onMetrics: (metrics: CanvasPerformanceMetrics) => void;
  onViewportChange: (bounds: { minX: number; minY: number; maxX: number; maxY: number }) => void;
  onClearFocus: () => void;
};

type NodeAttributes<E extends GraphEntity> = {
  x: number;
  y: number;
  size: number;
  color: string;
  label: string;
  entity: E;
  visualRank: number;
  category: string;
};

type EdgeAttributes = {
  size: number;
  color: string;
  label: string;
  type: "arrow" | "line";
  relationship: GraphRelationship;
  /** Worked out once when the graph is built: the reducers run over all 13,000 edges on every refresh. */
  family: ReturnType<typeof relationFamily>;
  /** Both ends sit in the same island of the layout. */
  island: boolean;
};
let graphBuildSequence = 0;

/** Everything the node and edge reducers read. Kept in a ref so the reducers are registered once. */
type ReducerState = {
  focus: ReturnType<typeof focusNeighborhood>;
  explicitNodes: Set<string>;
  explicitEdges: Set<string>;
  selectedId: string | null | undefined;
  focusSuppressed: boolean;
  hoveredNode: string | null;
  hoverNeighbors: Set<string>;
  hoverEdges: Set<string>;
  zoomTier: 0 | 1 | 2 | 3;
  shownNodeIds: Set<string>;
  labelIds: Set<string>;
  relationLabels: Record<string, string>;
  visibleRelationshipIds: Set<string>;
  showLabels: boolean;
  structuralEdges: Set<string>;
};

const sameSet = (a: Set<string>, b: Set<string>) => a === b || (a.size === b.size && [...a].every((id) => b.has(id)));
// The label set is rebuilt each time the camera rests; when its contents did not change, nothing on screen does.
const sameReducerState = (a: ReducerState, b: ReducerState) =>
  (Object.keys(a) as (keyof ReducerState)[]).every((key) => key === "labelIds" ? sameSet(a.labelIds, b.labelIds) : a[key] === b[key]);

const drawConstellationHalo: NodeHoverDrawingFunction = (context, data, settings) => {
  context.save();
  context.beginPath(); context.arc(data.x, data.y, data.size + 7, 0, Math.PI * 2);
  context.strokeStyle = data.highlighted ? "#16834F" : "#9FCFB5";
  context.lineWidth = data.highlighted ? 2 : 1.2; context.stroke();
  if (data.highlighted) {
    context.beginPath(); context.arc(data.x, data.y, data.size + 12, 0, Math.PI * 2);
    context.strokeStyle = "rgba(22, 131, 79, 0.25)"; context.lineWidth = 4; context.stroke();
  }
  context.restore();
  drawLabelBelow(context, data, settings);
};

// Sigma's WebGL programs use ONE / ONE_MINUS_SRC_ALPHA blending: color
// channels must be premultiplied or translucent edges remain bright white.
const rgba = (r: number, g: number, b: number, alpha: number) =>
  `rgba(${Math.round(r * alpha)}, ${Math.round(g * alpha)}, ${Math.round(b * alpha)}, ${alpha})`;
// Only a few dozen colour/alpha pairs occur, but the reducers ask for one per node and edge on each refresh.
const alphaColors = new Map<string, string>();
const withAlpha = (hex: string, alpha: number) => {
  const key = `${hex}/${alpha}`;
  let color = alphaColors.get(key);
  if (!color) {
    const value = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((offset) =>
      Number.parseInt(value.slice(offset, offset + 2), 16),
    );
    color = rgba(r, g, b, alpha);
    alphaColors.set(key, color);
  }
  return color;
};
const GREY_EDGE = "#8a97a4";
const DIM_EDGE = "#8192a3";
const CROSS_BOOK_EDGE = "#6e8297";

function reduceNode<E extends GraphEntity>(s: ReducerState, node: string, data: NodeAttributes<E>) {
  const depth = s.focus.depthByNode.get(node);
  const explicit = s.explicitNodes.size > 0;
  const dimmed = explicit
    ? !s.explicitNodes.has(node)
    : s.focus.depthByNode.size > 0 && depth == null;
  const selected = node === s.selectedId && !s.focusSuppressed;
  const hovered = node === s.hoveredNode;
  const hoverDimmed = s.hoveredNode !== null && !hovered && !s.hoverNeighbors.has(node) && !selected;
  const overviewCore = data.visualRank <= [70, 200, 550, 1337][s.zoomTier] || (data.entity.textbookCount ?? 1) >= 3;
  const alpha = dimmed ? .05 : hoverDimmed ? .12 : depth === 2 ? .3 : s.focus.depthByNode.size || overviewCore ? 1 : [.62, .74, .86, 1][s.zoomTier];
  return {
    ...data,
    hidden: !s.shownNodeIds.has(node),
    color: selected ? "#16834F" : alpha < 1 ? withAlpha(data.color, alpha) : data.color,
    size: data.size,
    label:
      selected || hovered || (!dimmed && (s.labelIds.has(node) || (depth === 1 && s.focus.depthByNode.size <= 40))) ? data.label : "",
    // Only the selection is forced; neighbours go through Sigma's label grid so they never overlap.
    // A small focused neighbourhood (the orbit) always shows its names.
    forceLabel: selected || hovered || s.labelIds.has(node) || (depth === 1 && !dimmed && s.focus.depthByNode.size <= 40),
    highlighted: selected,
    zIndex: selected ? 20 : depth === 1 ? 12 : depth === 2 ? 7 : 1,
  };
}

function reduceEdge(s: ReducerState, hoveredEdge: string | null, edge: string, data: EdgeAttributes) {
  const direct = s.focus.directEdges.has(edge);
  const secondary = s.focus.secondaryEdges.has(edge);
  const explicit = s.explicitEdges.size > 0;
  const highlighted = s.explicitEdges.has(edge);
  const dimmed = explicit
    ? !highlighted
    : s.focus.depthByNode.size > 0 && !direct && !secondary;
  const hovered = edge === hoveredEdge || s.hoverEdges.has(edge);
  const hoverDimmed = s.hoveredNode !== null && !hovered && !highlighted && !direct;
  const relationship = data.relationship;
  const familyColor = RELATION_STYLES[data.family].color;
  const label = s.relationLabels[relationship.predicate] ?? relationship.label ?? relationship.predicate;
  return {
    ...data,
    hidden: !s.visibleRelationshipIds.has(edge) || !s.shownNodeIds.has(relationship.subject) || !s.shownNodeIds.has(relationship.objectId ?? ""),
    color: highlighted ? withAlpha(familyColor, 1)
      : direct || hovered ? withAlpha(familyColor, RELATION_VISIBILITY.focus.direct)
      : hoverDimmed ? withAlpha(DIM_EDGE, .08)
      : dimmed ? withAlpha(DIM_EDGE, RELATION_VISIBILITY.focus.unrelated)
      : secondary ? withAlpha(familyColor, RELATION_VISIBILITY.focus.secondary)
      : relationship.provenance ? withAlpha(GREY_EDGE, RELATION_VISIBILITY.overview.provenance)
      : relationship.crossBook ? withAlpha(CROSS_BOOK_EDGE, RELATION_VISIBILITY.overview.crossBook)
      : data.island ? withAlpha(familyColor, s.zoomTier >= 2 ? .42 : .3)
      : s.structuralEdges.has(edge) ? withAlpha(GREY_EDGE, RELATION_VISIBILITY.overview.structural)
      : withAlpha(GREY_EDGE, s.zoomTier >= 2 ? .1 : RELATION_VISIBILITY.overview.ordinary),
    size: highlighted ? 2.7 : direct || hovered ? 2.1 : secondary ? 1 : relationship.crossBook ? .85 : .6,
    label:
      edge === hoveredEdge || highlighted || (direct && s.labelIds.has(relationship.subject === s.selectedId ? relationship.objectId ?? "" : relationship.subject)) || (s.showLabels && s.zoomTier === 3 && secondary && s.labelIds.has(relationship.subject) && s.labelIds.has(relationship.objectId ?? ""))
        ? label
        : "",
    zIndex: direct || hovered ? 15 : secondary || highlighted ? 8 : 1,
  };
}

function SigmaController<E extends GraphEntity>({
  dataGraph,
  indexes,
  visibleNodeIds,
  visibleRelationshipIds,
  selectedId,
  highlightedNodeIds,
  highlightedRelationshipIds,
  relationLabels,
  sceneKey,
  showLabels,
  zoom,
  cameraResetToken,
  focusSelectionToken,
  pinnedNodeIds,
  detailOpen,
  onSelect,
  onExpand,
  onContextMenu,
  onNodePosition,
  onMetrics,
  onViewportChange,
  onClearFocus,
}: Omit<SigmaGraphSceneProps<E>, "nodes" | "relationships" | "draggedPositions"> & {
  dataGraph: MultiDirectedGraph<NodeAttributes<E>, EdgeAttributes>;
  indexes: GraphIndexes<E>;
}) {
  const sigma = useSigma<NodeAttributes<E>, EdgeAttributes>();
  const registerEvents = useRegisterEvents<NodeAttributes<E>, EdgeAttributes>();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  // The hovered edge only changes that edge's own look, so it bypasses React and repaints just that edge.
  const hoveredEdgeRef = useRef<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reducerState = useRef<ReducerState | null>(null);
  /** The Sigma instance the reducers were registered on (a new instance needs them again). */
  const reducersOn = useRef<unknown>(null);
  const [zoomTier, setZoomTier] = useState<0 | 1 | 2 | 3>(0);
  const [viewportTick, setViewportTick] = useState(0);
  const [suppressedSelectionId, setSuppressedSelectionId] = useState<string | null>(null);
  const focusSuppressed = Boolean(selectedId && suppressedSelectionId === selectedId);
  const draggedNode = useRef<string | null>(null);
  const dragMoved = useRef(false);
  const suppressClickUntil = useRef(0);
  const renderCounter = useRef<{ frames: number; startedAt: number } | null>(null);
  const totalPaints = useRef(0);
  const focus = useMemo(
    () => focusNeighborhood(indexes, focusSuppressed ? null : selectedId, { nodes: visibleNodeIds, edges: visibleRelationshipIds }),
    [focusSuppressed, indexes, selectedId, visibleNodeIds, visibleRelationshipIds],
  );
  const explicitNodes = useMemo(
    () => new Set(highlightedNodeIds),
    [highlightedNodeIds],
  );
  const explicitEdges = useMemo(
    () => new Set(highlightedRelationshipIds),
    [highlightedRelationshipIds],
  );
  const hoverEdges = useMemo(() => new Set((indexes.adjacencyMap.get(hoveredNode ?? "") ?? []).map(item => item.edge.id)), [hoveredNode, indexes]);
  const hoverNeighbors = useMemo(() => new Set((indexes.adjacencyMap.get(hoveredNode ?? "") ?? []).map(item => item.neighborId)), [hoveredNode, indexes]);
  // Hub concepts (旋律/节奏…) link to 100+ nodes across the whole map; their
  // long spokes stay in the faint layer so local communities read first.
  const structuralEdges = useMemo(() => new Set([...indexes.edgeMap.values()]
    .filter(edge => !edge.provenance && edge.objectId)
    .filter(edge => Math.max(indexes.entityMap.get(edge.subject)?.degree ?? 0, indexes.entityMap.get(edge.objectId ?? "")?.degree ?? 0) < 60)
    .sort((a, b) => {
      const score = (edge: GraphRelationship) => (edge.crossBook ? 20 : 0) + Math.log2((indexes.entityMap.get(edge.subject)?.degree ?? 0) + 1) + Math.log2((indexes.entityMap.get(edge.objectId ?? "")?.degree ?? 0) + 1);
      return score(b) - score(a) || a.id.localeCompare(b.id);
    }).slice(0, 440).map(edge => edge.id)), [indexes]);
  // The layout groups tightly linked knowledge into islands, so every node can
  // stay on screen: the islands read as structure, not as a hairball.
  const shownNodeIds = useMemo(() => {
    const shown = new Set<string>();
    for (const id of visibleNodeIds) if (dataGraph.hasNode(id)) shown.add(id);
    return shown;
  }, [dataGraph, visibleNodeIds]);
  // Each island is named in the overview by its most important work or person
  // (never by a key or meter signature, which every island shares).
  const islandLeaders = useMemo(() => {
    const rank = (entity: GraphEntity) => {
      const category = schemaCategoryFor(entity.type);
      const tier = category === "work" ? 3 : category === "person" ? 2 : ["genre", "instrument", "culture"].includes(category) ? 1 : 0;
      return tier * 10 + (entity.visualImportance ?? 0);
    };
    const best = new Map<string, GraphEntity>();
    for (const entity of indexes.entityMap.values()) {
      const island = entity.community;
      if (!island || island === "core" || island === "isolated") continue;
      const current = best.get(island);
      if (!current || rank(entity) > rank(current)) best.set(island, entity);
    }
    return new Set([...best.values()].map(entity => entity.id));
  }, [indexes]);
  const labelIds = useMemo(() => {
    const { width, height } = sigma.getDimensions();
    const candidates = [...shownNodeIds].flatMap(id => {
      if (!dataGraph.hasNode(id)) return [];
      const p = sigma.graphToViewport(dataGraph.getNodeAttributes(id));
      return id === selectedId || id === hoveredNode ||
        (p.x > -30 && p.y > -30 && p.x < width + 30 && p.y < height + 30)
        ? [{ id, point: p }]
        : [];
    });
    const score = (id: string) => id === selectedId ? 1e9 : id === hoveredNode ? 9e8 :
      (focus.depthByNode.get(id) === 1 ? 1e7 : 0) + (explicitNodes.has(id) ? 1e6 : 0) + (zoomTier <= 1 && islandLeaders.has(id) ? 5e5 : 0) +
      (indexes.entityMap.get(id)?.visualImportance ?? 0) * 1e4 + (indexes.entityMap.get(id)?.textbookCount ?? 1) * 100 - (indexes.entityMap.get(id)?.visualRank ?? 1337);
    const budget = showLabels
      ? LABEL_BUDGETS[zoomTier]
      : Math.max(8, Math.round(LABEL_BUDGETS[zoomTier] * .3));
    const cellSize = zoomTier <= 1 ? 116 : 92;
    const chosen = new Set<string>();
    const occupiedCells = new Set<string>();
    candidates
      .sort((a, b) => score(b.id) - score(a.id))
      .forEach(({ id, point }) => {
        if (chosen.size >= budget) return;
        if (id === selectedId || id === hoveredNode) {
          chosen.add(id);
          return;
        }
        const cell = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;
        if (occupiedCells.has(cell)) return;
        occupiedCells.add(cell);
        chosen.add(id);
      });
    return chosen;
    // Camera movement changes the viewport without changing graph coordinates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataGraph, explicitNodes, focus, hoveredNode, indexes, islandLeaders, selectedId, showLabels, shownNodeIds, sigma, viewportTick, zoomTier]);

  // Selecting a knowledge point pulls every visible direct neighbour into an
  // orbit around it (and releases them when the focus clears), so relations read
  // at a glance. High-degree hubs use a wider second ring to keep nodes apart.
  const orbitOrigins = useRef<{ graph: unknown; points: Map<string, { x: number; y: number }> }>({ graph: null, points: new Map() });
  const cancelOrbit = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (orbitOrigins.current.graph !== dataGraph) orbitOrigins.current = { graph: dataGraph, points: new Map() };
    cancelOrbit.current?.();
    const previous = orbitOrigins.current.points;
    const center = selectedId && !focusSuppressed && dataGraph.hasNode(selectedId) && visibleNodeIds.has(selectedId) ? selectedId : null;
    const neighbours = center
      ? [...new Set((indexes.adjacencyMap.get(center) ?? []).map((item) => item.neighborId))].filter((id) => id !== center && dataGraph.hasNode(id) && visibleNodeIds.has(id))
      : [];
    const orbit = center != null && neighbours.length >= 1;
    const original = (id: string) => previous.get(id) ?? { x: dataGraph.getNodeAttribute(id, "x"), y: dataGraph.getNodeAttribute(id, "y") };
    const targets: Record<string, { x: number; y: number }> = {};
    const next = new Map<string, { x: number; y: number }>();
    for (const [id, point] of previous) {
      if (!dataGraph.hasNode(id)) continue;
      if (orbit && (neighbours.includes(id) || id === center)) next.set(id, point);
      else targets[id] = point;
    }
    if (orbit && center) {
      const c = original(center);
      if (previous.has(center)) targets[center] = c;
      const ordered = neighbours
        .map((id) => ({ id, point: original(id) }))
        .sort((a, b) => Math.atan2(a.point.y - c.y, a.point.x - c.x) - Math.atan2(b.point.y - c.y, b.point.x - c.x));
      const radius = 150 + 40 * Math.pow(ordered.length, 0.6);
      ordered.forEach(({ id, point }, index) => {
        if (!next.has(id)) next.set(id, point);
        const angle = (index / ordered.length) * Math.PI * 2 + Math.atan2(ordered[0].point.y - c.y, ordered[0].point.x - c.x);
        const ring = ordered.length > 18 && index % 2 ? 1.32 : 1;
        targets[id] = { x: c.x + Math.cos(angle) * radius * ring, y: c.y + Math.sin(angle) * radius * ring };
      });
    }
    orbitOrigins.current.points = next;
    if (!Object.keys(targets).length) return;
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    cancelOrbit.current = animateNodes(dataGraph, targets, { duration: reduced ? 1 : 620, easing: "cubicInOut" }, () => {
      if (!orbit || !center) return;
      // Frame the finished orbit.
      const display = sigma.getNodeDisplayData(center);
      if (!display) return;
      const reach = neighbours.reduce((max, id) => {
        const point = sigma.getNodeDisplayData(id);
        return point ? Math.max(max, Math.hypot(point.x - display.x, point.y - display.y)) : max;
      }, 0);
      sigma.getCamera().animate({ x: display.x, y: display.y, ratio: Math.max(0.14, Math.min(0.9, reach * 2.6)) }, { duration: 280 });
    });
  }, [dataGraph, focusSuppressed, indexes, selectedId, sigma, visibleNodeIds]);
  useEffect(() => () => cancelOrbit.current?.(), []);

  // Keep the WebGL renderer/context alive when filters change. Replacing the
  // SigmaContainer graph prop kills its previous instance before child effects
  // receive the new context, so a selection update can target disposed programs.
  useEffect(() => {
    hoveredEdgeRef.current = null;
    sigma.setGraph(dataGraph);
  }, [dataGraph, sigma]);

  // Every refresh runs the reducers over all ~2,600 nodes and ~13,000 edges. Registering them through
  // useSetSettings costs one such pass per key, plus the explicit refresh: three passes per hover.
  // The reducers are registered once and read the latest state from a ref; a change costs one pass,
  // and a camera rest that leaves the labels as they were costs none.
  useEffect(() => {
    const next: ReducerState = {
      focus, explicitNodes, explicitEdges, selectedId, focusSuppressed, hoveredNode, hoverNeighbors, hoverEdges,
      zoomTier, shownNodeIds, labelIds, relationLabels, visibleRelationshipIds, showLabels, structuralEdges,
    };
    const previous = reducerState.current;
    const registered = reducersOn.current === sigma;
    if (registered && previous && sameReducerState(previous, next)) return;
    reducerState.current = next;
    if (registered) {
      sigma.refresh();
      return;
    }
    reducersOn.current = sigma;
    sigma.setSettings({
      nodeReducer: (node, data) => reduceNode(reducerState.current ?? next, node, data),
      edgeReducer: (edge, data) => reduceEdge(reducerState.current ?? next, hoveredEdgeRef.current, edge, data),
    });
  }, [
    explicitEdges,
    explicitNodes,
    focus,
    focusSuppressed,
    hoveredNode,
    hoverEdges,
    hoverNeighbors,
    labelIds,
    structuralEdges,
    zoomTier,
    relationLabels,
    selectedId,
    showLabels,
    sigma,
    shownNodeIds,
    visibleRelationshipIds,
  ]);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  useEffect(() => {
    if (!focusSelectionToken || !selectedId || !sigma.getGraph().hasNode(selectedId)) return;
    const frameSelection = () => {
      const display = sigma.getNodeDisplayData(selectedId);
      if (!display) return false;
      // Frame the selection with all of its visible 1-hop neighbours: works sit
      // at the rim while their shared concepts sit near the core, so a fixed
      // close-up would leave most related nodes off-screen.
      const reach = (indexes.adjacencyMap.get(selectedId) ?? []).reduce((max, item) => {
        const neighbour = sigma.getNodeDisplayData(item.neighborId);
        return neighbour && !neighbour.hidden ? Math.max(max, Math.hypot(neighbour.x - display.x, neighbour.y - display.y)) : max;
      }, 0);
      sigma.getCamera().animate(
        { x: display.x, y: display.y, ratio: Math.max(0.22, Math.min(0.9, reach * 2.4)) },
        { duration: 320 },
      );
      return true;
    };
    if (frameSelection()) return;
    // Right after mounting, node positions exist only once the first frame is drawn.
    const onRender = () => {
      if (frameSelection()) sigma.off("afterRender", onRender);
    };
    sigma.on("afterRender", onRender);
    return () => {
      sigma.off("afterRender", onRender);
    };
  }, [dataGraph, detailOpen, focusSelectionToken, indexes, selectedId, sigma]);

  // Zoom and reset only react to changes: on mount they would otherwise run
  // after the selection focus above and pull the camera back to the whole map.
  const appliedZoom = useRef(zoom);
  useEffect(() => {
    if (appliedZoom.current === zoom) return;
    appliedZoom.current = zoom;
    const ratio = Math.max(0.08, Math.min(8, 0.64 / Math.max(0.01, zoom)));
    sigma.getCamera().animate({ ratio }, { duration: 180 });
  }, [sigma, zoom]);

  const appliedResetToken = useRef(cameraResetToken);
  useEffect(() => {
    if (appliedResetToken.current === cameraResetToken) return;
    appliedResetToken.current = cameraResetToken;
    sigma.getCamera().animate(
      { x: 0.5, y: 0.5, ratio: 1, angle: 0 },
      { duration: 220 },
    );
  }, [cameraResetToken, sigma]);

  useEffect(() => {
    if (highlightedNodeIds.length < 2) return;
    const points = highlightedNodeIds
      .map((id) => sigma.getNodeDisplayData(id))
      .filter((point): point is NonNullable<typeof point> => Boolean(point && !point.hidden));
    if (points.length < 2) return;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    sigma.getCamera().animate(
      {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        ratio: Math.max(0.12, Math.min(1.35, Math.max(maxX - minX, maxY - minY) * 1.65)),
      },
      { duration: 260 },
    );
  }, [highlightedNodeIds, sigma]);

  useEffect(() => {
    const finishDrag = () => {
      const node = draggedNode.current;
      if (node && dragMoved.current) {
        suppressClickUntil.current = performance.now() + 220;
        const graph = sigma.getGraph();
        const host = sigma.getContainer().parentElement;
        if (host) host.dataset.lastDraggedNode = node;
        onNodePosition(`${sceneKey}-${node}`, {
          x: graph.getNodeAttribute(node, "x"),
          y: graph.getNodeAttribute(node, "y"),
        });
      }
      if (node) sigma.getCamera().enable();
      draggedNode.current = null;
      dragMoved.current = false;
    };
    const queueNodeHover = (node: string | null) => {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => {
        if (node && sigma.getMouseCaptor().isMouseDown) return;
        setHoveredNode(node);
      }, node ? 90 : 60);
    };
    const setEdgeHover = (edge: string | null) => {
      const previous = hoveredEdgeRef.current;
      if (previous === edge) return;
      hoveredEdgeRef.current = edge;
      const graph = sigma.getGraph();
      const edges = [previous, edge].filter((id): id is string => !!id && graph.hasEdge(id));
      if (!edges.length) return;
      try {
        // Scheduled: a fast pointer crosses several edges per frame, and each would otherwise draw the whole frame.
        sigma.refresh({ partialGraph: { edges }, skipIndexation: true, schedule: true });
      } catch {
        // An edge hidden by a filter since it was hovered has no slot to repaint in: redraw everything.
        sigma.refresh();
      }
    };
    let cameraSyncTimer: ReturnType<typeof setTimeout> | undefined;
    // While the wheel or a drag is still moving the camera, do nothing but let Sigma draw.
    // The label tier (which re-runs the reducers over every node and edge) and the minimap
    // catch up once the camera has rested, so no full refresh lands in the middle of a zoom.
    const syncViewport = () => {
      clearTimeout(cameraSyncTimer);
      cameraSyncTimer = setTimeout(() => {
        setZoomTier(semanticZoomTier(sigma.getCamera().getState().ratio));
        const { width, height } = sigma.getDimensions();
        const a = sigma.viewportToGraph({ x: 0, y: 0 });
        const b = sigma.viewportToGraph({ x: width, y: height });
        onViewportChange({ minX: Math.min(a.x, b.x), minY: Math.min(a.y, b.y), maxX: Math.max(a.x, b.x), maxY: Math.max(a.y, b.y) });
        setViewportTick(value => value + 1);
      }, 140);
    };
    registerEvents({
      updated: syncViewport,
      resize: () => {
        syncViewport();
        if (selectedId && !draggedNode.current) {
          const point = sigma.getNodeDisplayData(selectedId);
          if (point) sigma.getCamera().animate({ x: point.x, y: point.y }, { duration: 220 });
        }
      },
      clickNode: ({ node }) => {
        if (performance.now() < suppressClickUntil.current) return;
        setSuppressedSelectionId(null);
        onSelect(sigma.getGraph().getNodeAttribute(node, "entity"));
      },
      doubleClickNode: ({ node, preventSigmaDefault }) => {
        preventSigmaDefault();
        onExpand(sigma.getGraph().getNodeAttribute(node, "entity"));
      },
      rightClickNode: ({ node, event, preventSigmaDefault }) => {
        preventSigmaDefault();
        onContextMenu(
          event.x,
          event.y,
          sigma.getGraph().getNodeAttribute(node, "entity"),
        );
      },
      clickStage: () => { if (performance.now() < suppressClickUntil.current) return; setSuppressedSelectionId(selectedId ?? null); onClearFocus(); },
      // Hovering a node dims the rest of the map, which repaints everything. Sigma draws the hover ring at
      // once; the dimming waits until the pointer rests, so sweeping across the map or dragging it does
      // not repaint the whole graph for every node passed on the way.
      enterNode: ({ node }) => queueNodeHover(node),
      leaveNode: () => queueNodeHover(null),
      enterEdge: ({ edge }) => setEdgeHover(edge),
      leaveEdge: () => setEdgeHover(null),
      downNode: ({ node, preventSigmaDefault }) => {
        // Freeze normalization during drag so moving an outer node cannot shift the mental map.
        if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
        draggedNode.current = node;
        dragMoved.current = false;
        sigma.getCamera().disable();
        preventSigmaDefault();
      },
      moveBody: ({ event, preventSigmaDefault }) => {
        const node = draggedNode.current;
        if (!node) return;
        dragMoved.current = true;
        const rect = sigma.getContainer().getBoundingClientRect();
        const original = event.original;
        const point = "clientX" in original ? { x: original.clientX - rect.left, y: original.clientY - rect.top } : { x: event.x, y: event.y };
        const position = sigma.viewportToGraph(point);
        sigma.getGraph().mergeNodeAttributes(node, position);
        preventSigmaDefault();
        event.original.preventDefault();
        event.original.stopPropagation();
        // Graphology's nodeAttributesUpdated already schedules Sigma's render.
        // A second synchronous full refresh here doubles the drag work.
      },
      upNode: finishDrag,
      upStage: finishDrag,
      afterRender: () => {
        totalPaints.current += 1;
        const host = sigma.getContainer().parentElement;
        if (host) host.dataset.renderCount = String(totalPaints.current);
        if (host) {
          host.dataset.zoomTier = String(semanticZoomTier(sigma.getCamera().getState().ratio));
          host.dataset.cameraRatio = String(sigma.getCamera().getState().ratio);
          host.dataset.labelCount = String([...sigma.getNodeDisplayedLabels()].filter(id => sigma.getNodeDisplayData(id)?.label).length);
          host.dataset.selectedId = selectedId ?? "";
          if (selectedId && sigma.getGraph().hasNode(selectedId)) {
            const point = sigma.getGraph().getNodeAttributes(selectedId);
            host.dataset.selectedPosition = JSON.stringify({ x: point.x, y: point.y });
            host.dataset.selectedViewport = JSON.stringify(sigma.graphToViewport(point));
          }
          host.dataset.pinnedCount = String(pinnedNodeIds?.length ?? 0);
          host.dataset.orbitCount = String(orbitOrigins.current.points.size);
          host.dataset.edgeLabelCount = String([...sigma.getEdgeDisplayedLabels()].filter(id => sigma.getEdgeDisplayData(id)?.label).length);
          host.dataset.labelBudget = String(LABEL_BUDGETS[semanticZoomTier(sigma.getCamera().getState().ratio)]);
        }
        const now = performance.now();
        if (!renderCounter.current) {
          renderCounter.current = { frames: 1, startedAt: now };
          return;
        }
        renderCounter.current.frames += 1;
        const elapsed = now - renderCounter.current.startedAt;
        if (elapsed < 1000) return;
        onMetrics({
          fps: Math.round((renderCounter.current.frames * 1000) / elapsed),
          visibleNodes: visibleNodeIds.size,
          visibleEdges: visibleRelationshipIds.size,
          renderedLabels: document.querySelectorAll(".sigma-labels canvas").length,
          renderer: "Sigma WebGL",
          domElementCount: sigma.getContainer().querySelectorAll("*").length,
          renderMode: "on-demand",
          memoryMb: (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
            ? Math.round(((performance as Performance & { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / 1024 / 1024) * 10) / 10
            : undefined,
        });
        renderCounter.current = { frames: 0, startedAt: now };
      },
    });
    window.addEventListener("mouseup", finishDrag);
    window.addEventListener("blur", finishDrag);
    syncViewport();
    return () => { clearTimeout(cameraSyncTimer); window.removeEventListener("mouseup", finishDrag); window.removeEventListener("blur", finishDrag); if (draggedNode.current) sigma.getCamera().enable(); };
  }, [onClearFocus, onContextMenu, onExpand, onMetrics, onNodePosition, onSelect, onViewportChange, pinnedNodeIds, registerEvents, sceneKey, selectedId, sigma, visibleNodeIds, visibleRelationshipIds]);

  return null;
}

function SigmaGraphSceneInner<E extends GraphEntity>({
  nodes,
  relationships,
  visibleNodeIds,
  visibleRelationshipIds,
  selectedId,
  highlightedNodeIds,
  highlightedRelationshipIds,
  relationLabels,
  sceneKey,
  showLabels,
  zoom,
  cameraResetToken,
  focusSelectionToken,
  draggedPositions,
  pinnedNodeIds,
  detailOpen,
  onSelect,
  onExpand,
  onContextMenu,
  onNodePosition,
  onMetrics,
  onViewportChange,
  onClearFocus,
}: SigmaGraphSceneProps<E>) {
  const indexes = useMemo(
    () => buildGraphIndexes(nodes.map((node) => node.entity), relationships),
    [nodes, relationships],
  );
  const graph = useMemo(() => {
    const value = new MultiDirectedGraph<NodeAttributes<E>, EdgeAttributes>();
    const communityOf = new Map(nodes.map((node) => [node.entity.id, node.entity.community]));
    for (const node of nodes) {
      const category = schemaCategoryFor(node.entity.type);
      value.addNode(node.entity.id, {
        x: node.x,
        y: node.y,
        // A stable size keeps the overview readable; type and importance are
        // encoded through color, labels and focus styling instead.
        size: 5.2,
        color: schemaCategoryMeta(node.entity.type).color,
        label: node.entity.name,
        entity: node.entity,
        visualRank: node.entity.visualRank ?? Number.MAX_SAFE_INTEGER,
        category,
      });
    }
    for (const edge of relationships) {
      if (!edge.objectId || !value.hasNode(edge.subject) || !value.hasNode(edge.objectId)) continue;
      const island = communityOf.get(edge.subject);
      value.addDirectedEdgeWithKey(edge.id, edge.subject, edge.objectId, {
        family: relationFamily(edge),
        island: !!island && island !== "core" && island === communityOf.get(edge.objectId),
        size: edge.crossBook ? 1.2 : 0.75,
        color: edge.provenance ? rgba(126, 139, 151, .14) : rgba(138, 151, 164, .2),
        label: edge.label ?? edge.predicate,
        type: edge.provenance ? "line" : "arrow",
        relationship: edge,
      });
    }
    value.setAttribute("buildId", ++graphBuildSequence);
    return value;
  }, [nodes, relationships]);
  useEffect(() => {
    for (const node of nodes) {
      const point = draggedPositions[`${sceneKey}-${node.entity.id}`] ?? node;
      if (graph.getNodeAttribute(node.entity.id, "x") !== point.x || graph.getNodeAttribute(node.entity.id, "y") !== point.y)
        graph.mergeNodeAttributes(node.entity.id, { x: point.x, y: point.y });
    }
  }, [draggedPositions, graph, nodes, sceneKey]);
  const initialGraph = useMemo(
    () => new MultiDirectedGraph<NodeAttributes<E>, EdgeAttributes>(),
    [],
  );
  const settings = useMemo(
    () => ({
      allowInvalidContainer: true,
      defaultNodeType: "circle",
      nodeProgramClasses: { circle: NodeRingProgram },
      defaultDrawNodeLabel: drawLabelBelow,
      defaultEdgeType: "arrow",
      edgeProgramClasses: { arrow: EdgeArrowProgram, line: EdgeLineProgram },
      enableEdgeEvents: true,
      renderEdgeLabels: true,
      hideLabelsOnMove: false,
      hideEdgesOnMove: false,
      labelFont: '"Microsoft YaHei", "PingFang SC", sans-serif',
      labelSize: 12,
      labelWeight: "600",
      labelColor: { color: "#1b2420" },
      edgeLabelFont: '"Microsoft YaHei", "PingFang SC", sans-serif',
      edgeLabelSize: 11,
      edgeLabelColor: { color: "#5e6a64" },
      labelDensity: 0.86,
      labelGridCellSize: 116,
      // The all-node uniform size is intentionally compact; keep labels for
      // the graph's selected landmark nodes visible at overview scale too.
      labelRenderedSizeThreshold: 3.5,
      stagePadding: 52,
      zIndex: true,
      defaultDrawNodeHover: drawConstellationHalo,
      minCameraRatio: 0.08,
      maxCameraRatio: 8,
      // Snappier wheel zoom (Sigma's default animates each notch for 250ms).
      zoomDuration: 140,
    }),
    [],
  );
  return (
    <div className="sigma-scene-host" data-graph-build-id={graph.getAttribute("buildId")} data-full-nodes={graph.order} data-full-edges={graph.size} data-visible-nodes={visibleNodeIds.size} data-visible-edges={visibleRelationshipIds.size}>
    <SigmaContainer
      graph={initialGraph}
      className="sigma-graph-scene"
      settings={settings}
    >
      <SigmaController
        dataGraph={graph}
        indexes={indexes}
        visibleNodeIds={visibleNodeIds}
        visibleRelationshipIds={visibleRelationshipIds}
        selectedId={selectedId}
        highlightedNodeIds={highlightedNodeIds}
        highlightedRelationshipIds={highlightedRelationshipIds}
        relationLabels={relationLabels}
        sceneKey={sceneKey}
        showLabels={showLabels}
        zoom={zoom}
        cameraResetToken={cameraResetToken}
        focusSelectionToken={focusSelectionToken}
        pinnedNodeIds={pinnedNodeIds}
        detailOpen={detailOpen}
        onSelect={onSelect}
        onExpand={onExpand}
        onContextMenu={onContextMenu}
        onNodePosition={onNodePosition}
        onMetrics={onMetrics}
        onViewportChange={onViewportChange}
        onClearFocus={onClearFocus}
      />
    </SigmaContainer>
    </div>
  );
}

export const SigmaGraphScene = memo(SigmaGraphSceneInner) as typeof SigmaGraphSceneInner;
