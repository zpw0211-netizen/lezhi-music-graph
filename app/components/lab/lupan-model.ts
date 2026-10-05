export type LupanPitch = {
  name: string;
  degree: string | number;
  semitone: number;
  altered?: boolean;
  solfege?: string;
};

export type LupanPhraseNote<T extends LupanPitch = LupanPitch> = T & {
  midi: number;
  noteIndex: number;
  octave: boolean;
};

export function normalizePitchClass(value: number) {
  return ((value % 12) + 12) % 12;
}

/** Clockwise drag follows the dial's pitch ring, so the fixed top marker moves down in pitch. */
export function transposeTonicFromDrag(startPitchClass: number, angleDeltaDegrees: number) {
  const steps = Math.round(angleDeltaDegrees / 30);
  return normalizePitchClass(startPitchClass - steps);
}

/** Build the authored score strip: pentatonic returns from 5 to 1; heptatonic returns through all seven notes. */
export function makeLupanPhrase<T extends LupanPitch>(
  notes: readonly T[],
  tonicMidi: number,
  pentatonic: boolean,
): Array<LupanPhraseNote<T>> {
  if (!notes.length) return [];
  const ascending = notes.map((note, noteIndex) => ({
    ...note,
    midi: tonicMidi + note.semitone,
    noteIndex,
    octave: false,
  }));
  const octaveTonic = { ...ascending[0], midi: tonicMidi + 12, noteIndex: 0, octave: true };
  const descending = (pentatonic ? ascending.slice(0, -1) : ascending).slice().reverse()
    .map((note) => ({ ...note, octave: false }));
  return [...ascending, octaveTonic, ...descending];
}
