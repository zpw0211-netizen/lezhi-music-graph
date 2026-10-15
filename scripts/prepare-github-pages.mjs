import { access, cp, mkdir, copyFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const siteRoot = path.resolve("dist/client");
const publicRoot = path.resolve("public");
const excludedGraphFiles = new Set([
  "data/canonical-graph.json",
  "data/music-graph.json",
]);

await mkdir(siteRoot, { recursive: true });
await writeFile(path.join(siteRoot, ".nojekyll"), "");

const siteIndex = path.join(siteRoot, "index.html");

// Preserve runtime public assets while omitting build-time graph inputs.
await cp(publicRoot, siteRoot, {
  recursive: true,
  filter: (source) =>
    !excludedGraphFiles.has(
      path.relative(publicRoot, source).split(path.sep).join("/"),
    ),
});

// Remove exact stale copies if this script is rerun over an older artifact.
for (const relativePath of excludedGraphFiles) {
  await rm(path.join(siteRoot, relativePath), { force: true });
}

if (!(await exists(path.join(siteRoot, "404.html"))) && (await exists(siteIndex))) {
  await copyFile(siteIndex, path.join(siteRoot, "404.html"));
}

console.log(`GitHub Pages artifact prepared: ${siteRoot}`);

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}
