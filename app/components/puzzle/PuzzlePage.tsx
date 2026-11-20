"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { EDITION } from "../../lib/app/books";
import { midiOf, type Melody, type MelodyNote } from "../../lib/lesson/jianpu";
import { loadInstrumentSampler, playInstrumentSample } from "../../lib/lesson/instrument-sampler";
import { getPianoAudioContext } from "../../lib/lesson/piano-sampler";
import { MelodyPlayer } from "../lesson/MelodyPlayer";
import { StaffNotation } from "../lesson/StaffNotation";
import { PUZZLE_LEVELS, fits, puzzleSongs, shuffled, structureOf, type PuzzleLevel, type PuzzlePhrase, type PuzzleSong } from "./puzzle-model";

/** 乐句拼图：一首课本歌曲切成几句，打乱后边听边排回原样；拼好了再看看这首歌是怎么搭起来的。 */

const STORE = "yapu-puzzle";
const ORDINAL = ["一", "二", "三", "四", "五", "六", "七", "八"];
/** 只靠听的时候卡片上没有谱，用颜色认卡片。 */
const CARD_COLORS: Array<[string, string]> = [["红", "#C8553D"], ["橙", "#D98A3D"], ["绿", "#4E9A6B"], ["蓝", "#2F7FA8"], ["紫", "#7D5BA6"], ["粉", "#C2618A"], ["青", "#3C9A9A"], ["棕", "#8C6D46"]];
function randomHues() {
  const list = CARD_COLORS.map((_, index) => index);
  for (let i = list.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list;
}
type Saved = { song?: string; level?: PuzzleLevel; stars?: Record<string, number> };
function readSaved(): Saved {
  try { return JSON.parse(window.localStorage.getItem(STORE) ?? "{}") as Saved; } catch { return {}; }
}
function writeSaved(patch: Saved) {
  try { window.localStorage.setItem(STORE, JSON.stringify({ ...readSaved(), ...patch })); } catch { /* private mode */ }
}

// ── 播放：一串音按顺序弹出来，可以随时停。
let stopCurrent: (() => void) | null = null;
async function playNotes(melody: Melody, notes: MelodyNote[], onEnd: () => void, onBeat?: (beat: number) => void) {
  stopCurrent?.();
  const context = getPianoAudioContext();
  void context.resume();
  const sampler = await loadInstrumentSampler(context, "piano");
  const out = context.createGain();
  out.gain.value = 0.9;
  out.connect(context.destination);
  const beat = 60 / melody.bpm;
  const start = context.currentTime + 0.12;
  let at = start;
  notes.forEach((note, index) => {
    if (note.d >= 1 && note.d <= 7 && !note.tie) {
      let length = note.b;
      for (let k = index + 1; k < notes.length && notes[k].tie; k += 1) length += notes[k].b;
      playInstrumentSample(context, "piano", sampler, midiOf(melody, note), at, length * beat * 0.97, out, 0.9);
    }
    at += note.b * beat;
  });
  let frame = 0;
  const tick = () => {
    const now = context.currentTime;
    if (now >= at + 0.15) { stop(); return; }
    onBeat?.((now - start) / beat);
    frame = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    out.gain.setTargetAtTime(0, context.currentTime, 0.03);
    window.setTimeout(() => out.disconnect(), 400);
    if (stopCurrent === stop) stopCurrent = null;
    onEnd();
  };
  stopCurrent = stop;
  frame = requestAnimationFrame(tick);
}

// ── 卡片上的谱：简谱一拍一组，组里的短音减时线连在一起；五线谱版用站里的五线谱。
function shapeOf(b: number) {
  const table: Array<[number, number, boolean]> = [[0.25, 2, false], [0.375, 2, true], [0.5, 1, false], [0.75, 1, true], [1, 0, false], [1.5, 0, true]];
  const hit = table.find(([beats]) => Math.abs(beats - b) < 1e-6);
  return hit ? { lines: hit[1], dot: hit[2], dashes: 0 } : { lines: 0, dot: false, dashes: Math.max(0, Math.round(b) - 1) };
}
function JianpuPhrase({ phrase, meter, words }: { phrase: PuzzlePhrase; meter: string; words: boolean }) {
  const unit = meter.endsWith("/8") ? 1.5 : 1;
  return <div className="pz-jianpu">
    {phrase.bars.map((bar, barIndex) => {
      const groups: MelodyNote[][] = [];
      let t = 0;
      let lastGroup = -1;
      for (const note of bar) {
        const group = note.b < unit - 1e-6 ? Math.floor((t + 1e-6) / unit) : -2 - groups.length;
        if (group !== lastGroup || group < 0) groups.push([]);
        groups[groups.length - 1].push(note);
        lastGroup = group;
        t += note.b;
      }
      return <span key={barIndex} className="pz-bar">
        {groups.map((group, g) => <span key={g} className="pz-beat">
          {group.map((note, k) => {
            const shape = shapeOf(note.b);
            const o = note.o ?? 0;
            return <span key={k} className={`pz-note pz-lines-${shape.lines}${note.tie ? " is-tied" : ""}`}>
              <span className="pz-digit">
                {o > 0 && <i className="pz-dot is-high">{"•".repeat(o)}</i>}
                {note.a === 1 ? <sup>♯</sup> : note.a === -1 ? <sup>♭</sup> : null}{note.d}
                {o < 0 && <i className="pz-dot is-low">{"•".repeat(-o)}</i>}
                {shape.dot && <i className="pz-aug">·</i>}
              </span>
              {Array.from({ length: shape.dashes }, (_, d) => <span key={d} className="pz-dash" aria-hidden="true" />)}
              {words && <span className="pz-lyric">{note.lyric ?? ""}</span>}
            </span>;
          })}
        </span>)}
      </span>;
    })}
  </div>;
}
/** 五线谱版：只画这一句，歌词由五线谱自己写在音下面（不看歌词的难度就去掉）。 */
function StaffPhrase({ phrase, melody, words }: { phrase: PuzzlePhrase; melody: Melody; words: boolean }) {
  const bars = words ? phrase.bars : phrase.bars.map((bar) => bar.map((note) => ({ ...note, lyric: undefined })));
  const mini: Melody = { ...melody, bars, voices: undefined, label: undefined, marks: undefined, staff: melody.staff?.slice(0, 1) };
  return <div className="pz-staff"><StaffNotation melody={mini} lines={[{ label: "", bars }]} current={[]} offsets={[[]]} width={460} activePhrase={null} /></div>;
}

export function PuzzlePage() {
  const songs = useMemo(() => puzzleSongs(), []);
  const books = useMemo(() => [...new Map(songs.map((song) => [song.bookKey, song.bookName])).entries()], [songs]);
  const [saved] = useState(() => (typeof window === "undefined" ? {} : readSaved()));
  const [songId, setSongId] = useState(() => (songs.some((song) => song.id === saved.song) ? saved.song! : songs[0]?.id ?? ""));
  const [level, setLevel] = useState<PuzzleLevel>(() => saved.level ?? "words");
  const song: PuzzleSong | undefined = songs.find((item) => item.id === songId) ?? songs[0];

  const [pool, setPool] = useState<number[]>(() => (song ? shuffled(song.phrases) : []));
  /** 每一轮重新给卡片分颜色，免得颜色的顺序泄露乐句的顺序。 */
  const [hues, setHues] = useState<number[]>(() => randomHues());
  const [slots, setSlots] = useState<Array<number | null>>(() => song?.phrases.map(() => null) ?? []);
  const [picked, setPicked] = useState<number | null>(null);
  const [checks, setChecks] = useState(0);
  const [listens, setListens] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [playingSlot, setPlayingSlot] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [stars, setStars] = useState<Record<string, number>>(() => saved.stars ?? {});
  const boardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => { stopCurrent?.(); }, []);

  const start = (next: PuzzleSong) => {
    stopCurrent?.();
    setSongId(next.id);
    writeSaved({ song: next.id });
    setPool(shuffled(next.phrases));
    setHues(randomHues());
    setSlots(next.phrases.map(() => null));
    setPicked(null); setChecks(0); setListens(0); setWrong([]); setSolved(false); setMessage("");
  };
  if (!song) return <section className="rhythm-lab puzzle-lab"><p className="pz-empty">这个版本的课本里还没有能拼的歌。</p></section>;

  const bookSongs = songs.filter((item) => item.bookKey === song.bookKey);
  const songName = (item: PuzzleSong) => `《${item.work}》${item.excerpt ? ` ${item.excerpt}` : ""}`;
  const placed = slots.filter((slot) => slot !== null).length;
  const full = placed === slots.length;

  const play = (id: string, notes: MelodyNote[], onBeat?: (beat: number) => void) => {
    if (playing === id) { stopCurrent?.(); return; }
    setPlaying(id);
    void playNotes(song.melody, notes, () => { setPlaying((current) => (current === id ? null : current)); setPlayingSlot(null); }, onBeat);
  };
  const playWhole = () => {
    if (playing !== "whole") setListens((count) => count + 1);
    play("whole", song.melody.bars.flat());
  };
  const playCard = (card: number) => play(`card-${card}`, song.phrases[card].bars.flat());
  const playMine = () => {
    const order = slots.filter((slot): slot is number => slot !== null);
    const lengths = order.map((card) => song.phrases[card].endBeat - song.phrases[card].startBeat);
    play("mine", order.flatMap((card) => song.phrases[card].bars.flat()), (beat) => {
      let sum = 0;
      let at = 0;
      for (; at < lengths.length && beat >= sum + lengths[at]; at += 1) sum += lengths[at];
      setPlayingSlot(slots.indexOf(order[Math.min(at, order.length - 1)]));
    });
  };

  /** 把卡片放进空位：空位上原来的卡片回到下面。 */
  const place = (card: number, slot: number) => {
    if (solved) return;
    const next = slots.map((item) => (item === card ? null : item));
    const old = next[slot];
    next[slot] = card;
    setSlots(next);
    setPool([...pool.filter((item) => item !== card), ...(old !== null && old !== undefined ? [old] : [])]);
    setPicked(null);
    setWrong((list) => list.filter((item) => item !== slot));
    setMessage("");
  };
  const unplace = (slot: number) => {
    const card = slots[slot];
    if (card === null || solved) return;
    setSlots(slots.map((item, k) => (k === slot ? null : item)));
    setPool([...pool, card]);
    setWrong((list) => list.filter((item) => item !== slot));
  };
  const clickSlot = (slot: number) => {
    if (picked !== null) place(picked, slot);
    else if (slots[slot] !== null) unplace(slot);
  };

  const check = () => {
    const bad = slots.flatMap((card, slot) => (card === null || !fits(song.phrases, card, slot) ? [slot] : []));
    const count = checks + 1;
    setChecks(count);
    if (!bad.length) {
      stopCurrent?.();
      setSolved(true);
      const earned = count === 1 ? 3 : count === 2 ? 2 : 1;
      const best = { ...stars, [song.id]: Math.max(stars[song.id] ?? 0, earned) };
      setStars(best);
      writeSaved({ stars: best });
      setMessage("");
      window.setTimeout(() => boardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      return;
    }
    // 错的卡片退回下面，对的留着。
    const back = bad.map((slot) => slots[slot]).filter((card): card is number => card !== null);
    setSlots(slots.map((card, slot) => (bad.includes(slot) ? null : card)));
    setPool([...pool, ...back]);
    setWrong(bad);
    const right = slots.length - bad.length;
    const lastWrong = bad.includes(slots.length - 1);
    setMessage(right ? `对了 ${right} 句，退回去的 ${bad.length} 句再听听。${lastWrong ? "最后一句要像“回家”一样落稳。" : ""}` : "一句都还没放对。先听一遍原曲，记住开头是怎么唱的。");
  };

  const reshuffle = () => start(song);
  const structure = solved ? structureOf(song) : null;
  const earned = stars[song.id] ?? 0;
  const showWords = level === "words";
  const staff = EDITION.notation === "staff";

  const cardFace = (card: number) => level === "ear"
    ? <span className="pz-listen-only" style={{ "--card": CARD_COLORS[hues[card % hues.length]][1] } as CSSProperties}><i>{CARD_COLORS[hues[card % hues.length]][0]}</i>{CARD_COLORS[hues[card % hues.length]][0]}色卡片 · 点 ▶ 听这一句</span>
    : staff ? <StaffPhrase phrase={song.phrases[card]} melody={song.melody} words={showWords} />
    : <JianpuPhrase phrase={song.phrases[card]} meter={song.melody.meter} words={showWords} />;

  const drag = (card: number) => (event: DragEvent) => { event.dataTransfer.setData("text/plain", String(card)); event.dataTransfer.effectAllowed = "move"; setPicked(card); };
  const drop = (slot: number) => (event: DragEvent) => { event.preventDefault(); const card = Number(event.dataTransfer.getData("text/plain")); if (Number.isInteger(card)) place(card, slot); };

  return <section className="rhythm-lab puzzle-lab" aria-labelledby="puzzle-title">
    <header className="pz-intro">
      <h2 id="puzzle-title">把打乱的乐句排回原样</h2>
      <div className="pz-levels" role="radiogroup" aria-label="难度">
        {PUZZLE_LEVELS.map((item) => <button key={item.id} type="button" role="radio" aria-checked={level === item.id} className={level === item.id ? "is-active" : ""}
          onClick={() => { setLevel(item.id); writeSaved({ level: item.id }); }}>
          <span>{item.label}</span><small>{item.caption}</small>
        </button>)}
      </div>
    </header>

    <div className="pz-picker">
      <label className="pz-field"><span>课本</span>
        <select value={song.bookKey} onChange={(event) => { const next = songs.find((item) => item.bookKey === event.target.value); if (next) start(next); }}>
          {books.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
        </select>
      </label>
      <label className="pz-field pz-song"><span>歌曲</span>
        <select value={song.id} onChange={(event) => { const next = songs.find((item) => item.id === event.target.value); if (next) start(next); }}>
          {bookSongs.map((item) => <option key={item.id} value={item.id}>{songName(item)}{stars[item.id] ? ` ${"★".repeat(stars[item.id])}` : ""}</option>)}
        </select>
      </label>
      <button type="button" className="pz-ghost" onClick={() => { const others = songs.filter((item) => item.id !== song.id); start(others[Math.floor(Math.random() * others.length)] ?? song); }}>换一首</button>
      <div className="pz-whole">
        <button type="button" className={`pz-play-whole${playing === "whole" ? " is-playing" : ""}`} onClick={playWhole}>{playing === "whole" ? "■ 停止" : "▶ 听原曲"}</button>
        <span className="pz-stats">{song.phrases.length} 句 · 听了 {listens} 次 · 检查 {checks} 次</span>
      </div>
    </div>

    <div className={`pz-board${solved ? " is-solved" : ""}`} ref={boardRef}>
      <section className="pz-column pz-slots-column" aria-label="排好的顺序">
        <p className="pz-column-title"><b>排好的顺序</b><span>{solved ? "全部拼对了" : picked !== null ? "点一个位置，把选中的卡片放进去" : `已经放了 ${placed} / ${slots.length} 句`}</span></p>
        <ol className="pz-slots">
          {slots.map((card, slot) => <li key={slot} className={`pz-slot${card === null ? " is-empty" : ""}${wrong.includes(slot) ? " is-wrong" : ""}${playingSlot === slot ? " is-playing" : ""}${picked !== null && card === null ? " is-target" : ""}`}
            onDragOver={(event) => event.preventDefault()} onDrop={drop(slot)}>
            <span className="pz-slot-no">{ORDINAL[slot]}</span>
            {card === null
              ? <button type="button" className="pz-slot-empty" onClick={() => clickSlot(slot)}>{picked !== null ? "放在这里" : wrong.includes(slot) ? "这里原来那句不对" : `第${ORDINAL[slot]}句`}</button>
              : <div className="pz-card is-placed" draggable={!solved} onDragStart={drag(card)}>
                <button type="button" className={`pz-card-play${playing === `card-${card}` ? " is-playing" : ""}`} onClick={() => playCard(card)} aria-label="听这一句">{playing === `card-${card}` ? "■" : "▶"}</button>
                <button type="button" className="pz-card-face" onClick={() => clickSlot(slot)} disabled={solved} aria-label={`第${ORDINAL[slot]}个位置上的卡片，点一下拿回去`}>{cardFace(card)}</button>
                {solved && structure && <span className="pz-letter">{structure.letters[slot]}</span>}
              </div>}
          </li>)}
        </ol>
      </section>

      {!solved && <section className="pz-column pz-pool-column" aria-label="乐句卡片">
        <p className="pz-column-title"><b>乐句卡片</b><span>{pool.length ? "先听一听，再选一张放进空位" : "都放上去了，听一听对不对"}</span></p>
        <div className="pz-pool">
          {pool.map((card) => <div key={card} className={`pz-card${picked === card ? " is-picked" : ""}`} draggable onDragStart={drag(card)}>
            <button type="button" className={`pz-card-play${playing === `card-${card}` ? " is-playing" : ""}`} onClick={() => playCard(card)} aria-label="听这一句">{playing === `card-${card}` ? "■" : "▶"}</button>
            <button type="button" className="pz-card-face" aria-pressed={picked === card} onClick={() => setPicked(picked === card ? null : card)}>{cardFace(card)}</button>
          </div>)}
          {!pool.length && <p className="pz-pool-empty">卡片都排好了 ✓</p>}
        </div>
      </section>}
    </div>

    {!solved && <div className="pz-actions">
      <button type="button" className={`pz-secondary${playing === "mine" ? " is-playing" : ""}`} onClick={playMine} disabled={!placed}>{playing === "mine" ? "■ 停止" : "▶ 听我的拼法"}</button>
      <button type="button" className="pz-primary" onClick={check} disabled={!full}>{full ? "检查" : `还差 ${slots.length - placed} 句`}</button>
      <button type="button" className="pz-ghost" onClick={reshuffle}>重新打乱</button>
      {message && <p className="pz-message" role="status">{message}</p>}
    </div>}

    {solved && structure && <section className="pz-result" aria-label="拼好了">
      <div className="pz-result-head">
        <div>
          <p className="pz-result-title">拼好了！<span className="pz-stars" aria-label={`${earned} 颗星`}>{"★".repeat(earned)}<i>{"★".repeat(3 - earned)}</i></span></p>
          <p className="pz-result-sub">检查了 {checks} 次，听了原曲 {listens} 次。</p>
        </div>
        <div className="pz-result-actions">
          <button type="button" className="pz-ghost" onClick={reshuffle}>再拼一次</button>
          <button type="button" className="pz-primary" onClick={() => { const index = bookSongs.findIndex((item) => item.id === song.id); start(bookSongs[(index + 1) % bookSongs.length]); }}>下一首</button>
        </div>
      </div>
      <div className="pz-form">
        <span className="pz-form-label">这首歌的样子</span>
        <span className="pz-form-letters">{structure.letters.map((letter, index) => <b key={index} className={`pz-form-letter is-${letter.charCodeAt(0) - 65}`}>{letter}</b>)}</span>
      </div>
      <ul className="pz-notes">{structure.notes.map((note) => <li key={note}>{note}</li>)}</ul>
      <div className="pz-score"><MelodyPlayer key={song.id} melody={{ ...song.melody, title: undefined }} notationStyle={staff ? "staff" : "jianpu"} /></div>
    </section>}
  </section>;
}
