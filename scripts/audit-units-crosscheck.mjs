// units.json 与已发布教材数据的一致性核对（T006，只读）。
// 关键点：**不 import build-units.mjs 的任何逻辑**，全部从 public/data/books/*.json
// 按 app/lib/app/unit-data.ts 里公开的判定口径独立重推一遍，再和生成的 units.json 对账。
// 只读；写完报告即结束，不改任何数据。
// 用法：
//   node scripts/audit-units-crosscheck.mjs             # 对账并写报告
//   node scripts/audit-units-crosscheck.mjs --strict    # 有问题时退出码 1
//   node scripts/audit-units-crosscheck.mjs --self-test # 内存里改坏 units.json 自证

import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLISHED_BOOK_COUNT_LABEL, PUBLISHED_BOOK_KEYS } from "../data/books.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(HERE, "..");
const REPORT_PATH = process.env.UNITS_REPORT_PATH ?? ".tmp-audit/units-crosscheck-report.md";
const JSON_PATH = process.env.UNITS_JSON_PATH ?? ".tmp-audit/units-crosscheck.json";
const SELF_TEST_REPORT = ".tmp-audit/units-crosscheck-self-test.md";

const BOOK_KEYS = PUBLISHED_BOOK_KEYS;

// 作品类类型。与 app/lib/app/types.ts:217 的 WORK_TYPES 完全一致
//（任务单里列的 11 类 + 数据里暂未出现的「音乐作品」「戏曲歌曲」），
// 不含「来源作品」——那是教材之外的来源实体，不是单元里的曲目。
const WORK_TYPES = new Set([
  "音乐作品",
  "歌曲",
  "民歌",
  "器乐曲",
  "戏曲歌曲",
  "戏曲选段",
  "舞蹈音乐",
  "影视音乐",
  "交响作品",
  "合唱作品",
  "歌剧音乐",
  "进行曲",
  "朗诵作品",
]);
// 只在核对报告里作为「如果也算作品会多出多少」的参考。
const ALMOST_WORK_TYPES = new Set(["来源作品"]);

// 作者类谓语，顺序即优先级（与生成脚本一致：作曲 → 作词 → 词曲作者 → 编曲 → 改编）。
const CREATOR_PREDICATES = ["作曲", "作词", "词曲作者", "编曲", "改编"];

// 单元 → 作品 / 单元 → 学习目标 / 单元 → 课堂任务
const UNIT_WORK_PREDICATE = "包含作品";
const UNIT_GOAL_PREDICATE = "学习目标";
const UNIT_TASK_PREDICATE = "课堂任务";
const STARRED_PREDICATE = "教材标注";

const DETAIL_LIMIT = 20;

// ---- 独立实现的判定口径 ----------------------------------------------------

// 教材印刷页：media[].title 里的「教材第N页」（口径同 app/lib/app/unit-data.ts:29）。
const printedPageOf = (entity) => {
  const match = (entity.media ?? [])
    .map((asset) => asset.title?.match(/教材第(\d+)页/)?.[1])
    .find(Boolean);
  return match ? Number(match) : null;
};

// 名称规范化，用于「focus 是不是作品名」这类比较。
const bareName = (name) => String(name ?? "").replace(/[《》]/g, "").replace(/\s/g, "").trim();

const valueOf = (triple, byId) => {
  if (triple.objectId) return byId.get(triple.objectId)?.name ?? triple.literal ?? "";
  return triple.literal ?? "";
};

// 独立重推一个作品的作者列表（多角色合并、同人去重、最多 3 条）。
const deriveAuthors = (triples, byId, workId) => {
  const rows = [];
  for (const role of CREATOR_PREDICATES) {
    for (const triple of triples.filter((item) => item.subject === workId && item.predicate === role)) {
      const name = String(valueOf(triple, byId) ?? "").trim();
      if (!name) continue;
      const existing = rows.find((row) => row.name === name);
      if (existing) existing.roles.push(role);
      else rows.push({ name, roles: [role] });
    }
  }
  return rows.slice(0, 3).map(({ name, roles }) => ({
    role:
      roles.includes("词曲作者") || (roles.includes("作词") && roles.includes("作曲"))
        ? "词曲"
        : [...new Set(roles)].join("/"),
    name,
  }));
};

// 独立重推课堂任务的 text / 涉及作品名 / 练习重点（口径同 unit-data.ts:35 的 parseUnitTask）。
const parseTask = (literal) => {
  const source = String(literal);
  const start = source.search(/（(?=涉及|练习重点：)/);
  if (start < 0) return { text: source, workNames: [], focus: [] };
  const metadata = source.slice(start + 1);
  const mentions = metadata.match(/涉及([\s\S]*?)(?:；|练习重点：|$)/)?.[1] ?? "";
  const workNames = [...new Set([...mentions.matchAll(/《[^》]+》/g)].map((match) => match[0]))];
  const focusSource = metadata.match(/练习重点：([\s\S]*)$/)?.[1]?.replace(/）$/, "") ?? "";
  const focus = [...new Set(focusSource.split(/[、，,；;]/).map((item) => item.trim()).filter(Boolean))];
  return { text: source.slice(0, start).trimEnd(), workNames, focus };
};

// ---- 读数据 ---------------------------------------------------------------

async function loadBooks(root) {
  const books = new Map();
  for (const key of BOOK_KEYS) {
    const data = JSON.parse(
      await readFile(path.join(root, "public", "data", "books", `${key}.json`), "utf8"),
    );
    const byId = new Map((data.entities ?? []).map((entity) => [entity.id, entity]));
    const triples = data.triples ?? [];
    const bySubject = new Map();
    for (const triple of triples) {
      if (!bySubject.has(triple.subject)) bySubject.set(triple.subject, []);
      bySubject.get(triple.subject).push(triple);
    }
    books.set(key, { key, entities: data.entities ?? [], byId, triples, bySubject });
  }
  return books;
}

// 旋律目录是数据（205 条），按任务单的说明允许读共享模块：
// 用仓库自带的 typescript 在内存里转译 .ts（不安装任何依赖）。
function loadMelodies(root) {
  const require = createRequire(import.meta.url);
  const Module = require("node:module");
  const ts = require("typescript");
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
  return require(path.join(root, "app", "lib", "lesson", "melodies.ts")).MELODIES;
}

// ---- 核对 -----------------------------------------------------------------

async function crossCheck(root, units) {
  const books = await loadBooks(root);
  const melodies = loadMelodies(root);

  const issues = {
    notInUnit: [],
    unknownWork: [],
    authorMismatch: [],
    pageMismatch: [],
    taskLink: [],
    statsMismatch: [],
    starredMismatch: [],
    melodyMismatch: [],
    starredWithoutMelody: [],
    melodyButFlagFalse: [],
    rawMismatch: [],
  };

  // 1. 作品没有出现在任何单元里
  const inAnyUnit = new Map();
  for (const unit of units) {
    for (const work of unit.works ?? []) {
      if (!inAnyUnit.has(unit.bookKey)) inAnyUnit.set(unit.bookKey, new Set());
      inAnyUnit.get(unit.bookKey).add(work.id);
    }
  }
  for (const [bookKey, book] of books) {
    const used = inAnyUnit.get(bookKey) ?? new Set();
    for (const entity of book.entities) {
      if (!WORK_TYPES.has(entity.type)) continue;
      if (used.has(entity.id)) continue;
      issues.notInUnit.push({
        book: bookKey,
        id: entity.id,
        name: entity.name,
        type: entity.type,
        page: printedPageOf(entity),
        pdfPage: entity.firstPage ?? null,
      });
    }
  }

  for (const unit of units) {
    const book = books.get(unit.bookKey);
    if (!book) {
      issues.unknownWork.push({
        book: unit.bookKey,
        unit: unit.name,
        id: "(整册数据缺失)",
        reason: `找不到 public/data/books/${unit.bookKey}.json`,
      });
      continue;
    }
    const unitWorkIds = new Set((unit.works ?? []).map((work) => work.id));

    // 2. 单元里的作品必须存在，且类型必须是作品类
    for (const work of unit.works ?? []) {
      const entity = book.byId.get(work.id);
      if (!entity) {
        issues.unknownWork.push({
          book: unit.bookKey,
          unit: unit.name,
          id: work.id,
          reason: "本册 entities 里找不到这个 id",
        });
        continue;
      }
      if (!WORK_TYPES.has(entity.type)) {
        issues.unknownWork.push({
          book: unit.bookKey,
          unit: unit.name,
          id: work.id,
          reason: `类型「${entity.type}」不是作品类`,
        });
      }
      if (entity.name !== work.name) {
        issues.unknownWork.push({
          book: unit.bookKey,
          unit: unit.name,
          id: work.id,
          reason: `作品名不一致：units.json「${work.name}」/ 教材数据「${entity.name}」`,
        });
      }

      // 3. 作者核对
      const expected = deriveAuthors(book.triples, book.byId, work.id)
        .map((item) => `${item.role}|${item.name}`)
        .sort();
      const actual = (work.authors ?? []).map((item) => `${item.role}|${item.name}`).sort();
      if (expected.join(" + ") !== actual.join(" + ")) {
        issues.authorMismatch.push({
          book: unit.bookKey,
          unit: unit.name,
          id: work.id,
          name: work.name,
          expected: expected.join(" + ") || "（无作者）",
          actual: actual.join(" + ") || "（无作者）",
        });
      }

      // 4. 页码核对
      const expectedPage = printedPageOf(entity);
      if (expectedPage !== (work.page ?? null)) {
        issues.pageMismatch.push({
          book: unit.bookKey,
          unit: unit.name,
          id: work.id,
          name: work.name,
          expected: expectedPage,
          actual: work.page ?? null,
        });
      }

      // 7. starred
      const expectedStarred = (book.bySubject.get(work.id) ?? []).some(
        (triple) => triple.predicate === STARRED_PREDICATE,
      );
      if (expectedStarred !== Boolean(work.starred)) {
        issues.starredMismatch.push({
          book: unit.bookKey,
          unit: unit.name,
          id: work.id,
          name: work.name,
          expected: expectedStarred,
          actual: Boolean(work.starred),
        });
      }

      // 7. hasMelody（旋律目录是共享数据，按任务单说明直接读）
      const expectedMelody = Boolean(melodies[entity.name]?.length);
      if (expectedMelody !== Boolean(work.hasMelody)) {
        issues.melodyMismatch.push({
          book: unit.bookKey,
          unit: unit.name,
          id: work.id,
          name: work.name,
          expected: expectedMelody,
          actual: Boolean(work.hasMelody),
        });
      }
      if (work.starred && !work.hasMelody) {
        issues.starredWithoutMelody.push({
          book: unit.bookKey,
          unit: unit.name,
          id: work.id,
          name: work.name,
        });
      }
      if (!work.hasMelody && expectedMelody) {
        issues.melodyButFlagFalse.push({
          book: unit.bookKey,
          unit: unit.name,
          id: work.id,
          name: work.name,
        });
      }
    }

    // 5. 课堂任务与作品的关联
    for (const task of unit.tasks ?? []) {
      for (const id of task.works ?? []) {
        if (!unitWorkIds.has(id)) {
          issues.taskLink.push({
            book: unit.bookKey,
            unit: unit.name,
            task: task.text,
            reason: `任务引用的作品 ${id} 不在本单元的 works 里`,
          });
        }
      }
      const workNames = new Set((unit.works ?? []).map((work) => bareName(work.name)));
      for (const item of task.focus ?? []) {
        if (workNames.has(bareName(item))) {
          issues.taskLink.push({
            book: unit.bookKey,
            unit: unit.name,
            task: task.text,
            reason: `练习重点「${item}」同时是本单元的作品名`,
          });
        }
      }
    }

    // 6. 统计核对
    const works = unit.works ?? [];
    if (unit.stats?.works !== works.length) {
      issues.statsMismatch.push({
        book: unit.bookKey,
        unit: unit.name,
        field: "stats.works",
        expected: works.length,
        actual: unit.stats?.works,
      });
    }
    const pages = works.map((work) => work.page).filter(Number.isInteger);
    const pageValues = pages.length ? pages : works.map((work) => work.pdfPage).filter(Number.isInteger);
    const expectedRange = pageValues.length ? [Math.min(...pageValues), Math.max(...pageValues)] : [];
    if (JSON.stringify(unit.stats?.pages ?? []) !== JSON.stringify(expectedRange)) {
      issues.statsMismatch.push({
        book: unit.bookKey,
        unit: unit.name,
        field: "stats.pages",
        expected: JSON.stringify(expectedRange),
        actual: JSON.stringify(unit.stats?.pages ?? []),
      });
    }
    const starredCount = works.filter((work) => work.starred).length;
    if (unit.stats?.starred !== starredCount) {
      issues.statsMismatch.push({
        book: unit.bookKey,
        unit: unit.name,
        field: "stats.starred",
        expected: starredCount,
        actual: unit.stats?.starred,
      });
    }
    const melodyCount = works.filter((work) => work.hasMelody).length;
    if (unit.stats?.withMelody !== melodyCount) {
      issues.statsMismatch.push({
        book: unit.bookKey,
        unit: unit.name,
        field: "stats.withMelody",
        expected: melodyCount,
        actual: unit.stats?.withMelody,
      });
    }

    // 5b. 反向对账：教材原始三元组里的条目，units.json 有没有漏
    const unitTriples = book.bySubject.get(unit.id) ?? [];
    const rawWorkIds = [
      ...new Set(
        unitTriples
          .filter((triple) => triple.predicate === UNIT_WORK_PREDICATE && triple.objectId)
          .map((triple) => triple.objectId),
      ),
    ].filter((id) => WORK_TYPES.has(book.byId.get(id)?.type));
    for (const id of rawWorkIds) {
      if (unitWorkIds.has(id)) continue;
      issues.rawMismatch.push({
        book: unit.bookKey,
        unit: unit.name,
        field: "works",
        reason: `教材数据的「包含作品」里有 ${id}（${book.byId.get(id)?.name}），units.json 的 works 里没有`,
        expected: id,
        actual: "（缺失）",
      });
    }

    const rawGoals = [
      ...new Set(
        unitTriples
          .filter((triple) => triple.predicate === UNIT_GOAL_PREDICATE)
          .map((triple) => String(valueOf(triple, book.byId) ?? "").trim())
          .filter(Boolean),
      ),
    ];
    if (JSON.stringify(rawGoals) !== JSON.stringify(unit.goals ?? [])) {
      issues.rawMismatch.push({
        book: unit.bookKey,
        unit: unit.name,
        field: "goals",
        reason: "学习目标与教材数据不一致",
        expected: JSON.stringify(rawGoals),
        actual: JSON.stringify(unit.goals ?? []),
      });
    }

    const rawTasks = unitTriples
      .filter((triple) => triple.predicate === UNIT_TASK_PREDICATE)
      .map((triple) => parseTask(valueOf(triple, book.byId)));
    if (rawTasks.length !== (unit.tasks ?? []).length) {
      issues.rawMismatch.push({
        book: unit.bookKey,
        unit: unit.name,
        field: "tasks",
        reason: "课堂任务条数与教材数据不一致",
        expected: rawTasks.length,
        actual: (unit.tasks ?? []).length,
      });
    } else {
      rawTasks.forEach((raw, index) => {
        const actual = unit.tasks[index];
        if (raw.text !== actual.text) {
          issues.rawMismatch.push({
            book: unit.bookKey,
            unit: unit.name,
            field: `tasks[${index}].text`,
            reason: "任务文字与教材数据不一致",
            expected: raw.text,
            actual: actual.text,
          });
        }
        if (JSON.stringify(raw.focus) !== JSON.stringify(actual.focus ?? [])) {
          issues.rawMismatch.push({
            book: unit.bookKey,
            unit: unit.name,
            field: `tasks[${index}].focus`,
            reason: "练习重点与教材原文解析结果不一致",
            expected: JSON.stringify(raw.focus),
            actual: JSON.stringify(actual.focus ?? []),
          });
        }
      });
    }
  }

  // 参考数字：如果把「来源作品」也算成作品，第 1 项会多出多少
  let almostWorkOutsideUnits = 0;
  for (const [bookKey, book] of books) {
    const used = inAnyUnit.get(bookKey) ?? new Set();
    almostWorkOutsideUnits += book.entities.filter(
      (entity) => ALMOST_WORK_TYPES.has(entity.type) && !used.has(entity.id),
    ).length;
  }

  return {
    root,
    unitCount: units.length,
    workCount: units.reduce((sum, unit) => sum + (unit.works?.length ?? 0), 0),
    taskCount: units.reduce((sum, unit) => sum + (unit.tasks?.length ?? 0), 0),
    goalCount: units.reduce((sum, unit) => sum + (unit.goals?.length ?? 0), 0),
    issues,
    almostWorkOutsideUnits,
    notInUnitByBook: BOOK_KEYS.map((key) => ({
      key,
      count: issues.notInUnit.filter((item) => item.book === key).length,
    })),
  };
}

const TOTAL_KEYS = [
  "notInUnit",
  "unknownWork",
  "authorMismatch",
  "pageMismatch",
  "taskLink",
  "statsMismatch",
  "starredMismatch",
  "melodyMismatch",
  "starredWithoutMelody",
  "melodyButFlagFalse",
  "rawMismatch",
];

const totalIssues = (result) =>
  TOTAL_KEYS.reduce((sum, key) => sum + result.issues[key].length, 0);

// ---- 渲染 -----------------------------------------------------------------

const cap = (list, render) => {
  if (list.length === 0) return ["（无）"];
  const lines = list.slice(0, DETAIL_LIMIT).map(render);
  if (list.length > DETAIL_LIMIT) lines.push(`- 另有 ${list.length - DETAIL_LIMIT} 条`);
  return lines;
};

function renderReport(result) {
  const out = [];
  out.push("# units.json 与教材数据一致性核对报告（只读，未改动任何数据）");
  out.push("");
  out.push(`扫描根目录：\`${result.root}\``);
  out.push("");
  out.push(
    `核对范围：\`public/data/units.json\` 的 ${result.unitCount} 个单元、${result.workCount} 个作品条目、${result.taskCount} 条课堂任务、${result.goalCount} 条学习目标；原始数据是 \`public/data/books/*.json\` 的 ${PUBLISHED_BOOK_COUNT_LABEL}实体与三元组。`,
  );
  out.push("");
  out.push(
    "推导方式：**不引用 `scripts/build-units.mjs` 的任何代码**，只按 `app/lib/app/unit-data.ts` 公开的判定口径（`getPrintedPage`、`isStarredWork`、`hasMelody`、`parseUnitTask`）在脚本里重新实现一遍，再和 units.json 逐项对账。旋律目录属数据，直接读 `app/lib/lesson/melodies.ts`（用仓库自带的 typescript 在内存里转译，未安装任何依赖）。",
  );
  out.push("");
  out.push("## 问题汇总");
  out.push("");
  out.push("| 项 | 检查内容 | 问题数 |");
  out.push("|---|---|---|");
  const labels = {
    notInUnit: "1. 作品类实体但不出现在任何单元里（教材拓展，需确认是否预期）",
    unknownWork: "2. 单元里的作品在教材数据里找不到 / 类型不是作品类 / 名字不一致",
    authorMismatch: "3. 作者与原始三元组不一致",
    pageMismatch: "4. 印刷页与原始 media[].title 不一致",
    taskLink: "5. 课堂任务引用的作品不在本单元 / 练习重点与作品名撞车",
    statsMismatch: "6. stats 与 works 实际值不一致",
    starredMismatch: "7a. starred 与教材标注不一致",
    melodyMismatch: "7b. hasMelody 与旋律目录不一致",
    starredWithoutMelody: "7c. starred 为 true 但没有旋律",
    melodyButFlagFalse: "7d. 旋律目录里有、但 hasMelody 为 false",
    rawMismatch: "8. 反向对账：教材原始三元组里有、units.json 里缺失或走样的条目",
  };
  for (const key of TOTAL_KEYS) {
    out.push(`| ${labels[key]} | | ${result.issues[key].length} |`);
  }
  out.push("");
  out.push(`**问题合计（第 2–8 项）：${totalIssues(result) - result.issues.notInUnit.length} 条**；第 1 项 ${result.issues.notInUnit.length} 条是「教材拓展」统计，不计入问题。`);
  out.push("");

  out.push("## 1. 作品是否都进了单元");
  out.push("");
  out.push(
    `作品类（类型属于 ${[...WORK_TYPES].join("、")}）但没有出现在任何单元 \`works\` 里的实体，共 ${result.issues.notInUnit.length} 个：`,
  );
  out.push("");
  out.push("| 册 | 数量 |");
  out.push("|---|---|");
  for (const row of result.notInUnitByBook) out.push(`| ${row.key} | ${row.count} |`);
  out.push("");
  out.push(...cap(result.issues.notInUnit, (item) =>
    `- ${item.book}｜${item.name}（${item.type}，印刷页 ${item.page ?? "—"} / PDF ${item.pdfPage ?? "—"}，${item.id}）`,
  ));
  out.push("");
  out.push(
    `参考：如果把「来源作品」这一类也算成作品，这一项还会多 ${result.almostWorkOutsideUnits} 个（本脚本按 \`app/lib/app/types.ts:217\` 的 WORK_TYPES 判定，与生成脚本一致）。`,
  );
  out.push("");

  out.push("## 2. 单元里的作品是否都存在");
  out.push("");
  out.push(`合计 ${result.issues.unknownWork.length} 条。`);
  out.push("");
  out.push(...cap(result.issues.unknownWork, (item) => `- ${item.book}｜${item.unit}｜${item.id}：${item.reason}`));
  out.push("");

  out.push("## 3. 作者核对");
  out.push("");
  out.push(`合计 ${result.issues.authorMismatch.length} 条（多人与顺序不计，比较的是「角色|姓名」的集合）。`);
  out.push("");
  out.push(...cap(result.issues.authorMismatch, (item) =>
    `- ${item.book}｜${item.unit}｜${item.name}（${item.id}）：units.json = ${item.actual}；教材数据 = ${item.expected}`,
  ));
  out.push("");

  out.push("## 4. 页码核对");
  out.push("");
  out.push(`合计 ${result.issues.pageMismatch.length} 条（比较 units.json 的 \`page\` 与原始 \`media[].title\` 的「教材第N页」）。`);
  out.push("");
  out.push(...cap(result.issues.pageMismatch, (item) =>
    `- ${item.book}｜${item.unit}｜${item.name}（${item.id}）：units.json = ${item.actual}；教材数据 = ${item.expected}`,
  ));
  out.push("");

  out.push("## 5. 任务与作品关联");
  out.push("");
  out.push(`合计 ${result.issues.taskLink.length} 条。`);
  out.push("");
  out.push(...cap(result.issues.taskLink, (item) => `- ${item.book}｜${item.unit}｜「${item.task}」：${item.reason}`));
  out.push("");

  out.push("## 6. 统计核对");
  out.push("");
  out.push(`合计 ${result.issues.statsMismatch.length} 条。`);
  out.push("");
  out.push(...cap(result.issues.statsMismatch, (item) =>
    `- ${item.book}｜${item.unit}｜${item.field}：units.json = ${item.actual}；实际 = ${item.expected}`,
  ));
  out.push("");

  out.push("## 7. starred 与 hasMelody");
  out.push("");
  out.push(`- 7a starred 与「教材标注」不一致：**${result.issues.starredMismatch.length}** 条`);
  out.push(`- 7b hasMelody 与旋律目录不一致：**${result.issues.melodyMismatch.length}** 条`);
  out.push("");
  out.push(...cap(result.issues.starredMismatch, (item) =>
    `- ${item.book}｜${item.unit}｜${item.name}：units.json = ${item.actual}；教材数据 = ${item.expected}`,
  ));
  out.push("");
  out.push(...cap(result.issues.melodyMismatch, (item) =>
    `- ${item.book}｜${item.unit}｜${item.name}：units.json = ${item.actual}；旋律目录 = ${item.expected}`,
  ));
  out.push("");
  out.push(`**7c starred 为 true 但没有旋律的，共 ${result.issues.starredWithoutMelody.length} 个**：`);
  out.push("");
  out.push(...cap(result.issues.starredWithoutMelody, (item) => `- ${item.book}｜${item.unit}｜${item.name}（${item.id}）`));
  out.push("");
  out.push(`**7d 旋律目录里有、units.json 却标成 hasMelody=false 的，共 ${result.issues.melodyButFlagFalse.length} 个**：`);
  out.push("");
  out.push(...cap(result.issues.melodyButFlagFalse, (item) => `- ${item.book}｜${item.unit}｜${item.name}（${item.id}）`));
  out.push("");

  out.push("## 8. 反向对账：教材原始三元组 → units.json");
  out.push("");
  out.push(
    `合计 ${result.issues.rawMismatch.length} 条。这一项查的是反方向：教材数据里写了「包含作品 / 学习目标 / 课堂任务」，units.json 有没有漏掉或改写。`,
  );
  out.push("");
  out.push(...cap(result.issues.rawMismatch, (item) =>
    `- ${item.book}｜${item.unit}｜${item.field}：${item.reason}（units.json = ${item.actual}；教材数据 = ${item.expected}）`,
  ));
  out.push("");
  return out.join("\n");
}

// ---- 自证 -----------------------------------------------------------------

async function selfTest() {
  const unitsPath = path.join(DEFAULT_ROOT, "public", "data", "units.json");
  const units = JSON.parse(readFileSync(unitsPath, "utf8"));

  console.log("=== 自证 0：先跑一遍未改动的 units.json，确认这三项本来都是 0 ===");
  const baseline = await crossCheck(DEFAULT_ROOT, units);
  console.log(
    `基线：unknownWork=${baseline.issues.unknownWork.length} authorMismatch=${baseline.issues.authorMismatch.length} pageMismatch=${baseline.issues.pageMismatch.length} statsMismatch=${baseline.issues.statsMismatch.length}`,
  );

  // 三处改坏 + 一处附加，全部只在内存里。
  // 注意要挑**不同单元**的目标：同一首作品如果 id 被改坏，第 2 项会先把它拦下来，
  // 后面基于实体查找的作者核对就不会跑（这正是第一版自证失败的原因）。
  const broken = structuredClone(units);
  const targetUnit = broken.find((unit) => (unit.works ?? []).length >= 2);
  const pickFrom = (predicate, excludeUnits) => {
    for (const unit of broken) {
      if (excludeUnits.includes(unit)) continue;
      for (const work of unit.works ?? []) if (predicate(work)) return { unit, work };
    }
    return null;
  };
  const authorTarget = pickFrom((work) => (work.authors ?? []).length > 0, [targetUnit]);
  const pageTarget = pickFrom(
    (work) => Number.isInteger(work.page),
    [targetUnit, authorTarget?.unit],
  );
  const shrinkUnit = broken.find(
    (unit) => unit !== targetUnit && unit !== authorTarget?.unit && (unit.works ?? []).length >= 3,
  );

  if (!targetUnit || !authorTarget || !pageTarget || !shrinkUnit) {
    console.log("❌ 自证：当前 units.json 里找不到足够的改坏目标，无法完成自证");
    return 1;
  }

  const originalAuthor = authorTarget.work.authors[0].name;
  authorTarget.work.authors[0].name = "自证错误作者";
  const originalPage = pageTarget.work.page;
  pageTarget.work.page = originalPage + 1;
  const brokenWorkId = targetUnit.works[0].id;
  targetUnit.works[0].id = "XXXX_E00000";
  // 附加：把另一条 works 整个删掉，交给第 6 项
  const shrunkId = shrinkUnit.works[shrinkUnit.works.length - 1].id;
  shrinkUnit.works.pop();

  console.log("");
  console.log("=== 自证 1：内存里改坏 units.json（不写文件）===");
  console.log(`- 作者：${authorTarget.unit.name} / ${authorTarget.work.name} 的第 1 个作者 ${originalAuthor} → 自证错误作者`);
  console.log(`- 页码：${pageTarget.unit.name} / ${pageTarget.work.name} 的 page ${originalPage} → ${originalPage + 1}`);
  console.log(`- 作品 id：${targetUnit.name} 的 works[0].id ${brokenWorkId} → XXXX_E00000（不存在的 id）`);
  console.log(`- 附加：${shrinkUnit.name} 删掉一条 works 条目（${shrunkId}），交给第 6 项`);

  const after = await crossCheck(DEFAULT_ROOT, broken);
  const authorHit = after.issues.authorMismatch.some(
    (item) => item.id === authorTarget.work.id && item.actual.includes("自证错误作者"),
  );
  const pageHit = after.issues.pageMismatch.some((item) => item.id === pageTarget.work.id);
  const unknownHit = after.issues.unknownWork.some((item) => item.id === "XXXX_E00000");
  const statsHit = after.issues.statsMismatch.some(
    (item) => item.unit === shrinkUnit.name && item.field === "stats.works",
  );

  console.log("");
  console.log("=== 自证 2：改坏后的检出情况 ===");
  console.log(
    `unknownWork=${after.issues.unknownWork.length} authorMismatch=${after.issues.authorMismatch.length} pageMismatch=${after.issues.pageMismatch.length} statsMismatch=${after.issues.statsMismatch.length}`,
  );
  console.log(`作者不一致明细：${after.issues.authorMismatch.map((item) => `${item.name}：${item.actual} ≠ ${item.expected}`).join("；") || "（无）"}`);
  console.log(`页码不一致明细：${after.issues.pageMismatch.map((item) => `${item.name}：${item.actual} ≠ ${item.expected}`).join("；") || "（无）"}`);
  console.log(`作品找不到明细：${after.issues.unknownWork.map((item) => `${item.id}：${item.reason}`).join("；") || "（无）"}`);

  const checks = [
    ["基线三项本来就是 0", baseline.issues.unknownWork.length === 0 && baseline.issues.authorMismatch.length === 0 && baseline.issues.pageMismatch.length === 0],
    ["第 3 项检出错改的作者", authorHit],
    ["第 4 项检出错改的页码", pageHit],
    ["第 2 项检出指向不存在实体的作品 id", unknownHit],
    ["附加：第 6 项检出被删掉的 works 条目", statsHit],
  ];
  console.log("");
  let failed = 0;
  for (const [label, ok] of checks) {
    console.log(`${ok ? "✅" : "❌"} ${label}`);
    if (!ok) failed += 1;
  }

  await mkdir(path.dirname(SELF_TEST_REPORT), { recursive: true });
  await writeFile(
    SELF_TEST_REPORT,
    `# T006 自证（改坏后的对账结果，仅在内存里）\n\n基线：${JSON.stringify({ unknownWork: baseline.issues.unknownWork.length, authorMismatch: baseline.issues.authorMismatch.length, pageMismatch: baseline.issues.pageMismatch.length })}\n\n改坏后：${JSON.stringify({ unknownWork: after.issues.unknownWork.length, authorMismatch: after.issues.authorMismatch.length, pageMismatch: after.issues.pageMismatch.length, statsMismatch: after.issues.statsMismatch.length })}\n`,
    "utf8",
  );
  console.log("");
  console.log(failed === 0 ? "SELF_TEST_PASSED" : `SELF_TEST_FAILED checks=${failed}`);
  return failed === 0 ? 0 : 1;
}

// ---- 入口 -----------------------------------------------------------------

const argv = process.argv.slice(2);

if (argv.includes("--self-test")) {
  process.exitCode = await selfTest();
} else if (argv.includes("--help")) {
  console.log("用法：node scripts/audit-units-crosscheck.mjs [--strict] [--self-test]");
} else {
  const units = JSON.parse(
    readFileSync(path.join(DEFAULT_ROOT, "public", "data", "units.json"), "utf8"),
  );
  const result = await crossCheck(DEFAULT_ROOT, units);
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, renderReport(result), "utf8");
  await mkdir(path.dirname(JSON_PATH), { recursive: true });
  await writeFile(JSON_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  for (const key of TOTAL_KEYS) console.log(`${key}: ${result.issues[key].length}`);
  console.log(
    `UNITS_CROSSCHECK_DONE units=${result.unitCount} works=${result.workCount} issues=${totalIssues(result) - result.issues.notInUnit.length} notInUnit=${result.issues.notInUnit.length} report=${REPORT_PATH}`,
  );
  if (argv.includes("--strict") && totalIssues(result) - result.issues.notInUnit.length > 0) {
    process.exitCode = 1;
  }
}
