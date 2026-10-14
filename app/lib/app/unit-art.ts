// Unit illustrations for every published book (public/art/units/<book>-u<order>.webp, units 1–6;
// 欢乐谷 / 综合评价 project units use the book cover). Provenance: public/art/units/SOURCES.md.
const UNIT_ART_BOOKS = new Set([
  "g1s1", "g1s2", "g2s1", "g2s2", "g3s1", "g3s2", "g4s1", "g5s1", "g6s1",
  "g7s1", "g7s2", "g8s1", "g8s2", "g9s1", "g9s2",
]);

export function unitArtPath(bookKey: string, order: number) {
  return UNIT_ART_BOOKS.has(bookKey) && order >= 1 && order <= 6 ? `art/units/${bookKey}-u${order}.webp` : null;
}
