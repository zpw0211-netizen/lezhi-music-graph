"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { BrandMark } from "./home/BrandMark";
import { EDITION } from "../lib/app/books";
import { BRAND_NAME } from "../lib/app/brand";
import { WorkbenchIcon } from "./WorkbenchIcon";
import dynamic from "next/dynamic";
import type { AccountView } from "./account/AccountPanel";
import { useAccount } from "./account/AccountProvider";
// The account SDK is large and only needed once someone opens the dialog.
const AccountDialog = dynamic(() => import("./account/AccountDialog").then(module => module.AccountDialog));
export type NavView = "home" | "records" | "plan" | "graph" | "assistant" | "research" | "lab" | "compose";
type SearchHit = { key: string; title: string; meta: string; onPick: () => void };
type NavItem = { label: string; view: NavView; href?: string };

const EDITION_OPTIONS = [
  { key: "renyin", short: "人音·简谱", label: "人音版 · 简谱", href: "/renyin/" },
  { key: "renyin-staff", short: "人音·五线谱", label: "人音版 · 五线谱", href: "/renyin-staff/" },
  { key: "renjiao", short: "人教·简谱", label: "人教版 · 简谱", href: "/renjiao/" },
  { key: "renjiao-staff", short: "人教·五线谱", label: "人教版 · 五线谱", href: "/renjiao-staff/" },
  { key: "xiangyi", short: "湘艺·简谱", label: "湘艺版 · 简谱", href: "/xiangyi/" },
  { key: "huacheng", short: "花城·简谱", label: "花城版 · 简谱", href: "/huacheng/" },
  { key: "gaozhong", short: "高中教材", label: "高中音乐教材", href: "/gaozhong/" },
] as const;

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
export function AppTopNav({ active, onNavigate, search, trailing, centerSlot, onAccount }: {
  active: NavView | null; onNavigate: (view: NavView) => void; onAbout: () => void;
  search?: { query: string; onQuery: (value: string) => void; onSubmit: (event: FormEvent) => void; hits: SearchHit[] };
  trailing?: ReactNode; centerSlot?: ReactNode;
  /** Opens the account panel somewhere else; without it the nav shows its own dialog. */
  onAccount?: (view: AccountView) => void;
}) {
  const [accountView, setAccountView] = useState<AccountView | null>(null);
  const [editionOpen, setEditionOpen] = useState(false);
  const editionRef = useRef<HTMLDivElement>(null);
  const { profile } = useAccount();
  const locationHash = useSyncExternalStore(subscribeToLocation, getLocationHash, getServerHash);
  const currentEdition = EDITION_OPTIONS.find(option => option.key === EDITION.key) ?? { key: EDITION.key, short: EDITION.label, label: EDITION.label, href: "/" };
  useEffect(() => {
    if (!editionOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (editionRef.current && !editionRef.current.contains(event.target as Node)) setEditionOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditionOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [editionOpen]);
  const items: NavItem[] = [
    { label: "按课学习", view: "records" },
    { label: "智能备课", view: "plan" },
    { label: "知识图谱", view: "graph" },
    { label: "音乐探索与创造", view: "compose", href: "#/compose" },
    { label: "智能问答", view: "assistant" },
  ];
  const routeToken = locationHash.startsWith("#/") ? locationHash.slice(2).split("/")[0] : "";
  const hashView = locationHash.startsWith("#/")
    ? items.find(item => item.view === routeToken)?.view
      ?? (["lab", "ear", "rhythm", "beat", "vary", "choir", "puzzle", "atlas", "timeline"].includes(routeToken) ? "compose" : undefined)
    : undefined;
  const currentView = hashView ?? active;
  return <><nav className="home-nav" aria-label="主导航">
    <div className="home-nav-inner">
      <div className="home-brand-group">
        <button type="button" className="home-brand" onClick={() => onNavigate("home")} aria-label={`${BRAND_NAME}首页`}>
          <BrandMark /><span>{BRAND_NAME}</span>
        </button>
        <div className="edition-switcher" ref={editionRef}>
          <button
            type="button"
            className="edition-switcher-btn"
            aria-haspopup="menu"
            aria-expanded={editionOpen}
            aria-label={`当前版本：${currentEdition.label}，点此切换教材版本`}
            onClick={() => setEditionOpen(open => !open)}
          >
            <span>{currentEdition.short}</span>
            <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1.5 1.25 5 4.75l3.5-3.5" /></svg>
          </button>
          {editionOpen && <div className="edition-menu" role="menu" aria-label="切换教材版本">
            {EDITION_OPTIONS.map(option => {
              const activeEdition = option.key === EDITION.key;
              return <a
                key={option.key}
                role="menuitem"
                href={option.href}
                className={activeEdition ? "is-current" : undefined}
                aria-current={activeEdition ? "page" : undefined}
                onClick={() => setEditionOpen(false)}
              >
                <span>{option.label}</span>
                {activeEdition && <small>当前</small>}
              </a>;
            })}
            {/* 门户页位于域名根路径 /，在 Next basePath 之外，必须用原生 a 跳转。 */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a role="menuitem" href="/" className="edition-menu-portal" onClick={() => setEditionOpen(false)}>
              <span>返回总门户 · 全部教材</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>}
        </div>
      </div>
      {centerSlot && <div className="home-nav-center">{centerSlot}</div>}
      <div id="home-nav-panel" className="home-nav-content">
        <div className="home-nav-links">
          {items.map(item => {
            const current = item.view === currentView;
            if (item.href) return <a key={item.label} className={current ? "is-active" : ""} href={item.href} aria-current={current ? "page" : undefined} onClick={event => {
              if (item.view === "compose" || item.view === "lab") {
                event.preventDefault();
                onNavigate(item.view);
              }
            }}>{item.label}</a>;
            return <button key={item.label} type="button" className={current ? "is-active" : ""} aria-current={current ? "page" : undefined} onClick={() => onNavigate(item.view as NavView)}>{item.label}</button>;
          })}
        </div>
        <div className="home-nav-actions">
          {search && <form className="app-nav-search" role="search" onSubmit={search.onSubmit}>
            <WorkbenchIcon name="search" />
            <input value={search.query} onChange={event => search.onQuery(event.target.value)} placeholder="搜索作品、人物或知识点" aria-label="搜索知识点" />
            {search.query && search.hits.length > 0 && <div className="app-nav-results">
              {search.hits.map(hit => <button type="button" key={hit.key} onClick={hit.onPick}><strong>{hit.title}</strong><small>{hit.meta}</small></button>)}
            </div>}
          </form>}
          {trailing}
          <button type="button" className="account-nav-button" onClick={() => onAccount ? onAccount("login") : setAccountView("login")}>{profile ? "我的班级" : "登录／注册"}</button>
        </div>
      </div>
    </div>
  </nav>{accountView && <AccountDialog view={accountView} onClose={() => setAccountView(null)} onBrowse={() => onNavigate("records")} />}</>;
}
