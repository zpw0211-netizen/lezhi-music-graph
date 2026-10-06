"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import Image from "next/image";
import { publicAssetUrl } from "../../lib/app/assets";
import { PUBLISHED_BOOK_COUNT_LABEL } from "../../lib/app/books";
import type { AppRoute } from "../../lib/app/routing";
import { loadPeopleSupplement } from "../../lib/timeline/peopleSupplement";
import { loadYearSupplement } from "../../lib/timeline/yearSupplement";
import {
  BOOKS,
  BOOK_ORDER,
  UNKNOWN,
  filterWorks,
  groupTimelineWorks,
  personDates,
  personYearSource,
  withPrintedPages,
  withSupplementalPeople,
  withSupplementalYears,
  workHref,
  workRoute,
  type AtlasTimelineData,
  type TimelineData,
  type TimelineDataWithPeople,
  type TimelineDisplayWork,
  type TimelineDisplayPerson,
  type TimelineEraGroup,
  type TimelineLifetimeEvidence,
  type TimelineUnit,
  type TimelineWork,
} from "./timelineModel";

type Evidence = { textbookPage?: string; pdfPage?: number; summary?: string };
type EvidenceFile = { evidenceByTriple: Record<string, Evidence[]> };
type SourceRow = { work: TimelineWork; evidence?: Evidence };
type PersonSourceRow = { evidence: TimelineLifetimeEvidence; source?: Evidence };
type PageData = { timeline: TimelineDataWithPeople; units: TimelineUnit[] };
type DragState = { startX: number; startLeft: number };
const cache = new Map<string, Promise<unknown>>();
const TIMELINE_HORIZONTAL_KEY = "yapu.timeline.horizontalLeft";
const TIMELINE_VERTICAL_KEY = "yapu.timeline.scrollTop";
const DEFAULT_TIER_COUNT = 3;
const DENSE_TIER_COUNT = 4;
const COLUMN_WIDTH = 184;

function loadJson<T>(path: string): Promise<T> {
  if (!cache.has(path)) cache.set(path, fetch(publicAssetUrl(`data/${path}`)).then(response => {
    if (!response.ok) throw new Error("年表资料读取失败，请重试。");
    return response.json();
  }).catch(error => { cache.delete(path); throw error; }));
  return cache.get(path) as Promise<T>;
}

function bookShortName(bookKey: string) {
  return (BOOKS[bookKey] ?? bookKey).replace("年级", "").replace("册", "");
}

function workYearMark(work: TimelineDisplayWork) {
  const match = work.yearText.match(/\d{3,4}/);
  if (match) return `${match[0]}${/年代/.test(work.yearText) ? "s" : ""}`;
  return work.yearRange?.[0] ?? "年代未标注";
}

function getUnitArt(work: TimelineWork, units: TimelineUnit[]) {
  const unit = units.find(candidate => candidate.bookKey === work.bookKey && candidate.name === work.unit);
  return unit && unit.order <= 6 ? `art/units/${unit.bookKey}-u${unit.order}.webp` : null;
}

function artForEra(era: TimelineEraGroup, units: TimelineUnit[], used: Set<string>, index: number) {
  const candidates = [...new Set(era.works.flatMap(work => work.records.map(record => getUnitArt(record, units)).filter((path): path is string => Boolean(path))))];
  const available = units.filter(unit => unit.order <= 6).map(unit => `art/units/${unit.bookKey}-u${unit.order}.webp`);
  const selected = candidates.find(path => !used.has(path)) ?? candidates[0] ?? available[(index * 5) % Math.max(1, available.length)] ?? null;
  if (selected) used.add(selected);
  return selected;
}

function saveTimelinePosition(scroller: HTMLDivElement | null, root: HTMLDivElement | null) {
  const workspace = root?.closest<HTMLElement>(".workspace");
  try {
    if (scroller) window.sessionStorage.setItem(TIMELINE_HORIZONTAL_KEY, String(scroller.scrollLeft));
    const vertical = workspace?.scrollTop || window.scrollY;
    window.sessionStorage.setItem(TIMELINE_VERTICAL_KEY, String(vertical));
  } catch { /* Position restoration stays best-effort when storage is unavailable. */ }
}

function openWorkLink(event: MouseEvent<HTMLAnchorElement>, work: TimelineWork, onOpenWork: (route: AppRoute) => void, scroller: HTMLDivElement | null, root: HTMLDivElement | null) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const route = workRoute(work);
  if (!route) return;
  event.preventDefault();
  saveTimelinePosition(scroller, root);
  onOpenWork(route);
}

function evidencePageText(evidence?: Evidence) {
  const pages = [
    evidence?.textbookPage ? `教材第 ${evidence.textbookPage} 页` : "教材页码未标注",
    evidence?.pdfPage != null ? `PDF 第 ${evidence.pdfPage} 页` : "",
  ].filter(Boolean);
  return pages.join(" · ");
}

function TimelineNote({
  work,
  position,
  onOpenRecord,
  onClose,
}: {
  work: TimelineDisplayWork;
  position: { left: number; top: number };
  onOpenRecord: (event: MouseEvent<HTMLAnchorElement>, work: TimelineWork) => void;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<SourceRow[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousWork = useRef("");

  useEffect(() => {
    let active = true;
    Promise.all(work.records.map(async record => {
      if (record.yearSource === "textbook" && record.yearEvidence) {
        const file = await loadJson<EvidenceFile>(`evidence/${record.bookKey}.json`);
        return { work: record, evidence: file.evidenceByTriple[record.yearEvidence.tripleId]?.[0] };
      }
      return { work: record };
    })).then(result => { if (active) setRows(result); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "教材来源读取失败。"); });
    return () => { active = false; };
  }, [work, attempt]);

  useEffect(() => {
    if (previousWork.current !== work.id) closeRef.current?.focus({ preventScroll: true });
    previousWork.current = work.id;
  }, [work.id]);

  return <aside className={`timeline-note${work.hasSupplementYear && !work.hasTextbookYear ? " is-supplement" : ""}`} style={position} id="timeline-note" role="dialog" aria-label={`${work.name}的年代来源`}>
    <button ref={closeRef} className="timeline-note-close" type="button" aria-label="关闭史料笺" data-close-timeline-note onClick={onClose}>×</button>
    <span className={`timeline-note-stamp${work.hasSupplementYear && !work.hasTextbookYear ? " is-blue" : ""}`} aria-hidden="true">{work.hasSupplementYear && !work.hasTextbookYear ? "补遗" : "原典"}</span>
    <p className="timeline-note-kicker">
      {work.hasTextbookYear && <span className="timeline-origin is-textbook">教材原文</span>}
      {work.hasSupplementYear && <span className="timeline-origin is-supplement">补充资料（非教材）</span>}
      {!work.hasTextbookYear && !work.hasSupplementYear && <span>教材未标注年代</span>}
    </p>
    <h2>{work.name}</h2>
    <p className="timeline-note-books">{work.bookKeys.map(key => BOOKS[key] ?? key).join("、")}</p>
    {error ? <p className="timeline-note-error" role="alert">{error} <button type="button" onClick={() => { setError(""); setAttempt(value => value + 1); }}>重试</button></p> : rows === null ? <p className="timeline-note-loading" role="status">正在读取教材出处…</p> : <div className="timeline-note-sources">
      {rows.map(({ work: record, evidence }) => {
        const supplement = record.supplement;
        const href = workHref(record);
        return <section className={`timeline-note-source${record.yearSource === "supplement" ? " is-supplement" : ""}`} key={`${record.bookKey}:${record.id}`}>
          <blockquote>
            {record.yearSource === "textbook" && record.yearEvidence ? `${record.yearEvidence.relation}：` : ""}
            {record.yearText ?? UNKNOWN}
            {supplement?.event ? ` · ${supplement.event}` : ""}
          </blockquote>
          {record.yearSource === "textbook" ? <dl>
            <dt>教材出处</dt><dd>人民音乐出版社 · {BOOKS[record.bookKey] ?? record.bookKey}</dd>
            <dt>页码</dt><dd>{evidencePageText(evidence)}</dd>
            {record.unit && <><dt>单元</dt><dd>{record.unit}</dd></>}
          </dl> : record.yearSource === "supplement" && supplement ? <dl>
            <dt>所指</dt><dd>{supplement.subject ?? "未标注"}</dd>
            <dt>教材</dt><dd>{BOOKS[record.bookKey] ?? record.bookKey}{record.unit ? ` · ${record.unit}` : ""}</dd>
            <dt>来源</dt><dd className="timeline-note-links">{supplement.sources.length ? supplement.sources.map((source, index) => <a key={`${source.url}:${index}`} href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher || source.title}</a>) : "未提供外部来源"}</dd>
            {supplement.note && <><dt>说明</dt><dd>{supplement.note}</dd></>}
          </dl> : <p className="timeline-note-undated">教材未标注年代。年表只采用核对后的补充年代。</p>}
          <p className="timeline-note-record">
            {href ? <a href={href} onClick={event => onOpenRecord(event, record)}>打开{bookShortName(record.bookKey)}作品详情 →</a> : <span>本册目录暂无作品详情链接</span>}
          </p>
        </section>;
      })}
    </div>}
  </aside>;
}

function TimelinePersonNote({
  person,
  position,
  onClose,
}: {
  person: TimelineDisplayPerson;
  position: { left: number; top: number };
  onClose: () => void;
}) {
  const [rows, setRows] = useState<PersonSourceRow[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const supplement = person.supplement;

  useEffect(() => {
    if (supplement) return;
    let active = true;
    Promise.all(person.lifetimeEvidence.map(async evidence => {
      const file = await loadJson<EvidenceFile>(`evidence/${evidence.bookKey}.json`);
      return { evidence, source: file.evidenceByTriple[evidence.tripleId]?.[0] };
    })).then(result => { if (active) setRows(result); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "教材来源读取失败。"); });
    return () => { active = false; };
  }, [person, supplement, attempt]);

  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, [person.id]);

  return <aside className={`timeline-note${supplement ? " is-supplement" : ""}`} style={position} id="timeline-note" role="dialog" aria-label={`${person.name}的生卒年来源`}>
    <button ref={closeRef} className="timeline-note-close" type="button" aria-label="关闭史料笺" data-close-timeline-note onClick={onClose}>×</button>
    <span className={`timeline-note-stamp${supplement ? " is-blue" : ""}`} aria-hidden="true">{supplement ? "补遗" : "原典"}</span>
    <p className="timeline-note-kicker"><span className={supplement ? "timeline-origin is-supplement" : "timeline-origin is-textbook"}>{supplement?.label ?? "教材原文"}</span></p>
    <h2>{person.name}</h2>
    {supplement ? <section className="timeline-note-source is-supplement">
      <blockquote>{supplement.lifetimeText}</blockquote>
      <dl>
        {supplement.subject && <><dt>核对对象</dt><dd>{supplement.subject}</dd></>}
        <dt>出处</dt><dd className="timeline-note-links">{supplement.sources.length ? supplement.sources.map((source, index) => <a key={`${source.url}:${index}`} href={source.url} target="_blank" rel="noopener noreferrer">{source.title || source.publisher || source.url}</a>) : "未提供外部来源"}</dd>
        <dt>可信度</dt><dd>{supplement.confidence === "high" ? "高" : "中"}</dd>
        <dt>说明</dt><dd>{supplement.note || "暂无说明"}</dd>
      </dl>
    </section> : error ? <p className="timeline-note-error" role="alert">{error} <button type="button" onClick={() => { setError(""); setAttempt(value => value + 1); }}>重试</button></p> : rows === null ? <p className="timeline-note-loading" role="status">正在读取教材出处…</p> : <div className="timeline-note-sources">
      {rows.map(({ evidence, source }) => <section className="timeline-note-source" key={`${evidence.bookKey}:${evidence.tripleId}`}>
        <blockquote>{evidence.text}</blockquote>
        <dl>
          <dt>教材出处</dt><dd>人民音乐出版社 · {BOOKS[evidence.bookKey] ?? evidence.bookKey}</dd>
          <dt>页码</dt><dd>{evidencePageText(source)}</dd>
        </dl>
      </section>)}
    </div>}
  </aside>;
}

function TimelineSlip({
  work,
  index,
  tierCount,
  isSelected,
  onSelect,
}: {
  work: TimelineDisplayWork;
  index: number;
  tierCount: number;
  isSelected: boolean;
  onSelect: (work: TimelineDisplayWork, trigger: HTMLButtonElement) => void;
}) {
  const tier = index % tierCount;
  const title = work.name.replace(/^《|》$/g, "");
  const style = {
    left: `calc(var(--timeline-slip-start) + ${Math.floor(index / tierCount) * COLUMN_WIDTH}px + ${tier * 14}px)`,
    "--timeline-tier": tier,
    "--timeline-slip-index": index,
  } as CSSProperties;
  return <div className={`timeline-hanger${work.hasTextbookYear ? " has-textbook" : ""}${work.hasSupplementYear ? " has-supplement" : ""}`} style={style}>
    <span className="timeline-hanger-thread" aria-hidden="true" />
    <span className="timeline-hanger-knot" aria-hidden="true" />
    <button className="timeline-slip-tag" type="button" aria-label={`查看《${title}》的年代来源`} aria-haspopup="dialog" aria-controls="timeline-note" aria-expanded={isSelected} onClick={event => onSelect(work, event.currentTarget)}>
      <span className="timeline-slip-year">{workYearMark(work)}</span>
      <span className="timeline-slip-title">{title}</span>
      <span className="timeline-slip-books">{work.bookKeys.map(bookShortName).join("·")}</span>
    </button>
  </div>;
}

function TimelinePeople({ people, width, selectedId, onSelect }: {
  people: TimelineDisplayPerson[];
  width: number;
  selectedId: string | null;
  onSelect: (person: TimelineDisplayPerson, trigger: HTMLButtonElement) => void;
}) {
  const textbookCount = people.filter(person => personYearSource(person) === "textbook").length;
  const supplementCount = people.filter(person => personYearSource(person) === "supplement").length;
  return <section className="timeline-tail" id="timeline-tail" aria-labelledby="timeline-tail-title" style={{ "--timeline-tail-width": `${width}px` } as CSSProperties}>
    <span className="timeline-tail-rule" aria-hidden="true" />
    <h2 id="timeline-tail-title">拖尾 · 人物</h2>
    <p className="timeline-tail-sub">{people.length} 位人物 · 教材原文 {textbookCount} · 补充 {supplementCount}</p>
    <div className="timeline-people-list">{people.map(person => {
      const source = personYearSource(person);
      const isSelected = selectedId === person.id;
      return <button className={`timeline-person${source === "supplement" ? " is-supplement" : ""}`} key={person.id} type="button" title={personDates(person)} aria-label={`查看${person.name}的生卒年来源`} aria-haspopup="dialog" aria-controls="timeline-note" aria-expanded={isSelected} onClick={event => onSelect(person, event.currentTarget)}>
        <span>{person.name}</span><small>{personDates(person)}</small>
      </button>;
    })}</div>
    <span className="timeline-colophon" aria-label="芽谱藏">芽谱藏</span>
  </section>;
}

export function TimelinePage({ onOpenWork }: { onOpenWork: (route: AppRoute) => void }) {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [book, setBook] = useState("");
  const [query, setQuery] = useState("");
  const [activeEra, setActiveEra] = useState("timeline-opening");
  const [selectedWork, setSelectedWork] = useState<TimelineDisplayWork | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<TimelineDisplayPerson | null>(null);
  const selectedNoteTrigger = useRef<HTMLButtonElement | null>(null);
  const [notePosition, setNotePosition] = useState({ left: 16, top: 120 });
  const [unrolling, setUnrolling] = useState(true);
  const [dragging, setDragging] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const ruler = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const rootWorks = useMemo(() => pageData?.timeline.works ?? [], [pageData]);
  const works = useMemo(() => pageData ? filterWorks(pageData.timeline, book, query) : [], [pageData, book, query]);
  const groups = useMemo(() => groupTimelineWorks(works), [works]);
  const visibleWorkIds = useMemo(() => new Set(works.map(work => work.id)), [works]);
  const people = useMemo(() => pageData?.timeline.people.filter(person => person.works.some(id => visibleWorkIds.has(id))) ?? [], [pageData, visibleWorkIds]);
  const tailPeople = useMemo(() => people.filter(person => personYearSource(person) !== null), [people]);
  const datedCount = rootWorks.filter(work => work.yearRange).length;
  const supplementCount = rootWorks.filter(work => work.yearSource === "supplement").length;
  const tailWidth = 220 + Math.ceil(tailPeople.length / 2) * 62 + 120;

  const onOpenRecord = useCallback((event: MouseEvent<HTMLAnchorElement>, work: TimelineWork) => {
    openWorkLink(event, work, onOpenWork, scroller.current, root.current);
  }, [onOpenWork]);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadJson<TimelineData>("timeline.json"),
      loadJson<TimelineUnit[]>("units.json"),
      loadYearSupplement(),
      loadPeopleSupplement(),
      loadJson<AtlasTimelineData>("atlas.json").catch(() => null),
    ]).then(([timeline, units, supplements, peopleSupplements, atlas]) => {
      if (!active) return;
      let enriched = withSupplementalYears(timeline, supplements);
      if (atlas) enriched = withPrintedPages(enriched, atlas);
      setPageData({ timeline: withSupplementalPeople(enriched, peopleSupplements), units });
      setError("");
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "年表资料读取失败。"); });
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => {
    const navigation = root.current?.closest(".workspace")?.querySelector<HTMLElement>('nav[aria-label="主导航"]');
    if (!navigation) return;
    const measure = () => {
      root.current?.style.setProperty("--timeline-nav-height", `${navigation.getBoundingClientRect().height}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(navigation);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setUnrolling(false), 2600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!pageData || !scroller.current) return;
    let savedHorizontal: string | null = null;
    let savedVertical: string | null = null;
    try {
      savedHorizontal = window.sessionStorage.getItem(TIMELINE_HORIZONTAL_KEY);
      savedVertical = window.sessionStorage.getItem(TIMELINE_VERTICAL_KEY);
    } catch { /* Ignore unavailable session storage. */ }
    const horizontal = Number(savedHorizontal);
    const vertical = Number(savedVertical);
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (savedHorizontal !== null && Number.isFinite(horizontal) && horizontal >= 0 && scroller.current) scroller.current.scrollLeft = horizontal;
        if (savedVertical !== null && Number.isFinite(vertical) && vertical >= 0) {
          const workspace = root.current?.closest<HTMLElement>(".workspace");
          if (workspace && workspace.scrollHeight > workspace.clientHeight) workspace.scrollTop = vertical;
          else window.scrollTo(0, vertical);
        }
        try {
          window.sessionStorage.removeItem(TIMELINE_HORIZONTAL_KEY);
          window.sessionStorage.removeItem(TIMELINE_VERTICAL_KEY);
        } catch { /* Ignore unavailable session storage. */ }
      });
    });
    return () => { window.cancelAnimationFrame(firstFrame); if (secondFrame) window.cancelAnimationFrame(secondFrame); };
  }, [pageData]);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (window.matchMedia("(max-width: 760px)").matches || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      node.scrollLeft += event.deltaY;
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const sections = [...node.querySelectorAll<HTMLElement>("#timeline-opening, .timeline-era-section, #timeline-tail")];
    if (!sections.length) return;
    const mobileLayout = window.matchMedia("(max-width: 760px)").matches;
    const observerRoot = mobileLayout ? null : node;
    const centerRootMargin = mobileLayout ? "0px" : "0px -48% 0px -48%";
    const revealRootMargin = mobileLayout ? "0px" : "0px 12% 0px 12%";
    const centerObserver = new IntersectionObserver(entries => {
      const current = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current) {
        setActiveEra(current.target.id);
        const button = ruler.current?.querySelector<HTMLButtonElement>(`[data-target="${CSS.escape(current.target.id)}"]`);
        button?.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }, { root: observerRoot, rootMargin: centerRootMargin, threshold: [0, 0.25, 0.5, 0.75, 1] });
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add("is-in"); });
    }, { root: observerRoot, rootMargin: revealRootMargin, threshold: 0.01 });
    sections.forEach(section => centerObserver.observe(section));
    sections.filter(section => section.classList.contains("timeline-era-section")).forEach(section => revealObserver.observe(section));
    return () => { centerObserver.disconnect(); revealObserver.disconnect(); };
  }, [groups]);

  useEffect(() => {
    if (!selectedWork && !selectedPerson) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedWork(null);
        setSelectedPerson(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedWork, selectedPerson]);

  useEffect(() => {
    if (!selectedWork && !selectedPerson) selectedNoteTrigger.current?.focus({ preventScroll: true });
  }, [selectedWork, selectedPerson]);

  const closeNoteFromOutside = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element) || target.closest(".timeline-note, .timeline-slip-tag, .timeline-person")) return;
    if (selectedWork || selectedPerson) {
      setSelectedWork(null);
      setSelectedPerson(null);
    }
  };

  const jumpTo = (id: string) => {
    const section = document.getElementById(id);
    if (!section) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (window.matchMedia("(max-width: 760px)").matches) section.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
    else scroller.current?.scrollTo({ left: Math.max(0, section.offsetLeft - (id === "timeline-opening" ? 0 : 40)), behavior: reducedMotion ? "instant" : "smooth" });
    setActiveEra(id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest("input, textarea, select, button, a, summary, [contenteditable='true']")) return;
    const node = scroller.current;
    if (!node) return;
    const page = node.clientWidth * 0.8;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = reducedMotion ? "instant" : "smooth";
    const movements: Record<string, number> = { ArrowRight: 160, ArrowLeft: -160, PageDown: page, PageUp: -page };
    if (event.key in movements) {
      event.preventDefault();
      node.scrollBy({ left: movements[event.key], behavior });
    } else if (event.key === "Home") {
      event.preventDefault();
      node.scrollTo({ left: 0, behavior });
    } else if (event.key === "End") {
      event.preventDefault();
      node.scrollTo({ left: node.scrollWidth, behavior });
    }
  };

  const beginDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || window.matchMedia("(max-width: 760px)").matches || (event.target instanceof Element && event.target.closest("a, button, input"))) return;
    drag.current = { startX: event.clientX, startLeft: scroller.current?.scrollLeft ?? 0 };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current && scroller.current) scroller.current.scrollLeft = drag.current.startLeft - (event.clientX - drag.current.startX);
  };
  const endDrag = () => { drag.current = null; setDragging(false); };

  const bookOptions = ["", ...BOOK_ORDER];
  const indexItems = [
    { id: "timeline-opening", label: "引首" },
    ...groups.map(group => ({ id: group.id, label: group.undated ? "未标年代" : group.ancient ? "古调" : group.from != null && group.from >= 1930 ? `${group.label}s` : group.label })),
    { id: "timeline-tail", label: "拖尾" },
  ];
  useEffect(() => {
    const track = ruler.current;
    const button = [...(track?.querySelectorAll<HTMLButtonElement>("button") ?? [])].find(item => item.dataset.target === activeEra);
    const marker = track?.querySelector<HTMLElement>(".timeline-ruler-mark");
    if (!button || !marker) return;
    marker.style.width = `${Math.max(0, button.offsetWidth - 26)}px`;
    marker.style.transform = `translateX(${button.offsetLeft + 13}px)`;
  }, [activeEra, groups]);
  const usedArt = new Set<string>();
  const decoratedGroups = groups.map((group, index) => ({ group, image: artForEra(group, pageData?.units ?? [], usedArt, index) }));
  return <div className="timeline-page" ref={root} onPointerDown={closeNoteFromOutside} aria-labelledby="timeline-title">
    <div className="timeline-toolbar" aria-label="作品年表筛选">
      <div className="timeline-book-filter" role="group" aria-label="按教材册别筛选">
        {bookOptions.map(key => <button key={key || "all"} type="button" aria-pressed={book === key} onClick={() => { setSelectedWork(null); setSelectedPerson(null); setBook(key); }}>{key ? bookShortName(key) : PUBLISHED_BOOK_COUNT_LABEL}</button>)}
      </div>
      <label className="timeline-search">查找作品<input type="search" value={query} onChange={event => { setSelectedWork(null); setSelectedPerson(null); setQuery(event.target.value); }} placeholder="输入作品名" aria-label="查找作品" /></label>
      <p className="timeline-count" role="status">{pageData ? `${rootWorks.length} 首作品 · ${datedCount} 首标有年代 · ${supplementCount} 条补充资料` : "正在读取年表资料…"}</p>
    </div>
    <nav className="timeline-ruler" aria-label="年代索引">
      <div className="timeline-ruler-track" ref={ruler}>
        {indexItems.map(item => <button key={item.id} type="button" data-target={item.id} aria-current={activeEra === item.id ? "location" : undefined} onClick={() => jumpTo(item.id)}>{item.label}</button>)}
        <span className="timeline-ruler-mark" aria-hidden="true" />
      </div>
      <span className="timeline-ruler-hint">向右展卷<i aria-hidden="true" /></span>
    </nav>
    {error ? <p className="timeline-error" role="alert">{error} <button type="button" onClick={() => setAttempt(value => value + 1)}>重试</button></p> : <div className="timeline-stage">
      <div className={`timeline-scroller${dragging ? " is-dragging" : ""}`} ref={scroller} tabIndex={0} role="region" aria-label="作品年表长卷，使用方向键或拖动浏览" onKeyDown={handleKeyDown} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className="timeline-scroll-track">
          <i className="timeline-roll-rod timeline-roll-rod-start" aria-hidden="true" />
          <div className="timeline-roll" style={{ "--timeline-intro-width": "min(74vw, 1080px)", "--timeline-tail-width": `${tailWidth}px` } as CSSProperties}>
            <section className="timeline-opening" id="timeline-opening" aria-labelledby="timeline-title">
              <span className="timeline-seal timeline-opening-seal" aria-hidden="true">芽谱</span>
              <div className="timeline-opening-copy">
                <p>{PUBLISHED_BOOK_COUNT_LABEL}教材里的作品，依年代展成一卷。<b>从左往右读</b>：每一段配一幅教材插画，作品挂在下方的时间轴上。</p>
                <div className="timeline-legend"><span><i className="timeline-legend-seal is-red">1935</i>作品、人物的教材原文年代</span><span><i className="timeline-legend-seal is-blue">1950</i>作品、人物的补充年代（非教材）</span></div>
              </div>
              <h1 className="timeline-title-vertical" id="timeline-title"><span>循着年代</span><span>翻阅作品</span></h1>
            </section>
            <div className="timeline-axis" aria-hidden="true" />
            {pageData && decoratedGroups.map(({ group, image }) => {
              const textbookCount = group.works.reduce((total, work) => total + work.records.filter(record => record.yearSource === "textbook").length, 0);
              const extraCount = group.works.reduce((total, work) => total + work.records.filter(record => record.yearSource === "supplement").length, 0);
              const units = [...new Set(group.works.flatMap(work => work.records.map(record => record.unit?.replace(/^第.单元\s*/, "")).filter((unit): unit is string => Boolean(unit))))].slice(0, 3);
              const tierCount = group.works.length >= 7 ? DENSE_TIER_COUNT : DEFAULT_TIER_COUNT;
              const slipsWidth = Math.ceil(group.works.length / tierCount) * COLUMN_WIDTH + 80;
              const sectionWidth = `max(calc(var(--timeline-band-height) * 2.4), calc(var(--timeline-slip-start) + ${slipsWidth}px), 580px)`;
              const sectionVars = { "--timeline-era-width": sectionWidth, "--timeline-art-width": "var(--timeline-era-width)" } as CSSProperties;
              return <section className={`timeline-era-section${group.undated ? " is-undated" : ""}`} id={group.id} key={group.id} style={sectionVars} aria-labelledby={`${group.id}-title`}>
                <div className="timeline-artwork" aria-hidden="true"><div className="timeline-art-reveal">{image && <Image src={publicAssetUrl(image)} alt="" aria-hidden="true" fill sizes="(max-width: 760px) 100vw, 1100px" unoptimized loading={group.id === "era-ancient" ? "eager" : "lazy"} />}</div></div>
                <header className="timeline-era-title">
                  <p className="timeline-era-subtitle">{group.subtitle}</p>
                  <h2 id={`${group.id}-title`} className={group.ancient ? "is-ancient" : ""}>{group.undated ? "未标注" : group.ancient ? "古调" : group.label}<small>{group.undated ? "年代" : group.from != null && group.from >= 1930 ? "年代" : ""}</small></h2>
                  <p>{group.works.length} 首作品{textbookCount > 0 && <> · <em>{`教材原文 ${textbookCount}`}</em></>}{extraCount > 0 && <> · <em className="is-blue">{`补充资料 ${extraCount}`}</em></>}{units.length > 0 && <><br />多见于「{units.join("」「")}」</>}</p>
                </header>
                <span className="timeline-axis-tick" aria-hidden="true"><b>{group.undated ? "年代未标注" : group.ancient ? "1700 以前" : group.from}</b></span>
                {group.works.length > 0 ? <div className="timeline-hangers">{group.works.map((work, index) => <TimelineSlip key={work.id} work={work} index={index} tierCount={tierCount} isSelected={selectedWork?.id === work.id} onSelect={(selected, trigger) => {
                  const rect = trigger.getBoundingClientRect();
                  const width = Math.min(420, window.innerWidth - 24);
                  setNotePosition({ left: Math.max(12, Math.min(window.innerWidth - width - 12, rect.left)), top: Math.max(96, Math.min(window.innerHeight - 400, rect.top - 250)) });
                  selectedNoteTrigger.current = trigger;
                  setSelectedPerson(null);
                  setSelectedWork(selected);
                }} />)}</div> : <p className="timeline-empty-era">没有找到相符的作品。</p>}
              </section>;
            })}
            {pageData && !groups.length && <section className="timeline-empty-era" id="timeline-empty"><h2>没有找到相符的作品</h2><p>换一个作品名，或查看{PUBLISHED_BOOK_COUNT_LABEL}教材。</p><button type="button" onClick={() => { setBook(""); setQuery(""); }}>清除筛选</button></section>}
            {pageData && <TimelinePeople people={tailPeople} width={tailWidth} selectedId={selectedPerson?.id ?? null} onSelect={(person, trigger) => {
              const rect = trigger.getBoundingClientRect();
              const width = Math.min(420, window.innerWidth - 24);
              setNotePosition({ left: Math.max(12, Math.min(window.innerWidth - width - 12, rect.left)), top: Math.max(96, Math.min(window.innerHeight - 400, rect.top - 250)) });
              selectedNoteTrigger.current = trigger;
              setSelectedWork(null);
              setSelectedPerson(person);
            }} />}
            {!pageData && <section className="timeline-loading" role="status">正在载入作品与人物…</section>}
          </div>
          <i className="timeline-roll-rod timeline-roll-rod-end" aria-hidden="true" />
        </div>
      </div>
      {unrolling && <div className="timeline-unroll" aria-hidden="true" onAnimationEnd={() => setUnrolling(false)}><i className="timeline-roll-rod" /><span /></div>}
    </div>}
    {selectedWork && <TimelineNote key={selectedWork.id} work={selectedWork} position={notePosition} onOpenRecord={onOpenRecord} onClose={() => setSelectedWork(null)} />}
    {selectedPerson && <TimelinePersonNote key={selectedPerson.id} person={selectedPerson} position={notePosition} onClose={() => setSelectedPerson(null)} />}
  </div>;
}
