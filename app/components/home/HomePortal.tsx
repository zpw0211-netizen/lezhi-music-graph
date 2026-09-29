"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { KEY_MELODIES } from "../../lib/lesson/melodies-key";
import type { Melody } from "../../lib/lesson/jianpu";
import { publicAssetUrl } from "../../lib/app/assets";
import { WorkbenchIcon } from "../WorkbenchIcon";
import { AppTopNav } from "../AppTopNav";
import type { MelodyPlayer as MelodyPlayerComponent } from "../lesson/MelodyPlayer";

type PortalEntity = {
  id: string;
  name: string;
  type: string;
  category?: string;
  textbookCount?: number;
  degree?: number;
  bookKeys?: string[];
};
type PortalRelationship = { subject: string; objectId?: string | null; predicate: string; label?: string };
type PortalBook = {
  key: string;
  title: string;
  grade: number;
  semester: string;
  entityCount: number;
  tripleCount: number;
  workCount: number;
  pages: number;
};
type PortalGraph = { entities: PortalEntity[]; relationships: PortalRelationship[] };
type PortalSearchBook = Pick<PortalBook, "key" | "title" | "grade" | "semester">;
type PortalSearchResult<E, B extends PortalSearchBook> = { entity: E; book: B; relationCount: number; matchedBy: string };
type PortalView = "graph" | "assistant" | "research" | "records";
type PropsOf<C> = C extends (props: infer P) => unknown ? P : never;

const GRADE_NAMES: Record<number, string> = { 7: "七年级", 8: "八年级", 9: "九年级" };
const HOT_SEARCHES = ["游击队歌", "黄河", "京剧", "民歌", "冼星海"];
const HERO_WORK = "《游击队歌》";
const BOOK_ART: Record<string, { file: string; alt: string }> = {
  g7s1: { file: "art/g7s1.webp", alt: "套色木刻风格插画：军鼓与马头琴放在红旗上，远处是草原" },
  g7s2: { file: "art/g7s2.webp", alt: "套色木刻风格插画：京剧脸谱、新疆都塔尔和乐谱" },
  g8s1: { file: "art/g8s1.webp", alt: "套色木刻风格插画：胶片、古琴、非洲鼓和小提琴协奏曲乐谱" },
  g8s2: { file: "art/g8s2.webp", alt: "套色木刻风格插画：古诗书页、竹笛、交响乐定音鼓和军号" },
  g9s1: { file: "art/g9s1.webp", alt: "套色木刻风格插画：展开的山水画卷、西南芦笙与戏曲水袖" },
  g9s2: { file: "art/g9s2.webp", alt: "套色木刻风格插画：藏族扎木聂、飘动的经幡、戏楼与快板" },
};
const SOURCE_MELODY = KEY_MELODIES[HERO_WORK];
const HERO_MELODY: Melody = { ...SOURCE_MELODY, bars: SOURCE_MELODY.bars.slice(0, 4) };
const UNIT_ORDER: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

const MelodyPlayer = dynamic<PropsOf<typeof MelodyPlayerComponent>>(
  () => import("../lesson/MelodyPlayer").then((module) => module.MelodyPlayer),
  { loading: () => <div className="home-song-loading" role="status">正在准备简谱播放器…</div> },
);

export function HomePortal<E extends PortalEntity, B extends PortalBook, R extends PortalSearchBook = B>({
  books, graph, query, onQuery, results, onPickResult, onSearch, onOpenBook, onOpenFullGraph, onView, onPickEntityName, onResearchInfo,
}: {
  books: B[];
  graph: PortalGraph | null;
  query: string;
  onQuery: (value: string) => void;
  results: Array<PortalSearchResult<E, R>>;
  onPickResult: (entity: E, book: R) => void;
  onSearch: (event: FormEvent) => void;
  onOpenBook: (book: B) => void;
  onOpenFullGraph: () => void;
  onView: (view: PortalView) => void;
  onPickEntityName: (name: string) => void;
  onResearchInfo: () => void;
}) {
  const searchInput = useRef<HTMLInputElement>(null);
  const hero = useMemo(() => heroNeighbours(graph), [graph]);
  const unitsByBook = useMemo(() => textbookUnits(graph), [graph]);
  const knowledgeCount = graph?.entities.length ?? 0;
  const coreConcepts = useMemo(() => (graph?.entities ?? [])
    .filter((entity) => entity.category === "theory" && (entity.textbookCount ?? 0) >= 6)
    .sort((a, b) => (b.degree ?? 0) - (a.degree ?? 0)).slice(0, 12), [graph]);
  const richWorks = useMemo(() => (graph?.entities ?? [])
    .filter((entity) => entity.category === "work")
    .sort((a, b) => (b.degree ?? 0) - (a.degree ?? 0)).slice(0, 8), [graph]);
  const featured = useMemo(() => [
    ...coreConcepts.map((entity) => ({ ...entity, kind: "核心乐理" })),
    ...richWorks.map((entity) => ({ ...entity, kind: "作品" })),
  ].sort((a, b) => (b.degree ?? 0) - (a.degree ?? 0) || a.name.localeCompare(b.name, "zh-CN")).slice(0, 10), [coreConcepts, richWorks]);
  const fmt = (value: number) => value.toLocaleString("zh-CN");
  const focusSearch = () => {
    searchInput.current?.focus();
    searchInput.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return <div className="home-portal">
    <AppTopNav active="home" onAbout={onResearchInfo}
      onNavigate={(view) => { if (view === "graph") onOpenFullGraph(); else if (view !== "home") onView(view); }}
      trailing={<>
        <button type="button" className="home-nav-icon" onClick={focusSearch} aria-label="搜索"><WorkbenchIcon name="search" /></button>
        <button type="button" className="home-nav-cta" onClick={() => onView("records")}>开始上课</button>
      </>} />

    <section className="home-hero" aria-label="从一首歌开始探索音乐知识">
      <div className="home-hero-inner">
        <div className="home-brand-story">
          <Image className="home-brand-mark" src={publicAssetUrl("brand/mark.svg")} alt="" aria-hidden="true" width={56} height={56} priority unoptimized />
          <h1 className="home-slogan home-title" aria-label="芽谱，让音乐知识彼此连接"><span className="home-title-accessible">芽谱</span>让音乐知识<br />彼此连接</h1>
          <p className="home-lead">按课听谱、查知识，发现六册教材里的音乐关联。</p>
          <form className="home-search" onSubmit={onSearch} role="search">
            <WorkbenchIcon name="search" />
            <input ref={searchInput} value={query} onChange={(event) => onQuery(event.target.value)} placeholder="搜索作品、人物、知识点或教材内容……" aria-label="搜索知识点" />
            <button type="submit">搜索</button>
            {query && results.length > 0 && <div className="home-search-results">
              {results.map(({ entity, book, relationCount }) => <button type="button" key={`${book.key}-${entity.id}`} onClick={() => onPickResult(entity, book)}>
                <span><strong>{entity.name}</strong><small>{book.grade}年级{book.semester} · {entity.type} · {relationCount} 条关系</small></span>
                <WorkbenchIcon name="arrow" />
              </button>)}
            </div>}
          </form>
          <div className="home-hot"><span>热门搜索</span>{HOT_SEARCHES.map((term) => <button key={term} type="button" onClick={() => onQuery(term)}>{term}</button>)}</div>
          {/* Rendered before the graph loads (hidden) so its line height is reserved and nothing below it jumps. */}
          <p className="home-proof" style={graph ? undefined : { visibility: "hidden" }} aria-hidden={graph ? undefined : true}><strong>{graph ? fmt(knowledgeCount) : "0"}</strong><span>个知识节点，连接六册教材</span></p>
        </div>

        <section className="home-song-stage" aria-labelledby="home-song-title">
          <header className="home-song-heading">
            <div>
              <p className="home-song-overline">从真实旋律读懂音乐</p>
              <h2 id="home-song-title">《游击队歌》</h2>
            </div>
            <p className="home-song-meta">开头四小节<br />1=G · 4/4</p>
          </header>
          <div className="home-song-player">
            <MelodyPlayer melody={HERO_MELODY} large />
            <p className="home-song-scroll-hint">左右滑动查看完整简谱</p>
          </div>
          <div className="home-song-links" aria-label="《游击队歌》关联知识点" data-reveal-group>
            {hero
              ? hero.nodes.map((node) => <button type="button" key={node.name} onClick={() => onPickEntityName(node.name)}>
                <strong>{node.name}</strong><small>{node.relation}</small>
              </button>)
              // Same boxes as the real links, so the hero keeps its final height while the graph loads.
              : Array.from({ length: 6 }, (_, index) => <span className="home-song-link-placeholder" key={index} aria-hidden="true">
                <strong>&nbsp;</strong><small>&nbsp;</small>
              </span>)}
            {!hero && <span className="home-sr-only" role="status">关联知识正在载入…</span>}
          </div>
        </section>
      </div>
    </section>

    <div className="home-body">
      <section className="home-section home-books" aria-labelledby="home-books-title" data-reveal>
        <header className="home-section-head">
          <div><h2 id="home-books-title">按年级进入教材</h2><p>人音版七至九年级 · 六册单元目录</p></div>
          <button type="button" className="home-more" onClick={onOpenFullGraph}>查看六册知识图谱<WorkbenchIcon name="right" /></button>
        </header>
        <div className="home-grade-groups">
          {[7, 8, 9].map((grade) => {
            const gradeBooks = books.filter((book) => book.grade === grade);
            return <section className={`home-grade-group grade-${grade}`} key={grade} aria-label={GRADE_NAMES[grade]} data-reveal-group>
              <header className="home-grade-heading"><h3>{GRADE_NAMES[grade]}</h3><span>{gradeBooks.length} 册</span></header>
              <div className="home-book-list">
                {gradeBooks.map((book) => <BookCover key={book.key} book={book} units={unitsByBook.get(book.key) ?? []} onOpen={() => onOpenBook(book)} art={BOOK_ART[book.key]} />)}
              </div>
            </section>;
          })}
        </div>
      </section>

      <section className="home-section home-knowledge" aria-labelledby="home-rank-title" data-reveal>
        <header className="home-section-head">
          <div><h2 id="home-rank-title">从这里继续探索</h2><p>核心乐理与作品，按图谱关联数量排列</p></div>
          <button type="button" className="home-more" onClick={onOpenFullGraph}>打开完整图谱<WorkbenchIcon name="right" /></button>
        </header>
        <ol className="home-rank" data-reveal-group>
          {featured.map((entity, index) => <li key={entity.id} data-reveal>
            <button type="button" onClick={() => onPickEntityName(entity.name)}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <span>{entity.name.replace(/[《》]/g, "")}</span>
              <small>{entity.kind}</small>
              <em>{fmt(entity.degree ?? 0)} 条关联</em>
            </button>
          </li>)}
        </ol>
      </section>

      <nav className="home-shortcuts" aria-label="继续使用芽谱">
        <span>继续探索</span>
        <button type="button" onClick={() => onView("records")}>按课学习</button>
        <button type="button" onClick={onOpenFullGraph}>知识图谱</button>
        <button type="button" onClick={() => onView("assistant")}>智能问答</button>
        <button type="button" onClick={() => onView("research")}>研究分析</button>
      </nav>

      <section className="home-closing" aria-label="开始走进音乐教材" data-reveal>
        <div className="home-closing-copy">
          <p>从一首歌出发，走进六册教材</p>
          <button type="button" onClick={() => onView("records")}>开始上课</button>
        </div>
        <ClosingArtwork />
      </section>

      <footer className="home-footer">
        <p>教材内容依据人民音乐出版社新版七至九年级音乐教材逐页整理，每条知识标注教材页码；教材之外的补充单独标注为“拓展知识”，已逐条审阅。</p>
        <button type="button" onClick={onResearchInfo}>研究信息</button>
      </footer>
    </div>
  </div>;
}

function BookCover<B extends PortalBook>({ book, units, onOpen, art }: {
  book: B;
  units: string[];
  onOpen: () => void;
  art?: { file: string; alt: string };
}) {
  const { ref, activated } = useArtworkActivation<HTMLSpanElement>();
  return <button type="button" className="home-book" onClick={onOpen}>
    <span ref={ref} className={`home-book-cover ${art ? "has-art" : ""}`}>
      {art && activated && <Image className="home-book-art" src={publicAssetUrl(art.file)} alt={art.alt} width={1200} height={750} loading="lazy" decoding="async" unoptimized />}
      {art && !activated && <span className="home-book-art-placeholder" aria-hidden="true" />}
      {!art && <><b>{GRADE_NAMES[book.grade]?.slice(0, 1) ?? book.grade}</b><small>年级音乐</small></>}
      <i>{book.semester}</i>
    </span>
    <span className="home-book-copy">
      <strong>{book.title.replace("人音版", "")}</strong>
      <span className="home-book-units">{units.length ? units.join("　·　") : "单元目录载入中"}</span>
    </span>
  </button>;
}

function ClosingArtwork() {
  const { ref, activated } = useArtworkActivation<HTMLDivElement>();
  return <div ref={ref} className="home-closing-art-frame">
    {activated
      ? <Image className="home-closing-art" src={publicAssetUrl("art/hero.webp")} alt="套色木刻风格插画：嫩芽从弯曲的五线谱中生长，学生沿着谱线携带乐器前行" width={2000} height={1000} loading="lazy" decoding="async" unoptimized />
      : <span className="home-closing-art-placeholder" aria-hidden="true" />}
  </div>;
}

function useArtworkActivation<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (!target || activated) return;
    const workspace = target.closest(".workspace") as HTMLElement | null;
    const workspaceStyle = workspace ? getComputedStyle(workspace) : null;
    const scrollContainer = workspace && workspaceStyle && /auto|scroll/.test(workspaceStyle.overflowY) && workspace.scrollHeight > workspace.clientHeight + 1
      ? workspace
      : null;
    const scrollTarget: EventTarget = scrollContainer ?? window;
    const hasScrolled = () => scrollContainer ? scrollContainer.scrollTop > 0 : window.scrollY > 0;
    let isNearViewport = false;
    const observer = new IntersectionObserver(([entry]) => {
      isNearViewport = entry.isIntersecting;
      if (isNearViewport && hasScrolled()) setActivated(true);
    }, { rootMargin: "120px 0px" });
    const onScroll = () => {
      if (isNearViewport && hasScrolled()) setActivated(true);
    };
    observer.observe(target);
    scrollTarget.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      scrollTarget.removeEventListener("scroll", onScroll);
    };
  }, [activated]);

  return { ref, activated };
}

type HeroNode = { name: string; relation: string; category: string };

/** Collect each unit from the canonical graph, keeping textbook order. */
function textbookUnits(graph: PortalGraph | null) {
  const units = new Map<string, string[]>();
  for (const entity of graph?.entities ?? []) {
    if (entity.type !== "单元") continue;
    const match = entity.name.match(/^第([一二三四五六七八九十]+)单元/);
    if (!match) continue;
    const order = UNIT_ORDER[match[1]] ?? 99;
    for (const bookKey of entity.bookKeys ?? []) {
      const current = units.get(bookKey) ?? [];
      current.push(`${order}:${entity.name}`);
      units.set(bookKey, current);
    }
  }
  return new Map([...units].map(([bookKey, names]) => [
    bookKey,
    names.sort((a, b) => Number(a.slice(0, a.indexOf(":"))) - Number(b.slice(0, b.indexOf(":"))) || a.localeCompare(b, "zh-CN"))
      .map((item) => item.slice(item.indexOf(":") + 1)),
  ]));
}

/** Up to six direct neighbours of the hero work, one per entity, ordered by category. */
function heroNeighbours(graph: PortalGraph | null) {
  if (!graph) return null;
  const work = graph.entities.find((entity) => entity.name === HERO_WORK);
  if (!work) return null;
  const byId = new Map(graph.entities.map((entity) => [entity.id, entity]));
  const picked = new Map<string, HeroNode & { type: string }>();
  for (const relationship of graph.relationships) {
    if (relationship.subject !== work.id || !relationship.objectId) continue;
    const other = byId.get(relationship.objectId);
    if (!other || other.type === "单元") continue;
    const relation = relationship.label ?? relationship.predicate;
    const existing = picked.get(other.name);
    if (existing) { if (!existing.relation.includes(relation)) existing.relation += `、${relation}`; continue; }
    picked.set(other.name, { name: other.name, relation, category: other.category ?? "theory", type: other.type });
  }
  const order = ["person", "textbook", "culture", "element", "theory", "work"];
  const late = new Set(["拍号", "调性"]);
  const nodes = [...picked.values()].sort((a, b) =>
    Number(late.has(a.type)) - Number(late.has(b.type)) || order.indexOf(a.category) - order.indexOf(b.category));
  return { name: work.name, type: work.type, nodes: nodes.slice(0, 6) };
}
