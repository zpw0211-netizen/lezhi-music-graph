// Converts hand-read textbook sources (content/textbooks/<key>.mjs) into the
// site's per-book dataset format and replaces those books in music-graph.json.
// Also writes a score-crop manifest consumed by scripts/crop-scores.py.
//
// Usage: node scripts/build-textbook-source.mjs [g7s1 g7s2 ...]   (default: all sources found)
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const sourceDir = path.join(root, "content", "textbooks");
const datasetPath = path.join(root, "public", "data", "music-graph.json");
const manifestPath = path.join(root, "content", "textbooks", "score-manifest.json");

const WORK_TYPES = new Set(["音乐作品", "歌曲", "民歌", "器乐曲", "戏曲歌曲", "戏曲选段", "舞蹈音乐", "影视音乐", "交响作品", "合唱作品", "歌剧音乐", "进行曲", "朗诵作品"]);
const CATEGORY = {
  教材: "textbook", 单元: "textbook", 人物: "person", 创作主体: "person", 创作群体: "person", 署名主体: "person", 机构: "person",
  乐器: "instrument", 表演形式: "instrument", 音乐体裁: "genre", 戏曲行当: "genre", 来源作品: "genre",
  速度术语: "element", 调性: "element", 节奏型: "element", 主题与情感: "element",
  音乐概念: "theory", 知识概念: "theory", 拍号: "theory", 地域: "culture", 民族: "culture", 历史事件: "culture", 音乐风格: "culture",
  学习活动: "activity", 学习目标: "goal", 核心素养: "goal", 教学重点: "goal", 教学难点: "goal", 课堂任务: "goal",
};
const categoryOf = (type) => (WORK_TYPES.has(type) ? "work" : CATEGORY[type] ?? "theory");
const LAYERS = {
  明: { region: "教材明示", section: "教材核心", confidence: 0.99, summary: (p) => `教材第${p}页明确记载` },
  谱: { region: "乐谱可见", section: "乐谱分析", confidence: 0.97, summary: (p) => `教材第${p}页谱例标注` },
  归: { region: "教材归纳", section: "教材归纳", confidence: 0.92, summary: (p) => `依据教材第${p}页内容归纳` },
  // Extension knowledge beyond the textbook; every item is reviewed before publication.
  补: { region: "拓展知识", section: "拓展知识", confidence: 0.9, summary: () => "教材之外的拓展知识（已审阅）" },
};
// File names must survive entity renumbering when sources grow.
const stableHash = (value) => {
  let hash = 2166136261;
  for (const char of String(value)) hash = Math.imul(hash ^ char.codePointAt(0), 16777619) >>> 0;
  return hash.toString(36);
};
const MODES = { 演唱: "学习活动", 欣赏: "学习活动", 视唱: "学习活动", 背唱: "学习活动", 演奏: "学习活动", 选听选唱: "学习活动" };

const requested = process.argv.slice(2);
const available = (await readdir(sourceDir)).filter((file) => /^g\ds\d\.mjs$/.test(file)).map((file) => file.replace(".mjs", ""));
const keys = requested.length ? requested : available;
const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8").catch(() => "{}"));
const report = [];

for (const key of keys) {
  const raw = (await import(pathToFileURL(path.join(sourceDir, `${key}.mjs`)).href + `?t=${Date.now()}`)).default;
  // Sources are authored unit by unit as `parts`; flatten them into one book.
  const parts = raw.parts ?? [raw];
  const source = { ...raw, ...Object.fromEntries(["units", "works", "concepts", "people", "tasks"].map((field) => [field, parts.flatMap((part) => part[field] ?? [])])) };
  const previous = dataset.books.find((book) => book.key === key);
  if (!previous) throw new Error(`music-graph.json 中没有 ${key}`);
  const offset = source.pdfOffset;
  const pdfOf = (page) => (page && typeof page === "object" ? page.pdf : page + offset);
  const textbookPageOf = (page) => (page && typeof page === "object" ? "前置页" : String(page));

  const entities = [];
  const entityByKey = new Map();
  const workByName = new Map();
  const entity = (name, type, extra = {}) => {
    const display = WORK_TYPES.has(type) && !/^《.*》$/.test(name) ? `《${name}》` : name;
    const lookupKey = `${categoryOf(type)}|${display}`;
    let found = entityByKey.get(lookupKey) ?? (WORK_TYPES.has(type) ? workByName.get(name.replace(/^《|》$/g, "")) : undefined);
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
  const add = (subject, predicate, value, valueType, layer = "明", page) => {
    const spec = LAYERS[layer];
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
      summary: spec.summary(textbookPageOf(page)), region: spec.region, confidence: spec.confidence,
    }];
  };
  const addFacts = (subject, facts, defaultPage) => {
    for (const [predicate, value, valueType, layer = "明", page = defaultPage] of facts ?? []) add(subject, predicate, value, valueType, layer, page);
  };

  const bookName = source.title.replace(/^人音版/, "");
  const textbook = entity(bookName, "教材");
  textbook.firstPage = 1;
  addFacts(textbook, source.book, { pdf: 1 });

  // Register works first so references from other facts resolve to them.
  for (const work of source.works) {
    const created = entity(work.name, work.type, { aliases: work.aliases ?? [] });
    note(created, work.page);
    workByName.set(work.name, created);
  }

  const unitByNo = new Map();
  for (const unit of source.units) {
    const created = entity(unit.name, "单元");
    note(created, unit.page);
    unitByNo.set(unit.no, created);
    add(textbook, "包含单元", unit.name, "单元", "明", unit.page);
    add(created, "单元顺序", unit.no, null, "明", unit.page);
    addFacts(created, unit.facts, unit.page);
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
    const created = workByName.get(work.name);
    const unit = unitByNo.get(work.unit);
    if (unit) add(unit, "包含作品", work.name, work.type, "明", work.page);
    if (work.mode) add(created, "学习方式", work.mode, MODES[work.mode] ?? "学习活动", "明", work.page);
    if (work.key) add(created, "教材标注", "重点学习曲目（☆）", null, "明", work.page);
    addFacts(created, work.facts, work.page);
    attachScores(created, work);
  }
  for (const concept of source.concepts ?? []) {
    const created = entity(concept.name, concept.type);
    note(created, concept.page);
    addFacts(created, concept.facts, concept.page);
    attachScores(created, concept);
  }
  for (const person of source.people ?? []) {
    const created = entity(person.name, person.type ?? "人物");
    addFacts(created, person.facts, person.page ?? { pdf: 1 });
  }
  for (const task of source.tasks ?? []) {
    const created = entity(task.name, "课堂任务");
    note(created, task.page);
    const unit = unitByNo.get(task.unit);
    if (unit) add(unit, "包含任务", task.name, "课堂任务", "明", task.page);
    addFacts(created, task.facts, task.page);
  }
  for (const item of entities) if (item.firstPage == null) item.firstPage = textbook.firstPage;

  const relations = Object.fromEntries([...new Set(triples.map((triple) => triple.predicate))].map((predicate) => [predicate, predicate]));
  const works = entities.filter((item) => WORK_TYPES.has(item.type));
  const structural = triples.filter((triple) => ["包含单元", "单元顺序", "包含作品", "包含任务"].includes(triple.predicate)).length;
  const book = {
    key, title: source.title, source: "逐页重读", grade: previous.grade, semester: previous.semester, pages: previous.pages,
    entityCount: entities.length, tripleCount: triples.length, evidenceCount: triples.length,
    workCount: works.length, reviewCount: 0, structureShare: Math.round((structural / triples.length) * 1000) / 1000,
    publishedCount: triples.length, candidateCount: 0, structuralCount: structural,
    entities, triples, candidateTriples: [], structuralTriples: [], evidenceByTriple, relations,
    resourceSlots: works.flatMap((work) => (work.media ?? []).map((asset) => ({ workId: work.id, kind: "谱例", title: asset.title, url: asset.url, status: "已挂载" }))),
  };
  book.resourceSlotCount = book.resourceSlots.length;
  dataset.books[dataset.books.findIndex((item) => item.key === key)] = book;
  manifest[key] = media;

  const layers = Object.fromEntries(Object.keys(LAYERS).map((layer) => [LAYERS[layer].region, triples.filter((triple) => triple.section === LAYERS[layer].section).length]));
  report.push({ key, entities: entities.length, triples: triples.length, entityRelations: triples.filter((triple) => triple.objectId).length, works: works.length, scores: media.length, duplicatesSkipped: duplicates, layers });
}

dataset.version = `${new Date().toISOString().slice(0, 10)}-textbook-reread`;
dataset.generatedAt = new Date().toISOString();
await writeFile(datasetPath, JSON.stringify(dataset), "utf8");
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
