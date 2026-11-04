// 《义务教育艺术课程标准（2022年版）》音乐部分在课件里的落点：学段、学习任务、按学段的学业要求、互评要求和课标里的行为动词。
// 文字依据课标原文（页码为课标印刷页），只把"学生"换成课题和本课作品；课标没写到的地方不补。
import type { LessonKind } from "./reflective";

export const STANDARD = "《义务教育艺术课程标准（2022年版）》";

/** 四个学段：1～2、3～5、6～7、8～9 年级（课标第 7 页）。 */
export type Band = 1 | 2 | 3 | 4;
export const BAND_NAMES: Record<Band, string> = { 1: "第一学段（1～2年级）", 2: "第二学段（3～5年级）", 3: "第三学段（6～7年级）", 4: "第四学段（8～9年级）" };
export function bandOf(grade: number | undefined): Band {
  if (!grade) return 2;
  return grade <= 2 ? 1 : grade <= 5 ? 2 : grade <= 7 ? 3 : 4;
}

/** 课型对应的学习任务：1～2 年级唱游·音乐 4 项，3～9 年级音乐 6 项（课标第 16 页）。 */
export function standardTask(kind: LessonKind, band: Band): { task: string; page: number } {
  if (band === 1) return ({ sing: { task: "趣味唱游", page: 16 }, play: { task: "趣味唱游", page: 16 }, listen: { task: "聆听音乐", page: 18 }, create: { task: "情境表演", page: 19 } } as const)[kind];
  return ({ sing: { task: "独唱与合作演唱", page: 28 }, play: { task: "独奏与合作演奏", page: 32 }, listen: { task: "听赏与评述", page: 22 }, create: { task: "编创与展示", page: 35 } } as const)[kind];
}

/**
 * 文化理解目标里"了解……"的对象：优先用教材数据里的民族、地域、国家，其次是作曲家与创作年代、出处、体裁；
 * 都没有时才用笼统的"作品的创作背景"。只取已核对的事实，不补写。
 */
export function originOf(facts: Array<{ label: string; value: string }>, fallback = "作品的创作背景") {
  const pick = (pattern: RegExp) => facts.find((fact) => pattern.test(fact.label) && fact.value.length <= 20)?.value;
  const nation = pick(/^(所属民族|民族)$/);
  if (nation) return `${nation}音乐`;
  const place = pick(/^(地域|所属地域|民歌地域)$/);
  if (place) return `${place}的音乐`;
  const country = pick(/^所属国家$/);
  if (country) return `${country}的音乐`;
  const composer = facts.find((fact) => /^(作曲|词曲作者)$/.test(fact.label) && fact.value.length <= 12 && !/佚名|不详|民歌|民间/.test(fact.value))?.value;
  const year = pick(/^(创作年代|创作时间)$/);
  if (composer) return year ? `作曲家${composer}和作品${year}的创作背景` : `作曲家${composer}和这首作品的创作背景`;
  const source = pick(/^(选自|选自作品)$/);
  if (source) return `${source}的故事和音乐`;
  const genre = facts.find((fact) => /^(音乐体裁|体裁|民歌体裁)$/.test(fact.label) && fact.value.length <= 8)?.value;
  if (genre) return `${genre}这种体裁的特点`;
  return fallback;
}

export type GoalContext ={ work: string; grade?: number; mood?: string; origin: string; solemn: boolean; ensemble: boolean };
export type Goal = { area: "审美感知" | "艺术表现" | "创意实践" | "文化理解"; text: string };

/** 四项核心素养目标，按学段取课标学业要求的说法。 */
export function standardGoals(kind: LessonKind, ctx: GoalContext): Goal[] {
  const band = bandOf(ctx.grade);
  const { work, origin } = ctx;
  const mood = ctx.mood ? `（${ctx.mood}）` : "";
  const seventh = ctx.grade === 7;
  const pick = <T,>(values: [T, T, T, T]) => values[band - 1];
  const culture = ctx.solemn ? `了解${work}的由来和演唱礼仪，能说出在什么场合、怎样演唱。` : pick([
    `说出${work}表现了什么，初步了解${origin}。`,
    `了解${origin}，能说出音乐与生活的联系。`,
    `了解${origin}，能从文化的角度说出音乐与生活、社会的联系。`,
    `结合${origin}，说出作品的风格特点，并联系文化背景解释风格形成的原因。`,
  ]);
  const goals: Record<LessonKind, Goal[]> = {
    sing: [
      { area: "审美感知", text: pick([
        `聆听${work}，能随音乐的情绪自然做出表情或动作，说出歌曲的情绪${mood}。`,
        `聆听${work}，听辨歌曲的情绪${mood}，并说出是哪些音乐要素表现了这种情绪。`,
        seventh ? `聆听${work}，结合对音乐要素的分析，说出歌曲表达的情感内涵。` : `聆听${work}，从音乐要素的角度简单分析歌曲情绪${mood}的表现。`,
        `聆听${work}，说出歌曲的音乐表现特征与情感表达之间的联系。`,
      ]) },
      { area: "艺术表现", text: pick([
        `用正确的姿势、自然的声音有感情地独唱或齐唱${work}，在演唱中加入适当的动作。`,
        `用正确的姿势和方法、自然的声音，自信、有感情地演唱${work}，能跟随音乐模唱或用唱名视唱主要乐句。`,
        seventh ? `运用一定的演唱技法有感情地演唱${work}，能根据自己对歌曲的理解提出创意表现的想法。` : `用正确的姿势和方法、自然的声音、准确的节奏和音调，自信、有感情地演唱${work}，懂得保护嗓音。`,
        `有感情地演唱${work}，对歌曲有自己的见解，能在演唱中进行个性化的处理与表达。`,
      ]) },
      { area: "创意实践", text: ctx.solemn ? "比较不同的速度和力度，说出庄严、有力地演唱的道理。" : pick([
        "根据歌曲内容进行歌表演或角色扮演，用打击乐器或声势为歌曲伴奏。",
        "为歌曲编创声势、律动或简单的节奏伴奏，并参与表演。",
        "为歌曲设计演唱形式或伴奏（固定音型、简单节奏），说出这样设计的理由。",
        "对歌曲进行二度创作，设计富有个性的表现形式，并阐释自己的想法。",
      ]) },
      { area: "文化理解", text: culture },
    ],
    play: [
      { area: "审美感知", text: band <= 2 ? `聆听${work}，说出乐曲的情绪${mood}和旋律、节奏的特点。` : `聆听${work}，说出速度、力度、音色等要素怎样表现乐曲的情绪${mood}。` },
      { area: "艺术表现", text: pick([
        `用打击乐器或声势为${work}伴奏，保持稳定的节拍。`,
        `用正确的方法演奏${work}，正确表现节拍、节奏和音高，并根据音乐的情绪采用合适的力度、速度。`,
        seventh ? `运用一定的演奏技巧演奏${work}，控制速度、力度和音色${ctx.ensemble ? "，与同伴合作演奏多声部音乐" : ""}。` : `用正确的姿势和方法视谱演奏${work}，体现乐句和乐段，能根据需要改变速度、力度和音色。`,
        `熟练演奏${work}，用适当的技巧表现乐曲的情感${ctx.ensemble ? "，合奏时相互配合" : ""}。`,
      ]) },
      { area: "创意实践", text: pick([
        "用乐器编创并演奏简单的节奏。",
        "用乐器编创并演奏简单的节奏或旋律。",
        "即兴或有计划地用乐器编创短小的节奏或旋律。",
        "在演奏中融入个性化的理解和创意，表现乐曲的风格和特点。",
      ]) },
      { area: "文化理解", text: culture },
    ],
    listen: [
      { area: "审美感知", text: pick([
        `聆听${work}，随音乐的情绪做出体态反应，说出音乐的情绪，简要描述音乐表现的形象。`,
        `聆听${work}，听辨情绪和情感的变化，判断是哪些音乐要素引起的；听出音乐的主题。`,
        `聆听${work}，听辨音乐主题，从音乐要素的角度分析情绪变化的原因，感知乐句、乐段的重复与变化。`,
        `聆听${work}，对音乐表现要素和表现手段做出较为准确的听辨，说出表现特征与情感表达之间的联系。`,
      ]) },
      { area: "艺术表现", text: pick([
        "随音乐律动，用线条、色块或图形表示听到的音乐。",
        "随音乐哼唱或默唱主题，用动作、图示表示乐句和乐段。",
        "模唱音乐主题，选用合适的方式（动作、图示或乐谱）表示作品的结构。",
        "模唱或用课堂乐器试奏音乐主题，表现作品的风格特点。",
      ]) },
      { area: "创意实践", text: pick([
        "听着音乐编一段动作或画一幅画，表现自己的感受。",
        "用文字、绘画或动作对作品做出自己的诠释，并与同学交流。",
        "用文字、绘画或动作对作品做出自己的诠释，说明理由。",
        "对作品做出个性化的诠释，用口头或书面形式写一段简短的评述。",
      ]) },
      { area: "文化理解", text: culture },
    ],
    create: [
      { area: "审美感知", text: `从${work}里找出有特点的节奏或旋律，说出它们带来的情绪。` },
      { area: "艺术表现", text: band <= 2 ? "按要求表演自己小组的编创作品。" : "完整表演小组的编创作品，并阐释创作的想法。" },
      { area: "创意实践", text: pick([
        "根据音乐特点创编动作或即兴表演，编创简单的节奏配合表演。",
        `以${work}为素材，有目的地编创短小的节奏或旋律，为朗诵、歌曲或舞蹈即兴伴奏。`,
        seventh ? `以${work}为素材，编创稍复杂的节奏或旋律，并用图形谱或乐谱记录。` : `以${work}为素材，编创有重复和变化的节奏或旋律，用图形谱或乐谱记录下来。`,
        `以${work}为素材，运用一定的技法完成富有新意的节奏型或简单旋律编创，用乐谱或软件记录。`,
      ]) },
      { area: "文化理解", text: "说出编创作品与生活场景、情感表达之间的联系。" },
    ],
  };
  return goals[kind];
}

/** 表现之后的互评与改进，要求随学段提高（课标第 29–31、33–34、37 页）。 */
export function peerReview(kind: LessonKind, grade: number | undefined): string {
  const band = bandOf(grade);
  const doing = { sing: "演唱", play: "演奏", listen: "表演", create: "编创与表演" }[kind];
  const again = { sing: "再唱一遍", play: "再奏一遍", listen: "再表演一遍", create: "再展示一遍" }[kind];
  const criteria = { sing: "音准、节奏、情感", play: "节奏、音色、情感", listen: "听得准不准、说得清不清楚", create: "有没有创意、结构是否完整、是否贴合主题" }[kind];
  if (band === 1) return `全班、分组、个别轮流${doing}，每个人都有展示的机会；说一说谁的哪里最好`;
  if (band === 4) return `互评：评价自己、同学和集体的${doing}，各提一条具体、合理的建议，改进后${again}`;
  if (grade === 7) return `互评：按“${criteria}”等标准分析、评价同学的${doing}，根据反馈改进后${again}`;
  return `互评：用“我喜欢……我建议……”简单评价同学的${doing}，${again}`;
}

/** 编创与展示的流程（课标第 39 页）。 */
export const CREATE_FLOW = ["激发动机", "创作构思", "创作与制作", "试唱（奏）试演", "表演或展示", "交流与评价", "改进与提高"] as const;

/** 课标学业要求里能观察、能评价的行为动词，教案检查据此判断目标写得是否可观察。 */
export const OBSERVABLE_VERBS = /说出|说明|描述|简要描述|阐述|阐释|评价|评述|分析|判断|听辨|辨别|辨识|识别|区分|分辨|指出|比较|模唱|视唱|哼唱|默唱|背唱|演唱|唱|演奏|奏|视奏|拍出|拍击|拍|编创|创编|即兴|编配|设计|记录|画出|画|表示|表演|模仿|律动|指挥|举例|列举|写|讲|选出|选用|分享|交流|介绍/;
