"use client";
import { useMemo, useState } from "react";
import { EntityTypeFilter } from "./EntityTypeFilter";
import { RelationshipFilter } from "./RelationshipFilter";
import { PropertyFilter } from "./PropertyFilter";
import { SmartGraphQuery } from "./SmartGraphQuery";
import { analyzeGraphSchema } from "../../lib/graph/graph-schema-analysis";
import type { GraphPerspective } from "../../lib/graph/types";
import type { FilterBook, GraphFilters } from "../../hooks/useGraphFilters";
import type { AnswerResult, RagGraph } from "../../lib/ai/graph-rag";
type View = "graph" | "assistant" | "research" | "records" | "import";
export function GraphSidebar({ view, onView, graph, books, scopeBook, filters, perspective, onPerspective, onSchema, onSources, onReset, execute, notice, assetUrl, onGraphFocus }: { view: View; onView: (view: View) => void; graph: RagGraph | null; books: FilterBook[]; scopeBook?: string; filters: GraphFilters; perspective: GraphPerspective; onPerspective: (value: GraphPerspective) => void; onSchema: () => void; onSources: () => void; onReset: () => void; execute: (input: unknown) => boolean; notice: string; assetUrl: (path: string) => string; onGraphFocus: (answer: AnswerResult) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const schema = useMemo(() => analyzeGraphSchema(scopeBook ? graph?.entities.filter(entity => entity.bookKeys?.includes(scopeBook)) ?? [] : graph?.entities ?? [], scopeBook ? graph?.relationships.filter(edge => edge.bookKeys?.includes(scopeBook)) ?? [] : graph?.relationships ?? []), [graph, scopeBook]);
  return <aside className={`sidebar explorer-sidebar ${collapsed ? "is-collapsed" : ""}`} aria-label="图谱导航与控制">
    <div className="explorer-brand"><span className="explorer-brand-mark">芽</span>{!collapsed && <div><strong>芽谱</strong><small>中小学音乐教育知识图谱</small></div>}<button aria-label={collapsed ? "展开左侧栏" : "折叠左侧栏"} onClick={() => setCollapsed(!collapsed)}>{collapsed ? "›" : "‹"}</button></div>
    <nav className="explorer-nav">{([["graph", "图谱探索", "◎"], ["assistant", "智能问答", "✧"], ["records", "作品档案", "▤"], ["research", "研究分析", "▦"]] as const).map(([key, label, icon]) => <button key={key} title={label} aria-label={label} className={view === key ? "active" : ""} onClick={() => onView(key)}><span>{icon}</span>{!collapsed && label}</button>)}</nav>
    {!collapsed && view === "graph" && <div className="explorer-controls"><section className="explorer-perspective"><h3>图谱视角</h3><div>{([["comprehensive", "综合知识"], ["textbook", "教材结构"], ["music", "音乐知识"], ["progression", "学习进阶"]] as const).map(([key, label]) => <button key={key} aria-pressed={perspective === key} onClick={() => onPerspective(key)}>{label}</button>)}</div></section>
      <EntityTypeFilter categories={schema.categories} visible={filters.visibleSchemaKeys} onChange={filters.setVisibleSchemaKeys} />
      <RelationshipFilter relations={schema.relations} hidden={filters.hiddenRelations} onChange={filters.setHiddenRelations} onSources={onSources} />
      <PropertyFilter books={books} filters={filters} />
      <details className="explorer-section explorer-schema-section"><summary>知识模式 <small>Schema</small></summary>
        <button className="explorer-schema-button" onClick={onSchema}>查看实体与关系模式 <span>↗</span></button>
      </details>
      <SmartGraphQuery graph={graph} execute={execute} assetUrl={assetUrl} onGraphFocus={onGraphFocus} notice={notice} />
      <button className="explorer-reset" onClick={onReset}>恢复全部筛选</button><p className="explorer-hint">规范实体 {graph?.entities.length ?? 0} · 规范关系 {graph?.relationships.length ?? 0}</p>
    </div>}
    {!collapsed && <button className="explorer-import" onClick={() => onView("import")}>数据导入与校验</button>}
  </aside>;
}
