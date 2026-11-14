"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { publicAssetUrl } from "../../lib/app/assets";
import type { AppView } from "../../lib/app/routing";

type ExplorationView = Extract<AppView, "compose" | "vary" | "beat" | "ear" | "lab" | "rhythm">;

const tabs: Array<{ view: ExplorationView; label: string; caption: string }> = [
  { view: "compose", label: "旋律创编", caption: "写一段旋律" },
  { view: "vary", label: "旋律变奏", caption: "把主题变一变" },
  { view: "beat", label: "节奏创编", caption: "编一段合奏" },
  { view: "ear", label: "听音训练", caption: "练练小耳朵" },
  { view: "lab", label: "五声律坊", caption: "转一转律盘" },
  { view: "rhythm", label: "节奏训练", caption: "拍一拍节奏" },
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

  // Once the open tab has had its turn, fetch the other three (code, data, art) in the background:
  // every request to the host costs a long round trip, so a tab fetched on click keeps the class waiting.
  useEffect(() => {
    const preload = () => {
      void import("../ear/EarPage").catch(() => undefined);
      void import("../lab/LabPage").catch(() => undefined);
      void import("../rhythm/RhythmPage").catch(() => undefined);
      void import("../beat/BeatPage").catch(() => undefined);
      void import("../vary/VaryPage").catch(() => undefined);
      void import("../compose/ComposePage").catch(() => undefined);
      new Image().src = publicAssetUrl("art/rhythm/drum.webp");
    };
    const idle = window.requestIdleCallback?.(preload, { timeout: 2500 });
    const timer = idle === undefined ? window.setTimeout(preload, 1200) : undefined;
    return () => { if (idle !== undefined) window.cancelIdleCallback(idle); if (timer !== undefined) window.clearTimeout(timer); };
  }, []);

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
          <h1 id="exploration-title">音乐探索与创造</h1>
          <p>写旋律、变主题、编节奏，再练耳朵、转律盘、打节奏。</p>
        </div>
        <div
          className="exploration-tabs"
          role="tablist"
          aria-label="音乐探索与创造方式"
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
