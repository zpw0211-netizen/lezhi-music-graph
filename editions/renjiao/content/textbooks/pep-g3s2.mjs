import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》三年级下册（简谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g3s2",
  title: "人教版三年级下册",
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
  [1, "第一单元 美丽的草原我的家", 2, [
    ["小小歌唱家","美丽的草原我的家",2,"歌曲"],
    ["小小歌唱家","春天来了",4,"歌曲"],
    ["音乐万花筒","长调与短调",6,"音乐万花筒"],
    ["音乐万花筒","草原上的歌",8,"音乐万花筒"],
    ["音乐万花筒","牧歌",9,"音乐作品"],
    ["音乐万花筒","万马奔腾",10,"音乐作品"],
    ["小小演奏家","酒歌",12,"音乐作品"],
  ]],
  [2, "第二单元 乐品东北亚", 14, [
    ["小小歌唱家","赤诚花",14,"歌曲"],
    ["小小歌唱家","四季歌",15,"歌曲"],
    ["音乐万花筒","东北亚音声",16,"音乐万花筒"],
    ["小小演奏家","樱花",19,"音乐作品"],
    ["小小演奏家","卖花姑娘",19,"音乐作品"],
    ["小小演奏家","牧羊人的歌",20,"音乐作品"],
    ["趣味乐理","半音距离与音程协和度",21,"趣味乐理"],
  ]],
  [3, "第三单元 天山南北，美丽新疆", 24, [
    ["音乐万花筒","新疆之声",24,"音乐万花筒"],
    ["小小歌唱家","美丽的夏牧场",26,"歌曲"],
    ["小小演奏家","幸福花儿开心上",28,"音乐作品"],
    ["综合探索","歌舞新疆",30,"综合探索"],
  ]],
  [4, "第四单元 雪域高原之声", 34, [
    ["小小歌唱家","北京的金山上",34,"歌曲"],
    ["小小歌唱家","次仁拉索",36,"歌曲"],
    ["创乐工坊","紧缩与放大",37,"创乐工坊"],
    ["创乐工坊","我的家在日喀则",37,"音乐作品"],
    ["音乐万花筒","珠峰脚下乐声扬",38,"音乐万花筒"],
    ["音乐考古","远古回声，眺望青藏",40,"音乐考古"],
    ["小小演奏家","格桑拉",42,"音乐作品"],
  ]],
  [5, "第五单元 丝绸之路出天山", 44, [
    ["小小歌唱家","月亮叔叔住得远",44,"歌曲"],
    ["音乐万花筒","音响南亚",46,"音乐万花筒"],
    ["小小舞蹈家","学跳印度舞",49,"小小舞蹈家"],
    ["音乐万花筒","一千零一夜",50,"音乐万花筒"],
  ]],
  [6, "第六单元 彼得与狼", 52, [
    ["小小音乐剧","彼得与狼",52,"小小音乐剧"],
  ]],
];

const SCORE_PAGES = {"美丽的草原我的家":[[2,0.04,0.035,0.96,0.94]],"春天来了":[[4,0.04,0.035,0.96,0.94]],"牧歌":[[9,0.04,0.035,0.96,0.94]],"万马奔腾":[[10,0.04,0.035,0.96,0.94]],"酒歌":[[12,0.04,0.035,0.96,0.94]],"赤诚花":[[14,0.04,0.035,0.96,0.94]],"四季歌":[[15,0.04,0.035,0.96,0.94]],"樱花":[[19,0.04,0.035,0.96,0.94]],"卖花姑娘":[[19,0.04,0.035,0.96,0.94]],"牧羊人的歌":[[20,0.04,0.035,0.96,0.94]],"美丽的夏牧场":[[26,0.04,0.035,0.96,0.94]],"幸福花儿开心上":[[28,0.04,0.035,0.96,0.94]],"北京的金山上":[[34,0.04,0.035,0.96,0.94]],"次仁拉索":[[36,0.04,0.035,0.96,0.94]],"我的家在日喀则":[[37,0.04,0.035,0.96,0.94]],"格桑拉":[[42,0.04,0.035,0.96,0.94]],"月亮叔叔住得远":[[44,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g3s2");
const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
const baseParts = CONTENTS.map(([no, name, page, items]) => ({
  units: [{ no, name, page, ...knowledgeForUnit("pep-g3s2", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g3s2", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
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
