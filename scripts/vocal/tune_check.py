"""Strict tuning check: every sung note >= 0.08 s (core 20%..90%); lists notes off by more than 30 cents.

Usage: python scripts/vocal/tune_check.py <todo.json> <out>/<key>.wav ...  (reads <key>.json next to each wav)
"""
import json, sys, re, os
import numpy as np, librosa
def notes_of(mel, offset, shift):
    beat = 60 / mel["bpm"]
    first = next(i for i, n in enumerate(mel["notes"]) if n["midi"] is not None and n["d"] < 8 and not n["slur"] and not n["tie"]
                 and n["lyric"] and re.search(r"[A-Za-z一-鿿]", n["lyric"]))
    lead = sum(n["b"] for n in mel["notes"][:first]) * beat
    tt = 0.0; singing = False; out = []
    for n in mel["notes"]:
        d = n["b"] * beat
        if n["midi"] is None or n["d"] >= 8: singing = False
        elif n["lyric"] and re.search(r"[A-Za-z一-鿿]", n["lyric"]) and not n["slur"] and not n["tie"]: singing = True
        elif not (n["slur"] or n["tie"]): singing = False
        if singing and d >= 0.08:
            s = offset + tt - lead
            out.append((s, s + d, n["midi"] + shift, n.get("lyric") or "~"))
        tt += d
    return out
def check(path, mel, offset, shift):
    y, sr = librosa.load(path, sr=22050, mono=True)
    f0, vf, _ = librosa.pyin(y, fmin=70, fmax=1400, sr=sr, frame_length=1024, hop_length=128)
    t = np.arange(len(f0)) * 128 / sr
    m = librosa.hz_to_midi(f0)
    core, bad = [], []
    for s, e, w, ly in notes_of(mel, offset, shift):
        d = e - s
        sel = (t >= s + 0.2 * d) & (t < s + 0.9 * d) & vf
        if sel.sum() < 2: continue
        err = m[sel] - w; err -= 12 * np.round(np.median(err) / 12)
        med = float(np.median(err)); core.append(med)
        frac = float((np.abs(err) > 0.35).mean())
        if abs(med) > 0.3 or frac > 0.4:
            bad.append(f"{ly}@{s:.2f}s({med*100:+.0f}c,{frac:.0%})")
    core = np.array(core)
    return len(core), float(np.mean(np.abs(core))*100), float((np.abs(core) > 0.3).mean()), bad
if __name__ == "__main__":
    todo = {m["key"]: m for m in json.load(open(sys.argv[1], encoding="utf-8"))}
    for p in sys.argv[2:]:
        key = os.path.basename(p)[:8]
        j = json.load(open(p[:-4] + ".json"))
        n, mae, frac, bad = check(p, todo[key], j["offset"], j["shift"])
        print(f"{p}: n={n} mean|err|={mae:.0f}c off>30c={frac:.0%} {' '.join(bad[:12])}", flush=True)
