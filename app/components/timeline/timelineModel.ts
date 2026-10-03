import type { AppRoute } from "../../lib/app/routing";

export type YearRange = [number, number] | null;
export type TimelineWork = {
  id: string; name: string; year: number | null; yearRange: YearRange; yearText: string | null;
  yearEvidence: { tripleId: string; relation: string } | null; bookKey: string; unit: string | null;
  printedPage?: number | null;
};
export type TimelineLifetimeEvidence = { bookKey: string; tripleId: string; kind: string; text: string };
export type TimelinePerson = {
  id: string; name: string; born: number | null; bornRange: YearRange; died: number | null; diedRange: YearRange;
  lifetimeText: string[]; lifetimeEvidence: TimelineLifetimeEvidence[];
  sourceEntities: { id: string; bookKey: string }[]; works: string[];
};
export type TimelineData = { works: TimelineWork[]; people: TimelinePerson[] };
export type AtlasPrintedWork = { id: string; printedPage: number | null };
export type AtlasTimelineData = {
  regions: { works: AtlasPrintedWork[] }[];
  unassignedWorks: AtlasPrintedWork[];
};
export const BOOKS: Record<string, string> = {
  g7s1: "七年级上册", g7s2: "七年级下册", g8s1: "八年级上册", g8s2: "八年级下册", g9s1: "九年级上册", g9s2: "九年级下册",
};
export const UNKNOWN = "教材未标注年代";
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
export function workRoute(work: TimelineWork): AppRoute {
  const title = work.name.replace(/^《|》$/g, "");
  return work.bookKey && Object.hasOwn(BOOKS, work.bookKey)
    ? { view: "records", book: work.bookKey, work: title }
    : { view: "lesson", work: title };
}
export function workHref(work: TimelineWork) {
  const route = workRoute(work);
  return route.view === "records"
    ? `#/records/${encodeURIComponent(route.book ?? "")}/${encodeURIComponent(route.work ?? "")}`
    : `#/lesson/${encodeURIComponent(route.work ?? "")}`;
}
export function personDates(person: TimelinePerson) {
  const originalTexts = [...new Set((person.lifetimeEvidence ?? []).map(evidence => evidence.text).filter(Boolean))];
  return originalTexts.length ? originalTexts.join("；") : UNKNOWN;
}
export function filterWorks(data: TimelineData, book: string, query: string) {
  const text = query.trim().toLocaleLowerCase("zh-CN").replace(/[《》]/g, "");
  return data.works.filter(work => (!book || work.bookKey === book) && work.name.toLocaleLowerCase("zh-CN").includes(text));
}
export function groupWorks(works: TimelineWork[]) {
  const groups = new Map<string, TimelineWork[]>();
  const sorted = [...works].sort((a, b) => (a.yearRange?.[0] ?? Infinity) - (b.yearRange?.[0] ?? Infinity) ||
    (a.yearRange?.[1] ?? Infinity) - (b.yearRange?.[1] ?? Infinity) || a.bookKey.localeCompare(b.bookKey) || a.name.localeCompare(b.name, "zh-CN"));
  for (const work of sorted) {
    const label = work.yearRange ? `${Math.floor(work.yearRange[0] / 10) * 10}年代` : UNKNOWN;
    const rows = groups.get(label) ?? [];
    rows.push(work); groups.set(label, rows);
  }
  return [...groups.entries()].map(([label, works], index) => ({ label, works, id: `timeline-era-${index}` }));
}
