"""DiffSinger (绮萱 v2.7.0) singing for 芽谱 melodies, ONNX only.

Usage: python scripts/vocal/synth.py <todo.json> <outdir> [key ...]   (todo.json from export.ts)
Writes <key>.wav and <key>.json ({offset, leadBeats, shift}) per melody.

Pipeline: lyrics -> pinyin -> phonemes; duration model places consonants before each
note onset; the pitch curve is built from the notes themselves (exact pitch, short glides,
light vibrato on long notes) so the voice stays in tune with the piano; the variance model
adds breathiness/voicing; acoustic model -> mel; PC-NSF-HiFiGAN -> waveform.
"""
import json
import math
import os
import re
import sys

import numpy as np
import onnxruntime as ort
import soundfile as sf
from pypinyin import Style, lazy_pinyin, load_phrases_dict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import EN_DICT, VOCODER, VOICEBANK, ZH_DICT  # noqa: E402

VB = str(VOICEBANK)
SR, HOP = 44100, 512
FPS = SR / HOP
ZH = 3

# Common mis-readings in song lyrics (pypinyin defaults to the speech reading).
load_phrases_dict({
    "一个": [["yí"], ["gè"]], "长江": [["cháng"], ["jiāng"]], "地方": [["dì"], ["fāng"]],
    "悄悄地": [["qiāo"], ["qiāo"], ["de"]], "轻轻地": [["qīng"], ["qīng"], ["de"]],
    "慢慢地": [["màn"], ["màn"], ["de"]], "静静地": [["jìng"], ["jìng"], ["de"]],
    "朝霞": [["zhāo"], ["xiá"]], "朝阳": [["zhāo"], ["yáng"]], "还有": [["hái"], ["yǒu"]],
    "还是": [["hái"], ["shì"]], "还要": [["hái"], ["yào"]], "大地": [["dà"], ["dì"]],
    "什么": [["shén"], ["me"]], "哪里": [["nǎ"], ["lǐ"]], "似的": [["shì"], ["de"]],
    "唱着": [["chàng"], ["zhe"]], "看着": [["kàn"], ["zhe"]], "望着": [["wàng"], ["zhe"]],
    "着急": [["zháo"], ["jí"]], "睡着": [["shuì"], ["zháo"]], "重逢": [["chóng"], ["féng"]],
    "重新": [["chóng"], ["xīn"]], "银行": [["yín"], ["háng"]], "一行": [["yì"], ["háng"]],
    "调皮": [["tiáo"], ["pí"]], "曲调": [["qǔ"], ["diào"]], "歌曲": [["gē"], ["qǔ"]],
    "山歌": [["shān"], ["gē"]], "了解": [["liǎo"], ["jiě"]], "得到": [["dé"], ["dào"]],
})
SOLFEGE = {"do": "duo", "re": "lai", "mi": "mi", "fa": "fa", "sol": "suo", "so": "suo", "la": "la", "si": "xi", "ti": "xi"}

with open(ZH_DICT, encoding="utf-8") as f:
    DICT = json.load(f)


def load_ids(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def session(path):
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = os.cpu_count() or 4
    return ort.InferenceSession(path, opts, providers=["CPUExecutionProvider"])


ACOUSTIC = session(os.path.join(VB, "0101_qixuan_muon1_acoustic.qixuan.onnx"))
AC_IDS = load_ids(os.path.join(VB, "0101_qixuan_muon1_acoustic.phonemes.json"))
DUR_LING = session(os.path.join(VB, "dsdur", "0102_qixuan_newdict_dur.qixuan.linguistic.onnx"))
DUR = session(os.path.join(VB, "dsdur", "0102_qixuan_newdict_dur.qixuan.dur.onnx"))
DUR_IDS = load_ids(os.path.join(VB, "dsdur", "0102_qixuan_newdict_dur.phonemes.json"))
VAR_LING = session(os.path.join(VB, "dsvariance", "0102_qixuan_muon1_multivar.qixuan.linguistic.onnx"))
VAR = session(os.path.join(VB, "dsvariance", "0102_qixuan_muon1_multivar.qixuan.variance.onnx"))
VAR_IDS = load_ids(os.path.join(VB, "dsvariance", "0102_qixuan_muon1_multivar.phonemes.json"))
VOC = session(str(VOCODER))

HAN = re.compile(r"[一-鿿]")


def is_vowel(ph):
    return ph in ("SP", "AP") or DICT_VOWELS.get(ph, False)


DICT_VOWELS = {}
for name in ("dsdict-zh.yaml", "dsdict-en.yaml"):
    with open(os.path.join(VB, "dsdur", name), encoding="utf-8") as f:
        sym = None
        for line in f:
            if line.startswith("entries:"):
                break
            if line.startswith("- symbol:"):
                sym = line.split(":", 1)[1].strip()
            elif line.strip().startswith("type:") and sym:
                DICT_VOWELS[sym] = line.split(":", 1)[1].strip() == "vowel"

with open(EN_DICT, encoding="utf-8") as f:
    EN = json.load(f)
# Readings the dictionary gets wrong for these songs (heteronyms, missing compounds).
EN.update({"wind": ["en/w", "en/ih", "en/n", "en/d"]})
LANG = {"en": 1, "ja": 2, "zh": 3}


def lang_of(ph):
    return LANG.get(ph.split("/", 1)[0], 0) if "/" in ph else 0


def english(notes):
    """English lyrics come one syllable per note ("pave ment"): rejoin fragments into dictionary words,
    then split each word's phonemes back over its notes (one vowel group per written syllable)."""
    frags = [(i, re.sub(r"[^A-Za-z']", "", n["lyric"]).lower()) for i, n in enumerate(notes)
             if n["midi"] is not None and not n["slur"] and not n["tie"] and n["lyric"] and re.search(r"[A-Za-z]", n["lyric"])
             and re.sub(r"[^A-Za-z]", "", n["lyric"]).lower() not in SOLFEGE]
    per_note = {}
    # Vocables written in pinyin (Yi ya lei mei…): when every Latin syllable of the song is pinyin, sing it as Chinese.
    if frags and all(f in DICT for _, f in frags):
        return {i: [(f, DICT[f])] for i, f in frags}
    k = 0
    while k < len(frags):
        for span in (3, 2, 1):
            word = "".join(f for _, f in frags[k:k + span])
            if k + span <= len(frags) and word in EN:
                break
        else:
            raise ValueError(f"no phonemes for English {frags[k][1]!r}")
        part = frags[k:k + span]
        phs = EN[word]
        # syllables: each vowel with the consonants before it; one consonant between vowels starts the
        # next syllable, a cluster leaves its first consonant behind as a coda
        vowels = [j for j, p in enumerate(phs) if DICT_VOWELS.get(p)]
        cuts = [0]
        for a, b in zip(vowels, vowels[1:]):
            gap = b - a - 1
            cuts.append(a + 1 if gap <= 1 else a + 2)
        cuts.append(len(phs))
        sylls = [phs[x:y] for x, y in zip(cuts, cuts[1:]) if y > x]
        # how many syllables each written fragment holds (vowel letter groups), adjusted to the real count
        want = [max(1, len(re.findall(r"[aeiouy]+", f.rstrip("e") or f))) for _, f in part]
        while sum(want) > len(sylls):
            want[want.index(max(want))] -= 1
        while sum(want) < len(sylls):
            want[want.index(min(want))] += 1
        pos = 0
        for (i, f), w in zip(part, want):
            group = [x for syl in sylls[pos:pos + w] for x in syl] if w else []
            pos += w
            per_note[i] = [(f, group)] if group else []
        k += span
    return per_note


def syllables(notes):
    """Attach a pinyin (or several, for 一音多字) to each sung note that starts a syllable.

    Readings come from the whole lyric at once so polyphones get their context."""
    chars, owner = [], []
    for i, n in enumerate(notes):
        if n["midi"] is None or n["slur"] or n["tie"] or not n["lyric"]:
            continue
        text = n["lyric"]
        low = re.sub(r"[^A-Za-z]", "", text).lower()
        if low in SOLFEGE:
            chars.append(("S", SOLFEGE[low]))
            owner.append(i)
            continue
        for ch in HAN.findall(text):
            chars.append(("H", ch))
            owner.append(i)
    han = "".join(c for kind, c in chars if kind == "H")
    readings = iter(lazy_pinyin(han, style=Style.NORMAL, errors="ignore", v_to_u=False, neutral_tone_with_five=False))
    per_note = {}
    for (kind, c), i in zip(chars, owner):
        py = next(readings) if kind == "H" else c
        py = py.replace("ü", "v").replace("ue", "ve") if py.startswith(("l", "n")) and "ue" in py else py.replace("ü", "v")
        if py not in DICT:
            py = {"lo": "luo", "yo": "you", "ng": "en", "n": "en", "m": "mu", "hm": "hen", "hng": "heng"}.get(py, py)
        if py not in DICT:
            raise ValueError(f"no phonemes for {c!r} ({py})")
        per_note.setdefault(i, []).append((c, DICT[py]))
    for i, entry in english(notes).items():
        if entry:
            per_note.setdefault(i, []).extend(entry)
    return per_note


def plan(mel, shift):
    """Notes -> timed phoneme words. Returns tokens, word grouping and per-frame note pitch."""
    beat = 60.0 / mel["bpm"]
    notes = mel["notes"]
    per_note = syllables(notes)
    # Sung events: each syllable (a note may hold several characters) with start/end seconds.
    events = []  # (start, end, midi, phonemes) ; melisma/tie notes extend the previous event
    pitch_notes = []  # (start, end, midi) for the pitch curve, every sounding note
    t = 0.0
    first = None
    for i, n in enumerate(notes):
        dur = n["b"] * beat
        sung = n["midi"] is not None and n["d"] < 8
        if sung:
            midi = n["midi"] + shift
            if n["tie"] and pitch_notes:
                s, _, m = pitch_notes[-1]
                pitch_notes[-1] = (s, t + dur, m)
            else:
                pitch_notes.append((t, t + dur, midi))
            if i in per_note:
                sylls = per_note[i]
                k = len(sylls)
                # 一音多字: split evenly; a trailing 儿 only takes a third.
                weights = [1.0] * k
                if k > 1 and sylls[-1][0] == "儿":
                    weights[-1] = 0.5
                total = sum(weights)
                s = t
                for (c, phs), w in zip(sylls, weights):
                    e = s + dur * w / total
                    events.append([s, e, midi, phs])
                    s = e
                if first is None:
                    first = t
            elif (n["slur"] or n["tie"]) and events and abs(events[-1][1] - t) < 1e-6:
                events[-1][1] = t + dur  # melisma / tie; unslurred notes without lyrics are instrumental (intro, interlude)
        t += dur
    total_end = t
    if first is None:
        raise ValueError("nothing to sing")
    return events, pitch_notes, first, total_end, beat


def frames(sec):
    return int(round(sec * FPS))


def build(mel, shift):
    events, pitch_notes, first, total_end, beat = plan(mel, shift)
    lead = 0.5  # seconds kept before the first sung note (silence, then a breath)
    t0 = first - lead
    end = events[-1][1] + 0.5
    # Phoneme sequence. Each event: consonants (before onset) + vowel(s) (from onset).
    # Gaps between events become SP, or AP (breath) just before an onset after a pause.
    ph, ph_midi, onset_idx = [], [], []  # onset_idx: index of the vowel that starts at each event
    bounds = []  # (phoneme index range of word, word start sec, word end sec)
    cursor = t0
    words = []  # list of (phonemes, midis, start, end) where start is the vowel onset
    # leading silence word
    words.append((["SP"], [events[0][2]], t0, events[0][0] - 0.3))
    words.append((["AP"], [events[0][2]], events[0][0] - 0.3, events[0][0]))
    for k, (s, e, midi, phs) in enumerate(events):
        # onset consonants go before the note; the vowel and any coda (English) are sung from the onset
        lead_n = next((j for j, p in enumerate(phs) if is_vowel(p)), len(phs))
        cons = phs[:lead_n]
        vows = phs[lead_n:]
        if cons:
            # consonants live at the end of the previous word
            pw = words[-1]
            words[-1] = (pw[0] + cons, pw[1] + [midi] * len(cons), pw[2], pw[3])
        nxt = events[k + 1][0] if k + 1 < len(events) else end
        words.append((vows, [midi] * len(vows), s, e))
        gap = nxt - e
        if gap > 0.02:
            if k + 1 < len(events) and gap > 0.25:
                sp = gap - min(0.4, gap * 0.5)
                words.append((["SP"], [midi], e, e + sp))
                words.append((["AP"], [midi], e + sp, nxt))
            else:
                words.append((["SP"], [midi], e, nxt))
        else:
            # snap tiny gaps
            words[-1] = (words[-1][0], words[-1][1], s, nxt)
    # frame boundaries for words
    toks, mids, word_div, word_dur = [], [], [], []
    edges = [frames(w[2] - t0) for w in words] + [frames(end - t0)]
    for w, a, b in zip(words, edges[:-1], edges[1:]):
        toks += w[0]
        mids += w[1]
        word_div.append(len(w[0]))
        word_dur.append(max(1, b - a))
    n_frames = sum(word_dur)
    # duration model
    ids = np.array([[DUR_IDS[p] for p in toks]], dtype=np.int64)
    langs = np.array([[lang_of(p) for p in toks]], dtype=np.int64)
    enc, mask = DUR_LING.run(None, {"tokens": ids, "languages": langs, "word_div": np.array([word_div], np.int64), "word_dur": np.array([word_dur], np.int64)})
    pred = DUR.run(None, {"encoder_out": enc, "x_masks": mask, "ph_midi": np.array([mids], np.int64)})[0][0]
    # fit predicted phoneme durations into each word: vowel(s) first, consonants at the tail
    ph_dur = []
    p = 0
    for wi, (k, wd) in enumerate(zip(word_div, word_dur)):
        seg = list(pred[p:p + k])
        names = toks[p:p + k]
        nv = sum(1 for x in names if is_vowel(x))
        cons_idx = [j for j, x in enumerate(names) if not is_vowel(x)]
        out = [0] * k
        if cons_idx:
            want = [max(1.0, seg[j]) for j in cons_idx]
            # the next syllable's consonants sit in the last note of this word: at most 45% of the word and half of
            # that note, so a short melisma note at the end (悠~ 着) is still sung, not eaten by the 着's zh
            w_start, w_end = words[wi][2], words[wi + 1][2] if wi + 1 < len(words) else end
            last = max([w_start] + [pn[0] for pn in pitch_notes if w_start < pn[0] < w_end])
            cap = max(len(cons_idx), min(int(wd * 0.45), int(frames(w_end - last) * 0.5)))
            scale = min(1.0, cap / sum(want))
            for j, w in zip(cons_idx, want):
                out[j] = max(1, int(round(w * scale)))
        rest = wd - sum(out)
        vidx = [j for j, x in enumerate(names) if is_vowel(x)]
        if rest < len(vidx):  # word too short: shrink consonants
            for j in cons_idx:
                while rest < len(vidx) and out[j] > 1:
                    out[j] -= 1
                    rest += 1
        vw = [max(0.5, seg[j]) for j in vidx]
        acc = 0
        for n, (j, w) in enumerate(zip(vidx, vw)):
            share = rest - acc if n == len(vidx) - 1 else max(1, int(round(rest * w / sum(vw))))
            out[j] = share
            acc += share
        ph_dur += out
        p += k
    assert sum(ph_dur) == n_frames, (sum(ph_dur), n_frames)
    # pitch curve (midi per frame)
    f = np.zeros(n_frames, dtype=np.float64)
    tt = t0 + np.arange(n_frames) / FPS
    idx = 0
    pn = pitch_notes
    for i in range(n_frames):
        while idx + 1 < len(pn) and tt[i] >= pn[idx + 1][0]:
            idx += 1
        f[i] = pn[idx][2] if tt[i] >= pn[0][0] else pn[0][2]
    # glides: smoothstep around each change of pitch, 30 ms before to 50 ms after the onset
    base = f.copy()
    for a, b in zip(pn[:-1], pn[1:]):
        if a[2] == b[2]:
            continue
        ga, gb = b[0] - 0.035, b[0] + 0.05
        sel = (tt >= ga) & (tt < gb)
        x = (tt[sel] - ga) / (gb - ga)
        f[sel] = a[2] + (b[2] - a[2]) * (x * x * (3 - 2 * x))
    # vibrato on notes longer than 0.6 s
    for s, e, m in pn:
        if e - s < 0.6:
            continue
        sel = (tt >= s + 0.3) & (tt < e - 0.05)
        x = tt[sel] - (s + 0.3)
        fade = np.minimum(1.0, x / 0.4)
        f[sel] += 0.22 * fade * np.sin(2 * math.pi * 5.4 * x)
    f0 = 440.0 * 2 ** ((f - 69) / 12)
    # variance (breathiness, voicing)
    vids = np.array([[VAR_IDS[p] for p in toks]], dtype=np.int64)
    pd = np.array([ph_dur], dtype=np.int64)
    venc, _ = VAR_LING.run(None, {"tokens": vids, "languages": langs, "ph_dur": pd})
    zeros = np.zeros((1, n_frames), np.float32)
    br, vo = VAR.run(None, {"encoder_out": venc, "ph_dur": pd, "pitch": f[None].astype(np.float32), "breathiness": zeros, "voicing": zeros,
                             "retake": np.ones((1, n_frames, 2), bool), "steps": np.array(10, np.int64)})
    aids = np.array([[AC_IDS[p] for p in toks]], dtype=np.int64)
    mel_ = ACOUSTIC.run(None, {"tokens": aids, "languages": langs, "durations": pd, "f0": f0[None].astype(np.float32),
                               "breathiness": br.astype(np.float32), "voicing": vo.astype(np.float32),
                               "gender": zeros, "velocity": np.ones((1, n_frames), np.float32),
                               "depth": np.array(0.6, np.float32), "steps": np.array(20, np.int64)})[0]
    wav = VOC.run(None, {"mel": mel_.astype(np.float32), "f0": f0[None].astype(np.float32)})[0][0]
    lead_beats = round(first / beat, 6)  # beats before the first syllable; instrumental intros are not sung
    return wav, lead, lead_beats, f, t0


def main():
    todo = json.load(open(sys.argv[1], encoding="utf-8"))
    out = sys.argv[2]
    only = set(sys.argv[3:])
    os.makedirs(out, exist_ok=True)
    for mel in todo:
        if only and mel["key"] not in only:
            continue
        sung = [n["midi"] for n in mel["notes"] if n["midi"] is not None and n["d"] < 8]
        if not sung:
            print("skip (no sung notes)", mel["key"], mel["name"], flush=True)
            continue
        med = float(np.median(sung))
        # 绮萱 is a child voice: men's tunes are sung an octave up (still in unison with the piano's pitch classes).
        # Written pitch (unison with the piano), except men's-range tunes the child voice cannot reach
        # (median below F#3, e.g. 渔阳鼙鼓动地来, 丑末寅初): those are sung an octave up, same notes.
        shift = 12 if med < 54 else 0
        try:
            wav, offset, lead_beats, _, _ = build(mel, shift)
        except Exception as exc:  # noqa: BLE001
            print("FAIL", mel["key"], mel["book"], mel["name"], repr(exc), flush=True)
            continue
        peak = float(np.max(np.abs(wav))) or 1.0
        wav = wav / peak * 0.89
        sf.write(os.path.join(out, mel["key"] + ".wav"), wav, SR)
        json.dump({"offset": round(offset, 4), "leadBeats": lead_beats, "shift": shift}, open(os.path.join(out, mel["key"] + ".json"), "w"))
        print("ok", mel["key"], mel["book"], mel["name"], f"{len(wav)/SR:.1f}s", "shift", shift, flush=True)


if __name__ == "__main__":
    main()
