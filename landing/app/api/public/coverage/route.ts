import { jsonError, safeDays } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const days = safeDays(new URL(request.url).searchParams.get('days'));
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_public_vantage_coverage', { p_days: days });
    if (error) throw new Error(error.message);
    return Response.json(data ?? [], { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    console.error('public coverage failed', error);
    return jsonError('Coverage is temporarily unavailable.', 503);
  }
}
