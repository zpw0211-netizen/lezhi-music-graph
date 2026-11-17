// The host now and then answers a code file with 503. The page cannot get past that on its own
// (a failed module stays failed), so reload it, at most once a minute so a real outage does not loop.
// The reload itself lives in the inline script at the top of <body> (app/layout.tsx), which also
// catches the entry files failing before React runs.

const CHUNK_LOAD_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError|Loading chunk \S+ failed/i;

/** True when the error says one of the site's code or style files could not be fetched. */
export function isChunkLoadError(error: unknown) {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? "");
  return CHUNK_LOAD_ERROR.test(message);
}

type ReloadOnce = (quiet?: boolean) => boolean;

/** Reload the page unless that already happened in the last minute; false means the caller should offer a button. */
export function reloadAfterLoadFailure() {
  const reload = (window as Window & { __yapuReload?: ReloadOnce }).__yapuReload;
  return reload ? reload(true) : false;
}
