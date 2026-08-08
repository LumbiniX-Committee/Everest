/**
 * shared/geo.ts — the geodesy primitives, one implementation.
 *
 * Lane A needs these for geofencing, distance labels and pradakṣiṇā. Lane B
 * needs the same four functions for the alignment engine (B-CAPTURE-AND-AR.md
 * task 2.1). Two haversines that disagree by a metre is the kind of bug that
 * costs an hour at 3am, so there is one copy and it lives here.
 *
 * Source: 04-ARCHITECTURE.md §5.
 *
 * Changes by group agreement only.
 */

import type { Coords } from './types.ts';

/** WGS-84 mean earth radius, metres. */
export const EARTH_RADIUS_M = 6_371_008.8;

export const toRad = (deg: number): number => (deg * Math.PI) / 180;
export const toDeg = (rad: number): number => (rad * 180) / Math.PI;

export const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Great-circle distance in metres.
 *
 * Haversine rather than Vincenty: at Lumbini's scale (a 9 km² zone) the
 * difference is under a centimetre, and haversine cannot fail to converge.
 */
export function haversine(a: Coords, b: Coords): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Initial bearing from `a` to `b`, degrees clockwise from true north, 0–360.
 *
 * True north, not magnetic. Anything reading the device magnetometer must apply
 * declination before comparing against this (Lumbini's is roughly +0.3°E, small
 * enough to ignore next to the drift the doc warns about, but be explicit about
 * which north you are in).
 */
export function bearing(a: Coords, b: Coords): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Shortest signed angular distance from `from` to `to`, in (-180, 180].
 *
 * Positive means `to` is clockwise of `from`. This sign convention is what
 * pradakṣiṇā detection depends on — clockwise accumulates positive — so do not
 * flip it without reading app/src/map/pradakshina.ts.
 */
export function angleDiff(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

/** Normalise any angle into 0–360. */
export function normaliseHeading(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Destination point given a start, a bearing and a distance. Used by the tests
 * to build synthetic tracks, and by the map to place the heading cone.
 */
export function destination(from: Coords, bearingDeg: number, distanceM: number): Coords {
  const d = distanceM / EARTH_RADIUS_M;
  const brg = toRad(bearingDeg);
  const lat1 = toRad(from.lat);
  const lon1 = toRad(from.lon);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brg),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brg) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );

  return { lat: toDeg(lat2), lon: ((toDeg(lon2) + 540) % 360) - 180 };
}

/**
 * Human distance label. Metres under a kilometre, one decimal above.
 *
 * Voice rule (07-DESIGN-SYSTEM §6): plain and specific. "180 m", not
 * "just a short stroll away".
 */
export function formatDistance(metres: number): string {
  if (!Number.isFinite(metres)) return '—';
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

/** Eight-point compass label for an arrow hint, e.g. "north-east". */
export function compassLabel(headingDeg: number): string {
  const points = [
    'north', 'north-east', 'east', 'south-east',
    'south', 'south-west', 'west', 'north-west',
  ];
  return points[Math.round(normaliseHeading(headingDeg) / 45) % 8];
}

/**
 * Geohash encode. Used to cluster condition reports (~76 m cells at precision 7)
 * and to bin harvested imagery into vantages.
 */
const GEOHASH_BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function geohash(coords: Coords, precision = 7): string {
  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;

  let hash = '';
  let bit = 0;
  let ch = 0;
  let even = true;

  while (hash.length < precision) {
    if (even) {
      const mid = (lonMin + lonMax) / 2;
      if (coords.lon >= mid) {
        ch = (ch << 1) | 1;
        lonMin = mid;
      } else {
        ch = ch << 1;
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (coords.lat >= mid) {
        ch = (ch << 1) | 1;
        latMin = mid;
      } else {
        ch = ch << 1;
        latMax = mid;
      }
    }
    even = !even;

    if (++bit === 5) {
      hash += GEOHASH_BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

/**
 * The Lumbini bounding box used throughout — the PMTiles extract, the Mapillary
 * query, and the seed coordinate sanity check all use these numbers.
 */
export const LUMBINI_BBOX = {
  west: 83.24,
  south: 27.44,
  east: 83.31,
  north: 27.51,
} as const;

/** Lumbini centre, per 05-CONTENT-SPEC §1. */
export const LUMBINI_CENTRE: Coords = { lat: 27.48139, lon: 83.27583 };

export function insideLumbiniBbox(c: Coords): boolean {
  return (
    c.lon >= LUMBINI_BBOX.west &&
    c.lon <= LUMBINI_BBOX.east &&
    c.lat >= LUMBINI_BBOX.south &&
    c.lat <= LUMBINI_BBOX.north
  );
}
