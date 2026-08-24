import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_ROOT = process.cwd();
const SOURCE_ROOT = path.resolve(SITE_ROOT, "..", "full_extraction");
const OUTPUT_PATH = path.join(SITE_ROOT, "public", "data", "music-graph.json");

const BOOKS = [
  { key: "g7s1", dir: "grade7/grade7_sem1", grade: 7, semester: "上册", pages: 79, title: "人音版七年级上册" },
  { key: "g7s2", dir: "grade7/grade7_sem2", grade: 7, semester: "下册", pages: 79, title: "人音版七年级下册" },
  { key: "g8s1", dir: "grade8/grade8_sem1", grade: 8, semester: "上册", pages: 71, title: "人音版八年级上册" },
  { key: "g8s2", dir: "grade8/grade8_sem2", grade: 8, semester: "下册", pages: 79, title: "人音版八年级下册" },
  { key: "g9s1", dir: "grade9/grade9_sem1", grade: 9, semester: "上册", pages: 71, title: "人音版九年级上册" },
  { key: "g9s2", dir: "grade9/grade9_sem2", grade: 9, semester: "下册", pages: 79, title: "人音版九年级下册" },
];

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const readJsonl = async (file) => (await readFile(file, "utf8"))
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const compactEntity = (entity, book) => ({
  id: entity.entity_id,
  name: entity.canonical_name,
  type: entity.entity_type,
  aliases: entity.aliases ?? [],
  description: entity.description ?? "",
  firstPage: entity.first_pdf_page ?? null,
  confidence: entity.confidence ?? 0.8,
  bookKey: book.key,
});

const compactTriple = (triple, book) => ({
  id: triple.triple_id,
  subject: triple.subject_id,
  predicate: triple.predicate_code,
  objectId: triple.object_id ?? null,
  literal: triple.literal_value ?? null,
  objectKind: triple.object_kind,
  sourcePage: triple.source_pdf_page ?? null,
  section: triple.source_section ?? "",
  confidence: triple.confidence ?? 0.8,
  bookKey: book.key,
});

const compactEvidence = (item) => ({
  tripleId: item.triple_id,
  pdfPage: item.pdf_page ?? null,
  textbookPage: item.textbook_page ?? "",
  summary: item.evidence_summary ?? "",
  region: item.page_region ?? "",
  confidence: item.confidence ?? 0.8,
});

const relationLabelMap = (extensions) => Object.fromEntries(
  extensions.map((item) => [item.code ?? item.predicate_code, item.label ?? item.relation_label ?? item.code ?? item.predicate_code]),
);

const buildBook = async (book) => {
  const dir = path.join(SOURCE_ROOT, book.dir);
  const [entities, triples, evidence, extensions, summary] = await Promise.all([
    readJsonl(path.join(dir, "entities.jsonl")),
    readJsonl(path.join(dir, "triples.jsonl")),
    readJsonl(path.join(dir, "evidence.jsonl")),
    readJson(path.join(dir, "relation_extensions.json")),
    readJson(path.join(dir, "book_summary.json")),
  ]);
  const evidenceByTriple = {};
  for (const item of evidence) {
    (evidenceByTriple[item.triple_id] ??= []).push(compactEvidence(item));
  }
  const workIds = new Set(triples
    .filter((triple) => ["WORK_IN_TEXTBOOK", "WORK_IN_UNIT", "LEARNING_MODE"].includes(triple.predicate_code))
    .map((triple) => triple.subject_id));
  const works = entities.filter((entity) => entity.entity_type === "音乐作品" && workIds.has(entity.entity_id));
  return {
    key: book.key,
    title: book.title,
    grade: book.grade,
    semester: book.semester,
    pages: book.pages,
    entityCount: entities.length,
    tripleCount: triples.length,
    evidenceCount: evidence.length,
    workCount: works.length,
    reviewCount: triples.filter((triple) => triple.review_status === "有疑问" || Number(triple.confidence ?? 1) < 0.85).length,
    structureShare: summary.layout_structure_audit?.layout_structure_triple_ratio ?? summary.layout_structure_analysis?.share_of_all_triples ?? 0,
    entities: entities.map((entity) => compactEntity(entity, book)),
    triples: triples.map((triple) => compactTriple(triple, book)),
    evidenceByTriple,
    relations: relationLabelMap(extensions),
  };
};

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
const payload = {
  version: "2026-08-24-mvp",
  generatedAt: new Date().toISOString(),
  books: await Promise.all(BOOKS.map(buildBook)),
};
await writeFile(OUTPUT_PATH, JSON.stringify(payload), "utf8");
console.log(`GRAPH_DATA_WRITTEN ${OUTPUT_PATH} ${Buffer.byteLength(JSON.stringify(payload))} bytes`);
