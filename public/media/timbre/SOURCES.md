# 听音色录音

听音训练「听音色」一关里，每件乐器用一段短乐句（1=C：sol mi sol do | la sol mi —，♩=100）。

## 西洋乐器（离线合成）

`piano`、`guitar`、`violin`、`cello`、`flute`、`clarinet`、`trumpet` 七个文件，是用 GeneralUser GS v2.0.3 音色库（许可见 `../instruments/GENERALUSER-GS-LICENSE.txt`）离线合成的。合成用的是 spessasynth_core，脚本在仓库外：`E:\Projects\.tmp\claude\timbre\render-timbre.mjs`。

- 合成后转成单声道，音量统一归一，末尾 0.3 秒淡出，编码成 96 kbps MP3。
- 吉他和大提琴整体降一个八度，长笛整体升一个八度，让每件乐器都落在常用音区。

## 民族乐器和小打击乐器（真实录音）

下面六段来自 Freesound，2026-11-20 下载的是网页上公开的试听 MP3。

处理方法：
- 转成单声道，截取所注的一段。
- 乐句做 0.06 秒淡入、0.45 秒淡出，音量统一归一；单下敲击只取第一下，峰值归一。
- 重新编码成 MP3。

这些处理都属于对原作品的改动，在此注明。截取脚本在仓库外：`E:\Projects\.tmp\claude\timbre\trim.py`。

| 本地文件 | 用在 | 原录音 | 作者 | 许可 |
|---|---|---|---|---|
| `erhu.mp3` | 二胡 | [Erhu sample](https://freesound.org/s/477169/)（练琴录音，取第 6.8–12.8 秒） | irzirgpznj（Freesound 用户） | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `dizi.mp3` | 笛子 | [Dizi_Loop_Carlos Carty_6_Dm_100BPM.wav](https://freesound.org/s/454704/)（全段） | CarlosCarty（Freesound 用户） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `guzheng.mp3` | 古筝 | [GuZheng.wav](https://freesound.org/s/162088/)（中央音乐学院毕业音乐会片段，取第 53.1–59.1 秒） | xserra（Freesound 用户） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `triangle.mp3` | 三角铁 | [Triangle_Open_04](https://freesound.org/s/349504/)（取第一下） | cabled_mess（Freesound 用户） | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `shaker.mp3` | 沙锤 | [Maraca (maraca_shake.wav)](https://freesound.org/s/375707/)（VSCO 2 Community Edition，取第一下） | sgossner（Freesound 用户） | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `tambourine.mp3` | 铃鼓 | [Tambourine_Single_Hit_ 4.wav](https://freesound.org/s/219267/) | radiopassiveboy（Freesound 用户） | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

琵琶暂时没有：Freesound 上没找到 CC0 或 CC BY 许可的琵琶独奏录音（找到的都是非商业许可，或者是合奏）。

## 打击乐器（站内已有录音）

鼓、小锣、大锣、镲、双响筒用的是节奏创编里已有的真实敲击录音，来源见 `../instruments/percussion/SOURCES.md`。

## 文件指纹（SHA-256）

    07ee77e71a02be41e302c2b34e54f52146b7de98b7bd3ff03a9628c32196f1a5  erhu.mp3
    6339c21be184c5b4dadf62fb9a914f5c2931aa20d3c1ed6ab1c2e5ba757108f7  dizi.mp3
    72225fed0d33eb80963d55e836323d0b9ebabac4aad05f3d917cf83cf6f49515  guzheng.mp3
    35493a020e1f044dd4e502cb55c7540dc871f291190ff908714c0d57e923decd  triangle.mp3
    5d6d1a40df8be3a5de27ef3f17617d5384940aedfa45959263dee28b5481bb53  shaker.mp3
    c805ffe6f885ce92593502f208bac5a31b99abe13e929f60b93244d3660bca3c  tambourine.mp3
