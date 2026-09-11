import { useMemo } from 'react';

import { demoSites } from '@/data';
import { distanceMeters } from '@/utils';
import type { Coordinate, HeritageSite } from '@/types';

export type SiteWithDistance = HeritageSite & { distanceM: number | null };

/**
 * Sites, sorted by distance when we have a fix and left in curated order when
 * we do not. Without location the list is still complete and still useful —
 * that is the whole point of not hard-requiring the permission.
 */
export function useNearbySites(coordinate: Coordinate | null): SiteWithDistance[] {
  return useMemo(() => {
    if (!coordinate) {
      return demoSites
        .filter((site) => !site.parentSiteId)
        .map((site) => ({ ...site, distanceM: null }));
    }
    return demoSites
      .filter((site) => !site.parentSiteId)
      .map((site) => ({ ...site, distanceM: distanceMeters(coordinate, site.coordinate) }))
      .sort((a, b) => a.distanceM - b.distanceM);
  }, [coordinate]);
}
