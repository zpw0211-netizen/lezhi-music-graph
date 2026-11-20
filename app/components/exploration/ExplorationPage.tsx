"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { publicAssetUrl } from "../../lib/app/assets";
import { preloadPianoSamples } from "../../lib/lesson/piano-sampler";
import type { AppView } from "../../lib/app/routing";
import { ExplorationNavContext } from "./exploration-tools";

type ExplorationView = Extract<AppView, "compose" | "vary" | "beat" | "ear" | "lab" | "rhythm" | "choir" | "puzzle">;

type Tab = { view: ExplorationView; label: string; caption: string; icon: ReactNode };

/** Line icons drawn on a 24-unit grid in currentColor, so they follow the tab's colour. */
const ICONS: Record<ExplorationView, ReactNode> = {
  compose: <><path d="M9 17.5V5.5l10-2v11.5" /><circle cx="6.6" cy="17.6" r="2.6" /><circle cx="16.6" cy="15.1" r="2.6" /><path d="M9 9.5l10-2" /></>,
  vary: <><path d="M3 9c2-3.2 4-3.2 6 0s4 3.2 6 0 4-3.2 6 0" /><path d="M3 16c2-3.2 4-3.2 6 0s4 3.2 6 0 4-3.2 6 0" opacity=".5" /></>,
  beat: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M3.5 12h17M9.2 4.5v15M14.8 4.5v15" /><path d="M5.6 6.8h1.5v2.9H5.6zM11.2 14.3h1.6v2.9h-1.6zM16.9 6.8h1.5v2.9h-1.5z" fill="currentColor" stroke="none" /></>,
  lab: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /><path d="M12 3.5v3M20.5 12h-3M12 20.5v-3M3.5 12h3" /></>,
  ear: <><path d="M4.5 15.5V12a7.5 7.5 0 0 1 15 0v3.5" /><rect x="3.5" y="14" width="4.2" height="6.5" rx="1.6" /><rect x="16.3" y="14" width="4.2" height="6.5" rx="1.6" /></>,
  rhythm: <><ellipse cx="12" cy="10" rx="8" ry="3" /><path d="M4 10v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V10" /><path d="M7.5 3.5l3.2 5M16.5 3.5l-3.2 5" /></>,
  puzzle: <><path d="M4 4.5h6.5v3a1.8 1.8 0 1 0 3.6 0v-3H20v6.5h-3a1.8 1.8 0 1 0 0 3.6h3V20h-6.5" /><path d="M4 4.5V20h9.5" /><path d="M7.5 13.5l2 2 3.5-4" /></>,
  choir: <><circle cx="8" cy="8.2" r="2.6" /><circle cx="16" cy="8.2" r="2.6" /><path d="M3.5 19a4.5 4.5 0 0 1 9 0M11.5 19a4.5 4.5 0 0 1 9 0" /></>,
};

/** Two groups: making music, then training the ear, the beat and the voice. Arrow keys run through all eight in this order. */
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
    { view: "puzzle", label: "乐句拼图", caption: "把打乱的乐句排回原样", icon: ICONS.puzzle },
    { view: "choir", label: "声部和鸣", caption: "唱好一个声部，再合在一起", icon: ICONS.choir },
  ] },
];
const tabs = groups.flatMap((group) => group.tabs);

/**
 * 每个工具都按同一块画布排版：1256 × 600。画布按屏幕等比缩放，正好放进标题栏下面剩下的地方，
 * 所以教室里的电脑不用往下滑；投屏时铺满整个屏幕，八个工具放大的比例一样，不会时大时小。
 * 宽屏多出来的宽度留给工具自己铺开（画布变宽，不变高）。手机上不缩放，照常往下排。
 */
const CANVAS_W = 1256;
const CANVAS_H = 600;
type Fit = { scale: number; width: number; minHeight: number };

/** 页面在哪个盒子里滚动：探索页在 .workspace 里，上课模式在工具浮层里，投屏时在探索页自己里。 */
function scrollBoxOf(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (overflow === "auto" || overflow === "scroll") return node;
  }
  return null;
}

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
  const shellRef = useRef<HTMLElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit | null>(null);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [projecting, setProjecting] = useState(false);
  /** 投屏时是不是我们把整个页面切成了全屏（上课模式本来就全屏时不动它）。 */
  const ownFullscreen = useRef(false);
  /** 五声律坊保持原来的大律盘：不进一屏画布，照常往下排。 */
  const unscaled = activeView === "lab";

  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    // 同步量：后台标签页里 requestAnimationFrame 不跑，第一次就会量不到。
    const measure = () => {
      const width = outer.clientWidth;
      if (unscaled || window.innerWidth <= 880 || !width) { setFit(null); return; }
      const box = scrollBoxOf(outer);
      const boxTop = box ? box.getBoundingClientRect().top - box.scrollTop : -window.scrollY;
      const top = outer.getBoundingClientRect().top - boxTop;
      const height = box ? box.clientHeight : window.innerHeight;
      const avail = Math.max(360, height - top - (projecting ? 10 : 16));
      const scale = Math.min(1.9, Math.max(0.6, Math.min(width / CANVAS_W, avail / CANVAS_H)));
      const next = { scale, width: width / scale, minHeight: avail / scale };
      setFit((current) => (current && Math.abs(current.scale - next.scale) < 1e-3 && Math.abs(current.width - next.width) < 0.5 && Math.abs(current.minHeight - next.minHeight) < 0.5 ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [projecting, unscaled]);

  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const observer = new ResizeObserver(() => setCanvasHeight(inner.offsetHeight));
    observer.observe(inner);
    setCanvasHeight(inner.offsetHeight);
    return () => observer.disconnect();
  }, []);

  // 投屏：探索页铺满屏幕（顺手把浏览器切成全屏）；按 Esc 或退出全屏就收回来。
  useEffect(() => {
    if (!projecting) return;
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape" && !document.fullscreenElement) setProjecting(false); };
    const onFullscreen = () => { if (!document.fullscreenElement && ownFullscreen.current) { ownFullscreen.current = false; setProjecting(false); } };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("fullscreenchange", onFullscreen); };
  }, [projecting]);
  const toggleProjection = () => {
    if (projecting) {
      setProjecting(false);
      if (ownFullscreen.current && document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
      ownFullscreen.current = false;
      return;
    }
    setProjecting(true);
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      ownFullscreen.current = true;
      void document.documentElement.requestFullscreen().catch(() => { ownFullscreen.current = false; });
    }
  };

  // Once the open tab has had its turn, fetch the other tools (code, art, piano samples) in the background:
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
      void import("../puzzle/PuzzlePage").catch(() => undefined);
      new Image().src = publicAssetUrl("art/rhythm/drum.webp");
      // Almost every tool plays the piano: fetch its 1.6 MB now so the first 播放 does not wait for it (skipped on data saver).
      if (!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) preloadPianoSamples();
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
    <section ref={shellRef} className={`exploration-shell${projecting ? " is-projecting" : ""}${fit ? " is-fitted" : ""}`} aria-labelledby="exploration-title">
      <header className="exploration-heading">
        <div className="exploration-intro">
          <p className="exploration-kicker">芽谱 · 探索空间</p>
          <h1 id="exploration-title">音乐探索与创造</h1>
          <p><span>写旋律、变主题、编节奏、转律盘，</span><span>再练耳朵、打节奏、拼乐句、唱声部。</span></p>
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
          <button type="button" className="exploration-project" onClick={toggleProjection} aria-pressed={projecting} title={projecting ? "按 Esc 也能退出" : "铺满整个屏幕，给全班看"}>
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {projecting ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
            </svg>
            <span>{projecting ? "退出投屏" : "投屏"}</span>
          </button>
        </div>
      </header>
      <div
        className="exploration-panel"
        id="exploration-panel"
        role="tabpanel"
        aria-labelledby={`exploration-tab-${activeView}`}
        tabIndex={-1}
      >
        <div ref={outerRef} className="exploration-fit" style={fit ? { height: canvasHeight * fit.scale } : undefined}>
          <div ref={innerRef} className="exploration-canvas" style={fit ? { width: fit.width, minHeight: fit.minHeight, transform: `scale(${fit.scale})` } as CSSProperties : undefined}>
            <ExplorationNavContext.Provider value={onViewChange}>{children}</ExplorationNavContext.Provider>
          </div>
        </div>
      </div>
    </section>
  );
}
