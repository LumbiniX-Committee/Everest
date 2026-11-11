// Finds a credited, freely licensed photograph for each heritage site.
//
//   node --experimental-strip-types tools/data/build-site-photos.mjs
//
// For each site it searches Wikidata by name and accepts an item only when the
// item's own coordinates (P625) lie within MATCH_M of the site, so a namesake
// elsewhere in Nepal is never taken. It then reads the item's image (P18) and
// keeps it only if Commons says the file is under a free licence, recording
// the author and licence for the credit line. Sites with a bundled photo are
// skipped; a site with no confident match keeps its labelled schematic.
//
// Output: seed/site-photos.json. The images are not bundled: the app loads a
// Commons thumbnail and falls back to the schematic offline.
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
const AGENT = 'saksi-data-pipeline/1.0 (open heritage guide; https://github.com/siddantasodari4-eng/saksi)';
const MATCH_M = 600;
/** Words that name a kind of place, not a particular one. */
const GENERIC = new Set(['temple', 'stupa', 'durbar', 'square', 'the', 'of', 'and', 'mandir', 'remains', 'site', 'monastery', 'gumba', 'gompa', 'pagoda', 'world', 'great', 'old', 'new', 'nepal', 'kathmandu', 'patan', 'lalitpur', 'lumbini', 'hall', 'palace', 'pillar']);
const words = (text) => new Set(text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !GENERIC.has(w)));
/** The item's label must share a distinctive word with the site's name, so a district or a neighbouring monument is never taken. */
function sameThing(siteName, label) {
  const a = words(siteName);
  for (const w of words(label ?? '')) if (a.has(w)) return true;
  return false;
}
const FREE = /^(CC0|CC BY(-SA)? [1-4]\.0|CC BY(-SA)? 2\.5|Public domain|PD)/i;
const BUNDLED = new Set(['ashokan-pillar', 'maya-devi-temple', 'puskarini']);
/** Reviewed by eye and rejected: the matched image shows a neighbouring monument, not this one. */
const REJECTED = new Set(['ktm-basantapur-durbar']);

const { demoSites } = await import(new URL('data/generated/sites.ts', ROOT).href);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(url) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': AGENT }, signal: AbortSignal.timeout(30_000) });
      if (response.ok) return response.json();
    } catch {
      // retried below
    }
    await sleep(2000 * attempt);
  }
  return null;
}

function metres(a, b) {
  const r = 6371008.8;
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

const strip = (html) => (html ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function photoFor(site) {
  const here = { lat: site.coordinate.latitude, lon: site.coordinate.longitude };
  const names = [site.name, site.name.replace(/\s*\(.*\)\s*/, ''), site.name.replace(/ Temple$| Stupa$/, '')];
  for (const name of [...new Set(names)]) {
    const search = await json(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=7&search=${encodeURIComponent(name)}`,
    );
    const ids = (search?.search ?? []).filter((hit) => sameThing(site.name, hit.label)).map((hit) => hit.id);
    if (!ids.length) continue;
    const entities = await json(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${ids.join('|')}`,
    );
    for (const id of ids) {
      const claims = entities?.entities?.[id]?.claims ?? {};
      const coord = claims.P625?.[0]?.mainsnak?.datavalue?.value;
      const image = claims.P18?.[0]?.mainsnak?.datavalue?.value;
      if (!coord || !image) continue;
      const distance = metres(here, { lat: coord.latitude, lon: coord.longitude });
      if (distance > MATCH_M) continue;
      const info = await json(
        `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata&titles=${encodeURIComponent(`File:${image}`)}`,
      );
      const meta = Object.values(info?.query?.pages ?? {})[0]?.imageinfo?.[0]?.extmetadata;
      const licence = meta?.LicenseShortName?.value ?? '';
      if (!FREE.test(licence)) continue;
      return {
        file: image,
        licence,
        author: strip(meta?.Artist?.value) || 'Unknown author',
        wikidata: id,
        matchedM: Math.round(distance),
      };
    }
    await sleep(300);
  }
  return null;
}

const photos = {};
let found = 0;
for (const site of demoSites) {
  if (BUNDLED.has(site.id) || REJECTED.has(site.id)) continue;
  const photo = await photoFor(site);
  if (photo) {
    photos[site.id] = photo;
    found += 1;
    console.log(`  ${site.id}: ${photo.file} (${photo.licence}, ${photo.matchedM} m)`);
  }
  await sleep(250);
}

writeFileSync(
  new URL('seed/site-photos.json', ROOT),
  `${JSON.stringify({ _about: 'Commons photographs matched to sites by Wikidata name and coordinates. Generated by tools/data/build-site-photos.mjs; do not edit.', photos }, null, 1)}\n`,
);
console.log(`${found} of ${demoSites.length - BUNDLED.size} sites have a credited photograph`);
