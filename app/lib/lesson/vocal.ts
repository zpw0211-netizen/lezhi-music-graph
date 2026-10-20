// 人声演唱: pre-rendered singing (DiffSinger, voice bank 绮萱) for melodies with lyrics.
// Each recording is found by a fingerprint of the melody it was sung from, so a later edit
// to the notes or lyrics simply leaves that melody without a voice instead of out of step.
import type { Melody } from "./jianpu";
import manifest from "./vocal-manifest.json";

/** FNV-1a over the melody's pitch, tempo, meter and notes (with lyrics). */
export function vocalKey(melody: Melody) {
  const text = JSON.stringify([melody.tonicMidi, melody.bpm, melody.meter, melody.bars]);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export type Vocal = {
  file: string;
  /** Seconds into the file where the melody's beat `leadBeats` falls. */
  offset: number;
  /** Beats of the melody before the first sung note (intro, rests). */
  leadBeats: number;
};

const VOCALS: Record<string, number[]> = manifest;

export function findVocal(melody: Melody): Vocal | null {
  const key = vocalKey(melody);
  const entry = VOCALS[key];
  return entry ? { file: `audio/vocal/${key}.mp3`, offset: entry[0], leadBeats: entry[1] } : null;
}

export const VOCAL_CREDIT = "AI 合成 · 绮萱 / DiffSinger";
