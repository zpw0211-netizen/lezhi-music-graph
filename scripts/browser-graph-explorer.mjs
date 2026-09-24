import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
let playwright;
try { playwright = createRequire(import.meta.url)("playwright"); }
catch { playwright = createRequire("C:/Users/HONOR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json")("playwright"); }
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
await access(executablePath);
// The site opens on the home portal; the explorer tests start directly in the graph view.
const explorerUrl = new URL(process.env.EXPLORER_URL ?? "http://127.0.0.1:4174/lezhi-music-graph/");
explorerUrl.searchParams.set("view", "graph");
const url = explorerUrl.toString();
const output = path.resolve("../../output/graph-explorer-acceptance");
await mkdir(output, { recursive: true });
const { canonicalGraph: graph } = JSON.parse(await readFile("public/data/graph-index.json", "utf8"));
const browser = await playwright.chromium.launch({ headless: true, executablePath });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage(); page.setDefaultTimeout(6000);
const errors = [], consoleErrors = [], failedRequests = [], results = [], performanceResults = {};
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("response", response => { if (response.status() >= 400) failedRequests.push({ status: response.status(), url: response.url() }); });
const stats = () => page.locator(".sigma-scene-host").evaluate(element => ({ ...element.dataset }));
const checkFull = async () => { const s = await stats(); assert.equal(Number(s.fullNodes), graph.entities.length); assert.equal(Number(s.fullEdges), graph.relationships.filter(edge => edge.objectId).length); return s; };
const reset = () => page.getByRole("button", { name: "恢复全部筛选", exact: true }).click();
const section = name => page.locator(".explorer-section").filter({ has: page.locator("summary", { hasText: name }) });
const record = async (name, operation) => { const start = Date.now(); await operation(); results.push({ name, passed: true, durationMs: Date.now() - start, graph: await stats().catch(() => null) }); console.log("BROWSER_PASS", name); };
try {
  const start = Date.now();
  await page.goto(url, { waitUntil: "networkidle" }); await page.locator(".sigma-scene-host canvas").first().waitFor();
  performanceResults.firstInteractiveMs = Date.now() - start;
  await record("首屏与完整数据", checkFull);
  const originalBuild = (await stats()).graphBuildId;
  await record("实体多选、仅此、全部隐藏与恢复", async () => {
    await page.getByRole("button", { name: "仅显示音乐人物", exact: true }).click();
    assert(Number((await stats()).visibleNodes) > 0); assert.equal((await stats()).visibleEdges, "0");
    await section("实体类型").getByRole("button", { name: "全部隐藏", exact: true }).click(); assert.equal((await stats()).visibleNodes, "0");
    await section("实体类型").getByRole("button", { name: "全部显示", exact: true }).click();
    assert.equal((await stats()).graphBuildId, originalBuild); await reset();
  });
  await record("关系仅此与恢复（不重建图）", async () => {
    await section("关系类型").locator("summary").click();
    await page.getByRole("button", { name: "只看作曲关系", exact: true }).click();
    assert(Number((await stats()).visibleEdges) > 0); assert.equal((await stats()).graphBuildId, originalBuild); await reset();
  });
  await record("属性组合交集与证据按需读取", async () => {
    await section("属性筛选").locator("summary").click(); const p = page.locator(".property-fields");
    await p.getByLabel("8 年级", { exact: true }).check(); await p.getByLabel("属性实体类型", { exact: true }).selectOption("work");
    await p.getByLabel("属性相关知识", { exact: true }).fill("蒙古族");
    assert.equal((await stats()).visibleNodes, "0"); assert(await page.getByText("当前组合筛选没有匹配实体。", { exact: false }).isVisible());
    await p.getByLabel("属性相关知识", { exact: true }).fill("节奏"); assert(Number((await stats()).visibleNodes) > 0);
    await reset(); await p.getByLabel("教材明确证据", { exact: true }).selectOption("yes");
    await page.waitForFunction(() => Number(document.querySelector(".sigma-scene-host")?.dataset.visibleNodes) > 0);
    assert.equal((await stats()).graphBuildId, originalBuild); await reset();
  });
  await record("四种 Perspective 复用与进阶证据边界", async () => {
    for (const name of ["教材结构", "音乐知识", "学习进阶", "综合知识"]) {
      await page.locator(".explorer-perspective").getByRole("button", { name, exact: true }).click();
      if (name === "学习进阶") { assert.equal((await stats()).visibleNodes, "0"); assert(await page.locator(".graph-empty-overlay").isVisible()); }
      assert.equal((await stats()).graphBuildId, originalBuild);
    }
  });
  await record("左栏 296 / 56px", async () => {
    assert.equal(await page.locator(".explorer-sidebar").evaluate(e => e.getBoundingClientRect().width), 296);
    await page.getByRole("button", { name: "折叠左侧栏" }).click();
    await page.waitForFunction(() => Math.abs(document.querySelector(".explorer-sidebar").getBoundingClientRect().width - 56) < 1);
    await page.getByRole("button", { name: "展开左侧栏" }).click();
  });
  await record("Schema 聚合类别与返回实例", async () => {
    await section("知识模式").locator("summary").click();
    await page.getByRole("button", { name: "查看实体与关系模式" }).click();
    assert.equal(await page.locator("[data-schema-category]").count(), 10); assert.equal(await page.locator(".sigma-scene-host").count(), 0);
    await page.locator("[data-schema-category=work]").click(); assert(Number((await stats()).visibleNodes) > 0); await reset();
  });
  const smart = section("智能探索"); await smart.locator("summary").click();
  for (const q of ["只看音乐人物", "只看作曲关系", "显示八年级音乐作品", "只看蒙古族音乐", "查找《牧歌》和蒙古族的关系", "查找进行曲相关作品", "显示节奏相关知识"]) {
    await record("GraphAction：" + q, async () => {
      const id = (await stats()).graphBuildId; await smart.getByRole("button", { name: q, exact: true }).click();
      await smart.locator("button[type=submit]:not([disabled])").waitFor();
      await checkFull(); assert.equal((await stats()).graphBuildId, id);
      if (q.includes("牧歌")) { assert((await page.locator(".graph-path-finder").textContent()).includes("1 跳")); }
    });
  }
  await record("回答联动与 Inspector AI 自动提问", async () => {
    await smart.getByRole("button", { name: "在图谱中查看", exact: true }).click(); assert(await page.locator(".node-ai-interpretation").isVisible());
    await page.locator(".node-ai-interpretation button").first().click(); await page.locator(".assistant-turn").first().waitFor();
    assert((await page.locator(".assistant-service-notice").first().textContent()).includes("未调用 GPT"));
    await page.locator(".assistant-graph-link").first().click(); await checkFull(); await reset();
  });
  await record("节点搜索、悬停、右键、拖拽和二跳", async () => {
    await page.locator(".search-wrap input").fill("保卫黄河"); await page.locator(".search-result").first().click(); await page.waitForTimeout(500);
    const b = await page.locator(".sigma-container").boundingBox(), x = b.x + b.width / 2, y = b.y + b.height / 2;
    const id = (await stats()).graphBuildId;
    await page.mouse.move(x, y); await page.mouse.click(x, y, { button: "right" });
    assert((await page.locator(".graph-context-menu").textContent()).includes("保卫黄河"));
    await page.locator(".graph-context-menu").getByRole("button", { name: "固定节点", exact: true }).click();
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 55, y + 35, { steps: 10 }); await page.mouse.up(); await page.waitForTimeout(300);
    const guard = graph.entities.find(e => e.name.includes("保卫黄河"));
    assert.equal(await page.locator("[data-last-dragged-node]").first().getAttribute("data-last-dragged-node"), guard.id);
    await page.mouse.click(x + 55, y + 35, { button: "right" });
    assert((await page.locator(".graph-context-menu").textContent()).includes("保卫黄河"));
    await page.locator(".graph-context-menu").getByRole("button", { name: "展开全部 2 跳邻居", exact: true }).click(); await page.waitForTimeout(350);
    assert.equal((await stats()).graphBuildId, id); await checkFull(); await reset();
  });
  await record("背景恢复与双击展开", async () => {
    await page.locator(".search-wrap input").fill("保卫黄河"); await page.locator(".search-result").first().click(); await page.waitForTimeout(500);
    let b = await page.locator(".sigma-container").boundingBox(); await page.mouse.click(b.x + b.width - 12, b.y + 12);
    assert((await page.locator("main").getAttribute("class")).includes("inspector-closed"));
    await page.locator(".search-wrap input").fill("保卫黄河"); await page.locator(".search-result").first().click(); await page.waitForTimeout(500);
    b = await page.locator(".sigma-container").boundingBox(); await page.mouse.dblclick(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(350);
    assert(await page.locator(".knowledge-detail-drawer").isVisible());
    assert((await page.locator(".knowledge-header h2").textContent()).includes("保卫黄河"));
    await page.getByRole("button", { name: "关闭知识详情", exact: true }).click(); await checkFull(); await reset();
  });
  await record("Path Finder：保卫黄河到冼星海", async () => {
    await page.getByRole("button", { name: "路径查询", exact: true }).click(); const finder = page.locator(".graph-path-finder");
    await finder.getByLabel("起点", { exact: true }).fill("保卫黄河"); await finder.locator(".path-entity-results button").filter({ hasText: "保卫黄河" }).first().click();
    await finder.getByLabel("终点", { exact: true }).fill("冼星海"); await finder.locator(".path-entity-results button").filter({ hasText: "冼星海" }).first().click();
    assert((await finder.textContent()).includes("1 跳")); await finder.getByRole("button", { name: "在图中突出此路径", exact: true }).click(); await checkFull(); await reset();
  });
  await record("Canvas 2D 兼容模式", async () => {
    await page.locator(".graph-toolbar-menu summary").click();
    await page.getByRole("button", { name: "WebGL 图谱", exact: true }).click(); assert(await page.locator("canvas.full-graph-canvas").isVisible());
    assert.equal(await page.locator(".sigma-scene-host").count(), 0);
    await page.getByRole("button", { name: "Canvas 回退", exact: true }).click(); await page.locator(".sigma-scene-host canvas").first().waitFor();
    await page.locator(".graph-toolbar-menu summary").click();
  });
  await record("单册、六册和小屏幕", async () => {
    await page.getByRole("button", { name: "7年级上册", exact: true }).click(); assert(await page.getByRole("img", { name: "教材知识图谱" }).isVisible());
    await section("实体类型").getByRole("button", { name: "全部隐藏", exact: true }).click();
    assert.equal(await page.locator(".neo-canvas .svg-node:visible").count(), 0); await reset();
    await page.getByRole("button", { name: "六册叠加", exact: true }).click(); await checkFull(); await reset();
    const finder = page.locator(".graph-path-finder"); if (await finder.count()) await finder.getByRole("button").first().click();
    await page.getByRole("button", { name: "适配画布", exact: true }).click(); await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(output, "explorer-1920.png") });
    await page.setViewportSize({ width: 1366, height: 768 }); await page.waitForTimeout(250);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(output, "explorer-1366.png") });
    await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(250);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert(await page.locator(".explorer-sidebar").evaluate(e => e.getBoundingClientRect().height <= 230));
    await page.screenshot({ path: path.join(output, "explorer-mobile.png"), fullPage: true });
    await page.setViewportSize({ width: 1920, height: 1080 });
  });
  await page.waitForTimeout(350); const paints = async () => Number(await page.locator("[data-render-count]").first().getAttribute("data-render-count"));
  const idleStart = await paints(); await page.waitForTimeout(1000); performanceResults.idleAdditionalPaints = await paints() - idleStart;
  const b = await page.locator(".sigma-container").boundingBox(); await page.mouse.move(b.x + b.width * .42, b.y + b.height * .38);
  const t = Date.now(), p = await paints(); for (let i = 0; i < 48; i++) { await page.mouse.wheel(0, i % 2 ? -42 : 42); await page.waitForTimeout(30); }
  const elapsedMs = Date.now() - t, paintCount = await paints() - p;
  performanceResults.wheel = { elapsedMs, paintCount, renderFps: Number((paintCount * 1000 / elapsedMs).toFixed(1)) };
  performanceResults.memory = await page.evaluate(() => performance.memory ? { usedMb: Number((performance.memory.usedJSHeapSize / 1048576).toFixed(1)), totalMb: Number((performance.memory.totalJSHeapSize / 1048576).toFixed(1)) } : null);
  performanceResults.sceneDom = await page.locator(".sigma-scene-host").evaluate(e => e.querySelectorAll("*").length);
  performanceResults.graph = await checkFull();
  assert.equal(errors.length, 0); assert.equal(consoleErrors.length, 0); assert.equal(failedRequests.length, 0);
  const report = { url, browser: await browser.version(), results, performance: performanceResults, errors, consoleErrors, failedRequests, canonical: { entities: graph.entities.length, relationships: graph.relationships.length }, model: "local_rules_graph_evidence; GPT_not_connected", dataWrites: 0 };
  await writeFile(path.join(output, "browser-report.json"), JSON.stringify(report, null, 2));
  console.log("GRAPH_EXPLORER_BROWSER_PASSED", JSON.stringify({ tests: results.length, performance: performanceResults, errors, consoleErrors, failedRequests }));
} catch (error) {
  await page.screenshot({ path: path.join(output, "failure.png") }).catch(() => {});
  await writeFile(path.join(output, "browser-failure.json"), JSON.stringify({ message: error.message, results, errors, consoleErrors, failedRequests }, null, 2));
  throw error;
} finally { await browser.close(); }
