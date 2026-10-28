"""Shared locations. Models and intermediate files live outside git, in .vocal/ (or $VOCAL_HOME)."""
import os
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
HOME = Path(os.environ.get("VOCAL_HOME", REPO / ".vocal"))
VOICEBANK = HOME / "Qixuan_v2.7.0_DiffSinger_OpenUtau"
VOCODER = HOME / "vocoder" / "pc_nsf_hifigan_44.1k_hop512_128bin_2025.02.onnx"
# male voice Ria/狸安 v0.4 (lynxnet) and the vocoder it was trained with
RIA = HOME / "ria"
VOCODER_2024 = HOME / "vocoder24" / "nsf_hifigan_44.1k_hop512_128bin_2024.02.onnx"
ZH_DICT = HOME / "zhdict.json"
EN_DICT = HOME / "endict.json"
WORK = HOME / "work"
MANIFEST = REPO / "app" / "lib" / "lesson" / "vocal-manifest.json"
AUDIO = REPO / "public" / "audio" / "vocal"
