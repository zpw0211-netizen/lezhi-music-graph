// Builds editions/renjiao/content/textbooks/pep-<book>.mjs from each book's 目录 plus the transcribed melodies.
// Input: editions/renjiao/data/toc/<book>.json (read from the PDF text layer by position and checked
// against the 目录 page images) and app/lib/lesson/melodies-pep-<book>.ts.
// - Every 目录 item becomes an entry under its unit with its section (栏目) as the learning mode.
// - Items with a transcribed melody, a score crop, or a song section become musical works.
// - A melody whose title is not a 目录 item is added as a work at the page its transcription cites.
// Per-page facts are kept in editions/renjiao/data/lesson-facts.mjs.
// Usage: node editions/renjiao/scripts/build-sources-from-toc.mjs [book …]
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const EDITION = path.join(ROOT, "editions", "renjiao");
const TOC_DIR = path.join(EDITION, "data", "toc");
const registry = JSON.parse(readFileSync(path.join(EDITION, "data", "books.json"), "utf8"));
const scorePages = JSON.parse(readFileSync(path.join(EDITION, "data", "lesson-scores.json"), "utf8"));
const NUMERALS = "一二三四五六七八九十";
const bare = (name) => String(name).replace(/^《|》$/g, "").replace(/\s+/g, "");
const SONG_SECTIONS = new Set(["小小歌唱家", "印在心里的歌"]);

function melodyPages(book) {
  const text = readFileSync(path.join(ROOT, "app", "lib", "lesson", `melodies-pep-${book}.ts`), "utf8");
  const pages = new Map();
  const keyPattern = /^ {2}"([^"]+)":\s*\[/gm;
  let match;
  while ((match = keyPattern.exec(text))) {
    const page = text.slice(match.index).match(/segment\(B,\s*"?(\d+)/);
    pages.set(bare(match[1]), { page: page ? Number(page[1]) : null, title: match[1].replace(/^《|》$/g, "") });
  }
  return pages;
}

for (const book of process.argv.slice(2).length ? process.argv.slice(2) : registry.books.map((b) => b.key.replace(/^pep-/, "")).filter((b) => b !== "g1s1")) {
  const info = registry.books.find((b) => b.key === `pep-${book}`);
  const toc = JSON.parse(readFileSync(path.join(TOC_DIR, `${book}.json`), "utf8"));
  // Units in book order; 印在心里的歌 (secondary books) comes last as its own section.
  const order = (name) => (name.startsWith("第") ? NUMERALS.indexOf(name[1]) + 1 : 99);
  const units = toc.units.map((u) => ({ ...u, items: [...u.items] })).sort((a, b) => order(a.unit) - order(b.unit));
  // Items the layout reader could not place (a column offset) join the unit whose pages contain them.
  for (const item of toc.front ?? []) {
    const host = [...units].reverse().find((u) => u.items.length && u.items[0][2] <= item[2]) ?? units[0];
    host.items.push(item);
  }
  units.forEach((u) => u.items.sort((a, b) => a[2] - b[2]));
  // A blank section label continues the label above it (one tag spans two lines on the page).
  units.forEach((u) => u.items.forEach((item, i) => { if (!item[0]) item[0] = i ? u.items[i - 1][0] : ""; }));

  const melodies = melodyPages(book);
  const scoresFor = (title) => scorePages[`pep-${book}`]?.[bare(title)] ?? [];
  const outputScores = Object.fromEntries(
    Object.entries(scorePages[`pep-${book}`] ?? {}).map(([title, pages]) => [bare(title), pages]),
  );
  const used = new Set();
  const contents = units.map((u, i) => {
    const no = i + 1;
    const unitName = u.unit.startsWith("第") ? `${u.unit} ${u.title}` : u.title;
    const seen = new Set();
    const items = [];
    for (const [section, title, page] of u.items) {
      if (seen.has(bare(title))) continue;
      seen.add(bare(title));
      const mode = section.startsWith("学习项目") ? "学习项目" : section;
      const isWork = melodies.has(bare(title)) || SONG_SECTIONS.has(mode) || scoresFor(title).length > 0;
      if (melodies.has(bare(title))) used.add(bare(title));
      items.push([mode, title, page, isWork ? (SONG_SECTIONS.has(mode) ? "歌曲" : "音乐作品") : mode]);
    }
    return { no, name: unitName, page: items[0]?.[2] ?? u.items[0]?.[2] ?? 1, items };
  });
  const added = [];
  for (const [name, { page, title }] of melodies) {
    if (used.has(name) || page == null) continue;
    const unit = [...contents].reverse().find((u) => u.items.length && u.items[0][2] <= page) ?? contents[0];
    if (unit.items.some((item) => bare(item[1]) === name)) continue;
    const before = [...unit.items].reverse().find((item) => item[2] <= page) ?? unit.items[0];
    unit.items.push([before?.[0] ?? "学习项目", title, page, "音乐作品"]);
    unit.items.sort((a, b) => a[2] - b[2]);
    added.push(`${title}(${page})`);
  }

  const lines = contents.map((u) => `  [${u.no}, ${JSON.stringify(u.name)}, ${u.page}, [\n${u.items.map((item) => `    ${JSON.stringify(item)},`).join("\n")}\n  ]],`);
  const source = `import { factsForItem } from "../../data/lesson-facts.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》${info.fullName}（简谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-${book}",
  title: "${info.title}",
  pdfOffset: ${info.pdfOffset},
  book: [
    ["出版机构", "人民教育出版社", "机构", "明", { pdf: 3 }],
    ["编著", "课程教材研究所", "机构", "明", { pdf: 3 }],
    ["记谱方式", "简谱", "音乐概念", "明", { pdf: 3 }],
  ],
  parts: [],
};

// [单元序号, 单元名, 单元起始页, [[栏目, 标题, 页码, 类型], …]]
const CONTENTS = [
${lines.join("\n")}
];

const SCORE_PAGES = ${JSON.stringify(outputScores)};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\\s+/g, "")] ?? [];

textbook.parts = CONTENTS.map(([no, name, page, items]) => ({
  units: [{ no, name, page, facts: [] }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-${book}", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));

export default textbook;
`;
  writeFileSync(path.join(EDITION, "content", "textbooks", `pep-${book}.mjs`), source);
  const works = contents.flatMap((u) => u.items).filter((item) => item[3] === "歌曲" || item[3] === "音乐作品").length;
  console.log(`pep-${book}: ${contents.length} units, ${contents.reduce((n, u) => n + u.items.length, 0)} items, ${works} works; melody-only works added: ${added.join("、") || "none"}`);
}
