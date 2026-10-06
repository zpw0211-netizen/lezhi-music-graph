import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { BOOK_BY_KEY } from "../data/books.mjs";
import { flattenTextbookSource } from "./lib/textbook-source-check.mjs";

const key = process.argv[2];
const book = BOOK_BY_KEY.get(key);
if (!book) throw new Error(`册目登记表中没有“${key ?? ""}”。`);

const sourcePath = path.resolve("content", "textbooks", `${key}.mjs`);
const source = (await import(`${pathToFileURL(sourcePath).href}?sheets=${Date.now()}`)).default;
const data = flattenTextbookSource(source);
const offset = Number.isInteger(data.pdfOffset) ? data.pdfOffset : book.pdfOffset ?? 0;
const entries = [];
for (const owner of [...(data.works ?? []), ...(data.concepts ?? [])]) {
  for (const score of owner.scores ?? []) {
    const page = score[0];
    const pdfPage = typeof page === "object" ? page.pdf : page + offset;
    entries.push({
      name: owner.name ?? "未命名",
      pdfPage,
      box: score.slice(1, 5),
      rotate: score[5]?.rotate ?? 0,
    });
  }
}
if (!entries.length) {
  console.log(`没有谱例框：${key}`);
} else {
  const python = "D:\\zhishitupu\\project\\env\\miniconda3\\python.exe";
  const script = path.resolve("scripts", "textbook-score-contact-sheet.py");
  const result = spawnSync(python, [script, key], {
    input: JSON.stringify({ entries }),
    encoding: "utf8",
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    maxBuffer: 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}
