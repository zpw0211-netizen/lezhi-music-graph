type Fact = {
  subject: string;
  predicate: string;
  object: string;
  bookTitle: string;
  page?: number | null;
  distance?: 1 | 2;
};
type SimilarWork = { name: string; bookTitle: string; shared: string[] };
type Analytics = {
  booksHit: number;
  directCount: number;
  multiHopCount: number;
  relationTypes: number;
  neighborCount: number;
  similarWorks: SimilarWork[];
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    return Response.json(
      { ok: false, message: "GPT 服务尚未配置" },
      { status: 503 },
    );
  try {
    const body = (await request.json()) as {
      question?: string;
      entityName?: string;
      bookTitle?: string;
      facts?: Fact[];
      analytics?: Analytics;
      previousAnswer?: string;
    };
    const question = (body.question ?? "").trim().slice(0, 500);
    const facts = (body.facts ?? []).slice(0, 32);
    if (!question || !facts.length)
      return Response.json(
        { ok: false, message: "缺少问题或教材证据" },
        { status: 400 },
      );
    const evidence = facts
      .map(
        (fact, index) =>
          `${index + 1}. [${fact.distance === 2 ? "二跳关联" : "直接关系"}] ${fact.subject}｜${fact.predicate}｜${fact.object}｜${fact.bookTitle}｜PDF第${fact.page ?? "—"}页`,
      )
      .join("\n");
    const analytics = body.analytics;
    const analysisSummary = analytics
      ? `命中教材 ${analytics.booksHit} 册；直接关系 ${analytics.directCount} 条；二跳关系 ${analytics.multiHopCount} 条；关系类型 ${analytics.relationTypes} 种；邻接实体 ${analytics.neighborCount} 个。相似作品：${
          analytics.similarWorks
            .slice(0, 5)
            .map(
              (item) =>
                `${item.name}（${item.bookTitle}，共同维度：${item.shared.join("、")}）`,
            )
            .join("；") || "暂无足够证据"
        }`
      : "未提供统计摘要";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.4",
        store: false,
        max_output_tokens: 700,
        instructions:
          "你是中小学音乐教材知识图谱分析助手。回答必须以提供的图谱证据为事实基础，同时对直接关系、二跳关联、跨教材统计和相似作品进行综合分析。先用一句话直接回答，再用2至4段解释“是什么、为什么、与哪些知识点或作品有关、教学中如何理解”。允许补充通用音乐学解释，但必须明确标注“补充理解”，不得把补充内容冒充教材事实，不得虚构作者、年代、体裁、地域或作品情节。不要逐条复制三元组，不要输出Markdown表格。证据不足时明确指出缺口。",
        input: `用户问题：${question}\n当前实体：${body.entityName ?? ""}\n当前教材：${body.bookTitle ?? ""}\n上一轮回答（仅用于理解追问，不得作为事实来源）：${(body.previousAnswer ?? "").slice(0, 900)}\n\n图谱统计：${analysisSummary}\n\n可用图谱证据：\n${evidence}`,
      }),
    });
    if (!response.ok)
      return Response.json(
        { ok: false, message: "模型暂时无法回答" },
        { status: 502 },
      );
    const payload = (await response.json()) as {
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    const answer = payload.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text")
      ?.text?.trim();
    if (!answer)
      return Response.json(
        { ok: false, message: "模型没有返回文本" },
        { status: 502 },
      );
    return Response.json({ ok: true, answer, poweredBy: "gpt" });
  } catch {
    return Response.json(
      { ok: false, message: "请求格式无法识别" },
      { status: 400 },
    );
  }
}
