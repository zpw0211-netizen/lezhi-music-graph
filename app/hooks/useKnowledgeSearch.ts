"use client";
import { useMemo } from "react";
import { graphRuntimeFor } from "../graph-runtime";
import { relationTextFor, type Book, type Entity } from "../lib/app/types";

export type SearchResult = {
  entity: Entity;
  book: Book;
  relationCount: number;
  matchedBy: string;
  score: number;
};

/** Ranked name / type / textbook / relation / description search across all six books. */
export function useKnowledgeSearch(books: Book[], query: string) {
  return useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [] as SearchResult[];
    const out: SearchResult[] = [];
    for (const book of books) {
      const runtime = graphRuntimeFor(book, book.entities, book.triples);
      for (const entity of book.entities) {
        const adjacent = runtime.adjacencyMap.get(entity.id) ?? [];
        const fields = {
          name: [entity.name, ...(entity.aliases ?? [])].join(" ").toLowerCase(),
          type: entity.type.toLowerCase(),
          book: book.title.toLowerCase(),
          relation: adjacent.map((item) => relationTextFor(item.edge.predicate, book)).join(" ").toLowerCase(),
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
    }
    return out
      .sort((a, b) => b.score - a.score || b.relationCount - a.relationCount)
      .slice(0, 12);
  }, [books, query]);
}
