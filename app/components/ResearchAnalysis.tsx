"use client";

import { useMemo, useState } from "react";
import { schemaCategoryMeta } from "../graph-schema";
import { QualityPanel, type QualityMetrics } from "./QualityPanel";

type ResearchBook = {
  key: string;
  title: string;
  grade: number;
  semester: string;
};

type ResearchEntity = {
  id: string;
  name: string;
  type: string;
  bookKeys?: string[];
  textbookCount?: number;
  occurrenceCount?: number;
  degree?: number;
  relationCount?: number;
};

type ResearchRelationship = {
  id: string;
  subject: string;
  objectId?: string | null;
};

type Props = {
  books: ResearchBook[];
  entities: ResearchEntity[];
  relationships: ResearchRelationship[];
  quality: QualityMetrics;
  onSelectPair: (leftBook: string, rightBook: string, entityIds: string[]) => void;
  onSelectEntity: (entity: ResearchEntity) => void;
};

const shortBook = (book: ResearchBook) => `${book.grade}${book.semester === "上册" ? "上" : "下"}`;

export function ResearchAnalysis({
  books,
  entities,
  relationships,
  quality,
  onSelectPair,
  onSelectEntity,
}: Props) {
  const [metric, setMetric] = useState<"shared" | "jaccard">("shared");
  const entityByBook = useMemo(() => {
    const result = new Map<string, Set<string>>();
    for (const book of books) result.set(book.key, new Set());
    for (const entity of entities) {
      if (entity.type === "教材") continue;
      for (const bookKey of entity.bookKeys ?? []) result.get(bookKey)?.add(entity.id);
    }
    return result;
  }, [books, entities]);

  const degree = useMemo(() => {
    const result = new Map<string, number>();
    for (const relationship of relationships) {
      result.set(relationship.subject, (result.get(relationship.subject) ?? 0) + 1);
      if (relationship.objectId)
        result.set(relationship.objectId, (result.get(relationship.objectId) ?? 0) + 1);
    }
    return result;
  }, [relationships]);

  const matrix = useMemo(
    () =>
      books.map((left) =>
        books.map((right) => {
          const leftSet = entityByBook.get(left.key) ?? new Set<string>();
          const rightSet = entityByBook.get(right.key) ?? new Set<string>();
          const sharedIds = [...leftSet].filter((id) => rightSet.has(id));
          const union = new Set([...leftSet, ...rightSet]).size;
          return {
            sharedIds,
            shared: sharedIds.length,
            jaccard: union ? sharedIds.length / union : 0,
          };
        }),
      ),
    [books, entityByBook],
  );

  const topKnowledge = useMemo(
    () =>
      entities
        .filter((entity) => entity.type !== "教材" && (entity.textbookCount ?? 1) >= 2)
        .map((entity) => ({
          ...entity,
          calculatedDegree: degree.get(entity.id) ?? entity.degree ?? 0,
        }))
        .sort(
          (a, b) =>
            (b.textbookCount ?? 0) - (a.textbookCount ?? 0) ||
            (b.occurrenceCount ?? 0) - (a.occurrenceCount ?? 0) ||
            b.calculatedDegree - a.calculatedDegree,
        )
        .slice(0, 20),
    [degree, entities],
  );

  return (
    <section className="research-analysis" aria-labelledby="research-analysis-title">
      <header className="research-analysis-header">
        <div>
          <h2 id="research-analysis-title">六册教材知识结构研究分析</h2>
          <p>基于规范实体融合、教材出现记录与图谱审计结果进行关联查询。</p>
        </div>
        <div className="research-method-note">
          <b>研究口径</b>
          <span>同名同类型实体先融合，再计算教材覆盖与网络结构。</span>
        </div>
      </header>

      <div className="research-grid">
        <section className="matrix-panel">
          <header>
            <div>
              <span>TEXTBOOK ASSOCIATION</span>
              <h3>六册教材关联矩阵</h3>
            </div>
            <div className="matrix-metric-toggle" aria-label="关联指标">
              <button className={metric === "shared" ? "active" : ""} onClick={() => setMetric("shared")}>共享实体</button>
              <button className={metric === "jaccard" ? "active" : ""} onClick={() => setMetric("jaccard")}>Jaccard</button>
            </div>
          </header>
          <div className="matrix-scroll">
            <table>
              <thead>
                <tr>
                  <th>教材</th>
                  {books.map((book) => <th key={book.key}>{shortBook(book)}</th>)}
                </tr>
              </thead>
              <tbody>
                {books.map((left, row) => (
                  <tr key={left.key}>
                    <th>{shortBook(left)}</th>
                    {books.map((right, column) => {
                      const cell = matrix[row]?.[column];
                      const value = metric === "shared" ? cell.shared : Math.round(cell.jaccard * 1000) / 1000;
                      const intensity = row === column ? 0.08 : Math.min(0.72, 0.08 + cell.jaccard * 1.8);
                      return (
                        <td key={right.key}>
                          <button
                            title={`${left.title} × ${right.title}：${cell.shared} 个共享规范实体`}
                            style={{ backgroundColor: `rgba(47,107,255,${intensity})` }}
                            onClick={() => onSelectPair(left.key, right.key, cell.sharedIds)}
                          >
                            {metric === "shared" ? value : Number(value).toFixed(3)}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>点击任一单元格，进入两册教材共享知识子图。</p>
        </section>

        <section className="core-ranking-panel">
          <header>
            <div>
              <span>CROSS-TEXTBOOK CORE</span>
              <h3>跨册核心知识 Top 20</h3>
            </div>
            <small>覆盖册数优先</small>
          </header>
          <div className="core-ranking-head">
            <span>知识 / 类型</span><span>教材</span><span>出现</span><span>度</span><span>关系</span>
          </div>
          <ol>
            {topKnowledge.map((entity, index) => {
              const semantic = schemaCategoryMeta(entity.type);
              return (
                <li key={entity.id}>
                  <button onClick={() => onSelectEntity(entity)}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <i style={{ background: semantic.color }} />
                    <span><strong>{entity.name}</strong><small>{semantic.label}</small></span>
                    <em>{entity.textbookCount ?? 1}/6</em>
                    <em>{entity.occurrenceCount ?? 1}</em>
                    <em>{entity.calculatedDegree}</em>
                    <em>{entity.relationCount ?? entity.calculatedDegree}</em>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <QualityPanel quality={quality} />
      </div>
    </section>
  );
}
