import { getCustodianAccess } from '@/lib/auth';
import { jsonError } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const access = await getCustodianAccess();
    if (!access) return jsonError('Authentication required.', 401);
    if (!access.siteIds.length) return jsonError('No custodian site access has been assigned.', 403);
    const body = await request.json().catch(() => null) as { urgent?: unknown; note?: unknown } | null;
    if (typeof body?.urgent !== 'boolean') return jsonError('urgent must be true or false.', 400);
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (note.length > 1000) return jsonError('Note must be 1000 characters or fewer.', 400);

    const { id } = await context.params;
    const supabase = await createClient();
    const { data: vantage, error: vantageError } = await supabase
      .from('monitored_vantages')
      .select('id,site_id')
      .eq('id', id)
      .eq('active', true)
      .maybeSingle();
    if (vantageError) throw new Error(vantageError.message);
    if (!vantage || !access.siteIds.includes(String(vantage.site_id))) {
      return jsonError('Vantage not found.', 404);
    }

    const { data, error } = await supabase
      .from('vantage_priority_actions')
      .insert({ vantage_id: id, urgent: body.urgent, note: note || null })
      .select('id,vantage_id,urgent,note,created_at')
      .single();
    if (error) return jsonError('Could not change survey priority.', 409);
    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error('vantage priority action failed', error);
    return jsonError('Could not change survey priority.', 500);
  }
}
