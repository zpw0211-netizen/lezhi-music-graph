"use client";

import { useEffect, useRef, useState } from "react";
import { isChunkLoadError, reloadAfterLoadFailure } from "../lib/app/reload-once";

/**
 * Placeholder while a page's code loads. If the load fails (the host now and then drops a file),
 * the page reloads itself once; after that, or in the middle of a class (课堂工具 inside 上课模式,
 * where a reload would close the slides), it offers a button rather than waiting forever.
 * `inline` is for small slots such as the players on the home page.
 */
export function ViewLoading({ error, inline = false, label = "正在载入…" }: { error?: Error | null; inline?: boolean; label?: string }) {
  const box = useRef<HTMLElement | null>(null);
  const [reloading, setReloading] = useState(false);
  useEffect(() => {
    if (!error || !isChunkLoadError(error) || box.current?.closest(".present")) return;
    setReloading(reloadAfterLoadFailure());
  }, [error]);

  const Box = inline ? "span" : "div";
  const className = inline ? undefined : "app-view-status";
  const ref = (element: HTMLElement | null) => { box.current = element; };
  if (!error) return <Box ref={ref} className={className} role="status">{label}</Box>;
  if (reloading) return <Box ref={ref} className={className} role="status">网络有点不稳，正在重新载入…</Box>;
  return (
    <Box ref={ref} className={className} role="alert">
      {inline ? "没有载入成功，" : <p>这一部分没有载入成功，可能是网络不稳。</p>}
      <button type="button" onClick={() => window.location.reload()}>重新载入</button>
    </Box>
  );
}
