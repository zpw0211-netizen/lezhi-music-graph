import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { EDITION, PUBLISHED_BOOK_KEYS, PUBLISHED_EDITION_LABEL } from "../data/books.mjs";

// The 人音版 app lives under NEXT_PUBLIC_BASE_PATH (/renyin on yapu.studio); the entry page is at the root.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");
const artifactRoot = path.resolve("dist/client");
const root = basePath ? path.join(artifactRoot, basePath.replace(/^\/+/, "")) : artifactRoot;
const publicRoot = path.resolve("public");
const requiredFiles = [
  ".nojekyll",
  "index.html",
  "404.html",
  "favicon.svg",
  "favicon.ico",
  "apple-touch-icon.png",
  "og.jpg",
  "data/graph-quality.json",
  "data/graph-index.json",
  ...PUBLISHED_BOOK_KEYS.flatMap((key) => [`data/books/${key}.json`, `data/evidence/${key}.json`]),
];
// .nojekyll belongs at the artifact root; with a base path it is checked with the entry page below.
if (basePath) requiredFiles.splice(requiredFiles.indexOf(".nojekyll"), 1);
const excludedFiles = [
  "data/music-graph.json",
  "data/canonical-graph.json",
];

for (const relativePath of requiredFiles) {
  await access(path.join(root, relativePath));
}

for (const relativePath of excludedFiles) {
  assert(
    !(await exists(path.join(root, relativePath))),
    `Pages 产物不应包含 ${relativePath}`,
  );
}

for (const directory of [
  { path: "data/evidence", extension: ".json" },
  { path: "data/details", extension: ".json" },
  { path: "data/books", extension: ".json" },
  { path: "media/scores", extension: null },
]) {
  const sourceDirectory = path.join(publicRoot, directory.path);
  const artifactDirectory = path.join(root, directory.path);
  const sourceFiles = (await walk(sourceDirectory))
    .filter((file) => directory.extension === null || file.endsWith(directory.extension))
    .map((file) => path.relative(sourceDirectory, file).split(path.sep).join("/"))
    .sort();
  const artifactFiles = (await walk(artifactDirectory))
    .filter((file) => directory.extension === null || file.endsWith(directory.extension))
    .map((file) => path.relative(artifactDirectory, file).split(path.sep).join("/"))
    .sort();

  // A new edition may publish its tables of contents before any score crops exist.
  assert(sourceFiles.length > 0 || directory.path === "media/scores", `源目录为空：${directory.path}`);
  assert(
    JSON.stringify(sourceFiles) === JSON.stringify(artifactFiles),
    `Pages 产物未完整包含运行时资源：${directory.path}`,
  );
}

const imagePath = path.join(root, "og.jpg");
const imageInfo = await readFile(imagePath);
const imageStat = await stat(imagePath);
assert(imageStat.size <= 300 * 1024, "分享图超过 300 KB");
const dimensions = readJpegDimensions(imageInfo);
assert(
  dimensions.width === 1200 && dimensions.height === 630,
  `分享图尺寸改变：${dimensions.width}x${dimensions.height}`,
);

const indexHtml = await readFile(path.join(root, "index.html"), "utf8");
assert(
  indexHtml.includes(`芽谱 · ${EDITION.label}${PUBLISHED_EDITION_LABEL}音乐教材`),
  "页面标题没有同步为芽谱",
);
assert(
  indexHtml.includes(`${basePath}/_next/`),
  `HTML 未从 ${basePath || "/"} 加载前端资源`,
);
assert(
  !indexHtml.includes("/lezhi-music-graph/"),
  "HTML 仍包含旧 GitHub Pages 子目录路径",
);
assert(
  indexHtml.includes(
    `https://yapu.studio${basePath}/og.jpg`,
  ),
  "GitHub Pages 分享预览地址不正确",
);

const chunkRoot = path.join(root, "_next", "static", "chunks");
const chunkFiles = (await walk(chunkRoot)).filter((file) =>
  file.endsWith(".js"),
);
// The app is split into a small page chunk plus lazily loaded page chunks, so
// check all application chunks. Framework/runtime chunks are excluded: vinext's
// router entry (index-*) lists every route, including the Sites-only API routes.
const RUNTIME_CHUNK = /^(framework|index|rolldown-runtime|layout-segment-context)-[^/\\]+\.js$/;
assert(
  chunkFiles.some((file) => /^page-[^/\\]+\.js$/.test(path.basename(file))),
  "未找到页面客户端脚本",
);
const appChunks = chunkFiles.filter((file) => !RUNTIME_CHUNK.test(path.basename(file)));
const pageBundle = (
  await Promise.all(appChunks.map((file) => readFile(file, "utf8")))
).join("\n");

for (const forbidden of [
  "/api/ask",
  "/api/import",
  "signin-with-chatgpt",
  "signout-with-chatgpt",
  "oai-authenticated-user-",
]) {
  assert(!pageBundle.includes(forbidden), `静态页面仍依赖 ${forbidden}`);
}
assert(
  !pageBundle.includes("/lezhi-music-graph/") &&
    (!basePath || pageBundle.includes(basePath)) &&
    pageBundle.includes("data/graph-index.json") &&
    pageBundle.includes("data/evidence/"),
  "页面客户端脚本没有从站点路径读取静态图谱数据",
);

if (basePath && process.env.PAGES_ENTRY !== "0") {
  // Entry page at the domain root: links to the 人音版 module, forwards old #/ links, has its own icons.
  const portal = await readFile(path.join(artifactRoot, "index.html"), "utf8");
  assert(portal.includes("人音版教科书") && portal.includes("人教版教科书"), "入口页缺少教材板块");
  assert(portal.includes(`href="${basePath}/"`), `入口页没有链接到 ${basePath}/`);
  assert(portal.includes(`location.replace("${basePath}/"`), "入口页没有把旧链接转到人音版");
  for (const file of [".nojekyll", "404.html", "favicon.ico", "favicon.svg", "apple-touch-icon.png", "portal-kai.woff2"])
    await access(path.join(artifactRoot, file));
  assert(!(await exists(path.join(artifactRoot, "_next"))), "根目录残留应用资源 _next");
}

console.log(
  `GITHUB_PAGES_AUDIT_PASSED files=${requiredFiles.length} chunks=${chunkFiles.length}`,
);

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await walk(fullPath)));
    else output.push(fullPath);
  }
  return output;
}

function readJpegDimensions(buffer) {
  let offset = 2;
  const startOfFrame = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] !== 0xff) offset++;
    while (offset < buffer.length && buffer[offset] === 0xff) offset++;
    const marker = buffer[offset++];
    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      continue;
    }
    const segmentLength = buffer.readUInt16BE(offset);
    if (startOfFrame.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }
    offset += segmentLength;
  }
  throw new Error("无法从 JPEG 读取尺寸");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
