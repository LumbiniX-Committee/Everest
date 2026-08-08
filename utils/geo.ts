import { angleDiff, bearing as bearingCoords, haversine, normaliseHeading } from '@/shared/geo';
import type { Coordinate } from '@/types';

/**
 * Geo helpers for the app's `{latitude, longitude}` shape.
 *
 * The maths lives once, in `shared/geo.ts` (also used by `core/` and unit-tested
 * there) — this module is a thin adapter over it, converting the app's
 * `Coordinate` to the shared `{lat, lon}`. Previously the two carried
 * byte-identical copies of haversine/bearing; a single source cannot drift.
 */

const toCoords = (c: Coordinate) => ({ lat: c.latitude, lon: c.longitude });

/** Great-circle distance in metres. */
export function distanceMeters(a: Coordinate, b: Coordinate): number {
  return haversine(toCoords(a), toCoords(b));
}

/** Initial bearing from `a` to `b`, degrees clockwise from true north, 0–360. */
export function bearingDegrees(a: Coordinate, b: Coordinate): number {
  return bearingCoords(toCoords(a), toCoords(b));
}

/** Wrap any angle into 0–360. */
export function normalizeBearing(deg: number): number {
  return normaliseHeading(deg);
}

/**
 * Signed shortest turn from `from` to `to`, in −180…180.
 * Negative means turn left. This is what the reticle needs, not raw bearings.
 */
export function bearingDelta(from: number, to: number): number {
  return angleDiff(from, to);
}

/** Eight-point compass label, for prose next to the numeric bearing. */
export function compassPoint(deg: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(normalizeBearing(deg) / 45) % 8];
}
