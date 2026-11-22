import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》五年级上册（简谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g5s1",
  title: "人教版五年级上册",
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
  [1, "第一单元 岭南之声", 2, [
    ["音乐考古","南越古声",2,"音乐考古"],
    ["音乐考古","岭南琴音",3,"音乐考古"],
    ["音乐万花筒","粤海潮音",4,"音乐万花筒"],
    ["小小歌唱家","月光光",7,"歌曲"],
    ["小小演奏家","赛龙夺锦",8,"音乐作品"],
    ["小小歌唱家","落水天",10,"歌曲"],
  ]],
  [2, "第二单元 舞动非洲与爵士蓝调", 14, [
    ["音乐万花筒","听见非洲",14,"音乐万花筒"],
    ["小小歌唱家","巴加女孩",16,"歌曲"],
    ["综合探索","音乐跨大洋",17,"综合探索"],
    ["小小演奏家","夏日时光",19,"音乐作品"],
    ["创乐工坊","五拍",20,"创乐工坊"],
  ]],
  [3, "第三单元 闽乐回响", 22, [
    ["音乐万花筒","土楼音声",22,"音乐万花筒"],
    ["小小歌唱家","鱼歌",24,"歌曲"],
    ["小小歌唱家","采茶灯",28,"歌曲"],
    ["小小舞蹈家","采茶",30,"小小舞蹈家"],
    ["综合探索","品茗听韵",31,"综合探索"],
    ["音乐万花筒","南音探源",32,"音乐万花筒"],
  ]],
  [4, "第四单元 港澳之声", 34, [
    ["小小歌唱家","东方之珠",34,"歌曲"],
    ["小小歌唱家","七子之歌——澳门",36,"歌曲"],
    ["综合探索","港澳流行歌曲",37,"综合探索"],
    ["小小演奏家","香蕉船",40,"音乐作品"],
  ]],
  [5, "第五单元 祖国的宝岛台湾", 42, [
    ["音乐万花筒","宝岛上的歌声",42,"音乐万花筒"],
    ["音乐万花筒","丢丢铜",43,"音乐作品"],
    ["小小歌唱家","童年",44,"歌曲"],
    ["小小歌唱家","月亮月光光",46,"歌曲"],
    ["小小演奏家","一只鸟仔",47,"音乐作品"],
    ["综合探索","台湾校园歌曲",48,"综合探索"],
    ["创乐工坊","起、承、转、合",50,"创乐工坊"],
  ]],
  [6, "第六单元 听妈妈讲那过去的事情", 52, [
    ["小小音乐剧","听妈妈讲那过去的事情",52,"小小音乐剧"],
  ]],
];

const SCORE_PAGES = {"月光光":[[7,0.04,0.035,0.96,0.94]],"赛龙夺锦":[[8,0.04,0.035,0.96,0.94]],"落水天":[[10,0.04,0.035,0.96,0.94]],"巴加女孩":[[16,0.04,0.035,0.96,0.94]],"夏日时光":[[19,0.04,0.035,0.96,0.94]],"鱼歌":[[24,0.04,0.035,0.96,0.94]],"采茶灯":[[28,0.04,0.035,0.96,0.94]],"东方之珠":[[34,0.04,0.035,0.96,0.94]],"七子之歌——澳门":[[36,0.04,0.035,0.96,0.94]],"香蕉船":[[40,0.04,0.035,0.96,0.94]],"丢丢铜":[[43,0.04,0.035,0.96,0.94]],"童年":[[44,0.04,0.035,0.96,0.94]],"月亮月光光":[[46,0.04,0.035,0.96,0.94]],"一只鸟仔":[[47,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g5s1");
const TEXTBOOK_CONCEPTS = [
  { name: "琴轸", type: "音乐概念", unit: 1, page: 3, facts: [["作用", "转动丝弦以调音的小轴", null, "明", 3]] },
  { name: "轸钥", type: "音乐概念", unit: 1, page: 3, facts: [["作用", "套住琴轸转动以调弦的配件", null, "明", 3]] },
  { name: "广东音乐", type: "音乐体裁", unit: 1, page: 4, facts: [["定义为", "源于广府粤语地区的传统丝竹乐，常用高胡、扬琴等演奏", null, "明", 4]] },
  { name: "广东汉乐", type: "音乐体裁", unit: 1, page: 5, facts: [["特点", "流行于粤东、粤北等地的民间器乐，旧称客家音乐或汉调音乐", null, "明", 5]] },
  { name: "粤剧", type: "音乐体裁", unit: 1, page: 6, facts: [
    ["特点", "流行于粤语方言区的戏曲，基本声腔有梆子与二黄", null, "明", 6],
    ["包含", "梆子腔", "音乐体裁", "明", 6],
    ["包含", "二黄", "音乐体裁", "明", 6],
  ] },
  { name: "爵士乐", type: "音乐体裁", unit: 2, page: 17, facts: [["特点", "兴起于美国新奥尔良，融合西非节奏和欧洲和声等成分", null, "明", 17]] },
  { name: "歌仔戏", type: "音乐体裁", unit: 3, page: 22, facts: [["特点", "流行于福建和台湾的戏曲，常用壳子弦、大广弦和月琴伴奏", null, "明", 22]] },
  { name: "高甲戏", type: "音乐体裁", unit: 3, page: 22, facts: [["特点", "流行于福建南部的戏曲，唱腔多取自南曲和民间小调", null, "明", 22]] },
  { name: "提线木偶戏", type: "音乐体裁", unit: 3, page: 22, facts: [["特点", "泉州传统戏剧，唱腔糅合南音和闽南地方音乐", null, "明", 22]] },
  { name: "福州伬艺", type: "音乐体裁", unit: 3, page: 23, facts: [["特点", "使用福州方言的曲艺，既有叙事说唱，也有多人合唱散曲", null, "明", 23]] },
  { name: "闽剧", type: "音乐体裁", unit: 3, page: 23, facts: [["特点", "主要用福州方言演唱，常结合民间故事编演", null, "明", 23]] },
  { name: "反复记号", type: "音乐概念", unit: 4, page: 35, facts: [] },
  { name: "反复省略记号", type: "音乐概念", unit: 4, page: 35, facts: [] },
  { name: "起承转合", type: "音乐概念", unit: 5, page: 50, facts: [] },
];
const WORK_KNOWLEDGE = {
  3: {
    "采茶歌": [["音乐体裁", "畲族山歌", "音乐体裁", "明", 22]],
    "紫玉钗": [["来源体裁", "福州伬艺", "音乐体裁", "明", 23]],
    "海上渔歌": [["来源体裁", "闽剧", "音乐体裁", "明", 23]],
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
  units: [{ no, name, page, ...knowledgeForUnit("pep-g5s1", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g5s1", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = withPrintedScores("pep-g5s1", baseParts.map((part) => {
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
