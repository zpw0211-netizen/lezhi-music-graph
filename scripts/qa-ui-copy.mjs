// qa-ui-copy.mjs — 扫描 app/ 源码里用户可见的中文界面文案，报告文案质量问题。
// 只报告，不修改任何界面文件。用法：node scripts/qa-ui-copy.mjs [--self-test] [--out <输出目录>]
// 报告默认写入 E:\Projects\yapu-collab\glm2\outbox\（可用环境变量 GLM2_OUTBOX 覆盖）。
//
// 残留英文的分级规则（T001 返工确定）：
//   1. 完全不报：乐理记号（1=C、C 大调、4/4、D.S.）、署名与许可（CC BY、OFL、Salamander Grand Piano）、
//      曲式段落标记（A段、B段、A段（a）、主题 a——单个字母 A–G / a–g 紧邻「段/主题/乐句/乐段/部/句」，
//      或单独出现在中文括号内）。
//   2. 「技术术语」节：GitHub Pages、JSON、HTTPS、API、Canvas、WebGL、D1、R2、PDF 等面向开发者的
//      协议 / 格式 / 平台 / 渲染库名——是否面向学生可见需人工判断。
//   3. 「建议改成中文」节：其余英文，包括标识符（auxiliaryExplanation、evidenceByTriple）、
//      未翻译的功能名（Evidence 覆盖率、Sigma）等。
//   4. 同一条文案命中多个英文词时合并为一条，词写成列表。
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "../app");
const outDir = process.env.GLM2_OUTBOX
  ? path.resolve(process.env.GLM2_OUTBOX)
  : path.resolve(scriptDir, "../../../yapu-collab/glm2/outbox");

const JSX_COPY_ATTRS = new Set(["title", "aria-label", "alt", "placeholder", "label"]);
// 这些属性名下的字符串几乎不可能是用户可见文案（类名 / 键名 / 路径 / 标识符）。
const NON_COPY_PROPS = new Set([
  "className", "key", "id", "src", "href", "path", "d", "type", "name", "slug",
  "viewBox", "fill", "stroke", "url", "icon", "iconName", "target", "rel", "color",
]);

// 完全允许、不出现在报告里的词（乐理记号与署名许可；曲式标记在 analyzeEnglish 里按上下文放行）。
const ALLOWED_EN_WORDS = new Set([
  "MIDI", "AI", "BPM", "OFL", "CC", "BY", "Salamander", "Grand", "Piano", "DS",
]);
// 技术术语：报告到「技术术语」节，是否面向学生可见由人工判断。
// 只收协议 / 格式 / 平台 / 云服务 / 渲染概念；库名（Sigma）与标识符不在此列，归「建议改成中文」。
const TECH_TERMS = new Set([
  "GitHub", "Pages", "JSON", "HTTPS", "HTTP", "API", "URL", "PDF", "Canvas", "WebGL",
  "SVG", "PNG", "JPG", "MP3", "WAV", "CSV", "D1", "R2", "2D", "3D",
]);

const SYNONYM_GROUPS = [
  ["教材", "课本"],
  ["作品", "曲目", "乐曲"],
  ["年级册", "册"],
  ["拓展", "扩展"],
  ["旋律", "曲调"],
  ["知识点", "知识"],
  ["查看", "浏览"],
  ["打开", "进入"],
];

const CLICHE_WORDS = [
  "赋能", "一站式", "全方位", "打造", "深度融合", "沉浸式", "智能化", "无缝",
  "强大的", "卓越", "极致", "革新", "探索无限",
];
const CLICHE_PATTERNS = [
  [/开启.{0,12}之旅/g, "「开启……之旅」句式"],
  [/让.{0,12}更简单/g, "「让……更简单」句式"],
];

const CHINESE = /[\u4e00-\u9fff]/;

async function listAppFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listAppFiles(fullPath)));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
  }
  return files.sort();
}

/** 从一个源文件里提取用户可见文案。返回 {file, line, text, kind, inButton, inTab, inNav} 列表。 */
function extractCopyFromFile(filePath, sourceText) {
  const kind = filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, kind);
  const relativeFile = path.relative(path.resolve(scriptDir, ".."), filePath).replace(/\\/g, "/");

  const isNavFile = path.basename(filePath) === "AppTopNav.tsx";
  const results = [];
  const lineOf = (node) => sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

  const visit = (node, frames, skipCopy) => {
    if (ts.isJsxElement(node)) {
      const tag = node.openingElement.tagName.getText(sourceFile);
      frames.push({ tag, roleTab: false });
      node.openingElement.attributes.properties.forEach((prop) => visit(prop, frames, skipCopy));
      node.children.forEach((child) => visit(child, frames, skipCopy));
      frames.pop();
      return;
    }
    if (ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sourceFile);
      frames.push({ tag, roleTab: false });
      node.attributes.properties.forEach((prop) => visit(prop, frames, skipCopy));
      frames.pop();
      return;
    }
    if (ts.isJsxAttribute(node)) {
      const attrName = node.name.getText(sourceFile);
      if (attrName === "role" && node.initializer && ts.isStringLiteral(node.initializer) && node.initializer.text === "tab") {
        if (frames.length) frames[frames.length - 1].roleTab = true;
      }
      if (node.initializer) visit(node.initializer, frames, skipCopy);
      return;
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const text = node.text;
      const record = (entry) => {
        if (entry) results.push({ file: relativeFile, line: lineOf(node), text, ...entry });
      };

      // 1) JSX 属性文案：title / aria-label / alt / placeholder / label
      if (ts.isJsxAttribute(node.parent)) {
        const attrName = node.parent.name.getText(sourceFile);
        if (JSX_COPY_ATTRS.has(attrName) && text.trim()) {
          record({ kind: "jsx-attr", attr: attrName, inNav: isNavFile, inButton: frames.some((f) => f.tag === "button"), inTab: frames.some((f) => f.roleTab) });
        }
        return;
      }
      if (skipCopy) return;
      const chinese = CHINESE.test(text);
      // 2) JSX 文本节点
      if (ts.isJsxText(node)) {
        const trimmed = text.trim();
        if (trimmed && CHINESE.test(trimmed)) {
          record({ kind: "jsx-text", inNav: isNavFile, inButton: frames.some((f) => f.tag === "button"), inTab: frames.some((f) => f.roleTab) });
        }
        return;
      }
      // 3) app/lib 与 app/components 里对象 / 数组中的界面文案
      if (!chinese || text.trim().length < 2) return;
      if (/\$\{/.test(text)) return; // 带插值的模板串当作文案不可靠，跳过
      if (/^(\/|\.{1,2}\/|[a-z]+:\/\/)/.test(text.trim())) return; // 路径 / URL
      if (/\^|\\\w|\.eslint|\.\*/.test(text)) return; // 正则
      const nearestProp = findNearestPropertyName(node);
      if (nearestProp && NON_COPY_PROPS.has(nearestProp)) return;
      results.push({ file: relativeFile, line: lineOf(node), text, kind: "obj-copy", inNav: isNavFile, inButton: false, inTab: false });
      return;
    }
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      ts.forEachChild(node, (child) => visit(child, frames, true));
      return;
    }
    if (ts.isCallExpression(node) && isConsoleCall(node)) {
      return; // console 调试输出不是界面文案
    }
    ts.forEachChild(node, (child) => visit(child, frames, skipCopy));
  };

  visit(sourceFile, [], false);
  return results;
}

function isConsoleCall(call) {
  const expr = call.expression;
  return ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.expression) && expr.expression.text === "console";
}

/** 找出字符串节点外层最近的属性名（对象字面量的 key 或变量声明名）。 */
function findNearestPropertyName(node) {
  let current = node.parent;
  while (current && !ts.isSourceFile(current)) {
    if (ts.isPropertyAssignment(current) || ts.isShorthandPropertyAssignment(current) || ts.isEnumMember(current)) {
      return current.name && current.name.getText ? current.name.getText() : undefined;
    }
    if (ts.isVariableDeclaration(current) || ts.isPropertySignature(current)) {
      return current.name && current.name.getText ? current.name.getText() : undefined;
    }
    current = current.parent;
  }
  return undefined;
}

// ---------- 检查项 ----------

/**
 * 分析一条文案里的英文词。返回 [{word, tech}]，tech=true 表示技术术语节。
 * 预处理移除的内容（都不算残留英文）：
 *   乐理记号 1=C、C 大调、4/4、D.S.；曲式段落标记 A段、A¹段、（a）、主题 a；
 *   以及一切「孤立的单个拉丁字母」（前后都不是字母数字）——它只可能是曲式 / 调号（♭B调、G调）、
 *   声部或打击乐记号（声部A、B、C；X 节奏记号）等音乐标记，不可能是英文单词。 *   D1、R2、2D、3D 这类「字母+数字」组合不受此规则影响，按技术术语处理。
 */
function analyzeEnglish(text) {
  const rest = text
    .replace(/\b[1-7]\s*=\s*[A-G]\b/g, " ")                                   // 1=C
    .replace(/\b[A-G]\s*(?=[大小](调|音阶|调式))/g, " ")                       // C 大调
    .replace(/\b\d+\s*\/\s*\d+\b/g, " ")                                      // 4/4
    .replace(/\bD\.\s*S\./g, "DS")                                            // D.S. → 允许清单
    .replace(/\b[23]D\b/g, " ")                                               // 2D / 3D → 技术术语
    .replace(/[（(]\s*[A-Ga-g]\s*[)）]/g, " ")                                 // （a）括号内曲式标记
    .replace(/(^|[^\w])[A-Ga-gXx]¹?(?![A-Za-z0-9])/g, "$1");                   // 孤立单字母（含 A¹、（a）、打击乐 X 记号）
  const tokens = rest.match(/[A-Za-z][A-Za-z0-9'.-]*/g) ?? [];
  const words = [];
  for (const raw of tokens) {
    const token = raw.replace(/[.'-]+$/g, "");
    if (!token) continue;
    if (ALLOWED_EN_WORDS.has(token) || ALLOWED_EN_WORDS.has(token.replace(/\./g, ""))) continue;
    words.push({ word: raw, tech: TECH_TERMS.has(token) });
  }
  return words;
}

function countOccurrences(text, term) {
  let count = 0;
  let index = text.indexOf(term);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(term, index + term.length);
  }
  return count;
}

function synonymDistribution(items) {
  const rows = [];
  for (const group of SYNONYM_GROUPS) {
    const counts = {};
    // 按词长降序统计：先数「知识点」，把它从文本里挖掉再数「知识」，避免重复计入。
    const ordered = [...group].sort((a, b) => b.length - a.length);
    const consumed = items.map((item) => item.text);
    for (const term of ordered) {
      counts[term] = 0;
      for (let i = 0; i < consumed.length; i += 1) {
        counts[term] += countOccurrences(consumed[i], term);
        consumed[i] = consumed[i].split(term).join("\u0000");
      }
    }
    const total = group.reduce((sum, term) => sum + counts[term], 0);
    const majority = ordered.reduce((best, term) => (counts[term] > counts[best] ? term : best), ordered[0]);
    rows.push({ group: group.join(" / "), counts, total, majority });
  }
  return rows;
}

function checkPunctuation(item) {
  const problems = [];
  const text = item.text;
  if (!CHINESE.test(text)) return problems;
  const hasFull = /[，。：；！？（）]/.test(text);
  const hasHalf = /[,.;:!?()]/.test(text);
  // 半角标点紧贴汉字才算「中文句子里用了半角标点」，避免 1=C、4/4、3.8 MB 之类误报。
  const halfNextToChinese = /[\u4e00-\u9fff][,.;:!?()]|[,.;:!?()][\u4e00-\u9fff]/.test(text);
  if (hasFull && hasHalf && halfNextToChinese) problems.push("全半角混用");
  if (hasFull && halfNextToChinese && /[()]/.test(text)) problems.push("半角括号");
  if (/[\u4e00-\u9fff],|,[\u4e00-\u9fff]/.test(text)) problems.push("半角逗号");
  if (/\.{3}/.test(text)) problems.push("省略号应为……");
  return problems;
}

function checkCliche(item) {
  const hits = [];
  for (const word of CLICHE_WORDS) {
    if (item.text.includes(word)) hits.push(word);
  }
  for (const [pattern, label] of CLICHE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(item.text)) hits.push(label);
  }
  return hits;
}

function chineseCharCount(text) {
  return (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
}

function checkLongLabel(item) {
  if (!(item.kind === "jsx-text")) return false;
  const inButton = item.inButton || item.inTab;
  const inNav = item.inNav;
  if (!inButton && !inNav) return false;
  return chineseCharCount(item.text) > 12;
}

function checkDuplicates(items) {
  const byText = new Map();
  for (const item of items) {
    const text = item.text.trim();
    if (text.length < 8 || !CHINESE.test(text)) continue;
    if (!byText.has(text)) byText.set(text, new Map());
    const byFile = byText.get(text);
    byFile.set(item.file, (byFile.get(item.file) ?? 0) + 1);
  }
  const duplicates = [];
  for (const [text, byFile] of byText) {
    if (byFile.size >= 3) {
      duplicates.push({ text, files: [...byFile.entries()].map(([file, count]) => `${file}×${count}`), fileCount: byFile.size });
    }
  }
  duplicates.sort((a, b) => b.fileCount - a.fileCount || a.text.localeCompare(b.text, "zh"));
  return duplicates;
}

// ---------- 自测（--self-test）：证明词库与检查逻辑有效，任何一条不命中就退出码 1 ----------

function runSelfTest() {
  const results = [];
  const assert = (name, ok) => results.push({ name, ok });

  // 1) 套话词库：五条假文案各含一个词，必须全部命中
  const clicheFakes = [
    ["赋能", "本平台为您全面赋能。"],
    ["一站式", "提供一站式音乐学习服务。"],
    ["打造", "打造强大的学习体验。"],
    ["无缝", "多端无缝切换。"],
    ["沉浸式", "沉浸式图谱浏览体验。"],
  ];
  for (const [word, text] of clicheFakes) {
    const hits = checkCliche({ text });
    assert(`套话词库命中「${word}」`, hits.some((hit) => hit.includes(word)));
  }

  // 2) 过长标签：假例子必须命中，短标签不能命中
  const longFake = { kind: "jsx-text", inButton: true, inNav: false, inTab: false, text: "这是一个超过十二个汉字的特别长的按钮标签文案" };
  const shortFake = { kind: "jsx-text", inButton: true, inNav: false, inTab: false, text: "查看图谱" };
  assert("过长标签假例子（19 个汉字）命中", checkLongLabel(longFake) === true);
  assert("短按钮标签不误报", checkLongLabel(shortFake) === false);

  // 3) 重复文案：同一句 12 字文案出现在三个假文件里，必须被发现
  const dupFakes = ["a.tsx", "b.tsx", "c.tsx"].map((file) => ({ file, text: "这是一句重复出现的界面文案示例" }));
  assert("三文件重复文案被发现", checkDuplicates(dupFakes).length === 1);

  // 4) 曲式标记不误报；技术术语与标识符分级正确
  assert("曲式标记（A段（a）/B段/主题 a）不报", analyzeEnglish("A段（a）与B段、主题 a 的旋律").length === 0);
  assert("音乐记号组合（X 节奏/♭B调/声部A、B、C）不报", analyzeEnglish("原谱为 X 节奏记号，原为♭B调；声部A、B、C").length === 0);
  const techWords = analyzeEnglish("使用 GitHub Pages 与 JSON 导出");
  assert("技术术语全部进入 tech 分级", techWords.length > 0 && techWords.every((w) => w.tech));
  const zhWords = analyzeEnglish("在 auxiliaryExplanation 提供教学建议");
  assert("标识符进入「建议改成中文」分级", zhWords.length > 0 && zhWords.every((w) => !w.tech));

  let failed = 0;
  for (const [index, result] of results.entries()) {
    console.log(`SELF-TEST ${index + 1}: ${result.name} —— ${result.ok ? "PASS" : "FAIL"}`);
    if (!result.ok) failed += 1;
  }
  if (failed) {
    console.error(`SELF_TEST_FAILED ${failed}`);
    process.exit(1);
  }
  console.log(`SELF_TEST_PASSED (${results.length} checks)`);
}

// ---------- 汇总输出 ----------

function findingLine(item, note) {
  const where = `${item.file}:${item.line}`;
  const text = item.text.length > 60 ? `${item.text.slice(0, 60)}……` : item.text;
  return `- \`${where}\` 「${text}」 ${note}`;
}

function cap(list, limit = 40) {
  const shown = list.slice(0, limit);
  const extra = list.length - shown.length;
  return { shown, extra };
}

async function main() {
  const files = await listAppFiles(appRoot);
  const items = [];
  for (const file of files) {
    items.push(...extractCopyFromFile(file, await readFile(file, "utf8")));
  }

  // 残留英文：同一条文案的多个英文词合并为一条（T001 返工第 2 条）。
  const englishMerged = new Map();
  for (const item of items) {
    const words = analyzeEnglish(item.text);
    if (!words.length) continue;
    const key = `${item.file}:${item.line}`;
    if (!englishMerged.has(key)) englishMerged.set(key, { ...item, words });
  }
  const englishAll = [...englishMerged.values()];
  const englishTech = englishAll.filter((entry) => entry.words.every((w) => w.tech));
  const englishZh = englishAll.filter((entry) => entry.words.some((w) => !w.tech));

  const findings = { punctuation: [], cliche: [], longLabel: [] };
  for (const item of items) {
    for (const problem of checkPunctuation(item)) {
      findings.punctuation.push({ ...item, problem, note: problem });
    }
    for (const hit of checkCliche(item)) {
      findings.cliche.push({ ...item, hit, note: `命中套话「${hit}」` });
    }
    if (checkLongLabel(item)) {
      findings.longLabel.push({ ...item, note: `按钮/导航文案 ${chineseCharCount(item.text)} 个汉字，超过 12` });
    }
  }
  const synonyms = synonymDistribution(items);
  const duplicates = checkDuplicates(items);

  const total = englishAll.length + findings.punctuation.length + findings.cliche.length + findings.longLabel.length + duplicates.length;

  // 「最建议先改的 10 条」：按页面影响面粗排——首页 / 顶部导航 > 组件 > lib，重复文案按出现文件数加权。
  const weight = (file) => {
    if (/components\/home\/|AppTopNav|app\/page\.tsx/.test(file)) return 3;
    if (/components\//.test(file)) return 2;
    return 1;
  };
  const pooled = [
    ...findings.cliche.map((item) => ({ item, category: "cliche" })),
    ...englishZh.map((item) => ({ item, category: "english" })),
    ...englishTech.map((item) => ({ item, category: "english-tech" })),
    ...findings.punctuation.map((item) => ({ item, category: "punctuation" })),
    ...findings.longLabel.map((item) => ({ item, category: "longLabel" })),
  ]
    .map((entry) => ({ ...entry, score: weight(entry.item.file) }))
    .sort((a, b) => b.score - a.score || a.item.file.localeCompare(b.item.file) || a.item.line - b.item.line);
  const top10 = pooled.slice(0, 10);
  for (const dup of duplicates.slice(0, 2)) {
    if (top10.length < 10) top10.push({ duplicate: dup, category: "duplicate", score: 4 });
  }

  const md = [];
  md.push("# T001 界面文案质检报告（qa-ui-copy）");
  md.push("");
  md.push(`- 扫描范围：\`app/**/*.ts\`、\`app/**/*.tsx\`，共 ${files.length} 个文件；提取用户可见文案 ${items.length} 条。`);
  md.push("- 本报告只记录问题，未修改任何界面文件。");
  md.push("- 残留英文分级规则见 `scripts/qa-ui-copy.mjs` 文件头注释：曲式标记与乐理记号不报；技术术语单独一节待人工判断；标识符与未翻译功能名建议改成中文。");
  md.push("");
  md.push("## 汇总");
  md.push("");
  md.push("| 检查项 | 问题条数（文案条数） |");
  md.push("| --- | ---: |");
  md.push(`| 残留英文——技术术语（需人工判断可见性） | ${englishTech.length} 条文案（${englishTech.reduce((sum, e) => sum + e.words.length, 0)} 个英文词） |`);
  md.push(`| 残留英文——建议改成中文 | ${englishZh.length} 条文案（${englishZh.reduce((sum, e) => sum + e.words.length, 0)} 个英文词） |`);
  md.push(`| 标点问题（混用/半角括号/半角逗号/省略号） | ${findings.punctuation.length} |`);
  md.push(`| AI 套话与空话 | ${findings.cliche.length} |`);
  md.push(`| 过长的按钮/导航标签 | ${findings.longLabel.length} |`);
  md.push(`| 重复文案（≥8 字、≥3 个文件） | ${duplicates.length} |`);
  md.push(`| **总问题数（不含用词分布）** | **${total}** |`);
  md.push("");
  md.push("## 用词一致性分布（只报告分布，建议统一成占多数的用法，不下定论）");
  md.push("");
  md.push("| 同义词组 | 各词出现次数 | 合计 | 多数用法 |");
  md.push("| --- | --- | ---: | --- |");
  for (const row of synonyms) {
    md.push(`| ${row.group} | ${Object.entries(row.counts).map(([term, count]) => `${term} ${count}`).join("，")} | ${row.total} | ${row.majority} |`);
  }
  md.push("");

  const section = (title, list, noteFn) => {
    md.push(`## ${title}（${list.length}）`);
    md.push("");
    if (!list.length) md.push("未发现。");
    else {
      const { shown, extra } = cap(list);
      for (const entry of shown) md.push(findingLine(entry, noteFn(entry)));
      if (extra > 0) md.push(`另有 ${extra} 条，见 JSON 报告。`);
    }
    md.push("");
  };

  section("残留英文——技术术语（是否面向学生可见需人工判断）", englishTech, (entry) => `—— 词：${entry.words.map((w) => w.word).join("、")}`);
  section("残留英文——建议改成中文（标识符或未翻译的功能名）", englishZh, (entry) => `—— 词：${entry.words.map((w) => w.word).join("、")}`);
  section("标点问题", findings.punctuation, (entry) => `—— ${entry.problem}；建议统一中文全角标点`);
  section("AI 套话与空话", findings.cliche, (entry) => `—— 建议改为具体朴素的说明（命中：${entry.hit}）`);
  section("过长的按钮/导航标签", findings.longLabel, (entry) => `—— ${chineseCharCount(entry.text)} 个汉字，建议压缩到 12 字以内`);

  md.push(`## 重复文案（${duplicates.length}）`);
  md.push("");
  if (!duplicates.length) md.push("未发现。");
  else {
    for (const dup of cap(duplicates).shown) {
      md.push(`- 「${dup.text}」出现在 ${dup.fileCount} 个文件：${dup.files.join("、")} —— 建议抽成常量或放到一处维护`);
    }
    const extra = duplicates.length - Math.min(duplicates.length, 40);
    if (extra > 0) md.push(`另有 ${extra} 条，见 JSON 报告。`);
  }
  md.push("");

  md.push("## 最建议先改的 10 条（按影响面排序）");
  md.push("");
  if (!top10.length) md.push("未发现可排序的问题。");
  else {
    top10.forEach((entry, index) => {
      if (entry.category === "duplicate") {
        md.push(`${index + 1}. 重复文案「${entry.duplicate.text}」出现在 ${entry.duplicate.fileCount} 个文件 —— 改一处能同时修正多个页面，影响面最大，建议先抽成常量。`);
      } else {
        const prominence = weight(entry.item.file) >= 3 ? "首页/顶部导航，所有用户可见" : weight(entry.item.file) === 2 ? "功能页面，用户高频可见" : "代码内文案";
        md.push(`${index + 1}. ${entry.category === "cliche" ? "套话" : entry.category === "english" ? "未翻译标识符" : entry.category === "english-tech" ? "技术术语" : entry.category === "punctuation" ? "标点" : "过长标签"} \`${entry.item.file}:${entry.item.line}\`「${entry.item.text.slice(0, 40)}」 —— ${prominence}。`);
      }
    });
  }
  md.push("");

  const json = {
    generatedAt: new Date().toISOString(),
    filesScanned: files.length,
    stringsExtracted: items.length,
    total,
    summary: {
      englishTech: englishTech.length,
      englishZh: englishZh.length,
      punctuation: findings.punctuation.length,
      cliche: findings.cliche.length,
      longLabel: findings.longLabel.length,
      duplicates: duplicates.length,
    },
    synonyms,
    findings: { englishTech, englishZh, ...findings },
    duplicates,
  };

  await mkdir(outDir, { recursive: true });
  const mdPath = path.join(outDir, "T001-ui-copy-report.md");
  const jsonPath = path.join(outDir, "T001-ui-copy-report.json");
  await writeFile(mdPath, md.join("\n"), "utf8");
  await writeFile(jsonPath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  console.log(`扫描 ${files.length} 个文件，提取文案 ${items.length} 条；残留英文 ${englishAll.length} 条文案（技术术语 ${englishTech.length} / 建议改中文 ${englishZh.length}），标点 ${findings.punctuation.length}，套话 ${findings.cliche.length}，过长标签 ${findings.longLabel.length}，重复文案 ${duplicates.length}`);
  console.log(`报告已写入：${mdPath} 与 ${jsonPath}；总问题数 ${total}（不含用词分布）`);
}

if (process.argv.includes("--self-test")) {
  runSelfTest();
} else {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
