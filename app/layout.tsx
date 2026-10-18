import type { Metadata } from "next";
import { EDITION, PUBLISHED_BOOK_COUNT_LABEL, PUBLISHED_EDITION_LABEL, PUBLISHED_GRADE_RANGE_LABEL } from "./lib/app/books";
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
import "./graph-compact.css";
import "./account.css";
import { AccountProvider } from "./components/account/AccountProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
  title: `芽谱 · ${EDITION.label}${PUBLISHED_EDITION_LABEL}音乐教材`,
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
    title: `芽谱 · ${EDITION.label}${PUBLISHED_EDITION_LABEL}音乐教材`,
    description: `${PUBLISHED_BOOK_COUNT_LABEL}教材共同构成的音乐知识网络，作品、人物与音乐要素一册一册看清楚。`,
    images: [`${publicBasePath}/og.jpg`],
  },
  twitter: {
    card: "summary_large_image",
    title: `芽谱 · ${EDITION.label}${PUBLISHED_EDITION_LABEL}音乐教材`,
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
        <AccountProvider>{children}</AccountProvider>
      </body>
    </html>
  );
}
