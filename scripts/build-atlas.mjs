import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "public", "data");
const booksDir = path.join(dataDir, "books");
const rawDir =
  process.env.ATLAS_RAW_DIR ?? "E:\\Projects\\.tmp\\codex1\\T012\\raw";
const atlasGeoPath = path.join(dataDir, "atlas-geo.json");
const landRawPath = path.join(rawDir, "ne_110m_land.geojson");
const worldRawPath = path.join(rawDir, "ne_110m_admin_0_countries.geojson");

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 500;
const VIEW_PADDING = 12;
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
const COUNTRY_RELATIONS = new Set([
  "所属国家",
  "作曲家国籍",
  "作者国籍",
]);
const REGION_RELATIONS = new Set([
  "所属地区",
  "来源地区",
  "发源地",
  "起源地",
  "流传地区",
  "流行地区",
  "聚居地",
  "主要聚居地",
  "相关地区",
  "相关地域",
  "涉及地区",
]);
const ETHNICITY_RELATIONS = new Set(["所属民族"]);
const COMPOSER_RELATIONS = new Set(["作曲", "词曲作者", "作曲家"]);
const CREATION_TIME_RELATIONS = new Set([
  "创作年代",
  "创作时间",
  "创作年份",
  "谱曲时间",
]);

// Only ethnic groups represented by a type:"民族" entity in the six books.
// Each group is assigned to one representative main population area for the map.
const ETHNICITY_TO_PROVINCES = {
  蒙古族: ["内蒙古"],
  朝鲜族: ["吉林"],
  维吾尔族: ["新疆"],
  哈萨克族: ["新疆"],
  塔吉克族: ["新疆"],
  塔塔尔族: ["新疆"],
  柯尔克孜族: ["新疆"],
  藏族: ["西藏"],
  苗族: ["贵州"],
  侗族: ["贵州"],
  土家族: ["湖南"],
  瑶族: ["广西"],
  鄂伦春族: ["内蒙古"],
};

const CHINA_REGIONS = {
  "CN-XJ": "新疆",
  "CN-XZ": "西藏",
  "CN-NM": "内蒙古",
  "CN-GS": "甘肃",
  "CN-YN": "云南",
  "CN-HL": "黑龙江",
  "CN-JL": "吉林",
  "CN-LN": "辽宁",
  "CN-GX": "广西",
  "CN-GD": "广东",
  "CN-HI": "海南",
  "CN-FJ": "福建",
  "CN-ZJ": "浙江",
  "CN-SH": "上海",
  "CN-JS": "江苏",
  "CN-SD": "山东",
  "CN-HE": "河北",
  "CN-TJ": "天津",
  "CN-BJ": "北京",
  "CN-SC": "四川",
  "CN-CQ": "重庆",
  "CN-GZ": "贵州",
  "CN-HN": "湖南",
  "CN-NX": "宁夏",
  "CN-SN": "陕西",
  "CN-QH": "青海",
  "CN-SX": "山西",
  "CN-JX": "江西",
  "CN-HA": "河南",
  "CN-HB": "湖北",
  "CN-AH": "安徽",
  "CN-TW": "台湾",
  "CN-HK": "香港",
  "CN-MO": "澳门",
};

const CHINA_TILE_POSITIONS = [
  ["CN-HL", 8, 0],
  ["CN-NM", 4, 1],
  ["CN-JL", 8, 1],
  ["CN-XJ", 0, 2],
  ["CN-GS", 2, 2],
  ["CN-NX", 3, 2],
  ["CN-SX", 4, 2],
  ["CN-HE", 5, 2],
  ["CN-BJ", 6, 2],
  ["CN-TJ", 7, 2],
  ["CN-LN", 8, 2],
  ["CN-XZ", 0, 3],
  ["CN-QH", 1, 3],
  ["CN-SN", 3, 3],
  ["CN-HA", 4, 3],
  ["CN-SD", 5, 3],
  ["CN-YN", 0, 4],
  ["CN-SC", 1, 4],
  ["CN-CQ", 2, 4],
  ["CN-GZ", 3, 4],
  ["CN-HB", 4, 4],
  ["CN-AH", 5, 4],
  ["CN-JS", 6, 4],
  ["CN-SH", 7, 4],
  ["CN-ZJ", 8, 4],
  ["CN-GX", 2, 5],
  ["CN-HN", 3, 5],
  ["CN-JX", 4, 5],
  ["CN-FJ", 5, 5],
  ["CN-TW", 6, 5],
  ["CN-MO", 2, 6],
  ["CN-GD", 3, 6],
  ["CN-HK", 4, 6],
  ["CN-HI", 4, 7],
];
const EXCLUDED_WORLD_MARKERS = new Set(["TWN", "CYN", "SOL", "KOS"]);

const CHINA_ALIASES = {
  新疆: "CN-XJ",
  新疆维吾尔自治区: "CN-XJ",
  西藏: "CN-XZ",
  西藏自治区: "CN-XZ",
  内蒙古: "CN-NM",
  内蒙古自治区: "CN-NM",
  甘肃: "CN-GS",
  甘肃省: "CN-GS",
  云南: "CN-YN",
  云南省: "CN-YN",
  黑龙江: "CN-HL",
  黑龙江省: "CN-HL",
  吉林: "CN-JL",
  吉林省: "CN-JL",
  辽宁: "CN-LN",
  辽宁省: "CN-LN",
  广西: "CN-GX",
  广西壮族自治区: "CN-GX",
  广东: "CN-GD",
  广东省: "CN-GD",
  海南: "CN-HI",
  海南省: "CN-HI",
  福建: "CN-FJ",
  福建省: "CN-FJ",
  浙江: "CN-ZJ",
  浙江省: "CN-ZJ",
  上海: "CN-SH",
  上海市: "CN-SH",
  江苏: "CN-JS",
  江苏省: "CN-JS",
  山东: "CN-SD",
  山东省: "CN-SD",
  河北: "CN-HE",
  河北省: "CN-HE",
  天津: "CN-TJ",
  天津市: "CN-TJ",
  北京: "CN-BJ",
  北京市: "CN-BJ",
  四川: "CN-SC",
  四川省: "CN-SC",
  重庆: "CN-CQ",
  重庆市: "CN-CQ",
  贵州: "CN-GZ",
  贵州省: "CN-GZ",
  湖南: "CN-HN",
  湖南省: "CN-HN",
  宁夏: "CN-NX",
  宁夏回族自治区: "CN-NX",
  陕西: "CN-SN",
  陕西省: "CN-SN",
  陕北: "CN-SN",
  青海: "CN-QH",
  青海省: "CN-QH",
  山西: "CN-SX",
  山西省: "CN-SX",
  江西: "CN-JX",
  江西省: "CN-JX",
  河南: "CN-HA",
  河南省: "CN-HA",
  湖北: "CN-HB",
  湖北省: "CN-HB",
  安徽: "CN-AH",
  安徽省: "CN-AH",
  台湾: "CN-TW",
  台湾省: "CN-TW",
  香港: "CN-HK",
  澳门: "CN-MO",
  澳门特别行政区: "CN-MO",
};

const CHINA_PLACE_TO_PROVINCES = {
  敦煌: ["甘肃"],
  苏州: ["江苏"],
  姑苏: ["江苏"],
  延安: ["陕西"],
  陇东: ["甘肃"],
  沂蒙: ["山东"],
  拉萨: ["西藏"],
};

const COUNTRY_ALIASES = {
  俄国: "RUS",
  俄罗斯: "RUS",
  台湾: "CN-TW",
  台湾地区: "CN-TW",
  中国台湾地区: "CN-TW",
  苏格兰: "GBR",
  "英国（苏格兰）": "GBR",
  英格兰: "GBR",
  英国: "GBR",
};
const UNMAPPED_COUNTRIES = new Set(["苏联"]);
const PROVINCE_NAMES_LONGEST_FIRST = Object.keys(CHINA_ALIASES).sort(
  (a, b) => b.length - a.length,
);

const round = (value) => Math.round(value);
const normalizeName = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim();

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function readJson(filePath) {
  return readFile(filePath, "utf8").then((text) => JSON.parse(text));
}

function equalEarth(longitude, latitude) {
  const radians = Math.PI / 180;
  const lambda = longitude * radians;
  const phi = latitude * radians;
  const A1 = 1.340264;
  const A2 = -0.081106;
  const A3 = 0.000893;
  const A4 = 0.003796;
  const theta = Math.asin((Math.sqrt(3) / 2) * Math.sin(phi));
  const theta2 = theta * theta;
  const theta6 = theta2 * theta2 * theta2;
  const denominator =
    3 *
    (A1 + 3 * A2 * theta2 + theta6 * (7 * A3 + 9 * A4 * theta2));
  const x = (2 * Math.sqrt(3) * lambda * Math.cos(theta)) / denominator;
  const y =
    theta * (A1 + A2 * theta2 + theta6 * (A3 + A4 * theta2));
  return [x, y];
}

function polygonsForGeometry(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

function ringMetrics(points) {
  let area2 = 0;
  let xSum = 0;
  let ySum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const cross = current[0] * next[1] - next[0] * current[1];
    area2 += cross;
    xSum += (current[0] + next[0]) * cross;
    ySum += (current[1] + next[1]) * cross;
  }
  if (Math.abs(area2) < 1e-12) return null;
  return {
    area2,
    centroid: [xSum / (3 * area2), ySum / (3 * area2)],
  };
}

function pointSegmentDistanceSquared(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) {
    return (point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2;
  }
  const amount = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) /
        (dx * dx + dy * dy),
    ),
  );
  const x = start[0] + amount * dx;
  const y = start[1] + amount * dy;
  return (point[0] - x) ** 2 + (point[1] - y) ** 2;
}

function simplifyOpenLine(points, tolerance) {
  if (points.length <= 2) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  const toleranceSquared = tolerance * tolerance;
  while (stack.length) {
    const [startIndex, endIndex] = stack.pop();
    let farthestIndex = -1;
    let farthestDistance = toleranceSquared;
    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = pointSegmentDistanceSquared(
        points[index],
        points[startIndex],
        points[endIndex],
      );
      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestIndex = index;
      }
    }
    if (farthestIndex >= 0) {
      keep[farthestIndex] = 1;
      stack.push([startIndex, farthestIndex], [farthestIndex, endIndex]);
    }
  }
  return points.filter((_, index) => keep[index] === 1);
}

function simplifyClosedRing(ring, tolerance) {
  const points = ring.slice();
  if (
    points.length > 1 &&
    Math.hypot(
      points[0][0] - points.at(-1)[0],
      points[0][1] - points.at(-1)[1],
    ) < 1e-8
  ) {
    points.pop();
  }
  if (points.length <= 4) return points;

  let farthestIndex = 1;
  let farthestDistance = -1;
  for (let index = 1; index < points.length; index += 1) {
    const distance =
      (points[index][0] - points[0][0]) ** 2 +
      (points[index][1] - points[0][1]) ** 2;
    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthestIndex = index;
    }
  }
  const firstArc = simplifyOpenLine(points.slice(0, farthestIndex + 1), tolerance);
  const secondArc = simplifyOpenLine(
    [...points.slice(farthestIndex), points[0]],
    tolerance,
  );
  const simplified = [...firstArc.slice(0, -1), ...secondArc.slice(0, -1)];
  const unique = simplified.filter(
    (point, index) =>
      index === 0 ||
      Math.hypot(
        point[0] - simplified[index - 1][0],
        point[1] - simplified[index - 1][1],
      ) > 1e-8,
  );
  return unique.length >= 3 ? unique : points;
}

function buildProjectedShape(features, project, tolerance) {
  const polygons = [];
  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };
  let centroidX = 0;
  let centroidY = 0;
  let totalArea = 0;

  for (const feature of features) {
    for (const polygon of polygonsForGeometry(feature.geometry)) {
      const projectedRings = [];
      for (let ringIndex = 0; ringIndex < polygon.length; ringIndex += 1) {
        const projected = polygon[ringIndex]
          .map(([longitude, latitude]) => project(longitude, latitude))
          .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
        if (projected.length < 3) continue;
        for (const [x, y] of projected) {
          bounds.minX = Math.min(bounds.minX, x);
          bounds.maxX = Math.max(bounds.maxX, x);
          bounds.minY = Math.min(bounds.minY, y);
          bounds.maxY = Math.max(bounds.maxY, y);
        }
        const metrics = ringMetrics(projected);
        if (metrics) {
          const area = Math.abs(metrics.area2) / 2;
          const weight = ringIndex === 0 ? area : -area;
          centroidX += metrics.centroid[0] * weight;
          centroidY += metrics.centroid[1] * weight;
          totalArea += weight;
        }
        projectedRings.push(simplifyClosedRing(projected, tolerance));
      }
      if (projectedRings.length) polygons.push(projectedRings);
    }
  }
  if (!polygons.length || !Number.isFinite(bounds.minX)) {
    throw new Error("A map region has no polygon coordinates.");
  }

  const width = bounds.maxX - bounds.minX || 1;
  const height = bounds.maxY - bounds.minY || 1;
  const scale = Math.min(
    (VIEW_WIDTH - VIEW_PADDING * 2) / width,
    (VIEW_HEIGHT - VIEW_PADDING * 2) / height,
  );
  const drawnWidth = width * scale;
  const drawnHeight = height * scale;
  const offsetX = (VIEW_WIDTH - drawnWidth) / 2;
  const offsetY = (VIEW_HEIGHT - drawnHeight) / 2;
  const toView = ([x, y]) => [
    round(offsetX + (x - bounds.minX) * scale),
    round(VIEW_HEIGHT - offsetY - (y - bounds.minY) * scale),
  ];
  const d = polygons
    .flatMap((polygon) =>
      polygon.map((ring) => {
        const points = ring.map(toView);
        return (
          "M" +
          points[0][0] +
          " " +
          points[0][1] +
          points
            .slice(1)
            .map((point) => "L" + point[0] + " " + point[1])
            .join("") +
          "Z"
        );
      }),
    )
    .join("");
  const center =
    Math.abs(totalArea) > 1e-12
      ? toView([centroidX / totalArea, centroidY / totalArea])
      : toView([(bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2]);

  return {
    viewBox: "0 0 " + VIEW_WIDTH + " " + VIEW_HEIGHT,
    d,
    centroid: { x: center[0], y: center[1] },
    project: (longitude, latitude) =>
      toView(project(longitude, latitude)),
  };
}

function buildAtlasGeo(land, admin0) {
  const landPolygons = land.features
    .flatMap((feature) => polygonsForGeometry(feature.geometry))
    .filter((polygon) => polygon[0]?.some(([, latitude]) => latitude > -60))
    .map((coordinates) => ({ geometry: { type: "Polygon", coordinates } }));
  const landShape = buildProjectedShape(landPolygons, equalEarth, 0.006);
  const markers = admin0.features
    .map((feature) => {
      const properties = feature.properties ?? {};
      const id = properties.ADM0_A3;
      const name = properties.NAME_ZH ?? properties.NAME_EN ?? properties.ADMIN;
      if (
        !/^[A-Z0-9]{3}$/.test(id ?? "") ||
        EXCLUDED_WORLD_MARKERS.has(id) ||
        !name ||
        /中华民国|台湾|北塞浦路斯|索马里兰/u.test(name)
      ) {
        return null;
      }
      const longitude = Number(properties.LABEL_X);
      const latitude = Number(properties.LABEL_Y);
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
      const [x, y] = landShape.project(longitude, latitude);
      return { id, name, x, y };
    })
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id));
  const tiles = CHINA_TILE_POSITIONS.map(([id, col, row]) => ({
    id,
    name: CHINA_REGIONS[id],
    col,
    row,
  })).sort((a, b) => a.id.localeCompare(b.id));

  if (tiles.length !== 34 || new Set(tiles.map((tile) => tile.id)).size !== 34) {
    throw new Error("China tile layout must contain 34 unique regions.");
  }
  if (markers.length < 150) {
    throw new Error("Natural Earth admin-0 data returned too few label points.");
  }
  return {
    china: { cols: 11, rows: 9, tiles },
    world: {
      viewBox: landShape.viewBox,
      land: landShape.d,
      markers,
    },
  };
}

function sourceEntityMap(book) {
  return new Map(book.entities.map((entity) => [entity.id, entity]));
}

function valueForTriple(triple, entities) {
  if (triple.objectId) {
    return entities.get(triple.objectId)?.name ?? triple.literal ?? null;
  }
  return triple.literal ?? null;
}

function getWorkUnits(work, book, entities) {
  return book.triples
    .filter(
      (triple) =>
        triple.objectId === work.id &&
        ["包含作品", "包含乐曲", "包含曲目", "包含"].includes(
          triple.predicate,
        ) &&
        entities.get(triple.subject)?.type === "单元",
    )
    .sort((a, b) => (a.sourcePage ?? 0) - (b.sourcePage ?? 0))
    .map((triple) => entities.get(triple.subject)?.name)
    .filter(Boolean);
}

function makeWorkRecord(work, book, entities) {
  return {
    id: work.id,
    name: work.name,
    type: work.type,
    bookKey: book.bookKey,
    unit: getWorkUnits(work, book, entities)[0] ?? null,
    page: work.firstPage ?? null,
  };
}

function makeCountryNameMap(atlasGeo, admin0) {
  const ids = new Map();
  for (const marker of atlasGeo.world.markers) {
    ids.set(normalizeName(marker.name), marker.id);
  }
  for (const feature of admin0?.features ?? []) {
    const properties = feature.properties ?? {};
    if (
      !/^[A-Z0-9]{3}$/.test(properties.ADM0_A3 ?? "") ||
      EXCLUDED_WORLD_MARKERS.has(properties.ADM0_A3)
    ) {
      continue;
    }
    for (const name of [
      properties.ADMIN,
      properties.NAME,
      properties.NAME_LONG,
      properties.NAME_ZH,
      properties.NAME_ZHT,
      properties.NAME_EN,
    ]) {
      if (name) ids.set(normalizeName(name), properties.ADM0_A3);
    }
  }
  for (const [name, id] of Object.entries(COUNTRY_ALIASES)) {
    ids.set(normalizeName(name), id);
  }
  return ids;
}

function makeChinaNameMap(atlasGeo) {
  const ids = new Map();
  for (const tile of atlasGeo.china.tiles) {
    ids.set(normalizeName(tile.name), tile.id);
  }
  for (const [name, id] of Object.entries(CHINA_ALIASES)) {
    ids.set(normalizeName(name), id);
  }
  return ids;
}

function findChinaRegionsInText(text, chinaNameToId) {
  const normalized = normalizeName(text);
  const found = new Set();
  for (const alias of PROVINCE_NAMES_LONGEST_FIRST) {
    if (normalized.includes(normalizeName(alias))) {
      const id = chinaNameToId.get(normalizeName(alias));
      if (id) found.add(id);
    }
  }
  for (const [place, provinces] of Object.entries(CHINA_PLACE_TO_PROVINCES)) {
    if (!normalized.includes(normalizeName(place))) continue;
    for (const province of provinces) {
      const id = chinaNameToId.get(normalizeName(province));
      if (id) found.add(id);
    }
  }
  return [...found];
}

function chinaPlaceEvidence(text) {
  const normalized = normalizeName(text);
  const evidence = [];
  for (const [place, provinces] of Object.entries(CHINA_PLACE_TO_PROVINCES)) {
    if (!normalized.includes(normalizeName(place))) continue;
    for (const province of provinces) {
      evidence.push({
        type: "mapping",
        explanation:
          "地点“" +
          place +
          "”按省级行政区映射到" +
          province +
          "。",
      });
    }
  }
  return evidence;
}

function findCountriesInText(text, countryNameToId) {
  const normalized = normalizeName(text);
  if (!normalized) return [];
  const exact = countryNameToId.get(normalized);
  if (exact) return [exact];

  const components = normalized.split(/[、，,;；/／—–-]|以及|和|与|及/);
  const matches = new Set();
  for (const component of components) {
    const code = countryNameToId.get(normalizeName(component));
    if (code) matches.add(code);
  }
  let remaining = normalized;
  const aliases = [...countryNameToId.keys()]
    .filter((name) => name.length > 1)
    .sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    if (!remaining.includes(alias)) continue;
    matches.add(countryNameToId.get(alias));
    remaining = remaining.replace(alias, "§".repeat(alias.length));
  }
  return [...matches];
}

function getAssignmentsForWork({
  work,
  book,
  entities,
  chinaNameToId,
  countryNameToId,
  regionNamesById,
}) {
  const byId = new Map();
  const unresolved = [];
  const evidenceFor = (triple, value) => ({
    type: "triple",
    tripleId: triple.id,
    relation: triple.predicate,
    value,
  });
  const add = (regionId, evidence) => {
    if (!regionNamesById.has(regionId)) return;
    if (!byId.has(regionId)) byId.set(regionId, []);
    byId.get(regionId).push(...evidence);
  };
  const note = (triple, value, reason) => {
    unresolved.push({
      ...evidenceFor(triple, value),
      explanation: reason,
    });
  };
  const sourceEdges = book.triples.filter(
    (triple) => triple.subject === work.id,
  );
  let explicitLocation = false;

  for (const triple of sourceEdges) {
    const value = valueForTriple(triple, entities);
    if (!value) continue;
    if (COUNTRY_RELATIONS.has(triple.predicate)) {
      explicitLocation = true;
      const countryIds = findCountriesInText(value, countryNameToId);
      const nonChinaIds = countryIds.filter((id) => id !== "CHN");
      for (const id of nonChinaIds) {
        add(id, [evidenceFor(triple, value)]);
      }
      if (countryIds.includes("CHN")) {
        note(
          triple,
          value,
          "教材只标到中国国家层级，无法据此确定省区。",
        );
      } else if (!countryIds.length) {
        note(
          triple,
          value,
          UNMAPPED_COUNTRIES.has(normalizeName(value))
            ? "教材所列为历史国家/政体，当前世界底图没有对应边界。"
            : "国家名称无法对应当前世界底图。",
        );
      }
      continue;
    }
    if (REGION_RELATIONS.has(triple.predicate)) {
      explicitLocation = true;
      const chinaIds = findChinaRegionsInText(value, chinaNameToId);
      const countryIds = findCountriesInText(value, countryNameToId).filter(
        (id) => id !== "CHN",
      );
      const evidence = [
        evidenceFor(triple, value),
        ...chinaPlaceEvidence(value),
      ];
      for (const id of chinaIds) {
        add(id, evidence);
      }
      for (const id of countryIds) {
        add(id, [evidenceFor(triple, value)]);
      }
      if (!chinaIds.length && !countryIds.length) {
        note(triple, value, "教材地区文字不能可靠对应到地图中的省区或国家。");
      }
      continue;
    }
    if (ETHNICITY_RELATIONS.has(triple.predicate)) {
      explicitLocation = true;
      const ethnicity = normalizeName(value);
      const provinces = ETHNICITY_TO_PROVINCES[ethnicity];
      if (!provinces) {
        note(triple, value, "教材民族值没有可靠的省区映射，保留未归属。");
        continue;
      }
      for (const province of provinces) {
        const id = chinaNameToId.get(normalizeName(province));
        if (id) {
          add(id, [
            evidenceFor(triple, value),
            {
              type: "mapping",
              explanation:
                "民族“" +
                ethnicity +
                "”按脚本中的显式映射表归到" +
                province +
                "。",
            },
          ]);
        }
      }
    }
  }

  for (const triple of book.triples) {
    if (triple.objectId !== work.id && triple.subject !== work.id) continue;
    if (
      COUNTRY_RELATIONS.has(triple.predicate) ||
      REGION_RELATIONS.has(triple.predicate) ||
      ETHNICITY_RELATIONS.has(triple.predicate)
    ) {
      continue;
    }
    const otherId = triple.subject === work.id ? triple.objectId : triple.subject;
    const other = otherId ? entities.get(otherId) : null;
    if (other?.type !== "地域") continue;
    explicitLocation = true;
    const chinaIds = findChinaRegionsInText(other.name, chinaNameToId);
    const countryIds = findCountriesInText(other.name, countryNameToId).filter(
      (id) => id !== "CHN",
    );
    const evidence = [
      evidenceFor(triple, other.name),
      {
        type: "entity",
        entityId: other.id,
        entityType: other.type,
        name: other.name,
      },
      ...chinaPlaceEvidence(other.name),
    ];
    for (const id of [...chinaIds, ...countryIds]) add(id, evidence);
    if (!chinaIds.length && !countryIds.length) {
      note(
        triple,
        other.name,
        "教材地域实体无法可靠对应到地图中的省区或国家。",
      );
    }
  }

  if (byId.size || explicitLocation) return { assignments: byId, unresolved };

  const title = normalizeName(work.name).replace(/[《》「」『』]/g, "");
  const titleChina = findChinaRegionsInText(title, chinaNameToId);
  if (titleChina.length) {
    const alias = PROVINCE_NAMES_LONGEST_FIRST.find((item) =>
      title.includes(normalizeName(item)),
    );
    const evidence = [
      {
        type: "title",
        explanation:
          "作品名直接出现地点“" + (alias ?? "教材中的省区名") + "”。",
      },
      ...chinaPlaceEvidence(title),
    ];
    for (const id of titleChina) add(id, evidence);
    return { assignments: byId, unresolved };
  }

  const titleCountries = findCountriesInText(title, countryNameToId).filter(
    (id) => id !== "CHN",
  );
  if (titleCountries.length) {
    const evidence = [
      {
        type: "title",
        explanation: "作品名直接出现可识别的外国国家名称。",
      },
    ];
    for (const id of titleCountries) add(id, evidence);
    return { assignments: byId, unresolved };
  }

  const composerEdges = sourceEdges.filter(
    (triple) =>
      COMPOSER_RELATIONS.has(triple.predicate) &&
      triple.objectId &&
      entities.get(triple.objectId)?.type === "人物",
  );
  for (const composerEdge of composerEdges) {
    const composer = entities.get(composerEdge.objectId);
    const nationalityEdges = book.triples.filter(
      (triple) =>
        triple.subject === composer.id &&
        ["国籍", "作曲家国籍", "作者国籍"].includes(triple.predicate),
    );
    for (const nationality of nationalityEdges) {
      const value = valueForTriple(nationality, entities);
      const ids = findCountriesInText(value, countryNameToId).filter(
        (id) => id !== "CHN",
      );
      for (const id of ids) {
        add(id, [
          evidenceFor(composerEdge, composer.name),
          evidenceFor(nationality, value),
        ]);
      }
      if (!ids.length && value) {
        note(
          nationality,
          value,
          "作曲家国籍无法对应到当前世界底图国家。",
        );
      }
    }
  }
  if (byId.size) return { assignments: byId, unresolved };
  if (!unresolved.length) {
    unresolved.push({
      type: "unresolved",
      explanation:
        "教材没有提供可对应地图的地域证据，作品名也没有直接出现可识别地点。",
    });
  }
  return { assignments: byId, unresolved };
}

function makeAtlasData(books, atlasGeo, admin0) {
  const chinaNameToId = makeChinaNameMap(atlasGeo);
  const countryNameToId = makeCountryNameMap(atlasGeo, admin0);
  const regionNamesById = new Map([
    ...atlasGeo.china.tiles.map((tile) => [tile.id, tile.name]),
    ...atlasGeo.world.markers.map((marker) => [marker.id, marker.name]),
  ]);
  const assignmentsByRegion = new Map();
  const unassignedWorks = [];
  const assignedKeys = new Set();
  let totalWorks = 0;

  for (const book of books) {
    const entities = sourceEntityMap(book);
    for (const work of book.entities.filter((entity) =>
      WORK_TYPES.has(entity.type),
    )) {
      totalWorks += 1;
      const record = makeWorkRecord(work, book, entities);
      const result = getAssignmentsForWork({
        work,
        book,
        entities,
        chinaNameToId,
        countryNameToId,
        regionNamesById,
      });
      if (!result.assignments.size) {
        unassignedWorks.push({
          ...record,
          region: null,
          evidence: result.unresolved,
        });
        continue;
      }
      assignedKeys.add(book.bookKey + ":" + work.id);
      for (const [regionId, evidence] of result.assignments) {
        if (!assignmentsByRegion.has(regionId)) {
          assignmentsByRegion.set(regionId, []);
        }
        const uniqueEvidence = [
          ...new Map(
            evidence.map((entry) => [JSON.stringify(entry), entry]),
          ).values(),
        ];
        assignmentsByRegion.get(regionId).push({
          ...record,
          evidence: uniqueEvidence,
        });
      }
    }
  }

  const regions = [...assignmentsByRegion.entries()]
    .map(([regionId, works]) => ({
      regionId,
      name: regionNamesById.get(regionId),
      type: regionId.startsWith("CN-") ? "china" : "country",
      works: works.sort(
        (a, b) =>
          a.bookKey.localeCompare(b.bookKey) ||
          (a.page ?? 0) - (b.page ?? 0) ||
          a.name.localeCompare(b.name, "zh-CN"),
      ),
    }))
    .sort((a, b) => a.regionId.localeCompare(b.regionId));

  return {
    regions,
    unassignedWorks: unassignedWorks.sort(
      (a, b) =>
        a.bookKey.localeCompare(b.bookKey) ||
        (a.page ?? 0) - (b.page ?? 0) ||
        a.name.localeCompare(b.name, "zh-CN"),
    ),
    summary: {
      totalWorks,
      assignedWorks: assignedKeys.size,
      domesticWorks: new Set(
        regions
          .filter((region) => region.type === "china")
          .flatMap((region) =>
            region.works.map((work) => work.bookKey + ":" + work.id),
          ),
      ).size,
      foreignWorks: new Set(
        regions
          .filter(
            (region) => region.type === "country" && region.regionId !== "CHN",
          )
          .flatMap((region) =>
            region.works.map((work) => work.bookKey + ":" + work.id),
          ),
      ).size,
      unassignedWorks: unassignedWorks.length,
    },
  };
}

function yearRange(start, end = start) {
  const low = Math.min(start, end);
  const high = Math.max(start, end);
  return {
    year: Math.round((low + high) / 2),
    range: [low, high],
  };
}

function chineseNumberToArabic(value) {
  const digitValues = {
    零: "0",
    〇: "0",
    一: "1",
    二: "2",
    三: "3",
    四: "4",
    五: "5",
    六: "6",
    七: "7",
    八: "8",
    九: "9",
  };
  if ([...value].every((character) => digitValues[character] != null)) {
    return Number([...value].map((character) => digitValues[character]).join(""));
  }
  const units = { 十: 10, 百: 100, 千: 1000 };
  let total = 0;
  let section = 0;
  let digit = 0;
  for (const character of value) {
    if (digitValues[character] != null) {
      digit = Number(digitValues[character]);
    } else if (units[character]) {
      section += (digit || 1) * units[character];
      digit = 0;
    }
  }
  total += section + digit;
  return total;
}

function normalizeChineseDateText(value) {
  const chineseNumeral = "[〇零一二三四五六七八九十百千]+";
  return String(value)
    .normalize("NFKC")
    .replace(
      new RegExp("(" + chineseNumeral + ")(?=年|世纪)", "g"),
      (_, digits) => String(chineseNumberToArabic(digits)),
    );
}

function parseYearText(raw) {
  if (raw == null || String(raw).trim() === "") {
    return { year: null, range: null, text: raw ?? null };
  }
  const text = normalizeChineseDateText(raw).replace(/[，,]/g, "");
  const bce = /公元前/.test(text);

  const centuryDecade = text.match(/(\d{1,2})世纪\s*(\d{1,2})年代/);
  if (centuryDecade) {
    const start =
      (Number(centuryDecade[1]) - 1) * 100 +
      Number(centuryDecade[2]);
    return { ...yearRange(start, start + 9), text: raw };
  }
  const decade = text.match(/(\d{3,4})年代/);
  if (decade) {
    const start = Number(decade[1]);
    return { ...yearRange(start, start + 9), text: raw };
  }
  const century = text.match(
    /(\d{1,2})世纪(初|早期|前期|上半叶|中叶|中期|下半叶|后期|晚期|末)?/,
  );
  if (century) {
    const number = Number(century[1]);
    let start = (number - 1) * 100 + 1;
    let end = number * 100;
    if (century[2] === "初" || century[2] === "早期" || century[2] === "前期") {
      end = start + 29;
    } else if (century[2] === "上半叶") {
      end = start + 49;
    } else if (century[2] === "中叶" || century[2] === "中期") {
      start += 30;
      end = Math.min(start + 39, number * 100);
    } else if (century[2] === "下半叶") {
      start += 50;
    } else if (century[2] === "后期" || century[2] === "晚期" || century[2] === "末") {
      start = end - 29;
    }
    if (bce) return { ...yearRange(-end, -start), text: raw };
    return { ...yearRange(start, end), text: raw };
  }

  const yearMatches = [
    ...text.matchAll(/(公元前\s*)?(\d{3,4})\s*(?:年)?/g),
  ].map((match) => {
    const value = Number(match[2]);
    return match[1] || bce ? -value : value;
  });
  if (!yearMatches.length) return { year: null, range: null, text: raw };

  if (/年前后|年左右|约/.test(text) && yearMatches.length === 1) {
    const center = yearMatches[0];
    return { ...yearRange(center - 2, center + 2), text: raw };
  }
  if (yearMatches.length > 1 && /[—–－~～至到-]/.test(text)) {
    return { ...yearRange(yearMatches[0], yearMatches[1]), text: raw };
  }
  return { ...yearRange(yearMatches[0]), text: raw };
}

function parseLifetime(raw) {
  const text = normalizeChineseDateText(raw ?? "");
  const matches = [
    ...text.matchAll(/(公元前\s*)?(\d{3,4})\s*(?:年)?/g),
  ];
  const values = matches.map((match) => {
    const value = Number(match[2]);
    return match[1] || /公元前/.test(text) ? -value : value;
  });
  if (values.length >= 2 && /[—–－~～至到-]/.test(text)) {
    return {
      born: yearRange(values[0]),
      died: yearRange(values[1]),
      text: raw,
    };
  }
  if (values.length === 1) {
    return {
      born: yearRange(values[0]),
      died: null,
      text: raw,
    };
  }
  return { born: null, died: null, text: raw };
}

function makeTimeline(books) {
  const works = [];
  const peopleByName = new Map();

  for (const book of books) {
    const entities = sourceEntityMap(book);
    const worksInBook = book.entities.filter((entity) =>
      WORK_TYPES.has(entity.type),
    );
    for (const work of worksInBook) {
      const timeEdges = book.triples
        .filter(
          (triple) =>
            triple.subject === work.id &&
            CREATION_TIME_RELATIONS.has(triple.predicate),
        )
        .sort(
          (a, b) =>
            (a.sourcePage ?? 0) - (b.sourcePage ?? 0) ||
            a.id.localeCompare(b.id),
        );
      const values = timeEdges
        .map((triple) => ({
          triple,
          value: valueForTriple(triple, entities),
        }))
        .filter((item) => item.value);
      const selected =
        values.find((item) => parseYearText(item.value).year != null) ??
        values[0] ??
        null;
      const parsed = selected
        ? parseYearText(selected.value)
        : { year: null, range: null, text: null };
      works.push({
        id: work.id,
        name: work.name,
        year: parsed.year,
        yearRange: parsed.range,
        yearText: parsed.text,
        yearEvidence: selected
          ? {
              tripleId: selected.triple.id,
              relation: selected.triple.predicate,
            }
          : null,
        bookKey: book.bookKey,
        unit: getWorkUnits(work, book, entities)[0] ?? null,
      });

      const composerEdges = book.triples.filter(
        (triple) =>
          triple.subject === work.id &&
          COMPOSER_RELATIONS.has(triple.predicate) &&
          triple.objectId &&
          entities.get(triple.objectId)?.type === "人物",
      );
      for (const edge of composerEdges) {
        const composer = entities.get(edge.objectId);
        if (!peopleByName.has(composer.name)) {
          peopleByName.set(composer.name, {
            name: composer.name,
            sourceEntities: [],
            works: new Set(),
            lifetimeEntries: [],
            birthEntries: [],
            deathEntries: [],
          });
        }
        const person = peopleByName.get(composer.name);
        const sourceKey = book.bookKey + ":" + composer.id;
        if (!person.sourceEntities.some((source) => source.key === sourceKey)) {
          person.sourceEntities.push({
            key: sourceKey,
            id: composer.id,
            bookKey: book.bookKey,
          });
        }
        person.works.add(work.id);
      }
    }

    for (const person of peopleByName.values()) {
      const source = person.sourceEntities.find(
        (entry) => entry.bookKey === book.bookKey,
      );
      if (!source) continue;
      const entity = entities.get(source.id);
      if (!entity) continue;
      for (const triple of book.triples.filter(
        (item) => item.subject === entity.id,
      )) {
        const value = valueForTriple(triple, entities);
        if (!value) continue;
        if (triple.predicate === "生卒年") {
          person.lifetimeEntries.push({
            bookKey: book.bookKey,
            tripleId: triple.id,
            text: value,
            parsed: parseLifetime(value),
          });
        } else if (["出生年", "出生时间", "生年"].includes(triple.predicate)) {
          person.birthEntries.push({
            bookKey: book.bookKey,
            tripleId: triple.id,
            text: value,
            parsed: parseYearText(value),
          });
        } else if (
          ["卒年", "逝世年", "去世年", "去世时间"].includes(triple.predicate)
        ) {
          person.deathEntries.push({
            bookKey: book.bookKey,
            tripleId: triple.id,
            text: value,
            parsed: parseYearText(value),
          });
        }
      }
    }
  }

  const people = [...peopleByName.values()].map((person) => {
    const lifetimes = person.lifetimeEntries.filter(
      (entry) => entry.parsed.born || entry.parsed.died,
    );
    const firstLifetime = lifetimes[0]?.parsed;
    const birthEntry = person.birthEntries.find(
      (entry) => entry.parsed.year != null,
    );
    const deathEntry = person.deathEntries.find(
      (entry) => entry.parsed.year != null,
    );
    const born =
      firstLifetime?.born ??
      (birthEntry
        ? { year: birthEntry.parsed.year, range: birthEntry.parsed.range }
        : null);
    const died =
      firstLifetime?.died ??
      (deathEntry
        ? { year: deathEntry.parsed.year, range: deathEntry.parsed.range }
        : null);
    const rawLifetimeTexts = [
      ...person.lifetimeEntries.map((entry) => entry.text),
      ...person.birthEntries
        .filter((entry) => entry.parsed.year == null)
        .map((entry) => entry.text),
      ...person.deathEntries
        .filter((entry) => entry.parsed.year == null)
        .map((entry) => entry.text),
    ];
    const sourceEntities = person.sourceEntities
      .map(({ id, bookKey }) => ({ id, bookKey }))
      .sort(
        (a, b) =>
          a.bookKey.localeCompare(b.bookKey) || a.id.localeCompare(b.id),
      );
    return {
      id: sourceEntities[0]?.id ?? null,
      name: person.name,
      born: born?.year ?? null,
      bornRange: born?.range ?? null,
      died: died?.year ?? null,
      diedRange: died?.range ?? null,
      lifetimeText: [...new Set(rawLifetimeTexts)],
      sourceEntities,
      works: [...person.works].sort(),
    };
  });

  works.sort(
    (a, b) =>
      (a.year ?? Number.POSITIVE_INFINITY) -
        (b.year ?? Number.POSITIVE_INFINITY) ||
      a.bookKey.localeCompare(b.bookKey) ||
      a.name.localeCompare(b.name, "zh-CN"),
  );
  people.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  return { works, people };
}

async function buildGeoIfPossible() {
  const hasLandRaw = await exists(landRawPath);
  const hasWorldRaw = await exists(worldRawPath);
  if (!hasLandRaw && !hasWorldRaw && (await exists(atlasGeoPath))) {
    console.log("Atlas geometry: reusing public/data/atlas-geo.json");
    return {
      atlasGeo: await readJson(atlasGeoPath),
      admin0: null,
      writeGeo: false,
    };
  }
  if (!hasLandRaw || !hasWorldRaw) {
    throw new Error(
      "Natural Earth land and admin-0 source files must both exist at " +
        rawDir +
        " (or public/data/atlas-geo.json must already exist).",
    );
  }

  const [land, admin0] = await Promise.all([
    readJson(landRawPath),
    readJson(worldRawPath),
  ]);
  return { atlasGeo: buildAtlasGeo(land, admin0), admin0, writeGeo: true };
}

const { atlasGeo, admin0, writeGeo } = await buildGeoIfPossible();
const books = (
  await Promise.all(
    (await readdir(booksDir))
      .filter((name) => name.endsWith(".json"))
      .sort()
      .map((name) => readJson(path.join(booksDir, name))),
  )
).sort((a, b) => a.bookKey.localeCompare(b.bookKey));
if (books.length !== 6) {
  throw new Error("Expected six public/data/books/*.json files.");
}

await mkdir(dataDir, { recursive: true });
const atlas = makeAtlasData(books, atlasGeo, admin0);
const timeline = makeTimeline(books);
const usedForeignIds = new Set(
  atlas.regions
    .filter((region) => region.type === "country" && region.regionId !== "CHN")
    .map((region) => region.regionId),
);
const candidateMarkerIds = new Set(atlasGeo.world.markers.map((marker) => marker.id));
for (const id of usedForeignIds) {
  if (!candidateMarkerIds.has(id)) {
    throw new Error("Atlas country is missing a world label point: " + id);
  }
}
atlasGeo.world.markers = atlasGeo.world.markers.filter((marker) =>
  usedForeignIds.has(marker.id),
);
const atlasGeoText = JSON.stringify(atlasGeo) + "\n";
const atlasGeoBytes = Buffer.byteLength(atlasGeoText);
const atlasGeoGzipBytes = gzipSync(Buffer.from(atlasGeoText, "utf8")).byteLength;
if (
  atlasGeoBytes > MAX_GEO_BYTES ||
  atlasGeoGzipBytes > MAX_GEO_GZIP_BYTES
) {
  throw new Error(
    "atlas-geo.json exceeds its size limit: " +
      atlasGeoBytes +
      " bytes, gzip " +
      atlasGeoGzipBytes +
      " bytes.",
  );
}
const atlasText = JSON.stringify(atlas) + "\n";
const timelineText = JSON.stringify(timeline) + "\n";
const writes = [
  writeFile(path.join(dataDir, "atlas.json"), atlasText, "utf8"),
  writeFile(path.join(dataDir, "timeline.json"), timelineText, "utf8"),
];
if (writeGeo || atlasGeoText !== JSON.stringify(await readJson(atlasGeoPath)) + "\n") {
  writes.push(writeFile(atlasGeoPath, atlasGeoText, "utf8"));
}
await Promise.all(writes);

console.log(
  JSON.stringify(
    {
      atlasGeoBytes,
      atlasGeoGzipBytes,
      atlasBytes: Buffer.byteLength(atlasText),
      timelineBytes: Buffer.byteLength(timelineText),
      chinaTiles: atlasGeo.china.tiles.length,
      worldMarkers: atlasGeo.world.markers.length,
      works: atlas.summary,
      worksWithYear: timeline.works.filter((work) => work.year != null).length,
      peopleWithYears: timeline.people.filter(
        (person) => person.born != null || person.died != null,
      ).length,
      ethnicityMappings: ETHNICITY_TO_PROVINCES,
    },
    null,
    2,
  ),
);
