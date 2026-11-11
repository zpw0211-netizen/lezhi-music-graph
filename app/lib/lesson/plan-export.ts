// 教案带出浏览器的三条路：导出 Word（.docx）、打印，以及把本机的全部备课（教案 + 课件里的修改）存成一个文件，
// 到另一台电脑上导入。都在浏览器里完成，不经过服务器。
import { LESSON_KINDS } from "./reflective";
import { STANDARD } from "./curriculum";
import type { LessonPlan } from "./plan";

export type PlanBlock = { type: "title" | "meta" | "heading" | "stage" | "step" | "text" | "intent"; text: string };

const NUM = "一二三四五六七八九十";

/** 教案按版面拆成一段一段：标题、说明、章节、环节、步骤、正文、设计意图。 */
export function planBlocks(plan: LessonPlan): PlanBlock[] {
  const work = plan.workName.startsWith("《") ? plan.workName : `《${plan.workName}》`;
  const out: PlanBlock[] = [];
  let section = 0;
  const heading = (name: string) => out.push({ type: "heading", text: `${NUM[section++] ?? section}、${name}` });
  const body = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean).forEach((line) => out.push({ type: "text", text: line }));
  out.push({ type: "title", text: `${work}教学设计` });
  out.push({ type: "meta", text: `${LESSON_KINDS[plan.kind]}　${plan.minutes} 分钟${plan.className ? `　${plan.className}` : ""}` });
  if (plan.standard) out.push({ type: "meta", text: `课标依据：${plan.standard.band} · 学习任务“${plan.standard.task}”（${STANDARD}第 ${plan.standard.page} 页）` });
  if (plan.analysis?.textbook.trim()) { heading("教材分析"); body(plan.analysis.textbook); }
  if (plan.analysis?.students.trim()) { heading("学情分析"); body(plan.analysis.students); }
  else if (plan.classNote) { heading("学情分析"); body(plan.classNote); }
  heading("教学目标");
  plan.goals.forEach((goal, i) => out.push({ type: "text", text: `${i + 1}. ${goal.area}：${goal.text}` }));
  heading("教学重难点");
  out.push({ type: "text", text: `教学重点：${plan.focus.key}` }, { type: "text", text: `教学难点：${plan.focus.hard}` });
  if (plan.prepare?.trim()) { heading("教学准备"); body(plan.prepare); }
  heading("教学过程");
  plan.stages.forEach((stage, s) => {
    out.push({ type: "stage", text: `（${NUM[s] ?? s + 1}）${stage.name}（${stage.theme}）　${stage.minutes} 分钟` });
    stage.activities.filter((item) => item.text.trim()).forEach((item, i) => {
      if (item.title) { out.push({ type: "step", text: `${i + 1}. ${item.title}` }); body(item.text); }
      else body(`${i + 1}. ${item.text}`);
      if (item.intent?.trim()) out.push({ type: "intent", text: `设计意图：${item.intent.trim().replace(/\n+/g, " ")}` });
    });
  });
  if (plan.board?.trim()) { heading("板书设计"); body(plan.board); }
  heading("作业");
  body(plan.homework);
  if (plan.homeworkIntent?.trim()) out.push({ type: "intent", text: `设计意图：${plan.homeworkIntent.trim().replace(/\n+/g, " ")}` });
  heading("教学反思");
  out.push({ type: "text", text: "（课后填写）" });
  return out;
}

const xml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// —— Word（.docx）：一个只存不压的 zip，里面是最小的一套 WordprocessingML ——
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(bytes: Uint8Array) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function zip(files: Array<{ name: string; text: string }>): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.text);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034B50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true); local.setUint16(10, 0, true); local.setUint16(12, 0x21, true);
    local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true); local.setUint16(28, 0, true);
    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014B50, true); entry.setUint16(4, 20, true); entry.setUint16(6, 20, true); entry.setUint16(8, 0x0800, true);
    entry.setUint16(10, 0, true); entry.setUint16(12, 0, true); entry.setUint16(14, 0x21, true);
    entry.setUint32(16, crc, true); entry.setUint32(20, data.length, true); entry.setUint32(24, data.length, true);
    entry.setUint16(28, name.length, true); entry.setUint32(42, offset, true);
    parts.push(new Uint8Array(local.buffer), name, data);
    central.push(new Uint8Array(entry.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054B50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true); end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of all) { out.set(part, at); at += part.length; }
  return out;
}

// 字号用半磅：小二 36、四号 28、小四 24。正文宋体，设计意图楷体。
const STYLE: Record<PlanBlock["type"], { size: number; bold?: boolean; center?: boolean; font?: string; before?: number; indent?: boolean; color?: string }> = {
  title: { size: 36, bold: true, center: true, font: "黑体", before: 0 },
  meta: { size: 21, center: true, color: "555555" },
  heading: { size: 28, bold: true, font: "黑体", before: 240 },
  stage: { size: 24, bold: true, before: 160 },
  step: { size: 24, bold: true, before: 80 },
  text: { size: 24, indent: true },
  intent: { size: 24, font: "楷体", indent: true, color: "1D5C40" },
};
function paragraph(block: PlanBlock) {
  const style = STYLE[block.type];
  const font = style.font ?? "宋体";
  const props = `<w:pPr>${style.center ? '<w:jc w:val="center"/>' : ""}<w:spacing w:before="${style.before ?? 0}" w:after="0" w:line="400" w:lineRule="exact"/>${style.indent ? '<w:ind w:firstLineChars="200" w:firstLine="480"/>' : ""}</w:pPr>`;
  const run = `<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="${font}" w:cs="Times New Roman"/>${style.bold ? "<w:b/>" : ""}${style.color ? `<w:color w:val="${style.color}"/>` : ""}<w:sz w:val="${style.size}"/><w:szCs w:val="${style.size}"/></w:rPr>`;
  return `<w:p>${props}<w:r>${run}<w:t xml:space="preserve">${xml(block.text)}</w:t></w:r></w:p>`;
}

/** 教案 → Word 文档（.docx），Word 和 WPS 都能直接打开、继续修改。 */
export function planDocx(plan: LessonPlan): Blob {
  const body = planBlocks(plan).map(paragraph).join("");
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1701" w:bottom="1440" w:left="1701" w:header="851" w:footer="992" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const bytes = zip([
    { name: "[Content_Types].xml", text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
    { name: "_rels/.rels", text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
    { name: "word/document.xml", text: document },
  ]);
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

/** 打印用的整页 HTML：A4、宋体，和 Word 稿同一套版式。 */
export function planPrintHtml(plan: LessonPlan) {
  const rows = planBlocks(plan).map((block) => `<p class="${block.type}">${xml(block.text)}</p>`).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${xml(planBlocks(plan)[0].text)}</title><style>
@page { size: A4; margin: 22mm 24mm; }
body { margin: 0; color: #000; font: 12pt/1.75 "SimSun", "Songti SC", "Noto Serif SC", serif; }
p { margin: 0; }
.title { font: 700 18pt/2 "SimHei", "Heiti SC", sans-serif; text-align: center; }
.meta { color: #555; font-size: 10.5pt; text-align: center; }
.heading { margin-top: 12pt; font: 700 14pt/2 "SimHei", "Heiti SC", sans-serif; break-after: avoid; }
.stage { margin-top: 8pt; font-weight: 700; break-after: avoid; }
.step { margin-top: 4pt; font-weight: 700; break-after: avoid; }
.text, .intent { text-indent: 2em; }
.intent { color: #1D5C40; font-family: "KaiTi", "Kaiti SC", "STKaiti", serif; }
</style></head><body>${rows}</body></html>`;
}

/** 让浏览器把一个文件存到老师的电脑上。 */
export function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// —— 备课文件：本机保存的教案和课件修改，整包带走 ——
// 教案（yapu-plan:）、上课模式里的改写与隐藏页（yapu-reflective:）、课堂模式（yapu-lesson-model）。
const BACKUP_KEYS = /^(yapu-plan:|yapu-reflective:|yapu-lesson-model$)/;
const BACKUP_MARK = "yapu-lesson-backup";
type Backup = { app: typeof BACKUP_MARK; version: 1; exportedAt: string; items: Record<string, string> };

/** 收集本机的全部备课；没有内容时返回 null。 */
export function collectBackup(): { blob: Blob; plans: number; decks: number } | null {
  const items: Record<string, string> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !BACKUP_KEYS.test(key)) continue;
      const value = window.localStorage.getItem(key);
      if (value !== null) items[key] = value;
    }
  } catch { return null; }
  const keys = Object.keys(items);
  const plans = keys.filter((key) => key.startsWith("yapu-plan:")).length;
  const decks = keys.filter((key) => key.startsWith("yapu-reflective:")).length;
  if (!plans && !decks) return null;
  const backup: Backup = { app: BACKUP_MARK, version: 1, exportedAt: new Date().toISOString(), items };
  return { blob: new Blob([JSON.stringify(backup)], { type: "application/json" }), plans, decks };
}

/** 读备课文件：只认芽谱自己导出的格式，只取备课相关的条目。 */
export function readBackup(text: string): { items: Record<string, string>; plans: number; decks: number; conflicts: number } | { error: string } {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { error: "这不是芽谱导出的备课文件。" }; }
  const backup = parsed as Partial<Backup> | null;
  if (!backup || backup.app !== BACKUP_MARK || typeof backup.items !== "object" || !backup.items) return { error: "这不是芽谱导出的备课文件。" };
  const items: Record<string, string> = {};
  for (const [key, value] of Object.entries(backup.items)) {
    if (!BACKUP_KEYS.test(key) || typeof value !== "string" || value.length > 400_000) continue;
    if (key !== "yapu-lesson-model") { try { JSON.parse(value); } catch { continue; } }
    items[key] = value;
  }
  const keys = Object.keys(items);
  const plans = keys.filter((key) => key.startsWith("yapu-plan:")).length;
  const decks = keys.filter((key) => key.startsWith("yapu-reflective:")).length;
  if (!plans && !decks) return { error: "文件里没有教案或课件修改。" };
  let conflicts = 0;
  try {
    for (const key of keys) {
      if (key === "yapu-lesson-model") continue;
      const current = window.localStorage.getItem(key);
      if (current !== null && current !== items[key]) conflicts += 1;
    }
  } catch { /* 读不到本机内容时按没有冲突处理 */ }
  return { items, plans, decks, conflicts };
}

/** 把备课文件写进本机；写不进去（私密窗口、空间满）时返回 false。 */
export function applyBackup(items: Record<string, string>) {
  try {
    for (const [key, value] of Object.entries(items)) window.localStorage.setItem(key, value);
    return true;
  } catch { return false; }
}
