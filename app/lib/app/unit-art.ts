// Unit illustrations: public/art/units/<book>-u<order>.webp for units 1..unitArt (or the listed orders) of each book in the
// registry (data/books.json); other units (欢乐谷 / 综合评价 …) use the book cover. Provenance: public/art/units/SOURCES.md.
import { BOOK_BY_KEY } from "./books";

export function unitArtPath(bookKey: string, order: number) {
  const art = BOOK_BY_KEY.get(bookKey)?.unitArt ?? 0;
  const has = Array.isArray(art) ? art.includes(order) : order >= 1 && order <= art;
  return has ? `art/units/${bookKey}-u${order}.webp` : null;
}

// 每课专属插图：public/art/works/<book>/<作品 id>.webp，画的是这首歌 / 这首曲子本身的内容，版式和主题图一样（左 60% 留白）。
// 哪些课有图记在 data/books.json 这一册的 workArt 里（作品名 → 本册作品 id，文件以本册 id 命名；上课模式拿到的是全站作品 id，所以按名字查）。
// 同一首歌在几册里出现时各册各配各的。Provenance: public/art/works/SOURCES.md.
export function workArtPath(bookKey: string | undefined, workName: string) {
  const id = bookKey ? BOOK_BY_KEY.get(bookKey)?.workArt?.[workName] : undefined;
  return id ? `art/works/${bookKey}/${id}.webp` : null;
}
