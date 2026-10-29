"use client";
import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { BrandMark } from "./home/BrandMark";
import { BRAND_NAME } from "../lib/app/brand";
import { WorkbenchIcon } from "./WorkbenchIcon";
import dynamic from "next/dynamic";
import type { AccountView } from "./account/AccountPanel";
import { useAccount } from "./account/AccountProvider";
// The account SDK is large and only needed once someone opens the dialog.
const AccountDialog = dynamic(() => import("./account/AccountDialog").then(module => module.AccountDialog));
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
export function AppTopNav({ active, onNavigate, search, trailing, centerSlot, onAccount }: {
  active: NavView | null; onNavigate: (view: NavView) => void; onAbout: () => void;
  search?: { query: string; onQuery: (value: string) => void; onSubmit: (event: FormEvent) => void; hits: SearchHit[] };
  trailing?: ReactNode; centerSlot?: ReactNode;
  /** Opens the account panel somewhere else; without it the nav shows its own dialog. */
  onAccount?: (view: AccountView) => void;
}) {
  const [accountView, setAccountView] = useState<AccountView | null>(null);
  const { profile } = useAccount();
  const locationHash = useSyncExternalStore(subscribeToLocation, getLocationHash, getServerHash);
  const items: NavItem[] = [
    { label: "按课学习", view: "records" },
    { label: "知识图谱", view: "graph" },
    { label: "音乐探索与创造", view: "atlas", href: "#/atlas" },
    { label: "智能问答", view: "assistant" },
  ];
  const routeToken = locationHash.startsWith("#/") ? locationHash.slice(2).split("/")[0] : "";
  const hashView = locationHash.startsWith("#/")
    ? items.find(item => item.view === routeToken)?.view
      ?? (["lab", "timeline", "rhythm"].includes(routeToken) ? "atlas" : undefined)
    : undefined;
  const currentView = hashView ?? active;
  return <><nav className="home-nav" aria-label="主导航">
    <div className="home-nav-inner">
      <button type="button" className="home-brand" onClick={() => onNavigate("home")} aria-label={`${BRAND_NAME}首页`}>
        <BrandMark /><span>{BRAND_NAME}</span>
      </button>
      {centerSlot && <div className="home-nav-center">{centerSlot}</div>}
      <div id="home-nav-panel" className="home-nav-content">
        <div className="home-nav-links">
          {items.map(item => {
            const current = item.view === currentView;
            if (item.href) return <a key={item.label} className={current ? "is-active" : ""} href={item.href} aria-current={current ? "page" : undefined} onClick={event => {
              if (item.view === "atlas" || item.view === "lab") {
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
