const PUBLISHERS = {
  人音: "renyin", 人民音乐出版社: "renyin",
  人教: "renjiao", 人民教育出版社: "renjiao",
  湘艺: "xiangyi", 湖南文艺出版社: "xiangyi",
  花城: "huacheng", 花城出版社: "huacheng",
  高中: "gaozhong",
} as const;

const EDITION_LABELS = {
  renyin: "人音版", "renyin-staff": "人音版五线谱",
  renjiao: "人教版", "renjiao-staff": "人教版五线谱", xiangyi: "湘艺版",
  huacheng: "花城版", gaozhong: "高中版",
} as const;
type EditionKey = keyof typeof EDITION_LABELS;
const HAS_STAFF = (key: string): key is "renyin" | "renjiao" => key === "renyin" || key === "renjiao";
const SIMPLE_ONLY = new Set<string>(["xiangyi", "huacheng"]);
type EditionScope =
  | { kind: "current"; explicit: boolean }
  | { kind: "switch"; key: EditionKey; label: string; path: string }
  | { kind: "clarify"; message: string };

/** Resolve a named textbook edition without treating a generic mention of 五线谱 as a switch. */
export function questionEdition(question: string, currentEdition: string): EditionScope {
  const text = question.normalize("NFKC");
  const mentions = text.matchAll(/(人民音乐出版社|人民教育出版社|湖南文艺出版社|花城出版社|高中版|(?:人音|人教|湘艺|花城)(?:版|(?=\s*(?:[一二三四五六七八九1-9](?:年级|[上下])|教材|简谱|五线谱))))(?:\s*(?:[·・(-]|的)?\s*(简谱|五线谱))?/g);
  const keys = new Set<EditionKey>();
  for (const [, name, notation] of mentions) {
    const publisher = PUBLISHERS[name.replace(/版$/, "") as keyof typeof PUBLISHERS];
    // 高中版是人音版普通高中教材：在高中版里说“人音版”仍指高中版。
    let key: EditionKey = publisher === "renyin" && currentEdition === "gaozhong" && notation !== "五线谱" ? "gaozhong" : publisher;
    if (notation === "五线谱") {
      if (SIMPLE_ONLY.has(publisher)) return { kind: "clarify", message: `${EDITION_LABELS[publisher]}目前提供简谱教材，请改用${EDITION_LABELS[publisher]}简谱提问。` };
      if (HAS_STAFF(publisher)) key = `${publisher}-staff`;
    } else if (!notation && HAS_STAFF(publisher) && currentEdition === `${publisher}-staff`) {
      key = `${publisher}-staff`;
    }
    keys.add(key);
  }
  if (keys.size > 1) return { kind: "clarify", message: "这条问题提到了多个教材版本，请选一个版本后再提问。" };
  const [key] = keys;
  return !key || key === currentEdition
    ? { kind: "current", explicit: Boolean(key) }
    : { kind: "switch", key, label: EDITION_LABELS[key], path: `/${key}/` };
}

const handoffKey = (edition: string) => `yapu:assistant-question:${edition}`;

export function saveEditionQuestion(edition: EditionKey, question: string) {
  window.sessionStorage.setItem(handoffKey(edition), JSON.stringify({ question, expires: Date.now() + 5 * 60_000 }));
}

export function takeEditionQuestion(edition: string): string {
  try {
    const key = handoffKey(edition);
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return "";
    window.sessionStorage.removeItem(key);
    const pending = JSON.parse(raw) as { question?: unknown; expires?: number };
    return (pending.expires ?? 0) > Date.now() && typeof pending.question === "string" ? pending.question : "";
  } catch {
    return "";
  }
}
