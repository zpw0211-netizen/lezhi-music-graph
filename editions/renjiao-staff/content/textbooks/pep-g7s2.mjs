import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》七年级下册（五线谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
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
    ["记谱方式", "五线谱", "音乐概念", "明", { pdf: 3 }],
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
const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
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
    concepts: ENRICHMENT.concepts.filter((item) => item.unit === no),
    people: ENRICHMENT.people.filter((item) => item.unit === no),
    tasks: ENRICHMENT.tasks.filter((item) => item.unit === no),
    references: ENRICHMENT.references.filter((item) => item.unit === no),
  };
}));

export default textbook;
