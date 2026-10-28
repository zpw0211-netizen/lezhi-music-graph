// Hand-transcribed main melodies for lesson playback, read from the textbook
// score. Degrees are jianpu digits (0 = rest, 9 = unpitched rhythm X); octave -1 is a dot below, +1 a
// dot above; beats count quarter notes. `tie` holds the previous note (same pitch);
// `slur` is a new pitch sung on the previous syllable (a melisma), so it sounds but takes no lyric;
// `a` is an accidental (1 = ♯, -1 = ♭, 0 = explicit ♮).
export type MelodyNote = { d: number; /** octave dots above/below; supports three-dot textbook bass notes */ o?: number; b: number; lyric?: string; tie?: boolean; slur?: boolean; a?: -1 | 0 | 1; tri?: boolean; tuplet?: number; dots?: 1 | 2; /** bracketed instrumental interlude inside a song: the singer rests */ inst?: boolean };
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
  voices?: Array<{ label: string; bars: MelodyNote[][]; lyricWords?: number }>;
  /** Syllables given for the main line, so a check can catch lyrics that drift off their notes. */
  lyricWords?: number;
  /** Last bar that carries lyrics when the rest is an interlude or coda; the check counts syllables only up to it. */
  lyricsEnd?: number;
  /** Staff editions: clef and octave shift per voice (main line first) when the textbook staff differs from the default. */
  staff?: Array<{ clef?: "treble" | "bass"; octave?: number } | undefined>;
  /** Staff editions: key whose signature the textbook prints when it spells the same pitches differently (1=♭G drawn with five flats). */
  staffSignature?: string;
};


/**
 * Compact jianpu text → bars. Bars split on "|", notes on spaces.
 *   5  quarter · 5/ eighth · 5// sixteenth · 5/// thirty-second · 5//// sixty-fourth · 5. / 5/. dotted · "-" adds a beat to the previous note
 *   5' dot above · 5, dot below · #4 sharp · b7 flat · ♮4 natural · 0 rest · ~5 tie (same pitch) or slur (new pitch, no syllable) · 5//t triplet, 5//t5 quintuplet, 5//t4 quadruplet
 * Lyrics: one item per sung note (not rests or ties); "~" = melisma (no syllable); "_" = instrumental interlude note (the singer rests).
 */
export function jianpu(text: string, lyrics = ""): MelodyNote[][] {
  const words = lyrics.split(/\s+/).filter(Boolean);
  let w = 0;
  let previous: MelodyNote | undefined;
  return text.split("|").map((bar) => bar.trim()).filter(Boolean).map((bar) => {
    const notes: MelodyNote[] = [];
    for (const token of bar.split(/\s+/)) {
      if (token === "-") { notes[notes.length - 1].b += 1; continue; }
      // Dot and slashes may come in either order ("5./" or "5/.").
      const m = token.match(/^(~?)([#b♯♭♮]?)([0-79])('{0,3}|,{0,3})(\.{0,2})(\/{0,4})(\.{0,2})(t(?:[3-9])?)?$/);
      if (!m) throw new Error(`jianpu: cannot read "${token}"`);
      const [, tie, acc, digit, octave, dotBefore, slashes, dotAfter, tupletMark] = m;
      const dots = Math.min(2, dotBefore.length + dotAfter.length);
      const tuplet = tupletMark ? Number(tupletMark.slice(1)) || 3 : undefined;
      const b = 2 ** -slashes.length * (dots === 2 ? 1.75 : dots === 1 ? 1.5 : 1) * (tuplet ? (tuplet - 1) / tuplet : 1);
      const note: MelodyNote = { d: Number(digit), b, o: octave.startsWith("'") ? octave.length : -octave.length };
      if (dots) note.dots = dots as 1 | 2;
      if (tuplet) { note.tuplet = tuplet; if (tuplet === 3) note.tri = true; }
      if (acc) note.a = acc === "#" || acc === "♯" ? 1 : acc === "b" || acc === "♭" ? -1 : 0;
      // "~" on the same pitch holds the note; on a new pitch it is a slur that still sounds.
      const samePitch = previous && previous.d === note.d && (previous.o ?? 0) === (note.o ?? 0) && (previous.a ?? 0) === (note.a ?? 0);
      if (tie && samePitch) note.tie = true;
      else if (tie && note.d) note.slur = true;
      else if (note.d) { const word = words[w++]; if (word === "_") note.inst = true; else if (word && word !== "~") note.lyric = word; }
      if (note.d) previous = note;
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

/** Compact consecutive per-bar meter entries for readable catalog labels. */
export function displayMeter(meter: string) {
  const entries = meter.split("、").filter(Boolean);
  const groups: Array<{ meter: string; count: number }> = [];
  for (const entry of entries) {
    const last = groups.at(-1);
    if (last?.meter === entry) last.count += 1;
    else groups.push({ meter: entry, count: 1 });
  }
  return groups.map(({ meter: entry, count }) => count > 1 ? `${entry}×${count}` : entry).join("、");
}

function checkBars(melody: Melody, bars: MelodyNote[][]) {
  // If there is one meter entry per bar, preserve positions such as an opening
  // 散板 bar and skip only that bar's beat-length check. Shorter lists remain
  // sets of allowed meters for interior bars, with pickup/final bars excepted.
  const entries = melody.meter.split("、").filter(Boolean);
  const perBarSequence = entries.length === bars.length;
  const beatLength = (meter: string) => {
    if (!meter.includes("/")) return null;
    const [top, bottom] = meter.split("/").map(Number);
    return top * (4 / bottom);
  };
  const orderedBeats = perBarSequence ? entries.map(beatLength) : [];
  const allowed = (perBarSequence ? entries : entries.filter((meter) => meter.includes("/")))
    .map(beatLength)
    .filter((beats): beats is number => beats !== null);
  if (!perBarSequence && !allowed.length) return [];
  return bars
    .map((bar, index) => ({ index, total: bar.reduce((sum, note) => sum + note.b, 0) }))
    .filter(({ index, total }) => {
      if (!perBarSequence && (index === 0 || index === bars.length - 1)) return false;
      if (perBarSequence) {
        const expected = orderedBeats[index];
        if (expected === null || expected === undefined) return false;
        return Math.abs(total - expected) >= 1e-6;
      }
      return !allowed.some((beats) => Math.abs(total - beats) < 1e-6);
    });
}

/** How a note is drawn in jianpu: underline count, augmentation dot, extension dashes. */
export function notation(note: MelodyNote) {
  const base = note.tuplet ? note.b * note.tuplet / (note.tuplet - 1) : note.tri ? note.b * 1.5 : note.b;
  const dotMultiplier = note.dots === 2 ? 1.75 : note.dots === 1 ? 1.5 : 1;
  const inferredDots = note.dots ?? ([0.375, 0.75, 1.5, 3].some((value) => Math.abs(base - value) < 1e-6) ? 1 : 0);
  const dotted = inferredDots > 0;
  const plain = base / (inferredDots === 2 ? 1.75 : inferredDots === 1 ? 1.5 : dotMultiplier);
  return {
    lines: plain < 1 ? Math.round(Math.log2(1 / plain)) : 0,
    dotted: dotted && plain < 2,
    dots: inferredDots,
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

const wordCount = (lyrics: string) => lyrics.split(/\s+/).filter(Boolean).length;

type SegmentOptions = { title?: string; label?: string; voices?: Array<{ label: string; notes: string; lyrics?: string }>; note?: string; octave?: number; quality?: "draft"; edition?: string; lyricsEnd?: number };
/**
 * One excerpt of a work: key text, meter, tempo, textbook source, jianpu notes and lyrics.
 * `octave` shifts playback (e.g. -1 for scores written an octave high).
 */
export function segment(book: string, page: number | string, key: string, meter: string, bpm: number, notes: string, lyrics = "", options: SegmentOptions = {}): Melody {
  const edition = options.edition ?? "人音版";
  return {
    title: options.title,
    key,
    tonic: key.replace(/^1=/, ""),
    tonicMidi: (key === "节奏" ? 60 : tonicMidiOf(key)) + 12 * (options.octave ?? 0),
    meter,
    bpm,
    source: options.quality === "draft"
      ? `${edition}${book}第 ${page} 页谱例自动识别草稿${options.note ? `（${options.note}）` : ""}`
      : `据${edition}${book}第 ${page} 页谱例转写${options.note ? `（${options.note}）` : ""}`,
    quality: options.quality,
    bars: jianpu(notes, lyrics),
    label: options.label ?? (options.voices?.length ? "第一声部" : undefined),
    voices: options.voices?.map((voice) => ({ label: voice.label, bars: jianpu(voice.notes, voice.lyrics ?? ""), lyricWords: wordCount(voice.lyrics ?? "") })),
    lyricWords: wordCount(lyrics),
    lyricsEnd: options.lyricsEnd,
  };
}
