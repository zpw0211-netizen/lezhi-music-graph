"use client";
import { useMemo, useState } from "react";
import { WorkbenchIcon } from "../WorkbenchIcon";
import { MELODIES } from "../../lib/lesson/melodies";

type LibraryEntity = { id: string; name: string; type: string; firstPage?: number | null; media?: Array<{ title?: string }> };
// Score titles carry the printed page ("教材第44页"); firstPage is the PDF page.
const printedPage = (entity: LibraryEntity) => entity.media?.map((asset) => asset.title?.match(/教材第(\d+)页/)?.[1]).find(Boolean);
type LibraryTriple = { id: string; subject: string; predicate: string; objectId?: string | null; literal?: string | null };
type LibraryBook = { key: string; title: string; grade: number; semester: string; workCount: number; entities: LibraryEntity[]; triples: LibraryTriple[] };

const GRADE_NAMES: Record<number, string> = { 7: "七年级", 8: "八年级", 9: "九年级" };
const CREATOR_PREDICATES = ["作曲", "作词", "编曲", "改编"];

type WorkCard<E> = {
  work: E;
  creators: Array<{ role: string; name: string }>;
  genre?: string;
  tempo?: string;
  activities: string[];
  relationCount: number;
  starred: boolean;
};

/** 按课学习 directory: works grouped by textbook unit; each card opens that lesson. */
export function WorkLibrary<E extends LibraryEntity, B extends LibraryBook>({
  books, bookKey, isWork, onBook, onOpen,
}: {
  books: B[];
  bookKey: string;
  isWork: (type: string) => boolean;
  onBook: (book: B) => void;
  onOpen: (work: E, book: B) => void;
}) {
  const [filter, setFilter] = useState("");
  const book = books.find((item) => item.key === bookKey) ?? books[0];

  const units = useMemo(() => {
    if (!book) return [] as Array<{ id: string; name: string; cards: Array<WorkCard<E>> }>;
    const entityById = new Map(book.entities.map((entity) => [entity.id, entity]));
    const valueOf = (triple: LibraryTriple) => (triple.objectId ? entityById.get(triple.objectId)?.name : undefined) ?? triple.literal ?? "";
    const triplesBySubject = new Map<string, LibraryTriple[]>();
    for (const triple of book.triples) {
      if (!triplesBySubject.has(triple.subject)) triplesBySubject.set(triple.subject, []);
      triplesBySubject.get(triple.subject)!.push(triple);
    }
    const cardFor = (work: E): WorkCard<E> => {
      const own = triplesBySubject.get(work.id) ?? [];
      const first = (predicate: string) => own.find((triple) => triple.predicate === predicate);
      const creators: Array<{ role: string; name: string }> = [];
      for (const role of CREATOR_PREDICATES)
        for (const triple of own.filter((item) => item.predicate === role)) {
          const name = valueOf(triple);
          const existing = creators.find((item) => item.name === name);
          if (existing) existing.role = `${existing.role}/${role}`;
          else if (name) creators.push({ role, name });
        }
      return {
        work,
        creators: creators.slice(0, 3),
        genre: first("音乐体裁") ? valueOf(first("音乐体裁")!) : undefined,
        tempo: first("速度特点") ? valueOf(first("速度特点")!) : undefined,
        activities: [...new Set(own.filter((triple) => triple.predicate === "学习方式").map(valueOf))].slice(0, 3),
        relationCount: own.length,
        starred: own.some((triple) => triple.predicate === "教材标注"),
      };
    };
    const works = book.entities.filter((entity) => isWork(entity.type)) as E[];
    const grouped = new Set<string>();
    const result = book.entities
      .filter((entity) => entity.type === "单元")
      .sort((a, b) => (a.firstPage ?? 0) - (b.firstPage ?? 0) || a.name.localeCompare(b.name, "zh"))
      .map((unit) => {
        const ids = new Set((triplesBySubject.get(unit.id) ?? []).filter((triple) => triple.predicate === "包含作品").map((triple) => triple.objectId));
        const cards = works.filter((work) => ids.has(work.id)).sort((a, b) => (a.firstPage ?? 0) - (b.firstPage ?? 0)).map(cardFor);
        cards.forEach((card) => grouped.add(card.work.id));
        return { id: unit.id, name: unit.name, cards };
      })
      .filter((unit) => unit.cards.length);
    const rest = works.filter((work) => !grouped.has(work.id)).sort((a, b) => (a.firstPage ?? 0) - (b.firstPage ?? 0)).map(cardFor);
    if (rest.length) result.push({ id: "other", name: "其他收录作品", cards: rest });
    return result;
  }, [book, isWork]);

  const term = filter.trim().toLowerCase();
  const visibleUnits = term
    ? units
        .map((unit) => ({ ...unit, cards: unit.cards.filter((card) => [card.work.name, card.work.type, card.genre ?? "", ...card.creators.map((item) => item.name)].join(" ").toLowerCase().includes(term)) }))
        .filter((unit) => unit.cards.length)
    : units;
  const total = units.reduce((sum, unit) => sum + unit.cards.length, 0);
  const shown = visibleUnits.reduce((sum, unit) => sum + unit.cards.length, 0);
  if (!book) return null;

  return <section className="work-library" aria-labelledby="work-library-title">
    <header className="work-library-head">
      <div>
        <h2 id="work-library-title">按课学习</h2>
        <p>按教材单元一课一课地学：查看教材谱例、试听已整理的旋律或节奏，并结合知识要点、课堂活动和小练习学习；老师可以进入上课模式。</p>
      </div>
      <label className="work-library-search">
        <WorkbenchIcon name="search" />
        <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="筛选作品、作者、体裁" aria-label="筛选作品" />
      </label>
    </header>
    <nav className="work-library-books" aria-label="选择教材">
      {books.map((item) => <button key={item.key} type="button" className={`grade-${item.grade} ${item.key === book.key ? "active" : ""}`} aria-pressed={item.key === book.key} onClick={() => onBook(item)}>
        <b>{GRADE_NAMES[item.grade] ?? `${item.grade}年级`}{item.semester}</b>
        <small>{item.workCount} 首作品</small>
      </button>)}
    </nav>
    <p className="work-library-count">{book.title} · {term ? `筛选出 ${shown} / ${total} 首` : `共 ${total} 首作品，${units.filter((unit) => unit.id !== "other").length} 个单元`}</p>
    {visibleUnits.map((unit) => <section key={unit.id} className="work-unit">
      <h3>{unit.name}<small>{unit.cards.length} 首</small></h3>
      <div className="work-grid">
        {unit.cards.map((card) => <button key={card.work.id} type="button" className={`work-card grade-${book.grade}`} onClick={() => onOpen(card.work, book)}>
          <span className="work-card-top"><em>{card.work.type}</em>{card.starred && <b className="work-card-star" title="教材标注的重点学习曲目">☆ 重点</b>}{MELODIES[card.work.name] && <b className="work-card-audio" title={MELODIES[card.work.name].every((item) => item.quality === "draft") ? "自动识谱草稿，待人工核对" : "可播放旋律示范"}>{MELODIES[card.work.name].every((item) => item.quality === "draft") ? "♪ 识谱草稿" : "♪ 旋律"}</b>}<small>{printedPage(card.work) ? `第 ${printedPage(card.work)} 页` : `PDF ${card.work.firstPage ?? "—"}`}</small></span>
          <strong>{card.work.name}</strong>
          <span className="work-card-creators">{card.creators.length ? card.creators.map((item) => <span key={item.name}><small>{item.role}</small>{item.name}</span>) : <span className="muted">作者信息待补充</span>}</span>
          <span className="work-card-facts">
            {card.genre && <i>{card.genre}</i>}
            {card.tempo && <i>{card.tempo}</i>}
            {card.activities.map((activity) => <i key={activity} className="is-activity">{activity}</i>)}
          </span>
          <span className="work-card-foot"><span>{card.relationCount} 条关系</span><span>开始学习<WorkbenchIcon name="right" /></span></span>
        </button>)}
      </div>
    </section>)}
    {!shown && <p className="work-library-empty">没有找到匹配“{filter}”的作品。</p>}
  </section>;
}
