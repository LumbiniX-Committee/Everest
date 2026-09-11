import { getCustodianAccess } from '@/lib/auth';
import { dashboard } from '@/lib/custodian-data';
import { jsonError, safeDays, safeIsoDate } from '@/lib/http';

export async function GET(request: Request) {
  try {
    const access = await getCustodianAccess();
    if (!access) return jsonError('Authentication required.', 401);
    if (!access.siteIds.length) return jsonError('No custodian site access has been assigned.', 403);

    const url = new URL(request.url);
    const siteId = url.searchParams.get('site_id') || undefined;
    if (siteId && !access.siteIds.includes(siteId)) return jsonError('Site access denied.', 403);
    const days = safeDays(url.searchParams.get('days'));
    const to = safeIsoDate(url.searchParams.get('to'), new Date());
    const defaultFrom = new Date(new Date(to).getTime() - days * 86400000);
    const from = safeIsoDate(url.searchParams.get('from'), defaultFrom);
    if (new Date(from) > new Date(to)) return jsonError('from must be before to.', 400);

    return Response.json(await dashboard(from, to, siteId, access.siteIds));
  } catch (error) {
    console.error('custodian dashboard failed', error);
    return jsonError('Could not load the custodian dashboard.', 500);
  }
}
