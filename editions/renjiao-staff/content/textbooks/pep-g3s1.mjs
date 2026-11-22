import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》三年级上册（五线谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g3s1",
  title: "人教版三年级上册",
  pdfOffset: 7,
  book: [
    ["出版机构", "人民教育出版社", "机构", "明", { pdf: 3 }],
    ["编著", "课程教材研究所", "机构", "明", { pdf: 3 }],
    ["记谱方式", "五线谱", "音乐概念", "明", { pdf: 3 }],
  ],
  parts: [],
};

// [单元序号, 单元名, 单元起始页, [[栏目, 标题, 页码, 类型], …]]
const CONTENTS = [
  [1, "第一单元 谢谢您，亲爱的老师", 2, [
    ["小小歌唱家","我爱米兰",2,"歌曲"],
    ["趣味乐理","乐音叠罗汉",4,"趣味乐理"],
    ["趣味乐理","和弦翻跟头",5,"趣味乐理"],
    ["音乐万花筒","飞来的花瓣",6,"音乐万花筒"],
    ["音乐万花筒","每当我走过老师窗前",7,"音乐作品"],
    ["小小演奏家","甜甜的秘密",8,"音乐作品"],
    ["情境表演","老师的一天",9,"情境表演"],
    ["综合探索","“唱给老师的歌”音乐会",10,"综合探索"],
  ]],
  [2, "第二单元 德奥音乐之旅", 12, [
    ["音乐万花筒","德奥之声",12,"音乐万花筒"],
    ["趣味乐理","你进我出花样多",18,"趣味乐理"],
    ["小小歌唱家","乘着歌声的翅膀",20,"歌曲"],
    ["小小演奏家","献给爱丽丝（片段）",22,"音乐作品"],
  ]],
  [3, "第三单元 人说山西好风光", 24, [
    ["音乐万花筒","山西音乐汇",24,"音乐万花筒"],
    ["小小歌唱家","交城山",26,"歌曲"],
    ["创乐工坊","加花",27,"创乐工坊"],
    ["创乐工坊","桃花红 杏花白",27,"音乐作品"],
    ["小小演奏家","滚核桃",28,"音乐作品"],
    ["音乐考古","埙的故事",30,"音乐考古"],
    ["音乐考古","阳关三叠",32,"音乐作品"],
  ]],
  [4, "第四单元 走进三秦颂延安", 34, [
    ["音乐万花筒","秦川乐风",34,"音乐万花筒"],
    ["小小演奏家","鸭子拌嘴",36,"小小演奏家"],
    ["综合探索","红领巾寻访革命圣地",38,"综合探索"],
    ["综合探索","山丹丹开花红艳艳",40,"综合探索"],
    ["综合探索","军民大生产",41,"音乐作品"],
    ["小小歌唱家","延安的故事",42,"歌曲"],
    ["音乐考古","西安乐忆",46,"音乐考古"],
  ]],
  [5, "第五单元 西北高原唱花儿", 50, [
    ["小小歌唱家","花儿与少年",50,"歌曲"],
    ["音乐万花筒","花儿会",52,"音乐万花筒"],
    ["小小歌唱家","可可西里",54,"歌曲"],
    ["创乐工坊","可可西里（片段）",57,"创乐工坊"],
    ["音乐万花筒","丝绸之路驼铃声",58,"音乐万花筒"],
    ["音乐考古","丝绸之路敦煌舞",60,"音乐考古"],
    ["小小舞蹈家","学跳敦煌舞",62,"小小舞蹈家"],
  ]],
  [6, "第六单元 东郭先生与狼", 64, [
    ["小小音乐剧","东郭先生与狼",64,"小小音乐剧"],
  ]],
];

const SCORE_PAGES = {"我爱米兰":[[2,0.04,0.035,0.96,0.94]],"每当我走过老师窗前":[[7,0.04,0.035,0.96,0.94]],"甜甜的秘密":[[8,0.04,0.035,0.96,0.94]],"乘着歌声的翅膀":[[20,0.04,0.035,0.96,0.94]],"献给爱丽丝（片段）":[[22,0.04,0.035,0.96,0.94]],"交城山":[[26,0.04,0.035,0.96,0.94]],"桃花红杏花白":[[27,0.04,0.035,0.96,0.94]],"滚核桃":[[28,0.04,0.035,0.96,0.94]],"阳关三叠":[[32,0.04,0.035,0.96,0.94]],"军民大生产":[[41,0.04,0.035,0.96,0.94]],"延安的故事":[[42,0.04,0.035,0.96,0.94]],"花儿与少年":[[50,0.04,0.035,0.96,0.94]],"可可西里":[[54,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g3s1");
const TEXTBOOK_CONCEPTS = [
  { name: "三和弦", type: "音乐概念", unit: 1, page: 4, facts: [["定义为", "将三个音按三度音程叠置形成的组合", null, "明", 4]] },
  { name: "七和弦", type: "音乐概念", unit: 1, page: 4, facts: [["定义为", "将四个音按三度音程叠置形成的组合", null, "明", 4]] },
  { name: "小夜曲", type: "音乐体裁", unit: 2, page: 17, facts: [["特点", "原为表达情意的歌曲，后来出现小乐队合奏的多乐章套曲", null, "明", 17]] },
  { name: "序曲", type: "音乐体裁", unit: 2, page: 17, facts: [["定义为", "歌剧、清唱剧或舞剧开场前演奏的乐曲", null, "明", 17]] },
  { name: "变奏曲", type: "音乐体裁", unit: 2, page: 17, facts: [["定义为", "围绕同一主题进行多种变化而形成的多段体乐曲", null, "明", 17]] },
  { name: "交响曲", type: "音乐体裁", unit: 2, page: 17, facts: [["定义为", "由大型交响乐队演奏的大型套曲", null, "明", 17]] },
  { name: "柱式和弦", type: "音乐概念", unit: 2, page: 18, facts: [["定义为", "和弦各音同时发声的形式", null, "明", 18]] },
  { name: "分解和弦", type: "音乐概念", unit: 2, page: 18, facts: [["定义为", "和弦各音分别发声的形式", null, "明", 18]] },
  { name: "绛州鼓乐", type: "音乐体裁", unit: 3, page: 25, facts: [["定义为", "流行于山西新绛的民间锣鼓乐，以花敲鼓、穿箱锣鼓和车鼓为代表", null, "明", 25]] },
  { name: "晋南威风锣鼓", type: "表演形式", unit: 3, page: 25, facts: [["特点", "由锣、鼓、铙、镲共同演奏，结合音乐和舞蹈", null, "明", 25]] },
  { name: "二人台", type: "音乐体裁", unit: 3, page: 25, facts: [["定义为", "多由一丑一旦演出的民间歌舞及戏曲剧种", null, "明", 25]] },
  { name: "潞安大鼓", type: "音乐体裁", unit: 3, page: 25, facts: [["特点", "又称潞安鼓书，分行当说唱，用鼓板、三弦和二胡等伴奏", null, "明", 25]] },
  { name: "晋剧", type: "音乐体裁", unit: 3, page: 25, facts: [["特点", "山西四大梆子之一，声腔丰富，板式多样", null, "明", 25]] },
  { name: "左权小花戏", type: "音乐体裁", unit: 3, page: 25, facts: [["特点", "山西左权一带的秧歌小戏，表演者持彩扇边歌边舞", null, "明", 25]] },
  { name: "加花", type: "音乐概念", unit: 3, page: 27, facts: [["定义为", "装饰或变化基本曲调的节奏、旋律，使曲调更丰富", null, "明", 27]] },
  { name: "信天游", type: "音乐体裁", unit: 4, page: 34, facts: [["特点", "陕北代表性山歌，节奏自由，音域宽，旋律起伏大", null, "明", 34]] },
  { name: "秦腔", type: "音乐体裁", unit: 4, page: 35, facts: [["特点", "中国戏曲剧种之一，唱腔慷慨激越，表演粗犷豪放", null, "明", 35]] },
  { name: "西安鼓乐", type: "音乐体裁", unit: 4, page: 35, facts: [["定义为", "西安及周边流传的大型民间鼓乐，曲体和乐器配置丰富", null, "明", 35]] },
  { name: "华阴老腔", type: "音乐体裁", unit: 4, page: 35, facts: [["特点", "陕西华阴的皮影戏剧种，声腔刚直高亢", null, "明", 35]] },
  { name: "汉乐府", type: "音乐体裁", unit: 4, page: 47, facts: [["含义", "可指汉代乐府官署，也指它采集或编创的诗歌和歌曲", null, "明", 47]] },
  { name: "花儿", type: "音乐体裁", unit: 5, page: 52, facts: [["特点", "甘青宁一带的山歌，音调高亢，起伏大，多用装饰音和下滑音", null, "明", 52]] },
  { name: "原位和弦", type: "音乐概念", unit: 1, page: 5, facts: [["定义为", "以根音为最低音的和弦", null, "明", 5]] },
  { name: "和弦转位", type: "音乐概念", unit: 1, page: 5, facts: [["记法", "将原来最低的和弦音升高八度可改变和弦的低音", null, "明", 5]] },
];
const WORK_KNOWLEDGE = {
  4: {
    "将令一声震山川": [["音乐体裁", "华阴老腔", "音乐体裁", "明", 35]],
  },
  5: {
    "驼铃响叮当": [["曲式", "三段体", "音乐概念", "明", 59]],
    "丝路驼铃": [["曲式", "三段体", "音乐概念", "明", 59]],
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
  units: [{ no, name, page, ...knowledgeForUnit("pep-g3s1", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g3s1", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = withPrintedScores("pep-g3s1", baseParts.map((part) => {
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
