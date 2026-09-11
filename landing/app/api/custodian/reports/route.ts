import { getCustodianAccess } from '@/lib/auth';
import { listReports, type ReportStatus } from '@/lib/custodian-data';
import { jsonError } from '@/lib/http';

const STATUSES = new Set<ReportStatus>(['open', 'acknowledged', 'in_progress', 'resolved']);

export async function GET(request: Request) {
  try {
    const access = await getCustodianAccess();
    if (!access) return jsonError('Authentication required.', 401);
    if (!access.siteIds.length) return jsonError('No custodian site access has been assigned.', 403);
    const url = new URL(request.url);
    const siteId = url.searchParams.get('site_id') || undefined;
    if (siteId && !access.siteIds.includes(siteId)) return jsonError('Site access denied.', 403);
    const rawStatus = url.searchParams.get('status');
    if (rawStatus && !STATUSES.has(rawStatus as ReportStatus)) return jsonError('Invalid status.', 400);
    const rawLimit = Number(url.searchParams.get('limit') ?? 50);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 50;
    return Response.json(await listReports({
      siteId,
      allowedSiteIds: access.siteIds,
      status: rawStatus as ReportStatus | undefined,
      cursor: url.searchParams.get('cursor') || undefined,
      limit,
    }));
  } catch (error) {
    console.error('custodian report list failed', error);
    return jsonError('Could not load condition reports.', 500);
  }
}
