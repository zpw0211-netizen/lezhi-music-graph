# Learnings

Corrections, insights, and knowledge gaps captured during development.

---

## [LRN-20260827-004] correction

**Logged**: 2026-08-27T00:20:00+08:00
**Priority**: critical
**Status**: pending
**Area**: backend

### Summary
三元组质量门不能只验证置信度、关系白名单、实体类型和证据是否存在，还必须验证证据蕴含、语义去重与事实来源层级。

### Details
用户发现正式图谱中仍有编造与重复关系。当前 exact-key 去重无法合并别名实体、同义关系和跨页重复证据；证据存在也不等于证据支持该断言。教材外补充事实需要与教材事实、模型推断分层，不能混用同一发布状态。

### Suggested Action
增加规范实体 ID、受控谓词映射、证据片段与版面坐标、蕴含判定、矛盾检测、跨页证据聚合和来源层级。模型输出只进入候选层，自动发布仅限规则可验证的显式事实。

### Metadata
- Source: user_feedback
- Related Files: scripts/build-graph-data.mjs, scripts/audit-quality.mjs
- Tags: triple-quality, entailment, semantic-deduplication, provenance, hallucination
- See Also: LRN-20260824-001

---

## [LRN-20260826-003] correction

**Logged**: 2026-08-26T23:55:00+08:00
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
知识点聚焦图应优先呈现核心和一跳关系，不能继续复用全量网络的多跳力导向布局。

### Details
用户以 Neo4j 放射式示例纠正了聚焦模式：中心知识点稳定居中，外围只显示直接相关实体与属性，并保持关系文字可读。AI 助手也应位于全局搜索下方，以单一提问入口和整段答案取代侧栏聊天卡片。

### Suggested Action
全量模式用于探索密集网络；聚焦模式固定为最多 22 条高优先级直接关系的径向布局。问答界面不展示三元组堆栈，只展示综合答案与教材来源。

### Metadata
- Source: user_feedback
- Related Files: app/page.tsx, app/globals.css
- Tags: neo4j, focus-graph, radial-layout, assistant-ui
- See Also: LRN-20260826-002

---

## [LRN-20260826-002] correction

**Logged**: 2026-08-26T23:39:00+08:00
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
密集知识图谱的悬停反馈不能改变节点半径或布局几何，否则用户会感到节点在来回跳动。

### Details
用户明确要求鼠标停在实体圆圈上时图谱保持定格。悬停只应用描边和阴影；仅选中的节点允许稳定放大。同时，与选中节点直接相连的关系线和关系文字需要单独增强，保证教材关系可读。

### Suggested Action
后续所有图谱交互继续遵守“布局不因 hover 改变”的原则，视觉反馈使用颜色、描边、阴影和透明度。

### Metadata
- Source: user_feedback
- Related Files: app/page.tsx, app/globals.css
- Tags: graph, interaction, hover, accessibility

---

## [LRN-20260824-001] correction

**Logged**: 2026-08-24T16:10:00+08:00
**Priority**: high
**Status**: pending
**Area**: backend

### Summary
音乐教材知识图谱不能只依赖页面级实体抽取，必须先建立音乐学本体、受控关系词表和证据约束。

### Details
用户指出生成的三元组杂乱，并给出了定义型、功能型和组成型关系的规范示例，例如“音乐语言—是—艺术手段”“节奏—指—音的长短和强弱”。正确流程应把概念、关系类型、字面值、证据页码分开建模，并合并完全相同的三元组。

### Suggested Action
为六册教材增加关系白名单、实体类型白名单、重复去重、置信度和人工复核队列；先用一册教材生成可审阅的概念型三元组样本，再批量扩展。

### Metadata
- Source: user_feedback
- Related Files: scripts/build-graph-data.mjs, db/schema.ts
- Tags: ontology, triples, music-education, evidence

---
