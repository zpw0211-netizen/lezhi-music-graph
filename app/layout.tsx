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
import "./melody-line.css";
import "./reflective.css";
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
import "./rhythm.css";
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
  // favicon.ico + PNG for browsers without SVG favicon support (they showed a default icon), SVG for the rest.
  icons: {
    icon: [
      { url: `${publicBasePath}/favicon.ico`, sizes: "16x16 32x32 48x48" },
      { url: `${publicBasePath}/favicon.svg`, type: "image/svg+xml" },
      { url: `${publicBasePath}/icon-192.png`, type: "image/png", sizes: "192x192" },
    ],
    apple: { url: `${publicBasePath}/apple-touch-icon.png`, sizes: "180x180" },
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
  // instead of after hydration. Matches the fetch() in useGraphIndex.
  preload(`${publicBasePath}/data/graph-index.json`, { as: "fetch", crossOrigin: "anonymous" });
  return (
    <html lang="zh-CN">
      <body
        className={`${geistMono.variable} antialiased`}
      >
        <AccountProvider>{children}</AccountProvider>
      </body>
    </html>
  );
}
