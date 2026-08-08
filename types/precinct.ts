import type { Coordinate } from './heritage';

/**
 * A geofenceable area containing one or more sites.
 *
 * Precincts exist because of a hard limit in the platform, not because the
 * domain wanted them. The four Sacred Garden monuments sit within 92 m of each
 * other — Maya Devi Temple and the Ashoka Pillar are 39 m apart — while OS
 * geofencing is unreliable below a ~100 m radius on both Android and iOS. A
 * geofence per site would fire all four at once, or the wrong one.
 *
 * So the geofence answers the coarse question: *have you arrived somewhere*.
 * Which monument you are actually standing at is decided in the foreground by
 * `nearestSite`, from a GPS fix good to a few metres under Lumbini's open sky.
 */
export type Precinct = {
  id: string;
  name: string;
  /** One line, used as the notification title when you arrive. */
  summary: string;
  /** Centre of the geofence, not necessarily any one site. */
  centre: Coordinate;
  /**
   * Geofence radius in metres.
   *
   * Never below MIN_GEOFENCE_RADIUS_M. Larger than the site spread on purpose:
   * the trigger should fire as someone approaches, not once they are already
   * standing in the middle of it.
   */
  radiusMetres: number;
  /** Sites inside this precinct, nearest-first resolution happens at runtime. */
  siteIds: string[];
};

/**
 * Below this, geofence enter/exit events are unreliable on both platforms —
 * Android's own guidance recommends 100 m or more, and iOS regions this small
 * thrash against location accuracy.
 */
export const MIN_GEOFENCE_RADIUS_M = 100;

/**
 * Platform ceiling on simultaneously monitored regions.
 *
 * iOS allows 20 per app and Android 100, so iOS is the binding constraint. At
 * three precincts there is enormous headroom, but the check exists so that
 * adding precincts fails loudly here rather than silently dropping regions on
 * a device.
 */
export const MAX_MONITORED_REGIONS = 20;
