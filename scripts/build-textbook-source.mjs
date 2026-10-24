// Converts hand-read textbook sources (content/textbooks/<key>.mjs) into the
// site's per-book dataset format and replaces those books in music-graph.json.
// Also writes a score-crop manifest consumed by scripts/crop-scores.py.
//
// Usage: node scripts/build-textbook-source.mjs [g7s1 g7s2 ...]   (default: all sources found)
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { BOOK_BY_KEY, BOOK_REGISTRY, stripEditionPrefix } from "../data/books.mjs";
import { TEXTBOOK_MODES } from "./lib/textbook-modes.mjs";

const root = process.cwd();
let researchFactsFor = () => [];
try {
  ({ researchFactsFor } = await import(pathToFileURL(path.join(root, "data", "renjiao-research-facts.mjs")).href));
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}
const sourceDir = path.join(root, "content", "textbooks");
const datasetPath = path.join(root, "public", "data", "music-graph.json");
const manifestPath = path.join(root, "content", "textbooks", "score-manifest.json");

// 与 refine-public-ontology / build-canonical-graph 的作品类型保持一致（缺“音乐剧”时，人教版《音乐之声》等课打不开）。
const WORK_TYPES = new Set(["音乐作品", "歌曲", "民歌", "器乐曲", "戏曲歌曲", "戏曲选段", "舞蹈音乐", "影视音乐", "交响作品", "合唱作品", "歌剧音乐", "音乐剧", "进行曲", "朗诵作品"]);
// 教材写得更细的体裁（管弦乐曲、云南民歌、京剧……）归入作品类型，否则这些课打不开（人音五上《晨景》）；
// 带谱例的音乐游戏、情境表演、小小音乐剧围绕一首曲子（一上《你我都是好朋友》），也算一课。
// 原写法另记为“音乐体裁”。没有谱例的活动和练习仍不是作品。
const SCORED_ACTIVITY = /^(音乐游戏|情境表演|小小音乐剧|音乐情景剧)$/;
function workTypeOf(work) {
  const type = work.type;
  if (WORK_TYPES.has(type)) return type;
  if (/民歌$/.test(type)) return "民歌";
  if (/(乐曲|独奏曲|四重奏|协奏曲|协奏曲选段|钢琴曲|合奏曲|练习曲|改编曲)$/.test(type)) return "器乐曲";
  if (type === "交响诗") return "交响作品";
  if (type === "舞剧音乐") return "舞蹈音乐";
  if (/^(京剧|戏曲)$/.test(type)) return "戏曲选段";
  if (SCORED_ACTIVITY.test(type) && work.scores?.length) return "音乐作品";
  return type;
}
const CATEGORY = {
  教材: "textbook", 单元: "textbook", 人物: "person", 创作主体: "person", 创作群体: "person", 署名主体: "person", 机构: "person",
  乐器: "instrument", 表演形式: "instrument", 音乐体裁: "genre", 戏曲行当: "genre", 来源作品: "genre",
  速度术语: "element", 调性: "element", 节奏型: "element", 主题与情感: "element",
  音乐概念: "theory", 知识概念: "theory", 拍号: "theory", 地域: "culture", 民族: "culture", 历史事件: "culture", 音乐风格: "culture",
  学习活动: "activity", 学习目标: "goal", 核心素养: "goal", 教学重点: "goal", 教学难点: "goal", 课堂任务: "goal",
};
const categoryOf = (type) => (WORK_TYPES.has(type) ? "work" : CATEGORY[type] ?? "theory");
const LAYERS = {
  明: { region: "教材明示", section: "教材核心", confidence: 0.99 },
  谱: { region: "乐谱可见", section: "乐谱分析", confidence: 0.97 },
  归: { region: "教材归纳", section: "教材归纳", confidence: 0.92 },
  // Extension knowledge beyond the textbook; every item is reviewed before publication.
  补: { region: "拓展知识", section: "拓展知识", confidence: 0.9 },
};
// File names must survive entity renumbering when sources grow.
const stableHash = (value) => {
  let hash = 2166136261;
  for (const char of String(value)) hash = Math.imul(hash ^ char.codePointAt(0), 16777619) >>> 0;
  return hash.toString(36);
};
const normalizeWorkName = (value) => String(value ?? "").normalize("NFKC").toLocaleLowerCase("zh-CN").replace(/[《》〈〉【】\[\]（）()“”‘’'"·•—–_\-:：,，.。!?！？;；/\\\s]/gu, "");
const SENTENCE_TYPES = new Set(["学习活动", "主题与情感", "学习目标"]);
const ATTRIBUTE_PREDICATES = new Set(["学习方式"]);
const requested = process.argv.slice(2);
const sourceFiles = new Set((await readdir(sourceDir)).filter((file) => /^(pep-)?g\ds\d\.mjs$/.test(file)));
const publishedKeys = new Set(BOOK_REGISTRY.filter((book) => book.published).map((book) => book.key));
const available = BOOK_REGISTRY
  .filter((book) => book.published && sourceFiles.has(`${book.key}.mjs`))
  .map((book) => book.key);
const unknown = requested.filter((key) => !BOOK_BY_KEY.has(key));
const unpublished = requested.filter((key) => BOOK_BY_KEY.has(key) && !publishedKeys.has(key));
const missingSources = requested.filter((key) => BOOK_BY_KEY.has(key) && publishedKeys.has(key) && !sourceFiles.has(`${key}.mjs`));
if (unknown.length) throw new Error(`册目登记表中没有：${unknown.join("、")}`);
if (unpublished.length) throw new Error(`以下册目尚未发布，不能进入教材构建：${unpublished.join("、")}`);
if (missingSources.length) throw new Error(`以下已发布册目缺少源文件：${missingSources.join("、")}`);
const keys = requested.length ? requested : available;
const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8").catch(() => "{}"));
const report = [];

for (const key of keys) {
  const raw = (await import(pathToFileURL(path.join(sourceDir, `${key}.mjs`)).href + `?t=${Date.now()}`)).default;
  // Sources are authored unit by unit as `parts`; flatten them into one book.
  const parts = raw.parts ?? [raw];
  const source = { ...raw, ...Object.fromEntries(["units", "works", "concepts", "people", "tasks", "references"].map((field) => [field, parts.flatMap((part) => part[field] ?? [])])) };
  const bookInfo = BOOK_BY_KEY.get(key);
  const previousIndex = dataset.books.findIndex((book) => book.key === key);
  const previous = previousIndex >= 0 ? dataset.books[previousIndex] : {
    key,
    title: bookInfo.title,
    grade: bookInfo.grade,
    semester: bookInfo.semester,
    pages: bookInfo.pages,
    entities: [],
    triples: [],
    candidateTriples: [],
    structuralTriples: [],
    evidenceByTriple: {},
    relations: {},
  };
  const offset = source.pdfOffset;
  const pdfOf = (page) => (page && typeof page === "object" ? page.pdf : page + offset);
  const textbookPageOf = (page) => (page && typeof page === "object" ? "前置页" : String(page));

  const entities = [];
  const entityByKey = new Map();
  const workByName = new Map();
  const entity = (name, type, extra = {}) => {
    const display = WORK_TYPES.has(type) && !/^《.*》$/.test(name) ? `《${name}》` : name;
    const lookupKey = `${categoryOf(type)}|${display}`;
    let found = entityByKey.get(lookupKey) ?? (WORK_TYPES.has(type) ? workByName.get(normalizeWorkName(name)) : undefined);
    if (!found) {
      found = { id: `${key.toUpperCase()}_E${String(entities.length + 1).padStart(5, "0")}`, name: display, type, aliases: [], description: "", firstPage: null, confidence: 1, bookKey: key, ...extra };
      entities.push(found);
      entityByKey.set(lookupKey, found);
    }
    return found;
  };
  const note = (target, page) => {
    const pdf = pdfOf(page);
    if (target.firstPage == null || pdf < target.firstPage) target.firstPage = pdf;
  };

  const triples = [];
  const evidenceByTriple = {};
  const seen = new Set();
  let duplicates = 0;
  const add = (subject, predicate, value, declaredType, layer = "明", page, externalSource) => {
    const spec = LAYERS[layer];
    // Descriptive sentences and learning-mode tags stay as attributes: as graph
    // nodes they are one-off leaves (or 200-edge hubs) with no structural meaning.
    const asAttribute = (SENTENCE_TYPES.has(declaredType) && String(value).length > 10) || ATTRIBUTE_PREDICATES.has(predicate);
    const valueType = asAttribute ? null : declaredType;
    if (!spec) throw new Error(`${key}: 未知层级 ${layer}（${subject.name} ${predicate}）`);
    const object = valueType ? entity(value, valueType) : null;
    const literal = valueType ? null : String(value);
    const dedupeKey = `${subject.id}|${predicate}|${object ? object.id : `lit:${literal}`}`;
    if (seen.has(dedupeKey)) { duplicates += 1; return; }
    seen.add(dedupeKey);
    if (object) note(object, page);
    const id = `${key.toUpperCase()}_T${String(triples.length + 1).padStart(5, "0")}`;
    triples.push({
      id, subject: subject.id, predicate, objectId: object?.id ?? null, literal,
      objectKind: object ? "实体" : "字面值", sourcePage: pdfOf(page), section: spec.section,
      confidence: spec.confidence, bookKey: key, qualityStatus: "published",
      qualityReasons: layer === "补" ? ["拓展知识，非教材原文"] : [],
    });
    evidenceByTriple[id] = [{
      tripleId: id, pdfPage: pdfOf(page), textbookPage: textbookPageOf(page),
      summary: `${subject.name} · ${predicate}：${object?.name ?? literal}`,
      region: spec.region, confidence: spec.confidence,
      ...(externalSource ? { externalSource } : {}),
    }];
  };
  const addFacts = (subject, facts, defaultPage) => {
    for (const [predicate, value, valueType, layer = "明", page = defaultPage, externalSource] of facts ?? [])
      add(subject, predicate, value, valueType, layer, page, externalSource);
  };

  const bookName = stripEditionPrefix(source.title);
  const textbook = entity(bookName, "教材");
  textbook.firstPage = 1;
  addFacts(textbook, source.book, { pdf: 1 });

  // Register works first so references from other facts resolve to them.
  for (const work of source.works) {
    if (work.mode && !Object.hasOwn(TEXTBOOK_MODES, work.mode)) throw new Error(`${key}: 未登记的学习方式“${work.mode}”（作品《${work.name}》）`);
    const created = entity(work.name, workTypeOf(work), { aliases: work.aliases ?? [] });
    note(created, work.page);
    workByName.set(normalizeWorkName(work.name), created);
  }

  const unitByNo = new Map();
  for (const unit of source.units) {
    const created = entity(unit.name, "单元");
    note(created, unit.page);
    unitByNo.set(unit.no, created);
    add(textbook, "包含单元", unit.name, "单元", "明", unit.page);
    add(created, "单元顺序", unit.no, null, "明", unit.page);
    addFacts(created, unit.facts, unit.page);
    for (const point of unit.knowledgePoints ?? []) {
      const type = point.type ?? "音乐概念";
      const layer = point.layer ?? "明";
      const page = point.page ?? unit.page;
      const target = entity(point.name, type);
      note(target, page);
      add(created, "知识要点", point.name, type, layer, page);
      if (point.description) add(target, "要点释义", point.description, null, layer, page);
    }
  }

  const media = [];
  const attachScores = (created, owner) => {
    // Optional 6th element: { rotate: 180 } for pages scanned upside down (box is in upright coordinates).
    (owner.scores ?? []).forEach(([page, x0, y0, x1, y1, options = {}], index) => {
      const file = `media/scores/${key}/${stableHash(owner.name)}-${index + 1}.webp`;
      const label = typeof page === "object" ? "前置页" : `第${page}页`;
      created.media = [...(created.media ?? []), { kind: "score", url: file, title: `${created.name}谱例（教材${label}）`, source: `${source.title} ${label}` }];
      media.push({ pdfPage: pdfOf(page), box: [x0, y0, x1, y1], out: file, ...(options.rotate ? { rotate: options.rotate } : {}) });
    });
  };
  for (const work of source.works) {
    const created = workByName.get(normalizeWorkName(work.name));
    const unit = unitByNo.get(work.unit);
    if (unit) add(unit, "包含作品", work.name, workTypeOf(work), "明", work.page);
    if (work.mode) add(created, "学习方式", work.mode, TEXTBOOK_MODES[work.mode], "明", work.page);
    if (work.key) add(created, "教材标注", "重点学习曲目（☆）", null, "明", work.page);
    addFacts(created, work.facts, work.page);
    if (workTypeOf(work) !== work.type && !SCORED_ACTIVITY.test(work.type) && !(work.facts ?? []).some(([predicate]) => /体裁/.test(predicate)))
      add(created, "音乐体裁", work.type, "音乐体裁", "明", work.page);
    attachScores(created, work);
  }
  for (const concept of source.concepts ?? []) {
    const created = entity(concept.name, concept.type);
    note(created, concept.page);
    const unit = unitByNo.get(concept.unit);
    if (unit) add(unit, concept.predicate ?? "涉及知识", concept.name, concept.type, concept.layer ?? "明", concept.page);
    addFacts(created, concept.facts, concept.page);
    attachScores(created, concept);
  }
  for (const person of source.people ?? []) {
    const created = entity(person.name, person.type ?? "人物");
    addFacts(created, person.facts, person.page ?? { pdf: 1 });
    const unit = unitByNo.get(person.unit);
    if (unit) add(unit, "提及人物", person.name, person.type ?? "人物", "明", person.page ?? unit.firstPage);
  }
  for (const reference of source.references ?? []) {
    const created = entity(reference.name, reference.type);
    note(created, reference.page);
    const unit = unitByNo.get(reference.unit);
    if (unit) add(unit, reference.predicate ?? "引用资料", reference.name, reference.type, "明", reference.page);
  }
  // Classroom tasks (实践与创造) restate the works' own learning activities; as
  // separate nodes they doubled every work link. Keep them as unit attributes.
  for (const task of source.tasks ?? []) {
    const unit = unitByNo.get(task.unit);
    const works = (task.facts ?? []).filter(([predicate]) => predicate === "涉及作品").map(([, value]) => `《${String(value).replace(/^《|》$/g, "")}》`);
    const focus = (task.facts ?? []).filter(([predicate]) => predicate === "练习重点").map(([, value]) => value);
    const detail = [works.length ? `涉及${works.join("")}` : "", focus.length ? `练习重点：${focus.join("、")}` : ""].filter(Boolean).join("；");
    if (unit) add(unit, "课堂任务", detail ? `${task.name}（${detail}）` : task.name, null, "明", task.page);
  }
  for (const fact of researchFactsFor(key)) {
    const anchorDisplay = WORK_TYPES.has(fact.anchorType) && !/^《.*》$/.test(fact.anchorName)
      ? "《" + fact.anchorName + "》"
      : fact.anchorName;
    const anchor = fact.anchorType === "教材"
      ? entities.find((item) => item.type === "教材")
      : entityByKey.get(categoryOf(fact.anchorType) + "|" + anchorDisplay)
        ?? entities.find((item) => item.type === fact.anchorType && item.name === anchorDisplay)
        ?? (WORK_TYPES.has(fact.anchorType) ? workByName.get(normalizeWorkName(fact.anchorName)) : undefined);
    if (!anchor) throw new Error(key + ": 拓展知识锚点未找到“" + fact.anchorName + "”（" + fact.anchorType + "）");
    add(anchor, fact.predicate, fact.value, fact.valueType, "补", fact.page, fact.source);
  }
  for (const item of entities) if (item.firstPage == null) item.firstPage = textbook.firstPage;

  const relations = Object.fromEntries([...new Set(triples.map((triple) => triple.predicate))].map((predicate) => [predicate, predicate]));
  const works = entities.filter((item) => WORK_TYPES.has(item.type));
  const structural = triples.filter((triple) => ["包含单元", "单元顺序", "包含作品", "课堂任务"].includes(triple.predicate)).length;
  const book = {
    key, title: source.title, source: "逐页重读", grade: previous.grade, semester: previous.semester, pages: previous.pages,
    pdfOffset: Number.isInteger(source.pdfOffset) ? source.pdfOffset : bookInfo.pdfOffset,
    entityCount: entities.length, tripleCount: triples.length, evidenceCount: triples.length,
    workCount: works.length, reviewCount: 0, structureShare: Math.round((structural / triples.length) * 1000) / 1000,
    publishedCount: triples.length, candidateCount: 0, structuralCount: structural,
    entities, triples, candidateTriples: [], structuralTriples: [], evidenceByTriple, relations,
    resourceSlots: works.flatMap((work) => (work.media ?? []).map((asset) => ({ workId: work.id, kind: "谱例", title: asset.title, url: asset.url, status: "已挂载" }))),
  };
  book.resourceSlotCount = book.resourceSlots.length;
  if (previousIndex >= 0) dataset.books[previousIndex] = book;
  else dataset.books.push(book);
  manifest[key] = media;

  const layers = Object.fromEntries(Object.keys(LAYERS).map((layer) => [LAYERS[layer].region, triples.filter((triple) => triple.section === LAYERS[layer].section).length]));
  report.push({ key, entities: entities.length, triples: triples.length, entityRelations: triples.filter((triple) => triple.objectId).length, works: works.length, scores: media.length, duplicatesSkipped: duplicates, layers });
}

dataset.books = dataset.books.filter((book) => publishedKeys.has(book.key));
for (const key of Object.keys(manifest)) {
  if (!publishedKeys.has(key)) delete manifest[key];
}
dataset.version = `${new Date().toISOString().slice(0, 10)}-textbook-reread`;
dataset.generatedAt = new Date().toISOString();
await writeFile(datasetPath, JSON.stringify(dataset), "utf8");
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
