"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import type { Melody } from "../../lib/lesson/jianpu";
import { publicAssetUrl } from "../../lib/app/assets";
import { PUBLISHED_BOOK_COUNT_LABEL, PUBLISHED_BOOKS, PUBLISHED_GRADE_RANGE_LABEL } from "../../lib/app/books";
import { RECORDS_FOCUS_UNIT_KEY } from "../../lib/app/focus-unit";
import { WorkbenchIcon } from "../WorkbenchIcon";
import { AppTopNav } from "../AppTopNav";
import { BrandWordmark } from "./BrandWordmark";
import type { MelodyPlayer as MelodyPlayerComponent } from "../lesson/MelodyPlayer";
type PortalEntity = { id: string; name: string; type: string; category?: string; textbookCount?: number; degree?: number; bookKeys?: string[] };
type PortalRelationship = { subject: string; objectId?: string | null; predicate: string; label?: string };
type PortalBook = { key: string; title: string; grade: number; semester: string; entityCount: number; tripleCount: number; workCount: number; pages: number };
type PortalGraph = { entities: PortalEntity[]; relationships: PortalRelationship[] };
type PortalSearchBook = Pick<PortalBook, "key" | "title" | "grade" | "semester">;
type PortalSearchResult<E, B extends PortalSearchBook> = { entity: E; book: B; relationCount: number; matchedBy: string };
type PortalView = "graph" | "assistant" | "research" | "records" | "lab" | "atlas";
type PortalUnit = { id: string; bookKey: string; order: number; name: string; title: string; numeral: string; theme?: string; goals?: string[]; works?: Array<unknown> };
type PropsOf<C> = C extends (props: infer P) => unknown ? P : never;
const HOT_SEARCHES = ["黄河", "京剧", "民歌", "五声调式", "歌唱祖国"];
const HOME_LAST_READ_BOOK_KEY = "yapu-home-last-book";
const HOME_LAST_READ_CHANGE_EVENT = "yapu:home-last-book-change";
const BOOKMARKS = [
  { label: "音乐地图", description: "在地图上查看教材作品的地域线索。", file: "art/bookmarks/map.webp", href: "#/atlas" },
  { label: "作品年表", description: "按年代浏览教材作品与人物。", file: "art/bookmarks/timeline.webp", href: "#/timeline" },
  { label: "知识图谱", description: "从一个知识点查看它和作品的联系。", file: "art/bookmarks/graph.webp", href: null },
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
  books, query, onQuery, results, onPickResult, onSearch, onOpenBook, onOpenFullGraph, onView, onResearchInfo,
}: {
  books: B[]; graph: PortalGraph | null; query: string; onQuery: (value: string) => void;
  results: Array<PortalSearchResult<E, R>>; onPickResult: (entity: E, book: R) => void;
  onSearch: (event: FormEvent) => void; onOpenBook: (book: B) => void; onOpenFullGraph: () => void;
  onView: (view: PortalView) => void; onPickEntityName: (name: string) => void; onResearchInfo: () => void;
}) {
  const searchInput = useRef<HTMLInputElement>(null);
  const labPlayerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [units, setUnits] = useState<PortalUnit[]>([]);
  const [openBookKey, setOpenBookKey] = useState<string | null>(null);
  const storedLastReadBookKey = useSyncExternalStore(subscribeToHomeLastRead, getHomeLastReadSnapshot, getHomeLastReadServerSnapshot);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const orderedBooks = useMemo(() => [...books].sort((a, b) => a.grade - b.grade || a.semester.localeCompare(b.semester, "zh-CN")), [books]);
  const lastReadBookKey = orderedBooks.some(book => book.key === storedLastReadBookKey) ? storedLastReadBookKey : null;
  const activeBookKey = openBookKey ?? lastReadBookKey ?? orderedBooks[0]?.key ?? "";
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
    try {
      window.localStorage.setItem(HOME_LAST_READ_BOOK_KEY, key);
      window.dispatchEvent(new Event(HOME_LAST_READ_CHANGE_EVENT));
    } catch { /* Storage can be disabled by the browser. */ }
  };
  const openBook = (book: B) => {
    rememberBook(book.key);
    onOpenBook(book);
  };
  const openUnit = (book: B, unit: PortalUnit) => {
    try { window.sessionStorage.setItem(RECORDS_FOCUS_UNIT_KEY, `${book.key}:${unit.id}`); } catch { /* Navigation still works without session storage. */ }
    rememberBook(book.key);
    onOpenBook(book);
  };
  useEffect(() => {
    let active = true;
    fetch(publicAssetUrl("data/units.json"))
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
  return <div className="home-portal">
    <AppTopNav active="home" onAbout={onResearchInfo}
      onNavigate={view => { if (view === "graph") onOpenFullGraph(); else if (view !== "home") onView(view); }}
      trailing={<button type="button" className="home-nav-search" onClick={focusSearch} aria-label="搜索"><WorkbenchIcon name="search" /></button>} />
    <main>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-inner">
          <div className="home-title-plate">
            <p className="home-hero-kicker">人音版 · {PUBLISHED_GRADE_RANGE_LABEL}</p>
            <div className="home-wordmark"><BrandWordmark /><h1 id="home-title" className="home-title-accessible">芽谱</h1></div>
          </div>
          <p className="home-hero-lead">翻开一册，从这一课开始。</p>
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
      <section className="home-scrolls" id="home-scrolls" aria-label={`${PUBLISHED_BOOK_COUNT_LABEL}教材画卷`}>
        <div className="home-book-scrolls">
          {orderedBooks.map((book, index) => {
            const art = BOOK_ART[book.key]; const bookUnits = unitsByBook.get(book.key) ?? []; const isOpen = activeBookKey === book.key;
            const workCount = bookUnits.reduce((sum, unit) => sum + (unit.works?.length ?? 0), 0);
            const shortTitle = book.title.replace(/^人音版/, "");
            const volume = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五"][index] ?? String(index + 1);
            return <article key={book.key} className={"home-book-scroll " + (isOpen ? "is-open" : "")} onPointerEnter={event => { if (event.pointerType !== "touch") setOpenBookKey(book.key); }}>
                <div className="home-scroll-art" aria-hidden="true">
                  {art && <Image src={publicAssetUrl(art.file)} alt="" width={1200} height={750} priority={index === 0} loading={index === 0 ? "eager" : "lazy"} decoding="async" unoptimized />}
                </div>
              <span className="home-scroll-rod home-scroll-rod-top" aria-hidden="true" />
              <span className="home-scroll-rod home-scroll-rod-bottom" aria-hidden="true" />
              <button type="button" className="home-scroll-trigger" aria-label={`${isOpen ? "已展开" : "展开"}卷${volume}，${book.title}`} aria-expanded={isOpen} aria-controls={"home-book-" + book.key} onFocus={() => setOpenBookKey(book.key)} onClick={() => setOpenBookKey(book.key)}>
                <span className="home-scroll-tag"><span className="home-scroll-number">卷{volume}</span><span className="home-scroll-name">{shortTitle}</span></span>
              </button>
              <div className="home-scroll-body" id={"home-book-" + book.key} hidden={!isOpen} aria-hidden={!isOpen}>
                <span className="home-scroll-stamp" aria-label="上次读到" hidden={lastReadBookKey !== book.key}>上次读到</span>
                <div className="home-scroll-copy">
                  <p className="home-scroll-overline">卷 {volume} · 人音版</p>
                  <h3>{shortTitle}</h3>
                  <p className="home-scroll-intro">{bookUnits[0]?.theme ? `从${bookUnits[0].theme}出发，一个单元一个单元读这册教材。` : "按单元阅读教材内容与关联作品。"}</p>
                  <p className="home-scroll-countline">{bookUnits.length} 个单元 · {fmt(workCount)} 首作品</p>
                  <ol className="home-unit-list">{bookUnits.map(unit => <li key={unit.id}>
                    <button type="button" aria-label={`${unit.numeral || unit.order}，${unit.name || unit.title}，进入${book.title}`} onClick={() => openUnit(book, unit)}>
                      <span className="home-unit-number">{unit.numeral || unit.order}</span><span className="home-unit-title">{unit.title || unit.name}</span>
                    </button>
                  </li>)}</ol>
                  <button type="button" className="home-scroll-cta" onClick={() => openBook(book)}>翻开这一册 <WorkbenchIcon name="right" /></button>
                </div>
              </div>
            </article>;
          })}
        </div>
      </section>
      <section className="home-lab" aria-labelledby="home-lab-title">
        <div className="home-lab-heading" data-reveal>
          <p className="home-section-overline">五声实验室</p><h2 id="home-lab-title">宫、商、角、徵、羽</h2>
          <p>点按五个琴键听音高变化，也可以按键盘 1、2、3、5、6。五个音是入口，实验室里还可以继续比较七声音阶。</p>
          <button type="button" className="home-lab-phrase" onClick={() => playSample(5)} data-playing={activeNote === "phrase"} aria-pressed={activeNote === "phrase"}>▶ 上行再下行</button>
          <p className="home-lab-hint">按 1、2、3、5、6，也能依次弹奏五个音。</p>
          <a href="#/lab" className="home-lab-enter">进入五声实验室 <WorkbenchIcon name="right" /></a>
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
          <h2 id="home-bookmark-title">夹一枚书签，接着读</h2>
          <p>从地域、年代或知识关联出发，继续翻阅教材里的音乐。</p>
        </header>
        <div className="home-bookmark-list">
          {BOOKMARKS.map(bookmark => {
            const content = <>
              <span className="home-bookmark-stage" aria-hidden="true">
                <span className="home-bookmark-string" /><span className="home-bookmark-knot" /><span className="home-bookmark-tassel" />
                <span className="home-bookmark-paper">
                  <Image src={publicAssetUrl(bookmark.file)} alt="" width={360} height={900} loading="lazy" decoding="async" unoptimized />
                  <span className="home-bookmark-seal">芽谱</span><span className="home-bookmark-label">{bookmark.label}</span>
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
      <div><strong>芽谱</strong><p>把教材里的音乐知识，连成一张可探索的图。</p></div>
      <div className="home-footer-actions"><button type="button" onClick={() => onView("assistant")}>智能问答</button><button type="button" onClick={() => onView("research")}>研究分析</button><button type="button" onClick={onResearchInfo}>研究说明</button></div>
      <small>人音版{PUBLISHED_GRADE_RANGE_LABEL}{PUBLISHED_BOOK_COUNT_LABEL}教材 · 内容按册、单元与作品整理</small>
    </footer>
  </div>;
}
