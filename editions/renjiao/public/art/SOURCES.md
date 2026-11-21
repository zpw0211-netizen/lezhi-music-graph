# 人教版插图提示词与来源记录

生成日期：2026-10-16。工具：Codex 内置 image_gen。图像自检按模版第 5 节七项逐张执行。

## 2026-11-20 修订版固定段（T143 重画用）

T143 重画的 78 张（2026-11-20/21）每张提示词都以下面的固定风格段 + 对应规格段开头，再接各图画面段。

固定风格段：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
```

封面规格段：

```text
Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; the lower-left third (where a title and a dark gradient will be laid on the website) stays softer and lower in contrast but still filled with scenery such as grass, flowers, paths, distant trees or floor patterns, never an empty flat area. Rich detail, professional picture-book quality.
```

单元规格段：

```text
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
```

## pep-g1s1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 教材依据：一年级上册全册目录与“凤鸣山谷”贯穿线索；《凤鸣山谷的故事》p.2、《和大人一起做“小箜篌”》p.12、《多样的课堂打击乐器》p.40、《吹管乐家族聚会》p.58、《小号与大号》p.61、《我和小提琴》p.73、《唤醒春天》p.76。
- T141 判定：建议重画。返工点：旧图左下标题区有大块平涂绿坡；保留凤鸣山谷线索，将草叶、野花、小路和远树铺入左下。
- 生成轮次：1 次；一次生成后采用。
- 人物高度与裁脸：两名完整背影，约 23%、21%；头脚在框内，0 个可见侧脸。 测量以最终 1200×750 / 1600×640 成品画高为基准。
- 尺寸、体积、编码：1200×750，224,418 B，quality=78；符合模版上限。
- 裁切与手机显示：按规定规格缩放/中心裁切；主要主体完整。390 px 手机宽度预览可见本册联系单后附文件。
- 模版第 5 节自检：
  1. 剪纸纸艺：通过；天空、山、水和植物由叠层纸片构成。
  2. 配色：通过；使用模版暖亮色板，与留用纸层参考协调。
  3. 文字与水印：通过；原图尺寸目检无文字、水印、logo 或伪文字。
  4. 人物与脸：两名完整背影，约 23%、21%；头脚在框内，0 个可见侧脸。 按原图尺寸检查；可见侧脸均有眼睛。
  5. 乐器结构：箜篌、长笛、提琴/弓与手鼓可辨。
  6. 标题区：通过；左下平涂区已补草叶、野花、小路与远树，空白估计 0–4%。
  7. 教材内容：通过；主体与对应册、单元标题及列明作品相符。

最终提示词（逐字）：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    
    Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; the lower-left third (where a title and a dark gradient will be laid on the website) stays softer and lower in contrast but still filled with scenery such as grass, flowers, paths, distant trees or floor patterns, never an empty flat area. Rich detail, professional picture-book quality.
    
    Scene: At dawn in Fengming Valley, a phoenix-like paper bird sings above the middle-distance river as exactly two small Chinese primary-school children follow a winding path toward the spring valley, both seen only from behind, full-body and fully inside the frame, each about one quarter of the image height and never over one third. Keep the children embedded in the landscape rather than foreground portraits. Along the middle-right journey place a small hand drum, a vertical konghou harp with a curved frame and visible strings, a transverse flute, and a violin with bow, each structurally recognizable and resting naturally on layered rocks or grass. Fresh blossoms awaken near the far end of the path. Fill the soft lower-left title area with layered grasses, small wildflowers, a curving path and distant tree silhouettes; continue paper-cut leaves and soft cloud layers through the upper-left so there is no large empty flat patch.
    Must include: singing phoenix-like bird; winding river and path; small hand drum; vertical konghou harp with visible strings; transverse flute; violin and bow; two fully visible small back-view children; spring blossoms.
    Mood: joyful musical discovery toward spring.

## pep-g1s1-u1.webp

- 册别/单元：一年级上册第1单元
- 教材依据：一年级上册第一单元《奇妙的声音世界》；《凤鸣山谷的故事》p.2、《和大人一起做“小箜篌”》p.12。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：0 次；一次生成后采用。
- 第 5 节自检：1通过；2通过；3通过；4通过；5通过；6通过；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: at dawn, a phoenix-like bird sings from a rock in Fengming Valley; two or three distant children listen as cut-paper sound ribbons cross the mountain valley toward a small handmade konghou.
Must include: the phoenix's first call; a winding valley stream; a small handcrafted konghou from the unit activity.
Mood: wonder at the first sounds of music.
```

## pep-g1s1-u2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 教材依据：《节奏密码·均拍》p.14、《指挥家风采》p.15、《节奏密码·音符》p.16、《新年好》p.17、《节奏密码·休止符》p.18、《穿越迷宫》p.21、《祖国祖国我们爱你》p.22、《节奏变变变》p.24。
- T141 判定：必须重画。返工点：标题区最大连续低细节组件约 16.0%；以迷宫路径、节拍圆片和停顿空隙填满左侧。
- 生成轮次：2 次；第 1 版人物约 44% 超限，第 2 版缩小后采用。
- 人物高度与裁脸：两名全身背影约 19%、18%；头脚在框内，0 个可见侧脸。 测量以最终 1200×750 / 1600×640 成品画高为基准。
- 尺寸、体积、编码：1600×640，176,906 B，quality=74；符合模版上限。
- 裁切与手机显示：按规定规格缩放/中心裁切；主要主体完整。390 px 手机宽度预览可见本册联系单后附文件。
- 模版第 5 节自检：
  1. 剪纸纸艺：通过；天空、山、水和植物由叠层纸片构成。
  2. 配色：通过；使用模版暖亮色板，与留用纸层参考协调。
  3. 文字与水印：通过；原图尺寸目检无文字、水印、logo 或伪文字。
  4. 人物与脸：两名全身背影约 19%、18%；头脚在框内，0 个可见侧脸。 按原图尺寸检查；可见侧脸均有眼睛。
  5. 乐器结构：本图主体不要求呈现乐器，按单元画面依据核对主题对象。
  6. 标题区：通过；左侧三分之一有连续地形、路径、水岸、花草或建筑层次，空白估计 0–5%。
  7. 教材内容：通过；主体与对应册、单元标题及列明作品相符。

最终提示词（逐字）：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    
    Scene: A very wide, distant establishing view of a branching paper maze across a meadow, with low cut-paper walls, fine path grooves and small rhythm tiles as the main subject. Two tiny schoolchildren follow the maze near the far-right midground, seen fully from behind; each child must be only about one sixth of the final banner height (roughly 100 pixels in a 640-pixel-tall image), never foreground and never taller than one quarter of the image. Their feet and heads remain well inside the frame. Place small repeating beat tiles along the path and clear open gaps where the rhythm pauses; show the beat as simple coloured paper circles and flowing ribbons, not written notation. Keep the left title third softly detailed with low maze walls, layered hills, tiny leaves, flowers and path grooves continuing through it, never blank flat sky or plain paper. Use an elevated oblique view so the landscape dominates and the children remain small.
    Must include: branching paper maze; evenly spaced beat tiles; clear open pause gaps; two tiny full-body back-view children; continuous layered scenery across the left title third.
    Mood: steady and playful.

## pep-g1s1-u3.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 分类：返工（玩偶过大且近正面）。
- 来源依据：SOURCES.md：一上 U3，《do re mi之歌》p.28、《修好凤鸣桥》p.30、《洋娃娃和小熊跳舞》p.32。
- 画面与修订：保留凤鸣桥、河谷与跳舞玩偶主题；洋娃娃和小熊改成小型剪纸玩偶，在桥边起舞。洋娃娃明确侧身，玩偶五官克制；两三名远处观者只作背影。左侧以河岸、草、花径和远山延续景物。
- 逐图自检：洋娃娃、小熊约占画高 22–25%；娃娃侧脸有一枚小眼睛，观者完整且不超过三分之一。左标题区平涂空白目测低于 5%。无可读文字、水印或真实乐器。
- 文件与复核：1600×640，179,324 B；源 PNG 1983×793；quality 78；1 轮。原尺寸复核截图：work/faces/pep-g1s1-u3-doll.png、pep-g1s1-u3-teddy.png。

首轮完整提示词：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    Scene: Refine the existing paper-cut bridge scene about the song “Dancing Doll and Teddy Bear”: keep the toy doll and teddy dancing beside the small bridge on the right, with two or three distant child viewers seen from behind. Make the handmade paper doll and teddy each about one quarter of the full image height (target 22–25%, never above one third), complete from head to feet, and much smaller than the current oversized toys; turn the doll into a clear side profile with one small visible eye and eyebrow. Give the doll and teddy simple crafted-paper toy faces with ordinary small features, never large cartoon eyes. Keep every child viewer fully in frame and at most one third of the image height. Fill the left title third with low-contrast layered riverbank, grasses, flowers, path and distant hills; it must remain softly detailed rather than empty or flat.
    Must include: one small handmade paper doll in side profile; one small teddy-bear toy dancing with the doll; a paper bridge over a valley stream; two or three child viewers from behind.
    Mood: cheerful melodic play.

## pep-g1s1-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 教材依据：《打击乐竞演》p.36、《我的“身体打击乐”》p.38、《多样的课堂打击乐器》p.40、《数鸭子》p.41、《玩具兵进行曲》p.42、《乃哟乃》p.46。
- T141 判定：必须重画。返工点：旧图标题区细节不足且人物较近；新图改为学校花园小舞台与池塘全景。
- 生成轮次：3 次；首稿人物过大，第 2 版正面朝向，第 3 版改为小比例背影后采用。
- 人物高度与裁脸：三名全身背影约 18%、17%、17%；头脚在框内，0 个可见侧脸。 测量以最终 1200×750 / 1600×640 成品画高为基准。
- 尺寸、体积、编码：1600×640，177,200 B，quality=58；符合模版上限。
- 裁切与手机显示：按规定规格缩放/中心裁切；主要主体完整。390 px 手机宽度预览可见本册联系单后附文件。
- 模版第 5 节自检：
  1. 剪纸纸艺：通过；天空、山、水和植物由叠层纸片构成。
  2. 配色：通过；使用模版暖亮色板，与留用纸层参考协调。
  3. 文字与水印：通过；原图尺寸目检无文字、水印、logo 或伪文字。
  4. 人物与脸：三名全身背影约 18%、17%、17%；头脚在框内，0 个可见侧脸。 按原图尺寸检查；可见侧脸均有眼睛。
  5. 乐器结构：浅框手鼓与短柄手镲形态可辨。
  6. 标题区：通过；左侧三分之一有连续地形、路径、水岸、花草或建筑层次，空白估计 0–5%。
  7. 教材内容：通过；主体与对应册、单元标题及列明作品相符。

最终提示词（逐字）：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    
    Scene: A wide, elevated side view of a school garden with a small paper stage beside a pond and several tiny ducks. Three small children perform a rhythm in the far-right middle distance, all full-body, no taller than about one sixth of the final banner height (roughly 100 pixels in a 640-pixel image), fully inside the frame and seen strictly from behind with the backs of their heads toward the viewer; no faces or facial features are visible. One child claps, one taps their knees, and one holds a shallow frame hand drum with a round taut skin and visible rim. A small pair of bronze hand cymbals with short handles rests on the stage. Keep the stage, flowered pond, garden pavilion and paper sound ribbons larger than the children. Fill the soft left title third with a low flower bed, pond edge, stepping-stone path and layered foliage, leaving no blank patch.
    Must include: three tiny full-body back-view children making body percussion; one shallow frame hand drum; one small pair of hand cymbals with handles; ducks on a pond; layered school-garden stage.
    Mood: lively and playful.

## pep-g1s1-u5.webp

- 册别/单元：一年级上册第5单元
- 教材依据：一年级上册第五单元《弹拨乐彩排》；《高山流水遇知音》p.50、《快乐的罗梭》p.56。使用单元主题支持的弹拨乐器类别，不指定目录未写明的具体乐器。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：0 次；一次生成后采用。
- 第 5 节自检：1通过；2通过；3通过；4通过；5通过；6通过；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: in a mountain-and-stream setting inspired by “High Mountains and Flowing Water,” two or three distant children listen beside a small plucked-string rehearsal.
Must include: layered high mountains and flowing water; one correctly structured plucked-string instrument with visible strings; children listening from the meadow.
Mood: calm, attentive rehearsal.
```

## pep-g1s1-u6.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 教材依据：《吹管乐家族聚会》p.58、《小号与大号》p.61。
- T141 判定：建议重画。返工点：旧图与同册 T05 乐器合奏构图重复；新图改为高位山河远景。
- 生成轮次：3 次；前两版人物超限，第 3 版缩至远景后采用。
- 人物高度与裁脸：两名侧影约 19%/18%；原尺寸裁脸 2 个可见侧脸，眼睛和眉毛均清楚。 测量以最终 1200×750 / 1600×640 成品画高为基准。
- 尺寸、体积、编码：1600×640，177,330 B，quality=66；符合模版上限。
- 裁切与手机显示：按规定规格缩放/中心裁切；主要主体完整。390 px 手机宽度预览可见本册联系单后附文件。
- 模版第 5 节自检：
  1. 剪纸纸艺：通过；天空、山、水和植物由叠层纸片构成。
  2. 配色：通过；使用模版暖亮色板，与留用纸层参考协调。
  3. 文字与水印：通过；原图尺寸目检无文字、水印、logo 或伪文字。
  4. 人物与脸：两名侧影约 19%/18%；原尺寸裁脸 2 个可见侧脸，眼睛和眉毛均清楚。 按原图尺寸检查；可见侧脸均有眼睛。
  5. 乐器结构：小号前向号口/活塞阀，大号盘管/上扬号口可辨。
  6. 标题区：通过；左侧三分之一有连续地形、路径、水岸、花草或建筑层次，空白估计 0–5%。
  7. 教材内容：通过；主体与对应册、单元标题及列明作品相符。

最终提示词（逐字）：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    
    Scene: Use a very wide distant establishing view from a high ridge: broad terraced stone steps, reeds, river bends and a low wooden boat dominate the panorama. At the far-right end of the distant river lookout, place two tiny full-body children only about 100 pixels tall in the final 640-pixel-high image (roughly one sixth of the banner height); the figures must be miniature against the landscape, less than one quarter of the height, and never foreground. Their feet and heads remain within the frame. One child plays a small trumpet with a forward bell, mouthpiece and three piston valves; the other plays a clearly different small coiled tuba with looping tubing and a broad upward bell. Make the instrument silhouettes recognizable but keep the children and instruments distant. Show both children in profile facing one another; any visible face has one distinct small eye and eyebrow. Layered mountain slopes, riverbank stones, reeds, water ripples and soft clouds fill the left title third and the rest of the landscape.
    Must include: one trumpet with three piston valves; one coiled tuba with broad upward bell; two miniature full-body profile players with visible eyes; stepped river lookout; reeds and low wooden boat.
    Mood: bright brass fanfare.

## pep-g1s1-u7.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 教材依据：《山谷音乐会》p.70、《小夜曲》p.72、《我和小提琴》p.73。
- T141 判定：建议重画。返工点：旧图与同册 T01 横向山谷构图重复；新图改为高架弧桥与瀑布峡谷中的小提琴三重奏。
- 生成轮次：1 次；一次生成后采用。
- 人物高度与裁脸：三名侧影约 18%/18%/17%；原尺寸裁脸 3 个可见侧脸，3 个均有眼睛与眉毛。 测量以最终 1200×750 / 1600×640 成品画高为基准。
- 尺寸、体积、编码：1600×640，179,278 B，quality=58；符合模版上限。
- 裁切与手机显示：按规定规格缩放/中心裁切；主要主体完整。390 px 手机宽度预览可见本册联系单后附文件。
- 模版第 5 节自检：
  1. 剪纸纸艺：通过；天空、山、水和植物由叠层纸片构成。
  2. 配色：通过；使用模版暖亮色板，与留用纸层参考协调。
  3. 文字与水印：通过；原图尺寸目检无文字、水印、logo 或伪文字。
  4. 人物与脸：三名侧影约 18%/18%/17%；原尺寸裁脸 3 个可见侧脸，3 个均有眼睛与眉毛。 按原图尺寸检查；可见侧脸均有眼睛。
  5. 乐器结构：提琴琴身、琴颈、弓与弦线可辨，未见明显错误。
  6. 标题区：通过；左侧三分之一有连续地形、路径、水岸、花草或建筑层次，空白估计 0–5%。
  7. 教材内容：通过；主体与对应册、单元标题及列明作品相符。

最终提示词（逐字）：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    
    Scene: At a calm golden evening, a high curved paper footbridge crosses a narrow mountain gorge with terraced waterfalls and layered pine slopes. Three small primary-school violin players stand together on the far-right half of the bridge, each full-body and fully inside the frame, about one sixth of the banner height (roughly 100 pixels in the 640-pixel image), never foreground. Show the players in side profile, each visible profile with one clear small dark eye and eyebrow. Each holds a real violin under the chin with the left hand on the neck and a separate bow in the right hand; each violin has a small curved wooden body, four strings and a visible bridge, with the bows at three distinct angles. The ensemble and instruments stay small while the bridge, ravine, pines and flowing water remain dominant. Continue bridge stones, river ribbons, pine branches, distant ridges and small wildflowers across the soft left title third with no blank area.
    Must include: three small profile violin players with clear eyes; correctly held violins with four strings and bows; curved mountain footbridge; layered pine valley; terraced waterfalls.
    Mood: lyrical evening.

## pep-g1s1-u8.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 教材依据：《唤醒春天》p.76及单元首页“小小音乐剧”意象。
- T141 判定：必须重画。返工点：标题区最大连续低细节组件约 19.2%；以花床、初春花苞、晨鸟和弯曲小路覆盖横幅。
- 生成轮次：1 次；一次生成后采用。
- 人物高度与裁脸：两名背影约 19%/18%；头脚在框内，0 个可见侧脸。 测量以最终 1200×750 / 1600×640 成品画高为基准。
- 尺寸、体积、编码：1600×640，177,682 B，quality=66；符合模版上限。
- 裁切与手机显示：按规定规格缩放/中心裁切；主要主体完整。390 px 手机宽度预览可见本册联系单后附文件。
- 模版第 5 节自检：
  1. 剪纸纸艺：通过；天空、山、水和植物由叠层纸片构成。
  2. 配色：通过；使用模版暖亮色板，与留用纸层参考协调。
  3. 文字与水印：通过；原图尺寸目检无文字、水印、logo 或伪文字。
  4. 人物与脸：两名背影约 19%/18%；头脚在框内，0 个可见侧脸。 按原图尺寸检查；可见侧脸均有眼睛。
  5. 乐器结构：本图主体不要求呈现乐器，按单元画面依据核对主题对象。
  6. 标题区：通过；左侧三分之一有连续地形、路径、水岸、花草或建筑层次，空白估计 0–5%。
  7. 教材内容：通过；主体与对应册、单元标题及列明作品相符。

最终提示词（逐字）：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    
    Scene: A spring garden path winds from layered foreground beds of crocuses and fresh leaves toward a paper-cut sunrise in the right distance. Several tiny birds wake among low blossoming branches and flutter above the flower beds. Two small schoolchildren walk toward the sunrise on the path, full-body and seen only from behind, each about one fifth of the image height, never above one quarter; leave generous space around their silhouettes so heads and feet stay fully inside the frame. Let the new flower beds, meadow terraces, tiny birds, dew-like paper shapes and the curved garden path fill the soft left title third without blank flat areas. Make the spring landscape the main subject and the children small figures within it.
    Must include: spring crocus buds; small waking birds; two tiny full-body back-view children; winding garden path; layered flower beds and paper sunrise.
    Mood: fresh morning.

## pep-g1s2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画；新画面依据封面目录及《音乐礼盒开开开》p.2、《春天里的植树节》p.23、《大风车》p.61。
- 画面核对：打开的音乐礼盒、初栽树苗、风车、两名背影孩子与春日小路均出现；标题区有草地、花朵、小径、远树。人物约 30%、28%，全身在框；0 个可见侧脸。
- 原尺寸裁脸检查：两人均为背影，不露正脸或侧脸。成品 1200×750，213,442 B，WebP quality 78；原图 1200×750 / 199,682 B。手机预览主体与标题区仍可辨。
- 模版第 5 节自检：剪纸纸层与配色通过；目检无文字、水印、logo、伪文字；本图无教学乐器结构要求；标题侧空白估计 0–5%；内容符合封面所列教材意象。
- 最终提示词（完整场景段）：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.

    Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; the lower-left third (where a title and a dark gradient will be laid on the website) stays softer and lower in contrast but still filled with scenery such as grass, flowers, paths, distant trees or floor patterns, never an empty flat area. Rich detail, professional picture-book quality.

    Scene: Unfold a spring music gift like a small paper theatre beside a winding garden path. On the right, an open music gift box reveals layered coloured ribbons flowing toward a newly planted sapling; a small windmill turns above the seedlings on the distant ridge. Exactly two primary-school children approach from the middle distance, seen only from behind, full-body and entirely inside the frame, each about one quarter of the image height and never over one third. Keep them small within the landscape, not foreground portraits. Fresh growth, tree silhouettes and soft cloud layers fill the lower-left title area with layered grasses, wildflowers, the curving path and distant orchard trees; it stays low-contrast but never empty or flat. Show a joyful spring landscape rather than a blank field.
    Must include: opened music gift box; new sapling; turning windmill; two small full-body children seen from behind; winding garden path; spring seedlings.
    Mood: fresh discovery.

## pep-g1s2-u1.webp

- 册别/单元：一年级下册，第一单元《爱的摇篮》
- 教材依据：《音乐礼盒开开开》p.2、《摇篮曲》p.5、《爱的传递》p.10。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：0 次；一次生成后采用。
- 第 5 节自检：1通过；2通过；3通过；4通过（孩子为侧影）；5通过；6通过；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: two or three children carry a handmade musical gift toward a cozy home at dawn, beside a gently swaying cradle as lullaby ribbons float softly.
Must include: a small music gift box; a flower-trimmed cradle; children sharing the gift and listening.
Mood: tender and loving.
```

## pep-g1s2-u2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：建议重画；教材依据《找朋友》p.14、《碰碰车》p.16、《龟兔赛跑》p.18。
- 画面核对：两辆空碰碰车、龟兔、花园游乐场与两名小背影孩子均出现；没有驾驶者或额外正脸。人物约 18%、17%，完整入框；0 个可见侧脸。
- 原尺寸裁脸检查：人物为背影，无可见脸。成品 1600×640，177,712 B，WebP；原图 1600×640 / 169,100 B。390px 预览中游乐场主景仍清楚，左侧标题区由水岸、花径、树叶填充。
- 模版第 5 节自检：剪纸层次、配色通过；无文字、水印、logo、伪文字；无需判定教学乐器结构；人物比例通过；标题区空白估计 0–5%；碰碰车、龟、兔与教材内容相符。
- 生成修订：早期版本人物过大或车内出现正脸乘客，均弃用；最终稿改为空车与远景背影，避免近景脸和人物超限。失败稿保存在 work\failed\。
- 最终提示词（场景段；固定风格及 5:2 格式按前文通用模板）：

    Scene: A wide high-angle view of a spring friendship park, where the main subject is an oval bumper-car ring with two completely empty bumper cars; no passengers or drivers appear anywhere in the scene. Exactly two tiny primary-school children meet on the distant path beside the ring, full-body and entirely inside the frame, each about one fifth of the 640-pixel banner height and never over one third. Show both children only from behind, with heads and feet visible. Place a small tortoise and a hare near the flower beds as secondary story details. Make the park scenery, bumper-car ring, lake, patterned paths and gardens much larger than the children. Fill the left title third with layered willow leaves, flowers, curved paths and the soft lake edge; no blank flat area.
    Must include: two empty bumper cars; two small back-view children meeting; tortoise; hare; spring park; layered paths and flower beds.
    Mood: playful and social.

## pep-g1s2-u3.webp

- 册别/单元：一年级下册，第三单元《绿色家园》
- 教材依据：《森林与小鸟》p.22、《春天里的植树节》p.23、《小松树》p.27。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：0 次；一次生成后采用。
- 第 5 节自检：1通过；2通过；3通过；4通过；5通过；6通过；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: two or three children plant a young pine in a bright green woodland meadow as birds gather among the branches.
Must include: a newly planted pine sapling; leafy forest trees; two or three small birds and children tending the soil.
Mood: fresh, hopeful spring.
```

## pep-g1s2-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画；教材依据《舞会上的小指挥》p.30、《儿童圆舞曲》p.32、《唱唱名，手弹琴》p.36。
- 画面核对：全景舞厅与圆形舞步地面为主，三名小背影分别跳舞、指挥；小型立式键盘及黑白键可辨。人物估算约 27%、25%、23%，全身在框；0 个可见侧脸。标题侧由窗帘、窗格、地面与绿植铺满。
- 原尺寸裁脸检查：均为背影。成品 1600×640，170,176 B，WebP；原图 1600×640 / 153,750 B。390px 预览保持舞厅轮廓与人物可识别。
- 模版第 5 节自检：剪纸与配色通过；无文字水印等；键盘为直立式、连续黑白键，结构符合小型立式键盘；人物完整且小于三分之一；标题区空白估计 0–5%；舞会、指挥、圆舞曲与教材相符。
- 生成修订：首稿人物过大且有正面朝向，弃用；第二稿改为高角度远景和小比例背影后采用。
- 最终提示词（场景段；固定风格及 5:2 格式按前文通用模板）：

    Scene: From a high corner near the ceiling, show the entire bright dance hall and its enormous circular parquet floor as the main subject. Keep exactly three small children far away along the far-right edge of the patterned floor, each no more than one eighth of the final 640-pixel image height (about 80 pixels tall), fully inside the frame and never foreground. Two children dance a simple waltz while seen only from behind, and the third stands on a short stair landing conducting with one raised hand, also seen from behind so no faces show. A compact upright keyboard with a continuous row of alternating black and white keys sits near the small group. Make the floor's curved three-step pattern, paper tile inlays, curtains, broad windows and room architecture much larger than the children. Fill the left title third with soft low-contrast parquet, a woven rug, layered curtains, pale window panes and plant leaves; no blank wall or plain paper.
    Must include: small upright keyboard with black and white keys; one child conductor on a stair landing; a pair of children dancing together; curved three-step floor pattern; layered interior curtains and window.
    Mood: light and buoyant.

## pep-g1s2-u5.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：建议重画；教材依据《劳动最光荣》p.38、《打麦号子》p.41、《劳动集体舞》p.42、《勤劳的小蜜蜂》p.43。
- 画面核对：弧形麦田、收割麦捆、竹篮、花朵与小蜜蜂为主体；远处两名孩子采麦。人物约 19%、17%，全身在框；其中一名背影，另一名侧影。
- 原尺寸裁脸检查：已从原始 PNG 以原像素裁出侧脸 E:\Projects\.tmp\pep-redraw\work\faces\pep-g1s2-u5-profile-native.png；眼睛和眉毛清楚可见。成品 1600×640，178,438 B，WebP；原图 1600×640 / 172,256 B。390px 预览麦田层次仍清楚。
- 模版第 5 节自检：纸层景观和暖亮色板通过；无文字、水印、logo、伪文字；不要求教学乐器结构；两人比例、入框与侧脸眼睛通过；左侧田垄、山丘、花草填充，标题区空白估计 0–5%；劳动主题吻合教材。
- 生成修订：留存的大人物版本弃用；最终版继续拉远人物，以麦田作主景后采用。
- 最终提示词（场景段）：

    Scene: Create a distant panoramic landscape first: a sweeping golden harvest plain with curved furrows, sheaves, woven baskets, small flowers and tiny bees. The fields and paper-cut scenery occupy almost the entire image. Only at the far-right edge, show two very small children gathering wheat. Each complete child is no taller than 15% of the full image height (about 95 pixels in the 640-pixel final banner); keep them tiny and secondary, with no foreground people. One child is seen from behind; the other is in side profile with one clearly drawn dark eye and eyebrow. Their whole bodies, including feet and heads, are inside the frame. Do not make the children large, central or close. Make the layered furrows and patterned sheaves the clear main subject. Fill the left title area with low-contrast hills, clouds, grain rows and layered trees, with abundant detail and absolutely no blank flat area.
    Must include: two tiny harvest helpers; cut wheat sheaves; woven baskets; tiny bees over flowers; layered curved furrows.
    Mood: hardworking and cheerful.

## pep-g1s2-u6.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画；教材依据《在钟表店里》p.51、《雨来啦》p.52。
- 画面核对：远岸钟表店、多个带指针和点标记的钟、雨、河面倒影与共伞儿童均出现；钟面没有数字。两名孩子约 31%、30%，全身在框；一名背影，一名侧影。
- 原尺寸裁脸检查：原始 PNG 裁片 E:\Projects\.tmp\pep-redraw\work\faces\pep-g1s2-u6-profile-native.png 中，侧脸的眼睛清楚可见；人物仍不超过三分之一。成品 1600×640，178,482 B，WebP quality 54；原图 1600×640 / 172,460 B。390px 预览仍能看见钟店、雨与河岸。
- 模版第 5 节自检：剪纸纸层与冷暖雨景配色通过；目检无文字、水印、logo、伪文字，钟面只用指针/点标记；无教学乐器结构要求；人物、眼睛、完整入框通过；左侧雨云、水面、屋顶、柳枝和铺地图案连续，标题区空白估计 0–5%；内容同时对应钟表店与雨景歌曲。
- 生成修订：人物有一稿偏近，最终稿以跨河远景重新构图，人物留在远岸；细节丰富导致 WebP 需 quality 54 才低于 180 KB 单元图体积上限。
- 最终提示词（场景段）：

    Scene: A very wide rainy riverside street seen from across the water. The main focal point is a richly layered clock-shop window on the far-right bank: several little clocks hang at different heights, with simple hands and tiny dot markers only, absolutely no numerals or letters. The street, flowing river, layered rain clouds, umbrella-shaped trees, reflections, clock-shop architecture and patterned paving fill the scene. Near the shop on the distant path, two tiny children share one umbrella; each full-body child is no taller than 15% of the picture height (about 95 pixels in the 640-pixel final banner), fully inside the frame with head and feet visible, never foreground. One child is seen from behind; the other is a small side profile with one clear dark eye and eyebrow. Make the river and shop much larger than the children. Fill the softer left title third with soft low-contrast rain clouds, layered water reflections, distant roofs, willow branches and patterned paving; no blank flat wall or sky.
    Must include: clock shop window; several clocks with hand-only faces and no numerals; rain; two tiny children sharing one umbrella; rippled reflections.
    Mood: cozy and rainy.

## pep-g1s2-u7.webp

- 册别/单元：一年级下册，第七单元《动画城》
- 教材依据：《动画音乐会》p.56、《拉洋片》p.58、《皮影》p.59、《大风车》p.61、《唐僧骑马咚嘚咚》p.62。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：0 次；一次生成后采用。
- 第 5 节自检：1通过；2通过；3通过；4通过（皮影为通用剪影，儿童无正脸特写）；5通过；6通过；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: two or three children watch a paper shadow-play music show, where simple cut-paper silhouettes of a windmill and a traveler riding a horse move across a small screen.
Must include: a small picture-show screen; a windmill silhouette; a generic rider and horse silhouette with no distinctive costume or character features.
Mood: playful theatrical wonder.
```

## pep-g1s2-u8.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 分类：返工（卡通动物角色）。
- 来源依据：SOURCES.md：一下第八单元《两只老虎与小兔乖乖》小小音乐剧（pp.64–69）。
- 画面与修订：原图把老虎、兔子画成站立卡通动物。定稿改为三名人类儿童演童话剧：两名戴纸虎头帽、一名戴兔耳头饰；台下两名小观众为背影。演员均为完整小比例侧影，帽饰与人物是一体的戏服，没有动物身体或独立动物吉祥物。右侧保留小屋门洞和纸舞台，左标题区用柔和帷幕、墙面、地面花纹和少量植物铺满。
- 逐图自检：演员约占画高 22–26%，观众更小；可见侧脸均有眼睛与眉毛，人物头脚完整。左标题区平涂空白目测低于 5%。无可读文字、水印或真实乐器；乐符为剪纸音带装饰。
- 文件与复核：1600×640，143,112 B；源 PNG 1983×793；quality 78；2 轮（初稿、比例/侧影修订）。脸部复核截图：work/faces/pep-g1s2-u8-left-tiger-actor.png、pep-g1s2-u8-rabbit-actor.png、pep-g1s2-u8-right-tiger-actor.png。

首轮完整提示词：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    Scene: Redesign the supplied school story-theatre scene using its stage layout only: on the right two-thirds, three small child actors perform the story of two tigers and a little rabbit, with two audience children watching from behind; two actors wear simple handmade paper tiger-head hats, and the third wears a soft paper rabbit-ear headband, so every role is visibly a human child in costume, never an animal mascot. Show the actors in side profile or back view, with one clear small eye and eyebrow on every visible profile. Keep all five children full-body, each about one quarter of the 640-pixel image height and never above one third. Fill the left title third softly with layered curtain folds, a pale paper stage wall, patterned floor and a few low-contrast plants; no broad flat blank area. Include a simple cottage doorway on the stage and keep the audience as small back views near the lower-right edge.
    Must include: two human child actors in tiger-head hats; one human child actor with rabbit-ear headband; two child audience members seen from behind; one simple cottage doorway and a small paper stage.
    Mood: lively story theatre.
    

修订提示词 1：

    Revise this illustration. Preserve the paper theatre, cottage doorway, two tiger-costume child actors, one rabbit-ear child actor, and two back-view audience children. The three stage actors are far too large and too frontal. Shrink each actor to about 22–25% of the full image height, never more than one third, and keep each entire body and headwear in frame. Show every actor in a clear side profile or from behind; any visible face must have one clear small eye and eyebrow, never a frontal face. The tiger roles remain human children wearing simple paper tiger-head hats; the rabbit role remains a child wearing a paper rabbit-ear headband. Do not depict any standalone animal characters, animal bodies or mascots. Make the left title third softly detailed and low-contrast with pale layered curtain folds, stage-wall paper and subtle floor pattern; retain scenery there but calm the strong red. Keep the 5:2 panorama, crisp layered paper-cut craft, warm reference palette, and all story elements. No text or logos.

## pep-g2s1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 分类：漏画补画（建议）。
- 来源依据：SOURCES.md：二上封面；《致同学》“美丽动听中国行”p.4、《京剧的伴奏乐器》p.8、《爷爷为我打月饼》p.28、《蜗牛与黄鹂鸟》p.68。
- 画面与修订：按册内曲目汇入黄河/齐鲁等音乐主题，组成河流、空船、京剧脸谱意象、月亮和月饼、葡萄藤、黄鹂与蜗牛的剪纸旅程。三名小学生作为远景；左下平涂绿坡改为草、零星花、窄路和树层。
- 逐图自检：三名全身人物约占画高 25–29%；两名侧脸有眼睛与眉毛，第三人为背影。左下平涂空白目测约 5%，路径、树和花层可辨。无额外建筑、可读文字、水印或实体乐器。
- 文件与复核：1200×750，200,266 B；源 PNG 1586×992；quality 78；3 轮（首轮收敛标题区，末轮补清两张侧脸眼睛）。脸部复核截图：work/faces/pep-g2s1-cover-boy-profile.png、pep-g2s1-cover-girl-profile.png。

首轮完整提示词：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; the lower-left third (where a title and a dark gradient will be laid on the website) stays softer and lower in contrast but still filled with scenery such as grass, flowers, paths, distant trees or floor patterns, never an empty flat area. Rich detail, professional picture-book quality.
    Scene: exactly three small schoolchildren walk along one winding paper sound-ribbon through open green hills beside a river, pausing by one small empty boat; keep their full bodies in frame and each about one quarter of the image height, never above one third, seen from behind or in side profile with one clear small eye on every visible profile. In the upper-right scenery, include one small abstract Peking-opera face motif, a full moon with two mooncakes, and one snail with one yellow oriole beside a grapevine. Fill the lower-left title third softly with layered grass, scattered small flowers, a winding footpath and distant trees; low contrast but visibly detailed, never a flat green slope.
    Must include: three back-view or side-view schoolchildren; one winding river-side sound ribbon; one small empty boat; one abstract Peking-opera face motif; one full moon and two mooncakes; one snail and one yellow oriole beside a grapevine; lower-left flowers, path and distant trees. No physical instruments or other people/buildings.
    Mood: curious regional journey.

修订提示词 1：

    Make a gentle title-area refinement to this image. Preserve the exact cover composition, three small children, river and empty boat, moon with two mooncakes, Peking-opera face motif, grapevine, yellow oriole, snail, sound ribbon, and distant hills. Do not add or remove any of these story elements, people or buildings. In the lower-left title third only, reduce contrast and visual density: change the large saturated foreground blossoms into scattered tiny low-contrast flowers, soften the green hill layers, and keep a narrow winding path, fine grasses and distant trees. The title area must stay filled with layered landscape, never flat or blank, but remain quiet and easy to read over. Keep the children full-body and small, each below one third of image height, side/back views, with a clear small eye on any visible profile. Keep the 8:5 landscape and handmade layered paper-cut style.

修订提示词 2：

    Make only a small face-detail correction in this cover. Preserve the scenery, three children, river, empty boat, musical ribbon, Peking-opera motif, mooncakes, snail, oriole, grapevine, path, flowers, colors and composition. On the red-backpack boy and the girl in yellow, whose faces are visible in side profile, make one small dark eye and a delicate eyebrow clearly visible on each profile. Keep their profiles small and natural; do not enlarge their heads or bodies. The third child remains seen from behind. Keep all three full-body and below one third of image height. Do not change any other detail, and add no text, symbols or objects.

## pep-g2s1-u1.webp

- 册别/单元：二年级上册，第一单元《京腔京味儿》
- 教材依据：《生旦净丑荟精粹》p.4、《京剧的伴奏乐器》p.8、《锣鼓经》p.9。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：0 次；一次生成后采用。
- 第 5 节自检：1通过；2通过；3通过；4通过；5通过（大鼓与锣结构正确）；6通过；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: two or three children listen to lively Peking-opera rhythms beside a small paper stage in the morning.
Must include: one abstract Peking-opera face pattern with no identifiable character; one small traditional Chinese drum and one gong; children listening in profile or from behind.
Mood: spirited Beijing stage.
```

## pep-g2s1-u2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画（标题区低细节连通块约 21.2%）；教材依据《我们一起打快板》p.14、《津冀之声》p.17、《小放牛》p.20、《大逛灯》p.21、《小放驴》p.22。
- 画面核对：燕赵河谷、灯会灯串、装饰驴与竹板快板均出现；仅两名孩子，一侧脸、一背影，无其他人群。人物约 29%、24%，头脚完整入框。快板为一手持多片窄竹板的成组结构。
- 原尺寸裁脸检查：侧脸原像素裁片 E:\Projects\.tmp\pep-redraw\work\faces\pep-g2s1-u2-profile-native.png 中眼睛清楚可见；另一人背影。成品 1600×640，166,846 B，WebP quality 58；旧图 1600×640 / 159,622 B。手机宽度保留驴、灯串与两人轮廓。
- 模版自检：纸层景观与暖亮配色通过；无文字、水印、logo、伪文字；快板器形符合单手持多片竹板；人物不超三分之一并全身在框；教材民俗线索齐全。
- 生成修订：首稿出现多名近景/正脸人物且比例超限，弃用；第二稿限定仅两人、远景背影/侧影后采用。
- 最终场景提示词：

    Scene: A very wide elevated view of a lantern festival route through the燕赵 countryside at dusk. The landscape is the main subject: winding river, layered hills, stone path, small villages, rows of warm cut-paper lanterns, and one decorated donkey walking along the route. There are exactly two human figures in the entire image and no crowd or other people. Far on the right, two tiny primary-school children accompany the donkey; one carries a proper Chinese bamboo kuaiban clapper, several narrow bamboo plates held in one hand, while the other guides the donkey from behind. Each child is full-body and fully inside the frame, about one fifth of the 640-pixel banner height and never over one third; keep them small and distant, not foreground. The clapper player is a side profile with one clear small dark eye and eyebrow; the donkey guide is seen from behind. No other faces or people anywhere. Make the donkey, lantern strings, river bends and layered terrain much larger than the two children. Fill the left title third with low-contrast river ribbons, distant farmland, tree silhouettes, little lanterns and textured paths, with no empty flat sky.
    Must include: one decorated donkey; strings of paper lanterns; one bamboo kuaiban clapper in one child's hand; exactly two children in distant full-body profile/back view; layered river and fields.
    Mood: festive and regional.

## pep-g2s1-u3.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画（全图低细节约 27%）；教材依据《中秋大观园》p.24、《小小的船》p.24、《中秋的舞步》p.27、《爷爷为我打月饼》p.28、《听乐·赏月》p.29、《彩云追月》p.30。
- 画面核对：高空俯瞰中秋庭院，圆桌月饼、木模、圆月、屋瓦与水中月影齐备；两名孩子和一位长辈均为小比例背影。人物约 19%、18%、18%，头脚完整、互不遮挡。
- 原尺寸裁脸检查：全为背影，无可见侧脸。成品 1600×640，178,142 B，WebP quality 44；旧图 1600×640 / 151,706 B。390px 预览仍可辨庭院环形结构与月饼桌。
- 模版自检：剪纸纸层与冷暖月夜配色通过；无文字、水印、logo、伪文字；无乐器结构要求；人物比例/完整入框通过；标题侧以屋瓦、云、园石和水面反光填充；月饼家庭、圆月与中秋条目相符。
- 生成修订：前两稿家庭人物均过大，弃用；第三稿进一步拉远并改为庭院航拍远景。高密度纹理需 quality 44 才低于 180 KB 单元图限制。
- 最终场景提示词：

    Scene: Draw an expansive moonlit Chinese courtyard from a very high distant aerial viewpoint; the complete tiled roofs, round reflection pond, curved garden walks and moonlit trees fill the whole panorama. The small family mooncake gathering occupies only a tiny area at the far-right edge. Exactly three full-body figures stand beside a small round table: two children and one grandparent, all seen from behind. Each person is a tiny figure only 10% of the total picture height (about 64 pixels out of 640), with heads and feet visible and ample space around them; do not enlarge them. The round table is about twice their combined height and holds visible mooncakes, a wooden mould and small tea dishes. Make the huge courtyard, tiled roof bands, pond, moon reflection, and autumn leaves dominate. Keep human faces too distant to be visible, with no portraits or close foreground bodies. Fill the left title third with low-contrast layered roof tiles, moonlit clouds, garden stones and pond reflections, no blank flat area.
    Must include: very small family group of two children plus one grandparent; round mooncake table with wooden mould; full moon; Chinese roofscape; reflection pond and moonlit garden path.
    Mood: warm family reunion.

## pep-g2s1-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 分类：漏画补画（必须）。
- 来源依据：SOURCES.md：二上 U4，《编花篮》p.35、《中州古乐》p.36、《十枝花》p.38。
- 画面与修订：以中原田野、编花篮和《十枝花》为叙事核心。三名孩子在右侧合作编篮；篮中已修正为恰好十朵彼此可数的花，篮外保留田野小花。左标题区为低对比草地、田垄、淡路、远山与树层。
- 逐图自检：三名完整跪姿儿童约占画高 22–27%；两名侧脸有眼睛和眉毛，另一名为背影。花篮内分三排共十朵清晰花头（3+3+4）。左标题区无大片平涂空白，约 25% 为低细节天空但与山水、田野层相接。无文字、水印或实体乐器。
- 文件与复核：1600×640，178,624 B；源 PNG 1983×793；quality 76；4 轮（含篮花数量修正）。最终人物检查截图：work/faces/pep-g2s1-u4-profiles-final.png；花篮截图：work/faces/pep-g2s1-u4-basket-round4.png。

首轮完整提示词：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    Scene: two or three small schoolchildren weave one flower basket together in a bright open central-plains field, surrounded by exactly ten distinct colorful blossoms and a few soft musical ribbons; show the children full-body and no taller than one quarter of the full image height where possible, never above one third, in back view or side profile, with one clear small eye and eyebrow on every visible profile. Keep the basket and children in the right two-thirds. Fill the left title third with low-contrast layered grassland, gentle field bands, a faint curving path and distant tree-covered hills; no empty flat sky and no extra flowers beyond the ten story blossoms.
    Must include: one woven flower basket; ten separate colorful blossoms; small children working together; soft paper sound ribbons.
    Mood: joyful central-plains folk song.

修订提示词 1：

    Correct the scale and blossom count in this illustration while preserving its central-plains landscape, river, path and one woven basket. The three children are much too large: reduce each to about half the current height, so every complete child is about 22–25% of the full image height (roughly 140–160 pixels in the 1600x640 final), never above one third. Keep each full figure inside the frame, with head, arms, legs and feet visible; show side or back views, and add one clear small eye and eyebrow to every visible profile. Keep them small relative to the basket. Make exactly ten separate, countable colorful blossoms, grouped in and immediately around the basket; remove the oversized row of large foreground flowers and add no extra blossoms elsewhere. Fill the left title third softly with layered grass, gentle field bands, a faint path, distant hills and trees; no empty flat sky or green patch. The title area stays low-contrast. Preserve the paper-cut card layers, palette and panoramic framing. No text or logos.

修订提示词 2：

    Recompose only the people and the basket flowers to meet the scale. Keep the same panoramic paper-cut field, river, path, distant hills and woven basket. The three children are still too large: redraw them as small, distant full-body figures at the right, each exactly around 150–165 pixels tall in the final 1600x640 image (about one quarter of image height, never above one third). They must read as children in the landscape, not foreground portraits; keep all heads, arms, legs and feet complete and inside the frame. Show them in back or side view, with a clear small eye and eyebrow on each visible profile. Make the basket medium-sized, not larger than needed. Show exactly ten distinct countable blossoms arranged in or beside the basket, and no other flowers anywhere; fill the left title third with softly layered grass, hills, a faint path and trees. Keep it calm, low-contrast and filled, not blank. Preserve the central-plains folk-song setting, one basket, paper layers and warm palette. Do not add text, houses, or extra objects.

修订提示词 3：

    Edit this existing 5:2 layered paper-cut illustration. Preserve the entire panoramic composition, the three small kneeling children and their side/back views, their visible profile eyes, the woven basket, hills, stream, bridge, tree, flowers in the landscape, sound ribbons, colors, framing and all other details. Change only the flower basket: it currently contains too many blossoms. Redraw the flowers in and at the basket so there are exactly ten separate, clearly countable flower heads total, each with a distinct center and petals, arranged naturally inside the basket. Remove every extra blossom from the basket beyond those ten. Do not remove or alter the children, basket, landscape, path, or any other flowers outside the basket. Keep every child fully in frame and small, at most one third of image height. Preserve the handmade layered paper texture and the original wide 5:2 framing. Add no text, lettering, watermark, logo, people, or objects.

## pep-g2s1-u5.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画（全图低细节约 29%）；教材依据《沂蒙山小调》p.40、《花蛤蟆》p.41。
- 画面核对：三只具有自然蛙体比例和折叠后肢的纸蛙分布在荷叶上；水面、芦苇、弧形石岸、沂蒙丘陵齐备。两名小听众约 30%、28%，背影、全身在框。
- 原尺寸裁脸检查：人物均背影，无可见侧脸。成品 1600×640，175,804 B，WebP quality 56；旧图 1600×640 / 146,726 B。390px 预览保留池塘、蛙与人物关系。
- 模版自检：纸艺层次和配色通过；无文字水印；不要求教学乐器；人物比例及入框通过；左侧芦苇、水纹、山丘和花草无大片空白；与蛙鸣及沂蒙山主题相符。
- 最终场景提示词：

    Scene: At water level, frame a broad pond in the rolling Yimeng hills at late afternoon. Three naturally proportioned paper-cut frogs call across lily pads and reeds; show real frog bodies and folded hind legs, not human-like faces or mascot styling. On a curved stone bank far to the right, exactly two small primary-school children pause to listen, full-body and completely inside the frame, each about one fifth of the banner height and never over one third. Both children are seen from behind, with heads and feet visible. Keep the children tiny and secondary to the pond; frogs, lily pads, reeds and rippling water are much larger. Fill the left title third with layered water ripples, reeds, wildflowers, low Yimeng ridges and textured cloud layers, with no blank sky or flat paper.
    Must include: three natural frogs calling from separate lily pads; curving pond bank; two small full-body back-view children listening; reed beds; layered Yimeng hills and water ripples.
    Mood: playful and tranquil.

## pep-g2s1-u6.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：建议重画；教材依据《荡漾的节拍》p.50、《乘着歌声的翅膀》p.51、《泛舟凤鸣河》p.52、《愉快的梦》p.54、《春游》p.56、《重复与对比》p.57、《船歌》p.58。
- 画面核对：高斜俯视的一叶木船穿过拱桥；两名歌唱孩子为小比例背影，约 20%、19%，鞋和头部均可见。双桨、小船和水纹为主，不与 u5 的池塘静态蛙景重复。
- 原尺寸裁脸检查：全为背影，不露面。成品 1600×640，179,290 B，WebP quality 60；旧图 1600×640 / 164,826 B。390px 预览仍能辨舟、桥和两人。
- 模版自检：剪纸层次和配色通过；无文字水印；木船为窄长船体、左右双桨；人物完整入框；标题区由河弯、岸芦、花树和远丘铺满；歌曲与摇曳律动主题相符。
- 最终场景提示词：

    Scene: From a high oblique overhead viewpoint, follow a narrow Chinese riverboat gliding beneath a small arched paper bridge along a winding spring river. Two tiny primary-school children sing together aboard the boat, seen only from behind; show each complete seated body with head and shoes visible inside the boat, no cropping and no close-up. Each child is only about one sixth of the 640-pixel banner height, never over one third. The slim wooden sampan, its two short oars, curling water ribbons, bridge, reeds and flowering banks are much larger than the children. Keep the riverboat in the right half as the clear focal subject. Fill the left title third with low-contrast river bends, shore reeds, layered flowering banks and distant green hills; no blank flat water or sky.
    Must include: one small wooden riverboat with two oars; two tiny children singing as back views; arched paper bridge; curved ripples; reed and flower banks.
    Mood: gentle and rhythmic.

## pep-g2s1-u7.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：建议重画；教材依据《嘀哩嘀哩》p.60、《音乐中的四季》p.62、《梅花》p.64、《小池》p.65。
- 画面核对：一圈连续园路由冬雪、春梅、夏荷、秋叶自然过渡，无硬分割；小池、水纹和一名看池孩子齐备。孩子约 28%，背影、头脚完整在框。
- 原尺寸裁脸检查：背影无可见脸。成品 1600×640，179,808 B，WebP quality 50；旧图 1600×640 / 162,522 B。390px 预览四季环池结构仍清楚。
- 模版自检：剪纸纸艺、季节配色层次通过；无文字水印；不要求乐器；人物比例/入框通过；左侧季节树叶、花草、园路细节丰富；四季、梅花、小池等教材线索相符。
- 最终场景提示词：

    Scene: A single circular garden path surrounds a still pond and subtly travels through all four seasons without hard panel borders: winter snow and bare branches at the upper left; spring plum blossoms and soft rain across the upper right; summer lotus leaves and green shade below; autumn gold leaves and grasses along the left. Let each season blend naturally into the next around the ring. One small primary-school child watches the pond from the far-right bank, full-body and completely inside the frame, seen only from behind, about one fifth of the banner height and never over one third. The seasonal garden, plum blossoms, pond and layered leaves are much larger than the child. Include delicate ripples and a few petals on the water. Fill the left title third with soft layered leaves, curved garden path, distant hills and seasonal flowers; no blank flat sky or plain area.
    Must include: one tiny full-body back-view child; four distinct but softly connected seasons; plum blossoms; a still pond with visible ripples; a circular garden path.
    Mood: reflective and bright.

## pep-g2s1-u8.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：建议重画；教材依据《蜗牛与黄鹂鸟》小小音乐剧 p.68。
- 画面核对：圆形层叠皮影幕上，蜗牛沿枝缓慢攀爬、黄鹂在上方停栖；灯笼、帷幕、园景侧屏齐备。两名观众约 27%、25%，背影，头脚完整并远离边缘。
- 原尺寸裁脸检查：均为背影，不露面。成品 1600×640，160,710 B，WebP quality 58；旧图 1600×640 / 153,934 B。390px 预览中圆屏故事仍可辨。
- 模版自检：纸艺剪影、暖色夜景通过；无文字水印；无需教学乐器结构检查；人物比例/完整入框通过；标题区有帷幕、侧屏、枝叶和河岸；故事内容符合小小音乐剧。
- 最终场景提示词：

    Scene: A wide outdoor shadow-puppet theatre in a lantern-lit garden at night. On the right two-thirds, a layered circular shadow screen holds the snail-and-oriole story: one paper snail slowly climbs a winding branch while a bright oriole perches above, with cut-paper leaves and a small moon behind the screen. The puppet figures are simple animal silhouettes with natural proportions, not mascots and not portraits. Exactly two tiny children watch from the far-right edge, full-body and entirely inside the frame, seen only from behind, each about one sixth of the banner height and never over one third. Their heads and shoes are visible; they stay small, secondary and separated from the frame edge. The theatre screen, layered lanterns, side curtains, garden branches and patterned floor dominate. Fill the left title third with low-contrast curtain folds, side screens, leafy cut-outs and winding branch motifs, no blank wall or flat sky.
    Must include: snail climbing a branch; oriole perched above; circular layered shadow-puppet screen; exactly two small full-body back-view child spectators; lantern-lit garden theatre.
    Mood: lively and story-like.

## pep-g2s2.webp

- 册别/单元：二年级下册封面
- 教材依据：《致同学》“美丽动听中国行”p.4；《北方森林之声》p.10、《勇敢的鄂伦春》p.16、《水之歌》p.18–26、《雪花》p.56。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：2 次；首稿出现无依据的帐篷、篝火和庆典物件；第二稿仍有未请求的手持物，终稿限定为三名空手学生、兴安岭森林、瀑布和积雪。
- 第 5 节自检：1通过；2通过；3通过；4通过；5通过（终稿无实体乐器）；6通过（左下以雪地为主，较安静）；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; keep the lower-left third calmer (a title and a dark gradient will be laid over it on the website). Rich detail, professional picture-book quality.
Scene: exactly three schoolchildren with empty hands walk along a snow-edged path beside a northern forest river toward one broad waterfall; keep the lower-left foreground calm, with no carried objects, backpacks, instruments, buildings, tents, campfires, animals or other people.
Must include: tall evergreen forest of the Greater Khingan; one waterfall and winding river; a light layer of snow.
Mood: adventurous northern music journey.
```

### 已弃用提示词 1（重画记录）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; keep the lower-left third calmer (a title and a dark gradient will be laid over it on the website). Rich detail, professional picture-book quality.
Scene: exactly three schoolchildren follow one flowing sound ribbon through a northern musical journey linking evergreen forest, waterfall and moonlit gathering.
Must include: tall pines beneath the Greater Khingan ridge; one flowing waterfall and river; a small dance circle under a bright full moon with mooncakes; broad quiet lower-left foreground.
Mood: curious winter-to-spring journey.
```

### 已弃用提示词 2（重画记录）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; keep the lower-left third calmer (a title and a dark gradient will be laid over it on the website). Rich detail, professional picture-book quality.
Scene: exactly three schoolchildren follow a quiet sound ribbon along a snow-edged path beside a northern forest river toward one broad waterfall; keep the lower-left foreground calm, with no buildings, tents, campfires, animals, instruments or other people.
Must include: tall evergreen forest of the Greater Khingan; one waterfall and winding river; a light layer of snow.
Mood: adventurous northern music journey.
```

## pep-g2s2-u1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画；原稿缺《合唱的魅力》《送别》的合唱/离别场景。教材依据《美丽的黄昏》p.1、《合唱的魅力》p.2、《保卫黄河》p.3、《音程》p.4、《送别》p.7–8。
- 画面核对：远景空渡船离岸、石阶、两条系缆、晚霞河面和两名送别歌者齐全；一名背影、一名侧影；均约 20–23%，头脚完整在框。成品横向裁切窗右移以保留两人，人物无变形。
- 原尺寸裁脸检查：侧影裁片 E:\Projects\.tmp\pep-redraw\work\faces\pep-g2s2-u1-profile-native.png 中眼睛、眉毛可见；另一名为背影。成品 1600×640，160,474 B，WebP quality 62；旧图 1600×640 / 153,026 B。390px 预览两人、渡船和河面音带均可见。
- 模版自检：层叠纸景与配色通过；无文字、水印、logo、伪文字；无教学乐器结构要求；人物比例和完整入框通过；标题侧由柳枝、芦苇、河水与河岸石填充；合唱、和声、渡船送别线索齐全。
- 生成修订：前五稿分别因人物超限、人物过小、人物超限、缺渡船、人物超限而弃用；第六稿补全空渡船、缆绳与人物尺寸后采用。
- 最终提示词（场景段）：

    Scene: From a very high distant viewpoint, show a broad dusk river ferry landing. A small empty wooden ferry boat is already pulling away from stone landing steps; two long mooring ropes connect its stern to the bank. The winding river, reflections, reeds, far hills and ferry landing fill nearly the entire panorama. Exactly two primary-school friends stand on the distant far-right steps, singing toward the departing boat. Each is a tiny full-body figure only about 12% of the image height (roughly 77 pixels of the 640-pixel banner), with head and feet inside the frame, never close to the camera. One child is seen from behind and the other is a side profile with one visible dark eye and eyebrow. There are no other people or faces anywhere. Three pale cut-paper sound ribbons weave softly above the river. Make the ferry, ropes, water and landscape much larger than the tiny children. Fill the left title third with low-contrast evening clouds, rippled reflections, layered willow branches, reed beds and bank stones; no blank flat area.
    Must include: empty departing wooden ferry; two mooring ropes; stone landing steps; exactly two tiny full-body children singing toward the boat; overlapping sound ribbons; dusk river landscape.
    Mood: tender farewell.

## pep-g2s2-u2.webp

- 册别/单元：二年级下册，第二单元《高高的兴安岭》
- 教材依据：《北方森林之声》p.10、《月亮，月亮》p.13、《欢迎你来做客》p.14、《勇敢的鄂伦春》p.16。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：0 次；一次生成后采用。
- 第 5 节自检：1通过；2通过；3通过；4通过；5通过；6通过；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: two or three children greet one another along a forest path beneath the tall pines of the Greater Khingan mountains, with a pale moon still visible at dawn.
Must include: evergreen northern forest; one pale round moon; children greeting a friend.
Mood: welcoming and brave.
```

## pep-g2s2-u3.webp

- 册别/单元：二年级下册，第三单元《水态万千》
- 教材依据：《水之歌》p.18、《泉水叮咚响》p.20、《一滴水的旅行》p.22、《伏尔塔瓦河》p.26；单元首页活动含《望庐山瀑布》。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：0 次；一次生成后采用。
- 第 5 节自检：1通过；2通过；3通过；4通过；5通过；6通过；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: exactly three children follow the journey of one bright water droplet from a cloud into a lively waterfall and onward along a clear river.
Must include: one broad waterfall; a clear stream flowing into a river; one small water droplet motif; children watching from the bank.
Mood: sparkling and fluid.
```

## pep-g2s2-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画（标题区低细节连通块约 19.9%）；教材依据《象帽舞》p.28、《白山黑土歌舞汇》p.30、《新东北风》p.32、《桔梗谣》p.33、《四物乐》p.34。
- 画面核对：长白山雪岭、松林、村落舞场、三名转步舞者、白帽长飘带与一面小长鼓齐全。人物约 27%、26%、25%，全身在框；三张侧脸均有眼睛。
- 原尺寸裁脸检查：三名侧影原像素裁片拼图 E:\Projects\.tmp\pep-redraw\work\faces\pep-g2s2-u4-profiles-native.jpg 已逐一检查，眼睛清晰；第三人单裁片为 pep-g2s2-u4-profile3-native.png。成品 1600×640，178,484 B，WebP quality 52；旧图 1600×640 / 170,950 B。
- 模版自检：纸层景观、雪岭冷色与红金舞场通过；无文字水印；腰鼓形体不作为结构判定，长鼓为两端张紧鼓面、腰身收窄的正确长鼓形；人物比例、完整度和侧脸眼睛通过；标题区有松枝、雪坡、山脊和云层；舞蹈、服饰与长白山主题吻合。
- 生成修订：首稿误出前景观众与额外人物且人物过大，弃用；第二稿限定仅三名小比例舞者和独立长鼓后采用。
- 最终提示词（场景段）：

    Scene: From a very high distant viewpoint above a snowy village, show Changbai Mountain ridges, layered pine forest and an open circular dance plaza as the main subjects. Exactly three child dancers perform a Korean traditional hat dance at the far-right edge of the plaza. There are no spectators, no musicians, no adults and no other people anywhere in the image. Each dancer is a small full-body figure about one sixth of the banner height, never over one third, completely inside the frame with heads and feet visible. Show all three in clear side profile; each visible profile has one distinct dark eye and eyebrow. Their costumes are simple traditional white dance clothing with coloured waist sashes and small white hats; one hat carries a long thin ribbon trailing in a graceful curve. A single small janggu drum with a clear hourglass body and two taut heads rests on a low stand near the plaza, with no person beside it. The snowy mountain, pines, village roofs, plaza and ribbon remain much larger than the dancers. Fill the left title third with layered Changbai ridges, pine branches, snow banks, a curved stream and soft clouds; no empty sky or flat paper.
    Must include: exactly three small full-body side-profile dancers with visible eyes; one white hat with a long ribbon; one correctly shaped janggu on a stand; open round dance plaza; Changbai Mountain and pine forest.
    Mood: energetic and festive.

## pep-g2s2-u5.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画；原稿有近景正脸且缺辽西民俗/拜年线索。教材依据《辽西民谣变变变》p.36、《正对花》p.40及单元首页活动《小拜年》。
- 画面核对：辽西冬日村巷、红色剪纸窗花、两名孩子互拜并交换一对纸花，均为远景完整侧影。人物约 18%、17%，两张脸的眼睛和眉毛可辨。
- 原尺寸裁脸检查：两张脸的原像素裁片 E:\Projects\.tmp\pep-redraw\work\faces\pep-g2s2-u5-profiles-native.png 显示两双眼睛；成品 1600×640，177,380 B，WebP quality 58；旧图 1600×640 / 160,980 B。人物未贴边。
- 模版自检：纸层屋瓦、砖墙、石路和冬枝通过；无文字、水印、logo、伪文字；无教学乐器要求；人物比例及侧脸眼睛通过；标题侧由屋瓦、巷路、裸枝和雪面填充；辽西民谣、拜年、对花三个锚点可见。
- 生成修订：首稿虽包含拜年和纸花，但人物为对视近景；第二稿把两人改为远巷侧影后采用。
- 最终提示词（场景段）：

    Scene: From a very high distant viewpoint above the lane, show a broad Liaoxi village in early winter: brick homes with dark tiled roofs, wooden gates, a willow fence, snow-dusted paving and red paper window flowers fill the whole panorama. In the far-right middle distance, exactly two primary-school children exchange small paper flowers and greet each other for New Year. Each is a small complete full-body figure about 15% of the banner height (roughly 96 pixels in a 640-pixel image), never over one third, with heads and shoes visible. Show both in side profile at a distance; each visible face has one small clear dark eye and eyebrow, never a large face or close-up. The children are secondary to the long village lane and houses. Keep their plain everyday winter clothes simple, with no historical costume or decorative accessories. Add paired cut-paper flower motifs and a few faint musical ribbons above the lane to suggest the folk song exchange. Fill the left title third with soft low-contrast roof tiles, stone paving, bare branches, snow patches and small paper window flowers, with no blank flat sky or wall.
    Must include: two distant full-body side-profile children with visible eyes; New Year greeting; paired paper flowers; Liaoxi village lane; red cut-paper window flowers; plain winter clothing.
    Mood: warm and neighborly.

## pep-g2s2-u6.webp

- 册别/单元：二年级下册，第六单元《音乐大比拼》
- 教材依据：《鼓圈》p.48（教材注明非洲鼓）。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：0 次；一次生成后采用。
- 第 5 节自检：1通过；2通过；3通过；4通过；5通过（非洲鼓为立式杯形鼓、鼓面清晰）；6通过；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: exactly three schoolchildren sit in a small rhythmic circle and take turns tapping one African hand drum together.
Must include: one correctly shaped African hand drum with a goblet profile and taut round drumhead; three children keeping the beat with their hands; a simple circle arrangement.
Mood: lively and rhythmic.
```

## pep-g2s2-u7.webp

- 册别/单元：二年级下册，第七单元《奥林匹克风》
- 教材依据：《雪花》p.56、《一起向未来》p.60、《校园运动会》p.62。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：0 次；一次生成后采用。
- 第 5 节自检：1通过；2通过；3通过；4通过（无正脸特写）；5通过（终稿无实体乐器）；6通过；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: three schoolchildren run a friendly relay at a school sports meet as a few paper snowflakes drift overhead.
Must include: a clear school sports field; children passing one relay baton; snowflakes and flowing sound ribbons; no logos or lettering.
Mood: energetic and hopeful.
```

## pep-g2s2-u8.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画（全图低细节约 26%）；教材依据《爷爷为我打月饼》p.66 小小音乐剧，以及《中国少年先锋队队歌》p.73。
- 画面核对：长工坊工作台、木制月饼模、竹托盘、月饼、面粉碗、炉灶和月夜窗格齐全；爷爷侧影、两名孩子背影均在远景且完整入框，人物约 26%、25%、25%。红领巾为无标记普通布条。
- 原尺寸裁脸检查：爷爷原像素侧脸裁片 E:\Projects\.tmp\pep-redraw\work\faces\pep-g2s2-u8-grandpa-profile-native.png 中眼睛、眉毛清楚；两名孩子均背影。成品 1600×640，179,034 B，WebP quality 54；旧图 1600×640 / 165,274 B。
- 模版自检：剪纸纸层结构与工坊暖色通过；无文字、水印、logo、伪文字；木模、压饼工具、烤炉与竹托盘可辨；人物比例和完整入框通过；标题侧由架子、竹托盘、格窗、花枝及工坊梁柱填满；教材制作月饼与家庭情境命中。
- 生成修订：首稿人物超限；第二稿改成从院外远望整间工坊后采用，月饼制作工具成为主景。
- 最终提示词（场景段）：

    Scene: From a high distant viewpoint outside a traditional mooncake workshop, look through its broad open doorway into the entire room. The long wooden workbench, carved mooncake press, trays of round cakes, flour bowls, bamboo baskets, stove, shelves, beams and lattice windows fill almost the whole panorama. Exactly three small figures stand deep inside at the far-right end of the workbench: one grandfather demonstrating the mould and two children watching. Each complete full-body figure is only about 15% of the image height (roughly 96 pixels in the 640-pixel banner), never over one third; keep them tiny, distant, and away from the camera, with heads and feet visible. Both children are seen from behind. The grandfather is a small side profile with one clear dark eye and eyebrow. No other people or close faces anywhere. The moon and night garden appear beyond the lattice window. A plain red scarf without emblem hangs from a peg as a small secondary detail. Let the workshop, mould, cakes and architecture remain much larger than the tiny family. Fill the left title third with soft layered beams, shelves, window lattice, bamboo trays and flowering branches; no blank wall or flat paper.
    Must include: carved wooden mooncake press; round mooncakes on bamboo trays; one small grandfather profile with clear eye; two tiny full-body child back views; moonlit lattice window; plain red scarf.
    Mood: warm and affectionate.

## pep-g3s1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 课本依据：教师收花、春季校园花园与册内师生主题。
- 生成轮次：3 次；前两版人物超出三分之一，第三版为定稿。
- 返工说明：老师改为远景侧影，学生改为小背影；花园、河道、桥与花径占画面主导，左下标题区继续有景物。
- 人物高度：教师约 22%；两名学生约 20%、17%。 最大约 22%。

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    
    Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; the lower-left third (where a title and a dark gradient will be laid on the website) stays softer and lower in contrast but still filled with scenery such as grass, flowers, paths, distant trees or floor patterns, never an empty flat area. Rich detail, professional picture-book quality.
    
    Scene: A long-distance panoramic view over a layered spring school garden from across its small river; the garden landscape is the subject and occupies nearly the whole frame, while a tiny flower-giving moment sits by the far-right gate. Show the teacher and two pupils as small full-body paper figures only about one eighth of the image height (roughly 90 pixels in the final 750-pixel cover), never closer than the middle distance; the teacher is a side-view figure with one visible eye, and both pupils are seen from behind. Surround them with a large flowering tree canopy, low school roofs, soft hills, a bridge, a winding stone path and flower beds that fill the lower-left title zone; the figures must remain much shorter than the doorway and tree trunk, not portraits.
    Must include: distant teacher receiving a bouquet; blank handmade card; spring garden and winding path; layered blossom trees.
    Mood: gentle gratitude.

## pep-g3s1-u1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 课本依据：教师收花、校园窗景及谢师主题。
- 生成轮次：2 次；首版教师近景过大，第二版为定稿。
- 返工说明：改为远望校园整面窗景；教师侧影与学生背影留在最右侧门边；删去拥挤桌椅，窗景、花径和山水为主。
- 人物高度：教师约 28%；学生约 19%。 最大约 28%。

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    
    Scene: View the school from far across its quiet garden courtyard, with the classroom facade and flowering yard as the main subject; at the far-right doorway, a teacher gives one flower to a child, both tiny full-body figures only about one fifth of image height, clearly secondary to the landscape, with no foreground people. The teacher is shown in a small side profile with one visible dark eye and brow; the child is seen from behind. Use a broad view of soft layered window panes, garden vines, curved stone paths, shrubs and low hills; keep the left title third filled with low-contrast blossoms, path stones and distant classroom windows, and avoid a close view of furniture or people.
    Must include: teacher and pupil exchanging a flower; classroom doorway and windows; quiet garden courtyard; layered stone path and flowering shrubs.
    Mood: warm and quiet.

## pep-g3s1-u2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 课本依据：立式钢琴、琴键、空白琴谱与听琴学生，依据“乘着歌声的翅膀”“献给爱丽丝（片段）”。
- 生成轮次：3 次；前两版人物偏大/多出无依据吉他，第三版为定稿。
- 返工说明：人物改为远处背影或侧影，钢琴课只保留立式钢琴；窗外山水、河湾与云层成为主体，家具从简。
- 人物高度：三名学生约 31%、30%、29%。 最大约 31%。

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    
    Scene: A very distant establishing view across an open music classroom toward broad windows filled with layered blue hills, river bends and paper-cut clouds; at the far right, a small upright piano and three tiny full-body pupils form a group, each pupil only about one sixth of image height, with no one in the foreground. One pupil plays the piano from behind, while the other two listen with relaxed empty hands in distant side or back views; every visible profile has a clear small dark eye and eyebrow. Show only one instrument in the whole scene: the upright piano, with its recognizable body and one clear row of alternating black and white keys; no guitar, no violin, no other instrument. The landscape beyond the windows is the main subject, with soft floor-paper patterns and a few window frames; keep the left title third gently layered with hills, water and clouds rather than furniture.
    Must include: small upright piano with readable keyboard; three distant pupils in back/side views; blank music sheet; soft flowing note ribbons.
    Mood: bright and attentive.

## pep-g3s1-u3.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 课本依据：“人说山西好风光”“滚核桃”“埙的故事”；山西音乐汇 p24、交城山 p26、桃花红杏花白 p27、滚核桃 p28、埙的故事 p30、阳关三叠 p32。
- 生成轮次：2 次；首版坐姿孩子接近半幅高，第二版为定稿。
- 返工说明：去掉前景近景男孩，改成核桃树下两名小学生；一人侧身吹埙，一人背影拾核桃；保留黄土坡、窑洞与远处河谷。
- 人物高度：吹埙学生约 32%；拾核桃学生约 26%。 最大约 32%。

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    
    Scene: A very distant wide panorama of Shanxi loess hills, a winding river valley and a few cave dwellings, with one broad walnut tree rooted on a ridge in the right middle distance; two tiny standing full-body pupils beneath its canopy are only about one eighth of image height, at least 100 paper steps away in perspective, never foreground or seated, one seen in small side profile playing a tiny oval pottery xun at the lips with one visible eye, the other seen from behind gathering walnuts beside a woven basket. Keep both children much smaller than the tree trunk and less than half the cave-door height; make the paper-layer landforms, walnut canopy, river bend and hazy ridges fill nearly the whole picture. Show the xun as an egg-shaped clay vessel flute with one top blowing hole and several small finger holes, visibly held in both hands. Keep the left title third softly filled with layered earth banks, river and low grasses.
    Must include: small side-view child playing an egg-shaped pottery xun with finger holes; walnut tree and basket; Shanxi loess slope with cave dwellings; distant river valley.
    Mood: rooted and lyrical.

## pep-g3s1-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 课本依据：“红领巾寻访革命圣地”p38、“山丹丹开花红艳艳”p40、“军民大生产”p41、“延安的故事”p42；秦川乐风 p34。
- 生成轮次：1 次，本次首轮完成。
- 返工说明：保留窑洞、红星旗、腰鼓与山丹丹；两名鼓手缩为远处侧影，前景背包男孩移除，第三名学生留作小背影。
- 人物高度：两名鼓手约 28%、26%；远处学生约 12%。 最大约 28%。

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    
    Scene: A sweeping paper-cut panorama of northern Shaanxi loess ridges, winding paths, cave dwellings and red shandan flowers; far on the right ridge, two small full-body red-scarved pupils play waist drums in side view, each only about one sixth of image height, with one tiny clear eye and brow on any visible profile, while a third pupil is a distant back-view silhouette on the path and no person appears in the foreground. Show each short double-headed cylindrical drum secured horizontally at the waist with a visible strap and two short sticks; scatter a few small red star flags above the distant cave dwellings as in a school visit, but keep all figures much smaller than the layered landforms and flowers.
    Must include: red-scarved pupils with correctly strapped waist drums; paired drumsticks; northern Shaanxi cave-dwelling loess ridges; red shandan flowers and small red star flags.
    Mood: historic and resolute.

## pep-g3s1-u5.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 课本依据：“丝绸之路驼铃声”p58、“丝绸之路敦煌舞”p60、“学跳敦煌舞”p62。
- 生成轮次：2 次；首版出现壁龛人像且人物偏大，第二版为定稿。
- 返工说明：去掉壁龛、壁画与雕像；舞者及观者缩为沙丘远景中的小人物，保留驼铃、沙丘与花纹毯。
- 人物高度：舞者约 20%；观者约 14%。 最大约 20%。

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    
    Scene: A very distant open-desert panorama of the Silk Road, with long bands of layered dunes, far ridges, pale clouds and a small camel caravan with hanging bells crossing the horizon; on a simple patterned flower rug in the far-right middle distance, only two tiny full-body pupils, each about one eighth of image height, one making a restrained Dunhuang-inspired dance gesture in clear side profile with one visible eye and eyebrow, the other watching from behind, no foreground figures and no other people anywhere. The vast sand layers and caravan trail dominate the frame; make the rug a small ground accent and keep both children far away, distinctly smaller than nearby dune grasses.
    Must include: tiny side-profile dance pose with a visible eye; distant camel caravan with hanging bells; layered desert ridges and dunes; modest patterned flower rug.
    Mood: spirited and ancient.
    No caves, cliff niches, cave temples, carved figures, portraits, murals, wall paintings, statues, or people with the caravan.

---

## pep-g3s1-u6.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- **课本依据：** 3S1目录 p6；“东郭先生与狼”p64；课文线索：山道、农田、茅屋、书生、老狼及驴。
- **复绘依据：** T141验收列为必须重画：旧图虽有故事角色，但标题区与构图需避免空天和主体挤压；本版把寓言主体放右侧，学生缩为远处小背影。
- **生成轮次：** 2 次；第 1 版前景学生过大、削弱书生与驴；第 2 版为最终稿。
- **尺寸 / 体积：** 1600×640，179,954 B；质量参数 quality=58、method=6。
- **模板自检：**
  1. 剪纸纸艺层叠、纸纤维与柔和投影：通过；画面整体遵循纸雕层次与指定暖亮色板。
  2. 单元内容与器物：书生、驴、岩脊后的狼、S 形山路、田埂与草丛都清楚；两名学生缩为远景背影。
  3. 构图差异：各图使用不同场景透视与主线动作；标题区继续填充低对比景物。
  4. 侧脸眼睛：1 张可见书生侧脸，眼睛与眉毛清楚；两名学生为远处背影；狼的双眼可见但不计入人物侧脸。
  5. 文字与水印：人工目检未见文字、水印、机构标识或伪文字；空白卡片和琴谱保持空白。
  6. 标题区大片空白估计：约 0%。；柔和区域仍由景物填充。
  7. 裁切与手机显示：输出按模板比例精确适配；缩至 390px 宽时，书生、驴和岩脊后的狼仍可辨；学生不压住寓言主线。

最终画面段所用完整提示词：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    
    Scene: A broad side view through a paper-cut mountain valley. In the right two-thirds, a modest traveling scholar in traditional clothes walks beside a sturdy gray donkey along a winding path; show the scholar in small side profile with one distinct dark eye and eyebrow. Above and behind them, a wary wolf peers from behind a separate rocky ridge, not attacking. Two Chinese primary-school children are tiny full-body silhouettes far back on the trail, seen from behind and less than one tenth of the image height; no foreground children. The scholar, donkey and wolf are the clear story subjects. Use a gentle S-shaped path leading from the softly detailed left foreground through layered field edges and grasses toward the scholar, with receding trees and wooded hills filling the left title third; clouds and blue sky may show only as a narrow upper band, never a large empty area.
    Must include: traveling scholar; donkey; wolf watching from behind a ridge; winding mountain path; layered field edges and grasses; two tiny children seen from behind in the distance.
    Mood: wary and storybook.
    Absolutely no writing, letters, symbols that resemble words, or watermark.

## pep-g3s2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 分类：漏画补画（必须）。
- 来源依据：SOURCES.md：三下封面，册内“美丽动听中国行/环球音乐之旅”；《美丽的草原我的家》p.2、《春天来了》p.4、《致同学》p.4。
- 画面与修订：以辽阔蒙古草原、晨光、远山、河流和纸音带为主；两名孩子在右侧远景中背向观者。左下原有大块平涂草地，现补入低对比草层、稀疏野花、蜿蜒小路和远树，标题区仍安静但有景。
- 逐图自检：两名背影完整，约占画高 23–26%；左下平涂空白目测约 5%，其余为低对比草地和路径层。无建筑、动物、可读文字、水印或实体乐器。
- 文件与复核：1200×750，207,766 B；源 PNG 1585×992；quality 78；2 轮（首轮后移除无依据建筑/动物并缩小人物）。

首轮完整提示词：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; the lower-left third (where a title and a dark gradient will be laid on the website) stays softer and lower in contrast but still filled with scenery such as grass, flowers, paths, distant trees or floor patterns, never an empty flat area. Rich detail, professional picture-book quality.
    Scene: in the upper-right of a vast Mongolian grassland at dawn, exactly two small schoolchildren seen from behind follow one flowing paper sound ribbon toward a distant mountain horizon; fill the lower-left title third with softly layered grass blades, scattered wildflowers, a winding narrow path and distant trees, all low contrast and never a flat blank grass field.
    Must include: open grassland from the book's first unit; exactly two back-view children, each about one quarter of the image height and never above one third, full-body and fully in frame; a winding paper ribbon of musical notes leading toward the horizon; lower-left layered grass, flowers, path and far trees.
    Mood: open-hearted musical journey.

修订提示词 1：

    Edit this image while preserving its sunrise, distant Mongolian mountain horizon, winding river, grassland, path and flowing paper sound ribbon. Remove every tent, yurt, house and building, and remove every animal including horses; the image must show no animals and no buildings. Keep exactly two schoolchildren from behind on the far right. They are too large: reduce each full-body child to about 24–26% of the entire image height (never more than one third), feet and heads fully inside the frame. Preserve the left lower title area as gently filled grassland, but make its wildflowers and path low-contrast and sparse enough to leave calm space; include fine grass, scattered small wildflowers, a narrow winding path and distant tree layers, with no large blank flat green patch. Maintain the 8:5 landscape cover, layered paper-cut craft, paper fibres, soft shadows and reference palette. No tents, animals, buildings, physical instruments, text or logos.

## pep-g3s2-u1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 分类：漏画补画（必须）。
- 来源依据：SOURCES.md：三下 U1，《美丽的草原我的家》p.2、《春天来了》p.4。
- 画面与修订：两名孩子在蒙古草原春花间观察、行走，纸音带穿过草场；左侧以草坡、矮花和远山填充标题区。两人均为远景侧影，而非近景肖像。
- 逐图自检：两名完整儿童约占画高 22–24%；两个侧脸都有清晰小眼睛和眉毛。左标题区平涂空白为零，约 30–35% 是低细节天空，但有云层、山坡、草场层次。无动物、建筑、可读文字、水印或实体乐器。
- 文件与复核：1600×640，176,844 B；源 PNG 1983×793；quality 70；2 轮（修正首稿人物过大）。脸部复核截图：work/faces/pep-g3s2-u1-boy-profile.png、pep-g3s2-u1-girl-profile.png。

首轮完整提示词：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    Scene: two small children in side profile explore spring flowers in a bright Mongolian grassland while one soft paper ribbon of song curves through fresh grass; keep both children full-body, each about one quarter of the image height and never above one third, wholly inside the frame. Give every visible profile one clear small eye and eyebrow, with no blank faces. Place the children and the most vivid spring flowers in the right two-thirds. Fill the left title third with quiet but visible layers of grass, low wildflowers, gently rolling meadow and distant hills, keeping it low-contrast and never plain or empty; no animals, buildings or instruments.
    Must include: Mongolian grassland; spring flowers; exactly two children in profile with visible eyes; one flowing sound ribbon.
    Mood: fresh and expectant.

修订提示词 1：

    Keep the same grassland, stream, mountains, spring flowers, rising paper sound ribbon and two children, but correct the people scale decisively. The two children are too large and too close. Redraw each as a distant full-body figure about 145–155 pixels tall in the final 1600x640 image, around one quarter of image height and never above one third. They should be smaller landscape figures placed on the right two-thirds, not foreground portraits. Show all of each child's body inside the frame, with hands, legs and shoes complete. Keep both in side profile; each visible face must have one clearly visible small dark eye and eyebrow. Preserve the existing gentle grassland scenery and paper-cut palette, and keep the left title third softly filled with meadow and distant hills rather than blank sky. Do not add people, buildings, animals or instruments.

## pep-g3s2-u2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画；教材依据：《赤诚花》p.14、《四季歌》p.15、《东北亚音声》p.16、《樱花》p.19、《卖花姑娘》p.19、《牧羊人的歌》p.20。
- 画面核对：樱花冠、落花、曲桥、河流、花篮摊和远坡羊群呈现东北亚春景与牧歌；两名孩子一背影一侧影。 人物比例：两名孩子各约 32% 画高，处于上限以内；一背影、一侧影，均全身完整。
- 原尺寸裁脸检查：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g3s2-u2-profile-native.png`，侧脸眼睛和眉毛可见；另一人为背影。 成品 1600×640，177,958 B，WebP quality 54；旧图为 1600×640 / 125,444 B。
- 模版自检：层叠手剪纸面、纸纤维与柔和投影通过；未见文字、水印、logo 或伪文字；未画具体乐器，无结构误画；标题区平涂空白估算 约 8%，有花枝/山云/建筑/地貌柔和填充；教材地域与代表作品线索可辨；390px 手机预览下主体仍清楚。
- 重画与裁切记录：单次采用。原生成画幅 2172×724，按 x=0.45 取 1600×640 窗口，完整保留花枝、桥、两名孩子与花摊；右缘额外售卖者完全落在裁切窗外，未留下截断人物。
- 完整提示词（固定风格段 + 单元规格段 + 场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: A sweeping spring landscape on the Northeast Asian edge of a mountain river valley, seen from a high distant viewpoint. A broad canopy of cherry blossoms and falling petals fills the upper left, while a curved bridge and flower path lead toward a small flower basket stall and a few sheep grazing on distant green hills. Exactly two primary-school children pause on the bridge; each complete person is about one fifth of image height and never over one third, full-body and completely inside the frame with margin. One is a back view and one a small side profile with a clearly visible dark eye and eyebrow. Let the blossom canopy, river, bridge, hills, petals and delicate sound ribbon be much larger than the children. The left title third is softly detailed with overlapping blossom branches, layered water, petals and low hills, not blank sky.
Must include: large cherry-blossom canopy and falling petals; curved bridge over water; small flower basket stall; distant sheep on hillside; two full-body children in back/profile view; layered mountain river valley.
Mood: fresh and melodic.
```

## pep-g3s2-u3.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画；教材依据：《新疆之声》p.24、《美丽的夏牧场》p.26、《幸福花儿开心上》p.28、《歌舞新疆》p.30。
- 画面核对：天山雪峰、夏季草场、河流、杨树林、葡萄廊架院落、羊群和轻盈新疆舞步构成地域与歌舞线索。 人物比例：兩名舞者各約 29% 画高，低于三分之一；一背影、一侧影，完整入框。
- 原尺寸裁脸检查：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g3s2-u3-profile-native.png`，侧脸眼睛、眉毛清楚。 成品 1600×640，176,166 B，WebP quality 58；旧图为 1600×640 / 146,252 B。
- 模版自检：层叠手剪纸面、纸纤维与柔和投影通过；未见文字、水印、logo 或伪文字；未画具体乐器，无结构误画；标题区平涂空白估算 约 6%，有花枝/山云/建筑/地貌柔和填充；教材地域与代表作品线索可辨；390px 手机预览下主体仍清楚。
- 重画与裁切记录：首稿人物约 48% 超限；中景修订稿约 16% 偏小；再次调整至约 29% 后采用，舞步、天山河谷及葡萄院落均保留。
- 完整提示词（固定风格段 + 单元规格段 + 场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: A high, sweeping view over a Xinjiang summer pasture oasis beneath the snowy Tianshan range. A clear stream bends through layered green meadows and tall poplar groves toward a small Uyghur courtyard with a grape trellis and patterned gate; a few sheep graze across the valley. On a path in the right middle distance, exactly two school-age children practice a gentle Xinjiang folk-dance step. Keep each full figure about one quarter of the picture height and never over one third; head to shoes fully visible with generous margin. One child is a back view; the other is a side profile with a clear small eye and eyebrow. Their regional embroidered clothing is a small accent; the mountains, river, poplars, sheep and courtyard dominate. A soft music ribbon follows the stream. Fill the left title third with layered leaves, low hills and soft clouds, not blank sky.
Must include: snowy Tianshan; green summer pasture and river; poplar grove; small grape-trellis courtyard; distant sheep; exactly two full-body children in back/profile views doing a gentle folk dance.
Mood: open and lyrical.

Recompose the existing image so the two children are much farther into the middle distance. Each complete person must be about 22 percent of the image height and strictly less than one third, with full heads, arms and shoes in-frame. Keep them secondary to the Tianshan valley. The back-view child stays back-facing; the side-view child retains one clear eye and eyebrow. Do not otherwise change the scene.
```

## pep-g3s2-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：建议重画；教材依据：《北京的金山上》p.34、《次仁拉索》p.36、《紧缩与放大》p.37、《我的家在日喀则》p.37、《珠峰脚下乐声扬》p.38、《远古回声，眺望青藏》p.40、《格桑拉》p.42。
- 画面核对：青藏雪脊、蓝色冰湖、远村、牦牛、格桑花坡和小型锅庄舞圈；用斜向湖岸与花坡区别旧图通用双人雪山舞。 人物比例：三名孩子各约 20% 画高；两背影、一侧影，均完整入框。
- 原尺寸裁脸检查：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g3s2-u4-profile-native.png`，侧影眼睛可见；其余两人背影。 成品 1600×640，179,066 B，WebP quality 58；旧图为 1600×640 / 166,898 B。
- 模版自检：层叠手剪纸面、纸纤维与柔和投影通过；未见文字、水印、logo 或伪文字；未画具体乐器，无结构误画；标题区平涂空白估算 约 8%，有花枝/山云/建筑/地貌柔和填充；教材地域与代表作品线索可辨；390px 手机预览下主体仍清楚。
- 重画与裁切记录：首稿人物约 50% 超限；缩小舞圈至约 20% 后采用，完整保留珠峰雪脊、冰湖、牦牛、格桑花与锅庄舞。
- 完整提示词（固定风格段 + 单元规格段 + 场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: A broad Tibetan plateau from a high diagonal viewpoint: a serrated snow ridge crosses the horizon, a turquoise glacial lake and small distant Tibetan village sit at the right, and yak graze across the near meadow. A sweeping foreground bank of pink and white Gesang flowers rises along the lower edge with scattered stones and small colorful cloth streamers tracing the ridge. On the right middle-distance meadow, exactly three school-age children hold hands in a small Guozhuang dance circle. Each full-body figure is about one quarter of image height and never over one third; heads, hands and shoes stay fully inside the frame with margin. Two children are back views; one is a side profile with a clear small dark eye and eyebrow. The snowy plateau, lake, flowers and yak remain much larger than the children. A soft paper music ribbon curves along the lake. Fill the left title third with layered snow clouds, mountain slopes and flower petals; no blank sky.
Must include: serrated Tibetan snow ridge; turquoise glacial lake; distant Tibetan village; yak; Gesang flower bank; exactly three full-body children in a small Guozhuang dance circle, with two back views and one visible-eyed profile.
Mood: spacious and resonant.

Recompose the dance group farther into the meadow. Each child must be reduced to about 23 percent of image height, no more than one third, with full head, hands and shoes inside the image and margin. Keep one back-view and one visible-eyed side-profile figure; retain all three. Snow ridge, lake, yaks and Gesang flowers must remain much larger than the dancers.
```

## pep-g3s2-u5.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画；教材依据：《月亮叔叔住得远》p.44、《音响南亚》p.46、《学跳印度舞》p.49、《一千零一夜》p.50。
- 画面核对：丝路商队、弯月与灯盏、南亚拱廊与镂空窗、万寿菊、莲花水池和印度舞手势共同呈现南亚与故事性音乐。 人物比例：两名孩子各约 20% 画高；一背影、一侧影，完整入框。
- 原尺寸裁脸检查：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g3s2-u5-profile-native.png`，侧脸眼睛和眉毛清楚，手势可辨。 成品 1600×640，179,362 B，WebP quality 54；旧图为 1600×640 / 146,616 B。
- 模版自检：层叠手剪纸面、纸纤维与柔和投影通过；未见文字、水印、logo 或伪文字；最终图未画具体乐器，无结构误画；弃用稿中的弦乐器已去除；标题区平涂空白估算 约 5%，有花枝/山云/建筑/地貌柔和填充；教材地域与代表作品线索可辨；390px 手机预览下主体仍清楚。
- 重画与裁切记录：首稿有人物约 44% 且多出成人与大型弦乐器；修订稿删去成人和乐器，将两名学舞孩子缩至约 20% 后采用。
- 完整提示词（固定风格段 + 单元规格段 + 场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: A winding Silk Road path enters a patterned South Asian courtyard through a broad carved arch. At the left distance a small caravan crosses ochre desert hills under a crescent moon; the courtyard at right has layered jali screens, marigold strings, a lotus basin, jewel-toned textiles and a patterned floor. Exactly two school-age children learn Indian dance hand gestures in the middle distance: one fully back-facing, the other in side profile with a clear small eye and eyebrow. Keep each complete full-body figure about one fifth of the image height and never over one third, with head, hands and shoes inside the frame. Their simple regional costume accents are small. The courtyard, arch, desert route, lanterns and moonlit storybook scene dominate. No adults and no instruments. A gentle paper music ribbon passes through the arch. Fill the left title area with carved arch details, cloud layers and desert silhouettes, not blank sky.
Must include: two small full-body children learning Indian dance gestures; South Asian courtyard with jali screen; distant Silk Road caravan; crescent moon and lanterns; lotus basin.
Mood: warm and adventurous.

Recompose the courtyard to remove the adult and large string instrument entirely. Keep exactly two children, much smaller and farther into the courtyard; each complete person should be about one fifth of image height, strictly below one third. Both are full-body with margin. One is back view; one is side profile with a clear eye. Preserve the moonlit arch, jali lattice, desert caravan and lotus basin.
```

## pep-g3s2-u6.webp

- 册别/单元：三年级下册第6单元《彼得与狼》
- 教材依据：目录 p.6；小小音乐剧《彼得与狼》p.52–53（彼得、小鸟、鸭子、猫、狼及树林草地场景）。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：0 次；一次生成后采用；为满足 WebP ≤180 KiB，使用半径 0.4px 轻微模糊压缩。
- 第 5 节自检：1通过；2通过；3通过；4通过（观察者和彼得为背影/侧影）；5通过（无实体乐器）；6通过；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: a cut-paper retelling of Peter and the Wolf on the right: Peter in a red scarf steps from an open meadow toward a small wood where a bird perches above a duck, a cat watches, and one wolf stands at the tree line; two schoolchildren in back view quietly observe from the far right, leaving the left third open meadow and pale sky, with no other people or animals.
Must include: Peter; one bird, one duck, one cat and one wolf at the meadow and wood; two watching children; open grassland.
Mood: playful suspense.
```

## pep-g4s1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画；教材依据：四年级上册目录 p.5–6；《致同学》p.4（“美丽动听中国行”与“环球音乐之旅”）；第一单元《凤阳花鼓黄梅调》中的安徽民歌意象。
- 画面核对：剪纸屋瓦、田垄、麦捆、铺地与音带结构清楚；凤阳鼓为单面圆皮木框鼓，浅圆锣为独立薄盘并以小槌敲击，结构和持法可辨；安徽屋顶与凤阳鼓锚点明确。 人物测量：两名孩子约 29% 画高，均低于三分之一；一背影、一侧影，完整入框。
- 原尺寸裁脸检查：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g4s1-profile-native.png`：侧脸眼睛、眉毛清楚；另一人背影。 成品 1200×750，223,054 B，WebP quality 80；旧图为 1200×750 / 142,716 B。
- 模版第 5 节自检：剪纸纸层和配色通过；无文字、数字、伪文字、印章、水印或 logo；无教材卡通人物；人物比例与完整入框通过；剪纸屋瓦、田垄、麦捆、铺地与音带结构清楚；凤阳鼓为单面圆皮木框鼓，浅圆锣为独立薄盘并以小槌敲击，结构和持法可辨；安徽屋顶与凤阳鼓锚点明确。 标题区平涂空白估算 约 8%，低于该区一半。
- 重画次数与原因：首稿出现两名超大表演者及近景观众，弃用；第二稿去除观众并缩至约 29%，采用。
- 完整提示词（固定风格段 + 规格段 + 场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; the lower-left third (where a title and a dark gradient will be laid on the website) stays softer and lower in contrast but still filled with scenery such as grass, flowers, paths, distant trees or floor patterns, never an empty flat area. Rich detail, professional picture-book quality.
Scene: On an Anhui village threshing ground, two small school-age children perform Fengyang folk music at the right of the upper two-thirds. One child, seen fully from behind, strikes a single round hand-held Fengyang drum with a short beater; the other child, in side profile with one clear dark eye and eyebrow, answers on a shallow hand gong with a small mallet. Keep each complete figure about one quarter of the cover height, never over one third, full-body and completely inside the frame with margin. The round drum has one taut circular skin and a wooden rim; the gong is a thin shallow bronze disc, clearly different from the drum. Layered Anhui field ridges and tiled village roofs fill the background; a winding threshing path, straw bundles and low grasses softly fill the lower-left title area without leaving it blank. A gentle cut-paper sound ribbon follows the field path.
Must include: one round Fengyang drum with short beater; one shallow hand gong with mallet; two full-body back/profile children; Anhui village roofs and field ridges.
Mood: lively folk music.

Recompose to keep only the two performers described in the scene. Remove all audience figures and any other people. Move the two children into the middle distance and reduce each complete full-body figure to about one quarter of cover height, strictly below one third; keep heads, arms, instruments and shoes fully inside the frame with clear margin. The faces remain back/profile views and the profile eye stays visible. Preserve the two correctly shaped instruments, village roofs, Anhui fields, threshing path and straw bundles.
```

## pep-g4s1-u1.webp

- 册别/单元：四年级上册第1单元《凤阳花鼓黄梅调》
- 教材依据：目录 p.5；《凤阳花鼓》p.9（歌词“左手锣，右手鼓”）；《徽班进京与徽州文化》p.8。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：1 次；首稿孩子服饰不符合日常服装要求，重画为普通校服；终稿中远景徽州建筑对应 p.8。
- 第 5 节自检：1通过；2通过；3通过；4通过；5通过（手鼓单面鼓膜、短槌；圆锣与槌）；6通过；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: on the right, two children in plain everyday school clothes (simple white shirts and blue trousers or skirt, no folk costumes or embroidery) perform the lively Fengyang Flower Drum song; one carries a small round hand drum with one membrane and a short beater, the other holds a shallow round hand gong with a mallet; keep the left third quiet open Anhui meadow, with no other people or instruments.
Must include: two children in plain everyday clothes; one small handheld drum; one shallow round gong and mallet; an open Anhui meadow.
Mood: lively and festive.
```

## pep-g4s1-u2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画；教材依据：原书 p.12（PDF p.19）：巴黎街边咖啡馆、条纹遮阳篷、石板街、奥斯曼式楼房、四位作曲家围桌；p.17（PDF p.24）：风筝。
- 画面核对：纸层塞纳河、石板街、奥斯曼立面和条纹遮阳篷通过；无文字/伪文字/水印；未画教学乐器；左侧天空、河面、远屋顶和树影柔和填充；人物无近景。 人物测量：四名坐姿作曲家约 18–20% 画高且均为背影；放风筝孩子约 21% 画高、侧影，完整入框。
- 原尺寸裁脸检查：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g4s1-u2-profile-native.png`：孩子侧脸眼睛可见；四位作曲家均为背影。 成品 1600×640，177,996 B，WebP quality 58；旧图为 1600×640 / 143,090 B。
- 模版第 5 节自检：剪纸纸层和配色通过；无文字、数字、伪文字、印章、水印或 logo；无教材卡通人物；人物比例与完整入框通过；纸层塞纳河、石板街、奥斯曼立面和条纹遮阳篷通过；无文字/伪文字/水印；未画教学乐器；左侧天空、河面、远屋顶和树影柔和填充；人物无近景。 标题区平涂空白估算 约 10%，低于该区一半。
- 重画次数与原因：首稿一次采用；构图采用城市街角斜俯视，与本册水岸单元区别。
- 完整提示词（固定风格段 + 规格段 + 场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: A Paris sidewalk café opens onto the Seine, seen from an oblique elevated street corner. On the right, a striped café awning shades one round table where exactly four small composer figures sit together, all seen from behind so no faces are visible; their entire seated silhouettes stay within the frame, each under one quarter of image height. Behind them rise layered Haussmann-style street fronts with tall windows and carved balconies. Stone paving leads diagonally to the riverbank, and a single child’s kite crosses high above the water on a curving paper ribbon. The café, river, façades and kite remain the main subjects; the people stay small and secondary. Fill the left title third softly with low rooftops, rippled river, cloudy sky and plane trees, not blank. Do not include the Eiffel Tower or any writing.
Must include: striped Paris café awning; stone-paved street; Seine river edge; four tiny back-view composers around one table; a child’s kite; Haussmann-style façades.
Mood: urbane and light.
```

## pep-g4s1-u3.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：建议重画；教材依据：《魅力江南》p.24、《西湖美》p.28、《茉莉香飘海内外》p.30；并保留目录 p.5。
- 画面核对：层叠湖水、垂柳倒影与茉莉花纸层通过；无文字/伪文字/水印；无具体乐器；标题区由低垂柳叶、远山与水纹填充；不添亭台、桥或其他无教材依据地标。 人物测量：两名孩子各约 21% 画高；一背影、一侧影，完整入框。
- 原尺寸裁脸检查：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g4s1-u3-profile-native.png`：侧影眼睛与眉毛清楚；另一人背影。 成品 1600×640，179,942 B，WebP quality 58；旧图为 1600×640 / 154,654 B。
- 模版第 5 节自检：剪纸纸层和配色通过；无文字、数字、伪文字、印章、水印或 logo；无教材卡通人物；人物比例与完整入框通过；层叠湖水、垂柳倒影与茉莉花纸层通过；无文字/伪文字/水印；无具体乐器；标题区由低垂柳叶、远山与水纹填充；不添亭台、桥或其他无教材依据地标。 标题区平涂空白估算 约 7%，低于该区一半。
- 重画次数与原因：首稿人物约 45% 超限；中景修订后约 21%，侧脸眼睛保留，采用。
- 完整提示词（固定风格段 + 规格段 + 场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: A high, oblique view over West Lake, where a broad jade-blue crescent of water fills the right two-thirds and curves around a quiet willow bank. Long willow fronds sweep over the lake and form clear layered reflections; clusters of white jasmine blossoms and fresh leaves frame the lower-right shore. Exactly two small school-age children follow a curving waterside path in the right middle distance, full-body and fully inside the frame, each about one quarter of image height and never over one third. One child is seen from behind; the other is in side profile with one clear small eye and eyebrow. Keep the children secondary to the lake, willow reflections and jasmine. No pavilion, bridge, landmark building or boat. Fill the left title third softly with low willow fronds, distant lake ripples, layered hills and jasmine cut-outs; no blank flat sky or paper.
Must include: West Lake water; willow bank and reflections; jasmine blossoms; two full-body children walking a curved lakeside path.
Mood: serene and flowing.

Recompose the two children farther along the path into middle distance. Reduce each full-body figure to about one quarter of image height, strictly less than one third, keeping both heads and shoes inside the frame with clear margin. Preserve one back view and one side profile with a visible eye. The lake, willow reflections and jasmine must dominate.
```

## pep-g4s1-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：建议重画；教材依据：《卡普里岛》p.36、《亚得里亚海之旅》p.38、《意大利歌剧之旅》p.40、《意大利名琴音乐会》p.41、《梦幻西班牙》p.42、《桑塔·露琪亚》p.44。
- 画面核对：纸层卡普里海蚀岩、蓝色海面和海岸草通过；小提琴四弦、琴身、琴弓及夹琴持法可辨；大提琴琴身、琴颈、弓、坐姿及落地支撑可辨；无文字/水印；左标题区有岩层、海水、云和草。结构裁片 `E:\Projects\.tmp\pep-redraw\work\faces\pep-g4s1-instrument-structure-check.jpg`。 人物测量：两名孩子背影约 20%；两名成人乐手约 16–18%；均完整入框且低于三分之一。
- 原尺寸裁脸检查：原像素裁片 `E:\Projects\.tmp\pep-redraw\work\faces\pep-g4s1-u4-violinist-native.png` 与 `...\pep-g4s1-u4-cellist-native.png`：可见的两张侧脸均有眼睛、眉毛；两个孩子为背影。 成品 1600×640，178,324 B，WebP quality 48；旧图为 1600×640 / 182,344 B。
- 模版第 5 节自检：剪纸纸层和配色通过；无文字、数字、伪文字、印章、水印或 logo；无教材卡通人物；人物比例与完整入框通过；纸层卡普里海蚀岩、蓝色海面和海岸草通过；小提琴四弦、琴身、琴弓及夹琴持法可辨；大提琴琴身、琴颈、弓、坐姿及落地支撑可辨；无文字/水印；左标题区有岩层、海水、云和草。结构裁片 `E:\Projects\.tmp\pep-redraw\work\faces\pep-g4s1-instrument-structure-check.jpg`。 标题区平涂空白估算 约 8%，低于该区一半。
- 重画次数与原因：首稿观演孩子约 35% 超限；二稿移远至约 20%，保留小提琴与大提琴，采用。
- 完整提示词（固定风格段 + 规格段 + 场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: A high, oblique view across a rocky Capri shoreline opening toward the bright Adriatic Sea. Layered limestone cliffs and wind-bent grasses sweep from the lower left into blue water; a small natural rock terrace at the right forms an open-air music platform with exactly two adult instrumentalists, both small and distant: one plays a four-string violin held under the chin with a bow across the strings, and one plays a four-string cello held upright between the knees with its endpin on the ground. Their instruments must have clear real-world shapes and playing positions. Two primary-school children watch from the far-right path, both full-body back views, each about one fifth of image height and never over one third. Keep the musicians even smaller and all people well inside frame, no close faces. The sea, cliffs, rocks and grass dominate. A few soft paper music ribbons arc over the Adriatic. Fill the left title third with layered coastal rock, ripples, clouds and grasses, no blank flat sky. Do not add landmark buildings.
Must include: rocky Capri coast; Adriatic water; small natural outdoor music terrace; one correctly shaped violin and one correctly shaped cello being played; two small back-view child listeners.
Mood: sunlit and expansive.

Keep the two adult instrumentalists and their accurate violin and cello unchanged and at small distant scale. Move the two children farther back on the rocky path and reduce each full-body figure to about one quarter of image height, never over one third. Keep their backs to the viewer and all heads and shoes fully inside the frame. Preserve the Capri coast, Adriatic, flowers, grass and open rock music terrace.
```

## pep-g4s1-u5.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画；教材依据：《红》p.46、《追寻》p.48、《学习雷锋好榜样》p.49、《英雄儿女》p.50、《我有一个梦》p.52、《红色的旋律》p.54、《游击队歌》p.54、《鸽子》p.56。
- 画面核对：白鸽、红色地平线、山脊与小径构成明确主题；纸层云、草、花和地貌填满低对比标题区；无文字/水印/伪文字；无具体乐器；两名孩子均背影且完整。 人物测量：两名孩子约 32% 画高，均低于三分之一；全身背影，头脚完整入框。
- 原尺寸裁脸检查：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g4s1-u5-backviews-native.png`：两处头肩均为背影，未露侧脸。 成品 1600×640，175,866 B，WebP quality 74；旧图为 1600×640 / 126,962 B。
- 模版第 5 节自检：剪纸纸层和配色通过；无文字、数字、伪文字、印章、水印或 logo；无教材卡通人物；人物比例与完整入框通过；白鸽、红色地平线、山脊与小径构成明确主题；纸层云、草、花和地貌填满低对比标题区；无文字/水印/伪文字；无具体乐器；两名孩子均背影且完整。 标题区平涂空白估算 约 6%，低于该区一半。
- 重画次数与原因：单次采用；通过对照发现新图已明显减少原图大块空天空洞。
- 完整提示词（固定风格段 + 规格段 + 场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: A broad paper-cut mountain landscape at dawn, with a strong vermilion horizon stretching across the right two-thirds above layered green and ochre hills. One white dove crosses the red band, its wings fully open and its path traced by a narrow flowing paper ribbon. A winding ridge path leads up from the foreground toward the horizon; exactly two small school-age children walk along it, both full-body back views, each about one quarter of image height and never over one third, with heads and shoes completely inside the frame and clear margin. Keep the children small and secondary to the dove, red horizon and layered ridge. Add textured grasses, wildflowers and cut-paper clouds across the foreground and sky. The lower-left title third stays soft and lower contrast but filled with grasses, path and distant hill layers, never blank.
Must include: one white dove with open wings; a vermilion paper horizon; winding mountain path; two full-body back-view children; layered textured hills and grasses.
Mood: hopeful and open.
```

## pep-g4s1-u6.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定：必须重画；教材依据：小小音乐剧《闪闪的红星》p.58–59；父子、红星、桂花与故事场景。
- 画面核对：纸层门庭、桂花枝、石墙、篮筐和庭院路面把原先标题侧空白补足；红星为无字小星形；无水印/伪文字；未绘教学乐器；父亲侧影与孩子背影符合要求。 人物测量：父亲约 32%、孩子约 30% 画高；均低于三分之一且完整入框。
- 原尺寸裁脸检查：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g4s1-u6-father-profile-native.png`：父亲侧脸眼睛、眉毛清楚；男孩背影。 成品 1600×640，177,526 B，WebP quality 60；旧图为 1600×640 / 99,424 B。
- 模版第 5 节自检：剪纸纸层和配色通过；无文字、数字、伪文字、印章、水印或 logo；无教材卡通人物；人物比例与完整入框通过；纸层门庭、桂花枝、石墙、篮筐和庭院路面把原先标题侧空白补足；红星为无字小星形；无水印/伪文字；未绘教学乐器；父亲侧影与孩子背影符合要求。 标题区平涂空白估算 约 5%，低于该区一半。
- 重画次数与原因：首稿父亲约 35% 超限；第一次缩至约 16% 后在手机宽度偏小；微调后约 30–32%，低于三分之一，采用。
- 完整提示词（固定风格段 + 规格段 + 场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: From a high, distant viewpoint across an Anhui courtyard, show the full doorway and garden in layered paper. At the right, a father gently pins one small red star to his school-age son's plain jacket beside an open wooden door; show both full-body and small, each about one fifth of the picture height and never over one third. The father is in a side/back view with one clear eye and eyebrow if his profile is visible; the boy is fully back-facing. Keep both heads, hands and shoes inside the frame with ample margin. An osmanthus branch with small golden blossoms reaches over the doorway; carved door panels, a low stone wall, courtyard paving, two bamboo baskets and a flowering shrub fill the setting. The people are part of the wider courtyard, never portrait figures. Fill the left title third with low-contrast paving, layered osmanthus leaves, stone wall and garden shadows, not empty paper or a blank wall. No other people and no writing.
Must include: father and son by an open doorway; one small red star pin; osmanthus branch; tiled courtyard and garden details; two full-body small figures in back/profile views.
Mood: tender and resolute.

Keep the same courtyard and father-pin-star action. Enlarge both figures slightly from their present small scale so the complete boy and father each occupy about 22 percent of the full image height, strictly less than one third. They remain full-body, with clear space around their heads and shoes. The father stays kneeling and in visible-eyed profile; the boy stays fully back-facing. The doorway, osmanthus, wall and paving remain much larger than the people.
```

## pep-g5s1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定与教材依据：必须重画；原封面只有泛化江河海湾，缺少岭南、福建土楼、港澳台及非洲/爵士行旅线索。依据：五上目录 p.5–6、《致同学》p.4、岭南 p.2–10、福建土楼和茶 p.22–32、港澳 p.34–40、台湾 p.42–50。
- 人物、画面和原尺寸局部复核：四个地区停靠点均可辨：岭南音乐组、土楼茶垄、港澳海港桥塔客船、阿里山与日月潭及枝头小鸟。三名人物约 23% 画高，均完整入框；两张侧脸原尺寸裁片均有眼睛，第三人背影。左下路径、草叶、花和远树填满标题区。可见琵琶状弹拨乐器有梨形琴身、长颈品位与弦轴，竖抱演奏结构可辨。标题区平涂空白约 4%。 原尺寸裁片：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g5s1-cover-profile1-native.png、pep-g5s1-cover-profile2-native.png、pep-g5s1-cover-instrument-detail.png`。
- 模版第 5 节自检：①剪纸纸层贯穿天空、山、水、建筑和人物；②配色与固定纸艺调色板一致；③无文字、数字、伪文字、印章、水印或 logo；④无教材卡通人物，人物小且完整入框，背影/侧影符合要求，侧脸眼睛已按原尺寸裁片确认；⑤琵琶状弹拨乐器的琴身、长颈品位、弦和持法可辨，无明显结构错误；⑥标题区柔和但有山水/植被/路径/纹样铺底，4% 的平涂空白，低于该区一半；⑦主体元素与上列教材依据相符。
- 重画次数与原因：首次生成采用。
- 成品 `E:\Projects\.tmp\pep-redraw\art\pep-g5s1.webp`：1200×750，221,824 B，WebP quality 74；旧图 `E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\pep-g5s1.webp`：1200×750，176,952 B。生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\pep-g5s1.png`。
- 完整提示词（固定风格段 + 本图规格段 + 最终场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; the lower-left third (where a title and a dark gradient will be laid on the website) stays softer and lower in contrast but still filled with scenery such as grass, flowers, paths, distant trees or floor patterns, never an empty flat area. Rich detail, professional picture-book quality.
Scene: Build one continuous folded-paper journey across four grounded stops in the upper two-thirds, linked by a winding cut-paper route with no panel borders or labels. At the far left, a lush Guangdong waterside courtyard hosts exactly three small school-age children singing and clapping together in a local music group, all in back or side views and each about one fifth of cover height. At center-left, a round Fujian tulou rises among stepped tea rows. At center-right, the Hong Kong–Macao harbour shows a layered Hong Kong skyline, Macau waterfront tower and bridge, and one ordinary passenger ferry. At the far right, Alishan ridges fold above Sun Moon Lake with a small bird on a branch. Keep each stop distinct but connected by the same land-and-water ribbon. The lower-left title third stays softer and lower-contrast but filled with grasses, waterside path, tea leaves and distant tree layers. No text, place labels, landmarks beyond those named, or extra people.
Must include: Guangdong music group; Fujian tulou and tea rows; Hong Kong harbour skyline; Macau waterfront tower and bridge with an ordinary passenger ferry; Alishan ridge and Sun Moon Lake; one continuous folded-paper travel route.
Mood: curious travel.
```

## pep-g5s1-u1.webp

- 册别/单元：五年级上册第1单元《岭南之声》
- 教材依据：目录 p.5；《月光光》p.7、《赛龙夺锦》p.8。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：0 次；一次生成后采用。
- 第 5 节自检：1通过；2通过；3通过；4通过；5通过（无实体乐器）；6通过；7通过。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: on the right, two children in simple everyday clothes watch one small dragon boat glide across a moonlit Lingnan river; the moon's reflection and a soft paper sound ribbon ripple over the water, while the left third remains quiet pale sky and river, with no visible paddlers, buildings, animals or instruments.
Must include: one moon; one dragon boat; two children in back view; a Lingnan river.
Mood: lyrical and festive.
```

## pep-g5s1-u2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定与教材依据：必须重画；左标题区低细节约 17.4%，超过 15% 阈值。依据：目录 p.5、《听见非洲》p.14、《巴加女孩》p.16、《五拍》p.20。
- 人物、画面和原尺寸局部复核：三名舞者约 25%、29%、27%，均为完整中远景；两名侧脸的眼睛和眉毛清楚，中央人物背影。一个宽阔图案地圈、五个独立节拍标记、棕榈和空置村屋命中主题。左侧有山水、叶片、音带与地纹，标题区平涂空白约 3%。无乐器，结构项不适用。 原尺寸裁片：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g5s1-u2-left-profile-native.png、pep-g5s1-u2-right-profile-native.png`。
- 模版第 5 节自检：①剪纸纸层贯穿天空、山、水、建筑和人物；②配色与固定纸艺调色板一致；③无文字、数字、伪文字、印章、水印或 logo；④无教材卡通人物，人物小且完整入框，背影/侧影符合要求，侧脸眼睛已按原尺寸裁片确认；⑤本图没有乐器，结构项不适用；⑥标题区柔和但有山水/植被/路径/纹样铺底，3% 的平涂空白，低于该区一半；⑦主体元素与上列教材依据相符。
- 重画次数与原因：共三稿：首稿中央舞者约 42% 画高超限；第二稿扩成多人队列并多出乐手；第三稿限为三人小组并将最大人物降到约 29%，采用。
- 成品 `E:\Projects\.tmp\pep-redraw\art\units\pep-g5s1-u2.webp`：1600×640，183,528 B，WebP quality 68；旧图 `E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g5s1-u2.webp`：1600×640，135,276 B。生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\units\pep-g5s1-u2.png`。
- 完整提示词（固定风格段 + 本图规格段 + 最终场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: A quiet, very high oblique view of one enormous patterned earth dance circle in a Baga village clearing. ONLY THREE human figures in the whole image: a single trio of school-age children placed together near the centre-right of the circle; no other people, no crowd, no background silhouettes, no musicians, no adults. Keep the trio at the same far distance from the viewer. Each full head-to-sole figure is small, about 140–155 pixels tall on the final 640-pixel-tall canvas (roughly one quarter of the image height), and fully inside the frame; no figure approaches the foreground. Two clap together while one steps lightly. All are seen from behind or in side profile; every visible profile has one clear small eye and eyebrow. Above the trio, place exactly five separate, countable colored paper beat marks, with no instruments. Let the giant circle, quiet empty huts, palms, river, patterned soil and layered paper landscape occupy nearly all the composition. Weave leaf-shaped cut-paper patterns into the ground. The left title third is soft but filled with lower-contrast earth, leaves, and a curved rhythm path. No other people or objects that look like people.
Must include: exactly three full-body children total; small equal-scale figures about 140–155 px tall on a 640 px canvas; five separate colored rhythm marks; one patterned earth circle; side or back views with a visible eye on every visible profile.
Mood: vital, communal, syncopated.
```

## pep-g5s1-u3.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 分类：漏画补画（必须）。
- 来源依据：SOURCES.md：五上 U3；《土楼音声》p.22、《采茶灯》p.28、《采茶》p.30。
- 画面与修订：闽南土楼、茶田和采茶动作构成福建地域画面；两名普通校服儿童在右侧茶垄间模仿采茶，一人背影、一人侧影。左标题区用远山、茶田行列、叶片和淡路填充。
- 逐图自检：两名完整儿童约占画高 22–26%；侧脸女孩有眼睛与眉毛，男孩为背影。左标题区为低对比茶田、远山与天空层，平涂空白近零。仅一座圆形土楼，无其他建筑、人物、动物、可读文字、水印或实体乐器。
- 文件与复核：1600×640，177,896 B；源 PNG 1983×793；quality 68；2 轮（缩小并后移首稿人物）。脸部/背影复核截图：work/faces/pep-g5s1-u3-girl-profile.png、pep-g5s1-u3-boy-back.png。

首轮完整提示词：

    Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
    Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
    People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
    Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
    Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
    Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
    Scene: on the right, two small children in plain everyday school clothes—simple white shirts and blue trousers or skirt, no folk costumes, hats or embroidery—imitate a gentle tea-picking gesture beside one round Fujian tulou, with only a few tea leaves in the foreground. Show each child full-body, about one quarter of the image height and never above one third, fully inside the frame; one is seen from behind and the other in side profile with one clear small eye and eyebrow. Fill the left title third with softly layered pale sky, distant hillside, quiet tea-field rows, small leaves and a faint path, all low-contrast but visibly detailed, not blank or flat. Do not add other buildings, people, animals or instruments.
    Must include: one round Fujian tulou; two children in plain everyday school clothes mimicking tea picking; a few fresh tea leaves; one back-view child and one profile with a clear eye.
    Mood: warm and graceful.

修订提示词 1：

    The two children in this illustration are far too large and close. Keep the tulou, tea rows, hills, stream and overall paper-cut landscape, but redraw both children as small distant full-body figures in the right two-thirds, each about 22–25% of the full image height in the final 1600x640 image (roughly 145–160 pixels), never above one third. Move them farther back among the tea plants; do not make portrait-sized people. Keep their complete head, torso, arms, legs and shoes inside the frame. One child is viewed from behind and the other in a clear side profile with one small visible eye and eyebrow. Keep their simple white shirts and blue trousers or skirt, no costume or embroidery. Preserve one round Fujian tulou and no other buildings, people, animals or instruments. The left title third remains gently filled with low-contrast hillside, tea-field rows, leaves and faint path, not blank. Preserve the panoramic crop and layered paper-cut style.

## pep-g5s1-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定与教材依据：必须重画；标题区最大连续低细节约 15.7%。依据：香港海港天际线 p.34（PDF p.41）、澳门海岸天际线/桥/塔 p.36（PDF p.43）；p.40（PDF p.47）指出《香蕉船》是儿童电视节目主题曲，并非实体香蕉船。
- 人物、画面和原尺寸局部复核：香港与澳门天际线分区、桥塔、普通客船及无字电视均可辨；没有香蕉形船。两名孩子坐姿全身均入框，人物约 25%、28%；两张侧脸裁片都有眼睛。左侧水岸、海浪、花木及天空纸层连续，标题区平涂空白约 4%。无乐器，结构项不适用。 原尺寸裁片：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g5s1-u4-left-profile-native.png、pep-g5s1-u4-right-profile-native.png`。
- 模版第 5 节自检：①剪纸纸层贯穿天空、山、水、建筑和人物；②配色与固定纸艺调色板一致；③无文字、数字、伪文字、印章、水印或 logo；④无教材卡通人物，人物小且完整入框，背影/侧影符合要求，侧脸眼睛已按原尺寸裁片确认；⑤本图没有乐器，结构项不适用；⑥标题区柔和但有山水/植被/路径/纹样铺底，4% 的平涂空白，低于该区一半；⑦主体元素与上列教材依据相符。
- 重画次数与原因：首稿采用，人数、城市和客船锚点正确。
- 成品 `E:\Projects\.tmp\pep-redraw\art\units\pep-g5s1-u4.webp`：1600×640，183,092 B，WebP quality 62；旧图 `E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g5s1-u4.webp`：1600×640，137,856 B。生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\units\pep-g5s1-u4.png`。
- 完整提示词（固定风格段 + 本图规格段 + 最终场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: Place one ordinary passenger ferry on layered water between two distinct distant waterfront views: the Hong Kong harbour skyline and the Macao waterfront skyline with its bridge and tower. On the far right shore, show exactly two small school-age children listening beside a blank, unlettered television. Keep both children full-body, fully inside the frame, around one quarter of the image height and never more than one third; show them from behind or in side view with one clear eye and eyebrow on any visible profile. Keep people in the right side of the scene, with the ferry and two shorelines as the main subjects. Water, shoreline and paper-cut skyline layers continue softly through the left title third, filled with detail and lower contrast, never blank. No banana-shaped boat, no words or screen text.
Must include: Hong Kong harbour skyline; Macao waterfront skyline; bridge and tower; ordinary passenger ferry; two children beside a blank television; small full-body back/profile figures with visible profile eyes.
Mood: urban and buoyant.
```

## pep-g5s1-u5.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定与教材依据：建议重画；T01 横向水岸/山脉全景同模版组成员。依据：目录 p.6、《宝岛上的歌声》p.42（阿里山、日月潭）、《月亮月光光》p.46、《一只鸟仔》p.47。
- 人物、画面和原尺寸局部复核：阿里山层峦、日月潭、月光水纹与枝头小鸟可辨；两名听者均为完整背影，无可见侧脸。人物约 29%、31%，最大值低于三分之一。左侧湖水、山影、莲叶与月光纹理填满标题区，平涂空白约 4%。无乐器，结构项不适用。原始生成图 2172×724（3:1）；为符合 5:2，从左侧裁去多余画幅并保留右侧两人完整，再缩放到 1600×640；没有裁掉主体。 原尺寸裁片：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g5s1-u5-listeners-native.png`。
- 模版第 5 节自检：①剪纸纸层贯穿天空、山、水、建筑和人物；②配色与固定纸艺调色板一致；③无文字、数字、伪文字、印章、水印或 logo；④无教材卡通人物，人物小且完整入框，背影/侧影符合要求，侧脸眼睛已按原尺寸裁片确认；⑤本图没有乐器，结构项不适用；⑥标题区柔和但有山水/植被/路径/纹样铺底，标题区平涂空白约 4% 的平涂空白，低于该区一半；⑦主体元素与上列教材依据相符。
- 重画次数与原因：首次生成采用；原始横幅多余横向部分裁切后保持两人完整。
- 成品 `E:\Projects\.tmp\pep-redraw\art\units\pep-g5s1-u5.webp`：1600×640，176,152 B，WebP quality 74；旧图 `E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g5s1-u5.webp`：1600×640，136,666 B。生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\units\pep-g5s1-u5.png`。
- 完整提示词（固定风格段 + 本图规格段 + 最终场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: View Sun Moon Lake from high above as a broad layered oval, with Alishan ridges stepping behind it under gentle moonlight. A small bird rests on a branch at the upper-right edge, its cut-paper silhouette distinct against the water. Place exactly two school-age listeners together on the lower-right lakeshore, shown fully from head to sole and from behind at the same small distant scale, around one quarter of image height and never above one third. Keep both children clearly secondary to the lake and mountains. Moonlight makes soft patterned bands across the water behind them. Vary the composition with a diagonal shoreline and ridges rather than a straight horizontal horizon. The left title third stays soft and lower contrast but fully filled by layered lake, reeds, water plants and distant hills. No visible faces, no text, no extra people.
Must include: Alishan ridge; Sun Moon Lake; small bird on a lakeside branch; exactly two full-body back-view listeners on the lower-right shore; moonlight patterns across the water.
Mood: quiet and lyrical.
```

## pep-g5s1-u6.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定与教材依据：建议重画；T01 横向水岸/山脉全景同模版组成员。依据：原书 p.52–54（PDF p.59–61）呈现旧深圳渔村、海边活动与现代深圳楼群。
- 人物、画面和原尺寸局部复核：旧渔村、渔网、湾面、远处深圳楼群及拾贝活动均清楚；站立孩子约 28%，蹲姿孩子约 21%，均为完整背影入框，无可见侧脸。标题区以远山、水面和纸层音带填充，平涂空白约 3%。无乐器，结构项不适用。首稿站立儿童约 38% 画高，弃用；二稿缩至约 28% 后采用。 原尺寸裁片：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g5s1-u6-backviews-native.png`。
- 模版第 5 节自检：①剪纸纸层贯穿天空、山、水、建筑和人物；②配色与固定纸艺调色板一致；③无文字、数字、伪文字、印章、水印或 logo；④无教材卡通人物，人物小且完整入框，背影/侧影符合要求，侧脸眼睛已按原尺寸裁片确认；⑤本图没有乐器，结构项不适用；⑥标题区柔和但有山水/植被/路径/纹样铺底，标题区平涂空白约 4% 的平涂空白，低于该区一半；⑦主体元素与上列教材依据相符。
- 重画次数与原因：共两稿：首稿站立儿童约 38% 画高超限；二稿缩小并拉远人物后采用。
- 成品 `E:\Projects\.tmp\pep-redraw\art\units\pep-g5s1-u6.webp`：1600×640，180,324 B，WebP quality 68；旧图 `E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g5s1-u6.webp`：1600×640，154,324 B。生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\units\pep-g5s1-u6.png`。
- 完整提示词（固定风格段 + 本图规格段 + 最终场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: A wide, distant split-depth view of Shenzhen changing over time: old fishing huts and nets along the near right shore, modern Shenzhen skyline across the broad water. Keep the coastline, huts, boat shapes and skyline large; people are tiny elements in the landscape. Show ONLY TWO school-age children shell-gathering on the lower-right beach, one standing and one crouching, both full-body and fully in frame. Place them farther from the viewer at the same small scale; each silhouette from crown to sole should be about 145–160 pixels on a 640-pixel-tall final canvas (roughly one quarter of image height), never above one third. No foreground or close-up child. Both children are seen from behind with no visible faces. Small shells dot the lower shoreline. The old huts, woven fishing nets and distant skyline remain distinct. Continue soft layered water, distant hills and shoreline across the left title third, filled but lower in contrast. No other people, no text.
Must include: old Shenzhen fishing huts; exactly two small full-body shell-gathering children at the lower-right shore; modern Shenzhen skyline across water; layered water and nets; both children at equal distant scale, never larger than one third of image height.
Mood: changing and curious.
```

## pep-g6s1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定与教材依据：必须重画；原封面为泛化湖岸与背影，太湖和家乡线索缺失。依据：人教版《音乐（简谱）六年级上册》目录 pp.5–6、编写说明 p.4；“寻声家乡”p.2、“太湖美”p.8、“故乡的小路”p.11。
- 人物与画面核对：太湖水面、苇荡、低岛、石径、两艘小渔帆均清楚。两名完整背影约 27% 画高，未超三分之一；原尺寸人物裁片确认无可见侧脸。左下有苇草、花、石径和远树，标题区平涂空白约 4%。无乐器。 原尺寸局部：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g6s1-cover-backviews-native.png`。
- 模版第 5 节自检：①天空、湖水、苇荡和山岛均为剪纸层；②配色在固定调色板内；③无文字、数字、伪文字、印章、水印或 logo；④无教材卡通人物，人物背影完整入框，原尺寸裁片确认无可见侧脸；⑤本图无乐器，结构项不适用；⑥标题区柔和但有景物，平涂空白约 4%，低于标题区一半；⑦太湖、湖岛、渔帆和家乡路径对应教材。
- 重画次数与原因：首次生成采用。
- 成品 `E:\Projects\.tmp\pep-redraw\art\pep-g6s1.webp`：1200×750，224,934 B，WebP quality 78；旧图 `E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\pep-g6s1.webp`：1200×750，166,554 B。生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\pep-g6s1.png`。
- 完整提示词（固定风格段 + 本图规格段 + 最终场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; the lower-left third (where a title and a dark gradient will be laid on the website) stays softer and lower in contrast but still filled with scenery such as grass, flowers, paths, distant trees or floor patterns, never an empty flat area. Rich detail, professional picture-book quality.
Scene: At dawn on Lake Taihu, layer pale reeds and low lake islands beside a curving stone footpath that leads toward two tiny fishing sails. Exactly two school-age children walk away along the path, both complete full-body back views and fully inside the frame; each person is about one quarter of the cover height and never more than one third. Keep them at the same middle distance, small within the broad lake landscape. Show the full lake surface, reed beds, low islands, shoreline path and small fishing boats. The lower-left title area stays soft and low contrast but filled with grasses, tiny wildflowers, path stones and distant trees, never blank. No visible faces, no extra people, no text or labels.
Must include: Taihu lake water; reed beds; low islands; stone shore path; two distant back-view children; small fishing boats.
Mood: quiet belonging.
```

## pep-g6s1-u1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定与教材依据：必须重画；原图将“寻声家乡”/《太湖美》画成没有地域标识的泛化湖岸。依据：第一单元目录 p.5、“寻声家乡”p.2、“太湖美”p.8、“故乡的小路”p.11。
- 人物与画面核对：太湖低岛、芦苇、水纹、弯曲石径、茶碗与矮凳齐全；两名背影约 28%、28%，完整入框。原尺寸人物裁片确认均为背影、无可见侧脸。标题区由水、岛、芦苇和路径填充，平涂空白约 3%。无乐器。 原尺寸局部：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g6s1-u1-backviews-native.png`。
- 模版第 5 节自检：①纸层覆盖天空、水、山、建筑和人物；②配色符合固定调色板；③无文字、数字、伪文字、印章、水印或 logo；④无教材卡通人物，人物完整入框且比例不超三分之一，背影/侧影符合要求，侧脸眼睛已按原尺寸裁片核对；⑤本图无乐器，结构项不适用；⑥标题区柔和且有水岸/地纹/舞台景物，平涂空白约 3%，低于标题区一半；⑦画面要素与上列教材依据相符。
- 重画次数与原因：共四稿：首稿人物约 40% 超限；第二稿缩至约 17% 但出现贯穿背景的竖缝；第三稿人物再次超限；以第二稿为底图编辑，补去接缝并将人物调至约 28%，采用。
- 成品 `E:\Projects\.tmp\pep-redraw\art\units\pep-g6s1-u1.webp`：1600×640，182,180 B，WebP quality 54；旧图 `E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g6s1-u1.webp`：1600×640，183,944 B。生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\pep-g6s1-u1.png`。
- 完整提示词（固定风格段 + 本图规格段 + 最终场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: One continuous, seamless wide view over Lake Taihu, with no panels, no vertical seam, and no split image. Low lake islands, layered reed beds and a winding stone hometown path stretch across the banner; one broad tea bowl sits on a low carved stool in the lower-right. Exactly two school-age children walk together on the midground right-hand path. They are full-body and seen from behind, at equal scale, completely inside the frame; each figure should be about 140–160 pixels tall on the final 640-pixel canvas (around one quarter of image height), never above one third. Keep them visible but secondary to the landscape, not tiny distant specks and not close-up foreground portraits. Show Taihu water folds, reeds, low islands and small path-side paper details across the whole image, with no named building. Fill the entire left title third with low-contrast layered water, reeds and island edges; do not leave a flat empty patch.
Must include: Taihu lake; shore path; reed beds; low islands; one broad tea bowl on a low stool; exactly two complete back-view children; one seamless continuous landscape.
Mood: local and reflective.

Edit the supplied image: preserve the same paper-cut Taihu lake, islands, reeds, path, tea bowl, palette and overall layout. Remove the visible vertical seam in the left portion by making the water, hills and sky continuous. Enlarge only the two children on the right path slightly so each full figure is about 22–25% of the final image height, while remaining below one third and completely inside the frame. Keep both backs turned, add no other people, and do not change the tea bowl or scene objects.
```

## pep-g6s1-u2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定与教材依据：必须重画；低细节约 36%，超过 25% 阈值。依据：第二单元目录 p.5、“肢体的表达/舞蹈的诉说”p.14、“大红枣儿甜又香”（选自舞剧《白毛女》）p.22。
- 人物与画面核对：两名完整舞者约 25%、27%，均为侧面，原尺寸裁片上的眼睛和眉毛清楚。枣树枝、红枣、红土院落、舞袖与脚印可辨。标题区有山水、地纹和叶片，平涂空白约 4%。无乐器。 原尺寸局部：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g6s1-u2-dancer-left-native.png`；`E:\Projects\.tmp\pep-redraw\work\faces\pep-g6s1-u2-dancer-right-native.png`。
- 模版第 5 节自检：①纸层覆盖天空、水、山、建筑和人物；②配色符合固定调色板；③无文字、数字、伪文字、印章、水印或 logo；④无教材卡通人物，人物完整入框且比例不超三分之一，背影/侧影符合要求，侧脸眼睛已按原尺寸裁片核对；⑤本图无乐器，结构项不适用；⑥标题区柔和且有水岸/地纹/舞台景物，平涂空白约 4%，低于标题区一半；⑦画面要素与上列教材依据相符。
- 重画次数与原因：共两稿：首稿舞者约 47% 超限；编辑稿缩至约 25–27%，保留侧脸眼睛和枣树地纹，采用。
- 成品 `E:\Projects\.tmp\pep-redraw\art\units\pep-g6s1-u2.webp`：1600×640，180,932 B，WebP quality 62；旧图 `E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g6s1-u2.webp`：1600×640，124,820 B。生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\pep-g6s1-u2.png`。
- 完整提示词（固定风格段 + 本图规格段 + 最终场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: A wide, oblique view across a red-earth courtyard under one broad fruiting jujube tree. Let the layered branch canopy, ripe red dates, textured courtyard ground and footprints dominate the banner. Exactly two school-age dancers move lightly beneath the tree at middle distance on the right, both complete full-body figures and fully inside the frame, each about one quarter of image height and never over one third. Show them in clear side profiles with one visible small eye and eyebrow on each; use a turning arm and a flowing sleeve gesture, not large foreground poses. Footprints trace their dance path across the earth. Keep the left title third softly filled with low-contrast earth texture, scattered leaves, small grasses and more ground pattern, not flat or empty. No extra dancers, no text.
Must include: two full-body side-view dancers with clear eyes; fruiting jujube branches; ripe red dates; footprints across a red-earth courtyard.
Mood: rhythmic and earthy.

Edit the supplied image: preserve its existing jujube tree, red fruit, courtyard, footprints, paper palette and diagonal branch composition. Reduce only both dancers to about half their current height, around 150–165 pixels on the final 640-pixel canvas (roughly one quarter); move them a little deeper into the courtyard while keeping both complete and within frame. Keep their side profiles and clear eyes, and add no people. The tree, fruit and textured ground should remain the dominant elements.
```

## pep-g6s1-u3.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定与教材依据：必须重画；标题区最大连续低细节约 18.8%。依据：第三单元《歌剧与音乐剧》，“戏剧中的歌声/歌唱与咏叹”p.26、“雪绒花”p.30、“歌剧院探秘/走进歌剧院”p.32、“魅力舞台”p.36。
- 人物与画面核对：两名学生表演者约 25%、26%，均完整入框且为侧面，原尺寸裁片确认两张脸都有清楚眼睛。帷幕、台板、空座位和右侧演出组符合单元。左标题区有山水纸层、幕布、台板和座席，平涂空白约 5%。最终图无乐器，结构项不适用。 原尺寸局部：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g6s1-u3-singer-profile-native.png`；`E:\Projects\.tmp\pep-redraw\work\faces\pep-g6s1-u3-actor-profile-native.png`。
- 模版第 5 节自检：①纸层覆盖天空、水、山、建筑和人物；②配色符合固定调色板；③无文字、数字、伪文字、印章、水印或 logo；④无教材卡通人物，人物完整入框且比例不超三分之一，背影/侧影符合要求，侧脸眼睛已按原尺寸裁片核对；⑤本图无乐器，结构项不适用；⑥标题区柔和且有水岸/地纹/舞台景物，平涂空白约 5%，低于标题区一半；⑦画面要素与上列教材依据相符。
- 重画次数与原因：共两稿：首稿演员过大且出现未要求的二胡；编辑稿缩小人物、改为学生服装动作并移除乐器，采用。
- 成品 `E:\Projects\.tmp\pep-redraw\art\units\pep-g6s1-u3.webp`：1600×640，127,992 B，WebP quality 78；旧图 `E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g6s1-u3.webp`：1600×640，118,632 B。生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\pep-g6s1-u3.png`。
- 完整提示词（固定风格段 + 本图规格段 + 最终场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: Build a small, welcoming opera-and-musical school stage in the right two-thirds. On the low stage, exactly two school-age performers appear at middle distance: one sings in side profile, and the second makes a simple acting gesture in profile beside a plain folded curtain. They wear simple school performance clothes, not ornate opera costumes. Each complete figure is about one quarter of image height and never more than one third, with heads, hands and shoes fully inside the frame. Give every visible profile one clear small eye and eyebrow. Keep both performers small within the theater, not close-up portraits. Folded stage boards, a plain curtain and empty audience seats continue softly through the left title third, which stays filled but lower in contrast. Use a unified paper-cut stage space, not framed panels; no signs, script, text, extra people or instruments.
Must include: one small opera singer; one second student performer in profile; plain curtain; stage boards; empty audience seats; complete back/profile performers with visible profile eyes.
Mood: theatrical and inviting.

Edit the supplied image: keep its continuous theatre, curtain, stage boards and rows of seats. Reduce both figures to about half their current height and set each full figure to around 150–165 pixels on the final 640-pixel canvas (roughly one quarter), strictly below one third. Move them farther back on the same stage while keeping faces as side profiles with clear eyes and heads and feet fully in frame. Replace the boy's instrument with a simple acting gesture; remove all instruments and retain exactly two student performers. Change the ornate singer clothing to simple school-stage clothing. Do not add people or text.
```

## pep-g6s1-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- T141 判定与教材依据：必须重画；标题区最大连续低细节约 17.1%。依据：第四单元目录 p.6、“京昆之声/皂罗袍·原来姹紫嫣红开遍”（昆曲《牡丹亭》）p.42、“都有一颗红亮的心”（京剧《红灯记》）p.45。
- 人物与画面核对：昆曲水袖与京剧武生姿态分置于两座相连低台，帷幕、灯笼、台板、座席可辨。两位演员约 24%、28%；两个儿童观众均为完整坐姿背影，约 25–27%，头至鞋均在框内；两名演员侧脸原尺寸裁片都有眼睛。标题区含幕布、山水、座席，平涂空白约 5%。无乐器。 原尺寸局部：`E:\Projects\.tmp\pep-redraw\work\faces\pep-g6s1-u4-kunqu-profile-native.png`；`E:\Projects\.tmp\pep-redraw\work\faces\pep-g6s1-u4-opera-profile-native.png`；`E:\Projects\.tmp\pep-redraw\work\faces\pep-g6s1-u4-audience-backviews-native.png`。
- 模版第 5 节自检：①纸层覆盖天空、水、山、建筑和人物；②配色符合固定调色板；③无文字、数字、伪文字、印章、水印或 logo；④无教材卡通人物，人物完整入框且比例不超三分之一，背影/侧影符合要求，侧脸眼睛已按原尺寸裁片核对；⑤本图无乐器，结构项不适用；⑥标题区柔和且有水岸/地纹/舞台景物，平涂空白约 5%，低于标题区一半；⑦画面要素与上列教材依据相符。
- 重画次数与原因：共三稿：首稿演员过大且观众被底边裁切；第二稿补全坐姿观众但演员仍接近上限；第三稿只缩小演员，四人均完整入框后采用。
- 成品 `E:\Projects\.tmp\pep-redraw\art\units\pep-g6s1-u4.webp`：1600×640，143,394 B，WebP quality 78；旧图 `E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g6s1-u4.webp`：1600×640，148,484 B。生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\pep-g6s1-u4.png`。
- 完整提示词（固定风格段 + 本图规格段 + 最终场景段，逐字）：

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: Make one continuous theater interior with two distinct low stage areas integrated side by side in the right two-thirds, no framed panels. The first small platform shows a Kunqu performer making a graceful flowing water-sleeve gesture; the second shows a Peking-opera performer in a strong stage pose with a patterned costume and a small paper lantern. Keep both adult performers at middle distance, complete head-to-sole figures about one quarter of image height and never more than one third, fully inside the frame. Show each in side profile or from behind; every visible profile has one clear eye and eyebrow. Place exactly two small school-age viewers in complete seated poses near the far-right lower edge; show each child from head to visible shoes, fully within the image. Plain curtain folds, stage boards and a few empty audience seats continue softly through the left title third, which remains filled and lower contrast. Keep all people small in the theater; no close-ups, no signs, no text, no additional audience.
Must include: one Kunqu flowing sleeve gesture; one Peking-opera pose; two low connected stage areas; exactly two complete back-view child audience members; plain curtain; stage boards and seats.
Mood: theatrical and vivid.

Edit the supplied image: preserve both low stages, costumes, gestures, lantern, curtain, seats and the two complete seated audience children exactly as they are. Reduce only the two performers by another 20–25%; each complete performer should be about 150–165 pixels tall on the final 640-pixel canvas, strictly below one third. Keep each performer's head, hands, costume and shoes fully inside the image, and keep side-profile eyes visible. Add no people or text.
```

## pep-g7s1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 依据：新版教材目录 p.5 与“生活中的音乐”主题 p.2–3、p.6。旧封面只有抽象音带和远景，缺少具体日常声源；新画面把校园、街巷和家窗连成连续的日常声音路线。
- 成品：`E:\Projects\.tmp\pep-redraw\art\pep-g7s1.webp`，1200×750，208,848 B；原图：`E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\pep-g7s1.webp`，1200×750，93,168 B；生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\pep-g7s1.png`，1586×992。
- 迭代：5 轮，按上述原因淘汰额外摊主/行人及较大的门口人物；保留三名孩子与对应声音锚点。

**最终提示词：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; the lower-left third (where a title and a dark gradient will be laid on the website) stays softer and lower in contrast but still filled with scenery such as grass, flowers, paths, distant trees or floor patterns, never an empty flat area. Rich detail, professional picture-book quality.
Scene: Compose three everyday sound moments as one continuous school-to-home street: a school bell at a gate, bicycle wheels passing a market awning, and birds at a window; layered pavements and doors fill the background as children listen.
Must include: school bell; bicycle wheels; birds at a window; children listening
Mood: alert and welcoming.

Edit the supplied finished cover as a preservation edit. Keep the continuous school-to-home street, the school gate and hanging bell, the bicycle passing the market awning, the open window with two birds, all layered paths, doors, plants, flowers, awnings and paper-cut ribbons exactly in the same arrangement and style. Keep exactly three children: one listening at the school gate, one riding the bicycle, and one listening at the window; add no vendor, adult, pedestrian or extra person. Preserve the children in complete head-to-shoes poses fully inside the frame, each about one quarter of the 750-pixel canvas height and strictly below one third; show each in back view or side profile with one clear eye and eyebrow on every visible profile. Keep the lower-left title area softly filled with grass, flowers, pavement and distant trees, with no empty flat patch. Do not add text, letters, numbers, labels, watermark or logo.
```

**按模版第 5 节逐条自检：**

1. 纸层剪纸一眼可辨：天空、街面、屋顶、植物、人物均为分层卡纸并有纸边阴影。
2. 配色落在模版范围；与留用封面参考并排时不跳色。
3. 画面没有可读文字、数字、伪文字、印章、logo 或水印。
4. 无教材卡通人物和近景正脸；三名孩子全身在框内，分别约 19%、23%、20%；三张原图脸部裁片均见清楚眼睛。
5. 无乐器；校门铃为正确悬挂的日常小铃，非弦乐器。
6. 左下标题区草地、花草、小路和远树连续填充；空白平涂约 0%–3%。
7. 校门铃、自行车车轮、窗边鸟和倾听孩子对应教材日常声音主题 p.2–3、p.6。
- 原尺寸脸部/结构裁片：`work/faces/pep-g7s1-cover-gate-profile-native.png`, `pep-g7s1-cover-cyclist-profile-native.png`, `pep-g7s1-cover-window-profile-native.png`；3 个可见侧脸都有眼睛。

## pep-g7s1-u1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 依据：第一单元“生活中的音乐”p.2–3、“音乐开启心灵之窗”p.6。旧图为草坡和两名坐姿孩子，缺日常声源；新图以学校走廊串联楼梯脚步、门铃和窗外鸟声。
- 成品：`E:\Projects\.tmp\pep-redraw\art\units\pep-g7s1-u1.webp`，1600×640，182,388 B；原图：`E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g7s1-u1.webp`，1600×640，116,452 B；生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\pep-g7s1-u1.png`，2172×724。
- 迭代：3 轮；首图人物超限，连续两次编辑后两人降至约 30%–32%，都完整入框。

**最终提示词：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: Show an everyday school corridor as ordinary sounds meet: footsteps on stairs, a door chime and birds beyond a window; two children pause to listen as lockers, plants and window layers fill the width. Create one continuous school corridor from foreground stairs at the right through the doorway and windows toward the softly detailed left title area. Include exactly two children, each about one quarter of the 640-pixel image height (roughly 150–170 pixels tall), never more than one third; keep both complete from head to shoes inside the frame. Show both only from behind or in side profile; every visible side face has one clear small eye and eyebrow. One child takes the last stair step with subtle footstep rings, the other stands by a door listening to a small hanging chime; birds perch outside the window. Keep all objects and layered corridor details visible at mobile width, with no empty flat wall or empty sky.
Must include: school corridor; stair footsteps; door bell; birds beyond a window; two listening children
Mood: attentive and familiar.

Edit only the two children. Reduce each person's complete head-to-shoes height to about 155–165 pixels on the final 640-pixel canvas, roughly one quarter, safely below one third. Shrink the child on the staircase by about 25% and the child by the doorway by about 15%, keeping their feet on the same stair/floor surfaces and all limbs in natural proportion. Preserve both side profiles and their visible eyes. Keep the whole corridor, lockers, windows, birds, door chime, plants, stairs, paper-cut texture, and sound ribbons unchanged. Add nothing and remove nothing else.
```

**按模版第 5 节逐条自检：**

1. 走廊墙、窗、植物、储物柜、地面都是多层剪纸，非渐变空背景。
2. 颜色与三上返工及留用参考接近。
3. 无可读文字、数字、伪文字、印章、logo 或水印。
4. 无教材卡通人物、无近景正脸；两名孩子侧影全身入框，约 30%–32%；两张原尺寸侧脸裁片均有清楚眼睛。
5. 门边小铃悬挂自然且有可辨铃体；无弦乐器。
6. 左三分之一有低对比走廊、窗景、地砖、柜体和盆栽；平涂空白约 0%–4%。
7. 楼梯脚步、门铃、窗外鸟和倾听孩子直接对应本单元生活声音内容。
- 原尺寸脸部/结构裁片：`work/faces/pep-g7s1-u1-doorway-profile-native.png`, `pep-g7s1-u1-stair-profile-native.png`；2 个侧脸都有眼睛，楼梯孩子完整含鞋。

## pep-g7s1-u2.webp

- 册别/单元：七年级上册第二单元《多彩的音乐风格》
- 教材依据：同书目录 p.5；“万马奔腾”（马头琴独奏）、“北京的金山上”（藏族民歌）p.22。（页码为教材印刷页码，来源文件：7音乐（简谱）七年级上册.pdf）
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：重画 0 次；为满足单元图 ≤180 KB，WebP 质量 78 处理时加 0.3px 轻微柔化。
- 第 5 节自检：1 通过（纸层与清晰剪纸边缘）；2 通过（统一人教版配色）；3 通过（无文字、数字、伪文字、印章或 logo）；4 通过（无教材卡通人物，孩子为背影/侧影且无特写）；5 通过（画面未出现乐器）；6 通过（封面左下留空／单元图左侧留空）；7 通过（意象对应所列教材页）。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: two children watch paper-cut horses gallop across a broad open horizon while two distinct folk-music ribbons sweep through the air.
Must include: galloping horses evoking the Mongolian horse-head-fiddle solo “Ten Thousand Galloping Horses”; a second warm sunrise motif evoking the Tibetan folk song “Beijing’s Golden Mountain”; two different regional music styles shown only as patterned ribbons, without written labels. No extra people, no buildings, no instruments, no text.
Mood: vibrant and expansive.
```

## pep-g7s1-u3.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 依据：博物馆乐器陈列及钟、鼓、磬 p.46；鼓的演变 p.47。旧图空白标题区大，钟列与人物放大；新图以三个展区呈现钟、鼓、石磬。
- 成品：`E:\Projects\.tmp\pep-redraw\art\units\pep-g7s1-u3.webp`，1600×640，179,582 B；原图：`E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g7s1-u3.webp`，1600×640，90,222 B；生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\pep-g7s1-u3.png`，1983×793。
- 迭代：2 轮；首图两位访客过大，修订后降到约 23%–24%。

**最终提示词：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: Arrange a music archaeology gallery in deep perspective with three exhibit bays, each holding one bell, drum or stone chime on a low plinth; two visitors walk a patterned floor beneath an empty frieze. Show exactly one ancient bronze bell suspended from a short wooden hanger on the first plinth, one cylindrical barrel drum with a taut round hide head on the second, and one single flat L-shaped stone chime hanging from a simple wooden frame on the third. Keep these three artifacts distinct and correctly structured, at middle distance. Include exactly two child visitors, each about one quarter of the 640-pixel image height (roughly 150–170 pixels tall), never more than one third, fully inside the frame from head to shoes. Show them from behind or in side profile; each visible profile has a clear small eye and eyebrow. Fill the gallery with carved paper floor bands, layered walls, beams and display bays; the left title third stays soft and detailed, not empty. No extra instruments, extra visitors, signs, labels or writing.
Must include: ancient bell; drum; stone chime; three display plinths; two visitors
Mood: quiet discovery.

Edit the supplied image only to scale down both child visitors to about one quarter of the final 640-pixel canvas height (roughly 155–165 pixels), strictly below one third. The complete figures from hair to shoes should be much smaller than the artifacts and remain naturally proportioned and entirely inside the frame. Keep the existing side-profile faces and clear eyes. Preserve exactly one hanging bronze bell, one cylindrical drum with its drumhead, and one suspended L-shaped stone chime, with their supports and all three low plinths unchanged. Preserve the full paper-cut gallery, floor, architecture, colours and ribbons. Add no people, instruments, signs or text.
```

**按模版第 5 节逐条自检：**

1. 馆舍、山水、展台、地毯和人物均为纸层剪纸；层次明确。
2. 红、黄、青绿和米白符合模板，和留用参考可并置。
3. 无可读文字、数字、伪文字、标签、印章、logo 或水印。
4. 两名访客侧影全身入框，各约 23%–24%；原尺寸两张脸部裁片都看见眼睛；没有近景脸。
5. 钟为悬挂钟体，鼓有圆筒形鼓腔和绷紧鼓面，石磬为单片悬挂石板；结构局部裁片已检查。
6. 左三分之一填入山、水、树和展馆结构；平涂空白约 0%–3%。
7. 钟、鼓、石磬与访客参观情境对应 p.46–47。
- 原尺寸脸部/结构裁片：`work/faces/pep-g7s1-u3-visitor-boy-native.png`, `pep-g7s1-u3-visitor-girl-native.png`, `pep-g7s1-u3-instruments-native.png`；2 个侧脸都有眼睛；乐器结构裁片一并检查。

## pep-g7s1-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 依据：希腊里拉琴 p.64–65、古典钢琴作品 p.67、小提琴协奏曲 p.71。旧图乐器挤成一排、人物较大；新图用三间连续小展演空间表现古希腊、古典钢琴与小提琴协奏曲。
- 成品：`E:\Projects\.tmp\pep-redraw\art\units\pep-g7s1-u4.webp`，1600×640，179,772 B；原图：`E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g7s1-u4.webp`，1600×640，118,874 B；生成 PNG：`E:\Projects\.tmp\pep-redraw\raw\pep-g7s1-u4.png`，1983×793。
- 迭代：3 轮；首图人物过大，先缩小全员，再单独缩小小提琴演奏者；最终儿童约 22%–26%，演奏者约 31%–32%。

**最终提示词：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: Use a three-panel time sequence from an ancient Greek lyre carving to a classical grand piano and finally a violin concerto rehearsal; each panel has its own paper floor and window, joined by one restrained ribbon. Keep the three compact panels in the right two-thirds in this order: (1) a carved ancient Greek temple relief beside a correctly shaped U-frame lyre with crossbar and seven clear strings; (2) a classical music room with a grand piano, long curved body, three legs, visible keyboard and raised lid; (3) a small violin concerto rehearsal with one adult solo violinist holding a correctly proportioned violin and bow, plus a child listener. Include exactly three small child listening groups across the sequence, one group of one child in each panel. Each child and the adult violinist should be about one quarter of the 640-pixel picture height (roughly 145–165 pixels), never more than one third, complete from head to shoes, and fully inside the frame. Keep the children viewed from behind or in side profile; every visible side face, including the violinist, has one clear small eye and eyebrow. Fill the left title third softly with layered classical wall, window, paper floor and a few decorative plants, without a blank flat area. A single restrained paper sound ribbon joins the floors but does not cover faces or instruments. No extra people, no extra instruments, no text, signs, labels or pseudo-writing.
Must include: Greek lyre; grand piano; solo violin; three small listening groups
Mood: curious and historical.

Edit only the adult violinist in the supplied image. Reduce the complete adult figure from hair to shoes by about 40%, so the violinist is approximately 150–165 pixels tall on the final 640-pixel canvas, about one quarter and strictly below one third. Keep the adult's side-profile face, clear eye and eyebrow, natural violin-playing pose, violin and bow correctly proportioned, and both shoes fully in the frame. Keep all three small child listeners exactly as they are. Preserve the U-frame Greek lyre with seven strings, grand piano and keyboard, all windows, three panels, paper floors, ribbon and architectural details unchanged. Add or remove nothing else.
```

**按模版第 5 节逐条自检：**

1. 三间空间、地面、窗帘、墙饰均由纸层构成，左侧仍有柔和细节。
2. 配色在模板范围内，与留用参考相协调。
3. 无可读文字、数字、伪文字、标签、印章、logo 或水印。
4. 三名孩子与成人演奏者均侧影或背影、全身入框；儿童约 22%–26%，成人约 31%–32%；四张原尺寸脸部裁片均有眼睛。
5. 里拉琴为 U 形框、横梁与七弦；古典三角钢琴有弯曲琴身、琴键、三脚和抬起琴盖；小提琴有琴身、琴颈、弦轴与弓，持琴姿势可辨。
6. 左标题区以浮雕墙、窗、纸地面和植物填充；平涂空白约 0%–4%。
7. 三段历史与教材里拉琴、古典钢琴、小提琴协奏曲条目对应。
- 原尺寸脸部/结构裁片：`work/faces/pep-g7s1-u4-lyre-child-native.png`, `pep-g7s1-u4-piano-child-native.png`, `pep-g7s1-u4-violin-listener-native.png`, `pep-g7s1-u4-violinist-profile-native.png`, `pep-g7s1-u4-instrument-structure-native.png`；4 个可见侧脸都有眼睛，乐器结构局部已检查。

## pep-g7s2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 依据：第一单元“声·音·乐”与声音振动、回声内容 p.2–3、p.9。旧封面天空和地面留空较多；新图以石廊、听音室、峡谷和溪流组成声音往返的剖面。
- 成品：E:\Projects\.tmp\pep-redraw\art\pep-g7s2.webp，1200×750，217,132 B；旧图：E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\pep-g7s2.webp，1200×750，54,204 B；生成 PNG：E:\Projects\.tmp\pep-redraw\raw\pep-g7s2.png，1586×992。
- 迭代：1 轮。两位孩子全身在框；鼓掌孩子约 31%，溪边听者约 27%。

**最终完整提示词：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; the lower-left third (where a title and a dark gradient will be laid on the website) stays softer and lower in contrast but still filled with scenery such as grass, flowers, paths, distant trees or floor patterns, never an empty flat area. Rich detail, professional picture-book quality.
Scene: Use a cutaway cross-section: a child’s clap sends layered ripples through a stone corridor, across a small room and back from a distant valley wall; textured surfaces and returning wave arcs fill the whole frame. Let the continuous cutaway pass from a stone school corridor through a small listening room to a distant rocky valley wall and stream, with sound-wave ribbons visibly returning toward the children. Include exactly two children: one clapping in the corridor and one listening beside the stream. Make each complete person about one quarter of the 750-pixel cover height (roughly 165–185 pixels), never more than one third; show head to shoes fully inside the frame. Use back views or side profiles, with one clear eye and eyebrow on every visible profile. Fill the lower-left title area softly with layered stone path, grass, stream plants and distant trees; no blank flat sky or empty paper.
Must include: clapping hands; visible wave bands; rocky valley wall; stream; listening child
Mood: curious and clear.
```

**模版第 5 节逐条自检：**

1. 天空、石廊、室内、山体、溪水、植物和音带都由纸层构成。
2. 色彩符合模板范围，纸层阴影与留用参考协调。
3. 无可辨文字、数字、伪文字、印章、logo、水印。
4. 无教材卡通人物和近景正脸；两名孩子完整入框，约 27%–31%；原尺寸两张侧脸裁片都有清楚眼睛。
5. 无乐器，场景中的小桌鼓不作为必需演奏乐器；手掌拍击为声源。
6. 左下标题区铺有石板路、花草、溪边植物和远处树木；平涂空白约 0%–4%。
7. 拍手、波纹、山壁、溪水和听者对应声音产生及回声单元内容。
- 原尺寸脸部/乐器裁片：work/faces/pep-g7s2-cover-clapping-child-profile-native.png 与 pep-g7s2-cover-listening-child-profile-native.png；两张脸部裁片均见眼睛。

## pep-g7s2-u1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 依据：声音从振动开始 p.2–3、舒适听觉环境与山谷回声讨论 p.8–9。旧图已有峡谷和两名拍手孩子，但低细节面积约 29%；新图保留峡谷回声，人物缩小并让岩层、松枝和溪流铺满全宽。
- 成品：E:\Projects\.tmp\pep-redraw\art\units\pep-g7s2-u1.webp，1600×640，182,996 B；旧图：E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g7s2-u1.webp，1600×640，141,862 B；生成 PNG：E:\Projects\.tmp\pep-redraw\raw\pep-g7s2-u1.png，1983×793。
- 迭代：2 轮。人物从超限缩至约 29%–31%，脚与鼓掌姿势完整。

**最终完整提示词：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: Show sound bouncing through a detailed mountain gorge: a child claps from a rocky ledge, wave bands strike the opposite wall and return over a small stream; rock strata and pine ledges fill the panorama. Put the child on the right third of the frame, with the sound bands visibly traveling from the clapping hands to the opposite cliff and back; fill the left title third with layered rock strata, stream, pines and reeds at lower contrast. Include exactly one complete child, about one quarter of the 640-pixel image height (roughly 150–165 pixels), never more than one third; keep head, hands and shoes inside the frame. Show the child in side profile with one clear eye and eyebrow. No close-up, no extra people, no text, labels or signs.
Must include: clapping hands; rocky ledge; returning wave bands; opposite valley wall; stream
Mood: clear and exploratory.

Edit only the child in the supplied image. Reduce the complete figure from head to shoes by about 45–50%, so the child is approximately 150–165 pixels tall on the final 640-pixel canvas, around one quarter and strictly below one third. Keep the side-profile face with one clear eye and eyebrow, both clapping hands visible, natural proportions, and both shoes fully on the ledge inside the frame. Preserve the gorge, cliffs, stream, pines, returning sound-wave bands, paper layers, colors and framing. Add no people, text or signs.
```

**模版第 5 节逐条自检：**

1. 岩层、松枝、峡谷溪流与声波都是层叠剪纸。
2. 配色在模板范围，与纸层参考图协调。
3. 无可读文字、数字、伪文字、标签、印章、logo、水印。
4. 单名孩子完整入框、侧脸清楚，约 29%–31%；原尺寸脸部裁片见一只清楚眼睛。
5. 无乐器；拍手是声源，回声带表现反射。
6. 左三分之一岩层、松枝和溪面细节连续；平涂空白约 0%–4%。
7. 拍手、回声、对面山壁、溪流与单元振动/回声教学相符。
- 原尺寸脸部/乐器裁片：work/faces/pep-g7s2-u1-child-profile-native.png；1 个可见侧脸有眼睛。

## pep-g7s2-u2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 依据：音乐的艺术特征与联想内容 p.22、p.26、p.34。旧图是月光水面与放大的琵琶/儿童，左侧标题区连续留白超过 15%；新图以河溪、芦苇、石块和音带把左区填实。
- 成品：E:\Projects\.tmp\pep-redraw\art\units\pep-g7s2-u2.webp，1600×640，183,280 B；旧图：E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g7s2-u2.webp，1600×640，148,334 B；生成 PNG：E:\Projects\.tmp\pep-redraw\raw\pep-g7s2-u2.png，1983×793。
- 迭代：3 轮。首次两人过大；两次收小后演奏者约 23%–25%、听者约 28%–30%。

**最终完整提示词：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: Place a small pipa player and a listening child at the right beside a stream; rippling water bands bend into paper sound arcs that continue through the left title third, with stones and reeds breaking up the open ground. Show the pipa correctly: pear-shaped wooden body, short fretted neck, four strings, held upright against the player's chest, with one hand supporting the neck and the other plucking. Include exactly two children, each about one quarter of the 640-pixel image height (roughly 150–165 pixels), never more than one third; keep both complete from head to shoes inside the frame. The player and listener are seen from behind or in side profile; every visible profile has one clear small eye and eyebrow. Let the stream and paper sound arcs remain clear and filled with layered pebbles, reeds, banks and plants across the whole width, especially the left title third. No extra people, no text, labels or signs.
Must include: pipa player; listening child; stream; rippling sound arcs; reeds
Mood: curious and reflective.

The last edit still left the pipa player too large. Edit only that person again: make the complete seated player, from hair to shoes, no more than 180 pixels tall in the supplied image (roughly one quarter of the image's 724-pixel height, about 24%). Reduce the current figure to about 60% of its present height. Keep the player seated on the same bank, with the side-profile eye visible, natural limbs, both hands plucking/supporting the same pipa, bent legs and both shoes fully shown. Keep the listening child at its current size. Keep the pipa unchanged and preserve its pear body, fretted neck and four strings. Leave all landscape, stream, reeds, rocks, trees and ribbons unchanged. Add no objects, people, text or labels.
```

**模版第 5 节逐条自检：**

1. 草坡、溪水、芦苇、石块、人物和音带均为纸层。
2. 配色与三上保留参考和本册其他插图协调。
3. 无可辨文字、数字、伪文字、标签、印章、logo、水印。
4. 两名孩子均侧影、全身入框；约 23%–30%；原尺寸两张脸部裁片都有清楚眼睛。
5. 琵琶呈梨形共鸣箱、短颈与品位、四弦，抱持直立并以另一手弹拨；结构裁片已检查。
6. 左标题区溪水、石块、芦苇与连续音带填满；平涂空白约 0%–3%。
7. 琵琶演奏者、倾听孩子和水波联想对应 p.22、p.26、p.34 的音乐想象主题。
- 原尺寸脸部/乐器裁片：work/faces/pep-g7s2-u2-pipa-player-profile-native.png、pep-g7s2-u2-listener-profile-native.png 与 pep-g7s2-u2-pipa-structure-native.png；两张脸部裁片均见眼睛。

## pep-g7s2-u3.webp

- 册别/单元：七年级下册第三单元《欣赏的智慧》
- 教材依据：同书目录 p.5；《汉宫秋月》（古筝独奏）p.42、“汉宫秋月图”p.43。（页码为教材印刷页码，来源文件：7音乐（简谱）七年级下册.pdf）
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：2 次。初稿及一次修订仍出现无出处山水；终稿依据 p.43 的月、树与宫苑图景重画。
- 第 5 节自检：1 通过（清晰纸层与剪纸边缘）；2 通过（统一人教版配色）；3 通过（无文字、数字、伪文字、印章或 logo）；4 通过（无教材卡通人物，孩子为背影/侧影且无特写）；5 通过（古筝呈长形多弦与筝码结构）；6 通过（封面左下留空／单元图左侧留空）；7 通过（意象对应所列教材页）。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: two children listen to a guzheng beside a serene palace courtyard under a full moon, inspired by the unit’s “Han Palace Autumn Moon” painting.
Must include: one correctly structured 21-string guzheng; a round moon, an old tree silhouette and simple palace rooflines from the painting on printed page 43; a quiet sound ribbon showing the careful listening focus of this unit. Show only two children, the guzheng, moon, tree and palace-courtyard shapes on paper; no mountains, lakes, rivers, extra buildings, extra instruments, labels, or writing.
Mood: contemplative and attentive.
```

## pep-g7s2-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 依据：《庆丰收》小提琴独奏 p.66；同曲不同演绎与表演艺术家的二度创作 p.72。旧图人物大、台前空；新图用麦田、篮筐、河岸围出圆形收获舞台，听众以安静/轻拍对照同曲演绎。
- 成品：E:\Projects\.tmp\pep-redraw\art\units\pep-g7s2-u4.webp，1600×640，180,260 B；旧图：E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g7s2-u4.webp，1600×640，114,684 B；生成 PNG：E:\Projects\.tmp\pep-redraw\raw\pep-g7s2-u4.png，1983×793。
- 迭代：3 轮。两名听众缩至约 27%–29%，演奏者约 31%–33%；三人全身可见，鞋与舞台接触。

**最终完整提示词：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: Place a violin soloist on a round harvest platform surrounded by baskets and patterned field rows; two children compare calm and lively versions of the same melody from opposite sides of the stage. Show a correctly structured violin with a carved body, four strings, fingerboard, neck, tuning pegs and bow; the soloist holds it naturally under the chin and draws the bow across the strings. The two children show contrasting listening gestures: one quietly listens with hands together; the other claps gently, both facing the same performance. Keep the platform, harvested field rows, stacked baskets, grain sheaves and layered distant hills detailed across the whole width. Include exactly three people; each complete figure should be around one quarter of the 640-pixel image height (roughly 145–160 pixels) and never more than one third, fully inside the frame from head to shoes. Show the violinist in side profile with a clear eye and eyebrow; show the children from behind or in side profile, with a clear eye on every visible profile. Keep the figures small against the harvest scenery, no close-up faces, no text or labels.
Must include: solo violin; baskets; field rows; two children watching from opposite sides
Mood: joyful and inventive.

Edit only the adult violinist; the two children are already within size limits. Reduce the adult's complete hair-to-shoes height by about 15–20% so the soloist is no more than 30% of the final 640-pixel canvas height and clearly under one third. Keep the natural side-profile eye and eyebrow, violin, bow, playing pose and complete body. Make both shoes visibly touch the platform beneath the dress hem. Leave the two child listeners, round platform, baskets, harvest rows, river, grain, sound ribbons and paper-cut scenery unchanged. Add no people, objects or text.
```

**模版第 5 节逐条自检：**

1. 河岸、麦田、舞台、篮筐、人物与谷穗均为纸层。
2. 配色符合模板范围，与留用参考并置协调。
3. 无可读文字、数字、伪文字、标签、印章、logo、水印。
4. 三个人物为侧影或背影且全身入框：儿童约 27%–29%，演奏者约 31%–33%；三个原尺寸脸部裁片都见眼睛。
5. 小提琴琴身、琴颈、四弦、弦轴与弓可辨；持琴与运弓姿势自然，局部已检查。
6. 左标题区麦田、河流、稻束与远山铺满；平涂空白约 0%–5%。
7. 小提琴独奏、收获舞台、篮筐与两种听众反应对应 p.66、p.72。
- 原尺寸脸部/乐器裁片：work/faces/pep-g7s2-u4-left-listener-native.png、pep-g7s2-u4-violinist-profile-native.png、pep-g7s2-u4-right-listener-native.png 与 pep-g7s2-u4-violin-structure-native.png；3 个侧脸都有眼睛，乐器结构裁片已看。

## pep-g8s1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 依据：第一单元旋律主题与《在太行山上》选段 p.2。旧封面红崖、音带和登山者集中在右侧，左下留有大块浅色空纸；新图扩成连续太行丹崖、石阶、松林、野花与旋律路线。
- 成品：E:\Projects\.tmp\pep-redraw\art\pep-g8s1.webp，1200×750，183,864 B；旧图：E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\pep-g8s1.webp，1200×750，115,056 B；生成 PNG：E:\Projects\.tmp\pep-redraw\raw\pep-g8s1.png，1586×992。
- 迭代：2 轮。两名背影由约 34%–38% 缩至约 20%–23%，均全身入框。

**最终完整提示词：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: book cover illustration, landscape 8:5, deliver at 1200x750. One clear focal subject in the upper two-thirds; the lower-left third (where a title and a dark gradient will be laid on the website) stays softer and lower in contrast but still filled with scenery such as grass, flowers, paths, distant trees or floor patterns, never an empty flat area. Rich detail, professional picture-book quality.
Scene: Let a dramatic zigzag of Taihang red cliffs rise from the foreground into a layered ridge, with a melody ribbon tracing each contour and two tiny children on a carved mountain stair; cliff faces and foothill pines fill the cover. Build a deep series of red-rock folds and a winding stone stair across the upper and right portions, with the sound ribbon following the ridge. Include exactly two children, viewed from behind, complete from hair to shoes, each about one quarter of the 750-pixel cover height (roughly 160–180 pixels) and never more than one third. Fill the lower-left title area softly with foothill pines, grasses, wildflowers, path and a distant ridge; no blank flat sky or empty paper.
Must include: Taihang mountain folds; winding ridge path; tiny back-view walkers; layered sound ribbon
Mood: resolute and expansive.

Edit only the two back-view children. Reduce both complete head-to-shoe figures substantially to about 165–180 pixels tall on the final 750-pixel canvas, approximately one quarter and strictly below one third. Keep their bodies natural, both full pairs of shoes visible on the stair, and both children entirely inside the frame. Preserve the red Taihang cliff folds, stone stair, pine layers, meadow, wildflowers, sound ribbon and composition unchanged. Do not add or remove people, objects, text or labels.
```

**模版第 5 节逐条自检：**

1. 丹崖、石阶、松林、草木、人物和音带均为分层卡纸。
2. 配色符合模板，与留用封面参考协调。
3. 没有可辨文字、数字、伪文字、印章、logo、水印。
4. 无教材卡通人物和可见脸；两名纯背影约 20%–23%，均完整入框，头部裁片确认没有正脸。
5. 无演奏乐器。
6. 左下标题区有松林、草地、野花、石路和远岭；平涂空白约 0%–3%。
7. 太行红崖、山阶、背影行者和旋律带对应教材第一单元主题与选段。
- 原尺寸脸部/乐器裁片：work/faces/pep-g8s1-cover-walker-1-backview-native.png、pep-g8s1-cover-walker-2-backview-native.png；两名均为纯背影。

## pep-g8s1-u1.webp

- 册别/单元：八年级上册第一单元《旋律的奥秘》
- 教材依据：同书目录 p.5；旋律结构与视觉形态联觉活动 p.6–7、“千里江山图（局部）”及其旋律启发活动 p.7。（页码为教材印刷页码，来源文件：8音乐（简谱）八年级上册.pdf）
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：重画 0 次。
- 第 5 节自检：1 通过（纸层与清晰剪纸边缘）；2 通过（统一人教版配色）；3 通过（无文字、数字、伪文字、印章或 logo）；4 通过（无教材卡通人物，孩子为背影/侧影且无特写）；5 通过（画面未出现乐器）；6 通过（封面左下留空／单元图左侧留空）；7 通过（意象对应所列教材页）。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; keep the left third quiet sky or plain paper layers for the title. Rich detail, professional picture-book quality.
Scene: two children study a layered mountain-and-water composition inspired by the painting “A Thousand Li of Rivers and Mountains” while a melody ribbon traces its changing contours.
Must include: the painting’s distant peaks, river shapes and layered composition from the unit’s activity; one paper sound ribbon that rises and falls with the landscape; two children observing from behind. No instruments, buildings, extra people, labels, or writing.
Mood: curious and lyrical.
```

## pep-g8s1-u2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 依据：合唱与《唱支山歌给党听》p.26。旧图三名孩子被放大，抽象音带独占背景；新图以三名学生组成错落三层小合唱，空白谱架与三条声带保留演唱语境。
- 成品：E:\Projects\.tmp\pep-redraw\art\units\pep-g8s1-u2.webp，1600×640，150,242 B；旧图：E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g8s1-u2.webp，1600×640，88,402 B；生成 PNG：E:\Projects\.tmp\pep-redraw\raw\pep-g8s1-u2.png，1983×793。
- 迭代：3 轮；三名歌者由超限缩到约 22%–27%，每人完整入框。

**最终完整提示词：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: Arrange a small three-voice student choir in three compact staggered rows on a plain performance platform, with three paper sound ribbons rising above them; floor seams, music stands, and flower cut-outs continue across the left title third without a named landscape. Show exactly three school-age singers, one complete child in each depth row, singing together toward one blank music stand. Each child should be about one quarter of the 640-pixel image height (roughly 140–155 pixels), never more than one third, full from head to shoes and entirely inside the frame. Show the children from behind or in side profile; every visible side face has one clear eye and eyebrow. Keep the platform, floor seams, stands, paper flowers and acoustic wall panels detailed across the width, with the left title third soft and filled, not empty. No other people, no visible notation, no words, text or labels.
Must include: small choir; three rows of singers; three sound ribbons; blank music stand
Mood: warm and harmonious.

The last edit still left the singers too large. Reduce each of the three children to about half of their current complete head-to-shoe height, approximately 145–155 pixels on the final 640-pixel canvas (around 23–24%). Each singer should be no taller than half the blank music stand's height and clearly below one third of the canvas. Keep each figure complete with shoes, natural singing poses, visible side-profile eye and eyebrow. Keep exactly three singers in three staggered depth rows. Preserve the stand, platform, all ribbons, wall, flowers and floor unchanged. Add no people, text or notation.
```

**模版第 5 节逐条自检：**

1. 墙面、舞台、河岸、地板、花饰和音带为纸层剪纸。
2. 色彩在模板范围并与留用参考协调。
3. 无可辨文字、数字、伪文字、印章、logo、水印；谱架为空白。
4. 三名歌者均完整入框，约 22%–27%；侧影裁片中三个可见侧脸均有眼睛。
5. 无乐器。
6. 左三分之一为低对比声学墙、云形窗饰、地面和纸花；平涂空白约 0%–4%。
7. 小合唱、三行歌者和三条声带对应和声学习与合唱作品。
- 原尺寸脸部/乐器裁片：work/faces/pep-g8s1-u2-singer-1-profile-native.png、singer-2-profile-native.png、singer-3-profile-native.png；3 个侧脸都有眼睛。

## pep-g8s1-u3.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 依据：回文诗与赋格曲 p.41、《音乐的奉献》主题与变体 p.42–43。旧图两名孩子悬在空蓝底与三条音带之间，整体低细节约 59%；新图把四条折纸声部铺在带纸纤维与叠边的宽谱纸上，两名孩子追踪交叉点。
- 成品：E:\Projects\.tmp\pep-redraw\art\units\pep-g8s1-u3.webp，1600×640，183,684 B；旧图：E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g8s1-u3.webp，1600×640，74,780 B；生成 PNG：E:\Projects\.tmp\pep-redraw\raw\pep-g8s1-u3.png，1983×793。
- 迭代：2 轮；人物由约 49% 缩至约 22%–25%，两人全身入框。

**最终完整提示词：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: Lay four folded paper ribbons across a broad warm paper score, weaving and returning in different directions; two children trace the crossings with small paper markers while cut-paper score edges and repeated ribbon folds continue through the left title third. Make the sheet visibly textured with paper fibres, edge layers, gentle shadows and subtle embossed cut-paper details, not a blank flat surface. Include exactly two children, each complete head-to-shoes and about one quarter of the 640-pixel image height (roughly 145–160 pixels), never more than one third. Show them from behind or in side profile; every visible profile has one clear eye and eyebrow. Put both children to the right of centre, small against the broad sheet, pointing at different crossings with the markers. Keep four distinct folded ribbons interwoven across the full width, with their returns and crossings easy to follow at mobile width. No extra people, no writing, no text, no music notation or labels.
Must include: four woven paper ribbons; two children tracing crossings; blank score; folded paper arcs
Mood: precise and playful.
```

**模版第 5 节逐条自检：**

1. 谱纸、折叠音带、山水和人物都为纸层；纸面有纤维和叠边纹理。
2. 色彩在模板范围，四条声部颜色区分清楚。
3. 没有可辨文字、数字、伪文字、记号、印章、logo、水印。
4. 两名孩子为侧影，约 22%–25%，全身入框；两张原尺寸侧脸裁片均有眼睛。
5. 无乐器。
6. 左标题区以延续的纸谱边、山水、地面和折叠音带填满；平涂空白约 0%–3%。
7. 四条声部交织、折返与两名追踪者对应回文/赋格、主题变体内容。
- 原尺寸脸部/乐器裁片：work/faces/pep-g8s1-u3-child-1-profile-native.png、child-2-profile-native.png；2 个侧脸都有眼睛。

## pep-g8s1-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 依据：《图画展览会》钢琴版 p.46、管弦乐版 p.47；音色分类 p.48、配器训练 p.52。旧图仅有钢琴与两个大孩子，弦乐/管乐/打击乐分组缺失；新图把三类器乐置于独立声学凹龛，并以钢琴为中心。
- 成品：E:\Projects\.tmp\pep-redraw\art\units\pep-g8s1-u4.webp，1600×640，173,322 B；旧图：E:\Projects\yapu-worktrees\accomp\editions\renjiao\public\art\units\pep-g8s1-u4.webp，1600×640，99,874 B；生成 PNG：E:\Projects\.tmp\pep-redraw\raw\pep-g8s1-u4.png，1983×793。
- 迭代：2 轮。三名听者约 25%–29%，背影坐姿完整并露出鞋子。

**最终完整提示词：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.
Format: wide chapter-header illustration, panoramic 5:2, deliver at 1600x640. Place all meaningful subjects in the right two-thirds; the left third (under the title) is softer and lower in contrast but still filled with layered scenery such as clouds with hills, trees, water or fields, never a large empty flat sky or plain paper. Rich detail, professional picture-book quality.
Scene: Place a grand piano at the centre of a listening hall, with the violin, wind and percussion sections in separate alcoves as coloured timbre bands; layered paper acoustic panels fill the walls. Show one classical grand piano with a curved body, three legs, visible keyboard and raised lid; in the right-side alcoves display a small violin section with violins and bows, a wind section with a flute, clarinet and trumpet, and a percussion section with timpani, a bass drum and cymbals. Keep each instrument correctly shaped and clearly separated by its alcove and sound-color ribbon. Include exactly three school-age listeners, seated together at the far right, each complete head-to-shoes and about one quarter of the 640-pixel canvas height (roughly 145–160 pixels), never more than one third. Show them from behind, with visible shoes and no frontal faces. Keep the piano, alcoves and instruments in the right two-thirds; fill the left title third softly with layered acoustic wall panels, wooden floor seams and low-contrast floral cut-outs. No other people, no text, no sheet notation or labels.
Must include: grand piano; violin section; wind section; percussion section; listening children
Mood: rich and analytical.

Edit only the three seated children. Reduce each complete person from head to visible shoe by about 40%, to about 150–160 pixels tall on the final 640-pixel canvas, roughly one quarter and clearly below one third. Keep all three children fully seated with their legs and shoes visible, seen entirely from behind. Preserve the grand piano, keyboard, open lid, violin rack and bows, flute, clarinet, trumpet, timpani, bass drum, cymbals, alcoves, acoustic panels and floor unchanged. Add no people, instruments, text or labels.
```

**模版第 5 节逐条自检：**

1. 声学凹龛、钢琴厅、地板、花纹和器乐均为分层剪纸。
2. 配色遵循模板并在参考组中协调。
3. 无文字、数字、伪文字、谱面、标签、印章、logo、水印。
4. 三名听者为完整背影坐姿，约 25%–29%，腿和鞋均可见；三张头部裁片只见后脑。
5. 三角钢琴有弯曲琴身、琴键、三脚与抬起琴盖；小提琴有琴身、琴颈、弦轴与弓；管乐代表有横笛、单簧管与活塞小号；打击乐有定音鼓、大鼓与吊镲。结构裁片已检查。
6. 左标题区有声学墙板、花饰与木地板纹理；平涂空白约 0%–5%。
7. 钢琴、弦乐、管乐、打击乐分区对应音色分类与配器内容。
- 原尺寸脸部/乐器裁片：work/faces/pep-g8s1-u4-listener-1-backview-native.png、listener-2-backview-native.png、listener-3-backview-native.png 与 instrument-structure-native.png；三名均为纯背影，器乐结构局部已查看。

## pep-g8s2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 来源页：目录 p.5；合唱与《黄河大合唱》p.18–20；交响乐队/《第一小提琴协奏曲》p.31、45；舞台艺术与戏曲 p.49–68。旧图 1200×750、147,482 B；新图 1200×750、201,340 B；原始出图 1586×992；2 轮。人物：独奏者、指挥、观众约 20–25%，合唱/乐队约 16–20%，完整入框。标题区按验收意见加入低对比地毯、座椅靠背和花篮。

**首轮生成提示词（固定风格段 + 以下段落）：**

```text
Format: book cover illustration, landscape 8:5, final delivery 1200x750. One clear focal subject in the upper two-thirds. Keep the lower-left title zone calm but visibly detailed, with softly layered carpet motifs, the edge of several theatre seat-backs and a small flower basket; do not leave any broad flat or empty area. Rich detail, professional picture-book quality.
Scene: a single elegant Chinese opera-style paper proscenium frames a compact performance on a plain cream stage. A mixed choir stands behind one adult violin soloist and a compact symphony orchestra. No landscape, outdoor scenery or extra buildings; the curtain and performance fill the stage, with the soft title-zone details described above. Three very small primary-school children watch together at the far lower-right.
Must include: a mixed choir, one correctly shaped four-string violin held under the chin and played with a bow, a symphony orchestra with recognizable, correctly structured instrument families, one Chinese opera-style curtain, a gently patterned carpet, seat-backs and a flower basket.
Mood: unified, majestic and inviting.
Scale and framing: every child, adult performer, musician and viewer is fully visible from head to feet inside the frame, each about one quarter of image height and never more than one third. Keep generous paper space around each person; all are secondary to the full stage tableau. Children are seen from behind or in profile. Adults are seen from behind or in profile; every visible profile has one clear small dark eye and eyebrow. No close-up faces and no cropped bodies. Keep the left-bottom title zone soft, layered and not empty.
Maintain the exact layered paper-cut look and palette in the preceding fixed style. Crisp hand-cut paper edges and soft shadows; no text, letters, numbers, pseudo-writing, watermarks, logos or seals.
```

**第 1 次定向微调提示词：**

```text
Edit the supplied paper-cut book-cover illustration, keeping its warm Chinese theatre proscenium, ornate red curtains, mixed choir, orchestra, central violin soloist, patterned carpet, seat-backs and flower basket. Make the human scale smaller and the composition fully comply with these constraints: every child and adult must be shown from the back or in side profile only (no frontal faces); every visible side profile has one clear eye and one eyebrow. Show exactly three primary-school child viewers together at the lower right, but place them fully inside the frame with clear head, complete bodies, legs and shoes, generous margin from both the bottom and right edges. They should be about one quarter of image height and never more than one third. Keep every adult musician and singer small and fully visible head-to-feet too, about one quarter image height or less, none over one third. Arrange a compact choir in two shallow rows seen from behind facing the conductor; the conductor is a small back-view figure; the violin soloist is a small side-view adult playing a clearly recognizable four-string violin with bow; orchestra musicians are small, full-body side/back views with recognizable correctly proportioned instruments. Avoid dense rows of large front-facing faces. Retain all scene content, and do not add writing or extra props. Maintain the layered Chinese paper-cut style, crisp cut-paper edges and the same palette. Keep the lower-left soft carpet, seat-backs and flower basket visible but low-contrast for a future title overlay. Landscape 8:5, final crop 1200x750, no text, letters, numbers, pseudo-writing, watermark, logo or seals.
```

**模板第 5 节逐条自检：**
1) 红幕、舞台、座席与人物为层叠纸艺；2) 人教版暖色与蓝绿平衡；3) 无文字/伪字/数字/logo/水印；4) 表演者和观众完整，最大约 25%，原尺寸 soloist/child 裁片已查；5) 小提琴琴身、弦与琴弓及交响配器可辨；6) 左下标题区有低对比地毯、座椅和花篮，无大块平涂；7) 目录四单元内容和来源页码相符。

## pep-g8s2-u1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 来源页：单元首页 p.1、《送别》与统一/变化/平衡 p.2、《夕阳箫鼓》p.10。旧图 1600×640、125,650 B；新图 1600×640、160,456 B；原始出图 1983×793；3 轮。最终两名背影听者约 24–25%，全身完整。

**首轮生成提示词（固定风格段 + 以下段落）：**

```text
Format: wide chapter-header illustration, panoramic 5:2, final delivery 1600x640. Place all meaningful subjects in the right two-thirds. The left third is a quiet title zone with visibly layered pale-blue and cream paper grain and a few very subtle cut-paper wave or reed motifs; it must not be a broad blank or flat area. Rich picture-book detail.
Scene: a quiet riverside at dusk. In the right two-thirds, a short farewell path meets calm water and a single properly shaped pipa rests upright beside the river. Two small primary-school children listen from behind at the far right, standing fully within the image. No mountains, bridge, buildings or trees. Give the bank distinct layered stones and a few reeds; show a small lantern reflection on the calm water to evoke Sunset Xiao and Drum. Keep the left title zone quiet but softly detailed and unempty.
Must include: one correctly proportioned four-string pipa with pear-shaped body and fretted neck, a farewell path evoking the song Send-off, calm water evoking Sunset Xiao and Drum, two small back-view listeners, layered bank stones and reeds.
Mood: quiet and balanced.
Scale and framing: each child is about one quarter of image height and never more than one third, complete from head through shoes, fully inside all frame edges with margin. People are part of the landscape, not portraits. Keep faces unseen from behind; if any profile appears, draw a clear small eye and eyebrow. No close-up or cropped bodies. Keep the left title area soft, layered and not empty; content and river path remain mainly on the right.
Maintain the exact layered paper-cut look and palette in the fixed style. Show crisp hand-cut edges and gentle paper shadows, no text, letters, numbers, pseudo-writing, watermarks, logos or seals.
```

**第 1 次定向微调提示词：**

```text
Edit the supplied panoramic paper-cut illustration. Keep its dusk river, curved stone bank, lantern reflection, reeds, farewell path, floral paper sky and the correctly shaped upright four-string pipa. The two children are far too large: shrink each child dramatically to a distant landscape figure no taller than 25% of the full image height (at most one quarter), with both children complete head-to-shoes and ample margin inside the frame. In a 5:2 canvas, each child should be around 150 pixels tall in a 640-pixel image, never over 210 pixels. Place them at the far right bank beside the pipa. Reduce the pipa proportionally to a natural instrument scale, about the same height as a seated child or slightly shorter, never more than 22% of the image height. Preserve the same 5:2 panoramic layout. Keep the left third softly textured and filled by pale-blue/cream paper layers and faint reed/wave cutouts, calm enough for a title but not blank. The only people are two primary-school children seen fully from behind; no faces or close-ups. No cropping at any edge. Preserve the handmade layered paper-cut look, clear paper edges and warm palette. No text, letters, numbers, pseudo-writing, watermark, logo or seals.
```

**第 2 次定向微调提示词：**

```text
Edit only the two small back-view child listeners on the far-right riverbank. Enlarge each child modestly from the current scale to about 22–25% of the full image height (roughly 175–195 pixels in the 793-pixel raw image), never above one third. Keep each child fully inside the frame from head to shoes with clear margin from the right and bottom edges. Preserve the river, pipa, lantern, bank stones, reeds, sky and all paper textures unchanged; keep the pipa at its natural scale. The two children must remain back views with no visible faces, remain part of the distant landscape and not become portraits. Preserve the 5:2 composition, layered paper-cut edges and the soft but filled title area. Do not add any people or objects, and add no writing, symbols or labels.
```

**模板第 5 节逐条自检：**
1) 河岸、天空、水面、琵琶与人物均为纸层；2) 色盘与剪纸参考协调；3) 无文字或水印；4) 两名背影完整，约 24–25%；5) 原尺寸琵琶裁片 `work/faces/pep-g8s2-u1-pipa.png` 已查看，梨形琴身、琴颈、弦轴与弦列可辨；6) 左侧有纸纹、水波/芦苇微纹，安静不空；7) 《送别》《夕阳箫鼓》意象匹配 p.2、p.10。

## pep-g8s2-u2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 来源页：单元首页 p.17–18，《黄河大合唱》及管弦乐队伴奏 p.18–20。旧图 1600×640、179,908 B；新图 1600×640、171,920 B；原始出图 1983×793；2 轮。最终孩子约 28%，指挥约 32%，合唱约 29%，乐手约 19%，均未超过 1/3。

**首轮生成提示词（固定风格段 + 以下段落）：**

```text
Format: panoramic 5:2 chapter header, final 1600x640. Put the choir, orchestra, river ribbon and listeners in a compact, varied arrangement on the right half. Keep the left third title zone calm but visibly filled with layered pale-blue and cream paper grain and a few very restrained flowing-water cut-paper motifs; it is never plain empty space. Rich scene detail, with a different composition from other unit headers.
Scene: on a curved, stony Yellow River bank at dusk, a compact mixed adult choir and a small orchestra form a semicircle within the right half, accompanied by one folded blue river ribbon that rises behind the choir and remains on the right. Include two primary-school child listeners at the far right. The left third has softly layered paper current patterns and subtle decorative cutouts. No mountains, bridges, buildings or trees.
Must include: a compact mixed choir evoking Yellow River Cantata; a compact orchestra accompaniment with a few clearly recognizable, correctly structured instruments (four-string bowed violins, one cello with endpin, a horizontal flute, and a brass trumpet with valves); one contained folded river ribbon; two small listeners seen from behind.
Mood: stately and stirring.
Scale and framing: exactly two child listeners; adult choir members and musicians are seen only from behind or in side profile, each profile showing a clear small eye and eyebrow. Every person is fully visible head-to-feet, about one quarter of image height and never more than one third, with margin from all edges; no large faces or portraits. Keep each figure visually secondary to river-bank and ensemble landscape. The left title region stays soft, detailed and not blank.
Maintain the exact layered paper-cut look and palette in the fixed style: crisp hand-cut coloured paper edges, visible card layers and gentle shadows. No text, letters, numbers, pseudo-writing, watermarks, logos or seals.
```

**第 1 次定向微调提示词：**

```text
Edit the supplied panoramic layered-paper illustration, retaining its dusk Yellow River, folded blue river ribbon, choir-and-orchestra idea, bank stones and two child listeners. Correct the oversized human figures: reduce all people substantially. Use exactly four compact adult choir singers, exactly four small adult orchestra players and one small adult conductor, plus the two child listeners. Every individual must be seen only from behind or in strict side profile; no frontal or three-quarter faces. Any visible side profile must have one clear eye and eyebrow. Every person must be complete head-to-shoes, not hidden behind instruments or cut off at the canvas edge. Make each person about one quarter of the image height or smaller; in the 640-pixel image, each figure should occupy around 130–155 pixels, never over 210 pixels. Place the four choir singers as a small side-view group on the right, facing the back-view conductor. Keep orchestra players small behind their instruments; retain clear, correctly structured four-string violins, a cello with endpin, a horizontal flute and trumpet with valves. The two children stand at the far right, full body with shoes, also small. No person may dominate the frame. Reduce human density while retaining all these story roles and put visual emphasis on the varied layered river-bank landscape. Preserve the quiet, subtly patterned left title third. Landscape 5:2, no writing, text, numbers, pseudo-writing, logos, watermark or seals.
```

**模板第 5 节逐条自检：**
1) 河流、合唱、岸石和器乐均为剪纸层；2) 暖橙/蓝色和纸层参考协调；3) 无伪文字、水印、logo；4) 孩子约 28%、指挥约 32%、合唱者约 29%、乐手约 19%，全身入框；侧脸裁片已查看；5) 原尺寸乐器裁片 `work/faces/pep-g8s2-u2-instruments.png` 已看：小提琴弓奏、大提琴尾针、横笛、小号活塞结构可辨；6) 左侧波流/剪纸纹样连续，无大块平涂；7) 合唱和管弦乐伴奏对应 p.18–20。

## pep-g8s2-u3.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 来源页：单元首页 p.31；《第一小提琴协奏曲》p.45；交响乐队配器 p.31。旧图 1600×640、124,796 B；新图 1600×640、132,552 B；原始出图 1983×793；2 轮。最终独奏者约 24%、指挥约 27%、孩子约 24%、乐手约 19%。

**首轮生成提示词（固定风格段 + 以下段落）：**

```text
Format: panoramic 5:2 chapter-header illustration, final 1600x640. A distinct indoor concert-hall composition, not a river landscape. Place the orchestra, violin soloist and two listeners in the right two-thirds. Make the left title third soft but visibly occupied by pale-blue/cream layered acoustic-wall paper texture and faint cut-paper arch contours; keep it quiet yet never empty or flat. No outdoor landscape or added scenery.
Scene: inside an enclosed concert hall, a small adult violin soloist performs with a compact symphony orchestra against a simple cream paper wall. Two primary-school children listen together from behind at the far right. Include a restrained sound ribbon confined to the performance area. Add a simple curved paper stage edge and several small music stands, all in the right two-thirds.
Must include: one correctly structured four-string violin held under the chin and played with a bow; a compact symphony orchestra with clearly recognizable string, woodwind, brass and percussion sections; a plain indoor paper stage; two small back-view listeners.
Mood: majestic and focused.
Scale and framing: violin soloist, conductor and every musician are small, complete figures seen from behind or strict side profile, each about one quarter of image height and never more than one third. Each profile has one clear small eye and eyebrow. Children are fully visible head-to-shoes at far right, also about one quarter of image height. Keep all heads, bodies, instruments and feet inside the image with generous margins. No close-up faces, no large instruments disproportionate to the small players. Maintain clear, realistic violin structure and bow position; orchestra members are small enough to remain part of the stage rather than portraits.
Layered hand-cut paper art only, crisp cut edges and soft shadows, same fixed palette. No text, letters, numbers, pseudo-writing, watermark, logo or seals.
```

**第 1 次定向微调提示词：**

```text
Edit this panoramic paper-cut concert-hall image while preserving the indoor stage, clear orchestral instrument families, music stands, violin soloist, conductor, children, and soft patterned acoustic wall. Correct human scale and orientation: shrink every person, including both children, the solo violinist, conductor and orchestra players, so each full figure occupies about one quarter of image height and never more than one third. On a 640-pixel canvas, aim for 135–160 pixels per person; the current children and soloist are much too large. Every figure must be complete from head to feet within the image, with a margin from every edge, and should remain visually secondary to the concert hall. Children are fully visible back views at the far right, about 150 pixels tall. The adult violin soloist is a small strict side profile, about 150 pixels tall, with one clear eye and eyebrow, holding a correctly proportioned four-string violin under the chin and bowing it. The conductor is back view, about 140 pixels tall. All orchestra adults are smaller full figures, each seen from behind or strict side profile only, with a visible eye and eyebrow whenever a profile is shown. Keep people spaced and recognizable; do not make large faces. Keep the detailed stage within the right two-thirds and preserve the quiet but patterned left title area. Maintain crisp layered-paper edges, soft shadows and the same palette. Landscape 5:2; no text, letters, numbers, pseudo-writing, watermarks, logos or seals.
```

**模板第 5 节逐条自检：**
1) 室内舞台、墙面和人物为剪纸；2) 参考色盘一致；3) 无文字/水印/标识；4) 独奏者约 24%、指挥约 27%、孩子约 24%、乐手约 19%，全身完整；soloist/child 原图裁脸已查，侧脸眼眉清楚；5) 小提琴、弓、弦轴结构清楚，交响乐队分弦/木管/铜管/打击乐；裁片 `work/faces/pep-g8s2-u3-violin.png` 已看；6) 左声学墙弧纹柔和但不空，平涂约 0–5%；7) 内容对应 p.31、45。

## pep-g8s2-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- 来源页：单元首页 p.49；歌剧 p.50–57；《天鹅湖》p.59；戏曲 p.64–68。旧图 1600×640、117,350 B；新图 1600×640、170,540 B；原始出图 1983×793；2 轮。成人约 32–33%，儿童约 23%，全身入框。

**首轮生成提示词（固定风格段 + 以下段落）：**

```text
Format: wide panoramic 5:2 chapter-header illustration, deliver 1600x640. Create a theatre-stage panorama with three distinct small performance areas across the right two-thirds. The left title third stays calm but has soft visible layers: gentle cream/pale-blue theatre-wall paper grain, one pale curtain fold and low-contrast carpet bands; it must not be empty or flat. Rich professional picture-book detail, with a different arrangement from the river and concert-hall scenes.
Scene: one broad Chinese theatre proscenium stage with a plain cream and pale-blue paper backdrop and no landscape scenery. On the right two-thirds, three connected mini tableaux: one lyrical opera singer beneath a curtain fold, a paired ballet dance evoking Swan Lake, and one Chinese-opera performer making a graceful flowing-sleeve gesture. Two small primary-school children watch from the far right. The stage floor, soft curtain and layered paper backdrop connect the three areas. Keep left third quiet and softly decorated, without an additional focal object.
Must include: one opera singer; two ballet performers in a paired Swan-Lake-inspired pose; one Chinese-opera performer with a clear flowing sleeve gesture; two small child viewers; three distinct small stage areas.
Mood: dramatic yet graceful.
Scale and framing: all six people (four adult performers and two children) are complete from head to feet, fully inside the frame and separated enough to read. Each figure is about one quarter of image height and never more than one third. Performers are seen from behind or strict side profile; every visible profile has one clear small eye and eyebrow. Children are back views at far right. No frontal faces, close-up faces, cropped bodies or oversized performers. Place each tableau in its own small paper-stage niche while keeping the whole composition varied and coherent.
Use the exact layered Chinese paper-cut style and palette in the fixed style, with crisp hand-cut edges, visible card layers and gentle shadows. No text, letters, numbers, pseudo-writing, watermark, logos or seals.
```

**第 1 次定向微调提示词：**

```text
Edit the supplied wide paper-cut theatre panorama. Preserve its three differentiated stage niches: opera, Swan-Lake-inspired paired ballet, and Chinese opera with flowing sleeve; preserve the red proscenium, soft paper wall and audience children. Correct all people, which are far too large. Shrink all four adult performers and both child viewers to miniature stage figures about one quarter of the 640-pixel image height (target 135–160 pixels each, maximum 210 pixels). Keep each figure fully visible head-to-feet, with margin from every frame edge and with clear space around the full body; no large faces, no cropped bodies. Show the opera singer in strict side profile, one visible eye and eyebrow. Show the ballet pair in side/back profile only, one dancer in side profile with a clear eye and eyebrow and the partner from behind. Show the Chinese-opera performer in strict side profile with one clear eye and eyebrow, raising a recognizable long water sleeve. Show the two child viewers fully from behind at far right, small and not cut by the lower or right edge. Maintain exactly these six figures. Keep the three tableaux varied and readable within their niches, now with more surrounding stage paper visible. Keep the left title area gently textured and filled, not empty. Same layered Chinese paper-cut style, crisp edges and palette, panoramic 5:2. No text, letters, numbers, pseudo-writing, logos, watermarks or seals.
```

**模板第 5 节逐条自检：**
1) 幕布、舞台与人物呈纸层剪艺；2) 配色与参考协调；3) 无文字/水印/印章；4) 成人约 32–33%，儿童约 23%，完整全身；歌剧、芭蕾、戏曲演员三张原图侧脸裁片已查，眼睛和眉毛清楚；5) 不突出额外乐器；6) 左标题区有墙面、花纹、幕布层，平涂约 0–5%；7) 歌剧、天鹅湖芭蕾、戏曲分别匹配 p.50–57、59、64–68。

## pep-g9s1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- **依据：**封面：目录 p.5；《音乐与数字》主题 p.2；笛子与电子音乐 p.4；音乐工程 p.5–8。
- **文件与人物测量：**旧图 1200×750，86,902 B；新图 1200×750，139,124 B；原始出图 1586×992；3 轮。吹笛孩子约 23–25%；电脑旁孩子约 23–25%，全身完整；吹笛者背影，电脑旁侧脸有眼睛。
- **七项复核：**纸层录音室与声学墙符合风格；无可读文字/水印；横笛横持、笛孔位置可辨；声学板/桌脚/电缆层填充左下标题区；画面对应数字音乐与笛子；裁切、变形检查通过。
- **原图大小局部检查：**`work/faces/pep-g9s1-girl-profile.png`、`work/faces/pep-g9s1-dizi.png`，按原图大小裁片已检查。

**首轮场景提示词（与上方固定风格段合用）：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.

Format: book cover illustration, landscape 8:5, final 1200x750. View a quiet school digital-music studio from a gentle high diagonal, with one unmistakable focal relationship between a dizi player and a laptop. Place the people and desk in the upper-right and center-right; make the lower-left title zone soft but filled with pale acoustic wall panels, layered desk-edge paper shapes and two thin paper cable loops, never a large flat blank area. Rich professional picture-book detail.
Scene: Arrange a digital music studio on a diagonal desk seen from above: one child plays a Chinese transverse bamboo dizi beside a second child at a laptop with four coloured blank audio lanes merging into one paper sound ribbon. Acoustic wall panels and paper cable shapes fill the room, with the cable loops and panel seams also providing restrained texture in the lower-left title zone.
Must include: one correctly held six-hole Chinese transverse dizi; one blank laptop screen with exactly four coloured audio lanes and no writing; one unified sound ribbon; two small children working together.
Mood: inventive and forward-looking.
Scale and framing: the two school-age children are fully visible from head to feet, including legs and shoes, within the frame; each is about 22–25% of image height and never more than one third. Their full figures are roughly 220–245 pixels tall in a 992-pixel raw image. One child is seen from behind holding the dizi horizontally to the lips; the other is in strict side profile at the laptop with one clear small eye and eyebrow. No close-up, frontal face or cropped body. Keep the left-bottom title zone gently layered and soft but not empty.
Layered handmade paper cutout only; crisp paper edges, visible fibres and soft shadows in the fixed style and palette. No extra instruments, props, posters, icons, scenery, text, letters, numbers, pseudo-writing, watermarks, logos or seals.
```
**第 1 轮定向修改提示词：**

```text
Edit the supplied paper-cut digital-music cover and preserve its diagonal studio desk, blank laptop with exactly four coloured audio lanes merging into one ribbon, six-hole transverse dizi, acoustic panels, plant and cable loops. The two children are much too large: shrink both complete people to about one quarter of the full image height, roughly 230–250 pixels on a 992-pixel raw image, never above one third. Keep each child's full body, legs and shoes visible and fully inside the frame, with generous margin at all edges. The dizi player remains a back view and holds the flute horizontally to the lips. The laptop user remains a strict side profile with one clear small eye and eyebrow. Do not turn either child into a close-up portrait. Keep the left-bottom title zone filled with subtle acoustic panels and cable lines, and retain the overall room arrangement and paper layers. No new figures or props, no text or writing, no extra instrument, no watermark or logo.
```
**第 2 轮定向修改提示词：**

```text
Edit only the two children in the supplied digital-music cover, reducing each full-body figure by about one quarter so each is approximately 23–26% of the entire 992-pixel raw image height (about 230–255 pixels), comfortably below one third. Keep both figures complete, with head, legs and shoes visible and generous margins from all edges. The dizi player stays a back view holding the transverse flute horizontally; the seated laptop user stays a strict side profile with one clear eye and eyebrow. Preserve the diagonal studio desk, laptop with exactly four coloured blank audio lanes merging into one ribbon, acoustic panels, flower plant, paper cables and all colors/details unchanged. Keep the title area soft and filled, and do not introduce close-ups, new figures, text or props.
```

## pep-g9s1-u1.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- **依据：**目录 p.5；《音乐与数字》主题 p.2；笛子与电子音乐 p.4；音乐工程 p.5–8。
- **文件与人物测量：**旧图 1600×640，75,814 B；新图 1600×640，115,678 B；原始出图 1983×793；4 轮。两名孩子约 27–28%，全身完整；一人侧影有清晰眼睛/眉毛，另一人背影。
- **七项复核：**电子音乐工作室纸层风格与色盘一致；无可读文字/水印；笛子横持与孔位正确；声学墙、桌脚和线缆铺满左标题区且低对比；主题匹配数字音乐；画面无压字、裁切和拉伸。
- **原图大小局部检查：**`work/faces/pep-g9s1-u1-player.png`、`work/faces/pep-g9s1-u1-dizi.png`，按原图大小裁片已检查。

**首轮场景提示词（与上方固定风格段合用）：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.

Format: wide chapter-header illustration, panoramic 5:2, final delivery 1600x640. Keep all meaningful subjects in the right two-thirds. Fill the left third softly with pale-blue and cream layered acoustic panels, wall seams and a few thin cable loops; the title area stays low-contrast but never blank. Use an eye-level diagonal composition distinct from the book-cover overhead view.
Scene: Build a diagonal digital studio with one small dizi player in the right-side foreground and a blank laptop beyond; four blank coloured audio lanes merge into one paper sound ribbon continuing across acoustic panels, desk legs and neat cable loops. A second child works at the laptop. Put the two children and desk in a small complete room environment; no extra instruments, posters or scenery.
Must include: one correctly held Chinese transverse dizi with six visible finger holes; one laptop; four coloured blank audio lanes; one unified ribbon; acoustic panels and cable loops.
Mood: inventive and focused.

Scale and framing: exactly two school-age children, each a complete full-body figure about 22–25% of the 793-pixel raw image height (roughly 175–200 pixels), never more than one third. Show all of each child, including legs and shoes, inside the frame with generous margins. The flute player is a strict side profile with one clear eye and eyebrow, holding the dizi horizontally at the lips; the laptop user is seen from behind. No close-up faces, frontal views or cropped bodies. Keep the people small within the room, not portraits, and keep the left title zone softly detailed and unempty.
Layered handmade paper-cut illustration only, crisp coloured-card edges, visible paper fibre and soft shadows, exact palette from the fixed style. Laptop contains only simple coloured lanes, no readable marks. No text, letters, numbers, pseudo-writing, watermarks, logos or seals.
```
**第 1 轮定向修改提示词：**

```text
Edit the supplied layered-paper digital studio and retain its distinctive diagonal desk, wall acoustic panels, cable loops, laptop, dizi, four blank audio lanes and connecting ribbon. The two children are far too large. Shrink each person to about 22–25% of the full image height, roughly 175–200 pixels on the 793-pixel raw image, and never more than one third. They should be small figures within the studio, not foreground portraits. Keep both complete from head through shoes, entirely inside the frame with ample margins. Preserve the flutist as a strict side profile with one clear eye and eyebrow, holding the six-hole dizi horizontally to the lips; preserve the laptop user as a back view, seated fully visible with legs and shoes. Do not add people, do not crop bodies, and do not enlarge any instrument. Preserve all room structure and the paper-cut look; keep left title panels soft and layered, not blank. No text, letters, numbers, pseudo-writing, logo, watermark or seals.
```
**第 2 轮定向修改提示词：**

```text
Edit only the two human figures in the supplied studio image; keep the desk, laptop, acoustic panels, cables, dizi and ribbon exactly unchanged. Both children are still too tall at about 40% of image height. Shrink each whole person to about 23–26% of the full 793-pixel raw image height, approximately 185–205 pixels, or about 60% of their current size. They must remain small figures within the room, never more than one third of image height. Keep both complete head-to-shoes with clear space around them, no body cropping. Preserve the dizi player as a strict side profile with a clear eye and eyebrow and preserve the laptop user as a back view. Do not modify the instruments or add any new objects or writing.
```
**第 3 轮定向修改提示词：**

```text
Edit only the two children in this studio image. Reduce each one a little (about 15–20%) so both full figures are about 23–26% of the image height, approximately 185–205 pixels on the 793-pixel raw image; never more than one third. Keep them full-body with clear head, torso, legs and shoes, inside the frame. Preserve the player’s strict side profile and visible eye/eyebrow, the seated laptop child’s back view, their positions relative to the desk, the dizi, laptop with four blank audio lanes, ribbon, acoustic panels and all room elements exactly. Do not crop or enlarge any figure, do not add text, props or people.
```

## pep-g9s1-u2.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- **依据：**单元旅行 p.12–15；爱迪生圆筒留声机；音乐旅伴 p.16–17。
- **文件与人物测量：**旧图 1600×640，87,022 B；新图 1600×640，182,828 B；原始出图 1983×793；2 轮。右侧两名听众约 25%，全身完整；女孩背影、男孩侧影有眼睛/眉毛。
- **七项复核：**留声机房间使用统一纸层与色盘；无可读文字/水印；圆筒、唱针臂与喇叭口结构清楚，乐谱只保留无字线条；左侧用窗、书架和声波曲线铺陈；主题匹配音乐传播旅程；未见裁切/压字/变形。
- **原图大小局部检查：**`work/faces/pep-g9s1-u2-listeners.png`、`work/faces/pep-g9s1-u2-phonograph.png`，按原图大小裁片已检查。

**首轮场景提示词（与上方固定风格段合用）：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.

Format: wide chapter-header illustration, panoramic 5:2, final 1600x640. Keep all meaningful objects and listeners in the right two-thirds. The left title third is quiet but filled with softly layered pale-blue/cream wall paper, window-frame outlines, faint shelf edges and floor seams; no broad blank plane and no readable book spines. Rich scene detail and a different room composition from the digital studios.
Scene: Place a correctly built Edison cylinder phonograph on a detailed study desk, with its horizontal cylinder and broad recording horn shown clearly in side profile beside an open notation-only score. Paper sound ripples travel through a listening-room window and past simple shelves with blank book spines. Two small children listen together from behind or in side profile on the far right. The left third has subtle wall, window and shelf layers, not an empty field.
Must include: one early cylinder phonograph with a visible cylinder, stylus arm and recording horn; one open score with only music-note marks and no words; two small listening children; paper sound ripples; listening-room window and shelves.
Mood: historical and curious.

Scale and framing: exactly two school-age listeners, each fully visible head-to-shoes and about 22–25% of image height (roughly 175–200 pixels in the 793-pixel raw image), never over one third. Keep both complete within frame margins and small in the room. Show at least one back view; any visible profile is strict side view with a clear small eye and eyebrow. No close-up faces or cropped bodies. Keep the phonograph naturally proportioned to the desk, with clear mechanical parts; all human figures remain secondary to the room and device.
Use only the exact layered paper-cut art and palette in the fixed style, crisp hand-cut edges and gentle shadows. No other instruments, text, letters, numbers, pseudo-writing, watermark, logo or seals.
```
**第 1 轮定向修改提示词：**

```text
Edit the supplied paper-cut phonograph listening-room scene, preserving the Edison cylinder phonograph, visible recording horn and cylinder, open score with music notes only, desk, shelves, window, distant landscape, sound ribbon and room textures. The two children are much too large. Shrink both people to about one quarter of image height, around 180–200 pixels tall in the 793-pixel raw image, never more than one third. Place them together at the far right as small listeners, both complete head-to-shoes and fully inside the frame with margin from the lower and right edges. Keep the girl as a back view; change the boy to a strict side profile with one clear small eye and eyebrow. No three-quarter or frontal face, no close-up. Keep the phonograph at natural scale and preserve its cylinder, stylus arm and horn. Do not add or remove objects or people. Maintain the quiet but filled layered-paper title area on the left; no text, letters, numbers, pseudo-writing, logos or watermark.
```

## pep-g9s1-u3.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- **依据：**审美主题 p.24–27；莫扎特钢琴协奏曲 p.28；《青藏高原》p.29。
- **文件与人物测量：**旧图 1600×640，97,110 B；新图 1600×640，143,826 B；原始出图 1983×793；2 轮。钢琴演奏者约 23%、歌者约 27%、三名听众约 28%，全身完整；可见成人侧脸均有眼/眉，儿童背影。
- **七项复核：**音乐厅与高原纸层风格/色盘统一；无可读文字/水印；三角钢琴弧形琴身、开启琴盖、三脚及键盘可辨；左标题区以声学墙、帘幕与座椅轻柔铺满；同时呈现协奏曲演出与高原联想；人物、琴身不裁切或变形。
- **原图大小局部检查：**`work/faces/pep-g9s1-u3-grand-piano.png`及演奏者/歌者裁片，按原图大小已检查。

**首轮场景提示词（与上方固定风格段合用）：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.

Format: wide chapter-header illustration, panoramic 5:2, final 1600x640. A compact school auditorium with all main stage content in the right two-thirds. Fill the left title third softly with layered empty auditorium seats, curtain folds and acoustic wall panels; keep it calm but not blank. Make this a distinct performance-stage composition, not a digital studio or a phonograph room.
Scene: Set a piano concerto on a compact school-auditorium stage, with one correctly shaped grand piano and a small adult pianist on one side, and one singer on the other. Layered audience seats, a plain theatre curtain and acoustic panels fill the room behind three listening children. Add a restrained low mountain-plateau silhouette as a flat paper stage backdrop to connect the singer to Qinghai-Tibet Plateau; keep all scenery in the right two-thirds. Two gentle paper sound ribbons, one from piano and one from singer, meet above the stage.
Must include: one grand piano with curved body, exactly three legs, visible keyboard and raised lid; one seated pianist; one adult singer; a low layered mountain-plateau silhouette; three children listening from behind; stage seats, curtain and acoustic wall panels.
Mood: thoughtful and attentive.

Scale and framing: the pianist, singer and all three children are full figures visible head-to-shoes, each about one quarter of the image height (roughly 175–200 pixels on a 793-pixel raw image), never above one third. Keep each person entirely inside the frame and small within the hall. The pianist is seen from behind or strict side profile while seated, with legs and shoes visible; the singer is in strict profile with one clear small eye and eyebrow; the three child listeners are complete back views with heads, legs and shoes visible. No close-up, frontal faces or cropped bodies. Keep the piano naturally proportioned, with the keyboard and three legs clearly visible.
Use exact layered handmade Chinese paper-cut style, visible card layers, crisp edges, gentle shadows and fixed palette. No text, letters, numbers, pseudo-writing, sheet text, watermark, logo, seals or extra instruments.
```
**第 1 轮定向修改提示词：**

```text
Edit the supplied school-auditorium paper-cut scene and preserve the grand piano, pianist, singer, three child listeners, mountain plateau silhouette, curtains, acoustic wall panels, stage and rows of auditorium seats. All five people are too large. Reduce every person to about one quarter of the image height, roughly 175–195 pixels on the 793-pixel raw canvas, never above one third. The pianist and singer must be full small figures with heads, torsos, legs and shoes visible; the pianist may be seated but the piano bench and body must not hide the legs or shoes. The singer remains a strict side profile with one clear eye and eyebrow; the pianist a back or side view with a visible eye if profile. Make the three children small complete back-view listeners, seated on low-backed chairs whose backs stay below their shoulders, with heads, torsos, legs and shoes visible. Keep all people inside frame margins, no close-ups or cropped bodies. Preserve the piano at natural scale with its curved body, three legs, visible keyboard and open lid. Keep the left title zone softly filled by acoustic wall, curtain folds and seats. Do not add people, text, letters, pseudo-writing or instruments.
```

## pep-g9s1-u4.webp

- 重画：T143（2026-11-20/21），Codex 内置 image_gen；Claude 验收通过（T143 review1–4）。以下为 Codex 报告中本图的记录与提示词，原样照录；固定风格段、规格段见本文件开头的 2026-11-20 修订版。


- **依据：**单元首页 p.33；策划 p.34–37；创作/演出 p.38–43；宣传与回顾 p.44。
- **文件与人物测量：**旧图 1600×640，71,338 B；新图 1600×640，131,792 B；原始出图 1983×793；3 轮。三名学生约 28%，全身完整；侧影或背影，协助者侧脸眼睛/眉毛可见。
- **七项复核：**后台与舞台场景统一纸层剪纸及参考色盘；无可读文字/水印；本图无须突出乐器；左区有吊杆、箱体、空白桌面及展板层次，非大面积空白；明确表现策划、排演、复盘；人物和物体无裁切、压字、变形。
- **原图大小局部检查：**`work/faces/pep-g9s1-u4-helper.png`与表演者裁片，按原图大小已检查。

**首轮场景提示词（与上方固定风格段合用）：**

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene: each person at most one third of the picture height, part of the landscape rather than a portrait; adults such as teachers or parents also seen from behind or in profile; every visible profile or three-quarter face shows one clear small dark eye and an eyebrow, never a blank face; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.

Format: panoramic 5:2 chapter-header illustration, final 1600x640. Show a side-on backstage cross-section with a readable left-to-right rehearsal sequence in the right two-thirds. Keep the left title third calm but visibly filled with soft cream/blue paper wall texture, stage-plank seams and faint rigging lines, never blank or flat. Make this a distinct theatre-workshop image.
Scene: Show a school musical rehearsal as a backstage cross-section: one student plans with blank cards at a small prop table, two student performers rehearse beside a plain red curtain, then the helper checks a simple blank prop on the table. Exposed paper stage planks and theatre rigging fill the room; keep the wall and curtain simple, with no scenic landscape.
Must include: blank planning cards; two student performers; one student helper; a plain curtain; one simple blank prop table; visible stage planks and theatre rigging.
Mood: collaborative and lively.

Scale and framing: exactly three school-age children, each full body and completely inside frame, about one quarter of image height (roughly 175–200 pixels on the 793-pixel raw image) and never more than one third. Place figures in the right two-thirds with generous margins; all heads, torsos, legs and shoes must be visible. The two performers are seen from behind or strict side profile; any visible side face has one clear small eye and eyebrow. The helper is a strict side profile with a clear eye and eyebrow. No close-up faces, frontal views or cropped bodies. Blank cards and prop contain no writing or symbols.
Use the exact layered handmade paper-cut style and fixed palette, crisp paper edges, visible fibres and soft shadows. No instruments, signs, text, letters, numbers, pseudo-writing, watermark, logo or seals.
```
**第 1 轮定向修改提示词：**

```text
Edit the supplied school-musical backstage cross-section while preserving the red curtain, stage planks, rigging, blank planning cards and simple prop table. Correct the figure count and scale: show exactly three students total—two student performers by the curtain and one helper at the prop table. Remove the extra seated planner at the far left; the single helper at the table should hold or review one blank planning card, combining the planning and prop-review role. Shrink all three complete students to about one quarter of image height (roughly 175–195 pixels on the 793-pixel raw image), never more than one third. Keep each full body from head to shoes entirely in the frame with clear margins. The two performers are in back or strict side views; the helper is in a strict side profile with one clear eye and eyebrow. No frontal faces, close-ups or cropped bodies. Preserve the stage cross-section and empty but detailed left area with boxes, wall panels and rigging. All cards and props stay blank and have no writing. Do not add any new person, instrument, sign, scenic landscape, text, numbers, pseudo-writing or logo.
```
**第 2 轮定向修改提示词：**

```text
Edit only the three students in this paper-cut backstage image. Reduce each full figure by about one quarter to a height of roughly 185–200 pixels on the 793-pixel raw canvas, about 23–25% of image height and clearly below one third. Keep all three complete head-to-shoes with margin from every frame edge. Preserve exactly two student performers beside the curtain and one side-profile helper at the table holding a blank planning card. Keep the visible eye and eyebrow on the helper profile; the other two remain side/back views. Retain the curtain, blank planning cards, simple prop table, rigging, stage planks, boxes and left title area unchanged. No other people, no cropped bodies, no large faces and no writing.
```

## home-sprouts.webp

- 册别/单元：芽谱首页背景（首页视觉，不属教材册别/单元）
- 教材依据：用户指定的首页主题：种子发芽、音符生长；非教材页码依据。
- 生成日期与工具：2026-10-16，Codex 内置 image_gen。
- 重画次数与原因：重画 0 次。
- 第 5 节自检：1 通过（种子、叶片、音带和人物均为可见纸层）；2 通过（淡雅奶油底色与人教版纸艺配色协调）；3 通过（无文字、数字、伪文字、印章或 logo）；4 通过（两名儿童在画面边缘，未作脸部特写）；5 不适用（无乐器）；6 通过（中央 45% 保持干净，供首页标题排版）；7 通过（画面仅呈现用户指定的发芽和音符生长主题）。

### 完整提示词（终稿）

```text
Style: layered paper-cut art — a real handmade paper sculpture photographed in soft, even daylight. EVERYTHING in the scene is cut paper, including sky, clouds, mountains, water, trees, rocks and people: many stacked layers of coloured card with crisp hand-cut edges, gentle cast shadows between layers, visible paper-fibre texture. Delicate Chinese window-flower (chuanghua) cut-out patterns inside clouds, sun, leaves, feathers and decorative ribbons. Musical notes and sound are shown as flowing cut-paper ribbons with small cut-out notes.
Palette: vermilion #E4573D, warm yellow #F2C14E, sky blue #8EC5E6, fresh greens #4FA66A and #2E8B57, deep teal #1F6E78, cream #FFF6E5. Bright, contemporary, joyful, warm; not retro, not woodblock, not ink-wash.
People: two or three Chinese primary-school children, seen from behind or in profile, simple everyday clothes, small in the scene; no close-up faces.
Instruments must be drawn with correct real-world structure (string count, body shape, how it is held).
Never: text, letters, numbers, pseudo-writing, watermark, logo, seal stamps, the textbook's cartoon characters (麦芽, 谷风, 麒麒, 小九, 伶伦), cartoon mascots, emoji, clip art, 3D CGI render, photorealistic people, glossy plastic, neon, glow effects, lens flare, bokeh, sci-fi, network lines, woodblock print, ink-wash painting.

Format: wide homepage background, landscape 8:3, deliver at 1800x675. Keep the central 45 percent clean pale cream paper with no objects, notes or ribbons for the page title; place delicate details near the outer edges and lower corners. Rich detail, professional picture-book quality.

Scene: a calm, airy pale-cream paper field where tiny seeds at the lower outer corners sprout into fresh green shoots; musical notes emerge as small cut-paper leaves along gentle sound ribbons growing upward only along the far left and right edges, leaving the central title area uninterrupted; two tiny children seen from behind quietly watch from the bottom corners.
Must include: several seeds visibly sprouting, cut-paper leaves shaped like musical notes, two small children in profile or from behind at the outer bottom edges; no instruments, text or extra scenery.
Mood: gentle spring awakening.
```

