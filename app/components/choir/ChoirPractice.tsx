"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPianoAudioContext } from "../../lib/lesson/piano-sampler";
import { IN_TUNE_CENTS, centsOff, detectPitch, hzToMidi, noteName } from "../../lib/lesson/pitch";
import { MelodyPlayer, type PlaybackClock } from "../lesson/MelodyPlayer";
import { STEPS, foldTo, judge, targetNotes, type ChoirPiece, type Reading, type StepId, type TargetNote, type Verdict } from "./choir-model";

/** 分声部练习：挑一个声部，先听合唱，再按“听一听、跟着唱、独立唱”三步练熟；可以打开麦克风看唱得准不准。课本合唱和自己编的合唱都用它。 */

type Saved = { part: number; step: StepId };
function readSaved(key: string): Partial<Saved> {
  try { return JSON.parse(window.localStorage.getItem(key) ?? "{}") as Partial<Saved>; } catch { return {}; }
}
function writeSaved(key: string, value: Saved) {
  try { window.localStorage.setItem(key, JSON.stringify({ ...readSaved(key), ...value })); } catch { /* private mode */ }
}

type MicState = "off" | "asking" | "on" | "denied" | "unavailable";

export function ChoirPractice({ piece, playerKey, notation, preferVocal, storeKey }: {
  piece: ChoirPiece;
  /** Changes whenever the score changes, so the player starts over with the new music. */
  playerKey: string;
  notation: "jianpu" | "staff";
  preferVocal?: boolean;
  /** Where the chosen part and step are remembered. */
  storeKey: string;
}) {
  // 这个工具只在浏览器里载入，直接读上次的选择；不先写入默认值，免得盖掉另一个模式里记下的选择。
  const [part, setPart] = useState(() => {
    const saved = typeof window === "undefined" ? {} : readSaved(storeKey);
    return typeof saved.part === "number" ? saved.part : 0;
  });
  const [step, setStep] = useState<StepId>(() => {
    const saved = typeof window === "undefined" ? {} : readSaved(storeKey);
    return STEPS.find((item) => item.id === saved.step)?.id ?? "listen";
  });
  const myPart = piece.parts.some((item) => item.index === part) ? part : piece.parts[0]?.index ?? 0;
  const firstWrite = useRef(true);
  useEffect(() => {
    // The first pass only echoes what was read; a fallback part for this piece is not a choice worth remembering.
    if (firstWrite.current) { firstWrite.current = false; return; }
    writeSaved(storeKey, { part: myPart, step });
  }, [storeKey, myPart, step]);

  const stepInfo = STEPS.find((item) => item.id === step)!;
  const partLevels = useMemo(() => piece.labels.map((_, index) => (index === myPart ? stepInfo.mine : stepInfo.others)), [piece, myPart, stepInfo]);
  const notes = useMemo(() => targetNotes(piece.melody, myPart), [piece, myPart]);

  // ---- 麦克风与音准 ----
  const [mic, setMic] = useState<MicState>("off");
  const stream = useRef<MediaStream | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const clock = useRef<PlaybackClock | null>(null);
  const readings = useRef<Reading[]>([]);
  const [verdicts, setVerdicts] = useState<Array<Verdict | undefined> | null>(null);
  const [live, setLive] = useState<{ sung: number | null; target: TargetNote | null; cents: number | null }>({ sung: null, target: null, cents: null });
  const [playing, setPlaying] = useState(false);
  const canvas = useRef<HTMLCanvasElement | null>(null);

  const stopMic = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    analyser.current?.disconnect();
    analyser.current = null;
    setMic((state) => (state === "on" || state === "asking" ? "off" : state));
    setLive({ sung: null, target: null, cents: null });
  }, []);
  const startMic = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setMic("unavailable"); return; }
    setMic("asking");
    try {
      // Echo cancellation keeps the speakers' playback out of the reading; the voice itself is left untouched.
      const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false } });
      const ctx = getPianoAudioContext();
      await ctx.resume().catch(() => undefined);
      const node = ctx.createAnalyser();
      node.fftSize = 2048;
      // Only analysed: the microphone is never connected to the speakers and never recorded.
      ctx.createMediaStreamSource(media).connect(node);
      stream.current = media;
      analyser.current = node;
      setMic("on");
    } catch (error) {
      setMic((error as DOMException)?.name === "NotAllowedError" ? "denied" : "unavailable");
    }
  };
  // Leaving the page, or the tab going to the background, switches the microphone off.
  useEffect(() => {
    const hide = () => { if (document.hidden) stopMic(); };
    document.addEventListener("visibilitychange", hide);
    return () => { document.removeEventListener("visibilitychange", hide); stopMic(); };
  }, [stopMic]);

  /** How far the last run got, in beats: stopping halfway judges only what was sung. */
  const reached = useRef(0);
  const onPlayback = useCallback((next: PlaybackClock | null) => {
    const previous = clock.current;
    if (!next && previous) reached.current = (previous.ctx.currentTime - previous.start) / previous.secondsPerBeat;
    clock.current = next;
    setPlaying(!!next);
    if (next) {
      readings.current = [];
      setVerdicts(null);
    }
  }, []);
  // When a run ends with the microphone on, judge the notes it got through.
  useEffect(() => {
    if (playing || mic !== "on" || !readings.current.length) return;
    const verdict = judge(notes, readings.current);
    setVerdicts(notes.map((note, index) => (note.end <= reached.current ? verdict[index] : undefined)));
  }, [playing, mic, notes]);
  // A new piece, a changed score or another part starts with a clean slate.
  useEffect(() => {
    readings.current = [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the previous song's results
    setVerdicts(null);
  }, [piece.id, myPart]);

  // Read the microphone ~25 times a second.
  useEffect(() => {
    if (mic !== "on") return;
    const ctx = getPianoAudioContext();
    const buffer = new Float32Array(2048);
    // What the singer hears comes out late (output latency), and their voice reaches us late again.
    const lag = (ctx.outputLatency || ctx.baseLatency || 0.02) + 0.08;
    const timer = window.setInterval(() => {
      const node = analyser.current;
      if (!node) return;
      node.getFloatTimeDomainData(buffer);
      const reading = detectPitch(buffer, ctx.sampleRate);
      const sung = reading ? hzToMidi(reading.hz) : null;
      const run = clock.current;
      const beat = run ? (ctx.currentTime - lag - run.start) / run.secondsPerBeat : null;
      const target = beat == null ? null : notes.find((note) => beat >= note.start && beat < note.end) ?? null;
      if (sung != null && beat != null && beat >= 0) readings.current.push({ beat, midi: sung });
      setLive({ sung, target, cents: sung != null && target ? centsOff(sung, target.midi) : null });
    }, 40);
    return () => window.clearInterval(timer);
  }, [mic, notes]);

  // 音准图：目标音是横条，唱出来的音是点。播放时跟着走，停下后显示整首。
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let frame = 0;
    const draw = () => {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (element.width !== Math.round(width * ratio)) element.width = Math.round(width * ratio);
      if (element.height !== Math.round(height * ratio)) element.height = Math.round(height * ratio);
      const g = element.getContext("2d");
      if (!g) return;
      g.setTransform(ratio, 0, 0, ratio, 0, 0);
      g.clearRect(0, 0, width, height);
      if (!notes.length) return;
      const ctx = getPianoAudioContext();
      const run = clock.current;
      const total = notes.at(-1)!.end;
      const now = run ? (ctx.currentTime - run.start) / run.secondsPerBeat : null;
      const span = run ? Math.min(total, 10) : total;
      const left = run && now != null ? Math.max(0, Math.min(total - span, now - span * 0.3)) : 0;
      const x = (beat: number) => 12 + ((beat - left) / span) * (width - 24);
      const low = Math.min(...notes.map((note) => note.midi)) - 2;
      const high = Math.max(...notes.map((note) => note.midi)) + 2;
      const y = (midi: number) => height - 18 - ((midi - low) / (high - low)) * (height - 36);
      g.font = "12px 'Microsoft YaHei', sans-serif";
      g.textAlign = "center";
      notes.forEach((note, index) => {
        if (note.end < left || note.start > left + span) return;
        const verdict = verdicts?.[index];
        g.fillStyle = verdict === "ok" ? "#2E8B57" : verdict === "high" || verdict === "low" ? "#D9822B" : verdict === "none" ? "#C9D3CD" : "#9DBFAB";
        const top = y(note.midi) - 5;
        g.beginPath();
        g.roundRect(x(note.start) + 1, top, Math.max(3, x(note.end) - x(note.start) - 2), 10, 5);
        g.fill();
        if (note.lyric && x(note.end) - x(note.start) > 14) { g.fillStyle = "#44544B"; g.fillText(note.lyric, (x(note.start) + x(note.end)) / 2, top - 5); }
      });
      g.fillStyle = "#1E3A8A";
      for (const reading of readings.current) {
        if (reading.beat < left || reading.beat > left + span) continue;
        const near = notes.find((note) => reading.beat >= note.start - 0.5 && reading.beat < note.end + 0.5) ?? notes[0];
        const folded = foldTo(reading.midi, near.midi);
        if (folded < low || folded > high) continue;
        g.beginPath();
        g.arc(x(reading.beat), y(folded), 2.2, 0, Math.PI * 2);
        g.fill();
      }
      if (now != null && now >= 0) {
        g.strokeStyle = "rgb(175 66 54 / 70%)";
        g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(x(now), 6); g.lineTo(x(now), height - 6); g.stroke();
      }
      if (run) frame = requestAnimationFrame(draw);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [notes, verdicts, playing]);

  // 投屏：谱子这一块铺满屏幕，字放大，合唱队照着唱。
  const scoreCard = useRef<HTMLDivElement | null>(null);
  const [projecting, setProjecting] = useState(false);
  useEffect(() => {
    const sync = () => setProjecting(document.fullscreenElement === scoreCard.current && !!scoreCard.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleProjection = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void scoreCard.current?.requestFullscreen?.().catch(() => undefined);
  };

  const counts = verdicts?.some(Boolean) ? { ok: verdicts.filter((v) => v === "ok").length, high: verdicts.filter((v) => v === "high").length, low: verdicts.filter((v) => v === "low").length, none: verdicts.filter((v) => v === "none").length } : null;
  const myLabel = piece.labels[myPart];

  return <>
    <div className="choir-setup">
      <div className="choir-card">
        <p className="choir-step-title"><b>我唱</b><span>先选好自己的声部</span></p>
        <div className="choir-chips" role="radiogroup" aria-label="我的声部">
          {piece.parts.map((item) => <button key={item.index} type="button" role="radio" aria-checked={item.index === myPart} className={item.index === myPart ? "is-active" : ""} onClick={() => setPart(item.index)}>
            {item.label}<small>{item.sung ? "有范唱" : piece.colors?.[item.index]?.timbre === "guitar" ? "木吉他示范" : "钢琴示范"}</small>
          </button>)}
        </div>
      </div>
      <div className="choir-card">
        <p className="choir-step-title"><b>分步练</b><span>{stepInfo.caption}</span></p>
        <div className="choir-steps" role="radiogroup" aria-label="练习步骤">
          {STEPS.map((item, index) => <button key={item.id} type="button" role="radio" aria-checked={item.id === step} className={item.id === step ? "is-active" : ""} onClick={() => setStep(item.id)}>
            <span className="choir-step-number">{index + 1}</span>{item.label}
          </button>)}
        </div>
      </div>
    </div>

    <div className="choir-card choir-mic">
      <div className="choir-mic-head">
        <p className="choir-step-title"><b>音准</b><span>打开麦克风，边唱边看{myLabel}唱得准不准</span></p>
        {mic === "on"
          ? <button type="button" className="choir-mic-button is-on" onClick={stopMic}>关闭麦克风</button>
          : <button type="button" className="choir-mic-button" onClick={() => void startMic()} disabled={mic === "asking"}>{mic === "asking" ? "等待允许…" : "打开麦克风"}</button>}
      </div>
      {mic === "denied" && <p className="choir-mic-tip">浏览器没有允许使用麦克风。可以在地址栏左侧的网站设置里打开，其他练习不受影响。</p>}
      {mic === "unavailable" && <p className="choir-mic-tip">没有找到可用的麦克风。其他练习不受影响。</p>}
      {mic === "on" && <p className="choir-mic-live" aria-live="off">
        <span>应唱 <b>{live.target ? noteName(live.target.midi) : "—"}</b></span>
        <span>你唱 <b>{live.sung != null ? noteName(live.sung) : "—"}</b></span>
        <span className={`choir-meter${live.cents == null ? "" : Math.abs(live.cents) <= IN_TUNE_CENTS ? " is-ok" : " is-off"}`}>
          {live.cents == null ? "等你开口" : Math.abs(live.cents) <= IN_TUNE_CENTS ? "准" : live.cents > 0 ? "偏高" : "偏低"}
        </span>
      </p>}
      <canvas ref={canvas} className="choir-trace" aria-label={`${myLabel}的音准图：横条是应唱的音，圆点是你唱的音`} role="img" />
      {counts && <p className="choir-summary">这一遍：<b className="is-ok">准 {counts.ok}</b> 个音，<b className="is-off">偏高 {counts.high}</b>，<b className="is-off">偏低 {counts.low}</b>{counts.none ? `，${counts.none} 个没听清` : ""}。橙色横条是要再练的地方。</p>}
      <p className="choir-mic-tip">戴耳机唱最准：外放时麦克风会听到音箱里的其他声部。男生低八度唱同一个声部，也算唱准。声音只在这台电脑上分析，不录音、不上传。</p>
    </div>

    <div className={`choir-card choir-score${projecting ? " is-projecting" : ""}`} ref={scoreCard}>
      <div className="choir-score-bar">
        <p className="choir-step-title"><b>合唱谱</b><span>{projecting ? "按 Esc 退出投屏" : "投到大屏上，合唱队照着谱子和歌词一起唱"}</span></p>
        <button type="button" className="choir-project" onClick={toggleProjection}>{projecting ? "退出投屏" : "投屏给合唱队"}</button>
      </div>
      {piece.labels.length > 1 && <p className="choir-score-order">谱子从上到下：{piece.labels.map((label, index) => <span key={index} className={index === myPart ? "is-mine" : ""}>{label}</span>)}</p>}
      <MelodyPlayer key={playerKey} melody={piece.melody} notationStyle={notation} partLevels={partLevels} onPlayback={onPlayback} preferVocal={preferVocal} partColors={piece.colors} large={projecting} />
    </div>
  </>;
}
