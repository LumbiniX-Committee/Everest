import 'server-only';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

export type CustodianAccess = {
  userId: string;
  email: string | null;
  siteIds: string[];
};

export const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export const getCustodianAccess = cache(async (): Promise<CustodianAccess | null> => {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('custodian_memberships')
    .select('site_id')
    .eq('active', true);

  if (error) throw new Error(`Could not verify custodian access: ${error.message}`);
  return {
    userId: user.id,
    email: user.email ?? null,
    siteIds: (data ?? []).map((row) => String(row.site_id)),
  };
});
