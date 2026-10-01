"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Melody } from "../../lib/lesson/jianpu";
import { publicAssetUrl } from "../../lib/app/assets";
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
type PortalView = "graph" | "assistant" | "research" | "records";
type PortalUnit = { id: string; bookKey: string; order: number; name: string; title: string; numeral: string; theme?: string; goals?: string[] };
type PropsOf<C> = C extends (props: infer P) => unknown ? P : never;
const HOT_SEARCHES = ["黄河", "京剧", "民歌", "五声调式", "歌唱祖国"];
const PENTATONIC = [
  { name: "宫", degree: 1, note: "do" }, { name: "商", degree: 2, note: "re" },
  { name: "角", degree: 3, note: "mi" }, { name: "徵", degree: 5, note: "sol" },
  { name: "羽", degree: 6, note: "la" },
];
const BOOK_ART: Record<string, { file: string; alt: string }> = {
  g7s1: { file: "art/g7s1.webp", alt: "人音版七年级上册封面插画" },
  g7s2: { file: "art/g7s2.webp", alt: "人音版七年级下册封面插画" },
  g8s1: { file: "art/g8s1.webp", alt: "人音版八年级上册封面插画" },
  g8s2: { file: "art/g8s2.webp", alt: "人音版八年级下册封面插画" },
  g9s1: { file: "art/g9s1.webp", alt: "人音版九年级上册封面插画" },
  g9s2: { file: "art/g9s2.webp", alt: "人音版九年级下册封面插画" },
};
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
export function HomePortal<E extends PortalEntity, B extends PortalBook, R extends PortalSearchBook = B>({
  books, graph, query, onQuery, results, onPickResult, onSearch, onOpenBook, onOpenFullGraph, onView, onResearchInfo,
}: {
  books: B[]; graph: PortalGraph | null; query: string; onQuery: (value: string) => void;
  results: Array<PortalSearchResult<E, R>>; onPickResult: (entity: E, book: R) => void;
  onSearch: (event: FormEvent) => void; onOpenBook: (book: B) => void; onOpenFullGraph: () => void;
  onView: (view: PortalView) => void; onPickEntityName: (name: string) => void; onResearchInfo: () => void;
}) {
  const searchInput = useRef<HTMLInputElement>(null);
  const labPlayerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [units, setUnits] = useState<PortalUnit[]>([]);
  const [openBookKey, setOpenBookKey] = useState("g7s1");
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const orderedBooks = useMemo(() => [...books].sort((a, b) => a.grade - b.grade || a.semester.localeCompare(b.semester, "zh-CN")), [books]);
  const unitsByBook = useMemo(() => {
    const grouped = new Map<string, PortalUnit[]>();
    for (const unit of units) grouped.set(unit.bookKey, [...(grouped.get(unit.bookKey) ?? []), unit]);
    for (const list of grouped.values()) list.sort((a, b) => a.order - b.order);
    return grouped;
  }, [units]);
  const fmt = (value: number) => value.toLocaleString("zh-CN");
  const nodeCount = graph?.entities.length ?? orderedBooks.reduce((total, book) => total + book.entityCount, 0);
  const workCount = orderedBooks.reduce((total, book) => total + book.workCount, 0);
  const focusSearch = () => { searchInput.current?.focus(); searchInput.current?.scrollIntoView({ block: "center", behavior: "smooth" }); };
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
            <p className="home-hero-kicker">人音版 · 七至九年级</p>
            <div className="home-wordmark"><BrandWordmark /><h1 id="home-title" className="home-title-accessible">芽谱</h1></div>
          </div>
          <p className="home-hero-lead">六册教材，<strong>{fmt(workCount)}首作品</strong>，<br />{fmt(nodeCount)}个彼此相连的音乐知识。</p>
          <div className="home-hero-search-column">
            <form className="home-search" role="search" onSubmit={onSearch}>
              <input ref={searchInput} value={query} onChange={event => onQuery(event.target.value)} placeholder="搜索作品、人物、乐理或教材内容" aria-label="搜索作品、人物、乐理或教材内容" />
              <button type="submit">检索 <span aria-hidden="true">→</span></button>
              {query && results.length > 0 && <div className="home-search-results">
                {results.slice(0, 7).map(({ entity, book, relationCount }) => <button type="button" key={book.key + "-" + entity.id} onClick={() => onPickResult(entity, book)}>
                  <span><strong>{entity.name}</strong><small>{book.title} · {entity.type} · {relationCount} 条关系</small></span><WorkbenchIcon name="arrow" />
                </button>)}
              </div>}
            </form>
            <div className="home-hot"><span>试着搜索</span>{HOT_SEARCHES.map(term => <button key={term} type="button" onClick={() => { onQuery(term); focusSearch(); }}>{term}</button>)}</div>
          </div>
        </div>
      </section>
      <section className="home-scrolls" id="home-scrolls" aria-label="六册教材画卷">
        <div className="home-book-scrolls">
          {orderedBooks.map((book, index) => {
            const art = BOOK_ART[book.key]; const bookUnits = unitsByBook.get(book.key) ?? []; const isOpen = openBookKey === book.key;
            const shortTitle = book.title.replace(/^人音版/, "");
            const volume = ["一", "二", "三", "四", "五", "六"][index];
            return <article key={book.key} className={"home-book-scroll " + (isOpen ? "is-open" : "")} onMouseEnter={() => setOpenBookKey(book.key)}>
              <button type="button" className="home-scroll-trigger" aria-label={`卷${volume} · ${shortTitle}`} aria-expanded={isOpen} aria-controls={"home-book-" + book.key} onFocus={() => setOpenBookKey(book.key)} onClick={() => setOpenBookKey(book.key)}>
                <span className="home-scroll-number">卷{volume}</span>
                <span className="home-scroll-name">{shortTitle}</span>
                <span className="home-scroll-count">{bookUnits.length || "—"} 个篇章</span><span className="home-scroll-arrow" aria-hidden="true">↗</span>
              </button>
              {!isOpen && art && <div className="home-scroll-tease" aria-hidden="true"><Image src={publicAssetUrl(art.file)} alt="" width={1200} height={750} loading="lazy" decoding="async" unoptimized /></div>}
              <div className="home-scroll-body" id={"home-book-" + book.key} hidden={!isOpen}>
                <div className="home-scroll-art">
                  {art && <Image src={publicAssetUrl(art.file)} alt={art.alt} width={1200} height={750} priority={index === 0} loading={index === 0 ? "eager" : "lazy"} decoding="async" unoptimized />}
                </div>
                <div className="home-scroll-copy">
                  <p className="home-scroll-overline">卷 {volume} · 人音版</p><h3>{shortTitle}</h3>
                  <p className="home-scroll-intro">{bookUnits[0]?.theme ? "从" + bookUnits[0].theme + "出发，按篇章读这册教材。" : "按单元篇章阅读教材内容与关联作品。"}</p>
                  <ol className="home-unit-list">{bookUnits.map(unit => <li key={unit.id}>
                    <span className="home-unit-number">{unit.numeral || unit.order}</span><span><strong>{unit.title}</strong><small>{unit.theme || unit.name}</small></span>
                  </li>)}</ol>
                  <button type="button" className="home-scroll-cta" onClick={() => onOpenBook(book)}>翻开这一册 <WorkbenchIcon name="right" /></button>
                </div>
              </div>
            </article>;
          })}
        </div>
      </section>
      <section className="home-lab" aria-labelledby="home-lab-title">
        <div className="home-lab-heading" data-reveal>
          <p className="home-section-overline">五声实验室</p><h2 id="home-lab-title">宫、商、角、徵、羽</h2>
          <p>点按宫、商、角、徵、羽，听听五个音如何连成旋律。</p>
          <button type="button" className="home-lab-phrase" onClick={() => playSample(5)} data-playing={activeNote === "phrase"} aria-pressed={activeNote === "phrase"}>▶ 上行再下行</button>
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
      <section className="home-section home-views" aria-labelledby="home-views-title" data-reveal>
        <header className="home-section-head" data-reveal>
          <div><p className="home-section-overline">继续探索</p><h2 id="home-views-title">从不同方向看音乐</h2><p>把教材中的作品、时间与知识关联放在一起观察。</p></div>
          <button type="button" className="home-view-link" onClick={onOpenFullGraph}>打开知识图谱 <WorkbenchIcon name="right" /></button>
        </header>
        <div className="home-view-teasers" data-reveal-group>
          <a href="#/atlas" className="home-view-teaser" data-reveal><span className="home-view-index">01</span><h3>音乐地图</h3><p>循着地域与民族，发现教材作品的来处。</p><span className="home-view-arrow" aria-hidden="true">↗</span></a>
          <a href="#/timeline" className="home-view-teaser" data-reveal><span className="home-view-index">02</span><h3>作品年表</h3><p>沿着时间线索，浏览不同年代的音乐作品。</p><span className="home-view-arrow" aria-hidden="true">↗</span></a>
          <button type="button" className="home-view-teaser" data-reveal onClick={onOpenFullGraph}><span className="home-view-index">03</span><h3>知识图谱</h3><p>从一个知识点出发，查看跨册关联。</p><span className="home-view-arrow" aria-hidden="true">↗</span></button>
        </div>
      </section>
    </main>
    <footer className="home-footer">
      <div><strong>芽谱</strong><p>把教材里的音乐知识，连成一张可探索的图。</p></div>
      <div className="home-footer-actions"><button type="button" onClick={() => onView("assistant")}>智能问答</button><button type="button" onClick={() => onView("research")}>研究分析</button><button type="button" onClick={onResearchInfo}>研究说明</button></div>
      <small>人音版七至九年级六册教材 · 内容按册、单元与作品整理</small>
    </footer>
  </div>;
}
