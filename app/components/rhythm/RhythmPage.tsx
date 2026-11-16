"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
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
  type MeterId,
  type RhythmLevel,
  type RhythmPattern,
} from "../../lib/rhythm/patterns";
import { dictationPool, dictationQuestion, gradeDictation } from "../../lib/rhythm/dictation";
import { drumThump, playRhythm, prepareRhythmAudio, type RhythmPlayback } from "../../lib/rhythm/rhythm-audio";
import { judgeTaps, WINDOW, type ScoreResult } from "../../lib/rhythm/scoring";
import { LEVELS, LEVEL_BARS, PASS_SCORE } from "../../lib/rhythm/levels";
import { PatternGlyph, RhythmScore } from "./RhythmScore";
import { publicAssetUrl } from "../../lib/app/assets";

type Mode = "random" | "edit" | "levels" | "dictation";

const STORAGE_KEY = "yapu.rhythm.v1";
const LEVELS_KEY = "yapu.rhythm.levels.v1";
const MINE_KEY = "yapu.rhythm.mine.v1";
const MAX_EDIT_BARS = 16;
/** Exercises run at least eight bars. */
const MIN_BARS = 8;
const BAR_COUNTS = [8, 12, 16];
const MAX_SAVED = 30;
/** 节奏听写 is short: two bars for the youngest, eight for the oldest. */
const DICTATION_BARS = [2, 4, 8];
const MODES: Array<[Mode, string]> = [["random", "随机训练"], ["edit", "自己编排"], ["levels", "闯关"], ["dictation", "节奏听写"]];

type Saved = { mode: Mode; meter: MeterId | number; bars: number; bpm: number; allowed: string[]; edit: string[]; cards?: boolean; dictBars?: number; dictLevel?: number };
/** One dictation question: bars right out of bars asked, or written on paper (nothing on screen). */
type DictationRecord = { right: number; total: number; onScreen: boolean };
type Practice = { id: string; name: string; meter: MeterId; bpm: number; ids: string[] };

function readJson<T>(key: string): Partial<T> | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as Partial<T> : null;
  } catch { return null; }
}
function writeJson(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be unavailable. */ }
}

const STAR_TEXT = ["", "★", "★★", "★★★"];
/** Centres of the eight stepping stones in art/rhythm/level-path.webp (1600×600), start to finish. */
const PATH_STOPS = [[102, 493], [303, 442], [511, 390], [719, 344], [928, 302], [1133, 249], [1333, 195], [1493, 137]];

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
  const [playing, setPlaying] = useState<null | "listen" | "tap">(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [drumHit, setDrumHit] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [levelIds, setLevelIds] = useState<string[]>([]);
  const [levelStars, setLevelStars] = useState<number[]>([]);
  const [unlockAll, setUnlockAll] = useState(false);
  const [mine, setMine] = useState<Practice[]>([]);
  const [saveName, setSaveName] = useState("");
  const [dictBars, setDictBars] = useState(4);
  const [dictLevel, setDictLevel] = useState<RhythmLevel>(1);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [answerIds, setAnswerIds] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [listens, setListens] = useState(0);
  const [questionNo, setQuestionNo] = useState(1);
  const [records, setRecords] = useState<DictationRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const playbackRef = useRef<RhythmPlayback | null>(null);
  const tapsRef = useRef<number[]>([]);
  const frameRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);

  // Restore the teacher's last settings once on the client.
  useEffect(() => {
    const saved = readJson<Saved>(STORAGE_KEY) ?? {};
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from browser storage after mount */
    // Version 1 stored the meter as a beat count (2 = 2/4).
    const storedMeter = typeof saved.meter === "number" ? `${saved.meter}/4` : saved.meter;
    const savedMeter = METER_BY_ID.get(storedMeter as MeterId) ?? METERS[0];
    const savedBars = BAR_COUNTS.includes(saved.bars ?? 0) ? saved.bars! : MIN_BARS;
    const savedAllowed = Array.isArray(saved.allowed) && saved.allowed.length ? saved.allowed : DEFAULT_PATTERN_IDS;
    if (saved.mode === "edit" || saved.mode === "random" || saved.mode === "levels" || saved.mode === "dictation") setMode(saved.mode);
    const savedDictBars = DICTATION_BARS.includes(saved.dictBars ?? 0) ? saved.dictBars! : 4;
    const savedDictLevel = (saved.dictLevel === 2 || saved.dictLevel === 3 ? saved.dictLevel : 1) as RhythmLevel;
    setDictBars(savedDictBars);
    setDictLevel(savedDictLevel);
    setQuestionIds(dictationQuestion(dictationPool(savedMeter, savedDictLevel), savedMeter, savedDictBars));
    setMeterId(savedMeter.id);
    setBarCount(savedBars);
    if (typeof saved.bpm === "number") setBpm(Math.min(160, Math.max(40, saved.bpm)));
    setAllowed(savedAllowed);
    if (Array.isArray(saved.edit)) setEditIds(saved.edit.filter((id) => typeof id === "string"));
    setRandomIds(generateRhythm(savedAllowed, savedMeter, savedBars));
    const stars = readJson<{ stars: number[] }>(LEVELS_KEY)?.stars;
    const savedStars = Array.isArray(stars) ? stars.map((n) => Number(n) || 0) : [];
    setLevelStars(savedStars);
    const firstOpen = Math.min(LEVELS.length - 1, savedStars.filter((n) => n > 0).length);
    setLevelIndex(firstOpen);
    const level = LEVELS[firstOpen];
    setLevelIds(generateRhythm(level.patterns, METER_BY_ID.get(level.meter)!, LEVEL_BARS));
    const practices = readJson<{ list: Practice[] }>(MINE_KEY)?.list;
    if (Array.isArray(practices)) setMine(practices.filter((p) => p && Array.isArray(p.ids) && METER_BY_ID.has(p.meter)));
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeJson(STORAGE_KEY, { mode, meter: meterId, bars: barCount, bpm, allowed, edit: editIds, dictBars, dictLevel } satisfies Saved);
  }, [loaded, mode, meterId, barCount, bpm, allowed, editIds, dictBars, dictLevel]);
  useEffect(() => { if (loaded) writeJson(LEVELS_KEY, { stars: levelStars }); }, [loaded, levelStars]);
  useEffect(() => { if (loaded) writeJson(MINE_KEY, { list: mine }); }, [loaded, mine]);

  const level = LEVELS[levelIndex];
  const activeMeterId = mode === "levels" ? level.meter : meterId;
  const activeBpm = mode === "levels" ? level.bpm : bpm;
  const meter = METER_BY_ID.get(activeMeterId)!;
  const dictating = mode === "dictation";
  // While dictating, `ids` is the question: it is what plays, and it stays hidden until 看答案.
  const ids = mode === "random" ? randomIds : mode === "edit" ? editIds : mode === "levels" ? levelIds : questionIds;
  const bars = useMemo(() => packBars(ids, meter), [ids, meter]);
  const tokens = useMemo(() => timeline(bars, meter), [bars, meter]);
  // While composing, the score always shows at least eight bars to fill.
  const shownBars = useMemo(() => mode === "edit" && bars.length < MIN_BARS
    ? [...bars, ...Array.from({ length: MIN_BARS - bars.length }, () => ({ groups: [], empty: meter.beats }))]
    : bars, [mode, bars, meter]);
  // The pupil's answer, padded with empty bars to the question's length.
  const answerBars = useMemo(() => {
    const packed = answerIds.length ? packBars(answerIds, meter) : [];
    return packed.length < dictBars
      ? [...packed, ...Array.from({ length: dictBars - packed.length }, () => ({ groups: [], empty: meter.beats }))]
      : packed;
  }, [answerIds, meter, dictBars]);
  const answerMarks = useMemo(() => dictating && revealed && answerIds.length ? gradeDictation(questionIds, answerIds, meter) : undefined, [dictating, revealed, questionIds, answerIds, meter]);
  const totalBeats = bars.length * meter.beats;
  const hasNotes = tokens.some((t) => t.sounding);

  const stop = useCallback(() => {
    playbackRef.current?.stop();
    playbackRef.current = null;
    cancelAnimationFrame(frameRef.current);
    setPlaying(null);
    setActiveKey(null);
    setCountdown(null);
  }, []);

  useEffect(() => stop, [stop]);
  // Any change to the score or speed ends the current run and clears its marks.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- stopping the audio clock is the external sync; marks belong to the replaced score */
    stop();
    setResult(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [ids, activeMeterId, activeBpm, mode, stop]);

  const start = async (kind: "listen" | "tap") => {
    if (playing) { stop(); return; }
    if (!hasNotes || audioLoading) return;
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
    const tapRun = kind === "tap";
    tapsRef.current = [];
    setResult(null);
    if (dictating && !revealed && kind === "listen") setListens((n) => n + 1);
    const runTokens = tokens;
    const runLevel = mode === "levels" ? levelIndex : null;
    const playback = playRhythm(
      audio,
      {
        tokens: runTokens,
        totalBeats,
        meter,
        bpm: activeBpm,
        // While pupils tap, they make the rhythm; the metronome keeps the beat.
        // A dictation question always sounds, once each time.
        rhythm: tapRun ? false : dictating ? true : rhythmOn,
        metronome: tapRun ? true : metronomeOn,
        countIn: tapRun ? true : countIn,
        loop: tapRun || dictating ? false : loop,
      },
      () => {
        playbackRef.current = null;
        cancelAnimationFrame(frameRef.current);
        setPlaying(null);
        setActiveKey(null);
        setCountdown(null);
        if (!tapRun) return;
        const judged = judgeTaps(runTokens, playback.secPerQuarter, tapsRef.current);
        setResult(judged);
        if (runLevel !== null && judged.score >= PASS_SCORE) {
          setLevelStars((current) => {
            const next = [...current];
            next[runLevel] = Math.max(next[runLevel] ?? 0, judged.stars || 1);
            return next;
          });
        }
      },
    );
    playbackRef.current = playback;
    setPlaying(kind);
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
        for (const token of runTokens) {
          if (token.start <= position + 1e-6) key = token.key;
          else break;
        }
        setActiveKey(key);
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const tap = useCallback((timeStamp: number) => {
    drumThump();
    setDrumHit((n) => n + 1);
    const playback = playbackRef.current;
    if (!playback || playing !== "tap") return;
    const at = playback.tapTime(timeStamp);
    if (at > -WINDOW) tapsRef.current.push(at);
  }, [playing]);

  // Space, J or F strike the drum during a tapping run.
  useEffect(() => {
    if (playing !== "tap") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || !(event.code === "Space" || event.code === "KeyJ" || event.code === "KeyF")) return;
      event.preventDefault();
      tap(event.timeStamp);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [playing, tap]);

  const onDrum = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    tap(event.timeStamp);
  };

  const regenerate = () => setRandomIds(generateRhythm(allowed, meter, barCount));
  const regenerateLevel = (index = levelIndex) => {
    const stage = LEVELS[index];
    setLevelIds(generateRhythm(stage.patterns, METER_BY_ID.get(stage.meter)!, LEVEL_BARS));
  };
  const openLevel = (index: number) => {
    setLevelIndex(index);
    regenerateLevel(index);
  };
  const levelOpen = (index: number) => unlockAll || index === 0 || (levelStars[index - 1] ?? 0) > 0;

  const changeMeter = (next: MeterId) => {
    setMeterId(next);
    if (mode === "random") setRandomIds(generateRhythm(allowed, METER_BY_ID.get(next)!, barCount));
    if (dictating) newQuestion({ meter: METER_BY_ID.get(next)! });
  };
  const changeBars = (next: number) => {
    setBarCount(next);
    setRandomIds(generateRhythm(allowed, meter, next));
  };

  const toggleAllowed = (id: string) => {
    setAllowed((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };
  const setLevelAllowed = (lvl: number, on: boolean) => {
    const levelIdsOfGroup = RHYTHM_PATTERNS.filter((p) => p.family === meter.family && p.level === lvl).map((p) => p.id);
    setAllowed((current) => on ? [...new Set([...current, ...levelIdsOfGroup])] : current.filter((id) => !levelIdsOfGroup.includes(id)));
  };

  const editFull = (() => {
    const packed = packBars(editIds, meter);
    const last = packed[packed.length - 1];
    return packed.length >= MAX_EDIT_BARS && last.empty === 0;
  })();

  // 自己编排 writes the teacher's rhythm; 节奏听写 writes the pupil's answer, no longer than the question.
  const writing = dictating ? answerIds : editIds;
  const setWriting = dictating ? setAnswerIds : setEditIds;
  const writeLimit = dictating ? dictBars : MAX_EDIT_BARS;
  const answerFull = (() => {
    const packed = packBars(answerIds, meter);
    return packed.length >= dictBars && packed[packed.length - 1].empty === 0;
  })();
  const insert = (pattern: RhythmPattern) => {
    const at = selected === null ? writing.length : selected + 1;
    const next = [...writing.slice(0, at), pattern.id, ...writing.slice(at)];
    const packed = packBars(next, meter);
    if (packed.length > writeLimit) return;
    setWriting(next);
    setSelected(selected === null ? null : at);
  };
  const removeSelected = () => {
    if (selected === null) return;
    setWriting((current) => current.filter((_, i) => i !== selected));
    setSelected(selected > 0 ? selected - 1 : null);
  };

  const newQuestion = (change: { meter?: typeof meter; bars?: number; level?: RhythmLevel } = {}) => {
    const nextMeter = change.meter ?? meter;
    setQuestionIds(dictationQuestion(dictationPool(nextMeter, change.level ?? dictLevel), nextMeter, change.bars ?? dictBars));
    // 下一题 moves the count on; changing a setting mid-question keeps its number.
    if (revealed) setQuestionNo((n) => n + 1);
    setAnswerIds([]);
    setSelected(null);
    setRevealed(false);
    setListens(0);
  };
  const reveal = () => {
    stop();
    setSelected(null);
    setRevealed(true);
    const marks = gradeDictation(questionIds, answerIds, meter);
    setRecords((current) => [...current, { right: marks.filter(Boolean).length, total: marks.length, onScreen: answerIds.length > 0 }].slice(-40));
  };
  const changeMode = (next: Mode) => {
    setMode(next);
    setSelected(null);
    // The meter is shared: if it changed in another mode, the old question no longer fits.
    if (next === "dictation" && !dictating) {
      // (In 闯关 the active meter is the level's: dictation uses the chosen one.)
      const dictMeter = METER_BY_ID.get(meterId)!;
      const packed = packBars(questionIds, dictMeter);
      if (packed.length !== dictBars || packed.some((bar) => bar.empty > 0)) newQuestion({ meter: dictMeter });
    }
  };
  const copyToEdit = () => {
    setEditIds(randomIds);
    setSelected(null);
    setMode("edit");
  };

  const savePractice = () => {
    const name = saveName.trim() || `我的练习 ${mine.length + 1}`;
    const practice: Practice = { id: `${Date.now()}`, name, meter: meterId, bpm, ids: editIds };
    setMine((current) => [practice, ...current].slice(0, MAX_SAVED));
    setSaveName("");
  };
  const openPractice = (practice: Practice) => {
    setMeterId(practice.meter);
    setBpm(practice.bpm);
    setEditIds(practice.ids);
    setSelected(null);
  };
  const deletePractice = (id: string) => setMine((current) => current.filter((p) => p.id !== id));

  // Projected full screen: shrink the score until the whole stage (every bar, the controls) fits on one screen.
  useEffect(() => {
    const stage = stageRef.current;
    const scores = [...(stage?.querySelectorAll<HTMLElement>(".rhythm-score") ?? [])];
    if (!stage || !scores.length) return;
    // 节奏听写 shows the answer and the question together: both shrink alike.
    const fit = () => {
      scores.forEach((score) => { score.style.fontSize = ""; });
      if (document.fullscreenElement !== stage) return;
      let size = parseFloat(getComputedStyle(scores[0]).fontSize);
      for (let i = 0; i < 24 && stage.scrollHeight > stage.clientHeight && size > 18; i += 1) {
        size *= 0.92;
        scores.forEach((score) => { score.style.fontSize = `${size}px`; });
      }
    };
    fit();
    document.addEventListener("fullscreenchange", fit);
    window.addEventListener("resize", fit);
    return () => {
      document.removeEventListener("fullscreenchange", fit);
      window.removeEventListener("resize", fit);
    };
  }, [shownBars, answerBars, revealed, meter, mode, result, countdown]);

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
  const answerFilled = answerIds.length ? packBars(answerIds, meter).filter((bar) => bar.empty === 0).length : 0;
  const onScreen = records.filter((record) => record.onScreen);
  const recordRight = onScreen.reduce((sum, record) => sum + record.right, 0);
  const recordTotal = onScreen.reduce((sum, record) => sum + record.total, 0);
  const dictPatterns = new Set(dictationPool(meter, dictLevel));
  const passed = mode === "levels" && result !== null && result.score >= PASS_SCORE;
  const tempoMark = meter.bottom === 8 ? "♪" : "♩";

  return (
    <section className="rhythm-lab" aria-labelledby="rhythm-title">
      <header className="rhythm-intro">
        <h2 id="rhythm-title">{dictating ? "听一听，写下来" : "听一听，拍一拍"}</h2>
        <div className="rhythm-mode" role="radiogroup" aria-label="练习方式">
          {MODES.map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={mode === value} className={mode === value ? "is-active" : ""} onClick={() => changeMode(value)}>{label}</button>
          ))}
        </div>
      </header>

      {mode === "levels" ? (
        <div className="rhythm-levels">
          <ol className="rhythm-level-path" aria-label="关卡" style={{ "--path-art": `url("${publicAssetUrl("art/rhythm/level-path.webp")}")` } as CSSProperties}>
            {LEVELS.map((stage, index) => {
              const open = levelOpen(index);
              const stars = levelStars[index] ?? 0;
              return (
                <li key={stage.name} style={{ "--x": `${PATH_STOPS[index][0] / 16}%`, "--y": `${PATH_STOPS[index][1] / 6}%` } as CSSProperties}>
                  <button
                    type="button"
                    className={`rhythm-stop${index === levelIndex ? " is-active" : ""}${stars ? " is-cleared" : ""}`}
                    disabled={!open || !!playing}
                    aria-current={index === levelIndex ? "step" : undefined}
                    aria-label={`第 ${index + 1} 关 ${stage.name}${stars ? `，已过关 ${stars} 星` : open ? "" : "，未解锁"}`}
                    onClick={() => openLevel(index)}
                  >
                    <span className="rhythm-stop-number">{open ? index + 1 : "🔒"}</span>
                    <span className="rhythm-stop-name">{stage.name}</span>
                    <span className="rhythm-stop-stars" aria-hidden="true">{stars ? STAR_TEXT[stars] : " "}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="rhythm-level-info">
            <p>
              <strong>第 {levelIndex + 1} 关 · {level.name}</strong>
              <span>{level.meter} 拍 · {tempoMark} = {level.bpm} · {LEVEL_BARS} 小节 · {PASS_SCORE} 分过关</span>
            </p>
            <label className="rhythm-toggle">
              <input type="checkbox" checked={unlockAll} onChange={(event) => setUnlockAll(event.target.checked)} />
              <span>老师：所有关卡都可选</span>
            </label>
          </div>
        </div>
      ) : (
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
          {dictating && (
            <>
              <div className="rhythm-field">
                <span className="rhythm-field-label">小节数</span>
                <div className="rhythm-chips">
                  {DICTATION_BARS.map((n) => (
                    <button key={n} type="button" aria-pressed={dictBars === n} className={dictBars === n ? "is-active" : ""} disabled={!!playing} onClick={() => { setDictBars(n); newQuestion({ bars: n }); }}>{n} 小节</button>
                  ))}
                </div>
              </div>
              <div className="rhythm-field">
                <span className="rhythm-field-label">难度</span>
                <div className="rhythm-chips">
                  {RHYTHM_LEVELS[meter.family].map(({ level: lvl, label }) => (
                    <button key={lvl} type="button" aria-pressed={dictLevel === lvl} className={dictLevel === lvl ? "is-active" : ""} disabled={!!playing} onClick={() => { setDictLevel(lvl); newQuestion({ level: lvl }); }}>{label}</button>
                  ))}
                </div>
              </div>
            </>
          )}
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
            <output>{tempoMark} = {bpm}</output>
          </label>
        </div>
      )}

      <div className="rhythm-stage" ref={stageRef}>
        {dictating ? (
          <div className="rhythm-dictation">
            <p className="rhythm-dictation-head">
              <strong>第 {questionNo} 题</strong>
              <span>{meter.id} 拍 · {tempoMark} = {bpm} · {dictBars} 小节 · {revealed ? "已公布答案" : listens ? `已听 ${listens} 遍` : "先点「听题目」"}</span>
            </p>
            {(!revealed || answerIds.length > 0) && <>
              <p className="rhythm-score-label">{revealed ? "我写的" : "点下面的节奏型写在这里，也可以写在纸上"}</p>
              <RhythmScore
                bars={answerBars}
                meter={meter}
                activeKey={null}
                countdown={revealed ? null : countdown}
                selected={revealed ? null : selected}
                onSelect={revealed ? undefined : (index) => setSelected(selected === index ? null : index)}
                barMarks={answerMarks}
                label="我写的节奏"
              />
            </>}
            {revealed && <>
              <p className="rhythm-score-label is-answer">正确答案</p>
              <RhythmScore bars={bars} meter={meter} activeKey={activeKey} countdown={countdown} label="正确答案" />
            </>}
          </div>
        ) : (
        <RhythmScore
          bars={shownBars}
          meter={meter}
          activeKey={activeKey}
          marks={result?.marks}
          countdown={countdown}
          selected={selected}
          onSelect={mode === "edit" ? (index) => setSelected(selected === index ? null : index) : undefined}
        />
        )}

        <div className="rhythm-play-row">
          <div className="rhythm-transport">
            <button type="button" className={`rhythm-play${playing === "listen" ? " is-playing" : ""}`} onClick={() => void start("listen")} disabled={!hasNotes || audioLoading || playing === "tap"}>
              {playing === "listen" ? "■ 停止" : audioLoading ? "载入钢琴音…" : mode === "levels" ? "▶ 听示范" : dictating ? (revealed ? "▶ 听答案" : listens ? "▶ 再听一遍" : "▶ 听题目") : "▶ 播放"}
            </button>
            {!dictating && (
              <button type="button" className={`rhythm-tap-start${playing === "tap" ? " is-playing" : ""}`} onClick={() => void start("tap")} disabled={!hasNotes || audioLoading || playing === "listen"}>
                {playing === "tap" ? "■ 停止" : mode === "levels" ? "开始闯关" : "跟拍打分"}
              </button>
            )}
            {dictating && (revealed ? (
              <button type="button" className="rhythm-tap-start" onClick={() => newQuestion()} disabled={!!playing}>下一题</button>
            ) : (
              <>
                <button type="button" className="rhythm-tap-start" onClick={reveal} disabled={!listens}>看答案</button>
                <button type="button" className="rhythm-secondary" onClick={removeSelected} disabled={selected === null}>删除所选</button>
                <button type="button" className="rhythm-ghost" onClick={() => { setAnswerIds([]); setSelected(null); }} disabled={!answerIds.length}>清空</button>
              </>
            ))}
            {mode === "random" && (
              <>
                <button type="button" className="rhythm-secondary" onClick={regenerate} disabled={!!playing}>换一条</button>
                <button type="button" className="rhythm-ghost" onClick={copyToEdit} disabled={!!playing}>拿去修改</button>
              </>
            )}
            {mode === "edit" && (
              <>
                <button type="button" className="rhythm-secondary" onClick={removeSelected} disabled={selected === null || !!playing}>删除所选</button>
                <button type="button" className="rhythm-ghost" onClick={() => { setEditIds([]); setSelected(null); }} disabled={!editIds.length || !!playing}>清空</button>
              </>
            )}
            {mode === "levels" && (
              <button type="button" className="rhythm-secondary" onClick={() => regenerateLevel()} disabled={!!playing}>换一条</button>
            )}
            {mode !== "levels" && (
              <div className="rhythm-toggles">
                {(dictating ? [
                  ["节拍器", metronomeOn, setMetronomeOn],
                  ["预备拍", countIn, setCountIn],
                ] as const : [
                  ["节奏声", rhythmOn, setRhythmOn],
                  ["节拍器", metronomeOn, setMetronomeOn],
                  ["预备拍", countIn, setCountIn],
                  ["循环", loop, setLoop],
                ] as const).map(([label, value, set]) => (
                  <label key={label} className="rhythm-toggle">
                    <input type="checkbox" checked={value} disabled={!!playing} onChange={(event) => set(event.target.checked)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            )}
            <button type="button" className="rhythm-ghost rhythm-fullscreen" onClick={fullscreen}>投屏全屏</button>
          </div>
          {!dictating && <div className="rhythm-drum-wrap">
            <button
              type="button"
              className={`rhythm-drum${playing === "tap" ? " is-armed" : ""}`}
              aria-label="鼓：跟拍时点这里，或按空格键、J 键、F 键"
              onPointerDown={onDrum}
              onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") event.preventDefault(); }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain image */}
              <img className="rhythm-drum-img" src={publicAssetUrl("art/rhythm/drum.webp")} alt="" draggable={false} />
              {/* Each stroke remounts the struck drum so its flash replays. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain image */}
              {drumHit > 0 && <img key={drumHit} className="rhythm-drum-img is-hit" src={publicAssetUrl("art/rhythm/drum-hit.webp")} alt="" draggable={false} />}
            </button>
            <small>{playing === "tap" ? "跟着节奏敲鼓！" : "点鼓或按空格键"}</small>
          </div>}
        </div>

        {result && (
          <div className={`rhythm-result${passed ? " is-passed" : ""}`} role="status">
            <div className="rhythm-result-score">
              <strong>{result.score}</strong><span>分</span>
              <em aria-label={`${result.stars} 星`}>{result.stars ? STAR_TEXT[result.stars] : "再试一次"}</em>
            </div>
            <ul>
              <li className="is-good">准 {result.good}</li>
              <li className="is-early">稍早 {result.early}</li>
              <li className="is-late">稍晚 {result.late}</li>
              <li className="is-miss">漏拍 {result.miss}</li>
              <li>多拍 {result.extra}</li>
            </ul>
            <div className="rhythm-result-actions">
              <button type="button" className="rhythm-secondary" onClick={() => void start("tap")}>再来一次</button>
              {mode === "levels" && passed && levelIndex < LEVELS.length - 1 && (
                <button type="button" className="rhythm-play" onClick={() => openLevel(levelIndex + 1)}>下一关</button>
              )}
              {mode === "levels" && !passed && <span className="rhythm-result-hint">达到 {PASS_SCORE} 分就能过关</span>}
              {mode === "levels" && passed && levelIndex === LEVELS.length - 1 && <span className="rhythm-result-hint">全部关卡都通过了！</span>}
            </div>
          </div>
        )}
        {dictating && revealed && (
          <div className={`rhythm-result${answerMarks?.every(Boolean) ? " is-passed" : ""}`} role="status">
            {answerMarks ? (
              <div className="rhythm-result-score">
                <strong>{answerMarks.filter(Boolean).length}</strong><span>/ {answerMarks.length} 小节写对了</span>
                <em>{answerMarks.every(Boolean) ? "全对！" : `听了 ${listens} 遍`}</em>
              </div>
            ) : (
              <p className="rhythm-result-hint is-wrap">对照正确答案，看看纸上写对了几小节。可以点「听答案」边听边看。</p>
            )}
            {answerMarks && !answerMarks.every(Boolean) && <span className="rhythm-result-hint">打 ✗ 的小节，对照下面的正确答案再听一遍。</span>}
          </div>
        )}
        {dictating && !revealed && <p className="rhythm-status">{listens ? `已写 ${answerFilled} / ${dictBars} 小节。听够了点「看答案」，写在纸上的同学也可以直接对答案。` : "先点「听题目」，有预备拍，听完可以再听。"}{selected !== null && " 新的节奏型会插在所选的后面。"}</p>}
        {mode === "edit" && <p className="rhythm-status">{editStatus}{selected !== null && " 新的节奏型会插在所选的后面。"}</p>}
        {audioError && <p className="rhythm-status">钢琴音载入失败，请检查网络后再试。</p>}
        {mode === "random" && !familyPatterns.some((p) => allowed.includes(p.id)) && <p className="rhythm-status">这个拍号下还没有勾选节奏型，暂时只用{meter.family === "compound" ? "三个八分音符" : "四分音符"}出题。</p>}
      </div>

      {mode === "edit" && (
        <section className="rhythm-mine" aria-labelledby="rhythm-mine-title">
          <header>
            <h3 id="rhythm-mine-title">我的练习</h3>
            <form className="rhythm-save" onSubmit={(event) => { event.preventDefault(); savePractice(); }}>
              <input value={saveName} maxLength={24} placeholder="给这条节奏起个名字" aria-label="练习名称" onChange={(event) => setSaveName(event.target.value)} />
              <button type="submit" className="rhythm-secondary" disabled={!editIds.length}>保存</button>
            </form>
          </header>
          {mine.length ? (
            <ul className="rhythm-mine-list">
              {mine.map((practice) => (
                <li key={practice.id}>
                  <button type="button" className="rhythm-mine-open" onClick={() => openPractice(practice)}>
                    <strong>{practice.name}</strong>
                    <small>{practice.meter} 拍 · {packBars(practice.ids, METER_BY_ID.get(practice.meter)!).length} 小节</small>
                  </button>
                  <button type="button" className="rhythm-mine-delete" aria-label={`删除 ${practice.name}`} onClick={() => deletePractice(practice.id)}>×</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rhythm-status">编好的节奏点「保存」，以后上课直接打开。只保存在这台电脑的浏览器里。</p>
          )}
        </section>
      )}

      {dictating && records.length > 0 && (
        <section className="rhythm-record" aria-labelledby="rhythm-record-title">
          <header>
            <h3 id="rhythm-record-title">这一轮的听写</h3>
            <p>{recordTotal ? `屏幕上写了 ${onScreen.length} 题，共写对 ${recordRight} / ${recordTotal} 小节（${Math.round((recordRight / recordTotal) * 100)}%）` : "都写在纸上，对照答案自己数一数写对了几小节。"}</p>
            <button type="button" className="rhythm-level-toggle" onClick={() => setRecords([])}>清空记录</button>
          </header>
          <ol>
            {records.map((record, index) => (
              <li key={index} className={!record.onScreen ? "is-paper" : record.right === record.total ? "is-all" : record.right * 2 >= record.total ? "is-half" : "is-low"}>
                <span>第 {index + 1} 题</span>
                <strong>{record.onScreen ? `${record.right} / ${record.total}` : "纸上作答"}</strong>
              </li>
            ))}
          </ol>
        </section>
      )}

      {mode !== "levels" && (
        <div className="rhythm-library">
          <p className="rhythm-library-hint">
            {mode === "random" ? "勾选要练的节奏型，「换一条」只会用到勾选的这些。"
              : dictating ? (revealed ? "点「下一题」继续听写。" : answerFull ? `${dictBars} 小节都写满了，可以点「看答案」。` : "点节奏型，按听到的顺序写进上面的小节。题目只会用到下面这些节奏型。")
              : editFull ? `已经编满 ${MAX_EDIT_BARS} 小节了。` : "点一个节奏型，把它加进节奏谱。"}
          </p>
          {RHYTHM_LEVELS[meter.family].filter(({ level: lvl }) => !dictating || lvl <= dictLevel).map(({ level: lvl, label, caption }) => {
            const levelPatterns = familyPatterns.filter((p) => p.level === lvl);
            const allOn = levelPatterns.every((p) => allowed.includes(p.id));
            return (
              <section key={lvl} className="rhythm-level" aria-label={`${label}节奏型`}>
                <header>
                  <h3>{label}</h3>
                  <p>{caption}</p>
                  {mode === "random" && (
                    <button type="button" className="rhythm-level-toggle" onClick={() => setLevelAllowed(lvl, !allOn)}>{allOn ? "取消本组" : "全选本组"}</button>
                  )}
                </header>
                <div className="rhythm-cards">
                  {levelPatterns.filter((pattern) => !dictating || dictPatterns.has(pattern.id)).map((pattern) => {
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
                        <PatternGlyph pattern={pattern} fit />
                        <span className="rhythm-card-name">{pattern.name}</span>
                        <small>{Math.round(pattern.beats / meter.unit)} 拍</small>
                      </button>
                    ) : (
                      <button
                        key={pattern.id}
                        type="button"
                        className="rhythm-card"
                        disabled={!fits || (dictating ? revealed || answerFull : editFull)}
                        onClick={() => insert(pattern)}
                      >
                        <span className="rhythm-check is-add" aria-hidden="true">＋</span>
                        <PatternGlyph pattern={pattern} fit />
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
      )}
    </section>
  );
}
