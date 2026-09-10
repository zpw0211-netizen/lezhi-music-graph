"use client";

import { useMemo } from "react";
import {
  buildGraphIndexes,
  shortestPaths,
} from "../lib/graph/graph-algorithms";
import type {
  GraphEntity,
  GraphRelationship,
} from "../lib/graph/types";

export function useGraphPath<E extends GraphEntity>(
  entities: E[],
  relationships: GraphRelationship[],
  startId: string,
  endId: string,
) {
  const indexes = useMemo(
    () => buildGraphIndexes(entities, relationships),
    [entities, relationships],
  );
  const paths = useMemo(
    () => (startId && endId ? shortestPaths(indexes, startId, endId) : []),
    [endId, indexes, startId],
  );
  return { indexes, paths };
}
