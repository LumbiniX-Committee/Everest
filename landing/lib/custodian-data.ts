import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';

export type ReportStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved';

export type ConditionReport = {
  id: string;
  capture_id: string;
  site_id: string;
  category: string;
  subtype: string | null;
  severity: string;
  note: string | null;
  status: ReportStatus;
  custodian_note: string | null;
  status_changed_at: string | null;
  created_at: string;
};

export type Site = {
  id: string;
  name: { en: string; ne: string | null };
};

type RawReport = {
  id: string;
  observation_id: string;
  site_id: string;
  category: string;
  subtype: string | null;
  severity: string;
  note: string | null;
  recorded_at: string;
};

type RawAction = {
  id: string;
  report_id: string;
  target_status: ReportStatus;
  note: string | null;
  created_at: string;
};

type RawObservation = {
  id: string;
  site_id: string;
  vantage_id: string;
  captured_at: string;
  latitude: number | null;
  longitude: number | null;
  align_score: number | null;
  photo_path: string;
};

export type ReportQuery = {
  siteId?: string;
  allowedSiteIds?: string[];
  status?: ReportStatus;
  cursor?: string;
  limit?: number;
};

function latestActions(actions: RawAction[]): Map<string, RawAction> {
  const latest = new Map<string, RawAction>();
  for (const action of actions) {
    if (!latest.has(action.report_id)) latest.set(action.report_id, action);
  }
  return latest;
}

function toReport(report: RawReport, action?: RawAction): ConditionReport {
  return {
    id: report.id,
    capture_id: report.observation_id,
    site_id: report.site_id,
    category: report.category,
    subtype: report.subtype,
    severity: report.severity,
    note: report.note,
    status: action?.target_status ?? 'open',
    custodian_note: action?.note ?? null,
    status_changed_at: action?.created_at ?? null,
    created_at: report.recorded_at,
  };
}

function encodeCursor(report: ConditionReport): string {
  return Buffer.from(`${report.created_at}|${report.id}`, 'utf8').toString('base64url');
}

function decodeCursor(cursor?: string): { createdAt: string; id: string } | null {
  if (!cursor) return null;
  try {
    const [createdAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    if (!createdAt || !id || Number.isNaN(new Date(createdAt).getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

export async function listSites(client?: SupabaseClient): Promise<Site[]> {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase
    .from('monitored_sites')
    .select('id,name_en,name_ne')
    .eq('active', true)
    .order('name_en');
  if (error) throw new Error(error.message);
  return (data ?? []).map((site) => ({
    id: String(site.id),
    name: { en: String(site.name_en), ne: site.name_ne ? String(site.name_ne) : null },
  }));
}

export async function listReports(query: ReportQuery = {}, client?: SupabaseClient) {
  const supabase = client ?? await createClient();
  const limit = Math.min(100, Math.max(1, query.limit ?? 50));
  const pageSize = 100;
  const matches: ConditionReport[] = [];
  let cursor = decodeCursor(query.cursor);
  let exhausted = false;
  let scannedPages = 0;

  while (matches.length <= limit && !exhausted && scannedPages < 100) {
    let request = supabase
      .from('condition_reports')
      .select('id,observation_id,site_id,category,subtype,severity,note,recorded_at')
      .order('recorded_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(pageSize);

    if (query.siteId) request = request.eq('site_id', query.siteId);
    else if (query.allowedSiteIds) request = request.in('site_id', query.allowedSiteIds);
    if (cursor) {
      request = request.or(
        `recorded_at.lt.${cursor.createdAt},and(recorded_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
      );
    }

    const { data: reportRows, error } = await request;
    if (error) throw new Error(error.message);
    const reports = (reportRows ?? []) as RawReport[];
    const ids = reports.map((report) => report.id);
    let actions: RawAction[] = [];
    if (ids.length) {
      const result = await supabase
        .from('condition_report_actions')
        .select('id,report_id,target_status,note,created_at')
        .in('report_id', ids)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      if (result.error) throw new Error(result.error.message);
      actions = (result.data ?? []) as RawAction[];
    }

    const latest = latestActions(actions);
    matches.push(...reports
      .map((report) => toReport(report, latest.get(report.id)))
      .filter((report) => !query.status || report.status === query.status));
    exhausted = reports.length < pageSize;
    if (reports.length) {
      const last = reports[reports.length - 1];
      cursor = { createdAt: last.recorded_at, id: last.id };
    }
    scannedPages += 1;
  }

  const items = matches.slice(0, limit);
  return {
    items,
    nextCursor: items.length === limit && (matches.length > limit || !exhausted)
      ? encodeCursor(items[items.length - 1])
      : null,
  };
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return Number(value.toFixed(1));
}

type TrendPoint = {
  at: string;
  coverage_pct: number;
  open_reports: number;
};

function buildTrend(
  from: string,
  to: string,
  vantages: Array<{ id: string }>,
  observations: RawObservation[],
  reports: RawReport[],
  actions: RawAction[],
): TrendPoint[] {
  const start = new Date(from).getTime();
  const finish = new Date(to).getTime();
  const bucketCount = 12;
  const span = Math.max(1, finish - start);

  return Array.from({ length: bucketCount }, (_, index) => {
    const atMs = index === bucketCount - 1
      ? finish
      : start + Math.round(span * (index + 1) / bucketCount);
    const surveyed = new Set(observations
      .filter((observation) => new Date(observation.captured_at).getTime() <= atMs)
      .map((observation) => observation.vantage_id));
    const openReports = reports.filter((report) => {
      if (new Date(report.recorded_at).getTime() > atMs) return false;
      const status = actions
        .filter((action) => action.report_id === report.id && new Date(action.created_at).getTime() <= atMs)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        ?.target_status ?? 'open';
      return status === 'open';
    }).length;

    return {
      at: new Date(atMs).toISOString(),
      coverage_pct: vantages.length
        ? Math.round(100 * vantages.filter((vantage) => surveyed.has(vantage.id)).length / vantages.length)
        : 0,
      open_reports: openReports,
    };
  });
}

export async function dashboard(
  from: string,
  to: string,
  siteId: string | undefined,
  allowedSiteIds: string[],
  client?: SupabaseClient,
) {
  const supabase = client ?? await createClient();
  let vantageQuery = supabase.from('monitored_vantages').select('id,site_id,urgent').eq('active', true);
  let observationQuery = supabase
    .from('observations')
    .select('id,site_id,vantage_id,captured_at,latitude,longitude,align_score,photo_path')
    .gte('captured_at', from)
    .lte('captured_at', to);
  let reportQuery = supabase
    .from('condition_reports')
    .select('id,observation_id,site_id,category,subtype,severity,note,recorded_at')
    .gte('recorded_at', from)
    .lte('recorded_at', to);
  if (siteId) {
    vantageQuery = vantageQuery.eq('site_id', siteId);
    observationQuery = observationQuery.eq('site_id', siteId);
    reportQuery = reportQuery.eq('site_id', siteId);
  } else {
    vantageQuery = vantageQuery.in('site_id', allowedSiteIds);
    observationQuery = observationQuery.in('site_id', allowedSiteIds);
    reportQuery = reportQuery.in('site_id', allowedSiteIds);
  }

  const [vantageResult, observationResult, reportResult] = await Promise.all([
    vantageQuery,
    observationQuery,
    reportQuery,
  ]);
  if (vantageResult.error) throw new Error(vantageResult.error.message);
  if (observationResult.error) throw new Error(observationResult.error.message);
  if (reportResult.error) throw new Error(reportResult.error.message);

  const vantages = (vantageResult.data ?? []) as { id: string; site_id: string; urgent: boolean }[];
  const observations = (observationResult.data ?? []) as RawObservation[];
  const reports = (reportResult.data ?? []) as RawReport[];
  const reportIds = reports.map((report) => report.id);
  let actions: RawAction[] = [];
  if (reportIds.length) {
    const actionResult = await supabase
      .from('condition_report_actions')
      .select('id,report_id,target_status,note,created_at')
      .in('report_id', reportIds)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });
    if (actionResult.error) throw new Error(actionResult.error.message);
    actions = (actionResult.data ?? []) as RawAction[];
  }

  const latest = latestActions(actions);
  const activeVantageIds = vantages.map((vantage) => vantage.id);
  let priorityActions: Array<{ vantage_id: string; urgent: boolean; created_at: string; id: string }> = [];
  if (activeVantageIds.length) {
    const priorityResult = await supabase
      .from('vantage_priority_actions')
      .select('id,vantage_id,urgent,created_at')
      .in('vantage_id', activeVantageIds)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });
    if (priorityResult.error) throw new Error(priorityResult.error.message);
    priorityActions = (priorityResult.data ?? []) as typeof priorityActions;
  }
  const latestPriority = new Map<string, boolean>();
  priorityActions.forEach((action) => {
    if (!latestPriority.has(action.vantage_id)) latestPriority.set(action.vantage_id, action.urgent);
  });
  const surveyed = new Set(observations.map((observation) => observation.vantage_id));
  const currentReports = reports.map((report) => toReport(report, latest.get(report.id)));
  const statuses: Record<ReportStatus, number> = { open: 0, acknowledged: 0, in_progress: 0, resolved: 0 };
  currentReports.forEach((report) => { statuses[report.status] += 1; });

  const responseHours: number[] = [];
  const resolutionHours: number[] = [];
  for (const report of reports) {
    const reportActions = actions
      .filter((action) => action.report_id === report.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const first = reportActions[0];
    const resolved = reportActions.find((action) => action.target_status === 'resolved');
    if (first) responseHours.push((new Date(first.created_at).getTime() - new Date(report.recorded_at).getTime()) / 3600000);
    if (resolved) resolutionHours.push((new Date(resolved.created_at).getTime() - new Date(report.recorded_at).getTime()) / 3600000);
  }

  const siteIds = [...new Set(vantages.map((vantage) => vantage.site_id))];
  const perSite = siteIds.map((id) => {
    const siteVantages = vantages.filter((vantage) => vantage.site_id === id);
    const siteObservations = observations.filter((observation) => observation.site_id === id);
    const siteReports = currentReports.filter((report) => report.site_id === id);
    return {
      site_id: id,
      captures: siteObservations.length,
      coverage_pct: siteVantages.length
        ? Math.round(100 * siteVantages.filter((vantage) => surveyed.has(vantage.id)).length / siteVantages.length)
        : 0,
      open_reports: siteReports.filter((report) => report.status === 'open').length,
      trend: buildTrend(
        from,
        to,
        siteVantages,
        siteObservations,
        reports.filter((report) => report.site_id === id),
        actions,
      ),
    };
  });

  const alignScores = observations
    .map((observation) => observation.align_score)
    .filter((score): score is number => typeof score === 'number');
  let commitments: Array<{
    id: string;
    vantage_id: string;
    owner_kind: 'individual' | 'school';
    public_label: string | null;
    next_due_at: string;
  }> = [];
  if (activeVantageIds.length) {
    const commitmentResult = await supabase
      .from('vantage_commitments')
      .select('id,vantage_id,owner_kind,public_label,next_due_at')
      .eq('active', true)
      .in('vantage_id', activeVantageIds);
    if (commitmentResult.error) throw new Error(commitmentResult.error.message);
    commitments = (commitmentResult.data ?? []) as typeof commitments;
  }
  const now = Date.now();
  const dueSoon = now + 30 * 86400000;
  return {
    window: { from, to },
    coverage_pct: vantages.length
      ? Math.round(100 * vantages.filter((vantage) => surveyed.has(vantage.id)).length / vantages.length)
      : 0,
    vantages_total: vantages.length,
    vantages_surveyed: vantages.filter((vantage) => surveyed.has(vantage.id)).length,
    captures_total: observations.length,
    median_align_score: median(alignScores),
    reports_by_status: statuses,
    median_first_response_hours: median(responseHours),
    median_resolution_hours: median(resolutionHours),
    commitments_overdue: commitments.filter((item) => new Date(item.next_due_at).getTime() < now).length,
    commitments_due_soon: commitments.filter((item) => {
      const due = new Date(item.next_due_at).getTime();
      return due >= now && due <= dueSoon;
    }).length,
    commitments: commitments.map((item) => ({
      ...item,
      due_state: new Date(item.next_due_at).getTime() < now
        ? 'overdue' as const
        : new Date(item.next_due_at).getTime() <= dueSoon
          ? 'due_soon' as const
          : 'upcoming' as const,
    })),
    vantages: vantages.map((vantage) => ({
      id: vantage.id,
      site_id: vantage.site_id,
      urgent: latestPriority.get(vantage.id) ?? vantage.urgent,
    })),
    trend: buildTrend(from, to, vantages, observations, reports, actions),
    per_site: perSite,
    generated_at: new Date().toISOString(),
  };
}

export async function observationForReport(reportId: string, client?: SupabaseClient) {
  const supabase = client ?? await createClient();
  const { data: report, error: reportError } = await supabase
    .from('condition_reports')
    .select('observation_id,site_id')
    .eq('id', reportId)
    .maybeSingle();
  if (reportError) throw new Error(reportError.message);
  if (!report) return null;
  const { data: observation, error } = await supabase
    .from('observations')
    .select('id,site_id,vantage_id,captured_at,latitude,longitude,align_score,photo_path')
    .eq('id', report.observation_id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return observation as RawObservation | null;
}
