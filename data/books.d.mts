export type BookRecord = {
  key: string;
  stage: "小学" | "初中";
  grade: number;
  semester: "上册" | "下册";
  shortName: string;
  fullName: string;
  title: string;
  pages: number;
  pdfOffset: number | null;
  published: boolean;
  legacySourceDir?: string;
  coverArt?: boolean;
  /** Units 1..n have an illustration at public/art/units/<key>-u<n>.webp. */
  unitArt?: number;
  fullGraphPosition?: { x: number; y: number };
  explorerPosition?: { x: number; y: number };
};

export type Edition = { key: string; label: string; press: string; basePath: string; notation?: "jianpu" | "staff"; hotSearches?: string[] };
export const EDITION: Edition;
export function stripEditionPrefix(title: string | undefined | null): string;
export const BOOK_REGISTRY: BookRecord[];
export const PUBLISHED_BOOKS: BookRecord[];
export const PUBLISHED_BOOK_KEYS: string[];
export const BOOK_BY_KEY: Map<string, BookRecord>;
export const BOOK_SHORT_NAMES: Record<string, string>;
export const PUBLISHED_BOOK_COUNT_LABEL: string;
export const PUBLISHED_GRADE_RANGE_LABEL: string;
export const PUBLISHED_SCOPE_LABEL: string;
export const PUBLISHED_EDITION_LABEL: string;
export function graphPositionFor(bookKey: string, layout?: "fullGraphPosition" | "explorerPosition"): { x: number; y: number };
