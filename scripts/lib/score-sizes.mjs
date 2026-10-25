// 从 public/media/scores 下的 WebP 文件头读出宽高，写成 app/lib/lesson/score-sizes.ts。
// 各版本的谱例图路径相同（media/scores/<册>/<作品>-n.webp），所以每个版本构建时按自己的图重写一遍。
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

export function webpSize(buffer) {
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8 ") return [buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff];
  if (chunk === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
  }
  if (chunk === "VP8X") return [buffer.readUIntLE(24, 3) + 1, buffer.readUIntLE(27, 3) + 1];
  throw new Error(`unknown WebP chunk ${chunk}`);
}

export function writeScoreSizes(root) {
  const scores = path.join(root, "public", "media", "scores");
  const entries = [];
  for (const book of existsSync(scores) ? readdirSync(scores).sort() : []) {
    for (const file of readdirSync(path.join(scores, book)).filter((name) => name.endsWith(".webp")).sort()) {
      const [width, height] = webpSize(readFileSync(path.join(scores, book, file)));
      entries.push(`  "media/scores/${book}/${file}": [${width}, ${height}],`);
    }
  }
  writeFileSync(path.join(root, "app", "lib", "lesson", "score-sizes.ts"), [
    "// 教材谱例图片的固有尺寸，由生成后的 WebP 图片读取（scripts/lib/score-sizes.mjs）。",
    "// 用于 LessonPage 谱例 <img> 的 width/height 属性，避免懒加载撑开布局（CLS）。",
    "export const SCORE_SIZES: Record<string, readonly [number, number]> = {",
    ...entries,
    "};",
    "",
  ].join("\n"));
  return entries.length;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` || import.meta.url === `file://${process.argv[1]}`) {
  console.log(`SCORE_SIZES_WRITTEN ${writeScoreSizes(process.cwd())}`);
}
