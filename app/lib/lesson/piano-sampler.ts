import { publicAssetUrl } from "../app/assets";

const SAMPLE_MIDIS = Array.from({ length: 22 }, (_, index) => 36 + index * 3);
const NOTE_NAMES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"];
const RELEASE_SECONDS = 0.1;

export type PianoSampler = {
  samples: Array<{ midi: number; buffer: AudioBuffer }>;
};

const samplerByContext = new WeakMap<AudioContext, Promise<PianoSampler>>();

function sampleFileName(midi: number) {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}.mp3`;
}

/** Load and decode the piano bank once for each AudioContext. */
export function loadPianoSampler(context: AudioContext): Promise<PianoSampler> {
  const existing = samplerByContext.get(context);
  if (existing) return existing;

  const loading = Promise.all(SAMPLE_MIDIS.map(async (midi) => {
    const url = publicAssetUrl(`media/instruments/piano/${sampleFileName(midi)}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Piano sample request failed (${response.status})`);
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    return { midi, buffer };
  })).then((samples) => ({ samples }));

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
}