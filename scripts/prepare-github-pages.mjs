import { createHash } from "node:crypto";
import { access, cp, mkdir, copyFile, readdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";

// yapu.studio layout: the entry page (portal/) sits at the domain root and links to one
// module per textbook series; the 人音版 site is this app, built with NEXT_PUBLIC_BASE_PATH=/renyin.
// With an empty base path the app is published at the root and no entry page is added.
const root = path.resolve("dist/client");
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");
const siteRoot = basePath ? path.join(root, basePath.replace(/^\/+/, "")) : root;
const publicRoot = path.resolve("public");
const portalRoot = path.resolve("portal");
const excludedGraphFiles = new Set([
  "data/canonical-graph.json",
  "data/music-graph.json",
]);
const ROOT_ICONS = ["favicon.ico", "favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];

await mkdir(siteRoot, { recursive: true });
await writeFile(path.join(root, ".nojekyll"), "");

const siteIndex = path.join(siteRoot, "index.html");
if (basePath) {
  // Vinext may emit the exported route at the client root while placing hashed
  // assets below basePath. Move everything the app needs under the base path.
  const rootIndex = path.join(root, "index.html");
  if (await exists(rootIndex)) await copyFile(rootIndex, siteIndex);
  for (const name of ["_next", "data"]) {
    const from = path.join(root, name);
    if (!(await exists(from))) continue;
    await cp(from, path.join(siteRoot, name), {
      recursive: true,
      filter: (source) => !excludedGraphFiles.has(`${name}/${path.relative(from, source).split(path.sep).join("/")}`),
    });
    await rm(from, { recursive: true, force: true });
  }
  const root404 = path.join(root, "404.html");
  if (await exists(root404)) await copyFile(root404, path.join(siteRoot, "404.html"));
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

if (!(await exists(path.join(siteRoot, "404.html"))) && (await exists(siteIndex))) {
  await copyFile(siteIndex, path.join(siteRoot, "404.html"));
}

// Offline cache for each edition (scripts/pages-sw.js). Its version is a hash of the page and the
// data files, so a rebuild with nothing changed does not make visitors download everything again.
if (basePath && (await exists(siteIndex))) {
  const hash = createHash("sha256");
  const dataRoot = path.join(siteRoot, "data");
  const files = [siteIndex, ...((await exists(dataRoot)) ? (await readdir(dataRoot, { recursive: true })).map((file) => path.join(dataRoot, file)).sort() : [])];
  for (const file of files) if (file === siteIndex || file.endsWith(".json")) hash.update(path.relative(siteRoot, file)).update(await readFile(file));
  const worker = await readFile(path.resolve("scripts/pages-sw.js"), "utf8");
  await writeFile(path.join(siteRoot, "sw.js"), worker.replace("__YAPU_BUILD__", hash.digest("hex").slice(0, 12)));
}

// The entry page is placed only by the primary edition build (a second edition sets PAGES_ENTRY=0).
if (basePath && process.env.PAGES_ENTRY !== "0" && (await exists(portalRoot))) {
  // Clear whatever the app export left at the root, then place the entry page there.
  const keep = new Set([".nojekyll", basePath.replace(/^\/+/, "")]);
  for (const entry of await readdir(root)) if (!keep.has(entry)) await rm(path.join(root, entry), { recursive: true, force: true });
  await cp(portalRoot, root, { recursive: true });
  for (const icon of ROOT_ICONS) await copyFile(path.join(publicRoot, icon), path.join(root, icon));
  // Unknown paths show the entry page; its script forwards old #/ links to the 人音版 site.
  await copyFile(path.join(root, "index.html"), path.join(root, "404.html"));
}

console.log(`GitHub Pages artifact prepared: ${siteRoot}${basePath ? ` (entry page at ${root})` : ""}`);

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}
