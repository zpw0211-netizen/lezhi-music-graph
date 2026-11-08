import { normalize, type AnswerResult, type Citation, type RagGraph } from "./graph-rag";
import { matchesVolume, requestedVolumes } from "./book-volume";

/** The fields needed from the same units.json used by the course directory. */
export type UnitCatalog = {
  bookKey: string;
  id: string;
  name: string;
  title: string;
  works: { id: string; name: string; page?: number | null; pdfPage?: number | null; summary?: string | null }[];
};

const UNIT_NUMBER = /^第[一二三四五六七八九十\d]+(?:单元|课)/;
const unitKey = (value: string) => normalize(value.normalize("NFKC")).replace(/[「」『』,.!?;:]/g, "");

export const isUnitWorksQuestion = (question: string) =>
  /单元|第[一二三四五六七八九十\d]+课/.test(question.normalize("NFKC")) && /作品|曲目|歌曲/.test(question);

function answerFromDirectory(answer: string, evidence: Citation[] = [], suggestedQuestions: string[] = []): AnswerResult {
  return {
    answer, shortAnswer: answer, evidence, suggestedQuestions,
    relatedEntities: [], relatedRelationships: [], graphFocus: { nodeIds: [], relationshipIds: [] },
    missingKnowledge: [], candidateKnowledge: [], confidence: evidence.length ? "supported" : "insufficient",
    poweredBy: "graph", intent: "fact", auxiliaryExplanation: "",
  };
}

/** Lists only the requested unit's works and evidence, or asks which volume the reader means. */
export function unitWorksAnswer(question: string, units: UnitCatalog[], books: RagGraph["books"]): AnswerResult | null {
  if (!isUnitWorksQuestion(question)) return null;
  const term = unitKey(question);
  const volumes = requestedVolumes(question);
  const scopedUnits = units.filter((unit) => matchesVolume(unit.bookKey, volumes));
  const matched = scopedUnits.map((unit) => {
    const names = [unit.title, unit.name].map(unitKey);
    const score = Math.max(0, ...names.filter((name) => name && term.includes(name)).map((name) => name.length));
    return { unit, score };
  });
  const best = Math.max(0, ...matched.map(({ score }) => score));
  const candidates = best
    ? matched.filter(({ score }) => score === best).map(({ unit }) => unit)
    : scopedUnits.filter((unit) => {
        const ordinal = unitKey(unit.name).match(UNIT_NUMBER)?.[0];
        return ordinal && term.includes(ordinal);
      });
  if (!candidates.length) return volumes.length
    ? answerFromDirectory("当前教材目录里找不到你指定的单元。请核对年级、上下册和单元名。")
    : null;

  const bookTitleOf = (key: string) => books.find((book) => book.key === key)?.title ?? key;
  if (candidates.length > 1) {
    const choices = candidates.map((unit) => `${bookTitleOf(unit.bookKey)}的「${unit.name}」`);
    return answerFromDirectory(`找到多个符合条件的单元。你想看哪一个？${choices.join("、")}。`, [],
      choices.map((choice) => `${choice}单元有哪些作品？`));
  }

  const [unit] = candidates;
  const { works } = unit;
  const bookTitle = bookTitleOf(unit.bookKey);
  if (!works.length) return answerFromDirectory(`${unit.name}（${bookTitle}）的单元目录暂无收录作品。`);
  const listed = works.map((work, index) => `${index + 1}.${work.name}`).join("；");
  const evidence: Citation[] = works.map((work) => ({
    id: `unit:${unit.id}:${work.id}`,
    bookKey: unit.bookKey, bookTitle, pdfPage: work.pdfPage ?? null,
    textbookPage: work.page == null ? "" : String(work.page),
    summary: work.summary ?? "", sourceType: "textbook_explicit",
  }));
  return answerFromDirectory(`${unit.name}（${bookTitle}）按教材单元目录共收录 ${works.length} 首作品：${listed}。`, evidence);
}
