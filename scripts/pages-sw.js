// 芽谱离线缓存（prepare-github-pages.mjs 把它写成每个版本目录下的 sw.js，并填入本次构建的版本号）。
// 打开过一次之后，页面、程序和教材数据都从本机缓存秒开；新版本在后台下载好，下次打开时换上。
// 图片在后台对照服务器更新；音频不经过这里。缓存的是服务器上的原文件，不改动图片和数据。
const VERSION = "__YAPU_BUILD__";
const SCOPE = new URL(self.registration.scope).pathname;
const PREFIX = `yapu${SCOPE}`;
const APP_CACHE = `${PREFIX}app-${VERSION}`;
const IMAGE_CACHE = `${PREFIX}images`;
const IMAGE_LIMIT = 400;
const INDEX = SCOPE;
const GRAPH = `${SCOPE}data/graph-index.json`;

const fresh = (url) => fetch(url, { cache: "no-cache" }).then((response) => {
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response;
});

// 预先下载首页、程序文件和图谱数据；任何一项失败就放弃这次安装，继续用旧版本。
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    const page = await fresh(INDEX);
    const html = await page.clone().text();
    const assets = [...new Set([...html.matchAll(/(?:href|src)="([^"]*\/_next\/static\/[^"]+)"/g)].map((match) => match[1]))];
    await cache.put(INDEX, page);
    await Promise.all([GRAPH, ...assets].map(async (url) => cache.put(url, await fresh(url))));
    await self.skipWaiting();
  })());
});

// 删除更早的版本，只留当前和上一个：还开着的旧页面要按需加载的程序文件仍能从上一个版本里取到。
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = (await caches.keys()).filter((name) => name.startsWith(`${PREFIX}app-`) && name !== APP_CACHE);
    const keep = names.at(-1);
    await Promise.all(names.filter((name) => name !== keep).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

// 页面和数据只认当前版本的缓存，免得新旧混用；带哈希名的程序文件也可以从上一个版本里取。
async function appFirst(request, key, anyVersion = false) {
  const cache = await caches.open(APP_CACHE);
  const cached = (await cache.match(key)) ?? (anyVersion ? await caches.match(key) : undefined);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(key, response.clone());
  return response;
}

async function imageFirst(event) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(event.request);
  const update = fetch(event.request).then(async (response) => {
    if (response.ok && response.type === "basic") {
      await cache.put(event.request, response.clone());
      const keys = await cache.keys();
      await Promise.all(keys.slice(0, Math.max(0, keys.length - IMAGE_LIMIT)).map((key) => cache.delete(key)));
    }
    return response;
  });
  if (cached) {
    event.waitUntil(update.catch(() => undefined));
    return cached;
  }
  return update;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("range")) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;
  const rest = url.pathname.slice(SCOPE.length);
  if (request.mode === "navigate") {
    if (rest === "" || rest === "index.html") event.respondWith(appFirst(request, INDEX));
    return;
  }
  if (rest.startsWith("_next/static/")) {
    event.respondWith(appFirst(request, url.pathname + url.search, true));
    return;
  }
  if (rest.startsWith("data/") && rest.endsWith(".json")) {
    event.respondWith(appFirst(request, url.pathname + url.search));
    return;
  }
  if (/\.(webp|png|jpe?g|svg|gif)$/i.test(rest)) event.respondWith(imageFirst(event));
});
