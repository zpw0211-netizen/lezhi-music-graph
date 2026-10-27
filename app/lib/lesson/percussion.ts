// Synthesised timbres for the unpitched X notes of percussion ensembles, so that the parts of a
// score (small gong, big gong, drums, cymbals…) can be told apart by ear. A part is recognised
// by its label; any other label keeps the plain thump the player always used.
export type PercussionKind = "smallGong" | "bigGong" | "roundDrum" | "hourglassDrum" | "smallCymbal" | "bigCymbal" | "woodBlock";

const KINDS: Array<[string, PercussionKind]> = [
  ["小锣", "smallGong"],
  ["大锣", "bigGong"],
  ["圆鼓", "roundDrum"],
  ["长鼓", "hourglassDrum"],
  ["小镲", "smallCymbal"],
  ["大镲", "bigCymbal"],
  ["双响筒", "woodBlock"],
];

/** The timbre for a part label such as “大锣”, or null when the label names no known instrument. */
export function percussionKind(label: string | undefined): PercussionKind | null {
  return KINDS.find(([name]) => label?.includes(name))?.[1] ?? null;
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();
function noiseBuffer(ctx: BaseAudioContext) {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.8), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < data.length; i += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      data[i] = seed / 2147483648 - 1;
    }
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

/** A sine that decays exponentially, optionally gliding from `from` to `to` Hz. */
function tone(ctx: AudioContext, out: AudioNode, when: number, from: number, to: number, glide: number, level: number, decay: number, attack = 0.004) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, when);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, when + glide);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(level, when + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + decay);
  osc.connect(gain).connect(out);
  osc.start(when);
  osc.stop(when + decay + 0.02);
}

/** A burst of noise through one filter, for stick attacks and cymbals. */
function noise(ctx: AudioContext, out: AudioNode, when: number, type: BiquadFilterType, frequency: number, level: number, decay: number) {
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = noiseBuffer(ctx);
  filter.type = type;
  filter.frequency.value = frequency;
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(level, when + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + decay);
  source.connect(filter).connect(gain).connect(out);
  source.start(when);
  source.stop(when + decay + 0.02);
}

/** Strikes one note of `kind` at time `when`. */
export function playPercussion(ctx: AudioContext, out: AudioNode, kind: PercussionKind, when: number, level = 1) {
  switch (kind) {
    case "smallGong": // bright, short ring with inharmonic partials
      [[1, 0.5, 0.5], [1.52, 0.35, 0.38], [2.35, 0.22, 0.28], [3.1, 0.14, 0.2]].forEach(([ratio, gain, decay]) => tone(ctx, out, when, 1250 * ratio, 1250 * ratio, 0, gain * level, decay, 0.002));
      noise(ctx, out, when, "highpass", 3500, 0.12 * level, 0.04);
      break;
    case "bigGong": // low, slow ring
      [[1, 0.8, 1.3], [1.47, 0.45, 1.0], [2.06, 0.3, 0.8], [2.9, 0.18, 0.55]].forEach(([ratio, gain, decay]) => tone(ctx, out, when, 150 * ratio, 150 * ratio, 0, gain * level, decay, 0.012));
      noise(ctx, out, when, "lowpass", 900, 0.2 * level, 0.08);
      break;
    case "roundDrum": // deep head with a short stick attack
      tone(ctx, out, when, 210, 105, 0.12, 1.0 * level, 0.34);
      noise(ctx, out, when, "lowpass", 1800, 0.35 * level, 0.04);
      break;
    case "hourglassDrum": // drier and higher, with a slap
      tone(ctx, out, when, 330, 190, 0.07, 0.95 * level, 0.17);
      noise(ctx, out, when, "bandpass", 2200, 0.6 * level, 0.06);
      break;
    case "smallCymbal":
      noise(ctx, out, when, "highpass", 6500, 0.65 * level, 0.22);
      tone(ctx, out, when, 4200, 4200, 0, 0.07 * level, 0.14);
      break;
    case "bigCymbal":
      noise(ctx, out, when, "highpass", 4200, 0.75 * level, 0.6);
      tone(ctx, out, when, 2900, 2900, 0, 0.08 * level, 0.35);
      break;
    case "woodBlock": // two hollow tones
      tone(ctx, out, when, 980, 980, 0, 0.7 * level, 0.07, 0.002);
      tone(ctx, out, when, 690, 690, 0, 0.5 * level, 0.09, 0.002);
      break;
  }
}
