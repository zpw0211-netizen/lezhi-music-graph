import { readFile } from "node:fs/promises";
import { PUBLISHED_BOOK_KEYS } from "../data/books.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [
  packageText,
  explorerState,
  explorer,
  rendererBoundary,
  sidebar,
  sigmaScene,
  algorithms,
  pathFinder,
  graphIndexText,
] =
  await Promise.all([
    read("package.json"),
    read("app/components/explorer/useGraphExplorer.ts"),
    read("app/components/explorer/GraphExplorer.tsx"),
    read("app/components/graph/GraphRendererBoundary.tsx"),
    read("app/components/graph/GraphSidebar.tsx"),
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
requireText(
  explorerState,
  'useState<FullGraphRenderer>("sigma")',
  "Sigma is not the default full-graph renderer",
);
requireText(
  rendererBoundary,
  "static getDerivedStateFromError(): State",
  "Canvas error boundary does not catch renderer errors",
);
requireText(
  rendererBoundary,
  "this.state.failed ? this.props.fallback : this.props.children",
  "Canvas fallback boundary does not render its fallback",
);
requireText(
  explorer,
  "<GraphRendererBoundary fallback=",
  "Graph renderer is not wrapped by the Canvas fallback boundary",
);
requireText(
  explorerState,
  'useState<GraphPerspective>("comprehensive")',
  "graph perspective state is missing",
);
requireText(explorerState, "const handlePerspective = useCallback", "graph perspective action is missing");
requireText(sidebar, "图谱观察方式", "graph perspective controls are missing");
requireText(explorer, "perspective={explorer.graphPerspective}", "graph perspective state is not connected to the UI");
requireText(
  explorer,
  'import { GraphPathFinder } from "../graph/GraphPathFinder"',
  "path finder is not imported by the graph explorer",
);
requireText(explorer, "<GraphPathFinder", "path finder is not rendered by the graph explorer");
requireText(
  explorerState,
  "const canonicalEntityBySearchKey = useMemo(() => {",
  "canonical search mapping is missing",
);
requireText(
  explorerState,
  "canonicalEntityBySearchKey.get(searchKey(entity))",
  "canonical search mapping is not used to resolve entities",
);
requireText(
  explorer,
  "canonicalEntityBySearchKey.get(",
  "graph explorer does not consume the canonical search mapping",
);
requireText(sigmaScene, "nodeReducer", "Bloom focus node reducer is missing");
requireText(sigmaScene, "edgeReducer", "edge focus reducer is missing");
requireText(sigmaScene, "...data", "Sigma reducers must preserve coordinates and program type");
requireText(sigmaScene, "graph={initialGraph}", "Sigma renderer lifetime must remain stable");
requireText(sigmaScene, "sigma.setGraph(dataGraph)", "filtered graph replacement is missing");
requireText(sigmaScene, "focusSelectionToken", "explicit selection camera requests are missing");
requireText(sigmaScene, "onClearFocus()", "background focus reset is missing");
requireText(sigmaScene, "Math.round(r * alpha)", "WebGL alpha must be premultiplied");
requireText(sigmaScene, "enableEdgeEvents: true", "edge hover events are disabled");
requireText(sigmaScene, "doubleClickNode", "double-click expansion is missing");
requireText(sigmaScene, "rightClickNode", "node context menu is missing");
requireText(algorithms, "shortestPaths", "shortest path algorithm is missing");
requireText(algorithms, "adjacencyMap", "Map-based graph adjacency is missing");
requireText(pathFinder, "等长路径", "equal shortest path switching is missing");

const canonicalNodes = graphIndex.canonicalGraph?.entities?.length ?? 0;
const canonicalEdges = graphIndex.canonicalGraph?.relationships?.length ?? 0;
const books = graphIndex.dataset?.books?.length ?? 0;
if (books !== PUBLISHED_BOOK_KEYS.length) failures.push(`expected ${PUBLISHED_BOOK_KEYS.length} published textbooks, found ${books}`);
// Data may grow with textbook re-reading but must not shrink below the last release.
if (canonicalNodes < 1337) failures.push(`canonical node regression: ${canonicalNodes}`);
if (canonicalEdges < 4661) failures.push(`canonical relationship regression: ${canonicalEdges}`);

if (failures.length) {
  console.error(`V3_EXPLORER_AUDIT_FAILED ${failures.length}`);
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `V3_EXPLORER_AUDIT_PASSED books=${books} nodes=${canonicalNodes} edges=${canonicalEdges} renderer=Sigma_WebGL fallback=Canvas_2D`,
);
