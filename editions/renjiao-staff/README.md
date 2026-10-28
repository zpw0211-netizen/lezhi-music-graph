# 人教版五线谱数据交付（T080B）

> **状态（2026-10-26 更新）：** 下面是 T080B 交付当时的记录，数字和「阶段边界」反映的是当时的情况。现状：
> - 14 册在 `data/books.json` 里已全部 `published: true`，随 CI 以 `/renjiao-staff/` 发布；总开关是仓库变量 `PUBLISH_STAFF` 和 `PUBLISH_RENJIAO`，任一设为 `false` 就撤下本版本（见根目录 `README.md` 第 7 节）。
> - 五线谱的画法已经在应用代码里实现，本版本直接沿用人教版简谱的课程和旋律数据；`node scripts/check-staff.mjs` 校验每条旋律都能排成五线谱。
> - 文中「174 张」是交付时的统计（`data/score-activation-audit.json`）；现在 `public/media/scores/pep-*` 下共有 472 个谱例图文件，两个数字的差异我没有逐一核对原因，用这份审计文件前请先重新生成。

本目录在 `editions/renjiao/` 基础上建立，页面与教材课程数据沿用现有版本。版名与网址入口为 `renjiao-staff`；交付时 14 册保持 `published: false`，避免在五线谱页面接入前对外开放（现已全部发布，见上方状态）。

交付时，工作树已沿用唯一指定的 `github` 远程快进至 `b320747`。从最初核实的 `34a2610` 到此提交之间的更新涉及品牌与人声资源，没有改动 `editions/renjiao` 教材源数据。

## 扫描来源与页码

- 用户提供的 14 册 PDF 位于 `D:/人教版新教材1-9年级（五线谱）/`。PDF 作为外部源文件保留，不复制进仓库；运行脚本可通过 `RENJIAO_STAFF_PDF_DIR` 指定其他位置。
- 已逐册核对封面中的“五线谱”和“人民教育出版社”，并从 PDF 页脚页码序列确认 `pdfOffset`。14 册的主偏移值与基准一致；五年级上册有一个孤立页脚数字无法自动归类，不影响该册连续页码偏移判断。
- `data/books.json` 中的人教五线谱印刷页数已按 PDF 页码更新。与人教简谱页数不同的册次为：一年级上册 84→86、一年级下册 73→75、二年级下册 77→78、五年级上册 56→58。
- `scripts/wx-pep-*.mjs` 为每册生成页码、谱面裁剪框、人教简谱基准页及五线谱页匹配证据；自动匹配前会剥离夹在汉字标题中的拼音。16 项人工判页/视检修正及依据记录在 `data/wx-pep-manual-page-overrides.json`；支持无题名续谱、嵌图中的题名和排除误配练习谱。

## 逐首核对结果

- 共核对 14 册、原目录 468 首/段：387 条题名页码一致，65 条题名唯一定位到新页，16 条人工判页；未定位与歧义均为 0。题名出现页不等同于该曲乐谱页：听赏目录、影视来源名、作曲家简介和无标题练习已在核对表注明。
- 正式 `public/media/scores/pep-*` 有 174 张直接取自五线谱 PDF 的图片，对应 173 个作品裁图映射。原先暂删的《do re mi之歌》、祖国歌曲续页、《红旗颂》三张图均已用五线谱 PDF 重建，未恢复任何旧简谱图片。
- 视检纠正：《do re mi之歌》用一年级上册第30页；《祖国祖国我们爱你》补第23页续谱；《红旗颂》用九年级上册第5页的软件示例嵌图。排除一年级下册《柳树姑娘》第23页和二年级下册《美丽的黄昏》第1页的误配练习图；三年级下册《吉米，来吧》第43页亦明确无歌曲裁图。
- 资源清单及逐文件 SHA-256 为 `data/wx-pep-crop-assets.json`；`data/score-activation-audit.json` 核查 174 个教材图片引用，缺图和孤立图片均为 0，并保留初次清理和后续从五线谱 PDF 重建的记录。
- 谱号与首音表：`E:/Projects/yapu-collab/reviews/T080B/clef-octave.md`。14 册逐项查阅，覆盖原目录 468 首/段，并补入实际署名谱例；共 696 行、585 个册目/作品组合。分声部记录书写音高；没有对应谱面或扫描字形不清的字段保留“待核”，未使用旋律数据补猜。
- 完整逐首差异见 `data/edition-differences.md`；原始比对索引与审计结果分别见 `data/wx-pep-work-index.json`、`data/wx-pep-scan-audit.json`。

## 可重复生成

从仓库根目录运行：

```powershell
$env:RENJIAO_STAFF_PDF_DIR = 'D:\人教版新教材1-9年级（五线谱）'
node editions/renjiao-staff/scripts/build-wx-pep-index.mjs
python editions/renjiao-staff/scripts/audit-wx-pep-scans.py
node editions/renjiao-staff/scripts/build-wx-pep-maps.mjs
python editions/renjiao-staff/scripts/crop-wx-pep-pdfs.py
node editions/renjiao-staff/scripts/activate-staff-scores.mjs
```

## 交付时的阶段边界（已过时，现状见文首）

五线谱画法由 Claude 负责，本任务不合并画法、不制作应用截图。分册仍未发布。正式谱面目录仅保留五线谱扫描的 174 张图片，`data/lesson-scores.json` 与教材模块同步为五线谱页码/裁切映射。没有新建或修改旋律文件，没有安装依赖、推送或部署。
