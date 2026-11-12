export type AdminSite = {
  id: string;
  name_en: string;
  active: boolean;
  reports: number;
  open: number;
  oldest_open_at: string | null;
  custodians: number;
};

export type AdminOverview = {
  generated_at: string;
  since: string;
  observations: { total: number; recent: number; contributors_recent: number };
  reports: { open: number; acknowledged: number; in_progress: number; resolved: number; recent: number; unanswered_week: number };
  sites: AdminSite[];
  custodians_active: number;
  crashes: { recent: number; fatal_recent: number };
  plans: { codes_issued: number; codes_live: number; redemptions: number; pro_active: number };
};

export type AdminCustodian = {
  user_id: string;
  email: string;
  site_id: string;
  site_name: string;
  role: 'custodian' | 'manager';
  active: boolean;
  created_at: string;
};

export type AdminBatch = {
  note: string | null;
  issued_on: string;
  duration_days: number;
  issued: number;
  redeemed: number;
  revoked: number;
  valid_until: string | null;
};

export type AdminCrash = { app_version: string; platform: string; message: string; route: string | null; fatal: boolean; occurred_at: string };
export type AdminAction = { admin_email: string | null; action: string; detail: Record<string, unknown>; created_at: string };

export type AdminConsole = {
  overview: AdminOverview;
  custodians: AdminCustodian[];
  batches: AdminBatch[];
  crashes: AdminCrash[];
  actions: AdminAction[];
};

export class AdminApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new AdminApiError(payload?.error ?? `Request failed with ${response.status}.`, response.status);
  }
  return response.json() as Promise<T>;
}

export const getConsole = (days: number) => request<AdminConsole>(`/api/admin?days=${days}`);

export const setCustodian = (input: { email: string; site_id: string; role: 'custodian' | 'manager'; active: boolean }) =>
  request<{ status: 'ok' }>('/api/admin/custodians', { method: 'POST', body: JSON.stringify(input) });

export const issueCodes = (input: { count: number; days: number; valid_days: number; note: string }) =>
  request<{ codes: string[] }>('/api/admin/codes', { method: 'POST', body: JSON.stringify(input) });

export const revokeBatch = (input: { note: string | null; issued_on: string }) =>
  request<{ revoked: number }>('/api/admin/codes/revoke', { method: 'POST', body: JSON.stringify(input) });
