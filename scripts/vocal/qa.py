"""Pitch QA: track f0 in a vocal file and compare it with the melody's sung notes.

python scripts/vocal/qa.py <todo.json> <file.wav|mp3> <key> [shift] [offset]
"""
import json, sys, os, re
import numpy as np, librosa
def check(path, mel, offset, shift, min_dur=0.15):
    y, sr = librosa.load(path, sr=22050, mono=True)
    f0, vflag, _ = librosa.pyin(y, fmin=80, fmax=1400, sr=sr, frame_length=1024, hop_length=256)
    t = np.arange(len(f0)) * 256 / sr
    beat = 60 / mel["bpm"]
    # the recording's reference beat is the first syllable: instrumental intros carry no lyrics
    first = next(i for i, n in enumerate(mel["notes"]) if n["midi"] is not None and n["d"] < 8 and not n["slur"] and not n["tie"]
                 and n["lyric"] and re.search(r"[A-Za-z\u4e00-\u9fff]", n["lyric"]))
    lead = sum(n["b"] for n in mel["notes"][:first]) * beat
    tt = 0.0; errs = []; octs = []; singing = False
    for n in mel["notes"]:
        d = n["b"] * beat
        # only sung notes: a syllable, or a melisma/tie continuing one (intros and interludes are instrumental)
        if n["midi"] is None or n["d"] >= 8:
            singing = False
        elif n["lyric"] and re.search(r"[A-Za-z\u4e00-\u9fff]", n["lyric"]) and not n["slur"] and not n["tie"]:
            singing = True
        elif not (n["slur"] or n["tie"]):
            singing = False
        if singing and d > min_dur:
            a, b = offset + (tt - lead) + d * 0.3, offset + (tt - lead) + d * 0.85
            sel = (t >= a) & (t < b) & vflag
            if sel.sum() > 2:
                m = np.median(librosa.hz_to_midi(f0[sel]))
                e = m - (n["midi"] + shift)
                octs.append(round(e / 12)); errs.append(e - 12 * round(e / 12))
        tt += d
    errs = np.array(errs)
    return len(errs), float(np.median(np.abs(errs))) if len(errs) else None, float((np.abs(errs) > 0.5).mean()) if len(errs) else None, (max(set(octs), key=octs.count) if octs else None)
if __name__ == "__main__":
    todo = {m["key"]: m for m in json.load(open(sys.argv[1]))}
    mel = todo[sys.argv[3]]
    path = sys.argv[2]
    shift = int(sys.argv[4]) if len(sys.argv) > 4 else 0
    off = float(sys.argv[5]) if len(sys.argv) > 5 else json.load(open(path[:-4] + ".json"))["offset"]
    n, med, bad, octv = check(path, mel, off, shift)
    print(f"{sys.argv[3]} {mel['name']}: notes={n} median|err|={med:.2f}st off>0.5st={bad:.0%} octave_vs_written={octv}")
