// Builds a second textbook edition (editions/<name>/) with this app's code and publishes it into
// dist/client<basePath> next to the primary edition. Run after the primary Pages build:
//
//   node scripts/build-edition.mjs renjiao
//
// The edition folder mirrors the repo layout and is laid over a scratch copy of the repo:
//   editions/<name>/data/books.json            registry with its own "edition" block (label, press, basePath)
//   editions/<name>/content/textbooks/*.mjs    hand-read textbook sources (same format as content/textbooks)
//   editions/<name>/public/art/…               covers and unit illustrations
// The primary edition's book data, covers and score crops are removed from the copy first, so nothing leaks across.
// If the edition has no published book yet, nothing is built.
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { writeScoreSizes } from "./lib/score-sizes.mjs";

const name = process.argv[2];
if (!name) throw new Error("用法：node scripts/build-edition.mjs <edition>");
const root = process.cwd();
const editionRoot = path.join(root, "editions", name);
const registry = JSON.parse(await readFile(path.join(editionRoot, "data", "books.json"), "utf8"));
const basePath = registry.edition?.basePath;
if (!basePath) throw new Error(`editions/${name}/data/books.json 缺少 edition.basePath`);
const published = registry.books.filter((book) => book.published);
if (!published.length) {
  console.log(`EDITION_SKIPPED ${name}: 还没有已发布的册目`);
  process.exit(0);
}

const work = path.resolve(process.env.EDITION_WORKDIR ?? path.join(root, ".edition-build", name));
await rm(work, { recursive: true, force: true });
await mkdir(work, { recursive: true });

// 1. Scratch copy of the repo: tracked plus untracked-but-not-ignored files (no node_modules, dist, .git).
const files = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" })
  .split("\0").filter((file) => file && !file.startsWith("editions/") && existsSync(path.join(root, file)));
for (const file of files) await cp(path.join(root, file), path.join(work, file), { force: true });
await symlink(path.join(root, "node_modules"), path.join(work, "node_modules"), process.platform === "win32" ? "junction" : "dir");

// 2. Remove the primary edition's per-book data and art, then lay the edition over the copy.
const primary = JSON.parse(await readFile(path.join(root, "data", "books.json"), "utf8"));
for (const { key } of primary.books) {
  await rm(path.join(work, "public", "art", `${key}.webp`), { force: true });
  await rm(path.join(work, "public", "media", "scores", key), { recursive: true, force: true });
  for (const dir of ["books", "evidence"]) await rm(path.join(work, "public", "data", dir, `${key}.json`), { force: true });
}
const unitArtDir = path.join(work, "public", "art", "units");
for (const file of existsSync(unitArtDir) ? await readdir(unitArtDir) : [])
  if (primary.books.some(({ key }) => file.startsWith(`${key}-u`))) await rm(path.join(unitArtDir, file), { force: true });
await rm(path.join(work, "public", "data", "details"), { recursive: true, force: true });
await cp(editionRoot, work, { recursive: true, force: true });
await cp(
  path.join(editionRoot, "data", "research-facts.mjs"),
  path.join(work, "data", "renjiao-research-facts.mjs"),
  { force: true },
);
// 各版本的谱例图路径相同，尺寸表按本版本自己的图重写。
writeScoreSizes(work);

// 3. Start from an empty dataset that keeps the shared ontology and policies.
const datasetPath = path.join(work, "public", "data", "music-graph.json");
const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
await writeFile(datasetPath, JSON.stringify({ ...dataset, version: `${name}-${new Date().toISOString().slice(0, 10)}`, generatedAt: new Date().toISOString(), books: [] }));

// 4. Build the edition's data and site with its own base path; no entry page (the primary build owns it).
const env = { ...process.env, GITHUB_PAGES: "true", NEXT_PUBLIC_STATIC_EXPORT: "1", NEXT_PUBLIC_BASE_PATH: basePath, PAGES_ENTRY: "0" };
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (command, args) => execFileSync(command, args, { cwd: work, env, stdio: "inherit", shell: process.platform === "win32" });
run(process.execPath, ["scripts/build-textbook-source.mjs"]);
run(process.execPath, ["scripts/build-canonical-graph.mjs"]);
run(npm, ["run", "build"]);
run(process.execPath, ["scripts/prepare-github-pages.mjs"]);
run(npm, ["run", "-s", "quality:pages"]);

// 5. Publish next to the primary edition.
const relative = basePath.replace(/^\/+/, "");
const target = path.join(root, "dist", "client", relative);
await rm(target, { recursive: true, force: true });
await cp(path.join(work, "dist", "client", relative), target, { recursive: true });
console.log(`EDITION_BUILT ${name} → dist/client/${relative} (${published.length} 册)`);
