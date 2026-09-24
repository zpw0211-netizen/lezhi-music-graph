"use client";

import {
  SigmaContainer,
  useRegisterEvents,
  useSetSettings,
  useSigma,
} from "@react-sigma/core";
import { MultiDirectedGraph } from "graphology";
import { EdgeArrowProgram, EdgeLineProgram } from "sigma/rendering";
import type { NodeHoverDrawingFunction } from "sigma/rendering";
import { NodeRingProgram, drawLabelBelow } from "../../lib/graph/node-ring-program";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CanvasPerformanceMetrics } from "../FullGraphCanvas";
import { schemaCategoryFor, schemaCategoryMeta } from "../../graph-schema";
import { SEMANTIC_PALETTE } from "../../semantic-palette";
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
};
let graphBuildSequence = 0;

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
const withAlpha = (hex: string, alpha: number) => {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((offset) =>
    Number.parseInt(value.slice(offset, offset + 2), 16),
  );
  return rgba(r, g, b, alpha);
};

function nodeSize(entity: GraphEntity) {
  const category = schemaCategoryMeta(entity.type);
  const categoryBase =
    category.key === "textbook"
      ? 8
      : category.key === "work"
        ? 5.6
        : ["person", "instrument", "genre", "culture"].includes(category.key)
          ? 4.2
          : 3.4;
  const importance = Math.max(0, Math.min(1, entity.visualImportance ?? 0));
  const degreeBoost = Math.min(3.2, Math.log2((entity.degree ?? 0) + 1) * 0.72);
  const coverageBoost = Math.min(2.1, ((entity.textbookCount ?? 1) - 1) * 0.42);
  return Math.min(12.5, categoryBase + importance * 3 + degreeBoost + coverageBoost);
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
  const setSettings = useSetSettings<NodeAttributes<E>, EdgeAttributes>();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
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
  // Hub concepts (旋律/节奏…) link to 100+ nodes across the whole map; their
  // long spokes stay in the faint layer so local communities read first.
  const structuralEdges = useMemo(() => new Set([...indexes.edgeMap.values()]
    .filter(edge => !edge.provenance && edge.objectId)
    .filter(edge => Math.max(indexes.entityMap.get(edge.subject)?.degree ?? 0, indexes.entityMap.get(edge.objectId ?? "")?.degree ?? 0) < 60)
    .sort((a, b) => {
      const score = (edge: GraphRelationship) => (edge.crossBook ? 20 : 0) + Math.log2((indexes.entityMap.get(edge.subject)?.degree ?? 0) + 1) + Math.log2((indexes.entityMap.get(edge.objectId ?? "")?.degree ?? 0) + 1);
      return score(b) - score(a) || a.id.localeCompare(b.id);
    }).slice(0, 440).map(edge => edge.id)), [indexes]);
  const labelIds = useMemo(() => {
    const { width, height } = sigma.getDimensions();
    const candidates = [...visibleNodeIds].filter(id => {
      if (!dataGraph.hasNode(id)) return false;
      if (id === selectedId || id === hoveredNode) return true;
      const p = sigma.graphToViewport(dataGraph.getNodeAttributes(id));
      return p.x > -30 && p.y > -30 && p.x < width + 30 && p.y < height + 30;
    });
    const score = (id: string) => id === selectedId ? 1e9 : id === hoveredNode ? 9e8 :
      (focus.depthByNode.get(id) === 1 ? 1e7 : 0) + (explicitNodes.has(id) ? 1e6 : 0) +
      (indexes.entityMap.get(id)?.visualImportance ?? 0) * 1e4 + (indexes.entityMap.get(id)?.textbookCount ?? 1) * 100 - (indexes.entityMap.get(id)?.visualRank ?? 1337);
    return new Set(candidates.sort((a, b) => score(b) - score(a)).slice(0, showLabels ? LABEL_BUDGETS[zoomTier] : Math.round(LABEL_BUDGETS[zoomTier] * .8)));
    // Camera movement changes the viewport without changing graph coordinates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataGraph, explicitNodes, focus, hoveredNode, indexes, selectedId, showLabels, sigma, visibleNodeIds, viewportTick, zoomTier]);

  // Keep the WebGL renderer/context alive when filters change. Replacing the
  // SigmaContainer graph prop kills its previous instance before child effects
  // receive the new context, so a selection update can target disposed programs.
  useEffect(() => {
    sigma.setGraph(dataGraph);
  }, [dataGraph, sigma]);

  useEffect(() => {
    setSettings({
      nodeReducer: (node, data) => {
        const depth = focus.depthByNode.get(node);
        const explicit = explicitNodes.size > 0;
        const dimmed = explicit
          ? !explicitNodes.has(node)
          : focus.depthByNode.size > 0 && depth == null;
        const selected = node === selectedId && !focusSuppressed;
        const hovered = node === hoveredNode;
        const overviewCore = data.visualRank <= [70, 200, 550, 1337][zoomTier] || (data.entity.textbookCount ?? 1) >= 3;
        const alpha = dimmed ? .05 : depth === 2 ? .3 : focus.depthByNode.size || overviewCore ? 1 : [.16, .28, .55, 1][zoomTier];
        return {
          ...data,
          hidden: !visibleNodeIds.has(node),
          color: alpha < 1 ? withAlpha(data.color, alpha) : data.color,
          size: data.size * (selected ? 1.38 : hovered ? 1.12 : !focus.depthByNode.size && !overviewCore ? .55 : .9),
          label:
            selected || hovered || (!dimmed && labelIds.has(node)) ? data.label : "",
          // Only the selection is forced; neighbours go through Sigma's label grid so they never overlap.
          forceLabel: selected || hovered || (labelIds.has(node) && explicitNodes.has(node) && explicitNodes.size <= 12),
          highlighted: selected,
          zIndex: selected ? 20 : depth === 1 ? 12 : depth === 2 ? 7 : 1,
        };
      },
      edgeReducer: (edge, data) => {
        const direct = focus.directEdges.has(edge);
        const secondary = focus.secondaryEdges.has(edge);
        const explicit = explicitEdges.size > 0;
        const highlighted = explicitEdges.has(edge);
        const dimmed = explicit
          ? !highlighted
          : focus.depthByNode.size > 0 && !direct && !secondary;
        const hovered = edge === hoveredEdge || hoverEdges.has(edge);
        const relationship = data.relationship;
        const label = relationLabels[relationship.predicate] ?? relationship.label ?? relationship.predicate;
        return {
          ...data,
          hidden: !visibleRelationshipIds.has(edge) || !visibleNodeIds.has(data.relationship.subject) || !visibleNodeIds.has(data.relationship.objectId ?? ""),
          color: highlighted ? withAlpha(RELATION_STYLES[relationFamily(relationship)].color, 1)
            : direct || hovered ? withAlpha(RELATION_STYLES[relationFamily(relationship)].color, RELATION_VISIBILITY.focus.direct)
            : dimmed ? rgba(129, 146, 163, RELATION_VISIBILITY.focus.unrelated)
            : secondary ? withAlpha(RELATION_STYLES[relationFamily(relationship)].color, RELATION_VISIBILITY.focus.secondary)
            : relationship.provenance ? rgba(138, 151, 164, RELATION_VISIBILITY.overview.provenance)
            : relationship.crossBook ? rgba(110, 130, 151, RELATION_VISIBILITY.overview.crossBook)
            : structuralEdges.has(edge) ? rgba(138, 151, 164, RELATION_VISIBILITY.overview.structural)
            : rgba(138, 151, 164, zoomTier >= 2 ? .1 : RELATION_VISIBILITY.overview.ordinary),
          size: highlighted ? 2.7 : direct || hovered ? 2.1 : secondary ? 1 : relationship.crossBook ? .85 : .6,
          label:
            edge === hoveredEdge || highlighted || (direct && labelIds.has(relationship.subject === selectedId ? relationship.objectId ?? "" : relationship.subject)) || (showLabels && zoomTier === 3 && secondary && labelIds.has(relationship.subject) && labelIds.has(relationship.objectId ?? ""))
              ? label
              : "",
          zIndex: direct || hovered ? 15 : secondary || highlighted ? 8 : 1,
        };
      },
    });
    sigma.refresh();
  }, [
    explicitEdges,
    explicitNodes,
    focus,
    focusSuppressed,
    hoveredEdge,
    hoveredNode,
    hoverEdges,
    labelIds,
    structuralEdges,
    zoomTier,
    relationLabels,
    selectedId,
    setSettings,
    showLabels,
    sigma,
    visibleNodeIds,
    visibleRelationshipIds,
  ]);

  useEffect(() => {
    if (!focusSelectionToken || !selectedId || !sigma.getGraph().hasNode(selectedId)) return;
    const display = sigma.getNodeDisplayData(selectedId);
    if (!display) return;
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
  }, [dataGraph, detailOpen, focusSelectionToken, indexes, selectedId, sigma]);

  useEffect(() => {
    const ratio = Math.max(0.08, Math.min(8, 0.64 / Math.max(0.01, zoom)));
    sigma.getCamera().animate({ ratio }, { duration: 180 });
  }, [sigma, zoom]);

  useEffect(() => {
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
    let cameraSyncTimer: ReturnType<typeof setTimeout> | undefined;
    const syncViewport = () => {
      setZoomTier(semanticZoomTier(sigma.getCamera().getState().ratio));
      clearTimeout(cameraSyncTimer);
      cameraSyncTimer = setTimeout(() => {
        const { width, height } = sigma.getDimensions();
        const a = sigma.viewportToGraph({ x: 0, y: 0 });
        const b = sigma.viewportToGraph({ x: width, y: height });
        onViewportChange({ minX: Math.min(a.x, b.x), minY: Math.min(a.y, b.y), maxX: Math.max(a.x, b.x), maxY: Math.max(a.y, b.y) });
        setViewportTick(value => value + 1);
      }, 60);
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
      enterNode: ({ node }) => setHoveredNode(node),
      leaveNode: () => setHoveredNode(null),
      enterEdge: ({ edge }) => setHoveredEdge(edge),
      leaveEdge: () => setHoveredEdge(null),
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
    for (const node of nodes) {
      const category = schemaCategoryFor(node.entity.type);
      value.addNode(node.entity.id, {
        x: node.x,
        y: node.y,
        size: nodeSize(node.entity),
        color: SEMANTIC_PALETTE[category].fill,
        label: node.entity.name,
        entity: node.entity,
        visualRank: node.entity.visualRank ?? Number.MAX_SAFE_INTEGER,
        category,
      });
    }
    for (const edge of relationships) {
      if (!edge.objectId || !value.hasNode(edge.subject) || !value.hasNode(edge.objectId)) continue;
      value.addDirectedEdgeWithKey(edge.id, edge.subject, edge.objectId, {
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
      labelRenderedSizeThreshold: 7,
      stagePadding: 52,
      zIndex: true,
      defaultDrawNodeHover: drawConstellationHalo,
      minCameraRatio: 0.08,
      maxCameraRatio: 8,
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
