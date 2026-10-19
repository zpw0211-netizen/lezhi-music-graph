# SOURCES — 人音版上课模式插画样图

生成日期：2026-10-19  
工具：Codex 内置 image_gen。人音版单元插图仅作风格参考。最终 PNG 等比缩放至 1600×900，以 WebP quality=85、method=6 导出。

## stage-motivate.webp

- 风格参考：E:/Projects/music-graph-site/public/art/units/g7s1-u1.webp
- 初始 PNG：E:/codex-state/codex-home/generated_images/01a14fcb-723e-7362-b669-fd64df9b1f96/exec-a978e94b-f5f7-46bd-88a4-45d257039d5e.png
- 最终 PNG：E:/codex-state/codex-home/generated_images/01a14fcb-723e-7362-b669-fd64df9b1f96/exec-84a8edba-51e7-4e39-b891-9f3786f8350e.png
- 生成方式：内置 image_gen 生成，再以同一工具收拢右侧主体构图。

### 初始生成提示词

~~~text
Use case: illustration-story
Asset type: one reusable 16:9 classroom slide illustration for the Renyin music edition
Input image: Image 1 is a style reference only: match its restrained vintage woodblock / linocut print texture, cream paper, earthy ochre, brick red, and deep green; do not reproduce its flag, instruments, field, or scene.
Primary request: children are captivated by music, listening closely with curious, bright eyes.
Scene/backdrop: warm pale paper like #FAF7EE, with only a faint, minimal suggestion of a music classroom at the far right; soft natural fade into blank paper at the left.
Subject: three Chinese primary-school children in simple everyday clothes, shown in profile in a small group on the right; one leans an ear toward the sound, the others listen with curious bright expressions. A few restrained abstract curved sound marks may drift near them, purely decorative, not musical notation.
Style/medium: match the attached Renyin unit illustration reference: nostalgic childhood picture-book woodblock / linocut, hand-printed grain, slightly imperfect carved edges, flat earthy colors, warm cream paper.
Composition/framing: exact 16:9 landscape, designed for 1600x900. Keep all children and visual details within the rightmost 40% of the frame (x=60%-100%). Keep the entire left 60% clean, nearly uniform pale cream paper with only subtle paper grain; no objects, figures, marks, borders, or shadows intruding into it. Small, coherent illustration with generous paper around it.
Lighting/mood: gentle, curious, warm.
Color palette: cream #FAF7EE, muted brick red, ochre, deep forest green, restrained sage; no saturated modern colors.
Materials/textures: visible paper fibers and carved woodblock grain, soft worn ink edges.
Text (verbatim): none.
Constraints: no text, letters, digits, labels, logos, watermark, real musical notation or noteheads; no photographic realism, 3D, glossy surfaces, modern cartoon rendering, or decorative frame.
~~~

### 最终构图修整提示词

~~~text
Recompose the attached Renyin woodblock illustration for a 16:9 slide while preserving its nostalgic hand-printed texture, the same three listening children, their expressions and clothes, and the warm cream / muted red / ochre / forest-green palette. Make the full illustrated cluster compact and place it within the far-right 40% only (x=60%-100%): reduce the cluster width slightly and move it right as needed. The full left 60% must be clear, nearly uniform warm cream paper (#FAF7EE), with faint grain only. Keep all three children visible and do not add props or details. No text, lettering, numbers, logos, watermark, or actual musical notation.
~~~

## stage-construct.webp

- 风格参考：E:/Projects/music-graph-site/public/art/units/g7s1-u1.webp
- 最终 PNG：E:/codex-state/codex-home/generated_images/01a14fcb-723e-7362-b669-fd64df9b1f96/exec-affeae30-c89d-44e7-b469-8802fe2eaecb.png
- 生成方式：内置 image_gen 单次生成；四名孩子围坐交流，配空白纸页与手鼓，不含乐谱记号。

### 提示词

~~~text
Use case: illustration-story
Asset type: reusable 16:9 classroom slide illustration for the Renyin music edition
Input image: Image 1 is only a style reference for the warm vintage woodblock / linocut print texture and earthy palette. Do not imitate its layout or its objects.
Primary request: four children collaboratively explore music, share ideas, and listen to one another.
Scene/backdrop: mostly plain warm cream paper (#FAF7EE). A tiny suggestion of a music classroom may appear only directly behind the children on the far right. No continuous floor, landscape, wall, or decorative marks extending leftward.
Subject: exactly four Chinese primary-school children in simple everyday clothes, sitting close together in a small circle. One points at a completely blank sheet of paper, one holds a small hand drum, and two listen thoughtfully. Small figures, shown in profile or three-quarter view, not close-ups.
Style/medium: nostalgic childhood picture-book woodblock / linocut like the reference, grainy hand-printed ink, slightly imperfect carved edges, flat earthy color areas, warm aged cream paper.
Composition/framing: wide 16:9 landscape for 1600x900. HARD LAYOUT: keep every child, instrument, floor patch, shadow, and background detail inside the rightmost 38% of the canvas, beginning no farther left than x=62%. The illustration should be a compact cluster near the right edge, around 32% of canvas width. The entire left 62% must be empty near-uniform #FAF7EE paper with very subtle grain only. Do not let anything enter the left text area. Leave clear margins around the cluster; do not crop any child.
Lighting/mood: warm, thoughtful, collaborative.
Color palette: warm cream #FAF7EE, muted brick red, ochre, deep forest green, restrained sage.
Materials/textures: visible paper fibers, grainy carved print texture, softly irregular hand-printed edges.
Text (verbatim): none.
Constraints: no text, letters, digits, labels, logos, watermark, musical staff, real musical notation, noteheads, close-up faces, photographic realism, 3D, glossy surfaces, modern cartoon rendering, or decorative frame.
~~~

# 第二批：人音版剩余插画（T073，2026-10-19）

## 生成与导出说明

- 生成工具：Codex 内置 image_gen；每张均以已通过的 stage-motivate.webp、stage-construct.webp 为风格和同班人物参考，部分提示词还加入 stage-conflict.webp 作绿色外套男孩参考。
- 生成原始 PNG 保存在本目录 raw/；内置生成器的原始文件留在 Codex generated_images 目录。
- 导出方式：使用 E:/Projects/music-graph-site/node_modules/sharp，将 PNG 等比源画幅缩放至 1600×900，以 WebP quality=85、effort=6 导出。
- contact-sheet.webp 为 2×4 缩略图；stage-transfer 未通过后跳过，因此其格为空，未使用不合格草稿替代。

## stage-conflict.webp

- 生成状态：完成；共 3 次尝试，前两次网络请求失败，第 3 次生成并通过目视检查。
- 原始 PNG：raw/stage-conflict.png；内置生成源文件：E:/codex-state/codex-home/generated_images/01a14ff6-1b6d-7630-96f2-a3a717131aef/exec-ee4a4905-700d-4ad2-abfe-b1831cad5b46.png
- 导出信息：1600×900，133,906 字节；sharp，quality=85，effort=6。
- 自查：1) 尺寸、体积合格；2) 男孩与桌面集中在右侧，桌沿接近 60% 分界，左侧基本为浅色纸面；3) 没有文字、数字、字母、伪文字或真实乐谱，弯曲声纹为抽象装饰；4) 中国小学生、朴素衣着、无品牌或真实人物；5) 浅纸底、边缘柔和，无深色满幅背景；6) 无需乐器验收。
- 提示词：

~~~text
Use case: illustration-story
Asset type: reusable 16:9 classroom slide illustration for the Renyin music edition
Input images: Image 1 and Image 2 are approved style and recurring-classmates references only. Match their warm vintage woodblock print texture, cream paper, earthy palette, and child character design. Do not copy their scenes or composition.
Primary request: one Chinese primary-school child from the same class pauses thoughtfully, chin resting on hand, curious and a little puzzled but eager to understand.
Scene/backdrop: almost uniform warm ivory paper (#FAF7EE), with only a tiny hint of classroom context at the extreme right edge; soft, natural fade around the small illustration.
Subject: a recurring classmate, the Chinese boy with short black hair and a deep forest-green jacket with pale piping, seated at a small desk on the far right. His expression is curious and thoughtful. Beside his head, a few tiny abstract ochre and muted-red curved sound marks suggest a musical question, but they are only hand-painted curves, not punctuation, symbols, letters, or music notation. No other people.
Style/medium: match both attached Renyin references closely: nostalgic childhood picture-book woodblock / linocut, visibly grainy hand-printed ink, slightly imperfect carved edges, flat earthy colors on warm aged cream paper.
Composition/framing: landscape 16:9, intended for 1600x900. Keep the complete child, desk and all marks fully within the RIGHTMOST 40% of the canvas (x=60%-100%), compact cluster near the right edge. Absolutely nothing except extremely subtle paper grain may enter the left 60%; keep it clean and empty warm ivory paper. Do not crop the child.
Lighting/mood: gentle, contemplative, hopeful curiosity.
Color palette: cream #FAF7EE, muted brick red, ochre, deep forest green, restrained sage, warm skin tones; match references.
Materials/textures: tactile paper fibers and carved-print grain, softly irregular worn ink edges.
Text: none.
Constraints: no text, no punctuation, no question-mark glyph, no letters, numbers, labels, logos, watermark, staff, real notes, noteheads, readable marks, writing, extra props, photographic realism, 3D, glossy surfaces, modern cartoon rendering, or frame.
~~~

## stage-transfer.webp

- 生成状态：跳过；共 5 次尝试。第 1、2 次网络发送失败；第 3 次生成但舞台地面越过留白边界；第 4、5 次响应体解码失败。未保留不合格图像，也未生成 PNG/WebP。
- 重画次数：4 次；最后一次提示词如下。
- 自查：1) 无最终文件，尺寸/体积不适用；2) 生成过的草稿地面伸入左侧留白，未通过；3) 未发现可交付最终图，无法验收文字项；4) 草稿人物是同班中国小学生；5) 草稿有浅纸底但构图不合格；6) 手鼓形状正确，但草稿不交付。
- 最后一次尝试提示词：

~~~text
Use case: illustration-story
Asset type: reusable 16:9 slide illustration for the Renyin music edition
Input images: both approved class illustrations are style and recurring-classmate references only. Match the nostalgic woodblock ink texture, cream paper, earthy colors, and same four child designs.
Primary request: four Chinese primary-school classmates perform music happily together on a very small school stage.
Scene/backdrop: almost blank warm ivory paper (#FAF7EE), with a tiny suggestion of a stage curtain only at the far right.
Subject: a compact group of four small full-body classmates near the right edge: boy in forest-green jacket, ponytailed girl in brick-red sweater with red ribbon, boy in mustard shirt, girl in cream blouse and muted-red pinafore. One sings into a plain microphone, one plays a shallow round hand drum, the other two gesture supportively. Preserve the references' childlike faces and simple clothes.
Style/medium: same aged-paper childhood woodblock / linocut print as the references, grainy ink, imperfect carved edges, flat cream, brick red, ochre, forest green and sage.
Composition/framing: 16:9 landscape, 1600x900. The complete illustration cluster must be no wider than 32% of the canvas, placed at the extreme right. Every child, prop, stage edge, floor mark and shadow starts at x=68% or farther right. Absolutely nothing except faint paper grain in the left 62%. No broad ground or stage.
Lighting/mood: warm and confident.
Materials/textures: tactile fibers, worn hand-printed grain.
Text: none.
Constraints: no text, writing, letters, digits, punctuation, labels, logos, watermark, real musical notation, staffs, no cropped people, close-up faces, extra characters, brands, photographic realism, 3D, glossy rendering, modern cartoon style, or frame.
~~~

## stage-summary.webp

- 生成状态：完成；共 2 次尝试。第 1 次桌面延伸进留白区后舍弃；第 2 次通过目视检查。
- 原始 PNG：raw/stage-summary.png；内置生成源文件：E:/codex-state/codex-home/generated_images/01a14ff6-1b6d-7630-96f2-a3a717131aef/exec-bcef2142-479b-4e62-af2f-54380c095fbe.png
- 导出信息：1600×900，121,066 字节；sharp，quality=85，effort=6。
- 自查：1) 尺寸、体积合格；2) 主体集中于右侧约 40%，桌面贴近 60% 分界，左侧基本为浅色纸面；3) 笔记本上只有叶片图形，没有文字、数字、字母或伪文字；4) 中国小学生、朴素衣着、无品牌或真实人物；5) 浅纸底、柔和边缘，无深色满幅背景；6) 无需乐器验收。
- 最终提示词：

~~~text
Use case: illustration-story
Asset type: reusable 16:9 classroom slide illustration for the Renyin music edition
Input images: Images 1 and 2 are approved style and classmate references; Image 3 shows the recurring boy. Match the same warm woodblock print texture, paper, earthy palette, and child designs.
Primary request: the ponytailed red-ribbon girl from the same class quietly reflects beside a small growing sprout and an open notebook.
Scene/backdrop: mostly blank warm ivory paper (#FAF7EE), with no room or wall; paper grain only outside the compact illustration.
Subject: a small full-body / three-quarter view of the recurring Chinese primary-school girl in a muted brick-red sweater and little red ribbon. At a tiny side table next to her is a small potted sprout with a few leaves and a modest open blank notebook. She holds a pencil and draws one simple leaf shape on one page; all pages are otherwise blank and contain no writing. Keep the plant, notebook, pencil, child and all surface texture together.
Style/medium: closely match the approved Renyin samples: nostalgic childhood picture-book woodblock / linocut, grainy hand-printed ink, imperfect carved edges, flat earthy colors on warm cream paper.
Composition/framing: landscape 16:9 for 1600x900. Make the entire compact illustration no wider than 32% of canvas and anchor it at the far right, x=68%-100%. Keep its left edge clean: no tabletop, ground, texture, shadow or object may cross x=65%. No broad desk or floor patch. The entire left 62% is empty ivory paper with subtle grain only.
Lighting/mood: gentle, thoughtful, hopeful.
Color palette: cream #FAF7EE, muted brick red, ochre, deep forest green, restrained sage, warm skin tones.
Materials/textures: paper fibers and worn carved-print grain.
Text: none.
Constraints: no text, writing, pseudo-writing, letters, numbers, punctuation, labels, logos, watermark, musical staff, notes, close-up face, cropped subject, extra people, brands, photographic realism, 3D, glossy surfaces, modern cartoon, or border.
~~~

## group-roles.webp

- 生成状态：完成；共 4 次尝试。前 3 次群组过大或越过留白边界后舍弃；第 4 次通过目视检查。
- 原始 PNG：raw/group-roles.png；内置生成源文件：E:/codex-state/codex-home/generated_images/01a14ff6-1b6d-7630-96f2-a3a717131aef/exec-6a4fc310-1a64-44d6-af17-88573b708973.png
- 导出信息：1600×900，64,100 字节；sharp，quality=85，effort=6。
- 自查：1) 尺寸、体积合格；2) 全组在右侧约 35%，左侧浅纸面干净；3) 无文字伪文字，录音设备屏幕为空白；4) 四名中国小学生衣着朴素，无品牌或真实人物；5) 浅纸底，边缘自然淡出；6) 录音设备为无品牌小型手持录音机，两个麦克风头和矩形机身形状明确，无需乐器验收。
- 最终提示词：

~~~text
Use case: illustration-story
Asset type: reusable 16:9 classroom slide illustration for the Renyin music edition
Input images: Images 1 and 2 are approved style references. Image 3 shows the exact four children and roles to retain. Redraw Image 3 as a much smaller, right-aligned vignette; do not preserve its large scale or leftward placement.
Primary request: the same four classmates, tiny and grouped closely at far right: green-jacket boy singing; red-sweater ponytail girl clapping; mustard-shirt boy holding an unbranded compact recorder with blank display; cream blouse and red pinafore girl raising hand to speak.
Style/medium: match approved warm cream paper, nostalgic woodblock / linocut ink grain, muted brick red, ochre, forest green and sage, imperfect carved edges.
Composition/framing: landscape 16:9. Scale the entire group down to a compact cluster only about 27% of canvas width, and align it so its leftmost edge is at x=72% and its right edge at x=99%. Keep the full group visible. No room, floor, shadow, furniture or lines. Leave x=0%-68% plain warm ivory paper with faint paper grain only.
Mood: warm, collaborative, natural expressions.
Text: none.
Constraints: no text, pseudo-writing, letters, digits, punctuation, labels, logos, watermark, screen interface, musical notation, noteheads, brands, extra characters, close-up faces, cropped body parts, photographic realism, 3D, gloss, modern cartoon look, or border.
~~~

## wonder-wall.webp

- 生成状态：完成；1 次生成，通过目视检查。
- 原始 PNG：raw/wonder-wall.png；内置生成源文件：E:/codex-state/codex-home/generated_images/01a14ff6-1b6d-7630-96f2-a3a717131aef/exec-531c4380-6561-46c4-ac68-727ea556b0da.png
- 导出信息：1600×900，107,692 字节；sharp，quality=85，effort=6。
- 自查：1) 尺寸、体积合格；2) 人物和软木板位于右侧约 40%，左侧留白干净；3) 便签完全空白，没有文字、字母、数字或伪文字；4) 中国小学生、朴素衣着、无品牌或真实人物；5) 浅纸底、边缘自然淡出；6) 无乐器。
- 提示词：

~~~text
Use case: illustration-story
Asset type: reusable 16:9 classroom slide illustration for the Renyin music edition
Input images: Images 1 and 2 are approved style and classmate references; Image 3 shows the recurring green-jacket boy. Match the same aged-paper woodblock style, palette, and classmate designs.
Primary request: one classmate stands on tiptoe to add a blank sticky note to a small classroom wonder wall.
Scene/backdrop: almost blank warm ivory paper (#FAF7EE), no full classroom, only a compact corkboard vignette at the far right.
Subject: the recurring ponytailed girl in muted brick-red sweater with a small red ribbon stretches up on tiptoe to place one small blank pale-ochre sticky note on a compact corkboard. The board already has several small blank notes in muted cream, ochre, brick red and sage, all completely empty with no marks. Her face is curious and engaged. Same age and clothes as references.
Style/medium: same nostalgic childhood picture-book woodblock / linocut as approved Renyin samples, grainy hand-printed ink, imperfect carved edges, flat earthy colors on warm paper.
Composition/framing: landscape 16:9 for 1600x900. Keep the complete child, board, all notes and tiny shadow entirely within x=65%-100%, cluster no wider than 35%. The left 60% must be empty warm ivory paper with faint grain only. No floor patch or marks extending left.
Lighting/mood: warm, curious, encouraging.
Color palette: cream #FAF7EE, muted brick red, ochre, forest green, restrained sage.
Materials/textures: visible paper fibers and worn carved-print grain, soft edges.
Text: none.
Constraints: every note is blank. No text, pseudo-writing, letters, digits, punctuation, diagrams, logos, watermark, brands, clothing symbols, no floor stripe, extra people, cropped limbs, close-up face, photographic realism, 3D, glossy surfaces, modern cartoon look, or frame.
~~~

## homework.webp

- 生成状态：完成；共 2 次尝试。第 1 次桌面进入左侧留白后舍弃；第 2 次通过目视检查。
- 原始 PNG：raw/homework.png；内置生成源文件：E:/codex-state/codex-home/generated_images/01a14ff6-1b6d-7630-96f2-a3a717131aef/exec-205249bc-6a3c-49fa-b9e6-cef231eadb93.png
- 导出信息：1600×900，93,288 字节；sharp，quality=85，effort=6。
- 自查：1) 尺寸、体积合格；2) 孩子、手机和桌面集中在右侧约 40%，左侧留白干净；3) 手机屏幕与笔记本均空白，无文字、字母、数字或伪文字；4) 中国小学生，朴素衣着，无品牌或真实人物；5) 浅纸底、淡化边缘；6) 无乐器。
- 最终提示词：

~~~text
Use case: illustration-story
Asset type: reusable 16:9 home-practice slide illustration for the Renyin music edition
Input images: Images 1 and 2 are approved style/classmate references. Image 3 shows the correct home-practice scene but is too large and extends too far left; redraw the same boy, phone, and blank notebook as a small right-aligned vignette.
Primary request: the recurring Chinese primary-school boy practices singing at home while recording himself.
Subject: same short-haired boy in the deep forest-green jacket from the references, singing gently with one hand near his chest. Include one small narrow side table at his right with an unbranded phone on a stand (plain blank dark screen) and an open notebook with entirely blank pages. Hint at home with only a narrow curtain at far right. No extra furniture or floor.
Style/medium: same warm nostalgic Renyin childhood picture-book woodblock / linocut as the approved samples: cream paper, muted brick red, ochre, forest green, grainy hand-printed ink, imperfect carved edges.
Composition/framing: landscape 16:9. Entire child, narrow table, phone, notebook, curtain and all marks form a compact cluster only 30% of canvas width, placed entirely in x=70%-100%. Make the boy small, full or three-quarter body, not a close-up. No table or surface extends left of x=70%. Left 65% must be empty warm ivory paper with faint grain only. No floor plane or shadow.
Lighting/mood: quiet and cozy.
Text: none.
Constraints: no text, pseudo-writing, letters, digits, punctuation, logos, brand, screen interface or icons, no writing on notebook, musical notation or notes, no broad desk, no floor, no extra people, no close-up, no cropped subject, no photorealism, 3D, gloss, modern cartoon style, or frame.
~~~


# 剩余六张通用课件插画（2026-10-19）

生成工具：Codex 内置 image_gen。每张图参照已通过样图的剪纸或版画视觉，按 16:9 课件版式生成。原始 PNG 另存于本目录的 raw/。为保证左侧 60% 留白，使用仓库 sharp 将场景缩入右侧 640px 版心，并在左缘做 100px 渐隐，再以 WebP quality=85、effort=6 导出为 1600×900。以下为实际提交给 image_gen 的完整提示词。

## stage-conflict.webp

- 风格参照：E:/Projects/music-graph-site/public/art/units/g7s1-u1.webp；已通过样图 E:/Projects/.tmp/lesson-art/renyin/stage-motivate.webp、stage-construct.webp
- 原始生成 PNG：E:/codex-state/codex-home/generated_images/01a14fcb-723e-7362-b669-fd64df9b1f96/exec-3f2f7e97-e47a-4185-b58c-289ee0c689bb.png
- 保留 PNG：E:/Projects/.tmp/lesson-art/renyin/raw/stage-conflict.png
- 最终 WebP：E:/Projects/.tmp/lesson-art/renyin/stage-conflict.webp（1600×900，111,230 字节）
- 生成与导出：image_gen 出图后，Sharp 裁取右侧场景、缩放至右侧 640px 版心并渐隐左缘；WebP quality=85、effort=6。
- 重画次数与原因：0 次；一次生成后按版式由 Sharp 收拢并渐隐，内容符合要求。

### 完整提示词（实际提交）

~~~text
Wide 16:9 1600x900 reusable music-class slide illustration in nostalgic Chinese childhood woodblock / linocut picture-book style: hand-printed carved edges, visible ink grain on warm cream paper, flat earthy color shapes in muted brick red, ochre, forest green and sage. At the far right, a compact vignette of two small Chinese primary-school children in plain everyday clothes, shown in profile. One rests their cheek on one hand and thinks with a puzzled but curious expression; the other listens quietly. A few small abstract carved sound curls and decorative note-like shapes float nearby, not written music. Keep all people and shapes in x=68%-100%, with no objects or shadows crossing into the left 68%. Left side is clean warm cream #FAF7EE paper with faint texture. No text, letters, digits, punctuation glyphs, logo, watermark or real music notation.
~~~

## stage-transfer.webp

- 风格参照：E:/Projects/music-graph-site/public/art/units/g7s1-u1.webp；已通过样图 E:/Projects/.tmp/lesson-art/renyin/stage-motivate.webp、stage-construct.webp
- 原始生成 PNG：E:/codex-state/codex-home/generated_images/01a14fcb-723e-7362-b669-fd64df9b1f96/exec-7f511fcf-2b08-402c-b38f-5ca7a651c228.png
- 保留 PNG：E:/Projects/.tmp/lesson-art/renyin/raw/stage-transfer.png
- 最终 WebP：E:/Projects/.tmp/lesson-art/renyin/stage-transfer.webp（1600×900，88,898 字节）
- 生成与导出：image_gen 出图后，Sharp 裁取右侧场景、缩放至右侧 640px 版心并渐隐左缘；WebP quality=85、effort=6。
- 重画次数与原因：0 次；一次生成后按版式由 Sharp 收拢并渐隐，内容符合要求。

### 完整提示词（实际提交）

~~~text
Wide 16:9 1600x900 reusable illustration in nostalgic Chinese childhood woodblock / linocut picture-book style, hand-printed grain, slightly carved edges, warm cream paper, flat muted brick red, ochre, forest green and sage. At the far right show three small Chinese primary-school children in plain everyday clothes confidently performing on a simple little stage: one sings, one plays a small correctly shaped hand drum, one claps and moves to the rhythm. Compact scene only; no busy scenery. Keep every person, stage, prop and shadow beyond x=68%. Left 68% stays clean warm cream #FAF7EE paper with faint texture. No text, letters, numbers, logos, watermark or real music notation; decorative sound shapes only.
~~~

## stage-summary.webp

- 风格参照：E:/Projects/music-graph-site/public/art/units/g7s1-u1.webp；已通过样图 E:/Projects/.tmp/lesson-art/renyin/stage-motivate.webp、stage-construct.webp
- 原始生成 PNG：E:/codex-state/codex-home/generated_images/01a14fcb-723e-7362-b669-fd64df9b1f96/exec-348b668d-027d-40e6-a878-526ebc0955c2.png
- 保留 PNG：E:/Projects/.tmp/lesson-art/renyin/raw/stage-summary.png
- 最终 WebP：E:/Projects/.tmp/lesson-art/renyin/stage-summary.webp（1600×900，80,616 字节）
- 生成与导出：image_gen 出图后，Sharp 裁取右侧场景、缩放至右侧 640px 版心并渐隐左缘；WebP quality=85、effort=6。
- 重画次数与原因：0 次；一次生成后按版式由 Sharp 收拢并渐隐，内容符合要求。

### 完整提示词（实际提交）

~~~text
Wide 16:9 1600x900 nostalgic Chinese childhood woodblock / linocut picture-book illustration, warm cream paper, hand-printed grain, carved edges, flat muted brick red, ochre, forest green and sage. At the far right, a small sprout grows in a plain clay pot beside two small Chinese primary-school children in simple everyday clothes. One child quietly sketches a simple leaf beside the sprout in a completely blank notebook; the other watches thoughtfully. Keep all subjects and props compact beyond x=68%, no scenery or shadows cross left of x=68%. Left 68% clean warm cream #FAF7EE paper with subtle grain. No text, letters, numbers, writing, logos, watermark or real music notation.
~~~

## group-roles.webp

- 风格参照：E:/Projects/music-graph-site/public/art/units/g7s1-u1.webp；已通过样图 E:/Projects/.tmp/lesson-art/renyin/stage-motivate.webp、stage-construct.webp
- 原始生成 PNG：E:/codex-state/codex-home/generated_images/01a14fcb-723e-7362-b669-fd64df9b1f96/exec-61869447-8a4e-4449-8cfd-28689684b566.png
- 保留 PNG：E:/Projects/.tmp/lesson-art/renyin/raw/group-roles.png
- 最终 WebP：E:/Projects/.tmp/lesson-art/renyin/group-roles.webp（1600×900，70,688 字节）
- 生成与导出：image_gen 出图后，Sharp 裁取右侧场景、缩放至右侧 640px 版心并渐隐左缘；WebP quality=85、effort=6。
- 重画次数与原因：0 次；一次生成后按版式由 Sharp 收拢并渐隐，内容符合要求。

### 完整提示词（实际提交）

~~~text
Wide 16:9 1600x900 nostalgic Chinese childhood woodblock / linocut picture-book art, warm cream paper, carved ink grain, flat earthy colors in muted brick red, ochre, deep forest green and sage. At the far right place exactly four small Chinese primary-school children in plain natural clothes, clearly showing group roles: one sings; one taps a small correctly shaped hand drum; one holds a simple unbranded recorder device with a blank face; one raises a hand to speak. Compact group, no busy scenery. Keep all four children, props and shadows beyond x=68%, left 68% clean warm cream #FAF7EE paper with faint grain. No text, letters, digits, logos, screen marks, watermark or real music notation.
~~~

## wonder-wall.webp

- 风格参照：E:/Projects/music-graph-site/public/art/units/g7s1-u1.webp；已通过样图 E:/Projects/.tmp/lesson-art/renyin/stage-motivate.webp、stage-construct.webp
- 原始生成 PNG：E:/codex-state/codex-home/generated_images/01a14fcb-723e-7362-b669-fd64df9b1f96/exec-1ae45fd0-6dd9-4e64-aabe-06cee12f2706.png
- 保留 PNG：E:/Projects/.tmp/lesson-art/renyin/raw/wonder-wall.png
- 最终 WebP：E:/Projects/.tmp/lesson-art/renyin/wonder-wall.webp（1600×900，140,724 字节）
- 生成与导出：image_gen 出图后，Sharp 裁取右侧场景、缩放至右侧 640px 版心并渐隐左缘；WebP quality=85、effort=6。
- 重画次数与原因：0 次；一次生成后按版式由 Sharp 收拢并渐隐，内容符合要求。

### 完整提示词（实际提交）

~~~text
Wide 16:9 1600x900 nostalgic Chinese childhood woodblock / linocut picture-book illustration, warm cream paper with visible hand-printed grain, carved edges, flat muted brick red, ochre, forest green and sage. At far right, two small Chinese primary-school children in plain everyday clothes beside a simple classroom cork board filled with many completely blank pale paper notes. One child tiptoes to pin a blank note, the other holds several blank notes and watches. Keep the board and all children compact beyond x=68%, with no objects or shadows crossing left of x=68%. Left 68% is clean warm cream #FAF7EE paper with subtle grain. No writing, text, numbers, logos, watermark or real music notation.
~~~

## homework.webp

- 风格参照：E:/Projects/music-graph-site/public/art/units/g7s1-u1.webp；已通过样图 E:/Projects/.tmp/lesson-art/renyin/stage-motivate.webp、stage-construct.webp
- 原始生成 PNG：E:/codex-state/codex-home/generated_images/01a14fcb-723e-7362-b669-fd64df9b1f96/exec-9fbec058-c2c1-4afb-81ec-f3d5c40578af.png
- 保留 PNG：E:/Projects/.tmp/lesson-art/renyin/raw/homework.png
- 最终 WebP：E:/Projects/.tmp/lesson-art/renyin/homework.webp（1600×900，62,568 字节）
- 生成与导出：image_gen 出图后，Sharp 裁取右侧场景、缩放至右侧 640px 版心并渐隐左缘；WebP quality=85、effort=6。
- 重画次数与原因：0 次；一次生成后按版式由 Sharp 收拢并渐隐，内容符合要求。

### 完整提示词（实际提交）

~~~text
Wide 16:9 1600x900 nostalgic Chinese childhood woodblock / linocut picture-book illustration, warm cream paper, hand-printed grain, carved ink edges, flat muted brick red, ochre, forest green and sage. A small cozy home vignette at far right: two Chinese primary-school children in plain clothes; one sings toward a simple unbranded phone or recorder on a small table, the other listens; an open completely blank notebook lies nearby. Keep the full scene, furniture and shadows compact in x=68%-100%. Left 68% stays clean warm cream #FAF7EE paper with faint grain only. No text, letters, numbers, writing, logos, screen marks, watermark or real music notation.
~~~

### Contact sheet

- 文件：contact-sheet.webp
- 尺寸与体积：1600×450，65,146 字节；由 sharp 导出。
- 组成：2×4 缩略图，包含 stage-motivate、stage-conflict、stage-construct、stage-transfer、stage-summary、group-roles、wonder-wall、homework 八张当前成品，无空白格。
- 生成方式：使用 sharp 将各 WebP 缩至 400×225 后排入网格，背景为 #FAF7EE；未添加文字或标题。

## T076 重画记录：group-roles.webp

- 原图：E:/Projects/.tmp/lesson-art/renyin/group-roles.webp（保留，未覆盖）
- 风格参照：E:/Projects/.tmp/lesson-art/renyin/stage-motivate.webp、stage-construct.webp
- image_gen 源图：E:/codex-state/codex-home/generated_images/01a14ff6-1b6d-7630-96f2-a3a717131aef/exec-e8f391d5-956f-4e74-bdbd-6c3286d5dd9a.png（1672×941）
- 新图：E:/Projects/.tmp/lesson-art/redraw/renyin-group-roles.webp（1600×900，112,948 字节）
- 导出：E:/Projects/music-graph-site/node_modules/sharp；从右侧场景裁切、缩放至 640px 版心并排入 1600×900 画布；WebP quality=86、effort=6。
- image_gen 请求次数：3 次；第 1 次构图横向过宽未采用，第 2 次网络错误，等待 60 秒后第 3 次成功。无 CLI fallback。
- 自查：PASS — 四个孩子与道具都在右侧 40% 版心；四人组合约占画高 69%；左侧 60% 为干净浅色纸面；四种分工清楚；录音设备无可辨文字；未见文字、伪文字、数字、字母、logo 或水印；尺寸与体积符合要求。

### 最终采用提示词（实际提交）

~~~text
Recompose the supplied Renyin classroom art as a finished wide 16:9 illustration, matching the two approved stage references in nostalgic Chinese childhood woodblock / linocut picture-book style: warm #FAF7EE paper, visible but subtle printed grain, carved ink edges, muted forest green, brick red, ochre, warm white and teal. Keep the same four friendly Chinese primary-school classmates, their simple everyday clothes and recognizable color roles from the group reference.

Strict layout: all four children, all hands, recorder, and every shadow must be contained in the rightmost 40% of the entire landscape (between x=60% and x=100%). The group's total height should be about 65% of the canvas (from y≈18% to y≈83%). Do NOT arrange the children in one wide horizontal line. Instead make a tight, narrow, two-row cluster: two children slightly behind and two seated or standing close in front, with shoulders overlapping naturally, so the complete cluster is taller than it is wide and fits wholly within that rightmost 40% column. Keep all four faces separate, large, and unobstructed. Leave at least the full left 60% completely blank warm pale paper, with only faint paper grain. Do not let anything enter the left 60%.

In the cluster, show these four roles distinctly: a boy singing with an open singing mouth; a girl clapping a steady rhythm; a boy holding a small plain unbranded audio recorder with a completely blank front; and a girl raising one hand to speak. Keep the recorder blank. Open eyes with visible pupils and natural cheerful expressions, clean age-appropriate hands. No extra children or decorative scene.

No text, pseudo-writing, letters, numbers, labels, watermarks, icons, music notation or symbols, signs, books, or screen graphics anywhere.
~~~
