# 打击乐音色采样

四物乐、鸭子拌嘴等打击乐节奏谱里，小锣、大锣、圆鼓、长鼓、小镲、大镲、双响筒各声部用下面的真实录音单音播放（`app/lib/lesson/percussion.ts`）；录音还没载入完或载入失败时，改用代码合成的近似音色。

每个文件都是原录音的单次敲击：只留第一下，转成单声道，削去开头的静音，音量归一到 −1 dBFS，末尾做了 40 毫秒淡出，再编码成 96 kbps MP3。这属于对原作品的改动，已在此注明。

| 本地文件 | 用在 | 原录音 | 作者 | 许可 | 下载日期 |
|---|---|---|---|---|---|
| `xiaoluo.mp3` | 小锣 | [xiaoluo_65](https://freesound.org/s/222361/)（京剧小锣） | ajaysm（Freesound 用户） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | 2026-10-27 |
| `daluo.mp3` | 大锣 | [daluo_50](https://freesound.org/s/222237/)（京剧大锣） | ajaysm（Freesound 用户） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | 2026-10-27 |
| `naobo.mp3` | 小镲、大镲（用不同的音高和余音长度） | [naobo_62](https://freesound.org/s/222298/)（京剧铙钹） | ajaysm（Freesound 用户） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | 2026-10-27 |
| `bangu.mp3` | 长鼓（稍降低音高） | [bangu_59](https://freesound.org/s/222189/)（京剧板鼓） | ajaysm（Freesound 用户） | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | 2026-10-27 |
| `frame.mp3` | 圆鼓 | [Frame drum_oneshot_RAW_13.wav](https://freesound.org/s/345636/)（深音框鼓） | cabled_mess | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | 2026-10-27 |
| `block.mp3` | 双响筒 | [Small wood Block.wav](https://freesound.org/s/530437/)（木鱼块；只取原文件里的第一下） | Noted451 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | 2026-10-27 |

京剧打击乐的四个单音是同一位 Freesound 用户 ajaysm 上传的同一批录音，原页面标签写着 beijing-opera、compmusic、icassp2014-dataset（我们只知道这些标签，没有核实它们背后的项目或论文，这里不作更多说明）。

这里没有朝鲜族四物乐的真实乐器录音（Freesound 上没有可用的小锣 kkwaenggwari、长鼓 janggu 单音），所以小锣、大锣借用音色最接近的京剧小锣、大锣，圆鼓用深音框鼓，长鼓用降低音高的京剧板鼓。听感是“同类乐器”，不是原乐器。

## 文件指纹（SHA-256）

    1253236c5b9422e9bf2639480e901501a24a1b3355bb5bd98191559fc360a5b1  bangu.mp3
    908f5f7f9b9a57aa153a96d389d0249db9aaf0a50effdd24582d7987339f1213  block.mp3
    9ba426288d820a24b07334b2460238e9319c675c6b3f458fe9e9bb0af9294434  daluo.mp3
    84b4505758f9f2b9ae57b2b5330239c2df1ed269d1667361b483dfc9a0ebe7a4  frame.mp3
    b521e29d47842453174a2b09c160c4c53696b0b5c35c0dbe2581ec67903a2cca  naobo.mp3
    aa90a0eb6ff8919da8c25a96f10e37b19187e7c87a7fc9900113ec56e8ac5c0d  xiaoluo.mp3
