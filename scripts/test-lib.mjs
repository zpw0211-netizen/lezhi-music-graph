// test-lib.mjs — 共享应用模型、年表模型与五声实验室调式数据的测试。
// 用法：node scripts/test-lib.mjs                   跑全部测试
//       node scripts/test-lib.mjs --mutation-check  变异自证：所有故意 bug 都必须被测试抓到
//       node scripts/test-lib.mjs --run-mutation <id>（内部用，子进程跑单个变异）
//
// 被测的是 TS 文件：用仓库自带的 typescript 包 transpileModule 转成临时 .mjs 再
// import（临时目录用 os.tmpdir()，尊重 TEMP 覆盖；无相对导入，无需改写）。
// 不改被测文件；变异只发生在内存中的源码文本上，不写回仓库。
//
// 变异检查用子进程实现：node:test 的套件一个进程只能跑一遍，每个变异在全新
// 子进程里跑全部测试，用退出码判断「至少有一个测试失败」。
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import {
  mergeYearSupplement,
  missingManifestIds,
  serializeYearSupplement,
  writeYearSupplementFiles,
} from "./build-year-supplement.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");

const SOURCES = {
  routing: path.join(repoRoot, "app", "lib", "app", "routing.ts"),
  unitData: path.join(repoRoot, "app", "lib", "app", "unit-data.ts"),
  timelineModel: path.join(repoRoot, "app", "components", "timeline", "timelineModel.ts"),
  labScales: path.join(repoRoot, "app", "components", "lab", "heptatonic.ts"),
  lupanModel: path.join(repoRoot, "app", "components", "lab", "lupan-model.ts"),
};

// ---- 变异定义：每条都是「源码文本替换」，替换必须真的发生（否则视为脚本自身出错） ----
const MUTATIONS = [
  {
    id: "a",
    label: "(a) formatRoute 对 records 路由漏掉册参数",
    file: "routing",
    from: 'const book = route.book ? `/${encodeURIComponent(route.book)}` : "";',
    to: 'const book = "";',
    expectedFailure: "往返：records（只有册）",
  },
  {
    id: "b",
    label: "(b) 解码不做 decodeURIComponent",
    file: "routing",
    from: "const [book, ...workParts] = rest.map(decodeURIComponent);",
    to: "const [book, ...workParts] = rest;",
    expectedFailure: "中文与特殊字符：records 详情路由",
  },
  {
    id: "c",
    label: "(c) getPrintedPage 不再回退到 null（现行代码没有 PDF 页码回退，等价实现为固定返回页码 1）",
    file: "unitData",
    from: "return match ? Number(match) : null;",
    to: "return match ? Number(match) : 1;",
    expectedFailure: "页码：无 media / 无标题 → null",
  },
  {
    id: "d",
    label: "(d) parseUnitTask 不识别「练习重点」",
    file: "unitData",
    from: "/（(?=涉及|练习重点：)/",
    to: "/（(?=涉及)/",
    expectedFailure: "任务解析：只有练习重点、没有涉及 → focus 正常解析（变异 d 靠它抓）",
  },
  {
    id: "e",
    label: "(e) records 多段作品名只保留第一段",
    file: "routing",
    from: 'const work = workParts.join("/");',
    to: 'const work = workParts[0] ?? "";',
    expectedFailure: "路由：records 多段作品名保留全部路径段",
  },
  {
    id: "f",
    label: "(f) 井号路由里的未知 view 不回 home",
    file: "routing",
    from: "if (!VIEWS.has(view)) return HOME_ROUTE;",
    to: "if (!VIEWS.has(view)) return { view };",
    expectedFailure: "容错：#/nope 回退 home",
  },
  {
    id: "g",
    label: "(g) timeline 不再注册为可用路由",
    file: "routing",
    from: '  "timeline",',
    to: '  "disabled-timeline",',
    expectedFailure: "往返：timeline",
  },
  {
    id: "h",
    label: "(h) 雅乐变徵的半音数偏移",
    file: "labScales",
    from: 'name: "变徵", solfege: "♯fa", degree: "♯4", semitone: 6',
    to: 'name: "变徵", solfege: "♯fa", degree: "♯4", semitone: 7',
    expectedFailure: "七声音阶半音数：雅乐（正声调式）",
  },
  {
    id: "i",
    label: "(i) 律盘顺时针拖动反转半音方向",
    file: "lupanModel",
    from: "return normalizePitchClass(startPitchClass - steps);",
    to: "return normalizePitchClass(startPitchClass + steps);",
    expectedFailure: "律盘：顺时针拖动使宫位下移半音",
  },
];

// ---- 转译与加载 ------------------------------------------------------------

const TRANSPILE_OPTIONS = {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
};

function applyMutation(source, mutation) {
  const occurrences = source.split(mutation.from).length - 1;
  if (occurrences !== 1) {
    throw new Error(`变异 ${mutation.id} 的定位文本应恰好出现一次，实际 ${occurrences} 次：${mutation.from}`);
  }
  const mutated = source.replace(mutation.from, mutation.to);
  if (mutated === source) throw new Error(`变异 ${mutation.id} 没有改变源文件：${mutation.from}`);
  return mutated;
}

/** 转译模块（可选注入一个变异）到临时目录并 import。import 完成后删临时目录。 */
async function loadModules(mutation) {
  const tmpDir = path.join(process.env.TEMP ?? tmpdir(), `yapu-test-lib-${process.pid}`);
  mkdirSync(tmpDir, { recursive: true });
  try {
    const modules = {};
    for (const [key, file] of Object.entries(SOURCES)) {
      let source = readFileSync(file, "utf8");
      if (mutation && mutation.file === key) source = applyMutation(source, mutation);
      const out = path.join(tmpDir, `${key}.mjs`);
      writeFileSync(out, ts.transpileModule(source, TRANSPILE_OPTIONS).outputText, "utf8");
      modules[key] = await import(pathToFileURL(out).href);
    }
    return modules;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

function mutationFromArgv() {
  const index = process.argv.indexOf("--run-mutation");
  if (index < 0) return undefined;
  const id = process.argv[index + 1];
  const mutation = MUTATIONS.find((m) => m.id === id);
  if (!mutation) throw new Error(`未知的变异 id：${id}`);
  return mutation;
}

// 顶层 await：动态 import 返回 promise，等被测模块都就位再注册测试。
const loaded = await loadModules(mutationFromArgv());
const { parseRoute, formatRoute, HOME_ROUTE } = await loaded.routing;
const { isStarredWork, hasMelody, getScoreMedia, getPrintedPage, parseUnitTask } = await loaded.unitData;
const { workHref } = await loaded.timelineModel;
const { CHROMATIC_PITCH_NAMES, HEPTATONIC_MODES, heptatonicPhrase, transposePitchClass } = await loaded.labScales;
const { makeLupanPhrase, normalizePitchClass, transposeTonicFromDrag } = await loaded.lupanModel;
const timelineData = JSON.parse(readFileSync(path.join(repoRoot, "public", "data", "timeline.json"), "utf8"));
const recordUnits = JSON.parse(readFileSync(path.join(repoRoot, "public", "data", "units.json"), "utf8"));
const recordWorks = new Map(recordUnits.flatMap((unit) => unit.works.map((work) => [`${unit.bookKey}:${work.id}`, work])));

// ---- 测试登记（顶层 test()；node:test 在进程退出前执行，失败置非零退出码） ----

let total = 0;
let passed = 0;

/** 登记一个测试并维护自己的通过/总数计数（用于最后一行汇总）。 */
function t(name, fn) {
  total += 1;
  test(name, async () => {
    await fn();
    passed += 1;
  });
}

// --- routing.ts ---------------------------------------------------------------

/** 往返必须无损的路由集合。 */
const ROUND_TRIP = [
  { name: "home", route: { view: "home" } },
  { name: "assistant", route: { view: "assistant" } },
  { name: "research", route: { view: "research" } },
  { name: "import", route: { view: "import" } },
  { name: "graph+节点", route: { view: "graph", node: "CAN_x" } },
  { name: "records（只有册）", route: { view: "records", book: "g7s1" } },
  { name: "records（册与作品）", route: { view: "records", book: "g7s1", work: "歌唱祖国" } },
  { name: "lesson+作品", route: { view: "lesson", work: "歌唱祖国" } },
  { name: "work+作品", route: { view: "work", work: "义勇军进行曲" } },
  { name: "timeline", route: { view: "timeline" } },
];

for (const { name, route } of ROUND_TRIP) {
  t(`往返：${name}`, () => {
    assert.deepEqual(parseRoute(formatRoute(route)), route, `路由 ${JSON.stringify(route)} 往返失真`);
  });
}

// --- lab/heptatonic.ts --------------------------------------------------------

const EXPECTED_HEPTATONIC_INTERVALS = {
  qingyue: [0, 2, 4, 5, 7, 9, 11],
  yayue: [0, 2, 4, 6, 7, 9, 11],
  yanyue: [0, 2, 4, 5, 7, 9, 10],
};

t("七声音阶半音数：清乐（下徵调式 / 新音阶）", () => {
  const scale = HEPTATONIC_MODES.qingyue;
  assert.equal(scale.name, "清乐");
  assert.match(scale.alias, /下徵调式.*新音阶/);
  assert.deepEqual(scale.notes.map((note) => note.semitone), EXPECTED_HEPTATONIC_INTERVALS.qingyue);
  assert.deepEqual(scale.notes.filter((note) => note.altered).map((note) => note.name), ["清角", "变宫"]);
});

t("七声音阶半音数：雅乐（正声调式）", () => {
  const scale = HEPTATONIC_MODES.yayue;
  assert.equal(scale.name, "雅乐");
  assert.match(scale.alias, /正声调式.*古音阶/);
  assert.deepEqual(scale.notes.map((note) => note.semitone), EXPECTED_HEPTATONIC_INTERVALS.yayue);
  assert.deepEqual(scale.notes.filter((note) => note.altered).map((note) => note.name), ["变徵", "变宫"]);
});

t("七声音阶半音数：燕乐（清商调式）", () => {
  const scale = HEPTATONIC_MODES.yanyue;
  assert.equal(scale.name, "燕乐");
  assert.equal(scale.alias, "清商调式");
  assert.deepEqual(scale.notes.map((note) => note.semitone), EXPECTED_HEPTATONIC_INTERVALS.yanyue);
  assert.deepEqual(scale.notes.filter((note) => note.altered).map((note) => note.name), ["清角", "闰"]);
});

t("偏音关系：清角=5、变徵=6、变宫=11、闰=10 半音", () => {
  const noteAt = (mode, name) => HEPTATONIC_MODES[mode].notes.find((note) => note.name === name)?.semitone;
  assert.equal(noteAt("qingyue", "清角"), 5);
  assert.equal(noteAt("yayue", "变徵"), 6);
  assert.equal(noteAt("qingyue", "变宫"), 11);
  assert.equal(noteAt("yanyue", "闰"), 10);
});

t("十二音高圆盘：移宫后偏音仍落在正确半音位置", () => {
  assert.equal(CHROMATIC_PITCH_NAMES.length, 12);
  assert.equal(transposePitchClass(2, HEPTATONIC_MODES.qingyue.notes.find((note) => note.name === "清角").semitone), 7);
  assert.equal(transposePitchClass(2, HEPTATONIC_MODES.yayue.notes.find((note) => note.name === "变徵").semitone), 8);
  assert.equal(transposePitchClass(2, HEPTATONIC_MODES.yanyue.notes.find((note) => note.name === "闰").semitone), 0);
});

t("律盘：顺时针拖动使宫位下移半音，并在十二音位内循环", () => {
  assert.equal(transposeTonicFromDrag(0, 30), 11);
  assert.equal(transposeTonicFromDrag(11, -30), 0);
  assert.equal(transposeTonicFromDrag(4, 360), 4);
  assert.equal(normalizePitchClass(-1), 11);
});

t("律盘：五声自编走句上行、经过高八度宫音并回到宫", () => {
  const phrase = makeLupanPhrase([
    { name: "宫", degree: "1", semitone: 0 },
    { name: "商", degree: "2", semitone: 2 },
    { name: "角", degree: "3", semitone: 4 },
    { name: "徵", degree: "5", semitone: 7 },
    { name: "羽", degree: "6", semitone: 9 },
  ], 60, true);
  assert.deepEqual(phrase.map((note) => note.midi), [60, 62, 64, 67, 69, 72, 67, 64, 62, 60]);
  assert.equal(phrase[5].octave, true);
  assert.equal(phrase.at(-1)?.name, "宫");
});

t("律盘：七声示范走句保留全部偏音并回到宫", () => {
  const phrase = makeLupanPhrase(HEPTATONIC_MODES.qingyue.notes, 60, false);
  assert.equal(phrase.length, 15);
  assert.deepEqual(phrase.filter((note) => note.altered).map((note) => note.name), ["清角", "变宫", "变宫", "清角"]);
  assert.equal(phrase[7].midi, 72);
  assert.equal(phrase.at(-1)?.midi, 60);
});

t("七声音阶示例走句：一组上行、八度宫音与完整下行", () => {
  const phrase = heptatonicPhrase("qingyue", 62);
  assert.equal(phrase.length, 15);
  assert.deepEqual(phrase.map((note) => note.midi), [62, 64, 66, 67, 69, 71, 73, 74, 73, 71, 69, 67, 66, 64, 62]);
  assert.equal(phrase[7].name, "宫");
});

t("往返：home 的 format 是空串", () => {
  assert.equal(formatRoute({ view: "home" }), "");
});

t("中文与特殊字符：空格、·、括号、&、/、#、% 往返不丢失", () => {
  const names = [
    "春 游",
    "黄河之滨·晨",
    "春之歌（第二乐章）",
    "A&B 合唱",
    "春之歌/第二乐章",
    "C# 调性探究",
    "50% 速度练习",
  ];
  for (const work of names) {
    const route = { view: "lesson", work };
    assert.deepEqual(parseRoute(formatRoute(route)), route, `作品名「${work}」往返失真`);
  }
});

t("中文与特殊字符：records 详情路由往返保留册别与作品名", () => {
  const names = ["歌唱祖国", "春 游", "黄河之滨·晨", "春之歌（第二乐章）", "A&B 合唱", "春之歌/第二乐章", "C# 调性探究", "50% 速度练习"];
  for (const work of names) {
    const route = { view: "records", book: "g7s1", work };
    assert.deepEqual(parseRoute(formatRoute(route)), route, `作品名「${work}」的 records 路由往返失真`);
  }
});

t("路由：records 多段作品名保留全部路径段", () => {
  assert.deepEqual(
    parseRoute("#/records/g7s1/春之歌/第二乐章"),
    { view: "records", book: "g7s1", work: "春之歌/第二乐章" },
  );
});

t("中文与特殊字符：书名号会被 bare() 剥掉（锁定现行设计行为）", () => {
  // routing.ts 头注释明确 work 字段是不带《》的裸标题，因此带书名号的输入
  // 会得到剥壳结果——这是设计行为而非 bug，测试把它钉住。
  const route = { view: "lesson", work: "《歌唱祖国》" };
  assert.deepEqual(parseRoute(formatRoute(route)), { view: "lesson", work: "歌唱祖国" });
});

t("旧链接兼容：?view=records&book=g7s1", () => {
  assert.deepEqual(parseRoute("", "?view=records&book=g7s1"), { view: "records", book: "g7s1" });
});

t("旧链接兼容：?view=lesson&work=歌唱祖国（含 URL 编码形式）", () => {
  const expected = { view: "lesson", work: "歌唱祖国" };
  assert.deepEqual(parseRoute("", "?view=lesson&work=歌唱祖国"), expected);
  assert.deepEqual(parseRoute("", `?view=lesson&work=${encodeURIComponent("歌唱祖国")}`), expected);
});

t("旧链接兼容：?view=graph&node=CAN_x", () => {
  assert.deepEqual(parseRoute("", "?view=graph&node=CAN_x"), { view: "graph", node: "CAN_x" });
});

t("旧链接兼容：?view=timeline", () => {
  assert.deepEqual(parseRoute("", "?view=timeline"), { view: "timeline" });
});

t("旧链接兼容：旧 work 参数同样会被剥书名号", () => {
  assert.deepEqual(parseRoute("", "?view=work&work=《歌唱祖国》"), { view: "work", work: "歌唱祖国" });
});

t("旧链接兼容：未知 view 回退 home", () => {
  assert.deepEqual(parseRoute("", "?view=nope&work=x"), HOME_ROUTE);
});

t("旧链接兼容：lesson 不带 work 回退 records", () => {
  assert.deepEqual(parseRoute("", "?view=lesson"), { view: "records" });
});

t("容错：#/nope 回退 home", () => {
  assert.deepEqual(parseRoute("#/nope"), HOME_ROUTE);
});

t("容错：空井号、#、#/ 回退 home", () => {
  assert.deepEqual(parseRoute(""), HOME_ROUTE);
  assert.deepEqual(parseRoute("#"), HOME_ROUTE);
  assert.deepEqual(parseRoute("#/"), HOME_ROUTE);
});

t("容错：#/records/不存在的册 仍解析为 records 路由（现行代码不校验册号）", () => {
  assert.deepEqual(parseRoute("#/records/不存在的册"), { view: "records", book: "不存在的册" });
});

t("容错：records 直链中的不存在作品保留原路由", () => {
  const route = { view: "records", book: "g7s1", work: "不存在的作品" };
  assert.deepEqual(parseRoute("#/records/g7s1/%E4%B8%8D%E5%AD%98%E5%9C%A8%E7%9A%84%E4%BD%9C%E5%93%81"), route);
  assert.equal(formatRoute(parseRoute(formatRoute(route))), formatRoute(route));
});

t("返回路由：作品详情保留当前册别", () => {
  const detail = parseRoute("#/records/g7s1/%E6%AD%8C%E5%94%B1%E7%A5%96%E5%9B%BD");
  assert.deepEqual(detail, { view: "records", book: "g7s1", work: "歌唱祖国" });
  const bookRoute = formatRoute({ view: "records", book: detail.book });
  assert.equal(bookRoute, "#/records/g7s1");
  assert.deepEqual(parseRoute(bookRoute), { view: "records", book: "g7s1" });
});

t("容错：#/lesson 不带作品回退 records", () => {
  assert.deepEqual(parseRoute("#/lesson"), { view: "records" });
});

t("容错：井号里的多余段会拼回详情（现行行为）", () => {
  assert.deepEqual(parseRoute("#/graph/CAN_x/extra"), { view: "graph", node: "CAN_x/extra" });
});

t("容错：timeline 忽略不使用的多余路径段", () => {
  assert.deepEqual(parseRoute("#/timeline/extra"), { view: "timeline" });
});

t("年表作品链接：全量 362 条只链接 records 中可解析的 212 条", () => {
  assert.equal(timelineData.works.length, 362);
  let linked = 0;
  let plainText = 0;
  for (const work of timelineData.works) {
    const href = workHref(work);
    const target = recordWorks.get(`${work.bookKey}:${work.id}`);
    assert.equal(Boolean(work.unit), Boolean(target), `单元归属与 records 目录不一致：${work.id}`);
    if (!target) {
      plainText += 1;
      assert.equal(href, null, `单元外作品应为纯文字：${work.id}`);
      continue;
    }
    linked += 1;
    assert.equal(target.name, work.name, `records 目录作品名称不符：${work.id}`);
    assert.equal(typeof href, "string", `目录内作品缺少年表链接：${work.id}`);
    assert.deepEqual(parseRoute(href), {
      view: "records",
      book: work.bookKey,
      work: work.name.replace(/^《|》$/g, ""),
    }, `作品链接未解析到正确册别与作品：${work.id}`);
  }
  assert.equal(linked, 212);
  assert.equal(plainText, 150);
});

t("records 默认册改为七上且不改图谱使用的全局默认册", () => {
  const page = readFileSync(path.join(repoRoot, "app", "page.tsx"), "utf8");
  const types = readFileSync(path.join(repoRoot, "app", "lib", "app", "types.ts"), "utf8");
  assert.match(page, /const \[recordsBook, setRecordsBook\] = useState\("g7s1"\)/);
  assert.match(types, /DEFAULT_BOOK_KEY\s*=\s*"g8s2"/);
});

t("幂等与稳定：format(parse(format(route))) 等于 format(route)", () => {
  for (const { route } of ROUND_TRIP) {
    const once = formatRoute(route);
    assert.equal(formatRoute(parseRoute(once)), once, `路由 ${JSON.stringify(route)} 的 format 不稳定`);
  }
});

t("幂等与稳定：format 不产生双 #、不以 / 结尾", () => {
  for (const { route } of ROUND_TRIP) {
    const hash = formatRoute(route);
    assert.ok(!hash.includes("##"), `路由 ${JSON.stringify(route)} 产生双 #`);
    assert.ok(hash === "" || !hash.endsWith("/"), `路由 ${JSON.stringify(route)} 以 / 结尾`);
  }
});

// --- unit-data.ts -------------------------------------------------------------

t("页码：教材第N页 → N", () => {
  assert.equal(getPrintedPage([{ title: "教材第12页" }]), 12);
});

t("页码：只有「教材前置页」→ null", () => {
  assert.equal(getPrintedPage([{ title: "教材前置页" }]), null);
});

t("页码：多个 media 取第一个有页码的", () => {
  assert.equal(getPrintedPage([{ title: "封面" }, { title: "教材第34页" }, { title: "教材第56页" }]), 34);
});

t("页码：无 media / 无标题 → null", () => {
  assert.equal(getPrintedPage(), null);
  assert.equal(getPrintedPage([]), null);
  assert.equal(getPrintedPage([{ title: "谱例图片" }]), null);
});

t("谱例：getScoreMedia 只保留 score 且保持原顺序", () => {
  const media = [
    { kind: "audio", url: "a.mp3" },
    { kind: "score", url: "s1.png" },
    { kind: "score", url: "s2.png" },
    { kind: "video", url: "v.mp4" },
  ];
  const result = getScoreMedia(media);
  assert.deepEqual(
    result.map((asset) => asset.url),
    ["s1.png", "s2.png"],
  );
  assert.deepEqual(getScoreMedia([{ kind: "audio", url: "a.mp3" }]), []);
  assert.deepEqual(getScoreMedia(), []);
});

t("重点曲目：有「教材标注」谓语 → true", () => {
  assert.equal(isStarredWork([{ predicate: "教材标注" }]), true);
  assert.equal(isStarredWork([{ predicate: "其他" }, { predicate: "教材标注" }]), true);
});

t("重点曲目：无「教材标注」谓语 → false", () => {
  assert.equal(isStarredWork([]), false);
  assert.equal(isStarredWork([{ predicate: "教材备注" }]), false);
});

t("旋律：hasMelody 对空数组 / 缺键为 false", () => {
  const melodies = { a: [1, 2], b: [] };
  assert.equal(hasMelody("a", melodies), true);
  assert.equal(hasMelody("b", melodies), false);
  assert.equal(hasMelody("missing", melodies), false);
});

t("任务解析：模仿《斗笠舞》动作（涉及《斗笠舞》；练习重点：舞蹈律动）", () => {
  assert.deepEqual(parseUnitTask("模仿《斗笠舞》动作（涉及《斗笠舞》；练习重点：舞蹈律动）"), {
    text: "模仿《斗笠舞》动作",
    works: ["《斗笠舞》"],
    focus: ["舞蹈律动"],
  });
});

t("任务解析：多个重点用「、」分隔", () => {
  const task = parseUnitTask("聆听歌曲（涉及《歌唱祖国》；练习重点：旋律、节奏）");
  assert.deepEqual(task.focus, ["旋律", "节奏"]);
});

t("任务解析：重点里含书名号不被拆开", () => {
  const task = parseUnitTask("欣赏歌曲（涉及《义勇军进行曲》；练习重点：分析《义勇军进行曲》的进行曲风格）");
  assert.deepEqual(task.focus, ["分析《义勇军进行曲》的进行曲风格"]);
});

t("任务解析：只有练习重点、没有涉及 → focus 正常解析（变异 d 靠它抓）", () => {
  const task = parseUnitTask("演唱歌曲（练习重点：节奏）");
  assert.deepEqual(task, { text: "演唱歌曲", works: [], focus: ["节奏"] });
});

t("任务解析：无括号 → 原文返回、works/focus 为空", () => {
  assert.deepEqual(parseUnitTask("聆听歌曲"), { text: "聆听歌曲", works: [], focus: [] });
});

t("任务解析：作品去重", () => {
  const task = parseUnitTask("对比聆听（涉及《歌唱祖国》《歌唱祖国》）");
  assert.deepEqual(task.works, ["《歌唱祖国》"]);
});

t("任务解析：兼容逗号 / 分号分隔的重点", () => {
  const task = parseUnitTask("聆听歌曲（涉及《a》；练习重点：旋律，节奏；力度）");
  assert.deepEqual(task.focus, ["旋律", "节奏", "力度"]);
});

t("任务解析：现行代码不会从正文提取《中国》《歌唱祖国》（锁定现行行为，见回报「疑似缺陷」）", () => {
  // 任务单期望「对比《中国》与《歌唱祖国》的音乐风格」解析出两个作品名，但
  // 现行实现只在（涉及…）后缀里找作品名；这里锁定现行行为并记入疑似缺陷。
  assert.deepEqual(parseUnitTask("对比《中国》与《歌唱祖国》的音乐风格"), {
    text: "对比《中国》与《歌唱祖国》的音乐风格",
    works: [],
    focus: [],
  });
});

// --- supplementary work-year pipeline ---------------------------------------

const YEAR_SUPPLEMENT_MANIFEST = [
  { id: "TEST_WORK_FOUND", name: "《测试作品甲》" },
  { id: "TEST_WORK_TRADITIONAL", name: "《测试作品乙》" },
  { id: "TEST_WORK_NOT_FOUND", name: "《测试作品丙》" },
];
const YEAR_SUPPLEMENT_SOURCE_A = {
  title: "作品资料页",
  url: "https://example.org/work-a",
  publisher: "音乐资料库",
};
const YEAR_SUPPLEMENT_SOURCE_B = {
  title: "馆藏目录",
  url: "https://example.org/catalog-b",
  publisher: "公共图书馆",
};
const YEAR_SUPPLEMENT_RESULTS = [
  [
    {
      id: "TEST_WORK_FOUND",
      name: "《测试作品甲》",
      status: "found",
      event: "作品形成",
      yearText: "20 世纪前期",
      yearRange: [1900, 1949],
      subject: "作品创作",
      sources: [YEAR_SUPPLEMENT_SOURCE_A],
      confidence: "medium",
      note: "交叉核对来源。",
    },
    {
      id: "TEST_WORK_TRADITIONAL",
      name: "《测试作品乙》",
      status: "traditional",
      event: "传统曲目",
      yearText: "传统佳美兰曲目",
      yearRange: null,
      subject: "曲目流传",
      sources: [YEAR_SUPPLEMENT_SOURCE_B],
      confidence: 0.72,
      note: null,
    },
  ],
  [
    {
      id: "TEST_WORK_FOUND",
      name: "《测试作品甲》",
      status: "found",
      event: "作品形成",
      yearText: "20 世纪前期",
      yearRange: [1900, 1949],
      subject: "作品创作",
      sources: [YEAR_SUPPLEMENT_SOURCE_B],
      confidence: "medium",
      note: "交叉核对来源。",
    },
    {
      id: "TEST_WORK_NOT_FOUND",
      name: "《测试作品丙》",
      status: "not_found",
      event: null,
      yearText: null,
      yearRange: null,
      subject: null,
      sources: [],
      confidence: "low",
      note: "暂未找到可靠年代来源。",
    },
  ],
];

function hashTextbookData() {
  const dataRoot = path.join(repoRoot, "public", "data");
  const protectedPaths = ["books", "details", "evidence", "timeline.json"];
  const files = [];
  const visit = (absolutePath) => {
    for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
      const childPath = path.join(absolutePath, entry.name);
      if (entry.isDirectory()) visit(childPath);
      else if (entry.isFile()) files.push(childPath);
    }
  };
  for (const relativePath of protectedPaths) {
    const absolutePath = path.join(dataRoot, relativePath);
    if (relativePath.endsWith(".json")) files.push(absolutePath);
    else visit(absolutePath);
  }
  const hash = createHash("sha256");
  for (const file of files.sort((left, right) => left < right ? -1 : left > right ? 1 : 0)) {
    hash.update(path.relative(dataRoot, file));
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function yearSupplementFixture() {
  return mergeYearSupplement(YEAR_SUPPLEMENT_RESULTS, {
    manifest: YEAR_SUPPLEMENT_MANIFEST,
  });
}

t("年代补充：合并与序列化对批次顺序保持确定", () => {
  const forward = yearSupplementFixture();
  const reversed = mergeYearSupplement(
    YEAR_SUPPLEMENT_RESULTS.slice().reverse().map((group) => group.slice().reverse()),
    { manifest: YEAR_SUPPLEMENT_MANIFEST },
  );
  assert.equal(serializeYearSupplement(forward), serializeYearSupplement(reversed));
  assert.deepEqual(missingManifestIds(forward, YEAR_SUPPLEMENT_MANIFEST), []);
});

t("年代补充：保留 not_found 状态且不带年代", () => {
  const record = yearSupplementFixture().find((work) => work.id === "TEST_WORK_NOT_FOUND");
  assert.ok(record);
  assert.equal(record.status, "not_found");
  assert.equal(record.yearText, null);
  assert.equal(record.yearRange, null);
});

t("年代补充：每条记录保留完整字段、出处与置信度", () => {
  const records = yearSupplementFixture();
  const expectedKeys = [
    "id",
    "name",
    "status",
    "event",
    "yearText",
    "yearRange",
    "subject",
    "sources",
    "confidence",
    "note",
    "kind",
    "label",
  ];
  assert.deepEqual(Object.keys(records[0]), expectedKeys);
  const testWork = records.find((work) => work.id === "TEST_WORK_FOUND");
  assert.ok(testWork);
  assert.equal(testWork.kind, "supplement");
  assert.equal(testWork.label, "补充资料（非教材）");
  assert.equal(testWork.confidence, "medium");
  assert.deepEqual(testWork.sources, [YEAR_SUPPLEMENT_SOURCE_A, YEAR_SUPPLEMENT_SOURCE_B]);
  assert.deepEqual(Object.keys(testWork.sources[0]), ["title", "url", "publisher"]);
});

t("年代补充：写入源数据与发布数据不改教材数据且字节稳定", async () => {
  const records = yearSupplementFixture();
  const before = hashTextbookData();
  const scratch = mkdtempSync(
    path.join(process.env.TEMP ?? tmpdir(), "yapu-year-supplement-test-"),
  );
  try {
    const sourcePath = path.join(scratch, "source", "work-years.json");
    const publicPath = path.join(scratch, "public", "work-years.json");
    const first = await writeYearSupplementFiles(records, { sourcePath, publicPath });
    const second = await writeYearSupplementFiles(records, { sourcePath, publicPath });
    assert.equal(first, second);
    assert.equal(readFileSync(sourcePath, "utf8"), readFileSync(publicPath, "utf8"));
    assert.equal(readFileSync(sourcePath, "utf8"), serializeYearSupplement(records));
    assert.equal(hashTextbookData(), before);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

// ---- 变异检查（父进程）：仅完整测试运行中预期用例失败才算捕获 ----

function runMutationCheck() {
  let caughtCount = 0;
  let checkFailedCount = 0;
  for (const mutation of MUTATIONS) {
    let output = "";
    let status = 0;
    try {
      output = execFileSync(process.execPath, [scriptPath, "--run-mutation", mutation.id], {
        stdio: ["ignore", "pipe", "pipe"],
        encoding: "utf8",
      });
    } catch (error) {
      output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
      status = error.status ?? 0;
    }
    const tests = output.match(/^# tests (\d+)$/m);
    const failures = output.match(/^# fail (\d+)$/m);
    const runSummary = output.match(/测试结果：通过 (\d+)\/(\d+)/);
    const unescapeTapName = (value) => value.replace(/\\#/g, "#");
    const expectedAssertionFailed = output.split(/\r?\n/).some((line) =>
      line.startsWith("not ok ") && unescapeTapName(line).includes(unescapeTapName(mutation.expectedFailure)),
    );
    const completeTestFailure = status === 1
      && Number(tests?.[1]) > 0
      && Number(failures?.[1]) > 0
      && runSummary !== null
      && runSummary[1] === String(Number(tests?.[1]) - Number(failures?.[1]))
      && runSummary[2] === tests?.[1]
      && expectedAssertionFailed;

    if (completeTestFailure) {
      caughtCount += 1;
      console.log(`  caught       ${mutation.label} → ${failures?.[1]} 个测试失败`);
    } else if (status === 0 && tests && failures?.[1] === "0" && runSummary?.[1] === tests[1] && runSummary[2] === tests[1]) {
      checkFailedCount += 1;
      console.log(`  SURVIVED     ${mutation.label} → 变异未被测试发现`);
    } else {
      checkFailedCount += 1;
      const reason = !tests || !runSummary
        ? "子进程未完成测试（可能是脚本加载或变异定位失败）"
        : !expectedAssertionFailed
          ? `没有触发预期用例「${mutation.expectedFailure}」`
          : `退出码/汇总不匹配（status=${status}, fail=${failures?.[1] ?? "?"}）`;
      console.log(`  CHECK_ERROR  ${mutation.label} → ${reason}`);
      const diagnostic = output.trim().split(/\r?\n/).slice(-4).join(" | ");
      if (diagnostic) console.log(`               ${diagnostic}`);
    }
  }
  if (caughtCount === MUTATIONS.length && checkFailedCount === 0) {
    console.log(`MUTATION_CHECK_PASSED (${caughtCount}/${MUTATIONS.length} caught)`);
  } else {
    console.log(`MUTATION_CHECK_FAILED (${caughtCount}/${MUTATIONS.length} caught; ${checkFailedCount} check errors or surviving mutations)`);
    process.exitCode = 1;
  }
}

process.on("exit", () => {
  if (process.argv.includes("--run-mutation")) {
    console.log(
      `测试结果：通过 ${passed}/${total}${passed === total ? "（变异未被捕获！测试失效）" : "（存在失败 → 变异被捕获）"}`,
    );
  } else if (!process.argv.includes("--mutation-check")) {
    console.log(`测试结果：通过 ${passed}/${total}`);
  }
});

if (process.argv.includes("--mutation-check")) {
  runMutationCheck();
}
