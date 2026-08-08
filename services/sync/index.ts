import { getUnsyncedConditionReports, getUnsyncedObservations } from '../database';
import { syncData } from '../supabase/sync';

export * from '../supabase/sync';

/**
 * Triggers sync pass for pending observations and condition reports.
 */
export async function syncPendingObservations(): Promise<number> {
  const beforeObs = await getUnsyncedObservations();
  const beforeReps = await getUnsyncedConditionReports();
  const initialCount = beforeObs.length + beforeReps.length;

  if (initialCount === 0) return 0;

  await syncData();

  const afterObs = await getUnsyncedObservations();
  const afterReps = await getUnsyncedConditionReports();
  const remainingCount = afterObs.length + afterReps.length;

  return Math.max(0, initialCount - remainingCount);
}

/** Count of items (observations + condition reports) waiting to sync. */
export async function pendingCount(): Promise<number> {
  const obs = await getUnsyncedObservations();
  const reps = await getUnsyncedConditionReports();
  return obs.length + reps.length;
}
