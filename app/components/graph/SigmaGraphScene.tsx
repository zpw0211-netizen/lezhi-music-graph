"use client";

import {
  SigmaContainer,
  useRegisterEvents,
  useSetSettings,
  useSigma,
} from "@react-sigma/core";
import { MultiDirectedGraph } from "graphology";
import { EdgeArrowProgram, EdgeLineProgram } from "sigma/rendering";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CanvasPerformanceMetrics } from "../FullGraphCanvas";
import { schemaCategoryFor, schemaCategoryMeta } from "../../graph-schema";
import { SEMANTIC_PALETTE } from "../../semantic-palette";
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
      ? 9.5
      : category.key === "work"
        ? 7.2
        : ["person", "instrument", "genre", "culture"].includes(category.key)
          ? 5.7
          : 4.4;
  const importance = Math.max(0, Math.min(1, entity.visualImportance ?? 0));
  const degreeBoost = Math.min(3.2, Math.log2((entity.degree ?? 0) + 1) * 0.72);
  const coverageBoost = Math.min(2.1, ((entity.textbookCount ?? 1) - 1) * 0.42);
  return Math.min(14.5, categoryBase + importance * 3.4 + degreeBoost + coverageBoost);
}

function SigmaController<E extends GraphEntity>({
  dataGraph,
  indexes,
  selectedId,
  highlightedNodeIds,
  highlightedRelationshipIds,
  relationLabels,
  sceneKey,
  showLabels,
  zoom,
  cameraResetToken,
  focusSelectionToken,
  onSelect,
  onExpand,
  onContextMenu,
  onNodePosition,
  onMetrics,
  onViewportChange,
  onClearFocus,
}: Omit<SigmaGraphSceneProps<E>, "nodes" | "relationships" | "visibleNodeIds" | "draggedPositions"> & {
  dataGraph: MultiDirectedGraph<NodeAttributes<E>, EdgeAttributes>;
  indexes: GraphIndexes<E>;
}) {
  const sigma = useSigma<NodeAttributes<E>, EdgeAttributes>();
  const registerEvents = useRegisterEvents<NodeAttributes<E>, EdgeAttributes>();
  const setSettings = useSetSettings<NodeAttributes<E>, EdgeAttributes>();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [suppressedSelectionId, setSuppressedSelectionId] = useState<string | null>(null);
  const focusSuppressed = Boolean(selectedId && suppressedSelectionId === selectedId);
  const draggedNode = useRef<string | null>(null);
  const dragMoved = useRef(false);
  const renderCounter = useRef<{ frames: number; startedAt: number } | null>(null);
  const focus = useMemo(
    () => focusNeighborhood(indexes, focusSuppressed ? null : selectedId),
    [focusSuppressed, indexes, selectedId],
  );
  const explicitNodes = useMemo(
    () => new Set(highlightedNodeIds),
    [highlightedNodeIds],
  );
  const explicitEdges = useMemo(
    () => new Set(highlightedRelationshipIds),
    [highlightedRelationshipIds],
  );

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
        const rankLimit = showLabels ? 280 : 38;
        return {
          ...data,
          color: dimmed ? withAlpha(data.color, 0.08) : depth === 2 ? withAlpha(data.color, 0.62) : data.color,
          size: data.size * (selected ? 1.38 : hovered ? 1.12 : 1),
          label:
            selected || hovered || (!dimmed && data.visualRank <= rankLimit) ? data.label : "",
          forceLabel: selected || hovered,
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
        const hovered = edge === hoveredEdge;
        const relationship = data.relationship;
        const label = relationLabels[relationship.predicate] ?? relationship.label ?? relationship.predicate;
        return {
          ...data,
          color: dimmed
            ? rgba(129, 146, 163, .035)
            : direct || hovered || highlighted
              ? rgba(102, 214, 181, .96)
              : secondary
                ? rgba(116, 151, 179, .52)
                : relationship.crossBook
                  ? rgba(98, 146, 193, .52)
                  : relationship.provenance
                    ? rgba(126, 139, 151, .14)
                    : rgba(138, 151, 164, .2),
          size: direct || hovered || highlighted ? 2.6 : secondary ? 1.45 : relationship.crossBook ? 1.3 : 0.78,
          label:
            hovered || direct || (showLabels && (direct || secondary || highlighted))
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
    relationLabels,
    selectedId,
    setSettings,
    showLabels,
    sigma,
  ]);

  useEffect(() => {
    if (!focusSelectionToken || !selectedId || !sigma.getGraph().hasNode(selectedId)) return;
    const display = sigma.getNodeDisplayData(selectedId);
    if (display)
      sigma.getCamera().animate(
        { x: display.x, y: display.y, ratio: Math.min(0.72, sigma.getCamera().getState().ratio) },
        { duration: 220 },
      );
  }, [dataGraph, focusSelectionToken, selectedId, sigma]);

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
      .filter((point): point is NonNullable<typeof point> => Boolean(point));
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
        const graph = sigma.getGraph();
        onNodePosition(`${sceneKey}-${node}`, {
          x: graph.getNodeAttribute(node, "x"),
          y: graph.getNodeAttribute(node, "y"),
        });
      }
      draggedNode.current = null;
      dragMoved.current = false;
    };
    let cameraSyncTimer: ReturnType<typeof setTimeout> | undefined;
    const syncViewport = () => {
      clearTimeout(cameraSyncTimer);
      cameraSyncTimer = setTimeout(() => {
        const { width, height } = sigma.getDimensions();
        const a = sigma.viewportToGraph({ x: 0, y: 0 });
        const b = sigma.viewportToGraph({ x: width, y: height });
        onViewportChange({ minX: Math.min(a.x, b.x), minY: Math.min(a.y, b.y), maxX: Math.max(a.x, b.x), maxY: Math.max(a.y, b.y) });
      }, 60);
    };
    registerEvents({
      updated: syncViewport,
      resize: syncViewport,
      clickNode: ({ node }) => {
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
      clickStage: () => { setSuppressedSelectionId(selectedId ?? null); onClearFocus(); },
      enterNode: ({ node }) => setHoveredNode(node),
      leaveNode: () => setHoveredNode(null),
      enterEdge: ({ edge }) => setHoveredEdge(edge),
      leaveEdge: () => setHoveredEdge(null),
      downNode: ({ node, preventSigmaDefault }) => {
        draggedNode.current = node;
        dragMoved.current = false;
        preventSigmaDefault();
      },
      moveBody: ({ event, preventSigmaDefault }) => {
        const node = draggedNode.current;
        if (!node) return;
        dragMoved.current = true;
        const position = sigma.viewportToGraph({ x: event.x, y: event.y });
        sigma.getGraph().mergeNodeAttributes(node, position);
        preventSigmaDefault();
        event.original.preventDefault();
        event.original.stopPropagation();
        sigma.refresh({ skipIndexation: true });
      },
      upNode: finishDrag,
      upStage: finishDrag,
      afterRender: () => {
        const now = performance.now();
        if (!renderCounter.current) {
          renderCounter.current = { frames: 1, startedAt: now };
          return;
        }
        renderCounter.current.frames += 1;
        const elapsed = now - renderCounter.current.startedAt;
        if (elapsed < 1000) return;
        const graph = sigma.getGraph();
        onMetrics({
          fps: Math.round((renderCounter.current.frames * 1000) / elapsed),
          visibleNodes: graph.order,
          visibleEdges: graph.size,
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
    syncViewport();
    return () => clearTimeout(cameraSyncTimer);
  }, [onClearFocus, onContextMenu, onExpand, onMetrics, onNodePosition, onSelect, onViewportChange, registerEvents, sceneKey, selectedId, sigma]);

  return null;
}

function SigmaGraphSceneInner<E extends GraphEntity>({
  nodes,
  relationships,
  visibleNodeIds,
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
  onSelect,
  onExpand,
  onContextMenu,
  onNodePosition,
  onMetrics,
  onViewportChange,
  onClearFocus,
}: SigmaGraphSceneProps<E>) {
  const visibleNodes = useMemo(
    () => nodes.filter((node) => visibleNodeIds.has(node.entity.id)),
    [nodes, visibleNodeIds],
  );
  const visibleRelationships = useMemo(
    () =>
      relationships.filter(
        (edge) =>
          edge.objectId &&
          visibleNodeIds.has(edge.subject) &&
          visibleNodeIds.has(edge.objectId),
      ),
    [relationships, visibleNodeIds],
  );
  const indexes = useMemo(
    () => buildGraphIndexes(visibleNodes.map((node) => node.entity), visibleRelationships),
    [visibleNodes, visibleRelationships],
  );
  const graph = useMemo(() => {
    const value = new MultiDirectedGraph<NodeAttributes<E>, EdgeAttributes>();
    for (const node of visibleNodes) {
      const key = `${sceneKey}-${node.entity.id}`;
      const fixed = draggedPositions[key];
      const category = schemaCategoryFor(node.entity.type);
      value.addNode(node.entity.id, {
        x: fixed?.x ?? node.x,
        y: fixed?.y ?? node.y,
        size: nodeSize(node.entity),
        color: SEMANTIC_PALETTE[category].fill,
        label: node.entity.name,
        entity: node.entity,
        visualRank: node.entity.visualRank ?? Number.MAX_SAFE_INTEGER,
        category,
      });
    }
    for (const edge of visibleRelationships) {
      if (!edge.objectId || !value.hasNode(edge.subject) || !value.hasNode(edge.objectId)) continue;
      value.addDirectedEdgeWithKey(edge.id, edge.subject, edge.objectId, {
        size: edge.crossBook ? 1.2 : 0.75,
        color: edge.provenance ? rgba(126, 139, 151, .14) : rgba(138, 151, 164, .2),
        label: relationLabels[edge.predicate] ?? edge.label ?? edge.predicate,
        type: edge.provenance ? "line" : "arrow",
        relationship: edge,
      });
    }
    return value;
  }, [draggedPositions, relationLabels, sceneKey, visibleNodes, visibleRelationships]);
  const initialGraph = useMemo(
    () => new MultiDirectedGraph<NodeAttributes<E>, EdgeAttributes>(),
    [],
  );
  const settings = useMemo(
    () => ({
      allowInvalidContainer: true,
      defaultNodeType: "circle",
      defaultEdgeType: "arrow",
      edgeProgramClasses: { arrow: EdgeArrowProgram, line: EdgeLineProgram },
      enableEdgeEvents: true,
      renderEdgeLabels: true,
      hideLabelsOnMove: true,
      hideEdgesOnMove: false,
      labelFont: '"Microsoft YaHei", "PingFang SC", sans-serif',
      labelSize: 13,
      labelWeight: "600",
      labelColor: { color: "#18181b" },
      edgeLabelFont: '"Microsoft YaHei", "PingFang SC", sans-serif',
      edgeLabelSize: 11,
      edgeLabelColor: { color: "#71717a" },
      labelDensity: 0.86,
      labelGridCellSize: 116,
      labelRenderedSizeThreshold: 7,
      stagePadding: 52,
      zIndex: true,
      minCameraRatio: 0.08,
      maxCameraRatio: 8,
    }),
    [],
  );
  return (
    <SigmaContainer
      graph={initialGraph}
      className="sigma-graph-scene"
      settings={settings}
    >
      <SigmaController
        dataGraph={graph}
        indexes={indexes}
        selectedId={selectedId}
        highlightedNodeIds={highlightedNodeIds}
        highlightedRelationshipIds={highlightedRelationshipIds}
        relationLabels={relationLabels}
        sceneKey={sceneKey}
        showLabels={showLabels}
        zoom={zoom}
        cameraResetToken={cameraResetToken}
        focusSelectionToken={focusSelectionToken}
        onSelect={onSelect}
        onExpand={onExpand}
        onContextMenu={onContextMenu}
        onNodePosition={onNodePosition}
        onMetrics={onMetrics}
        onViewportChange={onViewportChange}
        onClearFocus={onClearFocus}
      />
    </SigmaContainer>
  );
}

export const SigmaGraphScene = memo(SigmaGraphSceneInner) as typeof SigmaGraphSceneInner;
