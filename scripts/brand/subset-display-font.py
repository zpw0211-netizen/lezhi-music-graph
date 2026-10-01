r"""Create the LXGW WenKai display subset used by the homepage.

Run only through build-display-font.mjs with WENKAI_REBUILD=1 and
WENKAI_PYTHON set to an E: or D: interpreter that already has fontTools and
brotli. This script does not install packages or write Python bytecode caches.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(os.environ.get("WENKAI_SOURCE", r"E:\Projects\.tmp\codex2\fonts\LXGWWenKai-Regular.ttf"))
OUTPUT = Path(os.environ.get("WENKAI_OUTPUT", str(ROOT / "public" / "fonts" / "wenkai-display.woff2")))
FIXED_TEXT = """
芽谱六卷教材一张音乐知识图从一首歌出发读懂音乐里的连接教材目录六卷画卷每一册都从单元篇章展开点开卷轴继续学习人音版册年级学期第打开这册听见音阶五声实验室点按宫商角徵羽听听五个音如何连成旋律继续探索从不同方向看音乐研究说明研究分析音乐地图作品年表知识图谱按课学习智能问答搜索作品人物乐理或教材内容个知识节点条知识关系试着搜索黄河京剧民歌五声调式歌唱祖国打开一段五声旋律人音版册目录册别作品创作单元卷七八九上册下册壹贰叁肆伍陆柒捌玖拾"""
UNITS_PATH = ROOT / "public" / "data" / "units.json"
INDEX_PATH = ROOT / "public" / "data" / "graph-index.json"


def collect_text() -> str:
    texts = [FIXED_TEXT]
    for value in json.loads(UNITS_PATH.read_text(encoding="utf-8")):
        for key in ("name", "title", "numeral", "theme"):
            item = value.get(key)
            if isinstance(item, str):
                texts.append(item)
        for goal in value.get("goals", []):
            if isinstance(goal, str):
                texts.append(goal)
        for task in value.get("tasks", []):
            if isinstance(task, dict):
                for key in ("text",):
                    if isinstance(task.get(key), str):
                        texts.append(task[key])
                texts.extend(str(item) for item in task.get("focus", []))
        for work in value.get("works", []):
            if isinstance(work, dict) and isinstance(work.get("name"), str):
                texts.append(work["name"])
    index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    for book in index.get("dataset", {}).get("books", []):
        if isinstance(book.get("title"), str):
            texts.append(book["title"])
    graph = index.get("canonicalGraph", {})
    for entity in graph.get("entities", []):
        if entity.get("type") in {"音乐作品", "歌曲", "民歌", "器乐曲", "戏曲歌曲", "戏曲选段", "舞蹈音乐", "影视音乐", "交响作品", "合唱作品", "歌剧音乐", "进行曲", "朗诵作品"}:
            if isinstance(entity.get("name"), str):
                texts.append(entity["name"])
    return "".join(texts)


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"LXGW WenKai source TTF not found: {SOURCE}")
    chars = "".join(sorted(set(collect_text())))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    font = TTFont(SOURCE)
    options = Options()
    options.flavor = "woff2"
    options.recommended_glyphs = True
    options.layout_features = ["*"]
    subsetter = Subsetter(options=options)
    subsetter.populate(text=chars)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(OUTPUT)
    size = OUTPUT.stat().st_size
    if size > 350 * 1024:
        raise RuntimeError(f"WOFF2 subset exceeds 350 KB: {size} bytes")
    print(f"FONT_SUBSET_OK chars={len(chars)} bytes={size}")


if __name__ == "__main__":
    main()
