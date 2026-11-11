import { StorageKeys } from '@/constants';
import type { ReportAction, CustodianStatus } from '@/core';

import { getJSON, setJSON } from '../storage';
import { getSupabase, isConfigured } from '../supabase';
import { ensureSession } from '../supabase/auth';

/** Custodian steps per report id, and when they were last fetched. */
export type ReportTimelines = { fetchedAt: string | null; byReport: Record<string, ReportAction[]> };

const EMPTY: ReportTimelines = { fetchedAt: null, byReport: {} };
const STATUSES: CustodianStatus[] = ['open', 'acknowledged', 'in_progress', 'resolved'];

/** What the phone last heard. Shown offline, with its date, rather than nothing. */
export function cachedTimelines(): Promise<ReportTimelines> {
  return getJSON<ReportTimelines>(StorageKeys.reportTimelines, EMPTY);
}

/**
 * Ask the server what custodians have done with this visitor's reports.
 * Offline or unconfigured, the last known copy comes back unchanged.
 */
export async function refreshTimelines(): Promise<ReportTimelines> {
  const cached = await cachedTimelines();
  if (!isConfigured()) return cached;
  try {
    await ensureSession();
    const { data, error } = await getSupabase().rpc('my_report_timeline');
    if (error || !Array.isArray(data)) return cached;
    const byReport: Record<string, ReportAction[]> = {};
    for (const row of data as { report_id: string; target_status: string; note: string | null; created_at: string }[]) {
      if (!STATUSES.includes(row.target_status as CustodianStatus)) continue;
      (byReport[row.report_id] ??= []).push({ status: row.target_status as CustodianStatus, note: row.note, at: row.created_at });
    }
    const fresh: ReportTimelines = { fetchedAt: new Date().toISOString(), byReport };
    await setJSON(StorageKeys.reportTimelines, fresh);
    return fresh;
  } catch {
    return cached;
  }
}
