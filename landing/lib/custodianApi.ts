export type ReportStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved';

export type ConditionReport = {
  id: string;
  capture_id: string;
  site_id: string;
  category: string;
  subtype: string | null;
  severity: string;
  note: string | null;
  status: ReportStatus;
  custodian_note: string | null;
  status_changed_at: string | null;
  created_at: string;
};

export type ReportPage = { items: ConditionReport[]; nextCursor: string | null };

export type Site = { id: string; name: { en: string; ne: string | null } };

export type TrendPoint = { at: string; coverage_pct: number; open_reports: number };

export type DashboardStats = {
  window: { from: string; to: string };
  coverage_pct: number;
  vantages_total: number;
  vantages_surveyed: number;
  captures_total: number;
  median_align_score: number | null;
  reports_by_status: Record<ReportStatus, number>;
  median_first_response_hours: number | null;
  median_resolution_hours: number | null;
  commitments_overdue: number;
  commitments_due_soon: number;
  commitments: Array<{
    id: string;
    vantage_id: string;
    owner_kind: 'individual' | 'school';
    public_label: string | null;
    next_due_at: string;
    due_state: 'overdue' | 'due_soon' | 'upcoming';
  }>;
  vantages: Array<{ id: string; site_id: string; urgent: boolean }>;
  trend: TrendPoint[];
  per_site: Array<{
    site_id: string;
    captures: number;
    coverage_pct: number;
    open_reports: number;
    trend: TrendPoint[];
  }>;
  generated_at: string;
};

export class CustodianApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new CustodianApiError(payload?.error ?? `Request failed with ${response.status}.`, response.status);
  }
  return response.json() as Promise<T>;
}

export function getDashboard(filter: { siteId?: string; days: 30 | 90 | 365 }): Promise<DashboardStats> {
  const params = new URLSearchParams({ days: String(filter.days) });
  if (filter.siteId) params.set('site_id', filter.siteId);
  return request<DashboardStats>(`/api/custodian/dashboard?${params}`);
}

export function getReports(filter: {
  siteId?: string;
  status?: ReportStatus;
  cursor?: string;
}): Promise<ReportPage> {
  const params = new URLSearchParams();
  if (filter.siteId) params.set('site_id', filter.siteId);
  if (filter.status) params.set('status', filter.status);
  if (filter.cursor) params.set('cursor', filter.cursor);
  return request<ReportPage>(`/api/custodian/reports?${params}`);
}

export function getSites(): Promise<Site[]> {
  return request<Site[]>('/api/custodian/sites');
}

export function recordReportAction(input: {
  reportId: string;
  status: ReportStatus;
  note: string;
}): Promise<unknown> {
  return request(`/api/custodian/reports/${encodeURIComponent(input.reportId)}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: input.status, note: input.note || null }),
  });
}

export function exportUrl(
  format: 'csv' | 'geojson',
  filter: { siteId?: string; status?: ReportStatus },
): string {
  const params = new URLSearchParams({ format });
  if (filter.siteId) params.set('site_id', filter.siteId);
  if (filter.status) params.set('status', filter.status);
  return `/api/custodian/export?${params}`;
}

export function getPhoto(reportId: string): Promise<{ url: string; expires_in: number }> {
  return request(`/api/custodian/reports/${encodeURIComponent(reportId)}/photo`);
}

export function setVantageUrgency(vantageId: string, urgent: boolean): Promise<unknown> {
  return request(`/api/custodian/vantages/${encodeURIComponent(vantageId)}/priority`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urgent }),
  });
}
