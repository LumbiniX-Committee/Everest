import { getCustodianAccess } from '@/lib/auth';
import { listSites } from '@/lib/custodian-data';
import { jsonError } from '@/lib/http';

export async function GET() {
  try {
    const access = await getCustodianAccess();
    if (!access) return jsonError('Authentication required.', 401);
    if (!access.siteIds.length) return jsonError('No custodian site access has been assigned.', 403);
    const sites = await listSites();
    return Response.json(sites.filter((site) => access.siteIds.includes(site.id)));
  } catch (error) {
    console.error('custodian site list failed', error);
    return jsonError('Could not load monitored sites.', 500);
  }
}
