r"""首页（app/components/home/HomePortal.tsx）标题用的楷体字形子集 → public/fonts/home-kai.woff2。

首页改了标题文字、或教材多了新的册名之后重新运行一次：
    python scripts/brand/build-home-font.py
需要 fontTools 和 brotli；字体源文件是 LXGW WenKai Regular（OFL），位置可用 WENKAI_SOURCE 指定。
收的字：首页组件里出现的全部汉字、各版本的册名、大写数字和常用标点。
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(os.environ.get("WENKAI_SOURCE", r"E:\Projects\.tmp\codex2\fonts\LXGWWenKai-Regular.ttf"))
OUTPUT = ROOT / "public" / "fonts" / "home-kai.woff2"
CJK = re.compile(r"[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]")

texts = ["壹贰叁肆伍陆柒捌玖拾卷一二三四五六七八九十上下册年级高中必修简谱五线谱（）·，。、 0123456789"]
texts += CJK.findall((ROOT / "app" / "components" / "home" / "HomePortal.tsx").read_text(encoding="utf-8"))
for books in [ROOT / "data" / "books.json", *sorted((ROOT / "editions").glob("*/data/books.json"))]:
    texts += CJK.findall(json.dumps(json.loads(books.read_text(encoding="utf-8")), ensure_ascii=False))
text = "".join(sorted(set("".join(texts))))

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
print(f"{len(text)} 个字 → {OUTPUT.name} {OUTPUT.stat().st_size} 字节")
