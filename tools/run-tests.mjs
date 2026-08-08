/**
 * tools/run-tests.mjs — the zero-install test runner.
 *
 * Globs app/src for *.test.ts and runs them under Node's built-in test runner
 * with type-stripping. No npm install, nothing to break on venue wifi.
 *
 *   node tools/run-tests.mjs
 *
 * A richer harness (vitest + coverage + tsc --noEmit) lives in tools/test/ for
 * when you have a working npm; this is the fallback that always runs.
 */

import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function findTests(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...findTests(full));
    else if (name.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

const tests = findTests(join(root, 'app', 'src'));
if (!tests.length) {
  console.error('no *.test.ts found under app/src');
  process.exit(1);
}
console.log(`running ${tests.length} test file(s) under node --experimental-strip-types --test`);

const res = spawnSync(
  process.execPath,
  ['--experimental-strip-types', '--test', ...tests],
  { stdio: 'inherit' },
);
process.exit(res.status ?? 1);
