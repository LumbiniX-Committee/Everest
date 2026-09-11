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
import { copyFile, access } from 'node:fs/promises';
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

await copyFile(from, to);
console.log(`[map-worker] ${WORKER_FILE}`);
