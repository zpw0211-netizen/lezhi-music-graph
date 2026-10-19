"use client";
// 上课模式 · 反思型课堂：动机激发 → 认知冲突 → 协同建构 → 应用迁移 → 总结升华，共 15 页（有小测验时 16 页）。
// 文字脚本来自 lib/lesson/reflective.ts；谱例、旋律、插图按本课数据有无决定是否出现，缺数据的页面自动跳过。
// 老师可在“备课”里改课型、隐藏页面、改写提问；这些只存在本机浏览器（localStorage），不影响别人。
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { MelodySet } from "./MelodyPlayer";
import type { Melody } from "../../lib/lesson/melodies";
import { WorkbenchIcon } from "../WorkbenchIcon";
import {
  LESSON_KINDS, STAGES, cultureFacts, elementFacts, lessonKindOf, reflectiveScript,
  type LessonFact, type LessonKind, type StageKey,
} from "../../lib/lesson/reflective";

type ScoreAsset = { url: string; title?: string };
type Question = { id: string; prompt: string; options: string[]; answer: string };
// art：这一页右侧的课件插画（public/art/lesson/<art>.webp，人教版由 editions/renjiao 覆盖成剪纸风格的同名图）。
type Slide = { key: string; stage: StageKey; step: string; title: string; steps: number; art?: string; render: (step: number) => ReactNode };
type Saved = { kind?: LessonKind; hidden?: string[]; edits?: Record<string, string> };

const STORAGE_PREFIX = "yapu-reflective:";
const readSaved = (workId: string): Saved => {
  try { return JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + workId) ?? "{}") as Saved; } catch { return {}; }
};
const writeSaved = (workId: string, saved: Saved) => {
  try { window.localStorage.setItem(STORAGE_PREFIX + workId, JSON.stringify(saved)); } catch { /* 私密窗口等情况下不保存，课件照常可用 */ }
};
const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
const STAGE_ORDINALS = ["第一阶段", "第二阶段", "第三阶段", "第四阶段", "全流程"];
// 备课时给老师看的“设计意图”（摘自模板教学过程各阶段），课堂上不显示。
const DESIGN_NOTES: Record<string, string> = {
  cover: "以情境激活兴趣；开课前确认本课课型与各阶段时长。",
  scene: "创设贴合课型的情境，引发审美兴趣与探究欲。",
  wonder: "汇总预习反思单中的疑问，精准把握学生的认知起点；引导学生“带着问题学习、在学习中反思”。",
  perceive: "通过针对性任务积累真实体验，为认知冲突提供基础。",
  elements: "聚焦音乐核心要素，落实审美感知。",
  conflict: "以对比、追问、质疑制造矛盾点，推动反思从“被动接受”转向“主动探究”。",
  self: "组织小组内初步交流，梳理解决冲突的思路。",
  group: "以合作探究为载体，让共同反思成为知识建构的核心过程。巡视指导，记录典型反思案例与共性问题。",
  practice: "针对难点分解练习，降低思考难度。",
  chain: "提供反思支架，引导小组围绕“冲突解决—思路碰撞—共识形成”深度交流。",
  consensus: "记录各组共识，作为下一阶段迁移的依据。",
  transfer: "分层任务让学生在新情境中运用反思成果，实现能力迁移。",
  showcase: "邀请不同层次的学生或小组展示，并简短说明反思调整过程。",
  quiz: "以小测验做即时评价，检验核心知识。",
  summary: "通过复盘与评价固化反思成果，形成完整学习闭环。",
  homework: "布置课后“反思成长档案”，把课堂反思延伸到课外。",
};

export function ReflectivePresent({
  workId, workName, workType, mode, grade, bookName, unitName, scorePage, creators, facts, melody, scores, tasks, questions, artUrl, assetUrl, onClose,
}: {
  workId: string; workName: string; workType: string; mode?: string; grade?: number; bookName?: string; unitName: string;
  scorePage: number | null; creators: Array<{ id: string; label: string; value: string }>; facts: LessonFact[];
  melody?: Melody[]; scores: ScoreAsset[]; tasks: Array<{ text: string; focus: string[] }>; questions: Question[];
  artUrl?: string; assetUrl: (path: string) => string; onClose: () => void;
}) {
  // 只在点开上课模式后渲染（浏览器端），可以直接读本机保存的备课设置。
  const [saved, setSaved] = useState<Saved>(() => readSaved(workId));
  const update = useCallback((patch: Partial<Saved>) => setSaved((current) => {
    const next = { ...current, ...patch };
    writeSaved(workId, next);
    return next;
  }), [workId]);
  const [preparing, setPreparing] = useState(false);
  const kind = saved.kind ?? lessonKindOf(mode, workType, workName);
  const script = useMemo(() => reflectiveScript({ workName, kind, grade, facts }), [facts, grade, kind, workName]);
  const elements = useMemo(() => elementFacts(facts), [facts]);
  const culture = useMemo(() => cultureFacts(facts), [facts]);

  // 可改写的文字：备课时可直接在页面上改，离开输入框即保存。
  const text = useCallback((id: string, fallback: string, as: "span" | "p" | "h2" = "span") => {
    const value = saved.edits?.[id] ?? fallback;
    const Tag = as;
    if (!preparing) return <Tag>{value}</Tag>;
    return <Tag className="reflect-editable" contentEditable suppressContentEditableWarning spellCheck={false}
      onBlur={(event) => {
        const next = event.currentTarget.textContent?.trim() ?? "";
        const edits = { ...(saved.edits ?? {}) };
        if (!next || next === fallback) delete edits[id]; else edits[id] = next;
        update({ edits });
      }}>{value}</Tag>;
  }, [preparing, saved.edits, update]);

  // 课堂互动：初听感知表的勾选、小组共识板、自评星级——只在本次上课中保留。
  const [picks, setPicks] = useState<Record<string, string[]>>({});
  const [boards, setBoards] = useState<string[]>(["", "", "", ""]);
  const [stars, setStars] = useState<Record<string, number>>({});
  const togglePick = (row: string, option: string) => setPicks((current) => {
    const list = current[row] ?? [];
    return { ...current, [row]: list.includes(option) ? list.filter((item) => item !== option) : [...list, option] };
  });

  const work = workName.startsWith("《") ? workName : `《${workName}》`;
  const primaryMelody = melody?.length ? [melody[0]] : undefined;

  const allSlides: Slide[] = [
    { key: "cover", stage: "motivate", step: "封面", title: work, steps: 1, render: () => <div className="reflect-cover">
      {artUrl && <Picture className="reflect-cover-art" src={artUrl} />}
      <div className="reflect-cover-copy">
        <small>{[bookName, unitName].filter(Boolean).join(" · ")}</small>
        <h1 style={{ "--len": work.length } as CSSProperties}>{work}</h1>
        <p className="reflect-kind">{LESSON_KINDS[kind]}<i aria-hidden="true" />反思型课堂</p>
        <div className="reflect-meta">
          {creators.map((item) => <span key={item.id}><b>{item.label}</b>{item.value}</span>)}
          {scorePage && <span><b>教材</b>第 {scorePage} 页</span>}
        </div>
      </div>
      <ol className="reflect-roadmap">{STAGES.map((stage) => <li key={stage.key} data-stage={stage.key}><b>{stage.name}</b><small>{stage.theme} · {stage.minutes} 分钟</small></li>)}</ol>
    </div> },
    { key: "scene", stage: "motivate", step: "情境导入", title: "听一听，想一想", steps: 1, render: () => <div className={`reflect-scene${artUrl ? "" : " is-plain"}`}>
      {artUrl && <figure className="reflect-scene-art"><Picture src={artUrl} /></figure>}
      <div className="reflect-scene-copy">
        <h2>听一听，想一想</h2>
        {text("scene", script.scene, "p")}
        {culture.length > 0 && <dl className="reflect-facts">{culture.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
        {primaryMelody && <div className="reflect-listen"><MelodySet melodies={primaryMelody} large /></div>}
      </div>
    </div> },
    { key: "wonder", stage: "motivate", step: "预习反馈", title: "带着问题来学习", steps: 1, art: "wonder-wall", render: () => <div className="reflect-wonder">
      <h2>带着问题来学习</h2>
      <p className="reflect-lead">通过预习或刚才的聆听，你最想探究什么？把问题写在便签上，贴到问题墙。</p>
      <ul className="reflect-notes">{script.questionStarters.map((starter, index) => <li key={starter} style={{ "--i": index } as CSSProperties}>{text(`starter-${index}`, starter)}</li>)}</ul>
    </div> },
    { key: "perceive", stage: "conflict", step: "核心感知", title: "初听感知表", steps: 1, art: "stage-motivate", render: () => <div className="reflect-wide">
      <h2>初听感知表</h2>
      {text("perceive", script.perceive.task, "p")}
      <table className="reflect-table"><tbody>{script.perceive.rows.map((row) => <tr key={row.label}>
        <th>{row.label}</th>
        <td>{row.options.map((option) => <button key={option} type="button" aria-pressed={(picks[row.label] ?? []).includes(option)} onClick={() => togglePick(row.label, option)}>{option}</button>)}</td>
      </tr>)}</tbody></table>
      {primaryMelody && <div className="reflect-listen"><MelodySet melodies={primaryMelody} large /></div>}
    </div> },
    ...(scores.length || elements.length ? [{ key: "elements", stage: "conflict" as StageKey, step: "核心感知", title: "看谱 · 找要素", steps: Math.max(1, scores.length), render: (step: number) => <div className="reflect-two is-score">
      {scores.length > 0 && <figure className="reflect-score">
        <Picture src={assetUrl(scores[step].url)} alt={scores[step].title ?? "教材谱例"} />
        {scores.length > 1 && <figcaption>谱例 {step + 1} / {scores.length}</figcaption>}
      </figure>}
      <div>
        <h2>看谱 · 找要素</h2>
        {elements.length > 0
          ? <dl className="reflect-facts is-elements">{elements.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
          : <p className="reflect-lead">在谱例中找一找：调号、拍号、速度和最有特点的节奏。</p>}
      </div>
    </div> }] : []),
    { key: "conflict", stage: "conflict", step: "矛盾触发", title: "想一想：为什么？", steps: script.conflicts.length, art: "stage-conflict", render: (step) => <div className="reflect-wide">
      <h2>想一想：为什么？</h2>
      <ol className="reflect-questions">{script.conflicts.map((question, index) => <li key={index} className={index <= step ? "is-shown" : ""}>{text(`conflict-${index}`, question)}</li>)}</ol>
    </div> },
    { key: "self", stage: "conflict", step: "自主反思 · 小组交流", title: "自主反思", steps: 1, render: () => <div className="reflect-wide">
      <h2>自主反思</h2>
      <ol className="reflect-questions is-all">{script.selfReflect.map((question, index) => <li key={index} className="is-shown">{text(`self-${index}`, question)}</li>)}</ol>
      <Countdown seconds={120} label="小组交流" />
    </div> },
    { key: "group", stage: "construct", step: "合作探究", title: "小组任务", steps: 1, art: "group-roles", render: () => <div className="reflect-wide">
      <h2>小组任务</h2>
      {text("group", script.groupTask, "p")}
      <ul className="reflect-roles">{script.roles.map((role, index) => <li key={role.role}><b>{text(`role-${index}`, role.role)}</b><small>{text(`duty-${index}`, role.duty)}</small></li>)}</ul>
      {tasks.length > 0 && <div className="reflect-textbook"><b>教材里的活动</b><ul>{tasks.map((task) => <li key={task.text}>{task.text}{task.focus.length > 0 && <small>练习重点：{task.focus.join("、")}</small>}</li>)}</ul></div>}
    </div> },
    ...(melody?.length || scores.length ? [{ key: "practice", stage: "construct" as StageKey, step: "难点突破", title: "难点突破", steps: 1, render: () => <div className="reflect-wide is-practice">
      <h2>难点突破</h2>
      {text("practice", script.practiceTip, "p")}
      {melody?.length
        ? <MelodySet melodies={melody} large />
        : <Picture className="reflect-score-only" src={assetUrl(scores[0].url)} alt={scores[0].title ?? "教材谱例"} />}
    </div> }] : []),
    { key: "chain", stage: "construct", step: "共同反思问题链", title: "共同反思", steps: script.chain.length, art: "stage-construct", render: (step) => <div className="reflect-wide">
      <h2>共同反思</h2>
      <ol className="reflect-chain">{script.chain.map((question, index) => <li key={index} className={index <= step ? "is-shown" : ""}>{text(`chain-${index}`, question)}</li>)}</ol>
    </div> },
    { key: "consensus", stage: "construct", step: "共识形成", title: "我们的共识", steps: 1, render: () => <div className="reflect-wide">
      <h2>我们的共识</h2>
      <div className="reflect-boards">{boards.map((value, index) => <label key={index}>
        <span>第 {index + 1} 组</span>
        <textarea value={value} placeholder="记下小组的结论或改进办法" onChange={(event) => setBoards((current) => current.map((item, k) => (k === index ? event.target.value : item)))} />
      </label>)}</div>
    </div> },
    { key: "transfer", stage: "transfer", step: "实践运用 · 迁移创新", title: "挑战任务", steps: 1, art: "stage-transfer", render: () => <div className="reflect-wide">
      <h2>挑战任务</h2>
      <p className="reflect-lead">选一个适合自己的挑战，把刚才的反思用起来。</p>
      <ol className="reflect-tiers">{script.transfer.map((tier, index) => <li key={tier.level} data-level={index}><b>{tier.level}</b>{text(`transfer-${index}`, tier.task)}</li>)}</ol>
    </div> },
    { key: "showcase", stage: "transfer", step: "成果展示 · 自我反思", title: "展示与自评", steps: 1, render: () => <div className="reflect-two is-even">
      <section className="reflect-panel">
        <h2>展示时说一说</h2>
        <ul className="reflect-starters">{script.showcase.map((question, index) => <li key={index}>{text(`show-${index}`, question)}</li>)}</ul>
      </section>
      <section className="reflect-panel">
        <h2>自评</h2>
        <ul className="reflect-stars">{script.selfCheck.map((criterion) => <li key={criterion}><span>{criterion}</span>
          <span role="radiogroup" aria-label={criterion}>{[1, 2, 3].map((value) => <button key={value} type="button" role="radio" aria-checked={stars[criterion] === value} aria-label={`${value} 颗星`} className={(stars[criterion] ?? 0) >= value ? "is-on" : ""} onClick={() => setStars((current) => ({ ...current, [criterion]: value }))}>★</button>)}</span>
        </li>)}</ul>
      </section>
    </div> },
    ...(questions.length ? [{ key: "quiz", stage: "summary" as StageKey, step: "多元评价", title: "小测验", steps: 2, render: (step: number) => <div className="reflect-wide">
      <h2>小测验</h2>
      <ol className="reflect-quiz">{questions.map((question) => <li key={question.id}><p>{question.prompt}</p>
        <div>{question.options.map((option, k) => <span key={option} className={step >= 1 ? (option === question.answer ? "is-answer" : "is-other") : ""}><em>{"ABCD"[k]}</em>{option}</span>)}</div>
      </li>)}</ol>
    </div> }] : []),
    { key: "summary", stage: "summary", step: "多元评价 · 复盘梳理", title: "回顾这节课", steps: 1, art: "stage-summary", render: () => <div className="reflect-wide">
      <h2>回顾这节课</h2>
      <ol className="reflect-roadmap is-done">{STAGES.slice(0, 4).map((stage) => <li key={stage.key} data-stage={stage.key}><b>{stage.name}</b><small>{stage.theme}</small></li>)}</ol>
      <ul className="reflect-starters">{script.wrapUp.map((question, index) => <li key={index}>{text(`wrap-${index}`, question)}</li>)}</ul>
    </div> },
    { key: "homework", stage: "summary", step: "反思成长档案", title: "课后任务", steps: 1, art: "homework", render: () => <div className="reflect-wide is-homework">
      <h2>课后任务</h2>
      {text("homework", script.homework, "p")}
    </div> },
  ];

  const hidden = useMemo(() => new Set(saved.hidden ?? []), [saved.hidden]);
  const slides = preparing ? allSlides : allSlides.filter((slide) => !hidden.has(slide.key));
  const [position, setPosition] = useState({ slide: 0, step: 0 });
  const countsKey = slides.map((item) => `${item.key}:${item.steps}`).join(",");
  const counts = useMemo(() => countsKey.split(",").map((item) => Number(item.split(":")[1])), [countsKey]);
  const forward = useCallback(() => setPosition(({ slide, step }) => step + 1 < counts[slide] ? { slide, step: step + 1 } : slide + 1 < counts.length ? { slide: slide + 1, step: 0 } : { slide, step }), [counts]);
  const back = useCallback(() => setPosition(({ slide, step }) => step > 0 ? { slide, step: step - 1 } : slide > 0 ? { slide: slide - 1, step: counts[slide - 1] - 1 } : { slide, step }), [counts]);
  const goTo = useCallback((index: number) => setPosition({ slide: index, step: 0 }), []);

  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const togglePlayback = useCallback(() => { stageRef.current?.querySelector<HTMLButtonElement>(".melody-play")?.click(); }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("textarea, input, [contenteditable=true]")) { if (event.key === "Escape") target.blur(); return; }
      const onWidget = Boolean(target?.closest("button, select, a, summary"));
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      else if (["ArrowRight", "PageDown"].includes(event.key)) { event.preventDefault(); forward(); }
      else if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); back(); }
      else if (event.key === " " && !onWidget) { event.preventDefault(); togglePlayback(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back, forward, togglePlayback]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      if (document.fullscreenElement) void document.exitFullscreen?.();
    };
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { dialogRef.current?.focus(); }, []);

  // 备课里隐藏页面后页数会变少，当前位置按新页数收拢。
  const current = Math.min(position.slide, slides.length - 1);
  const slide = slides[current];
  const stageIndex = STAGES.findIndex((stage) => stage.key === slide.stage);
  const stage = STAGES[stageIndex];


  // 内容自适应：高于舞台时等比缩小（下限 0.5），仍放不下则由舞台滚动。
  const fitRef = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState(1);
  const appliedFit = useRef(1);
  const slideKey = slide.key;
  const step = position.step;
  useLayoutEffect(() => {
    const stageEl = stageRef.current, content = fitRef.current;
    if (!stageEl || !content) return;
    let raf = 0;
    const measure = () => {
      const style = getComputedStyle(stageEl);
      const avail = stageEl.clientHeight - parseFloat(style.paddingTop || "0") - parseFloat(style.paddingBottom || "0");
      if (!(avail > 0)) return;
      const rect = content.getBoundingClientRect();
      const current = appliedFit.current;
      const natural = current < 1 ? rect.height / current : rect.height;
      if (!(natural > 0)) return;
      const target = Math.max(0.5, Math.min(1, (avail - 12) / natural));
      if (Math.abs(target - current) > 0.01) { appliedFit.current = target; setFit(target); }
    };
    measure();
    const observer = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); });
    observer.observe(content);
    observer.observe(stageEl);
    return () => { observer.disconnect(); cancelAnimationFrame(raf); };
  }, [slideKey, step, preparing]);

  // 难点突破页的谱面在框内滚动：播放时把正在唱的音保持在可见范围里。
  useEffect(() => {
    if (slideKey !== "practice" || !stageRef.current) return;
    const root = stageRef.current;
    const follow = () => {
      const note = root.querySelector<HTMLElement>(".melody-score .is-active");
      const box = note?.closest<HTMLElement>(".melody-score");
      if (!note || !box || box.scrollHeight <= box.clientHeight) return;
      const top = note.getBoundingClientRect().top - box.getBoundingClientRect().top;
      if (top < 0 || top > box.clientHeight - 60) box.scrollTop += top - box.clientHeight / 3;
    };
    const observer = new MutationObserver(follow);
    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [slideKey]);

  const isHidden = hidden.has(slide.key);
  const toggleHidden = () => update({ hidden: isHidden ? [...hidden].filter((key) => key !== slide.key) : [...hidden, slide.key] });

  return <div ref={dialogRef} className="present reflect" data-stage={slide.stage} data-slide={slide.key} role="dialog" aria-modal="true" aria-label="上课模式 · 反思型课堂" tabIndex={-1}
    style={artUrl ? { "--art": `url("${artUrl}")` } as CSSProperties : undefined}>
    <header className="reflect-band">
      <span className="reflect-band-stage"><em>{STAGE_ORDINALS[stageIndex]}</em>{stage.name} · {stage.theme}</span>
      <span className="reflect-band-step">{slide.step}</span>
      <ol className="reflect-band-progress" aria-hidden="true">{STAGES.map((item, index) => <li key={item.key} data-stage={item.key} className={index < stageIndex ? "is-past" : index === stageIndex ? "is-now" : ""} style={{ flexGrow: item.minutes }} />)}</ol>
      <StageTimer key={slide.stage} minutes={stage.minutes} />
    </header>
    {preparing && <div className="reflect-prep">
      <div className="reflect-prep-tools">
        <label>课型
          <select value={kind} onChange={(event) => update({ kind: event.target.value as LessonKind })}>
            {(Object.keys(LESSON_KINDS) as LessonKind[]).map((key) => <option key={key} value={key}>{LESSON_KINDS[key]}</option>)}
          </select>
        </label>
        <button type="button" aria-pressed={isHidden} onClick={toggleHidden}>{isHidden ? "上课时显示这一页" : "上课时隐藏这一页"}</button>
        {saved.edits && Object.keys(saved.edits).length > 0 && <button type="button" onClick={() => update({ edits: {} })}>恢复默认文字</button>}
        <span>虚线框里的文字可以直接改写，只保存在这台电脑上。</span>
      </div>
      <aside className="reflect-teacher" aria-label="教师提示（课堂上不显示）">
        <p><b>设计意图</b>{DESIGN_NOTES[slide.key]}</p>
        {(slide.key === "cover" || slide.key === "wonder") && <div className="reflect-teacher-goals"><b>教学目标</b>
          <ul>{script.goals.map((goal, index) => <li key={goal.area}><em>{goal.area}</em>{text(`goal-${index}`, goal.text)}</li>)}</ul>
        </div>}
      </aside>
    </div>}
    <div className={`present-stage${preparing && isHidden ? " is-muted" : ""}${slide.art ? " has-art" : ""}`} key={`${slide.key}-${kind}`} ref={stageRef}>
      {slide.art && <Picture className="reflect-art" src={assetUrl(`art/lesson/${slide.art}.webp`)} art={slide.art} />}
      <div className="present-fit" ref={fitRef} style={fit === 1 ? undefined : { zoom: fit }}>{slide.render(Math.min(position.step, slide.steps - 1))}</div>
    </div>
    <footer className="present-bar">
      <span>{work} · {LESSON_KINDS[kind]}</span>
      <nav className="reflect-dots" aria-label="页面">{slides.map((item, index) => <button key={item.key} type="button" data-stage={item.stage}
        className={`${index === current ? "active" : ""}${hidden.has(item.key) ? " is-hidden" : ""}`} aria-label={`第 ${index + 1} 页 ${item.title}`} aria-current={index === current ? "step" : undefined}
        style={{ "--i": index } as CSSProperties} onClick={() => goTo(index)} />)}</nav>
      <div className="present-nav">
        <button type="button" aria-pressed={preparing} onClick={() => setPreparing((value) => !value)}>{preparing ? "完成备课" : "备课"}</button>
        {canFullscreen && <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? "退出全屏" : "进入全屏"}>{isFullscreen ? "取消全屏" : "全屏"}</button>}
        <button type="button" onClick={back} aria-label="上一段"><WorkbenchIcon name="left" /><span>上一段</span></button>
        <button type="button" onClick={forward} aria-label="下一段"><WorkbenchIcon name="right" /><span>下一段</span></button>
        <button type="button" onClick={onClose}>退出</button>
      </div>
    </footer>
  </div>;
}

// 课件插图与谱例都是静态导出的现成图片，不经过 next/image。
function Picture({ src, alt = "", className, art }: { src: string; alt?: string; className?: string; art?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} alt={alt} data-art={art} />;
}

// 本阶段计时：换阶段时组件重建，从 0 开始，对照模板建议时长；超时变色提醒。
function StageTimer({ minutes }: { minutes: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <span className={`reflect-band-timer${elapsed > minutes * 60 ? " is-over" : ""}`} title="本阶段已用时间 / 建议时长">{clock(elapsed)} / {minutes} 分钟</span>;
}

function Countdown({ seconds, label }: { seconds: number; label: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left == null || left <= 0) return;
    const timer = window.setTimeout(() => setLeft((value) => (value == null ? null : value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [left]);
  return <div className={`reflect-countdown${left === 0 ? " is-done" : ""}`}>
    <button type="button" onClick={() => setLeft(left == null || left === 0 ? seconds : null)}>{left == null ? `开始${label}` : left === 0 ? "时间到 · 再来一次" : "停止"}</button>
    <b aria-live="polite">{clock(left ?? seconds)}</b>
  </div>;
}
