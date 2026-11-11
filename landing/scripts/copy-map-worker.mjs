/**
 * Stage MapLibre's worker as a real static file.
 *
 * MapLibre v6 derives its worker URL from `import.meta.url`. Under a bundler
 * that becomes the emitted chunk's URL, so it asks for
 * `/_next/static/chunks/maplibre-gl-worker.mjs` — a path Next does not serve.
 * The request is answered with HTML, the browser refuses it as a module, and
 * every visitor gets a console error while tile parsing falls back onto the
 * main thread.
 *
 * Copying the worker the package already ships and pointing `setWorkerUrl` at
 * it fixes that, and pins the worker to exactly the version installed rather
 * than to a copy that would drift on the next upgrade.
 *
 * The copy is generated rather than committed, because its source is a
 * dependency: anywhere a build runs, `npm install` has already put it there.
 */
import { access, copyFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export const WORKER_FILE = 'maplibre-gl-worker.mjs';

const from = join(dirname(require.resolve('maplibre-gl/package.json')), 'dist', WORKER_FILE);
const to = join(here, '..', 'public', WORKER_FILE);

try {
  await access(from);
} catch {
  console.warn(`[map-worker] ${WORKER_FILE} not found in maplibre-gl/dist — skipped`);
  process.exit(0);
}

/*
 * The worker is not one file. MapLibre v6 splits it into the worker and the
 * chunks it imports (`./maplibre-gl-shared.mjs`). Copying only the worker left
 * its import answering 404, so the worker died silently: the style and sprites
 * loaded but no tile was ever decoded, and the explorer showed a blank grey map
 * under its pins. Copy every relative import the worker pulls in, recursively.
 */
const dist = dirname(from);
const copied = new Set();
async function copyWithImports(name) {
  if (copied.has(name)) return;
  copied.add(name);
  const source = join(dist, name);
  await copyFile(source, join(here, '..', 'public', name));
  const code = await readFile(source, 'utf8');
  for (const [, dep] of code.matchAll(/from\s*["']\.\/([^"']+)["']/g)) await copyWithImports(dep);
  for (const [, dep] of code.matchAll(/import\(\s*["']\.\/([^"']+)["']\s*\)/g)) await copyWithImports(dep);
}
await copyWithImports(WORKER_FILE);
console.log(`[map-worker] ${[...copied].join(', ')}`);
