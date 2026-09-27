"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatRoute, HOME_ROUTE, parseRoute, type AppRoute } from "../lib/app/routing";

type HistoryState = { yapuIndex?: number } | null;
const historyIndex = () => (window.history.state as HistoryState)?.yapuIndex ?? 0;
const hrefFor = (route: AppRoute) => `${window.location.pathname}${formatRoute(route)}`;
const currentRoute = () => parseRoute(window.location.hash, window.location.search);

/**
 * Keeps the current page in the URL hash. Pushing a new page scrolls to the
 * top; going back restores where the reader was on that page.
 */
export function useAppRoute(getScroller: () => HTMLElement | null) {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window === "undefined" ? HOME_ROUTE : currentRoute(),
  );
  const routeRef = useRef(route);
  const scrollByUrl = useRef(new Map<string, number>());
  const pendingScroll = useRef<number | null>(null);
  const scrollerRef = useRef(getScroller);
  useEffect(() => {
    scrollerRef.current = getScroller;
  });

  const readScroll = () => scrollerRef.current()?.scrollTop || window.scrollY;
  const commit = (next: AppRoute, scrollTop: number | null) => {
    routeRef.current = next;
    pendingScroll.current = scrollTop;
    setRoute(next);
  };

  useEffect(() => {
    // Rewrite legacy ?view=… links and partial hashes into the canonical form.
    const canonical = hrefFor(routeRef.current);
    if (canonical !== `${window.location.pathname}${window.location.search}${window.location.hash}`)
      window.history.replaceState({ yapuIndex: historyIndex() }, "", canonical);
    const onPopState = () => {
      scrollByUrl.current.set(formatRoute(routeRef.current), readScroll());
      const next = currentRoute();
      commit(next, scrollByUrl.current.get(formatRoute(next)) ?? 0);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useLayoutEffect(() => {
    const top = pendingScroll.current;
    if (top === null) return;
    pendingScroll.current = null;
    const scroller = scrollerRef.current();
    if (scroller) scroller.scrollTop = top;
    window.scrollTo(0, top);
  }, [route]);

  /** Go to a page. `replace` rewrites the current history entry and keeps the scroll position. */
  const navigate = useCallback((next: AppRoute, options: { replace?: boolean } = {}) => {
    const current = routeRef.current;
    if (formatRoute(next) === formatRoute(current)) return;
    if (options.replace) {
      window.history.replaceState({ yapuIndex: historyIndex() }, "", hrefFor(next));
      commit(next, null);
      return;
    }
    scrollByUrl.current.set(formatRoute(current), readScroll());
    window.history.pushState({ yapuIndex: historyIndex() + 1 }, "", hrefFor(next));
    commit(next, 0);
  }, []);

  /** Return to the previous page of this site, or to `fallback` when the visit started here. */
  const back = useCallback((fallback: AppRoute) => {
    if (historyIndex() > 0) window.history.back();
    else navigate(fallback);
  }, [navigate]);

  /** Record a detail (such as the selected graph node) in the URL without a new history entry or re-render. */
  const replaceQuietly = useCallback((next: AppRoute) => {
    if (formatRoute(next) === formatRoute(routeRef.current)) return;
    routeRef.current = next;
    window.history.replaceState({ yapuIndex: historyIndex() }, "", hrefFor(next));
  }, []);

  return { route, routeRef, navigate, back, replaceQuietly };
}
