import type {
  GraphEntity,
  GraphPath,
  GraphRelationship,
  GraphPerspective,
} from "./types";

export type GraphAdjacencyItem = {
  edge: GraphRelationship;
  neighborId: string;
};

export type GraphIndexes<E extends GraphEntity = GraphEntity> = {
  entityMap: Map<string, E>;
  adjacencyMap: Map<string, GraphAdjacencyItem[]>;
  edgeMap: Map<string, GraphRelationship>;
};

export function buildGraphIndexes<E extends GraphEntity>(
  entities: E[],
  relationships: GraphRelationship[],
): GraphIndexes<E> {
  const entityMap = new Map(entities.map((entity) => [entity.id, entity]));
  const adjacencyMap = new Map<string, GraphAdjacencyItem[]>(
    entities.map((entity) => [entity.id, []]),
  );
  const edgeMap = new Map<string, GraphRelationship>();
  for (const edge of relationships) {
    edgeMap.set(edge.id, edge);
    if (!edge.objectId || !entityMap.has(edge.subject) || !entityMap.has(edge.objectId))
      continue;
    adjacencyMap.get(edge.subject)?.push({ edge, neighborId: edge.objectId });
    adjacencyMap.get(edge.objectId)?.push({ edge, neighborId: edge.subject });
  }
  return { entityMap, adjacencyMap, edgeMap };
}

export function focusNeighborhood(
  indexes: GraphIndexes,
  selectedId?: string | null,
  visibility?: { nodes: Set<string>; edges: Set<string> },
) {
  const depthByNode = new Map<string, 0 | 1 | 2>();
  const directEdges = new Set<string>();
  const secondaryEdges = new Set<string>();
  if (!selectedId || !indexes.entityMap.has(selectedId) || (visibility && !visibility.nodes.has(selectedId)))
    return { depthByNode, directEdges, secondaryEdges };

  depthByNode.set(selectedId, 0);
  for (const item of indexes.adjacencyMap.get(selectedId) ?? []) {
    if (visibility && (!visibility.nodes.has(item.neighborId) || !visibility.edges.has(item.edge.id))) continue;
    depthByNode.set(item.neighborId, 1);
    directEdges.add(item.edge.id);
  }
  for (const [nodeId, depth] of depthByNode) {
    if (depth !== 1) continue;
    for (const item of indexes.adjacencyMap.get(nodeId) ?? []) {
      if (visibility && (!visibility.nodes.has(item.neighborId) || !visibility.edges.has(item.edge.id))) continue;
      if (!depthByNode.has(item.neighborId)) depthByNode.set(item.neighborId, 2);
      if (!directEdges.has(item.edge.id)) secondaryEdges.add(item.edge.id);
    }
  }
  return { depthByNode, directEdges, secondaryEdges };
}

export function shortestPaths(
  indexes: GraphIndexes,
  startId: string,
  endId: string,
  limit = 6,
): GraphPath[] {
  if (!indexes.entityMap.has(startId) || !indexes.entityMap.has(endId)) return [];
  if (startId === endId) return [{ nodeIds: [startId], edgeIds: [], steps: [] }];

  const distance = new Map<string, number>([[startId, 0]]);
  const parents = new Map<
    string,
    Array<{ nodeId: string; edge: GraphRelationship }>
  >();
  const queue = [startId];
  let cursor = 0;
  let targetDistance = Number.POSITIVE_INFINITY;

  while (cursor < queue.length) {
    const current = queue[cursor++];
    const currentDistance = distance.get(current) ?? 0;
    if (currentDistance >= targetDistance) continue;
    for (const item of indexes.adjacencyMap.get(current) ?? []) {
      const nextDistance = currentDistance + 1;
      const knownDistance = distance.get(item.neighborId);
      if (knownDistance == null) {
        distance.set(item.neighborId, nextDistance);
        parents.set(item.neighborId, [{ nodeId: current, edge: item.edge }]);
        queue.push(item.neighborId);
        if (item.neighborId === endId) targetDistance = nextDistance;
      } else if (knownDistance === nextDistance) {
        parents.get(item.neighborId)?.push({ nodeId: current, edge: item.edge });
      }
    }
  }
  if (!distance.has(endId)) return [];

  const results: GraphPath[] = [];
  const walk = (
    nodeId: string,
    reversedNodes: string[],
    reversedEdges: GraphRelationship[],
  ) => {
    if (results.length >= limit) return;
    if (nodeId === startId) {
      const nodeIds = [startId, ...reversedNodes.slice().reverse()];
      const edges = reversedEdges.slice().reverse();
      results.push({
        nodeIds,
        edgeIds: edges.map((edge) => edge.id),
        steps: edges.map((edge, index) => ({
          edgeId: edge.id,
          predicate: edge.label ?? edge.predicate,
          sourceId: nodeIds[index],
          targetId: nodeIds[index + 1],
        })),
      });
      return;
    }
    for (const parent of parents.get(nodeId) ?? [])
      walk(parent.nodeId, [...reversedNodes, nodeId], [...reversedEdges, parent.edge]);
  };
  walk(endId, [], []);
  return results;
}

const PROGRESSION = new Set([
  "PREREQUISITE_OF",
  "REVISITS",
  "DEEPENS",
  "EXTENDS",
  "APPLIES_TO",
  "RELATED_TO",
  "前置于",
  "复现",
  "深化",
  "扩展",
  "应用于",
  "相关",
]);

export function relationshipMatchesPerspective(
  edge: GraphRelationship,
  perspective: GraphPerspective,
) {
  const label = edge.label ?? edge.predicate;
  if (perspective === "comprehensive") return true;
  if (perspective === "textbook")
    return Boolean(edge.provenance || /教材|单元|收录|出现|归属|包含/.test(label));
  if (perspective === "progression")
    return PROGRESSION.has(edge.predicate) || PROGRESSION.has(label);
  return !edge.provenance && !/教材|单元顺序|教材归属/.test(label);
}
