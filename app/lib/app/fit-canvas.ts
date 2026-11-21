"use client";

import { useEffect, type RefObject } from "react";

/**
 * 探索页的一屏画布（见 ExplorationPage）：画布底边以下就要往下滑了。
 * apply(k) 把内容缩到 k 倍（k 从 1 往下试），直到 stage 的内容落在画布底边以内；
 * 不在画布里（手机）时用 apply(1) 还原。
 */
export function fitToCanvas(stage: HTMLElement, apply: (k: number) => void, minK = 0.5) {
  apply(1);
  const canvas = stage.closest<HTMLElement>(".exploration-canvas");
  if (!canvas || !canvas.style.minHeight) return;
  const box = canvas.getBoundingClientRect();
  const scale = box.height / (canvas.offsetHeight || 1) || 1;
  const limit = box.top + (parseFloat(canvas.style.minHeight) - 12) * scale;
  const padding = parseFloat(getComputedStyle(stage).paddingBottom) * scale;
  const bottom = () => Math.max(...[...stage.children].map((child) => child.getBoundingClientRect().bottom)) + padding;
  let k = 1;
  for (let i = 0; i < 30 && bottom() > limit && k > minK; i += 1) {
    k = Math.max(minK, k * 0.93);
    apply(k);
  }
}

/** 把一组谱子的字号一起缩小（字号还原成样式表里的值再量）。 */
export function shrinkToCanvas(stage: HTMLElement, scores: HTMLElement[], minSize = 18) {
  scores.forEach((score) => { score.style.fontSize = ""; });
  if (!scores.length) return;
  const base = parseFloat(getComputedStyle(scores[0]).fontSize);
  fitToCanvas(stage, (k) => scores.forEach((score) => { score.style.fontSize = k === 1 ? "" : `${base * k}px`; }), minSize / base);
}

/** 内容或屏幕大小变了就重新缩一次。 */
export function useFitToCanvas(stageRef: RefObject<HTMLElement | null>, run: (stage: HTMLElement) => void, deps: unknown[]) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const go = () => run(stage);
    go();
    let timer = 0;
    const later = () => { window.clearTimeout(timer); timer = window.setTimeout(go, 90); };
    window.addEventListener("resize", later);
    document.addEventListener("fullscreenchange", later);
    // 画布刚量好（第一次缩放、进出投屏）时再来一遍。
    const settle = window.setTimeout(go, 140);
    const observer = new MutationObserver(later);
    const canvas = stage.closest(".exploration-canvas");
    if (canvas) observer.observe(canvas, { attributes: true, attributeFilter: ["style"] });
    return () => { window.clearTimeout(timer); window.clearTimeout(settle); observer.disconnect(); window.removeEventListener("resize", later); document.removeEventListener("fullscreenchange", later); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are the caller's content keys
  }, deps);
}

export function useShrinkToCanvas(stageRef: RefObject<HTMLElement | null>, selector: string, deps: unknown[], minSize = 18) {
  useFitToCanvas(stageRef, (stage) => shrinkToCanvas(stage, [...stage.querySelectorAll<HTMLElement>(selector)], minSize), deps);
}

/**
 * 一屏放不下的长谱子放在一个框里：播放时跟着正在唱的音走，
 * 当前音跑出框外，就把它那一行滚到框的上面三分之一处，不用手去拖。
 */
export function useFollowActive(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let timer = 0;
    const follow = () => {
      const box = root.querySelector<HTMLElement>(".melody-score");
      if (!box || box.scrollHeight <= box.clientHeight + 4) return;
      const active = box.querySelector<Element>(".melody-note.is-active, .melody-head-cell.is-active, .staff-note.is-active");
      if (!active) return;
      const outer = box.getBoundingClientRect();
      const scale = outer.height / (box.offsetHeight || 1) || 1;
      const note = active.getBoundingClientRect();
      if (note.top >= outer.top + 8 * scale && note.bottom <= outer.bottom - 8 * scale) return;
      box.scrollTo({ top: box.scrollTop + (note.top - outer.top) / scale - box.clientHeight / 3, behavior: "smooth" });
    };
    const observer = new MutationObserver(() => { window.clearTimeout(timer); timer = window.setTimeout(follow, 40); });
    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => { window.clearTimeout(timer); observer.disconnect(); };
  }, [rootRef]);
}
