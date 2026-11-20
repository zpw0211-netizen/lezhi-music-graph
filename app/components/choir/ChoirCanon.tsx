"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { EDITION } from "../../lib/app/books";
import { loadWorks } from "../compose/compose-model";
import { ChoirPractice } from "./ChoirPractice";
import {
  CANON_SONGS, buildCanon, canonHarmony, canonPiece, entriesFor, maxVoicesFor, workAsCanon,
  type CanonEnding, type CanonSource,
} from "./canon-model";

/** 轮唱与卡农：一条旋律，几个声部一个接一个地进来。上面看清谁什么时候进，下面合起来听、分声部练。 */

const PHRASE_COLORS = ["#C8553D", "#D9A441", "#4E9A6B", "#2F7FA8", "#7D5BA6", "#B5577F", "#5B8C85", "#8C6D46"];
const ORDINAL = ["一", "二", "三", "四", "五", "六", "七", "八"];

export function ChoirCanon() {
  const own = useMemo(() => (typeof window === "undefined" ? [] : loadWorks().flatMap((work) => workAsCanon(work) ?? [])), []);
  const sources = useMemo(() => [...CANON_SONGS, ...own], [own]);
  const [sourceId, setSourceId] = useState(CANON_SONGS[0].id);
  const source: CanonSource = useMemo(() => sources.find((item) => item.id === sourceId) ?? CANON_SONGS[0], [sources, sourceId]);
  const entries = entriesFor(source);
  const [chosenEntry, setEntry] = useState(source.entry);
  const entry = entries.includes(chosenEntry) ? chosenEntry : entries.includes(source.entry) ? source.entry : entries[0];
  const maxVoices = maxVoicesFor(source, entry);
  const [chosenVoices, setVoices] = useState(3);
  const voices = Math.min(chosenVoices, maxVoices);
  const [times, setTimes] = useState(1);
  const [ending, setEnding] = useState<CanonEnding>("each");
  const [notation, setNotation] = useState<"jianpu" | "staff">(EDITION.notation === "staff" ? "staff" : "jianpu");

  // 这几步交给 React Compiler 记住结果，不手写 useMemo。
  const setup = { voices, entry, times, ending };
  const layout = buildCanon(source, setup);
  const piece = canonPiece(source, setup, layout);
  const harmony = canonHarmony(layout);
  const phrases = Math.ceil(source.bars.length / entry);

  const choose = (id: string) => {
    const next = sources.find((item) => item.id === id);
    if (!next) return;
    setSourceId(id);
    setEntry(next.entry);
  };

  const ratio = harmony.together ? harmony.clash / harmony.together : 0;
  const hints = [
    `第一声部唱完第一句（${entry} 小节），第二声部从头唱起${voices > 2 ? "，后面的声部也一样，一句一句往后错开" : ""}。同一时刻，几个声部唱的是不同的句子。`,
    harmony.together === 0 ? "声部之间没有同时唱的地方，试试把进入间隔调短一点。"
      : ratio <= 0.15 ? `各声部同时唱的时候，大多数音都很和谐（挨得很近的只有 ${harmony.clash} 个半拍）。这条旋律很适合轮唱。`
      : ratio <= 0.35 ? `有 ${harmony.clash} 个半拍两个声部挨得很近（二度），听起来有点紧，一下就过去了。轮唱里常有这种“经过”的味道。`
      : `有不少地方两个声部挨得很近（第 ${harmony.clashBars.slice(0, 4).map((bar) => bar + 1).join("、")} 小节等），听起来比较“打架”。换一个进入间隔听听，或者回到旋律创编改一改。`,
  ];

  return <div className="canon">
    <div className="choir-pick">
      <div className="choir-field">
        <span className="choir-label">旋律</span>
        <div className="choir-chips" role="radiogroup" aria-label="轮唱的旋律">
          {CANON_SONGS.map((item) => <button key={item.id} type="button" role="radio" aria-checked={item.id === source.id} className={item.id === source.id ? "is-active" : ""} onClick={() => choose(item.id)}>
            《{item.title}》<small>{item.caption}</small>
          </button>)}
          {own.length > 0 && <select value={source.id.startsWith("work:") ? source.id : ""} aria-label="我写的旋律" onChange={(event) => { if (event.target.value) choose(event.target.value); }}>
            <option value="">我在旋律创编里写的…</option>
            {own.map((item) => <option key={item.id} value={item.id}>《{item.title}》 {item.meter}</option>)}
          </select>}
        </div>
      </div>
      <div className="canon-settings">
        <div className="choir-field">
          <span className="choir-label">声部</span>
          <div className="choir-chips" role="radiogroup" aria-label="几个声部">
            {[2, 3, 4].map((count) => <button key={count} type="button" role="radio" aria-checked={voices === count} className={voices === count ? "is-active" : ""} disabled={count > maxVoices} onClick={() => setVoices(count)}>{count} 个</button>)}
          </div>
        </div>
        <div className="choir-field">
          <span className="choir-label">隔几小节进入</span>
          <div className="choir-chips" role="radiogroup" aria-label="进入间隔">
            {entries.map((value) => <button key={value} type="button" role="radio" aria-checked={entry === value} className={entry === value ? "is-active" : ""} onClick={() => setEntry(value)}>{value} 小节</button>)}
          </div>
        </div>
        <div className="choir-field">
          <span className="choir-label">每个声部唱</span>
          <div className="choir-chips" role="radiogroup" aria-label="唱几遍">
            {[1, 2].map((value) => <button key={value} type="button" role="radio" aria-checked={times === value} className={times === value ? "is-active" : ""} onClick={() => setTimes(value)}>{value} 遍</button>)}
          </div>
        </div>
        <div className="choir-field">
          <span className="choir-label">结尾</span>
          <div className="choir-chips" role="radiogroup" aria-label="怎么结束">
            {([["each", "各自唱完"], ["together", "跟第一声部一起停"]] as const).map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={ending === value} className={ending === value ? "is-active" : ""} onClick={() => setEnding(value)}>{label}</button>)}
          </div>
        </div>
      </div>
    </div>

    <section className="choir-card canon-map" aria-label="各声部什么时候进入">
      <p className="choir-step-title"><b>谁什么时候进</b><span>一格是一小节，同一种颜色是同一句。旋律分成 {phrases} 句，每句 {entry} 小节。</span></p>
      <div className="canon-grid" style={{ "--bars": layout.totalBars } as CSSProperties}>
        {layout.grid.map((row, voice) => <div key={voice} className="canon-row">
          <span className="canon-voice">第{ORDINAL[voice]}声部</span>
          <div className="canon-cells">
            {row.map((phrase, bar) => <span key={bar} className={`canon-cell${phrase === null ? " is-rest" : ""}`}
              style={phrase === null ? undefined : { "--phrase": PHRASE_COLORS[phrase % PHRASE_COLORS.length] } as CSSProperties}
              title={phrase === null ? `第 ${bar + 1} 小节 · 休止` : `第 ${bar + 1} 小节 · 第${ORDINAL[phrase] ?? phrase + 1}句`}>
              {phrase !== null && (bar === 0 || row[bar - 1] !== phrase) ? ORDINAL[phrase] ?? phrase + 1 : ""}
            </span>)}
          </div>
        </div>)}
      </div>
      <ul className="compose-hints canon-hints">
        {hints.map((hint) => <li key={hint}>{hint}</li>)}
      </ul>
      <div className="choir-chips canon-notation" role="radiogroup" aria-label="谱式">
        {([["jianpu", "简谱"], ["staff", "五线谱"]] as const).map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={notation === value} className={notation === value ? "is-active" : ""} onClick={() => setNotation(value)}>{label}</button>)}
      </div>
    </section>

    <ChoirPractice piece={piece} playerKey={`${piece.id}|${notation}`} notation={notation} storeKey="yapu-choir-canon" />
  </div>;
}
