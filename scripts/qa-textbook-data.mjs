// 教材数据只读质检（T002 建立，T004 修正页码口径并补充检查）。
// 输入：public/data/books/<册>.json 的 entities[] / triples[]。
// 输出：Markdown 报告 + JSON 明细。**不修改任何教材数据，也不写 public/**。
// 检查项与判定规则见生成的报告开头「判定规则」一节。

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const rootPath = fileURLToPath(root);
const publicPath = path.join(rootPath, "public");
const BOOK_KEYS = ["g7s1", "g7s2", "g8s1", "g8s2", "g9s1", "g9s2"];
const REPORT_PATH =
  process.env.QA_REPORT_PATH ??
  "E:\\Projects\\yapu-collab\\ds1\\outbox\\T002-data-qa-report.md";
const JSON_PATH = process.env.QA_JSON_PATH ?? "E:\\Projects\\.tmp\\ds1\\qa.json";
const DETAIL_LIMIT = 30;

// ---- 判定规则（要改判定口径就改这一段）------------------------------------

// 「作品类」实体类型：由实体 type 字段的实测分布决定。
// 比 app/lib/app/types.ts:217 的 WORK_TYPES 多一个「来源作品」，少「音乐作品」「戏曲歌曲」
//（后两者在当前数据里没有实例）；保持这个口径可以让 T002 报告里已被复核过的数量不变。
const WORK_TYPES = new Set([
  "歌曲",
  "合唱作品",
  "器乐曲",
  "交响作品",
  "歌剧音乐",
  "戏曲选段",
  "舞蹈音乐",
  "影视音乐",
  "进行曲",
  "民歌",
  "朗诵作品",
  "来源作品",
]);

// 作者类谓语：出现任意一条即认为该作品「有作者归属」。
const AUTHOR_PREDICATES = new Set([
  "作曲",
  "作词",
  "词曲作者",
  "作曲者",
  "曲作者",
  "词曲",
  "填词",
  "编曲",
  "改编",
  "改编者",
  "原词作者",
  "作词执笔",
  "歌曲作词",
  "配歌",
  "译配",
  "译词",
  "记谱译词",
  "整理",
  "整理改编",
  "搜集整理",
  "传谱",
  "译谱",
  "编合唱",
  "编配",
  "配器",
  "作者",
]);

// 「民间 / 传统」标记谓语：这类作品的作者本来就不存在或无从查证。
const FOLK_PREDICATES = new Set([
  "所属民族",
  "民歌体裁",
  "民歌类别",
  "流传地区",
  "流传情况",
  "原始形态",
  "曲调来源",
  "原曲",
  "素材来源",
]);

// 「民间 / 传统」标记类型。
const FOLK_TYPES = new Set(["民歌", "戏曲选段"]);

// 字面值或关联实体名里出现这些词，也视为「民间 / 传统」标记。
const FOLK_KEYWORDS = ["民间", "民歌", "佚名", "传统", "口传"];

const THEME_PREDICATES = ["表现主题"];
const GENRE_PREDICATES = ["音乐体裁"];

// 单元 → 作品、单元 → 学习目标 的关系谓语。
const UNIT_WORK_PREDICATES = new Set(["包含作品"]);
const UNIT_GOAL_PREDICATES = new Set(["学习目标"]);

// 页码是「缺失时的默认值」，不是真实教材页码。
const PLACEHOLDER_PAGE = 1;

const GARBAGE_PATTERN = /[?？\uFFFD\u0000]/;
const DOUBLE_SPACE_PATTERN = /\s\s/;
const BRACKET_SPACE_PATTERN = /《\s|\s》/;

// ---- 读数据 ---------------------------------------------------------------

const pushTo = (map, key, value) => {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
};

const readBookTitle = async (key) => {
  try {
    const mod = await import(new URL(`content/textbooks/${key}.mjs`, root));
    return mod.default?.title ?? key;
  } catch {
    // 源文件读不到就退回册号，不影响质检结论。
    return key;
  }
};

// 与 app/lib/app/unit-data.ts:29 的 getPrintedPage 同一套规则：
// 教材上印刷的页码藏在 media[].title 的「教材第N页」里，firstPage 是 PDF 页码。
// 网站展示用的是印刷页（scripts/build-units.mjs:133 把它写成 work.page）。
const printedPageOf = (entity) => {
  const match = (entity.media ?? [])
    .map((asset) => asset.title?.match(/教材第(\d+)页/)?.[1])
    .find(Boolean);
  return match ? Number(match) : null;
};

// 与 scripts/build-units.mjs:101-105 同一套规则：kind === "score"、
// URL 必须落在本册的 media/scores/<册>/ 下、且文件真的存在。
const scoreUrlsOf = (entity, bookKey) =>
  (entity.media ?? [])
    .filter((asset) => asset.kind === "score")
    .map((asset) => asset.url)
    .filter(
      (url) =>
        typeof url === "string" &&
        url.startsWith(`media/scores/${bookKey}/`) &&
        existsSync(path.join(publicPath, url)),
    );

const books = [];
for (const key of BOOK_KEYS) {
  const data = JSON.parse(
    await readFile(new URL(`public/data/books/${key}.json`, root), "utf8"),
  );
  const entities = data.entities ?? [];
  const triples = data.triples ?? [];
  const byId = new Map(entities.map((entity) => [entity.id, entity]));
  const outgoing = new Map();
  const incoming = new Map();
  for (const triple of triples) {
    pushTo(outgoing, triple.subject, triple);
    if (triple.objectId) pushTo(incoming, triple.objectId, triple);
  }
  const works = entities.filter((entity) => WORK_TYPES.has(entity.type));

  const units = entities.filter((entity) => entity.type === "单元");
  const unitOf = new Map();
  const unitsWithoutGoal = [];
  for (const unit of units) {
    const unitTriples = outgoing.get(unit.id) ?? [];
    for (const triple of unitTriples) {
      if (UNIT_WORK_PREDICATES.has(triple.predicate) && triple.objectId) {
        pushTo(unitOf, triple.objectId, unit);
      }
    }
    if (!unitTriples.some((triple) => UNIT_GOAL_PREDICATES.has(triple.predicate))) {
      unitsWithoutGoal.push({ name: unit.name, page: unit.firstPage, id: unit.id });
    }
  }

  const printedPages = entities
    .map((entity) => printedPageOf(entity))
    .filter((page) => Number.isInteger(page));

  books.push({
    key,
    title: await readBookTitle(key),
    entities,
    triples,
    byId,
    outgoing,
    incoming,
    works,
    units,
    unitsWithoutGoal,
    unitOf,
    maxPage: entities.reduce(
      (max, entity) => Math.max(max, Number(entity.firstPage) || 0),
      0,
    ),
    maxPrintedPage: printedPages.length ? Math.max(...printedPages) : 0,
  });
}

const normName = (name) =>
  String(name ?? "")
    .replace(/[《》]/g, "")
    .replace(/\s/g, "")
    .trim();

// 实体名本身可能已经带《》，渲染时不要重复加。
const titleOf = (name) => {
  const text = String(name ?? "");
  return text.includes("《") || text.includes("》") ? text : `《${text}》`;
};

const hasFolkMarker = (book, entity) => {
  if (FOLK_TYPES.has(entity.type)) return true;
  for (const triple of [
    ...(book.outgoing.get(entity.id) ?? []),
    ...(book.incoming.get(entity.id) ?? []),
  ]) {
    if (FOLK_PREDICATES.has(triple.predicate)) return true;
    const text =
      typeof triple.literal === "string"
        ? triple.literal
        : String(book.byId.get(triple.objectId)?.name ?? "");
    if (FOLK_KEYWORDS.some((word) => text.includes(word))) return true;
    if (FOLK_KEYWORDS.some((word) => triple.predicate.includes(word))) return true;
  }
  return false;
};

const hasAuthor = (book, entity) =>
  (book.outgoing.get(entity.id) ?? []).some((triple) =>
    AUTHOR_PREDICATES.has(triple.predicate),
  );

const hasAnyPredicate = (book, entity, predicates) =>
  (book.outgoing.get(entity.id) ?? []).some((triple) =>
    predicates.includes(triple.predicate),
  );

// ---- 检查 -----------------------------------------------------------------

const workEntry = (book, work, unitNames) => ({
  book: book.key,
  bookTitle: book.title,
  id: work.id,
  name: work.name,
  type: work.type,
  page: printedPageOf(work),
  pdfPage: work.firstPage ?? null,
  units: unitNames ?? (book.unitOf.get(work.id) ?? []).map((unit) => unit.name),
});

const pageText = (item) =>
  item.page == null ? `无印刷页（PDF 第 ${item.pdfPage} 页）` : `教材第 ${item.page} 页（PDF 第 ${item.pdfPage} 页）`;

const results = {
  missingAuthor: [],
  missingPage: [],
  placeholderPage: [],
  unitPageOrder: [],
  duplicateName: [],
  missingTheme: [],
  missingGenre: [],
  emptyType: [],
  dangling: [],
  charIssue: [],
  unitGoal: [],
  workScore: [],
};

const unitStats = [];
const folkSkipped = new Map();
const orderSkipped = new Map();

for (const book of books) {
  // 1. 作品缺作者（排除带民间/传统标记的）
  for (const work of book.works) {
    if (hasAuthor(book, work)) continue;
    if (hasFolkMarker(book, work)) {
      folkSkipped.set(book.key, (folkSkipped.get(book.key) ?? 0) + 1);
      continue;
    }
    results.missingAuthor.push(workEntry(book, work));
  }

  // 2. 作品缺页码：2a 两个字段都没有；2b 页码是缺失时的默认值 1
  for (const work of book.works) {
    const printed = printedPageOf(work);
    if (!work.firstPage && !printed) {
      results.missingPage.push(workEntry(book, work, []));
      continue;
    }
    if (Number(work.firstPage) === PLACEHOLDER_PAGE && printed == null) {
      results.placeholderPage.push(workEntry(book, work));
    }
  }

  // 3. 单元内作品页码乱序 / 越界（一律用教材印刷页比较，不用 firstPage）
  for (const unit of book.units) {
    const targets = (book.outgoing.get(unit.id) ?? [])
      .filter((triple) => UNIT_WORK_PREDICATES.has(triple.predicate) && triple.objectId)
      .map((triple) => book.byId.get(triple.objectId))
      .filter(Boolean);
    let previous = null;
    for (const work of targets) {
      const printed = printedPageOf(work);
      if (printed == null) {
        orderSkipped.set(book.key, (orderSkipped.get(book.key) ?? 0) + 1);
        continue;
      }
      if (previous && printed < previous.printed) {
        results.unitPageOrder.push({
          ...workEntry(book, work, [unit.name]),
          issue: "乱序",
          detail: `教材第 ${printed} 页 < 上一首 ${titleOf(previous.name)} 的教材第 ${previous.printed} 页`,
        });
      }
      if (printed > book.maxPrintedPage) {
        results.unitPageOrder.push({
          ...workEntry(book, work, [unit.name]),
          issue: "越界",
          detail: `教材第 ${printed} 页 > 本册最大印刷页 ${book.maxPrintedPage}`,
        });
      }
      previous = { name: work.name, printed };
    }
  }
  unitStats.push({
    book,
    rows: book.units.map((unit) => ({
      name: unit.name,
      page: printedPageOf(unit) ?? unit.firstPage,
      goals: (book.outgoing.get(unit.id) ?? []).filter((triple) =>
        UNIT_GOAL_PREDICATES.has(triple.predicate),
      ).length,
      works: (book.outgoing.get(unit.id) ?? []).filter(
        (triple) => UNIT_WORK_PREDICATES.has(triple.predicate) && triple.objectId,
      ).length,
    })),
  });

  // 4. 同名作品（册内）
  const groups = new Map();
  for (const work of book.works) pushTo(groups, normName(work.name), work);
  for (const [norm, list] of groups) {
    if (list.length < 2) continue;
    results.duplicateName.push({
      book: book.key,
      name: norm,
      count: list.length,
      types: [...new Set(list.map((work) => work.type))],
      detail: list.map((work) => `${work.name}（${work.type}）`).join(" + "),
    });
  }

  // 5. 缺表现主题 / 缺音乐体裁 / 类型为空
  const pickMissing = (predicates, bucket) => {
    for (const work of book.works) {
      if (hasAnyPredicate(book, work, predicates)) continue;
      bucket.push(workEntry(book, work));
    }
  };
  pickMissing(THEME_PREDICATES, results.missingTheme);
  pickMissing(GENRE_PREDICATES, results.missingGenre);
  for (const work of book.works) {
    if (!work.type) results.emptyType.push(workEntry(book, work, []));
  }

  // 6. 悬空引用
  for (const triple of book.triples) {
    if (!book.byId.has(triple.subject)) {
      results.dangling.push({
        book: book.key,
        triple: triple.id,
        detail: `subject=${triple.subject} 在本册实体里不存在`,
      });
    }
    if (triple.objectId && !book.byId.has(triple.objectId)) {
      results.dangling.push({
        book: book.key,
        triple: triple.id,
        detail: `objectId=${triple.objectId} 在本册实体里不存在`,
      });
    }
  }

  // 7. 字符异常
  for (const entity of book.entities) {
    const name = String(entity.name ?? "");
    const issues = [];
    if (name !== name.trim()) issues.push("首尾有空白");
    if (DOUBLE_SPACE_PATTERN.test(name)) issues.push("连续两个以上空白");
    if (BRACKET_SPACE_PATTERN.test(name)) issues.push("《》内前后有空白");
    if (GARBAGE_PATTERN.test(name)) issues.push("疑似乱码字符");
    if (
      (name.includes("（") && name.includes("(")) ||
      (name.includes("）") && name.includes(")"))
    ) {
      issues.push("全角半角括号混用");
    }
    if (issues.length === 0) continue;
    results.charIssue.push({
      book: book.key,
      name,
      type: entity.type,
      page: entity.firstPage,
      detail: issues.join("；"),
    });
  }

  // 9. 单元缺「学习目标」
  for (const unit of book.unitsWithoutGoal) {
    results.unitGoal.push({
      book: book.key,
      name: unit.name,
      page: printedPageOf(unit) ?? unit.page,
      pdfPage: unit.page,
      id: unit.id,
    });
  }

  // 10. 作品缺教材谱例
  for (const work of book.works) {
    if (scoreUrlsOf(work, book.key).length > 0) continue;
    results.workScore.push(workEntry(book, work));
  }
}

// 4b 跨册同名（同一作品出现在多册，未必是错误，单独计数）
const crossGroups = new Map();
for (const book of books) {
  for (const work of book.works) {
    pushTo(crossGroups, normName(work.name), { book: book.key, work });
  }
}
const crossBookDuplicates = [...crossGroups.entries()]
  .filter(([, list]) => new Set(list.map((item) => item.book)).size >= 2)
  .map(([name, list]) => ({
    name,
    books: [...new Set(list.map((item) => item.book))],
    types: [...new Set(list.map((item) => item.work.type))],
    sameType: new Set(list.map((item) => item.work.type)).size === 1,
    detail: list
      .map((item) => `${item.book} ${item.work.name}（${item.work.type}）`)
      .join(" + "),
  }))
  .sort(
    (a, b) =>
      Number(a.sameType) - Number(b.sameType) ||
      b.books.length - a.books.length ||
      a.name.localeCompare(b.name, "zh"),
  );

const crossSameType = crossBookDuplicates.filter((item) => item.sameType);
const crossDiffType = crossBookDuplicates.filter((item) => !item.sameType);

// ---- 汇总 -----------------------------------------------------------------

const CHECK_ROWS = [
  { key: "missingAuthor", no: "1", label: "作品缺作者" },
  { key: "missingPage", no: "2a", label: "作品完全没有页码" },
  { key: "placeholderPage", no: "2b", label: "页码是默认值 1（实为缺页码）" },
  { key: "unitPageOrder", no: "3", label: "单元内作品印刷页乱序/越界" },
  { key: "duplicateName", no: "4a", label: "同名作品（册内重复组）" },
  { key: "missingTheme", no: "5a", label: "作品缺「表现主题」" },
  { key: "missingGenre", no: "5b", label: "作品缺「音乐体裁」" },
  { key: "emptyType", no: "5c", label: "作品类型字段为空" },
  { key: "dangling", no: "6", label: "悬空引用" },
  { key: "charIssue", no: "7", label: "实体名字符异常" },
  { key: "unitGoal", no: "9", label: "单元缺「学习目标」" },
  { key: "workScore", no: "10", label: "作品缺教材谱例" },
];

const countIn = (key, bookKey) =>
  results[key].filter((item) => item.book === bookKey).length;
const totalOf = (key) =>
  BOOK_KEYS.reduce((sum, bookKey) => sum + countIn(key, bookKey), 0);
const perBookText = (key) =>
  BOOK_KEYS.map((bookKey) => `${bookKey}=${countIn(key, bookKey)}`).join("、");

const issueTotal =
  CHECK_ROWS.reduce((sum, row) => sum + totalOf(row.key), 0) +
  crossBookDuplicates.length;

// ---- 渲染 -----------------------------------------------------------------

// 明细排序：单元内的问题排前面（教学正文里看得见），再按册、按页码；
// 最后按册轮流取值，保证 30 条上限内每册都有代表，不会被某一册占满。
const bookKeyOf = (item) => item.book ?? item.books?.[0] ?? "zzz";

const orderItems = (items) => {
  const buckets = new Map();
  for (const item of [...items].sort((a, b) => {
    const aInUnit = (a.units?.length ?? 0) > 0 ? 0 : 1;
    const bInUnit = (b.units?.length ?? 0) > 0 ? 0 : 1;
    if (aInUnit !== bInUnit) return aInUnit - bInUnit;
    return (
      (Number(a.page) || 0) - (Number(b.page) || 0) ||
      String(a.name ?? "").localeCompare(String(b.name ?? ""), "zh")
    );
  })) {
    pushTo(buckets, bookKeyOf(item), item);
  }
  const queues = [...buckets.entries()].sort((a, b) => {
    const aIndex = BOOK_KEYS.indexOf(a[0]);
    const bIndex = BOOK_KEYS.indexOf(b[0]);
    return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex);
  });
  const ordered = [];
  for (let round = 0; ordered.length < items.length; round += 1) {
    let added = false;
    for (const [, queue] of queues) {
      if (round < queue.length) {
        ordered.push(queue[round]);
        added = true;
      }
    }
    if (!added) break;
  }
  return ordered;
};

const renderItems = (items, render) => {
  const ordered = orderItems(items);
  if (ordered.length === 0) return ["（无）"];
  const lines = ordered.slice(0, DETAIL_LIMIT).map(render);
  if (ordered.length > DETAIL_LIMIT) {
    lines.push(`- 另有 ${ordered.length - DETAIL_LIMIT} 条（未展开，完整明细见 JSON）`);
  }
  return lines;
};

const unitText = (item) =>
  item.units?.length ? item.units.join("、") : "（未归入单元）";

const section = (title, note, items, render, level = "###") => [
  `${level} ${title}`,
  "",
  `合计 ${items.list.length}（${perBookText(items.keyName)}）${note ? `。${note}` : ""}`,
  "",
  ...renderItems(items.list, render),
  "",
];

const table = [
  `| 检查项 | ${BOOK_KEYS.join(" | ")} | 合计 |`,
  `|---|${BOOK_KEYS.map(() => "---").join("|")}|---|`,
];
for (const row of CHECK_ROWS) {
  const cells = BOOK_KEYS.map((bookKey) => String(countIn(row.key, bookKey)));
  table.push(`| ${row.no} ${row.label} | ${cells.join(" | ")} | ${totalOf(row.key)} |`);
}
table.push(
  `| 4b 同名作品（跨册同名作品名） | ${BOOK_KEYS.map(() => "—").join(" | ")} | ${crossBookDuplicates.length} |`,
);

const bookStats = unitStats.map((stat) => ({
  key: stat.book.key,
  title: stat.book.title,
  unitCount: stat.book.units.length,
  workCount: stat.rows.reduce((sum, row) => sum + row.works, 0),
  goalCount: stat.rows.reduce((sum, row) => sum + row.goals, 0),
  goalMissing: stat.book.unitsWithoutGoal.length,
  entityCount: stat.book.entities.length,
  tripleCount: stat.book.triples.length,
  workEntities: stat.book.works.length,
  maxPage: stat.book.maxPage,
  maxPrintedPage: stat.book.maxPrintedPage,
  rows: stat.rows,
}));

const sections = [];

sections.push(
  section(
    "1. 作品缺作者",
    "已排除带民间/传统标记的作品",
    { keyName: "missingAuthor", list: results.missingAuthor },
    (item) =>
      `- ${item.book}｜${unitText(item)}｜${titleOf(item.name)}（${item.type}，${pageText(item)}，${item.id}）`,
  ),
);

sections.push([
  "### 2. 作品缺页码",
  "",
  ...section(
    "2a 两个页码字段都没有",
    "firstPage 与「教材第N页」都没有",
    { keyName: "missingPage", list: results.missingPage },
    (item) => `- ${item.book}｜${unitText(item)}｜${titleOf(item.name)}（${item.type}，${item.id}）`,
    "####",
  ),
  ...section(
    "2b 页码是缺失时的默认值 1",
    `firstPage === ${PLACEHOLDER_PAGE} 且 media 里没有「教材第N页」；PDF 第 1 页是前置页，不可能是作品所在页`,
    { keyName: "placeholderPage", list: results.placeholderPage },
    (item) =>
      `- ${item.book}｜${unitText(item)}｜${titleOf(item.name)}（${item.type}，PDF 第 ${item.pdfPage} 页，${item.id}）`,
    "####",
  ),
  `其中**在单元里**的作品 ${results.placeholderPage.filter((item) => item.units.length > 0).length} 个、**不在任何单元里**的 ${results.placeholderPage.filter((item) => item.units.length === 0).length} 个。`,
  "",
]);

sections.push(
  section(
    "3. 单元内作品印刷页乱序 / 越界",
    "按「单元 —包含作品→ 作品」的顺序，逐首比较**教材印刷页**；没有印刷页的作品跳过不比较，跳过数量见下一行",
    { keyName: "unitPageOrder", list: results.unitPageOrder },
    (item) =>
      `- ${item.book}｜${item.units.join("、")}｜${titleOf(item.name)}：${item.issue}——${item.detail}（该作品 PDF 第 ${item.pdfPage} 页）`,
  ),
);

sections.push([
  "### 4. 同名作品",
  "",
  `**4a 册内重复组**（同一册里两个及以上同名的作品实体，去掉《》和空白后比较）：合计 ${results.duplicateName.length}（${perBookText("duplicateName")}）`,
  "",
  ...renderItems(
    results.duplicateName,
    (item) => `- ${item.book}｜${item.name}：${item.count} 个 → ${item.detail}`,
  ),
  "",
  `**4b 跨册同名**（同一作品名出现在 2 册及以上）：合计 ${crossBookDuplicates.length} 个名字，其中 **${crossSameType.length} 个类型相同**（可能是同一首作品被多册选用）、**${crossDiffType.length} 个类型不同**（几乎肯定是不同作品）。`,
  "",
  `**4b-1 类型不同，几乎肯定是不同作品**（${crossDiffType.length} 个）`,
  "",
  ...renderItems(
    crossDiffType,
    (item) => `- ${item.name}｜类型：${item.types.join(" / ")} → ${item.detail}`,
  ),
  "",
  `**4b-2 类型相同，可能是同一首作品被多册选用**（${crossSameType.length} 个）`,
  "",
  ...renderItems(
    crossSameType,
    (item) => `- ${item.name}｜${item.types[0]} → ${item.detail}`,
  ),
  "",
]);

sections.push([
  "### 5. 作品缺表现主题 / 音乐体裁 / 类型",
  "",
  ...section(
    "5a 缺「表现主题」",
    "",
    { keyName: "missingTheme", list: results.missingTheme },
    (item) =>
      `- ${item.book}｜${unitText(item)}｜${titleOf(item.name)}（${item.type}，${pageText(item)}，${item.id}）`,
    "####",
  ),
  ...section(
    "5b 缺「音乐体裁」",
    "",
    { keyName: "missingGenre", list: results.missingGenre },
    (item) =>
      `- ${item.book}｜${unitText(item)}｜${titleOf(item.name)}（${item.type}，${pageText(item)}，${item.id}）`,
    "####",
  ),
  ...section(
    "5c 类型字段为空",
    "",
    { keyName: "emptyType", list: results.emptyType },
    (item) => `- ${item.book}｜${titleOf(item.name)}（${item.id}）`,
    "####",
  ),
]);

sections.push(
  section(
    "6. 悬空引用",
    "三元组的 subject 或 objectId 在本册实体里找不到",
    { keyName: "dangling", list: results.dangling },
    (item) => `- ${item.book}｜${item.triple}：${item.detail}`,
  ),
);

sections.push(
  section(
    "7. 实体名字符异常",
    "检查首尾空白、连续空白、《》内空白、疑似乱码、全角半角括号混用",
    { keyName: "charIssue", list: results.charIssue },
    (item) =>
      `- ${item.book}｜${JSON.stringify(item.name)}（${item.type}，PDF 第 ${item.page} 页）：${item.detail}`,
  ),
);

sections.push([
  "### 8. 单元统计",
  "",
  "只列数字，和教材实际情况是否一致需要人工判断。",
  "",
  "| 册 | 实体 | 关系 | 作品类实体 | 单元 | 「包含作品」关系 | 「学习目标」条数 | 本册最大印刷页 | 最大 PDF 页 |",
  "|---|---|---|---|---|---|---|---|---|",
  ...bookStats.map(
    (stat) =>
      `| ${stat.key} ${stat.title} | ${stat.entityCount} | ${stat.tripleCount} | ${stat.workEntities} | ${stat.unitCount} | ${stat.workCount} | ${stat.goalCount} | ${stat.maxPrintedPage} | ${stat.maxPage} |`,
  ),
  "",
  ...bookStats.flatMap((stat) => [
    `**${stat.title}（${stat.key}）**`,
    "",
    ...stat.rows.map(
      (row) => `- ${row.name}（教材第 ${row.page} 页起）：作品 ${row.works} 首、学习目标 ${row.goals} 条`,
    ),
    "",
  ]),
]);

sections.push(
  section(
    "9. 单元缺「学习目标」",
    "新界面的「本单元先读」区块要用学习目标，缺了这块会空着",
    { keyName: "unitGoal", list: results.unitGoal },
    (item) =>
      `- ${item.book}｜${item.name}（教材第 ${item.page} 页起，PDF 第 ${item.pdfPage} 页，${item.id}）`,
  ),
);

sections.push(
  section(
    "10. 作品缺教材谱例",
    "判断依据同 scripts/build-units.mjs:101-105：media 里 kind 为 score、URL 落在本册 media/scores/<册>/ 下、文件真实存在",
    { keyName: "workScore", list: results.workScore },
    (item) =>
      `- ${item.book}｜${unitText(item)}｜${titleOf(item.name)}（${item.type}，${pageText(item)}）`,
  ),
);

// ---- 人工核对优先级 --------------------------------------------------------

const candidates = [];
const addCandidate = (kind, bookKey, score, text, reason) =>
  candidates.push({ kind, bookKey, score, text, reason });

for (const item of results.dangling) {
  addCandidate(
    "dangling",
    item.book,
    100,
    `${item.book}｜悬空引用 ${item.triple}：${item.detail}`,
    "指向不存在的实体，页面会出现空节点或断链，属于数据完整性错误",
  );
}
for (const item of results.unitPageOrder) {
  addCandidate(
    "pageOrder",
    item.book,
    item.issue === "越界" ? 95 : 88,
    `${item.book}｜${item.units.join("、")}｜${titleOf(item.name)}：${item.issue}（${item.detail}）`,
    item.issue === "越界"
      ? "印刷页超出本册范围，教材页码展示会明显出错"
      : "单元里的作品顺序和教材印刷页矛盾，单元页上的作品卡片顺序会看起来不对",
  );
}
for (const item of results.duplicateName) {
  addCandidate(
    "dupInBook",
    item.book,
    80,
    `${item.book}｜册内同名作品：${item.detail}`,
    "同一册出现两个同名作品实体，可能是重复建模，列表里会出现重复条目",
  );
}
for (const item of results.workScore) {
  if (item.units.length === 0) continue;
  addCandidate(
    "workScore",
    item.book,
    65,
    `${item.book}｜${item.units.join("、")}｜${titleOf(item.name)}缺少教材谱例`,
    "这首歌在单元正文里，但 media/scores 下没有对应谱例图片，新界面的作品卡片会缺谱",
  );
}
for (const item of results.missingAuthor) {
  if (item.units.length === 0) continue;
  addCandidate(
    "missingAuthor",
    item.book,
    60,
    `${item.book}｜${item.units.join("、")}｜${titleOf(item.name)}（${item.type}，${pageText(item)}）缺作者`,
    "单元正文里当作教学作品使用，却查不到作曲/作词，改版后的作品卡片作者栏会空着",
  );
}
for (const item of results.unitGoal) {
  addCandidate(
    "unitGoal",
    item.book,
    55,
    `${item.book}｜${item.name}缺「学习目标」`,
    "新界面的「本单元先读」要用学习目标，缺了这块会空着",
  );
}
for (const item of crossDiffType) {
  addCandidate(
    "crossDiffType",
    item.books[0],
    50,
    `跨册同名但类型不同：${item.name}（${item.types.join(" / ")}）出现在 ${item.books.join("、")}`,
    "同名不同曲被建成了同名实体，检索或合并时容易张冠李戴",
  );
}
for (const item of results.placeholderPage) {
  addCandidate(
    "placeholderPage",
    item.book,
    40,
    `${item.book}｜${titleOf(item.name)}的页码是默认值 1，其实缺页码`,
    "PDF 第 1 页是前置页，展示出去会是一个明显的错误页码",
  );
}
for (const item of crossSameType) {
  addCandidate(
    "crossSameType",
    item.books[0],
    35,
    `跨册同名作品：${item.name}（${item.types[0]}）出现在 ${item.books.join("、")}`,
    "同一首歌在多册各建了实体，需要判断是否该合并或加限定名",
  );
}
for (const item of results.missingTheme) {
  if (item.units.length === 0) continue;
  addCandidate(
    "missingTheme",
    item.book,
    30,
    `${item.book}｜${item.units.join("、")}｜${titleOf(item.name)}缺「表现主题」`,
    "改版要求每首作品展示表现主题，缺这项的卡片会留空",
  );
}
for (const item of results.missingGenre) {
  if (item.units.length === 0) continue;
  addCandidate(
    "missingGenre",
    item.book,
    25,
    `${item.book}｜${item.units.join("、")}｜${titleOf(item.name)}缺「音乐体裁」`,
    "改版要求每首作品展示体裁，缺这项的卡片会留空",
  );
}

const ranked = candidates.sort(
  (a, b) => b.score - a.score || a.text.localeCompare(b.text, "zh"),
);

// 第一轮做多样性配额（同类最多 2 条、同册最多 2 条），不足 10 条再放宽补满。
const pickWithQuota = (perKind, perBook, limit, taken) => {
  const seenKind = new Map();
  const seenBook = new Map();
  for (const item of taken) {
    seenKind.set(item.kind, (seenKind.get(item.kind) ?? 0) + 1);
    seenBook.set(item.bookKey, (seenBook.get(item.bookKey) ?? 0) + 1);
  }
  for (const item of ranked) {
    if (taken.length >= limit) break;
    if (taken.includes(item)) continue;
    if ((seenKind.get(item.kind) ?? 0) >= perKind) continue;
    if ((seenBook.get(item.bookKey) ?? 0) >= perBook) continue;
    seenKind.set(item.kind, (seenKind.get(item.kind) ?? 0) + 1);
    seenBook.set(item.bookKey, (seenBook.get(item.bookKey) ?? 0) + 1);
    taken.push(item);
  }
  return taken;
};

const TOP_LIMIT = 10;
const topTen = pickWithQuota(2, 2, TOP_LIMIT, []);
pickWithQuota(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, TOP_LIMIT, topTen);
const topShortfall = TOP_LIMIT - topTen.length;

// ---- 组装报告 -------------------------------------------------------------

const rules = [
  "- **作品类类型**（`WORK_TYPES`，取自实体 `type` 的实测分布）：" +
    [...WORK_TYPES].join("、") +
    "。比 `app/lib/app/types.ts:217` 的 `WORK_TYPES` 多一个「来源作品」（10 个实例），少「音乐作品」「戏曲歌曲」（当前数据里没有实例）。",
  "- **作者类谓语**（`AUTHOR_PREDICATES`，命中任意一条即算「有作者」）：" +
    [...AUTHOR_PREDICATES].join("、"),
  "- **民间/传统标记**（`FOLK_PREDICATES`、`FOLK_TYPES`、关键词 `" +
    FOLK_KEYWORDS.join("、") +
    "`）：" +
    [...FOLK_PREDICATES].join("、") +
    "；类型 " +
    [...FOLK_TYPES].join("、") +
    "。命中即认为该作品本来就没有具名作者，不计入第 1 项。",
  "- **页码**：教材上印刷的页码在实体 `media[].title` 的「教材第N页」里（规则同 `app/lib/app/unit-data.ts:29` 的 `getPrintedPage`，网站展示用的就是它，见 `scripts/build-units.mjs:133`）；`firstPage` 是 **PDF 页码**，两者相差约 8 页。**除第 2 项外，所有页码比较都用印刷页**；`firstPage === 1` 且没有印刷页的，视为缺页码（第 2b 项）。",
  `- **本册最大印刷页**：${bookStats.map((stat) => `${stat.key}=${stat.maxPrintedPage}`).join("、")}；最大 PDF 页：${bookStats.map((stat) => `${stat.key}=${stat.maxPage}`).join("、")}。`,
  "- **同名比较**：实体名去掉 `《》` 和所有空白后比较。",
  "- **谱例**：`media` 里 `kind` 为 `score`、URL 落在本册 `media/scores/<册>/` 下、且文件真实存在，三者都满足才算有谱例（规则同 `scripts/build-units.mjs:101-105`）。",
  "- 每个检查项明细最多列 30 条（单元内的问题优先，并按册轮流取值），超出写「另有 N 条」；第 8 节是统计不是问题。",
];

const report = [
  "# 教材数据质检报告（只读，未修改任何数据）",
  "",
  `生成时间：${new Date().toISOString()}`,
  "",
  `数据来源：\`public/data/books/*.json\`，6 册共 ${bookStats.reduce((sum, stat) => sum + stat.entityCount, 0)} 个实体、${bookStats.reduce((sum, stat) => sum + stat.tripleCount, 0)} 条关系，其中作品类实体 ${bookStats.reduce((sum, stat) => sum + stat.workEntities, 0)} 个。`,
  "",
  "本报告只读，任何数值都没有写回教材数据。检查规则：",
  "",
  ...rules,
  "",
  `**问题合计：${issueTotal} 条**（第 1–7、9、10 项条目数之和，另含跨册同名 ${crossBookDuplicates.length} 个名字；第 8 节是统计，不计入）。`,
  "",
  "## 汇总表",
  "",
  ...table,
  "",
  `另有 ${[...folkSkipped.values()].reduce((sum, value) => sum + value, 0)} 个作品没有作者类关系，但带民间/传统标记，按规则未计入第 1 项（${BOOK_KEYS.map((bookKey) => `${bookKey}=${folkSkipped.get(bookKey) ?? 0}`).join("、")}）。`,
  "",
  `第 3 项里另有 ${[...orderSkipped.values()].reduce((sum, value) => sum + value, 0)} 首单元作品没有印刷页，无法参与页码比较，已跳过（${BOOK_KEYS.map((bookKey) => `${bookKey}=${orderSkipped.get(bookKey) ?? 0}`).join("、")}）。`,
  "",
  "## 明细",
  "",
  ...sections.flat(),
  "## 需要人工核对的最重要的 10 条",
  "",
  "排序依据：数据完整性错误（悬空引用、页码越界）> 结构性矛盾（单元内页码倒序、同名不同曲）> 新界面会直接空掉的字段（单元学习目标、作品谱例、作者）> 页码占位值 > 表现主题与体裁。同一类问题最多取 2 条、同一册最多取 2 条，避免前 10 条被同一处问题占满。",
  "",
  ...(topTen.length === 0
    ? ["（无）"]
    : topTen.map((item, index) => `${index + 1}. ${item.text}　→ ${item.reason}`)),
  ...(topShortfall > 0
    ? [
        "",
        `注：符合「单元正文里会直接展示、又确实缺东西」的候选问题只有 ${topTen.length} 条，排不满 ${TOP_LIMIT} 条。未归入单元的补充作品不纳入候选。`,
      ]
    : []),
  "",
];

await writeFile(REPORT_PATH, report.join("\n"), "utf8");
await mkdir(JSON_PATH.replace(/[\\/][^\\/]+$/, ""), { recursive: true });
await writeFile(
  JSON_PATH,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      issueTotal,
      counts: Object.fromEntries(
        CHECK_ROWS.map((row) => [
          row.key,
          Object.fromEntries(BOOK_KEYS.map((bookKey) => [bookKey, countIn(row.key, bookKey)])),
        ]).concat([
          ["duplicateNameCrossBook", { total: crossBookDuplicates.length }],
          ["duplicateNameCrossBookSameType", { total: crossSameType.length }],
          ["duplicateNameCrossBookDiffType", { total: crossDiffType.length }],
        ]),
      ),
      folkSkipped: Object.fromEntries(folkSkipped),
      orderSkipped: Object.fromEntries(orderSkipped),
      books: bookStats.map((stat) => ({
        key: stat.key,
        title: stat.title,
        entityCount: stat.entityCount,
        tripleCount: stat.tripleCount,
        workEntities: stat.workEntities,
        unitCount: stat.unitCount,
        workCount: stat.workCount,
        goalCount: stat.goalCount,
        goalMissing: stat.goalMissing,
        maxPage: stat.maxPage,
        maxPrintedPage: stat.maxPrintedPage,
        unitRows: stat.rows,
      })),
      topTen,
      issues: Object.fromEntries(
        CHECK_ROWS.map((row) => [row.key, results[row.key]]).concat([
          ["duplicateNameCrossBook", crossBookDuplicates],
        ]),
      ),
    },
    null,
    2,
  )}\n`,
  "utf8",
);

for (const row of CHECK_ROWS) {
  console.log(`${row.no} ${row.label}: ${totalOf(row.key)}`);
}
console.log(
  `4b 同名作品（跨册）: ${crossBookDuplicates.length}（类型相同 ${crossSameType.length} / 类型不同 ${crossDiffType.length}）`,
);
console.log(`TOP10 条数: ${topTen.length}`);
console.log(`QA_REPORT_WRITTEN ${REPORT_PATH} issues=${issueTotal}`);
