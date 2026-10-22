import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const base = path.join(root, "editions", "renjiao");
const out = path.join(root, "editions", "renjiao-staff", "data", "edition-differences.md");
const registry = JSON.parse(await readFile(path.join(base, "data", "books.json"), "utf8"));
const scorePages = JSON.parse(await readFile(path.join(base, "data", "lesson-scores.json"), "utf8"));
const normalize = (value) => String(value).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
const rows = [];
const summaries = [];

for (const book of registry.books) {
  const modulePath = path.join(base, "content", "textbooks", `${book.key}.mjs`);
  const { default: textbook } = await import(pathToFileURL(modulePath).href);
  const worksByTitle = new Map();
  for (const part of textbook.parts ?? []) {
    for (const work of part.works ?? []) {
      if (!["歌曲", "音乐作品", "乐曲"].includes(work.type) && !work.scores?.length) continue;
      const key = normalize(work.name);
      const group = worksByTitle.get(key) ?? { title: work.name, units: new Set(), pages: new Set(), moduleScorePages: new Set() };
      if (work.unit != null) group.units.add(work.unit);
      if (Number.isFinite(work.page)) group.pages.add(work.page);
      for (const item of work.scores ?? []) {
        const page = Array.isArray(item) ? item[0] : item.page;
        if (Number.isFinite(page)) group.moduleScorePages.add(page);
      }
      worksByTitle.set(key, group);
    }
  }

  let cropCount = 0;
  let baselineIssues = 0;
  for (const group of worksByTitle.values()) {
    const entry = Object.entries(scorePages[book.key] ?? {}).find(([title]) => normalize(title) === normalize(group.title));
    const crops = entry?.[1] ?? [];
    const cropPageList = [...new Set(crops.map((item) => Array.isArray(item) ? item[0] : item.page).filter(Number.isFinite))].sort((a,b)=>a-b);
    const pageList = [...group.pages].sort((a,b)=>a-b);
    const moduleCropList = [...group.moduleScorePages].sort((a,b)=>a-b);
    const moduleMapMatches = JSON.stringify(cropPageList) === JSON.stringify(moduleCropList);
    const pagesInBook = cropPageList.every((page) => Number.isInteger(page) && page >= 1 && page <= book.pages);
    const coordinatesValid = crops.every((item) => {
      if (!Array.isArray(item) || item.length < 5) return false;
      const [, x0, y0, x1, y1] = item;
      return [x0,y0,x1,y1].every(Number.isFinite) && x0 >= 0 && y0 >= 0 && x1 <= 1 && y1 <= 1 && x0 < x1 && y0 < y1;
    });
    if (cropPageList.length) cropCount += 1;
    if (!pageList.length || !moduleMapMatches || !pagesInBook || !coordinatesValid) baselineIssues += 1;

    const status = !pageList.length
      ? "人教简谱目录页码缺失"
      : !moduleMapMatches || !pagesInBook || !coordinatesValid
        ? "人教简谱目录/裁图数据需复核"
        : cropPageList.length
          ? "简谱页码与裁剪框有效；人教五线谱页待核"
          : "简谱目录页有效、无裁图；人教五线谱页待核";
    rows.push({ book: book.fullName, key: book.key, units: [...group.units].sort((a,b)=>a-b), title: group.title, pageList, cropPageList, status });
  }
  summaries.push({ book: book.fullName, key: book.key, pages: book.pages, songs: worksByTitle.size, scoreMaps: cropCount, baselineIssues });
}

const md = [
  "# 人教版简谱 / 五线谱逐首差异清单（扫描到位前草稿）",
  "",
  "> 状态：对 `editions/renjiao` 的每首/段作品去重后，核对了人教简谱目录页、`lesson-scores.json` 页码、裁剪框范围和教材总页数。人教五线谱页码与裁剪边界必须依据该册真实五线谱扫描逐首补核；此草稿不可用于发布。",
  "> 来源审计：本机 `E:/Projects/textbook-scan/wx-*` 是人音版扫描。抽查 `wx-g7s1/orig/p04.jpg` 的版权页标明“人民音乐出版社”；`pep-*` 现存页是人教版简谱。未发现人教五线谱扫描目录。",
  "",
  "## 册目核对摘要",
  "",
  "|册目|册键|教材页数|去重作品数|已有简谱裁图映射|简谱基准异常|五线谱扫描状态|",
  "|---|---|---:|---:|---:|---:|---|",
  ...summaries.map((item) => `|${item.book}|\`${item.key}\`|${item.pages}|${item.songs}|${item.scoreMaps}|${item.baselineIssues}|待扫描|`),
  "",
  "## 逐首差异",
  "",
  "|册目|册键|单元|作品|当前人教简谱页|简谱裁图页|人教五线谱页|核对状态|",
  "|---|---|---:|---|---|---|---:|---|",
  ...rows.map((item) => `|${item.book}|\`${item.key}\`|${item.units.join("、")}|${String(item.title).replaceAll("|", "\\|")}|${item.pageList.join("、") || "缺失"}|${item.cropPageList.join("、") || "无裁图"}|待扫描|${item.status}|`),
  "",
  `共 ${rows.length} 首/段不同作品；五线谱页码与裁剪尚待扫描核对。`,
  "",
].join("\n");
await writeFile(out, md, "utf8");
console.log(JSON.stringify({ out, books: summaries.length, uniqueWorks: rows.length, baselineIssues: summaries.reduce((sum, book) => sum + book.baselineIssues, 0) }, null, 2));
