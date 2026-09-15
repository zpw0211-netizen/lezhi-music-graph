"use client";
import { useRef, useState, useEffect } from "react";
import { enrichGraph, graphAnswer, type RagGraph, type EvidencePayload, type Turn, type AnswerResult } from "../../lib/ai/graph-rag";

const questions = ["《游击队歌》的音乐特点是什么？", "七至九年级关于节奏的知识是怎样逐步发展的？", "教材中有哪些蒙古族音乐作品？", "《保卫黄河》和哪些音乐知识点有关？"];
type Message = { question: string; result: AnswerResult };
export function AssistantPage({ graph, assetUrl, onGraphFocus }: { graph: RagGraph; assetUrl: (path: string) => string; onGraphFocus: (result: AnswerResult) => void }) {
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
        } catch { result.serviceNotice = "远程 AI 服务未响应，本轮使用本地图谱回答。"; }
      } else result.serviceNotice = "尚未配置远程 AI API。本轮是本地图谱检索回答，未调用 GPT。";
      if (alive.current) setMessages(previous => [...previous, { question: q, result }].slice(-30));
    } catch { if (alive.current) { setError("教材证据加载失败，请稍后重试。不会在缺少证据时生成教材事实。"); setQuestion(q); } }
    finally { if (alive.current) setBusy(false); }
  };
  return <section className="assistant-page" aria-label="智能问答">
    <header className="assistant-page-header"><span>智能问答</span><button onClick={() => setMessages([])} disabled={busy}>新对话</button></header>
    <div className="assistant-scroll" aria-live="polite">
      {!messages.length && <div className="assistant-welcome"><h1>今天想从音乐教材里了解什么？</h1><p>探索作品、音乐知识与六册教材中的关联。</p><div className="assistant-suggestions">{questions.map(q => <button key={q} onClick={() => submit(q)} disabled={busy}>{q}</button>)}</div></div>}
      {messages.map((message, index) => <article className="assistant-turn" key={index}><h2>{message.question}</h2><small>{message.result.poweredBy === "gpt" ? "AI 辅助回答" : "本地图谱回答"} · {message.result.confidence === "supported" ? "有教材依据" : "证据有限"}</small><p className="assistant-answer">{message.result.answer}</p>{message.result.auxiliaryExplanation && <section><h3>【AI辅助解释】</h3><p>{message.result.auxiliaryExplanation}</p></section>}<details className="assistant-evidence"><summary>【图谱事实】 · 教材依据（{message.result.evidence.length}）</summary>{message.result.evidence.slice(0, 30).map(e => <p key={e.id}><strong>{e.bookTitle} · PDF 第 {e.pdfPage ?? "—"} 页{e.textbookPage ? ` · 教材第 ${e.textbookPage} 页` : ""}</strong><small>{e.sourceType === "textbook_explicit" ? "教材明确知识" : "教材归纳 / 图谱关系记录"}</small>{e.summary}</p>)}</details><div className="assistant-related">{message.result.relatedEntities.slice(0, 12).map(entity => <button key={entity.id} onClick={() => onGraphFocus({ ...message.result, graphFocus: { nodeIds: [entity.id], relationshipIds: [] } })}>{entity.name}</button>)}</div><button className="assistant-graph-link" onClick={() => onGraphFocus(message.result)} disabled={!message.result.graphFocus.nodeIds.length}>在图谱中查看 →</button><div className="assistant-followups">{message.result.suggestedQuestions.map(q => <button key={q} disabled={busy} onClick={() => submit(q)}>{q}</button>)}</div><small className="assistant-service-notice">{message.result.serviceNotice}</small></article>)}
      {busy && <p className="assistant-busy">正在检索教材关系与证据…</p>}{error && <p role="alert">{error}</p>}
    </div>
    <form className="assistant-composer" onSubmit={event => { event.preventDefault(); void submit(); }}><textarea placeholder="向芽谱提问……" aria-label="向芽谱提问" value={question} onChange={event => setQuestion(event.target.value)} maxLength={1000} rows={2} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(); } }} /><div><label><select aria-label="回答模式" value={mode} onChange={e => setMode(e.target.value)}><option value="normal">普通问答</option><option value="analysis">深度分析</option></select></label><button type="submit" disabled={!question.trim() || busy}>{busy ? "检索中" : "发送 ↑"}</button></div><small>回答可追溯教材证据；补充解释不等于教材事实。AI 不会修改正式图谱。</small></form>
  </section>;
}
