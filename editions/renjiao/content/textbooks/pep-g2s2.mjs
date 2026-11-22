import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》二年级下册（简谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g2s2",
  title: "人教版二年级下册",
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
  [1, "第一单元 美妙的和声", 2, [
    ["音乐万花筒","美丽的黄昏",1,"音乐作品"],
    ["音乐万花筒","合唱的魅力",2,"音乐万花筒"],
    ["音乐万花筒","保卫黄河",3,"音乐作品"],
    ["趣味乐理","音程",4,"趣味乐理"],
    ["小小歌唱家","送别",7,"歌曲"],
  ]],
  [2, "第二单元 高高的兴安岭", 10, [
    ["音乐万花筒","北方森林之声",10,"音乐万花筒"],
    ["小小歌唱家","美丽的家乡",12,"歌曲"],
    ["小小歌唱家","月亮，月亮",13,"歌曲"],
    ["游戏乐翻天","欢迎你来做客",14,"游戏乐翻天"],
    ["小小演奏家","勇敢的鄂伦春",16,"音乐作品"],
  ]],
  [3, "第三单元 水态万千", 18, [
    ["音乐万花筒","水之歌",18,"音乐万花筒"],
    ["小小歌唱家","泉水叮咚响",20,"歌曲"],
    ["创乐工坊","一滴水的旅行",22,"创乐工坊"],
    ["小小演奏家","伏尔塔瓦河（片段）",26,"音乐作品"],
  ]],
  [4, "第四单元 长白山下", 28, [
    ["小小舞蹈家","象帽舞",28,"小小舞蹈家"],
    ["音乐万花筒","白山黑土歌舞汇",30,"音乐万花筒"],
    ["小小歌唱家","新东北风",32,"歌曲"],
    ["小小歌唱家","桔梗谣",33,"歌曲"],
    ["小小演奏家","四物乐",34,"音乐作品"],
  ]],
  [5, "第五单元 辽沈风情", 36, [
    ["游戏乐翻天","辽西民谣变变变",36,"游戏乐翻天"],
    ["音乐万花筒","辽沈风情",38,"音乐万花筒"],
    ["小小歌唱家","正对花",40,"歌曲"],
    ["小小歌唱家","对花",41,"音乐作品"],
    ["创乐工坊","多样的重复",42,"创乐工坊"],
    ["创乐工坊","春江花月夜",43,"音乐作品"],
    ["小小演奏家","杨靖宇大摆口袋阵（前奏）",44,"音乐作品"],
  ]],
  [6, "第六单元 音乐大比拼", 46, [
    ["音乐万花筒","炫技的艺术",46,"音乐万花筒"],
    ["游戏乐翻天","鼓圈",48,"游戏乐翻天"],
    ["趣味乐理","调号",50,"趣味乐理"],
    ["趣味乐理","粉刷匠",50,"音乐作品"],
    ["小小演奏家","吃到葡萄的狐狸",52,"音乐作品"],
    ["小小演奏家","毛毛虫进行曲",52,"音乐作品"],
  ]],
  [7, "第七单元 奥林匹克风", 55, [
    ["小小歌唱家","我和你",55,"歌曲"],
    ["小小歌唱家","雪花",56,"歌曲"],
    ["音乐万花筒","奥林匹克号角",58,"器乐曲"],
    ["音乐万花筒","一起向未来",60,"音乐万花筒"],
    ["游戏乐翻天","校园运动会",62,"游戏乐翻天"],
    ["小小演奏家","歌唱祖国",64,"音乐作品"],
  ]],
  [8, "第八单元 爷爷为我打月饼", 66, [
    ["小小音乐剧","爷爷为我打月饼",66,"小小音乐剧"],
    ["小小音乐剧","中国少年先锋队队歌",73,"音乐作品"],
  ]],
];

const SCORE_PAGES = {"美丽的黄昏":[[1,0.04,0.68,0.96,0.98]],"保卫黄河":[[3,0.04,0.035,0.96,0.94]],"送别":[[7,0.04,0.035,0.96,0.94]],"美丽的家乡":[[12,0.04,0.035,0.96,0.94]],"月亮，月亮":[[13,0.04,0.035,0.96,0.94]],"勇敢的鄂伦春":[[16,0.04,0.035,0.96,0.94]],"泉水叮咚响":[[20,0.04,0.035,0.96,0.94]],"伏尔塔瓦河（片段）":[[26,0.04,0.035,0.96,0.94]],"新东北风":[[32,0.04,0.035,0.96,0.94]],"桔梗谣":[[33,0.04,0.035,0.96,0.94]],"四物乐":[[34,0.04,0.035,0.96,0.94]],"正对花":[[40,0.04,0.035,0.96,0.94]],"对花":[[41,0.04,0.035,0.96,0.94]],"春江花月夜":[[43,0.04,0.035,0.96,0.94]],"杨靖宇大摆口袋阵（前奏）":[[44,0.04,0.035,0.96,0.94]],"粉刷匠":[[50,0.04,0.035,0.96,0.94]],"吃到葡萄的狐狸":[[52,0.04,0.035,0.96,0.94]],"毛毛虫进行曲":[[52,0.04,0.035,0.96,0.94]],"我和你":[[55,0.04,0.035,0.96,0.94]],"雪花":[[56,0.04,0.035,0.96,0.94]],"歌唱祖国":[[64,0.04,0.035,0.96,0.94]],"中国少年先锋队队歌":[[73,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g2s2");
const TEXTBOOK_CONCEPTS = [
  { name: "合唱", type: "表演形式", unit: 1, page: 3, facts: [
    ["定义为", "若干人分声部共同演唱多声部歌曲", null, "明", 3],
    ["包含", "女声合唱", "表演形式", "明", 3],
    ["包含", "男声合唱", "表演形式", "明", 3],
    ["包含", "混声合唱", "表演形式", "明", 3],
    ["包含", "童声合唱", "表演形式", "明", 3],
  ] },
  { name: "无伴奏合唱", type: "表演形式", unit: 1, page: 3, facts: [["定义为", "没有乐器伴奏的合唱", null, "明", 3]] },
  { name: "音程", type: "音乐概念", unit: 1, page: 5, facts: [
    ["定义为", "两音之间的距离，可以用度数表示", null, "明", 5],
    ["包含", "旋律音程", "音乐概念", "明", 5],
    ["包含", "和声音程", "音乐概念", "明", 5],
  ] },
  { name: "旋律音程", type: "音乐概念", unit: 1, page: 5, facts: [["定义为", "两个音先后发声所形成的音程", null, "明", 5]] },
  { name: "和声音程", type: "音乐概念", unit: 1, page: 5, facts: [["定义为", "两个音同时发声所形成的音程", null, "明", 5]] },
  { name: "二人转", type: "音乐体裁", unit: 4, page: 30, facts: [["定义为", "东北走唱类曲艺，在民歌、秧歌基础上吸收莲花落等发展而来", null, "明", 30]] },
  { name: "四物乐", type: "表演形式", unit: 4, page: 31, facts: [["定义为", "朝鲜族传统打击乐合奏，常用长鼓、圆鼓、大锣和小锣", null, "明", 31]] },
  { name: "东北大鼓", type: "音乐体裁", unit: 5, page: 38, facts: [["特点", "东北曲艺，一人击鼓板说唱，唱词多为七字句", null, "明", 38]] },
  { name: "同头换尾", type: "音乐概念", unit: 5, page: 42, facts: [["定义为", "乐句开头相同，末尾不同", null, "明", 42]] },
  { name: "换头合尾", type: "音乐概念", unit: 5, page: 42, facts: [["定义为", "乐句开头不同，末尾相同", null, "明", 42]] },
  { name: "鱼咬尾", type: "音乐概念", unit: 5, page: 43, facts: [["定义为", "前一乐句的最后一个音也是后一乐句的第一个音", null, "明", 43]] },
  { name: "调号", type: "音乐概念", unit: 6, page: 50, facts: [["记法", "写在乐谱左上角，标明简谱1的音高位置", null, "明", 50]] },
  { name: "乐段标记", type: "音乐概念", unit: 7, page: 59, facts: [["记法", "用英文字母或罗马数字标记作品的乐段", null, "明", 59]] },
];
const WORK_KNOWLEDGE = {
  1: {
    "打虎上山": [["来源体裁", "现代京剧", "音乐体裁", "明", 2]],
    "猜调": [["来源体裁", "云南民歌", "音乐体裁", "明", 2]],
  },
  2: {
    "乌苏里船歌": [["来源体裁", "民歌", "音乐体裁", "明", 11]],
    "美丽的家乡": [["来源体裁", "歌剧", "音乐体裁", "明", 12]],
  },
  4: {
    "燕子打令": [["音乐体裁", "民谣", "音乐体裁", "明", 31]],
  },
  5: {
    "杨靖宇大摆口袋阵（前奏）": [["来源体裁", "东北大鼓", "音乐体裁", "明", 44]],
  },
  7: {
    "奥林匹克号角": [["表演形式", "管弦乐合奏", "表演形式", "明", 58]],
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
  units: [{ no, name, page, ...knowledgeForUnit("pep-g2s2", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g2s2", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = withPrintedScores("pep-g2s2", baseParts.map((part) => {
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
