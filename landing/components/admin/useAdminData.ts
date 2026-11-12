'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdminApiError, request } from '@/lib/adminApi';

export type AdminDataState<T> = {
  data: T | null;
  error: string | null;
  forbidden: boolean;
  loading: boolean;
  loadedAt: Date | null;
  reload: () => Promise<void>;
};

/**
 * Loads one admin endpoint. A signed-out visitor is sent to sign in and back;
 * a signed-in account without admin rights gets `forbidden`, so the page can
 * say so instead of showing an error.
 */
export function useAdminData<T>(path: string): AdminDataState<T> {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await request<T>(path));
      setLoadedAt(new Date());
    } catch (loadError) {
      if (loadError instanceof AdminApiError && loadError.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (loadError instanceof AdminApiError && loadError.status === 403) {
        setForbidden(true);
        return;
      }
      setError(loadError instanceof Error ? loadError.message : 'Could not load this page.');
    } finally {
      setLoading(false);
    }
  }, [path, router]);

  // Deferred a tick so the network-triggered state change stays out of the effect body.
  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  return { data, error, forbidden, loading, loadedAt, reload };
}
