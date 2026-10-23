import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rename, rm, rmdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const edition = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(edition, "public", "media", "staff-score-crops");
const targetRoot = path.join(edition, "public", "media", "scores");
const assetPath = path.join(edition, "data", "wx-pep-crop-assets.json");
const assets = JSON.parse(await readFile(assetPath, "utf8"));
const inside = (root, file) => { const rel = path.relative(root, file); if (rel.startsWith("..") || path.isAbsolute(rel)) throw new Error(`Path outside ${root}: ${file}`); };
const exists = async (file) => readFile(file).then(() => true, (error) => { if (error.code === "ENOENT") return false; throw error; });
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
const bare = (value) => String(value).replace(/^《|》$/g, "").replace(/\s+/g, "");
const stableHash = (value) => { let h = 2166136261; for (const ch of String(value)) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0; return h.toString(36); };

const expected = new Set();
for (const asset of assets) {
  const source = path.join(sourceRoot, asset.bookKey, path.basename(asset.file));
  const target = path.join(targetRoot, asset.bookKey, path.basename(asset.file));
  inside(sourceRoot, source); inside(targetRoot, target);
  await mkdir(path.dirname(target), { recursive: true });
  const input = await readFile(await exists(source) ? source : target);
  if (await exists(source)) { await rm(target, { force: true }); await rename(source, target); }
  const output = await readFile(target);
  if (hash(input) !== hash(output)) throw new Error(`Move changed image: ${target}`);
  asset.file = path.relative(edition, target).split(path.sep).join("/");
  asset.bytes = output.length;
  asset.sha256 = hash(output);
  expected.add(target);
}

const walk = async (root) => { const result = []; for (const entry of await readdir(root, { withFileTypes: true }).catch((error) => { if (error.code === "ENOENT") return []; throw error; })) { const file = path.join(root, entry.name); if (entry.isDirectory()) result.push(...await walk(file)); else result.push(file); } return result; };
const removed = [];
for (const file of await walk(targetRoot)) {
  inside(targetRoot, file);
  if (!expected.has(file)) { await rm(file); removed.push(path.relative(edition, file).split(path.sep).join("/")); }
}
// Remove only empty staging directories after every source image has been moved.
for (const entry of await readdir(sourceRoot, { withFileTypes: true }).catch((error) => { if (error.code === "ENOENT") return []; throw error; })) {
  const dir = path.join(sourceRoot, entry.name); inside(sourceRoot, dir);
  if (entry.isDirectory() && !(await readdir(dir)).length) await rmdir(dir);
}
if (!(await readdir(sourceRoot).catch((error) => { if (error.code === "ENOENT") return []; throw error; })).length) await rmdir(sourceRoot).catch((error) => { if (error.code !== "ENOENT") throw error; });

const scorePages = {};
const maps = (await readdir(path.join(edition, "scripts"))).filter((file) => /^wx-pep-g\ds\d\.mjs$/.test(file));
for (const file of maps) {
  const { default: map } = await import(pathToFileURL(path.join(edition, "scripts", file)).href);
  scorePages[map.bookKey] = Object.fromEntries(map.works.filter((work) => work.staffScoreCrops.length).map((work) => [work.title, work.staffScoreCrops]));
  const modulePath = path.join(edition, "content", "textbooks", `${map.bookKey}.mjs`);
  let text = await readFile(modulePath, "utf8");
  const normalized = Object.fromEntries(Object.entries(scorePages[map.bookKey]).map(([title, crops]) => [bare(title), crops]));
  if (!/const SCORE_PAGES = .*?;\r?\nconst scoresFor/s.test(text)) throw new Error(`No score map in ${modulePath}`);
  text = text.replace(/const SCORE_PAGES = .*?;(?=\r?\nconst scoresFor)/s, `const SCORE_PAGES = ${JSON.stringify(normalized)};`);
  text = text.replace('["记谱方式", "简谱",', '["记谱方式", "五线谱",').replaceAll("（简谱）——目录级数据", "（五线谱）——目录级数据");
  await writeFile(modulePath, text, "utf8");
}
await writeFile(path.join(edition, "data", "lesson-scores.json"), `${JSON.stringify(scorePages, null, 2)}\n`, "utf8");
await writeFile(assetPath, `${JSON.stringify(assets, null, 2)}\n`, "utf8");

const referenced = new Set(); let scoreReferences = 0;
for (const key of Object.keys(scorePages)) {
  const { default: textbook } = await import(pathToFileURL(path.join(edition, "content", "textbooks", `${key}.mjs`)).href + `?activation=${Date.now()}`);
  for (const part of textbook.parts) for (const work of part.works ?? []) for (const [index] of (work.scores ?? []).entries()) {
    const file = path.join(targetRoot, key, `${stableHash(work.name)}-${index + 1}.webp`);
    if (!expected.has(file)) throw new Error(`Source refers to absent staff asset: ${key}/${work.name} -> ${file}`);
    referenced.add(file); scoreReferences += 1;
  }
}
const orphan = [...expected].filter((file) => !referenced.has(file));
if (orphan.length) throw new Error(`Staff assets not referenced by sources: ${orphan.join(", ")}`);
const auditPath = path.join(edition, "data", "score-activation-audit.json");
const previous = await exists(auditPath) ? JSON.parse(await readFile(auditPath, "utf8")) : {};
const originallyRemoved = [...new Set([...(previous.originallyRemovedJianpuImages ?? previous.removedJianpuImages ?? []), ...removed])];
const retainedPaths = new Set(assets.map((a) => a.file));
const report = { books: maps.length, imageCount: expected.size, scoreReferences, missingReferences: 0, orphanImages: 0,
  originallyRemovedJianpuImages: originallyRemoved,
  restoredFromStaffPdf: originallyRemoved.filter((file) => retainedPaths.has(file)),
  removedJianpuImages: originallyRemoved.filter((file) => !retainedPaths.has(file)),
  files: assets.map(({ file, sha256 }) => ({ file, sha256 })) };
await writeFile(path.join(edition, "data", "score-activation-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ books: maps.length, images: expected.size, scoreReferences, removedJianpuImages: removed, missingReferences: 0, orphanImages: 0 }, null, 2));
