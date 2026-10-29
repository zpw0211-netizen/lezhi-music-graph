"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { melodiesFor, noMelodyReason } from "../../lib/lesson/melodies";
import { VocalDemo } from "./VocalDemo";
import { MelodySet } from "./MelodyPlayer";
import { ReflectivePresent } from "./ReflectivePresent";
import { WorkbenchIcon } from "../WorkbenchIcon";
import { getPrintedPage, getScoreMedia, isStarredWork, parseUnitTask } from "../../lib/app/unit-data";
import { SCORE_SIZES } from "../../lib/lesson/score-sizes";
import { BOOK_BY_KEY, EDITION } from "../../lib/app/books";
import { unitArtPath } from "../../lib/app/unit-art";

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
  sources?: Array<{ bookKey: string; pdfPage?: number | null }>;
};

const printedPage = (pdf?: number | null, bookKey?: string) => {
  const offset = BOOK_BY_KEY.get(bookKey ?? "")?.pdfOffset ?? 8;
  return pdf != null && pdf > offset ? pdf - offset : null;
};
const sourcePageFor = (relation: LessonRelation, bookKey?: string) =>
  relation.sources?.find((source) => source.bookKey === bookKey)?.pdfPage ?? relation.sourcePage;
const layerOf = (relation: LessonRelation) =>
  relation.extended ? { key: "extended", label: "拓展" }
    : (relation.confidence ?? 1) < 0.95 ? { key: "derived", label: "归纳" }
    : (relation.confidence ?? 1) < 0.98 ? { key: "score", label: "谱例" }
    : { key: "text", label: "教材" };

const GROUPS: Array<{ key: string; title: string; test: RegExp }> = [
  { key: "basics", title: "基本信息", test: /作词|作曲|词曲|编曲|改编|编配|译配|搜集|整理|传谱|记谱配词|演唱形式|演奏形式|演奏乐器|调号|拍号|速度|表情术语|创作时间|创作年代|选自|来源作品|所属|影视类型|音乐体裁/ },
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

type Creator = { id: string; label: string; value: string };
/** 同一人既作词又作曲时只写一次「词曲」：教材数据常同时有「词曲作者」「作词」「作曲」三条，封面上会把一个名字写三遍。 */
function mergeCreators(items: Creator[]): Creator[] {
  const lyricist = items.filter((item) => item.label === "作词").map((item) => item.value);
  const composer = items.filter((item) => item.label === "作曲").map((item) => item.value);
  const both = new Set([
    ...items.filter((item) => item.label === "词曲作者").map((item) => item.value),
    ...lyricist.filter((value) => composer.includes(value)),
  ]);
  const seen = new Set<string>();
  const out: Creator[] = [];
  for (const item of items) {
    const isBoth = both.has(item.value) && /^(作词|作曲|词曲作者)$/.test(item.label);
    const label = isBoth ? "词曲" : item.label;
    const key = `${label}|${item.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, label });
  }
  return out;
}

const hash = (value: string) => {
  let h = 2166136261;
  for (const char of value) h = Math.imul(h ^ char.codePointAt(0)!, 16777619) >>> 0;
  return h;
};

type Question = { id: string; prompt: string; options: string[]; answer: string; page: number | null };

export function LessonPage({
  workId, bookKey: requestedBookKey, entities, relationships, assetUrl, onBack, onOpenLesson, onWorkGraph,
}: {
  workId: string;
  bookKey?: string;
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
    const allOwn = relationships.filter((relation) => relation.subject === workId && !relation.provenance);
    const learningMode = allOwn.find((relation) => relation.predicate === "学习方式");
    const own = allOwn.filter((relation) => !HIDDEN.test(relation.predicate));
    const unitLinks = relationships.filter((relation) => relation.predicate === "包含作品" && relation.objectId === workId);
    const bookKeysOf = (candidate: LessonRelation) => {
      const candidateBook = relationships.find((relation) => relation.predicate === "包含单元" && relation.objectId === candidate.subject);
      return entityMap.get(candidateBook?.subject ?? "")?.bookKeys ?? [];
    };
    // A link without a book (search, graph) opens the first occurrence that has a melody: a work only mentioned on an
    // 综合探索 page (人教 茉莉花、送别、雪花) would otherwise open there, with no melody to play.
    const hasMelody = (bookKey: string) => melodiesFor(EDITION.notation === "staff" ? `wx-${bookKey}` : bookKey, work?.name ?? "").length > 0;
    const unitLink = (requestedBookKey
      ? unitLinks.find((candidate) => bookKeysOf(candidate).includes(requestedBookKey))
      : unitLinks.find((candidate) => bookKeysOf(candidate).some(hasMelody))) ?? unitLinks[0];
    const unit = unitLink ? entityMap.get(unitLink.subject) : undefined;
    const unitRelations = unit ? relationships.filter((relation) => relation.subject === unit.id) : [];
    const bookLink = unit ? relationships.find((relation) => relation.predicate === "包含单元" && relation.objectId === unit.id) : undefined;
    const book = bookLink ? entityMap.get(bookLink.subject) : undefined;
    const lessonBookKey = requestedBookKey && book?.bookKeys?.includes(requestedBookKey)
      ? requestedBookKey
      : book?.bookKeys?.find(hasMelody) ?? book?.bookKeys?.[0];
    const pageOf = (entity?: LessonEntity) => (entity ? entity.firstPageByBook?.[lessonBookKey ?? ""] ?? entity.firstPage ?? 0 : 0);
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
    // 上课模式封面用本单元插图；没有单元插图的单元用本册封面。
    const unitOrder = Number(unitRelations.find((relation) => relation.predicate === "单元顺序")?.literal);
    const artPath = lessonBookKey ? (Number.isInteger(unitOrder) ? unitArtPath(lessonBookKey, unitOrder) : null) ?? `art/${lessonBookKey}.webp` : null;
    return { own, unit, book, bookKey: lessonBookKey, artPath, learningMode, workPage: printedPage(pageOf(work), lessonBookKey), unitWorks, tasks, goals, groups: groups.filter((group) => group.facts.length), extended };
  }, [entityMap, relationships, requestedBookKey, valueOf, work, work?.name, workId]);

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
      result.push({ id: fact.id, prompt: spec.ask(work.name), options, answer, page: printedPage(sourcePageFor(fact, lesson.bookKey), lesson.bookKey) });
      if (result.length >= 4) break;
    }
    return result;
  }, [entityMap, lesson.bookKey, lesson.own, relationships, valueOf, work, workId]);

  const [conceptId, setConceptId] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const presentButtonRef = useRef<HTMLButtonElement | null>(null);
  // Esc 退出上课模式后，焦点必须回到触发按钮（教师用键盘/翻页笔的核心动线）。
  const closePresent = useCallback(() => {
    setPresenting(false);
    requestAnimationFrame(() => presentButtonRef.current?.focus());
  }, []);
  // The parent remounts this page per lesson (key), so only scrolling is needed here.
  useEffect(() => { window.scrollTo?.({ top: 0 }); }, [workId]);

  if (!work) return <section className="lesson-empty"><p>没有找到这一课。</p><button type="button" onClick={onBack}>返回</button></section>;
  const melodyBookKey = lesson.bookKey && EDITION.notation === "staff" ? `wx-${lesson.bookKey}` : lesson.bookKey;
  const bookMelodies = melodiesFor(melodyBookKey, work.name);
  const melody = bookMelodies.length ? bookMelodies : undefined;
  const starred = isStarredWork(relationships.filter((relation) => relation.subject === workId));
  const creators = mergeCreators(lesson.own
    .filter((relation) => /^(作词|作曲|词曲作者|填词|改词|编词|译配|译词|配歌|配曲|编曲|编配|改编|整理|整理改编|记谱|记谱配词|记录|传谱|编合唱|配合唱)$/.test(relation.predicate))
    .map((relation) => ({ id: relation.id, label: relation.predicate, value: valueOf(relation) })));
  const scoreMedia = getScoreMedia(work.media);
  const scorePage = getPrintedPage(scoreMedia);
  // 栏目名、没有谱例的活动（我爱大自然、音乐万花筒……）和目录外只在节目单里提到的曲名不是一课：目录和翻页都不列。
  // 规则与 build-units 的单元作品列表一致：有栏目、有旋律、有谱例或是朗诵作品才算一课。
  const inContents = (entity: LessonEntity) => relationships.some((relation) => relation.subject === entity.id && relation.predicate === "学习方式");
  const lessons = lesson.unitWorks.filter((entity) => isLessonEntity(entity)
    && (inContents(entity) || entity.type === "朗诵作品" || getScoreMedia(entity.media).length > 0 || melodiesFor(melodyBookKey, entity.name).length > 0));
  const index = lessons.findIndex((entity) => entity.id === workId);
  const previous = index > 0 ? lessons[index - 1] : undefined;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined;
  // 面包屑只渲染真实存在的层级，缺单元归属的作品（如《阿米达》）不留空分隔符
  const crumbTrail = [lesson.book?.name, lesson.unit?.name].filter((name): name is string => Boolean(name));

  return <section className="lesson" aria-labelledby="lesson-title">
    <nav className="lesson-crumbs" aria-label="课程位置">
      <button type="button" onClick={onBack}><WorkbenchIcon name="left" />课程目录</button>
      {crumbTrail.map((name) => <span key={name}><WorkbenchIcon name="right" />{name}</span>)}
      <b><WorkbenchIcon name="right" />{work.name}</b>
    </nav>

    <div className="lesson-layout">
      <div className="lesson-main" data-reveal-group>
        <header className="lesson-hero" data-reveal>
          <div>
            <h1 id="lesson-title" data-grade={lesson.book?.name.match(/([七八九])年级/)?.[1] ?? ""}>{work.name}</h1>
            <p className="lesson-meta">
              <span className="lesson-type">{work.type}</span>
              {starred && <span className="lesson-star" title="教材标注的重点学习曲目">☆ 重点曲目</span>}
              {creators.map((item) => <span key={item.id}><small>{item.label}</small>{item.value}</span>)}
              {lesson.learningMode && <span><small>教材栏目</small>{valueOf(lesson.learningMode)}</span>}
              {lesson.workPage && lesson.workPage !== scorePage && <span><small>教材</small>第 {lesson.workPage} 页</span>}
              {scorePage && <span><small>教材</small>第 {scorePage} 页</span>}
            </p>
          </div>
          <div className="lesson-hero-actions">
            <button ref={presentButtonRef} type="button" className="lesson-present" onClick={() => setPresenting(true)}><WorkbenchIcon name="expand" />上课模式</button>
            <button type="button" onClick={() => onWorkGraph(workId)}><WorkbenchIcon name="graph" />作品图谱</button>
          </div>
        </header>

        <section className="lesson-block" data-reveal>
          <h2><em>1</em>{work.type === "朗诵作品" ? "阅读 · 聆听" : "看谱 · 听旋律"}</h2>
          {melody ? <MelodySet melodies={melody} notationStyle={EDITION.notation ?? "jianpu"} /> : <p className="lesson-note">{work.type === "朗诵作品"
            ? "这是朗诵作品，没有固定的歌曲旋律。请结合教材原文体会语言节奏。"
            : noMelodyReason(melodyBookKey, work.name)
              ?? (scoreMedia.length === 0
                ? "这页的乐谱还没有整理为在线谱例；可以先对照教材原页视唱。"
                : "这首作品的旋律示范还在整理中，可以先对照下方教材谱例视唱。")}</p>}
          <VocalDemo workName={work.name} assetUrl={assetUrl} />
          {scoreMedia.length > 0 && <details className="lesson-scores" open={!melody || melody.every((item) => item.quality === "draft")}>
            <summary>教材谱例原图（{scoreMedia.length} 张）</summary>
            <div>{scoreMedia.map((asset) => {
              /* CLS：写死谱例图固有尺寸，懒加载不再撑开布局 */
              const size = SCORE_SIZES[asset.url];
              return <a key={asset.url} href={assetUrl(asset.url)} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img loading="lazy" src={assetUrl(asset.url)} width={size?.[0]} height={size?.[1]} alt={asset.title ?? "教材谱例"} />
            </a>; })}</div>
          </details>}
        </section>

        <section className="lesson-block" data-reveal>
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
                    <span className={`lesson-layer is-${layer.key}`} title={printedPage(sourcePageFor(relation, lesson.bookKey), lesson.bookKey) ? `教材第 ${printedPage(sourcePageFor(relation, lesson.bookKey), lesson.bookKey)} 页` : undefined}>{layer.label}{printedPage(sourcePageFor(relation, lesson.bookKey), lesson.bookKey) ? ` · P${printedPage(sourcePageFor(relation, lesson.bookKey), lesson.bookKey)}` : ""}</span>
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

        {(lesson.tasks.length > 0) && <section className="lesson-block" data-reveal>
          <h2><em>3</em>课堂活动</h2>
          <ol className="lesson-tasks">{lesson.tasks.map((task) => { const parsed = parseUnitTask(task); return <li key={task}>{parsed.text}{parsed.focus.length > 0 && <small>练习重点：{parsed.focus.join("、")}</small>}</li>; })}</ol>
        </section>}

        {questions.length > 0 && <section className="lesson-block" data-reveal>
          <h2><em>{lesson.tasks.length ? 4 : 3}</em>小练习</h2>
          <Quiz questions={questions} />
        </section>}

        <footer className="lesson-pager" data-reveal>
          {previous ? <button type="button" onClick={() => onOpenLesson(previous.id)}><WorkbenchIcon name="left" /><span><small>上一课</small>{previous.name}</span></button> : <span />}
          {next ? <button type="button" className="is-next" onClick={() => onOpenLesson(next.id)}><span><small>下一课</small>{next.name}</span><WorkbenchIcon name="right" /></button> : <span />}
        </footer>
      </div>

      <aside className="lesson-side" data-reveal-group>
        <section data-reveal>
          <h3>{lesson.unit?.name ?? "本单元"}</h3>
          {lesson.goals.length > 0 && <ul className="lesson-goals">{lesson.goals.map((goal) => <li key={goal}>{goal}</li>)}</ul>}
          <ol className="lesson-unit-works" data-reveal-group>{lessons.map((entity) => <li key={entity.id} data-reveal>
            <button type="button" className={entity.id === workId ? "active" : ""} onClick={() => onOpenLesson(entity.id)}>
              {entity.name}<small>{entity.type}</small>
            </button>
          </li>)}</ol>
        </section>
      </aside>
    </div>

    {presenting && <ReflectivePresent
      workId={workId}
      workName={work.name}
      workType={work.type}
      mode={lesson.learningMode ? valueOf(lesson.learningMode) : undefined}
      grade={Number(lesson.bookKey?.match(/g(\d)s\d/)?.[1]) || undefined}
      bookName={lesson.book?.name}
      unitName={lesson.unit?.name ?? ""}
      scorePage={scorePage}
      creators={creators}
      facts={lesson.own.filter((relation) => !relation.extended).map((relation) => ({ label: relation.label ?? relation.predicate, value: valueOf(relation) }))}
      melody={melody}
      notationStyle={EDITION.notation ?? "jianpu"}
      scores={scoreMedia}
      tasks={lesson.tasks.map(parseUnitTask)}
      questions={questions}
      artUrl={lesson.artPath ? assetUrl(lesson.artPath) : undefined}
      assetUrl={assetUrl}
      onClose={closePresent}
    />}
  </section>;
}

const isLessonEntity = (entity: LessonEntity) => entity.name.startsWith("《");

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
