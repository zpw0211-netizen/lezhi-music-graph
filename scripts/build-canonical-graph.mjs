import { readFile, writeFile } from "node:fs/promises";

const sourceUrl = new URL("../public/data/music-graph.json", import.meta.url);
const graphUrl = new URL(
  "../public/data/canonical-graph.json",
  import.meta.url,
);
const qualityUrl = new URL(
  "../public/data/graph-quality.json",
  import.meta.url,
);
const dataset = JSON.parse(await readFile(sourceUrl, "utf8"));

const WORK_TYPES = new Set([
  "音乐作品",
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
const STRUCTURAL_TYPES = new Set(["教材", "单元", "课时", "章节"]);
const TYPE_CATEGORY = {
  教材: "textbook",
  单元: "textbook",
  课时: "textbook",
  章节: "textbook",
  人物: "person",
  创作主体: "person",
  创作群体: "person",
  署名主体: "person",
  机构: "person",
  乐器: "instrument",
  表演形式: "instrument",
  音乐体裁: "genre",
  戏曲行当: "genre",
  来源作品: "genre",
  速度术语: "element",
  调性: "element",
  节奏型: "element",
  主题与情感: "element",
  音乐概念: "theory",
  知识概念: "theory",
  拍号: "theory",
  地域: "culture",
  民族: "culture",
  历史事件: "culture",
  音乐风格: "culture",
  学习活动: "activity",
  学习目标: "goal",
  核心素养: "goal",
  教学重点: "goal",
  教学难点: "goal",
  课堂任务: "goal",
};

function categoryFor(type) {
  if (WORK_TYPES.has(type)) return "work";
  return TYPE_CATEGORY[type] ?? "theory";
}

function normalizeName(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .replace(
      /[《》〈〉【】\[\]（）()“”‘’'"·•—–_\-:：,，.。!?！？;；/\\\s]/g,
      "",
    )
    .trim();
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function canonicalKey(book, entity) {
  const category = categoryFor(entity.type);
  const normalizedName = normalizeName(entity.name || entity.id);
  if (STRUCTURAL_TYPES.has(entity.type)) {
    return `structure:${book.key}:${entity.type}:${normalizedName}`;
  }
  return `knowledge:${category}:${normalizedName}`;
}

function connectedComponents(nodeIds, relationships) {
  const adjacency = new Map([...nodeIds].map((id) => [id, new Set()]));
  for (const relationship of relationships) {
    if (!relationship.objectId) continue;
    if (
      !adjacency.has(relationship.subject) ||
      !adjacency.has(relationship.objectId)
    )
      continue;
    adjacency.get(relationship.subject).add(relationship.objectId);
    adjacency.get(relationship.objectId).add(relationship.subject);
  }
  const visited = new Set();
  const sizes = [];
  for (const id of adjacency.keys()) {
    if (visited.has(id)) continue;
    let size = 0;
    const queue = [id];
    visited.add(id);
    while (queue.length) {
      const current = queue.shift();
      size += 1;
      for (const neighbor of adjacency.get(current) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
    sizes.push(size);
  }
  sizes.sort((a, b) => b - a);
  return { count: sizes.length, largest: sizes[0] ?? 0, sizes };
}

const canonicalByKey = new Map();
const occurrenceByRawKey = new Map();
const occurrences = [];
const rawNodes = new Set();
const rawRelationships = [];
const danglingRelationships = [];
const rawDegree = new Map();

for (const book of dataset.books) {
  const entityById = new Map(
    book.entities.map((entity) => [entity.id, entity]),
  );
  const connectedEvidence = new Map();
  for (const triple of book.triples) {
    const sourceExists = entityById.has(triple.subject);
    const targetExists = !triple.objectId || entityById.has(triple.objectId);
    if (!sourceExists || !targetExists) {
      danglingRelationships.push({
        bookKey: book.key,
        tripleId: triple.id,
        missingSource: !sourceExists,
        missingTarget: !targetExists,
      });
    }
    const subjectKey = `${book.key}:${triple.subject}`;
    rawDegree.set(subjectKey, (rawDegree.get(subjectKey) ?? 0) + 1);
    if (triple.objectId) {
      const objectKey = `${book.key}:${triple.objectId}`;
      rawDegree.set(objectKey, (rawDegree.get(objectKey) ?? 0) + 1);
    }
    rawRelationships.push({
      subject: subjectKey,
      objectId: triple.objectId ? `${book.key}:${triple.objectId}` : null,
    });
    for (const entityId of [triple.subject, triple.objectId].filter(Boolean)) {
      const list = connectedEvidence.get(entityId) ?? [];
      for (const evidence of book.evidenceByTriple[triple.id] ?? []) {
        list.push({
          tripleId: triple.id,
          pdfPage: evidence.pdfPage ?? triple.sourcePage ?? null,
          textbookPage: evidence.textbookPage ?? null,
          summary: evidence.summary ?? null,
          region: evidence.region ?? null,
          confidence: evidence.confidence ?? triple.confidence ?? null,
        });
      }
      connectedEvidence.set(entityId, list);
    }
  }

  for (const entity of book.entities) {
    const rawKey = `${book.key}:${entity.id}`;
    rawNodes.add(rawKey);
    const key = canonicalKey(book, entity);
    let canonical = canonicalByKey.get(key);
    if (!canonical) {
      canonical = {
        id: `CAN_${stableHash(key)}`,
        canonicalKey: key,
        name: entity.name,
        type: entity.type,
        category: categoryFor(entity.type),
        aliases: new Set(),
        rawTypes: new Set(),
        descriptions: new Set(),
        bookKeys: new Set(),
        firstPageByBook: {},
        occurrenceIds: [],
        confidenceValues: [],
        media: [],
      };
      canonicalByKey.set(key, canonical);
    }
    for (const alias of entity.aliases ?? []) canonical.aliases.add(alias);
    for (const asset of entity.media ?? [])
      if (!canonical.media.some((item) => item.url === asset.url)) canonical.media.push(asset);
    canonical.rawTypes.add(entity.type);
    if (entity.description) canonical.descriptions.add(entity.description);
    canonical.bookKeys.add(book.key);
    if (
      entity.firstPage != null &&
      canonical.firstPageByBook[book.key] == null
    ) {
      canonical.firstPageByBook[book.key] = entity.firstPage;
    }
    if (entity.confidence != null)
      canonical.confidenceValues.push(entity.confidence);

    const evidence = (connectedEvidence.get(entity.id) ?? [])
      .filter(
        (item, index, all) =>
          all.findIndex(
            (other) =>
              other.tripleId === item.tripleId &&
              other.pdfPage === item.pdfPage &&
              other.summary === item.summary,
          ) === index,
      )
      .slice(0, 30);
    const occurrence = {
      id: `OCC_${book.key}_${stableHash(entity.id)}`,
      canonicalId: canonical.id,
      sourceEntityId: entity.id,
      sourceName: entity.name,
      textbook: book.key,
      textbookTitle: book.title,
      unit: null,
      lesson: null,
      page: entity.firstPage ?? evidence[0]?.pdfPage ?? null,
      sourceText: entity.description ?? evidence[0]?.summary ?? null,
      evidence,
      occurrenceRole: STRUCTURAL_TYPES.has(entity.type)
        ? "教材结构"
        : WORK_TYPES.has(entity.type)
          ? "作品学习"
          : "知识学习",
      entityType: entity.type,
    };
    occurrences.push(occurrence);
    canonical.occurrenceIds.push(occurrence.id);
    occurrenceByRawKey.set(rawKey, occurrence);
  }
}

// Infer the nearest unit from existing, evidence-backed textbook relationships.
for (const book of dataset.books) {
  const entityById = new Map(
    book.entities.map((entity) => [entity.id, entity]),
  );
  for (const triple of book.triples) {
    if (!triple.objectId) continue;
    const subject = entityById.get(triple.subject);
    const object = entityById.get(triple.objectId);
    if (!subject || !object) continue;
    if (subject.type === "单元") {
      const occurrence = occurrenceByRawKey.get(`${book.key}:${object.id}`);
      if (occurrence && !occurrence.unit) occurrence.unit = subject.name;
    }
    if (object.type === "单元") {
      const occurrence = occurrenceByRawKey.get(`${book.key}:${subject.id}`);
      if (occurrence && !occurrence.unit) occurrence.unit = object.name;
    }
  }
}

const relationshipByKey = new Map();
let collapsedSelfRelationships = 0;
for (const book of dataset.books) {
  for (const triple of book.triples) {
    const subjectOccurrence = occurrenceByRawKey.get(
      `${book.key}:${triple.subject}`,
    );
    const objectOccurrence = triple.objectId
      ? occurrenceByRawKey.get(`${book.key}:${triple.objectId}`)
      : null;
    if (!subjectOccurrence || (triple.objectId && !objectOccurrence)) continue;
    const subject = subjectOccurrence.canonicalId;
    const objectId = objectOccurrence?.canonicalId ?? null;
    if (objectId && subject === objectId) {
      collapsedSelfRelationships += 1;
      continue;
    }
    const literal = triple.literal ?? null;
    const relationKey = `${subject}|${triple.predicate}|${objectId ?? `literal:${normalizeName(literal)}`}`;
    let relation = relationshipByKey.get(relationKey);
    if (!relation) {
      relation = {
        id: `CREL_${stableHash(relationKey)}`,
        subject,
        predicate: triple.predicate,
        label:
          book.relations?.[triple.predicate] ??
          triple.predicate.replaceAll("_", " "),
        objectId,
        literal,
        objectKind: triple.objectKind ?? (objectId ? "实体" : "字面值"),
        sourcePage: triple.sourcePage ?? null,
        confidence: triple.confidence ?? 1,
        bookKeys: new Set(),
        sources: [],
      };
      relationshipByKey.set(relationKey, relation);
    }
    relation.bookKeys.add(book.key);
    relation.confidence = Math.min(relation.confidence, triple.confidence ?? 1);
    relation.sources.push({
      bookKey: book.key,
      bookTitle: book.title,
      tripleId: triple.id,
      sourceEntityId: triple.subject,
      targetEntityId: triple.objectId ?? null,
      pdfPage: triple.sourcePage ?? null,
      evidence: book.evidenceByTriple[triple.id] ?? [],
    });
  }
}

// Provenance edges are derived only from actual textbook occurrences.
for (const canonical of canonicalByKey.values()) {
  if (canonical.category === "textbook") continue;
  for (const bookKey of canonical.bookKeys) {
    const book = dataset.books.find((item) => item.key === bookKey);
    const textbookEntity = book.entities.find(
      (entity) => entity.type === "教材",
    );
    const textbookOccurrence = occurrenceByRawKey.get(
      `${book.key}:${textbookEntity.id}`,
    );
    const sourceOccurrences = canonical.occurrenceIds
      .map((id) => occurrences.find((occurrence) => occurrence.id === id))
      .filter((occurrence) => occurrence?.textbook === bookKey);
    const relationKey = `${textbookOccurrence.canonicalId}|TEXTBOOK_CONTAINS|${canonical.id}`;
    relationshipByKey.set(relationKey, {
      id: `PROV_${stableHash(relationKey)}`,
      subject: textbookOccurrence.canonicalId,
      predicate: "TEXTBOOK_CONTAINS",
      label: "教材收录",
      objectId: canonical.id,
      literal: null,
      objectKind: "实体",
      sourcePage: sourceOccurrences[0]?.page ?? null,
      confidence: 1,
      bookKeys: new Set([bookKey]),
      sources: sourceOccurrences.map((occurrence) => ({
        bookKey,
        bookTitle: book.title,
        occurrenceId: occurrence.id,
        sourceEntityId: occurrence.sourceEntityId,
        pdfPage: occurrence.page,
        evidence: occurrence.evidence,
      })),
      provenance: true,
    });
  }
}

const canonicalEntities = [...canonicalByKey.values()].map((entity) => ({
  id: entity.id,
  canonicalKey: entity.canonicalKey,
  name: entity.name,
  type: entity.type,
  category: entity.category,
  aliases: [...entity.aliases].sort((a, b) => a.localeCompare(b, "zh-CN")),
  rawTypes: [...entity.rawTypes].sort((a, b) => a.localeCompare(b, "zh-CN")),
  description: [...entity.descriptions][0] ?? null,
  descriptions: [...entity.descriptions].slice(0, 8),
  bookKeys: [...entity.bookKeys].sort(),
  textbookCount: entity.bookKeys.size,
  occurrenceCount: entity.occurrenceIds.length,
  occurrenceIds: entity.occurrenceIds,
  ...(entity.media.length ? { media: entity.media } : {}),
  firstPageByBook: entity.firstPageByBook,
  firstPage:
    Object.values(entity.firstPageByBook)
      .filter((value) => value != null)
      .sort((a, b) => a - b)[0] ?? null,
  confidence: entity.confidenceValues.length
    ? Math.min(...entity.confidenceValues)
    : 1,
  degree: 0,
  relationCount: 0,
}));
const canonicalEntityById = new Map(
  canonicalEntities.map((entity) => [entity.id, entity]),
);
const canonicalRelationships = [...relationshipByKey.values()].map(
  (relationship) => ({
    ...relationship,
    bookKeys: [...relationship.bookKeys].sort(),
    crossBook: relationship.bookKeys.size >= 2,
  }),
);
const textbookCanonicalByBook = new Map(
  occurrences
    .filter((occurrence) => occurrence.entityType === "教材")
    .map((occurrence) => [occurrence.textbook, occurrence.canonicalId]),
);
const unitCanonicalByBookAndName = new Map(
  occurrences
    .filter((occurrence) => occurrence.entityType === "单元")
    .map((occurrence) => [
      `${occurrence.textbook}:${normalizeName(occurrence.sourceName)}`,
      occurrence.canonicalId,
    ]),
);
const occurrenceRelationships = [];
for (const occurrence of occurrences) {
  occurrenceRelationships.push({
    id: `OCCREL_${stableHash(`${occurrence.id}|REFERS_TO|${occurrence.canonicalId}`)}`,
    subject: occurrence.id,
    predicate: "REFERS_TO",
    label: "指向规范知识",
    objectId: occurrence.canonicalId,
    source: {
      bookKey: occurrence.textbook,
      sourceEntityId: occurrence.sourceEntityId,
      pdfPage: occurrence.page,
      evidence: occurrence.evidence,
    },
  });
  if (occurrence.entityType === "教材") continue;
  const sourceId =
    (occurrence.unit
      ? unitCanonicalByBookAndName.get(
          `${occurrence.textbook}:${normalizeName(occurrence.unit)}`,
        )
      : null) ?? textbookCanonicalByBook.get(occurrence.textbook);
  if (!sourceId) continue;
  occurrenceRelationships.push({
    id: `OCCREL_${stableHash(`${sourceId}|HAS_OCCURRENCE|${occurrence.id}`)}`,
    subject: sourceId,
    predicate: "HAS_OCCURRENCE",
    label: occurrence.unit ? "单元包含出现记录" : "教材包含出现记录",
    objectId: occurrence.id,
    source: {
      bookKey: occurrence.textbook,
      sourceEntityId: occurrence.sourceEntityId,
      pdfPage: occurrence.page,
      evidence: occurrence.evidence,
    },
  });
}

for (const relationship of canonicalRelationships) {
  const subject = canonicalEntityById.get(relationship.subject);
  const object = relationship.objectId
    ? canonicalEntityById.get(relationship.objectId)
    : null;
  if (subject) {
    subject.degree += 1;
    subject.relationCount += 1;
  }
  if (object) {
    object.degree += 1;
    object.relationCount += 1;
  }
}

const rawIsolated = [...rawNodes].filter((id) => !rawDegree.has(id));
const rawComponents = connectedComponents(rawNodes, rawRelationships);
const canonicalNodes = new Set(canonicalEntities.map((entity) => entity.id));
const canonicalComponents = connectedComponents(
  canonicalNodes,
  canonicalRelationships,
);
const canonicalIsolated = canonicalEntities.filter(
  (entity) => entity.degree === 0,
);
const duplicateGroups = canonicalEntities.filter(
  (entity) => entity.occurrenceCount > 1 && entity.category !== "textbook",
);
const duplicateRecords = duplicateGroups.reduce(
  (total, entity) => total + entity.occurrenceCount - 1,
  0,
);

const quality = {
  version: "2.1",
  raw: {
    totalNodes: rawNodes.size,
    totalRelationships: dataset.books.reduce(
      (total, book) => total + book.triples.length,
      0,
    ),
    isolatedNodeCount: rawIsolated.length,
    isolatedNodes: rawIsolated,
    danglingRelationshipCount: danglingRelationships.length,
    danglingRelationships,
    duplicateEntityGroupCount: duplicateGroups.length,
    duplicateEntityRecordCount: duplicateRecords,
    connectedComponentCount: rawComponents.count,
    largestConnectedComponentNodeCount: rawComponents.largest,
  },
  canonical: {
    totalNodes: canonicalEntities.length,
    totalRelationships: canonicalRelationships.length,
    occurrenceCount: occurrences.length,
    occurrenceRelationshipCount: occurrenceRelationships.length,
    isolatedNodeCount: canonicalIsolated.length,
    isolatedNodes: canonicalIsolated.map((entity) => entity.id),
    danglingRelationshipCount: canonicalRelationships.filter(
      (relationship) =>
        !canonicalNodes.has(relationship.subject) ||
        (relationship.objectId && !canonicalNodes.has(relationship.objectId)),
    ).length,
    connectedComponentCount: canonicalComponents.count,
    largestConnectedComponentNodeCount: canonicalComponents.largest,
    collapsedSelfRelationshipCount: collapsedSelfRelationships,
    sharedEntityCount: canonicalEntities.filter(
      (entity) => entity.textbookCount >= 2,
    ).length,
  },
};

const canonicalGraph = {
  version: "2.1",
  books: dataset.books.map((book) => ({
    key: book.key,
    title: book.title,
    grade: book.grade,
    semester: book.semester,
  })),
  entities: canonicalEntities.sort((a, b) =>
    a.name.localeCompare(b.name, "zh-CN"),
  ),
  relationships: canonicalRelationships,
  occurrences,
  occurrenceRelationships,
  quality,
};

await writeFile(graphUrl, `${JSON.stringify(canonicalGraph)}\n`, "utf8");
await writeFile(qualityUrl, `${JSON.stringify(quality, null, 2)}\n`, "utf8");

console.log(
  `CANONICAL_GRAPH_BUILT raw=${quality.raw.totalNodes}/${quality.raw.totalRelationships} ` +
    `canonical=${quality.canonical.totalNodes}/${quality.canonical.totalRelationships} ` +
    `shared=${quality.canonical.sharedEntityCount} isolated=${quality.canonical.isolatedNodeCount} ` +
    `dangling=${quality.canonical.danglingRelationshipCount} components=${quality.canonical.connectedComponentCount}`,
);
