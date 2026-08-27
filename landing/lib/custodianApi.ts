/**
 * Client for the custodian dashboard's data source.
 *
 * Talks to mock-api/server.mjs today — the same contract the Expo app's
 * offline fallback speaks to (services/dhamma/index.ts). That is a deliberate,
 * time-boxed choice, not an oversight: the production Supabase schema
 * (supabase/migrations/) grants `anon` insert/update only, on purpose — "the
 * app only ever writes... a leaked key can add to the record but cannot
 * harvest it" (0001_observation_sync.sql). A custodian dashboard's whole job
 * is reading, so wiring it straight to Supabase would mean loosening that
 * policy, which is a real security decision this file should not make quietly
 * under a demo deadline. The honest path is a server-side route (or a new
 * `authenticated`-role policy scoped to a custodian account) added
 * deliberately, later, and reviewed as its own change.
 */

export type ReportStatus = 'open' | 'corroborated' | 'acknowledged' | 'in_progress' | 'resolved';

export type ConditionReport = {
  id: string;
  capture_id: string | null;
  site_id: string;
  category: string;
  subtype: string | null;
  severity: string;
  reporter_conf?: number;
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
  capture_heatmap: Record<string, number>;
  merit_balance: number;
  generated_at: string;
};

export type Site = {
  id: string;
  name: { en: string; ne?: string; pi?: string };
};

/** Trimmed of a trailing slash, same convention as services/dhamma/index.ts. */
export function apiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');
}

export class CustodianApiError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const base = apiUrl();
  if (!base) throw new CustodianApiError('NEXT_PUBLIC_API_URL is not configured.');
  const res = await fetch(`${base}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new CustodianApiError(`${path} returned ${res.status}`);
  return res.json() as Promise<T>;
}

export function getDashboard(): Promise<DashboardStats> {
  return getJson<DashboardStats>('/dashboard');
}

export function getReports(filter?: { site_id?: string; status?: ReportStatus }): Promise<ConditionReport[]> {
  const params = new URLSearchParams();
  if (filter?.site_id) params.set('site_id', filter.site_id);
  if (filter?.status) params.set('status', filter.status);
  const qs = params.toString();
  return getJson<ConditionReport[]>(`/reports${qs ? `?${qs}` : ''}`);
}

export function getSites(): Promise<Site[]> {
  return getJson<Site[]>('/sites');
}

export async function acknowledgeReport(input: {
  reportId: string;
  status: 'acknowledged' | 'in_progress' | 'resolved';
  note: string;
  custodianId: string;
}): Promise<void> {
  const base = apiUrl();
  if (!base) throw new CustodianApiError('NEXT_PUBLIC_API_URL is not configured.');
  const res = await fetch(`${base}/custodian/acknowledgements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      report_id: input.reportId,
      status: input.status,
      note: input.note || null,
      custodian_id: input.custodianId || undefined,
    }),
  });
  if (!res.ok) throw new CustodianApiError(`acknowledge returned ${res.status}`);
}

export function exportUrl(format: 'csv' | 'geojson' | 'crm'): string {
  return `${apiUrl()}/export?format=${format}`;
}
