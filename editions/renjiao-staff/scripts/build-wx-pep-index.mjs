import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const edition = path.join(root, "editions", "renjiao-staff");
const books = JSON.parse(await readFile(path.join(edition, "data", "books.json"), "utf8"));
const scorePages = JSON.parse(await readFile(path.join(edition, "data", "lesson-scores.json"), "utf8"));
const normalize = (value) => String(value).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:、（）()【】《》“”‘’]/g, "");
const index = { sourceEdition: "renjiao", targetEdition: "renjiao-staff", books: [] };

for (const book of books.books) {
  const modulePath = path.join(edition, "content", "textbooks", `${book.key}.mjs`);
  const { default: textbook } = await import(pathToFileURL(modulePath).href);
  const groups = new Map();
  for (const part of textbook.parts ?? []) {
    for (const work of part.works ?? []) {
      if (!["歌曲", "音乐作品", "乐曲"].includes(work.type) && !work.scores?.length) continue;
      const normalized = normalize(work.name);
      const group = groups.get(normalized) ?? { title: work.name, units: new Set(), pages: new Set(), types: new Set() };
      if (work.unit != null) group.units.add(work.unit);
      if (Number.isInteger(work.page)) group.pages.add(work.page);
      if (work.type) group.types.add(work.type);
      groups.set(normalized, group);
    }
  }

  const cropEntry = (title) => Object.entries(scorePages[book.key] ?? []).find(([name]) => normalize(name) === normalize(title))?.[1] ?? [];
  const works = [...groups.values()].map((group) => ({
    title: group.title,
    units: [...group.units].sort((a, b) => a - b),
    pages: [...group.pages].sort((a, b) => a - b),
    types: [...group.types].sort(),
    scoreCrops: cropEntry(group.title),
  })).sort((a, b) => (a.pages[0] ?? 0) - (b.pages[0] ?? 0) || a.title.localeCompare(b.title, "zh-CN"));

  index.books.push({
    key: book.key,
    title: book.fullName,
    grade: book.grade,
    semester: book.semester,
    printedPages: book.pages,
    pdfOffset: book.pdfOffset,
    works,
  });
}

const out = path.join(edition, "data", "wx-pep-work-index.json");
await writeFile(out, `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ out, books: index.books.length, works: index.books.reduce((sum, book) => sum + book.works.length, 0) }, null, 2));
