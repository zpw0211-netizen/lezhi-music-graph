"""Crop textbook score excerpts listed in content/textbooks/score-manifest.json.

Reads original page scans from ../textbook-scan/<book>/orig/pNN.jpg and writes
grayscale WebP images under public/<out>. Usage: python scripts/crop-scores.py [g7s1 ...]
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SCAN = ROOT.parent / "textbook-scan"
MAX_WIDTH = 1400

manifest = json.loads((ROOT / "content" / "textbooks" / "score-manifest.json").read_text(encoding="utf-8"))
keys = sys.argv[1:] or list(manifest)
for key in keys:
    total = 0
    for stale in (ROOT / "public" / "media" / "scores" / key).glob("*.webp"):
        stale.unlink()
    for item in manifest[key]:
        page = Image.open(next((SCAN / key / "orig").glob(f"p{item['pdfPage']:02d}.*")))
        if item.get("rotate"):
            page = page.rotate(item["rotate"], expand=True)
        w, h = page.size
        x0, y0, x1, y1 = item["box"]
        crop = page.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))
        crop = ImageOps.grayscale(crop)
        if crop.width > MAX_WIDTH:
            crop = crop.resize((MAX_WIDTH, round(crop.height * MAX_WIDTH / crop.width)), Image.LANCZOS)
        out = ROOT / "public" / item["out"]
        out.parent.mkdir(parents=True, exist_ok=True)
        crop.save(out, "WEBP", quality=72, method=6)
        total += out.stat().st_size
    print(f"{key}: {len(manifest[key])} scores, {total / 1024:.0f} KB")
