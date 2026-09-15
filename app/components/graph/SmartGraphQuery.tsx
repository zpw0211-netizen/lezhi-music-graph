"use client";
import { useRef, useState } from "react";
import { planGraphQuery } from "../../lib/graph/graph-actions";
import { enrichGraph, graphAnswer, type AnswerResult, type EvidencePayload, type RagGraph } from "../../lib/ai/graph-rag";
const EXAMPLES = ["只看音乐人物", "只看作曲关系", "显示八年级音乐作品", "只看蒙古族音乐", "查找《牧歌》和蒙古族的关系", "查找进行曲相关作品", "显示节奏相关知识"];
export function SmartGraphQuery({ graph, execute, assetUrl, onGraphFocus, notice }: { graph: RagGraph | null; execute: (input: unknown) => boolean; assetUrl: (path: string) => string; onGraphFocus: (answer: AnswerResult) => void; notice: string }) {
  const [question, setQuestion] = useState(""), [answer, setAnswer] = useState<AnswerResult | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const cache = useRef(new Map<string, Promise<EvidencePayload>>());
  const submit = async (q: string) => {
    if (!graph || !q.trim() || busy) return;
    setQuestion(q); setAnswer(null); setError("");
    const plan = planGraphQuery(q, graph);
    if (!plan.actions.length) { setError(plan.explanation); return; }
    if (!execute(plan.actions)) return;
    setBusy(true);
    try {
      const scoped = plan.bookKeys.length ? { ...graph, books: graph.books.filter(book => plan.bookKeys.includes(book.key)), entities: graph.entities.filter(entity => entity.bookKeys?.some(key => plan.bookKeys.includes(key))), relationships: graph.relationships.filter(edge => edge.bookKeys?.some(key => plan.bookKeys.includes(key))), occurrences: graph.occurrences?.filter(item => plan.bookKeys.includes(item.textbook)) } : graph;
      const retrieval = await enrichGraph(scoped, q, [], key => {
        let request = cache.current.get(key);
        if (!request) { request = fetch(assetUrl(`data/evidence/${key}.json`)).then(response => { if (!response.ok) throw Error("教材证据加载失败"); return response.json() as Promise<EvidencePayload>; }); cache.current.set(key, request); request.catch(() => cache.current.delete(key)); }
        return request;
      });
      setAnswer(graphAnswer(retrieval, q));
    } catch { setError("图谱动作已执行；教材证据未能加载，未生成未经核查的解释。"); }
    finally { setBusy(false); }
  };
  return <details className="explorer-section"><summary>智能探索 <small>Graph Actions</small></summary>
    <form onSubmit={event => { event.preventDefault(); void submit(question); }}><textarea aria-label="智能探索问题" placeholder="向芽谱提问……" value={question} onChange={event => setQuestion(event.target.value)} /><button type="submit" disabled={busy || !graph}>{busy ? "检索教材证据……" : "探索图谱"}</button></form>
    <p className="explorer-hint">本地规则与 Graph + Evidence 检索；尚未接通 GPT。仅执行校验后的探索动作。</p>
    <div className="smart-examples">{EXAMPLES.map(q => <button disabled={busy} key={q} onClick={() => void submit(q)}>{q}</button>)}</div>
    {notice && <p role="status" className="explorer-hint">{notice}</p>}{error && <p role="alert">{error}</p>}
    {answer && <div className="smart-answer"><strong>【图谱事实与关联】</strong><p>{answer.shortAnswer}</p>{answer.missingKnowledge.map(item => <p className="explorer-hint" key={item}>{item}</p>)}{answer.auxiliaryExplanation && <><strong>【AI辅助解释】</strong><p>{answer.auxiliaryExplanation}</p></>}<p className="explorer-hint">{answer.evidence.filter(item => item.sourceType === "textbook_explicit").length} 条教材明确证据 · {answer.relatedEntities.length} 个关联实体</p><button onClick={() => onGraphFocus(answer)}>在图谱中查看</button></div>}
  </details>;
}
