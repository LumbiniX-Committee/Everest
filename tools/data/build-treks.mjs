// Builds the trekking routes from seed/treks.json and open data.
//
//   node tools/data/build-treks.mjs            fetch, measure, write
//   node tools/data/build-treks.mjs --cached   rebuild from the last fetch only
//
// What comes from where:
// - Stop positions: OpenStreetMap, matched by name near the seed's rough
//   position. A stop OSM does not have keeps the rough position and is marked
//   approximate, never passed off as mapped.
// - The line walked each day: Valhalla pedestrian routing over OSM trails.
//   A leg the router cannot find, or finds absurdly long, is left out and
//   the day's distance becomes unknown (null), not a straight-line guess.
// - Altitudes and the climb each day: Open-Meteo's elevation API (Copernicus
//   DEM, 90 m cells). On steep valley sides that is good to tens of metres,
//   and the app says so.
// - Walking time: an estimate from distance and climb (see estimateHours).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
const CACHE = new URL('harvest/treks-cache/', ROOT);
const cached = process.argv.includes('--cached');
const AGENT = 'saksi-data-pipeline/1.0 (open heritage guide; https://github.com/siddantasodari4-eng/saksi)';
const ROUTER = 'https://valhalla1.openstreetmap.de/route';
const SNAP_RADIUS_M = 4000;
/** Profile and stored line spacing. Finer adds size without adding truth at 90 m DEM cells. */
const SAMPLE_M = 120;

const seed = JSON.parse(readFileSync(new URL('seed/treks.json', ROOT), 'utf8'));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url, options = {}, attempts = 4) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(100_000), ...options, headers: { 'User-Agent': AGENT, ...(options.headers ?? {}) } });
      if (response.ok) return response.json();
      // Valhalla answers 400 when no route exists. That is a result, not a fault.
      if (response.status === 400) return { error: await response.text() };
      if (attempt >= attempts || ![429, 502, 503, 504].includes(response.status)) {
        throw new Error(`${response.status} from ${url}`);
      }
    } catch (error) {
      if (attempt >= attempts) throw error;
    }
    await sleep(10_000 * attempt);
  }
}

async function cachedJson(name, fetcher) {
  const file = new URL(name, CACHE);
  // Cache first, so a rerun after a seed edit only asks the services for what changed.
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  if (cached) throw new Error(`no cached ${name}; run without --cached first`);
  const data = await fetcher();
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(file, JSON.stringify(data));
  return data;
}

function haversine([lat1, lon1], [lat2, lon2]) {
  const r = 6371008.8;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

/** Valhalla's shape encoding: a Google polyline at six decimal places. */
function decodePolyline6(encoded) {
  const points = [];
  let index = 0;
  let lat = 0;
  let lon = 0;
  while (index < encoded.length) {
    for (const axis of [0, 1]) {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta;
      else lon += delta;
    }
    points.push([lat / 1e6, lon / 1e6]);
  }
  return points;
}

/** Evenly spaced points along a line, keeping both ends. */
function resample(line, spacing) {
  if (line.length < 2) return line;
  const out = [line[0]];
  let carried = 0;
  for (let i = 1; i < line.length; i += 1) {
    const a = line[i - 1];
    const b = line[i];
    const seg = haversine(a, b);
    let along = spacing - carried;
    while (along < seg) {
      const t = along / seg;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      along += spacing;
    }
    carried = seg - (along - spacing);
  }
  const last = line[line.length - 1];
  if (haversine(out[out.length - 1], last) > 1) out.push(last);
  return out;
}

function lineLength(line) {
  let total = 0;
  for (let i = 1; i < line.length; i += 1) total += haversine(line[i - 1], line[i]);
  return total;
}

async function snapStops(trek) {
  // One small query per stop: a single query for every stop times out on the
  // public server, and a timed-out reply is an empty list that looks like "no match".
  const elements = [];
  for (const stop of trek.stops) {
    const query = `[out:json][timeout:60];node(around:${SNAP_RADIUS_M},${stop.approx[0]},${stop.approx[1]})["name"];out;`;
    const data = await cachedJson(`osm-${trek.id}-${stop.id}.json`, async () => {
      await sleep(1500);
      const reply = await fetchJson('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (reply.remark && /error|timed out/i.test(reply.remark)) throw new Error(`Overpass: ${reply.remark}`);
      return reply;
    });
    elements.push(...data.elements);
  }
  const data = { elements };
  // Settlements and summits beat the lodges and shops that borrow their names.
  const rank = (tags) =>
    tags.place ? 0 : tags.natural === 'peak' || tags.mountain_pass || tags.tourism === 'viewpoint' ? 1 : tags.amenity === 'place_of_worship' ? 1 : 2;
  return trek.stops.map((stop) => {
    const pattern = new RegExp(stop.osm, 'i');
    // Many villages carry their name in Devanagari, with English in name:en,
    // and transliterations carry diacritics (Kyāṅjiṅ Ri). Match any of them, plainly.
    const plain = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const names = (tags) => ['name', 'name:en', 'int_name', 'alt_name'].map((key) => tags?.[key]).filter(Boolean).map(plain);
    const candidates = data.elements
      .filter((element) => names(element.tags).some((name) => pattern.test(name)))
      .map((element) => ({ element, distance: haversine(stop.approx, [element.lat, element.lon]) }))
      .filter((candidate) => candidate.distance <= SNAP_RADIUS_M)
      .sort((a, b) => rank(a.element.tags) - rank(b.element.tags) || a.distance - b.distance);
    const best = candidates[0];
    if (!best) {
      console.warn(`  ${trek.id}/${stop.id}: not in OSM near the seed position; kept as approximate`);
      return { ...stop, position: stop.approx, mapped: false, osmId: null };
    }
    return {
      ...stop,
      position: [best.element.lat, best.element.lon],
      mapped: true,
      osmId: `node/${best.element.id}`,
    };
  });
}

async function routeLeg(trekId, from, to) {
  const key = `leg-${trekId}-${from.id}-${to.id}.json`;
  const data = await cachedJson(key, async () => {
    await sleep(1200); // the public router asks for gentle use
    return fetchJson(ROUTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: [
          { lat: from.position[0], lon: from.position[1] },
          { lat: to.position[0], lon: to.position[1] },
        ],
        costing: 'pedestrian',
        costing_options: { pedestrian: { max_hiking_difficulty: 6 } },
        units: 'kilometers',
      }),
    });
  });
  const shape = data.trip?.legs?.[0]?.shape;
  if (!shape) {
    console.warn(`  ${trekId}: no trail found ${from.id} → ${to.id}`);
    return null;
  }
  const line = decodePolyline6(shape);
  const straight = haversine(from.position, to.position);
  const walked = lineLength(line);
  // A road detour many times the straight distance is the router failing to
  // find the trail, not the trail. Better unknown than wrong.
  if (straight > 300 && walked > straight * 4.5) {
    console.warn(`  ${trekId}: ${from.id} → ${to.id} routed ${Math.round(walked)} m for ${Math.round(straight)} m straight; dropped`);
    return null;
  }
  return line;
}

async function elevations(trekId, label, points) {
  const out = [];
  for (let i = 0; i < points.length; i += 100) {
    const chunk = points.slice(i, i + 100);
    const data = await cachedJson(`dem-${trekId}-${label}-${i}.json`, async () => {
      await sleep(300);
      const lat = chunk.map((p) => p[0].toFixed(5)).join(',');
      const lon = chunk.map((p) => p[1].toFixed(5)).join(',');
      return fetchJson(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`);
    });
    if (!Array.isArray(data.elevation) || data.elevation.length !== chunk.length) {
      throw new Error(`elevation reply for ${trekId}/${label} did not match the request`);
    }
    out.push(...data.elevation.map((value) => (Number.isFinite(value) ? Math.round(value) : null)));
  }
  return out;
}

/**
 * The profile averaged over about 600 m of trail (two samples either side).
 * A 90 m elevation grid on a steep valley side jumps between the valley floor
 * and the slope above it; unsmoothed, those jumps add hundreds of metres of
 * climb that nobody walks.
 */
function smoothProfile(profile, half = 2) {
  return profile.map((_, i) => {
    const window = profile.slice(Math.max(0, i - half), i + half + 1).filter((value) => value != null);
    return window.length ? Math.round(window.reduce((sum, value) => sum + value, 0) / window.length) : null;
  });
}

/**
 * Climb and descent, ignoring wobbles smaller than the model can tell apart.
 * A 90 m cell grid on a valley side flickers; summing every flicker inflates
 * the climb, so changes count only once they pass a threshold.
 */
function climb(profile) {
  const threshold = 10;
  let up = 0;
  let down = 0;
  let anchor = null;
  for (const value of profile) {
    if (value == null) continue;
    if (anchor == null) {
      anchor = value;
      continue;
    }
    const delta = value - anchor;
    if (delta >= threshold) {
      up += delta;
      anchor = value;
    } else if (delta <= -threshold) {
      down -= delta;
      anchor = value;
    }
  }
  return { ascentM: Math.round(up), descentM: Math.round(down) };
}

/**
 * Hours of walking, without breaks: 3 km an hour, plus an hour for every 400 m
 * climbed and every 2,000 m descended, and 10% slower for each 1,000 m above
 * 3,500 m. Tuned so that, across these three treks, the day times land within
 * about 40 minutes of the times commonly quoted for each stage. Keep in step
 * with estimateTrekHours in core/treks/progress.ts.
 */
function estimateHours(distanceM, ascentM, descentM, maxAltM) {
  const base = distanceM / 3000 + ascentM / 400 + descentM / 2000;
  const altitudeFactor = maxAltM != null && maxAltM > 3500 ? 1 + 0.1 * ((maxAltM - 3500) / 1000) : 1;
  return Math.round(base * altitudeFactor * 2) / 2;
}

async function buildTrek(trek) {
  console.log(`${trek.name}`);
  const stops = await snapStops(trek);
  const byId = new Map(stops.map((stop) => [stop.id, stop]));
  const stopElevations = await elevations(trek.id, 'stops', stops.map((stop) => stop.position));
  stops.forEach((stop, index) => {
    stop.elevationM = stopElevations[index];
  });

  const days = [];
  const fullLine = [];
  for (const [index, day] of trek.days.entries()) {
    const legs = [];
    let complete = day.route.length > 1;
    for (let i = 1; i < day.route.length; i += 1) {
      const from = byId.get(day.route[i - 1]);
      const to = byId.get(day.route[i]);
      if (!from || !to) throw new Error(`${trek.id} day ${index + 1}: unknown stop`);
      const line = await routeLeg(trek.id, from, to);
      if (!line) complete = false;
      else legs.push(...(legs.length ? line.slice(1) : line));
    }
    const sampled = resample(legs, SAMPLE_M);
    const profile = sampled.length > 1 ? smoothProfile(await elevations(trek.id, `day${index + 1}`, sampled)) : [];
    const known = profile.filter((value) => value != null);
    const highM = known.length ? Math.max(...known) : null;
    const { ascentM, descentM } = climb(profile);
    const distanceM = complete ? Math.round(lineLength(legs)) : null;
    const sleepStop = day.sleep ? byId.get(day.sleep) : null;
    const restStop = day.rest ? byId.get(day.rest) : null;
    days.push({
      day: index + 1,
      from: day.route[0] ?? day.rest ?? null,
      to: day.route[day.route.length - 1] ?? day.rest ?? null,
      via: day.route.slice(1, -1),
      rest: Boolean(restStop),
      sleep: day.sleep ?? null,
      sleepElevationM: sleepStop?.elevationM ?? null,
      distanceM,
      ascentM: complete ? ascentM : null,
      descentM: complete ? descentM : null,
      highestM: highM,
      hours: complete ? estimateHours(distanceM, ascentM, descentM, highM) : null,
      note: day.note,
      // Rounded to 5 decimals: about a metre, plenty for drawing.
      line: sampled.map(([lat, lon]) => [Number(lon.toFixed(5)), Number(lat.toFixed(5))]),
      profile: complete ? profile : [],
    });
    fullLine.push(...sampled);
  }

  const daysKnown = days.filter((day) => !day.rest);
  const allKnown = daysKnown.every((day) => day.distanceM != null);
  const sum = (key) => (allKnown ? daysKnown.reduce((total, day) => total + day[key], 0) : null);
  const highest = stops.reduce((best, stop) => (stop.elevationM != null && (!best || stop.elevationM > best.elevationM) ? stop : best), null);

  // Above 3,000 m, a night more than 500 m above the last is the usual warning sign.
  let lastSleep = stops.find((stop) => stop.id === trek.days[0].route[0])?.elevationM ?? null;
  for (const day of days) {
    const sleepM = day.sleepElevationM;
    day.sleepGainM = sleepM != null && lastSleep != null ? sleepM - lastSleep : null;
    day.fastGain = sleepM != null && sleepM > 3000 && day.sleepGainM != null && day.sleepGainM > 500;
    if (sleepM != null) lastSleep = sleepM;
  }

  return {
    id: trek.id,
    name: trek.name,
    nameNepali: trek.nameNepali,
    hub: trek.hub,
    region: trek.region,
    difficulty: trek.difficulty,
    summary: trek.summary,
    seasons: trek.seasons,
    access: trek.access,
    permits: trek.permits,
    safety: trek.safety,
    sources: trek.sources,
    checked: seed.checked,
    totals: {
      days: days.length,
      distanceM: sum('distanceM'),
      ascentM: sum('ascentM'),
      descentM: sum('descentM'),
      walkingHours: sum('hours'),
      highest: highest ? { stopId: highest.id, elevationM: highest.elevationM } : null,
    },
    stops: stops.map((stop) => ({
      id: stop.id,
      name: stop.name,
      kind: stop.kind,
      coordinate: { latitude: Number(stop.position[0].toFixed(5)), longitude: Number(stop.position[1].toFixed(5)) },
      mapped: stop.mapped,
      osmId: stop.osmId,
      elevationM: stop.elevationM,
      note: stop.note,
    })),
    days,
  };
}

const treks = [];
for (const trek of seed.treks) treks.push(await buildTrek(trek));

for (const trek of treks) {
  const t = trek.totals;
  console.log(
    `${trek.id}: ${t.days} days, ${t.distanceM == null ? '?' : (t.distanceM / 1000).toFixed(1)} km, +${t.ascentM ?? '?'} m, ` +
      `high ${t.highest?.elevationM ?? '?'} m, ${trek.stops.filter((stop) => !stop.mapped).length} approximate stops`,
  );
}

const header = `// Generated by tools/data/build-treks.mjs from seed/treks.json, OpenStreetMap
// (ODbL), Valhalla routing and the Open-Meteo elevation API. Do not edit.
import type { Trek } from '../../types/treks.ts';

export const TREKS: readonly Trek[] = `;
writeFileSync(new URL('data/generated/treks.ts', ROOT), `${header}${JSON.stringify(treks)};\n`);
console.log('wrote data/generated/treks.ts');
