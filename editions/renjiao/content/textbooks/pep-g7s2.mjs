import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》七年级下册（简谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g7s2",
  title: "人教版七年级下册",
  pdfOffset: 5,
  book: [
    ["出版机构", "人民教育出版社", "机构", "明", { pdf: 3 }],
    ["编著", "课程教材研究所", "机构", "明", { pdf: 3 }],
    ["记谱方式", "简谱", "音乐概念", "明", { pdf: 3 }],
  ],
  parts: [],
};

// [单元序号, 单元名, 单元起始页, [[栏目, 标题, 页码, 类型], …]]
const CONTENTS = [
  [1, "第一单元 声·音·乐", 2, [
    ["学习项目","音乐从振动开始",2,"学习项目"],
    ["学习项目","游击队歌",6,"音乐作品"],
    ["学习项目","建设舒适听觉环境",8,"学习项目"],
    ["学习项目","提升美好听觉体验",12,"学习项目"],
  ]],
  [2, "第二单元 音乐的独特魅力", 22, [
    ["学习项目","音乐是什么样的艺术？",22,"学习项目"],
    ["学习项目","音乐为什么会让人浮想联翩？",26,"学习项目"],
    ["学习项目","音乐是自由想象的艺术",34,"学习项目"],
  ]],
  [3, "第三单元 欣赏的智慧", 42, [
    ["学习项目","感受声音的每个瞬间",42,"学习项目"],
    ["学习项目","感受音乐的每个层次",48,"学习项目"],
    ["学习项目","牧歌",52,"音乐作品"],
    ["学习项目","感受音乐的铺垫与高潮",58,"学习项目"],
    ["学习项目","百鸟朝凤",63,"音乐作品"],
  ]],
  [4, "第四单元 音乐表演的“二度创作”", 66, [
    ["学习项目","音乐中的“高难度”",66,"学习项目"],
    ["学习项目","表演艺术家的二度创作",72,"学习项目"],
    ["学习项目","记谱法与二度创作的空间",78,"学习项目"],
  ]],
  [5, "印在心里的歌", 84, [
    ["印在心里的歌","中国人民解放军军歌",84,"歌曲"],
    ["印在心里的歌","保卫黄河",86,"歌曲"],
  ]],
];

const SCORE_PAGES = {"游击队歌":[[6,0.04,0.035,0.96,0.94]],"牧歌":[[52,0.04,0.035,0.96,0.94]],"百鸟朝凤":[[63,0.04,0.035,0.96,0.94]],"中国人民解放军军歌":[[84,0.04,0.035,0.96,0.94]],"保卫黄河":[[86,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g7s2");
const TEXTBOOK_CONCEPTS = [
  { name: "音高", type: "音乐概念", unit: 1, page: 4, facts: [["特点", "振动频率决定音的高低，频率越高，声音越高", null, "明", 4]] },
  { name: "音强", type: "音乐概念", unit: 1, page: 4, facts: [["特点", "振动幅度影响声音的强弱，幅度越大，音越强", null, "明", 4]] },
  { name: "音长", type: "音乐概念", unit: 1, page: 4, facts: [["特点", "由振动持续时间决定，振动越久，音越长", null, "明", 4]] },
  { name: "音色", type: "音乐概念", unit: 1, page: 4, facts: [["特点", "发声体材料和结构影响波形，波形差异形成不同音色", null, "明", 4]] },
  { name: "声音的过程", type: "音乐概念", unit: 1, page: 5, facts: [
    ["特点", "声音各阶段的状态会改变音乐的表情和韵味", null, "明", 5],
    ["包含", "音头", "音乐概念", "明", 5],
    ["包含", "音腹", "音乐概念", "明", 5],
    ["包含", "音尾", "音乐概念", "明", 5],
  ] },
  { name: "音头", type: "音乐概念", unit: 1, page: 5, facts: [["特点", "由起音和衰减构成，起音急听起来偏硬，起音缓听起来偏柔", null, "明", 5]] },
  { name: "音腹", type: "音乐概念", unit: 1, page: 5, facts: [["含义", "声响在起音和衰减后的持续阶段", null, "明", 5]] },
  { name: "音尾", type: "音乐概念", unit: 1, page: 5, facts: [["含义", "声响走向消逝的一段", null, "明", 5]] },
  { name: "建筑声学", type: "音乐概念", unit: 1, page: 8, facts: [["作用", "解释音乐厅等建筑里的直达声、反射声和混响等现象", null, "明", 8]] },
  { name: "直达声", type: "音乐概念", unit: 1, page: 8, facts: [["定义为", "从声源直接进入耳朵的声音，有助于判断声源位置", null, "明", 8]] },
  { name: "反射声", type: "音乐概念", unit: 1, page: 8, facts: [["定义为", "声音遇到硬质表面反射后传到耳朵的声响", null, "明", 8]] },
  { name: "混响", type: "音乐概念", unit: 1, page: 8, facts: [["定义为", "声源停止发声后，声音仍在声场中持续的现象", null, "明", 8]] },
  { name: "混响时间", type: "音乐概念", unit: 1, page: 8, facts: [["含义", "声源停止发声后，声场中的反射声完全消失所用的时间", null, "明", 8]] },
  { name: "单声道", type: "音乐概念", unit: 1, page: 12, facts: [["特点", "记录一路或多路相同的信号，可重现前后感和音色、音量", null, "明", 12]] },
  { name: "双声道立体声", type: "音乐概念", unit: 1, page: 12, facts: [["特点", "用两路有区别的信号通过两只扬声器重放，可呈现左右定位", null, "明", 12]] },
  { name: "环绕立体声", type: "音乐概念", unit: 1, page: 13, facts: [["特点", "在侧面和后方增加声道，让听者感受周围一圈的声音定位", null, "明", 13]] },
  { name: "三维声", type: "音乐概念", unit: 1, page: 13, facts: [["特点", "增加上方声道，建立同时涵盖前后、左右和上下的声场", null, "明", 13]] },
  { name: "MP3", type: "音乐概念", unit: 1, page: 14, facts: [["定义为", "一种声音文件的压缩格式", null, "明", 14]] },
  { name: "WAVE", type: "音乐概念", unit: 1, page: 14, facts: [["特点", "记录数字声波，失真小，文件占用空间较大", null, "明", 14]] },
  { name: "FLAC", type: "音乐概念", unit: 1, page: 14, facts: [["定义为", "进行无损压缩的开放音频编码", null, "明", 14]] },
  { name: "联觉", type: "音乐概念", unit: 2, page: 30, facts: [["定义为", "一种感觉器官受刺激时引起其他感觉反应的心理活动", null, "明", 30]] },
  { name: "复调音乐", type: "音乐概念", unit: 3, page: 48, facts: [["定义为", "多条旋律并行发展的音乐组织方式", null, "明", 48]] },
  { name: "复调", type: "音乐概念", unit: 3, page: 51, facts: [["作用", "借多条旋律表现复杂的感情、思想与交织的生活感受", null, "明", 51]] },
  { name: "二度创作", type: "音乐概念", unit: 4, page: 72, facts: [["特点", "表演者根据自身理解再处理作品，呈现个性及创造力", null, "明", 72]] },
  { name: "净版", type: "音乐概念", unit: 4, page: 77, facts: [["特点", "依据作曲家手稿出版，避免加入编订者自己的处理意图", null, "明", 77]] },
  { name: "乐谱", type: "音乐概念", unit: 4, page: 80, facts: [
    ["定义为", "用来记录音乐的符号系统", null, "明", 80],
    ["作用", "保存并传播音乐，供日后回忆、学习和演奏", null, "明", 82],
  ] },
];
const WORK_KNOWLEDGE = {
  3: {
    "c小调第二钢琴协奏曲": [["音乐体裁", "协奏曲", "音乐体裁", "明", 58]],
  },
};
const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
const conceptsForUnit = (no) => {
  const additions = new Map(TEXTBOOK_CONCEPTS.filter((item) => item.unit === no).map((item) => [item.name, item]));
  const existing = ENRICHMENT.concepts.filter((item) => item.unit === no && item.name !== "音头、音腹、音尾").map((item) => {
    const source = additions.get(item.name);
    if (!source) return item;
    additions.delete(item.name);
    return { ...item, page: source.page, facts: [...(item.facts ?? []), ...source.facts] };
  });
  return [...existing, ...additions.values()];
};
const baseParts = CONTENTS.map(([no, name, page, items]) => ({
  units: [{ no, name, page, ...knowledgeForUnit("pep-g7s2", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g7s2", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = withPrintedScores("pep-g7s2", baseParts.map((part) => {
  const { no } = part.units[0];
  const baseWorks = part.works.map((work) => {
    const extra = ENRICHMENT.existingWorkFacts.find((item) => item.unit === no && bare(item.name) === bare(work.name));
    return { ...work, facts: [...work.facts, ...(extra?.facts ?? [])] };
  });
  const extraWorks = ENRICHMENT.newWorks.filter((work) => work.unit === no).map((work) => ({ ...work, mode: undefined }));
  return {
    units: part.units,
    works: [...baseWorks, ...extraWorks],
    concepts: conceptsForUnit(no),
    people: ENRICHMENT.people.filter((item) => item.unit === no),
    tasks: ENRICHMENT.tasks.filter((item) => item.unit === no),
    references: ENRICHMENT.references.filter((item) => item.unit === no),
  };
})).map((part) => ({
  ...part,
  works: part.works.map((work) => {
    const facts = WORK_KNOWLEDGE[work.unit]?.[work.name];
    return facts ? { ...work, facts: [...work.facts, ...facts] } : work;
  }),
}));

export default textbook;
