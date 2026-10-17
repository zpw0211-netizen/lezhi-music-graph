// Reports lesson melody coverage and verifies that every complete interior bar
// matches the meter. Unmetered OMR drafts are reported separately.
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

// Transpile every lesson module into a temp folder so the relative imports resolve.
const tempRoot = path.resolve(".tmp");
mkdirSync(tempRoot, { recursive: true });
const dir = mkdtempSync(path.join(tempRoot, "melodies-"));
for (const name of readdirSync("app/lib/lesson").filter((item) => item.endsWith(".ts"))) {
  const code = ts.transpileModule(readFileSync(path.join("app/lib/lesson", name), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  writeFileSync(path.join(dir, name.replace(/\.ts$/, ".mjs")), code.replace(/from "\.\/([\w-]+)"/g, 'from "./$1.mjs"'));
}
const file = path.join(dir, "melodies.mjs");
const { MELODIES, BOOK_MELODIES, PEP_MELODY_BOOKS, checkMelody } = await import(pathToFileURL(file).href);

let failures = 0;
const only = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const requestedBook = only && Object.hasOwn(BOOK_MELODIES, only) ? only : undefined;
const nameFilter = requestedBook ? undefined : only;
let count = 0;
let verified = 0;
let drafts = 0;
let unmeteredDrafts = 0;
// A work printed in several books keeps each book's version (see BOOK_MELODIES); check those copies as well.
const extraCopies = Object.entries(BOOK_MELODIES).flatMap(([bookKey, book]) => Object.entries(book)
  .filter(([name, segments]) => !segments.every((melody) => MELODIES[name]?.includes(melody)))
  .map(([name, segments]) => [`${name}（${bookKey}）`, segments]));
const checks = requestedBook
  ? Object.entries(BOOK_MELODIES[requestedBook])
  : [...Object.entries(MELODIES), ...extraCopies];
for (const [name, segments] of checks) {
  if (nameFilter && !name.includes(nameFilter)) continue;
  count += 1;
  if (segments.every((melody) => melody.quality === "draft")) drafts += 1;
  else verified += 1;
  segments.forEach((melody, k) => {
    if (melody.quality === "draft" && melody.meter === "节奏待核对") unmeteredDrafts += 1;
    const bad = checkMelody(melody);
    const notes = melody.bars.flat();
    const sung = notes.filter((note) => note.d && !note.tie && !note.slur);
    const lyrics = sung.filter((note) => note.lyric).length;
    if (bad.length) failures += 1;
    const tag = segments.length > 1 ? `[${melody.title ?? k + 1}]` : "";
    const voices = melody.voices?.length ? ` voices=${melody.voices.length + 1}` : "";
    if (bad.length || only) console.log(`${bad.length ? "✗" : "✓"} ${name}${tag} bars=${melody.bars.length} notes=${notes.length} lyrics=${lyrics}/${sung.length}${voices}${bad.length ? ` BAD ${bad.map((item) => `${item.voice}#${item.index + 1}:${item.total}`).join(" ")}` : ""}`);
    if (only && process.argv.includes("--show")) console.log(melody.bars.map((bar) => bar.map((note) => `${note.tie ? "~" : ""}${note.d}${note.o ? (note.o > 0 ? "'" : ",").repeat(Math.abs(note.o)) : ""}${note.lyric ?? ""}`).join(" ")).join(" | "));
  });
}

// 人教版 titles must match a work in that book's own 人教版 source (editions/renjiao), never the 人音版 catalogue.
const pepSourceText = (bookKey) => readFileSync(`editions/renjiao/content/textbooks/${bookKey}.mjs`, "utf8");
const pepBookTitles = new Map(PEP_MELODY_BOOKS.map((book) => [book.key, book.title]));
const pepBooksToCheck = requestedBook
  ? (requestedBook.startsWith("pep-") ? [requestedBook] : [])
  : Object.keys(BOOK_MELODIES).filter((bookKey) => bookKey.startsWith("pep-"));
for (const bookKey of pepBooksToCheck) {
  const bookTitle = pepBookTitles.get(bookKey);
  const source = pepSourceText(bookKey);
  for (const [name, segments] of Object.entries(BOOK_MELODIES[bookKey])) {
    if (!source.includes(`"${name}"`)) {
      console.log(`✗ ${bookKey}: ${name} is not a work title in editions/renjiao/content/textbooks/${bookKey}.mjs`);
      failures += 1;
    }
    for (const melody of segments) {
      const hasBookAndPage = melody.source?.startsWith(`据人教版${bookTitle}第`)
        && /第\s*[^页]+\s*页/.test(melody.source);
      if (!hasBookAndPage) {
        console.log(`✗ ${bookKey}: ${name} source does not identify ${bookTitle} and its printed page`);
        failures += 1;
      }
      const meterEntries = melody.meter.split("、").filter(Boolean);
      if (meterEntries.length > 1 && meterEntries.length !== melody.bars.length) {
        console.log(`✗ ${bookKey}: ${name} has ${meterEntries.length} meter entries for ${melody.bars.length} bars; mixed meter must be recorded per bar`);
        failures += 1;
      }
    }
  }
}
console.log(`${count} works with melodies (${verified} verified, ${drafts} drafts; ${unmeteredDrafts} unmetered drafts), ${failures} failing excerpts`);
if (!requestedBook && !nameFilter) {
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
}
rmSync(dir, { recursive: true, force: true });
if (failures) process.exit(1);
