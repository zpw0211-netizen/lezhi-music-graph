"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppView } from "../../lib/app/routing";

export type ExplorationView = Extract<AppView, "compose" | "ear" | "lab" | "rhythm">;

/** Renders one 音乐探索与创造 tool with the app's data, so 上课模式 can open it in place. */
export const ExplorationToolsContext = createContext<((view: ExplorationView) => ReactNode) | null>(null);
export const useExplorationTools = () => useContext(ExplorationToolsContext);
