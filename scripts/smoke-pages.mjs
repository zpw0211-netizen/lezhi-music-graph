import { createRequire } from "node:module";
import { basename, extname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { existsSync, statSync } from "node:fs";

const DEFAULT_SITE_URL = "http://localhost:4321/";
const PLAYWRIGHT_MODULE = process.env.PLAYWRIGHT_MODULE?.trim();
const CHROMIUM_EXECUTABLE = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?.trim();

function usage() {
  console.error(
    "用法：PLAYWRIGHT_MODULE=<Playwright 模块路径或 package.json 路径> " +
      "PLAYWRIGHT_CHROMIUM_EXECUTABLE=<Chromium/Edge 可执行文件路径> npm run smoke [站点地址]",
  );
  console.error(`站点地址默认：${DEFAULT_SITE_URL}`);
}

if (!PLAYWRIGHT_MODULE || !CHROMIUM_EXECUTABLE) {
  usage();
  process.exit(2);
}

async function loadPlaywright(modulePath) {
  const location = isAbsolute(modulePath) ? modulePath : resolve(modulePath);
  if (basename(location).toLowerCase() === "package.json")
    return createRequire(location)("playwright");
  if (existsSync(location) && statSync(location).isDirectory())
    return createRequire(join(location, "package.json"))(location);
  if (existsSync(location) && extname(location) === ".mjs")
    return import(pathToFileURL(location).href);
  if (existsSync(location)) return createRequire(import.meta.url)(location);
  return createRequire(import.meta.url)(modulePath);
}

let loadedPlaywright;
try {
  loadedPlaywright = await loadPlaywright(PLAYWRIGHT_MODULE);
} catch (error) {
  console.error(`SMOKE_PAGES_FAILED step="加载 Playwright": ${error instanceof Error ? error.message : String(error)}`);
  usage();
  process.exit(2);
}
const chromium = loadedPlaywright.chromium ?? loadedPlaywright.default?.chromium;
if (!chromium) {
  console.error(`无法从 PLAYWRIGHT_MODULE 加载 chromium：${PLAYWRIGHT_MODULE}`);
  usage();
  process.exit(2);
}

let siteRoot;
try {
  siteRoot = new URL(process.argv[2] ?? DEFAULT_SITE_URL);
  siteRoot.hash = "";
  if (!siteRoot.pathname.endsWith("/")) siteRoot.pathname += "/";
} catch (error) {
  console.error(`SMOKE_PAGES_FAILED step="解析站点地址": ${error instanceof Error ? error.message : String(error)}`);
  usage();
  process.exit(2);
}
const pageErrors = [];
const consoleErrors = [];
let currentStep = "启动浏览器";
let browser;

function fail(message) {
  throw new Error(message);
}

async function step(label, action) {
  currentStep = label;
  await action();
  console.log(`PASS ${label}`);
}

function routeUrl(hash, query) {
  const url = new URL(siteRoot.href);
  url.hash = hash;
  if (query) url.searchParams.set("smoke", query);
  return url.href;
}

async function waitForApp(page) {
  await page.waitForFunction(
    () => Boolean(document.querySelector(".app-shell")) && !document.querySelector(".app-loading"),
    null,
    { timeout: 90_000 },
  );
}

function watchErrors(page) {
  page.on("pageerror", (error) => {
    pageErrors.push({ url: page.url(), message: error.message });
  });
  page.on("console", (message) => {
    if (message.type() === "error")
      consoleErrors.push({ url: page.url(), message: message.text() });
  });
}

function formatBrowserErrors() {
  const lines = [];
  for (const error of pageErrors) lines.push(`pageerror ${error.url}: ${error.message}`);
  for (const error of consoleErrors) lines.push(`console.error ${error.url}: ${error.message}`);
  return lines;
}

async function auditViewport(page, width, height) {
  return page.evaluate(({ width, height }) => {
    const selector = (element) => {
      const className = typeof element.className === "string"
        ? element.className
        : element.className?.baseVal ?? "";
      const classes = String(className).trim().replace(/\s+/g, ".");
      return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${classes ? `.${classes}` : ""}`;
    };
    const horizontalScroller = (element) => {
      for (let parent = element.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (["auto", "scroll"].includes(style.overflowX) && parent.scrollWidth > parent.clientWidth + 1)
          return selector(parent);
      }
      return null;
    };
    const outside = [...document.querySelectorAll("body *")].flatMap((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (rect.width <= 0 || rect.height <= 0 || style.display === "none" || style.visibility === "hidden") return [];
      const overLeft = rect.left < -2;
      const overRight = rect.right > innerWidth + 2;
      if (!overLeft && !overRight) return [];
      return [{
        element: selector(element),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        overLeft,
        overRight,
        horizontalScroller: horizontalScroller(element),
      }];
    });
    const violations = outside.filter((item) => !item.horizontalScroller);
    return {
      viewport: { width, height },
      documentWidth: document.documentElement.scrollWidth,
      overflowElementCount: outside.length,
      uncontainedOverflowCount: violations.length,
      violations: violations.slice(0, 20),
    };
  }, { width, height });
}

async function main() {
  browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_EXECUTABLE,
    args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  watchErrors(page);

  await step("桌面：首页加载并显示内容", async () => {
    await page.goto(siteRoot.href, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await waitForApp(page);
    await page.locator(".home-portal .home-title").waitFor({ state: "visible", timeout: 90_000 });
    const title = (await page.locator(".home-portal .home-title").innerText()).trim();
    if (!title.includes("芽谱")) fail(`首页标题为空或不正确：${title}`);
  });

  await step("桌面：按课学习导航到 #/records", async () => {
    await page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name: "按课学习", exact: true }).click();
    await page.waitForFunction(() => location.hash === "#/records", null, { timeout: 10_000 });
    await page.locator(".work-library .work-card").first().waitFor({ state: "visible", timeout: 90_000 });
  });

  const marker = `yapu-smoke-${Date.now()}`;
  await page.evaluate((value) => { window.__yapuSmokeMarker = value; }, marker);

  await step("桌面：打开第一课并进入 #/lesson/…", async () => {
    await page.locator(".work-library .work-card").first().click();
    await page.waitForFunction(() => location.hash.startsWith("#/lesson/"), null, { timeout: 10_000 });
    await page.locator(".lesson #lesson-title").waitFor({ state: "visible", timeout: 90_000 });
    const playButton = page.locator(".melody-play");
    await playButton.waitFor({ state: "visible", timeout: 10_000 });
    const label = await playButton.getAttribute("aria-label");
    if (label !== "播放旋律") fail(`第一课没有可播放旋律，按钮当前为「${label ?? "无"}」`);
  });

  await step("桌面：3 秒内开始播放并高亮音符", async () => {
    await page.locator(".melody-play").click();
    await page.waitForFunction(() => {
      const button = document.querySelector(".melody-play");
      return button?.getAttribute("aria-label") === "停止" && document.querySelector(".melody-note.is-active");
    }, null, { timeout: 3_000 });
  });

  await step("桌面：停止旋律播放", async () => {
    await page.locator(".melody-play").click();
    await page.waitForFunction(() =>
      document.querySelector(".melody-play")?.getAttribute("aria-label") === "播放旋律" &&
      !document.querySelector(".melody-note.is-active"),
    null, { timeout: 3_000 });
  });

  await step("桌面：浏览器后退回目录且没有整页刷新", async () => {
    await page.evaluate(() => window.history.back());
    await page.waitForFunction(() => location.hash === "#/records" && Boolean(document.querySelector(".work-library")), null, { timeout: 10_000 });
    const retained = await page.evaluate(() => window.__yapuSmokeMarker);
    if (retained !== marker) fail("浏览器后退后 window 标记消失，页面发生了整页刷新");
  });

  await step("桌面：知识图谱出现 WebGL 画布", async () => {
    await page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name: "知识图谱", exact: true }).click();
    await page.waitForFunction(() => location.hash === "#/graph", null, { timeout: 10_000 });
    await page.locator(".neo-canvas").waitFor({ state: "visible", timeout: 90_000 });
    await page.waitForFunction(() => [...document.querySelectorAll(".sigma-graph-scene canvas")].some((canvas) => {
      if (canvas.width <= 0 || canvas.height <= 0) return false;
      try {
        return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
      } catch {
        return false;
      }
    }), null, { timeout: 60_000 });
  });

  await step("桌面：提交问题并显示回答", async () => {
    await page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name: "智能问答", exact: true }).click();
    await page.waitForFunction(() => location.hash === "#/assistant", null, { timeout: 10_000 });
    const question = "《游击队歌》的音乐特点是什么？";
    await page.locator('textarea[aria-label="向芽谱提问"]').fill(question);
    await page.getByRole("button", { name: "提问" }).click();
    await page.locator(".assistant-turn .assistant-answer").waitFor({ state: "visible", timeout: 30_000 });
    const answer = (await page.locator(".assistant-turn .assistant-answer").first().innerText()).trim();
    if (!answer) fail("问答区域出现，但回答内容为空");
  });

  const routes = [
    ["首页", "#/", ".home-portal"],
    ["按课学习", "#/records", ".work-library"],
    ["单课学习", "#/lesson/歌唱祖国", ".lesson"],
    ["作品图谱", "#/work/歌唱祖国", ".work-graph"],
    ["知识图谱", "#/graph", ".neo-canvas"],
    ["智能问答", "#/assistant", ".assistant-page"],
    ["研究分析", "#/research", ".research-analysis"],
  ];
  let mobileCase = 0;
  for (const width of [375, 768]) {
    const height = width === 375 ? 812 : 1024;
    for (const [name, hash, selector] of routes) {
      mobileCase += 1;
      const label = `响应式：${width}px ${name} 无未包含的横向溢出`;
      await step(label, async () => {
        await page.setViewportSize({ width, height });
        await page.goto(routeUrl(hash, `mobile-${mobileCase}`), { waitUntil: "domcontentloaded", timeout: 60_000 });
        await waitForApp(page);
        await page.locator(selector).waitFor({ state: "visible", timeout: 90_000 });
        await page.evaluate(() => document.fonts?.ready);
        const audit = await auditViewport(page, width, height);
        if (audit.uncontainedOverflowCount)
          fail(`发现 ${audit.uncontainedOverflowCount} 个横向溢出元素：${JSON.stringify(audit.violations)}`);
      });
    }
  }

  await step("错误检查：页面错误与控制台错误均为 0", async () => {
    const errors = formatBrowserErrors();
    if (errors.length) fail(errors.join("\n"));
  });
  console.log(`SMOKE_PAGES_PASSED url=${siteRoot.href} mobileRoutes=${mobileCase} pageErrors=0 consoleErrors=0`);
}

try {
  await main();
} catch (error) {
  console.error(`SMOKE_PAGES_FAILED step="${currentStep}": ${error instanceof Error ? error.message : String(error)}`);
  const browserErrors = formatBrowserErrors();
  if (browserErrors.length) console.error(`浏览器错误：\n${browserErrors.join("\n")}`);
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => {});
}
