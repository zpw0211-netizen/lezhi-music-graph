// Derived reading pages: project existing canonical facts, never generate knowledge.
import { mkdir, readFile, writeFile } from "node:fs/promises";
const graph = JSON.parse(await readFile("public/data/canonical-graph.json", "utf8"));
const byEntity = new Map(graph.entities.map(entity => [entity.id, []]));
for (const relationship of graph.relationships) {
  byEntity.get(relationship.subject)?.push(relationship);
  if (relationship.objectId && relationship.objectId !== relationship.subject) byEntity.get(relationship.objectId)?.push(relationship);
}
const occurrences = new Map(graph.entities.map(entity => [entity.id, []]));
for (const item of graph.occurrences) occurrences.get(item.canonicalId)?.push(item);
await mkdir("public/data/details", { recursive: true });
for (const entity of graph.entities) {
  await writeFile(`public/data/details/${entity.id}.json`, JSON.stringify({
    version: 1, entity, occurrences: occurrences.get(entity.id),
    relationships: byEntity.get(entity.id),
  }) + "\n");
}
console.log(`ENTITY_DETAILS_BUILT ${graph.entities.length} existing canonical entities; no generated facts`);
