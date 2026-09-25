// Reports lesson melody coverage and verifies that every complete interior bar
// matches the meter. Unmetered OMR drafts are reported separately.
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

// Transpile every lesson module into a temp folder so the relative imports resolve.
const dir = mkdtempSync(path.join(tmpdir(), "melodies-"));
for (const name of readdirSync("app/lib/lesson").filter((item) => item.endsWith(".ts"))) {
  const code = ts.transpileModule(readFileSync(path.join("app/lib/lesson", name), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  writeFileSync(path.join(dir, name.replace(/\.ts$/, ".mjs")), code.replace(/from "\.\/([\w-]+)"/g, 'from "./$1.mjs"'));
}
const file = path.join(dir, "melodies.mjs");
const { MELODIES, checkMelody } = await import(pathToFileURL(file).href);

let failures = 0;
const only = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
let count = 0;
let verified = 0;
let drafts = 0;
let unmeteredDrafts = 0;
for (const [name, segments] of Object.entries(MELODIES)) {
  count += 1;
  if (only && !name.includes(only)) continue;
  if (segments.every((melody) => melody.quality === "draft")) drafts += 1;
  else verified += 1;
  segments.forEach((melody, k) => {
    if (melody.quality === "draft" && melody.meter === "节奏待核对") unmeteredDrafts += 1;
    const bad = checkMelody(melody);
    const notes = melody.bars.flat();
    const sung = notes.filter((note) => note.d && !note.tie);
    const lyrics = sung.filter((note) => note.lyric).length;
    if (bad.length) failures += 1;
    const tag = segments.length > 1 ? `[${melody.title ?? k + 1}]` : "";
    const voices = melody.voices?.length ? ` voices=${melody.voices.length + 1}` : "";
    if (bad.length || only) console.log(`${bad.length ? "✗" : "✓"} ${name}${tag} bars=${melody.bars.length} notes=${notes.length} lyrics=${lyrics}/${sung.length}${voices}${bad.length ? ` BAD ${bad.map((item) => `${item.voice}#${item.index + 1}:${item.total}`).join(" ")}` : ""}`);
    if (only && process.argv.includes("--show")) console.log(melody.bars.map((bar) => bar.map((note) => `${note.tie ? "~" : ""}${note.d}${note.o === 1 ? "'" : note.o === -1 ? "," : ""}${note.lyric ?? ""}`).join(" ")).join(" | "));
  });
}
console.log(`${count} works with melodies (${verified} verified, ${drafts} drafts; ${unmeteredDrafts} unmetered drafts), ${failures} failing excerpts`);
const graph = JSON.parse(readFileSync("public/data/music-graph.json", "utf8"));
const uniqueWorks = new Set();
for (const book of graph.books) {
  const lessonIds = new Set(book.triples.filter((triple) => triple.predicate === "包含作品").map((triple) => triple.objectId));
  const works = book.entities.filter((entity) => lessonIds.has(entity.id));
  const verified = works.filter((work) => MELODIES[work.name]?.some((item) => item.quality !== "draft"));
  const draft = works.filter((work) => MELODIES[work.name]?.length && !MELODIES[work.name].some((item) => item.quality !== "draft"));
  for (const work of works) uniqueWorks.add(work.name);
  const withoutScore = works.filter((work) => !work.media?.some((asset) => asset.kind === "score"));
  console.log(`${book.key}: ${verified.length} verified + ${draft.length} draft / ${works.length} lessons; ${withoutScore.length} without a textbook score`);
  if (process.argv.includes("--missing"))
    for (const work of works.filter((item) => !MELODIES[item.name]?.length))
      console.log(`  ${work.name}\t${work.media?.filter((asset) => asset.kind === "score").map((asset) => asset.url).join(", ") || "NO SCORE"}`);
}
console.log(`unique lesson works: ${[...uniqueWorks].filter((name) => MELODIES[name]?.length).length}/${uniqueWorks.size} with playable melodies`);
if (failures) process.exit(1);
