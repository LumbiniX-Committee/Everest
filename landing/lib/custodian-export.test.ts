import { describe, expect, it } from 'vitest';

import { conditionReportsCsv, conditionReportsGeoJson, type ObservationIndex } from '@/lib/custodian-export';
import type { ConditionReport } from '@/lib/custodian-data';

const reports: ConditionReport[] = [
  {
    id: 'report-1', capture_id: 'capture-1', site_id: 'manga-hiti',
    category: 'water, flow', subtype: null, severity: 'medium', note: 'A "quoted" note',
    status: 'acknowledged', custodian_note: 'Logged with the municipality', status_changed_at: '2026-09-02T00:00:00Z',
    acknowledged_at: '2026-09-02T00:00:00Z', created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'report-2', capture_id: 'capture-2', site_id: 'manga-hiti',
    category: 'surface', subtype: 'crack', severity: 'low', note: null,
    status: 'open', custodian_note: null, status_changed_at: null,
    acknowledged_at: null, created_at: '2026-09-03T00:00:00Z',
  },
];

const observations: ObservationIndex = new Map([
  ['capture-1', { latitude: 27.6733, longitude: 85.3251, vantage_id: 'manga-hiti-spout', align_score: 0.82 }],
  ['capture-2', { latitude: null, longitude: null, vantage_id: 'manga-hiti-basin', align_score: null }],
]);

describe('custodian exports', () => {
  it('escapes CSV fields and leaves unavailable measurements empty', () => {
    const csv = conditionReportsCsv(reports, observations);
    expect(csv).toContain('"water, flow"');
    expect(csv).toContain('report-2,manga-hiti,,,');
    expect(csv).not.toContain('0,0');
  });

  it('includes notes and acknowledgement time in the CSV header and rows', () => {
    const csv = conditionReportsCsv(reports, observations);
    const [header, row1] = csv.split('\n');
    expect(header.split(',')).toEqual([
      'id', 'site_id', 'latitude', 'longitude', 'coordinate_source', 'vantage_id', 'align_score',
      'category', 'subtype', 'severity', 'note', 'status', 'status_changed_at', 'acknowledged_at',
      'custodian_note', 'created_at',
    ]);
    expect(row1).toContain('"A ""quoted"" note"');
    expect(row1).toContain('2026-09-02T00:00:00Z,Logged with the municipality');
  });

  it('emits valid measured GeoJSON and counts omitted records', () => {
    const geojson = conditionReportsGeoJson(reports, observations);
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.properties.omitted_missing_coordinates).toBe(1);
    expect(geojson.features).toHaveLength(1);
    expect(geojson.features[0].geometry.coordinates).toEqual([85.3251, 27.6733]);
    expect(geojson.features[0].properties.coordinate_source).toBe('capture');
  });

  it('carries notes and acknowledgement time into GeoJSON properties', () => {
    const geojson = conditionReportsGeoJson(reports, observations);
    expect(geojson.features[0].properties.note).toBe('A "quoted" note');
    expect(geojson.features[0].properties.acknowledged_at).toBe('2026-09-02T00:00:00Z');
    expect(geojson.features[0].properties.custodian_note).toBe('Logged with the municipality');
  });
});
