import { enrichGraph, type RagGraph, type EvidencePayload, type Turn } from "../app/lib/ai/graph-rag";
import { generateAnswer } from "../app/lib/ai/response-generation";

type Env = { OPENAI_API_KEY?: string; OPENAI_MODEL?: string; OPENAI_ANALYSIS_MODEL?: string; ALLOWED_ORIGIN: string; GRAPH_DATA_URL: string; AI_RATE_LIMIT: { limit: (options: { key: string }) => Promise<{ success: boolean }> } };
const promises = new Map<string, { expires: number; value: Promise<unknown> }>();
async function cachedJson<T>(url: string): Promise<T> {
  const current = promises.get(url);
  if (current && current.expires > Date.now()) return current.value as Promise<T>;
  const value = fetch(url, { signal: AbortSignal.timeout(12000) }).then(async response => { if (!response.ok) throw new Error("Graph source unavailable"); return response.json(); });
  promises.set(url, { value, expires: Date.now() + 300000 });
  value.catch(() => promises.delete(url));
  return value as Promise<T>;
}
const aiApi = {
  async fetch(request: Request, env: Env) {
    const origin = request.headers.get("origin");
    if (origin !== env.ALLOWED_ORIGIN) return Response.json({ ok: false, message: "Origin not allowed" }, { status: 403 });
    const headers = { "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin", "Cache-Control": "no-store" };
    const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
    if (new URL(request.url).pathname !== "/ask") return json({ ok: false, message: "Not found" }, 404);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return json({ ok: false, message: "Method not allowed" }, 405);
    if (!env.OPENAI_API_KEY) return json({ ok: false, message: "GPT 服务尚未配置，请使用本地图谱回答" }, 503);
    if (!(await env.AI_RATE_LIMIT.limit({ key: "yapu-public-api" })).success) return json({ ok: false, message: "请求过于频繁，请稍后重试" }, 429);
    try {
      if (!request.headers.get("content-type")?.includes("application/json")) return json({ ok: false, message: "JSON required" }, 415);
      const text = await request.text();
      if (text.length > 20000) return json({ ok: false, message: "Request too large" }, 413);
      const body = JSON.parse(text) as { question?: unknown; history?: unknown; mode?: unknown };
      if (typeof body.question !== "string" || !body.question.trim() || body.question.length > 1000) return json({ ok: false, message: "问题需要 1–1000 个字符" }, 400);
      const history: Turn[] = (Array.isArray(body.history) ? body.history : []).slice(-6).filter((turn): turn is Turn => !!turn && typeof turn.question === "string" && typeof turn.answer === "string" && Array.isArray(turn.resolvedEntities)).map(turn => ({ question: turn.question.slice(0, 1000), answer: turn.answer.slice(0, 2000), resolvedEntities: turn.resolvedEntities.filter((id: unknown): id is string => typeof id === "string").slice(0, 4) }));
      // Source URLs are server-owned. Never accept client facts, evidence, or data URLs.
      const base = env.GRAPH_DATA_URL.replace(/\/$/, "");
      const index = await cachedJson<{ canonicalGraph: RagGraph }>(`${base}/graph-index.json`);
      if (index.canonicalGraph.entities.length !== 1337 || index.canonicalGraph.relationships.length !== 4661) throw new Error("Unexpected research dataset version");
      const retrieval = await enrichGraph(index.canonicalGraph, body.question, history, key => cachedJson<EvidencePayload>(`${base}/evidence/${key}.json`));
      const model = body.mode === "analysis" ? env.OPENAI_ANALYSIS_MODEL || "gpt-5.6-sol" : env.OPENAI_MODEL || "gpt-5.6-terra";
      return json({ ok: true, ...await generateAnswer(retrieval, body.question, history, { apiKey: env.OPENAI_API_KEY, model }) });
    } catch {
      return json({ ok: false, message: "AI 服务暂时不可用，请使用本地图谱回答" }, 502);
    }
  },
};
export default aiApi;
