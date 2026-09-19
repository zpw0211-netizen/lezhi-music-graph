import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const { chromium } = createRequire("C:/Users/HONOR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json")("playwright");
const graph = JSON.parse(await readFile("public/data/graph-index.json", "utf8")).canonicalGraph;
const output = "../../output/constellation-acceptance"; await mkdir(output, { recursive: true });
const url = process.env.EXPLORER_URL ?? "http://127.0.0.1:4174/lezhi-music-graph/";
const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } }); page.setDefaultTimeout(7000);
const errors = [], httpErrors = [], detailRequests = [], results = [];
page.on("pageerror", e => errors.push(e.message)); page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
page.on("response", r => { if (r.status() >= 400) httpErrors.push({ url: r.url(), status: r.status() }); });
page.on("request", r => { if (/details\/CAN_/.test(r.url())) detailRequests.push(r.url()); });
const stats = () => page.locator("[data-render-count]").evaluate(e => ({ ...e.dataset }));
const graphId = () => page.locator(".sigma-scene-host").getAttribute("data-graph-build-id");
const select = async name => { await page.locator(".search-wrap input").fill(name); await page.locator(".search-result").first().click(); await page.waitForTimeout(450); };
const drawer = () => page.locator(".knowledge-detail-drawer");
const record = async (name, run) => { const value = await run(); results.push({ name, passed: true, value }); console.log("CONSTELLATION_PASS", name); };
const point = async () => { const s = await stats(), b = await page.locator(".sigma-container").boundingBox(), p = JSON.parse(s.selectedViewport); return { x: b.x + p.x, y: b.y + p.y }; };
const menu = async () => { const p = await point(); await page.mouse.click(p.x, p.y, { button: "right" }); };
try {
  const started = Date.now(); await page.goto(url, { waitUntil: "networkidle" }); await page.locator(".sigma-scene-host canvas").first().waitFor(); const firstInteractiveMs = Date.now() - started;
  const initialBuild = await graphId();
  await record("完整数据 / 首屏不请求实体详情 / 远景 LOD", async () => {
    assert.equal(detailRequests.length, 0); assert.equal(await page.locator(".sigma-scene-host").getAttribute("data-full-nodes"), "1337");
    const s = await stats(); assert.equal(s.zoomTier, "0"); assert(Number(s.labelCount) <= 30); assert.equal(Number(s.edgeLabelCount), 0);
    await page.screenshot({ path: `${output}/overview-1920.png` }); return { firstInteractiveMs, ...s };
  });
  await record("九个验收实体 / 类型模板 / 详情 lazy load", async () => {
    for (const name of ["牧歌", "游击队歌", "保卫黄河", "贝多芬", "蒙古族", "民歌", "节奏", "节拍", "进行曲"]) {
      await select(name); const before = detailRequests.length;
      await page.getByRole("button", { name: "查看知识 ↗", exact: true }).click();
      await page.waitForFunction(() => document.querySelector(".knowledge-detail-drawer")?.dataset.detailStatus === "loaded");
      assert((await page.locator(".knowledge-header h2").innerText()).includes(name));
      for (const section of ["核心属性", "教材位置", "教材证据", "知识关系", "跨册关联", "教学应用", "AI 问答入口"]) assert(await drawer().getByRole("heading", { name: section, exact: true }).isVisible());
      assert(detailRequests.length <= before + 1); assert.equal(await graphId(), initialBuild);
      await page.getByRole("button", { name: "关闭知识详情", exact: true }).click();
    }
    return { entities: 9, detailRequests: detailRequests.length };
  });
  await record("Graph ↔ Detail / 历史 / 缓存 / 1366px", async () => {
    await select("牧歌"); await page.getByRole("button", { name: "查看知识 ↗", exact: true }).click();
    await page.waitForTimeout(450); const requests = detailRequests.length;
    const mongol = graph.entities.find(e => e.name === "蒙古族");
    await drawer().locator(`[data-related-id="${mongol.id}"]`).first().click(); await page.waitForTimeout(450);
    assert.equal(await drawer().getAttribute("data-entity-id"), mongol.id); assert.equal((await stats()).selectedId, mongol.id);
    await drawer().getByRole("button", { name: "上一个", exact: true }).click(); await page.waitForTimeout(400);
    assert((await page.locator(".knowledge-header h2").innerText()).includes("牧歌"));
    await drawer().getByRole("button", { name: "下一个", exact: true }).click(); await page.waitForTimeout(400);
    assert.equal(await drawer().getAttribute("data-entity-id"), mongol.id); assert.equal(detailRequests.length, requests);
    await page.setViewportSize({ width: 1366, height: 768 }); await page.waitForTimeout(450);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const b = await drawer().boundingBox(), g = await page.locator(".sigma-container").boundingBox(), p = await point();
    assert(b.width >= 520 && b.width <= 760); assert(g.width > 350); assert(p.x > g.x && p.x < g.x + g.width && p.y > g.y && p.y < g.y + g.height);
    await page.screenshot({ path: `${output}/detail-1366.png` });
    await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(350);
    await page.screenshot({ path: `${output}/detail-1920.png` }); await page.getByRole("button", { name: "关闭知识详情", exact: true }).click();
    return { drawerWidth: b.width, remainingCanvas: g.width, requestsCached: true };
  });
  await record("拖拽位置保持 / Filter / Focus / 取消固定 / 恢复布局", async () => {
    await select("保卫黄河"); const original = JSON.parse((await stats()).selectedPosition), p = await point();
    const paints = Number((await stats()).renderCount), time = Date.now();
    await page.mouse.move(p.x, p.y); await page.mouse.down();
    for (let i = 1; i <= 100; i++) { await page.mouse.move(p.x + i * .85, p.y + Math.sin(i / 15) * 22); await page.waitForTimeout(12); }
    const elapsed = Date.now() - time, frames = Number((await stats()).renderCount) - paints;
    await page.mouse.up(); await page.waitForTimeout(400); const moved = JSON.parse((await stats()).selectedPosition);
    assert(Math.abs(moved.x - original.x) > 1); assert(Number((await stats()).pinnedCount) > 0);
    await menu(); await page.locator(".graph-context-menu").getByRole("button", { name: "取消固定节点", exact: true }).click();
    assert.deepEqual(JSON.parse((await stats()).selectedPosition), moved);
    await page.getByRole("button", { name: "恢复全部筛选", exact: true }).click(); await select("保卫黄河");
    assert.deepEqual(JSON.parse((await stats()).selectedPosition), moved); assert.equal(await graphId(), initialBuild);
    await menu(); await page.locator(".graph-context-menu").getByRole("button", { name: "固定节点", exact: true }).click();
    await menu(); await page.locator(".graph-context-menu").getByRole("button", { name: "恢复布局位置", exact: true }).click(); await page.waitForTimeout(200);
    const restored = JSON.parse((await stats()).selectedPosition); assert(Math.abs(restored.x - original.x) < .001 && Math.abs(restored.y - original.y) < .001);
    return { dragRenderFps: Number((frames * 1000 / elapsed).toFixed(1)), elapsedMs: elapsed, frames, positionRetained: true };
  });
  await record("四级 Semantic Zoom / 双击知识 / 稳定 Graphology", async () => {
    const p = await point(); await page.mouse.dblclick(p.x, p.y); await drawer().waitFor(); await page.getByRole("button", { name: "关闭知识详情", exact: true }).click();
    await page.getByRole("button", { name: "恢复全部筛选", exact: true }).click(); await page.getByRole("button", { name: "适配画布", exact: true }).click(); await page.waitForTimeout(350);
    const g = await page.locator(".sigma-container").boundingBox(); await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
    const tiers = new Set([Number((await stats()).zoomTier)]);
    for (let i = 0; i < 14; i++) { await page.mouse.wheel(0, -65); await page.waitForTimeout(180); const s = await stats(); tiers.add(Number(s.zoomTier)); assert(Number(s.labelCount) <= 262); }
    assert.deepEqual([...tiers].sort(), [0, 1, 2, 3]); assert.equal(await graphId(), initialBuild); return { tiers: [...tiers], labels: (await stats()).labelCount };
  });
  await record("浏览器内连续输入拖拽 FPS（排除控制协议往返）", async () => {
    await page.getByRole("button", { name: "适配画布", exact: true }).click(); await page.waitForTimeout(350);
    await select("保卫黄河"); const original = (await stats()).selectedPosition, p = await point();
    await page.mouse.move(p.x, p.y); await page.mouse.down();
    const sample = await page.evaluate(async ({ x, y }) => {
      const host = document.querySelector("[data-render-count]"); const paints = Number(host.dataset.renderCount), start = performance.now(); let frames = 0;
      await new Promise(resolve => {
        function step(t) {
          frames++; document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, cancelable: true, buttons: 1, clientX: x + Math.sin((t - start) / 400) * 50, clientY: y + Math.cos((t - start) / 400) * 25 }));
          if (t - start < 2500) requestAnimationFrame(step); else resolve();
        }
        requestAnimationFrame(step);
      });
      const elapsedMs = performance.now() - start, renders = Number(host.dataset.renderCount) - paints;
      return { elapsedMs, frames, renders, animationFps: frames * 1000 / elapsedMs, renderFps: renders * 1000 / elapsedMs };
    }, p);
    await page.mouse.up(); await page.waitForTimeout(300); assert.notEqual((await stats()).selectedPosition, original);
    assert.equal(await graphId(), initialBuild);
    const before = Number((await stats()).renderCount); await page.waitForTimeout(1000); sample.idlePaints = Number((await stats()).renderCount) - before;
    assert.equal(sample.idlePaints, 0); return sample;
  });
  await record("详情缺失 fallback / 移动布局 / 页面刷新", async () => {
    await page.route("**/data/details/CAN_*.json", route => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
    await page.reload({ waitUntil: "networkidle" }); await select("贝多芬"); await page.getByRole("button", { name: "查看知识 ↗", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".knowledge-detail-drawer")?.dataset.detailStatus === "fallback");
    assert((await drawer().innerText()).includes("贝多芬")); assert((await drawer().innerText()).includes("教材位置"));
    await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${output}/detail-mobile.png`, fullPage: true }); await page.unroute("**/data/details/CAN_*.json");
  });
  assert.equal(errors.length, 0, errors.join("\n")); assert.equal(httpErrors.length, 0);
  const report = { results, errors, httpErrors, firstInteractiveMs, canonical: graph.quality.canonical, memory: await page.evaluate(() => performance.memory ? { usedMb: performance.memory.usedJSHeapSize / 1048576 } : null), browser: await browser.version() };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2)); console.log("CONSTELLATION_BROWSER_PASSED", JSON.stringify(report));
} catch (error) { await page.screenshot({ path: `${output}/failure.png` }); await writeFile(`${output}/failure.json`, JSON.stringify({ error: error.message, results, errors, httpErrors }, null, 2)); throw error; }
finally { await browser.close(); }
