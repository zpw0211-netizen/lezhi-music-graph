import type { Melody, MelodyNote } from "../../lib/lesson/jianpu";

/** 旋律变奏：一条主题，用几种手法变出新的旋律。音高用首调唱名（1=C），时值按四分音符计。 */
export type VaryNote = { d: number; o: number; b: number; tie?: boolean };
export type VaryMeter = "2/4" | "3/4" | "4/4";
export type Tune = { meter: VaryMeter; bars: VaryNote[][] };
export type Theme = Tune & { id: string; title: string; source: string };

const n = (d: number, b = 1, o = 0): VaryNote => ({ d, o, b });
export const beatsOf = (meter: VaryMeter) => Number(meter[0]);
export const isVaryMeter = (meter: string): meter is VaryMeter => meter === "2/4" || meter === "3/4" || meter === "4/4";

/** 示例主题由芽谱编写，不是课本里的曲子。 */
export const SAMPLE_THEMES: Theme[] = [
  { id: "sample-a", title: "示例主题一", source: "芽谱编写的示例", meter: "2/4", bars: [
    [n(5), n(3)], [n(5), n(6)], [n(5), n(3)], [n(2, 2)], [n(3), n(5)], [n(6), n(5)], [n(3), n(2)], [n(1, 2)],
  ] },
  { id: "sample-b", title: "示例主题二", source: "芽谱编写的示例", meter: "3/4", bars: [
    [n(3, 2), n(5)], [n(6, 2), n(5)], [n(3, 2), n(2)], [n(1, 3)], [n(2, 2), n(3)], [n(5, 2), n(6)], [n(5), n(3), n(2)], [n(1, 3)],
  ] },
  { id: "sample-c", title: "示例主题三", source: "芽谱编写的示例", meter: "4/4", bars: [
    [n(1), n(3), n(2), n(4)], [n(3), n(5), n(4), n(2)], [n(3), n(1), n(2), n(7, 1, -1)], [n(1, 4)],
  ] },
];

/** 主题里没有 fa 和 si 时按五声音阶走，经过音不会冒出主题里没有的音。 */
type Scale = number[];
const PENTATONIC: Scale = [1, 2, 3, 5, 6];
const DIATONIC: Scale = [1, 2, 3, 4, 5, 6, 7];
export const scaleOf = (bars: VaryNote[][]): Scale => (bars.flat().some((note) => note.d === 4 || note.d === 7) ? DIATONIC : PENTATONIC);
const indexOf = (note: VaryNote, scale: Scale) => scale.indexOf(note.d) + scale.length * note.o;
function noteAt(index: number, scale: Scale, b: number): VaryNote {
  const size = scale.length;
  return { d: scale[((index % size) + size) % size], o: Math.floor(index / size), b };
}
/** 音域：低音 sol 到高音 mi。超出时整体挪一个八度。 */
function keepInRange(notes: VaryNote[], scale: Scale): VaryNote[] {
  const size = scale.length;
  const low = scale.indexOf(5) - size;
  const high = scale.indexOf(3) + size;
  const used = notes.filter((note) => note.d).map((note) => indexOf(note, scale));
  if (!used.length) return notes;
  let shift = 0;
  while (Math.max(...used) + shift > high) shift -= size;
  while (Math.min(...used) + shift < low) shift += size;
  return shift ? notes.map((note) => (note.d ? { ...note, o: note.o + shift / size } : note)) : notes;
}

const REPRESENTABLE = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25];
/** 把一个时值拆成能写出来的几段（如 2.5 拍 = 2 拍连 0.5 拍）。 */
function pieces(b: number): number[] {
  const out: number[] = [];
  let rest = b;
  while (rest > 1e-6) {
    const part = REPRESENTABLE.find((value) => value <= rest + 1e-6);
    if (!part) break;
    out.push(part);
    rest -= part;
  }
  return out;
}
/** 把一串音重新分进小节；跨小节的音拆开用连音线连起来，末尾不满的小节补休止。 */
export function rebar(notes: VaryNote[], meter: VaryMeter): VaryNote[][] {
  const beats = beatsOf(meter);
  const bars: VaryNote[][] = [[]];
  let room = beats;
  const push = (note: VaryNote) => {
    if (room < 1e-6) { bars.push([]); room = beats; }
    bars[bars.length - 1].push(note);
    room -= note.b;
  };
  for (const note of notes) {
    let left = note.b;
    let first = !note.tie;
    while (left > 1e-6) {
      if (room < 1e-6) { bars.push([]); room = beats; }
      const take = Math.min(left, room);
      for (const part of pieces(take)) {
        push({ d: note.d, o: note.o, b: part, ...(note.d && !first ? { tie: true } : {}) });
        first = false;
      }
      left -= take;
    }
  }
  if (room > 1e-6 && room < beats) for (const part of pieces(room)) push({ d: 0, o: 0, b: part });
  return bars.filter((bar) => bar.length);
}

/** 连音线连着的几段先合成一个音，变完再重新分小节。 */
function flatten(bars: VaryNote[][]): VaryNote[] {
  const out: VaryNote[] = [];
  for (const note of bars.flat()) {
    const last = out[out.length - 1];
    if (note.tie && last && last.d === note.d && last.o === note.o) last.b += note.b;
    else out.push({ d: note.d, o: note.o, b: note.b });
  }
  return out;
}

const SEMITONE = [0, 0, 2, 4, 5, 7, 9, 11];
export function midiOf(note: Pick<VaryNote, "d" | "o">) { return 60 + SEMITONE[note.d] + 12 * note.o; }

export type TechniqueId = "ornament" | "skeleton" | "dotted" | "augment" | "diminish" | "invert" | "retrograde" | "higher" | "lower" | "mode" | "waltz";
export type Technique = { id: TechniqueId; label: string; caption: string; group: "节奏" | "音高" | "装饰" };
export const TECHNIQUES: Technique[] = [
  { id: "ornament", label: "加花", caption: "在长一点的音后面添上邻近的音，旋律变得热闹", group: "装饰" },
  { id: "skeleton", label: "抽骨干", caption: "每拍只留拍头的那个音，旋律变得简洁", group: "装饰" },
  { id: "dotted", label: "附点节奏", caption: "两个一样长的音改成前长后短，变得有弹性", group: "节奏" },
  { id: "augment", label: "拉宽", caption: "每个音都拉长一倍，变得舒展", group: "节奏" },
  { id: "diminish", label: "紧缩", caption: "每个音都缩短一半，变得紧凑", group: "节奏" },
  { id: "waltz", label: "换成三拍子", caption: "每小节加一拍，从走路变成转圈", group: "节奏" },
  { id: "invert", label: "倒影", caption: "往上走的地方改成往下走，像照镜子", group: "音高" },
  { id: "retrograde", label: "逆行", caption: "从最后一个音倒着走回第一个音", group: "音高" },
  { id: "higher", label: "高八度", caption: "整条旋律搬到高处，变得明亮", group: "音高" },
  { id: "lower", label: "低八度", caption: "整条旋律搬到低处，变得厚实", group: "音高" },
  { id: "mode", label: "换调式", caption: "每个音都往下挪一位，起伏还在，色彩变了", group: "音高" },
];
export const TECHNIQUE_BY_ID = new Map(TECHNIQUES.map((item) => [item.id, item]));

function mapPitch(tune: Tune, change: (index: number) => number, clamp = true): Tune {
  const scale = scaleOf(tune.bars);
  const flat = tune.bars.flat().map((note) => (note.d ? { ...noteAt(change(indexOf(note, scale)), scale, note.b), ...(note.tie ? { tie: true } : {}) } : note));
  const fitted = clamp ? keepInRange(flat, scale) : flat;
  let k = 0;
  return { meter: tune.meter, bars: tune.bars.map((bar) => bar.map(() => fitted[k++])) };
}

function ornament(tune: Tune): Tune {
  const scale = scaleOf(tune.bars);
  const flat = tune.bars.map((bar) => bar.map((note) => ({ ...note })));
  const all = flat.flat();
  const nextPitch = (from: number) => all.slice(from + 1).find((note) => note.d && !note.tie);
  let at = -1;
  const bars = flat.map((bar) => bar.flatMap((note) => {
    at += 1;
    const following = all[at + 1];
    // 休止、连着的音、已经很短的音、全曲最后一个音不动。
    if (!note.d || note.tie || following?.tie || note.b < 1 || !nextPitch(at)) return [note];
    const here = indexOf(note, scale);
    const gap = indexOf(nextPitch(at)!, scale) - here;
    if (note.b === 1) {
      // 下一个音隔得远：添一个经过音；紧挨着：先往反方向绕一下；同一个音：添上方的邻音。
      const second = Math.abs(gap) >= 2 ? here + Math.sign(gap) : gap === 0 ? here + 1 : here - gap;
      return [noteAt(here, scale, 0.5), noteAt(second, scale, 0.5)];
    }
    if (note.b === 2) return [noteAt(here, scale, 1), noteAt(here + 1, scale, 0.5), noteAt(here, scale, 0.5)];
    if (note.b === 3) return [noteAt(here, scale, 2), noteAt(here + 1, scale, 0.5), noteAt(here, scale, 0.5)];
    return [note];
  }));
  return { meter: tune.meter, bars };
}

function skeleton(tune: Tune): Tune {
  const beats = beatsOf(tune.meter);
  const bars = tune.bars.map((bar) => {
    const heads: Array<{ note: VaryNote; start: number }> = [];
    let start = 0;
    for (const note of bar) {
      if (Math.abs(start - Math.round(start)) < 1e-6) heads.push({ note, start: Math.round(start) });
      start += note.b;
    }
    if (!heads.length) return bar;
    return heads.flatMap((head, k) => {
      const length = (heads[k + 1]?.start ?? beats) - head.start;
      return pieces(length).map((part, j) => ({ d: head.note.d, o: head.note.o, b: part, ...(head.note.d && (j > 0 || (k === 0 && head.note.tie)) ? { tie: true } : {}) }));
    });
  });
  return { meter: tune.meter, bars };
}

function dotted(tune: Tune): Tune {
  const bars = tune.bars.map((bar) => {
    const out: VaryNote[] = [];
    let start = 0;
    for (let k = 0; k < bar.length; k += 1) {
      const a = bar[k];
      const b = bar[k + 1];
      const pair = b && a.d && b.d && !a.tie && !b.tie && !bar[k + 2]?.tie && a.b === b.b && Math.abs(start % (a.b * 2)) < 1e-6 && (a.b === 1 || a.b === 0.5);
      if (pair) {
        out.push({ ...a, b: a.b * 1.5 }, { ...b, b: b.b * 0.5 });
        start += a.b * 2;
        k += 1;
      } else {
        out.push(a);
        start += a.b;
      }
    }
    return out;
  });
  return { meter: tune.meter, bars };
}

const scaleTime = (tune: Tune, factor: number): Tune => ({ meter: tune.meter, bars: rebar(flatten(tune.bars).map((note) => ({ ...note, b: note.b * factor })), tune.meter) });

function waltz(tune: Tune): Tune {
  if (tune.meter !== "2/4") return tune;
  const bars = tune.bars.map((bar) => {
    const firstBeat: VaryNote[] = [];
    let sum = 0;
    for (const note of bar) { if (sum >= 1 - 1e-6) break; firstBeat.push(note); sum += note.b; }
    // 第一拍正好是完整的一拍：把这一拍拉成两拍。
    if (Math.abs(sum - 1) < 1e-6 && firstBeat.every((note) => !note.tie)) {
      return [...firstBeat.map((note) => ({ ...note, b: note.b * 2 })), ...bar.slice(firstBeat.length)];
    }
    const total = bar.reduce((s, note) => s + note.b, 0);
    if (bar.length === 1) return pieces(total + 1).map((part, j) => ({ ...bar[0], b: part, ...(bar[0].d && (j > 0 || bar[0].tie) ? { tie: true } : {}) }));
    const last = bar[bar.length - 1];
    return [...bar, { d: last.d, o: last.o, b: 1, ...(last.d ? { tie: true } : {}) }];
  });
  return { meter: "3/4", bars };
}

export function applicable(id: TechniqueId, tune: Tune): string | null {
  const flat = tune.bars.flat();
  if (id === "waltz" && tune.meter !== "2/4") return "只有二拍子的旋律能换成三拍子";
  if (id === "diminish" && flat.some((note) => note.b < 0.5)) return "已经有十六分音符了，再缩就太碎了";
  if (id === "augment" && tune.bars.length > 16) return "已经很长了，不再拉宽";
  if (id === "ornament" && !flat.some((note) => note.d && note.b >= 1)) return "音已经很密了，没有地方再加花";
  const pitches = flat.filter((note) => note.d).map(midiOf);
  if (id === "higher" && Math.max(...pitches) + 12 > 88) return "已经很高了，再高就不好听了";
  if (id === "lower" && Math.min(...pitches) - 12 < 48) return "已经很低了，再低就听不清了";
  const after = run(id, tune);
  if (after.meter === tune.meter && JSON.stringify(after.bars) === JSON.stringify(tune.bars)) return "这条旋律用这个手法不会有变化";
  return null;
}

export const applyTechnique = (id: TechniqueId, tune: Tune): Tune => (applicable(id, tune) ? tune : run(id, tune));

function run(id: TechniqueId, tune: Tune): Tune {
  switch (id) {
    case "ornament": return ornament(tune);
    case "skeleton": return skeleton(tune);
    case "dotted": return dotted(tune);
    case "augment": return scaleTime(tune, 2);
    case "diminish": return scaleTime(tune, 0.5);
    case "waltz": return waltz(tune);
    case "invert": {
      const scale = scaleOf(tune.bars);
      const first = tune.bars.flat().find((note) => note.d);
      if (!first) return tune;
      const axis = indexOf(first, scale);
      return mapPitch(tune, (index) => 2 * axis - index);
    }
    case "retrograde": return { meter: tune.meter, bars: rebar(flatten(tune.bars).reverse(), tune.meter) };
    case "higher": return mapPitch(tune, (index) => index + scaleOf(tune.bars).length, false);
    case "lower": return mapPitch(tune, (index) => index - scaleOf(tune.bars).length, false);
    case "mode": return mapPitch(tune, (index) => index - (scaleOf(tune.bars).length === 5 ? 1 : 2));
  }
}

export const applyAll = (theme: Tune, ids: TechniqueId[]) => ids.reduce((tune, id) => applyTechnique(id, tune), theme as Tune);

export const bpmOf = (meter: VaryMeter) => (meter === "3/4" ? 96 : 84);

export function toMelody(tune: Tune, title: string, source: string): Melody {
  return {
    ...(title ? { title } : {}), key: "1=C", tonic: "C", tonicMidi: 60, meter: tune.meter, bpm: bpmOf(tune.meter), source,
    bars: tune.bars.map((bar) => bar.map((note) => {
      const out: MelodyNote = { d: note.d, b: note.b };
      if (note.o) out.o = note.o;
      if (note.tie) out.tie = true;
      return out;
    })),
  };
}

/** 变奏和主题比一比：只说从谱面上数得出来的事。 */
export function compare(theme: Tune, variation: Tune): string[] {
  const sounding = (tune: Tune) => tune.bars.flat().filter((note) => note.d && !note.tie);
  const a = sounding(theme);
  const b = sounding(variation);
  const out: string[] = [];
  if (a.length !== b.length) out.push(`音符从 ${a.length} 个变成 ${b.length} 个`);
  if (theme.bars.length !== variation.bars.length) out.push(`小节从 ${theme.bars.length} 个变成 ${variation.bars.length} 个`);
  if (theme.meter !== variation.meter) out.push(`拍号从 ${theme.meter} 变成 ${variation.meter}`);
  const name = (note: VaryNote) => `${note.o > 0 ? "高音 " : note.o < 0 ? "低音 " : ""}${["", "do", "re", "mi", "fa", "sol", "la", "si"][note.d]}`;
  const top = (list: VaryNote[]) => list.reduce((best, note) => (midiOf(note) > midiOf(best) ? note : best), list[0]);
  const bottom = (list: VaryNote[]) => list.reduce((best, note) => (midiOf(note) < midiOf(best) ? note : best), list[0]);
  if (a.length && b.length) {
    if (midiOf(top(a)) !== midiOf(top(b))) out.push(`最高音从 ${name(top(a))} 变成 ${name(top(b))}`);
    if (midiOf(bottom(a)) !== midiOf(bottom(b))) out.push(`最低音从 ${name(bottom(a))} 变成 ${name(bottom(b))}`);
    const lastA = a[a.length - 1];
    const lastB = b[b.length - 1];
    if (lastA.d !== lastB.d) out.push(`结束音从 ${name(lastA)} 变成 ${name(lastB)}`);
  }
  if (!out.length) out.push("音符个数、小节数和最高最低音都没变，变的是节奏或走向");
  return out;
}
