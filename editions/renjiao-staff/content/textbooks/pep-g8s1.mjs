import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》八年级上册（五线谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g8s1",
  title: "人教版八年级上册",
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
  [1, "第一单元 旋律的奥秘", 2, [
    ["学习项目","揭开旋律表现的奥秘",2,"学习项目"],
    ["学习项目","在太行山上",2,"音乐作品"],
    ["学习项目","探索旋律结构的规律",8,"学习项目"],
    ["学习项目","桑塔·露琪亚",9,"音乐作品"],
    ["学习项目","小小的船",13,"音乐作品"],
    ["学习项目","春江花月夜",14,"音乐作品"],
    ["学习项目","让旋律“不一般”",18,"学习项目"],
    ["学习项目","国际歌",19,"音乐作品"],
  ]],
  [2, "第二单元 和声的力量", 26, [
    ["学习项目","原位和弦的构成与变体",26,"学习项目"],
    ["学习项目","旋律中的分解和弦",30,"学习项目"],
    ["学习项目","那就是我",33,"音乐作品"],
    ["学习项目","为班级小乐队编配合奏曲",34,"学习项目"],
    ["学习项目","西风的话",34,"音乐作品"],
  ]],
  [3, "第三单元 复调的智慧", 38, [
    ["学习项目","多样的复调",38,"学习项目"],
    ["学习项目","保卫黄河",38,"音乐作品"],
    ["学习项目","牧童短笛",38,"音乐作品"],
    ["学习项目","回文诗与赋格曲",41,"学习项目"],
    ["学习项目","编织有趣的复调",44,"学习项目"],
  ]],
  [4, "第四单元 配器的色彩", 46, [
    ["学习项目","色彩丰富的声音世界",46,"学习项目"],
    ["学习项目","乐器音色分类",48,"学习项目"],
    ["学习项目","配器——声音调色板上的艺术",52,"学习项目"],
    ["学习项目","思乡曲",53,"音乐作品"],
    ["学习项目","音乐调色师训练营",57,"学习项目"],
  ]],
  [5, "印在心里的歌", 62, [
    ["印在心里的歌","没有共产党就没有新中国",62,"歌曲"],
    ["印在心里的歌","我的祖国",63,"歌曲"],
  ]],
];

const SCORE_PAGES = {"在太行山上":[[2,0.04,0.035,0.96,0.94]],"桑塔·露琪亚":[[9,0.04,0.035,0.96,0.94]],"小小的船":[[13,0.04,0.035,0.96,0.94]],"春江花月夜":[[14,0.04,0.035,0.96,0.94]],"国际歌":[[19,0.04,0.035,0.96,0.94]],"那就是我":[[33,0.04,0.035,0.96,0.94]],"西风的话":[[34,0.04,0.035,0.96,0.94]],"保卫黄河":[[38,0.04,0.035,0.96,0.94]],"牧童短笛":[[38,0.04,0.035,0.96,0.94]],"思乡曲":[[53,0.04,0.035,0.96,0.94]],"没有共产党就没有新中国":[[62,0.04,0.035,0.96,0.94]],"我的祖国":[[63,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g8s1");
const TEXTBOOK_CONCEPTS = [
  { name: "骨干音", type: "音乐概念", unit: 1, page: 9, facts: [["定义为", "在旋律中印象突出并发挥重要结构作用的音", null, "明", 9]] },
  { name: "主音", type: "音乐概念", unit: 1, page: 9, facts: [["特点", "全曲最重要的骨干音，通常也是结束音", null, "明", 9]] },
  { name: "填充音", type: "音乐概念", unit: 1, page: 9, facts: [["含义", "旋律中经过时一带而过的音", null, "明", 9]] },
  { name: "起承转合", type: "音乐概念", unit: 1, page: 12, facts: [["特点", "可用四个前后关联、逐步展开的乐句构成完整乐段", null, "明", 12]] },
  { name: "同头换尾", type: "音乐概念", unit: 1, page: 13, facts: [["特点", "两个乐句的开头相同、结尾不同，也称同头异尾", null, "明", 13]] },
  { name: "换头合尾", type: "音乐概念", unit: 1, page: 13, facts: [["特点", "两个乐句的开头不同、结尾相同，也称异头同尾", null, "明", 13]] },
  { name: "鱼咬尾", type: "音乐概念", unit: 1, page: 13, facts: [["特点", "前一个乐句的末音和后一个乐句的起音相同", null, "明", 13]] },
  { name: "高潮", type: "音乐概念", unit: 1, page: 15, facts: [
    ["特点", "四句体中常出现在第三乐句约四分之三处", null, "明", 15],
    ["特点", "可通过旋律连续上行、新材料出现或节奏与调式对比形成", null, "明", 16],
  ] },
  { name: "小二度", type: "音乐概念", unit: 1, page: 19, facts: [["特点", "紧张感强，可用于表现悲伤或紧张情绪", null, "明", 19]] },
  { name: "增四度", type: "音乐概念", unit: 1, page: 19, facts: [["特点", "能产生不稳定和动荡的听觉感受", null, "明", 19]] },
  { name: "减五度", type: "音乐概念", unit: 1, page: 19, facts: [["特点", "能产生不稳定和动荡的听觉感受", null, "明", 19]] },
  { name: "和弦", type: "音乐概念", unit: 2, page: 27, facts: [
    ["包含", "三和弦", "音乐概念", "明", 27],
    ["包含", "七和弦", "音乐概念", "明", 27],
  ] },
  { name: "柱式和弦", type: "音乐概念", unit: 2, page: 28, facts: [["定义为", "各和弦音同时发声的和弦形式", null, "明", 28]] },
  { name: "分解和弦", type: "音乐概念", unit: 2, page: 28, facts: [["定义为", "各和弦音先后发声的和弦形式", null, "明", 28]] },
  { name: "和弦音的重复", type: "音乐概念", unit: 2, page: 28, facts: [["作用", "重复和弦中的音，可使和声音响更丰满", null, "明", 28]] },
  { name: "开放排列", type: "音乐概念", unit: 2, page: 29, facts: [["作用", "低音区用开放排列可使和声音响更清晰", null, "明", 29]] },
  { name: "和弦标记", type: "音乐概念", unit: 2, page: 29, facts: [["记法", "标出根音音名和和弦性质，转位时另外标出低音", null, "明", 29]] },
  { name: "和弦外音", type: "音乐概念", unit: 2, page: 30, facts: [
    ["定义为", "不属于当前和弦结构的音", null, "明", 30],
    ["包含", "经过音", "音乐概念", "明", 30],
    ["包含", "辅助音", "音乐概念", "明", 30],
    ["包含", "延留音", "音乐概念", "明", 30],
    ["包含", "倚音", "音乐概念", "明", 30],
    ["包含", "先现音", "音乐概念", "明", 30],
  ] },
  { name: "经过音", type: "音乐概念", unit: 2, page: 30, facts: [["定义为", "在较弱位置级进填充两个和弦音之间距离的音", null, "明", 30]] },
  { name: "辅助音", type: "音乐概念", unit: 2, page: 30, facts: [["定义为", "在较弱位置插入两个相同和弦音间的上方或下方二度音", null, "明", 30]] },
  { name: "延留音", type: "音乐概念", unit: 2, page: 30, facts: [["定义为", "把前一和弦音延长到较强位置，再向下级进到后一和弦音", null, "明", 30]] },
  { name: "倚音", type: "音乐概念", unit: 2, page: 31, facts: [["定义为", "无准备出现在强位置，并以级进解决的和弦外音", null, "明", 31]] },
  { name: "先现音", type: "音乐概念", unit: 2, page: 31, facts: [["定义为", "后一和弦的音提前出现在前一和弦的较弱位置", null, "明", 31]] },
  { name: "音级", type: "音乐概念", unit: 2, page: 32, facts: [["记法", "用罗马数字Ⅰ至Ⅶ表示大、小调式各级音", null, "明", 32]] },
  { name: "主调音乐", type: "音乐概念", unit: 3, page: 38, facts: [["定义为", "以一条旋律为主，其他声部作和声衬托", null, "明", 38]] },
  { name: "复调音乐", type: "音乐概念", unit: 3, page: 38, facts: [
    ["定义为", "多条独立旋律交织和对话所形成的音乐形态", null, "明", 38],
    ["包含", "模仿复调", "音乐概念", "明", 38],
    ["包含", "对比复调", "音乐概念", "明", 38],
    ["包含", "支声复调", "音乐概念", "明", 38],
  ] },
  { name: "模仿复调", type: "音乐概念", unit: 3, page: 39, facts: [["定义为", "同一或相似的旋律先后出现在不同声部，并组成复调", null, "明", 39]] },
  { name: "对比复调", type: "音乐概念", unit: 3, page: 39, facts: [["定义为", "由两条或更多相对独立的旋律结合而成的复调", null, "明", 39]] },
  { name: "支声复调", type: "音乐概念", unit: 3, page: 39, facts: [["定义为", "从一条旋律变奏、分支而形成的复调", null, "明", 39]] },
  { name: "配器", type: "音乐概念", unit: 4, page: 48, facts: [["定义为", "组合乐器音色的艺术", null, "明", 48]] },
  { name: "音色", type: "音乐概念", unit: 4, page: 49, facts: [["特点", "其表现性可从绵延性、紧张度、光亮度三个维度考察", null, "明", 49]] },
  { name: "音域", type: "音乐概念", unit: 4, page: 49, facts: [["含义", "人声或乐器的音高范围，影响演奏难度和音色", null, "明", 49]] },
  { name: "音量", type: "音乐概念", unit: 4, page: 49, facts: [["作用", "配器时平衡乐器的音量，可避免某些声音被盖住", null, "明", 49]] },
  { name: "逆行", type: "音乐概念", unit: 3, page: 42, facts: [] },
  { name: "倒影", type: "音乐概念", unit: 3, page: 42, facts: [] },
  { name: "倒影逆行", type: "音乐概念", unit: 3, page: 42, facts: [] },
];
const WORK_KNOWLEDGE = {
  3: {
    "山上茶花朵朵开": [["音乐体裁", "瑶族民歌", "音乐体裁", "明", 39]],
    "卡农歌": [["表演形式", "合唱", "表演形式", "明", 40]],
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
  units: [{ no, name, page, ...knowledgeForUnit("pep-g8s1", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g8s1", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = withPrintedScores("pep-g8s1", baseParts.map((part) => {
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
