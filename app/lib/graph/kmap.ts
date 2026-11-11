// 核心知识点图：一册书里“知识点—作品”的网。
// 节点只有三种：要素（节拍、节奏、速度…）、知识点（教材里的概念、术语、体裁、演唱演奏形式）、作品。
// 连线全部来自教材数据（作品的拍号、速度、曲式…指向哪个知识点），另加从已转写乐谱里认出的节奏型（标为“谱面”）。
import { matchesBookScope } from "../app/unit-data";
import type { CanonicalGraph, Entity, Triple } from "../app/types";
import type { Melody, MelodyNote } from "../lesson/jianpu";

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
  kind: "hub" | "point" | "work";
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
export type KEdge = { a: string; b: string; label: string; source: "text" | "score" };
export type KWork = { id: string; name: string; type: string; unit?: string; unitOrder: number; page: number; mode?: string };
export type KMap = { nodes: KNode[]; edges: KEdge[]; works: Map<string, KWork> };

const KTYPES = new Set(["音乐概念", "节奏型", "拍号", "速度术语", "音乐体裁", "表演形式"]);
// 教材里同一个知识点的两种写法：作品写 2/4，知识页讲“二拍子”。
const ALIAS: Record<string, string> = { "2/4": "二拍子", "3/4": "三拍子", "4/4": "四拍子", "6/8": "六拍子", "ABA三部曲式": "三部曲式", "两段体": "二段体" };
const DYNAMICS = /^(?:p{1,3}|f{1,3}|mf|mp|sf|sfz|fp)(?:（[^）]*）)?$/;
const DEF_PREDICATES = ["定义为", "含义", "特点", "作用", "记法", "强弱规律", "典型节奏"];
// 只是谱面上的字样或太宽泛的总称，不单独成点。
const SKIP = new Set(["音乐要素", "简谱", "简谱基础知识", "演唱形式", "演奏形式", "音乐体裁", "拍号", "音乐记号", "指挥图示", "二拍子指挥图示", "三拍子指挥图示", "四拍子指挥图示", "音符与唱名", "嗓音保护常识"]);
// 谱面抄录（“1=F，2/4”“mp、mf”“1 2 3 5 6”）不是知识点。
const TRANSCRIPT = /^1=|^[\d i]+(?:（|$)|^[a-z]{1,3}、|[：:]/;

function groupOf(entity: Entity): KGroup | null {
  const name = entity.name;
  if (TRANSCRIPT.test(name)) return null;
  if (/西皮|二黄|板腔|曲牌|锣鼓|文场|武场|行当|念白|身段|脸谱|声腔|剧种|亮相|数板|有板无眼|四击头|住头|抽头|撤锣|崩登仓|行弦|润腔/.test(name)) return "opera";
  if (entity.type === "拍号" || /拍子|^节拍$|弱起|散板|强弱规律|小节/.test(name)) return "meter";
  if (entity.type === "节奏型" || /节奏|休止符|附点|音符时值|连音|切分|分音符|全音符/.test(name)) return "rhythm";
  if (entity.type === "速度术语" || /速度/.test(name)) return "tempo";
  if (DYNAMICS.test(name) || /力度|渐强|渐弱|重音|音的强弱/.test(name)) return "dynamics";
  if (/调式|音阶|大调|小调|转调|变化音/.test(name)) return "mode";
  if (/反复|D\.C\.|D\.S\.|Fine|升记号|降记号|还原记号|变音记号|跳音|延长记号|换气记号|延音线|圆滑线|终止线/.test(name)) return "sign";
  if (/和声|和弦|音程|复调|织体|卡农/.test(name)) return "harmony";
  if (/旋律|音区|装饰音|倚音|波音|滑音|颤音|音色|模进|加花|骨干音|上行|下行|音的高低|音的长短|唱名|音名/.test(name)) return "melody";
  if (/曲式|段体|引子|副歌|呈示部|结束句|尾声|乐段|乐句|变奏|重复|起承转合|同头换尾|换头合尾/.test(name)) return "form";
  if (/人声分类|男高音|男低音|女高音|女低音|假声|指法|独奏|合奏|领唱|合唱|齐唱|轮唱|重唱|对唱/.test(name)) return "perform";
  if (entity.type === "音乐体裁") return "genre";
  if (entity.type === "表演形式") return "perform";
  return null;
}

/** 从转写的乐谱里认节奏型：返回含有它的小节序号。 */
export function barsWith(pointName: string, melody: Melody): number[] {
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
export const SCORE_POINTS = ["附点节奏", "切分节奏", "三连音", "休止符"];

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
    works.set(entity.id, { id: entity.id, name: entity.name, type: entity.type, unit: unit?.name, unitOrder: unit?.order ?? 99, page: entity.firstPageByBook?.[bookKey] ?? 999, mode: modes.get(entity.id) });
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
  for (const entity of candidates) {
    if (SKIP.has(entity.name)) continue;
    const hub = hubNames.get(entity.name);
    if (hub) { nodeIdOf.set(entity.id, hubId(hub)); continue; }
    const target = canon(entity);
    const group = groupOf(target);
    if (!group) continue;
    nodeIdOf.set(entity.id, target.id);
    let node = nodes.get(target.id);
    if (!node) {
      // 全套教材都只写 2/4 的版本，点的名字仍叫“二拍子”。
      node = { id: target.id, name: ALIAS[target.name] ?? target.name, kind: "point", group, core: false, aliases: [], defs: [], books: [...(target.bookKeys ?? [])], works: [] };
      nodes.set(target.id, node);
    }
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
  for (const relation of relations) {
    const subject = byId.get(relation.subject);
    if (!subject) continue;
    const from = nodeIdOf.get(subject.id);
    // 说明文字挂到知识点上。
    if (from && relation.literal && DEF_PREDICATES.includes(relation.predicate)) {
      const node = nodes.get(from)!;
      if (!node.defs.some((def) => def.text === relation.literal)) node.defs.push({ label: relation.predicate === "定义为" ? "定义" : relation.predicate, text: relation.literal });
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
  // 谱面里认出的拍号和节奏型。
  const pointByName = new Map([...nodes.values()].filter((node) => node.kind === "point").map((node) => [node.name, node]));
  for (const work of works.values()) {
    const melodies = melodiesOf(work.name);
    if (!melodies.length) continue;
    for (const meter of new Set(melodies.flatMap((melody) => melody.meter.split(/[、，,\s]+/)))) {
      const name = ALIAS[meter];
      if (!name || !/拍子$/.test(name)) continue;
      let node = pointByName.get(name);
      if (!node) {
        node = { id: `kp:${name}`, name, kind: "point", group: "meter", core: false, aliases: [meter], defs: [], books: [bookKey], works: [] };
        nodes.set(node.id, node);
        pointByName.set(name, node);
      }
      if (node.works.includes(work.id)) continue;
      link(work.id, node.id, "拍号", "score");
      node.works.push(work.id);
    }
    for (const pointName of SCORE_POINTS) {
      const entity = nameToEntity.get(pointName);
      const id = entity && inBook(entity) ? nodeIdOf.get(entity.id) : undefined;
      if (!id || !melodies.some((melody) => barsWith(pointName, melody).length)) continue;
      link(work.id, id, "谱面出现", "score");
      const node = nodes.get(id)!;
      if (!node.works.includes(work.id)) node.works.push(work.id);
    }
  }
  // 没有上级知识点的，挂到所属要素上。
  const children = new Map<string, number>();
  for (const list of parents.values()) for (const parent of new Set(list)) children.set(parent, (children.get(parent) ?? 0) + 1);
  for (const node of nodes.values()) {
    if (node.kind !== "point") continue;
    node.core = node.defs.length > 0 || node.works.length >= 2 || (children.get(node.id) ?? 0) >= 2;
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
