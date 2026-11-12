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
import "./exploration.css";
import "./rhythm.css";
import "./compose.css";
import "./ear.css";
import "./graph-compact.css";
import "./account.css";
import { AccountProvider } from "./components/account/AccountProvider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const isGitHubPages = process.env.GITHUB_PAGES === "true";
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
