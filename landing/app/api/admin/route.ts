import { adminRoute } from '@/lib/admin-http';
import { createClient } from '@/lib/supabase/server';

const WINDOWS = [7, 30, 90, 365];

/** The overview: headline counts for the window, and twelve weeks of activity. */
export async function GET(request: Request) {
  const days = Number(new URL(request.url).searchParams.get('days'));
  return adminRoute('Could not load the overview.', async () => {
    const supabase = await createClient();
    const [overview, weekly] = await Promise.all([
      supabase.rpc('admin_overview', { p_days: WINDOWS.includes(days) ? days : 30 }),
      supabase.rpc('admin_weekly_activity', { p_weeks: 12 }),
    ]);
    if (overview.error) throw new Error(overview.error.message);
    if (weekly.error) throw new Error(weekly.error.message);
    return { overview: overview.data, weekly: weekly.data ?? [] };
  });
}
