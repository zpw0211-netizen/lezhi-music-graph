// audit-palette-usage.mjs — 旧样式颜色使用盘点（只读，不改任何颜色）。
//
// 用法：
//   node scripts/audit-palette-usage.mjs             生成盘点报告（.md + .jsonl）
//   node scripts/audit-palette-usage.mjs --self-test 先跑自证，失败 exit 1
//
// 输出目录：AUDIT_OUT_DIR 环境变量，缺省为仓库内被 git 忽略的 .tmp-audit/。
// 规范来源：DESIGN-v2.md 第 2 节（经 DESIGN_SPEC 环境变量或仓库上层的
// yapu-collab 目录定位，不写死绝对路径）。
//
// 说明：WCAG 亮度/对比度函数复制自 scripts/audit-contrast.mjs（glm2 在 T002
// 写的工具；那个脚本 import 即执行主流程，无法直接复用，故按任务约定复制）。
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const appRoot = path.join(repoRoot, "app");

const designDocCandidates = [
  process.env.DESIGN_SPEC,
  path.resolve(scriptDir, "../../yapu-collab/DESIGN-v2.md"),
  path.resolve(scriptDir, "../../../yapu-collab/DESIGN-v2.md"),
].filter(Boolean);
const designDoc = designDocCandidates.find((candidate) => existsSync(candidate)) ?? designDocCandidates[0];

const outDir = path.resolve(process.env.AUDIT_OUT_DIR ?? path.join(repoRoot, ".tmp-audit"));

// ---------- WCAG 对比度（复制自 scripts/audit-contrast.mjs，T002） ----------

function srgbChannel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function hexToRgb(hex) {
  const raw = hex.replace("#", "");
  return [0, 1, 2].map((i) => parseInt(raw.slice(i * 2, i * 2 + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
}

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

// ---------- CIELAB（D65）与 ΔE76 ----------

function rgbToLab(hex) {
  const [r8, g8, b8] = hexToRgb(hex);
  const lin = [r8, g8, b8].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const [r, g, b] = lin;
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

function deltaE76(hexA, hexB) {
  const a = rgbToLab(hexA);
  const b = rgbToLab(hexB);
  return Math.sqrt((a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

// ---------- 颜色字面量解析 ----------

const HEX_RE = /#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{3})(?![0-9A-Fa-f])/g;
const RGB_RE = /rgba?\(([^)]*)\)/gi;
const HSL_RE = /hsla?\(([^)]*)\)/gi;
const VAR_RE = /var\(\s*(--[\w-]+)/g;

/** 把一个 hex 字面量规范化为 {base:"#RRGGBB", alpha:number}。 */
function normalizeHex(raw) {
  let hex = raw.slice(1);
  if (hex.length === 3 || hex.length === 4) {
    hex = [...hex].map((c) => c + c).join("");
  }
  const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return { base: `#${hex.slice(0, 6).toUpperCase()}`, alpha };
}

function hslToRgbHex(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  const segment = Math.floor(hue / 60) % 6;
  const table = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [r, g, b] = table[segment].map((v) => Math.round((v + m) * 255));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** 解析 rgb()/rgba() 的逗号或空格语法（支持 %），返回 {base, alpha} 或 null。 */
function parseRgbCall(inner) {
  const parts = inner.trim().split(/\s*,\s*|\s+/).filter(Boolean);
  if (parts.length < 3) return null;
  const comps = parts.slice(0, 3).map((p) =>
    p.endsWith("%") ? Math.round((parseFloat(p) / 100) * 255) : Math.round(parseFloat(p)),
  );
  if (comps.some((v) => Number.isNaN(v) || v < 0 || v > 255)) return null;
  const alpha = parts.length > 3 ? parseFloat(parts[3]) : 1;
  if (Number.isNaN(alpha)) return null;
  const base = `#${comps.map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  return { base, alpha: Math.max(0, Math.min(1, alpha)) };
}

function parseHslCall(inner) {
  const parts = inner.trim().split(/\s*,\s*|\s+/).filter(Boolean);
  if (parts.length < 3) return null;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = parseFloat(parts[2]);
  if ([h, s, l].some((v) => Number.isNaN(v))) return null;
  const alpha = parts.length > 3 ? parseFloat(parts[3]) : 1;
  return { base: hslToRgbHex(h, s, l), alpha: Number.isNaN(alpha) ? 1 : Math.max(0, Math.min(1, alpha)) };
}

/** 把文本里的注释与 url(...) 内容替换成空格（保留换行，行号不漂移）。 */
function blankOut(text, regex) {
  return text.replace(regex, (match) => match.replace(/[^\n]/g, " "));
}

function prepareText(text, { cssComments = false, jsComments = false } = {}) {
  let out = blankOut(text, /url\(\s*[^)]*\)/gi); // 插画/data-URI 颜色不受规范约束
  if (cssComments) out = blankOut(out, /\/\*[\s\S]*?\*\//g);
  if (jsComments) {
    out = blankOut(out, /\/\*[\s\S]*?\*\//g);
    out = blankOut(out, /(^|[^:"'])\/\/[^\n]*/g);
  }
  return out;
}

/**
 * 在一段文本里找所有颜色字面量。返回 [{raw, base, alpha}]，每个匹配一项。
 * 8 位 hex 优先于 6 位，避免把 #RRGGBBAA 拆成两条。
 */
function extractColorLiterals(text) {
  const found = [];
  const seen = new Set();
  const push = (match) => {
    const key = `${match.index}:${match[0]}`;
    if (seen.has(key)) return;
    seen.add(key);
    const norm = normalizeHex(match[0]);
    found.push({ raw: match[0], base: norm.base, alpha: norm.alpha, index: match.index });
  };
  for (const match of text.matchAll(HEX_RE)) push(match);
  for (const match of text.matchAll(RGB_RE)) {
    const parsed = parseRgbCall(match[1]);
    if (parsed) {
      found.push({ raw: match[0], base: parsed.base, alpha: parsed.alpha, index: match.index });
    }
  }
  for (const match of text.matchAll(HSL_RE)) {
    const parsed = parseHslCall(match[1]);
    if (parsed) {
      found.push({ raw: match[0], base: parsed.base, alpha: parsed.alpha, index: match.index });
    }
  }
  found.sort((a, b) => a.index - b.index);
  return found;
}

// ---------- 调色板 ----------

async function readSpecPalette() {
  const text = await readFile(designDoc, "utf8");
  const section = text.split(/^## /m).find((part) => part.startsWith("2."));
  const palette = new Map();
  const lineRe = /`(--[a-z0-9-]+)`\s*\|\s*`#([0-9A-Fa-f]{6})`/g;
  for (const line of (section ?? "").split("\n")) {
    const match = lineRe.exec(line);
    lineRe.lastIndex = 0;
    if (match && !palette.has(match[1])) palette.set(match[1], `#${match[2].toUpperCase()}`);
  }
  if (palette.size < 10) {
    console.error(`DESIGN-v2.md 第 2 节只解析出 ${palette.size} 个颜色，疑似表格格式变化`);
    process.exit(1);
  }
  return palette;
}

function nearestPaletteColor(base, palette) {
  let best = null;
  for (const [name, hex] of palette) {
    const d = deltaE76(base, hex);
    if (!best || d < best.deltaE) best = { name, hex, deltaE: d };
  }
  return best;
}

function categoryOf(inPalette, deltaE) {
  if (inPalette) return "已在调色板";
  if (deltaE < 6) return "可直接替换";
  if (deltaE <= 20) return "接近，需看设计";
  return "新规范里没有对应色";
}

// ---------- CSS / TS 扫描 ----------

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

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

async function listAppFiles() {
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules") await walk(full);
      else if (/\.(css|tsx|ts)$/.test(entry.name)) files.push(full);
    }
  }
  await walk(appRoot);
  return files.sort();
}

/**
 * 扫描 app/ 下全部 css/tsx/ts。
 * 返回 {files, literals, varByFile}：
 * literals: [{file, line, property, selector, raw, base, alpha}]（变量定义行不计）
 * varByFile: Map<相对路径, var() 使用次数>
 */
async function scanAll() {
  const files = await listAppFiles();
  const literals = [];
  const varByFile = new Map();
  for (const file of files) {
    const relative = path.relative(repoRoot, file).replace(/\\/g, "/");
    const isCss = file.endsWith(".css");
    const text = prepareText(await readFile(file, "utf8"), {
      cssComments: isCss,
      jsComments: !isCss,
    });
    const varUses = new Map();
    const countVar = (segment) => {
      for (const match of segment.matchAll(VAR_RE)) {
        varUses.set(match[1], (varUses.get(match[1]) ?? 0) + 1);
      }
    };
    if (isCss) {
      for (const rule of parseCssRules(text)) {
        for (const decl of rule.body.split(";")) {
          const split = decl.indexOf(":");
          if (split < 0) continue;
          const property = decl.slice(0, split).trim();
          const value = decl.slice(split + 1);
          if (!property || property.startsWith("--")) continue; // 变量定义不计
          countVar(value);
          for (const literal of extractColorLiterals(value)) {
            literals.push({
              file: relative,
              line: lineOf(text, rule.offset + decl.indexOf(value)),
              property,
              selector: rule.selector.slice(0, 80),
              raw: literal.raw,
              base: literal.base,
              alpha: literal.alpha,
            });
          }
        }
      }
    } else {
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        for (const literal of extractColorLiterals(line)) {
          literals.push({
            file: relative,
            line: i + 1,
            property: "(ts/tsx 字符串)",
            selector: "",
            raw: literal.raw,
            base: literal.base,
            alpha: literal.alpha,
          });
        }
        countVar(line);
      });
    }
    let fileVarCount = 0;
    for (const count of varUses.values()) fileVarCount += count;
    if (fileVarCount) varByFile.set(relative, fileVarCount);
  }
  return { files, literals, varByFile };
}

// ---------- 自证 ----------

function runSelfTest(palette) {
  const failures = [];
  const check = (label, ok, detail) => {
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `（${detail}）` : ""}`);
    if (!ok) failures.push(label);
  };

  // Lab 已知值
  const white = rgbToLab("#FFFFFF");
  const black = rgbToLab("#000000");
  check("白 #FFFFFF 的 L=100", Math.abs(white.L - 100) < 0.01, `L=${white.L.toFixed(2)}`);
  check("黑 #000000 的 L=0", Math.abs(black.L) < 0.01, `L=${black.L.toFixed(2)}`);

  // 调色板识别
  const inkHex = palette.get("--ink");
  const litInk = extractColorLiterals("color: #1B2622;")[0];
  check("#1B2622 被识别为已在调色板（--ink）", litInk.base === inkHex, `base=${litInk?.base}`);

  const near = nearestPaletteColor("#1C2B27", palette);
  const dNear = deltaE76("#1C2B27", inkHex);
  // 任务单预期该对 ΔE<2，但标准 D65 ΔE76 实测 2.63（已用 Python 独立实现复核，
  // ΔE2000 亦为 2.15），<2 的预期与标准公式不符；断言「最近色是 --ink 且 ΔE76<3」。
  check(
    "#1C2B27 的最近色是 --ink（ΔE76=2.63<3，任务单预期 <2 与标准公式不符，见回报）",
    near?.name === "--ink" && dNear < 3,
    `ΔE76=${dNear.toFixed(2)}`,
  );

  const oldGreen = nearestPaletteColor("#16834F", palette);
  check(
    "#16834F（旧绿）能算出最近色与 ΔE",
    Boolean(oldGreen) && Number.isFinite(oldGreen.deltaE) && oldGreen.deltaE > 0,
    `最近=${oldGreen?.name} ΔE=${oldGreen?.deltaE?.toFixed(2)}`,
  );

  const translucent = extractColorLiterals("box-shadow: rgba(0,0,0,.5);")[0];
  check(
    "rgba(0,0,0,.5) 被标透明",
    translucent?.alpha < 1 && translucent?.base === "#000000",
    `alpha=${translucent?.alpha}`,
  );

  const sample = prepareText(".a { color: var(--ink); }", { cssComments: true });
  const vars = [...sample.matchAll(VAR_RE)];
  const lits = extractColorLiterals(sample);
  check(
    "var(--ink) 计入变量使用而不是字面量",
    vars.length === 1 && lits.length === 0,
    `vars=${vars.length} literals=${lits.length}`,
  );

  if (failures.length) {
    console.error(`自测失败 ${failures.length} 项`);
    process.exit(1);
  }
  console.log(`SELF_TEST_PASSED (7/7)`);
}

// ---------- 主流程 ----------

/** 页面迁移顺序：课程页 → 知识图谱 → 问答 → 研究 → 作品关系图 → 其余。 */
const PAGE_GROUPS = [
  ["课程页", ["app/lesson.css"]],
  ["知识图谱", ["app/graph-explorer.css", "app/knowledge-detail.css"]],
  ["问答", ["app/assistant.css"]],
  ["研究", ["app/research.css"]],
  ["作品关系图", ["app/work-graph.css"]],
];

async function main() {
  const palette = await readSpecPalette();
  if (process.argv.includes("--self-test")) {
    runSelfTest(palette);
    return;
  }

  const { files, literals, varByFile } = await scanAll();

  // 逐条计算最近新色与分类
  const enriched = literals.map((item) => {
    const inPalette = [...palette.values()].includes(item.base);
    const nearest = nearestPaletteColor(item.base, palette);
    return {
      ...item,
      inPalette,
      nearest: inPalette ? [...palette.entries()].find(([, hex]) => hex === item.base)?.[0] : nearest.name,
      deltaE: inPalette ? 0 : nearest.deltaE,
      category: categoryOf(inPalette, nearest.deltaE),
    };
  });

  // 汇总
  const byFile = new Map();
  for (const item of enriched) {
    const stat = byFile.get(item.file) ?? { total: 0, distinct: new Set(), replaceable: 0 };
    stat.total += 1;
    stat.distinct.add(item.base);
    if (item.category === "已在调色板" || item.category === "可直接替换") stat.replaceable += 1;
    byFile.set(item.file, stat);
  }

  // 按颜色聚合（top 25 / 无对应色清单）
  const byColor = new Map();
  for (const item of enriched) {
    const stat = byColor.get(item.base) ?? { base: item.base, count: 0, files: new Set(), sample: item };
    stat.count += 1;
    stat.files.add(item.file);
    byColor.set(item.base, stat);
  }
  const colorList = [...byColor.values()].sort((a, b) => b.count - a.count);
  const noCounterpart = colorList.filter((c) => c.sample.category === "新规范里没有对应色");

  // ---------- 报告 ----------
  const md = [];
  md.push("# T004 样式颜色使用盘点报告（audit-palette-usage）");
  md.push("");
  md.push(`- 规范来源：DESIGN-v2.md 第 2 节，解析出 ${palette.size} 个颜色变量。`);
  md.push(`- 扫描范围：app/ 下 ${files.length} 个 css/tsx/ts 文件（已剔除注释、url() 内的插画颜色、变量定义行）。`);
  md.push(`- 颜色字面量共 **${enriched.length}** 处、不同颜色 **${byColor.size}** 种；var() 变量使用共 ${[...varByFile.values()].reduce((a, b) => a + b, 0)} 处。`);
  md.push(`- 分类口径：ΔE76 <6 可直接替换；6–20 接近需看设计；>20 新规范里没有对应色。透明度 <1 单独标注。`);
  md.push("");

  md.push("## 一、按文件汇总（按字面量数从多到少）");
  md.push("");
  md.push("| 文件 | 字面量总数 | 不同颜色数 | 已用变量次数 | 可直接替换数 |");
  md.push("| --- | ---: | ---: | ---: | ---: |");
  const fileRows = [...byFile.entries()].sort((a, b) => b[1].total - a[1].total);
  for (const [file, stat] of fileRows) {
    md.push(`| ${file} | ${stat.total} | ${stat.distinct.size} | ${varByFile.get(file) ?? 0} | ${stat.replaceable} |`);
  }
  md.push("");

  md.push("## 二、出现次数最多的 25 个颜色");
  md.push("");
  md.push("| 原值 | 次数 | 最近新变量 | ΔE76 | 分类 | 涉及文件数 |");
  md.push("| --- | ---: | --- | ---: | --- | ---: |");
  for (const stat of colorList.slice(0, 25)) {
    const alpha = stat.sample.alpha < 1 ? "（半透明）" : "";
    md.push(
      `| \`${stat.sample.raw}\`${alpha} | ${stat.count} | ${stat.sample.nearest} | ${stat.sample.deltaE.toFixed(1)} | ${stat.sample.category} | ${stat.files.size} |`,
    );
  }
  md.push("");

  md.push(`## 三、「新规范里没有对应色」清单（ΔE>20，共 ${noCounterpart.length} 种，需设计决策）`);
  md.push("");
  if (!noCounterpart.length) md.push("无。");
  else {
    md.push("| 颜色 | 次数 | 最近新变量 | ΔE76 | 涉及文件 |");
    md.push("| --- | ---: | --- | ---: | --- |");
    for (const stat of noCounterpart.sort((a, b) => b.count - a.count)) {
      md.push(`| \`${stat.sample.raw}\` | ${stat.count} | ${stat.sample.nearest} | ${stat.sample.deltaE.toFixed(1)} | ${[...stat.files].slice(0, 3).join("、")}${stat.files.size > 3 ? " 等" : ""} |`);
    }
  }
  md.push("");

  md.push("## 四、对比度风险清单（同规则 color+background 换成最近新色后 <4.5:1）");
  md.push("");
  const risks = await contrastRisks(palette);
  if (!risks.length) md.push("未发现风险组合。");
  else {
    md.push("| 位置 | 选择器 | 现值（文字/背景） | 现比值 | 新值 | 新比值 |");
    md.push("| --- | --- | --- | ---: | --- | ---: |");
    for (const risk of risks) {
      md.push(
        `| \`${risk.file}:${risk.line}\` | ${risk.selector} | ${risk.fgRaw} / ${risk.bgRaw} | ${risk.now.toFixed(2)} | ${risk.fgNew} / ${risk.bgNew} | ${risk.after.toFixed(2)} |`,
      );
    }
  }
  md.push("");

  md.push("## 五、建议迁移顺序（课程页 → 知识图谱 → 问答 → 研究 → 作品关系图 → 其余）");
  md.push("");
  const claimed = new Set(PAGE_GROUPS.flat().slice(1));
  md.push("| 顺序 | 页面/文件 | 字面量数 | 可直接替换数 |");
  md.push("| --- | --- | ---: | ---: |");
  let order = 1;
  const statOf = (file) => byFile.get(file) ?? { total: 0, replaceable: 0 };
  for (const [label, groupFiles] of PAGE_GROUPS) {
    for (const file of groupFiles) {
      const stat = statOf(file);
      md.push(`| ${order} | ${label}：${file} | ${stat.total} | ${stat.replaceable} |`);
      order += 1;
    }
  }
  const rest = fileRows.filter(([file]) => !claimed.has(file));
  for (const [file, stat] of rest) {
    md.push(`| ${order} | 其余：${file} | ${stat.total} | ${stat.replaceable} |`);
    order += 1;
  }
  md.push("");
  md.push("> 说明：画像/插画颜色（url() 中的 data-URI、独立 SVG 资产）按规范「插画本身的颜色不受限」未计入。");

  // ---------- JSONL ----------
  const jsonl = enriched
    .map((item) =>
      JSON.stringify({
        file: item.file,
        line: item.line,
        property: item.property,
        selector: item.selector,
        value: item.raw,
        normalized: item.base,
        alpha: Number(item.alpha.toFixed(3)),
        inPalette: item.inPalette,
        nearest: item.nearest,
        deltaE: Number(item.deltaE.toFixed(2)),
        category: item.category,
      }),
    )
    .join("\n");

  await mkdir(outDir, { recursive: true });
  const mdPath = path.join(outDir, "T004-palette-usage-report.md");
  const jsonPath = path.join(outDir, "T004-palette-usage.jsonl");
  await writeFile(mdPath, md.join("\n"), "utf8");
  await writeFile(jsonPath, jsonl, "utf8");

  console.log(`扫描 ${files.length} 个文件：字面量 ${enriched.length} 处 / ${byColor.size} 种颜色；无对应色 ${noCounterpart.length} 种；对比度风险 ${risks.length} 条`);
  console.log(`报告已写入：${mdPath}`);
  console.log(`JSON 已写入：${jsonPath}`);
}

/** 对比度风险：同一规则里 color 与 background 都可解析时，换成最近新色再看。 */
async function contrastRisks(palette) {
  const risks = [];
  const cssFiles = (await listAppFiles()).filter((file) => file.endsWith(".css"));
  const tokensText = prepareText(await readFile(path.join(appRoot, "styles/tokens.css"), "utf8"), { cssComments: true });
  const varMap = new Map();
  for (const match of tokensText.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)) {
    varMap.set(match[1], match[2].trim());
  }
  const UNRESOLVABLE = /(gradient|color-mix|currentColor|rgba?\(|hsla?\(|transparent|inherit)/i;
  const resolveVar = (value, depth = 0) => {
    const v = value.trim().replace(/;$/, "");
    if (/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/i.test(v)) return normalizeHex(v);
    if (depth >= 6 || UNRESOLVABLE.test(v)) return null;
    const varMatch = v.match(/^var\(\s*(--[\w-]+)\s*([,)][^)]*)?$/);
    if (varMatch) {
      const def = varMap.get(varMatch[1]);
      if (def !== undefined) {
        const resolved = resolveVar(def, depth + 1);
        if (resolved) return resolved;
      }
      const fallback = varMatch[2];
      if (fallback && fallback.startsWith(",")) return resolveVar(fallback.slice(1), depth + 1);
    }
    return null;
  };

  for (const file of cssFiles) {
    const relative = path.relative(repoRoot, file).replace(/\\/g, "/");
    const text = prepareText(await readFile(file, "utf8"), { cssComments: true });
    for (const rule of parseCssRules(text)) {
      const decls = rule.body.split(";").map((decl) => {
        const split = decl.indexOf(":");
        return split < 0 ? null : { property: decl.slice(0, split).trim(), value: decl.slice(split + 1), raw: decl };
      }).filter(Boolean);
      const colorDecl = [...decls.filter((d) => d.property === "color")].pop();
      const bgDecl = [...decls.filter((d) => d.property === "background-color" || d.property === "background")].pop();
      if (!colorDecl || !bgDecl) continue;
      const fg = extractColorLiterals(colorDecl.value).at(-1) ?? (colorDecl.value.includes("var(") ? { isVar: true, raw: colorDecl.value.trim() } : null);
      const bg = extractColorLiterals(bgDecl.value).at(-1) ?? (bgDecl.value.includes("var(") ? { isVar: true, raw: bgDecl.value.trim() } : null);
      if (!fg || !bg) continue;
      const fgNorm = fg.isVar ? resolveVar(fg.raw) : { base: fg.base, alpha: fg.alpha };
      const bgNorm = bg.isVar ? resolveVar(bg.raw) : { base: bg.base, alpha: bg.alpha };
      if (!fgNorm || !bgNorm) continue;
      if (fgNorm.alpha < 1 || bgNorm.alpha < 1) continue; // 底色带透明的真实效果未知，跳过
      const fgNewHex = nearestPaletteColor(fgNorm.base, palette).hex;
      const bgNewHex = nearestPaletteColor(bgNorm.base, palette).hex;
      const now = contrast(fgNorm.base, bgNorm.base);
      const after = contrast(fgNewHex, bgNewHex);
      if (after < 4.5) {
        risks.push({
          file: relative,
          line: lineOf(text, rule.offset),
          selector: rule.selector.slice(0, 70),
          fgRaw: fg.raw,
          bgRaw: bg.raw,
          now,
          fgNew: fgNewHex,
          bgNew: bgNewHex,
          after,
        });
      }
    }
  }
  return risks.sort((a, b) => a.after - b.after);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
