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

// Only these relations are allowed into the teacher-facing graph. Page/OCR
// bookkeeping remains available as evidence, but it must not masquerade as
// music knowledge. This is the quality gate for the first public release.
const PUBLISHED_PREDICATES = new Set([
  "BOOK_HAS_UNIT", "UNIT_ORDER", "UNIT_SEQUENCE", "UNIT_THEME",
  "WORK_IN_TEXTBOOK", "WORK_IN_UNIT", "LEARNING_MODE", "LYRICIST", "COMPOSER",
  "GENRE", "TEMPO", "LYRICS_ADAPTED_BY", "LYRIC_ADAPTER", "ORIGIN_REGION",
  "TRANSLATOR", "ETHNIC_GROUP", "SONG_ADAPTED_BY", "MUSICAL_STYLE",
  "PERFORMANCE_FORM", "INSTRUMENT", "RECORDED_BY", "ARRANGER", "TONALITY",
  "HAS_SCORE", "VOCAL_TYPE", "MELODY_CHARACTER", "PERFORMANCE_GUIDANCE",
  "THEME", "CREATION_PERIOD", "METER", "MUSICAL_FORM", "CREATION_YEAR",
  "HISTORICAL_EVENT", "DEPICTS", "RHYTHM_PATTERN", "SOURCE_WORK", "RELATED_WORK",
  "CREDIT_NOTE", "TEACHING_POINT", "CONCEPT_CATEGORY", "EXPLAINS_CONCEPT",
  "TASK_ACTION", "TASK_TARGET",
]);

const HIGH_PRECISION_PREDICATES = new Set([
  "TEACHING_POINT", "PERFORMANCE_GUIDANCE", "CREDIT_NOTE", "EXPLAINS_CONCEPT",
]);

// A small, explicitly curated foundation layer. It is separate from textbook
// evidence so that these definitions are never mistaken for OCR guesses.
const FOUNDATIONAL_ONTOLOGY = {
  source: "教师确认的音乐学基础概念样例",
  entities: ["音乐语言", "艺术手段", "形式要素", "人类情感", "节奏", "音的长短和强弱", "节拍", "时间片段的循环重复", "音乐", "力度", "音量的强弱程度", "速度", "节拍的快慢程度"].map((name) => ({ id: `ONTOLOGY_${name}`, name, type: "音乐概念" })),
  triples: [
    ["音乐语言", "是", "艺术手段"], ["音乐语言", "凭借", "形式要素"], ["音乐语言", "表现", "人类情感"],
    ["节奏", "指", "音的长短和强弱"], ["节拍", "是", "时间片段的循环重复"], ["节拍", "用强弱关系组织", "音乐"],
    ["力度", "是", "音量的强弱程度"], ["速度", "是", "节拍的快慢程度"],
  ].map(([subject, predicate, object]) => ({ subject, predicate, object, qualityStatus: "published", sourceType: "curated" })),
};

const normalizeLiteral = (value) => typeof value === "string"
  ? value.replace(/\s+/g, " ").trim()
  : value;

const matchesType = (actual, expected) => {
  if (!expected || expected.includes("或") || expected.includes("/")) return true;
  if (!actual) return false;
  return actual === expected || actual.includes(expected) || expected.includes(actual);
};

const qualityCheck = (triple, entityById, extensionByCode, evidenceByTriple) => {
  const reasons = [];
  const subject = entityById.get(triple.subject_id);
  const object = triple.object_id ? entityById.get(triple.object_id) : null;
  const confidence = Number(triple.confidence ?? 0);
  const evidence = evidenceByTriple[triple.triple_id] ?? [];
  if (!PUBLISHED_PREDICATES.has(triple.predicate_code)) reasons.push("结构关系，不进入教师图谱");
  if (!subject) reasons.push("主语实体不存在");
  if (triple.object_kind === "实体" && !object) reasons.push("宾语实体不存在");
  if (triple.object_kind === "字面值" && (triple.literal_value === null || triple.literal_value === undefined || String(triple.literal_value).trim() === "")) reasons.push("字面值为空");
  if (String(triple.literal_value ?? "").length > 180) reasons.push("字面值过长，需拆分");
  if (confidence < 0.9) reasons.push("置信度低于0.90");
  if (triple.review_status === "待复核" && confidence < 0.95) reasons.push("原始记录标记为待复核且置信度不足");
  if (!evidence.length) reasons.push("缺少教材证据");
  const extension = extensionByCode.get(triple.predicate_code);
  if (extension && subject && !matchesType(subject.entity_type, extension.subject_type)) reasons.push("主语类型不符合关系定义");
  if (extension && object && !matchesType(object.entity_type, extension.object_type)) reasons.push("宾语类型不符合关系定义");
  if (HIGH_PRECISION_PREDICATES.has(triple.predicate_code) && triple.review_status !== "已初校") reasons.push("高风险关系必须已初校");
  return { publish: reasons.length === 0, reasons };
};

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
  const entityById = new Map(entities.map((entity) => [entity.entity_id, entity]));
  const extensionByCode = new Map(extensions.map((item) => [item.code ?? item.predicate_code, item]));
  const seenKeys = new Set();
  const publishedTriples = [];
  const candidateTriples = [];
  const structuralTriples = [];
  for (const triple of triples) {
    const check = qualityCheck(triple, entityById, extensionByCode, evidenceByTriple);
    const normalized = { ...triple, literal_value: normalizeLiteral(triple.literal_value) };
    const key = normalized.duplicate_key ?? [normalized.subject_id, normalized.predicate_code, normalized.object_id ?? "", normalized.literal_value ?? ""].join("|");
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    if (!PUBLISHED_PREDICATES.has(normalized.predicate_code)) {
      structuralTriples.push({ ...compactTriple(normalized, book), qualityStatus: "structural", qualityReasons: check.reasons });
    } else if (check.publish) {
      publishedTriples.push({ ...compactTriple(normalized, book), qualityStatus: "published", qualityReasons: [] });
    } else {
      candidateTriples.push({ ...compactTriple(normalized, book), qualityStatus: "candidate", qualityReasons: check.reasons });
    }
  }
  const graphEntityIds = new Set(publishedTriples.flatMap((triple) => [triple.subject, triple.objectId].filter(Boolean)));
  const visibleEntities = entities.filter((entity) => graphEntityIds.has(entity.entity_id));
  const workIds = publishedTriples
    .filter((triple) => ["WORK_IN_TEXTBOOK", "WORK_IN_UNIT", "LEARNING_MODE"].includes(triple.predicate))
    .map((triple) => triple.subject);
  const works = visibleEntities.filter((entity) => entity.entity_type === "音乐作品" && workIds.includes(entity.entity_id));
  const structureShare = summary.layout_structure_audit?.layout_structure_triple_ratio ?? summary.layout_structure_analysis?.share_of_all_triples ?? 0;
  return {
    key: book.key,
    title: book.title,
    grade: book.grade,
    semester: book.semester,
    pages: book.pages,
    entityCount: visibleEntities.length,
    tripleCount: publishedTriples.length,
    evidenceCount: publishedTriples.reduce((sum, triple) => sum + (evidenceByTriple[triple.id]?.length ?? 0), 0),
    workCount: works.length,
    reviewCount: candidateTriples.length,
    structureShare,
    publishedCount: publishedTriples.length,
    candidateCount: candidateTriples.length,
    structuralCount: structuralTriples.length,
    entities: visibleEntities.map((entity) => compactEntity(entity, book)),
    triples: publishedTriples,
    candidateTriples,
    structuralTriples,
    evidenceByTriple,
    relations: relationLabelMap(extensions),
  };
/*
  const workIds = triples
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
*/
};

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
const payload = {
  version: "2026-08-24-quality-gated",
  generatedAt: new Date().toISOString(),
  qualityPolicy: { publishedConfidence: 0.9, requiresEvidence: true, structuralTriplesHidden: true, candidateTriplesHidden: true },
  foundationalOntology: FOUNDATIONAL_ONTOLOGY,
  books: await Promise.all(BOOKS.map(buildBook)),
};
await writeFile(OUTPUT_PATH, JSON.stringify(payload), "utf8");
console.log(`GRAPH_DATA_WRITTEN ${OUTPUT_PATH} ${Buffer.byteLength(JSON.stringify(payload))} bytes`);
