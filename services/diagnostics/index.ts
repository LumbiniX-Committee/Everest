import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { StorageKeys } from '@/constants';

import { getJSON, setJSON } from '../storage';
import { getSupabase, isConfigured } from '../supabase';
import { ensureSession } from '../supabase/auth';

/**
 * Crash reports, kept on the phone unless the visitor turns sharing on.
 *
 * A report holds the error and the screen it happened on, and nothing about the
 * visitor: no location, no photograph, no record content. Paths and long numbers
 * that could identify a device are stripped before anything is stored.
 */
export type CrashReport = {
  message: string;
  stack: string | null;
  route: string | null;
  fatal: boolean;
  occurredAt: string;
};

const MAX_KEPT = 20;

function scrub(text: string): string {
  return text
    .replace(/file:\/\/[^\s)]+/g, 'file://…')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<id>')
    .replace(/-?\d{1,3}\.\d{4,}/g, '<number>');
}

export async function recordCrash(error: unknown, { route = null, fatal = false }: { route?: string | null; fatal?: boolean } = {}) {
  const err = error instanceof Error ? error : new Error(String(error));
  const report: CrashReport = {
    message: scrub(err.message).slice(0, 500),
    stack: err.stack ? scrub(err.stack).slice(0, 4000) : null,
    route,
    fatal,
    occurredAt: new Date().toISOString(),
  };
  const kept = await getJSON<CrashReport[]>(StorageKeys.crashReports, []);
  await setJSON(StorageKeys.crashReports, [...kept, report].slice(-MAX_KEPT));
}

/** Sends kept reports, if the visitor allows it, and forgets the ones that arrived. */
export async function sendCrashReports(shareAllowed: boolean): Promise<number> {
  if (!shareAllowed || !isConfigured()) return 0;
  const kept = await getJSON<CrashReport[]>(StorageKeys.crashReports, []);
  if (kept.length === 0) return 0;
  try {
    await ensureSession();
    const { error } = await getSupabase()
      .from('crash_reports')
      .insert(
        kept.map((r) => ({
          app_version: String(Constants.expoConfig?.version ?? 'unknown').slice(0, 32),
          platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
          message: r.message,
          stack: r.stack,
          route: r.route,
          fatal: r.fatal,
          occurred_at: r.occurredAt,
        })),
      );
    if (error) return 0;
    await setJSON(StorageKeys.crashReports, []);
    return kept.length;
  } catch {
    return 0;
  }
}

/** Catches errors nothing else handled, records them, then lets the default handler run. */
export function installGlobalHandler(): void {
  const utils = (globalThis as { ErrorUtils?: { getGlobalHandler: () => (e: unknown, fatal?: boolean) => void; setGlobalHandler: (h: (e: unknown, fatal?: boolean) => void) => void } }).ErrorUtils;
  if (!utils) return;
  const previous = utils.getGlobalHandler();
  utils.setGlobalHandler((error, fatal) => {
    void recordCrash(error, { fatal: Boolean(fatal) }).finally(() => previous(error, fatal));
  });
}
