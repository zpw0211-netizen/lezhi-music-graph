import { publicAssetUrl } from "../app/assets";

export type WorkYearStatus = "found" | "traditional" | "not_found";

export type WorkYearSource = {
  title: string;
  url: string;
  publisher: string | null;
};

export type WorkYearSupplement = {
  id: string;
  name: string;
  status: WorkYearStatus;
  event: string | null;
  yearText: string | null;
  yearRange: [number, number] | null;
  subject: string | null;
  sources: WorkYearSource[];
  confidence: string | number;
  note: string | null;
  kind: "supplement";
  label: "补充资料（非教材）";
};

const YEAR_SUPPLEMENT_URL = "data/supplement/work-years.json";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isYearRange(value: unknown): value is [number, number] | null {
  return (
    value === null ||
    (Array.isArray(value) &&
      value.length === 2 &&
      value.every((year) => Number.isInteger(year)) &&
      value[0] <= value[1])
  );
}

function isWorkYearSupplement(value: unknown): value is WorkYearSupplement {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !["found", "traditional", "not_found"].includes(String(value.status)) ||
    !isYearRange(value.yearRange) ||
    !(value.yearText === null || typeof value.yearText === "string") ||
    !(value.event === null || typeof value.event === "string") ||
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

function parseSupplement(value: unknown): WorkYearSupplement[] {
  if (!Array.isArray(value) || !value.every(isWorkYearSupplement))
    throw new Error("年代补充资料格式无效");
  return value;
}

/** Load supplementary dates only when a caller needs them. */
export async function loadYearSupplement(
  fetcher: typeof fetch = fetch,
): Promise<WorkYearSupplement[]> {
  const response = await fetcher(publicAssetUrl(YEAR_SUPPLEMENT_URL));
  if (!response.ok)
    throw new Error(`加载年代补充资料失败：HTTP ${response.status}`);
  return parseSupplement(await response.json());
}
