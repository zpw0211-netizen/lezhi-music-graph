"use client";
import { useEffect, useState } from "react";
import { graphRuntimeFor } from "../graph-runtime";
import { publicAssetUrl } from "../lib/app/assets";
import type { CanonicalGraph, Dataset, GraphIndexPayload } from "../lib/app/types";

export type GraphIndexState = {
  status: "loading" | "ready" | "error";
  dataset: Dataset | null;
  canonicalGraph: CanonicalGraph | null;
  generatedAt?: string;
};

/** Loads the six-textbook graph index once. */
export function useGraphIndex() {
  const [state, setState] = useState<GraphIndexState>({ status: "loading", dataset: null, canonicalGraph: null });
  useEffect(() => {
    let active = true;
    const load = async () => {
      const response = await fetch(publicAssetUrl("data/graph-index.json"));
      if (!response.ok) throw new Error("graph-index unavailable");
      const index = (await response.json()) as GraphIndexPayload;
      if (!index.dataset.books?.length) throw new Error("graph-index is empty");
      for (const book of index.dataset.books) graphRuntimeFor(book, book.entities, book.triples);
      if (active)
        setState({ status: "ready", dataset: index.dataset, canonicalGraph: index.canonicalGraph, generatedAt: index.generatedAt });
    };
    load().catch(() => {
      if (active) setState((previous) => ({ ...previous, status: "error" }));
    });
    return () => {
      active = false;
    };
  }, []);
  return state;
}
