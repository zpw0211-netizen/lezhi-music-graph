// 把「人物生卒年补充」复核结果做成确定性的正式数据文件（与 build-year-supplement 同套路）。
// 输入：glm3 复核后的最终结果（91 条，见 T005）
// 输出：data/supplement/people-lifetime.json（源数据）与
//       public/data/supplement/people-lifetime.json（站点按需加载）
// 绝不修改教材数据（public/data/books、timeline.json 等不由本脚本触碰）。
//
// 用法：
//   node scripts/build-people-supplement.mjs [--input <结果.json>] [--source-output <文件>] [--public-output <文件>]
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_INPUT =
  "E:/Projects/yapu-collab/glm3/outbox/T005-people-lifetime-final.json";
const DEFAULT_MANIFEST = "E:/Projects/.tmp/claude/years/people-undated.json";

export const PEOPLE_LIFETIME_KIND = "supplement";
export const PEOPLE_LIFETIME_LABEL = "补充资料（非教材）";
export const PEOPLE_LIFETIME_STATUSES = Object.freeze([
  "found",
  "partial",
  "not_person",
  "not_found",
]);

const MIN_YEAR = 1000;
const MAX_YEAR = 2030;

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
  if (!/^https?:\/\//.test(url))
    throw new Error(`来源 url 必须是 http(s)：${id}`);
  return { title, url, publisher };
}

function normalizeYear(value, field, id) {
  if (value == null) return null;
  if (!Number.isInteger(value) || value < MIN_YEAR || value > MAX_YEAR)
    throw new Error(
      `${field} 必须是 ${MIN_YEAR}–${MAX_YEAR} 的整数或 null：${id}`,
    );
  return value;
}

function normalizeRecord(value, manifestById) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("人物生卒年结果必须是对象");

  const id = optionalText(value.id, "id", "<unknown>");
  const name = optionalText(value.name, "name", id ?? "<unknown>");
  if (!id || !name) throw new Error("人物生卒年结果必须包含 id 和 name");
  if (!PEOPLE_LIFETIME_STATUSES.includes(value.status))
    throw new Error(
      `status 无效（应为 found/partial/not_person/not_found）：${id}`,
    );

  const expected = manifestById.get(id);
  if (manifestById.size && !expected)
    throw new Error(`结果 ID 不在人物清单中：${id}`);
  if (expected && expected !== name)
    throw new Error(`人物姓名与清单不一致：${id}（${name} ≠ ${expected}）`);

  const born = normalizeYear(value.born, "born", id);
  const died = normalizeYear(value.died, "died", id);
  if (born != null && died != null && born > died)
    throw new Error(`born 晚于 died：${id}（${born} > ${died}）`);
  const lifetimeText = optionalText(value.lifetimeText, "lifetimeText", id);
  const subject = optionalText(value.subject, "subject", id);
  const note = optionalText(value.note, "note", id);

  if (value.status === "found" || value.status === "partial") {
    if (born == null && died == null)
      throw new Error(`${status} 结果必须有 born 或 died：${id}`);
    if (!lifetimeText)
      throw new Error(`${status} 结果必须有 lifetimeText：${id}`);
  }
  if (value.status === "partial" && (born == null) === (died == null))
    throw new Error(`partial 结果必须恰有生年或卒年之一：${id}`);
  if (
    (value.status === "not_person" || value.status === "not_found") &&
    (born != null || died != null || lifetimeText != null)
  )
    throw new Error(`${value.status} 结果不能带生卒年：${id}`);

  if (!Array.isArray(value.sources))
    throw new Error(`sources 必须是数组：${id}`);
  const sources = value.sources.map((source, index) =>
    normalizeSource(source, id, index),
  );
  if (
    (value.status === "found" || value.status === "partial") &&
    !sources.length
  )
    throw new Error(`已确认生卒年的结果至少需要一个来源：${id}`);

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
    born,
    died,
    lifetimeText,
    subject,
    sources,
    confidence: typeof confidence === "string" ? confidence.trim() : confidence,
    note,
    kind: PEOPLE_LIFETIME_KIND,
    label: PEOPLE_LIFETIME_LABEL,
  };
}

function manifestMap(manifest) {
  const byId = new Map();
  for (const person of manifest) {
    if (!person || typeof person !== "object" || Array.isArray(person))
      throw new Error("人物清单条目格式无效");
    const id = optionalText(person.id, "id", "<manifest>");
    const name = optionalText(person.name, "name", id ?? "<manifest>");
    if (!id || !name) throw new Error("人物清单条目必须包含 id 和 name");
    const existing = byId.get(id);
    if (existing && existing !== name)
      throw new Error(`人物清单中 ID 重复且名称冲突：${id}`);
    byId.set(id, name);
  }
  return byId;
}

/** 合并结果批次为稳定列表；冲突直接报错（fail closed）。 */
export function mergePeopleLifetime(resultGroups, { manifest = [] } = {}) {
  const knownPeople = manifestMap(manifest);
  const byId = new Map();
  for (const group of resultGroups) {
    if (!Array.isArray(group)) throw new Error("每个结果批次都必须是数组");
    for (const value of group) {
      const record = normalizeRecord(value, knownPeople);
      const previous = byId.get(record.id);
      if (previous)
        throw new Error(`结果 ID 重复：${record.id}（${record.name}）`);
      byId.set(record.id, record);
    }
  }
  return [...byId.values()].sort((left, right) => compareText(left.id, right.id));
}

export function missingPeopleManifestIds(records, manifest) {
  const present = new Set(records.map((record) => record.id));
  return manifest
    .map((person) => person.id)
    .filter((id) => !present.has(id))
    .sort(compareText);
}

export function serializePeopleLifetime(records) {
  const ordered = [...records].sort((left, right) => compareText(left.id, right.id));
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

export async function writePeopleLifetimeFiles(
  records,
  { sourcePath, publicPath },
) {
  const resolvedSourcePath = path.resolve(sourcePath);
  const resolvedPublicPath = path.resolve(publicPath);
  if (resolvedSourcePath === resolvedPublicPath)
    throw new Error("源数据与发布数据必须写入不同文件");
  const serialized = serializePeopleLifetime(records);
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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function rowsFromJson(value, description) {
  if (Array.isArray(value)) return value;
  throw new Error(`${description} 须为数组`);
}

function parseArgs(argv) {
  const single = (argument) => {
    const index = argv.indexOf(argument);
    if (index < 0) return undefined;
    const value = argv[index + 1];
    if (!value || value.startsWith("--"))
      throw new Error(`${argument} 后需要路径`);
    return value;
  };
  if (argv.includes("--help") || argv.includes("-h")) return { help: true };
  return {
    help: false,
    inputPath: single("--input") ?? DEFAULT_INPUT,
    manifestPath: single("--manifest") ?? DEFAULT_MANIFEST,
    sourcePath:
      single("--source-output") ??
      path.join(ROOT, "data", "supplement", "people-lifetime.json"),
    publicPath:
      single("--public-output") ??
      path.join(ROOT, "public", "data", "supplement", "people-lifetime.json"),
  };
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(
      "用法：node scripts/build-people-supplement.mjs [--input <结果.json>] [--manifest <清单.json>] [--source-output <文件>] [--public-output <文件>]",
    );
    return;
  }

  const manifest = rowsFromJson(await readJson(options.manifestPath), "人物清单");
  let records;
  try {
    records = rowsFromJson(await readJson(options.inputPath), "结果文件");
  } catch (error) {
    throw new Error(
      `读取结果失败（${options.inputPath}）：${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  const merged = mergePeopleLifetime([records], { manifest });
  const missingIds = missingPeopleManifestIds(merged, manifest);
  if (missingIds.length)
    throw new Error(`结果缺少清单中的人物：${missingIds.join(", ")}`);

  await writePeopleLifetimeFiles(merged, {
    sourcePath: options.sourcePath,
    publicPath: options.publicPath,
  });
  const counts = Object.fromEntries(
    PEOPLE_LIFETIME_STATUSES.map((status) => [
      status,
      merged.filter((record) => record.status === status).length,
    ]),
  );
  console.log(
    `PEOPLE_SUPPLEMENT_BUILD_PASSED records=${merged.length} found=${counts.found} partial=${counts.partial} not_person=${counts.not_person} not_found=${counts.not_found}`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(
      `PEOPLE_SUPPLEMENT_BUILD_FAILED ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    process.exitCode = 1;
  });
}
