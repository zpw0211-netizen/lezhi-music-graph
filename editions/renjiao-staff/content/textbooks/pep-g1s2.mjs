import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》一年级下册（简谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g1s2",
  title: "人教版一年级下册",
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
  [1, "第一单元 爱的摇篮", 2, [
    ["音乐万花筒","音乐礼盒开开开",2,"音乐万花筒"],
    ["音乐万花筒","爱的奉献",3,"音乐作品"],
    ["游戏乐翻天","小松鼠藏果实",4,"游戏乐翻天"],
    ["小小歌唱家","摇篮曲",5,"歌曲"],
    ["趣味乐理","力度与速度",8,"趣味乐理"],
    ["游戏乐翻天","爱的传递",10,"游戏乐翻天"],
    ["小小演奏家","手指游戏",12,"小小演奏家"],
  ]],
  [2, "第二单元 你是我的好朋友", 14, [
    ["小小歌唱家","找朋友",14,"歌曲"],
    ["游戏乐翻天","碰碰车",16,"游戏乐翻天"],
    ["音乐万花筒","龟兔赛跑",18,"音乐万花筒"],
    ["小小演奏家","找到键盘上的“朋友”",20,"小小演奏家"],
    ["小小演奏家","柳树姑娘",21,"音乐作品"],
  ]],
  [3, "第三单元 绿色家园", 22, [
    ["音乐万花筒","森林与小鸟",22,"音乐万花筒"],
    ["情境表演","春天里的植树节",23,"情境表演"],
    ["小小歌唱家","绿色的祖国",24,"歌曲"],
    ["趣味乐理","升号与降号",25,"趣味乐理"],
    ["游戏乐翻天","眼力大比拼",26,"游戏乐翻天"],
    ["小小演奏家","小松树",27,"音乐作品"],
    ["音乐万花筒","致春天",28,"音乐万花筒"],
  ]],
  [4, "第四单元 一二三，转转转", 30, [
    ["音乐万花筒","舞会上的小指挥",30,"音乐万花筒"],
    ["音乐万花筒","溜冰圆舞曲",31,"音乐作品"],
    ["音乐万花筒","蓝色多瑙河圆舞曲",31,"音乐作品"],
    ["小小舞蹈家","儿童圆舞曲",32,"音乐作品"],
    ["小小歌唱家","请你唱首歌吧",34,"歌曲"],
    ["小小演奏家","唱唱名，手弹琴",36,"小小演奏家"],
  ]],
  [5, "第五单元 劳动最光荣", 38, [
    ["音乐万花筒","劳动最光荣",38,"音乐作品"],
    ["小小歌唱家","勤快人和懒惰人",40,"歌曲"],
    ["小小歌唱家","打麦号子",41,"歌曲"],
    ["游戏乐翻天","劳动集体舞",42,"游戏乐翻天"],
    ["创乐工坊","勤劳的小蜜蜂",43,"创乐工坊"],
    ["小小演奏家","牧童谣",44,"音乐作品"],
  ]],
  [6, "第六单元 生活中的音乐", 46, [
    ["音乐万花筒","我的每日音乐",46,"音乐万花筒"],
    ["小小歌唱家","老爷爷赶鹅",48,"歌曲"],
    ["小小歌唱家","观灯",50,"歌曲"],
    ["音乐万花筒","在钟表店里",51,"音乐作品"],
    ["创乐工坊","雨来啦",52,"创乐工坊"],
    ["游戏乐翻天","音乐让我们更快乐",54,"游戏乐翻天"],
  ]],
  [7, "第七单元 动画城", 56, [
    ["音乐万花筒","动画音乐会",56,"音乐万花筒"],
    ["游戏乐翻天","拉洋片",58,"游戏乐翻天"],
    ["小小歌唱家","小邋遢",60,"歌曲"],
    ["小小歌唱家","大风车",61,"歌曲"],
    ["创乐工坊","唐僧骑马咚嘚咚",62,"创乐工坊"],
  ]],
  [8, "第八单元 两只老虎与小兔乖乖", 64, [
    ["小小音乐剧","两只老虎与小兔乖乖",64,"小小音乐剧"],
  ]],
];

const SCORE_PAGES = {"爱的奉献":[[3,0.04,0.035,0.96,0.94]],"摇篮曲":[[5,0.04,0.035,0.96,0.94]],"找朋友":[[14,0.04,0.035,0.96,0.94]],"柳树姑娘":[[21,0.04,0.035,0.96,0.94]],"绿色的祖国":[[24,0.04,0.035,0.96,0.94]],"小松树":[[27,0.04,0.035,0.96,0.94]],"溜冰圆舞曲":[[31,0.04,0.035,0.96,0.94]],"蓝色多瑙河圆舞曲":[[31,0.04,0.035,0.96,0.94]],"请你唱首歌吧":[[34,0.04,0.035,0.96,0.94]],"劳动最光荣":[[38,0.04,0.035,0.96,0.94]],"勤快人和懒惰人":[[40,0.04,0.035,0.96,0.94]],"打麦号子":[[41,0.04,0.035,0.96,0.94]],"牧童谣":[[44,0.04,0.035,0.96,0.94]],"老爷爷赶鹅":[[48,0.04,0.035,0.96,0.94]],"观灯":[[50,0.04,0.035,0.96,0.94]],"在钟表店里":[[51,0.04,0.035,0.96,0.94]],"小邋遢":[[60,0.04,0.035,0.96,0.94]],"大风车":[[61,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g1s2");
const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
const baseParts = CONTENTS.map(([no, name, page, items]) => ({
  units: [{ no, name, page, ...knowledgeForUnit("pep-g1s2", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g1s2", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
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
