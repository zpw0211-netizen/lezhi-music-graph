import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./theme-light.css";

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
  title: "芽谱——中小学音乐教育知识图谱与智能分析平台",
  description:
    "面向中小学音乐教育的跨教材知识图谱、教材证据、多模态资源与智能分析平台。",
  icons: {
    icon: `${publicBasePath}/favicon.svg`,
  },
  openGraph: {
    title: "芽谱——中小学音乐教育知识图谱与智能分析平台",
    description: "探索六册教材共同构成的中小学音乐知识网络与跨册关联。",
    images: [`${publicBasePath}/og.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "芽谱——中小学音乐教育知识图谱与智能分析平台",
    description: "探索六册教材共同构成的中小学音乐知识网络与跨册关联。",
    images: [`${publicBasePath}/og.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
