export type VocalRecording = {
  /** Work title without the book-title brackets, used as the catalog key. */
  work: string;
  /** Path below public/, for example media/recordings/example.mp3. */
  file: string;
  performer: string;
  year?: number;
  language: string;
  licenseName: string;
  licenseUrl: string;
  sourceUrl: string;
  attribution: string;
  versionNote: string;
};

export const normalizeRecordingWorkName = (name: string) => name.replace(/[《》]/g, "").trim();

export const MELODY_PLAYBACK_STARTED = "yapu:melody-playback-started";
export const VOCAL_PLAYBACK_STARTED = "yapu:vocal-playback-started";

export const RECORDING_ENTRIES: VocalRecording[] = [
  // add-recording.mjs appends imported entries above this marker.
];

export const RECORDINGS_BY_WORK = RECORDING_ENTRIES.reduce<Record<string, VocalRecording[]>>((catalog, recording) => {
  const work = normalizeRecordingWorkName(recording.work);
  (catalog[work] ??= []).push(recording);
  return catalog;
}, {});
