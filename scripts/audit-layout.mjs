// T001 全站版面巡检工具（glm1）。
// 逐个「路由 × 视口」打开页面，收集：横向溢出、控制台错误 / 页面异常、请求失败、
// 图片缺 alt 或缺宽高、文字太小、点击目标太小、CLS / LCP，输出 Markdown 报告 + 同名 JSON。
// 明细按「选择器 + 文字 + 字号 / 尺寸」等分组合并计数，避免同一种元素刷爆报告。
//
// 用法：
//   node scripts/audit-layout.mjs --base http://localhost:4321/lezhi-music-graph/ --out <报告.md> [--routes "#/atlas,#/lab"] [--strict]
//
// 依赖环境变量（不安装任何包）：
//   PLAYWRIGHT_MODULE                 Playwright 模块路径或其 package.json 路径
//   PLAYWRIGHT_CHROMIUM_EXECUTABLE    Chromium / Edge 可执行文件路径
import { createRequire } from "node:module";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { existsSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";

const DEFAULT_ROUTES = [
  "",
  "#/records/g7s1",
  "#/records/g9s2",
  "#/lesson/歌唱祖国",
  "#/work/歌唱祖国",
  "#/graph",
  "#/research",
  "#/assistant",
  "#/import",
];
const DEFAULT_VIEWPORTS = [
  [375, 812],
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [1920, 1080],
];
const SETTLE_MS = 1500;
const GOTO_TIMEOUT_MS = 60_000;
const CONCURRENCY = 3;
const CLS_PROBLEM_THRESHOLD = 0.1;
const MAX_OVERFLOW_GROUPS = 5;
const MAX_DETAIL_GROUPS = 10;
const MAX_OVERFLOW_SAMPLES = 500;

const PLAYWRIGHT_MODULE = process.env.PLAYWRIGHT_MODULE?.trim();
const CHROMIUM_EXECUTABLE = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?.trim();

function usage() {
  console.error(
    "用法：node scripts/audit-layout.mjs --base <站点地址> --out <报告.md> [--routes \"#/a,#/b\"] [--strict]",
  );
  console.error(
    "环境变量：PLAYWRIGHT_MODULE=<Playwright 模块或 package.json 路径> PLAYWRIGHT_CHROMIUM_EXECUTABLE=<Edge/Chromium 可执行文件>",
  );
}

function parseArgs(argv) {
  const options = { base: "", out: "", routes: [], strict: false };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--strict") {
      options.strict = true;
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined) {
      console.error(`缺少参数值：${flag}`);
      usage();
      process.exit(2);
    }
    index += 1;
    if (flag === "--base") options.base = value.trim();
    else if (flag === "--out") options.out = value.trim();
    else if (flag === "--routes")
      options.routes = value.split(",").map((item) => item.trim()).filter(Boolean);
    else {
      console.error(`未知参数：${flag}`);
      usage();
      process.exit(2);
    }
  }
  if (!options.base || !options.out) {
    usage();
    process.exit(2);
  }
  return options;
}

async function loadPlaywright(modulePath) {
  const location = isAbsolute(modulePath) ? modulePath : resolve(modulePath);
  if (basename(location).toLowerCase() === "package.json")
    return createRequire(location)("playwright");
  if (existsSync(location) && statSync(location).isDirectory())
    return createRequire(join(location, "package.json"))("playwright");
  if (existsSync(location) && extname(location) === ".mjs")
    return import(pathToFileURL(location).href);
  if (existsSync(location)) return createRequire(import.meta.url)(location);
  return createRequire(import.meta.url)(modulePath);
}

function routeLabel(route) {
  return route === "" ? "首页(/)" : route;
}

function buildUrl(base, route) {
  const url = new URL(base);
  url.hash = route === "" ? "" : route.startsWith("#") ? route : `#${route}`;
  return url;
}

// 在浏览器里执行：返回横向溢出、图片、小字、小点击目标的分组明细。性能数据走 __yapuLayout。
function collectDomIssues({ viewportWidth, maxOverflowSamples, maxOverflowGroups, maxDetailGroups }) {
  const describe = (element) => {
    const rawClass = typeof element.className === "string"
      ? element.className
      : element.className?.baseVal ?? "";
    const classes = String(rawClass).trim().replace(/\s+/g, ".");
    return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${classes ? `.${classes}` : ""}`;
  };
  const isVisible = (element) => {
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (Number(style.opacity) === 0) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  // 元素在某个 overflow-x:auto/scroll 且确实在滚动的容器里 → 属于容器内部滚动，不算溢出。
  const insideHorizontalScroller = (element) => {
    for (
      let parent = element.parentElement;
      parent && parent !== document.documentElement;
      parent = parent.parentElement
    ) {
      const style = getComputedStyle(parent);
      if (
        ["auto", "scroll"].includes(style.overflowX) &&
        parent.scrollWidth > parent.clientWidth + 1
      )
        return true;
    }
    return false;
  };
  const groupInPage = (items) => {
    const map = new Map();
    for (const item of items) {
      const key = JSON.stringify(item);
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { ...item, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  };

  // 1. 横向溢出
  const documentWidth = document.documentElement.scrollWidth;
  const hasDocumentOverflow = documentWidth > window.innerWidth + 1;
  const overflowItems = [];
  if (hasDocumentOverflow) {
    for (const element of document.querySelectorAll("body *")) {
      if (overflowItems.length >= maxOverflowSamples) break;
      if (!isVisible(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.right <= window.innerWidth + 1) continue;
      if (insideHorizontalScroller(element)) continue;
      overflowItems.push({
        selector: describe(element),
        width: Math.round(rect.width),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      });
    }
  }

  // 3. 图片：缺 alt；缺 width/height 属性且没有 CSS 固定尺寸
  const imagesMissingAlt = [];
  const imagesMissingDimensions = [];
  for (const image of document.images) {
    if (!image.hasAttribute("alt"))
      imagesMissingAlt.push({ selector: describe(image), src: (image.getAttribute("src") ?? "").slice(0, 120) });
    const hasSizeAttributes = image.hasAttribute("width") && image.hasAttribute("height");
    const style = getComputedStyle(image);
    const cssFixed =
      (style.width !== "auto" && style.width !== "") ||
      (style.height !== "auto" && style.height !== "");
    if (!hasSizeAttributes && !cssFixed)
      imagesMissingDimensions.push({ selector: describe(image), src: (image.getAttribute("src") ?? "").slice(0, 120) });
  }

  // 4. 文字太小：可见文本节点所在元素的计算字号 < 12px，同一元素只报一次
  const smallTextElements = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent.trim()) continue;
    const element = node.parentElement;
    if (!element || smallTextElements.has(element)) continue;
    if (!isVisible(element)) continue;
    const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
    if (Number.isFinite(fontSize) && fontSize < 12) smallTextElements.add(element);
  }
  const smallTextItems = [...smallTextElements].map((element) => ({
    selector: describe(element),
    fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
    sample: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40),
  }));

  // 5. 点击目标太小（仅 375 宽视口检查）：宽或高 < 32px
  const smallTargetItems = [];
  if (viewportWidth === 375) {
    for (const element of document.querySelectorAll("button, a, [role=button], input")) {
      if (!isVisible(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width < 32 || rect.height < 32)
        smallTargetItems.push({
          selector: describe(element),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
    }
  }

  return {
    documentWidth,
    viewportWidth: window.innerWidth,
    hasDocumentOverflow,
    overflowCount: overflowItems.length,
    overflowGroups: groupInPage(overflowItems).slice(0, maxOverflowGroups),
    imagesMissingAltCount: imagesMissingAlt.length,
    imagesMissingAltGroups: groupInPage(imagesMissingAlt).slice(0, maxDetailGroups),
    imagesMissingDimensionsCount: imagesMissingDimensions.length,
    imagesMissingDimensionsGroups: groupInPage(imagesMissingDimensions).slice(0, maxDetailGroups),
    smallTextCount: smallTextElements.size,
    smallTextGroups: groupInPage(smallTextItems).slice(0, maxDetailGroups),
    smallTargetsCount: smallTargetItems.length,
    smallTargetsGroups: groupInPage(smallTargetItems).slice(0, maxDetailGroups),
  };
}

// 注入到每个页面：统计 CLS（排除用户输入引起的位移）与 LCP。
function initPerformanceObserver() {
  window.__yapuLayout = { cls: 0, clsEntries: 0, lcp: 0, lcpElement: "" };
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        window.__yapuLayout.cls += entry.value;
        window.__yapuLayout.clsEntries += 1;
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {
    /* 该浏览器不支持 layout-shift 观察时跳过 */
  }
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (!last) return;
      window.__yapuLayout.lcp = last.startTime;
      window.__yapuLayout.lcpElement = last.element?.tagName?.toLowerCase() ?? "";
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    /* 该浏览器不支持 LCP 观察时跳过 */
  }
}

// 控制台错误 / 页面异常 / 请求失败按文本合并计数。
function groupMessages(values) {
  const map = new Map();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return [...map.entries()]
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count);
}

async function auditOne(browser, base, route, [width, height]) {
  const url = buildUrl(base, route);
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300));
  });
  page.on("pageerror", (error) => {
    pageErrors.push(String(error?.message ?? error).slice(0, 300));
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(
      `${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`.slice(0, 300),
    );
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`.slice(0, 300));
  });

  let navigationWarning = "";
  try {
    await page.addInitScript(initPerformanceObserver);
    await page.goto(url.href, { waitUntil: "networkidle", timeout: GOTO_TIMEOUT_MS });
  } catch (error) {
    navigationWarning = `打开页面未在 ${GOTO_TIMEOUT_MS}ms 内达到 networkidle：${String(error?.message ?? error).slice(0, 200)}`;
  }
  await page.waitForTimeout(SETTLE_MS);

  let dom;
  let perf = { cls: 0, clsEntries: 0, lcp: 0, lcpElement: "" };
  let evaluateError = "";
  try {
    dom = await page.evaluate(collectDomIssues, {
      viewportWidth: width,
      maxOverflowSamples: MAX_OVERFLOW_SAMPLES,
      maxOverflowGroups: MAX_OVERFLOW_GROUPS,
      maxDetailGroups: MAX_DETAIL_GROUPS,
    });
    perf = await page.evaluate(() => window.__yapuLayout ?? perf);
  } catch (error) {
    evaluateError = String(error?.message ?? error).slice(0, 300);
  }
  await page.close();

  const cls = Math.round((perf.cls ?? 0) * 10000) / 10000;
  const clsProblem = cls >= CLS_PROBLEM_THRESHOLD;
  const consoleGroups = groupMessages(consoleErrors);
  const pageErrorGroups = groupMessages(pageErrors);
  const failedRequestGroups = groupMessages(failedRequests);

  const extras = (navigationWarning ? 1 : 0) + (evaluateError ? 1 : 0);
  const problemCount =
    (dom?.hasDocumentOverflow ? 1 : 0) +
    consoleGroups.length +
    pageErrorGroups.length +
    failedRequestGroups.length +
    (dom?.imagesMissingAltGroups.length ?? 0) +
    (dom?.imagesMissingDimensionsGroups.length ?? 0) +
    (dom?.smallTextGroups.length ?? 0) +
    (dom?.smallTargetsGroups.length ?? 0) +
    (clsProblem ? 1 : 0) +
    extras;
  const rawProblemCount =
    (dom?.hasDocumentOverflow ? 1 : 0) +
    consoleErrors.length +
    pageErrors.length +
    failedRequests.length +
    (dom?.imagesMissingAltCount ?? 0) +
    (dom?.imagesMissingDimensionsCount ?? 0) +
    (dom?.smallTextCount ?? 0) +
    (dom?.smallTargetsCount ?? 0) +
    (clsProblem ? 1 : 0) +
    extras;

  return {
    route,
    label: routeLabel(route),
    viewport: `${width}×${height}`,
    url: url.href,
    problemCount,
    rawProblemCount,
    overflow: {
      hasDocumentOverflow: dom?.hasDocumentOverflow ?? false,
      documentWidth: dom?.documentWidth ?? null,
      viewportWidth: dom?.viewportWidth ?? width,
      count: dom?.overflowCount ?? 0,
      groups: dom?.overflowGroups ?? [],
    },
    consoleErrors: { total: consoleErrors.length, groups: consoleGroups },
    pageErrors: { total: pageErrors.length, groups: pageErrorGroups },
    failedRequests: { total: failedRequests.length, groups: failedRequestGroups },
    images: {
      missingAltCount: dom?.imagesMissingAltCount ?? 0,
      missingAltGroups: dom?.imagesMissingAltGroups ?? [],
      missingDimensionsCount: dom?.imagesMissingDimensionsCount ?? 0,
      missingDimensionsGroups: dom?.imagesMissingDimensionsGroups ?? [],
    },
    smallText: { count: dom?.smallTextCount ?? 0, groups: dom?.smallTextGroups ?? [] },
    smallTargets: { count: dom?.smallTargetsCount ?? 0, groups: dom?.smallTargetsGroups ?? [] },
    performance: {
      cls,
      clsEntries: perf.clsEntries ?? 0,
      lcp: Math.round(perf.lcp ?? 0),
      lcpElement: perf.lcpElement ?? "",
      clsProblem,
    },
    navigationWarning,
    evaluateError,
  };
}

async function runPool(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current]);
    }
  });
  await Promise.all(runners);
  return results;
}

function summarize(result) {
  const parts = [];
  if (result.overflow.hasDocumentOverflow) parts.push("横向溢出");
  if (result.consoleErrors.total) parts.push(`控制台错误×${result.consoleErrors.total}`);
  if (result.pageErrors.total) parts.push(`页面异常×${result.pageErrors.total}`);
  if (result.failedRequests.total) parts.push(`请求失败×${result.failedRequests.total}`);
  if (result.images.missingAltCount) parts.push(`缺alt×${result.images.missingAltCount}`);
  if (result.images.missingDimensionsCount) parts.push(`缺宽高×${result.images.missingDimensionsCount}`);
  if (result.smallText.count) parts.push(`小字×${result.smallText.count}`);
  if (result.smallTargets.count) parts.push(`小点击目标×${result.smallTargets.count}`);
  if (result.performance.clsProblem) parts.push(`CLS=${result.performance.cls}`);
  if (result.navigationWarning) parts.push("页面打开超时");
  if (result.evaluateError) parts.push("检测脚本执行失败");
  return parts;
}

function withCount(value, count) {
  return count > 1 ? `${value} ×${count}` : value;
}

function renderMarkdown(data) {
  const lines = [];
  const totalProblems = data.results.reduce((sum, item) => sum + item.problemCount, 0);
  const totalRawProblems = data.results.reduce((sum, item) => sum + item.rawProblemCount, 0);
  lines.push("# 全站版面巡检报告（audit-layout）");
  lines.push("");
  lines.push(`- 站点：${data.base}`);
  lines.push(`- 时间：${data.startedAt}`);
  lines.push(`- 路由 × 视口：${data.routes.length} × ${data.viewports.length}，耗时 ${Math.round(data.durationMs / 1000)} 秒`);
  lines.push(`- 问题总数：${totalProblems}（分组合并后；合并前涉及元素 / 条目 ${totalRawProblems} 个）`);
  lines.push(`- 判定：${totalProblems === 0 ? "✓ 通过" : "存在问题"}`);
  lines.push("");
  lines.push("## 汇总表（格内为分组后的问题数，✓ 表示 0）");
  lines.push("");
  const headers = data.viewports.map(([width, height]) => `${width}×${height}`);
  lines.push(`| 路由 | ${headers.join(" | ")} | 每路由最差视口 |`);
  lines.push(`| --- | ${data.viewports.map(() => "---").join(" | ")} | --- |`);
  for (const route of data.routes) {
    const routeResults = data.viewports.map(([width, height]) =>
      data.results.find((item) => item.route === route && item.viewport === `${width}×${height}`),
    );
    const cells = routeResults.map((result) =>
      result ? (result.problemCount === 0 ? "✓" : String(result.problemCount)) : "未运行",
    );
    let worst = null;
    routeResults.forEach((result, index) => {
      if (!result) return;
      if (!worst || result.problemCount > worst.problemCount)
        worst = { problemCount: result.problemCount, viewport: headers[index] };
    });
    lines.push(`| ${routeLabel(route)} | ${cells.join(" | ")} | ${worst ? `${worst.viewport}（${worst.problemCount}）` : "未运行"} |`);
  }
  const rawTotals = data.viewports.map(([width, height]) =>
    data.results
      .filter((item) => item.viewport === `${width}×${height}`)
      .reduce((sum, item) => sum + item.rawProblemCount, 0),
  );
  lines.push(`| 涉及元素总数（合并前） | ${rawTotals.join(" | ")} | — |`);
  lines.push("");
  const worst = [...data.results]
    .filter((item) => item.problemCount > 0)
    .sort((a, b) => b.problemCount - a.problemCount)
    .slice(0, 5);
  lines.push("## 问题最多的 5 个路由 × 视口");
  lines.push("");
  if (!worst.length) lines.push("全部通过。");
  worst.forEach((item, index) => {
    lines.push(
      `${index + 1}. \`${item.label}\` @ ${item.viewport} — ${item.problemCount} 个问题（合并前 ${item.rawProblemCount} 个元素 / 条目）`,
    );
  });
  lines.push("");
  lines.push("## 明细（仅列有问题的页面，重复元素已合并为「… ×N」）");
  lines.push("");
  const problemResults = data.results.filter((item) => item.problemCount > 0);
  if (!problemResults.length) lines.push("无。");
  for (const result of problemResults) {
    lines.push(`### ${result.label} @ ${result.viewport}`);
    lines.push("");
    lines.push(`- 地址：${result.url}`);
    if (result.overflow.hasDocumentOverflow) {
      lines.push(
        `- **横向溢出**：document.scrollWidth ${result.overflow.documentWidth}px > 视口 ${result.overflow.viewportWidth}px（未包含在滚动容器内的元素 ${result.overflow.count} 个）`,
      );
      for (const group of result.overflow.groups)
        lines.push(
          `  - \`${group.selector}\` 宽 ${group.width}px（left ${group.left}，right ${group.right}）${withCount("", group.count).trim()}`,
        );
    }
    if (result.consoleErrors.total) {
      lines.push(`- **控制台错误**（合并前 ${result.consoleErrors.total}）：`);
      for (const group of result.consoleErrors.groups.slice(0, MAX_DETAIL_GROUPS))
        lines.push(`  - ${withCount(group.message, group.count)}`);
    }
    if (result.pageErrors.total) {
      lines.push(`- **页面异常**（合并前 ${result.pageErrors.total}）：`);
      for (const group of result.pageErrors.groups.slice(0, MAX_DETAIL_GROUPS))
        lines.push(`  - ${withCount(group.message, group.count)}`);
    }
    if (result.failedRequests.total) {
      lines.push(`- **请求失败**（合并前 ${result.failedRequests.total}）：`);
      for (const group of result.failedRequests.groups.slice(0, MAX_DETAIL_GROUPS))
        lines.push(`  - ${withCount(group.message, group.count)}`);
    }
    if (result.images.missingAltCount) {
      lines.push(`- **图片缺 alt**（合并前 ${result.images.missingAltCount}）：`);
      for (const group of result.images.missingAltGroups)
        lines.push(`  - \`${group.selector}\` ${group.src}${withCount("", group.count)}`);
    }
    if (result.images.missingDimensionsCount) {
      lines.push(`- **图片缺宽高且无 CSS 固定尺寸**（合并前 ${result.images.missingDimensionsCount}）：`);
      for (const group of result.images.missingDimensionsGroups)
        lines.push(`  - \`${group.selector}\` ${group.src}${withCount("", group.count)}`);
    }
    if (result.smallText.count) {
      lines.push(`- **文字太小（< 12px）**：合并前 ${result.smallText.count} 个元素，合并后 ${result.smallText.groups.length} 组`);
      for (const group of result.smallText.groups)
        lines.push(`  - \`${group.selector}\` ${group.fontSize}px「${group.sample}」${withCount("", group.count).trim()}`);
    }
    if (result.smallTargets.count) {
      lines.push(`- **点击目标太小（< 32px）**：合并前 ${result.smallTargets.count} 个，合并后 ${result.smallTargets.groups.length} 组`);
      for (const group of result.smallTargets.groups)
        lines.push(`  - \`${group.selector}\` ${group.width}×${group.height}${withCount("", group.count).trim()}`);
    }
    if (result.performance.clsProblem)
      lines.push(
        `- **布局跳动（CLS ${result.performance.cls} ≥ 0.1）**：${result.performance.clsEntries} 次位移；LCP ${result.performance.lcp}ms（${result.performance.lcpElement || "未知元素"}）`,
      );
    else if (result.performance.cls > 0)
      lines.push(
        `- 布局跳动：CLS ${result.performance.cls}（未达 0.1）；LCP ${result.performance.lcp}ms（${result.performance.lcpElement || "未知元素"}）`,
      );
    if (result.navigationWarning) lines.push(`- **页面打开超时**：${result.navigationWarning}`);
    if (result.evaluateError) lines.push(`- **检测脚本执行失败**：${result.evaluateError}`);
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  if (!PLAYWRIGHT_MODULE || !CHROMIUM_EXECUTABLE) {
    usage();
    process.exit(2);
  }
  const options = parseArgs(process.argv.slice(2));
  let base;
  try {
    base = new URL(options.base);
    base.hash = "";
    if (!base.pathname.endsWith("/")) base.pathname += "/";
  } catch {
    console.error(`--base 不是合法地址：${options.base}`);
    process.exit(2);
  }

  const routes = [...new Set([...DEFAULT_ROUTES, ...options.routes])];
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  const playwright = await loadPlaywright(PLAYWRIGHT_MODULE);
  const chromium = playwright.chromium ?? playwright.default?.chromium;
  if (!chromium) {
    console.error(`无法从 PLAYWRIGHT_MODULE 加载 chromium：${PLAYWRIGHT_MODULE}`);
    process.exit(2);
  }
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_EXECUTABLE,
    args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });

  const combos = routes.flatMap((route) => DEFAULT_VIEWPORTS.map((viewport) => ({ route, viewport })));
  let done = 0;
  console.log(`开始巡检：${routes.length} 路由 × ${DEFAULT_VIEWPORTS.length} 视口 = ${combos.length} 页（并发 ${CONCURRENCY}）`);
  const results = await runPool(combos, CONCURRENCY, async ({ route, viewport }) => {
    const result = await auditOne(browser, base, route, viewport);
    done += 1;
    const summary = summarize(result);
    console.log(
      `[${done}/${combos.length}] ${result.label} @ ${result.viewport}：${result.problemCount === 0 ? "✓" : `${result.problemCount} 个问题 / 合并前 ${result.rawProblemCount} 个（${summary.join("、")}）`}`,
    );
    return result;
  });
  await browser.close();

  const data = {
    base: base.href,
    startedAt,
    durationMs: Date.now() - startMs,
    routes,
    viewports: DEFAULT_VIEWPORTS,
    results,
  };
  const reportPath = resolve(options.out);
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, renderMarkdown(data), "utf8");
  const jsonPath = `${reportPath.replace(/\.md$/i, "")}.json`;
  await writeFile(jsonPath, JSON.stringify(data, null, 2), "utf8");

  const totalProblems = results.reduce((sum, item) => sum + item.problemCount, 0);
  const totalRaw = results.reduce((sum, item) => sum + item.rawProblemCount, 0);
  console.log(`报告：${reportPath}`);
  console.log(`原始数据：${jsonPath}`);
  console.log(`巡检完成：${combos.length} 页，问题总数 ${totalProblems}（分组） / ${totalRaw}（合并前），耗时 ${Math.round((Date.now() - startMs) / 1000)} 秒`);
  if (options.strict && totalProblems > 0) process.exit(1);
}

try {
  await main();
} catch (error) {
  console.error(`AUDIT_LAYOUT_FAILED: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
  process.exit(1);
}
