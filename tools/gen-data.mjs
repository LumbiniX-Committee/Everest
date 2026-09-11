// tools/gen-data.mjs
//
// Generates the app's site + vantage data from seed/ (the canonical source of
// truth) into data/generated/. Run it, commit the output. `npm run verify`
// checks idempotency: running it must not change committed output.
//
//   node tools/gen-data.mjs
//
// Why codegen and not runtime JSON import: Metro's require() needs a static
// literal path, and the app types carry a few presentation fields seed does not
// (one-line summary, condition, sourceTier). This tool encodes that mapping once
// so seed stays canonical and the app never drifts from it.
//
// ID RULE: seed ids are canonical. Legacy app ids resolve through
// LEGACY_ID_ALIASES at the data-access boundary only (never on a write path).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const sites = read('seed/sites.json');
const vantages = read('seed/vantages.json');
const needs = read('seed/needs.json');
const rawQuests = read('seed/quests.json');
const storySections = read('seed/story-sections.json');
const patanMonuments = read('seed/patan-monuments.json');
const kathmanduMonuments = read('seed/kathmandu-monuments.json');

// ── Bridges from seed → app presentation fields ─────────────────────────────

// Sites with an open funding need read as 'open'; the rest 'stable'. (The app's
// live condition comes from reports; this is the seeded starting state.)
const openSites = new Set(needs.filter((n) => n.status !== 'closed').map((n) => n.site_id));

// Provenance badge. Sacred-garden and greater-Lumbini sites are excavated
// archaeology; the modern monastic-zone temples are documented.
const sourceTierFor = (zone) =>
  zone === 'monastic_east' || zone === 'monastic_west' ? 'documented' : 'archaeological';

// Curated citations, mapped onto the existing source registry so site detail
// keeps showing sources. Every site is part of the WHS, hence the default.
const SOURCE_MAP = {
  'maya-devi-temple': ['unesco-1997', 'ldt-excavation', 'mukherji-1901'],
  'ashokan-pillar': ['rummindei-inscription', 'mukherji-1901', 'fuhrer-1896'],
  'puskarini': ['unesco-1997', 'ldt-conservation', 'mukherji-1901'],
  'vihara-remains': ['unesco-1997', 'ldt-excavation'],
  'marker-stone': ['unesco-1997', 'ldt-excavation'],
  'patan-durbar-square': ['unesco-kv-1979', 'kvpt-patan', 'patan-museum', 'slusser-1982', 'doa-nepal'],
  'kathmandu-durbar-square': ['unesco-kv-1979', 'unesco-hanuman-dhoka-inventory', 'ntb-kathmandu-durbar', 'hanuman-dhoka-museum'],
  'changu-narayan': ['unesco-kv-1979', 'kvpt-changu', 'changu-manadeva-inscription', 'doa-nepal'],
  'manga-hiti': ['slusser-1982'],
  'myanmar-temple': ['ldt-lumbini'],
  'china-temple': ['ldt-lumbini'],
  'korean-temple': ['ldt-lumbini'],
  'gautami-nuns-temple': ['ldt-lumbini', 'ldt-monastery-calendar'],
  'world-peace-pagoda': ['ldt-lumbini'],
  tilaurakot: ['unesco-tilaurakot', 'doa-nepal', 'mukherji-1901'],
  ramagrama: ['unesco-ramagrama', 'doa-nepal'],
};
const sourcesFor = (id) => SOURCE_MAP[id] ?? ['unesco-1997'];

// Legacy → canonical, applied only at the read boundary so old local rows and
// any hardcoded refs still resolve after the rename.
const LEGACY_ID_ALIASES = {
  'ashoka-pillar': 'ashokan-pillar',
  'puskarini-pond': 'puskarini',
  'maya-devi-east-approach': 'maya-devi-temple.v2',
  'maya-devi-pond-edge': 'maya-devi-temple.v1',
  'ashoka-pillar-south': 'ashokan-pillar.v1',
  'puskarini-north-step': 'puskarini.v1',
};

function firstSentence(text) {
  const s = text.split(/\.\s/)[0].trim();
  return s.length > 100 ? `${s.slice(0, 97)}…` : `${s}.`;
}

// ── Validation (hard-fail) ──────────────────────────────────────────────────
const siteIds = new Set(sites.map((s) => s.id));
const vantageIds = new Set(vantages.map((v) => v.id));
const errors = [];
for (const v of vantages) {
  if (!siteIds.has(v.site_id)) errors.push(`vantage ${v.id} → unknown site ${v.site_id}`);
}
for (const s of sites) {
  for (const vid of s.vantages ?? []) {
    if (!vantageIds.has(vid)) errors.push(`site ${s.id} → unknown vantage ${vid}`);
  }
}
if (errors.length) {
  console.error('gen-data: seed integrity errors:\n  ' + errors.join('\n  '));
  process.exit(1);
}

// ── Emit ────────────────────────────────────────────────────────────────────
const appSites = sites.map((s) => ({
  id: s.id,
  parentSiteId: s.id === 'manga-hiti' ? 'patan-durbar-square' : undefined,
  parentOrder: s.id === 'manga-hiti' ? 17 : undefined,
  name: s.name.en,
  nameNepali: s.name.ne,
  namePali: s.name.pi ?? undefined,
  summary: firstSentence(s.summary.en),
  description: s.summary.en,
  coordinate: { latitude: s.coords.lat, longitude: s.coords.lon },
  zone: s.zone,
  region: s.region ?? 'lumbini',
  tier: s.tier,
  radiusMeters: s.geofence_m,
  photography: s.photography,
  facts: (s.facts ?? []).map((f) => ({ label: f.label.en, value: f.value.en })),
  story: (storySections[s.id] ?? s.story ?? []).map((chapter) => ({
    title: chapter.title.en,
    eyebrow: chapter.eyebrow?.en,
    body: chapter.body.en,
  })),
  // Sutta uids this site rests on, e.g. ['dn14', 'mn123']. Carried through so
  // the deepest wisdom tier can show the canonical passage rather than assert
  // that one exists. core/dhamma resolves them; tools/fetch-bilara.mjs makes
  // sure every uid named here is actually in the corpus.
  dhammaLinks: s.dhamma_links ?? [],
  sourceTier: sourceTierFor(s.zone),
  sourceIds: sourcesFor(s.id),
  condition: openSites.has(s.id) ? 'open' : 'stable',
  vantageIds: s.vantages ?? [],
}));

for (const monument of patanMonuments) {
  appSites.push({
    id: monument.id,
    parentSiteId: 'patan-durbar-square',
    parentOrder: monument.inventoryNumber,
    name: monument.name,
    nameNepali: monument.nameNepali,
    summary: firstSentence(monument.description),
    description: monument.description,
    coordinate: { latitude: monument.coords.lat, longitude: monument.coords.lon },
    zone: 'kathmandu_valley',
    region: 'kathmandu-valley',
    tier: 2,
    radiusMeters: 12,
    photography: 'allowed',
    facts: [
      { label: 'Official inventory', value: `Patan monument ${monument.inventoryNumber} of 19` },
      { label: 'Date', value: monument.date },
      { label: 'Type', value: monument.type },
      { label: 'Coordinate', value: monument.coords.quality },
    ],
    story: monument.story,
    dhammaLinks: [],
    sourceTier: 'documented',
    sourceIds: ['unesco-patan-inventory', 'kvpt-patan', 'patan-museum'],
    condition: 'stable',
    vantageIds: [],
  });
}

appSites.push({
  id: 'kathmandu-durbar-square',
  name: 'Kathmandu Durbar Square',
  nameNepali: 'काठमाडौँ दरबार क्षेत्र',
  summary: 'Hanuman Dhoka is Kathmandu’s layered royal square, where palace courtyards, public rest houses and a dense living temple landscape meet.',
  description: 'Kathmandu Durbar Square—also called Hanuman Dhoka or Basantapur—is the largest of the valley’s three royal squares. Official Nepal Tourism Board material describes more than fifty temples in its vicinity, while its cultural-heritage guide records sixty important monuments. This catalogue gives forty named landmarks their own story and safe on-site activity; it does not pretend unnamed micro-shrines are absent.',
  coordinate: { latitude: 27.703889, longitude: 85.308333 },
  zone: 'kathmandu_valley',
  region: 'kathmandu-valley',
  tier: 1,
  radiusMeters: 180,
  photography: 'allowed',
  facts: [
    { label: 'UNESCO component', value: 'Hanuman Dhoka Durbar Square Monument Zone' },
    { label: 'Official scale', value: 'More than 50 temples; 60 important monuments' },
    { label: 'Individually interpreted here', value: `${kathmanduMonuments.length} named landmarks` },
    { label: 'Coordinates', value: 'UNESCO component centre; child pins are map-derived approximations' },
  ],
  story: [
    { title: 'A palace assembled over centuries', eyebrow: 'Not one king, not one style', body: 'Malla rulers enlarged an older palace, Shah kings added a new royal layer, and Rana-era buildings introduced neoclassical forms. Read the square as an argument between periods rather than a frozen medieval scene.' },
    { title: 'A museum that is still alive', eyebrow: 'Temple, street and festival', body: 'The monuments are not only exhibits. Daily offerings, Kumari traditions, Dashain and Indra Jatra continue to move through this ground, so respectful distance and consent are part of understanding the site.' },
    { title: 'Collapse, salvage and return', eyebrow: 'After the 2015 earthquake', body: 'Eleven important monuments collapsed and many more were damaged. Recovered timber, stone and metal were documented and reused where possible, making reconstruction itself a chapter visitors can learn to read.' },
  ],
  dhammaLinks: [],
  sourceTier: 'documented',
  sourceIds: sourcesFor('kathmandu-durbar-square'),
  condition: 'stable',
  vantageIds: [],
});

for (const monument of kathmanduMonuments) {
  const privacySensitive = ['ktm-kumari-ghar', 'ktm-taleju-temple', 'ktm-panchamukhi-hanuman', 'ktm-tribhuvan-gallery', 'ktm-shisha-baithak'].includes(monument.id);
  appSites.push({
    id: monument.id,
    parentSiteId: 'kathmandu-durbar-square',
    parentOrder: monument.inventoryNumber,
    name: monument.name,
    summary: firstSentence(monument.description),
    description: monument.description,
    coordinate: { latitude: monument.coords.lat, longitude: monument.coords.lon },
    zone: 'kathmandu_valley',
    region: 'kathmandu-valley',
    tier: 2,
    radiusMeters: 14,
    photography: privacySensitive ? 'restricted' : 'allowed',
    facts: [
      { label: 'Kathmandu catalogue', value: `Named landmark ${monument.inventoryNumber} of ${kathmanduMonuments.length}` },
      { label: 'Date', value: monument.date },
      { label: 'Type', value: monument.type },
      { label: 'Coordinate', value: 'Map-derived approximation; verify on site' },
    ],
    story: [
      { title: monument.name, eyebrow: monument.date, body: monument.description },
      { title: 'What to notice', eyebrow: 'Read the place slowly', body: monument.lookFor },
    ],
    questPrompt: monument.photoPrompt,
    questMode: monument.questMode,
    dhammaLinks: [],
    sourceTier: 'documented',
    sourceIds: ['unesco-hanuman-dhoka-inventory', 'ntb-kathmandu-durbar', 'hanuman-dhoka-museum'],
    condition: 'stable',
    vantageIds: [],
  });
}


const appVantages = vantages.map((v) => ({
  id: v.id,
  siteId: v.site_id,
  label: v.label.en,
  coordinate: { latitude: v.coords.lat, longitude: v.coords.lon },
  bearing: v.heading_deg,
  pitch: v.pitch_deg,
  positionToleranceM: v.tol_pos_m,
  bearingToleranceDeg: v.tol_heading_deg,
  hfovDeg: v.hfov_deg,
}));

function offsetVantage(coordinate, side, metres = 9) {
  const latRad = (coordinate.latitude * Math.PI) / 180;
  const north = side === 'south' ? -metres : side === 'north' ? metres : 0;
  const east = side === 'west' ? -metres : side === 'east' ? metres : 0;
  return {
    latitude: coordinate.latitude + north / 111_320,
    longitude: coordinate.longitude + east / (111_320 * Math.cos(latRad)),
  };
}

const vantageSides = [
  { side: 'south', label: 'South public approach, facing north', bearing: 0 },
  { side: 'west', label: 'West public approach, facing east', bearing: 90 },
  { side: 'north', label: 'North public approach, facing south', bearing: 180 },
  { side: 'east', label: 'East public approach, facing west', bearing: 270 },
];

const kathmanduSites = appSites.filter((site) => site.id === 'kathmandu-durbar-square' || site.parentSiteId === 'kathmandu-durbar-square');
for (const [index, site] of kathmanduSites.entries()) {
  const direction = vantageSides[index % vantageSides.length];
  const vantageId = `${site.id}.v1`;
  appVantages.push({
    id: vantageId,
    siteId: site.id,
    label: direction.label,
    coordinate: offsetVantage(site.coordinate, direction.side, site.id === 'kathmandu-durbar-square' ? 22 : 9),
    bearing: direction.bearing,
    pitch: site.id.includes('durbar') || site.id.includes('taleju') || site.id.includes('dega') ? 8 : 2,
    positionToleranceM: 12,
    bearingToleranceDeg: 18,
    hfovDeg: 60,
    note: 'Guided exterior vantage derived from the official monument map. Use it for exploration and demo capture; a field survey must verify the exact point before it becomes a conservation baseline.',
  });
  site.vantageIds = [...site.vantageIds, vantageId];
}

const appQuests = rawQuests.map((q) => ({
  id: q.id,
  family: q.family,
  title: q.title,
  description: q.description,
  siteId: q.site_id,
  vantageId: q.vantage_id ?? undefined,
  merit: q.merit,
  window: q.window ?? undefined,
  durationSeconds: q.duration_s ?? undefined,
  riddle: q.riddle ?? undefined,
  centroid: q.centroid ?? undefined,
  radiusMeters: q.radius_m ?? undefined,
}));

const banner = `/**
 * GENERATED by tools/gen-data.mjs from seed/. Do not edit by hand.
 * Run \`node tools/gen-data.mjs\` after changing seed/sites.json or
 * seed/vantages.json. \`npm run verify\` fails if this file is stale.
 */`;

const out = `${banner}
import type { HeritageSite, Vantage } from '@/types';

export const demoSites: HeritageSite[] = ${JSON.stringify(appSites, null, 2)};

export const demoVantages: Vantage[] = ${JSON.stringify(appVantages, null, 2)};

/** Legacy (pre-migration) ids → canonical seed ids. Read boundary only. */
export const LEGACY_ID_ALIASES: Record<string, string> = ${JSON.stringify(LEGACY_ID_ALIASES, null, 2)};

function canonical(id: string): string {
  return LEGACY_ID_ALIASES[id] ?? id;
}

export function findSite(siteId: string): HeritageSite | undefined {
  const id = canonical(siteId);
  return demoSites.find((site) => site.id === id);
}

export function findVantage(vantageId: string): Vantage | undefined {
  const id = canonical(vantageId);
  return demoVantages.find((vantage) => vantage.id === id);
}

export function vantagesForSite(siteId: string): Vantage[] {
  const id = canonical(siteId);
  return demoVantages.filter((vantage) => vantage.siteId === id);
}

export function sitesForParent(parentSiteId: string): HeritageSite[] {
  const id = canonical(parentSiteId);
  return demoSites
    .filter((site) => site.parentSiteId === id)
    .sort((a, b) => (a.parentOrder ?? Number.MAX_SAFE_INTEGER) - (b.parentOrder ?? Number.MAX_SAFE_INTEGER));
}
`;

const questOut = `${banner}
import type { SeedQuest } from '@/types';

export const seedQuests: SeedQuest[] = ${JSON.stringify(appQuests, null, 2)};

export function findSeedQuest(id: string): SeedQuest | undefined {
  return seedQuests.find((q) => q.id === id);
}

export function seedQuestsForSite(siteId: string): SeedQuest[] {
  return seedQuests.filter((q) => q.siteId === siteId);
}
`;

mkdirSync(join(root, 'data/generated'), { recursive: true });
writeFileSync(join(root, 'data/generated/sites.ts'), out);
writeFileSync(join(root, 'data/generated/quests.ts'), questOut);
writeFileSync(
  join(root, 'data/generated/index.ts'),
  `${banner}\nexport * from './sites';\nexport * from './quests';\n`,
);

console.log(`gen-data: wrote ${appSites.length} sites, ${appVantages.length} vantages, ${appQuests.length} quests to data/generated/`);

