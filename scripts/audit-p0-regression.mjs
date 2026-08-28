import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const data = JSON.parse(
  await readFile(new URL("public/data/music-graph.json", root), "utf8"),
);
const pageSource = await readFile(new URL("app/page.tsx", root), "utf8");
const schemaSource = await readFile(new URL("app/graph-schema.ts", root), "utf8");
const failures = [];

const requireValue = (condition, message) => {
  if (!condition) failures.push(message);
};

requireValue(data.books?.length === 6, "必须保留六册教材数据");
for (const book of data.books ?? []) {
  requireValue(book.entities?.length > 0, `${book.key}: 实体为空`);
  requireValue(book.triples?.length > 0, `${book.key}: 关系为空`);
  for (const triple of book.triples ?? []) {
    requireValue(
      book.evidenceByTriple?.[triple.id]?.length > 0,
      `${book.key}: 关系 ${triple.id} 缺少教材证据`,
    );
  }
}

const allEntities = data.books.flatMap((book) => book.entities ?? []);
for (const keyword of ["游击队歌", "贺绿汀", "二胡", "音乐概念", "音乐体裁", "地域"]) {
  requireValue(
    allEntities.some(
      (entity) =>
        entity.name?.includes(keyword) ||
        entity.type?.includes(keyword) ||
        entity.aliases?.some((alias) => alias.includes(keyword)),
    ),
    `搜索回归样本缺失：${keyword}`,
  );
}

for (const token of [
  "schema-panel",
  "expandNode",
  "onDoubleClick",
  "onContextMenu",
  "graph-context-menu",
  '"overview"',
  '"relations"',
  '"evidence"',
  '"teaching"',
  "作品档案",
  "课堂路径",
  "音频 · 视频 · 乐谱",
]) {
  requireValue(pageSource.includes(token), `P0/旧功能源码标记缺失：${token}`);
}

for (const label of [
  "教材结构",
  "音乐作品",
  "音乐人物",
  "乐器与人声",
  "体裁与曲式",
  "音乐基本要素",
  "音乐理论",
  "地域与文化",
  "实践活动",
  "学习目标与教学",
]) {
  requireValue(schemaSource.includes(label), `Schema 分类缺失：${label}`);
}

if (failures.length) {
  console.error(`P0_REGRESSION_AUDIT_FAILED ${failures.length}`);
  console.error(failures.slice(0, 30).join("\n"));
  process.exit(1);
}

console.log(
  `P0_REGRESSION_AUDIT_PASSED books=${data.books.length} entities=${allEntities.length} triples=${data.books.reduce((sum, book) => sum + book.triples.length, 0)}`,
);
