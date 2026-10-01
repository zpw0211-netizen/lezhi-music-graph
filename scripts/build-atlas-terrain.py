"""Build the static terrain textures used by the atlas WebGL scene.

Only the AWS Terrain Tiles Terrarium PNG endpoint is downloaded. Tile cache is
kept in E:/Projects/.tmp/codex3/tiles and committed outputs go to
public/data/atlas. No boundary or coastline geometry is generated.
"""

from concurrent.futures import ThreadPoolExecutor
import json
import math
import os
from pathlib import Path
import time
import urllib.request

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "data" / "atlas"
CACHE = Path(r"E:\Projects\.tmp\codex3\tiles")
TERRAIN_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"


def fetch_tile(zoom: int, x: int, y: int) -> np.ndarray:
    CACHE.mkdir(parents=True, exist_ok=True)
    tile_path = CACHE / f"{zoom}_{x}_{y}.png"
    if not tile_path.exists():
        request = urllib.request.Request(
            TERRAIN_URL.format(z=zoom, x=x, y=y),
            headers={"User-Agent": "YapuAtlasTerrain/1.0"},
        )
        for attempt in range(4):
            try:
                with urllib.request.urlopen(request, timeout=40) as response:
                    payload = response.read()
                if not payload.startswith(b"\x89PNG\r\n\x1a\n"):
                    raise ValueError("Terrain tile source returned a non-PNG response")
                tile_path.write_bytes(payload)
                break
            except Exception:
                if attempt == 3:
                    raise
                time.sleep(0.5 * (attempt + 1))
    with Image.open(tile_path) as image:
        rgb = np.asarray(image.convert("RGB"), dtype=np.float64)
    if rgb.shape[:2] != (256, 256):
        raise ValueError(f"Unexpected tile size {rgb.shape[:2]} for {tile_path.name}")
    return rgb[..., 0] * 256.0 + rgb[..., 1] + rgb[..., 2] / 256.0 - 32768.0


def mosaic(zoom: int, x0: int, x1: int, y0: int, y1: int) -> np.ndarray:
    jobs = [(zoom, x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
    with ThreadPoolExecutor(max_workers=8) as executor:
        tiles = list(executor.map(lambda item: fetch_tile(*item), jobs))
    tile_width = x1 - x0 + 1
    rows = [
        np.concatenate(tiles[index : index + tile_width], axis=1)
        for index in range(0, len(tiles), tile_width)
    ]
    return np.concatenate(rows, axis=0)


def mercator_sample(
    pixels: np.ndarray,
    zoom: int,
    tile_x0: int,
    tile_y0: int,
    longitude: np.ndarray,
    latitude: np.ndarray,
) -> np.ndarray:
    world_pixels = 256 * (2**zoom)
    px = (longitude + 180.0) / 360.0 * world_pixels - tile_x0 * 256
    clipped_lat = np.radians(np.clip(latitude, -85.0511, 85.0511))
    py = (
        (1 - np.log(np.tan(clipped_lat) + 1 / np.cos(clipped_lat)) / math.pi)
        / 2
        * world_pixels
        - tile_y0 * 256
    )
    px = np.clip(px, 0, pixels.shape[1] - 1.001)
    py = np.clip(py, 0, pixels.shape[0] - 1.001)
    x0 = np.floor(px).astype(int)
    y0 = np.floor(py).astype(int)
    fx = px - x0
    fy = py - y0
    a = pixels[y0, x0]
    b = pixels[y0, x0 + 1]
    c = pixels[y0 + 1, x0]
    d = pixels[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def tile_x(longitude: float, zoom: int) -> int:
    return int(math.floor((longitude + 180) / 360 * (2**zoom)))


def tile_y(latitude: float, zoom: int) -> int:
    radians = math.radians(latitude)
    return int(
        math.floor(
            (1 - math.log(math.tan(radians) + 1 / math.cos(radians)) / math.pi)
            / 2
            * (2**zoom)
        )
    )


def palette(values: np.ndarray, stops: list[tuple[float, str]]) -> np.ndarray:
    def channels(color: str) -> list[int]:
        value = color.removeprefix("#")
        return [int(value[index : index + 2], 16) for index in (0, 2, 4)]

    positions = [stop[0] for stop in stops]
    colors = np.asarray([channels(stop[1]) for stop in stops], dtype=np.float64)
    output = np.empty(values.shape + (3,), dtype=np.float64)
    for channel in range(3):
        output[..., channel] = np.interp(
            values, positions, colors[:, channel]
        )
    return output


def build_china_grid() -> None:
    lon0, lon1, lat0, lat1, step = 70.0, 137.0, 14.0, 56.0, 0.125
    zoom = 5
    x0, x1 = tile_x(lon0, zoom), tile_x(lon1, zoom)
    y0, y1 = tile_y(lat1, zoom), tile_y(lat0, zoom)
    print(f"China tiles: {x1 - x0 + 1} x {y1 - y0 + 1}", flush=True)
    terrain = mosaic(zoom, x0, x1, y0, y1)

    columns = int(round((lon1 - lon0) / step)) + 1
    rows = int(round((lat1 - lat0) / step)) + 1
    longitudes = lon0 + np.arange(columns) * step
    latitudes = lat1 - np.arange(rows) * step
    grid_lon, grid_lat = np.meshgrid(longitudes, latitudes)
    elevations = mercator_sample(terrain, zoom, x0, y0, grid_lon, grid_lat)
    elevations = np.clip(elevations, -500, 9000)
    encoded = np.round((elevations + 500) / 9500 * 65535).astype(np.uint16)
    rgb = np.stack(
        [
            (encoded >> 8).astype(np.uint8),
            (encoded & 255).astype(np.uint8),
            np.zeros_like(encoded, dtype=np.uint8),
        ],
        axis=-1,
    )
    Image.fromarray(rgb, "RGB").save(OUT / "china-height.png", optimize=True)
    metadata = {
        "lon0": lon0,
        "lon1": lon1,
        "lat0": lat0,
        "lat1": lat1,
        "step": step,
        "cols": columns,
        "rows": rows,
        "vmin": -500,
        "vmax": 9000,
    }
    (OUT / "china-meta.json").write_text(
        json.dumps(metadata, separators=(",", ":")) + "\n", encoding="utf-8"
    )
    print(
        f"China grid: {columns} x {rows}; max sampled elevation: "
        f"{float(elevations.max()):.0f} m",
        flush=True,
    )


def build_world_relief() -> None:
    zoom = 3
    terrain = mosaic(zoom, 0, (2**zoom) - 1, 0, (2**zoom) - 1)
    width, height = 2048, 1024
    longitude = np.linspace(-180, 180, width, endpoint=False) + 180 / width
    latitude = np.linspace(90, -90, height, endpoint=False) - 90 / height
    grid_lon, grid_lat = np.meshgrid(longitude, latitude)
    elevation = mercator_sample(terrain, zoom, 0, 0, grid_lon, grid_lat)

    dx = 111000.0 * (360.0 / width) * np.maximum(
        np.cos(np.radians(grid_lat)), 0.05
    )
    dy = 111000.0 * (180.0 / height)
    land_elevation = np.maximum(elevation, 0)
    dz_east = np.gradient(land_elevation, axis=1) / dx
    dz_north = -np.gradient(land_elevation, axis=0) / dy
    exaggeration = 7.0
    normal_x = -exaggeration * dz_east
    normal_y = -exaggeration * dz_north
    normal_z = np.ones_like(land_elevation)
    normal_length = np.sqrt(normal_x**2 + normal_y**2 + normal_z**2)
    azimuth, altitude = math.radians(315), math.radians(42)
    light = (
        math.cos(altitude) * math.sin(azimuth),
        math.cos(altitude) * math.cos(azimuth),
        math.sin(altitude),
    )
    shade = np.clip(
        (normal_x * light[0] + normal_y * light[1] + normal_z * light[2])
        / normal_length,
        0,
        1,
    )
    shade = 0.62 + 0.9 * (shade - math.sin(altitude))

    land_colors = palette(
        np.clip(elevation, 0, 9000),
        [
            (0, "#5a7448"),
            (200, "#6f8a52"),
            (600, "#9aa367"),
            (1200, "#b39a63"),
            (2000, "#a17f57"),
            (3200, "#86694f"),
            (4500, "#b8a99b"),
            (6000, "#e9e4da"),
            (8000, "#fbf9f4"),
        ],
    ) * shade[..., None]
    sea_colors = palette(
        np.clip(elevation, -9000, 0),
        [
            (-9000, "#04101c"),
            (-4500, "#08233a"),
            (-2000, "#0d3550"),
            (-200, "#135069"),
            (0, "#1f6f80"),
        ],
    )
    image = np.where((elevation > 0)[..., None], land_colors, sea_colors)
    polar_fade = np.clip((np.abs(grid_lat) - 83.0) / 2.0, 0, 1)[..., None]
    polar_color = np.asarray([201, 214, 216], dtype=np.float64)
    image = image * (1 - polar_fade) + polar_color * polar_fade
    image[np.abs(grid_lat) > 85.05] = polar_color

    relief = np.clip(image, 0, 255).astype(np.uint8)
    land_mask = np.where(elevation > 0, 255, 0).astype(np.uint8)
    Image.fromarray(relief, "RGB").save(
        OUT / "world-relief.webp", format="WEBP", quality=80, method=6
    )
    Image.fromarray(land_mask, "L").save(OUT / "world-mask.png", optimize=True)
    print(f"World relief: {width} x {height}; mask generated", flush=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    build_china_grid()
    build_world_relief()
    outputs = sorted(OUT.iterdir())
    total_bytes = sum(path.stat().st_size for path in outputs if path.is_file())
    print(
        json.dumps(
            {
                "files": {path.name: path.stat().st_size for path in outputs},
                "totalBytes": total_bytes,
                "totalKiB": round(total_bytes / 1024, 1),
                "limitBytes": 500 * 1024,
            },
            ensure_ascii=False,
            indent=2,
        ),
        flush=True,
    )
    if total_bytes > 500 * 1024:
        raise SystemExit("Atlas data directory exceeds 500 KiB")


if __name__ == "__main__":
    main()
