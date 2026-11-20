import type { Metadata } from "next";
import { EDITION, PUBLISHED_BOOK_COUNT_LABEL, PUBLISHED_GRADE_RANGE_LABEL } from "./lib/app/books";
import { SITE_NAME } from "./lib/app/brand";
import { Geist_Mono } from "next/font/google";
import { preload } from "react-dom";
import "./styles/tokens.css";
import "./globals.css";
import "./theme-light.css";
import "./graph-explorer.css";
import "./knowledge-detail.css";
import "./workbench-v5.css";
import "./home-portal.css";
import "./home-v6.css";
import "./pages-v5.css";
import "./work-graph.css";
import "./lesson.css";
import "./plan.css";
import "./kmap.css";
import "./melody-line.css";
import "./reflective.css";
import "./ink-theme.css";
import "./mobile-layout.css";
import "./research.css";
import "./assistant.css";
import "./about.css";
import "./styles/motion.css";
import "./records.css";
import "./lab.css";
import "./lab-v2.css";
import "./exploration.css";
import "./rhythm.css";
import "./compose.css";
import "./ear.css";
import "./share.css";
import "./graph-compact.css";
import "./account.css";
import "./beat.css";
import "./vary.css";
import "./choir.css";
import "./unify.css";
import { AccountProvider } from "./components/account/AccountProvider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const RELOAD_ONCE_SCRIPT = `(function(){var K="yapu-reload-at",P=0;function note(t,b){var o=document.getElementById("yapu-reload");if(o)o.remove();var e=document.createElement(b?"button":"div");e.id="yapu-reload";e.textContent=t;if(b){e.type="button";e.onclick=function(){location.reload()}}e.style.cssText="position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:9999;padding:10px 20px;border:0;border-radius:999px;background:#1E7A4A;color:#fff;font:inherit;font-size:15px;white-space:nowrap;box-shadow:0 6px 20px rgba(0,0,0,.22)"+(b?";cursor:pointer":"");(document.body||document.documentElement).appendChild(e)}window.__yapuReload=function(q){if(P)return true;var n=Date.now();try{if(n-(+sessionStorage.getItem(K)||0)<6e4)throw 0;sessionStorage.setItem(K,""+n)}catch(x){if(!q)note("页面没有载入完整，点这里刷新",1);return false}P=1;if(!q)note("网络有点不稳，正在重新载入…");setTimeout(function(){location.reload()},1200);return true};var S="/_next/static/",css=[].slice.call(document.querySelectorAll("link[rel=stylesheet]")).filter(function(l){return l.href.indexOf(S)>=0}),bad=0;addEventListener("error",function(e){var t=e.target;if(t&&t.tagName==="SCRIPT"&&t.src.indexOf(S)>=0){bad=1;window.__yapuReload()}},true);addEventListener("load",function(){if(css.some(function(l){try{return!l.sheet||!l.sheet.cssRules.length}catch(x){return false}}))return window.__yapuReload();if(window.__VINEXT_RSC_BOOTSTRAP_STATE__)return;if(bad||performance.getEntriesByType("resource").some(function(r){return r.name.indexOf(S)>=0&&r.responseStatus>=400}))window.__yapuReload()})})()`;
const publicBasePath = isGitHubPages ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "") : "";
const publicOrigin = isGitHubPages
  ? "https://yapu.studio/"
  : "https://lezhi-music-graph.zpw0211.chatgpt.site/";

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin),
  title: SITE_NAME,
  description:
    `${EDITION.label}${PUBLISHED_GRADE_RANGE_LABEL}${PUBLISHED_BOOK_COUNT_LABEL}音乐教材的知识图谱：作品、人物、音乐要素与教材出处，一册一册看清楚。`,
  // ?v=2: the 芽谱AI mark replaced the old sprout; the query makes browsers drop their cached icon.
  // favicon.ico + PNG for browsers without SVG favicon support (they showed a default icon), SVG for the rest.
  icons: {
    icon: [
      { url: `${publicBasePath}/favicon.ico?v=2`, sizes: "16x16 32x32 48x48" },
      { url: `${publicBasePath}/favicon.svg?v=2`, type: "image/svg+xml" },
      { url: `${publicBasePath}/icon-192.png?v=2`, type: "image/png", sizes: "192x192" },
    ],
    apple: { url: `${publicBasePath}/apple-touch-icon.png?v=2`, sizes: "180x180" },
  },
  openGraph: {
    title: SITE_NAME,
    description: `${PUBLISHED_BOOK_COUNT_LABEL}教材共同构成的音乐知识网络，作品、人物与音乐要素一册一册看清楚。`,
    images: [`${publicBasePath}/og.jpg`],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: `${PUBLISHED_BOOK_COUNT_LABEL}教材共同构成的音乐知识网络，作品、人物与音乐要素一册一册看清楚。`,
    images: [`${publicBasePath}/og.jpg`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Every page needs the graph index; start downloading it with the scripts
  // instead of after hydration. Matches the fetch() in useGraphIndex. The book directory
  // comes first so 按课学习 can open early; the full graph yields bandwidth to it.
  preload(`${publicBasePath}/data/graph-books.json`, { as: "fetch", crossOrigin: "anonymous", fetchPriority: "high" });
  preload(`${publicBasePath}/data/graph-index.json`, { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });
  return (
    <html lang="zh-CN">
      <body
        className={`${geistMono.variable} antialiased`}
      >
        {/*
          整页的程序或样式文件偶尔会被服务器回 503：那时页面卡在半成品上，所以自动刷新一次（一分钟内最多一次，免得真断网时来回刷）。
          这段脚本只管页面一打开就要的文件。它要等前面的样式表载完才运行，所以页面 load 时再查一遍：样式表有没有载上（载入失败的表在 Chrome 里是一张空表）、入口程序有没有跑起来。
          工具的程序文件按需载入，失败时由 ViewLoading 和 global-error.tsx 调这里的 __yapuReload；后台预取失败不碍事，不刷新。
        */}
        <script dangerouslySetInnerHTML={{ __html: RELOAD_ONCE_SCRIPT }} />
        {/* 全站标题用的楷体：界面字每页都用；单元名和扩展字两个文件只在标题里出现这些字时才下载。scripts/brand/build-site-font.py 生成。 */}
        <style>{[["Yapu Kai", "yapu-kai"], ["Yapu Kai Units", "yapu-kai-units"], ["Yapu Kai Ext", "yapu-kai-ext"]].map(([family, file]) =>
          `@font-face{font-family:"${family}";src:url("${publicBasePath}/fonts/${file}.woff2") format("woff2");font-weight:100 900;font-display:swap}`).join("")}</style>
        <AccountProvider>{children}</AccountProvider>
        {/* Offline cache, written per edition by prepare-github-pages.mjs from scripts/pages-sw.js. */}
        {publicBasePath && (
          <script
            dangerouslySetInnerHTML={{
              // 新版本在后台换上后，已经开着的页面还是旧的：给一条提示，由使用者决定什么时候刷新（上课中不打断）。
              __html: `if("serviceWorker"in navigator){var s=navigator.serviceWorker,had=!!s.controller;s.addEventListener("controllerchange",function(){if(!had){had=true;return}if(document.getElementById("yapu-update"))return;var b=document.createElement("button");b.id="yapu-update";b.type="button";b.textContent="网站有新版本，点这里刷新";b.style.cssText="position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:9999;padding:10px 20px;border:0;border-radius:999px;background:#1E7A4A;color:#fff;font:inherit;font-size:15px;white-space:nowrap;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.22)";b.onclick=function(){location.reload()};document.body.appendChild(b)});addEventListener("load",function(){s.register("${publicBasePath}/sw.js",{scope:"${publicBasePath}/"}).catch(function(){})})}`,
            }}
          />
        )}
      </body>
    </html>
  );
}
