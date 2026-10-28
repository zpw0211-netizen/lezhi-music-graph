"""Download the 绮萱 voicebank and the vocoder into .vocal/ (or $VOCAL_HOME) and build the phoneme dictionaries.

python scripts/vocal/setup.py      (about 900 MB; needs github.com release downloads)
"""
import json
import sys
import urllib.request
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from paths import EN_DICT, HOME, RIA, VOCODER, VOCODER_2024, VOICEBANK, ZH_DICT  # noqa: E402

VOICEBANK_URL = "https://github.com/yqzhishen/qixuan-diffsinger/releases/download/v2.7.0/Qixuan_v2.7.0_DiffSinger_OpenUtau.zip"
RIA_URL = "https://github.com/RibosomeK/RiaDiffSinger/releases/download/v0.4-lynxnet/Ria-v0.4-lynxnet.zip"
VOCODER_2024_URL = ("https://github.com/openvpi/vocoders/releases/download/nsf-hifigan-44.1k-hop512-128bin-2024.02/"
                    "nsf_hifigan_44.1k_hop512_128bin_2024.02.oudep")
VOCODER_URL = ("https://github.com/openvpi/vocoders/releases/download/pc-nsf-hifigan-44.1k-hop512-128bin-2025.02/"
               "pc_nsf_hifigan_44.1k_hop512_128bin_2025.02.oudep")


def fetch(url, dest):
    if dest.exists():
        return
    print("downloading", url)
    tmp = dest.with_suffix(".part")
    urllib.request.urlretrieve(url, tmp)
    tmp.rename(dest)


def read_dict(path):
    """DiffSinger dsdict.yaml entries → {grapheme: [phonemes]} (a plain parser: the files are 14–28 MB)."""
    entries, current, inside = {}, None, False
    for line in path.open(encoding="utf-8"):
        if line.startswith("entries:"):
            inside = True
        elif inside and line.startswith("- grapheme:"):
            current = line.split(":", 1)[1].strip().strip("\"'")
            entries[current] = []
        elif inside and line.startswith("  - "):
            entries[current].append(line[4:].strip())
    return entries


HOME.mkdir(parents=True, exist_ok=True)
if not VOICEBANK.exists():
    archive = HOME / "qixuan.zip"
    fetch(VOICEBANK_URL, archive)
    zipfile.ZipFile(archive).extractall(HOME)
    archive.unlink()
if not VOCODER.exists():
    archive = HOME / "vocoder.oudep"
    fetch(VOCODER_URL, archive)
    zipfile.ZipFile(archive).extractall(VOCODER.parent)
    archive.unlink()
if not RIA.exists():
    archive = HOME / "ria.zip"
    fetch(RIA_URL, archive)
    RIA.mkdir()
    zipfile.ZipFile(archive).extractall(RIA)
    archive.unlink()
if not VOCODER_2024.exists():
    archive = HOME / "vocoder24.oudep"
    fetch(VOCODER_2024_URL, archive)
    zipfile.ZipFile(archive).extractall(VOCODER_2024.parent)
    archive.unlink()
for name, target in (("dsdict-zh.yaml", ZH_DICT), ("dsdict-en.yaml", EN_DICT)):
    if not target.exists():
        target.write_text(json.dumps(read_dict(VOICEBANK / "dsdur" / name), ensure_ascii=False), encoding="utf-8")
print("ready:", HOME)
