// Hand-transcribed main melodies for lesson playback, read from the textbook
// score. Degrees are jianpu digits (0 = rest, 9 = unpitched rhythm X); octave -1 is a dot below, +1 a
// dot above; beats count quarter notes. `tie` continues the previous note;
// `a` is an accidental (1 = ♯, -1 = ♭).
export type MelodyNote = { d: number; /** octave dots: +1/+2 above, -1/-2 below */ o?: number; b: number; lyric?: string; tie?: boolean; a?: -1 | 1; tri?: boolean };
export type Melody = {
  /** Heading when a work has several excerpts (主题一, 引子…). */
  title?: string;
  key: string;
  tonic: string;
  tonicMidi: number;
  meter: string;
  bpm: number;
  source: string;
  /** Machine-read score excerpt awaiting a human comparison with the linked image. */
  quality?: "draft";
  bars: MelodyNote[][];
  /** Label of the main line when further voices exist, e.g. "高声部". */
  label?: string;
  /** Further simultaneous voices printed in the textbook (choral parts). */
  voices?: Array<{ label: string; bars: MelodyNote[][] }>;
};


/**
 * Compact jianpu text → bars. Bars split on "|", notes on spaces.
 *   5  quarter · 5/ eighth · 5// sixteenth · 5/// thirty-second · 5//// sixty-fourth · 5. / 5/. dotted · "-" adds a beat to the previous note
 *   5' dot above · 5, dot below · #4 sharp · b7 flat · 0 rest · ~5 tied continuation · 5//t triplet
 * Lyrics: one item per sung note (not rests or ties); "~" = melisma (no syllable).
 */
export function jianpu(text: string, lyrics = ""): MelodyNote[][] {
  const words = lyrics.split(/\s+/).filter(Boolean);
  let w = 0;
  return text.split("|").map((bar) => bar.trim()).filter(Boolean).map((bar) => {
    const notes: MelodyNote[] = [];
    for (const token of bar.split(/\s+/)) {
      if (token === "-") { notes[notes.length - 1].b += 1; continue; }
      // Dot and slashes may come in either order ("5./" or "5/.").
      const m = token.match(/^(~?)([#b]?)([0-79])('{0,2}|,{0,2})(\.?)(\/{0,4})(\.?)(t?)$/);
      if (!m) throw new Error(`jianpu: cannot read "${token}"`);
      const [, tie, acc, digit, octave, dotBefore, slashes, dotAfter, triplet] = m;
      const dot = dotBefore || dotAfter;
      const b = 2 ** -slashes.length * (dot ? 1.5 : 1) * (triplet ? 2 / 3 : 1);
      const note: MelodyNote = { d: Number(digit), b, o: octave.startsWith("'") ? octave.length : -octave.length };
      if (acc) note.a = acc === "#" ? 1 : -1;
      if (triplet) note.tri = true;
      if (tie) note.tie = true;
      else if (note.d) { const word = words[w++]; if (word && word !== "~") note.lyric = word; }
      notes.push(note);
    }
    return notes;
  });
}

/** Bars whose length differs from the meter (pickup and final bars excepted), in any voice. */
export function checkMelody(melody: Melody) {
  const problems = checkBars(melody, melody.bars).map((item) => ({ ...item, voice: melody.label ?? "旋律" }));
  for (const voice of melody.voices ?? []) {
    if (voice.bars.length !== melody.bars.length) problems.push({ index: -1, total: voice.bars.length, voice: `${voice.label}（小节数 ${voice.bars.length}≠${melody.bars.length}）` });
    problems.push(...checkBars(melody, voice.bars).map((item) => ({ ...item, voice: voice.label })));
    // Parallel bars must last equally long, pickup and final bars included.
    voice.bars.forEach((bar, index) => {
      const main = melody.bars[index]?.reduce((sum, note) => sum + note.b, 0) ?? 0;
      const other = bar.reduce((sum, note) => sum + note.b, 0);
      if (Math.abs(main - other) > 1e-6) problems.push({ index, total: other, voice: `${voice.label}≠主旋律` });
    });
  }
  return problems;
}

function checkBars(melody: Melody, bars: MelodyNote[][]) {
  // Free-rhythm passages (散板) are written phrase by phrase; nothing to measure.
  if (melody.meter.includes("散")) return [];
  // Mixed meters are written "2/4、4/4"; a bar may match any of them.
  const allowed = melody.meter.split("、").map((meter) => { const [top, bottom] = meter.split("/").map(Number); return top * (4 / bottom); });
  return bars
    .map((bar, index) => ({ index, total: bar.reduce((sum, note) => sum + note.b, 0) }))
    .filter(({ index, total }) => index > 0 && index < bars.length - 1 && !allowed.some((beats) => Math.abs(total - beats) < 1e-6));
}

/** How a note is drawn in jianpu: underline count, augmentation dot, extension dashes. */
export function notation(note: MelodyNote) {
  const base = note.tri ? note.b * 1.5 : note.b;
  const dotted = [0.375, 0.75, 1.5, 3].some((value) => Math.abs(base - value) < 1e-6);
  const plain = dotted ? base / 1.5 : base;
  return {
    lines: plain < 1 ? Math.round(Math.log2(1 / plain)) : 0,
    dotted: dotted && plain < 2,
    dashes: plain >= 2 ? Math.round(base) - 1 : dotted && base >= 3 ? 2 : 0,
  };
}

const SEMITONES = [0, 0, 2, 4, 5, 7, 9, 11];
export const midiOf = (melody: Melody, note: MelodyNote) =>
  note.d === 9 ? 48 : melody.tonicMidi + SEMITONES[note.d] + 12 * (note.o ?? 0) + (note.a ?? 0);

const TONIC_MIDI: Record<string, number> = { C: 60, D: 62, E: 64, F: 65, G: 67, A: 57, B: 59 };
/** Key signature text ("1=♭E") → MIDI note of the tonic, kept around the middle of the range. */
export function tonicMidiOf(key: string) {
  const m = key.replace(/\s/g, "").match(/^1=([♭♯#b]?)([A-G])/);
  if (!m) throw new Error(`unknown key ${key}`);
  return TONIC_MIDI[m[2]] + (m[1] === "♭" || m[1] === "b" ? -1 : m[1] ? 1 : 0);
}

type SegmentOptions = { title?: string; label?: string; voices?: Array<{ label: string; notes: string; lyrics?: string }>; note?: string; octave?: number; quality?: "draft" };
/**
 * One excerpt of a work: key text, meter, tempo, textbook source, jianpu notes and lyrics.
 * `octave` shifts playback (e.g. -1 for scores written an octave high).
 */
export function segment(book: string, page: number | string, key: string, meter: string, bpm: number, notes: string, lyrics = "", options: SegmentOptions = {}): Melody {
  return {
    title: options.title,
    key,
    tonic: key.replace(/^1=/, ""),
    tonicMidi: (key === "节奏" ? 60 : tonicMidiOf(key)) + 12 * (options.octave ?? 0),
    meter,
    bpm,
    source: options.quality === "draft"
      ? `人音版${book}第 ${page} 页谱例自动识别草稿${options.note ? `（${options.note}）` : ""}`
      : `据人音版${book}第 ${page} 页谱例转写${options.note ? `（${options.note}）` : ""}`,
    quality: options.quality,
    bars: jianpu(notes, lyrics),
    label: options.label ?? (options.voices?.length ? "第一声部" : undefined),
    voices: options.voices?.map((voice) => ({ label: voice.label, bars: jianpu(voice.notes, voice.lyrics ?? "") })),
  };
}
