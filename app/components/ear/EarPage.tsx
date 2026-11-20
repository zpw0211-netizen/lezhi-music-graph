"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { getPianoAudioContext } from "../../lib/lesson/piano-sampler";
import { loadInstrumentSampler, playInstrumentSample } from "../../lib/lesson/instrument-sampler";
import { PITCH_SETS, colorOf, midiOfNote, type PitchSet } from "../compose/compose-model";
import {
  CHORDS, CHORD_SETS, EAR_GROUPS, EAR_LEVELS, INTERVAL_NAMES, INTERVAL_SETS, LONG_SHORT, LOUDNESS, MODES, MODE_SETS, REFERENCE, ROUND,
  loadBest, loudnessChoices, makeQuestion, modeClipsFromMelodies, praise, questionBpm, questionSound, saveBest, stars, toneName,
  type ChordQuality, type ChordSet, type EarGroup, type EarLevel, type EarOptions, type IntervalSet, type Loudness,
  type ModeClip, type ModeId, type ModeSet, type Question, type SoundNote, type Tone, type UpDown,
} from "./ear-model";
import { TIMBRES, availableTimbreSets, playTimbre, preloadTimbres, timbreLabel, timbresIn } from "./ear-timbre";

let currentOut: GainNode | null = null;
/** 停掉正在响的题目（换关、换设置、离开本页时）。 */
function stopSound() {
  currentOut?.disconnect();
  currentOut = null;
}
function freshOut(ctx: AudioContext) {
  currentOut?.disconnect();
  const out = ctx.createGain();
  out.connect(ctx.destination);
  currentOut = out;
  return out;
}
/** Plays [midi, start beat, beats, loudness?][] on the piano; a new call silences the previous one. */
async function playSequence(notes: SoundNote[], bpm = 90) {
  try {
    const ctx = getPianoAudioContext();
    await ctx.resume();
    const sampler = await loadInstrumentSampler(ctx, "piano");
    const out = freshOut(ctx);
    const start = ctx.currentTime + 0.06;
    const beat = 60 / bpm;
    for (const [midi, at, length, level] of notes) playInstrumentSample(ctx, "piano", sampler, midi, start + at * beat, length * beat, out, level ?? 0.9);
  } catch {
    // 没有声音时题目仍可作答。
  }
}
async function playQuestion(question: Question) {
  if (question.kind !== "timbre") return playSequence(questionSound(question), questionBpm(question));
  try {
    const ctx = getPianoAudioContext();
    await ctx.resume();
    await playTimbre(ctx, question.id, freshOut(ctx));
  } catch {
    // 录音载不进来时仍可作答。
  }
}

type Answer = { correct: boolean | null; given: string; marks?: boolean[]; praise?: string };
type LogEntry = { ok: boolean | null; text: string };

const UPDOWN: Array<{ id: UpDown; label: string; icon: string }> = [
  { id: "up", label: "更高", icon: "↑" },
  { id: "down", label: "更低", icon: "↓" },
  { id: "same", label: "一样高", icon: "=" },
];
const TEAM_NAMES = ["第一组", "第二组", "第三组", "第四组"];

function Stars({ count, size = "md" }: { count: number; size?: "md" | "lg" }) {
  return <span className={`ear-stars is-${size}`} aria-label={`${count} 颗星`}>
    {[0, 1, 2].map((k) => <span key={k} className={k < count ? "is-on" : ""} aria-hidden="true">★</span>)}
  </span>;
}

/** 选择题（长短、强弱、音色、和弦、调式）的选项：[答案编号, 按钮文字, 答后显示的说明]。 */
function choicesOf(question: Question, options: EarOptions): Array<[string, string, string?]> {
  switch (question.kind) {
    case "duration": return LONG_SHORT.map((item) => [item.id, item.label]);
    case "dynamics": return loudnessChoices(question).map((id) => [id, LOUDNESS[id]]);
    case "timbre": return question.choices.map((id) => [id, timbreLabel(id), TIMBRES.find((item) => item.id === id)?.hint]);
    case "chord": return CHORD_SETS[options.chordSet].qualities.map((id: ChordQuality) => [id, CHORDS[id].label, CHORDS[id].hint]);
    case "mode": return MODE_SETS[options.modeSet].modes.map((id: ModeId) => [id, MODES[id].label]);
    default: return [];
  }
}
function rightChoice(question: Question): string {
  switch (question.kind) {
    case "duration": return question.answer;
    case "dynamics": return question.answer;
    case "timbre": return question.id;
    case "chord": return question.quality;
    case "mode": return question.clip.mode;
    case "updown": return question.answer;
    case "interval": return String(question.steps);
    case "solfege": return `${question.tone.d}:${question.tone.o}`;
    case "dictation": return "";
  }
}

export function EarPage({ bookKeys }: { bookKeys?: string[] } = {}) {
  const [level, setLevel] = useState<EarLevel>("updown");
  const [options, setOptions] = useState<EarOptions>({ pitchSet: "five", intervals: "basic", harmonic: false, length: 4, timbreSet: "percussion", chordSet: "basic", modeSet: "basic" });
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [typed, setTyped] = useState<Tone[]>([]);
  // 本页在主页面水合后才载入，可以直接读本机记录。
  const [best, setBest] = useState<Record<string, number>>(() => (typeof window === "undefined" ? {} : loadBest()));
  const [modeClips, setModeClips] = useState<ModeClip[]>([]);
  const [classMode, setClassMode] = useState(false);
  const [scores, setScores] = useState<number[]>([0, 0]);
  const [projecting, setProjecting] = useState(false);
  const advanceTimer = useRef<number | undefined>(undefined);
  const stageRef = useRef<HTMLElement>(null);
  /** 同一题只记一次（连按两下时第二下不再算）。 */
  const settledRef = useRef(false);
  /** 一轮里用过的课本歌曲，不重复出。 */
  const usedTitles = useRef<string[]>([]);

  const results = log.map((entry) => entry.ok);
  const finished = started && log.length >= ROUND && !answer;
  const correctCount = results.filter((ok) => ok === true).length;
  const settingKey = level === "solfege" ? options.pitchSet
    : level === "interval" ? `${options.intervals}-${options.harmonic ? "h" : "m"}`
    : level === "dictation" ? `${options.pitchSet}-${options.length}`
    : level === "timbre" ? options.timbreSet
    : level === "chord" ? options.chordSet
    : level === "mode" ? options.modeSet : "";
  const bestKey = `${level}:${settingKey}`;
  const levelInfo = EAR_LEVELS.find((item) => item.id === level)!;
  const group = levelInfo.group;
  const blocks = PITCH_SETS[options.pitchSet].blocks;
  const timbreSets = availableTimbreSets();

  useEffect(() => () => { window.clearTimeout(advanceTimer.current); stopSound(); }, []);

  // 调式题优先用课本旋律：进这一关时才载入本版本的旋律数据。
  useEffect(() => {
    if (level !== "mode" || modeClips.length) return;
    let alive = true;
    void import("../../lib/lesson/melodies").then(({ BOOK_MELODIES }) => {
      if (!alive) return;
      const keys = bookKeys?.length ? bookKeys : Object.keys(BOOK_MELODIES);
      const entries = keys.flatMap((key) => Object.entries(BOOK_MELODIES[key] ?? {}).flatMap(([title, melodies]) => (melodies[0] ? [{ title: title.replace(/^《|》$/g, "").replace(/（[^）]*）$/, ""), melody: melodies[0] }] : [])));
      const seen = new Set<string>();
      setModeClips(modeClipsFromMelodies(entries.filter((entry) => !seen.has(entry.title) && Boolean(seen.add(entry.title)))));
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [level, modeClips.length, bookKeys]);

  useEffect(() => {
    if (level !== "timbre") return;
    try { void preloadTimbres(getPianoAudioContext(), timbresIn(options.timbreSet).map((item) => item.id)).catch(() => undefined); } catch { /* 没有音频时照样能看题 */ }
  }, [level, options.timbreSet]);

  useEffect(() => {
    const sync = () => setProjecting(Boolean(stageRef.current) && document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const reset = () => {
    window.clearTimeout(advanceTimer.current);
    stopSound();
    setStarted(false);
    setIndex(0);
    setQuestion(null);
    setAnswer(null);
    setLog([]);
    setTyped([]);
  };

  /** 一轮做到一半时，换关或换设置要重新出题，先问一声。 */
  const inRound = started && !finished && (log.length > 0 || typed.length > 0 || answer !== null);
  const mayRestart = (what: string) => !inRound || window.confirm(log.length ? `${what}会重新开始这一轮，已经做的 ${log.length} 题不再计分，确定吗？` : `${what}会重新开始这一轮，确定吗？`);

  const chooseLevel = (next: EarLevel) => {
    if (next === level || !mayRestart("换关")) return;
    setLevel(next);
    reset();
  };
  const chooseGroup = (next: EarGroup) => {
    if (next === group) return;
    chooseLevel(EAR_LEVELS.find((item) => item.group === next)!.id);
  };
  const changeOptions = (patch: Partial<EarOptions>) => {
    if ((Object.keys(patch) as Array<keyof EarOptions>).every((key) => options[key] === patch[key])) return;
    if (!mayRestart("换设置")) return;
    setOptions((current) => ({ ...current, ...patch }));
    reset();
  };

  const pools = () => ({ timbres: timbresIn(options.timbreSet).map((item) => item.id), modeClips, usedTitles: usedTitles.current });
  const ask = (nextIndex: number, previous: Question | null) => {
    const next = makeQuestion(level, nextIndex, options, previous, Math.random, pools());
    settledRef.current = false;
    if (next.kind === "mode" && next.clip.title) usedTitles.current.push(next.clip.title);
    setQuestion(next);
    setIndex(nextIndex);
    setAnswer(null);
    setTyped([]);
    void playQuestion(next);
  };

  const start = () => {
    window.clearTimeout(advanceTimer.current);
    setStarted(true);
    setLog([]);
    usedTitles.current = [];
    ask(0, null);
  };

  const next = () => {
    window.clearTimeout(advanceTimer.current);
    if (log.length >= ROUND) {
      setAnswer(null);
      // 全班模式是大家一起答，不记进这台电脑的星星。
      const earned = stars(correctCount);
      if (!classMode && earned > (best[bestKey] ?? 0)) {
        const updated = { ...best, [bestKey]: earned };
        setBest(updated);
        saveBest(updated);
      }
      return;
    }
    ask(index + 1, question);
  };

  const settle = (result: Answer) => {
    if (!question || settledRef.current) return;
    settledRef.current = true;
    setAnswer(result.correct ? { ...result, praise: pickPraise() } : result);
    setLog((current) => [...current, { ok: result.correct, text: answerText(question) }]);
    // 答对了自动进入下一题；答错留时间对照正确答案。全班模式由老师点“下一题”。
    // 音色、和弦、调式答对后有一句说明，多停一会儿让学生看完。
    const pause = question.kind === "timbre" || question.kind === "chord" || question.kind === "mode" ? 2600 : 1100;
    if (result.correct && !classMode) advanceTimer.current = window.setTimeout(() => nextRef.current(), pause);
  };
  const nextRef = useRef(next);
  useEffect(() => { nextRef.current = next; });

  const answerChoice = (choice: string) => {
    if (!question || answer) return;
    if (question.kind === "updown" || question.kind === "interval" || question.kind === "solfege" || question.kind === "dictation") return;
    settle({ correct: choice === rightChoice(question), given: choice });
  };
  const answerUpDown = (choice: UpDown) => {
    if (!question || question.kind !== "updown" || answer) return;
    settle({ correct: choice === question.answer, given: choice });
  };
  const answerTone = (tone: Tone) => {
    if (!question || answer) return;
    if (question.kind === "solfege") {
      const correct = tone.d === question.tone.d && tone.o === question.tone.o;
      if (!correct) void playSequence([[midiOfNote(tone), 0, 1.2], [midiOfNote(question.tone), 1.5, 1.4]]);
      settle({ correct, given: `${tone.d}:${tone.o}` });
      return;
    }
    if (question.kind === "dictation") {
      if (typed.length >= question.tones.length) return;
      void playSequence([[midiOfNote(tone), 0, 0.9]]);
      setTyped((current) => [...current, tone]);
    }
  };
  const submitDictation = () => {
    if (!question || question.kind !== "dictation" || answer || typed.length < question.tones.length) return;
    const marks = question.tones.map((tone, k) => typed[k]?.d === tone.d && typed[k]?.o === tone.o);
    settle({ correct: marks.every(Boolean), given: "", marks });
  };
  const answerInterval = (steps: number) => {
    if (!question || question.kind !== "interval" || answer) return;
    settle({ correct: steps === question.steps, given: String(steps) });
  };
  /** 全班模式：不作答，直接亮出答案（这一题不算对错）。 */
  const reveal = () => {
    if (!question || answer) return;
    settle({ correct: null, given: "", marks: question.kind === "dictation" ? question.tones.map(() => false) : undefined });
  };

  const replay = () => { if (question) void playQuestion(question); };
  const reference = () => void playSequence(REFERENCE, 90);

  const toggleProjection = () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.requestFullscreen?.().catch(() => undefined);
  };
  const toggleClassMode = () => {
    setClassMode((on) => !on);
    window.clearTimeout(advanceTimer.current);
  };
  const changeTeams = (count: number) => setScores((current) => Array.from({ length: count }, (_, k) => current[k] ?? 0));
  const award = (team: number, delta: number) => setScores((current) => current.map((score, k) => (k === team ? Math.max(0, score + delta) : score)));

  const choices = question ? choicesOf(question, options) : [];

  // 键盘：空格重听，数字键答唱名、听写或选项，上下方向键答高低，回车下一题。
  const onKey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
    if (event.ctrlKey || event.metaKey || event.altKey || !started || finished) return;
    if (event.key === " ") { event.preventDefault(); replay(); return; }
    if (event.key === "Enter") { if (answer) next(); else submitDictation(); return; }
    if (question?.kind === "updown") {
      if (event.key === "ArrowUp") answerUpDown("up");
      else if (event.key === "ArrowDown") answerUpDown("down");
      else if (event.key === "=") answerUpDown("same");
      return;
    }
    if (choices.length && /^[1-9]$/.test(event.key)) {
      const picked = choices[Number(event.key) - 1];
      if (picked) answerChoice(picked[0]);
      return;
    }
    if (event.key === "Backspace" && question?.kind === "dictation" && !answer) { setTyped((current) => current.slice(0, -1)); return; }
    if (/^[1-8]$/.test(event.key) && (question?.kind === "solfege" || question?.kind === "dictation")) {
      const digit = Number(event.key);
      const block = digit === 8 ? blocks.find((item) => item.o === 1) : blocks.find((item) => item.d === digit && item.o === 0);
      if (block) answerTone({ d: block.d, o: block.o });
    }
  };
  const keyRef = useRef(onKey);
  useEffect(() => { keyRef.current = onKey; });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyRef.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const verdict = answer && question ? feedback(question, answer) : "";
  const groupLevels = EAR_LEVELS.filter((item) => item.group === group);
  const hasSettings = ["solfege", "dictation", "interval", "timbre", "chord", "mode"].includes(level);
  const right = question ? rightChoice(question) : "";

  return <div className={`ear-lab${classMode ? " is-class" : ""}`}>
    <header className="ear-intro">
      <div>
        <h2>竖起小耳朵，听出声音的不同</h2>
      </div>
      <p className="ear-intro-tip">每轮 {ROUND} 题，答对 8 题得两颗星，全对得三颗星。</p>
    </header>

    <div className="ear-groups" role="tablist" aria-label="学段">
      {EAR_GROUPS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={group === item.id} className={group === item.id ? "is-active" : ""} onClick={() => chooseGroup(item.id)}>
        {item.label}<small>{item.caption}</small>
      </button>)}
    </div>

    <div className={`ear-levels is-${groupLevels.length}`} role="tablist" aria-label="关卡">
      {groupLevels.map((item) => {
        const number = EAR_LEVELS.findIndex((entry) => entry.id === item.id) + 1;
        const earned = Math.max(0, ...Object.entries(best).filter(([key]) => key.startsWith(`${item.id}:`)).map(([, value]) => value));
        return <button key={item.id} type="button" role="tab" aria-selected={level === item.id} className={`ear-level${level === item.id ? " is-active" : ""}`} onClick={() => chooseLevel(item.id)}>
          <span className="ear-level-number">第 {number} 关</span>
          <strong>{item.name}</strong>
          <small>{item.caption}</small>
          <span className="ear-level-foot"><em>{item.grade}</em><Stars count={earned} /></span>
        </button>;
      })}
    </div>

    {hasSettings && <div className="ear-settings">
      {(level === "solfege" || level === "dictation") && <Field label="用哪些音">
        {(Object.keys(PITCH_SETS) as PitchSet[]).map((key) =>
          <Chip key={key} active={options.pitchSet === key} onClick={() => changeOptions({ pitchSet: key })}>{PITCH_SETS[key].label}<small>{PITCH_SETS[key].caption}</small></Chip>)}
      </Field>}
      {level === "dictation" && <Field label="长度">
        {[4, 6, 8].map((length) => <Chip key={length} active={options.length === length} onClick={() => changeOptions({ length })}>{length} 个音</Chip>)}
      </Field>}
      {level === "interval" && <>
        <Field label="音程">
          {(Object.keys(INTERVAL_SETS) as IntervalSet[]).map((key) =>
            <Chip key={key} active={options.intervals === key} onClick={() => changeOptions({ intervals: key })}>{INTERVAL_SETS[key].label}<small>{INTERVAL_SETS[key].caption}</small></Chip>)}
        </Field>
        <Field label="听法">
          {([[false, "先后响（旋律音程）"], [true, "同时响（和声音程）"]] as const).map(([value, label]) =>
            <Chip key={label} active={options.harmonic === value} onClick={() => changeOptions({ harmonic: value })}>{label}</Chip>)}
        </Field>
      </>}
      {level === "timbre" && <Field label="乐器">
        {timbreSets.map((set) => <Chip key={set.id} active={options.timbreSet === set.id} onClick={() => changeOptions({ timbreSet: set.id })}>
          {set.label}<small>{timbresIn(set.id).map((item) => item.label).join(" ")}</small>
        </Chip>)}
      </Field>}
      {level === "chord" && <Field label="和弦">
        {(Object.keys(CHORD_SETS) as ChordSet[]).map((key) =>
          <Chip key={key} active={options.chordSet === key} onClick={() => changeOptions({ chordSet: key })}>{CHORD_SETS[key].label}<small>{CHORD_SETS[key].caption}</small></Chip>)}
      </Field>}
      {level === "mode" && <Field label="调式">
        {(Object.keys(MODE_SETS) as ModeSet[]).map((key) =>
          <Chip key={key} active={options.modeSet === key} onClick={() => changeOptions({ modeSet: key })}>{MODE_SETS[key].label}<small>{MODE_SETS[key].caption}</small></Chip>)}
      </Field>}
    </div>}

    <section ref={stageRef} className={`ear-stage${projecting ? " is-projecting" : ""}${started || classMode ? " has-side" : ""}`} aria-label={`${levelInfo.name}练习`}>
      <div className="ear-main">
        <div className="ear-stage-bar">
          <span className="ear-stage-title">{levelInfo.name}</span>
          <span className="ear-stage-tools">
            <button type="button" className={`ear-class-toggle${classMode ? " is-on" : ""}`} aria-pressed={classMode} onClick={toggleClassMode}>
              <span aria-hidden="true">{classMode ? "●" : "○"}</span>全班模式
            </button>
            <button type="button" className="ear-ghost is-small" onClick={toggleProjection}>{projecting ? "退出全屏" : "投屏全屏"}</button>
          </span>
        </div>

        {!started && <div className="ear-start">
          <div className="ear-start-main">
            <p className="ear-start-title">{levelInfo.name}</p>
            <p className="ear-start-tip">{startTip(level, options, classMode)}</p>
            <div className="ear-start-actions">
              <button type="button" className="ear-primary" onClick={start}>开始一轮</button>
              {(level === "solfege" || level === "dictation" || level === "interval") && <button type="button" className="ear-ghost" onClick={reference}>先听标准音 la（440Hz）</button>}
            </div>
          </div>
          <ol className="ear-steps" aria-label="怎么玩">
            {classMode
              ? <><li><b>01</b><strong>放题</strong><span>老师点大按钮放题，全班一起听，可以多放几遍。</span></li>
                <li><b>02</b><strong>举手</strong><span>各组举手抢答，老师点他们说的答案；也可以点“揭晓答案”。</span></li>
                <li><b>03</b><strong>加分</strong><span>右边给答对的组加分，点“下一题”继续。</span></li></>
              : <><li><b>01</b><strong>听</strong><span>听清楚再回答，没听清可以重听（电脑上按空格键）。</span></li>
                <li><b>02</b><strong>答</strong><span>答对了自动进入下一题；答错了会给出正确答案，对照着再听。</span></li>
                <li><b>03</b><strong>得星</strong><span>每轮 10 题，答对 8 题得两颗星，全对得三颗星。</span></li></>}
          </ol>
        </div>}

        {finished && <div className="ear-result" role="status">
          {classMode ? <ClassResult scores={scores} /> : <>
            <Stars count={stars(correctCount)} size="lg" />
            <p className="ear-result-score"><b>{correctCount}</b> / {ROUND}</p>
            <p className="ear-result-praise">{praise(correctCount, level)}</p>
          </>}
          <div className="ear-start-actions">
            <button type="button" className="ear-primary" onClick={start}>再来一轮</button>
            {level !== EAR_LEVELS[EAR_LEVELS.length - 1].id && <button type="button" className="ear-ghost" onClick={() => chooseLevel(EAR_LEVELS[EAR_LEVELS.findIndex((item) => item.id === level) + 1].id)}>去下一关</button>}
          </div>
        </div>}

        {started && !finished && question && <div className="ear-play">
          <div className="ear-listen">
            <button type="button" className="ear-replay" onClick={replay} aria-label="再听一遍（空格键）">
              <span aria-hidden="true">♪</span>
              <small>{classMode ? "放题" : "再听一遍"}</small>
            </button>
            <div className="ear-question">
              <p className="ear-question-number">第 {index + 1} 题 / {ROUND}</p>
              <p className="ear-question-text">{questionText(question)}</p>
              {(level === "solfege" || level === "dictation" || level === "interval") && <button type="button" className="ear-ghost is-small" onClick={reference}>听标准音 la</button>}
            </div>
          </div>

          {question.kind === "updown" && <div className="ear-answers is-updown">
            {UPDOWN.map((item) => {
              const state = answer ? (item.id === question.answer ? " is-right" : item.id === answer.given ? " is-wrong" : " is-dim") : "";
              return <button key={item.id} type="button" className={`ear-answer${state}`} onClick={() => answerUpDown(item.id)} disabled={Boolean(answer)}>
                <span className="ear-answer-icon" aria-hidden="true">{item.icon}</span>{item.label}
              </button>;
            })}
          </div>}

          {choices.length > 0 && <div className={`ear-answers is-choice is-${question.kind}`}>
            {choices.map(([id, label, hint], k) => {
              const state = answer ? (id === right ? " is-right" : id === answer.given ? " is-wrong" : " is-dim") : "";
              return <button key={id} type="button" className={`ear-answer${state}`} onClick={() => answerChoice(id)} disabled={Boolean(answer)}>
                <span className="ear-answer-key" aria-hidden="true">{k + 1}</span>
                <span className="ear-answer-label">{label}{answer && hint && <small>{hint}</small>}</span>
              </button>;
            })}
          </div>}

          {question.kind === "interval" && <div className="ear-answers is-interval">
            {INTERVAL_SETS[options.intervals].steps.map((steps) => {
              const state = answer ? (steps === question.steps ? " is-right" : String(steps) === answer.given ? " is-wrong" : " is-dim") : "";
              return <button key={steps} type="button" className={`ear-answer${state}`} onClick={() => answerInterval(steps)} disabled={Boolean(answer)}>{INTERVAL_NAMES[steps]}</button>;
            })}
          </div>}

          {question.kind === "dictation" && <div className="ear-dictation">
            {question.tones.map((tone, k) => {
              const given = typed[k];
              const mark = answer?.marks ? (answer.marks[k] ? " is-right" : " is-wrong") : "";
              return <span key={k} className={`ear-slot${given ? " is-filled" : ""}${k === typed.length && !answer ? " is-cursor" : ""}${mark}`}>
                {given ? <b style={{ color: colorOf(given) }}>{given.o > 0 && <i className="ear-dot" aria-hidden="true" />}{given.d}</b> : <b className="ear-slot-empty">?</b>}
                {answer?.marks && !answer.marks[k] && <small>应为 {tone.d}{tone.o > 0 ? "·" : ""}</small>}
              </span>;
            })}
          </div>}

          {(question.kind === "solfege" || question.kind === "dictation") && <div className="ear-blocks">
            {blocks.map((block, k) => {
              const id = `${block.d}:${block.o}`;
              const state = answer && question.kind === "solfege" ? (block.d === question.tone.d && block.o === question.tone.o ? " is-right" : id === answer.given ? " is-wrong" : " is-dim") : "";
              return <button key={id} type="button" className={`ear-block${state}`} disabled={Boolean(answer) || (question.kind === "dictation" && typed.length >= question.tones.length)}
                style={{ "--block": block.color, "--step": k / Math.max(1, blocks.length - 1) } as CSSProperties}
                onClick={() => answerTone({ d: block.d, o: block.o })}>
                <span className="ear-block-digit">{block.o > 0 && <i className="ear-dot is-light" aria-hidden="true" />}{block.d}</span>
                <span className="ear-block-name">{block.o > 0 ? "高音 do" : block.name}</span>
              </button>;
            })}
          </div>}

          {question.kind === "dictation" && !answer && <div className="ear-row">
            <button type="button" className="ear-ghost" onClick={() => setTyped((current) => current.slice(0, -1))} disabled={!typed.length}>退一步</button>
            <button type="button" className="ear-primary" onClick={submitDictation} disabled={typed.length < question.tones.length}>写好了，对一对</button>
          </div>}

          <div className="ear-feedback" role="status" aria-live="polite">
            {answer && <>
              <p className={answer.correct === null ? "is-reveal" : answer.correct ? "is-right" : "is-wrong"}>{verdict}</p>
              {(answer.correct !== true || classMode) && <button type="button" className="ear-primary" onClick={next}>{log.length >= ROUND ? "看成绩" : "下一题"}</button>}
            </>}
            {!answer && classMode && <button type="button" className="ear-ghost" onClick={reveal}>揭晓答案</button>}
          </div>
        </div>}
      </div>

      {(started || classMode) && <aside className="ear-side" aria-label="本轮记录">
        {classMode && <div className="ear-teams">
          <p className="ear-side-title">各组得分
            <span className="ear-team-count">{[2, 3, 4].map((count) => <button key={count} type="button" aria-pressed={scores.length === count} className={scores.length === count ? "is-active" : ""} onClick={() => changeTeams(count)}>{count} 组</button>)}</span>
          </p>
          {scores.map((score, team) => <div key={team} className={`ear-team is-team-${team}`}>
            <span className="ear-team-name">{TEAM_NAMES[team]}</span>
            <b className="ear-team-score">{score}</b>
            <span className="ear-team-actions">
              <button type="button" onClick={() => award(team, -1)} aria-label={`${TEAM_NAMES[team]}减一分`} disabled={!score}>−</button>
              <button type="button" className="is-plus" onClick={() => award(team, 1)} aria-label={`${TEAM_NAMES[team]}加一分`}>+1</button>
            </span>
          </div>)}
          <button type="button" className="ear-ghost is-small ear-teams-reset" onClick={() => setScores((current) => current.map(() => 0))} disabled={!scores.some(Boolean)}>分数清零</button>
        </div>}
        {started && <div className="ear-round">
          <p className="ear-side-title">本轮 {ROUND} 题<span>答对 {correctCount} 题</span></p>
          <ol className="ear-round-list">
            {Array.from({ length: ROUND }, (_, k) => {
              const entry = log[k];
              const current = started && !finished && k === index && !entry;
              const state = entry ? (entry.ok === true ? "is-right" : entry.ok === false ? "is-wrong" : "is-reveal") : current ? "is-current" : "";
              return <li key={k} className={state}>
                <span className="ear-round-number">{k + 1}</span>
                <span className="ear-round-mark" aria-hidden="true">{entry ? (entry.ok === true ? "✓" : entry.ok === false ? "✗" : "·") : current ? "♪" : ""}</span>
                <span className="ear-round-text">{entry ? entry.text : current ? "正在听" : ""}</span>
              </li>;
            })}
          </ol>
        </div>}
      </aside>}
    </section>
    <p className="ear-keys">⌨ 空格键重听 · 数字键选答案或唱名 · ↑ ↓ 判断高低 · 回车下一题</p>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="ear-field"><span className="ear-field-label">{label}</span><div className="ear-chips">{children}</div></div>;
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={active} className={active ? "is-active" : ""} onClick={onClick}>{children}</button>;
}
function ClassResult({ scores }: { scores: number[] }) {
  const top = Math.max(...scores);
  const winners = scores.flatMap((score, k) => (score === top && top > 0 ? [TEAM_NAMES[k]] : []));
  return <>
    <p className="ear-result-score">{winners.length ? (winners.length > 1 ? `${winners.join("、")}并列第一` : `${winners[0]}得分最多`) : "这一轮结束了"}</p>
    <p className="ear-result-teams">{scores.map((score, k) => <span key={k} className={`is-team-${k}`}>{TEAM_NAMES[k]} <b>{score}</b></span>)}</p>
  </>;
}

function startTip(level: EarLevel, options: EarOptions, classMode: boolean) {
  const lead = classMode ? "投到大屏上，全班一起听。" : "";
  switch (level) {
    case "duration": return `${lead}先后响两个一样高的音，听一听哪个音更长。`;
    case "dynamics": return `${lead}听一听第二个音比第一个音更强还是更弱；后面几题会连响五下，听声音是越来越强还是越来越弱。`;
    case "timbre": return `${lead}听一段演奏，说出是哪件乐器的声音。答完会告诉你这件乐器的声音有什么特点。`;
    case "updown": return `${lead}先后弹两个音，听一听第二个音比第一个音更高、更低，还是一样高。`;
    case "solfege": return `${lead}先听标准音 la（440 赫兹），记住它的位置，再听题目里的音是哪一个唱名。`;
    case "interval": return `${lead}两个音之间相隔几度？从 do 到 re 是二度，do 到 mi 是三度，do 到高音 do 是八度。`;
    case "chord": return `${lead}三个音先一起响，再从低到高分开响。大三和弦听起来明亮，小三和弦柔和、暗淡。`;
    case "mode": return `${lead}听一段五声旋律，注意最后落在哪个音上：落在宫音（do）是宫调式，落在羽音（la）是羽调式。${options.modeSet === "full" ? "落在商、角、徵音上，就是商、角、徵调式。" : ""}题目多半选自课本里的歌。`;
    case "dictation": return `${lead}听一小段旋律，题目会告诉你第一个音，最后一个音落在 ${options.pitchSet === "three" ? "la" : "do"} 上。按顺序点音块写下来，可以多听几遍。`;
  }
}

function questionText(question: Question) {
  switch (question.kind) {
    case "duration": return "两个音，哪个更长？";
    case "dynamics": return question.levels.length > 2 ? "声音越来越强，还是越来越弱？" : "第二个音比第一个音……";
    case "timbre": return "这是什么乐器的声音？";
    case "updown": return "第二个音比第一个音……";
    case "solfege": return "这个音是哪个唱名？";
    case "interval": return question.harmonic ? "两个音同时响，相隔几度？" : "两个音先后响，相隔几度？";
    case "chord": return "这是什么和弦？";
    case "mode": return "这段旋律是什么调式？";
    case "dictation": return `旋律有 ${question.tones.length} 个音，第一个音是 ${toneName(question.tones[0])}。`;
  }
}

/** 本轮记录里每题的正确答案。 */
function answerText(question: Question) {
  switch (question.kind) {
    case "duration": return LONG_SHORT.find((item) => item.id === question.answer)!.label;
    case "dynamics": return LOUDNESS[question.answer];
    case "timbre": return timbreLabel(question.id);
    case "updown": return UPDOWN.find((item) => item.id === question.answer)!.label;
    case "solfege": return `${toneName(question.tone)}（${question.tone.d}）`;
    case "interval": return INTERVAL_NAMES[question.steps];
    case "chord": return CHORDS[question.quality].label;
    case "mode": return question.clip.title ? `${MODES[question.clip.mode].label} ·《${question.clip.title}》` : MODES[question.clip.mode].label;
    case "dictation": return question.tones.map((tone) => `${tone.d}${tone.o > 0 ? "·" : ""}`).join(" ");
  }
}

function modeNote(clip: ModeClip) {
  const mode = MODES[clip.mode];
  return `${clip.title ? `这是《${clip.title}》的结尾，` : "这句旋律"}最后落在${mode.tone}音上，是${mode.label}。`;
}

function feedback(question: Question, answer: Answer) {
  if (answer.correct) {
    const lead = answer.praise ?? "答对了！";
    if (question.kind === "mode") return `${lead}${modeNote(question.clip)}`;
    if (question.kind === "timbre") return `${lead}${timbreLabel(question.id)}：${TIMBRES.find((item) => item.id === question.id)?.hint}。`;
    if (question.kind === "chord") return `${lead}${CHORDS[question.quality].label}听起来${CHORDS[question.quality].hint}。`;
    return lead;
  }
  const lead = answer.correct === null ? "答案是" : "正确答案是";
  switch (question.kind) {
    case "duration": return `${lead}“${LONG_SHORT.find((item) => item.id === question.answer)!.label}”。再听一遍比较一下。`;
    case "dynamics": return `${lead}“${LOUDNESS[question.answer as Loudness]}”。再听一遍比较一下。`;
    case "timbre": {
      const item = TIMBRES.find((timbre) => timbre.id === question.id);
      return `${lead}${item?.label}：${item?.hint}。`;
    }
    case "updown": return `${lead}“${UPDOWN.find((item) => item.id === question.answer)!.label}”。再听一遍比较一下。`;
    case "solfege": return answer.correct === null ? `这个音是 ${toneName(question.tone)}（${question.tone.d}）。` : `这个音是 ${toneName(question.tone)}（${question.tone.d}）。刚才先弹你选的音，再弹正确的音。`;
    case "interval": return `这是${INTERVAL_NAMES[question.steps]}。`;
    case "chord": return `这是${CHORDS[question.quality].label}，听起来${CHORDS[question.quality].hint}。`;
    case "mode": return modeNote(question.clip);
    case "dictation": {
      if (answer.correct === null) return `旋律是 ${answerText(question)}。`;
      const wrong = answer.marks?.filter((mark) => !mark).length ?? 0;
      return `有 ${wrong} 个音不一样，看看标红的位置，再听一遍。`;
    }
  }
}

const PRAISES = ["答对了！", "真棒！", "耳朵真灵！", "完全正确！"];
function pickPraise() {
  return PRAISES[Math.floor(Math.random() * PRAISES.length)];
}

