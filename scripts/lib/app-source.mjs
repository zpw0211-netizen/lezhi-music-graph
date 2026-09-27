// The audits check that UI features still exist in the source. Features live in
// many components, so they read the whole app/ tree instead of one page file.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../app");

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(fullPath)));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

/** Concatenated source of every .ts/.tsx file under app/. */
export async function readAppSource() {
  const files = (await sourceFiles(appRoot)).sort();
  return (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
}
