import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const compile = async entry => { const output = await build({ entryPoints: [entry], bundle: true, write: false, format: "esm", platform: "neutral" }); return import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`); };
const { planGraphQuery, validateGraphActions, bookKeysForQuestion } = await compile("app/lib/graph/graph-actions.ts");
const { analyzeGraphSchema } = await compile("app/lib/graph/graph-schema-analysis.ts");
const { pendingCandidates } = await compile("app/lib/ai/pending-candidates.ts");
const { filterGraphEntities, DEFAULT_PROPERTIES } = await compile("app/hooks/useGraphFilters.ts");
const { buildGraphIndexes, shortestPaths, focusNeighborhood } = await compile("app/lib/graph/graph-algorithms.ts");
const { canonicalGraph: graph } = JSON.parse(await readFile("public/data/graph-index.json", "utf8"));
const original = JSON.stringify(graph);
assert.equal(graph.entities.length, 1337); assert.equal(graph.relationships.length, 4661);
const examples = ["只看音乐人物", "只看作曲关系", "显示八年级音乐作品", "只看蒙古族音乐", "查找《牧歌》和蒙古族的关系", "查找进行曲相关作品", "显示节奏相关知识"];
const required = ["filter_entity_types", "filter_relationship_types", "filter_books", "focus_entities", "find_path", "focus_entities", "focus_entities"];
for (let i = 0; i < examples.length; i++) {
  const plan = planGraphQuery(examples[i], graph); assert(plan.actions.some(a => a.type === required[i]), examples[i]);
  assert(validateGraphActions(plan.actions, graph).valid, examples[i]);
  console.log(examples[i], JSON.stringify(plan.actions.map(a => ({ type: a.type, size: a.entityIds?.length, types: a.entityTypes ?? a.relationshipTypes ?? a.bookKeys }))));
}
assert.equal(bookKeysForQuestion("七至九年级节奏怎么发展？", graph).length, 0);
assert.equal(bookKeysForQuestion("八年级", graph).length, 2);
assert(!validateGraphActions([{ type: "execute", code: "document.body.remove()" }], graph).valid);
assert(!validateGraphActions([{ type: "focus_entities", entityIds: ["missing"] }], graph).valid);
assert(!validateGraphActions([{ type: "highlight_entities", entityIds: [graph.entities[0].id], extra: true }], graph).valid);
const schema = analyzeGraphSchema(graph.entities, graph.relationships);
assert(validateGraphActions([
  { type: "focus_entities", entityIds: [graph.entities[0].id], isolate: true },
  { type: "filter_entity_types", entityTypes: ["work"] },
  { type: "filter_relationship_types", relationshipTypes: [graph.relationships[0].label ?? graph.relationships[0].predicate] },
  { type: "filter_books", bookKeys: [graph.books[0].key] },
  { type: "find_path", sourceId: graph.entities[0].id, targetId: graph.entities[1].id },
  { type: "expand_neighbors", entityId: graph.entities[0].id, hops: 2 },
  { type: "switch_perspective", perspective: "progression" },
  { type: "highlight_entities", entityIds: [graph.entities[0].id] },
  { type: "highlight_relationships", relationshipIds: [graph.relationships[0].id] },
], graph).valid);
assert.equal(schema.categories.reduce((sum, c) => sum + c.count, 0), 1337);
assert.equal(schema.relations.reduce((sum, r) => sum + r.count, 0), 4661);
assert.equal(schema.edges.reduce((sum, r) => sum + r.count, 0) + schema.literalCount, 4661);
assert.equal(schema.categories.length, 10);
assert(schema.relations.every((r, i) => !i || schema.relations[i - 1].count >= r.count));
const combined = filterGraphEntities(graph.entities, graph.relationships, graph.books, { ...DEFAULT_PROPERTIES, grades: ["8"], entityType: "work", keyword: "蒙古族" }, null, null);
const mongolWorks = filterGraphEntities(graph.entities, graph.relationships, graph.books, { ...DEFAULT_PROPERTIES, entityType: "work", keyword: "蒙古族" }, null, null);
const expectedCombined = [...mongolWorks].filter(id => graph.entities.find(e => e.id === id).bookKeys.some(k => k[1] === "8"));
assert.deepEqual([...combined].sort(), expectedCombined.sort());
assert(mongolWorks.size > 0);
const nonEmptyCombined = filterGraphEntities(graph.entities, graph.relationships, graph.books, { ...DEFAULT_PROPERTIES, grades: ["8"], entityType: "work", keyword: "节奏" }, null, null);
assert(nonEmptyCombined.size > 0);
const indexes = buildGraphIndexes(graph.entities, graph.relationships);
const march = graph.entities.find(e => e.name === "进行曲"), guard = graph.entities.find(e => e.name.includes("保卫黄河")), xian = graph.entities.find(e => e.name === "冼星海");
assert.equal(shortestPaths(indexes, guard.id, xian.id)[0].edgeIds.length, 1);
const edge = indexes.adjacencyMap.get(march.id)[0].edge;
const filteredFocus = focusNeighborhood(indexes, march.id, { nodes: new Set([march.id]), edges: new Set([edge.id]) });
assert.equal(filteredFocus.depthByNode.size, 1);
assert.equal(pendingCandidates([{ subject: "虚构" }]).length, 0);
assert.equal(pendingCandidates([{ subject: "节奏", predicate: "相关", object: "节拍", source: "测试来源", evidence: "测试证据", page: 2, confidence: .8, reason: "仅校验展示合同", status: "pending" }]).length, 1);
assert.equal(JSON.stringify(graph), original, "Canonical graph was mutated");
const sigma = await readFile("app/components/graph/SigmaGraphScene.tsx", "utf8");
assert(sigma.includes("}, [nodes, relationships])")); assert(sigma.includes("hidden: !visibleNodeIds.has(node)")); assert(sigma.includes("hidden: !visibleRelationshipIds.has(edge)"));
console.log(`GRAPH_EXPLORER_AUDIT_PASSED canonical=1337/4661 categories=10 schemaEdges=${schema.edges.length} literalAttributes=${schema.literalCount} combined=${combined.size} examples=7 dataUnchanged=true`);
