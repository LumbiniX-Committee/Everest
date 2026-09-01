/**
 * Publish the site register as open data.
 *
 * The competitive reading in the research report is that Arches and the other
 * heritage inventory platforms are systems of record that never acquire, and
 * that the right posture is for Sākṣī to feed them rather than to compete. That
 * posture is a promise until the data can actually leave in a format a GIS
 * reads without being asked, so this writes the register out as GeoJSON and CSV
 * beside a manifest that says where every number came from.
 *
 * Two honesty rules carry through from the app into the export:
 *
 *   - Coordinate provenance travels with the coordinate. `coords_source: doc`
 *     means a figure read off a document and never checked against a gazetteer,
 *     and it is exported as `surveyed: false` rather than quietly rounded into
 *     looking like a survey.
 *   - Nothing is asserted that the seed does not carry. Fields that are absent
 *     are absent, not defaulted to zero or to an empty string that reads as a
 *     measurement.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const seed = join(here, '..', '..', 'seed');
const out = join(here, '..', 'public', 'data');

const read = async (n) => JSON.parse(await readFile(join(seed, n), 'utf8'));
const [sites, vantages] = await Promise.all([read('sites.json'), read('vantages.json')]);

const REGION = {
  sacred_garden: 'Lumbini',
  monastic_east: 'Lumbini',
  monastic_west: 'Lumbini',
  greater_lumbini: 'Lumbini',
  kathmandu_valley: 'Kathmandu Valley',
};

const siteFeatures = sites.map((s) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [s.coords.lon, s.coords.lat] },
  properties: {
    id: s.id,
    name_en: s.name.en,
    name_ne: s.name.ne ?? null,
    region: REGION[s.zone] ?? null,
    zone: s.zone,
    tier: s.tier ?? null,
    /* False means the coordinate came off a document and has never been
       checked. Exported rather than hidden, so nobody mistakes it for survey. */
    surveyed: s.coords_source === 'osm',
    coords_source: s.coords_source ?? null,
    geofence_m: s.geofence_m ?? null,
    period_from: s.period?.from ?? null,
    period_to: s.period?.to ?? null,
    photography: s.photography ?? null,
    established_vantages: vantages.filter((v) => v.site_id === s.id && v.active !== false).length,
    sources: (s.sources ?? []).map((x) => x.title),
    source_urls: (s.sources ?? []).map((x) => x.url ?? null),
  },
}));

const vantageFeatures = vantages
  .filter((v) => v.active !== false)
  .map((v) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [v.coords.lon, v.coords.lat] },
    properties: {
      id: v.id,
      site_id: v.site_id,
      label_en: v.label?.en ?? null,
      /* The four numbers that make a vantage repeatable by someone else. */
      heading_deg: v.heading_deg ?? null,
      pitch_deg: v.pitch_deg ?? null,
      hfov_deg: v.hfov_deg ?? null,
      tolerance_position_m: v.tol_pos_m ?? null,
      tolerance_heading_deg: v.tol_heading_deg ?? null,
      reference_year: v.reference_year ?? null,
      reference_source: v.reference_src ?? null,
      reference_licence: v.reference_lic ?? null,
    },
  }));

const collection = (features, name) => ({
  type: 'FeatureCollection',
  name,
  crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
  features,
});

/** RFC 4180: quote everything, double any embedded quote. */
function csv(rows, columns) {
  const cell = (v) => {
    if (v == null) return '';
    const s = Array.isArray(v) ? v.join('; ') : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [
    columns.join(','),
    ...rows.map((r) => columns.map((c) => cell(r[c])).join(',')),
  ].join('\n');
}

const siteRows = siteFeatures.map((f) => ({
  ...f.properties,
  longitude: f.geometry.coordinates[0],
  latitude: f.geometry.coordinates[1],
}));

const SITE_COLUMNS = [
  'id', 'name_en', 'name_ne', 'region', 'zone', 'tier',
  'latitude', 'longitude', 'surveyed', 'coords_source', 'geofence_m',
  'period_from', 'period_to', 'photography', 'established_vantages', 'sources',
];

const manifest = {
  name: 'Sākṣī heritage site register',
  description:
    'Heritage sites and established photographic vantages for Lumbini and three Kathmandu Valley monument-zone sites, as shipped in the Sākṣī application.',
  /* A content hash rather than a build date. The output is committed and CI
     fails when it drifts from seed/, so a timestamp would have failed that
     check every day after the commit that wrote it — for no reason, since
     nothing had changed. A hash answers the question a consumer actually has:
     is this the same data I already have? */
  version: createHash('sha256')
    .update(JSON.stringify({ sites: siteFeatures, vantages: vantageFeatures }))
    .digest('hex')
    .slice(0, 12),
  source: 'https://github.com/LumbiniX-Committee/Everest — seed/sites.json, seed/vantages.json',
  crs: 'EPSG:4326 (WGS 84), longitude before latitude',
  counts: {
    sites: siteFeatures.length,
    sites_with_checked_coordinates: siteFeatures.filter((f) => f.properties.surveyed).length,
    established_vantages: vantageFeatures.length,
  },
  licence: 'CC-BY-4.0',
  licence_url: 'https://creativecommons.org/licenses/by/4.0/',
  attribution:
    'Heritage site register from Sākṣī (LumbiniX-Committee), CC BY 4.0, https://github.com/LumbiniX-Committee/Everest',
  /* The OSM obligation is not ours to waive, so it travels with the file
     rather than living only in a licence document nobody fetches. */
  licence_note:
    'The compilation is CC BY 4.0. Coordinates recorded with coords_source "osm" derive from OpenStreetMap, are © OpenStreetMap contributors under the Open Database Licence, and carry ODbL attribution and share-alike terms that this grant cannot relicense. Source code is Apache-2.0. Third-party media is itemised in LICENCES.md.',
  caveats: [
    'A site with surveyed=false has a coordinate read from a document and never checked against a gazetteer. It is indicative, not survey-grade.',
    'Vantage tolerances describe when the application accepts an alignment as measured; they are not an accuracy claim about the coordinate itself.',
    'Absent values are null. No field is defaulted to zero, because a zero here would read as a measurement.',
  ],
  files: [
    { path: 'sites.geojson', format: 'GeoJSON', records: siteFeatures.length },
    { path: 'sites.csv', format: 'CSV (RFC 4180, UTF-8)', records: siteFeatures.length },
    { path: 'vantages.geojson', format: 'GeoJSON', records: vantageFeatures.length },
  ],
};

await mkdir(out, { recursive: true });
await Promise.all([
  writeFile(join(out, 'sites.geojson'), JSON.stringify(collection(siteFeatures, 'sakshi_sites'), null, 2)),
  writeFile(join(out, 'vantages.geojson'), JSON.stringify(collection(vantageFeatures, 'sakshi_vantages'), null, 2)),
  writeFile(join(out, 'sites.csv'), `${csv(siteRows, SITE_COLUMNS)}\n`),
  writeFile(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`),
]);

console.log(
  `[open-data] ${siteFeatures.length} sites, ${vantageFeatures.length} vantages -> public/data/`,
);
