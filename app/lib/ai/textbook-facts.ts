import { matchesVolume, requestedVolumes } from "./book-volume";
import type { Citation, RagGraph, Retrieval, RetrievedFact } from "./graph-rag";
import type { UnitCatalog } from "./unit-works";
import type { Melody } from "../lesson/jianpu";

const METER_NAMES: Record<string, string> = {
  "2/2": "二二拍", "2/4": "四二拍", "3/4": "四三拍", "4/4": "四四拍",
  "3/8": "八三拍", "6/8": "八六拍", "9/8": "八九拍", "12/8": "八十二拍",
};

export function meterOf(text: string): string | undefined {
  const normalized = text.normalize("NFKC");
  const fraction = normalized.match(/(?:^|[^\d])(\d{1,2})\s*\/\s*(\d{1,2})(?!\d)/);
  if (fraction) return `${fraction[1]}/${fraction[2]}`;
  return Object.keys(METER_NAMES).find((meter) => normalized.includes(METER_NAMES[meter]));
}

export const meterName = (meter: string) => METER_NAMES[meter] ?? "";
export const matchesMeter = (text: string, meter: string) => {
  const value = text.normalize("NFKC").replace(/\s+/g, "");
  return value === meter || value === `${meter}拍` || value === meterName(meter);
};

type TextbookQuestion = "meter-works" | "work-meter" | "definition" | "instrument" | "lyricist" | "composer" | "author";

export function textbookQuestion(question: string): TextbookQuestion | undefined {
  const listsWorks = /哪些|哪几|列出|举例|推荐/.test(question) && /作品|曲目|歌曲|乐曲/.test(question);
  if (listsWorks && /拍/.test(question) && meterOf(question)) return "meter-works";
  if (!listsWorks && /什么拍号|拍号(?:是|为|多少)|几拍子|是什么拍/.test(question)) return "work-meter";
  if (/什么是|的定义是什么|的含义是什么/.test(question)) return "definition";
  if (/(?:属于|是)(?:哪(?:一)?类|哪种|什么(?:类型|类别)?)乐器|乐器类别是/.test(question)) return "instrument";
  if (!listsWorks && /谁|哪位/.test(question)) {
    const lyrics = /作词|词作者/.test(question);
    const music = /作曲|曲作者/.test(question);
    if (/词曲作者|词曲是谁/.test(question) || (lyrics && music)) return "author";
    if (lyrics) return "lyricist";
    if (music) return "composer";
    if (/谁写|谁创作|谁的作品|作者.*谁/.test(question)) return "author";
  }
}

type FocusedAnswer = { text: string; evidence: Citation[] };
const creatorRoles = /^(作词|作曲|词曲作者)$/;
const isDefinition = /^(是|指|定义为|含义)$/;

/** Use only same-volume score transcriptions that carry a printed textbook page. */
export function meterAnswerFromScores(
  question: string, units: UnitCatalog[], books: RagGraph["books"],
  scoresOf: (bookKey: string, work: string) => readonly Pick<Melody, "source" | "meter" | "quality">[],
): FocusedAnswer | null {
  const meter = meterOf(question);
  if (!meter) return null;
  const volumes = requestedVolumes(question);
  const bookTitles = new Map(books.map((book) => [book.key, book.title]));
  const works = new Set<string>();
  const evidence: Citation[] = [];
  for (const unit of units) {
    const bookTitle = bookTitles.get(unit.bookKey);
    if (!bookTitle || !matchesVolume(unit.bookKey, volumes)) continue;
    const sourcePrefix = `据${bookTitle.replace(/[（(](?:简谱|五线谱)[）)]$/, "")}第`;
    for (const work of unit.works) {
      if (works.has(work.name) || works.size >= 12) continue;
      const pages = scoresOf(unit.bookKey, work.name)
        .filter((score) => score.quality !== "draft" && matchesMeter(score.meter, meter) && score.source.startsWith(sourcePrefix))
        .map((score) => score.source.slice(sourcePrefix.length).match(/^\s*(\d+(?:\s*[-–—]\s*\d+)?)\s*页谱例转写/)?.[1]);
      const page = pages.find(Boolean);
      if (!page) continue;
      works.add(work.name);
      evidence.push({
        id: `score-meter:${unit.bookKey}:${work.id}:${page}`,
        bookKey: unit.bookKey, bookTitle, textbookPage: page, pdfPage: null,
        summary: `${work.name}的谱例片段标有 ${meter} 拍。`, sourceType: "textbook_explicit",
      });
    }
  }
  return works.size
    ? { text: `已核对的教材谱例中，${[...works].join("、")}的片段标有 ${meter} 拍。`, evidence }
    : null;
}

/** Answer common factual prompts with the cited relationships used in the displayed answer. */
export function answerTextbookFacts(retrieval: Retrieval, question: string, kind: TextbookQuestion): FocusedAnswer {
  const { centers, facts, evidence, relatedEntities } = retrieval;
  const volumes = requestedVolumes(question);
  const citations = new Map(evidence.filter((item) => item.sourceType === "textbook_explicit" && matchesVolume(item.bookKey, volumes))
    .map((item) => [item.id, item]));
  const cite = (fact: RetrievedFact) => fact.evidenceIds.map((id) => citations.get(id)).find((item) => item !== undefined);
  const supported = facts.filter((fact) => cite(fact));
  const primary = centers[0]?.name;
  const direct = supported.filter((fact) => fact.subject === primary);
  const answer = (text: string, used: RetrievedFact[]): FocusedAnswer => ({
    text, evidence: [...new Set(used.map(cite).filter((item): item is Citation => item !== undefined))],
  });

  if (kind === "meter-works") {
    const meter = meterOf(question) ?? "";
    const works = new Set(relatedEntities.filter((entity) => entity.category === "work").map((entity) => entity.name));
    const examples = [...new Map(supported
      .filter((fact) => fact.predicate === "拍号" && matchesMeter(fact.object, meter) && works.has(fact.subject))
      .map((fact) => [fact.subject, fact])).values()].slice(0, 12);
    if (examples.length) return answer(`教材中标有 ${meter} 拍的作品包括${examples.map((fact) => fact.subject).join("、")}等。`, examples);
  } else if (kind === "work-meter") {
    const meters = [...new Map(direct.filter((fact) => fact.predicate === "拍号").map((fact) => [fact.object, fact])).values()];
    if (meters.length === 1) return answer(`${primary}的拍号标为 ${meters[0].object}。`, meters);
    if (meters.length > 1) return answer(`${primary}在教材中有不同的拍号标注（${meters.map((fact) => fact.object).join("、")}），可对照各册谱例。`, meters);
  } else if (kind === "definition") {
    const meter = meterOf(question);
    const definition = direct.find((fact) => isDefinition.test(fact.predicate)) ?? (meter
      ? supported.find((fact) => meterOf(fact.subject) === meter && isDefinition.test(fact.predicate))
      : undefined);
    if (definition) return answer(`${definition.subject}是指${definition.object.replace(/[。.]$/, "")}。`, [definition]);
    if (primary?.includes("五声调式")) {
      const notes = direct.find((fact) => /^(构成|音级名称|音名)$/.test(fact.predicate));
      const rule = direct.find((fact) => fact.predicate === "规则");
      if (notes) return answer(`${primary}由${notes.object}组成。${rule ? `${rule.object.replace(/[。.]$/, "")}。` : ""}`, rule ? [notes, rule] : [notes]);
    }
  } else if (kind === "instrument") {
    const classification = direct.find((fact) => fact.predicate === "乐器类别");
    if (classification) return answer(`${primary}属于${classification.object}。`, [classification]);
  } else {
    const credits = direct.filter((fact) => creatorRoles.test(fact.predicate)
      && (kind === "author" || fact.predicate === "词曲作者" || fact.predicate === (kind === "lyricist" ? "作词" : "作曲")));
    const people = new Map<string, RetrievedFact[]>();
    for (const fact of credits) {
      const roles = people.get(fact.object) ?? [];
      roles.push(fact);
      people.set(fact.object, roles);
    }
    if (people.size) return answer([...people].map(([person, roles]) => {
      const lyrics = roles.some((fact) => fact.predicate !== "作曲");
      const music = roles.some((fact) => fact.predicate !== "作词");
      const role = kind === "lyricist" ? "词作者" : kind === "composer" ? "曲作者" : lyrics && music ? "词曲作者" : lyrics ? "词作者" : "曲作者";
      return `${primary}的${role}是${person}。`;
    }).join(""), credits);
  }
  return answer("当前可查的教材资料里，暂时没有找到足够的依据回答这个问题。", []);
}
