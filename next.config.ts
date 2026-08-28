import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const githubPagesBasePath = "/lezhi-music-graph";

const nextConfig: NextConfig = {
  // GitHub Pages serves the project below /lezhi-music-graph/.
  // The normal Sites build keeps the existing root-path behavior.
  ...(isGitHubPages
    ? {
        output: "export",
        // Vinext's static prerender currently resolves `/` as 404 when Next's
        // basePath is set. assetPrefix plus NEXT_PUBLIC_BASE_PATH provides the
        // same subpath-safe asset and data behavior without splitting the UI.
        assetPrefix: `${githubPagesBasePath}/`,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
