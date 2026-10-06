import json
import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


key = sys.argv[1]
payload = json.load(sys.stdin)
entries = payload.get("entries", [])
scan_root = Path(r"E:\Projects\textbook-scan") / key / "orig"
output_root = Path(os.environ.get("TEXTBOOK_SCORE_OUTPUT_DIR", r"E:\Projects\.tmp\check")) / key
output_root.mkdir(parents=True, exist_ok=True)

font_path = Path(r"C:\Windows\Fonts\msyh.ttc")
font = ImageFont.truetype(str(font_path), 18) if font_path.exists() else ImageFont.load_default()
cell_width, cell_height = 410, 300
image_area_height = 260
columns, rows_per_sheet = 3, 4
per_sheet = columns * rows_per_sheet
made = 0

for start in range(0, len(entries), per_sheet):
    batch = entries[start : start + per_sheet]
    sheet = Image.new("RGB", (columns * cell_width, rows_per_sheet * cell_height), "#f4eee1")
    draw = ImageDraw.Draw(sheet)
    for index, entry in enumerate(batch):
        pdf_page = int(entry["pdfPage"])
        scan_path = scan_root / f"p{pdf_page:02d}.jpg"
        if not scan_path.exists():
            print(f"谱例所在页的扫描图不存在：{scan_path}", file=sys.stderr)
            continue
        source = Image.open(scan_path).convert("RGB")
        x0, y0, x1, y1 = entry["box"]
        left = max(0, min(source.width, round(x0 * source.width)))
        top = max(0, min(source.height, round(y0 * source.height)))
        right = max(0, min(source.width, round(x1 * source.width)))
        bottom = max(0, min(source.height, round(y1 * source.height)))
        if left >= right or top >= bottom:
            print(f"谱例框为空：{entry.get('name', '未命名')}，PDF 第 {pdf_page} 页", file=sys.stderr)
            continue
        crop = source.crop((left, top, right, bottom))
        rotation = int(entry.get("rotate") or 0)
        if rotation:
            crop = crop.rotate(rotation, expand=True, fillcolor="white")
        crop = ImageOps.contain(crop, (cell_width - 20, image_area_height - 16), method=Image.Resampling.LANCZOS)
        column = index % columns
        row = index // columns
        x = column * cell_width + (cell_width - crop.width) // 2
        y = row * cell_height + (image_area_height - crop.height) // 2
        sheet.paste(crop, (x, y))
        label = f"{entry.get('name', '未命名')} · PDF p.{pdf_page}"
        draw.text((column * cell_width + 10, row * cell_height + image_area_height + 4), label, fill="#1b2622", font=font)
    made += 1
    output_path = output_root / f"scores-{made:02d}.jpg"
    sheet.save(output_path, "JPEG", quality=88, optimize=True)
    print(output_path)

if not entries:
    print("没有谱例框，无需生成联系单。")
