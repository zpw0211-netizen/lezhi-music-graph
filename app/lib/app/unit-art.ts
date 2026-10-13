// Unit illustrations exist only for the books listed here (public/art/units/<book>-u<order>.webp,
// units 1–6). Other books fall back to their cover until their unit art is painted.
const UNIT_ART_BOOKS = new Set(["g7s1", "g7s2", "g8s1", "g8s2", "g9s1", "g9s2"]);

export function unitArtPath(bookKey: string, order: number) {
  return UNIT_ART_BOOKS.has(bookKey) && order >= 1 && order <= 6 ? `art/units/${bookKey}-u${order}.webp` : null;
}
