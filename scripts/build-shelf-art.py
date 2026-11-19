# 首页书架的封面小图：art/<册>.webp（1200×750）缩成 art/shelf/<册>.webp（600×375）。
# 书架卡片最宽约 250 像素（悬停放大后），2 倍屏要 500 像素，600 像素的小图看不出差别，
# 文件约为原图的三分之一。首次打开首页时，书架上的原图要下载约 2MB，是第一次访问最大的一块。
#
# 换了或新增了某一册的封面，就重跑一遍：
#   python scripts/build-shelf-art.py
# 构建时 scripts/prepare-github-pages.mjs 会检查每张封面都有对应的小图。
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BOOK_ART = re.compile(r"^(?:(?:pep-|xy-|hc-)?g\d+s\d|hs-m\d+)\.webp$")
SIZE = (600, 375)


def build(art_dir: Path) -> int:
    shelf = art_dir / "shelf"
    count = 0
    for source in sorted(art_dir.iterdir()):
        if not BOOK_ART.match(source.name):
            continue
        target = shelf / source.name
        if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
            continue
        shelf.mkdir(exist_ok=True)
        with Image.open(source) as image:
            image = image.convert("RGB")
            # Same 8:5 crop as the card (object-fit: cover), centred.
            width, height = image.size
            ratio = SIZE[0] / SIZE[1]
            if width / height > ratio:
                crop = round(height * ratio)
                image = image.crop(((width - crop) // 2, 0, (width - crop) // 2 + crop, height))
            elif width / height < ratio:
                crop = round(width / ratio)
                image = image.crop((0, (height - crop) // 2, width, (height - crop) // 2 + crop))
            image.resize(SIZE, Image.LANCZOS).save(target, "WEBP", quality=82, method=6)
        count += 1
        print(f"{target.relative_to(ROOT)}  {target.stat().st_size // 1024} KB")
    return count


def main() -> None:
    dirs = [ROOT / "public" / "art", *sorted((ROOT / "editions").glob("*/public/art"))]
    total = sum(build(d) for d in dirs if d.is_dir())
    print(f"{total} 张小图已更新" if total else "小图都是最新的")


if __name__ == "__main__":
    sys.exit(main())
