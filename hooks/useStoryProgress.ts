import { useCallback, useEffect, useState } from 'react';

import { StorageKeys } from '@/constants';
import { storage } from '@/services';

type ReadMap = Record<string, string>;

export type StoryProgress = {
  /** False until the first read comes back, so nothing flashes as unread. */
  hydrated: boolean;
  hasRead: (siteId: string) => boolean;
  /** Sites whose story has been read through to the end. */
  readCount: number;
  markRead: (siteId: string) => Promise<void>;
  reset: () => Promise<void>;
};

/**
 * Which places have had their story told.
 *
 * Interface state, not a record of practice — which is why it lives in
 * AsyncStorage rather than the merit ledger. The ledger is append-only and
 * records acts of attention; this only answers "does this place still have an
 * unread story to offer", so that arriving somewhere twice does not replay the
 * sequence at someone who already sat through it.
 *
 * The puṇya for reading it is recorded separately, once, by the screen that
 * completes the sequence — through `recognise`, capped like everything else.
 */
export function useStoryProgress(): StoryProgress {
  const [read, setRead] = useState<ReadMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const stored = await storage.getJSON<ReadMap>(StorageKeys.storiesRead, {});
      if (!active) return;
      setRead(stored);
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const markRead = useCallback(async (siteId: string) => {
    // State first, write after — the sequence closes on this and must not wait
    // on storage to do it. The storage layer swallows its own errors, so there
    // is no failure to roll back to.
    let next: ReadMap = {};
    setRead((prev) => {
      next = { ...prev, [siteId]: new Date().toISOString() };
      return next;
    });
    await storage.setJSON(StorageKeys.storiesRead, next);
  }, []);

  const reset = useCallback(async () => {
    setRead({});
    await storage.remove(StorageKeys.storiesRead);
  }, []);

  return {
    hydrated,
    hasRead: useCallback((siteId: string) => Boolean(read[siteId]), [read]),
    readCount: Object.keys(read).length,
    markRead,
    reset,
  };
}
