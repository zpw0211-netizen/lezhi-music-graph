# 芽谱六册全景性能 P0 报告

测试日期：2026-08-28
数据规模：规范节点 1,337；规范关系 4,661；“全部关系”当前可见关系 4,482。

## 基线与优化结果

| 指标 | 优化前（线上 SVG） | 优化后（本地静态生产构建） | 变化 |
|---|---:|---:|---:|
| 首屏到全景可见 | 3,420 ms | 1,390 ms | -59.4% |
| 首屏图谱 JSON | 10,496,842 B | 2,286,026 B | -78.2% |
| 图谱区域 DOM | 13,476 | 26 | -99.8% |
| 整页 DOM | 14,125 | 675 | -95.2% |
| 默认关系文字 | 0 | 0 | 保持 LOD |
| Full Graph FPS | 顶层 React 每 90 ms 强制整图更新，交互不稳定 | 48.4 FPS | Canvas 分层实测 |
| JS Heap | 浏览器基线环境不提供该指标 | 41.2 MB | Chrome `performance.memory` |
| 可见节点 | 1,337 | 1,337 | 未减少 |
| 可见关系 | 4,482 | 4,482 | 未减少 |

首屏数据结构的 Node.js 七次解析基线：`music-graph.json` 平均 26.8 ms，`canonical-graph.json` 平均 114.8 ms；优化后浏览器仅解析 `graph-index.json`。线上与本地首屏时间受网络环境差异影响，发布后应继续用相同公共网址复测。

## 已完成 P0

- P0-1：保存网络、DOM、节点/边规模和交互基线，并定位顶层动画、SVG DOM 与大 JSON 三个瓶颈。
- P0-2：Full Graph 默认不生成关系文字；悬停、用户选中、局部高亮和近景按 LOD 显示，并设置 18 / 56 / 160 三级上限。
- P0-3：使用缓存的 `entityMap`、`entityIdSet`、`adjacencyMap`、`edgeMap` 和 `degreeMap`；一至三跳从邻接表读取。
- P0-4：Full Graph 独立为 memoized Canvas Scene；悬停、慢速运动和拖拽不再用页面顶层 React 状态逐帧重渲染。
- P0-5：首屏改为 `graph-index.json`；`details/{bookKey}.json` 与 `evidence/{bookKey}.json` 按需加载并缓存。
- P0-6：六册全景布局在构建期生成并写入索引；图运行时索引使用 WeakMap 缓存。
- P0-7：Canvas 按视口裁剪节点和边；远/中/近景采用不同节点与关系文字密度。
- P0-8：原 SVG 在 1,337 节点、4,482 边时产生 13,132 个 SVG 子元素，超过目标规模后仍构成交互瓶颈。
- P0-9：仅迁移六册 Full Graph 到分层 Canvas 2D；单册、聚焦、Inspector、证据、搜索和 Schema UI 保持原实现。

## 回归检查

- 六册切换与六册叠加：通过。
- 全量节点/关系统计：通过，1,337 / 4,482。
- 搜索并定位“节奏”：通过。
- Full Graph 二跳：只高亮已存在子图，不复制节点或关系。
- 单册图谱：继续使用 SVG，节点拖拽、缩放与聚焦保留。
- 教材证据：点击证据页签后加载，实测出现 30 条证据卡片；相同册次不重复请求。
- 质量审计：`quality:audit`、`quality:p0`、`quality:v21`、生产构建和 GitHub Pages basePath 审计全部通过。
