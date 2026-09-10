import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [packageText, page, sigmaScene, algorithms, pathFinder, graphIndexText] =
  await Promise.all([
    read("package.json"),
    read("app/page.tsx"),
    read("app/components/graph/SigmaGraphScene.tsx"),
    read("app/lib/graph/graph-algorithms.ts"),
    read("app/components/graph/GraphPathFinder.tsx"),
    read("public/data/graph-index.json"),
  ]);

const pkg = JSON.parse(packageText);
const graphIndex = JSON.parse(graphIndexText);
const failures = [];
const requireText = (source, token, label) => {
  if (!source.includes(token)) failures.push(label);
};

if (!pkg.dependencies?.sigma || !pkg.dependencies?.["@react-sigma/core"])
  failures.push("Sigma WebGL dependencies are missing");
requireText(page, 'useState<FullGraphRenderer>("sigma")', "Sigma is not the default full-graph renderer");
requireText(page, "GraphRendererBoundary", "Canvas fallback boundary is missing");
requireText(page, "graphPerspective", "graph perspectives are missing");
requireText(page, "GraphPathFinder", "path finder is missing");
requireText(page, "canonicalEntityBySearchKey", "canonical search mapping is missing");
requireText(sigmaScene, "nodeReducer", "Bloom focus node reducer is missing");
requireText(sigmaScene, "edgeReducer", "edge focus reducer is missing");
requireText(sigmaScene, "enableEdgeEvents: true", "edge hover events are disabled");
requireText(sigmaScene, "doubleClickNode", "double-click expansion is missing");
requireText(sigmaScene, "rightClickNode", "node context menu is missing");
requireText(algorithms, "shortestPaths", "shortest path algorithm is missing");
requireText(algorithms, "adjacencyMap", "Map-based graph adjacency is missing");
requireText(pathFinder, "等长路径", "equal shortest path switching is missing");

const canonicalNodes = graphIndex.canonicalGraph?.entities?.length ?? 0;
const canonicalEdges = graphIndex.canonicalGraph?.relationships?.length ?? 0;
const books = graphIndex.dataset?.books?.length ?? 0;
if (books !== 6) failures.push(`expected 6 textbooks, found ${books}`);
if (canonicalNodes < 1000) failures.push(`canonical node regression: ${canonicalNodes}`);
if (canonicalEdges < 3000) failures.push(`canonical relationship regression: ${canonicalEdges}`);

if (failures.length) {
  console.error(`V3_EXPLORER_AUDIT_FAILED ${failures.length}`);
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `V3_EXPLORER_AUDIT_PASSED books=${books} nodes=${canonicalNodes} edges=${canonicalEdges} renderer=Sigma_WebGL fallback=Canvas_2D`,
);
