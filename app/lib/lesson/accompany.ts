// 人声伴奏：按旋律给每小节（4/4 每半小节，x/8 每个附点四分拍）自动配一个和弦，写成钢琴伴奏，
// 和录好的人声排在同一条时间轴上。五声调式的歌（几乎不用 4、7）只用不含 4、7 的和弦，配成空五度一类的音，
// 免得配出西洋味；结尾落在旋律的末音上（宫、商、徵、羽调式各自回到主音）。前奏用最后两小节的伴奏。
// 伴奏的织体按歌曲的性格自动选（进行曲用柱式和弦、慢歌用分解和弦……），老师也可以自己换。
import { midiOf, type Melody } from "./jianpu";

/** One accompaniment tone; `at` is in melody beats (quarter notes) from the melody's first beat, negative in the intro. */
export type AccNote = { at: number; length: number; midi: number; level: number };
/** 伴奏织体。 */
export type AccStyle = "march" | "hymn" | "waltz" | "lyric" | "lullaby" | "lilt" | "lively" | "folk" | "plain";
export const ACC_STYLES: Record<AccStyle, string> = {
  march: "进行曲（柱式和弦）",
  hymn: "颂歌（长音柱式和弦）",
  lyric: "抒情（分解和弦）",
  lullaby: "摇篮曲（轻柔分解和弦）",
  waltz: "圆舞曲（强弱弱）",
  lilt: "六八拍（摇曳）",
  lively: "活泼（跳音）",
  folk: "民歌风（空五度）",
  plain: "中速（低音＋和弦）",
};
export type Accompaniment = { style: AccStyle; notes: AccNote[]; /** beats of intro before the melody's first beat */ intro: number;
  /** The chord of each stretch (pitch classes from do), for checking. */ chords: Array<{ from: number; to: number; root: number; pcs: number[] }> };

/** `voice`: the tones the right hand plays when not the whole chord (V7 leaves out its fifth). */
type Chord = { root: number; pcs: number[]; bias: number; voice?: number[] };

/** Pitch classes counted from 1 (do). */
const MAJOR: Chord[] = [
  { root: 0, pcs: [0, 4, 7], bias: 0.15 }, // I
  { root: 5, pcs: [5, 9, 0], bias: 0.05 }, // IV
  { root: 7, pcs: [7, 11, 2], bias: 0.05 }, // V
  { root: 7, pcs: [7, 11, 2, 5], bias: 0.08, voice: [7, 11, 5] }, // V7
  { root: 9, pcs: [9, 0, 4], bias: 0 }, // vi
  { root: 2, pcs: [2, 5, 9], bias: -0.05 }, // ii
  { root: 4, pcs: [4, 7, 11], bias: -0.15 }, // iii
];
/** Raised notes in the tune call for their own chord: ♯5 → III (E major in C), ♯4 → II (D major), ♭7 → ♭VII. */
const CHROMATIC: Array<{ when: number; chord: Chord }> = [
  { when: 8, chord: { root: 4, pcs: [4, 8, 11], bias: 0 } },
  { when: 6, chord: { root: 2, pcs: [2, 6, 9], bias: 0 } },
  { when: 10, chord: { root: 10, pcs: [10, 2, 5], bias: 0 } },
];
/** Five-tone songs: chords from do re mi sol la only. */
const PENTA: Chord[] = [
  { root: 0, pcs: [0, 4, 7], bias: 0.15 }, // 1 3 5
  { root: 9, pcs: [9, 0, 4], bias: 0.05 }, // 6 1 3
  { root: 7, pcs: [7, 2, 9], bias: 0.05 }, // 5 2 6
  { root: 2, pcs: [2, 9, 7], bias: 0 }, // 2 6 5
  { root: 4, pcs: [4, 9], bias: -0.2 }, // 3 6
];

/** pc null: a rest, or with `spoken` an unpitched X (念白、拍手). */
type Span = { start: number; end: number; pc: number | null; spoken?: boolean };

const pcOf = (melody: Melody, midi: number) => (((midi - melody.tonicMidi) % 12) + 12) % 12;
/** A pitch class placed in [low, low + 12). */
const place = (melody: Melody, pc: number, low: number) => low + ((((melody.tonicMidi + pc - low) % 12) + 12) % 12);

function fit(chord: Chord, spans: Span[], from: number, to: number) {
  let score = chord.bias;
  for (const span of spans) {
    if (span.pc === null) continue;
    const overlap = Math.min(span.end, to) - Math.max(span.start, from);
    if (overlap <= 1e-6) continue;
    const fits = chord.pcs.includes(span.pc);
    score += fits ? overlap : -0.25 * overlap;
    if (Math.abs(span.start - from) < 1e-6) score += fits ? 0.5 : -0.5;
  }
  return score;
}

/** A bar of `length` beats cut into the stretches that each get one chord. */
function cut(length: number, compound: boolean): number[] {
  if (compound) {
    const out: number[] = [];
    let left = length;
    while (left > 1.5 + 1e-6) { out.push(1.5); left -= 1.5; }
    if (left > 1e-6) out.push(left);
    return out;
  }
  if (Math.abs(length - 4) < 1e-6) return [2, 2];
  if (Math.abs(length - 6) < 1e-6) return [3, 3];
  if (Math.abs(length - 5) < 1e-6) return [3, 2];
  return [length];
}

/** The song's character from its tempo, metre, rhythm, words and the textbook's markings. */
function styleOf(melody: Melody, usual: number, compound: boolean, penta: boolean): AccStyle {
  const marks = `${melody.title ?? ""}${melody.source}`;
  const notes = melody.bars.flat();
  const words = notes.map((note) => note.lyric ?? "").join("");
  const { bpm } = melody;
  if (/摇篮|催眠|睡吧|宝宝睡/.test(marks + words)) return "lullaby";
  if (compound) return bpm <= 80 ? "lyric" : "lilt";
  if (/圆舞曲/.test(marks) || (Math.abs(usual - 3) < 1e-6 && bpm >= 104)) return "waltz";
  if (/进行曲|行进速度/.test(marks)) return "march";
  if (Math.abs(usual - 3) < 1e-6 || bpm <= 72) return "lyric";
  // Dotted rhythms at a brisk tempo, or marching words: a march.
  const pitched = notes.filter((note) => note.d >= 1 && note.d <= 7);
  const dotted = pitched.filter((note) => note.dots).length / Math.max(1, pitched.length);
  const marching = /前进|进军|冲锋|战士|军|队员|少先队|红领巾|升旗|国旗|英雄|向前|奋勇/.test(words);
  if (bpm >= 92 && (dotted >= 0.15 || (marching && dotted >= 0.06))) return "march";
  // Solemn songs of praise at a steady 4/4: long block chords.
  const solemn = /颂|赞歌|庄严|庄重/.test(marks) || /祖国|党|人民|中华|长城|黄河|红旗|英雄|太阳最红/.test(words);
  if (solemn && Math.abs(usual - 4) < 1e-6 && bpm >= 76 && bpm <= 96 && !penta) return "hymn";
  if (penta) return "folk";
  if (bpm >= 108) return "lively";
  return "plain";
}

export function accompaniment(melody: Melody, choice: AccStyle | "auto" = "auto"): Accompaniment | null {
  if (melody.voices?.length || /散/.test(melody.meter)) return null;
  // Compound time (6/8, 9/8, 12/8, 3/8) by the metre most bars use, so one odd bar does not decide it.
  const meters = melody.meter.split(/[、,，\s]+/).filter(Boolean);
  const meter = meters.sort((a, b) => meters.filter((x) => x === b).length - meters.filter((x) => x === a).length)[0] ?? "";
  const compound = /^(3|6|9|12)\/8$/.test(meter);
  // The melody as spans of pitch class (null = rest or unpitched), ties folded in.
  const spans: Span[] = [];
  const barStarts: number[] = [];
  let t = 0;
  for (const bar of melody.bars) {
    barStarts.push(t);
    for (const note of bar) {
      const pitched = note.d >= 1 && note.d <= 7;
      const pc = pitched ? pcOf(melody, midiOf(melody, note)) : null;
      const last = spans[spans.length - 1];
      if (note.tie && last && last.pc === pc) last.end = t + note.b;
      else spans.push({ start: t, end: t + note.b, pc, ...(note.d === 9 ? { spoken: true } : {}) });
      t += note.b;
    }
  }
  const pitchedSpans = spans.filter((span) => span.pc !== null);
  if (!pitchedSpans.length) return null;
  const lengths = melody.bars.map((bar) => bar.reduce((sum, note) => sum + note.b, 0));
  const usual = [...lengths].sort((a, b) => lengths.filter((x) => x === b).length - lengths.filter((x) => x === a).length)[0];

  // Five-tone tune: fa and ti together under 3% of the sung time.
  const time = (pcs: number[]) => pitchedSpans.reduce((sum, span) => sum + (pcs.includes(span.pc!) ? span.end - span.start : 0), 0);
  const sung = time([...Array(12).keys()]);
  const penta = time([5, 11]) / sung < 0.03 && time([1, 3, 6, 8, 10]) === 0;
  const finalSpan = pitchedSpans[pitchedSpans.length - 1];
  const final = finalSpan.pc!;
  let chords = penta ? PENTA : [...MAJOR, ...CHROMATIC.filter((item) => pitchedSpans.some((span) => span.pc === item.when)).map((item) => item.chord)];
  // The chord on the closing note is the tonic of the mode (宫 1、商 2、角 3、徵 5、羽 6);
  // a major-key tune (one that sings fa and ti) ending on mi or sol still closes on do.
  const closing = !penta && (final === 4 || final === 7) ? 0 : final;
  // A tune (or excerpt) stopping on another note, say ti, closes on the plainest chord that holds it (V for ti).
  let home = chords.find((chord) => chord.root === closing && !chord.voice)
    ?? chords.filter((chord) => !chord.voice && chord.pcs.includes(closing)).sort((a, b) => b.bias - a.bias)[0];
  if (!home) { home = { root: closing, pcs: [closing, (closing + 7) % 12], bias: 0 }; chords = [...chords, home]; }
  chords = chords.map((chord) => (chord === home ? { ...chord, bias: chord.bias + 0.25 } : chord));
  const homeRoot = home.root;
  home = chords.find((chord) => chord.root === homeRoot && !chord.voice)!;

  // The closing chord starts with the last sung note and is held to the end of its bar (or of the note).
  const closeFrom = finalSpan.start;
  let closeBar = 0;
  barStarts.forEach((at, index) => { if (at <= closeFrom + 1e-6) closeBar = index; });
  const closeTo = Math.max(finalSpan.end, barStarts[closeBar] + lengths[closeBar]);
  const overlaps = (span: Span, from: number, to: number) => Math.min(span.end, to) - Math.max(span.start, from) > 1e-6;

  // Rests before the first sung note are left to the intro (when the tune opens on less than a bar of them).
  const firstSung = pitchedSpans[0].start;
  const leadIn = firstSung < usual - 1e-6 ? firstSung : 0;

  // One chord per stretch.
  type Stretch = { from: number; to: number; chord: Chord; last: boolean };
  const stretches: Stretch[] = [];
  let previous: Chord = home;
  melody.bars.forEach((_, index) => {
    const length = lengths[index];
    const from0 = barStarts[index];
    // A pickup bar is sung alone, as in the textbook accompaniments.
    if (index === 0 && length < usual - 1e-6 && melody.bars.length > 1) return;
    const regionEnd = Math.min(from0 + length, closeFrom);
    let from = from0;
    for (const piece of cut(length, compound)) {
      if (from >= regionEnd - 1e-6) break;
      const to = Math.min(from + piece, regionEnd);
      if (to <= leadIn + 1e-6) { from = to; continue; }
      if (from < leadIn) from = leadIn;
      const heard = spans.some((span) => span.pc !== null && overlaps(span, from, to));
      // 念白、拍手的小节不垫和弦。
      const spoken = !heard && spans.some((span) => span.spoken && overlaps(span, from, to));
      let chord = previous;
      if (spoken) { from = to; continue; }
      if (heard) {
        // V7 only where the tune itself sings fa.
        const fa = spans.some((span) => span.pc === 5 && overlaps(span, from, to));
        const ranked = chords.filter((item) => !item.voice || fa)
          .map((item) => ({ item, score: fit(item, spans, from, to) + (item === previous ? 0.1 : 0) })).sort((a, b) => b.score - a.score);
        chord = ranked[0].item;
      }
      stretches.push({ from, to, chord, last: false });
      previous = chord;
      from = to;
    }
    if (index === closeBar) stretches.push({ from: closeFrom, to: closeTo, chord: home, last: true });
  });

  const style = choice === "auto" ? styleOf(melody, usual, compound, penta) : choice;
  // Each texture's loudness evened out (measured on sample songs) to about 6–7 dB under the voice; the lullaby a little softer.
  const soft = ({ march: 0.78, hymn: 0.72, folk: 0.8, lively: 1.35, lullaby: 0.8 } as Partial<Record<AccStyle, number>>)[style] ?? 1;
  const notes: AccNote[] = [];
  const write = (stretch: Stretch, shift: number, index: number) => {
    const { from, to, chord } = stretch;
    const length = to - from;
    const bass = place(melody, chord.root, 41);
    const upper = (chord.voice ?? chord.pcs).map((pc) => place(melody, pc, 55)).sort((a, b) => a - b);
    if (upper.length < 3) upper.push(upper[0] + 12);
    const add = (at: number, len: number, midi: number, level: number) => notes.push({ at: from + at + shift, length: len, midi, level: level * soft });
    if (stretch.last) {
      add(0, length, bass, 0.5);
      add(0, length, bass + 12, 0.25);
      upper.forEach((midi) => add(0.02, length, midi, 0.22));
      return;
    }
    const block = (at: number, len: number, level: number) => upper.forEach((midi) => add(at, len, midi, level));
    /** Eighth notes up and down the chord over a held bass. */
    const arpeggio = (level: number) => {
      const order = compound ? [0, 1, 2, 1, 0] : [0, 1, 2, 1];
      for (let k = 1; k * 0.5 < length - 1e-6; k += 1) add(k * 0.5, 0.5, upper[order[(k - 1) % order.length]], level);
    };
    /** Bass on the first beat, then the chord on each further beat. */
    const oomPah = (bassLen: number, chordLen: number, chordLevel: number, low = bass) => {
      add(0, Math.min(1, length) * bassLen, low, 0.5);
      if (length < 1.5) { block(0, length * 0.9, 0.18); return; }
      for (let beat = 1; beat < length - 1e-6; beat += 1) block(beat, Math.min(1, length - beat) * chordLen, chordLevel);
    };
    switch (style) {
      case "march":
        // 柱式和弦：每拍一个整和弦，强拍加上八度低音，短而有力。
        for (let beat = 0; beat < length - 1e-6; beat += compound ? 1.5 : 1) {
          const len = Math.min(compound ? 1.5 : 1, length - beat) * 0.55;
          if (beat === 0) { add(0, len, bass, 0.55); add(0, len, bass + 12, 0.3); }
          block(beat, len, beat === 0 ? 0.24 : 0.2);
        }
        return;
      case "hymn":
        // 长音柱式和弦：整段一个饱满的和弦。
        add(0, length, bass, 0.48);
        add(0, length, bass + 12, 0.24);
        block(0.02, length, 0.2);
        return;
      case "lyric":
      case "lullaby":
        add(0, length, bass, 0.46);
        arpeggio(0.26);
        return;
      case "lilt":
        add(0, Math.min(1, length), bass, 0.48);
        if (length > 1 + 1e-6) block(1, 0.45, 0.2);
        return;
      case "folk": {
        // 空五度：低音配五度，上方和弦音轻轻点在弱拍。
        const len = Math.min(1, length) * 0.95;
        add(0, len, bass, 0.46);
        add(0, len, bass + 7, 0.3);
        if (melody.bpm <= 80) { arpeggio(0.24); return; }
        for (let beat = 1; beat < length - 1e-6; beat += 1) { add(beat, 0.7, upper[1], 0.22); add(beat, 0.7, upper[2], 0.2); }
        return;
      }
      case "lively": {
        // 跳音：短促的低音和和弦，同一和弦时低音在根音、五音之间交替。
        const before = stretches[index - 1];
        const low = index % 2 && before && before.chord === chord ? place(melody, (chord.root + 7) % 12, 36) : bass;
        oomPah(0.4, 0.35, 0.2, low);
        return;
      }
      case "waltz":
        oomPah(0.95, 0.6, 0.2);
        return;
      default:
        oomPah(0.95, 0.75, 0.2);
    }
  };
  stretches.forEach((stretch, index) => write(stretch, 0, index));

  // Intro: the accompaniment of the last two bars, ending on the home chord just before the first sung beat.
  const tail = stretches.filter((stretch) => stretch.from >= barStarts[Math.max(1, closeBar - 1)] - 1e-6);
  const introStart = tail.length ? tail[0].from : 0;
  // A tune that opens on a bar or more of rests already has its intro.
  const intro = tail.length && firstSung < usual - 1e-6 ? closeTo - introStart - firstSung : 0;
  if (intro > 0) tail.forEach((stretch) => write(stretch, -(closeTo - firstSung), stretches.indexOf(stretch)));
  // The intro's closing chord must not ring into the singing.
  for (const note of notes) if (note.at < firstSung - 1e-6 && note.at + note.length > firstSung) note.length = firstSung - note.at;
  return {
    style,
    notes: notes.filter((note) => note.length > 0.05), intro: Math.max(0, intro),
    chords: stretches.map(({ from, to, chord }) => ({ from, to, root: chord.root, pcs: chord.voice ?? chord.pcs })),
  };
}
