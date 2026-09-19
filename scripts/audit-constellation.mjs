import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
const canonical = JSON.parse(await readFile("public/data/canonical-graph.json", "utf8"));
const compiled = await build({ entryPoints: ["app/lib/graph/constellation-style.ts"], bundle: true, write: false, format: "esm", platform: "neutral" });
const styles = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
assert.deepEqual([1, .6, .3, .1].map(styles.semanticZoomTier), [0, 1, 2, 3]);
assert(styles.LABEL_BUDGETS.every(n => n < 300));
assert.equal(styles.relationFamily({ predicate: "COMPOSER" }), "creator");
assert.equal(styles.relationFamily({ predicate: "所属民族" }), "culture-region");
assert.equal(styles.relationFamily({ predicate: "节拍" }), "music-feature");
assert.equal(styles.relationFamily({ predicate: "任何关系", provenance: true }), "textbook");
for (const entity of canonical.entities) {
  const detail = JSON.parse(await readFile(`public/data/details/${entity.id}.json`, "utf8"));
  assert.deepEqual(detail.entity, entity, `Details modified entity ${entity.id}`);
  assert.deepEqual(detail.relationships, canonical.relationships.filter(edge => edge.subject === entity.id || edge.objectId === entity.id));
  assert.deepEqual(detail.occurrences, canonical.occurrences.filter(item => item.canonicalId === entity.id));
}
assert.equal(canonical.entities.length, 1337); assert.equal(canonical.relationships.length, 4661);
assert.equal(canonical.quality.canonical.isolatedNodeCount, 0); assert.equal(canonical.quality.canonical.danglingRelationshipCount, 0);
console.log("CONSTELLATION_AUDIT_PASSED details=1337 all_facts_identical=true nodes=1337 relationships=4661 isolated=0 dangling=0 tiers=4");
