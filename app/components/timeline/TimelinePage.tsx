"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { publicAssetUrl } from "../../lib/app/assets";
import type { AppRoute } from "../../lib/app/routing";
import { BOOKS, UNKNOWN, filterWorks, groupWorks, personDates, withPrintedPages, workHref, workRoute, type AtlasTimelineData, type TimelineData, type TimelinePerson, type TimelineWork } from "./timelineModel";

type Evidence = { textbookPage?: string; pdfPage?: number; summary?: string };
type EvidenceFile = { evidenceByTriple: Record<string, Evidence[]> };
type BookFile = { triples: { id: string; subject: string; predicate: string; literal?: string; objectId?: string }[]; entities: { id: string; name: string }[]; evidenceByTriple: Record<string, Evidence[]> };
type SourceRow = { book: string; tripleId: string; text: string; evidence?: Evidence };
const cache = new Map<string, Promise<unknown>>();
const TIMELINE_SCROLL_KEY = "yapu.timeline.scrollTop";
function loadJson<T>(path: string): Promise<T> {
  if (!cache.has(path)) cache.set(path, fetch(publicAssetUrl(`data/${path}`)).then(response => {
    if (!response.ok) throw new Error("教材来源读取失败，请重试。");
    return response.json();
  }).catch(error => { cache.delete(path); throw error; }));
  return cache.get(path) as Promise<T>;
}
function sourceText(book: string, evidence?: Evidence) {
  const pages = [evidence?.textbookPage ? `教材第 ${evidence.textbookPage} 页` : "教材页码未标注", evidence?.pdfPage != null ? `PDF 第 ${evidence.pdfPage} 页` : ""];
  return `人民音乐出版社 · ${BOOKS[book] ?? book} · ${pages.filter(Boolean).join(" · ")}`;
}
async function personSources(person: TimelinePerson): Promise<SourceRow[]> {
  return (await Promise.all((person.lifetimeEvidence ?? []).map(async source => {
    const file = await loadJson<BookFile>(`books/${source.bookKey}.json`);
    return (file.evidenceByTriple[source.tripleId]?.length ? file.evidenceByTriple[source.tripleId] : [undefined])
      .map(evidence => ({ book: source.bookKey, tripleId: source.tripleId, text: source.text, evidence }));
  }))).flat();
}
function Sources({ work, person, related }: { work?: TimelineWork; person?: TimelinePerson; related?: TimelineWork[] }) {
  const [rows, setRows] = useState<SourceRow[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const request = work?.yearEvidence ? loadJson<EvidenceFile>(`evidence/${work.bookKey}.json`).then(file =>
      (file.evidenceByTriple[work.yearEvidence!.tripleId]?.length ? file.evidenceByTriple[work.yearEvidence!.tripleId] : [undefined]).map(evidence => ({ book: work.bookKey, tripleId: work.yearEvidence!.tripleId, text: `${work.yearEvidence!.relation}：${work.yearText}`, evidence }))) : person ? personSources(person) : Promise.resolve([]);
    request.then(rows => { if (active) { setRows(rows); setError(""); } }).catch(error => { if (active) setError(error instanceof Error ? error.message : "教材来源读取失败。"); });
    return () => { active = false; };
  }, [work, person, attempt]);
  return <div className="timeline-evidence">
    {error ? <p role="alert">{error} <button type="button" onClick={() => setAttempt(value => value + 1)}>重试</button></p> : rows === null ? <p role="status">正在读取教材来源…</p> : rows.length ? rows.map((row, index) => <div key={`${row.book}:${row.tripleId}:${index}`}><p>{row.text}</p><p>{sourceText(row.book, row.evidence)}</p><p>证据编号：<code>{row.tripleId}</code></p></div>) : <p>{UNKNOWN}，没有可展示的年代证据编号。</p>}
    {work && <p>章节：{work.unit ?? "教材未归入单元"} · 人民音乐出版社 · {BOOKS[work.bookKey]}</p>}
    {person && <><p>教材来源：{person.sourceEntities.map(source => BOOKS[source.bookKey] ?? source.bookKey).join("、")}</p><p>相关作品章节：{[...new Set(related?.map(work => `${BOOKS[work.bookKey]} · ${work.unit ?? "教材未归入单元"}`))].join("；") || "教材未标注"}</p></>}
  </div>;
}
function followWorkLink(event: MouseEvent<HTMLAnchorElement>, work: TimelineWork, onOpenWork: (route: AppRoute) => void) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  onOpenWork(workRoute(work));
}
function WorkRow({ work, people, onOpenWork }: { work: TimelineWork; people: TimelinePerson[]; onOpenWork: (route: AppRoute) => void }) {
  const [expanded, setExpanded] = useState(false);
  return <li className="timeline-work">
    <p className="timeline-date">{work.yearText ?? UNKNOWN}</p>
    <div><h3><a href={workHref(work)} onClick={event => followWorkLink(event, work, onOpenWork)}>{work.name}</a></h3><p className="timeline-meta">{BOOKS[work.bookKey]} · {work.unit ?? "教材未归入单元"}{work.printedPage != null && <> · 教材第{work.printedPage}页</>}</p>
      {people.length > 0 && <p className="timeline-meta">相关人物：{people.map(person => person.name).join("、")}</p>}
      <details onToggle={event => setExpanded(event.currentTarget.open)}><summary>年代依据与教材来源</summary>{expanded && <Sources work={work} />}</details>
    </div>
  </li>;
}
function PersonRow({ person, works, onOpenWork }: { person: TimelinePerson; works: TimelineWork[]; onOpenWork: (route: AppRoute) => void }) {
  const [expanded, setExpanded] = useState(false);
  return <li className="timeline-person"><h3>{person.name}</h3><p className="timeline-date">{personDates(person)}</p><p className="timeline-meta">相关作品：{works.map((work, index) => <span key={`${work.bookKey}:${work.id}`}>{index > 0 ? "、" : ""}<a href={workHref(work)} onClick={event => followWorkLink(event, work, onOpenWork)}>{work.name}<small>（{BOOKS[work.bookKey]}）</small></a></span>)}</p><details onToggle={event => setExpanded(event.currentTarget.open)}><summary>人物年代依据与教材来源</summary>{expanded && <Sources person={person} related={works} />}</details></li>;
}
export function TimelinePage({ onOpenWork }: { onOpenWork: (route: AppRoute) => void }) {
  const [data, setData] = useState<TimelineData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [book, setBook] = useState("");
  const [query, setQuery] = useState("");
  const [activeEra, setActiveEra] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const openWork = useCallback((route: AppRoute) => {
    const workspace = root.current?.closest<HTMLElement>(".workspace");
    const scrollTop = workspace?.scrollTop || window.scrollY;
    try { window.sessionStorage.setItem(TIMELINE_SCROLL_KEY, String(scrollTop)); } catch { /* Scroll restoration remains best-effort when storage is blocked. */ }
    onOpenWork(route);
  }, [onOpenWork]);
  useEffect(() => {
    const navigation = root.current?.closest("main")?.querySelector('nav[aria-label="主导航"]');
    if (!navigation) return;
    const measure = () => root.current?.style.setProperty("--timeline-nav-height", `${navigation.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(navigation);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([
      loadJson<TimelineData>("timeline.json"),
      loadJson<AtlasTimelineData>("atlas.json").catch(() => null),
    ]).then(([timeline, atlas]) => {
      if (active) { setData(atlas ? withPrintedPages(timeline, atlas) : timeline); setError(""); }
    }).catch(error => { if (active) setError(error instanceof Error ? error.message : "年表资料读取失败。"); });
    return () => { active = false; };
  }, [attempt]);
  useEffect(() => {
    if (!data) return;
    let saved: string | null = null;
    try { saved = window.sessionStorage.getItem(TIMELINE_SCROLL_KEY); } catch { /* Ignore unavailable session storage. */ }
    if (saved === null) return;
    const scrollTop = Number(saved);
    if (!Number.isFinite(scrollTop) || scrollTop < 0) {
      try { window.sessionStorage.removeItem(TIMELINE_SCROLL_KEY); } catch { /* Ignore unavailable session storage. */ }
      return;
    }
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const workspace = root.current?.closest<HTMLElement>(".workspace");
        if (workspace) workspace.scrollTop = scrollTop;
        window.scrollTo(0, scrollTop);
        try { window.sessionStorage.removeItem(TIMELINE_SCROLL_KEY); } catch { /* Ignore unavailable session storage. */ }
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [data]);
  const works = useMemo(() => data ? filterWorks(data, book, query) : [], [data, book, query]);
  const groups = useMemo(() => groupWorks(works), [works]);
  const people = useMemo(() => data?.people.filter(person => person.works.some(id => works.some(work => work.id === id))) ?? [], [data, works]);
  const datedPeople = useMemo(() => people.filter(person => person.bornRange || person.diedRange).sort((a, b) => (a.bornRange?.[0] ?? a.diedRange?.[0] ?? Infinity) - (b.bornRange?.[0] ?? b.diedRange?.[0] ?? Infinity)), [people]);
  const undatedPeople = people.filter(person => !person.bornRange && !person.diedRange);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) setActiveEra(entry.target.id); }, { rootMargin: "-18% 0px -65% 0px" });
    root.current?.querySelectorAll(".timeline-chapter").forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [groups]);
  function jump(id: string) {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    section?.focus({ preventScroll: true });
    setActiveEra(id);
  }
  return <div className="timeline-page" ref={root} aria-labelledby="timeline-title">
    <header className="timeline-opening"><p className="timeline-kicker">六册教材 · 作品年表</p><h1 id="timeline-title">循着年代<br />翻阅作品</h1><p className="timeline-lede">从教材记载的创作年代出发，找到作品与相关人物。每一条年代都保留原文，展开即可查阅教材依据。</p><p className="timeline-total">{data ? `${data.works.length} 条作品记录 · ${data.works.filter(work => work.yearRange).length} 条标有年代 · ${data.people.length} 位相关人物` : "正在读取年表资料…"}</p></header>
    <section className="timeline-controls" aria-label="年表筛选"><div role="group" aria-label="按教材册别筛选">{["", ...Object.keys(BOOKS)].map(key => <button key={key} type="button" aria-pressed={book === key} onClick={() => setBook(key)}>{key ? BOOKS[key].replace("年级", "").replace("册", "") : "六册"}</button>)}</div><label>查找作品<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="输入作品名" /></label></section>
    {error ? <p role="alert">{error} <button type="button" onClick={() => setAttempt(value => value + 1)}>重试</button></p> : !data ? <div className="timeline-loading" role="status">正在载入作品与人物…</div> : <><p className="timeline-result" role="status">找到 {works.length} 条作品记录，其中 {works.filter(work => work.yearRange).length} 条标有年代。人物随相关作品筛选。</p>
      {works.length === 0 ? <section className="timeline-empty"><h2>没有找到相符的作品</h2><p>换一个作品名，或查看六册教材。</p><button type="button" onClick={() => { setBook(""); setQuery(""); }}>清除筛选</button></section> : <div className="timeline-book"><nav className="timeline-rail" aria-label="年代跳转">{groups.map(group => <button key={group.id} type="button" aria-current={activeEra === group.id ? "location" : undefined} onClick={() => jump(group.id)}>{group.label === UNKNOWN ? "未标注年代" : group.label}<small>{group.works.length}</small></button>)}<button type="button" onClick={() => jump("timeline-people")}>相关人物<small>{people.length}</small></button></nav>
        <div className="timeline-chapters">{groups.map(group => <section className={`timeline-chapter${group.label === UNKNOWN ? " is-undated" : ""}`} key={group.id} id={group.id} tabIndex={-1} aria-labelledby={`${group.id}-title`}><header><p className="timeline-kicker">作品 · {group.works.length} 条记录</p><h2 id={`${group.id}-title`}>{group.label === UNKNOWN ? <>{UNKNOWN}</> : <><span>{group.label.replace("年代", "")}</span>年代</>}</h2><p className="timeline-group-note">{group.label === UNKNOWN ? "这些作品的创作年代未在年表源数据中标注。" : "按教材年代范围起点归组；作品旁保留教材年代原文。"}</p></header><ol>{group.works.map(work => <WorkRow key={`${work.bookKey}:${work.id}`} work={work} people={data.people.filter(person => person.works.includes(work.id))} onOpenWork={openWork} />)}</ol></section>)}
          <section id="timeline-people" className="timeline-people" tabIndex={-1} aria-labelledby="timeline-people-title"><p className="timeline-kicker">作品里的名字</p><h2 id="timeline-people-title">相关人物</h2><p>生卒年代来自教材数据；按已知生年排序，缺少生年时按卒年排序。</p><ol>{datedPeople.map(person => <PersonRow key={person.id} person={person} works={works.filter(work => person.works.includes(work.id))} onOpenWork={openWork} />)}</ol><h3 className="timeline-undated-people">{UNKNOWN}</h3><p>{undatedPeople.length} 位人物</p><ol>{undatedPeople.map(person => <PersonRow key={person.id} person={person} works={works.filter(work => person.works.includes(work.id))} onOpenWork={openWork} />)}</ol></section>
        </div></div>}
    </>}
  </div>;
}
