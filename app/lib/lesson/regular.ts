// 常规课（情境导入 → 感知体验 → 学习表现 → 拓展创编 → 总结评价）的标准课件脚本。
// 按义务教育艺术课程标准（2022 年版）音乐学科的四项核心素养组织：每个环节落在一项主要素养上——
// 感知体验对应审美感知，学习表现对应艺术表现，拓展创编对应创意实践与文化理解，总结评价时按四项素养回顾。
// 素养目标和重难点只在备课时给老师看；学生看到的是具体的任务。任务按课型（歌唱 / 演奏 / 欣赏 / 编创）与学段生成，
// 有旋律数据时落到具体的乐句、小节和歌词上（几句、哪几句相同、最高音在哪、哪一句最难）。
import { midiOf, type Melody, type MelodyNote } from "./jianpu";
import { splitPhrases } from "./phrases";
import { stageOfGrade, type LessonFact, type LessonKind, type StageKey } from "./reflective";

/** 四项核心素养，课件里按这个顺序出现。 */
export const LITERACIES = ["审美感知", "艺术表现", "创意实践", "文化理解"] as const;
export type Literacy = typeof LITERACIES[number];

// 阶段沿用反思型课件的五个配色位（data-stage），名称和时长按常规课 40 分钟安排。
export const REGULAR_STAGES: Array<{ key: StageKey; name: string; theme: string; minutes: number }> = [
  { key: "motivate", name: "情境导入", theme: "激发兴趣", minutes: 5 },
  { key: "conflict", name: "感知体验", theme: "审美感知", minutes: 8 },
  { key: "construct", name: "学习表现", theme: "艺术表现", minutes: 15 },
  { key: "transfer", name: "拓展创编", theme: "创意实践 · 文化理解", minutes: 8 },
  { key: "summary", name: "总结评价", theme: "素养回顾", minutes: 4 },
];

// 国歌、队歌等仪式歌曲：规范、庄严地演唱，不做改编、律动一类的拓展。
const SOLEMN_WORKS = /国歌|队歌|国际歌/;
const pick = (facts: LessonFact[], pattern: RegExp) => facts.find((fact) => pattern.test(fact.label))?.value;
const CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
/** 1–99 写成汉字：十二、二十、三十五。 */
const cn = (n: number) => (n < 10 ? CN[n] : n < 100 ? `${n >= 20 ? CN[Math.floor(n / 10)] : ""}十${n % 10 ? CN[n % 10] : ""}` : String(n));

/** 拍子的强弱规律和对应的身体动作。 */
function pulse(meter: string | undefined) {
  const m = meter?.match(/(\d+)\s*\/\s*(\d+)/);
  const top = m ? Number(m[1]) : 0;
  const bottom = m ? Number(m[2]) : 0;
  if (top === 2) return { beats: "强、弱", body: "第一拍拍手、第二拍拍腿" };
  if (top === 3 && bottom === 4) return { beats: "强、弱、弱", body: "拍手、拍腿、拍腿" };
  if (top === 4) return { beats: "强、弱、次强、弱", body: "拍手、拍腿、拍肩、拍腿" };
  if (top === 6 && bottom === 8) return { beats: "强、弱、弱、次强、弱、弱", body: "拍手、拍腿、拍腿、拍肩、拍腿、拍腿" };
  if (top === 3) return { beats: "强、弱、弱", body: "拍手、拍腿、拍腿" };
  return null;
}

type Shape = {
  count: number;
  /** 每句的开头几个字，如「我唱歌来…」。 */
  lines: string[];
  /** 旋律相同的两句（从 1 数）。 */
  repeat?: [number, number];
  /** 最高音所在的小节（从 1 数）和那里的字；唱名歌词（do、sol）记在 syllable。 */
  peak?: { bar: number; word?: string; syllable?: string };
  /** 最难的一句：大跳最多、或音符最密的那句。 */
  hard?: { index: number; reason: string };
};

const sung = (note: MelodyNote) => note.d > 0 && note.d < 8;

/** 从主旋律里读出乐句结构，给任务用；没有旋律数据时为 null。 */
function shapeOf(melody: Melody | undefined): Shape | null {
  if (!melody?.bars.length) return null;
  const flat = melody.bars.flat();
  const words = (from: number, to: number) => flat.slice(from, to).map((note) => (note.slur || note.tie ? "" : note.lyric ?? "")).join("").replace(/[^\p{Script=Han}A-Za-z]/gu, "");
  // 有歌词的作品只数唱的句子，前奏、间奏不算；器乐曲按全部乐句数。
  const all = splitPhrases(melody.bars, "auto");
  // 只有一个衬词的句子（「啊」「呱」「呀呀呀」）不算一句，否则会出现「第一句『啊』」这样的任务。
  const texted = all.filter((phrase) => {
    const text = words(phrase.startNote, phrase.endNote);
    return text.length >= 4 || (text.length >= 2 && !/^(\p{Script=Han})\1*$/u.test(text));
  });
  const phrases = texted.length ? texted : all;
  if (phrases.length < 2) return null;
  // 全曲只唱「啊」的练声曲按器乐曲数句，句子不引歌词。
  const lines = phrases.map((phrase) => {
    if (!texted.length) return "";
    const text = words(phrase.startNote, phrase.endNote);
    return text.length > 9 ? `${text.slice(0, 8)}…` : text;
  });
  const pitches = phrases.map((phrase) => flat.slice(phrase.startNote, phrase.endNote).filter(sung).map((note) => midiOf(melody, note)).join(","));
  let repeat: Shape["repeat"];
  for (let i = 0; i < pitches.length && !repeat; i += 1) {
    for (let j = i + 1; j < pitches.length; j += 1) if (pitches[i] && pitches[i] === pitches[j]) { repeat = [i + 1, j + 1]; break; }
  }
  let peak: Shape["peak"];
  let top = -1;
  const barOf = (noteIndex: number) => {
    let count = 0;
    for (let b = 0; b < melody.bars.length; b += 1) { count += melody.bars[b].length; if (noteIndex < count) return b + 1; }
    return melody.bars.length;
  };
  for (const phrase of phrases) {
    for (let i = phrase.startNote; i < phrase.endNote; i += 1) {
      const note = flat[i];
      if (!sung(note) || note.tie) continue;
      const midi = midiOf(melody, note);
      if (midi > top) {
        top = midi;
        // 歌词里的标点、括号去掉：「锵!」→ 锵，「（哎）」→ 哎。
        const lyric = note.slur ? "" : (note.lyric ?? "").replace(/[^\p{Script=Han}A-Za-z]/gu, "");
        peak = { bar: barOf(i), ...(/^\p{Script=Han}+$/u.test(lyric) ? { word: lyric } : /^[A-Za-z]+$/.test(lyric) ? { syllable: lyric } : {}) };
      }
    }
  }
  // 最难的一句：六度以上的大跳记 2 分，四、五度记 1 分；没有跳进时看十六分音符的多少。
  let hard: Shape["hard"];
  let best = 0;
  phrases.forEach((phrase, p) => {
    const notes = flat.slice(phrase.startNote, phrase.endNote).filter((note) => sung(note) && !note.tie);
    let leaps = 0;
    let fast = 0;
    notes.forEach((note, k) => {
      if (note.b <= 0.25) fast += 1;
      if (k === 0) return;
      const gap = Math.abs(midiOf(melody, note) - midiOf(melody, notes[k - 1]));
      leaps += gap >= 8 ? 2 : gap >= 5 ? 1 : 0;
    });
    const score = leaps * 2 + fast / 4;
    if (score > best) { best = score; hard = { index: p + 1, reason: leaps ? "有大跳的音程" : "节奏比较密" }; }
  });
  return { count: phrases.length, lines, repeat, peak, hard };
}

export type RegularScript = {
  goals: Array<{ area: Literacy; text: string }>;
  /** 教学重点与难点，只在备课时给老师看。 */
  focus: { key: string; hard: string };
  warmup: { title: string; steps: string[] };
  scene: string;
  firstListen: { questions: string[]; rows: Array<{ label: string; options: string[] }> };
  secondListen: string[];
  learn: { title: string; steps: string[] };
  practiceTip: string;
  perform: { title: string; forms: string[] };
  create: { title: string; tasks: Array<{ level: string; task: string }> };
  culture: string;
  review: Array<{ area: Literacy; text: string }>;
  homework: string;
};

/** 按课型、学段、本课事实与主旋律生成整节常规课的文字脚本。 */
export function regularScript(input: { workName: string; kind: LessonKind; grade?: number; facts: LessonFact[]; melody?: Melody }): RegularScript {
  const { kind, facts } = input;
  const work = input.workName.startsWith("《") ? input.workName : `《${input.workName}》`;
  const level = stageOfGrade(input.grade);
  const young = level === "low";
  const junior = level === "junior";
  const meter = pick(facts, /^拍号$/) ?? input.melody?.meter;
  const mood = pick(facts, /情绪|表现情感|情感特点/);
  const nation = pick(facts, /所属民族/);
  const place = pick(facts, /^(地域|所属地域)$/);
  const origin = nation ? `${nation}音乐` : place ? `${place}的音乐` : "作品的创作背景";
  const solemn = SOLEMN_WORKS.test(work);
  const ensemble = /合奏|重奏|合唱/.test(work);
  const beat = pulse(meter);
  const shape = shapeOf(input.melody);
  const line = (n: number) => (shape?.lines[n - 1] ? `第${cn(n)}句「${shape.lines[n - 1]}」` : `第${cn(n)}句`);
  const hardLine = shape?.hard ? line(shape.hard.index) : null;
  const half = shape ? Math.floor((shape.count - 1) / 2) || 1 : 0;
  // 多段歌词或篇幅长的歌（十句以上）不报句数，「一共有二十八句」对学生没有意义；改为按段学。
  const long = !!shape && shape.count > 10;

  const goals = ({
    sing: [
      { area: "审美感知", text: `聆听${work}，感受歌曲${mood ? `“${mood}”的` : "的"}情绪，说出速度、节拍、旋律起伏等要素怎样表现情绪。` },
      { area: "艺术表现", text: `用${young ? "自然、好听" : "自然、圆润"}的声音有感情地演唱${work}，做到音准、节奏准确，吐字清楚。` },
      { area: "创意实践", text: solemn ? "比较不同的速度和力度，体会庄严、有力地演唱的道理。" : young ? "为歌曲编配简单的律动或拍手伴奏。" : "为歌曲设计演唱形式或伴奏，并说出这样设计的理由。" },
      { area: "文化理解", text: solemn ? `了解${work}的由来和演唱礼仪，增强家国情怀。` : `了解${origin}，体会音乐与生活、文化的联系。` },
    ],
    play: [
      { area: "审美感知", text: `聆听${work}，感受乐曲${mood ? `“${mood}”的` : "的"}情绪和旋律特点。` },
      { area: "艺术表现", text: `用正确的姿势和方法演奏${work}，做到节奏稳定、音色干净${ensemble ? "，合奏整齐" : ""}。` },
      { area: "创意实践", text: "尝试改变力度或速度演奏一个乐句，或为乐曲配上简单的节奏伴奏。" },
      { area: "文化理解", text: `了解${origin}，以及乐器在音乐表达中的作用。` },
    ],
    listen: [
      { area: "审美感知", text: `完整聆听${work}，辨识主题旋律，感受速度、力度、音色的变化${mood ? `和“${mood}”的情绪` : ""}。` },
      { area: "艺术表现", text: "哼唱主题旋律，用身体律动或画旋律线表现音乐的变化。" },
      { area: "创意实践", text: young ? "听着音乐编一段动作或画一幅画，表现自己的感受。" : "用文字、绘画或动作对作品做出自己的诠释。" },
      { area: "文化理解", text: `了解${origin}，说出作品表达的生活与情感。` },
    ],
    create: [
      { area: "审美感知", text: `从${work}里找出有特点的节奏或旋律，感受它们带来的情绪。` },
      { area: "艺术表现", text: "清楚、完整地表演自己小组的编创作品。" },
      { area: "创意实践", text: `以${work}为素材，编创一段节奏或旋律，并用简谱或图形谱记录下来。` },
      { area: "文化理解", text: "体会音乐编创与生活场景、情感表达的联系。" },
    ],
  } satisfies Record<LessonKind, RegularScript["goals"]>)[kind];

  const focus = {
    sing: { key: `有感情地演唱${work}。`, hard: hardLine ? `唱准${hardLine}（${shape!.hard!.reason}），气息连贯、换气自然。` : meter ? `唱准难点乐句的音高与节奏，把握 ${meter} 拍的强弱规律。` : "唱准难点乐句的音高与节奏，气息连贯、换气自然。" },
    play: { key: `正确、流畅地演奏${work}。`, hard: hardLine ? `${hardLine}的指法与气息配合，保持速度稳定。` : "难点乐句的指法与气息配合，保持速度稳定。" },
    listen: { key: `感受${work}的情绪与主题旋律。`, hard: "听辨主题的变化，并说出音乐要素怎样表现情绪。" },
    create: { key: "用所学的节奏或旋律素材完成编创。", hard: "让编创作品贴合主题，并能记录下来。" },
  }[kind];

  const beatStep = beat ? `跟着音乐按“${beat.body}”拍出 ${meter} 拍的强弱（${beat.beats}）` : "跟着音乐拍手，找一找哪一拍最重";
  const warmup = {
    sing: young
      ? { title: "律动热身", steps: [beatStep, "老师拍一小节节奏，大家模仿拍回来，拍三组", "用“lu”轻声哼唱 1 2 3 4 5 4 3 2 1，声音轻轻的、圆圆的"] }
      : { title: "发声练习", steps: ["吸气 4 拍、保持 4 拍、慢慢呼气 8 拍，做两遍", "用“mu—a”从 1 唱到 5 再回到 1，每次升高半音，唱三组", beatStep] },
    play: { title: "演奏准备", steps: ["对照图示检查坐姿（站姿）和持乐器的方法", "吹（弹）长音 1、3、5，每个音保持 4 拍，听音色是否干净", beatStep] },
    listen: { title: "聆听准备", steps: ["坐端正，闭上眼睛，安静 10 秒", young ? "听老师弹两个音：哪个高、哪个低？用手比一比" : "听两段不同的音乐，说出它们情绪的差别", "约定：主题出现时举起右手"] },
    create: { title: "节奏热身", steps: [beatStep, "节奏接龙：每人拍一小节，不能和前一个人一样", "用拍手、拍腿、跺脚三种声音拍同一个节奏，比较音色"] },
  }[kind];

  const scene = {
    sing: young ? `小朋友，今天我们要学唱一首新歌${work}。先听一听，歌里唱了什么？` : `今天我们学习${work}。先完整听一遍，说说歌曲给你的第一印象。`,
    play: `今天我们学习演奏${work}。先听示范演奏，看看手指怎样动。`,
    listen: `今天我们来欣赏${work}。请你一边听，一边想象音乐描绘了怎样的画面。`,
    create: `今天我们以${work}为素材来编创音乐。先听一听，找出你印象最深的节奏。`,
  }[kind];

  const rows = {
    sing: [
      { label: "情绪", options: ["欢快", "活泼", "抒情", "优美", "雄壮", "庄严", "深情"] },
      { label: "速度", options: ["慢", "稍慢", "中速", "稍快", "快"] },
      { label: "旋律", options: young ? ["像走楼梯", "像跳台阶", "平平稳稳", "高高低低"] : ["级进为主", "跳进较多", "起伏平稳", "起伏较大"] },
    ],
    play: [
      { label: "情绪", options: ["欢快", "抒情", "优美", "活泼", "庄重"] },
      { label: "速度", options: ["慢", "中速", "快"] },
      { label: "旋律", options: ["级进为主", "跳进较多", "有重复的乐句"] },
    ],
    listen: [
      { label: "情绪", options: ["欢快", "抒情", "庄严", "激昂", "幽默", "宁静"] },
      { label: "速度", options: ["慢", "中速", "快", "有变化"] },
      { label: "力度", options: ["弱", "中强", "强", "渐强渐弱"] },
      { label: "音色", options: ["人声", "弦乐", "管乐", "打击乐", "民族乐器"] },
    ],
    create: [
      { label: "情绪", options: ["欢快", "抒情", "神秘", "紧张"] },
      { label: "速度", options: ["慢", "中速", "快"] },
      { label: "节奏", options: ["X X", "X X X X", "X. X", "X —"] },
    ],
  }[kind];

  const firstListen = {
    questions: {
      sing: [young ? "听完后，在下面选一选：歌曲的心情和速度是怎样的？" : "听完后，在下面选出歌曲的情绪、速度和旋律特点。", "说一说：你是从哪里听出来的？"],
      play: ["听完后，在下面选出乐曲的情绪、速度和旋律特点。", "说一说：你是从哪里听出来的？"],
      listen: ["听完后，在下面选出音乐的情绪、速度、力度和音色。", "情绪有没有变化？在哪里变的？"],
      create: ["听完后，在下面选出音乐的情绪和速度。", "哪个节奏让你印象最深？拍给同桌听。"],
    }[kind],
    rows,
  };

  const secondListen = {
    sing: [
      long ? `这首歌比较长。听一听：哪几句的旋律相同或相似？有没有几段歌词唱同一个旋律？` : shape ? `歌曲一共有${cn(shape.count)}句。${shape.repeat ? `听一听：第${cn(shape.repeat[0])}句和第${cn(shape.repeat[1])}句的旋律一样吗？` : "听一听：哪几句的旋律相似？"}` : young ? "歌曲一共有几句？哪几句是一样的？" : "歌曲可以分成几个乐句？哪些乐句相同或相似？",
      beat ? `边听边按“${beat.body}”拍出 ${meter} 拍，找到每小节的强拍。` : "跟着音乐拍出节拍，找到强拍。",
      shape?.peak ? `旋律最高的地方在第 ${shape.peak.bar} 小节${shape.peak.word ? `的“${shape.peak.word}”字上` : shape.peak.syllable ? `唱“${shape.peak.syllable}”的地方` : ""}。唱到这里，心情是怎样的？` : "旋律在哪里最高？那里表达了怎样的感情？",
    ],
    play: [
      long ? "乐曲比较长。听一听：哪几句的旋律相同或相似？" : shape ? `乐曲一共有${cn(shape.count)}句。${shape.repeat ? `第${cn(shape.repeat[0])}句和第${cn(shape.repeat[1])}句的旋律一样吗？` : "哪几句的旋律相似？"}` : "乐曲可以分成几个乐句？哪些乐句相同？",
      hardLine ? `看谱找一找${hardLine}，先把它的节奏拍一拍。` : "找出乐曲中最难的节奏，先拍一拍。",
      "在每句结束的地方做记号：这里换气（或换把位）。",
    ],
    listen: [
      "主题旋律出现了几次？每听到一次就举一次手。",
      junior ? "作品可以分成几部分？各部分的速度、力度、音色有什么对比？" : "音乐分成几段？每段的情绪一样吗？",
      "速度、力度和音色的变化，分别表现了什么？",
    ],
    create: ["素材里的节奏型是什么？试着拍一拍。", "这段旋律是上行还是下行？给人什么感觉？", "如果换成别的节奏，情绪会怎样变化？"],
  }[kind];

  const learn = {
    sing: { title: "学唱歌曲", steps: young
      ? [
        "听人声范唱，用“lu”轻声跟着哼旋律",
        "按节奏读歌词，一句一拍手",
        long ? "一句一句学：打开「跟唱」，每句先听一遍，再跟唱一遍，一段学会再学下一段" : shape ? `一句一句学：打开「跟唱」，每句先听一遍，再跟唱一遍，共${cn(shape.count)}句` : "一句一句跟唱：老师唱一句、学生接一句",
        hardLine ? `${hardLine}多唱两遍，唱准再往下` : "难唱的句子多唱两遍",
        "完整演唱全曲，每句唱完再换气",
      ]
      : [
        "跟琴视唱旋律（唱谱），先唱慢一点",
        "按节奏朗读歌词，注意每个字的时值",
        long ? "填词演唱：打开「跟唱」逐句学，一段唱熟再学下一段" : shape ? `填词演唱：打开「跟唱」，按${cn(shape.count)}句逐句学` : "填词演唱，标出难唱的乐句",
        hardLine ? `突破难点：${hardLine}（${shape!.hard!.reason}）单独练` : "单独练习难唱的乐句",
        "完整演唱，注意换气口和情绪",
      ] },
    play: { title: "学奏乐曲", steps: ["唱一唱乐谱，熟悉旋律", long ? "慢速分句练习，一句会了再连下一句，一段熟了再练下一段" : shape ? `慢速分句练习，共${cn(shape.count)}句，一句会了再连下一句` : "慢速分句练习指法", hardLine ? `攻克难点：${hardLine}` : "攻克难点乐句", "完整、流畅地演奏全曲"] },
    listen: { title: "分段赏析", steps: ["哼唱主题旋律，记住它", "分段聆听，说出每段的情绪与要素变化", "对照背景，体会音乐表达的内容", "完整聆听，跟着主题做律动或画旋律线"] },
    create: { title: "编创步骤", steps: ["选定节奏型或旋律素材", "小组讨论，编出 2–4 小节", "用简谱或图形谱记录下来", "练习并准备展示"] },
  }[kind];

  const practiceTip = {
    sing: hardLine ? `${hardLine}${shape!.hard!.reason}。把速度放慢，听人声范唱一遍、跟唱一遍；唱准后再恢复原速。` : "先放慢速度，听人声范唱一句、学一句；唱准后再恢复原速。",
    play: hardLine ? `${hardLine}${shape!.hard!.reason}。先唱谱，再慢速演奏三遍，熟练后恢复原速。` : "先唱谱，再慢速演奏；一句熟练了再连下一句，最后恢复原速。",
    listen: "反复聆听主题片段，边听边哼唱或画旋律线。",
    create: "先拍稳节奏，再加旋律；每改一次都唱一遍、听一遍。",
  }[kind];

  const split = shape && shape.count >= 4 && !long ? `第一组唱第一到第${cn(half)}句，第二组唱第${cn(half + 1)}到第${cn(shape.count - 1)}句，最后一句全班合唱` : null;
  // 教材标了演唱形式时，按教材的形式分组演唱。
  const form = pick(facts, /^演唱形式$/);
  const formTask = !form ? null
    : /对唱/.test(form) ? `按教材的${form}：甲组、乙组一问一答，合唱的地方全班一起唱`
      : /轮唱/.test(form) ? `按教材的${form}：两组相隔一句先后进入`
        : /二部|二声部|合唱/.test(form) ? `按教材的${form}：分声部先各唱一遍，再合起来`
          : /领唱/.test(form) ? `按教材的${form}：请一位同学领唱，全班接唱`
            : null;
  const perform = {
    sing: solemn
      ? { title: "规范演唱", forms: ["全体起立，双手自然下垂，目视前方", "齐唱全曲，声音饱满有力，速度稳定", "唱完后互相评一评：站姿、声音、精神面貌"] }
      : { title: "表现歌曲", forms: [
        formTask ?? (split ? `分组接唱：${split}` : "分组接唱：两组一句一句接着唱"),
        beat ? `边唱边做律动：${beat.body}` : "边唱边做律动",
        young ? "请三位同学用碰铃或双响筒，在每小节第一拍敲一下伴奏" : "加入打击乐：双响筒敲强拍，沙锤摇弱拍",
      ] },
    play: { title: "表现乐曲", forms: ensemble ? ["分声部练习，每个声部先单独演奏一遍", "合奏，听着其他声部对齐速度", "第二遍加入力度变化"] : [split ? `分组接奏：${split.replace(/唱/g, "奏")}` : "分组演奏，一组一句", "一组演奏，一组用歌声或打击乐合作", "第二遍加入力度变化：前弱后强"] },
    listen: { title: "参与表现", forms: ["主题一出现，就跟着哼唱", "随音乐做律动：强拍拍手、弱拍拍腿", "用手在空中画出主题的旋律线"] },
    create: { title: "展示作品", forms: ["每组展示编创作品，限时 1 分钟", "展示前说一句：我们想表现的是……", "其他组用“我喜欢……我建议……”评价"] },
  }[kind];

  const firstLine = shape?.lines[0]?.replace(/…$/, "");
  const create = {
    sing: solemn
      ? { title: "拓展了解", tasks: [
        { level: "基础", task: "说出演唱时的站姿和礼仪要求。" },
        { level: "提高", task: `讲一讲${work}的由来。` },
        { level: "拓展", task: "找一找在什么场合会唱这首歌。" },
      ] }
      : { title: "创意实践", tasks: [
        { level: "基础", task: young ? `用双响筒或拍手，为${shape ? "第一、二句" : "歌曲"}每小节的第一拍伴奏。` : "选一件打击乐器，为歌曲设计一个两小节的伴奏节奏，反复使用。" },
        { level: "提高", task: young ? `为${line(1)}编两个动作，边唱边做。` : "设计一种演唱形式（领唱与齐唱、轮唱或二声部），说出理由并试唱。" },
        { level: "拓展", task: firstLine ? `保留旋律，把“${firstLine}”换成自己的歌词，唱给同桌听。` : "保留旋律，编一句新歌词，唱给同桌听。" },
      ] },
    play: { title: "创意实践", tasks: [
      { level: "基础", task: `用强、弱两种力度演奏${shape ? line(1) : "同一乐句"}，说说哪种更好听。` },
      { level: "提高", task: "为乐曲配一个两小节的节奏伴奏，和同学合作演奏。" },
      { level: "拓展", task: `改变${shape ? line(1) : "一个乐句"}的节奏，演奏给同学听，请他们说出哪里变了。` },
    ] },
    listen: { title: "创意实践", tasks: [
      { level: "基础", task: "主题出现时举手，说出它的情绪和主要乐器。" },
      { level: "提高", task: "选一个最喜欢的片段，用绘画、文字或动作表现出来。" },
      { level: "拓展", task: "找一首风格相近的作品，和这首作品比较异同。" },
    ] },
    create: { title: "创编挑战", tasks: [
      { level: "基础", task: "用今天的节奏型，为一句歌词配上节奏。" },
      { level: "提高", task: "为节奏配上简单的旋律，并唱出来。" },
      { level: "拓展", task: "把作品配上打击乐或动作，完成一次完整表演。" },
    ] },
  }[kind];

  const culture = solemn
    ? `${work}有特殊的意义，演唱时要庄严、规范。说一说你知道的相关故事。`
    : nation || place ? `${work}是${origin}。说一说，它的音乐和当地的生活、风俗有什么联系？`
      : `说一说，${work}表达了怎样的生活和情感？你在生活中有过类似的感受吗？`;

  const review: RegularScript["review"] = [
    { area: "审美感知", text: `我感受到了${work}的情绪${mood ? `（${mood}）` : ""}，知道了它是怎样表现出来的。` },
    { area: "艺术表现", text: { sing: "我能有感情地演唱这首歌。", play: "我能正确、流畅地演奏这首乐曲。", listen: "我能哼唱主题，并用动作表现音乐。", create: "我能完整地表演小组的作品。" }[kind] },
    { area: "创意实践", text: { sing: solemn ? "我知道了为什么要庄严地演唱。" : "我为歌曲设计了自己的表现方式。", play: "我尝试了用不同的方式演奏。", listen: "我用自己的方式表达了对音乐的理解。", create: "我和同学一起编创了一段音乐。" }[kind] },
    { area: "文化理解", text: solemn ? `我了解了${work}的由来和意义。` : `我了解了${origin}和它背后的故事。` },
  ];

  const homework = {
    sing: young ? `把${work}唱给家人听，并教他们做一做律动。` : `熟练演唱${work}，录一段自己的演唱，听一听哪里还可以更好。`,
    play: `每天练习${work} 10 分钟，${hardLine ? `重点练${hardLine}` : "把难点乐句练熟"}。`,
    listen: `再听一遍${work}，向家人介绍它的主题和情绪。`,
    create: "修改完善小组的编创作品，下节课展示。",
  }[kind];

  return { goals, focus, warmup, scene, firstListen, secondListen, learn, practiceTip, perform, create, culture, review, homework };
}
