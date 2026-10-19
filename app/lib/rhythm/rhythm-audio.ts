import { getPianoAudioContext, loadPianoSampler, playPianoSample, type PianoSampler } from "../lesson/piano-sampler";
import type { Meter, TimedToken } from "./patterns";

// Rhythm and count-in sound on the piano's standard pitch A4 (440 Hz, 6 in
// 1=C), the pitch used in rhythm dictation; the metronome is a synthesised click.

const STANDARD_A = 69;

function click(context: AudioContext, out: AudioNode, at: number, downbeat: boolean) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "square";
  osc.frequency.value = downbeat ? 1760 : 1180;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(downbeat ? 0.12 : 0.07, at + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.035);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + 0.05);
}

export type PlayOptions = {
  tokens: TimedToken[];
  /** Exercise length in quarter notes. */
  totalBeats: number;
  meter: Meter;
  bpm: number;
  rhythm: boolean;
  metronome: boolean;
  countIn: boolean;
  loop: boolean;
};

export type RhythmPlayback = {
  stop: () => void;
  /** Position in quarter notes inside the exercise (negative during the count-in), or null when finished. */
  position: () => number | null;
};

/** Unlock audio and load the piano; call from a user gesture. */
export async function prepareRhythmAudio() {
  const context = getPianoAudioContext();
  void context.resume();
  const sampler = await loadPianoSampler(context);
  return { context, sampler };
}

export function playRhythm(
  { context, sampler }: { context: AudioContext; sampler: PianoSampler },
  options: PlayOptions,
  onEnd: () => void,
): RhythmPlayback {
  const master = context.createGain();
  master.gain.value = 0.9;
  master.connect(context.destination);

  const { meter } = options;
  // Tempo counts the meter's unit: quarters in x/4, eighths in x/8.
  const secPerQuarter = 60 / (options.bpm * meter.unit);
  const secPerUnit = secPerQuarter * meter.unit;
  const unitsPerBar = Math.round(meter.beats / meter.unit);
  const countUnits = options.countIn ? unitsPerBar : 0;
  const origin = context.currentTime + 0.12 + countUnits * secPerUnit;
  const passSeconds = options.totalBeats * secPerQuarter;
  const passUnits = Math.round(options.totalBeats / meter.unit);
  // 6/8 has a secondary accent on its fourth eighth.
  const accent = (unit: number) => unit % unitsPerBar === 0 || (meter.top === 6 && unit % unitsPerBar === 3);
  let stopped = false;
  let scheduledPasses = 0;
  let timer: number | undefined;

  for (let unit = 0; unit < countUnits; unit++) {
    const at = origin - (countUnits - unit) * secPerUnit;
    playPianoSample(context, sampler, STANDARD_A, at, Math.max(0.08, secPerUnit * 0.6), master, unit === 0 ? 0.85 : 0.6);
  }

  const schedulePass = (pass: number) => {
    const start = origin + pass * passSeconds;
    if (options.metronome) {
      for (let unit = 0; unit < passUnits; unit++) click(context, master, start + unit * secPerUnit, accent(unit));
    }
    if (options.rhythm) {
      for (const token of options.tokens) {
        if (!token.sounding) continue;
        const ring = token.length * secPerQuarter;
        const strong = Math.abs(token.start % meter.beats) < 1e-6;
        // A small gap keeps repeated notes apart while the note still fills its value.
        playPianoSample(context, sampler, STANDARD_A, start + token.start * secPerQuarter, Math.max(0.06, ring - Math.min(0.06, ring * 0.15)), master, strong ? 0.85 : 0.7);
      }
    }
    scheduledPasses = pass + 1;
    const passEnd = start + passSeconds;
    const wait = Math.max(0, (passEnd - context.currentTime - 0.4) * 1000);
    timer = window.setTimeout(() => {
      if (stopped) return;
      if (options.loop) schedulePass(pass + 1);
      else timer = window.setTimeout(finish, Math.max(0, (passEnd - context.currentTime + 0.15) * 1000));
    }, wait);
  };

  const finish = () => {
    if (stopped) return;
    stop();
    onEnd();
  };

  const stop = () => {
    stopped = true;
    window.clearTimeout(timer);
    master.gain.setTargetAtTime(0, context.currentTime, 0.01);
    window.setTimeout(() => master.disconnect(), 120);
  };

  schedulePass(0);

  return {
    stop,
    position: () => {
      if (stopped) return null;
      const elapsed = (context.currentTime - origin) / secPerQuarter;
      if (elapsed < 0) return elapsed;
      if (!options.loop && elapsed >= options.totalBeats) return null;
      const passes = Math.min(Math.floor(elapsed / options.totalBeats), scheduledPasses - 1);
      return elapsed - passes * options.totalBeats;
    },
  };
}
