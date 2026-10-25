import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》一年级上册（五线谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g1s1",
  title: "人教版一年级上册",
  pdfOffset: 9,
  book: [
    ["出版机构", "人民教育出版社", "机构", "明", { pdf: 3 }],
    ["编著", "课程教材研究所", "机构", "明", { pdf: 3 }],
    ["记谱方式", "五线谱", "音乐概念", "明", { pdf: 3 }],
  ],
  parts: [],
};

// [单元序号, 单元名, 单元起始页, [[栏目, 标题, 页码, 类型], …]]
const CONTENTS = [
  [1, "第一单元 奇妙的声音世界", 2, [
    ["音乐故事会","凤鸣山谷的故事",2,"音乐故事会"],
    ["情境表演","丰富多彩的声音",4,"情境表演"],
    ["情境表演","麦芽的一天",5,"情境表演"],
    ["音乐万花筒","世界音乐博览会",6,"音乐万花筒"],
    ["音乐万花筒","神奇的嗓音",8,"音乐万花筒"],
    ["游戏乐翻天","我的音量我做主",9,"游戏乐翻天"],
    ["情境表演","班级音乐会",10,"情境表演"],
    ["创乐工坊","和大人一起做“小箜篌”",12,"创乐工坊"],
  ]],
  [2, "第二单元 麒麒的节奏密码", 14, [
    ["趣味乐理","节奏密码·均拍",14,"趣味乐理"],
    ["音乐万花筒","指挥家风采",15,"音乐万花筒"],
    ["趣味乐理","节奏密码·音符",16,"趣味乐理"],
    ["趣味乐理","新年好",17,"音乐作品"],
    ["趣味乐理","节奏密码·休止符",18,"趣味乐理"],
    ["游戏乐翻天","穿越迷宫",21,"游戏乐翻天"],
    ["小小歌唱家","祖国祖国我们爱你",22,"歌曲"],
    ["游戏乐翻天","节奏变变变",24,"游戏乐翻天"],
  ]],
  [3, "第三单元 小九的旋律密码", 26, [
    ["趣味乐理","跟着小九学五线谱",26,"趣味乐理"],
    ["游戏乐翻天","看谁最先见到小九",28,"游戏乐翻天"],
    ["小小歌唱家","do re mi之歌",30,"歌曲"],
    ["游戏乐翻天","修好凤鸣桥",32,"游戏乐翻天"],
    ["小小歌唱家","洋娃娃和小熊跳舞",34,"歌曲"],
    ["小小歌唱家","娃哈哈",36,"歌曲"],
  ]],
  [4, "第四单元 打击乐大赛", 38, [
    ["音乐万花筒","打击乐竞演",38,"音乐万花筒"],
    ["游戏乐翻天","我的“身体打击乐”",40,"游戏乐翻天"],
    ["小小演奏家","多样的课堂打击乐器",42,"小小演奏家"],
    ["创乐工坊","数鸭子",43,"音乐作品"],
    ["情境表演","玩具兵进行曲",44,"音乐作品"],
    ["游戏乐翻天","我家门前有条河",46,"游戏乐翻天"],
    ["小小歌唱家","乃哟乃",48,"歌曲"],
  ]],
  [5, "第五单元 弹拨乐彩排", 50, [
    ["音乐万花筒","彩排现场",50,"音乐万花筒"],
    ["音乐故事会","高山流水遇知音",52,"音乐故事会"],
    ["游戏乐翻天","伸缩的节奏",54,"游戏乐翻天"],
    ["创乐工坊","小小作曲家",56,"创乐工坊"],
    ["小小歌唱家","快乐的罗梭",58,"歌曲"],
  ]],
  [6, "第六单元 管乐音乐会", 60, [
    ["音乐万花筒","吹管乐家族聚会",60,"音乐万花筒"],
    ["游戏乐翻天","节奏音高握握手",62,"游戏乐翻天"],
    ["情境表演","小号与大号",63,"情境表演"],
    ["小小歌唱家","中华人民共和国国歌",66,"歌曲"],
    ["小小歌唱家","共产儿童团歌",68,"歌曲"],
  ]],
  [7, "第七单元 弓弦乐试听会", 70, [
    ["音乐万花筒","“发烧友”试听会",70,"音乐万花筒"],
    ["游戏乐翻天","山谷音乐会",72,"游戏乐翻天"],
    ["音乐万花筒","小夜曲",74,"音乐作品"],
    ["小小歌唱家","我和小提琴",75,"歌曲"],
    ["音乐万花筒","欢欢喜喜过大年",76,"音乐万花筒"],
  ]],
  [8, "第八单元 唤醒春天", 78, [
    ["小小音乐剧","唤醒春天",78,"小小音乐剧"],
  ]],
];

const SCORE_PAGES = {"doremi之歌":[[30,0.04,0.035,0.96,0.94]],"新年好":[[17,0.04,0.035,0.96,0.94]],"祖国祖国我们爱你":[[22,0.04,0.035,0.96,0.94],[23,0.04,0.035,0.96,0.94]],"洋娃娃和小熊跳舞":[[34,0.04,0.035,0.96,0.94]],"娃哈哈":[[36,0.04,0.035,0.96,0.94]],"数鸭子":[[43,0.04,0.035,0.96,0.94]],"玩具兵进行曲":[[44,0.04,0.035,0.96,0.94]],"乃哟乃":[[48,0.04,0.035,0.96,0.94]],"快乐的罗梭":[[58,0.04,0.035,0.96,0.94]],"中华人民共和国国歌":[[66,0.04,0.035,0.96,0.94]],"共产儿童团歌":[[68,0.04,0.035,0.96,0.94]],"小夜曲":[[74,0.04,0.035,0.96,0.94]],"我和小提琴":[[75,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g1s1");
const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
const baseParts = CONTENTS.map(([no, name, page, items]) => ({
  units: [{ no, name, page, ...knowledgeForUnit("pep-g1s1", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g1s1", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = withPrintedScores("pep-g1s1", baseParts.map((part) => {
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
