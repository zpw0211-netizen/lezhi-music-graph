"use client";
import { useMemo, useRef, type FormEvent } from "react";
import { WorkbenchIcon } from "../WorkbenchIcon";
import { AppTopNav } from "../AppTopNav";

type PortalEntity = { id: string; name: string; type: string; category?: string; textbookCount?: number; degree?: number };
type PortalRelationship = { subject: string; objectId?: string | null; predicate: string; label?: string };
type PortalBook = { key: string; title: string; grade: number; semester: string; entityCount: number; tripleCount: number; workCount: number; pages: number };
type PortalGraph = { entities: PortalEntity[]; relationships: PortalRelationship[] };
type PortalSearchResult<E, B> = { entity: E; book: B; relationCount: number; matchedBy: string };
type PortalView = "graph" | "assistant" | "research" | "records";

const GRADE_NAMES: Record<number, string> = { 7: "七年级", 8: "八年级", 9: "九年级" };
const HOT_SEARCHES = ["游击队歌", "黄河", "京剧", "民歌", "冼星海"];
/** The hero illustration is drawn from this work's real neighbours in the knowledge graph. */
const HERO_WORK = "《游击队歌》";
const HERO_SLOTS: Array<[number, number]> = [[-150, -128], [150, -128], [-218, 20], [218, 20], [-120, 150], [120, 150]];
const CATEGORY_ICON: Record<string, "person" | "book" | "music" | "graph" | "spark" | "layers"> = {
  person: "person", textbook: "book", work: "music", element: "music", theory: "spark", culture: "layers",
};

export function HomePortal<E extends PortalEntity, B extends PortalBook>({
  books, graph, query, onQuery, results, onPickResult, onSearch, onOpenBook, onOpenFullGraph, onView, onPickEntityName, onResearchInfo,
}: {
  books: B[];
  graph: PortalGraph | null;
  query: string;
  onQuery: (value: string) => void;
  results: Array<PortalSearchResult<E, B>>;
  onPickResult: (entity: E, book: B) => void;
  onSearch: (event: FormEvent) => void;
  onOpenBook: (book: B) => void;
  onOpenFullGraph: () => void;
  onView: (view: PortalView) => void;
  onPickEntityName: (name: string) => void;
  onResearchInfo: () => void;
}) {
  const searchInput = useRef<HTMLInputElement>(null);
  const stats = useMemo(() => {
    const entities = graph?.entities ?? [];
    return {
      entities: entities.length,
      relations: graph?.relationships.length ?? 0,
      shared: entities.filter(entity => (entity.textbookCount ?? 0) >= 2).length,
    };
  }, [graph]);
  const hero = useMemo(() => heroNeighbours(graph), [graph]);
  const coreConcepts = useMemo(() => (graph?.entities ?? [])
    .filter(entity => entity.category === "theory" && (entity.textbookCount ?? 0) >= 6)
    .sort((a, b) => (b.degree ?? 0) - (a.degree ?? 0)).slice(0, 12), [graph]);
  const richWorks = useMemo(() => (graph?.entities ?? [])
    .filter(entity => entity.category === "work")
    .sort((a, b) => (b.degree ?? 0) - (a.degree ?? 0)).slice(0, 8), [graph]);
  const maxWorkDegree = richWorks[0]?.degree ?? 1;
  const fmt = (value: number) => value.toLocaleString("en-US");
  const focusSearch = () => { searchInput.current?.focus(); searchInput.current?.scrollIntoView({ block: "center", behavior: "smooth" }); };

  return <div className="home-portal">
    <AppTopNav active="home" onAbout={onResearchInfo}
      onNavigate={view => { if (view === "graph") onOpenFullGraph(); else if (view !== "home") onView(view); }}
      trailing={<>
        <button type="button" className="home-nav-icon" onClick={focusSearch} aria-label="搜索"><WorkbenchIcon name="search" /></button>
        <button type="button" className="home-nav-cta" onClick={() => onView("records")}>开始上课</button>
      </>} />

    <section className="home-hero">
      <InkLandscape />
      <div className="home-hero-inner">
        <div className="home-hero-copy">
          <h1 className="home-title"><span>芽谱</span><i aria-hidden="true">音乐教育</i></h1>
          <p className="home-slogan">让音乐知识彼此连接</p>
          <p className="home-lead">从一首作品出发，探索作品、人物、乐理与文化之间的联系，<br />在音乐中看见更大的世界。</p>
          <form className="home-search" onSubmit={onSearch} role="search">
            <WorkbenchIcon name="search" />
            <input ref={searchInput} value={query} onChange={event => onQuery(event.target.value)} placeholder="搜索作品、人物、知识点或教材内容……" aria-label="搜索知识点" />
            <button type="submit">搜索</button>
            {query && results.length > 0 && <div className="home-search-results">
              {results.map(({ entity, book, relationCount }) => <button type="button" key={`${book.key}-${entity.id}`} onClick={() => onPickResult(entity, book)}>
                <span><strong>{entity.name}</strong><small>{book.grade}年级{book.semester} · {entity.type} · {relationCount} 条关系</small></span>
                <WorkbenchIcon name="arrow" />
              </button>)}
            </div>}
          </form>
          <div className="home-hot"><span>热门搜索：</span>{HOT_SEARCHES.map(term => <button key={term} type="button" onClick={() => onQuery(term)}>{term}</button>)}</div>
        </div>
        <HeroGraph hero={hero} onPick={onPickEntityName} />
      </div>
    </section>

    <div className="home-body">
      <section className="home-entries" aria-label="主要功能">
        <button type="button" className="home-entry is-learn" onClick={() => onView("records")}>
          <span className="home-entry-icon"><WorkbenchIcon name="book" /></span>
          <span className="home-entry-text"><strong>开始学习<WorkbenchIcon name="right" /></strong><small>按教材单元学习音乐作品</small><small>看谱、听旋律、学知识、做练习</small></span>
          <span className="home-entry-go"><WorkbenchIcon name="right" /></span>
        </button>
        <button type="button" className="home-entry is-graph" onClick={onOpenFullGraph}>
          <span className="home-entry-icon"><WorkbenchIcon name="graph" /></span>
          <span className="home-entry-text"><strong>探索知识图谱<WorkbenchIcon name="right" /></strong><small>在音乐知识网络中发现关联</small><small>从作品、人物、乐理到文化的多维探索</small></span>
          <span className="home-entry-go"><WorkbenchIcon name="right" /></span>
        </button>
        <button type="button" className="home-entry is-ask" onClick={() => onView("assistant")}>
          <span className="home-entry-icon"><WorkbenchIcon name="message" /></span>
          <span className="home-entry-text"><strong>问芽谱 AI<WorkbenchIcon name="right" /></strong><small>基于教材知识的智能问答</small><small>每条回答都附有教材出处</small></span>
          <span className="home-entry-go"><WorkbenchIcon name="right" /></span>
        </button>
      </section>

      <section className="home-section">
        <header className="home-section-head">
          <div><h2>教材导航</h2><p>人音版初中音乐教材 · 六册完整知识体系</p></div>
          <button type="button" className="home-more" onClick={onOpenFullGraph}>六册叠加总览<WorkbenchIcon name="right" /></button>
        </header>
        <div className="home-shelf">
          {books.map((book, index) => <button type="button" key={book.key} className="home-book" onClick={() => onOpenBook(book)}>
            <BookScene variant={index % 6} />
            <span className="home-book-body">
              <span className="home-book-text">
                <strong>{GRADE_NAMES[book.grade] ?? `${book.grade}年级`}{book.semester}</strong>
                <small><span>{book.workCount} 首作品</span><span>{fmt(book.entityCount)} 个知识点</span></small>
              </span>
              <span className="home-book-go"><WorkbenchIcon name="right" /></span>
            </span>
          </button>)}
        </div>
      </section>

      <section className="home-stats" aria-label="数据规模">
        <div><span className="home-stat-icon is-green"><WorkbenchIcon name="book" /></span><p><strong>{books.length}</strong><b>册教材</b><small>七至九年级，完整覆盖</small></p></div>
        <div><span className="home-stat-icon is-amber"><WorkbenchIcon name="graph" /></span><p><strong>{fmt(stats.entities)}</strong><b>知识实体</b><small>作品、人物、概念、知识点等</small></p></div>
        <div><span className="home-stat-icon is-rose"><WorkbenchIcon name="path" /></span><p><strong>{fmt(stats.relations)}</strong><b>知识关系</b><small>构建多维知识网络</small></p></div>
        <div><span className="home-stat-icon is-green"><WorkbenchIcon name="research" /></span><p><strong>{fmt(stats.shared)}</strong><b>跨册共享知识</b><small>连接不同年级的核心概念</small></p></div>
      </section>

      <section className="home-section home-knowledge">
        <div className="home-panel">
          <header><h2>贯穿六册的核心乐理</h2><p>在全部六册教材中都出现的音乐概念</p></header>
          <div className="home-chips">{coreConcepts.map(entity => <button type="button" key={entity.id} onClick={() => onPickEntityName(entity.name)}>{entity.name}<small>{entity.degree}</small></button>)}</div>
        </div>
        <div className="home-panel">
          <header><h2>知识最丰富的作品</h2><p>按图谱中的关联数量排序</p></header>
          <ol className="home-rank">{richWorks.map((entity, index) => <li key={entity.id}><button type="button" onClick={() => onPickEntityName(entity.name)}>
            <b>{index + 1}</b><span>{entity.name}</span>
            <i style={{ width: `${Math.round(((entity.degree ?? 0) / maxWorkDegree) * 100)}%` }} /><em>{entity.degree}</em>
          </button></li>)}</ol>
        </div>
      </section>

      <footer className="home-footer">
        <p>教材内容依据人民音乐出版社新版七至九年级音乐教材逐页整理，每条知识标注教材页码；教材之外的补充单独标注为“拓展知识”，已逐条审阅。</p>
        <button type="button" onClick={onResearchInfo}>研究信息</button>
      </footer>
    </div>
  </div>;
}

type HeroNode = { name: string; relation: string; category: string };

/** Up to six direct neighbours of the hero work, one per entity, ordered by category. */
function heroNeighbours(graph: PortalGraph | null) {
  if (!graph) return null;
  const work = graph.entities.find(entity => entity.name === HERO_WORK);
  if (!work) return null;
  const byId = new Map(graph.entities.map(entity => [entity.id, entity]));
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
  // Keep the broad, story-telling links (people, history, rhythm, tempo) ahead of key/meter signatures.
  const order = ["person", "textbook", "culture", "element", "theory", "work"];
  const late = new Set(["拍号", "调性"]);
  const nodes = [...picked.values()].sort((a, b) =>
    Number(late.has(a.type)) - Number(late.has(b.type)) || order.indexOf(a.category) - order.indexOf(b.category));
  return { name: work.name, type: work.type, nodes: nodes.slice(0, HERO_SLOTS.length) };
}

function HeroGraph({ hero, onPick }: { hero: ReturnType<typeof heroNeighbours>; onPick: (name: string) => void }) {
  if (!hero) return <div className="home-hero-graph" aria-hidden="true" />;
  return <div className="home-hero-graph">
    <svg className="home-hero-links" viewBox="-300 -230 600 460" aria-hidden="true">
      <circle r="176" className="home-hero-orbit" />
      {hero.nodes.map((node, index) => {
        const [x, y] = HERO_SLOTS[index];
        return <g key={node.name}>
          <line x1={0} y1={0} x2={x} y2={y} />
          <circle cx={x * 0.58} cy={y * 0.58} r="5" className={`home-hero-dot ${index % 2 ? "is-green" : "is-amber"}`} />
        </g>;
      })}
    </svg>
    <button type="button" className="home-hero-center" onClick={() => onPick(hero.name)}>
      <WorkbenchIcon name="music" /><strong>{hero.name.replace(/[《》]/g, "")}</strong><small>{hero.type}</small>
    </button>
    {hero.nodes.map((node, index) => {
      const [x, y] = HERO_SLOTS[index];
      return <button type="button" key={node.name} className={`home-hero-node cat-${node.category}`} style={{ left: `${50 + (x / 600) * 100}%`, top: `${50 + (y / 460) * 100}%` }} onClick={() => onPick(node.name)}>
        <span className="home-hero-bubble"><WorkbenchIcon name={CATEGORY_ICON[node.category] ?? "spark"} /></span>
        <strong>{node.name}</strong><small>{node.relation}</small>
      </button>;
    })}
  </div>;
}

/** Soft ink-wash mountains, mist and floating notes behind the hero. */
function InkLandscape() {
  return <svg className="home-ink" viewBox="0 0 1600 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="ink-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9FB4A9" stopOpacity=".55" /><stop offset="1" stopColor="#DCE5DF" stopOpacity="0" /></linearGradient>
      <linearGradient id="ink-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6F8C7E" stopOpacity=".6" /><stop offset="1" stopColor="#E8EEE9" stopOpacity="0" /></linearGradient>
      <radialGradient id="ink-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#F2E3C6" stopOpacity=".9" /><stop offset="1" stopColor="#F2E3C6" stopOpacity="0" /></radialGradient>
    </defs>
    <circle cx="1180" cy="120" r="170" fill="url(#ink-sun)" />
    <path d="M0 330 C90 250 150 270 220 210 C280 160 330 220 380 250 C440 285 500 240 560 300 L560 520 L0 520Z" fill="url(#ink-far)" />
    <path d="M0 420 C70 350 130 360 190 310 C240 270 290 330 350 360 C420 395 470 360 520 410 L520 520 L0 520Z" fill="url(#ink-near)" />
    <path d="M1040 360 C1120 290 1180 300 1250 240 C1320 180 1380 250 1440 270 C1500 290 1560 250 1600 270 L1600 520 L1040 520Z" fill="url(#ink-far)" />
    <path d="M1180 440 C1250 390 1310 400 1370 360 C1430 320 1490 380 1540 390 C1570 396 1590 380 1600 385 L1600 520 L1180 520Z" fill="url(#ink-near)" />
    <g className="home-ink-staff" fill="none">
      <path d="M-20 250 C200 190 420 330 700 250" /><path d="M-20 262 C200 202 420 342 700 262" /><path d="M-20 274 C200 214 420 354 700 274" />
    </g>
    <g className="home-ink-notes">
      <text x="70" y="220">♪</text><text x="760" y="270">♫</text><text x="820" y="200">♪</text><text x="1500" y="140">♪</text><text x="1540" y="330">♫</text>
    </g>
  </svg>;
}

const SCENES: Array<{ sky: [string, string]; far: string; near: string; ground: string; motif: "boat" | "trees" | "wall" | "blossom" | "dome" | "stage" }> = [
  { sky: ["#DCE8E3", "#F4F1E8"], far: "#9DB5AC", near: "#5E8474", ground: "#B9CFC6", motif: "boat" },
  { sky: ["#F3E2C4", "#FBF4E6"], far: "#D9B27A", near: "#B98A4B", ground: "#E7D3AE", motif: "trees" },
  { sky: ["#D6E4EA", "#F2F4EE"], far: "#9FB3B8", near: "#6E8B7E", ground: "#C7D4C2", motif: "wall" },
  { sky: ["#F6E1E1", "#FBF3EE"], far: "#D8B7B3", near: "#9C7A6C", ground: "#EAD5CF", motif: "blossom" },
  { sky: ["#D7E3F1", "#F4F3EE"], far: "#A9B8CB", near: "#7B8DA6", ground: "#D2D9E2", motif: "dome" },
  { sky: ["#5B3A24", "#8A5A33"], far: "#A06A3C", near: "#6B4226", ground: "#3E2616", motif: "stage" },
];

/** A small illustrated header per textbook; purely decorative. */
function BookScene({ variant }: { variant: number }) {
  const scene = SCENES[variant];
  const id = `scene-${variant}`;
  return <svg className="home-book-scene" viewBox="0 0 240 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={scene.sky[0]} /><stop offset="1" stopColor={scene.sky[1]} /></linearGradient></defs>
    <rect width="240" height="110" fill={`url(#${id})`} />
    {scene.motif === "stage" ? <>
      {[30, 80, 130, 180, 230].map(x => <path key={x} d={`M${x - 22} 110 V40 Q${x} 18 ${x + 22} 40 V110`} fill="#00000026" />)}
      <rect y="78" width="240" height="32" fill={scene.ground} />
      {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={14 + i * 16} cy={i % 2 ? 80 : 84} r="4" fill="#1A0F08" />)}
      {[40, 120, 200].map(x => <circle key={x} cx={x} cy="22" r="6" fill="#F7C873" opacity=".85" />)}
    </> : <>
      <path d="M0 70 C30 40 55 48 80 32 C105 18 130 44 160 40 C190 36 215 22 240 34 V110 H0Z" fill={scene.far} opacity=".7" />
      <path d="M0 86 C40 64 70 72 100 60 C130 50 170 70 200 62 C220 58 232 64 240 66 V110 H0Z" fill={scene.near} opacity=".75" />
      <rect y="92" width="240" height="18" fill={scene.ground} />
      {scene.motif === "boat" && <path d="M150 95 h26 l-5 5 h-16Z M162 95 V82 l8 10Z" fill="#3E5A4F" />}
      {scene.motif === "trees" && <>
        {[34, 60, 196, 218].map((x, i) => <g key={x}><rect x={x - 1.5} y="72" width="3" height="20" fill="#7A5634" /><circle cx={x} cy="66" r={i % 2 ? 11 : 14} fill={i % 2 ? "#E0A53F" : "#D98E2E"} /></g>)}
        {[100, 130].map(x => <g key={x}><rect x={x} y="78" width="22" height="14" fill="#FBF7EE" /><path d={`M${x - 3} 79 L${x + 11} 70 L${x + 25} 79Z`} fill="#4B4640" /></g>)}
      </>}
      {scene.motif === "wall" && <path d="M20 88 L60 64 L96 72 L130 50 L170 58 L210 40 L236 46" fill="none" stroke="#8B6B4A" strokeWidth="4" strokeDasharray="6 2" />}
      {scene.motif === "blossom" && <>
        <path d="M170 92 V64 M162 64 h16 l-3 -5 h-10Z M160 72 h20 M164 72 V92 M176 72 V92" stroke="#7A3E32" strokeWidth="2.4" fill="#B5503E" />
        {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={10 + (i * 37) % 90} cy={10 + (i * 23) % 44} r={4 + (i % 3)} fill="#F2B6C1" opacity=".9" />)}
      </>}
      {scene.motif === "dome" && <>
        <path d="M112 92 V66 h36 V92Z" fill="#E9E4D8" />
        <path d="M116 66 Q130 38 144 66Z" fill="#4E73A8" /><rect x="128.5" y="30" width="3" height="10" fill="#C8A24A" />
        {[40, 62, 180, 204].map(x => <rect key={x} x={x} y="74" width="16" height="18" fill="#E7DCC9" />)}
      </>}
    </>}
  </svg>;
}
