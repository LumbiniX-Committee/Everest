/**
 * tools/validate-seed.mjs — seed integrity check.
 *
 * Fails the build (exit 1) on structural problems; warns (exit 0) on things that
 * are allowed to ship but someone should look at — chiefly coordinates still
 * marked 'doc' rather than verified against OSM/Wikidata (05-CONTENT-SPEC §1).
 *
 *   node tools/validate-seed.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seed = join(root, 'seed');
const read = (f) => JSON.parse(readFileSync(join(seed, f), 'utf8'));

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// Tight core = the PMTiles extract (tier 1/2 live here). Greater Lumbini is the
// wider region tier-3 pins (Tilaurakot, Ramagrama) sit in — map pins, not
// physically demoed (05-CONTENT-SPEC §1).
//
// Kathmandu Valley is a second region, added for the Patan/Manga Hiti/Changu
// Narayan sites — see `region` on the site object. A site with no `region`
// defaults to 'lumbini', matching `constants/geo.ts#regionOf`, so the original
// twelve sites needed no edit when this was introduced.
const REGION_BBOX = {
  lumbini: {
    core: { west: 83.24, south: 27.44, east: 83.31, north: 27.51 },
    greater: { west: 82.9, south: 27.3, east: 84.2, north: 27.7 },
  },
  'kathmandu-valley': {
    core: { west: 85.3, south: 27.65, east: 85.45, north: 27.73 },
    greater: { west: 85.2, south: 27.55, east: 85.55, north: 27.8 },
  },
};
const within = (c, b) => c && c.lon >= b.west && c.lon <= b.east && c.lat >= b.south && c.lat <= b.north;
const regionOf = (s) => s.region ?? 'lumbini';
const inBbox = (c, region = 'lumbini') => within(c, REGION_BBOX[region].core);
const inGreaterBbox = (c, region = 'lumbini') => within(c, REGION_BBOX[region].greater);

const sites = read('sites.json');
const vantages = read('vantages.json');
const quests = read('quests.json');
const needs = read('needs.json');
const timeline = read('timeline.json');
const storySections = read('story-sections.json');
const patanMonuments = read('patan-monuments.json');
const kathmanduMonuments = read('kathmandu-monuments.json');
const plates = existsSync(join(seed, 'plates.json')) ? read('plates.json') : [];

const siteIds = new Set(sites.map((s) => s.id));
const vantageIds = new Set(vantages.map((v) => v.id));
const timelineIds = new Set(timeline.map((t) => t.id));

for (const id of Object.keys(storySections)) {
  if (!siteIds.has(id)) err(`story-sections: unknown site '${id}'`);
}

if (patanMonuments.length !== 18) {
  err(`patan-monuments: expected 18 child records plus existing Manga Hiti, found ${patanMonuments.length}`);
}
const patanNumbers = new Set(patanMonuments.map((monument) => monument.inventoryNumber));
if (patanNumbers.size !== 18 || patanNumbers.has(17) || !patanNumbers.has(1) || !patanNumbers.has(19)) {
  err('patan-monuments: inventory numbers must uniquely cover 1–16 and 18–19; Manga Hiti is number 17');
}
for (const monument of patanMonuments) {
  const at = `patan monument '${monument.id}'`;
  if (!monument.name || !monument.description) err(`${at}: missing name or description`);
  if (!monument.coords || typeof monument.coords.lat !== 'number' || typeof monument.coords.lon !== 'number') {
    err(`${at}: missing coordinates`);
  }
  if ((monument.story ?? []).length < 2) err(`${at}: fewer than two story chapters`);
}

if (kathmanduMonuments.length < 40) {
  err(`kathmandu-monuments: expected the 40 named official landmarks, found ${kathmanduMonuments.length}`);
}
const kathmanduNumbers = new Set(kathmanduMonuments.map((monument) => monument.inventoryNumber));
if (kathmanduNumbers.size !== kathmanduMonuments.length) err('kathmandu-monuments: duplicate inventory number');
for (const monument of kathmanduMonuments) {
  const at = `Kathmandu monument '${monument.id}'`;
  if (!monument.name || !monument.description || !monument.lookFor || !monument.photoPrompt) err(`${at}: incomplete story or quest copy`);
  if (!monument.coords || typeof monument.coords.lat !== 'number' || typeof monument.coords.lon !== 'number') err(`${at}: missing coordinates`);
}

// --- sites ------------------------------------------------------------------
for (const s of sites) {
  const at = `site '${s.id}'`;
  if (!s.name?.en || !s.name?.ne) err(`${at}: missing name.en or name.ne`);
  const region = regionOf(s);
  if (s.tier === 3) {
    if (!inGreaterBbox(s.coords, region)) err(`${at}: coords ${JSON.stringify(s.coords)} outside ${region} greater bbox`);
  } else if (!inBbox(s.coords, region)) {
    err(`${at}: coords ${JSON.stringify(s.coords)} outside ${region} core bbox`);
  }
  if (!s.coords_source) err(`${at}: missing coords_source`);
  else if (s.coords_source === 'doc') warn(`${at}: coords still 'doc' — verify against OSM/Wikidata before shipping`);
  if (!s.sources?.length) err(`${at}: no sources — every claim must be traceable`);
  if (!s.summary?.en) err(`${at}: missing English summary`);
  else if (s.summary.en.trim().split(/\s+/).length > 200) err(`${at}: summary over 200 words`);
  if (!s.ne_review) err(`${at}: missing ne_review`);
  for (const v of s.vantages ?? []) if (!vantageIds.has(v)) err(`${at}: references missing vantage '${v}'`);
  for (const t of s.timeline ?? []) if (!timelineIds.has(t)) err(`${at}: references missing timeline '${t}'`);
  const chapters = storySections[s.id] ?? s.story ?? [];
  if (chapters.length < 2) err(`${at}: fewer than two story chapters`);
  for (const chapter of chapters) {
    if (!chapter.title?.en || !chapter.body?.en) err(`${at}: story chapter missing title.en or body.en`);
  }
}

// --- vantages ---------------------------------------------------------------
const siteById = new Map(sites.map((s) => [s.id, s]));
for (const v of vantages) {
  const at = `vantage '${v.id}'`;
  if (!siteIds.has(v.site_id)) err(`${at}: references missing site '${v.site_id}'`);
  const region = regionOf(siteById.get(v.site_id) ?? {});
  if (!inBbox(v.coords, region)) err(`${at}: coords outside ${region} bbox`);
  if (typeof v.heading_deg !== 'number' || v.heading_deg < 0 || v.heading_deg > 360) err(`${at}: heading_deg out of range`);
}

// --- plates (evidence tier is mandatory — Charter #6) -----------------------
const TIERS = new Set(['historical_photograph', 'survey_drawing', 'conditioned_reconstruction', 'artistic_impression']);
for (const p of plates) {
  const at = `plate '${p.id}'`;
  if (!siteIds.has(p.site_id)) err(`${at}: references missing site '${p.site_id}'`);
  if (!TIERS.has(p.evidence_tier)) err(`${at}: missing/invalid evidence_tier '${p.evidence_tier}'`);
}
// Plate ids referenced by sites that do not yet exist are a warning, not an error
// (plates land in Block 6 / harvest).
const plateIds = new Set(plates.map((p) => p.id));
for (const s of sites) for (const p of s.plates ?? []) if (!plateIds.has(p)) warn(`site '${s.id}': plate '${p}' not yet produced`);

// --- quests -----------------------------------------------------------------
for (const q of quests) {
  const at = `quest '${q.id}'`;
  if (q.site_id && !siteIds.has(q.site_id)) err(`${at}: references missing site '${q.site_id}'`);
  if (q.vantage_id && !vantageIds.has(q.vantage_id)) err(`${at}: references missing vantage '${q.vantage_id}'`);
  if (typeof q.merit !== 'number') err(`${at}: missing merit`);
  if (q.riddle && (!Array.isArray(q.riddle.accept) || !q.riddle.accept.length)) err(`${at}: riddle has no accepted answers`);
}

// --- needs ------------------------------------------------------------------
for (const n of needs) {
  const at = `need '${n.id}'`;
  if (!siteIds.has(n.site_id)) err(`${at}: references missing site '${n.site_id}'`);
  if (typeof n.target_npr !== 'number') err(`${at}: missing target_npr`);
}

// --- report -----------------------------------------------------------------
console.log(`seed: ${sites.length} sites, ${vantages.length} vantages, ${quests.length} quests, ${needs.length} needs, ${timeline.length} timeline, ${plates.length} plates`);
for (const w of warnings) console.log(`  WARN  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`  ERROR ${e}`);
  console.error(`\n${errors.length} error(s).`);
  process.exit(1);
}
console.log(`OK — no errors${warnings.length ? `, ${warnings.length} warning(s)` : ''}.`);
