"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { publicAssetUrl } from "../lib/app/assets";
import { WorkbenchIcon } from "./WorkbenchIcon";
export type NavView = "home" | "records" | "graph" | "assistant" | "research" | "lab" | "atlas";
type SearchHit = { key: string; title: string; meta: string; onPick: () => void };
type NavItem = { label: string; view: NavView; href?: string } | { label: string; view: "timeline"; href: string };

function subscribeToLocation(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const getLocationHash = () => window.location.hash;
const getServerHash = () => "";
export function AppTopNav({ active, onNavigate, search, trailing, centerSlot }: {
  active: NavView | null; onNavigate: (view: NavView) => void; onAbout: () => void;
  search?: { query: string; onQuery: (value: string) => void; onSubmit: (event: FormEvent) => void; hits: SearchHit[] };
  trailing?: ReactNode; centerSlot?: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const locationHash = useSyncExternalStore(subscribeToLocation, getLocationHash, getServerHash);
  const items: NavItem[] = [
    { label: "按课学习", view: "records" },
    { label: "音乐地图", view: "atlas", href: "#/atlas" }, { label: "作品年表", view: "timeline", href: "#/timeline" },
    { label: "五声实验室", view: "lab", href: "#/lab" }, { label: "知识图谱", view: "graph" },
    { label: "智能问答", view: "assistant" },
  ];
  const hashView = locationHash.startsWith("#/")
    ? items.find(item => item.view === locationHash.slice(2).split("/")[0])?.view
    : undefined;
  const currentView = hashView ?? active;
  const focusNavigationAfterChange = () => {
    window.requestAnimationFrame(() => {
      const button = document.querySelector<HTMLButtonElement>(".home-nav-menu");
      if (button && button.getClientRects().length > 0) {
        button.focus();
        return;
      }
      const heading = document.querySelector<HTMLElement>(
        ".route-view h1:not(.home-title-accessible), .home-portal main h1:not(.home-title-accessible)",
      );
      if (heading) {
        if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    });
  };
  const closeMenu = (restoreFocusAfterNavigation = false) => {
    setMenuOpen(false);
    if (restoreFocusAfterNavigation) focusNavigationAfterChange();
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const button = menuButtonRef.current;
      const panel = menuPanelRef.current;
      if (!button || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter(element => element.getClientRects().length > 0 && !element.closest("[inert], [aria-hidden='true']"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (!first || !last) {
        event.preventDefault();
        button.focus();
      } else if (event.shiftKey && activeElement === button) {
        event.preventDefault();
        last.focus();
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        button.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        button.focus();
      } else if (!panel.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);
  return <nav className="home-nav" aria-label="主导航">
    <div className="home-nav-inner">
      <button type="button" className="home-brand" onClick={() => { onNavigate("home"); closeMenu(menuOpen); }} aria-label="芽谱首页">
        <Image src={publicAssetUrl("brand/mark.svg")} alt="" aria-hidden="true" width={34} height={34} priority unoptimized /><span>芽谱</span>
      </button>
      {centerSlot && <div className="home-nav-center">{centerSlot}</div>}
      <button ref={menuButtonRef} type="button" className="home-nav-menu" aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"} aria-expanded={menuOpen} aria-controls="home-nav-panel" onClick={() => setMenuOpen(value => !value)}>
        <span aria-hidden="true">{menuOpen ? "×" : "菜单"}</span>
      </button>
      <div ref={menuPanelRef} id="home-nav-panel" className={"home-nav-content " + (menuOpen ? "is-open" : "")}>
        <div className="home-nav-links">
          {items.map(item => {
            const current = item.view === currentView;
            if (item.href) return <a key={item.label} className={current ? "is-active" : ""} href={item.href} aria-current={current ? "page" : undefined} onClick={event => {
              closeMenu();
              if (item.view === "atlas" || item.view === "lab") {
                event.preventDefault();
                onNavigate(item.view);
              }
              if (menuOpen) focusNavigationAfterChange();
            }}>{item.label}</a>;
            return <button key={item.label} type="button" className={current ? "is-active" : ""} aria-current={current ? "page" : undefined} onClick={() => { onNavigate(item.view as NavView); closeMenu(menuOpen); }}>{item.label}</button>;
          })}
        </div>
        <div className="home-nav-actions">
          {search && <form className="app-nav-search" role="search" onSubmit={search.onSubmit}>
            <WorkbenchIcon name="search" />
            <input value={search.query} onChange={event => search.onQuery(event.target.value)} placeholder="搜索作品、人物或知识点" aria-label="搜索知识点" />
            {search.query && search.hits.length > 0 && <div className="app-nav-results">
              {search.hits.map(hit => <button type="button" key={hit.key} onClick={() => { hit.onPick(); closeMenu(menuOpen); }}><strong>{hit.title}</strong><small>{hit.meta}</small></button>)}
            </div>}
          </form>}
          {trailing}
        </div>
      </div>
    </div>
  </nav>;
}
