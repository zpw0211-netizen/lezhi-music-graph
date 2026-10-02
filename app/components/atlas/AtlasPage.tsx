"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { publicAssetUrl } from "../../lib/app/assets";
import { SlidingIndicator } from "../graph/SlidingIndicator";
import {
  AtlasScene,
  type AtlasMode,
  type AtlasRegion,
  type AtlasTerrain,
  type AtlasWork,
} from "./atlasScene";

type AtlasDataFile = {
  regions: Array<{
    regionId: string;
    name: string;
    type: "china" | "country";
    works: AtlasWork[];
  }>;
};
type AtlasPoint = { id: string; name: string; lat: number; lon: number };
type AtlasTerrainFile = AtlasTerrain & { lon1: number; lat0: number };
type AtlasAssets = {
  atlas: AtlasDataFile;
  provinces: AtlasPoint[];
  countries: AtlasPoint[];
  terrain: AtlasTerrainFile;
  elevations: Float32Array;
  relief: HTMLImageElement;
  mask: HTMLImageElement;
};
type HoverCard = { region: AtlasRegion; x: number; y: number } | null;

const BOOK_LABELS: Record<string, string> = {
  g7s1: "七上",
  g7s2: "七下",
  g8s1: "八上",
  g8s2: "八下",
  g9s1: "九上",
  g9s2: "九下",
};

function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then((response) => {
    if (!response.ok) throw new Error(`读取地图资料失败（${response.status}）`);
    return response.json() as Promise<T>;
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("地形纹理加载失败"));
    image.src = url;
    if (image.complete && image.naturalWidth > 0) resolve(image);
  });
}

function decodeElevation(image: HTMLImageElement, terrain: AtlasTerrain) {
  const canvas = document.createElement("canvas");
  canvas.width = terrain.cols;
  canvas.height = terrain.rows;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("无法读取高程网格");
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0, terrain.cols, terrain.rows);
  const pixels = context.getImageData(0, 0, terrain.cols, terrain.rows).data;
  const elevations = new Float32Array(terrain.cols * terrain.rows);
  const range = terrain.vmax - terrain.vmin;
  for (let index = 0; index < elevations.length; index += 1) {
    const offset = index * 4;
    const encoded = pixels[offset] * 256 + pixels[offset + 1];
    elevations[index] = (encoded / 65535) * range + terrain.vmin;
  }
  return elevations;
}

function interpolateElevation(
  terrain: AtlasTerrain,
  values: Float32Array,
  longitude: number,
  latitude: number,
) {
  const x = Math.max(0, Math.min(terrain.cols - 1.001, (longitude - terrain.lon0) / terrain.step));
  const y = Math.max(0, Math.min(terrain.rows - 1.001, (terrain.lat1 - latitude) / terrain.step));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const at = (column: number, row: number) => values[row * terrain.cols + column];
  return (
    (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) +
    (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy
  );
}

function regionWorks(atlas: AtlasDataFile, pointId: string) {
  return atlas.regions.find((region) => region.regionId === pointId)?.works ?? [];
}

function pointRegions(assets: AtlasAssets): AtlasRegion[] {
  return [
    ...assets.countries.map((point) => ({
      ...point,
      mode: "world" as const,
      works: regionWorks(assets.atlas, point.id),
    })),
    ...assets.provinces.map((point) => ({
      ...point,
      mode: "china" as const,
      works: regionWorks(assets.atlas, point.id),
    })),
  ];
}

function selectedWorks(region: AtlasRegion, filter: string) {
  if (filter === "全部") return region.works;
  const field = region.mode === "world" ? "type" : "genre";
  return region.works.filter((work) => work[field] === filter);
}

function labelForPage(bookKey: string, page: number | null, printedPage?: number | null) {
  const book = BOOK_LABELS[bookKey] ?? bookKey;
  // 明确区分「教材页」与「PDF 页」：印刷页来自正式数据 media 标题，PDF 页来自 firstPage。
  // 印刷页拿不到就不冒充，只显示 PDF 页。
  if (printedPage != null) {
    return page != null && page !== printedPage
      ? `${book} · 教材第 ${printedPage} 页（PDF 第 ${page} 页）`
      : `${book} · 教材第 ${printedPage} 页`;
  }
  return page == null ? book : `${book} · PDF 第 ${page} 页`;
}

function shortUnit(unit: string | null) {
  return unit?.replace(/^第[一二三四五六七八九十]+单元\s*/, "") || "教材拓展";
}

export function AtlasPage({ onOpenWork }: { onOpenWork: (title: string) => void }) {
  const [assets, setAssets] = useState<AtlasAssets | null>(null);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState<AtlasMode>("world");
  const [filter, setFilter] = useState("全部");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exaggeration, setExaggeration] = useState(14);
  const [contours, setContours] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const [hoverCard, setHoverCard] = useState<HoverCard>(null);
  const sceneRef = useRef<AtlasScene | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    let active = true;
    const dataUrl = (name: string) => publicAssetUrl(`data/atlas/${name}`);
    Promise.all([
      fetchJson<AtlasDataFile>(publicAssetUrl("data/atlas.json")),
      fetchJson<AtlasPoint[]>(dataUrl("provinces.json")),
      fetchJson<AtlasPoint[]>(dataUrl("countries.json")),
      fetchJson<AtlasTerrainFile>(dataUrl("china-meta.json")),
      loadImage(dataUrl("china-height.png")),
      loadImage(dataUrl("world-relief.webp")),
      loadImage(dataUrl("world-mask.png")),
    ])
      .then(([atlas, provinces, countries, terrain, heightImage, relief, mask]) => {
        const elevations = decodeElevation(heightImage, terrain);
        if (!active) return;
        setAssets({ atlas, provinces, countries, terrain, elevations, relief, mask });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "地图资料暂时无法读取");
      });
    return () => {
      active = false;
    };
  }, []);

  const regions = useMemo(() => (assets ? pointRegions(assets) : []), [assets]);
  const modeRegions = useMemo(
    () => regions.filter((region) => region.mode === mode),
    [mode, regions],
  );
  const selectedRegion = useMemo(
    () => modeRegions.find((region) => region.id === selectedId) ?? null,
    [modeRegions, selectedId],
  );
  const visibleWorksByRegion = useMemo(
    () => new Map(modeRegions.map((region) => [region.id, selectedWorks(region, filter)])),
    [filter, modeRegions],
  );
  const chipOptions = useMemo(() => {
    const counts = new Map<string, number>();
    const field = mode === "world" ? "type" : "genre";
    for (const region of modeRegions) {
      for (const work of region.works) {
        const label = work[field];
        if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }
    return [
      "全部",
      ...[...counts.entries()]
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "zh-CN"))
        .map(([label]) => label),
    ];
  }, [mode, modeRegions]);
  const sortedLocations = useMemo(
    () =>
      [...modeRegions].sort(
        (left, right) =>
          (visibleWorksByRegion.get(right.id)?.length ?? 0) -
            (visibleWorksByRegion.get(left.id)?.length ?? 0) ||
          left.name.localeCompare(right.name, "zh-CN"),
      ),
    [modeRegions, visibleWorksByRegion],
  );
  const altitudeRank = useMemo(() => {
    if (!assets || mode !== "china") return [];
    return modeRegions
      .map((region) => ({
        region,
        elevation: Math.max(
          0,
          Math.round(
            interpolateElevation(assets.terrain, assets.elevations, region.lon, region.lat),
          ),
        ),
        count: visibleWorksByRegion.get(region.id)?.length ?? 0,
      }))
      .filter((entry) => entry.count > 0)
      .sort((left, right) => right.elevation - left.elevation || right.count - left.count)
      .slice(0, 6);
  }, [assets, mode, modeRegions, visibleWorksByRegion]);

  useEffect(() => {
    if (!assets || !canvasRef.current || !overlayRef.current || !stageRef.current) return;
    let scene: AtlasScene | null = null;
    let readyFrame = 0;
    try {
      scene = new AtlasScene({
        canvas: canvasRef.current,
        overlay: overlayRef.current,
        stage: stageRef.current,
        terrain: assets.terrain,
        elevations: assets.elevations,
        textures: { relief: assets.relief, mask: assets.mask },
        regions,
        reducedMotion: reducedMotionRef.current,
        callbacks: {
          onSelect: (regionId) => {
            setSelectedId(regionId);
            setHoverCard(null);
          },
          onHover: (region, x, y) => {
            setHoverCard(region ? { region, x, y } : null);
          },
          onContextLost: () => setWebglAvailable(false),
        },
      });
      sceneRef.current = scene;
      readyFrame = window.requestAnimationFrame(() => setWebglAvailable(true));
    } catch {
      window.cancelAnimationFrame(readyFrame);
      scene?.dispose();
      sceneRef.current = null;
      readyFrame = window.requestAnimationFrame(() => setWebglAvailable(false));
    }
    return () => {
      window.cancelAnimationFrame(readyFrame);
      scene?.dispose();
      if (sceneRef.current === scene) sceneRef.current = null;
    };
  }, [assets, regions]);

  useEffect(() => sceneRef.current?.setMode(mode), [mode]);
  useEffect(() => sceneRef.current?.setFilter(filter), [filter]);
  useEffect(() => sceneRef.current?.setSelection(selectedId), [selectedId]);
  useEffect(() => sceneRef.current?.setExaggeration(exaggeration), [exaggeration]);
  useEffect(() => sceneRef.current?.setContours(contours), [contours]);
  useEffect(() => {
    if (!sceneRef.current) return;
    const matchingRegions = modeRegions.filter(
      (region) => (visibleWorksByRegion.get(region.id)?.length ?? 0) > 0,
    );
    sceneRef.current.frameRegions(matchingRegions);
  }, [filter, mode, modeRegions, visibleWorksByRegion]);

  const selectRegion = (regionId: string) => {
    setSelectedId(regionId);
    setHoverCard(null);
    sceneRef.current?.setSelection(regionId);
  };
  const changeMode = (nextMode: AtlasMode) => {
    if (mode === nextMode) return;
    setMode(nextMode);
    setFilter("全部");
    setSelectedId(null);
    setHoverCard(null);
  };
  const changeFilter = (nextFilter: string) => {
    setFilter(nextFilter);
    if (selectedRegion && selectedWorks(selectedRegion, nextFilter).length === 0) {
      setSelectedId(null);
      sceneRef.current?.setSelection(null);
    }
    const remaining = modeRegions.filter((region) => selectedWorks(region, nextFilter).length > 0);
    sceneRef.current?.setFilter(nextFilter);
    sceneRef.current?.frameRegions(remaining);
  };

  const openWork = (work: AtlasWork) => {
    onOpenWork(work.name.replace(/[《》]/g, ""));
  };

  const totalVisibleWorks = modeRegions.reduce(
    (total, region) => total + (visibleWorksByRegion.get(region.id)?.length ?? 0),
    0,
  );

  return (
    <main className="atlas-page" aria-labelledby="atlas-title">
      <section className="atlas-intro">
        <p className="atlas-kicker">音 乐 地 图</p>
        <h1 id="atlas-title">作品从哪里来</h1>
        <p className="atlas-lede">
          教材里的歌来自四面八方。转动地球，点一根光柱；再切到中国地势，在真实的高程起伏上看看作品标点落在哪里。
        </p>
        <div className="atlas-segment" role="group" aria-label="地图范围">
          <span
            className={`atlas-segment-ink${mode === "china" ? " is-china" : ""}`}
            aria-hidden="true"
          />
          <SlidingIndicator activeKey={mode} />
          <button type="button" aria-pressed={mode === "world"} onClick={() => changeMode("world")}>
            世界
          </button>
          <button type="button" aria-pressed={mode === "china"} onClick={() => changeMode("china")}>
            中国地势
          </button>
        </div>

        <div className="atlas-filters" role="group" aria-label={mode === "world" ? "按作品类型筛选" : "按体裁筛选"}>
          {chipOptions.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => changeFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>

        {mode === "china" && (
          <div className="atlas-controls">
            <label className="atlas-exaggeration">
              <span>地势夸张</span>
              <input
                type="range"
                min="4"
                max="30"
                value={exaggeration}
                aria-label="地势夸张倍数"
                onChange={(event) => setExaggeration(Number(event.currentTarget.value))}
              />
              <span className="atlas-multiplier">{exaggeration}×</span>
            </label>
            <label className="atlas-contour-toggle">
              <input
                type="checkbox"
                checked={contours}
                onChange={(event) => setContours(event.currentTarget.checked)}
              />
              等高线
            </label>
          </div>
        )}

        <div className="atlas-panel" aria-live="polite">
          {loadError ? (
            <p className="atlas-panel-hint" role="alert">{loadError}</p>
          ) : !assets ? (
            <p className="atlas-panel-hint" role="status">正在读取地图资料…</p>
          ) : selectedRegion ? (
            <>
              <h2>{selectedRegion.name}</h2>
              <p className="atlas-count">
                {(visibleWorksByRegion.get(selectedRegion.id)?.length ?? 0)} 部教材作品
                {filter !== "全部" ? `（${filter}）` : ""}
              </p>
              {selectedRegion.mode === "china" && (
                <div className="atlas-elevation">
                  <strong>
                    {Math.max(
                      0,
                      Math.round(
                        interpolateElevation(
                          assets.terrain,
                          assets.elevations,
                          selectedRegion.lon,
                          selectedRegion.lat,
                        ),
                      ),
                    ).toLocaleString("zh-CN")} 米
                  </strong>
                  <span>该标点处海拔</span>
                </div>
              )}
              {selectedRegion.mode === "china" && selectedWorks(selectedRegion, filter)[0] && (
                <p className="atlas-fact">
                  《{selectedWorks(selectedRegion, filter)[0].name.replace(/[《》]/g, "")}》对应的地区标点：
                  {selectedRegion.name}，海拔
                  {Math.max(
                    0,
                    Math.round(
                      interpolateElevation(
                        assets.terrain,
                        assets.elevations,
                        selectedRegion.lon,
                        selectedRegion.lat,
                      ),
                    ),
                  ).toLocaleString("zh-CN")} 米。
                </p>
              )}
              <ul className="atlas-works">
                {(visibleWorksByRegion.get(selectedRegion.id) ?? []).map((work, index) => (
                  <li key={`${work.bookKey}:${work.id}`} style={{ "--atlas-order": index } as CSSProperties}>
                    <button type="button" className="atlas-work-link" onClick={() => openWork(work)}>
                      <span className="atlas-work-heading">
                        <strong>《{work.name.replace(/[《》]/g, "")}》</strong>
                        <span>{labelForPage(work.bookKey, work.page, work.printedPage)}</span>
                      </span>
                      <small>
                        {work.type}
                        {work.genre ? ` · ${work.genre}` : ""}
                        {` · ${shortUnit(work.unit)}`}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : mode === "world" ? (
            <p className="atlas-panel-hint">
              已标出 {modeRegions.filter((region) => (visibleWorksByRegion.get(region.id)?.length ?? 0) > 0).length} 个国家，
              共 {totalVisibleWorks} 部作品。光柱越高，教材中对应这里的作品越多。
            </p>
          ) : (
            <>
              <p className="atlas-panel-hint">
                作品来源地点位处的海拔排行（{totalVisibleWorks} 部作品）：
              </p>
              <ol className="atlas-rank">
                {altitudeRank.map(({ region, elevation, count }) => (
                  <li key={region.id}>
                    <button type="button" onClick={() => selectRegion(region.id)}>
                      <strong>{region.name}</strong>
                      <span>{elevation.toLocaleString("zh-CN")} 米 · {count} 首</span>
                    </button>
                  </li>
                ))}
                {!altitudeRank.length && <li className="atlas-empty-rank">当前筛选没有对应地点。</li>}
              </ol>
            </>
          )}
        </div>

        <p className="atlas-note">
          地形数据来源：AWS Terrain Tiles（SRTM、GMTED2010、ETOPO1 等公共领域高程数据）。
          本图为示意图，不表示国界、省界，也不用于划界或导航。
        </p>
      </section>

      <section className="atlas-map-column" aria-label="地图与地点列表">
        <section
          className="atlas-stage"
          ref={stageRef}
          aria-label="三维音乐地图，可拖动旋转；中国地势视图可倾斜、缩放"
        >
          <canvas ref={canvasRef} className="atlas-map-canvas" aria-label="三维地形地图画布" />
          <canvas ref={overlayRef} className="atlas-marker-canvas" aria-hidden="true" />
          <div className="atlas-stage-heading" aria-hidden="true">
            {mode === "world" ? "世界" : "中国 · 地势浮雕"}
          </div>
          <div className="atlas-stage-caption atlas-stage-caption-left" aria-hidden="true">
            <span className="atlas-light-key" />光柱越高，来自这里的作品越多
          </div>
          <div className="atlas-stage-caption atlas-stage-caption-right" aria-hidden="true">
            拖动旋转{mode === "china" ? " · 滚轮缩放" : ""} · 点击光柱
          </div>
          {hoverCard && (
            <div
              className="atlas-tooltip"
              style={{ left: hoverCard.x, top: hoverCard.y }}
              role="status"
            >
              {hoverCard.region.name} · {selectedWorks(hoverCard.region, filter).length} 首
            </div>
          )}
          {webglAvailable === false && (
            <div className="atlas-fallback" role="status">
              当前浏览器不能显示三维地图。可用下方地点按钮查看作品。
            </div>
          )}
          {webglAvailable === null && assets && !loadError && (
            <div className="atlas-loading" role="status">正在准备地形画布…</div>
          )}
          {loadError && <div className="atlas-fallback" role="alert">{loadError}</div>}
        </section>
        <section className="atlas-places" aria-labelledby="atlas-places-title">
          <div className="atlas-places-heading">
            <h2 id="atlas-places-title">{mode === "world" ? "国家" : "省区标点"}</h2>
            <span>{sortedLocations.length} 个地点</span>
          </div>
          <ul className="atlas-location-list">
            {sortedLocations.map((region) => {
              const count = visibleWorksByRegion.get(region.id)?.length ?? 0;
              return (
                <li key={region.id}>
                  <button
                    type="button"
                    aria-pressed={selectedId === region.id}
                    onFocus={() => sceneRef.current?.setHover(region.id)}
                    onBlur={() => sceneRef.current?.setHover(null)}
                    onMouseEnter={() => sceneRef.current?.setHover(region.id)}
                    onMouseLeave={() => sceneRef.current?.setHover(null)}
                    onClick={() => selectRegion(region.id)}
                  >
                    <span>{region.name}</span>
                    <small>{count} 首</small>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </section>
    </main>
  );
}
