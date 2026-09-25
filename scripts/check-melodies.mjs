// Verifies hand-transcribed lesson melodies: every full bar must match the meter,
// and each sung note should carry a lyric. Usage: node scripts/check-melodies.mjs
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
const only = process.argv[2];
let count = 0;
for (const [name, segments] of Object.entries(MELODIES)) {
  count += 1;
  if (only && !name.includes(only)) continue;
  segments.forEach((melody, k) => {
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
console.log(`${count} works with melodies, ${failures} failing excerpts`);
const graph = JSON.parse(readFileSync("public/data/music-graph.json", "utf8"));
const uniqueWorks = new Set();
for (const book of graph.books) {
  const lessonIds = new Set(book.triples.filter((triple) => triple.predicate === "包含作品").map((triple) => triple.objectId));
  const works = book.entities.filter((entity) => lessonIds.has(entity.id));
  const covered = works.filter((work) => MELODIES[work.name]?.length);
  for (const work of works) uniqueWorks.add(work.name);
  const withoutScore = works.filter((work) => !work.media?.some((asset) => asset.kind === "score"));
  console.log(`${book.key}: ${covered.length}/${works.length} lessons playable; ${withoutScore.length} without a textbook score`);
  if (process.argv.includes("--missing"))
    for (const work of works.filter((item) => !MELODIES[item.name]?.length))
      console.log(`  ${work.name}\t${work.media?.filter((asset) => asset.kind === "score").map((asset) => asset.url).join(", ") || "NO SCORE"}`);
}
console.log(`unique lesson works: ${[...uniqueWorks].filter((name) => MELODIES[name]?.length).length}/${uniqueWorks.size} with playable melodies`);
if (failures) process.exit(1);
