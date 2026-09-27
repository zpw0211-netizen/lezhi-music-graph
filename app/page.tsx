"use client";

export const dynamic = "force-static";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, FormEvent } from "react";
import nextDynamic from "next/dynamic";
import { designTokenCssVariables } from "./design-tokens";
import { semanticPaletteCssVariables } from "./semantic-palette";
import { AppTopNav, type NavView } from "./components/AppTopNav";
import type { AssistantPage as AssistantPageComponent } from "./components/assistant/AssistantPage";
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
import { useGraphIndex } from "./hooks/useGraphIndex";
import { useKnowledgeSearch, type SearchResult } from "./hooks/useKnowledgeSearch";
import { publicAssetUrl } from "./lib/app/assets";
import type { AppView } from "./lib/app/routing";
import { bareWorkName, DEFAULT_BOOK_KEY, isWorkType, type Book, type Entity } from "./lib/app/types";

// Only the home page ships in the first script. Every other page is its own
// chunk, loaded when opened and prefetched in the background once the data is in.
type PropsOf<C> = C extends (props: infer P) => unknown ? P : never;
const viewLoading = () => (
  <div className="app-view-status" role="status">
    正在载入…
  </div>
);
const GraphExplorer = nextDynamic<PropsOf<typeof GraphExplorerComponent>>(
  () => import("./components/explorer/GraphExplorer").then((module) => module.GraphExplorer),
  { loading: viewLoading },
);
const ExplorerSidebar = nextDynamic<PropsOf<typeof ExplorerSidebarComponent>>(
  () => import("./components/explorer/GraphExplorer").then((module) => module.ExplorerSidebar),
);
const WorkLibrary = nextDynamic<PropsOf<typeof WorkLibraryComponent<Entity, Book>>>(
  () => import("./components/records/WorkLibrary").then((module) => module.WorkLibrary),
  { loading: viewLoading },
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

const EMPTY_BOOKS: Book[] = [];
const SITE_TITLE = "芽谱——中小学音乐教育知识图谱与智能分析平台";
const VIEW_TITLES: Record<AppView, string> = {
  home: "",
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
  const { route, routeRef, navigate, back, replaceQuietly } = useAppRoute(() => workspaceRef.current);
  const view = route.view;
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
  );
  const searchResults = useKnowledgeSearch(books, query);

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

  const pickSearchResult = (entity: Entity, book: Book) => {
    setQuery("");
    explorer.selectSearchResult(entity, book);
  };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const top: SearchResult | undefined = searchResults[0];
    if (top) pickSearchResult(top.entity, top.book);
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

  const needsData = view !== "home" && view !== "import";
  const dataStatus =
    needsData && index.status !== "ready" ? (
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
            active={view === "lesson" || view === "work" ? "records" : view === "import" ? null : view}
            onNavigate={goTo}
            onAbout={() => setResearchInfoOpen(true)}
            search={{
              query,
              onQuery: setQuery,
              onSubmit: submitSearch,
              hits: searchResults.slice(0, 8).map(({ entity, book, relationCount }) => ({
                key: `${book.key}-${entity.id}`,
                title: entity.name,
                meta: `${book.grade}年级${book.semester} · ${entity.type} · ${relationCount} 条关系`,
                onPick: () => pickSearchResult(entity, book),
              })),
            }}
          />
        )}
        {dataStatus}
        {missingWork}
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
              if (entity && explorer.canonicalBook) pickSearchResult(entity, explorer.canonicalBook);
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
            bookKey={route.book ?? recordsBook}
            isWork={isWorkType}
            onBook={(book) => openRecordsBook(book.key, true)}
            onOpen={(work: Entity) => explorer.openLesson(work)}
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
