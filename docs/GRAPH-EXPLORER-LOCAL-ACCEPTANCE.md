# 芽谱 Graph Explorer 本地验收

日期：2026-09-16。基线提交：6369f1c807c20cca9efc77736dd68ff5a8416501。
保留白色极简主题、Sigma WebGL、Canvas 2D 回退与现有教材知识数据。本轮仅本地验收与提交，未推送或部署 GitHub，也未接通 GPT。

## 修改文件与组件

- app/components/graph/GraphSidebar.tsx：品牌、四项导航、296px 左栏与 56px 折叠栏；移动端为限高可滚动控制区。
- app/components/graph/EntityTypeFilter.tsx：默认展开，使用统一 semantic palette 和规范实体动态统计；多选、全部显示 / 隐藏、仅此。
- app/components/graph/RelationshipFilter.tsx：默认折叠，中文关系数量降序、关系样式、显示 / 隐藏、仅此和恢复。
- app/components/graph/PropertyFilter.tsx：教材、年级、学期、类别、跨册、置信度、教材明确证据与一跳相关知识的交集筛选。
- app/components/graph/SchemaExplorer.tsx：10 个实体类别节点与类别关系聚合；不是规范实例图。173 种类别关系组合，点击类别或关系返回实例视图。
- app/components/graph/SmartGraphQuery.tsx：自然语言生成结构化探索动作，并结合 Graph + Evidence 检索展示本地解释。
- app/components/assistant/NodeAIInterpretation.tsx：Inspector 概览中的节点解读入口与自动提问。
- app/components/assistant/PendingKnowledge.tsx、app/lib/ai/pending-candidates.ts：严格校验 pending 候选的展示合同；本轮不生成候选、不实现确认或写入。
- app/hooks/useGraphFilters.ts：组合筛选与缓存的教材证据按需读取。
- app/hooks/useGraphActions.ts、app/lib/graph/graph-actions.ts：九种 GraphAction 的整批校验与执行；拒绝未知动作、额外字段和不存在的实体 / 关系 / 教材。
- app/lib/graph/graph-schema-analysis.ts：动态类别、关系与 Schema 边统计。
- app/components/graph/SigmaGraphScene.tsx：保留完整 Graphology 图，使用 reducer / hidden 控制可见性；拖拽更新属性，不重建图。修正相机随拖拽移动与松手误触点击；释放全局鼠标监听器。
- app/lib/graph/graph-algorithms.ts：多跳聚焦支持可见节点 / 关系集合，不沿被过滤的边高亮。
- app/components/assistant/AssistantPage.tsx：Inspector 自动提问、回答跳转和安全候选展示。
- app/page.tsx：接入组件与共享状态，删除旧内联侧栏；搜索、路径与研究定位会清除不相容的新筛选。文件净减少约 180 行。
- app/graph-explorer.css、app/layout.tsx：仅增加白色探索面板样式，保持当前产品主题。
- scripts/audit-p0-regression.mjs：组件拆分后从实际组件检查同一功能，不继续匹配已删除的旧 class。
- scripts/audit-graph-explorer.mjs、scripts/browser-graph-explorer.mjs、package.json：增加规则、数据安全与可重复真实浏览器验收。

## 功能验收

Playwright / Chromium（Microsoft Edge）生产静态站点：
http://127.0.0.1:4174/lezhi-music-graph/

20 组自动化浏览器检查通过，覆盖：
实体筛选、关系筛选、属性交集、证据按需读取、四种 Perspective、侧栏展开与收起、Schema 返回实例、七个自然语言示例、回答联动、Inspector 自动提问、节点搜索、悬停、右键、拖拽、二跳、背景恢复、双击展开、Path Finder、Canvas 回退、单册 / 六册切换以及 1920×1080、1366×768、390×844。

Console 未处理异常：0。Console error：0。HTTP 400+ / 核心资源 404：0。
GitHub Pages 子路径下的 JS、CSS、JSON、动态 Sigma chunk 正常加载。

### 筛选实际结果

以下是当前数据的结果，而不是硬编码 UI 数字：

| 操作 | 可见实体 | 可见实体关系 |
| --- | ---: | ---: |
| 默认综合知识 | 1331 | 2660 |
| 只看音乐人物 | 244 | 0 |
| 只看作曲关系 | 255 | 147 |
| 显示八年级音乐作品 | 69 | 2 |
| 只看蒙古族音乐 | 5 | 4 |
| 查找进行曲相关作品 | 10 | 9 |
| 显示节奏相关知识 | 122 | 212 |
| 八年级 + 音乐作品 + 蒙古族相关 | 0 | 0 |
| 八年级 + 音乐作品 + 节奏相关 | 35 | 0 |

仅显示音乐人物 / 音乐作品时，其他类型的关系端点被隐藏，关系减少是合法筛选结果，不是删除数据。
当前没有八年级蒙古族相关作品记录，显示诚实的空结果提示，不补造实体。
“学习进阶”当前没有经证据确认的关系，显示证据边界提示；没有自动创建前置、复现或深化关系。

### GraphAction 与路径

支持 focus_entities、filter_entity_types、filter_relationship_types、filter_books、find_path、expand_neighbors、switch_perspective、highlight_entities、highlight_relationships。
所有动作先验证整批再执行，AI 不直接操作 DOM，不修改 canonical graph。

七个要求示例均通过真实浏览器测试。
《牧歌》→蒙古族、《保卫黄河》→冼星海均找到 1 跳路径。
Full Graph 二跳只高亮，不复制实体或关系。
节点拖拽后在新位置右键仍命中同一实体；Graphology 构建 ID 不变。

本轮智能探索是本地规则解析与 Graph + Evidence 检索，不是 GPT 对话。
候选知识只是安全展示组件；实际候选生成和审批 / 写入流程仍未启用。

## 实测性能

最终浏览器自动化采样：

| 指标 | 实测 |
| --- | ---: |
| 首次图谱可交互 | 1825 ms |
| 连续滚轮采样窗口 | 3234 ms |
| 实际 Sigma 绘制次数 | 171 |
| 连续滚轮实际绘制速率 | 52.9 FPS |
| 静止 1 秒额外绘制次数 | 0 |
| JS heap used 快照 | 45.7 MB |
| JS heap allocated 快照 | 104 MB |
| WebGL Scene DOM 子元素 | 9 |
| Graphology 完整实体 | 1337 |
| Graphology 实体间关系 | 4482 |

FPS 使用 Sigma afterRender 事件计数，不将空转 requestAnimationFrame 当成图谱绘制。
内存是完成交互与按需证据加载后的快照，不是长期内存压力测试结论。
优化前源码将 visibleNodes / visibleRelationships / draggedPositions 纳入 Graphology 构建依赖；本轮过滤与拖拽全过程构建 ID 保持不变。
未对旧版独立采样 FPS，因此不声明 FPS 提升比例。

## 数据安全与发布检查

规范实体：1337。规范关系：4661。孤立规范节点：0。悬空关系：0。
其中 4482 条有实体目标，179 条为字面属性；字面属性仍保留，不虚构目标节点。
默认知识网络隐藏教材来源，显示 1331 节点 / 2660 实体关系；开启来源时可显示完整实体关系。

构建后逐一比较 graph-index 和 12 份 details / evidence JSON：
教材知识内容完全一致，仅构建时间戳与 layoutBuildMs 改变。这些构建元数据与行尾差异已恢复，提交不包含 public/data 修改。
用户原有本地日志、打包文件及临时目录均不纳入本轮提交。

通过：

- npm run lint
- TypeScript：tsc --noEmit
- quality:check / quality:p0 / quality:v21 / quality:v22 / quality:v23
- quality:pages / quality:performance / quality:v3
- quality:ai / quality:ai-candidate / quality:explorer
- npm run build（GITHUB_PAGES=true、静态导出、正确 basePath）
- prepare-github-pages 与真实浏览器生产包验收

复现浏览器测试：启动导出的本地站点后运行 node scripts/browser-graph-explorer.mjs。
可通过 EXPLORER_URL 和 PLAYWRIGHT_CHROMIUM_EXECUTABLE 指定地址和 Chromium 可执行文件。
原始结果和截图：工作区 output/graph-explorer-acceptance/browser-report.json、explorer-1920.png、explorer-1366.png、explorer-mobile.png。
最终提交 SHA 见本轮最终回复 / git log -1。本轮完成后停止，不继续大型功能开发。
