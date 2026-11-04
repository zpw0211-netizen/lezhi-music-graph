// Unit illustrations: public/art/units/<book>-u<order>.webp for units 1..unitArt (or the listed orders) of each book in the
// registry (data/books.json); other units (欢乐谷 / 综合评价 …) use the book cover. Provenance: public/art/units/SOURCES.md.
import { BOOK_BY_KEY } from "./books";

export function unitArtPath(bookKey: string, order: number) {
  const art = BOOK_BY_KEY.get(bookKey)?.unitArt ?? 0;
  const has = Array.isArray(art) ? art.includes(order) : order >= 1 && order <= art;
  return has ? `art/units/${bookKey}-u${order}.webp` : null;
}
