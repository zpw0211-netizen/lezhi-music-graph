"""Render five-line PDF crops approved by title matching or explicit visual corrections."""
import argparse
import hashlib
import json
import os
from pathlib import Path

import fitz
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[3]
EDITION = ROOT / "editions" / "renjiao-staff"
PDF_DIR = Path(os.environ.get("RENJIAO_STAFF_PDF_DIR", r"D:\人教版新教材1-9年级（五线谱）"))
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


def read_manifest(path):
    source = path.read_text(encoding="utf-8")
    prefix = "export default "
    if prefix not in source:
        raise ValueError(f"Missing JSON-compatible default export in {path}")
    payload = source.split(prefix, 1)[1].strip()
    if payload.endswith(";"):
        payload = payload[:-1]
    return json.loads(payload)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--books", nargs="+", help="Regenerate only these pep-* book keys; retain other audited assets")
    selected = set(parser.parse_args().books or [])
    maps = sorted((EDITION / "scripts").glob("wx-pep-*.mjs"))
    if len(maps) != 14:
        raise RuntimeError(f"Expected 14 wx-pep maps, found {len(maps)}")
    total_images = total_bytes = total_crops = skipped = 0
    output_root = (EDITION / "public" / "media" / "scores").resolve()
    expected_files = set()
    existing_path = EDITION / "data" / "wx-pep-crop-assets.json"
    asset_manifest = [a for a in json.loads(existing_path.read_text(encoding="utf-8")) if a["bookKey"] not in selected] if selected else []
    expected_files.update((EDITION / a["file"]).resolve() for a in asset_manifest)
    known_keys = {read_manifest(p)["bookKey"] for p in maps}
    if selected - known_keys:
        raise ValueError(f"Unknown book keys: {selected - known_keys}")

    for map_path in maps:
        manifest = read_manifest(map_path)
        if selected and manifest["bookKey"] not in selected:
            continue
        pdf_path = PDF_DIR / manifest["sourcePdf"]
        if not pdf_path.exists():
            raise FileNotFoundError(pdf_path)
        document = fitz.open(pdf_path)
        output_dir = EDITION / "public" / "media" / "scores" / manifest["bookKey"]
        book_images = book_bytes = book_crops = 0

        for work in manifest["works"]:
            crops = work["staffScoreCrops"]
            if not crops:
                if work["jianpuScoreCrops"]:
                    skipped += 1
                continue
            for index, crop_data in enumerate(crops, start=1):
                if len(crop_data) < 5:
                    raise ValueError(f"Malformed crop mapping: {manifest['bookKey']} {work['title']}")
                printed_page, x0, y0, x1, y1 = crop_data[:5]
                pdf_page = printed_page + manifest["pdfOffset"]
                if not 1 <= pdf_page <= len(document):
                    raise ValueError(f"{manifest['bookKey']} {work['title']}: PDF page {pdf_page} is out of range")
                page = document[pdf_page - 1]
                pixmap = page.get_pixmap(matrix=fitz.Matrix(3.5, 3.5), alpha=False)
                image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
                width, height = image.size
                crop = ImageOps.grayscale(image.crop((round(x0 * width), round(y0 * height), round(x1 * width), round(y1 * height))))
                if crop.width > MAX_WIDTH:
                    crop = crop.resize((MAX_WIDTH, round(crop.height * MAX_WIDTH / crop.width)), Image.Resampling.LANCZOS)
                output_dir.mkdir(parents=True, exist_ok=True)
                output = output_dir / f"{stable_hash(work['title'])}-{index}.webp"
                if not output.resolve().is_relative_to(output_root):
                    raise RuntimeError(f"Output escaped staff crop directory: {output}")
                crop.save(output, "WEBP", quality=78, method=6)
                size = output.stat().st_size
                expected_files.add(output.resolve())
                asset_manifest.append({
                    "bookKey": manifest["bookKey"],
                    "title": work["title"],
                    "printedPage": printed_page,
                    "file": output.relative_to(EDITION).as_posix(),
                    "bytes": size,
                    "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
                })
                book_bytes += size
                book_images += 1
                book_crops += 1
        document.close()
        total_images += book_images
        total_bytes += book_bytes
        total_crops += book_crops
        print(f"{manifest['bookKey']}: {book_images} verified crops, {book_bytes / 1024:.0f} KB")

    removed_stale = 0
    if output_root.exists():
        for stale in output_root.rglob("*.webp"):
            resolved = stale.resolve()
            if output_root not in resolved.parents:
                raise RuntimeError(f"Unexpected path outside crop output directory: {stale}")
            if resolved not in expected_files:
                stale.unlink()
                removed_stale += 1

    asset_manifest.sort(key=lambda a: (a["bookKey"], a["printedPage"], a["file"]))

    manifest_path = EDITION / "data" / "wx-pep-crop-assets.json"
    manifest_path.write_text(json.dumps(asset_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({"books": len(maps), "images": total_images, "cropMappings": total_crops, "unverifiedCandidateWorksSkipped": skipped, "staleImagesRemoved": removed_stale, "assetManifest": str(manifest_path), "bytes": total_bytes}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
