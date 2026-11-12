import { adminRoute } from '@/lib/admin-http';
import { createClient } from '@/lib/supabase/server';

/** Who can act where: custodians by site, the admins, and the sites to choose from. */
export async function GET() {
  return adminRoute('Could not load site access.', async () => {
    const supabase = await createClient();
    const [custodians, admins, overview] = await Promise.all([
      supabase.rpc('admin_list_custodians'),
      supabase.rpc('admin_list_admins'),
      supabase.rpc('admin_overview', { p_days: 30 }),
    ]);
    for (const result of [custodians, admins, overview]) if (result.error) throw new Error(result.error.message);
    const sites = ((overview.data as { sites?: { id: string; name_en: string }[] }).sites ?? []).map(({ id, name_en }) => ({ id, name_en }));
    return { custodians: custodians.data ?? [], admins: admins.data ?? [], sites };
  });
}
