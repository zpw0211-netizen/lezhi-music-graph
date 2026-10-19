"use client";

import { useMemo } from "react";
import type { MelodyNote } from "../../lib/lesson/jianpu";
import type { Phrase } from "../../lib/lesson/phrases";

// The melody drawn as a line: across is time (each note as long as its
// value), up is pitch in scale steps of the jianpu degrees, so 5 is always
// above 3 and a leap looks like a leap. Same degrees share a colour.

const BEAT_W = 46;
const STEP_H = 22;
const GUTTER = 40;
const PAD_TOP = 26;
const LYRIC_H = 30;
const BAR_H = 14;
const ROW_BEATS = 16;

const DEGREE_COLORS = ["#E25A4C", "#EE8E36", "#D9AE22", "#5DAE55", "#38A2B0", "#5878D2", "#9C66D0"];

type Shape = {
  index: number;
  start: number;
  end: number;
  /** Scale-step height (degree − 1 + 7 × octave), null for rests and unpitched X. */
  step: number | null;
  degree: number;
  octave: number;
  lyric: string;
  rhythm: boolean;
};

/** Notes with their beat span; tied notes merge into the note they hold. */
function shapesOf(notes: MelodyNote[]): Shape[] {
  const shapes: Shape[] = [];
  let beat = 0;
  notes.forEach((note, index) => {
    const start = beat;
    beat += note.b;
    const last = shapes[shapes.length - 1];
    if (note.tie && last && last.step !== null) { last.end = beat; return; }
    const pitched = note.d >= 1 && note.d <= 7;
    shapes.push({
      index,
      start,
      end: beat,
      step: pitched ? note.d - 1 + 7 * (note.o ?? 0) + 0.5 * (note.a ?? 0) : null,
      degree: note.d,
      octave: note.o ?? 0,
      lyric: note.slur ? "" : note.lyric ?? "",
      rhythm: note.d === 9,
    });
  });
  return shapes;
}

/** Rows of whole phrases, up to ROW_BEATS beats each. */
function rowsOf(phrases: Phrase[]) {
  const rows: Phrase[][] = [];
  for (const phrase of phrases) {
    const row = rows[rows.length - 1];
    const beats = row ? row[row.length - 1].endBeat - row[0].startBeat : 0;
    if (row && beats + phrase.endBeat - phrase.startBeat <= ROW_BEATS) row.push(phrase);
    else rows.push([phrase]);
  }
  return rows;
}

function Degree({ x, y, degree, octave, size }: { x: number; y: number; degree: number; octave: number; size: number }) {
  return <g>
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={size} fontWeight={700}>{degree}</text>
    {Array.from({ length: Math.abs(octave) }, (_, k) => (
      <circle key={k} cx={x} cy={octave > 0 ? y - size * 0.62 - k * 4 : y + size * 0.62 + k * 4} r={1.7} />
    ))}
  </g>;
}

export function MelodyLine({ notes, bars, phrases, current, activePhrase, singing }: {
  notes: MelodyNote[];
  bars: MelodyNote[][];
  phrases: Phrase[];
  current: number;
  activePhrase: number | null;
  singing: boolean;
}) {
  const shapes = useMemo(() => shapesOf(notes), [notes]);
  const rows = useMemo(() => rowsOf(phrases), [phrases]);
  const barStarts = useMemo(() => bars.reduce<number[]>((acc, bar) => [...acc, acc[acc.length - 1] + bar.reduce((s, n) => s + n.b, 0)], [0]), [bars]);
  const steps = shapes.flatMap((shape) => shape.step === null ? [] : [shape.step]);
  const hasRhythm = shapes.some((shape) => shape.rhythm);
  if (!steps.length) return null;
  const low = Math.floor(Math.min(...steps));
  const high = Math.ceil(Math.max(...steps));
  // Pitch rows from the lowest to the highest degree used, plus a lane for unpitched X.
  const rhythmLane = hasRhythm ? 1.3 : 0;
  const plotH = (high - low) * STEP_H;
  const height = PAD_TOP + plotH + rhythmLane * STEP_H + BAR_H + LYRIC_H;
  const yOf = (step: number) => PAD_TOP + (high - step) * STEP_H;
  const rhythmY = PAD_TOP + plotH + rhythmLane * STEP_H;
  // A tied note belongs to the shape it holds, so take the last shape starting at or before it.
  const currentShape = current < 0 ? undefined : [...shapes].reverse().find((shape) => shape.index <= current);

  return <div className={`melody-line${singing ? " is-singing" : ""}`} aria-hidden="true">
    {rows.map((row, rowIndex) => {
      const rowStart = row[0].startBeat;
      const rowEnd = row[row.length - 1].endBeat;
      const width = GUTTER + ROW_BEATS * BEAT_W + 12;
      const xOf = (beat: number) => GUTTER + (beat - rowStart) * BEAT_W;
      const rowShapes = shapes.filter((shape) => shape.start >= rowStart - 1e-6 && shape.start < rowEnd - 1e-6);
      const inActive = (shape: Shape) => activePhrase !== null && shape.index >= phrases[activePhrase].startNote && shape.index < phrases[activePhrase].endNote;
      return <svg key={rowIndex} viewBox={`0 0 ${width} ${height}`} className="melody-line-row" style={{ minWidth: `${Math.round((GUTTER + (rowEnd - rowStart) * BEAT_W) * 0.62)}px` }}>
        <defs>
          <filter id={`melody-line-glow-${rowIndex}`} x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation="3.2" /></filter>
        </defs>
        {/* Scale-step guides: one line per degree, do lines a little stronger. */}
        {Array.from({ length: high - low + 1 }, (_, k) => {
          const step = high - k;
          const degree = ((step % 7) + 7) % 7 + 1;
          const octave = Math.floor(step / 7);
          const y = yOf(step);
          return <g key={step} className={`melody-line-guide${degree === 1 ? " is-do" : ""}`}>
            <line x1={GUTTER - 6} x2={xOf(rowEnd)} y1={y} y2={y} />
            <g className="melody-line-label"><Degree x={GUTTER - 22} y={y} degree={degree} octave={octave} size={12} /></g>
          </g>;
        })}
        {barStarts.filter((beat) => beat > rowStart + 1e-6 && beat < rowEnd - 1e-6).map((beat) => (
          <line key={beat} className="melody-line-bar" x1={xOf(beat)} x2={xOf(beat)} y1={PAD_TOP - 14} y2={PAD_TOP + plotH + rhythmLane * STEP_H + 8} />
        ))}
        {/* Connectors between neighbouring pitched notes; a rest breaks the line. */}
        {rowShapes.map((shape, k) => {
          const next = rowShapes[k + 1];
          if (!next || shape.step === null || next.step === null || Math.abs(next.start - shape.end) > 1e-6) return null;
          const x1 = xOf(shape.end) - 3;
          const x2 = xOf(next.start) + 3;
          const y1 = yOf(shape.step);
          const y2 = yOf(next.step);
          return <path key={`c${shape.index}`} className="melody-line-link" d={`M${x1} ${y1} C${x1 + 8} ${y1}, ${x2 - 8} ${y2}, ${x2} ${y2}`} />;
        })}
        {rowShapes.map((shape) => {
          const x0 = xOf(shape.start) + 3;
          const x1 = xOf(shape.end) - 3;
          const active = currentShape === shape;
          const dim = activePhrase !== null && !inActive(shape);
          if (shape.rhythm) {
            return <g key={shape.index} className={`melody-line-x${active ? " is-active" : ""}${dim ? " is-dim" : ""}`}>
              <text x={x0 + 6} y={rhythmY} textAnchor="middle" dominantBaseline="central" fontSize={15}>×</text>
              {shape.lyric && <text className="melody-line-lyric" x={x0 + 6} y={height - 10} textAnchor="middle">{shape.lyric}</text>}
            </g>;
          }
          if (shape.step === null) return null;
          const y = yOf(shape.step);
          const color = DEGREE_COLORS[(shape.degree - 1) % 7];
          return <g key={shape.index} className={`melody-line-note${active ? " is-active" : ""}${dim ? " is-dim" : ""}`} style={{ color }}>
            {active && <rect className="melody-line-halo" x={x0 - 3} y={y - BAR_H / 2 - 3} width={Math.max(8, x1 - x0) + 6} height={BAR_H + 6} rx={(BAR_H + 6) / 2} filter={`url(#melody-line-glow-${rowIndex})`} />}
            <rect x={x0} y={y - BAR_H / 2} width={Math.max(8, x1 - x0)} height={BAR_H} rx={BAR_H / 2} />
            <g className="melody-line-digit"><Degree x={x0 + 7} y={y - BAR_H - 2} degree={shape.degree} octave={shape.octave} size={13} /></g>
            {shape.lyric && <text className="melody-line-lyric" x={x0 + 7} y={height - 10} textAnchor="middle">{shape.lyric}</text>}
          </g>;
        })}
        {/* The ball hops onto whichever note is sounding (or being sung). */}
        {currentShape && rowShapes.includes(currentShape) && (
          <circle className="melody-line-ball" r={6.5} style={{ transform: `translate(${xOf(currentShape.start) + 10}px, ${(currentShape.step === null ? rhythmY : yOf(currentShape.step)) - BAR_H - 16}px)` }} />
        )}
      </svg>;
    })}
  </div>;
}

