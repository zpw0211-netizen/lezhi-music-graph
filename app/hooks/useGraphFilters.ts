"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ALL_SCHEMA_KEYS, schemaCategoryFor, type SchemaCategoryKey } from "../graph-schema";
import type { GraphEntity, GraphRelationship } from "../lib/graph/types";
import type { EvidencePayload } from "../lib/ai/graph-rag";

export type PropertyFilters = { books: string[]; grades: string[]; semesters: string[]; entityType: string; crossBook: string; minConfidence: string; evidence: string; keyword: string };
export const DEFAULT_PROPERTIES: PropertyFilters = { books: [], grades: [], semesters: [], entityType: "all", crossBook: "all", minConfidence: "0", evidence: "all", keyword: "" };
export type FilterBook = { key: string; title: string; grade?: number; semester?: string };
export type FilterEntity = GraphEntity & { confidence?: number };

export function filterGraphEntities(entities: FilterEntity[], relationships: GraphRelationship[], books: FilterBook[], properties: PropertyFilters, evidenceIds: Set<string> | null, focusedIds: string[] | null) {
  const allowedBooks = new Set(books.filter(book => (!properties.books.length || properties.books.includes(book.key)) && (!properties.grades.length || properties.grades.includes(String(book.grade ?? Number(book.key[1])))) && (!properties.semesters.length || properties.semesters.includes(book.semester ?? (book.key.endsWith("1") ? "上册" : "下册")))).map(book => book.key));
  const hasBookFilter = properties.books.length || properties.grades.length || properties.semesters.length;
  const focus = focusedIds ? new Set(focusedIds) : null;
  const term = properties.keyword.trim().toLowerCase();
  const keywordIds = new Set(entities.filter(entity => [entity.name, ...(entity.aliases ?? [])].some(name => name.toLowerCase().includes(term))).map(entity => entity.id));
  if (term) {
    const seeds = new Set(entities.filter(entity => [entity.name, ...(entity.aliases ?? [])].some(name => name.toLowerCase().includes(term))).map(entity => entity.id));
    keywordIds.clear(); seeds.forEach(id => keywordIds.add(id));
    for (const edge of relationships) if (!edge.provenance && !/教材|收录|包含单元/.test(edge.label ?? edge.predicate)) {
      if (seeds.has(edge.subject) && edge.objectId) keywordIds.add(edge.objectId);
      if (edge.objectId && seeds.has(edge.objectId)) keywordIds.add(edge.subject);
    }
  }
  return new Set(entities.filter(entity => (!hasBookFilter || entity.bookKeys?.some(key => allowedBooks.has(key))) && (properties.entityType === "all" || schemaCategoryFor(entity.type) === properties.entityType) && (properties.crossBook === "all" || ((entity.textbookCount ?? entity.bookKeys?.length ?? 1) >= 2) === (properties.crossBook === "yes")) && (entity.confidence ?? 0) >= Number(properties.minConfidence) && (properties.evidence === "all" || (evidenceIds !== null && evidenceIds.has(entity.id) === (properties.evidence === "yes"))) && (!term || keywordIds.has(entity.id)) && (!focus || focus.has(entity.id))).map(entity => entity.id));
}

export function useGraphFilters(entities: FilterEntity[], relationships: GraphRelationship[], books: FilterBook[], assetUrl: (path: string) => string) {
  const [visibleSchemaKeys, setVisibleSchemaKeys] = useState<SchemaCategoryKey[]>([...ALL_SCHEMA_KEYS]);
  const [hiddenRelations, setHiddenRelations] = useState<string[]>([]);
  const [properties, setProperties] = useState<PropertyFilters>({ ...DEFAULT_PROPERTIES });
  const [focusedEntityIds, setFocusedEntityIds] = useState<string[] | null>(null);
  const [evidenceIds, setEvidenceIds] = useState<Set<string> | null>(null);
  const [evidenceStatus, setEvidenceStatus] = useState("idle");
  const cache = useRef(new Map<string, Promise<EvidencePayload>>());
  useEffect(() => {
    if (properties.evidence === "all" || evidenceIds) return;
    let active = true;
    const load = async () => {
      setEvidenceStatus("loading");
      const payloads = await Promise.all(books.map(book => {
        let promise = cache.current.get(book.key);
        if (!promise) {
          promise = fetch(assetUrl(`data/evidence/${book.key}.json`)).then(async response => { if (!response.ok) throw Error("Evidence unavailable"); return response.json() as Promise<EvidencePayload>; });
          cache.current.set(book.key, promise); promise.catch(() => cache.current.delete(book.key));
        }
        return promise;
      }));
      const ids = new Set<string>(), byId = new Map(relationships.map(edge => [edge.id, edge]));
      for (const payload of payloads) for (const [id, sources] of Object.entries(payload.relationshipEvidenceById ?? {})) {
        const hasEvidence = sources.some(source => (source.evidence?.length ? source.evidence : payload.evidenceByTriple[source.tripleId ?? ""] ?? []).some(item => /教材明示|乐谱可见/.test(item.region ?? "") && item.pdfPage != null));
        const edge = byId.get(id);
        if (hasEvidence && edge) { ids.add(edge.subject); if (edge.objectId) ids.add(edge.objectId); }
      }
      if (active) { setEvidenceIds(ids); setEvidenceStatus("ready"); }
    };
    void load().catch(() => active && setEvidenceStatus("error"));
    return () => { active = false; };
  }, [assetUrl, books, evidenceIds, properties.evidence, relationships]);
  const filteredEntityIds = useMemo(() => filterGraphEntities(entities, relationships, books, properties, evidenceIds, focusedEntityIds), [entities, relationships, books, properties, evidenceIds, focusedEntityIds]);
  const relationEndpointIds = useMemo(() => {
    if (!hiddenRelations.length) return null;
    const hidden = new Set(hiddenRelations), ids = new Set<string>();
    for (const edge of relationships) if (!hidden.has(edge.label ?? edge.predicate)) { ids.add(edge.subject); if (edge.objectId) ids.add(edge.objectId); }
    return ids;
  }, [hiddenRelations, relationships]);
  const reset = useCallback(() => { setVisibleSchemaKeys([...ALL_SCHEMA_KEYS]); setHiddenRelations([]); setProperties({ ...DEFAULT_PROPERTIES }); setFocusedEntityIds(null); }, []);
  return { visibleSchemaKeys, setVisibleSchemaKeys, hiddenRelations, setHiddenRelations, properties, setProperties, filteredEntityIds, relationEndpointIds, focusedEntityIds, setFocusedEntityIds, evidenceStatus, reset };
}
export type GraphFilters = ReturnType<typeof useGraphFilters>;
