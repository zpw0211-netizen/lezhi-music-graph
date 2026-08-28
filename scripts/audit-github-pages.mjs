import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const basePath = "/lezhi-music-graph";
const root = path.resolve("dist/client/lezhi-music-graph");
const requiredFiles = [
  ".nojekyll",
  "index.html",
  "404.html",
  "favicon.svg",
  "og.png",
  "data/music-graph.json",
  "data/canonical-graph.json",
  "data/graph-quality.json",
];

for (const relativePath of requiredFiles) {
  await access(path.join(root, relativePath));
}

const indexHtml = await readFile(path.join(root, "index.html"), "utf8");
assert(
  indexHtml.includes("芽谱——中小学音乐教育知识图谱与智能分析平台"),
  "页面标题没有同步为芽谱",
);
assert(
  indexHtml.includes(`${basePath}/_next/`),
  "HTML 未使用 GitHub Pages basePath 加载前端资源",
);
assert(
  !/(?:src|href)=["']\/(?!lezhi-music-graph\/)/.test(indexHtml),
  "HTML 仍包含绕过 basePath 的根目录资源路径",
);
assert(
  indexHtml.includes(
    "https://zpw0211-netizen.github.io/lezhi-music-graph/og.png",
  ),
  "GitHub Pages 分享预览地址不正确",
);

const chunkRoot = path.join(root, "_next", "static", "chunks");
const chunkFiles = (await walk(chunkRoot)).filter((file) =>
  file.endsWith(".js"),
);
const pageChunks = chunkFiles.filter((file) =>
  /^page-[^/\\]+\.js$/.test(path.basename(file)),
);
assert(pageChunks.length > 0, "未找到页面客户端脚本");
const pageBundle = (
  await Promise.all(pageChunks.map((file) => readFile(file, "utf8")))
).join("\n");

for (const forbidden of [
  "/api/ask",
  "/api/import",
  "signin-with-chatgpt",
  "signout-with-chatgpt",
  "oai-authenticated-user-",
]) {
  assert(!pageBundle.includes(forbidden), `静态页面仍依赖 ${forbidden}`);
}
assert(
  pageBundle.includes(basePath) &&
    pageBundle.includes("data/music-graph.json") &&
    pageBundle.includes("data/canonical-graph.json"),
  "页面客户端脚本没有使用 basePath 读取静态图谱数据",
);

console.log(
  `GITHUB_PAGES_AUDIT_PASSED files=${requiredFiles.length} chunks=${chunkFiles.length}`,
);

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await walk(fullPath)));
    else output.push(fullPath);
  }
  return output;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
