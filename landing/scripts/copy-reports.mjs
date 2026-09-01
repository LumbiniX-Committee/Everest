/**
 * Copy the PDF reports out of the repo's `docs/` into `public/reports/`.
 *
 * The site links to documents that live one directory up, outside anything Next
 * will serve. Committing a second copy under `public/` would work until the day
 * someone regenerated `docs/` and the site quietly kept handing out the old
 * one, so the copy is generated instead: `docs/` is the only source, and
 * `predev`/`prebuild` make the copy before either command can read it.
 *
 * A missing source is a warning rather than a failure. The site is deployable
 * from a checkout that has not built the reports; the link 404s, and that is a
 * smaller problem than an unbuildable site.
 */
import { copyFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const docs = join(here, '..', '..', 'docs');
const dest = join(here, '..', 'public', 'reports');

const FILES = [
  'Sakshi-Tech-Stack.pdf',
  'Sakshi-Research-and-Market.pdf',
  'Sakshi-LumbiniX-2026-Submission.pdf',
];

await mkdir(dest, { recursive: true });

for (const name of FILES) {
  const from = join(docs, name);
  try {
    await access(from);
  } catch {
    console.warn(`[copy-reports] skipped ${name} — not found in docs/`);
    continue;
  }
  await copyFile(from, join(dest, name));
  console.log(`[copy-reports] ${name}`);
}
