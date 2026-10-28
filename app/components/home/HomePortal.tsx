"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent } from "react";
import type { Melody } from "../../lib/lesson/jianpu";
import { publicAssetUrl } from "../../lib/app/assets";
import {
  EDITION,
  stripEditionPrefix,
  PUBLISHED_BOOK_COUNT_LABEL,
  BOOK_REGISTRY,
  PUBLISHED_BOOKS,
  PUBLISHED_GRADE_RANGE_LABEL,
  availableBookStages,
  bookStageForKey,
  booksForStage,
  volumeNumeral,
  type BookStage,
} from "../../lib/app/books";
import { RECORDS_FOCUS_UNIT_KEY } from "../../lib/app/focus-unit";
import { WorkbenchIcon } from "../WorkbenchIcon";
import { AppTopNav } from "../AppTopNav";
import { BrandLogo } from "./BrandMark";
import { SITE_NAME } from "../../lib/app/brand";
import type { MelodyPlayer as MelodyPlayerComponent } from "../lesson/MelodyPlayer";
import { fetchWithRetry } from "../../lib/app/fetch-retry";
type PortalEntity = { id: string; name: string; type: string; category?: string; textbookCount?: number; degree?: number; bookKeys?: string[] };
type PortalRelationship = { subject: string; objectId?: string | null; predicate: string; label?: string };
type PortalBook = { key: string; title: string; grade: number; semester: string; entityCount: number; tripleCount: number; workCount: number; pages: number };
type PortalGraph = { entities: PortalEntity[]; relationships: PortalRelationship[] };
type PortalSearchBook = Pick<PortalBook, "key" | "title" | "grade" | "semester">;
type PortalSearchResult<E, B extends PortalSearchBook> = { entity: E; book: B; relationCount: number; matchedBy: string };
type PortalView = "graph" | "assistant" | "research" | "records" | "lab" | "atlas";
type PortalUnit = { id: string; bookKey: string; order: number; name: string; title: string; numeral: string; theme?: string; goals?: string[]; works?: Array<unknown> };
type PropsOf<C> = C extends (props: infer P) => unknown ? P : never;
const HOT_SEARCHES = EDITION.hotSearches ?? [];
const HOME_LAST_READ_BOOK_KEY = "yapu-home-last-book";
const HOME_LAST_READ_CHANGE_EVENT = "yapu:home-last-book-change";
const BOOKMARKS = [
  { label: "音乐探索与创造", lines: ["音乐探索", "与创造"], description: "在地图、年表与律盘之间切换，看音乐的地域、年代与声音。", file: "art/bookmarks/map.webp", href: "#/atlas" },
  { label: "知识图谱", lines: ["知识", "图谱"], description: "从一个知识点查看它和作品的联系。", file: "art/bookmarks/graph.webp", href: null },
] as const;
const PENTATONIC = [
  { name: "宫", degree: 1, note: "do" }, { name: "商", degree: 2, note: "re" },
  { name: "角", degree: 3, note: "mi" }, { name: "徵", degree: 5, note: "sol" },
  { name: "羽", degree: 6, note: "la" },
];
const BOOK_ART = Object.fromEntries(PUBLISHED_BOOKS.filter((book) => book.coverArt).map((book) => [
  book.key,
  { file: `art/${book.key}.webp`, alt: `${book.title}封面插画` },
])) as Record<string, { file: string; alt: string }>;
const LAB_MELODIES: Melody[] = PENTATONIC.map(note => ({
  key: "1=C", tonic: "C", tonicMidi: 60, meter: "4/4", bpm: 168, source: "五声音阶交互示范",
  bars: [[{ d: note.degree, b: 0.5 }]],
}));
const PENTATONIC_PHRASE: Melody = {
  key: "1=C", tonic: "C", tonicMidi: 60, meter: "4/4", bpm: 168, source: "五声音阶交互示范",
  bars: [[1, 2, 3, 5, 6, 5, 3, 2, 1].map(degree => ({ d: degree, b: 0.5 }))],
};
// The shelf only needs each book's key, title, grade and term, which ship with the page; drawing it from
// them means the shelf appears at once instead of popping in after the ~3.6MB graph index arrives.
const STATIC_SHELF_BOOKS = PUBLISHED_BOOKS.map((book) => ({ key: book.key, title: book.title, grade: book.grade, semester: book.semester, pages: book.pages, entityCount: 0, tripleCount: 0, workCount: 0 }));
const bookArt = (book: { key: string; title: string }) => BOOK_ART[book.key] ?? { file: `art/${book.key}.webp`, alt: `${stripEditionPrefix(book.title)}封面插画` };
const shortBookTitle = (book: { title: string }) => stripEditionPrefix(book.title);
/** "六年级上册（简谱）" → ["六年级", "上册（简谱）"], so a label never wraps a lone character onto its own line. */
const splitBookTitle = (book: { title: string }): [string, string] => {
  const match = shortBookTitle(book).match(/^(.+?年级)(.+)$/);
  return match ? [match[1], match[2]] : [shortBookTitle(book), ""];
};
const MelodyPlayer = dynamic<PropsOf<typeof MelodyPlayerComponent>>(
  () => import("../lesson/MelodyPlayer").then(module => module.MelodyPlayer),
  { loading: () => <span role="status">钢琴音色准备中…</span> },
);
function subscribeToHomeLastRead(onChange: () => void) {
  window.addEventListener(HOME_LAST_READ_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(HOME_LAST_READ_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
function getHomeLastReadSnapshot() {
  try { return window.localStorage.getItem(HOME_LAST_READ_BOOK_KEY); } catch { return null; }
}
const getHomeLastReadServerSnapshot = () => null;
export function HomePortal<E extends PortalEntity, B extends PortalBook, R extends PortalSearchBook = B>({
  books, bookStage, onStageChange, query, onQuery, results, onPickResult, onSearch, onOpenBook, onOpenFullGraph, onView, onResearchInfo,
}: {
  books: B[]; bookStage: BookStage; graph: PortalGraph | null; query: string; onQuery: (value: string) => void;
  results: Array<PortalSearchResult<E, R>>; onPickResult: (entity: E, book: R) => void;
  onSearch: (event: FormEvent) => void; onOpenBook: (bookKey: string) => void; onOpenFullGraph: () => void;
  onStageChange: (stage: BookStage) => void;
  onView: (view: PortalView) => void; onPickEntityName: (name: string) => void; onResearchInfo: () => void;
}) {
  const searchInput = useRef<HTMLInputElement>(null);
  const labPlayerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [units, setUnits] = useState<PortalUnit[]>([]);
  const [openBookKey, setOpenBookKey] = useState<string | null>(null);
  const storedLastReadBookKey = useSyncExternalStore(subscribeToHomeLastRead, getHomeLastReadSnapshot, getHomeLastReadServerSnapshot);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const shelfBooks = books.length ? books : (STATIC_SHELF_BOOKS as unknown as B[]);
  const orderedBooks = useMemo(() => [...shelfBooks].sort((a, b) => a.grade - b.grade || (a.semester === b.semester ? 0 : a.semester === "上册" ? -1 : 1)), [shelfBooks]);
  const stageBooks = useMemo(() => booksForStage(orderedBooks, bookStage), [bookStage, orderedBooks]);
  const lastReadBookKey = orderedBooks.some(book => book.key === storedLastReadBookKey) ? storedLastReadBookKey : null;
  const activeBookKey = stageBooks.some(book => book.key === openBookKey)
    ? openBookKey ?? ""
    : stageBooks.some(book => book.key === lastReadBookKey)
      ? lastReadBookKey ?? ""
      : stageBooks[0]?.key ?? "";
  const activeBook = stageBooks.find(book => book.key === activeBookKey);
  const upcomingBooks = BOOK_REGISTRY.filter(book => !book.published && book.stage === bookStage);
  const unitsByBook = useMemo(() => {
    const grouped = new Map<string, PortalUnit[]>();
    for (const unit of units) grouped.set(unit.bookKey, [...(grouped.get(unit.bookKey) ?? []), unit]);
    for (const list of grouped.values()) list.sort((a, b) => a.order - b.order);
    return grouped;
  }, [units]);
  const fmt = (value: number) => value.toLocaleString("zh-CN");
  const focusSearch = () => { searchInput.current?.focus(); searchInput.current?.scrollIntoView({ block: "center", behavior: "smooth" }); };
  const rememberBook = (key: string) => {
    setOpenBookKey(key);
    const stage = bookStageForKey(key);
    if (stage) onStageChange(stage);
    try {
      window.localStorage.setItem(HOME_LAST_READ_BOOK_KEY, key);
      window.dispatchEvent(new Event(HOME_LAST_READ_CHANGE_EVENT));
    } catch { /* Storage can be disabled by the browser. */ }
  };
  const openBook = (book: B) => {
    rememberBook(book.key);
    onOpenBook(book.key);
  };
  const openUnit = (book: B, unit: PortalUnit) => {
    try { window.sessionStorage.setItem(RECORDS_FOCUS_UNIT_KEY, `${book.key}:${unit.id}`); } catch { /* Navigation still works without session storage. */ }
    rememberBook(book.key);
    onOpenBook(book.key);
  };
  const selectStage = (stage: BookStage) => {
    const firstBook = booksForStage(orderedBooks, stage)[0];
    if (!firstBook) return;
    setOpenBookKey(firstBook.key);
    onStageChange(stage);
  };
  useEffect(() => {
    let active = true;
    fetchWithRetry(publicAssetUrl("data/units.json"))
      .then(response => response.ok ? response.json() as Promise<PortalUnit[]> : [])
      .then(payload => { if (active && Array.isArray(payload)) setUnits(payload); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  const playSample = (index: number) => {
    labPlayerRefs.current[index]?.querySelector<HTMLButtonElement>(".melody-play")?.click();
    const note = index === 5 ? "phrase" : PENTATONIC[index]?.name;
    setActiveNote(note ?? null);
    window.setTimeout(() => setActiveNote(current => current === note ? null : current), index === 5 ? 1800 : 450);
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable='true']")) return;
      const index = ["1", "2", "3", "5", "6"].indexOf(event.key);
      if (index >= 0) playSample(index);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  return <div className="home-portal" style={{ "--home-sprouts": `url("${publicAssetUrl("art/home-sprouts.webp")}")` } as CSSProperties}>
    <AppTopNav active="home" onAbout={onResearchInfo}
      onNavigate={view => { if (view === "graph") onOpenFullGraph(); else if (view !== "home") onView(view); }}
      trailing={<button type="button" className="home-nav-search" onClick={focusSearch} aria-label="搜索"><WorkbenchIcon name="search" /></button>} />
    <main>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-inner">
          <div className="home-hero-primary">
            <div className="home-title-plate">
              <p className="home-hero-kicker">{EDITION.label} · {PUBLISHED_GRADE_RANGE_LABEL}</p>
              <div className="home-wordmark"><BrandLogo /><h1 id="home-title" className="home-title-accessible">{SITE_NAME}</h1></div>
              <p className="home-brand-tagline" aria-hidden="true">芽谱AI · 音乐数字教材平台</p>
            </div>
            <p className="home-hero-lead">翻开一册，<br />从这一课开始。</p>
          </div>
          <div className="home-hero-search-column">
            <form className="home-search" role="search" onSubmit={onSearch}>
              <input ref={searchInput} value={query} onChange={event => onQuery(event.target.value)} placeholder="搜索作品、人物、乐理或教材内容" aria-label="搜索作品、人物、乐理或教材内容" />
              <button type="submit">检索 <span aria-hidden="true">→</span></button>
              {query && results.length > 0 && <div className="home-search-results">
                {results.slice(0, 7).map(({ entity, book, relationCount }) => <button type="button" key={book.key + "-" + entity.id} onClick={() => onPickResult(entity, book)}>
                  <span><strong>{entity.name}</strong><small>{book.title} · {entity.type} · {relationCount} 条知识联系</small></span><WorkbenchIcon name="arrow" />
                </button>)}
              </div>}
            </form>
            <div className="home-hot"><span>试着搜索</span>{HOT_SEARCHES.map(term => <button key={term} type="button" onClick={() => { onQuery(term); focusSearch(); }}>{term}</button>)}</div>
          </div>
        </div>
      </section>
      <section className="home-scrolls" id="home-scrolls" aria-label={`${bookStage}教材`}>
        {activeBook && (() => {
          const book = activeBook;
          const art = bookArt(book);
          const bookUnits = unitsByBook.get(book.key) ?? [];
          const workCount = bookUnits.reduce((sum, unit) => sum + (unit.works?.length ?? 0), 0);
          const volume = volumeNumeral(book.key, orderedBooks);
          return <article key={book.key} className="home-feature" id="home-book-feature" aria-live="polite" aria-label={`卷${volume}，${book.title}`}>
            <div className="home-feature-art" aria-hidden="true">
              <Image src={publicAssetUrl(art.file)} alt="" width={1200} height={750} priority decoding="async" unoptimized />
            </div>
            <span className="home-scroll-stamp" aria-label="上次读到" hidden={lastReadBookKey !== book.key}>上次读到</span>
            <div className="home-scroll-copy">
              <p className="home-scroll-overline">卷 {volume} · {EDITION.label.split("·")[0]}</p>
              <h3>{shortBookTitle(book)}</h3>
              <p className="home-scroll-intro">{bookUnits[0]?.theme ? `从${bookUnits[0].theme}出发，一个单元一个单元读这册教材。` : "按单元阅读教材内容与关联作品。"}</p>
              {/* 单元目录还在加载时不显示“0 个单元”，但保留这一行的高度，避免内容跳动。 */}
              <p className="home-scroll-countline" aria-hidden={!bookUnits.length} style={bookUnits.length ? undefined : { visibility: "hidden" }}>{bookUnits.length} 个单元 · {fmt(workCount)} 首作品</p>
              <ol className="home-unit-list">{bookUnits.map(unit => <li key={unit.id}>
                <button type="button" aria-label={`${unit.numeral || unit.order}，${unit.name || unit.title}，进入${book.title}`} onClick={() => openUnit(book, unit)}>
                  <span className="home-unit-number">{unit.numeral || unit.order}</span><span className="home-unit-title">{unit.title || unit.name}</span>
                </button>
              </li>)}</ol>
              <button type="button" className="home-scroll-cta" onClick={() => openBook(book)}>翻开这一册 <WorkbenchIcon name="right" /></button>
            </div>
          </article>;
        })()}
        <div className="home-shelf-index">
          {availableBookStages(orderedBooks).length > 1 && <div className="home-stage-tabs" role="group" aria-label="选择学段">
            {availableBookStages(orderedBooks).map((stage) => <button key={stage} type="button" aria-pressed={bookStage === stage} onClick={() => selectStage(stage)}>{stage}</button>)}
          </div>}
          <div className="home-book-grid" role="group" aria-label={`${bookStage}各册，点选查看，再点一次翻开`}>
            {stageBooks.map((book, index) => {
              const isOpen = activeBookKey === book.key;
              const volume = volumeNumeral(book.key, orderedBooks);
              const [grade, rest] = splitBookTitle(book);
              return <button key={book.key} type="button" className={"home-scroll-trigger" + (isOpen ? " is-open" : "")}
                aria-label={`卷${volume}，${book.title}${isOpen ? "，再点一次翻开" : ""}`} aria-pressed={isOpen} aria-controls="home-book-feature"
                onPointerEnter={event => { if (event.pointerType !== "touch") setOpenBookKey(book.key); }}
                onFocus={() => setOpenBookKey(book.key)}
                onClick={() => { if (isOpen) openBook(book); else setOpenBookKey(book.key); }}>
                <Image src={publicAssetUrl(bookArt(book).file)} alt="" width={1200} height={750} loading={index < 3 ? "eager" : "lazy"} decoding="async" unoptimized />
                <span className="home-book-card-label">
                  <span className="home-scroll-number">卷{volume}</span>
                  <span className="home-scroll-name"><span>{grade}</span><span>{rest}</span></span>
                </span>
                {lastReadBookKey === book.key && <span className="home-book-card-mark" aria-hidden="true" title="上次读到" />}
              </button>;
            })}
            {/* Registered books not yet published keep their place on the shelf, so the whole series is visible. */}
            {upcomingBooks.map((book) => {
              const [grade, rest] = splitBookTitle(book);
              return <div key={book.key} className="home-scroll-trigger is-upcoming" aria-label={`${book.title}，整理中`}>
                <span className="home-book-card-label">
                  <span className="home-scroll-number">整理中</span>
                  <span className="home-scroll-name"><span>{grade}</span><span>{rest}</span></span>
                </span>
              </div>;
            })}
          </div>
        </div>
      </section>
      <section className="home-lab" aria-labelledby="home-lab-title">
        <div className="home-lab-heading" data-reveal>
          <p className="home-section-overline">音乐探索与创造</p><h2 id="home-lab-title">听见宫、商、角、徵、羽</h2>
          <p>循着地图认识地域，沿着年表读作品，再转动律盘，听见一首旋律里的五声与七声。</p>
          <button type="button" className="home-lab-phrase" onClick={() => playSample(5)} data-playing={activeNote === "phrase"} aria-pressed={activeNote === "phrase"}>▶ 上行再下行</button>
          <p className="home-lab-hint">按 1、2、3、5、6，也能依次弹奏五个音。</p>
          <a href="#/lab" className="home-lab-enter">进入音乐探索与创造 <WorkbenchIcon name="right" /></a>
        </div>
        <div className="home-pentatonic" role="group" aria-label="五声音阶，按数字 1、2、3、5、6 播放" data-reveal>
          {PENTATONIC.map((note, index) => <button key={note.name} type="button" className={activeNote === note.name ? "is-playing" : ""} onClick={() => playSample(index)} aria-label={"播放" + note.name + "音，键盘" + [1, 2, 3, 5, 6][index]} aria-pressed={activeNote === note.name}>
            <span className="home-key-index">{[1, 2, 3, 5, 6][index]}</span><span className="home-key-name">{note.name}</span><span className="home-key-note">{note.note}</span>
          </button>)}
        </div>
        <div className="home-lab-player" aria-hidden="true" inert>
          {[...LAB_MELODIES, PENTATONIC_PHRASE].map((melody, index) => <div key={index} ref={element => { labPlayerRefs.current[index] = element; }}><MelodyPlayer melody={melody} /></div>)}
        </div>
      </section>
      <section className="home-bookmarks" aria-labelledby="home-bookmark-title">
        <header className="home-bookmark-heading" data-reveal>
          <h2 id="home-bookmark-title">接着探索</h2>
          <p>地图、年表和律盘共享一个探索空间；知识图谱还原作品之间的联系。</p>
        </header>
        <div className="home-bookmark-list">
          {BOOKMARKS.map(bookmark => {
            const content = <>
              <span className="home-bookmark-stage" aria-hidden="true">
                <span className="home-bookmark-string" /><span className="home-bookmark-knot" /><span className="home-bookmark-tassel" />
                <span className="home-bookmark-paper">
                  <Image src={publicAssetUrl(bookmark.file)} alt="" width={360} height={900} loading="lazy" decoding="async" unoptimized />
                  <span className="home-bookmark-seal">芽谱</span><span className="home-bookmark-label">{bookmark.lines.map(line => <span key={line}>{line}</span>)}</span>
                </span>
              </span>
              <span className="home-bookmark-copy"><strong>{bookmark.label}</strong><span>{bookmark.description}</span></span>
              <span className="home-bookmark-arrow" aria-hidden="true">↗</span>
            </>;
            return bookmark.href
              ? <a key={bookmark.label} className="home-bookmark-item" href={bookmark.href}>{content}</a>
              : <button key={bookmark.label} type="button" className="home-bookmark-item" onClick={onOpenFullGraph}>{content}</button>;
          })}
        </div>
      </section>
    </main>
    <footer className="home-footer">
      <div><strong>{SITE_NAME}</strong><p>把教材里的音乐知识，连成一张可探索的图。</p></div>
      <div className="home-footer-actions"><button type="button" onClick={() => onView("assistant")}>智能问答</button><button type="button" onClick={() => onView("research")}>研究分析</button><button type="button" onClick={onResearchInfo}>研究说明</button></div>
      <small>{EDITION.label}{PUBLISHED_GRADE_RANGE_LABEL}{PUBLISHED_BOOK_COUNT_LABEL}教材 · 内容按册、单元与作品整理</small>
      <small className="home-footer-credits">音色采样：钢琴 <a href="https://archive.org/details/SalamanderGrandPianoV3" target="_blank" rel="noreferrer">Salamander Grand Piano</a>（Alexander Holm，<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>）· 其他乐器 <a href="https://github.com/mrbumpy409/GeneralUser-GS" target="_blank" rel="noreferrer">GeneralUser GS</a>（S. Christian Collins，<a href="https://github.com/mrbumpy409/GeneralUser-GS/blob/main/documentation/LICENSE.txt" target="_blank" rel="noreferrer">许可说明</a>）· 打击乐单音：京剧小锣、大锣、铙钹、板鼓 <a href="https://freesound.org/people/ajaysm/" target="_blank" rel="noreferrer">ajaysm</a>（Freesound，<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>，已剪成单次敲击），框鼓 cabled_mess、木鱼块 Noted451（<a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0</a>）· 人声演唱 AI 合成：声库 <a href="https://github.com/yqzhishen/qixuan-diffsinger" target="_blank" rel="noreferrer">绮萱</a>、<a href="https://github.com/RibosomeK/RiaDiffSinger" target="_blank" rel="noreferrer">Ria（狸安）</a>（男声），<a href="https://github.com/openvpi/DiffSinger" target="_blank" rel="noreferrer">DiffSinger</a>，声码器 <a href="https://github.com/openvpi/vocoders" target="_blank" rel="noreferrer">OpenVPI NSF-HiFiGAN</a>（<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a>，非商业使用）</small>
    </footer>
  </div>;
}
