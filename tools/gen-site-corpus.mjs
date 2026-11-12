// tools/gen-site-corpus.mjs
//
// Turns the app's own site pages into passages Ask can cite, so a question
// about Nyatapola or the Kathmandu Durbar Square fee is answered from the same
// words the site page shows, with the same sources, instead of being refused.
//
//   node --experimental-strip-types tools/gen-site-corpus.mjs           write
//   node --experimental-strip-types tools/gen-site-corpus.mjs --check   fail if stale
//
// Inputs: data/generated/sites.ts (the 74 curated sites), data/generated/places.ts
// (the 435 listed places and the official fees), data/placeNotes.ts and the
// source registry. Output: core/dhamma/sites.generated.ts.
//
// Nothing is written here that the app does not already show. Listed places
// carry only Wikidata's own one-line description and the fields OSM records;
// a field nobody recorded is left out, never filled.
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const OUT = new URL('core/dhamma/sites.generated.ts', ROOT);
const load = (path) => import(new URL(path, ROOT).href);

const { demoSites } = await load('data/generated/sites.ts');
const { PLACES, ENTRY_FEES, FEE_SITE_IDS, FEES_SOURCE } = await load('data/generated/places.ts');
const { demoSources } = await load('data/demo/sources.ts');
const { placeNote } = await load('data/placeNotes.ts');

const sourceById = new Map(demoSources.map((source) => [source.id, source]));

/** Words that name a kind of place or a city, so they never identify one place on their own. */
const GENERIC = new Set([
  'the', 'and', 'of', 'temple', 'temples', 'mandir', 'stupa', 'durbar', 'square', 'chowk', 'pagoda', 'gate',
  'palace', 'royal', 'hall', 'museum', 'gallery', 'statue', 'column', 'remains', 'house', 'ghar', 'sattal',
  'stone', 'pillar', 'world', 'peace', 'international', 'nuns', 'old', 'new', 'great', 'park', 'national',
  'lake', 'hill', 'river', 'monastery', 'gumba', 'gompa', 'vihara', 'bahal', 'hiti', 'dega', 'kathmandu',
  'patan', 'lalitpur', 'bhaktapur', 'lumbini', 'pokhara', 'chitwan', 'nepal', 'valley', 'city', 'shrine',
  'krishna', 'shiva', 'vishnu', 'ganesh', 'narayan', 'bhairav', 'hanuman', 'devi', 'mahadev', 'buddha',
  'school', 'hotel', 'restaurant', 'bank', 'hospital', 'church', 'mosque', 'centre', 'center', 'gumba',
]);

const tokens = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !/^\d+$/.test(word) && word !== 'the' && word !== 'and');

/**
 * How a question has to name this place for Ask to treat it as the subject:
 * every distinctive word of the name, or, when the name is all generic words
 * ("Kathmandu Durbar Square"), every word of it.
 */
function nameKey(name) {
  const all = [...new Set(tokens(name))];
  const distinctive = all.filter((word) => !GENERIC.has(word));
  return distinctive.length ? distinctive : all;
}

/** Nepali names: the same rule, on stems, because Nepali adds case endings (पशुपतिनाथको). */
const GENERIC_NE = new Set(['मन्दिर', 'दरबार', 'क्षेत्र', 'स्तूप', 'स्तम्भ', 'ताल', 'पोखरी', 'विहार', 'गुम्बा', 'चोक', 'नेपाल', 'काठमाडौं', 'पाटन', 'ललितपुर', 'भक्तपुर', 'लुम्बिनी', 'पोखरा', 'चितवन', 'राष्ट्रिय', 'निकुञ्ज', 'देवी', 'संग्रहालय', 'दरबारको']);
const normNe = (text) => text.replace(/ँ/g, 'ं').replace(/[()\-–,.]/g, ' ');
function nameKeyNe(name) {
  if (!name) return [];
  const stems = normNe(name)
    .split(/\s+/)
    .map((word) => word.replace(/(को|का|की|मा|ले|बाट)$/, ''))
    .filter((word) => word.length >= 2);
  const distinctive = stems.filter((word) => !GENERIC_NE.has(word));
  return [...new Set(distinctive.length ? distinctive : stems)];
}

const chunks = [];
const index = [];
const push = (chunk) => chunks.push({ pali: '', title_pi: '', corpus: 'site', ...chunk });

const fmt = (n) => n.toLocaleString('en-US');
const feeText = (name, fee) =>
  `Entry fee for ${fee.label}: foreign visitors NPR ${fmt(fee.foreign)}, SAARC nationals NPR ${fmt(fee.saarc)}, ` +
  `Chinese nationals NPR ${fmt(fee.chinese)}, Nepali citizens NPR ${fmt(fee.nepali)}.` +
  (fee.note ? ` ${fee.note}` : '') +
  ` Last checked ${FEES_SOURCE.lastChecked}; fees change, so confirm at the gate. This covers ${name}.`;

const feeForIds = (ids) => {
  const feeId = Object.entries(FEE_SITE_IDS).find(([, siteIds]) => ids.some((id) => siteIds.includes(id)))?.[0];
  return feeId ? ENTRY_FEES.find((fee) => fee.id === feeId) : undefined;
};

const parentName = new Map(demoSites.map((site) => [site.id, site.name]));

for (const site of demoSites) {
  const source = (site.sourceIds ?? []).map((id) => sourceById.get(id)).find(Boolean);
  const cite = {
    uid: site.id,
    collection: 'site',
    translator: source?.attribution ?? 'Sākṣī site guide',
    license: 'Sākṣī site guide; facts cited to the sources on the site page',
    source_id: source?.id ?? site.id,
    ...(source?.url ? { source_url: source.url } : {}),
  };
  const ids = [];
  const add = (suffix, title, english) => {
    const chunk_id = `site:${site.id}:${suffix}`;
    ids.push(chunk_id);
    push({ chunk_id, segments: [chunk_id], title_en: title, english, ...cite });
  };

  add('about', site.name, site.description);
  if (site.facts?.length) {
    add('facts', `${site.name}: facts`, `${site.name}. ${site.facts.map((fact) => `${fact.label}: ${fact.value}.`).join(' ')}`);
  }
  (site.story ?? []).forEach((section, i) => {
    if (section.body && section.body !== site.description) add(`story-${i + 1}`, `${site.name}: ${section.title}`, section.body);
  });
  const photo = { allowed: 'Photography is allowed here.', restricted: 'Photography is restricted here; confirm on arrival before photographing.', prohibited: 'Photography is not permitted here.' }[site.photography];
  if (photo) add('visit', `${site.name}: visiting`, `${site.name}. ${photo}`);

  const fee = feeForIds([site.id, site.parentSiteId].filter(Boolean));
  if (fee) {
    const chunk_id = `site:${site.id}:fee`;
    ids.push(chunk_id);
    push({
      chunk_id,
      segments: [chunk_id],
      uid: site.id,
      collection: 'site',
      title_en: `${site.name}: entry fee`,
      english: feeText(site.name, fee),
      translator: 'Nepal Tourism Board',
      license: 'Facts recorded from the official page',
      source_id: 'ntb-fees',
      source_url: FEES_SOURCE.url,
    });
  }
  index.push({ id: site.id, name: site.name, key: nameKey(site.name), keyNe: nameKeyNe(site.nameNepali), parent: site.parentSiteId ? nameKey(parentName.get(site.parentSiteId) ?? '') : [], tier: site.tier ?? 3, chunks: ids });
}

// A listed place that is also a curated site (same name, or same distinctive
// words) is answered from the curated page; its Nepali name is lent to the
// curated entry when that has none, so a Nepali question still finds it.
const curatedByKey = new Map(index.map((entry) => [entry.key.join(' '), entry]));
const curatedNames = new Set(demoSites.map((site) => site.name.toLowerCase()));
for (const place of PLACES) {
  const curated = curatedByKey.get(nameKey(place.name).join(' '));
  if (curated || curatedNames.has(place.name.toLowerCase())) {
    if (curated && !curated.keyNe.length) curated.keyNe = nameKeyNe(place.nameNepali);
    continue;
  }
  const note = placeNote(place.id);
  const fee = place.feeId ? ENTRY_FEES.find((f) => f.id === place.feeId) : undefined;
  if (!place.description && !note && !fee) continue;
  const key = nameKey(place.name);
  if (!key.length) continue;
  const ids = [];
  const base = { uid: place.id, collection: 'place' };
  const facts = [
    place.description ? `${place.name}: ${place.description}.` : null,
    place.hours ? `Opening hours as mapped on OpenStreetMap: ${place.hours}.` : null,
    place.wheelchair ? `Wheelchair access as mapped on OpenStreetMap: ${place.wheelchair}.` : null,
  ].filter(Boolean);
  if (facts.length) {
    const chunk_id = `place:${place.id}:about`;
    ids.push(chunk_id);
    push({
      chunk_id,
      segments: [chunk_id],
      ...base,
      title_en: place.name,
      english: facts.join(' '),
      translator: place.sources.includes('wikidata') ? 'Wikidata' : 'OpenStreetMap contributors',
      license: place.sources.includes('osm') ? 'ODbL (OpenStreetMap), CC0 (Wikidata)' : 'CC0 (Wikidata)',
      source_id: place.wikidata ? `wikidata-${place.wikidata}` : place.id,
      source_url: place.wikidata ? `https://www.wikidata.org/wiki/${place.wikidata}` : 'https://www.openstreetmap.org/',
    });
  }
  if (note) {
    const chunk_id = `place:${place.id}:note`;
    ids.push(chunk_id);
    push({
      chunk_id,
      segments: [chunk_id],
      ...base,
      title_en: `${place.name}: ${note.heading.toLowerCase()}`,
      english: `${note.body} Visitor rules: ${note.rules.join(' ')}`,
      translator: note.sources[0]?.title ?? 'Sākṣī site guide',
      license: 'Sākṣī site guide; rules as the site states them',
      source_id: place.id,
      source_url: note.sources[0]?.url,
    });
  }
  if (fee) {
    const chunk_id = `place:${place.id}:fee`;
    ids.push(chunk_id);
    push({
      chunk_id,
      segments: [chunk_id],
      ...base,
      title_en: `${place.name}: entry fee`,
      english: feeText(place.name, fee),
      translator: 'Nepal Tourism Board',
      license: 'Facts recorded from the official page',
      source_id: 'ntb-fees',
      source_url: FEES_SOURCE.url,
    });
  }
  index.push({ id: place.id, name: place.name, key, keyNe: nameKeyNe(place.nameNepali), parent: [], tier: 4, chunks: ids });
}

const body = `/**
 * core/dhamma/sites.generated.ts — DO NOT EDIT BY HAND.
 *
 * Generated by tools/gen-site-corpus.mjs from the app's own site pages, the
 * listed places and the official fees. Regenerate after changing any of them:
 *
 *   node --experimental-strip-types tools/gen-site-corpus.mjs
 *
 * \`npm run validate\` fails if this file is stale.
 */

import type { BilaraChunk } from './bilara.ts';

export type SiteIndexEntry = {
  id: string;
  name: string;
  /** Every one of these words must appear in a question for it to name this place. */
  key: string[];
  /** The same for the Devanagari name: stems that must all appear in a Nepali question. Empty when there is no Nepali name. */
  keyNe: string[];
  /** The parent complex's key, used only to choose between namesakes. */
  parent: string[];
  /** 1 is a primary site, 4 a listed place. */
  tier: number;
  chunks: string[];
};

export const SITE_CHUNKS: BilaraChunk[] = [
${chunks.map((chunk) => `  ${JSON.stringify(chunk)},`).join('\n')}
];

export const SITE_INDEX: SiteIndexEntry[] = [
${index.map((entry) => `  ${JSON.stringify(entry)},`).join('\n')}
];
`;

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(OUT, 'utf8');
  } catch {
    // missing counts as stale
  }
  if (current !== body) {
    console.error('core/dhamma/sites.generated.ts is stale; run node --experimental-strip-types tools/gen-site-corpus.mjs');
    process.exit(1);
  }
  console.log(`site corpus up to date: ${chunks.length} passages, ${index.length} places`);
} else {
  writeFileSync(OUT, body);
  console.log(`wrote ${chunks.length} passages for ${index.length} places`);
}
