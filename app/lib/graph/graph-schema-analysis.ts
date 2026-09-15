import { SCHEMA_CATEGORIES, schemaCategoryFor, relationVisualKind } from "../../graph-schema";
import type { GraphEntity, GraphRelationship } from "./types";

export function analyzeGraphSchema(entities: GraphEntity[], relationships: GraphRelationship[]) {
  const entityMap = new Map(entities.map(entity => [entity.id, entity]));
  const categories = SCHEMA_CATEGORIES.map(category => ({ ...category, count: 0 }));
  const categoryMap = new Map(categories.map(category => [category.key, category]));
  for (const entity of entities) categoryMap.get(schemaCategoryFor(entity.type))!.count++;
  const relationMap = new Map<string, { name: string; count: number; kind: string }>();
  const edgeMap = new Map<string, { id: string; source: string; target: string; predicate: string; count: number }>();
  let literalCount = 0;
  for (const relationship of relationships) {
    const name = relationship.label ?? relationship.predicate;
    const row = relationMap.get(name) ?? { name, count: 0, kind: relationship.provenance ? "provenance" : relationVisualKind(name) };
    row.count++; relationMap.set(name, row);
    const source = entityMap.get(relationship.subject), target = entityMap.get(relationship.objectId ?? "");
    if (!source || !target) { literalCount++; continue; }
    const sourceType = schemaCategoryFor(source.type), targetType = schemaCategoryFor(target.type);
    const id = JSON.stringify([sourceType, name, targetType]);
    const edge = edgeMap.get(id) ?? { id, source: sourceType, target: targetType, predicate: name, count: 0 };
    edge.count++; edgeMap.set(id, edge);
  }
  return { categories, relations: [...relationMap.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh")), edges: [...edgeMap.values()].sort((a, b) => b.count - a.count), literalCount };
}
