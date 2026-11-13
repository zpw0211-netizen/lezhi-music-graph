"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { MelodyPlayer } from "../lesson/MelodyPlayer";
import { getPianoAudioContext } from "../../lib/lesson/piano-sampler";
import { loadInstrumentSampler, playInstrumentSample } from "../../lib/lesson/instrument-sampler";
import {
  LEVELS, PITCH_SETS, RHYTHM_CARDS, barBeats, beatsOf, colorOf, composeHints, durationsFor, formatBeats, inspireBar, noteShape,
  loadWorks, midiOfNote, questionsFor, setupOf, stepOf, storeWorks, toMelody, unitOf,
  type ComposeMode, type ComposeNote, type Level, type Meter, type PitchSet, type SavedWork,
} from "./compose-model";

const emptyBars = (count: number) => Array.from({ length: count }, () => [] as ComposeNote[]);

let previewOut: GainNode | null = null;
/** 试听一个音；连点时先收掉上一个音，只听清这一次。 */
async function soundNote(note: Pick<ComposeNote, "d" | "o">) {
  try {
    const ctx = getPianoAudioContext();
    await ctx.resume();
    const sampler = await loadInstrumentSampler(ctx, "piano");
    if (previewOut) {
      const old = previewOut;
      old.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
      window.setTimeout(() => old.disconnect(), 120);
    }
    const out = ctx.createGain();
    out.connect(ctx.destination);
    previewOut = out;
    playInstrumentSample(ctx, "piano", sampler, midiOfNote(note), ctx.currentTime + 0.01, 0.7, out, 0.9);
  } catch {
    // 没有声音也不妨碍继续写。
  }
}

/** One jianpu figure: digit, octave dot, underline for half a beat, dashes for longer notes. */
function NoteFigure({ note, plain }: { note: ComposeNote; plain?: boolean }) {
  const shape = noteShape(note.b);
  return <span className="compose-figure">
    <span className={`compose-digit${shape.eighth ? " is-eighth" : ""}`} style={{ color: plain || !note.d ? undefined : colorOf(note) }}>
      {note.o > 0 && <i className="compose-dot-high" aria-hidden="true" />}
      {note.d}
      {shape.dotted && <i className="compose-aug" aria-hidden="true" />}
    </span>
    {Array.from({ length: shape.dashes }, (_, k) => <span key={k} className="compose-dash" aria-hidden="true">–</span>)}
  </span>;
}

/** A rhythm card drawn as jianpu "X" figures, with underlines for half beats. */
function RhythmGlyph({ card }: { card: number[] }) {
  return <span className="compose-rhythm-glyph" aria-hidden="true">
    {card.map((b, k) => {
      const shape = noteShape(b);
      return <span key={k} className={`compose-rhythm-unit${shape.eighth ? " is-eighth" : ""}`}>X{shape.dotted && "·"}{shape.dashes > 0 && <i>{" –".repeat(shape.dashes)}</i>}</span>;
    })}
  </span>;
}
const cardLabel = (card: number[], meter: Meter) => card.map((b) => formatBeats(b, meter)).join("、");

export function ComposePage() {
  const [level, setLevel] = useState<Level>("low");
  const [pitchSet, setPitchSet] = useState<PitchSet>("three");
  const [meter, setMeter] = useState<Meter>("2/4");
  const [barCount, setBarCount] = useState(4);
  const [mode, setMode] = useState<ComposeMode>("free");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [bars, setBars] = useState<ComposeNote[][]>(() => emptyBars(4));
  const [duration, setDuration] = useState<number>(1);
  const [card, setCard] = useState<number[] | null>(null);
  const [selected, setSelected] = useState<{ bar: number; index: number } | null>(null);
  const [message, setMessage] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [notation, setNotation] = useState<"jianpu" | "staff">("jianpu");
  const [accompaniment, setAccompaniment] = useState(false);
  // 本页只在浏览器里载入（主页面水合之后），可以直接读取本机作品集。
  const [works, setWorks] = useState<SavedWork[]>(() => (typeof window === "undefined" ? [] : loadWorks()));
  const stageRef = useRef<HTMLDivElement | null>(null);

  const levelInfo = LEVELS[level];
  const beats = beatsOf(meter);
  const questions = questionsFor(meter, pitchSet);
  const question = mode === "answer" ? questions[Math.min(questionIndex, questions.length - 1)] : null;
  const lockedBars = question ? question.bars.length : 0;
  const blocks = PITCH_SETS[pitchSet].blocks;
  const cursorBar = bars.findIndex((bar, i) => i >= lockedBars && barBeats(bar) < beats - 1e-6);

  /** Start over whenever the setup changes; in 接龙 the question fills the opening bars. */
  const reset = (setup: { mode?: ComposeMode; meter?: Meter; question?: number; count?: number; pitchSet?: PitchSet } = {}) => {
    const nextMode = setup.mode ?? mode;
    const nextMeter = setup.meter ?? meter;
    const count = nextMode === "answer" ? 4 : setup.count ?? barCount;
    const fresh = emptyBars(count);
    if (nextMode === "answer") {
      const list = questionsFor(nextMeter, setup.pitchSet ?? pitchSet);
      list[Math.min(setup.question ?? questionIndex, list.length - 1)].bars.forEach((bar, i) => { fresh[i] = bar.map((note) => ({ ...note })); });
    }
    setBarCount(count);
    setBars(fresh);
    setSelected(null);
    setMessage("");
  };

  /** 学生自己写过的音（接龙的问句不算）。改设置要清空它们时先问一声。 */
  const hasOwnNotes = bars.slice(lockedBars).some((bar) => bar.length);
  const mayDiscard = (what: string) => !hasOwnNotes || window.confirm(`${what}会清空已经写好的旋律，确定吗？`);

  const chooseLevel = (next: Level) => {
    if (next === level || !mayDiscard("换年级")) return;
    const info = LEVELS[next];
    setLevel(next);
    setPitchSet(info.pitchSets[0]);
    setMeter(info.meters[0]);
    setDuration(durationsFor(info.meters[0])[0].b);
    setCard(null);
    if (!info.accompaniment) setAccompaniment(false);
    setQuestionIndex(0);
    reset({ meter: info.meters[0], question: 0, count: info.barCounts[0], pitchSet: info.pitchSets[0] });
  };

  const chooseMode = (next: ComposeMode) => {
    if (next === mode || !mayDiscard(next === "answer" ? "换成旋律接龙" : "换成自由创编")) return;
    setMode(next);
    setQuestionIndex(0);
    reset({ mode: next, question: 0 });
  };

  const choosePitchSet = (next: PitchSet) => {
    if (next === pitchSet) return;
    // 接龙的问句跟着音块换，所以要重新开始；自由创编时写好的音都留着。
    if (mode === "answer") {
      if (!mayDiscard("换一组音")) return;
      setQuestionIndex(0);
      reset({ question: 0, pitchSet: next });
    }
    setPitchSet(next);
  };

  const chooseMeter = (next: Meter) => {
    if (next === meter || !mayDiscard("换拍号")) return;
    setMeter(next);
    setDuration(durationsFor(next)[0].b);
    setQuestionIndex(0);
    setCard(null);
    reset({ meter: next, question: 0 });
  };

  /** 改长度：加小节时原来的旋律都留着；减小节时，被去掉的小节里有音才问。 */
  const chooseCount = (count: number) => {
    if (count === bars.length) return;
    if (count > bars.length) {
      setBars((current) => [...current, ...emptyBars(count - current.length)]);
      setBarCount(count);
      return;
    }
    if (bars.slice(count).some((bar) => bar.length) && !window.confirm(`改成 ${count} 小节会去掉后面几个小节写好的音，确定吗？`)) return;
    setBars((current) => current.slice(0, count));
    setBarCount(count);
    setSelected(null);
  };

  const chooseQuestion = (next: number) => {
    if (next === questionIndex || !mayDiscard("换问句")) return;
    setQuestionIndex(next);
    reset({ mode: "answer", question: next });
  };

  /** Duration of the next note: from the rhythm card when one is chosen, otherwise the duration chip. */
  const nextDuration = (bar: ComposeNote[]) => {
    if (!card) return duration;
    let sum = 0;
    for (const b of card) {
      if (Math.abs(sum - barBeats(bar)) < 1e-6) return b;
      sum += b;
    }
    return duration;
  };

  const addNote = (d: number, o: number) => {
    // 选中了一个音：换成新的音高（时值不变）。
    if (selected) {
      if (d) void soundNote({ d, o });
      setBars((current) => current.map((bar, i) => i !== selected.bar ? bar : bar.map((note, k) => k === selected.index ? { ...note, d, o } : note)));
      setMessage("");
      return;
    }
    if (cursorBar < 0) { setMessage(`${bars.length} 小节已经写满了。点一个音符可以修改它，或者按“退一步”。`); return; }
    const room = beats - barBeats(bars[cursorBar]);
    const b = nextDuration(bars[cursorBar]);
    if (b > room + 1e-6) {
      setMessage(`第 ${cursorBar + 1} 小节只剩 ${formatBeats(room, meter)}，换一个短一点的音符吧。`);
      return;
    }
    if (d) void soundNote({ d, o });
    setBars((current) => current.map((bar, i) => i === cursorBar ? [...bar, { d, o, b }] : bar));
    setMessage("");
  };

  const undo = () => {
    setSelected(null);
    setMessage("");
    for (let i = bars.length - 1; i >= lockedBars; i -= 1) {
      if (bars[i].length) {
        setBars((current) => current.map((bar, k) => k === i ? bar.slice(0, -1) : bar));
        return;
      }
    }
  };

  const removeSelected = () => {
    if (!selected) return;
    setBars((current) => current.map((bar, i) => i === selected.bar ? bar.filter((_, k) => k !== selected.index) : bar));
    setSelected(null);
  };

  /** 给我灵感：把当前小节剩下的部分（或整个空小节）写好，学生可以再改。 */
  const inspire = () => {
    if (cursorBar < 0) { setMessage("已经写满了，可以点音符修改，或者按“重新写”。"); return; }
    const previous = bars.slice(0, cursorBar + 1).flat().filter((note) => note.d).at(-1);
    const isLast = cursorBar === bars.length - 1;
    let fresh = inspireBar(previous, blocks, meter, isLast);
    const existing = bars[cursorBar];
    if (existing.length) {
      // 已经写了一部分：只补满剩下的拍子。
      let room = beats - barBeats(existing);
      fresh = [];
      let last = previous;
      while (room > 1e-6) {
        const piece = inspireBar(last, blocks, meter, false)[0];
        const b = room >= 1 && unitOf(meter) === 1 ? 1 : 0.5;
        fresh.push({ ...piece, b });
        last = fresh.at(-1);
        room -= b;
      }
      if (isLast && fresh.length) fresh[fresh.length - 1] = { ...fresh[fresh.length - 1], ...homeNote(blocks) };
    }
    setBars((current) => current.map((bar, i) => i === cursorBar ? [...bar, ...fresh] : bar));
    setMessage(`第 ${cursorBar + 1} 小节写好了，唱一唱，不喜欢就点音符改一改。`);
    if (fresh[0]?.d) void soundNote(fresh[0]);
  };

  // 键盘：数字键输入音，0 是休止，退格键退一步。输入框里打字时不拦截。
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  const onKey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Backspace") { event.preventDefault(); undo(); return; }
    if (!/^[0-8]$/.test(event.key)) return;
    const digit = Number(event.key);
    if (digit === 0) { addNote(0, 0); return; }
    const block = digit === 8 ? blocks.find((item) => item.o === 1) : blocks.find((item) => item.d === digit && item.o === 0);
    if (block) addNote(block.d, block.o);
    else setMessage(`现在用的是${PITCH_SETS[pitchSet].label}（${PITCH_SETS[pitchSet].caption}），没有 ${digit}。`);
  };
  useEffect(() => { keyHandler.current = onKey; });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const melody = useMemo(() => toMelody(bars, meter, lyrics, title, accompaniment), [bars, meter, lyrics, title, accompaniment]);
  const hasNotes = bars.some((bar) => bar.length);
  const playerKey = useMemo(() => JSON.stringify([bars, meter, lyrics, title, notation, accompaniment]), [bars, meter, lyrics, title, notation, accompaniment]);
  const hints = composeHints(bars, meter, mode, lyrics, lockedBars, pitchSet);
  const complete = cursorBar < 0;

  const save = () => {
    const work: SavedWork = { id: String(Date.now()), title: title.trim() || "我的旋律", author: author.trim(), meter, bars, lyrics, savedAt: Date.now(), accompaniment, level, pitchSet };
    const next = [work, ...works];
    setWorks(next);
    setMessage(storeWorks(next) ? `《${work.title}》已保存在这台电脑上。` : "这台电脑不允许保存，请截图留存作品。");
  };

  const open = (work: SavedWork) => {
    if (hasOwnNotes && !window.confirm(`打开《${work.title}》会替换现在正在写的旋律，确定吗？`)) return;
    const setup = setupOf(work);
    setLevel(setup.level);
    setPitchSet(setup.pitchSet);
    setMode("free");
    setQuestionIndex(0);
    setCard(null);
    setDuration(durationsFor(work.meter)[0].b);
    setMeter(work.meter);
    setBarCount(work.bars.length);
    setBars(work.bars.map((bar) => bar.map((note) => ({ ...note }))));
    setLyrics(work.lyrics);
    setTitle(work.title);
    setAuthor(work.author);
    setAccompaniment(Boolean(work.accompaniment) && LEVELS[setup.level].accompaniment);
    setSelected(null);
    setMessage(`已打开《${work.title}》。`);
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const remove = (id: string) => {
    const next = works.filter((item) => item.id !== id);
    setWorks(next);
    storeWorks(next);
  };

  const showcase = () => {
    const stage = stageRef.current;
    if (stage?.requestFullscreen) void stage.requestFullscreen().catch(() => undefined);
  };

  return <div className="compose-lab">
    <header className="compose-intro">
      <div>
        <p className="compose-kicker">旋律创编</p>
        <h2>用几个音，写一段自己的旋律</h2>
      </div>
      <div className="compose-levels" role="radiogroup" aria-label="年级">
        {(Object.keys(LEVELS) as Level[]).map((key) =>
          <button key={key} type="button" role="radio" aria-checked={level === key} className={level === key ? "is-active" : ""} onClick={() => chooseLevel(key)}>
            <span>{LEVELS[key].label}</span><small>{LEVELS[key].caption}</small>
          </button>)}
      </div>
    </header>

    <div className="compose-settings">
      <div className="compose-field">
        <span className="compose-field-label">玩法</span>
        <div className="compose-chips">
          {([["free", "自由创编"], ["answer", "旋律接龙"]] as const).map(([value, label]) =>
            <button key={value} type="button" aria-pressed={mode === value} className={mode === value ? "is-active" : ""}
              onClick={() => chooseMode(value)}>{label}</button>)}
        </div>
      </div>
      {levelInfo.pitchSets.length > 1 && <div className="compose-field">
        <span className="compose-field-label">用哪些音</span>
        <div className="compose-chips">
          {levelInfo.pitchSets.map((key) =>
            <button key={key} type="button" className={pitchSet === key ? "is-active" : ""} aria-pressed={pitchSet === key} onClick={() => choosePitchSet(key)}>
              {PITCH_SETS[key].label}<small>{PITCH_SETS[key].caption}</small>
            </button>)}
        </div>
      </div>}
      {levelInfo.meters.length > 1 && <div className="compose-field">
        <span className="compose-field-label">拍号</span>
        <div className="compose-chips">
          {levelInfo.meters.map((value) =>
            <button key={value} type="button" className={meter === value ? "is-active" : ""} aria-pressed={meter === value}
              onClick={() => chooseMeter(value)}>{value}</button>)}
        </div>
      </div>}
      {levelInfo.barCounts.length > 1 && mode === "free" && <div className="compose-field">
        <span className="compose-field-label">长度</span>
        <div className="compose-chips">
          {levelInfo.barCounts.map((count) =>
            <button key={count} type="button" className={barCount === count ? "is-active" : ""} aria-pressed={barCount === count}
              onClick={() => chooseCount(count)}>{count} 小节</button>)}
        </div>
      </div>}
      {mode === "answer" && <div className="compose-field">
        <span className="compose-field-label">问句</span>
        <div className="compose-chips">
          {questions.map((q, i) =>
            <button key={q.label} type="button" className={questionIndex === i ? "is-active" : ""} aria-pressed={questionIndex === i}
              onClick={() => chooseQuestion(i)}>{q.label}</button>)}
        </div>
      </div>}
    </div>

    <div className="compose-workbench">
    <section className="compose-editor" aria-label="写旋律">
      <div className="compose-score-head">
        <span className="compose-key">1=C <b>{meter}</b></span>
        <span className="compose-key-tip">音越高，站得越高</span>
      </div>
      <div className={`compose-bars${beats >= 3 ? " is-wide" : ""}`}>
        {bars.map((bar, barIndex) => {
          const locked = barIndex < lockedBars;
          const filled = barBeats(bar);
          return <div key={barIndex} className={`compose-bar${locked ? " is-locked" : ""}${barIndex === cursorBar ? " is-cursor" : ""}${barIndex === bars.length - 1 ? " is-final" : ""}`}>
            <span className="compose-bar-label">{locked ? "问句" : mode === "answer" ? "答句" : `第 ${barIndex + 1} 小节`}</span>
            <div className="compose-bar-notes">
              {bar.map((note, index) => {
                const isSelected = selected?.bar === barIndex && selected.index === index;
                return <button key={index} type="button" disabled={locked} className={`compose-note${isSelected ? " is-selected" : ""}`}
                  style={{ flexGrow: note.b, "--step": note.d ? stepOf(note, blocks) : 0.5 } as CSSProperties}
                  aria-label={`${note.d === 0 ? "休止" : note.d}，${formatBeats(note.b, meter)}${isSelected ? "，已选中" : ""}`}
                  onClick={() => { setSelected(isSelected ? null : { bar: barIndex, index }); if (!isSelected && note.d) void soundNote(note); }}>
                  <NoteFigure note={note} />
                </button>;
              })}
              {filled < beats - 1e-6 && <span className="compose-room" style={{ flexGrow: beats - filled }} aria-hidden="true">{barIndex === cursorBar ? "＋" : ""}</span>}
            </div>
          </div>;
        })}
      </div>

      <div className="compose-tools">
        <div className="compose-rhythm-row">
          <span className="compose-field-label">节奏</span>
          <div className="compose-durations" role="radiogroup" aria-label="音符时值或节奏卡">
            {durationsFor(meter).filter((item) => item.b <= beats).map((item) =>
              <button key={item.b} type="button" role="radio" aria-checked={!card && duration === item.b} className={`compose-duration${!card && duration === item.b ? " is-active" : ""}`}
                title={item.name} onClick={() => { setCard(null); setDuration(item.b); }}>
                <NoteFigure note={{ d: 5, o: 0, b: item.b }} plain />
                <span>{formatBeats(item.b, meter)}</span>
              </button>)}
            <span className="compose-divider" aria-hidden="true" />
            {RHYTHM_CARDS[meter].map((item) => {
              const active = card?.join() === item.join();
              return <button key={item.join()} type="button" role="radio" aria-checked={active} aria-label={`节奏卡：${cardLabel(item, meter)}`} title={cardLabel(item, meter)} className={`compose-card${active ? " is-active" : ""}`}
                onClick={() => setCard(active ? null : item)}>
                <RhythmGlyph card={item} />
              </button>;
            })}
          </div>
        </div>
        {card && <p className="compose-card-tip">节奏卡已选好，接下来只要点音高。再点一次节奏卡可以取消。</p>}
        <p className="compose-now" aria-live="polite">
          {selected ? <>正在改第 <b>{selected.bar + 1}</b> 小节的一个音</>
            : cursorBar < 0 ? <>{bars.length} 小节都写满了</>
            : <>正在写第 <b>{cursorBar + 1}</b> 小节 · 还剩 <b>{formatBeats(beats - barBeats(bars[cursorBar]), meter)}</b></>}
        </p>
        <span className="compose-field-label compose-palette-label">音高 · 点一下就写进去</span>
        <div className="compose-palette" aria-label="音块">
          {blocks.map((block, index) =>
            <button key={`${block.d}${block.o}`} type="button" className="compose-block"
              style={{ "--block": block.color, "--step": index / Math.max(1, blocks.length - 1) } as CSSProperties}
              onClick={() => addNote(block.d, block.o)}>
              <span className="compose-block-digit">{block.o > 0 && <i className="compose-dot-high" aria-hidden="true" />}{block.d}</span>
              <span className="compose-block-name">{block.o > 0 ? "高音 do" : block.name}</span>
            </button>)}
          <button type="button" className="compose-block is-rest" onClick={() => addNote(0, 0)}>
            <span className="compose-block-digit">0</span>
            <span className="compose-block-name">休止</span>
          </button>
        </div>
        <div className="compose-actions">
          {selected ? <>
            <span className="compose-selected-tip">点上面的音块可以换掉选中的音</span>
            <button type="button" onClick={removeSelected}>删掉这个音</button>
            <button type="button" onClick={() => setSelected(null)}>取消选中</button>
          </> : <>
            <button type="button" className="compose-inspire" onClick={inspire} disabled={complete}>✦ 给我一点灵感</button>
            <button type="button" onClick={undo}>退一步</button>
            <button type="button" onClick={() => reset()}>重新写</button>
            <span className="compose-keys">⌨ 数字键 1–7 写音 · 0 休止 · 退格键退一步</span>
          </>}
        </div>
        <p className="compose-message" role="status" aria-live="polite">{message}</p>
      </div>
    </section>

    <section className="compose-stage" ref={stageRef} aria-label="我的作品">
      <p className="compose-stage-kicker">我的作品</p>
      <div className="compose-card-head">
        <input className="compose-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="给旋律起个名字" aria-label="作品名称" maxLength={16} />
        <input className="compose-author" value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="作者" aria-label="作者" maxLength={12} />
      </div>
      <label className="compose-lyrics">
        <span>配一句歌词（可选，一个字对一个音）</span>
        <input value={lyrics} onChange={(event) => setLyrics(event.target.value)} placeholder="例如：小 雨 点 沙 沙 沙" maxLength={60} />
      </label>
      <div className="compose-preview-bar">
        <div className="compose-chips" role="radiogroup" aria-label="谱式">
          {([["jianpu", "简谱"], ["staff", "五线谱"]] as const).map(([value, label]) =>
            <button key={value} type="button" role="radio" aria-checked={notation === value} className={notation === value ? "is-active" : ""} onClick={() => setNotation(value)}>{label}</button>)}
        </div>
        {levelInfo.accompaniment && <label className="compose-switch">
          <input type="checkbox" checked={accompaniment} onChange={(event) => setAccompaniment(event.target.checked)} />
          <span>自动配低音伴奏</span>
        </label>}
      </div>
      {hasNotes
        ? <div className="compose-player"><MelodyPlayer key={playerKey} melody={melody} notationStyle={notation} /></div>
        : <p className="compose-empty">写下第一个音，这里就会出现你的乐谱，可以播放听一听。</p>}
      <ul className="compose-hints" aria-label="创编提示">
        {hints.map((hint) => <li key={hint.text} className={`is-${hint.tone}`}>{hint.text}</li>)}
      </ul>
      <div className="compose-save">
        <button type="button" className="compose-primary" onClick={save} disabled={!complete}>{complete ? "保存作品" : "写满后可以保存"}</button>
        <button type="button" onClick={showcase} disabled={!hasNotes}>投屏展示</button>
      </div>
    </section>

    </div>

    {works.length > 0 && <section className="compose-gallery" aria-label="作品集">
      <h3>作品集 <small>保存在这台电脑上</small></h3>
      <ul>
        {works.map((work) => <li key={work.id}>
          <div>
            <strong>《{work.title}》</strong>
            <span>{work.author || "无名作者"} · {work.meter} · {work.bars.length} 小节</span>
            <span className="compose-gallery-notes">{work.bars.map((bar) => bar.map((note) => `${note.d}${note.o > 0 ? "'" : ""}${noteShape(note.b).dotted ? "." : ""}${" -".repeat(noteShape(note.b).dashes)}${noteShape(note.b).eighth ? "_" : ""}`).join(" ")).join(" | ")} ‖</span>
          </div>
          <div className="compose-gallery-actions">
            <button type="button" onClick={() => open(work)}>打开</button>
            <button type="button" onClick={() => remove(work.id)} aria-label={`删除《${work.title}》`}>删除</button>
          </div>
        </li>)}
      </ul>
    </section>}
  </div>;
}

function homeNote(blocks: { d: number; o: number }[]) {
  const home = blocks.find((block) => block.d === 1 && block.o === 0) ?? blocks.at(-1)!;
  return { d: home.d, o: home.o };
}
