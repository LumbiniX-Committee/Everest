import type { Coordinate } from '@/types';

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

/** Metres. Beyond this from the centre, the app treats you as "not on site". */
export const ON_SITE_RADIUS_M = 4000;

/** Earth mean radius, metres. Used by the haversine helper. */
export const EARTH_RADIUS_M = 6371008.8;
