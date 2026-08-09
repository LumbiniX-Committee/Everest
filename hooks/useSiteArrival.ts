import { useEffect, useMemo, useState } from 'react';

import { arrival, notifications } from '@/services';
import { usePreferences } from '@/store';
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

/**
 * Which sites have already spoken, and when.
 *
 * Module-level, not a ref. Held in a ref it belonged to one mounted copy of the
 * hook, so it emptied on every remount — and both Tīrtha and the full-screen
 * map mount this hook, so walking between the two re-announced a site the
 * person had not moved from. Two components watching one physical arrival have
 * to share one memory of it.
 */
const announcedAt = new Map<string, number>();

/**
 * A floor under how often one site may announce itself, whatever the geometry
 * says. The re-arm margin above handles walking away and back; this handles the
 * rest — a fix that jitters across the margin, a screen reopened, an app
 * resumed. Twenty minutes is longer than it takes to look at one monument and
 * shorter than a second visit later in the day.
 */
const MIN_RE_ANNOUNCE_MS = 20 * 60 * 1000;

export type SiteArrivalState = {
  /** The site you are within reach of, or null. */
  atSiteId: string | null;
  /** Nearest site regardless of reach, for a "how far" readout. */
  nearest: ReturnType<typeof arrival.nearestSite>;
};

/** Lets the demo walk start a fresh run without inheriting the last one's silence. */
export function resetSiteAnnouncements(): void {
  announcedAt.clear();
}

export function useSiteArrival(
  coordinate: Coordinate | null,
  { notify = true }: { notify?: boolean } = {},
): SiteArrivalState {
  const { preferences } = usePreferences();
  const wisdomTier = preferences.wisdomTier;
  const [atSiteId, setAtSiteId] = useState<string | null>(null);
  // Memoised on the coordinate's *values*, not its identity. nearestSite
  // builds a new object on every call, so an unmemoised result changed identity
  // on every render and re-ran the effect below continuously — several times a
  // second while a watched position is updating.
  const nearest = useMemo(
    () => arrival.nearestSite(coordinate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [coordinate?.latitude, coordinate?.longitude],
  );

  useEffect(() => {
    if (!nearest) {
      setAtSiteId(null);
      return;
    }

    const site = nearest.site;
    const reach = arrival.reachOf(site);
    const inside = nearest.distanceM <= reach;
    const wellOutside = nearest.distanceM > reach + RE_ARM_MARGIN_M;
    const now = Date.now();

    if (wellOutside) {
      // Left properly. Let this site speak again on a genuine return — but only
      // once the floor above has also passed, so pacing the boundary cannot
      // turn one visit into a stream of banners.
      const last = announcedAt.get(site.id);
      if (last === undefined || now - last >= MIN_RE_ANNOUNCE_MS) announcedAt.delete(site.id);
    }

    setAtSiteId(inside ? site.id : null);

    if (!inside || announcedAt.has(site.id)) return;

    // Nothing to say is a reason to stay quiet, not to announce an empty
    // banner — the same refusal the Dhamma surface applies to a weak match.
    // Judged at the reader's chosen depth: at `basic` a site whose only
    // material is a facts table has nothing to say, and staying quiet is the
    // correct outcome rather than a bug.
    if (!arrival.hasSomethingToSay(site.id, wisdomTier)) return;

    // Recorded whether or not this caller notifies. The mark means "this
    // arrival has been handled", and the screen showing the passage handles it
    // just as much as a banner does — otherwise the map, which passes
    // notify:false, would leave the arrival un-marked for Tīrtha to announce
    // the moment you switched tabs.
    announcedAt.set(site.id, now);

    if (notify) {
      void notifications.presentArrival({
        siteId: site.id,
        title: `You are at ${site.name}`,
        // Names the place and points at the app rather than quoting: a banner
        // truncates and strips the citation, and the citation is the point.
        body: site.summary ?? 'Open Sākṣī to read what this place holds.',
      });
    }
  }, [nearest, notify, wisdomTier]);

  return { atSiteId, nearest };
}
