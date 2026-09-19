import type { GraphEntity, GraphRelationship } from "./types";
export type DetailEntity = GraphEntity & {
  descriptions?: string[];
  firstPageByBook?: Record<string, number>;
  media?: Array<{ kind: "audio" | "video" | "score" | "image"; url: string; title?: string; source?: string }>;
};
export type DetailEvidence = { pdfPage?: number | null; textbookPage?: string; summary?: string; region?: string };
export type DetailRelationship = GraphRelationship & {
  literal?: string | null; sourcePage?: number | null;
  sources?: Array<{ bookKey: string; bookTitle: string; pdfPage?: number | null; evidence?: DetailEvidence[] }>;
};
export type DetailOccurrence = {
  id: string; textbook: string; textbookTitle: string; page?: number | null;
  unit?: string | null; lesson?: string | null; sourceText?: string | null;
  evidence?: DetailEvidence[];
};
export type KnowledgeDetail = {
  entity: DetailEntity; relationships: DetailRelationship[]; occurrences: DetailOccurrence[];
};

const detailCache = new Map<string, Promise<KnowledgeDetail | null>>();
export function loadKnowledgeDetail(basePath: string, id: string) {
  const url = `${basePath}/data/details/${encodeURIComponent(id)}.json`;
  const existing = detailCache.get(url);
  if (existing) return existing;
  const request = fetch(url).then(async response => {
    if (!response.ok) return null;
    const value = await response.json() as KnowledgeDetail;
    return value.entity?.id === id && Array.isArray(value.relationships) && Array.isArray(value.occurrences) ? value : null;
  }).catch(() => { detailCache.delete(url); return null; });
  // Bound memory across long exploration sessions; visited pages are otherwise shared.
  if (detailCache.size >= 96) detailCache.delete(detailCache.keys().next().value!);
  detailCache.set(url, request);
  return request;
}
