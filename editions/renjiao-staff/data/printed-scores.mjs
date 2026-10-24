// 人教版新教材的目录只列学习项目和栏目，歌曲、乐曲印在正文里。这里按册逐页核对 PDF，
// 记下正文里印了谱的作品：[作品名, 类型, [印刷页码…]]。作品按谱所在页归入单元，每页裁一张谱例图；
// 页码写成 [页码, 上沿, 下沿] 时只裁这一段（按页高比例），让谱例从作品标题开始。
// 只提到名字、没有印谱的曲名不在这里。
export const PRINTED_SCORES = {
  "pep-g7s2": [
    ["游击队歌", "歌曲", [6, 7]],
    ["回声", "歌曲", [[16, 0.312], 17, 18, 19]],
    ["大浪淘沙", "器乐曲", [[22, 0.371]]],
    ["四合如意", "器乐曲", [[24, 0.129]]],
    ["四首海的间奏曲之四", "器乐曲", [[26, 0.301]]],
    ["大海", "器乐曲", [27]],
    ["红色娘子军", "舞蹈音乐", [[28, 0.143]]],
    ["喜洋洋", "器乐曲", [[29, 0.19, 0.43]]],
    ["小白菜", "民歌", [[29, 0.43, 0.72]]],
    ["扬鞭催马运粮忙", "器乐曲", [[34, 0.286]]],
    ["一个美国人在巴黎", "器乐曲", [[36, 0.228], 37]],
    ["大漠之夜", "歌曲", [[38, 0.215], 39]],
    ["汉宫秋月", "器乐曲", [[42, 0.393]]],
    ["胡笳十八拍", "器乐曲", [44]],
    ["鹧鸪飞", "器乐曲", [[45, 0.138]]],
    ["春游", "歌曲", [[46, 0.208], 47]],
    ["♭B大调前奏曲与赋格", "器乐曲", [[48, 0.429], 49, 50, 51]],
    ["牧歌", "民歌", [52, 53]],
    ["e小调第五交响曲", "交响作品", [[54, 0.158], 55]],
    ["c小调第二钢琴协奏曲", "器乐曲", [[58, 0.375], 59]],
    ["♭b小调第一钢琴协奏曲", "器乐曲", [60]],
    ["黄河", "器乐曲", [61]],
    ["月儿高", "器乐曲", [[63, 0.207, 0.62]]],
    ["百鸟朝凤", "器乐曲", [63]],
    ["大鱼", "歌曲", [[70, 0.202], 71]],
    ["♭e小调前奏曲与赋格", "器乐曲", [[74, 0.129]]],
    ["哥德堡变奏曲", "器乐曲", [75]],
    ["前奏曲", "器乐曲", [[76, 0.17], 77]],
    ["老六板", "器乐曲", [81]],
    ["中国人民解放军军歌", "歌曲", [84, 85]],
    ["保卫黄河", "歌曲", [86, 87]],
  ],
};

const bare = (title) => String(title).replace(/^《|》$/g, "").replace(/[\s，,。.!！？?；;：:]/g, "");
const PAGE_BOX = [0.04, 0.035, 0.96, 0.94];
const pageOf = (item) => (Array.isArray(item) ? item[0] : item);

/** Puts every printed score into the unit its pages fall in: an existing work moves there and gets the page crops; a missing one is added. */
export function withPrintedScores(bookKey, parts) {
  const printed = PRINTED_SCORES[bookKey];
  if (!printed) return parts;
  const starts = parts.map((part) => part.units[0]).sort((a, b) => a.page - b.page);
  const unitOf = (page) => [...starts].reverse().find((unit) => unit.page <= page)?.no ?? starts[0].no;
  const byNo = new Map(parts.map((part) => [part.units[0].no, { ...part, works: [...part.works] }]));
  for (const [name, type, pages] of printed) {
    const no = unitOf(pageOf(pages[0]));
    let existing;
    for (const part of byNo.values()) {
      const index = part.works.findIndex((work) => bare(work.name) === bare(name));
      if (index >= 0) [existing] = part.works.splice(index, 1);
    }
    const scores = existing?.scores?.length ? existing.scores : pages.map((item) => (Array.isArray(item) ? [item[0], PAGE_BOX[0], item[1], PAGE_BOX[2], item[2] ?? PAGE_BOX[3]] : [item, ...PAGE_BOX]));
    byNo.get(no).works.push(existing
      ? { ...existing, unit: no, page: existing.page ?? pageOf(pages[0]), scores }
      : { name, type, unit: no, page: pageOf(pages[0]), facts: [], scores });
  }
  return [...byNo.values()];
}
