"use client";

export type QualityMetrics = {
  canonical: {
    totalNodes: number;
    totalRelationships: number;
    sharedEntityCount: number;
    isolatedNodeCount: number;
    connectedComponentCount: number;
    largestConnectedComponentNodeCount: number;
    danglingRelationshipCount: number;
    evidenceCoveredRelationshipCount?: number;
    evidenceCoverageRate?: number;
  };
  raw: {
    duplicateEntityGroupCount: number;
  };
  sourceLayers?: Array<{ bookKey: string; title: string; reread: boolean; 教材明示: number; 乐谱可见: number; 教材归纳: number; 拓展知识: number; 其他: number }>;
};

const LAYERS = ["教材明示", "乐谱可见", "教材归纳", "拓展知识"] as const;

/** 知识来源构成: per-book counts by source layer, for research reporting. */
export function SourceLayerPanel({ quality }: { quality: QualityMetrics }) {
  const rows = quality.sourceLayers ?? [];
  if (!rows.length) return null;
  return (
    <section className="source-layer-panel" aria-labelledby="source-layer-title">
      <header>
        <div>
          <span>KNOWLEDGE PROVENANCE</span>
          <h3 id="source-layer-title">知识来源构成</h3>
        </div>
        <small>教材内容 = 明示 + 乐谱 + 归纳</small>
      </header>
      <table>
        <thead>
          <tr><th>教材</th>{LAYERS.map((layer) => <th key={layer}>{layer}</th>)}<th>合计</th><th>教材内容占比</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const total = LAYERS.reduce((sum, layer) => sum + row[layer], 0) + row.其他;
            const textbook = row.教材明示 + row.乐谱可见 + row.教材归纳;
            return (
              <tr key={row.bookKey}>
                <th>{row.title.replace("人音版", "")}{!row.reread && <small>待重新提取</small>}</th>
                {LAYERS.map((layer) => <td key={layer}>{row[layer] || "—"}</td>)}
                <td>{total}</td>
                <td>{row.reread ? `${Math.round((textbook / total) * 100)}%` : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

const fmt = (value: number) => value.toLocaleString("zh-CN");

export function QualityPanel({ quality }: { quality: QualityMetrics }) {
  const items = [
    ["规范实体", fmt(quality.canonical.totalNodes)],
    ["关系", fmt(quality.canonical.totalRelationships)],
    ["跨册实体", fmt(quality.canonical.sharedEntityCount)],
    ["孤立节点", fmt(quality.canonical.isolatedNodeCount)],
    ["连通分量", fmt(quality.canonical.connectedComponentCount)],
    ["最大连通分量", fmt(quality.canonical.largestConnectedComponentNodeCount)],
    ["重复实体候选", fmt(quality.raw.duplicateEntityGroupCount)],
    ["悬空关系", fmt(quality.canonical.danglingRelationshipCount)],
    [
      "Evidence 覆盖率",
      `${Math.round((quality.canonical.evidenceCoverageRate ?? 0) * 1000) / 10}%`,
    ],
  ];
  return (
    <section className="quality-panel" aria-labelledby="quality-title">
      <header>
        <div>
          <span>CANONICAL GRAPH AUDIT</span>
          <h3 id="quality-title">图谱质量</h3>
        </div>
        <b>{quality.canonical.isolatedNodeCount === 0 ? "连通" : "需检查"}</b>
      </header>
      <dl>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        指标由构建期数据质量审计与规范实体图实时生成，不使用演示数字。
      </p>
    </section>
  );
}

