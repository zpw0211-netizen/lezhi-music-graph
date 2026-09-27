import { readFile } from "node:fs/promises";
import path from "node:path";
import { enrichGraph, graphAnswer, type RagGraph, type EvidencePayload, type Turn } from "../../lib/ai/graph-rag";
import { generateAnswer } from "../../lib/ai/response-generation";
export const dynamic = "force-dynamic";
type GraphIndex = { canonicalGraph: RagGraph };
let graphIndexPromise: Promise<GraphIndex> | undefined;
const evidencePromises = new Map<string, Promise<EvidencePayload>>();

function loadGraphIndex(): Promise<GraphIndex> {
  if (!graphIndexPromise) {
    const promise = readFile(path.join(process.cwd(), "public/data/graph-index.json"), "utf8")
      .then(text => JSON.parse(text) as GraphIndex);
    graphIndexPromise = promise;
    promise.catch(() => {
      if (graphIndexPromise === promise) graphIndexPromise = undefined;
    });
  }
  return graphIndexPromise;
}

function loadEvidence(key: string): Promise<EvidencePayload> {
  const current = evidencePromises.get(key);
  if (current) return current;
  const promise = readFile(path.join(process.cwd(), `public/data/evidence/${key}.json`), "utf8")
    .then(text => JSON.parse(text) as EvidencePayload);
  evidencePromises.set(key, promise);
  promise.catch(() => {
    if (evidencePromises.get(key) === promise) evidencePromises.delete(key);
  });
  return promise;
}

export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (text.length > 20000) return Response.json({ ok: false }, { status: 413 });
    const body = JSON.parse(text) as { question?: string; history?: Turn[]; mode?: string };
    if (typeof body.question !== "string" || !body.question.trim() || body.question.length > 1000) return Response.json({ ok: false }, { status: 400 });
    const graph = await loadGraphIndex();
    const history = (Array.isArray(body.history) ? body.history : []).slice(-6).filter(turn => typeof turn?.question === "string" && typeof turn.answer === "string" && Array.isArray(turn.resolvedEntities)).map(turn => ({ question: turn.question.slice(0, 1000), answer: turn.answer.slice(0, 2000), resolvedEntities: turn.resolvedEntities.filter(id => typeof id === "string").slice(0, 4) }));
    const retrieval = await enrichGraph(graph.canonicalGraph, body.question, history, loadEvidence);
    const apiKey = process.env.OPENAI_API_KEY;
    const model = body.mode === "analysis" ? process.env.OPENAI_ANALYSIS_MODEL || "gpt-5.6-sol" : process.env.OPENAI_MODEL || "gpt-5.6-terra";
    const result = apiKey ? await generateAnswer(retrieval, body.question, history, { apiKey, model }) : graphAnswer(retrieval, body.question);
    return Response.json({ ok: true, ...result });
  } catch { return Response.json({ ok: false, message: "问答暂时不可用" }, { status: 502 }); }
}
