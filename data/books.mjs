import registry from "./books.json" with { type: "json" };

export const BOOK_REGISTRY = registry.books;
export const PUBLISHED_BOOKS = BOOK_REGISTRY.filter((book) => book.published);
export const PUBLISHED_BOOK_KEYS = PUBLISHED_BOOKS.map((book) => book.key);
export const BOOK_BY_KEY = new Map(BOOK_REGISTRY.map((book) => [book.key, book]));
export const BOOK_SHORT_NAMES = Object.fromEntries(BOOK_REGISTRY.map((book) => [book.key, book.shortName]));

const CHINESE_NUMERALS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
const chineseCount = (count) => count <= 10 ? CHINESE_NUMERALS[count] : count < 20 ? `十${CHINESE_NUMERALS[count - 10]}` : String(count);
export const PUBLISHED_BOOK_COUNT_LABEL = `${chineseCount(PUBLISHED_BOOKS.length)}册`;
const publishedGrades = PUBLISHED_BOOKS.map((book) => book.grade);
export const PUBLISHED_GRADE_RANGE_LABEL = publishedGrades.length
  ? `${chineseCount(Math.min(...publishedGrades))}至${chineseCount(Math.max(...publishedGrades))}年级`
  : "教材";
const allPublishedGradesHaveBothTerms = publishedGrades.length > 0 && [...new Set(publishedGrades)].every((grade) => {
  const terms = new Set(PUBLISHED_BOOKS.filter((book) => book.grade === grade).map((book) => book.semester));
  return terms.has("上册") && terms.has("下册");
});
export const PUBLISHED_SCOPE_LABEL = allPublishedGradesHaveBothTerms
  ? `${PUBLISHED_GRADE_RANGE_LABEL}上下册，共${PUBLISHED_BOOK_COUNT_LABEL}教材`
  : `${PUBLISHED_GRADE_RANGE_LABEL}，共${PUBLISHED_BOOK_COUNT_LABEL}教材`;
export const PUBLISHED_EDITION_LABEL = new Set(PUBLISHED_BOOKS.map((book) => book.stage)).size > 1
  ? "中小学"
  : PUBLISHED_BOOKS[0]?.stage ?? "音乐";

const CENTER = { x: 1200, y: 750 };
const LAYOUT = { width: 2400, height: 1500, margin: 90 };

/** Keep the six established anchors; distribute newly registered books on a deterministic outer ring. */
export function graphPositionFor(bookKey, layout = "fullGraphPosition") {
  const book = BOOK_BY_KEY.get(bookKey);
  if (!book) return CENTER;
  if (book[layout]) return book[layout];

  const unanchored = BOOK_REGISTRY.filter((item) => !item[layout]);
  const index = unanchored.findIndex((item) => item.key === bookKey);
  if (index < 0) return CENTER;
  const angle = -Math.PI / 2 + (index / unanchored.length) * Math.PI * 2;
  const radiusX = LAYOUT.width / 2 - LAYOUT.margin;
  const radiusY = LAYOUT.height / 2 - LAYOUT.margin;
  return {
    x: Math.round(CENTER.x + Math.cos(angle) * radiusX),
    y: Math.round(CENTER.y + Math.sin(angle) * radiusY),
  };
}
