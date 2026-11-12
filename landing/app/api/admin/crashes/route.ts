import { adminRoute } from '@/lib/admin-http';
import { createClient } from '@/lib/supabase/server';

const WINDOWS = [7, 30, 90, 365];

/** Crashes grouped by message, without user ids or stacks. */
export async function GET(request: Request) {
  const days = Number(new URL(request.url).searchParams.get('days'));
  return adminRoute('Could not load crashes.', async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('admin_crash_groups', { p_days: WINDOWS.includes(days) ? days : 30 });
    if (error) throw new Error(error.message);
    return { groups: data ?? [] };
  });
}
