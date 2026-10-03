"use client";

export const dynamic = "force-static";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, FormEvent } from "react";
import nextDynamic from "next/dynamic";
import { designTokenCssVariables } from "./design-tokens";
import { semanticPaletteCssVariables } from "./semantic-palette";
import { AppTopNav, type NavView } from "./components/AppTopNav";
import type { AssistantPage as AssistantPageComponent } from "./components/assistant/AssistantPage";
import type { AtlasPage as AtlasPageComponent } from "./components/atlas/AtlasPage";
import type { LabPage as LabPageComponent } from "./components/lab/LabPage";
import type {
  ExplorerSidebar as ExplorerSidebarComponent,
  GraphExplorer as GraphExplorerComponent,
} from "./components/explorer/GraphExplorer";
import { useGraphExplorer } from "./components/explorer/useGraphExplorer";
import { HomePortal } from "./components/home/HomePortal";
import type { LessonPage as LessonPageComponent } from "./components/lesson/LessonPage";
import type { WorkGraph as WorkGraphComponent } from "./components/records/WorkGraph";
import type { WorkLibrary as WorkLibraryComponent } from "./components/records/WorkLibrary";
import type { ResearchAnalysis as ResearchAnalysisComponent } from "./components/ResearchAnalysis";
import { ResearchInfo } from "./components/ResearchInfo";
import { useAppRoute } from "./hooks/useAppRoute";
import { useBookData, useGraphIndex } from "./hooks/useGraphIndex";
import { useKnowledgeSearch, type SearchResult } from "./hooks/useKnowledgeSearch";
import { useScrollReveal } from "./hooks/useScrollReveal";
import { publicAssetUrl } from "./lib/app/assets";
import type { AppView } from "./lib/app/routing";
import { bareWorkName, DEFAULT_BOOK_KEY, isWorkType, type BookDirectory, type Entity } from "./lib/app/types";

// Only the home page ships in the first script. Every other page is its own
// chunk, loaded when opened and prefetched in the background once the data is in.
type PropsOf<C> = C extends (props: infer P) => unknown ? P : never;
const viewLoading = () => (
  <div className="app-view-status" role="status">
    正在载入…
  </div>
);
function RecordsStartup({ failed = false }: { failed?: boolean }) {
  return <>
    <section aria-busy={!failed} aria-labelledby="records-startup-title" className="work-library records-startup">
      <header className="records-book-hero">
        <figure aria-hidden="true" className="records-book-hero-art" />
        <div className="records-book-hero-copy">
          <p className="records-book-kicker">按课学习 · 正在读取</p>
          <p aria-hidden="true" className="records-book-brush">音乐 ·</p>
          <h1 id="records-startup-title">正在读取本册</h1>
          <p aria-live="polite" className="records-book-intro" role="status">正在读取本册目录与作品资料…</p>
          <div aria-hidden="true" className="records-book-directory records-book-directory-placeholder" />
        </div>
      </header>
      {failed && <div className="records-data-status" role="status">
        <p>六册教材索引读取失败，请检查网络后重试。</p>
        <button onClick={() => window.location.reload()} type="button">重试</button>
      </div>}
    </section>
  </>;
}

function RecordsBookPicker({
  books,
  selectedBookKey,
  onSelect,
}: {
  books: BookDirectory[];
  selectedBookKey: string;
  onSelect: (bookKey: string) => void;
}) {
  const [squeezed, setSqueezed] = useState(false);
  const selectedIndex = Math.max(0, books.findIndex((book) => book.key === selectedBookKey));
  const chooseBook = (book: BookDirectory) => {
    setSqueezed(true);
    window.setTimeout(() => setSqueezed(false), 140);
    onSelect(book.key);
  };

  return <nav
    aria-busy={books.length === 0}
    aria-label="教材分册"
    className={`records-book-picker records-top-book-picker${squeezed ? " is-squeezed" : ""}`}
    style={{ "--book-index": selectedIndex } as CSSProperties}
  >
    {books.length > 0 && <span aria-hidden="true" className="records-top-book-drop" />}
    {books.length > 0
      ? books.map((book) => {
        const label = `${({ 7: "七", 8: "八", 9: "九" } as Record<number, string>)[book.grade] ?? book.grade}${book.semester.replace(/册$/, "")}`;
        const active = book.key === selectedBookKey;
        return <button
          aria-current={active ? "page" : undefined}
          aria-label={`${book.grade}年级${book.semester}`}
          className={active ? "is-active" : ""}
          key={book.key}
          onClick={() => chooseBook(book)}
          type="button"
        >{label}</button>;
      })
      : Array.from({ length: 6 }, (_, index) => <span aria-hidden="true" className="records-book-loading-tab" key={index} />)}
  </nav>;
}
const GraphExplorer = nextDynamic<PropsOf<typeof GraphExplorerComponent>>(
  () => import("./components/explorer/GraphExplorer").then((module) => module.GraphExplorer),
  { loading: viewLoading },
);
const ExplorerSidebar = nextDynamic<PropsOf<typeof ExplorerSidebarComponent>>(
  () => import("./components/explorer/GraphExplorer").then((module) => module.ExplorerSidebar),
);
const WorkLibrary = nextDynamic<PropsOf<typeof WorkLibraryComponent>>(
  () => import("./components/records/WorkLibrary").then((module) => module.WorkLibrary),
  { loading: () => <RecordsStartup /> },
);
const LessonPage = nextDynamic<PropsOf<typeof LessonPageComponent>>(
  () => import("./components/lesson/LessonPage").then((module) => module.LessonPage),
  { loading: viewLoading },
);
const WorkGraph = nextDynamic<PropsOf<typeof WorkGraphComponent>>(
  () => import("./components/records/WorkGraph").then((module) => module.WorkGraph),
  { loading: viewLoading },
);
const AssistantPage = nextDynamic<PropsOf<typeof AssistantPageComponent>>(
  () => import("./components/assistant/AssistantPage").then((module) => module.AssistantPage),
  { loading: viewLoading },
);
const AtlasPage = nextDynamic<PropsOf<typeof AtlasPageComponent>>(
  () => import("./components/atlas/AtlasPage").then((module) => module.AtlasPage),
  { loading: viewLoading },
);
const LabPage = nextDynamic<PropsOf<typeof LabPageComponent>>(
  () => import("./components/lab/LabPage").then((module) => module.LabPage),
  { loading: viewLoading },
);
const ResearchAnalysis = nextDynamic<PropsOf<typeof ResearchAnalysisComponent>>(
  () => import("./components/ResearchAnalysis").then((module) => module.ResearchAnalysis),
  { loading: viewLoading },
);
const ImportView = nextDynamic(
  () => import("./components/import/ImportView").then((module) => module.ImportView),
  { loading: viewLoading },
);
/** Warm the page chunks so the first switch to a page is instant. */
const prefetchPages = () => {
  void import("./components/records/WorkLibrary");
  void import("./components/lesson/LessonPage");
  void import("./components/explorer/GraphExplorer");
  void import("./components/records/WorkGraph");
  void import("./components/assistant/AssistantPage");
  void import("./components/ResearchAnalysis");
};

const EMPTY_BOOKS: BookDirectory[] = [];
const SITE_TITLE = "芽谱——中小学音乐教育知识图谱与智能分析平台";
const VIEW_TITLES: Record<AppView, string> = {
  home: "",
  atlas: "音乐地图",
  lab: "五声实验室",
  graph: "知识图谱",
  assistant: "智能问答",
  research: "研究分析",
  records: "按课学习",
  lesson: "按课学习",
  work: "作品知识图谱",
  import: "教材数据导入",
};

export default function Home() {
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const workspaceRef = useRef<HTMLElement>(null);
  const viewContainerRef = useRef<HTMLDivElement>(null);
  const { route, routeRef, navigate, pushQuietly, back, replaceQuietly } = useAppRoute(() => workspaceRef.current);
  useScrollReveal();
  const view = route.view;
  const routeTransitionKey = `${route.view}:${route.book ?? ""}:${route.work ?? ""}`;
  const previousRouteTransitionKey = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [assistantEntry, setAssistantEntry] = useState({ question: "", token: 0 });
  const [researchInfoOpen, setResearchInfoOpen] = useState(false);
  const [recordsBook, setRecordsBook] = useState(DEFAULT_BOOK_KEY);

  const openAssistant = (question = "") => {
    setAssistantEntry((current) => ({ question, token: current.token + 1 }));
    navigate({ view: "assistant" });
  };
  const openLessonPage = (work: Entity) => navigate({ view: "lesson", work: bareWorkName(work.name) });

  const index = useGraphIndex();
  const { dataset, canonicalGraph } = index;
  const books = dataset?.books ?? EMPTY_BOOKS;
  const selectedRecordsKey = route.book ?? recordsBook;
  const recordsNavBookKey = books.find((book) => book.key === selectedRecordsKey)?.key ?? books[0]?.key ?? selectedRecordsKey;
  const recordsBookData = useBookData(selectedRecordsKey, books, view === "records");
  const explorer = useGraphExplorer(
    dataset,
    canonicalGraph,
    {
      showGraph: () => {
        if (routeRef.current.view !== "graph") navigate({ view: "graph" });
      },
      openLesson: openLessonPage,
      openRecords: () => navigate({ view: "records" }),
      ask: openAssistant,
    },
    route.node,
    view === "graph",
  );
  const searchResults = useKnowledgeSearch(canonicalGraph, query);

  // Lesson and work pages are addressed by the bare work title (?work=歌唱祖国).
  const worksByTitle = useMemo(() => {
    const map = new Map<string, Entity>();
    for (const entity of canonicalGraph?.entities ?? []) {
      if (!entity.name.startsWith("《")) continue;
      const title = bareWorkName(entity.name);
      if (!map.has(title) || isWorkType(entity.type)) map.set(title, entity);
    }
    return map;
  }, [canonicalGraph]);
  const routeWork = route.work ? worksByTitle.get(route.work) : undefined;
  const entityById = (id: string) => explorer.canonicalEntityById.get(id);

  // Keep the inspected graph node in the URL so a refresh or a shared link reopens it.
  const graphNode = view === "graph" && explorer.inspectorOpen ? explorer.selected?.id : undefined;
  useEffect(() => {
    if (index.status === "ready" && view === "graph") replaceQuietly({ view: "graph", node: graphNode });
  }, [graphNode, index.status, replaceQuietly, view]);
  useEffect(() => {
    if (index.status !== "ready") return;
    const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 1500));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(prefetchPages);
    return () => cancel(handle);
  }, [index.status]);
  useEffect(() => {
    const page = view === "lesson" || view === "work" ? (route.work ? `《${route.work}》 · ${VIEW_TITLES[view]}` : "") : VIEW_TITLES[view];
    document.title = page ? `${page} · 芽谱` : SITE_TITLE;
  }, [route.work, view]);
  useLayoutEffect(() => {
    const previous = previousRouteTransitionKey.current;
    previousRouteTransitionKey.current = routeTransitionKey;
    const element = viewContainerRef.current;
    if (!previous || previous === routeTransitionKey || !element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const animation = element.animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "none" },
      ],
      // "backwards" applies the first frame immediately but drops the effect once finished,
      // so the container doesn't stay an animated layer after every route change.
      { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" },
    );
    const stopForReducedMotion = (event: MediaQueryListEvent) => {
      if (event.matches) animation.cancel();
    };
    reducedMotion.addEventListener("change", stopForReducedMotion);
    return () => {
      reducedMotion.removeEventListener("change", stopForReducedMotion);
      animation.cancel();
    };
  }, [routeTransitionKey]);

  const pickSearchResult = (entity: Entity) => {
    setQuery("");
    if (explorer.canonicalBook) explorer.selectSearchResult(entity, explorer.canonicalBook);
  };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const top: SearchResult | undefined = searchResults[0];
    if (top) pickSearchResult(top.entity);
  };
  const goTo = (target: NavView | "graph") => {
    if (target === "graph") explorer.chooseFullGraph();
    else if (target === "assistant") openAssistant();
    else navigate({ view: target });
  };
  const openRecordsBook = (bookKey: string, replace = false) => {
    setRecordsBook(bookKey);
    navigate({ view: "records", book: bookKey }, { replace });
  };
  const openRecordsWork = useCallback((routeTitle: string, bookKey: string) => {
    setRecordsBook(bookKey);
    pushQuietly({ view: "records", book: bookKey, work: routeTitle });
  }, [pushQuietly]);
  const openRecordsKnowledge = (name: string, type?: string) => {
    const candidates = canonicalGraph?.entities.filter((item) => item.name === name || item.aliases?.includes(name)) ?? [];
    const entity = candidates.find((item) => item.type === type || item.rawTypes?.includes(type ?? "")) ?? candidates[0];
    if (entity) navigate({ view: "graph", node: entity.id });
  };

  const needsData = view !== "home" && view !== "import" && view !== "atlas";
  const dataStatus =
    needsData && view !== "records" && index.status !== "ready" ? (
      <div className="app-view-status" role="status" aria-live="polite">
        {index.status === "error" ? "教材数据加载失败，请检查网络后刷新页面。" : "正在载入六册教材数据…"}
      </div>
    ) : null;
  const missingWork =
    (view === "lesson" || view === "work") && index.status === "ready" && !routeWork ? (
      <div className="app-view-status" role="status">
        <p>没有找到《{route.work}》这一课。</p>
        <button type="button" onClick={() => navigate({ view: "records" })}>
          返回按课学习
        </button>
      </div>
    ) : null;

  if (!hydrated)
    return (
      <div className="app-loading" aria-busy="true">
        正在载入芽谱…
      </div>
    );
  return (
    <main
      className={`app-shell theme-light ${explorer.knowledgeDetailOpen && view === "graph" ? "detail-open" : ""} ${explorer.inspectorOpen ? "inspector-open" : "inspector-closed"} schema-open ${view === "assistant" ? "assistant-mode" : ""} ${view === "home" ? "home-mode" : ""} ${view === "graph" || view === "research" ? "graph-first" : ""} ${view === "graph" ? "network-mode" : "nav-mode"} ink-app`}
      style={{ ...designTokenCssVariables, ...semanticPaletteCssVariables } as CSSProperties}
    >
      {view === "graph" && canonicalGraph && (
        <ExplorerSidebar explorer={explorer} onView={(value) => goTo(value as NavView)} />
      )}
      <section className="workspace" ref={workspaceRef}>
        {view !== "home" && (
          <AppTopNav
            active={
              view === "lesson" || view === "work"
                ? "records"
                : view === "import" || view === "atlas"
                  ? null
                  : view
            }
            onNavigate={goTo}
            onAbout={() => setResearchInfoOpen(true)}
            centerSlot={view === "records" ? <RecordsBookPicker books={books} selectedBookKey={recordsNavBookKey} onSelect={openRecordsBook} /> : undefined}
            search={{
              query,
              onQuery: setQuery,
              onSubmit: submitSearch,
              hits: searchResults.slice(0, 8).map(({ entity, book, relationCount }) => ({
                key: `${book.key}-${entity.id}`,
                title: entity.name,
                meta: `${book.grade}年级${book.semester} · ${entity.type} · ${relationCount} 条关系`,
                onPick: () => pickSearchResult(entity),
              })),
            }}
          />
        )}
        <div className={`route-view${view === "lab" ? " route-view-lab" : ""}`} ref={viewContainerRef}>
          {dataStatus}
          {missingWork}
          {view === "records" && index.status !== "ready" && <RecordsStartup failed={index.status === "error"} />}
          {view === "home" && (
            <HomePortal
            books={books}
            graph={canonicalGraph}
            query={query}
            onQuery={setQuery}
            results={searchResults}
            onPickResult={pickSearchResult}
            onSearch={submitSearch}
            onOpenBook={(book) => openRecordsBook(book.key)}
            onOpenFullGraph={explorer.chooseFullGraph}
            onView={(value) => (value === "assistant" ? openAssistant() : navigate({ view: value }))}
            onPickEntityName={(name) => {
              const entity = explorer.canonicalBook?.entities.find((item) => item.name === name);
              if (entity) pickSearchResult(entity);
            }}
            onResearchInfo={() => setResearchInfoOpen(true)}
            />
          )}
          {view === "graph" && canonicalGraph && <GraphExplorer explorer={explorer} />}
          {view === "assistant" && canonicalGraph && (
            <AssistantPage
              key={assistantEntry.token}
              graph={canonicalGraph}
              assetUrl={publicAssetUrl}
              initialQuestion={assistantEntry.question}
              onGraphFocus={explorer.focusAnswer}
            />
          )}
          {view === "research" && canonicalGraph && (
            <ResearchAnalysis
              books={canonicalGraph.books}
              entities={canonicalGraph.entities}
              relationships={canonicalGraph.relationships}
              quality={canonicalGraph.quality}
              onSelectPair={(_left, _right, entityIds) => explorer.openResearchPair(entityIds)}
              onSelectEntity={explorer.openResearchEntity}
            />
          )}
          {view === "records" && dataset && (
            <WorkLibrary
              books={books}
              bookKey={selectedRecordsKey}
              bookData={recordsBookData.book}
              bookDataStatus={recordsBookData.status}
              onRetryBookData={recordsBookData.retry}
              detailWork={route.view === "records" ? route.work : undefined}
              onOpen={openRecordsWork}
              onClose={() => back({ view: "records", book: selectedRecordsKey })}
              onLearn={(workId) => {
                const work = recordsBookData.book?.entities.find((entity) => entity.id === workId);
                if (work && isWorkType(work.type)) openLessonPage(work);
              }}
              onKnowledge={openRecordsKnowledge}
            />
          )}
          {view === "lesson" && canonicalGraph && routeWork && (
            <LessonPage
            key={routeWork.id}
            workId={routeWork.id}
            entities={canonicalGraph.entities}
            relationships={canonicalGraph.relationships}
            assetUrl={publicAssetUrl}
            onBack={() => back({ view: "records", book: routeWork.bookKeys?.[0] })}
            onOpenLesson={(id) => {
              const work = entityById(id);
              if (work) openLessonPage(work);
            }}
            onWorkGraph={(id) => {
              const work = entityById(id);
              if (work) navigate({ view: "work", work: bareWorkName(work.name) });
            }}
            />
          )}
          {view === "work" && canonicalGraph && routeWork && (
            <WorkGraph
            workId={routeWork.id}
            entities={canonicalGraph.entities}
            relationships={canonicalGraph.relationships}
            books={books}
            assetUrl={publicAssetUrl}
            onBack={() => back({ view: "lesson", work: route.work })}
            onOpenWork={(id) => {
              const work = entityById(id);
              if (work) navigate({ view: "work", work: bareWorkName(work.name) });
            }}
            onLocate={explorer.locateCanonical}
            />
          )}
          {view === "import" && <ImportView />}
          {view === "atlas" && <AtlasPage onOpenWork={(work) => navigate({ view: "lesson", work })} />}
          {view === "lab" && canonicalGraph && <LabPage graph={canonicalGraph} onOpenWork={(work) => navigate({ view: "lesson", work })} />}
        </div>
      </section>
      <ResearchInfo
        open={researchInfoOpen}
        version={canonicalGraph?.version ?? "V2.2"}
        generatedAt={index.generatedAt}
        onClose={() => setResearchInfoOpen(false)}
      />
    </main>
  );
}
