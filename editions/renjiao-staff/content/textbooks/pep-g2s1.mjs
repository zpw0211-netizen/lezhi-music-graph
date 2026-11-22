import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》二年级上册（五线谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g2s1",
  title: "人教版二年级上册",
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
  [1, "第一单元 京腔京味儿", 4, [
    ["音乐万花筒","生旦净丑荟精粹",4,"音乐万花筒"],
    ["小小歌唱家","报灯名",6,"歌曲"],
    ["小小歌唱家","龙里格龙",7,"歌曲"],
    ["音乐万花筒","京剧的伴奏乐器",8,"音乐万花筒"],
    ["创乐工坊","锣鼓经",9,"创乐工坊"],
    ["音乐万花筒","京味儿绕京城",10,"音乐万花筒"],
  ]],
  [2, "第二单元 燕赵大地连津门", 14, [
    ["游戏乐翻天","我们一起打快板",14,"游戏乐翻天"],
    ["音乐万花筒","津冀之声",17,"音乐万花筒"],
    ["小小歌唱家","小放牛",20,"歌曲"],
    ["小小歌唱家","大逛灯",21,"歌曲"],
    ["小小演奏家","小放驴",22,"音乐作品"],
  ]],
  [3, "第三单元 八月十五月儿圆", 24, [
    ["游戏乐翻天","中秋大观园",24,"游戏乐翻天"],
    ["游戏乐翻天","小小的船",24,"音乐作品"],
    ["创乐工坊","中秋的舞步",27,"创乐工坊"],
    ["小小歌唱家","爷爷为我打月饼",28,"歌曲"],
    ["音乐万花筒","听乐·赏月",29,"音乐万花筒"],
    ["小小演奏家","彩云追月",30,"音乐作品"],
  ]],
  [4, "第四单元 中州之声", 32, [
    ["音乐万花筒","多彩豫风",32,"音乐万花筒"],
    ["音乐万花筒","谁说女子不如男",33,"音乐作品"],
    ["小小歌唱家","编花篮",35,"歌曲"],
    ["音乐考古","中州古乐",36,"音乐考古"],
    ["小小演奏家","十枝花",38,"音乐作品"],
  ]],
  [5, "第五单元 齐风鲁韵", 40, [
    ["音乐万花筒","沂蒙山小调",40,"音乐万花筒"],
    ["小小歌唱家","花蛤蟆",41,"歌曲"],
    ["情境表演","武松打虎",42,"情境表演"],
    ["音乐万花筒","谁不说俺家乡好",44,"音乐万花筒"],
    ["综合探索","孔子与音乐",48,"综合探索"],
  ]],
  [6, "第六单元 摇曳的律动", 50, [
    ["趣味乐理","荡漾的节拍",50,"趣味乐理"],
    ["趣味乐理","乘着歌声的翅膀",51,"音乐作品"],
    ["游戏乐翻天","泛舟凤鸣河",52,"游戏乐翻天"],
    ["小小歌唱家","愉快的梦",54,"歌曲"],
    ["小小歌唱家","春游",56,"歌曲"],
    ["创乐工坊","重复与对比",57,"创乐工坊"],
    ["小小演奏家","船歌",58,"音乐作品"],
  ]],
  [7, "第七单元 四季的颜色", 60, [
    ["小小歌唱家","嘀哩嘀哩",60,"歌曲"],
    ["音乐万花筒","音乐中的四季",62,"音乐万花筒"],
    ["小小歌唱家","梅花",64,"歌曲"],
    ["小小舞蹈家","小池",65,"小小舞蹈家"],
    ["趣味乐理","乐句与乐段",66,"趣味乐理"],
  ]],
  [8, "第八单元 蜗牛与黄鹂鸟", 68, [
    ["小小音乐剧","蜗牛与黄鹂鸟",68,"小小音乐剧"],
    ["小小音乐剧","水牛儿",75,"音乐作品"],
  ]],
];

const SCORE_PAGES = {"龙里格龙":[[7,0.04,0.035,0.96,0.94]],"小放牛":[[20,0.04,0.035,0.96,0.94]],"大逛灯":[[21,0.04,0.035,0.96,0.94]],"小放驴":[[22,0.04,0.035,0.96,0.94]],"小小的船":[[24,0.04,0.035,0.96,0.94]],"爷爷为我打月饼":[[28,0.04,0.035,0.96,0.94]],"彩云追月":[[30,0.04,0.035,0.96,0.94]],"谁说女子不如男":[[33,0.04,0.035,0.96,0.94]],"编花篮":[[35,0.04,0.035,0.96,0.94]],"十枝花":[[38,0.04,0.035,0.96,0.94]],"花蛤蟆":[[41,0.04,0.035,0.96,0.94]],"乘着歌声的翅膀":[[51,0.04,0.035,0.96,0.94]],"愉快的梦":[[54,0.04,0.035,0.96,0.94]],"春游":[[56,0.04,0.035,0.96,0.94]],"船歌":[[58,0.04,0.035,0.96,0.94]],"嘀哩嘀哩":[[60,0.04,0.035,0.96,0.94]],"梅花":[[64,0.04,0.035,0.96,0.94]],"水牛儿":[[75,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g2s1");
const TEXTBOOK_CONCEPTS = [
  { name: "戏曲", type: "音乐体裁", unit: 1, page: 4, facts: [["定义为", "具有歌舞特征的中国传统戏剧形式", null, "明", 4]] },
  { name: "京剧", type: "音乐体裁", unit: 1, page: 4, facts: [["特点", "流传广泛的戏曲剧种，主要以唱念做打表现", null, "明", 4]] },
  { name: "板式", type: "音乐概念", unit: 1, page: 6, facts: [["定义为", "戏曲音乐中节拍与节奏的组织形式", null, "明", 6]] },
  { name: "数板", type: "音乐概念", unit: 1, page: 6, facts: [["特点", "只念词而不歌唱，用板击拍的戏曲板式", null, "明", 6]] },
  { name: "民歌", type: "音乐体裁", unit: 1, page: 10, facts: [["定义为", "群众在日常生活中为表达情意创作并口耳相传的歌曲", null, "明", 10]] },
  { name: "京韵大鼓", type: "音乐体裁", unit: 1, page: 11, facts: [["特点", "流行于京津，演唱者右手击鼓、左手持板", null, "明", 11]] },
  { name: "单弦", type: "音乐体裁", unit: 1, page: 11, facts: [["特点", "源于北京，又叫单弦牌子曲，以八角鼓击节、三弦伴奏", null, "明", 11]] },
  { name: "曲艺", type: "音乐体裁", unit: 1, page: 11, facts: [["定义为", "中国各种说唱表演艺术的总称", null, "明", 11]] },
  { name: "北京琴书", type: "音乐体裁", unit: 1, page: 12, facts: [["特点", "流行于京津冀，演唱者左手敲梨花片、右手击书鼓", null, "明", 12]] },
  { name: "天津快板", type: "音乐体裁", unit: 2, page: 16, facts: [
    ["特点", "以天津方言说唱，有单人、对口和群口形式", null, "明", 16],
    ["包含", "单人快板", "表演形式", "明", 16],
    ["包含", "对口快板", "表演形式", "明", 16],
    ["包含", "群口快板", "表演形式", "明", 16],
  ] },
  { name: "天津时调", type: "音乐体裁", unit: 2, page: 17, facts: [["特点", "天津代表性曲艺之一，多以三弦和四胡伴奏", null, "明", 17]] },
  { name: "西河大鼓", type: "音乐体裁", unit: 2, page: 17, facts: [["特点", "源于冀中，演员敲铜片、击书鼓说唱，通常由大三弦伴奏", null, "明", 17]] },
  { name: "评剧", type: "音乐体裁", unit: 2, page: 18, facts: [["特点", "流行于我国北方，有说有唱，常以板胡伴奏", null, "明", 18]] },
  { name: "河北吹歌", type: "音乐体裁", unit: 2, page: 18, facts: [["特点", "河北传统吹打乐，以吹管乐器为主，辅以打击和拉弦乐器", null, "明", 18]] },
  { name: "豫剧", type: "音乐体裁", unit: 4, page: 33, facts: [["特点", "流行于河南及邻近地区，属梆子腔系，以河南话演唱", null, "明", 33]] },
  { name: "河南坠子", type: "音乐体裁", unit: 4, page: 34, facts: [["特点", "河南等地的曲艺，演唱为主，夹有河南方言说白，多用坠琴伴奏", null, "明", 34]] },
  { name: "3/8", type: "拍号", unit: 6, page: 50, facts: [["含义", "八分音符为一拍，每小节三拍", null, "明", 50]] },
  { name: "6/8", type: "拍号", unit: 6, page: 51, facts: [["含义", "八分音符为一拍，每小节六拍", null, "明", 51]] },
  { name: "重复", type: "音乐概念", unit: 6, page: 57, facts: [["作用", "通过重复旋律材料使音乐保持统一", null, "明", 57]] },
  { name: "对比", type: "音乐概念", unit: 6, page: 57, facts: [["作用", "通过不同旋律材料使音乐产生变化", null, "明", 57]] },
  { name: "乐段", type: "音乐概念", unit: 7, page: 66, facts: [["定义为", "由乐句组织而成", null, "明", 66]] },
  { name: "文场", type: "音乐概念", unit: 1, page: 8, facts: [["特点", "京剧伴奏中使用京胡、京二胡、月琴和三弦等乐器的部分", null, "明", 8]] },
  { name: "武场", type: "音乐概念", unit: 1, page: 8, facts: [["特点", "京剧伴奏中使用鼓板、大锣、小锣及铙钹等乐器的部分", null, "明", 8]] },
  { name: "锣鼓经", type: "音乐概念", unit: 1, page: 9, facts: [
    ["包含", "急急风", "音乐概念", "明", 9],
    ["包含", "四击头", "音乐概念", "明", 9],
  ] },
];
const WORK_KNOWLEDGE = {
  1: {
    "报灯名": [["板式", "数板", "音乐体裁", "明", 6]],
  },
  7: {
    "新年": [["曲式", "一段体", "音乐概念", "明", 66]],
  },
};
const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
const conceptsForUnit = (no) => {
  const additions = new Map(TEXTBOOK_CONCEPTS.filter((item) => item.unit === no).map((item) => [item.name, item]));
  const existing = ENRICHMENT.concepts.filter((item) => item.unit === no && item.name !== "轻快、活泼地").map((item) => {
    const source = additions.get(item.name);
    if (!source) return item;
    additions.delete(item.name);
    return { ...item, page: source.page, facts: [...(item.facts ?? []), ...source.facts] };
  });
  return [...existing, ...additions.values()];
};
const baseParts = CONTENTS.map(([no, name, page, items]) => ({
  units: [{ no, name, page, ...knowledgeForUnit("pep-g2s1", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g2s1", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = withPrintedScores("pep-g2s1", baseParts.map((part) => {
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
    if (!facts) return work;
    const existing = work.name === "新年" && work.unit === 7
      ? work.facts.filter(([relation, name, , , page]) => relation !== "音乐体裁" || page !== 66 || !["一段体", "二段体", "三段体"].includes(name))
      : work.facts;
    return { ...work, facts: [...existing, ...facts] };
  }),
}));

export default textbook;
