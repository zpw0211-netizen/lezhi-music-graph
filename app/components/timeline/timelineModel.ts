import type { AppRoute } from "../../lib/app/routing";
import { PUBLISHED_BOOK_NAME_MAP, PUBLISHED_BOOK_ORDER } from "../../lib/app/books";
import type { PeopleLifetimeSupplement } from "../../lib/timeline/peopleSupplement";
import type { WorkYearSupplement } from "../../lib/timeline/yearSupplement";

export type YearRange = [number, number] | null;
export type TimelineYearSource = "textbook" | "supplement";
export type TimelineWork = {
  id: string;
  name: string;
  year: number | null;
  yearRange: YearRange;
  yearText: string | null;
  yearEvidence: { tripleId: string; relation: string } | null;
  bookKey: string;
  unit: string | null;
  printedPage?: number | null;
  yearSource?: TimelineYearSource;
  supplement?: WorkYearSupplement;
};
export type TimelineLifetimeEvidence = { bookKey: string; tripleId: string; kind: string; text: string };
export type TimelinePerson = {
  id: string;
  name: string;
  born: number | null;
  bornRange: YearRange;
  died: number | null;
  diedRange: YearRange;
  lifetimeText: string[];
  lifetimeEvidence: TimelineLifetimeEvidence[];
  sourceEntities: { id: string; bookKey: string }[];
  works: string[];
};
export type TimelineData = { works: TimelineWork[]; people: TimelinePerson[] };
export type TimelineDisplayPerson = TimelinePerson & { supplement?: PeopleLifetimeSupplement };
export type TimelineDataWithPeople = Omit<TimelineData, "people"> & { people: TimelineDisplayPerson[] };
export type TimelineUnit = { bookKey: string; order: number; name: string; title: string };
export type AtlasPrintedWork = { id: string; printedPage: number | null };
export type AtlasTimelineData = {
  regions: { works: AtlasPrintedWork[] }[];
  unassignedWorks: AtlasPrintedWork[];
};
export type TimelineEra = {
  id: string;
  label: string;
  from: number | null;
  to: number | null;
  subtitle: string;
  ancient: boolean;
  undated: boolean;
};
export type TimelineDisplayWork = {
  id: string;
  name: string;
  records: TimelineWork[];
  bookKeys: string[];
  yearRange: YearRange;
  yearText: string;
  hasTextbookYear: boolean;
  hasSupplementYear: boolean;
};
export type TimelineEraGroup = TimelineEra & { works: TimelineDisplayWork[] };

export type WorkYearSupplementLike = Pick<
  WorkYearSupplement,
  "id" | "status" | "yearText" | "yearRange" | "confidence"
> & Partial<WorkYearSupplement>;

export type PeopleLifetimeSupplementLike = Pick<
  PeopleLifetimeSupplement,
  "id" | "status" | "lifetimeText" | "confidence"
> & Partial<PeopleLifetimeSupplement>;

export const BOOKS: Record<string, string> = PUBLISHED_BOOK_NAME_MAP;
export const BOOK_ORDER = PUBLISHED_BOOK_ORDER;
export const UNKNOWN = "教材未标注年代";

const UNDATED_ERA: TimelineEra = {
  id: "era-undated",
  label: UNKNOWN,
  from: null,
  to: null,
  subtitle: "年代未标注",
  ancient: false,
  undated: true,
};

export function withPrintedPages(data: TimelineData, atlas: AtlasTimelineData): TimelineData {
  const printedPages = new Map<string, number>();
  for (const work of [...atlas.regions.flatMap(region => region.works), ...atlas.unassignedWorks]) {
    if (work.printedPage != null) printedPages.set(work.id, work.printedPage);
  }
  return {
    ...data,
    works: data.works.map(work => ({ ...work, printedPage: printedPages.get(work.id) ?? null })),
  };
}

/** Use only reviewed, dated supplement rows to fill a missing textbook year. */
export function withSupplementalYears(
  data: TimelineData,
  supplements: WorkYearSupplementLike[],
): TimelineData {
  const byId = new Map(supplements.map(row => [row.id, row]));
  return {
    ...data,
    works: data.works.map(work => {
      if (work.yearRange) return { ...work, yearSource: "textbook" as const };
      const supplement = byId.get(work.id);
      if (
        !supplement || supplement.status !== "found" ||
        (supplement.confidence !== "high" && supplement.confidence !== "medium") ||
        !supplement.yearRange || !supplement.yearText
      ) return { ...work, yearSource: undefined, supplement: undefined };
      return {
        ...work,
        year: supplement.yearRange[0],
        yearRange: supplement.yearRange,
        yearText: supplement.yearText,
        yearEvidence: null,
        yearSource: "supplement" as const,
        supplement: supplement as WorkYearSupplement,
      };
    }),
  };
}

/** Fill missing person dates from reviewed supplements, preserving every textbook date. */
export function withSupplementalPeople(
  data: TimelineData,
  supplements: PeopleLifetimeSupplementLike[],
): TimelineDataWithPeople {
  const byId = new Map(supplements.map(row => [row.id, row]));
  return {
    ...data,
    people: data.people.map(person => {
      const originalTexts = [...new Set((person.lifetimeEvidence ?? []).map(evidence => evidence.text).filter(Boolean))];
      if (originalTexts.length || person.lifetimeText.some(text => text.trim())) return person;
      const supplement = byId.get(person.id);
      if (
        !supplement || (supplement.status !== "found" && supplement.status !== "partial") ||
        (supplement.confidence !== "high" && supplement.confidence !== "medium") ||
        !supplement.lifetimeText?.trim()
      ) return person;
      return { ...person, supplement: supplement as PeopleLifetimeSupplement };
    }),
  };
}

export function workRoute(work: TimelineWork): AppRoute | null {
  const title = work.name.replace(/^《|》$/g, "");
  return work.unit && Object.hasOwn(BOOKS, work.bookKey)
    ? { view: "records", book: work.bookKey, work: title }
    : null;
}

export function workHref(work: TimelineWork) {
  const route = workRoute(work);
  return route
    ? `#/records/${encodeURIComponent(route.book ?? "")}/${encodeURIComponent(route.work ?? "")}`
    : null;
}

export function personDates(person: TimelineDisplayPerson) {
  const originalTexts = [...new Set((person.lifetimeEvidence ?? []).map(evidence => evidence.text).filter(Boolean))];
  if (originalTexts.length) return originalTexts.join("；");
  if (person.lifetimeText.some(text => text.trim())) return [...new Set(person.lifetimeText.filter(Boolean))].join("；");
  return person.supplement?.lifetimeText?.trim() ? person.supplement.lifetimeText : UNKNOWN;
}

export function personYearSource(person: TimelineDisplayPerson): "textbook" | "supplement" | null {
  if (person.lifetimeEvidence.some(evidence => evidence.text) || person.lifetimeText.some(text => text.trim())) return "textbook";
  return person.supplement?.lifetimeText?.trim() ? "supplement" : null;
}

export function filterWorks(data: TimelineData, book: string, query: string) {
  const text = query.trim().toLocaleLowerCase("zh-CN").replace(/[《》]/g, "");
  return data.works.filter(work => (!book || work.bookKey === book) && work.name.toLocaleLowerCase("zh-CN").replace(/[《》]/g, "").includes(text));
}

export function eraForYear(year: number): TimelineEra {
  if (year < 1700) {
    return { id: "era-ancient", label: "古调", from: null, to: 1699, subtitle: "一七〇〇年以前", ancient: true, undated: false };
  }
  if (year < 1900) {
    const from = Math.floor(year / 50) * 50;
    return { id: `era-${from}`, label: String(from), from, to: from + 49, subtitle: `${from} — ${from + 49}`, ancient: false, undated: false };
  }
  if (year < 1930) {
    return { id: "era-1900", label: "1900", from: 1900, to: 1929, subtitle: "1900 — 1929", ancient: false, undated: false };
  }
  const from = Math.floor(year / 10) * 10;
  return { id: `era-${from}`, label: String(from), from, to: from + 9, subtitle: `${from} 年代`, ancient: false, undated: false };
}

function bareTitle(name: string) {
  return name.replace(/^《|》$/g, "");
}

function yearSourceOf(work: TimelineWork): TimelineYearSource | null {
  if (work.yearSource) return work.yearSource;
  return work.yearRange && work.yearEvidence ? "textbook" : null;
}

function makeDisplayWork(records: TimelineWork[]): TimelineDisplayWork {
  const orderedBookKeys = [...new Set(records.map(work => work.bookKey))].sort(
    (a, b) => BOOK_ORDER.indexOf(a) - BOOK_ORDER.indexOf(b),
  );
  const ranges = records.map(work => work.yearRange).filter((range): range is [number, number] => Boolean(range));
  const yearTexts = [...new Set(records.map(work => work.yearText).filter((text): text is string => Boolean(text)))];
  return {
    id: records.map(work => `${work.bookKey}:${work.id}`).sort().join("+") ,
    name: records[0].name,
    records,
    bookKeys: orderedBookKeys,
    yearRange: ranges.length ? [Math.min(...ranges.map(range => range[0])), Math.max(...ranges.map(range => range[1]))] : null,
    yearText: yearTexts.length ? yearTexts.join("；") : UNKNOWN,
    hasTextbookYear: records.some(work => yearSourceOf(work) === "textbook"),
    hasSupplementYear: records.some(work => yearSourceOf(work) === "supplement"),
  };
}

/** Group works into the prototype's historical eras, merging same-title records within each era. */
export function groupTimelineWorks(works: TimelineWork[]): TimelineEraGroup[] {
  const buckets = new Map<string, { era: TimelineEra; entries: Map<string, TimelineWork[]> }>();
  const sorted = [...works].sort((a, b) =>
    (a.yearRange?.[0] ?? Infinity) - (b.yearRange?.[0] ?? Infinity) ||
    (a.yearRange?.[1] ?? Infinity) - (b.yearRange?.[1] ?? Infinity) ||
    a.name.localeCompare(b.name, "zh-CN") || a.bookKey.localeCompare(b.bookKey),
  );
  for (const work of sorted) {
    const era = work.yearRange ? eraForYear(work.yearRange[0]) : UNDATED_ERA;
    const bucket = buckets.get(era.id) ?? { era, entries: new Map<string, TimelineWork[]>() };
    const key = bareTitle(work.name);
    const records = bucket.entries.get(key) ?? [];
    if (!records.some(record => record.id === work.id && record.bookKey === work.bookKey)) records.push(work);
    bucket.entries.set(key, records);
    buckets.set(era.id, bucket);
  }
  return [...buckets.values()]
    .sort((a, b) => {
      if (a.era.undated) return 1;
      if (b.era.undated) return -1;
      return (a.era.from ?? -Infinity) - (b.era.from ?? -Infinity);
    })
    .map(({ era, entries }) => ({
      ...era,
      works: [...entries.values()].map(makeDisplayWork).sort((a, b) =>
        (a.yearRange?.[0] ?? Infinity) - (b.yearRange?.[0] ?? Infinity) || a.name.localeCompare(b.name, "zh-CN"),
      ),
    }));
}

export function groupWorks(works: TimelineWork[]) {
  return groupTimelineWorks(works);
}
