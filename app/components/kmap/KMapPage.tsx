"use client";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { EDITION, PUBLISHED_BOOK_SHORT_NAMES } from "../../lib/app/books";
import { getScoreMedia } from "../../lib/app/unit-data";
import { bareWorkName, type BookDirectory, type CanonicalGraph } from "../../lib/app/types";
import { barsWith, buildKMap, excerpt, GROUPS, mergeKMaps, SCORE_POINTS, type KEdge, type KGroup, type KMap, type KNode, type KWork } from "../../lib/graph/kmap";
import { melodiesFor } from "../../lib/lesson/melodies";
import type { Melody } from "../../lib/lesson/jianpu";
import { MelodyPlayer, MelodySet } from "../lesson/MelodyPlayer";

type Tool = "rhythm" | "ear" | "lab" | "compose";
type Point = { x: number; y: number };
// 图是圆的：所有节点都排在一个（略扁的）圆里，要素在中圈，全套视图的分册在内圈。
const W = 900;
const H = 840;
const RX = 432;
const RY = 404;
const melodyBook = (key: string) => (EDITION.notation === "staff" ? `wx-${key}` : key);
const notationStyle = EDITION.notation === "staff" ? "staff" : "jianpu";
const bookLabel = (book: BookDirectory) => PUBLISHED_BOOK_SHORT_NAMES[book.key] ?? `${book.grade}${book.semester.replace(/册$/, "")}`;
const pointRadius = (node: KNode) => 5 + Math.min(17, Math.sqrt(node.works.length) * 2.1);
// 全套视图：全部分册、小学、初中。
const SCOPES: Record<string, { name: string; test: (grade: number) => boolean }> = {
  all: { name: "全套", test: () => true },
  "all-primary": { name: "全套 · 小学", test: (grade) => grade <= 6 },
  "all-junior": { name: "全套 · 初中", test: (grade) => grade >= 7 },
};
const gradeOf = (key: string) => Number(key.match(/g(\d)s\d$/)?.[1] ?? 0);
// 标签占的地方：汉字约 14px 宽，西文约 8px。
const textWidth = (text: string, size: number) => [...text].reduce((sum, char) => sum + (char.charCodeAt(0) > 255 ? size : size * 0.58), 0);
const PRACTICE: Partial<Record<KGroup, Array<{ tool: Tool; label: string; hint: string }>>> = {
  meter: [{ tool: "rhythm", label: "节奏训练", hint: "跟着节拍敲一敲" }],
  rhythm: [{ tool: "rhythm", label: "节奏训练", hint: "读节奏、敲节奏、闯关" }, { tool: "compose", label: "旋律创编", hint: "用这个节奏写一句旋律" }],
  mode: [{ tool: "lab", label: "五声律坊", hint: "换一换调式，听听色彩" }, { tool: "ear", label: "听音训练", hint: "听辨音高" }],
  melody: [{ tool: "ear", label: "听音训练", hint: "听辨旋律的高低" }, { tool: "compose", label: "旋律创编", hint: "自己写一句旋律" }],
  form: [{ tool: "compose", label: "旋律创编", hint: "试着写出有重复和对比的乐句" }],
};

/** 固定种子的力导向布局：同一册书每次打开位置都一样。 */
function layout(map: KMap): Map<string, Point> {
  let seed = 20261111;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const groups = Object.keys(GROUPS) as KGroup[];
  const anchor = new Map<string, Point>();
  groups.forEach((group, index) => {
    const angle = (index / groups.length) * Math.PI * 2 - Math.PI / 2;
    anchor.set(`hub:${group}`, { x: W / 2 + Math.cos(angle) * RX * 0.66, y: H / 2 + Math.sin(angle) * RY * 0.66 });
  });
  // 全套视图：分册在圆心围成一圈，从正上方起顺时针由低年级到高年级；非核心知识点不参与布局。
  const placed = map.whole ? map.nodes.filter((node) => node.core) : map.nodes;
  const bookNodes = placed.filter((node) => node.kind === "book");
  bookNodes.forEach((node, index) => {
    const angle = (index / bookNodes.length) * Math.PI * 2 - Math.PI / 2;
    const ring = bookNodes.length > 8 ? 0.3 : 0.2;
    anchor.set(node.id, { x: W / 2 + Math.cos(angle) * RX * ring, y: H / 2 + Math.sin(angle) * RY * ring });
  });
  const position = new Map<string, Point>();
  const reach = new Map<string, number>();
  for (const node of placed) {
    const base = anchor.get(node.id) ?? (node.kind === "point" ? anchor.get(`hub:${node.group}`)! : { x: W / 2, y: H / 2 });
    const spread = anchor.has(node.id) ? 0 : node.kind === "point" ? 70 : 150;
    position.set(node.id, { x: base.x + (random() - 0.5) * spread, y: base.y + (random() - 0.5) * spread });
    reach.set(node.id, node.kind === "hub" ? 36 : node.kind === "book" ? 22 : node.kind === "work" ? 11 : node.core ? Math.max(pointRadius(node) + 6, textWidth(node.name, 14) * 0.45 + 8) : 9);
  }
  const kind = new Map(placed.map((node) => [node.id, node.kind]));
  const labelHalf = new Map(placed.filter((node) => node.kind === "point").map((node) => [node.id, textWidth(node.name, 14) / 2]));
  const springs = map.edges.filter((edge) => kind.has(edge.a) && kind.has(edge.b)).map((edge) => {
    const pair = [kind.get(edge.a), kind.get(edge.b)];
    const work = pair.includes("work") || pair.includes("book");
    return { edge, length: work ? 120 : pair.includes("hub") ? 74 : 60, strength: work ? 0.006 : pair.includes("hub") ? 0.11 : 0.08 };
  });
  const ids = placed.map((node) => node.id);
  for (let step = 0; step < 420; step++) {
    const heat = 1 - step / 420;
    const move = new Map(ids.map((id) => [id, { x: 0, y: 0 }]));
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = position.get(ids[i])!;
        const b = position.get(ids[j])!;
        // 标签是横的，横向多留一些空。
        const dx = (a.x - b.x) * 0.62 || 0.01;
        const dy = a.y - b.y || 0.01;
        const distance = Math.hypot(dx, dy);
        const room = reach.get(ids[i])! + reach.get(ids[j])! + 8;
        const push = distance < room ? (room - distance) * 0.45 : (room * room) / (distance * distance) * 0.9;
        const fx = (dx / distance) * push;
        const fy = (dy / distance) * push;
        move.get(ids[i])!.x += fx; move.get(ids[i])!.y += fy;
        move.get(ids[j])!.x -= fx; move.get(ids[j])!.y -= fy;
      }
    }
    for (const { edge, length, strength } of springs) {
      const a = position.get(edge.a)!;
      const b = position.get(edge.b)!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 1;
      const pull = (distance - length) * strength;
      move.get(edge.a)!.x += (dx / distance) * pull; move.get(edge.a)!.y += (dy / distance) * pull;
      move.get(edge.b)!.x -= (dx / distance) * pull; move.get(edge.b)!.y -= (dy / distance) * pull;
    }
    for (const id of ids) {
      const at = position.get(id)!;
      const delta = move.get(id)!;
      const home = anchor.get(id);
      if (home) { const hold = kind.get(id) === "book" ? 0.5 : 0.14; delta.x += (home.x - at.x) * hold; delta.y += (home.y - at.y) * hold; }
      delta.x += (W / 2 - at.x) * 0.002; delta.y += (H / 2 - at.y) * 0.003;
      const size = Math.hypot(delta.x, delta.y) || 1;
      const limit = Math.min(size, 3 + 22 * heat);
      at.x += (delta.x / size) * limit;
      at.y += (delta.y / size) * limit;
      // 出了圆就拉回到圆边上（标签长的点多留一点）。
      const rx = RX - (kind.get(id) === "work" ? 10 : Math.max(30, (labelHalf.get(id) ?? 0)));
      const ry = RY - (kind.get(id) === "work" ? 10 : 26);
      const out = Math.hypot((at.x - W / 2) / rx, (at.y - H / 2) / ry);
      if (out > 1) { at.x = W / 2 + (at.x - W / 2) / out; at.y = H / 2 + (at.y - H / 2) / out; }
    }
  }
  return position;
}

function Fold({ label, children }: { label: string; children: () => ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className={`kmap-fold${open ? " is-open" : ""}`}>
    <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{label}</button>
    {open && <div className="kmap-fold-body">{children()}</div>}
  </div>;
}

/** 核心知识点图（小样）：一册书的知识点网 + 每个知识点的讲解、谱例、音频、课例和练习。 */
export function KMapPage({ graph, books, bookKey: routeBook, fallbackBook, point: routePoint, assetUrl, onRoute, onOpenLesson, onPlan, onTool, onFullGraph }: {
  graph: CanonicalGraph;
  books: BookDirectory[];
  bookKey?: string;
  /** 地址里没写分册时用的那一册（最近在“按课学习”里看的）。 */
  fallbackBook?: string;
  point?: string;
  assetUrl: (path: string) => string;
  onRoute: (bookKey: string, point?: string) => void;
  onOpenLesson: (work: string, bookKey: string) => void;
  onPlan: (work: string, bookKey: string) => void;
  onTool: (tool: Tool) => void;
  onFullGraph: () => void;
}) {
  const scope = routeBook && SCOPES[routeBook] ? routeBook : null;
  const bookKey = scope ?? (books.some((book) => book.key === routeBook) ? routeBook! : books.some((book) => book.key === fallbackBook) ? fallbackBook! : books.find((book) => /(^|-)g7s1$/.test(book.key))?.key ?? books[0]?.key ?? "g7s1");
  const melodiesOf = (work: KWork) => melodiesFor(melodyBook(work.book), work.name);
  const map = useMemo(() => {
    const one = (key: string) => buildKMap(graph, key, (name) => melodiesFor(melodyBook(key), name), (other) => books.find((item) => item.key === other)?.title);
    if (!scope) return one(bookKey);
    const inScope = books.filter((item) => SCOPES[scope].test(gradeOf(item.key))).sort((a, b) => a.key.replace(/^.*(g\d+s\d)$/, "$1").localeCompare(b.key.replace(/^.*(g\d+s\d)$/, "$1")));
    return mergeKMaps(inScope.map((item) => one(item.key)), inScope.map((item) => ({ key: item.key, label: bookLabel(item) })));
  }, [graph, bookKey, books, scope]);
  const basePositions = useMemo(() => layout(map), [map]);
  const nodeById = useMemo(() => new Map(map.nodes.map((node) => [node.id, node])), [map]);
  const entityById = useMemo(() => new Map(graph.entities.map((entity) => [entity.id, entity])), [graph.entities]);
  const neighbours = useMemo(() => {
    const result = new Map<string, Map<string, KEdge>>();
    for (const edge of map.edges) {
      for (const [from, to] of [[edge.a, edge.b], [edge.b, edge.a]]) {
        if (!result.has(from)) result.set(from, new Map());
        result.get(from)!.set(to, edge);
      }
    }
    return result;
  }, [map]);
  const selected = map.nodes.find((node) => node.name === routePoint || bareWorkName(node.name) === routePoint);
  // 全套视图里非核心知识点没有排过位置：要显示时围着所属要素一圈圈摆开。
  const positions = useMemo(() => {
    if (!map.whole) return basePositions;
    const result = new Map(basePositions);
    const count = new Map<string, number>();
    for (const node of map.nodes) {
      if (result.has(node.id) || node.kind !== "point") continue;
      const centre = result.get(`hub:${node.group}`) ?? { x: W / 2, y: H / 2 };
      const index = count.get(node.group!) ?? 0;
      count.set(node.group!, index + 1);
      const radius = 46 + 13 * Math.sqrt(index + 1);
      const angle = index * 2.399963;
      const x = centre.x + Math.cos(angle) * radius * 1.35;
      const y = centre.y + Math.sin(angle) * radius;
      const out = Math.max(1, Math.hypot((x - W / 2) / (RX - 34), (y - H / 2) / (RY - 24)));
      result.set(node.id, { x: W / 2 + (x - W / 2) / out, y: H / 2 + (y - H / 2) / out });
    }
    return result;
  }, [basePositions, map]);
  const [hover, setHover] = useState<string | null>(null);
  // 窄屏上图可以左右拖：选中一个点后把它移到中间。
  const stageRef = useRef<HTMLDivElement | null>(null);
  const selectedAt = selected ? positions.get(selected.id) : undefined;
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !selectedAt || stage.scrollWidth <= stage.clientWidth) return;
    stage.scrollTo({ left: (selectedAt.x / W) * stage.scrollWidth - stage.clientWidth / 2, behavior: "smooth" });
  }, [selectedAt]);
  const [showAll, setShowAll] = useState(false);
  const focus = hover ?? selected?.id ?? null;
  const near = focus ? neighbours.get(focus) : undefined;
  const select = (node?: KNode) => onRoute(bookKey, node ? (node.kind === "work" ? bareWorkName(node.name) : node.name) : undefined);

  const visible = (node: KNode) => node.core || (showAll && !map.whole) || node.id === selected?.id
    || (selected?.kind === "hub" && node.group === selected.group) || Boolean(selected && neighbours.get(selected.id)?.has(node.id));
  const visiblePoints = map.nodes.filter((node) => node.kind === "point" && visible(node));
  // 这一册里没有可显示知识点的要素先不画，免得空着一个标签。
  const shown = map.nodes.filter((node) => visible(node) && (node.kind !== "hub" || node.id === selected?.id || visiblePoints.some((point) => point.group === node.group)));
  const shownIds = new Set(shown.map((node) => node.id));
  const points = map.nodes.filter((node) => node.kind === "point");
  const corePoints = points.filter((node) => node.core);
  const workCount = map.whole ? map.works.size : map.nodes.filter((node) => node.kind === "work").length;
  const book = books.find((item) => item.key === bookKey);
  const title = scope ? `${EDITION.label ?? ""}${SCOPES[scope].name}` : book?.title ?? "核心知识点";
  const bookIndex = new Map([...books].sort((a, b) => a.key.replace(/^.*(g\d+s\d)$/, "$1").localeCompare(b.key.replace(/^.*(g\d+s\d)$/, "$1"))).map((item, index) => [item.key, index]));
  const bookTitle = (key: string) => books.find((item) => item.key === key)?.title ?? key;
  const here = scope ? "全套" : "本册";
  const lit = (id: string) => !focus || id === focus || Boolean(near?.has(id));
  // 连着的作品太多时，图上只点亮圆点，名字在右边的课例里看（鼠标移上去仍显示）。
  const crowded = !map.whole && (near?.size ?? 0) > 14;
  const focusAt = focus ? positions.get(focus) : undefined;

  const worksOf = (node: KNode) => node.works.map((id) => map.works.get(id)!).sort((a, b) => (bookIndex.get(a.book) ?? 0) - (bookIndex.get(b.book) ?? 0) || a.unitOrder - b.unitOrder || a.page - b.page);
  const workActions = (work: KWork) => <span className="kmap-actions">
    <button type="button" onClick={() => onOpenLesson(bareWorkName(work.name), work.book)}>学这一课</button>
    <button type="button" onClick={() => onPlan(bareWorkName(work.name), work.book)}>用它备课</button>
  </span>;
  // 全套视图里作品不在图上：点作品名就到它那一册的图里去看。
  const openWork = (work: KWork) => (map.whole ? onRoute(work.book, bareWorkName(work.name)) : select(nodeById.get(work.id)));

  const pointCard = (node: KNode) => {
    const works = worksOf(node);
    const scored = SCORE_POINTS.includes(node.name);
    // 谱例：从乐谱里截出含有这个节奏型的两小节。
    const examples = scored ? works.flatMap((work) => {
      for (const melody of melodiesOf(work)) {
        const bars = barsWith(node.name, melody);
        if (bars.length) return [{ work, melody: excerpt(melody, Math.min(bars[0], Math.max(0, melody.bars.length - 2))), bar: bars[0] + 1 }];
      }
      return [];
    }) : [];
    const withMelody = scored ? [] : works.filter((work) => melodiesOf(work).length).slice(0, 4);
    // 课例：分册图按单元分组，全套图按分册分组（从低年级到高年级）。
    const groupOf = (work: KWork) => (scope ? bookTitle(work.book) : work.unit ?? "其他");
    const units = [...new Set(works.map(groupOf))];
    const workRow = (work: KWork) => {
      const edge = neighbours.get(node.id)?.get(work.id);
      const scores = getScoreMedia(entityById.get(work.entity)?.media, work.book);
      return <li key={work.id}>
        <div>
          <button type="button" className="kmap-work-name" onClick={() => openWork(work)}>{work.name}</button>
          <small>{[work.mode, scope ? work.unit : edge?.source === "score" ? "乐谱里出现" : edge?.label].filter(Boolean).join(" · ")}</small>
        </div>
        {workActions(work)}
        {scores[0] && <Fold label="看课本乐谱">{() =>
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={scores[0].title ?? `${work.name}课本乐谱`} loading="lazy" src={assetUrl(scores[0].url)} />}</Fold>}
      </li>;
    };
    const otherBooks = node.books.filter((key) => books.some((item) => item.key === key));
    const practice = PRACTICE[node.group!] ?? [];
    return <>
      <header className="kmap-card-head">
        <span className={`kmap-chip hue-${GROUPS[node.group!].hue}`}>{GROUPS[node.group!].name}</span>
        <h2>{node.name}</h2>
        <p>{[node.aliases.length ? `教材里也写作 ${node.aliases.join("、")}` : "", `${here} ${works.length} 首作品用到`, scope && otherBooks.length ? `${otherBooks.length} 册学到` : ""].filter(Boolean).join(" · ")}</p>
      </header>
      <section>
        <h3>讲解</h3>
        {node.defs.length ? <dl className="kmap-defs">{node.defs.map((def) => <div key={def.text}><dt>{def.label}</dt><dd>{def.text}{def.book || def.page ? <small>{[def.book, def.page ? `教材第 ${def.page} 页` : ""].filter(Boolean).join(" · ")}</small> : null}</dd></div>)}</dl>
          : <p className="kmap-quiet">教材没有单独讲解它，下面是用到它的作品。</p>}
      </section>
      {examples.length > 0 && <section>
        <h3>谱例与音频</h3>
        <p className="kmap-quiet">从课本乐谱里截出的小节，点播放就能听。</p>
        {examples.slice(0, 3).map(({ work, melody, bar }) => <figure className="kmap-example" key={work.id}>
          <figcaption>{work.name} <small>第 {bar} 小节起</small></figcaption>
          <MelodyPlayer melody={melody} notationStyle={notationStyle} />
        </figure>)}
        {examples.length > 3 && <Fold label={`再看 ${Math.min(examples.length, 12) - 3} 首`}>{() => examples.slice(3, 12).map(({ work, melody, bar }) => <figure className="kmap-example" key={work.id}>
          <figcaption>{work.name} <small>第 {bar} 小节起</small></figcaption>
          <MelodyPlayer melody={melody} notationStyle={notationStyle} />
        </figure>)}</Fold>}
      </section>}
      {withMelody.length > 0 && <section>
        <h3>谱例与音频</h3>
        {withMelody.map((work) => <Fold key={work.id} label={`听${work.name}的旋律`}>{() => <MelodySet melodies={melodiesOf(work)} notationStyle={notationStyle} />}</Fold>)}
      </section>}
      {works.length > 0 && <section>
        <h3>课例</h3>
        {scope && <p className="kmap-quiet">按年级从低到高排，能看出这个知识点是怎么一步步学过来的。</p>}
        {units.map((unit) => {
          const rows = works.filter((work) => groupOf(work) === unit);
          // 全套视图里作品多，每册先收起。
          return scope && works.length > 8
            ? <div className="kmap-unit" key={unit}><Fold label={`${unit} · ${rows.length} 首`}>{() => <ul>{rows.map(workRow)}</ul>}</Fold></div>
            : <div className="kmap-unit" key={unit}><h4>{unit}</h4><ul>{rows.map(workRow)}</ul></div>;
        })}
      </section>}
      {otherBooks.length > 1 && <section>
        <h3>在哪几册学到</h3>
        <div className="kmap-books">{books.filter((item) => otherBooks.includes(item.key)).map((item) => <button type="button" key={item.key} aria-current={item.key === bookKey ? "true" : undefined} onClick={() => onRoute(item.key, node.name)}>{bookLabel(item)}</button>)}</div>
      </section>}
      {practice.length > 0 && <section>
        <h3>练一练</h3>
        <div className="kmap-practice">{practice.map((item) => <button type="button" key={item.tool} onClick={() => onTool(item.tool)}><strong>{item.label}</strong><span>{item.hint}</span></button>)}</div>
      </section>}
    </>;
  };

  const hubCard = (node: KNode) => {
    const members = points.filter((item) => item.group === node.group).sort((a, b) => Number(b.core) - Number(a.core) || b.works.length - a.works.length);
    return <>
      <header className="kmap-card-head">
        <span className={`kmap-chip hue-${GROUPS[node.group!].hue}`}>音乐要素</span>
        <h2>{node.name}</h2>
        <p>{here}有 {members.length} 个相关知识点</p>
      </header>
      {node.defs.length > 0 && <section><h3>讲解</h3><dl className="kmap-defs">{node.defs.map((def) => <div key={def.text}><dt>{def.label}</dt><dd>{def.text}</dd></div>)}</dl></section>}
      <section>
        <h3>知识点</h3>
        <ul className="kmap-members">{members.map((item) => <li key={item.id}><button type="button" onClick={() => select(item)}>{item.name}</button><small>{item.works.length ? `${item.works.length} 首作品` : "有讲解"}</small></li>)}</ul>
      </section>
    </>;
  };

  const workCard = (node: KNode) => {
    const work = map.works.get(node.id)!;
    const linked = [...(neighbours.get(node.id)?.keys() ?? [])].map((id) => nodeById.get(id)!).filter((item) => item.kind === "point");
    const melodies: Melody[] = melodiesOf(work);
    return <>
      <header className="kmap-card-head">
        <span className="kmap-chip hue-work">{work.mode ?? work.type}</span>
        <h2>{work.name}</h2>
        <p>{work.unit ?? ""}</p>
        {workActions(work)}
      </header>
      <section>
        <h3>这一课的知识点</h3>
        <div className="kmap-tags">{linked.map((item) => <button type="button" key={item.id} className={`hue-${GROUPS[item.group!].hue}`} onClick={() => select(item)}>{item.name}</button>)}</div>
      </section>
      {melodies.length > 0 && <section><h3>旋律</h3><MelodySet melodies={melodies} notationStyle={notationStyle} /></section>}
    </>;
  };

  const bookCard = (node: KNode) => {
    const key = node.books[0];
    const linked = [...(neighbours.get(node.id) ?? [])].map(([id, edge]) => ({ point: nodeById.get(id)!, count: Number(edge.label.match(/\d+/)?.[0] ?? 0) })).sort((a, b) => b.count - a.count);
    return <>
      <header className="kmap-card-head">
        <span className="kmap-chip hue-work">分册</span>
        <h2>{bookTitle(key)}</h2>
        <p>这一册用到 {linked.length} 个核心知识点</p>
        <span className="kmap-actions"><button type="button" onClick={() => onRoute(key)}>打开这一册的知识点图</button></span>
      </header>
      <section>
        <h3>知识点</h3>
        <ul className="kmap-members">{linked.map(({ point, count }) => <li key={point.id}><button type="button" onClick={() => select(point)}>{point.name}</button><small>{count} 首作品</small></li>)}</ul>
      </section>
    </>;
  };

  const top = [...corePoints].sort((a, b) => b.works.length - a.works.length).slice(0, 8);
  return <section className="lesson kmap" aria-labelledby="kmap-title">
    <header className="kmap-hero">
      <div>
        <p className="kmap-kicker">知识图谱 · 核心知识点</p>
        <h1 id="kmap-title">{title}</h1>
        <p>{scope ? `${corePoints.length} 个核心知识点，${workCount} 首作品，中间一排是分册。点一个知识点，看它在哪几册学、用哪些作品教。` : `${corePoints.length} 个核心知识点，连着 ${workCount} 首作品。点一个知识点，看讲解、谱例、音频和课例。`}</p>
      </div>
      <div className="kmap-controls">
        <label>分册<select value={bookKey} onChange={(event) => onRoute(event.target.value)}>
          {Object.entries(SCOPES).filter(([, item]) => books.some((entry) => item.test(gradeOf(entry.key)))).map(([key, item]) => <option key={key} value={key}>{item.name}</option>)}
          {books.map((item) => <option key={item.key} value={item.key}>{bookLabel(item)}</option>)}
        </select></label>
        {!scope && <label className="kmap-check"><input type="checkbox" checked={showAll} onChange={(event) => setShowAll(event.target.checked)} />显示全部 {points.length} 个知识点</label>}
        <button type="button" className="kmap-link" onClick={onFullGraph}>查看完整图谱</button>
      </div>
    </header>

    <div className={`kmap-body${selected ? " has-card" : ""}`}>
      <div className="kmap-stage" ref={stageRef}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}核心知识点图`} onClick={() => select(undefined)}>
          <defs>
            <marker id="kmap-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1 L7 4 L0 7 z" fill="#A9B6AF" /></marker>
            <marker id="kmap-arrow-on" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1 L7 4 L0 7 z" fill="#1E7A4A" /></marker>
          </defs>
          <ellipse className="kmap-disc" cx={W / 2} cy={H / 2} rx={RX + 10} ry={RY + 10} />
          <ellipse className="kmap-ring" cx={W / 2} cy={H / 2} rx={RX * 0.66} ry={RY * 0.66} />
          <g className="kmap-edges">{map.edges.filter((edge) => shownIds.has(edge.a) && shownIds.has(edge.b)).map((edge) => {
            const from = nodeById.get(edge.a)!;
            const to = nodeById.get(edge.b)!;
            const a = positions.get(edge.a)!;
            const b = positions.get(edge.b)!;
            const work = from.kind === "work" || to.kind === "work" || from.kind === "book" || to.kind === "book";
            const on = Boolean(focus && (edge.a === focus || edge.b === focus));
            // 线从圆的边上出发，箭头指向“被说明”的一头：作品 —拍号→ 三拍子，节拍 —包含→ 三拍子。
            const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            const ux = (b.x - a.x) / length;
            const uy = (b.y - a.y) / length;
            const gap = (node: KNode) => (node.kind === "hub" ? 21 : node.kind === "book" ? 15 : node.kind === "work" ? 5 : (node.core ? pointRadius(node) : 4.5) + 2);
            const x1 = a.x + ux * gap(from);
            const y1 = a.y + uy * gap(from);
            const x2 = b.x - ux * (gap(to) + 3);
            const y2 = b.y - uy * (gap(to) + 3);
            // 知识点之间的关系一直标着；作品的连线选中后才标，太多时不标（右边课例里有）。
            const toBook = from.kind === "book" || to.kind === "book";
            // 全套视图节点多：“包含”只在选中时标出来。
            const labelled = length > 46 && (toBook ? on : work ? on && !crowded : on || (!focus && !(map.whole && edge.label === "包含")));
            const angle = Math.atan2(uy, ux) * 180 / Math.PI;
            const state = on ? " is-on" : focus ? " is-off" : "";
            return <g key={`${edge.a}-${edge.b}`} className={`${work ? "to-work" : "to-point"}${state}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} markerEnd={on ? "url(#kmap-arrow-on)" : work ? undefined : "url(#kmap-arrow)"} />
              {labelled && <text transform={`translate(${(x1 + x2) / 2},${(y1 + y2) / 2}) rotate(${angle > 90 || angle < -90 ? angle + 180 : angle})`} textAnchor="middle" dy={-3}>{edge.source === "score" ? "乐谱里出现" : edge.label}</text>}
            </g>;
          })}</g>
          {shown.map((node) => {
            const at = positions.get(node.id)!;
            const state = `${node.id === selected?.id ? " is-selected" : ""}${lit(node.id) ? "" : " is-off"}${focus && lit(node.id) ? " is-lit" : ""}`;
            const handlers = { onMouseEnter: () => setHover(node.id), onMouseLeave: () => setHover(null), onClick: (event: React.MouseEvent) => { event.stopPropagation(); select(node); } };
            const key = (event: React.KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(node); } };
            if (node.kind === "hub") {
              const width = textWidth(node.name, 17) + 30;
              return <g key={node.id} className={`kmap-node is-hub hue-${GROUPS[node.group!].hue}${state}`} transform={`translate(${at.x},${at.y})`} tabIndex={0} role="button" aria-label={`音乐要素：${node.name}`} onKeyDown={key} {...handlers}>
                <rect x={-width / 2} y={-18} width={width} height={36} rx={18} />
                <text textAnchor="middle" dy="0.36em">{node.name}</text>
              </g>;
            }
            if (node.kind === "book") {
              const width = textWidth(node.name, 13) + 14;
              return <g key={node.id} className={`kmap-node is-book${state}`} transform={`translate(${at.x},${at.y})`} tabIndex={0} role="button" aria-label={`分册：${node.name}`} onKeyDown={key} {...handlers}>
                <rect x={-width / 2} y={-12} width={width} height={24} rx={5} />
                <text textAnchor="middle" dy="0.36em">{node.name}</text>
              </g>;
            }
            if (node.kind === "work") {
              const left = Boolean(focusAt && at.x < focusAt.x);
              const named = node.id === focus || (!crowded && focus && lit(node.id));
              return <g key={node.id} className={`kmap-node is-work${state}${named ? " is-named" : ""}`} transform={`translate(${at.x},${at.y})`} tabIndex={-1} aria-label={node.name} {...handlers}>
                <circle r={11} className="kmap-hit" />
                <circle r={3.6} />
                <text x={left ? -8 : 8} textAnchor={left ? "end" : "start"} dy="0.34em">{node.name}</text>
              </g>;
            }
            const radius = node.core ? pointRadius(node) : 4.5;
            return <g key={node.id} className={`kmap-node is-point hue-${GROUPS[node.group!].hue}${node.core ? "" : " is-minor"}${state}`} transform={`translate(${at.x},${at.y})`} tabIndex={0} role="button" aria-label={`知识点：${node.name}，${node.works.length} 首作品`} onKeyDown={key} {...handlers}>
              <circle r={radius} />
              <text textAnchor="middle" y={radius + 14}>{node.name}</text>
            </g>;
          })}
        </svg>
        <p className="kmap-legend"><span className="dot is-point" />知识点（圆越大，用到它的作品越多）{scope ? <><span className="square" />分册（线上的数字是这一册有几首作品用到）</> : <><span className="dot is-work" />作品</>}<span className="pill" />音乐要素</p>
      </div>

      <aside className="kmap-card" aria-live="polite" style={{ "--kmap-hue": "var(--pine)" } as CSSProperties}>
        {selected ? <>
          <button type="button" className="kmap-close" onClick={() => select(undefined)}>收起</button>
          {selected.kind === "hub" ? hubCard(selected) : selected.kind === "book" ? bookCard(selected) : selected.kind === "work" ? workCard(selected) : pointCard(selected)}
        </> : <>
          <header className="kmap-card-head"><h2>从这里开始</h2><p>{scope ? "全套教材" : "这一册"}用得最多的知识点：</p></header>
          <ul className="kmap-members">{top.map((item) => <li key={item.id}><button type="button" onClick={() => select(item)}>{item.name}</button><small>{item.works.length} 首作品</small></li>)}</ul>
          <p className="kmap-quiet">也可以直接点左边图里的圆点。线上的字是两头的关系，比如一首歌的“拍号”是二拍子。</p>
        </>}
      </aside>
    </div>
  </section>;
}
