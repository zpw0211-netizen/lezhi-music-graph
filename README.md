# 芽谱

面向中学师生的数字音乐教材网站，覆盖人音版七至九年级六册（简谱版）。学生按课看谱、听旋律、学知识点；老师上课时能整屏展示；研究者可以看六册教材之间的知识关联。

页面上的内容都来自教材数据：教材里明确写出的是「教材知识」，教材之外的补充单独标注为「拓展知识」，不确定的内容不写。

线上地址：<https://zpw0211-netizen.github.io/lezhi-music-graph/>

## 1. 技术栈

| 项 | 说明 |
|---|---|
| 框架 | Next.js 16 App Router，由 vinext 1.0（Vite 实现的 Next 兼容层）构建；React 19；TypeScript 5.9 |
| 形态 | 整站是**一个静态导出页面**（`app/page.tsx`），页面切换走 URL 井号 |
| 图谱渲染 | Sigma.js（WebGL）为主，Canvas 2D / SVG 作回退 |
| 部署 | GitHub Pages 的 `/lezhi-music-graph/` 子路径，推送到 `main` 由 `.github/workflows/pages.yml` 发布 |
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

`npm run build` 依次跑 `scripts/build-graph-index.mjs`、`scripts/build-entity-details.mjs`、`scripts/build-units.mjs`（单元篇章数据 `public/data/units.json`）、`scripts/build-atlas.mjs`（音乐地图与年表数据 `atlas.json`、`timeline.json`）、`vinext build`，产物在 `dist/`。

**如果 `npm run dev` 报 `There was an access violation in the runtime` / `MiniflareCoreError [ERR_RUNTIME_FAILURE]`**：vinext 的开发服务器要启动 Cloudflare Workers 运行时（workerd），这个报错是本机缺少最新的 [Microsoft Visual C++ 运行库](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)。装好运行库再试；不想装也可以直接用上面的 `npm run build` + `npx vinext start` 预览。

### 两个必须记住的坑

1. **构建一律用 PowerShell，不要用 Git Bash。** Git Bash 会把 `/lezhi-music-graph` 这类参数改写成 `D:/Git/lezhi-music-graph`，构建出来的站点读不到数据和样式。
2. **`npm run build` 会重写 `public/data` 下 19 个生成文件**（`books/` 6 个、`details/` 6 个、`evidence/` 6 个、`graph-index.json`）。提交前一律 `git restore public/data`。

### 构建 GitHub Pages 版本

页面所在的子路径和「没有后端」的假设由三个环境变量控制：

```powershell
$env:GITHUB_PAGES = "true"
$env:NEXT_PUBLIC_STATIC_EXPORT = "1"
$env:NEXT_PUBLIC_BASE_PATH = "/lezhi-music-graph"
npm run build
node scripts/prepare-github-pages.mjs
npm run -s quality:pages
git restore public/data
```

| 环境变量 | 取值 | 作用 |
|---|---|---|
| `GITHUB_PAGES` | `true` | 打开静态导出（`output: "export"`）、`assetPrefix`、`trailingSlash`（`next.config.ts`） |
| `NEXT_PUBLIC_STATIC_EXPORT` | `1` | 前端按「没有后端」的模式运行（`app/lib/app/assets.ts`） |
| `NEXT_PUBLIC_BASE_PATH` | `/lezhi-music-graph` | 所有数据和媒体 URL 的子路径前缀 |

这个模式下的产物在 `dist/client/lezhi-music-graph/`，要把**这个目录当作站点根目录**来预览：`npx vinext start` 提供的是根路径产物，子路径布局下 `/lezhi-music-graph/` 返回 404（已实测）。

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
| `content/textbooks/` | 六册教材源数据（`g7s1.mjs` … `g9s2.mjs`）、流程说明 `PROGRESS.md`、谱例清单 `score-manifest.json` |
| `public/data/` | 构建生成的网站数据，见第 5 节 |
| `public/media/` | 钢琴采样（`instruments/piano/`）、教材谱面图（`scores/<册>/`）、人声录音（`recordings/`，目前为空） |
| `public/art/`、`public/brand/` | 木刻插画与标志、字标字体许可（`SOURCES.md`、`README.md`、`OFL.txt`）；另有 `public/favicon.svg`、`public/og.jpg` |
| `scripts/` | 数据构建与审计脚本（`audit-*.mjs` 是功能保护网）；`scripts/lib/` 共用工具，`scripts/brand/` 重建标志的 Python 脚本 |
| `.github/workflows/pages.yml` | 推送 `main` 后的审计、构建与发布流程 |
| `worker/`、`server/`、`db/`、`drizzle/`、`docs/`、`reports/` | 未部署的 AI 接口、原 Cloudflare 导入接口与数据库定义；历史验收记录与审计报告 |

## 4. 路由

整站是一个静态导出页面，页面状态放在 URL 井号里（解析和生成都在 `app/lib/app/routing.ts`）。链接可以分享，刷新不丢页，前进后退可用。

| 地址 | 页面 |
|---|---|
| `/`（无井号） | 首页 |
| `#/records`、`#/records/g7s1` | 按课学习：六册目录 / 指定某一册 |
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
| `public/data/graph-index.json` | 首屏（`app/layout.tsx` 预加载，`app/hooks/useGraphIndex.ts` 读取） | 全站索引：六册目录与规范图谱，约 2.0 MB |
| `public/data/books/<册>.json` | 打开某一册时按需加载（`useBookData`） | 该册的实体、关系、教材证据；按册懒加载，首页用不到 |
| `public/data/evidence/<册>.json` | 需要引用教材原文时按需加载 | 逐条关系的教材证据：页码、原文，以及是「教材明确」还是「根据教材归纳」 |
| `public/data/details/CAN_<id>.json` | 点开某个知识节点时按需加载（`app/lib/graph/knowledge-detail.ts`） | 单个规范实体的阅读页：实体、出现位置、关系；构建生成，不入库 |
| `public/data/details/<册>.json` | 站点不读 | 册级明细；`quality:performance` 用它确认按需文件存在 |
| `public/data/music-graph.json`、`canonical-graph.json` | 站点不读 | 构建输入与审计用；`scripts/prepare-github-pages.mjs` 会在发布产物里剔除这两个大文件 |

## 6. 质量检查

`package.json` 里的 `quality:*` 脚本，加上 CI 另外直接调用的三个脚本。每条说明都对应脚本源码里的实际断言。

| 命令 | 检查什么 |
|---|---|
| `npm run -s quality:audit` | 六册数据自身的完整性：关系重复、subject/object 指向缺失、证据缺失；按册打印 `published / candidates / structural`。`quality:check` 是同一个脚本（`scripts/audit-quality.mjs`） |
| `npm run -s quality:p0` | P0 回归保护网：六册齐备、每册实体和关系非空、每条关系都有教材证据，并核对页面源码与 schema 里保留了关键搜索样本 |
| `npm run -s quality:v21` | 规范图谱：融合后的节点/关系数、孤立点、悬空引用、被融合的重复数、连通分量 |
| `npm run -s quality:v22` | 研究分析页：图谱最近邻距离、教材覆盖缺口、证据覆盖率，并核对研究视图还在页面上 |
| `npm run -s quality:v23` | 大图渲染：力导向布局的节点/边数、半径与十二扇区分布，并核对画布的渲染路径 |
| `npm run -s quality:performance` | 首屏体积：`graph-index.json` 相对旧数据的压缩比、节点/边数，以及各册按需文件是否存在 |
| `npm run -s quality:pages` | 发布产物：`dist/client/lezhi-music-graph/` 里必需文件、数据文件、JS/CSS chunk 是否齐全（需先构建并跑过 `prepare-github-pages.mjs`） |
| `npm run -s quality:ai` | 本地问答检索：10 个固定问题的意图识别与检索结果，确认只读、不写正式数据 |
| `npm run -s quality:ai-candidate` | 候选知识的边界：确认生成功能关闭，`worker/`、`app/lib/ai/`、`app/api/ask/` 都不写正式数据 |
| `npm run -s quality:explorer` | 知识图谱页：示例查询的聚焦实体、十类筛选、schema 边与字面属性，并确认数据没被改动 |
| `npm run -s quality:constellation` | 节点详情页：1428 个 `details/CAN_*.json` 与规范图谱逐条一致，无孤立点和悬空引用 |
| `npm run lint`、`npx tsc --noEmit -p .` | ESLint（Next 预设）与 TypeScript 类型检查 |
| `node scripts/audit-ai-worker.mjs`、`node scripts/check-melodies.mjs` | AI 接口的数据校验（六册齐备，拒绝重复 id 与悬空引用）；旋律数据统计（各册多少课有可播放旋律） |
| **目前跑不通的两条** | `quality:rebuild` 要从外部提取目录重建 `music-graph.json` / `canonical-graph.json`，该目录不在仓库里；`quality:v3` 是早期的图谱页验收脚本，三条断言指向已重构掉的代码，CI 未使用。这两条要么补齐来源/更新断言，要么删掉 |

审计脚本是功能保护网，不要为了让检查通过去改它们。

## 7. 部署

推送到 `main`（或在 Actions 页面手动触发）后，`.github/workflows/pages.yml` 依次执行：

1. `npm ci`
2. 质量检查：`npm run lint` → `quality:audit` → `quality:p0` → `quality:v21` → `quality:v22` → `quality:v23` → `quality:performance` → `node scripts/audit-ai-worker.mjs` → `quality:ai` → `quality:ai-candidate` → `node scripts/check-melodies.mjs`
3. 静态构建（带上第 2 节的三个环境变量）
4. `node scripts/prepare-github-pages.mjs`
5. `npm run quality:pages`
6. 把 `dist/client/lezhi-music-graph` 上传为 Pages 产物并发布

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

AI 问答当前为本地检索模式：回答由 `app/lib/ai/` 在浏览器里检索六册教材数据后生成，会标出依据的教材内容和页码，不调用大模型，页面上也会写明「尚未接入 AI 大模型」（`app/components/assistant/AssistantPage.tsx`）。

`worker/ai-api.ts` 是为将来部署到 Cloudflare Workers 准备的 AI 接口，尚未部署。
