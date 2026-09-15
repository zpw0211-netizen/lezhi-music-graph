"use client";
import { memo, useMemo, useState } from "react";
import { type SchemaCategoryKey } from "../../graph-schema";
import { analyzeGraphSchema } from "../../lib/graph/graph-schema-analysis";
import type { GraphEntity, GraphRelationship } from "../../lib/graph/types";
export const SchemaExplorer = memo(function SchemaExplorer({ entities, relationships, onInstances }: { entities: GraphEntity[]; relationships: GraphRelationship[]; onInstances: (types: SchemaCategoryKey[], relation?: string) => void }) {
  const schema = useMemo(() => analyzeGraphSchema(entities, relationships), [entities, relationships]);
  const [selected, setSelected] = useState<string | null>(null);
  const positions = useMemo(() => new Map(schema.categories.map((category, i) => [category.key, { x: 430 + Math.cos(i / schema.categories.length * Math.PI * 2 - Math.PI / 2) * 285, y: 290 + Math.sin(i / schema.categories.length * Math.PI * 2 - Math.PI / 2) * 210 }])), [schema.categories]);
  return <section className="schema-explorer" aria-label="知识模式 Schema">
    <div className="schema-heading"><h2>知识模式 <small>Schema</small></h2><p>实体类别 → 关系类型 → 实体类别 · 点击类型返回实例图</p></div>
    <svg viewBox="0 0 860 580" role="img" aria-label="实体类别与关系类型聚合图">
      {schema.edges.map((edge, i) => { const a = positions.get(edge.source as SchemaCategoryKey)!, b = positions.get(edge.target as SchemaCategoryKey)!; const midX = (a.x + b.x) / 2 + (i % 5 - 2) * 12, midY = (a.y + b.y) / 2 + (i % 7 - 3) * 12; return <g key={edge.id}><path d={edge.source === edge.target ? `M ${a.x - 25} ${a.y - 15} C ${a.x - 110} ${a.y - 110}, ${a.x + 100} ${a.y - 105}, ${a.x + 25} ${a.y - 15}` : `M ${a.x} ${a.y} Q ${midX} ${midY}, ${b.x} ${b.y}`} fill="none" stroke={selected === edge.source || selected === edge.target ? "#a1a1aa" : "#e4e4e7"} strokeWidth={Math.min(3, 0.5 + Math.log2(edge.count + 1) / 5)}><title>{edge.predicate} · {edge.count} 个实例</title></path></g>; })}
      {schema.categories.map(category => { const point = positions.get(category.key)!; return <g key={category.key} data-schema-category={category.key} role="button" tabIndex={0} aria-label={`查看${category.label}实例`} onMouseEnter={() => setSelected(category.key)} onMouseLeave={() => setSelected(null)} onClick={() => onInstances([category.key])} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") onInstances([category.key]); }}><circle cx={point.x} cy={point.y} r={42} fill={category.color} /><text x={point.x} y={point.y + 66} textAnchor="middle">{category.label}</text><text x={point.x} y={point.y + 5} textAnchor="middle" fill="white">{category.count}</text></g>; })}
    </svg>
    <div className="schema-edge-table"><p>{schema.edges.length} 种类别关系组合 · {schema.literalCount} 条字面属性关系不绘为虚构实体</p><table><thead><tr><th>源类别</th><th>关系</th><th>目标类别</th><th>实例数</th></tr></thead><tbody>{schema.edges.map(edge => <tr key={edge.id} onClick={() => onInstances([edge.source, edge.target] as SchemaCategoryKey[], edge.predicate)}><td>{schema.categories.find(c => c.key === edge.source)?.label}</td><td><button>{edge.predicate}</button></td><td>{schema.categories.find(c => c.key === edge.target)?.label}</td><td>{edge.count}</td></tr>)}</tbody></table></div>
  </section>;
});
