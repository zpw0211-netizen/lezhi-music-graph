// The whole site is one statically exported page, so each "page" lives in the
// URL hash: #/lesson/g7s1/歌唱祖国, #/records/g7s1, #/graph/CAN_x, #/assistant.
// Links stay shareable, refresh keeps the page, and back/forward work. The
// hash (not the query string) is used because the framework router treats a
// query-string change as a new document and may reload on back/forward.
// Older ?view=lesson&work=… links are still understood.

export type AppView =
  | "home"
  | "graph"
  | "assistant"
  | "research"
  | "records"
  | "lesson"
  | "work"
  | "import"
  | "compose"
  | "lab"
  | "ear"
  | "rhythm"
  | "plan"
  | "kmap";

export type AppRoute = {
  view: AppView;
  /** records: the textbook whose lessons are listed. */
  book?: string;
  /** lesson / work: the textbook volume for this occurrence. */
  /** records detail / lesson / work: the work title, without 《》. */
  work?: string;
  /** graph: the canonical entity shown in the inspector. */
  node?: string;
};

const VIEWS = new Set<AppView>([
  "home",
  "graph",
  "assistant",
  "research",
  "records",
  "lesson",
  "work",
  "import",
  "compose",
  "lab",
  "ear",
  "rhythm",
  "plan",
  "kmap",
]);

export const HOME_ROUTE: AppRoute = { view: "home" };

/** Retired pages and the tools that took their place: 音乐地图 → 旋律创编, 音乐时光机 → 听音训练. */
const RENAMED: Record<string, AppView> = { atlas: "compose", timeline: "ear" };

const bare = (title: string) => title.replace(/^《|》$/g, "");

function buildRoute(view: AppView, detail: string | undefined): AppRoute {
  if (view === "records") return detail ? { view, book: detail } : { view };
  if (view === "lesson" || view === "work") return detail ? { view, work: bare(detail) } : { view: "records" };
  if (view === "graph") return detail ? { view, node: detail } : { view };
  return { view };
}

/** Read the page from `location.hash`, falling back to the legacy query string. */
export function parseRoute(hash: string, search = ""): AppRoute {
  if (hash.startsWith("#/")) {
    const [rawView, ...rest] = hash.slice(2).split("/");
    const view = decodeURIComponent(rawView) as AppView;
    if (RENAMED[rawView]) return { view: RENAMED[rawView] };
    if (!VIEWS.has(view)) return HOME_ROUTE;
    // 智能备课：#/plan/g8s1/菊花台，分册和课题都可以省略。
    // 核心知识点图：#/kmap/g7s1/附点节奏，路由里的 work 是知识点或作品的名字。
    if (view === "records" || view === "plan" || view === "kmap") {
      const [book, ...workParts] = rest.map(decodeURIComponent);
      const work = workParts.join("/");
      return { view, ...(book ? { book } : {}), ...(work ? { work } : {}) };
    }
    if (view === "lesson" || view === "work") {
      const parts = rest.map(decodeURIComponent);
      const book = parts.length >= 2 && /^(?:(?:pep-|xy-)?g\d+s\d|hs-m\d+)$/.test(parts[0]) ? parts.shift() : undefined;
      const work = parts.join("/");
      return work ? { view, ...(book ? { book } : {}), work: bare(work) } : { view: "records" };
    }
    const detail = rest.length ? decodeURIComponent(rest.join("/")) : undefined;
    return buildRoute(view, detail || undefined);
  }
  const params = new URLSearchParams(search);
  const rawView = params.get("view");
  if (rawView && RENAMED[rawView]) return { view: RENAMED[rawView] };
  const view = rawView as AppView | null;
  if (!view || !VIEWS.has(view)) return HOME_ROUTE;
  if (view === "lesson" || view === "work") {
    const detail = params.get("work");
    return detail ? { view, ...(params.get("book") ? { book: params.get("book")! } : {}), work: bare(detail) } : { view: "records" };
  }
  const detail = view === "records" ? params.get("book") : view === "graph" ? params.get("node") : params.get("work");
  return buildRoute(view, detail ?? undefined);
}

/** The hash for a page ("" for the home page). */
export function formatRoute(route: AppRoute): string {
  if (route.view === "home") return "";
  if (route.view === "records" || route.view === "plan" || route.view === "kmap") {
    const book = route.book ? `/${encodeURIComponent(route.book)}` : "";
    const work = route.book && route.work ? `/${encodeURIComponent(route.work)}` : "";
    return `#/${route.view}${book}${work}`;
  }
  if (route.view === "lesson" || route.view === "work") {
    const scope = route.book && route.work ? `/${encodeURIComponent(route.book)}` : "";
    const work = route.work ? `/${encodeURIComponent(route.work)}` : "";
    return `#/${route.view}${scope}${work}`;
  }
  const detail = route.book ?? route.work ?? route.node;
  return `#/${route.view}${detail ? `/${encodeURIComponent(detail)}` : ""}`;
}
