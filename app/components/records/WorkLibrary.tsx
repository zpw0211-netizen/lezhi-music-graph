"use client";

/* The book and score covers are editorial artwork served from public/. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { CSSProperties, RefObject } from "react";
import { MelodySet } from "../lesson/MelodyPlayer";
import { MELODIES } from "../../lib/lesson/melodies";
import { bareWorkName, type Book, type BookDirectory, type Entity, type Triple } from "../../lib/app/types";
import { publicAssetUrl } from "../../lib/app/assets";
import type { BookDataStatus } from "../../hooks/useGraphIndex";

type UnitWork = {
  id: string;
  name: string;
  type: string;
  authors?: Array<{ role: string; name: string }>;
  page?: number | null;
  scores?: string[];
  summary?: string;
  starred?: boolean;
  hasMelody?: boolean;
};

type UnitTask = { text: string; works: string[]; focus: string[] };
type UnitKeyword = { name: string; type?: string; count: number };
type TextbookUnit = {
  bookKey: string;
  order: number;
  id: string;
  name: string;
  title: string;
  numeral?: string;
  theme?: string;
  kind?: string;
  goals?: string[];
  tasks?: UnitTask[];
  works: UnitWork[];
  keywords?: UnitKeyword[];
};
type WorkEntry = { unit: TextbookUnit; work: UnitWork };

const UNIT_NUMERALS = ["壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖", "拾"];
const KNOWLEDGE_PREDICATES = new Set([
  "演唱形式", "调号", "拍号", "速度", "表情术语", "节奏特点", "旋律特点", "曲式结构",
  "使用记号", "风格特点", "音乐风格", "演唱要求", "学习要求", "音乐体裁", "表现主题",
]);
const DIALOG_FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[contenteditable=true]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function unitAnchorId(bookKey: string, unitId: string) {
  return `records-${bookKey}-${unitId}`;
}

function routeTitleFor(work: UnitWork, works: readonly UnitWork[]) {
  const bareName = bareWorkName(work.name);
  const sameNameCount = works.filter((candidate) => bareWorkName(candidate.name) === bareName).length;
  return sameNameCount > 1 ? `${bareName}~${work.type}` : bareName;
}

function unitArtwork(unit: TextbookUnit) {
  return unit.kind === "project"
    ? `art/${unit.bookKey}.webp`
    : `art/units/${unit.bookKey}-u${unit.order}.webp`;
}

function bookIntroduction(units: readonly TextbookUnit[]) {
  const themes = units.map((unit) => unit.theme?.trim() || unit.title).filter(Boolean);
  if (!themes.length) return "";
  if (themes.length === 1) return `围绕「${themes[0]}」展开。`;
  const middle = themes.slice(1, -1);
  const middleText = middle.length ? `，走过${middle.map((theme) => `「${theme}」`).join("、")}` : "";
  return `从「${themes[0]}」出发${middleText}，再到「${themes[themes.length - 1]}」。`;
}

function startViewTransition(update: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const api = (document as Document & { startViewTransition?: (callback: () => void) => unknown }).startViewTransition;
  if (!api || reduced) {
    update();
    return;
  }
  api.call(document, () => flushSync(update));
}

function workKnowledge(triples: readonly Triple[], entitiesById: ReadonlyMap<string, Entity>) {
  const seen = new Set<string>();
  const values: Array<{ label: string; value: string }> = [];
  for (const triple of triples) {
    if (!KNOWLEDGE_PREDICATES.has(triple.predicate)) continue;
    const value = (triple.objectId ? entitiesById.get(triple.objectId)?.name : undefined) ?? triple.literal ?? "";
    const key = `${triple.predicate}\u0000${value}`;
    if (!value || seen.has(key)) continue;
    seen.add(key);
    values.push({ label: triple.predicate, value });
  }
  return values.slice(0, 10);
}

function splitTaskText(
  text: string,
  taskWorks: readonly string[],
  worksById: ReadonlyMap<string, UnitWork>,
  onOpen: (work: UnitWork) => void,
) {
  return text.split(/(《[^》]+》)/g).map((part, index) => {
    if (!part.startsWith("《") || !part.endsWith("》")) return part;
    const title = bareWorkName(part);
    const target = taskWorks
      .map((id) => worksById.get(id))
      .find((work): work is UnitWork => Boolean(work && bareWorkName(work.name) === title));
    return target
      ? <button className="records-inline-work" key={`${part}-${index}`} type="button" onClick={() => onOpen(target)}>{part}</button>
      : part;
  });
}

function WorkDetail({
  entry,
  bookTitle,
  bookData,
  workEntity,
  bookDataStatus,
  unitsStatus,
  detailsReady,
  onRetryBookData,
  onRetryUnits,
  onClose,
  onLearn,
  dialogRef,
}: {
  entry: WorkEntry | undefined;
  bookTitle: string;
  bookData: Book | null;
  workEntity?: Entity;
  bookDataStatus: BookDataStatus;
  unitsStatus: "loading" | "ready" | "error";
  detailsReady: boolean;
  onRetryBookData: () => void;
  onRetryUnits: () => void;
  onClose: () => void;
  onLearn: (workId: string) => void;
  dialogRef: RefObject<HTMLElement | null>;
}) {
  const work = entry?.work;
  const unit = entry?.unit;
  const entitiesById = useMemo(() => new Map((bookData?.entities ?? []).map((entity) => [entity.id, entity])), [bookData]);
  const triples = useMemo(() => bookData?.triples.filter((triple) => triple.subject === work?.id) ?? [], [bookData, work?.id]);
  const knowledge = useMemo(() => workKnowledge(triples, entitiesById), [entitiesById, triples]);
  const score = work?.scores?.[0];
  const melodies = work ? (MELODIES[bareWorkName(work.name)] ?? MELODIES[work.name] ?? []) : [];
  const scoreStyle = work ? ({ viewTransitionName: "work-cover" } as CSSProperties) : undefined;
  const isLoading = unitsStatus === "loading" || bookDataStatus === "loading" || bookDataStatus === "idle";
  const hasLoadError = unitsStatus === "error" || bookDataStatus === "error";

  return <section
    aria-busy={isLoading ? true : undefined}
    aria-labelledby="records-detail-title"
    aria-modal="true"
    className="records-detail"
    ref={dialogRef}
    role="dialog"
    tabIndex={-1}
  >
    <div className="records-detail-score">
      {score
        ? <img alt={`${work?.name}教材谱例`} className="records-detail-score-image" decoding="async" loading="eager" src={publicAssetUrl(score)} style={scoreStyle} />
        : <div className="records-detail-score-empty" style={scoreStyle}><span>{work?.name ?? "作品详情"}</span></div>}
      {work?.scores?.slice(1).map((image, index) => <img key={image} alt={`${work.name}教材谱例 ${index + 2}`} className="records-detail-score-image records-detail-score-extra records-lazy-image" data-src={publicAssetUrl(image)} decoding="async" loading="lazy" />)}
    </div>
    <div className="records-detail-copy">
      <button className="records-detail-close" type="button" onClick={onClose}>关闭 <span aria-hidden="true">×</span></button>
      {entry && work && unit ? <>
        <p className="records-detail-unit">{unit.numeral ?? UNIT_NUMERALS[unit.order - 1] ?? unit.order} · {unit.title}</p>
        <h1 className="records-detail-title" id="records-detail-title">{work.name}</h1>
        {(work.type || work.authors?.length) && <p className="records-detail-credits">
          {work.type && <span>{work.type}</span>}
          {work.authors?.length ? <span>{work.authors.map((author) => `${author.role} ${author.name}`).join(" · ")}</span> : null}
        </p>}
        {work.page != null && <p className="records-detail-page">教材第 {work.page} 页</p>}

        {work.summary && <section className="records-detail-theme" aria-label="表现主题">
          <h2>表现主题</h2>
          <blockquote>「{work.summary}」</blockquote>
        </section>}

        {melodies.length > 0 && <section className="records-detail-melody" aria-labelledby="records-detail-melody-title">
          <h2 id="records-detail-melody-title">简谱与旋律</h2>
          <MelodySet melodies={melodies} large />
        </section>}

        {(knowledge.length > 0 || !detailsReady) && <section className="records-detail-knowledge" aria-labelledby="records-detail-knowledge-title">
          <h2 id="records-detail-knowledge-title">知识点</h2>
          {bookDataStatus === "error"
            ? <div className="records-detail-load-error" role="status">
              <p>本册作品资料读取失败，知识点暂不可用。</p>
              <button onClick={onRetryBookData} type="button">重试</button>
            </div>
            : !detailsReady
              ? <p className="records-detail-loading">正在读取作品资料…</p>
            : <ul>{knowledge.map((item, index) => <li key={`${item.label}-${item.value}-${index}`}><span>{item.label}</span><strong>{item.value}</strong></li>)}</ul>}
        </section>}

        <button className="records-detail-lesson" type="button" disabled={!workEntity} onClick={() => onLearn(work.id)}>进入完整学习页</button>
      </> : <>
        <p className="records-detail-unit">{bookTitle}</p>
        <h1 className="records-detail-title" id="records-detail-title">{isLoading ? "正在读取作品资料…" : hasLoadError ? "作品资料读取失败" : "没有找到这首作品"}</h1>
        {unitsStatus === "error" && <div className="records-detail-load-error" role="status">
          <p>本册目录读取失败，暂时无法确认这首作品是否存在。</p>
          <button onClick={onRetryUnits} type="button">重试</button>
        </div>}
        {unitsStatus !== "error" && bookDataStatus === "error" && <div className="records-detail-load-error" role="status">
          <p>本册作品资料读取失败，暂时无法确认这首作品是否存在。</p>
          <button onClick={onRetryBookData} type="button">重试</button>
        </div>}
        {isLoading && <p className="records-detail-loading">请稍候，正在读取本册目录与作品资料。</p>}
        {!isLoading && !hasLoadError && <p className="records-detail-loading">本册目录与作品资料已读取完成，未找到这首作品。</p>}
      </>}
    </div>
  </section>;
}

/** The textbook reader: one illustrated chapter per unit and a shareable work detail route. */
export function WorkLibrary({
  books,
  bookKey,
  bookData,
  bookDataStatus,
  onRetryBookData,
  detailWork,
  onOpen,
  onClose,
  onLearn,
  onKnowledge,
}: {
  books: BookDirectory[];
  bookKey: string;
  bookData: Book | null;
  bookDataStatus: BookDataStatus;
  onRetryBookData: () => void;
  detailWork?: string;
  onOpen: (routeTitle: string, bookKey: string) => void;
  onClose: () => void;
  onLearn: (workId: string) => void;
  onKnowledge: (name: string, type?: string) => void;
}) {
  const [unitRows, setUnitRows] = useState<TextbookUnit[] | null>(null);
  const [unitsError, setUnitsError] = useState(false);
  const [retryUnits, setRetryUnits] = useState(0);
  const [activeUnitId, setActiveUnitId] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const openedWorkId = useRef("");

  useEffect(() => {
    let active = true;
    fetch(publicAssetUrl("data/units.json"))
      .then(async (response) => {
        if (!response.ok) throw new Error("单元数据读取失败");
        const payload = (await response.json()) as unknown;
        if (!Array.isArray(payload)) throw new Error("单元数据格式错误");
        return payload as TextbookUnit[];
      })
      .then((payload) => { if (active) setUnitRows(payload); })
      .catch(() => { if (active) setUnitsError(true); });
    return () => { active = false; };
  }, [retryUnits]);

  useEffect(() => {
    const loadWhenVisible = (image: HTMLImageElement) => {
      const source = image.dataset.src;
      if (!source) return;
      image.src = source;
      delete image.dataset.src;
    };
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll<HTMLImageElement>(".records-lazy-image[data-src]").forEach(loadWhenVisible);
      return;
    }
    const images = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLImageElement)) continue;
        loadWhenVisible(entry.target);
        images.unobserve(entry.target);
      }
    });
    const observeImages = (root: Document | DocumentFragment | Element) => {
      if (root instanceof HTMLImageElement && root.matches(".records-lazy-image[data-src]")) images.observe(root);
      root.querySelectorAll<HTMLImageElement>(".records-lazy-image[data-src]").forEach((image) => images.observe(image));
    };
    const root = document.querySelector(".route-view") ?? document.body;
    observeImages(root);
    const additions = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) observeImages(node);
        }
      }
    });
    additions.observe(root, { childList: true, subtree: true });
    return () => { images.disconnect(); additions.disconnect(); };
  }, []);

  const directory = books.find((item) => item.key === bookKey) ?? books[0];
  const units = useMemo(
    () => (unitRows ?? []).filter((unit) => unit.bookKey === directory?.key).sort((left, right) => left.order - right.order),
    [directory?.key, unitRows],
  );
  const unitWorks = useMemo<WorkEntry[]>(() => units.flatMap((unit) => unit.works.map((work) => ({ unit, work }))), [units]);
  const allWorks = useMemo(() => unitWorks.map((entry) => entry.work), [unitWorks]);
  const worksById = useMemo(() => new Map(allWorks.map((work) => [work.id, work])), [allWorks]);
  const entitiesById = useMemo(() => new Map((bookData?.entities ?? []).map((entity) => [entity.id, entity])), [bookData]);
  const selectedEntry = useMemo(() => {
    if (!detailWork) return undefined;
    return unitWorks.find(({ work }) => routeTitleFor(work, allWorks) === detailWork)
      ?? unitWorks.find(({ work }) => bareWorkName(work.name) === detailWork);
  }, [allWorks, detailWork, unitWorks]);
  const selectedEntity = selectedEntry ? entitiesById.get(selectedEntry.work.id) : undefined;
  const workCount = units.reduce((sum, unit) => sum + unit.works.length, 0);
  const unitsStatus: "loading" | "ready" | "error" = unitsError ? "error" : unitRows ? "ready" : "loading";
  const bookIndex = Math.max(0, books.findIndex((item) => item.key === directory?.key));
  const bookNumeral = ["一", "二", "三", "四", "五", "六"][bookIndex] ?? String(bookIndex + 1);
  const activeUnit = units.find((unit) => unit.id === activeUnitId) ?? units[0];
  const activeIndex = Math.max(0, units.findIndex((unit) => unit.id === activeUnit?.id));
  const commonKeywords = useMemo(() => {
    const sorted = [...(activeUnit?.keywords ?? [])].sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "zh"));
    const common = sorted.filter((keyword) => keyword.count >= 2).slice(0, 4);
    return [...common, ...sorted.filter((keyword) => keyword.count < 2).slice(0, Math.max(0, 4 - common.length))];
  }, [activeUnit?.keywords]);
  const featuredQuote = activeUnit?.works.find((work) => work.starred && work.summary)
    ?? activeUnit?.works.find((work) => work.summary);

  useEffect(() => {
    if (!units.length) return;
    const observer = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => Math.abs(left.boundingClientRect.top) - Math.abs(right.boundingClientRect.top))[0];
      if (current?.target instanceof HTMLElement) setActiveUnitId(current.target.dataset.unitId ?? "");
    }, { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.1, 0.35] });
    const revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.05 });
    for (const unit of units) {
      const chapter = document.getElementById(unitAnchorId(directory?.key ?? bookKey, unit.id));
      if (chapter) {
        observer.observe(chapter);
        revealObserver.observe(chapter);
      }
    }
    return () => {
      observer.disconnect();
      revealObserver.disconnect();
    };
  }, [bookKey, directory?.key, units]);

  useEffect(() => {
    if (!detailWork) {
      if (openedWorkId.current) {
        const button = document.getElementById(`records-work-${openedWorkId.current}`);
        requestAnimationFrame(() => {
          if (button instanceof HTMLButtonElement) button.focus({ preventScroll: true });
        });
      }
      return;
    }
    if (selectedEntry) {
      openedWorkId.current = selectedEntry.work.id;
    }
    requestAnimationFrame(() => dialogRef.current?.focus({ preventScroll: true }));
  }, [detailWork, selectedEntry]);

  const closeDetails = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!detailWork) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Keep the dialog's ancestor path available while making every background
    // branch inert, including the shared navigation outside the route view.
    const previousInert = new Map<HTMLElement, boolean>();
    let activeBranch: HTMLElement = dialog;
    while (activeBranch.parentElement && activeBranch.parentElement !== document.documentElement) {
      const parent = activeBranch.parentElement;
      for (const child of Array.from(parent.children)) {
        if (child === activeBranch || !(child instanceof HTMLElement)) continue;
        previousInert.set(child, child.inert);
        child.inert = true;
      }
      activeBranch = parent;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDetails();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(DIALOG_FOCUSABLE)).filter((element) =>
        !element.closest("[inert]")
        && element.getClientRects().length > 0
        && window.getComputedStyle(element).visibility !== "hidden",
      );
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === first || activeElement === dialog || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (activeElement === last || activeElement === dialog || !dialog.contains(activeElement))) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      for (const [element, wasInert] of previousInert) element.inert = wasInert;
    };
  }, [closeDetails, detailWork]);

  const goToUnit = useCallback((unit: TextbookUnit) => {
    setActiveUnitId(unit.id);
    const target = document.getElementById(unitAnchorId(directory?.key ?? bookKey, unit.id));
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [bookKey, directory?.key]);

  const openWork = useCallback((work: UnitWork, sourceCard?: HTMLButtonElement) => {
    const routeTitle = routeTitleFor(work, allWorks);
    const cover = sourceCard?.querySelector<HTMLElement>(".records-score-image, .records-score-placeholder");
    if (cover) cover.style.viewTransitionName = "work-cover";
    startViewTransition(() => {
      cover?.style.removeProperty("view-transition-name");
      onOpen(routeTitle, directory?.key ?? bookKey);
    });
  }, [allWorks, bookKey, directory?.key, onOpen]);

  const retryUnitsLoad = () => {
    setUnitRows(null);
    setUnitsError(false);
    setRetryUnits((value) => value + 1);
  };

  const chapterContents = useMemo(() => units.map((unit) => {
    const anchorId = unitAnchorId(directory?.key ?? bookKey, unit.id);
    const tasks = unit.kind === "project" ? [] : (unit.tasks ?? []);
    const numeral = unit.numeral ?? UNIT_NUMERALS[unit.order - 1] ?? unit.order;
    return <article
      aria-labelledby={`${anchorId}-title`}
      className={`records-chapter${unit.kind === "project" ? " is-project" : ""}`}
      data-kind={unit.kind ?? "chapter"}
      data-chapter-reveal
      data-unit-id={unit.id}
      id={anchorId}
      key={unit.id}
    >
      <header className="records-chapter-heading">
        <figure className="records-chapter-art">
          <img alt={`${unit.title}单元插画`} className="records-chapter-art-image records-lazy-image" data-src={publicAssetUrl(unitArtwork(unit))} decoding="async" height="750" loading="lazy" width="1200" />
        </figure>
        <div className="records-chapter-title-block">
          <span aria-hidden="true" className="records-chapter-number">{numeral}</span>
          <p className="records-chapter-kicker">第 {numeral} 单元</p>
          <h2 id={`${anchorId}-title`}>{unit.title}</h2>
          {unit.theme && <span className="records-theme-seal">{unit.theme}</span>}
        </div>
      </header>

      {Boolean(unit.goals?.length) && <section className="records-chapter-goals" aria-label="本单元先读">
        <h3>本单元先读</h3>
        <ul>{unit.goals?.map((goal) => <li key={goal}>{goal}</li>)}</ul>
      </section>}

      <section aria-label="作品名录" className="records-chapter-works">
        <div className="records-section-heading">
          <h3>作品名录</h3>
          <p>封面为教材谱例原图 · 悬停翻阅</p>
        </div>
        <div className="records-score-grid">
          {unit.works.map((work) => {
            const starred = Boolean(work.starred);
            return <button
              aria-label={`打开${work.name}作品详情`}
              className={`records-score-card${starred ? " is-featured" : ""}`}
              id={`records-work-${work.id}`}
              key={work.id}
              onClick={(event) => openWork(work, event.currentTarget)}
              type="button"
            >
              <span className="records-score-image-wrap">
                {work.scores?.[0]
                  ? <img alt={`${work.name}谱例封面`} className="records-score-image records-lazy-image" data-src={publicAssetUrl(work.scores[0])} decoding="async" loading="lazy" />
                  : <span className="records-score-placeholder"><span>{work.name}</span></span>}
                {starred && <span className="records-star-seal">重点曲目</span>}
                {work.page != null && <span className="records-score-page">教材第 {work.page} 页</span>}
              </span>
              <span className="records-score-copy">
                <span className="records-score-type">{work.type}</span>
                <strong>{work.name}</strong>
                {work.authors?.length ? <span className="records-score-authors">{work.authors.map((author) => `${author.role} ${author.name}`).join(" · ")}</span> : null}
                {work.hasMelody && <span className="records-has-melody">可听旋律</span>}
              </span>
            </button>;
          })}
        </div>
      </section>

      {tasks.length > 0 && <section aria-label="课堂任务" className="records-chapter-tasks">
        <div className="records-section-heading"><h3>课堂任务</h3><span>{tasks.length} 项</span></div>
        <ol>{tasks.map((task, taskIndex) => <li key={`${unit.id}-task-${taskIndex}`}>
          <p>{splitTaskText(task.text, task.works, worksById, openWork)}</p>
          {task.focus?.length > 0 && <div className="records-task-focus" aria-label="练习重点">
            {task.focus.map((focus) => <span key={focus}>{focus}</span>)}
          </div>}
        </li>)}</ol>
      </section>}
    </article>;
  }), [bookKey, directory?.key, openWork, units, worksById]);

  if (!directory) return null;
  const displayTitle = directory.title.replace(/^人音版/, "");
  const detailsReady = bookDataStatus === "ready" && Boolean(bookData);
  return <>
    <section aria-hidden={detailWork ? true : undefined} className="work-library" data-book={directory.key} data-grade={directory.grade}>
      <header className="records-book-hero" aria-labelledby="records-book-title">
        <figure className="records-book-hero-art">
          <img alt={`${directory.title}插画`} decoding="async" fetchPriority="high" height="750" loading="eager" src={publicAssetUrl(`art/${directory.key}.webp`)} width="1200" />
        </figure>
        <div className="records-book-hero-copy">
          <p className="records-book-kicker">卷 {bookNumeral} · 人音版</p>
          <p aria-hidden="true" className="records-book-brush">音乐 ·</p>
          <h1 id="records-book-title">{displayTitle}</h1>
          <p className="records-book-intro">{units.length
            ? `${units.length} 个单元，${workCount} 首作品——${bookIntroduction(units)}`
            : unitsError ? "本册目录暂时无法读取。" : "正在读取本册目录…"}</p>
          {units.length > 0
            ? <nav aria-label={`${directory.title}单元目录`} className="records-book-directory">
              {units.map((unit) => <button key={unit.id} onClick={() => goToUnit(unit)} type="button">
                <span>{unit.numeral ?? UNIT_NUMERALS[unit.order - 1] ?? unit.order}</span>
                <strong>{unit.title}</strong>
                <small>{unit.works.length} 首</small>
              </button>)}
            </nav>
            : <div aria-hidden="true" className="records-book-directory records-book-directory-placeholder" />}
        </div>
      </header>

      {unitsError && <div className="records-data-status" role="status">
        <p>本册目录读取失败，请重试。</p>
        <button type="button" onClick={retryUnitsLoad}>重试</button>
      </div>}
      {bookDataStatus === "error" && <div className="records-data-status" role="status">
        <p>这一册作品资料读取失败，作品详情中的知识点暂不可用。</p>
        <button type="button" onClick={onRetryBookData}>重试</button>
      </div>}

      {units.length > 0 && <div className="records-reader">
        <aside aria-label="单元导航" className="records-unit-rail">
          <span aria-hidden="true" className="records-unit-rail-marker" style={{ "--unit-index": activeIndex } as CSSProperties} />
          {units.map((unit) => {
            const active = unit.id === activeUnit?.id;
            return <button aria-label={unit.title} aria-current={active ? "location" : undefined} className={active ? "is-active" : ""} key={unit.id} onClick={() => goToUnit(unit)} type="button">
              <span>{unit.numeral ?? UNIT_NUMERALS[unit.order - 1] ?? unit.order}</span>
              <span aria-hidden="true" className="records-unit-tooltip">{unit.title}</span>
            </button>;
          })}
        </aside>

        <div className="records-chapters">
          {chapterContents}
        </div>

        <aside aria-label="本单元提示" className="records-unit-notes">
          {activeUnit && activeUnit.kind !== "project" && <>
            <p className="records-notes-label">本单元关键词</p>
            <ul className="records-keywords">{commonKeywords.map((keyword) => <li key={`${keyword.name}-${keyword.type ?? ""}`}>
              <button type="button" onClick={() => onKnowledge(keyword.name, keyword.type)}><span>{keyword.name}</span><small>×{keyword.count}</small></button>
            </li>)}</ul>
            {featuredQuote?.summary && <blockquote className="records-unit-quote">
              <p>「{featuredQuote.summary}」</p>
              <cite>——{featuredQuote.name}的表现主题</cite>
            </blockquote>}
          </>}
        </aside>
      </div>}

      {!units.length && !unitsError && <p className="records-data-status" role="status">正在载入本册篇章…</p>}
    </section>

    {detailWork && <WorkDetail
      bookData={bookData}
      bookDataStatus={bookDataStatus}
      bookTitle={directory.title}
      detailsReady={detailsReady}
      dialogRef={dialogRef}
      entry={selectedEntry}
      onClose={closeDetails}
      onLearn={onLearn}
      onRetryBookData={onRetryBookData}
      onRetryUnits={retryUnitsLoad}
      unitsStatus={unitsStatus}
      workEntity={selectedEntity}
    />}
  </>;
}
