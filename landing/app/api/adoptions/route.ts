import { getAuthenticatedUser } from '@/lib/auth';
import { jsonError } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    if (!await getAuthenticatedUser()) return jsonError('Authentication required.', 401);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('vantage_commitments')
      .select('id,vantage_id,owner_kind,public_label,cadence_days,next_due_at,active,created_at')
      .order('next_due_at');
    if (error) throw new Error(error.message);
    return Response.json(data ?? []);
  } catch (error) {
    console.error('adoption list failed', error);
    return jsonError('Could not load vantage commitments.', 500);
  }
}

export async function POST(request: Request) {
  try {
    if (!await getAuthenticatedUser()) return jsonError('Authentication required.', 401);
    const body = await request.json().catch(() => null) as {
      vantage_id?: string;
      owner_kind?: string;
      public_label?: string;
    } | null;
    if (!body?.vantage_id) return jsonError('A vantage is required.', 400);
    if (!['individual', 'school'].includes(body.owner_kind ?? '')) return jsonError('Invalid adopter type.', 400);
    const label = typeof body.public_label === 'string' ? body.public_label.trim() : '';
    if (label.length > 120) return jsonError('Public label must be 120 characters or fewer.', 400);

    const supabase = await createClient();
    const { data: vantage, error: vantageError } = await supabase
      .from('monitored_vantages')
      .select('id')
      .eq('id', body.vantage_id)
      .eq('active', true)
      .maybeSingle();
    if (vantageError) throw new Error(vantageError.message);
    if (!vantage) return jsonError('That vantage is not available for adoption.', 400);

    const nextDueAt = new Date(Date.now() + 90 * 86400000).toISOString();
    const { data, error } = await supabase
      .from('vantage_commitments')
      .insert({
        vantage_id: body.vantage_id,
        owner_kind: body.owner_kind,
        public_label: label || null,
        cadence_days: 90,
        next_due_at: nextDueAt,
      })
      .select('id,vantage_id,owner_kind,public_label,cadence_days,next_due_at,active,created_at')
      .single();
    if (error) return jsonError('An active commitment already exists for this vantage.', 409);
    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error('adoption creation failed', error);
    return jsonError('Could not adopt the vantage.', 500);
  }
}
