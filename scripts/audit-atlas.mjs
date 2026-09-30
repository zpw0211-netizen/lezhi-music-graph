import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "public", "data");
const booksDir = path.join(dataDir, "books");
const MIN_MAPPED_WORKS = 80;
const MAX_GEO_BYTES = 60 * 1024;
const MAX_GEO_GZIP_BYTES = 25 * 1024;
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

const files = ["atlas-geo.json", "atlas.json", "timeline.json"];
for (const file of files) {
  await stat(path.join(dataDir, file));
}
const [atlasGeo, atlas, timeline] = await Promise.all(
  files.map((file) => readJson(path.join(dataDir, file))),
);
const geoText = await readFile(path.join(dataDir, "atlas-geo.json"), "utf8");
const geoBytes = Buffer.byteLength(geoText);
const geoGzipBytes = gzipSync(Buffer.from(geoText, "utf8")).byteLength;
assert(
  geoBytes <= MAX_GEO_BYTES,
  "atlas-geo.json is " + geoBytes + " bytes; maximum is " + MAX_GEO_BYTES,
);
assert(
  geoGzipBytes <= MAX_GEO_GZIP_BYTES,
  "atlas-geo.json gzip is " +
    geoGzipBytes +
    " bytes; maximum is " +
    MAX_GEO_GZIP_BYTES,
);
const chinaTiles = atlasGeo.china?.tiles;
const worldMarkers = atlasGeo.world?.markers;
assert(
  atlasGeo.china?.cols === 11 && atlasGeo.china?.rows === 9,
  "atlas-geo.json China tile grid must be 11 columns by 9 rows.",
);
assert(
  Array.isArray(chinaTiles) && chinaTiles.length === 34,
  "atlas-geo.json must contain exactly 34 China tiles.",
);
const requiredChinaIds = ["CN-TW", "CN-HK", "CN-MO", "CN-XZ", "CN-XJ"];
for (const id of requiredChinaIds) {
  assert(
    chinaTiles.some((tile) => tile.id === id),
    "China tile grid is missing " + id,
  );
}
const chinaTileIds = new Set();
const chinaTilePositions = new Set();
for (const tile of chinaTiles) {
  assert(/^CN-[A-Z]{2}$/.test(tile.id), "Invalid China tile id: " + tile.id);
  assert(tile.name, "China tile is missing a Chinese short name: " + tile.id);
  assert(
    Number.isInteger(tile.col) &&
      tile.col >= 0 &&
      tile.col < atlasGeo.china.cols &&
      Number.isInteger(tile.row) &&
      tile.row >= 0 &&
      tile.row < atlasGeo.china.rows,
    "China tile is outside its grid: " + tile.id,
  );
  const position = tile.col + "," + tile.row;
  assert(!chinaTileIds.has(tile.id), "Duplicate China tile id: " + tile.id);
  assert(
    !chinaTilePositions.has(position),
    "Multiple China tiles occupy " + position,
  );
  chinaTileIds.add(tile.id);
  chinaTilePositions.add(position);
}
assert(
  typeof atlasGeo.world?.land === "string" && atlasGeo.world.land.startsWith("M"),
  "atlas-geo.json must contain a projected world land path.",
);
assert(
  Array.isArray(worldMarkers),
  "atlas-geo.json must contain world label markers.",
);
const markerIds = new Set();
for (const marker of worldMarkers) {
  assert(/^[A-Z0-9]{3}$/.test(marker.id), "Invalid world marker id: " + marker.id);
  assert(!markerIds.has(marker.id), "Duplicate world marker id: " + marker.id);
  assert(
    !["TWN", "CYN", "SOL", "KOS"].includes(marker.id),
    "Disallowed world marker id: " + marker.id,
  );
  assert(
    !/中华民国|台湾|北塞浦路斯|索马里兰/u.test(marker.name ?? ""),
    "Disallowed world marker name: " + marker.name,
  );
  assert(
    Number.isFinite(marker.x) && Number.isFinite(marker.y),
    "World marker is missing projected coordinates: " + marker.id,
  );
  markerIds.add(marker.id);
}

function assertNoBoundaryFields(value, parent = "atlas-geo") {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    assert(
      !/(?:border|boundary|country|province|region|国界|省界|国家|省份|轮廓)/iu.test(
        key,
      ),
      "atlas-geo.json contains a boundary-related field: " + parent + "." + key,
    );
    assertNoBoundaryFields(nested, parent + "." + key);
  }
}
assertNoBoundaryFields(atlasGeo);

const geoRegionIds = new Set([
  ...chinaTiles.map((tile) => tile.id),
  ...worldMarkers.map((marker) => marker.id),
]);
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
    if (WORK_TYPES.has(entity.type)) {
      knownWorks.add(book.bookKey + ":" + entity.id);
    }
    if (entity.type === "人物") {
      peopleByBookAndId.add(book.bookKey + ":" + entity.id);
    }
  }
}

const atlasWorks = new Map();
const assignedWorkKeys = new Set();
for (const region of atlas.regions ?? []) {
  assert(
    geoRegionIds.has(region.regionId),
    "Unknown atlas region: " + region.regionId,
  );
  for (const work of region.works ?? []) {
    const key = work.bookKey + ":" + work.id;
    assert(knownWorks.has(key), "Atlas work not found in books data: " + key);
    assignedWorkKeys.add(key);
    if (!atlasWorks.has(key)) atlasWorks.set(key, new Set());
    atlasWorks.get(key).add(region.regionId);
  }
}
for (const work of atlas.unassignedWorks ?? []) {
  const key = work.bookKey + ":" + work.id;
  assert(
    knownWorks.has(key),
    "Unassigned atlas work not found in books data: " + key,
  );
  assert(work.region === null, "Unassigned atlas work must have region:null: " + key);
  assert(!atlasWorks.has(key), "Work is both assigned and unassigned: " + key);
  atlasWorks.set(key, new Set());
}
assert(
  atlasWorks.size === knownWorks.size,
  "Atlas work coverage differs from books data: found " +
    atlasWorks.size +
    ", expected " +
    knownWorks.size,
);
for (const key of knownWorks) {
  assert(atlasWorks.has(key), "Atlas is missing work: " + key);
}
assert(
  assignedWorkKeys.size >= MIN_MAPPED_WORKS,
  "Only " +
    assignedWorkKeys.size +
    " works have a region; minimum is " +
    MIN_MAPPED_WORKS,
);
const atlasForeignIds = new Set(
  atlas.regions
    .filter((region) => region.type === "country" && region.regionId !== "CHN")
    .map((region) => region.regionId),
);
assert(
  markerIds.size === atlasForeignIds.size &&
    [...markerIds].every((id) => atlasForeignIds.has(id)),
  "World markers must match exactly the foreign countries used by atlas.json.",
);

const timelineWorks = new Set();
for (const work of timeline.works ?? []) {
  const key = work.bookKey + ":" + work.id;
  assert(knownWorks.has(key), "Timeline work not found in books data: " + key);
  timelineWorks.add(key);
}
assert(
  timelineWorks.size === knownWorks.size,
  "Timeline work coverage differs from books data: found " +
    timelineWorks.size +
    ", expected " +
    knownWorks.size,
);
for (const person of timeline.people ?? []) {
  assert(
    Array.isArray(person.sourceEntities),
    "Person is missing sourceEntities: " + person.name,
  );
  for (const source of person.sourceEntities) {
    assert(
      peopleByBookAndId.has(source.bookKey + ":" + source.id),
      "Timeline person not found in books data: " +
        source.bookKey +
        ":" +
        source.id,
    );
  }
  for (const workId of person.works ?? []) {
    assert(
      [...knownWorks].some((key) => key.endsWith(":" + workId)),
      "Timeline person references an unknown work: " + workId,
    );
  }
}

const atlasBytes = Buffer.byteLength(
  await readFile(path.join(dataDir, "atlas.json"), "utf8"),
);
const timelineBytes = Buffer.byteLength(
  await readFile(path.join(dataDir, "timeline.json"), "utf8"),
);
const domesticKeys = new Set();
const foreignKeys = new Set();
for (const region of atlas.regions) {
  for (const work of region.works) {
    const key = work.bookKey + ":" + work.id;
    if (region.type === "china") domesticKeys.add(key);
    else if (region.type === "country" && region.regionId !== "CHN") {
      foreignKeys.add(key);
    }
  }
}
const worksWithYear = timeline.works.filter((work) => work.year != null).length;
const peopleWithYears = timeline.people.filter(
  (person) => person.born != null || person.died != null,
).length;

console.log(
  "QUALITY_ATLAS_PASSED | china=" +
    chinaTiles.length +
    " tiles, world=" +
    worldMarkers.length +
    " used markers" +
    ", works=" +
    knownWorks.size +
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
    ", bytes=" +
    [geoBytes, atlasBytes, timelineBytes].join("/"),
);
