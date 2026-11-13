"use client";
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { melodiesFor } from "../../lib/lesson/melodies";
import { buildPlan, checkPlan, fitMinutes, planText, resolvePlanRequest, type LessonPlan, type PlanIssue, type PlanResource } from "../../lib/lesson/plan";
import { applyBackup, collectBackup, planDocx, planPrintHtml, readBackup, saveFile } from "../../lib/lesson/plan-export";
import { LESSON_KINDS, lessonKindOf, type LessonFact, type LessonKind } from "../../lib/lesson/reflective";
import type { Melody } from "../../lib/lesson/jianpu";
import { getScoreMedia, matchesBookScope } from "../../lib/app/unit-data";
import { EDITION } from "../../lib/app/books";
import { bareWorkName, type BookDirectory, type CanonicalGraph, type Entity } from "../../lib/app/types";
import { STANDARD } from "../../lib/lesson/curriculum";
import { MelodySet } from "./MelodyPlayer";
import { WorkbenchIcon } from "../WorkbenchIcon";

type Relation = { id: string; subject: string; predicate: string; label?: string; objectId?: string | null; literal?: string | null; provenance?: boolean; extended?: boolean; bookKeys?: string[] };
type Options = { kind?: LessonKind; minutes?: number; className?: string; note?: string };
type Context = { workName: string; facts: LessonFact[]; melodies: Melody[]; scoreUrls: string[]; related: string[]; defaultKind: LessonKind; grade?: number };
const KINDS = Object.keys(LESSON_KINDS) as LessonKind[];
const MINUTES = [20, 30, 40, 45];
const EXAMPLE = "明天给八（3）班上《菊花台》，歌唱课，40 分钟。班里男生多在变声期，重点让他们敢开口。";
/** 还没选课题时，先说清一份详案里有什么。 */
const GAINS: [string, string][] = [
  ["分析和目标", "教材分析、学情分析、教学目标和重点难点，按课型和班级情况写出来。"],
  ["每一步怎么上", "每一步的师生活动和设计意图，本课的旋律、范唱、谱例和节奏练习点开就能用。"],
  ["板书、作业和课件", "步骤和上课模式的课件一一对应，教案可以导出 Word、打印或复制。"],
];
const OUTLINE: [string, string][] = [["analysis", "教材与学情分析"], ["goals", "教学目标"], ["prepare", "教学准备"], ["stages", "教学过程"], ["board", "板书设计"], ["homework", "作业"]];
const storageKey = (book: string, work: string) => `yapu-plan:${EDITION.key}:${book}:${work}`;
const readPlan = (book: string, work: string): LessonPlan | null => {
  try {
    const raw = window.localStorage.getItem(storageKey(book, work)) ?? window.localStorage.getItem(`yapu-plan:${book}:${work}`);
    return raw ? JSON.parse(raw) as LessonPlan : null;
  } catch { return null; }
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
  const learningModes = useMemo(() => relations.filter((relation) => relation.predicate === "学习方式"), [relations]);
  const lessonsOf = (key: string) => {
    const listed = new Set(learningModes.filter((relation) => matchesBookScope(key, relation.bookKeys)).map((relation) => relation.subject));
    return graph.entities
      .filter((entity) => entity.name.startsWith("《") && entity.bookKeys?.includes(key) && (listed.has(entity.id) || melodiesFor(melodyBook(key), entity.name).length > 0))
      .sort((a, b) => (a.firstPageByBook?.[key] ?? 999) - (b.firstPageByBook?.[key] ?? 999));
  };
  const lessons = lessonsOf(bookKey);
  const work: Entity | undefined = lessons.find((entity) => bareWorkName(entity.name) === routeWork);

  const [request, setRequest] = useState("");
  const [message, setMessage] = useState("");
  // 一句话里读出的要求；换一次要求就重新挂载教案（token 变化），新课的数据就位后立即生成。
  const [asked, setAsked] = useState<{ token: number; options: Options | null }>({ token: 0, options: null });

  const context = useMemo<Context | null>(() => {
    if (!work) return null;
    const valueOf = (relation: Relation) => relation.literal ?? entityMap.get(relation.objectId ?? "")?.name ?? "";
    const own = relations.filter((relation) => relation.subject === work.id && !relation.provenance && !relation.extended
      && matchesBookScope(bookKey, relation.bookKeys));
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
      scoreUrls: getScoreMedia(work.media, bookKey).map((asset) => asset.url),
      related,
      defaultKind: lessonKindOf(mode ? valueOf(mode) : undefined, work.type, work.name),
      grade: Number(bookKey.match(/g(\d)s\d/)?.[1]) || undefined,
    };
  }, [bookKey, entityMap, relations, work]);

  const submitRequest = (event: FormEvent) => {
    event.preventDefault();
    const text = request.trim();
    if (!text) return;
    const target = resolvePlanRequest(text, bookKey, books.map((book) => book.key),
      (key) => (key === bookKey ? lessons : lessonsOf(key)).map((entity) => entity.name));
    if ("message" in target) { setMessage(target.message); return; }
    const { request: parsed, bookKey: targetBook } = target;
    setMessage("");
    setAsked((current) => ({ token: current.token + 1, options: { kind: parsed.kind, minutes: parsed.minutes, className: parsed.className ?? "", note: parsed.note ?? "" } }));
    onRoute(targetBook, bareWorkName(parsed.work));
  };

  // 备课文件：本机的全部教案和课件修改存成一个文件，到另一台电脑上导入。
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [carry, setCarry] = useState("");
  const exportBackup = () => {
    const backup = collectBackup();
    if (!backup) { setCarry("这台电脑上还没有保存过教案或课件修改。"); return; }
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    saveFile(backup.blob, `芽谱备课-${day}.json`);
    setCarry(`已导出 ${backup.plans} 份教案、${backup.decks} 课的课件修改。把这个文件拷到 U 盘或发到教室电脑，在那边点“导入备课文件”。`);
  };
  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 8_000_000) { setCarry("文件太大，不像是芽谱导出的备课文件。"); return; }
    const result = readBackup(await file.text());
    if ("error" in result) { setCarry(result.error); return; }
    if (result.conflicts && !window.confirm(`这台电脑上有 ${result.conflicts} 项同一课的内容和文件里的不一样，导入后会换成文件里的版本。继续导入吗？`)) { setCarry("已取消导入，这台电脑上的内容没有变。"); return; }
    if (!applyBackup(result.items)) { setCarry("浏览器不允许保存（可能是无痕窗口），没有导入成功。"); return; }
    setCarry(`已导入 ${result.plans} 份教案、${result.decks} 课的课件修改。`);
    setAsked((current) => ({ token: current.token + 1, options: null }));
  };

  return <section className="lesson plan plan-v2" aria-labelledby="plan-title">
    <header className="plan-hero">
      <div>
        <p className="plan-kicker">教师端 · 样板</p>
        <h1 id="plan-title">智能备课</h1>
      </div>
      <p className="plan-lead">说一句你要上什么课、班里什么情况，芽谱排出一节课的详案。音乐资源都来自已核对的教材数据，生成后可以逐句修改，教案检查会随改随查。</p>
    </header>

    <div className="plan-start">
      <form className="plan-request" onSubmit={submitRequest}>
        <label htmlFor="plan-request" className="plan-start-title">用一句话说要求</label>
        <textarea id="plan-request" rows={3} value={request} placeholder={EXAMPLE} onChange={(event) => setRequest(event.target.value)} />
        <div className="plan-request-foot">
          {!request && <button type="button" className="plan-link" onClick={() => setRequest(EXAMPLE)}>填入示例</button>}
          <button type="submit" className="plan-primary">生成教案</button>
        </div>
        {message && <p className="plan-message" role="status">{message}</p>}
      </form>

      <div className="plan-pick">
        <p className="plan-start-title">或者直接选课题</p>
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
      </div>
    </div>

    <div className="plan-carry">
      <span>换一台电脑上课？</span>
      <button type="button" className="plan-link" onClick={exportBackup}>导出备课文件</button>
      <button type="button" className="plan-link" onClick={() => fileRef.current?.click()}>导入备课文件</button>
      <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={importBackup} />
      <small>教案和上课模式里的修改只存在这台电脑的浏览器里，导出成文件就能带走。</small>
      {carry && <p className="plan-message" role="status">{carry}</p>}
    </div>

    {!work && <section className="plan-gains" aria-labelledby="plan-gains-title">
      <h2 id="plan-gains-title">一份详案里有什么</h2>
      <ul>{GAINS.map(([title, text], index) => <li key={title}>
        <h3><span>{"0" + (index + 1)}</span>{title}</h3>
        <p>{text}</p>
      </li>)}</ul>
    </section>}
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
    bookTitle: books.find((book) => book.key === bookKey)?.title,
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
  const issues = useMemo(() => {
    if (!plan) return [];
    const result = checkPlan(plan);
    const staleScore = plan.stages.some((stage) => stage.activities.some((activity) => activity.resources.some(
      (resource) => resource.kind === "score" && !context.scoreUrls.includes(resource.url),
    )));
    if (staleScore) result.push({ level: "fix", where: { plan: true }, text: "保存的教案引用了当前册之外的谱例。请核对课型和教学活动，再按选项重新生成。" });
    return result;
  }, [context.scoreUrls, plan]);
  const goalIssues = (index: number) => issues.filter((issue) => "goal" in issue.where && issue.where.goal === index);
  const stageIssues = (key: string) => issues.filter((issue) => "stage" in issue.where && issue.where.stage === key);
  const fixes = issues.filter((issue) => issue.level === "fix").length;

  const copy = async () => {
    if (!plan) return;
    try { await navigator.clipboard.writeText(planText(plan)); setMessage("教案已复制，可以粘贴到 Word 或备课本。"); }
    catch { setMessage("浏览器不允许复制，请手动选择教案文字。"); }
  };

  const exportWord = () => {
    if (!plan) return;
    saveFile(planDocx(plan), `${bareWorkName(plan.workName)}教学设计.docx`);
    setMessage("Word 教案已保存到下载文件夹，可以用 Word 或 WPS 打开继续修改。");
  };
  const print = () => {
    if (!plan) return;
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    frame.srcdoc = planPrintHtml(plan);
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      window.setTimeout(() => frame.remove(), 60_000);
    };
    document.body.appendChild(frame);
  };

  const resource = (res: PlanResource, key: string) => {
    if (res.kind === "score") {
      const url = context.scoreUrls.includes(res.url) ? res.url : context.scoreUrls[0];
      return url ? <a key={key} className="plan-chip" href={assetUrl(url)} target="_blank" rel="noreferrer"><WorkbenchIcon name="expand" />{res.label}</a> : null;
    }
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

  const jump = (id: string) => document.getElementById("plan-sec-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return <div className={`plan-work${plan ? " has-doc" : ""}`}>
    <aside className="plan-rail" aria-label="这节课的设置">
    <div className="plan-options plan-settings">
      <p className="plan-rail-title">这节课</p>
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
    {plan && <div className="plan-doc-actions">
      <p className="plan-rail-title">带走教案</p>
      <span className={`plan-check ${fixes ? "is-fix" : "is-ok"}`}>{fixes ? `教案检查：${fixes} 处需要改` : "教案检查：通过"}</span>
      <button type="button" className="is-main" onClick={exportWord}>导出 Word</button>
      <button type="button" onClick={print}>打印</button>
      <button type="button" onClick={copy}>复制文字</button>
      <button type="button" className="is-wide" onClick={() => onOpenLesson(work, bookKey)}>打开这一课 · 上课模式</button>
    </div>}
    {plan && <nav className="plan-outline" aria-label="教案目录">
      <p className="plan-rail-title">目录</p>
      {OUTLINE.filter(([id]) => (id === "analysis" ? plan.analysis : id === "prepare" ? plan.prepare !== undefined : id === "board" ? plan.board !== undefined : true))
        .map(([id, label]) => <button key={id} type="button" onClick={() => jump(id)}>{label}</button>)}
    </nav>}
    </aside>

    <div className="plan-main">
    {message && <p className="plan-message" role="status">{message}</p>}
    {!plan && <p className="plan-empty">已选《{work}》。定好课型和课时，点“生成教案”开始。</p>}

    {plan && <article className="plan-doc">
      <div className="plan-doc-head">
        <div>
          <h2>{plan.workName}</h2>
          <p>{LESSON_KINDS[plan.kind]} · {plan.minutes} 分钟{plan.className ? ` · ${plan.className}` : ""}{plan.classNote ? ` · ${plan.classNote}` : ""}</p>
          {plan.standard && <p className="plan-standard">课标依据：{plan.standard.band} · 学习任务“{plan.standard.task}”（{STANDARD}第 {plan.standard.page} 页）</p>}
        </div>
      </div>
      {!plan.version && <p className="plan-upgrade" role="status">这是旧版的简案。点“按选项重新生成”，可以得到带教材分析、师生活动、设计意图和板书的详案（会覆盖现在的内容）。</p>}
      {issueList(issues.filter((issue) => "plan" in issue.where))}

      {plan.analysis && <section className="plan-prose" id="plan-sec-analysis">
        <h3>教材分析</h3>
        <textarea aria-label="教材分析" value={plan.analysis.textbook} onChange={(event) => update({ ...plan, analysis: { ...plan.analysis!, textbook: event.target.value } })} />
        <h3>学情分析</h3>
        <textarea aria-label="学情分析" value={plan.analysis.students} onChange={(event) => update({ ...plan, analysis: { ...plan.analysis!, students: event.target.value } })} />
      </section>}

      <section className="plan-goals" id="plan-sec-goals">
        <h3>教学目标</h3>
        <ol>{plan.goals.map((goal, index) => <li key={goal.area}>
          <b>{goal.area}</b>
          <textarea aria-label={`${goal.area}目标`} rows={2} value={goal.text} onChange={(event) => update({ ...plan, goals: plan.goals.map((item, k) => (k === index ? { ...item, text: event.target.value } : item)) })} />
          {issueList(goalIssues(index), index)}
        </li>)}</ol>
        <dl className="plan-focus"><div><dt>教学重点</dt><dd>{plan.focus.key}</dd></div><div><dt>教学难点</dt><dd>{plan.focus.hard}</dd></div></dl>
      </section>

      {plan.prepare !== undefined && <section className="plan-prose" id="plan-sec-prepare">
        <h3>教学准备</h3>
        <textarea aria-label="教学准备" value={plan.prepare} onChange={(event) => update({ ...plan, prepare: event.target.value })} />
      </section>}

      <section className="plan-stages" id="plan-sec-stages">
        <h3>教学过程</h3>
        <div className="plan-timeline" aria-hidden="true">{plan.stages.map((stage) => <span key={stage.key} data-stage={stage.key} style={{ flexGrow: stage.minutes }}>{stage.name}<small>{stage.minutes}′</small></span>)}</div>
        {plan.stages.map((stage, s) => <section key={stage.key} className="plan-stage" data-stage={stage.key}>
          <header>
            <h4>{stage.name}<small>{stage.theme}</small></h4>
            <label className="plan-minutes-input"><input type="number" min={1} max={60} value={stage.minutes} aria-label={`${stage.name}时长`}
              onChange={(event) => update({ ...plan, stages: plan.stages.map((item, k) => (k === s ? { ...item, minutes: Math.max(0, Number(event.target.value) || 0) } : item)) })} />分钟</label>
          </header>
          <ol>{stage.activities.map((item, a) => <li key={item.id} className={`${item.added ? "is-added" : ""}${item.title ? " has-title" : ""}`}>
            {item.title && <p className="plan-step">{item.title}{item.added && <span className="plan-tag">按班级情况</span>}</p>}
            {item.added && !item.title && <span className="plan-tag">按班级情况</span>}
            <textarea aria-label={`${stage.name}活动 ${a + 1}`} rows={Math.min(6, Math.max(2, Math.ceil(item.text.length / 46)))} value={item.text}
              onChange={(event) => update({ ...plan, stages: plan.stages.map((st, k) => (k === s ? { ...st, activities: st.activities.map((it, j) => (j === a ? { ...it, text: event.target.value } : it)) } : st)) })} />
            {item.intent !== undefined && <label className="plan-intent"><span>设计意图</span>
              <textarea aria-label={`${stage.name}活动 ${a + 1} 的设计意图`} value={item.intent} placeholder="为什么这样安排？"
                onChange={(event) => update({ ...plan, stages: plan.stages.map((st, k) => (k === s ? { ...st, activities: st.activities.map((it, j) => (j === a ? { ...it, intent: event.target.value } : it)) } : st)) })} /></label>}
            {item.resources.length > 0 && <div className="plan-chips">{item.resources.map((res, r) => resource(res, `${item.id}-${r}`))}</div>}
            {item.resources.map((res, r) => (res.kind === "melody" || res.kind === "follow") && open === `${item.id}-${r}` && context.melodies.length
              ? <div key={r} className="plan-player"><MelodySet melodies={context.melodies} notationStyle={EDITION.notation ?? "jianpu"} /></div> : null)}
            <button type="button" className="plan-remove" aria-label="删除这条活动" onClick={() => update({ ...plan, stages: plan.stages.map((st, k) => (k === s ? { ...st, activities: st.activities.filter((_, j) => j !== a) } : st)) })}><WorkbenchIcon name="close" /></button>
          </li>)}</ol>
          <button type="button" className="plan-link" onClick={() => update({ ...plan, stages: plan.stages.map((st, k) => (k === s ? { ...st, activities: [...st.activities, { id: `n${Date.now()}`, text: "", resources: [], ...(plan.version ? { title: "补充活动", intent: "" } : {}) }] } : st)) })}>＋ 加一条活动</button>
          {issueList(stageIssues(stage.key))}
        </section>)}
        <p className="plan-sum">合计 {plan.stages.reduce((sum, stage) => sum + stage.minutes, 0)} / {plan.minutes} 分钟
          <button type="button" className="plan-link" onClick={() => update({ ...plan, ...fitMinutes(plan.stages, plan.minutes) })}>按比例对齐课时</button></p>
      </section>

      {plan.board !== undefined && <section className="plan-prose" id="plan-sec-board">
        <h3>板书设计</h3>
        <textarea className="plan-board" aria-label="板书设计" value={plan.board} onChange={(event) => update({ ...plan, board: event.target.value })} />
      </section>}

      <section className="plan-homework" id="plan-sec-homework"><h3>作业</h3>
        <textarea aria-label="作业" value={plan.homework} onChange={(event) => update({ ...plan, homework: event.target.value })} />
        {plan.homeworkIntent !== undefined && <label className="plan-intent"><span>设计意图</span>
          <textarea aria-label="作业的设计意图" value={plan.homeworkIntent} onChange={(event) => update({ ...plan, homeworkIntent: event.target.value })} /></label>}
      </section>
    </article>}
    </div>
  </div>;
}
