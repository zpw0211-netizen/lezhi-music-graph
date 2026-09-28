"use client";
import { useMemo } from "react";
import { graphRuntimeFor } from "../graph-runtime";
import { relationTextFor, type CanonicalGraph, type Entity } from "../lib/app/types";

type SearchBook = CanonicalGraph["books"][number];

export type SearchResult = {
  entity: Entity;
  book: SearchBook;
  relationCount: number;
  matchedBy: string;
  score: number;
};

/** Ranked name / type / textbook / relation / description search across the merged graph. */
export function useKnowledgeSearch(canonicalGraph: CanonicalGraph | null, query: string) {
  return useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!canonicalGraph || !terms.length) return [] as SearchResult[];
    const bookByKey = new Map(canonicalGraph.books.map((book) => [book.key, book]));
    const runtime = graphRuntimeFor(canonicalGraph, canonicalGraph.entities, canonicalGraph.relationships);
    const out: SearchResult[] = [];
    for (const entity of canonicalGraph.entities) {
      const adjacent = runtime.adjacencyMap.get(entity.id) ?? [];
      const bookKeys = entity.bookKeys ?? [];
      const book = bookKeys.map((key) => bookByKey.get(key)).find((item) => item) ?? canonicalGraph.books[0];
      if (!book) continue;
      const fields = {
        name: [entity.name, ...(entity.aliases ?? [])].join(" ").toLowerCase(),
        type: entity.type.toLowerCase(),
        book: bookKeys.map((key) => bookByKey.get(key)?.title ?? "").join(" ").toLowerCase(),
        relation: adjacent.map((item) => item.edge.label ?? relationTextFor(item.edge.predicate)).join(" ").toLowerCase(),
        description: (entity.description ?? "").toLowerCase(),
      };
      if (!terms.every((term) => Object.values(fields).some((value) => value.includes(term))))
        continue;
      const score = terms.reduce(
        (total, term) =>
          total +
          (fields.name === term ? 180 : fields.name.startsWith(term) ? 120 : fields.name.includes(term) ? 80 : 0) +
          (fields.type.includes(term) ? 30 : 0) +
          (fields.book.includes(term) ? 24 : 0) +
          (fields.relation.includes(term) ? 18 : 0) +
          (fields.description.includes(term) ? 8 : 0),
        0,
      );
      const matchedBy = fields.name.includes(terms[0])
        ? "名称/别名"
        : fields.type.includes(terms[0])
          ? "实体类型"
          : fields.book.includes(terms[0])
            ? "教材"
            : fields.relation.includes(terms[0])
              ? "关系"
              : "描述";
      out.push({ entity, book, relationCount: adjacent.length, matchedBy, score });
    }
    return out
      .sort((a, b) => b.score - a.score || b.relationCount - a.relationCount)
      .slice(0, 12);
  }, [canonicalGraph, query]);
}
