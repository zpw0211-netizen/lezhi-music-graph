"use client";
import { memo, useState } from "react";
import type { analyzeGraphSchema } from "../../lib/graph/graph-schema-analysis";
type Props = { relations: ReturnType<typeof analyzeGraphSchema>["relations"]; hidden: string[]; onChange: (names: string[]) => void; onSources: () => void };
export const RelationshipFilter = memo(function RelationshipFilter({ relations, hidden, onChange, onSources }: Props) {
  const [query, setQuery] = useState("");
  return <details className="explorer-section"><summary>知识联系类型</summary>
    <div className="explorer-tools"><button onClick={() => onChange([])}>恢复全部知识联系</button></div>
    <input aria-label="筛选知识联系名称" placeholder="筛选知识联系名称" value={query} onChange={event => setQuery(event.target.value)} />
    <div className="explorer-relation-list">{relations.filter(row => row.name.includes(query)).map(row => <div className="explorer-filter-row" key={row.name}>
      <button className="explorer-filter-toggle" aria-pressed={!hidden.includes(row.name)} onClick={() => { if (hidden.includes(row.name) && row.kind === "provenance") onSources(); onChange(hidden.includes(row.name) ? hidden.filter(name => name !== row.name) : [...hidden, row.name]); }}>
        <span className={`edge-sample edge-${row.kind}`} /><span>{row.name}</span><span className="explorer-count">{row.count}</span>
      </button><button className="explorer-only" aria-label={`只看${row.name}知识联系`} onClick={() => { if (row.kind === "provenance") onSources(); onChange(relations.filter(item => item.name !== row.name).map(item => item.name)); }}>仅此</button>
    </div>)}</div>
    <p className="explorer-hint">概览默认收起作品包含、泛化包含和编者出版信息；可在此重新开启。筛选只控制显示，不修改教材数据。</p>
  </details>;
});
