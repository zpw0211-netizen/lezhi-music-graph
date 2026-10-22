# 人教版五线谱数据底稿（T080B 第一步）

本目录在 `editions/renjiao/` 基础上建立，页面与教材课程数据沿用现有版本。版名与网址入口为 `renjiao-staff`；14 册仍保持 `published: false`，避免在五线谱页面接入前对外开放。

工作树已沿用唯一指定的 `github` 远程快进至 `b320747`。从最初核实的 `34a2610` 到此提交之间的更新涉及品牌与人声资源，没有改动 `editions/renjiao` 教材源数据。

## 扫描来源与页码

- 用户提供的 14 册 PDF 位于 `D:/人教版新教材1-9年级（五线谱）/`。PDF 作为外部源文件保留，不复制进仓库；运行脚本可通过 `RENJIAO_STAFF_PDF_DIR` 指定其他位置。
- 已逐册核对封面中的“五线谱”和“人民教育出版社”，并从 PDF 页脚页码序列确认 `pdfOffset`。14 册的主偏移值与基准一致；五年级上册有一个孤立页脚数字无法自动归类，不影响该册连续页码偏移判断。
- `data/books.json` 中的人教五线谱印刷页数已按 PDF 页码更新。与人教简谱页数不同的册次为：一年级上册 84→86、一年级下册 73→75、二年级下册 77→78、五年级上册 56→58。
- `scripts/wx-pep-*.mjs` 为每册生成页码、谱面裁剪框、人教简谱基准页及五线谱页匹配证据；自动匹配前会剥离夹在汉字标题中的拼音，避免误报漏项。8 个重复提及较多的项目已按作品页、复习页区分，判页依据记录在 `data/wx-pep-manual-page-overrides.json`。

## 逐首核对结果

- 共核对 14 册、468 首/段作品：391 条页码一致，66 条可唯一定位到五线谱新页，10 条人工区分作品页与复习/活动提及；目前有 1 条未能在扫描文本中定位：九年级上册《红旗颂》。该扫描册的第 5 页已是“一个人的音乐工程”，在整册 PDF 文本层均未找到《红旗颂》，因此不沿用简谱页图，也不自动指定五线谱页。
- 173 个作品裁图映射已通过扫描页文本核验，五线谱截图统一用近整页范围，避免沿用简谱版局部裁剪框截断新谱面。图像保存在 `public/media/staff-score-crops/pep-*`，不会覆盖复制进来的简谱图片；资源清单为 `data/wx-pep-crop-assets.json`。没有可靠扫描页的旧裁图映射不会生成图像。
- 完整逐首差异见 `data/edition-differences.md`；原始比对索引与审计结果分别见 `data/wx-pep-work-index.json`、`data/wx-pep-scan-audit.json`。

## 可重复生成

从仓库根目录运行：

```powershell
$env:RENJIAO_STAFF_PDF_DIR = 'D:\人教版新教材1-9年级（五线谱）'
node editions/renjiao-staff/scripts/build-wx-pep-index.mjs
python editions/renjiao-staff/scripts/audit-wx-pep-scans.py
node editions/renjiao-staff/scripts/build-wx-pep-maps.mjs
node editions/renjiao-staff/scripts/build-wx-pep-index.mjs
python editions/renjiao-staff/scripts/audit-wx-pep-scans.py
node editions/renjiao-staff/scripts/build-wx-pep-maps.mjs
python editions/renjiao-staff/scripts/crop-wx-pep-pdfs.py
```

## 阶段边界

本轮只做扫描整理、页码/裁图映射和逐首差异核对。所有五线谱分册仍未发布。五线谱画法合并与课程页预览截图属于 T080B 第二步，等 T080A 报告给出 commit 后再开始；预览截图按要求使用 Claude 提供的版本。
