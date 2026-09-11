import type { Session } from '@supabase/supabase-js';

type AnonymousAuthClient = {
  getSession: () => Promise<{ data: { session: Session | null } }>;
  signInAnonymously: () => Promise<{
    data: { session: Session | null };
    error: Error | null;
  }>;
};

/**
 * Restore an existing session or create an anonymous one.
 *
 * Kept independent of native storage and the client singleton so the failure
 * path can be verified without a live Supabase project.
 */
export async function resolveAnonymousSession(
  auth: AnonymousAuthClient,
): Promise<{ session: Session | null; error: Error | null }> {
  const { data: existing } = await auth.getSession();
  if (existing.session) return { session: existing.session, error: null };

  const { data, error } = await auth.signInAnonymously();
  return { session: data.session, error };
}
