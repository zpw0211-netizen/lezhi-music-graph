"use client";
import { useCallback, useEffect, useState } from "react";
import { publicAssetUrl } from "../lib/app/assets";
import type { Book, BookDataPayload, BookDirectory, CanonicalGraph, Dataset, GraphIndexPayload } from "../lib/app/types";

const bookPayloadCache = new Map<string, BookDataPayload>();
const bookRequestCache = new Map<string, Promise<BookDataPayload>>();

function requestBookData(bookKey: string) {
  const cached = bookPayloadCache.get(bookKey);
  if (cached) return Promise.resolve(cached);
  const pending = bookRequestCache.get(bookKey);
  if (pending) return pending;

  const request = fetch(publicAssetUrl(`data/books/${bookKey}.json`))
    .then(async (response) => {
      if (!response.ok) throw new Error(`Book data unavailable: ${bookKey}`);
      const payload = (await response.json()) as BookDataPayload;
      if (
        payload.bookKey !== bookKey ||
        !Array.isArray(payload.entities) ||
        !Array.isArray(payload.triples) ||
        !payload.evidenceByTriple ||
        !payload.relations
      )
        throw new Error(`Book data is invalid: ${bookKey}`);
      bookPayloadCache.set(bookKey, payload);
      return payload;
    })
    .catch((error: unknown) => {
      if (bookRequestCache.get(bookKey) === request) bookRequestCache.delete(bookKey);
      throw error;
    });
  bookRequestCache.set(bookKey, request);
  return request;
}

export type BookDataStatus = "idle" | "loading" | "ready" | "error";

/** Fetches one textbook graph on demand and keeps successful requests in memory. */
export function useBookData(bookKey: string | null, books: BookDirectory[], enabled = true) {
  const [snapshot, setSnapshot] = useState<{
    bookKey: string;
    status: BookDataStatus;
    payload: BookDataPayload | null;
    retryToken: number;
  }>({ bookKey: "", status: "idle", payload: null, retryToken: -1 });
  const [retryToken, setRetryToken] = useState(0);
  const directory = enabled && bookKey ? books.find((book) => book.key === bookKey) : undefined;

  useEffect(() => {
    if (!enabled || !bookKey) return;
    if (!books.length) return;
    if (!directory) return;
    const cached = bookPayloadCache.get(bookKey);
    if (cached) return;
    let active = true;
    requestBookData(bookKey).then(
      (payload) => {
        if (active) setSnapshot({ bookKey, status: "ready", payload, retryToken });
      },
      () => {
        if (active) setSnapshot({ bookKey, status: "error", payload: null, retryToken });
      },
    );
    return () => {
      active = false;
    };
  }, [bookKey, books, directory, enabled, retryToken]);

  const retry = useCallback(() => setRetryToken((value) => value + 1), []);
  const payload = bookKey
    ? (snapshot.bookKey === bookKey ? snapshot.payload : undefined) ?? bookPayloadCache.get(bookKey) ?? null
    : null;
  const status: BookDataStatus = !enabled || !bookKey
    ? "idle"
    : books.length > 0 && !directory
      ? "error"
      : payload
        ? "ready"
        : snapshot.bookKey === bookKey && snapshot.retryToken === retryToken
          ? snapshot.status
          : "loading";
  const book: Book | null = directory && payload
    ? { ...directory, entities: payload.entities, triples: payload.triples, evidenceByTriple: payload.evidenceByTriple, relations: payload.relations }
    : null;

  return { status, book, retry };
}

export type GraphIndexState = {
  status: "loading" | "ready" | "error";
  dataset: Dataset | null;
  canonicalGraph: CanonicalGraph | null;
  generatedAt?: string;
};

/** Loads the six-textbook graph index once. */
export function useGraphIndex() {
  const [state, setState] = useState<GraphIndexState>({ status: "loading", dataset: null, canonicalGraph: null });
  useEffect(() => {
    let active = true;
    const load = async () => {
      const response = await fetch(publicAssetUrl("data/graph-index.json"));
      if (!response.ok) throw new Error("graph-index unavailable");
      const index = (await response.json()) as GraphIndexPayload;
      if (!Array.isArray(index.dataset.books) || !index.dataset.books.length) throw new Error("graph-index is empty");
      if (active)
        setState({ status: "ready", dataset: index.dataset, canonicalGraph: index.canonicalGraph, generatedAt: index.generatedAt });
    };
    load().catch(() => {
      if (active) setState((previous) => ({ ...previous, status: "error" }));
    });
    return () => {
      active = false;
    };
  }, []);
  return state;
}
