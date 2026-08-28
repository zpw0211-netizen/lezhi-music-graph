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
};

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

