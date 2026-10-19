"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_PATTERN_IDS,
  METERS,
  METER_BY_ID,
  RHYTHM_LEVELS,
  RHYTHM_PATTERNS,
  fitsMeter,
  generateRhythm,
  packBars,
  timeline,
  tokenKey,
  type MeterId,
  type RhythmPattern,
  type RhythmToken,
} from "../../lib/rhythm/patterns";
import { playRhythm, prepareRhythmAudio, type RhythmPlayback } from "../../lib/rhythm/rhythm-audio";

type Mode = "random" | "edit";

const STORAGE_KEY = "yapu.rhythm.v1";
const MAX_EDIT_BARS = 16;
/** Exercises run at least eight bars. */
const MIN_BARS = 8;
const BAR_COUNTS = [8, 12, 16];

type Saved = { mode: Mode; meter: MeterId | number; bars: number; bpm: number; allowed: string[]; edit: string[] };

function readSaved(): Partial<Saved> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Partial<Saved> : {};
  } catch { return {}; }
}

function Token({ token, active }: { token: RhythmToken; active: boolean }) {
  return (
    <span className={`rhythm-token${active ? " is-playing" : ""}${token.g === "–" ? " is-hold" : ""}`}>
      <span className="rhythm-glyph">{token.g}{token.dot && <span className="rhythm-dot">·</span>}</span>
      <span className="rhythm-lines" aria-hidden="true">
        {Array.from({ length: token.lines ?? 0 }, (_, i) => <i key={i} />)}
      </span>
    </span>
  );
}

function PatternGlyph({ pattern, activeKeys, groupIndex }: { pattern: RhythmPattern; activeKeys?: Set<string>; groupIndex?: number }) {
  return (
    <span className={`rhythm-group${pattern.triplet ? " is-triplet" : ""}`}>
      {pattern.triplet && <span className="rhythm-triplet-mark" aria-hidden="true">3</span>}
      {pattern.tokens.map((token, i) => (
        <Token key={i} token={token} active={groupIndex !== undefined && !!activeKeys?.has(tokenKey(groupIndex, i))} />
      ))}
    </span>
  );
}

export function RhythmPage() {
  const [mode, setMode] = useState<Mode>("random");
  const [meterId, setMeterId] = useState<MeterId>("2/4");
  const [barCount, setBarCount] = useState(MIN_BARS);
  const [bpm, setBpm] = useState(80);
  const [allowed, setAllowed] = useState<string[]>(DEFAULT_PATTERN_IDS);
  const [randomIds, setRandomIds] = useState<string[]>([]);
  const [editIds, setEditIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [rhythmOn, setRhythmOn] = useState(true);
  const [metronomeOn, setMetronomeOn] = useState(true);
  const [countIn, setCountIn] = useState(true);
  const [loop, setLoop] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const playbackRef = useRef<RhythmPlayback | null>(null);
  const frameRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);

  // Restore the teacher's last settings once on the client.
  useEffect(() => {
    const saved = readSaved();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from browser storage after mount */
    // Version 1 stored the meter as a beat count (2 = 2/4).
    const storedMeter = typeof saved.meter === "number" ? `${saved.meter}/4` : saved.meter;
    const savedMeter = METER_BY_ID.get(storedMeter as MeterId) ?? METERS[0];
    const savedBars = BAR_COUNTS.includes(saved.bars ?? 0) ? saved.bars! : MIN_BARS;
    const savedAllowed = Array.isArray(saved.allowed) && saved.allowed.length ? saved.allowed : DEFAULT_PATTERN_IDS;
    if (saved.mode === "edit" || saved.mode === "random") setMode(saved.mode);
    setMeterId(savedMeter.id);
    setBarCount(savedBars);
    if (typeof saved.bpm === "number") setBpm(Math.min(160, Math.max(40, saved.bpm)));
    setAllowed(savedAllowed);
    if (Array.isArray(saved.edit)) setEditIds(saved.edit.filter((id) => typeof id === "string"));
    setRandomIds(generateRhythm(savedAllowed, savedMeter, savedBars));
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, meter: meterId, bars: barCount, bpm, allowed, edit: editIds } satisfies Saved));
    } catch { /* Storage may be unavailable. */ }
  }, [loaded, mode, meterId, barCount, bpm, allowed, editIds]);

  const meter = METER_BY_ID.get(meterId)!;
  const ids = mode === "random" ? randomIds : editIds;
  const bars = useMemo(() => packBars(ids, meter), [ids, meter]);
  const tokens = useMemo(() => timeline(bars, meter), [bars, meter]);
  // While composing, the score always shows at least eight bars to fill.
  const shownBars = useMemo(() => mode === "edit" && bars.length < MIN_BARS
    ? [...bars, ...Array.from({ length: MIN_BARS - bars.length }, () => ({ groups: [], empty: meter.beats }))]
    : bars, [mode, bars, meter]);
  const totalBeats = bars.length * meter.beats;
  const activeKeys = useMemo(() => new Set(activeKey ? [activeKey] : []), [activeKey]);

  const stop = useCallback(() => {
    playbackRef.current?.stop();
    playbackRef.current = null;
    cancelAnimationFrame(frameRef.current);
    setPlaying(false);
    setActiveKey(null);
    setCountdown(null);
  }, []);

  useEffect(() => stop, [stop]);
  // Any change to the score or speed ends the current run.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- stopping the audio clock is the external sync here
  useEffect(() => { stop(); }, [ids, meterId, bpm, mode, stop]);

  const play = async () => {
    if (playing) { stop(); return; }
    if (!tokens.length || audioLoading) return;
    let audio: Awaited<ReturnType<typeof prepareRhythmAudio>>;
    setAudioLoading(true);
    setAudioError(false);
    try {
      audio = await prepareRhythmAudio();
    } catch {
      setAudioError(true);
      return;
    } finally {
      setAudioLoading(false);
    }
    const playback = playRhythm(
      audio,
      { tokens, totalBeats, meter, bpm, rhythm: rhythmOn, metronome: metronomeOn, countIn, loop },
      () => { playbackRef.current = null; cancelAnimationFrame(frameRef.current); setPlaying(false); setActiveKey(null); setCountdown(null); },
    );
    playbackRef.current = playback;
    setPlaying(true);
    const tick = () => {
      const position = playback.position();
      if (position === null) return;
      if (position < 0) {
        // Count up through the bar: 1, 2, 3 … like a teacher counting in.
        setCountdown(Math.round(meter.beats / meter.unit) - Math.ceil(-position / meter.unit - 1e-6) + 1);
        setActiveKey(null);
      } else {
        setCountdown(null);
        let key: string | null = null;
        for (const token of tokens) {
          if (token.start <= position + 1e-6) key = token.key;
          else break;
        }
        setActiveKey(key);
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const regenerate = () => setRandomIds(generateRhythm(allowed, meter, barCount));

  const changeMeter = (next: MeterId) => {
    setMeterId(next);
    if (mode === "random") setRandomIds(generateRhythm(allowed, METER_BY_ID.get(next)!, barCount));
  };
  const changeBars = (next: number) => {
    setBarCount(next);
    setRandomIds(generateRhythm(allowed, meter, next));
  };

  const toggleAllowed = (id: string) => {
    setAllowed((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };
  const setLevelAllowed = (level: number, on: boolean) => {
    const levelIds = RHYTHM_PATTERNS.filter((p) => p.family === meter.family && p.level === level).map((p) => p.id);
    setAllowed((current) => on ? [...new Set([...current, ...levelIds])] : current.filter((id) => !levelIds.includes(id)));
  };

  const editFull = (() => {
    const packed = packBars(editIds, meter);
    const last = packed[packed.length - 1];
    return packed.length >= MAX_EDIT_BARS && last.empty === 0;
  })();

  const insert = (pattern: RhythmPattern) => {
    const at = selected === null ? editIds.length : selected + 1;
    const next = [...editIds.slice(0, at), pattern.id, ...editIds.slice(at)];
    const packed = packBars(next, meter);
    if (packed.length > MAX_EDIT_BARS || (packed.length === MAX_EDIT_BARS && packed[packed.length - 1].empty < 0)) return;
    setEditIds(next);
    setSelected(selected === null ? null : at);
  };
  const removeSelected = () => {
    if (selected === null) return;
    setEditIds((current) => current.filter((_, i) => i !== selected));
    setSelected(selected > 0 ? selected - 1 : null);
  };
  const copyToEdit = () => {
    setEditIds(randomIds);
    setSelected(null);
    setMode("edit");
  };

  const fullscreen = () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.requestFullscreen?.().catch(() => undefined);
  };

  const familyPatterns = RHYTHM_PATTERNS.filter((p) => p.family === meter.family);
  const lastBar = bars[bars.length - 1];
  const editStatus = !editIds.length
    ? "点下方的节奏型，一格一格编进小节里。"
    : lastBar.empty > 0
      ? `已编 ${bars.length} 小节，最后一小节还差 ${Math.round(lastBar.empty / meter.unit)} 拍。`
      : `已编 ${bars.length} 小节，每小节都已填满。`;

  return (
    <section className="rhythm-lab" aria-labelledby="rhythm-title">
      <header className="rhythm-intro">
        <div>
          <p className="rhythm-kicker">节奏训练</p>
          <h2 id="rhythm-title">听一听，拍一拍</h2>
        </div>
        <div className="rhythm-mode" role="radiogroup" aria-label="出题方式">
          <button type="button" role="radio" aria-checked={mode === "random"} className={mode === "random" ? "is-active" : ""} onClick={() => setMode("random")}>随机训练</button>
          <button type="button" role="radio" aria-checked={mode === "edit"} className={mode === "edit" ? "is-active" : ""} onClick={() => setMode("edit")}>自己编排</button>
        </div>
      </header>

      <div className="rhythm-settings">
        <div className="rhythm-field">
          <span className="rhythm-field-label">拍号</span>
          <div className="rhythm-chips">
            {METERS.map((m) => (
              <button key={m.id} type="button" aria-label={`${m.id} 拍`} aria-pressed={meterId === m.id} className={meterId === m.id ? "is-active" : ""} onClick={() => changeMeter(m.id)}>
                <span className="rhythm-meter-chip"><span>{m.top}</span><span>{m.bottom}</span></span>
              </button>
            ))}
          </div>
        </div>
        {mode === "random" && (
          <div className="rhythm-field">
            <span className="rhythm-field-label">小节数</span>
            <div className="rhythm-chips">
              {BAR_COUNTS.map((n) => (
                <button key={n} type="button" aria-pressed={barCount === n} className={barCount === n ? "is-active" : ""} onClick={() => changeBars(n)}>{n} 小节</button>
              ))}
            </div>
          </div>
        )}
        <label className="rhythm-field rhythm-tempo">
          <span className="rhythm-field-label">速度</span>
          <input type="range" min={40} max={160} step={2} value={bpm} onChange={(event) => setBpm(Number(event.target.value))} aria-label={meter.bottom === 8 ? "每分钟八分音符数" : "每分钟四分音符数"} />
          <output>{meter.bottom === 8 ? "♪" : "♩"} = {bpm}</output>
        </label>
      </div>

      <div className="rhythm-stage" ref={stageRef}>
        <div className="rhythm-score" aria-label="节奏谱" aria-live="off">
          <span className="rhythm-meter" aria-label={`${meter.id} 拍`}><span>{meter.top}</span><span>{meter.bottom}</span></span>
          <div className="rhythm-bars">
            {shownBars.map((bar, barIndex) => (
              <div className="rhythm-bar" key={barIndex}>
                {bar.groups.map(({ index, pattern }) => mode === "edit" ? (
                  <button
                    key={index}
                    type="button"
                    className={`rhythm-placed${selected === index ? " is-selected" : ""}`}
                    aria-pressed={selected === index}
                    aria-label={`${pattern.name}，点选后可删除或在后面插入`}
                    onClick={() => setSelected(selected === index ? null : index)}
                  >
                    <PatternGlyph pattern={pattern} activeKeys={activeKeys} groupIndex={index} />
                  </button>
                ) : (
                  <PatternGlyph key={index} pattern={pattern} activeKeys={activeKeys} groupIndex={index} />
                ))}
                {Array.from({ length: Math.round(bar.empty / meter.unit) }, (_, i) => <span key={`e${i}`} className={`rhythm-empty${meter.unit < 1 ? " is-eighth" : ""}`} aria-label="空拍" />)}
                <span className={`rhythm-barline${barIndex === shownBars.length - 1 ? " is-final" : ""}`} aria-hidden="true" />
              </div>
            ))}
          </div>
          {countdown !== null && <div className="rhythm-countdown" role="status">预备 {countdown}</div>}
        </div>

        <div className="rhythm-transport">
          <button type="button" className={`rhythm-play${playing ? " is-playing" : ""}`} onClick={() => void play()} disabled={!tokens.length || audioLoading}>
            {playing ? "■ 停止" : audioLoading ? "载入钢琴音…" : "▶ 播放"}
          </button>
          {mode === "random" ? (
            <>
              <button type="button" className="rhythm-secondary" onClick={regenerate}>换一条</button>
              <button type="button" className="rhythm-ghost" onClick={copyToEdit}>拿去修改</button>
            </>
          ) : (
            <>
              <button type="button" className="rhythm-secondary" onClick={removeSelected} disabled={selected === null}>删除所选</button>
              <button type="button" className="rhythm-ghost" onClick={() => { setEditIds([]); setSelected(null); }} disabled={!editIds.length}>清空</button>
            </>
          )}
          <div className="rhythm-toggles">
            {([
              ["节奏声", rhythmOn, setRhythmOn],
              ["节拍器", metronomeOn, setMetronomeOn],
              ["预备拍", countIn, setCountIn],
              ["循环", loop, setLoop],
            ] as const).map(([label, value, set]) => (
              <label key={label} className="rhythm-toggle">
                <input type="checkbox" checked={value} disabled={playing} onChange={(event) => set(event.target.checked)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <button type="button" className="rhythm-ghost rhythm-fullscreen" onClick={fullscreen}>投屏全屏</button>
        </div>
        {mode === "edit" && <p className="rhythm-status">{editStatus}{selected !== null && " 新的节奏型会插在所选的后面。"}</p>}
        {audioError && <p className="rhythm-status">钢琴音载入失败，请检查网络后再点播放。</p>}
        {mode === "random" && !familyPatterns.some((p) => allowed.includes(p.id)) && <p className="rhythm-status">这个拍号下还没有勾选节奏型，暂时只用{meter.family === "compound" ? "三个八分音符" : "四分音符"}出题。</p>}
      </div>

      <div className="rhythm-library">
        <p className="rhythm-library-hint">
          {mode === "random" ? "勾选要练的节奏型，「换一条」只会用到勾选的这些。" : editFull ? `已经编满 ${MAX_EDIT_BARS} 小节了。` : "点一个节奏型，把它加进节奏谱。"}
        </p>
        {RHYTHM_LEVELS[meter.family].map(({ level, label, caption }) => {
          const levelPatterns = familyPatterns.filter((p) => p.level === level);
          const allOn = levelPatterns.every((p) => allowed.includes(p.id));
          return (
            <section key={level} className="rhythm-level" aria-label={`${label}节奏型`}>
              <header>
                <h3>{label}</h3>
                <p>{caption}</p>
                {mode === "random" && (
                  <button type="button" className="rhythm-level-toggle" onClick={() => setLevelAllowed(level, !allOn)}>{allOn ? "取消本组" : "全选本组"}</button>
                )}
              </header>
              <div className="rhythm-cards">
                {levelPatterns.map((pattern) => {
                  const fits = fitsMeter(pattern, meter);
                  const on = allowed.includes(pattern.id);
                  return mode === "random" ? (
                    <button
                      key={pattern.id}
                      type="button"
                      className={`rhythm-card${on ? " is-on" : ""}`}
                      aria-pressed={on}
                      disabled={!fits}
                      title={fits ? undefined : `${pattern.name}比一小节长`}
                      onClick={() => toggleAllowed(pattern.id)}
                    >
                      <span className="rhythm-check" aria-hidden="true">{on ? "✓" : ""}</span>
                      <PatternGlyph pattern={pattern} />
                      <span className="rhythm-card-name">{pattern.name}</span>
                      <small>{Math.round(pattern.beats / meter.unit)} 拍</small>
                    </button>
                  ) : (
                    <button
                      key={pattern.id}
                      type="button"
                      className="rhythm-card"
                      disabled={!fits || editFull}
                      onClick={() => insert(pattern)}
                    >
                      <span className="rhythm-check is-add" aria-hidden="true">＋</span>
                      <PatternGlyph pattern={pattern} />
                      <span className="rhythm-card-name">{pattern.name}</span>
                      <small>{Math.round(pattern.beats / meter.unit)} 拍</small>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
