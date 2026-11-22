// 核心知识点图：一册书里“知识点—作品”的网。
// 节点只有三种：要素（节拍、节奏、速度…）、知识点（教材里的概念、术语、体裁、演唱演奏形式）、作品。
// 连线来自教材数据（作品的拍号、速度、曲式…指向哪个知识点）、从已转写乐谱里认出的节奏型（标为“谱面”），以及各版本共用的乐理关系表（kmap-relations.ts）。
import { matchesBookScope } from "../app/unit-data";
import type { CanonicalGraph, Entity, Triple } from "../app/types";
import type { Melody, MelodyNote } from "../lesson/jianpu";
import { KMAP_RELATIONS } from "./kmap-relations";

export type KGroup = "meter" | "rhythm" | "tempo" | "dynamics" | "mode" | "melody" | "harmony" | "form" | "genre" | "opera" | "perform" | "sign";
export const GROUPS: Record<KGroup, { name: string; hue: "pine" | "ochre" | "brick" | "ink" | "teal" }> = {
  meter: { name: "节拍", hue: "pine" },
  rhythm: { name: "节奏", hue: "pine" },
  tempo: { name: "速度", hue: "ochre" },
  dynamics: { name: "力度", hue: "ochre" },
  mode: { name: "调式", hue: "teal" },
  melody: { name: "旋律", hue: "teal" },
  harmony: { name: "和声", hue: "teal" },
  form: { name: "曲式", hue: "brick" },
  genre: { name: "体裁", hue: "brick" },
  opera: { name: "戏曲", hue: "brick" },
  perform: { name: "演唱演奏", hue: "ink" },
  sign: { name: "记号", hue: "ink" },
};
export type KDef = { label: string; text: string; page?: number; /** 讲解来自别的分册时，那一册的名字。 */ book?: string };
export type KNode = {
  id: string;
  name: string;
  /** book 只在全套视图里出现：一册书一个点，连着这一册用到的知识点。 */
  kind: "hub" | "point" | "work" | "book";
  group?: KGroup;
  /** 默认显示：教材给了说明，或本册至少两首作品用到，或下面还分出两个以上知识点。 */
  core: boolean;
  /** 教材里的其他写法，如二拍子的 2/4。 */
  aliases: string[];
  defs: KDef[];
  page?: number;
  /** 这个知识点出现过的分册（跨册）。 */
  books: string[];
  /** 连着的作品 id。 */
  works: string[];
};
/** source：text 教材明示；score 从乐谱里认出。 */
export type KEdge = { a: string; b: string; label: string; source: "text" | "score" };
export type KWork = { id: string; /** 图谱实体 id。 */ entity: string; book: string; name: string; type: string; unit?: string; unitOrder: number; page: number; mode?: string };
export type KMap = { nodes: KNode[]; edges: KEdge[]; works: Map<string, KWork>; /** 全套视图：图上不画作品，改画分册。 */ whole?: boolean };

const KTYPES = new Set(["音乐概念", "节奏型", "拍号", "速度术语", "音乐体裁", "表演形式"]);
// 教材里同一个知识点的两种写法：作品写 2/4，知识页讲“二拍子”。
const ALIAS: Record<string, string> = {
  "2/4": "二拍子", "2/2": "二拍子", "四二拍": "二拍子", "四二拍子": "二拍子",
  "3/4": "三拍子", "3/8": "三拍子", "3/2": "三拍子", "四三拍": "三拍子", "八三拍": "三拍子",
  "4/4": "四拍子", "四四拍": "四拍子",
  "6/8": "六拍子", "6/4": "六拍子", "八六拍": "六拍子",
  "1/4": "一拍子",
  "变拍子": "变换拍子", "ABA三部曲式": "三部曲式", "两段体": "二段体",
};
// 一首作品写了几个拍号（“4/4、2/4”）：拆开分别连到各个拍子上。
const METER_LIST = /^\d+\/\d+(?:\s*[、，,]\s*\d+\/\d+)+$/;
// 作品说明里的整句（“A段中板，B段慢板”“第一条2/4，第二条3/4”）不是知识点。
const DESCRIPTION = /[，,；;：:]|均为|均用|分别|^(?:引子|主题|[A-Z]段|[A-Z]主题|第[一二三四五]条|首段|中段|两则|山间)/;
const DESCRIPTION_TYPES = new Set(["速度术语", "拍号", "表演形式"]);
const SYNONYMS = new Map<string, string[]>();
for (const [a, predicate, targets] of KMAP_RELATIONS) {
  if (predicate !== "又称") continue;
  for (const b of Array.isArray(targets) ? targets : [targets]) {
    SYNONYMS.set(a, [...(SYNONYMS.get(a) ?? []), b]);
    SYNONYMS.set(b, [...(SYNONYMS.get(b) ?? []), a]);
  }
}
const DYNAMICS = /^(?:p{1,3}|f{1,3}|mf|mp|sf|sfz|fp)(?:（[^）]*）)?$/;
const DEF_PREDICATES = ["定义为", "含义", "特点", "作用", "记法", "强弱规律", "典型节奏"];
// 只是谱面上的字样或太宽泛的总称，不单独成点。
const SKIP = new Set(["音乐要素", "简谱", "简谱基础知识", "演唱形式", "演奏形式", "音乐体裁", "拍号", "音乐记号", "指挥图示", "二拍子指挥图示", "三拍子指挥图示", "四拍子指挥图示", "音符与唱名", "嗓音保护常识"]);
// 谱面抄录（“1=F，2/4”“mp、mf”“1 2 3 5 6”）不是知识点。
const TRANSCRIPT = /^1=|[♩=]|^[\d i]+(?:（|$)|^[a-z]{1,3}、|[：:]/;

function groupOf(entity: Entity): KGroup | null {
  const name = entity.name;
  if (TRANSCRIPT.test(name)) return null;
  if (/西皮|二黄|板腔|曲牌|锣鼓|文场|武场|行当|念白|身段|脸谱|声腔|唱腔|剧种|亮相|数板|有板无眼|一板三眼|摇板|导板|过门|[生旦净丑]角|四击头|住头|抽头|撤锣|崩登仓|行弦|润腔|板式|一板一眼|无板无眼|唱念做打/.test(name)) return "opera";
  if (entity.type === "拍号" || /拍子|^节拍$|弱起|散板|强弱规律|小节|稳定拍|击拍/.test(name)) return "meter";
  // “连音”单写是唱奏连贯（记号），“三连音”才是节奏。
  if (entity.type === "节奏型" || /节奏|休止符|附点|音符时值|[二三四五六七]连音|切分|分音符|全音符/.test(name)) return "rhythm";
  if (entity.type === "速度术语" || /速度/.test(name)) return "tempo";
  if (DYNAMICS.test(name) || /力度|渐强|渐弱|重音|音的强弱/.test(name)) return "dynamics";
  // 民歌里的“小调”是体裁，不是大小调的小调。
  if (entity.type === "音乐体裁" && /小调$/.test(name)) return "genre";
  if (/调式|音阶|大调|小调|转调|变化音|^主音$|^[全半]音$|终止音|^清角$|^变宫$/.test(name)) return "mode";
  if (/反复|D\.C\.|D\.S\.|Fine|升记号|降记号|还原记号|变音记号|跳音|顿音|断音|保持音|^连音$|延长记号|换气记号|延音线|圆滑线|终止线|五线谱|工尺谱|谱号|谱表|^音符$|^符[头干尾]$|^连线$|^调号$|省略记号|连音记号|移[高低]8度记号/.test(name)) return "sign";
  if (/和声|和弦|音程|复调|织体|卡农/.test(name)) return "harmony";
  if (/旋律|音区|装饰音|倚音|波音|滑音|颤音|音色|模进|加花|骨干音|上行|下行|音的高低|音的长短|唱名|音名|衬词|^级进$|^跳进$|螺蛳结顶|^借字$|蛇蜕壳/.test(name)) return "melody";
  if (/曲式|段体|引子|副歌|呈示部|结束句|尾声|乐段|乐句|变奏|重复|起承转合|同头换尾|换头合尾|^音乐主题$|主部主题|副部主题|^主题$|插部|段式|分节歌|^主歌$|展开部|再现部|^动机$/.test(name)) return "form";
  if (/人声分类|男高音|男低音|女高音|女低音|假声|指法|独奏|合奏|领唱|合唱|齐唱|轮唱|重唱|对唱|声势|呼唤与回应|^戏剧表演$|^[泛按散]音$|吐法|换气法|嗓音/.test(name)) return "perform";
  if (entity.type === "音乐体裁") return "genre";
  if (entity.type === "表演形式") return "perform";
  return null;
}

/** 从转写的乐谱里认节奏型：返回含有它的小节序号。 */
export function barsWith(pointName: string, melody: Melody): number[] {
  // 弱起：第一小节不满一整小节（乐曲从弱拍或弱位开始）。
  if (pointName === "弱起") {
    const [num, den] = (melody.meter.split(/[、，,\s]+/)[0] ?? "").split("/").map(Number);
    const first = melody.bars[0] ?? [];
    const length = first.reduce((sum, note) => sum + note.b, 0);
    return num && den && melody.bars.length >= 3 && length > 0 && length < (num * 4) / den - 0.01 && first.some((note) => note.d !== 0) ? [0] : [];
  }
  const test: ((bar: MelodyNote[]) => boolean) | null =
    pointName === "附点节奏" ? (bar) => bar.some((note) => note.dots && note.d !== 0)
    : pointName === "三连音" ? (bar) => bar.some((note) => note.tri)
    : pointName === "休止符" ? (bar) => bar.some((note) => note.d === 0)
    : pointName === "切分节奏" ? (bar) => {
      // 短—长—短（X X—X），从拍点上开始。
      let at = 0;
      for (let i = 0; i + 2 < bar.length + 0; i++) {
        const [a, b, c] = [bar[i], bar[i + 1], bar[i + 2]];
        if (c && [a, b, c].every((note) => note.d !== 0 && !note.tie && !note.tuplet) && (a.b === 0.5 || a.b === 0.25) && b.b === a.b * 2 && c.b === a.b && Math.abs(at / (a.b * 2) - Math.round(at / (a.b * 2))) < 1e-6) return true;
        at += a.b;
      }
      return false;
    }
    : null;
  if (!test) return [];
  return melody.bars.flatMap((bar, index) => (test(bar) ? [index] : []));
}
export const SCORE_POINTS = ["附点节奏", "切分节奏", "三连音", "休止符", "弱起"];
/** 谱面认出的点在课本里的其他写法。 */
const SCORE_ALIASES: Record<string, string[]> = { 弱起: ["弱起小节"] };
/** 图上的点对应哪种谱面认法（点名可能是“弱起小节”）。 */
export const scorePointOf = (names: string[]) => SCORE_POINTS.find((point) => [point, ...(SCORE_ALIASES[point] ?? [])].some((name) => names.includes(name)));

// ── 从旋律判断调式 ──
// 只认有把握的：只用 1 2 3 5 6 的旋律按结束音定五声调式；大调、小调只给非民歌（或外国）作品判断，
// 免得把中国民歌的七声调式说成大小调。片段只判断是不是五声调式，草稿不判断。
const PENTA_MODE: Record<number, string> = { 1: "宫调式", 2: "商调式", 3: "角调式", 5: "徵调式", 6: "羽调式" };
const PENTA_SOUND: Record<number, string> = { 1: "宫（do）", 2: "商（re）", 3: "角（mi）", 5: "徵（sol）", 6: "羽（la）" };
/** 作品说明里看得出是中国民间音乐。 */
export const FOLK_TEXT = /民歌|民间|民谣|童谣|山歌|小调(?![式音])|号子|花儿|信天游|戏曲|京剧|越剧|黄梅戏|昆曲|豫剧|评剧|粤剧|曲艺|古曲|琴歌|琴曲|吹打|丝竹|锣鼓/;
/** 外国作品的标记：〔德〕、美国民歌… */
export const FOREIGN_TEXT = /〔|德国|美国|英国|法国|俄罗斯|苏联|意大利|奥地利|捷克|波兰|日本|朝鲜|韩国|印度|澳大利亚|西班牙|苏格兰|爱尔兰|墨西哥|巴西|芬兰|挪威|瑞典|丹麦|匈牙利|罗马尼亚|保加利亚|西印度群岛|加拿大|新西兰|菲律宾|巴基斯坦|土耳其|以色列|智利|阿根廷|秘鲁|古巴|乌克兰|荷兰|瑞士|希腊|埃及|南非|肯尼亚|叙利亚|伊朗|越南|泰国|缅甸|马来西亚|新加坡|印度尼西亚|蒙古国|哈萨克斯坦|斯洛伐克|立陶宛|比利时|葡萄牙|威尔士|夏威夷|阿拉伯|美洲|欧洲|非洲|拉丁/;
export type MelodyMode = { names: string[]; reason: string };
export type ModeOptions = {
  /** 片段（选段、唱段、器乐主题）：结尾不一定落在主音上，只判断是不是五声调式。 */
  excerpt: boolean;
  /** 外国作品：不套用宫商角徵羽的调式名。 */
  foreign: boolean;
  /** 不是中国民间音乐，才按大小调判断。 */
  tonal: boolean;
};
/** 作品是不是只截了一段：名字写着选段、唱段，或旋律没有歌词（器乐主题）。 */
export function isExcerpt(workName: string, melody: Melody): boolean {
  return Boolean(melody.title) || /选段|唱段|片段|节选|主题/.test(workName) || !melody.bars.some((bar) => bar.some((note) => note.lyric));
}
export function melodyMode(melody: Melody, options: ModeOptions): MelodyMode | null {
  if (melody.quality === "draft") return null;
  const flat = melody.bars.flat().filter((note) => !note.inst);
  const pitched = flat.filter((note) => note.d >= 1 && note.d <= 7 && !note.tie);
  if (pitched.length < 16) return null;
  const count = (d: number) => pitched.filter((note) => note.d === d).length;
  const altered = pitched.filter((note) => note.a === 1 || note.a === -1);
  const pentatonic = !altered.length && !count(4) && !count(7) && new Set(pitched.map((note) => note.d)).size >= 4;
  if (pentatonic && options.foreign) return null;
  const family = ["五声调式", "中国五声调式", "中国民族五声调式"];
  if (pentatonic && options.excerpt) return { names: family, reason: "旋律只用宫、商、角、徵、羽五个音" };
  if (options.excerpt) return null;
  // 结束音要落稳：最后一个音（连同延音）至少一拍。
  const lastAt = flat.findLastIndex((note) => note.d >= 1 && note.d <= 7 && !note.tie);
  const held = flat.slice(lastAt).filter((note, index) => index === 0 || note.tie).reduce((sum, note) => sum + note.b, 0);
  const final = flat[lastAt];
  if (held < 1 || final.a === 1 || final.a === -1) return null;
  if (pentatonic) {
    const mode = PENTA_MODE[final.d];
    return mode ? { names: [...family, mode, ...(final.d === 6 ? ["民族五声羽调式"] : [])], reason: `旋律只用宫、商、角、徵、羽五个音，结束在${PENTA_SOUND[final.d]}上` } : null;
  }
  if (!options.tonal || !count(4) || !count(7) || count(4) + count(7) < pitched.length * 0.06) return null;
  const sharpFive = altered.filter((note) => note.d === 5 && note.a === 1).length;
  if (altered.length - sharpFive > pitched.length * 0.03) return null;
  const tonic = melody.key.replace(/^1=/, "").trim();
  // 大调：结束在 do，并且有导音 si 解决到 do。
  const leading = pitched.some((note, index) => note.d === 7 && !note.a && pitched[index + 1]?.d === 1);
  if (final.d === 1 && !sharpFive && leading) return { names: ["大调式", "自然大调音阶", "自然大调", `${tonic}大调`], reason: `旋律用到七个音，si 解决到 do，结束在主音 do（${tonic}）上` };
  // 小调：结束在 la。中国作品只有升高 sol（和声小调）才算，免得和七声羽调式混在一起。
  const harmonic = sharpFive >= 2;
  if (final.d === 6 && (harmonic || options.foreign)) return { names: ["小调式", harmonic ? "和声小调音阶" : "自然小调音阶", harmonic ? "和声小调" : "自然小调"], reason: harmonic ? "旋律结束在 la 上，并把 sol 升高半音（#5）" : "旋律用到七个音，结束在 la 上" };
  return null;
}

/** 截出谱例：从第一个含有该节奏型的小节起取 count 小节。 */
export function excerpt(melody: Melody, start: number, count = 2): Melody {
  const end = Math.min(melody.bars.length, start + count);
  return {
    ...melody,
    title: undefined,
    bars: melody.bars.slice(start, end),
    voices: undefined,
    lyricWords: undefined,
    lyricsEnd: undefined,
    staff: melody.staff ? [melody.staff[0]] : undefined,
  };
}

export function buildKMap(graph: CanonicalGraph, bookKey: string, melodiesOf: (workName: string) => Melody[], bookTitle: (key: string) => string | undefined = () => undefined): KMap {
  const byId = new Map(graph.entities.map((entity) => [entity.id, entity]));
  const inBook = (entity?: Entity) => Boolean(entity?.bookKeys?.includes(bookKey));
  const relations = graph.relationships.filter((relation) => !relation.provenance && !relation.extended && matchesBookScope(bookKey, relation.bookKeys));
  const valueOf = (relation: Triple) => relation.literal ?? byId.get(relation.objectId ?? "")?.name ?? "";

  // 作品：本册目录里的课（有学习方式）或有乐谱的作品。
  const works = new Map<string, KWork>();
  const unitOf = new Map<string, { name: string; order: number }>();
  const unitOrder = new Map<string, number>();
  for (const relation of relations) if (relation.predicate === "单元顺序" && relation.literal) unitOrder.set(relation.subject, Number(relation.literal.match(/\d+/)?.[0] ?? 99));
  for (const relation of relations) {
    if (relation.predicate !== "包含作品" || !relation.objectId) continue;
    const unit = byId.get(relation.subject);
    if (unit && inBook(unit)) unitOf.set(relation.objectId, { name: unit.name, order: unitOrder.get(unit.id) ?? 99 });
  }
  const modes = new Map<string, string>();
  for (const relation of relations) if (relation.predicate === "学习方式") modes.set(relation.subject, valueOf(relation));
  for (const entity of graph.entities) {
    if (!entity.name.startsWith("《") || !inBook(entity)) continue;
    if (!modes.has(entity.id) && !melodiesOf(entity.name).length) continue;
    const unit = unitOf.get(entity.id);
    works.set(entity.id, { id: entity.id, entity: entity.id, book: bookKey, name: entity.name, type: entity.type, unit: unit?.name, unitOrder: unit?.order ?? 99, page: entity.firstPageByBook?.[bookKey] ?? 999, mode: modes.get(entity.id) });
  }

  // 知识点：同名写法并到一个点上。
  // 同名的实体（如“三连音”既记成节奏型又记成音乐概念）算同一个知识点，取联系最多的那个做代表。
  // 代表实体在全套教材里找：一年级只写 2/4，“二拍子”的讲解在后面的分册。
  const candidates = graph.entities.filter((entity) => inBook(entity) && KTYPES.has(entity.type));
  const nameToEntity = new Map<string, Entity>();
  for (const entity of graph.entities) {
    if (!KTYPES.has(entity.type)) continue;
    const current = nameToEntity.get(entity.name);
    const score = (item: Entity) => (inBook(item) ? 1e6 : 0) + (item.relationCount ?? 0);
    if (!current || score(entity) > score(current)) nameToEntity.set(entity.name, entity);
  }
  const canon = (entity: Entity) => nameToEntity.get(ALIAS[entity.name] ?? "") ?? nameToEntity.get(entity.name) ?? entity;
  const nodes = new Map<string, KNode>();
  const hubId = (group: KGroup) => `hub:${group}`;
  for (const group of Object.keys(GROUPS) as KGroup[]) {
    nodes.set(hubId(group), { id: hubId(group), name: GROUPS[group].name, kind: "hub", group, core: true, aliases: [], defs: [], books: [], works: [] });
  }
  const hubNames = new Map((Object.keys(GROUPS) as KGroup[]).map((group) => [GROUPS[group].name, group]));
  const nodeIdOf = new Map<string, string>(); // 实体 id → 节点 id
  const meterLists = new Map<string, string[]>(); // 实体 id → 拆开的拍号
  const pointLists = new Map<string, { parts: string[]; type: string }>(); // 实体 id → 拆开的并列写法
  const nodeNamed = new Map<string, KNode>();
  for (const entity of candidates) {
    if (SKIP.has(entity.name)) continue;
    if (METER_LIST.test(entity.name)) { meterLists.set(entity.id, entity.name.split(/\s*[、，,]\s*/)); continue; }
    if (DESCRIPTION_TYPES.has(entity.type) && DESCRIPTION.test(entity.name)) continue;
    // “领唱、合唱”这种并列的演唱形式拆成单个知识点连到作品上；速度表情的并列（“优美、活泼地”）不上图。
    if (DESCRIPTION_TYPES.has(entity.type) && entity.name.includes("、")) {
      const parts = entity.name.split("、").map((part) => part.trim());
      if (entity.type === "表演形式" && parts.every((part) => part.length >= 2 && part.length <= 8)) pointLists.set(entity.id, { parts, type: entity.type });
      continue;
    }
    const hub = hubNames.get(entity.name);
    if (hub) { nodeIdOf.set(entity.id, hubId(hub)); continue; }
    const target = canon(entity);
    const group = groupOf(target);
    if (!group) continue;
    // 全套教材都只写 2/4、2/2 的版本，点的名字仍叫“二拍子”，几种写法并成一个点。
    const name = ALIAS[target.name] ?? target.name;
    let node = nodes.get(target.id) ?? nodeNamed.get(name);
    if (!node) {
      node = { id: target.id, name, kind: "point", group, core: false, aliases: [], defs: [], books: [...(target.bookKeys ?? [])], works: [] };
      nodes.set(target.id, node);
      nodeNamed.set(name, node);
    }
    nodeIdOf.set(entity.id, node.id);
    if (node.name !== entity.name && !node.aliases.includes(entity.name)) node.aliases.push(entity.name);
    for (const key of entity.bookKeys ?? []) if (!node.books.includes(key)) node.books.push(key);
  }

  const edges = new Map<string, KEdge>();
  const link = (a: string, b: string, label: string, source: KEdge["source"]) => {
    if (a === b) return;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (!edges.has(key)) edges.set(key, { a, b, label, source });
  };
  const parents = new Map<string, string[]>(); // 知识点 → 上级知识点
  const pointByName = new Map<string, KNode>();
  for (const node of nodes.values()) if (node.kind === "point" && !pointByName.has(node.name)) pointByName.set(node.name, node);
  // 作品连到某个拍子：本册没有这个点就新建一个。
  const linkMeter = (work: KWork, meter: string, source: KEdge["source"]) => {
    const name = ALIAS[meter];
    if (!name || !/拍子$/.test(name)) return;
    let node = pointByName.get(name);
    if (!node) {
      node = { id: `kp:${name}`, name, kind: "point", group: "meter", core: false, aliases: [meter], defs: [], books: [bookKey], works: [] };
      nodes.set(node.id, node);
      pointByName.set(name, node);
    }
    if (!node.aliases.includes(meter) && node.name !== meter) node.aliases.push(meter);
    if (node.works.includes(work.id)) return;
    link(work.id, node.id, "拍号", source);
    node.works.push(work.id);
  };
  // 并列写法拆开后的一项：本册有这个点就连上，没有就按名字新建一个（找不到所属要素的不画）。
  const linkPart = (work: KWork, name: string, type: string, label: string) => {
    let node = pointByName.get(name);
    if (!node) {
      const group = groupOf({ name, type } as Entity);
      if (!group) return;
      node = { id: `kp:${name}`, name, kind: "point", group, core: false, aliases: [], defs: [], books: [bookKey], works: [] };
      nodes.set(node.id, node);
      pointByName.set(name, node);
    }
    if (node.works.includes(work.id)) return;
    link(work.id, node.id, label, "text");
    node.works.push(work.id);
  };
  for (const relation of relations) {
    const subject = byId.get(relation.subject);
    if (!subject) continue;
    const from = nodeIdOf.get(subject.id);
    // 说明文字挂到知识点上。
    if (from && relation.literal && DEF_PREDICATES.includes(relation.predicate)) {
      const node = nodes.get(from)!;
      if (!node.defs.some((def) => def.text === relation.literal)) node.defs.push({ label: relation.predicate === "定义为" ? "定义" : relation.predicate, text: relation.literal });
    }
    const meters = relation.objectId ? meterLists.get(relation.objectId) : undefined;
    if (meters) {
      const work = works.get(subject.id);
      if (work) for (const meter of meters) linkMeter(work, meter, "text");
      continue;
    }
    const list = relation.objectId ? pointLists.get(relation.objectId) : undefined;
    if (list) {
      const work = works.get(subject.id);
      if (work) for (const part of list.parts) linkPart(work, part, list.type, relation.predicate);
      continue;
    }
    const to = relation.objectId ? nodeIdOf.get(relation.objectId) : undefined;
    if (!to) continue;
    if (works.has(subject.id)) {
      link(subject.id, to, relation.label ?? relation.predicate, "text");
      const node = nodes.get(to)!;
      if (!node.works.includes(subject.id)) node.works.push(subject.id);
    } else if (from) {
      link(from, to, relation.label ?? relation.predicate, "text");
      if (relation.predicate === "包含") parents.set(to, [...(parents.get(to) ?? []), from]);
      if (relation.predicate === "属于") parents.set(from, [...(parents.get(from) ?? []), to]);
    }
  }
  // 作品自己的说明文字（来源、体裁…），判断调式时用来区分民歌和外国作品。
  const workText = new Map<string, string[]>();
  for (const relation of relations) if (works.has(relation.subject)) workText.set(relation.subject, [...(workText.get(relation.subject) ?? []), valueOf(relation)]);
  // 谱面里认出的拍号、节奏型和调式。
  for (const work of works.values()) {
    const melodies = melodiesOf(work.name);
    if (!melodies.length) continue;
    for (const meter of new Set(melodies.flatMap((melody) => melody.meter.split(/[、，,\s]+/)))) linkMeter(work, meter, "score");
    for (const pointName of SCORE_POINTS) {
      const entity = [pointName, ...(SCORE_ALIASES[pointName] ?? [])].map((name) => nameToEntity.get(name)).find((item) => item && inBook(item));
      const id = entity ? nodeIdOf.get(entity.id) : undefined;
      if (!id || !melodies.some((melody) => barsWith(pointName, melody).length)) continue;
      link(work.id, id, "谱面出现", "score");
      const node = nodes.get(id)!;
      if (!node.works.includes(work.id)) node.works.push(work.id);
    }
    // 调式：看最后一段旋律（整首歌的结尾），只连到本册讲到的调式知识点。
    const text = [work.name, ...(workText.get(work.id) ?? [])].join(" ");
    const last = melodies[melodies.length - 1];
    const foreign = FOREIGN_TEXT.test(text);
    const mode = melodyMode(last, { excerpt: isExcerpt(work.name, last), foreign, tonal: foreign || !FOLK_TEXT.test(text) });
    for (const name of mode?.names ?? []) {
      const node = pointByName.get(name);
      if (!node || node.works.includes(work.id)) continue;
      link(work.id, node.id, "调式", "score");
      node.works.push(work.id);
    }
  }
  // 知识点之间的乐理关系（各版本共用的表）：两头都在本册才连。
  const pointNamed = new Map<string, KNode>();
  for (const node of nodes.values()) {
    if (node.kind !== "point") continue;
    for (const name of [node.name, ...node.aliases]) if (!pointNamed.has(name)) pointNamed.set(name, node);
  }
  // 表里“又称”的两个名字互为别名：本册只写了其中一个，另一个名字下的关系也算它的。
  const findPoint = (name: string) => pointNamed.get(name) ?? (SYNONYMS.get(name) ?? []).map((other) => pointNamed.get(other)).find(Boolean);
  for (const [from, predicate, targets] of KMAP_RELATIONS) {
    const a = findPoint(from);
    if (!a) continue;
    for (const target of Array.isArray(targets) ? targets : [targets]) {
      const b = predicate === "又称" ? pointNamed.get(target) : findPoint(target);
      if (!b || a === b) continue;
      link(a.id, b.id, predicate, "text");
      if (predicate === "包含") parents.set(b.id, [...(parents.get(b.id) ?? []), a.id]);
    }
  }
  // 没有上级知识点的，挂到所属要素上。
  const children = new Map<string, number>();
  for (const list of parents.values()) for (const parent of new Set(list)) children.set(parent, (children.get(parent) ?? 0) + 1);
  // 和本册两个以上知识点有乐理关系的点数（高中编创里的织体、和声这类，课本没有作品连着），排完其他核心点后有空位再补上。
  const peers = new Map<string, number>();
  for (const edge of edges.values()) {
    if (nodes.get(edge.a)?.kind !== "point" || nodes.get(edge.b)?.kind !== "point") continue;
    for (const id of [edge.a, edge.b]) peers.set(id, (peers.get(id) ?? 0) + 1);
  }
  for (const node of nodes.values()) {
    if (node.kind !== "point") continue;
    node.core = node.defs.length > 0 || node.works.length >= 2 || (children.get(node.id) ?? 0) >= 2;
  }
  // 成套的记号和时值（力度记号→ppp…fff、休止符→全休止符…）只显示上级，下面的在“显示全部”里看；作品用到的照常显示。
  const folded = new Set<string>();
  for (const node of nodes.values()) {
    if (node.kind !== "point" || !node.core || !["rhythm", "dynamics", "sign"].includes(node.group!)) continue;
    const kids = [...nodes.values()].filter((kid) => kid.kind === "point" && (parents.get(kid.id) ?? []).includes(node.id) && !kid.works.length && !children.get(kid.id));
    if (kids.length < 4) continue;
    for (const kid of kids) { kid.core = false; folded.add(kid.id); }
  }
  // 低年级知识点少：核心不到 18 个时，有作品用到的都算。
  const points = [...nodes.values()].filter((node) => node.kind === "point");
  let coreCount = points.filter((node) => node.core).length;
  if (coreCount < 18) {
    for (const node of points.filter((item) => !item.core && item.works.length).sort((a, b) => b.works.length - a.works.length)) {
      if (coreCount >= 26) break;
      node.core = true;
      coreCount += 1;
    }
  }
  // 核心知识点下面分出的知识点（五声调式→宫商角徵羽）本册也讲到了，一起显示；每册最多显示到 46 个，免得太乱。
  const theoryChildren = points
    .filter((node) => !node.core && !folded.has(node.id) && (parents.get(node.id) ?? []).some((parent) => nodes.get(parent)?.core))
    .sort((a, b) => b.works.length - a.works.length);
  for (const node of theoryChildren) {
    if (coreCount >= 46) break;
    node.core = true;
    coreCount += 1;
  }
  for (const node of points.filter((item) => !item.core && !folded.has(item.id) && (peers.get(item.id) ?? 0) >= 2).sort((a, b) => (peers.get(b.id) ?? 0) - (peers.get(a.id) ?? 0))) {
    if (coreCount >= 46) break;
    node.core = true;
    coreCount += 1;
  }
  // 知识讲得特别多的册（一册里讲京剧板式又讲歌剧样式）：超过 52 个时，先收起没有作品用到、又只连着一个核心知识点的末梢；
  // 把几个核心知识点串起来的（西皮→原板、慢板、流水）留着。
  if (coreCount > 52) {
    const peers = new Map<string, number>();
    for (const edge of edges.values()) {
      const [a, b] = [nodes.get(edge.a), nodes.get(edge.b)];
      if (a?.kind !== "point" || b?.kind !== "point" || !a.core || !b.core) continue;
      for (const id of [edge.a, edge.b]) peers.set(id, (peers.get(id) ?? 0) + 1);
    }
    const spare = points
      .filter((node) => node.core && !node.works.length && (peers.get(node.id) ?? 0) < 2)
      .sort((a, b) => (peers.get(a.id) ?? 0) - (peers.get(b.id) ?? 0) || a.defs.length - b.defs.length);
    for (const node of spare) {
      if (coreCount <= 52) break;
      node.core = false;
      coreCount -= 1;
    }
  }
  for (const node of nodes.values()) {
    if (node.kind !== "point") continue;
    // 上级知识点默认不显示时，直接挂到要素上，免得悬空。
    if (!(parents.get(node.id) ?? []).some((parent) => nodes.get(parent)?.kind === "hub" || nodes.get(parent)?.core)) link(hubId(node.group!), node.id, "包含", "text");
  }
  // 本册没有讲解的知识点，用其他分册里教材的讲解。
  const lacking = new Map([...nodes.values()].filter((node) => node.kind === "point" && !node.defs.length).map((node) => [node.id, node]));
  if (lacking.size) {
    for (const relation of graph.relationships) {
      const node = lacking.get(relation.subject);
      if (!node || !relation.literal || relation.provenance || relation.extended || !DEF_PREDICATES.includes(relation.predicate)) continue;
      if (node.defs.length >= 2 || node.defs.some((def) => def.text === relation.literal)) continue;
      const from = relation.bookKeys?.[0];
      node.defs.push({ label: relation.predicate === "定义为" ? "定义" : relation.predicate, text: relation.literal, book: from ? bookTitle(from) ?? from : undefined });
    }
  }
  // 一个作品都没连、也没有说明的要素不显示。
  const used = new Set([...edges.values()].flatMap((edge) => [edge.a, edge.b]));
  const list = [...nodes.values()].filter((node) => used.has(node.id));
  for (const work of works.values()) {
    if (used.has(work.id)) list.push({ id: work.id, name: work.name, kind: "work", core: true, aliases: [], defs: [], page: work.page, books: [], works: [] });
  }
  return { nodes: list, edges: [...edges.values()], works };
}

/** 全套视图：把各册的图合成一张。同名知识点合成一个点；作品不上图，改成“分册”点，线上写这一册有几首作品用到。 */
export function mergeKMaps(maps: KMap[], books: Array<{ key: string; label: string }>): KMap {
  const nodes = new Map<string, KNode>();
  const works = new Map<string, KWork>();
  const edges = new Map<string, KEdge>();
  const parents = new Map<string, Set<string>>();
  for (const map of maps) {
    const idOf = new Map<string, string>();
    for (const node of map.nodes) {
      if (node.kind === "work") {
        const work = map.works.get(node.id)!;
        const id = `${work.book}|${work.id}`;
        idOf.set(node.id, id);
        works.set(id, { ...work, id });
        continue;
      }
      const id = node.kind === "hub" ? node.id : `kp:${node.name}`;
      idOf.set(node.id, id);
      const merged = nodes.get(id);
      if (!merged) { nodes.set(id, { ...node, id, core: node.kind === "hub", aliases: [...node.aliases], defs: node.defs.filter((def) => !def.book), books: [...node.books], works: [] }); continue; }
      for (const alias of node.aliases) if (!merged.aliases.includes(alias)) merged.aliases.push(alias);
      for (const def of node.defs) if (!def.book && merged.defs.length < 4 && !merged.defs.some((item) => item.text === def.text)) merged.defs.push(def);
      for (const key of node.books) if (!merged.books.includes(key)) merged.books.push(key);
    }
    for (const node of map.nodes) {
      if (node.kind !== "point") continue;
      const merged = nodes.get(idOf.get(node.id)!)!;
      for (const work of node.works) merged.works.push(idOf.get(work)!);
    }
    for (const edge of map.edges) {
      const a = idOf.get(edge.a)!;
      const b = idOf.get(edge.b)!;
      if (works.has(a) || works.has(b)) continue;
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (!edges.has(key)) edges.set(key, { ...edge, a, b });
      if (edge.label === "包含" && a.startsWith("kp:") && b.startsWith("kp:")) parents.set(b, (parents.get(b) ?? new Set()).add(a));
    }
  }
  const points = [...nodes.values()].filter((node) => node.kind === "point");
  // 全套里的核心：教材讲过并且有作品用到，或用到的作品多。数量控制在一屏能看清的范围。
  const children = new Map<string, number>();
  for (const set of parents.values()) for (const parent of set) children.set(parent, (children.get(parent) ?? 0) + 1);
  const weight = (node: KNode) => node.works.length + (node.defs.length ? 4 : 0) + Math.min(6, (children.get(node.id) ?? 0) * 2) + Math.min(4, node.books.length);
  for (const node of [...points].sort((a, b) => weight(b) - weight(a)).slice(0, 84)) if (weight(node) >= 6) node.core = true;
  // 核心点的上级不在核心里时，直接挂到要素上。
  for (const node of points) {
    if (!node.core) continue;
    const linked = [...edges.values()].some((edge) => (edge.a === node.id || edge.b === node.id) && edge.source === "text" && (() => { const other = nodes.get(edge.a === node.id ? edge.b : edge.a)!; return other.kind === "hub" || (other.kind === "point" && other.core); })());
    if (!linked) { const hub = `hub:${node.group}`; edges.set(`${hub}|${node.id}`, { a: hub, b: node.id, label: "包含", source: "text" }); }
  }
  // 分册点：核心知识点在这一册有作品用到，就连一条线。
  for (const book of books) {
    const id = `book:${book.key}`;
    let used = false;
    for (const node of points) {
      if (!node.core) continue;
      const count = node.works.filter((work) => works.get(work)!.book === book.key).length;
      if (!count) continue;
      edges.set(`${id}|${node.id}`, { a: id, b: node.id, label: `${count} 首`, source: "text" });
      used = true;
    }
    if (used) nodes.set(id, { id, name: book.label, kind: "book", core: true, aliases: [], defs: [], books: [book.key], works: [] });
  }
  return { nodes: [...nodes.values()], edges: [...edges.values()], works, whole: true };
}
