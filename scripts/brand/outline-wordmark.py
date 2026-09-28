#!/usr/bin/env python3
"""Build the 芽谱 brand SVGs from the two LXGW WenKai glyph outlines.

Usage:
  python scripts/brand/outline-wordmark.py \
    --font E:/Projects/.tmp/codex2/fonts/LXGWWenKai-Regular.ttf

fontTools is only used while generating the SVG. The font itself is not copied
into the repository.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont


INK = "#1C2B26"
SPROUT = "#3E9B4F"
MARK = f"""<path d="M24 67 C27 58 38 55 47 60 C48 67 43 74 35 77 C29 76 25 72 24 67Z" fill="{INK}"/>
<path d="M45 66 V28" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>
<path d="M45 32 C35 16 23 14 17 17 C19 29 30 36 45 34Z" fill="{SPROUT}"/>
<path d="M45 31 C49 16 63 9 77 12 C74 25 63 33 45 34Z" fill="{SPROUT}"/>"""


def svg_root(width: int, height: int, title: str, contents: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title">
  <title id="title">{title}</title>
  {contents}
</svg>
'''


def outlined_wordmark(font_path: Path) -> str:
    font = TTFont(font_path)
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    units_per_em = font["head"].unitsPerEm
    scale = 86 / units_per_em
    cursor = 0.0
    word_start = 120.0
    baseline = 97.0
    paths: list[str] = []

    for index, char in enumerate("芽谱"):
        glyph_name = cmap.get(ord(char))
        if glyph_name is None:
            raise ValueError(f"The supplied font has no glyph for {char} (U+{ord(char):04X}).")

        pen = SVGPathPen(glyph_set)
        glyph_set[glyph_name].draw(pen)
        bounds_pen = BoundsPen(glyph_set)
        glyph_set[glyph_name].draw(bounds_pen)
        if bounds_pen.bounds is None:
            raise ValueError(f"The glyph outline for {char} is empty.")

        x_min, _, _, y_max = bounds_pen.bounds
        x_offset = word_start + cursor - x_min * scale
        y_offset = baseline + y_max * scale
        paths.append(
            f'  <path d="{pen.getCommands()}" transform="translate({x_offset:.3f} {y_offset:.3f}) scale({scale:.7f} {-scale:.7f})" fill="{INK}"/>'
        )
        advance_width, _ = font["hmtx"].metrics[glyph_name]
        cursor += advance_width * scale
        if index == 0:
            cursor += 8

    if word_start + cursor > 300:
        raise ValueError("The outlined wordmark does not fit its 310px canvas.")
    return "\n".join(paths)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--font", required=True, type=Path, help="Path to the local LXGW WenKai Regular TTF")
    parser.add_argument("--brand-dir", type=Path, default=Path("public/brand"))
    parser.add_argument("--favicon", type=Path, default=Path("public/favicon.svg"))
    args = parser.parse_args()
    if not args.font.is_file():
        parser.error(f"font file not found: {args.font}")

    args.brand_dir.mkdir(parents=True, exist_ok=True)
    mark_svg = svg_root(96, 96, "芽谱图形标记", f'  <g>{MARK}</g>')
    wordmark = outlined_wordmark(args.font)
    logo_svg = svg_root(310, 112, "芽谱", f'  <g transform="translate(8 8)">{MARK}</g>\n{wordmark}')
    args.brand_dir.joinpath("mark.svg").write_text(mark_svg, encoding="utf-8", newline="\n")
    args.brand_dir.joinpath("logo.svg").write_text(logo_svg, encoding="utf-8", newline="\n")
    args.favicon.parent.mkdir(parents=True, exist_ok=True)
    args.favicon.write_text(mark_svg.replace("芽谱图形标记", "芽谱"), encoding="utf-8", newline="\n")
    print(f"Wrote {args.brand_dir / 'mark.svg'} and {args.brand_dir / 'logo.svg'} plus {args.favicon}")


if __name__ == "__main__":
    main()
