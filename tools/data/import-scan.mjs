#!/usr/bin/env node
/**
 * Put a real scan on the map from a file its creator gave us.
 *
 *   node tools/data/import-scan.mjs <file.glb> --id swayambhu-hill \
 *     --title "Swayambhu hill" --creator "Bhugol Tour" \
 *     --at 27.714931,85.290391 --osm "way 201223707" \
 *     --terms "Permission from Bhugol Tour, email of 2026-11-13" \
 *     [--targets wd-Q12946982] [--heading 0] [--scale 1] [--ratio 0.15] [--texture 1024]
 *
 * For scans whose creators gave the file (or permission in writing) rather
 * than an open licence. `--terms` records that permission and is shown in
 * LICENCES.md; keep the written permission itself on file. Never feed this a
 * file captured from a viewer whose download is switched off.
 *
 * The file is reduced for a phone with glTF-Transform (simplified, WebP
 * textures, quantized geometry: no decoder needed), written to
 * landing/public/models/scans/<id>.glb, and printed as an entry to add to
 * data/mapScans.ts and a credit line for LICENCES.md. Check it on the map by
 * eye and set --heading until it lines up with the streets.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const input = args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const id = opt('id');
const title = opt('title');
const creator = opt('creator');
const at = opt('at');
const terms = opt('terms');
if (!input || !existsSync(input) || !/^[a-z0-9-]+$/.test(id ?? '') || !title || !creator || !terms || !/^-?\d+\.\d{4,},-?\d+\.\d{4,}$/.test(at ?? '')) {
  console.error('Usage: node tools/data/import-scan.mjs <file.glb> --id <kebab-id> --title <t> --creator <c> --at <lat,lon (4+ decimals)> --terms <permission or licence> [--osm <feature>] [--targets a,b] [--heading 0] [--scale 1] [--ratio 0.15] [--texture 1024]');
  process.exit(2);
}
const [latitude, longitude] = at.split(',').map(Number);
const out = resolve(ROOT, 'landing/public/models/scans', `${id}.glb`);

execFileSync(
  'npx',
  [
    '--yes', '@gltf-transform/cli@4.1.1', 'optimize', resolve(input), out,
    '--compress', 'quantize',
    '--texture-compress', 'webp',
    '--texture-size', opt('texture', '1024'),
    '--simplify-ratio', opt('ratio', '0.15'),
    '--simplify-error', '0.0004',
  ],
  { stdio: 'inherit' },
);

const bytes = statSync(out).size;
if (bytes > 6_000_000) console.warn(`Warning: ${(bytes / 1e6).toFixed(1)} MB is heavy for a phone map; try a lower --ratio or --texture.`);

const entry = {
  id,
  scanId: opt('sketchfab', ''),
  title,
  creator,
  licence: terms,
  latitude,
  longitude,
  headingDeg: Number(opt('heading', '0')),
  scale: Number(opt('scale', '1')),
  targets: (opt('targets', '') || '').split(',').filter(Boolean),
  bytes,
};
console.log(`\nWrote ${out} (${(bytes / 1e6).toFixed(2)} MB).`);
console.log('\nAdd to MAP_SCANS in data/mapScans.ts:');
console.log(JSON.stringify(entry, null, 2).replace(/"(\w+)":/g, '$1:') + ',');
console.log('\nAdd to LICENCES.md under "Real scans on the map":');
console.log(`  - "${title}" by ${creator}, ${terms}, reduced for phones, at \`${id}.glb\`${opt('osm') ? `; placed at OSM ${opt('osm')}` : ''}.`);
