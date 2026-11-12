import { refuseNonAdmin } from '@/lib/admin-http';
import { jsonError } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

/** Revokes one batch. Time already granted to people who redeemed stays theirs. */
export async function POST(request: Request) {
  try {
    const refused = await refuseNonAdmin();
    if (refused) return refused;
    const body = await request.json().catch(() => null) as { note?: unknown; issued_on?: unknown } | null;
    const note = typeof body?.note === 'string' ? body.note : null;
    const issuedOn = typeof body?.issued_on === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.issued_on) ? body.issued_on : null;
    if (!issuedOn) return jsonError('Which batch? A date is required.', 400);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('admin_revoke_batch', { p_note: note, p_issued_on: issuedOn });
    if (error) throw new Error(error.message);
    return Response.json({ revoked: data ?? 0 });
  } catch (error) {
    console.error('admin batch revoke failed', error);
    return jsonError('Could not revoke the batch.', 500);
  }
}
