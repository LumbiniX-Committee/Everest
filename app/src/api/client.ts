/**
 * app/src/api/client.ts — the typed REST client.
 *
 * One place that knows the 04-ARCHITECTURE §3 contract, typed against
 * shared/types.ts, pointed at EXPO_PUBLIC_API_URL (the mock API during dev, the
 * real FastAPI later — same shapes either way). No react-native import; uses the
 * global fetch, so it typechecks today.
 *
 * Every POST carries a client-generated UUID for the offline queue; the caller
 * supplies it (app/src/db/queue.ts, lane A) so a retry is idempotent.
 */

import type {
  Site,
  SiteDetailResponse,
  Vantage,
  Need,
  MeritSummary,
  DashboardStats,
  QuestState,
  CreateCaptureRequest,
  CreateCaptureResponse,
  CreateReportRequest,
  CreateReportResponse,
  CorroborateResponse,
  CreateAllocationRequest,
  Allocation,
  CompleteQuestRequest,
  CompleteQuestResponse,
  DhammaRequest,
  DhammaResponse,
} from '../../../shared/types.ts';

const BASE = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  ?.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export class ApiClientError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function req<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = (await res.json()) as { detail?: string };
      if (j.detail) detail = j.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiClientError(res.status, detail);
  }
  return (await res.json()) as T;
}

export const api = {
  base: BASE,

  sites: () => req<Site[]>('GET', '/sites'),
  siteDetail: (id: string) => req<SiteDetailResponse>('GET', `/sites/${id}`),
  nextVantage: (lat: number, lon: number) =>
    req<(Vantage & { distance_m: number }) | null>('GET', `/vantages/next?lat=${lat}&lon=${lon}`),
  needs: () => req<Need[]>('GET', '/needs'),
  meritMe: () => req<MeritSummary>('GET', '/merit/me'),
  dashboard: () => req<DashboardStats>('GET', '/dashboard'),
  quests: (lat: number, lon: number) =>
    req<{ quest: unknown; availability: string; distance_m: number | null }[]>(
      'GET',
      `/quests?lat=${lat}&lon=${lon}`,
    ) as Promise<Array<{ quest: import('../../../shared/types.ts').Quest; availability: QuestState['availability']; distance_m: number | null }>>,

  createCapture: (b: CreateCaptureRequest) => req<CreateCaptureResponse>('POST', '/captures', b),
  createReport: (b: CreateReportRequest) => req<CreateReportResponse>('POST', '/reports', b),
  corroborate: (id: string) => req<CorroborateResponse>('POST', `/reports/${id}/corroborate`),
  allocate: (b: CreateAllocationRequest) => req<Allocation>('POST', '/allocations', b),
  completeQuest: (id: string, b: CompleteQuestRequest) =>
    req<CompleteQuestResponse>('POST', `/quests/${id}/complete`, b),
  askDhamma: (b: DhammaRequest) => req<DhammaResponse>('POST', '/dhamma/ask', b),
};
