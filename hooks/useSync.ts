import { useCallback, useEffect, useState } from 'react';

import { getUnsyncedConditionReports, getUnsyncedObservations } from '@/services/database';
import { isConfigured } from '@/services/supabase';
import { syncData, type SyncState } from '@/services/supabase/sync';

export function useSync() {
  const [syncState, setSyncState] = useState<SyncState>('offline');
  const [pendingCount, setPendingCount] = useState(0);

  const checkPending = useCallback(async () => {
    try {
      const obs = await getUnsyncedObservations();
      const reps = await getUnsyncedConditionReports();
      const total = obs.length + reps.length;
      setPendingCount(total);

      if (total === 0) {
        setSyncState('synced');
      } else if (!isConfigured()) {
        setSyncState('offline');
      } else if (syncState === 'synced') {
        setSyncState('offline');
      }
    } catch (err) {
      console.warn('[useSync] checkPending failed:', err);
    }
  }, [syncState]);

  const triggerSync = useCallback(async () => {
    if (!isConfigured()) {
      console.warn('[useSync] Cannot sync: Supabase is not configured in .env.local');
      setSyncState('offline');
      return;
    }
    if (pendingCount === 0) return;

    setSyncState('syncing');
    try {
      await syncData();
      await checkPending();
    } catch (error) {
      console.warn('[useSync] Sync failed:', error);
      setSyncState('failed');
    }
  }, [pendingCount, checkPending]);

  // Initial check
  useEffect(() => {
    checkPending();
  }, [checkPending]);

  return {
    syncState,
    pendingCount,
    triggerSync,
    checkPending,
  };
}
