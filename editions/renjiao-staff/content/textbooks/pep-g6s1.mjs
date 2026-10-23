import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》六年级上册（五线谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
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
    ["记谱方式", "五线谱", "音乐概念", "明", { pdf: 3 }],
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
const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
const baseParts = CONTENTS.map(([no, name, page, items]) => ({
  units: [{ no, name, page, ...knowledgeForUnit("pep-g6s1", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g6s1", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
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
