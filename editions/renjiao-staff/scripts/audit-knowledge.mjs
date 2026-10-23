// Audit the locally built 人教版 edition: coverage, page citations, graph links,
// lesson-page data and cross-book concept merging. Run from the repository root
// after `node scripts/build-edition.mjs renjiao`.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const editionRoot = path.join(repoRoot, "editions", "renjiao");
const buildRoot = process.env.EDITION_WORKDIR ?? path.join(repoRoot, ".edition-build", "renjiao");
const registry = JSON.parse(await readFile(path.join(editionRoot, "data", "books.json"), "utf8"));
const { knowledgeCoverage, knowledgeForUnit } = await import(pathToFileURL(path.join(editionRoot, "data", "unit-knowledge.mjs")).href);
const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const failures = [];
const summary = [];
const normalizePointName = (value) => String(value ?? "").replace(/[《》〈〉\s]/gu, "");
const coverage = knowledgeCoverage();
const graph = await readJson(path.join(buildRoot, "public", "data", "music-graph.json"));
const canonical = await readJson(path.join(buildRoot, "public", "data", "canonical-graph.json"));
const lessonUnits = await readJson(path.join(buildRoot, "public", "data", "units.json"));
const published = registry.books.filter((book) => book.published);
if (published.length !== 14) failures.push(`expected 14 published books, got ${published.length}`);
if (Object.keys(coverage).length !== 14) failures.push(`curated unit data covers ${Object.keys(coverage).length} books`);

for (const bookInfo of published) {
  const { key } = bookInfo;
  const sourcePath = path.join(editionRoot, "content", "textbooks", `${key}.mjs`);
  const sourceModule = (await import(`${pathToFileURL(sourcePath).href}?audit=${Date.now()}`)).default;
  const sourceParts = sourceModule.parts ?? [sourceModule];
  const sourceUnits = sourceParts.flatMap((part) => part.units ?? []);
  const sourceWorks = sourceParts.flatMap((part) => part.works ?? []);
  const book = graph.books.find((item) => item.key === key);
  const builtUnits = lessonUnits.filter((unit) => unit.bookKey === key);
  if (!book) { failures.push(`${key}: missing from built music graph`); continue; }
  if (sourceUnits.length !== coverage[key]) failures.push(`${key}: source has ${sourceUnits.length} units, curated data has ${coverage[key]}`);
  if (builtUnits.length !== sourceUnits.length) failures.push(`${key}: static unit page has ${builtUnits.length} units, source has ${sourceUnits.length}`);

  const entityById = new Map(book.entities.map((entity) => [entity.id, entity]));
  const triplesBySubject = new Map();
  for (const triple of book.triples) {
    const group = triplesBySubject.get(triple.subject) ?? [];
    group.push(triple);
    triplesBySubject.set(triple.subject, group);
  }
  let citedTripleCount = 0;
  for (const triple of book.triples) {
    const evidence = book.evidenceByTriple?.[triple.id]?.[0];
    if (!evidence || !Number.isInteger(evidence.pdfPage)) {
      failures.push(`${key}: triple ${triple.id} is missing page evidence`);
      continue;
    }
    if (evidence.textbookPage === "前置页") {
      citedTripleCount += 1;
      continue;
    }
    const citedPage = Number(evidence.textbookPage);
    if (!Number.isInteger(citedPage) || citedPage < 1 || citedPage > bookInfo.pages || evidence.pdfPage !== citedPage + bookInfo.pdfOffset)
      failures.push(`${key}: triple ${triple.id} has invalid page evidence ${JSON.stringify(evidence)}`);
    else citedTripleCount += 1;
  }
  if (citedTripleCount !== book.triples.length) failures.push(`${key}: ${citedTripleCount}/${book.triples.length} relationships have valid page evidence`);
  let pointCount = 0;
  let objectiveCount = 0;
  let semanticWorkCount = 0;
  const orderedSourceUnits = [...sourceUnits].sort((left, right) => left.no - right.no);

  for (const unit of sourceUnits) {
    const expected = knowledgeForUnit(key, unit.no);
    const points = unit.knowledgePoints ?? [];
    if (!unit.facts?.some(([predicate]) => predicate === "学习目标")) failures.push(`${key} unit ${unit.no}: missing learning objective`);
    if (points.length < 2) failures.push(`${key} unit ${unit.no}: fewer than two knowledge points`);
    if (points.length !== expected.knowledgePoints.length) failures.push(`${key} unit ${unit.no}: generated point count differs from curated data`);
    const minPage = unit.page;
    const nextUnit = orderedSourceUnits.find((item) => item.no > unit.no);
    const maxPage = nextUnit ? nextUnit.page - 1 : bookInfo.pages;
    for (const point of points) {
      pointCount += 1;
      if (!point.name || !point.description || !Number.isInteger(point.page) || point.page < 1 || point.page > bookInfo.pages)
        failures.push(`${key} unit ${unit.no}: invalid point or page ${JSON.stringify(point)}`);
      if (point.page < minPage || point.page > maxPage)
        failures.push(`${key} unit ${unit.no}: page ${point.page} for “${point.name}” falls outside unit ${minPage}-${maxPage}`);
      if (point.type === "歌曲" && !sourceWorks.some((work) => work.unit === unit.no && work.name.replace(/^《|》$/g, "") === point.name))
        failures.push(`${key} unit ${unit.no}: song point “${point.name}” has no work entry to connect to`);
    }

    const sourceEntity = book.entities.find((entity) => entity.type === "单元" && entity.name === unit.name);
    if (!sourceEntity) { failures.push(`${key} unit ${unit.no}: missing graph unit entity`); continue; }
    const unitTriples = triplesBySubject.get(sourceEntity.id) ?? [];
    const goals = unitTriples.filter((triple) => triple.predicate === "学习目标");
    const links = unitTriples.filter((triple) => triple.predicate === "知识要点" && triple.objectId);
    objectiveCount += goals.length;
    if (!goals.length) failures.push(`${key} unit ${unit.no}: no graph learning-objective edge`);
    if (links.length !== points.length) failures.push(`${key} unit ${unit.no}: ${links.length} graph point links for ${points.length} displayed points`);
    for (const link of links) {
      const target = entityById.get(link.objectId);
      const evidence = book.evidenceByTriple[link.id]?.[0];
      const page = Number(evidence?.textbookPage);
      if (!target) { failures.push(`${key} unit ${unit.no}: knowledge-point edge has no target entity`); continue; }
      if (!Number.isInteger(page) || page < 1 || page > bookInfo.pages || evidence.pdfPage !== page + bookInfo.pdfOffset)
        failures.push(`${key} unit ${unit.no}: bad evidence citation for “${target.name}”`);
      const definition = (triplesBySubject.get(target.id) ?? []).find((triple) => triple.predicate === "要点释义");
      if (!definition) failures.push(`${key}: “${target.name}” graph entity has no point explanation`);
      else if (!book.evidenceByTriple[definition.id]?.some((item) => item.textbookPage === evidence.textbookPage))
        failures.push(`${key}: “${target.name}” explanation citation differs from its unit point`);
    }

    const rendered = builtUnits.find((item) => item.name === unit.name);
    if (!rendered?.goals?.length) failures.push(`${key} unit ${unit.no}: static page is missing the objective`);
    if ((rendered?.knowledgePoints?.length ?? 0) < points.length) failures.push(`${key} unit ${unit.no}: static page omits curated knowledge points`);
    for (const point of points) {
      if (!rendered?.knowledgePoints?.some((item) => normalizePointName(item.name) === normalizePointName(point.name) && item.type === point.type))
        failures.push(`${key} unit ${unit.no}: static page omits “${point.name}”`);
    }
  }

  const workIds = new Set(book.entities
    .filter((entity) => ["音乐作品", "歌曲", "民歌", "器乐曲", "戏曲歌曲", "戏曲选段", "舞蹈音乐", "影视音乐", "交响作品", "合唱作品", "歌剧音乐", "音乐剧", "进行曲", "朗诵作品"].includes(entity.type))
    .map((entity) => entity.id));
  const excluded = new Set(["包含作品", "学习方式", "教材标注"]);
  for (const triple of book.triples) if (workIds.has(triple.subject) && !excluded.has(triple.predicate)) semanticWorkCount += 1;
  if (!semanticWorkCount) failures.push(`${key}: no work-to-person, genre, region or music-attribute relationships`);

  summary.push({ key, units: sourceUnits.length, objectives: objectiveCount, knowledgePoints: pointCount, semanticWorkRelations: semanticWorkCount, citedRelationships: citedTripleCount });
}

const sharedExpectations = [
  { name: "三拍子", type: "拍号", books: ["pep-g1s2", "pep-g2s1"] },
  { name: "起承转合", type: "音乐概念", books: ["pep-g4s1", "pep-g5s1"] },
  { name: "《保卫黄河》", type: "音乐作品", books: ["pep-g2s2", "pep-g7s2", "pep-g8s1"] },
];
const shared = Object.fromEntries(sharedExpectations.map(({ name, type, books }) => {
  const entity = canonical.entities.find((item) => item.name === name && item.type === type);
  if (!entity || !books.every((key) => entity.bookKeys?.includes(key)))
    failures.push(`cross-book graph merge failed for ${name} (${books.join("/")})`);
  return [name, entity?.bookKeys ?? []];
}));
const graphPointLinks = canonical.relationships.filter((relationship) => relationship.predicate === "知识要点").length;
if (!graphPointLinks) failures.push("canonical graph contains no unit knowledge-point relationships");

console.log(JSON.stringify({ books: summary, crossBookNodes: shared, canonicalKnowledgePointLinks: graphPointLinks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
