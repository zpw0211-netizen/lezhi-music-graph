import { existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "public", "fonts", "wenkai-display.woff2");
const approvedBytes = 344180;
// Ordinary builds only validate and reuse the approved subset. Rebuilding is explicit.
if (process.env.WENKAI_REBUILD !== "1") {
  if (!existsSync(output)) throw new Error("Approved display font is missing; set WENKAI_REBUILD=1 to rebuild it explicitly.");
  const bytes = statSync(output).size;
  if (bytes !== approvedBytes) throw new Error(`Approved display font size must be ${approvedBytes} bytes; found ${bytes}.`);
  console.log(`BUILD_FONT_REUSED bytes=${bytes}`);
  process.exit(0);
}
const python = process.env.WENKAI_PYTHON;
if (!python || !existsSync(python)) throw new Error("Set WENKAI_PYTHON to an E: or D: Python executable for an explicit font rebuild.");
if (/^C:[\\/]/i.test(path.resolve(python))) throw new Error("Font rebuild Python must be on E: or D:.");
const pythonPathEntries = (process.env.WENKAI_PYTHONPATH ?? "")
  .split(path.delimiter)
  .filter(Boolean)
  .map(entry => path.resolve(entry));
if (pythonPathEntries.some(entry => !/^[DE]:[\\/]/i.test(entry)))
  throw new Error("WENKAI_PYTHONPATH entries must be on E: or D:.");
const env = {
  ...process.env,
  PYTHONPATH: pythonPathEntries.join(path.delimiter),
  PYTHONNOUSERSITE: "1",
  PYTHONDONTWRITEBYTECODE: "1",
};
const probe = spawnSync(python, ["-c", "import fontTools, fontTools.subset, fontTools.ttLib, brotli; print('\\n'.join((fontTools.__file__, fontTools.subset.__file__, fontTools.ttLib.__file__, brotli.__file__)))"], {
  cwd: root,
  env,
  encoding: "utf8",
});
if (probe.error) throw probe.error;
if (probe.status !== 0) throw new Error("The selected E:/D: Python must provide fontTools and brotli without using a C: site-packages directory.");
const modulePaths = probe.stdout.split(/\r?\n/).map(modulePath => modulePath.trim()).filter(Boolean);
if (modulePaths.some(modulePath => !/^[DE]:[\\/]/i.test(modulePath)))
  throw new Error("FontTools and brotli must resolve from E: or D: paths.");
const result = spawnSync(python, [path.join(root, "scripts", "brand", "subset-display-font.py")], {
  cwd: root,
  env,
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
