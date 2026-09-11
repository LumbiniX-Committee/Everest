import { StorageKeys } from '@/constants';
import { getJSON, setJSON } from '@/services/storage';

export type VantageCoverage = {
  vantage_id: string;
  site_id: string;
  last_capture_at: string | null;
  survey_age_days: number | null;
  priority: number;
  urgent: boolean;
};

type CachedCoverage = { fetchedAt: string; rows: VantageCoverage[] };

const TIMEOUT_MS = 5000;

function portalUrl(): string {
  return (process.env.EXPO_PUBLIC_PORTAL_URL ?? '').trim().replace(/\/$/, '');
}

/**
 * Returns fresh redacted coverage when possible and the last safe response
 * otherwise. The response contains no coordinates, people, notes or images, so
 * caching it in preferences cannot leak the evidence archive.
 */
export async function getVantageCoverage(): Promise<VantageCoverage[]> {
  const cached = await getJSON<CachedCoverage | null>(StorageKeys.coveragePriority, null);
  const base = portalUrl();
  if (!base || base.includes('your-portal.example')) return cached?.rows ?? [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${base}/api/public/coverage?days=90`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`coverage ${response.status}`);
    const rows = await response.json() as VantageCoverage[];
    await setJSON(StorageKeys.coveragePriority, {
      fetchedAt: new Date().toISOString(),
      rows,
    } satisfies CachedCoverage);
    return rows;
  } catch {
    return cached?.rows ?? [];
  } finally {
    clearTimeout(timeout);
  }
}
