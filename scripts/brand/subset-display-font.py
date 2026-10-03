r"""Create the LXGW WenKai subset for shared display text and page data names.

Run only through build-display-font.mjs with WENKAI_REBUILD=1 and
WENKAI_PYTHON set to an E: or D: interpreter that already has fontTools and
brotli. This script does not install packages or write Python bytecode caches.
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
OUTPUT = Path(os.environ.get("WENKAI_OUTPUT", str(ROOT / "public" / "fonts" / "wenkai-display.woff2")))
FIXED_TEXT = """
芽谱六卷教材一张音乐知识图从一首歌出发读懂音乐里的连接教材目录六卷画卷每一册都从单元篇章展开点开卷轴继续学习人音版册年级学期第打开这册听见音阶五声实验室点按宫商角徵羽听听五个音如何连成旋律继续探索从不同方向看音乐研究说明研究分析音乐地图作品年表知识图谱按课学习智能问答搜索作品人物乐理或教材内容个知识节点条知识关系试着搜索黄河京剧民歌五声调式歌唱祖国打开一段五声旋律翻开这一册上行再下行人音版册目录册别作品创作单元卷七八九上册下册壹贰叁肆伍陆柒捌玖拾"""
CJK_TEXT = re.compile(r"[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]")
DISPLAY_MARKUP = re.compile(r"<(?:h[1-6]|strong|b)\b[^>]*>(.*?)</(?:h[1-6]|strong|b)\s*>", re.IGNORECASE | re.DOTALL)


def collect_display_names(value: object, texts: list[str]) -> None:
    if isinstance(value, list):
        for item in value:
            collect_display_names(item, texts)
    elif isinstance(value, dict):
        for key, item in value.items():
            if key in {"name", "title"} and isinstance(item, str):
                texts.append(item)
            else:
                collect_display_names(item, texts)


def collect_text() -> str:
    texts = [FIXED_TEXT]
    app_source = ROOT / "app"
    for source_path in app_source.rglob("*"):
        if source_path.is_file() and source_path.suffix in {".jsx", ".tsx"}:
            source = source_path.read_text(encoding="utf-8")
            for match in DISPLAY_MARKUP.finditer(source):
                texts.extend(CJK_TEXT.findall(match.group(1)))

    public_data = ROOT / "public" / "data"
    display_data = [
        public_data / "graph-index.json",
        public_data / "timeline.json",
        public_data / "units.json",
        *sorted((public_data / "atlas").glob("*.json")),
    ]
    for data_path in display_data:
        if data_path.is_file():
            collect_display_names(json.loads(data_path.read_text(encoding="utf-8")), texts)

    units = json.loads((public_data / "units.json").read_text(encoding="utf-8"))
    for unit in units:
        for key in ("name", "title", "numeral", "theme"):
            if isinstance(unit.get(key), str):
                texts.append(unit[key])
        for goal in unit.get("goals", []):
            if isinstance(goal, str):
                texts.append(goal)
        for task in unit.get("tasks", []):
            if isinstance(task, dict):
                if isinstance(task.get("text"), str):
                    texts.append(task["text"])
                texts.extend(str(item) for item in task.get("focus", []))
        for work in unit.get("works", []):
            if isinstance(work, dict) and isinstance(work.get("name"), str):
                texts.append(work["name"])
    return "".join(texts)


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"LXGW WenKai source TTF not found: {SOURCE}")
    chars = "".join(sorted(set(collect_text())))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    font = TTFont(SOURCE, recalcTimestamp=False)
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
