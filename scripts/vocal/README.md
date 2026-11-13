# 人声演唱合成（绮萱 / Ria · DiffSinger）

给带歌词的旋律合成「人声」音色用的录音：主旋律由绮萱（童声）演唱；合唱作品的低声部（以及标明「男」的声部）
由 Ria / 狸安（男声）演唱，播放时高声部女声、低声部男声，能听出来。网站按旋律指纹查找录音（`app/lib/lesson/vocal.ts`）：
旋律的音高、速度、拍号、音符或歌词一改，指纹就变，旧录音自动失效，需要重新合成。

## 一次性准备

```bash
pip install onnxruntime numpy soundfile pypinyin librosa
python scripts/vocal/setup.py        # 下载绮萱 v2.7.0、Ria v0.4 声库和两个声码器（约 900 MB）到 .vocal/
```

模型和中间文件都放在 `.vocal/`（不进 git），可用环境变量 `VOCAL_HOME` 换位置。另需 `ffmpeg`。

## 日常流程：补齐没有人声的旋律

```bash
npx tsx scripts/vocal/export.ts missing                                   # → .vocal/work/missing.json
python scripts/vocal/synth.py .vocal/work/missing.json .vocal/work/out    # 合成 wav，约为音频时长的 2–3 倍
python scripts/vocal/finalize.py .vocal/work/missing.json .vocal/work/out # 音高检查 → mp3 → 写入 manifest
```

`finalize.py` 只发布通过音高检查的文件（中位误差 ≤ 25 音分、偏离超过 50 音分的音 ≤ 10%，且整体八度偏差为 0），不合格的列出来不发布；
极短的音（如 0.25 秒的拖腔）可能让检查误判，逐帧核对音高无误后可用 `--accept 指纹,指纹` 放行。
之后提交 `public/audio/vocal/*.mp3` 和 `app/lib/lesson/vocal-manifest.json`；音频多时按 5 MB 左右分批推送，
manifest 放在最后一批，避免线上指向还没上传的文件。

## 合唱声部（男声）

```bash
npx tsx scripts/vocal/export.ts parts                                     # → .vocal/work/parts.json，每条带 "voice"
python scripts/vocal/synth.py .vocal/work/parts.json .vocal/work/parts-out
python scripts/vocal/finalize.py .vocal/work/parts.json .vocal/work/parts-out
```

- 声部指纹 `vocalKey(melody, part)` 同时覆盖该声部和主旋律（借用主旋律歌词的声部，主旋律歌词一改也会失效）。
- 选声：标签含「女」→ 绮萱；含「男」或是第二声部以后 → Ria。声部自己没有歌词、但节奏与主旋律逐音相同时借用主旋律歌词；
  节奏不同又没有歌词的不唱（仍由钢琴弹）。
- 八度：Ria 音域 A2–G#4。写在高音区的童声低声部（中位音高于 E4）降八度唱，像男声叠唱；标明「男」的声部按记谱音高，
  只有超出音域（最高音高于 A4）才降八度。
- Ria 的使用规范要求注明声库名：播放器的署名行按实际用到的声库写「绮萱、Ria（狸安）」。Ria 的声学模型输出自然对数 mel，
  它配套的 2024.02 声码器要 log10 mel，合成时会换算。

## 检查已发布的人声

```bash
npx tsx scripts/vocal/export.ts voiced
python scripts/vocal/audit.py .vocal/work/voiced.json > .vocal/work/audit.jsonl
npx tsx scripts/vocal/export.ts keys <指纹…>                              # 把要重做的导出到 .vocal/work/keys.json 再合成
```

`inspect_voices.py` 做更全面的检查（节拍对齐与漂移、漏唱、前奏间奏里多唱、文件长度、响度与削波、音色），
结果每行一条 JSON：`python scripts/vocal/inspect_voices.py .vocal/work/voiced.json > .vocal/work/inspect.jsonl`。

音全部很短（< 0.15 秒）的歌，检查测不到音，会显示 notes=0；这不代表录音有问题，可用 `qa.py` 的 `min_dur` 参数复查。

## 合成约定

- **音高**：默认采用自然清唱。先由绮萱声库的 `dspitch` 模型生成音高曲线，再把每个音钉在记谱音高上：以该音中段的中位数为准，偏差限制在 ±0.08 半音（`TUNE`），只在起音约 70 ms 和收尾约 30 ms 内放宽，保留自然的滑入滑出。长音（≥0.75 秒）加轻微不规则颤音（`VIB`，默认 0.24 半音）。Ria 没有音高模型，借用绮萱对同一旋律（高八度）生成的曲线，降回 Ria 的音高。绮萱中位音低于 F#3，或四分之一以上的音低于 G3 时，仍按原规则升八度。
- **换气与乐句**：`punct.json` 是 `{ "旋律指纹": "带标点的歌词" }`，唱词须按发音顺序逐字匹配。没有自己条目的声部，若唱词与某个条目相同（借用主旋律歌词的低声部），自动沿用那条标点。用 `，、；：。！？` 标出句末，同一字的拖腔结束后才换气。句内休止留空。句末休止不足时可从该音末尾借时，逗号类上限 0.28 秒，句号类上限 0.4 秒，均不超过该音时值的 35%。缺少标点、汉字不匹配或英文唱词按原来的休止规则换气。批末打印标点不匹配的指纹。乐句末尾逐渐加气声（`BREATH`，绮萱 10 dB、Ria 3 dB），塑造乐句音量，每小节强拍轻微加重（`ACCENT`，绮萱 0.18、Ria 0.08）。
- **严格音准检查**：`python scripts/vocal/tune_check.py <todo.json> <out>/<指纹>.wav …` 检查所有 ≥0.08 秒的音（finalize 只查 0.15 秒以上的音中段），列出偏离超过 30 音分的音。
- **对照与调试**：`VOCAL_STYLE=plain` 切回旧音高、换气和力度处理。单曲调试可用 `PUNCT` 指定歌词文件覆盖仓库标点（会作用于本次所有指纹），用 `F0_OUT` 指定音高曲线输出路径。
- **时间**：录音从第一个有歌词的音前 0.5 秒开始；manifest 记 `[offset, leadBeats]`——`offset` 是该音在文件里的秒数，`leadBeats` 是它前面的拍数（前奏不唱）。
- **歌词**：整首歌词一起转拼音（多音字靠上下文，常见误读在 `synth.py` 的词典里补）；一个音上有几个字时平均分时值（句尾「儿」只占一半）；
  没有歌词也没有连线的音是前奏、间奏，不唱；唱名 do re mi… 唱作「哆来咪」。
- **英文歌词**：按音节拆在各音上（"pave ment"），先拼回单词查声库英文词典，再按音节分回各音。整首的拉丁字母歌词都是拼音（Yi ya lei…）时按中文唱。
- **响度**：平均 −21 dB，mp3 单声道 44.1 kHz（LAME `-q:a 8`，约 50 kb/s），与早期录音一致。

## 不合成的

- 纯念白（`X` 节奏，没有音高），如《祖国有我》《武松打虎》，自动跳过。
- `export.ts` 里 `SKIP` 列出的（目前为空；人教一上《小兔子乖乖》原先在这里，2026-10-28 按用户要求补上了人声）。
- 声库不支持的语言：目前只有中文和英文，德语《咖啡康塔塔》等会报错跳过。
