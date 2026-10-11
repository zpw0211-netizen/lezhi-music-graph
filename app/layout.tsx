import type { Metadata } from "next";
import { PUBLISHED_BOOK_COUNT_LABEL, PUBLISHED_EDITION_LABEL, PUBLISHED_GRADE_RANGE_LABEL } from "./lib/app/books";
import { Geist, Geist_Mono } from "next/font/google";
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
import "./ink-theme.css";
import "./mobile-layout.css";
import "./research.css";
import "./assistant.css";
import "./about.css";
import "./styles/motion.css";
import "./records.css";
import "./atlas.css";
import "./lab.css";
import "./timeline.css";
import "./exploration.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const publicBasePath = isGitHubPages ? "/lezhi-music-graph" : "";
const publicOrigin = isGitHubPages
  ? "https://zpw0211-netizen.github.io/"
  : "https://lezhi-music-graph.zpw0211.chatgpt.site/";

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin),
  title: `芽谱 · 人音版${PUBLISHED_EDITION_LABEL}音乐教材`,
  description:
    `人音版${PUBLISHED_GRADE_RANGE_LABEL}${PUBLISHED_BOOK_COUNT_LABEL}音乐教材的知识图谱：作品、人物、音乐要素与教材出处，一册一册看清楚。`,
  icons: {
    icon: `${publicBasePath}/favicon.svg`,
  },
  openGraph: {
    title: `芽谱 · 人音版${PUBLISHED_EDITION_LABEL}音乐教材`,
    description: `${PUBLISHED_BOOK_COUNT_LABEL}教材共同构成的音乐知识网络，作品、人物与音乐要素一册一册看清楚。`,
    images: [`${publicBasePath}/og.jpg`],
  },
  twitter: {
    card: "summary_large_image",
    title: `芽谱 · 人音版${PUBLISHED_EDITION_LABEL}音乐教材`,
    description: `${PUBLISHED_BOOK_COUNT_LABEL}教材共同构成的音乐知识网络，作品、人物与音乐要素一册一册看清楚。`,
    images: [`${publicBasePath}/og.jpg`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  preload(`${publicBasePath}/fonts/wenkai-display.woff2`, {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });
  // Every page needs the graph index; start downloading it with the scripts
  // instead of after hydration. Matches the fetch() in useGraphIndex.
  preload(`${publicBasePath}/data/graph-index.json`, { as: "fetch", crossOrigin: "anonymous" });
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
