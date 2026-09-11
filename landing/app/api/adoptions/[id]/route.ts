import { getAuthenticatedUser } from '@/lib/auth';
import { jsonError } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!await getAuthenticatedUser()) return jsonError('Authentication required.', 401);
    const body = await request.json().catch(() => null) as { active?: unknown } | null;
    if (body?.active !== false) return jsonError('A commitment can only be ended through this endpoint.', 400);

    const { id } = await context.params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('vantage_commitments')
      .update({ active: false })
      .eq('id', id)
      .eq('active', true)
      .select('id,vantage_id,owner_kind,public_label,cadence_days,next_due_at,active,created_at')
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return jsonError('Active commitment not found.', 404);
    return Response.json(data);
  } catch (error) {
    console.error('adoption cancellation failed', error);
    return jsonError('Could not end the commitment.', 500);
  }
}
