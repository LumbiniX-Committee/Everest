import { getCustodianAccess } from '@/lib/auth';
import { jsonError } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

const TARGETS = new Set(['open', 'acknowledged', 'in_progress', 'resolved']);

type ActionRouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: ActionRouteContext) {
  try {
    const access = await getCustodianAccess();
    if (!access) return jsonError('Authentication required.', 401);
    if (!access.siteIds.length) return jsonError('No custodian site access has been assigned.', 403);
    const { id } = await context.params;
    const body = await request.json().catch(() => null) as { status?: string; note?: string } | null;
    if (!body?.status || !TARGETS.has(body.status)) return jsonError('Invalid report status.', 400);
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (note.length > 2000) return jsonError('Note must be 2000 characters or fewer.', 400);

    const supabase = await createClient();
    const { data: report, error: reportError } = await supabase
      .from('condition_reports')
      .select('id,site_id')
      .eq('id', id)
      .maybeSingle();
    if (reportError) throw new Error(reportError.message);
    if (!report) return jsonError('Report not found.', 404);
    if (!access.siteIds.includes(String(report.site_id))) return jsonError('Report not found.', 404);

    const { data, error } = await supabase
      .from('condition_report_actions')
      .insert({ report_id: id, target_status: body.status, note: note || null })
      .select('id,report_id,target_status,note,created_at')
      .single();
    if (error) return jsonError('That is not a legal next report action.', 409);
    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error('custodian report action failed', error);
    return jsonError('Could not record the report action.', 500);
  }
}
