"use client";
import { memo } from "react";
import { SCHEMA_CATEGORIES } from "../../graph-schema";
import { DEFAULT_PROPERTIES, type FilterBook, type GraphFilters, type PropertyFilters } from "../../hooks/useGraphFilters";
export const PropertyFilter = memo(function PropertyFilter({ books, filters }: { books: FilterBook[]; filters: GraphFilters }) {
  const p = filters.properties;
  const update = (key: keyof PropertyFilters, value: string | string[]) => filters.setProperties(current => ({ ...current, [key]: value }));
  const toggle = (key: "books" | "grades" | "semesters", value: string) => update(key, p[key].includes(value) ? p[key].filter(item => item !== value) : [...p[key], value]);
  return <details className="explorer-section"><summary>属性筛选 <small>Properties</small></summary>
    <div className="property-fields"><fieldset><legend>教材（可多选）</legend>{books.map(book => <label key={book.key}><input type="checkbox" checked={p.books.includes(book.key)} onChange={() => toggle("books", book.key)} />{book.title}</label>)}</fieldset>
      <fieldset><legend>年级</legend>{["7", "8", "9"].map(grade => <label key={grade}><input type="checkbox" checked={p.grades.includes(grade)} onChange={() => toggle("grades", grade)} />{grade} 年级</label>)}</fieldset>
      <fieldset><legend>学期</legend>{["上册", "下册"].map(semester => <label key={semester}><input type="checkbox" checked={p.semesters.includes(semester)} onChange={() => toggle("semesters", semester)} />{semester}</label>)}</fieldset>
      <label>实体类型<select aria-label="属性实体类型" value={p.entityType} onChange={event => update("entityType", event.target.value)}><option value="all">全部类型</option>{SCHEMA_CATEGORIES.map(category => <option key={category.key} value={category.key}>{category.label}</option>)}</select></label>
      <label>跨册实体<select aria-label="跨册实体" value={p.crossBook} onChange={event => update("crossBook", event.target.value)}><option value="all">全部</option><option value="yes">至少出现于两册</option><option value="no">单册独有</option></select></label>
      <label>最低置信度<select aria-label="最低置信度" value={p.minConfidence} onChange={event => update("minConfidence", event.target.value)}>{["0", "0.8", "0.9", "0.95", "1"].map(value => <option key={value} value={value}>{value === "0" ? "不限" : value}</option>)}</select></label>
      <label>教材明确证据<select aria-label="教材明确证据" value={p.evidence} onChange={event => update("evidence", event.target.value)}><option value="all">不限</option><option value="yes">存在教材明确证据</option><option value="no">暂无教材明确证据</option></select></label>
      {p.evidence !== "all" && <p role="status" className="explorer-hint">{filters.evidenceStatus === "loading" ? "正在按需核对教材证据……" : filters.evidenceStatus === "error" ? "证据加载失败，未将未知证据当作已确认。" : "证据依据教材明示 / 乐谱可见及页码判定。"}</p>}
      <label>相关知识<input aria-label="属性相关知识" placeholder="例如：蒙古族" value={p.keyword} onChange={event => update("keyword", event.target.value)} /></label>
      <p className="explorer-hint">各条件取交集；相关知识包含一跳语义关联。</p><button onClick={() => filters.setProperties({ ...DEFAULT_PROPERTIES })}>清除属性条件</button>
    </div>
  </details>;
});
