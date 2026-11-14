"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MelodyPlayer } from "../lesson/MelodyPlayer";
import { getPianoAudioContext } from "../../lib/lesson/piano-sampler";
import { loadInstrumentSampler, playInstrumentSample } from "../../lib/lesson/instrument-sampler";
import { loadWorks } from "../compose/compose-model";
import {
  SAMPLE_THEMES, TECHNIQUES, TECHNIQUE_BY_ID, applicable, applyAll, beatsOf, bpmOf, compare, isVaryMeter, midiOf, toMelody,
  type TechniqueId, type Theme, type Tune,
} from "./vary-model";

/** 旋律变奏：选一条主题，用几种手法变一变，把喜欢的变奏收起来，连成一首“主题与变奏”。 */

type Saved = { themeId: string; recipe: TechniqueId[]; set: TechniqueId[][] };
const STORE = "yapu-vary";
const MAX_STEPS = 3;
const MAX_SET = 5;
const GROUPS = ["装饰", "节奏", "音高"] as const;
const ORDINAL = ["一", "二", "三", "四", "五"];
const validRecipe = (value: unknown): value is TechniqueId[] => Array.isArray(value) && value.length <= MAX_STEPS && value.every((id) => TECHNIQUE_BY_ID.has(id as TechniqueId));
const recipeName = (recipe: TechniqueId[]) => recipe.map((id) => TECHNIQUE_BY_ID.get(id)!.label).join(" → ");

function readSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORE);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    if (typeof saved.themeId !== "string" || !validRecipe(saved.recipe) || !Array.isArray(saved.set)) return null;
    return { themeId: saved.themeId, recipe: saved.recipe, set: saved.set.filter(validRecipe).filter((item) => item.length).slice(0, MAX_SET) };
  } catch { return null; }
}

/** 旋律创编里存下的作品（二、三、四拍子的）也能拿来当主题。 */
function worksAsThemes(): Theme[] {
  return loadWorks().flatMap((work) => {
    const bars = work.bars.filter((bar) => bar.length).map((bar) => bar.map((note) => ({ d: note.d, o: note.o, b: note.b })));
    const meter = work.meter;
    if (!isVaryMeter(meter) || !bars.length) return [];
    if (bars.some((bar) => Math.abs(bar.reduce((sum, note) => sum + note.b, 0) - beatsOf(meter)) > 1e-6)) return [];
    return [{ id: `work:${work.id}`, title: work.title || "我的旋律", source: "我在旋律创编里写的", meter, bars }];
  });
}

export function VaryPage() {
  const [themes, setThemes] = useState<Theme[]>(SAMPLE_THEMES);
  const [themeId, setThemeId] = useState(SAMPLE_THEMES[0].id);
  const [recipe, setRecipe] = useState<TechniqueId[]>([]);
  const [set, setSet] = useState<TechniqueId[][]>([]);
  const [notation, setNotation] = useState<"jianpu" | "staff">("jianpu");
  const [message, setMessage] = useState("");
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const loaded = useRef(false);
  useEffect(() => {
    const all = [...SAMPLE_THEMES, ...worksAsThemes()];
    const saved = readSaved();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from browser storage after mount */
    setThemes(all);
    if (saved && all.some((theme) => theme.id === saved.themeId)) { setThemeId(saved.themeId); setRecipe(saved.recipe); setSet(saved.set); }
    /* eslint-enable react-hooks/set-state-in-effect */
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try { window.localStorage.setItem(STORE, JSON.stringify({ themeId, recipe, set } satisfies Saved)); } catch { /* storage may be unavailable */ }
  }, [themeId, recipe, set]);

  const stop = useCallback(() => { stopRef.current?.(); stopRef.current = null; setPlayingIndex(null); }, []);
  useEffect(() => () => { stopRef.current?.(); }, []);

  const theme = themes.find((item) => item.id === themeId) ?? themes[0];
  const variation = useMemo(() => applyAll(theme, recipe), [theme, recipe]);
  const themeMelody = useMemo(() => toMelody(theme, theme.title, theme.source), [theme]);
  const variationMelody = useMemo(() => toMelody(variation, "", "学生创编"), [variation]);
  const notes = useMemo(() => (recipe.length ? compare(theme, variation) : []), [theme, variation, recipe]);
  const inSet = set.some((item) => item.join() === recipe.join());

  const chooseTheme = (id: string) => {
    if (id === themeId) return;
    stop();
    setThemeId(id); setRecipe([]); setSet([]); setMessage("");
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
  const keep = () => {
    if (!recipe.length || inSet) return;
    if (set.length >= MAX_SET) { setMessage(`变奏曲里最多收 ${MAX_SET} 段变奏。`); return; }
    stop();
    setSet([...set, recipe]);
    setMessage("");
  };

  /** 主题和收起来的变奏一段接一段地弹，段与段之间空一小节。 */
  const playSet = async () => {
    if (playingIndex !== null) { stop(); return; }
    const pieces: Tune[] = [theme, ...set.map((item) => applyAll(theme, item))];
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
      at += beatsOf(piece.meter) * beat;
    }
    const end = at;
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

  const samples = themes.filter((item) => !item.id.startsWith("work:"));
  const works = themes.filter((item) => item.id.startsWith("work:"));

  return <section className="rhythm-lab vary-lab" aria-labelledby="vary-title">
    <header className="vary-intro">
      <div>
        <p className="vary-kicker">旋律变奏</p>
        <h2 id="vary-title">一条主题，变出几种样子</h2>
      </div>
      <p className="vary-note">选一条主题，点变奏手法，听听它变成了什么。</p>
    </header>

    <div className="vary-settings">
      <div className="vary-field">
        <span className="vary-label">主题</span>
        <div className="vary-chips" role="radiogroup" aria-label="主题">
          {samples.map((item) => <button key={item.id} type="button" role="radio" aria-checked={themeId === item.id} className={themeId === item.id ? "is-active" : ""} onClick={() => chooseTheme(item.id)}>{item.title}<small>{item.meter}</small></button>)}
        </div>
      </div>
      <label className="vary-field">
        <span className="vary-label">我的作品</span>
        {works.length
          ? <select value={themeId.startsWith("work:") ? themeId : ""} onChange={(event) => { if (event.target.value) chooseTheme(event.target.value); }}>
            <option value="">从旋律创编里选一首</option>
            {works.map((item) => <option key={item.id} value={item.id}>{item.title}（{item.meter}）</option>)}
          </select>
          : <span className="vary-empty">在旋律创编里保存作品后，可以拿到这里来变奏。</span>}
      </label>
      <div className="vary-field vary-notation">
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
          <div className="vary-player"><MelodyPlayer key={`${theme.id}-${notation}`} melody={themeMelody} notationStyle={notation} /></div>
        </article>
        <article className={`vary-card vary-card-result${recipe.length ? "" : " is-empty"}`}>
          <p className="vary-card-title"><b>变奏</b><span>{recipe.length ? `主题 → ${recipeName(recipe)}` : "还没有选手法"}</span></p>
          {recipe.length
            ? <>
              <div className="vary-player"><MelodyPlayer key={`${theme.id}-${recipe.join()}-${notation}`} melody={variationMelody} notationStyle={notation} /></div>
              <ul className="vary-compare" aria-label="和主题比一比">{notes.map((note) => <li key={note}>{note}</li>)}</ul>
              <div className="vary-actions">
                <button type="button" className="vary-primary" onClick={keep} disabled={inSet}>{inSet ? "已经收进变奏曲" : "＋ 收进我的变奏曲"}</button>
                <button type="button" onClick={() => { stop(); setRecipe([]); setMessage(""); }}>回到主题重来</button>
              </div>
            </>
            : <p className="vary-placeholder">在右边点一种变奏手法，这里就会出现变过的旋律。手法可以叠起来用，最多三种。</p>}
        </article>
      </div>

      <div className="vary-side">
        <div className="vary-palette">
          <p className="vary-label">变奏手法 · 点一下用上，再点一下去掉</p>
          {GROUPS.map((group) => <div key={group} className="vary-group">
            <span className="vary-group-name">{group}</span>
            <div className="vary-techniques">
              {TECHNIQUES.filter((item) => item.group === group).map((item) => {
                const step = recipe.indexOf(item.id);
                const blocked = step < 0 ? applicable(item.id, variation) : null;
                return <button key={item.id} type="button" aria-pressed={step >= 0} className={`vary-technique${step >= 0 ? " is-active" : ""}${blocked ? " is-blocked" : ""}`} onClick={() => toggle(item.id)}>
                  <b>{item.label}{step >= 0 && <i>第 {step + 1} 步</i>}</b>
                  <span>{blocked ?? item.caption}</span>
                </button>;
              })}
            </div>
          </div>)}
          {message && <p className="vary-message" role="status">{message}</p>}
        </div>

        <div className="vary-set">
          <p className="vary-label">我的变奏曲 · 主题加上收起来的变奏</p>
          <ol className="vary-set-list">
            <li className={playingIndex === 0 ? "is-playing" : ""}><button type="button" className="vary-set-name" onClick={() => { stop(); setRecipe([]); }}>主题</button></li>
            {set.map((item, index) => <li key={item.join()} className={playingIndex === index + 1 ? "is-playing" : ""}>
              <button type="button" className="vary-set-name" onClick={() => { stop(); setRecipe(item); }}>变奏{ORDINAL[index]}<small>{recipeName(item)}</small></button>
              <button type="button" className="vary-set-remove" aria-label={`删除变奏${ORDINAL[index]}`} onClick={() => { stop(); setSet(set.filter((_, k) => k !== index)); }}>删除</button>
            </li>)}
          </ol>
          {set.length
            ? <button type="button" className="vary-primary" onClick={() => void playSet()}>{playingIndex !== null ? "■ 停止" : "▶ 连起来听"}</button>
            : <p className="vary-empty">变出喜欢的旋律后，点“收进我的变奏曲”，就能和主题连起来听。</p>}
        </div>
      </div>
    </div>
  </section>;
}
