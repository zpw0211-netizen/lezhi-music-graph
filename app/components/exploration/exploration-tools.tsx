"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppView } from "../../lib/app/routing";

export type ExplorationView = Extract<AppView, "compose" | "vary" | "beat" | "ear" | "lab" | "rhythm">;

/** Renders one 音乐探索与创造 tool with the app's data, so 上课模式 can open it in place. */
export const ExplorationToolsContext = createContext<((view: ExplorationView) => ReactNode) | null>(null);
export const useExplorationTools = () => useContext(ExplorationToolsContext);

/** Lets one tool open another (旋律创编 → 旋律变奏) wherever the tools are shown; outside the panel it falls back to the page address. */
export const ExplorationNavContext = createContext<((view: ExplorationView) => void) | null>(null);
export function useExplorationNav() {
  const go = useContext(ExplorationNavContext);
  return go ?? ((view: ExplorationView) => { window.location.hash = `#/${view}`; });
}
