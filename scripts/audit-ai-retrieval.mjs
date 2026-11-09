import { build } from "esbuild";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { PUBLISHED_BOOK_COUNT_LABEL } from "../data/books.mjs";
const compile = async entry => {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, format: "esm", platform: "neutral" });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
};
const { enrichGraph, graphAnswer, recognizeIntent, linkEntities } = await compile("app/lib/ai/graph-rag.ts");
const { unitWorksAnswer } = await compile("app/lib/ai/unit-works.ts");
const { resolvePlanRequest } = await compile("app/lib/lesson/plan.ts");
const planBooks = ["g7s1", "g4s1"];
const planWorks = (key) => key === "g7s1" ? ["《歌唱祖国》", "《领航》"] : ["《歌唱祖国》"];
for (const volume of ["四年级上册", "四上", "４年级（上册）"]) {
  const target = resolvePlanRequest(`请为人音版${volume}的《歌唱祖国》生成一节 40 分钟的教案。`, "g7s1", planBooks, planWorks);
  assert.equal(target.bookKey, "g4s1");
  assert.equal(target.request.work, "《歌唱祖国》");
  assert.equal(target.request.minutes, 40);
}
assert.equal(resolvePlanRequest("给七年级（3）班备《歌唱祖国》", "g4s1", planBooks, planWorks).bookKey, "g4s1");
assert.equal(resolvePlanRequest("下周一给四年级上《歌唱祖国》", "g7s1", planBooks, planWorks).bookKey, "g7s1");
assert.equal(resolvePlanRequest("备初一下册的《歌唱祖国》", "g7s1", ["g7s1", "g7s2"], () => ["《歌唱祖国》"]).bookKey, "g7s2");
assert.match(resolvePlanRequest("备四上《领航》", "g7s1", planBooks, planWorks).message, /指定分册里没有找到/);
assert.match(resolvePlanRequest("备四下《歌唱祖国》", "g7s1", planBooks, planWorks).message, /没有你指定的分册/);
assert.match(resolvePlanRequest("备四上和七上的《歌唱祖国》", "g7s1", planBooks, planWorks).message, /请指定一册/);

const unitName = "华夏之声·文化根脉";
const directoryBooks = [
  { key: "xy-g7s1", title: "湘艺版七年级上册" },
  { key: "xy-g8s2", title: "湘艺版八年级下册" },
];
const catalog = [
  { bookKey: "xy-g7s1", id: "first", name: unitName, title: unitName, works: [{ id: "7", name: "《黄河船夫曲》", pdfPage: 24 }] },
  { bookKey: "xy-g8s2", id: "second", name: unitName, title: unitName, works: [{ id: "8", name: "《久久不见久久见》", page: 19, pdfPage: 25 }, { id: "9", name: "《下四川》" }] },
];
for (const volume of ["八年级下册", "八下", "８ 年级 下册", "八年级（下册）"]) {
  const answer = unitWorksAnswer(`湘艺版${volume}的「${unitName}」单元有哪些作品？`, catalog, directoryBooks);
  assert.match(answer.answer, /湘艺版八年级下册.*《久久不见久久见》.*《下四川》/);
  assert.doesNotMatch(answer.answer, /七年级上册|黄河船夫曲/);
  assert.deepEqual(answer.evidence.map((item) => item.bookKey), ["xy-g8s2", "xy-g8s2"]);
  assert.equal(answer.evidence[0].textbookPage, "19");
}
const ambiguousUnit = unitWorksAnswer(`${unitName}单元有哪些作品？`, catalog, directoryBooks);
assert.equal(ambiguousUnit.evidence.length, 0);
assert.equal(ambiguousUnit.suggestedQuestions.length, 2);
assert.match(unitWorksAnswer(ambiguousUnit.suggestedQuestions[1], catalog, directoryBooks).answer, /久久不见久久见/);
const missingUnit = unitWorksAnswer(`八上${unitName}单元有哪些作品？`, catalog, directoryBooks);
assert.match(missingUnit.answer, /找不到你指定的单元/);
assert.equal(missingUnit.evidence.length, 0);
assert.equal(unitWorksAnswer("哪些作品用了 2/4 拍？", catalog, directoryBooks), null);

const index = JSON.parse(await readFile("public/data/graph-index.json", "utf8"));
const graph = index.canonicalGraph;
const load = async key => JSON.parse(await readFile(`public/data/evidence/${key}.json`, "utf8"));
const textbookAnswer = async question => graphAnswer(await enrichGraph(graph, question, [], load), question);
for (const wording of ["2/4 拍", "２／４拍", "四二拍"]) {
  const answer = await textbookAnswer(`哪些作品用了 ${wording}？`);
  assert.equal(answer.confidence, "supported");
  assert.match(answer.shortAnswer, /2\/4 拍.*《歌唱祖国》/);
  assert(answer.evidence.some(item => item.summary.includes("《歌唱祖国》")));
  assert(answer.evidence.every(item => item.summary.includes("拍号") && item.sourceType === "textbook_explicit"));
}
const scopedMeter = await textbookAnswer("人音版四上有哪些作品用了 2/4 拍？");
assert.match(scopedMeter.shortAnswer, /《歌唱祖国》/);
assert(scopedMeter.evidence.every(item => item.bookKey === "g4s1"));
const fourTwo = await textbookAnswer("什么是 2/4 拍？");
assert.match(fourTwo.shortAnswer, /四分音符.*每小节有两拍/);
const pentatonic = await textbookAnswer("什么是五声调式？");
assert.match(pentatonic.shortAnswer, /宫.*商.*角.*徵.*羽.*主音/);
assert(pentatonic.evidence.every(item => item.summary.startsWith("五声调式")));
const chinesePentatonic = await textbookAnswer("什么是中国民族五声调式？");
assert.match(chinesePentatonic.shortAnswer, /中国民族五声调式.*宫、商、角、徵、羽/);
const pipa = await textbookAnswer("琵琶属于哪类乐器？");
assert.equal(pipa.shortAnswer, "琵琶属于民族弹拨乐器。");
assert(pipa.evidence.every(item => item.summary.includes("乐器类别")));
const author = await textbookAnswer("《歌唱祖国》是谁写的？");
assert.equal(author.shortAnswer, "《歌唱祖国》的词曲作者是王莘。");
const lyrics = await textbookAnswer("《歌唱祖国》的作词是谁？");
assert.equal(lyrics.shortAnswer, "《歌唱祖国》的词作者是王莘。");
assert(lyrics.evidence.every(item => /作词|词曲作者/.test(item.summary)));
const workMeter = await textbookAnswer("《歌唱祖国》是什么拍号？");
assert.equal(workMeter.shortAnswer, "《歌唱祖国》的拍号标为 2/4。");

const questions = ["《游击队歌》的音乐特点是什么？", "《游击队歌》为什么给人轻快机智的感觉？", "《保卫黄河》的作曲家是谁？", "《保卫黄河》和哪些音乐知识点相关？", "七至九年级关于节奏的知识如何递进？", "比较《保卫黄河》和《游击队歌》。", "教材里有哪些蒙古族音乐作品？", `贝多芬在${PUBLISHED_BOOK_COUNT_LABEL}教材中出现在哪里？`, "什么是进行曲？教材有哪些相关作品？", "如果我是音乐教师，怎样用图谱讲“节奏”？"];
const results = [], original = JSON.stringify(graph);
for (const question of questions) {
  const retrieval = await enrichGraph(graph, question, [], load), result = graphAnswer(retrieval, question);
  assert(retrieval.centers.length, `No entity linked: ${question}`);
  assert(result.evidence.length, `No evidence: ${question}`);
  assert.equal(result.candidateKnowledge.length, 0);
  assert(result.graphFocus.nodeIds.every(id => graph.entities.some(entity => entity.id === id)));
  results.push({ question, intent: retrieval.intent, centers: retrieval.centers.map(entity => entity.name), relationshipCount: retrieval.relationships.length, evidenceCount: result.evidence.length, answer: result.answer, confidence: result.confidence, auxiliaryExplanation: result.auxiliaryExplanation });
}
assert.equal(JSON.stringify(graph), original, "Retrieval mutated research graph");
assert(results[2].answer.includes("冼星海"));
assert(!results[2].answer.includes("改编者"));
assert.equal(results[1].confidence, "limited");
assert(!results[3].answer.includes("收录作品："));
assert(results[7].answer.includes("九年级下册"));
assert(!results[7].answer.includes("游击队歌"));
assert(results[4].answer.includes("不代表学习顺序"));
assert.equal(recognizeIntent(questions[5]), "compare");
const pathResult = graphAnswer(await enrichGraph(graph, "保卫黄河和冼星海的最短路径", [], load), "保卫黄河和冼星海的最短路径");
assert(pathResult.answer.includes("最少经过 1 步"));
const center = linkEntities(graph, "游击队歌为什么听起来很轻快？")[0];
assert(center.name.includes("游击队歌"));
assert.equal(linkEntities(graph, "它的作曲家是谁？", [{ question: "游击队歌", answer: "虚构历史答案", resolvedEntities: [center.id] }])[0].id, center.id);
const worker = (await compile("worker/ai-api.ts")).default;
const env = { ALLOWED_ORIGIN: "https://zpw0211-netizen.github.io", GRAPH_DATA_URL: "https://zpw0211-netizen.github.io/lezhi-music-graph/data", AI_RATE_LIMIT: { limit: async () => ({ success: true }) } };
assert.equal((await worker.fetch(new Request("https://api.test/ask", { method: "POST", headers: { origin: "https://evil.example" } }), env)).status, 403);
const options = await worker.fetch(new Request("https://api.test/ask", { method: "OPTIONS", headers: { origin: env.ALLOWED_ORIGIN } }), env);
assert.equal(options.status, 204); assert.equal(options.headers.get("Access-Control-Allow-Origin"), env.ALLOWED_ORIGIN);
assert.equal((await worker.fetch(new Request("https://api.test/ask", { method: "POST", headers: { origin: env.ALLOWED_ORIGIN } }), env)).status, 503);
const { generateAnswer } = await compile("app/lib/ai/response-generation.ts");
const retrieval = await enrichGraph(graph, questions[2], [], load);
const mockModel = async (_url, options) => {
  const request = JSON.parse(options.body);
  assert.equal(request.model, "deepseek-v4-flash"); assert.equal(request.response_format.type, "json_object"); assert.match(_url, /\/chat\/completions$/);
  return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ answer: "《保卫黄河》的作曲家是冼星海。", shortAnswer: "冼星海。", auxiliaryExplanation: "", usedEvidenceIds: [retrieval.evidence[0].id], confidence: "supported" }) } }] });
};
assert.equal((await generateAnswer(retrieval, questions[2], [], { apiKey: "mock-key", model: "deepseek-v4-flash" }, mockModel)).poweredBy, "gpt");
const auditOutputDirectory = new URL("../.tmp-audit/", import.meta.url);
await mkdir(auditOutputDirectory, { recursive: true });
await writeFile(
  new URL("retrieval-results.json", auditOutputDirectory),
  JSON.stringify({ mode: "local-rule-based-not-live-GPT", results }, null, 2),
);
console.log(`AI_RETRIEVAL_AUDIT_PASSED questions=${results.length} canonical=${graph.entities.length}/${graph.relationships.length} readonly=true model=mock_only`);
