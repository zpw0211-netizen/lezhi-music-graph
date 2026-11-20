# 听音色录音

听音训练「听音色」一关里，每件乐器用一段短乐句（1=C：sol mi sol do | la sol mi —，♩=100）。

## 西洋乐器（离线合成）

`piano`、`guitar`、`violin`、`cello`、`flute`、`clarinet`、`trumpet` 七个文件，是用 GeneralUser GS v2.0.3 音色库（许可见 `../instruments/GENERALUSER-GS-LICENSE.txt`）离线合成的。合成用的是 spessasynth_core，脚本在仓库外：`E:\Projects\.tmp\claude\timbre\render-timbre.mjs`。

- 合成后转成单声道，音量统一归一，末尾 0.3 秒淡出，编码成 96 kbps MP3。
- 吉他和大提琴整体降一个八度，长笛整体升一个八度，让每件乐器都落在常用音区。

## 打击乐器

不在这个文件夹里。打击乐器直接用节奏创编里已有的真实敲击录音，来源见 `../instruments/percussion/SOURCES.md`。
