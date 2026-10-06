import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BOOK_BY_KEY } from "../data/books.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "public", "data");
const atlasDir = path.join(dataDir, "atlas");
const booksDir = path.join(dataDir, "books");
const evidenceDir = path.join(dataDir, "evidence");
const MIN_MAPPED_WORKS = 80;
const MAX_ATLAS_DATA_BYTES = 500 * 1024;
const WORK_TYPES = new Set([
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
const DISALLOWED_COUNTRY_IDS = new Set(["TWN", "CYN", "SOL", "KOS"]);
const DISALLOWED_COUNTRY_NAMES = /中华民国|台湾|北塞浦路斯|索马里兰/u;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function assertPointList(points, label, idPattern) {
  assert(Array.isArray(points), label + " must be an array.");
  const ids = new Set();
  for (const point of points) {
    assert(
      JSON.stringify(Object.keys(point).sort()) ===
        JSON.stringify(["id", "lat", "lon", "name"]),
      label + " entries must contain only id, name, lat, and lon.",
    );
    assert(idPattern.test(point.id), "Invalid " + label + " id: " + point.id);
    assert(!ids.has(point.id), "Duplicate " + label + " id: " + point.id);
    assert(typeof point.name === "string" && point.name.length > 0, label + " name is missing: " + point.id);
    assert(
      Number.isFinite(point.lat) && point.lat >= -90 && point.lat <= 90,
      label + " latitude is invalid: " + point.id,
    );
    assert(
      Number.isFinite(point.lon) && point.lon >= -180 && point.lon <= 180,
      label + " longitude is invalid: " + point.id,
    );
    ids.add(point.id);
  }
  return ids;
}

async function assertPngSize(filePath, width, height) {
  const data = await readFile(filePath);
  assert(data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "Invalid PNG: " + path.basename(filePath));
  assert(data.readUInt32BE(16) === width, "Unexpected PNG width: " + path.basename(filePath));
  assert(data.readUInt32BE(20) === height, "Unexpected PNG height: " + path.basename(filePath));
  return data.byteLength;
}

const atlasFiles = [
  "china-height.png",
  "china-meta.json",
  "countries.json",
  "provinces.json",
  "world-mask.png",
  "world-relief.webp",
];
for (const file of [...atlasFiles, "atlas.json", "timeline.json"]) {
  await stat(path.join(file === "atlas.json" || file === "timeline.json" ? dataDir : atlasDir, file));
}
assert(
  !(await stat(path.join(dataDir, "atlas-geo.json")).then(() => true, () => false)),
  "Legacy atlas-geo.json must be removed; atlas runtime data uses point lists only.",
);

const [atlas, timeline, provinces, countries, chinaMeta] = await Promise.all([
  readJson(path.join(dataDir, "atlas.json")),
  readJson(path.join(dataDir, "timeline.json")),
  readJson(path.join(atlasDir, "provinces.json")),
  readJson(path.join(atlasDir, "countries.json")),
  readJson(path.join(atlasDir, "china-meta.json")),
]);

const provinceIds = assertPointList(provinces, "provinces.json", /^CN-[A-Z]{2}$/);
assert(provinces.length === 34, "provinces.json must contain 34 province-level points.");
for (const id of ["CN-TW", "CN-HK", "CN-MO", "CN-XZ", "CN-XJ"]) {
  assert(provinceIds.has(id), "provinces.json is missing " + id);
}
for (const [id, lat, lon] of [
  ["CN-TW", 23.7, 121.0],
  ["CN-HK", 22.35, 114.15],
  ["CN-MO", 22.2, 113.55],
]) {
  const point = provinces.find((item) => item.id === id);
  assert(point.lat === lat && point.lon === lon, "Manual point is incorrect: " + id);
}

const countryIds = assertPointList(countries, "countries.json", /^[A-Z0-9]{3}$/);
for (const point of countries) {
  assert(!DISALLOWED_COUNTRY_IDS.has(point.id), "Disallowed world marker id: " + point.id);
  assert(!DISALLOWED_COUNTRY_NAMES.test(point.name), "Disallowed world marker name: " + point.name);
}

assert(
  chinaMeta.lon0 === 70 && chinaMeta.lon1 === 137 && chinaMeta.lat0 === 14 && chinaMeta.lat1 === 56,
  "China terrain metadata must describe the requested 70–137E, 14–56N rectangle.",
);
assert(
  chinaMeta.cols === 537 && chinaMeta.rows === 337 && chinaMeta.step === 0.125,
  "China terrain grid must be 537 x 337 at 0.125 degree spacing.",
);
assert(chinaMeta.vmin === -500 && chinaMeta.vmax === 9000, "Unexpected elevation encoding range.");
const chinaHeightBytes = await assertPngSize(path.join(atlasDir, "china-height.png"), 537, 337);
const worldMaskBytes = await assertPngSize(path.join(atlasDir, "world-mask.png"), 2048, 1024);
const relief = await readFile(path.join(atlasDir, "world-relief.webp"));
assert(
  relief.subarray(0, 4).toString("ascii") === "RIFF" &&
    relief.subarray(8, 12).toString("ascii") === "WEBP",
  "world-relief.webp must be a valid WebP file.",
);
assert(relief.subarray(12, 16).toString("ascii") === "VP8 ", "World relief must be an opaque RGB WebP texture.");
const atlasDirectoryEntries = await readdir(atlasDir);
assert(
  atlasDirectoryEntries.length === atlasFiles.length &&
    atlasFiles.every((file) => atlasDirectoryEntries.includes(file)),
  "public/data/atlas must contain only the six declared point and terrain data files.",
);
const exactAtlasDataBytes = (
  await Promise.all(atlasDirectoryEntries.map((file) => stat(path.join(atlasDir, file))))
).reduce((total, entry) => total + entry.size, 0);
assert(exactAtlasDataBytes <= MAX_ATLAS_DATA_BYTES, "Atlas data totals " + exactAtlasDataBytes + " bytes; maximum is " + MAX_ATLAS_DATA_BYTES);

const books = await Promise.all(
  (await readdir(booksDir))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(path.join(booksDir, name))),
);
const knownWorks = new Set();
const peopleByBookAndId = new Set();
for (const book of books) {
  for (const entity of book.entities) {
    if (WORK_TYPES.has(entity.type)) knownWorks.add(book.bookKey + ":" + entity.id);
    if (entity.type === "人物") peopleByBookAndId.add(book.bookKey + ":" + entity.id);
  }
}

// ---- 页码独立重算所需的一手材料（全部来自正式数据 books / evidence，不读 atlas.json）----
const pageOffsetByBookKey = new Map(books.map((book) => [
  book.bookKey,
  book.pdfOffset ?? BOOK_BY_KEY.get(book.bookKey)?.pdfOffset ?? null,
]));
// 正式生卒年谓语 → lifetimeEvidence.kind，用来核对 tripleId 指向的谓词是否真的是生卒年。
const LIFETIME_PREDICATE_KIND = new Map([
  ["生卒年", "lifetime"],
  ["出生年", "birth"],
  ["出生时间", "birth"],
  ["生年", "birth"],
  ["卒年", "death"],
  ["逝世年", "death"],
  ["去世年", "death"],
  ["去世时间", "death"],
]);

const mediaPrintedPageByKey = new Map(); // "bookKey:entityId" → 最小「教材第N页」或 null
const triplesByBookSubject = new Map(); // bookKey → Map(subjectId → triple[])
const entityByBookId = new Map(); // bookKey → Map(id → entity)
const evidenceByBookTriple = new Map(); // bookKey → Map(tripleId → evidence 条目[])
for (const book of books) {
  entityByBookId.set(book.bookKey, new Map(book.entities.map((entity) => [entity.id, entity])));
  const bySubject = new Map();
  for (const triple of book.triples ?? []) {
    if (!bySubject.has(triple.subject)) bySubject.set(triple.subject, []);
    bySubject.get(triple.subject).push(triple);
  }
  triplesByBookSubject.set(book.bookKey, bySubject);
  for (const entity of book.entities) {
    const pages = (entity.media ?? [])
      .map((asset) => String(asset.title ?? "").match(/教材第(\d+)页/)?.[1])
      .filter(Boolean)
      .map(Number);
    mediaPrintedPageByKey.set(book.bookKey + ":" + entity.id, pages.length ? Math.min(...pages) : null);
  }
  const byTriple = new Map();
  try {
    const raw = await readJson(path.join(evidenceDir, book.bookKey + ".json"));
    for (const [tripleId, items] of Object.entries(raw.evidenceByTriple ?? {})) {
      byTriple.set(tripleId, Array.isArray(items) ? items : [items]);
    }
  } catch {
    // 没有 evidence 文件时留空：下面的重算会把本册所有 printedPage 判为「凭空出现」。
  }
  evidenceByBookTriple.set(book.bookKey, byTriple);
}

// 该作品**自己作主语**的三元组在正式 evidence 里的教材页 / PDF 页。
// 只用作品自身三元组：别处「相关作品→本作品」的引用页不算本作品的页。
function ownEvidencePages(bookKey, workId) {
  const found = [];
  for (const triple of triplesByBookSubject.get(bookKey)?.get(workId) ?? []) {
    for (const item of evidenceByBookTriple.get(bookKey)?.get(triple.id) ?? []) {
      const textbookPage = Number(item.textbookPage);
      if (!Number.isInteger(textbookPage) || item.pdfPage == null) continue;
      found.push({ textbookPage, pdfPage: item.pdfPage });
    }
  }
  return found;
}

// 独立重算「这份 work 记录应当是什么页码」。规则与 build-atlas 相同，但材料直接取自
// books / evidence，两边对不上就报错——这样「未归属作品」也能被覆盖到。
function expectedPageLabels(bookKey, workId) {
  const key = bookKey + ":" + workId;
  const own = ownEvidencePages(bookKey, workId);
  const fromMedia = mediaPrintedPageByKey.get(key) ?? null;
  if (fromMedia != null) {
    const hit = own.find((item) => item.textbookPage === fromMedia);
    return { printedPage: fromMedia, printedPdfPage: hit ? hit.pdfPage : null, printedPageSource: "media" };
  }
  const aligned = [
    ...new Set(
      own
        .filter((item) => Number.isInteger(pageOffsetByBookKey.get(bookKey)) && item.pdfPage - item.textbookPage === pageOffsetByBookKey.get(bookKey))
        .map((item) => item.textbookPage),
    ),
  ].sort((a, b) => a - b);
  if (!aligned.length) return { printedPage: null, printedPdfPage: null, printedPageSource: null };
  const printedPage = aligned[0];
  const hit = own.find((item) => item.textbookPage === printedPage);
  return { printedPage, printedPdfPage: hit ? hit.pdfPage : null, printedPageSource: "evidence" };
}

// 逐条核对 atlas work 的页码字段。**区域作品与未归属作品走同一套检查**（都在 recordAtlasWork 里调），
// 所以「未归属作品页码没人管」这个洞不会再出现。
function assertPageLabels(work, key) {
  const separator = key.indexOf(":");
  const bookKey = key.slice(0, separator);
  const workId = key.slice(separator + 1);

  assert(Object.hasOwn(work, "printedPage"), "Atlas work is missing printedPage: " + key);
  assert(Object.hasOwn(work, "printedPdfPage"), "Atlas work is missing printedPdfPage: " + key);
  assert(Object.hasOwn(work, "printedPageSource"), "Atlas work is missing printedPageSource: " + key);

  const printed = work.printedPage;
  const printedPdf = work.printedPdfPage;
  const source = work.printedPageSource;

  assert(printed === null || (Number.isInteger(printed) && printed > 0), "Invalid atlas printedPage: " + key);
  assert(printedPdf === null || (Number.isInteger(printedPdf) && printedPdf > 0), "Invalid atlas printedPdfPage: " + key);
  assert(source === null || source === "media" || source === "evidence", "Invalid printedPageSource: " + key);
  assert((printed === null) === (source === null), "printedPage and printedPageSource disagree: " + key);

  const own = ownEvidencePages(bookKey, workId);
  const mediaPage = mediaPrintedPageByKey.get(key) ?? null;

  if (printed != null) {
    // 来源必须真的是它声称的那个来源，页码不能凭空出现
    if (source === "media") {
      assert(printed === mediaPage, "printedPageSource=media but printedPage is not the media page: " + key);
      assert(
        own.some((item) => item.textbookPage === printed),
        "printedPage from media has no matching evidence textbookPage: " + key,
      );
    } else {
      assert(mediaPage === null, "printedPageSource=evidence but media actually has a page: " + key);
      const pageOffset = pageOffsetByBookKey.get(bookKey);
      const alignedOwn = own
        .filter((item) => Number.isInteger(pageOffset) && item.pdfPage - item.textbookPage === pageOffset)
        .map((item) => item.textbookPage);
      assert(alignedOwn.includes(printed), "printedPageSource=evidence but printedPage is not an evidence page: " + key);
      assert(printed === Math.min(...alignedOwn), "printedPage from evidence is not the smallest aligned page: " + key);
    }
    // 「印刷页 → PDF 页」若给了值，必须是同一份正式证据里的一对，且差值等于正式页差（8）
    if (printedPdf != null) {
      assert(
        own.some((item) => item.textbookPage === printed && item.pdfPage === printedPdf),
        "printedPdfPage is not the evidence pdfPage of printedPage: " + key,
      );
      assert(printedPdf - printed === pageOffsetByBookKey.get(bookKey), "printedPdfPage - printedPage is not the official page offset: " + key);
    }
  }

  // 与独立重算的结果逐字段比对
  const expected = expectedPageLabels(bookKey, workId);
  assert(printed === expected.printedPage, "printedPage mismatch for " + key + ": atlas=" + printed + " expected=" + expected.printedPage);
  assert(
    printedPdf === expected.printedPdfPage,
    "printedPdfPage mismatch for " + key + ": atlas=" + printedPdf + " expected=" + expected.printedPdfPage,
  );
  assert(
    source === expected.printedPageSource,
    "printedPageSource mismatch for " + key + ": atlas=" + source + " expected=" + expected.printedPageSource,
  );

  // 老字段 page 语义不变：仍是 firstPage（该实体首次被提及的 PDF 页），不许被当成印刷页改写
  const firstPage = entityByBookId.get(bookKey)?.get(workId)?.firstPage ?? null;
  assert(work.page === firstPage, "Atlas page must stay firstPage for " + key + ": atlas=" + work.page + " books=" + firstPage);
}

const validRegionIds = new Set([...provinceIds, ...countryIds]);
const atlasWorks = new Map();
const assignedWorkKeys = new Set();
const genreWorkKeys = new Set();
function recordAtlasWork(work, location) {
  const key = work.bookKey + ":" + work.id;
  assert(knownWorks.has(key), "Atlas work not found in books data: " + key);
  assert(typeof work.type === "string" && WORK_TYPES.has(work.type), "Atlas work is missing its type: " + key);
  assert(Object.hasOwn(work, "genre"), "Atlas work is missing its genre field: " + key);
  assert(work.genre === null || (typeof work.genre === "string" && work.genre.trim().length > 0), "Invalid atlas genre: " + key);
  if (work.genre) genreWorkKeys.add(key);
  assertPageLabels(work, key);
  if (!atlasWorks.has(key)) atlasWorks.set(key, new Set());
  if (location) atlasWorks.get(key).add(location);
}

for (const region of atlas.regions ?? []) {
  assert(validRegionIds.has(region.regionId), "Unknown atlas region: " + region.regionId);
  assert(
    region.type === (region.regionId.startsWith("CN-") ? "china" : "country"),
    "Atlas region type does not match point id: " + region.regionId,
  );
  for (const work of region.works ?? []) {
    const key = work.bookKey + ":" + work.id;
    assignedWorkKeys.add(key);
    recordAtlasWork(work, region.regionId);
  }
}
for (const work of atlas.unassignedWorks ?? []) {
  const key = work.bookKey + ":" + work.id;
  recordAtlasWork(work, null);
  assert(work.region === null, "Unassigned atlas work must have region:null: " + key);
  assert(!atlasWorks.get(key).size, "Work is both assigned and unassigned: " + key);
}
assert(atlasWorks.size === knownWorks.size, "Atlas work coverage differs from books data: found " + atlasWorks.size + ", expected " + knownWorks.size);
for (const key of knownWorks) assert(atlasWorks.has(key), "Atlas is missing work: " + key);
assert(assignedWorkKeys.size >= MIN_MAPPED_WORKS, "Only " + assignedWorkKeys.size + " works have a region; minimum is " + MIN_MAPPED_WORKS);
assert(atlas.summary.totalWorks === knownWorks.size, "Atlas summary totalWorks does not match books data.");
assert(atlas.summary.worksWithGenre === genreWorkKeys.size, "Atlas summary worksWithGenre does not match record coverage.");

const atlasForeignIds = new Set(
  atlas.regions
    .filter((region) => region.type === "country" && region.regionId !== "CHN")
    .map((region) => region.regionId),
);
assert(
  countryIds.size === atlasForeignIds.size && [...countryIds].every((id) => atlasForeignIds.has(id)),
  "countries.json must contain exactly the foreign countries used by atlas.json.",
);

const timelineWorks = new Set();
for (const work of timeline.works ?? []) {
  const key = work.bookKey + ":" + work.id;
  assert(knownWorks.has(key), "Timeline work not found in books data: " + key);
  timelineWorks.add(key);
}
assert(timelineWorks.size === knownWorks.size, "Timeline work coverage differs from books data: found " + timelineWorks.size + ", expected " + knownWorks.size);
for (const person of timeline.people ?? []) {
  assert(Array.isArray(person.sourceEntities), "Person is missing sourceEntities: " + person.name);
  for (const source of person.sourceEntities) {
    assert(peopleByBookAndId.has(source.bookKey + ":" + source.id), "Timeline person not found in books data: " + source.bookKey + ":" + source.id);
  }
  for (const workId of person.works ?? []) {
    assert([...knownWorks].some((key) => key.endsWith(":" + workId)), "Timeline person references an unknown work: " + workId);
  }
}

// Orientation guard for the globe textures: the land mask is an equirectangular PNG whose first row is the north pole.
// A vertical flip (e.g. UNPACK_FLIP_Y in the renderer, or a flipped asset) once put Antarctica at the north pole and Europe in the ocean.
{
  const { inflateSync } = await import("node:zlib");
  const png = await readFile(path.join(dataDir, "atlas", "world-mask.png"));
  let offset = 8;
  let header = null;
  const idat = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const body = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") header = { width: body.readUInt32BE(0), height: body.readUInt32BE(4), bitDepth: body[8], colorType: body[9] };
    if (type === "IDAT") idat.push(body);
    offset += 12 + length;
  }
  assert(header && header.bitDepth === 8 && header.colorType === 0, "world-mask.png must be an 8-bit greyscale PNG.");
  const raw = inflateSync(Buffer.concat(idat));
  const rowBytes = header.width + 1;
  const rows = [];
  let previous = Buffer.alloc(header.width);
  for (let y = 0; y < header.height; y += 1) {
    const filter = raw[y * rowBytes];
    const line = Buffer.from(raw.subarray(y * rowBytes + 1, (y + 1) * rowBytes));
    for (let x = 0; x < header.width; x += 1) {
      const left = x > 0 ? line[x - 1] : 0;
      const up = previous[x];
      const upLeft = x > 0 ? previous[x - 1] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = (left + up) >> 1;
      else if (filter === 4) {
        const estimate = left + up - upLeft;
        const dl = Math.abs(estimate - left);
        const du = Math.abs(estimate - up);
        const dul = Math.abs(estimate - upLeft);
        predictor = dl <= du && dl <= dul ? left : du <= dul ? up : upLeft;
      }
      line[x] = (line[x] + predictor) & 255;
    }
    rows.push(line);
    previous = line;
  }
  const landAt = (latitude, longitude) => {
    const y = Math.min(header.height - 1, Math.max(0, Math.floor(((90 - latitude) / 180) * header.height)));
    const x = Math.min(header.width - 1, Math.max(0, Math.floor(((longitude + 180) / 360) * header.width)));
    return rows[y][x] > 127;
  };
  // Land that must be land, ocean that must be ocean (all far from any coastline).
  const land = [["Sahara", 24, 15], ["central Europe", 48, 12], ["Siberia", 62, 95], ["Tibetan plateau", 33, 88], ["Brazil", -10, -52], ["Australia", -25, 134], ["North America", 45, -100]];
  const ocean = [["mid North Atlantic", 30, -40], ["mid South Pacific", -30, -130], ["Indian Ocean", -20, 80]];
  for (const [name, latitude, longitude] of land) assert(landAt(latitude, longitude), "world-mask.png is not land at " + name + " (is the texture flipped?)");
  for (const [name, latitude, longitude] of ocean) assert(!landAt(latitude, longitude), "world-mask.png is not ocean at " + name + " (is the texture flipped?)");
  const renderer = await readFile(path.join(root, "app", "components", "atlas", "atlasScene.ts"), "utf8");
  assert(!/UNPACK_FLIP_Y_WEBGL,\s*1\)/.test(renderer), "atlasScene.ts must not flip textures on upload (sphere v runs north to south, like the images).");
}

const atlasBytes = Buffer.byteLength(await readFile(path.join(dataDir, "atlas.json"), "utf8"));
const timelineBytes = Buffer.byteLength(await readFile(path.join(dataDir, "timeline.json"), "utf8"));
const domesticKeys = new Set();
const foreignKeys = new Set();
for (const region of atlas.regions) {
  for (const work of region.works) {
    const key = work.bookKey + ":" + work.id;
    if (region.type === "china") domesticKeys.add(key);
    else if (region.type === "country" && region.regionId !== "CHN") foreignKeys.add(key);
  }
}
const worksWithYear = timeline.works.filter((work) => work.year != null).length;
const peopleWithYears = timeline.people.filter((person) => person.born != null || person.died != null).length;

// 本单（T012）新增检查：
// 1) 页码检查已统一并入 recordAtlasWork → assertPageLabels：区域作品与未归属作品走同一套，
//    材料直接取自 books / evidence 独立重算，「未归属作品页码漏检」这个洞不会再出现。
// 2) 年表人物的生卒原文必须逐条回源到正式 books 三元组（下面）。

// 2) 年表人物：只要 born/died 有值，就必须有可追溯的原文；并且每条 lifetimeEvidence 都要
//    回 books 核对——tripleId 真的存在、主语是本人物、谓语确实是生卒年类、kind 与谓语一致、
//    取值与 text 逐字相同。反向也要核：本人物在 books 里的生卒年三元组不许漏进 lifetimeEvidence。
for (const person of timeline.people ?? []) {
  const evidenceList = Array.isArray(person.lifetimeEvidence) ? person.lifetimeEvidence : [];
  if (person.born == null && person.died == null) continue;
  assert(
    Array.isArray(person.lifetimeText) && person.lifetimeText.length > 0,
    "Timeline person has born/died but empty lifetimeText: " + person.name,
  );
  assert(evidenceList.length > 0, "Timeline person has born/died but empty lifetimeEvidence: " + person.name);
  const textSet = new Set(person.lifetimeText);
  const seenTripleIds = new Set();
  for (const entry of evidenceList) {
    assert(
      entry && typeof entry.bookKey === "string" && typeof entry.tripleId === "string" && typeof entry.text === "string",
      "Invalid lifetimeEvidence entry for " + person.name,
    );
    assert(textSet.has(entry.text), "lifetimeEvidence text not in lifetimeText for " + person.name + ": " + entry.text);

    // 注意：同一个人在不同册里是**不同的实体 id**，所以要按 sourceEntities 找到该册自己的 id。
    const sourceInBook = (person.sourceEntities ?? []).find((item) => item.bookKey === entry.bookKey);
    assert(sourceInBook, "lifetimeEvidence bookKey is not a source book of the person: " + person.name + " / " + entry.bookKey);
    const triple = (triplesByBookSubject.get(entry.bookKey)?.get(sourceInBook.id) ?? []).find(
      (item) => item.id === entry.tripleId,
    );
    assert(
      triple,
      "lifetimeEvidence tripleId is not a triple of this person in books: " +
        person.name + " / " + entry.bookKey + " / " + entry.tripleId,
    );
    const kind = LIFETIME_PREDICATE_KIND.get(triple.predicate);
    assert(
      kind,
      "lifetimeEvidence tripleId is not a lifetime predicate: " + person.name + " / " + triple.id + " / " + triple.predicate,
    );
    assert(
      kind === entry.kind,
      "lifetimeEvidence kind does not match the predicate: " + person.name + " / " + triple.id + " / " + kind + " != " + entry.kind,
    );
    const objectEntity = entityByBookId.get(entry.bookKey)?.get(triple.objectId);
    const value = triple.objectId ? objectEntity?.name ?? triple.literal ?? null : triple.literal ?? null;
    assert(
      value === entry.text,
      "lifetimeEvidence text does not match the triple value: " +
        person.name + " / " + triple.id + " / books=" + value + " evidence=" + entry.text,
    );
    seenTripleIds.add(triple.id);
  }

  // 反向：books 里该人物的每一条生卒年类三元组都必须有对应证据
  for (const source of person.sourceEntities ?? []) {
    for (const triple of triplesByBookSubject.get(source.bookKey)?.get(source.id) ?? []) {
      if (!LIFETIME_PREDICATE_KIND.has(triple.predicate)) continue;
      assert(
        seenTripleIds.has(triple.id),
        "lifetimeEvidence is missing a lifetime triple from books: " + person.name + " / " + source.bookKey + " / " + triple.id,
      );
    }
  }
}

console.log(
  "QUALITY_ATLAS_PASSED | provinces=" +
    provinces.length +
    ", countries=" +
    countries.length +
    ", works=" +
    knownWorks.size +
    ", genre=" +
    genreWorkKeys.size +
    ", mapped=" +
    assignedWorkKeys.size +
    " (minimum=" +
    MIN_MAPPED_WORKS +
    "), domestic=" +
    domesticKeys.size +
    ", foreign=" +
    foreignKeys.size +
    ", years=" +
    worksWithYear +
    ", peopleWithYears=" +
    peopleWithYears +
    ", atlasDataBytes=" +
    exactAtlasDataBytes +
    "/" +
    MAX_ATLAS_DATA_BYTES +
    ", textures=" +
    [chinaHeightBytes, worldMaskBytes, relief.byteLength].join("/") +
    ", json=" +
    [atlasBytes, timelineBytes].join("/"),
);
