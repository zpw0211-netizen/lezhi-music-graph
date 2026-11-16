// 合唱训练的音准提示：从麦克风的一小段声音里找出唱的音高。
// 用的是 McLeod 音高法（归一化平方差函数）：对人声这类带泛音、基频有时偏弱的声音也稳，
// 不容易把高八度的泛音当成所唱的音。只在本机计算，不录音、不上传。

export type PitchReading = { hz: number; clarity: number };

/**
 * The sung frequency in `samples`, or null for silence, noise or an unclear tone.
 * `clarity` (0–1) is how periodic the sound is; voiced singing is usually above 0.85.
 */
export function detectPitch(samples: Float32Array, sampleRate: number, minHz = 70, maxHz = 1100): PitchReading | null {
  const n = samples.length;
  let energy = 0;
  for (let i = 0; i < n; i += 1) energy += samples[i] * samples[i];
  if (Math.sqrt(energy / n) < 0.01) return null;
  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxLag = Math.min(Math.floor(n / 2), Math.ceil(sampleRate / minHz));
  const nsdf = new Float32Array(maxLag + 2);
  for (let lag = 0; lag <= maxLag + 1; lag += 1) {
    let acf = 0;
    let norm = 0;
    for (let i = 0; i < n - lag; i += 1) {
      acf += samples[i] * samples[i + lag];
      norm += samples[i] * samples[i] + samples[i + lag] * samples[i + lag];
    }
    nsdf[lag] = norm > 0 ? (2 * acf) / norm : 0;
  }
  // Key maxima: the highest point of each stretch where the curve is above zero, after it first dips below.
  const peaks: number[] = [];
  let lag = 1;
  while (lag < maxLag && nsdf[lag] > 0) lag += 1;
  while (lag < maxLag) {
    while (lag < maxLag && nsdf[lag] <= 0) lag += 1;
    let best = -1;
    while (lag < maxLag && nsdf[lag] > 0) {
      if (best < 0 || nsdf[lag] > nsdf[best]) best = lag;
      lag += 1;
    }
    if (best >= minLag) peaks.push(best);
  }
  if (!peaks.length) return null;
  const highest = Math.max(...peaks.map((peak) => nsdf[peak]));
  // The first peak close to the highest is the period; later ones are its multiples (lower octaves).
  const period = peaks.find((peak) => nsdf[peak] >= 0.9 * highest)!;
  const [a, b, c] = [nsdf[period - 1], nsdf[period], nsdf[period + 1]];
  const shift = a - 2 * b + c === 0 ? 0 : (0.5 * (a - c)) / (a - 2 * b + c);
  const clarity = b - 0.25 * (a - c) * shift;
  if (clarity < 0.6) return null;
  return { hz: sampleRate / (period + shift), clarity: Math.min(1, clarity) };
}

export const hzToMidi = (hz: number) => 69 + 12 * Math.log2(hz / 440);

/**
 * How far a sung pitch is from the target, in cents, ignoring the octave: a boy, a teacher
 * or the men's recording may sing the same part an octave lower, and that still counts as in tune.
 */
export function centsOff(sungMidi: number, targetMidi: number) {
  const semitones = ((((sungMidi - targetMidi) % 12) + 18) % 12) - 6;
  return semitones * 100;
}

/** Within ±this many cents counts as in tune. */
export const IN_TUNE_CENTS = 50;

const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
export const noteName = (midi: number) => NOTE_NAMES[((Math.round(midi) % 12) + 12) % 12];
