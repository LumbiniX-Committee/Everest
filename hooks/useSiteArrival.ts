import { useEffect, useRef, useState } from 'react';

import { arrival, notifications } from '@/services';
import type { Coordinate } from '@/types';

/**
 * Which monument you are standing on, watched in real time.
 *
 * The precinct geofence answers "have you arrived somewhere" and is handled by
 * the OS so it works with the app away. It cannot answer *which* monument —
 * the four Sacred Garden sites sit within 92 m and the closest pair is 39 m
 * apart, well under the ~100 m floor a geofence can resolve. So the fine
 * question is answered here, from a live foreground fix, against each site's
 * own radius: 20 m for the Marker Stone, 60 m for Tilaurakot.
 *
 * Entry is announced once. Standing still would otherwise re-announce on every
 * fix, and pacing a boundary would announce on every crossing.
 */

/**
 * How far you must leave before the same site can announce itself again.
 *
 * A margin on top of the site's own radius, not a second threshold: without it,
 * GPS jitter of a few metres either side of the boundary reads as leaving and
 * arriving repeatedly while the person has not moved.
 */
const RE_ARM_MARGIN_M = 25;

export type SiteArrivalState = {
  /** The site you are within reach of, or null. */
  atSiteId: string | null;
  /** Nearest site regardless of reach, for a "how far" readout. */
  nearest: ReturnType<typeof arrival.nearestSite>;
};

export function useSiteArrival(
  coordinate: Coordinate | null,
  { notify = true }: { notify?: boolean } = {},
): SiteArrivalState {
  const [atSiteId, setAtSiteId] = useState<string | null>(null);
  const nearest = arrival.nearestSite(coordinate);

  /**
   * Held in a ref, not state.
   *
   * This changes on every fix and nothing renders from it — putting it in state
   * would re-render the whole screen once a second while someone walks.
   */
  const announced = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!nearest) {
      setAtSiteId(null);
      return;
    }

    const reach = arrival.reachOf(nearest.site);
    const inside = nearest.distanceM <= reach;
    const wellOutside = nearest.distanceM > reach + RE_ARM_MARGIN_M;

    if (wellOutside) {
      // Left properly. Let this site speak again on a genuine return.
      announced.current.delete(nearest.site.id);
    }

    setAtSiteId(inside ? nearest.site.id : null);

    if (!inside || announced.current.has(nearest.site.id)) return;

    // Nothing to say is a reason to stay quiet, not to announce an empty
    // banner — the same refusal the Dhamma surface applies to a weak match.
    if (!arrival.hasSomethingToSay(nearest.site.id)) return;

    announced.current.add(nearest.site.id);

    if (notify) {
      void notifications.presentArrival({
        precinctId: nearest.site.id,
        title: `You are at ${nearest.site.name}`,
        // Names the place and points at the app rather than quoting: a banner
        // truncates and strips the citation, and the citation is the point.
        body: nearest.site.summary ?? 'Open Sākṣī to read what this place holds.',
      });
    }
  }, [nearest, notify]);

  return { atSiteId, nearest };
}
