import {
  BOOK_BY_KEY,
  EDITION,
  stripEditionPrefix,
  BOOK_REGISTRY,
  BOOK_SHORT_NAMES,
  PUBLISHED_BOOK_COUNT_LABEL,
  PUBLISHED_EDITION_LABEL,
  PUBLISHED_GRADE_RANGE_LABEL,
  PUBLISHED_SCOPE_LABEL,
  PUBLISHED_BOOKS,
  PUBLISHED_BOOK_KEYS,
  graphPositionFor,
} from "../../../data/books.mjs";

export type { BookRecord, Edition } from "../../../data/books.mjs";
export { EDITION, stripEditionPrefix, BOOK_BY_KEY, BOOK_REGISTRY, BOOK_SHORT_NAMES, PUBLISHED_BOOK_COUNT_LABEL, PUBLISHED_EDITION_LABEL, PUBLISHED_GRADE_RANGE_LABEL, PUBLISHED_SCOPE_LABEL, PUBLISHED_BOOKS, PUBLISHED_BOOK_KEYS, graphPositionFor };

export const PUBLISHED_BOOK_NAME_MAP = Object.fromEntries(PUBLISHED_BOOKS.map((book) => [book.key, book.fullName]));
export const PUBLISHED_BOOK_ORDER = PUBLISHED_BOOKS.map((book) => book.key);
export const PUBLISHED_BOOK_SHORT_NAMES = Object.fromEntries(PUBLISHED_BOOKS.map((book) => [book.key, book.shortName]));

export type BookStage = "小学" | "初中";
export const BOOK_STAGE_STORAGE_KEY = "yapu-book-stage";
export const BOOK_STAGES: readonly BookStage[] = ["小学", "初中"];

const VOLUME_NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;

export function isBookStage(value: unknown): value is BookStage {
  return value === "小学" || value === "初中";
}

export function bookStageForKey(bookKey: string): BookStage | null {
  const stage = BOOK_BY_KEY.get(bookKey)?.stage;
  return isBookStage(stage) ? stage : null;
}

export function availableBookStages(books: readonly { key: string }[]): BookStage[] {
  return BOOK_STAGES.filter((stage) => books.some((book) => bookStageForKey(book.key) === stage));
}

export function booksForStage<T extends { key: string }>(books: readonly T[], stage: BookStage): T[] {
  return books
    .filter((book) => bookStageForKey(book.key) === stage)
    .sort((left, right) => {
      const leftRecord = BOOK_BY_KEY.get(left.key);
      const rightRecord = BOOK_BY_KEY.get(right.key);
      return (leftRecord?.grade ?? 0) - (rightRecord?.grade ?? 0)
        || Number(leftRecord?.semester === "下册") - Number(rightRecord?.semester === "下册");
    });
}

export function defaultBookStage(books: readonly { key: string }[]): BookStage {
  return availableBookStages(books).includes("小学") ? "小学" : "初中";
}

export function volumeNumeral(bookKey: string, books: readonly { key: string }[]): string {
  const stage = bookStageForKey(bookKey);
  if (!stage) return "一";
  const index = booksForStage(books, stage).findIndex((book) => book.key === bookKey);
  return VOLUME_NUMERALS[index] ?? String(index + 1);
}
