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
  name: s.name.en,
  nameNepali: s.name.ne,
  namePali: s.name.pi ?? undefined,
  summary: firstSentence(s.summary.en),
  description: s.summary.en,
  coordinate: { latitude: s.coords.lat, longitude: s.coords.lon },
  zone: s.zone,
  tier: s.tier,
  radiusMeters: s.geofence_m,
  photography: s.photography,
  facts: (s.facts ?? []).map((f) => ({ label: f.label.en, value: f.value.en })),
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

