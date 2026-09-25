"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MELODIES } from "../../lib/lesson/melodies";
import { MelodySet } from "./MelodyPlayer";
import type { Melody } from "../../lib/lesson/melodies";
import { WorkbenchIcon } from "../WorkbenchIcon";

type LessonEntity = {
  id: string;
  name: string;
  type: string;
  bookKeys?: string[];
  firstPage?: number | null;
  firstPageByBook?: Record<string, number>;
  media?: Array<{ kind: string; url: string; title?: string; source?: string }>;
};
type LessonRelation = {
  id: string;
  subject: string;
  predicate: string;
  label?: string;
  objectId?: string | null;
  literal?: string | null;
  provenance?: boolean;
  extended?: boolean;
  confidence?: number;
  sourcePage?: number | null;
};

// All six 人音版 7–9 books carry eight pages of front matter before page 1.
const PDF_OFFSET = 8;
const printedPage = (pdf?: number | null) => (pdf != null && pdf > PDF_OFFSET ? pdf - PDF_OFFSET : null);
const layerOf = (relation: LessonRelation) =>
  relation.extended ? { key: "extended", label: "拓展" }
    : (relation.confidence ?? 1) < 0.95 ? { key: "derived", label: "归纳" }
    : (relation.confidence ?? 1) < 0.98 ? { key: "score", label: "谱例" }
    : { key: "text", label: "教材" };

const GROUPS: Array<{ key: string; title: string; test: RegExp }> = [
  { key: "basics", title: "基本信息", test: /作词|作曲|词曲|编曲|改编|编配|译配|搜集|整理|传谱|演唱形式|演奏形式|演奏乐器|调号|拍号|速度|表情术语|创作时间|创作年代|选自|来源作品|所属|影视类型|音乐体裁/ },
  { key: "meaning", title: "内容与情感", test: /主题|内容|情感|背景|描绘|描写|意义|地位|剧情|出处/ },
  { key: "practice", title: "学唱要点", test: /演唱要求|演奏要求|学习要求|乐句|学习活动|练习|演唱提示/ },
  { key: "features", title: "音乐特点", test: /./ },
];
const HIDDEN = /^(学习方式|教材标注|包含作品|对比作品)$/;

const QUIZ: Array<{ test: RegExp; family: RegExp; ask: (work: string) => string }> = [
  { test: /^拍号$/, family: /^拍号$/, ask: (w) => `${w}是几拍子的歌曲？` },
  { test: /^调号$/, family: /^调号$/, ask: (w) => `${w}的调号是？` },
  { test: /^(词曲作者|作曲)$/, family: /^(词曲作者|作曲)$/, ask: (w) => `${w}的曲作者是谁？` },
  { test: /^曲式结构$/, family: /^曲式结构$/, ask: (w) => `${w}是什么曲式结构？` },
  { test: /^(风格特点|音乐风格)$/, family: /^(风格特点|音乐风格)$/, ask: (w) => `${w}具有哪种音乐风格？` },
  { test: /^所属民族$/, family: /^所属民族$/, ask: (w) => `${w}是哪个民族的音乐？` },
  { test: /^演唱形式$/, family: /^(演唱形式|演奏形式)$/, ask: (w) => `教材中${w}的演唱形式是？` },
  { test: /^速度$/, family: /^速度$/, ask: (w) => `${w}的速度标记是？` },
];

const hash = (value: string) => {
  let h = 2166136261;
  for (const char of value) h = Math.imul(h ^ char.codePointAt(0)!, 16777619) >>> 0;
  return h;
};

// Unit tasks are stored as "标题（涉及《…》；练习重点：…）".
const parseTask = (literal: string) => {
  const match = literal.match(/^(.*?)（(.*)）$/);
  const focus = match?.[2].match(/练习重点：(.*)$/)?.[1];
  return { title: match?.[1] ?? literal, focus };
};

type Question = { id: string; prompt: string; options: string[]; answer: string; page: number | null };

export function LessonPage({
  workId, entities, relationships, assetUrl, onBack, onOpenLesson, onWorkGraph,
}: {
  workId: string;
  entities: LessonEntity[];
  relationships: LessonRelation[];
  assetUrl: (path: string) => string;
  onBack: () => void;
  onOpenLesson: (id: string) => void;
  onWorkGraph: (id: string) => void;
}) {
  const entityMap = useMemo(() => new Map(entities.map((entity) => [entity.id, entity])), [entities]);
  const work = entityMap.get(workId);
  const valueOf = useCallback((relation: LessonRelation) => relation.literal ?? entityMap.get(relation.objectId ?? "")?.name ?? "", [entityMap]);

  const lesson = useMemo(() => {
    const own = relationships.filter((relation) => relation.subject === workId && !relation.provenance && !HIDDEN.test(relation.predicate));
    const unitLink = relationships.find((relation) => relation.predicate === "包含作品" && relation.objectId === workId);
    const unit = unitLink ? entityMap.get(unitLink.subject) : undefined;
    const unitRelations = unit ? relationships.filter((relation) => relation.subject === unit.id) : [];
    const bookLink = unit ? relationships.find((relation) => relation.predicate === "包含单元" && relation.objectId === unit.id) : undefined;
    const book = bookLink ? entityMap.get(bookLink.subject) : undefined;
    const bookKey = book?.bookKeys?.[0];
    const pageOf = (entity?: LessonEntity) => (entity ? entity.firstPageByBook?.[bookKey ?? ""] ?? entity.firstPage ?? 0 : 0);
    const unitWorks = unitRelations
      .filter((relation) => relation.predicate === "包含作品" && relation.objectId)
      .map((relation) => entityMap.get(relation.objectId!))
      .filter((entity): entity is LessonEntity => Boolean(entity))
      .sort((a, b) => pageOf(a) - pageOf(b));
    const tasks = unitRelations.filter((relation) => relation.predicate === "课堂任务" && relation.literal?.includes(work?.name ?? "\u0000")).map((relation) => relation.literal!);
    const goals = unitRelations.filter((relation) => /学习目标|单元主题/.test(relation.predicate)).map(valueOf);
    const groups = GROUPS.map((group) => ({ ...group, facts: [] as LessonRelation[] }));
    const extended: LessonRelation[] = [];
    for (const relation of own) {
      if (relation.extended) { extended.push(relation); continue; }
      groups.find((group) => group.test.test(relation.predicate))!.facts.push(relation);
    }
    return { own, unit, book, unitWorks, tasks, goals, groups: groups.filter((group) => group.facts.length), extended };
  }, [entityMap, relationships, valueOf, work?.name, workId]);

  const questions = useMemo<Question[]>(() => {
    if (!work) return [];
    const result: Question[] = [];
    for (const spec of QUIZ) {
      const fact = lesson.own.find((relation) => spec.test.test(relation.predicate) && !relation.extended);
      if (!fact) continue;
      const answer = valueOf(fact);
      // Distractors come from the same fact on other works, so they look like real answers.
      const pool = [...new Set(relationships
        .filter((relation) => spec.family.test(relation.predicate) && relation.subject !== workId && entityMap.get(relation.subject)?.name.startsWith("《"))
        .map(valueOf))]
        .filter((value) => value && value !== answer && value.length <= 16 && !/[、，]/.test(value));
      if (pool.length < 2) continue;
      const distractors = pool.sort((a, b) => hash(workId + a) - hash(workId + b)).slice(0, 3);
      const options = [answer, ...distractors].sort((a, b) => hash(work.name + a) - hash(work.name + b));
      result.push({ id: fact.id, prompt: spec.ask(work.name), options, answer, page: printedPage(fact.sourcePage) });
      if (result.length >= 4) break;
    }
    return result;
  }, [entityMap, lesson.own, relationships, valueOf, work, workId]);

  const [conceptId, setConceptId] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  // The parent remounts this page per lesson (key), so only scrolling is needed here.
  useEffect(() => { window.scrollTo?.({ top: 0 }); }, [workId]);

  if (!work) return <section className="lesson-empty"><p>没有找到这一课。</p><button type="button" onClick={onBack}>返回</button></section>;
  const melody = MELODIES[work.name];
  const starred = relationships.some((relation) => relation.subject === workId && relation.predicate === "教材标注");
  const creators = lesson.own.filter((relation) => /^(作词|作曲|词曲作者|编曲|改编)$/.test(relation.predicate));
  const scorePage = work.media?.map((asset) => asset.title?.match(/教材第(\d+)页/)?.[1]).find(Boolean);
  const index = lesson.unitWorks.findIndex((entity) => entity.id === workId);
  const previous = index > 0 ? lesson.unitWorks[index - 1] : undefined;
  const next = index >= 0 && index < lesson.unitWorks.length - 1 ? lesson.unitWorks[index + 1] : undefined;

  return <section className="lesson" aria-labelledby="lesson-title">
    <nav className="lesson-crumbs" aria-label="课程位置">
      <button type="button" onClick={onBack}><WorkbenchIcon name="left" />课程目录</button>
      <span>{lesson.book?.name}</span><WorkbenchIcon name="right" />
      <span>{lesson.unit?.name}</span><WorkbenchIcon name="right" />
      <b>{work.name}</b>
    </nav>

    <div className="lesson-layout">
      <div className="lesson-main">
        <header className="lesson-hero">
          <div>
            <span className="lesson-type">{work.type}</span>{starred && <span className="lesson-star" title="教材标注的重点学习曲目">☆ 重点曲目</span>}
            <h1 id="lesson-title">{work.name}</h1>
            <p className="lesson-meta">
              {creators.map((relation) => <span key={relation.id}><small>{relation.predicate}</small>{valueOf(relation)}</span>)}
              {scorePage && <span><small>教材</small>第 {scorePage} 页</span>}
            </p>
          </div>
          <div className="lesson-hero-actions">
            <button type="button" className="lesson-present" onClick={() => setPresenting(true)}><WorkbenchIcon name="expand" />上课模式</button>
            <button type="button" onClick={() => onWorkGraph(workId)}><WorkbenchIcon name="graph" />作品图谱</button>
          </div>
        </header>

        <section className="lesson-block">
          <h2><em>1</em>{work.type === "朗诵作品" ? "阅读 · 聆听" : "看谱 · 听旋律"}</h2>
          {melody ? <MelodySet melodies={melody} /> : <p className="lesson-note">{work.type === "朗诵作品"
            ? "这是朗诵作品，没有固定的歌曲旋律。请结合教材原文体会语言节奏。"
            : (work.media?.length ?? 0) === 0
              ? "教材此页未附乐谱，暂时无法从教材核对并生成旋律示范。"
              : "这首作品的旋律示范还在整理中，可以先对照下方教材谱例视唱。"}</p>}
          {(work.media?.length ?? 0) > 0 && <details className="lesson-scores" open={!melody || melody.every((item) => item.quality === "draft")}>
            <summary>教材谱例原图（{work.media!.length} 张）</summary>
            <div>{work.media!.map((asset) => <a key={asset.url} href={assetUrl(asset.url)} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img loading="lazy" src={assetUrl(asset.url)} alt={asset.title ?? "教材谱例"} />
            </a>)}</div>
          </details>}
        </section>

        <section className="lesson-block">
          <h2><em>2</em>知识要点</h2>
          <div className="lesson-facts">
            {lesson.groups.map((group) => <div key={group.key} className={`lesson-fact-group is-${group.key}`}>
              <h3>{group.title}</h3>
              <dl>{group.facts.map((relation) => {
                const layer = layerOf(relation);
                const concept = relation.objectId ? entityMap.get(relation.objectId) : undefined;
                return <div key={relation.id}>
                  <dt>{relation.label ?? relation.predicate}</dt>
                  <dd>
                    {concept ? <button type="button" className={`lesson-chip ${conceptId === concept.id ? "active" : ""}`} onClick={() => setConceptId(conceptId === concept.id ? null : concept.id)}>{concept.name}</button> : valueOf(relation)}
                    <span className={`lesson-layer is-${layer.key}`} title={printedPage(relation.sourcePage) ? `教材第 ${printedPage(relation.sourcePage)} 页` : undefined}>{layer.label}{printedPage(relation.sourcePage) ? ` · P${printedPage(relation.sourcePage)}` : ""}</span>
                  </dd>
                </div>;
              })}</dl>
            </div>)}
          </div>
          {conceptId && <ConceptCard conceptId={conceptId} workId={workId} entityMap={entityMap} relationships={relationships} onOpenLesson={onOpenLesson} onClose={() => setConceptId(null)} />}
          {lesson.extended.length > 0 && <div className="lesson-extended">
            <h3>拓展知识<small>教材之外的补充，已审阅</small></h3>
            <ul>{lesson.extended.map((relation) => <li key={relation.id}><b>{relation.label ?? relation.predicate}</b>{valueOf(relation)}</li>)}</ul>
          </div>}
        </section>

        {(lesson.tasks.length > 0) && <section className="lesson-block">
          <h2><em>3</em>课堂活动</h2>
          <ol className="lesson-tasks">{lesson.tasks.map((task) => { const { title, focus } = parseTask(task); return <li key={task}>{title}{focus && <small>练习重点：{focus}</small>}</li>; })}</ol>
        </section>}

        {questions.length > 0 && <section className="lesson-block">
          <h2><em>{lesson.tasks.length ? 4 : 3}</em>小练习</h2>
          <Quiz questions={questions} />
        </section>}

        <footer className="lesson-pager">
          {previous ? <button type="button" onClick={() => onOpenLesson(previous.id)}><WorkbenchIcon name="left" /><span><small>上一课</small>{previous.name}</span></button> : <span />}
          {next ? <button type="button" className="is-next" onClick={() => onOpenLesson(next.id)}><span><small>下一课</small>{next.name}</span><WorkbenchIcon name="right" /></button> : <span />}
        </footer>
      </div>

      <aside className="lesson-side">
        <section>
          <h3>{lesson.unit?.name ?? "本单元"}</h3>
          {lesson.goals.length > 0 && <ul className="lesson-goals">{lesson.goals.map((goal) => <li key={goal}>{goal}</li>)}</ul>}
          <ol className="lesson-unit-works">{lesson.unitWorks.map((entity) => <li key={entity.id}>
            <button type="button" className={entity.id === workId ? "active" : ""} onClick={() => onOpenLesson(entity.id)}>
              {entity.name}<small>{entity.type}</small>
            </button>
          </li>)}</ol>
        </section>
      </aside>
    </div>

    {presenting && <PresentMode work={work} melody={melody} groups={lesson.groups} tasks={lesson.tasks} questions={questions} valueOf={valueOf} assetUrl={assetUrl} unitName={lesson.unit?.name ?? ""} onClose={() => setPresenting(false)} />}
  </section>;
}

function ConceptCard({ conceptId, workId, entityMap, relationships, onOpenLesson, onClose }: {
  conceptId: string; workId: string; entityMap: Map<string, LessonEntity>; relationships: LessonRelation[];
  onOpenLesson: (id: string) => void; onClose: () => void;
}) {
  const concept = entityMap.get(conceptId);
  const facts = relationships.filter((relation) => relation.subject === conceptId && !relation.provenance && /定义|含义|别称|特点|包含|构成|所属|代表|用途|乐器类别/.test(relation.predicate)).slice(0, 5);
  const works = [...new Set(relationships
    .filter((relation) => relation.objectId === conceptId && relation.subject !== workId)
    .map((relation) => relation.subject))]
    .map((id) => entityMap.get(id))
    .filter((entity): entity is LessonEntity => Boolean(entity && /《/.test(entity.name)))
    .slice(0, 8);
  if (!concept) return null;
  return <div className="lesson-concept" role="dialog" aria-label={concept.name}>
    <header><b>{concept.name}</b><small>{concept.type}</small><button type="button" aria-label="关闭" onClick={onClose}><WorkbenchIcon name="close" /></button></header>
    {facts.length > 0 && <dl>{facts.map((relation) => <div key={relation.id}><dt>{relation.label ?? relation.predicate}</dt><dd>{relation.literal ?? entityMap.get(relation.objectId ?? "")?.name}</dd></div>)}</dl>}
    {works.length > 0 && <p className="lesson-concept-works"><span>教材里还有：</span>{works.map((entity) => <button key={entity.id} type="button" onClick={() => onOpenLesson(entity.id)}>{entity.name}</button>)}</p>}
    {!facts.length && !works.length && <p className="lesson-note">教材中只在这首作品里出现。</p>}
  </div>;
}

function Quiz({ questions }: { questions: Question[] }) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const answered = questions.filter((question) => picked[question.id]).length;
  const correct = questions.filter((question) => picked[question.id] === question.answer).length;
  return <div className="lesson-quiz">
    {questions.map((question, index) => {
      const choice = picked[question.id];
      return <fieldset key={question.id} className={choice ? (choice === question.answer ? "is-right" : "is-wrong") : ""}>
        <legend><em>Q{index + 1}</em>{question.prompt}</legend>
        <div>{question.options.map((option) => <button key={option} type="button" disabled={Boolean(choice)}
          className={choice && option === question.answer ? "is-answer" : choice === option ? "is-picked" : ""}
          onClick={() => setPicked((current) => ({ ...current, [question.id]: option }))}>{option}</button>)}</div>
        {choice && <p>{choice === question.answer ? "回答正确！" : `正确答案是「${question.answer}」。`}{question.page ? `见教材第 ${question.page} 页。` : ""}</p>}
      </fieldset>;
    })}
    <p className="lesson-quiz-score">{answered === questions.length ? `完成！答对 ${correct} / ${questions.length} 题` : `已作答 ${answered} / ${questions.length}`}
      {answered > 0 && <button type="button" onClick={() => setPicked({})}>重新作答</button>}</p>
  </div>;
}

type Slide = { key: string; steps: number; render: (step: number) => ReactNode };

function PresentMode({ work, melody, groups, tasks, questions, valueOf, assetUrl, unitName, onClose }: {
  work: LessonEntity; melody?: Melody[]; groups: Array<{ key: string; title: string; facts: LessonRelation[] }>; tasks: string[];
  questions: Question[]; valueOf: (relation: LessonRelation) => string; assetUrl: (path: string) => string; unitName: string; onClose: () => void;
}) {
  const points = groups.filter((group) => group.key !== "practice").flatMap((group) => group.facts.map((relation) => ({ id: relation.id, label: relation.label ?? relation.predicate, value: valueOf(relation) }))).slice(0, 8);
  const slides: Slide[] = [
    { key: "cover", steps: 1, render: () => <div className="present-cover"><small>{unitName}</small><h1>{work.name}</h1><p>{work.type}</p></div> },
    { key: "score", steps: 1, render: () => <div className="present-score"><h2>看谱 · 听旋律</h2>{melody ? <MelodySet melodies={melody} large /> : work.media?.[0] ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={assetUrl(work.media[0].url)} alt="教材谱例" />) : <p>{work.type === "朗诵作品" ? "朗诵作品没有固定的歌曲旋律。" : "教材未附谱例，旋律资料有待补充。"}</p>}</div> },
    { key: "points", steps: points.length + 1, render: (step) => <div className="present-points"><h2>知识要点</h2><ul>{points.map((point, index) => <li key={point.id} className={index < step ? "is-shown" : ""}><b>{point.label}</b>{point.value}</li>)}</ul></div> },
    ...questions.map((question, index): Slide => ({ key: question.id, steps: 2, render: (step) => <div className="present-question"><small>小练习 {index + 1} / {questions.length}</small><h2>{question.prompt}</h2>
      <div>{question.options.map((option, k) => <span key={option} className={step >= 1 && option === question.answer ? "is-answer" : step >= 1 ? "is-other" : ""}><em>{"ABCD"[k]}</em>{option}</span>)}</div></div> })),
    ...(tasks.length ? [{ key: "tasks", steps: 1, render: () => <div className="present-points"><h2>课堂活动</h2><ul>{tasks.map((task) => <li key={task} className="is-shown">{parseTask(task).title}</li>)}</ul></div> }] : []),
  ];
  const [position, setPosition] = useState({ slide: 0, step: 0 });
  // Navigation only needs each slide's step count; keep it stable across renders.
  const countsKey = slides.map((item) => item.steps).join(",");
  const counts = useMemo(() => countsKey.split(",").map(Number), [countsKey]);
  const forward = useCallback(() => setPosition(({ slide, step }) => step + 1 < counts[slide] ? { slide, step: step + 1 } : slide + 1 < counts.length ? { slide: slide + 1, step: 0 } : { slide, step }), [counts]);
  const back = useCallback(() => setPosition(({ slide, step }) => step > 0 ? { slide, step: step - 1 } : slide > 0 ? { slide: slide - 1, step: counts[slide - 1] - 1 } : { slide, step }), [counts]);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { if (document.fullscreenElement) void document.exitFullscreen?.(); };
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      else if (["ArrowRight", "PageDown", " ", "Enter"].includes(event.key)) { event.preventDefault(); forward(); }
      else if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); back(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back, forward]);
  const slide = slides[position.slide];
  return <div className="present" role="dialog" aria-label="上课模式">
    <div className="present-stage" key={slide.key}>{slide.render(position.step)}</div>
    <footer className="present-bar">
      <span>{work.name} · 上课模式</span>
      <div className="present-dots">{slides.map((item, index) => <i key={item.key} className={index === position.slide ? "active" : ""} />)}</div>
      <div className="present-nav">
        <button type="button" onClick={back} aria-label="上一步"><WorkbenchIcon name="left" /></button>
        <button type="button" onClick={forward} aria-label="下一步"><WorkbenchIcon name="right" /></button>
        <button type="button" onClick={onClose}>退出</button>
      </div>
    </footer>
  </div>;
}
