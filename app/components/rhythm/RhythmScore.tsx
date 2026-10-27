"use client";

import type { CSSProperties } from "react";
import { tokenKey, type Meter, type RhythmBar, type RhythmPattern } from "../../lib/rhythm/patterns";
import { flagCount, flagGlyph, restGlyph } from "../lesson/StaffNotation";
import type { Verdict } from "../../lib/rhythm/scoring";

const VERDICT_LABEL: Record<Verdict, string> = { good: "准", early: "早", late: "晚", miss: "漏" };

// Patterns are drawn as note figures (heads, stems, beams, flags, rests) on a
// 20-units-per-em grid, so they scale with the score's font size like the old X glyphs.
const EM = 20;
const HEAD_Y = 33;
const STEM_TOP = 6;
const STEM_DX = 5.5;

type Figure = { rest: boolean; dur: number; base: number; dots: number; tokens: number[]; x: number; width: number };

/** Tokens → note figures: a dash ("–") lengthens the note before it (二分、附点二分、全音符). */
function figures(pattern: RhythmPattern): Figure[] {
  const list: Figure[] = [];
  pattern.tokens.forEach((token, index) => {
    const previous = list[list.length - 1];
    if (token.g === "–" && previous) { previous.dur += token.dur; previous.tokens.push(index); return; }
    list.push({ rest: token.g === "0", dur: token.dur, base: 0, dots: token.dot ? 1 : 0, tokens: [index], x: 0, width: 0 });
  });
  let x = 4;
  for (const figure of list) {
    const value = pattern.triplet ? figure.dur * 1.5 : figure.dur;
    figure.dots = figure.dots || [1.5, 3, 0.75, 0.375].some((dotted) => Math.abs(value - dotted) < 1e-6) ? 1 : 0;
    figure.base = figure.dots ? value / 1.5 : value;
    figure.width = 17 + 13 * Math.sqrt(figure.dur) + (figure.dots ? 5 : 0);
    figure.x = x + 7;
    x += figure.width;
  }
  return list;
}

export function PatternGlyph({ pattern, activeKey, marks, groupIndex }: {
  pattern: RhythmPattern;
  activeKey?: string | null;
  marks?: Map<string, Verdict>;
  groupIndex?: number;
}) {
  const notes = figures(pattern);
  const width = notes.reduce((sum, note) => sum + note.width, 0) + 6;
  const stemX = (note: Figure) => note.x + STEM_DX;
  // Beam every run of flagged notes; a pattern is one beat group.
  const runs: Figure[][] = [];
  let run: Figure[] = [];
  for (const note of notes) {
    if (!note.rest && flagCount(note.base) > 0) run.push(note);
    else { if (run.length > 1) runs.push(run); run = []; }
  }
  if (run.length > 1) runs.push(run);
  const beamed = new Set(runs.flat());
  const beams = runs.flatMap((group, r) => {
    const levels = Math.max(...group.map((note) => flagCount(note.base)));
    return Array.from({ length: levels }, (_, l) => {
      const level = l + 1;
      const y = STEM_TOP + l * 7;
      const shapes = [];
      for (let k = 0; k < group.length;) {
        if (flagCount(group[k].base) < level) { k += 1; continue; }
        let j = k;
        while (j + 1 < group.length && flagCount(group[j + 1].base) >= level) j += 1;
        let x1 = stemX(group[k]);
        let x2 = stemX(group[j]);
        if (j === k) {
          const left = k === group.length - 1 || (k > 0 && flagCount(group[k - 1].base) >= flagCount(group[k + 1]?.base ?? 0));
          if (left) x1 = x2 - 9; else x2 = x1 + 9;
        }
        shapes.push(<rect key={`b${r}-${level}-${k}`} x={x1} y={y} width={x2 - x1} height="4.6" fill="currentColor" />);
        k = j + 1;
      }
      return shapes;
    });
  });
  return (
    <span className={`rhythm-group${pattern.triplet ? " is-triplet" : ""}`}>
      {pattern.triplet && <span className="rhythm-triplet-mark" aria-hidden="true">3</span>}
      <svg className="rhythm-figures" viewBox={`0 0 ${width} 42`} style={{ width: `${width / EM}em`, height: `${42 / EM}em` }} role="img" aria-label={pattern.name}>
        {notes.map((note, n) => {
          const keys = groupIndex === undefined ? [] : note.tokens.map((token) => tokenKey(groupIndex, token));
          const active = !!activeKey && keys.includes(activeKey);
          const mark = keys.length ? marks?.get(keys[0]) : undefined;
          const parts = [];
          if (note.rest) {
            parts.push(<g key="r">{restGlyph(note.base, note.x, 2, false)}</g>);
            for (let d = 0; d < note.dots; d += 1) parts.push(<circle key={`d${d}`} cx={note.x + 9 + d * 4.5} cy={17} r="1.8" fill="currentColor" />);
          } else {
            const hollow = note.base >= 2;
            parts.push(hollow
              ? <g key="h" transform={`rotate(-20 ${note.x} ${HEAD_Y})`}><ellipse cx={note.x} cy={HEAD_Y} rx="5.9" ry="4.3" fill="currentColor" /><ellipse cx={note.x} cy={HEAD_Y} rx="3.8" ry="2.1" fill="var(--rhythm-paper, #fff)" /></g>
              : <ellipse key="h" cx={note.x} cy={HEAD_Y} rx="5.9" ry="4.2" transform={`rotate(-20 ${note.x} ${HEAD_Y})`} fill="currentColor" />);
            if (note.base < 4) {
              parts.push(<line key="s" x1={stemX(note)} x2={stemX(note)} y1={HEAD_Y - 1} y2={STEM_TOP} stroke="currentColor" strokeWidth="1.4" />);
              if (!beamed.has(note)) parts.push(...flagGlyph(stemX(note), STEM_TOP, true, flagCount(note.base)));
            }
            for (let d = 0; d < note.dots; d += 1) parts.push(<circle key={`d${d}`} cx={note.x + 10 + d * 4.5} cy={HEAD_Y - 1} r="1.8" fill="currentColor" />);
          }
          if (mark) parts.push(<text key="m" x={note.x} y={53} textAnchor="middle" className="rhythm-note-mark">{VERDICT_LABEL[mark]}</text>);
          return <g key={n} className={`rhythm-note${active ? " is-playing" : ""}${mark ? ` is-${mark}` : ""}`}>{parts}</g>;
        })}
        {beams.length > 0 && <g className={`rhythm-beams${runs.flat().some((note) => groupIndex !== undefined && note.tokens.some((token) => tokenKey(groupIndex, token) === activeKey)) ? " is-playing" : ""}`}>{beams}</g>}
      </svg>
    </span>
  );
}

/** The rhythm score, as a line of bars. */
export function RhythmScore({ bars, meter, activeKey, marks, countdown, selected, onSelect }: {
  bars: RhythmBar[];
  meter: Meter;
  activeKey: string | null;
  marks?: Map<string, Verdict>;
  countdown: number | null;
  /** Edit mode: the selected group, and a handler that makes groups clickable. */
  selected?: number | null;
  onSelect?: (index: number) => void;
}) {
  return (
    <div className={`rhythm-score`} aria-label="节奏谱">
      <span className="rhythm-meter" aria-label={`${meter.id} 拍`}><span>{meter.top}</span><span>{meter.bottom}</span></span>
      <div className="rhythm-bars" style={{ "--bar-beats": meter.beats } as CSSProperties}>
        {bars.map((bar, barIndex) => (
          <div className="rhythm-bar" key={barIndex}>
            {bar.groups.map(({ index, pattern }) => {
              const playingHere = !!activeKey && activeKey.startsWith(`${index}:`);
              const glyph = <PatternGlyph pattern={pattern} activeKey={activeKey} marks={marks} groupIndex={index} />;
              return onSelect ? (
                <button
                  key={index}
                  type="button"
                  style={{ flexGrow: pattern.beats }}
                  className={`rhythm-placed${selected === index ? " is-selected" : ""}${playingHere ? " is-current" : ""}`}
                  aria-pressed={selected === index}
                  aria-label={`${pattern.name}，点选后可删除或在后面插入`}
                  onClick={() => onSelect(index)}
                >{glyph}</button>
              ) : (
                <span key={index} style={{ flexGrow: pattern.beats }} className={`rhythm-cell${playingHere ? " is-current" : ""}`}>{glyph}</span>
              );
            })}
            {Array.from({ length: Math.round(bar.empty / meter.unit) }, (_, i) => <span key={`e${i}`} style={{ flexGrow: meter.unit }} className={`rhythm-empty${meter.unit < 1 ? " is-eighth" : ""}`} aria-label="空拍" />)}
            <span className={`rhythm-barline${barIndex === bars.length - 1 ? " is-final" : ""}`} aria-hidden="true" />
          </div>
        ))}
      </div>
      {countdown !== null && <div className="rhythm-countdown" role="status">预备 {countdown}</div>}
    </div>
  );
}
