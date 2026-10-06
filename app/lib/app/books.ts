import {
  BOOK_BY_KEY,
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

export type { BookRecord } from "../../../data/books.mjs";
export { BOOK_BY_KEY, BOOK_REGISTRY, BOOK_SHORT_NAMES, PUBLISHED_BOOK_COUNT_LABEL, PUBLISHED_EDITION_LABEL, PUBLISHED_GRADE_RANGE_LABEL, PUBLISHED_SCOPE_LABEL, PUBLISHED_BOOKS, PUBLISHED_BOOK_KEYS, graphPositionFor };

export const PUBLISHED_BOOK_NAME_MAP = Object.fromEntries(PUBLISHED_BOOKS.map((book) => [book.key, book.fullName]));
export const PUBLISHED_BOOK_ORDER = PUBLISHED_BOOKS.map((book) => book.key);
export const PUBLISHED_BOOK_SHORT_NAMES = Object.fromEntries(PUBLISHED_BOOKS.map((book) => [book.key, book.shortName]));
