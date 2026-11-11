// 智能备课：把老师的一句话读成备课要求，用常规课脚本搭出整节课，再按要求调整；教案检查逐条指出目标、活动、时间上的问题。
// 教案里的音乐内容（旋律、人声范唱、跟唱、谱例）只引用芽谱已有的资源，文字可以由老师或 AI 改写，资源不能凭空出现。
import type { Melody } from "./jianpu";
import { LESSON_KINDS, cultureFacts, elementFacts, type LessonFact, type LessonKind, type StageKey } from "./reflective";
import { LITERACIES, REGULAR_STAGES, cn, regularScript, type Literacy } from "./regular";
import { BAND_NAMES, OBSERVABLE_VERBS, STANDARD, bandOf } from "./curriculum";
import { matchesVolume, requestedVolumes } from "../ai/book-volume";

/** 教案里能点开的资源：都指向本课已有的数据。 */
export type PlanResource =
  | { kind: "melody"; label: string; segment: number }
  | { kind: "follow"; label: string; segment: number }
  | { kind: "score"; label: string; url: string }
  | { kind: "rhythm"; label: string }
  | { kind: "work"; label: string; work: string };

export type PlanActivity = {
  id: string;
  /** 师生活动，一行一条：教师怎样做、学生做什么。 */
  text: string;
  resources: PlanResource[];
  /** 按班级情况加的建议 */
  added?: boolean;
  /** 这一步的名称，和上课模式（常规课）课件的页名一致。 */
  title?: string;
  /** 设计意图：为什么这样安排。 */
  intent?: string;
};
export type PlanStage = { key: StageKey; name: string; theme: string; minutes: number; activities: PlanActivity[] };
export type LessonPlan = {
  /** 2 = 详细版（教材分析、师生活动、设计意图、板书）；没有这个字段的是旧版简案。 */
  version?: 2;
  /** 教材分析与学情分析。 */
  analysis?: { textbook: string; students: string };
  /** 教学准备，一行一项。 */
  prepare?: string;
  /** 板书设计，一行一条。 */
  board?: string;
  homeworkIntent?: string;
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

/** An explicit textbook volume takes precedence over the open book. */
export function resolvePlanRequest(
  text: string, currentBook: string, bookKeys: readonly string[], worksOf: (bookKey: string) => string[],
): { bookKey: string; request: PlanRequest & { work: string } } | { message: string } {
  // Keep lesson titles, weekdays and phrases like 给四年级上课 out of volume matching.
  const scopeText = text.normalize("NFKC")
    .replace(/《[^》]*》|(?:星期|礼拜|周)[一二三四五六日天1-7]/g, " ")
    .replace(/初(?:中)?([一二三123])/g, (_, grade: string) => String(6 + (Number(grade) || "一二三".indexOf(grade) + 1)))
    .replace(/年级\s*[上下](?!\s*\(?(?:册|学期))/g, "年级");
  const volumes = [...new Set(requestedVolumes(scopeText).filter((volume) => !volume.endsWith("s")))];
  if (volumes.length > 1) return { message: "请指定一册教材，再生成这节课的教案。" };
  const candidates = bookKeys.filter((key) => matchesVolume(key, volumes));
  if (volumes.length && !candidates.length) return { message: "当前教材版本没有你指定的分册，请核对年级和上下册。" };
  const ordered = candidates.includes(currentBook) ? [currentBook, ...candidates.filter((key) => key !== currentBook)] : candidates;
  for (const bookKey of ordered) {
    const request = parseRequest(text, worksOf(bookKey));
    if (request.work) return { bookKey, request: { ...request, work: request.work } };
  }
  return { message: volumes.length
    ? "指定分册里没有找到这个课题，请核对册别和课题名。"
    : "没有在教材里找到这句话提到的课题，请在下面选择课题。" };
}

/** 按班级情况补充的做法：只给能落到本课资源上的建议。 */
function adaptations(note: string | undefined, kind: LessonKind, hasMelody: boolean): Array<{ stage: StageKey; title: string; text: string; intent: string; resources?: PlanResource[] }> {
  if (!note) return [];
  const out: Array<{ stage: StageKey; title: string; text: string; intent: string; resources?: PlanResource[] }> = [];
  if (/变声/.test(note) && kind === "sing") out.push({ stage: "construct", title: "照顾变声期", text: "变声期男生可以低八度演唱；最高的那一句先由女生唱，男生轻声哼唱，熟悉后再一起唱。", intent: "变声期的嗓音容易疲劳，在舒适的音区轻声唱，既保护嗓子，也让学生不因为唱不上去而不愿开口。", resources: hasMelody ? [{ kind: "follow", label: "跟唱 · 难句慢练", segment: 0 }] : [] });
  if (/不敢|敢开口|敢唱|害羞|不愿意?开口|放不开/.test(note)) out.push({ stage: "construct", title: "鼓励开口", text: "先齐唱、再小组唱、最后自愿独唱，每一步都先表扬声音好听的地方。", intent: "从人多到人少逐步过渡，把“被听见”的压力降到最低；先肯定再提要求，帮学生建立开口的信心。" });
  if (/基础.{0,3}(弱|差)|识谱.{0,3}(弱|差|困难)|不识谱|不会看谱/.test(note)) out.push({ stage: "conflict", title: "降低识谱门槛", text: "先听人声范唱、跟着旋律线用手比划高低，再看谱，不要求一开始就视唱。", intent: "先用耳朵和身体感受旋律的高低走向，再对应到谱面，识谱基础弱的学生也跟得上。", resources: hasMelody ? [{ kind: "melody", label: "旋律线", segment: 0 }] : [] });
  if (/节奏(弱|差|不稳|不准)/.test(note)) out.push({ stage: "motivate", title: "加一组节奏模仿", text: "增加一组节奏模仿：老师拍一小节，学生拍回来，从四分音符到八分音符逐步加难。", intent: "节奏不稳的班先把拍子立住，后面的演唱和合作才对得齐。", resources: [{ kind: "rhythm", label: "节奏训练" }] });
  if (/活泼|好动|纪律/.test(note)) out.push({ stage: "conflict", title: "边听边动", text: "每个聆听任务都配一个动作（举手、拍手、画旋律线），让学生边听边动。", intent: "给好动的学生一个正当的动作出口，把注意力留在音乐上。" });
  if (/(人数|人)多|大班/.test(note)) out.push({ stage: "construct", title: "分组轮唱", text: "按座位分成四组轮流演唱，老师每轮只听一组，及时点评。", intent: "人数多时全班齐唱听不出问题，分组后每个学生都有被听到、被点评的机会。" });
  return out;
}

// 各学段学生的一般特点，写进学情分析；班级的具体情况由老师补充。
const BAND_LEARNERS: Record<number, string> = {
  1: "以形象思维为主，好动、爱模仿，注意力保持的时间短，适合在律动、游戏和模仿中学习；识谱刚刚起步，学歌以听唱为主。",
  2: "有了一定的歌唱和识谱基础，乐于合作和表现，能在老师引导下听辨情绪、速度、节拍等音乐要素，但独立分析和视唱还需要支架。",
  3: "抽象思维逐步发展，能分析音乐要素与情绪的关系；部分学生进入变声期，自我意识增强，当众演唱容易拘谨，需要安全、鼓励的氛围。",
  4: "有一定的音乐积累和分析能力，愿意通过讨论、比较表达自己的见解；变声期学生较多，演唱要注意音区和嗓音保护。",
};

// 小测验里能直接问的事实；答案只取教材数据里有的。
const QUIZ_FACTS: Array<{ test: RegExp; ask: (work: string) => string }> = [
  { test: /^拍号$/, ask: (w) => `${w}是几拍子的？` },
  { test: /^调号$/, ask: (w) => `${w}的调号是什么？` },
  { test: /^(词曲作者|作曲)$/, ask: (w) => `${w}的曲作者是谁？` },
  { test: /^曲式结构$/, ask: (w) => `${w}是什么曲式结构？` },
  { test: /^所属民族$/, ask: (w) => `${w}是哪个民族的音乐？` },
  { test: /^演唱形式$/, ask: (w) => `教材中${w}的演唱形式是什么？` },
  { test: /^速度$/, ask: (w) => `${w}的速度标记是什么？` },
];
const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩";
const strip = (text: string) => text.replace(/[。；]$/, "");
const numbered = (items: string[]) => items.map((item, i) => `${CIRCLED[i] ?? `${i + 1}.`} ${strip(item)}`);

/** 本课事实与旋律 → 一节课的详案：教材与学情分析、教学准备、逐步的师生活动与设计意图、板书和作业。
 *  每一步对应上课模式（常规课）课件的一页，课件上给学生看的任务原样写进教案。 */
export function buildPlan(input: {
  workName: string; kind: LessonKind; grade?: number; facts: LessonFact[]; melodies?: Melody[];
  scoreUrls?: string[]; related?: string[]; minutes?: number; className?: string; note?: string; bookTitle?: string;
}): LessonPlan {
  const melody = input.melodies?.[0];
  const { kind, facts } = input;
  const script = regularScript({ workName: input.workName, kind, grade: input.grade, facts, melody });
  const work = input.workName.startsWith("《") ? input.workName : `《${input.workName}》`;
  const band = bandOf(input.grade);
  const young = band === 1;
  const solemn = /国歌|队歌|国际歌/.test(work);
  const hasMelody = Boolean(melody);
  const hasScore = Boolean(input.scoreUrls?.length);
  const shape = script.shape;
  const elements = elementFacts(facts);
  const culture = cultureFacts(facts);
  const melodyRes = (label: string): PlanResource[] => hasMelody ? [{ kind: "melody", label, segment: 0 }] : [];
  const followRes = (label: string): PlanResource[] => hasMelody && kind !== "listen" ? [{ kind: "follow", label, segment: 0 }] : [];
  const scoreRes: PlanResource[] = hasScore ? [{ kind: "score", label: "教材谱例", url: input.scoreUrls![0] }] : [];
  const listenLabel = kind === "sing" ? "人声范唱" : "主题旋律";
  const verb = kind === "play" ? "奏" : "唱";
  let n = 0;
  const act = (title: string, lines: Array<string | null | false | undefined>, intent: string, resources: PlanResource[] = []): PlanActivity =>
    ({ id: `a${++n}`, title, text: lines.filter(Boolean).join("\n"), intent, resources });

  const warmupText = script.warmup.steps.join("");
  const quiz = QUIZ_FACTS.flatMap((spec) => {
    const fact = facts.find((item) => spec.test.test(item.label));
    return fact && fact.value && fact.value.length <= 16 ? [{ ask: spec.ask(work), answer: fact.value }] : [];
  }).slice(0, 4);

  const activities: Record<StageKey, PlanActivity[]> = {
    motivate: [
      act(script.warmup.title, [
        { sing: "教师：用琴声或口令组织上课；每一项先示范，再带全班做，提醒坐姿和轻声发声。",
          play: "教师：逐项示范，巡视并纠正持乐器的姿势和手型。",
          listen: "教师：用轻声的口令让教室安静下来，说明聆听时的约定。",
          create: "教师：先示范一遍，再把节奏交给学生接龙，全程保持稳定的速度。" }[kind],
        "学生：",
        ...numbered(script.warmup.steps),
      ], {
        sing: young
          ? "用律动和模仿把注意力集中到音乐上；先拍出本课拍子的强弱，为演唱做好节拍准备；轻声哼唱打开声音、保护嗓子。"
          : "呼吸和发声练习帮学生找到气息的支点、打开声音；拍出本课拍子的强弱，为演唱做好节拍准备。",
        play: "先检查姿势、吹（弹）长音，把音色和气息稳住；拍出本课的拍子，为后面对齐速度做准备。",
        listen: "先安静下来再听，是聆听的前提；约定“主题出现就举手”，让学生带着任务、用动作参与聆听。",
        create: "节奏接龙既是热身，也是积累素材；用不同的身体声音拍同一个节奏，为后面的编创打开思路。",
      }[kind], /拍|节奏/.test(warmupText) ? [{ kind: "rhythm", label: "节奏训练" }] : []),
      act("情境导入 · 完整初听", [
        `教师：出示课题，说导入语——“${script.scene}”`,
        hasMelody ? `教师：完整播放一遍${listenLabel}，中途不打断、不讲解。` : "教师：完整范唱（范奏）或播放录音一遍，中途不打断、不讲解。",
        "学生：安静、完整地听一遍；听完用一句话说出自己的第一印象。",
      ], "从完整的聆听开始，让学生先对作品有一个整体印象；不急着讲解，把“听到了什么”留给学生自己说，保护他们的第一感受，也激发往下学的兴趣。", melodyRes(listenLabel)),
    ],
    conflict: [
      act("初听感受", [
        "教师：再播放一遍，提出下面的问题；学生回答时，在课件的感知表上点选对应的词，并追问依据。",
        ...script.firstListen.questions.map((question) => `提问：${question}`),
        "学生：带着问题听，从下面的词里选出自己的判断，再说一说理由。",
        ...script.firstListen.rows.map((row) => `${row.label}：${row.options.join("／")}`),
        elements.length > 0 && `教师参考（教材标注）：${elements.map((fact) => `${fact.label} ${fact.value}`).join("，")}。`,
      ], `带着问题听，聆听才有方向；给出可选的词，降低表达的门槛，让每个学生都能说出自己的判断；追问“从哪里听出来的”，把感受落到具体的音乐要素上（审美感知）。${kind === "listen" ? "全程以听赏为主、讲解讨论为辅（课标第 27 页）。" : ""}`, melodyRes(listenLabel)),
      act("复听分析", [
        `教师：${hasScore ? "出示教材谱例，" : ""}第三次播放；逐条提出下面的任务，每一条都给学生留出听和想的时间。`,
        `学生：${hasScore ? "边听边看谱，" : "边听边拍，"}依次完成——`,
        ...numbered(script.secondListen),
      ], {
        sing: "从整体感受走到乐句、节拍、旋律走向这些具体的要素：找出相同和相似的乐句，分句学唱时负担就轻了；拍出强拍，建立稳定的节拍感；找到旋律的最高点，体会它和情绪的关系。",
        play: "动手之前先在谱面上认清乐句、难点节奏和换气（换把）的位置，做到心里有数。",
        listen: "分段、分要素地听：数主题出现的次数，比较各段的速度、力度和音色，理解音乐要素怎样表现情绪和内容。",
        create: "分析素材的节奏型和旋律走向，知道它为什么给人这种感觉，后面的编创才有依据。",
      }[kind], [...melodyRes("旋律线 · 乐句"), ...scoreRes]),
    ],
    construct: [
      act(script.learn.title, [
        { sing: "教师：按下面的步骤带学，每一步先示范或播放人声范唱；学生唱的时候少唱多听，发现问题当场单句纠正。",
          play: "教师：逐步示范，慢速带奏；巡视并个别指导指法和气息。",
          listen: "教师：分段播放，每段听完只问一两个问题，把时间留给聆听。",
          create: "教师：说明每一步要完成什么、用多长时间；巡视各组，给出具体的建议。" }[kind],
        "学生：",
        ...numbered(script.learn.steps),
      ], {
        sing: young
          ? "先听后唱、先哼后词、一句一句地学，符合低年级学生以听唱和模仿为主的特点；手势和图形谱把看不见的音高变成看得见的高低。"
          : "先听后唱：从完整聆听、模唱，到唱谱、读词、填词，由感性体验走向理性认知，再到实践运用（课标第 31 页）；步子小、台阶清楚，学生每一步都做得到。",
        play: "先唱后奏，心里有了旋律再上手；慢速、分句，一句会了再连下一句，避免带着错误练熟。",
        listen: "记住主题是听懂作品的抓手；以听赏为主、讲解讨论为辅（课标第 27 页），用哼唱、律动和画旋律线让学生参与到音乐里。",
        create: "按“动机—构思—创作—试演”的顺序编创（课标第 39 页）：先想清楚要表现什么，再动手写，并用谱记录下来。",
      }[kind], followRes("跟唱")),
      ...(hasMelody || hasScore ? [act("难点突破", [
        `教师：指出本课难点——${strip(script.focus.hard)}。`,
        `师生：${script.practiceTip}`,
        kind === "listen" ? "教师：请几位学生哼一哼主题，全班听一听哼得像不像。" : `教师：请个别学生或小组单独${verb}难点句，全班听评“准不准、稳不稳”，再集体巩固一遍。`,
      ], kind === "listen"
        ? "主题听熟了、能哼出来，后面的分段聆听才跟得上。"
        : `把难点从全曲里单独拿出来，放慢、分解、反复，${verb}准以后再放回原速，避免整首一遍遍过、却始终卡在同一处。`,
      kind === "listen" ? melodyRes("主题旋律") : followRes("跟唱 · 难句慢练"))] : []),
      act(script.perform.title, [
        "教师：说明每种形式的要求并分好组；逐组倾听，当场给出具体的点评。",
        "学生：",
        ...numbered(script.perform.forms),
      ], {
        sing: solemn
          ? "仪式歌曲重在规范和庄严：从站姿、声音到精神面貌提出明确要求，让学生懂得演唱的场合与礼仪。"
          : "用接唱、律动、打击乐伴奏等形式反复演唱，在变化中巩固，避免机械重复；互评让学生学会按标准倾听同伴的演唱（艺术表现）。",
        play: "分组、合作、加入力度变化，让学生在合奏中学会倾听和配合，把“奏对”提高到“奏好”。",
        listen: "用哼唱、律动、画旋律线把听到的音乐表现出来，检验是否真正听进去了。",
        create: "展示、互评、修改是编创不可缺少的后半程（课标第 39 页）：在别人的反馈里发现问题，再改一遍。",
      }[kind]),
    ],
    transfer: [
      act(script.create.title, [
        "教师：出示三个层次的任务，学生自选一项，限时完成；巡视时帮基础组起步、给拓展组提更高的要求，最后请两三位（组）展示。",
        "学生：选一项完成——",
        ...script.create.tasks.map((task) => `${task.level}：${task.task}`),
      ], solemn && kind === "sing"
        ? "仪式歌曲不做改编，拓展落在礼仪、由来和使用场合上，加深对作品意义的理解。"
        : "分层任务让不同基础的学生都有能完成、又有一点挑战的事可做；在伴奏、动作、歌词或演奏方式的设计里运用本课学到的内容（创意实践）。"),
      act("走近作品", [
        `教师：提出话题——${script.culture}`,
        ...culture.map((fact) => `教师补充（教材资料）：${fact.label}——${fact.value}`),
        "学生：联系自己的生活经验说一说；同桌先交流，再请两三位同学分享。",
      ], "把作品放回它产生的生活和文化里去理解；让学生联系自己的经验来表达，文化理解才不会变成背结论。",
      (input.related ?? []).slice(0, 3).map((item) => ({ kind: "work", label: `相关作品 · ${item}`, work: item }))),
    ],
    summary: [
      ...(quiz.length ? [act("小测验", [
        "教师：逐题出示，学生举手或用手势作答，再揭示答案；答错多的题，回到谱例或录音里再确认一次。",
        ...quiz.map((item, i) => `${i + 1}. ${item.ask}（答案：${item.answer}）`),
      ], "用几道小题做即时评价，看核心知识是否落实；答案都能在谱例和聆听里找到依据。")] : []),
      act("课堂小结 · 自评", [
        "教师：带学生按四项核心素养回顾这节课；每一项请学生给自己打一到三颗星，教师用一两句话小结，表扬具体的进步。",
        "学生：对照下面四句话自评——",
        ...script.review.map((item) => `${item.area}：${item.text}`),
      ], "按四项核心素养回顾，让学生清楚这节课学了什么、自己做到了多少；自评培养反思的习惯，也给教师调整下一节课留下依据。"),
    ],
  };
  for (const item of adaptations(input.note, kind, hasMelody)) activities[item.stage].push({ ...act(item.title, [item.text], item.intent, item.resources ?? []), added: true });

  // 教材分析：只写教材数据和旋律数据里有的内容。
  const credits = facts.filter((fact) => /^(作词|作曲|词曲作者|词曲|填词|编曲|改编|译配|编配)$/.test(fact.label) && fact.value && fact.value.length <= 24);
  const textbook = [
    `${work}${input.bookTitle ? `选自${input.bookTitle}` : ""}，本课按${LESSON_KINDS[kind]}来上。`,
    credits.length > 0 && `${credits.map((fact) => `${fact.label}：${fact.value}`).join("；")}。`,
    elements.length > 0 && `教材标注：${elements.map((fact) => `${fact.label} ${fact.value}`).join("，")}。`,
    shape && `主旋律${shape.count > 10 ? "篇幅较长" : `共${cn(shape.count)}句`}${melody ? `、${melody.bars.length} 小节` : ""}${shape.repeat ? `，第${cn(shape.repeat[0])}句和第${cn(shape.repeat[1])}句旋律相同` : ""}${shape.peak ? `，旋律的最高点在第 ${shape.peak.bar} 小节` : ""}${shape.hard ? `；第${cn(shape.hard.index)}句${shape.lines[shape.hard.index - 1] ? `「${shape.lines[shape.hard.index - 1]}」` : ""}${shape.hard.reason}，是${kind === "listen" ? "听辨" : `学${verb}`}的难点` : ""}。`,
    ...culture.map((fact) => `${fact.label}：${fact.value}${/[。！？]$/.test(fact.value) ? "" : "。"}`),
    !credits.length && !elements.length && !shape && !culture.length && "教材数据里这首作品的标注较少，请老师结合教材补充。",
  ].filter(Boolean).join("\n");
  const students = [
    `${BAND_NAMES[band]}的学生${BAND_LEARNERS[band]}`,
    input.note ? `本班情况：${strip(input.note)}。教学过程里标有“按班级情况”的步骤就是针对这些情况加的。` : "本班情况：请老师补充（在上面的“班级情况”里写一句，重新生成后会加上对应的做法）。",
  ].join("\n");
  const prepare = [
    "课件：芽谱「上课模式 · 常规课」，页面和本教案的步骤一一对应。",
    hasMelody ? (kind === "listen" ? "音频：主题旋律播放（芽谱本课自带）。" : `音频：${kind === "sing" ? "人声范唱、" : ""}旋律播放和「跟唱」（芽谱本课自带，可调速度）。`) : "音频：芽谱暂时没有本课的旋律，请准备范唱（范奏）或录音。",
    hasScore && "谱例：教材谱例（芽谱本课自带，可投屏）。",
    "乐器：钢琴或电子琴。",
    kind === "sing" && !solemn && (young ? "打击乐器：碰铃或双响筒。" : "打击乐器：双响筒、沙锤。"),
    kind === "play" && "课堂乐器：学生人手一件。",
    kind === "listen" && young && "画纸和彩笔：画出听到的音乐。",
    kind === "create" && "记录单：纸笔，或简谱、图形谱记录单。",
  ].filter(Boolean).join("\n");
  const elementLine = elements.filter((fact) => /调号|拍号|速度/.test(fact.label)).map((fact) => fact.value).join("　");
  const moodFact = elements.find((fact) => fact.label === "情绪");
  const board = [
    work,
    elementLine,
    moodFact && `情绪：${moodFact.value}`,
    shape && shape.count <= 10 && `结构：共${cn(shape.count)}句${shape.repeat ? `，第${cn(shape.repeat[0])}句 = 第${cn(shape.repeat[1])}句` : ""}`,
    shape?.peak && `最高点：第 ${shape.peak.bar} 小节`,
    `难点：${strip(script.focus.hard)}`,
  ].filter(Boolean).join("\n");
  const homeworkIntent = {
    sing: "唱给家人听或录音回听，在真实的表达里巩固所学，也学着倾听自己的声音。",
    play: "每天短时间、有重点地练，比一次练很久更有效。",
    listen: "向家人介绍作品，是对聆听所得的一次整理和表达。",
    create: "留出修改的时间，让学生体会到作品是改出来的。",
  }[kind];

  const stages: PlanStage[] = REGULAR_STAGES.map((stage) => ({ key: stage.key, name: stage.name, theme: stage.theme, minutes: stage.minutes, activities: activities[stage.key] }));
  return {
    version: 2, workName: input.workName, kind, grade: input.grade, className: input.className, classNote: input.note,
    standard: script.standard, analysis: { textbook, students }, prepare, goals: script.goals, focus: script.focus,
    board, homework: script.homework, homeworkIntent,
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
    const bare = stage.activities.filter((item) => item.title && item.text.trim() && !item.intent?.trim()).length;
    if (bare) issues.push({ level: "hint", where: { stage: stage.key }, text: `“${stage.name}”有 ${bare} 步还没有写设计意图。` });
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
  const NUM = "一二三四五六七八九十";
  let section = 0;
  const head = (name: string) => ["", `${NUM[section++] ?? section}、${name}`];
  const lines = [
    `${work}教学设计`,
    `${LESSON_KINDS[plan.kind]} · ${plan.minutes} 分钟${plan.className ? ` · ${plan.className}` : ""}`,
    ...(plan.standard ? [`课标依据：${plan.standard.band} · 学习任务“${plan.standard.task}”（${STANDARD}第 ${plan.standard.page} 页）`] : []),
    ...(plan.classNote && !plan.analysis ? [`班级情况：${plan.classNote}`] : []),
    ...(plan.analysis?.textbook.trim() ? [...head("教材分析"), plan.analysis.textbook.trim()] : []),
    ...(plan.analysis?.students.trim() ? [...head("学情分析"), plan.analysis.students.trim()] : []),
    ...head("教学目标"),
    ...plan.goals.map((goal, i) => `${i + 1}. ${goal.area}：${goal.text}`),
    ...head("教学重难点"), `教学重点：${plan.focus.key}`, `教学难点：${plan.focus.hard}`,
    ...(plan.prepare?.trim() ? [...head("教学准备"), plan.prepare.trim()] : []),
    ...head("教学过程"),
  ];
  plan.stages.forEach((stage, s) => {
    lines.push("", `（${NUM[s] ?? s + 1}）${stage.name}（${stage.theme}）　${stage.minutes} 分钟`);
    stage.activities.forEach((item, i) => {
      const res = item.resources.length ? `（资源：${item.resources.map((entry) => entry.label).join("、")}）` : "";
      if (item.title) lines.push(`${i + 1}. ${item.title}${item.added ? "（按班级情况）" : ""}${res}`, item.text);
      else lines.push(`${i + 1}. ${item.text}${res}`);
      if (item.intent?.trim()) lines.push(`【设计意图】${item.intent.trim()}`);
    });
  });
  if (plan.board?.trim()) lines.push(...head("板书设计"), plan.board.trim());
  lines.push(...head("作业"), plan.homework);
  if (plan.homeworkIntent?.trim()) lines.push(`【设计意图】${plan.homeworkIntent.trim()}`);
  return lines.join("\n");
}
