// GitHub Pages serves the site below a sub-path and has no backend; the Sites
// build serves from the root. Every static data or media URL goes through here.
export const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
export const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const publicAssetUrl = (path: string) =>
  `${PUBLIC_BASE_PATH}/${path.replace(/^\/+/, "")}`;
