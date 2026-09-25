# 教材逐页重读进度

流程（每册相同）：
1. 页面图：`../textbook-scan/<key>/read/pNN.jpg`（阅读版）与 `orig/`（裁谱原图）。
2. 逐单元识读，写入 `content/textbooks/<key>.mjs`（按单元 `parts` 追加）。
   事实元组 `[关系, 客体, 客体类型|null, 层级, 教材页码]`；层级 明/谱/归/补。
   `补` = 拓展知识：只写有把握的常识，写完后逐条审阅，拿不准的删除。
3. `node scripts/build-textbook-source.mjs <key>` → `python scripts/crop-scores.py <key>`
   → `python ../textbook-scan/contact_sheet.py <key>` 逐张核对谱例裁剪。
4. `node scripts/build-canonical-graph.mjs && node scripts/build-graph-index.mjs && node scripts/build-entity-details.mjs`，再跑全部 audit。
5. 全部完成后导出六册“拓展知识清单”给用户。

| 册 | key | PDF偏移 | 状态 |
|---|---|---|---|
| 七上 | g7s1 | 8 | 完成：1322 条，56 谱例，拓展 163（已审，删 4） |
| 七下 | g7s2 | 8 | 完成：1178 条，57 谱例，拓展 97（已审） |
| 八上 | g8s1 | 8 | 完成：942 条，53 谱例，拓展 60（已审） |
| 八下 | g8s2 | 8 | 完成：962 条，56 谱例，拓展 41（已审） |
| 九上 | g9s1 | 8 | 完成：759 条，48 谱例，拓展 36（已审） |
| 九下 | g9s2 | 8 | 完成：714 条，49 谱例，拓展 24（已审） |
