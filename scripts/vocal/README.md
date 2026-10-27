# 人声演唱合成（绮萱 / DiffSinger）

给带歌词的旋律合成「人声（童声）」音色用的录音。网站按旋律指纹查找录音（`app/lib/lesson/vocal.ts`）：
旋律的音高、速度、拍号、音符或歌词一改，指纹就变，旧录音自动失效，需要重新合成。

## 一次性准备

```bash
pip install onnxruntime numpy soundfile pypinyin librosa
python scripts/vocal/setup.py        # 下载绮萱 v2.7.0 声库和 PC-NSF-HiFiGAN 声码器（约 470 MB）到 .vocal/
```

模型和中间文件都放在 `.vocal/`（不进 git），可用环境变量 `VOCAL_HOME` 换位置。另需 `ffmpeg`。

## 日常流程：补齐没有人声的旋律

```bash
npx tsx scripts/vocal/export.ts missing                                   # → .vocal/work/missing.json
python scripts/vocal/synth.py .vocal/work/missing.json .vocal/work/out    # 合成 wav，约为音频时长的 2–3 倍
python scripts/vocal/finalize.py .vocal/work/missing.json .vocal/work/out # 音高检查 → mp3 → 写入 manifest
```

`finalize.py` 只发布通过音高检查的文件（中位误差 ≤ 0.25 半音、偏离超过半音的音 ≤ 10%），不合格的列出来不发布。
之后提交 `public/audio/vocal/*.mp3` 和 `app/lib/lesson/vocal-manifest.json`；音频多时按 5 MB 左右分批推送，
manifest 放在最后一批，避免线上指向还没上传的文件。

## 检查已发布的人声

```bash
npx tsx scripts/vocal/export.ts voiced
python scripts/vocal/audit.py .vocal/work/voiced.json > .vocal/work/audit.jsonl
npx tsx scripts/vocal/export.ts keys <指纹…>                              # 把要重做的导出到 .vocal/work/keys.json 再合成
```

音全部很短（< 0.15 秒）的歌，检查测不到音，会显示 notes=0；这不代表录音有问题，可用 `qa.py` 的 `min_dur` 参数复查。

## 合成约定

- **音高**：按记谱音高演唱（与钢琴同音），不移八度。音高曲线直接由音符生成（短滑音、长音上轻微颤音），不用声库的音高模型，保证和钢琴对得上。
- **时间**：录音从第一个有歌词的音前 0.5 秒开始；manifest 记 `[offset, leadBeats]`——`offset` 是该音在文件里的秒数，`leadBeats` 是它前面的拍数（前奏不唱）。
- **歌词**：整首歌词一起转拼音（多音字靠上下文，常见误读在 `synth.py` 的词典里补）；一个音上有几个字时平均分时值（句尾「儿」只占一半）；
  没有歌词也没有连线的音是前奏、间奏，不唱；唱名 do re mi… 唱作「哆来咪」。
- **英文歌词**：按音节拆在各音上（"pave ment"），先拼回单词查声库英文词典，再按音节分回各音。整首的拉丁字母歌词都是拼音（Yi ya lei…）时按中文唱。
- **响度**：平均 −21 dB，mp3 单声道 44.1 kHz（LAME `-q:a 8`，约 50 kb/s），与早期录音一致。

## 不合成的

- 纯念白（`X` 节奏，没有音高），如《祖国有我》《武松打虎》，自动跳过。
- `export.ts` 里 `SKIP` 列出的（人教一上《小兔子乖乖》，此前决定不做人声）。
- 声库不支持的语言：目前只有中文和英文，德语《咖啡康塔塔》等会报错跳过。
