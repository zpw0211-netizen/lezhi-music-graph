import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  // GitHub Pages serves the project below /lezhi-music-graph/.
  // The normal Sites build keeps the existing root-path behavior.
  ...(isGitHubPages
    ? {
        output: 'export',
        assetPrefix: '/lezhi-music-graph/',
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
