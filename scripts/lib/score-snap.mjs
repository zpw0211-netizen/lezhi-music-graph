/**
 * Pixel-only score-row detector and conservative crop snapping helpers.
 *
 * The detector is intentionally dependency-free so the same function can run
 * against Canvas ImageData in Chromium and synthetic RGBA fixtures in test-lib.
 */
export function detectScoreBlocks(rgba, width, height) {
  if (!rgba || !Number.isInteger(width) || !Number.isInteger(height) || width < 8 || height < 8) {
    return { blocks: [], lines: [] };
  }

  const pixels = width * height;
  if (rgba.length < pixels * 4) return { blocks: [], lines: [] };

  const dark = new Uint8Array(pixels);
  const colored = new Uint8Array(pixels);
  const rowCounts = new Uint32Array(height);
  const xStart = Math.floor(width * 0.02);
  const xEnd = Math.ceil(width * 0.98);
  const yStart = Math.floor(height * 0.01);
  const yEnd = Math.ceil(height * 0.99);

  for (let y = yStart; y < yEnd; y += 1) {
    let ink = 0;
    for (let x = xStart; x < xEnd; x += 1) {
      const offset = (y * width + x) * 4;
      const red = rgba[offset];
      const green = rgba[offset + 1];
      const blue = rgba[offset + 2];
      const high = Math.max(red, green, blue);
      const low = Math.min(red, green, blue);
      const saturation = high - low;
      const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
      const index = y * width + x;

      if (saturation > 46 && luminance < 244) colored[index] = 1;
      if (saturation <= 58 && luminance < 166) {
        dark[index] = 1;
        ink += 1;
      }
    }
    rowCounts[y] = ink;
  }

  const rowThreshold = Math.max(2, Math.floor(width * 0.0009));
  const mergeGap = Math.max(2, Math.round(height * 0.002));
  const bands = [];
  let activeStart = -1;
  let activeEnd = -1;
  for (let y = yStart; y < yEnd; y += 1) {
    if (rowCounts[y] >= rowThreshold) {
      if (activeStart < 0) activeStart = y;
      activeEnd = y;
    } else if (activeStart >= 0 && y - activeEnd > mergeGap) {
      bands.push({ y0: activeStart, y1: activeEnd + 1 });
      activeStart = -1;
      activeEnd = -1;
    }
  }
  if (activeStart >= 0) bands.push({ y0: activeStart, y1: activeEnd + 1 });

  const analyzedBands = [];
  for (const band of bands) {
    const bandHeight = band.y1 - band.y0;
    if (bandHeight < 2 || bandHeight > height * 0.09) continue;

    let minX = width;
    let maxX = -1;
    let darkCount = 0;
    const columnCounts = new Uint16Array(width);
    for (let y = band.y0; y < band.y1; y += 1) {
      for (let x = xStart; x < xEnd; x += 1) {
        if (!dark[y * width + x]) continue;
        columnCounts[x] += 1;
        darkCount += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    if (maxX <= minX) continue;

    const span = maxX - minX + 1;
    const density = darkCount / (span * bandHeight);
    let localColorCount = 0;
    for (let y = band.y0; y < band.y1; y += 1) {
      for (let x = minX; x <= maxX; x += 1) localColorCount += colored[y * width + x];
    }
    const colorRatio = localColorCount / (span * bandHeight);
    const xCoverage = span / width;
    const strongThreshold = Math.max(3, Math.ceil(bandHeight * 0.58));
    const strongRuns = [];
    let runStart = -1;
    for (let x = minX; x <= maxX + 1; x += 1) {
      const strong = x <= maxX && columnCounts[x] >= strongThreshold;
      if (strong && runStart < 0) runStart = x;
      if (!strong && runStart >= 0) {
        const runEnd = x;
        const runWidth = runEnd - runStart;
        if (runWidth <= 5) strongRuns.push({ x0: runStart, x1: runEnd });
        runStart = -1;
      }
    }

    const separatedRuns = [];
    for (const run of strongRuns) {
      const previous = separatedRuns.at(-1);
      if (!previous || run.x0 - previous.x1 >= Math.max(4, Math.floor(height * 0.002))) {
        separatedRuns.push(run);
      }
    }

    let horizontalTicks = 0;
    const horizontalMin = Math.max(6, Math.floor(width * 0.006));
    for (let y = band.y0; y < band.y1; y += 1) {
      let length = 0;
      for (let x = minX; x <= maxX + 1; x += 1) {
        if (x <= maxX && dark[y * width + x]) {
          length += 1;
        } else {
          if (length >= horizontalMin) horizontalTicks += 1;
          length = 0;
        }
      }
    }

    const scoreEvidence = separatedRuns.length;
    const likelyScoreLine =
      xCoverage >= 0.17 &&
      density >= 0.006 &&
      density <= 0.31 &&
      colorRatio <= 0.16 &&
      scoreEvidence >= 4 &&
      (horizontalTicks >= 2 || scoreEvidence >= 7);

    analyzedBands.push({
      ...band,
      x0: minX,
      x1: maxX + 1,
      span,
      density,
      colorRatio,
      xCoverage,
      evidence: scoreEvidence,
      horizontalTicks,
      likelyScoreLine,
    });
  }

  const scoreLines = analyzedBands.filter((band) => band.likelyScoreLine);
  if (!scoreLines.length) return { blocks: [], lines: [] };

  const verticalJoin = Math.max(34, Math.round(height * 0.085));
  const groups = [];
  for (const line of scoreLines) {
    const matching = groups.find((group) => {
      const verticalGap = line.y0 > group.y1 ? line.y0 - group.y1 : group.y0 - line.y1;
      const overlap = Math.max(0, Math.min(line.x1, group.x1) - Math.max(line.x0, group.x0));
      const minSpan = Math.min(line.x1 - line.x0, group.x1 - group.x0);
      return verticalGap <= verticalJoin && overlap / Math.max(1, minSpan) >= 0.18;
    });
    if (matching) {
      matching.lines.push(line);
      matching.x0 = Math.min(matching.x0, line.x0);
      matching.x1 = Math.max(matching.x1, line.x1);
      matching.y0 = Math.min(matching.y0, line.y0);
      matching.y1 = Math.max(matching.y1, line.y1);
    } else {
      groups.push({ x0: line.x0, x1: line.x1, y0: line.y0, y1: line.y1, lines: [line] });
    }
  }

  const blocks = groups.map((group) => {
    const core = { ...group };
    const coreWidth = core.x1 - core.x0;
    const attached = [];
    for (const band of analyzedBands) {
      if (band.likelyScoreLine) continue;
      const gapAbove = core.y0 - band.y1;
      const gapBelow = band.y0 - core.y1;
      const gap = gapAbove >= 0 ? gapAbove : gapBelow;
      if (gapAbove < 0 && gapBelow < 0) continue;
      if (gap > height * (gapAbove >= 0 ? 0.075 : 0.052)) continue;
      if (band.colorRatio > 0.13 || band.xCoverage < 0.045 || band.density > 0.34) continue;
      const overlap = Math.max(0, Math.min(core.x1, band.x1) - Math.max(core.x0, band.x0));
      const minOverlapRatio = gapAbove >= 0 ? 0.08 : 0.2;
      if (overlap / Math.max(1, coreWidth) < minOverlapRatio) continue;
      attached.push({ band, side: gapAbove >= 0 ? "above" : "below", gap });
    }

    const above = attached.filter((item) => item.side === "above").sort((a, b) => a.gap - b.gap).slice(0, 1);
    const below = attached.filter((item) => item.side === "below").sort((a, b) => a.gap - b.gap).slice(0, 2);
    const included = [...above, ...below].map((item) => item.band);
    const x0 = Math.min(core.x0, ...included.map((band) => band.x0));
    const x1 = Math.max(core.x1, ...included.map((band) => band.x1));
    const y0 = Math.min(core.y0, ...included.map((band) => band.y0));
    const y1 = Math.max(core.y1, ...included.map((band) => band.y1));
    const confidence = Math.min(
      1,
      0.52 + Math.min(core.lines.reduce((sum, line) => sum + line.evidence, 0) / 24, 0.32) + Math.min(core.lines.length * 0.06, 0.12),
    );
    return {
      box: [x0 / width, y0 / height, x1 / width, y1 / height],
      confidence,
      lineCount: core.lines.length,
      evidence: core.lines.reduce((sum, line) => sum + line.evidence, 0),
      attachedAbove: above.length,
      attachedBelow: below.length,
    };
  });

  return {
    blocks: blocks.sort((a, b) => a.box[1] - b.box[1]),
    lines: scoreLines.map((line) => ({
      box: [line.x0 / width, line.y0 / height, line.x1 / width, line.y1 / height],
      evidence: line.evidence,
      horizontalTicks: line.horizontalTicks,
      density: line.density,
      colorRatio: line.colorRatio,
    })),
  };
}

export function snapScoreBox(originalBox, blocks, options = {}) {
  const {
    paddingX = 0.008,
    paddingY = 0.006,
    maxCenterShift = 0.12,
    minAreaRatio = 0.35,
    maxAreaRatio = 1.7,
    minVerticalRatio = 0.65,
    maxNearbyGap = 0.12,
  } = options;
  if (!Array.isArray(originalBox) || originalBox.length !== 4 || !originalBox.every(Number.isFinite)) {
    return { status: "manual", reason: "invalid-original-box", box: null, selectedBlocks: [] };
  }

  const [ox0, oy0, ox1, oy1] = originalBox;
  const overlapBlocks = (blocks ?? []).filter((block) => {
    const [x0, y0, x1, y1] = block.box;
    return x0 < ox1 && x1 > ox0 && y0 < oy1 && y1 > oy0;
  });
  if (!overlapBlocks.length) {
    return { status: "manual", reason: "no-overlapping-score-block", box: null, selectedBlocks: [] };
  }

  const x0 = Math.max(0, Math.min(...overlapBlocks.map((block) => block.box[0])) - paddingX);
  const y0 = Math.max(0, Math.min(...overlapBlocks.map((block) => block.box[1])) - paddingY);
  const x1 = Math.min(1, Math.max(...overlapBlocks.map((block) => block.box[2])) + paddingX);
  const y1 = Math.min(1, Math.max(...overlapBlocks.map((block) => block.box[3])) + paddingY);
  const candidate = [x0, y0, x1, y1];
  const selectedTop = Math.min(...overlapBlocks.map((block) => block.box[1]));
  const selectedBottom = Math.max(...overlapBlocks.map((block) => block.box[3]));
  const sparseFragments = overlapBlocks.length >= 3
    && overlapBlocks.every((block) => (block.lineCount ?? 1) <= 1)
    && selectedBottom - selectedTop >= 0.2;
  const nearbyBlocks = (blocks ?? []).filter((block) => {
    const [bx0, by0, bx1, by1] = block.box;
    const horizontalOverlap = Math.max(0, Math.min(x1, bx1) - Math.max(x0, bx0));
    const horizontalRatio = horizontalOverlap / Math.max(1e-8, Math.min(x1 - x0, bx1 - bx0));
    const verticalGap = by1 <= oy0 ? oy0 - by1 : by0 >= oy1 ? by0 - oy1 : 0;
    return verticalGap > 0 && verticalGap <= maxNearbyGap && horizontalRatio >= 0.35;
  });
  const oldArea = Math.max(0, (ox1 - ox0) * (oy1 - oy0));
  const newArea = Math.max(0, (x1 - x0) * (y1 - y0));
  const areaRatio = newArea / Math.max(oldArea, 1e-8);
  const verticalRatio = (y1 - y0) / Math.max(oy1 - oy0, 1e-8);
  const oldCenter = [(ox0 + ox1) / 2, (oy0 + oy1) / 2];
  const newCenter = [(x0 + x1) / 2, (y0 + y1) / 2];
  const centerShift = Math.hypot(newCenter[0] - oldCenter[0], newCenter[1] - oldCenter[1]);
  const metrics = { areaRatio, centerShift, maxConfidence: Math.max(...overlapBlocks.map((block) => block.confidence ?? 0)) };

  let reason = null;
  if (nearbyBlocks.length) reason = "nearby-score-block-outside-box";
  else if (sparseFragments) reason = "sparse-score-block-fragments";
  else if (centerShift > maxCenterShift) reason = "center-shift-over-threshold";
  else if (areaRatio < minAreaRatio || areaRatio > maxAreaRatio || verticalRatio < minVerticalRatio) {
    reason = "size-change-over-threshold";
  }
  else if (metrics.maxConfidence < 0.56) reason = "low-detection-confidence";

  return {
    status: reason ? "manual" : "auto",
    reason,
    box: candidate,
    selectedBlocks: overlapBlocks,
    metrics,
  };
}
