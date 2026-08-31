import { apiReachable, noteRemoteFailure } from '@/services/net/reachability';

/**
 * Custodian data — the app-facing boundary for the mobile acknowledge flow.
 *
 * Talks to the same demo API the web dashboard does (landing/lib/custodianApi.ts)
 * and for the same reason that file documents: the production Supabase schema
 * grants `anon` insert/update only, by deliberate design
 * (supabase/migrations/0001_observation_sync.sql), so a read-and-triage surface
 * cannot honestly point at it without a new, separately-reviewed access policy.
 * mock-api/server.mjs is the near-term, correctly-scoped data source.
 *
 * Online-only, unlike the visitor-side capture and report flows in
 * services/sync. Those exist because a photograph cannot be retaken; an
 * acknowledgement can simply be retried once the custodian has signal, and
 * there is no local mirror of server-side report state to reconcile against.
 * A failed action surfaces as an error the caller can retry — it does not
 * queue silently.
 */

export type ReportStatus = 'open' | 'corroborated' | 'acknowledged' | 'in_progress' | 'resolved';

export type ConditionReport = {
  id: string;
  capture_id: string | null;
  site_id: string;
  category: string;
  subtype: string | null;
  severity: string;
  note: string | null;
  corroborations: number;
  status: ReportStatus;
  custodian_note: string | null;
  acknowledged_at: string | null;
  created_at: string;
};

export type DashboardStats = {
  coverage_pct: number;
  vantages_total: number;
  vantages_surveyed: number;
  captures_total: number;
  median_align_score: number;
  reports_by_status: Record<ReportStatus, number>;
  median_ack_hours: number | null;
};

// Same env var and trimming convention as services/dhamma/index.ts.
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');
const TIMEOUT_MS = 15000;

export class CustodianApiError extends Error {}

/** True when a custodian view has anywhere to fetch from at all. */
export function isConfigured(): boolean {
  return API_URL.length > 0;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new CustodianApiError('No API configured for this build.');
  if (!(await apiReachable(API_URL))) throw new CustodianApiError('The server is not reachable right now.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new CustodianApiError(`${path} returned ${res.status}`);
    return (await res.json()) as T;
  } catch (error) {
    noteRemoteFailure();
    if (error instanceof CustodianApiError) throw error;
    throw new CustodianApiError('Could not reach the server.');
  } finally {
    clearTimeout(timeout);
  }
}

export function fetchDashboard(): Promise<DashboardStats> {
  return request<DashboardStats>('/dashboard');
}

export function fetchReports(filter?: { siteId?: string; status?: ReportStatus }): Promise<ConditionReport[]> {
  const params = new URLSearchParams();
  if (filter?.siteId) params.set('site_id', filter.siteId);
  if (filter?.status) params.set('status', filter.status);
  const qs = params.toString();
  return request<ConditionReport[]>(`/reports${qs ? `?${qs}` : ''}`);
}

export async function acknowledgeReport(input: {
  reportId: string;
  status: 'acknowledged' | 'in_progress' | 'resolved';
  note: string;
  custodianId: string;
}): Promise<void> {
  await request(`/custodian/acknowledgements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      report_id: input.reportId,
      status: input.status,
      note: input.note || null,
      custodian_id: input.custodianId || undefined,
    }),
  });
}
