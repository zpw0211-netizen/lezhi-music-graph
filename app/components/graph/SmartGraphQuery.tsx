"use client";
import { useRef, useState } from "react";
import { planGraphQuery } from "../../lib/graph/graph-actions";
import { enrichGraph, graphAnswer, type AnswerResult, type EvidencePayload, type RagGraph } from "../../lib/ai/graph-rag";
const formatPageReferences = (text: string) =>
  text.replace(/(教材|PDF)?\s*第\s*(\d+(?:\s*[-–—]\s*\d+)?)\s*页/g, (_match, label: string | undefined, page: string) => `${label === "PDF" ? "PDF " : label ?? ""}第 ${page.trim()} 页`);
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
    } catch { setError("已更新相关知识，但教材依据暂时无法读取，因此没有生成补充解释。"); }
    finally { setBusy(false); }
  };
  return <details className="explorer-section"><summary>智能探索 <small>问题查找</small></summary>
    <form onSubmit={event => { event.preventDefault(); void submit(question); }}><textarea aria-label="智能探索问题" placeholder="向芽谱提问……" value={question} onChange={event => setQuestion(event.target.value)} /><button type="submit" disabled={busy || !graph}>{busy ? "检索教材依据……" : "查找相关知识"}</button></form>
    <p className="explorer-hint">根据你的问题查找教材中的相关内容；暂未接入 AI 大模型。</p>
    <div className="smart-examples">{EXAMPLES.map(q => <button disabled={busy} key={q} onClick={() => void submit(q)}>{q}</button>)}</div>
    {notice && <p role="status" className="explorer-hint">{notice}</p>}{error && <p role="alert">{error}</p>}
    {answer && <div className="smart-answer"><strong>【教材明确内容与知识归纳】</strong><p>{formatPageReferences(answer.shortAnswer)}</p>{answer.missingKnowledge.map(item => <p className="explorer-hint" key={item}>{formatPageReferences(item)}</p>)}{answer.auxiliaryExplanation && <><strong>【AI辅助解释】</strong><p>{formatPageReferences(answer.auxiliaryExplanation)}</p></>}<p className="explorer-hint">{answer.evidence.filter(item => item.sourceType === "textbook_explicit").length} 条教材依据 · {answer.relatedEntities.length} 项相关知识</p><button onClick={() => onGraphFocus(answer)}>查看相关知识</button></div>}
  </details>;
}
