"use client";

import type { CSSProperties } from "react";
import { tokenKey, type Meter, type RhythmBar, type RhythmPattern, type RhythmToken } from "../../lib/rhythm/patterns";
import type { Verdict } from "../../lib/rhythm/scoring";

const VERDICT_LABEL: Record<Verdict, string> = { good: "准", early: "早", late: "晚", miss: "漏" };

function Token({ token, active, mark }: { token: RhythmToken; active: boolean; mark?: Verdict }) {
  return (
    <span className={`rhythm-token${active ? " is-playing" : ""}${token.g === "–" ? " is-hold" : ""}${mark ? ` is-${mark}` : ""}`}>
      <span className="rhythm-glyph">{token.g}{token.dot && <span className="rhythm-dot">·</span>}</span>
      <span className="rhythm-lines" aria-hidden="true">
        {Array.from({ length: token.lines ?? 0 }, (_, i) => <i key={i} />)}
      </span>
      {mark && <span className="rhythm-mark">{VERDICT_LABEL[mark]}</span>}
    </span>
  );
}

export function PatternGlyph({ pattern, activeKey, marks, groupIndex }: {
  pattern: RhythmPattern;
  activeKey?: string | null;
  marks?: Map<string, Verdict>;
  groupIndex?: number;
}) {
  return (
    <span className={`rhythm-group${pattern.triplet ? " is-triplet" : ""}`}>
      {pattern.triplet && <span className="rhythm-triplet-mark" aria-hidden="true">3</span>}
      {pattern.tokens.map((token, i) => {
        const key = groupIndex === undefined ? "" : tokenKey(groupIndex, i);
        return <Token key={i} token={token} active={!!key && key === activeKey} mark={key ? marks?.get(key) : undefined} />;
      })}
    </span>
  );
}

/** The X-notation score, as a line of bars or as one big card per pattern. */
export function RhythmScore({ bars, meter, cards, activeKey, marks, countdown, selected, onSelect }: {
  bars: RhythmBar[];
  meter: Meter;
  cards: boolean;
  activeKey: string | null;
  marks?: Map<string, Verdict>;
  countdown: number | null;
  /** Edit mode: the selected group, and a handler that makes groups clickable. */
  selected?: number | null;
  onSelect?: (index: number) => void;
}) {
  return (
    <div className={`rhythm-score${cards ? " is-cards" : ""}`} aria-label="节奏谱">
      <span className="rhythm-meter" aria-label={`${meter.id} 拍`}><span>{meter.top}</span><span>{meter.bottom}</span></span>
      {/* Big cards keep whole bars per row: two short bars, or one bar of four beats. */}
      <div className="rhythm-bars" style={cards ? { "--bars-per-row": meter.beats >= 4 ? 1 : 2 } as CSSProperties : undefined}>
        {bars.map((bar, barIndex) => (
          <div className="rhythm-bar" key={barIndex}>
            {bar.groups.map(({ index, pattern }) => {
              const playingHere = !!activeKey && activeKey.startsWith(`${index}:`);
              const glyph = <PatternGlyph pattern={pattern} activeKey={activeKey} marks={marks} groupIndex={index} />;
              return onSelect ? (
                <button
                  key={index}
                  type="button"
                  className={`rhythm-placed${selected === index ? " is-selected" : ""}${playingHere ? " is-current" : ""}`}
                  aria-pressed={selected === index}
                  aria-label={`${pattern.name}，点选后可删除或在后面插入`}
                  onClick={() => onSelect(index)}
                >{glyph}</button>
              ) : (
                <span key={index} className={`rhythm-cell${playingHere ? " is-current" : ""}`}>{glyph}</span>
              );
            })}
            {Array.from({ length: Math.round(bar.empty / meter.unit) }, (_, i) => <span key={`e${i}`} className={`rhythm-empty${meter.unit < 1 ? " is-eighth" : ""}`} aria-label="空拍" />)}
            <span className={`rhythm-barline${barIndex === bars.length - 1 ? " is-final" : ""}`} aria-hidden="true" />
          </div>
        ))}
      </div>
      {countdown !== null && <div className="rhythm-countdown" role="status">预备 {countdown}</div>}
    </div>
  );
}
