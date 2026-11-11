import { StorageKeys } from '@/constants';
import { normaliseCode, type Entitlement } from '@/core';

import { getJSON, setJSON } from '../storage';
import { getSupabase, isConfigured } from '../supabase';
import { ensureSession } from '../supabase/auth';

export type RedeemResult =
  | { status: 'ok'; entitlement: Entitlement }
  | { status: 'invalid' | 'expired' | 'used' | 'rate_limited' | 'offline' };

const EMPTY: Entitlement = { expiresAt: null };

/** The last entitlement this phone confirmed, so Pro works away from signal. */
export function cachedEntitlement(): Promise<Entitlement> {
  return getJSON<Entitlement>(StorageKeys.planEntitlement, EMPTY);
}

/** Asks the server, and keeps the last answer if the server can't be reached. */
export async function refreshEntitlement(): Promise<Entitlement> {
  const cached = await cachedEntitlement();
  if (!isConfigured()) return cached;

  try {
    await ensureSession();
    const { data, error } = await getSupabase().from('plan_entitlements').select('expires_at').maybeSingle();
    if (error) return cached;
    const fresh: Entitlement = { expiresAt: data?.expires_at ?? null };
    await setJSON(StorageKeys.planEntitlement, fresh);
    return fresh;
  } catch {
    return cached;
  }
}

export async function redeemCode(input: string): Promise<RedeemResult> {
  const code = normaliseCode(input);
  if (code.length === 0) return { status: 'invalid' };
  if (!isConfigured()) return { status: 'offline' };

  try {
    await ensureSession();
    const { data, error } = await getSupabase().rpc('redeem_activation_code', { p_code: code });
    if (error || !data) return { status: 'offline' };
    const answer = data as { status: string; expires_at?: string };
    if (answer.status === 'ok' && answer.expires_at) {
      const entitlement: Entitlement = { expiresAt: answer.expires_at };
      await setJSON(StorageKeys.planEntitlement, entitlement);
      return { status: 'ok', entitlement };
    }
    if (answer.status === 'expired' || answer.status === 'used' || answer.status === 'rate_limited') {
      return { status: answer.status };
    }
    return answer.status === 'not_signed_in' ? { status: 'offline' } : { status: 'invalid' };
  } catch {
    return { status: 'offline' };
  }
}
