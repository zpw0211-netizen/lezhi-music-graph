import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const siteRoot = process.cwd();
const datasetPath = path.join(siteRoot, "public", "data", "music-graph.json");
const outputRoot = path.resolve(siteRoot, "..", "..", "outputs", "20260828-five-books-high-quality");
const replacements = [
  ["g7s1", "七年级上册_网站图谱数据.json"],
  ["g8s1", "八年级上册_网站图谱数据.json"],
  ["g8s2", "八年级下册_网站图谱数据.json"],
  ["g9s1", "九年级上册_网站图谱数据.json"],
  ["g9s2", "九年级下册_网站图谱数据.json"],
];

const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
const loaded = await Promise.all(replacements.map(async ([key, file]) => {
  const book = JSON.parse(await readFile(path.join(outputRoot, file), "utf8"));
  if (book.key !== key) throw new Error(`${file} 的教材键应为 ${key}，实际为 ${book.key}`);
  return book;
}));

for (const book of loaded) {
  const index = dataset.books.findIndex((current) => current.key === book.key);
  if (index < 0) throw new Error(`网站数据中未找到 ${book.key}`);
  dataset.books[index] = book;
}

dataset.version = "2026-08-28-six-books-high-quality";
dataset.generatedAt = new Date().toISOString();
dataset.qualityPolicy = {
  ...dataset.qualityPolicy,
  overall: "仅发布置信度不低于0.90且具有证据链的三元组；重复关系、页码坐标等低价值结构信息不进入公开图谱。",
  g7s1: "教材明示、目录与乐谱可见信息优先；教学性补充与资源槽位单独标明来源。",
  g8s1: "教材明示、目录与乐谱可见信息优先；教学性补充与资源槽位单独标明来源。",
  g8s2: "教材明示、目录与乐谱可见信息优先；教学性补充与资源槽位单独标明来源。",
  g9s1: "教材明示、目录与乐谱可见信息优先；需OCR复核的候选关系不公开。",
  g9s2: "教材明示、目录与乐谱可见信息优先；需OCR复核的候选关系不公开。",
};

await writeFile(datasetPath, JSON.stringify(dataset), "utf8");

const summary = dataset.books.map((book) => ({
  key: book.key,
  title: book.title,
  entities: book.entityCount,
  triples: book.tripleCount,
  candidates: book.reviewCount,
}));
console.log(JSON.stringify({ path: datasetPath, version: dataset.version, books: summary }, null, 2));
