"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildGraphIndexes, shortestPaths } from "../lib/graph/graph-algorithms";
import { validateGraphActions, type GraphAction } from "../lib/graph/graph-actions";
import type { RagGraph } from "../lib/ai/graph-rag";
import type { GraphPath } from "../lib/graph/types";

export type ActionHandlers = { begin: () => void; focus: (ids: string[], isolate: boolean) => void; entityTypes: (types: string[]) => void; relations: (types: string[]) => void; books: (keys: string[]) => void; perspective: (value: Extract<GraphAction, { type: "switch_perspective" }>["perspective"]) => void; path: (source: string, target: string, path?: GraphPath) => void; expand: (ids: string[], edges: string[]) => void; highlightNodes: (ids: string[]) => void; highlightEdges: (ids: string[]) => void };
export function useGraphActions(graph: RagGraph | null, handlers: ActionHandlers) {
  const ref = useRef(handlers);
  useEffect(() => { ref.current = handlers; });
  const [notice, setNotice] = useState("");
  const indexes = useMemo(() => graph ? buildGraphIndexes(graph.entities, graph.relationships) : null, [graph]);
  const execute = useCallback((input: unknown) => {
    if (!graph || !indexes) return false;
    const check = validateGraphActions(input, graph);
    if (!check.valid) { setNotice(check.error); return false; }
    const h = ref.current; h.begin();
    for (const action of check.actions) {
      switch (action.type) {
        case "focus_entities": h.focus(action.entityIds, action.isolate ?? false); break;
        case "filter_entity_types": h.entityTypes(action.entityTypes); break;
        case "filter_relationship_types": h.relations(action.relationshipTypes); break;
        case "filter_books": h.books(action.bookKeys); break;
        case "switch_perspective": h.perspective(action.perspective); break;
        case "highlight_entities": h.highlightNodes(action.entityIds); break;
        case "highlight_relationships": h.highlightEdges(action.relationshipIds); break;
        case "find_path": h.path(action.sourceId, action.targetId, shortestPaths(indexes, action.sourceId, action.targetId)[0]); break;
        case "expand_neighbors": {
          const ids = new Set([action.entityId]), edges = new Set<string>(); let frontier = [action.entityId];
          for (let depth = 0; depth < action.hops; depth++) { const next: string[] = []; for (const id of frontier) for (const item of indexes.adjacencyMap.get(id) ?? []) { edges.add(item.edge.id); if (!ids.has(item.neighborId)) { ids.add(item.neighborId); next.push(item.neighborId); } } frontier = next; }
          h.expand([...ids], [...edges]); break;
        }
      }
    }
    setNotice(`已执行 ${check.actions.length} 项图谱动作 · 知识数据未修改`); return true;
  }, [graph, indexes]);
  return { execute, notice };
}
