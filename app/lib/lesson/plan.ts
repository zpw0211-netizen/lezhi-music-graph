// 智能备课：把老师的一句话读成备课要求，用常规课脚本搭出整节课，再按要求调整；教案检查逐条指出目标、活动、时间上的问题。
// 教案里的音乐内容（旋律、人声范唱、跟唱、谱例）只引用芽谱已有的资源，文字可以由老师或 AI 改写，资源不能凭空出现。
import type { Melody } from "./jianpu";
import { LESSON_KINDS, type LessonFact, type LessonKind, type StageKey } from "./reflective";
import { LITERACIES, REGULAR_STAGES, regularScript, type Literacy } from "./regular";
import { BAND_NAMES, OBSERVABLE_VERBS, STANDARD, bandOf } from "./curriculum";

/** 教案里能点开的资源：都指向本课已有的数据。 */
export type PlanResource =
  | { kind: "melody"; label: string; segment: number }
  | { kind: "follow"; label: string; segment: number }
  | { kind: "score"; label: string; url: string }
  | { kind: "rhythm"; label: string }
  | { kind: "work"; label: string; work: string };

export type PlanActivity = { id: string; text: string; resources: PlanResource[]; /** 按班级情况加的建议 */ added?: boolean };
export type PlanStage = { key: StageKey; name: string; theme: string; minutes: number; activities: PlanActivity[] };
export type LessonPlan = {
  workName: string;
  kind: LessonKind;
  grade?: number;
  minutes: number;
  /** 本课在课标里的学段和学习任务。 */
  standard?: { band: string; task: string; page: number };
  className?: string;
  classNote?: string;
  goals: Array<{ area: Literacy; text: string }>;
  focus: { key: string; hard: string };
  stages: PlanStage[];
  homework: string;
};

export type PlanRequest = { work?: string; kind?: LessonKind; minutes?: number; className?: string; note?: string };

const KIND_WORDS: Array<[RegExp, LessonKind]> = [[/歌唱课|唱歌课|学唱/, "sing"], [/欣赏课|聆听课|赏析/, "listen"], [/演奏课|器乐课|竖笛|口风琴/, "play"], [/编创课|创编课/, "create"]];

/** 从老师的一句话里读出课题、课型、时长、班级和班级情况；读不出的项留空，由页面上的选择补足。 */
export function parseRequest(text: string, works: string[]): PlanRequest {
  const bare = (name: string) => name.replace(/^《|》$/g, "");
  // 全名优先，长的先匹配（《茉莉花（河北民歌）》不被《茉莉花》抢走）；都没有时再认去掉括号注的简称。
  const byLength = [...works].sort((a, b) => bare(b).length - bare(a).length);
  const work = byLength.find((name) => text.includes(bare(name)))
    ?? byLength.find((name) => /（.*?）/.test(name) && text.includes(bare(name).replace(/（.*?）/g, "")));
  const kind = KIND_WORDS.find(([pattern]) => pattern.test(text))?.[1];
  const minutes = Number(text.match(/(\d{2})\s*分钟/)?.[1]) || undefined;
  const className = text.match(/(?:[初高]?[一二三四五六七八九])?(?:年级)?\s*[（(]?\s*\d+\s*[）)]?\s*班/)?.[0].replace(/\s/g, "");
  // 班级情况：按标点分句，去掉已经读出的课题、课型、时长、班级和"明天给…上"这类开头，剩下的句子就是班级情况。
  let rest = text;
  if (work) rest = rest.replace(`《${bare(work)}》`, " ").replace(bare(work), " ");
  if (className) rest = rest.replace(className, " ");
  rest = rest.replace(/歌唱课|唱歌课|欣赏课|聆听课|演奏课|器乐课|编创课|创编课/g, " ").replace(/\d{2}\s*分钟/g, " ");
  const note = rest.split(/[，。,;；！!？?\n]/)
    .map((clause) => clause.replace(/\s+/g, "")
      .replace(/^(明天|今天|后天|下周[一二三四五]?|这周[一二三四五]?|周[一二三四五])?(给|帮)?([一二三四五六七八九]年级[上下]?册?)?(的)?(上|讲|备)?(一节|这节)?(课)?$/, "")
      .replace(/^(明天|今天|后天|下周[一二三四五]?|这周[一二三四五]?)?(给|帮)?([一二三四五六七八九]年级[上下]?册?)?(上|讲|备)?(一节|这节)?/, ""))
    .filter((clause) => clause.length >= 2)
    .join("；");
  return { work, kind, minutes: minutes && minutes >= 10 && minutes <= 90 ? minutes : undefined, className, note: note || undefined };
}

/** 按班级情况补充的做法：只给能落到本课资源上的建议。 */
function adaptations(note: string | undefined, kind: LessonKind, hasMelody: boolean): Array<{ stage: StageKey; text: string; resources?: PlanResource[] }> {
  if (!note) return [];
  const out: Array<{ stage: StageKey; text: string; resources?: PlanResource[] }> = [];
  if (/变声/.test(note) && kind === "sing") out.push({ stage: "construct", text: "变声期男生可以低八度演唱；最高的那一句先由女生唱，男生轻声哼唱，熟悉后再一起唱。", resources: hasMelody ? [{ kind: "follow", label: "跟唱 · 难句慢练", segment: 0 }] : [] });
  if (/不敢|敢开口|敢唱|害羞|不愿意?开口|放不开/.test(note)) out.push({ stage: "construct", text: "先齐唱、再小组唱、最后自愿独唱，每一步都先表扬声音好听的地方。" });
  if (/基础.{0,3}(弱|差)|识谱.{0,3}(弱|差|困难)|不识谱|不会看谱/.test(note)) out.push({ stage: "conflict", text: "先听人声范唱、跟着旋律线用手比划高低，再看谱，不要求一开始就视唱。", resources: hasMelody ? [{ kind: "melody", label: "旋律线", segment: 0 }] : [] });
  if (/节奏(弱|差|不稳|不准)/.test(note)) out.push({ stage: "motivate", text: "增加一组节奏模仿：老师拍一小节，学生拍回来，从四分音符到八分音符逐步加难。", resources: [{ kind: "rhythm", label: "节奏训练" }] });
  if (/活泼|好动|纪律/.test(note)) out.push({ stage: "conflict", text: "每个聆听任务都配一个动作（举手、拍手、画旋律线），让学生边听边动。" });
  if (/(人数|人)多|大班/.test(note)) out.push({ stage: "construct", text: "按座位分成四组轮流演唱，老师每轮只听一组，及时点评。" });
  return out;
}

/** 本课事实与旋律 → 一节课的教案。 */
export function buildPlan(input: {
  workName: string; kind: LessonKind; grade?: number; facts: LessonFact[]; melodies?: Melody[];
  scoreUrls?: string[]; related?: string[]; minutes?: number; className?: string; note?: string;
}): LessonPlan {
  const melody = input.melodies?.[0];
  const script = regularScript({ workName: input.workName, kind: input.kind, grade: input.grade, facts: input.facts, melody });
  const hasMelody = Boolean(melody);
  const melodyRes = (label: string): PlanResource[] => hasMelody ? [{ kind: "melody", label, segment: 0 }] : [];
  const followRes = (label: string): PlanResource[] => hasMelody && input.kind !== "listen" ? [{ kind: "follow", label, segment: 0 }] : [];
  const scoreRes: PlanResource[] = input.scoreUrls?.length ? [{ kind: "score", label: "教材谱例", url: input.scoreUrls[0] }] : [];
  const listenLabel = input.kind === "sing" ? "人声范唱" : "主题旋律";
  let n = 0;
  const act = (text: string, resources: PlanResource[] = []): PlanActivity => ({ id: `a${++n}`, text, resources });

  const activities: Record<StageKey, PlanActivity[]> = {
    motivate: [
      act(`${script.warmup.title}：${script.warmup.steps.join("；")}。`, /拍|节奏/.test(script.warmup.steps.join("")) ? [{ kind: "rhythm", label: "节奏训练" }] : []),
      act(script.scene, melodyRes(listenLabel)),
    ],
    conflict: [
      act(`初听：${script.firstListen.questions.join("")}`, melodyRes(listenLabel)),
      act(`复听：${script.secondListen.join("")}`, [...melodyRes("旋律线 · 乐句"), ...scoreRes]),
    ],
    construct: [
      act(`${script.learn.title}：${script.learn.steps.join("；")}。`, followRes("跟唱")),
      act(`难点练习：${script.practiceTip}`, followRes("跟唱 · 难句慢练")),
      act(`${script.perform.title}：${script.perform.forms.join("；")}。`),
    ],
    transfer: [
      act(`${script.create.title}（分层任务，学生按能力选择）：${script.create.tasks.map((task) => `${task.level}——${task.task}`).join("")}`),
      act(script.culture, (input.related ?? []).slice(0, 3).map((work) => ({ kind: "work", label: `相关作品 · ${work}`, work }))),
    ],
    summary: [
      act(`按四项核心素养回顾，学生自评：${script.review.map((item) => item.text).join("")}`),
    ],
  };
  for (const item of adaptations(input.note, input.kind, hasMelody)) activities[item.stage].push({ ...act(item.text, item.resources ?? []), added: true });

  const stages: PlanStage[] = REGULAR_STAGES.map((stage) => ({ key: stage.key, name: stage.name, theme: stage.theme, minutes: stage.minutes, activities: activities[stage.key] }));
  return {
    workName: input.workName, kind: input.kind, grade: input.grade, className: input.className, classNote: input.note,
    standard: script.standard, goals: script.goals, focus: script.focus, homework: script.homework,
    ...fitMinutes(stages, input.minutes ?? 40),
  };
}

/** 把各环节时长按比例缩放到总课时；20 分钟以下去掉拓展创编，把时间给学习表现。 */
export function fitMinutes(stages: PlanStage[], minutes: number): { stages: PlanStage[]; minutes: number } {
  let kept = stages;
  if (minutes < 25) kept = stages.filter((stage) => stage.key !== "transfer" || stage.activities.some((item) => item.added));
  const base = kept.reduce((sum, stage) => sum + stage.minutes, 0);
  const scaled = kept.map((stage) => ({ ...stage, minutes: Math.max(2, Math.round((stage.minutes / base) * minutes)) }));
  // 四舍五入的差额补给最长的环节，保证合计等于课时。
  const diff = minutes - scaled.reduce((sum, stage) => sum + stage.minutes, 0);
  const longest = scaled.reduce((best, stage, i) => (stage.minutes > scaled[best].minutes ? i : best), 0);
  scaled[longest] = { ...scaled[longest], minutes: scaled[longest].minutes + diff };
  return { stages: scaled, minutes };
}

export type PlanIssue = {
  level: "fix" | "hint";
  /** 出问题的位置：目标序号、环节 key，或整节课。 */
  where: { goal: number } | { stage: StageKey } | { plan: true };
  text: string;
  /** 可以一键采纳的改法：替换这条目标的文字。 */
  suggestion?: string;
};

// 看不见的心理动词，和能看见、能评价的行为动词。
const VAGUE = /感受|体会|体验|感知|了解|理解|知道|懂得|掌握|欣赏|培养|激发|提高|增强|热爱/;
// 行为动词取自课标各学段的学业要求。
const OBSERVABLE = OBSERVABLE_VERBS;
// 课标放在较高学段的学业要求：1～5 年级的目标里出现时提醒老师（课标第 24–31 页）。
const ABOVE_BAND = /调式|复调|主调|指挥图式|二度创作|风格形成|创作技法|乐队.*形制/;
// 目标里的做法 → 流程里应当出现的活动。
const ALIGN: Array<{ goal: RegExp; activity: RegExp; name: string }> = [
  { goal: /聆听|听辨|欣赏/, activity: /听|聆听/, name: "聆听" },
  { goal: /演唱|唱/, activity: /唱/, name: "演唱" },
  { goal: /演奏/, activity: /奏/, name: "演奏" },
  { goal: /律动|动作/, activity: /律动|动作|拍手|拍腿/, name: "律动" },
  { goal: /编创|编配|设计/, activity: /编|设计/, name: "编创或设计" },
  { goal: /旋律线/, activity: /旋律线/, name: "画旋律线" },
];

const vagueWord = (text: string) => text.match(VAGUE)?.[0];

/** 教案检查：目标能不能看见、目标和活动是否对得上、四项素养是否齐全、时间是否合计正确。 */
export function checkPlan(plan: LessonPlan): PlanIssue[] {
  const issues: PlanIssue[] = [];
  plan.goals.forEach((goal, index) => {
    const word = vagueWord(goal.text);
    if (word && !OBSERVABLE.test(goal.text.replace(/欣赏/g, ""))) {
      issues.push({
        level: "fix", where: { goal: index },
        text: `目标里用了“${word}”，这是看不见的心理活动。你打算通过学生的什么表现来判断他“${word}”到了？`,
        suggestion: `${goal.text.replace(/[。；]$/, "")}，并能用一两句话说出自己的${goal.area === "文化理解" ? "认识" : "感受"}。`,
      });
    }
  });
  const band = bandOf(plan.grade);
  if (band <= 2) plan.goals.forEach((goal, index) => {
    const word = goal.text.match(ABOVE_BAND)?.[0];
    if (word) issues.push({ level: "hint", where: { goal: index }, text: `“${word}”在${STANDARD}里是更高学段的学业要求，${BAND_NAMES[band]}的学生可以先不要求。` });
  });
  const allText = plan.stages.flatMap((stage) => stage.activities.map((item) => item.text)).join("");
  plan.goals.forEach((goal, index) => {
    for (const rule of ALIGN) {
      if (rule.goal.test(goal.text) && !rule.activity.test(allText)) {
        issues.push({ level: "fix", where: { goal: index }, text: `目标写了“${rule.name}”，但流程里没有安排${rule.name}的活动。` });
      }
    }
  });
  const missing = LITERACIES.filter((area) => !plan.goals.some((goal) => goal.area === area && goal.text.trim()));
  if (missing.length) issues.push({ level: "fix", where: { plan: true }, text: `四项核心素养里缺少${missing.join("、")}的目标。` });
  const total = plan.stages.reduce((sum, stage) => sum + stage.minutes, 0);
  if (total !== plan.minutes) issues.push({ level: "fix", where: { plan: true }, text: `各环节合计 ${total} 分钟，和课时 ${plan.minutes} 分钟对不上。` });
  for (const stage of plan.stages) {
    if (!stage.activities.some((item) => item.text.trim())) issues.push({ level: "fix", where: { stage: stage.key }, text: `“${stage.name}”环节还没有活动。` });
    if (stage.minutes > plan.minutes * 0.5) issues.push({ level: "hint", where: { stage: stage.key }, text: `“${stage.name}”占了一半以上的时间，其他环节会比较赶。` });
  }
  if (!plan.stages.some((stage) => stage.key === "transfer") && plan.goals.some((goal) => goal.area === "创意实践")) {
    issues.push({ level: "hint", where: { plan: true }, text: "课时较短，去掉了拓展创编环节；创意实践目标可以放进作业，或留到下节课。" });
  }
  if (plan.kind === "sing" && !/范唱|跟唱|听/.test(plan.stages.find((stage) => stage.key === "construct")?.activities.map((item) => item.text).join("") ?? "")) {
    issues.push({ level: "hint", where: { stage: "construct" }, text: "学唱环节没有安排听范唱或跟唱，学生可能找不到音准。" });
  }
  return issues;
}

/** 教案转成纯文字，方便复制到 Word 或备课本。 */
export function planText(plan: LessonPlan) {
  const work = plan.workName.startsWith("《") ? plan.workName : `《${plan.workName}》`;
  const lines = [
    `${work} · ${LESSON_KINDS[plan.kind]} · ${plan.minutes} 分钟${plan.className ? ` · ${plan.className}` : ""}`,
    ...(plan.standard ? [`课标依据：${plan.standard.band} · 学习任务“${plan.standard.task}”（${STANDARD}第 ${plan.standard.page} 页）`] : []),
    ...(plan.classNote ? [`班级情况：${plan.classNote}`] : []),
    "", "教学目标",
    ...plan.goals.map((goal, i) => `${i + 1}. ${goal.area}：${goal.text}`),
    "", `教学重点：${plan.focus.key}`, `教学难点：${plan.focus.hard}`, "", "教学过程",
  ];
  for (const stage of plan.stages) {
    lines.push(`【${stage.name}】${stage.minutes} 分钟`);
    stage.activities.forEach((item, i) => lines.push(`${i + 1}. ${item.text}${item.resources.length ? `（资源：${item.resources.map((res) => res.label).join("、")}）` : ""}`));
  }
  lines.push("", `作业：${plan.homework}`);
  return lines.join("\n");
}
