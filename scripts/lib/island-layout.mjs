// Community ("island") layout for the six-book knowledge network.
// Tightly linked knowledge (a work with its composer, genre, instruments and
// the concepts it teaches) forms one island; islands are packed side by side
// around a central core of textbook nodes and very general hub concepts
// (旋律/节奏…) whose spokes would otherwise pull everything into one disc.
import { MultiUndirectedGraph } from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const HUB_DEGREE = 30;
const MIN_ISLAND = 5;
const SPACING = 36;
const GAP = 14;

const seed = (value) => {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
};

/** Louvain local-moving phase on a weighted undirected graph; returns node -> community. */
function louvainPass(nodeIds, edges) {
  const adjacency = new Map(nodeIds.map((id) => [id, new Map()]));
  let total = 0;
  for (const { a, b, w } of edges) {
    if (a === b) continue;
    adjacency.get(a).set(b, (adjacency.get(a).get(b) ?? 0) + w);
    adjacency.get(b).set(a, (adjacency.get(b).get(a) ?? 0) + w);
    total += w;
  }
  const community = new Map(nodeIds.map((id) => [id, id]));
  if (!total) return community;
  const degreeOf = new Map(nodeIds.map((id) => [id, [...adjacency.get(id).values()].reduce((sum, w) => sum + w, 0)]));
  const tot = new Map(nodeIds.map((id) => [id, degreeOf.get(id)]));
  const m2 = total * 2;
  const order = [...nodeIds].sort((a, b) => seed(a) - seed(b));
  for (let pass = 0; pass < 24; pass += 1) {
    let moved = 0;
    for (const id of order) {
      const own = community.get(id);
      const k = degreeOf.get(id);
      const links = new Map();
      for (const [other, w] of adjacency.get(id)) {
        const c = community.get(other);
        links.set(c, (links.get(c) ?? 0) + w);
      }
      tot.set(own, tot.get(own) - k);
      let best = own;
      let bestGain = (links.get(own) ?? 0) - (tot.get(own) * k) / m2;
      for (const [c, w] of links) {
        const gain = w - (tot.get(c) * k) / m2;
        if (gain > bestGain + 1e-9 || (Math.abs(gain - bestGain) <= 1e-9 && seed(c) < seed(best))) {
          best = c;
          bestGain = gain;
        }
      }
      tot.set(best, tot.get(best) + k);
      if (best !== own) {
        community.set(id, best);
        moved += 1;
      }
    }
    if (!moved) break;
  }
  return community;
}

/** Two Louvain levels: local moves, then the same on the graph of communities. */
function detectCommunities(nodeIds, edges) {
  const first = louvainPass(nodeIds, edges);
  const merged = new Map();
  for (const { a, b, w } of edges) {
    const ca = first.get(a);
    const cb = first.get(b);
    if (ca === cb) continue;
    const key = ca < cb ? `${ca}|${cb}` : `${cb}|${ca}`;
    merged.set(key, (merged.get(key) ?? 0) + w);
  }
  const ids = [...new Set(first.values())];
  const second = louvainPass(ids, [...merged].map(([key, w]) => { const [a, b] = key.split("|"); return { a, b, w }; }));
  return new Map(nodeIds.map((id) => [id, second.get(first.get(id))]));
}

/** Push points apart until they are at least `gap` units from each other. */
function separate(points, gap, iterations) {
  const cell = gap * 2;
  const ids = [...points.keys()];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let moved = 0;
    const grid = new Map();
    for (const id of ids) {
      const p = points.get(id);
      const key = `${Math.floor(p.x / cell)}:${Math.floor(p.y / cell)}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(id);
    }
    for (const id of ids) {
      const p = points.get(id);
      const cx = Math.floor(p.x / cell);
      const cy = Math.floor(p.y / cell);
      for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) {
        for (const other of grid.get(`${cx + dx}:${cy + dy}`) ?? []) {
          if (other <= id) continue;
          const q = points.get(other);
          let vx = p.x - q.x;
          let vy = p.y - q.y;
          let distance = Math.hypot(vx, vy);
          if (distance >= gap) continue;
          if (distance < 0.01) {
            const angle = (seed(`${id}:${other}`) % 6283) / 1000;
            vx = Math.cos(angle); vy = Math.sin(angle); distance = 1;
          }
          const push = ((gap - distance) / distance) * 0.5;
          p.x += vx * push; p.y += vy * push; q.x -= vx * push; q.y -= vy * push;
          moved += 1;
        }
      }
    }
    if (!moved) break;
  }
}

/** ForceAtlas2 inside one island, scaled so nodes sit about SPACING apart. */
function layoutIsland(members, edges, importance) {
  const graph = new MultiUndirectedGraph();
  const ordered = [...members].sort((a, b) => importance(b.id) - importance(a.id) || seed(a.id) - seed(b.id));
  ordered.forEach((entity, index) => {
    const radius = 2 + Math.sqrt(index + 1) * 2;
    graph.addNode(entity.id, { x: Math.cos(index * GOLDEN_ANGLE) * radius, y: Math.sin(index * GOLDEN_ANGLE) * radius });
  });
  edges.forEach(({ a, b, w }, index) => {
    if (a !== b) graph.addUndirectedEdgeWithKey(`e${index}`, a, b, { weight: w });
  });
  if (graph.order > 2) {
    forceAtlas2.assign(graph, {
      iterations: 220,
      settings: { ...forceAtlas2.inferSettings(graph), gravity: 1.2, strongGravityMode: true, scalingRatio: 4, slowDown: 4 },
    });
  }
  const points = new Map();
  graph.forEachNode((id, attributes) => points.set(id, { x: attributes.x, y: attributes.y }));
  const values = [...points.values()];
  const cx = values.reduce((sum, p) => sum + p.x, 0) / values.length;
  const cy = values.reduce((sum, p) => sum + p.y, 0) / values.length;
  const target = SPACING * Math.sqrt(values.length) * 0.62;
  const spread = Math.max(1e-6, ...values.map((p) => Math.hypot(p.x - cx, p.y - cy)));
  const scale = values.length === 1 ? 0 : target / spread;
  for (const p of values) { p.x = (p.x - cx) * scale; p.y = (p.y - cy) * scale; }
  separate(points, SPACING, 60);
  const radius = Math.max(SPACING, ...values.map((p) => Math.hypot(p.x, p.y))) + 8;
  return { points, radius };
}

/** Greedy spiral packing of circles (most important first) around a central circle. */
function packIslands(coreRadius, islands) {
  const placed = [{ x: 0, y: 0, r: coreRadius }];
  return islands.map((island) => {
    for (let step = 0; step < 40000; step += 1) {
      const angle = step * 0.19;
      const distance = coreRadius + island.radius + GAP + step * 0.9;
      const candidate = { x: Math.cos(angle) * distance * 1.45, y: Math.sin(angle) * distance, r: island.radius };
      if (placed.every((other) => Math.hypot(candidate.x - other.x, candidate.y - other.y) >= candidate.r + other.r + GAP)) {
        placed.push(candidate);
        return candidate;
      }
    }
    throw new Error("island packing failed");
  });
}

/**
 * @param entities canonical entities (with category/type)
 * @param relationships knowledge relationships already filtered to entity-to-entity links
 * @param importance (id) => 0..1
 * @returns positions (unscaled, centred on 0,0), community labels and counts
 */
export function buildIslandLayout(entities, relationships, importance) {
  const knowledgeEntities = entities.filter((entity) => entity.type !== "教材");
  const neighbours = new Map(knowledgeEntities.map((entity) => [entity.id, new Set()]));
  for (const { subject, objectId } of relationships) {
    neighbours.get(subject)?.add(objectId);
    neighbours.get(objectId)?.add(subject);
  }
  const degree = (id) => neighbours.get(id)?.size ?? 0;
  const hubs = knowledgeEntities.filter((entity) => degree(entity.id) >= HUB_DEGREE);
  const hubIds = new Set(hubs.map((entity) => entity.id));
  const members = knowledgeEntities.filter((entity) => !hubIds.has(entity.id) && degree(entity.id) > 0);
  const memberIds = new Set(members.map((entity) => entity.id));
  const edges = relationships
    .filter(({ subject, objectId }) => memberIds.has(subject) && memberIds.has(objectId))
    .map(({ subject, objectId, crossBook }) => ({ a: subject, b: objectId, w: crossBook ? 1.3 : 1 }));
  const communityOf = detectCommunities([...memberIds], edges);

  // Fold tiny communities into the neighbour they share most links with.
  for (let round = 0; round < 3; round += 1) {
    const size = new Map();
    for (const c of communityOf.values()) size.set(c, (size.get(c) ?? 0) + 1);
    for (const entity of members) {
      const own = communityOf.get(entity.id);
      if (size.get(own) >= MIN_ISLAND) continue;
      const votes = new Map();
      for (const other of neighbours.get(entity.id)) {
        const c = communityOf.get(other);
        if (c && c !== own && (size.get(c) ?? 0) >= MIN_ISLAND) votes.set(c, (votes.get(c) ?? 0) + 1);
      }
      const best = [...votes].sort((a, b) => b[1] - a[1] || seed(a[0]) - seed(b[0]))[0];
      if (best) communityOf.set(entity.id, best[0]);
    }
  }

  const groups = new Map();
  for (const entity of members) {
    const c = communityOf.get(entity.id);
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c).push(entity);
  }
  const weight = (group) => group.reduce((sum, entity) => sum + importance(entity.id), 0);
  const islands = [...groups.values()]
    .map((group) => {
      const ids = new Set(group.map((entity) => entity.id));
      return { group, ...layoutIsland(group, edges.filter(({ a, b }) => ids.has(a) && ids.has(b)), importance) };
    })
    .sort((a, b) => weight(b.group) - weight(a.group) || b.group.length - a.group.length);

  // Core: hub concepts in a small disc, textbooks on a ring just outside it.
  const positions = new Map();
  const community = new Map();
  const hubRadius = Math.max(50, Math.sqrt(hubs.length) * 26);
  [...hubs].sort((a, b) => importance(b.id) - importance(a.id)).forEach((entity, index) => {
    const radius = hubRadius * Math.sqrt((index + 0.5) / hubs.length);
    positions.set(entity.id, { x: Math.cos(index * GOLDEN_ANGLE) * radius * 1.3, y: Math.sin(index * GOLDEN_ANGLE) * radius });
    community.set(entity.id, "core");
  });
  const textbooks = entities.filter((entity) => entity.type === "教材");
  const centres = packIslands(hubRadius * 1.3 + 40, islands);
  islands.forEach((island, index) => {
    const centre = centres[index];
    for (const entity of island.group) {
      const point = island.points.get(entity.id);
      positions.set(entity.id, { x: centre.x + point.x, y: centre.y + point.y });
      community.set(entity.id, `island-${index + 1}`);
    }
  });
  const isolated = knowledgeEntities.filter((entity) => !positions.has(entity.id));
  const extent = Math.max(...[...positions.values()].map((p) => Math.hypot(p.x / 1.45, p.y))) + 24;
  // Textbooks sit on a ring around the whole map, evenly spaced.
  textbooks.forEach((entity, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(1, textbooks.length)) * Math.PI * 2;
    positions.set(entity.id, { x: Math.cos(angle) * (extent + 12) * 1.45, y: Math.sin(angle) * (extent + 12) });
    community.set(entity.id, "core");
  });
  isolated.forEach((entity, index) => {
    const angle = (index / Math.max(1, isolated.length)) * Math.PI * 2;
    positions.set(entity.id, { x: Math.cos(angle) * extent * 1.45, y: Math.sin(angle) * extent });
    community.set(entity.id, "isolated");
  });
  return { positions, community, islandCount: islands.length, hubCount: hubs.length, memberCount: members.length };
}
