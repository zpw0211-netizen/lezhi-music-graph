import { pendingCandidates } from "../../lib/ai/pending-candidates";
export function PendingKnowledge({ candidates }: { candidates: unknown }) {
  const rows = pendingCandidates(candidates);
  if (!rows.length) return null;
  return <section className="pending-knowledge"><h3>发现候选知识 · pending</h3><p>以下内容仅供待核查展示，不会写入正式图谱。</p>{rows.map((row, i) => <article key={i}><strong>{row.subject} → {row.predicate} → {row.object}</strong><dl><dt>来源</dt><dd>{row.source}</dd><dt>证据</dt><dd>{row.evidence}</dd><dt>页码</dt><dd>{row.page ?? "待核查"}</dd><dt>置信度</dt><dd>{row.confidence}</dd><dt>理由</dt><dd>{row.reason}</dd><dt>状态</dt><dd>pending</dd></dl></article>)}</section>;
}
