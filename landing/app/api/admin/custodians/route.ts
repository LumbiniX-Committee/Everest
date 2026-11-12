import { refuseNonAdmin } from '@/lib/admin-http';
import { jsonError } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

const MESSAGES: Record<string, [string, number]> = {
  no_account: ['No account uses that email yet. Ask them to sign in once, or add the user in Supabase Authentication.', 404],
  no_site: ['That site is not monitored.', 404],
};

/** Grants, changes or turns off one person's access to one site. Never deletes. */
export async function POST(request: Request) {
  try {
    const refused = await refuseNonAdmin();
    if (refused) return refused;
    const body = await request.json().catch(() => null) as { email?: unknown; site_id?: unknown; role?: unknown; active?: unknown } | null;
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const siteId = typeof body?.site_id === 'string' ? body.site_id : '';
    const role = body?.role === 'manager' ? 'manager' : 'custodian';
    if (!email.includes('@') || email.length > 320 || !siteId) return jsonError('An email and a site are required.', 400);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('admin_set_custodian', {
      p_email: email,
      p_site_id: siteId,
      p_role: role,
      p_active: body?.active !== false,
    });
    if (error) throw new Error(error.message);
    const status = (data as { status?: string } | null)?.status;
    if (status && MESSAGES[status]) return jsonError(...MESSAGES[status]);
    return Response.json({ status: 'ok' });
  } catch (error) {
    console.error('admin custodian change failed', error);
    return jsonError('Could not change site access.', 500);
  }
}
