import type { Coordinate, RegionId } from '@/types';

/** Maya Devi Temple — the sacred garden's centre, and the app's home point. */
export const LUMBINI_CENTER: Coordinate = {
  latitude: 27.4692,
  longitude: 83.2757,
};

/** Rough bounding box of the Lumbini Monastic Zone and sacred garden. */
export const LUMBINI_BOUNDS = {
  north: 27.4905,
  south: 27.4555,
  east: 83.3005,
  west: 83.2555,
} as const;

/**
 * Centre of the three Kathmandu Valley sites (Patan Durbar Square, Manga Hiti,
 * Changu Narayan) — roughly the midpoint between Patan and Changu Narayan, the
 * two ends of the valley cluster.
 */
export const KATHMANDU_VALLEY_CENTER: Coordinate = {
  latitude: 27.6949,
  longitude: 85.3765,
};

/** Bounding box wide enough for Patan Durbar Square, Manga Hiti and Changu Narayan. */
export const KATHMANDU_VALLEY_BOUNDS = {
  north: 27.735,
  south: 27.655,
  east: 85.445,
  west: 85.305,
} as const;

/**
 * Every region the app knows about, keyed by `HeritageSite.region`.
 *
 * A site without a `region` field is treated as `'lumbini'` everywhere this is
 * consulted — see `regionOf` — so the original twelve sites never needed
 * touching when this was introduced.
 */
type Bounds = { north: number; south: number; east: number; west: number };

export const REGIONS: Record<RegionId, { center: Coordinate; bounds: Bounds }> = {
  lumbini: { center: LUMBINI_CENTER, bounds: LUMBINI_BOUNDS },
  'kathmandu-valley': { center: KATHMANDU_VALLEY_CENTER, bounds: KATHMANDU_VALLEY_BOUNDS },
};

/** A site's region, defaulting to `'lumbini'` when the field is absent. */
export function regionOf(site: { region?: RegionId } | null | undefined): RegionId {
  return site?.region ?? 'lumbini';
}

/** Metres. Beyond this from the centre, the app treats you as "not on site". */
export const ON_SITE_RADIUS_M = 4000;

/**
 * Metres. Inside this of a site, opening it counts as having been there.
 *
 * Generous on purpose. Consumer GPS under tree cover in the sacred garden is
 * routinely out by twenty metres or more, and the cost of the two errors is not
 * symmetric: failing to record a real visit quietly loses something from
 * somebody's register, while a slightly early mark costs nothing that matters.
 */
export const SITE_VISIT_RADIUS_M = 80;

/** Earth mean radius, metres. Used by the haversine helper. */
export const EARTH_RADIUS_M = 6371008.8;
