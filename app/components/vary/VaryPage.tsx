"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MelodyPlayer } from "../lesson/MelodyPlayer";
import { getPianoAudioContext } from "../../lib/lesson/piano-sampler";
import { loadInstrumentSampler, playInstrumentSample } from "../../lib/lesson/instrument-sampler";
import { BASS_STYLES, loadWorks, type BassStyle } from "../compose/compose-model";
import { useExplorationNav } from "../exploration/exploration-tools";
import {
  HANDOFF_STORE, SAMPLE_THEMES, TECHNIQUES, TECHNIQUE_BY_ID, applicable, applyAll, bassOf, bpmOf, compare, isAccompaniment, isTheme, isVaryMeter, midiOf, toMelody,
  type Accompaniment, type TechniqueId, type Theme, type Tune,
} from "./vary-model";

/** 旋律变奏：拿一条主题（自己写的或示例），变出对比段和再现段，连成一首 A–B–A′ 的单三部曲式小曲。 */

type Saved = { themeId: string; recipe: TechniqueId[]; b: TechniqueId[] | null; a2: TechniqueId[]; custom?: Theme; bass?: Accompaniment };
type Slot = "b" | "a2";
const STORE = "yapu-vary";
const MAX_STEPS = 3;
const GROUPS = ["装饰", "节奏", "音高"] as const;
const validRecipe = (value: unknown): value is TechniqueId[] => Array.isArray(value) && value.length <= MAX_STEPS && value.every((id) => TECHNIQUE_BY_ID.has(id as TechniqueId));
const recipeName = (recipe: TechniqueId[]) => recipe.map((id) => TECHNIQUE_BY_ID.get(id)!.label).join(" → ");

function readSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORE);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    if (typeof saved.themeId !== "string" || !validRecipe(saved.recipe)) return null;
    return {
      themeId: saved.themeId, recipe: saved.recipe,
      b: validRecipe(saved.b) && saved.b.length ? saved.b : null,
      a2: validRecipe(saved.a2) ? saved.a2 : [],
      ...(isTheme(saved.custom) ? { custom: saved.custom } : {}),
      ...(isAccompaniment(saved.bass) ? { bass: saved.bass } : {}),
    };
  } catch { return null; }
}
/** 旋律创编里点“拿去变奏”送过来的旋律，只取一次。 */
function takeHandoff(): Theme | null {
  try {
    const raw = window.localStorage.getItem(HANDOFF_STORE);
    if (!raw) return null;
    window.localStorage.removeItem(HANDOFF_STORE);
    const theme = JSON.parse(raw) as unknown;
    return isTheme(theme) ? { ...theme, id: "custom" } : null;
  } catch { return null; }
}
/** 旋律创编里存下的作品（二、三、四拍子的）也能拿来当主题。 */
function worksAsThemes(): Theme[] {
  return loadWorks().flatMap((work) => {
    const theme = { id: `work:${work.id}`, title: work.title || "我的旋律", source: "我在旋律创编里写的", meter: work.meter, bars: work.bars.filter((bar) => bar.length).map((bar) => bar.map((note) => ({ d: note.d, o: note.o, b: note.b }))) };
    return isVaryMeter(theme.meter) && isTheme(theme) ? [theme] : [];
  });
}

export function VaryPage() {
  const goTo = useExplorationNav();
  const [themes, setThemes] = useState<Theme[]>(SAMPLE_THEMES);
  const [themeId, setThemeId] = useState(SAMPLE_THEMES[0].id);
  const [recipe, setRecipe] = useState<TechniqueId[]>([]);
  const [sectionB, setSectionB] = useState<TechniqueId[] | null>(null);
  const [sectionA2, setSectionA2] = useState<TechniqueId[]>([]);
  const [notation, setNotation] = useState<"jianpu" | "staff">("jianpu");
  const [bass, setBass] = useState<Accompaniment>("broken");
  const [message, setMessage] = useState("");
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const loaded = useRef(false);
  useEffect(() => {
    const saved = readSaved();
    const handoff = takeHandoff();
    const custom = handoff ?? saved?.custom;
    const all = [...(custom ? [custom] : []), ...SAMPLE_THEMES, ...worksAsThemes()];
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from browser storage after mount */
    setThemes(all);
    if (saved?.bass) setBass(saved.bass);
    if (handoff) setThemeId(handoff.id);
    else if (saved && all.some((theme) => theme.id === saved.themeId)) { setThemeId(saved.themeId); setRecipe(saved.recipe); setSectionB(saved.b); setSectionA2(saved.a2); }
    /* eslint-enable react-hooks/set-state-in-effect */
    loaded.current = true;
  }, []);
  const custom = themes.find((item) => item.id === "custom");
  useEffect(() => {
    if (!loaded.current) return;
    try { window.localStorage.setItem(STORE, JSON.stringify({ themeId, recipe, b: sectionB, a2: sectionA2, bass, ...(custom ? { custom } : {}) } satisfies Saved)); } catch { /* storage may be unavailable */ }
  }, [themeId, recipe, sectionB, sectionA2, custom, bass]);

  const stop = useCallback(() => { stopRef.current?.(); stopRef.current = null; setPlayingIndex(null); }, []);
  useEffect(() => () => { stopRef.current?.(); }, []);

  const theme = themes.find((item) => item.id === themeId) ?? themes[0];
  const variation = useMemo(() => applyAll(theme, recipe), [theme, recipe]);
  const withBass = useCallback((tune: Tune) => (bass === "none" ? undefined : bassOf(tune, bass)), [bass]);
  const themeMelody = useMemo(() => toMelody(theme, theme.title, theme.source, withBass(theme)), [theme, withBass]);
  const variationMelody = useMemo(() => toMelody(variation, "", "学生创编", withBass(variation)), [variation, withBass]);
  const notes = useMemo(() => (recipe.length ? compare(theme, variation) : []), [theme, variation, recipe]);

  // 三部曲：A 是主题，B 是对比段，A′ 是再现段（不变就是原样再现）。
  const tuneB = useMemo(() => (sectionB ? applyAll(theme, sectionB) : null), [theme, sectionB]);
  const tuneA2 = useMemo(() => applyAll(theme, sectionA2), [theme, sectionA2]);
  const sameMeter = tuneB !== null && tuneB.meter === theme.meter && tuneA2.meter === theme.meter;
  const wholeMelody = useMemo(() => (tuneB && sameMeter
    // 伴奏一段一段地配，每段各自收束。
    ? toMelody({ meter: theme.meter, bars: [...theme.bars, ...tuneB.bars, ...tuneA2.bars] }, `${theme.title} · 三部曲`, "学生创编",
      bass === "none" ? undefined : [theme, tuneB, tuneA2].flatMap((tune) => bassOf(tune, bass)))
    : null), [theme, tuneB, tuneA2, sameMeter, bass]);

  const chooseTheme = (id: string) => {
    if (id === themeId) return;
    stop();
    setThemeId(id); setRecipe([]); setSectionB(null); setSectionA2([]); setMessage("");
  };
  const toggle = (id: TechniqueId) => {
    stop();
    setMessage("");
    if (recipe.includes(id)) { setRecipe(recipe.filter((item) => item !== id)); return; }
    if (recipe.length >= MAX_STEPS) { setMessage(`一次最多叠 ${MAX_STEPS} 种手法。先点掉一种，再换别的。`); return; }
    const reason = applicable(id, variation);
    if (reason) { setMessage(`${reason}。`); return; }
    setRecipe([...recipe, id]);
  };
  const place = (slot: Slot) => {
    if (!recipe.length) return;
    stop();
    if (slot === "b") setSectionB(recipe); else setSectionA2(recipe);
    setMessage(slot === "b" ? "已放进 B 段。再变一个放进 A′ 段，或者让 A′ 段原样再现。" : "已放进 A′ 段。");
  };

  /** A、B、A′ 一段接一段地弹。 */
  const playWhole = async () => {
    if (playingIndex !== null) { stop(); return; }
    if (!tuneB) return;
    const pieces: Tune[] = [theme, tuneB, tuneA2];
    const context = getPianoAudioContext();
    void context.resume();
    const sampler = await loadInstrumentSampler(context, "piano");
    const out = context.createGain();
    out.gain.value = 0.9;
    out.connect(context.destination);
    let at = context.currentTime + 0.2;
    const starts: number[] = [];
    for (const piece of pieces) {
      const beat = 60 / bpmOf(piece.meter);
      starts.push(at);
      const flat = piece.bars.flat();
      flat.forEach((note, index) => {
        if (note.d && !note.tie) {
          let length = note.b;
          for (let k = index + 1; k < flat.length && flat[k].tie; k += 1) length += flat[k].b;
          playInstrumentSample(context, "piano", sampler, midiOf(note), at, length * beat * 0.96, out, 0.85);
        }
        at += note.b * beat;
      });
      if (bass !== "none") {
        let low = starts[starts.length - 1];
        for (const note of bassOf(piece, bass).flat()) {
          if (note.d) playInstrumentSample(context, "piano", sampler, midiOf({ d: note.d, o: note.o ?? 0 }), low, note.b * beat * 0.96, out, 0.5);
          low += note.b * beat;
        }
      }
    }
    const end = at + 0.6;
    let frame = 0;
    const tick = () => {
      const now = context.currentTime;
      if (now >= end) { stop(); return; }
      let index = 0;
      starts.forEach((start, k) => { if (now >= start - 0.05) index = k; });
      setPlayingIndex(index);
      frame = window.requestAnimationFrame(tick);
    };
    stopRef.current = () => {
      window.cancelAnimationFrame(frame);
      out.gain.setTargetAtTime(0, context.currentTime, 0.03);
      window.setTimeout(() => out.disconnect(), 500);
    };
    setPlayingIndex(0);
    frame = window.requestAnimationFrame(tick);
  };

  const openSection = (key: string) => {
    stop();
    setRecipe(key === "b" ? sectionB ?? [] : key === "a2" ? sectionA2 : []);
  };
  const samples = themes.filter((item) => item.id.startsWith("sample-"));
  const works = themes.filter((item) => item.id.startsWith("work:"));
  const step = sectionB ? 3 : 2;
  const sections = [
    { key: "a", letter: "A", role: "主题", text: "原样呈示", bars: theme.bars.length, filled: true },
    { key: "b", letter: "B", role: "对比段", text: sectionB ? recipeName(sectionB) : "还空着", bars: tuneB?.bars.length ?? 0, filled: Boolean(sectionB) },
    { key: "a2", letter: "A′", role: "再现段", text: sectionA2.length ? recipeName(sectionA2) : "原样再现", bars: tuneA2.bars.length, filled: true },
  ];

  return <section className="rhythm-lab vary-lab" aria-labelledby="vary-title">
    <header className="vary-intro">
      <div>
        <p className="vary-kicker">旋律变奏</p>
        <h2 id="vary-title">把主题变一变，连成一首三部曲</h2>
      </div>
      <ol className="vary-steps" aria-label="创作步骤">
        <li className="is-done"><b>1</b>写一条主题</li>
        <li className={step === 2 ? "is-current" : "is-done"}><b>2</b>变出对比段</li>
        <li className={step === 3 ? "is-current" : ""}><b>3</b>连成 A–B–A′</li>
      </ol>
    </header>

    <div className="vary-settings">
      <div className="vary-field">
        <span className="vary-label">主题</span>
        <div className="vary-chips" role="radiogroup" aria-label="主题">
          {custom && <button type="button" role="radio" aria-checked={themeId === custom.id} className={`vary-chip-mine${themeId === custom.id ? " is-active" : ""}`} onClick={() => chooseTheme(custom.id)}>{custom.title}<small>我刚写的</small></button>}
          {samples.map((item) => <button key={item.id} type="button" role="radio" aria-checked={themeId === item.id} className={themeId === item.id ? "is-active" : ""} onClick={() => chooseTheme(item.id)}>{item.title}<small>{item.meter}</small></button>)}
        </div>
      </div>
      {works.length > 0 && <label className="vary-field">
        <span className="vary-label">存过的作品</span>
        <select value={themeId.startsWith("work:") ? themeId : ""} onChange={(event) => { if (event.target.value) chooseTheme(event.target.value); }}>
          <option value="">选一首</option>
          {works.map((item) => <option key={item.id} value={item.id}>{item.title}（{item.meter}）</option>)}
        </select>
      </label>}
      <button type="button" className="vary-link" onClick={() => goTo("compose")}>✎ 去旋律创编写一条自己的主题</button>
      <label className="vary-field vary-notation">
        <span className="vary-label">伴奏</span>
        <select value={bass} aria-label="伴奏" onChange={(event) => { stop(); setBass(event.target.value as Accompaniment); }}>
          <option value="none">不配伴奏</option>
          {(Object.keys(BASS_STYLES) as BassStyle[]).map((value) => <option key={value} value={value}>{BASS_STYLES[value].label}</option>)}
        </select>
      </label>
      <div className="vary-field">
        <span className="vary-label">谱式</span>
        <div className="vary-chips" role="radiogroup" aria-label="谱式">
          {([["jianpu", "简谱"], ["staff", "五线谱"]] as const).map(([value, label]) =>
            <button key={value} type="button" role="radio" aria-checked={notation === value} className={notation === value ? "is-active" : ""} onClick={() => setNotation(value)}>{label}</button>)}
        </div>
      </div>
    </div>

    <div className="vary-workbench">
      <div className="vary-scores">
        <article className="vary-card">
          <p className="vary-card-title"><b>主题</b><span>{theme.source}</span></p>
          <div className="vary-player"><MelodyPlayer key={`${theme.id}-${notation}-${bass}`} melody={themeMelody} notationStyle={notation} /></div>
        </article>
        <article className={`vary-card vary-card-result${recipe.length ? "" : " is-empty"}`}>
          <p className="vary-card-title"><b>变奏</b><span>{recipe.length ? `主题 → ${recipeName(recipe)}` : "还没有选手法"}</span></p>
          {recipe.length
            ? <>
              <div className="vary-player"><MelodyPlayer key={`${theme.id}-${recipe.join()}-${notation}-${bass}`} melody={variationMelody} notationStyle={notation} /></div>
              <ul className="vary-compare" aria-label="和主题比一比">{notes.map((note) => <li key={note}>{note}</li>)}</ul>
              <div className="vary-actions">
                <button type="button" className="vary-primary" onClick={() => place("b")} disabled={sectionB?.join() === recipe.join()}>放进 B 段 · 对比</button>
                <button type="button" className="vary-secondary" onClick={() => place("a2")} disabled={sectionA2.join() === recipe.join()}>放进 A′ 段 · 再现</button>
                <button type="button" onClick={() => { stop(); setRecipe([]); setMessage(""); }}>回到主题重来</button>
              </div>
            </>
            : <p className="vary-placeholder">点一种变奏手法，这里就会出现变过的旋律。手法可以叠起来用，最多三种。</p>}
        </article>
      </div>

      <div className="vary-side">
        <div className="vary-palette">
          <p className="vary-label">变奏手法 · 点一下用上，再点一下去掉</p>
          {GROUPS.map((group) => <div key={group} className="vary-group">
            <span className="vary-group-name">{group}</span>
            <div className="vary-techniques">
              {TECHNIQUES.filter((item) => item.group === group).map((item) => {
                const at = recipe.indexOf(item.id);
                const blocked = at < 0 ? applicable(item.id, variation) : null;
                return <button key={item.id} type="button" aria-pressed={at >= 0} className={`vary-technique${at >= 0 ? " is-active" : ""}${blocked ? " is-blocked" : ""}`} onClick={() => toggle(item.id)}>
                  <b>{item.label}{at >= 0 && <i>第 {at + 1} 步</i>}</b>
                  <span>{blocked ?? item.caption}</span>
                </button>;
              })}
            </div>
          </div>)}
          {message && <p className="vary-message" role="status">{message}</p>}
        </div>
      </div>
    </div>

    <section className="vary-form" aria-labelledby="vary-form-title">
      <header className="vary-form-head">
        <div>
          <h3 id="vary-form-title">我的三部曲</h3>
          <p>单三部曲式：主题（A）— 对比（B）— 再现（A′）。B 段要和主题不一样，A′ 段再回到主题。</p>
        </div>
        <button type="button" className="vary-primary" onClick={() => void playWhole()} disabled={!tuneB}>{playingIndex !== null ? "■ 停止" : "▶ 听整首"}</button>
      </header>
      <ol className="vary-sections">
        {sections.map((item, index) => <li key={item.key} className={`vary-section is-${item.key}${item.filled ? "" : " is-empty"}${playingIndex === index ? " is-playing" : ""}`}>
          <button type="button" className="vary-section-main" onClick={() => openSection(item.key)} disabled={!item.filled}>
            <b>{item.letter}</b>
            <span><em>{item.role}</em><small>{item.text}{item.filled ? ` · ${item.bars} 小节` : ""}</small></span>
          </button>
          {item.key === "b" && sectionB && <button type="button" className="vary-section-clear" onClick={() => { stop(); setSectionB(null); }}>清空</button>}
          {item.key === "a2" && sectionA2.length > 0 && <button type="button" className="vary-section-clear" onClick={() => { stop(); setSectionA2([]); }}>改回原样</button>}
        </li>)}
      </ol>
      {!tuneB && <p className="vary-empty">B 段还空着。变出一段和主题对比明显的旋律（比如换调式、倒影、拉宽），点“放进 B 段”。</p>}
      {tuneB && sectionB && sectionB.join() === sectionA2.join() && <p className="vary-message">B 段和 A′ 段用了同样的变法。A′ 段是“回家”，让它更像主题会更好。</p>}
      {wholeMelody && <div className="vary-player vary-whole"><MelodyPlayer key={`whole-${theme.id}-${sectionB?.join()}-${sectionA2.join()}-${notation}-${bass}`} melody={wholeMelody} notationStyle={notation} /></div>}
      {tuneB && !sameMeter && <p className="vary-empty">有一段换了拍子，整首谱不能写在一行拍号里。点“听整首”可以连起来听，点上面的 A、B、A′ 可以分段看谱。</p>}
    </section>
  </section>;
}
