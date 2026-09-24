"use client";
import { useMemo, type FormEvent } from "react";
import { WorkbenchIcon } from "../WorkbenchIcon";

type PortalEntity = { id: string; name: string; type: string; category?: string; textbookCount?: number; degree?: number };
type PortalBook = { key: string; title: string; grade: number; semester: string; entityCount: number; tripleCount: number; workCount: number; pages: number };
type PortalGraph = { entities: PortalEntity[]; relationships: unknown[] };
type PortalSearchResult<E, B> = { entity: E; book: B; relationCount: number; matchedBy: string };
type PortalView = "graph" | "assistant" | "research" | "records";

const GRADE_NAMES: Record<number, string> = { 7: "七年级", 8: "八年级", 9: "九年级" };
const HOT_SEARCHES = ["游击队歌", "黄河", "京剧", "旋律", "民歌", "冼星海"];
const FEATURES: Array<{ view: PortalView; icon: "graph" | "book" | "message" | "research"; title: string; text: string }> = [
  { view: "graph", icon: "graph", title: "图谱探索", text: "拖拽、聚焦、路径查询，看清作品、人物与乐理之间的联系。" },
  { view: "records", icon: "book", title: "作品档案", text: "逐首浏览教材作品，查看创作背景、音乐要素与教材出处。" },
  { view: "assistant", icon: "message", title: "智能问答", text: "用自然语言提问，回答附带可追溯的教材证据。" },
  { view: "research", icon: "research", title: "研究分析", text: "六册关联矩阵、跨册核心知识与图谱质量指标。" },
];

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
  const stats = useMemo(() => {
    const entities = graph?.entities ?? [];
    return {
      entities: entities.length,
      relations: graph?.relationships.length ?? 0,
      works: entities.filter(entity => entity.category === "work").length,
    };
  }, [graph]);
  const coreConcepts = useMemo(() => (graph?.entities ?? [])
    .filter(entity => entity.category === "theory" && (entity.textbookCount ?? 0) >= 6)
    .sort((a, b) => (b.degree ?? 0) - (a.degree ?? 0)).slice(0, 12), [graph]);
  const richWorks = useMemo(() => (graph?.entities ?? [])
    .filter(entity => entity.category === "work")
    .sort((a, b) => (b.degree ?? 0) - (a.degree ?? 0)).slice(0, 8), [graph]);
  const maxWorkDegree = richWorks[0]?.degree ?? 1;
  const fmt = (value: number) => value.toLocaleString("en-US");

  return <div className="home-portal">
    <section className="home-hero">
      <div className="home-hero-copy">
        <p className="home-eyebrow"><WorkbenchIcon name="sprout" />人音版 · 七至九年级 · 音乐数字教材知识网络</p>
        <h1>让每一节音乐课，<br />都长在<span>知识的网络</span>上</h1>
        <p className="home-lead">芽谱把六册初中音乐教材中的作品、人物、体裁与乐理概念连接成一张可检索、可追溯、可用于课堂的知识图谱。</p>
        <form className="home-search" onSubmit={onSearch} role="search">
          <WorkbenchIcon name="search" />
          <input value={query} onChange={event => onQuery(event.target.value)} placeholder="搜索作品、人物、体裁、乐理概念，例如《游击队歌》" aria-label="搜索知识点" />
          <button type="submit">搜索</button>
          {query && results.length > 0 && <div className="home-search-results">
            {results.map(({ entity, book, relationCount }) => <button type="button" key={`${book.key}-${entity.id}`} onClick={() => onPickResult(entity, book)}>
              <span><strong>{entity.name}</strong><small>{book.grade}年级{book.semester} · {entity.type} · {relationCount} 条关系</small></span>
              <WorkbenchIcon name="arrow" />
            </button>)}
          </div>}
        </form>
        <div className="home-hot"><span>热门：</span>{HOT_SEARCHES.map(term => <button key={term} type="button" onClick={() => onQuery(term)}>{term}</button>)}</div>
      </div>
      <HeroNetwork />
    </section>

    <section className="home-stats" aria-label="数据规模">
      <div><strong>{books.length}</strong><span>册教材</span></div>
      <div><strong>{fmt(stats.entities)}</strong><span>个知识点</span></div>
      <div><strong>{fmt(stats.relations)}</strong><span>条知识关联</span></div>
      <div><strong>{fmt(stats.works)}</strong><span>首音乐作品</span></div>
    </section>

    <section className="home-section">
      <header className="home-section-head">
        <div><h2>教材书架</h2><p>选择一册教材，进入这一册的知识图谱</p></div>
        <button type="button" className="home-link" onClick={onOpenFullGraph}><WorkbenchIcon name="layers" />六册叠加总览</button>
      </header>
      <div className="home-shelf">
        {books.map(book => <button type="button" key={book.key} className={`home-book grade-${book.grade} ${book.semester === "下册" ? "is-lower" : ""}`} onClick={() => onOpenBook(book)}>
          <span className="home-book-cover">
            <span className="home-book-publisher">人民音乐出版社</span>
            <span className="home-book-title"><b>音乐</b><em>{GRADE_NAMES[book.grade] ?? `${book.grade}年级`}{book.semester}</em></span>
            <WorkbenchIcon name="music" className="home-book-glyph" />
          </span>
          <span className="home-book-meta">
            <span><b>{book.workCount}</b>首作品</span>
            <span><b>{fmt(book.entityCount)}</b>知识点</span>
            <span><b>{fmt(book.tripleCount)}</b>关系</span>
          </span>
          <span className="home-book-open">打开图谱<WorkbenchIcon name="right" /></span>
        </button>)}
      </div>
    </section>

    <section className="home-section">
      <header className="home-section-head"><div><h2>从这里开始</h2><p>面向教师备课、学生自学与教学研究</p></div></header>
      <div className="home-features">
        {FEATURES.map(feature => <button type="button" key={feature.view} onClick={() => onView(feature.view)}>
          <span className="home-feature-icon"><WorkbenchIcon name={feature.icon} /></span>
          <strong>{feature.title}</strong>
          <p>{feature.text}</p>
          <span className="home-feature-go">进入<WorkbenchIcon name="right" /></span>
        </button>)}
      </div>
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
      <p>教材内容依据人民音乐出版社新版七至九年级音乐教材整理；AI 补充的知识已单独标注为“待核查”，以教材原文为准。</p>
      <button type="button" onClick={onResearchInfo}>研究信息</button>
    </footer>
  </div>;
}

/** Decorative network illustration for the hero; nodes use the shared semantic palette. */
function HeroNetwork() {
  const nodes: Array<[number, number, number, string]> = [
    [210, 170, 30, "work"], [110, 95, 16, "person"], [320, 90, 18, "genre"], [345, 235, 15, "theory"],
    [95, 245, 17, "culture"], [220, 300, 13, "instrument"], [55, 160, 9, "theory"], [400, 160, 10, "element"],
    [150, 330, 9, "person"], [300, 330, 10, "work"], [255, 45, 9, "element"], [405, 280, 8, "activity"],
  ];
  const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 6], [2, 7], [3, 7], [4, 8], [5, 9], [2, 10], [3, 11], [1, 10], [5, 8], [9, 3]];
  return <div className="home-hero-art" aria-hidden="true">
    <svg viewBox="0 0 460 380">
      <g className="home-art-edges">{edges.map(([a, b], index) => <line key={index} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />)}</g>
      {nodes.map(([x, y, r, category], index) => <circle key={index} className="home-art-node" style={{ animationDelay: `${index * 0.35}s` }} cx={x} cy={y} r={r} fill={`var(--semantic-${category})`} />)}
      <text x="210" y="176" textAnchor="middle">作品</text>
    </svg>
  </div>;
}
