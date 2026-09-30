"use client";

/* The static hero must load eagerly at a fixed size to reserve space and protect LCP. */
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { WorkbenchIcon } from "../WorkbenchIcon";
import { SlidingIndicator } from "../graph/SlidingIndicator";
import { MELODIES } from "../../lib/lesson/melodies";
import { publicAssetUrl } from "../../lib/app/assets";
import { getPrintedPage, hasMelody, isStarredWork } from "../../lib/app/unit-data";

type LibraryEntity = { id: string; name: string; type: string; firstPage?: number | null; media?: Array<{ kind: string; url: string; title?: string }> };
// Score titles carry the printed page; firstPage is the PDF page.
const pageLabel = (entity: LibraryEntity) => getPrintedPage(entity.media)
  ? `教材第 ${getPrintedPage(entity.media)} 页`
  : `PDF 第 ${entity.firstPage ?? "—"} 页`;
type LibraryTriple = { id: string; subject: string; predicate: string; objectId?: string | null; literal?: string | null };
type LibraryBookDirectory = { key: string; title: string; grade: number; semester: string; workCount: number };
type LibraryBookData = { entities: LibraryEntity[]; triples: LibraryTriple[] };

const GRADE_NAMES: Record<number, string> = { 7: "七年级", 8: "八年级", 9: "九年级" };
const GRADE_SHORT_NAMES: Record<number, string> = { 7: "七", 8: "八", 9: "九" };
const CREATOR_PREDICATES = ["作曲", "作词", "编曲", "改编"];
const BOOK_ART_DESCRIPTIONS: Record<string, string> = {
  g7s1: "小军鼓和马头琴放在红旗下，远处是草原，彩带环绕画面。",
  g7s2: "京剧脸谱、冬不拉和展开的乐谱摆在舞台帷幕前。",
  g8s1: "胶片、古琴和非洲鼓围绕一张乐谱，摆在书斋中。",
  g8s2: "翻开的诗集旁有竹笛、交响乐大鼓和军号。",
  g9s1: "山水画卷展开成旋律线，旁边有芦笙和水袖舞者。",
  g9s2: "藏族扎念琴、经幡与戏台栏杆和竹板并置。",
};

type WorkCard<E> = {
  work: E;
  creators: Array<{ role: string; name: string }>;
  genre?: string;
  starred: boolean;
};

function playbackBadge(name: string) {
  const melodies = MELODIES[name];
  if (!hasMelody(name, MELODIES)) return null;
  const draft = melodies.every((melody) => melody.quality === "draft");
  const rhythm = melodies.every((melody) => melody.bars.every((bar) => bar.every((note) => note.d === 0 || note.d === 9)));
  const title = draft ? "自动识谱草稿，待人工核对" : rhythm ? "可播放节奏示范" : "可播放旋律示范";
  return <b className="records-audio" title={title}>♪ 可播放</b>;
}

function unitAnchorId(bookKey: string, unitId: string) {
  return `records-${bookKey}-${unitId}`;
}

/** 按课学习目录：用教材插画建立当前册的视觉中心，按单元列出可学习作品。 */
export function WorkLibrary<E extends LibraryEntity, B extends LibraryBookDirectory>({
  books, bookKey, bookData, bookDataStatus, onRetryBookData, isWork, onBook, onOpen,
}: {
  books: B[];
  bookKey: string;
  bookData: (B & LibraryBookData) | null;
  bookDataStatus: "idle" | "loading" | "ready" | "error";
  onRetryBookData: () => void;
  isWork: (type: string) => boolean;
  onBook: (book: B) => void;
  onOpen: (work: E, book: B & LibraryBookData) => void;
}) {
  const [filter, setFilter] = useState("");
  const directory = books.find((item) => item.key === bookKey) ?? books[0];
  const book = bookData?.key === directory?.key ? bookData : null;
  const entities = book?.entities;
  const triples = book?.triples;

  const units = useMemo(() => {
    if (!entities || !triples) return [] as Array<{ id: string; name: string; cards: Array<WorkCard<E>> }>;
    const entityById = new Map(entities.map((entity) => [entity.id, entity]));
    const valueOf = (triple: LibraryTriple) => (triple.objectId ? entityById.get(triple.objectId)?.name : undefined) ?? triple.literal ?? "";
    const triplesBySubject = new Map<string, LibraryTriple[]>();
    for (const triple of triples) {
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
        starred: isStarredWork(own),
      };
    };
    const works = entities.filter((entity) => isWork(entity.type)) as E[];
    const grouped = new Set<string>();
    const result = entities
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
  }, [entities, triples, isWork]);

  const term = filter.trim().toLowerCase();
  const visibleUnits = term
    ? units
        .map((unit) => ({ ...unit, cards: unit.cards.filter((card) => [card.work.name, card.work.type, card.genre ?? "", ...card.creators.map((item) => item.name)].join(" ").toLowerCase().includes(term)) }))
        .filter((unit) => unit.cards.length)
    : units;
  const total = units.reduce((sum, unit) => sum + unit.cards.length, 0);
  const shown = visibleUnits.reduce((sum, unit) => sum + unit.cards.length, 0);
  const unitCount = units.filter((unit) => unit.id !== "other").length;
  // The existing smoke check uses this selector for its first course. Keep it on
  // the first page-ordered work even though cards now render as featured items or rows.
  const firstWorkId = units[0]?.cards[0]?.work.id;
  if (!directory) return null;

  const gradeName = GRADE_NAMES[directory.grade] ?? `${directory.grade}年级`;

  const jumpToUnit = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  };

  return <section className="work-library" data-grade={directory.grade} aria-labelledby="records-book-title">
    <nav className="work-library-books motion-tabs" aria-label="选择教材">
      <SlidingIndicator activeKey={directory.key} />
      {books.map((item) => {
        const label = `${GRADE_SHORT_NAMES[item.grade] ?? item.grade}${item.semester.replace(/册$/, "")}`;
        return <button key={item.key} type="button" className={item.key === directory.key ? "active" : ""} aria-label={`${GRADE_NAMES[item.grade] ?? `${item.grade}年级`}${item.semester}`} aria-pressed={item.key === directory.key} onClick={() => onBook(item)}>
          <b>{label}</b>
        </button>;
      })}
    </nav>

    <section className="records-hero" aria-labelledby="records-book-title">
      <figure className="records-hero-art">
        <img
          src={publicAssetUrl(`/art/${directory.key}.webp`)}
          alt={`${directory.title}插画：${BOOK_ART_DESCRIPTIONS[directory.key] ?? "套色木刻风格的音乐教材插画。"}`}
          width={1200}
          height={750}
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />
      </figure>
      <div className="records-hero-copy">
        <p className="records-kicker">{gradeName} · {directory.semester}</p>
        <h1 id="records-book-title">{directory.title}</h1>
        <span className="records-book-underline" aria-hidden="true" />
        <p className="records-book-count" aria-live="polite">
          {book ? `共 ${total} 首作品，${unitCount} 个单元` : "正在读取本册目录…"}
        </p>
      </div>
    </section>

    <div className="work-library-navigation">
      <div className="work-unit-directory">
        <h2>单元目录</h2>
        {book && visibleUnits.filter((unit) => unit.id !== "other").length > 0
          ? <nav aria-label={`${directory.title}单元目录`}>
              {visibleUnits.filter((unit) => unit.id !== "other").map((unit) => {
                const position = units.findIndex((item) => item.id === unit.id) + 1;
                return <button key={unit.id} type="button" className="work-unit-link" onClick={() => jumpToUnit(unitAnchorId(directory.key, unit.id))}>
                  <span>{String(position).padStart(2, "0")}</span>{unit.name}
                </button>;
              })}
            </nav>
          : <p className="work-unit-directory-empty">{term ? "没有匹配的单元" : "单元目录载入中"}</p>}
      </div>
      <label className="work-library-search">
        <WorkbenchIcon name="search" />
        <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="筛选作品、作者、体裁" aria-label="筛选作品" />
      </label>
    </div>

    {!book && bookDataStatus !== "error" && <div className="app-view-status" role="status" aria-live="polite">正在载入这一册…</div>}
    {!book && bookDataStatus === "error" && <div className="app-view-status" role="status" aria-live="polite">
      <p>这一册数据加载失败，请检查网络后重试。</p>
      <button type="button" onClick={onRetryBookData}>重试</button>
    </div>}

    {book && visibleUnits.map((unit) => {
      const anchorId = unitAnchorId(directory.key, unit.id);
      const position = units.findIndex((item) => item.id === unit.id) + 1;
      const featured = unit.cards.filter((card) => card.starred);
      const regular = unit.cards.filter((card) => !card.starred);
      return <section key={unit.id} id={anchorId} className="work-unit" aria-labelledby={`${anchorId}-title`} data-reveal>
        <h2 id={`${anchorId}-title`}>
          <span className="work-unit-number">{String(position).padStart(2, "0")}</span>
          {unit.name}
          <small>{unit.cards.length} 首</small>
        </h2>
        {featured.length > 0 && <div className="work-featured-list" data-reveal-group>
          {featured.map((card) => <button key={card.work.id} type="button" className={`work-featured${card.work.id === firstWorkId ? " work-card" : ""}`} data-reveal onClick={() => onOpen(card.work, book)}>
            <span className="records-badges">
              <b className="records-star" title="教材标注的重点学习曲目">☆ 重点</b>
              {playbackBadge(card.work.name)}
            </span>
            <strong className="work-featured-title">{card.work.name}</strong>
            <span className="work-featured-details">
              <span className="records-creators">
                {card.creators.length ? card.creators.map((item) => <span key={item.name}><small>{item.role}</small>{item.name}</span>) : <span className="records-muted">作者信息待补充</span>}
              </span>
              {card.genre && <span>{card.genre}</span>}
              <span className="records-page">{pageLabel(card.work)}</span>
            </span>
            <span className="work-featured-action">开始学习<WorkbenchIcon name="right" /></span>
          </button>)}
        </div>}
        {regular.length > 0 && <div className="work-row-list" data-reveal-group>
          {regular.map((card) => <button key={card.work.id} type="button" className={`work-row${card.work.id === firstWorkId ? " work-card" : ""}`} data-reveal onClick={() => onOpen(card.work, book)}>
            <strong className="work-row-title">{card.work.name}</strong>
            <span className="work-row-details">
              {card.genre && <span>{card.genre}</span>}
              <span>{card.creators.length ? card.creators.map((item) => `${item.role}${item.name}`).join("、") : "作者信息待补充"}</span>
              <span className="records-page">{pageLabel(card.work)}</span>
              {playbackBadge(card.work.name)}
            </span>
            <WorkbenchIcon name="right" />
          </button>)}
        </div>}
      </section>;
    })}
    {book && !shown && <p className="work-library-empty">没有找到匹配“{filter}”的作品。</p>}
  </section>;
}
