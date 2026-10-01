"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { publicAssetUrl } from "../lib/app/assets";
import { WorkbenchIcon } from "./WorkbenchIcon";
export type NavView = "home" | "records" | "graph" | "assistant" | "research" | "lab";
type SearchHit = { key: string; title: string; meta: string; onPick: () => void };
type NavItem = { label: string; view?: NavView; href?: string };
export function AppTopNav({ active, onNavigate, search, trailing, centerSlot }: {
  active: NavView | null; onNavigate: (view: NavView) => void; onAbout: () => void;
  search?: { query: string; onQuery: (value: string) => void; onSubmit: (event: FormEvent) => void; hits: SearchHit[] };
  trailing?: ReactNode; centerSlot?: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const items: NavItem[] = [
    { label: "按课学习", view: "records" },
    { label: "音乐地图", href: "#/atlas" }, { label: "作品年表", href: "#/timeline" },
    { label: "五声实验室", href: "#/lab" }, { label: "知识图谱", view: "graph" },
    { label: "智能问答", view: "assistant" },
  ];
  const closeMenu = () => setMenuOpen(false);
  return <nav className="home-nav" aria-label="主导航">
    <div className="home-nav-inner">
      <button type="button" className="home-brand" onClick={() => { onNavigate("home"); closeMenu(); }} aria-label="芽谱首页">
        <Image src={publicAssetUrl("brand/mark.svg")} alt="" aria-hidden="true" width={34} height={34} priority unoptimized /><span>芽谱</span>
      </button>
      {centerSlot && <div className="home-nav-center">{centerSlot}</div>}
      <button type="button" className="home-nav-menu" aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"} aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>
        <span aria-hidden="true">{menuOpen ? "×" : "菜单"}</span>
      </button>
      <div className={"home-nav-content " + (menuOpen ? "is-open" : "")}>
        <div className="home-nav-links">
          {items.map(item => {
            const current = item.view === active;
            if (item.href) return <a key={item.label} href={item.href} onClick={closeMenu}>{item.label}</a>;
            return <button key={item.label} type="button" className={current ? "is-active" : ""} aria-current={current ? "page" : undefined} onClick={() => { onNavigate(item.view ?? "home"); closeMenu(); }}>{item.label}</button>;
          })}
        </div>
        <div className="home-nav-actions">
          {search && <form className="app-nav-search" role="search" onSubmit={search.onSubmit}>
            <WorkbenchIcon name="search" />
            <input value={search.query} onChange={event => search.onQuery(event.target.value)} placeholder="搜索作品、人物或知识点" aria-label="搜索知识点" />
            {search.query && search.hits.length > 0 && <div className="app-nav-results">
              {search.hits.map(hit => <button type="button" key={hit.key} onClick={() => { hit.onPick(); closeMenu(); }}><strong>{hit.title}</strong><small>{hit.meta}</small></button>)}
            </div>}
          </form>}
          {trailing}
        </div>
      </div>
    </div>
  </nav>;
}
