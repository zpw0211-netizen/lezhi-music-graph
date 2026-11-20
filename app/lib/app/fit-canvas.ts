"use client";

import { useEffect, type RefObject } from "react";

/**
 * 探索页的一屏画布（见 ExplorationPage）：画布底边以下就要往下滑了。
 * 把 stage 里的谱子字号一点点缩小，直到 stage 的内容落在画布底边以内。
 * 不在画布里（手机）时把字号还原。
 */
export function shrinkToCanvas(stage: HTMLElement, scores: HTMLElement[], minSize = 18) {
  scores.forEach((score) => { score.style.fontSize = ""; });
  const canvas = stage.closest<HTMLElement>(".exploration-canvas");
  if (!canvas || !canvas.style.minHeight || !scores.length) return;
  const box = canvas.getBoundingClientRect();
  const scale = box.height / (canvas.offsetHeight || 1) || 1;
  const limit = box.top + (parseFloat(canvas.style.minHeight) - 12) * scale;
  const padding = parseFloat(getComputedStyle(stage).paddingBottom) * scale;
  const bottom = () => Math.max(...[...stage.children].map((child) => child.getBoundingClientRect().bottom)) + padding;
  let size = parseFloat(getComputedStyle(scores[0]).fontSize);
  for (let i = 0; i < 30 && bottom() > limit && size > minSize; i += 1) {
    size *= 0.93;
    scores.forEach((score) => { score.style.fontSize = `${size}px`; });
  }
}

/** 内容或屏幕大小变了就重新缩一次。 */
export function useShrinkToCanvas(stageRef: RefObject<HTMLElement | null>, selector: string, deps: unknown[], minSize = 18) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const run = () => shrinkToCanvas(stage, [...stage.querySelectorAll<HTMLElement>(selector)], minSize);
    run();
    let timer = 0;
    const later = () => { window.clearTimeout(timer); timer = window.setTimeout(run, 90); };
    window.addEventListener("resize", later);
    document.addEventListener("fullscreenchange", later);
    // 画布刚量好（第一次缩放）时再来一遍。
    const settle = window.setTimeout(run, 120);
    return () => { window.clearTimeout(timer); window.clearTimeout(settle); window.removeEventListener("resize", later); document.removeEventListener("fullscreenchange", later); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are the caller's content keys
  }, deps);
}
