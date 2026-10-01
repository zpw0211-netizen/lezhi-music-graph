import { isWorkType, type CanonicalGraph, type Entity, type Triple } from "../../lib/app/types";

export const PENTATONIC = [
  { name: "宫", solfege: "do", degree: 1, semitone: 0 },
  { name: "商", solfege: "re", degree: 2, semitone: 2 },
  { name: "角", solfege: "mi", degree: 3, semitone: 4 },
  { name: "徵", solfege: "sol", degree: 5, semitone: 7 },
  { name: "羽", solfege: "la", degree: 6, semitone: 9 },
] as const;
export const LAB_KEYS = { C: 60, D: 62, F: 65, G: 67 } as const;
export type LabKey = keyof typeof LAB_KEYS;

/** One octave from the selected tonic, then return to it. */
export function modePhrase(mode: number, tonic: number) {
  const ascending = Array.from({ length: 6 }, (_, step) => {
    const index = mode + step;
    return { index: index % 5, midi: tonic + PENTATONIC[index % 5].semitone + 12 * Math.floor(index / 5) };
  });
  return [...ascending, ...ascending.slice(0, -1).reverse()];
}

export type PentatonicWork = { work: Entity; evidence: Array<{ triple: Triple; value: string }> };
/** Only textbook assertions about mode/scale qualify; extension facts stay out. */
export function findPentatonicWorks(graph: CanonicalGraph): PentatonicWork[] {
  const entities = new Map(graph.entities.map((entity) => [entity.id, entity]));
  const result = new Map<string, PentatonicWork>();
  for (const triple of graph.relationships) {
    if (triple.extended || !/调式|音阶|调性|TONALITY/.test(triple.predicate)) continue;
    const value = (triple.objectId ? entities.get(triple.objectId)?.name : undefined) ?? triple.literal ?? "";
    if (!/五声|宫调式|商调式|角调式|徵调式|羽调式/.test(value)) continue;
    const work = entities.get(triple.subject);
    if (!work || !isWorkType(work.type)) continue;
    const entry = result.get(work.id) ?? { work, evidence: [] };
    entry.evidence.push({ triple, value });
    result.set(work.id, entry);
  }
  return [...result.values()];
}

export function keyIndicesFor(notes: number[], tonic: number) {
  return [...new Set(notes.flatMap((midi) => {
    const pitch = ((midi - tonic) % 12 + 12) % 12;
    const index = PENTATONIC.findIndex((note) => note.semitone === pitch);
    return index < 0 ? [] : [index];
  }))];
}
