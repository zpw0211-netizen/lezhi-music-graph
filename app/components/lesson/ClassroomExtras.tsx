"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getPianoAudioContext, loadPianoSampler, playPianoSample, type PianoSampler } from "../../lib/lesson/piano-sampler";
import { WorkbenchIcon } from "../WorkbenchIcon";

export type PenKind = "red" | "blue" | "highlight" | "eraser";
export type Stroke = { pen: PenKind; points: Array<[number, number]> };

const PEN_SPEC: Record<Exclude<PenKind, "eraser">, { color: string; width: number; label: string }> = {
  red: { color: "#C83E32", width: 3.5, label: "红笔" },
  blue: { color: "#2466B8", width: 3.5, label: "蓝笔" },
  highlight: { color: "rgba(242, 193, 78, 0.44)", width: 18, label: "荧光" },
};

/** 透明谱面/课件批注层：开启画笔时可圈画切分、换气口和旋律线，关闭时完全穿透不挡操作。 */
export function AnnotationLayer({
  active,
  pen,
  strokes,
  onStrokesChange,
}: {
  active: boolean;
  pen: PenKind;
  strokes: Stroke[];
  onStrokesChange: (next: Stroke[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef<Stroke | null>(null);
  const strokesRef = useRef(strokes);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);

  const redraw = useCallback((list: Stroke[], draft?: Stroke | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const all = draft ? [...list, draft] : list;
    for (const stroke of all) {
      if (stroke.points.length < 2) continue;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (stroke.pen === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 22;
      } else {
        const spec = PEN_SPEC[stroke.pen];
        ctx.strokeStyle = spec.color;
        ctx.lineWidth = spec.width;
      }
      ctx.beginPath();
      stroke.points.forEach(([nx, ny], idx) => {
        const x = nx * w;
        const y = ny * h;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    }
  }, []);

  useEffect(() => {
    redraw(strokes);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => redraw(strokesRef.current, drawing.current));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [strokes, redraw]);

  const norm = (event: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [
      Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width))),
      Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height))),
    ];
  };

  return (
    <canvas
      ref={canvasRef}
      className={`present-annot-canvas${active ? " is-drawing" : ""}`}
      aria-hidden={!active}
      onPointerDown={(event) => {
        if (!active || (event.pointerType === "mouse" && event.button !== 0)) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const pt = norm(event);
        drawing.current = { pen, points: [pt, pt] };
        redraw(strokesRef.current, drawing.current);
      }}
      onPointerMove={(event) => {
        if (!drawing.current) return;
        drawing.current.points.push(norm(event));
        redraw(strokesRef.current, drawing.current);
      }}
      onPointerUp={() => {
        if (!drawing.current) return;
        const finished = drawing.current;
        drawing.current = null;
        onStrokesChange([...strokesRef.current, finished]);
      }}
      onPointerCancel={() => {
        drawing.current = null;
        redraw(strokesRef.current);
      }}
    />
  );
}

/** 画笔悬浮小工具条：红笔 / 蓝笔 / 荧光笔 / 橡皮 / 撤销 / 清屏。 */
export function AnnotationToolbar({
  pen,
  hasStrokes,
  onPenChange,
  onUndo,
  onClear,
  onClose,
}: {
  pen: PenKind;
  hasStrokes: boolean;
  onPenChange: (next: PenKind) => void;
  onUndo: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <div className="present-annot-bar" role="toolbar" aria-label="谱面批注画笔">
      {(Object.keys(PEN_SPEC) as Array<Exclude<PenKind, "eraser">>).map((key) => (
        <button key={key} type="button" className={pen === key ? "is-active" : ""} onClick={() => onPenChange(key)}>
          <i className={`annot-dot is-${key}`} aria-hidden="true" />
          {PEN_SPEC[key].label}
        </button>
      ))}
      <button type="button" className={pen === "eraser" ? "is-active" : ""} onClick={() => onPenChange("eraser")}>橡皮</button>
      <button type="button" disabled={!hasStrokes} onClick={onUndo}>撤销</button>
      <button type="button" disabled={!hasStrokes} onClick={onClear}>清屏</button>
      <button type="button" className="is-done" onClick={onClose}>收起画笔</button>
    </div>
  );
}

export type LocalMediaItem = { id: string; name: string; kind: "audio" | "video"; url: string };

/** 本地音视频挂载条：老师直接拖入本机原曲 MP3/MP4 在课件内播放，不上传服务器、零版权风险。 */
export function LocalMediaDock({
  items,
  activeId,
  onSelect,
  onRemove,
  onAddClick,
  onClose,
}: {
  items: LocalMediaItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddClick: () => void;
  onClose: () => void;
}) {
  const current = items.find((item) => item.id === activeId) ?? items[0] ?? null;
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(false);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    el.playbackRate = rate;
    el.loop = loop;
    const pitchEl = el as HTMLMediaElement & { preservesPitch?: boolean; webkitPreservesPitch?: boolean };
    if ("preservesPitch" in pitchEl) pitchEl.preservesPitch = true;
    if ("webkitPreservesPitch" in pitchEl) pitchEl.webkitPreservesPitch = true;
  }, [rate, loop, current?.id]);

  return (
    <aside className="present-media-dock" aria-label="本地原曲音视频">
      <header className="present-media-head">
        <strong>本地音视频</strong>
        <small>仅在本机浏览器播放，不上传</small>
        <button type="button" onClick={onAddClick}>+ 添加文件</button>
        <button type="button" aria-label="收起本地音视频" onClick={onClose}><WorkbenchIcon name="close" /></button>
      </header>
      {items.length > 0 && (
        <div className="present-media-tabs">
          {items.map((item) => (
            <span key={item.id} className={`present-media-chip${item.id === current?.id ? " is-active" : ""}`}>
              <button type="button" onClick={() => onSelect(item.id)} title={item.name}>{item.name}</button>
              <button type="button" className="is-rm" aria-label={`移除 ${item.name}`} onClick={() => onRemove(item.id)}>×</button>
            </span>
          ))}
        </div>
      )}
      {current ? (
        <div className="present-media-body">
          {current.kind === "video" ? (
            <video key={current.id} ref={(el) => { mediaRef.current = el; }} src={current.url} controls playsInline />
          ) : (
            <audio key={current.id} ref={(el) => { mediaRef.current = el; }} src={current.url} controls />
          )}
          <div className="present-media-opts">
            <span>倍速</span>
            {[0.75, 0.85, 1, 1.25].map((value) => (
              <button key={value} type="button" className={rate === value ? "is-active" : ""} onClick={() => setRate(value)}>
                {value === 1 ? "原速" : `${value}×`}
              </button>
            ))}
            <label>
              <input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} />
              循环
            </label>
          </div>
        </div>
      ) : (
        <p className="present-media-empty">点击“+ 添加文件”挂载本机原曲录音、伴奏或交响乐视频，上欣赏课无需切出全屏。</p>
      )}
    </aside>
  );
}

const KEYS: Array<{ midi: number; label: string; solfege: string; sharp?: boolean }> = [
  { midi: 60, label: "C4", solfege: "1" },
  { midi: 61, label: "♯C", solfege: "♯1", sharp: true },
  { midi: 62, label: "D4", solfege: "2" },
  { midi: 63, label: "♭E", solfege: "♭3", sharp: true },
  { midi: 64, label: "E4", solfege: "3" },
  { midi: 65, label: "F4", solfege: "4" },
  { midi: 66, label: "♯F", solfege: "♯4", sharp: true },
  { midi: 67, label: "G4", solfege: "5" },
  { midi: 68, label: "♯G", solfege: "♯5", sharp: true },
  { midi: 69, label: "A4", solfege: "6" },
  { midi: 70, label: "♭B", solfege: "♭7", sharp: true },
  { midi: 71, label: "B4", solfege: "7" },
  { midi: 72, label: "C5", solfege: "1'" },
];

const METERS: Array<{ label: string; beats: number }> = [
  { label: "2/4", beats: 2 },
  { label: "3/4", beats: 3 },
  { label: "4/4", beats: 4 },
  { label: "6/8", beats: 6 },
];

/** 讲台迷你工具箱：节拍器 / 定音小琴键 / 随手倒计时。 */
export function PodiumToolkit({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"metro" | "pitch" | "timer">("metro");

  // 节拍器
  const [bpm, setBpm] = useState(96);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [metroOn, setMetroOn] = useState(false);
  const [metroBeat, setMetroBeat] = useState(-1);
  const metroRef = useRef<{ timer: number; step: number }>({ timer: 0, step: 0 });

  useEffect(() => {
    if (!metroOn) {
      window.clearInterval(metroRef.current.timer);
      return;
    }
    const tick = () => {
      const step = metroRef.current.step % beatsPerBar;
      metroRef.current.step += 1;
      setMetroBeat(step);
      try {
        const ctx = getPianoAudioContext();
        void ctx.resume();
        const at = ctx.currentTime + 0.01;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = step === 0 ? 1560 : 1040;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(step === 0 ? 0.24 : 0.14, at + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.055);
        osc.connect(gain).connect(ctx.destination);
        osc.start(at);
        osc.stop(at + 0.07);
      } catch { /* ignore */ }
    };
    metroRef.current.step = 0;
    tick();
    const ms = Math.max(200, Math.round((60 / bpm) * 1000));
    const timer = window.setInterval(tick, ms);
    metroRef.current.timer = timer;
    return () => window.clearInterval(timer);
  }, [metroOn, bpm, beatsPerBar]);

  // 定音小琴键
  const samplerRef = useRef<PianoSampler | null>(null);
  const [lastPitch, setLastPitch] = useState("点击任意琴键给全班定起唱音");
  const playPitch = async (key: (typeof KEYS)[number]) => {
    setLastPitch(`${key.label}（唱名 ${key.solfege}）`);
    try {
      const ctx = getPianoAudioContext();
      await ctx.resume();
      samplerRef.current ??= await loadPianoSampler(ctx).catch(() => null);
      if (samplerRef.current) {
        playPianoSample(ctx, samplerRef.current, key.midi, ctx.currentTime + 0.01, 1.35, ctx.destination, 0.55);
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime + 0.01;
      osc.type = "triangle";
      osc.frequency.value = 440 * 2 ** ((key.midi - 69) / 12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.15);
    } catch { /* ignore */ }
  };

  // 随手倒计时
  const [preset, setPreset] = useState(120);
  const [left, setLeft] = useState(120);
  const [timerOn, setTimerOn] = useState(false);

  useEffect(() => {
    if (!timerOn) return;
    if (left <= 0) return;
    const id = window.setTimeout(() => {
      setLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          setTimerOn(false);
          try {
            const ctx = getPianoAudioContext();
            void ctx.resume();
            [880, 1174.66].forEach((freq, idx) => {
              const at = ctx.currentTime + 0.02 + idx * 0.22;
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.value = freq;
              gain.gain.setValueAtTime(0.0001, at);
              gain.gain.linearRampToValueAtTime(0.2, at + 0.01);
              gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.45);
              osc.connect(gain).connect(ctx.destination);
              osc.start(at);
              osc.stop(at + 0.5);
            });
          } catch { /* ignore */ }
        }
        return next;
      });
    }, 1000);
    return () => window.clearTimeout(id);
  }, [timerOn, left]);

  const clock = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;

  return (
    <aside className="present-podium" aria-label="讲台小工具">
      <header className="present-podium-head">
        <div role="tablist" aria-label="讲台工具切换">
          <button type="button" role="tab" aria-selected={tab === "metro"} className={tab === "metro" ? "is-active" : ""} onClick={() => setTab("metro")}>节拍器</button>
          <button type="button" role="tab" aria-selected={tab === "pitch"} className={tab === "pitch" ? "is-active" : ""} onClick={() => setTab("pitch")}>定音键</button>
          <button type="button" role="tab" aria-selected={tab === "timer"} className={tab === "timer" ? "is-active" : ""} onClick={() => setTab("timer")}>倒计时</button>
        </div>
        <button type="button" aria-label="关闭讲台工具" onClick={onClose}><WorkbenchIcon name="close" /></button>
      </header>

      {tab === "metro" && (
        <div className="present-podium-body">
          <div className="podium-metro-lights" aria-hidden="true">
            {Array.from({ length: beatsPerBar }, (_, idx) => (
              <i key={idx} className={`${idx === 0 ? "is-strong" : ""}${metroOn && metroBeat === idx ? " is-lit" : ""}`} />
            ))}
          </div>
          <div className="podium-row">
            {METERS.map((m) => (
              <button key={m.label} type="button" className={beatsPerBar === m.beats ? "is-active" : ""} onClick={() => setBeatsPerBar(m.beats)}>{m.label}</button>
            ))}
          </div>
          <label className="podium-slider">
            <span>速度 <b>♩={bpm}</b></span>
            <input type="range" min={40} max={160} step={2} value={bpm} onChange={(event) => setBpm(Number(event.target.value))} />
          </label>
          <button type="button" className={`podium-primary${metroOn ? " is-stop" : ""}`} onClick={() => { setMetroOn((on) => { if (on) setMetroBeat(-1); return !on; }); }}>
            {metroOn ? "■ 停止节拍器" : "▶ 开启节拍器"}
          </button>
        </div>
      )}

      {tab === "pitch" && (
        <div className="present-podium-body">
          <p className="podium-pitch-note">{lastPitch}</p>
          <div className="podium-keys" role="group" aria-label="C4 到 C5 定音琴键">
            {KEYS.map((key) => (
              <button key={key.midi} type="button" className={key.sharp ? "is-sharp" : "is-white"} onClick={() => void playPitch(key)} title={`${key.label}（${key.solfege}）`}>
                <b>{key.solfege}</b>
                <small>{key.label}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "timer" && (
        <div className="present-podium-body">
          <div className={`podium-clock${left === 0 ? " is-done" : ""}`}>{clock}</div>
          <div className="podium-row">
            {[60, 120, 180, 300].map((sec) => (
              <button key={sec} type="button" className={preset === sec ? "is-active" : ""} onClick={() => { setTimerOn(false); setPreset(sec); setLeft(sec); }}>{sec / 60} 分钟</button>
            ))}
          </div>
          <div className="podium-row">
            <button type="button" className={`podium-primary${timerOn ? " is-stop" : ""}`} onClick={() => { if (left === 0) setLeft(preset); setTimerOn((on) => !on); }}>
              {timerOn ? "暂停" : left === 0 ? "重新开始" : "开始倒计时"}
            </button>
            <button type="button" onClick={() => { setTimerOn(false); setLeft(preset); }}>重置</button>
          </div>
        </div>
      )}
    </aside>
  );
}
