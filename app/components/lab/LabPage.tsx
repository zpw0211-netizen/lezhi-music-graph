"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { publicAssetUrl } from "../../lib/app/assets";
import { bareWorkName, type CanonicalGraph } from "../../lib/app/types";
import { MELODIES, type Melody } from "../../lib/lesson/melodies";
import { getPianoAudioContext, loadPianoSampler, playPianoSample, type PianoSampler } from "../../lib/lesson/piano-sampler";
import { MELODY_PLAYBACK_STARTED, VOCAL_PLAYBACK_STARTED } from "../../lib/lesson/recordings";
import { MelodyPlayer } from "../lesson/MelodyPlayer";
import { CHROMATIC_PITCH_NAMES, HEPTATONIC_MODES, heptatonicPhrase, transposePitchClass, type HeptatonicModeId } from "./heptatonic";
import { findPentatonicWorks, keyIndicesFor, LAB_KEYS, modePhrase, PENTATONIC, type LabKey } from "./pentatonic";

type Question = { answer: number; round: number; score: number; chosen: number | null };
type Voice = ReturnType<typeof playPianoSample>;
type ScoreNote = { name: string; degree: string; altered: boolean; midi: number; index: number | null };
type PlaybackNote = { midi: number; index: number | null; scoreIndex?: number };
type LabScale = "pentatonic" | HeptatonicModeId;

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
  const [scale, setScale] = useState<LabScale>("pentatonic");
  const [active, setActive] = useState<number[]>([]);
  const [activePitchClasses, setActivePitchClasses] = useState<number[]>([]);
  const [scorePosition, setScorePosition] = useState(-1);
  const [scoreTrackPosition, setScoreTrackPosition] = useState(-1);
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
  const ringRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const playerRef = useRef<HTMLElement>(null);
  const revealPlayerAfterRender = useRef(false);
  const works = useMemo(() => findPentatonicWorks(graph), [graph]);
  const selectedMelody: Melody | undefined = selected ? MELODIES[selected.name]?.[selected.index] : undefined;
  const displayKey = workPlaying && selectedMelody ? selectedMelody.key : `1=${key}`;
  const tonicMidi = LAB_KEYS[key];
  const scaleTitle = scale === "pentatonic" ? `${PENTATONIC[mode].name}调式` : HEPTATONIC_MODES[scale].name;
  const ringScaleNotes = scale === "pentatonic"
    ? PENTATONIC.map((note) => ({ ...note, altered: false }))
    : HEPTATONIC_MODES[scale].notes;
  const scoreNotes: ScoreNote[] = useMemo(() => {
    if (scale === "pentatonic") {
      return modePhrase(mode, tonicMidi).map(({ index, midi }) => ({
        name: PENTATONIC[index].name,
        degree: String(PENTATONIC[index].degree),
        altered: false,
        midi,
        index,
      }));
    }
    return heptatonicPhrase(scale, tonicMidi).map((note) => ({
      name: note.name,
      degree: note.degree,
      altered: note.altered,
      midi: note.midi,
      index: PENTATONIC.findIndex((pentatonicNote) => pentatonicNote.semitone === ((note.midi - tonicMidi) % 12)),
    })).map((note) => ({ ...note, index: note.index < 0 ? null : note.index }));
  }, [mode, scale, tonicMidi]);

  const stopLab = useCallback(() => {
    request.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    voices.current.forEach((voice) => voice.stop());
    voices.current = [];
    if (mounted.current) {
      setActive([]);
      setActivePitchClasses([]);
      setScorePosition(-1);
      setScoreTrackPosition(-1);
      setLoading(false);
    }
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

  const playSequence = useCallback(async (notes: PlaybackNote[], reveal = true, sequenceTitle = scaleTitle) => {
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
        if (reveal) {
          if (note.scoreIndex !== undefined) {
            timers.current.push(setTimeout(() => setScoreTrackPosition(note.scoreIndex!), Math.max(0, (when - context.currentTime) * 1000 - 180)));
          }
          timers.current.push(setTimeout(() => {
            setActive(note.index === null ? [] : [note.index]);
            setActivePitchClasses([note.midi % 12]);
            if (note.scoreIndex !== undefined) setScorePosition(note.scoreIndex);
            setPulse((value) => value + 1);
          }, Math.max(0, (when - context.currentTime) * 1000)));
        }
        return playPianoSample(context, bank, note.midi, when, notes.length === 1 ? 0.65 : 0.34, destination, 0.5);
      });
      timers.current.push(setTimeout(() => { setActive([]); setActivePitchClasses([]); }, notes.length * 320 + 320));
      if (reveal) setMessage(notes.length === 1
        ? `正在弹奏：${notes[0].index === null ? CHROMATIC_PITCH_NAMES[notes[0].midi % 12] : PENTATONIC[notes[0].index].name}`
        : `正在听${sequenceTitle}示例，上行再下行。`);
    } catch {
      if (mounted.current && token === request.current) {
        setLoading(false); setMessage("钢琴音色未能载入，请检查网络后再按一次键。");
      }
    }
  }, [ensureAudio, scaleTitle]);

  const hit = useCallback((index: number) => {
    if (question && question.chosen === null) {
      setQuestion({ ...question, chosen: index, score: question.score + (index === question.answer ? 1 : 0) });
      setMessage(index === question.answer ? `答对了，是${PENTATONIC[index].name}。` : `正确答案是${PENTATONIC[question.answer].name}（简谱 ${PENTATONIC[question.answer].degree}）。`);
      return;
    }
    void playSequence([{ index, midi: tonicMidi + PENTATONIC[index].semitone }]);
  }, [playSequence, question, tonicMidi]);
  const hitRing = useCallback((pitchClass: number) => {
    const interval = (pitchClass - (tonicMidi % 12) + 12) % 12;
    const pentatonicIndex = PENTATONIC.findIndex((note) => note.semitone === interval);
    if (question?.chosen === null) {
      if (pentatonicIndex < 0) {
        setMessage("这不是五声音中的一个，请选宫、商、角、徵或羽。");
        return;
      }
      hit(pentatonicIndex);
      return;
    }
    const index = ringScaleNotes.findIndex((note) => note.semitone === interval);
    void playSequence([{ index: pentatonicIndex < 0 ? null : pentatonicIndex, midi: tonicMidi + interval }]);
    if (index >= 0) setMessage(`正在弹奏${ringScaleNotes[index].name}。`);
  }, [hit, playSequence, question?.chosen, ringScaleNotes, tonicMidi]);
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
    setActivePitchClasses([...new Set(notes.map((midi) => midi % 12))]);
    if (notes.length) setPulse((value) => value + 1);
  }, [selectedMelody]);
  const askQuestion = () => {
    const answer = Math.floor(Math.random() * 5);
    const next = { answer, round: question && question.round < 5 ? question.round + 1 : 1, score: question && question.round < 5 ? question.score : 0, chosen: null };
    setQuestion(next);
    setMessage(`第 ${next.round} 题：听一听，再选一个键。`);
    revealLabTarget(keyboardRef.current);
    void playSequence([{ index: answer, midi: tonicMidi + PENTATONIC[answer].semitone }], false);
  };
  const playScore = () => {
    setQuestion(null);
    setMessage(`正在播放${scaleTitle}自编示例。`);
    void playSequence(scoreNotes.map((note, scoreIndex) => ({ midi: note.midi, index: note.index, scoreIndex })));
  };

  return <section className="pentatonic-lab" aria-labelledby="lab-title">
    <div className="lab-instrument">
      <header className="lab-heading">
        <p className="lab-kicker">从五声到七声</p>
        <h1 id="lab-title">五声实验室</h1>
        <p>宫、商、角、徵、羽是五个正声。七声调式会加入不同偏音。点圆盘上的音试听，再换宫音看看音高位置怎样移动。</p>
        <label className="lab-key-select">调号 <select value={key} onChange={(event) => { stopLab(); window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED)); setKey(event.target.value as LabKey); setQuestion(null); setMessage("调号已切换，试着弹一弹。"); }}>
          {Object.keys(LAB_KEYS).map((item) => <option key={item} value={item}>1={item}</option>)}
        </select></label>
        <p className="lab-key-help">圆盘内按方向键移动，按 Enter 或空格发声；五声音键盘也可按 1、2、3、5、6。</p>
      </header>
      <div className="lab-wheel-column">
        <div className="lab-wheel" role="group" aria-label={`十二音高圆盘，当前${scaleTitle}，宫音 1=${key}`} aria-busy={loading}>
          <div className="lab-wheel-orbit" aria-hidden="true" />
          {CHROMATIC_PITCH_NAMES.map((pitchName, pitchClass) => {
            const interval = (pitchClass - (tonicMidi % 12) + 12) % 12;
            const note = ringScaleNotes.find((candidate) => transposePitchClass(tonicMidi % 12, candidate.semitone) === pitchClass);
            const kind = note ? note.altered ? "is-biased" : interval === 0 ? "is-gong" : "is-zheng" : "is-outside";
            const description = note
              ? `${note.name}，${pitchName}，${note.altered ? "偏音" : "正声"}，简谱 ${note.degree}`
              : `${pitchName}，当前音阶外音`;
            return <button
              key={pitchName}
              ref={(element) => { ringRefs.current[pitchClass] = element; }}
              type="button"
              className={`lab-ring-note ${kind}${activePitchClasses.includes(pitchClass) ? " is-sounding" : ""}`}
              style={{
                "--ring-x": `${Math.cos((pitchClass * 30 - 90) * Math.PI / 180) * 40}%`,
                "--ring-y": `${Math.sin((pitchClass * 30 - 90) * Math.PI / 180) * 40}%`,
              } as CSSProperties}
              aria-label={`${description}，按 1=${key} 转位`}
              aria-current={activePitchClasses.includes(pitchClass) ? "true" : undefined}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(event.key)) return;
                event.preventDefault();
                const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
                ringRefs.current[(pitchClass + step + 12) % 12]?.focus();
              }}
              onClick={() => hitRing(pitchClass)}
            >
              <strong>{note?.name ?? pitchName}</strong><small>{pitchName}</small>
            </button>;
          })}
          <div className="lab-wheel-center" aria-hidden="true"><b>{scale === "pentatonic" ? "五声" : HEPTATONIC_MODES[scale].name}</b><span>宫音 1={key}</span></div>
        </div>
        <div className="lab-wheel-legend" aria-label="圆盘标记说明">
          <span><i className="is-legend-zheng" />五正声</span><span><i className="is-legend-biased" />偏音</span><span><i className="is-legend-outside" />音阶外音</span>
        </div>
      </div>
    </div>
    <p className="lab-keyboard-caption">五声音键盘 · 练习与快速试听</p>
    <div className="lab-keyboard" ref={keyboardRef} role="group" aria-label={`五声钢琴，${displayKey}`} aria-busy={loading}>
      {PENTATONIC.map((note, index) => <button key={note.name} type="button" className={`lab-piano-key${active.includes(index) ? " is-sounding" : ""}${mode === index ? " is-tonic" : ""}${question?.chosen === index ? index === question.answer ? " is-correct" : " is-wrong" : ""}`} aria-label={`${note.name}，${note.solfege}，简谱 ${note.degree}，${displayKey}${mode === index ? "，主音" : ""}`} onPointerDown={(event) => { if (event.button === 0) { event.preventDefault(); event.currentTarget.focus(); hit(index); } }} onClick={(event) => { if (event.detail === 0) hit(index); }}>
        <span className="lab-key-number">{note.degree}</span><small>{displayKey}</small><b>{note.name}</b><span className="lab-solfege">{note.solfege}</span>
        {mode === index && <span className="lab-tonic-label">主音</span>}
        {active.includes(index) && <span key={pulse} className="lab-key-ripple" aria-hidden="true" />}
      </button>)}
    </div>
    <p className="lab-status" role="status" aria-live="polite">{message}{question && ` · ${question.round === 5 && question.chosen !== null ? `完成！得分 ${question.score} / 5` : `第 ${question.round} / 5 题`}`}</p>
    {question && <div className="lab-exercise-actions lab-quick-exercise">
      {question.chosen === null ? <button type="button" disabled={loading} onClick={() => void playSequence([{ index: question.answer, midi: LAB_KEYS[key] + PENTATONIC[question.answer].semitone }], false)}>再听一次</button> : <button type="button" disabled={loading} onClick={askQuestion}>{question.round === 5 ? "再练一轮" : "下一题"}</button>}
      <button type="button" onClick={() => { stopLab(); setQuestion(null); setMessage("练习已结束，可以自由弹奏。"); }}>结束练习</button>
    </div>}
    <section className="lab-modes" aria-labelledby="lab-modes-title">
      <div><h2 id="lab-modes-title">五声调式</h2><p>拓展知识 · 以「{PENTATONIC[mode].name}」为主音，就是{PENTATONIC[mode].name}调式。保留原有五声练习，听它上行再回到主音。</p></div>
      <div className="lab-mode-buttons" role="group" aria-label="选择五声调式">
        {PENTATONIC.map((note, index) => <button key={note.name} type="button" aria-pressed={scale === "pentatonic" && mode === index} onClick={() => { setMode(index); setScale("pentatonic"); setQuestion(null); void playSequence(modePhrase(index, tonicMidi).map(({ index: noteIndex, midi }, scoreIndex) => ({ index: noteIndex, midi, scoreIndex })), true, `${note.name}调式`); }}>{note.name}调式 <span aria-hidden="true">▷</span></button>)}
        <button type="button" className="lab-stop" onClick={() => { stopLab(); window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED)); setMessage("已停止。"); }}>停止</button>
      </div>
    </section>
    <section className="lab-heptatonic" aria-labelledby="lab-heptatonic-title">
      <header><div><p className="lab-kicker">拓展知识</p><h2 id="lab-heptatonic-title">加入偏音，听七声调式</h2></div><p>三种常见音阶以宫为 do。选择一种，圆盘会标出它的五正声和偏音。</p></header>
      <div className="lab-heptatonic-options" role="group" aria-label="选择七声调式">
        {(Object.values(HEPTATONIC_MODES) as Array<(typeof HEPTATONIC_MODES)[HeptatonicModeId]>).map((item) => <button key={item.id} type="button" aria-pressed={scale === item.id} onClick={() => { window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED)); setScale(item.id); setQuestion(null); setScorePosition(-1); setScoreTrackPosition(-1); setMessage(`已选择${item.name}（${item.alias}）。圆盘中朱砂色音名为偏音。`); }}>
          <strong>{item.name}</strong><span>{item.alias}</span><small>{item.description}</small>
        </button>)}
      </div>
    </section>
    <section className="lab-flow-score" aria-labelledby="lab-flow-score-title">
      <header><div><p className="lab-kicker">流动乐谱</p><h2 id="lab-flow-score-title">{scaleTitle}音阶走句</h2></div><p>自编示例 · 由所选音阶上行再下行组成，并非教材曲目。</p></header>
      <div className="lab-score-window" aria-label={`${scaleTitle}自编简谱示例`}>
        <span className="lab-score-playhead" aria-hidden="true" />
        <ol className="lab-score-strip" style={{ "--score-offset": `${Math.max(scoreTrackPosition, 0) * -52}px` } as CSSProperties}>
          {scoreNotes.map((note, index) => {
            const isCurrent = scorePosition === index;
            const octave = Math.floor((note.midi - tonicMidi) / 12);
            return <li key={`${index}-${note.name}`} className={`lab-score-note${isCurrent ? " is-current" : ""}${note.altered ? " is-altered" : ""}`} aria-current={isCurrent ? "step" : undefined} aria-label={`${note.name}，简谱 ${note.degree}${octave > 0 ? "，高八度" : ""}${note.altered ? "，偏音" : ""}`}>
              <span className="lab-score-degree">{note.degree}{octave > 0 && <sup aria-label="高八度">·</sup>}</span>
              <small>{note.name}</small>
              {note.altered && <span className="lab-score-bias-mark"><i aria-hidden="true" /><b>{note.name}</b></span>}
            </li>;
          })}
        </ol>
      </div>
      <div className="lab-score-actions"><button type="button" disabled={loading} onClick={playScore}>播放示例</button><button type="button" className="lab-stop" onClick={() => { stopLab(); window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED)); setMessage("已停止。"); }}>停止</button><span>播放头固定，音符依次经过；开启减少动态效果后改为静态逐音高亮。</span></div>
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
