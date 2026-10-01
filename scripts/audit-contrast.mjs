// audit-contrast.mjs — WCAG 2.x 对比度检查工具。
// 1) 规范内置检查：解析 DESIGN-v2.md 第 2 节的颜色表，检查规范要求的「文字色 × 背景色」组合。
// 2) 站点实际样式检查：扫描 app/ 下 CSS，找同一规则里 color 与 background(-color) 都可解析的规则并计算对比度。
// 默认只报告；--strict 时规范内置检查有不达标就 exit(1)。
// 变量只用 app/styles/tokens.css 里的定义解析（最后定义生效）；渐变、color-mix、currentColor 跳过并计数。
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "../app");
const designDoc = path.resolve(scriptDir, "../../../yapu-collab/DESIGN-v2.md");
const outDir = process.env.GLM2_OUTBOX
  ? path.resolve(process.env.GLM2_OUTBOX)
  : path.resolve(scriptDir, "../../../yapu-collab/glm2/outbox");

const AA_NORMAL = 4.5; // 正文阈值
const AA_LARGE = 3.0; // 大字（≥24px 或 ≥18.66px 加粗）阈值

// ---------- WCAG 2.x 相对亮度与对比度 ----------

function srgbChannel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
}

function hexToRgb(hex) {
  const raw = hex.replace("#", "");
  return [0, 1, 2].map((i) => parseInt(raw.slice(i * 2, i * 2 + 2), 16));
}

/** 前景带透明度时，按叠在背景上的合成结果计算。 */
function composite(fg, bg) {
  const rawFg = fg.replace("#", "");
  if (rawFg.length !== 8) return fg;
  const alpha = parseInt(rawFg.slice(6, 8), 16) / 255;
  const f = hexToRgb(fg);
  const b = hexToRgb(bg);
  const mixed = f.map((c, i) => Math.round(c * alpha + b[i] * (1 - alpha)));
  return `#${mixed.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function contrast(fgRaw, bgRaw) {
  const fg = composite(fgRaw, bgRaw);
  const l1 = luminance(fg);
  const l2 = luminance(bgRaw);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** 二分法：把颜色向黑色加深到刚好达到目标对比度，返回建议色值。 */
function darkerToMeet(fg, bg, target) {
  if (contrast(fg, bg) >= target) return fg;
  const [r, g, b] = hexToRgb(fg);
  let low = 0;
  let high = 1;
  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2;
    const candidate = `#${[r, g, b].map((c) => Math.round(c * (1 - mid)).toString(16).padStart(2, "0")).join("")}`;
    if (contrast(candidate, bg) >= target) high = mid;
    else low = mid;
  }
  const t = high;
  return `#${[r, g, b].map((c) => Math.round(c * (1 - t)).toString(16).padStart(2, "0")).join("")}`;
}

// ---------- 自测（每次运行都会先做，防止公式错 silently 出错） ----------

const SELF_TESTS = [
  [contrast("#000000", "#FFFFFF"), 21.0, "黑对白必须 21.00"],
  [contrast("#767676", "#FFFFFF"), 4.54, "WCAG 经典边界值 ≈4.54"],
];
for (const [actual, expected, label] of SELF_TESTS) {
  if (Math.abs(actual - expected) > 0.01) {
    console.error(`算法自测失败：${label}，得到 ${actual.toFixed(2)}，期望 ${expected}`);
    process.exit(1);
  }
}
console.log(`算法自测：contrast(#000000,#FFFFFF)=${SELF_TESTS[0][0].toFixed(2)}（期望 21.00）；contrast(#767676,#FFFFFF)=${SELF_TESTS[1][0].toFixed(2)}（期望 ≈4.54）`);

// ---------- 解析 DESIGN-v2.md 第 2 节颜色表 ----------

async function readSpecPalette() {
  const text = await readFile(designDoc, "utf8");
  const section = text.split(/^## /m).find((part) => part.startsWith("2."));
  const palette = new Map();
  const lineRe = /`(--[a-z0-9-]+)`\s*\|\s*`#([0-9A-Fa-f]{6,8})`/g;
  for (const line of (section ?? "").split("\n")) {
    const match = lineRe.exec(line);
    lineRe.lastIndex = 0;
    if (match) palette.set(match[1], `#${match[2]}`);
  }
  if (palette.size < 10) {
    console.error(`DESIGN-v2.md 第 2 节只解析出 ${palette.size} 个颜色，疑似表格格式变化`);
    process.exit(1);
  }
  return palette;
}

const SPEC_PAIRS = [
  ["正文 --ink / --paper", "ink", "paper"],
  ["正文 --ink / --paper-2", "ink", "paper-2"],
  ["正文 --ink / --sheet", "ink", "sheet"],
  ["次要文字 --ink-2 / --paper", "ink-2", "paper"],
  ["次要文字 --ink-2 / --paper-2", "ink-2", "paper-2"],
  ["次要文字 --ink-2 / --sheet", "ink-2", "sheet"],
  ["辅助文字 --ink-3 / --paper（规范：仅 ≥13px 宣纸底）", "ink-3", "paper"],
  ["辅助文字 --ink-3 / --paper-2（规范外组合，仍检查）", "ink-3", "paper-2"],
  ["辅助文字 --ink-3 / --sheet（规范外组合，仍检查）", "ink-3", "sheet"],
  ["主按钮 --paper 文字 / --pine 底", "paper", "pine"],
  ["主按钮 --paper 文字 / --seal 底", "paper", "seal"],
  ["强调 --seal 作文字 / --paper 底", "seal", "paper"],
  ["强调 --pine 作文字 / --paper 底", "pine", "paper"],
  ["强调 --amber 作文字 / --paper 底", "amber", "paper"],
  ["深色底 --paper 文字 / --pine-deep 底", "paper", "pine-deep"],
];

// ---------- 解析站点 CSS ----------

async function listCssFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") files.push(...(await listCssFiles(fullPath)));
    else if (/\.css$/.test(entry.name)) files.push(fullPath);
  }
  return files.sort();
}

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, " "));
}

/** 极简花括号配平解析器：返回 {selector, body, offset} 列表（@media 等包在 selector 前缀里）。 */
function parseCssRules(text) {
  const rules = [];
  const stack = [];
  let declStart = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "{") {
      stack.push(text.slice(declStart, i).trim());
      declStart = i + 1;
    } else if (ch === "}") {
      const own = stack.pop() ?? "";
      const body = text.slice(declStart, i);
      if (!body.includes("{")) {
        rules.push({ selector: [...stack, own].filter(Boolean).join(" "), body, offset: declStart });
      }
      declStart = i + 1;
    }
  }
  return rules;
}

function lineOf(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function buildVarMap(tokensCss) {
  const map = new Map();
  const re = /(--[\w-]+)\s*:\s*([^;{}]+)[;}]?/g;
  let match = re.exec(tokensCss);
  while (match) {
    map.set(match[1], match[2].trim());
    match = re.exec(tokensCss);
  }
  return map;
}

const UNRESOLVABLE = /(gradient|color-mix|currentColor|rgba?\(|hsla?\(|transparent|inherit)/i;

function resolveColor(value, varMap, depth = 0) {
  const v = value.trim().replace(/;$/, "");
  if (/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(v)) return v;
  if (depth >= 6 || UNRESOLVABLE.test(v)) return null;
  const varMatch = v.match(/^var\(\s*(--[\w-]+)\s*([,)][^)]*)?$/);
  if (varMatch) {
    const def = varMap.get(varMatch[1]);
    if (def !== undefined) {
      const resolved = resolveColor(def, varMap, depth + 1);
      if (resolved) return resolved;
    }
    const fallback = varMatch[2];
    if (fallback && fallback.startsWith(",")) {
      return resolveColor(fallback.slice(1), varMap, depth + 1);
    }
  }
  return null;
}

function findDeclarations(body, property) {
  const re = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, "gi");
  const out = [];
  let match = re.exec(body);
  while (match) {
    out.push(match[1].trim());
    match = re.exec(body);
  }
  return out;
}

async function auditSiteStyles(varMap) {
  const files = await listCssFiles(appRoot);
  const failing = [];
  const skipped = new Map();
  let rulesScanned = 0;
  let pairsChecked = 0;
  for (const file of files) {
    const text = stripComments(await readFile(file, "utf8"));
    const relativeFile = path.relative(path.resolve(scriptDir, ".."), file).replace(/\\/g, "/");
    for (const rule of parseCssRules(text)) {
      rulesScanned += 1;
      const colors = findDeclarations(rule.body, "color");
      const backgrounds = [...findDeclarations(rule.body, "background-color"), ...findDeclarations(rule.body, "background")];
      if (!colors.length || !backgrounds.length) continue;
      // 规则里同属性多次声明时取最后一个（层叠语义）。
      const fgValue = colors[colors.length - 1];
      const bgValue = backgrounds[backgrounds.length - 1];
      const fg = resolveColor(fgValue, varMap);
      const bg = resolveColor(bgValue, varMap);
      if (!fg || !bg) {
        const reason = UNRESOLVABLE.test(fgValue) || UNRESOLVABLE.test(bgValue) ? "渐变/函数色" : "变量无法从 tokens.css 解析";
        skipped.set(reason, (skipped.get(reason) ?? 0) + 1);
        continue;
      }
      if (bg.replace("#", "").length === 8) {
        // 背景带透明度时真实底色取决于父层，无法确定，跳过。
        skipped.set("背景色带透明度（底色未知）", (skipped.get("背景色带透明度（底色未知）") ?? 0) + 1);
        continue;
      }
      pairsChecked += 1;
      const ratio = contrast(fg, bg);
      if (ratio < AA_NORMAL) {
        failing.push({
          file: relativeFile,
          line: lineOf(text, rule.offset),
          selector: rule.selector.slice(0, 90),
          fg,
          bg,
          ratio,
        });
      }
    }
  }
  failing.sort((a, b) => a.ratio - b.ratio);
  return { files, rulesScanned, pairsChecked, failing, skipped };
}

// ---------- 主流程 ----------

async function main() {
  const palette = await readSpecPalette();
  const specRows = SPEC_PAIRS.map(([label, fgName, bgName]) => {
    const fg = palette.get(`--${fgName}`);
    const bg = palette.get(`--${bgName}`);
    if (!fg || !bg) return { label, missing: true };
    const ratio = contrast(fg, bg);
    return { label, fg, bg, ratio, normalPass: ratio >= AA_NORMAL, largePass: ratio >= AA_LARGE };
  });
  const specFailures = specRows.filter((row) => row.ratio !== undefined && !row.normalPass);

  const tokensCss = stripComments(await readFile(path.join(appRoot, "styles/tokens.css"), "utf8"));
  const varMap = buildVarMap(tokensCss);
  const site = await auditSiteStyles(varMap);

  const md = [];
  md.push("# T002 配色对比度检查报告（audit-contrast）");
  md.push("");
  md.push(`- 规范来源：DESIGN-v2.md 第 2 节，解析出 ${palette.size} 个颜色。`);
  md.push(`- 站点样式：扫描 app/ 下 ${site.files.length} 个 CSS，${site.rulesScanned} 条规则，其中 ${site.pairsChecked} 条「color × background 均可解析」的组合参与计算。`);
  md.push("- 阈值：正文 ≥4.5:1；大字（≥24px 或 ≥18.66px 加粗）≥3:1。默认只报告；`--strict` 时规范组合有不达标即 exit(1)。");
  md.push("");

  md.push("## 一、规范内置检查（DESIGN-v2 第 2 节）");
  md.push("");
  md.push("| 组合 | 颜色 | 比值 | 正文 ≥4.5 | 大字 ≥3 |");
  md.push("| --- | --- | ---: | --- | --- |");
  for (const row of specRows) {
    if (row.missing) {
      md.push(`| ${row.label} | 缺失 | — | — | — |`);
      continue;
    }
    md.push(`| ${row.label} | ${row.fg} / ${row.bg} | ${row.ratio.toFixed(2)} | ${row.normalPass ? "✅" : "❌"} | ${row.largePass ? "✅" : "❌"} |`);
  }
  const amberRow = specRows.find((row) => row.label.includes("--amber 作文字"));
  if (amberRow && amberRow.ratio !== undefined && !amberRow.normalPass) {
    const suggested = darkerToMeet(amberRow.fg, amberRow.bg, AA_NORMAL);
    md.push("");
    md.push(`> ⚠️ --amber（${amberRow.fg}）作正文文字在 --paper 上不达标（${amberRow.ratio.toFixed(2)}）。如需保持色相，至少要加深到 **${suggested}** 才能达到 4.5:1（二分法算出，只作建议）。`);
  }
  const ink3Fails = specRows.filter((row) => row.label.includes("--ink-3") && row.ratio !== undefined && !row.normalPass);
  if (ink3Fails.length) {
    md.push("");
    md.push(`> ⚠️ --ink-3 共有 ${ink3Fails.length} 个组合低于 4.5:1。规范写明它只用于 ≥13px 辅助文字，按 4.5 检查时如实标出，需 Claude 决定是否放宽或加深。`);
  }
  md.push("");

  md.push("## 二、站点实际样式不达标清单（比值从低到高）");
  md.push("");
  if (!site.failing.length) md.push("未发现不达标组合。");
  else {
    md.push("| 位置 | 选择器 | 文字 | 背景 | 比值 |");
    md.push("| --- | --- | --- | --- | ---: |");
    for (const item of site.failing.slice(0, 40)) {
      md.push(`| \`${item.file}:${item.line}\` | ${item.selector} | ${item.fg} | ${item.bg} | ${item.ratio.toFixed(2)} |`);
    }
    if (site.failing.length > 40) md.push(`> 另有 ${site.failing.length - 40} 条，见控制台/JSON 汇总。`);
  }
  md.push("");

  md.push("## 三、跳过统计");
  md.push("");
  if (!site.skipped.size) md.push("无跳过。");
  else for (const [reason, count] of site.skipped) md.push(`- ${reason}：${count} 条规则`);

  await mkdir(outDir, { recursive: true });
  const mdPath = path.join(outDir, "T002-contrast-report.md");
  await writeFile(mdPath, md.join("\n"), "utf8");

  console.log(`规范组合 ${specRows.length} 项，不达标 ${specFailures.length} 项；站点检查 ${site.pairsChecked} 组合，不达标 ${site.failing.length} 条，跳过 ${[...site.skipped.values()].reduce((a, b) => a + b, 0)} 条`);
  console.log(`报告已写入：${mdPath}；规范不达标 ${specFailures.length} 项，站点不达标 ${site.failing.length} 条`);

  if (process.argv.includes("--strict") && specFailures.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
