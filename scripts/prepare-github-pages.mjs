import { access, cp, mkdir, copyFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist/client");
const siteRoot = path.join(root, "lezhi-music-graph");
const publicRoot = path.resolve("public");
const excludedGraphFiles = new Set([
  "data/canonical-graph.json",
  "data/music-graph.json",
]);

await mkdir(siteRoot, { recursive: true });
await writeFile(path.join(siteRoot, ".nojekyll"), "");

// Vinext may emit the exported route at the client root while placing hashed
// assets below basePath. Normalize both layouts into one Pages artifact.
const rootIndex = path.join(root, "index.html");
const siteIndex = path.join(siteRoot, "index.html");
if (await exists(rootIndex)) await copyFile(rootIndex, siteIndex);

if (await exists(path.join(root, "_next"))) {
  await cp(path.join(root, "_next"), path.join(siteRoot, "_next"), {
    recursive: true,
  });
}
if (await exists(path.join(root, "data"))) {
  await cp(path.join(root, "data"), path.join(siteRoot, "data"), {
    recursive: true,
    filter: (source) =>
      !excludedGraphFiles.has(
        `data/${path.relative(path.join(root, "data"), source).split(path.sep).join("/")}`,
      ),
  });
}

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

const root404 = path.join(root, "404.html");
if (await exists(root404)) {
  await copyFile(root404, path.join(siteRoot, "404.html"));
} else if (await exists(siteIndex)) {
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
