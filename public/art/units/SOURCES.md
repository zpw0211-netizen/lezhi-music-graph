# T008-art 生成来源与自检

本目录共 36 张交付图，均为 1600×640 WebP（质量 78），每张不超过 180,000 字节。另有 6 个“我的音乐网页”实践单元未配图，见文末跳过清单。

工具：内置 image_gen；模型标识在工具返回信息中不可见，故不臆填。原始 PNG 保存在 E:/Projects/.tmp/codex3/T008-raw/。导出使用仓库已有 sharp，未安装依赖。

提示词记录说明：上一轮保留的 27 张图片没有随任务工件保存逐字提示词。以下为依据现存图片和教材数据重建的完整提示词，明确标注为重建稿，并非原始逐字记录。续做的 9 张记录本轮实际使用的完整提示词；g9s1-u5 另列初稿和定向编辑提示词。

形制参照：马头琴参照 [UNESCO Multimedia Archives](https://www.unesco.org/archives/multimedia/document-3754)；都塔尔参照 [俄罗斯国家音乐博物馆](https://music-museum.ru/collections/expomusic/dutar.html)，库木孜参照 [Hartenberger World Musical Instrument Collection](https://wmic.net/kyrgyzstan-komuz/)；巴拉风共鸣结构参照 [The Metropolitan Museum of Art](https://www.metmuseum.org/art/collection/search/312346)。

## g7s1-u1.webp — 第一单元 祖国颂歌（一）

- 册别/单元主题：七年级上册；歌颂祖国
- 教材作品：《中华人民共和国国歌》、《歌唱祖国》、《彩色的中国》、《领航》、《红旗颂》、《走向复兴》、《我的祖国》
- 生成日期：2026-09-29；工具：内置 image_gen；图片：1600×640；文件大小：121510 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第一单元 祖国颂歌（一） (theme: 歌颂祖国) using its listed music works: 《中华人民共和国国歌》、《歌唱祖国》、《彩色的中国》、《领航》、《红旗颂》、《走向复兴》、《我的祖国》.
Scene/backdrop: A red folded flag, a brass bugle and a music stand beside a broad civic avenue with a distant hall.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：可见军号/号角；管身和喇叭口轮廓清楚，作视觉形态核对。

## g7s1-u2.webp — 第二单元 缤纷舞曲

- 册别/单元主题：七年级上册；舞曲
- 教材作品：《青年友谊圆舞曲》、《溜冰圆舞曲》、《夏夜圆舞曲》、《蓝色多瑙河圆舞曲》、《雷鸣电闪波尔卡》、《第二圆舞曲》
- 生成日期：2026-09-29；工具：内置 image_gen；图片：1600×640；文件大小：90510 B
- 重画次数：1 次
- 重画原因：旧稿道具和建筑细节较多；保留稿更聚焦舞曲场景。旧轮次未留文字原因，此处按两版图像对照作视觉推断。
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第二单元 缤纷舞曲 (theme: 舞曲) using its listed music works: 《青年友谊圆舞曲》、《溜冰圆舞曲》、《夏夜圆舞曲》、《蓝色多瑙河圆舞曲》、《雷鸣电闪波尔卡》、《第二圆舞曲》.
Scene/backdrop: An elegant dance hall with parquet-floor curves, a drum and light musical ornaments, evoking waltz and polka.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：可见定音鼓和悬挂镲；碗形鼓壳、支架与圆片轮廓可辨，作视觉核对。

## g7s1-u3.webp — 第三单元 行进之歌

- 册别/单元主题：七年级上册；进行曲
- 教材作品：《中国人民志愿军战歌》、《中国进行曲》、《婚礼进行曲》、《军队进行曲》、《钢铁洪流进行曲》
- 生成日期：2026-09-29；工具：内置 image_gen；图片：1600×640；文件大小：151882 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第三单元 行进之歌 (theme: 进行曲) using its listed music works: 《中国人民志愿军战歌》、《中国进行曲》、《婚礼进行曲》、《军队进行曲》、《钢铁洪流进行曲》.
Scene/backdrop: A marching avenue with a red banner, snare drum and brass bugles before a civic building.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：以行进队伍和旗帜为主，远处乐器未具体指认；未断言具体器形。

## g7s1-u4.webp — 第四单元 亚洲弦歌

- 册别/单元主题：七年级上册；亚洲音乐
- 教材作品：《阿里郎》、《你呀！你呀》、《深情》、《班内》、《厄尔嘎兹》、《鹦鹉》、《樱花》、《美丽的梭罗河》、《苏丽珂》
- 生成日期：2026-09-29；工具：内置 image_gen；图片：1600×640；文件大小：179956 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第四单元 亚洲弦歌 (theme: 亚洲音乐) using its listed music works: 《阿里郎》、《你呀！你呀》、《深情》、《班内》、《厄尔嘎兹》、《鹦鹉》、《樱花》、《美丽的梭罗河》、《苏丽珂》.
Scene/backdrop: A quiet courtyard with a long-necked plucked Asian string instrument, a double-headed drum and upright bamboo pipes beneath cherry blossoms.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：可见长颈弹拨乐器、桶形鼓和管乐器；只作整体轮廓核对，未断言具体民族乐器型号。

## g7s1-u5.webp — 第五单元 草原牧歌

- 册别/单元主题：七年级上册；蒙古族音乐
- 教材作品：《鸿雁》、《金杯》、《辽阔的草原》、《父亲的草原母亲的河》、《牧歌》、《牧歌（蒙古族民歌）》、《万马奔腾》、《草原夜色美》
- 生成日期：2026-09-29；工具：内置 image_gen；图片：1600×640；文件大小：165324 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第五单元 草原牧歌 (theme: 蒙古族音乐) using its listed music works: 《鸿雁》、《金杯》、《辽阔的草原》、《父亲的草原母亲的河》、《牧歌》、《牧歌（蒙古族民歌）》、《万马奔腾》、《草原夜色美》.
Scene/backdrop: An open grassland with horses, a white ger and a horsehead fiddle with a long neck and trapezoid soundbox.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：马头琴：梯形音箱、长琴颈和马头琴头可辨；外形与 UNESCO 资料对照，弦数细节不清。

## g7s1-u6.webp — 第六单元 美丽家乡

- 册别/单元主题：七年级上册；思乡与家国情怀
- 教材作品：《月之故乡》、《乡愁》、《在希望的田野上》、《故土情》、《台湾风情画》、《客家之歌》、《城墙上跑马》
- 生成日期：2026-09-29；工具：内置 image_gen；图片：1600×640；文件大小：83356 B
- 重画次数：1 次
- 重画原因：旧稿湖岸细节较密；保留稿简化为船、桥与倒影。旧轮次未留文字原因，此处按图像对照推断。
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第六单元 美丽家乡 (theme: 思乡与家国情怀) using its listed music works: 《月之故乡》、《乡愁》、《在希望的田野上》、《故土情》、《台湾风情画》、《客家之歌》、《城墙上跑马》.
Scene/backdrop: A small boat on a lake beneath willow branches and an arched bridge, with the sun reflected on water.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画可辨乐器；无需器形核查。

## 跳过：七年级上册 — 我的音乐网页

- 教材作品：《友谊地久天长》、《红旗飘飘》
- 原因：教材将其列为“我的音乐网页”综合实践，非音乐单元；未生成插画。

## g7s2-u1.webp — 第一单元 祖国颂歌（二）

- 册别/单元主题：七年级下册；歌颂祖国
- 教材作品：《中华人民共和国国歌》、《中国》、《我爱你中华》、《灯火里的中国》、《御风万里》、《祖国，慈祥的母亲》
- 生成日期：2026-09-29；工具：内置 image_gen；图片：1600×640；文件大小：85508 B
- 重画次数：1 次
- 重画原因：旧稿旗帜与乐器较多；保留稿收敛到号角和旗帜。旧轮次未留文字原因，此处按图像对照推断。
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第一单元 祖国颂歌（二） (theme: 歌颂祖国) using its listed music works: 《中华人民共和国国歌》、《中国》、《我爱你中华》、《灯火里的中国》、《御风万里》、《祖国，慈祥的母亲》.
Scene/backdrop: A coiled brass horn and bugle on a low table beside a folded red flag, with a distant civic skyline.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：可见铜管号角；只作整体轮廓目检，未指认具体号型。

## g7s2-u2.webp — 第二单元 梨园撷英

- 册别/单元主题：七年级下册；中国戏曲
- 教材作品：《唱脸谱》、《猛听得金鼓响画角声震》、《甘洒热血写春秋》、《表花》、《儿行千里母担忧》、《姹紫嫣红》
- 生成日期：2026-09-29；工具：内置 image_gen；图片：1600×640；文件大小：148390 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第二单元 梨园撷英 (theme: 中国戏曲) using its listed music works: 《唱脸谱》、《猛听得金鼓响画角声震》、《甘洒热血写春秋》、《表花》、《儿行千里母担忧》、《姹紫嫣红》.
Scene/backdrop: A Chinese opera dressing room with a painted opera mask, embroidered robe, folding screen and curtain.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画乐器；戏曲脸谱为舞台道具，非真人面孔。

## g7s2-u3.webp — 第三单元 序曲赏听

- 册别/单元主题：七年级下册；序曲
- 教材作品：《乘着歌声的翅膀》、《1812序曲》、《第一交响序曲》、《节日序曲》、《卡门序曲》、《斗牛士之歌》
- 生成日期：2026-09-29；工具：内置 image_gen；图片：1600×640；文件大小：110498 B
- 重画次数：1 次
- 重画原因：旧稿包含人物与更多舞台细节；保留稿去掉人物并聚焦乐器。旧轮次未留文字原因，此处按图像对照推断。
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第三单元 序曲赏听 (theme: 序曲) using its listed music works: 《乘着歌声的翅膀》、《1812序曲》、《第一交响序曲》、《节日序曲》、《卡门序曲》、《斗牛士之歌》.
Scene/backdrop: Timpani and a brass horn beside an open blank score on a stage beneath a curtain.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：可见定音鼓和铜管号角；支架、鼓体及喇叭口轮廓可辨，作视觉核对。

## g7s2-u4.webp — 第四单元 欧洲风情

- 册别/单元主题：七年级下册；欧洲音乐
- 教材作品：《桑塔·露琪亚》、《友谊地久天长》、《三套车》、《云雀》、《爱的罗曼斯》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：102660 B
- 重画次数：1 次
- 重画原因：旧稿街景元素较繁；保留稿简化为运河、贡多拉与吉他。旧轮次未留文字原因，此处按图像对照推断。
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第四单元 欧洲风情 (theme: 欧洲音乐) using its listed music works: 《桑塔·露琪亚》、《友谊地久天长》、《三套车》、《云雀》、《爱的罗曼斯》.
Scene/backdrop: A Venetian canal with a gondola and guitar against old waterside buildings.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：可见吉他形拨弦乐器；外观轮廓清楚，未指认特定型号。

## g7s2-u5.webp — 第五单元 天山之音

- 册别/单元主题：七年级下册；新疆少数民族音乐
- 教材作品：《青春舞曲》、《我的金色阿勒泰》、《阳光照耀着塔什库尔干》、《在那银色的月光下》、《歌唱吧，我的库木孜》、《赛乃姆》
- 生成日期：2026-09-29；工具：内置 image_gen；图片：1600×640；文件大小：178890 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第五单元 天山之音 (theme: 新疆少数民族音乐) using its listed music works: 《青春舞曲》、《我的金色阿勒泰》、《阳光照耀着塔什库尔干》、《在那银色的月光下》、《歌唱吧，我的库木孜》、《赛乃姆》.
Scene/backdrop: Two long-necked Central Asian lutes beside a carpet and ger beneath high mountains.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：都塔尔与库木孜均为长颈拨弦乐器；都塔尔长颈、梨形共鸣箱和双弦，库木孜三弦无品形制，已对照音乐博物馆/乐器收藏资料；细节作木刻简化。

## g7s2-u6.webp — 第六单元 舞剧之窗

- 册别/单元主题：七年级下册；中外舞剧音乐
- 教材作品：《军民团结一家亲》、《西班牙舞曲》、《阿妮特拉舞曲》、《飞天仙子》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：66174 B
- 重画次数：1 次
- 重画原因：旧稿静物更多；保留稿聚焦舞台布料与扇子。旧轮次未留文字原因，此处按图像对照推断。
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第六单元 舞剧之窗 (theme: 中外舞剧音乐) using its listed music works: 《军民团结一家亲》、《西班牙舞曲》、《阿妮特拉舞曲》、《飞天仙子》.
Scene/backdrop: A folding fan and red silk on a bamboo mat beside a stage curtain.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画可辨乐器；折扇和丝绸为舞台意象。

## 跳过：七年级下册 — 我的音乐网页

- 教材作品：《京调》、《飞天》
- 原因：教材将其列为“我的音乐网页”综合实践，非音乐单元；未生成插画。

## g8s1-u1.webp — 第一单元 百年风华

- 册别/单元主题：八年级上册；歌颂中国共产党
- 教材作品：《天边有颗闪亮的星》、《南湖的船，党的摇篮》、《没有共产党就没有新中国》、《在灿烂阳光下》、《国际歌》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：101116 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第一单元 百年风华 (theme: 歌颂中国共产党) using its listed music works: 《天边有颗闪亮的星》、《南湖的船，党的摇篮》、《没有共产党就没有新中国》、《在灿烂阳光下》、《国际歌》.
Scene/backdrop: A small river boat carrying folded red cloth beneath willow trees and a low sun.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画可辨乐器；以河船与红布表现主题。

## g8s1-u2.webp — 第二单元 银屏乐声

- 册别/单元主题：八年级上册；影视音乐
- 教材作品：《映山红》、《绒花》、《人世间》、《永志不忘》、《枉凝眉》、《辛德勒的名单》、《眺望你的路》、《打支山歌过横排》、《红区干部好作风》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：168896 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第二单元 银屏乐声 (theme: 影视音乐) using its listed music works: 《映山红》、《绒花》、《人世间》、《永志不忘》、《枉凝眉》、《辛德勒的名单》、《眺望你的路》、《打支山歌过横排》、《红区干部好作风》.
Scene/backdrop: A cinema room with a film reel, blank screen and violin on a table.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：可见小提琴和电影胶片；小提琴的琴身、琴颈与琴弓轮廓可辨，作视觉核对。

## g8s1-u3.webp — 第三单元 经典协奏

- 册别/单元主题：八年级上册；中国协奏曲
- 教材作品：《化蝶》、《梁山伯与祝英台》、《第一小提琴协奏曲》、《唤凤》、《三门峡畅想曲》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：120918 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第三单元 经典协奏 (theme: 中国协奏曲) using its listed music works: 《化蝶》、《梁山伯与祝英台》、《第一小提琴协奏曲》、《唤凤》、《三门峡畅想曲》.
Scene/backdrop: A violin and other orchestral strings beside a score on a flowering riverside table.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：可见弓弦乐器；以小提琴/大提琴类轮廓呈现，未断言特定型号。

## g8s1-u4.webp — 第四单元 非洲鼓乐

- 册别/单元主题：八年级上册；非洲音乐
- 教材作品：《阿伊亚——非洲的灵感》、《非洲的节日》、《鼓乐》、《鼓声》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：109198 B
- 重画次数：1 次
- 重画原因：旧稿装饰性图案更多；保留稿聚焦木键乐器。旧轮次未留文字原因，此处按图像对照推断。
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第四单元 非洲鼓乐 (theme: 非洲音乐) using its listed music works: 《阿伊亚——非洲的灵感》、《非洲的节日》、《鼓乐》、《鼓声》.
Scene/backdrop: A balafon-style wooden-bar instrument on a frame with resonators, plus a shaker and small bell.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：可见木键与共鸣腔构成的巴拉风式木琴；整体结构对照博物馆资料，图中共鸣腔为简化形，不断言材质。

## g8s1-u5.webp — 第五单元 国乐飘香（一）

- 册别/单元主题：八年级上册；中国民族器乐
- 教材作品：《彩云追月》、《二泉映月》、《姑苏行》、《十面埋伏》、《百鸟朝凤》、《战台风》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：88772 B
- 重画次数：1 次
- 重画原因：旧稿包含较多园林与飞鸟元素；保留稿聚焦拨弦乐器。旧轮次未留文字原因，此处按图像对照推断。
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第五单元 国乐飘香（一） (theme: 中国民族器乐) using its listed music works: 《彩云追月》、《二泉映月》、《姑苏行》、《十面埋伏》、《百鸟朝凤》、《战台风》.
Scene/backdrop: A guqin and pipa on a scholar's table before bamboo and a moonlit garden.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：可见古琴与琵琶轮廓；琴体、琴弦与琴颈可辨，作视觉核对，未逐件外部比照。

## g8s1-u6.webp — 第六单元 雅集流韵

- 册别/单元主题：八年级上册；中国古代音乐
- 教材作品：《阳关三叠》、《梅花三弄》、《杏花天影》、《竹枝词》、《韶Ⅱ——为六位国乐演奏家而作》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：156648 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第六单元 雅集流韵 (theme: 中国古代音乐) using its listed music works: 《阳关三叠》、《梅花三弄》、《杏花天影》、《竹枝词》、《韶Ⅱ——为六位国乐演奏家而作》.
Scene/backdrop: An open garden pavilion, falling blossoms and a tea table, with no featured instrument.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画可辨乐器；无需器形核查。

## 跳过：八年级上册 — 我的音乐网页

- 教材作品：《大海啊，故乡》、《菊花台》、《童年》
- 原因：教材将其列为“我的音乐网页”综合实践，非音乐单元；未生成插画。

## g8s2-u1.webp — 第一单元 军歌嘹亮

- 册别/单元主题：八年级下册；军旅歌曲
- 教材作品：《强军战歌》、《人民军队忠于党》、《游击队歌》、《中国人民解放军军歌》、《过雪山草地》、《我爱祖国的蓝天》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：141630 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第一单元 军歌嘹亮 (theme: 军旅歌曲) using its listed music works: 《强军战歌》、《人民军队忠于党》、《游击队歌》、《中国人民解放军军歌》、《过雪山草地》、《我爱祖国的蓝天》.
Scene/backdrop: A snowy mountain trail and red flag above a broad valley, with distant marching silhouettes.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画可辨乐器；以山路与远景队伍表现军旅歌曲。

## g8s2-u2.webp — 第二单元 诗乐相和

- 册别/单元主题：八年级下册；古诗词歌曲
- 教材作品：《但愿人长久》、《沁园春·雪》、《蜀道难》、《秋之歌》、《水调歌头·明月几时有》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：136172 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第二单元 诗乐相和 (theme: 古诗词歌曲) using its listed music works: 《但愿人长久》、《沁园春·雪》、《蜀道难》、《秋之歌》、《水调歌头·明月几时有》.
Scene/backdrop: An open poetry book and bamboo flute by a mountain window.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：可见横吹竹笛轮廓；笛身和吹孔布局以简化线条表现，未指认具体笛种。

## g8s2-u3.webp — 第三单元 交响博览

- 册别/单元主题：八年级下册；欧洲交响音乐
- 教材作品：《念故乡》、《第九（自新大陆）交响曲》、《沃尔塔瓦河》、《大海与辛巴达的船》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：179986 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第三单元 交响博览 (theme: 欧洲交响音乐) using its listed music works: 《念故乡》、《第九（自新大陆）交响曲》、《沃尔塔瓦河》、《大海与辛巴达的船》.
Scene/backdrop: A river landscape with a bridge, boat and blank score-like paper on a table.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画可辨乐器；以河流、船与桥呈现交响音乐的场景联想。

## g8s2-u4.webp — 第四单元 美洲乐声

- 册别/单元主题：八年级下册；美洲音乐
- 教材作品：《红河谷》、《拉库卡拉查》、《凯皮拉的小火车》、《化装舞会》、《飞驰的鹰》、《故乡的亲人》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：90474 B
- 重画次数：1 次
- 重画原因：历史原因未记录；详见回报说明。
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第四单元 美洲乐声 (theme: 美洲音乐) using its listed music works: 《红河谷》、《拉库卡拉查》、《凯皮拉的小火车》、《化装舞会》、《飞驰的鹰》、《故乡的亲人》.
Scene/backdrop: A steam train crossing a high bridge through a tropical American landscape.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画可辨乐器；火车和桥梁为作品意象。

## g8s2-u5.webp — 第五单元 国乐飘香（二）

- 册别/单元主题：八年级下册；中国民族器乐合奏
- 教材作品：《春江花月夜（合唱）》、《春江花月夜》、《雨打芭蕉》、《小放驴》、《欢乐歌》、《老鼠娶亲》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：162370 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第五单元 国乐飘香（二） (theme: 中国民族器乐合奏) using its listed music works: 《春江花月夜（合唱）》、《春江花月夜》、《雨打芭蕉》、《小放驴》、《欢乐歌》、《老鼠娶亲》.
Scene/backdrop: A rain-swept lakeside pavilion with banana leaves and an open blank book.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画可辨乐器；以雨中湖亭与书册表现诗词歌曲。

## g8s2-u6.webp — 第六单元 中国精神

- 册别/单元主题：八年级下册；中国精神
- 教材作品：《军民大生产》、《延安颂》、《在太行山上》、《我为祖国献石油》、《愿亲人早日养好伤》、《公仆赞》、《生死不离》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：170572 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第六单元 中国精神 (theme: 中国精神) using its listed music works: 《军民大生产》、《延安颂》、《在太行山上》、《我为祖国献石油》、《愿亲人早日养好伤》、《公仆赞》、《生死不离》.
Scene/backdrop: A broad agricultural field with a red tractor and distant farm buildings.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画可辨乐器；以田野与拖拉机呼应作品主题。

## 跳过：八年级下册 — 我的音乐网页

- 教材作品：《念故乡（竖笛合奏）》
- 原因：教材将其列为“我的音乐网页”综合实践，非音乐单元；未生成插画。

## g9s1-u1.webp — 第一单元 英雄颂歌

- 册别/单元主题：九年级上册；歌颂英雄
- 教材作品：《念奴娇·追思焦裕禄》、《英雄赞歌》、《永恒的歌谣》、《航天之歌》、《祖国不会忘记》、《英雄颂》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：79442 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第一单元 英雄颂歌 (theme: 歌颂英雄) using its listed music works: 《念奴娇·追思焦裕禄》、《英雄赞歌》、《永恒的歌谣》、《航天之歌》、《祖国不会忘记》、《英雄颂》.
Scene/backdrop: A rocket lifting from a launch field beneath a single star, with distant hills and a red flag.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画可辨乐器；以火箭与星光表现英雄主题。

## g9s1-u2.webp — 第二单元 音画神韵

- 册别/单元主题：九年级上册；音乐与画面
- 教材作品：《我爱你，塞北的雪》、《雪花》、《美丽的喀纳斯湖》、《图画展览会》、《在中亚细亚草原上》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：175826 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第二单元 音画神韵 (theme: 音乐与画面) using its listed music works: 《我爱你，塞北的雪》、《雪花》、《美丽的喀纳斯湖》、《图画展览会》、《在中亚细亚草原上》.
Scene/backdrop: A folding landscape-painting screen and violin on a study table beneath a red sun.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：可见小提琴轮廓；琴身与琴颈可辨，作视觉核对。

## g9s1-u3.webp — 第三单元 华夏之魂

- 册别/单元主题：九年级上册；中华民族精神
- 教材作品：《长城谣》、《长江之歌》、《关山行》、《保卫黄河》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：178198 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：重建稿（上一轮原始提示词未保存）。

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese middle-school music textbook, awaiting human review
Primary request: illustrate the real unit 第三单元 华夏之魂 (theme: 中华民族精神) using its listed music works: 《长城谣》、《长江之歌》、《关山行》、《保卫黄河》.
Scene/backdrop: A riverside landscape with boats, folded scenic panels and traditional string instruments.
Composition and constraints: place the scene on the right two-thirds, keep the left third calm and empty for the title; use only scene details supported by the unit theme; do not add an unverified instrument or a readable mark.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：可见长颈弦乐器轮廓；未指认具体乐器型号，避免作超出图像的断言。

## g9s1-u4.webp — 第四单元 西南情韵

- 册别/单元主题：九年级上册；西南少数民族音乐
- 教材作品：《歌唱美丽的家乡》、《小河淌水》、《布谷催春》、《瑶族舞曲》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：172752 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：本轮实际调用文本。

完整提示词：

```text
Use case: illustration-story
Asset type: wide website chapter-header illustration for a Chinese middle-school music textbook, for later human review
Scene/backdrop: a southern Chinese mountain village among layered rice terraces at dusk, carved ridgelines and a small festival clearing
Subject: a quiet visual evocation of the textbook unit about southwest minority music and the Yao Dance; long flowing red and amber dance ribbons curve only through the right side of the scene, with a few tiny distant dancers shown as simple silhouettes with no visible faces
Style/medium: Chinese woodblock print and screen-print style, hand-carved lines, visible paper grain and slight ink misregistration; flat, editorial forms
Composition/framing: exact 5:2 panoramic banner, intended final size 1600x640; all meaningful subjects confined to the right two-thirds; leave the entire left third as calm warm off-white paper with only very subtle grain, clear negative space for a large chapter title; no border
Color palette: only four spot inks—pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C, amber #E9A83A—on warm off-white paper #F7F3EA
Constraints: no instruments, because the unit's instrument forms are not certain; no faces or face close-ups; no text, letters, pseudo-writing, numbers, watermark, or logo; use correct southern Chinese terraced-village scenery; flat shapes, no gradients, no glow, no neon, no 3D, no photorealism
Avoid: glowing nodes, network lines, sci-fi, holographic, neon, bokeh, lens flare, 3D, CGI, glossy, gradient mesh, generic ink-wash mountains, clip art, emoji, cartoon mascot, text, watermark.
```

- 自检结论：无乐器；梯田村落与舞袖构成主题。无面部特写、无文字，左侧留白和木刻套色自检通过。 乐器/器物形制核对：未画乐器；以梯田村落和舞袖表现单元主题。

## g9s1-u5.webp — 第五单元 戏曲园地

- 册别/单元主题：九年级上册；中国地方戏曲
- 教材作品：《对花》、《谁说女子不如男》、《报花名》、《天上掉下个林妹妹》、《秦腔牌子曲》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：157316 B
- 重画次数：1 次
- 重画原因：初稿含难以可靠辨认的鼓状和弦状道具；定向编辑将它们移除，终稿改为戏台、戏服和折扇。
- 提示词记录：本轮原始提示词与编辑提示词均为实际调用文本。

完整提示词：

```text
初次生成提示词：
Use case: illustration-story. Asset: music-textbook chapter header. Scene: an empty Chinese local-opera stage with a deep vermilion curtain, carved wooden stage rail, embroidered sleeve cloth, a folding fan and small opera percussion at the edge; evoke the unit's varied local-opera excerpts without depicting a performer. Subject: unit “戏曲园地”, whose works include 《对花》, 《谁说女子不如男》, 《报花名》, 《天上掉下个林妹妹》 and 《秦腔牌子曲》. Composition: large stage perspective and props only on the right two-thirds, left third clean and calm. Constraints: no human figures, no masks or face close-ups, no writing on any prop, do not imply a single opera genre for all works. Chinese woodblock print and screen-print style, hand-carved lines, visible warm paper grain and slight ink misregistration; flat editorial forms; only four spot inks—pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C, amber #E9A83A—on warm off-white paper #F7F3EA. No gradients, glow, neon, 3D, photorealism, letters, text, pseudo-writing, numbers, watermark, or logo. Wide 5:2 panorama intended for 1600x640: leave the entire left third quiet warm paper with only subtle grain for title placement; all meaningful subjects stay in the right two-thirds; no border. Avoid glowing nodes, network lines, sci-fi, holographic effects, bokeh, lens flare, glossy surfaces, gradient mesh, generic ink-wash mountains, clip art, emoji, cartoon mascot, text, watermark.

定向编辑提示词（终稿使用）：
Edit Image 1, a Chinese woodblock-print opera stage. Make only one change: remove the small hand drum and the ambiguous tan string-shaped object from the lower-right foreground. Leave that part as empty carved stage ledge with the existing brocade cloth edge. Preserve the red curtain, embroidered sleeve cloth, folding fan, stage rails, lighting, perspective, paper texture, color registration, and the entire left-third title space exactly as they are. Do not add any instrument, person, mask, text, letter, pseudo-writing, number, watermark, or logo. Keep the wide 5:2 panoramic composition and the four-color screen-print appearance.
```

- 自检结论：终稿已移除初稿中难确认的鼓状与弦状道具，只保留空舞台、戏服和折扇；无面孔、无文字，左侧留白通过。因形制不确定，对初稿做 1 次定向编辑。 乐器/器物形制核对：终稿未画乐器；已删除初稿中难确认的鼓状与弦状道具。

## g9s1-u6.webp — 第六单元 多情土地

- 册别/单元主题：九年级上册；对祖国家乡的眷恋
- 教材作品：《美丽的草原我的家》、《花儿一唱天下春》、《那就是我》、《多情的土地》、《北疆南疆》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：167328 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：本轮实际调用文本。

完整提示词：

```text
Use case: illustration-story. Asset: music-textbook chapter header. Scene: a broad northern grassland opening into a river valley and distant southern hills, a modest village and field flowers, with a curving footpath joining the landscapes; evoke attachment to home and land across regional songs. Subject: unit “多情土地” and its works 《美丽的草原我的家》, 《花儿一唱天下春》, 《那就是我》, 《多情的土地》 and 《北疆南疆》. Composition: balanced continuous landscape on the right two-thirds, with no map and a blank quiet paper third at left. Constraints: no instrument because the works do not identify a single instrument; no text or figures. Chinese woodblock print and screen-print style, hand-carved lines, visible warm paper grain and slight ink misregistration; flat editorial forms; only four spot inks—pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C, amber #E9A83A—on warm off-white paper #F7F3EA. No gradients, glow, neon, 3D, photorealism, letters, text, pseudo-writing, numbers, watermark, or logo. Wide 5:2 panorama intended for 1600x640: leave the entire left third quiet warm paper with only subtle grain for title placement; all meaningful subjects stay in the right two-thirds; no border. Avoid glowing nodes, network lines, sci-fi, holographic effects, bokeh, lens flare, glossy surfaces, gradient mesh, generic ink-wash mountains, clip art, emoji, cartoon mascot, text, watermark.
```

- 自检结论：未画乐器；以草原、河谷、村落和田野表现乡土主题；无文字、无人物，左侧留白和木刻套色自检通过。 乐器/器物形制核对：未画乐器；以草原、河谷、村落和田野表现乡土主题。

## 跳过：九年级上册 — 我的音乐网页

- 教材作品：《红河谷（竖笛合奏）》
- 原因：教材将其列为“我的音乐网页”综合实践，非音乐单元；未生成插画。

## g9s2-u1.webp — 第一单元 时代新声

- 册别/单元主题：九年级下册；新时代歌曲
- 教材作品：《我们都是追梦人》、《不忘初心》、《一个都不能少》、《好儿好女好家园》、《共筑中国梦》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：131230 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：本轮实际调用文本。

完整提示词：

```text
Use case: illustration-story. Asset: music-textbook chapter header. Scene: an inviting contemporary concert platform at dawn, one accurate plain stage microphone and a closed piano lid edge beside a blank music stand, with a distant city roofline meeting open fields; no readable sheet marks. Subject: unit “时代新声” and its contemporary songs 《我们都是追梦人》, 《不忘初心》, 《一个都不能少》, 《好儿好女好家园》 and 《共筑中国梦》. Composition: microphone and stage objects grouped at far right, horizon and warm paper breathing room; left third completely calm for a large title. Constraints: no people, slogans, flags, text, or pseudo-letters; keep the mood hopeful and grounded. Chinese woodblock print and screen-print style, hand-carved lines, visible warm paper grain and slight ink misregistration; flat editorial forms; only four spot inks—pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C, amber #E9A83A—on warm off-white paper #F7F3EA. No gradients, glow, neon, 3D, photorealism, letters, text, pseudo-writing, numbers, watermark, or logo. Wide 5:2 panorama intended for 1600x640: leave the entire left third quiet warm paper with only subtle grain for title placement; all meaningful subjects stay in the right two-thirds; no border. Avoid glowing nodes, network lines, sci-fi, holographic effects, bokeh, lens flare, glossy surfaces, gradient mesh, generic ink-wash mountains, clip art, emoji, cartoon mascot, text, watermark.
```

- 自检结论：可见舞台麦克风与支架；轮廓清楚，无人脸、无文字；留白与色彩自检通过。 乐器/器物形制核对：可见标准舞台麦克风与支架，另有钢琴局部；轮廓清楚，作视觉核对。

## g9s2-u2.webp — 第二单元 土地与歌

- 册别/单元主题：九年级下册；汉族民歌
- 教材作品：《无锡景》、《三十里铺》、《龙船调》、《上去高山望平川》、《桃花红 杏花白》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：178456 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：本轮实际调用文本。

完整提示词：

```text
Use case: illustration-story. Asset: music-textbook chapter header. Scene: one connected Chinese landscape evoking regional Han folk songs: a Wuxi waterside canal and small covered boat in front, with distant loess terraces and a high mountain pass fading toward peach and apricot blossoms; restrained, not a collage. Subject: unit “土地与歌” and its folk songs 《无锡景》, 《三十里铺》, 《龙船调》, 《上去高山望平川》 and 《桃花红 杏花白》. Composition: landscape forms occupy the right two-thirds; leave the full left third as quiet warm paper. Constraints: no instruments because these songs do not point to one shared instrument, no people or text. Chinese woodblock print and screen-print style, hand-carved lines, visible warm paper grain and slight ink misregistration; flat editorial forms; only four spot inks—pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C, amber #E9A83A—on warm off-white paper #F7F3EA. No gradients, glow, neon, 3D, photorealism, letters, text, pseudo-writing, numbers, watermark, or logo. Wide 5:2 panorama intended for 1600x640: leave the entire left third quiet warm paper with only subtle grain for title placement; all meaningful subjects stay in the right two-thirds; no border. Avoid glowing nodes, network lines, sci-fi, holographic effects, bokeh, lens flare, glossy surfaces, gradient mesh, generic ink-wash mountains, clip art, emoji, cartoon mascot, text, watermark.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画可辨乐器；以水乡与山地组合表现多地民歌。

## g9s2-u3.webp — 第三单元 歌剧之页

- 册别/单元主题：九年级下册；中外歌剧与音乐剧
- 教材作品：《绣红旗》、《灯火啊，你越拨越亮》、《爱永在》、《大进行曲》、《回忆》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：156960 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：本轮实际调用文本。

完整提示词：

```text
Use case: illustration-story. Asset: music-textbook chapter header. Scene: a richly carved Chinese opera house seen from the wings, a deep red curtain opening onto a bare stage; at the edge, a folded piece of red embroidered cloth references 《绣红旗》, while simple footlights and painted scenery evoke opera and musical theatre without quoting a specific production. Subject: unit “歌剧之页” and its works 《绣红旗》, 《灯火啊，你越拨越亮》, 《爱永在》, 《大进行曲》 and 《回忆》. Composition: theater architecture and curtain occupy the right two-thirds, left third quiet paper for title. Constraints: no actors, faces, masks, readable sheet music, flags with writing, or text. Chinese woodblock print and screen-print style, hand-carved lines, visible warm paper grain and slight ink misregistration; flat editorial forms; only four spot inks—pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C, amber #E9A83A—on warm off-white paper #F7F3EA. No gradients, glow, neon, 3D, photorealism, letters, text, pseudo-writing, numbers, watermark, or logo. Wide 5:2 panorama intended for 1600x640: leave the entire left third quiet warm paper with only subtle grain for title placement; all meaningful subjects stay in the right two-thirds; no border. Avoid glowing nodes, network lines, sci-fi, holographic effects, bokeh, lens flare, glossy surfaces, gradient mesh, generic ink-wash mountains, clip art, emoji, cartoon mascot, text, watermark.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画乐器；以空舞台、红幕与戏剧场景表现歌剧/音乐剧。

## g9s2-u4.webp — 第四单元 雪域天音

- 册别/单元主题：九年级下册；藏族音乐
- 教材作品：《献上最洁白的哈达》、《天路》、《阿玛勒火》、《正月十五那一天》、《热巴舞曲》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：174556 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：本轮实际调用文本。

完整提示词：

```text
Use case: illustration-story. Asset: music-textbook chapter header. Scene: a high Tibetan plateau pass beneath snow peaks, prayer flags moving in wind above a white khata draped over a low stone railing; a distant open courtyard suggests the rhythm of a Tibetan dance without showing close figures. Subject: unit “雪域天音” and its Tibetan works 《献上最洁白的哈达》, 《天路》, 《阿玛勒火》, 《正月十五那一天》 and 《热巴舞曲》. Composition: keep mountains and flags on the right two-thirds; left third calm warm paper. Constraints: no instruments because the works do not establish a shared instrument, no visible writing on the flags, no faces, no text. Chinese woodblock print and screen-print style, hand-carved lines, visible warm paper grain and slight ink misregistration; flat editorial forms; only four spot inks—pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C, amber #E9A83A—on warm off-white paper #F7F3EA. No gradients, glow, neon, 3D, photorealism, letters, text, pseudo-writing, numbers, watermark, or logo. Wide 5:2 panorama intended for 1600x640: leave the entire left third quiet warm paper with only subtle grain for title placement; all meaningful subjects stay in the right two-thirds; no border. Avoid glowing nodes, network lines, sci-fi, holographic effects, bokeh, lens flare, glossy surfaces, gradient mesh, generic ink-wash mountains, clip art, emoji, cartoon mascot, text, watermark.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画乐器；以高原雪山、哈达和经幡表现藏族音乐。

## g9s2-u5.webp — 第五单元 曲艺佳苑

- 册别/单元主题：九年级下册；中国曲艺音乐
- 教材作品：《前门情思大碗茶》、《丑末寅初》、《蝶恋花·答李淑一》、《布谷鸟儿咕咕叫》、《走马》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：150452 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：本轮实际调用文本。

完整提示词：

```text
Use case: illustration-story. Asset: music-textbook chapter header. Scene: an intimate old Beijing teahouse storytelling corner, an empty wooden performer's stool beside a tea bowl and a small low table with a closed blank booklet; carved lattice window and a quiet stage curtain suggest quyi performance. Subject: unit “曲艺佳苑” and its works 《前门情思大碗茶》, 《丑末寅初》, 《蝶恋花·答李淑一》, 《布谷鸟儿咕咕叫》 and 《走马》. Composition: props and room details grouped at right, full left third empty. Constraints: no instruments because these works span forms and no single instrument is certain; no people, writing, pseudo-letters, or text. Chinese woodblock print and screen-print style, hand-carved lines, visible warm paper grain and slight ink misregistration; flat editorial forms; only four spot inks—pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C, amber #E9A83A—on warm off-white paper #F7F3EA. No gradients, glow, neon, 3D, photorealism, letters, text, pseudo-writing, numbers, watermark, or logo. Wide 5:2 panorama intended for 1600x640: leave the entire left third quiet warm paper with only subtle grain for title placement; all meaningful subjects stay in the right two-thirds; no border. Avoid glowing nodes, network lines, sci-fi, holographic effects, bokeh, lens flare, glossy surfaces, gradient mesh, generic ink-wash mountains, clip art, emoji, cartoon mascot, text, watermark.
```

- 自检结论：逐图检查主题、左侧留白、无文字/伪文字、无面孔特写和木刻套色。 乐器/器物形制核对：未画乐器；以茶馆桌椅和茶碗表现曲艺演出场景。

## g9s2-u6.webp — 第六单元 乐动心弦

- 册别/单元主题：九年级下册；励志与感恩
- 教材作品：《我的未来不是梦》、《爱的奉献》、《C大调前奏曲与赋格》、《第五（命运）交响曲》、《感恩的心》
- 生成日期：2026-09-30；工具：内置 image_gen；图片：1600×640；文件大小：164758 B
- 重画次数：0 次
- 重画原因：无（首稿通过）
- 提示词记录：本轮实际调用文本。

完整提示词：

```text
Use case: illustration-story. Asset: music-textbook chapter header. Scene: an elegant grand piano viewed from its keyboard end, a blank open score on the stand, with a quiet sunlit doorway beyond; a few sprouting leaves beside the piano suggest hope and gratitude. Subject: unit “乐动心弦” and its songs 《我的未来不是梦》, 《爱的奉献》, 《感恩的心》 and classical works C大调前奏曲与赋格 / 第五（命运）交响曲. Composition: piano and doorway on the right two-thirds, left third uncluttered warm paper for a chapter title. Constraints: no readable notes or text, no people or portraits; accurate grand-piano silhouette, keyboard, and raised lid. Chinese woodblock print and screen-print style, hand-carved lines, visible warm paper grain and slight ink misregistration; flat editorial forms; only four spot inks—pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C, amber #E9A83A—on warm off-white paper #F7F3EA. No gradients, glow, neon, 3D, photorealism, letters, text, pseudo-writing, numbers, watermark, or logo. Wide 5:2 panorama intended for 1600x640: leave the entire left third quiet warm paper with only subtle grain for title placement; all meaningful subjects stay in the right two-thirds; no border. Avoid glowing nodes, network lines, sci-fi, holographic effects, bokeh, lens flare, glossy surfaces, gradient mesh, generic ink-wash mountains, clip art, emoji, cartoon mascot, text, watermark.
```

- 自检结论：可见三角钢琴、键盘与抬起的琴盖；外形清楚，无人物或文字；留白和色彩自检通过。 乐器/器物形制核对：可见三角钢琴、键盘与抬起的琴盖；外形清楚，作视觉核对。

## 跳过：九年级下册 — 我的音乐网页

- 教材作品：《送别》
- 原因：教材将其列为“我的音乐网页”综合实践，非音乐单元；未生成插画。

## 跳过的单元

- 七年级上册：我的音乐网页（综合实践，非音乐单元；未生成）
- 七年级下册：我的音乐网页（综合实践，非音乐单元；未生成）
- 八年级上册：我的音乐网页（综合实践，非音乐单元；未生成）
- 八年级下册：我的音乐网页（综合实践，非音乐单元；未生成）
- 九年级上册：我的音乐网页（综合实践，非音乐单元；未生成）
- 九年级下册：我的音乐网页（综合实践，非音乐单元；未生成）


---

# T072 小学九册单元插图（54 张，Codex1，2026-10-14）


本目录交付 54 张单元图，覆盖小学九册（g1s1–g6s1），每册六单元。所有成品为 1600×640 WebP，单张不超过 180,000 字节。原始 PNG 在 `E:\Projects\.tmp\codex1\T072\raw\`（含一张重画初稿备份）。

工具：内置 image_gen；生成模型标识未在工具返回信息中提供，因此不臆测。风格依据 `E:\Projects\yapu-worktrees\primary-merge\public\art\units\SOURCES.md` 中 T008 说明，并目视参考 `g7s1-u1.webp`、`g8s2-u3.webp` 和 `g9s1-u5.webp`。每条提示词中的 “Style/medium and avoid list” 与 T008 原文保持一致。导出使用现有 sharp：`E:\Projects\music-graph-site\node_modules\sharp`；先按质量 78 导出，超出体积限制时自动下调，实际质量范围 66–78。没有运行 npm install，没有修改任何仓库/工作树文件，也没有运行 git。

## 图片记录

## g1s1-u1.webp — 第一单元 好朋友

- 册别：一年级上册
- 教材曲目：《你的名字叫什么？》、《音乐是我好朋友》、《快乐进行曲》、《口哨与小狗》
- 成品：1600×640 WebP，166730 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g1s1-u1.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 一年级上册 第一单元「好朋友」, based only on its listed works: 《你的名字叫什么？》、《音乐是我好朋友》、《快乐进行曲》、《口哨与小狗》.
Scene/backdrop: A quiet schoolyard path in gentle morning light. On the right two-thirds, two young schoolchildren seen from behind walk together with a small friendly dog; a few simple trees and a path suggest a shared playful day. Keep figures small and distant, no face detail. Do not show a whistle or any instrument.
Composition and constraints: make the scene warm and playful for children aged 6–12, but visually restrained and editorial, not cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. No text or mark anywhere.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g1s1-u2.webp — 第二单元 祖国您好

- 册别：一年级上册
- 教材曲目：《中华人民共和国国歌》、《国旗国旗真美丽》、《同唱一首歌》、《我们美丽的祖国》、《颂祖国》、《大雨小雨》
- 成品：1600×640 WebP，152540 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g1s1-u2.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 一年级上册 第二单元 祖国您好, based only on its listed works: 《中华人民共和国国歌》、《国旗国旗真美丽》、《同唱一首歌》、《我们美丽的祖国》、《颂祖国》、《大雨小雨》.
Scene/backdrop: A bright school courtyard after a spring shower: a small group of children seen from behind stand together facing a simple red flag in the distance; rain-washed paving, soft clouds, and a civic avenue suggest greeting the homeland. The flag has no lettering or extra emblem details.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g1s1-u3.webp — 第三单元 快乐的一天

- 册别：一年级上册
- 教材曲目：《其多列》、《跳绳》
- 成品：1600×640 WebP，159164 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g1s1-u3.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 一年级上册 第三单元 快乐的一天, based only on its listed works: 《其多列》、《跳绳》.
Scene/backdrop: Two small children take turns jumping rope on a sunny school path, with a long shadow and a simple schoolyard tree suggesting an active, happy day. Keep the children distant and seen from behind.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


## g1s1-u4.webp — 第四单元 可爱的动物

- 册别：一年级上册
- 教材曲目：《动物说话》、《两只小象》、《小青蛙》、《大象》
- 成品：1600×640 WebP，167908 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g1s1-u4.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 一年级上册 第四单元 可爱的动物, based only on its listed works: 《动物说话》、《两只小象》、《小青蛙》、《大象》.
Scene/backdrop: A calm pond-edge garden with two small elephants walking side by side, a frog on a broad leaf, and a few birds in the branches; friendly animals in a natural landscape, no human figure.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g1s1-u5.webp — 第五单元 爱劳动

- 册别：一年级上册
- 教材曲目：《大家来劳动》、《粉刷匠》、《劳动最光荣》、《三个和尚》、《铁匠波尔卡》
- 成品：1600×640 WebP，153814 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g1s1-u5.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 一年级上册 第五单元 爱劳动, based only on its listed works: 《大家来劳动》、《粉刷匠》、《劳动最光荣》、《三个和尚》、《铁匠波尔卡》.
Scene/backdrop: Children seen at a distance work together in a school garden: one paints a low fence, another sweeps the path, and another carries a small basket. Keep tools simple and ordinary, and the scene orderly and cheerful.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g1s1-u6.webp — 第六单元 过新年

- 册别：一年级上册
- 教材曲目：《龙咚锵》、《新年好》、《春节序曲（片段）》、《小拜年》
- 成品：1600×640 WebP，166566 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g1s1-u6.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 一年级上册 第六单元 过新年, based only on its listed works: 《龙咚锵》、《新年好》、《春节序曲（片段）》、《小拜年》.
Scene/backdrop: A family courtyard prepared for Lunar New Year, with plain red lanterns, a flowering branch, and a table of simple festive treats; a few distant children visit elders from behind. No firework effects or writing on decorations.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g1s2-u1.webp — 第一单元 春天

- 册别：一年级下册
- 教材曲目：《布谷》、《小雨沙沙》、《春晓》、《杜鹃圆舞曲》
- 成品：1600×640 WebP，168396 B，编码质量 76；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g1s2-u1.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 一年级下册 第一单元 春天, based only on its listed works: 《布谷》、《小雨沙沙》、《春晓》、《杜鹃圆舞曲》.
Scene/backdrop: Soft spring rain falls over new green shoots and blossoming branches; a cuckoo-like small bird perches high among the leaves while the path and garden open into fresh morning air.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


## g1s2-u2.webp — 第二单元 童谣

- 册别：一年级下册
- 教材曲目：《牧童谣》、《竹子冒尖尖》、《牧童短笛》、《水牛儿》
- 成品：1600×640 WebP，164954 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g1s2-u2.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 一年级下册 第二单元 童谣, based only on its listed works: 《牧童谣》、《竹子冒尖尖》、《牧童短笛》、《水牛儿》.
Scene/backdrop: New bamboo shoots emerge beside a village path as a small water buffalo grazes and a shepherd child, seen from behind at a distance, walks nearby. Do not show a flute or another instrument.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g1s2-u3.webp — 第三单元 亲又亲

- 册别：一年级下册
- 教材曲目：《雁群飞》、《数鸭子》、《拉勾勾》、《鸭子拌嘴》
- 成品：1600×640 WebP，130842 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g1s2-u3.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 一年级下册 第三单元 亲又亲, based only on its listed works: 《雁群飞》、《数鸭子》、《拉勾勾》、《鸭子拌嘴》.
Scene/backdrop: A pond with a line of ducks paddling together, a flock of geese crossing the open sky, and two children seen from behind standing side by side at the bank; gentle friendship and animal companionship.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g1s2-u4.webp — 第四单元 游戏

- 册别：一年级下册
- 教材曲目：《理发师》、《火车开啦》、《火车波尔卡》、《跳绳》
- 成品：1600×640 WebP，159198 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g1s2-u4.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 一年级下册 第四单元 游戏, based only on its listed works: 《理发师》、《火车开啦》、《火车波尔卡》、《跳绳》.
Scene/backdrop: A playful neighborhood lane with a small toy train rolling along the ground, children jumping rope nearby, and a modest barber's doorway in the background with only a comb and scissors visible; no signboard or lettering.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g1s2-u5.webp — 第五单元 可爱的家

- 册别：一年级下册
- 教材曲目：《小宝宝睡着了》、《我是一个甜果果》、《吉祥三宝》、《摇篮曲》
- 成品：1600×640 WebP，175916 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g1s2-u5.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 一年级下册 第五单元 可爱的家, based only on its listed works: 《小宝宝睡着了》、《我是一个甜果果》、《吉祥三宝》、《摇篮曲》.
Scene/backdrop: A quiet, welcoming home interior: a baby sleeps in a cradle near a window, a fruit bowl rests on a low table, and two family members are seen from behind nearby. Soft domestic warmth, no close faces.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


## g1s2-u6.webp — 第六单元 时间的歌

- 册别：一年级下册
- 教材曲目：《这是什么？》、《时间像小马车》、《在钟表店里》、《调皮的小闹钟》
- 成品：1600×640 WebP，161848 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g1s2-u6.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 一年级下册 第六单元 时间的歌, based only on its listed works: 《这是什么？》、《时间像小马车》、《在钟表店里》、《调皮的小闹钟》.
Scene/backdrop: A tidy clockmaker's room with a large round clock whose face has hands but no numbers, a few smaller clocks, and a small wooden horse cart on a shelf; no labels, writing, or readable dial numerals.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g2s1-u1.webp — 第一单元 幸福的歌

- 册别：二年级上册
- 教材曲目：《中华人民共和国国歌》、《彝家娃娃真幸福》、《乃哟乃》、《阳光下的孩子》、《快乐的罗嗦》
- 成品：1600×640 WebP，151444 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g2s1-u1.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 二年级上册 第一单元 幸福的歌, based only on its listed works: 《中华人民共和国国歌》、《彝家娃娃真幸福》、《乃哟乃》、《阳光下的孩子》、《快乐的罗嗦》.
Scene/backdrop: Children seen from behind dance in a sunny open schoolyard near a small red flag; trees and long morning shadows frame a joyful, communal scene. Avoid specific ethnic costume details.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g2s1-u2.webp — 第二单元 童趣

- 册别：二年级上册
- 教材曲目：《拍皮球》、《打花巴掌》、《小狗圆舞曲》、《跳圆舞曲的小猫》
- 成品：1600×640 WebP，150432 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g2s1-u2.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 二年级上册 第二单元 童趣, based only on its listed works: 《拍皮球》、《打花巴掌》、《小狗圆舞曲》、《跳圆舞曲的小猫》.
Scene/backdrop: In a sunny courtyard, a child bounces a ball while a small dog and cat circle playfully around it; keep the animals and child at a distance, with no face detail.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g2s1-u3.webp — 第三单元 跳起舞

- 册别：二年级上册
- 教材曲目：《小红帽》、《洋娃娃和小熊跳舞》、《糖果仙子舞曲》、《四小天鹅舞曲》
- 成品：1600×640 WebP，176750 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g2s1-u3.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 二年级上册 第三单元 跳起舞, based only on its listed works: 《小红帽》、《洋娃娃和小熊跳舞》、《糖果仙子舞曲》、《四小天鹅舞曲》.
Scene/backdrop: A generic child in a plain red hood dances with a simple teddy bear on a woodland clearing, with a few swan silhouettes on a nearby pond; storybook-like but rendered as restrained editorial woodblock art, not a cartoon.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


## g2s1-u4.webp — 第四单元 小小音乐家

- 册别：二年级上册
- 教材曲目：《箫》、《快乐的小笛子》、《号手与鼓手》、《会跳舞的洋娃娃》、《星光圆舞曲》
- 成品：1600×640 WebP，141074 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g2s1-u4.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 二年级上册 第四单元 小小音乐家, based only on its listed works: 《箫》、《快乐的小笛子》、《号手与鼓手》、《会跳舞的洋娃娃》、《星光圆舞曲》.
Scene/backdrop: A small rehearsal room with a few children seen from behind watching a simple doll turn on a low stage; blank music stands and rhythmic floor shadows imply a young music gathering. Do not depict instruments or written notes.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g2s1-u5.webp — 第五单元 美好的夜

- 册别：二年级上册
- 教材曲目：《闪烁的小星星》、《星光恰恰恰》、《小小的船》、《摇篮曲》、《月亮—油黄的金桔》
- 成品：1600×640 WebP，139114 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g2s1-u5.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 二年级上册 第五单元 美好的夜, based only on its listed works: 《闪烁的小星星》、《星光恰恰恰》、《小小的船》、《摇篮曲》、《月亮—油黄的金桔》.
Scene/backdrop: A crescent moon and stars above a small boat gliding on calm water; at the far right a child sleeps by an open window under a simple blanket, seen from behind and at a distance.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g2s1-u6.webp — 第六单元 新春乐

- 册别：二年级上册
- 教材曲目：《小拜年》、《过新年》、《晚会》
- 成品：1600×640 WebP，158674 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g2s1-u6.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 二年级上册 第六单元 新春乐, based only on its listed works: 《小拜年》、《过新年》、《晚会》.
Scene/backdrop: A cheerful Lunar New Year evening in a courtyard, with plain lanterns, a round table, oranges, and children seen from behind greeting grandparents; no writing on ornaments and no fireworks.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g2s2-u1.webp — 第一单元 绿色的祝福

- 册别：二年级下册
- 教材曲目：《中华人民共和国国歌》、《小树快长高》、《大树妈妈》、《郊游》、《春之歌》、《绿色的祖国》
- 成品：1600×640 WebP，174578 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g2s2-u1.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 二年级下册 第一单元 绿色的祝福, based only on its listed works: 《中华人民共和国国歌》、《小树快长高》、《大树妈妈》、《郊游》、《春之歌》、《绿色的祖国》.
Scene/backdrop: Children plant small saplings beside an older broad-canopy tree in a green spring landscape; a footpath leads toward open fields under a fresh sky. No text or flags.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


## g2s2-u2.webp — 第二单元 难忘的歌

- 册别：二年级下册
- 教材曲目：《共产儿童团歌》、《卖报歌》、《酸枣刺》、《中国少年先锋队队歌》
- 成品：1600×640 WebP，167110 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g2s2-u2.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 二年级下册 第二单元 难忘的歌, based only on its listed works: 《共产儿童团歌》、《卖报歌》、《酸枣刺》、《中国少年先锋队队歌》.
Scene/backdrop: A quiet old-town lane at dawn with a neat bundle of blank newspapers on a low stool and a red scarf draped over a rail; distant small figures walk down the lane, no faces, signs, or printed marks.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g2s2-u3.webp — 第三单元 飞呀飞

- 册别：二年级下册
- 教材曲目：《小蜜蜂》、《飞飞曲》、《蝴蝶》、《蜜蜂》、《采茶扑蝶》
- 成品：1600×640 WebP，147010 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g2s2-u3.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 二年级下册 第三单元 飞呀飞, based only on its listed works: 《小蜜蜂》、《飞飞曲》、《蝴蝶》、《蜜蜂》、《采茶扑蝶》.
Scene/backdrop: Bees and butterflies fly among wildflowers and tea shrubs on a gentle hillside; the composition follows their light movement across the right side without adding people or instruments.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g2s2-u4.webp — 第四单元 美丽家园

- 册别：二年级下册
- 教材曲目：《我的家在日喀则》、《草原上》、《新疆舞曲第一号》、《我是人民小骑兵》
- 成品：1600×640 WebP，148706 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g2s2-u4.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 二年级下册 第四单元 美丽家园, based only on its listed works: 《我的家在日喀则》、《草原上》、《新疆舞曲第一号》、《我是人民小骑兵》.
Scene/backdrop: A broad pastoral landscape with a grazing horse, a river bend, rolling grassland, and distant mountain homes; a tiny rider seen from far behind crosses the open field. Avoid specific cultural costume or architecture.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g2s2-u5.webp — 第五单元 快乐的舞蹈

- 册别：二年级下册
- 教材曲目：《新疆是个好地方》、《金孔雀轻轻跳》、《单簧管波尔卡》、《加伏特舞曲》、《霍拉舞曲》、《阿西里西》
- 成品：1600×640 WebP，163808 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g2s2-u5.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 二年级下册 第五单元 快乐的舞蹈, based only on its listed works: 《新疆是个好地方》、《金孔雀轻轻跳》、《单簧管波尔卡》、《加伏特舞曲》、《霍拉舞曲》、《阿西里西》.
Scene/backdrop: A distant circle of children dancing in an open courtyard, their skirts and simple ribbons making broad rhythmic shapes; no close faces, instruments, or costume claims tied to a specific region.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


## g2s2-u6.webp — 第六单元 龙里格龙

- 册别：二年级下册
- 教材曲目：《龙里格龙》、《大闹天宫（片段）》
- 成品：1600×640 WebP，126728 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g2s2-u6.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 二年级下册 第六单元 龙里格龙, based only on its listed works: 《龙里格龙》、《大闹天宫（片段）》.
Scene/backdrop: A large paper dragon lantern winds above an empty traditional stage with soft cloud-shaped scenery and a distant red curtain, suggesting a lively legendary celebration; no performer close-ups, text, or instrument.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g3s1-u1.webp — 第一单元 我们多么幸福

- 册别：三年级上册
- 教材曲目：《摇啊摇》、《捉迷藏》、《在阳光下》、《我们多么幸福》
- 成品：1600×640 WebP，167236 B，编码质量 76；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g3s1-u1.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 三年级上册 第一单元 我们多么幸福, based only on its listed works: 《摇啊摇》、《捉迷藏》、《在阳光下》、《我们多么幸福》.
Scene/backdrop: Two children play hide-and-seek beside a simple garden swing beneath bright trees; sunlight crosses a quiet path and meadow, creating a carefree childhood scene.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g3s1-u2.webp — 第二单元 劳动的歌

- 册别：三年级上册
- 教材曲目：《舂米歌》、《哈腰挂》、《打麦号子》、《平水号子》、《竖笛练习（一）》、《好伙伴》、《骑上我的小摩托》
- 成品：1600×640 WebP，174672 B，编码质量 76；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g3s1-u2.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 三年级上册 第二单元 劳动的歌, based only on its listed works: 《舂米歌》、《哈腰挂》、《打麦号子》、《平水号子》、《竖笛练习（一）》、《好伙伴》、《骑上我的小摩托》.
Scene/backdrop: Far across a harvested field, several workers carry grain bundles and baskets in a steady shared rhythm; rice and wheat sheaves fill the foreground. No identifiable machine or instrument.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g3s1-u3.webp — 第三单元 丰收歌舞

- 册别：三年级上册
- 教材曲目：《桔梗谣》、《丰收锣鼓》、《丰收歌》、《丰收的节日》
- 成品：1600×640 WebP，177890 B，编码质量 72；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g3s1-u3.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 三年级上册 第三单元 丰收歌舞, based only on its listed works: 《桔梗谣》、《丰收锣鼓》、《丰收歌》、《丰收的节日》.
Scene/backdrop: A harvest celebration among neat grain sheaves and baskets of orchard fruit, with small distant villagers dancing in a clearing; joyful movement, no faces or instruments.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


## g3s1-u4.webp — 第四单元 我爱妈妈

- 册别：三年级上册
- 教材曲目：《妈妈格桑拉》、《妈妈》、《母亲教我的歌》、《快乐五兄弟》、《两把大提琴》、《玛丽有只小羊羔》
- 成品：1600×640 WebP，163848 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g3s1-u4.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 三年级上册 第四单元 我爱妈妈, based only on its listed works: 《妈妈格桑拉》、《妈妈》、《母亲教我的歌》、《快乐五兄弟》、《两把大提琴》、《玛丽有只小羊羔》.
Scene/backdrop: A mother and child seen from behind sit together beneath a tree while a small lamb stands nearby; gentle pastoral setting, no instrument and no close face.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g3s1-u5.webp — 第五单元 钟声

- 册别：三年级上册
- 教材曲目：《音乐小屋》、《钟声叮叮当》、《维也纳的音乐钟》、《美丽的黄昏》、《时钟交响曲》
- 成品：1600×640 WebP，113236 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g3s1-u5.png`
- 重画次数：1 次
- 重画原因：首稿画成与伦敦大本钟相似的钟楼，和曲目《维也纳的音乐钟》不符；定向修改为不指向具体城市的普通中欧钟楼。
- 重画初稿 PNG：`E:\Projects\.tmp\codex1\T072\raw\g3s1-u5-initial.png`

初次生成完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 三年级上册 第五单元 钟声, based only on its listed works: 《音乐小屋》、《钟声叮叮当》、《维也纳的音乐钟》、《美丽的黄昏》、《时钟交响曲》.
Scene/backdrop: A distant clock tower rises above a small European-style town at sunset, with a simple wall clock whose face has no numbers and a few birds in flight; no musical instruments.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

定向重画提示词：

```text
Use case: illustration-story
Edit Image 1, a Chinese woodblock and screen-print chapter illustration for 三年级上册第五单元「钟声」.
Change only the oversized clock tower: replace its unmistakable London Big Ben silhouette with a modest, generic Central European town clock tower that does not resemble any famous landmark. Keep the clock face simple with hands and non-numeric markers only.
Preserve the river town, sunset, birds, rooflines, four-color palette, paper grain, ink registration, 5:2 wide framing, and the entire quiet left-third title area exactly as they are. Keep the clock tower on the right side. No new instruments, people, letters, pseudo-writing, numbers, logos, or watermark.
```

- 自检：复核后钟楼已改为不指向具体城市的普通中欧钟楼，避免初稿的伦敦地标误读。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g3s1-u6.webp — 第六单元 四季童趣

- 册别：三年级上册
- 教材曲目：《西风的话》、《四季童趣》、《捉迷藏（合唱）》、《雪花飞舞》、《秋日素描》、《竖笛练习（5 6 7）》
- 成品：1600×640 WebP，179464 B，编码质量 66；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g3s1-u6.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 三年级上册 第六单元 四季童趣, based only on its listed works: 《西风的话》、《四季童趣》、《捉迷藏（合唱）》、《雪花飞舞》、《秋日素描》、《竖笛练习（5 6 7）》.
Scene/backdrop: One large tree and a winding path move through four seasonal panels: spring buds, summer shade, autumn leaves, and winter snow; tiny children play along the path, seen only at a distance.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


## g3s2-u1.webp — 第一单元 爱祖国

- 册别：三年级下册
- 教材曲目：《祖国祖国我们爱你》、《思乡曲》、《卢沟谣》、《只怕不抵抗》、《竖笛练习（一）》、《闪烁的小星星》、《手指伸展练习》
- 成品：1600×640 WebP，146934 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g3s2-u1.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 三年级下册 第一单元 爱祖国, based only on its listed works: 《祖国祖国我们爱你》、《思乡曲》、《卢沟谣》、《只怕不抵抗》、《竖笛练习（一）》、《闪烁的小星星》、《手指伸展练习》.
Scene/backdrop: Children seen from behind look across a broad river-and-field landscape at dawn, with a small red flag on a distant rise; no lettering or military imagery.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g3s2-u2.webp — 第二单元 空山鸟语

- 册别：三年级下册
- 教材曲目：《顽皮的杜鹃》、《空山鸟语》、《荫中鸟》、《一只鸟仔》、《竖笛练习（二）》、《顽皮的杜鹃（口风琴合奏）》
- 成品：1600×640 WebP，179676 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g3s2-u2.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 三年级下册 第二单元 空山鸟语, based only on its listed works: 《顽皮的杜鹃》、《空山鸟语》、《荫中鸟》、《一只鸟仔》、《竖笛练习（二）》、《顽皮的杜鹃（口风琴合奏）》.
Scene/backdrop: A quiet mountain forest of pine and bamboo opens into a distant valley; several small birds fly between branches, with a stream below. No instruments or human figures.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g3s2-u3.webp — 第三单元 春之声

- 册别：三年级下册
- 教材曲目：《柳树姑娘》、《春》、《嘀哩嘀哩》、《春天来了（片段）》
- 成品：1600×640 WebP，169548 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g3s2-u3.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 三年级下册 第三单元 春之声, based only on its listed works: 《柳树姑娘》、《春》、《嘀哩嘀哩》、《春天来了（片段）》.
Scene/backdrop: Fresh willow branches sweep over a spring path with blossoms and young grass; two children run in the distance beneath a broad open sky.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g3s2-u4.webp — 第四单元 师生情

- 册别：三年级下册
- 教材曲目：《甜甜的秘密》、《苔》、《每当我走过老师窗前》、《书简舞（片段）》
- 成品：1600×640 WebP，138550 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g3s2-u4.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 三年级下册 第四单元 师生情, based only on its listed works: 《甜甜的秘密》、《苔》、《每当我走过老师窗前》、《书简舞（片段）》.
Scene/backdrop: A teacher and several students, seen from behind and far away, tend small plants in a school garden beside a warm classroom window; no faces or written notes.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


## g3s2-u5.webp — 第五单元 京腔京韵

- 册别：三年级下册
- 教材曲目：《唱脸谱》、《京调》
- 成品：1600×640 WebP，169420 B，编码质量 74；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g3s2-u5.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 三年级下册 第五单元 京腔京韵, based only on its listed works: 《唱脸谱》、《京调》.
Scene/backdrop: An empty Beijing-opera stage with a folded embroidered robe, painted opera mask placed small in the background, and deep red curtains; no actor, no close face, no text or pseudo-writing.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g3s2-u6.webp — 第六单元 音乐会

- 册别：三年级下册
- 教材曲目：《金蛇狂舞》、《我是小音乐家》、《春天举行音乐会》、《回声》、《口风琴练习》、《星光恰恰恰》
- 成品：1600×640 WebP，130538 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g3s2-u6.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 三年级下册 第六单元 音乐会, based only on its listed works: 《金蛇狂舞》、《我是小音乐家》、《春天举行音乐会》、《回声》、《口风琴练习》、《星光恰恰恰》.
Scene/backdrop: A modest school concert hall viewed from the back of the audience, with a small stage, curtain, and distant child performers as silhouettes; no visible instruments or readable sheet music.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g4s1-u1.webp — 第一单元 歌唱祖国

- 册别：四年级上册
- 教材曲目：《中华人民共和国国歌》、《阳光牵着我的手》、《中国，中国，鲜红的太阳永不落》、《钢铁洪流进行曲》、《歌唱祖国》
- 成品：1600×640 WebP，134264 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g4s1-u1.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 四年级上册 第一单元 歌唱祖国, based only on its listed works: 《中华人民共和国国歌》、《阳光牵着我的手》、《中国，中国，鲜红的太阳永不落》、《钢铁洪流进行曲》、《歌唱祖国》.
Scene/backdrop: A broad sunrise over a civic square, with a distant group of children seen from behind and a plain red banner moving gently in the wind; grounded, hopeful, no slogans or military equipment.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g4s1-u2.webp — 第二单元 民歌寻趣

- 册别：四年级上册
- 教材曲目：《杨柳青》、《杨柳青青》、《猜调》、《摇船调》、《数蛤蟆》、《雪绒花》、《春游去》、《祝你生日快乐》
- 成品：1600×640 WebP，170792 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g4s1-u2.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 四年级上册 第二单元 民歌寻趣, based only on its listed works: 《杨柳青》、《杨柳青青》、《猜调》、《摇船调》、《数蛤蟆》、《雪绒花》、《春游去》、《祝你生日快乐》.
Scene/backdrop: A quiet riverside with drooping willow branches, a small boat, spring flowers, and a frog on a broad stone near the water; a varied but connected folk-song landscape.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


## g4s1-u3.webp — 第三单元 快乐校园

- 册别：四年级上册
- 教材曲目：《乒乓变奏曲》、《哦，十分钟》、《打字机》、《校园夕歌》、《老八板》
- 成品：1600×640 WebP，153000 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g4s1-u3.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 四年级上册 第三单元 快乐校园, based only on its listed works: 《乒乓变奏曲》、《哦，十分钟》、《打字机》、《校园夕歌》、《老八板》.
Scene/backdrop: At a school recess, two children play table tennis in the courtyard while other students stroll near the school building; a simple clock in the background has hands but no numerals.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g4s1-u4.webp — 第四单元 甜梦

- 册别：四年级上册
- 教材曲目：《愉快的梦》、《梦幻曲》、《小夜曲》、《月亮月光光》、《美丽的黄昏》、《红蜻蜓》
- 成品：1600×640 WebP，141802 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g4s1-u4.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 四年级上册 第四单元 甜梦, based only on its listed works: 《愉快的梦》、《梦幻曲》、《小夜曲》、《月亮月光光》、《美丽的黄昏》、《红蜻蜓》.
Scene/backdrop: A quiet bedroom at twilight, a small child asleep beneath a window with a crescent moon and one tiny red dragonfly outside; distant, gentle and uncluttered.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g4s1-u5.webp — 第五单元 水上的歌

- 册别：四年级上册
- 教材曲目：《让我们荡起双桨》、《天鹅》、《蜜蜂过江》、《小螺号》
- 成品：1600×640 WebP，154266 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g4s1-u5.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 四年级上册 第五单元 水上的歌, based only on its listed works: 《让我们荡起双桨》、《天鹅》、《蜜蜂过江》、《小螺号》.
Scene/backdrop: A small rowboat with two paddles glides across a lake near a pair of swans; a single seashell lies on the nearby shore, with bees crossing above flowers. No faces or instruments.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g4s1-u6.webp — 第六单元 跳起来

- 册别：四年级上册
- 教材曲目：《跳竹竿》、《幸福拍手歌》、《北京的金山上》、《那不勒斯舞曲》、《春之声圆舞曲（片段）》
- 成品：1600×640 WebP，150182 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g4s1-u6.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 四年级上册 第六单元 跳起来, based only on its listed works: 《跳竹竿》、《幸福拍手歌》、《北京的金山上》、《那不勒斯舞曲》、《春之声圆舞曲（片段）》.
Scene/backdrop: A few children seen from a distance jump in turn between two straight bamboo poles on a school lawn; rhythmic footprints and a broad sunny sky suggest movement, no close faces.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


## g5s1-u1.webp — 第一单元 朝夕

- 册别：五年级上册
- 教材曲目：《中华人民共和国国歌》、《太阳——熟透的苹果》、《晚风》、《噢！苏珊娜（口风琴版）》
- 成品：1600×640 WebP，167842 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g5s1-u1.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 五年级上册 第一单元 朝夕, based only on its listed works: 《中华人民共和国国歌》、《太阳——熟透的苹果》、《晚风》、《噢！苏珊娜（口风琴版）》.
Scene/backdrop: A quiet village path at the edge of sunset, with a low red sun, apple tree branches, and leaves moving in the evening breeze; two students seen from behind walk home. Do not depict an instrument.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g5s1-u2.webp — 第二单元 足迹

- 册别：五年级上册
- 教材曲目：《大路歌》、《雨花石》、《我怎样长大》、《歌唱二小放牛郎》
- 成品：1600×640 WebP，172968 B，编码质量 76；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g5s1-u2.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 五年级上册 第二单元 足迹, based only on its listed works: 《大路歌》、《雨花石》、《我怎样长大》、《歌唱二小放牛郎》.
Scene/backdrop: A winding rural footpath marked by small footprints and smooth river stones crosses fields toward distant hills; one child seen from behind walks forward, suggesting growth and memory.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g5s1-u3.webp — 第三单元 美丽乡村

- 册别：五年级上册
- 教材曲目：《苹果丰收》、《牧场上的家》、《山村变了样》、《我为家乡画幅画》、《别处哪儿有》、《噢！苏珊娜（竖笛版）》、《土风舞》
- 成品：1600×640 WebP，175584 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g5s1-u3.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 五年级上册 第三单元 美丽乡村, based only on its listed works: 《苹果丰收》、《牧场上的家》、《山村变了样》、《我为家乡画幅画》、《别处哪儿有》、《噢！苏珊娜（竖笛版）》、《土风舞》.
Scene/backdrop: An orchard full of ripe apples borders a calm pasture and a small village; a few children gather fruit in the distance while a horse grazes near a fence. No instrument.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g5s1-u4.webp — 第四单元 快乐少年

- 册别：五年级上册
- 教材曲目：《少年，少年，祖国的春天》、《叮铃铃》
- 成品：1600×640 WebP，144962 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g5s1-u4.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 五年级上册 第四单元 快乐少年, based only on its listed works: 《少年，少年，祖国的春天》、《叮铃铃》.
Scene/backdrop: A group of schoolchildren seen from behind run across an open field beneath a breezy sky, with small trees and long shadows suggesting youthful energy and spring.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


## g5s1-u5.webp — 第五单元 远山的歌

- 册别：五年级上册
- 教材曲目：曲目未列出
- 成品：1600×640 WebP，161352 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g5s1-u5.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 五年级上册 第五单元 远山的歌, based only on its listed works: —.
Scene/backdrop: Layered distant mountains, a narrow path, and a small cluster of homes sit under a broad quiet sky; a tiny figure seen from behind pauses on the path. Use only the unit title as guidance.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：需要人工留意：教材清单未提供曲目，只能依据单元名「远山的歌」表现远山、路径与村落。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g5s1-u6.webp — 第六单元 冬雪

- 册别：五年级上册
- 教材曲目：《堆雪人》、《雪花带来冬天的梦》、《雏鹰之歌》、《滑雪歌》
- 成品：1600×640 WebP，112634 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g5s1-u6.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 五年级上册 第六单元 冬雪, based only on its listed works: 《堆雪人》、《雪花带来冬天的梦》、《雏鹰之歌》、《滑雪歌》.
Scene/backdrop: Children seen from a distance build a snowman beside a gentle ski slope; an eagle glides over the far snowy ridge, with pine trees framing the winter scene.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g6s1-u1.webp — 第一单元 芬芳茉莉

- 册别：六年级上册
- 教材曲目：《中华人民共和国国歌》、《茉莉花（江苏民歌）》、《茉莉花（合唱版）》、《茉莉花（东北民歌）》、《茉莉花（河北民歌）》、《茉莉花（中国民歌）》
- 成品：1600×640 WebP，142790 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g6s1-u1.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 六年级上册 第一单元 芬芳茉莉, based only on its listed works: 《中华人民共和国国歌》、《茉莉花（江苏民歌）》、《茉莉花（合唱版）》、《茉莉花（东北民歌）》、《茉莉花（河北民歌）》、《茉莉花（中国民歌）》.
Scene/backdrop: A flowering jasmine branch and several small white blossoms fill a quiet garden corner beside a low lattice window; leaves and petals move gently in the breeze. No people or instruments.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g6s1-u2.webp — 第二单元 赞美祖国

- 册别：六年级上册
- 教材曲目：《我的祖国（歌曲版）》、《祖国有我》、《五彩缤纷的大地（节选）》、《老爷爷赶鹅》
- 成品：1600×640 WebP，168198 B，编码质量 76；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g6s1-u2.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 六年级上册 第二单元 赞美祖国, based only on its listed works: 《我的祖国（歌曲版）》、《祖国有我》、《五彩缤纷的大地（节选）》、《老爷爷赶鹅》.
Scene/backdrop: A wide countryside of river, fields, terraces, and distant mountains, with a flock of geese crossing above the land; no people or flags, a calm landscape honoring the homeland.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


## g6s1-u3.webp — 第三单元 乡音乡情

- 册别：六年级上册
- 教材曲目：《鄂伦春小调》
- 成品：1600×640 WebP，172228 B，编码质量 74；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g6s1-u3.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 六年级上册 第三单元 乡音乡情, based only on its listed works: 《鄂伦春小调》.
Scene/backdrop: A northern birch forest opens to a clear river and a small wooden cabin; a narrow path leads toward the water. Avoid specific clothing, ceremonial objects, or cultural claims.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g6s1-u4.webp — 第四单元 奇思妙想

- 册别：六年级上册
- 教材曲目：《月亮姐姐快下来》、《木偶兵进行曲》
- 成品：1600×640 WebP，113868 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g6s1-u4.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 六年级上册 第四单元 奇思妙想, based only on its listed works: 《月亮姐姐快下来》、《木偶兵进行曲》.
Scene/backdrop: A small group of wooden toy soldiers march across a tabletop beneath a round moon framed by a window; the toys are tiny and viewed from a distance, with simple shapes and no badges or writing.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g6s1-u5.webp — 第五单元 同是一家人

- 册别：六年级上册
- 教材曲目：《阿里山的姑娘（演唱版）》、《半屏山》
- 成品：1600×640 WebP，169476 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g6s1-u5.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 六年级上册 第五单元 同是一家人, based only on its listed works: 《阿里山的姑娘（演唱版）》、《半屏山》.
Scene/backdrop: A family seen from behind stands together at a mountain overlook, looking toward layered green peaks and a distant island ridge; no specific costume or close faces.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。

## g6s1-u6.webp — 第六单元 七彩光彩

- 册别：六年级上册
- 教材曲目：《七色光之歌》、《星星海》、《丢丢铜》
- 成品：1600×640 WebP，164558 B，编码质量 78；原始 PNG：`E:\Projects\.tmp\codex1\T072\raw\g6s1-u6.png`
- 重画次数：0 次
- 重画原因：无（首稿通过）

完整提示词：

```text
Use case: illustration-story
Asset type: wide chapter-header illustration for a Chinese primary-school music textbook, awaiting human review.
Primary request: illustrate 六年级上册 第六单元 七彩光彩, based only on its listed works: 《七色光之歌》、《星星海》、《丢丢铜》.
Scene/backdrop: A broad hillside beneath a rainbow fades gently toward a deepening night sky filled with small stars; tiny children walk along the ridge, no text or instruments.
Composition and constraints: Make the scene warm and playful for readers aged 6–12, while keeping it restrained and editorial rather than cute-cartoon. Leave the entire left third calm warm paper for title placement; all meaningful subjects stay on the right two-thirds. Use only details supported by this unit title or its listed songs. Do not add an unverified instrument, lettering, readable marks, pseudo-writing, or extra narrative symbols.
Style/medium and avoid list: Chinese woodblock and screen-print illustration, hand-carved lines, warm paper grain and slight ink misregistration. Use only four spot inks: pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C and amber #E9A83A on warm off-white paper #F7F3EA. Flat editorial shapes, no gradients, glow, neon, 3D or photorealism. Wide 5:2 panoramic chapter header at 1600x640; keep all meaningful subjects to the right two-thirds and leave the left third quiet warm paper for the title. No text, letters, pseudo-writing, numbers, watermark, logo or close-up face. Avoid glowing networks, sci-fi, holograms, bokeh, lens flare, glossy surfaces, generic ink-wash mountains, clip art, emoji and cartoon mascots.
```

- 自检：主题与单元标题/曲目意象相符。左侧三分之一保留安静纸色留白；主体在右侧；未见文字、字母、伪文字、数字、水印、Logo 或面部特写；套色木刻风格目检通过。画面未出现可辨识乐器，无需器形核对。


