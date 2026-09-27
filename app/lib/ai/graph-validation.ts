import type { RagGraph } from "./graph-rag";

export type ValidatedGraphIndex = { canonicalGraph: RagGraph };
export type GraphIndexValidation =
  | { ok: true; graphIndex: ValidatedGraphIndex }
  | { ok: false; reason: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function validateGraphIndex(value: unknown): GraphIndexValidation {
  if (!isRecord(value)) return { ok: false, reason: "graph index must be an object" };
  const canonicalGraph = value.canonicalGraph;
  if (!isRecord(canonicalGraph)) return { ok: false, reason: "canonicalGraph must be an object" };
  if (!Array.isArray(canonicalGraph.entities) || canonicalGraph.entities.length === 0) {
    return { ok: false, reason: "canonicalGraph.entities must be a non-empty array" };
  }
  if (!Array.isArray(canonicalGraph.relationships) || canonicalGraph.relationships.length === 0) {
    return { ok: false, reason: "canonicalGraph.relationships must be a non-empty array" };
  }
  if (!Array.isArray(canonicalGraph.books)) {
    return { ok: false, reason: "canonicalGraph.books must be an array" };
  }

  const entityIds = new Set<string>();
  for (const entity of canonicalGraph.entities) {
    if (!isRecord(entity) || typeof entity.id !== "string" || !entity.id.trim()) {
      return { ok: false, reason: "canonicalGraph.entities contains an entity without an id" };
    }
    if (entityIds.has(entity.id)) return { ok: false, reason: "canonicalGraph.entities contains duplicate ids" };
    entityIds.add(entity.id);
  }

  for (const relation of canonicalGraph.relationships) {
    if (!isRecord(relation) || typeof relation.subject !== "string" || !entityIds.has(relation.subject)) {
      return { ok: false, reason: "canonicalGraph.relationships contains an unknown or missing subject" };
    }
    const objectId = relation.objectId;
    if (typeof objectId === "string" && objectId.length > 0) {
      if (!entityIds.has(objectId)) return { ok: false, reason: "canonicalGraph.relationships contains an unknown objectId" };
    } else if (objectId == null || objectId === "") {
      if (typeof relation.literal !== "string" || !relation.literal.length) {
        return { ok: false, reason: "canonicalGraph.relationships has an empty objectId without a literal" };
      }
    } else {
      return { ok: false, reason: "canonicalGraph.relationships contains an invalid objectId" };
    }
  }

  return {
    ok: true,
    graphIndex: { canonicalGraph: canonicalGraph as unknown as RagGraph },
  };
}
