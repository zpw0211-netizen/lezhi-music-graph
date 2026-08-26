import { access, cp, mkdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist/client');
const siteRoot = path.join(root, 'lezhi-music-graph');

await mkdir(siteRoot, { recursive: true });
await writeFile(path.join(siteRoot, '.nojekyll'), '');
await copyFile(path.join(root, 'index.html'), path.join(siteRoot, 'index.html'));
await cp(path.join(root, 'data'), path.join(siteRoot, 'data'), { recursive: true });
if (await exists(path.join(root, '404.html'))) {
  await copyFile(path.join(root, '404.html'), path.join(siteRoot, '404.html'));
}

console.log(`GitHub Pages artifact prepared: ${siteRoot}`);

async function exists(file) {
  try { await access(file); return true; }
  catch { return false; }
}
