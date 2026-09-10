import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const graph = JSON.parse(
  await readFile(path.join(root, "public", "data", "graph-index.json"), "utf8"),
);
const pageSource = await readFile(path.join(root, "app", "page.tsx"), "utf8");
const canvasSource = await readFile(
  path.join(root, "app", "components", "FullGraphCanvas.tsx"),
  "utf8",
);
const layoutSource = await readFile(
  path.join(root, "scripts", "lib", "full-graph-layout.mjs"),
  "utf8",
);
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));

const entities = graph.canonicalGraph.entities;
const knowledgeEntities = entities.filter((entity) => entity.type !== "教材");
const relationships = graph.canonicalGraph.relationships;
const center = { x: 1200, y: 750 };
const radius = (entity) =>
  Math.hypot(entity.layout.x - center.x, entity.layout.y - center.y);
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const top40 = knowledgeEntities.filter((entity) => entity.visualRank <= 40);
const peripheral = knowledgeEntities.filter((entity) => entity.visualRank > 1000);
const xs = knowledgeEntities.map((entity) => entity.layout.x);
const ys = knowledgeEntities.map((entity) => entity.layout.y);
const width = Math.max(...xs) - Math.min(...xs);
const height = Math.max(...ys) - Math.min(...ys);
const sectors = Array.from({ length: 12 }, () => 0);
for (const entity of knowledgeEntities) {
  const angle = Math.atan2(entity.layout.y - center.y, entity.layout.x - center.x);
  const index = Math.min(11, Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 12));
  sectors[index] += 1;
}

const failures = [];
if (graph.version !== "2.3-force-directed-index") failures.push("V2.3 graph index version missing");
if (entities.length < 1300 || relationships.length < 4600)
  failures.push("canonical graph data was reduced");
if (
  knowledgeEntities.some(
    (entity) =>
      !entity.layouts?.knowledge ||
      !entity.layouts?.textbook ||
      !entity.layouts?.schema ||
      entity.layout.x !== entity.layouts.knowledge.x ||
      entity.layout.y !== entity.layouts.knowledge.y,
  )
)
  failures.push("three-layout data or default knowledge layout is incomplete");
if (knowledgeEntities.some((entity) => entity.visualRank == null || entity.visualImportance == null))
  failures.push("visual importance encoding is incomplete");
const topRadius = mean(top40.map(radius));
const peripheralRadius = mean(peripheral.map(radius));
if (!(topRadius < peripheralRadius * 0.65))
  failures.push(`structural core is not central enough: ${topRadius}/${peripheralRadius}`);
const shapeRatio = width / height;
if (shapeRatio < 1.15 || shapeRatio > 1.85)
  failures.push(`knowledge cloud shape ratio out of range: ${shapeRatio}`);
if (sectors.filter((count) => count >= 35).length < 10)
  failures.push(`knowledge cloud has sparse angular sectors: ${sectors.join(",")}`);
if (graph.canonicalGraph.performance?.algorithm !== "ForceAtlas2-precomputed")
  failures.push("ForceAtlas2 build metadata missing");
if (!layoutSource.includes("forceAtlas2.assign") || !layoutSource.includes("noverlap.assign"))
  failures.push("ForceAtlas2 / collision layout implementation missing");
for (const label of [
  "知识网络",
  "Knowledge Network",
  "教材分簇",
  "Textbook Clusters",
  "知识模式",
  "Schema",
  "显示教材来源",
])
  if (!pageSource.includes(label)) failures.push(`layout UI missing: ${label}`);
if (!pageSource.includes('useState<FullGraphLayoutMode>("knowledge")'))
  failures.push("knowledge network is not the default layout");
if (!pageSource.includes("const [showTextbookSources, setShowTextbookSources] = useState(false)"))
  failures.push("textbook source layer is not hidden by default");
if (!canvasSource.includes("selectionFocus") || !canvasSource.includes("rankLimit"))
  failures.push("Neo4j focus or label LOD logic missing");
if (
  !(packageJson.dependencies?.graphology || packageJson.devDependencies?.graphology) ||
  !(packageJson.dependencies?.["graphology-layout-forceatlas2"] ||
    packageJson.devDependencies?.["graphology-layout-forceatlas2"])
)
  failures.push("build-time force layout dependencies missing");
if (packageJson.dependencies?.["@neo4j-nvl/base"] || packageJson.dependencies?.["@neo4j-nvl/react"])
  failures.push("unused NVL runtime dependencies should not ship");

if (failures.length) {
  console.error(`V23_FULL_GRAPH_AUDIT_FAILED\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(
  `V23_FULL_GRAPH_AUDIT_PASSED nodes=${entities.length} edges=${relationships.length} forceNodes=${graph.canonicalGraph.performance.knowledgeNodeCount} forceEdges=${graph.canonicalGraph.performance.knowledgeRelationshipCount} top40Radius=${topRadius.toFixed(1)} peripheralRadius=${peripheralRadius.toFixed(1)} shape=${shapeRatio.toFixed(2)} sectors=${sectors.join("/")}`,
);
