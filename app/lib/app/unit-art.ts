// Unit illustrations: public/art/units/<book>-u<order>.webp for units 1..unitArt of each book in the
// registry (data/books.json); other units (欢乐谷 / 综合评价 …) use the book cover. Provenance: public/art/units/SOURCES.md.
import { BOOK_BY_KEY } from "./books";

export function unitArtPath(bookKey: string, order: number) {
  const count = BOOK_BY_KEY.get(bookKey)?.unitArt ?? 0;
  return order >= 1 && order <= count ? `art/units/${bookKey}-u${order}.webp` : null;
}
