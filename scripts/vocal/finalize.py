"""Encode synthesized vocals like the existing ones and merge them into the site manifest.

python scripts/vocal/finalize.py <todo.json> <outdir> [--accept key,key]  -> writes public/audio/vocal/<key>.mp3, updates vocal-manifest.json
  --male: men's versions (export.ts male) go to public/audio/vocal-male/ and vocal-manifest-male.json instead
Only files that pass the pitch check are published; the rest are listed.
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qa import check  # noqa: E402

from paths import AUDIO, AUDIO_MALE, MANIFEST, MANIFEST_MALE  # noqa: E402
TARGET_DB = -21.0  # mean level of the existing recordings

todo = {m["key"]: m for m in json.load(open(sys.argv[1], encoding="utf-8"))}
out = sys.argv[2]
# Keys checked by hand (frame-by-frame pitch) whose automatic check trips on very short notes.
accept = set(sys.argv[sys.argv.index("--accept") + 1].split(",")) if "--accept" in sys.argv else set()
male = "--male" in sys.argv
if male:
    AUDIO, MANIFEST = AUDIO_MALE, MANIFEST_MALE
    os.makedirs(AUDIO, exist_ok=True)
manifest = json.load(open(MANIFEST, encoding="utf-8")) if os.path.exists(MANIFEST) else {}
published, rejected = [], []
for key, mel in todo.items():
    wav_path = os.path.join(out, key + ".wav")
    meta_path = os.path.join(out, key + ".json")
    if not os.path.exists(wav_path):
        continue
    meta = json.load(open(meta_path))
    # leadBeats = beats before the first syllable (older synth runs counted from the first note, intro included)
    first = next(i for i, n in enumerate(mel["notes"]) if n["midi"] is not None and n["d"] < 8 and not n["slur"] and not n["tie"]
                 and n["lyric"] and re.search(r"[A-Za-z\u4e00-\u9fff]", n["lyric"]))
    meta["leadBeats"] = round(sum(n["b"] for n in mel["notes"][:first]), 6)
    n, med, bad, octv = check(wav_path, mel, meta["offset"], meta["shift"])
    label = f"{key} {mel['book']} {mel['name']}#{mel['index']}"
    if key not in accept and (not n or med > 0.25 or bad > 0.1 or octv != 0):
        rejected.append(f"{label}: notes={n} median={med} off={bad} octave={octv}")
        continue
    y, sr = sf.read(wav_path)
    rms = float(np.sqrt(np.mean(y ** 2)))
    y = y * 10 ** ((TARGET_DB - 20 * np.log10(rms)) / 20)
    peak = float(np.max(np.abs(y)))
    if peak > 0.89:  # keep a little headroom; gentle overall reduction instead of clipping
        y = y * 0.89 / peak
    tmp = os.path.join(out, key + ".norm.wav")
    sf.write(tmp, y, sr)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-ac", "1", "-ar", "44100", "-codec:a", "libmp3lame", "-q:a", "8",
                    os.path.join(AUDIO, key + ".mp3")], check=True)
    os.remove(tmp)
    # 绮萱 entries stay [offset, leadBeats]; other voices name themselves ([offset, leadBeats, "ria"])
    manifest[key] = [meta["offset"], meta["leadBeats"]] + ([meta["voice"]] if not male and meta.get("voice", "qixuan") != "qixuan" else [])
    published.append(f"{label}: {med:.2f}st")
manifest = dict(sorted(manifest.items()))
with open(MANIFEST, "w", encoding="utf-8") as f:
    json.dump(manifest, f, separators=(",", ":"))
print("published", len(published))
print("\n".join(published))
print("rejected", len(rejected))
print("\n".join(rejected))
print("manifest entries", len(manifest))
