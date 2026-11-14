"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPianoAudioContext } from "../../lib/lesson/piano-sampler";
import { loadPercussionStrokes, playPercussion, type PercussionKind } from "../../lib/lesson/percussion";
import {
  METER_BY_ID, RHYTHM_PATTERNS, fitsMeter, generateRhythm, packBars, timeline,
  type MeterId, type RhythmBar, type TimedToken,
} from "../../lib/rhythm/patterns";
import { PatternGlyph, RhythmScore } from "../rhythm/RhythmScore";

/** 节奏创编：两三件打击乐器，各编一行节奏，合起来听。 */

type Voice = { id: number; kind: PercussionKind; ids: string[]; muted: boolean };
type Saved = { meterId: MeterId; barCount: number; bpm: number; voices: Voice[] };

const INSTRUMENTS: Array<{ kind: PercussionKind; label: string; caption: string }> = [
  { kind: "roundDrum", label: "鼓", caption: "低沉，适合打稳稳的拍子" },
  { kind: "woodBlock", label: "双响筒", caption: "清脆，适合密一点的节奏" },
  { kind: "smallGong", label: "小锣", caption: "明亮，适合点在重要的地方" },
  { kind: "smallCymbal", label: "小镲", caption: "沙沙的，适合填在空拍里" },
  { kind: "bigGong", label: "大锣", caption: "余音长，一小节敲一下就够" },
];
const LABEL_OF = new Map(INSTRUMENTS.map((item) => [item.kind, item.label]));
const METER_IDS: MeterId[] = ["2/4", "3/4", "4/4"];
const BAR_COUNTS = [2, 4, 8];
const MAX_VOICES = 4;
const STORE = "yapu-beat";
/** 创编用的节奏型：基础和进阶两级，够编出有变化的合奏。 */
const PALETTE = RHYTHM_PATTERNS.filter((pattern) => pattern.family === "simple" && pattern.level <= 2);
const STARTER: Voice[] = [
  { id: 1, kind: "roundDrum", ids: [], muted: false },
  { id: 2, kind: "woodBlock", ids: [], muted: false },
];

function click(context: AudioContext, out: AudioNode, at: number, downbeat: boolean) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "square";
  osc.frequency.value = downbeat ? 1760 : 1180;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(downbeat ? 0.1 : 0.06, at + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.035);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + 0.05);
}

function readSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORE);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    if (!METER_IDS.includes(saved.meterId) || !Array.isArray(saved.voices) || !saved.voices.length) return null;
    const voices = saved.voices.slice(0, MAX_VOICES)
      .filter((voice) => LABEL_OF.has(voice.kind) && Array.isArray(voice.ids))
      .map((voice, index) => ({ id: index + 1, kind: voice.kind, ids: voice.ids.filter((id) => PALETTE.some((pattern) => pattern.id === id)), muted: Boolean(voice.muted) }));
    if (!voices.length) return null;
    return { meterId: saved.meterId, barCount: BAR_COUNTS.includes(saved.barCount) ? saved.barCount : 4, bpm: Math.min(132, Math.max(56, Number(saved.bpm) || 88)), voices };
  } catch { return null; }
}

export function BeatPage() {
  const [meterId, setMeterId] = useState<MeterId>("2/4");
  const [barCount, setBarCount] = useState(4);
  const [bpm, setBpm] = useState(88);
  const [voices, setVoices] = useState<Voice[]>(STARTER);
  const [current, setCurrent] = useState(1);
  const [metronome, setMetronome] = useState(false);
  const [loop, setLoop] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [activeKeys, setActiveKeys] = useState<Record<number, string | null>>({});
  const [message, setMessage] = useState("");
  const stopRef = useRef<(() => void) | null>(null);
  const nextId = useRef(3);

  // 上次编到一半的合奏留在这台电脑上。
  const loaded = useRef(false);
  useEffect(() => {
    const saved = readSaved();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from browser storage after mount */
    if (saved) {
      setMeterId(saved.meterId); setBarCount(saved.barCount); setBpm(saved.bpm); setVoices(saved.voices);
      setCurrent(saved.voices[0].id);
      nextId.current = saved.voices.length + 1;
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try { window.localStorage.setItem(STORE, JSON.stringify({ meterId, barCount, bpm, voices } satisfies Saved)); } catch { /* storage may be unavailable */ }
  }, [meterId, barCount, bpm, voices]);

  const meter = METER_BY_ID.get(meterId)!;
  const palette = useMemo(() => PALETTE.filter((pattern) => fitsMeter(pattern, meter)), [meter]);
  // 每个声部排进小节，不满的小节留空拍，总是画够选定的小节数。
  const scores = useMemo(() => voices.map((voice) => {
    const packed = packBars(voice.ids, meter);
    const bars: RhythmBar[] = Array.from({ length: barCount }, (_, index) => packed[index] ?? { groups: [], empty: meter.beats });
    return { voice, bars, tokens: timeline(bars, meter) };
  }), [voices, meter, barCount]);
  const active = scores.find((item) => item.voice.id === current) ?? scores[0];
  const totalBeats = barCount * meter.beats;
  const fits = (ids: string[]) => packBars(ids, meter).length <= barCount;

  const stop = useCallback(() => { stopRef.current?.(); stopRef.current = null; setPlaying(false); setActiveKeys({}); }, []);
  useEffect(() => () => { stopRef.current?.(); }, []);

  const changeVoices = (next: Voice[]) => { stop(); setVoices(next); };
  const updateVoice = (id: number, patch: Partial<Voice>) => changeVoices(voices.map((voice) => (voice.id === id ? { ...voice, ...patch } : voice)));

  const audition = async (kind: PercussionKind) => {
    const context = getPianoAudioContext();
    void context.resume();
    await loadPercussionStrokes(context);
    playPercussion(context, context.destination, kind, context.currentTime + 0.02, 0.9);
  };

  const add = (patternId: string) => {
    if (!active) return;
    const next = [...active.voice.ids, patternId];
    if (!fits(next)) { setMessage(`${LABEL_OF.get(active.voice.kind)}这一行已经排满 ${barCount} 小节了。`); return; }
    setMessage("");
    updateVoice(active.voice.id, { ids: next });
    void audition(active.voice.kind);
  };
  const undo = () => { if (active?.voice.ids.length) { setMessage(""); updateVoice(active.voice.id, { ids: active.voice.ids.slice(0, -1) }); } };
  const clear = () => { if (active) { setMessage(""); updateVoice(active.voice.id, { ids: [] }); } };
  const inspire = () => {
    if (!active) return;
    setMessage("");
    updateVoice(active.voice.id, { ids: generateRhythm(palette.filter((pattern) => pattern.level === 1 || pattern.id === "ess" || pattern.id === "re").map((pattern) => pattern.id), meter, barCount) });
  };
  const addVoice = () => {
    if (voices.length >= MAX_VOICES) return;
    const unused = INSTRUMENTS.find((item) => !voices.some((voice) => voice.kind === item.kind)) ?? INSTRUMENTS[0];
    const voice: Voice = { id: nextId.current++, kind: unused.kind, ids: [], muted: false };
    changeVoices([...voices, voice]);
    setCurrent(voice.id);
    void audition(voice.kind);
  };
  const removeVoice = (id: number) => {
    const next = voices.filter((voice) => voice.id !== id);
    if (!next.length) return;
    changeVoices(next);
    if (current === id) setCurrent(next[0].id);
  };
  const changeMeter = (next: MeterId) => {
    if (next === meterId) return;
    const nextMeter = METER_BY_ID.get(next)!;
    stop();
    setMeterId(next);
    // 换拍号后装不下的节奏型从后面去掉。
    setVoices(voices.map((voice) => {
      let ids = voice.ids.filter((id) => fitsMeter(RHYTHM_PATTERNS.find((pattern) => pattern.id === id)!, nextMeter));
      while (ids.length && packBars(ids, nextMeter).length > barCount) ids = ids.slice(0, -1);
      return { ...voice, ids };
    }));
  };
  const changeBarCount = (next: number) => {
    stop();
    setBarCount(next);
    setVoices(voices.map((voice) => {
      let ids = voice.ids;
      while (ids.length && packBars(ids, meter).length > next) ids = ids.slice(0, -1);
      return { ...voice, ids };
    }));
  };

  const hasNotes = scores.some((item) => item.voice.ids.length > 0);

  const play = async () => {
    if (playing) { stop(); return; }
    const sounding = scores.filter((item) => !item.voice.muted && item.voice.ids.length);
    if (!sounding.length) { setMessage("先给一件乐器排上节奏，再播放。"); return; }
    setMessage("");
    const context = getPianoAudioContext();
    void context.resume();
    await loadPercussionStrokes(context);
    const master = context.createGain();
    master.gain.value = 0.9;
    master.connect(context.destination);
    const secPerBeat = 60 / bpm;
    const passSeconds = totalBeats * secPerBeat;
    const origin = context.currentTime + 0.15;
    let stopped = false;
    let scheduled = 0;
    let timer: number | undefined;
    let frame = 0;
    const schedulePass = (pass: number) => {
      const start = origin + pass * passSeconds;
      if (metronome) for (let beat = 0; beat < totalBeats; beat++) click(context, master, start + beat * secPerBeat, beat % meter.beats === 0);
      for (const item of sounding) {
        for (const token of item.tokens) {
          if (!token.sounding) continue;
          playPercussion(context, master, item.voice.kind, start + token.start * secPerBeat, Math.abs(token.start % meter.beats) < 1e-6 ? 1 : 0.78);
        }
      }
    };
    const pump = () => {
      if (stopped) return;
      while ((loop || scheduled === 0) && origin + scheduled * passSeconds < context.currentTime + 0.6) schedulePass(scheduled++);
      timer = window.setTimeout(pump, 120);
    };
    const tokenAt = (tokens: TimedToken[], at: number) => tokens.find((token) => at >= token.start - 1e-6 && at < token.start + token.dur - 1e-6)?.key ?? null;
    const tick = () => {
      if (stopped) return;
      const elapsed = context.currentTime - origin;
      if (!loop && elapsed >= passSeconds + 0.3) { stop(); return; }
      const at = elapsed < 0 ? -1 : (elapsed % passSeconds) / secPerBeat;
      const next: Record<number, string | null> = {};
      for (const item of scores) next[item.voice.id] = at < 0 || item.voice.muted ? null : tokenAt(item.tokens, at);
      setActiveKeys((previous) => (scores.every((item) => previous[item.voice.id] === next[item.voice.id]) ? previous : next));
      frame = window.requestAnimationFrame(tick);
    };
    stopRef.current = () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      master.gain.setTargetAtTime(0, context.currentTime, 0.02);
      window.setTimeout(() => master.disconnect(), 400);
    };
    setPlaying(true);
    pump();
    frame = window.requestAnimationFrame(tick);
  };

  // 创编提示：只说从谱面上数得出来的事。
  const hints = useMemo(() => {
    const list: string[] = [];
    const written = scores.filter((item) => item.voice.ids.length);
    if (!written.length) return ["先选一件乐器，点下面的节奏卡片，一张一张排进去。每点一下都能听到这件乐器的声音。"];
    const filledBeats = (bars: RhythmBar[]) => bars.reduce((sum, bar) => sum + meter.beats - bar.empty, 0);
    const unfinished = written.filter((item) => filledBeats(item.bars) < totalBeats - 1e-6);
    if (unfinished.length) list.push(`${unfinished.map((item) => LABEL_OF.get(item.voice.kind)).join("、")}还没排满 ${barCount} 小节，空着的拍子不出声。`);
    if (written.length === 1 && voices.length > 1) list.push("再给另一件乐器排一行，两件乐器合起来才是合奏。");
    if (written.length >= 2) {
      const onsets = written.map((item) => new Set(item.tokens.filter((token) => token.sounding).map((token) => token.start.toFixed(3))));
      const same = written.some((a, i) => written.some((b, j) => j > i && a.voice.ids.join() === b.voice.ids.join()));
      if (same) list.push("有两件乐器的节奏一模一样。把其中一件改疏一点或密一点，层次就出来了。");
      const shared = [...onsets[0]].filter((start) => onsets.slice(1).every((set) => set.has(start))).length;
      const most = Math.max(...onsets.map((set) => set.size));
      if (!same && most && shared / most > 0.8) list.push("几件乐器几乎总是同时敲。试着让一件乐器休止，另一件填进来，像一问一答。");
      if (!same && most && shared / most <= 0.8) list.push("几件乐器有同时敲的地方，也有错开的地方，听起来有层次。");
    }
    return list;
  }, [scores, voices.length, barCount, totalBeats, meter]);

  return <section className="rhythm-lab beat-lab" aria-labelledby="beat-title">
    <header className="beat-intro">
      <div>
        <p className="beat-kicker">节奏创编</p>
        <h2 id="beat-title">几件打击乐器，编一段合奏</h2>
      </div>
      <p className="beat-note">给每件乐器排一行节奏，合在一起听。</p>
    </header>

    <div className="beat-settings">
      <div className="beat-field">
        <span className="beat-label">拍号</span>
        <div className="beat-chips" role="radiogroup" aria-label="拍号">
          {METER_IDS.map((id) => <button key={id} type="button" role="radio" aria-checked={meterId === id} className={meterId === id ? "is-active" : ""} onClick={() => changeMeter(id)}>{id}</button>)}
        </div>
      </div>
      <div className="beat-field">
        <span className="beat-label">长度</span>
        <div className="beat-chips" role="radiogroup" aria-label="小节数">
          {BAR_COUNTS.map((count) => <button key={count} type="button" role="radio" aria-checked={barCount === count} className={barCount === count ? "is-active" : ""} onClick={() => changeBarCount(count)}>{count} 小节</button>)}
        </div>
      </div>
      <label className="beat-field beat-tempo">
        <span className="beat-label">速度</span>
        <input type="range" min={56} max={132} step={4} value={bpm} onChange={(event) => { stop(); setBpm(Number(event.target.value)); }} />
        <b>♩={bpm}</b>
      </label>
    </div>

    <div className="beat-workbench">
      <div className="beat-score" aria-label="合奏谱">
        {scores.map(({ voice, bars }) => {
          const on = voice.id === active?.voice.id;
          return <div key={voice.id} className={`beat-voice${on ? " is-current" : ""}${voice.muted ? " is-muted" : ""}`}>
            <div className="beat-voice-head">
              <button type="button" className="beat-voice-name" aria-pressed={on} onClick={() => setCurrent(voice.id)}>{LABEL_OF.get(voice.kind)}<small>{on ? "正在编这一行" : "点这里编这一行"}</small></button>
              <label className="beat-voice-kind">乐器
                <select value={voice.kind} aria-label="换乐器" onChange={(event) => { const kind = event.target.value as PercussionKind; updateVoice(voice.id, { kind }); void audition(kind); }}>
                  {INSTRUMENTS.map((item) => <option key={item.kind} value={item.kind}>{item.label}</option>)}
                </select>
              </label>
              <label className="beat-voice-mute"><input type="checkbox" checked={!voice.muted} onChange={(event) => updateVoice(voice.id, { muted: !event.target.checked })} />出声</label>
              {voices.length > 1 && <button type="button" className="beat-voice-remove" onClick={() => removeVoice(voice.id)}>删除这一行</button>}
            </div>
            <div className="beat-voice-score" onClick={() => setCurrent(voice.id)}>
              <RhythmScore bars={bars} meter={meter} activeKey={activeKeys[voice.id] ?? null} countdown={null} />
            </div>
          </div>;
        })}
        {voices.length < MAX_VOICES && <button type="button" className="beat-add-voice" onClick={addVoice}>＋ 再加一件乐器</button>}
      </div>

      <div className="beat-side">
        <div className="beat-transport">
          <button type="button" className="beat-primary" onClick={() => void play()} disabled={!hasNotes}>{playing ? "■ 停止" : "▶ 播放合奏"}</button>
          <label><input type="checkbox" checked={loop} onChange={(event) => { stop(); setLoop(event.target.checked); }} />循环</label>
          <label><input type="checkbox" checked={metronome} onChange={(event) => { stop(); setMetronome(event.target.checked); }} />节拍器</label>
        </div>

        {active && <div className="beat-palette">
          <p className="beat-label">给「{LABEL_OF.get(active.voice.kind)}」排节奏 · 点一张卡片排进去</p>
          <p className="beat-caption">{INSTRUMENTS.find((item) => item.kind === active.voice.kind)!.caption}。</p>
          <div className="beat-cards">
            {palette.map((pattern) => <button key={pattern.id} type="button" className="beat-card" onClick={() => add(pattern.id)} aria-label={`${pattern.name}，${pattern.beats} 拍`}>
              <PatternGlyph pattern={pattern} fit />
              <span>{pattern.name}</span>
            </button>)}
          </div>
          <div className="beat-actions">
            <button type="button" className="beat-spark" onClick={inspire}>✦ 给这一行一点灵感</button>
            <button type="button" onClick={undo} disabled={!active.voice.ids.length}>退一步</button>
            <button type="button" onClick={clear} disabled={!active.voice.ids.length}>清空这一行</button>
          </div>
          {message && <p className="beat-message" role="status">{message}</p>}
        </div>}

        <ul className="beat-hints" aria-label="创编提示">
          {hints.map((hint) => <li key={hint}>{hint}</li>)}
        </ul>
      </div>
    </div>
  </section>;
}
