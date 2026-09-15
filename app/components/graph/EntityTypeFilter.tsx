"use client";
import { memo } from "react";
import { ALL_SCHEMA_KEYS, type SchemaCategoryKey } from "../../graph-schema";
import type { analyzeGraphSchema } from "../../lib/graph/graph-schema-analysis";
type Props = { categories: ReturnType<typeof analyzeGraphSchema>["categories"]; visible: SchemaCategoryKey[]; onChange: (keys: SchemaCategoryKey[]) => void };
export const EntityTypeFilter = memo(function EntityTypeFilter({ categories, visible, onChange }: Props) {
  return <details className="explorer-section" open><summary>实体类型 <small>Node Labels</small></summary>
    <div className="explorer-tools"><button onClick={() => onChange([...ALL_SCHEMA_KEYS])}>全部显示</button><button onClick={() => onChange([])}>全部隐藏</button></div>
    {categories.map(category => <div className="explorer-filter-row" key={category.key}>
      <button className="explorer-filter-toggle" aria-pressed={visible.includes(category.key)} onClick={() => onChange(visible.includes(category.key) ? visible.filter(key => key !== category.key) : [...visible, category.key])}>
        <span className="semantic-dot" style={{ background: category.color }} /><span>{category.label}</span><span className="explorer-count">{category.count}</span>
      </button><button className="explorer-only" aria-label={`仅显示${category.label}`} onClick={() => onChange([category.key])}>仅此</button>
    </div>)}
  </details>;
});
