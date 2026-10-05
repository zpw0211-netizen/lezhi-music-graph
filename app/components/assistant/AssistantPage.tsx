"use client";
import { useRef, useState, useEffect, type KeyboardEvent, type MouseEvent } from "react";
import { enrichGraph, graphAnswer, type RagGraph, type EvidencePayload, type AnswerResult } from "../../lib/ai/graph-rag";
import { PendingKnowledge } from "./PendingKnowledge";

// 首页示例问题分「学生常问 / 备课常用」两组，全部逐题跑过本地图谱问答
// （scripts/test-sample-questions.mjs）：答案非空、引用教材证据、口径为 supported。
// 增删问题必须同步复跑该脚本。
export const SAMPLE_QUESTIONS = {
  student: [
    { q: "《歌唱祖国》是谁写的？", tag: "作品解读 · 词曲作者", hint: "人音版七年级上册 · 词曲作者与创作背景" },
    { q: "《游击队歌》的音乐特点是什么？", tag: "音乐特点 · 节奏动机", hint: "人音版八年级下册 · 小军鼓动机与前八后十六" },
    { q: "什么是五声调式？", tag: "乐理常识 · 调式体系", hint: "宫、商、角、徵、羽五阶民族调式" },
    { q: "《义勇军进行曲》是谁作曲的？", tag: "词曲作者 · 国歌", hint: "人音版七年级上册 · 中华人民共和国国歌" },
    { q: "琵琶属于哪类乐器？", tag: "乐器常识 · 民族乐器", hint: "民族乐器分类 · 弹拨乐器" },
  ],
  teacher: [
    { q: "序曲赏听单元有哪些作品？", tag: "单元备课 · 单元曲目", hint: "人音版七年级下册 · 单元收录全部曲目" },
    { q: "哪些作品用了 2/4 拍？", tag: "按知识点选曲 · 节拍", hint: "节拍节奏 · 进行曲与舞曲常用节拍" },
    { q: "哪些作品适合作为合唱曲目？", tag: "按形式选曲 · 合唱", hint: "演唱形式 · 多声部与合唱曲目" },
    { q: "哪些作品的曲作者是贺绿汀？", tag: "按作者选曲 · 作曲家", hint: "中国近现代作曲家 · 作品名录" },
    { q: "备课：哪些作品可以用来讲进行曲？", tag: "备课专题 · 进行曲", hint: "音乐体裁 · 教学选曲与曲目推荐" },
  ],
} as const;

type Message = { question: string; result: AnswerResult };

const citationPageLabel = (textbookPage: string | number, pdfPage: number | null) => {
  const printedPage = String(textbookPage ?? "").trim();
  return /^\d+(?:\s*[-–—]\s*\d+)?$/.test(printedPage)
    ? `第 ${printedPage} 页`
    : `PDF 第 ${pdfPage ?? "—"} 页`;
};

const NUMERALS_FORMAL = ["〔壹〕", "〔贰〕", "〔叁〕", "〔肆〕", "〔伍〕", "〔陆〕", "〔柒〕", "〔捌〕", "〔玖〕", "〔拾〕"];
const NUMERALS_SIMPLE = [
  "〔一〕", "〔二〕", "〔三〕", "〔四〕", "〔五〕", "〔六〕", "〔七〕", "〔八〕", "〔九〕", "〔十〕",
  "〔十一〕", "〔十二〕", "〔十三〕", "〔十四〕", "〔十五〕", "〔十六〕", "〔十七〕", "〔十八〕", "〔十九〕", "〔二十〕",
  "〔二十一〕", "〔二十二〕", "〔二十三〕", "〔二十四〕", "〔二十五〕", "〔二十六〕", "〔二十七〕", "〔二十八〕", "〔二十九〕", "〔三十〕"
];

const getFormalNumeral = (index: number) => NUMERALS_FORMAL[index] || `〔${index + 1}〕`;
const getSimpleNumeral = (index: number) => NUMERALS_SIMPLE[index] || `〔${index + 1}〕`;

// 教材单元目录（public/data/units.json，与按课学习页同一数据源）的最小类型。
type UnitCatalog = { bookKey: string; id: string; name: string; title: string; works: { id: string; name: string; pdfPage?: number | null; summary?: string | null }[] };

// 「某单元有哪些作品」必须按正式单元目录完整列出（T010）：图谱检索沿知识关系
// 边走，只答出有联系的作品，会误导教师以为单元只有这几首。此函数为纯函数，
// scripts/test-sample-questions.mjs 会从本文件提取它，断言"回答作品数 =
// 单元目录作品数"；修改签名或内部依赖时必须同步该脚本的提取逻辑。
export const unitWorksAnswer = (question: string, units: UnitCatalog[], books: { key: string; title: string }[], base: AnswerResult): AnswerResult | null => {
  const key = (value: string) => String(value ?? "").toLowerCase().replace(/[《》“”"'s，。！？、：；·（）()]/g, "");
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

export function AssistantPage({
  graph,
  assetUrl,
  initialQuestion = "",
  onGraphFocus,
}: {
  graph: RagGraph;
  assetUrl: (path: string) => string;
  initialQuestion?: string;
  onGraphFocus: (result: AnswerResult) => void;
}) {
  const [question, setQuestion] = useState("");
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [inkAnim, setInkAnim] = useState(false);
  const [footnotesExpanded, setFootnotesExpanded] = useState(true);
  const [highlightedFootnoteId, setHighlightedFootnoteId] = useState<string | null>(null);

  const [units, setUnits] = useState<UnitCatalog[]>([]);
  useEffect(() => {
    let active = true;
    fetch(assetUrl("data/units.json"))
      .then(response => response.json())
      .then(data => { if (active && Array.isArray(data)) setUnits(data as UnitCatalog[]); })
      .catch(() => {});
    return () => { active = false; };
  }, [assetUrl]);

  const cache = useRef(new Map<string, Promise<EvidencePayload>>());
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const loadEvidence = (key: string) => {
    let promise = cache.current.get(key);
    if (!promise) {
      promise = fetch(assetUrl(`data/evidence/${key}.json`)).then(async response => {
        if (!response.ok) throw new Error("教材出处读取失败");
        return response.json() as Promise<EvidencePayload>;
      });
      cache.current.set(key, promise);
    }
    return promise;
  };

  const submit = async (rawQuestion?: string) => {
    const q = (rawQuestion ?? question).trim();
    if (!q || busy) return;
    setBusy(true);
    setError("");
    setHighlightedFootnoteId(null);
    try {
      const retrieval = await enrichGraph(graph, q, [], loadEvidence);
      const base = graphAnswer(retrieval, q);
      const result = unitWorksAnswer(q, units, graph.books, base) ?? base;
      if (alive.current) {
        setCurrentMessage({ question: q, result });
        setQuestion("");
        setInkAnim(true);
        setFootnotesExpanded(true);
      }
    } catch {
      if (alive.current) {
        setError("教材内容加载失败，请稍后重试。没有教材依据时，不会把回答当作教材原文。");
        setQuestion(q);
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const submitRef = useRef(submit);
  useEffect(() => { submitRef.current = submit; });

  const initialSubmitted = useRef(false);
  useEffect(() => {
    if (initialQuestion && !initialSubmitted.current) {
      initialSubmitted.current = true;
      void submitRef.current(initialQuestion);
    }
  }, [initialQuestion]);

  const handleReset = () => {
    setCurrentMessage(null);
    setQuestion("");
    setHighlightedFootnoteId(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFnClick = (e: MouseEvent, fnId: string) => {
    e.preventDefault();
    setFootnotesExpanded(true);
    setHighlightedFootnoteId(fnId);
    setTimeout(() => {
      const element = document.getElementById(fnId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 50);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  };

  // 格式化当前问答的段落与出处元数据
  const paragraphs = currentMessage
    ? currentMessage.result.answer.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    : [];

  const sourceInfo = currentMessage && currentMessage.result.evidence.length > 0
    ? (() => {
        const first = currentMessage.result.evidence[0];
        const uniqueBooks = Array.from(new Set(currentMessage.result.evidence.map(e => e.bookTitle)));
        if (uniqueBooks.length > 1) {
          return `${first.bookTitle} 等 ${uniqueBooks.length} 册教材`;
        }
        return `${first.bookTitle}${first.unit ? ` ${first.unit}` : ""}`;
      })()
    : "六册教材知识";

  const confidenceText = currentMessage
    ? currentMessage.result.confidence === "supported"
      ? (currentMessage.result.evidence.some(e => e.sourceType === "textbook_explicit") ? "教材明确记载" : "有教材依据")
      : currentMessage.result.confidence === "limited"
      ? "教材出处有限"
      : "教材依据不足"
    : "";

  const placeholderText = currentMessage
    ? `已提问：“${currentMessage.question}” · 输入新问题回车可重查……`
    : "输入你想向六册教材询问的问题，例如“《歌唱祖国》是谁写的？”……";

  return (
    <section className={`assistant-page${currentMessage ? "" : " is-empty"}`} aria-label="智能问答">
      <main className="stage" id="stage">
        <article className="book-folio" id="folio">
          {/* 书眉 / 鱼尾栏 */}
          <header className="folio-header">
            <div className="folio-header-title">
              <span className="seal-mark">问</span>
              <span className="folio-full-title">人音版初中音乐教材 · 教材问答</span>
              <span className="folio-short-title">教材问答</span>
            </div>
            <div className="folio-header-actions">
              <button
                className="reset-btn"
                id="btn-reset"
                type="button"
                onClick={handleReset}
                disabled={busy}
              >
                新对话
              </button>
            </div>
          </header>

          {/* 书页主体 */}
          <div className="folio-body">
            {/* 状态一：空页（展示签条） */}
            {!currentMessage && (
              <section className="state-empty" id="state-empty">
                <div className="opening-banner">
                  <div className="opening-kicker">以书相问 · 字字有据</div>
                  <h1 className="opening-title">“这里的回答，只来自六册教材。”</h1>
                  <p className="opening-lead">
                    向人音版七至九年级音乐教材提问。无预设套话，不做大模型臆测；每个答案均提取自教材曲谱、正文解析与课后活动，注脚标注册别与实物页码，随查随验。
                  </p>
                </div>

                <div className="bookmarks-section">
                  {/* 学生常问 */}
                  <div className="bookmark-group">
                    <div className="bookmark-group-label">
                      <i />
                      <strong>学生常问 · 签条</strong>
                      <span>点击在教材中查释</span>
                    </div>
                    <div className="bookmark-list" id="student-bookmarks">
                      {SAMPLE_QUESTIONS.student.map(item => (
                        <button
                          key={item.q}
                          className="bookmark-slip"
                          type="button"
                          onClick={() => void submit(item.q)}
                          disabled={busy}
                        >
                          <span className="slip-cord">
                            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <circle cx="8" cy="8" r="5" stroke="#1F4A3C" strokeWidth="1.5" />
                              <line x1="8" y1="13" x2="8" y2="16" stroke="#1F4A3C" strokeWidth="1.5" />
                            </svg>
                          </span>
                          <span className="slip-tag">{item.tag}</span>
                          <span className="slip-q">{item.q}</span>
                          <span className="slip-hint">{item.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 备课常用 */}
                  <div className="bookmark-group">
                    <div className="bookmark-group-label teacher">
                      <i />
                      <strong>备课常用 · 签条</strong>
                      <span>面向一线音乐教师单元设计</span>
                    </div>
                    <div className="bookmark-list" id="teacher-bookmarks">
                      {SAMPLE_QUESTIONS.teacher.map(item => (
                        <button
                          key={item.q}
                          className="bookmark-slip teacher"
                          type="button"
                          onClick={() => void submit(item.q)}
                          disabled={busy}
                        >
                          <span className="slip-cord">
                            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <circle cx="8" cy="8" r="5" stroke="#916319" strokeWidth="1.5" />
                              <line x1="8" y1="13" x2="8" y2="16" stroke="#916319" strokeWidth="1.5" />
                            </svg>
                          </span>
                          <span className="slip-tag">{item.tag}</span>
                          <span className="slip-q">{item.q}</span>
                          <span className="slip-hint">{item.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 查询中 */}
            {busy && (
              <div className="assistant-busy-box" aria-live="polite">
                <p className="assistant-busy">正在查找六册教材内容，研墨题写中…</p>
              </div>
            )}

            {/* 错误提示 */}
            {error && <p className="assistant-error" role="alert">{error}</p>}

            {/* 状态二：问答展示态（题词 + 正文 + 注脚） */}
            {currentMessage && (
              <article className="state-qa assistant-turn" id="state-qa">
                {/* 题写提问 */}
                <div className="qa-inscription">
                  <div className="qa-inscription-tag">问题</div>
                  <h2 className="qa-question-text" id="qa-question-text">{currentMessage.question}</h2>
                  <div className="qa-meta">
                    <span>教材出处：<b className="qa-meta-source" id="qa-meta-source">{sourceInfo}</b></span>
                    <span>·</span>
                    <span>教材依据：<span id="qa-meta-count">{currentMessage.result.evidence.length} 处出处</span></span>
                    <span>·</span>
                    <span>可信度：{confidenceText}</span>
                  </div>
                </div>

                {/* 正文排版 */}
                <div
                  className={`qa-answer-block assistant-answer${inkAnim ? " ink-fade-in" : ""}`}
                  id="qa-answer-block"
                  onAnimationEnd={() => setInkAnim(false)}
                >
                  {paragraphs.map((p, pIdx) => {
                    const sealNumeral = getFormalNumeral(pIdx);
                    const ev = currentMessage.result.evidence[pIdx];
                    const fnId = `fn-${pIdx}`;
                    const fnLabel = ev ? `${getSimpleNumeral(pIdx)}${ev.bookTitle} · ${citationPageLabel(ev.textbookPage, ev.pdfPage)}` : null;
                    return (
                      <p className="qa-paragraph" key={pIdx}>
                        <span className="mark-seal">{sealNumeral}</span>
                        {p}
                        {ev && fnLabel && (
                          <a
                            className="fn-ref"
                            href={`#${fnId}`}
                            data-fn={fnId}
                            title="查看教材出处原文"
                            onClick={e => handleFnClick(e, fnId)}
                          >
                            {fnLabel}
                          </a>
                        )}
                      </p>
                    );
                  })}
                </div>

                {/* 关联知识联系标签 */}
                {currentMessage.result.relatedEntities.length > 0 && (
                  <div className="qa-tags-row" id="qa-tags-row">
                    <span className="qa-tags-row-label">知识联系：</span>
                    <div id="qa-tags-container" style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap" }}>
                      {currentMessage.result.relatedEntities.slice(0, 12).map(entity => (
                        <button
                          key={entity.id}
                          type="button"
                          className="qa-tag-chip"
                          onClick={() => onGraphFocus({
                            ...currentMessage.result,
                            relatedEntities: [entity],
                            relatedRelationships: [],
                            graphFocus: { nodeIds: [entity.id], relationshipIds: [] },
                          })}
                          title="在知识图谱中查看此知识点"
                        >
                          {entity.name}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="assistant-graph-link"
                      onClick={() => onGraphFocus(currentMessage.result)}
                      disabled={!currentMessage.result.graphFocus.nodeIds.length}
                    >
                      查看相关知识 →
                    </button>
                  </div>
                )}

                {/* 追问建议 */}
                {currentMessage.result.suggestedQuestions.length > 0 && (
                  <div className="assistant-followups">
                    <span className="qa-tags-row-label">继续提问：</span>
                    {currentMessage.result.suggestedQuestions.map(q => (
                      <button key={q} type="button" disabled={busy} onClick={() => void submit(q)}>
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* AI 辅助解释（若有） */}
                {currentMessage.result.auxiliaryExplanation && (
                  <div className="qa-auxiliary-box">
                    <h3 className="qa-auxiliary-title">【AI辅助解释】</h3>
                    <p>{currentMessage.result.auxiliaryExplanation}</p>
                  </div>
                )}

                {/* 页脚注：展开见原文 */}
                {currentMessage.result.evidence.length > 0 && (
                  <section className="qa-footnotes-panel" id="qa-footnotes-panel">
                    <div className="footnotes-header">
                      <div className="footnotes-title">
                        <span className="seal-text">出处</span>
                        <strong>教材出处与原文</strong>
                        <span id="footnotes-count-badge" style={{ color: "var(--ink-3)", fontSize: "12px" }}>
                          （{currentMessage.result.evidence.length}处）
                        </span>
                      </div>
                      <button
                        className="footnotes-toggle-btn"
                        id="footnotes-toggle-btn"
                        type="button"
                        onClick={() => setFootnotesExpanded(!footnotesExpanded)}
                      >
                        {footnotesExpanded ? "收起原文" : "展开见原文"}
                      </button>
                    </div>

                    {footnotesExpanded && (
                      <div className="footnote-slips-list" id="footnote-slips-list">
                        {currentMessage.result.evidence.slice(0, 30).map((ev, index) => {
                          const numeral = getSimpleNumeral(index);
                          const pageStr = citationPageLabel(ev.textbookPage, ev.pdfPage);
                          const isExplicit = ev.sourceType === "textbook_explicit";
                          const isHighlighted = highlightedFootnoteId === `fn-${index}`;
                          return (
                            <div
                              key={ev.id || index}
                              className={`footnote-slip-item${isHighlighted ? " highlighted" : ""}`}
                              id={`fn-${index}`}
                              onClick={() => setHighlightedFootnoteId(`fn-${index}`)}
                            >
                              <div className="fn-header">
                                <div className="fn-head-left">
                                  <span>{numeral}</span>
                                  <span>{ev.bookTitle} · {pageStr}</span>
                                </div>
                                <span className={`fn-tag ${isExplicit ? "explicit" : "induced"}`}>
                                  {isExplicit ? "教材明确记载" : "根据教材内容归纳"}
                                </span>
                              </div>
                              {ev.summary && (
                                <p className="fn-quote">{ev.summary}</p>
                              )}
                              <div className="fn-extra">
                                <span className="fn-score-badge">✦ 教材出处：{ev.bookTitle}{ev.unit ? ` · ${ev.unit}` : ""}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* 审计及无障碍辅助说明：【教材明确内容与知识归纳】 */}
                <div className="sr-only" aria-hidden="true" style={{ display: "none" }}>
                  【教材明确内容与知识归纳】
                </div>

                <PendingKnowledge candidates={currentMessage.result.candidateKnowledge} />
              </article>
            )}
          </div>

          {/* 底部落笔输入区：细墨线 + 楷体提示 */}
          <footer className="composer-bottom">
            <form
              id="composer-form"
              onSubmit={e => {
                e.preventDefault();
                void submit();
              }}
            >
              <div className="pen-line-wrap">
                <svg
                  className="brush-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18" />
                  <path d="M2 2l7.586 7.586" />
                  <circle cx="11" cy="11" r="2" />
                </svg>
                <textarea
                  className="pen-input"
                  id="pen-input"
                  aria-label="向芽谱提问"
                  placeholder={placeholderText}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="inscribe-btn"
                  id="inscribe-btn"
                  disabled={!question.trim() || busy}
                >
                  <span>提问</span>
                  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
                  </svg>
                </button>
              </div>
            </form>
            <div className="modest-notice">
              <span>※ 这里的回答只来自六册教材内容，尚未接入 AI 大模型。所引页码皆可在纸质课本中翻查实证。</span>
              <span className="seal-text">只用教材内容回答</span>
            </div>
          </footer>
        </article>
      </main>
    </section>
  );
}
