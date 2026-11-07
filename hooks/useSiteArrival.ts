import { useEffect, useMemo, useRef, useState } from 'react';

import { resolvePresence } from '@/core';
import { findSite } from '@/data';
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
 * The decision itself — with its exit band, neighbour hand-over and refusal to
 * act on a coarse fix — is core/map/presence. This hook remembers the last
 * answer, feeds it each new fix, and announces an entry once.
 */

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
 * says. The presence exit band handles walking away and back; this handles the
 * rest — a screen reopened, an app resumed, a second lap of the same garden.
 * Twenty minutes is longer than it takes to look at one monument and shorter
 * than a second visit later in the day.
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
  {
    notify = true,
    accuracyM = null,
  }: {
    notify?: boolean;
    /** The fix's accuracy radius. A coarse fix cannot start or end a visit. */
    accuracyM?: number | null;
  } = {},
): SiteArrivalState {
  const { preferences } = usePreferences();
  const wisdomTier = preferences.wisdomTier;
  const [atSiteId, setAtSiteId] = useState<string | null>(null);
  // Read inside the effect rather than listed as a dependency: the previous
  // answer is an input to the next one, not a reason to recompute it.
  const atSiteRef = useRef<string | null>(null);

  // Memoised on the coordinate's *values*, not its identity. These build new
  // objects on every call, so unmemoised they changed identity on every render
  // and re-ran the effect below continuously while a watched position updates.
  const nearest = useMemo(
    () => arrival.nearestSite(coordinate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [coordinate?.latitude, coordinate?.longitude],
  );
  const candidates = useMemo(
    () => arrival.presenceCandidates(coordinate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [coordinate?.latitude, coordinate?.longitude],
  );

  useEffect(() => {
    const previous = atSiteRef.current;
    const next = coordinate ? resolvePresence(previous, candidates, accuracyM) : null;
    const now = Date.now();

    // Away from a site long enough: let it speak again on a genuine return.
    for (const [id, last] of announcedAt) {
      if (id !== next && now - last >= MIN_RE_ANNOUNCE_MS) announcedAt.delete(id);
    }

    atSiteRef.current = next;
    setAtSiteId(next);

    if (!next || next === previous || announcedAt.has(next)) return;

    // Nothing to say is a reason to stay quiet, not to announce an empty
    // banner — the same refusal the Dhamma surface applies to a weak match.
    // Judged at the reader's chosen depth: at `basic` a site whose only
    // material is a facts table has nothing to say, and staying quiet is the
    // correct outcome rather than a bug.
    if (!arrival.hasSomethingToSay(next, wisdomTier)) return;

    // Recorded whether or not this caller notifies. The mark means "this
    // arrival has been handled", and the screen showing the passage handles it
    // just as much as a banner does — otherwise the map, which passes
    // notify:false, would leave the arrival un-marked for Tīrtha to announce
    // the moment you switched tabs.
    announcedAt.set(next, now);

    if (notify) {
      const site = findSite(next);
      void notifications.presentArrival({
        siteId: next,
        title: `You are at ${site?.name ?? 'a heritage site'}`,
        // Names the place and points at the app rather than quoting: a banner
        // truncates and strips the citation, and the citation is the point.
        body: site?.summary ?? 'Open Sākṣī to read what this place holds.',
      });
    }
    // `coordinate` is represented by `candidates`, which already tracks its values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, accuracyM, notify, wisdomTier]);

  return { atSiteId, nearest };
}
