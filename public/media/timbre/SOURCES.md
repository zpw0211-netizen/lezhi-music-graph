# 听音色录音

听音训练「听音色」一关里，每件乐器用一段短乐句（1=C：sol mi sol do | la sol mi —，♩=100）。

## 西洋乐器和部分打击乐器（离线合成）

下面这些文件是用 GeneralUser GS v2.0.3 音色库离线合成的，许可见 `../instruments/GENERALUSER-GS-LICENSE.txt`。

- 第一批（2026-11-20）：`piano`、`guitar`、`violin`、`cello`、`flute`、`clarinet`、`trumpet`。
- 第二批（2026-11-21）：
  - `accordion`、`harp`、`contrabass`
  - `recorder`、`oboe`、`saxophone`、`horn`、`trombone`、`tuba`
  - 打击乐器 `timpani`、`xylophone`、`snare`、`castanets`

合成用的是 spessasynth_core，脚本在仓库外：
- 第一批：`E:\Projects\.tmp\claude\timbre\render-timbre.mjs`
- 第二批：`E:\Projects\.tmp\claude\timbre\render-timbre2.mjs`

处理方法：
- 合成后转成单声道，音量统一归一，末尾 0.3 秒淡出，编码成 96 kbps MP3。
- 为了让每件乐器都落在常用音区，整段移了八度：

  | 移动 | 乐器 |
  |---|---|
  | 降一个八度 | 吉他、大提琴、圆号、长号、萨克斯（中音萨克斯音色） |
  | 降两个八度 | 大号、低音提琴、定音鼓 |
  | 升一个八度 | 长笛、竖笛、木琴 |

- 小军鼓、响板用音色库里的鼓组，只合成一下敲击，取 0.6 秒，峰值归一。页面里按节奏型重复播放。

## 民族乐器和小打击乐器（真实录音）

下面这些录音来自 Freesound，下载的是网页上公开的试听 MP3：
- 二胡、笛子、古筝、三角铁、沙锤、铃鼓：2026-11-20 下载。
- 琵琶、葫芦丝、箫、马头琴、古琴、木鱼：2026-11-21 下载。

处理方法：
- 转成单声道，截取所注的一段。
- 乐句做 0.06 秒淡入、0.45 秒淡出，音量统一归一。
- 单下敲击只取第一下，峰值归一。
- 重新编码成 MP3。

这些处理都属于对原作品的改动，在此注明。截取脚本在仓库外：
- 第一批：`E:\Projects\.tmp\claude\timbre\trim.py`
- 第二批：`E:\Projects\.tmp\claude\timbre\trim2.py`

| 本地文件 | 用在 | 原录音 | 作者 | 许可 |
|---|---|---|---|---|
| `erhu.mp3` | 二胡 | [Erhu sample](https://freesound.org/s/477169/)（练琴录音，取第 6.8–12.8 秒） | irzirgpznj（Freesound 用户） | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `dizi.mp3` | 笛子 | [Dizi_Loop_Carlos Carty_6_Dm_100BPM.wav](https://freesound.org/s/454704/)（全段） | CarlosCarty（Freesound 用户） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `guzheng.mp3` | 古筝 | [GuZheng.wav](https://freesound.org/s/162088/)（中央音乐学院毕业音乐会片段，取第 53.1–59.1 秒） | xserra（Freesound 用户） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `pipa.mp3` | 琵琶 | [Pipa-3.wav](https://freesound.org/s/162085/)（中央音乐学院琵琶毕业独奏会片段，取第 17.8–23.8 秒） | xserra（Freesound 用户） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `xiao.mp3` | 箫 | [xiao-1.wav](https://freesound.org/s/161912/)（中国音乐学院学生演奏，取第 0.5–6.5 秒） | xserra（Freesound 用户） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `guqin.mp3` | 古琴 | [guqin-concert-2.wav](https://freesound.org/s/162029/)（北京音乐会片段，取第 271.1–277.1 秒） | xserra（Freesound 用户） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `hulusi.mp3` | 葫芦丝 | [Chinese flute Hulusi](https://freesound.org/s/180239/)（取第 1.5–7.5 秒） | iluppai（Freesound 用户） | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `matouqin.mp3` | 马头琴 | [morin khuur.wav](https://freesound.org/s/677538/)（全段） | Олег Ястребов（Oleg Yastrebov，Freesound 用户 Qleq） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `muyu.mp3` | 木鱼 | [Fischtrommel_Muyu.mp3](https://freesound.org/s/205999/)（取第 1.67 秒起的第一下） | the_very_Real_Horst（Freesound 用户） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `triangle.mp3` | 三角铁 | [Triangle_Open_04](https://freesound.org/s/349504/)（取第一下） | cabled_mess（Freesound 用户） | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `shaker.mp3` | 沙锤 | [Maraca (maraca_shake.wav)](https://freesound.org/s/375707/)（VSCO 2 Community Edition，取第一下） | sgossner（Freesound 用户） | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `tambourine.mp3` | 铃鼓 | [Tambourine_Single_Hit_ 4.wav](https://freesound.org/s/219267/) | radiopassiveboy（Freesound 用户） | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

## 打击乐器（站内已有录音）

鼓、小锣、大锣、镲、双响筒用的是节奏创编里已有的真实敲击录音，来源见 `../instruments/percussion/SOURCES.md`。

## 文件指纹（SHA-256）

真实录音截取后的文件：

    07ee77e71a02be41e302c2b34e54f52146b7de98b7bd3ff03a9628c32196f1a5  erhu.mp3
    6339c21be184c5b4dadf62fb9a914f5c2931aa20d3c1ed6ab1c2e5ba757108f7  dizi.mp3
    72225fed0d33eb80963d55e836323d0b9ebabac4aad05f3d917cf83cf6f49515  guzheng.mp3
    b30c36bf5e2dd439787397b3edce79a87db6da681daf6cac89554cab63c5df44  pipa.mp3
    8c08d4fa94f61395950c3f604c735aba7f521d3c9cb1959dc972ea005b3228fd  xiao.mp3
    3d405a5d92dd4ff5f64c725af0c65c2a76e7bfab81e5e4613b2f36ecaa57229c  guqin.mp3
    e737d661d20c4c105198ffb03c92f2905d05a11d119cde85320817556c1c65b5  hulusi.mp3
    ae258946b79892267c9c818199e3dc0b2153ed54f8f0ffbfedd55f01b8b39e6c  matouqin.mp3
    7b2f92d83ebf3affd0f35308d438bf17a54417b91bc53bfdc4400141cb44da19  muyu.mp3
    35493a020e1f044dd4e502cb55c7540dc871f291190ff908714c0d57e923decd  triangle.mp3
    5d6d1a40df8be3a5de27ef3f17617d5384940aedfa45959263dee28b5481bb53  shaker.mp3
    c805ffe6f885ce92593502f208bac5a31b99abe13e929f60b93244d3660bca3c  tambourine.mp3

第二批合成的文件：

    418bfae4b5be3a7d4939a61e915f7c913dc897941fe78a26c8e6b317778a20e4  snare.mp3
    af24dc1873a701a03621d9db54f54fe74794b8f187470919e6b8060a84ccacea  castanets.mp3
    e53dc248d64c526d9d3c7c4b0ff3b56b74740f784f570f21282617783d7db383  timpani.mp3
    825963413e0714fc7427447c0ee239628c4b1b5f4181b2a7b229668effb072a1  xylophone.mp3
    07f22399791a5beb20a686bc62c87b244c593cede7ac51c51015148ca8dfa537  accordion.mp3
    2e2078c2bab0a8c7e08a21420d1e82882cdbe4a92593022591edc82a6556bfde  harp.mp3
    068430fa6bc85a9edf3d5ae7cb210bfa44b2ac211a7ddcdb4b1475915dff8006  contrabass.mp3
    8a35da61045698dc77d4272fc1c9f447182bcbaac58878df584460f1e860fcd0  recorder.mp3
    c985688a84acc563bf67f37055d6f41ddada27d22b2dee323ae90413a9d0fa5a  oboe.mp3
    072831792ea3b4229338d0b15b049afcfa28ab84db5b15ca6b7c0019e01a76b3  saxophone.mp3
    4ebdabf50ce248fda10d698b2d0e01a454b7a3e12f3232b14123072dbd2ce281  horn.mp3
    d76d5fe13ca95669fcb0507b722a41b8a961f3a32c3eb4043df5d2d108208701  trombone.mp3
    224ef2da4880071e32823ba322aa80498007028a19b96599e075a657ce0c8ede  tuba.mp3
