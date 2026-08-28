import { readFile } from "node:fs/promises";

const graph = JSON.parse(
  await readFile(
    new URL("../public/data/canonical-graph.json", import.meta.url),
    "utf8",
  ),
);
const quality = JSON.parse(
  await readFile(
    new URL("../public/data/graph-quality.json", import.meta.url),
    "utf8",
  ),
);
const page = await readFile(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);
const schema = await readFile(
  new URL("../app/graph-schema.ts", import.meta.url),
  "utf8",
);
const failures = [];
const entityIds = new Set(graph.entities.map((entity) => entity.id));
const canonicalKeys = new Set();

for (const entity of graph.entities) {
  if (!entity.canonicalKey)
    failures.push(`entity without canonicalKey: ${entity.id}`);
  if (canonicalKeys.has(entity.canonicalKey))
    failures.push(`duplicate canonicalKey: ${entity.canonicalKey}`);
  canonicalKeys.add(entity.canonicalKey);
  if (!entity.occurrenceIds?.length)
    failures.push(`entity without occurrence: ${entity.id}`);
}

const occurrenceIds = new Set(
  graph.occurrences.map((occurrence) => occurrence.id),
);
const occurrenceRelationKeys = new Set();
const occurrenceRelationCountByOccurrence = new Map();
for (const relationship of graph.occurrenceRelationships ?? []) {
  const key = `${relationship.subject}|${relationship.predicate}|${relationship.objectId}`;
  if (occurrenceRelationKeys.has(key))
    failures.push(`duplicate occurrence relationship: ${key}`);
  occurrenceRelationKeys.add(key);
  if (relationship.predicate === "REFERS_TO") {
    if (!occurrenceIds.has(relationship.subject))
      failures.push(`REFERS_TO missing occurrence: ${relationship.id}`);
    if (!entityIds.has(relationship.objectId))
      failures.push(`REFERS_TO missing canonical entity: ${relationship.id}`);
    occurrenceRelationCountByOccurrence.set(
      relationship.subject,
      (occurrenceRelationCountByOccurrence.get(relationship.subject) ?? 0) + 1,
    );
  }
}
for (const occurrence of graph.occurrences) {
  if (!entityIds.has(occurrence.canonicalId))
    failures.push(`occurrence missing canonical entity: ${occurrence.id}`);
  if (!occurrence.textbook || !occurrence.sourceEntityId)
    failures.push(`occurrence missing provenance: ${occurrence.id}`);
  if (occurrenceRelationCountByOccurrence.get(occurrence.id) !== 1)
    failures.push(`occurrence must have one REFERS_TO: ${occurrence.id}`);
}

const relationshipKeys = new Set();
for (const relationship of graph.relationships) {
  if (!entityIds.has(relationship.subject))
    failures.push(`relationship missing subject: ${relationship.id}`);
  if (relationship.objectId && !entityIds.has(relationship.objectId))
    failures.push(`relationship missing object: ${relationship.id}`);
  const key = `${relationship.subject}|${relationship.predicate}|${relationship.objectId ?? relationship.literal ?? ""}`;
  if (relationshipKeys.has(key))
    failures.push(`duplicate relationship: ${key}`);
  relationshipKeys.add(key);
  if (!relationship.sources?.length)
    failures.push(`relationship without evidence source: ${relationship.id}`);
  for (const source of relationship.sources ?? []) {
    if (source.occurrenceId && !occurrenceIds.has(source.occurrenceId))
      failures.push(
        `relationship missing occurrence source: ${relationship.id}`,
      );
  }
}

if (quality.canonical.isolatedNodeCount !== 0)
  failures.push(
    `canonical isolated nodes: ${quality.canonical.isolatedNodeCount}`,
  );
if (quality.canonical.danglingRelationshipCount !== 0)
  failures.push(
    `canonical dangling relationships: ${quality.canonical.danglingRelationshipCount}`,
  );
if (quality.canonical.connectedComponentCount !== 1)
  failures.push(
    `canonical graph components: ${quality.canonical.connectedComponentCount}`,
  );
if (
  quality.canonical.largestConnectedComponentNodeCount !== graph.entities.length
)
  failures.push("largest component does not contain every canonical entity");
if (quality.canonical.sharedEntityCount < 1)
  failures.push("no shared cross-textbook entities found");

for (const marker of [
  "全部关系",
  "跨册关系",
  "教材归属",
  "知识关系",
  "展开全部 3 跳邻居",
  "按关系类型展开",
  "撤销展开",
  "收起子图",
  "graph-minimap",
  "cross-book-inspector-summary",
]) {
  if (!page.includes(marker)) failures.push(`missing UI marker: ${marker}`);
}

const forbiddenAutoRelations = new Set([
  "PREREQUISITE_OF",
  "REVISITS",
  "DEEPENS",
  "EXTENDS",
  "APPLIES_TO",
]);
for (const relation of [...forbiddenAutoRelations, "RELATED_TO"]) {
  if (!schema.includes(`key: "${relation}"`))
    failures.push(`missing reserved progression relationship: ${relation}`);
}
for (const relationship of graph.relationships) {
  if (
    forbiddenAutoRelations.has(relationship.predicate) &&
    !(relationship.sources ?? []).some(
      (source) => source.evidence?.length || source.pdfPage != null,
    )
  )
    failures.push(`unsupported progression relationship: ${relationship.id}`);
}

if (failures.length) {
  console.error(`V21_GRAPH_AUDIT_FAILED ${failures.length}`);
  console.error(failures.slice(0, 40).join("\n"));
  process.exit(1);
}

console.log(
  `V21_GRAPH_AUDIT_PASSED raw=${quality.raw.totalNodes}/${quality.raw.totalRelationships} ` +
    `canonical=${quality.canonical.totalNodes}/${quality.canonical.totalRelationships} ` +
    `isolated=${quality.canonical.isolatedNodeCount} dangling=${quality.canonical.danglingRelationshipCount} ` +
    `duplicates_fused=${quality.raw.duplicateEntityRecordCount} components=${quality.canonical.connectedComponentCount} ` +
    `largest=${quality.canonical.largestConnectedComponentNodeCount}`,
);
