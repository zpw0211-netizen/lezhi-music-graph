import { readFile, writeFile } from "node:fs/promises";

const dataUrl = new URL("../public/data/music-graph.json", import.meta.url);
const dataset = JSON.parse(await readFile(dataUrl, "utf8"));

const WORK_TYPES = new Set(["音乐作品", "歌曲", "民歌", "器乐曲", "戏曲歌曲", "戏曲选段", "舞蹈音乐", "影视音乐", "交响作品", "合唱作品", "歌剧音乐", "进行曲", "朗诵作品"]);
const RESOURCE_TYPES = new Set(["乐谱资源", "音频资源", "视频资源", "图文资源", "多模态资源", "资源类型", "资源状态", "资源提供方", "教学用途"]);
const VALUE_TYPES = new Set(["文本", "整数", "状态值", "属性值", "教材栏目"]);
const RESOURCE_RELATIONS = new Set(["预留乐谱资源", "预留音频资源", "预留视频资源", "预留图文资源", "资源类型", "挂载状态", "版权状态", "提供方", "教学用途", "服务于"]);

const TYPE_MAP = {
  "国家/地区": "地域",
  "国家或地区": "地域",
  "音乐概念类别": "音乐概念",
  "体裁": "音乐体裁",
  "主题": "主题与情感",
  "主题/形象": "主题与情感",
  "主题情感": "主题与情感",
  "单元主题": "主题与情感",
  "演奏形式": "表演形式",
  "演唱形式": "表演形式",
  "教学分析维度": "音乐概念",
};

const RELATION_MAP = {
  "教学分析维度": "分析维度",
  "适合学习": "适合开展",
  "设置学习活动": "适合开展",
  "关联活动": "适合开展",
  "适合活动": "适合开展",
  "演唱要求": "演唱演奏要求",
  "表演要求": "演唱演奏要求",
  "速度术语": "速度特点",
  "起始速度": "速度特点",
  "开头速度": "速度特点",
  "C段速度": "速度特点",
  "节奏特征": "节奏特点",
  "常用拍号": "节拍特点",
  "使用拍号": "节拍特点",
  "音乐情绪": "表现情感",
  "表现情绪": "表现情感",
  "演唱情绪": "表现情感",
  "演奏情绪": "表现情感",
  "情感特点": "表现情感",
  "开头情绪": "表现情感",
  "结尾情绪": "表现情感",
  "C段情绪": "表现情感",
  "采用结构": "曲式结构",
  "常见结构": "曲式结构",
  "采用曲式": "曲式结构",
  "结构特点": "曲式结构",
  "主要乐器": "使用乐器",
  "开头乐器": "使用乐器",
  "演唱形式": "表演形式",
  "歌曲类型": "音乐体裁",
  "所属类型": "音乐体裁",
  "体裁说明": "音乐体裁",
  "国籍": "所属国家或地区",
  "发源地": "来源于",
  "体裁来源": "来源于",
  "文化来源": "来源于",
  "素材来源": "来源于",
  "源自": "来源于",
  "原著来源": "改编自",
  "歌词描写": "描绘内容",
  "表现内容": "描绘内容",
  "描绘": "描绘内容",
  "表现形象": "塑造形象",
  "表现人物": "塑造形象",
  "表现品质": "表现主题",
  "表现精神": "表现主题",
  "寓意": "表现主题",
  "创作时间": "创作年代",
  "时代": "创作年代",
  "帮助辨认": "帮助辨识",
  "用于辨别": "帮助辨识",
  "可用于学习": "学习用途",
  "可用于讨论": "学习用途",
  "帮助理解": "学习用途",
};

const DIMENSION_PREFS = {
  "民歌": ["文化背景", "旋律", "节奏"],
  "器乐曲": ["音色", "曲式", "音乐形象"],
  "戏曲歌曲": ["文化背景", "旋律", "音乐形象"],
  "戏曲选段": ["文化背景", "音乐形象", "旋律"],
  "舞蹈音乐": ["节奏", "速度", "曲式"],
  "影视音乐": ["音乐形象", "旋律", "文化背景"],
  "交响作品": ["曲式", "音色", "音乐形象"],
  "合唱作品": ["音色", "旋律", "力度"],
  "歌剧音乐": ["音乐形象", "旋律", "文化背景"],
  "进行曲": ["节奏", "速度", "力度"],
  "朗诵作品": ["音乐形象", "文化背景", "节奏"],
  "歌曲": ["旋律", "节奏", "音乐形象"],
  "音乐作品": ["旋律", "节奏", "音乐形象"],
};

function relationLabel(book, triple) {
  return book.relations?.[triple.predicate] ?? triple.predicate;
}

function classifyWork(entity, book, entityMap) {
  const signals = [entity.name, entity.description ?? ""];
  let hasLyrics = false;
  for (const triple of book.triples) {
    if (triple.subject !== entity.id) continue;
    const predicate = relationLabel(book, triple);
    const object = triple.objectId ? entityMap.get(triple.objectId) : null;
    if (["作词", "编词", "译配", "歌词改编"].includes(predicate)) hasLyrics = true;
    if (/体裁|类型|属于|表演形式|演唱形式|学习方式|选自|来源/.test(predicate) || ["音乐体裁", "体裁", "来源作品"].includes(object?.type)) {
      signals.push(object?.name ?? triple.literal ?? "");
    }
  }
  const text = signals.join(" ");
  if (/配乐诗朗诵|诗朗诵/.test(text)) return "朗诵作品";
  if (/戏歌/.test(text)) return "戏曲歌曲";
  if (/京剧|昆曲|豫剧|评剧|越剧|黄梅戏|秦腔|戏曲|戏唱段|京韵大鼓|曲艺/.test(text)) return "戏曲选段";
  if (/电影|电视剧|纪录片|影视/.test(text)) return "影视音乐";
  if (/合唱|齐唱|重唱|领唱与合唱|领唱、合唱/.test(text)) return "合唱作品";
  if (/民歌|山歌|小调|号子|船歌|牧歌|民间歌曲/.test(text)) return "民歌";
  if (/舞剧|舞蹈|圆舞曲|波尔卡|歌舞曲|舞曲/.test(text)) return "舞蹈音乐";
  if (/交响|协奏曲|管弦乐|交响诗|交响组曲|序曲/.test(text)) return "交响作品";
  if (/器乐|民间乐曲|独奏|重奏|室内乐|古琴曲|二胡曲|笛子曲|唢呐曲|古筝曲|琵琶曲|鼓乐|吹歌|广东音乐|古曲/.test(text)) return "器乐曲";
  if (/歌剧|音乐剧|组歌选曲/.test(text)) return "歌剧音乐";
  if (/进行曲|军歌|军旅歌曲/.test(text)) return "进行曲";
  if (/演奏/.test(text) || /前奏曲|赋格/.test(entity.name)) return "器乐曲";
  if (hasLyrics || /演唱|选听选唱/.test(text)) return "歌曲";
  if (/艺术歌曲|颂歌|歌曲|主题歌|插曲/.test(text)) return "歌曲";
  return "音乐作品";
}

function teachingRank(book, triple, entityMap, workType) {
  const objectName = triple.objectId ? entityMap.get(triple.objectId)?.name ?? "" : triple.literal ?? "";
  const prefs = DIMENSION_PREFS[workType] ?? DIMENSION_PREFS["音乐作品"];
  const index = prefs.indexOf(objectName);
  return index < 0 ? 99 : index;
}

for (const book of dataset.books) {
  const originalEntityMap = new Map(book.entities.map((entity) => [entity.id, entity]));
  const resourceIds = new Set(book.entities.filter((entity) => RESOURCE_TYPES.has(entity.type)).map((entity) => entity.id));
  const valueIds = new Set(book.entities.filter((entity) => VALUE_TYPES.has(entity.type)).map((entity) => entity.id));
  const workTypes = new Map();

  for (const entity of book.entities) {
    if (WORK_TYPES.has(entity.type)) workTypes.set(entity.id, classifyWork(entity, book, originalEntityMap));
  }
  for (const [entityId, type] of workTypes) {
    if (type !== "音乐作品") continue;
    const sourceTriple = book.triples.find((triple) => triple.objectId === entityId && ["选自", "改编自", "原著来源"].includes(relationLabel(book, triple)));
    const sourceType = sourceTriple ? workTypes.get(sourceTriple.subject) : null;
    if (sourceType && sourceType !== "音乐作品") workTypes.set(entityId, sourceType);
  }

  const resourceSlots = [...(book.resourceSlots ?? [])];
  for (const triple of book.triples) {
    const predicate = relationLabel(book, triple);
    if (!RESOURCE_RELATIONS.has(predicate) || !WORK_TYPES.has(originalEntityMap.get(triple.subject)?.type)) continue;
    const resource = triple.objectId ? originalEntityMap.get(triple.objectId) : null;
    if (resource) resourceSlots.push({ workId: triple.subject, kind: resource.type.replace("资源", ""), title: resource.name, url: null, status: "待挂载" });
  }

  const entities = book.entities
    .filter((entity) => !resourceIds.has(entity.id) && !valueIds.has(entity.id))
    .map((entity) => ({
      ...entity,
      type: workTypes.get(entity.id) ?? TYPE_MAP[entity.type] ?? entity.type,
    }));
  const entityMap = new Map(entities.map((entity) => [entity.id, entity]));

  const ordinary = [];
  const dimensions = new Map();
  const activities = new Map();
  for (const triple of book.triples) {
    const rawPredicate = relationLabel(book, triple);
    if (RESOURCE_RELATIONS.has(rawPredicate) || resourceIds.has(triple.subject) || (triple.objectId && resourceIds.has(triple.objectId))) continue;
    if (!entityMap.has(triple.subject)) continue;

    let predicate = RELATION_MAP[rawPredicate] ?? rawPredicate;
    const subject = entityMap.get(triple.subject);
    const originalObject = triple.objectId ? originalEntityMap.get(triple.objectId) : null;
    if (rawPredicate === "属于" && WORK_TYPES.has(originalEntityMap.get(triple.subject)?.type)) predicate = "音乐体裁";
    if (predicate === "音乐体裁" && subject && !WORK_TYPES.has(subject.type) && subject.type !== "音乐作品") predicate = "归属类别";

    const normalized = { ...triple, predicate };
    if (triple.objectId && valueIds.has(triple.objectId)) {
      normalized.objectId = null;
      normalized.literal = originalObject?.name ?? triple.literal ?? "";
      normalized.objectKind = "字面值";
    } else if (triple.objectId && !entityMap.has(triple.objectId)) {
      continue;
    }

    if (predicate === "分析维度") {
      const rows = dimensions.get(triple.subject) ?? [];
      rows.push(normalized);
      dimensions.set(triple.subject, rows);
    } else if (predicate === "适合开展") {
      const rows = activities.get(triple.subject) ?? [];
      rows.push(normalized);
      activities.set(triple.subject, rows);
    } else {
      ordinary.push(normalized);
    }
  }

  for (const [subjectId, rows] of dimensions) {
    const workType = entityMap.get(subjectId)?.type ?? "音乐作品";
    rows.sort((a, b) => teachingRank(book, a, entityMap, workType) - teachingRank(book, b, entityMap, workType));
    ordinary.push(...rows.slice(0, 3));
  }
  for (const rows of activities.values()) ordinary.push(...rows.slice(0, 2));

  const triples = [];
  const evidenceByTriple = {};
  const dedupe = new Map();
  for (const triple of ordinary) {
    const key = `${triple.subject}|${triple.predicate}|${triple.objectId ?? triple.literal ?? ""}`;
    const existing = dedupe.get(key);
    if (existing) {
      evidenceByTriple[existing.id] = [...(evidenceByTriple[existing.id] ?? []), ...(book.evidenceByTriple?.[triple.id] ?? [])];
      continue;
    }
    dedupe.set(key, triple);
    triples.push(triple);
    evidenceByTriple[triple.id] = book.evidenceByTriple?.[triple.id] ?? [{ tripleId: triple.id, pdfPage: triple.sourcePage ?? null, summary: "教材知识图谱关系", region: triple.section ?? "教材" , confidence: triple.confidence ?? 0.9 }];
  }

  const relations = Object.fromEntries([...new Set(triples.map((triple) => triple.predicate))].sort((a, b) => a.localeCompare(b, "zh-CN")).map((relation) => [relation, relation]));
  book.entities = entities;
  book.triples = triples;
  book.evidenceByTriple = evidenceByTriple;
  book.relations = relations;
  book.entityCount = entities.length;
  book.tripleCount = triples.length;
  book.publishedCount = triples.length;
  book.evidenceCount = triples.length;
  book.workCount = entities.filter((entity) => WORK_TYPES.has(entity.type)).length;
  book.resourceSlots = resourceSlots;
  book.resourceSlotCount = resourceSlots.length;
}

dataset.version = "2026-08-28-semantic-taxonomy-v2";
dataset.generatedAt = new Date().toISOString();
dataset.taxonomy = {
  entityLayers: ["教材结构", "音乐作品", "人物与地域", "音乐知识", "教学活动"],
  workTypes: [...WORK_TYPES].filter((type) => type !== "音乐作品"),
  resourcePolicy: "音频、视频、乐谱和图文作为作品附件管理，不计入知识实体分布和主关系网络。",
  relationPolicy: "合并同义关系，资源管理关系退出主图谱，重复教学模板按作品限量保留。",
};

await writeFile(dataUrl, JSON.stringify(dataset), "utf8");
console.log(JSON.stringify({
  version: dataset.version,
  books: dataset.books.map((book) => ({ key: book.key, entities: book.entityCount, triples: book.tripleCount, works: book.workCount, resourceSlots: book.resourceSlotCount })),
}, null, 2));
