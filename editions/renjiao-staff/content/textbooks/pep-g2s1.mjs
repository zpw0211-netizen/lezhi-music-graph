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
const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
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
    concepts: ENRICHMENT.concepts.filter((item) => item.unit === no),
    people: ENRICHMENT.people.filter((item) => item.unit === no),
    tasks: ENRICHMENT.tasks.filter((item) => item.unit === no),
    references: ENRICHMENT.references.filter((item) => item.unit === no),
  };
}));

export default textbook;
