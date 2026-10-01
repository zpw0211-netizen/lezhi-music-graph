"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { publicAssetUrl } from "../../lib/app/assets";
import { bareWorkName, type CanonicalGraph } from "../../lib/app/types";
import { MELODIES, type Melody } from "../../lib/lesson/melodies";
import { getPianoAudioContext, loadPianoSampler, playPianoSample, type PianoSampler } from "../../lib/lesson/piano-sampler";
import { MELODY_PLAYBACK_STARTED, VOCAL_PLAYBACK_STARTED } from "../../lib/lesson/recordings";
import { MelodyPlayer } from "../lesson/MelodyPlayer";
import { findPentatonicWorks, keyIndicesFor, LAB_KEYS, modePhrase, PENTATONIC, type LabKey } from "./pentatonic";

type Question = { answer: number; round: number; score: number; chosen: number | null };
type Voice = ReturnType<typeof playPianoSample>;

function revealLabTarget(target: HTMLElement | null) {
  if (!target) return;
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "center",
    inline: "nearest",
  });
}

export function LabPage({ graph, onOpenWork }: { graph: CanonicalGraph; onOpenWork: (work: string) => void }) {
  const [key, setKey] = useState<LabKey>("C");
  const [mode, setMode] = useState(0);
  const [active, setActive] = useState<number[]>([]);
  const [pulse, setPulse] = useState(0);
  const [message, setMessage] = useState("点一个键，听听它的声音。");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<{ name: string; index: number } | null>(null);
  const [workPlaying, setWorkPlaying] = useState(false);
  const sampler = useRef<PianoSampler | null>(null);
  const output = useRef<DynamicsCompressorNode | null>(null);
  const voices = useRef<Voice[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const request = useRef(0);
  const mounted = useRef(true);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLElement>(null);
  const revealPlayerAfterRender = useRef(false);
  const works = useMemo(() => findPentatonicWorks(graph), [graph]);
  const selectedMelody: Melody | undefined = selected ? MELODIES[selected.name]?.[selected.index] : undefined;
  const displayKey = workPlaying && selectedMelody ? selectedMelody.key : `1=${key}`;

  const stopLab = useCallback(() => {
    request.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    voices.current.forEach((voice) => voice.stop());
    voices.current = [];
    if (mounted.current) { setActive([]); setLoading(false); }
  }, []);
  useEffect(() => {
    mounted.current = true;
    window.addEventListener(MELODY_PLAYBACK_STARTED, stopLab);
    window.addEventListener(VOCAL_PLAYBACK_STARTED, stopLab);
    return () => {
      mounted.current = false;
      stopLab();
      output.current?.disconnect();
      window.removeEventListener(MELODY_PLAYBACK_STARTED, stopLab);
      window.removeEventListener(VOCAL_PLAYBACK_STARTED, stopLab);
    };
  }, [stopLab]);

  useLayoutEffect(() => {
    if (!revealPlayerAfterRender.current || !selected) return;
    revealPlayerAfterRender.current = false;
    revealLabTarget(playerRef.current);
  }, [selected]);

  const ensureAudio = useCallback(async () => {
    const context = getPianoAudioContext();
    // Skip the async boundary for an already running, decoded bank.
    if (context.state !== "running") await context.resume();
    if (!sampler.current) {
      setLoading(true);
      setMessage("正在载入钢琴音色…");
      sampler.current = await loadPianoSampler(context);
    }
    if (!output.current) {
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 18;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.002;
      compressor.release.value = 0.15;
      compressor.connect(context.destination);
      output.current = compressor;
    }
    return { context, bank: sampler.current, destination: output.current };
  }, []);

  const playSequence = useCallback(async (notes: Array<{ midi: number; index: number }>, reveal = true) => {
    // A manual piano gesture also stops a textbook excerpt.
    window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED));
    const token = request.current;
    try {
      const { context, bank, destination } = await ensureAudio();
      if (!mounted.current || token !== request.current) return;
      setLoading(false);
      const start = context.currentTime;
      voices.current = notes.map((note, index) => {
        const when = start + index * 0.32;
        if (reveal) timers.current.push(setTimeout(() => {
          setActive([note.index]); setPulse((value) => value + 1);
        }, Math.max(0, (when - context.currentTime) * 1000)));
        return playPianoSample(context, bank, note.midi, when, notes.length === 1 ? 0.65 : 0.34, destination, 0.5);
      });
      timers.current.push(setTimeout(() => setActive([]), notes.length * 320 + 320));
      if (reveal) setMessage(notes.length === 1 ? `正在弹奏：${PENTATONIC[notes[0].index].name}` : `正在听${PENTATONIC[notes[0].index].name}调式，上行再下行。`);
    } catch {
      if (mounted.current && token === request.current) {
        setLoading(false); setMessage("钢琴音色未能载入，请检查网络后再按一次键。");
      }
    }
  }, [ensureAudio]);

  const hit = useCallback((index: number) => {
    if (question && question.chosen === null) {
      setQuestion({ ...question, chosen: index, score: question.score + (index === question.answer ? 1 : 0) });
      setMessage(index === question.answer ? `答对了，是${PENTATONIC[index].name}。` : `正确答案是${PENTATONIC[question.answer].name}（简谱 ${PENTATONIC[question.answer].degree}）。`);
      return;
    }
    void playSequence([{ index, midi: LAB_KEYS[key] + PENTATONIC[index].semitone }]);
  }, [key, playSequence, question]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || (event.target instanceof HTMLElement && event.target.closest("input, select, textarea, [contenteditable=true]"))) return;
      const index = PENTATONIC.findIndex((note) => String(note.degree) === event.key);
      if (index !== -1) { event.preventDefault(); hit(index); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hit]);
  const soundingNotes = useCallback((notes: number[], playing: boolean) => {
    setWorkPlaying(playing);
    setActive(selectedMelody ? keyIndicesFor(notes, selectedMelody.tonicMidi) : []);
    if (notes.length) setPulse((value) => value + 1);
  }, [selectedMelody]);
  const askQuestion = () => {
    const answer = Math.floor(Math.random() * 5);
    const next = { answer, round: question && question.round < 5 ? question.round + 1 : 1, score: question && question.round < 5 ? question.score : 0, chosen: null };
    setQuestion(next);
    setMessage(`第 ${next.round} 题：听一听，再选一个键。`);
    revealLabTarget(keyboardRef.current);
    void playSequence([{ index: answer, midi: LAB_KEYS[key] + PENTATONIC[answer].semitone }], false);
  };

  return <section className="pentatonic-lab" aria-labelledby="lab-title">
    <div className="lab-instrument">
      <header className="lab-heading">
        <p className="lab-kicker">听见五声</p>
        <h1 id="lab-title">五声实验室</h1>
        <p>中国民族调式的五个音：宫、商、角、徵、羽。<br />点一点，听听它们的高低。</p>
        <label className="lab-key-select">调号 <select value={key} onChange={(event) => { stopLab(); window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED)); setKey(event.target.value as LabKey); setQuestion(null); setMessage("调号已切换，试着弹一弹。"); }}>
          {Object.keys(LAB_KEYS).map((item) => <option key={item} value={item}>1={item}</option>)}
        </select></label>
        <p className="lab-key-help">也可用键盘 1 2 3 5 6</p>
      </header>
      <div className="lab-keyboard" ref={keyboardRef} role="group" aria-label={`五声钢琴，${displayKey}`} aria-busy={loading}>
        {PENTATONIC.map((note, index) => <button key={note.name} type="button" className={`lab-piano-key${active.includes(index) ? " is-sounding" : ""}${mode === index ? " is-tonic" : ""}${question?.chosen === index ? index === question.answer ? " is-correct" : " is-wrong" : ""}`} aria-label={`${note.name}，${note.solfege}，简谱 ${note.degree}，${displayKey}${mode === index ? "，主音" : ""}`} onPointerDown={(event) => { if (event.button === 0) { event.preventDefault(); event.currentTarget.focus(); hit(index); } }} onClick={(event) => { if (event.detail === 0) hit(index); }}>
          <span className="lab-key-number">{note.degree}</span><small>{displayKey}</small><b>{note.name}</b><span className="lab-solfege">{note.solfege}</span>
          {mode === index && <span className="lab-tonic-label">主音</span>}
          {active.includes(index) && <span key={pulse} className="lab-key-ripple" aria-hidden="true" />}
        </button>)}
      </div>
    </div>
    <p className="lab-status" role="status" aria-live="polite">{message}{question && ` · ${question.round === 5 && question.chosen !== null ? `完成！得分 ${question.score} / 5` : `第 ${question.round} / 5 题`}`}</p>
    {question && <div className="lab-exercise-actions lab-quick-exercise">
      {question.chosen === null ? <button type="button" disabled={loading} onClick={() => void playSequence([{ index: question.answer, midi: LAB_KEYS[key] + PENTATONIC[question.answer].semitone }], false)}>再听一次</button> : <button type="button" disabled={loading} onClick={askQuestion}>{question.round === 5 ? "再练一轮" : "下一题"}</button>}
      <button type="button" onClick={() => { stopLab(); setQuestion(null); setMessage("练习已结束，可以自由弹奏。"); }}>结束练习</button>
    </div>}
    <section className="lab-modes" aria-labelledby="lab-modes-title">
      <div><h2 id="lab-modes-title">从不同的音出发</h2><p>拓展知识 · 以「{PENTATONIC[mode].name}」为主音，就是{PENTATONIC[mode].name}调式。听它上行，再回到主音。</p></div>
      <div className="lab-mode-buttons" role="group" aria-label="选择五声调式">
        {PENTATONIC.map((note, index) => <button key={note.name} type="button" aria-pressed={mode === index} onClick={() => { setMode(index); setQuestion(null); void playSequence(modePhrase(index, LAB_KEYS[key])); }}>{note.name}调式 <span aria-hidden="true">▷</span></button>)}
        <button type="button" className="lab-stop" onClick={() => { stopLab(); window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED)); setMessage("已停止。"); }}>停止</button>
      </div>
    </section>
    {selected && selectedMelody && <section className="lab-work-player" ref={playerRef} aria-label={`${selected.name}旋律示范`}>
      <div className="lab-player-heading"><h2>听《{bareWorkName(selected.name)}》</h2><button type="button" onClick={() => { setSelected(null); setActive([]); setWorkPlaying(false); }}>收起</button></div>
      {MELODIES[selected.name].length > 1 && <div className="lab-excerpts" role="group" aria-label="选择谱例片段">{MELODIES[selected.name].map((melody, index) => <button type="button" key={index} aria-pressed={selected.index === index} onClick={() => { setSelected({ ...selected, index }); setWorkPlaying(false); }}>{melody.title ?? `片段 ${index + 1}`}</button>)}</div>}
      <MelodyPlayer key={`${selected.name}:${selected.index}`} melody={selectedMelody} onSoundingNotes={soundingNotes} />
    </section>}
    <section className="lab-works" aria-labelledby="lab-works-title">
      <header className="lab-section-heading"><div><p className="lab-kicker">回到教材</p><h2 id="lab-works-title">教材里的五声作品</h2></div><p>按教材的调式标注收录。<br />听旋律时，对应的五声键会亮起。</p></header>
      <div className="lab-work-grid">{works.map(({ work, evidence }) => {
        const score = work.media?.find((media) => media.kind === "score");
        const melodies = MELODIES[work.name];
        return <article key={work.id} className="lab-work-card">
          <button type="button" className="lab-work-link" onClick={() => onOpenWork(bareWorkName(work.name))}>
            <span className="lab-score-cover">{score ? <img src={publicAssetUrl(score.url)} alt={`${work.name}教材谱例`} width={500} height={300} loading="lazy" decoding="async" /> : <span>谱例见学习页</span>}</span>
            <h3>{bareWorkName(work.name)}</h3><span className="lab-work-evidence">{evidence.map(({ value }) => value).join("、")}</span><span className="lab-work-study">进入学习页 →</span>
          </button>
          {melodies?.length > 0 && <button type="button" className="lab-listen" onClick={() => { stopLab(); setQuestion(null); setWorkPlaying(false); revealPlayerAfterRender.current = true; setSelected({ name: work.name, index: 0 }); setMessage(`已选择${work.name}，点击「播放旋律」。`); }} aria-label={`听${work.name}旋律`}>▷ 听旋律{melodies.every((melody) => melody.quality === "draft") ? "（草稿）" : ""}</button>}
        </article>;
      })}</div>
      {!works.length && <p>教材关系数据中暂未找到五声调式标注。</p>}
    </section>
    <section className="lab-exercise" aria-labelledby="lab-exercise-title">
      <div><p className="lab-kicker">试试耳朵</p><h2 id="lab-exercise-title">听音找键</h2><p>听一个五声音，再点击上面的键作答。共 5 题。</p></div>
      <div className="lab-exercise-actions">
        {question && <p>{question.chosen === null ? `第 ${question.round} / 5 题` : question.round === 5 ? `完成！得分 ${question.score} / 5` : `第 ${question.round} / 5 题 · 已答对 ${question.score} 题`}</p>}
        {question?.chosen != null && <p className={question.chosen === question.answer ? "lab-answer-correct" : "lab-answer-wrong"}>{question.chosen === question.answer ? "答对了！" : `正确答案：${PENTATONIC[question.answer].name}（${PENTATONIC[question.answer].degree}）`}</p>}
        <button type="button" disabled={loading || !!question && question.chosen === null} onClick={askQuestion}>{!question ? "开始练习" : question.round === 5 ? "再练一轮" : "下一题"}</button>
        {question?.chosen === null && <button type="button" disabled={loading} onClick={() => void playSequence([{ index: question.answer, midi: LAB_KEYS[key] + PENTATONIC[question.answer].semitone }], false)}>再听一次</button>}
        {question && <button type="button" onClick={() => { stopLab(); setQuestion(null); setMessage("练习已结束，可以自由弹奏。"); }}>结束练习</button>}
      </div>
    </section>
    <p className="lab-credit">钢琴采样：<a href="https://archive.org/details/SalamanderGrandPianoV3" target="_blank" rel="noreferrer">Salamander Grand Piano</a> · Alexander Holm · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a></p>
  </section>;
}
