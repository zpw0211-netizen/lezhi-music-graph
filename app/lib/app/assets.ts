// Every static data or media URL uses the configured deployment base path.
export const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
export const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const publicAssetUrl = (path: string) =>
  `${PUBLIC_BASE_PATH}/${path.replace(/^\/+/, "")}`;
/** 各版本共用的大文件（人声演唱音频）只在站点根目录放一份：yapu.studio/audio/vocal/…（见 prepare-github-pages.mjs）。 */
export const sharedAssetUrl = (path: string) => `/${path.replace(/^\/+/, "")}`;
