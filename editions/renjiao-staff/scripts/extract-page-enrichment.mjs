// Build page-cited knowledge relationships from the extracted text layer of the
// 14 local 人教版 PDFs. The output contains normalized entities and fact tuples,
// not copied page text. Set PEP_TEXT_EXTRACTION_DIR to the extraction folder.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { factsForItem } from "../data/lesson-facts.mjs";
import { knowledgeForUnit } from "../data/unit-knowledge.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const EDITION = path.join(ROOT, "editions", "renjiao");
const TEXT_DIR = process.env.PEP_TEXT_EXTRACTION_DIR;
if (!TEXT_DIR) throw new Error("Set PEP_TEXT_EXTRACTION_DIR to the 14-book page-text extraction folder.");

const registry = JSON.parse(readFileSync(path.join(EDITION, "data", "books.json"), "utf8"));
const humanGraph = JSON.parse(readFileSync(path.join(ROOT, "public", "data", "canonical-graph.json"), "utf8"));
const output = {};
const WORK_TYPES = new Set(["音乐作品", "歌曲", "民歌", "器乐曲", "戏曲歌曲", "戏曲选段", "舞蹈音乐", "影视音乐", "交响作品", "合唱作品", "歌剧音乐", "音乐剧", "进行曲", "朗诵作品"]);
const TERM_PREDICATES = {
  音乐概念: "涉及概念", 音乐体裁: "音乐体裁", 乐器: "演奏乐器", 地域: "地域", 民族: "所属民族",
  音乐风格: "音乐风格", 表演形式: "表演形式", 拍号: "拍号", 调性: "调性", 节奏型: "节奏型",
  速度术语: "速度", 主题与情感: "表现情感", 历史事件: "历史背景", 声部: "演唱声部",
};
const TERM_TYPES = new Set(Object.keys(TERM_PREDICATES));
const GENERIC_TERMS = new Set(["人教版", "人民教育出版社", "课程教材研究所", "教材", "单元", "作品", "音乐作品", "艺术", "学校", "教师"]);
const PERSON_AMBIGUOUS = new Set(["东方", "江山", "中国", "世界", "少年", "人民", "春天", "快乐", "月亮", "小九"]);
// 文本层里栏目名、速度术语、上一首的曲名粘在人名前面被当成作者（如“让我们来听一听 作曲”“小兔子乖乖黎锦晖”），逐个排除。
const PERSON_NOT_NAMES = new Set(["小兔子乖乖黎锦晖","英国儿歌杨世明","哈哈新疆民歌石夫","美国童谣汪爱丽","强渐弱春游李叔同","你知道","稍慢抒情地陈其钢","同时期的还有一位","了解一位你喜欢的","产陇东民歌张寒晖","主题歌张千一","莉花江苏民歌何仿","科学校随黄自学习","培养专业","皖革命民歌李焕之","吴大叔帮潘冬子","家东方之珠罗大佑","根据台湾童谣","自上古时期","俄罗斯浪漫乐派","成长训练营贺绿汀","选段张寒晖","让我们来听一听","后期俄罗斯代表性","想你了解人工智能","你认为人工智能","主题歌王立平","家通过复杂细致的","我们来听听","由匈牙利","意大利","悠远地张千一"]);
const PERSON_CUE = /作曲家|作词家|音乐家|歌唱家|演唱家|演奏家|钢琴家|指挥家|艺术家|词曲作者|作曲|作词|词曲|译配|填词|编曲|整理者|记录者|代表作品|生卒|国籍|（(?:18|19|20)\d{2}/u;
const PERSON_NAME_NOISE = /作词|作曲|词曲|歌曲|歌唱|编创|前奏|后奏|音乐|乐理|第[一二三四五六七八九十]|一说|老师|同学|选自|编写|编者|课程|教育|出版社|活动|作品|演唱|演奏|乐队|合唱|齐唱|曲|词/u;
const isPersonName = (value) => {
  const name = String(value ?? "").trim();
  return /^[\p{Script=Han}·]{2,8}$/u.test(name) && !PERSON_NAME_NOISE.test(name) && !PERSON_AMBIGUOUS.has(name) && !PERSON_NOT_NAMES.has(name);
};
const TASK_RULES = [
  ["聆听辨析", "聆听并比较作品的音乐特点", /聆听|听一听|听范唱|欣赏|听音乐|辨认|比较|感受|判断/u],
  ["演唱演奏", "通过演唱、演奏或伴奏表现音乐", /演唱|学唱|唱一唱|齐唱|合唱|演奏|齐奏|合奏|伴奏|敲一敲|弹一弹/u],
  ["节奏识谱", "识读节奏或乐谱并进行练习", /节奏|识谱|读谱|音符|休止符|拍一拍|读一读|唱名|音高/u],
  ["编创表演", "创编音乐材料并进行动作或情境表演", /编创|创编|设计|表演|动作|舞蹈|情境/u],
  ["交流评价", "表达听赏感受并交流评价", /说一说|讨论|交流|分享|评价|写一写|谈一谈/u],
];
const creditPatterns = [
  { regex: /([\p{Script=Han}·]{2,8})\s*(词曲|作词|填词|译配|作曲|谱曲|编曲|整理者|整理|记谱|记录者)/gu, nameGroup: 1, roleGroup: 2 },
  { regex: /(词曲作者|词曲|作词|填词|译配|作曲|谱曲|编曲|整理者|整理|记谱|记录者|词|曲)[:：]\s*([\p{Script=Han}·]{2,8})/gu, nameGroup: 2, roleGroup: 1 },
];
const roleNames = { 词曲: "词曲作者", 作词: "作词", 词: "作词", 填词: "填词", 译配: "译配", 作曲: "作曲", 曲: "作曲", 谱曲: "作曲", 编曲: "编曲", 整理者: "整理者", 整理: "整理者", 记谱: "记谱", 记录者: "记录者", 词曲作者: "词曲作者" };
const LITERARY_SOURCES = new Set(["论语·八佾", "诗经·小雅·采薇", "礼记·乐记", "国语·郑语"]);

function displayTitle(value) {
  return String(value).normalize("NFKC")
    .replace(/(?<=[\p{Script=Han}])\s+[^\s\p{Script=Han}][\p{L}\p{M}·'’-]*(?=\s*[\p{Script=Han}])/gu, "")
    .replace(/(?<=[\p{Script=Han}])\s+[^\s\p{Script=Han}][\p{L}\p{M}·'’-]*$/gu, "")
    .replace(/(?<=[\p{Script=Han}])\s+[\p{Script=Latin}][\p{Script=Latin}\p{M}·'’-]*$/gu, "")
    .replace(/(?<=[\p{Script=Han}])\s+(?=[\p{Script=Han}])/gu, "")
    .replace(/\s+/gu, " ").replace(/,/gu, "，").trim();
}

function titleKey(value) {
  return displayTitle(value).replace(/[《》“”‘’\s]/gu, "").toLocaleLowerCase("zh-CN");
}

function inferWorkType(name, context) {
  const text = `${name} ${context}`;
  if (/音乐剧/u.test(context)) return "音乐剧";
  if (/歌剧/u.test(context)) return "歌剧音乐";
  if (/舞剧|芭蕾舞剧|歌舞剧/u.test(context)) return "舞蹈音乐";
  if (/进行曲/u.test(name)) return "进行曲";
  if (/圆舞曲|舞曲|舞蹈/u.test(name)) return "舞蹈音乐";
  if (/交响|管弦乐/u.test(name)) return "交响作品";
  if (/协奏曲|奏鸣曲|序曲|组曲|器乐曲/u.test(name)) return "器乐曲";
  if (/作词|填词|词曲(?:作者)?/u.test(context)) return "歌曲";
  if (/独唱|齐唱|对唱|合唱|童谣|儿歌|学唱|演唱|歌词|歌曲|歌唱/u.test(context)) return "歌曲";
  if (/器乐|乐曲|管弦|协奏|奏鸣|钢琴曲|演奏|齐奏|合奏|独奏/u.test(context)) return "器乐曲";
  if (/京剧|豫剧|黄梅戏|昆曲|越剧|戏曲选段|华阴老腔|老腔|秦腔/u.test(context)) return "戏曲选段";
  if (/民歌|山歌|号子|民谣/u.test(text)) return "民歌";
  return "音乐作品";
}

function localWorkContext(pageText, start, end) {
  const left = pageText.slice(Math.max(0, start - 90), start);
  const right = pageText.slice(end, Math.min(pageText.length, end + 115));
  const priorTitle = left.lastIndexOf("》");
  const priorStop = Math.max(left.lastIndexOf("。"), left.lastIndexOf("！"), left.lastIndexOf("？"), left.lastIndexOf("；"), priorTitle);
  const nextTitle = right.indexOf("《");
  const nextStop = [right.indexOf("。"), right.indexOf("！"), right.indexOf("？"), right.indexOf("；"), nextTitle].filter((value) => value >= 0).sort((a, b) => a - b)[0];
  const prefix = left.slice(priorStop + 1).trim();
  let suffix = (nextStop == null ? right : right.slice(0, nextStop)).trim();
  if (nextTitle >= 0 && /^(?:(?:花腔)?(?:女高音|男高音|女中音|男中音|女低音|男低音|女声|男声|童声)?(?:独唱|合唱|齐唱|重唱|对唱|轮唱|齐奏|合奏|独奏)|京剧|豫剧|黄梅戏|昆曲|越剧|华阴老腔|秦腔)\s*$/u.test(suffix)) suffix = "";
  return { prefix, suffix, combined: `${prefix} ${suffix}`.trim() };
}

function referenceKind(name, context) {
  if (LITERARY_SOURCES.has(name) || /^(?:论语|诗经|礼记|国语|尚书|周易|左传)[·：]/u.test(name)) return { type: "典籍", predicate: "引用典籍" };
  if (/(?:日报|早报|晚报|时报|周刊|杂志)$/u.test(name) && /文章|节选自|报道|摘自|刊载/u.test(context)) return { type: "出版物", predicate: "文章来源" };
  return null;
}

function isLikelyMusicTitle(name, context, knownWork) {
  if (knownWork) return true;
  if (/(?:歌|曲|舞曲|進行曲|进行曲|序曲|組曲|组曲|交響|交响|協奏|协奏|奏鳴|奏鸣|小夜曲|幻想曲|夜曲|變奏曲|变奏曲)$/u.test(name)) return true;
  return /歌曲|歌谣|歌謠|民歌|山歌|号子|號子|戏曲|戲曲|唱段|乐曲|樂曲|音乐作品|音樂作品|作品赏析|作品賞析|聆听|聆聽|欣赏|欣賞|听赏|聽賞|演唱|学唱|獨唱|独唱|合唱|齐唱|齊唱|对唱|對唱|演奏|齐奏|齊奏|合奏|器乐|器樂|伴奏|选段|選段|主题曲|主題曲|插曲|歌剧|歌劇|舞剧|舞劇|音乐剧|音樂劇|华阴老腔|老腔|秦腔|管弦|乐队|樂隊|作词|作曲|词曲|词[,，）)]|曲[,，）)]/u.test(context);
}

function predicateForTerm(type) {
  return TERM_PREDICATES[type] ?? "涉及概念";
}

function addTuple(target, tuple) {
  const [predicate, value, type, layer, page] = tuple;
  const key = `${predicate}|${value}|${type ?? ""}|${page}`;
  if (!target._factKeys) target._factKeys = new Set();
  if (target._factKeys.has(key)) return;
  target._factKeys.add(key);
  target.facts.push(tuple);
}

function addToMap(map, key, create) {
  if (!map.has(key)) map.set(key, create());
  return map.get(key);
}

const TYPE_PRIORITY = ["声部", "音乐概念", "音乐体裁", "拍号", "调性", "节奏型", "速度术语", "表演形式", "乐器", "民族", "地域", "音乐风格", "主题与情感", "历史事件"];
const termByName = new Map();
for (const entity of humanGraph.entities) {
  if (!TERM_TYPES.has(entity.type) || entity.name.length < 2 || GENERIC_TERMS.has(entity.name) || /[《》“”]/u.test(entity.name)) continue;
  const current = termByName.get(entity.name);
  if (!current || TYPE_PRIORITY.indexOf(entity.type) < TYPE_PRIORITY.indexOf(current.type)) termByName.set(entity.name, { name: entity.name, type: entity.type });
}
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
for (const name of ["花腔女高音", "女高音", "男高音", "女中音", "男中音", "女低音", "男低音", "童声", "女声", "男声"]) {
  termByName.set(name, { name, type: "声部" });
}
const termsWithVoices = [...termByName.values()].sort((a, b) => b.name.length - a.name.length || a.name.localeCompare(b.name, "zh"));
const globalPersonNames = [...new Set(humanGraph.entities.filter((entity) => entity.type === "人物").map((entity) => entity.name))]
  .filter(isPersonName)
  .sort((a, b) => b.length - a.length);

for (const bookInfo of registry.books.filter((book) => book.published)) {
  const key = bookInfo.key;
  const pages = JSON.parse(readFileSync(path.join(TEXT_DIR, `${key}.json`), "utf8"));
  const sourceUrl = pathToFileURL(path.join(EDITION, "content", "textbooks", `${key}.mjs`)).href + `?page-enrichment=${Date.now()}`;
  const sourceModule = await import(sourceUrl);
  const source = sourceModule.BASE_SOURCE ?? sourceModule.default;
  const parts = source.parts ?? [source];
  const units = parts.flatMap((part) => part.units ?? []).sort((a, b) => a.page - b.page);
  const sourceWorks = parts.flatMap((part) => part.works ?? []);
  const bookTerms = new Map(termsWithVoices.map((term) => [term.name, term]));
  const localPersonNames = new Set(globalPersonNames);
  for (const work of sourceWorks) {
    for (const fact of [...(work.facts ?? []), ...factsForItem(key, work.name)]) {
      const [, value, type] = fact;
      if (TERM_TYPES.has(type) && typeof value === "string") {
        const name = displayTitle(value);
        if (name.length >= 2 && !GENERIC_TERMS.has(name)) bookTerms.set(name, { name, type });
      }
      if (type === "人物" && typeof value === "string") localPersonNames.add(value.trim());
    }
  }
  for (const unit of units) {
    for (const point of [...(unit.knowledgePoints ?? []), ...(knowledgeForUnit(key, unit.no).knowledgePoints ?? [])]) {
      if (TERM_TYPES.has(point.type)) {
        const name = displayTitle(point.name);
        if (name.length >= 2 && !GENERIC_TERMS.has(name)) bookTerms.set(name, { name, type: point.type });
      }
      if (point.type === "人物") localPersonNames.add(point.name);
    }
  }
  const matchedTerms = [...bookTerms.values()].sort((a, b) => b.name.length - a.name.length || a.name.localeCompare(b.name, "zh"));
  const termByMatchedName = new Map(matchedTerms.map((term) => [term.name, term]));
  const termMatcher = new RegExp(matchedTerms.map((term) => escapeRegExp(term.name)).join("|") || "(?!)", "gu");
  const personNames = [...localPersonNames].filter(isPersonName).sort((a, b) => b.length - a.length);
  const personMatcher = new RegExp(personNames.map(escapeRegExp).join("|") || "(?!)", "gu");
  const sourceByUnit = new Map();
  const sourceByName = new Map();
  for (const work of sourceWorks) {
    const normal = titleKey(work.name);
    const byUnit = addToMap(sourceByUnit, `${work.unit}|${normal}`, () => []);
    byUnit.push(work);
    if (!sourceByName.has(normal)) sourceByName.set(normal, work);
  }
  const unitForPage = (page) => [...units].reverse().find((unit) => unit.page <= page)?.no ?? units[0]?.no ?? 1;
  const workGroups = new Map();
  const unitConcepts = new Map();
  const people = new Map();
  const references = new Map();
  const tasks = new Map();
  const titleOccurrences = [];
  const termCounts = new Map();
  const facts = { creatorFacts: 0, performanceFacts: 0, termFactsOnWorks: 0, scoreFacts: 0 };

  const findNearestTitle = (titleOccs, index) => titleOccs.reduce((best, occ) => {
    const distance = index < occ.start ? occ.start - index : index > occ.end ? index - occ.end : 0;
    return !best || distance < best.distance ? { ...occ, distance } : best;
  }, null);

  for (const pageData of pages.pages) {
    const page = pageData.page;
    const pageText = pageData.text.normalize("NFKC").replace(/(?<=[\p{Script=Han}])\s+(?=[\p{Script=Han}])/gu, "");
    const unit = unitForPage(page);
    const titleOccs = [];
    for (const work of sourceWorks.filter((item) => item.page === page && WORK_TYPES.has(item.type))) {
      const normal = titleKey(work.name);
      let start = pageText.indexOf(displayTitle(work.name));
      if (start < 0) start = pageText.indexOf(String(work.name).replace(/[《》\s]/gu, ""));
      if (start < 0) continue;
      const end = start + displayTitle(work.name).length;
      const groupKey = `${work.unit}|${normal}`;
      const group = addToMap(workGroups, groupKey, () => ({ name: work.name, type: work.type, unit: work.unit, page, facts: [], _factKeys: new Set(), _existingInUnit: true }));
      const prior = localWorkContext(pageText, start, end);
      const inferred = inferWorkType(work.name, prior.combined);
      if (inferred !== "音乐作品") group.type = inferred;
      titleOccs.push({ name: work.name, normal, type: group.type, unit: work.unit, page, start, end, raw: work.name });
    }
    for (const match of pageText.matchAll(/《([^》]{1,80})》/gu)) {
      const raw = match[1].trim();
      const name = displayTitle(raw);
      const normal = titleKey(name);
      if (!normal || name.length < 2) continue;
      const start = match.index ?? 0;
      const end = start + match[0].length;
      const context = localWorkContext(pageText, start, end);
      const unitNo = unitForPage(page);
      const reference = referenceKind(name, `${context.prefix} ${context.suffix}`);
      if (reference) {
        const referenceKey = `${unitNo}|${reference.type}|${name}`;
        if (!references.has(referenceKey)) references.set(referenceKey, { name, type: reference.type, predicate: reference.predicate, unit: unitNo, page });
        continue;
      }
      const sameUnit = sourceByUnit.get(`${unitNo}|${normal}`) ?? [];
      const known = sameUnit.find((work) => WORK_TYPES.has(work.type)) ?? sourceByName.get(normal);
      const knownNonWork = sameUnit.length > 0 && !sameUnit.some((work) => WORK_TYPES.has(work.type));
      if (knownNonWork && !known) continue;
      if (!isLikelyMusicTitle(name, `${context.prefix} ${context.suffix}`, known)) continue;
      const canonicalName = known?.name ?? name;
      const inferredType = inferWorkType(name, context.combined);
      const type = known && WORK_TYPES.has(known.type) && inferredType === "音乐作品" ? known.type : inferredType;
      const groupKey = `${unitNo}|${titleKey(canonicalName)}`;
      const group = addToMap(workGroups, groupKey, () => ({
        name: canonicalName, type, unit: unitNo, page, facts: [], _factKeys: new Set(), _existingInUnit: sameUnit.some((work) => WORK_TYPES.has(work.type)),
      }));
      if (inferredType !== "音乐作品") group.type = inferredType;
      group.page = Math.min(group.page, page);
      const occ = { name: canonicalName, normal: titleKey(canonicalName), type, unit: unitNo, page, start, end, raw };
      if (!titleOccs.some((item) => item.normal === occ.normal && item.start === occ.start)) titleOccs.push(occ);
      titleOccurrences.push(occ);

      const prefix = context.prefix;
      const form = prefix.match(/((?:花腔)?(?:女高音|男高音|女中音|男中音|女低音|男低音|女声|男声|童声)?(?:独唱|合唱|齐唱|重唱|对唱|轮唱|齐奏|合奏|独奏))/u)?.[1];
      if (form) {
        const playForm = form.match(/独唱|合唱|齐唱|重唱|对唱|轮唱|齐奏|合奏|独奏/u)?.[0];
        if (playForm) { addTuple(group, ["表演形式", playForm, "表演形式", "明", page]); facts.performanceFacts += 1; }
        const voice = form.replace(/独唱|合唱|齐唱|重唱|对唱|轮唱|齐奏|合奏|独奏/u, "");
        if (voice) { addTuple(group, ["演唱声部", voice, "声部", "明", page]); facts.performanceFacts += 1; }
      }

      const adjacentContext = pageText.slice(Math.max(0, start - 80), Math.min(pageText.length, end + 110));
      const keySignature = adjacentContext.match(/1\s*[=＝]\s*[A-G](?:[♭♯b#])?/u)?.[0]?.replace(/\s+/gu, "");
      if (keySignature) { addTuple(group, ["调号", keySignature, "调性", "谱", page]); facts.scoreFacts += 1; }
      const meter = adjacentContext.match(/(?:每小节(?:有)?[一二三四五六]拍|[234]\s*\/\s*[248]|四二拍|四三拍|四四拍|八三拍)/u)?.[0];
      if (meter) { addTuple(group, ["拍号", meter.replace(/\s+/gu, ""), "拍号", "明", page]); facts.scoreFacts += 1; }
    }

    for (const match of pageText.matchAll(/《([^》]{1,60})》\s*(?:——|—|-|：|:)?[^《。；]{0,18}?(选自|节选自|改编自|取材于|根据)\s*(?:[^《。；]{0,8})《([^》]{1,60})》/gu)) {
      const fromName = displayTitle(match[1]);
      const toName = displayTitle(match[3]);
      const from = titleOccs.find((item) => item.normal === titleKey(fromName));
      const to = titleOccs.find((item) => item.normal === titleKey(toName));
      if (!from || !to || from.normal === to.normal) continue;
      const group = workGroups.get(`${from.unit}|${from.normal}`);
      if (group) addTuple(group, [match[2], to.name, to.type, "明", page]);
    }

    if (/合唱形式/u.test(pageText) && titleOccs.length > 1) {
      for (const occ of titleOccs) {
        const group = workGroups.get(`${occ.unit}|${occ.normal}`);
        if (group) addTuple(group, ["演唱形式", "合唱", "表演形式", "明", page]);
      }
    }

    termMatcher.lastIndex = 0;
    for (const match of pageText.matchAll(termMatcher)) {
      const term = termByMatchedName.get(match[0]);
      if (!term) continue;
      const index = match.index ?? 0;
      const nearest = findNearestTitle(titleOccs, index);
      const relation = [predicateForTerm(term.type), term.name, term.type, "明", page];
      if (nearest && (nearest.distance <= 50 || titleOccs.length === 1)) {
        const group = workGroups.get(`${nearest.unit}|${nearest.normal}`);
        if (group) { addTuple(group, relation); facts.termFactsOnWorks += 1; }
      } else {
        const conceptKey = `${unit}|${term.type}|${term.name}`;
        const concept = addToMap(unitConcepts, conceptKey, () => ({ name: term.name, type: term.type, predicate: predicateForTerm(term.type), unit, page }));
        concept.page = Math.min(concept.page, page);
      }
      termCounts.set(term.name, (termCounts.get(term.name) ?? 0) + 1);
    }

    for (const [category, description, pattern] of TASK_RULES) {
      if (!pattern.test(pageText)) continue;
      const taskKey = `${unit}|${page}|${category}`;
      tasks.set(taskKey, { name: description, unit, page, category });
    }

    const creditRows = [];
    for (const { regex, nameGroup, roleGroup } of creditPatterns) {
      regex.lastIndex = 0;
      for (const match of pageText.matchAll(regex)) {
        const role = match[roleGroup];
        const name = match[nameGroup];
        if (!roleNames[role] || !isPersonName(name)) continue;
        if (!personNames.includes(name) && name.length < 3) continue;
        creditRows.push({ name, role: roleNames[role], index: match.index ?? 0 });
      }
    }
    for (const credit of creditRows) {
      const nearest = findNearestTitle(titleOccs, credit.index);
      if (!nearest || (nearest.distance > 95 && titleOccs.length > 1)) continue;
      const group = workGroups.get(`${nearest.unit}|${nearest.normal}`);
      if (!group) continue;
      addTuple(group, [credit.role, credit.name, "人物", "明", page]);
      facts.creatorFacts += 1;
      const personKey = `${unit}|${credit.name}`;
      const person = addToMap(people, personKey, () => ({ name: credit.name, unit, page, facts: [], _factKeys: new Set() }));
      addTuple(person, ["创作身份", credit.role, null, "明", page]);
    }

    personMatcher.lastIndex = 0;
    for (const match of pageText.matchAll(personMatcher)) {
      const personName = match[0];
      const index = match.index ?? 0;
      const context = pageText.slice(Math.max(0, index - 40), Math.min(pageText.length, index + personName.length + 90));
      if (!PERSON_CUE.test(context)) continue;
      const personKey = `${unit}|${personName}`;
      const person = addToMap(people, personKey, () => ({ name: personName, unit, page, facts: [], _factKeys: new Set() }));
      person.page = Math.min(person.page, page);
      const date = context.match(/(?:（|\()\s*((?:18|19|20)\d{2}\s*[—–-]\s*(?:(?:18|19|20)\d{2})?)\s*(?:）|\))/u)?.[1];
      if (date) addTuple(person, ["生卒年", date.replace(/\s+/gu, ""), null, "明", page]);
      const identity = context.match(/(作曲家|作词家|音乐家|歌唱家|演唱家|演奏家|钢琴家|指挥家|艺术家|词曲作者)/u)?.[1];
      if (identity) addTuple(person, ["身份", identity, null, "明", page]);
      const nearest = findNearestTitle(titleOccs, index);
      if (nearest && (nearest.distance <= 65 || titleOccs.length === 1)) {
        const group = workGroups.get(`${nearest.unit}|${nearest.normal}`);
        if (group && /作曲|作词|词曲|演奏|演唱|创作|曲/u.test(context)) {
          const role = /作词|词曲/u.test(context) ? "作词" : "作曲";
          addTuple(group, [role, personName, "人物", "明", page]);
        }
      }
    }
  }

  const allWorks = [...workGroups.values()].map((work) => ({
    name: work.name, type: work.type, unit: work.unit, page: work.page,
    facts: work.facts,
    ...(work._existingInUnit ? { existingInUnit: true } : {}),
  }));
  const newWorks = allWorks.filter((work) => !work.existingInUnit).map(({ existingInUnit, ...work }) => work);
  const existingWorkFacts = allWorks.filter((work) => work.existingInUnit).map(({ existingInUnit, ...work }) => work);
  const titleSet = new Set(titleOccurrences.map((item) => `${item.unit}|${item.normal}`));
  output[key] = {
    extractedPageCount: pages.pages.length,
    titleMentions: titleOccurrences.length,
    uniqueTitleUnitLinks: titleSet.size,
    newWorks,
    existingWorkFacts,
    references: [...references.values()],
    concepts: [...unitConcepts.values()].map(({ name, type, predicate, unit, page }) => ({ name, type, predicate, unit, page })),
    people: [...people.values()].map(({ name, unit, page, facts }) => ({ name, unit, page, facts })),
    tasks: [...tasks.values()],
    stats: {
      newWorkLinks: newWorks.length, workFactLinks: newWorks.reduce((sum, work) => sum + work.facts.length, 0) + existingWorkFacts.reduce((sum, work) => sum + work.facts.length, 0),
      conceptLinks: unitConcepts.size, peopleLinks: people.size, taskLinks: tasks.size, ...facts,
      matchedVocabulary: termCounts.size,
    },
  };
}

const clean = (value) => JSON.parse(JSON.stringify(value));
for (const book of Object.values(output)) {
  for (const group of [...book.newWorks, ...book.existingWorkFacts]) delete group._factKeys;
}
const outputPath = path.join(EDITION, "data", "page-enrichment.mjs");
writeFileSync(outputPath, `// Page-cited enrichment generated from local 人教版 PDF text layers. Rebuild with extract-page-enrichment.mjs.\nexport const PAGE_ENRICHMENT = ${JSON.stringify(clean(output), null, 2)};\n\nexport function pageEnrichmentFor(bookKey) {\n  return PAGE_ENRICHMENT[bookKey] ?? { newWorks: [], existingWorkFacts: [], references: [], concepts: [], people: [], tasks: [] };\n}\n`, "utf8");
console.log(JSON.stringify(Object.entries(output).map(([bookKey, book]) => ({ bookKey, ...book.stats, titles: book.titleMentions, pageCount: book.extractedPageCount })), null, 2));
console.log(`Wrote ${path.relative(ROOT, outputPath)}`);
