// Verifies hand-transcribed lesson melodies: every full bar must match the meter,
// and each sung note should carry a lyric. Usage: node scripts/check-melodies.mjs
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const source = readFileSync("app/lib/lesson/melodies.ts", "utf8");
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const file = path.join(mkdtempSync(path.join(tmpdir(), "melodies-")), "melodies.mjs");
writeFileSync(file, output);
const { MELODIES, checkMelody } = await import(pathToFileURL(file).href);

let failures = 0;
for (const [name, melody] of Object.entries(MELODIES)) {
  const bad = checkMelody(melody);
  const notes = melody.bars.flat();
  const sung = notes.filter((note) => note.d && !note.tie);
  const lyrics = sung.filter((note) => note.lyric).length;
  if (bad.length) failures += 1;
  console.log(`${bad.length ? "✗" : "✓"} ${name} bars=${melody.bars.length} notes=${notes.length} lyrics=${lyrics}/${sung.length}${bad.length ? ` BAD ${bad.map((item) => `#${item.index + 1}:${item.total}`).join(" ")}` : ""}`);
}
if (failures) process.exit(1);
