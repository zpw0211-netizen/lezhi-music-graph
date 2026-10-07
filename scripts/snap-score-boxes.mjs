#!/usr/bin/env node
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { flattenTextbookSource } from "./lib/textbook-source-check.mjs";
import { detectScoreBlocks, snapScoreBox } from "./lib/score-snap.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
let key;
let writeMode = false;
let sourceArgument;
const unexpected = [];
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--write") writeMode = true;
  else if (arg === "--source") {
    sourceArgument = args[index + 1];
    if (!sourceArgument || sourceArgument.startsWith("--")) unexpected.push(arg);
    else index += 1;
  } else if (arg.startsWith("--")) unexpected.push(arg);
  else if (!key) key = arg;
  else unexpected.push(arg);
}

if (!key || unexpected.length) {
  console.error("用法：node scripts/snap-score-boxes.mjs <key> [--write] [--source <path>]");
  process.exit(2);
}

const elementaryKey = /^g([1-6])s([12])$/.exec(key);
if (!elementaryKey) {
  console.error(`只支持小学册号 g1s1–g6s2；拒绝处理“${key}”。`);
  process.exit(2);
}

const canonicalSourcePath = path.join(repoRoot, "content", "textbooks", `${key}.mjs`);
const sourcePath = path.resolve(sourceArgument ?? canonicalSourcePath);
if (writeMode && sourcePath.toLowerCase() !== canonicalSourcePath.toLowerCase()) {
  console.error("--write 只允许改写 content/textbooks/<key>.mjs；自定义 --source 仅用于试跑。");
  process.exit(2);
}

// Keep browser profiles, temporary files and npm's incidental cache on E:.
const safeTempRoot = "E:\\Projects\\.tmp\\codex2";
if (!process.env.TEMP || /^c:/iu.test(process.env.TEMP)) process.env.TEMP = safeTempRoot;
if (!process.env.TMP || /^c:/iu.test(process.env.TMP)) process.env.TMP = safeTempRoot;

const sourceText = await readFile(sourcePath, "utf8");
const sourceUrl = `${pathToFileURL(sourcePath).href}?snap=${Date.now()}`;
const textbook = (await import(sourceUrl)).default;
if (textbook?.key !== key) throw new Error(`源文件册号与参数不符：${textbook?.key ?? "未提供 key"} / ${key}`);
const data = flattenTextbookSource(textbook);
const pdfOffset = Number.isInteger(data.pdfOffset) ? data.pdfOffset : 0;
const entries = [];
for (const owner of [...(data.works ?? []), ...(data.concepts ?? [])]) {
  for (let scoreIndex = 0; scoreIndex < (owner.scores ?? []).length; scoreIndex += 1) {
    const score = owner.scores[scoreIndex];
    const page = score[0];
    const pdfPage = typeof page === "object" ? page.pdf : Number(page) + pdfOffset;
    entries.push({
      id: `${owner.name ?? "未命名"}#${scoreIndex + 1}`,
      name: owner.name ?? "未命名",
      pdfPage,
      box: score.slice(1, 5).map(Number),
      rotate: Number(score[5]?.rotate ?? 0),
    });
  }
}
if (!entries.length) throw new Error(`没有谱例框：${key}`);

const scanRoot = path.resolve(process.env.TEXTBOOK_SCAN_DIR ?? "E:\\Projects\\textbook-scan", key, "orig");
const scanByPage = new Map();
for (const entry of entries) {
  const imagePath = path.join(scanRoot, `p${String(entry.pdfPage).padStart(2, "0")}.jpg`);
  if (!scanByPage.has(entry.pdfPage)) scanByPage.set(entry.pdfPage, { imagePath, image: await readFile(imagePath) });
}

const playwrightPackage = process.env.PLAYWRIGHT_MODULE
  ?? "C:\\Users\\HONOR\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright\\package.json";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const requireFromPlaywright = createRequire(playwrightPackage);
const { chromium } = requireFromPlaywright("playwright");
const profilePath = path.join(safeTempRoot, `T055-score-snap-${key}-edge-profile`);
await mkdir(profilePath, { recursive: true });
const context = await chromium.launchPersistentContext(profilePath, {
  headless: true,
  executablePath,
  viewport: { width: 1440, height: 1000 },
  args: ["--disable-extensions", "--disable-background-networking"],
});

const detectorSource = detectScoreBlocks.toString();
const page = context.pages()[0] ?? await context.newPage();
const analyzedByPage = new Map();
try {
  for (const [pdfPage, item] of scanByPage) {
    const dataUrl = `data:image/jpeg;base64,${item.image.toString("base64")}`;
    const analysis = await page.evaluate(async ({ dataUrl, detectorSource }) => {
      const image = new Image();
      image.src = dataUrl;
      await image.decode();
      const scale = Math.min(1, 1400 / image.naturalWidth, 2100 / image.naturalHeight);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const detector = new Function(`return (${detectorSource})`)();
      return detector(imageData.data, width, height);
    }, { dataUrl, detectorSource });
    analyzedByPage.set(pdfPage, analysis);
  }
} finally {
  await context.close();
}

for (const entry of entries) {
  entry.detection = analyzedByPage.get(entry.pdfPage);
  entry.result = snapScoreBox(entry.box, entry.detection.blocks);
}

function formatCoord(value) {
  const rounded = Number(value.toFixed(4));
  return String(rounded);
}

function scoreNodeRows(source, defaultPdfOffset) {
  const sourceFile = ts.createSourceFile("textbook.mjs", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if (sourceFile.parseDiagnostics.length) {
    throw new Error(`TypeScript AST 无法解析源文件：${sourceFile.parseDiagnostics[0].messageText}`);
  }
  const rows = [];
  const numberValue = (node) => {
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) {
      return -Number(node.operand.text);
    }
    return null;
  };
  const pageValue = (node) => {
    const direct = numberValue(node);
    if (direct !== null) return direct + defaultPdfOffset;
    if (!ts.isObjectLiteralExpression(node)) return null;
    const pdf = node.properties.find((property) =>
      ts.isPropertyAssignment(property) && property.name.getText(sourceFile).replaceAll(/["']/gu, "") === "pdf",
    );
    return pdf && ts.isPropertyAssignment(pdf) ? numberValue(pdf.initializer) : null;
  };

  const visit = (node) => {
    if (ts.isPropertyAssignment(node) && node.name.getText(sourceFile).replaceAll(/["']/gu, "") === "scores" && ts.isArrayLiteralExpression(node.initializer)) {
      for (const item of node.initializer.elements) {
        if (!ts.isArrayLiteralExpression(item) || item.elements.length < 5) continue;
        const values = item.elements.slice(1, 5);
        const page = pageValue(item.elements[0]);
        if (page === null || values.some((value) => numberValue(value) === null)) continue;
        rows.push({
          pdfPage: page,
          box: values.map(numberValue),
          spans: values.map((value) => ({ start: value.getStart(sourceFile), end: value.getEnd() })),
        });
      }
    }
    node.forEachChild(visit);
  };
  visit(sourceFile);
  return rows;
}

function boxKey(pdfPage, box) {
  return `${pdfPage}:${box.map((value) => Number(value).toFixed(6)).join(",")}`;
}

async function saveContactSheets() {
  const outputRoot = path.resolve(process.env.TEXTBOOK_SCORE_OUTPUT_DIR ?? "E:\\Projects\\.tmp\\check", `${key}-snap`);
  await mkdir(outputRoot, { recursive: true });
  const sheetSize = 4;
  const contactPage = await contextlessContactPage();
  const outputPaths = [];
  try {
    for (let start = 0; start < entries.length; start += sheetSize) {
      const batch = entries.slice(start, start + sheetSize).map((entry) => ({
        ...entry,
        dataUrl: `data:image/jpeg;base64,${scanByPage.get(entry.pdfPage).image.toString("base64")}`,
      }));
      const dataUrl = await contactPage.evaluate(async (items) => {
        const columns = 2;
        const rows = 2;
        const cellWidth = 840;
        const cellHeight = 600;
        const panelWidth = 390;
        const panelHeight = 510;
        const canvas = document.createElement("canvas");
        canvas.width = columns * cellWidth;
        canvas.height = rows * cellHeight;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#f4eee1";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "18px Arial, sans-serif";
        ctx.textBaseline = "top";

        const drawPanel = (image, rect, crop, color, label) => {
          const x = rect.x;
          const y = rect.y;
          const w = rect.w;
          const h = rect.h;
          const sx = crop[0] * image.naturalWidth;
          const sy = crop[1] * image.naturalHeight;
          const sw = (crop[2] - crop[0]) * image.naturalWidth;
          const sh = (crop[3] - crop[1]) * image.naturalHeight;
          const scale = Math.min(w / sw, h / sh);
          const drawWidth = sw * scale;
          const drawHeight = sh * scale;
          const dx = x + (w - drawWidth) / 2;
          const dy = y + (h - drawHeight) / 2;
          ctx.fillStyle = "#fffdf8";
          ctx.fillRect(x, y, w, h);
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.clip();
          ctx.drawImage(image, sx, sy, sw, sh, dx, dy, drawWidth, drawHeight);
          const [x0, y0, x1, y1] = color.box;
          ctx.strokeStyle = color.stroke;
          ctx.lineWidth = 4;
          ctx.setLineDash(color.dash ? [9, 6] : []);
          ctx.strokeRect(
            dx + (x0 * image.naturalWidth - sx) * scale,
            dy + (y0 * image.naturalHeight - sy) * scale,
            (x1 - x0) * image.naturalWidth * scale,
            (y1 - y0) * image.naturalHeight * scale,
          );
          ctx.restore();
          ctx.fillStyle = "#1b2622";
          ctx.fillText(label, x, y + h + 8);
        };

        for (let index = 0; index < items.length; index += 1) {
          const item = items[index];
          const image = new Image();
          image.src = item.dataUrl;
          await image.decode();
          const cellX = (index % columns) * cellWidth;
          const cellY = Math.floor(index / columns) * cellHeight;
          ctx.fillStyle = "#1b2622";
          ctx.font = "bold 18px Arial, sans-serif";
          const status = item.result.status === "auto" ? "AUTO" : `需人工：${item.result.reason ?? "未吸附"}`;
          ctx.fillText(`${item.name} · PDF p.${item.pdfPage} · ${status}`, cellX + 12, cellY + 8);

          const proposed = item.result.box ?? item.box;
          const x0 = Math.max(0, Math.min(item.box[0], proposed[0]) - 0.025);
          const y0 = Math.max(0, Math.min(item.box[1], proposed[1]) - 0.025);
          const x1 = Math.min(1, Math.max(item.box[2], proposed[2]) + 0.025);
          const y1 = Math.min(1, Math.max(item.box[3], proposed[3]) + 0.025);
          const crop = [x0, y0, x1, y1];
          drawPanel(image, { x: cellX + 12, y: cellY + 36, w: panelWidth, h: panelHeight }, crop, { box: item.box, stroke: "#c92828" }, "原框（红）");
          if (item.result.box) {
            drawPanel(image, { x: cellX + 430, y: cellY + 36, w: panelWidth, h: panelHeight }, crop, { box: item.result.box, stroke: "#198b45", dash: item.result.status === "manual" }, "候选框（绿）");
          } else {
            drawPanel(image, { x: cellX + 430, y: cellY + 36, w: panelWidth, h: panelHeight }, crop, { box: item.box, stroke: "#c92828", dash: true }, "无候选，需人工");
          }
          ctx.strokeStyle = "#cfc4ac";
          ctx.strokeRect(cellX + 4, cellY + 4, cellWidth - 8, cellHeight - 8);
        }
        return canvas.toDataURL("image/jpeg", 0.9);
      }, batch);
      const outputPath = path.join(outputRoot, `contact-${String(outputPaths.length + 1).padStart(2, "0")}.jpg`);
      await writeFile(outputPath, Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64"));
      outputPaths.push(outputPath);
    }
  } finally {
    await contactPage.close();
  }

  const auto = entries.filter((entry) => entry.result.status === "auto").length;
  const manual = entries.length - auto;
  const reportLines = [
    `# ${key} 谱例框吸附试跑`,
    "",
    `- 输入源：${sourcePath}`,
    `- 自动候选：${auto}`,
    `- 需人工：${manual}`,
    `- 联系单：${outputPaths.length} 张，目录 ${outputRoot}`,
    "",
    "| 谱例 | PDF页 | 状态 | 原框 | 候选框 | 原因 |",
    "|---|---:|---|---|---|---|",
    ...entries.map((entry) => `| ${entry.name} | ${entry.pdfPage} | ${entry.result.status === "auto" ? "自动" : "需人工"} | ${entry.box.map(formatCoord).join(", ")} | ${(entry.result.box ?? []).map(formatCoord).join(", ") || "—"} | ${entry.result.reason ?? "—"} |`),
  ];
  const reportPath = path.join(outputRoot, "report.md");
  await writeFile(reportPath, `${reportLines.join("\n")}\n`, "utf8");
  return { outputRoot, outputPaths, reportPath };
}

async function contextlessContactPage() {
  const pw = requireFromPlaywright("playwright");
  const browser = await pw.chromium.launch({
    headless: true,
    executablePath,
    args: ["--disable-extensions", "--disable-background-networking"],
  });
  // launch() uses TEMP/TMP, which are forced above to E:\Projects\.tmp\codex2.
  const contactContext = await browser.newContext({ viewport: { width: 1680, height: 1200 } });
  const contactPage = await contactContext.newPage();
  const close = contactPage.close.bind(contactPage);
  contactPage.close = async () => {
    await close();
    await contactContext.close();
    await browser.close();
  };
  return contactPage;
}

const autoCount = entries.filter((entry) => entry.result.status === "auto").length;
const manualEntries = entries.filter((entry) => entry.result.status === "manual");
let contactResult = null;
if (!writeMode) contactResult = await saveContactSheets();

if (writeMode) {
  const astRows = scoreNodeRows(sourceText, pdfOffset);
  if (astRows.length !== entries.length) {
    throw new Error(`scores AST 项数与源数据不一致：${astRows.length} / ${entries.length}，停止写入。`);
  }
  const nodeBuckets = new Map();
  for (const row of astRows) {
    const token = boxKey(row.pdfPage, row.box);
    const bucket = nodeBuckets.get(token) ?? [];
    bucket.push(row);
    nodeBuckets.set(token, bucket);
  }
  const replacements = [];
  let matched = 0;
  for (const entry of entries) {
    if (entry.result.status !== "auto" || !entry.result.box) continue;
    const bucket = nodeBuckets.get(boxKey(entry.pdfPage, entry.box));
    const row = bucket?.shift();
    if (!row) throw new Error(`找不到 AST 谱例坐标：${entry.name} / PDF p.${entry.pdfPage}`);
    row.spans.forEach((span, index) => replacements.push({ ...span, value: formatCoord(entry.result.box[index]) }));
    matched += 1;
  }
  let updated = sourceText;
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    updated = `${updated.slice(0, replacement.start)}${replacement.value}${updated.slice(replacement.end)}`;
  }
  if (updated !== sourceText) await writeFile(sourcePath, updated, "utf8");
  console.log(`已写入 ${matched} 个自动吸附谱例框：${sourcePath}`);
  console.log(`需人工 ${manualEntries.length} 个；未自动改动。`);
} else {
  console.log(`${key}: ${autoCount} 个自动候选，${manualEntries.length} 个需人工。`);
  console.log(`联系单：${contactResult.outputRoot}`);
  console.log(`汇总：${contactResult.reportPath}`);
}
