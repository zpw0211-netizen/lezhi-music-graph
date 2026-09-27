"use client";
import { useRef, useState, useEffect } from "react";
import { enrichGraph, graphAnswer, type RagGraph, type EvidencePayload, type Turn, type AnswerResult } from "../../lib/ai/graph-rag";
import { PendingKnowledge } from "./PendingKnowledge";
import { WorkbenchIcon } from "../WorkbenchIcon";

const questions = [
  { q: "《游击队歌》的音乐特点是什么？", tag: "作品解读", icon: "music" },
  { q: "七至九年级关于节奏的知识是怎样逐步发展的？", tag: "知识进阶", icon: "layers" },
  { q: "教材中有哪些蒙古族音乐作品？", tag: "民族音乐", icon: "book" },
  { q: "《保卫黄河》和哪些音乐知识点有关？", tag: "知识关联", icon: "graph" },
] as const;
type Message = { question: string; result: AnswerResult };
const citationPageLabel = (textbookPage: string | number, pdfPage: number | null) => {
  const printedPage = String(textbookPage ?? "").trim();
  return /^\d+(?:\s*[-–—]\s*\d+)?$/.test(printedPage)
    ? `教材第 ${printedPage} 页`
    : `PDF 第 ${pdfPage ?? "—"} 页`;
};
export function AssistantPage({ graph, assetUrl, initialQuestion = "", onGraphFocus }: { graph: RagGraph; assetUrl: (path: string) => string; initialQuestion?: string; onGraphFocus: (result: AnswerResult) => void }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("normal");
  const cache = useRef(new Map<string, Promise<EvidencePayload>>());
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const load = (key: string) => {
    let promise = cache.current.get(key);
    if (!promise) {
      promise = fetch(assetUrl(`data/evidence/${key}.json`)).then(async response => { if (!response.ok) throw new Error("教材证据读取失败"); return response.json() as Promise<EvidencePayload>; });
      cache.current.set(key, promise); promise.catch(() => cache.current.delete(key));
    }
    return promise;
  };
  const submit = async (value = question) => {
    const q = value.trim(); if (!q || busy) return;
    setBusy(true); setError(""); setQuestion("");
    const history: Turn[] = messages.slice(-6).map(message => ({ question: message.question, answer: message.result.answer, resolvedEntities: message.result.relatedEntities.slice(0, message.result.intent === "compare" || message.result.intent === "path" ? 2 : 1).map(entity => entity.id) }));
    try {
      const retrieval = await enrichGraph(graph, q, history, load);
      let result = graphAnswer(retrieval, q);
      const endpoint = process.env.NEXT_PUBLIC_AI_API_URL?.trim();
      if (endpoint) {
        try {
          if (new URL(endpoint).protocol !== "https:") throw new Error("AI API 必须使用 HTTPS");
          const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q, history, mode }), signal: AbortSignal.timeout(55000) });
          if (!response.ok) throw new Error("AI 服务不可用");
          const remote = await response.json() as AnswerResult & { ok?: boolean };
          if (!remote.ok || typeof remote.answer !== "string" || !Array.isArray(remote.evidence) || !Array.isArray(remote.relatedEntities) || !remote.graphFocus) throw new Error("AI 返回格式异常");
          result = remote;
        } catch { result.serviceNotice = "AI 助手暂时没有回应，本轮回答根据教材中整理的知识联系生成。"; }
      } else result.serviceNotice = "当前回答根据教材中整理的知识联系生成，尚未接入 AI 大模型。";
      if (alive.current) setMessages(previous => [...previous, { question: q, result }].slice(-30));
    } catch { if (alive.current) { setError("教材内容加载失败，请稍后重试。没有教材依据时，不会把回答当作教材原文。"); setQuestion(q); } }
    finally { if (alive.current) setBusy(false); }
  };
  const submitRef = useRef(submit);
  useEffect(() => { submitRef.current = submit; });
  const initialSubmitted = useRef(false);
  useEffect(() => { if (initialQuestion && !initialSubmitted.current) { initialSubmitted.current = true; void submitRef.current(initialQuestion); } }, [initialQuestion]);
  return <section className="assistant-page" aria-label="智能问答">
    <header className="assistant-page-header"><span><WorkbenchIcon name="book" /> 教材知识问答</span><button onClick={() => setMessages([])} disabled={busy}>新对话</button></header>
    <div className="assistant-scroll" aria-live="polite">
      {!messages.length && <div className="assistant-welcome"><span className="assistant-welcome-badge"><WorkbenchIcon name="sprout" /></span><h1>今天想从音乐教材里了解什么？</h1><p>回答依据六册教材整理。教材明确写出的内容和根据教材归纳的知识联系会分开标注，并附上页码，方便你查看。</p><div className="assistant-suggestions">{questions.map(item => <button key={item.q} onClick={() => submit(item.q)} disabled={busy}><span className="assistant-suggestion-tag"><WorkbenchIcon name={item.icon} />{item.tag}</span>{item.q}</button>)}</div></div>}
      {messages.map((message, index) => <article className="assistant-turn" key={index}><h2>{message.question}</h2><small>{message.result.poweredBy === "gpt" ? "AI 辅助回答" : "根据教材知识联系回答"} · {message.result.confidence === "supported" ? "有教材依据" : "证据有限"}</small><p className="assistant-answer">{message.result.answer}</p>{message.result.auxiliaryExplanation && <section><h3>【AI辅助解释】</h3><p>{message.result.auxiliaryExplanation}</p></section>}<details className="assistant-evidence"><summary>【教材明确内容与知识归纳】（{message.result.evidence.length}）</summary>{message.result.evidence.slice(0, 30).map(e => <p key={e.id}><strong>{e.bookTitle} · {citationPageLabel(e.textbookPage, e.pdfPage)}</strong><small>{e.sourceType === "textbook_explicit" ? "教材明确内容" : "根据教材内容归纳"}</small>{e.summary}</p>)}</details><div className="assistant-related">{message.result.relatedEntities.slice(0, 12).map(entity => <button key={entity.id} onClick={() => onGraphFocus({ ...message.result, relatedEntities: [entity], relatedRelationships: [], graphFocus: { nodeIds: [entity.id], relationshipIds: [] } })}>{entity.name}</button>)}</div><button className="assistant-graph-link" onClick={() => onGraphFocus(message.result)} disabled={!message.result.graphFocus.nodeIds.length}>查看相关知识 →</button><div className="assistant-followups">{message.result.suggestedQuestions.map(q => <button key={q} disabled={busy} onClick={() => submit(q)}>{q}</button>)}</div><PendingKnowledge candidates={message.result.candidateKnowledge} /><small className="assistant-service-notice">{message.result.serviceNotice}</small></article>)}
      {busy && <p className="assistant-busy">正在查找教材内容…</p>}{error && <p role="alert">{error}</p>}
    </div>
    <form className="assistant-composer" onSubmit={event => { event.preventDefault(); void submit(); }}><label className="assistant-composer-label" htmlFor="textbook-question">问问教材知识</label><textarea id="textbook-question" placeholder="输入作品或乐理问题，也可以比较不同教材中的内容……" aria-label="向芽谱提问" value={question} onChange={event => setQuestion(event.target.value)} maxLength={1000} rows={2} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(); } }} /><div><label><select aria-label="回答模式" value={mode} onChange={e => setMode(e.target.value)}><option value="normal">普通问答</option><option value="analysis">深度分析</option></select></label><button type="submit" disabled={!question.trim() || busy}>{busy ? "查询中" : <>提问 <WorkbenchIcon name="arrow" /></>}</button></div><small>回答会标出依据的教材内容；补充解释会单独说明，不代表教材原文。回答不会修改教材资料。</small></form>
  </section>;
}
