"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { schemaCategoryFor } from "../../graph-schema";
import { SEMANTIC_PALETTE } from "../../semantic-palette";
import type { SemanticPaletteKey } from "../../semantic-palette";
import { WorkbenchIcon } from "../WorkbenchIcon";

type WorkGraphEntity = {
  id: string;
  name: string;
  type: string;
  bookKeys?: string[];
  firstPageByBook?: Record<string, number>;
  degree?: number;
  media?: Array<{ kind: string; url: string; title?: string; source?: string }>;
};
type WorkGraphRelation = {
  id: string;
  subject: string;
  predicate: string;
  label?: string;
  objectId?: string | null;
  literal?: string | null;
  provenance?: boolean;
  extended?: boolean;
  confidence?: number;
  sourcePage?: number | null;
  bookKeys?: string[];
};
type BookInfo = { key: string; title: string };

const FACETS: Array<{ key: string; label: string; categories: SemanticPaletteKey[] }> = [
  { key: "creator", label: "创作者", categories: ["person"] },
  { key: "music", label: "音乐要素", categories: ["element", "theory"] },
  { key: "form", label: "体裁与表演", categories: ["genre", "instrument"] },
  { key: "culture", label: "文化背景", categories: ["culture"] },
  { key: "works", label: "关联作品", categories: ["work"] },
  { key: "textbook", label: "教材单元", categories: ["textbook", "activity", "goal"] },
];
const facetOf = (category: SemanticPaletteKey) => FACETS.find((facet) => facet.categories.includes(category))?.key ?? "music";
// Second-hop works are reached only through specific, low-degree neighbours
// (a composer, a source opera); hubs like 2/4 would pull in half the library.
const BRIDGE_CATEGORIES = new Set<SemanticPaletteKey>(["person", "genre", "work"]);
const MAX_BRIDGE_DEGREE = 14;
const MAX_SECOND_HOP = 8;
const LEARNING = /学习|演唱要求|演奏要求|演唱提示|教材标注|练习/;

type EgoNode = {
  id: string;
  entity: WorkGraphEntity;
  category: SemanticPaletteKey;
  depth: 0 | 1 | 2;
  facet: string;
  parent?: string;
  labels: string[];
};
type EgoLink = { id: string; source: string; target: string; labels: string[]; depth: 1 | 2 };
type SimNode = { x: number; y: number; vx: number; vy: number; r: number; w: number; h: number; fx?: number; fy?: number; phase: number };
// Rendered label length drives the collision box, so neighbours never overprint.
const labelText = (name: string, depth: number) => name.length > (depth === 2 ? 9 : 14) ? `${name.slice(0, depth === 2 ? 8 : 13)}…` : name;

function buildEgo(workId: string, entities: Map<string, WorkGraphEntity>, relationships: WorkGraphRelation[]) {
  const nodes = new Map<string, EgoNode>();
  const links = new Map<string, EgoLink>();
  const work = entities.get(workId);
  if (!work) return { nodes: [], links: [] };
  nodes.set(workId, { id: workId, entity: work, category: "work", depth: 0, facet: "center", labels: [] });
  const adjacency = new Map<string, WorkGraphRelation[]>();
  for (const relation of relationships) {
    if (relation.provenance || !relation.objectId) continue;
    for (const end of [relation.subject, relation.objectId]) {
      if (!adjacency.has(end)) adjacency.set(end, []);
      adjacency.get(end)!.push(relation);
    }
  }
  const labelOf = (relation: WorkGraphRelation) => relation.label ?? relation.predicate;
  const link = (source: string, target: string, label: string, depth: 1 | 2) => {
    const key = [source, target].sort().join("|");
    const existing = links.get(key);
    if (existing) { if (!existing.labels.includes(label)) existing.labels.push(label); return; }
    links.set(key, { id: key, source, target, labels: [label], depth });
  };
  for (const relation of adjacency.get(workId) ?? []) {
    const other = relation.subject === workId ? relation.objectId! : relation.subject;
    const entity = entities.get(other);
    if (!entity || other === workId) continue;
    const category = schemaCategoryFor(entity.type) as SemanticPaletteKey;
    const node = nodes.get(other) ?? { id: other, entity, category, depth: 1 as const, facet: facetOf(category), labels: [] };
    if (!node.labels.includes(labelOf(relation))) node.labels.push(labelOf(relation));
    nodes.set(other, node);
    link(workId, other, labelOf(relation), 1);
  }
  let added = 0;
  const firstHop = [...nodes.values()].filter((node) => node.depth === 1 && BRIDGE_CATEGORIES.has(node.category) && (node.entity.degree ?? 99) <= MAX_BRIDGE_DEGREE);
  for (const bridge of firstHop) {
    let perBridge = 0;
    for (const relation of adjacency.get(bridge.id) ?? []) {
      if (added >= MAX_SECOND_HOP || perBridge >= 3) break;
      const other = relation.subject === bridge.id ? relation.objectId! : relation.subject;
      const entity = entities.get(other);
      if (!entity || nodes.has(other) || schemaCategoryFor(entity.type) !== "work") continue;
      nodes.set(other, { id: other, entity, category: "work", depth: 2, facet: bridge.facet, parent: bridge.id, labels: [labelOf(relation)] });
      link(bridge.id, other, labelOf(relation), 2);
      added += 1; perBridge += 1;
    }
  }
  return { nodes: [...nodes.values()], links: [...links.values()] };
}

const layerOf = (relation: WorkGraphRelation) =>
  relation.extended ? "拓展" : relation.confidence != null && relation.confidence < 0.95 ? "归纳" : relation.confidence != null && relation.confidence < 0.98 ? "乐谱" : "";

/** Focused, living knowledge graph of a single work: the work, its direct
 * knowledge points grouped by facet, and works reachable through them. */
export function WorkGraph({
  workId, entities, relationships, books, assetUrl, onBack, onOpenWork, onLocate,
}: {
  workId: string;
  entities: WorkGraphEntity[];
  relationships: WorkGraphRelation[];
  books: BookInfo[];
  assetUrl: (path: string) => string;
  onBack: () => void;
  onOpenWork: (id: string) => void;
  onLocate: (id: string) => void;
}) {
  const entityMap = useMemo(() => new Map(entities.map((entity) => [entity.id, entity])), [entities]);
  const [showSecond, setShowSecond] = useState(false);
  const ego = useMemo(() => buildEgo(workId, entityMap, relationships), [workId, entityMap, relationships]);
  const nodes = useMemo(() => ego.nodes.filter((node) => showSecond || node.depth < 2), [ego, showSecond]);
  const links = useMemo(() => ego.links.filter((link) => showSecond || link.depth < 2), [ego, showSecond]);
  const work = entityMap.get(workId);
  const attributes = useMemo(() => relationships.filter((relation) => relation.subject === workId && relation.literal && !relation.provenance), [relationships, workId]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 900, height: 620 });
  const [, setFrame] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const sim = useRef(new Map<string, SimNode>());
  const alpha = useRef(1);
  const drag = useRef<{ id: string; moved: boolean; x: number; y: number } | null>(null);
  const reducedMotion = useRef(false);

  useEffect(() => { setSelectedId(null); }, [workId]);
  useEffect(() => {
    reducedMotion.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: Math.max(360, entry.contentRect.width), height: Math.max(420, entry.contentRect.height) }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Facet sectors around the work, sized by how many knowledge points each holds.
  const facetAngles = useMemo(() => {
    const present = FACETS.map((facet) => ({ facet, count: nodes.filter((node) => node.depth === 1 && node.facet === facet.key).length })).filter((item) => item.count);
    const total = present.reduce((sum, item) => sum + Math.max(1.6, item.count), 0);
    let cursor = -Math.PI / 2 - (Math.max(1.6, present[0]?.count ?? 1) / Math.max(1, total)) * Math.PI;
    return new Map(present.map((item) => {
      const span = (Math.max(1.6, item.count) / Math.max(1, total)) * Math.PI * 2;
      const sector = { start: cursor, span, mid: cursor + span / 2 };
      cursor += span;
      return [item.facet.key, sector] as const;
    }));
  }, [nodes]);
  // The ring is an ellipse that fits the stage: wide screens spread sideways.
  const ringX = Math.max(150, Math.min(size.width * 0.36, 290));
  const ringY = Math.max(130, Math.min((size.height - 150) * 0.42, 230));
  const firstRadius = Math.min(ringX, ringY);

  useEffect(() => {
    const next = new Map<string, SimNode>();
    for (const node of nodes) {
      const previous = sim.current.get(node.id);
      const r = node.depth === 0 ? 30 : node.depth === 1 ? 13 + Math.min(6, Math.log2((node.entity.degree ?? 1) + 1)) : 9;
      const w = Math.max(r * 2, labelText(node.entity.name, node.depth).length * (node.depth === 2 ? 11 : 12.5) + 8);
      const h = r * 2 + 22;
      next.set(node.id, previous ? { ...previous, r, w, h } : { x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20, vx: 0, vy: 0, r, w, h, phase: Math.random() * Math.PI * 2 });
    }
    sim.current = next;
    alpha.current = 1;
  }, [nodes]);

  useEffect(() => { alpha.current = Math.max(alpha.current, 0.3); }, [size]);
  useEffect(() => {
    let raf = 0;
    const byFacet = new Map<string, EgoNode[]>();
    for (const node of nodes) if (node.depth === 1) byFacet.set(node.facet, [...(byFacet.get(node.facet) ?? []), node]);
    const childrenOf = new Map<string, EgoNode[]>();
    for (const node of nodes) if (node.parent) childrenOf.set(node.parent, [...(childrenOf.get(node.parent) ?? []), node]);
    const step = () => {
      const a = alpha.current;
      let moving = a > 0.004 || Boolean(drag.current);
      {
        const list = nodes.map((node) => ({ node, s: sim.current.get(node.id)! })).filter((item) => item.s);
        // Anchors: each first-hop node gets a slot inside its facet's sector.
        for (const { node, s } of list) {
          let tx = 0, ty = 0, k = 0.1;
          if (node.depth === 1) {
            const peers = byFacet.get(node.facet) ?? [node];
            const index = peers.indexOf(node);
            const sector = facetAngles.get(node.facet) ?? { start: 0, span: Math.PI * 2, mid: 0 };
            const angle = sector.start + ((index + 0.5) / peers.length) * sector.span;
            // Crowded sectors alternate between two rings so labels do not collide.
            const crowded = (sector.span / peers.length) * firstRadius < 92;
            const scale = crowded ? (index % 2 ? 1.18 : 0.84) : 1;
            tx = Math.cos(angle) * ringX * scale; ty = Math.sin(angle) * ringY * scale;
          } else if (node.depth === 2 && node.parent) {
            const parent = sim.current.get(node.parent);
            if (!parent) continue;
            const siblings = childrenOf.get(node.parent) ?? [node];
            const base = Math.atan2(parent.y, parent.x);
            const angle = base + (siblings.length > 1 ? (siblings.indexOf(node) / (siblings.length - 1) - 0.5) * Math.min(2.2, 0.7 * siblings.length) : 0);
            tx = parent.x + Math.cos(angle) * 112; ty = parent.y + Math.sin(angle) * 112; k = 0.08;
          } else { k = 0.2; }
          if (a > 0.004) { s.vx += (tx - s.x) * k * a; s.vy += (ty - s.y) * k * a; }
        }
        // Collision keeps labels readable.
        for (let i = 0; i < list.length; i += 1)
          for (let j = i + 1; j < list.length; j += 1) {
            const p = list[i].s, q = list[j].s;
            const dx = q.x - p.x, dy = q.y - p.y;
            const overlapX = (p.w + q.w) / 2 + 6 - Math.abs(dx);
            const overlapY = (p.h + q.h) / 2 + 4 - Math.abs(dy);
            if (overlapX <= 0 || overlapY <= 0) continue;
            // Separate along the axis that needs the smaller move.
            // Collisions resolve even after the layout cools, so nothing is left overprinted.
            const strength = 0.3;
            moving = true;
            const fixedP = list[i].node.depth === 0, fixedQ = list[j].node.depth === 0;
            const share = fixedP || fixedQ ? 1 : 0.5;
            const [mx, my] = overlapX < overlapY ? [Math.sign(dx || 1) * overlapX * strength, 0] : [0, Math.sign(dy || 1) * overlapY * strength];
            if (!fixedP) { p.vx -= mx * share; p.vy -= my * share; }
            if (!fixedQ) { q.vx += mx * share; q.vy += my * share; }
          }
        // Keep every node and its label inside the stage, clear of the toolbar and legend.
        const halfW = size.width / 2, halfH = size.height / 2;
        for (const { node, s } of list) {
          if (node.depth === 0) { s.x = 0; s.y = 0; s.vx = s.vy = 0; continue; }
          if (s.fx != null && s.fy != null) { s.x = s.fx; s.y = s.fy; s.vx = s.vy = 0; continue; }
          s.vx *= 0.72; s.vy *= 0.72;
          s.x = Math.max(-halfW + s.w / 2 + 10, Math.min(halfW - s.w / 2 - 10, s.x + s.vx));
          s.y = Math.max(-halfH + 58 + s.r, Math.min(halfH - 70 - s.r - 22, s.y + s.vy));
        }
        if (a > 0.004) alpha.current = a * 0.985;
      }
      // With reduced motion there is nothing to repaint once the layout settles.
      if (!reducedMotion.current || moving) setFrame((value) => (value + 1) % 1e6);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [facetAngles, firstRadius, nodes, ringX, ringY, size]);

  // Settled nodes keep a slow drift so the map reads as alive, not frozen.
  const now = typeof performance === "undefined" ? 0 : performance.now();
  const position = (id: string) => {
    const s = sim.current.get(id);
    if (!s) return { x: 0, y: 0 };
    if (reducedMotion.current || id === workId || s.fx != null || drag.current?.id === id) return { x: s.x, y: s.y };
    const amplitude = 3.2 * (1 - Math.min(1, alpha.current * 3));
    return { x: s.x + Math.sin(now / 1700 + s.phase) * amplitude, y: s.y + Math.cos(now / 2100 + s.phase * 1.3) * amplitude };
  };

  const toGraph = (event: ReactPointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: point.x, y: point.y };
  };
  const onNodeDown = (event: ReactPointerEvent, id: string) => {
    if (id === workId) { setSelectedId(null); return; }
    (event.target as Element).setPointerCapture?.(event.pointerId);
    drag.current = { id, moved: false, x: event.clientX, y: event.clientY };
  };
  const onPointerMove = (event: ReactPointerEvent) => {
    const current = drag.current;
    if (!current) return;
    if (!current.moved && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 4) return;
    current.moved = true;
    const s = sim.current.get(current.id);
    if (!s) return;
    const point = toGraph(event);
    s.fx = point.x; s.fy = point.y;
    alpha.current = Math.max(alpha.current, 0.35);
  };
  const onPointerUp = () => {
    const current = drag.current;
    if (!current) return;
    const s = sim.current.get(current.id);
    if (s) { s.fx = undefined; s.fy = undefined; }
    // Released nodes spring back into their facet slot.
    alpha.current = Math.max(alpha.current, 0.5);
    if (!current.moved) setSelectedId((value) => (value === current.id ? null : current.id));
    drag.current = null;
  };

  const activeId = hoveredId ?? selectedId;
  const activeSet = useMemo(() => {
    if (!activeId) return null;
    const set = new Set([activeId]);
    for (const link of links) if (link.source === activeId || link.target === activeId) { set.add(link.source); set.add(link.target); }
    return set;
  }, [activeId, links]);

  const selected = selectedId ? nodes.find((node) => node.id === selectedId) : undefined;
  const bookTitle = (key?: string) => books.find((book) => book.key === key)?.title.replace(/^人音版/, "") ?? "";
  // Score sources name the book and printed page ("人音版八年级上册 第23页"); PDF pages do not.
  const scoreSource = work?.media?.find((asset) => asset.source)?.source?.replace(/^人音版/, "").replace(/\s*第(\d+)页$/, " · 教材第 $1 页");
  const bookSources = (work?.bookKeys ?? []).map(bookTitle).filter(Boolean).join("、");
  const sourceLabel = (work?.bookKeys?.length ?? 0) > 1 ? bookSources : scoreSource ?? bookSources;
  const creators = nodes.filter((node) => node.depth === 1 && node.category === "person");
  const introFacts = attributes.filter((relation) => !LEARNING.test(relation.predicate) && !relation.extended);
  const learningFacts = attributes.filter((relation) => LEARNING.test(relation.predicate) && !relation.extended);
  const extendedFacts = [...attributes.filter((relation) => relation.extended), ...relationships.filter((relation) => relation.subject === workId && relation.extended && relation.objectId)];
  const valueOf = (relation: WorkGraphRelation) => relation.literal ?? entityMap.get(relation.objectId ?? "")?.name ?? "";
  const counts = FACETS.map((facet) => ({ ...facet, count: nodes.filter((node) => node.depth === 1 && node.facet === facet.key).length })).filter((facet) => facet.count);

  if (!work) return <section className="work-graph-empty"><p>没有找到这首作品。</p><button type="button" onClick={onBack}>返回作品档案</button></section>;

  return <section className="work-graph" aria-label={`${work.name}作品知识图谱`}>
    <div className="work-graph-stage" ref={stageRef}>
      <header className="work-graph-toolbar">
        <button type="button" className="work-graph-back" onClick={onBack}><WorkbenchIcon name="left" />作品档案</button>
        <div className="work-graph-actions">
          <label><input type="checkbox" checked={showSecond} onChange={(event) => setShowSecond(event.target.checked)} />显示延伸作品</label>
          <button type="button" onClick={() => { for (const s of sim.current.values()) { s.x = (Math.random() - 0.5) * 30; s.y = (Math.random() - 0.5) * 30; } alpha.current = 1; }}><WorkbenchIcon name="reset" />重新排布</button>
        </div>
      </header>
      <svg ref={svgRef} className="work-graph-svg" viewBox={`${-size.width / 2} ${-size.height / 2} ${size.width} ${size.height}`} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onClick={(event) => { if (event.target === svgRef.current) setSelectedId(null); }}>
        <defs>
          <radialGradient id="work-graph-core" cx="50%" cy="40%" r="65%"><stop offset="0%" stopColor="#A78BFA" /><stop offset="100%" stopColor="#6D28D9" /></radialGradient>
        </defs>
        <ellipse className="work-graph-orbit" rx={ringX} ry={ringY} />
        {links.map((link) => {
          const a = position(link.source), b = position(link.target);
          const active = activeSet ? activeSet.has(link.source) && activeSet.has(link.target) : false;
          const dim = Boolean(activeSet) && !active;
          const other = link.source === workId ? link.target : link.source;
          const node = nodes.find((item) => item.id === other);
          const color = SEMANTIC_PALETTE[node?.category ?? "work"].fill;
          // Labels sit nearer the outer end so the spokes around the work stay clear.
          const outer = link.source === workId ? b : a, inner = link.source === workId ? a : b;
          const mx = inner.x + (outer.x - inner.x) * 0.6, my = inner.y + (outer.y - inner.y) * 0.6;
          const showLabel = active || (!activeSet && link.depth === 1 && links.length <= 34 && firstRadius >= 180);
          return <g key={link.id} className={`work-graph-link depth-${link.depth} ${active ? "is-active" : ""} ${dim ? "is-dim" : ""}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{ stroke: color }} />
            {active && <line className="work-graph-flow" x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{ stroke: color }} />}
            {showLabel && <text x={mx} y={my} className="work-graph-edge-label">{link.labels.slice(0, 2).join(" · ")}</text>}
          </g>;
        })}
        {nodes.map((node) => {
          const p = position(node.id);
          const s = sim.current.get(node.id);
          const palette = SEMANTIC_PALETTE[node.category];
          const dim = Boolean(activeSet) && !activeSet!.has(node.id);
          const isSelected = node.id === selectedId;
          return <g key={node.id} className={`work-graph-node depth-${node.depth} ${dim ? "is-dim" : ""} ${isSelected ? "is-selected" : ""}`} transform={`translate(${p.x} ${p.y})`}
            onPointerDown={(event) => onNodeDown(event, node.id)} onPointerEnter={() => setHoveredId(node.id)} onPointerLeave={() => setHoveredId(null)}
            role="button" tabIndex={0} aria-label={`${node.entity.name}（${node.labels.join("、") || node.entity.type}）`}
            onKeyDown={(event) => { if (event.key === "Enter") setSelectedId(node.id); }}>
            {node.depth === 0 ? <>
              <circle className="work-graph-pulse" r={(s?.r ?? 30) + 6} />
              <circle r={s?.r ?? 30} fill="url(#work-graph-core)" stroke="#fff" strokeWidth={3} />
              <path d="M-4 7V-8l11-2v12M-4 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm11-2a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </> : <>
              {isSelected && <circle r={(s?.r ?? 12) + 7} className="work-graph-halo" style={{ stroke: palette.fill }} />}
              <circle r={s?.r ?? 12} fill={node.depth === 2 ? palette.soft : palette.fill} stroke={node.depth === 2 ? palette.fill : "#fff"} strokeWidth={node.depth === 2 ? 1.6 : 2.5} />
            </>}
            <text className="work-graph-label" y={(s?.r ?? 12) + 17}>{labelText(node.entity.name, node.depth)}</text>
          </g>;
        })}
      </svg>
      <footer className="work-graph-footer">
        <div className="work-graph-legend">
          {counts.map((facet) => <span key={facet.key}><i style={{ background: SEMANTIC_PALETTE[facet.categories[0]].fill }} />{facet.label}<b>{facet.count}</b></span>)}
          {showSecond && nodes.some((node) => node.depth === 2) && <span className="is-second"><i />延伸作品<b>{nodes.filter((node) => node.depth === 2).length}</b></span>}
        </div>
        <p className="work-graph-hint">拖动节点可拉开，松手弹回；点击节点查看关系</p>
      </footer>
    </div>
    <aside className="work-graph-panel">
      <div className="work-graph-card">
        <span className="work-graph-type">{work.type}</span>
        <h2>{work.name}</h2>
        <p className="work-graph-source">{sourceLabel}</p>
        {creators.length > 0 && <p className="work-graph-creators">{creators.map((node) => <span key={node.id}><small>{node.labels.join("/")}</small>{node.entity.name}</span>)}</p>}
        <button type="button" className="work-graph-locate" onClick={() => onLocate(workId)}>在总图谱中定位<WorkbenchIcon name="arrow" /></button>
      </div>
      {selected && <div className="work-graph-card is-selection">
        <span className="work-graph-type" style={{ color: SEMANTIC_PALETTE[selected.category].stroke, background: SEMANTIC_PALETTE[selected.category].soft }}>{selected.entity.type}</span>
        <h3>{selected.entity.name}</h3>
        <p>{selected.depth === 1 ? `与本作品的关系：${selected.labels.join("、")}` : `经由「${entityMap.get(selected.parent ?? "")?.name ?? ""}」关联：${selected.labels.join("、")}`}</p>
        <div className="work-graph-selection-actions">
          {selected.category === "work" && <button type="button" onClick={() => onOpenWork(selected.id)}>打开它的作品图谱</button>}
          <button type="button" onClick={() => onLocate(selected.id)}>在总图谱中查看</button>
        </div>
      </div>}
      {(work.media?.length ?? 0) > 0 && <section className="work-graph-section">
        <h4>教材谱例</h4>
        <div className="work-graph-scores">{work.media!.map((asset) => <a key={asset.url} href={assetUrl(asset.url)} target="_blank" rel="noreferrer" title="打开原尺寸谱例">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" src={assetUrl(asset.url)} alt={asset.title ?? "教材谱例"} />
        </a>)}</div>
      </section>}
      {introFacts.length > 0 && <FactList title="作品要点" facts={introFacts} valueOf={valueOf} />}
      {learningFacts.length > 0 && <FactList title="学习与实践" facts={learningFacts} valueOf={valueOf} />}
      {extendedFacts.length > 0 && <FactList title="拓展知识" facts={extendedFacts} valueOf={valueOf} extended />}
    </aside>
  </section>;
}

function FactList({ title, facts, valueOf, extended }: { title: string; facts: WorkGraphRelation[]; valueOf: (relation: WorkGraphRelation) => string; extended?: boolean }) {
  return <section className={`work-graph-section ${extended ? "is-extended" : ""}`}>
    <h4>{title}{extended && <small>教材之外 · 已审阅</small>}</h4>
    <dl>{facts.map((relation) => <div key={relation.id}>
      <dt>{relation.label ?? relation.predicate}</dt>
      <dd>{valueOf(relation)}{!extended && layerOf(relation) && <em>{layerOf(relation)}</em>}</dd>
    </div>)}</dl>
  </section>;
}
