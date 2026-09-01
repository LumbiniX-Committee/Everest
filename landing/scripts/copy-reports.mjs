/**
 * Copy the PDF reports out of the repo's `docs/` into `public/reports/`.
 *
 * The site links to documents that live one directory up, outside anything Next
 * will serve, so a copy has to exist under `public/`. `docs/` stays the source
 * and this script refreshes the copy before every dev run and every build.
 *
 * The copy is committed rather than ignored, because a deploy that uploads only
 * this directory — the Vercel CLI run from here, or any zip of it — never sees
 * `../../docs` at all, and would silently ship a site whose report links 404.
 * Committing it also makes staleness visible: regenerate a PDF without
 * rebuilding and the difference shows up as an uncommitted diff rather than as
 * a site quietly handing out last month's document.
 *
 * A missing source is a warning rather than a failure, so a checkout that has
 * not rebuilt the reports still builds.
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
