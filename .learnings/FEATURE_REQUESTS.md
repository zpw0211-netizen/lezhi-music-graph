# Feature Requests

User-requested capabilities captured during development.

---

## [FEAT-20260910-001] professional_graph_explorer_sigma

**Logged**: 2026-09-10T10:00:00+08:00
**Priority**: high
**Status**: in_progress
**Area**: frontend

### Requested Capability
Upgrade the existing six-book graph explorer to a Neo4j Bloom-class research workspace with a Sigma/WebGL renderer, focus interaction, path finding, perspectives, richer search and inspector behavior.

### User Context
The graph is a graduation-research platform and must preserve all canonical textbook data, evidence, quality audits, single-book views and GitHub Pages deployment.

### Complexity Estimate
complex

### Suggested Implementation
Reuse Graphology and precomputed ForceAtlas2 positions, add Sigma 3 as the primary Full Graph renderer with the Canvas renderer retained as fallback, and extract workspace concerns into typed components, hooks and graph utilities.

### Metadata
- Frequency: recurring
- Related Features: Full Graph, Canonical Entity, Evidence, Research Analysis

---

## [FEAT-20260826-002] server-side GPT graph synthesis

**Logged**: 2026-08-26T23:55:00+08:00
**Priority**: high
**Status**: implemented
**Area**: backend

### Requested Capability
让图谱助手通过 GPT 将多条知识图谱关系组织成逻辑连贯的回答，并支持上下文追问，而不是复制单条三元组。

### User Context
该功能是毕业设计中的教学问答入口，需要面向教师和学生提供自然、可追溯且不脱离教材的解释。

### Complexity Estimate
complex

### Suggested Implementation
在服务端调用 OpenAI Responses API，将检索到的教材关系和 PDF 页码作为唯一证据上下文；密钥缺失或接口失败时回退到确定性的图谱逻辑回答。

### Metadata
- Frequency: first_time
- Related Features: grounded graph assistant

---

## [FEAT-20260826-001] grounded graph assistant

**Logged**: 2026-08-26T23:39:00+08:00
**Priority**: high
**Status**: implemented
**Area**: frontend

### Requested Capability
在知识图谱搜索区旁加入 AI 助手，只依据六册教材图谱内容回答问题，并能定位回答所依据的知识点。

### Implementation
实现本地图谱检索式问答，识别作品、人物、乐理概念与常用关系意图；答案展示三元组、教材名称和 PDF 页码，不命中时明确拒绝脱离教材作答。

### Metadata
- Source: user_feedback
- Related Files: app/page.tsx, app/globals.css
- Tags: grounded-ai, knowledge-graph, evidence, education

---
