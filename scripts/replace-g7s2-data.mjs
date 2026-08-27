import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const siteRoot = process.cwd();
const datasetPath = path.join(siteRoot, "public", "data", "music-graph.json");
const replacementPath = path.resolve(siteRoot, "..", "..", "outputs", "20260827-qixia-full", "七年级下册_网站图谱数据.json");

const [dataset, replacement] = await Promise.all([
  readFile(datasetPath, "utf8").then(JSON.parse),
  readFile(replacementPath, "utf8").then(JSON.parse),
]);

if (replacement.key !== "g7s2") throw new Error("替换数据不是七年级下册 g7s2");
const index = dataset.books.findIndex((book) => book.key === "g7s2");
if (index < 0) throw new Error("网站数据中未找到七年级下册");

dataset.books[index] = replacement;
dataset.version = "2026-08-27-g7s2-high-quality";
dataset.generatedAt = new Date().toISOString();
dataset.qualityPolicy = {
  ...dataset.qualityPolicy,
  g7s2: "教材明示、乐谱可见、教材归纳分层；分析性补充默认不发布",
};

await writeFile(datasetPath, JSON.stringify(dataset), "utf8");
console.log(JSON.stringify({
  path: datasetPath,
  key: replacement.key,
  entities: replacement.entityCount,
  triples: replacement.tripleCount,
  candidates: replacement.reviewCount,
  otherBooksPreserved: dataset.books.filter((book) => book.key !== "g7s2").length,
}, null, 2));
