import { refuseNonAdmin } from '@/lib/admin-http';
import { jsonError } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

const whole = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : null;

/**
 * Issues Pro codes. They are returned once, in this response, and only their
 * hashes are stored, so the page must show them now or they are gone.
 */
export async function POST(request: Request) {
  try {
    const refused = await refuseNonAdmin();
    if (refused) return refused;
    const body = await request.json().catch(() => null) as { count?: unknown; days?: unknown; valid_days?: unknown; note?: unknown } | null;
    const count = whole(body?.count, 1, 200);
    const days = whole(body?.days, 1, 366);
    const validDays = whole(body?.valid_days ?? 180, 1, 730);
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 200) : '';
    if (!count || !days || !validDays) return jsonError('Count must be 1-200, days 1-366 and validity 1-730.', 400);
    if (!note) return jsonError('Give the batch a note, so it can be found and revoked later.', 400);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('admin_issue_codes', { p_count: count, p_days: days, p_valid_days: validDays, p_note: note });
    if (error) throw new Error(error.message);
    return Response.json({ codes: (data ?? []) as string[] }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('admin code issue failed', error);
    return jsonError('Could not issue codes.', 500);
  }
}
