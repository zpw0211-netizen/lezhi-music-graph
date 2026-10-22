"""Compare the copied PEP work/page catalogue against supplied staff-notation PDFs."""
import json
import os
import re
import unicodedata
from collections import Counter
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[3]
EDITION = ROOT / "editions" / "renjiao-staff"
PDF_DIR = Path(os.environ.get("RENJIAO_STAFF_PDF_DIR", r"D:\人教版新教材1-9年级（五线谱）"))
BOOKS = json.loads((EDITION / "data" / "books.json").read_text(encoding="utf-8"))
WORK_INDEX = json.loads((EDITION / "data" / "wx-pep-work-index.json").read_text(encoding="utf-8"))
MANUAL_OVERRIDES = json.loads((EDITION / "data" / "wx-pep-manual-page-overrides.json").read_text(encoding="utf-8"))
NUMERALS = "零一二三四五六七八九"
FULL_PAGE_CROP = [0.04, 0.035, 0.96, 0.94]


def normalize(value):
    value = str(value).replace("《", "").replace("》", "")
    return "".join(ch for ch in value if not ch.isspace() and not unicodedata.category(ch).startswith(("P", "Z")))


def contains_title(text, title, allow_pinyin_fallback=False):
    target = normalize(title)
    if target and target in normalize(text):
        return "strict"
    if allow_pinyin_fallback and not re.search(r"[A-Za-z0-9]", title):
        # The printed book sometimes inserts Latin pinyin between the Chinese title characters.
        is_cjk = lambda ch: "\u3400" <= ch <= "\u4dbf" or "\u4e00" <= ch <= "\u9fff" or "\uf900" <= ch <= "\ufaff"
        loose_target = "".join(ch for ch in target if is_cjk(ch))
        loose_text = "".join(ch for ch in normalize(text) if is_cjk(ch))
        if loose_target and loose_target in loose_text:
            return "pinyin-stripped"
    return None


def find_pdf(book):
    grade = NUMERALS[book["grade"]]
    volume = book["semester"]
    candidates = [p for p in PDF_DIR.glob("*.pdf") if "五线谱" in p.name and f"{grade}年级" in p.name and volume in p.name]
    if len(candidates) != 1:
        raise RuntimeError(f"{book['key']}: expected one five-line PDF for {book['title']}, found {[p.name for p in candidates]}")
    return candidates[0]


def crop_fields(crop):
    if not isinstance(crop, list) or len(crop) < 5:
        return None
    page, x0, y0, x1, y1 = crop[:5]
    if not isinstance(page, int) or not all(isinstance(value, (int, float)) for value in (x0, y0, x1, y1)):
        return None
    if not (0 <= x0 < x1 <= 1 and 0 <= y0 < y1 <= 1):
        return None
    return [page, x0, y0, x1, y1]


def footer_page_candidates(page):
    width, height = page.rect.width, page.rect.height
    candidates = []
    for word in page.get_text("words"):
        x0, y0, x1, y1, value = word[:5]
        if not value.isdigit() or not 0.90 <= y0 / height <= 0.96:
            continue
        if x0 / width <= 0.16 or x1 / width >= 0.84:
            candidates.append(int(value))
    return sorted(set(candidates))


def main():
    registry = {book["key"]: book for book in BOOKS["books"]}
    index_registry = {book["key"]: book for book in WORK_INDEX["books"]}
    output = {"sourceDirectory": str(PDF_DIR), "books": []}
    if set(registry) != set(index_registry):
        raise RuntimeError("books.json and work index book keys differ")

    for key, book in registry.items():
        indexed = index_registry[key]
        pdf_path = find_pdf(book)
        document = fitz.open(pdf_path)
        raw_texts = [page.get_text() for page in document]
        footer_candidates = {physical: footer_page_candidates(page) for physical, page in enumerate(document, start=1)}
        offset_counts = Counter(physical - printed for physical, values in footer_candidates.items() for printed in values)
        detected_offset = offset_counts.most_common(1)[0][0] if offset_counts else book["pdfOffset"]
        footer_labels = [(physical, physical - detected_offset) for physical, values in footer_candidates.items()
                         if physical - detected_offset in values]
        offset_mismatches = [(physical, values) for physical, values in footer_candidates.items()
                             if values and physical - detected_offset not in values]
        scanned_printed_pages = max((printed for _, printed in footer_labels), default=book["pages"])
        cover_text = normalize(" ".join(raw_texts[:4]))
        cover_checks = {
            "fiveLineNotation": "五线谱" in cover_text,
            "pepPublisher": "人民教育出版社" in cover_text,
        }
        offset = detected_offset
        usable_printed_pages = max(0, min(scanned_printed_pages, len(document) - offset))
        works = []

        for work in indexed["works"]:
            title = normalize(work["title"])
            if not title:
                continue
            allow_pinyin_fallback = not re.search(r"[A-Za-z0-9]", work["title"])
            methods = {}
            matches = []
            for printed in range(1, usable_printed_pages + 1):
                method = contains_title(raw_texts[printed + offset - 1], work["title"], allow_pinyin_fallback)
                if method:
                    matches.append(printed)
                    methods[printed] = method
            candidate_pages = [page for page in work["pages"] if 1 <= page <= usable_printed_pages]
            exact_pages = [page for page in candidate_pages if page in matches]
            if exact_pages:
                staff_pages = exact_pages
                page_status = "matched"
            elif len(matches) == 1:
                staff_pages = matches
                page_status = "moved"
            elif len(matches) > 1:
                staff_pages = []
                page_status = "ambiguous"
            else:
                staff_pages = []
                page_status = "missing"

            valid_crops = [crop_fields(crop) for crop in work["scoreCrops"]]
            valid_crops = [crop for crop in valid_crops if crop is not None]
            verified_crops = [[crop[0], *FULL_PAGE_CROP] for crop in valid_crops
                              if 1 <= crop[0] <= usable_printed_pages and
                              contains_title(raw_texts[crop[0] + offset - 1], work["title"], allow_pinyin_fallback)]
            relocated_crops = []
            if not verified_crops and len(matches) == 1 and valid_crops:
                relocated_crops = [[matches[0], *FULL_PAGE_CROP]]

            manual = MANUAL_OVERRIDES.get(key, {}).get(work["title"])
            manual_note = None
            if manual:
                manual_pages = manual["staffPages"]
                if not manual_pages or any(page not in matches for page in manual_pages):
                    raise RuntimeError(f"Manual page override is not present in extracted PDF text: {key} {work['title']} {manual_pages} / {matches}")
                staff_pages = manual_pages
                page_status = "manual"
                manual_note = manual["note"]
                manual_crop_pages = manual.get("scoreCropPages", [])
                if manual_crop_pages:
                    if not valid_crops:
                        raise RuntimeError(f"Manual crop override has no baseline crop geometry: {key} {work['title']}")
                    manual_crops = [[page, *FULL_PAGE_CROP] for page in manual_crop_pages]
                    for crop in manual_crops:
                        if not 1 <= crop[0] <= usable_printed_pages or not contains_title(raw_texts[crop[0] + offset - 1], work["title"], allow_pinyin_fallback):
                            raise RuntimeError(f"Manual crop page does not contain the work title: {key} {work['title']} {crop[0]}")
                    verified_crops = manual_crops
                    relocated_crops = []

            works.append({
                "title": work["title"],
                "units": work["units"],
                "jianpuPages": work["pages"],
                "matchedPages": matches,
                "staffPages": staff_pages,
                "pageStatus": page_status,
                "matchMethods": {str(page): methods[page] for page in matches},
                "scoreCropCandidates": valid_crops,
                "verifiedScoreCrops": verified_crops or relocated_crops,
                "cropStatus": "verified" if (verified_crops or relocated_crops) else ("not-mapped" if not work["scoreCrops"] else "unverified"),
                "manualNote": manual_note,
            })

        output["books"].append({
            "key": key,
            "title": book["fullName"],
            "sourcePdf": pdf_path.name,
            "pdfPath": str(pdf_path),
            "pdfPageCount": len(document),
            "sourceRegistryPageCount": book["pages"],
            "printedPageCount": scanned_printed_pages,
            "usablePrintedPageCount": usable_printed_pages,
            "pdfOffset": offset,
            "sourceRegistryPdfOffset": book["pdfOffset"],
            "numberedPageCount": len(footer_labels),
            "footerOffsetMismatches": offset_mismatches,
            "coverChecks": cover_checks,
            "works": works,
        })
        document.close()

    out = EDITION / "data" / "wx-pep-scan-audit.json"
    out.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    summary = {
        "out": str(out),
        "books": len(output["books"]),
        "pdfsValid": sum(all(item["coverChecks"].values()) for item in output["books"]),
        "footerOffsetsConsistent": sum(not item["footerOffsetMismatches"] for item in output["books"]),
        "booksWithPageCountChanges": sum(item["printedPageCount"] != item["sourceRegistryPageCount"] for item in output["books"]),
        "works": sum(len(book["works"]) for book in output["books"]),
        "matched": sum(work["pageStatus"] == "matched" for book in output["books"] for work in book["works"]),
        "moved": sum(work["pageStatus"] == "moved" for book in output["books"] for work in book["works"]),
        "ambiguous": sum(work["pageStatus"] == "ambiguous" for book in output["books"] for work in book["works"]),
        "missing": sum(work["pageStatus"] == "missing" for book in output["books"] for work in book["works"]),
        "verifiedScoreCrops": sum(work["cropStatus"] == "verified" for book in output["books"] for work in book["works"]),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
