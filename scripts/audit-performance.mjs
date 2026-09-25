import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".");
const dataRoot = path.join(root, "public", "data");
const index = JSON.parse(
  await readFile(path.join(dataRoot, "graph-index.json"), "utf8"),
);
const legacyBytes =
  (await stat(path.join(dataRoot, "music-graph.json"))).size +
  (await stat(path.join(dataRoot, "canonical-graph.json"))).size;
const indexBytes = (await stat(path.join(dataRoot, "graph-index.json"))).size;

assert(index.dataset.books.length === 6, "graph-index 未包含六册教材");
// Data may grow (textbook re-reading) but must never shrink below the last release,
// and the page index must stay in sync with canonical-graph.json.
const canonicalSource = JSON.parse(await readFile(path.join(dataRoot, "canonical-graph.json"), "utf8"));
const nodeCount = index.canonicalGraph.entities.length;
const edgeCount = index.canonicalGraph.relationships.length;
assert(nodeCount === canonicalSource.entities.length && nodeCount >= 1337, "规范实体数量发生回归");
assert(edgeCount === canonicalSource.relationships.length && edgeCount >= 4661, "规范关系数量发生回归");
assert(indexBytes / legacyBytes < 0.3, "首屏图索引没有缩减到原数据的 30% 以下");
for (const book of index.dataset.books) {
  await access(path.join(dataRoot, "details", `${book.key}.json`));
  await access(path.join(dataRoot, "evidence", `${book.key}.json`));
}

const page = await readFile(path.join(root, "app", "page.tsx"), "utf8");
const canvas = await readFile(
  path.join(root, "app", "components", "FullGraphCanvas.tsx"),
  "utf8",
);
const runtime = await readFile(
  path.join(root, "app", "graph-runtime.ts"),
  "utf8",
);
assert(page.includes('data/graph-index.json'), "页面没有读取首屏图索引");
assert(!page.includes('fetch(publicAssetUrl("data/music-graph.json"'), "首屏仍读取完整教材 JSON");
assert(!page.includes('fetch(publicAssetUrl("data/canonical-graph.json"'), "首屏仍读取完整规范图 JSON");
assert(page.includes("FullGraphCanvas"), "六册 Full Graph 未使用 Canvas Scene");
assert(canvas.includes("relationshipLabelLimit"), "关系文字 LOD 未启用");
assert(canvas.includes("edgeLayer"), "静态关系分层缓存未启用");
assert(canvas.includes("visibleNodeIds"), "视口/可见节点裁剪未启用");
for (const name of ["entityMap", "entityIdSet", "adjacencyMap", "edgeMap"]) {
  assert(runtime.includes(name), `缺少 ${name} 图索引`);
}

console.log(
  `PERFORMANCE_AUDIT_PASSED index=${indexBytes} legacy=${legacyBytes} ratio=${(
    (indexBytes / legacyBytes) *
    100
  ).toFixed(1)}% nodes=${nodeCount} edges=${edgeCount}`,
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
