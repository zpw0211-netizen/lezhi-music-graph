import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》九年级上册（五线谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g9s1",
  title: "人教版九年级上册",
  pdfOffset: 5,
  book: [
    ["出版机构", "人民教育出版社", "机构", "明", { pdf: 3 }],
    ["编著", "课程教材研究所", "机构", "明", { pdf: 3 }],
    ["记谱方式", "五线谱", "音乐概念", "明", { pdf: 3 }],
  ],
  parts: [],
};

// [单元序号, 单元名, 单元起始页, [[栏目, 标题, 页码, 类型], …]]
const CONTENTS = [
  [1, "第一单元 音乐的数字化", 2, [
    ["学习项目","数字化时代的音乐创作",2,"学习项目"],
    ["学习项目","一个人的音乐工程",5,"学习项目"],
    ["学习项目","红旗颂",5,"音乐作品"],
    ["学习项目","回声",8,"音乐作品"],
  ]],
  [2, "第二单元 音乐的传播", 12, [
    ["学习项目","一首作品的旅行",12,"学习项目"],
    ["学习项目","一首作品旅途中的伙伴",16,"学习项目"],
  ]],
  [3, "第三单元 音乐的品鉴", 24, [
    ["学习项目","音乐审美有差异",24,"学习项目"],
    ["学习项目","音乐审美有标准",28,"学习项目"],
  ]],
  [4, "第四单元 一部校园音乐剧的诞生", 34, [
    ["学习项目","校园音乐剧策划会",34,"学习项目"],
    ["学习项目","校园音乐剧创演",38,"学习项目"],
    ["学习项目","校园音乐剧宣传与总结",44,"学习项目"],
  ]],
  [5, "印在心里的歌", 48, [
    ["印在心里的歌","我爱你，中国",48,"歌曲"],
    ["印在心里的歌","妈妈教我一支歌",50,"歌曲"],
  ]],
];

const SCORE_PAGES = {"红旗颂":[[5,0.13,0.52,0.86,0.735]],"回声":[[8,0.04,0.035,0.96,0.94]],"我爱你，中国":[[48,0.04,0.035,0.96,0.94]],"妈妈教我一支歌":[[50,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g9s1");
const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
const baseParts = CONTENTS.map(([no, name, page, items]) => ({
  units: [{ no, name, page, ...knowledgeForUnit("pep-g9s1", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g9s1", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = withPrintedScores("pep-g9s1", baseParts.map((part) => {
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
