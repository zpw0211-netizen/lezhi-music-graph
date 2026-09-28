"use client";

import { useLayoutEffect, useRef } from "react";

type SlidingIndicatorProps = {
  activeKey: string | number;
  orientation?: "horizontal" | "vertical" | "sidebar";
};

export function SlidingIndicator({ activeKey, orientation = "horizontal" }: SlidingIndicatorProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const indicator = ref.current;
    const host = indicator?.parentElement;
    if (!indicator || !host) return;

    const measure = () => {
      const active = host.querySelector<HTMLElement>(
        ':scope > [aria-selected="true"], :scope > [aria-pressed="true"], :scope > .active',
      );
      if (!active) {
        indicator.style.opacity = "0";
        return;
      }

      const hostRect = host.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const isVertical = orientation === "vertical"
        || (orientation === "sidebar" && !window.matchMedia("(max-width: 760px)").matches);
      const x = activeRect.left - hostRect.left;
      const y = activeRect.top - hostRect.top;
      const width = isVertical ? 3 : activeRect.width;
      const height = isVertical ? activeRect.height : 2;
      const indicatorY = isVertical ? y : y + activeRect.height - height;

      indicator.style.width = `${width}px`;
      indicator.style.height = `${height}px`;
      indicator.style.transform = `translate3d(${isVertical ? 0 : x}px, ${indicatorY}px, 0)`;
      indicator.style.opacity = "1";
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeKey, orientation]);

  return <span ref={ref} className={`motion-tab-indicator motion-tab-indicator--${orientation === "vertical" ? "vertical" : "horizontal"}`} aria-hidden="true" />;
}
