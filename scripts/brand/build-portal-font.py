r"""入口页（portal/index.html）标题用的楷体字形子集 → portal/portal-kai.woff2。

入口页改了标题文字之后重新运行一次：
    python scripts/brand/build-portal-font.py
需要 fontTools 和 brotli；字体源文件是 LXGW WenKai Regular（OFL），位置可用 WENKAI_SOURCE 指定。
只收 h1–h3 和带 kai 类名的元素里的字，所以文件很小。
"""
from __future__ import annotations

import os
import re
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(os.environ.get("WENKAI_SOURCE", r"E:\Projects\.tmp\codex2\fonts\LXGWWenKai-Regular.ttf"))
PAGE = ROOT / "portal" / "index.html"
OUTPUT = ROOT / "portal" / "portal-kai.woff2"

html = PAGE.read_text(encoding="utf-8")
body = html[html.index("<body"):]
parts = re.findall(r"<h[1-3]\b[^>]*>(.*?)</h[1-3]>", body, re.S)
parts += [inner for _, inner in re.findall(r"<(\w+)\b[^>]*class=\"[^\"]*\bkai\b[^\"]*\"[^>]*>(.*?)</\1>", body, re.S)]
# .facts b 也用楷体。
parts += re.findall(r"<li><b>(.*?)</b>", body, re.S)
text = "".join(sorted(set(re.sub(r"<[^>]+>|\s", "", "".join(parts)))))

font = TTFont(SOURCE)
options = Options()
options.flavor = "woff2"
options.layout_features = ["*"]
options.name_IDs = [1, 2, 3, 4, 6]
subsetter = Subsetter(options)
subsetter.populate(text=text)
subsetter.subset(font)
font.flavor = "woff2"
font.save(OUTPUT)
print(f"{len(text)} 个字 → {OUTPUT.name} {OUTPUT.stat().st_size} 字节：{text}")
