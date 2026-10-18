"""Create compact score images from the original 人教版 textbook PDFs.

Usage: python editions/renjiao/scripts/crop-score-pdfs.py [pep-g1s1 ...]
Set RENJIAO_PDF_DIR when the PDFs are stored outside the default E:/Projects/textbook-scan/renjiao-pdfs folder.
"""
import json
import os
import re
from pathlib import Path

import fitz
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[3]
EDITION = ROOT / "editions" / "renjiao"
PDF_DIR = Path(os.environ.get("RENJIAO_PDF_DIR", r"E:\Projects\textbook-scan\renjiao-pdfs"))
BOOKS = json.loads((EDITION / "data" / "books.json").read_text(encoding="utf-8"))
SCORE_PAGES = json.loads((EDITION / "data" / "lesson-scores.json").read_text(encoding="utf-8"))
CHINESE = "零一二三四五六七八九"
MAX_WIDTH = 1400


def base36(value):
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    result = ""
    while value:
        value, remainder = divmod(value, 36)
        result = digits[remainder] + result
    return result or "0"


def stable_hash(value):
    result = 2166136261
    for char in value:
        result = ((result ^ ord(char)) * 16777619) & 0xFFFFFFFF
    return base36(result)


registry = {book["key"]: book for book in BOOKS["books"]}
requested = set(os.sys.argv[1:] or SCORE_PAGES.keys())
unknown = requested - SCORE_PAGES.keys()
if unknown:
    raise SystemExit(f"No score crop data for: {', '.join(sorted(unknown))}")

for key in sorted(requested):
    book = registry[key]
    match = re.fullmatch(r"pep-g([1-9])s([12])", key)
    grade, semester = int(match[1]), match[2]
    volume = "上册" if semester == "1" else "下册"
    pdf_path = PDF_DIR / f"{grade}音乐（简谱）{CHINESE[grade]}年级{volume}.pdf"
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)
    document = fitz.open(pdf_path)
    output_dir = EDITION / "public" / "media" / "scores" / key
    total_bytes = 0
    total_images = 0

    for title, crops in SCORE_PAGES[key].items():
        for index, (printed_page, x0, y0, x1, y1) in enumerate(crops, start=1):
            pdf_page = printed_page + book["pdfOffset"]
            if not 1 <= pdf_page <= len(document):
                raise ValueError(f"{key} {title}: PDF page {pdf_page} is out of range")
            page = document[pdf_page - 1]
            pixmap = page.get_pixmap(matrix=fitz.Matrix(3.5, 3.5), alpha=False)
            image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            width, height = image.size
            crop = image.crop((round(x0 * width), round(y0 * height), round(x1 * width), round(y1 * height)))
            crop = ImageOps.grayscale(crop)
            if crop.width > MAX_WIDTH:
                crop = crop.resize((MAX_WIDTH, round(crop.height * MAX_WIDTH / crop.width)), Image.Resampling.LANCZOS)

            output_dir.mkdir(parents=True, exist_ok=True)
            output = output_dir / f"{stable_hash(title)}-{index}.webp"
            crop.save(output, "WEBP", quality=78, method=6)
            total_bytes += output.stat().st_size
            total_images += 1

    print(f"{key}: {total_images} score images, {total_bytes / 1024:.0f} KB")
