// Basic rhythm patterns for primary and middle-school rhythm drills, written
// in the textbook X notation: each token is one printed symbol. `lines` is the
// number of reducing lines under it (1 = eighth, 2 = sixteenth), `dot` an
// augmentation dot, "–" a dash that holds the previous note for one beat and
// "0" a rest. Durations always count quarter notes, as jianpu durations are
// absolute; x/8 meters only change how a bar is grouped and counted.

export type RhythmToken = {
  g: "X" | "0" | "–";
  dur: number;
  lines?: 1 | 2;
  dot?: boolean;
};

export type RhythmLevel = 1 | 2 | 3;
export type MeterFamily = "simple" | "compound";

export type RhythmPattern = {
  id: string;
  name: string;
  family: MeterFamily;
  level: RhythmLevel;
  beats: number;
  tokens: RhythmToken[];
  /** Printed with a "3" bracket over the group. */
  triplet?: boolean;
};

export type MeterId = "2/4" | "3/4" | "4/4" | "3/8" | "6/8";

export type Meter = {
  id: MeterId;
  top: number;
  bottom: 4 | 8;
  family: MeterFamily;
  /** Bar length in quarter notes. */
  beats: number;
  /** Counted unit in quarter notes: a quarter for x/4, an eighth for x/8. */
  unit: number;
};

export const METERS: Meter[] = [
  { id: "2/4", top: 2, bottom: 4, family: "simple", beats: 2, unit: 1 },
  { id: "3/4", top: 3, bottom: 4, family: "simple", beats: 3, unit: 1 },
  { id: "4/4", top: 4, bottom: 4, family: "simple", beats: 4, unit: 1 },
  { id: "3/8", top: 3, bottom: 8, family: "compound", beats: 1.5, unit: .5 },
  { id: "6/8", top: 6, bottom: 8, family: "compound", beats: 3, unit: .5 },
];

export const METER_BY_ID = new Map(METERS.map((meter) => [meter.id, meter]));

const X = (dur: number, lines?: 1 | 2, dot?: boolean): RhythmToken => ({ g: "X", dur, ...(lines ? { lines } : {}), ...(dot ? { dot } : {}) });
const R = (dur: number, lines?: 1 | 2, dot?: boolean): RhythmToken => ({ g: "0", dur, ...(lines ? { lines } : {}), ...(dot ? { dot } : {}) });
const HOLD: RhythmToken = { g: "–", dur: 1 };

export const RHYTHM_LEVELS: Record<MeterFamily, Array<{ level: RhythmLevel; label: string; caption: string }>> = {
  simple: [
    { level: 1, label: "基础", caption: "四分、八分、二分、全音符与休止" },
    { level: 2, label: "进阶", caption: "十六分、前八后十六、附点四分、小切分" },
    { level: 3, label: "提高", caption: "附点八分、大切分、三连音" },
  ],
  compound: [
    { level: 1, label: "基础", caption: "三个八分、四分加八分、附点四分" },
    { level: 2, label: "进阶", caption: "八分加四分、八分休止、附点四分休止" },
    { level: 3, label: "提高", caption: "附点八分组合、十六分组合" },
  ],
};

export const RHYTHM_PATTERNS: RhythmPattern[] = [
  { id: "q", name: "四分音符", family: "simple", level: 1, beats: 1, tokens: [X(1)] },
  { id: "ee", name: "八分音符", family: "simple", level: 1, beats: 1, tokens: [X(.5, 1), X(.5, 1)] },
  { id: "h", name: "二分音符", family: "simple", level: 1, beats: 2, tokens: [X(1), HOLD] },
  { id: "w", name: "全音符", family: "simple", level: 1, beats: 4, tokens: [X(1), HOLD, HOLD, HOLD] },
  { id: "qr", name: "四分休止符", family: "simple", level: 1, beats: 1, tokens: [R(1)] },
  { id: "ssss", name: "十六分音符", family: "simple", level: 2, beats: 1, tokens: [X(.25, 2), X(.25, 2), X(.25, 2), X(.25, 2)] },
  { id: "ess", name: "前八后十六", family: "simple", level: 2, beats: 1, tokens: [X(.5, 1), X(.25, 2), X(.25, 2)] },
  { id: "sse", name: "前十六后八", family: "simple", level: 2, beats: 1, tokens: [X(.25, 2), X(.25, 2), X(.5, 1)] },
  { id: "dq", name: "附点四分音符", family: "simple", level: 2, beats: 2, tokens: [X(1.5, undefined, true), X(.5, 1)] },
  { id: "ses", name: "小切分", family: "simple", level: 2, beats: 1, tokens: [X(.25, 2), X(.5, 1), X(.25, 2)] },
  { id: "re", name: "八分休止符", family: "simple", level: 2, beats: 1, tokens: [R(.5, 1), X(.5, 1)] },
  { id: "des", name: "附点八分音符", family: "simple", level: 3, beats: 1, tokens: [X(.75, 1, true), X(.25, 2)] },
  { id: "sde", name: "十六分加附点八分", family: "simple", level: 3, beats: 1, tokens: [X(.25, 2), X(.75, 1, true)] },
  { id: "syn", name: "大切分", family: "simple", level: 3, beats: 2, tokens: [X(.5, 1), X(1), X(.5, 1)] },
  { id: "tri", name: "三连音", family: "simple", level: 3, beats: 1, triplet: true, tokens: [X(1 / 3, 1), X(1 / 3, 1), X(1 / 3, 1)] },

  // x/8: every group fills one dotted-quarter pulse (three eighths), except the dotted half.
  { id: "c3e", name: "三个八分音符", family: "compound", level: 1, beats: 1.5, tokens: [X(.5, 1), X(.5, 1), X(.5, 1)] },
  { id: "cqe", name: "四分加八分", family: "compound", level: 1, beats: 1.5, tokens: [X(1), X(.5, 1)] },
  { id: "cdq", name: "附点四分音符", family: "compound", level: 1, beats: 1.5, tokens: [X(1.5, undefined, true)] },
  { id: "cdh", name: "附点二分音符", family: "compound", level: 1, beats: 3, tokens: [X(1), HOLD, HOLD] },
  { id: "ceq", name: "八分加四分", family: "compound", level: 2, beats: 1.5, tokens: [X(.5, 1), X(1)] },
  { id: "cree", name: "八分休止加两个八分", family: "compound", level: 2, beats: 1.5, tokens: [R(.5, 1), X(.5, 1), X(.5, 1)] },
  { id: "cdqr", name: "附点四分休止符", family: "compound", level: 2, beats: 1.5, tokens: [R(1.5, undefined, true)] },
  { id: "cdes", name: "附点八分组合", family: "compound", level: 3, beats: 1.5, tokens: [X(.75, 1, true), X(.25, 2), X(.5, 1)] },
  { id: "csse", name: "两个十六分加两个八分", family: "compound", level: 3, beats: 1.5, tokens: [X(.25, 2), X(.25, 2), X(.5, 1), X(.5, 1)] },
  { id: "c6s", name: "六个十六分音符", family: "compound", level: 3, beats: 1.5, tokens: [X(.25, 2), X(.25, 2), X(.25, 2), X(.25, 2), X(.25, 2), X(.25, 2)] },
];

export const PATTERN_BY_ID = new Map(RHYTHM_PATTERNS.map((pattern) => [pattern.id, pattern]));

export const DEFAULT_PATTERN_IDS = ["q", "ee", "h", "qr", "c3e", "cqe", "cdq"];

const BASIC_ID: Record<MeterFamily, string> = { simple: "q", compound: "c3e" };

/** One bar of the score: the patterns in it and the beats left unfilled. */
export type RhythmBar = { groups: Array<{ index: number; pattern: RhythmPattern }>; empty: number };

const EPS = 1e-6;

/** Patterns that can be used in this meter: same family and no longer than a bar. */
export const fitsMeter = (pattern: RhythmPattern, meter: Meter) => pattern.family === meter.family && pattern.beats <= meter.beats + EPS;

/**
 * Lay a flat list of patterns into bars. A pattern never crosses a barline:
 * when it does not fit, the rest of the bar stays empty (shown as gaps) and it
 * starts the next bar. Patterns that do not suit the meter are dropped.
 */
export function packBars(ids: string[], meter: Meter): RhythmBar[] {
  const bars: RhythmBar[] = [];
  let current: RhythmBar = { groups: [], empty: meter.beats };
  ids.forEach((id, index) => {
    const pattern = PATTERN_BY_ID.get(id);
    if (!pattern || !fitsMeter(pattern, meter)) return;
    if (pattern.beats > current.empty + EPS) {
      bars.push(current);
      current = { groups: [], empty: meter.beats };
    }
    current.groups.push({ index, pattern });
    current.empty -= pattern.beats;
    if (current.empty < EPS) {
      current.empty = 0;
      bars.push(current);
      current = { groups: [], empty: meter.beats };
    }
  });
  if (current.groups.length || !bars.length) bars.push(current);
  return bars;
}

/** A random exercise of `barCount` full bars using only the allowed patterns. */
export function generateRhythm(allowedIds: string[], meter: Meter, barCount: number, random = Math.random): string[] {
  const basic = PATTERN_BY_ID.get(BASIC_ID[meter.family])!;
  const allowed = allowedIds.map((id) => PATTERN_BY_ID.get(id)).filter((p): p is RhythmPattern => !!p && fitsMeter(p, meter));
  const pool = allowed.length ? allowed : [basic];
  const shortest = Math.min(...pool.map((p) => p.beats));
  const fallback = pool.filter((p) => p.beats === shortest);
  const result: string[] = [];
  for (let bar = 0; bar < barCount; bar++) {
    let left = meter.beats;
    while (left > EPS) {
      const fitting = pool.filter((p) => p.beats <= left + EPS);
      const choices = fitting.length ? fitting : fallback[0].beats <= left + EPS ? fallback : [basic];
      let pick = choices[Math.floor(random() * choices.length)];
      // Avoid three of the same pattern in a row when there is a choice.
      const n = result.length;
      if (choices.length > 1 && n >= 2 && result[n - 1] === pick.id && result[n - 2] === pick.id) {
        const others = choices.filter((p) => p.id !== pick.id);
        pick = others[Math.floor(random() * others.length)];
      }
      result.push(pick.id);
      left -= pick.beats;
    }
  }
  return result;
}

/** A printed symbol with its start time, for playback and highlighting. */
export type TimedToken = {
  key: string;
  start: number;
  dur: number;
  sounding: boolean;
  /** For a sounding note: how long it rings, including the dashes after it. */
  length: number;
};

/** Every token of the packed score in order, timed in quarter notes from the first bar. */
export function timeline(bars: RhythmBar[], meter: Meter): TimedToken[] {
  const out: TimedToken[] = [];
  bars.forEach((bar, barIndex) => {
    let at = barIndex * meter.beats;
    bar.groups.forEach((group) => {
      group.pattern.tokens.forEach((token, tokenIndex) => {
        if (token.g === "–") {
          const ringing = [...out].reverse().find((t) => t.sounding);
          if (ringing && Math.abs(ringing.start + ringing.length - at) < EPS) ringing.length += token.dur;
        }
        out.push({ key: tokenKey(group.index, tokenIndex), start: at, dur: token.dur, sounding: token.g === "X", length: token.dur });
        at += token.dur;
      });
    });
  });
  return out;
}

export const tokenKey = (groupIndex: number, tokenIndex: number) => `${groupIndex}:${tokenIndex}`;
