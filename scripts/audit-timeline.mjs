import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const data = JSON.parse(await read("public/data/timeline.json"));
const atlas = JSON.parse(await read("public/data/atlas.json"));
const compileModule = async path => {
  const source = await read(path);
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
};
const [{ BOOKS, UNKNOWN, filterWorks, groupWorks, personDates, workHref, withPrintedPages }, { parseRoute }] = await Promise.all([
  compileModule("app/components/timeline/timelineModel.ts"),
  compileModule("app/lib/app/routing.ts"),
]);
const books = new Map(await Promise.all(Object.keys(BOOKS).map(async key => [key, JSON.parse(await read(`public/data/books/${key}.json`))])));

const atlasWorks = [...atlas.regions.flatMap(region => region.works), ...atlas.unassignedWorks];
const atlasById = new Map();
for (const work of atlasWorks) {
  assert(Number.isInteger(work.printedPage) || work.printedPage == null, `printedPage 格式无效 ${work.id}`);
  assert(work.printedPage == null || work.printedPage > 0, `printedPage 必须为正数 ${work.id}`);
  const previous = atlasById.get(work.id);
  if (previous) {
    assert.equal(previous.name, work.name, `Atlas 重复作品名称不一致 ${work.id}`);
    assert.equal(previous.bookKey, work.bookKey, `Atlas 重复作品册别不一致 ${work.id}`);
    if (previous.printedPage != null && work.printedPage != null) {
      assert.equal(previous.printedPage, work.printedPage, `Atlas 重复作品页码不一致 ${work.id}`);
    }
  }
  if (!previous || work.printedPage != null) atlasById.set(work.id, work);
}
assert.equal(data.works.length, 362, "年表作品数量应保持为 362");
assert.equal(atlas.summary.totalWorks, data.works.length, "年表与 Atlas 的作品数应一致");
assert.equal(atlasById.size, data.works.length, "Atlas 页码来源必须覆盖全部年表作品");

const enriched = withPrintedPages(data, atlas);
const enrichedById = new Map(enriched.works.map(work => [work.id, work]));
let dated = 0;
let withPrintedPage = 0;
for (const work of data.works) {
  const book = books.get(work.bookKey);
  assert(book, `作品册别无效 ${work.id}`);
  assert(book.entities.some(entity => entity.id === work.id && entity.name === work.name), `作品名称/编号与源数据不符 ${work.id}`);
  const resolved = enrichedById.get(work.id);
  assert.equal(resolved.printedPage, atlasById.get(work.id)?.printedPage ?? null, `printedPage 未按 DS1 数据接入 ${work.id}`);
  if (resolved.printedPage != null) withPrintedPage += 1;

  const route = parseRoute(workHref(work));
  const bareName = work.name.replace(/^《|》$/g, "");
  const expectedRoute = BOOKS[work.bookKey]
    ? { view: "records", book: work.bookKey, work: bareName }
    : { view: "lesson", work: bareName };
  assert.deepEqual(route, expectedRoute, `作品链接未解析到正确册别与作品 ${work.id}`);

  if (!work.yearRange) continue;
  dated += 1;
  assert(work.yearEvidence && work.yearText, `年代缺少原文/证据 ${work.id}`);
  const triple = book.triples.find(triple => triple.id === work.yearEvidence.tripleId);
  assert(triple?.subject === work.id, `年代证据不属于作品 ${work.id}`);
  const original = triple.literal ?? book.entities.find(entity => entity.id === triple.objectId)?.name;
  assert.equal(work.yearText, original, `年代原文遭改写 ${work.id}`);
  assert.equal(work.yearEvidence.relation, triple.predicate);
  assert(book.evidenceByTriple[triple.id]?.length, `教材来源缺失 ${work.id}`);
}
assert.equal(dated, 36, "标有年代的作品数量应保持为 36");

const groups = groupWorks(data.works);
assert.equal(groups.flatMap(group => group.works).length, data.works.length);
assert.equal(groups.length, 13, "年代分组应保持为 13 组");
assert.equal(groups.at(-1).label, UNKNOWN);
assert.deepEqual(new Set(groups.at(-1).works.map(work => work.id)), new Set(data.works.filter(work => !work.yearRange).map(work => work.id)));
assert.equal(data.works.length - dated, 326, "未标注年代作品数量应保持为 326");
let previous = -Infinity;
for (const work of groups.flatMap(group => group.works)) {
  const start = work.yearRange?.[0] ?? Infinity;
  assert(start >= previous, `年代范围排序倒置 ${work.id}`);
  previous = start;
}
for (const key of Object.keys(BOOKS)) assert(filterWorks(data, key, "").every(work => work.bookKey === key));
assert.equal(filterWorks(data, "", "不存在的作品 T025").length, 0);
assert(filterWorks(data, "g7s1", "《军队进行曲》").some(work => work.yearText === "1822年前后"));
assert(filterWorks(data, "", "夏夜圆舞曲").some(work => work.yearText === "20世纪50年代"));
const fixture = { ...data.works[0], id: "fixture", name: "《同名》", yearRange: null, yearText: null, yearEvidence: null };
assert.notEqual(workHref({ ...fixture, bookKey: "g7s1" }), workHref({ ...fixture, bookKey: "g8s1" }));
assert.equal(workHref({ ...fixture, bookKey: "" }), `#/lesson/${encodeURIComponent("同名")}`);

assert.equal(data.people.length, 122, "相关人物数量应保持为 122");
const emptyPerson = { lifetimeEvidence: [], lifetimeText: [], bornRange: null, diedRange: null };
assert.equal(personDates(emptyPerson), UNKNOWN);
for (const person of data.people) {
  assert(person.works.every(id => data.works.some(work => work.id === id)), `人物相关作品失联 ${person.name}`);
  const dateTriples = person.sourceEntities.flatMap(source => {
    const book = books.get(source.bookKey);
    assert(book.entities.some(entity => entity.id === source.id && entity.name === person.name), `人物来源不符 ${person.name}`);
    return book.triples.filter(triple => triple.subject === source.id && /^(生卒年|出生年|出生时间|生年|卒年|逝世年|去世年|去世时间)$/.test(triple.predicate))
      .map(triple => ({ triple, text: triple.literal ?? book.entities.find(entity => entity.id === triple.objectId)?.name }));
  });
  for (const evidence of person.lifetimeEvidence ?? []) {
    const book = books.get(evidence.bookKey);
    const triple = book.triples.find(candidate => candidate.id === evidence.tripleId);
    assert(triple && dateTriples.some(row => row.triple.id === triple.id), `人物年代证据编号无效 ${person.name}`);
    assert(dateTriples.some(row => row.triple.id === triple.id && row.text === evidence.text), `人物年代原文不符 ${person.name}`);
  }
  assert(person.lifetimeText.every(text => dateTriples.some(row => row.text === text)), `人物年代原文不符 ${person.name}`);
  assert.equal(personDates(person), [...new Set((person.lifetimeEvidence ?? []).map(evidence => evidence.text).filter(Boolean))].join("；") || UNKNOWN);
  if (person.bornRange || person.diedRange) assert(dateTriples.length, `人物年代无来源 ${person.name}`);
}

const page = await read("app/components/timeline/TimelinePage.tsx");
assert(page.includes('loadJson<TimelineData>("timeline.json")'), "年表未按需读取独立数据");
assert(page.includes('loadJson<AtlasTimelineData>("atlas.json")'), "作品印刷页码未读取 DS1 Atlas 数据");
assert(page.includes("work.printedPage != null"), "作品缺失页码时未省略页码文本");
assert(page.includes("Evidence[]"), "证据数组结构未保留");
assert(!/addEventListener\(["']scroll/.test(page), "年表出现 scroll 监听");
const css = await read("app/timeline.css");
assert(css.includes("prefers-reduced-motion") && css.includes("overflow-x: auto"));
console.log(`TIMELINE_AUDIT_PASSED works=${data.works.length} dated=${dated} undated=${data.works.length - dated} people=${data.people.length} groups=${groups.length} printedPages=${withPrintedPage} rawYears=preserved evidence=sourceMatched routes=parsed`);
