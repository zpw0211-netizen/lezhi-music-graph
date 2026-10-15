// Every static data or media URL uses the configured deployment base path.
export const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
export const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const publicAssetUrl = (path: string) =>
  `${PUBLIC_BASE_PATH}/${path.replace(/^\/+/, "")}`;
