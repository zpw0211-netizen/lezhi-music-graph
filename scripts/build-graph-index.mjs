import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "public", "data");
const detailsDir = path.join(dataDir, "details");
const evidenceDir = path.join(dataDir, "evidence");

const dataset = JSON.parse(
  await readFile(path.join(dataDir, "music-graph.json"), "utf8"),
);
const canonical = JSON.parse(
  await readFile(path.join(dataDir, "canonical-graph.json"), "utf8"),
);

await mkdir(detailsDir, { recursive: true });
await mkdir(evidenceDir, { recursive: true });

const compactEntity = (entity) => ({
  id: entity.id,
  name: entity.name,
  type: entity.type,
  ...(entity.aliases?.length ? { aliases: entity.aliases } : {}),
  ...(entity.description
    ? { description: String(entity.description).slice(0, 180) }
    : {}),
  ...(entity.firstPage != null ? { firstPage: entity.firstPage } : {}),
  ...(entity.confidence != null ? { confidence: entity.confidence } : {}),
  ...(entity.canonicalKey ? { canonicalKey: entity.canonicalKey } : {}),
  ...(entity.category ? { category: entity.category } : {}),
  ...(entity.bookKeys?.length ? { bookKeys: entity.bookKeys } : {}),
  ...(entity.textbookCount != null
    ? { textbookCount: entity.textbookCount }
    : {}),
  ...(entity.occurrenceCount != null
    ? { occurrenceCount: entity.occurrenceCount }
    : {}),
  ...(entity.firstPageByBook
    ? { firstPageByBook: entity.firstPageByBook }
    : {}),
  ...(entity.degree != null ? { degree: entity.degree } : {}),
  ...(entity.relationCount != null
    ? { relationCount: entity.relationCount }
    : {}),
  ...(entity.layout ? { layout: entity.layout } : {}),
});

const compactRelationship = (relationship) => ({
  id: relationship.id,
  subject: relationship.subject,
  predicate: relationship.predicate,
  ...(relationship.objectId != null
    ? { objectId: relationship.objectId }
    : {}),
  ...(relationship.literal != null ? { literal: relationship.literal } : {}),
  ...(relationship.objectKind
    ? { objectKind: relationship.objectKind }
    : {}),
  ...(relationship.sourcePage != null
    ? { sourcePage: relationship.sourcePage }
    : {}),
  ...(relationship.section ? { section: relationship.section } : {}),
  ...(relationship.confidence != null
    ? { confidence: relationship.confidence }
    : {}),
  ...(relationship.label ? { label: relationship.label } : {}),
  ...(relationship.bookKeys?.length
    ? { bookKeys: relationship.bookKeys }
    : {}),
  ...(relationship.crossBook ? { crossBook: true } : {}),
  ...(relationship.provenance ? { provenance: true } : {}),
});

const compactBooks = [];
for (const book of dataset.books) {
  const { entities, triples, evidenceByTriple, candidateTriples, ...metadata } =
    book;
  compactBooks.push({
    ...metadata,
    entities: entities.map(compactEntity),
    triples: triples.map(compactRelationship),
    evidenceByTriple: {},
  });
  await writeFile(
    path.join(detailsDir, `${book.key}.json`),
    `${JSON.stringify({
      bookKey: book.key,
      entities,
      candidateTriples: candidateTriples ?? [],
    })}\n`,
    "utf8",
  );
  const occurrences = canonical.occurrences.filter(
    (occurrence) => occurrence.textbook === book.key,
  );
  const relationshipEvidenceById = {};
  for (const relationship of canonical.relationships) {
    const sources = (relationship.sources ?? []).filter(
      (source) => source.bookKey === book.key,
    );
    if (sources.length) relationshipEvidenceById[relationship.id] = sources;
  }
  await writeFile(
    path.join(evidenceDir, `${book.key}.json`),
    `${JSON.stringify({
      bookKey: book.key,
      evidenceByTriple: evidenceByTriple ?? {},
      occurrences,
      relationshipEvidenceById,
    })}\n`,
    "utf8",
  );
}

const stableSeed = (value) => {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
};
const textbookPositions = {
  g7s1: { x: 460, y: 450 },
  g7s2: { x: 1200, y: 480 },
  g8s1: { x: 1940, y: 450 },
  g8s2: { x: 460, y: 1050 },
  g9s1: { x: 1200, y: 1020 },
  g9s2: { x: 1940, y: 1050 },
};
const layoutStarted = performance.now();
const center = { x: 1200, y: 750 };
const uniqueByBook = new Map();
for (const key of Object.keys(textbookPositions)) uniqueByBook.set(key, []);
const sharedEntities = [];
const textbookEntities = [];
for (const entity of canonical.entities) {
  if (entity.type === "教材") textbookEntities.push(entity);
  else if ((entity.textbookCount ?? 1) >= 2) sharedEntities.push(entity);
  else {
    const key = entity.bookKeys?.[0] ?? "g7s1";
    if (!uniqueByBook.has(key)) uniqueByBook.set(key, []);
    uniqueByBook.get(key).push(entity);
  }
}

const positioned = new Map();
for (const entity of textbookEntities) {
  const key = entity.bookKeys?.[0] ?? "g7s1";
  positioned.set(entity.id, textbookPositions[key] ?? center);
}

// 单册实体使用朝画布外侧展开的分层扇形，形成六个可辨认的教材簇。
for (const [key, values] of uniqueByBook) {
  const base = textbookPositions[key] ?? center;
  const outwardAngle = Math.atan2(base.y - center.y, base.x - center.x);
  const sorted = [...values].sort(
    (a, b) => stableSeed(a.canonicalKey ?? a.id) - stableSeed(b.canonicalKey ?? b.id),
  );
  let cursor = 0;
  let ring = 0;
  const arc = sorted.length > 450 ? 3.12 : sorted.length > 260 ? 2.7 : 2.28;
  while (cursor < sorted.length) {
    const radius = 58 + ring * 32;
    const capacity = Math.max(7, Math.floor((radius * arc) / 18));
    const count = Math.min(capacity, sorted.length - cursor);
    for (let slot = 0; slot < count; slot += 1) {
      const entity = sorted[cursor + slot];
      const ratio = count === 1 ? 0.5 : (slot + 0.5) / count;
      const angle = outwardAngle - arc / 2 + ratio * arc;
      const seed = stableSeed(entity.id);
      const jitter = ((seed % 9) - 4) * 0.8;
      positioned.set(entity.id, {
        x: base.x + Math.cos(angle) * (radius + jitter),
        y: base.y + Math.sin(angle) * (radius + jitter) * 0.9,
      });
    }
    cursor += count;
    ring += 1;
  }
}

// 共享规范实体以其来源教材质心为锚点，向全局中心收拢，成为教材簇之间的桥梁。
const sharedBuckets = new Map();
for (const entity of sharedEntities) {
  const signature = [...(entity.bookKeys ?? [])].sort().join("|");
  if (!sharedBuckets.has(signature)) sharedBuckets.set(signature, []);
  sharedBuckets.get(signature).push(entity);
}
for (const [signature, values] of sharedBuckets) {
  const keys = signature.split("|").filter(Boolean);
  const sources = keys.map((key) => textbookPositions[key]).filter(Boolean);
  const centroid = sources.length
    ? {
        x: sources.reduce((sum, point) => sum + point.x, 0) / sources.length,
        y: sources.reduce((sum, point) => sum + point.y, 0) / sources.length,
      }
    : center;
  const anchor = {
    x: center.x + (centroid.x - center.x) * 0.48,
    y: center.y + (centroid.y - center.y) * 0.48,
  };
  const sorted = [...values].sort(
    (a, b) =>
      (b.textbookCount ?? 1) - (a.textbookCount ?? 1) ||
      stableSeed(a.id) - stableSeed(b.id),
  );
  sorted.forEach((entity, index) => {
    const ring = Math.floor(Math.sqrt(index));
    const angle = (index * 2.399963229728653 + stableSeed(signature) / 1000) %
      (Math.PI * 2);
    const radius = index === 0 ? 0 : 24 + ring * 25;
    positioned.set(entity.id, {
      x: anchor.x + Math.cos(angle) * radius,
      y: anchor.y + Math.sin(angle) * radius * 0.88,
    });
  });
}

const nodeRadius = (entity) => {
  if (entity.type === "教材") return 46;
  if ((entity.textbookCount ?? 1) >= 4) return 18 + Math.min(32, entity.name.length * 1.6);
  if ((entity.textbookCount ?? 1) >= 2) return 15 + Math.min(24, entity.name.length * 1.15);
  return 11;
};

// 构建期空间网格碰撞修正：重点保护教材、跨册核心节点和可见标签的最小间距。
for (let iteration = 0; iteration < 44; iteration += 1) {
  const grid = new Map();
  const cellSize = 72;
  for (const entity of canonical.entities) {
    const point = positioned.get(entity.id) ?? center;
    const cellX = Math.floor(point.x / cellSize);
    const cellY = Math.floor(point.y / cellSize);
    const cellKey = `${cellX}:${cellY}`;
    if (!grid.has(cellKey)) grid.set(cellKey, []);
    grid.get(cellKey).push(entity);
  }
  for (const entity of canonical.entities) {
    const point = positioned.get(entity.id) ?? { ...center };
    const cellX = Math.floor(point.x / cellSize);
    const cellY = Math.floor(point.y / cellSize);
    for (let dx = -2; dx <= 2; dx += 1) {
      for (let dy = -2; dy <= 2; dy += 1) {
        for (const other of grid.get(`${cellX + dx}:${cellY + dy}`) ?? []) {
          if (other.id <= entity.id) continue;
          const otherPoint = positioned.get(other.id) ?? center;
          let vx = point.x - otherPoint.x;
          let vy = point.y - otherPoint.y;
          let distance = Math.hypot(vx, vy);
          const minimum = nodeRadius(entity) + nodeRadius(other) + 5;
          if (distance >= minimum) continue;
          if (distance < 0.01) {
            const angle = (stableSeed(`${entity.id}:${other.id}`) % 6283) / 1000;
            vx = Math.cos(angle);
            vy = Math.sin(angle);
            distance = 1;
          }
          const overlap = minimum - distance;
          if (entity.type === "教材") {
            otherPoint.x -= (vx / distance) * overlap * 0.94;
            otherPoint.y -= (vy / distance) * overlap * 0.94;
          } else if (other.type === "教材") {
            point.x += (vx / distance) * overlap * 0.94;
            point.y += (vy / distance) * overlap * 0.94;
          } else {
            point.x += (vx / distance) * overlap * 0.51;
            point.y += (vy / distance) * overlap * 0.51;
            otherPoint.x -= (vx / distance) * overlap * 0.51;
            otherPoint.y -= (vy / distance) * overlap * 0.51;
          }
          if (other.type !== "教材") {
            otherPoint.x = Math.max(28, Math.min(2372, otherPoint.x));
            otherPoint.y = Math.max(28, Math.min(1472, otherPoint.y));
            positioned.set(other.id, otherPoint);
          }
        }
      }
    }
    if (entity.type !== "教材") {
      point.x = Math.max(28, Math.min(2372, point.x));
      point.y = Math.max(28, Math.min(1472, point.y));
      positioned.set(entity.id, point);
    }
  }
}

const canonicalEntitiesWithLayout = canonical.entities.map((entity) => ({
  ...entity,
  layout: positioned.get(entity.id) ?? center,
}));
const layoutBuildMs = performance.now() - layoutStarted;

const evidenceCoveredRelationshipCount = canonical.relationships.filter(
  (relationship) =>
    (relationship.sources ?? []).some(
      (source) =>
        source.pdfPage != null ||
        (source.evidence ?? []).some(
          (evidence) => evidence.pdfPage != null || evidence.summary,
        ),
    ),
).length;
const quality = {
  ...canonical.quality,
  canonical: {
    ...canonical.quality.canonical,
    evidenceCoveredRelationshipCount,
    evidenceCoverageRate: canonical.relationships.length
      ? evidenceCoveredRelationshipCount / canonical.relationships.length
      : 0,
  },
};

const graphIndex = {
  version: "2.2-performance-index",
  generatedAt: new Date().toISOString(),
  dataset: { books: compactBooks },
  canonicalGraph: {
    version: canonical.version,
    books: canonical.books,
    entities: canonicalEntitiesWithLayout.map(compactEntity),
    relationships: canonical.relationships.map(compactRelationship),
    // Occurrence evidence is book-split and loaded only when the inspector asks
    // for it. The entity-level bookKeys/firstPageByBook fields are sufficient
    // for the Full Graph overview.
    occurrences: [],
    occurrenceRelationships: [],
    quality,
    performance: { layoutBuildMs },
  },
};

const indexText = `${JSON.stringify(graphIndex)}\n`;
await writeFile(path.join(dataDir, "graph-index.json"), indexText, "utf8");

console.log(
  JSON.stringify(
    {
      graphIndexBytes: Buffer.byteLength(indexText),
      legacyInitialBytes:
        Buffer.byteLength(JSON.stringify(dataset)) +
        Buffer.byteLength(JSON.stringify(canonical)),
      books: compactBooks.length,
      canonicalNodes: graphIndex.canonicalGraph.entities.length,
      canonicalRelationships: graphIndex.canonicalGraph.relationships.length,
    },
    null,
    2,
  ),
);
