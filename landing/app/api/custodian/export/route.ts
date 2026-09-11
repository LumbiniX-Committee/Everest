import { getCustodianAccess } from '@/lib/auth';
import { listReports, type ConditionReport, type ReportStatus } from '@/lib/custodian-data';
import {
  conditionReportsCsv,
  conditionReportsGeoJson,
  type ObservationIndex,
} from '@/lib/custodian-export';
import { jsonError } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

async function allReports(
  allowedSiteIds: string[],
  siteId?: string,
  status?: ReportStatus,
): Promise<ConditionReport[]> {
  const reports: ConditionReport[] = [];
  let cursor: string | undefined;
  do {
    const page = await listReports({ siteId, allowedSiteIds, status, cursor, limit: 100 });
    reports.push(...page.items);
    cursor = page.nextCursor ?? undefined;
  } while (cursor && reports.length < 10000);
  return reports;
}

export async function GET(request: Request) {
  try {
    const access = await getCustodianAccess();
    if (!access) return jsonError('Authentication required.', 401);
    if (!access.siteIds.length) return jsonError('No custodian site access has been assigned.', 403);
    const url = new URL(request.url);
    const format = url.searchParams.get('format') ?? 'csv';
    if (!['csv', 'geojson'].includes(format)) return jsonError('format must be csv or geojson.', 400);
    const siteId = url.searchParams.get('site_id') || undefined;
    if (siteId && !access.siteIds.includes(siteId)) return jsonError('Site access denied.', 403);
    const rawStatus = url.searchParams.get('status');
    const statuses: ReportStatus[] = ['open', 'acknowledged', 'in_progress', 'resolved'];
    if (rawStatus && !statuses.includes(rawStatus as ReportStatus)) return jsonError('Invalid report status.', 400);
    const status = (rawStatus || undefined) as ReportStatus | undefined;
    const reports = await allReports(access.siteIds, siteId, status);

    const supabase = await createClient();
    const observationIds = reports.map((report) => report.capture_id);
    const observations: ObservationIndex = new Map();
    for (let offset = 0; offset < observationIds.length; offset += 100) {
      const { data, error } = await supabase
        .from('observations')
        .select('id,latitude,longitude,vantage_id,align_score')
        .in('id', observationIds.slice(offset, offset + 100));
      if (error) throw new Error(error.message);
      (data ?? []).forEach((row) => observations.set(String(row.id), {
        latitude: typeof row.latitude === 'number' ? row.latitude : null,
        longitude: typeof row.longitude === 'number' ? row.longitude : null,
        vantage_id: String(row.vantage_id),
        align_score: typeof row.align_score === 'number' ? row.align_score : null,
      }));
    }

    if (format === 'geojson') {
      return Response.json(conditionReportsGeoJson(reports, observations), {
        headers: { 'Content-Disposition': 'attachment; filename="sakshi-condition-reports.geojson"' },
      });
    }

    return new Response(conditionReportsCsv(reports, observations), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sakshi-condition-reports.csv"',
      },
    });
  } catch (error) {
    console.error('custodian export failed', error);
    return jsonError('Could not export condition reports.', 500);
  }
}
