// T009 示例问题自测：逐题运行智能问答的本地图谱检索，验证首页「常用问题」
// 每个示例都能得到非空回答且引用教材证据。
//
// 运行：node scripts/test-sample-questions.mjs   （退出码 0 = 全部通过）
//
// 原理：问答页是纯客户端检索 —— enrichGraph(graph, q, history, load) +
// graphAnswer(retrieval, q)，graph 来自 public/data/graph-index.json 的
// canonicalGraph，证据来自 public/data/evidence/<册>.json。本脚本用
// typescript 把 app/lib/ai/graph-rag.ts 及其依赖（graph-runtime、
// graph-algorithms）在内存里转成 CommonJS 后直接调用同一条链路，不启服务、
// 不发网络请求。问题清单直接从 app/components/assistant/AssistantPage.tsx
// 的 SAMPLE_QUESTIONS 常量提取，页面与本脚本不会各自维护一份。
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pageFile = path.join(root, "app/components/assistant/AssistantPage.tsx");

// --- 从页面源码提取 SAMPLE_QUESTIONS 字面量（纯数据，无 JSX） ---
const pageSource = readFileSync(pageFile, "utf8");
const match = pageSource.match(/export const SAMPLE_QUESTIONS = (\{[\s\S]*?\}) as const;/);
if (!match) throw new Error("AssistantPage.tsx 中找不到 SAMPLE_QUESTIONS 常量（结构变更请同步本脚本）");
const SAMPLE_QUESTIONS = new Function(`return ${match[1]}`)();

// --- 内存 CommonJS 注册表：graph-rag 的依赖闭包（无第三方运行时依赖） ---
const sources = new Map();
const loaded = new Map();
for (const rel of ["app/lib/ai/graph-rag.ts", "app/graph-runtime.ts", "app/lib/graph/graph-algorithms.ts", "app/lib/graph/types.ts"]) {
  const source = readFileSync(path.join(root, rel), "utf8");
  sources.set(rel.replace(/\\/g, "/"), ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText);
}
const resolveTs = (spec, from) => {
  let p = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec));
  return p.endsWith(".ts") ? p : `${p}.ts`;
};
const loadTs = (rel) => {
  if (!sources.has(rel)) throw new Error(`graph-rag 出现未收录的新依赖：${rel}（请把该文件加进本脚本的 sources 清单）`);
  if (loaded.has(rel)) return loaded.get(rel);
  const module_ = { exports: {} };
  loaded.set(rel, module_.exports);
  new Function("exports", "require", "module", "__filename", "__dirname", sources.get(rel))(
    module_.exports,
    (spec) => loadTs(resolveTs(spec, rel)),
    module_,
    rel,
    path.posix.dirname(rel),
  );
  return module_.exports;
};
const { enrichGraph, graphAnswer } = loadTs("app/lib/ai/graph-rag.ts");

const graph = JSON.parse(readFileSync(path.join(root, "public/data/graph-index.json"), "utf8")).canonicalGraph;
const evidenceCache = new Map();
const load = async (key) => {
  if (!evidenceCache.has(key)) {
    const file = path.join(root, "public/data/evidence", `${key}.json`);
    evidenceCache.set(key, existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {});
  }
  return evidenceCache.get(key);
};

let failures = 0;
let total = 0;
for (const [group, items] of Object.entries(SAMPLE_QUESTIONS)) {
  console.log(`\n[${group === "student" ? "学生常问" : group === "teacher" ? "备课常用" : group}]`);
  for (const { q } of items) {
    total += 1;
    let line;
    try {
      const retrieval = await enrichGraph(graph, q, [], load);
      const result = graphAnswer(retrieval, q);
      const answerEmpty = !result.answer.trim() || !result.shortAnswer.trim();
      const noEvidence = !Array.isArray(result.evidence) || result.evidence.length === 0;
      if (answerEmpty || noEvidence || result.confidence === "insufficient") {
        failures += 1;
        line = `FAIL  ${q}  （answer=${result.answer.trim().length}字 evidence=${result.evidence.length} confidence=${result.confidence}）`;
      } else {
        line = `PASS  ${q}  （${result.shortAnswer.slice(0, 42)}… | 证据 ${result.evidence.length} 条）`;
      }
    } catch (error) {
      failures += 1;
      line = `FAIL  ${q}  （异常：${String(error).slice(0, 80)}）`;
    }
    console.log(line);
  }
}
console.log(`\n${total - failures}/${total} 个示例问题可被本地图谱问答回答`);
if (failures > 0) {
  console.log("SAMPLE_QUESTIONS_TEST_FAILED");
  process.exit(1);
}
console.log("SAMPLE_QUESTIONS_TEST_PASSED");
