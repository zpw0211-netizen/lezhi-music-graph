"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { WorkbenchIcon } from "../WorkbenchIcon";
import { schemaCategoryMeta } from "../../graph-schema";
import { loadKnowledgeDetail } from "../../lib/graph/knowledge-detail";
import type { DetailEntity, DetailOccurrence, DetailRelationship, KnowledgeDetail } from "../../lib/graph/knowledge-detail";

type Props = {
  entity: DetailEntity; entities: Map<string, DetailEntity>; relationships: DetailRelationship[];
  occurrences: DetailOccurrence[]; books: Array<{ key: string; title: string }>;
  basePath: string; onNavigate: (entity: DetailEntity) => void; onClose: () => void;
  onAsk: (name: string) => void;
};
const templates: Record<string, Array<[string, RegExp]>> = {
  work: [["作曲 / 作词", /作曲|作词|改编/], ["民族 / 地域", /民族|地域|地区|国家/], ["体裁", /体裁/], ["速度", /速度/], ["节拍", /节拍|拍号/], ["曲式", /曲式/], ["旋律", /旋律/], ["节奏", /节奏/], ["表现主题", /主题|情绪|情感/]],
  person: [["生平", /出生|逝世|生平|年代|国籍/], ["作品", /作曲|作词|作品|创作/], ["流派", /流派|风格/], ["时代", /时代|时期|年代/]],
  theory: [["概念定义", /定义|指|是|解释/], ["核心知识", /包含|构成|要素|特点|特征/], ["相关作品 / 示例", /作品|示例|运用|体现/], ["学习进阶", /前置|深化|复现|扩展|应用于/]],
  element: [["概念定义", /定义|指|是|解释/], ["核心知识", /包含|构成|要素|特点|特征/], ["相关作品 / 示例", /作品|示例|运用|体现/], ["学习进阶", /前置|深化|复现|扩展|应用于/]],
  culture: [["地域 / 民族", /民族|地区|地域|国家|属于/], ["相关音乐 / 代表作品", /作品|民歌|来源|具有|音乐/], ["乐器", /乐器|演奏/], ["风格", /风格|特征|特点/]],
};
const safeMediaUrl = (url: string) => /^(https?:\/\/|\/?[^:/\s]+(?:\/|$))/i.test(url) && !url.startsWith("//") && !url.includes("..");
function DetailMedia({ asset, basePath }: { asset: NonNullable<DetailEntity["media"]>[number]; basePath: string }) {
  const url = /^https?:\/\//i.test(asset.url) || (basePath && asset.url.startsWith(`${basePath}/`)) ? asset.url : `${basePath}/${asset.url.replace(/^\/+/, "")}`;
  if (asset.kind === "audio") return <audio controls preload="none" src={url} />;
  if (asset.kind === "video") return <video controls preload="none" src={url} />;
  // Existing optional assets have no required image service or preset dimensions.
  // eslint-disable-next-line @next/next/no-img-element
  if (asset.kind === "image" || asset.kind === "score") return <a href={url} target="_blank" rel="noreferrer"><img loading="lazy" src={url} alt={asset.title ?? "学习资料"} /></a>;
  return <a href={url} target="_blank" rel="noreferrer">{asset.title ?? "查看资料"}</a>;
}

export function KnowledgeDetailDrawer({ entity, entities, relationships, occurrences, books, basePath, onNavigate, onClose, onAsk }: Props) {
  const [loaded, setLoaded] = useState<{ id: string; value: KnowledgeDetail | null } | null>(null);
  const [history, setHistory] = useState([entity.id]);
  const [cursor, setCursor] = useState(0);
  const scrolling = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    closeButton.current?.focus({ preventScroll: true });
    return () => { if (previous instanceof HTMLElement) previous.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    let active = true;
    void loadKnowledgeDetail(basePath, entity.id).then(value => { if (active) setLoaded({ id: entity.id, value }); });
    scrolling.current?.scrollTo(0, 0);
    return () => { active = false; };
  }, [basePath, entity.id]);
  // Graph clicks and related links use the same navigation history.
  if (history[cursor] !== entity.id) {
    const next = [...history.slice(0, cursor + 1), entity.id];
    setHistory(next); setCursor(next.length - 1);
  }
  const detail = loaded?.id === entity.id ? loaded.value : null;
  const current = detail?.entity ?? entity;
  const edges = detail?.relationships ?? relationships;
  const category = schemaCategoryMeta(entity.type);
  const facts = useMemo(() => edges.map(edge => {
    const outgoing = edge.subject === entity.id;
    const other = entities.get(outgoing ? edge.objectId ?? "" : edge.subject);
    return { edge, outgoing, other, label: edge.label ?? edge.predicate, value: other?.name ?? edge.literal ?? "" };
  }).filter(item => item.value), [edges, entities, entity.id]);
  const locations: DetailOccurrence[] = detail?.occurrences?.length ? detail.occurrences : occurrences.length ? occurrences : (entity.bookKeys ?? []).map(key => ({ id: key, textbook: key, textbookTitle: books.find(book => book.key === key)?.title ?? key, page: entity.firstPageByBook?.[key] }));
  const evidence = useMemo(() => {
    const items = edges.flatMap(edge => (edge.sources ?? []).flatMap(source => (source.evidence?.length ? source.evidence : [{ pdfPage: source.pdfPage, summary: "教材出现记录" }]).map(item => ({ ...item, bookTitle: source.bookTitle, relation: edge.label ?? edge.predicate }))));
    for (const occurrence of locations) for (const item of occurrence.evidence ?? []) items.push({ ...item, bookTitle: occurrence.textbookTitle, relation: "教材出现" });
    return [...new Map(items.map(item => [`${item.bookTitle}|${item.pdfPage}|${item.summary}`, item])).values()];
  }, [edges, locations]);
  const summary = [...new Set([current.description, ...(current.descriptions ?? [])].filter(Boolean))].join("\n");
  const renderFacts = (items: typeof facts) => items.length ? <ul className="knowledge-facts">{items.map(({ edge, outgoing, other, label, value }) => <li key={edge.id}>
    <span>{outgoing ? label : `← ${label}`}</span>{other ? <button data-related-id={other.id} onClick={() => onNavigate(other)}>{value} <WorkbenchIcon name="arrow" width="14" height="14" /></button> : <strong>{value}</strong>}
  </li>)}</ul> : <p className="knowledge-empty">现有资料未单独记录此项。</p>;
  const navigateHistory = (offset: number) => { const index = cursor + offset; const target = entities.get(history[index]); if (target) { setCursor(index); onNavigate(target); } };
  return <aside className="knowledge-detail-drawer" aria-label="知识详情" role="region" data-entity-id={entity.id} data-detail-status={loaded?.id !== entity.id ? "loading" : detail ? "loaded" : "fallback"} style={{ "--detail-accent": category.color } as CSSProperties} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}>
    <header className="knowledge-header">
      <div className="knowledge-navigation"><span>数字教材 · {category.label}</span><nav aria-label="知识浏览历史"><button disabled={cursor === 0} onClick={() => navigateHistory(-1)}><WorkbenchIcon name="left" />上一个</button><button disabled={cursor >= history.length - 1} onClick={() => navigateHistory(1)}>下一个<WorkbenchIcon name="right" /></button><button ref={closeButton} aria-label="关闭知识详情" onClick={onClose}><WorkbenchIcon name="close" /></button></nav></div>
      <h2>{current.name}</h2>
      {!!current.aliases?.length && <p className="knowledge-aliases">{current.aliases.filter(alias => alias !== current.name).join(" · ")}</p>}
      <dl className="knowledge-meta"><div><dt>实体类型</dt><dd>{current.type}</dd></div><div><dt>教材覆盖</dt><dd>{entity.textbookCount ?? entity.bookKeys?.length ?? 1} 册</dd></div><div><dt>知识关联</dt><dd>{edges.length} 条</dd></div></dl>
    </header>
    <div className="knowledge-body" ref={scrolling}>
      {loaded?.id !== entity.id && <p className="knowledge-load-status" role="status">正在读取完整资料，以下为已有图谱内容…</p>}
      {loaded?.id === entity.id && !detail && <p className="knowledge-load-status" role="status">当前展示图谱基本页面与已有教材证据。</p>}
      <section><h3>基本信息 · {category.key === "work" ? "作品简介" : category.key === "person" ? "人物简介" : category.key === "culture" ? "地域 / 民族介绍" : "知识概览"}</h3><p>{current.name} · {current.type}</p><h4>摘要</h4><p className="knowledge-summary">{summary || `该知识收录于${locations.map(item => item.textbookTitle).filter((v, i, a) => a.indexOf(v) === i).join("、") || "当前教材图谱"}。可从下方关系与教材证据继续阅读。`}</p></section>
      <section><h3>核心属性</h3>{(templates[category.key] ?? [["知识属性", /./]]).map(([title, pattern]) => <div className="knowledge-property" key={title}><h4>{title}</h4>{renderFacts(facts.filter(item => pattern.test(item.label) || (/相关作品|相关音乐/.test(title) && item.other && schemaCategoryMeta(item.other.type).key === "work")))}</div>)}</section>
      <section><h3>教材位置</h3><ul className="knowledge-locations">{locations.map(item => <li key={item.id}><strong>{item.textbookTitle}</strong><span>{item.unit || item.lesson || "教材收录"} · {item.page != null ? `PDF 第 ${item.page} 页` : "页码未记录"}</span></li>)}</ul>{!locations.length && <p className="knowledge-empty">当前节点未记录教材位置。</p>}</section>
      <section><h3>教材证据</h3>{evidence.length ? evidence.map((item, index) => <article className="knowledge-evidence" key={index}><small>{item.bookTitle} · {item.pdfPage != null ? `PDF 第 ${item.pdfPage} 页` : "页码未记录"}{item.textbookPage ? ` · 教材页码 ${item.textbookPage}` : ""}</small><p>{item.summary || "教材来源记录"}</p><span className={/拓展|补充/.test(item.region ?? "") ? "is-extended" : ""} title={item.region ?? undefined}>{item.region ? (/拓展|补充/.test(item.region) ? "拓展知识" : "教材内容") : item.relation}</span></article>) : <p className="knowledge-empty">暂无独立证据摘录，已保留上方教材位置；不能将关联关系当作原文引述。</p>}</section>
      <section><h3>知识关系</h3>{renderFacts(facts)}</section>
      <section><h3>跨册关联</h3><p>覆盖 {entity.textbookCount ?? entity.bookKeys?.length ?? 1} / 6 册 · 出现 {entity.occurrenceCount ?? locations.length} 次</p>{renderFacts(facts.filter(item => item.edge.crossBook))}</section>
      <section><h3>教学应用</h3>{renderFacts(facts.filter(item => /学习|教学|实践|任务|目标|前置|深化|扩展/.test(item.label)))}</section>
      {!!current.media?.filter(asset => safeMediaUrl(asset.url)).length && <section><h3>学习资源</h3>{current.media.filter(asset => safeMediaUrl(asset.url)).map((asset, index) => <figure key={index}><DetailMedia asset={asset} basePath={basePath} /><figcaption>{asset.title} {asset.source}</figcaption></figure>)}</section>}
      <section><h3>AI 问答入口</h3><p className="knowledge-empty">带着当前知识进入已有问答页面。</p><button className="knowledge-ask" onClick={() => onAsk(entity.name)}>了解「{entity.name}」的教材内容 <WorkbenchIcon name="arrow" /></button></section>
    </div>
  </aside>;
}
