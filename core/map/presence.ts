/**
 * core/map/presence.ts — which monument someone is standing at, decided once
 * per fix with memory of the last decision.
 *
 * A bare "nearest site within its radius" test flips with every few metres of
 * GPS jitter. On the live map that flip was the visible failure: standing at a
 * 20 m stone, the answer alternated between "here" and "nowhere", which closed
 * a story mid-read, re-armed it, and made the witness button blink. So this is
 * a Schmitt trigger over the per-site reach, the same idea as GeofenceWatcher,
 * plus two rules that a single-site watcher does not need:
 *
 *  - **Neighbours.** The closest pair of monuments is 39 m apart. Staying at
 *    the current site until its wider exit band is crossed must not stop a
 *    walk onto the neighbour from registering, so a different site takes over
 *    the moment you are inside *its* entry reach and nearer to it.
 *  - **Untrustworthy fixes.** A fix whose accuracy circle is wider than the
 *    cap says nothing about which monument you are at, so it can neither
 *    announce an arrival nor end one. Holding the last decision is the honest
 *    response — a 150 m Wi‑Fi estimate is not a measurement of a 20 m stone.
 *    Unknown accuracy (`null`) is not treated as bad: the errors here are
 *    asymmetric, and quietly missing a real visit costs more than marking one
 *    a few metres early.
 *
 * Pure: no React, no location API. The caller feeds distances in.
 */

import { EXIT_HYSTERESIS } from './geofence.ts';

/**
 * Smallest exit band, in metres beyond a site's reach.
 *
 * 15 % of a 20 m reach is 3 m, which is inside ordinary phone jitter and would
 * flap. Ten metres is about what a phone wanders while held still under trees.
 */
export const MIN_EXIT_MARGIN_M = 10;

/**
 * Widest accuracy circle that may change the presence decision.
 *
 * Tighter than this and dense tree cover would block real arrivals; looser and
 * a network-only estimate could place someone at a monument they are a block
 * away from.
 */
export const MAX_DECISIVE_ACCURACY_M = 50;

export interface PresenceCandidate {
  id: string;
  /** Distance from the fix to the site, metres. */
  distanceM: number;
  /** The site's own entry radius, metres. */
  reachM: number;
}

/** How far you must go before leaving a site counts. */
export function exitRadius(reachM: number): number {
  return reachM + Math.max(MIN_EXIT_MARGIN_M, reachM * (EXIT_HYSTERESIS - 1));
}

/**
 * The site someone is at after this fix, given the site they were at before.
 *
 * `candidates` should hold every site worth considering — order does not
 * matter. Returns `null` when the fix places them at none.
 */
export function resolvePresence(
  previousId: string | null,
  candidates: readonly PresenceCandidate[],
  accuracyM: number | null,
): string | null {
  if (accuracyM !== null && accuracyM > MAX_DECISIVE_ACCURACY_M) return previousId;

  let entered: PresenceCandidate | null = null;
  let current: PresenceCandidate | null = null;
  for (const c of candidates) {
    if (c.id === previousId) current = c;
    if (c.distanceM <= c.reachM && (!entered || c.distanceM < entered.distanceM)) entered = c;
  }

  // A neighbour you have walked into, and are closer to, wins outright.
  if (entered && (!current || entered.distanceM < current.distanceM)) return entered.id;

  // Otherwise hold the current site until its wider exit band is crossed.
  if (current && current.distanceM <= exitRadius(current.reachM)) return current.id;

  return entered?.id ?? null;
}
