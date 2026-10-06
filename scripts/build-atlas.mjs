import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BOOK_BY_KEY, PUBLISHED_BOOK_KEYS } from "../data/books.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "public", "data");
const booksDir = path.join(dataDir, "books");
const evidenceDir = path.join(dataDir, "evidence");
const rawDir =
  process.env.ATLAS_RAW_DIR ?? "E:/Projects/.tmp/codex1/T012/raw";
const admin0RawPath = path.join(rawDir, "ne_110m_admin_0_countries.geojson");
const admin1RawPath = path.join(rawDir, "ne_10m_admin_1_states_provinces.geojson");
const atlasPointsDir = path.join(dataDir, "atlas");
const provincesPath = path.join(atlasPointsDir, "provinces.json");
const countriesPath = path.join(atlasPointsDir, "countries.json");

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

// Only ethnic groups represented by a type:"民族" entity in published books.
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

const GENRE_RELATIONS = new Set(["民歌体裁", "音乐体裁", "民歌类别"]);
const UNRELIABLE_GENRES = new Set(["不详", "未知", "无", "暂无"]);

function workGenre(work, book, entities) {
  return book.triples
    .filter((triple) => triple.subject === work.id && GENRE_RELATIONS.has(triple.predicate))
    .sort((a, b) => (a.sourcePage ?? 0) - (b.sourcePage ?? 0) || a.id.localeCompare(b.id))
    .map((triple) => valueForTriple(triple, entities)?.trim())
    .find((value) => value && !UNRELIABLE_GENRES.has(value)) ?? null;
}

const pageOffsetForBook = (book) => book.pdfOffset ?? BOOK_BY_KEY.get(book.bookKey)?.pdfOffset;

// 该作品**自己作主语**的全部三元组，逐条取出正式 evidence 里的教材页/PDF 页。
// 只用作品自身的三元组：别人「相关作品→本作品」的引用页不算本作品的页。
function ownTextbookPages(work, book, evidenceByTriple) {
  const found = [];
  for (const triple of book.triples) {
    if (triple.subject !== work.id) continue;
    for (const item of evidenceByTriple?.get(triple.id) ?? []) {
      const textbookPage = Number(item.textbookPage);
      if (!Number.isInteger(textbookPage) || item.pdfPage == null) continue;
      found.push({ textbookPage, pdfPage: item.pdfPage, tripleId: triple.id });
    }
  }
  return found;
}

// 页码：先认教材实体 media 标题里的「教材第N页」（正式数据直接标注）；
// media 没有时，退回该作品自身三元组在正式 evidence 里的教材页（取最小值，
// 且必须满足本册登记的 pdfOffset）；两者都拿不到就是 null。
// 绝不用 firstPage 推算：firstPage 是「该实体首次被提及的 PDF 页」（可能来自作曲家介绍页），
// 与「作品正文/谱例所在页」不是一回事。
function pageLabelsOf(work, book, evidenceByTriple) {
  const mediaPages = (work.media ?? [])
    .map((asset) => String(asset.title ?? "").match(/教材第(\d+)页/)?.[1])
    .filter(Boolean)
    .map(Number);
  const own = ownTextbookPages(work, book, evidenceByTriple);
  const pageOffset = pageOffsetForBook(book);
  const fromMedia = mediaPages.length ? Math.min(...mediaPages) : null;
  if (fromMedia != null) {
    const hit = own.find((item) => item.textbookPage === fromMedia);
    return { printedPage: fromMedia, printedPdfPage: hit ? hit.pdfPage : null, printedPageSource: "media" };
  }
  const aligned = [
    ...new Set(
      own
        .filter((item) => Number.isInteger(pageOffset) && item.pdfPage - item.textbookPage === pageOffset)
        .map((item) => item.textbookPage),
    ),
  ].sort((a, b) => a - b);
  if (!aligned.length) return { printedPage: null, printedPdfPage: null, printedPageSource: null };
  const printedPage = aligned[0];
  const hit = own.find((item) => item.textbookPage === printedPage);
  return { printedPage, printedPdfPage: hit ? hit.pdfPage : null, printedPageSource: "evidence" };
}

function makeWorkRecord(work, book, entities, evidenceByTriple) {
  const labels = pageLabelsOf(work, book, evidenceByTriple);
  return {
    id: work.id,
    name: work.name,
    type: work.type,
    genre: workGenre(work, book, entities),
    bookKey: book.bookKey,
    unit: getWorkUnits(work, book, entities)[0] ?? null,
    // page 保持向后兼容：仍是 firstPage（该实体首次被提及的 PDF 页），已有消费者不受影响。
    page: work.firstPage ?? null,
    // 可靠印刷页：来自正式 media 标题或正式 evidence 的教材页，无法确定则为 null。
    printedPage: labels.printedPage,
    // 该印刷页对应的 PDF 页（同一份正式 evidence 里的 pdfPage）；取不到就是 null。
    printedPdfPage: labels.printedPdfPage,
    // "media" / "evidence" / null：印刷页的来源，供审计与回报核对。
    printedPageSource: labels.printedPageSource,
  };
}

function makeCountryNameMap(countries, admin0) {
  const ids = new Map();
  for (const marker of countries) ids.set(normalizeName(marker.name), marker.id);
  for (const feature of admin0?.features ?? []) {
    const properties = feature.properties ?? {};
    const id = properties.ADM0_A3;
    if (!/^[A-Z0-9]{3}$/.test(id ?? "") || EXCLUDED_WORLD_MARKERS.has(id)) continue;
    for (const name of [properties.ADMIN, properties.NAME, properties.NAME_LONG, properties.NAME_ZH, properties.NAME_ZHT, properties.NAME_EN]) {
      if (name) ids.set(normalizeName(name), id);
    }
  }
  for (const [name, id] of Object.entries(COUNTRY_ALIASES)) ids.set(normalizeName(name), id);
  return ids;
}

function makeChinaNameMap(provinces) {
  const ids = new Map();
  for (const province of provinces) ids.set(normalizeName(province.name), province.id);
  for (const [name, id] of Object.entries(CHINA_ALIASES)) ids.set(normalizeName(name), id);
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

function makeAtlasData(books, provinces, countries, admin0, evidenceByBookKey) {
  const chinaNameToId = makeChinaNameMap(provinces);
  const countryNameToId = makeCountryNameMap(countries, admin0);
  const regionNamesById = new Map([
    ...provinces.map((province) => [province.id, province.name]),
    ...countries.map((country) => [country.id, country.name]),
  ]);
  const assignmentsByRegion = new Map();
  const unassignedWorks = [];
  const assignedKeys = new Set();
  let totalWorks = 0;
  let worksWithGenre = 0;

  for (const book of books) {
    const entities = sourceEntityMap(book);
    for (const work of book.entities.filter((entity) => WORK_TYPES.has(entity.type))) {
      totalWorks += 1;
      const record = makeWorkRecord(work, book, entities, evidenceByBookKey?.get(book.bookKey));
      if (record.genre) worksWithGenre += 1;
      const result = getAssignmentsForWork({ work, book, entities, chinaNameToId, countryNameToId, regionNamesById });
      if (!result.assignments.size) {
        unassignedWorks.push({ ...record, region: null, evidence: result.unresolved });
        continue;
      }
      assignedKeys.add(book.bookKey + ":" + work.id);
      for (const [regionId, evidence] of result.assignments) {
        if (!assignmentsByRegion.has(regionId)) assignmentsByRegion.set(regionId, []);
        const uniqueEvidence = [...new Map(evidence.map((entry) => [JSON.stringify(entry), entry])).values()];
        assignmentsByRegion.get(regionId).push({ ...record, evidence: uniqueEvidence });
      }
    }
  }

  const regions = [...assignmentsByRegion.entries()]
    .map(([regionId, works]) => ({
      regionId,
      name: regionNamesById.get(regionId),
      type: regionId.startsWith("CN-") ? "china" : "country",
      works: works.sort((a, b) => a.bookKey.localeCompare(b.bookKey) || (a.page ?? 0) - (b.page ?? 0) || a.name.localeCompare(b.name, "zh-CN")),
    }))
    .sort((a, b) => a.regionId.localeCompare(b.regionId));

  return {
    regions,
    unassignedWorks: unassignedWorks.sort((a, b) => a.bookKey.localeCompare(b.bookKey) || (a.page ?? 0) - (b.page ?? 0) || a.name.localeCompare(b.name, "zh-CN")),
    summary: {
      totalWorks,
      worksWithGenre,
      assignedWorks: assignedKeys.size,
      domesticWorks: new Set(regions.filter((region) => region.type === "china").flatMap((region) => region.works.map((work) => work.bookKey + ":" + work.id))).size,
      foreignWorks: new Set(regions.filter((region) => region.type === "country" && region.regionId !== "CHN").flatMap((region) => region.works.map((work) => work.bookKey + ":" + work.id))).size,
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
    // 保留真实原文：birth/death 条目不管有没有解析出年份，原文都要进 lifetimeText，
    // 否则「出生年=1948年」这类只给出生、可解析的条目会被丢掉（年表里点不出原文）。
    // 但绝不拼造生卒年，也不把单独出生年写成完整生卒年——原文是什么就存什么。
    const lifetimeEvidence = [
      ...person.lifetimeEntries.map((entry) => ({
        bookKey: entry.bookKey,
        tripleId: entry.tripleId,
        kind: "lifetime",
        text: entry.text,
      })),
      ...person.birthEntries.map((entry) => ({
        bookKey: entry.bookKey,
        tripleId: entry.tripleId,
        kind: "birth",
        text: entry.text,
      })),
      ...person.deathEntries.map((entry) => ({
        bookKey: entry.bookKey,
        tripleId: entry.tripleId,
        kind: "death",
        text: entry.text,
      })),
    ].sort((a, b) => a.bookKey.localeCompare(b.bookKey) || a.tripleId.localeCompare(b.tripleId));
    const rawLifetimeTexts = lifetimeEvidence.map((entry) => entry.text);
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
      lifetimeEvidence,
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

function makeProvinces(admin1) {
  const provinces = new Map();
  for (const feature of admin1?.features ?? []) {
    const properties = feature.properties ?? {};
    const id = properties.iso_3166_2;
    if (properties.admin !== "China" || !CHINA_REGIONS[id]) continue;
    const lat = Number(properties.latitude);
    const lon = Number(properties.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    provinces.set(id, { id, name: CHINA_REGIONS[id], lat, lon });
  }
  for (const [id, lat, lon] of [
    ["CN-TW", 23.7, 121.0],
    ["CN-HK", 22.35, 114.15],
    ["CN-MO", 22.2, 113.55],
  ]) {
    provinces.set(id, { id, name: CHINA_REGIONS[id], lat, lon });
  }
  if (provinces.size !== 34) {
    throw new Error(
      "Expected 31 Natural Earth provinces plus Taiwan, Hong Kong, and Macao points; got " +
        provinces.size,
    );
  }
  return [...provinces.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function makeCountryPoints(admin0) {
  return (admin0?.features ?? [])
    .map((feature) => {
      const properties = feature.properties ?? {};
      const id = properties.ADM0_A3;
      const name = properties.NAME_ZH ?? properties.NAME_EN ?? properties.ADMIN;
      const lat = Number(properties.LABEL_Y);
      const lon = Number(properties.LABEL_X);
      if (
        !/^[A-Z0-9]{3}$/.test(id ?? "") ||
        EXCLUDED_WORLD_MARKERS.has(id) ||
        !name ||
        /中华民国|台湾|北塞浦路斯|索马里兰/u.test(name) ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon)
      ) {
        return null;
      }
      return { id, name, lat, lon };
    })
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function loadPointSources() {
  const [hasAdmin0, hasAdmin1] = await Promise.all([
    exists(admin0RawPath),
    exists(admin1RawPath),
  ]);
  const [admin0, admin1] = await Promise.all([
    hasAdmin0 ? readJson(admin0RawPath) : Promise.resolve(null),
    hasAdmin1 ? readJson(admin1RawPath) : Promise.resolve(null),
  ]);
  const [provinces, countries] = await Promise.all([
    hasAdmin1 ? Promise.resolve(makeProvinces(admin1)) : readJson(provincesPath),
    hasAdmin0 ? Promise.resolve(makeCountryPoints(admin0)) : readJson(countriesPath),
  ]);
  return { provinces, countries, admin0 };
}

const { provinces, countries: candidateCountries, admin0 } = await loadPointSources();
const books = (
  await Promise.all(
    (await readdir(booksDir))
      .filter((name) => name.endsWith(".json"))
      .sort()
      .map((name) => readJson(path.join(booksDir, name))),
  )
).sort((a, b) => a.bookKey.localeCompare(b.bookKey));
if (books.length !== PUBLISHED_BOOK_KEYS.length) throw new Error(`Expected ${PUBLISHED_BOOK_KEYS.length} public/data/books/*.json files for published books.`);

// 正式证据：evidenceByTriple[tripleId] → [{ textbookPage, pdfPage, ... }]。
// 只在 media 没有标注印刷页时用来补页码，来源仍是正式数据（不是推算）。
const evidenceByBookKey = new Map(
  (
    await Promise.all(
      books.map(async (book) => {
        const file = path.join(evidenceDir, `${book.bookKey}.json`);
        if (!(await exists(file))) return [book.bookKey, new Map()];
        const raw = await readJson(file);
        const byTriple = new Map(
          Object.entries(raw.evidenceByTriple ?? {}).map(([tripleId, items]) => [
            tripleId,
            Array.isArray(items) ? items : [items],
          ]),
        );
        return [book.bookKey, byTriple];
      }),
    )
  ).map(([bookKey, byTriple]) => [bookKey, byTriple]),
);

await mkdir(dataDir, { recursive: true });
await mkdir(atlasPointsDir, { recursive: true });
const atlas = makeAtlasData(books, provinces, candidateCountries, admin0, evidenceByBookKey);
const timeline = makeTimeline(books);
const usedForeignIds = new Set(
  atlas.regions.filter((region) => region.type === "country" && region.regionId !== "CHN").map((region) => region.regionId),
);
const countryById = new Map(candidateCountries.map((country) => [country.id, country]));
for (const id of usedForeignIds) {
  if (!countryById.has(id)) throw new Error("Atlas country is missing a label point: " + id);
}
const countries = candidateCountries.filter((country) => usedForeignIds.has(country.id));
const atlasText = JSON.stringify(atlas) + "\n";
const timelineText = JSON.stringify(timeline) + "\n";
const writes = [
  writeFile(path.join(dataDir, "atlas.json"), atlasText, "utf8"),
  writeFile(path.join(dataDir, "timeline.json"), timelineText, "utf8"),
  writeFile(provincesPath, JSON.stringify(provinces) + "\n", "utf8"),
  writeFile(countriesPath, JSON.stringify(countries) + "\n", "utf8"),
];
await Promise.all(writes);

console.log(JSON.stringify({
  atlasBytes: Buffer.byteLength(atlasText),
  timelineBytes: Buffer.byteLength(timelineText),
  provinces: provinces.length,
  countries: countries.length,
  works: atlas.summary,
  worksWithYear: timeline.works.filter((work) => work.year != null).length,
  peopleWithYears: timeline.people.filter((person) => person.born != null || person.died != null).length,
}, null, 2));
