import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》四年级上册（五线谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g4s1",
  title: "人教版四年级上册",
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
  [1, "第一单元 凤阳花鼓黄梅调", 2, [
    ["小小歌唱家","为救李郎离家园",2,"歌曲"],
    ["音乐万花筒","安徽民歌",4,"音乐万花筒"],
    ["音乐万花筒","对花",5,"音乐作品"],
    ["创乐工坊","上、下句与起、承、转、合",6,"创乐工坊"],
    ["综合探索","徽班进京与徽州文化",8,"综合探索"],
    ["小小歌唱家","凤阳花鼓",9,"歌曲"],
  ]],
  [2, "第二单元 塞纳河畔音乐之旅", 12, [
    ["音乐万花筒","漫步塞纳河畔",12,"音乐万花筒"],
    ["趣味乐理","自然大调与自然小调",14,"趣味乐理"],
    ["趣味乐理","祖国祖国我们爱你",15,"音乐作品"],
    ["综合探索","有趣的回旋",16,"综合探索"],
    ["小小歌唱家","风筝",17,"歌曲"],
    ["小小演奏家","斗牛士之歌",22,"音乐作品"],
  ]],
  [3, "第三单元 江南水乡丝竹声", 24, [
    ["音乐万花筒","魅力江南",24,"音乐万花筒"],
    ["趣味乐理","中国五声调式",26,"音乐作品"],
    ["小小歌唱家","西湖美",28,"歌曲"],
    ["小小歌唱家","忆江南",29,"歌曲"],
    ["综合探索","茉莉香飘海内外",30,"综合探索"],
    ["综合探索","黄浦江之声",32,"综合探索"],
    ["小小舞蹈家","担鲜藕",34,"小小舞蹈家"],
  ]],
  [4, "第四单元 地中海北岸的阳光", 36, [
    ["小小歌唱家","卡普里岛",36,"歌曲"],
    ["音乐考古","亚得里亚海之旅",38,"音乐考古"],
    ["音乐万花筒","意大利歌剧之旅",40,"音乐万花筒"],
    ["音乐万花筒","意大利名琴音乐会",41,"音乐万花筒"],
    ["音乐万花筒","梦幻西班牙",42,"音乐万花筒"],
    ["小小演奏家","桑塔·露琪亚",44,"音乐作品"],
  ]],
  [5, "第五单元 英雄礼赞", 46, [
    ["小小歌唱家","红",46,"歌曲"],
    ["音乐万花筒","追寻",48,"音乐万花筒"],
    ["小小歌唱家","学习雷锋好榜样",49,"歌曲"],
    ["综合探索","英雄儿女",50,"综合探索"],
    ["小小歌唱家","我有一个梦",52,"歌曲"],
    ["创乐工坊","红色的旋律",54,"创乐工坊"],
    ["创乐工坊","游击队歌",54,"音乐作品"],
    ["小小演奏家","鸽子",56,"音乐作品"],
  ]],
  [6, "第六单元 闪闪的红星", 58, [
    ["小小音乐剧","闪闪的红星",58,"小小音乐剧"],
  ]],
];

const SCORE_PAGES = {"为救李郎离家园":[[2,0.04,0.035,0.96,0.94]],"对花":[[5,0.04,0.035,0.96,0.94]],"凤阳花鼓":[[9,0.04,0.035,0.96,0.94]],"祖国祖国我们爱你":[[15,0.04,0.035,0.96,0.94]],"风筝":[[17,0.04,0.035,0.96,0.94]],"斗牛士之歌":[[22,0.04,0.035,0.96,0.94]],"西湖美":[[28,0.04,0.035,0.96,0.94]],"忆江南":[[29,0.04,0.035,0.96,0.94]],"游击队歌":[[54,0.04,0.035,0.96,0.94]],"卡普里岛":[[36,0.04,0.035,0.96,0.94]],"桑塔·露琪亚":[[44,0.04,0.035,0.96,0.94]],"红":[[46,0.04,0.035,0.96,0.94]],"学习雷锋好榜样":[[49,0.04,0.035,0.96,0.94]],"我有一个梦":[[52,0.04,0.035,0.96,0.94]],"鸽子":[[56,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g4s1");
const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
const baseParts = CONTENTS.map(([no, name, page, items]) => ({
  units: [{ no, name, page, ...knowledgeForUnit("pep-g4s1", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g4s1", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
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
