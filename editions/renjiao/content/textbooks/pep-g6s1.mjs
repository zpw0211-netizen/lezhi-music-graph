import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》六年级上册（简谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g6s1",
  title: "人教版六年级上册",
  pdfOffset: 7,
  book: [
    ["出版机构", "人民教育出版社", "机构", "明", { pdf: 3 }],
    ["编著", "课程教材研究所", "机构", "明", { pdf: 3 }],
    ["记谱方式", "简谱", "音乐概念", "明", { pdf: 3 }],
  ],
  parts: [],
};

// [单元序号, 单元名, 单元起始页, [[栏目, 标题, 页码, 类型], …]]
const CONTENTS = [
  [1, "第一单元 听见家乡", 2, [
    ["综合探索","寻声家乡",2,"综合探索"],
    ["学习项目","家乡的歌",2,"学习项目"],
    ["创乐工坊","乡乐回响",6,"创乐工坊"],
    ["学习项目","乡音乡情",8,"学习项目"],
    ["创乐工坊","我为家乡写首歌",8,"创乐工坊"],
    ["创乐工坊","前门情思大碗茶",8,"音乐作品"],
    ["小小歌唱家","故乡的小路",11,"歌曲"],
  ]],
  [2, "第二单元 舞韵乐章", 14, [
    ["学习项目","肢体的表达",14,"学习项目"],
    ["小小舞蹈家","舞蹈的诉说",14,"小小舞蹈家"],
    ["综合探索","“音舞集”编配大赛",18,"综合探索"],
    ["学习项目","用舞蹈讲故事",20,"学习项目"],
    ["音乐万花筒","舞剧中的音乐",20,"音乐万花筒"],
    ["音乐万花筒","四小天鹅舞曲",21,"音乐作品"],
    ["小小歌唱家","大红枣儿甜又香",22,"歌曲"],
    ["学习项目","舞蹈配乐工作坊",23,"学习项目"],
    ["创乐工坊","舞蹈配乐大比拼",23,"创乐工坊"],
    ["综合探索","舞蹈创意表现",24,"综合探索"],
  ]],
  [3, "第三单元 歌剧与音乐剧", 26, [
    ["学习项目","戏剧中的歌声",26,"学习项目"],
    ["音乐万花筒","歌唱与咏叹",26,"音乐万花筒"],
    ["小小歌唱家","雪绒花",30,"歌曲"],
    ["学习项目","歌剧院探秘",32,"学习项目"],
    ["综合探索","走进歌剧院",32,"综合探索"],
    ["音乐万花筒","魅力舞台",36,"音乐万花筒"],
  ]],
  [4, "第四单元 戏曲神韵", 42, [
    ["学习项目","声腔动人心",42,"学习项目"],
    ["音乐万花筒","京昆之声",42,"音乐万花筒"],
    ["音乐万花筒","姹紫嫣红",42,"音乐作品"],
    ["小小歌唱家","都有一颗红亮的心",45,"歌曲"],
    ["综合探索","红色经典",47,"综合探索"],
    ["学习项目","千斤念白四两唱",48,"学习项目"],
    ["音乐万花筒","念白的魅力",48,"音乐万花筒"],
    ["综合探索","韵白与方言白",50,"综合探索"],
    ["学习项目","联缀的曲牌",52,"学习项目"],
    ["音乐万花筒","夜奔",52,"音乐万花筒"],
    ["综合探索","点绛唇",54,"综合探索"],
  ]],
];

const SCORE_PAGES = {"前门情思大碗茶":[[8,0.04,0.035,0.96,0.94]],"故乡的小路":[[11,0.04,0.035,0.96,0.94]],"四小天鹅舞曲":[[21,0.04,0.035,0.96,0.94]],"大红枣儿甜又香":[[22,0.04,0.035,0.96,0.94]],"雪绒花":[[30,0.04,0.035,0.96,0.94]],"姹紫嫣红":[[42,0.04,0.035,0.96,0.94]],"都有一颗红亮的心":[[45,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g6s1");
const TEXTBOOK_CONCEPTS = [
  { name: "变声期", type: "音乐概念", unit: 1, page: 12, facts: [["含义", "青少年嗓音转变的时期，通常十二至十四岁开始，持续一至两年", null, "明", 12]] },
  { name: "歌剧", type: "音乐体裁", unit: 3, page: 29, facts: [["定义为", "以音乐为主，融合戏剧、文学、舞蹈和舞台美术的综合艺术", null, "明", 29]] },
  { name: "音乐剧", type: "音乐体裁", unit: 3, page: 29, facts: [["定义为", "由喜歌剧和小歌剧演变而来，融合戏剧、音乐和舞蹈", null, "明", 29]] },
  { name: "念白", type: "表演形式", unit: 4, page: 48, facts: [
    ["作用", "以富有音乐性和节奏感的语言交代剧情和人物", null, "明", 48],
    ["包含", "韵白", "音乐概念", "明", 50],
    ["包含", "方言白", "音乐概念", "明", 50],
  ] },
  { name: "韵白", type: "音乐概念", unit: 4, page: 50, facts: [["特点", "语音有规范，声调起伏夸张，富有韵律感", null, "明", 50]] },
  { name: "方言白", type: "音乐概念", unit: 4, page: 50, facts: [["特点", "接近日常生活语言，生活气息浓郁", null, "明", 50]] },
  { name: "曲牌", type: "音乐概念", unit: 4, page: 53, facts: [["定义为", "民间曲调的牌名，每个牌名有相应的曲调、字数和句数格式", null, "明", 53]] },
  { name: "曲牌体", type: "音乐概念", unit: 4, page: 53, facts: [["定义为", "以曲牌为结构单位，可单用、叠用或联用曲牌的音乐结构", null, "明", 53]] },
  { name: "点绛唇", type: "音乐概念", unit: 4, page: 54, facts: [["含义", "沿用至今的词牌和曲牌，常用于多个戏曲剧种", null, "明", 54]] },
];
const WORK_KNOWLEDGE = {
  2: {
    "采薇": [["来源体裁", "舞剧", "音乐体裁", "明", 20]],
    "四小天鹅舞曲": [["来源体裁", "舞剧", "音乐体裁", "明", 21]],
    "大红枣儿甜又香": [["来源体裁", "舞剧", "音乐体裁", "明", 22]],
  },
  3: {
    "珊瑚颂": [["来源体裁", "歌剧", "音乐体裁", "明", 26]],
    "快乐的捕鸟人": [["来源体裁", "歌剧", "音乐体裁", "明", 26]],
    "雪绒花": [["来源体裁", "音乐剧", "音乐体裁", "明", 30], ["表演形式", "合唱", "表演形式", "明", 31]],
  },
};
const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
const conceptsForUnit = (no) => {
  const additions = new Map(TEXTBOOK_CONCEPTS.filter((item) => item.unit === no).map((item) => [item.name, item]));
  const existing = ENRICHMENT.concepts.filter((item) => item.unit === no).map((item) => {
    const source = additions.get(item.name);
    if (!source) return item;
    additions.delete(item.name);
    return { ...item, page: source.page, facts: [...(item.facts ?? []), ...source.facts] };
  });
  return [...existing, ...additions.values()];
};
const baseParts = CONTENTS.map(([no, name, page, items]) => ({
  units: [{ no, name, page, ...knowledgeForUnit("pep-g6s1", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g6s1", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = withPrintedScores("pep-g6s1", baseParts.map((part) => {
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
