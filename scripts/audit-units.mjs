import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_ROOT = path.join(ROOT, "public", "data");
const BOOK_KEYS = ["g7s1", "g7s2", "g8s1", "g8s2", "g9s1", "g9s2"];
const errors = [];
const fail = (message) => errors.push(message);

const unitsPath = path.join(DATA_ROOT, "units.json");
if (!existsSync(unitsPath)) {
  console.error(`UNITS_AUDIT_FAILED missing ${unitsPath}`);
  process.exit(1);
}

const unitsText = await readFile(unitsPath, "utf8");
const units = JSON.parse(unitsText);
if (!Array.isArray(units)) fail("units.json must be an array");

for (const bookKey of BOOK_KEYS) {
  const book = JSON.parse(await readFile(path.join(DATA_ROOT, "books", `${bookKey}.json`), "utf8"));
  const sourceUnits = book.entities.filter((entity) => entity.type === "单元");
  const outputUnits = units.filter((unit) => unit.bookKey === bookKey);
  if (outputUnits.length !== sourceUnits.length) fail(`${bookKey}: expected ${sourceUnits.length} units, found ${outputUnits.length}`);

  const entityById = new Map(book.entities.map((entity) => [entity.id, entity]));
  for (const unit of outputUnits) {
    if (!entityById.has(unit.id) || entityById.get(unit.id).type !== "单元") fail(`${bookKey}/${unit.id}: unit id is missing from source book`);
    if (!Array.isArray(unit.works)) fail(`${bookKey}/${unit.id}: works must be an array`);
    else {
      if (unit.kind !== "project" && unit.works.length === 0) fail(`${bookKey}/${unit.id}: non-project unit has no works`);
      for (const work of unit.works) {
        if (!entityById.has(work.id)) fail(`${bookKey}/${unit.id}: work ${work.id} is missing from source book`);
        for (const score of work.scores ?? []) {
          if (!score.startsWith(`media/scores/${bookKey}/`)) fail(`${bookKey}/${unit.id}: score path belongs outside the book folder: ${score}`);
          if (!existsSync(path.join(ROOT, "public", score))) fail(`${bookKey}/${unit.id}: missing score asset ${score}`);
        }
      }
    }
    for (const task of unit.tasks ?? []) {
      for (const workId of task.works ?? []) {
        if (!entityById.has(workId)) fail(`${bookKey}/${unit.id}: task work ${workId} is missing from source book`);
      }
    }
  }
}

const gzipBytes = gzipSync(Buffer.from(unitsText, "utf8")).byteLength;
const gzipLimit = 120 * 1024;
if (gzipBytes > gzipLimit) fail(`gzip size ${gzipBytes} exceeds ${gzipLimit} bytes`);

if (errors.length) {
  console.error(`UNITS_AUDIT_FAILED ${errors.length} issue(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const rawBytes = Buffer.byteLength(unitsText, "utf8");
console.log(`UNITS_AUDIT_PASSED ${units.length} units ${rawBytes} bytes raw ${gzipBytes} bytes gzip`);
