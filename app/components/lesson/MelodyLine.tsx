"use client";

import { useEffect, useId, useMemo, useRef, type RefObject } from "react";
import type { MelodyNote } from "../../lib/lesson/jianpu";
import type { Phrase } from "../../lib/lesson/phrases";

// The melody drawn as a ridge line over an ink-wash landscape: a smooth curve
// through a bead on every note, dotted ahead and a glowing ribbon behind that
// runs warm on the peaks and green in the valleys, with a swallow flying it.
// The highest and lowest notes carry a small label. Across is time on a compressed
// scale (short notes keep room for their digit, long notes and rests stop
// leaving wide gaps), up is pitch in scale steps, so 5 always sits above 3;
// faint degree guides on the left keep the heights readable.

const BEAT_W = 48;
const GUTTER = 36;
const PAD_TOP = 48;
const STEM_GAP = 24;
const LYRIC_H = 26;
const ROW_UNITS = 18;
const BEAD_X = 10;

/** Horizontal room a note takes, in beat widths. */
function spanOf(note: MelodyNote) {
  if (note.d === 0) return Math.min(note.b, 1) * 0.6;
  if (note.tie) return note.b * 0.3;
  return note.b <= 1 ? Math.max(note.b, 0.5) : 1 + (note.b - 1) * 0.3;
}

/** Beat → position on the compressed timeline, interpolated inside each note. */
function timelineOf(notes: MelodyNote[]) {
  const knots: Array<[number, number]> = [[0, 0]];
  for (const note of notes) {
    const [beat, pos] = knots[knots.length - 1];
    knots.push([beat + note.b, pos + spanOf(note)]);
  }
  return (beat: number) => {
    const last = knots[knots.length - 1];
    if (beat >= last[0]) return last[1] + (beat - last[0]) * 0.3;
    if (beat <= 0) return 0;
    let lo = 0, hi = knots.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (knots[mid][0] <= beat) lo = mid; else hi = mid; }
    const [b0, p0] = knots[lo], [b1, p1] = knots[hi];
    return p0 + (p1 - p0) * ((beat - b0) / Math.max(1e-6, b1 - b0));
  };
}

type Bead = {
  index: number;
  beat: number;
  /** Scale-step height (degree − 1 + 7 × octave), null for unpitched X. */
  step: number | null;
  degree: number;
  octave: number;
  lyric: string;
};

type Row = { start: number; end: number; from: number; to: number; beads: Bead[]; segments: Bead[][]; samples: Array<[number, number]>[] };

/** One bead per sounding note; ties and rests make none, a rest breaks the line. */
function beadsOf(notes: MelodyNote[]) {
  const beads: Array<Bead | null> = [];
  let beat = 0;
  notes.forEach((note, index) => {
    const at = beat;
    beat += note.b;
    if (note.tie) return;
    if (note.d === 0) { beads.push(null); return; }
    const pitched = note.d >= 1 && note.d <= 7;
    beads.push({
      index,
      beat: at,
      step: pitched ? note.d - 1 + 7 * (note.o ?? 0) + 0.5 * (note.a ?? 0) : null,
      degree: note.d,
      octave: note.o ?? 0,
      lyric: note.slur ? "" : note.lyric ?? "",
    });
  });
  return beads;
}

/** Catmull-Rom through the points, sampled densely so the orb can ride it. */
function sampleCurve(points: Array<[number, number]>): Array<[number, number]> {
  if (points.length < 2) return points.slice();
  const out: Array<[number, number]> = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    for (let k = 0; k < 14; k += 1) {
      const f = k / 14;
      const c = (a: number, b: number, c2: number, d: number) => 0.5 * (2 * b + (-a + c2) * f + (2 * a - 5 * b + 4 * c2 - d) * f * f + (-a + 3 * b - 3 * c2 + d) * f * f * f);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** The area under a stretch of the line, down to the foot of the plot. */
const washOf = (samples: Array<[number, number]>, foot: number) => `${pathOf(samples)}L${samples[samples.length - 1][0].toFixed(1)} ${foot}L${samples[0][0].toFixed(1)} ${foot}Z`;

const pathOf = (samples: Array<[number, number]>) => samples.map(([x, y], k) => `${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");

function Degree({ x, y, degree, octave, size, className }: { x: number; y: number; degree: number; octave: number; size: number; className?: string }) {
  return <g className={className}>
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={size}>{degree}</text>
    {Array.from({ length: Math.abs(octave) }, (_, k) => (
      <circle key={k} cx={x} cy={octave > 0 ? y - size * 0.66 - k * 3.6 : y + size * 0.66 + k * 3.6} r={1.5} />
    ))}
  </g>;
}

export function MelodyLine({ notes, bars, phrases, current, activePhrase, singing, beatRef }: {
  notes: MelodyNote[];
  bars: MelodyNote[][];
  phrases: Phrase[];
  current: number;
  activePhrase: number | null;
  singing: boolean;
  /** Continuous playback position in beats (−1 when stopped), read every frame. */
  beatRef: RefObject<number>;
}) {
  const uid = useId().replace(/:/g, "");
  const beads = useMemo(() => beadsOf(notes), [notes]);
  const posAt = useMemo(() => timelineOf(notes), [notes]);
  const barStarts = useMemo(() => bars.reduce<number[]>((acc, bar) => [...acc, acc[acc.length - 1] + bar.reduce((s, n) => s + n.b, 0)], [0]), [bars]);
  const steps = beads.flatMap((bead) => bead && bead.step !== null ? [bead.step] : []);
  const hasRhythm = beads.some((bead) => bead && bead.step === null);
  const low = steps.length ? Math.floor(Math.min(...steps)) : 0;
  const high = steps.length ? Math.ceil(Math.max(...steps)) : 0;
  // Wide ranges get tighter steps so a row never grows too tall.
  const stepH = high - low > 9 ? 14 : high - low > 6 ? 17 : 20;
  const plotH = (high - low) * stepH;
  const rhythmY = PAD_TOP + plotH + (hasRhythm ? stepH * 1.2 : 0);
  const lyricY = rhythmY + STEM_GAP;
  const height = lyricY + LYRIC_H;
  const washY = PAD_TOP + plotH + 12;
  const yOf = (step: number) => PAD_TOP + (high - step) * stepH;

  // First highest and first lowest note, labelled when the tune really rises and falls.
  const peaks = useMemo(() => {
    const pitched = beads.filter((bead): bead is Bead => !!bead && bead.step !== null);
    if (pitched.length < 4) return { top: -1, bottom: -1 };
    const top = pitched.reduce((best, bead) => (bead.step as number) > (best.step as number) ? bead : best);
    const bottom = pitched.reduce((best, bead) => (bead.step as number) < (best.step as number) ? bead : best);
    return (top.step as number) - (bottom.step as number) >= 3 ? { top: top.index, bottom: bottom.index } : { top: -1, bottom: -1 };
  }, [beads]);

  const rows = useMemo<Row[]>(() => {
    // Rows of whole phrases, up to ROW_UNITS beat widths each.
    const groups: Phrase[][] = [];
    for (const phrase of phrases) {
      const row = groups[groups.length - 1];
      if (row && posAt(phrase.endBeat) - posAt(row[0].startBeat) <= ROW_UNITS) row.push(phrase);
      else groups.push([phrase]);
    }
    return groups.map((group) => {
      const start = group[0].startBeat;
      const end = group[group.length - 1].endBeat;
      const from = posAt(start);
      const inRow = (bead: Bead | null) => !bead || (bead.beat >= start - 1e-6 && bead.beat < end - 1e-6);
      const rowItems = beads.filter((bead, k) => inRow(bead) && (bead || (k > 0 && beads[k - 1] && inRow(beads[k - 1]))));
      const segments: Bead[][] = [[]];
      for (const bead of rowItems) {
        if (!bead || bead.step === null) { if (segments[segments.length - 1].length) segments.push([]); continue; }
        segments[segments.length - 1].push(bead);
      }
      const xOf = (beat: number) => GUTTER + (posAt(beat) - from) * BEAT_W + BEAD_X;
      const live = segments.filter((segment) => segment.length);
      return {
        start,
        end,
        from,
        to: posAt(end),
        beads: rowItems.filter((bead): bead is Bead => !!bead),
        segments: live,
        samples: live.map((segment) => sampleCurve(segment.map((bead) => [xOf(bead.beat), PAD_TOP + (high - (bead.step as number)) * stepH]))),
      };
    });
  }, [phrases, beads, high, stepH, posAt]);

  const clipRefs = useRef<Array<SVGRectElement | null>>([]);
  const orbRefs = useRef<Array<SVGGElement | null>>([]);
  const tilts = useRef<number[]>([]);

  // Move the orb and the lit part of the ribbon every frame from the shared beat position.
  useEffect(() => {
    let raf = 0;
    const frame = () => {
      const beat = beatRef.current ?? -1;
      rows.forEach((row, k) => {
        const clip = clipRefs.current[k];
        const orb = orbRefs.current[k];
        const x = GUTTER + (posAt(beat) - row.from) * BEAT_W + BEAD_X;
        const lit = beat < 0 ? 0 : beat >= row.end ? 99999 : beat < row.start ? 0 : x;
        clip?.setAttribute("width", String(Math.max(0, lit)));
        if (!orb) return;
        const inside = beat >= row.start - 1e-6 && beat < row.end - 1e-6;
        if (!inside) { orb.style.opacity = "0"; return; }
        // Ride the curve where it exists; in a rest the orb waits at the last height.
        let y: number | null = null;
        for (const samples of row.samples) {
          if (!samples.length || x < samples[0][0] - 1) continue;
          const last = samples[samples.length - 1];
          if (x > last[0]) { y = last[1]; continue; }
          for (let i = 1; i < samples.length; i += 1) {
            if (samples[i][0] >= x) {
              const [x0, y0] = samples[i - 1], [x1, y1] = samples[i];
              y = y0 + (y1 - y0) * ((x - x0) / Math.max(1e-6, x1 - x0));
              break;
            }
          }
        }
        let tilt = 0;
        if (y === null) y = rhythmY;
        else {
          // Nose up on the climbs, down on the falls.
          for (const samples of row.samples) {
            if (samples.length < 2 || x < samples[0][0] || x > samples[samples.length - 1][0]) continue;
            let i = 1;
            while (i < samples.length - 1 && samples[i][0] < x) i += 1;
            const a = samples[Math.max(0, i - 3)], b = samples[Math.min(samples.length - 1, i + 3)];
            tilt = Math.max(-26, Math.min(26, Math.atan2(b[1] - a[1], Math.max(1e-6, b[0] - a[0])) * 180 / Math.PI * 0.7));
          }
        }
        const prev = tilts.current[k] ?? 0;
        const eased = prev + (tilt - prev) * 0.12;
        tilts.current[k] = eased;
        orb.style.opacity = "1";
        orb.setAttribute("transform", `translate(${x.toFixed(1)} ${(y - 15).toFixed(1)}) rotate(${eased.toFixed(1)})`);
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [rows, beatRef, rhythmY, posAt]);

  // The one note sounding now: the last bead at or before the playback position, across all rows.
  const activeIndex = current < 0 ? -1 : beads.reduce((best, bead) => bead && bead.index <= current && bead.index > best ? bead.index : best, -1);

  if (!steps.length) return null;

  return <div className={`melody-line${singing ? " is-singing" : ""}`} aria-hidden="true">
    {rows.map((row, rowIndex) => {
      // All rows share one scale, set by the longest row, so that row fills the width.
      const width = GUTTER + Math.max(ROW_UNITS - 2, ...rows.map((item) => item.to - item.from)) * BEAT_W + 24;
      const xOf = (beat: number) => GUTTER + (posAt(beat) - row.from) * BEAT_W + BEAD_X;
      const inActive = (bead: Bead) => activePhrase !== null && bead.index >= phrases[activePhrase].startNote && bead.index < phrases[activePhrase].endNote;
      const clipId = `ml-${uid}-${rowIndex}`;
      const glowId = `mlg-${uid}-${rowIndex}`;
      return <svg key={rowIndex} viewBox={`0 0 ${width} ${height}`} className="melody-line-row" style={{ minWidth: `${Math.round((GUTTER + (row.to - row.from) * BEAT_W) * 0.62)}px` }}>
        <defs>
          <clipPath id={clipId}><rect ref={(el) => { clipRefs.current[rowIndex] = el; }} x={0} y={0} width={0} height={height} /></clipPath>
          <filter id={glowId} x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="4" /></filter>
          {/* Warm on the peaks, green in the valleys. */}
          <linearGradient id={`${glowId}-pitch`} gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={PAD_TOP} y2={PAD_TOP + Math.max(plotH, 1)}><stop offset="0" stopColor="#E0703F" /><stop offset=".45" stopColor="#E2A744" /><stop offset="1" stopColor="#4E9B76" /></linearGradient>
          <linearGradient id={`${glowId}-wash`} gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={PAD_TOP} y2={washY}><stop offset="0" stopColor="#3F7D62" stopOpacity=".2" /><stop offset="1" stopColor="#3F7D62" stopOpacity="0" /></linearGradient>
          <linearGradient id={`${glowId}-lit`} gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={PAD_TOP} y2={washY}><stop offset="0" stopColor="#E9A545" stopOpacity=".42" /><stop offset=".55" stopColor="#7DB58F" stopOpacity=".22" /><stop offset="1" stopColor="#7DB58F" stopOpacity="0" /></linearGradient>
        </defs>
        {/* The ridge as an ink wash; the part already sung warms up. */}
        {row.samples.map((samples, k) => samples.length > 1 && <path key={`w${k}`} className="melody-line-wash" d={washOf(samples, washY)} fill={`url(#${glowId}-wash)`} />)}
        <g clipPath={`url(#${clipId})`}>
          {row.samples.map((samples, k) => samples.length > 1 && <path key={`wl${k}`} className="melody-line-wash" d={washOf(samples, washY)} fill={`url(#${glowId}-lit)`} />)}
        </g>
        {/* Faint scale-step guides; do lines a little stronger. */}
        {Array.from({ length: high - low + 1 }, (_, k) => {
          const step = high - k;
          const degree = ((step % 7) + 7) % 7 + 1;
          const y = yOf(step);
          return <g key={step} className={`melody-line-guide${degree === 1 ? " is-do" : ""}`}>
            <line x1={GUTTER - 4} x2={xOf(row.end) - BEAD_X} y1={y} y2={y} />
            {(stepH > 14 || degree % 2 === 1) && <Degree className="melody-line-label" x={GUTTER - 20} y={y} degree={degree} octave={Math.floor(step / 7)} size={11} />}
          </g>;
        })}
        {barStarts.filter((beat) => beat > row.start + 1e-6 && beat < row.end - 1e-6).map((beat) => (
          <line key={beat} className="melody-line-bar" x1={xOf(beat) - BEAD_X} x2={xOf(beat) - BEAD_X} y1={PAD_TOP - 18} y2={rhythmY + 6} />
        ))}
        {/* Stems from each bead down to its lyric, as in the film. */}
        {row.beads.map((bead) => {
          const y = bead.step === null ? rhythmY : yOf(bead.step);
          return <line key={`s${bead.index}`} className={`melody-line-stem${activePhrase !== null && !inActive(bead) ? " is-dim" : ""}`} x1={xOf(bead.beat)} x2={xOf(bead.beat)} y1={y + 6} y2={lyricY - 14} />;
        })}
        {/* Ahead: a dotted line. Behind: the glowing gold ribbon, revealed by the clip. */}
        {row.samples.map((samples, k) => <path key={`d${k}`} className="melody-line-ahead" d={pathOf(samples)} />)}
        <g clipPath={`url(#${clipId})`}>
          {row.samples.map((samples, k) => <path key={`g${k}`} className="melody-line-glow" d={pathOf(samples)} filter={`url(#${glowId})`} />)}
          {row.samples.map((samples, k) => <path key={`r${k}`} className="melody-line-ribbon" d={pathOf(samples)} stroke={`url(#${glowId}-pitch)`} />)}
          {row.samples.map((samples, k) => <path key={`l${k}`} className="melody-line-shine" d={pathOf(samples)} />)}
        </g>
        {row.beads.map((bead) => {
          const x = xOf(bead.beat);
          const played = current >= bead.index;
          const active = bead.index === activeIndex;
          const dim = activePhrase !== null && !inActive(bead);
          if (bead.step === null) {
            return <g key={bead.index} className={`melody-line-x${active ? " is-active" : ""}${dim ? " is-dim" : ""}`}>
              <text x={x} y={rhythmY} textAnchor="middle" dominantBaseline="central" fontSize={15}>×</text>
              {bead.lyric && <text className="melody-line-lyric" x={x} y={lyricY} textAnchor="middle">{bead.lyric}</text>}
            </g>;
          }
          const y = yOf(bead.step);
          return <g key={bead.index} className={`melody-line-bead${played ? " is-played" : ""}${active ? " is-active" : ""}${dim ? " is-dim" : ""}`}>
            {active && <circle className="melody-line-ring" cx={x} cy={y} r={9} />}
            <circle className="melody-line-dot" cx={x} cy={y} r={5.5} />
            {bead.index === peaks.top && <g className="melody-line-peak">
              <path d={`M${x} ${y - 27}v-13l9 3.4-9 3.4`} />
              <text x={x + 12} y={y - 33} dominantBaseline="central">最高音</text>
            </g>}
            {bead.index === peaks.bottom && <text className="melody-line-valley" x={x + 11} y={y + 3} dominantBaseline="central">最低音</text>}
            <Degree className="melody-line-digit" x={x} y={y - 16} degree={bead.degree} octave={bead.octave} size={12} />
            {bead.lyric && <text className="melody-line-lyric" x={x} y={lyricY} textAnchor="middle">{bead.lyric}</text>}
          </g>;
        })}
        <g ref={(el) => { orbRefs.current[rowIndex] = el; }} className="melody-line-orb" style={{ opacity: 0 }}>
          <circle r={17} className="melody-line-orb-halo" filter={`url(#${glowId})`} />
          {/* A swallow, nose to the right. */}
          <path className="melody-line-bird-tail" d="M-7 .5L-19-5.5-13.5 .5-19 6.5Z" />
          <path className="melody-line-bird-wing is-far" d="M1-1.5C-1-9-6-13-11-13-8-9-6-5-4-.5Z" />
          <path className="melody-line-bird-body" d="M-9 .5C-5-5 5-5.5 11-1.5 12.5-.8 14-.6 15.5-.5 14 .3 12.5 .9 11 1.6 6 5-4 5-9 .5Z" />
          <path className="melody-line-bird-belly" d="M-5 2.2C0 4.6 6 4.2 10 1.8 6 2.6 0 3-5 2.2Z" />
          <circle className="melody-line-bird-throat" cx={7.8} cy={1.7} r={1.25} />
          <circle className="melody-line-bird-eye" cx={9.2} cy={-1.6} r={0.9} />
          <path className="melody-line-bird-wing" d="M2-1C1-11-5-17-12-18-8-13-6-7-5 0Z" />
        </g>
      </svg>;
    })}
  </div>;
}
