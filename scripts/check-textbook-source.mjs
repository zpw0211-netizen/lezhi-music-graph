import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { BOOK_BY_KEY } from "../data/books.mjs";
import { validateTextbookSource } from "./lib/textbook-source-check.mjs";

const key = process.argv[2];
if (!key) {
  console.error("用法：node scripts/check-textbook-source.mjs <册号>");
  process.exitCode = 2;
} else {
  const book = BOOK_BY_KEY.get(key);
  if (!book) {
    console.error(`册目登记表中没有“${key}”。`);
    process.exitCode = 2;
  } else {
    const sourcePath = path.resolve("content", "textbooks", `${key}.mjs`);
    try {
      const sourceText = await readFile(sourcePath, "utf8");
      let source;
      try {
        source = (await import(`${pathToFileURL(sourcePath).href}?check=${Date.now()}`)).default;
      } catch (error) {
        const match = String(error?.stack ?? error).match(/(?:\.mjs|\.js|\.ts):(\d+):\d+/);
        const where = match ? `第 ${match[1]} 行：` : "";
        throw new Error(`${where}教材源文件无法加载：${error.message}`);
      }
      const result = validateTextbookSource(source, { book, sourceText });
      if (result.errors.length) {
        console.error(`教材源文件校验未通过：${key}`);
        for (const message of result.errors) console.error(`- ${message}`);
        process.exitCode = 1;
      } else {
        console.log(`教材源文件校验通过：${book.shortName}（${key}）`);
      }
      console.log(`统计：${result.stats.units} 个单元，${result.stats.works} 个作品，${result.stats.scores} 个谱例框`);
      console.log(`事实层级：明 ${result.layers.明}，谱 ${result.layers.谱}，归 ${result.layers.归}，补 ${result.layers.补}`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
