// 反思型课堂（动机激发 → 认知冲突 → 协同建构 → 应用迁移 → 总结升华）的标准课件脚本。
// 依据《反思型中小学音乐课堂教学设计模板（通用版）》：每个阶段有固定的环节、建议时长和“共同反思要点”，
// 提问和任务按课型（歌唱课 / 欣赏课 / 编创课）取模板中的示例，并填入本课作品名与教材事实。
// 这里只生成文字脚本；页面上的谱例、旋律、插图由 ReflectivePresent 按数据有无决定是否出现。

export type LessonKind = "sing" | "listen" | "create";
export type StageKey = "motivate" | "conflict" | "construct" | "transfer" | "summary";
export type LessonFact = { label: string; value: string };

export const LESSON_KINDS: Record<LessonKind, string> = { sing: "歌唱课", listen: "欣赏课", create: "编创课" };

export const STAGES: Array<{ key: StageKey; name: string; theme: string; minutes: number }> = [
  { key: "motivate", name: "动机激发", theme: "反思铺垫", minutes: 5 },
  { key: "conflict", name: "认知冲突", theme: "反思探究", minutes: 12 },
  { key: "construct", name: "协同建构", theme: "反思深化", minutes: 15 },
  { key: "transfer", name: "应用迁移", theme: "反思拓展", minutes: 10 },
  { key: "summary", name: "共同反思", theme: "总结升华", minutes: 3 },
];

const SING_MODES = /小小歌唱家|唱歌|演唱|视唱|背唱|印在心里的歌/;
const CREATE_MODES = /创乐工坊|编创|创编/;
const SONG_TYPES = /歌曲|民歌|号子|童谣|合唱|戏曲歌曲/;

/** 课型：先看教材栏目，再看作品类型；老师可以在课件里改。 */
export function lessonKindOf(mode: string | undefined, workType: string): LessonKind {
  if (mode && CREATE_MODES.test(mode)) return "create";
  if (mode && SING_MODES.test(mode)) return "sing";
  if (mode && /万花筒|聆听|欣赏|故事|考古/.test(mode)) return "listen";
  return SONG_TYPES.test(workType) ? "sing" : "listen";
}

/** 学段：低年级（1–2）、中高年级（3–6）、初中（7–9）。 */
export function stageOfGrade(grade: number | undefined): "low" | "mid" | "junior" {
  if (!grade || grade <= 2) return grade ? "low" : "mid";
  return grade <= 6 ? "mid" : "junior";
}

const pick = (facts: LessonFact[], pattern: RegExp) => facts.find((fact) => pattern.test(fact.label))?.value;

/** 课件里可以直接展示的音乐要素（只取教材数据里有的）。 */
export function elementFacts(facts: LessonFact[]): LessonFact[] {
  const wanted: Array<[string, RegExp]> = [
    ["调号", /^调号$/], ["拍号", /^拍号$/], ["速度", /^(速度|速度术语)$/], ["情绪", /情绪|表现情感|情感特点/],
    ["体裁", /音乐体裁|民歌体裁/], ["演唱形式", /^(演唱形式|演奏形式)$/], ["民族", /所属民族/], ["地域", /^(地域|所属地域)$/],
  ];
  return wanted.flatMap(([label, pattern]) => {
    const value = pick(facts, pattern);
    return value && value.length <= 24 ? [{ label, value }] : [];
  });
}

/** 文化理解的线索：背景、民族、地域、表现主题。 */
export function cultureFacts(facts: LessonFact[]): LessonFact[] {
  return facts
    .filter((fact) => /背景|所属民族|地域|表现主题|创作|选自|出处|内容/.test(fact.label) && !/谱例|乐谱|旋律片段/.test(fact.label + fact.value) && fact.value.length <= 80)
    .slice(0, 3);
}

export type ReflectiveScript = {
  kind: LessonKind;
  scene: string;
  goals: Array<{ area: string; text: string }>;
  questionStarters: string[];
  perceive: { task: string; rows: Array<{ label: string; options: string[] }> };
  conflicts: string[];
  selfReflect: string[];
  groupTask: string;
  roles: Array<{ role: string; duty: string }>;
  practiceTip: string;
  chain: string[];
  transfer: Array<{ level: string; task: string }>;
  showcase: string[];
  selfCheck: string[];
  wrapUp: string[];
  homework: string;
};

/** 按课型、学段与本课事实生成整节课的文字脚本。 */
export function reflectiveScript(input: { workName: string; kind: LessonKind; grade?: number; facts: LessonFact[] }): ReflectiveScript {
  const { kind, facts } = input;
  const work = input.workName.startsWith("《") ? input.workName : `《${input.workName}》`;
  const level = stageOfGrade(input.grade);
  const meter = pick(facts, /^拍号$/);
  const mood = pick(facts, /情绪|表现情感|情感特点/);
  const nation = pick(facts, /所属民族/);
  const place = pick(facts, /^(地域|所属地域)$/);
  const origin = nation ? `${nation}音乐` : place ? `${place}的音乐` : "这首作品的文化背景";
  const playful = level === "low";

  const goals = {
    sing: [
      { area: "审美感知", text: `听辨${work}的旋律、节奏和情绪${mood ? `，说出它“${mood}”的感觉从哪里来` : "，说出自己的感受"}。` },
      { area: "艺术表现", text: `用自然、有弹性的声音唱好${work}，做到音准、节奏准确，表达出歌曲的情感。` },
      { area: "创意实践", text: "尝试用不同的速度、力度或情绪演唱一个乐句，比较效果并说出理由。" },
      { area: "文化理解", text: `了解${origin}，体会音乐和生活、文化的联系。` },
    ],
    listen: [
      { area: "审美感知", text: `聆听${work}，辨识旋律、节奏、音色和情绪的变化。` },
      { area: "艺术表现", text: "用哼唱、模唱或身体动作表现作品的主题片段。" },
      { area: "创意实践", text: "选一个最喜欢的片段，用文字、绘画或动作做出自己的诠释。" },
      { area: "文化理解", text: `了解${origin}，说出音乐表达了怎样的生活与情感。` },
    ],
    create: [
      { area: "审美感知", text: "感受节奏、旋律变化带来的不同情绪。" },
      { area: "艺术表现", text: "清楚地演示自己小组的编创成果，说明创作思路。" },
      { area: "创意实践", text: `以${work}为素材完成一段简单的节奏或旋律编创，并在反思中不断修改。` },
      { area: "文化理解", text: "体会音乐编创和生活场景、情感表达之间的关系。" },
    ],
  }[kind];

  const scene = {
    sing: playful ? `先听一听${work}，跟着音乐轻轻拍手，想一想：歌里唱了什么？` : `聆听${work}的示范演唱，说一说：歌曲给你留下的第一印象是什么？`,
    listen: `闭上眼睛完整聆听${work}的片段，想象音乐描绘了怎样的画面。`,
    create: `听一听${work}，找一找里面最有特点的节奏，想一想生活里哪里也有这样的节奏。`,
  }[kind];

  const perceive = {
    sing: { task: "跟着旋律轻声模唱，标出唱得不稳的地方。", rows: [
      { label: "情绪", options: ["欢快", "抒情", "优美", "雄壮", "活泼", "深情"] },
      { label: "速度", options: ["慢", "稍慢", "中速", "稍快", "快"] },
      { label: "旋律", options: ["级进为主", "跳进较多", "起伏平稳", "起伏较大"] },
      { label: "难点", options: ["音准", "节奏", "换气", "高音", "咬字"] },
    ] },
    listen: { task: "完整聆听，记录旋律、节奏和情绪的变化。", rows: [
      { label: "情绪", options: ["欢快", "抒情", "庄严", "激昂", "幽默", "宁静"] },
      { label: "速度", options: ["慢", "中速", "快", "有变化"] },
      { label: "力度", options: ["弱", "中强", "强", "渐强渐弱"] },
      { label: "音色", options: ["人声", "弦乐", "管乐", "打击乐", "民族乐器"] },
    ] },
    create: { task: "用给出的节奏型试着编一小段，记录遇到的困难。", rows: [
      { label: "节奏型", options: ["X X", "X X X X", "X. X", "X — "] },
      { label: "情绪", options: ["欢快", "抒情", "神秘", "紧张"] },
      { label: "速度", options: ["慢", "中速", "快"] },
      { label: "困难", options: ["不知从哪开始", "节奏不稳", "和主题不贴", "难以记录"] },
    ] },
  }[kind];

  const conflicts = {
    sing: [
      `${work}里哪一句最容易唱跑调或唱不稳？为什么？`,
      meter ? `这首歌是 ${meter} 拍，如果换一种拍子来唱，感觉会有什么不同？` : "如果把速度唱得很快或很慢，歌曲的情绪会发生什么变化？",
      "你唱的和示范比，差别在哪里？是音准、节奏，还是情感？",
    ],
    listen: [
      "同一个主题在作品前后出现时，情绪为什么不一样？",
      "如果换一种乐器来演奏这段主题，效果会怎样？",
      `${work}表达的情感，和你第一次听时的想象一样吗？`,
    ],
    create: [
      "同样的节奏型，配上不同的旋律，为什么会产生完全不同的情绪？",
      `你编的片段贴合${work}的主题吗？哪里贴合，哪里不贴合？`,
      "要让大家一听就感受到你想表达的情绪，最关键的是什么？",
    ],
  }[kind];

  const roles = {
    sing: [
      { role: "音准员", duty: "听准每一句的音高，提醒容易跑调的地方" },
      { role: "节奏员", duty: "拍稳节拍，盯住难唱的节奏" },
      { role: "录音员", duty: "录下小组演唱，回放对比" },
      { role: "发言人", duty: "整理小组的改进办法并汇报" },
    ],
    listen: [
      { role: "旋律组", duty: "哼唱主题，画出旋律线" },
      { role: "节奏组", duty: "拍出主要节奏，说出它的特点" },
      { role: "音色组", duty: "辨认乐器和音色的变化" },
      { role: "文化组", duty: "结合背景说明音乐为什么这样写" },
    ],
    create: [
      { role: "节奏手", duty: "设计和稳定节奏" },
      { role: "旋律手", duty: "为节奏配上旋律" },
      { role: "记录员", duty: "用简谱或图形谱记下作品" },
      { role: "展示员", duty: "演示作品并讲清创作思路" },
    ],
  }[kind];

  const groupTask = {
    sing: "小组针对演唱难点（音准 / 节奏 / 换气）专项练习：录一遍、听一遍、改一遍，找出最有效的办法。",
    listen: "小组分工分析核心片段的音乐要素，结合文化背景讨论“为什么会这样”，填写要素分析与反思表。",
    create: "小组合作完善初步编创，围绕“编创逻辑”和“情绪是否贴合”讨论，调整作品结构。",
  }[kind];

  const practiceTip = {
    sing: "放慢速度，一句一句跟唱；唱准后再恢复原速。",
    listen: "反复聆听主题片段，边听边哼唱或画旋律线。",
    create: "先拍稳节奏，再加旋律；每改一次都唱一遍、听一遍。",
  }[kind];

  const transfer = {
    sing: [
      { level: "基础", task: "完整、准确地演唱全曲，注意刚才解决的难点。" },
      { level: "提高", task: "用两种不同的情感（如激昂 / 舒缓）演唱同一乐句，对比效果并说明原因。" },
      { level: "拓展", task: "为歌曲设计演唱形式（领唱、齐唱、轮唱或加入律动），并说明设计理由。" },
    ],
    listen: [
      { level: "基础", task: "听辨作品的主题片段，说出它的情绪和主要乐器。" },
      { level: "提高", task: "选一个最喜欢的片段，用文字、绘画或动作诠释，说明你的理解。" },
      { level: "拓展", task: "找一首风格相近的作品，和这首作品比较异同。" },
    ],
    create: [
      { level: "基础", task: "用今天的节奏型，为一句歌词配上节奏。" },
      { level: "提高", task: "为“春天”或“运动”等新主题编 1–2 句旋律。" },
      { level: "拓展", task: "把小组作品配上打击乐或动作，完成一次完整表演。" },
    ],
  }[kind];

  return {
    kind,
    scene,
    goals,
    questionStarters: ["我想知道……", "我好奇的是……", "我觉得最难的是……"],
    perceive,
    conflicts,
    selfReflect: ["我的感受和同学一样吗？差别在哪里？", "我现在还解决不了的问题是什么？", "可能的办法有哪些？我需要什么帮助？"],
    groupTask,
    roles,
    practiceTip,
    chain: ["我们的观点有哪些不同？", "我们是怎样达成共识的？", "这个过程中发现了什么新问题？", "我对音乐有了哪些新理解？"],
    transfer,
    showcase: ["我是怎样把刚才的反思用到新任务里的？", "遇到了什么新问题？和之前的问题有关系吗？", "我的成果达到预期了吗？还可以怎样改进？"],
    selfCheck: kind === "sing" ? ["音准与节奏", "情感表达", "反思与改进"] : kind === "listen" ? ["听辨要素", "表达理解", "反思与改进"] : ["创意与贴合", "完整呈现", "反思与改进"],
    wrapUp: ["这节课我通过反思解决了哪些问题？", "我还有哪些没解决的问题？课后怎样继续探究？", "下次学音乐，我可以怎样运用今天的反思方法？"],
    homework: {
      sing: `完善“反思成长档案”：录一段自己演唱${work}的片段，写下进步和还要改进的地方。`,
      listen: `完善“反思成长档案”：再听一遍${work}，写下新的发现。`,
      create: "完善“反思成长档案”：修改小组作品，记录每一次修改的理由。",
    }[kind],
  };
}
