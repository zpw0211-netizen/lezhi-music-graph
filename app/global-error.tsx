"use client";

import { useEffect, useState } from "react";

// Kept free of the site's own modules: this page is what shows when one of those failed to load.
const CHUNK_LOAD_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError|Loading chunk \S+ failed/i;

/** Reload unless that already happened in the last minute (see layout.tsx); false means show the button. */
function reloadOnce() {
  const reload = (window as Window & { __yapuReload?: (quiet?: boolean) => boolean }).__yapuReload;
  return reload ? reload(true) : false;
}

/**
 * Shown in place of the whole page when it fails to render (replaces the framework's English page).
 * The usual cause is a code file the host failed to send; then the page reloads itself once,
 * through the inline script at the top of <body> in layout.tsx.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  const [reloading, setReloading] = useState(false);
  useEffect(() => {
    if (!CHUNK_LOAD_ERROR.test(`${error?.name}: ${error?.message}`)) return;
    const timer = window.setTimeout(() => setReloading(reloadOnce()), 0);
    return () => window.clearTimeout(timer);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", padding: "0 16px", background: "#F6F2E8", color: "#1B2622", fontFamily: "system-ui, \"PingFang SC\", \"Microsoft YaHei\", sans-serif" }}>
        <main role="alert" style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 600 }}>页面没有载入成功</h1>
          <p style={{ margin: "0 0 22px", fontSize: 15, lineHeight: 1.7, color: "#44504A" }}>
            {reloading ? "网络有点不稳，正在重新载入…" : "可能是网络不稳，请重新载入。"}
          </p>
          {!reloading && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ height: 40, padding: "0 22px", border: 0, borderRadius: 999, background: "#1E7A4A", color: "#fff", font: "inherit", fontSize: 15, cursor: "pointer" }}
            >重新载入</button>
          )}
        </main>
      </body>
    </html>
  );
}
