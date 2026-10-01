import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "public", "data");
const atlasDir = path.join(dataDir, "atlas");
const booksDir = path.join(dataDir, "books");
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
