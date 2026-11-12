import { adminRoute } from '@/lib/admin-http';
import { createClient } from '@/lib/supabase/server';

/** The append-only log of admin changes. */
export async function GET() {
  return adminRoute('Could not load the admin log.', async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('admin_recent_actions', { p_limit: 200 });
    if (error) throw new Error(error.message);
    return { actions: data ?? [] };
  });
}
