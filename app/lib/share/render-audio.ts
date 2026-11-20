// 把作品离线合成成 WAV 文件下载：钢琴、木吉他和打击乐都用站内的采样，和网页上播放的声音一样。
// 只导出乐器音色；人声（绮萱、狸安）不导出，见声库条款。
import { midiOf, type Melody, type MelodyNote } from "../lesson/jianpu";
import { loadInstrumentSampler, playInstrumentSample, type InstrumentId, type InstrumentSampler, type PartColor } from "../lesson/instrument-sampler";
import { loadPercussionStrokes, type PercussionKind } from "../lesson/percussion";
import { softOutput, voiceBus } from "../lesson/percussion-mix";

export type RenderNote =
  | { instrument: InstrumentId; midi: number; at: number; length: number; level?: number; pan?: number }
  /** voice：同一行的击打共用一个通道（锣、镲在下一击前收住余音）。 */
  | { percussion: PercussionKind; at: number; level?: number; voice?: number };

const RATE = 44100;

/** Melody（主旋律加各声部）按时间排成要演奏的音：主旋律钢琴，其他声部按 colors 或木吉他。 */
export function melodyNotes(melody: Melody, colors?: Array<PartColor | undefined>, tempo = melody.bpm): RenderNote[] {
  const beat = 60 / tempo;
  const lines: MelodyNote[][] = [melody.bars.flat(), ...(melody.voices ?? []).map((voice) => voice.bars.flat())];
  const notes: RenderNote[] = [];
  lines.forEach((line, part) => {
    const color = colors?.[part];
    const instrument: InstrumentId = color?.timbre ?? (part === 0 ? "piano" : "guitar");
    const level = (color?.level ?? 1) * (part === 0 ? 1 : 0.7);
    let t = 0;
    line.forEach((note, index) => {
      if (note.d > 0 && note.d !== 9 && !note.tie) {
        let length = note.b;
        for (let k = index + 1; k < line.length && line[k].tie; k += 1) length += line[k].b;
        notes.push({ instrument, midi: midiOf(melody, note), at: t * beat, length: length * beat, level, pan: color?.pan });
      }
      t += note.b;
    });
  });
  return notes;
}

/** 合成后一共多少秒（最后一个音之后留一点余音）。 */
export function renderLength(notes: RenderNote[]) {
  return Math.max(1, ...notes.map((note) => note.at + ("length" in note ? note.length : 1.5))) + 1.2;
}

export async function renderToWav(notes: RenderNote[]): Promise<Blob> {
  const seconds = Math.min(600, renderLength(notes));
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * RATE), RATE);
  // 采样载入、播放函数都只用到 BaseAudioContext 的能力，离线环境同样可用。
  const live = ctx as unknown as AudioContext;
  const instruments = [...new Set(notes.flatMap((note) => ("instrument" in note ? [note.instrument] : [])))];
  const samplers = new Map<InstrumentId, InstrumentSampler>();
  await Promise.all(instruments.map(async (id) => { samplers.set(id, await loadInstrumentSampler(live, id)); }));
  if (notes.some((note) => "percussion" in note)) await loadPercussionStrokes(ctx);

  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  const lead = 0.15;
  // 打击乐走和节奏创编一样的混音通道，按时间先后敲。
  const buses = new Map<string, ReturnType<typeof voiceBus>>();
  const strokes = notes.filter((note): note is Extract<RenderNote, { percussion: PercussionKind }> => "percussion" in note).sort((a, b) => a.at - b.at);
  for (const note of strokes) {
    const key = `${note.voice ?? 0}:${note.percussion}`;
    if (!buses.has(key)) buses.set(key, voiceBus(live, softOutput(live), note.percussion));
    buses.get(key)!.hit(lead + note.at, note.level ?? 1);
  }
  for (const note of notes) {
    if ("percussion" in note) continue;
    let out: AudioNode = master;
    if (note.pan) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = note.pan;
      panner.connect(master);
      out = panner;
    }
    playInstrumentSample(live, note.instrument, samplers.get(note.instrument)!, note.midi, lead + note.at, note.length, out, note.level ?? 0.9);
  }
  const buffer = await ctx.startRendering();
  return wavBlob(buffer);
}

/** 16 位立体声 WAV，峰值归一到 −1 dB。 */
function wavBlob(buffer: AudioBuffer) {
  const channels = [buffer.getChannelData(0), buffer.getChannelData(1)];
  let peak = 0;
  for (const data of channels) for (let i = 0; i < data.length; i += 1) peak = Math.max(peak, Math.abs(data[i]));
  const gain = peak > 0 ? 0.89 / peak : 1;
  const frames = buffer.length;
  const bytes = new DataView(new ArrayBuffer(44 + frames * 4));
  const text = (at: number, value: string) => { for (let i = 0; i < value.length; i += 1) bytes.setUint8(at + i, value.charCodeAt(i)); };
  text(0, "RIFF"); bytes.setUint32(4, 36 + frames * 4, true); text(8, "WAVE");
  text(12, "fmt "); bytes.setUint32(16, 16, true); bytes.setUint16(20, 1, true); bytes.setUint16(22, 2, true);
  bytes.setUint32(24, RATE, true); bytes.setUint32(28, RATE * 4, true); bytes.setUint16(32, 4, true); bytes.setUint16(34, 16, true);
  text(36, "data"); bytes.setUint32(40, frames * 4, true);
  let at = 44;
  for (let i = 0; i < frames; i += 1) {
    for (const data of channels) {
      const value = Math.max(-1, Math.min(1, data[i] * gain));
      bytes.setInt16(at, Math.round(value * 32767), true);
      at += 2;
    }
  }
  return new Blob([bytes.buffer], { type: "audio/wav" });
}

/** 让浏览器把文件存下来。文件名去掉不能用的字符。 */
export function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name.replace(/[\\/:*?"<>|]/g, "").trim() || "芽谱作品";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
