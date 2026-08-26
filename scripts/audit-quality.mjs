import { readFile } from "node:fs/promises";

const data = JSON.parse(await readFile(new URL("../public/data/music-graph.json", import.meta.url), "utf8"));
const failures = [];
for (const book of data.books) {
  const ids = new Set(book.entities.map((entity) => entity.id));
  const seen = new Set();
  for (const triple of book.triples) {
    const key = `${triple.subject}|${triple.predicate}|${triple.objectId ?? triple.literal ?? ""}`;
    if (seen.has(key)) failures.push(`${book.key}: duplicate ${key}`);
    seen.add(key);
    if (!ids.has(triple.subject)) failures.push(`${book.key}: missing subject ${triple.subject}`);
    if (triple.objectId && !ids.has(triple.objectId)) failures.push(`${book.key}: missing object ${triple.objectId}`);
    if (Number(triple.confidence ?? 0) < 0.9) failures.push(`${book.key}: low confidence ${triple.id}`);
    if (!book.evidenceByTriple[triple.id]?.length) failures.push(`${book.key}: no evidence ${triple.id}`);
    if (triple.qualityStatus !== "published") failures.push(`${book.key}: non-published triple leaked ${triple.id}`);
  }
  console.log(`${book.title}: published=${book.publishedCount} candidates=${book.candidateCount} structural=${book.structuralCount}`);
}
if (failures.length) {
  console.error(`QUALITY_AUDIT_FAILED ${failures.length}`);
  console.error(failures.slice(0, 20).join("\n"));
  process.exit(1);
}
console.log("QUALITY_AUDIT_PASSED");
