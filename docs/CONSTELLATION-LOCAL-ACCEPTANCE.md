# Constellation Focus 与数字教材本地验收

验收日期：2026-09-20。基于 `70228f191c73d18009ea07e86e93c251cea63a2d`，本轮仅完成 P0 + P1，未推送远端。

## 已完成

- 保留白色主题及既有 Sigma / Graphology 场景。选择、筛选、Drawer 导航不替换 Graphology 实例，不重新运行 ForceAtlas2。
- 单击进入 Constellation Focus：选中双环、一跳突出、二跳弱化、其他节点透明度 0.05；相机平滑定位。路径优先，六种关系族使用低饱和色。
- 四级语义缩放，标签候选上限 28 / 80 / 160 / 260；选中、悬停、一跳和路径优先。Overview 仅突出 440 条结构候选边，其余关系保留并极弱化。
- 拖拽结束保存坐标；固定、取消固定、恢复布局位置互相独立。取消固定不丢失拖拽位置。移除重复同步绘制，Graphology 更新自行安排 Sigma 重绘。
- 双击或“查看知识”打开独立滚动的 KnowledgeDetailDrawer，桌面宽度 clamp(520px, 40vw, 760px)。1366px 下侧栏临时收窄，关闭 Drawer 后恢复，图谱持续可见。
- 作品、人物、概念/要素、地域文化分别使用已有事实组织模板；没有信息的项目明确留空。保留证据、教材位置、跨册关联、教学应用和原问答入口。
- 关联实体跳转同步更新 Graph 与 Drawer，支持前后历史；详情按需读取并缓存（最多 96 个条目），异常或缺失时使用图谱基本页面。
- `build-entity-details.mjs` 在构建时将现有 canonical entity、relationships、occurrences 原样投影至 1337 个详情 JSON；无 AI 生成、无教材事实改写。派生文件不纳入 Git，完整构建会自动生成。
- 现有图片、音频、视频与乐谱链接可展示，无新增媒体或外部服务。

## 数据边界

规范实体 1337，规范关系 4661，孤立 0，悬空 0。1337 个详情文件的实体、关系和来源均逐项与 canonical 数据比较相等。

原始教材、规范图谱及质量数据没有变化；构建产生的 graph-index 时间戳和布局计时变化已还原。`git diff -- public/data` 为空。

现有数据没有“蒙古族 → 长调”的直接关系，因此没有创建这条关系。界面只提供数据中实际存在的关联导航。

## 自动检查

通过 `npm run lint`、`tsc --noEmit`、`npm run build`、Pages artifact 准备，以及以下全部质量入口：

`quality:check`、`quality:audit`、`quality:p0`、`quality:v21`、`quality:v22`、`quality:v23`、`quality:pages`、`quality:performance`、`quality:v3`、`quality:ai`、`quality:ai-candidate`、`quality:explorer`、`quality:constellation`。

既有 `browser-graph-explorer.mjs` 20 组 Chromium 回归通过。双击验收已按本轮需求从“展开关系”更新为“打开知识详情”；右键一跳/二跳保持不变。

新增 `browser-constellation.mjs` 7 组专项通过，覆盖九个指定实体、四级缩放、按需请求、缓存、历史、拖拽/固定/恢复、实例稳定、缺失详情基础页、刷新及 1920/1366/390px 布局。Console 0 错误，HTTP 0 错误。

## 实测

浏览器：Microsoft Edge Chromium 153.0.4234.32，生产静态导出，1920×1080。

| 指标 | 实测 |
| --- | --- |
| 首次图谱可交互（专项最后一次） | 1967 ms |
| 首屏节点标签 / 关系文字 | 7 / 0 |
| 连续拖拽绘制 FPS | 59.6 |
| 浏览器动画帧 FPS | 60.0 |
| 连续缩放绘制 FPS（回归采样） | 59.0 |
| 静止 1 秒额外重绘 | 0 |
| Sigma 场景 DOM 元素 | 9 |
| 回归结束堆内存快照 | 47 MB |
| 专项结束堆内存快照 | 86.5 MB |
| 1366px Drawer / 剩余画布宽度 | 546.4 / 717.6 px |

连续拖拽使用真实 Chromium、Playwright mouse down/up 与页面 requestAnimationFrame 驱动的连续 mousemove，2.5 秒内记录 Sigma afterRender 次数；选中实体的图坐标变化与松手保留另行断言。逐条 Playwright 命令的拖拽测试还记录了 28.6 次绘制/秒，其中包含命令往返和人工等待，不作为连续输入 FPS。内存为快照，不是长期泄漏试验。

## 本地查看与复现

预览：`http://127.0.0.1:4174/lezhi-music-graph/`。

以 `GITHUB_PAGES=true`、`NEXT_PUBLIC_STATIC_EXPORT=1`、`NEXT_PUBLIC_BASE_PATH=/lezhi-music-graph` 构建，执行 `node scripts/prepare-github-pages.mjs`，静态服务目录为 `dist/client`。

报告及截图保存在工作区 `output/constellation-acceptance` 和 `output/graph-explorer-acceptance`。本轮不部署 GitHub，不继续 GPT 或候选知识开发。
