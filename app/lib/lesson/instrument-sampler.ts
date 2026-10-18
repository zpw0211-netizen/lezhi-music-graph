import { publicAssetUrl } from "../app/assets";
import { loadPianoSampler, playPianoSample } from "./piano-sampler";
import type { PianoSampler } from "./piano-sampler";

export const INSTRUMENTS = [
  { id: "piano", label: "钢琴" },
  { id: "guitar", label: "木吉他" },
] as const;

export type InstrumentId = typeof INSTRUMENTS[number]["id"];
export type InstrumentSampler = {
  samples: Array<{ midi: number; buffer: AudioBuffer; loopStart?: number; loopEnd?: number }>;
};

const SAMPLE_MIDIS = Array.from({ length: 22 }, (_, index) => 36 + index * 3);
const NOTE_NAMES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"];
const samplerByContext = new WeakMap<AudioContext, Map<InstrumentId, Promise<InstrumentSampler>>>();

function sampleFileName(midi: number) {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}.mp3`;
}

export function loadInstrumentSampler(context: AudioContext, instrument: InstrumentId): Promise<InstrumentSampler> {
  const cache = samplerByContext.get(context) ?? new Map<InstrumentId, Promise<InstrumentSampler>>();
  samplerByContext.set(context, cache);
  const existing = cache.get(instrument);
  if (existing) return existing;

  const loading = (instrument === "piano"
    ? loadPianoSampler(context).then((sampler) => sampler)
    : (async () => {
      const root = `media/instruments/${instrument}`;
      const response = await fetch(publicAssetUrl(`${root}/loops.json`));
      if (!response.ok) throw new Error(`${instrument} loop data request failed (${response.status})`);
      const loops = await response.json() as Record<string, { start: number; end: number }>;
      const samples = await Promise.all(SAMPLE_MIDIS.map(async (midi) => {
        const sampleResponse = await fetch(publicAssetUrl(`${root}/${sampleFileName(midi)}`));
        if (!sampleResponse.ok) throw new Error(`${instrument} sample request failed (${sampleResponse.status})`);
        const buffer = await context.decodeAudioData(await sampleResponse.arrayBuffer());
        const loop = loops[String(midi)];
        return { midi, buffer, loopStart: loop?.start, loopEnd: loop?.end };
      }));
      return { samples };
    })()).catch((error: unknown) => {
      cache.delete(instrument);
      throw error;
    });

  cache.set(instrument, loading);
  return loading;
}

export function playInstrumentSample(
  context: AudioContext,
  instrument: InstrumentId,
  sampler: InstrumentSampler,
  midi: number,
  start: number,
  duration: number,
  destination: AudioNode,
  level: number,
) {
  if (instrument === "piano") {
    return playPianoSample(context, sampler as PianoSampler, midi, start, duration, destination, level);
  }

  const sample = sampler.samples.reduce((closest, item) =>
    Math.abs(item.midi - midi) < Math.abs(closest.midi - midi) ? item : closest,
  );
  const source = context.createBufferSource();
  const envelope = context.createGain();
  const attack = Math.min(0.035, Math.max(0.008, duration * 0.18));
  const release = instrument === "guitar" ? 0.09 : 0.16;
  const releaseStart = Math.max(start + attack, start + duration - release);
  source.buffer = sample.buffer;
  source.playbackRate.setValueAtTime(2 ** ((midi - sample.midi) / 12), start);
  if (instrument !== "guitar" && sample.loopStart != null && sample.loopEnd != null) {
    source.loop = true;
    source.loopStart = sample.loopStart;
    source.loopEnd = Math.min(sample.loopEnd, sample.buffer.duration);
  }
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(level, start + attack);
  envelope.gain.setValueAtTime(level, releaseStart);
  envelope.gain.exponentialRampToValueAtTime(0.0001, releaseStart + release);
  source.connect(envelope).connect(destination);
  source.start(start);
  source.stop(releaseStart + release + 0.01);
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
