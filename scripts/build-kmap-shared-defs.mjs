// 收集五个版本课本里对知识点的讲解，写成 app/lib/graph/kmap-shared-defs.json。
// 知识图谱里本册（和本版本其他分册）都没讲解的知识点，借用其他版本课本的原文，并注明出自哪本书第几页。
// 课本数据改了以后重新跑一遍：node scripts/build-kmap-shared-defs.mjs
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = [
  ["renyin", "content/textbooks"],
  ["renjiao", "editions/renjiao/content/textbooks"],
  ["xiangyi", "editions/xiangyi/content/textbooks"],
  ["huacheng", "editions/huacheng/content/textbooks"],
  ["gaozhong", "editions/gaozhong/content/textbooks"],
];
// 和 kmap.ts 保持一致。
const KTYPES = new Set(["音乐概念", "节奏型", "拍号", "速度术语", "音乐体裁", "表演形式"]);
const DEF_PREDICATES = new Set(["定义为", "含义", "特点", "作用", "记法", "强弱规律", "典型节奏"]);
const PER_NAME = 4; // 每个名字最多留几条（各版本各一条）

const byName = new Map();
for (const [edition, dir] of SOURCES) {
  const files = (await readdir(path.join(root, dir))).filter((file) => file.endsWith(".mjs")).sort();
  for (const file of files) {
    const book = (await import(pathToFileURL(path.join(root, dir, file)).href)).default;
    if (!book?.title) continue;
    for (const part of book.parts ?? []) {
      for (const concept of part.concepts ?? []) {
        if (!KTYPES.has(concept.type) || !concept.name) continue;
        for (const fact of concept.facts ?? []) {
          const [predicate, text, objectType, layer, page] = fact;
          if (!DEF_PREDICATES.has(predicate) || objectType != null || typeof text !== "string" || !text.trim()) continue;
          if (layer !== "明" && layer !== "归") continue;
          const list = byName.get(concept.name) ?? [];
          if (list.some((item) => item.e === edition) || list.length >= PER_NAME) continue;
          list.push({ e: edition, label: predicate === "定义为" ? "定义" : predicate, text: text.trim(), book: book.title, ...(Number.isInteger(page ?? concept.page) ? { page: page ?? concept.page } : {}) });
          byName.set(concept.name, list);
        }
      }
    }
  }
}
const out = Object.fromEntries([...byName.entries()].sort(([a], [b]) => a.localeCompare(b, "zh")));
const target = path.join(root, "app/lib/graph/kmap-shared-defs.json");
await writeFile(target, JSON.stringify(out) + "\n");
console.log(`${byName.size} 个知识点的讲解 → ${path.relative(root, target)}`);
