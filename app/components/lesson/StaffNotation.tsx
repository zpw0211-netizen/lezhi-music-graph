import { midiOf, type Melody, type MelodyNote } from "../../lib/lesson/melodies";
import type { ReactElement } from "react";

export type MelodyLineData = { label: string; bars: MelodyNote[][] };

type Clef = "treble" | "bass";
type Pitch = { letter: string; octave: number; alteration: number; step: number };
type NotePlan = { pitch?: Pitch; accidental?: string; flags: number; dots: number; tuplet?: number };

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PITCH_CLASS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARPS = ["F", "C", "G", "D", "A", "E", "B"];
const FLATS = ["B", "E", "A", "D", "G", "C", "F"];
const SHARP_KEYS: Record<string, number> = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7 };
const FLAT_KEYS: Record<string, number> = { F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6, Cb: 7 };
const ACCIDENTALS: Record<number, string> = { [-2]: "𝄫", [-1]: "♭", 0: "♮", 1: "♯", 2: "𝄪" };
const TREBLE_BOTTOM = 30; // E4 in diatonic steps
const BASS_BOTTOM = 18; // G2 in diatonic steps
const STAFF_TOP = 20;
const STAFF_BOTTOM = 60;
const ROW_HEIGHT = 108;
const LABEL_WIDTH = 52;

function tonicOf(key: string) {
  const match = key.replace(/\s/g, "").match(/^1=([♭♯#b]?)([A-G])/);
  if (!match) return { letter: "C", accidental: "" };
  return { letter: match[2], accidental: match[1] === "♭" || match[1] === "b" ? "b" : match[1] ? "#" : "" };
}

function keySignature(key: string) {
  const tonic = tonicOf(key);
  const name = `${tonic.letter}${tonic.accidental}`;
  const count = tonic.accidental === "b"
    ? FLAT_KEYS[name] ?? 0
    : tonic.accidental === "#"
      ? SHARP_KEYS[name] ?? 0
      : FLAT_KEYS[name] ?? SHARP_KEYS[name] ?? 0;
  const order = tonic.accidental === "b" || (!tonic.accidental && Object.hasOwn(FLAT_KEYS, name)) ? FLATS : SHARPS;
  const alteration = Object.fromEntries(order.slice(0, count).map((letter) => [letter, order === SHARPS ? 1 : -1]));
  return { order: order.slice(0, count), alteration } as { order: string[]; alteration: Record<string, number> };
}

function pitchOf(melody: Melody, note: MelodyNote): Pitch {
  const tonic = tonicOf(melody.key);
  const tonicIndex = LETTERS.indexOf(tonic.letter);
  const degreeIndex = Math.max(0, Math.min(6, note.d - 1));
  const absoluteIndex = tonicIndex + degreeIndex;
  const letter = LETTERS[absoluteIndex % 7];
  const midi = midiOf(melody, note);
  const pitchClass = NATURAL_PITCH_CLASS[letter];
  const octave = Math.round((midi - pitchClass) / 12) - 1;
  const alteration = midi - ((octave + 1) * 12 + pitchClass);
  const step = octave * 7 + LETTERS.indexOf(letter);
  return { letter, octave, alteration, step };
}

function staffPlacement(melody: Melody, bars: MelodyNote[][]) {
  const notes = bars.flat().filter((note) => note.d > 0 && note.d !== 9);
  const preferred: Clef = notes.filter((note) => midiOf(melody, note) < 67).length > notes.length / 2 ? "bass" : "treble";
  const candidates = ([preferred, preferred === "bass" ? "treble" : "bass"] as Clef[]).flatMap((clef, order) => {
    const bottom = clef === "treble" ? TREBLE_BOTTOM : BASS_BOTTOM;
    return [-3, -2, -1, 0, 1, 2, 3].map((octaveShift) => {
      const steps = notes.map((note) => pitchOf(melody, note).step - octaveShift * 7 - bottom);
      const outside = steps.filter((step) => step < -10 || step > 18);
      const distance = steps.reduce((sum, step) => sum + Math.max(0, -10 - step) + Math.max(0, step - 18), 0);
      return { clef, octaveShift, outside: outside.length, distance, order };
    });
  });
  candidates.sort((a, b) => a.outside - b.outside || a.distance - b.distance || a.order - b.order || Math.abs(a.octaveShift) - Math.abs(b.octaveShift));
  return candidates[0] ?? { clef: "treble" as Clef, octaveShift: 0, outside: 0, distance: 0, order: 0 };
}

function durationShape(note: MelodyNote) {
  const tuplet = note.tuplet ?? (note.tri ? 3 : undefined);
  const base = tuplet ? note.b * tuplet / (tuplet - 1) : note.b;
  const dotChoices = [
    { dots: 0, multiplier: 1 },
    { dots: 1, multiplier: 1.5 },
    { dots: 2, multiplier: 1.75 },
  ];
  let dots = note.dots ?? 0;
  let plain = base;
  if (!note.dots) {
    const match = dotChoices.find(({ multiplier }) => [0.125, 0.25, 0.5, 1, 2, 4, 8].some((value) => Math.abs(base - value * multiplier) < 1e-6));
    if (match) {
      dots = match.dots;
      plain = base / match.multiplier;
    }
  } else {
    plain = base / (dots === 1 ? 1.5 : dots === 2 ? 1.75 : 1);
  }
  const flags = plain < 1 ? Math.max(1, Math.round(Math.log2(1 / plain))) : 0;
  return { flags, dots, tuplet };
}

function notePlans(melody: Melody, notes: MelodyNote[]) {
  const signature = melody.key === "节奏" ? { alteration: {} as Record<string, number> } : keySignature(melody.key);
  const state = new Map<string, number>();
  const explicit = new Set<string>();
  return notes.map((note): NotePlan => {
    const shape = durationShape(note);
    if (note.d === 0 || note.d === 9) return shape;
    const pitch = pitchOf(melody, note);
    const key = `${pitch.letter}${pitch.octave}`;
    const current = state.has(key) ? state.get(key)! : signature.alteration[pitch.letter] ?? 0;
    // Keep the degree's letter spelling, while deriving the accidental from
    // the shared MIDI result relative to that letter's natural pitch.
    const desired = pitch.alteration;
    const explicitSign = note.a != null;
    const shouldShow = explicitSign ? !explicit.has(key) || current !== desired : current !== desired;
    state.set(key, desired);
    if (explicitSign) explicit.add(key);
    return { ...shape, pitch, accidental: shouldShow ? ACCIDENTALS[desired] ?? (desired > 0 ? "♯" : "♭") : undefined };
  });
}

function meterAt(melody: Melody, index: number) {
  const entries = melody.meter.split("、").filter(Boolean);
  return entries.length === melody.bars.length ? entries[index] ?? entries[0] : entries[0] ?? "";
}

function timeSignature(value: string) {
  const match = value.match(/(\d+)\s*\/\s*(\d+)/);
  return match ? { top: match[1], bottom: match[2] } : null;
}

function signatureWidth(value: string, show: boolean) {
  return show && timeSignature(value) ? 22 : 0;
}

function noteAreaWidth(lineBars: MelodyNote[][][], barIndex: number) {
  const notes = Math.max(0, ...lineBars.map((bars) => bars[barIndex]?.length ?? 0));
  const beats = Math.max(1, ...lineBars.map((bars) => bars[barIndex]?.reduce((sum, note) => sum + note.b, 0) ?? 0));
  return Math.max(88, beats * 34, notes * 16);
}

function systemHeaderWidth(melody: Melody, start: number) {
  const priorMeter = start > 0 ? meterAt(melody, start - 1) : "";
  const meter = meterAt(melody, start);
  const showMeter = start === 0 || !!(priorMeter && meter && priorMeter !== meter);
  const clefAndKey = melody.key === "节奏" ? 0 : 48 + keySignature(melody.key).order.length * 9;
  return LABEL_WIDTH + clefAndKey + signatureWidth(meter, showMeter);
}

function stepFor(pitch: Pitch, clef: Clef, octaveShift = 0) {
  return pitch.step - (clef === "treble" ? TREBLE_BOTTOM : BASS_BOTTOM) - octaveShift * 7;
}

function symbolHeight(melody: Melody, clef: Clef, note: MelodyNote, pitch?: Pitch, octaveShift = 0) {
  if (melody.key === "节奏" || note.d === 9) return 40;
  if (note.d === 0 || !pitch) return 40;
  return STAFF_BOTTOM - stepFor(pitch, clef, octaveShift) * 5;
}

function clefGraphic(clef: Clef, x: number, y: number) {
  if (clef === "bass") return <g transform={`translate(${x} ${y})`} fill="currentColor" aria-hidden="true">
    <path d="M27 13 C18 13 14 20 19 27 C24 34 39 34 42 26 C44 19 38 15 31 18 C26 20 26 25 31 27 C35 28 38 25 37 22 C42 29 35 35 28 35 C18 35 12 29 12 22 C12 15 18 10 27 10 Z" />
    <circle cx="43" cy="20" r="2.4" /><circle cx="43" cy="30" r="2.4" />
  </g>;
  return <g transform={`translate(${x} ${y})`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M33 4 C25 10 26 19 32 28 C39 39 38 48 29 50 C19 52 13 43 15 34 C17 25 27 21 34 27 C40 32 38 39 33 41 C28 43 24 39 26 35 C28 31 34 33 34 36 C34 40 29 43 24 42 C17 40 15 33 18 27 C22 19 31 16 33 8 C34 4 33 1 31 0" />
    <path d="M33 4 L33 55" />
  </g>;
}

function signatureGlyphs(key: string, clef: Clef, x: number, y: number) {
  const signature = keySignature(key);
  const tonic = tonicOf(key);
  const isFlat = tonic.accidental === "b" || (!tonic.accidental && Object.hasOwn(FLAT_KEYS, tonic.letter));
  const order = signature.order;
  return <g className="staff-key-signature" aria-hidden="true">
    {order.map((letter, index) => {
      const octave = clef === "treble"
        ? (isFlat ? ([4, 5, 4, 5, 4, 5, 4][index]) : ([5, 5, 5, 5, 4, 5, 4][index]))
        : (isFlat ? ([2, 3, 2, 3, 2, 3, 2][index]) : ([3, 3, 3, 3, 2, 3, 2][index]));
      const pitch = { letter, octave, alteration: 0, step: octave * 7 + LETTERS.indexOf(letter) };
      const glyph = isFlat ? "♭" : "♯";
      return <text key={`${letter}-${index}`} x={x + index * 9} y={y + STAFF_BOTTOM - stepFor(pitch, clef) * 5 + 5} className="staff-accidental">{glyph}</text>;
    })}
  </g>;
}

function beatGroups(meter: string, total: number) {
  const match = meter.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return [total];
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  if (denominator === 8) {
    if (numerator === 5) return [1.5, 1];
    if (numerator === 7) return [1.5, 1, 1];
    if (numerator >= 3 && numerator % 3 === 0) return Array(numerator / 3).fill(1.5);
  }
  const unit = 4 / denominator;
  return Array(numerator).fill(unit);
}

function beamRuns(notes: MelodyNote[], meter: string) {
  const total = notes.reduce((sum, note) => sum + note.b, 0);
  const groups = beatGroups(meter, total);
  const runs: number[][] = [];
  let groupStart = 0;
  for (const groupLength of groups) {
    const groupEnd = Math.min(total, groupStart + groupLength);
    let beat = 0;
    let run: number[] = [];
    notes.forEach((note, index) => {
      const start = beat;
      const end = beat + note.b;
      beat = end;
      const withinGroup = start >= groupStart - 1e-6 && end <= groupEnd + 1e-6;
      const canBeam = withinGroup && note.d !== 0 && note.d !== 9 && durationShape(note).flags > 0;
      if (canBeam) run.push(index);
      else if (run.length > 1) { runs.push(run); run = []; }
      else run = [];
    });
    if (run.length > 1) runs.push(run);
    groupStart = groupEnd;
    if (groupStart >= total - 1e-6) break;
  }
  return runs;
}

function ledgerSteps(step: number) {
  const result: number[] = [];
  for (let current = step; current > 8; current -= 1) if (current % 2 === 0) result.push(current);
  for (let current = step; current < 0; current += 1) if (current % 2 === 0) result.push(current);
  return result;
}

function staffNote({
  melody, note, plan, clef, octaveShift, x, yTop, active, color, noteIndex, beamed,
}: {
  melody: Melody; note: MelodyNote; plan: NotePlan; clef: Clef; octaveShift: number; x: number; yTop: number;
  active: boolean; color: string; noteIndex: number; beamed: Set<number>;
}) {
  const y = yTop + symbolHeight(melody, clef, note, plan.pitch, octaveShift);
  const { flags, dots } = plan;
  const filled = flags > 0 || note.b <= 1;
  const rest = note.d === 0;
  const spoken = note.d === 9;
  const stemUp = y >= yTop + 40;
  const stemX = x + (stemUp ? 5 : -5);
  const stemEnd = y + (stemUp ? -34 : 34);
  const noteColor = active ? "var(--brand-amber, #E9A83A)" : color;
  const parts: ReactElement[] = [];

  if (plan.accidental && !spoken && !rest) parts.push(<text key="acc" x={x - 13} y={y + 5} className="staff-accidental" fill={noteColor}>{plan.accidental}</text>);
  if (plan.pitch && !spoken && !rest) {
    for (const step of ledgerSteps(stepFor(plan.pitch, clef, octaveShift))) {
      const ledgerY = yTop + STAFF_BOTTOM - step * 5;
      parts.push(<line key={`ledger-${step}`} className="staff-ledger" x1={x - 9} x2={x + 9} y1={ledgerY} y2={ledgerY} stroke={noteColor} />);
    }
  }

  if (rest) {
    if (note.b >= 4) parts.push(<rect key="whole-rest" x={x - 5} y={yTop + 38} width="11" height="5" className="staff-rest" fill={noteColor} />);
    else if (note.b >= 2) parts.push(<rect key="half-rest" x={x - 5} y={yTop + 35} width="11" height="5" className="staff-rest" fill={noteColor} />);
    else if (flags === 0) parts.push(<path key="quarter-rest" d={`M${x + 2} ${yTop + 23} l-7 8 8 5 -7 8 9 7 -5 5`} fill="none" stroke={noteColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />);
    else parts.push(<g key="short-rest" fill={noteColor} stroke={noteColor} strokeWidth="2.2" strokeLinecap="round"><path d={`M${x + 2} ${yTop + 20} v${24 + Math.max(0, flags - 1) * 3}`} /><path d={`M${x + 2} ${yTop + 22} q11 1 4 9 M${x + 2} ${yTop + 30} q11 1 4 9`} />{flags >= 3 && <path d={`M${x + 2} ${yTop + 38} q11 1 4 9`} />}</g>);
  } else if (spoken) {
    parts.push(<g key="spoken" className="staff-crosshead" stroke={noteColor} strokeWidth="2.4"><path d={`M${x - 5} ${y - 5} l10 10 M${x + 5} ${y - 5} l-10 10`} /></g>);
  } else {
    if (flags > 0) parts.push(<line key="stem" x1={stemX} x2={stemX} y1={y} y2={stemEnd} stroke={noteColor} strokeWidth="1.5" />);
    parts.push(<ellipse key="head" cx={x} cy={y} rx="6.3" ry="4.3" transform={`rotate(-18 ${x} ${y})`} fill={filled ? noteColor : "var(--sheet, #fffdf7)"} stroke={noteColor} strokeWidth="1.5" className={active ? "staff-notehead is-active" : "staff-notehead"} />);
    if (flags > 0 && !beamed.has(noteIndex)) {
      for (let flag = 0; flag < flags; flag += 1) {
        const fy = stemEnd + (stemUp ? 3 : -3) + flag * (stemUp ? 5 : -5);
        parts.push(<path key={`flag-${flag}`} d={stemUp ? `M${stemX} ${fy} q10 5 4 12` : `M${stemX} ${fy} q10 -5 4 -12`} fill="none" stroke={noteColor} strokeWidth="2" strokeLinecap="round" />);
      }
    }
    for (let dot = 0; dot < dots; dot += 1) parts.push(<circle key={`dot-${dot}`} cx={x + 12 + dot * 5} cy={y - 2} r="1.6" fill={noteColor} />);
  }

  if (note.lyric) parts.push(<text key="lyric" x={x} y={yTop + 87} textAnchor="middle" className="staff-lyric" fill={active ? "var(--brand-amber, #E9A83A)" : color}>{note.lyric}</text>);
  return <g key={`note-${noteIndex}`} className={active ? "staff-note is-active" : "staff-note"}>{parts}</g>;
}

function slurRuns(notes: MelodyNote[]) {
  const runs: Array<{ start: number; end: number; tie: boolean }> = [];
  for (let index = 0; index < notes.length; index += 1) {
    if (notes[index].tie && index > 0) runs.push({ start: index - 1, end: index, tie: true });
    if (!notes[index].slur || (index > 0 && notes[index - 1].slur)) continue;
    let start = index - 1;
    while (start > 0 && notes[start].slur) start -= 1;
    let end = index;
    while (end + 1 < notes.length && notes[end + 1].slur) end += 1;
    runs.push({ start, end, tie: false });
  }
  return runs;
}

function StaffSystem({
  melody, lines, start, end, current, offsets, activePhrase, large,
}: {
  melody: Melody; lines: MelodyLineData[]; start: number; end: number; current: number[]; offsets: number[][];
  activePhrase: { startBar: number; endBar: number } | null; large?: boolean;
}) {
  const rhythmOnly = melody.key === "节奏";
  const placements = lines.map((line) => staffPlacement(melody, line.bars.slice(start, end)));
  const meter = meterAt(melody, start);
  const previousMeter = start > 0 ? meterAt(melody, start - 1) : "";
  const showMeter = start === 0 || !!(previousMeter && meter && previousMeter !== meter);
  const header = systemHeaderWidth(melody, start);
  const barWidths = Array.from({ length: end - start }, (_, offset) => {
    const index = start + offset;
    const noteWidth = noteAreaWidth(lines.map((line) => line.bars), index);
    const localMeter = meterAt(melody, index);
    const changed = index > start && localMeter !== meterAt(melody, index - 1);
    return noteWidth + (offset === 0 ? header - LABEL_WIDTH : signatureWidth(localMeter, changed));
  });
  const totalWidth = LABEL_WIDTH + barWidths.reduce((sum, width) => sum + width, 0) + 14;
  const top = 10;
  const height = top + lines.length * ROW_HEIGHT + 10;
  const xStarts: number[] = [];
  let cursor = LABEL_WIDTH;
  barWidths.forEach((width) => { xStarts.push(cursor); cursor += width; });

  return <svg className={`staff-system${large ? " is-large" : ""}`} viewBox={`0 0 ${totalWidth} ${height}`} role="img" aria-label={`五线谱，第 ${start + 1} 至 ${end} 小节`} preserveAspectRatio="xMinYMin meet">
    {lines.length > 1 && <path className="staff-brace" d={`M45 ${top + STAFF_TOP} C31 ${top + STAFF_TOP} 39 ${top + ROW_HEIGHT * lines.length / 2 - 2} 30 ${top + ROW_HEIGHT * lines.length / 2} C39 ${top + ROW_HEIGHT * lines.length / 2 + 2} 31 ${top + STAFF_TOP + ROW_HEIGHT * lines.length - 20} 45 ${top + STAFF_TOP + ROW_HEIGHT * lines.length - 20}`} fill="none" stroke="currentColor" strokeWidth="1.8" />}
    {lines.map((line, voice) => {
      const rowTop = top + voice * ROW_HEIGHT;
      const voiceColor = voice === 0 ? "var(--brand-green, #16834F)" : voice === 1 ? "var(--brand-blue, #2466B8)" : "var(--brand-purple, #7A5AB8)";
      const { clef, octaveShift } = placements[voice];
      const allPlans = line.bars.map((bar) => notePlans(melody, bar).map((plan) => ({
        ...plan,
        pitch: plan.pitch ? { ...plan.pitch, step: plan.pitch.step - octaveShift * 7 } : undefined,
      })));
      const ottavaLabel = octaveShift === 0 ? "" : Math.abs(octaveShift) === 1 ? (octaveShift > 0 ? "8va" : "8vb") : `${Math.abs(octaveShift) === 2 ? "15" : "22"}${octaveShift > 0 ? "ma" : "mb"}`;
      return <g key={`voice-${voice}`} className={`staff-voice voice-${voice}`} color={voiceColor}>
        <text x="2" y={rowTop + 47} className="staff-voice-label" fill={voiceColor}>{line.label}</text>
        {Array.from({ length: rhythmOnly ? 1 : 5 }, (_, lineIndex) => {
          const y = rowTop + (rhythmOnly ? 40 : STAFF_TOP + lineIndex * 10);
          return <line key={`staff-line-${lineIndex}`} x1={LABEL_WIDTH} x2={totalWidth - 5} y1={y} y2={y} className="staff-rule" />;
        })}
        {!rhythmOnly && clefGraphic(clef, xStarts[0] + 4, rowTop + 7)}
        {!rhythmOnly && signatureGlyphs(melody.key, clef, xStarts[0] + 50, rowTop)}
        {!rhythmOnly && ottavaLabel && <g className="staff-ottava" aria-label={`八度移位 ${ottavaLabel}`}>
          <text x={xStarts[0] + header - LABEL_WIDTH + 6} y={rowTop + STAFF_TOP - 5}>{ottavaLabel}</text>
          <line x1={xStarts[0] + header - LABEL_WIDTH + 20} x2={totalWidth - 12} y1={rowTop + STAFF_TOP - 9} y2={rowTop + STAFF_TOP - 9} strokeDasharray="3 2" />
        </g>}
        {showMeter && timeSignature(meter) && <g className="staff-time-signature" aria-hidden="true">
          <text x={xStarts[0] + header - LABEL_WIDTH - 18} y={rowTop + 39}>{timeSignature(meter)!.top}</text>
          <text x={xStarts[0] + header - LABEL_WIDTH - 18} y={rowTop + 55}>{timeSignature(meter)!.bottom}</text>
        </g>}
        {Array.from({ length: end - start }, (_, localIndex) => {
          const barIndex = start + localIndex;
          const notes = line.bars[barIndex] ?? [];
          const plans = allPlans[barIndex] ?? [];
          const barStart = xStarts[localIndex];
          const priorMetersDiffer = barIndex > start && meterAt(melody, barIndex) !== meterAt(melody, barIndex - 1);
          const leading = localIndex === 0 ? header - LABEL_WIDTH : signatureWidth(meterAt(melody, barIndex), priorMetersDiffer);
          const areaStart = barStart + leading + 7;
          const areaWidth = Math.max(20, barWidths[localIndex] - leading - 14);
          const totalBeats = Math.max(1, notes.reduce((sum, note) => sum + note.b, 0));
          let elapsed = 0;
          const positions = notes.map((note) => {
            const x = areaStart + (elapsed + note.b / 2) / totalBeats * areaWidth;
            elapsed += note.b;
            return x;
          });
          const beamed = new Set(beamRuns(notes, meterAt(melody, barIndex)).flat());
          const runs = beamRuns(notes, meterAt(melody, barIndex));
          const beamElements = runs.flatMap((run, runIndex) => {
            const maxLevel = Math.max(...run.map((index) => plans[index]?.flags ?? 0));
            return Array.from({ length: maxLevel }, (_, levelIndex) => {
              const level = levelIndex + 1;
              const candidates = run.filter((index) => (plans[index]?.flags ?? 0) >= level);
              const segments: number[][] = [];
              let segment: number[] = [];
              candidates.forEach((index) => {
                if (segment.length && index !== segment[segment.length - 1] + 1) { segments.push(segment); segment = []; }
                segment.push(index);
              });
              if (segment.length) segments.push(segment);
              return segments.map((indexes, segmentIndex) => {
                if (indexes.length < 2) return null;
                const first = indexes[0];
                const last = indexes[indexes.length - 1];
                const firstY = rowTop + symbolHeight(melody, clef, notes[first], plans[first]?.pitch, octaveShift);
                const lastY = rowTop + symbolHeight(melody, clef, notes[last], plans[last]?.pitch, octaveShift);
                const firstUp = firstY >= rowTop + 40;
                const lastUp = lastY >= rowTop + 40;
                const x1 = positions[first] + (firstUp ? 5 : -5);
                const x2 = positions[last] + (lastUp ? 5 : -5);
                const y1 = firstY + (firstUp ? -34 : 34) + levelIndex * (firstUp ? 5 : -5);
                const y2 = lastY + (lastUp ? -34 : 34) + levelIndex * (lastUp ? 5 : -5);
                return <line key={`beam-${runIndex}-${level}-${segmentIndex}`} className="staff-beam" x1={x1} x2={x2} y1={y1} y2={y2} stroke={voiceColor} strokeWidth="3" />;
              });
            });
          });
          const tieElements = slurRuns(notes).map((run, index) => {
            const from = notes[run.start];
            const to = notes[run.end];
            if (!from || !to || from.d === 0 || to.d === 0) return null;
            const y1 = rowTop + symbolHeight(melody, clef, from, plans[run.start]?.pitch, octaveShift) + 10;
            const y2 = rowTop + symbolHeight(melody, clef, to, plans[run.end]?.pitch, octaveShift) + 10;
            const x1 = positions[run.start] + 2;
            const x2 = positions[run.end] + 2;
            if (x2 <= x1) return null;
            return <path key={`slur-${index}`} d={`M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.max(y1, y2) + (run.tie ? 5 : 9)} ${x2} ${y2}`} className={run.tie ? "staff-tie" : "staff-slur"} fill="none" stroke={voiceColor} strokeWidth="1.3" />;
          });
          const tuplets: ReactElement[] = [];
          for (let tupletStart = 0; tupletStart < notes.length;) {
            const n = notes[tupletStart].tuplet ?? (notes[tupletStart].tri ? 3 : undefined);
            if (!n) { tupletStart += 1; continue; }
            let tupletEnd = tupletStart;
            while (tupletEnd + 1 < notes.length && (notes[tupletEnd + 1].tuplet ?? (notes[tupletEnd + 1].tri ? 3 : undefined)) === n) tupletEnd += 1;
            const y = Math.max(4, Math.min(...notes.slice(tupletStart, tupletEnd + 1).map((note, offset) => rowTop + symbolHeight(melody, clef, note, plans[tupletStart + offset]?.pitch, octaveShift))) - 20);
            const x1 = positions[tupletStart] - 8;
            const x2 = positions[tupletEnd] + 8;
            tuplets.push(<g key={`tuplet-${tupletStart}`} className="staff-tuplet"><path d={`M${x1} ${y + 4} v-4 H${x2} v4`} fill="none" stroke={voiceColor} strokeWidth="1" /><text x={(x1 + x2) / 2} y={y - 2} textAnchor="middle" fill={voiceColor}>{n}</text></g>);
            tupletStart = tupletEnd + 1;
          }
          const dimmed = !!activePhrase && (barIndex < activePhrase.startBar || barIndex >= activePhrase.endBar);
          return <g key={`bar-${barIndex}`} className={dimmed ? "staff-measure is-dim" : "staff-measure"}>
            {localIndex > 0 && <line x1={barStart} x2={barStart} y1={rowTop + STAFF_TOP} y2={rowTop + STAFF_BOTTOM + (line.bars[barIndex]?.some((note) => note.lyric) ? 29 : 6)} className="staff-barline" />}
            {priorMetersDiffer && timeSignature(meterAt(melody, barIndex)) && <g className="staff-time-signature" aria-hidden="true">
              <text x={barStart + leading - 18} y={rowTop + 39}>{timeSignature(meterAt(melody, barIndex))!.top}</text>
              <text x={barStart + leading - 18} y={rowTop + 55}>{timeSignature(meterAt(melody, barIndex))!.bottom}</text>
            </g>}
            {beamElements}
            {tieElements}
            {tuplets}
            {notes.map((note, noteIndex) => staffNote({
              melody, note, plan: plans[noteIndex] ?? { flags: 0, dots: 0 }, clef, octaveShift, x: positions[noteIndex], yTop: rowTop,
              active: offsets[voice]?.[barIndex] + noteIndex === current[voice], color: voiceColor, noteIndex, beamed,
            }))}
          </g>;
        })}
        <line x1={xStarts.at(-1)! + barWidths.at(-1)!} x2={xStarts.at(-1)! + barWidths.at(-1)!} y1={rowTop + STAFF_TOP} y2={rowTop + STAFF_BOTTOM + 6} className="staff-barline" />
        {end === melody.bars.length && <line x1={totalWidth - 9} x2={totalWidth - 9} y1={rowTop + STAFF_TOP} y2={rowTop + STAFF_BOTTOM + 6} className="staff-final-line" />}
      </g>;
    })}
  </svg>;
}

export function StaffNotation({
  melody, lines, current, offsets, barsPerRow, activePhrase, large,
}: {
  melody: Melody; lines: MelodyLineData[]; current: number[]; offsets: number[][]; barsPerRow: number;
  activePhrase: { startBar: number; endBar: number } | null; large?: boolean;
}) {
  const systems: Array<{ start: number; end: number }> = [];
  for (let start = 0; start < melody.bars.length; start += Math.max(1, barsPerRow))
    systems.push({ start, end: Math.min(melody.bars.length, start + Math.max(1, barsPerRow)) });
  return <div className={`staff-score${large ? " is-large" : ""}`}>
    {systems.map(({ start, end }) => <StaffSystem key={`system-${start}`} melody={melody} lines={lines} start={start} end={end} current={current} offsets={offsets} activePhrase={activePhrase} large={large} />)}
  </div>;
}
