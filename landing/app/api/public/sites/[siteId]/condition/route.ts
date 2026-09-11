import { jsonError, safeDays } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

type ConditionRouteContext = { params: Promise<{ siteId: string }> };

export async function GET(request: Request, context: ConditionRouteContext) {
  try {
    const { siteId } = await context.params;
    const days = safeDays(new URL(request.url).searchParams.get('days'));
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_public_site_condition', {
      p_site_id: siteId,
      p_days: days,
    });
    if (error) throw new Error(error.message);
    if (!data) return jsonError('Site not found.', 404);
    return Response.json(data, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    console.error('public condition summary failed', error);
    return jsonError('Condition history is temporarily unavailable.', 503);
  }
}
