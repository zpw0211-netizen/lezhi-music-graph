// 人声演唱: pre-rendered singing (DiffSinger) for melodies with lyrics. The main line is sung by 绮萱 (child);
// lower choral parts by Ria/狸安 (male), so high and low parts are heard as women's and men's voices.
// Each recording is found by a fingerprint of the melody it was sung from, so a later edit
// to the notes or lyrics simply leaves that melody without a voice instead of out of step.
import type { Melody } from "./jianpu";
import manifest from "./vocal-manifest.json";

/**
 * FNV-1a over the melody's pitch, tempo, meter and notes (with lyrics). Drawing-only fields (dots) stay out.
 * `part` 1… is a further voice (melody.voices[part − 1]); its key also covers the main line, whose lyrics a
 * part without its own words borrows.
 */
export function vocalKey(melody: Melody, part = 0) {
  const bars = part ? [melody.voices?.[part - 1]?.bars, melody.bars] : melody.bars;
  const text = JSON.stringify([melody.tonicMidi, melody.bpm, melody.meter, bars], (key, value) => (key === "dots" ? undefined : value));
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export type Singer = "qixuan" | "ria";

export type Vocal = {
  file: string;
  /** Seconds into the file where the melody's beat `leadBeats` falls. */
  offset: number;
  /** Beats of the melody before the first sung note (intro, rests). */
  leadBeats: number;
  singer: Singer;
};

/** key → [offset, leadBeats] (绮萱) or [offset, leadBeats, "ria"]. */
const VOCALS = manifest as unknown as Record<string, [number, number, Singer?]>;

/** The recording for the main line (part 0) or a further voice (1…), if one was sung. */
export function findVocal(melody: Melody, part = 0): Vocal | null {
  if (part && !melody.voices?.[part - 1]) return null;
  const key = vocalKey(melody, part);
  const entry = VOCALS[key];
  return entry ? { file: `audio/vocal/${key}.mp3`, offset: entry[0], leadBeats: entry[1], singer: entry[2] ?? "qixuan" } : null;
}

const SINGER_NAMES: Record<Singer, string> = { qixuan: "绮萱", ria: "Ria（狸安）" };

/** Credit line naming the voice banks heard (Ria's terms ask for its name on every use). */
export function vocalCredit(singers: Singer[]) {
  const names = [...new Set(singers)].map((singer) => SINGER_NAMES[singer]);
  return `AI 合成 · ${names.join("、")} / DiffSinger`;
}
