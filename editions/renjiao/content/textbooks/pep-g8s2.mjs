import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》八年级下册（简谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g8s2",
  title: "人教版八年级下册",
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
  [1, "第一单元 结构的美感", 2, [
    ["学习项目","统一、变化与平衡",2,"学习项目"],
    ["学习项目","送别",2,"音乐作品"],
    ["学习项目","大海啊，故乡",5,"音乐作品"],
    ["学习项目","中国传统音乐的多段联缀体结构",10,"学习项目"],
  ]],
  [2, "第二单元 人声的交响", 18, [
    ["学习项目","合唱的力量",18,"学习项目"],
    ["学习项目","保卫黄河",19,"音乐作品"],
    ["学习项目","康塔塔与清唱剧",24,"学习项目"],
  ]],
  [3, "第三单元 乐器的交响", 32, [
    ["学习项目","复杂的音乐表达",32,"学习项目"],
    ["学习项目","用音乐叙事与抒情",36,"学习项目"],
    ["学习项目","交响曲",41,"学习项目"],
    ["学习项目","第五（命运）交响曲",41,"音乐作品"],
    ["学习项目","协奏曲",45,"学习项目"],
    ["学习项目","第一小提琴协奏曲",45,"音乐作品"],
  ]],
  [4, "第四单元 综合舞台艺术", 50, [
    ["学习项目","走进歌剧",50,"学习项目"],
    ["学习项目","天边有颗闪亮的星",57,"音乐作品"],
    ["学习项目","走进舞剧",58,"学习项目"],
    ["学习项目","走进戏曲",64,"学习项目"],
  ]],
  [5, "印在心里的歌", 70, [
    ["印在心里的歌","中国共产主义青年团团歌",70,"歌曲"],
    ["印在心里的歌","唱支山歌给党听",71,"歌曲"],
  ]],
];

const SCORE_PAGES = {"送别":[[2,0.04,0.035,0.96,0.94]],"大海啊，故乡":[[5,0.04,0.035,0.96,0.94]],"保卫黄河":[[19,0.04,0.035,0.96,0.94]],"第一小提琴协奏曲":[[45,0.04,0.035,0.96,0.94]],"天边有颗闪亮的星":[[57,0.04,0.035,0.96,0.94]],"中国共产主义青年团团歌":[[70,0.04,0.035,0.96,0.94]],"唱支山歌给党听":[[71,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g8s2");
const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
const baseParts = CONTENTS.map(([no, name, page, items]) => ({
  units: [{ no, name, page, ...knowledgeForUnit("pep-g8s2", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g8s2", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = withPrintedScores("pep-g8s2", baseParts.map((part) => {
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
}));

export default textbook;
