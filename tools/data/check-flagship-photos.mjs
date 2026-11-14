// Re-checks every flagship photograph against Wikimedia Commons.
//
//   node tools/data/check-flagship-photos.mjs
//
// seed/flagships.json names each photograph's Commons file, author and
// licence by hand, because the three flagship pages are curated, not matched.
// This asks Commons (one batched request per 40 files) whether each file still
// exists, is still under a free licence, and still carries the licence and
// author we credit. It changes nothing; it exits 1 on any mismatch so a stale
// credit is fixed in the seed, not shipped. Needs the network, so it is not
// part of `npm run verify`.
import { readFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
const AGENT = 'saksi-content/1.0';
const FREE = /^(CC0|CC BY(-SA)? [1-4]\.0|CC BY(-SA)? 2\.5|Public domain)$/i;
const strip = (html) => (html ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const { flagships } = JSON.parse(readFileSync(new URL('seed/flagships.json', ROOT), 'utf8'));
const photos = flagships.flatMap((place) => place.photos.map((photo) => ({ place: place.id, ...photo })));

const meta = new Map();
for (let i = 0; i < photos.length; i += 40) {
  const titles = photos.slice(i, i + 40).map((photo) => `File:${photo.file}`).join('|');
  const body = new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'extmetadata|size', titles });
  // Commons throttles anonymous clients; back off and retry rather than fail.
  let json = null;
  for (let attempt = 1; attempt <= 6 && !json; attempt += 1) {
    const response = await fetch('https://commons.wikimedia.org/w/api.php', {
      method: 'POST',
      headers: { 'User-Agent': AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const text = await response.text();
    try {
      json = JSON.parse(text);
    } catch {
      console.log(`Commons is throttling (attempt ${attempt}); waiting ${20 * attempt} s`);
      await new Promise((resolve) => setTimeout(resolve, 20_000 * attempt));
    }
  }
  if (!json) throw new Error('Commons did not answer; try again later');
  const normal = new Map((json.query?.normalized ?? []).map((n) => [n.to, n.from]));
  for (const page of Object.values(json.query?.pages ?? {})) {
    const title = normal.get(page.title) ?? page.title;
    meta.set(title.replace(/^File:/, ''), page);
  }
  await new Promise((resolve) => setTimeout(resolve, 1500));
}

let failed = 0;
for (const photo of photos) {
  const page = meta.get(photo.file) ?? [...meta.values()].find((p) => p.title === `File:${photo.file}`);
  const info = page?.imageinfo?.[0];
  if (!info) {
    console.log(`MISSING  ${photo.place}: ${photo.file}`);
    failed += 1;
    continue;
  }
  const licence = info.extmetadata?.LicenseShortName?.value ?? '';
  const author = strip(info.extmetadata?.Artist?.value);
  const problems = [];
  if (!FREE.test(licence)) problems.push(`not a free licence: ${licence}`);
  if (licence !== photo.licence) problems.push(`licence ${licence} ≠ ${photo.licence}`);
  if (!author.includes(photo.author)) problems.push(`author "${author}" does not name "${photo.author}"`);
  if (problems.length) failed += 1;
  console.log(`${problems.length ? 'MISMATCH' : 'ok      '} ${photo.place}: ${photo.file} (${info.width}×${info.height}, ${licence})${problems.length ? ` — ${problems.join('; ')}` : ''}`);
}
console.log(`${photos.length - failed} of ${photos.length} photographs check out`);
process.exit(failed ? 1 : 0);
