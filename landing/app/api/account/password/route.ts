import { createClient as createBareClient } from '@supabase/supabase-js';

import { getAuthenticatedUser } from '@/lib/auth';
import { jsonError } from '@/lib/http';
import { checkNewPassword } from '@/lib/password-policy';
import { requireSupabaseConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

/**
 * Changes the signed-in account's password.
 *
 * The current password is checked first with a separate, session-less client,
 * so a stolen open session alone cannot change it, and the check never touches
 * the browser's own session cookies. Supabase's sign-in rate limits apply to
 * that check.
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.email) return jsonError('Sign in first.', 401);
    const body = await request.json().catch(() => null) as { current?: unknown; next?: unknown } | null;
    const current = typeof body?.current === 'string' ? body.current : '';
    const next = typeof body?.next === 'string' ? body.next : '';
    if (!current) return jsonError('Enter your current password.', 400);
    const policy = checkNewPassword(next, current, user.email);
    if (!policy.ok) return jsonError(policy.problems.join(' '), 400);

    const { url, key } = requireSupabaseConfig();
    const verifier = createBareClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: wrong } = await verifier.auth.signInWithPassword({ email: user.email, password: current });
    if (wrong) {
      return jsonError(wrong.status === 429 ? 'Too many attempts. Wait a few minutes and try again.' : 'Your current password is not right.', wrong.status === 429 ? 429 : 403);
    }
    await verifier.auth.signOut({ scope: 'local' }).catch(() => undefined);

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) return jsonError(error.message || 'Could not change the password.', 400);
    return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('password change failed', error);
    return jsonError('Could not change the password.', 500);
  }
}
