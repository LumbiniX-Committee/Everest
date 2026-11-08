import { useCallback, useEffect, useState } from 'react';

import type { Bounds } from '@/core';
import { offlineMaps } from '@/services';

type Pack = Awaited<ReturnType<typeof offlineMaps.listPacks>>[number];

/** Saved map areas, and saving a new one with progress. */
export function useOfflinePacks() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [saving, setSaving] = useState<{ id: string; done: number; total: number } | null>(null);

  const refresh = useCallback(async () => setPacks(await offlineMaps.listPacks()), []);
  useEffect(() => {
    let live = true;
    void offlineMaps.listPacks().then((list) => {
      if (live) setPacks(list);
    });
    return () => {
      live = false;
    };
  }, []);

  const save = useCallback(
    async (id: string, label: string, bounds: Bounds) => {
      setSaving({ id, done: 0, total: offlineMaps.keysForArea(bounds).length });
      try {
        await offlineMaps.savePack(id, label, bounds, (done, total) => setSaving({ id, done, total }));
      } finally {
        setSaving(null);
        await refresh();
      }
    },
    [refresh],
  );

  const removeAll = useCallback(async () => {
    await offlineMaps.removeAllPacks();
    await refresh();
  }, [refresh]);

  return { packs, saving, save, removeAll };
}
