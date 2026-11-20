// 轮唱与卡农：同一条旋律，几个声部一个接一个地晚几小节进入。这里把旋律排成多声部的 Melody，
// 交给分声部练习和播放器；再数一数各声部同时响的时候，哪些拍子挨得太近（二度、三全音）。
// 只用乐器音色（钢琴、木吉他），不用人声音库。
import type { PartColor } from "../../lib/lesson/instrument-sampler";
import { midiOf, type Melody, type MelodyNote } from "../../lib/lesson/jianpu";
import { beatsOf, type ComposeNote, type Meter } from "../compose/compose-model";
import { restsFor } from "./choir-compose";
import type { ChoirPiece } from "./choir-model";

export type CanonSource = { id: string; title: string; caption: string; meter: Meter; bpm: number; bars: MelodyNote[][]; entry: number };
export type CanonEnding = "each" | "together";
export type CanonSetup = { voices: number; entry: number; times: number; ending: CanonEnding };

/** 一个音：唱名、拍数、八度、歌词。 */
const n = (d: number, b: number, lyric?: string, o = 0): MelodyNote => ({ d, b, ...(o ? { o } : {}), ...(lyric ? { lyric } : {}) });
const words = (text: string, notes: MelodyNote[]) => { const chars = [...text]; let k = 0; return notes.map((note) => (note.d ? { ...note, lyric: chars[k++] } : note)); };

/** 传统轮唱曲（词曲都是民间流传的），轮唱时常用的进入方式。 */
export const CANON_SONGS: CanonSource[] = [
  {
    id: "tigers", title: "两只老虎", caption: "4/4 · 隔两小节进入", meter: "4/4", bpm: 104, entry: 2,
    bars: [
      words("两只老虎", [n(1, 1), n(2, 1), n(3, 1), n(1, 1)]),
      words("两只老虎", [n(1, 1), n(2, 1), n(3, 1), n(1, 1)]),
      words("跑得快", [n(3, 1), n(4, 1), n(5, 2)]),
      words("跑得快", [n(3, 1), n(4, 1), n(5, 2)]),
      words("一只没有眼睛", [n(5, 0.5), n(6, 0.5), n(5, 0.5), n(4, 0.5), n(3, 1), n(1, 1)]),
      words("一只没有尾巴", [n(5, 0.5), n(6, 0.5), n(5, 0.5), n(4, 0.5), n(3, 1), n(1, 1)]),
      words("真奇怪", [n(1, 1), n(5, 1, undefined, -1), n(1, 2)]),
      words("真奇怪", [n(1, 1), n(5, 1, undefined, -1), n(1, 2)]),
    ],
  },
  {
    id: "boat", title: "划小船", caption: "6/8 · 隔两小节进入", meter: "6/8", bpm: 84, entry: 2,
    bars: [
      words("划划", [n(1, 1.5), n(1, 1.5)]),
      words("划小船", [n(1, 1), n(2, 0.5), n(3, 1.5)]),
      words("轻轻荡过", [n(3, 1), n(2, 0.5), n(3, 1), n(4, 0.5)]),
      words("河", [n(5, 3)]),
      words("啦啦啦啦啦啦", [n(1, 0.5, undefined, 1), n(1, 0.5, undefined, 1), n(1, 0.5, undefined, 1), n(5, 0.5), n(5, 0.5), n(5, 0.5)]),
      words("啦啦啦啦啦啦", [n(3, 0.5), n(3, 0.5), n(3, 0.5), n(1, 0.5), n(1, 0.5), n(1, 0.5)]),
      words("生活像个", [n(5, 1), n(4, 0.5), n(3, 1), n(2, 0.5)]),
      words("梦", [n(1, 3)]),
    ],
  },
];

/** 旋律创编里存下的作品也能拿来轮唱：只取写满的小节。 */
export function workAsCanon(work: { id: string; title: string; meter: Meter; bars: ComposeNote[][]; lyrics: string }): CanonSource | null {
  const beats = beatsOf(work.meter);
  const bars = work.bars.filter((bar) => Math.abs(bar.reduce((sum, note) => sum + note.b, 0) - beats) < 1e-6);
  if (bars.length < 2 || bars.length !== work.bars.length) return null;
  const chars = [...work.lyrics.replace(/[\s，。、！？；：,.!?;:“”"'‘’（）()《》—-]/g, "")];
  let k = 0;
  return {
    id: `work:${work.id}`, title: work.title || "我的旋律", caption: `我写的 · ${work.meter}`, meter: work.meter,
    bpm: work.meter === "3/4" ? 92 : work.meter.endsWith("/8") ? 84 : 96, entry: bars.length >= 8 ? 2 : 1,
    bars: bars.map((bar) => bar.map((note) => ({ d: note.d, b: note.b, ...(note.o ? { o: note.o } : {}), ...(note.d && chars[k] ? { lyric: chars[k++] } : {}) }))),
  };
}

/** 能选的进入间隔：比整条旋律短。 */
export const entriesFor = (source: CanonSource) => [1, 2, 4].filter((entry) => entry < source.bars.length);
/** 最多几个声部：最后一个声部进来时，第一个声部还在唱。 */
export const maxVoicesFor = (source: CanonSource, entry: number) => Math.max(2, Math.min(4, Math.ceil(source.bars.length / entry)));

const VOICE_NAMES = ["第一声部", "第二声部", "第三声部", "第四声部"];
/** 各声部的乐器：钢琴、木吉他交替，左右分开，第三、四声部轻一点。 */
export const CANON_COLORS: PartColor[] = [
  { timbre: "piano", pan: -0.35, level: 1 },
  { timbre: "guitar", pan: 0.35, level: 1.1 },
  { timbre: "piano", pan: 0.15, level: 0.8 },
  { timbre: "guitar", pan: -0.15, level: 0.9 },
];

export type CanonLayout = {
  melody: Melody;
  /** 每个声部每一小节唱的是旋律的第几句（按进入间隔分句，从 0 数），null 是休止。 */
  grid: Array<Array<number | null>>;
  totalBars: number;
};

export function buildCanon(source: CanonSource, setup: CanonSetup): CanonLayout {
  const beats = beatsOf(source.meter);
  const line = Array.from({ length: setup.times }, () => source.bars).flat();
  const total = setup.ending === "each" ? line.length + (setup.voices - 1) * setup.entry : line.length;
  const rest = () => restsFor(0, beats, source.meter);
  const grid: CanonLayout["grid"] = [];
  const lines = Array.from({ length: setup.voices }, (_, k) => {
    const start = k * setup.entry;
    const bars: MelodyNote[][] = [];
    const row: Array<number | null> = [];
    for (let bar = 0; bar < total; bar += 1) {
      const at = bar - start;
      if (at >= 0 && at < line.length) {
        bars.push(line[at].map((note) => ({ ...note })));
        row.push(Math.floor((at % source.bars.length) / setup.entry));
      } else {
        bars.push(rest());
        row.push(null);
      }
    }
    // 一起停：后进来的声部唱到第一声部结束就收住。
    grid.push(row);
    return bars;
  });
  const melody: Melody = {
    title: `${source.title} · ${setup.voices} 部轮唱`, key: "1=C", tonic: "C", tonicMidi: 60, meter: source.meter, bpm: source.bpm,
    source: "轮唱", bars: lines[0], label: VOICE_NAMES[0],
    voices: lines.slice(1).map((bars, k) => ({ label: VOICE_NAMES[k + 1], bars })),
    staff: lines.map(() => ({ clef: "treble" as const, octave: 0 })),
  };
  return { melody, grid, totalBars: total };
}

export function canonPiece(source: CanonSource, setup: CanonSetup, layout: CanonLayout): ChoirPiece {
  const labels = VOICE_NAMES.slice(0, setup.voices);
  return {
    id: `canon|${source.id}|${JSON.stringify(source.bars).length}|${setup.voices}|${setup.entry}|${setup.times}|${setup.ending}`,
    bookKey: "canon", bookName: "轮唱", work: source.title, melody: layout.melody, labels,
    parts: labels.map((label, index) => ({ index, label, sung: false })),
    colors: CANON_COLORS.slice(0, setup.voices),
  };
}

/** 每半拍看一次：几个声部同时响时，有没有两个音挨得太近（小二度、大二度、三全音及其转位）。 */
export function canonHarmony(layout: CanonLayout): { together: number; clash: number; clashBars: number[] } {
  const { melody } = layout;
  const beats = beatsOf(melody.meter as Meter);
  const lines = [melody.bars, ...(melody.voices ?? []).map((voice) => voice.bars)];
  const pitchAt = (bars: MelodyNote[][], time: number) => {
    const index = Math.floor(time / beats + 1e-9);
    let at = index * beats;
    for (const note of bars[index] ?? []) {
      if (time >= at - 1e-9 && time < at + note.b - 1e-9) return note.d >= 1 && note.d <= 7 ? midiOf(melody, note) : null;
      at += note.b;
    }
    return null;
  };
  let together = 0;
  let clash = 0;
  const clashBars = new Set<number>();
  for (let time = 0; time < layout.totalBars * beats - 1e-9; time += 0.5) {
    const sounding = lines.map((bars) => pitchAt(bars, time)).filter((pitch): pitch is number => pitch !== null);
    if (sounding.length < 2) continue;
    together += 1;
    const rough = sounding.some((a, i) => sounding.some((b, j) => j > i && [1, 2, 6, 10, 11].includes(Math.abs(a - b) % 12)));
    if (rough) { clash += 1; clashBars.add(Math.floor(time / beats + 1e-9)); }
  }
  return { together, clash, clashBars: [...clashBars] };
}
