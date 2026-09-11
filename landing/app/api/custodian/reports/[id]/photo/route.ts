import { getCustodianAccess } from '@/lib/auth';
import { observationForReport } from '@/lib/custodian-data';
import { jsonError } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

type PhotoRouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: PhotoRouteContext) {
  try {
    const access = await getCustodianAccess();
    if (!access) return jsonError('Authentication required.', 401);
    const { id } = await context.params;
    const observation = await observationForReport(id);
    if (!observation || !access.siteIds.includes(observation.site_id)) return jsonError('Photograph not found.', 404);

    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from('observations')
      .createSignedUrl(observation.photo_path, 300);
    if (error || !data?.signedUrl) return jsonError('Photograph is unavailable.', 404);
    return Response.json({ url: data.signedUrl, expires_in: 300 });
  } catch (error) {
    console.error('custodian photo access failed', error);
    return jsonError('Could not open the photograph.', 500);
  }
}
