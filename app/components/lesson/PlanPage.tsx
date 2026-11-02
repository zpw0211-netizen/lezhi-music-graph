"use client";
import { useMemo, useState, type FormEvent } from "react";
import { melodiesFor } from "../../lib/lesson/melodies";
import { buildPlan, checkPlan, fitMinutes, parseRequest, planText, type LessonPlan, type PlanIssue, type PlanResource } from "../../lib/lesson/plan";
import { LESSON_KINDS, lessonKindOf, type LessonFact, type LessonKind } from "../../lib/lesson/reflective";
import type { Melody } from "../../lib/lesson/jianpu";
import { getScoreMedia } from "../../lib/app/unit-data";
import { EDITION } from "../../lib/app/books";
import { bareWorkName, type BookDirectory, type CanonicalGraph, type Entity } from "../../lib/app/types";
import { STANDARD } from "../../lib/lesson/curriculum";
import { MelodySet } from "./MelodyPlayer";
import { WorkbenchIcon } from "../WorkbenchIcon";

type Relation = { id: string; subject: string; predicate: string; label?: string; objectId?: string | null; literal?: string | null; provenance?: boolean; extended?: boolean };
type Options = { kind?: LessonKind; minutes?: number; className?: string; note?: string };
type Context = { workName: string; facts: LessonFact[]; melodies: Melody[]; scoreUrls: string[]; related: string[]; defaultKind: LessonKind; grade?: number };
const KINDS = Object.keys(LESSON_KINDS) as LessonKind[];
const MINUTES = [20, 30, 40, 45];
const EXAMPLE = "明天给八（3）班上《菊花台》，歌唱课，40 分钟。班里男生多在变声期，重点让他们敢开口。";
const storageKey = (book: string, work: string) => `yapu-plan:${book}:${work}`;
const readPlan = (book: string, work: string): LessonPlan | null => {
  try { const raw = window.localStorage.getItem(storageKey(book, work)); return raw ? JSON.parse(raw) as LessonPlan : null; } catch { return null; }
};
const writePlan = (book: string, plan: LessonPlan) => {
  try { window.localStorage.setItem(storageKey(book, bareWorkName(plan.workName)), JSON.stringify(plan)); } catch { /* storage may be unavailable */ }
};
const melodyBook = (key: string) => (EDITION.notation === "staff" ? `wx-${key}` : key);

/** 智能备课：一句话或几个选项 → 一节常规课教案，资源可直接播放，教案检查随改随查。 */
export function PlanPage({ graph, books, bookKey: routeBook, work: routeWork, assetUrl, onRoute, onOpenLesson }: {
  graph: CanonicalGraph;
  books: BookDirectory[];
  bookKey?: string;
  work?: string;
  assetUrl: (path: string) => string;
  /** 课题或分册变了，同步到地址栏。 */
  onRoute: (bookKey: string, work?: string) => void;
  onOpenLesson: (work: string, bookKey: string) => void;
}) {
  const relations = graph.relationships as unknown as Relation[];
  const entityMap = useMemo(() => new Map(graph.entities.map((entity) => [entity.id, entity])), [graph.entities]);
  const bookKey = books.some((book) => book.key === routeBook) ? routeBook! : books.find((book) => /(^|-)g8s1$/.test(book.key))?.key ?? books[0]?.key ?? "g8s1";

  // 本册能备课的作品：目录里列出的课（有教材栏目），或有旋律数据的作品。
  const listed = useMemo(() => new Set(relations.filter((relation) => relation.predicate === "学习方式").map((relation) => relation.subject)), [relations]);
  const lessonsOf = (key: string) => graph.entities
    .filter((entity) => entity.name.startsWith("《") && entity.bookKeys?.includes(key) && (listed.has(entity.id) || melodiesFor(melodyBook(key), entity.name).length > 0))
    .sort((a, b) => (a.firstPageByBook?.[key] ?? 999) - (b.firstPageByBook?.[key] ?? 999));
  const lessons = lessonsOf(bookKey);
  const work: Entity | undefined = lessons.find((entity) => bareWorkName(entity.name) === routeWork);

  const [request, setRequest] = useState("");
  const [message, setMessage] = useState("");
  // 一句话里读出的要求；换一次要求就重新挂载教案（token 变化），新课的数据就位后立即生成。
  const [asked, setAsked] = useState<{ token: number; options: Options | null }>({ token: 0, options: null });

  const context = useMemo<Context | null>(() => {
    if (!work) return null;
    const valueOf = (relation: Relation) => relation.literal ?? entityMap.get(relation.objectId ?? "")?.name ?? "";
    const own = relations.filter((relation) => relation.subject === work.id && !relation.provenance && !relation.extended);
    const mode = own.find((relation) => relation.predicate === "学习方式");
    // 相关作品：与本课共享作曲家、体裁、民族、风格等知识点的其他课。
    const linked = new Set(own.filter((relation) => relation.objectId && !entityMap.get(relation.objectId)?.name.startsWith("《")).map((relation) => relation.objectId!));
    const related = [...new Set(relations
      .filter((relation) => relation.objectId && linked.has(relation.objectId) && relation.subject !== work.id && !relation.provenance)
      .map((relation) => entityMap.get(relation.subject))
      .filter((entity): entity is Entity => Boolean(entity?.name.startsWith("《") && entity.bookKeys?.length))
      .map((entity) => entity.name))].slice(0, 3);
    return {
      workName: work.name,
      facts: own.map((relation) => ({ label: relation.label ?? relation.predicate, value: valueOf(relation) })),
      melodies: melodiesFor(melodyBook(bookKey), work.name),
      scoreUrls: getScoreMedia(work.media).map((asset) => asset.url),
      related,
      defaultKind: lessonKindOf(mode ? valueOf(mode) : undefined, work.type, work.name),
      grade: Number(bookKey.match(/g(\d)s\d/)?.[1]) || undefined,
    };
  }, [bookKey, entityMap, relations, work]);

  const submitRequest = (event: FormEvent) => {
    event.preventDefault();
    const text = request.trim();
    if (!text) return;
    // 先在本册找课题，找不到再看其他分册。
    let parsed = parseRequest(text, lessons.map((entity) => entity.name));
    let targetBook = bookKey;
    for (const book of books) {
      if (parsed.work) break;
      const found = parseRequest(text, lessonsOf(book.key).map((entity) => entity.name));
      if (found.work) { parsed = found; targetBook = book.key; }
    }
    if (!parsed.work) { setMessage("没有在教材里找到这句话提到的课题，请在下面选择课题。"); return; }
    setMessage("");
    setAsked((current) => ({ token: current.token + 1, options: { kind: parsed.kind, minutes: parsed.minutes, className: parsed.className ?? "", note: parsed.note ?? "" } }));
    onRoute(targetBook, bareWorkName(parsed.work));
  };

  return <section className="lesson plan" aria-labelledby="plan-title">
    <header className="plan-hero">
      <p className="plan-kicker">教师端 · 样板</p>
      <h1 id="plan-title">智能备课</h1>
      <p>说一句你要上什么课、班里什么情况，芽谱用本课的旋律、范唱、谱例和节奏练习排出一节课。教案里的音乐资源都来自已核对的教材数据，生成后可以逐句修改，教案检查会随改随查。</p>
    </header>

    <form className="plan-request" onSubmit={submitRequest}>
      <label htmlFor="plan-request">用一句话说要求</label>
      <div className="plan-request-row">
        <textarea id="plan-request" rows={2} value={request} placeholder={EXAMPLE} onChange={(event) => setRequest(event.target.value)} />
        <button type="submit" className="plan-primary">生成教案</button>
      </div>
      {!request && <button type="button" className="plan-link" onClick={() => setRequest(EXAMPLE)}>填入示例</button>}
      {message && <p className="plan-message" role="status">{message}</p>}
    </form>

    <div className="plan-options">
      <label>分册
        <select id="plan-book" value={bookKey} onChange={(event) => { setAsked((current) => ({ token: current.token, options: null })); onRoute(event.target.value); }}>
          {books.map((book) => <option key={book.key} value={book.key}>{book.title}</option>)}
        </select>
      </label>
      <label>课题
        <select id="plan-work" value={work ? bareWorkName(work.name) : ""} onChange={(event) => { setAsked((current) => ({ token: current.token, options: null })); onRoute(bookKey, event.target.value || undefined); }}>
          <option value="">选择课题</option>
          {lessons.map((entity) => <option key={entity.id} value={bareWorkName(entity.name)}>{entity.name}</option>)}
        </select>
      </label>
    </div>

    {!work && <p className="plan-empty">先在上面说一句要求，或者选一个课题。</p>}
    {work && context && <PlanEditor key={`${bookKey}:${work.id}:${asked.token}`} bookKey={bookKey} context={context} asked={asked.options}
      assetUrl={assetUrl} books={books} graph={graph} onOpenLesson={onOpenLesson} />}
  </section>;
}

function PlanEditor({ bookKey, context, asked, assetUrl, books, graph, onOpenLesson }: {
  bookKey: string; context: Context; asked: Options | null; assetUrl: (path: string) => string;
  books: BookDirectory[]; graph: CanonicalGraph; onOpenLesson: (work: string, bookKey: string) => void;
}) {
  const make = (options: Options) => buildPlan({
    workName: context.workName, grade: context.grade, facts: context.facts, melodies: context.melodies, scoreUrls: context.scoreUrls, related: context.related,
    kind: options.kind ?? context.defaultKind, minutes: options.minutes ?? 40, className: options.className || undefined, note: options.note || undefined,
  });
  // 一句话带来的要求立即生成；否则读这一课上次保存的教案。
  const [plan, setPlan] = useState<LessonPlan | null>(() => {
    if (!asked) return readPlan(bookKey, bareWorkName(context.workName));
    const fresh = make(asked);
    writePlan(bookKey, fresh);
    return fresh;
  });
  const [options, setOptions] = useState<Required<Options>>(() => ({
    kind: plan?.kind ?? context.defaultKind, minutes: plan?.minutes ?? 40, className: plan?.className ?? "", note: plan?.classNote ?? "",
  }));
  const [open, setOpen] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const update = (next: LessonPlan) => { setPlan(next); writePlan(bookKey, next); };
  const generate = () => { update(make(options)); setOpen(null); };
  const issues = useMemo(() => (plan ? checkPlan(plan) : []), [plan]);
  const goalIssues = (index: number) => issues.filter((issue) => "goal" in issue.where && issue.where.goal === index);
  const stageIssues = (key: string) => issues.filter((issue) => "stage" in issue.where && issue.where.stage === key);
  const fixes = issues.filter((issue) => issue.level === "fix").length;

  const copy = async () => {
    if (!plan) return;
    try { await navigator.clipboard.writeText(planText(plan)); setMessage("教案已复制，可以粘贴到 Word 或备课本。"); }
    catch { setMessage("浏览器不允许复制，请手动选择教案文字。"); }
  };

  const resource = (res: PlanResource, key: string) => {
    if (res.kind === "score") return <a key={key} className="plan-chip" href={assetUrl(res.url)} target="_blank" rel="noreferrer"><WorkbenchIcon name="expand" />{res.label}</a>;
    if (res.kind === "rhythm") return <a key={key} className="plan-chip" href="#/rhythm"><WorkbenchIcon name="right" />{res.label}</a>;
    if (res.kind === "work") {
      const book = books.find((item) => graph.entities.some((entity) => entity.name === res.work && entity.bookKeys?.includes(item.key)))?.key ?? bookKey;
      return <button key={key} type="button" className="plan-chip" onClick={() => onOpenLesson(bareWorkName(res.work), book)}><WorkbenchIcon name="right" />{res.label}</button>;
    }
    return <button key={key} type="button" className={`plan-chip${open === key ? " is-open" : ""}`} aria-expanded={open === key} onClick={() => setOpen(open === key ? null : key)}><WorkbenchIcon name="music" />{res.label}</button>;
  };
  const issueList = (list: PlanIssue[], goal?: number) => list.length ? <ul className="plan-issues">{list.map((issue, i) => <li key={i} className={`is-${issue.level}`}>
    <span>{issue.text}</span>
    {issue.suggestion && goal !== undefined && plan && <button type="button" onClick={() => update({ ...plan, goals: plan.goals.map((item, k) => (k === goal ? { ...item, text: issue.suggestion! } : item)) })}>按建议改</button>}
  </li>)}</ul> : null;
  const work = bareWorkName(context.workName);

  return <>
    <div className="plan-options plan-settings">
      <label>课型
        <select id="plan-kind" value={options.kind} onChange={(event) => setOptions({ ...options, kind: event.target.value as LessonKind })}>
          {KINDS.map((item) => <option key={item} value={item}>{LESSON_KINDS[item]}</option>)}
        </select>
      </label>
      <label>课时
        <select id="plan-minutes" value={options.minutes} onChange={(event) => setOptions({ ...options, minutes: Number(event.target.value) })}>
          {MINUTES.map((item) => <option key={item} value={item}>{item} 分钟</option>)}
        </select>
      </label>
      <label>班级
        <input id="plan-class" value={options.className} placeholder="如 八（3）班" onChange={(event) => setOptions({ ...options, className: event.target.value })} />
      </label>
      <label className="plan-note">班级情况
        <input id="plan-note" value={options.note} placeholder="如 男生多在变声期；节奏不稳；不敢开口" onChange={(event) => setOptions({ ...options, note: event.target.value })} />
      </label>
      <button type="button" className="plan-primary" onClick={generate}>{plan ? "按选项重新生成" : "生成教案"}</button>
    </div>
    {message && <p className="plan-message" role="status">{message}</p>}
    {!plan && <p className="plan-empty">已选《{work}》。点“生成教案”开始。</p>}

    {plan && <article className="plan-doc">
      <div className="plan-doc-head">
        <div>
          <h2>{plan.workName}</h2>
          <p>{LESSON_KINDS[plan.kind]} · {plan.minutes} 分钟{plan.className ? ` · ${plan.className}` : ""}{plan.classNote ? ` · ${plan.classNote}` : ""}</p>
          {plan.standard && <p className="plan-standard">课标依据：{plan.standard.band} · 学习任务“{plan.standard.task}”（{STANDARD}第 {plan.standard.page} 页）</p>}
        </div>
        <div className="plan-doc-actions">
          <span className={`plan-check ${fixes ? "is-fix" : "is-ok"}`}>{fixes ? `教案检查：${fixes} 处需要改` : "教案检查：通过"}</span>
          <button type="button" onClick={copy}>复制教案</button>
          <button type="button" onClick={() => onOpenLesson(work, bookKey)}>打开这一课 · 上课模式</button>
        </div>
      </div>
      {issueList(issues.filter((issue) => "plan" in issue.where))}

      <section className="plan-goals">
        <h3>教学目标</h3>
        <ol>{plan.goals.map((goal, index) => <li key={goal.area}>
          <b>{goal.area}</b>
          <textarea aria-label={`${goal.area}目标`} rows={2} value={goal.text} onChange={(event) => update({ ...plan, goals: plan.goals.map((item, k) => (k === index ? { ...item, text: event.target.value } : item)) })} />
          {issueList(goalIssues(index), index)}
        </li>)}</ol>
        <dl className="plan-focus"><div><dt>教学重点</dt><dd>{plan.focus.key}</dd></div><div><dt>教学难点</dt><dd>{plan.focus.hard}</dd></div></dl>
      </section>

      <section className="plan-stages">
        <h3>教学过程</h3>
        <div className="plan-timeline" aria-hidden="true">{plan.stages.map((stage) => <span key={stage.key} data-stage={stage.key} style={{ flexGrow: stage.minutes }}>{stage.name}<small>{stage.minutes}′</small></span>)}</div>
        {plan.stages.map((stage, s) => <section key={stage.key} className="plan-stage" data-stage={stage.key}>
          <header>
            <h4>{stage.name}<small>{stage.theme}</small></h4>
            <label className="plan-minutes-input"><input type="number" min={1} max={60} value={stage.minutes} aria-label={`${stage.name}时长`}
              onChange={(event) => update({ ...plan, stages: plan.stages.map((item, k) => (k === s ? { ...item, minutes: Math.max(0, Number(event.target.value) || 0) } : item)) })} />分钟</label>
          </header>
          <ol>{stage.activities.map((item, a) => <li key={item.id} className={item.added ? "is-added" : ""}>
            {item.added && <span className="plan-tag">按班级情况</span>}
            <textarea aria-label={`${stage.name}活动 ${a + 1}`} rows={Math.min(6, Math.max(2, Math.ceil(item.text.length / 46)))} value={item.text}
              onChange={(event) => update({ ...plan, stages: plan.stages.map((st, k) => (k === s ? { ...st, activities: st.activities.map((it, j) => (j === a ? { ...it, text: event.target.value } : it)) } : st)) })} />
            {item.resources.length > 0 && <div className="plan-chips">{item.resources.map((res, r) => resource(res, `${item.id}-${r}`))}</div>}
            {item.resources.map((res, r) => (res.kind === "melody" || res.kind === "follow") && open === `${item.id}-${r}` && context.melodies.length
              ? <div key={r} className="plan-player"><MelodySet melodies={context.melodies} notationStyle={EDITION.notation ?? "jianpu"} /></div> : null)}
            <button type="button" className="plan-remove" aria-label="删除这条活动" onClick={() => update({ ...plan, stages: plan.stages.map((st, k) => (k === s ? { ...st, activities: st.activities.filter((_, j) => j !== a) } : st)) })}><WorkbenchIcon name="close" /></button>
          </li>)}</ol>
          <button type="button" className="plan-link" onClick={() => update({ ...plan, stages: plan.stages.map((st, k) => (k === s ? { ...st, activities: [...st.activities, { id: `n${Date.now()}`, text: "", resources: [] }] } : st)) })}>＋ 加一条活动</button>
          {issueList(stageIssues(stage.key))}
        </section>)}
        <p className="plan-sum">合计 {plan.stages.reduce((sum, stage) => sum + stage.minutes, 0)} / {plan.minutes} 分钟
          <button type="button" className="plan-link" onClick={() => update({ ...plan, ...fitMinutes(plan.stages, plan.minutes) })}>按比例对齐课时</button></p>
      </section>

      <section className="plan-homework"><h3>作业</h3><p>{plan.homework}</p></section>
    </article>}
  </>;
}
