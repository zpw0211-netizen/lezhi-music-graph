/**
 * Equal-tempered teaching models for three commonly described Chinese heptatonic scales.
 * These are extension knowledge, not claims about a textbook excerpt or every historical tuning.
 */
export const CHROMATIC_PITCH_NAMES = [
  "C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B",
] as const;

export type ScaleNote = {
  name: string;
  solfege: string;
  degree: string;
  semitone: number;
  altered: boolean;
};

export type HeptatonicModeId = "qingyue" | "yayue" | "yanyue";
export type HeptatonicMode = {
  id: HeptatonicModeId;
  name: string;
  alias: string;
  description: string;
  notes: readonly ScaleNote[];
};

export const HEPTATONIC_MODES: Record<HeptatonicModeId, HeptatonicMode> = {
  qingyue: {
    id: "qingyue",
    name: "清乐",
    alias: "下徵调式 · 新音阶",
    description: "在五正声间加入清角、变宫。",
    notes: [
      { name: "宫", solfege: "do", degree: "1", semitone: 0, altered: false },
      { name: "商", solfege: "re", degree: "2", semitone: 2, altered: false },
      { name: "角", solfege: "mi", degree: "3", semitone: 4, altered: false },
      { name: "清角", solfege: "fa", degree: "4", semitone: 5, altered: true },
      { name: "徵", solfege: "sol", degree: "5", semitone: 7, altered: false },
      { name: "羽", solfege: "la", degree: "6", semitone: 9, altered: false },
      { name: "变宫", solfege: "si", degree: "7", semitone: 11, altered: true },
    ],
  },
  yayue: {
    id: "yayue",
    name: "雅乐",
    alias: "正声调式 · 古音阶",
    description: "在五正声间加入变徵、变宫。",
    notes: [
      { name: "宫", solfege: "do", degree: "1", semitone: 0, altered: false },
      { name: "商", solfege: "re", degree: "2", semitone: 2, altered: false },
      { name: "角", solfege: "mi", degree: "3", semitone: 4, altered: false },
      { name: "变徵", solfege: "♯fa", degree: "♯4", semitone: 6, altered: true },
      { name: "徵", solfege: "sol", degree: "5", semitone: 7, altered: false },
      { name: "羽", solfege: "la", degree: "6", semitone: 9, altered: false },
      { name: "变宫", solfege: "si", degree: "7", semitone: 11, altered: true },
    ],
  },
  yanyue: {
    id: "yanyue",
    name: "燕乐",
    alias: "清商调式",
    description: "在五正声间加入清角、闰。",
    notes: [
      { name: "宫", solfege: "do", degree: "1", semitone: 0, altered: false },
      { name: "商", solfege: "re", degree: "2", semitone: 2, altered: false },
      { name: "角", solfege: "mi", degree: "3", semitone: 4, altered: false },
      { name: "清角", solfege: "fa", degree: "4", semitone: 5, altered: true },
      { name: "徵", solfege: "sol", degree: "5", semitone: 7, altered: false },
      { name: "羽", solfege: "la", degree: "6", semitone: 9, altered: false },
      { name: "闰", solfege: "♭si", degree: "♭7", semitone: 10, altered: true },
    ],
  },
};

/** Pitch class on a fixed C-based twelve-semitone ring. */
export function transposePitchClass(tonicPitchClass: number, semitone: number) {
  return ((tonicPitchClass + semitone) % 12 + 12) % 12;
}

/** One octave up and back down, including the octave tonic at the turn. */
export function heptatonicPhrase(modeId: HeptatonicModeId, tonicMidi: number) {
  const notes = HEPTATONIC_MODES[modeId].notes;
  const ascending = notes.map((note) => ({ ...note, midi: tonicMidi + note.semitone }));
  const octaveTonic = { ...notes[0], midi: tonicMidi + 12 };
  return [...ascending, octaveTonic, ...ascending.slice().reverse()];
}
