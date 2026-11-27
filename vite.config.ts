import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import { sites } from '@openai/sites-vite-plugin';
import hostingConfig from './.openai/hosting.json';

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const SITE_CREATOR_PLACEHOLDER_DATABASE_ID = '00000000-0000-4000-8000-000000000000';
const { d1, r2 } = hostingConfig;

// Each edition only plays its own books' transcriptions (findMelodies isolates pep/xy/hc/hs/ss
// from renyin), so other editions' melody modules are replaced with an empty object at build time.
const EMPTY_MELODIES = '\0yapu-empty-melodies';
function omitOtherEditionMelodies(): Plugin {
  const registry = JSON.parse(readFileSync(new URL('./data/books.json', import.meta.url), 'utf8'));
  const staff = registry.edition?.notation === 'staff';
  const keep = new Set<string>();
  for (const book of registry.books ?? []) {
    const key = String(book?.key ?? '');
    if (!key) continue;
    const bare = key.replace(/^wx-/, '');
    keep.add(key);
    keep.add(bare);
    if (staff) keep.add(`wx-${bare}`);
  }
  return {
    name: 'yapu-omit-other-edition-melodies',
    enforce: 'pre',
    resolveId(source) {
      const match = source.match(/(?:^|[\\/])melodies-((?:wx-)?(?:(?:pep|xy|hc|ss)-)?g\d+s[12]|hs-m\d+)(?:\.ts)?$/);
      if (match && !keep.has(match[1])) return EMPTY_MELODIES;
    },
    load(id) {
      if (id === EMPTY_MELODIES) return 'export default {};';
    },
  };
}

export default defineConfig(async () => {
  const base = {
    css: { postcss: { plugins: [tailwindcss()] } },
    server: isCodexSeatbeltSandbox ? { watch: { useFsEvents: false, usePolling: true } } : undefined,
  };
  if (isGitHubPages) return { ...base, plugins: [omitOtherEditionMelodies(), vinext()] };
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  return {
    ...base,
    plugins: [vinext(), sites(), cloudflare({
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
      config: {
        main: 'vinext/server/app-router-entry',
        compatibility_flags: ['nodejs_compat'],
        d1_databases: d1 ? [{ binding: d1, database_name: 'site-creator-d1', database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID }] : [],
        r2_buckets: r2 ? [{ binding: r2, bucket_name: 'site-creator-r2' }] : [],
      },
    })],
  };
});
