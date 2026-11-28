import { publicAssetUrl } from "../app/assets";
import { fetchWithRetry } from "../app/fetch-retry";

const SAMPLE_MIDIS = Array.from({ length: 22 }, (_, index) => 36 + index * 3);
const NOTE_NAMES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"];
const RELEASE_SECONDS = 0.1;

export type PianoSampler = {
  samples: Array<{ midi: number; buffer: AudioBuffer }>;
};

const samplerByContext = new WeakMap<AudioContext, Promise<PianoSampler>>();
/** Downloaded sample files, shared by every context; a failed download is dropped so the next try fetches again. */
const bytesByUrl = new Map<string, Promise<ArrayBuffer>>();
let sharedContext: AudioContext | null = null;

/** Call only from a user gesture; all piano interfaces share this context. */
export function getPianoAudioContext() {
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) throw new Error("Web Audio unavailable");
  sharedContext ??= new AudioCtor({ latencyHint: "interactive" });
  return sharedContext;
}

function sampleFileName(midi: number) {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}.mp3`;
}

function sampleUrl(midi: number) {
  return publicAssetUrl(`media/instruments/piano/${sampleFileName(midi)}`);
}

/** Public URLs of all 22 piano samples, for classroom offline preloading. */
export function pianoSampleUrls() {
  return SAMPLE_MIDIS.map(sampleUrl);
}

function sampleBytes(url: string) {
  const existing = bytesByUrl.get(url);
  if (existing) return existing;
  const loading = fetchWithRetry(url).then((response) => {
    if (!response.ok) throw new Error(`Piano sample request failed (${response.status})`);
    return response.arrayBuffer();
  });
  loading.catch(() => { if (bytesByUrl.get(url) === loading) bytesByUrl.delete(url); });
  bytesByUrl.set(url, loading);
  return loading;
}

/**
 * Download the piano bank in the background (no AudioContext or user gesture needed), so the first
 * press of a play button only has to decode: on the live host the 22 files took 5–6 s to arrive.
 */
export function preloadPianoSamples() {
  for (const midi of SAMPLE_MIDIS) void sampleBytes(sampleUrl(midi)).catch(() => undefined);
}

/** Load and decode the piano bank once for each AudioContext. */
export function loadPianoSampler(context: AudioContext): Promise<PianoSampler> {
  const existing = samplerByContext.get(context);
  if (existing) return existing;

  const loading = Promise.all(SAMPLE_MIDIS.map(async (midi) => {
    // decodeAudioData takes over the buffer it is given, so decode a copy and keep the download for other contexts.
    const bytes = await sampleBytes(sampleUrl(midi));
    const buffer = await context.decodeAudioData(bytes.slice(0));
    return { midi, buffer };
  })).then((samples) => ({ samples })).catch((error: unknown) => {
    samplerByContext.delete(context);
    throw error;
  });

  samplerByContext.set(context, loading);
  return loading;
}

/** Schedule a sampled piano note with a short edge fade and note-off release. */
export function playPianoSample(
  context: AudioContext,
  sampler: PianoSampler,
  midi: number,
  start: number,
  duration: number,
  destination: AudioNode,
  level: number,
) {
  const sample = sampler.samples.reduce((closest, item) =>
    Math.abs(item.midi - midi) < Math.abs(closest.midi - midi) ? item : closest,
  );
  const source = context.createBufferSource();
  const envelope = context.createGain();
  const attack = Math.min(0.01, Math.max(0.001, duration * 0.2));
  const releaseStart = Math.max(start + attack, start + duration - RELEASE_SECONDS);
  source.buffer = sample.buffer;
  source.playbackRate.setValueAtTime(2 ** ((midi - sample.midi) / 12), start);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(level, start + attack);
  envelope.gain.setValueAtTime(level, releaseStart);
  envelope.gain.exponentialRampToValueAtTime(0.0001, releaseStart + RELEASE_SECONDS);
  source.connect(envelope).connect(destination);
  source.start(start);
  source.stop(releaseStart + RELEASE_SECONDS + 0.01);
  source.onended = () => { source.disconnect(); envelope.disconnect(); };
  return {
    stop: () => {
      const now = context.currentTime;
      envelope.gain.cancelScheduledValues(now);
      envelope.gain.setTargetAtTime(0.0001, now, 0.015);
      source.stop(now + 0.08);
    },
  };
}
