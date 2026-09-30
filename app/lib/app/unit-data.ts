export type WorkMetadataTriple = {
  predicate: string;
};

export type WorkMediaAsset = {
  kind: string;
  url: string;
  title?: string;
  source?: string;
};

export type UnitTask = {
  text: string;
  works: string[];
  focus: string[];
};

export const isStarredWork = (triples: readonly WorkMetadataTriple[]) =>
  triples.some((triple) => triple.predicate === "教材标注");

export const hasMelody = (
  name: string,
  melodies: Readonly<Record<string, readonly unknown[] | undefined>>,
) => Boolean(melodies[name]?.length);

export const getScoreMedia = (media?: readonly WorkMediaAsset[]) =>
  (media ?? []).filter((asset) => asset.kind === "score");

export const getPrintedPage = (media?: readonly Pick<WorkMediaAsset, "title">[]) => {
  const match = media?.map((asset) => asset.title?.match(/教材第(\d+)页/)?.[1]).find(Boolean);
  return match ? Number(match) : null;
};

/** Split textbook task suffixes into display text, mentioned works and practice focus. */
export const parseUnitTask = (literal: string): UnitTask => {
  const metadataStart = literal.search(/（(?=涉及|练习重点：)/);
  if (metadataStart < 0) return { text: literal, works: [], focus: [] };

  const text = literal.slice(0, metadataStart).trimEnd();
  const metadata = literal.slice(metadataStart + 1);
  const mentions = metadata.match(/涉及([\s\S]*?)(?:；|练习重点：|$)/)?.[1] ?? "";
  const works = [...new Set([...mentions.matchAll(/《[^》]+》/g)].map((match) => match[0]))];
  const focusSource = metadata.match(/练习重点：([\s\S]*)$/)?.[1]?.replace(/）$/, "") ?? "";
  const focus = [...new Set(focusSource.split(/[、，,；;]/).map((item) => item.trim()).filter(Boolean))];

  return { text, works, focus };
};
