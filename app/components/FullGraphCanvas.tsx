"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";
import {
  schemaCategoryFor,
  schemaCategoryMeta,
} from "../graph-schema";
import { SEMANTIC_PALETTE } from "../semantic-palette";
import { DESIGN_TOKENS } from "../design-tokens";
import { RELATION_STYLES, RELATION_VISIBILITY, relationFamily } from "../lib/graph/constellation-style";

type CanvasEntity = {
  id: string;
  name: string;
  type: string;
  textbookCount?: number;
  occurrenceCount?: number;
  degree?: number;
  relationCount?: number;
  visualImportance?: number;
  visualRank?: number;
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
  renderer: "Canvas 2D" | "Sigma WebGL";
  memoryMb?: number;
  domElementCount: number;
  renderMode: "on-demand" | "animated";
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

// Match Sigma's usable graph footprint without changing the toolbar zoom value.
const CANVAS_GRAPH_SCALE = 1.2;

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
  const lastFocusedSelectionRef = useRef<string | null>(null);
  const drawRequestRef = useRef<() => void>(() => {});
  const geometryDirtyRef = useRef(false);
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
  const structuralEdges = useMemo(() => {
    const entityById = new Map(nodes.map(node => [node.entity.id, node.entity]));
    const score = (edge: CanvasEdge) => (edge.crossBook ? 20 : 0)
      + Math.log2((entityById.get(edge.subject)?.degree ?? 0) + 1)
      + Math.log2((entityById.get(edge.objectId ?? "")?.degree ?? 0) + 1);
    return new Set(relationships.filter(edge => edge.objectId && !edge.provenance)
      .sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id))
      .slice(0, 440).map(edge => edge.id));
  }, [nodes, relationships]);
  const selectionFocus = useMemo(() => {
    const depthByNode = new Map<string, 0 | 1 | 2>();
    const directEdges = new Set<string>();
    const secondaryEdges = new Set<string>();
    if (!selectedId || !visibleNodeIds.has(selectedId))
      return { depthByNode, directEdges, secondaryEdges };
    depthByNode.set(selectedId, 0);
    const adjacency = new Map<string, Array<{ id: string; neighbor: string }>>();
    for (const edge of relationships) {
      if (
        !edge.objectId ||
        !visibleNodeIds.has(edge.subject) ||
        !visibleNodeIds.has(edge.objectId)
      )
        continue;
      if (!adjacency.has(edge.subject)) adjacency.set(edge.subject, []);
      if (!adjacency.has(edge.objectId)) adjacency.set(edge.objectId, []);
      adjacency.get(edge.subject)?.push({ id: edge.id, neighbor: edge.objectId });
      adjacency.get(edge.objectId)?.push({ id: edge.id, neighbor: edge.subject });
    }
    for (const item of adjacency.get(selectedId) ?? []) {
      depthByNode.set(item.neighbor, 1);
      directEdges.add(item.id);
    }
    for (const [id, depth] of [...depthByNode]) {
      if (depth !== 1) continue;
      for (const item of adjacency.get(id) ?? []) {
        if (!depthByNode.has(item.neighbor)) depthByNode.set(item.neighbor, 2);
        if (!directEdges.has(item.id)) secondaryEdges.add(item.id);
      }
    }
    return { depthByNode, directEdges, secondaryEdges };
  }, [relationships, selectedId, visibleNodeIds]);

  useEffect(() => {
    if (!selectedId) {
      lastFocusedSelectionRef.current = null;
      return;
    }
    const focusKey = `${book.key}:${selectedId}`;
    if (lastFocusedSelectionRef.current === focusKey) return;
    const target = positionById.get(selectedId);
    if (!target || !visibleNodeIds.has(selectedId)) return;
    const fixed = draggedPositions[`${book.key}-${selectedId}`];
    const focusZoom = Math.max(zoom, 1.05);
    const x = fixed?.x ?? target.x;
    const y = fixed?.y ?? target.y;
    lastFocusedSelectionRef.current = focusKey;
    if (zoom < focusZoom) onZoomChange(focusZoom);
    onPanChange({
      x: -(x - DESIGN_TOKENS.graph.centerX) * focusZoom,
      y: -(y - DESIGN_TOKENS.graph.centerY) * focusZoom,
    });
  }, [book.key, draggedPositions, onPanChange, onZoomChange, positionById, selectedId, visibleNodeIds, zoom]);

  useEffect(() => {
    localPanRef.current = pan;
    drawRequestRef.current();
  }, [pan]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.11 : 0.9;
      onZoomChange(Math.max(0.42, Math.min(2.8, zoom * factor)));
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [onZoomChange, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let frameHandle = 0;
    let scheduled = false;
    let disposed = false;
    let lastMetricsAt = motionEnabled ? Date.now() : Date.now() - 1000;
    let frames = 0;
    const edgeLayer = document.createElement("canvas");
    const edgeContext = edgeLayer.getContext("2d", { alpha: true });
    let edgeLayerDirty = true;
    let cachedScreenEdges: ScreenEdge[] = [];

    const draw = () => {
      scheduled = false;
      if (geometryDirtyRef.current) {
        edgeLayerDirty = true;
        geometryDirtyRef.current = false;
      }
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
      const scaleX = width / DESIGN_TOKENS.graph.width;
      const scaleY = height / DESIGN_TOKENS.graph.height;
      const activePan = localPanRef.current;
      const hasExplicitHighlight =
        highlightedNodes.size > 0 || highlightedEdges.size > 0;
      const hasSelectionFocus = selectionFocus.depthByNode.size > 0;
      const visualZoom = zoom * CANVAS_GRAPH_SCALE;
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
        const x =
          (((graphX - DESIGN_TOKENS.graph.centerX) * zoom + activePan.x) *
            CANVAS_GRAPH_SCALE + DESIGN_TOKENS.graph.centerX) * scaleX;
        const y =
          (((graphY - DESIGN_TOKENS.graph.centerY) * zoom + activePan.y) *
            CANVAS_GRAPH_SCALE + DESIGN_TOKENS.graph.centerY) * scaleY;
        const isTextbook = node.entity.type === "教材";
        const isShared = (node.entity.textbookCount ?? 1) >= 2;
        const importance = Math.max(
          0,
          Math.min(1, node.entity.visualImportance ?? 0),
        );
        const baseRadius =
          node.entity.id === selectedId
            ? 14
            : isTextbook
              ? 11.5
              : 3.2 + Math.sqrt(importance) * 8.6 + (isShared ? 0.8 : 0);
        const overviewCore = isTextbook || (node.entity.visualRank ?? Infinity) <= 70 || (node.entity.textbookCount ?? 1) >= 3;
        const peripheralOverview = !hasSelectionFocus && !overviewCore;
        const radius = Math.max(1.5, baseRadius * (peripheralOverview ? .56 : .9) * Math.min(1.45, visualZoom));
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
          const direct = selectionFocus.directEdges.has(edge.id);
          const secondary = selectionFocus.secondaryEdges.has(edge.id);
          const dimmed = hasExplicitHighlight
            ? !highlighted
            : hasSelectionFocus && !direct && !secondary;
          edgeContext.beginPath();
          edgeContext.moveTo(from.x, from.y);
          edgeContext.lineTo(to.x, to.y);
          const overviewAlpha = edge.provenance
            ? RELATION_VISIBILITY.canvasOverview.provenance
            : edge.crossBook
              ? RELATION_VISIBILITY.canvasOverview.crossBook
              : structuralEdges.has(edge.id)
                ? RELATION_VISIBILITY.canvasOverview.structural
                : RELATION_VISIBILITY.canvasOverview.ordinary;
          edgeContext.globalAlpha = dimmed
            ? RELATION_VISIBILITY.canvasFocus.unrelated
            : active || direct
              ? RELATION_VISIBILITY.canvasFocus.direct
              : secondary
                ? RELATION_VISIBILITY.canvasFocus.secondary
                : overviewAlpha * (visualZoom >= 1.5 ? 1.35 : visualZoom >= .9 ? 1.15 : 1);
          edgeContext.strokeStyle = active || direct || secondary
            ? RELATION_STYLES[relationFamily(edge)].color
            : edge.crossBook ? "#6e8297" : "#8a97a4";
          edgeContext.lineWidth = active
            ? 2.2
            : direct
              ? 2.1
              : secondary
                ? 1
                : edge.crossBook
                  ? 1
                  : structuralEdges.has(edge.id) ? .9 : .6;
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
        (activePan.x - pan.x) * CANVAS_GRAPH_SCALE * scaleX,
        (activePan.y - pan.y) * CANVAS_GRAPH_SCALE * scaleY,
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
      if (pointer && !hoveredNode && visualZoom >= 0.9) {
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
      const nodeLabelCandidates: Array<{
        node: ScreenNode;
        selected: boolean;
        hovered: boolean;
        isTextbook: boolean;
        focusDepth?: 0 | 1 | 2;
      }> = [];
      for (const node of screenNodes) {
        const semantic = schemaCategoryMeta(node.entity.type);
        const colors = SEMANTIC_PALETTE[semantic.key];
        const isTextbook = node.entity.type === "教材";
        const isShared = (node.entity.textbookCount ?? 1) >= 2;
        const selected = node.entity.id === selectedId;
        const highlighted = highlightedNodes.has(node.entity.id);
        const focusDepth = selectionFocus.depthByNode.get(node.entity.id);
        const dimmed = hasExplicitHighlight
          ? !highlighted
          : hasSelectionFocus && focusDepth == null;
        const hovered = node.entity.id === hoverNodeRef.current;

        const overviewCore = isTextbook || (node.entity.visualRank ?? Infinity) <= 70 || (node.entity.textbookCount ?? 1) >= 3;
        context.globalAlpha = selected || hovered ? 1 : dimmed ? 0.05 : focusDepth === 2 ? 0.32
          : hasSelectionFocus || overviewCore ? 1 : 0.2;
        if (isShared && (selected || focusDepth === 1 || overviewCore)) {
          context.beginPath();
          context.arc(node.x, node.y, node.radius + 3.5, 0, Math.PI * 2);
          context.strokeStyle = "rgba(49,93,135,.32)";
          context.lineWidth = 1;
          context.stroke();
        }
        if (selected) {
          context.beginPath();
          context.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
          context.strokeStyle = "#6684aa";
          context.lineWidth = 1.8;
          context.stroke();
        }
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fillStyle = colors.fill;
        context.fill();
        context.strokeStyle = selected || hovered ? "#ffffff" : colors.stroke;
        context.lineWidth = selected ? 2.5 : hovered ? 2 : .6;
        context.stroke();

        const rankLimit =
          visualZoom < 0.9 ? 18 : visualZoom < 1.3 ? 80 : visualZoom < 1.9 ? 230 : Infinity;
        const showNodeLabel =
          selected ||
          hovered ||
          isTextbook ||
          (node.entity.visualRank ?? Infinity) <= rankLimit ||
          (showLabels &&
            ((focusDepth === 1 &&
              (node.entity.visualRank ?? Infinity) <= 160) ||
              (focusDepth === 2 &&
                visualZoom >= 1.5 &&
                (node.entity.visualRank ?? Infinity) <= 300) ||
              visualZoom >= 2));
        if (showNodeLabel)
          nodeLabelCandidates.push({
            node,
            selected,
            hovered,
            isTextbook,
            focusDepth,
          });
      }

      const occupiedLabels: Array<{
        left: number;
        right: number;
        top: number;
        bottom: number;
      }> = [];
      const labelLimit = hasSelectionFocus
        ? visualZoom < 1.5 ? 24 : visualZoom < 2 ? 55 : 140
        : visualZoom < .9 ? 22 : visualZoom < 1.3 ? 80 : visualZoom < 1.9 ? 230 : Infinity;
      const labelPriority = (item: typeof nodeLabelCandidates[number]) =>
        item.selected || item.hovered ? 0 : item.focusDepth === 1 ? 1
          : item.isTextbook ? 2 : item.focusDepth === 2 ? 3 : 4;
      nodeLabelCandidates
        .sort((a, b) => labelPriority(a) - labelPriority(b) ||
          (a.node.entity.visualRank ?? Infinity) - (b.node.entity.visualRank ?? Infinity))
        .slice(0, labelLimit)
        .forEach(({ node, selected, hovered, isTextbook, focusDepth }) => {
          const name =
            node.entity.name.length > 15
              ? `${node.entity.name.slice(0, 15)}…`
              : node.entity.name;
          context.font = `${selected || isTextbook ? 600 : 500} ${Math.max(9, Math.min(12, 8.5 + visualZoom * 1.4))}px "Microsoft YaHei", sans-serif`;
          const labelWidth = context.measureText(name).width + 8;
          const top = node.y + node.radius + 2;
          const box = {
            left: node.x - labelWidth / 2,
            right: node.x + labelWidth / 2,
            top,
            bottom: top + 15,
          };
          const collides = occupiedLabels.some(
            (placed) =>
              box.left < placed.right &&
              box.right > placed.left &&
              box.top < placed.bottom &&
              box.bottom > placed.top,
          );
          if (collides && !selected && !hovered) return;
          occupiedLabels.push(box);
          context.globalAlpha = focusDepth === 2 ? 0.64 : 1;
          context.textAlign = "center";
          context.textBaseline = "top";
          context.lineWidth = 3;
          context.strokeStyle = "rgba(247,248,245,.94)";
          context.strokeText(name, node.x, top);
          context.fillStyle = "#2d3e49";
          context.fillText(name, node.x, top);
          renderedLabels += 1;
        });

      const labelEdges = screenEdges.filter(({ edge }) => {
        if (edge.id === hoverEdgeRef.current) return true;
        if (!showLabels) return false;
        if (edge.subject === selectedId || edge.objectId === selectedId)
          return true;
        if (selectionFocus.directEdges.has(edge.id)) return true;
        if (highlightedEdges.has(edge.id) && visualZoom >= 1.2) return true;
        return visualZoom >= 2.6;
      });
      const relationshipLabelLimit = visualZoom < 1.1 ? 10 : visualZoom < 1.8 ? 40 : 160;
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
          fps: motionEnabled
            ? Math.round((frames * 10000) / (now - lastMetricsAt)) / 10
            : 0,
          visibleNodes: screenNodes.length,
          visibleEdges: screenEdges.length,
          renderedLabels,
          renderer: "Canvas 2D",
          renderMode: motionEnabled ? "animated" : "on-demand",
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
        canvas.dataset.selectedId = selectedId ?? "";
        canvas.dataset.focusNodes = String(selectionFocus.depthByNode.size);
        canvas.dataset.focusEdges = String(selectionFocus.directEdges.size + selectionFocus.secondaryEdges.size);
        const selectedScreen = selectedId ? screenNodeById.get(selectedId) : null;
        canvas.dataset.selectedViewport = selectedScreen
          ? JSON.stringify({ x: selectedScreen.x, y: selectedScreen.y })
          : "";
        canvas.dataset.domElements = String(metrics.domElementCount);
        canvas.dataset.renderMode = metrics.renderMode;
        if (metrics.memoryMb != null)
          canvas.dataset.memoryMb = String(metrics.memoryMb);
        onMetrics(metrics);
        frames = 0;
        lastMetricsAt = now;
      }
      if (motionEnabled && !disposed) frameHandle = requestAnimationFrame(draw);
    };

    const requestDraw = () => {
      if (disposed || scheduled) return;
      scheduled = true;
      frameHandle = requestAnimationFrame(draw);
    };
    drawRequestRef.current = requestDraw;
    const resizeObserver = new ResizeObserver(() => {
      edgeLayerDirty = true;
      requestDraw();
    });
    resizeObserver.observe(canvas);
    requestDraw();
    return () => {
      disposed = true;
      resizeObserver.disconnect();
      cancelAnimationFrame(frameHandle);
      drawRequestRef.current = () => {};
    };
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
    selectionFocus,
    showLabels,
    structuralEdges,
    visibleNodeIds,
    zoom,
  ]);

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const graphPoint = (x: number, y: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const rawX =
      (x / Math.max(1, rect.width)) * DESIGN_TOKENS.graph.width;
    const rawY =
      (y / Math.max(1, rect.height)) * DESIGN_TOKENS.graph.height;
    return {
      x:
        DESIGN_TOKENS.graph.centerX +
        ((rawX - DESIGN_TOKENS.graph.centerX) / CANVAS_GRAPH_SCALE - localPanRef.current.x) / zoom,
      y:
        DESIGN_TOKENS.graph.centerY +
        ((rawY - DESIGN_TOKENS.graph.centerY) / CANVAS_GRAPH_SCALE - localPanRef.current.y) / zoom,
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
    drawRequestRef.current();
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(event);
    pointerRef.current = point;
    const drag = dragRef.current;
    if (!drag) {
      drawRequestRef.current();
      return;
    }
    if (drag.kind === "pan") {
      const rect = event.currentTarget.getBoundingClientRect();
      localPanRef.current = {
        x:
          drag.originX +
          ((point.x - drag.startX) / rect.width) *
            DESIGN_TOKENS.graph.width / CANVAS_GRAPH_SCALE,
        y:
          drag.originY +
          ((point.y - drag.startY) / rect.height) *
            DESIGN_TOKENS.graph.height / CANVAS_GRAPH_SCALE,
      };
      drawRequestRef.current();
      return;
    }
    const start = graphPoint(drag.startX, drag.startY, event.currentTarget);
    const current = graphPoint(point.x, point.y, event.currentTarget);
    localPositionsRef.current[`${book.key}-${drag.id}`] = {
      x: drag.graphX + current.x - start.x,
      y: drag.graphY + current.y - start.y,
    };
    geometryDirtyRef.current = true;
    drawRequestRef.current();
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
    drawRequestRef.current();
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
        drawRequestRef.current();
      }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    />
  );
}

export const FullGraphCanvas = memo(FullGraphCanvasScene);

type MiniMapProps = {
  nodes: CanvasNode[];
  visibleNodeIds: Set<string>;
  zoom: number;
  pan: { x: number; y: number };
  viewport?: { minX: number; minY: number; maxX: number; maxY: number } | null;
  draggedPositions?: Record<string, { x: number; y: number }>;
  sceneKey?: string;
};

function MiniMap({ nodes, visibleNodeIds, zoom, pan, viewport, draggedPositions, sceneKey }: MiniMapProps) {
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
      const fixed = sceneKey ? draggedPositions?.[`${sceneKey}-${node.entity.id}`] : undefined;
      context.beginPath();
      context.arc(
        ((fixed?.x ?? node.x) / 2400) * rect.width,
        ((fixed?.y ?? node.y) / 1500) * rect.height,
        node.entity.type === "教材" ? 2.4 : 0.8,
        0,
        Math.PI * 2,
      );
      context.fillStyle =
        SEMANTIC_PALETTE[schemaCategoryFor(node.entity.type)].fill;
      context.fill();
    }
    const canvasZoom = Math.max(0.4, zoom) * CANVAS_GRAPH_SCALE;
    const viewportWidth = rect.width / canvasZoom;
    const viewportHeight = rect.height / canvasZoom;
    const centerX = rect.width / 2 - (pan.x / Math.max(0.4, zoom) / 2400) * rect.width;
    const centerY = rect.height / 2 - (pan.y / Math.max(0.4, zoom) / 1500) * rect.height;
    context.strokeStyle = "#3e6b91";
    context.lineWidth = 1;
    context.strokeRect(
      viewport ? (viewport.minX / 2400) * rect.width : centerX - viewportWidth / 2,
      viewport ? (viewport.minY / 1500) * rect.height : centerY - viewportHeight / 2,
      viewport ? ((viewport.maxX - viewport.minX) / 2400) * rect.width : viewportWidth,
      viewport ? ((viewport.maxY - viewport.minY) / 1500) * rect.height : viewportHeight,
    );
  }, [draggedPositions, nodes, pan.x, pan.y, sceneKey, viewport, visibleNodeIds, zoom]);
  return <canvas ref={ref} aria-hidden="true" />;
}

export const FullGraphMiniMap = memo(MiniMap);
