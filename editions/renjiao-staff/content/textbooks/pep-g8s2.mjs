import { factsForItem } from "../../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../../data/unit-knowledge.mjs";
import { pageEnrichmentFor } from "../../data/page-enrichment.mjs";
import { withPrintedScores } from "../../data/printed-scores.mjs";

// 人教版《艺术·唱游·音乐》/《音乐》八年级下册（五线谱）——目录级数据，由 editions/renjiao/scripts/build-sources-from-toc.mjs 生成。
// 来源：教材目录页（PDF 文字层按版面位置读取，并对照目录页图核对）；单元、栏目、标题与页码照目录录入。
// 有旋律录入或谱面裁图的条目记为音乐作品；目录外、旋律文件按页码引用的作品附在所在单元。
// 逐页作品事实集中维护于 editions/renjiao/data/lesson-facts.mjs；未核对的条目不推测。

const textbook = {
  key: "pep-g8s2",
  title: "人教版八年级下册",
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
  [1, "第一单元 结构的美感", 2, [
    ["学习项目","统一、变化与平衡",2,"学习项目"],
    ["学习项目","送别",2,"音乐作品"],
    ["学习项目","大海啊，故乡",5,"音乐作品"],
    ["学习项目","中国传统音乐的多段联缀体结构",10,"学习项目"],
  ]],
  [2, "第二单元 人声的交响", 18, [
    ["学习项目","合唱的力量",18,"学习项目"],
    ["学习项目","保卫黄河",19,"音乐作品"],
    ["学习项目","康塔塔与清唱剧",24,"学习项目"],
  ]],
  [3, "第三单元 乐器的交响", 32, [
    ["学习项目","复杂的音乐表达",32,"学习项目"],
    ["学习项目","用音乐叙事与抒情",36,"学习项目"],
    ["学习项目","交响曲",41,"学习项目"],
    ["学习项目","第五（命运）交响曲",41,"音乐作品"],
    ["学习项目","协奏曲",45,"学习项目"],
    ["学习项目","第一小提琴协奏曲",45,"音乐作品"],
  ]],
  [4, "第四单元 综合舞台艺术", 50, [
    ["学习项目","走进歌剧",50,"学习项目"],
    ["学习项目","天边有颗闪亮的星",57,"音乐作品"],
    ["学习项目","走进舞剧",58,"学习项目"],
    ["学习项目","走进戏曲",64,"学习项目"],
  ]],
  [5, "印在心里的歌", 70, [
    ["印在心里的歌","中国共产主义青年团团歌",70,"歌曲"],
    ["印在心里的歌","唱支山歌给党听",71,"歌曲"],
  ]],
];

const SCORE_PAGES = {"送别":[[2,0.04,0.035,0.96,0.94]],"大海啊，故乡":[[5,0.04,0.035,0.96,0.94]],"保卫黄河":[[19,0.04,0.035,0.96,0.94]],"第一小提琴协奏曲":[[45,0.04,0.035,0.96,0.94]],"天边有颗闪亮的星":[[57,0.04,0.035,0.96,0.94]],"中国共产主义青年团团歌":[[70,0.04,0.035,0.96,0.94]],"唱支山歌给党听":[[71,0.04,0.035,0.96,0.94]]};
const scoresFor = (title) => SCORE_PAGES[title.replace(/^《|》$/g, "").replace(/\s+/g, "")] ?? [];
const ENRICHMENT = pageEnrichmentFor("pep-g8s2");
const TEXTBOOK_CONCEPTS = [
  { name: "曲式结构", type: "音乐概念", unit: 1, page: 1, facts: [["作用", "显示乐曲各部分的关系和全曲布局", null, "明", 1]] },
  { name: "单二部曲式", type: "音乐体裁", unit: 1, page: 3, facts: [["定义为", "由两个有对比性的乐段组成，通常标为AB", null, "明", 3]] },
  { name: "单三部曲式", type: "音乐体裁", unit: 1, page: 3, facts: [["定义为", "由三个乐段组成，可为再现的ABA或并列的ABC", null, "明", 3]] },
  { name: "复三部曲式", type: "音乐体裁", unit: 1, page: 3, facts: [["定义为", "由三个部分组成，至少有一个部分的结构大于乐段", null, "明", 3]] },
  { name: "回旋曲式", type: "音乐体裁", unit: 1, page: 3, facts: [["定义为", "基本主题和若干不同的插部轮流出现", null, "明", 3]] },
  { name: "变奏曲式", type: "音乐体裁", unit: 1, page: 3, facts: [["定义为", "由一个主题及对它的一系列变化重复组成", null, "明", 3]] },
  { name: "奏鸣曲式", type: "音乐体裁", unit: 1, page: 3, facts: [
    ["定义为", "用对比鲜明的主、副部主题发展，通常有呈示、展开、再现三部分", null, "明", 3],
    ["包含", "呈示部", "音乐概念", "明", 3],
    ["包含", "展开部", "音乐概念", "明", 3],
    ["包含", "再现部", "音乐概念", "明", 3],
  ] },
  { name: "康塔塔", type: "音乐体裁", unit: 2, page: 24, facts: [["特点", "源于意大利的多乐章声乐套曲，由管弦乐伴奏，篇幅比清唱剧短", null, "明", 24]] },
  { name: "清唱剧", type: "音乐体裁", unit: 2, page: 25, facts: [["特点", "有连贯剧情的多乐章声乐套曲，以管弦乐伴奏独唱、重唱或合唱", null, "明", 25]] },
  { name: "叙事曲", type: "音乐体裁", unit: 3, page: 33, facts: [["特点", "篇幅较长、颇具戏剧性的钢琴作品体裁，由肖邦确立", null, "明", 33]] },
  { name: "交响诗", type: "音乐体裁", unit: 3, page: 40, facts: [["定义为", "形式自由的单乐章标题性交响乐，可表现思想、意境或文学题材", null, "明", 40]] },
  { name: "交响曲", type: "音乐体裁", unit: 3, page: 43, facts: [["定义为", "由管弦乐队演奏、规模宏大且富有哲理性的大型套曲", null, "明", 43]] },
  { name: "歌剧", type: "音乐体裁", unit: 4, page: 50, facts: [["定义为", "融合多种艺术要素，使文学作品得到舞台表现的综合艺术", null, "明", 50]] },
  { name: "独唱", type: "表演形式", unit: 4, page: 51, facts: [
    ["包含", "咏叹调", "音乐体裁", "明", 51],
    ["包含", "宣叙调", "音乐体裁", "明", 51],
  ] },
  { name: "咏叹调", type: "音乐体裁", unit: 4, page: 51, facts: [["作用", "在歌剧独唱中主要用于抒情，演唱技巧要求高", null, "明", 51]] },
  { name: "宣叙调", type: "音乐体裁", unit: 4, page: 51, facts: [["特点", "歌剧中曲调接近朗诵的一种独唱", null, "明", 51]] },
  { name: "重唱", type: "表演形式", unit: 4, page: 51, facts: [["作用", "通过不同声部交织交代人物关系，增强冲突并推动情节", null, "明", 51]] },
  { name: "合唱", type: "表演形式", unit: 4, page: 51, facts: [["作用", "在歌剧中可烘托气氛、叙述剧情和塑造群体形象", null, "明", 51]] },
  { name: "序曲", type: "音乐体裁", unit: 4, page: 51, facts: [["作用", "在歌剧开头预示主题、剧情和人物性格，也常独立演出", null, "明", 51]] },
  { name: "间奏曲", type: "音乐体裁", unit: 4, page: 53, facts: [["作用", "在歌剧两场之间演奏，配合换场换装，暗示剧情并传达情绪", null, "明", 53]] },
  { name: "秧歌剧", type: "音乐体裁", unit: 4, page: 54, facts: [["定义为", "在延安新秧歌运动中形成，融合民歌、戏曲和话剧等的广场歌舞剧", null, "明", 54]] },
  { name: "多段联缀体", type: "音乐概念", unit: 1, page: 10, facts: [["特点", "把多个相对独立的段落相连，形成完整器乐作品", null, "明", 10]] },
  { name: "协奏曲", type: "音乐体裁", unit: 3, page: 45, facts: [["特点", "由一件或几件独奏乐器同交响乐队相互对答、对比与合作", null, "明", 45]] },
  { name: "舞剧", type: "音乐体裁", unit: 4, page: 58, facts: [["作用", "用肢体语言讲述故事、塑造人物并表现情绪和冲突", null, "明", 58]] },
  { name: "戏曲", type: "音乐体裁", unit: 4, page: 64, facts: [["特点", "以中国文学为基础，用舞台艺术讲述故事", null, "明", 64]] },
];
const WORK_KNOWLEDGE = {
  1: {
    "夕阳箫鼓": [["曲式", "多段联缀体", "音乐概念", "明", 10]],
  },
  2: {
    "咖啡康塔塔": [["音乐体裁", "康塔塔", "音乐体裁", "明", 24]],
    "六军不发无奈何": [["来源体裁", "清唱剧", "音乐体裁", "明", 25]],
    "宛转蛾眉马前死": [["来源体裁", "清唱剧", "音乐体裁", "明", 26]],
    "渔阳鼙鼓动地来": [["来源体裁", "清唱剧", "音乐体裁", "明", 27]],
  },
  3: {
    "十面埋伏": [["曲式", "多段体", "音乐概念", "明", 38]],
    "第一钢琴协奏曲——春之采": [["音乐体裁", "协奏曲", "音乐体裁", "明", 45]],
    "唤凤": [["音乐体裁", "唢呐协奏曲", "音乐体裁", "明", 45]],
    "如是": [["音乐体裁", "古筝协奏曲", "音乐体裁", "明", 46]],
    "d小调第三钢琴协奏曲": [["音乐体裁", "协奏曲", "音乐体裁", "明", 46]],
  },
  4: {
    "飞驰的女武神": [["来源体裁", "歌剧", "音乐体裁", "明", 52]],
    "沉思": [["音乐体裁", "间奏曲", "音乐体裁", "明", 53]],
    "兄妹开荒": [["音乐体裁", "秧歌剧", "音乐体裁", "明", 54]],
    "我正在城楼观山景": [["来源体裁", "京剧", "音乐体裁", "明", 68]],
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
  units: [{ no, name, page, ...knowledgeForUnit("pep-g8s2", no) }],
  works: items.map(([section, title, itemPage, type]) => ({ name: title, type, unit: no, mode: section, page: itemPage, facts: factsForItem("pep-g8s2", title), ...(scoresFor(title).length ? { scores: scoresFor(title) } : {}) })),
}));
export const BASE_SOURCE = { ...textbook, parts: baseParts };

textbook.parts = withPrintedScores("pep-g8s2", baseParts.map((part) => {
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
