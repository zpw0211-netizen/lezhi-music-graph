import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》七年级上册（简谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g7s1",
  title: "人教版七年级上册",
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
  [1, "第一单元 生活中的音乐", 2, [
    ["学习项目","生活中的音乐",2,"学习项目"],
    ["学习项目","歌唱祖国",4,"音乐作品"],
    ["学习项目","音乐开启心灵之窗",6,"学习项目"],
    ["学习项目","学习乐谱，记录你的音乐生活",10,"学习项目"],
  ]],
  [2, "第二单元 多彩的音乐风格", 22, [
    ["学习项目","中国音乐万花筒",22,"学习项目"],
    ["学习项目","丑末寅初",24,"音乐作品"],
    ["学习项目","蝶恋花·答李淑一",25,"音乐作品"],
    ["学习项目","牧歌",28,"音乐作品"],
    ["学习项目","上去高山望平川",29,"音乐作品"],
    ["学习项目","歌唱美丽的家乡",30,"音乐作品"],
    ["学习项目","世界民族音乐博览会",38,"学习项目"],
  ]],
  [3, "第三单元 中国音乐的历史进程", 46, [
    ["学习项目","中国音乐考古博物馆",46,"学习项目"],
    ["学习项目","阳关三叠",50,"音乐作品"],
    ["学习项目","中国近现代音乐风云录",52,"学习项目"],
    ["学习项目","歌唱我们的祖国",58,"学习项目"],
  ]],
  [4, "第四单元 西方音乐发展史掠影", 64, [
    ["学习项目","从古希腊到古典主义",64,"学习项目"],
    ["学习项目","音乐中的浪漫主义",70,"学习项目"],
    ["学习项目","20世纪西方音乐轨迹",74,"学习项目"],
  ]],
  [5, "印在心里的歌", 80, [
    ["印在心里的歌","中华人民共和国国歌",80,"歌曲"],
    ["印在心里的歌","国际歌",81,"歌曲"],
  ]],
];

const SCORE_PAGES = {"歌唱祖国":[[4,0.04,0.035,0.96,0.94]],"丑末寅初":[[24,0.04,0.035,0.96,0.94]],"蝶恋花·答李淑一":[[25,0.04,0.035,0.96,0.94]],"牧歌":[[28,0.04,0.035,0.96,0.94]],"上去高山望平川":[[29,0.04,0.035,0.96,0.94]],"歌唱美丽的家乡":[[30,0.04,0.035,0.96,0.94]],"阳关三叠":[[50,0.04,0.035,0.96,0.94]],"中华人民共和国国歌":[[80,0.04,0.035,0.96,0.94]],"国际歌":[[81,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g7s1");
const TEXTBOOK_CONCEPTS = [
  { name: "叠", type: "音乐概念", unit: 3, page: 51, facts: [["含义", "古代同曲变奏结构的称谓，三叠指演唱或变奏了三次", null, "明", 51]] },
  { name: "巴洛克音乐", type: "音乐概念", unit: 4, page: 66, facts: [["特点", "重视装饰，以大小调和声和主调织体为创作基础", null, "明", 66]] },
  { name: "古典主义音乐", type: "音乐概念", unit: 4, page: 66, facts: [["特点", "在创作和表演中追求和谐、均衡、自然与规则", null, "明", 66]] },
  { name: "浪漫主义音乐", type: "音乐概念", unit: 4, page: 71, facts: [["特点", "重视个人情感和民族性，形式多样，也强调与其他艺术结合", null, "明", 71]] },
];
const WORK_KNOWLEDGE = {
  4: {
    "我看到云雀高飞": [["音乐体裁", "世俗歌曲", "音乐体裁", "明", 64]],
    "D大调第五号勃兰登堡协奏曲": [["音乐体裁", "协奏曲", "音乐体裁", "明", 66]],
    "G大调第一百（军队）交响曲": [["音乐体裁", "交响曲", "音乐体裁", "明", 67]],
    "C大调第二十一钢琴奏鸣曲": [["音乐体裁", "奏鸣曲", "音乐体裁", "明", 67]],
    "e小调小提琴协奏曲": [["音乐体裁", "小提琴协奏曲", "音乐体裁", "明", 71]],
    "B大调第一钢琴三重奏": [["表演形式", "钢琴三重奏", "表演形式", "明", 71]],
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
  units: [{ no, name, page, ...knowledgeForUnit("pep-g7s1", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g7s1", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = withPrintedScores("pep-g7s1", baseParts.map((part) => {
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
