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
  noise = audio.createBuffer(1, Math.round(audio.sampleRate * .6), audio.sampleRate);
  const data = noise.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  return noise;
}

/** A dry paper swish: band-passed noise sweeping upward, with a soft flap at the end. */
export function playPageTurn() {
  const audio = context();
  if (!audio) return;
  const now = audio.currentTime + .01;
  const source = audio.createBufferSource();
  source.buffer = noiseBuffer(audio);
  const band = audio.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = .9;
  band.frequency.setValueAtTime(700, now);
  band.frequency.exponentialRampToValueAtTime(3600, now + .2);
  band.frequency.exponentialRampToValueAtTime(1800, now + .32);
  const gain = audio.createGain();
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(.16, now + .05);
  gain.gain.exponentialRampToValueAtTime(.05, now + .2);
  gain.gain.linearRampToValueAtTime(.09, now + .25);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .36);
  source.connect(band).connect(gain).connect(audio.destination);
  source.start(now, Math.random() * .2, .4);
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
