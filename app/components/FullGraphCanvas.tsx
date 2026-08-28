"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import type { MouseEvent, PointerEvent, WheelEvent } from "react";
import {
  schemaCategoryFor,
  schemaCategoryMeta,
  type SchemaCategoryKey,
} from "../graph-schema";

type CanvasEntity = {
  id: string;
  name: string;
  type: string;
  textbookCount?: number;
  degree?: number;
};

type CanvasEdge = {
  id: string;
  subject: string;
  predicate: string;
  label?: string;
  objectId?: string | null;
  crossBook?: boolean;
  provenance?: boolean;
};

type CanvasNode = {
  entity: CanvasEntity;
  x: number;
  y: number;
};

type CanvasBook = { key: string };

export type CanvasPerformanceMetrics = {
  fps: number;
  visibleNodes: number;
  visibleEdges: number;
  renderedLabels: number;
  renderer: "Canvas 2D";
  memoryMb?: number;
  domElementCount: number;
};

type Props = {
  nodes: CanvasNode[];
  relationships: CanvasEdge[];
  visibleNodeIds: Set<string>;
  selectedId?: string | null;
  highlightedNodeIds: string[];
  highlightedRelationshipIds: string[];
  relationLabels: Record<string, string>;
  book: CanvasBook;
  zoom: number;
  pan: { x: number; y: number };
  showLabels: boolean;
  motionEnabled: boolean;
  draggedPositions: Record<string, { x: number; y: number }>;
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onSelect: (entity: CanvasEntity) => void;
  onExpand: (entity: CanvasEntity) => void;
  onContextMenu: (x: number, y: number, entity: CanvasEntity) => void;
  onNodePosition: (nodeKey: string, point: { x: number; y: number }) => void;
  onMetrics: (metrics: CanvasPerformanceMetrics) => void;
};

type ScreenNode = {
  entity: CanvasEntity;
  graphX: number;
  graphY: number;
  x: number;
  y: number;
  radius: number;
};

type ScreenEdge = {
  edge: CanvasEdge;
  from: ScreenNode;
  to: ScreenNode;
};

const COLORS: Record<SchemaCategoryKey, { fill: string; stroke: string }> = {
  textbook: { fill: "#234c72", stroke: "#83b9e8" },
  work: { fill: "#f29660", stroke: "#c96f3e" },
  person: { fill: "#c48bc0", stroke: "#89558a" },
  instrument: { fill: "#72b5d8", stroke: "#3d819f" },
  genre: { fill: "#dfc45a", stroke: "#9f852a" },
  element: { fill: "#8fcf7d", stroke: "#579d48" },
  theory: { fill: "#7dbd78", stroke: "#4b8c48" },
  culture: { fill: "#71b7ad", stroke: "#398478" },
  activity: { fill: "#ef9fb0", stroke: "#b86378" },
  goal: { fill: "#8ab8a2", stroke: "#4d8169" },
};

const stableSeed = (value: string) => {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
};

const pointToSegmentDistance = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(x - x1, y - y1);
  const ratio = Math.max(
    0,
    Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared),
  );
  return Math.hypot(x - (x1 + ratio * dx), y - (y1 + ratio * dy));
};

function FullGraphCanvasScene({
  nodes,
  relationships,
  visibleNodeIds,
  selectedId,
  highlightedNodeIds,
  highlightedRelationshipIds,
  relationLabels,
  book,
  zoom,
  pan,
  showLabels,
  motionEnabled,
  draggedPositions,
  onZoomChange,
  onPanChange,
  onSelect,
  onExpand,
  onContextMenu,
  onNodePosition,
  onMetrics,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenNodesRef = useRef<ScreenNode[]>([]);
  const screenEdgesRef = useRef<ScreenEdge[]>([]);
  const hoverNodeRef = useRef<string | null>(null);
  const hoverEdgeRef = useRef<string | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const localPanRef = useRef(pan);
  const dragRef = useRef<
    | {
        kind: "node";
        id: string;
        startX: number;
        startY: number;
        graphX: number;
        graphY: number;
      }
    | {
        kind: "pan";
        startX: number;
        startY: number;
        originX: number;
        originY: number;
      }
    | null
  >(null);
  const localPositionsRef = useRef<Record<string, { x: number; y: number }>>(
    {},
  );

  const positionById = useMemo(
    () => new Map(nodes.map((node) => [node.entity.id, node])),
    [nodes],
  );
  const highlightedNodes = useMemo(
    () => new Set(highlightedNodeIds),
    [highlightedNodeIds],
  );
  const highlightedEdges = useMemo(
    () => new Set(highlightedRelationshipIds),
    [highlightedRelationshipIds],
  );

  useEffect(() => {
    localPanRef.current = pan;
  }, [pan]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let frameHandle = 0;
    let lastMetricsAt = Date.now();
    let frames = 0;
    const edgeLayer = document.createElement("canvas");
    const edgeContext = edgeLayer.getContext("2d", { alpha: true });
    let edgeLayerDirty = true;
    let cachedScreenEdges: ScreenEdge[] = [];

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const bitmapWidth = Math.round(width * ratio);
      const bitmapHeight = Math.round(height * ratio);
      if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
        canvas.width = bitmapWidth;
        canvas.height = bitmapHeight;
        edgeLayerDirty = true;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const now = Date.now();
      const scaleX = width / 2400;
      const scaleY = height / 1500;
      const activePan = localPanRef.current;
      const hasHighlight = highlightedNodes.size > 0;
      const screenNodes: ScreenNode[] = [];
      const screenNodeById = new Map<string, ScreenNode>();

      for (const node of nodes) {
        if (!visibleNodeIds.has(node.entity.id)) continue;
        const nodeKey = `${book.key}-${node.entity.id}`;
        const fixed =
          localPositionsRef.current[nodeKey] ?? draggedPositions[nodeKey];
        let graphX = fixed?.x ?? node.x;
        let graphY = fixed?.y ?? node.y;
        if (
          motionEnabled &&
          node.entity.type !== "教材" &&
          !fixed &&
          node.entity.id !== selectedId
        ) {
          const seed = stableSeed(nodeKey);
          const phase = now / 5200 + (seed % 97);
          graphX += Math.sin(phase) * (2.2 + (seed % 3));
          graphY += Math.cos(phase * 0.83) * (1.8 + (seed % 2));
        }
        const x = ((graphX - 1200) * zoom + 1200 + activePan.x) * scaleX;
        const y = ((graphY - 750) * zoom + 750 + activePan.y) * scaleY;
        const isTextbook = node.entity.type === "教材";
        const isShared = (node.entity.textbookCount ?? 1) >= 2;
        const baseRadius =
          node.entity.id === selectedId
            ? 13
            : isTextbook
              ? 12
              : isShared
                ? 5.5 + Math.min(4, node.entity.textbookCount ?? 1)
                : zoom < 0.75
                  ? 3
                  : 4.2;
        const radius = Math.max(3, baseRadius * Math.min(1.45, zoom));
        if (
          x < -radius - 50 ||
          y < -radius - 50 ||
          x > width + radius + 50 ||
          y > height + radius + 50
        )
          continue;
        const screenNode = { entity: node.entity, graphX, graphY, x, y, radius };
        screenNodes.push(screenNode);
        screenNodeById.set(node.entity.id, screenNode);
      }

      if (edgeContext && edgeLayerDirty) {
        edgeLayer.width = bitmapWidth;
        edgeLayer.height = bitmapHeight;
        edgeContext.setTransform(ratio, 0, 0, ratio, 0, 0);
        edgeContext.clearRect(0, 0, width, height);
        edgeContext.lineCap = "round";
        cachedScreenEdges = [];
        for (const edge of relationships) {
          if (!edge.objectId) continue;
          const from = screenNodeById.get(edge.subject);
          const to = screenNodeById.get(edge.objectId);
          if (!from || !to) continue;
          const active =
            edge.subject === selectedId || edge.objectId === selectedId;
          const highlighted =
            highlightedEdges.has(edge.id) ||
            (highlightedNodes.has(edge.subject) &&
              highlightedNodes.has(edge.objectId));
          const dimmed = hasHighlight && !highlighted;
          edgeContext.beginPath();
          edgeContext.moveTo(from.x, from.y);
          edgeContext.lineTo(to.x, to.y);
          edgeContext.globalAlpha = dimmed
            ? 0.035
            : active
              ? 0.88
              : edge.crossBook
                ? 0.44
                : edge.provenance
                  ? 0.16
                  : 0.2;
          edgeContext.strokeStyle = active
            ? "#315f86"
            : edge.crossBook
              ? "#557fa5"
              : edge.provenance
                ? "#86929c"
                : "#8292a3";
          edgeContext.lineWidth = active
            ? 2.2
            : edge.crossBook
              ? 1.25
              : 0.72;
          if (edge.provenance) edgeContext.setLineDash([3, 3]);
          else edgeContext.setLineDash([]);
          edgeContext.stroke();
          cachedScreenEdges.push({ edge, from, to });
        }
        edgeContext.setLineDash([]);
        edgeContext.globalAlpha = 1;
        edgeLayerDirty = false;
      }
      context.drawImage(
        edgeLayer,
        0,
        0,
        edgeLayer.width,
        edgeLayer.height,
        (activePan.x - pan.x) * scaleX,
        (activePan.y - pan.y) * scaleY,
        width,
        height,
      );
      const screenEdges = cachedScreenEdges;

      const pointer = pointerRef.current;
      let hoveredNode: ScreenNode | undefined;
      if (pointer) {
        let best = Number.POSITIVE_INFINITY;
        for (const node of screenNodes) {
          const distance = Math.hypot(pointer.x - node.x, pointer.y - node.y);
          if (distance <= node.radius + 6 && distance < best) {
            hoveredNode = node;
            best = distance;
          }
        }
      }
      hoverNodeRef.current = hoveredNode?.entity.id ?? null;

      let hoveredEdge: ScreenEdge | undefined;
      if (pointer && !hoveredNode && zoom >= 0.9) {
        let best = 5;
        for (const edge of screenEdges) {
          const distance = pointToSegmentDistance(
            pointer.x,
            pointer.y,
            edge.from.x,
            edge.from.y,
            edge.to.x,
            edge.to.y,
          );
          if (distance < best) {
            hoveredEdge = edge;
            best = distance;
          }
        }
      }
      hoverEdgeRef.current = hoveredEdge?.edge.id ?? null;

      let renderedLabels = 0;
      for (const node of screenNodes) {
        const semantic = schemaCategoryMeta(node.entity.type);
        const colors = COLORS[semantic.key];
        const isTextbook = node.entity.type === "教材";
        const isShared = (node.entity.textbookCount ?? 1) >= 2;
        const selected = node.entity.id === selectedId;
        const highlighted = highlightedNodes.has(node.entity.id);
        const dimmed = hasHighlight && !highlighted;
        const hovered = node.entity.id === hoverNodeRef.current;

        context.globalAlpha = dimmed ? 0.09 : 1;
        if (isShared) {
          context.beginPath();
          context.arc(node.x, node.y, node.radius + 3.5, 0, Math.PI * 2);
          context.strokeStyle = "rgba(49,93,135,.32)";
          context.lineWidth = 1;
          context.stroke();
        }
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fillStyle = colors.fill;
        context.fill();
        context.strokeStyle = selected || hovered ? "#ffffff" : colors.stroke;
        context.lineWidth = selected ? 2.5 : hovered ? 2 : 1.2;
        context.stroke();

        const showNodeLabel =
          selected ||
          hovered ||
          isTextbook ||
          (showLabels &&
            ((zoom >= 0.95 && (node.entity.textbookCount ?? 1) >= 4) ||
              (zoom >= 1.25 && isShared) ||
              zoom >= 1.85));
        if (showNodeLabel) {
          const name =
            node.entity.name.length > 15
              ? `${node.entity.name.slice(0, 15)}…`
              : node.entity.name;
          context.font = `${selected || isTextbook ? 600 : 500} ${Math.max(9, Math.min(12, 8.5 + zoom * 1.4))}px "Microsoft YaHei", sans-serif`;
          context.textAlign = "center";
          context.textBaseline = "top";
          context.lineWidth = 3;
          context.strokeStyle = "rgba(247,248,245,.94)";
          context.strokeText(name, node.x, node.y + node.radius + 3);
          context.fillStyle = "#2d3e49";
          context.fillText(name, node.x, node.y + node.radius + 3);
          renderedLabels += 1;
        }
      }

      const labelEdges = screenEdges.filter(({ edge }) => {
        if (edge.id === hoverEdgeRef.current) return true;
        if (!showLabels) return false;
        if (edge.subject === selectedId || edge.objectId === selectedId)
          return true;
        if (highlightedEdges.has(edge.id) && zoom >= 0.95) return true;
        return zoom >= 2.15;
      });
      const relationshipLabelLimit = zoom < 0.9 ? 18 : zoom < 1.55 ? 56 : 160;
      for (const { edge, from, to } of labelEdges.slice(
        0,
        relationshipLabelLimit,
      )) {
        const text = relationLabels[edge.predicate] ?? edge.label ?? edge.predicate;
        const x = (from.x + to.x) / 2;
        const y = (from.y + to.y) / 2;
        context.globalAlpha = edge.id === hoverEdgeRef.current ? 1 : 0.88;
        context.font = "9px \"Microsoft YaHei\", sans-serif";
        const width = context.measureText(text).width + 8;
        context.fillStyle = "rgba(248,249,247,.94)";
        context.fillRect(x - width / 2, y - 8, width, 15);
        context.fillStyle = "#516575";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(text, x, y - 0.5);
        renderedLabels += 1;
      }
      context.globalAlpha = 1;

      screenNodesRef.current = screenNodes;
      screenEdgesRef.current = screenEdges;
      canvas.style.cursor = dragRef.current
        ? dragRef.current.kind === "node"
          ? "grabbing"
          : "move"
        : hoveredNode
          ? "grab"
          : hoveredEdge
            ? "help"
            : "default";

      frames += 1;
      if (now - lastMetricsAt >= 1000) {
        const metrics: CanvasPerformanceMetrics = {
          fps: Math.round((frames * 10000) / (now - lastMetricsAt)) / 10,
          visibleNodes: screenNodes.length,
          visibleEdges: screenEdges.length,
          renderedLabels,
          renderer: "Canvas 2D",
          domElementCount:
            canvas.closest(".neo-canvas")?.querySelectorAll("*").length ?? 1,
          memoryMb: (
            window.performance as Performance & {
              memory?: { usedJSHeapSize: number };
            }
          ).memory
            ? Math.round(
                ((window.performance as Performance & {
                  memory: { usedJSHeapSize: number };
                }).memory.usedJSHeapSize /
                  1024 /
                  1024) *
                  10,
              ) / 10
            : undefined,
        };
        canvas.dataset.fps = String(metrics.fps);
        canvas.dataset.visibleNodes = String(metrics.visibleNodes);
        canvas.dataset.visibleEdges = String(metrics.visibleEdges);
        canvas.dataset.renderedLabels = String(metrics.renderedLabels);
        canvas.dataset.domElements = String(metrics.domElementCount);
        if (metrics.memoryMb != null)
          canvas.dataset.memoryMb = String(metrics.memoryMb);
        onMetrics(metrics);
        frames = 0;
        lastMetricsAt = now;
      }
      frameHandle = requestAnimationFrame(draw);
    };

    frameHandle = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameHandle);
  }, [
    book.key,
    draggedPositions,
    highlightedEdges,
    highlightedNodes,
    motionEnabled,
    nodes,
    onMetrics,
    pan.x,
    pan.y,
    relationLabels,
    relationships,
    selectedId,
    showLabels,
    visibleNodeIds,
    zoom,
  ]);

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const graphPoint = (x: number, y: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const rawX = (x / Math.max(1, rect.width)) * 2400;
    const rawY = (y / Math.max(1, rect.height)) * 1500;
    return {
      x: 1200 + (rawX - 1200 - localPanRef.current.x) / zoom,
      y: 750 + (rawY - 750 - localPanRef.current.y) / zoom,
    };
  };

  const nodeAt = (x: number, y: number) => {
    let best: ScreenNode | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const node of screenNodesRef.current) {
      const distance = Math.hypot(x - node.x, y - node.y);
      if (distance <= node.radius + 7 && distance < bestDistance) {
        best = node;
        bestDistance = distance;
      }
    }
    return best;
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return;
    const point = pointFromEvent(event);
    pointerRef.current = point;
    const node = nodeAt(point.x, point.y);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (node) {
      dragRef.current = {
        kind: "node",
        id: node.entity.id,
        startX: point.x,
        startY: point.y,
        graphX: node.graphX,
        graphY: node.graphY,
      };
    } else {
      dragRef.current = {
        kind: "pan",
        startX: point.x,
        startY: point.y,
        originX: localPanRef.current.x,
        originY: localPanRef.current.y,
      };
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(event);
    pointerRef.current = point;
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.kind === "pan") {
      const rect = event.currentTarget.getBoundingClientRect();
      localPanRef.current = {
        x: drag.originX + ((point.x - drag.startX) / rect.width) * 2400,
        y: drag.originY + ((point.y - drag.startY) / rect.height) * 1500,
      };
      return;
    }
    const start = graphPoint(drag.startX, drag.startY, event.currentTarget);
    const current = graphPoint(point.x, point.y, event.currentTarget);
    localPositionsRef.current[`${book.key}-${drag.id}`] = {
      x: drag.graphX + current.x - start.x,
      y: drag.graphY + current.y - start.y,
    };
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(event);
    const drag = dragRef.current;
    if (!drag) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.kind === "node") {
      const node = positionById.get(drag.id)?.entity;
      const moved = Math.hypot(point.x - drag.startX, point.y - drag.startY);
      if (node && moved < 5) onSelect(node);
      const nodeKey = `${book.key}-${drag.id}`;
      const position = localPositionsRef.current[nodeKey];
      if (position && moved >= 5) onNodePosition(nodeKey, position);
    } else onPanChange(localPanRef.current);
    dragRef.current = null;
  };

  const handleDoubleClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const node = nodeAt(event.clientX - rect.left, event.clientY - rect.top);
    if (node) onExpand(node.entity);
  };

  const handleContextMenu = (event: MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const node = nodeAt(event.clientX - rect.left, event.clientY - rect.top);
    if (node) onContextMenu(event.clientX - rect.left, event.clientY - rect.top, node.entity);
  };

  const handleWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.11 : 0.9;
    onZoomChange(Math.max(0.42, Math.min(2.8, zoom * factor)));
  };

  return (
    <canvas
      ref={canvasRef}
      className="full-graph-canvas"
      aria-label="六册全量教材知识图谱（Canvas 高性能渲染）"
      role="img"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => (dragRef.current = null)}
      onPointerLeave={() => {
        pointerRef.current = null;
        hoverNodeRef.current = null;
        hoverEdgeRef.current = null;
      }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onWheel={handleWheel}
    />
  );
}

export const FullGraphCanvas = memo(FullGraphCanvasScene);

type MiniMapProps = {
  nodes: CanvasNode[];
  visibleNodeIds: Set<string>;
  zoom: number;
  pan: { x: number; y: number };
};

function MiniMap({ nodes, visibleNodeIds, zoom, pan }: MiniMapProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = "#edf1f3";
    context.fillRect(0, 0, rect.width, rect.height);
    for (const node of nodes) {
      if (!visibleNodeIds.has(node.entity.id)) continue;
      context.beginPath();
      context.arc(
        (node.x / 2400) * rect.width,
        (node.y / 1500) * rect.height,
        node.entity.type === "教材" ? 2.4 : 0.8,
        0,
        Math.PI * 2,
      );
      context.fillStyle = COLORS[schemaCategoryFor(node.entity.type)].fill;
      context.fill();
    }
    const viewportWidth = rect.width / Math.max(0.4, zoom);
    const viewportHeight = rect.height / Math.max(0.4, zoom);
    const centerX = rect.width / 2 - (pan.x / 2400) * rect.width;
    const centerY = rect.height / 2 - (pan.y / 1500) * rect.height;
    context.strokeStyle = "#3e6b91";
    context.lineWidth = 1;
    context.strokeRect(
      centerX - viewportWidth / 2,
      centerY - viewportHeight / 2,
      viewportWidth,
      viewportHeight,
    );
  }, [nodes, pan.x, pan.y, visibleNodeIds, zoom]);
  return <canvas ref={ref} aria-hidden="true" />;
}

export const FullGraphMiniMap = memo(MiniMap);
