"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { midiOf, notation } from "../../lib/lesson/melodies";
import type { Melody, MelodyNote } from "../../lib/lesson/melodies";
import { loadPianoSampler, playPianoSample } from "../../lib/lesson/piano-sampler";
import type { PianoSampler } from "../../lib/lesson/piano-sampler";
import { MELODY_PLAYBACK_STARTED, VOCAL_PLAYBACK_STARTED } from "../../lib/lesson/recordings";

type Line = { label: string; bars: MelodyNote[][] };
// One audio context and one decoded piano bank for the whole session, so
// switching excerpts or lessons never re-decodes the samples.
let sharedContext: AudioContext | null = null;
let sharedSampler: PianoSampler | null = null;
// Voice colours: main line in green, second voice in blue so parts stay distinct.
const TIMBRES = [
  { wave: "triangle" as OscillatorType, overtone: 0.5, level: 1 },
  { wave: "sine" as OscillatorType, overtone: 0.3, level: 0.65 },
  { wave: "sine" as OscillatorType, overtone: 0.2, level: 0.55 },
];

/** Excerpts of one work: tabs when there are several themes, one player each. */
export function MelodySet({ melodies, large }: { melodies: Melody[]; large?: boolean }) {
  const [index, setIndex] = useState(0);
  const melody = melodies[Math.min(index, melodies.length - 1)];
  return <div className="melody-set">
    {melodies.length > 1 && <div className="melody-tabs" role="tablist" aria-label="谱例片段">
      {melodies.map((item, k) => <button key={k} type="button" role="tab" aria-selected={k === index} className={k === index ? "active" : ""} onClick={() => setIndex(k)}>{item.title ?? `片段 ${k + 1}`}</button>)}
    </div>}
    <MelodyPlayer key={index} melody={melody} large={large} />
  </div>;
}

/** Plays a jianpu melody (and any extra voices) with WebAudio, highlighting each sounding note. */
export function MelodyPlayer({ melody, large }: { melody: Melody; large?: boolean }) {
  const lines = useMemo<Line[]>(() => [{ label: melody.label ?? "旋律", bars: melody.bars }, ...(melody.voices ?? [])], [melody]);
  const [playing, setPlaying] = useState(false);
  const [loadingPiano, setLoadingPiano] = useState(false);
  const [audioMode, setAudioMode] = useState<"unknown" | "piano" | "synth">("unknown");
  const [current, setCurrent] = useState<number[]>([]);
  const [tempo, setTempo] = useState(melody.bpm);
  const [enabled, setEnabled] = useState<boolean[]>(() => lines.map(() => true));
  const rhythmOnly = melody.bars.every((bar) => bar.every((note) => note.d === 0 || note.d === 9));
  const mounted = useRef(true);
  const stopRef = useRef<() => void>(() => {});
  const playRequestRef = useRef(0);
  const flats = useMemo(() => lines.map((line) => line.bars.flat()), [lines]);
  const offsets = useMemo(() => lines.map((line) => line.bars.reduce<number[]>((acc, bar, i) => [...acc, i ? acc[i - 1] + line.bars[i - 1].length : 0], [])), [lines]);

  const stop = useCallback(() => {
    playRequestRef.current += 1;
    stopRef.current();
    stopRef.current = () => {};
    setPlaying(false);
    setCurrent([]);
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; stop(); };
  }, [stop]);
  useEffect(() => {
    window.addEventListener(VOCAL_PLAYBACK_STARTED, stop);
    return () => window.removeEventListener(VOCAL_PLAYBACK_STARTED, stop);
  }, [stop]);

  const play = async () => {
    if (playing) { stop(); return; }
    const request = ++playRequestRef.current;
    window.dispatchEvent(new Event(MELODY_PLAYBACK_STARTED));
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) { setAudioMode("synth"); return; }
    const ctx = sharedContext ?? new AudioCtor();
    sharedContext = ctx;

    let sampler = sharedSampler;
    if (!rhythmOnly && audioMode !== "synth" && !sampler) {
      setLoadingPiano(true);
      try {
        await ctx.resume();
        sampler = await loadPianoSampler(ctx);
        sharedSampler = sampler;
        if (mounted.current) setAudioMode("piano");
      } catch {
        if (mounted.current) setAudioMode("synth");
      } finally {
        if (mounted.current) setLoadingPiano(false);
      }
    } else {
      await ctx.resume().catch(() => undefined);
    }
    // The reader may have left the lesson while the samples were loading.
    if (!mounted.current || request !== playRequestRef.current) return;

    const beat = 60 / tempo;
    const start = ctx.currentTime + 0.12;
    const master = ctx.createGain();
    master.gain.value = lines.length > 1 ? 0.24 : 0.34;
    master.connect(ctx.destination);
    let end = start;
    const timeline = flats.map((notes, voice) => {
      const times: number[] = [];
      let t = start;
      notes.forEach((note, index) => {
        times.push(t);
        const duration = note.b * beat;
        // A tied note extends the previous tone instead of re-attacking.
        if (enabled[voice] && note.d && !note.tie) {
          let length = duration;
          for (let k = index + 1; k < notes.length && notes[k].tie; k += 1) length += notes[k].b * beat;
          if (note.d === 9) {
            const percussion = { wave: "triangle" as OscillatorType, overtone: 0.15, level: 0.8 };
            length = Math.min(length, 0.12);
            for (const [wave, level, multiple] of [[percussion.wave, percussion.level, 1], ["sine" as OscillatorType, percussion.level * percussion.overtone, 2]] as const) {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = wave; osc.frequency.value = 160 * multiple;
              gain.gain.setValueAtTime(0, t);
              gain.gain.linearRampToValueAtTime(level, t + 0.02);
              gain.gain.exponentialRampToValueAtTime(level * 0.55, t + Math.min(0.25, length * 0.5));
              gain.gain.exponentialRampToValueAtTime(0.0001, t + length * 0.96);
              osc.connect(gain).connect(master);
              osc.start(t); osc.stop(t + length);
            }
          } else if (sampler) {
            const level = voice === 0 ? 1 : voice === 1 ? 0.7 : 0.58;
            playPianoSample(ctx, sampler, midiOf(melody, note), t, length, master, level);
          } else {
            const frequency = 440 * Math.pow(2, (midiOf(melody, note) - 69) / 12);
            const timbre = TIMBRES[voice] ?? TIMBRES[2];
            for (const [wave, level, multiple] of [[timbre.wave, timbre.level, 1], ["sine" as OscillatorType, timbre.level * timbre.overtone, 2]] as const) {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = wave; osc.frequency.value = frequency * multiple;
              gain.gain.setValueAtTime(0, t);
              gain.gain.linearRampToValueAtTime(level, t + 0.02);
              gain.gain.exponentialRampToValueAtTime(level * 0.55, t + Math.min(0.25, length * 0.5));
              gain.gain.exponentialRampToValueAtTime(0.0001, t + length * 0.96);
              osc.connect(gain).connect(master);
              osc.start(t); osc.stop(t + length);
            }
          }
        }
        t += duration;
      });
      end = Math.max(end, t);
      return times;
    });
    let raf = 0;
    const tick = () => {
      const now = ctx.currentTime;
      if (now >= end) { stop(); return; }
      setCurrent(timeline.map((times) => {
        if (now < start) return -1;
        let index = times.length - 1;
        while (index > 0 && times[index] > now) index -= 1;
        return index;
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    stopRef.current = () => {
      cancelAnimationFrame(raf);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
      setTimeout(() => master.disconnect(), 100);
    };
    setPlaying(true);
  };

  const renderNote = (note: MelodyNote, key: number, active: boolean) => {
    const { lines: underlines, dotted, dashes } = notation(note);
    return <span key={key} className={`melody-note ${active ? "is-active" : ""} ${note.tie ? "is-tie" : ""}`}>
      <span className={`melody-digit lines-${underlines} ${(note.o ?? 0) > 0 ? "is-high" : ""} ${(note.o ?? 0) < 0 ? "is-low" : ""} ${Math.abs(note.o ?? 0) === 2 ? "is-double" : ""}`}>{note.a ? <sup className="melody-accidental">{note.a > 0 ? "♯" : "♭"}</sup> : null}{note.d === 9 ? "×" : note.d || "0"}{dotted && <i className="melody-dot">·</i>}</span>
      {Array.from({ length: dashes }, (_, k) => <span key={k} className="melody-dash">–</span>)}
      <span className="melody-lyric">{note.lyric || " "}</span>
    </span>;
  };

  return <div className={`melody-player ${large ? "is-large" : ""} ${lines.length > 1 ? "is-choral" : ""}`}>
    {melody.title && !large && <p className="melody-title">{melody.title}</p>}
    {melody.quality === "draft" && <p className="melody-draft">自动识谱草稿 · 待人工核对。音高、节奏或调号可能有误，请对照教材原谱。</p>}
    <div className="melody-controls">
      <button type="button" className="melody-play" onClick={play} disabled={loadingPiano} aria-label={loadingPiano ? "载入钢琴音色…" : playing ? "停止" : rhythmOnly ? "播放节奏" : lines.length > 1 ? "播放合唱" : "播放旋律"}>
        {!loadingPiano && (playing ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>)}
        {loadingPiano ? "载入钢琴音色…" : playing ? "停止" : rhythmOnly ? "播放节奏" : lines.length > 1 ? "播放合唱" : "播放旋律"}
      </button>
      <span className="melody-key">{melody.key} · {melody.meter}</span>
      {lines.length > 1 && <span className="melody-voices" role="group" aria-label="选择声部">
        {lines.map((line, k) => <label key={line.label} className={`voice-${k}`}>
          <input type="checkbox" checked={enabled[k]} disabled={playing || loadingPiano} onChange={(event) => setEnabled((value) => value.map((item, i) => (i === k ? event.target.checked : item)))} />
          {line.label}
        </label>)}
      </span>}
      <label className="melody-tempo">速度
        <input type="range" min={40} max={160} step={4} value={tempo} disabled={playing || loadingPiano} onChange={(event) => setTempo(Number(event.target.value))} />
        <b>♩={tempo}</b>
      </label>
    </div>
    <div className="melody-score" aria-label="简谱旋律">
      {melody.bars.map((_, barIndex) => <span key={barIndex} className="melody-bar">
        {lines.map((line, voice) => <span key={voice} className={`melody-voice voice-${voice}`}>
          {(line.bars[barIndex] ?? []).map((note, noteIndex) => renderNote(note, noteIndex, offsets[voice][barIndex] + noteIndex === current[voice]))}
        </span>)}
      </span>)}
    </div>
    <p className="melody-source">{melody.source}。{rhythmOnly ? "节奏示范，仅供练习参考。" : audioMode === "synth" ? "电子音色示范，仅供视唱参考。" : <>钢琴音色示范，仅供视唱参考。钢琴采样：<a href="https://archive.org/details/SalamanderGrandPianoV3" target="_blank" rel="noreferrer">Salamander Grand Piano</a>（Alexander Holm，<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>）。</>}</p>
  </div>;
}
