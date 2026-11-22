import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

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
const TEXTBOOK_CONCEPTS = [
  { name: "呼麦", type: "表演形式", unit: 1, page: 4, facts: [["定义为", "蒙古族特有的一种歌唱形式", null, "明", 4]] },
  { name: "长调", type: "音乐体裁", unit: 1, page: 7, facts: [["特点", "蒙古族民歌，音域宽广、节拍自由，旋律悠长而起伏较大", null, "明", 7]] },
  { name: "短调", type: "音乐体裁", unit: 1, page: 7, facts: [["特点", "蒙古族民歌，节拍与节奏规整，结构方整、旋律较平稳", null, "明", 7]] },
  { name: "能乐", type: "音乐体裁", unit: 2, page: 17, facts: [["特点", "日本传统歌舞戏剧艺术，表演常使用面具等道具", null, "明", 17]] },
  { name: "半音", type: "音乐概念", unit: 2, page: 21, facts: [["定义为", "键盘上相邻琴键对应的两个音之间的距离", null, "明", 21]] },
  { name: "小二度", type: "音乐概念", unit: 2, page: 21, facts: [["定义为", "距离为一个半音的二度音程", null, "明", 21]] },
  { name: "大二度", type: "音乐概念", unit: 2, page: 21, facts: [["定义为", "距离为两个半音的二度音程", null, "明", 21]] },
  { name: "协和音程", type: "音乐概念", unit: 2, page: 22, facts: [["特点", "在和声音程中，音响松弛悦耳", null, "明", 22]] },
  { name: "不协和音程", type: "音乐概念", unit: 2, page: 22, facts: [["特点", "在和声音程中，音响紧张尖锐", null, "明", 22]] },
  { name: "二段体", type: "音乐体裁", unit: 3, page: 27, facts: [["特点", "由两个乐段组成，含有对比或再现", null, "明", 27]] },
  { name: "三段体", type: "音乐体裁", unit: 3, page: 27, facts: [["特点", "由三个乐段组成，含有对比或再现", null, "明", 27]] },
  { name: "同音换指", type: "音乐概念", unit: 3, page: 29, facts: [["定义为", "用不同的手指交替弹奏同一个音", null, "明", 29]] },
  { name: "赛乃姆", type: "音乐体裁", unit: 3, page: 30, facts: [["特点", "维吾尔族民间歌舞，常在节庆表演，可独舞、对舞或多人共舞", null, "明", 30]] },
  { name: "黑走马", type: "音乐体裁", unit: 3, page: 30, facts: [["特点", "哈萨克族民间舞，以抖肩和马步等模拟骏马奔跑", null, "明", 30]] },
  { name: "木卡姆", type: "音乐体裁", unit: 3, page: 31, facts: [["定义为", "综合歌唱、舞蹈和器乐的艺术形式，体裁和风格多样", null, "明", 31]] },
  { name: "三十二分音符", type: "音乐概念", unit: 3, page: 31, facts: [["含义", "时值是十六分音符的一半", null, "明", 31]] },
  { name: "紧缩", type: "音乐概念", unit: 4, page: 37, facts: [["作用", "收紧节奏，推动音乐发展并丰富旋律表现", null, "明", 37]] },
  { name: "放大", type: "音乐概念", unit: 4, page: 37, facts: [["作用", "放宽节奏，推动音乐发展并丰富旋律表现", null, "明", 37]] },
  { name: "堆谐", type: "音乐体裁", unit: 4, page: 39, facts: [["特点", "藏族代表性民间舞蹈之一，突出脚的踢踏动作", null, "明", 39]] },
  { name: "锅庄", type: "音乐体裁", unit: 4, page: 40, facts: [["特点", "西藏等地流行的围圈舞，象征团结和圆满", null, "明", 40]] },
];
const WORK_KNOWLEDGE = {
  3: {
    "乌孜哈勒木卡姆第一达斯坦间奏曲": [["音乐体裁", "民间乐曲", "音乐体裁", "明", 31], ["来源体裁", "木卡姆", "音乐体裁", "明", 31]],
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
  units: [{ no, name, page, ...knowledgeForUnit("pep-g3s2", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g3s2", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = withPrintedScores("pep-g3s2", baseParts.map((part) => {
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
