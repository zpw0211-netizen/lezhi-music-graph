import { access, cp, mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist/client");
const siteRoot = path.join(root, "lezhi-music-graph");
const publicRoot = path.resolve("public");

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
  });
}

// Preserve every public asset (data, favicon, social card and future media)
// without maintaining a separate public frontend.
await cp(publicRoot, siteRoot, { recursive: true });

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
