// 打击乐合奏的混音：每件乐器自己的音量、低通和收余音的闸，总输出再过一道压限。
// 节奏创编播放和导出音频共用，导出的 WAV 和网页上听到的一样。
import { playPercussion, type PercussionKind } from "./percussion";

/** 合奏里每件乐器的音量、高频上限（Hz），和要不要在下一击之前收住余音。锣和镲的录音本来很亮，这里压一压。 */
const MIX: Partial<Record<PercussionKind, { level: number; cut: number; choke: boolean }>> = {
  roundDrum: { level: 0.95, cut: 4200, choke: false },
  woodBlock: { level: 0.5, cut: 5200, choke: false },
  shaker: { level: 0.55, cut: 9000, choke: false },
  triangle: { level: 0.5, cut: 9000, choke: true },
  tambourine: { level: 0.6, cut: 9000, choke: false },
  smallGong: { level: 0.42, cut: 3600, choke: true },
  smallCymbal: { level: 0.36, cut: 5200, choke: true },
  bigGong: { level: 0.5, cut: 3000, choke: true },
};
const softOutputs = new WeakMap<AudioContext, AudioNode>();
/** 总输出：先削一点高频，再过压限，几件乐器同时敲也不会爆音。 */
export function softOutput(context: AudioContext): AudioNode {
  let input = softOutputs.get(context);
  if (!input) {
    const shelf = context.createBiquadFilter();
    shelf.type = "highshelf"; shelf.frequency.value = 4500; shelf.gain.value = -5;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -16; limiter.knee.value = 10; limiter.ratio.value = 8; limiter.attack.value = 0.002; limiter.release.value = 0.18;
    const out = context.createGain();
    out.gain.value = 0.85;
    shelf.connect(limiter).connect(out).connect(context.destination);
    softOutputs.set(context, shelf);
    input = shelf;
  }
  return input;
}
/** 一件乐器自己的通道：音量、低通，外加一个用来收余音的闸。 */
export function voiceBus(context: AudioContext, out: AudioNode, kind: PercussionKind) {
  const mix = MIX[kind] ?? { level: 0.6, cut: 5000, choke: false };
  const gate = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = "lowpass"; filter.frequency.value = mix.cut; filter.Q.value = 0.5;
  const level = context.createGain();
  level.gain.value = mix.level;
  gate.connect(filter).connect(level).connect(out);
  let struck = false;
  return {
    hit(at: number, accent: number) {
      if (mix.choke && struck) {
        gate.gain.setTargetAtTime(0.0001, Math.max(context.currentTime, at - 0.035), 0.008);
        gate.gain.setValueAtTime(1, at);
      }
      struck = true;
      playPercussion(context, gate, kind, at, accent);
    },
  };
}
