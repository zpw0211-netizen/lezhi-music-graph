// 上课模式的主题图：版面和内容不变，只把右侧的通用插画换成和这一课相配的画——
// 蒙古族民歌配草原，京剧配戏台，二胡曲配二胡。图在 public/art/skin/<key>.webp，各版本共用。
// 用哪一张由本课的教材数据决定（所属民族、剧种、演奏形式、体裁）；数据里看不出来的课不换，仍用通用插画。
import type { LessonFact, LessonKind } from "./reflective";

export const SKIN_NAMES = {
  "folk-han": "民歌 · 田野小河",
  "folk-grassland": "民歌 · 草原",
  "folk-plateau": "民歌 · 雪域高原",
  "folk-xinjiang": "民歌 · 天山葡萄架",
  "folk-southwest": "民歌 · 西南山寨",
  "folk-world": "外国民歌 · 海港小镇",
  "ins-erhu": "二胡",
  "ins-piano": "钢琴",
  "ins-guoyue": "民族器乐",
  "ins-orchestra": "管弦乐队",
  "opera-jingju": "京剧",
  "opera-stage": "戏曲戏台",
  solemn: "庄重 · 长城朝霞",
} as const;
export type SkinKey = keyof typeof SKIN_NAMES;
export const isSkinKey = (value: unknown): value is SkinKey => typeof value === "string" && value in SKIN_NAMES;

/** 换成主题图的页面：导入、预习或走近作品、小结。其余页面（小组分工、作业等）的插画讲的是课堂活动，不换。 */
export const SKIN_SLOTS = new Set(["stage-motivate", "wonder-wall", "stage-summary"]);

const FOLK = /民歌|山歌|小调|号子|花儿|信天游|长调|短调|民谣|飞歌|大歌/;
const OPERA = /戏歌|昆曲|黄梅戏|豫剧|评剧|越剧|川剧|秦腔|粤剧|戏曲|梆子/;
const SOLEMN = /国歌|国旗|祖国|中华|中国|红旗|长城|黄河|共产党|少年先锋队|队歌|解放军/;
const GUOYUE = /板胡|京胡|高胡|马头琴|古筝|古琴|琵琶|扬琴|阮|柳琴|三弦|冬不拉|热瓦普|笛子|竹笛|(?<!排)箫|唢呐|笙|葫芦丝|巴乌|埙|编钟|编磬|管子|民乐|民族管弦乐|弹拨乐|丝竹|吹打|吹歌|锣鼓|鼓乐|广东音乐/;
const ORCHESTRA = /管弦乐|交响|协奏曲|序曲|四重奏|室内乐|管乐合奏|小提琴|大提琴|长笛|单簧管|双簧管|小号|圆号|竖琴/;
const NATIONS: Array<[RegExp, SkinKey]> = [
  [/蒙古族|内蒙古/, "folk-grassland"],
  [/藏族|西藏/, "folk-plateau"],
  [/维吾尔|哈萨克|塔吉克|柯尔克孜|塔塔尔|乌孜别克|新疆/, "folk-xinjiang"],
  [/土家族|彝族|苗族|侗族|瑶族|哈尼族|景颇族|傣族|壮族|布依族|白族|纳西族|云南|贵州|广西/, "folk-southwest"],
];

/** 按本课数据选主题图；选不出来返回 null。 */
export function skinOf(input: { workName: string; workType: string; kind: LessonKind; facts: LessonFact[] }): SkinKey | null {
  const { workName, workType, kind, facts } = input;
  const values = (pattern: RegExp) => facts.filter((fact) => pattern.test(fact.label)).map((fact) => fact.value).join("、");
  const opera = `${values(/^(剧种|板式|行当|剧目类型)$/)} ${values(/体裁/)} ${workType}`;
  if (/京剧/.test(opera) || /京剧/.test(workName)) return "opera-jingju";
  if (OPERA.test(opera)) return "opera-stage";

  const genre = `${values(/体裁|民歌类别|歌曲类型/)} ${workType}`;
  // 括号里的「（中国民歌）」不算。
  if (SOLEMN.test(workName.replace(/（[^（）]*）/g, "")) || /颂歌|革命历史歌曲/.test(genre)) return "solemn";

  const played = values(/^(演奏形式|表演形式|演奏乐器|主奏乐器)$/);
  const instrument = (): SkinKey | null => {
    if (/二胡/.test(played)) return "ins-erhu";
    if (GUOYUE.test(played) || GUOYUE.test(genre)) return "ins-guoyue";
    if (/钢琴(独奏|协奏曲)/.test(played) || /^钢琴$/.test(values(/^(演奏乐器|主奏乐器)$/))) return "ins-piano";
    if (ORCHESTRA.test(played) || ORCHESTRA.test(genre)) return "ins-orchestra";
    return null;
  };
  const folk = (): SkinKey | null => {
    const place = `${values(/^(所属民族|所属地区|流传地区)$/)} ${workName} ${genre}`;
    const nation = NATIONS.find(([pattern]) => pattern.test(place));
    if (nation) return nation[1];
    if (!FOLK.test(`${workName} ${genre}`)) return null;
    // 外国民歌：数据里写了国家或外国地区，或作品名里的「（德国民歌）」。
    const country = values(/^(所属国家|作曲家国籍|作者国籍)$/);
    const region = values(/^(所属地区|流传地区)$/);
    const named = workName.match(/（([^（）]{2,8})(民歌|民谣)）/)?.[1] ?? "";
    const abroad = /国|苏格兰|爱尔兰|俄罗斯|乌克兰|波兰|捷克|印度|日本|非|加纳|几内亚|拉丁/;
    if ((country && !/中国/.test(country)) || abroad.test(named.replace("中国", "")) || abroad.test(region)) return "folk-world";
    // 朝鲜族等没有对应画面的民族不套汉族的田野。
    const minority = `${values(/^所属民族$/)} ${named.endsWith("族") ? named : ""}`.trim();
    if (minority && !/汉族/.test(minority)) return null;
    // “民歌”这个类型里也有没写国别的外国歌：有国内的出处（民族、地区、山歌号子一类的体裁）才配田野。
    const local = /汉族/.test(minority) || Boolean(region) || Boolean(named) || /山歌|小调|号子|花儿|信天游/.test(`${workName} ${values(/体裁|民歌类别/)}`);
    return local ? "folk-han" : null;
  };
  // 歌唱课先看民歌，器乐、欣赏课先看乐器（蒙古族的马头琴曲配民族器乐，蒙古族民歌配草原）。
  return kind === "sing" ? folk() : instrument() ?? folk();
}
