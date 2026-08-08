import { useState, useEffect, useCallback } from 'react';
import { syncData, SyncState } from '@/services/supabase/sync';
import { getUnsyncedObservations, getUnsyncedConditionReports } from '@/services/database';

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
      } else if (syncState === 'synced') {
        // We have pending items, go back to offline/ready state
        setSyncState('offline');
      }
    } catch {
      // Ignore
    }
  }, [syncState]);

  const triggerSync = useCallback(async () => {
    if (pendingCount === 0) return;
    
    setSyncState('syncing');
    try {
      await syncData();
      await checkPending();
    } catch (error) {
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
