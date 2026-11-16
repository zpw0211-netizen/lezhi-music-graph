"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { EDITION } from "../../lib/app/books";
import { MelodyPlayer } from "../lesson/MelodyPlayer";
import { RhythmGlyph, cardLabel, soundNote } from "../compose/ComposePage";
import { RHYTHM_CARDS, barBeats, beatsOf, durationsFor, formatBeats, lyricSyllables, noteShape, type ComposeNote, type Meter } from "../compose/compose-model";
import { ChoirPractice } from "./ChoirPractice";
import {
  CHOIR_BAR_COUNTS, CHOIR_METERS, ENSEMBLES, VOICES, blankWork, blocksFor, choirHints, emptyRows, loadChoirWorks, loadDraft, nearestBlock, notesIn,
  storeChoirWorks, storeDraft, toChoirMelody, toChoirPiece, wordsFor, writtenRows, type ChoirWork, type EnsembleId,
} from "./choir-compose";

/** 自己编合唱：每个声部一行，选中哪个声部，下面的音块就换成它的音域；写好两个声部以上就能在下面分声部练。 */

/** One jianpu figure with dots above (high octaves) or below (low octaves), an underline for half a beat, dashes for long notes. */
function Figure({ note }: { note: ComposeNote }) {
  const shape = noteShape(note.b);
  const dots = Math.abs(note.o);
  return <span className="choir-figure">
    <span className={`choir-digit${shape.eighth ? " is-eighth" : ""}${note.o < 0 ? " is-low" : ""}`}>
      {note.d > 0 && note.o > 0 && <i className="choir-dots is-high" aria-hidden="true">{"•".repeat(dots)}</i>}
      {note.d}
      {shape.dotted && <i className="choir-aug" aria-hidden="true" />}
      {note.d > 0 && note.o < 0 && <i className="choir-dots is-low" aria-hidden="true">{"•".repeat(dots)}</i>}
    </span>
    {Array.from({ length: shape.dashes }, (_, k) => <span key={k} className="choir-dash" aria-hidden="true">–</span>)}
  </span>;
}

const octaveWord = (o: number) => (o >= 2 ? "倍高音" : o === 1 ? "高音" : o === -1 ? "低音" : o <= -2 ? "倍低音" : "");

export function ChoirComposer() {
  // 本页只在浏览器里载入，可以直接读本机的草稿和作品集。
  const [work, setWork] = useState<ChoirWork>(() => (typeof window === "undefined" ? blankWork() : loadDraft() ?? blankWork()));
  const [works, setWorks] = useState<ChoirWork[]>(() => (typeof window === "undefined" ? [] : loadChoirWorks()));
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [chosenDuration, setDuration] = useState(1);
  const [card, setCard] = useState<number[] | null>(null);
  const [followAbove, setFollowAbove] = useState(true);
  const [selected, setSelected] = useState<{ bar: number; index: number } | null>(null);
  const [message, setMessage] = useState("");
  const [notation, setNotation] = useState<"jianpu" | "staff">(EDITION.notation === "staff" ? "staff" : "jianpu");
  const top = useRef<HTMLDivElement | null>(null);
  useEffect(() => { storeDraft(work); }, [work]);

  const voices = ENSEMBLES[work.ensemble].voices;
  const active = Math.min(voiceIndex, voices.length - 1);
  const voice = voices[active];
  const beats = beatsOf(work.meter);
  const barCount = work.rows[0]?.length ?? 4;
  const row = work.rows[active] ?? [];
  const blocks = useMemo(() => blocksFor(voice), [voice]);
  const cursorBar = row.findIndex((bar) => barBeats(bar) < beats - 1e-6);
  const hasNotes = work.rows.some((bars) => bars.some((bar) => bar.length));
  const durations = durationsFor(work.meter).filter((item) => item.b <= beats);
  const duration = durations.some((item) => item.b === chosenDuration) ? chosenDuration : durations[0].b;

  /** The written voice just above this one: its rhythm can be followed note for note. */
  const guide = useMemo(() => {
    for (let k = active - 1; k >= 0; k -= 1) if (work.rows[k]?.some((bar) => bar.length)) return k;
    return -1;
  }, [active, work.rows]);

  const updateRow = (index: number, change: (bars: ComposeNote[][]) => ComposeNote[][]) =>
    setWork((current) => ({ ...current, rows: current.rows.map((bars, k) => (k === index ? change(bars) : bars)) }));

  const mayDiscard = (what: string) => !hasNotes || window.confirm(`${what}会清空已经写好的合唱，确定吗？`);
  const resetTo = (change: Partial<ChoirWork> & { bars?: number }) => {
    setWork((current) => {
      const ensemble = change.ensemble ?? current.ensemble;
      return { ...current, ...change, ensemble, rows: emptyRows(ensemble, change.bars ?? current.rows[0]?.length ?? 4), words: ENSEMBLES[ensemble].voices.map(() => "") };
    });
    setSelected(null);
    setMessage("");
  };
  const chooseEnsemble = (next: EnsembleId) => {
    if (next === work.ensemble || !mayDiscard("换声部组合")) return;
    setVoiceIndex(0);
    resetTo({ ensemble: next });
  };
  const chooseMeter = (next: Meter) => {
    if (next === work.meter || !mayDiscard("换拍号")) return;
    setCard(null);
    setDuration(durationsFor(next)[0].b);
    resetTo({ meter: next });
  };
  const chooseCount = (count: number) => {
    if (count === barCount) return;
    if (count < barCount && work.rows.some((bars) => bars.slice(count).some((bar) => bar.length)) && !window.confirm(`改成 ${count} 小节会去掉后面几个小节写好的音，确定吗？`)) return;
    setWork((current) => ({ ...current, rows: current.rows.map((bars) => (count > bars.length ? [...bars, ...Array.from({ length: count - bars.length }, () => [])] : bars.slice(0, count))) }));
    setSelected(null);
  };
  const chooseVoice = (index: number) => {
    setVoiceIndex(index);
    setSelected(null);
    setMessage("");
  };

  /** Length of the next note: the voice above when following it, then the rhythm card, then the duration chip. */
  const nextDuration = (bar: number) => {
    const filled = barBeats(row[bar]);
    const walk = (lengths: number[]) => {
      let sum = 0;
      for (const b of lengths) {
        if (Math.abs(sum - filled) < 1e-6) return b;
        sum += b;
      }
      return null;
    };
    if (followAbove && guide >= 0) {
      const above = work.rows[guide][bar] ?? [];
      const b = walk(above.map((note) => note.b));
      if (b != null) return b;
    }
    return (card && walk(card)) ?? duration;
  };

  const addNote = (d: number, o: number) => {
    if (selected) {
      if (d) void soundNote({ d, o });
      updateRow(active, (bars) => bars.map((bar, i) => (i !== selected.bar ? bar : bar.map((note, k) => (k === selected.index ? { ...note, d, o } : note)))));
      setMessage("");
      return;
    }
    if (cursorBar < 0) { setMessage(`${VOICES[voice].label}的 ${barCount} 小节已经写满了。点一个音符可以修改它，或者按“退一步”。`); return; }
    const room = beats - barBeats(row[cursorBar]);
    const b = nextDuration(cursorBar);
    if (b > room + 1e-6) { setMessage(`第 ${cursorBar + 1} 小节只剩 ${formatBeats(room, work.meter)}，换一个短一点的音符吧。`); return; }
    if (d) void soundNote({ d, o });
    updateRow(active, (bars) => bars.map((bar, i) => (i === cursorBar ? [...bar, { d, o, b }] : bar)));
    setMessage("");
  };

  const undo = () => {
    setSelected(null);
    setMessage("");
    const last = row.map((bar) => bar.length > 0).lastIndexOf(true);
    if (last >= 0) updateRow(active, (bars) => bars.map((bar, k) => (k === last ? bar.slice(0, -1) : bar)));
  };
  const removeSelected = () => {
    if (!selected) return;
    updateRow(active, (bars) => bars.map((bar, i) => (i === selected.bar ? bar.filter((_, k) => k !== selected.index) : bar)));
    setSelected(null);
  };
  const clearVoice = () => {
    if (!row.some((bar) => bar.length) || !window.confirm(`清空${VOICES[voice].label}写好的音，确定吗？`)) return;
    updateRow(active, (bars) => bars.map(() => []));
    setSelected(null);
  };

  // 键盘：数字键写音（自动挑离上一个音最近的那个八度），0 是休止，退格键退一步。输入框里打字时不拦截。
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandler.current = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Backspace") { event.preventDefault(); undo(); return; }
      if (!/^[0-7]$/.test(event.key)) return;
      const digit = Number(event.key);
      if (!digit) { addNote(0, 0); return; }
      const previous = row.flat().filter((note) => note.d).at(-1);
      const block = nearestBlock(voice, digit, previous);
      if (block) addNote(block.d, block.o);
    };
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // 只有音和歌词变了才换谱子；改名字、作者时正在放的合唱不受影响。
  const { ensemble, meter, rows, words } = work;
  const music = useMemo(() => ({ ...blankWork(), ensemble, meter, rows, words }), [ensemble, meter, rows, words]);
  const soloColor = useMemo(() => { const row = writtenRows(music)[0]; return row ? [VOICES[row.voice].sound] : undefined; }, [music]);
  const setWords = (index: number, text: string) => setWork((current) => ({ ...current, words: current.words.map((item, k) => (k === index ? text : item)) }));
  const piece = useMemo(() => toChoirPiece(music), [music]);
  const solo = useMemo(() => (piece ? null : toChoirMelody(music)), [piece, music]);
  const hints = choirHints(work);

  const save = () => {
    const saved: ChoirWork = { ...work, id: String(Date.now()), title: work.title.trim() || "我的合唱", author: work.author.trim(), savedAt: Date.now() };
    const next = [saved, ...works];
    setWorks(next);
    setMessage(storeChoirWorks(next) ? `《${saved.title}》已保存在这台电脑上。` : "这台电脑不允许保存，请截图留存作品。");
  };
  const open = (saved: ChoirWork) => {
    if (hasNotes && !window.confirm(`打开《${saved.title}》会替换现在正在写的合唱，确定吗？`)) return;
    setWork({ ...saved, id: "draft", rows: saved.rows.map((bars) => bars.map((bar) => bar.map((note) => ({ ...note })))) });
    setVoiceIndex(0);
    setSelected(null);
    setCard(null);
    setDuration(durationsFor(saved.meter)[0].b);
    setMessage(`已打开《${saved.title}》。`);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const remove = (id: string) => {
    const next = works.filter((item) => item.id !== id);
    setWorks(next);
    storeChoirWorks(next);
  };
  const startOver = () => {
    if (!mayDiscard("重新开始")) return;
    setWork((current) => blankWork(current.ensemble, current.meter, current.rows[0]?.length ?? 4));
    setVoiceIndex(0);
    setSelected(null);
    setMessage("");
  };

  const rowsWritten = writtenRows(work).length;
  const followLabel = guide >= 0 ? VOICES[voices[guide]].label : "";

  return <div className="choir-compose" ref={top}>
    <div className="choir-pick choir-compose-settings">
      {Object.keys(ENSEMBLES).length > 1 && <div className="choir-field">
        <span className="choir-label">声部组合</span>
        <div className="choir-chips" role="radiogroup" aria-label="声部组合">
          {(Object.keys(ENSEMBLES) as EnsembleId[]).map((key) => <button key={key} type="button" role="radio" aria-checked={work.ensemble === key} className={work.ensemble === key ? "is-active" : ""} onClick={() => chooseEnsemble(key)}>
            {ENSEMBLES[key].label}<small>{ENSEMBLES[key].caption}</small>
          </button>)}
        </div>
      </div>}
      <div className="choir-compose-row">
        <div className="choir-field">
          <span className="choir-label">拍号</span>
          <div className="choir-chips" role="radiogroup" aria-label="拍号">
            {CHOIR_METERS.map((meter) => <button key={meter} type="button" role="radio" aria-checked={work.meter === meter} className={work.meter === meter ? "is-active" : ""} onClick={() => chooseMeter(meter)}>{meter}</button>)}
          </div>
        </div>
        <div className="choir-field">
          <span className="choir-label">长度</span>
          <div className="choir-chips" role="radiogroup" aria-label="长度">
            {CHOIR_BAR_COUNTS.map((count) => <button key={count} type="button" role="radio" aria-checked={barCount === count} className={barCount === count ? "is-active" : ""} onClick={() => chooseCount(count)}>{count} 小节</button>)}
          </div>
        </div>
      </div>
    </div>

    <section className="choir-card choir-editor" aria-label="写合唱">
      <div className="choir-voice-tabs" role="tablist" aria-label="正在写的声部">
        {voices.map((id, index) => {
          const filled = (work.rows[index] ?? []).filter((bar) => Math.abs(barBeats(bar) - beats) < 1e-6).length;
          return <button key={id} type="button" role="tab" aria-selected={index === active} className={index === active ? "is-active" : ""} style={{ "--voice": VOICES[id].color } as CSSProperties} onClick={() => chooseVoice(index)}>
            <i aria-hidden="true" />{VOICES[id].label}<small>{VOICES[id].instrument} · {filled}/{barCount} 小节</small>
          </button>;
        })}
      </div>

      <div className="choir-score-head">
        <span className="compose-key">1=C <b>{work.meter}</b></span>
        <span className="choir-score-tip">播放时高声部用钢琴、低声部用木吉他，一听就能分开。点另一个声部里的音，可以直接切过去改它。</span>
      </div>
      <div className={`choir-grid${beats >= 3 ? " is-wide" : ""}`}>
        {Array.from({ length: barCount }, (_, barIndex) => <div key={barIndex} className={`choir-bar${barIndex === barCount - 1 ? " is-final" : ""}`}>
          <span className="choir-bar-label">第 {barIndex + 1} 小节</span>
          {voices.map((id, k) => {
            const bar = work.rows[k]?.[barIndex] ?? [];
            const filled = barBeats(bar);
            const isActive = k === active;
            return <div key={id} className={`choir-bar-row${isActive ? " is-active" : ""}${isActive && barIndex === cursorBar ? " is-cursor" : ""}`} style={{ "--voice": VOICES[id].color } as CSSProperties}>
              {bar.map((note, index) => {
                const isSelected = isActive && selected?.bar === barIndex && selected.index === index;
                return <button key={index} type="button" className={`choir-note${isSelected ? " is-selected" : ""}`} style={{ flexGrow: note.b }}
                  aria-label={`${VOICES[id].label}，第 ${barIndex + 1} 小节，${note.d ? `${octaveWord(note.o)}${note.d}` : "休止"}，${formatBeats(note.b, work.meter)}${isSelected ? "，已选中" : ""}`}
                  onClick={() => {
                    if (k !== active) setVoiceIndex(k);
                    setMessage("");
                    setSelected(isSelected ? null : { bar: barIndex, index });
                    if (!isSelected && note.d) void soundNote(note);
                  }}>
                  <Figure note={note} />
                </button>;
              })}
              {filled < beats - 1e-6 && <span className="choir-room" style={{ flexGrow: beats - filled }} aria-hidden="true">{isActive && barIndex === cursorBar ? "＋" : ""}</span>}
            </div>;
          })}
        </div>)}
      </div>

      <div className="choir-tools">
        <div className="choir-rhythm-row">
          <span className="choir-label">节奏</span>
          <div className="compose-durations" role="radiogroup" aria-label="音符时值或节奏卡">
            {guide >= 0 && <button type="button" role="checkbox" aria-checked={followAbove} className={`compose-card choir-follow${followAbove ? " is-active" : ""}`} onClick={() => setFollowAbove((on) => !on)}>
              跟{followLabel}同节奏
            </button>}
            {durations.map((item) => {
              const on = !card && duration === item.b && !(followAbove && guide >= 0);
              return <button key={item.b} type="button" role="radio" aria-checked={on} className={`compose-duration${on ? " is-active" : ""}`}
                title={item.name} onClick={() => { setCard(null); setFollowAbove(false); setDuration(item.b); }}>
                <Figure note={{ d: 5, o: 0, b: item.b }} />
                <span>{formatBeats(item.b, work.meter)}</span>
              </button>;
            })}
            <span className="compose-divider" aria-hidden="true" />
            {RHYTHM_CARDS[work.meter].map((item) => {
              const on = card?.join() === item.join() && !(followAbove && guide >= 0);
              return <button key={item.join()} type="button" role="radio" aria-checked={on} aria-label={`节奏卡：${cardLabel(item, work.meter)}`} title={cardLabel(item, work.meter)} className={`compose-card${on ? " is-active" : ""}`}
                onClick={() => { setFollowAbove(false); setCard(on ? null : item); }}>
                <RhythmGlyph card={item} />
              </button>;
            })}
          </div>
        </div>
        {followAbove && guide >= 0 && <p className="choir-tool-tip">现在跟{followLabel}一个音对一个音，只要点音高；节奏对不上的地方按右边的时值写。</p>}
        <p className="choir-now" aria-live="polite">
          {selected ? <>正在改{VOICES[voice].label}第 <b>{selected.bar + 1}</b> 小节的一个音</>
            : cursorBar < 0 ? <>{VOICES[voice].label}的 {barCount} 小节都写满了</>
            : <>正在写<b>{VOICES[voice].label}</b>第 <b>{cursorBar + 1}</b> 小节 · 还剩 <b>{formatBeats(beats - barBeats(row[cursorBar]), work.meter)}</b></>}
        </p>
        <span className="choir-label">{VOICES[voice].label}的音域 · 点一下就写进去</span>
        <div className="compose-palette choir-palette" aria-label={`${VOICES[voice].label}的音块`}>
          {blocks.map((block, index) => <button key={`${block.d}${block.o}`} type="button" className="compose-block"
            title={`${octaveWord(block.o)}${block.name}`}
            style={{ "--block": block.color, "--step": index / Math.max(1, blocks.length - 1) } as CSSProperties}
            onClick={() => addNote(block.d, block.o)}>
            <span className="compose-block-digit"><Figure note={{ d: block.d, o: block.o, b: 1 }} /></span>
            <span className="compose-block-name">{block.name}</span>
          </button>)}
          <button type="button" className="compose-block is-rest" onClick={() => addNote(0, 0)}>
            <span className="compose-block-digit">0</span>
            <span className="compose-block-name">休止</span>
          </button>
        </div>
        <div className="compose-actions choir-actions">
          {selected ? <>
            <span className="compose-selected-tip">点上面的音块可以换掉选中的音</span>
            <button type="button" onClick={removeSelected}>删掉这个音</button>
            <button type="button" onClick={() => setSelected(null)}>取消选中</button>
          </> : <>
            <button type="button" onClick={undo}>退一步</button>
            <button type="button" onClick={clearVoice}>清空这个声部</button>
            <button type="button" onClick={startOver}>全部重新写</button>
            <span className="compose-keys">⌨ 数字键 1–7 写音 · 0 休止 · 退格键退一步</span>
          </>}
        </div>
        <p className="compose-message" role="status" aria-live="polite">{message}</p>
      </div>
    </section>

    <section className="choir-card choir-work" aria-label="我的合唱">
      <div className="choir-work-head">
        <input value={work.title} onChange={(event) => setWork((current) => ({ ...current, title: event.target.value }))} placeholder="给合唱起个名字" aria-label="作品名称" maxLength={16} />
        <input value={work.author} onChange={(event) => setWork((current) => ({ ...current, author: event.target.value }))} placeholder="作者" aria-label="作者" maxLength={12} />
      </div>
      <div className="choir-words" role="group" aria-label="填词">
        <p className="choir-step-title"><b>填词</b><span>每个声部可以填自己的词，一个字对一个音，填好马上出现在谱子里。空着的声部，节奏和最上面的声部一样时就唱它的词。</span></p>
        {voices.map((id, index) => {
          const info = wordsFor(work, index);
          const notes = notesIn(work.rows[index] ?? []);
          const count = lyricSyllables(work.words[index] ?? "").length;
          const status = !notes ? "还没写音" : count ? `${count} 字 / ${notes} 音` : info.from ? `唱${VOICES[info.from].label}的词` : `${notes} 个音`;
          return <label key={id} className="choir-words-row" style={{ "--voice": VOICES[id].color } as CSSProperties}>
            <span className="choir-words-voice"><i aria-hidden="true" />{VOICES[id].label}</span>
            <input value={work.words[index] ?? ""} onChange={(event) => setWords(index, event.target.value)} maxLength={80}
              placeholder={index === 0 ? "例如：春 风 吹 绿 了 山 岗" : "也可以填自己的词，比如“啊”"} />
            <small className={count && notes ? (count === notes ? "is-ok" : "is-off") : ""}>{status}</small>
          </label>;
        })}
      </div>
      <ul className="compose-hints choir-hints" aria-label="编创提示">
        {hints.map((hint) => <li key={hint.text} className={`is-${hint.tone}`}>{hint.text}</li>)}
      </ul>
      <div className="choir-work-actions">
        <div className="choir-chips" role="radiogroup" aria-label="谱式">
          {([["jianpu", "简谱"], ["staff", "五线谱"]] as const).map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={notation === value} className={notation === value ? "is-active" : ""} onClick={() => setNotation(value)}>{label}</button>)}
        </div>
        <button type="button" className="choir-mic-button" onClick={save} disabled={!rowsWritten}>保存作品</button>
      </div>
    </section>

    {piece
      ? <ChoirPractice piece={piece} playerKey={`${piece.id}|${notation}`} notation={notation} storeKey="yapu-choir-mine" />
      : solo
        ? <div className="choir-card choir-score"><MelodyPlayer key={JSON.stringify([work.rows, work.words, notation])} melody={solo} notationStyle={notation} partColors={soloColor} /></div>
        : null}

    {works.length > 0 && <section className="choir-card choir-gallery" aria-label="作品集">
      <h3>我的合唱作品 <small>保存在这台电脑上</small></h3>
      <ul>
        {works.map((item) => <li key={item.id}>
          <div>
            <strong>《{item.title}》</strong>
            <span>{item.author || "无名作者"} · {ENSEMBLES[item.ensemble].label} · {item.meter} · {item.rows[0]?.length ?? 0} 小节</span>
          </div>
          <div className="choir-gallery-actions">
            <button type="button" onClick={() => open(item)}>打开</button>
            <button type="button" onClick={() => remove(item.id)} aria-label={`删除《${item.title}》`}>删除</button>
          </div>
        </li>)}
      </ul>
    </section>}
  </div>;
}
