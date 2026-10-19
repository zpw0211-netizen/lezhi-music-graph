"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import type { AppView } from "../../lib/app/routing";

type ExplorationView = Extract<AppView, "atlas" | "timeline" | "lab" | "rhythm">;

const tabs: Array<{ view: ExplorationView; label: string; caption: string }> = [
  { view: "atlas", label: "音乐地图", caption: "循着地域寻找作品" },
  { view: "timeline", label: "音乐时光机", caption: "听旋律、猜年代、找作品" },
  { view: "lab", label: "五声律坊", caption: "转动律盘，听见五声与调式" },
  { view: "rhythm", label: "节奏训练", caption: "随机出题或自己编排节奏" },
];

export function ExplorationPage({
  activeView,
  onViewChange,
  children,
}: {
  activeView: ExplorationView;
  onViewChange: (view: ExplorationView) => void;
  children: ReactNode;
}) {
  const tabRefs = useRef<Partial<Record<ExplorationView, HTMLButtonElement | null>>>({});

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const activeIndex = tabs.findIndex((tab) => tab.view === activeView);
    const nextIndex = event.key === "ArrowRight"
      ? (activeIndex + 1) % tabs.length
      : event.key === "ArrowLeft"
        ? (activeIndex - 1 + tabs.length) % tabs.length
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : -1;
    if (nextIndex < 0) return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    tabRefs.current[nextTab.view]?.focus();
    onViewChange(nextTab.view);
  };

  return (
    <section className="exploration-shell" aria-labelledby="exploration-title">
      <header className="exploration-heading">
        <div className="exploration-intro">
          <p className="exploration-kicker">芽谱 · 探索空间</p>
          <h1 id="exploration-title">声音与音乐探索</h1>
          <p>从一段旋律开始，再去地图、年代、五声和节奏里发现音乐。</p>
        </div>
        <div
          className="exploration-tabs"
          role="tablist"
          aria-label="声音与音乐探索方式"
          aria-orientation="horizontal"
        >
          {tabs.map((tab, index) => {
            const selected = activeView === tab.view;
            return (
              <button
                key={tab.view}
                ref={(element) => { tabRefs.current[tab.view] = element; }}
                id={`exploration-tab-${tab.view}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="exploration-panel"
                tabIndex={selected ? 0 : -1}
                className={selected ? "is-active" : ""}
                onClick={() => onViewChange(tab.view)}
                onKeyDown={onTabKeyDown}
              >
                <span className="exploration-tab-number" aria-hidden="true">0{index + 1}</span>
                <span className="exploration-tab-copy">
                  <span>{tab.label}</span>
                  <small>{tab.caption}</small>
                </span>
                <span className="exploration-tab-arrow" aria-hidden="true">↗</span>
              </button>
            );
          })}
        </div>
      </header>
      <div
        className="exploration-panel"
        id="exploration-panel"
        role="tabpanel"
        aria-labelledby={`exploration-tab-${activeView}`}
        tabIndex={-1}
      >
        {children}
      </div>
    </section>
  );
}
