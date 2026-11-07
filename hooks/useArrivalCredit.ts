import { useEffect } from 'react';

import { useQuests } from '@/store';

/**
 * Records an arrival from whichever surface the visitor has open.
 *
 * Reaching a place must count the same whether the map, Tīrtha or Sākṣī was on
 * screen. It re-runs when quests change, so a quest started while already
 * standing there is credited; the store keeps that from counting a second visit.
 */
export function useArrivalCredit(atSiteId: string | null, onCredited?: (count: number, siteId: string) => void) {
  const { creditArrival } = useQuests();

  useEffect(() => {
    if (!atSiteId) return;
    void creditArrival(atSiteId)
      .then((count) => {
        if (count > 0) onCredited?.(count, atSiteId);
      })
      .catch(() => undefined);
    // onCredited is deliberately left out: it only reports the result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atSiteId, creditArrival]);
}
