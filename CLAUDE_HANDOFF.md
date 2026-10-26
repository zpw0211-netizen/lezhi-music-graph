# 芽谱项目交接说明

更新于 2026-10-26。只写已经核实过的现状；读代码前先读 `README.md`（技术栈、目录、数据流、部署）。

## 现状

- 只有一个正式分支 `main`，推送后 GitHub Actions（`.github/workflows/pages.yml`）自动质量检查、构建、发布到 GitHub Pages，一次约 4–6 分钟。连续推送时前一次会显示 cancelled，不是失败，最新一次包含全部改动。
- 线上四个站点：人音版 `/renyin/`、人教版 `/renjiao/`、人教版五线谱 `/renjiao-staff/`、人音版五线谱 `/renyin-staff/`。说明见 README「教材版本」。
- 提交前本地至少跑：`npx eslint app/lib/lesson`、`npx tsc --noEmit -p .`、`node scripts/check-melodies.mjs`、`node scripts/check-staff.mjs`（后两个也在 CI 里）。

## 人教版旋律（最近一轮工作）

- 人教版有谱例的作品基本都已转写，数据在 `app/lib/lesson/melodies-pep-g<年级><上下>.ts`，格式和校验见 README「旋律数据」。
- 五课谱例配不出单线旋律（总谱织体、和弦块、纯歌词页、教学图表），页面显示具体原因：七下《大海》《四首海的间奏曲之四》、八下《霓裳羽衣曲》《宛转蛾眉马前死》、三上《滚核桃》。原因文字登记在 `app/lib/lesson/melodies.ts` 的 `NO_MELODY_REASONS`。
- **所有转写都只过了代码检查（时值、歌词字数），没有人在网站上逐首听过。** 转写时把握较低、最该先听的：七下柴可夫斯基《♭b小调第一钢琴协奏曲》、九上莫扎特《A大调第二十三钢琴协奏曲》、八上《图画展览会》（只记和弦最高音）、八下《夕阳箫鼓》第 4 小节长音、二下《四物乐》小锣第 9–10 小节、二上《武松打虎》节奏。
- 打击乐、说唱只有节奏时调写 `"节奏"`、音符用 `9`；课本没给数字速度的，速度是估的，`note` 里写了「播放暂按多少 BPM」。

## 已知问题与待定事项

- `node scripts/test-lib.mjs` 有一项长期失败：「年表作品链接：全量 664 条只链接 records 中可解析的 470 条」（实际 700 条）。它不在 CI 里，不影响发布。年表页计划由项目负责人以后删掉重做，到时这项测试一并处理。
- 仓库里有几个目录看起来是早先的后端尝试，README 写的是「后端：无」，是否还要保留待项目负责人决定：`supabase/`、`db/`、`drizzle/`、`server/`、`worker/`。
- 远程还有一个旧分支 `ui/v5-visual-redesign`，看名字是早先的界面改版，未确认是否可删。
- `editions/renjiao-staff/README.md` 是 T080B 交付时的记录，已在文首加上现状说明；其中「174 张谱例图」与目前目录里的 472 个文件对不上，用 `data/score-activation-audit.json` 前要重新生成。
- 仓库历史约 287MB，主要是图片和音频；人教简谱与人教五线谱之间、人音版五线谱与公共目录之间共有约 213 个相同的图片/音频文件（约 28MB）。去重要改构建脚本，暂未做。
- `.learnings/`（开发笔记）、`.openai/hosting.json`（旧托管配置）、`docs/` 与 `reports/` 里 8 月份的验收和调研报告不是运行所需，可以归档。
