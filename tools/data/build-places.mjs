// Builds the app's place listings from open data: OpenStreetMap for the four hubs
// and Wikidata for notable places across Nepal.
//
//   node tools/data/build-places.mjs            fetch, merge, write
//   node tools/data/build-places.mjs --cached   rebuild from the last fetch only
//
// Rules this script keeps:
// - Every record carries its source and licence. OSM data is ODbL, so it stays a
//   separable file (seed/places.json) with attribution wherever it is shown.
// - Nothing is filled in. A missing value stays missing; the app shows it as not
//   known rather than guessing.
// - Places that duplicate one of the app's own heritage sites are dropped, so the
//   curated record always wins over the listing.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
const CACHE = new URL('harvest/places-cache/', ROOT);
const cached = process.argv.includes('--cached');
const AGENT = 'saksi-data-pipeline/1.0 (open heritage guide; https://github.com/siddantasodari4-eng/saksi)';

/** The four places this release covers in depth. South, west, north, east. */
const HUBS = {
  lumbini: [27.4, 83.0, 27.62, 83.36],
  kathmandu: [27.55, 85.2, 27.82, 85.55],
  pokhara: [28.13, 83.88, 28.32, 84.06],
  chitwan: [27.45, 84.25, 27.66, 84.56],
};

const NEPAL = { south: 26.3, west: 80.0, north: 30.5, east: 88.25 };

async function fetchWithRetry(url, options, attempts = 3) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (attempt >= attempts || ![429, 502, 503, 504].includes(response.status)) {
        throw new Error(`${response.status} from ${url}`);
      }
    } catch (error) {
      if (attempt >= attempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 15_000 * attempt));
  }
}

async function cachedJson(name, fetcher) {
  const file = new URL(name, CACHE);
  if (cached) {
    if (!existsSync(file)) throw new Error(`no cached ${name}; run without --cached first`);
    return JSON.parse(readFileSync(file, 'utf8'));
  }
  const data = await fetcher();
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(file, JSON.stringify(data));
  return data;
}

function overpassFor([s, w, n, e]) {
  const box = `${s},${w},${n},${e}`;
  return `[out:json][timeout:120];(
    nwr["tourism"~"^(attraction|museum|viewpoint|gallery|zoo)$"]["name"](${box});
    nwr["historic"~"^(monument|memorial|archaeological_site|castle|ruins|temple|building|city_gate|fort|palace|monastery|wayside_shrine)$"]["name"](${box});
    nwr["amenity"="place_of_worship"]["name"]["wikidata"](${box});
    nwr["leisure"~"^(park|nature_reserve)$"]["name"]["wikidata"](${box});
  );out center tags;`;
}

async function fetchOsm(hub) {
  return cachedJson(`osm-${hub}.json`, async () => {
    const response = await fetchWithRetry('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'User-Agent': AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassFor(HUBS[hub]))}`,
    });
    return response.json();
  });
}

/** Notable places nationwide: tourist sites, religious and heritage buildings, parks and lakes. */
const WIKIDATA_QUERY = `
SELECT DISTINCT ?item ?en ?ne ?descEn ?coord ?image ?article ?class WHERE {
  VALUES ?class { wd:Q570116 wd:Q44539 wd:Q180987 wd:Q44613 wd:Q33506 wd:Q16560 wd:Q839954 wd:Q46169 wd:Q23397 wd:Q2232001 wd:Q1060829 wd:Q11303 wd:Q4989906 wd:Q1128397 }
  ?item wdt:P17 wd:Q837; wdt:P31/wdt:P279* ?class; wdt:P625 ?coord.
  ?item rdfs:label ?en FILTER(lang(?en) = "en")
  OPTIONAL { ?item rdfs:label ?ne FILTER(lang(?ne) = "ne") }
  OPTIONAL { ?item schema:description ?descEn FILTER(lang(?descEn) = "en") }
  OPTIONAL { ?item wdt:P18 ?image }
  OPTIONAL { ?article schema:about ?item; schema:isPartOf <https://en.wikipedia.org/> }
}`;

/**
 * Notable places the class query misses because Wikidata files them under a
 * class this script does not list (a royal square is not a "palace"). Named
 * here one by one, each with the category it should show under.
 */
const EXTRA_ITEMS = {
  Q4900869: 'wd:Q16560', // Bhaktapur Durbar Square: shown as a palace square; its entry fee attaches to it.
};

const EXTRAS_QUERY = `
SELECT DISTINCT ?item ?en ?ne ?descEn ?coord ?image ?article ?class WHERE {
  VALUES (?item ?class) { ${Object.entries(EXTRA_ITEMS).map(([q, c]) => `(wd:${q} ${c})`).join(' ')} }
  ?item wdt:P625 ?coord.
  ?item rdfs:label ?en FILTER(lang(?en) = "en")
  OPTIONAL { ?item rdfs:label ?ne FILTER(lang(?ne) = "ne") }
  OPTIONAL { ?item schema:description ?descEn FILTER(lang(?descEn) = "en") }
  OPTIONAL { ?item wdt:P18 ?image }
  OPTIONAL { ?article schema:about ?item; schema:isPartOf <https://en.wikipedia.org/> }
}`;

async function fetchWikidataExtras() {
  return cachedJson(`wikidata-extras-${Object.keys(EXTRA_ITEMS).join('-')}.json`, async () => {
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(EXTRAS_QUERY)}`;
    const response = await fetchWithRetry(url, {
      headers: { 'User-Agent': AGENT, Accept: 'application/sparql-results+json' },
    });
    return response.json();
  });
}

async function fetchWikidata() {
  return cachedJson('wikidata-nepal.json', async () => {
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(WIKIDATA_QUERY)}`;
    const response = await fetchWithRetry(url, {
      headers: { 'User-Agent': AGENT, Accept: 'application/sparql-results+json' },
    });
    return response.json();
  });
}

const CLASS_CATEGORY = {
  Q44539: 'temple', Q180987: 'stupa', Q44613: 'monastery', Q33506: 'museum', Q16560: 'palace',
  Q839954: 'archaeological', Q46169: 'nature', Q23397: 'nature', Q2232001: 'nature', Q1060829: 'nature',
  Q11303: 'monument', Q4989906: 'monument', Q1128397: 'monument', Q570116: 'attraction',
};

function osmCategory(tags) {
  if (tags.tourism === 'museum' || tags.tourism === 'gallery') return 'museum';
  if (tags.tourism === 'viewpoint') return 'viewpoint';
  if (tags.tourism === 'zoo' || tags.leisure) return 'nature';
  if (tags.amenity === 'place_of_worship') {
    if (tags.religion === 'buddhist') return /stupa|chaitya/i.test(tags.name ?? '') ? 'stupa' : 'monastery';
    return 'temple';
  }
  if (tags.historic === 'archaeological_site' || tags.historic === 'ruins') return 'archaeological';
  if (tags.historic === 'castle' || tags.historic === 'palace' || tags.historic === 'fort') return 'palace';
  if (tags.historic === 'temple' || tags.historic === 'wayside_shrine') return 'temple';
  if (tags.historic) return 'monument';
  return 'attraction';
}

function hubOf(lat, lon) {
  for (const [hub, [s, w, n, e]] of Object.entries(HUBS)) {
    if (lat >= s && lat <= n && lon >= w && lon <= e) return hub;
  }
  return null;
}

const insideNepal = (lat, lon) => lat >= NEPAL.south && lat <= NEPAL.north && lon >= NEPAL.west && lon <= NEPAL.east;

function distanceM(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_008.8 * Math.asin(Math.sqrt(h));
}

const words = (name) => new Set(name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z]{3,}/g) ?? []);
function similarName(a, b) {
  const x = words(a);
  const y = words(b);
  const shared = [...x].filter((word) => y.has(word) && !['temple', 'the', 'and', 'mandir', 'square'].includes(word));
  return shared.length > 0;
}

function existingSites() {
  const read = (path) => JSON.parse(readFileSync(new URL(path, ROOT), 'utf8'));
  const seed = read('seed/sites.json').map((s) => ({ name: s.name.en, lat: s.coords.lat, lon: s.coords.lon }));
  const monuments = ['seed/patan-monuments.json', 'seed/kathmandu-monuments.json'].flatMap((path) =>
    read(path).map((m) => ({ name: m.name, lat: m.coords.lat, lon: m.coords.lon })),
  );
  return [...seed, ...monuments, { name: 'Kathmandu Durbar Square', lat: 27.7044, lon: 85.3073 }];
}

/** Names that describe a kind of thing rather than one place. */
const GENERIC_NAME = /^(stone spout|statue|shrine|temple|stupa|chaitya|view ?point|monument|memorial|museum|park)$/i;

const normalised = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');

/**
 * One record per place. The same stupa can arrive as a Wikidata item and as an
 * OSM node with a slightly different spelling; the richer record is kept, and
 * any practical details from the other are carried over.
 */
function mergeNearDuplicates(places) {
  const richness = (place) => (place.wikidata ? 4 : 0) + (place.description ? 2 : 0) + (place.image ? 1 : 0);
  const sorted = [...places].sort((a, b) => richness(b) - richness(a));
  const kept = [];
  for (const place of sorted) {
    const twin = kept.find((other) => {
      const d = distanceM(other, place);
      const a = normalised(other.name);
      const b = normalised(place.name);
      return d < 250 && (a === b || (a.length > 5 && b.length > 5 && (a.startsWith(b) || b.startsWith(a))));
    });
    if (twin) {
      twin.nameNe ??= place.nameNe;
      twin.hours ??= place.hours;
      twin.website ??= place.website;
      twin.wheelchair ??= place.wheelchair;
      twin.sources = [...new Set([...twin.sources, ...place.sources])];
    } else {
      kept.push({ ...place });
    }
  }
  return kept;
}

/** Official entry fees, recorded as facts from the Nepal Tourism Board, matched by name. */
function attachFees(places) {
  const fees = JSON.parse(readFileSync(new URL('seed/fees.json', ROOT), 'utf8'));
  for (const place of places) {
    const fee = fees.fees.find((entry) => entry.matchPlaceNames?.some((pattern) => new RegExp(pattern, 'i').test(place.name)));
    if (fee) place.feeId = fee.id;
  }
}

async function main() {
  const known = existingSites();
  const byKey = new Map();

  const keep = (place) => {
    if (!insideNepal(place.lat, place.lon)) return;
    // The app's own curated site wins over any listing of the same place.
    const duplicate = known.some((site) => {
      const d = distanceM(site, place);
      return d < 25 || (d < 120 && similarName(site.name, place.name));
    });
    if (duplicate) return;
    const key = place.wikidata ?? place.id;
    const existing = byKey.get(key);
    byKey.set(key, existing ? { ...place, ...existing, sources: [...new Set([...existing.sources, ...place.sources])] } : place);
  };

  // Wikidata first, so a hub's OSM record merges into it and keeps the richer fields.
  const wikidata = await fetchWikidata();
  const extras = await fetchWikidataExtras();
  for (const row of [...wikidata.results.bindings, ...extras.results.bindings]) {
    const match = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(row.coord.value);
    if (!match) continue;
    const qid = row.item.value.split('/').pop();
    const lon = Number(match[1]);
    const lat = Number(match[2]);
    if (byKey.has(qid)) continue;
    keep({
      id: `wd:${qid}`,
      wikidata: qid,
      name: row.en.value,
      nameNe: row.ne?.value ?? null,
      description: row.descEn?.value ?? null,
      category: CLASS_CATEGORY[row.class.value.split('/').pop()] ?? 'attraction',
      lat,
      lon,
      hub: hubOf(lat, lon),
      image: row.image ? decodeURIComponent(row.image.value.split('/').pop()) : null,
      wikipedia: row.article ? decodeURIComponent(row.article.value.split('/').pop()) : null,
      hours: null,
      website: null,
      wheelchair: null,
      sources: ['wikidata'],
    });
  }

  for (const hub of Object.keys(HUBS)) {
    const osm = await fetchOsm(hub);
    for (const element of osm.elements) {
      const tags = element.tags ?? {};
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      if (lat == null || lon == null || !tags.name) continue;
      const fromOsm = {
        id: `osm:${element.type}/${element.id}`,
        wikidata: tags.wikidata ?? null,
        name: tags['name:en'] ?? tags.name,
        nameNe: tags['name:ne'] ?? null,
        description: null,
        category: osmCategory(tags),
        lat,
        lon,
        hub,
        image: null,
        wikipedia: tags.wikipedia?.startsWith('en:') ? tags.wikipedia.slice(3) : null,
        hours: tags.opening_hours ?? null,
        website: tags.website ?? tags['contact:website'] ?? null,
        wheelchair: tags.wheelchair ?? null,
        sources: ['osm'],
      };
      const key = fromOsm.wikidata ?? fromOsm.id;
      const existing = byKey.get(key);
      if (existing) {
        // Wikidata keeps its names and description; OSM adds the practical details.
        byKey.set(key, {
          ...existing,
          nameNe: existing.nameNe ?? fromOsm.nameNe,
          hours: fromOsm.hours,
          website: fromOsm.website,
          wheelchair: fromOsm.wheelchair,
          hub: existing.hub ?? hub,
          sources: [...new Set([...existing.sources, 'osm'])],
        });
      } else {
        keep(fromOsm);
      }
    }
  }

  const places = mergeNearDuplicates(
    [...byKey.values()]
      // A Latin-script name is needed to show it to every visitor.
      .filter((place) => /[A-Za-z]/.test(place.name))
      // An OSM "attraction" with no Wikidata entry and no Nepali name is too often
      // a zoo exhibit or a shop sign to list as somewhere worth walking to.
      .filter((place) => !(place.category === 'attraction' && !place.wikidata && !place.nameNe))
      .filter((place) => !GENERIC_NAME.test(place.name)),
  ).sort((a, b) => a.name.localeCompare(b.name));
  attachFees(places);

  const out = {
    generatedAt: new Date().toISOString().slice(0, 10),
    licence: {
      osm: 'Contains information from OpenStreetMap, © OpenStreetMap contributors, available under the Open Database License (ODbL).',
      wikidata: 'Wikidata, available under CC0.',
    },
    places,
  };
  writeFileSync(new URL('seed/places.json', ROOT), `${JSON.stringify(out, null, 1)}\n`);

  const counts = Object.fromEntries(
    [...Object.keys(HUBS), null].map((hub) => [hub ?? 'national', places.filter((place) => place.hub === hub).length]),
  );
  console.log(`places: ${places.length}`, counts, `with fees: ${places.filter((place) => place.feeId).length}`);
}

await main();
