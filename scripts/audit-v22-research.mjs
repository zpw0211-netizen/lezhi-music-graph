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
const paletteSource = await readFile(
  path.join(root, "app", "semantic-palette.ts"),
  "utf8",
);

const entities = graph.canonicalGraph.entities;
let nearestTotal = 0;
let minimumDistance = Number.POSITIVE_INFINITY;
for (let index = 0; index < entities.length; index += 1) {
  let nearest = Number.POSITIVE_INFINITY;
  for (let other = 0; other < entities.length; other += 1) {
    if (index === other) continue;
    const distance = Math.hypot(
      entities[index].layout.x - entities[other].layout.x,
      entities[index].layout.y - entities[other].layout.y,
    );
    nearest = Math.min(nearest, distance);
  }
  nearestTotal += nearest;
  minimumDistance = Math.min(minimumDistance, nearest);
}
const averageNearestDistance = nearestTotal / entities.length;
const textbookEntities = entities.filter((entity) => entity.type === "教材");
let minimumTextbookDistance = Number.POSITIVE_INFINITY;
for (let index = 0; index < textbookEntities.length; index += 1)
  for (let other = index + 1; other < textbookEntities.length; other += 1)
    minimumTextbookDistance = Math.min(
      minimumTextbookDistance,
      Math.hypot(
        textbookEntities[index].layout.x - textbookEntities[other].layout.x,
        textbookEntities[index].layout.y - textbookEntities[other].layout.y,
      ),
    );

const quality = graph.canonicalGraph.quality.canonical;
const failures = [];
if (entities.length < 1000) failures.push("full graph data was reduced");
if (graph.canonicalGraph.relationships.length < 3000)
  failures.push("full graph relationships were reduced");
if (averageNearestDistance < 25)
  failures.push(`average nearest-node distance too small: ${averageNearestDistance}`);
if (minimumDistance < 16)
  failures.push(`minimum node distance too small: ${minimumDistance}`);
if (minimumTextbookDistance < 520)
  failures.push(`textbook clusters too close: ${minimumTextbookDistance}`);
if ((quality.evidenceCoverageRate ?? 0) < 0.9)
  failures.push("evidence coverage missing or too low");
if (!pageSource.includes("useState(false)"))
  failures.push("default motion is not disabled");
if (!canvasSource.includes('renderMode: motionEnabled ? "animated" : "on-demand"'))
  failures.push("on-demand Canvas render mode is missing");
for (const key of [
  "textbook",
  "work",
  "person",
  "instrument",
  "genre",
  "element",
  "theory",
  "culture",
  "activity",
  "goal",
])
  if (!paletteSource.includes(`${key}:`)) failures.push(`palette key missing: ${key}`);
if (!pageSource.includes("ResearchAnalysis")) failures.push("research analysis missing");
if (!pageSource.includes("【图谱事实】") || !pageSource.includes("【AI辅助解释】"))
  failures.push("assistant evidence boundary missing");

if (failures.length) {
  console.error(`V22_RESEARCH_AUDIT_FAILED\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(
  `V22_RESEARCH_AUDIT_PASSED nodes=${entities.length} edges=${graph.canonicalGraph.relationships.length} avgNearest=${averageNearestDistance.toFixed(1)} minNearest=${minimumDistance.toFixed(1)} textbookGap=${minimumTextbookDistance.toFixed(1)} evidence=${((quality.evidenceCoverageRate ?? 0) * 100).toFixed(1)}%`,
);

