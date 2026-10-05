import { publicAssetUrl } from "../app/assets";

export type PeopleLifetimeStatus =
  | "found"
  | "partial"
  | "not_person"
  | "not_found";

export type PeopleLifetimeSource = {
  title: string;
  url: string;
  publisher: string | null;
};

export type PeopleLifetimeSupplement = {
  id: string;
  name: string;
  status: PeopleLifetimeStatus;
  born: number | null;
  died: number | null;
  lifetimeText: string | null;
  subject: string | null;
  sources: PeopleLifetimeSource[];
  confidence: string | number;
  note: string | null;
  kind: "supplement";
  label: "补充资料（非教材）";
};

const PEOPLE_LIFETIME_URL = "data/supplement/people-lifetime.json";

const PUBLIC_STATUSES: readonly PeopleLifetimeStatus[] = ["found", "partial"];
const PUBLIC_CONFIDENCES: readonly string[] = ["high", "medium"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isYearOrNull(value: unknown): value is number | null {
  return value === null || (Number.isInteger(value) && (value as number) >= 0);
}

function isPeopleLifetimeSupplement(
  value: unknown,
): value is PeopleLifetimeSupplement {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !["found", "partial", "not_person", "not_found"].includes(
      String(value.status),
    ) ||
    !isYearOrNull(value.born) ||
    !isYearOrNull(value.died) ||
    !(value.lifetimeText === null || typeof value.lifetimeText === "string") ||
    !(value.subject === null || typeof value.subject === "string") ||
    !(value.note === null || typeof value.note === "string") ||
    !(
      (typeof value.confidence === "string" && value.confidence.length > 0) ||
      (typeof value.confidence === "number" && Number.isFinite(value.confidence))
    ) ||
    value.kind !== "supplement" ||
    value.label !== "补充资料（非教材）" ||
    !Array.isArray(value.sources)
  )
    return false;
  return value.sources.every(
    (source) =>
      isRecord(source) &&
      typeof source.title === "string" &&
      typeof source.url === "string" &&
      (source.publisher === null || typeof source.publisher === "string"),
  );
}

function parsePeopleLifetime(value: unknown): PeopleLifetimeSupplement[] {
  if (!Array.isArray(value) || !value.every(isPeopleLifetimeSupplement))
    throw new Error("人物生卒年补充资料格式无效");
  return value;
}

/** 是否对外展示：仅 found/partial 且 confidence 为 high/medium。 */
export function isPublicPeopleLifetime(
  record: PeopleLifetimeSupplement,
): boolean {
  return (
    PUBLIC_STATUSES.includes(record.status) &&
    PUBLIC_CONFIDENCES.includes(String(record.confidence))
  );
}

/** Load and filter supplementary people lifetimes only when a caller needs them. */
export async function loadPeopleSupplement(
  fetcher: typeof fetch = fetch,
): Promise<PeopleLifetimeSupplement[]> {
  const response = await fetcher(publicAssetUrl(PEOPLE_LIFETIME_URL));
  if (!response.ok)
    throw new Error(`加载人物生卒年补充资料失败：HTTP ${response.status}`);
  return parsePeopleLifetime(await response.json()).filter(
    isPublicPeopleLifetime,
  );
}
