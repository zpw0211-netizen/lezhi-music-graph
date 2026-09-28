import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { access, mkdir, mkdtemp, readFile, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RECORDINGS_FILE = path.join(PROJECT_ROOT, "app", "lib", "lesson", "recordings.ts");
const SOURCES_FILE = path.join(PROJECT_ROOT, "public", "media", "recordings", "SOURCES.md");
const MEDIA_DIRECTORY = path.join(PROJECT_ROOT, "public", "media", "recordings");
const RECORDING_MARKER = "  // add-recording.mjs appends imported entries above this marker.";
const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
const MAX_PAGE_BYTES = 8 * 1024 * 1024;
const MAX_DURATION_SECONDS = 5 * 60;
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
const AUDIO_EXTENSIONS = new Set([".aac", ".flac", ".m4a", ".mp3", ".ogg", ".opus", ".wav", ".webm"]);

const LICENSE_CATEGORIES = new Set(["公共领域", "CC0", "CC BY", "CC BY-SA"]);

function usage() {
  return "用法：node scripts/add-recording.mjs --csv <T002 CSV> --work <作品名> --source-page <来源页链接>\n需设置 FFMPEG_PATH 指向本机 ffmpeg 可执行文件。";
}

function parseArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--") || !argv[index + 1] || argv[index + 1].startsWith("--")) {
      throw new Error(usage());
    }
    values.set(argument.slice(2), argv[index + 1]);
    index += 1;
  }
  for (const required of ["csv", "work", "source-page"]) {
    if (!values.get(required)?.trim()) throw new Error(usage());
  }
  return values;
}

function parseCsv(text) {
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error("CSV 中存在未闭合的引号。");
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  if (rows.length < 2) throw new Error("CSV 没有候选数据行。");

  const headers = rows[0].map((header, index) => (index === 0 ? header.replace(/^\uFEFF/, "") : header).trim());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function normalizeWorkName(value) {
  return value.replace(/[《》]/g, "").trim();
}

function normalizedPageUrl(value) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  return url.href.replace(/\/$/, "");
}

function isApprovedHost(hostname) {
  const host = hostname.toLowerCase();
  return host === "archive.org" || host.endsWith(".archive.org") || host === "wikimedia.org" || host.endsWith(".wikimedia.org");
}

function assertApprovedHttpsUrl(value, label) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error(`${label} 必须使用 HTTPS。`);
  if (!isApprovedHost(url.hostname)) throw new Error(`${label} 不属于 T002 使用的 Internet Archive / Wikimedia 来源。`);
  return url;
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)));
}

function attributeValue(attributes, name) {
  const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return decodeHtml(match?.[1] ?? match?.[2] ?? match?.[3] ?? "");
}

function licenseFamily(value) {
  const text = value.toLowerCase().replace(/&amp;/g, "&");
  if (/publicdomain\/zero|\/zero\/1\.0|\bcc0\b/.test(text)) return "CC0";
  if (/\/licenses\/by-sa\/|\bcc by-sa\b|attribution-sharealike/.test(text) && !/by-nc|noncommercial|\bcc by-nc/.test(text)) return "CC BY-SA";
  if (/\/licenses\/by\/(?:[0-9]|legalcode)|\bcc by(?:\s|\d|$)|creative commons attribution/.test(text)
      && !/by-sa|by-nc|by-nd|noncommercial|noderivatives|\bcc by-nc|\bcc by-nd/.test(text)) return "CC BY";
  if (/publicdomain|public domain/.test(text)) return "公共领域";
  return null;
}

async function verifySourceLicense(sourceUrl, expectedCategory, rowLicenseUrl) {
  const response = await fetch(sourceUrl, { redirect: "follow", headers: { "user-agent": "yapu-recording-import/1.0" } });
  if (!response.ok) throw new Error(`来源页请求失败：HTTP ${response.status}。`);
  if (!isApprovedHost(new URL(response.url).hostname)) throw new Error("来源页跳转到了未允许的主机，已停止。");
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("text/html") && !contentType.startsWith("application/xhtml+xml")) {
    throw new Error(`来源页不是 HTML 文本（${contentType || "无 Content-Type"}），已停止。`);
  }
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PAGE_BYTES) throw new Error("来源页超过 8 MB，已停止读取。");
  const pageBytes = Buffer.from(await response.arrayBuffer());
  if (pageBytes.length > MAX_PAGE_BYTES) throw new Error("来源页超过 8 MB，已停止读取。");
  const html = pageBytes.toString("utf8");
  const licenseLinks = [];
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const attributes = match[1];
    const rel = attributeValue(attributes, "rel").toLowerCase().split(/\s+/);
    if (!rel.includes("license")) continue;
    const href = attributeValue(attributes, "href");
    const title = attributeValue(attributes, "title");
    const label = decodeHtml(match[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
    const family = licenseFamily(`${href} ${title} ${label}`);
    if (family) licenseLinks.push({ href, label: label || title || expectedCategory, family });
  }

  const match = licenseLinks.find((link) => link.family === expectedCategory);
  if (!match) {
    const declared = licenseLinks.map((link) => `${link.label} (${link.family})`).join("，") || "未找到 rel=license 的许可声明";
    throw new Error(`来源页没有明确声明与 CSV“${expectedCategory}”相符的许可：${declared}。未请求音频文件。`);
  }
  if (!match.href || licenseFamily(match.href) !== expectedCategory) {
    throw new Error("来源页的许可链接与许可类别不一致，未请求音频文件。");
  }
  if (licenseFamily(rowLicenseUrl) !== expectedCategory) {
    throw new Error("CSV 的许可原文链接与许可类别不一致，未请求音频文件。");
  }
  return { url: match.href, label: match.label };
}

async function downloadAudio(audioUrl, destination) {
  const url = assertApprovedHttpsUrl(audioUrl, "直接音频地址");
  const extension = path.extname(decodeURIComponent(url.pathname)).toLowerCase();
  if (!AUDIO_EXTENSIONS.has(extension)) throw new Error(`直接地址扩展名“${extension || "无"}”不是允许的音频格式。`);

  const response = await fetch(url, { redirect: "follow", headers: { "user-agent": "yapu-recording-import/1.0" } });
  if (!response.ok) throw new Error(`音频下载失败：HTTP ${response.status}。`);
  if (!isApprovedHost(new URL(response.url).hostname)) throw new Error("音频下载跳转到了未允许的主机，已停止。");
  const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!contentType.startsWith("audio/") && contentType !== "application/ogg") {
    throw new Error(`直接地址没有声明为音频（${contentType || "无 Content-Type"}），未保存响应内容。`);
  }
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SOURCE_BYTES) throw new Error("源音频超过 50 MB，已停止下载。");
  if (!response.body) throw new Error("音频响应没有内容。");

  let received = 0;
  const sizeLimit = new Transform({
    transform(chunk, encoding, callback) {
      received += chunk.length;
      if (received > MAX_SOURCE_BYTES) callback(new Error("源音频超过 50 MB，已停止下载。"));
      else callback(null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(response.body), sizeLimit, createWriteStream(destination, { flags: "wx" }));
  if (received === 0) throw new Error("源音频文件为空。");
  return { contentType, size: received };
}

function runFfmpeg(ffmpegPath, args) {
  const result = spawnSync(ffmpegPath, args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, windowsHide: true });
  if (result.error) throw new Error(`无法运行 FFMPEG_PATH 指定的程序：${result.error.message}`);
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim().split(/\r?\n/).slice(-3).join(" ");
    throw new Error(`ffmpeg 失败（退出码 ${result.status}）：${detail}`);
  }
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function getDurationSeconds(output) {
  const match = output.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);
  if (!match) throw new Error("ffmpeg 无法确认源音频时长，未导入。");
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function csvValue(row, key) {
  return (row[key] ?? "").trim();
}

function optionalYear(row) {
  const explicit = csvValue(row, "录音年份");
  const yearText = explicit || `${csvValue(row, "候选标题")} ${csvValue(row, "判断依据")}`;
  const year = yearText.match(/\b(18|19|20)\d{2}\b/)?.[0];
  return year ? Number(year) : undefined;
}

function filenameSlug(work) {
  return work.normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase() || "recording";
}

function appendRecording(catalogText, recording) {
  if (catalogText.split(RECORDING_MARKER).length !== 2) throw new Error("录音清单追加标记缺失或不唯一。");
  if (catalogText.includes(JSON.stringify(recording.sourceUrl))) throw new Error("这个来源页已在录音清单中。");
  const serialized = JSON.stringify(recording, null, 2).split("\n").map((line) => `  ${line}`).join("\n");
  return catalogText.replace(RECORDING_MARKER, `${serialized},\n${RECORDING_MARKER}`);
}

function markdownCell(value) {
  return value.replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ");
}

function appendSource(sourceText, entry) {
  if (sourceText.includes(entry.sourceUrl)) throw new Error("这个来源页已在 SOURCES.md 中。");
  const row = `| \`public/${markdownCell(entry.file)}\` | <${markdownCell(entry.sourceUrl)}> | ${markdownCell(entry.licenseName)} | <${markdownCell(entry.licenseUrl)}> | ${entry.downloadDate} | \`${entry.sha256}\` |`;
  return `${sourceText.trimEnd()}\n${row}\n`;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ffmpegPath = process.env.FFMPEG_PATH?.trim();
  if (!ffmpegPath) throw new Error(`请先设置 FFMPEG_PATH。\n${usage()}`);
  const ffmpegInfo = await stat(ffmpegPath).catch(() => null);
  if (!ffmpegInfo?.isFile()) throw new Error("FFMPEG_PATH 不存在或不是文件。");

  const requestedWork = normalizeWorkName(args.get("work"));
  const requestedSource = normalizedPageUrl(args.get("source-page"));
  const csvPath = path.resolve(args.get("csv"));
  const rows = parseCsv(await readFile(csvPath, "utf8"));
  const sameWorkRows = rows.filter((row) => normalizeWorkName(csvValue(row, "作品")) === requestedWork);
  const matches = sameWorkRows.filter((row) => normalizedPageUrl(csvValue(row, "来源页链接")) === requestedSource);
  if (matches.length !== 1) {
    const candidatePages = sameWorkRows.map((row) => csvValue(row, "来源页链接")).filter(Boolean).join(", ") || "无同名作品行";
    const parsed = rows[0] ?? {};
    throw new Error(`按作品名和来源页链接找到 ${matches.length} 行，必须恰好匹配一行。该作品候选来源页：${candidatePages}；CSV 行数=${rows.length}，字段=${Object.keys(parsed).join("|")}，首行作品=${JSON.stringify(parsed["作品"])}`);
  }

  const row = matches[0];
  const category = csvValue(row, "许可类别");
  if (!LICENSE_CATEGORIES.has(category)) throw new Error(`拒绝导入许可类别“${category || "空"}”；只接受公共领域、CC0、CC BY、CC BY-SA。`);
  if (!csvValue(row, "人声/器乐判断").startsWith("人声")) throw new Error("CSV 元数据没有将候选标为人声，拒绝导入。");
  const work = normalizeWorkName(csvValue(row, "作品"));
  const performer = csvValue(row, "表演者/来源署名");
  if (!work || !performer) throw new Error("CSV 缺少作品名或表演者/来源署名。");

  const sourceUrl = csvValue(row, "来源页链接");
  const audioUrl = csvValue(row, "直接音频地址");
  const rowLicenseUrl = csvValue(row, "许可原文链接");
  const sourcePage = assertApprovedHttpsUrl(sourceUrl, "来源页链接");
  const directAudio = assertApprovedHttpsUrl(audioUrl, "直接音频地址");
  if (!rowLicenseUrl) throw new Error("CSV 没有许可原文链接，拒绝下载。");

  const catalogBefore = await readFile(RECORDINGS_FILE, "utf8");
  const sourcesBefore = await readFile(SOURCES_FILE, "utf8");
  const license = await verifySourceLicense(sourcePage.href, category, rowLicenseUrl);

  const tempRoot = path.join(PROJECT_ROOT, ".tmp");
  await mkdir(tempRoot, { recursive: true });
  const tempDirectory = await mkdtemp(path.join(tempRoot, "recording-import-"));
  let outputPath;
  let mediaDirectoryCreated = false;
  let catalogWriteAttempted = false;
  let sourcesWriteAttempted = false;
  try {
    const sourceFile = path.join(tempDirectory, `source${path.extname(decodeURIComponent(directAudio.pathname)).toLowerCase()}`);
    const convertedFile = path.join(tempDirectory, "recording.mp3");
    const download = await downloadAudio(directAudio.href, sourceFile);
    const probeOutput = runFfmpeg(ffmpegPath, ["-hide_banner", "-i", sourceFile, "-f", "null", "-"]);
    const duration = getDurationSeconds(probeOutput);
    if (duration > MAX_DURATION_SECONDS) throw new Error(`录音时长 ${duration.toFixed(2)} 秒，超过 5 分钟；拒绝截断或导入。`);

    runFfmpeg(ffmpegPath, ["-y", "-hide_banner", "-loglevel", "error", "-i", sourceFile, "-map", "0:a:0", "-vn", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "96k", convertedFile]);
    const convertedInfo = await stat(convertedFile);
    if (convertedInfo.size === 0) throw new Error("ffmpeg 生成了空文件。");
    if (convertedInfo.size > MAX_OUTPUT_BYTES) throw new Error(`转换后文件为 ${(convertedInfo.size / 1024 / 1024).toFixed(2)} MB，超过 4 MB；拒绝导入。`);

    const sha256 = createHash("sha256").update(await readFile(convertedFile)).digest("hex");
    const downloadDate = new Date().toISOString().slice(0, 10);
    const suffix = createHash("sha256").update(normalizedPageUrl(sourceUrl)).digest("hex").slice(0, 8);
    const filename = `${filenameSlug(work)}-${suffix}.mp3`;
    const file = `media/recordings/${filename}`;
    const language = csvValue(row, "语种");
    const recording = {
      work,
      file,
      performer,
      ...(optionalYear(row) ? { year: optionalYear(row) } : {}),
      language: !language || language === "—" || language === "und" ? "未标注" : language,
      licenseName: category,
      licenseUrl: license.url,
      sourceUrl: sourcePage.href,
      attribution: performer,
      versionNote: csvValue(row, "版本差异说明") || "录音旋律与教材版本的差异尚待试听核对。",
    };
    const catalogAfter = appendRecording(catalogBefore, recording);
    const sourcesAfter = appendSource(sourcesBefore, { ...recording, downloadDate, sha256 });

    const mediaDirectoryExisted = await exists(MEDIA_DIRECTORY);
    await mkdir(MEDIA_DIRECTORY, { recursive: true });
    mediaDirectoryCreated = !mediaDirectoryExisted;
    outputPath = path.join(MEDIA_DIRECTORY, filename);
    if (await exists(outputPath)) throw new Error(`目标文件已存在：${file}`);
    await rename(convertedFile, outputPath);

    catalogWriteAttempted = true;
    await writeFile(RECORDINGS_FILE, catalogAfter, "utf8");
    sourcesWriteAttempted = true;
    await writeFile(SOURCES_FILE, sourcesAfter, "utf8");

    console.log(`RECORDING_IMPORTED file=public/${file} duration=${duration.toFixed(2)}s source_bytes=${download.size} output_bytes=${convertedInfo.size}`);
    console.log(`SHA256 ${sha256}`);
  } catch (error) {
    if (sourcesWriteAttempted) await writeFile(SOURCES_FILE, sourcesBefore, "utf8").catch(() => undefined);
    if (catalogWriteAttempted) await writeFile(RECORDINGS_FILE, catalogBefore, "utf8").catch(() => undefined);
    if (outputPath) await unlink(outputPath).catch(() => undefined);
    if (mediaDirectoryCreated) await rm(MEDIA_DIRECTORY, { recursive: false, force: true }).catch(() => undefined);
    throw error;
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`ADD_RECORDING_FAILED: ${error.message}`);
  process.exitCode = 1;
});
