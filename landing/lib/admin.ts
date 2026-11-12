import 'server-only';

import { cache } from 'react';

import { getAuthenticatedUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export type AdminAccess = { kind: 'admin'; userId: string } | { kind: 'signed_out' } | { kind: 'forbidden' };

/**
 * Whether the signed-in account is a platform admin. The database decides
 * (`is_platform_admin`), and every admin function checks again on its own, so
 * this only chooses the right error for the page; it is not the lock.
 */
export const getAdminAccess = cache(async (): Promise<AdminAccess> => {
  const user = await getAuthenticatedUser();
  if (!user) return { kind: 'signed_out' };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('is_platform_admin');
  if (error) throw new Error(`Could not verify admin access: ${error.message}`);
  return data === true ? { kind: 'admin', userId: user.id } : { kind: 'forbidden' };
});
