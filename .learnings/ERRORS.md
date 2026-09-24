# Errors

## [ERR-20260916-001] v4-local-validation

**Logged**: 2026-09-16
**Priority**: medium
**Status**: resolved
**Area**: frontend

### Summary
Local acceptance found entity-linking contamination by generic music terms and second-hop textbook membership, plus a production preview built without the Pages export environment.

### Resolution
Prioritize explicit named entities, restrict second-hop provenance traversal, preserve the primary entity for follow-up questions, and test semantic negative cases. Build with GITHUB_PAGES=true, NEXT_PUBLIC_STATIC_EXPORT=1 and NEXT_PUBLIC_BASE_PATH before preparing the Pages artifact. Chromium checks now pass; no live GPT call was made. Use complete-line patch context and distinguish hidden legacy suggestion elements from the visible assistant page in CSS checks.

---

## [ERR-20260915-001] sigma-reducer-coordinate-contract

**Logged**: 2026-09-15
**Priority**: high
**Status**: in_progress
**Area**: frontend

### Summary
Real Chromium production acceptance exposed Sigma invalid node position errors. The renderer reducers returned only visual overrides instead of retaining the node coordinates and complete display attributes. The existing Canvas fallback did recover the UI.

### Fix
Preserve `...data` in both nodeReducer and edgeReducer, then repeat browser and static export acceptance before deployment.

### Metadata
- Related Files: app/components/graph/SigmaGraphScene.tsx
- See Also: ERR-20260910-002


Command failures and integration errors.

---

## [ERR-20260910-001] baseline_build_runtime_and_data_regeneration

## [ERR-20260910-002] sigma-static-prerender

**Logged**: 2026-09-10
**Status**: resolved
**Area**: GitHub Pages / static export

### Summary
Importing the Sigma renderer directly from the root client page caused the GitHub Pages prerender worker to return HTTP 500 even though the normal production build succeeded.

### Resolution
Load the WebGL renderer with `next/dynamic({ ssr: false })` and keep its props type as a type-only import. The subsequent static export and Pages artifact audit both passed.

### Prevention
Browser-only graph renderers must stay behind a client-only dynamic boundary; normal production builds alone are not sufficient validation for this dual-target project.

**Logged**: 2026-09-10T10:00:00+08:00
**Priority**: high
**Status**: in_progress
**Area**: infra

### Summary
The baseline validation used the host Node 22.2 runtime and ran `quality:check`, which both exposed a missing Rolldown Windows binding and regenerated stale public graph artifacts.

### Error
`Cannot find module '@rolldown/binding-win32-x64-msvc'` and `quality:check` rewrote the published six-book graph from the extraction source.

### Context
- The checked-in public graph is the protected high-quality release and must not be replaced by the stale regeneration path.
- The host Node version is below the project engine requirement; the bundled workspace Node is 24.19.0.
- Generated public data changes were immediately restored from the validated commit.

### Suggested Fix
Run all remaining validation with the bundled Node runtime and change the quality workflow so audits can validate the protected release without rebuilding textbook data.

### Metadata
- Reproducible: yes
- Related Files: package.json, scripts/build-graph-data.mjs, public/data/music-graph.json

---

## [ERR-20260828-V23-GHCLI] github_cli_unavailable

**Logged**: 2026-08-28T23:59:00+08:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
GitHub CLI is not installed on this Windows host.

### Error
PowerShell could not resolve the `gh` command while checking the Pages workflow.

### Context
- The Git push had already succeeded.
- The repository and Actions run are public.

### Suggested Fix
Use the public GitHub Actions REST endpoint for read-only deployment monitoring.

### Metadata
- Reproducible: yes
- Related Files: .github/workflows/pages.yml

### Resolution
- **Resolved**: 2026-08-28T23:59:10+08:00
- **Notes**: Switched to the public Actions API; no product or deployment state was affected.

---

## [ERR-20260828-V23-FINALCAPTURE] canvas_metrics_deadline

**Logged**: 2026-08-28T23:58:00+08:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The final screenshot script hit the browser wrapper's default 3-second selector deadline while collecting Canvas data attributes after reload.

### Error
`Timed out after 3000ms evaluating selector canvas.full-graph-canvas`

### Context
- The static page had just reloaded and was parsing the 2.6 MB graph index.

### Suggested Fix
Wait for the canvas and collect metrics in a separate call with an explicit longer timeout.

### Metadata
- Reproducible: no
- Related Files: app/components/FullGraphCanvas.tsx
- Recurrence-Count: 2

### Resolution
- **Resolved**: 2026-08-28T23:58:10+08:00
- **Notes**: Screenshot saving succeeded; metrics collection was moved away from locator evaluation after the wrapper repeated its 3-second dispatch deadline.

---

## [ERR-20260828-V23-NAV] incorrect_focus_return_label

**Logged**: 2026-08-28T23:50:00+08:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The QA script targeted the full-graph return button while the UI was still in focus mode.

### Error
No visible button named `返回六册叠加`; focus mode correctly exposed `返回单册` first.

### Context
- Search result opened a focused single-book relation graph.

### Suggested Fix
Follow the visible state: return to the book, then return to the six-book graph.

### Metadata
- Reproducible: yes
- Related Files: app/page.tsx

### Resolution
- **Resolved**: 2026-08-28T23:50:10+08:00
- **Notes**: QA navigation now follows the two-step state transition.

---

## [ERR-20260828-V23-BROWSER] unsupported_networkidle

**Logged**: 2026-08-28T23:43:00+08:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The in-app browser wrapper rejected `networkidle` for `waitForLoadState`.

### Error
`playwright_wait_for_load_state does not support networkidle`

### Context
- Static GitHub Pages visual QA.

### Suggested Fix
Wait for `domcontentloaded` and then a specific UI element.

### Metadata
- Reproducible: yes
- Related Files: app/page.tsx

### Resolution
- **Resolved**: 2026-08-28T23:43:10+08:00
- **Notes**: Switched to DOM readiness plus a targeted canvas wait.

---

## [ERR-20260828-V23-PAGES] incomplete_pages_environment

**Logged**: 2026-08-28T23:41:00+08:00
**Priority**: low
**Status**: resolved
**Area**: config

### Summary
The first manual Pages build omitted two workflow environment variables.

### Error
The Pages audit reported that the static bundle still referenced `/api/ask`.

### Context
- `GITHUB_PAGES=true` was set, but `NEXT_PUBLIC_STATIC_EXPORT=1` and `NEXT_PUBLIC_BASE_PATH=/lezhi-music-graph` were not.

### Suggested Fix
Mirror the workflow environment exactly for local Pages validation.

### Metadata
- Reproducible: yes
- Related Files: .github/workflows/pages.yml

### Resolution
- **Resolved**: 2026-08-28T23:41:30+08:00
- **Notes**: Rebuild uses the complete three-variable Pages environment.

---

## [ERR-20260828-V23-DEV] windows_workers_runtime_failure

**Logged**: 2026-08-28T23:35:30+08:00
**Priority**: medium
**Status**: resolved
**Area**: infra

### Summary
The local Vinext development runtime could not start its Windows Workers runtime.

### Error
`MiniflareCoreError [ERR_RUNTIME_FAILURE]` after a Windows access violation warning.

### Context
- Production build completed successfully before the preview attempt.
- Failure is isolated to the local Workers emulator, not the compiled static client.

### Suggested Fix
Use the already-built static client for visual QA; update the Microsoft Visual C++ Redistributable before relying on local Miniflare again.

### Metadata
- Reproducible: unknown
- Related Files: dist/client

### Resolution
- **Resolved**: 2026-08-28T23:36:00+08:00
- **Notes**: Continued visual QA against the exact compiled static client.

---

## [ERR-20260828-V23-AUDIT] v22_and_pages_audit_context

**Logged**: 2026-08-28T12:24:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: tests

### Summary
The V2.2 spacing audit detected one close default-layout pair, and the Pages audit was run without first producing a GitHub Pages build.

### Error
- `minimum node distance too small: 3.95`
- `.nojekyll` missing under the base-path build directory

### Context
- V2.3 changed the default from textbook clusters to a force-directed knowledge layout.
- The Pages audit expects `GITHUB_PAGES=true npm run build` output.

### Suggested Fix
Identify and resolve the close pair in the force layout; run the Pages-specific build before its audit.

### Metadata
- Reproducible: yes
- Related Files: scripts/audit-v22-research.mjs, scripts/audit-github-pages.mjs

### Resolution
- **Resolved**: 2026-08-28T12:32:00+08:00
- **Notes**: Added post-normalization collision resolution; the V2.2 spacing audit now passes at a 27.0 minimum distance. Pages validation remains ordered after the Pages build.

---

## [ERR-20260828-V23] workflow_path_assumption

**Logged**: 2026-08-28T12:10:00+08:00
**Priority**: low
**Status**: resolved
**Area**: config

### Summary
Assumed a GitHub Pages workflow filename that does not exist in this repository.

### Error
`Get-Content .github/workflows/deploy-pages.yml` returned PathNotFound.

### Context
- Read-only inspection during the V2.3 audit setup.
- Product files were unaffected.

### Suggested Fix
List or search `.github/workflows` before reading a named workflow file.

### Metadata
- Reproducible: yes
- Related Files: .github/workflows

### Resolution
- **Resolved**: 2026-08-28T12:10:00+08:00
- **Notes**: Switched to repository file discovery before the next read.

---

## [ERR-20260828-003] local-preview-process-policy

**Logged**: 2026-08-28T22:18:00+08:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
PowerShell `Start-Process` for a hidden local HTTP server was rejected by the command policy.

### Resolution
Started `py -m http.server` directly in a PTY session and retained its session id for cleanup.

---

## [ERR-20260828-004] browser-networkidle-unsupported

**Logged**: 2026-08-28T22:20:00+08:00
**Priority**: low
**Status**: resolved
**Area**: qa

### Summary
The in-app browser's `waitForLoadState` implementation does not support `networkidle`.

### Resolution
Used `domcontentloaded` followed by a short deterministic settle wait before snapshots.

---

## [ERR-20260828-005] windows-static-build-ebusy

**Logged**: 2026-08-28T22:23:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: build

### Summary
Vinext could not clean `dist/client` while Python HTTP server was serving that directory (`EBUSY`).

### Resolution
Stopped the preview session before rebuilding the static export, then restarted it for QA.

---

## [ERR-20260828-017] github-actions-status-fallback

**Logged**: 2026-08-28T21:36:00+08:00
**Priority**: low
**Status**: resolved
**Area**: deployment

### Summary
The GitHub CLI was not installed and the unauthenticated GitHub Actions API was rate-limited while checking the Pages deployment.

### Resolution
Used the already signed-in GitHub Actions web page in the in-app browser and verified run 13 completed successfully. Future checks on this host should prefer the signed-in browser before CLI or unauthenticated API fallbacks.

---

## [ERR-20260828-016] browser-batch-screenshot-capture

**Logged**: 2026-08-28T20:35:00+08:00
**Priority**: low
**Status**: resolved
**Area**: frontend

### Summary
The browser screenshot channel failed when capturing and saving two live-site screenshots in one call.

### Error
`Unable to capture screenshot`

### Context
- Both live pages had already loaded and passed DOM, metric and console checks.
- The failure affected only screenshot collection.

### Suggested Fix
Capture each live page in a separate browser call and save it immediately.

### Metadata
- Reproducible: unknown
- Related Files: none

### Resolution
- **Resolved**: 2026-08-28T20:36:00+08:00
- **Notes**: Final evidence capture was split into one page per call.

---

## [ERR-20260828-015] browser-batch-qa-timeout

**Logged**: 2026-08-28T18:45:00+08:00
**Priority**: low
**Status**: resolved
**Area**: frontend

### Summary
A long browser QA batch that combined zoom, graph expansion, mode switching and log collection exceeded the browser execution deadline.

### Error
`js execution timed out; kernel reset`

### Context
- Search, textbook switching and static graph Q&A had already passed in shorter checks.
- No source or deployed state was changed by the timeout.

### Suggested Fix
Keep visual regression checks short and verify one interaction group per browser call.

### Metadata
- Reproducible: yes
- Recurrence-Count: 2
- Related Files: app/page.tsx

### Resolution
- **Resolved**: 2026-08-28T18:46:00+08:00
- **Notes**: The same limit recurred during an online cross-book plus zoom batch; remaining checks are restricted to one interaction group per call.

---

## [ERR-20260828-014] animated-graph-playwright-input-stability

**Logged**: 2026-08-28T18:38:00+08:00
**Priority**: low
**Status**: resolved
**Area**: frontend

### Summary
Browser QA could locate the graph assistant input but timed out while filling it because the continuously animated graph kept the page unstable.

### Error
`Playwright selector deadline exceeded: locator.fill`

### Context
- The input was visible and enabled.
- The page intentionally animates graph nodes until the user pauses motion.

### Suggested Fix
Pause graph motion before deterministic form-interaction checks, then retry the same semantic locator.

### Metadata
- Reproducible: yes
- Related Files: app/page.tsx

### Resolution
- **Resolved**: 2026-08-28T18:39:00+08:00
- **Notes**: QA flow now pauses node motion before typing into interactive controls.

---

## [ERR-20260828-013] vinext-static-basepath-root-404

**Logged**: 2026-08-28T18:30:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: frontend

### Summary
Vinext static export failed to prerender the root route when Next `basePath` was enabled.

### Error
`Static export failed: /: RSC handler returned 404`

### Context
- The same app exported successfully with `assetPrefix` alone.
- The failure occurred only in the GitHub Pages build with `output: "export"` and `basePath: "/lezhi-music-graph"`.

### Suggested Fix
Use `assetPrefix` for framework assets and an explicit `NEXT_PUBLIC_BASE_PATH` for public JSON and media paths until Vinext supports basePath prerendering correctly.

### Metadata
- Reproducible: yes
- Related Files: next.config.ts, app/page.tsx

### Resolution
- **Resolved**: 2026-08-28T18:31:00+08:00
- **Notes**: Removed the incompatible Next basePath option while retaining subpath-safe URLs for every exported resource.

---

## [ERR-20260828-012] powershell-regex-quote-parser

**Logged**: 2026-08-28T18:20:00+08:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
PowerShell parsed a double-quoted `rg` regular expression as an invalid array expression during GitHub Pages artifact inspection.

### Error
`ParserError: Array index expression is missing or not valid.`

### Context
- Occurred after a successful static export while inspecting HTML asset references.
- The failing command made no project changes.

### Suggested Fix
Use PowerShell single-quoted regex arguments or inspect the HTML with `Select-String` instead of nesting escaped quotes.

### Metadata
- Reproducible: yes
- Related Files: scripts/prepare-github-pages.mjs

### Resolution
- **Resolved**: 2026-08-28T18:21:00+08:00
- **Notes**: Switched the validation command to PowerShell-native string matching.

---

## [ERR-20260828-011] powershell-native-fallback-exit

**Logged**: 2026-08-28T18:10:00+08:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
A read-only `rg` check used a shell-style fallback that PowerShell interpreted as an external `exit` command.

### Error
`The term 'exit' is not recognized as a name of a cmdlet, function, script file, or executable program.`

### Resolution
Use PowerShell-native conditional handling for expected no-match exit codes, or run the check without a fallback when subsequent commands do not depend on it.

### Metadata
- Reproducible: yes
- Related Files: app/page.tsx, app/layout.tsx

---

## [ERR-20260828-010] vinext-windows-runtime-access-violation

**Logged**: 2026-08-28T17:30:00+08:00
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
The local Vinext development server could compile but the Windows Workers runtime failed to start with an access violation.

### Error
`MiniflareCoreError [ERR_RUNTIME_FAILURE]: The Workers runtime failed to start.`

### Context
- `npm run dev` on Windows.
- Production `vinext build` completed successfully before and after the failure.
- Runtime output suggests the installed Microsoft Visual C++ Redistributable may be outdated.

### Suggested Fix
Update the Microsoft Visual C++ Redistributable on this host, or perform local Workers runtime preview in a compatible environment. Continue to use production build and static artifact audits as the non-mutating validation fallback.

### Metadata
- Reproducible: unknown
- Related Files: vite.config.ts

---

## [ERR-20260828-009] sites-package-bash-not-on-path

**Logged**: 2026-08-28T12:30:00+08:00
**Priority**: low
**Status**: resolved
**Area**: deployment

### Summary
The Sites packaging helper could not start because `bash` was not on the PowerShell PATH.

### Error
`The term 'bash' is not recognized`

### Resolution
Use the verified Git Bash executable at `D:\Git\bin\bash.exe` and pass paths in Git-Bash form (`/c/Users/...`), because `tar` interprets `C:` as a remote archive host.

---

## [ERR-20260828-007] docx-render-and-console-encoding

**Logged**: 2026-08-28T16:02:00+08:00
**Priority**: low
**Status**: resolved
**Area**: docs

### Summary
The canonical DOCX renderer could not find LibreOffice, and the first structural extractor hit the Windows GBK console on a music-note glyph.

### Error
`FileNotFoundError: [WinError 2]` while launching the renderer; `UnicodeEncodeError: 'gbk' codec can't encode character` while printing extracted content.

### Context
- Read-only review of the V2 requirements document.
- The source document was not modified.

### Suggested Fix
When LibreOffice is unavailable on Windows, use installed Microsoft Word to export a read-only PDF, rasterize it with bundled PyMuPDF, and force UTF-8 for structural extraction.

### Metadata
- Reproducible: yes
- Related Files: C:/Users/HONOR/Downloads/乐知图谱_V2_Neo4j风格重构需求文档.docx

### Resolution
- **Resolved**: 2026-08-28T16:08:00+08:00
- **Notes**: Exported through Word, inspected all 11 rendered pages, and extracted all paragraphs and 12 tables with UTF-8 output.

---

## [ERR-20260828-008] powershell-rg-quoting

**Logged**: 2026-08-28T16:20:00+08:00
**Priority**: low
**Status**: resolved
**Area**: frontend

### Summary
A compound ripgrep pattern was malformed by PowerShell quote parsing.

### Error
`regex parse error: unclosed group`

### Context
- Read-only source lookup in `app/page.tsx`.
- No source edits were lost.

### Suggested Fix
Use `Select-String -SimpleMatch` for PowerShell literal JSX searches.

### Metadata
- Reproducible: yes
- Related Files: app/page.tsx

### Resolution
- **Resolved**: 2026-08-28T16:21:00+08:00
- **Notes**: Replaced the lookup with literal Select-String queries.

---

## [ERR-20260828-006] sites-packaging-windows

**Logged**: 2026-08-28T12:18:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: infra

### Summary
The official Sites packaging helper requires Bash, which was unavailable, and the first PowerShell fallback was rejected because it combined recursive cleanup with packaging.

### Error
`bash.exe is not recognized`; the subsequent cleanup-bearing command was blocked by policy.

### Context
- Local vinext build output was valid in `dist`.
- The required archive layout was `dist/server/index.js` plus `dist/.openai/hosting.json`.

### Suggested Fix
On Windows without Bash, stage into a new unique path, do not delete within the packaging command, create the tarball with `tar`, and verify required entries.

### Metadata
- Reproducible: yes
- Related Files: .openai/hosting.json

### Resolution
- **Resolved**: 2026-08-28T12:20:00+08:00
- **Notes**: Created and verified `music-graph-site-version18-494a3f1.tar.gz` without destructive cleanup.

---

## [ERR-20260828-005] sites-credential-base64-runtime

**Logged**: 2026-08-28T12:08:00+08:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
The Sites push orchestration isolate did not provide `btoa` or `TextEncoder` globals.

### Error
`ReferenceError: btoa is not defined`; retrying with `TextEncoder` also returned `ReferenceError`.

### Context
- Needed an in-memory Basic authorization header for a short-lived Sites repository credential.
- The token was never printed or persisted.

### Suggested Fix
Use a small ASCII-only Base64 encoder for repository tokens in this V8 isolate.

### Metadata
- Reproducible: yes
- Related Files: .openai/hosting.json

### Resolution
- **Resolved**: 2026-08-28T12:09:00+08:00
- **Notes**: Used an inline ASCII encoder and pushed commit 494a3f1 successfully.

---

## [ERR-20260828-004] prettier-syntax-check

**Logged**: 2026-08-28T11:55:00+08:00
**Priority**: low
**Status**: resolved
**Area**: frontend

### Summary
Prettier found an extra closing parenthesis in the new force-layout radius expression.

### Error
`SyntaxError: ',' expected at app/page.tsx:57`

### Context
- The error was introduced while expanding single-book graph spacing.
- It was found before build or deployment.

### Suggested Fix
Keep the square-root expression and multiplier in separate balanced groups, then rerun formatting and type checks.

### Metadata
- Reproducible: yes
- Related Files: app/page.tsx

### Resolution
- **Resolved**: 2026-08-28T11:56:00+08:00
- **Notes**: Removed the unmatched closing parenthesis and reran source formatting.

---

## [ERR-20260828-003] apply_patch-same-path-delete-add

**Logged**: 2026-08-28T11:45:00+08:00
**Priority**: low
**Status**: resolved
**Area**: backend

### Summary
One patch attempted to delete and add the same API route path, which the patch tool rejected.

### Error
`apply_patch verification failed: multiple operations target app/api/ask/route.ts`

### Context
- Attempted a whole-file rewrite with both Delete File and Add File operations in one patch.
- No source file was changed by the failed operation.

### Suggested Fix
Use one Update File operation, or separate deletion and addition into two patch calls.

### Metadata
- Reproducible: yes
- Related Files: app/api/ask/route.ts

### Resolution
- **Resolved**: 2026-08-28T11:46:00+08:00
- **Notes**: Switched to a single Update File replacement.

---

## [ERR-20260826-SITES-RETRY] sites_create_source_repository_write_credential

**Logged**: 2026-08-26T23:59:00+08:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
Sites 源代码凭证请求出现一次临时 HTTP 传输失败，等待后重试成功。

### Error
`HTTP request failed: error sending request for url (https://chatgpt.com/backend-api/ps/mcp)`

### Context
- First credential call failed before any source push.
- A bounded retry succeeded and the validated source was pushed once.

### Suggested Fix
遇到相同传输错误时保留现有站点与版本，只进行一次短延迟重试。

### Metadata
- Reproducible: unknown
- Related Files: .openai/hosting.json
- See Also: ERR-20260826-SITES

---

## [ERR-20260826-LOCAL-PREVIEW] vinext dev

**Logged**: 2026-08-26T23:36:00+08:00
**Priority**: medium
**Status**: pending
**Area**: tooling

### Summary
Windows 本机预览的 Workers 运行时因访问冲突无法启动，但生产构建正常完成。

### Error
`MiniflareCoreError [ERR_RUNTIME_FAILURE]: The Workers runtime failed to start.`

### Context
- `npm run quality:audit` and `npm run build` both succeeded.
- The runtime suggested installing the latest Microsoft Visual C++ Redistributable.
- 2026-08-27 replacing the g7s2 graph reproduced the same access violation before the local preview URL became available.

### Suggested Fix
更新 Microsoft Visual C++ Redistributable 后重试本地预览；发布前继续依赖成功的生产构建和部署预览。

### Metadata
- Reproducible: yes
- Related Files: package.json
- Recurrence-Count: 2

---

## [ERR-20260826-UPLOAD] sites_save_site_version

**Logged**: 2026-08-26T15:15:00+08:00
**Priority**: high
**Status**: pending
**Area**: infra

### Summary
The validated Sites build archive failed to upload because the file service connection was interrupted.

### Error
`failed to send OpenAI file request to the file upload endpoint`

### Context
- Occurred after the source push and successful production build.
- The archive remained intact locally and contained the required Worker and hosting metadata.
- Recurred on 2026-08-27 while publishing the upgraded g7s2 dataset; the upload timed out before version creation.

### Suggested Fix
Retry saving the same source version and archive after a short delay.

### Metadata
- Reproducible: yes
- Related Files: .openai/hosting.json
- Recurrence-Count: 2

---

## [ERR-20260826-SITES] sites_create_source_repository_write_credential

**Logged**: 2026-08-26T13:52:00+08:00
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
The Sites source credential request temporarily failed with an HTTP transport error.

### Error
`HTTP request failed: error sending request for url (https://chatgpt.com/backend-api/ps/mcp)`

### Context
- Occurred while preparing a new public deployment after a successful local build.
- No credentials or sensitive values were logged.

### Suggested Fix
Retry the connector request after a short delay; do not create a duplicate site or version.

### Metadata
- Reproducible: unknown
- Related Files: vite.config.ts

---
## [ERR-20260828-002] apply_patch-minified-tsx

**Logged**: 2026-08-28T11:24:00+08:00
**Priority**: low
**Status**: resolved
**Area**: frontend

### Summary
Line-based patching could not match a small JSX fragment because `app/page.tsx` stores the entire render tree on one minified line.

### Error
`apply_patch verification failed: Failed to find expected lines`

### Context
- Attempted to change the entity-distribution row limit.
- The source fragment was embedded inside a very long single line.

### Suggested Fix
Use an exact, asserted mechanical replacement for the bounded fragment, or format the file before future structural edits.

### Metadata
- Reproducible: yes
- Related Files: app/page.tsx

### Resolution
- **Resolved**: 2026-08-28T11:25:00+08:00
- **Notes**: Replaced only the exact row-limit and legend substrings and asserted each old fragment existed once.

## [ERR-20260916-001] Graph Explorer acceptance and interaction corrections

- Status: resolved
- Area: UI / local browser QA
- Related files: app/components/graph/SigmaGraphScene.tsx, app/components/graph/PropertyFilter.tsx
- Summary: Initial static checks rejected render-time ref assignments and a nullable neighbor ID. Moved ref synchronization into effects and guarded null IDs.
- Browser finding: Drag release also emitted a node click, recentering the camera and making the new pointer position miss the dragged node. Used container-relative pointer coordinates, disabled camera movement during dragging, suppressed the release click briefly, and cleaned up mouseup / blur handlers.
- Test tooling: Long chained browser calls caused a persistent-kernel timeout. Reinitialized Chromium and moved repeatable checks into a standalone Playwright script. Used explicit select labels and the actual “Canvas 回退” button name.
- Verification: Real-browser drag identity and subsequent right-click match; filters preserve Graphology identity; no canonical data writes.

---
