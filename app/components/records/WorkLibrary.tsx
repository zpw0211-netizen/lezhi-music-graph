"use client";

/* The book and score covers are editorial artwork served from public/. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { CSSProperties, RefObject } from "react";
import { MelodyPlayer, MelodySet } from "../lesson/MelodyPlayer";
import { MELODIES } from "../../lib/lesson/melodies";
import { bareWorkName, type Book, type BookDirectory, type Entity, type Triple } from "../../lib/app/types";
import { BOOK_BY_KEY, volumeNumeral } from "../../lib/app/books";
import { publicAssetUrl } from "../../lib/app/assets";
import { RECORDS_FOCUS_UNIT_KEY } from "../../lib/app/focus-unit";
import { unitArtPath } from "../../lib/app/unit-art";
import type { BookDataStatus } from "../../hooks/useGraphIndex";
import { playPageTurn, playStamp, readBookSoundOn, saveBookSoundOn } from "../../lib/records/book-sounds";

type UnitWork = {
  id: string;
  name: string;
  type: string;
  modes?: string[];
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
const EARLY_PRIMARY_ACTIVITY_MODES = ["唱歌", "聆听", "演奏", "音乐游戏", "情境表演", "能力进阶"];
const LATER_PRIMARY_ACTIVITY_MODES = ["演唱", "欣赏", "知识与技能"];
// Per-viewer conveniences only: which works this browser has opened or played, and the last page per book.
const LEARNED_STORAGE_KEY = "yapu-learned-works";
const PAGE_STORAGE_PREFIX = "yapu-records-page:";
/** What a pupil does with a work in class: sing, listen, play an instrument, or a music game. */
const ACTIVITY_GROUPS = [
  { key: "sing", label: "唱", title: "唱一唱", modes: ["唱歌", "演唱", "视唱", "背唱", "选听选唱"] },
  { key: "listen", label: "听", title: "听一听", modes: ["聆听", "欣赏", "选听选唱"] },
  { key: "play", label: "奏", title: "奏一奏", modes: ["演奏"] },
  { key: "move", label: "玩", title: "玩一玩", modes: ["音乐游戏", "情境表演", "编创与展示", "律动", "音乐情景剧", "小小音乐剧"] },
] as const;
type ActivityKey = (typeof ACTIVITY_GROUPS)[number]["key"];
// Keyword types a pupil can read at a glance; key, meter and tempo marks and long theme sentences stay in the graph.
const FRIENDLY_KEYWORD_TYPES = new Set(["乐器", "民族", "地域", "音乐体裁", "表演形式"]);
const FRIENDLY_KEYWORD_LIMIT = 8;

function workActivities(work: UnitWork): ActivityKey[] {
  const modes: readonly string[] = work.modes ?? [];
  const keys = ACTIVITY_GROUPS.filter((group) => group.modes.some((mode) => modes.includes(mode))).map((group) => group.key);
  if (keys.length) return keys;
  return [/歌|唱|谣|号子/.test(work.type) ? "sing" : "listen"];
}

function unitAnchorId(bookKey: string, unitId: string) {
  return `records-${bookKey}-${unitId}`;
}

function learnedKey(bookKey: string, workId: string) {
  return `${bookKey}:${workId}`;
}

function readLearned(): Set<string> {
  try {
    const list = JSON.parse(window.localStorage.getItem(LEARNED_STORAGE_KEY) ?? "[]") as unknown;
    return new Set(Array.isArray(list) ? list.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable=true]"));
}

/** The 芽谱 sprout that grows with the share of works learned in this book. */
function Sprout({ progress, large }: { progress: number; large?: boolean }) {
  const stage = progress >= 1 ? 4 : progress >= .6 ? 3 : progress >= .3 ? 2 : progress > 0 ? 1 : 0;
  const grown = (min: number) => (stage >= min ? " is-grown" : "");
  return <svg aria-hidden="true" className={`records-sprout${large ? " is-large" : ""}`} data-stage={stage} viewBox="0 0 64 80">
    <path className="records-sprout-soil" d="M6 71 Q32 63 58 71 L56 76 Q32 70 8 76Z" />
    <ellipse className={`records-sprout-seed${stage ? "" : " is-grown"}`} cx="32" cy="66" rx="4.5" ry="3.2" />
    <path className={`records-sprout-stem${grown(1)}`} d="M32 68 C32 58 31 46 32 32" pathLength={1} style={{ strokeDashoffset: [1, .55, .3, 0, 0][stage] }} />
    <path className={`records-sprout-leaf is-left-low${grown(1)}`} d="M32 58 C24 57 17 51 15 44 C24 43 30 49 32 58Z" />
    <path className={`records-sprout-leaf is-right${grown(2)}`} d="M32 50 C40 48 47 41 49 34 C40 34 34 41 32 50Z" />
    <path className={`records-sprout-leaf is-left-high${grown(3)}`} d="M32 42 C25 40 20 34 20 28 C27 28 31 34 32 42Z" />
    <g className={`records-sprout-bloom${grown(4)}`}>
      {[0, 72, 144, 216, 288].map((angle) => <ellipse cx="32" cy="22" key={angle} rx="4.2" ry="7" transform={`rotate(${angle} 32 29)`} />)}
      <circle cx="32" cy="29" r="3.6" />
    </g>
  </svg>;
}

function routeTitleFor(work: UnitWork, works: readonly UnitWork[]) {
  const bareName = bareWorkName(work.name);
  const sameNameCount = works.filter((candidate) => bareWorkName(candidate.name) === bareName).length;
  return sameNameCount > 1 ? `${bareName}~${work.type}` : bareName;
}

function unitArtwork(unit: TextbookUnit) {
  return unit.kind === "project"
    ? `art/${unit.bookKey}.webp`
    : unitArtPath(unit.bookKey, unit.order) ?? `art/${unit.bookKey}.webp`;
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
        <h2 className="records-detail-title" id="records-detail-title">{work.name}</h2>
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
        <h2 className="records-detail-title" id="records-detail-title">{isLoading ? "正在读取作品资料…" : hasLoadError ? "作品资料读取失败" : "没有找到这首作品"}</h2>
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
  onOpenBook,
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
  onOpenBook?: (bookKey: string) => void;
}) {
  const [unitRows, setUnitRows] = useState<TextbookUnit[] | null>(null);
  const [unitsError, setUnitsError] = useState(false);
  const [retryUnits, setRetryUnits] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [taskUnits, setTaskUnits] = useState<ReadonlySet<string>>(() => new Set());
  // Only ever rendered in the browser (loaded after the data index), so storage can seed the first render.
  const [learned, setLearned] = useState<ReadonlySet<string>>(() => (typeof window === "undefined" ? new Set() : readLearned()));
  const dialogRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const libraryRef = useRef<HTMLElement>(null);
  const restoredBook = useRef("");
  const openedWorkId = useRef("");
  // A work opened from a card gets its stamp when the detail closes, so the student sees it land.
  const [pendingStamp, setPendingStamp] = useState<UnitWork | null>(null);
  const [soundOn, setSoundOn] = useState(() => (typeof window === "undefined" ? true : readBookSoundOn()));
  const soundOnRef = useRef(soundOn);
  // The page a turn is heading to; the scroll position catches up during a smooth turn.
  const targetPage = useRef(0);

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
  const isPrimaryBook = BOOK_BY_KEY.get(directory?.key ?? bookKey)?.stage === "小学";
  useEffect(() => {
    const selectedBook = document.querySelector<HTMLButtonElement>(
      ".records-top-book-picker > button.is-active",
    );
    if (!selectedBook) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    selectedBook.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [bookKey, books]);

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
  const bookNumeral = volumeNumeral(directory?.key ?? bookKey, books);
  const currentBookKey = directory?.key ?? bookKey;
  // Pages of the book, left to right: cover, one spread per unit, then the closing page.
  const pageCount = units.length ? units.length + 2 : 1;
  const learnedIn = useCallback((works: readonly UnitWork[]) => works.filter((work) => learned.has(learnedKey(currentBookKey, work.id))).length, [currentBookKey, learned]);
  const learnedCount = learnedIn(allWorks);
  const bookIndex = books.findIndex((item) => item.key === currentBookKey);
  const nextBook = bookIndex >= 0 ? books[bookIndex + 1] : undefined;

  const markLearned = useCallback((work: UnitWork, quiet = false) => {
    const key = learnedKey(currentBookKey, work.id);
    if (!quiet && soundOnRef.current && !learned.has(key)) playStamp();
    setLearned((current) => {
      if (current.has(key)) return current;
      const next = new Set(current).add(key);
      try { window.localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify([...next])); } catch { /* The stamp still shows for this visit. */ }
      return next;
    });
  }, [currentBookKey, learned]);

  const toggleSound = useCallback(() => {
    setSoundOn((current) => {
      soundOnRef.current = !current;
      saveBookSoundOn(!current);
      return !current;
    });
  }, []);

  const goToPage = useCallback((index: number, instant = false) => {
    const track = trackRef.current;
    if (!track) return;
    const last = track.querySelectorAll(":scope > .records-page").length - 1;
    const target = Math.max(0, Math.min(last, index));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!instant && target !== targetPage.current && soundOnRef.current) playPageTurn();
    targetPage.current = target;
    track.scrollTo({ left: target * track.clientWidth, behavior: instant || reduced ? "auto" : "smooth" });
  }, []);

  // The book fills the screen under the sticky top bar, so the pages turn sideways instead of the page scrolling down.
  useLayoutEffect(() => {
    const library = libraryRef.current;
    const nav = document.querySelector<HTMLElement>(".home-nav");
    if (!library || !nav) return;
    const apply = () => library.style.setProperty("--records-nav-h", `${Math.round(nav.getBoundingClientRect().height)}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setPageIndex(Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));
    };
    // A swipe or trackpad turn lands here without going through goToPage.
    const onScrollEnd = () => {
      const landed = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      if (landed !== targetPage.current && soundOnRef.current) playPageTurn();
      targetPage.current = landed;
    };
    // A mouse wheel turns the page, unless the part under the pointer can still scroll that way itself.
    let wheelLock = 0;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      for (let node = event.target as HTMLElement | null; node && node !== track; node = node.parentElement) {
        const overflow = window.getComputedStyle(node).overflowY;
        if (!/(auto|scroll)/.test(overflow) || node.scrollHeight <= node.clientHeight + 1) continue;
        const canScroll = event.deltaY > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight - 1 : node.scrollTop > 0;
        if (canScroll) return;
      }
      event.preventDefault();
      // One gesture turns one page: a trackpad's momentum keeps extending the lock.
      if (wheelLock) {
        window.clearTimeout(wheelLock);
        wheelLock = window.setTimeout(() => { wheelLock = 0; }, 260);
        return;
      }
      wheelLock = window.setTimeout(() => { wheelLock = 0; }, 260);
      goToPage(targetPage.current + (event.deltaY > 0 ? 1 : -1));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("scrollend", onScrollEnd);
    track.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(wheelLock);
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("scrollend", onScrollEnd);
      track.removeEventListener("wheel", onWheel);
    };
  }, [goToPage, units.length]);

  useEffect(() => {
    if (detailWork) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") { event.preventDefault(); goToPage(targetPage.current + 1); }
      else if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); goToPage(targetPage.current - 1); }
      else if (event.key === "Home") { event.preventDefault(); goToPage(0); }
      else if (event.key === "End") { event.preventDefault(); goToPage(pageCount - 1); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailWork, goToPage, pageCount]);

  // Reveal a spread when it turns into view; fetch its images (and its neighbours') a little earlier.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !units.length) return;
    const pages = Array.from(track.querySelectorAll<HTMLElement>(":scope > .records-page"));
    const reveal = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        reveal.unobserve(entry.target);
      }
    }, { root: track, threshold: .35 });
    const preload = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.querySelectorAll<HTMLImageElement>(".records-lazy-image[data-src]").forEach((image) => {
          image.src = image.dataset.src ?? "";
          delete image.dataset.src;
        });
        preload.unobserve(entry.target);
      }
    }, { root: track, rootMargin: "0px 110%" });
    for (const page of pages) {
      reveal.observe(page);
      preload.observe(page);
    }
    return () => {
      reveal.disconnect();
      preload.disconnect();
    };
  }, [units]);

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

  // Stamp the work once its detail closes and the card is back in view.
  const detailWasOpen = useRef(false);
  useEffect(() => {
    if (detailWork) {
      detailWasOpen.current = true;
      return;
    }
    if (!pendingStamp) {
      detailWasOpen.current = false;
      return;
    }
    if (!detailWasOpen.current) return;
    const frame = requestAnimationFrame(() => {
      detailWasOpen.current = false;
      markLearned(pendingStamp);
      setPendingStamp(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [detailWork, markLearned, pendingStamp]);

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
    goToPage(units.findIndex((item) => item.id === unit.id) + 1);
  }, [goToPage, units]);

  // Open on the unit the home page asked for ("<bookKey>:<unitId>"), else where this book was left.
  useLayoutEffect(() => {
    if (!units.length || restoredBook.current === currentBookKey) return;
    restoredBook.current = currentBookKey;
    let requested: string | null = null;
    let saved: string | null = null;
    try {
      requested = window.sessionStorage.getItem(RECORDS_FOCUS_UNIT_KEY);
      if (requested) window.sessionStorage.removeItem(RECORDS_FOCUS_UNIT_KEY);
      saved = window.sessionStorage.getItem(PAGE_STORAGE_PREFIX + currentBookKey);
    } catch { /* Start from the cover. */ }
    const [requestedBook, requestedUnit] = requested?.split(":") ?? [];
    const requestedIndex = requestedBook === currentBookKey ? units.findIndex((item) => item.id === requestedUnit) : -1;
    const index = requestedIndex >= 0 ? requestedIndex + 1 : Math.min(Number(saved) || 0, units.length + 1);
    goToPage(index, true);
    if (requestedIndex >= 0) {
      const title = document.getElementById(`${unitAnchorId(currentBookKey, units[requestedIndex].id)}-title`);
      if (title) {
        title.tabIndex = -1;
        title.focus({ preventScroll: true });
      }
    }
  }, [currentBookKey, goToPage, units]);

  // On narrow screens the journey strip scrolls; keep the current stop in view.
  useEffect(() => {
    const stops = libraryRef.current?.querySelector<HTMLElement>(".records-journey-stops");
    const current = stops?.querySelector<HTMLElement>("button[aria-current=page]");
    if (!stops || !current || stops.scrollWidth <= stops.clientWidth) return;
    const left = (current.parentElement?.offsetLeft ?? 0) - (stops.clientWidth - current.offsetWidth) / 2;
    stops.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [pageIndex]);

  useEffect(() => {
    if (restoredBook.current !== currentBookKey) return;
    try { window.sessionStorage.setItem(PAGE_STORAGE_PREFIX + currentBookKey, String(pageIndex)); } catch { /* Not remembered. */ }
  }, [currentBookKey, pageIndex]);

  const openWork = useCallback((work: UnitWork, sourceCard?: HTMLButtonElement) => {
    const routeTitle = routeTitleFor(work, allWorks);
    setPendingStamp(work);
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

  const [activityFilters, setActivityFilters] = useState<Record<string, ActivityKey>>({});
  const toggleActivity = useCallback((unitId: string, key: ActivityKey | null) => {
    setActivityFilters((current) => {
      const next = { ...current };
      if (!key || next[unitId] === key) delete next[unitId];
      else next[unitId] = key;
      return next;
    });
  }, []);

  const toggleTasks = useCallback((unitId: string, show: boolean) => {
    setTaskUnits((current) => {
      const next = new Set(current);
      if (show) next.add(unitId);
      else next.delete(unitId);
      return next;
    });
  }, []);

  const chapterContents = useMemo(() => units.map((unit) => {
    const anchorId = unitAnchorId(currentBookKey, unit.id);
    const tasks = unit.kind === "project" ? [] : (unit.tasks ?? []);
    const showTasks = tasks.length > 0 && taskUnits.has(unit.id);
    const numeral = unit.numeral ?? UNIT_NUMERALS[unit.order - 1] ?? unit.order;
    const friendlyKeywords = (unit.keywords ?? [])
      .filter((keyword) => keyword.type && FRIENDLY_KEYWORD_TYPES.has(keyword.type) && keyword.name.length <= 8)
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "zh"))
      .slice(0, FRIENDLY_KEYWORD_LIMIT);
    const activityCounts = ACTIVITY_GROUPS
      .map((group) => ({ group, count: unit.works.filter((work) => workActivities(work).includes(group.key)).length }))
      .filter((entry) => entry.count > 0);
    const activityFilter = activityFilters[unit.id];
    const activityTitle = ACTIVITY_GROUPS.find((group) => group.key === activityFilter)?.title;
    // Textbook order: by printed page; a work without a page stays right after the work before it.
    let lastPage = 0;
    const pageKeys = unit.works.map((work) => {
      lastPage = work.page ?? lastPage;
      return { work, page: lastPage };
    });
    const sortedWorks = pageKeys.sort((left, right) => left.page - right.page).map((entry) => entry.work);
    const shownWorks = activityFilter ? sortedWorks.filter((work) => workActivities(work).includes(activityFilter)) : sortedWorks;
    const featuredQuote = unit.works.find((work) => work.starred && work.summary)
      ?? unit.works.find((work) => work.summary);
    const unitLearned = learnedIn(unit.works);
    return <article
      aria-labelledby={`${anchorId}-title`}
      aria-roledescription="单元页"
      className={`records-chapter records-page${unit.kind === "project" ? " is-project" : ""}`}
      data-kind={unit.kind ?? "chapter"}
      data-chapter-reveal
      data-unit-id={unit.id}
      id={anchorId}
      key={unit.id}
    >
      <div className="records-leaf records-leaf-intro">
        <figure className="records-chapter-art">
          <img alt={`${unit.title}单元插画`} className="records-chapter-art-image records-lazy-image" data-src={publicAssetUrl(unitArtwork(unit))} decoding="async" height="750" loading="lazy" width="1200" />
        </figure>
        <header className="records-chapter-title-block">
          <span aria-hidden="true" className="records-chapter-number">{numeral}</span>
          <div>
            <p className="records-chapter-kicker">第 {numeral} 单元</p>
            <h2 id={`${anchorId}-title`}>{unit.title}</h2>
            {unit.theme && <span className="records-theme-seal">{unit.theme}</span>}
          </div>
        </header>

        {Boolean(unit.goals?.length) && <section className="records-chapter-goals" aria-label="本单元先读">
          <h3>本单元先读</h3>
          <ul>{unit.goals?.map((goal) => <li key={goal}>{goal}</li>)}</ul>
        </section>}

        {unit.kind !== "project" && activityCounts.length > 0 && <section aria-label="这一单元学什么" className="records-unit-activities">
          <p className="records-notes-label">这一单元</p>
          <div aria-label="按学习方式挑选作品" className="records-activity-tiles" role="group">
            {activityCounts.map(({ group, count }) => <button
              aria-pressed={activityFilter === group.key}
              className="records-activity-tile"
              data-activity={group.key}
              key={group.key}
              onClick={() => { toggleTasks(unit.id, false); toggleActivity(unit.id, group.key); }}
              type="button"
            >
              <span aria-hidden="true" className="records-activity-seal">{group.label}</span>
              <span className="records-activity-copy"><strong>{group.title}</strong><small>{count} 首</small></span>
            </button>)}
          </div>
        </section>}

        {unit.kind !== "project" && friendlyKeywords.length > 0 && <section aria-label="音乐小知识" className="records-unit-notes">
          <p className="records-notes-label">音乐小知识</p>
          <ul className="records-keywords">{friendlyKeywords.map((keyword) => <li key={`${keyword.name}-${keyword.type ?? ""}`}>
            <button type="button" onClick={() => onKnowledge(keyword.name, keyword.type)}><small>{keyword.type}</small><span>{keyword.name}</span></button>
          </li>)}</ul>
        </section>}

        {unit.kind !== "project" && featuredQuote?.summary && <blockquote className="records-unit-quote">
          <p>「{featuredQuote.summary}」</p>
          <cite>——{featuredQuote.name}的表现主题</cite>
        </blockquote>}
      </div>

      <div className="records-leaf records-leaf-works">
        <div className="records-leaf-head">
          {tasks.length > 0
            ? <div aria-label="本单元内容" className="records-leaf-tabs" role="group">
              <button aria-pressed={!showTasks} onClick={() => toggleTasks(unit.id, false)} type="button">作品<small>{unit.works.length}</small></button>
              <button aria-pressed={showTasks} onClick={() => toggleTasks(unit.id, true)} type="button">课堂任务<small>{tasks.length}</small></button>
            </div>
            : <h3>作品名录</h3>}
          <p className={`records-unit-progress${unitLearned === unit.works.length ? " is-done" : ""}`}>
            <span aria-hidden="true" style={{ "--unit-progress": unit.works.length ? unitLearned / unit.works.length : 0 } as CSSProperties} />
            已学 <b>{unitLearned}</b> / {unit.works.length}
          </p>
        </div>

        {showTasks
          ? <section aria-label="课堂任务" className="records-chapter-tasks">
            <ol>{tasks.map((task, taskIndex) => <li key={`${unit.id}-task-${taskIndex}`}>
              <p>{splitTaskText(task.text, task.works, worksById, openWork)}</p>
              {task.focus?.length > 0 && <div className="records-task-focus" aria-label="练习重点">
                {task.focus.map((focus) => <span key={focus}>{focus}</span>)}
              </div>}
            </li>)}</ol>
          </section>
          : <section aria-label="作品名录" className="records-chapter-works">
            {activityTitle && <p className="records-activity-note">
              正在看「{activityTitle}」的 {shownWorks.length} 首作品
              <button onClick={() => toggleActivity(unit.id, null)} type="button">看全部</button>
            </p>}
            <div className="records-score-grid">
              {shownWorks.map((work, workIndex) => {
                const starred = Boolean(work.starred);
                const isLearned = learned.has(learnedKey(currentBookKey, work.id));
                const melodies = MELODIES[bareWorkName(work.name)] ?? MELODIES[work.name] ?? [];
                const authors = work.authors?.map((author) => `${author.role} ${author.name}`).join(" · ");
                const credits = [work.type, authors].filter(Boolean).join(" · ");
                const modes = isPrimaryBook ? work.modes?.join("、") : "";
                const activityModeSet = (directory?.grade ?? 3) <= 2 ? EARLY_PRIMARY_ACTIVITY_MODES : LATER_PRIMARY_ACTIVITY_MODES;
                const activityModes = isPrimaryBook ? (work.modes ?? []).filter((mode) => activityModeSet.includes(mode)) : [];
                return <article className={`records-score-card${isLearned ? " is-learned" : ""}`} data-mode={modes || undefined} key={work.id} style={{ "--card-index": workIndex } as CSSProperties}>
                  <button
                    aria-label={`打开${work.name}作品详情${modes ? `，学习方式：${modes}` : ""}${isLearned ? "，已学" : ""}`}
                    className="records-score-open"
                    id={`records-work-${work.id}`}
                    onClick={(event) => openWork(work, event.currentTarget)}
                    type="button"
                  >
                    <span aria-hidden="true" className="records-score-image-wrap">
                      {work.scores?.[0]
                        ? <img alt="" className="records-score-image records-lazy-image" data-src={publicAssetUrl(work.scores[0])} decoding="async" loading="lazy" />
                        : <span className="records-score-placeholder"><span>{work.name}</span></span>}
                      {starred && <span className="records-star-seal">重点曲目</span>}
                      {isLearned && <span className="records-learned-seal">已学</span>}
                      {work.page != null && <span className="records-score-page">教材第 {work.page} 页</span>}
                    </span>
                    <span aria-hidden="true" className="records-score-copy">
                      <strong>{work.name}</strong>
                      {credits && <span className="records-score-authors">{credits}</span>}
                      {activityModes.length > 0 && <span className="records-primary-work-stamps" aria-label={`学习活动：${activityModes.join("、")}`}>
                        {activityModes.map((mode) => <span className="records-primary-work-stamp" key={mode}>{mode}</span>)}
                      </span>}
                    </span>
                  </button>
                  {work.hasMelody && melodies[0] && <span className="records-score-play" onClickCapture={() => markLearned(work)}>
                    <MelodyPlayer melody={melodies[0]} />
                  </span>}
                </article>;
              })}
            </div>
          </section>}
      </div>
    </article>;
  }), [activityFilters, currentBookKey, directory?.grade, isPrimaryBook, learned, learnedIn, markLearned, onKnowledge, openWork, taskUnits, toggleActivity, toggleTasks, units, worksById]);

  if (!directory) return null;
  const displayTitle = directory.title.replace(/^人音版/, "");
  const detailsReady = bookDataStatus === "ready" && Boolean(bookData);
  const bookProgress = workCount ? learnedCount / workCount : 0;
  const endTitle = workCount && learnedCount === workCount ? "小芽开花啦！" : learnedCount ? "小芽长高了" : "种下一颗小芽";
  const chevron = (direction: "left" | "right") => <svg aria-hidden="true" viewBox="0 0 24 24"><path d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} /></svg>;
  return <>
    <section aria-hidden={detailWork ? true : undefined} className="work-library is-pager" data-book={directory.key} data-grade={directory.grade} ref={libraryRef}>
      <div className="records-pager">
        <div aria-label={`${displayTitle}，左右翻页`} aria-roledescription="翻页书" className="records-pager-track" ref={trackRef} role="region">
          <section aria-label="封面" aria-roledescription="封面" className="records-page records-cover">
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
                      <small>{learnedIn(unit.works) ? `${learnedIn(unit.works)}/` : ""}{unit.works.length} 首</small>
                    </button>)}
                  </nav>
                  : <div aria-hidden="true" className="records-book-directory records-book-directory-placeholder" />}
                {!unitsError && <div className="records-cover-actions">
                  <button className="records-cover-start" disabled={!units.length} onClick={() => goToPage(1)} type="button">翻开第一单元{chevron("right")}</button>
                  <span aria-hidden="true" className="records-swipe-hint"><i />左右滑动翻页</span>
                </div>}
                {unitsError && <div className="records-data-status" role="status">
                  <p>本册目录读取失败，请重试。</p>
                  <button type="button" onClick={retryUnitsLoad}>重试</button>
                </div>}
                {bookDataStatus === "error" && <div className="records-data-status" role="status">
                  <p>这一册作品资料读取失败，作品详情中的知识点暂不可用。</p>
                  <button type="button" onClick={onRetryBookData}>重试</button>
                </div>}
                {!units.length && !unitsError && <p className="records-data-status" role="status">正在载入本册单元…</p>}
              </div>
            </header>
          </section>

          {chapterContents}

          {units.length > 0 && <section aria-labelledby="records-end-title" aria-roledescription="卷尾" className="records-page records-end">
            <div className="records-end-inner">
              <Sprout large progress={bookProgress} />
              <div className="records-end-copy">
                <p className="records-book-kicker">卷尾 · 我的小芽</p>
                <h2 id="records-end-title">{endTitle}</h2>
                <p className="records-end-lead">本册共 {workCount} 首作品，你已学了 <b>{learnedCount}</b> 首。打开一首作品，或听一遍它的旋律，就会盖上「已学」章。</p>
                <ol className="records-end-units">{units.map((unit) => {
                  const done = learnedIn(unit.works);
                  return <li key={unit.id}>
                    <button className={done === unit.works.length ? "is-done" : ""} onClick={() => goToUnit(unit)} type="button">
                      <span>{unit.numeral ?? UNIT_NUMERALS[unit.order - 1] ?? unit.order}</span>
                      <strong>{unit.title}</strong>
                      <small>{done} / {unit.works.length}</small>
                    </button>
                  </li>;
                })}</ol>
                <div className="records-end-actions">
                  {nextBook && onOpenBook && <button className="records-cover-start" onClick={() => onOpenBook(nextBook.key)} type="button">下一册：{nextBook.title.replace(/^人音版/, "")}{chevron("right")}</button>}
                  <button className="records-end-again" onClick={() => goToPage(0)} type="button">回到封面</button>
                </div>
              </div>
            </div>
          </section>}
        </div>

        {pageCount > 1 && <>
          <button aria-hidden="true" className="records-edge is-prev" disabled={pageIndex === 0} onClick={() => goToPage(targetPage.current - 1)} tabIndex={-1} type="button">{chevron("left")}</button>
          <button aria-hidden="true" className="records-edge is-next" disabled={pageIndex >= pageCount - 1} onClick={() => goToPage(targetPage.current + 1)} tabIndex={-1} type="button">{chevron("right")}</button>
        </>}
      </div>

      <nav aria-label="翻页" className="records-journey">
        {units.length > 0 && <>
          <button aria-label="上一页" className="records-journey-arrow" disabled={pageIndex === 0} onClick={() => goToPage(targetPage.current - 1)} type="button">{chevron("left")}</button>
          <div className="records-journey-stops" style={{ "--page-index": pageIndex } as CSSProperties}>
            <span aria-hidden="true" className="records-journey-drop" />
            <ol>
              <li><button aria-current={pageIndex === 0 ? "page" : undefined} aria-label="封面" className="is-cover" onClick={() => goToPage(0)} type="button"><span>封</span></button></li>
              {units.map((unit, index) => {
                const numeral = unit.numeral ?? UNIT_NUMERALS[unit.order - 1] ?? unit.order;
                const done = learnedIn(unit.works);
                return <li key={unit.id}>
                  <button
                    aria-current={pageIndex === index + 1 ? "page" : undefined}
                    aria-label={`第${numeral}单元 ${unit.title}，已学 ${done} / ${unit.works.length}`}
                    className={done && done === unit.works.length ? "is-done" : ""}
                    onClick={() => goToPage(index + 1)}
                    style={{ "--unit-progress": unit.works.length ? done / unit.works.length : 0 } as CSSProperties}
                    type="button"
                  >
                    <span>{numeral}</span>
                    <span aria-hidden="true" className="records-unit-tooltip">{unit.title}</span>
                  </button>
                </li>;
              })}
              {units.length > 0 && <li><button aria-current={pageIndex === pageCount - 1 ? "page" : undefined} aria-label="卷尾：我的小芽" className="is-end" onClick={() => goToPage(pageCount - 1)} type="button"><span>尾</span></button></li>}
            </ol>
          </div>
          <p aria-label={`本册已学 ${learnedCount} / ${workCount} 首`} className="records-journey-growth">
            <Sprout progress={bookProgress} />
            <span aria-hidden="true"><b>{learnedCount}</b> / {workCount}</span>
          </p>
          <button aria-label="翻页和盖章音效" aria-pressed={soundOn} className="records-journey-sound" onClick={toggleSound} title={soundOn ? "关闭音效" : "打开音效"} type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path className="records-sound-body" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
              {soundOn ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
            </svg>
          </button>
          <button aria-label="下一页" className="records-journey-arrow" disabled={pageIndex >= pageCount - 1} onClick={() => goToPage(targetPage.current + 1)} type="button">{chevron("right")}</button>
        </>}
      </nav>
    </section>

    {detailWork && <WorkDetail
      bookData={bookData}
      bookDataStatus={bookDataStatus}
      bookTitle={directory.title}
      detailsReady={detailsReady}
      dialogRef={dialogRef}
      entry={selectedEntry}
      onClose={closeDetails}
      onLearn={(workId) => {
        // Leaving for the full lesson page still counts as learned.
        if (pendingStamp) markLearned(pendingStamp, true);
        setPendingStamp(null);
        onLearn(workId);
      }}
      onRetryBookData={onRetryBookData}
      onRetryUnits={retryUnitsLoad}
      unitsStatus={unitsStatus}
      workEntity={selectedEntity}
    />}
  </>;
}
