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
  "ins-guzheng": "古筝",
  "ins-pipa": "琵琶",
  "ins-dizi": "笛子",
  "ins-suona": "唢呐",
  "ins-matouqin": "马头琴",
  "ins-guqin": "古琴",
  "ins-bianzhong": "编钟",
  "ins-sheng": "笙",
  "ins-piano": "钢琴",
  "ins-violin": "小提琴",
  "ins-cello": "大提琴",
  "ins-flute": "长笛",
  "ins-trumpet": "小号",
  "ins-clarinet": "单簧管",
  "ins-guitar": "吉他",
  "ins-melodica": "口风琴",
  "ins-recorder": "竖笛",
  "ins-percussion": "课堂打击乐",
  "ins-guoyue": "民族器乐",
  "ins-orchestra": "管弦乐队",
  "opera-jingju": "京剧",
  "opera-stage": "戏曲戏台",
  solemn: "庄重 · 长城朝霞",
  "nature-spring": "春天 · 新柳桃花",
  "nature-rain": "春雨 · 屋檐荷叶",
  "nature-snow": "雪景 · 雪人小屋",
  "nature-night": "月夜 · 湖上小船",
  "nature-autumn": "秋收 · 稻田果园",
  "animals-farm": "农家小院 · 鸭鹅牛羊",
  "animals-wild": "动物乐园",
  birds: "鸟 · 柳枝燕雁",
  insects: "花间 · 蜂蝶蜻蜓",
  "kids-games": "课间游戏",
  school: "校园",
  "family-home": "家",
  labor: "劳动",
  newyear: "过新年",
  hometown: "故乡",
  "red-history": "革命年代 · 宝塔山",
  "new-era": "新时代 · 大桥高铁",
  "march-band": "鼓号队",
  "poem-ancient": "古诗词 · 柳岸小亭",
  "western-dance": "欧洲舞会",
  "folk-coast": "东南海岸",
  "folk-korea": "朝鲜族 · 长鼓秋千",
  fairytale: "童话森林",
  "myth-monkey": "花果山水帘洞",
  train: "小火车",
  "boat-lake": "湖上划船",
  "clock-time": "时钟",
  "quyi-teahouse": "曲艺茶馆",
  "dream-future": "梦想 · 风筝朝阳",
  together: "团结友爱 · 篝火",
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
// 单件乐器的画：只有这一课的主奏乐器就是它（独奏、协奏曲、齐奏）时才用；几件乐器一起的仍配合奏的画。
const SOLO: Array<[RegExp, SkinKey]> = [
  [/古筝/, "ins-guzheng"], [/琵琶/, "ins-pipa"], [/笛子|竹笛|曲笛|梆笛/, "ins-dizi"], [/唢呐/, "ins-suona"],
  [/马头琴/, "ins-matouqin"], [/古琴/, "ins-guqin"], [/编钟/, "ins-bianzhong"], [/(?<!芦)笙/, "ins-sheng"],
  [/小提琴/, "ins-violin"], [/大提琴/, "ins-cello"], [/长笛/, "ins-flute"], [/小号/, "ins-trumpet"], [/单簧管/, "ins-clarinet"],
  [/吉他/, "ins-guitar"], [/口风琴/, "ins-melodica"], [/竖笛/, "ins-recorder"],
];
const OTHER_INSTRUMENT = /二胡|板胡|京胡|高胡|扬琴|阮|柳琴|三弦|箫|葫芦丝|巴乌|埙|钢琴(?!伴奏)|双簧管|圆号|竖琴|手风琴|中提琴|低音提琴|长号|大管|萨克斯/;
const ENSEMBLE = /合奏|重奏|乐队|丝竹|吹打|吹歌|管弦乐(?!协奏)|交响(?!协奏)/;
const FOLK_PERCUSSION = /鸭子拌嘴|老虎磨牙|四物乐|锣鼓|鼓乐/;
const NATIONS: Array<[RegExp, SkinKey]> = [
  [/蒙古族|内蒙古/, "folk-grassland"],
  [/藏族|西藏/, "folk-plateau"],
  [/维吾尔|哈萨克|塔吉克|柯尔克孜|塔塔尔|乌孜别克|新疆/, "folk-xinjiang"],
  [/土家族|彝族|苗族|侗族|瑶族|哈尼族|景颇族|傣族|壮族|布依族|白族|纳西族|云南|贵州|广西/, "folk-southwest"],
  [/朝鲜族|延边/, "folk-korea"],
];

// 题材图：上面几类（戏曲、庄重、乐器、民族）都配不上的课，按作品名和体裁里写到的东西挑一张——
// 写雨的配春雨，写鸭子的配农家小院，圆舞曲配舞会。按顺序找，先到先得，所以更具体的放在前面。
const THEMES: Array<[RegExp, SkinKey | null]> = [
  // 名字里带了题材词、但画面对不上的：婚礼、土耳其进行曲不是鼓号队，马刀舞不是农家的马。
  [/婚礼进行曲|土耳其进行曲|马刀舞/, null],
  [/水帘洞|大闹天宫|敢问路在何方|美猴王|孙悟空|花果山/, "myth-monkey"],
  [/大碗茶|丑末寅初|京调|京韵|单弦|大鼓|相声|评书|快板|曲艺|弹词|数来宝/, "quyi-teahouse"],
  [/念奴娇|沁园春|蝶恋花|忆秦娥|水调歌头|满江红|清平乐|如梦令|卜算子|西江月|浪淘沙|菩萨蛮|渔家傲|虞美人|鹧鸪天|长相思|采桑子|忆江南|渔歌子|江城子|临江仙|破阵子|七律|七绝|五律|阳关|送别|但愿人长久|杏花天影|《苔》|枉凝眉|春江花月夜|古诗|诗词/, "poem-ancient"],
  [/阿里郎|桔梗|道拉吉|长鼓/, "folk-korea"],
  [/阿里山|丢丢铜|半屏山|螺号|澎湖|台湾|赶海|采贝|贝壳|踏浪|三沙|天涯海角|渔翁|渔家|渔歌|渔舟|渔光|海边|大海|海港|海鸥|浪花|鼓浪屿/, "folk-coast"],
  [/草原|牧场|牧歌|蒙古包|敖包|马头琴/, "folk-grassland"],
  [/雪域|高原|布达拉|格桑|雪莲|青藏|珠穆朗玛|天路|洗衣歌/, "folk-plateau"],
  [/天山|葡萄架|吐鲁番|达坂城|新疆/, "folk-xinjiang"],
  [/孔雀|竹楼|凤尾竹|芦笙|苗岭|阿佤|傣家|彝家|侗家|瑶家/, "folk-southwest"],
  [/延安|太行|二小|放牛郎|映山红|红军|长征|八路|游击|雪山草地|井冈山|南湖|抗日|卢沟|只怕不抵抗|大刀|红星|东方红|雨花石|(?<!雪)绒花|养好伤|军民|英雄|革命|解放区|地道战|闪闪|绣金匾|毛主席|毛泽东|毛委员|南泥湾|赤水|儿童团|工农|会师|就义|红色娘子军|嘉陵江上|松花江上|敌人后方|救国/, "red-history"],
  [/复兴|追梦|航天|新时代|高铁|中国梦|太空|火箭|飞船|宇航|不忘初心|一带一路|强国|大湾区|小康|共和国|相约北京|北京见/, "new-era"],
  [/新年|过年|拜年|春节|龙咚锵|元宵|花灯|汤圆|行花街|灯笼|窗花|恭喜|《喜洋洋|年画|鞭炮|社火|秧歌/, "newyear"],
  [/开火车|跳绳|皮球|捉迷藏|拉勾|像我这样做|丢手绢|老鹰捉小鸡|游戏|拍手|找朋友|踢毽|藏猫猫|躲猫猫|竹马|跳房子|木头人|郊游|春游/, "kids-games"],
  [/十分钟/, "school"],
  [/(?<!编)钟(?!山)|时间|小马车|日晷|滴答/, "clock-time"],
  [/火车|列车|铁路/, "train"],
  [/小小的船|小白船/, "nature-night"],
  [/双桨|划船|莲船|采莲|龙舟|赛龙|小船|摇船|船歌|摇橹|荡起|小舟|游湖|西湖/, "boat-lake"],
  [/学校|校园|老师|上学|放学|十分钟|毕业歌|教室|同学|书包|音乐小屋|读书|课间|小学生/, "school"],
  [/故乡|家乡|乡愁|故土|老家|小路|乡村|山村|村庄|炊烟|乡音|乡情/, "hometown"],
  [/妈妈|母亲|爸爸|父亲|外婆|奶奶|爷爷|姥姥|摇篮|宝宝|摇啊摇|睡吧|小宝贝|我的家|可爱的家|温暖的家|《家》|家庭|全家/, "family-home"],
  [/劳动|粉刷|理发|铁匠|打铁|手绢|扫地|插秧|木匠|工人|勤劳|编花篮|采蘑菇|采茶|洗衣|晾衣|棉花|绣|卖报|背篓|扁担/, "labor"],
  [/小红帽|狐狸|乌鸦|洋娃娃|小熊(?!猫)|美人鱼|金鱼的故事|皇帝的新装|童话|白雪公主|小矮人|糖果|胡桃|魔法|灰姑娘|精灵|巫|玩具|木偶(?!兵)|仙女|卖火柴|丑小鸭|拇指/, "fairytale"],
  [/斗牛|西班牙|天鹅湖|四小天鹅/, "western-dance"],
  [/熊猫/, "animals-wild"],
  [/布谷/, "nature-spring"],
  [/雪(?!莲)|冬|北风吹|滑冰|溜冰|冰雪|雪橇/, "nature-snow"],
  [/(?<!花)雨(?!花)|雷(?!锋)|彩虹/, "nature-rain"],
  [/蜜蜂|蝴蝶|蜻蜓|(?<!恋)蝶|萤火虫|螳螂|野蜂|蝈蝈|蟋蟀|知了|蚂蚁|蜗牛|虫/, "insects"],
  [/(?<![一二三四五六七八九十正腊岁])月|星(?![期球])|夜|晚(?!会)|萤火|黄昏/, "nature-night"],
  [/(?<![伦青])春|三月|柳|竹子|竹笋|桃花|杏花|小树|发芽|种子|嫩芽|花开|百花|小草|蒲公英|植树/, "nature-spring"],
  [/秋|丰收|苹果|稻|麦|收割|田野|金桔|果园|柿子|枫/, "nature-autumn"],
  [/燕|雁|鸟|天鹅|杜鹃|云雀|喜鹊|鹰|鹦鹉|麻雀|百灵|鸽|黄鹂|画眉|啄木|斑鸠|花雀|学飞/, "birds"],
  [/鸭|(?<!天)鹅|(?<![斗牵])牛(?!仔)|羊|鸡|猪|狗|猫|兔|(?<![小司])马(?![车刀])|驴|老鼠|鱼|青蛙|蛤蟆|螃蟹|乌龟|农场|农夫/, "animals-farm"],
  [/大象|小象|象群|鹿|熊|猴|狮|老虎|豹|长颈鹿|袋鼠|骆驼|松鼠|动物|狼|狮王|土拨鼠/, "animals-wild"],
  [/(?<!婚礼|土耳其)进行曲|鼓号|小骑兵|军队|强军|号手|行进|士兵|木偶兵|小兵|列兵|打靶|连队/, "march-band"],
  [/圆舞曲|华尔兹|小步舞|波尔卡|探戈|芭蕾|天鹅|舞会|弗拉门戈|塔兰泰拉|玛祖卡|加沃特|霍拉|阿妮特拉|那不勒斯|匈牙利舞曲/, "western-dance"],
  [/梦|未来|(?<!青)少年|童年|长大|理想|希望|阳光|风筝|种太阳|七色光|成长|飞翔|翅膀/, "dream-future"],
  [/朋友|友谊|友爱|团结|同唱|手拉手|爱的奉献|感恩|一家亲|心连心|一个都不能少|大家|幸福|欢乐颂|同一首歌|和平|地球|我和你|充满爱|歌声与微笑|会更好/, "together"],
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

  const played = values(/^(演奏形式|表演形式|演奏乐器|主奏乐器|主要乐器)$/);
  // 各版本写法不同：有的把「古琴曲」「小提琴独奏曲」写在体裁里，有的把课堂乐器写在学习方式里（「快乐的口风琴」「打击乐表现」）。
  const soloist = `${played} ${values(/^(音乐体裁|体裁)$/)}`;
  const classroom = `${played} ${values(/^学习方式$/)}`;
  const instrument = (): SkinKey | null => {
    if (/二胡/.test(played)) return "ins-erhu";
    // 画上是三角铁、铃鼓这些课堂打击乐器；民间锣鼓乐不配这张。
    if (/打击乐/.test(classroom) && !/民族|民间|锣鼓|戏曲|马林巴/.test(classroom) && !FOLK_PERCUSSION.test(workName)) return "ins-percussion";
    const solo = SOLO.filter(([pattern]) => pattern.test(`${soloist} ${classroom}`));
    if (solo.length === 1 && !OTHER_INSTRUMENT.test(soloist) && !ENSEMBLE.test(soloist)) return solo[0][1];
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
  // 边唱边吹的课（学习方式里同时写了演唱和口风琴或竖笛）：配课堂上手里的那件乐器。
  const wind = (): SkinKey | null => {
    const melodica = /口风琴/.test(classroom);
    const recorder = /竖笛/.test(classroom);
    return melodica === recorder ? null : melodica ? "ins-melodica" : "ins-recorder";
  };
  // 题材：只看作品名（去掉「（片段）」「（合唱）」这类括注）和体裁。
  const theme = (): SkinKey | null => {
    const text = `${workName.replace(/（[^（）]*）/g, "")} ${values(/^(体裁|音乐体裁|歌曲类型)$/)}`;
    return THEMES.find(([pattern]) => pattern.test(text))?.[1] ?? null;
  };
  if (kind === "sing") return wind() ?? folk() ?? theme();
  // 器乐、欣赏课：独奏乐器、民族器乐仍配乐器；只认出「管弦乐」的，先看民族和题材（《春节序曲》配过新年、《在钟表店里》配时钟）。
  const ins = instrument();
  if (ins && ins !== "ins-orchestra") return ins;
  return folk() ?? theme() ?? ins;
}
