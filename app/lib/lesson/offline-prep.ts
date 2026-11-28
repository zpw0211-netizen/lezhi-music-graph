import { sharedAssetUrl } from "../app/assets";
import type { Melody } from "./melodies";
import { pianoSampleUrls, preloadPianoSamples } from "./piano-sampler";
import { findVocal } from "./vocal";

/** 专用于「课前离线预备」的 CacheStorage 名称，Service Worker 会优先命中此缓存。 */
export const OFFLINE_CACHE_NAME = "yapu-lesson-offline";

export function collectLessonOfflineUrls(input: {
  scoreUrls: string[];
  artUrls: Array<string | null | undefined>;
  melodies?: Melody[];
}): string[] {
  const urls = new Set<string>();
  for (const url of input.scoreUrls) if (url) urls.add(url);
  for (const url of input.artUrls) if (url) urls.add(url);
  for (const url of pianoSampleUrls()) urls.add(url);
  for (const melody of input.melodies ?? []) {
    const partCount = 1 + (melody.voices?.length ?? 0);
    for (let part = 0; part < partCount; part += 1) {
      const vocal = findVocal(melody, part);
      if (vocal) urls.add(sharedAssetUrl(vocal.file));
    }
  }
  return [...urls];
}

export async function checkLessonOfflineReady(urls: string[]): Promise<boolean> {
  if (!urls.length || typeof window === "undefined" || !("caches" in window)) return false;
  try {
    const cache = await window.caches.open(OFFLINE_CACHE_NAME);
    const checks = await Promise.all(urls.map((url) => cache.match(url)));
    return checks.every(Boolean);
  } catch {
    return false;
  }
}

export async function prepareLessonOffline(
  urls: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ cached: number; total: number; failed: number }> {
  const total = urls.length;
  let done = 0;
  let cached = 0;
  let failed = 0;
  if (!total) return { cached: 0, total: 0, failed: 0 };

  // 同时预热内存里的钢琴采样，确保第一次点播放零等待。
  preloadPianoSamples();

  const cache = typeof window !== "undefined" && "caches" in window
    ? await window.caches.open(OFFLINE_CACHE_NAME).catch(() => null)
    : null;

  const CONCURRENCY = 6;
  let cursor = 0;

  async function worker() {
    while (cursor < total) {
      const url = urls[cursor++];
      try {
        const hit = cache ? await cache.match(url) : undefined;
        if (hit) {
          cached += 1;
        } else {
          const response = await fetch(url);
          if (response.ok) {
            if (cache) await cache.put(url, response.clone());
            cached += 1;
          } else {
            failed += 1;
          }
        }
      } catch {
        failed += 1;
      }
      done += 1;
      onProgress?.(done, total);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker));
  return { cached, total, failed };
}
