# 芽谱

面向中小学师生的数字音乐教材网站，整合人音版（小学九册、初中六册，共十五册）和人教版（十四册）两套教材，每套另有五线谱版本。学生按课看谱、听旋律、学知识点；老师上课时能整屏展示；研究者可以看跨册教材知识关联。

页面上的内容都来自教材数据：教材里明确写出的是「教材知识」，教材之外的补充单独标注为「拓展知识」，不确定的内容不写。

线上地址：<https://yapu.studio/>。根目录是芽谱入口页（`portal/`，每套教科书一个板块），本应用是其中的人音版板块，发布在 <https://yapu.studio/renyin/>；人教版在 `/renjiao/`，两个五线谱版本在 `/renyin-staff/`、`/renjiao-staff/`（见第 3 节「教材版本」）。

## 1. 技术栈

| 项 | 说明 |
|---|---|
| 框架 | Next.js 16 App Router，由 vinext 1.0（Vite 实现的 Next 兼容层）构建；React 19；TypeScript 5.9 |
| 形态 | 整站是**一个静态导出页面**（`app/page.tsx`），页面切换走 URL 井号 |
| 图谱渲染 | Sigma.js（WebGL）为主，Canvas 2D / SVG 作回退 |
| 部署 | GitHub Pages 自定义域名 yapu.studio：入口页在根目录，本应用在 `/renyin/`；推送到 `main` 由 `.github/workflows/pages.yml` 发布 |
| 后端 | 无。`app/api/*` 只在 Sites（Cloudflare）构建里生效，静态导出不包含 |

## 2. 本地运行

**要求**：Node.js ≥ 22.13（`package.json` 的 `engines` 字段；CI 用 Node 22），Windows 上请用 PowerShell，不要用 Git Bash（原因见下面的坑）。

```powershell
# 安装依赖
npm ci

# 开发服务器（热更新）
npm run dev

# 构建并本地预览产物
npm run build
npx vinext start                 # 默认 3000 端口，可用 npx vinext start --port 4335
```

教材源数据或发布册目变化后，先运行 `npm run graph:canonical` 重建跨册规范图谱，再运行 `npm run build`。后者依次跑 `scripts/build-graph-index.mjs`、`scripts/build-entity-details.mjs`、`scripts/build-units.mjs`（单元篇章数据 `public/data/units.json`）、`scripts/build-atlas.mjs`（音乐地图与年表数据 `atlas.json`、`timeline.json`）、`vinext build`，产物在 `dist/`。

**如果 `npm run dev` 报 `There was an access violation in the runtime` / `MiniflareCoreError [ERR_RUNTIME_FAILURE]`**：vinext 的开发服务器要启动 Cloudflare Workers 运行时（workerd），这个报错是本机缺少最新的 [Microsoft Visual C++ 运行库](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)。装好运行库再试；不想装也可以直接用上面的 `npm run build` + `npx vinext start` 预览。

### 两个必须记住的坑

1. **构建一律用 PowerShell，不要用 Git Bash。** Git Bash 会把以 `/` 开头的路径参数改写成 `D:/Git/...`，构建出来的站点读不到数据和样式。
2. **`npm run build` 会重写 `public/data` 下由已发布册目生成的数据文件**（`books/`、`details/`、`evidence/` 与 `graph-index.json`）。提交前检查差异，保留与教材源数据相对应的产物。

### 构建 GitHub Pages 版本

站点路径和「没有后端」的假设由三个环境变量控制（与 `.github/workflows/pages.yml` 一致）：

```powershell
$env:GITHUB_PAGES = "true"
$env:NEXT_PUBLIC_STATIC_EXPORT = "1"
$env:NEXT_PUBLIC_BASE_PATH = "/renyin"
npm run build
node scripts/prepare-github-pages.mjs
npm run -s quality:pages
git restore public/data
```

| 环境变量 | 取值 | 作用 |
|---|---|---|
| `GITHUB_PAGES` | `true` | 打开静态导出（`output: "export"`）、`assetPrefix`、`trailingSlash`（`next.config.ts`） |
| `NEXT_PUBLIC_STATIC_EXPORT` | `1` | 前端按「没有后端」的模式运行（`app/lib/app/assets.ts`） |
| `NEXT_PUBLIC_BASE_PATH` | `/renyin` | 所有数据和媒体 URL 的路径前缀；`prepare-github-pages.mjs` 据此把应用放进 `dist/client/renyin/`，再把 `portal/` 入口页放到根目录 |

这个模式下的产物在 `dist/client/`（入口页）和 `dist/client/renyin/`（本应用），把 `dist/client/` 当作站点根目录预览。旧链接 `yapu.studio/#/…` 由入口页转到 `/renyin/#/…`。账号功能另需 `NEXT_PUBLIC_SUPABASE_URL` 等变量（见 `supabase/README.md`），不设时账号功能不可用（登录面板会提示服务暂未开通）。

## 3. 目录地图

| 路径 | 放什么 |
|---|---|
| `app/page.tsx`、`app/layout.tsx` | 页面外壳（数据加载、路由、页面切换）与根布局（全局 CSS、字体、预加载 `graph-index.json`） |
| `app/components/` | 界面组件，按页面分子目录：`home/`、`records/`、`lesson/`、`explorer/`、`graph/`、`assistant/`、`import/` |
| `app/hooks/` | 路由与历史（`useAppRoute.ts`）、数据加载（`useGraphIndex.ts`）、搜索、图谱筛选/动作/路径 |
| `app/lib/app/` | `routing.ts`（页面 ↔ 井号）、`assets.ts`（子路径）、`types.ts`（数据类型） |
| `app/lib/graph/`、`app/lib/lesson/`、`app/lib/ai/` | 图谱算法与节点详情（`knowledge-detail.ts`）；简谱解析（`jianpu.ts`）、旋律数据（`melodies-*.ts`）、钢琴采样播放（`piano-sampler.ts`）；本地检索问答（`graph-rag.ts`、`response-generation.ts`） |
| `app/api/` | `ask/`、`import/` 两个接口，只在 Sites 构建里生效，静态导出不包含 |
| `app/graph-schema.ts`、`app/graph-runtime.ts` | 图谱的实体/关系 schema 与运行时校验 |
| `app/*.css`、`app/styles/` | 全局样式表，在 `layout.tsx` 里逐个 `import` |
| `content/textbooks/` | 十五册教材源数据（`g1s1.mjs` … `g9s2.mjs`）、流程说明 `PROGRESS.md`、谱例清单 `score-manifest.json` |
| `public/data/` | 构建生成的网站数据，见第 5 节 |
| `public/media/` | 钢琴采样（`instruments/piano/`）、教材谱面图（`scores/<册>/`）、人声录音（`recordings/`，目前为空） |
| `public/art/`、`public/brand/` | 木刻插画与标志、字标字体许可（`SOURCES.md`、`README.md`、`OFL.txt`）；另有 `public/favicon.svg`、`public/og.jpg` |
| `scripts/` | 数据构建与审计脚本（`audit-*.mjs` 是功能保护网）；`scripts/lib/` 共用工具，`scripts/brand/` 重建标志的 Python 脚本 |
| `editions/` | 另外三个版本（人教版、人教版五线谱、人音版五线谱）自己的数据、插图和谱例图，见下面「教材版本」 |
| `.github/workflows/pages.yml` | 推送 `main` 后的审计、构建与发布流程 |
| `worker/`、`server/`、`db/`、`drizzle/`、`docs/`、`reports/` | 未部署的 AI 接口、原 Cloudflare 导入接口与数据库定义；历史验收记录与审计报告 |

### 教材版本

同一套代码出四个站点。人音版（简谱）就是仓库根目录本身；其余三个版本各有一个 `editions/<名>/` 目录，构建时叠加在根目录的一份临时副本上（`scripts/build-edition.mjs`），所以互不串数据。

| 版本 | 网址 | 册数（已发布） | 记谱 | 教材源数据在哪 |
|---|---|---|---|---|
| 人音版 | `/renyin/` | 15（15） | 简谱 | `content/textbooks/`、`data/books.json` |
| 人教版 | `/renjiao/` | 14（14） | 简谱 | `editions/renjiao/` |
| 人教版·五线谱 | `/renjiao-staff/` | 14（14） | 五线谱 | `editions/renjiao-staff/` |
| 人音版·五线谱 | `/renyin-staff/` | 15（12） | 五线谱 | `editions/renyin-staff/` |

- 每个版本的 `data/books.json` 里有 `edition` 块：名称、出版社、网址前缀 `basePath`、记谱方式 `notation`。
- 五线谱版本不单独维护课程和旋律，直接沿用对应出版社的简谱数据，由 `app/lib/lesson/staff-key-data.ts`、`staff-placement-data.ts` 补上谱号、调号和八度，在页面上画成五线谱。
- 谱例图的路径在各版本里是同名的；构建某个版本时，会先从副本里删掉人音版的册数据和谱例图，再放入该版本自己的。
- 人教版的册目、谱例页码和裁图清单在 `editions/renjiao/data/`（`printed-scores.mjs` 是每册正文里印了谱的作品清单）。

## 4. 路由

整站是一个静态导出页面，页面状态放在 URL 井号里（解析和生成都在 `app/lib/app/routing.ts`）。链接可以分享，刷新不丢页，前进后退可用。

| 地址 | 页面 |
|---|---|
| `/`（无井号） | 首页 |
| `#/records`、`#/records/g7s1` | 按课学习：小学 / 初中目录与阶段筛选 / 指定某一册 |
| `#/lesson/歌唱祖国` | 单课学习页 |
| `#/work/歌唱祖国` | 单个作品的知识图谱 |
| `#/graph`、`#/graph/<节点ID>` | 知识图谱页 / 聚焦某个节点 |
| `#/assistant` | 智能问答 |
| `#/research` | 研究分析 |
| `#/import` | 教材数据导入校验 |

作品名在 URL 里不带《》。旧的 `?view=lesson&work=…` 形式仍能打开，会被解析成上面的井号形式。

**不要改成 `?view=` 查询参数。** vinext 会把查询参数变化当成新文档，浏览器前进时会整页重载。

## 5. 数据流

`content/textbooks/*.mjs` 是唯一人工维护的源；`npm run build` 的前两步把它编译成网站要用的 JSON，前端只读 `public/data/`。

| 文件 | 什么时候加载 | 作用 |
|---|---|---|
| `public/data/graph-index.json` | 首屏（`app/layout.tsx` 预加载，`app/hooks/useGraphIndex.ts` 读取） | 全站索引：十五册目录与规范图谱 |
| `public/data/books/<册>.json` | 打开某一册时按需加载（`useBookData`） | 该册的实体、关系、教材证据；按册懒加载，首页用不到 |
| `public/data/evidence/<册>.json` | 需要引用教材原文时按需加载 | 逐条关系的教材证据：页码、原文，以及是「教材明确」还是「根据教材归纳」 |
| `public/data/details/CAN_<id>.json` | 点开某个知识节点时按需加载（`app/lib/graph/knowledge-detail.ts`） | 单个规范实体的阅读页：实体、出现位置、关系；构建生成，不入库 |
| `public/data/details/<册>.json` | 站点不读 | 册级明细；`quality:performance` 用它确认按需文件存在 |
| `public/data/music-graph.json`、`canonical-graph.json` | 站点不读 | 构建输入与审计用；`scripts/prepare-github-pages.mjs` 会在发布产物里剔除这两个大文件 |

### 旋律数据

页面上能播放的旋律都是手工从教材谱例转写的，放在 `app/lib/lesson/` 下：

| 文件 | 内容 |
|---|---|
| `melodies-g<年级><上下>.ts` | 人音版各册，如 `melodies-g7s2.ts` 是七年级下册 |
| `melodies-pep-g<年级><上下>.ts` | 人教版各册，每册一个对象，键是作品名（不带《》） |
| `melodies-wx-*.ts` | 五线谱版本里与简谱版不同的个别乐段，绝大多数册是空文件（只有七下、人教八上有少量内容） |
| `jianpu.ts` | 记谱格式与解析：`segment(册, 页码, 调, 拍号, 速度, 音符, 歌词, 选项)` |
| `melodies.ts` | 汇总各册并按册查找（`melodiesFor`）；`noMelodyReason` 登记人教版几课「谱例印了但配不出旋律」的原因 |

音符写成简谱字符串：`5` 四分，`5/` 八分，`5//` 十六分，`5.` 附点，`'` 高八度、`,` 低八度，`#`/`b` 升降，`0` 休止，`-` 延长一拍，`~` 连音线，`|` 分小节。打击乐只有节奏没有音高时，调写 `"节奏"`，音符用 `9`（不定音高）。每首要写明教材页码和速度来源；课本没给数字速度的，在 `note` 里写「播放暂按多少 BPM」。

校验：`node scripts/check-melodies.mjs` 检查每一小节的时值是否等于拍号、歌词字数是否对得上唱音，并统计各册多少课有旋律；加册名或作品名可只查一册（如 `pep-g8s2`），再加 `--show` 打印音符，`--missing` 列出还没有旋律的课。`node scripts/check-staff.mjs` 检查每条旋律都能排成五线谱。两个脚本都在 CI 里跑。

以下几课课本上印了谱，但谱是总谱织体、和弦块、纯歌词页或教学图表，配不出单线旋律，页面上说明了原因而不是放一个不准的旋律：七下《大海》《四首海的间奏曲之四》、八下《霓裳羽衣曲》《宛转蛾眉马前死》、三上《滚核桃》（人教版）。

## 6. 质量检查

`package.json` 里的 `quality:*` 脚本，加上 CI 另外直接调用的三个脚本。每条说明都对应脚本源码里的实际断言。

| 命令 | 检查什么 |
|---|---|
| `npm run -s quality:audit` | 已发布教材数据的完整性：关系重复、subject/object 指向缺失、证据缺失；按册打印 `published / candidates / structural`。`quality:check` 是同一个脚本（`scripts/audit-quality.mjs`） |
| `npm run -s quality:p0` | P0 回归保护网：已发布教材齐备、每册实体和关系非空、每条关系都有教材证据，并核对页面源码与 schema 里保留了关键搜索样本 |
| `npm run -s quality:v21` | 规范图谱：融合后的节点/关系数、孤立点、悬空引用、被融合的重复数、连通分量 |
| `npm run -s quality:v22` | 研究分析页：图谱最近邻距离、教材覆盖缺口、证据覆盖率，并核对研究视图还在页面上 |
| `npm run -s quality:v23` | 大图渲染：力导向布局的节点/边数、半径与十二扇区分布，并核对画布的渲染路径 |
| `npm run -s quality:performance` | 首屏体积：`graph-index.json` 相对旧数据的压缩比、节点/边数，以及各册按需文件是否存在 |
| `npm run -s quality:pages` | 发布产物：`dist/client/` 里必需文件、数据文件、JS/CSS chunk 是否齐全（需先构建并跑过 `prepare-github-pages.mjs`） |
| `npm run -s quality:ai` | 本地问答检索：10 个固定问题的意图识别与检索结果，确认只读、不写正式数据 |
| `npm run -s quality:ai-candidate` | 候选知识的边界：确认生成功能关闭，`worker/`、`app/lib/ai/`、`app/api/ask/` 都不写正式数据 |
| `npm run -s quality:explorer` | 知识图谱页：示例查询的聚焦实体、十类筛选、schema 边与字面属性，并确认数据没被改动 |
| `npm run -s quality:constellation` | 节点详情页：1428 个 `details/CAN_*.json` 与规范图谱逐条一致，无孤立点和悬空引用 |
| `npm run lint`、`npx tsc --noEmit -p .` | ESLint（Next 预设）与 TypeScript 类型检查 |
| `node scripts/audit-ai-worker.mjs`、`node scripts/check-melodies.mjs`、`node scripts/check-staff.mjs` | AI 接口的数据校验（拒绝重复 id 与悬空引用）；旋律数据校验与统计（每小节时值、歌词字数、各册多少课有可播放旋律）；每条旋律都能排成五线谱 |
| **目前跑不通的一条** | `quality:rebuild` 要从外部提取目录重建 `music-graph.json` / `canonical-graph.json`，该目录不在仓库里。要么补齐来源，要么删掉（原来的 `quality:v3` 已删除） |

审计脚本是功能保护网，不要为了让检查通过去改它们。

## 7. 部署

推送到 `main`（或在 Actions 页面手动触发）后，`.github/workflows/pages.yml` 依次执行：

1. `npm ci`
2. 质量检查：`npm run lint` → `quality:audit` → `quality:p0` → `quality:v21` → `quality:v22` → `quality:v23` → `quality:performance` → `node scripts/audit-ai-worker.mjs` → `quality:ai` → `quality:ai-candidate` → `node scripts/check-melodies.mjs` → `node scripts/check-staff.mjs`
3. 静态构建（带上第 2 节的三个环境变量）
4. `node scripts/prepare-github-pages.mjs`
5. `npm run quality:pages`
6. 依次构建另外三个版本：`node scripts/build-edition.mjs renjiao`、`renyin-staff`、`renjiao-staff`，产物放进 `dist/client/<各自的网址前缀>/`。仓库变量 `PUBLISH_RENJIAO` 设为 `false` 会撤下人教版及其五线谱，`PUBLISH_STAFF` 设为 `false` 会撤下两个五线谱版本
7. 把 `dist/client` 上传为 Pages 产物并发布

CI 里同一时间只保留最新一次部署：连续推送时，前一次还没跑完的会被取消（显示 cancelled，不是失败），最新一次包含前面的全部改动。

本地复现第 3–5 步，就是第 2 节「构建 GitHub Pages 版本」里的那段 PowerShell。仓库的合并和推送由项目负责人执行。

## 8. 许可与来源

| 内容 | 许可 | 清单文件 |
|---|---|---|
| 钢琴采样（22 个 MP3） | Salamander Grand Piano，Alexander Holm，CC BY 3.0 | `public/media/instruments/piano/SOURCES.md`，逐文件列出源网址、许可原文链接、下载日期、SHA-256 |
| 木刻插画、首页收尾图、分享图 | 由 AI 图像工具生成，适用 OpenAI Terms of Use | `public/art/SOURCES.md`，含每张图的提示词记录 |
| 标志字标（霞鹜文楷 LXGW WenKai） | SIL Open Font License 1.1 | `public/brand/README.md`、`public/brand/OFL.txt` |
| 界面字体（Geist / Geist Mono） | 由 `next/font/google` 在构建时拉取并内联 | `app/layout.tsx` |
| 教材谱面图 | 来自教材扫描件的裁剪，清单见 `content/textbooks/score-manifest.json` | 同左 |
| 人声录音 | 尚未接入，清单目前是空表 | `public/media/recordings/SOURCES.md` |

新增任何外部素材，都要在对应的 `SOURCES.md` 里补一行：本地文件、来源页、许可名称、许可原文链接、下载日期。

## 9. 智能问答的现状

AI 问答当前为本地检索模式：回答由 `app/lib/ai/` 在浏览器里检索十五册教材数据后生成，会标出依据的教材内容和页码，不调用大模型，页面上也会写明「尚未接入 AI 大模型」（`app/components/assistant/AssistantPage.tsx`）。

`worker/ai-api.ts` 是为将来部署到 Cloudflare Workers 准备的 AI 接口，尚未部署。
