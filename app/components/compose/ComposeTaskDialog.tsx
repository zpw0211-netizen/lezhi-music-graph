"use client";

// 老师出题：按页面上现在选好的年级、音、拍号、长度和玩法，再加几条要求，生成一个二维码给全班扫。
import { useState, type ReactNode } from "react";
import { QrCard, qrSvg } from "../share/SharePanel";
import { MAX_PAYLOAD, shareUrl } from "../../lib/share/share-codec";
import { PITCH_SETS, RHYTHM_CARDS, formatBeats, type ComposeMode, type Level, type Meter, type PitchSet } from "./compose-model";
import { DISTINCT_CHOICES, encodeTask, taskSetup, type ComposeTask } from "./compose-task";

type Props = {
  level: Level; pitchSet: PitchSet; meter: Meter; bars: number; mode: ComposeMode; question: number;
  glyph: (card: number[]) => ReactNode;
  onClose: () => void;
};

export function ComposeTaskDialog({ level, pitchSet, meter, bars, mode, question, glyph, onClose }: Props) {
  const [text, setText] = useState("");
  const [end, setEnd] = useState(pitchSet !== "three");
  const [card, setCard] = useState<number[] | null>(null);
  const [distinct, setDistinct] = useState(0);
  const [lyrics, setLyrics] = useState(false);
  const [qr, setQr] = useState<{ url: string; svg: string } | null>(null);
  const [error, setError] = useState("");
  const blockCount = PITCH_SETS[pitchSet].blocks.length;
  const task: ComposeTask = { text: text.trim(), level, pitchSet, meter, bars: mode === "answer" ? 4 : bars, mode, question, end: end && pitchSet !== "three", card, distinct, lyrics };

  const make = async () => {
    const payload = encodeTask(task);
    if (payload.length > MAX_PAYLOAD) { setError("任务写得太长了，删短一点再试。"); return; }
    try {
      const url = shareUrl("compose", payload);
      setQr({ url, svg: await qrSvg(url) });
    } catch { setError("二维码没生成出来，请再试一次。"); }
  };

  if (qr) {
    return <QrCard title="创编任务" url={qr.url} svg={qr.svg} onClose={onClose}
      tip="学生用平板或手机扫码，就按这些设置写，写的时候逐条打勾。写好以后，学生点「二维码」交作品，老师在大屏上点「扫码收作品」收上来。">
      <p className="task-summary">{task.text && <b>{task.text}</b>}<span>{taskSetup(task)}</span></p>
    </QrCard>;
  }

  return <div className="share-dialog" role="dialog" aria-modal="true" aria-label="老师出题" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="share-card task-form">
      <p className="share-card-title">老师出题</p>
      <p className="task-summary"><span>{taskSetup(task)}</span><small>按页面上选好的年级、音、拍号、长度和玩法出题；要换先关掉这里去改。</small></p>
      <label className="task-row">
        <span>任务</span>
        <input value={text} maxLength={40} onChange={(event) => setText(event.target.value)} placeholder="例如：为《春天》写一段旋律（可以不写）" />
      </label>
      <div className="task-row">
        <span>要求</span>
        <div className="task-options">
          {pitchSet !== "three" && <label><input type="checkbox" checked={end} onChange={(event) => setEnd(event.target.checked)} />最后一个音落在 do</label>}
          <label><input type="checkbox" checked={lyrics} onChange={(event) => setLyrics(event.target.checked)} />配上歌词，一个字对一个音</label>
          <label>至少用到
            <select value={distinct} onChange={(event) => setDistinct(Number(event.target.value))}>
              {DISTINCT_CHOICES.filter((count) => count <= blockCount).map((count) => <option key={count} value={count}>{count ? `${count} 个` : "不限"}</option>)}
            </select>
            不同的音
          </label>
        </div>
      </div>
      <div className="task-row">
        <span>节奏卡</span>
        <div className="task-cards" role="radiogroup" aria-label="要用上的节奏卡">
          <button type="button" role="radio" aria-checked={!card} className={!card ? "is-active" : ""} onClick={() => setCard(null)}>不限</button>
          {RHYTHM_CARDS[meter].map((item) => {
            const on = card?.join() === item.join();
            return <button key={item.join()} type="button" role="radio" aria-checked={on} className={on ? "is-active" : ""}
              aria-label={`节奏卡：${item.map((b) => formatBeats(b, meter)).join("、")}`} onClick={() => setCard(item)}>{glyph(item)}</button>;
          })}
        </div>
      </div>
      {error && <p className="share-card-tip" role="status">{error}</p>}
      <div className="share-card-actions">
        <button type="button" onClick={onClose}>取消</button>
        <button type="button" className="is-primary" onClick={() => void make()}>生成二维码</button>
      </div>
    </div>
  </div>;
}
