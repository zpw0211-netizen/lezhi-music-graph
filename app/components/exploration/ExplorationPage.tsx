"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { publicAssetUrl } from "../../lib/app/assets";
import type { AppView } from "../../lib/app/routing";
import { ExplorationNavContext } from "./exploration-tools";

type ExplorationView = Extract<AppView, "compose" | "vary" | "beat" | "ear" | "lab" | "rhythm" | "choir">;

type Tab = { view: ExplorationView; label: string; caption: string; icon: ReactNode };

/** Line icons drawn on a 24-unit grid in currentColor, so they follow the tab's colour. */
const ICONS: Record<ExplorationView, ReactNode> = {
  compose: <><path d="M9 17.5V5.5l10-2v11.5" /><circle cx="6.6" cy="17.6" r="2.6" /><circle cx="16.6" cy="15.1" r="2.6" /><path d="M9 9.5l10-2" /></>,
  vary: <><path d="M3 9c2-3.2 4-3.2 6 0s4 3.2 6 0 4-3.2 6 0" /><path d="M3 16c2-3.2 4-3.2 6 0s4 3.2 6 0 4-3.2 6 0" opacity=".5" /></>,
  beat: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M3.5 12h17M9.2 4.5v15M14.8 4.5v15" /><path d="M5.6 6.8h1.5v2.9H5.6zM11.2 14.3h1.6v2.9h-1.6zM16.9 6.8h1.5v2.9h-1.5z" fill="currentColor" stroke="none" /></>,
  lab: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /><path d="M12 3.5v3M20.5 12h-3M12 20.5v-3M3.5 12h3" /></>,
  ear: <><path d="M4.5 15.5V12a7.5 7.5 0 0 1 15 0v3.5" /><rect x="3.5" y="14" width="4.2" height="6.5" rx="1.6" /><rect x="16.3" y="14" width="4.2" height="6.5" rx="1.6" /></>,
  rhythm: <><ellipse cx="12" cy="10" rx="8" ry="3" /><path d="M4 10v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V10" /><path d="M7.5 3.5l3.2 5M16.5 3.5l-3.2 5" /></>,
  choir: <><circle cx="8" cy="8.2" r="2.6" /><circle cx="16" cy="8.2" r="2.6" /><path d="M3.5 19a4.5 4.5 0 0 1 9 0M11.5 19a4.5 4.5 0 0 1 9 0" /></>,
};

/** Two groups: making music, then training the ear, the beat and the voice. Arrow keys run through all seven in this order. */
const groups: Array<{ label: string; tabs: Tab[] }> = [
  { label: "创编", tabs: [
    { view: "compose", label: "旋律创编", caption: "写一段旋律", icon: ICONS.compose },
    { view: "vary", label: "旋律变奏", caption: "把主题变一变", icon: ICONS.vary },
    { view: "beat", label: "节奏创编", caption: "编一段合奏", icon: ICONS.beat },
    { view: "lab", label: "五声律坊", caption: "转一转律盘", icon: ICONS.lab },
  ] },
  { label: "训练", tabs: [
    { view: "ear", label: "听音训练", caption: "练练小耳朵", icon: ICONS.ear },
    { view: "rhythm", label: "节奏训练", caption: "拍节奏、听写节奏", icon: ICONS.rhythm },
    { view: "choir", label: "声部和鸣", caption: "唱好一个声部，再合在一起", icon: ICONS.choir },
  ] },
];
const tabs = groups.flatMap((group) => group.tabs);

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
      void import("../choir/ChoirPage").catch(() => undefined);
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
          <p><span>写旋律、变主题、编节奏、转律盘，</span><span>再练耳朵、打节奏、唱声部。</span></p>
        </div>
        <div
          className="exploration-tabs"
          role="tablist"
          aria-label="音乐探索与创造方式"
          aria-orientation="horizontal"
        >
          {groups.map((group) => (
            <div key={group.label} className="exploration-tab-group" role="none">
              <span className="exploration-group-label" aria-hidden="true">{group.label}</span>
              <div className="exploration-group-tabs" role="none">
                {group.tabs.map((tab) => {
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
                      title={tab.caption}
                      tabIndex={selected ? 0 : -1}
                      className={selected ? "is-active" : ""}
                      onClick={() => onViewChange(tab.view)}
                      onKeyDown={onTabKeyDown}
                    >
                      <svg className="exploration-tab-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{tab.icon}</svg>
                      <span className="exploration-tab-label">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </header>
      <div
        className="exploration-panel"
        id="exploration-panel"
        role="tabpanel"
        aria-labelledby={`exploration-tab-${activeView}`}
        tabIndex={-1}
      >
        <ExplorationNavContext.Provider value={onViewChange}>{children}</ExplorationNavContext.Provider>
      </div>
    </section>
  );
}
