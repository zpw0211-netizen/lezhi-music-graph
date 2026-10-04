"use client";
import { useRef, useState, useEffect } from "react";
import { enrichGraph, graphAnswer, type RagGraph, type EvidencePayload, type Turn, type AnswerResult } from "../../lib/ai/graph-rag";
import { PendingKnowledge } from "./PendingKnowledge";
import { WorkbenchIcon } from "../WorkbenchIcon";

// 首页示例问题分「学生常问 / 备课常用」两组，全部逐题跑过本地图谱问答
// （scripts/test-sample-questions.mjs）：答案非空、引用教材证据、口径为 supported。
// 增删问题必须同步复跑该脚本。
export const SAMPLE_QUESTIONS = {
  student: [
    { q: "《歌唱祖国》是谁写的？", tag: "词曲作者" },
    { q: "《义勇军进行曲》是谁作曲的？", tag: "词曲作者" },
    { q: "什么是五声调式？", tag: "乐理知识" },
    { q: "琵琶属于哪类乐器？", tag: "乐器常识" },
    { q: "《游击队歌》的音乐特点是什么？", tag: "作品解读" },
  ],
  teacher: [
    { q: "哪些作品用了 2/4 拍？", tag: "按知识点选曲" },
    { q: "序曲赏听单元有哪些作品？", tag: "按单元选曲" },
    { q: "哪些作品适合作为合唱曲目？", tag: "按形式选曲" },
    { q: "哪些作品的曲作者是贺绿汀？", tag: "按作者选曲" },
    { q: "备课：哪些作品可以用来讲进行曲？", tag: "备课专题" },
  ],
} as const;
type Message = { question: string; result: AnswerResult };
const citationPageLabel = (textbookPage: string | number, pdfPage: number | null) => {
  const printedPage = String(textbookPage ?? "").trim();
  return /^\d+(?:\s*[-–—]\s*\d+)?$/.test(printedPage)
    ? `教材第 ${printedPage} 页`
    : `PDF 第 ${pdfPage ?? "—"} 页`;
};
// 教材单元目录（public/data/units.json，与按课学习页同一数据源）的最小类型。
type UnitCatalog = { bookKey: string; id: string; name: string; title: string; works: { id: string; name: string; pdfPage?: number | null; summary?: string | null }[] };
// 「某单元有哪些作品」必须按正式单元目录完整列出（T010）：图谱检索沿知识关系
// 边走，只答出有联系的作品，会误导教师以为单元只有这几首。此函数为纯函数，
// scripts/test-sample-questions.mjs 会从本文件提取它，断言"回答作品数 =
// 单元目录作品数"；修改签名或内部依赖时必须同步该脚本的提取逻辑。
export const unitWorksAnswer = (question: string, units: UnitCatalog[], books: { key: string; title: string }[], base: AnswerResult): AnswerResult | null => {
  const key = (value: string) => String(value ?? "").toLowerCase().replace(/[《》“”"'\s，。！？、：；·（）()]/g, "");
  if (!/单元/.test(question) || !/作品|曲目|歌曲/.test(question) || !Array.isArray(units) || !units.length) return null;
  const term = key(question);
  const matched = units
    .filter(unit => (unit.title && term.includes(key(unit.title))) || (unit.name && term.includes(key(unit.name))))
    .sort((a, b) => key(b.title).length - key(a.title).length)[0];
  const works = matched?.works ?? [];
  if (!matched || !works.length) return null;
  const bookTitle = books.find(book => book.key === matched.bookKey)?.title ?? matched.bookKey;
  const shortAnswer = `${matched.name}（${bookTitle}）按教材单元目录共收录 ${works.length} 首作品：${works.map((work, index) => `${index + 1}.${work.name}`).join("；")}。`;
  const unitEvidence = works.map(work => ({ id: `unit:${matched.id}:${work.id}`, bookKey: matched.bookKey, bookTitle, pdfPage: work.pdfPage ?? null, textbookPage: "", summary: work.summary ?? "", sourceType: "textbook_explicit" as const }));
  return { ...base, answer: shortAnswer, shortAnswer, evidence: [...unitEvidence, ...base.evidence.filter(item => !unitEvidence.some(unit => unit.id === item.id))], confidence: "supported", missingKnowledge: base.missingKnowledge.filter(item => !/没有找到足够的相关教材内容|没有找到教材明确说明/.test(item)) };
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
      promise = fetch(assetUrl(`data/evidence/${key}.json`)).then(async response => { if (!response.ok) throw new Error("教材出处读取失败"); return response.json() as Promise<EvidencePayload>; });
      cache.current.set(key, promise); promise.catch(() => cache.current.delete(key));
    }
    return promise;
  };
  // 单元目录懒加载：只在遇到单元类问题时请求一次，失败则退回常规图谱问答。
  const unitsCache = useRef<Promise<UnitCatalog[]> | null>(null);
  const loadUnits = () => {
    if (!unitsCache.current) unitsCache.current = fetch(assetUrl("data/units.json")).then(async response => response.ok ? await response.json() as UnitCatalog[] : [] as UnitCatalog[]).catch(() => [] as UnitCatalog[]);
    return unitsCache.current;
  };
  const bookTitles = graph.books.map(book => ({ key: book.key, title: book.title }));
  const submit = async (value = question) => {
    const q = value.trim(); if (!q || busy) return;
    setBusy(true); setError(""); setQuestion("");
    const history: Turn[] = messages.slice(-6).map(message => ({ question: message.question, answer: message.result.answer, resolvedEntities: message.result.relatedEntities.slice(0, message.result.intent === "compare" || message.result.intent === "path" ? 2 : 1).map(entity => entity.id) }));
    try {
      const retrieval = await enrichGraph(graph, q, history, load);
      let result = graphAnswer(retrieval, q);
      // 单元类问题按正式单元目录完整列出作品（T010），未命中则保持原回答。
      const unitResult = unitWorksAnswer(q, await loadUnits(), bookTitles, result);
      if (unitResult) result = unitResult;
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
  const renderComposer = (hero = false) => <form className={`assistant-composer${hero ? " assistant-composer-hero" : ""}`} onSubmit={event => { event.preventDefault(); void submit(); }}><label className="assistant-composer-label" htmlFor="textbook-question">问问教材知识</label><textarea id="textbook-question" placeholder="输入作品或乐理问题，也可以比较不同教材中的内容……" aria-label="向芽谱提问" value={question} onChange={event => setQuestion(event.target.value)} maxLength={1000} rows={2} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(); } }} /><div><label><select aria-label="回答模式" value={mode} onChange={e => setMode(e.target.value)}><option value="normal">普通问答</option><option value="analysis">深度分析</option></select></label><button type="submit" disabled={!question.trim() || busy}>{busy ? "查询中" : <>提问 <WorkbenchIcon name="arrow" /></>}</button></div><small>回答会标出依据的教材内容；补充解释会单独说明，不代表教材原文。回答不会修改教材资料。</small></form>;
  return <section className={`assistant-page${messages.length ? "" : " is-empty"}`} aria-label="智能问答">
    <header className="assistant-page-header"><span><WorkbenchIcon name="book" /> 教材知识问答</span><button onClick={() => setMessages([])} disabled={busy}>新对话</button></header>
    <div className="assistant-scroll" aria-live="polite">
      {!messages.length && <div className="assistant-welcome" data-reveal><span className="assistant-kicker">六册教材 · 智能问答</span><h1>今天想从音乐教材里了解什么？</h1><p>回答依据六册教材整理。教材明确写出的内容和根据教材归纳的知识联系会分开标注，并附上页码，方便你查看。</p>{renderComposer(true)}<div className="assistant-samples" data-reveal-group>{Object.entries(SAMPLE_QUESTIONS).map(([group, items]) => <section className="assistant-sample-group" key={group}><h2>{group === "student" ? "学生常问" : "备课常用"}</h2>{items.map(item => <button key={item.q} data-reveal type="button" onClick={() => submit(item.q)} disabled={busy}><span className="assistant-suggestion-tag">{item.tag}</span><span>{item.q}</span></button>)}</section>)}</div></div>}
      {messages.map((message, index) => <article className="assistant-turn" key={index}><h2>{message.question}</h2><small>{message.result.poweredBy === "gpt" ? "AI 辅助回答" : "根据教材知识联系回答"} · {message.result.confidence === "supported" ? "有教材依据" : "教材出处有限"}</small><p className="assistant-answer">{message.result.answer}</p>{message.result.auxiliaryExplanation && <section><h3>【AI辅助解释】</h3><p>{message.result.auxiliaryExplanation}</p></section>}<details className="assistant-evidence"><summary>【教材明确内容与知识归纳】（{message.result.evidence.length}）</summary>{message.result.evidence.slice(0, 30).map(e => <p key={e.id}><strong>{e.bookTitle} · {citationPageLabel(e.textbookPage, e.pdfPage)}</strong><small className={e.sourceType === "textbook_explicit" ? "is-explicit" : "is-induced"}>{e.sourceType === "textbook_explicit" ? "教材明确内容" : "根据教材内容归纳"}</small>{e.summary}</p>)}</details><div className="assistant-related">{message.result.relatedEntities.slice(0, 12).map(entity => <button key={entity.id} onClick={() => onGraphFocus({ ...message.result, relatedEntities: [entity], relatedRelationships: [], graphFocus: { nodeIds: [entity.id], relationshipIds: [] } })}>{entity.name}</button>)}</div><button className="assistant-graph-link" onClick={() => onGraphFocus(message.result)} disabled={!message.result.graphFocus.nodeIds.length}>查看相关知识 →</button><div className="assistant-followups">{message.result.suggestedQuestions.map(q => <button key={q} disabled={busy} onClick={() => submit(q)}>{q}</button>)}</div><PendingKnowledge candidates={message.result.candidateKnowledge} /><small className="assistant-service-notice">{message.result.serviceNotice}</small></article>)}
      {busy && <p className="assistant-busy">正在查找教材内容…</p>}{error && <p role="alert">{error}</p>}
    </div>
    {messages.length > 0 && renderComposer()}
  </section>;
}
