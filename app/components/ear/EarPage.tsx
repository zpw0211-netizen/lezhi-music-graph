"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { getPianoAudioContext } from "../../lib/lesson/piano-sampler";
import { loadInstrumentSampler, playInstrumentSample } from "../../lib/lesson/instrument-sampler";
import { PITCH_SETS, colorOf, midiOfNote, type PitchSet } from "../compose/compose-model";
import {
  EAR_LEVELS, INTERVAL_NAMES, INTERVAL_SETS, REFERENCE, ROUND, loadBest, makeQuestion, praise, questionSound, saveBest, stars, toneName,
  type EarLevel, type IntervalSet, type Question, type Tone, type UpDown,
} from "./ear-model";

let currentOut: GainNode | null = null;
/** 停掉正在响的题目（换关、换设置、离开本页时）。 */
function stopSound() {
  currentOut?.disconnect();
  currentOut = null;
}
/** Plays [midi, start beat, beats][] on the piano; a new call silences the previous one. */
async function playSequence(notes: Array<[number, number, number]>, bpm = 90) {
  try {
    const ctx = getPianoAudioContext();
    await ctx.resume();
    const sampler = await loadInstrumentSampler(ctx, "piano");
    currentOut?.disconnect();
    const out = ctx.createGain();
    out.connect(ctx.destination);
    currentOut = out;
    const start = ctx.currentTime + 0.06;
    const beat = 60 / bpm;
    for (const [midi, at, length] of notes) playInstrumentSample(ctx, "piano", sampler, midi, start + at * beat, length * beat, out, 0.9);
  } catch {
    // 没有声音时题目仍可作答。
  }
}

type Answer = { correct: boolean; given: string; marks?: boolean[]; praise?: string };
type Options = { pitchSet: PitchSet; intervals: IntervalSet; harmonic: boolean; length: number };

const UPDOWN: Array<{ id: UpDown; label: string; icon: string }> = [
  { id: "up", label: "更高", icon: "↑" },
  { id: "down", label: "更低", icon: "↓" },
  { id: "same", label: "一样高", icon: "=" },
];

function Stars({ count, size = "md" }: { count: number; size?: "md" | "lg" }) {
  return <span className={`ear-stars is-${size}`} aria-label={`${count} 颗星`}>
    {[0, 1, 2].map((k) => <span key={k} className={k < count ? "is-on" : ""} aria-hidden="true">★</span>)}
  </span>;
}

export function EarPage() {
  const [level, setLevel] = useState<EarLevel>("updown");
  const [options, setOptions] = useState<Options>({ pitchSet: "five", intervals: "basic", harmonic: false, length: 4 });
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [typed, setTyped] = useState<Tone[]>([]);
  // 本页在主页面水合后才载入，可以直接读本机记录。
  const [best, setBest] = useState<Record<string, number>>(() => (typeof window === "undefined" ? {} : loadBest()));
  const advanceTimer = useRef<number | undefined>(undefined);

  const finished = started && results.length >= ROUND && !answer;
  const correctCount = results.filter(Boolean).length;
  const settingKey = level === "solfege" ? options.pitchSet : level === "interval" ? `${options.intervals}-${options.harmonic ? "h" : "m"}` : level === "dictation" ? `${options.pitchSet}-${options.length}` : "";
  const bestKey = `${level}:${settingKey}`;
  const levelInfo = EAR_LEVELS.find((item) => item.id === level)!;
  const blocks = PITCH_SETS[options.pitchSet].blocks;

  useEffect(() => () => { window.clearTimeout(advanceTimer.current); stopSound(); }, []);

  const reset = () => {
    window.clearTimeout(advanceTimer.current);
    stopSound();
    setStarted(false);
    setIndex(0);
    setQuestion(null);
    setAnswer(null);
    setResults([]);
    setTyped([]);
  };

  /** 一轮做到一半时，换关或换设置要重新出题，先问一声。 */
  const inRound = started && !finished && (results.length > 0 || typed.length > 0 || answer !== null);
  const mayRestart = (what: string) => !inRound || window.confirm(results.length ? `${what}会重新开始这一轮，已经做的 ${results.length} 题不再计分，确定吗？` : `${what}会重新开始这一轮，确定吗？`);

  const chooseLevel = (next: EarLevel) => {
    if (next === level || !mayRestart("换关")) return;
    setLevel(next);
    reset();
  };
  const changeOptions = (patch: Partial<Options>) => {
    if ((Object.keys(patch) as Array<keyof Options>).every((key) => options[key] === patch[key])) return;
    if (!mayRestart("换设置")) return;
    setOptions((current) => ({ ...current, ...patch }));
    reset();
  };

  const ask = (nextIndex: number, previous: Question | null) => {
    const next = makeQuestion(level, nextIndex, options, previous);
    setQuestion(next);
    setIndex(nextIndex);
    setAnswer(null);
    setTyped([]);
    void playSequence(questionSound(next), next.kind === "dictation" ? 84 : 90);
  };

  const start = () => {
    window.clearTimeout(advanceTimer.current);
    setStarted(true);
    setResults([]);
    ask(0, null);
  };

  const next = () => {
    window.clearTimeout(advanceTimer.current);
    if (results.length >= ROUND) {
      setAnswer(null);
      const earned = stars(results.filter(Boolean).length);
      if (earned > (best[bestKey] ?? 0)) {
        const updated = { ...best, [bestKey]: earned };
        setBest(updated);
        saveBest(updated);
      }
      return;
    }
    ask(index + 1, question);
  };

  const settle = (result: Answer) => {
    setAnswer(result.correct ? { ...result, praise: pickPraise() } : result);
    setResults((current) => [...current, result.correct]);
    // 答对了自动进入下一题；答错留时间对照正确答案。
    if (result.correct) advanceTimer.current = window.setTimeout(() => nextRef.current(), 1100);
  };
  const nextRef = useRef(next);
  useEffect(() => { nextRef.current = next; });

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

  const replay = () => { if (question) void playSequence(questionSound(question), question.kind === "dictation" ? 84 : 90); };
  const reference = () => void playSequence(REFERENCE, 90);

  // 键盘：空格重听，数字键答唱名或听写，上下方向键答高低，回车下一题。
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

  return <div className="ear-lab">
    <header className="ear-intro">
      <div>
        <p className="ear-kicker">听音训练</p>
        <h2>竖起小耳朵，听出音的高低</h2>
      </div>
      <p className="ear-intro-tip">每轮 {ROUND} 题，答对 8 题得两颗星，全对得三颗星。</p>
    </header>

    <div className="ear-levels" role="tablist" aria-label="关卡">
      {EAR_LEVELS.map((item, k) => {
        const earned = Math.max(0, ...Object.entries(best).filter(([key]) => key.startsWith(`${item.id}:`)).map(([, value]) => value));
        return <button key={item.id} type="button" role="tab" aria-selected={level === item.id} className={`ear-level${level === item.id ? " is-active" : ""}`} onClick={() => chooseLevel(item.id)}>
          <span className="ear-level-number">第 {k + 1} 关</span>
          <strong>{item.name}</strong>
          <small>{item.caption}</small>
          <span className="ear-level-foot"><em>{item.grade}</em><Stars count={earned} /></span>
        </button>;
      })}
    </div>

    {(level === "solfege" || level === "dictation" || level === "interval") && <div className="ear-settings">
      {(level === "solfege" || level === "dictation") && <div className="ear-field">
        <span className="ear-field-label">用哪些音</span>
        <div className="ear-chips">
          {(Object.keys(PITCH_SETS) as PitchSet[]).map((key) =>
            <button key={key} type="button" aria-pressed={options.pitchSet === key} className={options.pitchSet === key ? "is-active" : ""} onClick={() => changeOptions({ pitchSet: key })}>
              {PITCH_SETS[key].label}<small>{PITCH_SETS[key].caption}</small>
            </button>)}
        </div>
      </div>}
      {level === "dictation" && <div className="ear-field">
        <span className="ear-field-label">长度</span>
        <div className="ear-chips">
          {[4, 6, 8].map((length) =>
            <button key={length} type="button" aria-pressed={options.length === length} className={options.length === length ? "is-active" : ""} onClick={() => changeOptions({ length })}>{length} 个音</button>)}
        </div>
      </div>}
      {level === "interval" && <>
        <div className="ear-field">
          <span className="ear-field-label">音程</span>
          <div className="ear-chips">
            {(Object.keys(INTERVAL_SETS) as IntervalSet[]).map((key) =>
              <button key={key} type="button" aria-pressed={options.intervals === key} className={options.intervals === key ? "is-active" : ""} onClick={() => changeOptions({ intervals: key })}>
                {INTERVAL_SETS[key].label}<small>{INTERVAL_SETS[key].caption}</small>
              </button>)}
          </div>
        </div>
        <div className="ear-field">
          <span className="ear-field-label">听法</span>
          <div className="ear-chips">
            {([[false, "先后响（旋律音程）"], [true, "同时响（和声音程）"]] as const).map(([value, label]) =>
              <button key={label} type="button" aria-pressed={options.harmonic === value} className={options.harmonic === value ? "is-active" : ""} onClick={() => changeOptions({ harmonic: value })}>{label}</button>)}
          </div>
        </div>
      </>}
    </div>}

    <section className="ear-stage" aria-label={`${levelInfo.name}练习`}>
      {!started && <div className="ear-start">
        <div className="ear-start-main">
          <p className="ear-start-title">{levelInfo.name}</p>
          <p className="ear-start-tip">{startTip(level, options.pitchSet)}</p>
          <div className="ear-start-actions">
            <button type="button" className="ear-primary" onClick={start}>开始一轮</button>
            {level !== "updown" && <button type="button" className="ear-ghost" onClick={reference}>先听标准音 la（440Hz）</button>}
          </div>
        </div>
        <ol className="ear-steps" aria-label="怎么玩">
          <li><b>01</b><strong>听</strong><span>听清楚再回答，没听清可以重听（电脑上按空格键）。</span></li>
          <li><b>02</b><strong>答</strong><span>答对了自动进入下一题；答错了会给出正确答案，对照着再听。</span></li>
          <li><b>03</b><strong>得星</strong><span>每轮 10 题，答对 8 题得两颗星，全对得三颗星。</span></li>
        </ol>
      </div>}

      {finished && <div className="ear-result" role="status">
        <Stars count={stars(correctCount)} size="lg" />
        <p className="ear-result-score"><b>{correctCount}</b> / {ROUND}</p>
        <p className="ear-result-praise">{praise(correctCount)}</p>
        <div className="ear-start-actions">
          <button type="button" className="ear-primary" onClick={start}>再来一轮</button>
          {level !== "dictation" && <button type="button" className="ear-ghost" onClick={() => chooseLevel(EAR_LEVELS[(EAR_LEVELS.findIndex((item) => item.id === level) + 1) % EAR_LEVELS.length].id)}>去下一关</button>}
        </div>
      </div>}

      {started && !finished && question && <div className="ear-play">
        <div className="ear-progress" aria-label={`第 ${index + 1} 题，共 ${ROUND} 题`}>
          {Array.from({ length: ROUND }, (_, k) => <span key={k} className={k < results.length ? (results[k] ? "is-right" : "is-wrong") : k === index ? "is-current" : ""} />)}
        </div>

        <div className="ear-listen">
          <button type="button" className="ear-replay" onClick={replay} aria-label="再听一遍（空格键）">
            <span aria-hidden="true">♪</span>
            <small>再听一遍</small>
          </button>
          <div className="ear-question">
            <p className="ear-question-number">第 {index + 1} 题</p>
            <p className="ear-question-text">{questionText(question)}</p>
            {level !== "updown" && <button type="button" className="ear-ghost is-small" onClick={reference}>听标准音 la</button>}
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
            <p className={answer.correct ? "is-right" : "is-wrong"}>{verdict}</p>
            {!answer.correct && <button type="button" className="ear-primary" onClick={next}>{results.length >= ROUND ? "看成绩" : "下一题"}</button>}
          </>}
        </div>
      </div>}
    </section>
    <p className="ear-keys">⌨ 空格键重听 · 数字键 1–7 选唱名 · ↑ ↓ 判断高低 · 回车下一题</p>
  </div>;
}

function startTip(level: EarLevel, pitchSet: PitchSet) {
  switch (level) {
    case "updown": return "先后弹两个音，听一听第二个音比第一个音更高、更低，还是一样高。";
    case "solfege": return "先听标准音 la（440 赫兹），记住它的位置，再听题目里的音是哪一个唱名。";
    case "interval": return "两个音之间相隔几度？从 do 到 re 是二度，do 到 mi 是三度，do 到高音 do 是八度。";
    case "dictation": return `听一小段旋律，题目会告诉你第一个音，最后一个音落在 ${pitchSet === "three" ? "la" : "do"} 上。按顺序点音块写下来，可以多听几遍。`;
  }
}

function questionText(question: Question) {
  switch (question.kind) {
    case "updown": return "第二个音比第一个音……";
    case "solfege": return "这个音是哪个唱名？";
    case "interval": return question.harmonic ? "两个音同时响，相隔几度？" : "两个音先后响，相隔几度？";
    case "dictation": return `旋律有 ${question.tones.length} 个音，第一个音是 ${toneName(question.tones[0])}。`;
  }
}

function feedback(question: Question, answer: Answer) {
  if (answer.correct) return answer.praise ?? "答对了！";
  switch (question.kind) {
    case "updown": return `正确答案是“${UPDOWN.find((item) => item.id === question.answer)!.label}”。再听一遍比较一下。`;
    case "solfege": return `这个音是 ${toneName(question.tone)}（${question.tone.d}）。刚才先弹你选的音，再弹正确的音。`;
    case "interval": return `这是${INTERVAL_NAMES[question.steps]}。`;
    case "dictation": {
      const wrong = answer.marks?.filter((mark) => !mark).length ?? 0;
      return `有 ${wrong} 个音不一样，看看标红的位置，再听一遍。`;
    }
  }
}

const PRAISES = ["答对了！", "真棒！", "耳朵真灵！", "完全正确！"];
function pickPraise() {
  return PRAISES[Math.floor(Math.random() * PRAISES.length)];
}
