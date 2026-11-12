export type ReportStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved';

export type AdminSite = {
  id: string;
  name_en: string;
  region_id: string;
  active: boolean;
  reports: number;
  open: number;
  oldest_open_at: string | null;
  custodians: number;
  photos: number;
  last_photo_at: string | null;
  vantages: number;
};

export type AdminOverview = {
  generated_at: string;
  since: string;
  observations: { total: number; recent: number; previous: number; contributors_recent: number };
  reports: { open: number; acknowledged: number; in_progress: number; resolved: number; recent: number; previous: number; unanswered_week: number };
  sites: AdminSite[];
  custodians_active: number;
  accounts: { total: number; anonymous: number; with_email: number; new_recent: number; admins: number };
  crashes: { recent: number; fatal_recent: number };
  plans: { codes_issued: number; codes_live: number; redemptions: number; pro_active: number };
};

export type WeeklyPoint = { week: string; photos: number; reports: number; resolved: number; accounts: number };

export type AdminReport = {
  id: string;
  site_id: string;
  site_name: string;
  category: string;
  subtype: string | null;
  severity: string;
  note: string | null;
  recorded_at: string;
  status: ReportStatus;
  status_at: string | null;
  actions: { status: ReportStatus; note: string | null; at: string }[];
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

export type AdminAdmin = { email: string; note: string | null; since: string; last_sign_in_at: string | null };

export type AdminBatch = {
  note: string | null;
  issued_on: string;
  duration_days: number;
  issued: number;
  redeemed: number;
  revoked: number;
  valid_until: string | null;
};

export type CrashGroup = {
  message: string;
  occurrences: number;
  fatal: number;
  first_seen: string;
  last_seen: string;
  versions: string[];
  platforms: string[];
  routes: string[];
};

export type AdminAction = { admin_email: string | null; action: string; detail: Record<string, unknown>; created_at: string };

export class AdminApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
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

export const setCustodian = (input: { email: string; site_id: string; role: 'custodian' | 'manager'; active: boolean }) =>
  request<{ status: 'ok' }>('/api/admin/custodians', { method: 'POST', body: JSON.stringify(input) });

export const issueCodes = (input: { count: number; days: number; valid_days: number; note: string }) =>
  request<{ codes: string[] }>('/api/admin/codes', { method: 'POST', body: JSON.stringify(input) });

export const revokeBatch = (input: { note: string | null; issued_on: string }) =>
  request<{ revoked: number }>('/api/admin/codes/revoke', { method: 'POST', body: JSON.stringify(input) });

export const changePassword = (input: { current: string; next: string }) =>
  request<{ status: 'ok' }>('/api/account/password', { method: 'POST', body: JSON.stringify(input) });

export const STATUS_LABEL: Record<ReportStatus, string> = {
  open: 'Waiting',
  acknowledged: 'Acknowledged',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

export const ACTION_LABEL: Record<string, string> = {
  set_custodian: 'Changed site access',
  issue_codes: 'Issued Pro codes',
  revoke_batch: 'Revoked a code batch',
  grant_admin: 'Granted admin access',
};

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysSince(iso: string | null | undefined): number | null {
  return iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : null;
}

export function relative(iso: string | null | undefined): string {
  const days = daysSince(iso);
  if (days == null) return '—';
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return shortDate(iso);
}
