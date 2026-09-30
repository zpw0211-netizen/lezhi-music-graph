// public/ 静态资源引用巡检（T005，只读）。
// 只统计与报告，**不删除、不移动、不修改 public/ 下任何文件**。
// 用法：
//   node scripts/audit-assets.mjs              # 巡检整个仓库，写报告
//   node scripts/audit-assets.mjs --self-test  # 在临时目录造一个假仓库自证，退出码即结论
//   node scripts/audit-assets.mjs --root <dir> # 巡检别的目录（自证用）

import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(HERE, "..");
const REPORT_PATH =
  process.env.ASSET_REPORT_PATH ??
  "E:\\Projects\\yapu-collab\\ds1\\outbox\\T005-asset-report.md";
const JSON_PATH = process.env.ASSET_JSON_PATH ?? "E:\\Projects\\.tmp\\ds1\\asset-audit.json";
const SELF_TEST_ROOT = "E:\\Projects\\.tmp\\ds1\\fixture";
const SELF_TEST_REPORT = path.join(SELF_TEST_ROOT, "self-test-report.md");

const BOOK_KEYS = ["g7s1", "g7s2", "g8s1", "g8s2", "g9s1", "g9s2"];
const OVERSIZE_BYTES = 250 * 1024;
const IMAGE_EXTS = new Set([".webp", ".jpg", ".jpeg", ".png"]);
// 需要判定「有没有人引用」的三个目录。
const ORPHAN_SCOPES = ["art", "art/units", "media/scores"];
// 说明文件不算孤儿。
const SKIP_ORPHAN = /\.(md|txt)$/i;
const DETAIL_LIMIT = 20;

// app/ 里形如 art/… media/… brand/… data/… 的字面量（含被 publicAssetUrl(...) 包起来的写法）。
const CANDIDATE_RE =
  /(?:^|[^A-Za-z0-9_.\-/])(\/?(?:art|media|brand|data)\/[A-Za-z0-9._\-/${}]*)/g;
// 注释行里是否提到过资源路径（只用来统计，不当作引用）。
const COMMENT_HINT_RE = /(?:^|[^A-Za-z0-9_.\-/])\/?(?:art|media|brand|data)\//;
const CSS_URL_RE = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
// 模板变量展开表：这些变量取值为六册册号。
const EXPANSIONS = {
  "directory.key": BOOK_KEYS,
  key: BOOK_KEYS,
  bookKey: BOOK_KEYS,
  "directory?.key": BOOK_KEYS,
  "S.key": BOOK_KEYS,
  "book.key": BOOK_KEYS,
};

// ---- 基础工具 -------------------------------------------------------------

async function walkFiles(dir, prefix = "") {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkFiles(full, rel)));
    else out.push({ rel, full });
  }
  return out;
}

const isFile = (file) => {
  try {
    readFileSync(file);
    return true;
  } catch {
    return false;
  }
};

// 从某个位置起，按「路径字符 + ${表达式}」的规则往后取一段。遇到括号/引号就停。
function scanCandidate(lineText, start) {
  let depth = 0;
  let value = "";
  for (let index = start; index < lineText.length; index += 1) {
    const char = lineText[index];
    if (char === "$" && lineText[index + 1] === "{") {
      depth += 1;
      value += "${";
      index += 1;
      continue;
    }
    if (char === "}" && depth > 0) {
      depth -= 1;
      value += char;
      continue;
    }
    if (depth > 0) {
      value += char;
      continue;
    }
    if (/[A-Za-z0-9._\-/$]/.test(char)) {
      value += char;
      continue;
    }
    break;
  }
  return value;
}

// 注释行（JSDoc、行注释）里的路径多半是举例，不当作引用。
const isCommentLine = (lineText) => /^\s*(\*|\/\/|\/\*)/.test(lineText);

// 把 app/ 里拿到的路径片段规范化成「相对 public/ 的 posix 路径」。
function normalizeRef(raw) {
  let value = raw.trim();
  value = value.replace(/^\/+/, "");
  value = value.replace(/^lezhi-music-graph\//, "");
  return value;
}

// 展开 `${directory.key}` 这类可确定取值的模板；展不开的返回动态前缀。
function expandTemplate(ref) {
  const variables = [...ref.matchAll(/\$\{([^}]*)\}/g)].map((match) => match[1].trim());
  if (variables.length === 0) return { exact: [ref], dynamic: [] };
  const table = variables.map((name) => EXPANSIONS[name]);
  if (table.every(Boolean)) {
    let values = [ref];
    variables.forEach((name) => {
      const options = EXPANSIONS[name];
      const next = [];
      for (const value of values) {
        for (const option of options) next.push(value.replace(`\${${name}}`, option));
      }
      values = next;
    });
    return { exact: values.filter((value) => !value.includes("${")), dynamic: [] };
  }
  const firstVariable = ref.indexOf("${");
  const slash = ref.lastIndexOf("/", firstVariable);
  const prefix = slash >= 0 ? ref.slice(0, slash + 1) : "";
  return { exact: [], dynamic: prefix ? [{ prefix, sample: ref }] : [] };
}

// ---- 收集引用 -------------------------------------------------------------

async function collectReferences(root) {
  const publicDir = path.join(root, "public");
  const appDir = path.join(root, "app");
  const exact = new Map(); // 路径 → [{from, line}]
  const dynamic = []; // {prefix, sample, from, line}
  const dangling = [];

  const addExact = (target, from, line) => {
    if (!exact.has(target)) exact.set(target, []);
    exact.get(target).push({ from, line });
    if (!isFile(path.join(publicDir, target))) {
      dangling.push({ path: target, from, line });
    }
  };

  // a) units.json 里每个作品的 scores
  const unitsFile = path.join(publicDir, "data", "units.json");
  if (isFile(unitsFile)) {
    const units = JSON.parse(readFileSync(unitsFile, "utf8"));
    for (const [index, unit] of units.entries()) {
      for (const work of unit.works ?? []) {
        for (const score of work.scores ?? []) {
          addExact(normalizeRef(score), `public/data/units.json [${index}] ${unit.name} / ${work.name}`, null);
        }
      }
    }
  }

  // b) 六册教材数据里的 media[].url（用于孤儿判定；本册之外的册号也照实收）
  const booksDir = path.join(publicDir, "data", "books");
  for (const bookKey of BOOK_KEYS) {
    const file = path.join(booksDir, `${bookKey}.json`);
    if (!isFile(file)) continue;
    const data = JSON.parse(readFileSync(file, "utf8"));
    for (const entity of data.entities ?? []) {
      for (const asset of entity.media ?? []) {
        if (typeof asset.url !== "string") continue;
        const target = normalizeRef(asset.url);
        if (!exact.has(target)) exact.set(target, []);
        exact.get(target).push({ from: `public/data/books/${bookKey}.json ${entity.name}`, line: null });
      }
    }
  }

  // c) app/**/*.ts(x) 里的路径字面量与模板字面量
  const appFiles = (await walkFiles(appDir)).filter((file) => /\.(ts|tsx|css)$/.test(file.rel));
  let commentRefs = 0;
  for (const file of appFiles) {
    const from = `app/${file.rel}`;
    const text = await readFile(file.full, "utf8");
    const lines = text.split("\n");
    lines.forEach((lineText, index) => {
      const lineNumber = index + 1;
      if (file.rel.endsWith(".css")) {
        for (const match of lineText.matchAll(CSS_URL_RE)) {
          const target = match[2].trim();
          if (target.startsWith("#") || target.startsWith("data:") || target.startsWith("http")) continue;
          addExact(normalizeRef(target), from, lineNumber);
        }
        return;
      }
      if (isCommentLine(lineText)) {
        if (COMMENT_HINT_RE.test(lineText)) commentRefs += 1;
        return;
      }
      for (const match of lineText.matchAll(CANDIDATE_RE)) {
        const raw = scanCandidate(lineText, match.index + match[0].indexOf(match[1]));
        const { exact: hits, dynamic: dyn } = expandTemplate(normalizeRef(raw));
        for (const hit of hits) addExact(hit, from, lineNumber);
        for (const item of dyn) dynamic.push({ ...item, from, line: lineNumber });
      }
    });
  }

  // d) layout.tsx 里的 favicon 与 og.jpg（不是上面那四类前缀，单独收）
  for (const target of ["favicon.svg", "og.jpg"]) {
    if (isFile(path.join(publicDir, target))) {
      if (!exact.has(target)) exact.set(target, []);
      exact.get(target).push({ from: "app/layout.tsx（metadata 的 icon / openGraph 图片）", line: null });
    } else {
      dangling.push({ path: target, from: "app/layout.tsx（metadata 的 icon / openGraph 图片）", line: null });
    }
  }

  return { exact, dynamic, dangling, commentRefs };
}

// ---- 巡检 ----------------------------------------------------------------

async function runAudit(root) {
  const publicDir = path.join(root, "public");
  const files = await walkFiles(publicDir);
  const sizes = new Map();
  for (const file of files) sizes.set(file.rel, (await stat(file.full)).size);
  const totalBytes = [...sizes.values()].reduce((sum, value) => sum + value, 0);

  // 1. 体积总览
  const buckets = [
    { name: "art/units/", match: (rel) => rel.startsWith("art/units/") },
    { name: "art/", match: (rel) => rel.startsWith("art/") && !rel.startsWith("art/units/") },
    { name: "media/scores/", match: (rel) => rel.startsWith("media/scores/") },
    { name: "media/instruments/", match: (rel) => rel.startsWith("media/instruments/") },
    { name: "media/recordings/", match: (rel) => rel.startsWith("media/recordings/") },
    { name: "data/", match: (rel) => rel.startsWith("data/") },
    { name: "brand/", match: (rel) => rel.startsWith("brand/") },
    { name: "fonts/", match: (rel) => rel.startsWith("fonts/") },
    { name: "(根目录文件)", match: (rel) => !rel.includes("/") },
  ];
  const overview = buckets.map((bucket) => {
    const hit = [...sizes.entries()].filter(([rel]) => bucket.match(rel));
    return {
      name: bucket.name,
      files: hit.length,
      bytes: hit.reduce((sum, [, size]) => sum + size, 0),
    };
  });
  const matched = new Set(
    [...sizes.keys()].filter((rel) => buckets.some((bucket) => bucket.match(rel))),
  );
  const other = [...sizes.entries()].filter(([rel]) => !matched.has(rel));
  if (other.length) {
    overview.push({
      name: "(其他)",
      files: other.length,
      bytes: other.reduce((sum, [, size]) => sum + size, 0),
    });
  }

  const dataBreakdown = [...sizes.entries()]
    .filter(([rel]) => rel.startsWith("data/"))
    .reduce((map, [rel, size]) => {
      const parts = rel.split("/");
      const key = parts.length <= 2 ? rel : `${parts[0]}/${parts[1]}/`;
      const current = map.get(key) ?? { files: 0, bytes: 0 };
      current.files += 1;
      current.bytes += size;
      map.set(key, current);
      return map;
    }, new Map());

  const largest = [...sizes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([rel, size]) => ({ rel, size }));

  // 2. 悬空引用
  const { exact, dynamic, dangling, commentRefs } = await collectReferences(root);

  // 3. 孤儿文件
  const dynamicPrefixes = [...new Set(dynamic.map((item) => item.prefix).filter(Boolean))];
  const inScope = ([rel]) =>
    ORPHAN_SCOPES.some((scope) => rel === scope || rel.startsWith(`${scope}/`));
  const orphans = [...sizes.entries()]
    .filter(inScope)
    .filter(([rel]) => !SKIP_ORPHAN.test(rel))
    .filter(([rel]) => !exact.has(rel))
    .filter(([rel]) => !dynamicPrefixes.some((prefix) => rel.startsWith(prefix)))
    .map(([rel, size]) => ({ rel, size }))
    .sort((a, b) => b.size - a.size);
  const orphanBytes = orphans.reduce((sum, item) => sum + item.size, 0);

  // 4. 超大 / 格式不当 / 重复
  const oversized = [...sizes.entries()]
    .filter(([rel, size]) => IMAGE_EXTS.has(path.extname(rel).toLowerCase()) && size > OVERSIZE_BYTES)
    .map(([rel, size]) => ({ rel, size }))
    .sort((a, b) => b.size - a.size);

  const wrongFormat = [...sizes.keys()]
    .filter((rel) => rel.startsWith("media/scores/"))
    .filter((rel) => path.extname(rel).toLowerCase() !== ".webp")
    .sort();

  const bySize = new Map();
  for (const [rel, size] of sizes) {
    if (!bySize.has(size)) bySize.set(size, []);
    bySize.get(size).push(rel);
  }
  const duplicates = [];
  for (const [size, list] of bySize) {
    if (list.length < 2) continue;
    const byHash = new Map();
    for (const rel of list) {
      const hash = createHash("sha256")
        .update(await readFile(path.join(publicDir, rel)))
        .digest("hex");
      if (!byHash.has(hash)) byHash.set(hash, []);
      byHash.get(hash).push(rel);
    }
    for (const [, group] of byHash) {
      if (group.length > 1) duplicates.push({ size, files: group.sort() });
    }
  }
  duplicates.sort((a, b) => b.size * b.files.length - a.size * a.files.length);

  // 5. units.json 里 scores 为空的
  const emptyScoreWorks = [];
  const unitsFile = path.join(publicDir, "data", "units.json");
  let unitWorkTotal = 0;
  if (isFile(unitsFile)) {
    const units = JSON.parse(readFileSync(unitsFile, "utf8"));
    for (const unit of units) {
      for (const work of unit.works ?? []) {
        unitWorkTotal += 1;
        if ((work.scores ?? []).length === 0) {
          emptyScoreWorks.push({
            book: unit.bookKey,
            unit: unit.name,
            name: work.name,
            page: work.page,
            pdfPage: work.pdfPage,
          });
        }
      }
    }
  }

  return {
    root,
    fileCount: sizes.size,
    totalBytes,
    overview,
    dataBreakdown,
    largest,
    dangling,
    dynamic,
    commentRefs,
    exactCount: exact.size,
    orphans,
    orphansBytes: orphanBytes,
    oversized,
    wrongFormat,
    duplicates,
    emptyScoreWorks,
    unitWorkTotal,
    scannedAppFiles: (await walkFiles(path.join(root, "app"))).filter((file) =>
      /\.(ts|tsx|css)$/.test(file.rel),
    ).length,
  };
}

// ---- 渲染 -----------------------------------------------------------------

const mb = (bytes) => `${(bytes / 1048576).toFixed(2)} MB`;
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const cap = (list, render) => {
  const lines = list.slice(0, DETAIL_LIMIT).map(render);
  if (list.length > DETAIL_LIMIT) lines.push(`- 另有 ${list.length - DETAIL_LIMIT} 条`);
  return lines.length ? lines : ["（无）"];
};

function renderReport(result) {
  const out = [];
  out.push("# public/ 静态资源引用巡检报告（只读，未改动任何资源）");
  out.push("");
  out.push(`扫描根目录：\`${result.root}\``);
  out.push("");
  out.push(
    `**文件总数 ${result.fileCount}，总字节 ${result.totalBytes}（${mb(result.totalBytes)}）；悬空引用 ${result.dangling.length} 条；孤儿文件 ${result.orphans.length} 个（${mb(result.orphansBytes)}）。**`,
  );
  out.push("");
  out.push(
    `扫描范围：\`public/\` 全部文件；引用来源是 \`public/data/units.json\` 的 \`works[].scores[]\`、\`public/data/books/*.json\` 的 \`entities[].media[].url\`、\`app/**/*.ts(x)\` 里的路径字面量与模板字面量、\`app/**/*.css\` 的 \`url(...)\`、\`app/layout.tsx\` 的 favicon 与 og.jpg（共扫 ${result.scannedAppFiles} 个 app 源码文件）。`,
  );
  out.push("");

  out.push("## 1. 体积总览");
  out.push("");
  out.push("| 目录 | 文件数 | 字节 | 体积 |");
  out.push("|---|---|---|---|");
  for (const row of result.overview) {
    out.push(`| \`${row.name}\` | ${row.files} | ${row.bytes} | ${mb(row.bytes)} |`);
  }
  out.push("");
  out.push("`data/` 细分（占比最大，单列）：");
  out.push("");
  out.push("| 路径 | 文件数 | 字节 |");
  out.push("|---|---|---|");
  for (const [key, value] of [...result.dataBreakdown.entries()].sort((a, b) => b[1].bytes - a[1].bytes)) {
    out.push(`| \`${key}\` | ${value.files} | ${value.bytes} |`);
  }
  out.push("");
  out.push("体积最大的 15 个文件：");
  out.push("");
  for (const item of result.largest) out.push(`- \`${item.rel}\` ${item.size} B（${kb(item.size)}）`);
  out.push("");

  out.push("## 2. 悬空引用");
  out.push("");
  out.push(`合计 ${result.dangling.length} 条。`);
  out.push("");
  out.push(...cap(result.dangling, (item) => `- \`${item.path}\`　← ${item.from}${item.line ? `:${item.line}` : ""}`));
  out.push("");
  if (result.dynamic.length) {
    out.push(
      `另有 ${result.dynamic.length} 处动态拼接、无法逐文件核对（前缀：${[...new Set(result.dynamic.map((item) => item.prefix))].join("、")}），已按目录前缀整体视为「被引用」。`,
    );
    out.push("");
  }
  if (result.commentRefs) {
    out.push(`另有 ${result.commentRefs} 行是注释里的示例路径（例如 \`app/lib/lesson/recordings.ts\` 的用法说明），不计入引用。`);
    out.push("");
  }

  out.push("## 3. 无人引用的文件（孤儿）");
  out.push("");
  out.push(
    `在 \`${ORPHAN_SCOPES.join("`、`")}\` 三个目录里，合计 ${result.orphans.length} 个文件（${mb(result.orphansBytes)}）没有任何引用。**只报告，不删除。**`,
  );
  out.push("");
  const byDir = new Map();
  for (const item of result.orphans) {
    const key = item.rel.split("/").slice(0, item.rel.startsWith("art/units/") ? 2 : 1).join("/");
    const current = byDir.get(key) ?? { files: 0, bytes: 0, sample: [] };
    current.files += 1;
    current.bytes += item.size;
    if (current.sample.length < 3) current.sample.push(item.rel);
    byDir.set(key, current);
  }
  out.push("| 目录 | 孤儿数 | 字节 | 样例 |");
  out.push("|---|---|---|---|");
  for (const [key, value] of [...byDir.entries()].sort((a, b) => b[1].bytes - a[1].bytes)) {
    out.push(`| \`${key}/\` | ${value.files} | ${value.bytes} | ${value.sample.map((item) => `\`${item}\``).join("、")} |`);
  }
  out.push("");
  out.push("体积最大的 20 个孤儿：");
  out.push("");
  out.push(...cap(result.orphans, (item) => `- \`${item.rel}\` ${item.size} B`));
  out.push("");

  out.push("## 4. 超大或格式不当");
  out.push("");
  out.push(`**单张图片 > 250 KB 的 ${result.oversized.length} 个**：`);
  out.push("");
  out.push(...cap(result.oversized, (item) => `- \`${item.rel}\` ${item.size} B（${kb(item.size)}）`));
  out.push("");
  out.push(`**\`public/media/scores/\` 里不是 .webp 的 ${result.wrongFormat.length} 个**：`);
  out.push("");
  out.push(...(result.wrongFormat.length ? result.wrongFormat.map((item) => `- \`${item}\``) : ["（无）"]));
  out.push("");
  out.push(`**内容重复（同大小且 SHA-256 相同）的 ${result.duplicates.length} 组**：`);
  out.push("");
  out.push(
    ...(result.duplicates.length
      ? result.duplicates.map(
          (item) => `- ${item.files.length} 个文件内容相同，各 ${item.size} B：${item.files.map((file) => `\`${file}\``).join("、")}`,
        )
      : ["（无）"]),
  );
  out.push("");

  out.push("## 5. units.json 里没有谱例的作品");
  out.push("");
  out.push(
    `\`units.json\` 共 ${result.unitWorkTotal} 个作品条目，其中 \`scores\` 为空（页面上会显示宣纸底占位封面）的 **${result.emptyScoreWorks.length} 个**：`,
  );
  out.push("");
  out.push(
    ...(result.emptyScoreWorks.length
      ? result.emptyScoreWorks.map(
          (item) => `- ${item.book}｜${item.unit}｜${item.name}（印刷页 ${item.page ?? "—"} / PDF ${item.pdfPage ?? "—"}）`,
        )
      : ["（无）"]),
  );
  out.push("");
  return out.join("\n");
}

function summaryLine(result) {
  return `ASSET_AUDIT_DONE files=${result.fileCount} bytes=${result.totalBytes} dangling=${result.dangling.length} orphans=${result.orphans.length} oversize=${result.oversized.length} duplicates=${result.duplicates.length} emptyScores=${result.emptyScoreWorks.length}`;
}

const writeReport = async (result, target) => {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, renderReport(result), "utf8");
};

// ---- 自证 -----------------------------------------------------------------

async function writeFixture() {
  const pub = path.join(SELF_TEST_ROOT, "public");
  const app = path.join(SELF_TEST_ROOT, "app");
  await mkdir(path.join(pub, "art"), { recursive: true });
  await mkdir(path.join(pub, "media", "scores", "g7s1"), { recursive: true });
  await mkdir(path.join(pub, "data"), { recursive: true });
  await mkdir(path.join(app, "components"), { recursive: true });

  // 被引用的正常文件
  await writeFile(path.join(pub, "art", "used.webp"), randomBytes(1024));
  await writeFile(path.join(pub, "media", "scores", "g7s1", "ok.webp"), randomBytes(2048));
  await writeFile(path.join(pub, "favicon.svg"), "<svg/>");
  await writeFile(path.join(pub, "og.jpg"), randomBytes(1024));
  // 孤儿：没有任何引用
  await writeFile(path.join(pub, "art", "orphan.webp"), randomBytes(512));
  // 超大文件：> 250 KB（下面会在 app 里引用它，避免它同时被算成孤儿）
  await writeFile(path.join(pub, "art", "big.webp"), randomBytes(300 * 1024));
  // 唯一的说明文件，不应算孤儿
  await writeFile(path.join(pub, "art", "SOURCES.md"), "# fixture\n");

  await writeFile(
    path.join(pub, "data", "units.json"),
    JSON.stringify(
      [
        {
          bookKey: "g7s1",
          name: "第一单元 自证",
          works: [
            { name: "《有谱例的歌》", scores: ["media/scores/g7s1/ok.webp"] },
            { name: "《悬空引用的歌》", scores: ["media/scores/g7s1/missing.webp"] },
          ],
        },
      ],
      null,
      1,
    ),
  );
  await writeFile(
    path.join(app, "components", "Thing.tsx"),
    [
      "export const Thing = () => (",
      "  <>",
      '    <img src={publicAssetUrl("art/used.webp")} alt="" />',
      '    <img src={publicAssetUrl("art/big.webp")} alt="" />',
      "  </>",
      ");",
      "",
    ].join("\n"),
  );
  await writeFile(
    path.join(app, "layout.tsx"),
    ['export const metadata = {', "  icons: { icon: `${publicBasePath}/favicon.svg` },", "};", ""].join("\n"),
  );
}

async function selfTest() {
  await writeFixture();
  const result = await runAudit(SELF_TEST_ROOT);
  await writeReport(result, SELF_TEST_REPORT);

  const danglingHit = result.dangling.some((item) => item.path === "media/scores/g7s1/missing.webp");
  const orphanHit = result.orphans.some((item) => item.rel === "art/orphan.webp");
  const usedNotOrphan = !result.orphans.some((item) => item.rel === "art/used.webp");
  const sourceMdNotOrphan = !result.orphans.some((item) => item.rel === "art/SOURCES.md");
  const oversizeHit = result.oversized.some((item) => item.rel === "art/big.webp");

  console.log("=== 自证：假仓库 ===");
  console.log(`假仓库文件数 ${result.fileCount}，悬空引用 ${result.dangling.length}，孤儿 ${result.orphans.length}，超大 ${result.oversized.length}`);
  console.log(`悬空引用明细：${result.dangling.map((item) => `${item.path} ← ${item.from}${item.line ? `:${item.line}` : ""}`).join("；") || "（无）"}`);
  console.log(`孤儿明细：${result.orphans.map((item) => item.rel).join("、") || "（无）"}`);
  console.log(`超大明细：${result.oversized.map((item) => `${item.rel} ${item.size}B`).join("、") || "（无）"}`);
  console.log(`自证报告：${SELF_TEST_REPORT}`);
  console.log("");
  const checks = [
    ["悬空引用被抓到（media/scores/g7s1/missing.webp）", danglingHit],
    ["孤儿被抓到（art/orphan.webp）", orphanHit],
    ["被引用的 art/used.webp 没有被误判成孤儿", usedNotOrphan],
    ["说明文件 art/SOURCES.md 没有被误判成孤儿", sourceMdNotOrphan],
    ["超大文件被抓到（art/big.webp）", oversizeHit],
  ];
  let failed = 0;
  for (const [label, ok] of checks) {
    console.log(`${ok ? "✅" : "❌"} ${label}`);
    if (!ok) failed += 1;
  }
  if (result.dangling.length !== 1) {
    console.log(`❌ 悬空引用数应为 1，实际 ${result.dangling.length}`);
    failed += 1;
  }
  if (result.orphans.length !== 1) {
    console.log(`❌ 孤儿数应为 1，实际 ${result.orphans.length}`);
    failed += 1;
  }
  console.log("");
  console.log(failed === 0 ? "SELF_TEST_PASSED" : `SELF_TEST_FAILED checks=${failed}`);
  return failed === 0 ? 0 : 1;
}

// ---- 入口 -----------------------------------------------------------------

const argv = process.argv.slice(2);
const readOption = (name) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
};

if (argv.includes("--self-test")) {
  process.exitCode = await selfTest();
} else if (argv.includes("--help")) {
  console.log("用法：node scripts/audit-assets.mjs [--root <目录>] [--self-test]");
} else {
  const root = path.resolve(readOption("--root") ?? DEFAULT_ROOT);
  const result = await runAudit(root);
  await writeReport(result, REPORT_PATH);
  await mkdir(path.dirname(JSON_PATH), { recursive: true });
  await writeFile(JSON_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(
    `体积总览：${result.overview.map((row) => `${row.name}=${row.files}个/${mb(row.bytes)}`).join("，")}`,
  );
  console.log(`悬空引用 ${result.dangling.length} 条，孤儿 ${result.orphans.length} 个，超大图片 ${result.oversized.length} 个，重复 ${result.duplicates.length} 组，无谱例作品 ${result.emptyScoreWorks.length} 个`);
  console.log(`报告：${REPORT_PATH}`);
  console.log(`明细 JSON：${JSON_PATH}`);
  console.log(summaryLine(result));
}
