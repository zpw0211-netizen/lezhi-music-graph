import type { MelodyNote } from "./jianpu";

const KEY_NAMES = ["C", "♭D", "D", "♭E", "E", "F", "♯F", "G", "♭A", "A", "♭B", "B"] as const;

export const VOCAL_RATES = [0.75, 0.85, 1] as const;
export type VocalRate = (typeof VOCAL_RATES)[number];

/** 移调后的调号显示：原调保留教材写法，移调后给出新调名与半音差。 */
export function transposedKeyLabel(originalKey: string, tonicMidi: number, shift: number): string {
  if (!shift) return originalKey;
  const pc = (((tonicMidi + shift) % 12) + 12) % 12;
  const sign = shift > 0 ? `+${shift}` : `${shift}`;
  return `1=${KEY_NAMES[pc]}（${sign}半音）`;
}

/** 预备拍（1 小节）的拍数与每拍的四分音符时长。 */
export function countInBeatsOf(meter: string): { count: number; beatLen: number } {
  const match = meter.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return { count: 4, beatLen: 1 };
  const top = Math.max(1, Math.min(12, Number(match[1])));
  const bottom = Number(match[2]);
  if (bottom === 8) return { count: top, beatLen: 0.5 };
  if (bottom === 2) return { count: top, beatLen: 2 };
  return { count: top, beatLen: 4 / (bottom || 4) };
}

/** 每小节在主旋律中的起止拍（按四分音符计）。 */
export function barBeatSpans(bars: MelodyNote[][]): Array<{ start: number; end: number }> {
  const out: Array<{ start: number; end: number }> = [];
  let beat = 0;
  for (const bar of bars) {
    const start = beat;
    for (const note of bar) beat += note.b;
    out.push({ start, end: beat });
  }
  return out;
}

/** 规范化 A-B 小节循环范围（0-based 闭区间）。 */
export function normalizeLoopRange(startBar: number, endBar: number, barCount: number): { start: number; end: number } | null {
  if (barCount < 1) return null;
  const max = barCount - 1;
  const a = Math.max(0, Math.min(max, Math.round(startBar)));
  const b = Math.max(0, Math.min(max, Math.round(endBar)));
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}
