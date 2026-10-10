// Small synthesized sounds for the 按课学习 book: a paper page turn and a seal stamp.
// Made with Web Audio on the spot, so there are no files to load. Shares the site's AudioContext.
import { getPianoAudioContext } from "../lesson/piano-sampler";

const SOUND_STORAGE_KEY = "yapu-records-sound";

export function readBookSoundOn() {
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function saveBookSoundOn(on: boolean) {
  try { window.localStorage.setItem(SOUND_STORAGE_KEY, on ? "on" : "off"); } catch { /* Kept for this visit only. */ }
}

let noise: AudioBuffer | null = null;

function context() {
  try {
    const audio = getPianoAudioContext();
    if (audio.state === "suspended") void audio.resume();
    return audio;
  } catch {
    return null;
  }
}

function noiseBuffer(audio: AudioContext) {
  if (noise && noise.sampleRate === audio.sampleRate) return noise;
  noise = audio.createBuffer(1, Math.round(audio.sampleRate * 1), audio.sampleRate);
  const data = noise.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  return noise;
}

/** A soft scroll unrolling: quiet, low, rounded noise that swells in and fades away, with no sharp edge. */
export function playPageTurn() {
  const audio = context();
  if (!audio) return;
  const now = audio.currentTime + .01;
  const length = .62;
  const source = audio.createBufferSource();
  source.buffer = noiseBuffer(audio);
  // Two low-passes take off all the hiss; the band drifts gently up and back down like silk paper sliding.
  const soften = audio.createBiquadFilter();
  soften.type = "lowpass";
  soften.frequency.value = 1400;
  soften.Q.value = .3;
  const band = audio.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = .55;
  band.frequency.setValueAtTime(380, now);
  band.frequency.linearRampToValueAtTime(820, now + length * .45);
  band.frequency.linearRampToValueAtTime(480, now + length);
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(.045, now + length * .4);
  gain.gain.linearRampToValueAtTime(.03, now + length * .65);
  gain.gain.linearRampToValueAtTime(0, now + length);
  source.connect(soften).connect(band).connect(gain).connect(audio.destination);
  source.start(now, Math.random() * .1, length + .05);
}

/** A seal pressed onto paper: a short low thump with a crisp tap on top. */
export function playStamp() {
  const audio = context();
  if (!audio) return;
  const now = audio.currentTime + .01;
  const body = audio.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(170, now);
  body.frequency.exponentialRampToValueAtTime(55, now + .14);
  const bodyGain = audio.createGain();
  bodyGain.gain.setValueAtTime(.0001, now);
  bodyGain.gain.exponentialRampToValueAtTime(.55, now + .008);
  bodyGain.gain.exponentialRampToValueAtTime(.0001, now + .2);
  body.connect(bodyGain).connect(audio.destination);
  body.start(now);
  body.stop(now + .22);

  const tap = audio.createBufferSource();
  tap.buffer = noiseBuffer(audio);
  const high = audio.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 1800;
  const tapGain = audio.createGain();
  tapGain.gain.setValueAtTime(.0001, now);
  tapGain.gain.exponentialRampToValueAtTime(.22, now + .003);
  tapGain.gain.exponentialRampToValueAtTime(.0001, now + .05);
  tap.connect(high).connect(tapGain).connect(audio.destination);
  tap.start(now, 0, .06);
}
