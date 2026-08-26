# Learnings

Corrections, insights, and knowledge gaps captured during development.

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
