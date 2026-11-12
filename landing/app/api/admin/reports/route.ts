import { adminRoute } from '@/lib/admin-http';
import { createClient } from '@/lib/supabase/server';

const STATUSES = new Set(['open', 'acknowledged', 'in_progress', 'resolved']);
const PAGE = 25;

/** Reports across every site, filtered by current status and site, 25 a page. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const status = params.get('status');
  const site = params.get('site');
  const page = Math.max(0, Math.min(1000, Number(params.get('page')) || 0));
  return adminRoute('Could not load reports.', async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('admin_list_reports', {
      p_status: status && STATUSES.has(status) ? status : null,
      p_site_id: site && site.length <= 120 ? site : null,
      p_limit: PAGE,
      p_offset: page * PAGE,
    });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as { total: number }[];
    return { items: rows, total: rows[0]?.total ?? 0, page, pageSize: PAGE };
  });
}
