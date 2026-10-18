import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》三年级上册（简谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
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
    ["记谱方式", "简谱", "音乐概念", "明", { pdf: 3 }],
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
const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
const baseParts = CONTENTS.map(([no, name, page, items]) => ({
  units: [{ no, name, page, ...knowledgeForUnit("pep-g3s1", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g3s1", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = baseParts.map((part) => {
  const { no } = part.units[0];
  const baseWorks = part.works.map((work) => {
    const extra = ENRICHMENT.existingWorkFacts.find((item) => item.unit === no && bare(item.name) === bare(work.name));
    return { ...work, facts: [...work.facts, ...(extra?.facts ?? [])] };
  });
  const extraWorks = ENRICHMENT.newWorks.filter((work) => work.unit === no).map((work) => ({ ...work, mode: undefined }));
  return {
    units: part.units,
    works: [...baseWorks, ...extraWorks],
    concepts: ENRICHMENT.concepts.filter((item) => item.unit === no),
    people: ENRICHMENT.people.filter((item) => item.unit === no),
    tasks: ENRICHMENT.tasks.filter((item) => item.unit === no),
    references: ENRICHMENT.references.filter((item) => item.unit === no),
  };
});

export default textbook;
