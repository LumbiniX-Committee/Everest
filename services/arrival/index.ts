import { demoPrecincts, dhammaForSite, findPrecinct, findSite } from '@/data';
import { StorageKeys } from '@/constants';
import { distanceMeters } from '@/utils';
import type { Coordinate, HeritageSite, Precinct } from '@/types';

import * as notifications from '../notifications';
import * as storage from '../storage';

/**
 * What happens when someone reaches a precinct.
 *
 * Kept out of the geofencing service because the OS task may run with no UI
 * mounted, and out of a React store because the decision — has this precinct
 * already been announced today — has to be answerable from that same
 * headless context.
 */

/**
 * How long before the same precinct may announce itself again.
 *
 * Six hours, not once-ever: a pilgrim may walk out to the Peace Pagoda and back
 * through the Sacred Garden in a morning, and being told twice in ten minutes
 * is noise while being told once a day is a welcome. Geofence enter events also
 * fire repeatedly when someone lingers near a boundary, and this is what stops
 * that becoming a stream of banners.
 */
export const ARRIVAL_COOLDOWN_MS = 6 * 60 * 60 * 1000;

type NotifiedMap = Record<string, string>;

async function readNotified(): Promise<NotifiedMap> {
  return storage.getJSON<NotifiedMap>(StorageKeys.arrivalsLastNotified, {});
}

export async function shouldAnnounce(precinctId: string, now = Date.now()): Promise<boolean> {
  const last = (await readNotified())[precinctId];
  if (!last) return true;
  const at = Date.parse(last);
  // An unparseable timestamp means a corrupt or hand-edited value. Announcing
  // is the harmless outcome; suppressing would hide the feature indefinitely.
  if (Number.isNaN(at)) return true;
  return now - at >= ARRIVAL_COOLDOWN_MS;
}

async function markAnnounced(precinctId: string, at: string): Promise<void> {
  const map = await readNotified();
  await storage.setJSON(StorageKeys.arrivalsLastNotified, { ...map, [precinctId]: at });
}

/** Clears the cooldown for every precinct. Used by the demo trigger. */
export async function resetArrivalHistory(): Promise<void> {
  await storage.remove(StorageKeys.arrivalsLastNotified);
}

/**
 * The notification text for a precinct.
 *
 * Names the precinct and how many of its sites the corpus can speak to, rather
 * than quoting a passage. A banner is the wrong surface for a cited passage —
 * it truncates, it strips the citation, and the citation is the point. The
 * banner's job is to get someone to open the app; the passage is shown there
 * with its source attached.
 */
export function arrivalMessage(precinct: Precinct): { title: string; body: string } {
  const speakable = precinct.siteIds.filter((id) => dhammaForSite(id).length > 0).length;

  if (speakable === 0) {
    return {
      title: `You have reached ${precinct.name}`,
      body: precinct.summary,
    };
  }

  return {
    title: `You have reached ${precinct.name}`,
    body:
      speakable === 1
        ? 'There is something here worth reading. Open Sākṣī.'
        : `There are ${speakable} passages tied to this ground. Open Sākṣī.`,
  };
}

/**
 * Handles one arrival. Safe to call from the headless geofencing task.
 *
 * Returns whether a notification was actually presented, so the caller — and
 * the demo trigger — can tell a suppressed repeat from a delivered one.
 */
export async function handleArrival(precinctId: string, at: string): Promise<boolean> {
  const precinct = findPrecinct(precinctId);
  if (!precinct) return false;
  if (!(await shouldAnnounce(precinctId, Date.parse(at) || Date.now()))) return false;

  const { title, body } = arrivalMessage(precinct);
  await notifications.presentArrival({ precinctId, title, body });
  await markAnnounced(precinctId, at);
  return true;
}

export type SiteProximity = {
  site: HeritageSite;
  distanceM: number;
  precinct?: Precinct;
  /** True when close enough that naming this site is honest. */
  withinReach: boolean;
};

/**
 * How near you must be for a site to be *the* site you are at.
 *
 * 30 m, chosen against the measured geometry rather than picked round: the two
 * closest monuments are 39 m apart, so a radius at or above half that could
 * claim you are at both. Under open sky here a fix settles to a few metres,
 * which resolves 39 m comfortably — this is the precision the geofence cannot
 * give and the foreground can.
 */
export const AT_SITE_RADIUS_M = 30;

/**
 * The site someone is actually standing at, from a foreground fix.
 *
 * Returns the nearest regardless, with `withinReach` saying whether it is close
 * enough to act on. Callers that need certainty check the flag; callers showing
 * "nearest site" do not.
 */
export function nearestSite(coordinate: Coordinate | null): SiteProximity | null {
  if (!coordinate) return null;

  let best: SiteProximity | null = null;
  for (const precinct of demoPrecincts) {
    for (const siteId of precinct.siteIds) {
      const site = findSite(siteId);
      if (!site) continue;
      const distanceM = distanceMeters(coordinate, site.coordinate);
      if (!best || distanceM < best.distanceM) {
        best = { site, distanceM, precinct, withinReach: distanceM <= AT_SITE_RADIUS_M };
      }
    }
  }
  return best;
}
