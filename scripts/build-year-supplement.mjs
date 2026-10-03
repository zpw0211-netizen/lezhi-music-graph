import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_MANIFEST = "E:/Projects/.tmp/claude/years/undated.json";
const DEFAULT_RESULTS = [
  "E:/Projects/.tmp/codex2/years/result1.json",
  "E:/Projects/.tmp/codex2/years/result2.json",
  "E:/Projects/.tmp/codex3/years/result3.json",
  "E:/Projects/.tmp/codex3/years/result4.json",
];

export const YEAR_SUPPLEMENT_KIND = "supplement";
export const YEAR_SUPPLEMENT_LABEL = "补充资料（非教材）";
export const YEAR_SUPPLEMENT_STATUSES = Object.freeze([
  "found",
  "traditional",
  "not_found",
]);

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function optionalText(value, field, id) {
  if (value == null) return null;
  if (typeof value !== "string")
    throw new Error(`${field} 必须是字符串或 null：${id}`);
  return value.trim() || null;
}

function normalizeSource(source, id, index) {
  if (!source || typeof source !== "object" || Array.isArray(source))
    throw new Error(`来源 ${index + 1} 格式无效：${id}`);
  const title = optionalText(source.title, `sources[${index}].title`, id);
  const url = optionalText(source.url, `sources[${index}].url`, id);
  const publisher = optionalText(source.publisher, `sources[${index}].publisher`, id);
  if (!title || !url)
    throw new Error(`来源必须包含 title 和 url：${id}`);
  return { title, url, publisher };
}

function normalizeRange(value, id) {
  if (value == null) return null;
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every((year) => Number.isInteger(year)) ||
    value[0] > value[1]
  )
    throw new Error(`yearRange 必须是升序整数区间或 null：${id}`);
  return [value[0], value[1]];
}

function normalizeRecord(value, manifestById) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("年代结果必须是对象");

  const id = optionalText(value.id, "id", "<unknown>");
  const name = optionalText(value.name, "name", id ?? "<unknown>");
  if (!id || !name) throw new Error("年代结果必须包含 id 和 name");
  if (!YEAR_SUPPLEMENT_STATUSES.includes(value.status))
    throw new Error(`status 无效（应为 found/traditional/not_found）：${id}`);

  const expected = manifestById.get(id);
  if (manifestById.size && !expected)
    throw new Error(`结果 ID 不在 undated.json 清单中：${id}`);
  if (expected && expected !== name)
    throw new Error(`作品名称与 undated.json 不一致：${id}（${name} ≠ ${expected}）`);

  const event = optionalText(value.event, "event", id);
  const yearText = optionalText(value.yearText, "yearText", id);
  const yearRange = normalizeRange(value.yearRange, id);
  const subject = optionalText(value.subject, "subject", id);
  const note = optionalText(value.note, "note", id);
  if (value.status === "found" && !yearText && !yearRange)
    throw new Error(`found 结果必须带 yearText 或 yearRange：${id}`);
  if (value.status === "not_found" && (yearText || yearRange))
    throw new Error(`not_found 结果不能带年代：${id}`);

  if (!Array.isArray(value.sources))
    throw new Error(`sources 必须是数组：${id}`);
  const sources = value.sources.map((source, index) =>
    normalizeSource(source, id, index),
  );
  if (value.status !== "not_found" && !sources.length)
    throw new Error(`已确认年代的结果至少需要一个来源：${id}`);

  const confidence = value.confidence;
  if (
    !(
      (typeof confidence === "string" && confidence.trim()) ||
      (typeof confidence === "number" && Number.isFinite(confidence))
    )
  )
    throw new Error(`confidence 必须是非空字符串或有限数字：${id}`);

  return {
    id,
    name,
    status: value.status,
    event,
    yearText,
    yearRange,
    subject,
    sources,
    confidence: typeof confidence === "string" ? confidence.trim() : confidence,
    note,
    kind: YEAR_SUPPLEMENT_KIND,
    label: YEAR_SUPPLEMENT_LABEL,
  };
}

function compareSources(left, right) {
  return (
    compareText(left.title, right.title) ||
    compareText(left.url, right.url) ||
    compareText(left.publisher ?? "", right.publisher ?? "")
  );
}

function mergeSources(left, right) {
  const unique = new Map();
  for (const source of [...left, ...right]) {
    const key = JSON.stringify([source.title, source.url, source.publisher]);
    unique.set(key, source);
  }
  return [...unique.values()].sort(compareSources);
}

function mergeDuplicate(previous, incoming) {
  const factualFields = [
    "name",
    "status",
    "event",
    "yearText",
    "yearRange",
    "subject",
    "confidence",
  ];
  const conflictingFields = factualFields.filter(
    (field) => JSON.stringify(previous[field]) !== JSON.stringify(incoming[field]),
  );
  if (conflictingFields.length)
    throw new Error(
      `重复 ID 的结果不一致，需人工核对 ${previous.id}：${conflictingFields.join(", ")}`,
    );

  const notes = [...new Set([previous.note, incoming.note].filter(Boolean))].sort(
    compareText,
  );
  return {
    ...previous,
    sources: mergeSources(previous.sources, incoming.sources),
    note: notes.length ? notes.join("\n") : null,
  };
}

function manifestMap(manifest) {
  const byId = new Map();
  for (const work of manifest) {
    if (!work || typeof work !== "object" || Array.isArray(work))
      throw new Error("undated.json 中的作品条目格式无效");
    const id = optionalText(work.id, "id", "<manifest>");
    const name = optionalText(work.name, "name", id ?? "<manifest>");
    if (!id || !name) throw new Error("undated.json 条目必须包含 id 和 name");
    const existing = byId.get(id);
    if (existing && existing !== name)
      throw new Error(`undated.json 中作品 ID 重复且名称冲突：${id}`);
    byId.set(id, name);
  }
  return byId;
}

/** Merge research batches into a stable list; conflicting claims fail closed. */
export function mergeYearSupplement(resultGroups, { manifest = [] } = {}) {
  const knownWorks = manifestMap(manifest);
  const byId = new Map();
  for (const group of resultGroups) {
    if (!Array.isArray(group)) throw new Error("每个年代结果批次都必须是数组");
    for (const value of group) {
      const record = normalizeRecord(value, knownWorks);
      const previous = byId.get(record.id);
      byId.set(
        record.id,
        previous ? mergeDuplicate(previous, record) : record,
      );
    }
  }
  return [...byId.values()].sort((left, right) => compareText(left.id, right.id));
}

export function missingManifestIds(records, manifest) {
  const present = new Set(records.map((record) => record.id));
  return manifest
    .map((work) => work.id)
    .filter((id) => !present.has(id))
    .sort(compareText);
}

export function serializeYearSupplement(records) {
  const ordered = [...records].sort((left, right) => compareText(left.id, right.id));
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

export async function writeYearSupplementFiles(
  records,
  { sourcePath, publicPath },
) {
  const resolvedSourcePath = path.resolve(sourcePath);
  const resolvedPublicPath = path.resolve(publicPath);
  if (resolvedSourcePath === resolvedPublicPath)
    throw new Error("源数据与发布数据必须写入不同文件");
  const serialized = serializeYearSupplement(records);
  await Promise.all([
    mkdir(path.dirname(resolvedSourcePath), { recursive: true }),
    mkdir(path.dirname(resolvedPublicPath), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(resolvedSourcePath, serialized, "utf8"),
    writeFile(resolvedPublicPath, serialized, "utf8"),
  ]);
  return serialized;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function rowsFromJson(value, description) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    for (const key of ["results", "works", "value"]) {
      if (Array.isArray(value[key])) return value[key];
    }
  }
  throw new Error(`${description} 须为数组或包含 results/works 数组的对象`);
}

function parseArgs(argv, env) {
  const values = new Map();
  let requireComplete = env.YEAR_SUPPLEMENT_REQUIRE_COMPLETE === "1";
  let help = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      help = true;
      continue;
    }
    if (argument === "--require-complete") {
      requireComplete = true;
      continue;
    }
    if (["--input", "--result", "--source-output", "--public-output"].includes(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--"))
        throw new Error(`${argument} 后需要路径`);
      const items = values.get(argument) ?? [];
      items.push(value);
      values.set(argument, items);
      index += 1;
      continue;
    }
    throw new Error(`未知参数：${argument}`);
  }

  const resultArguments = values.get("--result");
  const resultPaths = resultArguments?.length
    ? resultArguments
    : DEFAULT_RESULTS.map(
        (defaultPath, index) =>
          env[`YEAR_SUPPLEMENT_RESULT${index + 1}`]?.trim() || defaultPath,
      );
  const singlePath = (argument, envName, fallback) => {
    const argumentValues = values.get(argument);
    if (argumentValues?.length > 1)
      throw new Error(`${argument} 只能指定一次`);
    return argumentValues?.[0] ?? env[envName]?.trim() ?? fallback;
  };

  return {
    help,
    requireComplete,
    inputPath: singlePath("--input", "YEAR_SUPPLEMENT_INPUT", DEFAULT_MANIFEST),
    resultPaths,
    sourcePath: singlePath(
      "--source-output",
      "YEAR_SUPPLEMENT_SOURCE_OUTPUT",
      path.join(ROOT, "data", "supplement", "work-years.json"),
    ),
    publicPath: singlePath(
      "--public-output",
      "YEAR_SUPPLEMENT_PUBLIC_OUTPUT",
      path.join(ROOT, "public", "data", "supplement", "work-years.json"),
    ),
  };
}

async function main(argv = process.argv.slice(2), env = process.env) {
  const options = parseArgs(argv, env);
  if (options.help) {
    console.log(
      "用法：node scripts/build-year-supplement.mjs [--input <清单>] [--result <批次.json> ...] [--require-complete] [--source-output <文件>] [--public-output <文件>]",
    );
    return;
  }

  const manifest = rowsFromJson(await readJson(options.inputPath), "undated.json");
  const availableGroups = [];
  const missingFiles = [];
  for (const resultPath of options.resultPaths) {
    if (!(await exists(resultPath))) {
      missingFiles.push(resultPath);
      console.warn(`YEAR_SUPPLEMENT_RESULT_MISSING ${resultPath}`);
      continue;
    }
    availableGroups.push(
      rowsFromJson(await readJson(resultPath), path.basename(resultPath)),
    );
  }

  const records = mergeYearSupplement(availableGroups, { manifest });
  const missingIds = missingManifestIds(records, manifest);
  if (options.requireComplete && (missingFiles.length || missingIds.length)) {
    throw new Error(
      `结果未齐，未写出文件：missingFiles=${missingFiles.length} missingIds=${missingIds.length}`,
    );
  }

  await writeYearSupplementFiles(records, {
    sourcePath: options.sourcePath,
    publicPath: options.publicPath,
  });
  const counts = Object.fromEntries(
    YEAR_SUPPLEMENT_STATUSES.map((status) => [
      status,
      records.filter((record) => record.status === status).length,
    ]),
  );
  console.log(
    `YEAR_SUPPLEMENT_BUILD_PASSED records=${records.length} found=${counts.found} traditional=${counts.traditional} not_found=${counts.not_found} missingFiles=${missingFiles.length} missingIds=${missingIds.length} complete=${missingFiles.length === 0 && missingIds.length === 0}`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      `YEAR_SUPPLEMENT_BUILD_FAILED ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
}
