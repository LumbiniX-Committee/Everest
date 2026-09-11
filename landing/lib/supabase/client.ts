'use client';

import { createBrowserClient } from '@supabase/ssr';

import { requireSupabaseConfig } from './config';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!browserClient) {
    const { url, key } = requireSupabaseConfig();
    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}
