export type PendingCandidate = { subject: string; predicate: string; object: string; source: string; evidence: string; page: number | null; confidence: number; reason: string; status: "pending" };
// Display-only contract: no generation, acceptance, or canonical graph writes.
export function pendingCandidates(input: unknown): PendingCandidate[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 20).filter((item): item is PendingCandidate => !!item && typeof item === "object" && item.status === "pending" && ["subject", "predicate", "object", "source", "evidence", "reason"].every(key => typeof item[key] === "string" && item[key].trim().length > 0) && typeof item.confidence === "number" && Number.isFinite(item.confidence) && item.confidence >= 0 && item.confidence <= 1 && (item.page === null || (Number.isInteger(item.page) && item.page > 0)));
}
