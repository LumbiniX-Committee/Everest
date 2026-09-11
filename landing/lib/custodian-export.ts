import type { ConditionReport } from '@/lib/custodian-data';

export type ExportObservation = {
  latitude: number | null;
  longitude: number | null;
  vantage_id: string;
  align_score: number | null;
};

export type ObservationIndex = Map<string, ExportObservation>;

export function csvField(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function conditionReportsCsv(
  reports: ConditionReport[],
  observations: ObservationIndex,
): string {
  const rows: unknown[][] = [[
    'id', 'site_id', 'latitude', 'longitude', 'coordinate_source', 'vantage_id', 'align_score',
    'category', 'subtype', 'severity', 'status', 'status_changed_at', 'created_at',
  ]];
  reports.forEach((report) => {
    const observation = observations.get(report.capture_id);
    const measured = observation?.latitude != null && observation.longitude != null;
    rows.push([
      report.id,
      report.site_id,
      measured ? observation.latitude : '',
      measured ? observation.longitude : '',
      measured ? 'capture' : '',
      observation?.vantage_id ?? '',
      observation?.align_score ?? '',
      report.category,
      report.subtype ?? '',
      report.severity,
      report.status,
      report.status_changed_at ?? '',
      report.created_at,
    ]);
  });
  return rows.map((row) => row.map(csvField).join(',')).join('\n');
}

export function conditionReportsGeoJson(
  reports: ConditionReport[],
  observations: ObservationIndex,
) {
  const omitted = reports.filter((report) => {
    const observation = observations.get(report.capture_id);
    return observation?.latitude == null || observation.longitude == null;
  }).length;
  return {
    type: 'FeatureCollection' as const,
    properties: { omitted_missing_coordinates: omitted },
    features: reports.flatMap((report) => {
      const observation = observations.get(report.capture_id);
      if (observation?.latitude == null || observation.longitude == null) return [];
      return [{
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [observation.longitude, observation.latitude],
        },
        properties: {
          id: report.id,
          site_id: report.site_id,
          vantage_id: observation.vantage_id,
          align_score: observation.align_score,
          category: report.category,
          subtype: report.subtype,
          severity: report.severity,
          status: report.status,
          created_at: report.created_at,
          coordinate_source: 'capture' as const,
        },
      }];
    }),
  };
}
