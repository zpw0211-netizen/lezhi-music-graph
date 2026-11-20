"use client";

import { useEffect, useMemo, useState } from "react";
import { EDITION } from "../../lib/app/books";
import { ChoirCanon } from "./ChoirCanon";
import { ChoirComposer } from "./ChoirComposer";
import { ChoirPractice } from "./ChoirPractice";
import { choirPieces } from "./choir-model";
import { SHARED_EVENT, hasShared } from "../../lib/share/share-codec";

/** 声部和鸣（原名合唱训练）：练课本里的合唱歌，自己编一首二声部合唱，或者把一条旋律排成轮唱，再分声部练。 */

const STORE = "yapu-choir";
type Mode = "book" | "mine" | "canon";
type Saved = { piece: string; mode: Mode };
function readSaved(): Partial<Saved> {
  try { return JSON.parse(window.localStorage.getItem(STORE) ?? "{}") as Partial<Saved>; } catch { return {}; }
}

export function ChoirPage() {
  const pieces = useMemo(() => choirPieces(), []);
  const books = useMemo(() => [...new Map(pieces.map((piece) => [piece.bookKey, piece.bookName])).entries()], [pieces]);
  // 这个工具只在浏览器里载入，直接读上次的选择。
  const [saved] = useState(() => (typeof window === "undefined" ? {} : readSaved()));
  const [pieceId, setPieceId] = useState(() => (pieces.some((item) => item.id === saved.piece) ? saved.piece! : pieces[0]?.id ?? ""));
  const [chosenMode, setMode] = useState<Mode>(() => (typeof window !== "undefined" && hasShared("choir") ? "mine" : saved.mode === "mine" || saved.mode === "canon" ? saved.mode : "book"));
  // 分享来的合唱在“自己编合唱”里打开。
  useEffect(() => {
    const receive = () => { if (hasShared("choir")) setMode("mine"); };
    window.addEventListener(SHARED_EVENT, receive);
    return () => window.removeEventListener(SHARED_EVENT, receive);
  }, []);
  // 这个版本的课本里没有可以分声部练的合唱歌时，只能自己编。
  const mode: Mode = pieces.length || chosenMode !== "book" ? chosenMode : "mine";
  useEffect(() => {
    try { window.localStorage.setItem(STORE, JSON.stringify({ ...readSaved(), piece: pieceId, mode: chosenMode })); } catch { /* private mode */ }
  }, [pieceId, chosenMode]);

  const piece = pieces.find((item) => item.id === pieceId) ?? pieces[0];
  const bookPieces = piece ? pieces.filter((item) => item.bookKey === piece.bookKey) : [];
  const notation = EDITION.notation === "staff" ? "staff" : "jianpu";

  return <section className="rhythm-lab choir-lab" aria-labelledby="choir-title">
    <header className="choir-intro">
      <div>
        <h2 id="choir-title">{mode === "mine" ? "自己编一首合唱，再分声部唱" : mode === "canon" ? "一条旋律，几个声部轮流进来" : "唱好自己的声部，再和别人合在一起"}</h2>
      </div>
      <div className="choir-modes" role="radiogroup" aria-label="练什么">
        {pieces.length > 0 && <button type="button" role="radio" aria-checked={mode === "book"} className={mode === "book" ? "is-active" : ""} onClick={() => setMode("book")}>
          <span>课本合唱</span><small>练书上的合唱歌</small>
        </button>}
        <button type="button" role="radio" aria-checked={mode === "mine"} className={mode === "mine" ? "is-active" : ""} onClick={() => setMode("mine")}>
          <span>自己编合唱</span><small>高声部、低声部</small>
        </button>
        <button type="button" role="radio" aria-checked={mode === "canon"} className={mode === "canon" ? "is-active" : ""} onClick={() => setMode("canon")}>
          <span>轮唱与卡农</span><small>一条旋律错开唱</small>
        </button>
      </div>
    </header>

    {mode === "mine" ? <ChoirComposer /> : mode === "canon" ? <ChoirCanon /> : piece && <>
      <div className="choir-pick">
        <label className="choir-field">
          <span className="choir-label">课本</span>
          <select value={piece.bookKey} onChange={(event) => setPieceId(pieces.find((item) => item.bookKey === event.target.value)?.id ?? pieceId)}>
            {books.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
          </select>
        </label>
        <div className="choir-field choir-songs" role="group" aria-label="选歌">
          <span className="choir-label">歌曲</span>
          <div className="choir-chips">
            {bookPieces.map((item) => <button key={item.id} type="button" className={item.id === piece.id ? "is-active" : ""} aria-pressed={item.id === piece.id} onClick={() => setPieceId(item.id)}>
              《{item.work}》{item.excerpt && item.excerpt !== "全曲" && <small>{item.excerpt}</small>}<small>{item.parts.length} 个声部</small>
            </button>)}
          </div>
        </div>
      </div>
      <ChoirPractice piece={piece} playerKey={piece.id} notation={notation} preferVocal storeKey={STORE} />
    </>}
  </section>;
}
