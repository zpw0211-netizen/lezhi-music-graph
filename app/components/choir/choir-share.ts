// 自编合唱 ⇄ 分享链接里的数据：名字、作者、拍号、每个声部的音和词。解码时检查音域和每小节的拍数。
import { cleanText, decodeBars, encodeBars, encodePayload, oneOf } from "../../lib/share/share-codec";
import { barBeats, beatsOf, midiOfNote, type ComposeNote } from "../compose/compose-model";
import { CHOIR_BAR_COUNTS, CHOIR_METERS, ENSEMBLES, VOICES, type ChoirWork } from "./choir-compose";

export function encodeChoir(work: ChoirWork) {
  return encodePayload({ k: "h", n: work.title.trim(), a: work.author.trim(), m: work.meter, r: work.rows.map(encodeBars), w: work.words });
}

export function decodeChoir(data: Record<string, unknown> | null): ChoirWork | null {
  if (!data || data.k !== "h" || !Array.isArray(data.r) || !Array.isArray(data.w)) return null;
  const meter = oneOf(data.m, CHOIR_METERS);
  const voices = ENSEMBLES.duet.voices;
  if (!meter || data.r.length !== voices.length) return null;
  const beats = beatsOf(meter);
  const words = data.w as unknown[];
  const rows: ComposeNote[][][] = [];
  for (const [index, text] of data.r.entries()) {
    const bars = decodeBars(text, 8);
    if (!bars || !CHOIR_BAR_COUNTS.includes(bars.length) || (rows[0] && rows[0].length !== bars.length)) return null;
    const { low, high } = VOICES[voices[index]];
    for (const bar of bars) {
      if (barBeats(bar) > beats + 1e-6) return null;
      if (bar.some((note) => note.d > 7 || (note.d > 0 && (midiOfNote(note) < low || midiOfNote(note) > high)))) return null;
    }
    rows.push(bars.map((bar) => bar.map((note) => ({ d: note.d, o: note.d ? note.o : 0, b: note.b }))));
  }
  return {
    id: "draft", title: cleanText(data.n, 16), author: cleanText(data.a, 12), ensemble: "duet", meter, rows,
    words: voices.map((_, index) => cleanText(words[index], 80)), savedAt: 0,
  };
}
