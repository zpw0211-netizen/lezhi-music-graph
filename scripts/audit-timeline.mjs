import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const data = JSON.parse(await read("public/data/timeline.json"));
const atlas = JSON.parse(await read("public/data/atlas.json"));
const recordUnits = JSON.parse(await read("public/data/units.json"));
const supplements = JSON.parse(await read("public/data/supplement/work-years.json"));
const compileModule = async path => {
  const source = await read(path);
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
};
const [{ BOOKS, UNKNOWN, filterWorks, groupTimelineWorks, eraForYear, personDates, workHref, withPrintedPages, withSupplementalYears }, { parseRoute }] = await Promise.all([
  compileModule("app/components/timeline/timelineModel.ts"),
  compileModule("app/lib/app/routing.ts"),
]);
const books = new Map(await Promise.all(Object.keys(BOOKS).map(async key => [key, JSON.parse(await read(`public/data/books/${key}.json`))])));
const recordWorks = new Map(recordUnits.flatMap(unit => unit.works.map(work => [`${unit.bookKey}:${work.id}`, work])));

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
assert.equal(atlas.summary.totalWorks, data.works.length, "年表与 Atlas 的原始作品数应一致");
assert.equal(atlasById.size, data.works.length, "Atlas 页码来源必须覆盖全部年表作品");

const withYears = withSupplementalYears(data, supplements);
const enriched = withPrintedPages(withYears, atlas);
const enrichedById = new Map(enriched.works.map(work => [work.id, work]));
const supplementById = new Map(supplements.map(row => [row.id, row]));
const eligibleSupplementRows = supplements.filter(row => row.status === "found" && ["high", "medium"].includes(row.confidence) && row.yearRange && row.yearText);
let textbookDated = 0;
let supplemented = 0;
let undated = 0;
let withPrintedPage = 0;
let linkedWorks = 0;
let plainTextWorks = 0;
for (const work of data.works) {
  const book = books.get(work.bookKey);
  assert(book, `作品册别无效 ${work.id}`);
  assert(book.entities.some(entity => entity.id === work.id && entity.name === work.name), `作品名称/编号与源数据不符 ${work.id}`);
  const resolved = enrichedById.get(work.id);
  assert.equal(resolved.printedPage, atlasById.get(work.id)?.printedPage ?? null, `printedPage 未按 DS1 数据接入 ${work.id}`);
  if (resolved.printedPage != null) withPrintedPage += 1;

  const bareName = work.name.replace(/^《|》$/g, "");
  const href = workHref(resolved);
  const recordWork = recordWorks.get(`${work.bookKey}:${work.id}`);
  assert.equal(Boolean(work.unit), Boolean(recordWork), `单元归属与 records 目录不一致 ${work.id}`);
  if (recordWork) {
    linkedWorks += 1;
    assert.equal(recordWork.name, work.name, `records 目录作品名称不符 ${work.id}`);
    assert.equal(typeof href, "string", `目录内作品缺少年表链接 ${work.id}`);
    assert.deepEqual(parseRoute(href), { view: "records", book: work.bookKey, work: bareName }, `作品链接未解析到正确册别与作品 ${work.id}`);
  } else {
    plainTextWorks += 1;
    assert.equal(href, null, `单元外作品不应生成链接 ${work.id}`);
  }

  if (work.yearRange) {
    textbookDated += 1;
    assert.equal(resolved.yearSource, "textbook", `教材年代来源标记错误 ${work.id}`);
    assert(work.yearEvidence && work.yearText, `年代缺少原文/证据 ${work.id}`);
    const triple = book.triples.find(triple => triple.id === work.yearEvidence.tripleId);
    assert(triple?.subject === work.id, `年代证据不属于作品 ${work.id}`);
    const original = triple.literal ?? book.entities.find(entity => entity.id === triple.objectId)?.name;
    assert.equal(work.yearText, original, `年代原文遭改写 ${work.id}`);
    assert.equal(work.yearEvidence.relation, triple.predicate);
    assert(book.evidenceByTriple[triple.id]?.length, `教材来源缺失 ${work.id}`);
  } else {
    const supplement = supplementById.get(work.id);
    const shouldSupplement = supplement?.status === "found" && ["high", "medium"].includes(supplement.confidence) && supplement.yearRange && supplement.yearText;
    if (shouldSupplement) {
      supplemented += 1;
      assert.equal(resolved.yearSource, "supplement", `补充年代来源标记错误 ${work.id}`);
      assert.deepEqual(resolved.yearRange, supplement.yearRange, `补充年代范围不符 ${work.id}`);
      assert.equal(resolved.yearText, supplement.yearText, `补充年代原文不符 ${work.id}`);
      assert.equal(resolved.yearEvidence, null, `补充年代不能冒充教材证据 ${work.id}`);
      assert.equal(resolved.supplement.label, "补充资料（非教材）", `补充年代页面标签错误 ${work.id}`);
      assert(supplement.sources.length > 0, `補充年代缺少出处 ${work.id}`);
    } else {
      undated += 1;
      assert.equal(resolved.yearRange, null, `低可信度、未找到或缺少范围的年代不应展示 ${work.id}`);
      assert.equal(resolved.yearSource, undefined, `未通过筛选的补充年代不应带来源标记 ${work.id}`);
    }
  }
}
assert.equal(data.works.length, 362, "源数据作品记录仍为 362 条；界面年代条目会因合格补充资料增加");
assert.equal(textbookDated, 36, "教材原文年代条目应保持为 36 条");
assert.equal(supplemented, eligibleSupplementRows.length, "每条合格补充年代都应进入年表");
assert.equal(textbookDated + supplemented + undated, data.works.length, "教材年代、补充年代与未标注年代应覆盖每条源记录");
assert.equal(linkedWorks, 212, "records 目录内作品链接数量应为 212");
assert.equal(plainTextWorks, 150, "单元外作品纯文字数量应为 150");

const groups = groupTimelineWorks(enriched.works);
const groupedRecords = groups.flatMap(group => group.works.flatMap(work => work.records));
assert.equal(groupedRecords.length, enriched.works.length, "年代分组必须保留每条教材作品记录");
assert.equal(new Set(groupedRecords.map(work => `${work.bookKey}:${work.id}`)).size, enriched.works.length, "年表条目不能重复或漏掉源记录");
assert.equal(groups.at(-1).label, UNKNOWN, "未标注年代作品应位于长卷末尾");
assert.deepEqual(new Set(groups.at(-1).works.flatMap(work => work.records.map(record => record.id))), new Set(enriched.works.filter(work => !work.yearRange).map(work => work.id)));
for (const group of groups) {
  for (const item of group.works) {
    assert.equal(new Set(item.records.map(work => work.name.replace(/^《|》$/g, ""))).size, 1, `同一年代的同名作品未合并 ${item.name}`);
    assert.deepEqual(new Set(item.bookKeys), new Set(item.records.map(work => work.bookKey)), `合并条目册别不完整 ${item.name}`);
    if (!group.undated) assert.equal(group.id, eraForYear(item.yearRange[0]).id, `作品分入错误年代 ${item.name}`);
  }
}
const mergeFixture = groupTimelineWorks([
  { ...enriched.works[0], id: "merge-a", name: "《同名合并》", bookKey: "g7s1", yearRange: [1951, 1951], yearText: "1951年" },
  { ...enriched.works[0], id: "merge-b", name: "《同名合并》", bookKey: "g8s1", yearRange: [1958, 1958], yearText: "1958年" },
  { ...enriched.works[0], id: "separate-era", name: "《同名合并》", bookKey: "g9s1", yearRange: [1961, 1961], yearText: "1961年" },
]);
assert.equal(mergeFixture.length, 2, "跨年代的同名作品不能错误合并");
assert.equal(mergeFixture[0].works.length, 1, "同一年代内的同名作品应合并为一条");
assert.deepEqual(mergeFixture[0].works[0].bookKeys, ["g7s1", "g8s1"], "同名合并条目应显示全部册别");

for (const key of Object.keys(BOOKS)) assert(filterWorks(enriched, key, "").every(work => work.bookKey === key));
assert.equal(filterWorks(enriched, "", "不存在的作品 T034").length, 0);
assert(filterWorks(enriched, "g7s1", "《军队进行曲》").some(work => work.yearText === "1822年前后"));
assert(filterWorks(enriched, "", "夏夜圆舞曲").some(work => work.yearText === "20世纪50年代" && work.yearSource === "textbook"));

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
assert(page.includes('loadJson<TimelineData>("timeline.json")'), "年表未按需读取正式数据");
assert(page.includes("loadYearSupplement()"), "补充年代未通过 yearSupplement.ts 加载");
assert(page.includes("withSupplementalYears(timeline, supplements)"), "补充年代未按状态与可信度筛选");
assert(page.includes("TIMELINE_HORIZONTAL_KEY"), "作品跳转未保存年表横向位置");
assert(page.includes("TIMELINE_VERTICAL_KEY"), "手机作品跳转未保留纵向位置恢复");
assert(page.includes("補充资料（非教材）") || page.includes("补充资料（非教材）"), "补充资料缺少非教材标签");
assert(page.includes('const href = workHref(record);'), "史料笺未保留逐条 records 详情链接");
assert(page.includes("EvidenceFile"), "教材年代来源未保留证据数组结构");
assert(!/addEventListener\(["']scroll/.test(page), "年表出现 scroll 事件监听");
const css = await read("app/timeline.css");
assert(css.includes("prefers-reduced-motion") && css.includes("overflow-x: auto"));
assert(css.includes("--timeline-band-height") && css.includes("var(--timeline-tier)"), "长卷高度公式或三层垂签缺失");
assert(css.includes("animation-timeline: view(x)"), "横向渐隐渐出未使用滚动驱动动画");
assert(css.includes(".timeline-note.is-supplement") && css.includes("--azure"), "补充资料史料笺未使用石青标识");
console.log(`TIMELINE_AUDIT_PASSED works=${data.works.length} textbookDated=${textbookDated} supplemented=${supplemented} undated=${undated} linked=${linkedWorks} plainText=${plainTextWorks} people=${data.people.length} groups=${groups.length} cards=${groups.reduce((total, group) => total + group.works.length, 0)} printedPages=${withPrintedPage} originalYears=preserved links=parsed`);
