import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import Module from "node:module";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { BOOK_BY_KEY, EDITION, PUBLISHED_BOOK_KEYS } from "../data/books.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_ROOT = path.join(ROOT, "public");
const BOOK_KEYS = PUBLISHED_BOOK_KEYS;
const require = createRequire(import.meta.url);

// The shared data helpers and melody catalog are TypeScript modules. Transpile
// them in memory so this build step uses the exact runtime rules without a new dependency.
Module._extensions[".ts"] = (module, filename) => {
  const source = readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  module._compile(output, filename);
};

const { isWorkType } = require(path.join(ROOT, "app/lib/app/types.ts"));
const { getPrintedPage, getScoreMedia, hasMelody, isStarredWork, parseUnitTask } = require(path.join(ROOT, "app/lib/app/unit-data.ts"));
const { MELODIES } = require(path.join(ROOT, "app/lib/lesson/melodies.ts"));

const KEYWORD_PREDICATE_TYPES = new Map([
  ["音乐体裁", "音乐体裁"],
  ["表现主题", "主题与情感"],
  ["表现情感", "主题与情感"],
  ["情绪特点", "主题与情感"],
  ["主题性质", "主题与情感"],
  ["拍号", "拍号"],
  ["节拍特点", "拍号"],
  ["调号", "调性"],
  ["调性", "调性"],
  ["速度", "速度术语"],
  ["速度特点", "速度术语"],
  ["速度术语", "速度术语"],
  ["节奏特点", "节奏型"],
  ["典型节奏", "节奏型"],
  ["节奏型", "节奏型"],
  ["表演形式", "表演形式"],
  ["演唱形式", "表演形式"],
  ["演奏形式", "表演形式"],
  ["音乐风格", "音乐风格"],
  ["风格特点", "音乐风格"],
  ["音色特点", "乐器"],
  ["乐器", "乐器"],
  ["使用乐器", "乐器"],
  ["地域", "地域"],
  ["所属地域", "地域"],
  ["所属民族", "民族"],
]);
const KEYWORD_ENTITY_TYPES = new Set([
  "音乐概念", "乐器", "拍号", "调性", "速度术语", "音乐体裁", "主题与情感",
  "地域", "民族", "节奏型", "表演形式", "音乐风格",
]);
const SUMMARY_PREDICATES = [
  "表现主题", "音乐体裁", "情绪特点", "表现情感", "情感特点", "音乐风格", "风格特点",
  "音乐特点", "旋律特点", "描绘内容", "民歌体裁", "演唱风格", "主题性质", "内容",
  "创作背景", "历史背景", "时代背景",
];
const CREATOR_PREDICATES = ["作曲", "作词", "词曲作者", "编曲", "改编"];
const FINANCIAL_DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];

const valueOf = (triple, entityById) => {
  if (triple.objectId) return entityById.get(triple.objectId)?.name ?? triple.literal ?? "";
  return triple.literal ?? "";
};

const financialNumeral = (order) => {
  if (order >= 0 && order < FINANCIAL_DIGITS.length) return FINANCIAL_DIGITS[order];
  if (order === 10) return "拾";
  if (order > 10 && order < 20) return `拾${FINANCIAL_DIGITS[order - 10]}`;
  if (order > 20 && order < 100) return `${FINANCIAL_DIGITS[Math.floor(order / 10)]}拾${order % 10 ? FINANCIAL_DIGITS[order % 10] : ""}`;
  return String(order);
};

const bookJson = async (bookKey) => JSON.parse(await readFile(path.join(PUBLIC_ROOT, "data", "books", `${bookKey}.json`), "utf8"));

const buildUnit = (unit, index, bookKey, entityById, triplesBySubject, workByName) => {
  const unitTriples = triplesBySubject.get(unit.id) ?? [];
  const orderValue = Number(unitTriples.find((triple) => triple.predicate === "单元顺序")?.literal);
  const order = Number.isInteger(orderValue) && orderValue > 0 ? orderValue : index + 1;
  const unitWorkIds = new Set(unitTriples
    .filter((triple) => triple.predicate === "包含作品" && triple.objectId)
    .map((triple) => triple.objectId));
  const unitWorks = [...unitWorkIds]
    .map((id) => entityById.get(id))
    .filter((entity) => entity && isWorkType(entity.type))
    .sort((a, b) => (a.firstPage ?? 0) - (b.firstPage ?? 0) || a.name.localeCompare(b.name, "zh"));

  const works = unitWorks.map((work) => {
    const ownTriples = triplesBySubject.get(work.id) ?? [];
    const media = getScoreMedia(work.media);
    const scores = media
      .map((asset) => asset.url)
      .filter((url) => typeof url === "string" && url.startsWith(`media/scores/${bookKey}/`))
      .filter((url) => existsSync(path.join(PUBLIC_ROOT, url)));
    const authorRows = [];
    for (const role of CREATOR_PREDICATES) {
      for (const triple of ownTriples.filter((item) => item.predicate === role)) {
        const name = valueOf(triple, entityById).trim();
        if (!name) continue;
        const existing = authorRows.find((item) => item.name === name);
        if (existing) existing.roles.push(role);
        else authorRows.push({ name, roles: [role] });
      }
    }
    const authors = authorRows.slice(0, 3).map(({ name, roles }) => ({
      role: roles.includes("词曲作者") || (roles.includes("作词") && roles.includes("作曲")) ? "词曲" : [...new Set(roles)].join("/"),
      name,
    }));
    const summaryParts = [];
    for (const predicate of SUMMARY_PREDICATES) {
      const summaryValue = ownTriples.find((triple) => triple.predicate === predicate);
      const text = summaryValue ? valueOf(summaryValue, entityById).trim() : "";
      if (text && !summaryParts.includes(text)) summaryParts.push(text);
      if (summaryParts.length === 3) break;
    }

    return {
      id: work.id,
      name: work.name,
      type: work.type,
      modes: [...new Set(ownTriples.filter((triple) => triple.predicate === "学习方式").map((triple) => valueOf(triple, entityById).trim()).filter(Boolean))],
      authors,
      page: getPrintedPage(media),
      pdfPage: work.firstPage ?? null,
      starred: isStarredWork(ownTriples),
      hasMelody: hasMelody(work.name, MELODIES),
      scores,
      year: null,
      region: null,
      summary: summaryParts.join(" · "),
    };
  });

  // Section-based books (人教版) also list activities that are not musical works — a story, a game,
  // a theory corner — under the textbook section (学习方式) they belong to, in page order. Opt-in per edition.
  const pdfOffset = BOOK_BY_KEY.get(bookKey)?.pdfOffset ?? 0;
  const activities = [...unitWorkIds]
    .map((id) => entityById.get(id))
    .filter((entity) => EDITION.unitActivities && entity && !isWorkType(entity.type))
    .map((entity) => ({
      id: entity.id,
      name: entity.name,
      section: valueOf((triplesBySubject.get(entity.id) ?? []).find((triple) => triple.predicate === "学习方式") ?? {}, entityById).trim() || entity.type,
      page: Number.isInteger(entity.firstPage) ? entity.firstPage - pdfOffset : null,
    }))
    .sort((a, b) => (a.page ?? 0) - (b.page ?? 0) || a.name.localeCompare(b.name, "zh"));

  const parsedTasks = unitTriples
    .filter((triple) => triple.predicate === "课堂任务")
    .map((triple) => parseUnitTask(valueOf(triple, entityById)));
  // A task may name a work from another unit (or a same-named entity modelled in another book).
  // Only link works that belong to THIS unit, so a task card never jumps to a song missing from the unit page;
  // names that are not unit works stay in the task text and are listed in `relatedNames` for the UI to show as plain text.
  const bareName = (name) => String(name ?? "").replace(/[《》\s]/g, "");
  const unitWorkByName = new Map(works.map((work) => [bareName(work.name), work]));
  const tasks = parsedTasks.map((task) => ({
    text: task.text,
    works: task.works.map((name) => unitWorkByName.get(bareName(name))?.id).filter(Boolean),
    relatedNames: task.works.filter((name) => !unitWorkByName.has(bareName(name))),
    focus: task.focus,
  }));
  const goals = [...new Set(unitTriples
    .filter((triple) => triple.predicate === "学习目标")
    .map((triple) => valueOf(triple, entityById).trim())
    .filter(Boolean))];
  const theme = valueOf(unitTriples.find((triple) => triple.predicate === "单元主题") ?? {}, entityById);
  const keywordCounts = new Map();
  for (const work of unitWorks) {
    const seenForWork = new Set();
    for (const triple of triplesBySubject.get(work.id) ?? []) {
      const target = triple.objectId ? entityById.get(triple.objectId) : undefined;
      const type = KEYWORD_PREDICATE_TYPES.get(triple.predicate)
        ?? (KEYWORD_ENTITY_TYPES.has(target?.type) ? target.type : undefined);
      const name = valueOf(triple, entityById).trim();
      if (!type || !name) continue;
      const key = `${type}\u0000${name}`;
      if (seenForWork.has(key)) continue;
      seenForWork.add(key);
      const current = keywordCounts.get(key);
      if (current) current.count += 1;
      else keywordCounts.set(key, { name, type, count: 1, firstSeen: keywordCounts.size });
    }
  }
  const keywords = [...keywordCounts.values()]
    .sort((a, b) => b.count - a.count || a.firstSeen - b.firstSeen || a.name.localeCompare(b.name, "zh"))
    .slice(0, 12)
    .map(({ name, type, count }) => ({ name, type, count }));
  const pages = works.map((work) => work.page).filter(Number.isInteger);
  const pageValues = pages.length ? pages : works.map((work) => work.pdfPage).filter(Number.isInteger);
  const pageRange = pageValues.length
    ? [Math.min(...pageValues), Math.max(...pageValues)]
    : [];
  const name = unit.name;
  const title = name.replace(/^第[一二三四五六七八九十0-9]+单元\s*/, "");
  const result = {
    bookKey,
    order,
    id: unit.id,
    name,
    title,
    numeral: financialNumeral(order),
    theme,
    goals,
    tasks,
    works,
    ...(activities.length ? { activities } : {}),
    keywords,
    stats: {
      works: works.length,
      starred: works.filter((work) => work.starred).length,
      withMelody: works.filter((work) => work.hasMelody).length,
      pages: pageRange,
    },
  };
  if (!/^第[一二三四五六七八九十0-9]+单元/.test(name)) result.kind = "project";
  return result;
};

const units = [];
for (const bookKey of BOOK_KEYS) {
  const book = await bookJson(bookKey);
  const entityById = new Map(book.entities.map((entity) => [entity.id, entity]));
  const triplesBySubject = new Map();
  for (const triple of book.triples) {
    if (!triplesBySubject.has(triple.subject)) triplesBySubject.set(triple.subject, []);
    triplesBySubject.get(triple.subject).push(triple);
  }
  const workByName = new Map(book.entities
    .filter((entity) => isWorkType(entity.type))
    .map((entity) => [entity.name, entity]));
  const sourceUnits = book.entities
    .filter((entity) => entity.type === "单元")
    .sort((a, b) => (a.firstPage ?? 0) - (b.firstPage ?? 0) || a.name.localeCompare(b.name, "zh"));
  units.push(...sourceUnits.map((unit, index) => buildUnit(unit, index, bookKey, entityById, triplesBySubject, workByName)));
}

const outputPath = path.join(PUBLIC_ROOT, "data", "units.json");
await mkdir(path.dirname(outputPath), { recursive: true });
const serialized = JSON.stringify(units);
await writeFile(outputPath, serialized, "utf8");
console.log(`UNITS_DATA_WRITTEN ${outputPath} ${Buffer.byteLength(serialized)} bytes ${units.length} units`);
