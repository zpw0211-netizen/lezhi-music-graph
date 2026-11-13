r"""全站标题用的楷体 → public/fonts/yapu-kai.woff2（界面字）、yapu-kai-units.woff2（单元名用字）和 yapu-kai-ext.woff2（扩展字）。

界面文字、册名、单元名或作品名有较大增补之后重新运行一次：
    python scripts/brand/build-site-font.py
需要 fontTools 和 brotli；字体源文件是 LXGW WenKai Regular（OFL），位置可用 WENKAI_SOURCE 指定。
界面字：界面组件里出现的汉字、各版本册名、拉丁字母、数字和标点，每页都会用到。
单元名用字：各册单元标题里多出来的字。
扩展字：教材数据和谱例里出现的其余汉字，加上 GB2312 一级字；浏览器只在标题里出现这些字时才下载。
"""
from __future__ import annotations

import os
import re
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(os.environ.get("WENKAI_SOURCE", r"E:\Projects\.tmp\codex2\fonts\LXGWWenKai-Regular.ttf"))
FONTS = ROOT / "public" / "fonts"
CJK = re.compile(r"[\u4e00-\u9fff]")


def collect(patterns: list[str]) -> set[str]:
    found: set[str] = set()
    for pattern in patterns:
        for file in ROOT.glob(pattern):
            if file.is_file() and file.stat().st_size < 60_000_000:
                found |= set(CJK.findall(file.read_text(encoding="utf-8", errors="ignore")))
    return found


def gb2312_level1() -> set[str]:
    out: set[str] = set()
    for high in range(0xB0, 0xD8):
        for low in range(0xA1, 0xFF):
            try:
                out.add(bytes([high, low]).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    return out


def subset(text: str, output: Path) -> None:
    font = TTFont(SOURCE)
    options = Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = [1, 2, 3, 4, 6]
    subsetter = Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(output)
    print(f"{len(text)} 个字 → {output.name} {output.stat().st_size} 字节")


BASIC = "".join(chr(code) for code in range(0x20, 0x7F)) + "　、。·—…‘’“”《》「」『』（），：；？！～♪♩♭♯×→←↑↓▶▷✓＋－"
core = collect(["app/components/**/*.tsx", "app/*.tsx", "data/books.json", "editions/*/data/books.json"])
core |= set("壹贰叁肆伍陆柒捌玖拾")
units = collect(["public/data/units.json", "editions/*/data/units.json"]) - core
rest = (collect(["app/**/*.ts", "app/**/*.tsx", "data/*.json", "editions/*/data/*.json", "public/data/*.json"]) | gb2312_level1()) - core - units

subset(BASIC + "".join(sorted(core)), FONTS / "yapu-kai.woff2")
subset("".join(sorted(units)), FONTS / "yapu-kai-units.woff2")
subset("".join(sorted(rest)), FONTS / "yapu-kai-ext.woff2")
