"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { displayMeter, midiOf, notation } from "../../lib/lesson/melodies";
import type { Melody, MelodyNote } from "../../lib/lesson/melodies";
import { getPianoAudioContext } from "../../lib/lesson/piano-sampler";
import { INSTRUMENTS, loadInstrumentSampler, playInstrumentSample } from "../../lib/lesson/instrument-sampler";
import type { InstrumentId, InstrumentSampler } from "../../lib/lesson/instrument-sampler";
import { MELODY_PLAYBACK_STARTED, VOCAL_PLAYBACK_STARTED } from "../../lib/lesson/recordings";
import { SlidingIndicator } from "../graph/SlidingIndicator";
import { MelodyLine } from "./MelodyLine";
import { splitPhrases, type PhraseMode } from "../../lib/lesson/phrases";

type Line = { label: string; bars: MelodyNote[][] };
type BeamRun = { start: number; end: number; level: number };
type BeamFragment = { level: number; edge: "start" | "middle" | "end" | "single" };

const UNDERLINE_TOP = 1.42;
const UNDERLINE_GAP = 0.16;

/** Low octave dots sit below this note's diminution lines, as in the textbook. */
function lowDotTop(note: MelodyNote) {
  const { lines } = notation(note);
  return lines ? UNDERLINE_TOP + (lines - 1) * UNDERLINE_GAP + 0.15 : 1.48;
}

function noteHeadHeight(notes: MelodyNote[]) {
  return Math.max(1.72, ...notes.map((note) => {
    const lowDots = Math.max(0, -(note.o ?? 0));
    if (lowDots) return lowDotTop(note) + 0.13 + (lowDots - 1) * 0.2 + 0.08;
    const { lines } = notation(note);
    return lines ? UNDERLINE_TOP + (lines - 1) * UNDERLINE_GAP + 0.14 : 1.5;
  }));
}

/** Simplified-notation beams stay inside the metrical group, never across a bar line. */
function getBeamRuns(notes: MelodyNote[], meter: string): BeamRun[] {
  if (!notes.length || meter.includes("散")) return [];
  const signatures = [...meter.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map((match) => ({
    numerator: Number(match[1]),
    denominator: Number(match[2]),
  }));
  if (!signatures.length) return [];

  const total = notes.reduce((sum, note) => sum + note.b, 0);
  const signature = signatures.find(({ numerator, denominator }) => Math.abs(total - numerator * 4 / denominator) < 1e-6) ?? signatures[0];
  const { numerator, denominator } = signature;
  const runs: BeamRun[] = [];
  const maxLines = Math.max(...notes.map((note) => notation(note).lines));
  const unit = 4 / denominator;
  const baseBeatPattern = denominator === 8
    ? numerator >= 6 && numerator % 3 === 0
      ? Array(numerator / 3).fill(unit * 3)
      : numerator === 5
        ? [unit * 3, unit * 2] // common 3+2 grouping
        : numerator === 7
          ? [unit * 3, unit * 2, unit * 2] // common 3+2+2 grouping
          : Array(numerator).fill(unit)
    : Array(numerator).fill(unit);
  const beatPatternForLevel = (level: number) => {
    // Keep the first two beam levels inside the notated pulse (including dotted-quarter
    // pulses in compound meter). Split only higher levels into progressively smaller groups.
    const subdivisions = level > 2 ? 2 ** (level - 2) : 1;
    return baseBeatPattern.flatMap((beat) => Array(subdivisions).fill(beat / subdivisions));
  };

  for (let level = 1; level <= maxLines; level += 1) {
    const beatPattern = beatPatternForLevel(level);
    const beatRanges: Array<{ start: number; end: number }> = [];
    let beatStart = 0;
    for (let index = 0; beatStart < total - 1e-6; index += 1) {
      const end = Math.min(total, beatStart + beatPattern[index % beatPattern.length]);
      beatRanges.push({ start: beatStart, end });
      beatStart = end;
    }

    let cursor = 0;
    const noteBeats = notes.map((note) => {
      const start = cursor;
      const end = start + note.b;
      cursor = end;
      return beatRanges.findIndex((beat) => start >= beat.start - 1e-6 && end <= beat.end + 1e-6);
    });
    let runStart = -1;
    let runBeat = -1;
    const flush = (end: number) => {
      if (runStart >= 0) {
        const runEnd = end - 1;
        // Jianpu uses a full short underline beneath an isolated subdivision,
        // rather than the sideways beam hook used in staff notation.
        runs.push({ start: runStart, end: runEnd, level });
      }
      runStart = -1;
      runBeat = -1;
    };

    notes.forEach((note, index) => {
      const lines = notation(note).lines;
      const beatIndex = noteBeats[index];
      const canBeam = lines >= level && note.d !== 0 && beatIndex >= 0;
      if (!canBeam || (runStart >= 0 && beatIndex !== runBeat)) flush(index);
      if (canBeam && runStart < 0) {
        runStart = index;
        runBeat = beatIndex;
      }
    });
    flush(notes.length);
  }
  return runs;
}

// Keep decoded instrument banks for the session so switching excerpts does not re-decode samples.
const sharedSamplers: Partial<Record<InstrumentId, InstrumentSampler>> = {};
// Voice colours: main line in green, second voice in blue so parts stay distinct.
const TIMBRES = [
  { wave: "triangle" as OscillatorType, overtone: 0.5, level: 1 },
  { wave: "sine" as OscillatorType, overtone: 0.3, level: 0.65 },
  { wave: "sine" as OscillatorType, overtone: 0.2, level: 0.55 },
];
const VISUALLY_HIDDEN = {
  position: "absolute" as const,
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden" as const,
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap" as const,
  border: 0,
};

/** Excerpts of one work: tabs when there are several themes, one player each. */
export function MelodySet({ melodies, large }: { melodies: Melody[]; large?: boolean }) {
  const [index, setIndex] = useState(0);
  const melody = melodies[Math.min(index, melodies.length - 1)];
  return <div className="melody-set">
    {melodies.length > 1 && <div className="melody-tabs motion-tabs" role="tablist" aria-label="谱例片段">
      <SlidingIndicator activeKey={index} />
      {melodies.map((item, k) => <button key={k} type="button" role="tab" aria-selected={k === index} className={k === index ? "active" : ""} onClick={() => setIndex(k)}>{item.title ?? `片段 ${k + 1}`}</button>)}
    </div>}
    <MelodyPlayer key={index} melody={melody} large={large} />
  </div>;
}

/** Plays a jianpu melody (and any extra voices) with WebAudio, highlighting each sounding note. */
export function MelodyPlayer({ melody, large, onSoundingNotes }: { melody: Melody; large?: boolean; onSoundingNotes?: (notes: number[], playing: boolean) => void }) {
  const soundingCallback = useRef(onSoundingNotes);
  useEffect(() => { soundingCallback.current = onSoundingNotes; }, [onSoundingNotes]);
  const lines = useMemo<Line[]>(() => [{ label: melody.label ?? "旋律", bars: melody.bars }, ...(melody.voices ?? [])], [melody]);
  const [playing, setPlaying] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentId>("piano");
  const [loadingSampler, setLoadingSampler] = useState(false);
  const [audioMode, setAudioMode] = useState<"unknown" | "sampled" | "synth">("unknown");
  const [current, setCurrent] = useState<number[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [tempo, setTempo] = useState(melody.bpm);
  const [enabled, setEnabled] = useState<boolean[]>(() => lines.map(() => true));
  const rhythmOnly = melody.bars.every((bar) => bar.every((note) => note.d === 0 || note.d === 9));
  const mounted = useRef(true);
  const playbackActive = useRef(false);
  const samplerLoading = useRef(false);
  const stopRef = useRef<() => void>(() => {});
  const playRequestRef = useRef(0);
  /** Continuous position of the main line in beats (−1 when silent), for the melody line's orb. */
  const beatRef = useRef(-1);
  const flats = useMemo(() => lines.map((line) => line.bars.flat()), [lines]);
  const headHeights = useMemo(() => flats.map(noteHeadHeight), [flats]);
  const offsets = useMemo(() => lines.map((line) => line.bars.reduce<number[]>((acc, bar, i) => [...acc, i ? acc[i - 1] + line.bars[i - 1].length : 0], [])), [lines]);
  const beamRuns = useMemo(() => lines.map((line) => line.bars.map((notes) => {
    const byLevel = new Map<number, Map<number, BeamRun>>();
    getBeamRuns(notes, melody.meter).forEach((run) => {
      const levelRuns = byLevel.get(run.level) ?? new Map<number, BeamRun>();
      levelRuns.set(run.start, run);
      byLevel.set(run.level, levelRuns);
    });
    return byLevel;
  })), [lines, melody.meter]);
  // Widest bar in note-size units, to choose how many bars share a score row.
  const widestBar = useMemo(() => Math.max(1, ...melody.bars.map((_, barIndex) => Math.max(...lines.map((line, voice) => {
    const notes = line.bars[barIndex] ?? [];
    const groups = [...(beamRuns[voice]?.[barIndex]?.get(1)?.values() ?? [])].length;
    return notes.reduce((sum, note) => sum + (note.a != null ? 1.5 : 1.1) + notation(note).dashes * 1.1, 0) + groups * 0.22;
  })))), [melody.bars, lines, beamRuns]);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const [barsPerRow, setBarsPerRow] = useState(4);
  const [noteFit, setNoteFit] = useState(1);
  const fitRef = useRef(1);
  const [view, setView] = useState<"score" | "line">("score");
  const [followOpen, setFollowOpen] = useState(false);
  const [follow, setFollow] = useState<null | { phrase: number; kind: "listen" | "sing"; beat: number; beats: number }>(null);
  const [phraseMode, setPhraseMode] = useState<PhraseMode>("auto");
  const [listenTimes, setListenTimes] = useState(1);
  const [singClick, setSingClick] = useState(true);
  const [cueFirst, setCueFirst] = useState(false);
  const phrases = useMemo(() => splitPhrases(melody.bars, phraseMode), [melody.bars, phraseMode]);
  const activePhrase = follow ? phrases[follow.phrase] : null;
  const canFollow = !rhythmOnly && phrases.length > 1;
  const instrumentLabel = INSTRUMENTS.find((item) => item.id === instrument)?.label ?? "钢琴";

  const stop = useCallback(() => {
    const shouldAnnounceStop = playbackActive.current || samplerLoading.current;
    playRequestRef.current += 1;
    playbackActive.current = false;
    samplerLoading.current = false;
    stopRef.current();
    stopRef.current = () => {};
    setPlaying(false);
    setFollow(null);
    beatRef.current = -1;
    setCurrent([]);
    soundingCallback.current?.([], false);
    if (shouldAnnounceStop && mounted.current) setAnnouncement("已停止");
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; stop(); };
  }, [stop]);
  useEffect(() => {
    window.addEventListener(VOCAL_PLAYBACK_STARTED, stop);
    return () => window.removeEventListener(VOCAL_PLAYBACK_STARTED, stop);
  }, [stop]);
  // Bars sit on an even grid, 8, 4, 2 or 1 per row so phrases line up; notes may shrink to 80% to keep 4 a row.
  useEffect(() => {
    const score = scoreRef.current;
    if (!score) return;
    const fit = () => {
      const voice = score.querySelector<HTMLElement>(".melody-voice");
      const notePx = (voice ? parseFloat(getComputedStyle(voice).fontSize) || 20 : 20) / fitRef.current;
      const style = getComputedStyle(score);
      const room = score.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const barPx = (n: number, scale: number) => n * (widestBar * notePx * scale + 26);
      const count = Math.min([8, 4, 2].find((n) => barPx(n, 0.8) <= room) ?? 1, melody.bars.length);
      const scale = barPx(count, 1) <= room ? 1 : Math.max(0.8, room / barPx(count, 1));
      fitRef.current = scale;
      setBarsPerRow(count);
      setNoteFit(scale);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(score);
    return () => observer.disconnect();
  }, [widestBar, melody.bars.length, view]);

  /** Unlock audio and load the chosen instrument; null when the request was superseded. */
  const prepareAudio = async (request: number) => {
    window.dispatchEvent(new Event(MELODY_PLAYBACK_STARTED));
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) {
      setAudioMode("synth");
      setAnnouncement(instrumentLabel + "音色加载失败，改用电子音色");
      return null;
    }
    const ctx = getPianoAudioContext();
    let sampler = sharedSamplers[instrument] ?? null;
    let samplerLoadFailed = false;
    if (!rhythmOnly && !sampler) {
      samplerLoading.current = true;
      setLoadingSampler(true);
      setAnnouncement("载入" + instrumentLabel + "音色…");
      try {
        await ctx.resume();
        sampler = await loadInstrumentSampler(ctx, instrument);
        sharedSamplers[instrument] = sampler;
        if (mounted.current) setAudioMode("sampled");
      } catch {
        samplerLoadFailed = true;
        if (mounted.current) setAudioMode("synth");
      } finally {
        samplerLoading.current = false;
        if (mounted.current) setLoadingSampler(false);
      }
    } else {
      await ctx.resume().catch(() => undefined);
      if (sampler && mounted.current) setAudioMode("sampled");
    }
    // The reader may have left the lesson while the samples were loading.
    if (!mounted.current || request !== playRequestRef.current) return null;
    return { ctx, sampler, samplerLoadFailed };
  };

  /** Schedule notes [from, to) of one voice from time t0; returns each note's start time and the end. */
  const scheduleRange = (ctx: AudioContext, master: AudioNode, sampler: InstrumentSampler | null, voice: number, from: number, to: number, t0: number, beat: number, levelScale = 1) => {
    const notes = flats[voice];
    const times: number[] = [];
    let t = t0;
    for (let index = from; index < to; index += 1) {
      const note = notes[index];
      times.push(t);
      const duration = note.b * beat;
      // A tied note extends the previous tone instead of re-attacking.
      if (note.d && !note.tie) {
        let length = duration;
        for (let k = index + 1; k < to && notes[k].tie; k += 1) length += notes[k].b * beat;
        if (note.d === 9) {
          const percussion = { wave: "triangle" as OscillatorType, overtone: 0.15, level: 0.8 * levelScale };
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
          const level = (voice === 0 ? 1 : voice === 1 ? 0.7 : 0.58) * levelScale;
          playInstrumentSample(ctx, instrument, sampler, midiOf(melody, note), t, length, master, level);
        } else {
          const frequency = 440 * Math.pow(2, (midiOf(melody, note) - 69) / 12);
          const timbre = TIMBRES[voice] ?? TIMBRES[2];
          for (const [wave, level, multiple] of [[timbre.wave, timbre.level * levelScale, 1], ["sine" as OscillatorType, timbre.level * timbre.overtone * levelScale, 2]] as const) {
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
    }
    return { times, end: t };
  };

  const play = async () => {
    if (playing || follow) { stop(); return; }
    const request = ++playRequestRef.current;
    const audio = await prepareAudio(request);
    if (!audio) return;
    const { ctx, sampler, samplerLoadFailed } = audio;

    const beat = 60 / tempo;
    const start = ctx.currentTime + 0.12;
    const master = ctx.createGain();
    master.gain.value = lines.length > 1 ? 0.24 : 0.34;
    master.connect(ctx.destination);
    let end = start;
    const timeline = flats.map((notes, voice) => {
      if (!enabled[voice]) {
        // Muted voices still advance so their notes keep highlighting in step.
        let t = start;
        return notes.map((note) => { const at = t; t += note.b * beat; end = Math.max(end, t); return at; });
      }
      const scheduled = scheduleRange(ctx, master, sampler, voice, 0, notes.length, start, beat);
      end = Math.max(end, scheduled.end);
      return scheduled.times;
    });
    let raf = 0;
    let previousNotes = "";
    const tick = () => {
      const now = ctx.currentTime;
      if (now >= end) { stop(); return; }
      beatRef.current = now < start ? -1 : (now - start) / beat;
      const indices = timeline.map((times) => {
        if (now < start) return -1;
        let index = times.length - 1;
        while (index > 0 && times[index] > now) index -= 1;
        return index;
      });
      setCurrent(indices);
      const notes = indices.flatMap((index, voice) => {
        const note = flats[voice][index];
        return enabled[voice] && note?.d && note.d !== 9 ? [midiOf(melody, note)] : [];
      });
      if (notes.join(",") !== previousNotes) {
        previousNotes = notes.join(",");
        soundingCallback.current?.(notes, true);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    stopRef.current = () => {
      cancelAnimationFrame(raf);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
      setTimeout(() => master.disconnect(), 100);
    };
    playbackActive.current = true;
    setPlaying(true);
    setAnnouncement(samplerLoadFailed ? instrumentLabel + "音色加载失败，改用电子音色。开始播放" : "开始播放");
  };

  /**
   * 跟唱: the instrument plays a phrase (once or twice), then the class sings
   * it back in the same time while the beat lights flash, phrase by phrase.
   */
  const startFollow = async (fromPhrase: number) => {
    stop();
    const first = Math.max(0, Math.min(phrases.length - 1, fromPhrase));
    const request = ++playRequestRef.current;
    const audio = await prepareAudio(request);
    if (!audio) return;
    const { ctx, sampler } = audio;
    const beat = 60 / tempo;
    const master = ctx.createGain();
    master.gain.value = 0.34;
    master.connect(ctx.destination);
    type Segment = { phrase: number; kind: "listen" | "sing"; t0: number; t1: number; times: number[] };
    const segments: Segment[] = [];
    let t = ctx.currentTime + 0.15;
    for (let p = first; p < phrases.length; p += 1) {
      const phrase = phrases[p];
      let lastListen: Segment | null = null;
      for (let round = 0; round < listenTimes; round += 1) {
        const scheduled = scheduleRange(ctx, master, sampler, 0, phrase.startNote, phrase.endNote, t, beat);
        lastListen = { phrase: p, kind: "listen", t0: t, t1: scheduled.end, times: scheduled.times };
        segments.push(lastListen);
        t = scheduled.end;
      }
      const singStart = t;
      const singTimes = lastListen!.times.map((at) => at - lastListen!.t0 + singStart);
      const singEnd = singStart + (phrase.endBeat - phrase.startBeat) * beat;
      if (cueFirst) {
        // A quiet reminder of the first sung pitch, as a teacher would hum it.
        const offset = flats[0].slice(phrase.startNote, phrase.endNote).findIndex((note) => note.d >= 1 && note.d <= 7);
        if (offset >= 0) {
          const index = phrase.startNote + offset;
          const cueLength = Math.min(0.45, beat * 0.6);
          scheduleRange(ctx, master, sampler, 0, index, index + 1, singStart - cueLength - 0.05, cueLength / flats[0][index].b, 0.32);
        }
      }
      if (singClick) {
        for (let at = singStart; at < singEnd - 1e-3; at += beat) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine"; osc.frequency.value = 1320;
          gain.gain.setValueAtTime(0.0001, at);
          gain.gain.exponentialRampToValueAtTime(0.09, at + 0.004);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
          osc.connect(gain).connect(master);
          osc.start(at); osc.stop(at + 0.08);
        }
      }
      segments.push({ phrase: p, kind: "sing", t0: singStart, t1: singEnd, times: singTimes });
      t = singEnd;
    }
    const end = t;
    let raf = 0;
    let previous = "";
    const tick = () => {
      const now = ctx.currentTime;
      if (now >= end) { stop(); setAnnouncement("跟唱完成"); return; }
      const segment = segments.find((item) => now < item.t1) ?? segments[segments.length - 1];
      const started = now >= segment.t0;
      let index = segment.times.length - 1;
      while (index > 0 && segment.times[index] > now) index -= 1;
      const phrase = phrases[segment.phrase];
      const beatInPhrase = started ? Math.floor((now - segment.t0) / beat) : -1;
      beatRef.current = started ? phrase.startBeat + (now - segment.t0) / beat : -1;
      const key = `${segment.phrase}:${segment.kind}:${beatInPhrase}:${started ? index : -1}`;
      if (key !== previous) {
        previous = key;
        setCurrent(started ? [phrase.startNote + index] : [-1]);
        setFollow({ phrase: segment.phrase, kind: segment.kind, beat: beatInPhrase, beats: Math.round(phrase.endBeat - phrase.startBeat) });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    stopRef.current = () => {
      cancelAnimationFrame(raf);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
      setTimeout(() => master.disconnect(), 100);
    };
    playbackActive.current = true;
    setFollow({ phrase: first, kind: "listen", beat: -1, beats: Math.round(phrases[first].endBeat - phrases[first].startBeat) });
    setAnnouncement(`跟唱开始，第 ${first + 1} 句`);
  };

  const renderNoteHead = (note: MelodyNote, key: number | string, active: boolean, beamSegments?: BeamFragment[]) => {
    const { lines: underlines, dotted, dashes } = notation(note);
    const fragments = beamSegments ?? Array.from({ length: underlines }, (_, index) => ({ level: index + 1, edge: "single" as const }));
    const octave = note.o ?? 0;
    const hasAccidental = note.a != null;
    return <span key={key} aria-hidden="true" className={`melody-head-cell ${active ? "is-active" : ""} ${note.tie ? "is-tie" : ""} ${hasAccidental ? "has-accidental" : ""}`}>
      <span className="melody-digit">
        <span className="melody-digit-highlight" />
        {hasAccidental ? <sup className="melody-accidental">{note.a === 0 ? "♮" : note.a! > 0 ? "♯" : "♭"}</sup> : null}
        {note.d === 9 ? "×" : note.d || "0"}
        {dotted && <i className="melody-dot">·</i>}
        {Array.from({ length: Math.abs(octave) }, (_, index) => <i key={`octave-${index}`} className="melody-octave-dot" style={{ top: `${octave > 0 ? -0.18 - index * 0.2 : lowDotTop(note) - 0.4 + index * 0.2}em` }} />)}
      </span>
      {fragments.map((run, index) => <i key={`beam-${run.level}-${index}`} className={`melody-beam-segment is-${run.edge}`} style={{ top: `${UNDERLINE_TOP + (run.level - 1) * UNDERLINE_GAP}em` }} />)}
      {/* Each dash sits where its beat starts, lined up with the digit above the beat. */}
      {Array.from({ length: dashes }, (_, k) => <span key={k} className="melody-dash" style={{ left: `calc(${((k + 1) / (dashes + 1)) * 100}% + ${hasAccidental ? 0.52 : 0.32}em)` }}>–</span>)}
    </span>;
  };
  const renderNoteLyric = (note: MelodyNote, active: boolean, key: number | string) => {
    const hasAccidental = note.a != null;
    return <span key={key} aria-hidden="true" className={`melody-lyric-cell ${active ? "is-active" : ""} ${hasAccidental ? "has-accidental" : ""}`}><span className="melody-lyric">{note.lyric || " "}</span></span>;
  };
  // Every note or beam group takes room in proportion to its beats, so parallel voices line up.
  const renderNote = (note: MelodyNote, key: number, active: boolean) =>
    <span key={key} aria-hidden="true" className={`melody-note ${active ? "is-active" : ""} ${note.tie ? "is-tie" : ""}`} style={{ flex: `${note.b} 1 0%`, minWidth: `${(note.a != null ? 1.5 : 1.1) + notation(note).dashes * 1.1}em` }}>
      {renderNoteHead(note, `head-${key}`, active)}
      {renderNoteLyric(note, active, `lyric-${key}`)}
    </span>;

  return <div className={`melody-player ${large ? "is-large" : ""} ${lines.length > 1 ? "is-choral" : ""}`}>
    {melody.title && !large && <p className="melody-title">{melody.title}</p>}
    {melody.quality === "draft" && <p className="melody-draft">自动识谱草稿 · 待人工核对。音高、节奏或调号可能有误，请对照教材原谱。</p>}
    <div className="melody-controls">
      <button type="button" className={`melody-play ${playing ? "is-playing" : ""}`} onClick={() => void play()} disabled={loadingSampler || !!follow} aria-label={loadingSampler ? "载入" + instrumentLabel + "音色…" : playing ? "停止" : rhythmOnly ? "播放节奏" : lines.length > 1 ? "播放合唱" : "播放旋律"}>
        {!loadingSampler && (playing ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>)}
        {loadingSampler ? "载入" + instrumentLabel + "音色…" : playing ? "停止" : rhythmOnly ? "播放节奏" : lines.length > 1 ? "播放合唱" : "播放旋律"}
      </button>
      {canFollow && <button type="button" className={`melody-follow-toggle${followOpen ? " is-open" : ""}`} aria-expanded={followOpen} onClick={() => { if (follow) stop(); setFollowOpen((open) => !open); }}>跟唱</button>}
      <span role="status" aria-live="polite" aria-atomic="true" style={VISUALLY_HIDDEN}>{announcement}</span>
      <span className="melody-key">{melody.key} · {displayMeter(melody.meter)}</span>
      <label className="melody-instrument">音色
        <select value={instrument} disabled={playing || loadingSampler} onChange={(event) => { setInstrument(event.target.value as InstrumentId); setAudioMode("unknown"); }}>
          {INSTRUMENTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      {lines.length > 1 && <span className="melody-voices" role="group" aria-label="选择声部">
        {lines.map((line, k) => <label key={line.label} className={`voice-${k}`}>
          <input type="checkbox" checked={enabled[k]} disabled={playing || loadingSampler} onChange={(event) => setEnabled((value) => value.map((item, i) => (i === k ? event.target.checked : item)))} />
          {line.label}
        </label>)}
      </span>}
      {!rhythmOnly && <span className="melody-view" role="radiogroup" aria-label="显示方式">
        {([["score", "谱子"], ["line", "旋律线"]] as const).map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={view === value} className={view === value ? "is-active" : ""} onClick={() => setView(value)}>{label}</button>)}
      </span>}
      <label className="melody-tempo">速度
        <input type="range" min={40} max={160} step={4} value={tempo} aria-valuetext={`每分钟 ${tempo} 拍`} disabled={playing || loadingSampler || !!follow} onChange={(event) => setTempo(Number(event.target.value))} />
        <b>♩={tempo}</b>
      </label>
    </div>
    {canFollow && followOpen && <div className={`melody-follow${follow ? ` is-${follow.kind}` : ""}`} role="group" aria-label="跟唱">
      {follow ? <>
        <div className="melody-follow-status">
          <span className="melody-follow-count">第 {follow.phrase + 1} / {phrases.length} 句</span>
          <strong>{follow.kind === "listen" ? "先听这一句" : "轮到你们唱！"}</strong>
          <span className="melody-follow-beats" aria-hidden="true">{Array.from({ length: follow.beats }, (_, k) => <i key={k} className={k === follow.beat ? "is-on" : k < follow.beat ? "is-past" : ""} />)}</span>
        </div>
        <div className="melody-follow-actions">
          <button type="button" onClick={() => void startFollow(follow.phrase - 1)} disabled={follow.phrase === 0}>上一句</button>
          <button type="button" onClick={() => void startFollow(follow.phrase)}>重来这句</button>
          <button type="button" onClick={() => void startFollow(follow.phrase + 1)} disabled={follow.phrase >= phrases.length - 1}>下一句</button>
          <button type="button" className="is-end" onClick={stop}>结束跟唱</button>
        </div>
      </> : <>
        <div className="melody-follow-settings">
          <span className="melody-follow-field">分句
            {([["auto", "自动"], [2, "2 小节"], [4, "4 小节"]] as const).map(([value, label]) => <button key={label} type="button" aria-pressed={phraseMode === value} className={phraseMode === value ? "is-active" : ""} onClick={() => setPhraseMode(value)}>{label}</button>)}
          </span>
          <span className="melody-follow-field">每句听
            {[1, 2].map((times) => <button key={times} type="button" aria-pressed={listenTimes === times} className={listenTimes === times ? "is-active" : ""} onClick={() => setListenTimes(times)}>{times} 遍</button>)}
          </span>
          <label className="melody-follow-check"><input type="checkbox" checked={singClick} onChange={(event) => setSingClick(event.target.checked)} />学生唱时有轻声拍点</label>
          <label className="melody-follow-check"><input type="checkbox" checked={cueFirst} onChange={(event) => setCueFirst(event.target.checked)} />轻声提示第一个音</label>
        </div>
        <div className="melody-follow-start">
          <button type="button" className="melody-follow-go" onClick={() => void startFollow(0)} disabled={loadingSampler}>▶ 开始跟唱</button>
          <span>共 {phrases.length} 句，从第
            {phrases.map((phrase, k) => <button key={k} type="button" className="melody-follow-chip" onClick={() => void startFollow(k)} aria-label={`从第 ${k + 1} 句开始（第 ${phrase.startBar + 1}–${phrase.endBar} 小节）`}>{k + 1}</button>)}
          句开始</span>
        </div>
      </>}
    </div>}
    {view === "line" && !rhythmOnly ? <MelodyLine notes={flats[0]} bars={melody.bars} phrases={phrases} current={current[0] ?? -1} activePhrase={follow ? follow.phrase : null} singing={follow?.kind === "sing"} beatRef={beatRef} /> :
    <div ref={scoreRef} className="melody-score" style={{ "--bars": barsPerRow, "--melody-fit": noteFit } as CSSProperties} role="img" aria-label={`简谱旋律，共 ${melody.bars.length} 小节，${melody.key}，${displayMeter(melody.meter)} 拍`}>
      {melody.bars.map((_, barIndex) => <span key={barIndex} className={`melody-bar${activePhrase && (barIndex < activePhrase.startBar || barIndex >= activePhrase.endBar) ? " is-dim" : ""}`}>
        {lines.map((line, voice) => {
          const notes = line.bars[barIndex] ?? [];
          const runsByLevel = beamRuns[voice]?.[barIndex] ?? new Map<number, Map<number, BeamRun>>();
          const rendered: ReturnType<typeof renderNote>[] = [];

          function renderBeamGroup(start: number, end: number): ReturnType<typeof renderNote> {
            const groupNotes = notes.slice(start, end + 1);
            const containedRuns = [...runsByLevel.entries()].flatMap(([level, levelRuns]) =>
              [...levelRuns.values()].filter((run) => run.start >= start && run.end <= end).map((run) => ({ ...run, level })),
            );
            return <span key={`beam-${start}-${end}`} className="melody-beam-group" style={{ gridTemplateColumns: `repeat(${groupNotes.length}, max-content)`, flex: `${groupNotes.reduce((sum, note) => sum + note.b, 0)} 1 0%` }}>
              {groupNotes.map((note, offset) => {
                const index = start + offset;
                const active = offsets[voice][barIndex] + index === current[voice];
                const noteBeams: BeamFragment[] = containedRuns.filter((run) => index >= run.start && index <= run.end).map((run) => ({
                  level: run.level,
                  edge: run.start === run.end ? "single" : run.start === index ? "start" : run.end === index ? "end" : "middle",
                }));
                return renderNoteHead(note, `head-${index}`, active, noteBeams);
              })}
              {groupNotes.map((note, offset) => renderNoteLyric(note, offsets[voice][barIndex] + start + offset === current[voice], `lyric-${start + offset}`))}
            </span>;
          }

          for (let noteIndex = 0; noteIndex < notes.length;) {
            const run = runsByLevel.get(1)?.get(noteIndex);
            if (run) {
              rendered.push(renderBeamGroup(run.start, run.end));
              noteIndex = run.end + 1;
            } else {
              const note = notes[noteIndex];
              rendered.push(renderNote(note, noteIndex, offsets[voice][barIndex] + noteIndex === current[voice]));
              noteIndex += 1;
            }
          }
          return <span key={voice} className={`melody-voice voice-${voice}`} style={{ "--melody-head-height": `${headHeights[voice]}em` } as CSSProperties}>{rendered}</span>;
        })}
      </span>)}
    </div>}
    {/* Source notes and sample credits live in the home page footer; only a fallback warning shows here. */}
    {!rhythmOnly && audioMode === "synth" && <p className="melody-source">所选音色未能载入，暂用电子音色示范。</p>}
  </div>;
}
