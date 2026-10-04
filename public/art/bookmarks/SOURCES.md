# T032 首页书签插画：生成来源与自检

- 生成日期：2026-10-04
- 生成工具：内置 image_gen；工具未返回可核实的模型标识，故不臆填。
- 输出处理：使用仓库已有 sharp 将原始 PNG 缩放至 720×1800，轻微平滑高频纸面纹理以满足体积上限，再以 WebP quality 78 编码；没有安装依赖。
- 原始 PNG：`E:\Projects\.tmp\codex3\T032-raw\`
- 成品：`E:\Projects\yapu-collab\codex3\outbox\T032-art\`

## map.webp — 音乐地图

- 原图：`T032-raw/map.png`（793×1983 PNG）
- 成品：720×1800 WebP，quality 78，177628 B
- 提示词（完整）：

```text
Use case: illustration-story
Asset type: vertical 2:5 bookmark illustration for the homepage of a Chinese middle-school music textbook
Primary request: depict music growing from the land, with a quiet northern grassland, distant layered mountains, and a long river winding through the landscape; include one clearly recognizable horsehead fiddle resting diagonally among the grass in the lower-right foreground.
Scene/backdrop: one continuous, poetic Chinese landscape, not a map and not a collage. River, grassland, and mountains merge naturally with no cartographic markings.
Subject details: the horsehead fiddle has a long neck, a compact trapezoid soundbox, and a small carved horsehead pegbox silhouette; simple, accurate, clearly readable as an instrument but secondary to the landscape.
Style/medium: Chinese woodblock and screen-print illustration matching an existing middle-school textbook art series; hand-carved contour and hatch marks, visible warm paper grain, slight color-registration offset, flat editorial forms.
Composition/framing: very tall 2:5 portrait, intended final size 720x1800. Reserve the entire upper quarter as calm warm paper with only faint grain for later title placement. Keep all meaningful landscape and instrument details in the lower three-quarters, with the strongest forms around the middle-lower area. No frame, border, map silhouette, inset, or legend.
Color palette: only pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C, amber #E9A83A, and warm off-white paper #F7F3EA.
Constraints: no people or face, no text, letters, pseudo-writing, numbers, watermark, logo, country/province borders, coastlines, boundary lines, grid, compass, or recognizable map outline.
Avoid: gradients, glow, neon, 3D, photorealism, glossy surfaces, clip art, emoji, cartoon mascot, sci-fi, generic ink-wash fog.
```

- 自检结论（目视）：山脉、长河、草原和马头琴清楚；主体从中部以下展开，顶部约三成留白；木刻线条、暖纸纹和套色与单元插画一致；无文字、伪文字、地图轮廓或边界线。

## timeline.webp — 作品年表

- 原图：`T032-raw/timeline.png`（793×1983 PNG）
- 成品：720×1800 WebP，quality 78，131760 B
- 提示词（完整）：

```text
Use case: illustration-story
Asset type: vertical 2:5 bookmark illustration for the homepage of a Chinese middle-school music textbook
Primary request: depict the feeling of leafing through music across time: one partially unfurled handscroll with visible wooden roller rods, its paper surface carrying a quiet miniature landscape and a sparse sequence of small rhythm-like ink dots.
Scene/backdrop: the handscroll rests diagonally on warm paper, half-open and gently curling; a few layered hills, a river bend, and scattered abstract note-like dots are carved into the exposed scroll. Keep the scene intimate and physical, like a printed illustration of an old book object.
Subject details: two simple wooden roller rods and a visible rolled edge; the exposed paper has only non-letter landscape marks and separated dots, never readable musical notation or a timeline with labels.
Style/medium: Chinese woodblock and screen-print illustration matching an existing middle-school textbook art series; hand-carved contour and hatch marks, visible warm paper grain, slight color-registration offset, flat editorial forms.
Composition/framing: very tall 2:5 portrait, intended final size 720x1800. Reserve the entire upper quarter as calm warm paper with only faint grain for later title placement. Place the half-open scroll and its landscape marks in the middle-lower portion, with the roller ends and paper curls clearly visible. No frame or border.
Color palette: only pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C, amber #E9A83A, and warm off-white paper #F7F3EA.
Constraints: no people or faces; no text, letters, pseudo-writing, numbers, labels, watermark, logo, map boundaries, country/province borders, grid, or compass; no legible music notation.
Avoid: gradients, glow, neon, 3D, photorealism, glossy surfaces, clip art, emoji, cartoon mascot, sci-fi, generic ink-wash fog.
```

- 自检结论（目视）：半展手卷、卷杆、卷面山水和抽象节奏点清楚；主体位于中下部，顶部约三成留白；套色木刻质感与纸纹一致；无文字、伪文字、可读乐谱、地图轮廓或边界线。

## graph.webp — 知识图谱

- 原图：`T032-raw/graph.png`（793×1983 PNG，采用最终编辑稿）
- 成品：720×1800 WebP，quality 78，90124 B
- 提示词记录：先生成初稿，因线绳伸入题字留白，对初稿进行两轮定向编辑；以下按实际调用顺序记录全部完整提示词。

初次生成提示词：

```text
Use case: illustration-story
Asset type: vertical 2:5 bookmark illustration for the homepage of a Chinese middle-school music textbook
Primary request: express how artworks and knowledge are connected: a delicate chain of small paper lanterns and amber star-like ink dots joined by fine visible silk threads, with one clearly recognizable pipa resting below.
Scene/backdrop: a quiet, physical still life on warm paper; the threads form gentle, organic arcs between a few lanterns and printed star points, like related ideas passing from one to another. The pipa sits in the lower foreground with its pear-shaped body and short fretted neck clearly visible.
Subject details: traditional Chinese paper lanterns are matte, small, and unlit; no glowing light. Thin pine-green or vermilion silk threads connect them. The pipa is an accurate traditional pear-shaped Chinese lute with a short neck, frets, and strings, rendered as a simple hand-carved silhouette.
Style/medium: Chinese woodblock and screen-print illustration matching an existing middle-school textbook art series; hand-carved contour and hatch marks, visible warm paper grain, slight color-registration offset, flat editorial forms.
Composition/framing: very tall 2:5 portrait, intended final size 720x1800. Reserve the entire upper quarter as calm warm paper with only faint grain for later title placement. Place the string of connected lanterns through the middle, and the pipa in the lower third; keep ample breathing room and make the relationships readable without crowding. No frame or border.
Color palette: only pine green #1F5C47, sprout green #3E9B4F, vermilion #D2462C, amber #E9A83A, and warm off-white paper #F7F3EA.
Constraints: no people or faces; no text, letters, pseudo-writing, numbers, labels, watermark, logo, glowing nodes, network chart, UI diagram, map boundaries, country/province borders, grid, or compass. Threads must be physical silk, not luminous lines.
Avoid: gradients, glow, neon, 3D, photorealism, glossy surfaces, clip art, emoji, cartoon mascot, sci-fi, holograms, bokeh, lens flare.
```

第一次编辑提示词：

```text
Edit Image 1, the Chinese woodblock-print bookmark illustration. Make one composition change only: move the entire lantern-and-thread arrangement downward so that the upper 30% of the tall 2:5 canvas is completely quiet warm paper with faint grain only. No cord, dots, stars, lanterns, branches, or other subject may enter that top 30%. Keep the pipa and the rest of the scene below the title space.
Preserve the current paper texture, hand-carved screen-print style, exact five-color palette, ink registration, pipa appearance, lantern count and forms, thread colors, and the overall lower composition. Do not add anything.
No text, letters, pseudo-writing, numbers, logos, watermark, face, glow, map boundary, or extra object. Keep a tall 2:5 portrait, intended final 720x1800.
```

第二次编辑提示词（终稿）：

```text
Edit Image 1, the tall bookmark illustration. The upper 34% of the canvas must contain only warm off-white paper and faint paper grain. Move every illustrated element—including the highest thread, its entry point at the left edge, dots, stars, lanterns, branches and pipa—down until the first illustrated mark begins below that 34% line. The thread must not cross or touch the upper third. Keep the remaining composition recognizable and balanced in the lower two-thirds; it is acceptable for lower foliage to approach the bottom edge.
Preserve the current four-color Chinese woodblock/screen-print style, paper texture, pipa and lantern forms, thread colors, hatch marks, and slight ink misregistration. Make no other changes.
Tall 2:5 portrait. No text, letters, pseudo-writing, numbers, watermark, logo, glow, or border.
```

- 自检结论（目视）：纸灯、星点与实体丝线相连，琵琶位于下方；顶部约三分之一留白；无发光网络效果；木刻线条、暖纸纹和套色一致；无文字、伪文字、地图轮廓或边界线。初稿与第一次编辑稿未交付，终稿通过留白检查。
