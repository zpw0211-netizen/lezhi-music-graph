// 把作品画成一张简谱图片（PNG）：标题、作者、调号拍号，几个声部上下对齐，歌词写在音下面。
// 只画学生作品里会出现的记号：唱名、高低音点、减时线、附点、增时线、休止、延音线、X（打击乐）。

export type ImageNote = { d: number; o?: number; b: number; tie?: boolean; lyric?: string };
export type ImageLine = { label?: string; bars: ImageNote[][] };
export type ImageScore = { title: string; author?: string; keyText: string; meter: string; lines: ImageLine[]; note?: string };

const WIDTH = 1200;
const MARGIN = 64;
const DIGIT = 30;
const SERIF = "'Songti SC','SimSun','Noto Serif CJK SC',serif";
const KAI = "'LXGW WenKai','KaiTi','STKaiti',serif";
const INK = "#17221C";

const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const barBeats = (meter: string) => Number(meter.split("/")[0]) * 4 / Number(meter.split("/")[1]);
const groupLength = (meter: string) => (meter.endsWith("/8") ? 1.5 : 1);

/** 一个音要画几条减时线、几个附点。 */
function shape(b: number) {
  const table: Array<[number, number, number]> = [[0.25, 2, 0], [0.375, 2, 1], [0.5, 1, 0], [0.75, 1, 1], [1, 0, 0], [1.5, 0, 1]];
  const hit = table.find(([beats]) => Math.abs(beats - b) < 1e-6);
  return hit ? { lines: hit[1], dot: hit[2] > 0, extra: 0 } : { lines: 0, dot: false, extra: Math.max(0, Math.round(b) - 1) };
}

export function scoreSvg(score: ImageScore) {
  const beats = barBeats(score.meter);
  const group = groupLength(score.meter);
  const barCount = Math.max(...score.lines.map((line) => line.bars.length));
  const perRow = barCount <= 4 ? barCount : barCount % 3 === 0 && barCount <= 6 ? 3 : 4;
  const multi = score.lines.length > 1;
  const labelWidth = multi ? 92 : 0;
  const barWidth = (WIDTH - MARGIN * 2 - labelWidth) / perRow;
  const lineHasLyrics = score.lines.map((line) => line.bars.some((bar) => bar.some((note) => note.lyric)));
  const lineHeight = (k: number) => 78 + (lineHasLyrics[k] ? 34 : 0);
  const systemHeight = score.lines.reduce((sum, _, k) => sum + lineHeight(k), 0) + 30;
  const rows = Math.ceil(barCount / perRow);
  const top = 150;
  const height = top + rows * systemHeight + (score.note ? 50 : 20) + 30;
  const parts: string[] = [];

  parts.push(`<rect width="${WIDTH}" height="${height}" fill="#FFFDF8"/>`);
  parts.push(`<text x="${WIDTH / 2}" y="64" text-anchor="middle" font-family="${KAI}" font-size="40" fill="${INK}">${esc(score.title)}</text>`);
  parts.push(`<text x="${MARGIN}" y="122" font-family="${SERIF}" font-size="22" fill="${INK}">${esc(score.keyText)}  ${esc(score.meter)}</text>`);
  if (score.author) parts.push(`<text x="${WIDTH - MARGIN}" y="122" text-anchor="end" font-family="${KAI}" font-size="22" fill="${INK}">${esc(score.author)}</text>`);

  for (let row = 0; row < rows; row += 1) {
    const y0 = top + row * systemHeight;
    const first = row * perRow;
    const last = Math.min(barCount, first + perRow);
    // 每小节的时间格：所有声部的起音点和每一拍，按时间比例排开，太挤的地方撑开。
    const grids: Array<{ times: number[]; xs: number[] }> = [];
    for (let bar = first; bar < last; bar += 1) {
      const set = new Set<number>([0, beats]);
      for (let k = 0; k <= beats; k += 1) set.add(k);
      for (const line of score.lines) {
        let t = 0;
        for (const note of line.bars[bar] ?? []) { set.add(Number(t.toFixed(4))); t += note.b; }
      }
      const times = [...set].filter((t) => t <= beats + 1e-6).sort((a, b) => a - b);
      const gaps = times.slice(1).map((t, i) => Math.max(28, (t - times[i]) * (barWidth / beats)));
      const total = gaps.reduce((sum, gap) => sum + gap, 0);
      const inner = barWidth - 34;
      const xs = [0];
      gaps.forEach((gap) => xs.push(xs[xs.length - 1] + gap * inner / total));
      const left = MARGIN + labelWidth + (bar - first) * barWidth + 22;
      grids.push({ times, xs: xs.map((x) => left + x) });
    }
    const xAt = (barIndex: number, t: number) => {
      const grid = grids[barIndex - first];
      const i = grid.times.findIndex((time) => Math.abs(time - t) < 1e-3);
      return i >= 0 ? grid.xs[i] : grid.xs[0] + (t / beats) * (grid.xs[grid.xs.length - 1] - grid.xs[0]);
    };

    let y = y0;
    const lineTops: number[] = [];
    score.lines.forEach((line, k) => {
      lineTops.push(y);
      const base = y + 44;
      if (multi && line.label) parts.push(`<text x="${MARGIN}" y="${base - 2}" font-family="${KAI}" font-size="18" fill="#44544B">${esc(line.label)}</text>`);
      for (let bar = first; bar < last; bar += 1) {
        const notes = line.bars[bar] ?? [];
        let t = 0;
        // 同一拍里相连的短音，减时线连成一条。
        const beams: Array<{ group: number; level: number; from: number; to: number }> = [];
        notes.forEach((note, index) => {
          const x = xAt(bar, Number(t.toFixed(4)));
          const look = shape(note.b);
          const digit = note.d === 9 ? "X" : String(note.d);
          parts.push(`<text x="${x}" y="${base}" text-anchor="middle" font-family="${SERIF}" font-size="${DIGIT}" fill="${INK}">${digit}</text>`);
          const o = note.o ?? 0;
          for (let dot = 0; dot < Math.abs(o); dot += 1) {
            const dy = o > 0 ? base - DIGIT + 2 - dot * 8 : base + 10 + look.lines * 6 + dot * 8;
            parts.push(`<circle cx="${x}" cy="${dy}" r="2.6" fill="${INK}"/>`);
          }
          if (look.dot) parts.push(`<circle cx="${x + 16}" cy="${base - 9}" r="2.6" fill="${INK}"/>`);
          for (let dash = 1; dash <= look.extra; dash += 1) {
            const at = t + dash;
            if (note.d === 0) parts.push(`<text x="${xAt(bar, at)}" y="${base}" text-anchor="middle" font-family="${SERIF}" font-size="${DIGIT}" fill="${INK}">0</text>`);
            else parts.push(`<rect x="${xAt(bar, at) - 10}" y="${base - 11}" width="20" height="2.6" fill="${INK}"/>`);
          }
          for (let level = 0; level < look.lines; level += 1) {
            const g = Math.floor((t + 1e-6) / group);
            const open = beams.find((beam) => beam.level === level && beam.group === g && beam.to === index - 1);
            if (open) open.to = index; else beams.push({ group: g, level, from: index, to: index });
          }
          if (note.tie && index + 1 < notes.length) {
            const x2 = xAt(bar, Number((t + note.b).toFixed(4)));
            parts.push(`<path d="M${x - 2} ${base - DIGIT - 4} Q${(x + x2) / 2} ${base - DIGIT - 18} ${x2 + 2} ${base - DIGIT - 4}" fill="none" stroke="${INK}" stroke-width="1.8"/>`);
          }
          if (note.lyric && lineHasLyrics[k]) parts.push(`<text x="${x}" y="${base + 40}" text-anchor="middle" font-family="${KAI}" font-size="22" fill="${INK}">${esc(note.lyric)}</text>`);
          t += note.b;
        });
        const starts: number[] = [];
        let s = 0;
        for (const note of notes) { starts.push(s); s += note.b; }
        for (const beam of beams) {
          const x1 = xAt(bar, Number(starts[beam.from].toFixed(4))) - 10;
          const x2 = xAt(bar, Number(starts[beam.to].toFixed(4))) + 10;
          parts.push(`<rect x="${x1}" y="${base + 7 + beam.level * 6}" width="${x2 - x1}" height="2.2" fill="${INK}"/>`);
        }
      }
      y += lineHeight(k);
    });
    // 小节线贯穿各声部；最后一小节画终止线。
    const barTop = y0 + 8;
    const barBottom = y0 + score.lines.reduce((sum, _, k) => sum + lineHeight(k), 0) - (lineHasLyrics[score.lines.length - 1] ? 30 : 0) - 14;
    for (let bar = first; bar < last; bar += 1) {
      const x = MARGIN + labelWidth + (bar - first + 1) * barWidth;
      if (bar === barCount - 1) {
        parts.push(`<rect x="${x - 9}" y="${barTop}" width="1.6" height="${barBottom - barTop}" fill="${INK}"/><rect x="${x - 4}" y="${barTop}" width="4.5" height="${barBottom - barTop}" fill="${INK}"/>`);
      } else {
        parts.push(`<rect x="${x}" y="${barTop}" width="1.6" height="${barBottom - barTop}" fill="${INK}"/>`);
      }
    }
    if (multi) parts.push(`<rect x="${MARGIN + labelWidth}" y="${barTop}" width="1.6" height="${barBottom - barTop}" fill="${INK}"/>`);
    void lineTops;
  }
  if (score.note) parts.push(`<text x="${MARGIN}" y="${height - 28}" font-family="${KAI}" font-size="16" fill="#7A877F">${esc(score.note)}</text>`);
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">${parts.join("")}</svg>`, width: WIDTH, height };
}

/** SVG 画到两倍大的画布上，转成 PNG。 */
export async function scorePng(score: ImageScore): Promise<Blob> {
  const { svg, width, height } = scoreSvg(score);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("score image")); image.src = url; });
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("png"))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}
