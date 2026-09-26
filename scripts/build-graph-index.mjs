import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildBookLayout, buildFullGraphLayouts } from "./lib/full-graph-layout.mjs";

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
  ...(entity.visualImportance != null
    ? { visualImportance: round(entity.visualImportance, 4) }
    : {}),
  ...(entity.visualRank != null ? { visualRank: entity.visualRank } : {}),
  ...(entity.layout ? { layout: roundPoint(entity.layout) } : {}),
  ...(entity.community ? { community: entity.community } : {}),
  ...(entity.media?.length ? { media: entity.media } : {}),
  ...(entity.layouts
    ? { layouts: Object.fromEntries(Object.entries(entity.layouts).map(([key, point]) => [key, roundPoint(point)])) }
    : {}),
});

// Two decimals keep positions exact to the rendered pixel and the index small.
function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
function roundPoint(point) {
  return { ...point, x: round(point.x), y: round(point.y) };
}

// Extension knowledge (拓展知识) is kept but marked so the UI can label it.
const isExtension = (relationship) => {
  if (relationship.section) return relationship.section === "拓展知识";
  const evidence = (relationship.sources ?? []).flatMap((source) => source.evidence ?? []);
  return evidence.length > 0 && evidence.every((item) => /拓展/.test(item.region ?? ""));
};

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
  ...(isExtension(relationship) ? { extended: true } : {}),
  ...(relationship.provenance ? { provenance: true } : {}),
});

const compactBooks = [];
for (const book of dataset.books) {
  const { entities, triples, evidenceByTriple, candidateTriples, ...metadata } =
    book;
  compactBooks.push({
    ...metadata,
    entities: buildBookLayout(entities, triples).map(compactEntity),
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

const {
  entities: canonicalEntitiesWithLayout,
  performance: layoutPerformance,
} = buildFullGraphLayouts(canonical.entities, canonical.relationships);

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
// Source composition per textbook (教材明示 / 乐谱可见 / 教材归纳 / 拓展知识).
const LAYER_NAMES = ["教材明示", "乐谱可见", "教材归纳", "拓展知识"];
const sourceLayers = dataset.books.map((book) => {
  const counts = Object.fromEntries([...LAYER_NAMES, "其他"].map((name) => [name, 0]));
  for (const triple of book.triples) {
    const region = (book.evidenceByTriple?.[triple.id] ?? [])[0]?.region ?? "";
    counts[LAYER_NAMES.find((name) => region.startsWith(name)) ?? "其他"] += 1;
  }
  return { bookKey: book.key, title: book.title, reread: book.source === "逐页重读", ...counts };
});

const quality = {
  ...canonical.quality,
  sourceLayers,
  canonical: {
    ...canonical.quality.canonical,
    evidenceCoveredRelationshipCount,
    evidenceCoverageRate: canonical.relationships.length
      ? evidenceCoveredRelationshipCount / canonical.relationships.length
      : 0,
  },
};

const graphIndex = {
  version: "2.3-force-directed-index",
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
    performance: layoutPerformance,
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
