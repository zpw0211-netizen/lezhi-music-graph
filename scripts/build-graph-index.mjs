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
  g7s1: { x: 360, y: 260 },
  g7s2: { x: 1200, y: 170 },
  g8s1: { x: 2040, y: 260 },
  g8s2: { x: 360, y: 1240 },
  g9s1: { x: 1200, y: 1330 },
  g9s2: { x: 2040, y: 1240 },
};
const layoutStarted = performance.now();
const canonicalEntitiesWithLayout = canonical.entities.map((entity) => {
  const textbookKey = entity.bookKeys?.[0] ?? "g7s1";
  const seed = stableSeed(entity.canonicalKey ?? entity.id);
  let x = 1200;
  let y = 750;
  if (entity.type === "教材") {
    ({ x, y } = textbookPositions[textbookKey] ?? { x: 1200, y: 750 });
  } else if ((entity.textbookCount ?? 1) >= 2) {
    const angle = ((seed % 100000) / 100000) * Math.PI * 2;
    const radius = 90 + ((Math.floor(seed / 97) % 1000) / 1000) * 370;
    x = 1200 + Math.cos(angle) * radius;
    y = 750 + Math.sin(angle) * radius * 0.72;
  } else {
    const base = textbookPositions[textbookKey] ?? { x: 1200, y: 750 };
    const angle = ((seed % 100000) / 100000) * Math.PI * 2;
    const radius = 90 + ((Math.floor(seed / 113) % 1000) / 1000) * 300;
    x = base.x + Math.cos(angle) * radius;
    y = base.y + Math.sin(angle) * radius * 0.62;
  }
  return { ...entity, layout: { x, y } };
});
const layoutBuildMs = performance.now() - layoutStarted;

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
    quality: canonical.quality,
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
