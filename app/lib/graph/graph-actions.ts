import { ALL_SCHEMA_KEYS, SCHEMA_CATEGORIES } from "../../graph-schema";
import { graphRuntimeFor } from "../../graph-runtime";
import { linkEntities, normalize, type RagGraph } from "../ai/graph-rag";
import type { GraphPerspective } from "./types";

export type GraphAction =
  | { type: "focus_entities"; entityIds: string[]; isolate?: boolean }
  | { type: "filter_entity_types"; entityTypes: string[] }
  | { type: "filter_relationship_types"; relationshipTypes: string[] }
  | { type: "filter_books"; bookKeys: string[] }
  | { type: "find_path"; sourceId: string; targetId: string }
  | { type: "expand_neighbors"; entityId: string; hops: 1 | 2 }
  | { type: "switch_perspective"; perspective: GraphPerspective }
  | { type: "highlight_entities"; entityIds: string[] }
  | { type: "highlight_relationships"; relationshipIds: string[] };

export function validateGraphActions(input: unknown, graph: RagGraph): { valid: true; actions: GraphAction[] } | { valid: false; error: string } {
  if (!Array.isArray(input) || !input.length || input.length > 12) return { valid: false, error: "探索动作数量无效" };
  const entityIds = new Set(graph.entities.map(e => e.id)), edgeIds = new Set(graph.relationships.map(e => e.id));
  const relations = new Set(graph.relationships.map(e => e.label ?? e.predicate)), books = new Set(graph.books.map(b => b.key));
  const allowed: Record<string, string[]> = { focus_entities: ["entityIds", "isolate"], filter_entity_types: ["entityTypes"], filter_relationship_types: ["relationshipTypes"], filter_books: ["bookKeys"], find_path: ["sourceId", "targetId"], expand_neighbors: ["entityId", "hops"], switch_perspective: ["perspective"], highlight_entities: ["entityIds"], highlight_relationships: ["relationshipIds"] };
  const list = (value: unknown, values: Set<string>) => Array.isArray(value) && value.length > 0 && value.length <= 500 && value.every(item => typeof item === "string" && values.has(item)) && new Set(value).size === value.length;
  for (const item of input) {
    if (!item || typeof item !== "object" || typeof item.type !== "string" || !Object.hasOwn(allowed, item.type) || Object.keys(item).some(key => key !== "type" && !allowed[item.type].includes(key))) return { valid: false, error: "拒绝未知动作或额外字段；图谱数据保持不变" };
    const a = item as Record<string, unknown>;
    const ok = a.type === "focus_entities" ? list(a.entityIds, entityIds) && (a.isolate === undefined || typeof a.isolate === "boolean")
      : a.type === "highlight_entities" ? list(a.entityIds, entityIds)
      : a.type === "highlight_relationships" ? list(a.relationshipIds, edgeIds)
      : a.type === "filter_entity_types" ? list(a.entityTypes, new Set(ALL_SCHEMA_KEYS))
      : a.type === "filter_relationship_types" ? list(a.relationshipTypes, relations)
      : a.type === "filter_books" ? list(a.bookKeys, books)
      : a.type === "find_path" ? entityIds.has(String(a.sourceId)) && entityIds.has(String(a.targetId)) && typeof a.sourceId === "string" && typeof a.targetId === "string"
      : a.type === "expand_neighbors" ? typeof a.entityId === "string" && entityIds.has(a.entityId) && [1, 2].includes(Number(a.hops)) && typeof a.hops === "number"
      : typeof a.perspective === "string" && ["comprehensive", "textbook", "music", "progression"].includes(a.perspective);
    if (!ok) return { valid: false, error: "拒绝无效实体、关系、教材或参数；未执行任何动作" };
  }
  return { valid: true, actions: input as GraphAction[] };
}

export function bookKeysForQuestion(question: string, graph: RagGraph) {
  const grade = /七[至到]九|7[至到-]9/.test(question) ? undefined : /([七八九789])年级/.exec(question)?.[1];
  const gradeNumber = grade ? ({ 七: "7", 八: "8", 九: "9" }[grade] ?? grade) : null;
  const semester = /上册|下册/.exec(question)?.[0];
  if (!gradeNumber && !semester) return [];
  return graph.books.filter(book => (!gradeNumber || book.key[1] === gradeNumber) && (!semester || book.key.endsWith(semester === "上册" ? "1" : "2"))).map(book => book.key);
}

export function planGraphQuery(question: string, graph: RagGraph) {
  const actions: GraphAction[] = [], bookKeys = bookKeysForQuestion(question, graph);
  if (bookKeys.length) actions.push({ type: "filter_books", bookKeys });
  const type = SCHEMA_CATEGORIES.find(c => question.includes(c.label) || (c.key === "work" && /音乐作品|作品/.test(question)) || (c.key === "person" && /音乐人物/.test(question)));
  if (/只看|仅看|显示|筛选/.test(question) && type) actions.push({ type: "filter_entity_types", entityTypes: [type.key] });
  const relationNames = [...new Set(graph.relationships.map(edge => edge.label ?? edge.predicate))].sort((a, b) => b.length - a.length);
  const relation = relationNames.find(name => question.includes(name));
  if (/只看|仅看|显示/.test(question) && /关系/.test(question) && relation) actions.push({ type: "filter_relationship_types", relationshipTypes: [relation] });
  if (/逐步|发展|递进|进阶/.test(question)) actions.push({ type: "switch_perspective", perspective: "progression" });
  else {
    const perspective = /综合知识/.test(question) ? "comprehensive" : /教材结构/.test(question) ? "textbook" : /音乐知识视角/.test(question) ? "music" : null;
    if (perspective) actions.push({ type: "switch_perspective", perspective });
  }
  const term = normalize(question);
  const exact = graph.entities.filter(e => !["音乐", "作品", "教材", "音乐知识", "知识"].includes(e.name) && normalize(e.name).length >= 2 && [e.name, ...(e.aliases ?? [])].some(n => term.includes(normalize(n))));
  const named = [...new Map(exact.sort((a, b) => term.indexOf(normalize(a.name)) - term.indexOf(normalize(b.name)) || b.name.length - a.name.length).map(e => [normalize(e.name), e])).values()];
  if (/和.*(关系|连接)|之间.*关系|最短路径/.test(question) && named.length >= 2) {
    actions.push({ type: "find_path", sourceId: named[0].id, targetId: named[1].id });
  } else if (!(type && /只看|显示|筛选|仅看/.test(question)) && !(/关系/.test(question) && relation && /只看|显示|仅看/.test(question))) {
    const roots = linkEntities(graph, question), runtime = graphRuntimeFor(graph, graph.entities, graph.relationships);
    const ids = new Set(roots.map(e => e.id)), edges = new Set<string>();
    const genreQuery = /进行曲/.test(question), ethnicQuery = /蒙古族/.test(question);
    for (const root of roots) for (const { edge, neighborId } of runtime.adjacencyMap.get(root.id) ?? []) {
      const label = edge.label ?? edge.predicate;
      if (edge.provenance || /教材|收录|包含单元|学习方式/.test(label) || (bookKeys.length && !(edge.bookKeys ?? []).some(k => bookKeys.includes(k)))) continue;
      if (genreQuery && !/体裁/.test(label)) continue;
      if (ethnicQuery && !/民族|地区/.test(label)) continue;
      if (neighborId) ids.add(neighborId); edges.add(edge.id);
    }
    if (ids.size) actions.push({ type: "focus_entities", entityIds: [...ids].slice(0, 500), isolate: true });
    if (edges.size) actions.push({ type: "highlight_relationships", relationshipIds: [...edges].slice(0, 500) });
  }
  return { actions, bookKeys, explanation: actions.length ? "已将问题转换为受校验的图谱探索动作。仅改变筛选、聚焦与高亮，不修改知识数据。" : "没有识别到可执行的图谱动作，请说明作品、人物、类型或教材。" };
}
