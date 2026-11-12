import { adminRoute } from '@/lib/admin-http';
import { createClient } from '@/lib/supabase/server';

/** Code batches and how many people are on Pro now. */
export async function GET() {
  return adminRoute('Could not load Pro codes.', async () => {
    const supabase = await createClient();
    const [batches, overview] = await Promise.all([supabase.rpc('admin_code_batches'), supabase.rpc('admin_overview', { p_days: 30 })]);
    if (batches.error) throw new Error(batches.error.message);
    if (overview.error) throw new Error(overview.error.message);
    return { batches: batches.data ?? [], plans: (overview.data as { plans: unknown }).plans };
  });
}
