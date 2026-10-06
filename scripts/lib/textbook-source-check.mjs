import { TEXTBOOK_MODES } from "./textbook-modes.mjs";

const LAYERS = new Set(["明", "谱", "归", "补"]);
const FACT_FIELDS = ["book", "units", "works", "concepts", "people", "tasks"];

export function flattenTextbookSource(source) {
  const parts = Array.isArray(source?.parts) ? source.parts : [source ?? {}];
  return {
    ...source,
    ...Object.fromEntries(FACT_FIELDS.slice(1).map((field) => [field, parts.flatMap((part) => part?.[field] ?? [])])),
  };
}

function lineAt(sourceText, marker, occurrence = 0) {
  if (!sourceText || !marker) return 1;
  let index = -1;
  let cursor = 0;
  for (let current = 0; current <= occurrence; current += 1) {
    index = sourceText.indexOf(marker, cursor);
    if (index < 0) return 1;
    cursor = index + marker.length;
  }
  return index < 0 ? 1 : sourceText.slice(0, index).split(/\r?\n/).length;
}

function namedLine(sourceText, item, seen = new Map()) {
  const marker = `name: ${JSON.stringify(item?.name ?? "")}`;
  const occurrence = seen.get(marker) ?? 0;
  seen.set(marker, occurrence + 1);
  return lineAt(sourceText, marker, occurrence);
}

function factLine(sourceText, tuple, fallback) {
  const predicate = JSON.stringify(tuple?.[0] ?? "");
  const value = JSON.stringify(tuple?.[1] ?? "");
  const marker = `[${predicate}, ${value}`;
  return lineAt(sourceText, marker) || fallback;
}

function printablePage(value, pdfOffset) {
  if (Number.isInteger(value)) return { pdf: value + pdfOffset, printed: value };
  if (value && typeof value === "object" && Number.isInteger(value.pdf)) return { pdf: value.pdf, printed: null };
  return null;
}

const normalizedWorkName = (name) => String(name ?? "").replace(/[《》\s]/g, "").trim();

export function validateTextbookSource(source, { book, sourceText = "" } = {}) {
  const errors = [];
  const layers = { 明: 0, 谱: 0, 归: 0, 补: 0 };
  const data = flattenTextbookSource(source);
  const maxPdfPage = Number.isInteger(book?.pages) ? book.pages : Number.POSITIVE_INFINITY;
  const pdfOffset = Number.isInteger(data.pdfOffset) ? data.pdfOffset : Number.isInteger(book?.pdfOffset) ? book.pdfOffset : 0;
  const maxPrintedPage = Number.isFinite(maxPdfPage) ? Math.max(0, maxPdfPage - pdfOffset) : Number.POSITIVE_INFINITY;
  const addError = (line, message) => errors.push(`第 ${line} 行：${message}`);
  const seenFactMarkers = new Map();

  if (!source || typeof source !== "object" || Array.isArray(source)) {
    addError(1, "源文件默认导出必须是教材对象。");
    return { errors, layers, stats: { units: 0, works: 0, scores: 0 } };
  }
  if (book && source.key !== book.key) addError(namedLine(sourceText, { name: source.key }), `源文件 key 应为“${book.key}”，实际为“${source.key ?? "空"}”。`);
  if (!Number.isInteger(data.pdfOffset) || data.pdfOffset < 0) {
    addError(lineAt(sourceText, "pdfOffset:"), "pdfOffset 必须是已核对的非负整数。页码范围无法在缺少它时准确校验。");
  } else if (book?.pdfOffset != null && data.pdfOffset !== book.pdfOffset) {
    addError(lineAt(sourceText, "pdfOffset:"), `pdfOffset 与册目登记表不一致，应为 ${book.pdfOffset}。`);
  }

  const checkPage = (value, context, line) => {
    const page = printablePage(value, pdfOffset);
    if (!page) {
      addError(line, `${context}页码格式错误，应为教材页码数字或 { pdf: 页码 }。`);
      return;
    }
    if (page.pdf < 1 || page.pdf > maxPdfPage) {
      addError(line, `${context}页码超出全册范围（PDF 第 1–${maxPdfPage} 页）：${page.pdf}。`);
    }
    if (page.printed != null && (page.printed < 1 || page.printed > maxPrintedPage)) {
      addError(line, `${context}教材页码超出全册范围（第 1–${maxPrintedPage} 页）：${page.printed}。`);
    }
  };

  const checkFacts = (facts, context, line) => {
    if (facts == null) return;
    if (!Array.isArray(facts)) {
      addError(line, `${context} facts 必须是元组数组。`);
      return;
    }
    facts.forEach((tuple, index) => {
      const tupleContext = `${context}第 ${index + 1} 条事实`;
      const tupleMarker = `[${JSON.stringify(tuple?.[0] ?? "")}, ${JSON.stringify(tuple?.[1] ?? "")}`;
      const tupleOccurrence = seenFactMarkers.get(tupleMarker) ?? 0;
      seenFactMarkers.set(tupleMarker, tupleOccurrence + 1);
      const tupleLoc = lineAt(sourceText, tupleMarker, tupleOccurrence) || factLine(sourceText, tuple, line);
      if (!Array.isArray(tuple) || tuple.length < 3 || tuple.length > 5) {
        addError(tupleLoc, `${tupleContext}元组形状错误，应为 [关系, 客体, 客体类型, 层级?, 页码?]。`);
        return;
      }
      if (typeof tuple[0] !== "string" || !tuple[0].trim() || !(typeof tuple[1] === "string" || typeof tuple[1] === "number")) {
        addError(tupleLoc, `${tupleContext}的关系或客体格式错误。`);
      }
      if (tuple[2] !== null && tuple[2] !== undefined && typeof tuple[2] !== "string") {
        addError(tupleLoc, `${tupleContext}的客体类型必须是文字或 null。`);
      }
      const layer = tuple.length >= 4 ? tuple[3] : "明";
      if (!LAYERS.has(layer)) addError(tupleLoc, `${tupleContext}层级“${String(layer)}”非法，只能是 明、谱、归、补。`);
      else layers[layer] += 1;
      if (tuple.length === 5) checkPage(tuple[4], `${tupleContext} `, tupleLoc);
    });
  };

  if (!Array.isArray(data.book)) addError(lineAt(sourceText, "book:"), "book 必须是事实元组数组。");
  checkFacts(data.book, "册级", lineAt(sourceText, "book:"));
  for (const field of ["units", "works", "concepts", "people", "tasks"]) {
    if (!Array.isArray(data[field])) addError(1, `${field} 必须是数组。`);
  }

  const units = Array.isArray(data.units) ? data.units : [];
  const works = Array.isArray(data.works) ? data.works : [];
  const unitNumbers = new Set(units.map((unit) => unit?.no));
  const seenUnitNames = new Map();
  units.forEach((unit) => {
    const line = namedLine(sourceText, unit, seenUnitNames);
    if (!Number.isInteger(unit?.no)) addError(line, `单元“${unit?.name ?? "未命名"}”缺少有效 no。`);
    checkPage(unit?.page, `单元“${unit?.name ?? "未命名"}” `, line);
    checkFacts(unit?.facts, `单元“${unit?.name ?? "未命名"}”`, line);
  });

  const seenWorks = new Map();
  const seenWorkNames = new Map();
  let scoreCount = 0;
  works.forEach((work) => {
    const line = namedLine(sourceText, work, seenWorkNames);
    const name = String(work?.name ?? "未命名作品");
    const normalized = normalizedWorkName(name);
    if (!name.trim()) addError(line, "作品名称不能为空。");
    if (seenWorks.has(normalized)) addError(line, `作品重名：“${name}”与本册前面的同名作品重复。`);
    else seenWorks.set(normalized, line);
    if (!unitNumbers.has(work?.unit)) addError(line, `作品“${name}”引用了不存在的单元 ${String(work?.unit)}。`);
    if (work?.mode != null && !Object.hasOwn(TEXTBOOK_MODES, work.mode)) addError(lineAt(sourceText, `mode: ${JSON.stringify(work.mode)}`), `作品“${name}”的活动类型“${work.mode}”未登记。`);
    checkPage(work?.page, `作品“${name}” `, line);
    checkFacts(work?.facts, `作品“${name}”`, line);
    if (work?.scores == null) return;
    if (!Array.isArray(work.scores)) {
      addError(line, `作品“${name}”的 scores 必须是数组。`);
      return;
    }
    for (const [index, score] of work.scores.entries()) {
      scoreCount += 1;
      const scoreContext = `作品“${name}”第 ${index + 1} 个谱例`;
      if (!Array.isArray(score) || score.length < 5) {
        addError(line, `${scoreContext}框形状错误，应为 [页码, x0, y0, x1, y1]。`);
        continue;
      }
      checkPage(score[0], `${scoreContext} `, line);
      const [x0, y0, x1, y1] = score.slice(1, 5);
      if (![x0, y0, x1, y1].every((value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1)) {
        addError(line, `${scoreContext}坐标必须是 0 到 1 之间的数字。`);
      }
      if (typeof x0 === "number" && typeof x1 === "number" && x0 >= x1) addError(line, `${scoreContext}横坐标须满足 x0 < x1。`);
      if (typeof y0 === "number" && typeof y1 === "number" && y0 >= y1) addError(line, `${scoreContext}纵坐标须满足 y0 < y1。`);
    }
  });

  for (const field of ["concepts", "people", "tasks"]) {
    const seenNames = new Map();
    for (const item of Array.isArray(data[field]) ? data[field] : []) {
      const line = namedLine(sourceText, item, seenNames);
      if (item?.page != null) checkPage(item.page, `${field}“${item.name ?? "未命名"}” `, line);
      checkFacts(item?.facts, `${field}“${item?.name ?? item?.text ?? "未命名"}”`, line);
    }
  }

  return {
    errors,
    layers,
    stats: { units: units.length, works: works.length, scores: scoreCount },
  };
}

export { TEXTBOOK_MODES };
