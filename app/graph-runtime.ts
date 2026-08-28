export type GraphNodeLike = { id: string };

export type GraphEdgeLike = {
  id: string;
  subject: string;
  objectId?: string | null;
};

export type AdjacentEdge<E extends GraphEdgeLike> = {
  edge: E;
  neighborId: string | null;
};

export type GraphRuntime<N extends GraphNodeLike, E extends GraphEdgeLike> = {
  entityMap: Map<string, N>;
  entityIdSet: Set<string>;
  adjacencyMap: Map<string, AdjacentEdge<E>[]>;
  edgeMap: Map<string, E>;
  degreeMap: Map<string, number>;
};

const runtimeCache = new WeakMap<object, GraphRuntime<GraphNodeLike, GraphEdgeLike>>();

export function graphRuntimeFor<
  N extends GraphNodeLike,
  E extends GraphEdgeLike,
>(owner: object, entities: N[], edges: E[]): GraphRuntime<N, E> {
  const cached = runtimeCache.get(owner);
  if (cached) return cached as GraphRuntime<N, E>;

  const entityMap = new Map(entities.map((entity) => [entity.id, entity]));
  const entityIdSet = new Set(entityMap.keys());
  const adjacencyMap = new Map<string, AdjacentEdge<E>[]>(
    entities.map((entity) => [entity.id, []]),
  );
  const edgeMap = new Map<string, E>();
  const degreeMap = new Map<string, number>();

  for (const edge of edges) {
    edgeMap.set(edge.id, edge);
    if (entityIdSet.has(edge.subject)) {
      adjacencyMap.get(edge.subject)!.push({
        edge,
        neighborId:
          edge.objectId && entityIdSet.has(edge.objectId)
            ? edge.objectId
            : null,
      });
      degreeMap.set(edge.subject, (degreeMap.get(edge.subject) ?? 0) + 1);
    }
    if (edge.objectId && entityIdSet.has(edge.objectId)) {
      adjacencyMap.get(edge.objectId)!.push({
        edge,
        neighborId: entityIdSet.has(edge.subject) ? edge.subject : null,
      });
      degreeMap.set(edge.objectId, (degreeMap.get(edge.objectId) ?? 0) + 1);
    }
  }

  const runtime = {
    entityMap,
    entityIdSet,
    adjacencyMap,
    edgeMap,
    degreeMap,
  } satisfies GraphRuntime<N, E>;
  runtimeCache.set(owner, runtime as GraphRuntime<GraphNodeLike, GraphEdgeLike>);
  return runtime;
}

export function neighborhood<E extends GraphEdgeLike>(
  runtime: GraphRuntime<GraphNodeLike, E>,
  startId: string,
  depth: 1 | 2 | 3,
  allowEdge?: (edge: E) => boolean,
) {
  const nodeIds = new Set<string>([startId]);
  const edgeIds = new Set<string>();
  let frontier = new Set<string>([startId]);

  for (let level = 0; level < depth; level += 1) {
    const next = new Set<string>();
    for (const id of frontier) {
      for (const adjacent of runtime.adjacencyMap.get(id) ?? []) {
        if (allowEdge && !allowEdge(adjacent.edge)) continue;
        edgeIds.add(adjacent.edge.id);
        if (adjacent.neighborId && !nodeIds.has(adjacent.neighborId)) {
          nodeIds.add(adjacent.neighborId);
          next.add(adjacent.neighborId);
        }
      }
    }
    frontier = next;
    if (!frontier.size) break;
  }

  return { nodeIds, edgeIds };
}
