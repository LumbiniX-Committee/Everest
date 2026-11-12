import { refuseNonAdmin } from '@/lib/admin-http';
import { jsonError } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

/** Everything the console shows, in one round trip. */
export async function GET(request: Request) {
  try {
    const refused = await refuseNonAdmin();
    if (refused) return refused;
    const days = Number(new URL(request.url).searchParams.get('days'));
    const supabase = await createClient();
    const [overview, custodians, batches, crashes, actions] = await Promise.all([
      supabase.rpc('admin_overview', { p_days: [7, 30, 90, 365].includes(days) ? days : 30 }),
      supabase.rpc('admin_list_custodians'),
      supabase.rpc('admin_code_batches'),
      supabase.rpc('admin_recent_crashes', { p_limit: 30 }),
      supabase.rpc('admin_recent_actions', { p_limit: 30 }),
    ]);
    const failed = [overview, custodians, batches, crashes, actions].find((result) => result.error);
    if (failed?.error) throw new Error(failed.error.message);
    return Response.json({
      overview: overview.data,
      custodians: custodians.data ?? [],
      batches: batches.data ?? [],
      crashes: crashes.data ?? [],
      actions: actions.data ?? [],
    });
  } catch (error) {
    console.error('admin overview failed', error);
    return jsonError('Could not load the admin console.', 500);
  }
}
