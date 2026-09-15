import { graphRuntimeFor } from "../../graph-runtime";
import { shortestPaths, buildGraphIndexes } from "../graph/graph-algorithms";

export type Intent = "fact" | "explain" | "compare" | "path" | "progression" | "teaching" | "recommend-related" | "graph-analysis";
export type SourceType = "textbook_explicit" | "external_verified" | "graph_inferred" | "ai_suggested";
export type RagEntity = { id: string; name: string; type: string; aliases?: string[]; description?: string; bookKeys?: string[]; category?: string; textbookCount?: number };
export type RawEvidence = { tripleId?: string; pdfPage?: number | null; textbookPage?: string | number; summary?: string; region?: string };
type Source = { bookKey: string; bookTitle: string; tripleId?: string; pdfPage?: number | null; evidence?: RawEvidence[] };
export type RagEdge = { id: string; subject: string; predicate: string; label?: string; objectId?: string | null; literal?: string | null; bookKeys?: string[]; sourcePage?: number | null; provenance?: boolean; sources?: Source[] };
export type Occurrence = { id: string; canonicalId: string; textbook: string; textbookTitle: string; unit?: string | null; lesson?: string | null; page?: number | null; sourceText?: string | null; evidence?: RawEvidence[] };
export type EvidencePayload = { evidenceByTriple: Record<string, RawEvidence[]>; relationshipEvidenceById?: Record<string, Source[]>; occurrences?: Occurrence[] };
export type RagGraph = { entities: RagEntity[]; relationships: RagEdge[]; occurrences?: Occurrence[]; books: { key: string; title: string }[]; quality?: unknown };
export type Turn = { question: string; answer: string; resolvedEntities: string[] };
export type Citation = { id: string; relationshipId?: string; bookKey: string; bookTitle: string; pdfPage: number | null; textbookPage: string; summary: string; sourceType: SourceType; unit?: string; lesson?: string };
export type RetrievedFact = { id: string; subject: string; predicate: string; object: string; depth: number; sourceType: SourceType; evidenceIds: string[] };
export type Retrieval = { intent: Intent; centers: RagEntity[]; relatedEntities: RagEntity[]; relationships: RagEdge[]; facts: RetrievedFact[]; evidence: Citation[]; occurrences: Occurrence[]; missingKnowledge: string[]; graphInferences: string[] };
export type AnswerResult = { answer: string; shortAnswer: string; evidence: Citation[]; relatedEntities: RagEntity[]; relatedRelationships: { id: string; subject: string; objectId?: string | null; predicate: string }[]; graphFocus: { nodeIds: string[]; relationshipIds: string[] }; suggestedQuestions: string[]; missingKnowledge: string[]; candidateKnowledge: never[]; confidence: "supported" | "limited" | "insufficient"; poweredBy: "graph" | "gpt"; intent: Intent; auxiliaryExplanation: string; serviceNotice?: string };

export const normalize = (value: string) => value.toLowerCase().replace(/[《》“”"'\s，。！？、：；·（）()]/g, "");
export function recognizeIntent(q: string): Intent {
  if (/比较|对比|区别|异同/.test(q)) return "compare";
  if (/最短|路径|怎么连接/.test(q)) return "path";
  if (/递进|进阶|逐步|发展|深化|前置/.test(q)) return "progression";
  if (/教师|教学|怎样讲|怎么教|备课/.test(q)) return "teaching";
  if (/统计|数量|核心|覆盖率|关联强度/.test(q)) return "graph-analysis";
  if (/哪些|相关|哪里|出现/.test(q)) return "recommend-related";
  if (/为什么|为何|特点|感觉|解释/.test(q)) return "explain";
  return "fact";
}
export function linkEntities(graph: RagGraph, q: string, history: Turn[] = []) {
  const term = normalize(q);
  if (/^(它|这首|这个|该作品|他们|还有|那么)/.test(q.trim()) && history.length) {
    const byId = new Map(graph.entities.map(entity => [entity.id, entity]));
    const resolved = history.at(-1)!.resolvedEntities.map(id => byId.get(id)).filter((entity): entity is RagEntity => !!entity);
    if (resolved.length) return resolved.slice(0, 3);
  }
  const scored = graph.entities.map(entity => {
    const names = [entity.name, ...(entity.aliases ?? [])].map(normalize);
    const exact = Math.max(0, ...names.map(name => name.length >= 2 && term.includes(name) ? 100 + name.length * 5 : 0));
    const metadata = [entity.type, entity.description ?? "", ...(entity.bookKeys ?? []).map(key => graph.books.find(b => b.key === key)?.title ?? "")].join(" ");
    const partial = term.length >= 2 && normalize(metadata).includes(term) ? 15 : 0;
    return { entity, score: Math.max(exact, partial) };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
  const limit = recognizeIntent(q) === "compare" || recognizeIntent(q) === "path" ? 2 : 3;
  const named = scored.filter(item => ["work", "person"].includes(item.entity.category ?? ""));
  const specific = scored.filter(item => !["音乐", "音乐知识", "知识", "作品", "作曲家", "教材"].includes(item.entity.name));
  const candidates = named.length ? named : specific.length ? specific : scored;
  const roots = candidates.filter(item => item.score >= (candidates[0]?.score ?? 0) * .8).slice(0, limit).map(item => item.entity);
  if (!roots.length && /它|这首|这个|他们|还有|那/.test(q)) {
    const ids = history.at(-1)?.resolvedEntities ?? [];
    const byId = new Map(graph.entities.map(entity => [entity.id, entity]));
    return ids.map(id => byId.get(id)).filter((entity): entity is RagEntity => !!entity).slice(0, limit);
  }
  if (!roots.length) {
    const runtime = graphRuntimeFor(graph, graph.entities, graph.relationships);
    const matches = graph.relationships.filter(edge => term.includes(normalize(edge.label ?? edge.predicate)) && normalize(edge.label ?? edge.predicate).length >= 2);
    for (const edge of matches.slice(0, 3)) {
      const entity = runtime.entityMap.get(edge.subject);
      if (entity && !roots.some(root => root.id === entity.id)) roots.push(entity);
    }
  }
  return roots;
}
const classify = (e: RawEvidence): SourceType => /教材明示|乐谱可见/.test(e.region ?? "") ? "textbook_explicit" : "graph_inferred";
const preferredPredicates = (q: string) => /谁|作曲家|创作|作者/.test(q) ? /作曲|作词|改编|编词|译配/ : /特点|轻快|机智|节奏|感觉/.test(q) ? /速度|节拍|节奏|旋律|调性|曲式|风格|体裁|力度|表现|分析维度/ : /蒙古|民族/.test(q) ? /民族|地区|音乐体裁|收录作品|包含作品/ : /递进|深化|前置/.test(q) ? /前置|复现|深化|扩展|应用|教材收录|收录作品/ : /./;
export function retrieveGraph(graph: RagGraph, question: string, history: Turn[] = []): Retrieval {
  const intent = recognizeIntent(question), centers = linkEntities(graph, question, history);
  const runtime = graphRuntimeFor(graph, graph.entities, graph.relationships);
  const depths = new Map(centers.map(entity => [entity.id, 0]));
  const selectedEdges = new Map<string, RagEdge>();
  const predicate = preferredPredicates(question);
  let frontier = centers.map(entity => entity.id);
  const maxDepth = intent === "graph-analysis" || /同类|关联作品|相关作品/.test(question) ? 2 : 1;
  for (let depth = 1; depth <= maxDepth; depth++) {
    const next: string[] = [];
    for (const id of frontier) {
      const current = runtime.entityMap.get(id);
      if (depth === 2 && (current?.category === "textbook" || /^(欣赏|演唱|演奏|唱歌|主题聆听|音色辨认)$/.test(current?.name ?? ""))) continue;
      const adjacent = [...(runtime.adjacencyMap.get(id) ?? [])].sort((a, b) => Number(predicate.test(b.edge.label ?? b.edge.predicate)) - Number(predicate.test(a.edge.label ?? a.edge.predicate)));
      for (const { edge, neighborId } of adjacent) {
        if (depth === 2 && (edge.provenance || /教材收录|收录作品|包含作品|包含单元|教材归属|学习方式|适合开展/.test(edge.label ?? edge.predicate) || !predicate.test(edge.label ?? edge.predicate))) continue;
        if (depth === 2 && intent === "recommend-related" && /蒙古/.test(question) && !/民族|地区/.test(edge.predicate)) continue;
        selectedEdges.set(edge.id, edge);
        if (neighborId && !depths.has(neighborId)) { depths.set(neighborId, depth); next.push(neighborId); }
        if (selectedEdges.size >= 180) break;
      }
      if (selectedEdges.size >= 180) break;
    }
    frontier = next;
    if (selectedEdges.size >= 180) break;
  }
  if (intent === "path" && centers.length >= 2) {
    const path = shortestPaths(buildGraphIndexes(graph.entities, graph.relationships), centers[0].id, centers[1].id)[0];
    selectedEdges.clear(); depths.clear();
    for (const id of path?.nodeIds ?? []) depths.set(id, 1);
    for (const id of path?.edgeIds ?? []) { const edge = runtime.edgeMap.get(id); if (edge) selectedEdges.set(id, edge); }
  }
  const evidence: Citation[] = [], facts: RetrievedFact[] = [];
  const relationships = [...selectedEdges.values()].sort((a, b) => Number(predicate.test(b.label ?? b.predicate)) - Number(predicate.test(a.label ?? a.predicate))).slice(0, 120);
  for (const edge of relationships) {
    const citations: Citation[] = [];
    for (const source of edge.sources ?? []) for (const item of source.evidence ?? []) {
      const id = `${edge.id}:${source.bookKey}:${item.tripleId ?? ""}:${item.pdfPage ?? source.pdfPage ?? ""}`;
      if (citations.some(citation => citation.id === id)) continue;
      citations.push({ id, relationshipId: edge.id, bookKey: source.bookKey, bookTitle: source.bookTitle, pdfPage: item.pdfPage ?? source.pdfPage ?? null, textbookPage: String(item.textbookPage ?? ""), summary: (item.summary ?? "").slice(0, 700), sourceType: classify(item) });
    }
    evidence.push(...citations);
    facts.push({ id: edge.id, subject: runtime.entityMap.get(edge.subject)?.name ?? edge.subject, predicate: edge.label ?? edge.predicate, object: runtime.entityMap.get(edge.objectId ?? "")?.name ?? edge.literal ?? "", depth: Math.min(depths.get(edge.subject) ?? 2, depths.get(edge.objectId ?? "") ?? 2) + 1, sourceType: citations.some(c => c.sourceType === "textbook_explicit") ? "textbook_explicit" : "graph_inferred", evidenceIds: citations.map(c => c.id) });
  }
  const centerIds = new Set(centers.map(entity => entity.id));
  const occurrences = (graph.occurrences ?? []).filter(o => centerIds.has(o.canonicalId));
  for (const occurrence of occurrences) {
    evidence.push({ id: occurrence.id, bookKey: occurrence.textbook, bookTitle: occurrence.textbookTitle, pdfPage: occurrence.page ?? null, textbookPage: "", summary: (occurrence.sourceText ?? "").slice(0, 700), sourceType: "graph_inferred", unit: occurrence.unit ?? undefined, lesson: occurrence.lesson ?? undefined });
  }
  const missingKnowledge: string[] = [];
  if (!centers.length) missingKnowledge.push("当前教材图谱中暂无足够信息：没有定位到明确知识实体。");
  if (centers.length && !evidence.some(item => item.sourceType === "textbook_explicit")) missingKnowledge.push("检索关系暂无教材明确证据，不能作为教材原文事实。");
  if (intent === "progression" && !relationships.some(edge => /前置|深化|复现|扩展|应用于/.test(edge.label ?? edge.predicate))) missingKnowledge.push("暂无经教材证据或人工确认的前置、复现、深化关系；跨册出现顺序不等同于学习递进。");
  return { intent, centers, relatedEntities: [...depths.keys()].map(id => runtime.entityMap.get(id)!).filter(Boolean), relationships, facts, evidence: [...new Map(evidence.map(citation => [citation.id, citation])).values()], occurrences, missingKnowledge, graphInferences: occurrences.length ? [`匹配实体共出现于 ${new Set(occurrences.map(o => o.textbook)).size} 册教材。此为来源记录统计。`] : [] };
}
export async function enrichGraph(graph: RagGraph, question: string, history: Turn[], load: (key: string) => Promise<EvidencePayload>) {
  const initial = retrieveGraph(graph, question, history);
  const keys = new Set([...initial.relationships.flatMap(edge => edge.bookKeys ?? []), ...initial.centers.flatMap(entity => entity.bookKeys ?? [])]);
  const payloads = new Map(await Promise.all([...keys].map(async key => [key, await load(key)] as const)));
  const edgeIds = new Set(initial.relationships.map(edge => edge.id));
  const relationships = graph.relationships.map(edge => {
    if (!edgeIds.has(edge.id)) return edge;
    const sources = (edge.sources ?? []).map(source => ({ ...source }));
    for (const [key, payload] of payloads) {
      const entries = payload.relationshipEvidenceById?.[edge.id] ?? [];
      for (const source of entries) if (!sources.some(s => s.bookKey === source.bookKey && s.tripleId === source.tripleId)) sources.push({ ...source, evidence: source.evidence?.length ? source.evidence : payload.evidenceByTriple[source.tripleId ?? ""] ?? [] });
      for (const source of sources.filter(s => s.bookKey === key)) if (!source.evidence?.length) source.evidence = payload.evidenceByTriple[source.tripleId ?? ""] ?? [];
    }
    return { ...edge, sources };
  });
  const occurrences = [...new Map([...(graph.occurrences ?? []), ...[...payloads.values()].flatMap(payload => payload.occurrences ?? [])].map(o => [o.id, o])).values()];
  return retrieveGraph({ ...graph, relationships, occurrences }, question, history);
}
export function graphAnswer(retrieval: Retrieval, question: string): AnswerResult {
  const { centers, intent, facts, evidence } = retrieval;
  const missingKnowledge = [...retrieval.missingKnowledge];
  const names = centers.map(entity => entity.name).join("、");
  const direct = facts.filter(fact => centers.some(entity => entity.name === fact.subject || entity.name === fact.object));
  const creator = direct.filter(fact => /作曲家|作曲/.test(question) ? fact.predicate === "作曲" : /作曲|作词|改编/.test(fact.predicate));
  const directIds = new Set(retrieval.relationships.filter(edge => !/教材收录|收录作品|包含作品|包含单元/.test(edge.label ?? edge.predicate) && centers.some(entity => entity.id === edge.subject || entity.id === edge.objectId)).flatMap(edge => [edge.subject, edge.objectId]));
  const works = retrieval.relatedEntities.filter(entity => entity.category === "work" && directIds.has(entity.id) && !centers.some(center => center.id === entity.id));
  const knowledge = direct.filter(fact => !/教材收录|收录作品|包含作品|包含单元|教材归属|学习方式|作曲|作词|改编/.test(fact.predicate));
  let shortAnswer = !centers.length ? "当前教材图谱中暂无足够信息。" : knowledge.length ? `与${names}直接相关的知识关联包括${knowledge.slice(0, 8).map(fact => `${fact.predicate}：${fact.subject === centers[0].name ? fact.object : fact.subject}`).join("；")}。这些是关联记录，不代表所有属性均已得到教材明确说明。` : `${names}目前主要有教材出处与创作者记录；暂无足够具体的音乐知识关系回答这个问题。`;
  if (/谁|作曲家|创作|作者/.test(question) && creator.length) shortAnswer = creator.map(fact => `${fact.subject}的${fact.predicate}者是${fact.object}。`).join("");
  if (intent === "recommend-related" && works.length && /哪些.*作品|相关作品|关联作品|同类/.test(question)) shortAnswer = `检索到直接相关作品：${works.slice(0, 20).map(work => work.name).join("、")}。`;
  if (/哪里|出现在哪|出现.*哪里|在哪.*教材/.test(question)) shortAnswer = `${names}的出现记录：${retrieval.occurrences.map(o => `${o.textbookTitle}，PDF第${o.page ?? "—"}页${o.unit ? `，${o.unit}` : ""}`).join("；") || "当前来源记录不足"}。${works.length ? `直接关联作品：${works.map(work => work.name).join("、")}。` : ""}`;
  if (intent === "progression") shortAnswer = `${names}在${new Set(retrieval.occurrences.map(o => o.textbook)).size}册教材中有出现记录；当前暂无足够证据确认其知识递进关系。`;
  if (intent === "compare" && centers.length > 1) {
    const values = centers.map(entity => new Set(facts.filter(f => f.subject === entity.name && !/教材|单元|学习方式/.test(f.predicate)).map(f => `${f.predicate}：${f.object}`)));
    const shared = [...values[0]].filter(value => values[1].has(value));
    shortAnswer = `${names}可以从创作者、表演形式和音乐要素等维度比较。${shared.length ? `共享的图谱关联有${shared.slice(0, 5).join("、")}。` : "当前图谱未检索到两者明确相同的属性，不能仅凭关联断言风格相同。"}`;
    shortAnswer += "\n\n" + centers.map(entity => `${entity.name}：${facts.filter(f => f.subject === entity.name && /^(作曲|作词|音乐体裁|表演形式|速度特点|节奏特点|旋律特点)$/.test(f.predicate)).slice(0, 6).map(f => `${f.predicate}为${f.object}${f.sourceType === "textbook_explicit" ? "" : "（图谱归纳记录）"}`).join("；") || "具体比较属性不足"}。`).join("\n");
  }
  if (intent === "path") shortAnswer = retrieval.relationships.length ? `${names}之间找到 ${retrieval.relationships.length} 跳最短关联路径。路径中的关系为：${facts.map(f => `${f.subject}通过“${f.predicate}”连接${f.object}`).join("；")}。这是图结构关联查询，不代表教学递进或因果推理。` : `${names}之间暂无可显示的关联路径。`;
  const featureFacts = direct.filter(f => /速度特点|节拍|旋律特点|音乐风格|表现|力度/.test(f.predicate) && f.sourceType === "textbook_explicit");
  if (intent === "explain") shortAnswer = featureFacts.length ? `${names}有教材明确依据的特点包括${featureFacts.map(f => `${f.predicate}：${f.object}`).join("；")}。` : `${names}关联了${direct.filter(f => /分析维度|音乐体裁/.test(f.predicate)).slice(0, 6).map(f => f.object).join("、") || "相关音乐知识"}。当前教材图谱中暂无足够具体信息解释其听觉特点，不能把分析维度当作作品的实际特征。`;
  if (/什么是/.test(question)) {
    const definition = direct.find(f => centers.some(entity => entity.name === f.subject) && /^(是|指|定义为)$/.test(f.predicate));
    if (definition) shortAnswer = `${definition.subject}${definition.predicate}${definition.object}（${definition.sourceType === "textbook_explicit" ? "教材明确知识" : "图谱归纳记录，非教材原文"}）。\n${shortAnswer}`;
    else missingKnowledge.push("当前检索未找到该概念的明确完整定义；相关作品列表不能替代定义。");
  }
  if (intent === "explain" && /为什么|为何/.test(question)) missingKnowledge.push("现有证据描述了音乐特点，但不足以单独证明上述听觉感受的原因。");
  const details = creator.length && !/谁|作曲家|作者/.test(question) ? `创作者信息：${creator.map(f => `${f.subject}—${f.predicate}—${f.object}`).join("；")}。` : "";
  const auxiliaryExplanation = intent === "teaching" ? "教学建议（规则生成，非教材事实）：先聆听相关作品，请学生拍击稳定节拍、比较音的长短和强弱，再用图谱中的概念与作品关联组织讨论。教材目标需回到具体单元核对。" : "";
  return { answer: [shortAnswer, details, ...retrieval.graphInferences, ...missingKnowledge].filter(Boolean).join("\n\n"), shortAnswer, evidence, relatedEntities: retrieval.relatedEntities, relatedRelationships: retrieval.relationships.map(edge => ({ id: edge.id, subject: edge.subject, objectId: edge.objectId, predicate: edge.label ?? edge.predicate })), graphFocus: { nodeIds: retrieval.relatedEntities.map(entity => entity.id), relationshipIds: retrieval.relationships.map(edge => edge.id) }, suggestedQuestions: centers.length ? [`${centers[0].name}出现在哪些教材里？`, `${centers[0].name}与哪些作品相关？`] : ["什么是节奏？"], missingKnowledge, candidateKnowledge: [], confidence: !centers.length ? "insufficient" : missingKnowledge.length ? "limited" : "supported", poweredBy: "graph", intent, auxiliaryExplanation };
}
