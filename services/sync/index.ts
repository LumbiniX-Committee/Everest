import {
  getUnsyncedConditionReports,
  getUnsyncedObservations,
  getUnsyncedQuestSubmissions,
} from '../database';
import { syncData } from '../supabase/sync';

export * from '../supabase/sync';

/**
 * Triggers sync pass for pending observations and condition reports.
 */
export async function syncPendingObservations(): Promise<number> {
  const initialCount = await pendingCount();

  if (initialCount === 0) return 0;

  await syncData();

  const remainingCount = await pendingCount();

  return Math.max(0, initialCount - remainingCount);
}

/** Count of items (observations, condition reports, quest memories) waiting to sync. */
export async function pendingCount(): Promise<number> {
  const [obs, reps, memories] = await Promise.all([
    getUnsyncedObservations(),
    getUnsyncedConditionReports(),
    getUnsyncedQuestSubmissions(),
  ]);
  return obs.length + reps.length + memories.length;
}
