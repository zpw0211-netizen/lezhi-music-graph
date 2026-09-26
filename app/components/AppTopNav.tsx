"use client";
import type { FormEvent, ReactNode } from "react";
import { WorkbenchIcon } from "./WorkbenchIcon";

export type NavView = "home" | "records" | "graph" | "assistant" | "research";
const LINKS: Array<[NavView, string]> = [["home", "首页"], ["records", "按课学习"], ["graph", "知识图谱"], ["assistant", "智能问答"], ["research", "研究分析"]];

type SearchHit = { key: string; title: string; meta: string; onPick: () => void };

/** The site-wide top navigation shared by the home page and every app page. */
export function AppTopNav({ active, onNavigate, onAbout, search, trailing }: {
  active: NavView | null;
  onNavigate: (view: NavView) => void;
  onAbout: () => void;
  /** An inline search box; the home page passes none and keeps its hero search instead. */
  search?: { query: string; onQuery: (value: string) => void; onSubmit: (event: FormEvent) => void; hits: SearchHit[] };
  trailing?: ReactNode;
}) {
  return <nav className="home-nav" aria-label="主导航">
    <div className="home-nav-inner">
      <button type="button" className="home-brand" onClick={() => onNavigate("home")} aria-label="返回首页">
        <WorkbenchIcon name="sprout" /><b>芽谱</b><small>中小学音乐教育知识图谱平台</small>
      </button>
      <div className="home-nav-links">
        {LINKS.map(([view, label]) => <button key={view} type="button" className={active === view ? "is-active" : ""} aria-current={active === view ? "page" : undefined} onClick={() => onNavigate(view)}>{label}</button>)}
        <button type="button" onClick={onAbout}>关于芽谱</button>
      </div>
      <div className="home-nav-actions">
        {search && <form className="app-nav-search" role="search" onSubmit={search.onSubmit}>
          <WorkbenchIcon name="search" />
          <input value={search.query} onChange={event => search.onQuery(event.target.value)} placeholder="搜索作品、人物、知识点" aria-label="搜索知识点" />
          {search.query && search.hits.length > 0 && <div className="app-nav-results">
            {search.hits.map(hit => <button type="button" key={hit.key} onClick={hit.onPick}><strong>{hit.title}</strong><small>{hit.meta}</small></button>)}
          </div>}
        </form>}
        {trailing}
      </div>
    </div>
  </nav>;
}
