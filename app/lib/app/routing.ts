// The whole site is one statically exported page, so each "page" lives in the
// URL hash: #/lesson/歌唱祖国, #/records/g7s1, #/graph/CAN_x, #/assistant.
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
  | "import";

export type AppRoute = {
  view: AppView;
  /** records: the textbook whose lessons are listed. */
  book?: string;
  /** lesson / work: the bare work title, without 《》. */
  work?: string;
  /** graph: the canonical entity shown in the inspector. */
  node?: string;
};

const VIEWS = new Set<AppView>(["home", "graph", "assistant", "research", "records", "lesson", "work", "import"]);

export const HOME_ROUTE: AppRoute = { view: "home" };

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
    if (!VIEWS.has(view)) return HOME_ROUTE;
    const detail = rest.length ? decodeURIComponent(rest.join("/")) : undefined;
    return buildRoute(view, detail || undefined);
  }
  const params = new URLSearchParams(search);
  const view = params.get("view") as AppView | null;
  if (!view || !VIEWS.has(view)) return HOME_ROUTE;
  const detail = view === "records" ? params.get("book") : view === "graph" ? params.get("node") : params.get("work");
  return buildRoute(view, detail ?? undefined);
}

/** The hash for a page ("" for the home page). */
export function formatRoute(route: AppRoute): string {
  if (route.view === "home") return "";
  const detail = route.book ?? route.work ?? route.node;
  return `#/${route.view}${detail ? `/${encodeURIComponent(detail)}` : ""}`;
}
