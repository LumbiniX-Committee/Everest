/**
 * Walking-route geometry: where on the route the walker is, and what to do next.
 *
 * Pure, so the same answers drive the guidance card and the tests.
 */
import { haversine } from '../../shared/geo.ts';

const distanceMeters = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) =>
  haversine({ lat: a.latitude, lon: a.longitude }, { lat: b.latitude, lon: b.longitude });

export type LngLat = readonly [number, number];

export type Maneuver = {
  instruction: string;
  /** Index into the route's coordinates where this manoeuvre begins. */
  beginIndex: number;
  /** Metres covered by this manoeuvre. */
  lengthM: number;
};

/** The route point nearest the walker. */
export function closestIndex(route: readonly LngLat[], position: { latitude: number; longitude: number }): number {
  let best = 0;
  let bestDistance = Infinity;
  route.forEach(([longitude, latitude], index) => {
    const distance = distanceMeters(position, { latitude, longitude });
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best;
}

/** Shortest distance from the walker to any segment of the route, in metres. */
export function distanceFromRoute(route: readonly LngLat[], position: { latitude: number; longitude: number }): number {
  if (route.length === 0) return Infinity;
  if (route.length === 1) return distanceMeters(position, { latitude: route[0][1], longitude: route[0][0] });

  // A flat local projection is accurate to well under a metre across a walk.
  const cos = Math.cos((position.latitude * Math.PI) / 180);
  const toXY = ([lng, lat]: LngLat) => [lng * 111_320 * cos, lat * 110_540] as const;
  const [px, py] = toXY([position.longitude, position.latitude]);

  let best = Infinity;
  for (let i = 0; i < route.length - 1; i += 1) {
    const [ax, ay] = toXY(route[i]);
    const [bx, by] = toXY(route[i + 1]);
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
    best = Math.min(best, Math.hypot(px - (ax + t * dx), py - (ay + t * dy)));
  }
  return best;
}

/** The next manoeuvre ahead of the walker, or null once past the last one. */
export function nextManeuver(maneuvers: readonly Maneuver[], walkerIndex: number): Maneuver | null {
  return maneuvers.find((maneuver) => maneuver.beginIndex > walkerIndex) ?? null;
}

/**
 * Whether the walker has left the route.
 *
 * Judged against the fix's own uncertainty: with a 40 m accuracy circle, being
 * 30 m "off" proves nothing, and rerouting on noise would make the line jump.
 */
export function isOffRoute(distanceM: number, accuracyM: number | null): boolean {
  const slack = Math.max(25, (accuracyM ?? 15) * 1.5);
  return distanceM > slack;
}
