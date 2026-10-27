"""Inspect published vocals beyond pitch: timing, missing or extra singing, length, loudness, timbre.

python scripts/vocal/inspect_voices.py <voiced.json> [keys.json] > inspect.jsonl
One JSON line per vocal. Runs on all CPU cores.
"""
import json
import os
import re
import sys
from multiprocessing import Pool

import librosa
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import AUDIO, MANIFEST  # noqa: E402

SR, HOP = 22050, 256
FPS = SR / HOP
WORD = re.compile(r"[A-Za-z一-鿿]")


def sung_spans(mel):
    """(start, end, midi, syllable_start?) in seconds from the first syllable, for every sung note; and long silent spans."""
    beat = 60 / mel["bpm"]
    notes = mel["notes"]
    first = next(i for i, n in enumerate(notes) if n["midi"] is not None and n["d"] < 8 and not n["slur"] and not n["tie"]
                 and n["lyric"] and WORD.search(n["lyric"]))
    t = -sum(n["b"] for n in notes[:first]) * beat
    sung, silent, singing = [], [], False
    for n in notes:
        d = n["b"] * beat
        syll = n["midi"] is not None and n["d"] < 8 and not n["slur"] and not n["tie"] and bool(n["lyric"] and WORD.search(n["lyric"]))
        if n["midi"] is None or n["d"] >= 8:
            singing = False
        elif syll:
            singing = True
        elif not (n["slur"] or n["tie"]):
            singing = False
        if singing:
            sung.append((t, t + d, n["midi"], syll))
        elif t >= 0:
            if silent and abs(silent[-1][1] - t) < 1e-6:
                silent[-1] = (silent[-1][0], t + d)
            else:
                silent.append((t, t + d))
        t += d
    return sung, [s for s in silent if s[1] - s[0] >= 0.8], t


def inspect(args):
    mel, offset = args
    key = mel["key"]
    try:
        y, _ = librosa.load(str(AUDIO / f"{key}.mp3"), sr=SR, mono=True)
        f0, voiced, _ = librosa.pyin(y, fmin=80, fmax=1400, sr=SR, frame_length=1024, hop_length=HOP)
        rms = librosa.feature.rms(y=y, frame_length=1024, hop_length=HOP)[0]
        n = min(len(f0), len(rms))
        f0, voiced, rms = f0[:n], voiced[:n], rms[:n]
        t = np.arange(n) / FPS - offset  # seconds relative to the first syllable
        sung, silent, end = sung_spans(mel)
        loud = rms > max(1e-4, np.percentile(rms, 95) * 0.06)
        # 1. pitch and coverage of sung notes
        errs, missing, cover = [], 0, 0
        for s, e, midi, _ in sung:
            d = e - s
            if d < 0.12:
                continue
            sel = (t >= s + d * 0.25) & (t < s + d * 0.85)
            if sel.sum() < 2:
                continue
            cover += 1
            v = sel & voiced
            if v.sum() < max(1, 0.3 * sel.sum()):
                missing += 1
                continue
            e_ = float(np.median(librosa.hz_to_midi(f0[v]))) - midi
            errs.append(e_ - 12 * round(e_ / 12))
        errs = np.abs(np.array(errs)) if errs else np.array([np.nan])
        # 2. timing: per syllable, best lag (−0.25…+0.25 s) aligning the expected pitch with the sung pitch
        lags = []
        midi_track = np.where(voiced, librosa.hz_to_midi(np.where(voiced, f0, 1.0)), np.nan)
        for s, e, midi, syll in sung:
            if not syll or e - s < 0.2:
                continue
            best, best_lag = None, None
            for lag in np.arange(-0.25, 0.2501, 0.02):
                sel = (t >= s + lag + 0.04) & (t < e + lag - 0.04)
                seg = midi_track[sel]
                seg = seg[~np.isnan(seg)]
                if len(seg) < 3:
                    continue
                score = float(np.mean(np.abs(((seg - midi) + 6) % 12 - 6) < 0.5))
                if best is None or score > best + 1e-9:
                    best, best_lag = score, lag
            if best is not None and best > 0.5:
                lags.append((s, best_lag))
        lag_med = float(np.median([l for _, l in lags])) if lags else None
        drift = None
        if len(lags) >= 8:
            xs = np.array([s for s, _ in lags])
            ls = np.array([l for _, l in lags])
            drift = float(np.polyfit(xs, ls, 1)[0] * 60)  # seconds of lag gained per minute
        # 3. singing where the score is silent (intros, interludes, long rests)
        extra = 0.0
        for s, e in silent:
            sel = (t >= s + 0.25) & (t < e - 0.25)
            if sel.sum():
                extra = max(extra, float((sel & voiced).mean()))
        # 4. length and loudness
        dur = len(y) / SR
        expected = offset + end
        mean_db = float(20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-9))
        peak = float(np.max(np.abs(y)))
        clipped = int(np.sum(np.abs(y) > 0.995))
        # 5. timbre: spectral centroid and harmonic richness over voiced frames
        cen = librosa.feature.spectral_centroid(y=y, sr=SR, n_fft=1024, hop_length=HOP)[0][:n]
        centroid = float(np.median(cen[voiced & loud])) if (voiced & loud).any() else None
        head = float(t[np.argmax(loud)] + offset) if loud.any() else None  # seconds of audio before the first sound
        return {"key": key, "book": mel["book"], "name": mel["name"], "index": mel["index"], "notes": cover,
                "pitch_med": float(np.nanmedian(errs)), "pitch_bad": float(np.nanmean(errs > 0.5)), "missing": missing,
                "lag": lag_med, "drift_per_min": drift, "extra_singing": extra, "dur": round(dur, 2), "expected": round(expected, 2),
                "mean_db": round(mean_db, 1), "peak": round(peak, 3), "clipped": clipped, "centroid": centroid,
                "first_sound": head, "offset": offset}
    except Exception as exc:  # noqa: BLE001
        return {"key": key, "name": mel["name"], "error": repr(exc)}


if __name__ == "__main__":
    mels = json.load(open(sys.argv[1], encoding="utf-8"))
    if len(sys.argv) > 2:
        keep = set(json.load(open(sys.argv[2])))
        mels = [m for m in mels if m["key"] in keep]
    man = json.load(open(MANIFEST))
    jobs = [(m, man[m["key"]][0]) for m in mels if m["key"] in man]
    with Pool(os.cpu_count() or 4) as pool:
        for row in pool.imap_unordered(inspect, jobs, chunksize=2):
            print(json.dumps(row, ensure_ascii=False), flush=True)
