import { MultiUndirectedGraph } from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import noverlap from "graphology-layout-noverlap";

const WIDTH = 2400;
const HEIGHT = 1500;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const TEXTBOOK_POSITIONS = {
  g7s1: { x: 460, y: 450 },
  g7s2: { x: 1200, y: 480 },
  g8s1: { x: 1940, y: 450 },
  g8s2: { x: 460, y: 1050 },
  g9s1: { x: 1200, y: 1020 },
  g9s2: { x: 1940, y: 1050 },
};

const SCHEMA_ANCHORS = {
  work: { x: 1200, y: 260 },
  person: { x: 1700, y: 350 },
  instrument: { x: 2050, y: 680 },
  genre: { x: 1940, y: 1080 },
  theory: { x: 1440, y: 1210 },
  element: { x: 920, y: 1210 },
  culture: { x: 440, y: 1030 },
  activity: { x: 350, y: 650 },
  goal: { x: 650, y: 330 },
  textbook: { x: 1200, y: 750 },
};

export const stableSeed = (value) => {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
};

const knowledgeRelationship = (relationship, entityMap) => {
  if (!relationship.objectId || relationship.provenance) return false;
  const source = entityMap.get(relationship.subject);
  const target = entityMap.get(relationship.objectId);
  return Boolean(source && target && source.type !== "教材" && target.type !== "教材");
};

const importanceScore = (entity, structuralDegree) =>
  Math.log1p(structuralDegree) * 0.48 +
  ((entity.textbookCount ?? 1) / 6) * 1.7 +
  Math.log1p(entity.occurrenceCount ?? 1) * 0.34 +
  Math.log1p(entity.relationCount ?? structuralDegree) * 0.3;

const normalizeImportance = (entities, structuralDegree) => {
  const scored = entities.map((entity) => ({
    id: entity.id,
    score: importanceScore(entity, structuralDegree.get(entity.id) ?? 0),
  }));
  const min = Math.min(...scored.map((item) => item.score));
  const max = Math.max(...scored.map((item) => item.score));
  const span = Math.max(0.0001, max - min);
  const rankById = new Map(
    [...scored]
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .map((item, index) => [item.id, index + 1]),
  );
  return new Map(
    scored.map((item) => [
      item.id,
      {
        value: Math.max(0, Math.min(1, (item.score - min) / span)),
        rank: rankById.get(item.id),
      },
    ]),
  );
};

const normalizePositions = (positions, paddingX = 100, paddingY = 90) => {
  const values = [...positions.values()];
  if (!values.length) return positions;
  const minX = Math.min(...values.map((point) => point.x));
  const maxX = Math.max(...values.map((point) => point.x));
  const minY = Math.min(...values.map((point) => point.y));
  const maxY = Math.max(...values.map((point) => point.y));
  const scale = Math.min(
    (WIDTH - paddingX * 2) / Math.max(1, maxX - minX),
    (HEIGHT - paddingY * 2) / Math.max(1, maxY - minY),
  );
  const usedWidth = (maxX - minX) * scale;
  const usedHeight = (maxY - minY) * scale;
  const offsetX = (WIDTH - usedWidth) / 2;
  const offsetY = (HEIGHT - usedHeight) / 2;
  const normalized = new Map();
  for (const [id, point] of positions) {
    const baseX = offsetX + (point.x - minX) * scale;
    const baseY = offsetY + (point.y - minY) * scale;
    normalized.set(id, {
      x: CENTER.x + (baseX - CENTER.x) * 1.36,
      y: baseY,
    });
  }
  return normalized;
};

function buildKnowledgeNetworkLayout(entities, relationships, importanceById) {
  const entityMap = new Map(entities.map((entity) => [entity.id, entity]));
  const knowledgeEntities = entities.filter((entity) => entity.type !== "教材");
  const knowledgeRelationships = relationships.filter((relationship) =>
    knowledgeRelationship(relationship, entityMap),
  );
  const graph = new MultiUndirectedGraph();
  const ordered = [...knowledgeEntities].sort(
    (a, b) =>
      (importanceById.get(b.id)?.value ?? 0) -
        (importanceById.get(a.id)?.value ?? 0) ||
      stableSeed(a.id) - stableSeed(b.id),
  );
  ordered.forEach((entity, index) => {
    const importance = importanceById.get(entity.id)?.value ?? 0;
    const radius = 5 + Math.sqrt(index + 1) * (1.9 + (1 - importance) * 1.15);
    const angle = index * GOLDEN_ANGLE + (stableSeed(entity.id) % 997) / 997;
    graph.addNode(entity.id, {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.82,
      size: 1.7 + importance * 5.1,
    });
  });
  knowledgeRelationships.forEach((relationship, index) => {
    if (!graph.hasNode(relationship.subject) || !graph.hasNode(relationship.objectId))
      return;
    graph.addUndirectedEdgeWithKey(
      `${relationship.id}:${index}`,
      relationship.subject,
      relationship.objectId,
      { weight: relationship.crossBook ? 1.35 : 1 },
    );
  });

  const inferred = forceAtlas2.inferSettings(graph);
  forceAtlas2.assign(graph, {
    iterations: 520,
    settings: {
      ...inferred,
      adjustSizes: true,
      barnesHutOptimize: true,
      barnesHutTheta: 0.62,
      edgeWeightInfluence: 0.7,
      gravity: 1.65,
      linLogMode: true,
      scalingRatio: 12,
      slowDown: 9,
      strongGravityMode: false,
    },
  });
  noverlap.assign(graph, {
    maxIterations: 220,
    settings: { gridSize: 38, margin: 3.5, expansion: 1.08, ratio: 1.2, speed: 3 },
  });

  const raw = new Map();
  graph.forEachNode((id, attributes) => {
    raw.set(id, { x: attributes.x, y: attributes.y });
  });
  const normalized = resolveCollisions(
    knowledgeEntities,
    normalizePositions(raw),
    52,
  );

  // 教材只作为可选来源层，放在外围，不参与主知识网络的受力计算。
  const textbookEntities = entities.filter((entity) => entity.type === "教材");
  textbookEntities.forEach((entity, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(1, textbookEntities.length)) * Math.PI * 2;
    normalized.set(entity.id, {
      x: CENTER.x + Math.cos(angle) * 1030,
      y: CENTER.y + Math.sin(angle) * 620,
    });
  });
  resolveCollisions(entities, normalized, 38);
  return {
    positions: normalized,
    knowledgeNodeCount: knowledgeEntities.length,
    knowledgeRelationshipCount: knowledgeRelationships.length,
  };
}

function nodeRadius(entity) {
  if (entity.type === "教材") return 46;
  if ((entity.textbookCount ?? 1) >= 4)
    return 18 + Math.min(32, entity.name.length * 1.6);
  if ((entity.textbookCount ?? 1) >= 2)
    return 15 + Math.min(24, entity.name.length * 1.15);
  return 11;
}

function resolveCollisions(entities, positioned, iterations = 44) {
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const grid = new Map();
    const cellSize = 72;
    for (const entity of entities) {
      const point = positioned.get(entity.id) ?? CENTER;
      const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(entity);
    }
    for (const entity of entities) {
      const point = positioned.get(entity.id) ?? { ...CENTER };
      const cellX = Math.floor(point.x / cellSize);
      const cellY = Math.floor(point.y / cellSize);
      for (let dx = -2; dx <= 2; dx += 1) {
        for (let dy = -2; dy <= 2; dy += 1) {
          for (const other of grid.get(`${cellX + dx}:${cellY + dy}`) ?? []) {
            if (other.id <= entity.id) continue;
            const otherPoint = positioned.get(other.id) ?? { ...CENTER };
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
            point.x += (vx / distance) * overlap * 0.51;
            point.y += (vy / distance) * overlap * 0.51;
            otherPoint.x -= (vx / distance) * overlap * 0.51;
            otherPoint.y -= (vy / distance) * overlap * 0.51;
            positioned.set(other.id, otherPoint);
          }
        }
      }
      point.x = Math.max(28, Math.min(WIDTH - 28, point.x));
      point.y = Math.max(28, Math.min(HEIGHT - 28, point.y));
      positioned.set(entity.id, point);
    }
  }
  return positioned;
}

function buildTextbookClusterLayout(entities) {
  const uniqueByBook = new Map();
  Object.keys(TEXTBOOK_POSITIONS).forEach((key) => uniqueByBook.set(key, []));
  const sharedEntities = [];
  const textbookEntities = [];
  for (const entity of entities) {
    if (entity.type === "教材") textbookEntities.push(entity);
    else if ((entity.textbookCount ?? 1) >= 2) sharedEntities.push(entity);
    else {
      const key = entity.bookKeys?.[0] ?? "g7s1";
      if (!uniqueByBook.has(key)) uniqueByBook.set(key, []);
      uniqueByBook.get(key).push(entity);
    }
  }
  const positioned = new Map();
  textbookEntities.forEach((entity) => {
    positioned.set(entity.id, TEXTBOOK_POSITIONS[entity.bookKeys?.[0] ?? "g7s1"] ?? CENTER);
  });
  for (const [key, values] of uniqueByBook) {
    const base = TEXTBOOK_POSITIONS[key] ?? CENTER;
    const outwardAngle = Math.atan2(base.y - CENTER.y, base.x - CENTER.x);
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
        const jitter = ((stableSeed(entity.id) % 9) - 4) * 0.8;
        positioned.set(entity.id, {
          x: base.x + Math.cos(angle) * (radius + jitter),
          y: base.y + Math.sin(angle) * (radius + jitter) * 0.9,
        });
      }
      cursor += count;
      ring += 1;
    }
  }
  const buckets = new Map();
  sharedEntities.forEach((entity) => {
    const signature = [...(entity.bookKeys ?? [])].sort().join("|");
    if (!buckets.has(signature)) buckets.set(signature, []);
    buckets.get(signature).push(entity);
  });
  for (const [signature, values] of buckets) {
    const sources = signature
      .split("|")
      .map((key) => TEXTBOOK_POSITIONS[key])
      .filter(Boolean);
    const centroid = sources.length
      ? {
          x: sources.reduce((sum, point) => sum + point.x, 0) / sources.length,
          y: sources.reduce((sum, point) => sum + point.y, 0) / sources.length,
        }
      : CENTER;
    const anchor = {
      x: CENTER.x + (centroid.x - CENTER.x) * 0.48,
      y: CENTER.y + (centroid.y - CENTER.y) * 0.48,
    };
    [...values]
      .sort(
        (a, b) =>
          (b.textbookCount ?? 1) - (a.textbookCount ?? 1) ||
          stableSeed(a.id) - stableSeed(b.id),
      )
      .forEach((entity, index) => {
        const ring = Math.floor(Math.sqrt(index));
        const angle = (index * GOLDEN_ANGLE + stableSeed(signature) / 1000) % (Math.PI * 2);
        const radius = index === 0 ? 0 : 24 + ring * 25;
        positioned.set(entity.id, {
          x: anchor.x + Math.cos(angle) * radius,
          y: anchor.y + Math.sin(angle) * radius * 0.88,
        });
      });
  }
  return resolveCollisions(entities, positioned);
}

function buildSchemaLayout(entities, importanceById) {
  const buckets = new Map();
  for (const entity of entities) {
    const category = entity.category ?? (entity.type === "教材" ? "textbook" : "theory");
    if (!buckets.has(category)) buckets.set(category, []);
    buckets.get(category).push(entity);
  }
  const positioned = new Map();
  for (const [category, values] of buckets) {
    const anchor = SCHEMA_ANCHORS[category] ?? CENTER;
    [...values]
      .sort(
        (a, b) =>
          (importanceById.get(b.id)?.value ?? 0) -
            (importanceById.get(a.id)?.value ?? 0) ||
          stableSeed(a.id) - stableSeed(b.id),
      )
      .forEach((entity, index) => {
        const ring = Math.floor(Math.sqrt(index));
        const angle = index * GOLDEN_ANGLE + (stableSeed(category) % 360) * (Math.PI / 180);
        const radius = index === 0 ? 0 : 25 + ring * 25;
        positioned.set(entity.id, {
          x: anchor.x + Math.cos(angle) * radius,
          y: anchor.y + Math.sin(angle) * radius * 0.78,
        });
      });
  }
  return resolveCollisions(entities, positioned, 36);
}

export function buildFullGraphLayouts(entities, relationships) {
  const started = performance.now();
  const entityMap = new Map(entities.map((entity) => [entity.id, entity]));
  const structuralDegree = new Map(entities.map((entity) => [entity.id, 0]));
  for (const relationship of relationships) {
    if (!knowledgeRelationship(relationship, entityMap)) continue;
    structuralDegree.set(
      relationship.subject,
      (structuralDegree.get(relationship.subject) ?? 0) + 1,
    );
    structuralDegree.set(
      relationship.objectId,
      (structuralDegree.get(relationship.objectId) ?? 0) + 1,
    );
  }
  const importanceById = normalizeImportance(entities, structuralDegree);
  const knowledge = buildKnowledgeNetworkLayout(entities, relationships, importanceById);
  const textbook = buildTextbookClusterLayout(entities);
  const schema = buildSchemaLayout(entities, importanceById);
  return {
    entities: entities.map((entity) => ({
      ...entity,
      visualImportance: importanceById.get(entity.id)?.value ?? 0,
      visualRank: importanceById.get(entity.id)?.rank ?? entities.length,
      layout: knowledge.positions.get(entity.id) ?? CENTER,
      layouts: {
        knowledge: knowledge.positions.get(entity.id) ?? CENTER,
        textbook: textbook.get(entity.id) ?? CENTER,
        schema: schema.get(entity.id) ?? CENTER,
      },
    })),
    performance: {
      layoutBuildMs: performance.now() - started,
      algorithm: "ForceAtlas2-precomputed",
      iterations: 520,
      knowledgeNodeCount: knowledge.knowledgeNodeCount,
      knowledgeRelationshipCount: knowledge.knowledgeRelationshipCount,
    },
  };
}
