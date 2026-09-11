'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileJson,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import {
  exportUrl,
  getDashboard,
  getPhoto,
  getReports,
  getSites,
  recordReportAction,
  setVantageUrgency,
  CustodianApiError,
  type ConditionReport,
  type DashboardStats,
  type ReportStatus,
  type Site,
} from '@/lib/custodianApi';
import { allowedReportTargets } from '@/lib/report-workflow';

/**
 * Every request is authorized again in its route handler and by Supabase RLS.
 * The page never receives a service key or decides which sites an account may
 * read.
 */

const STATUS_LABEL: Record<ReportStatus, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

const STATUS_TONE: Record<ReportStatus, string> = {
  open: 'bg-earth/10 text-earth',
  acknowledged: 'bg-sakshi/15 text-sakshi',
  in_progress: 'bg-sakshi/15 text-sakshi',
  resolved: 'bg-tirtha/15 text-tirtha',
};

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

function siteName(sites: Site[], id: string): string {
  return sites.find((s) => s.id === id)?.name.en ?? id;
}

function Trend({ points }: { points: DashboardStats['trend'] }) {
  return (
    <div className="mt-4 grid grid-cols-12 items-end gap-1" aria-label="Coverage and open-report trend">
      {points.map((point) => (
        <div key={point.at} className="flex h-20 flex-col justify-end gap-1" title={`${point.coverage_pct}% coverage; ${point.open_reports} open`}>
          <div
            className="min-h-0.5 rounded-sm bg-earth/70"
            style={{ height: `${Math.min(100, point.open_reports * 12)}%` }}
            aria-hidden
          />
          <div
            className="min-h-0.5 rounded-sm bg-tirtha/70"
            style={{ height: `${point.coverage_pct}%` }}
            aria-hidden
          />
        </div>
      ))}
    </div>
  );
}

function ReportRow({
  report,
  sites,
  onChanged,
}: {
  report: ConditionReport;
  sites: Site[];
  onChanged: () => void;
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<ReportStatus | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const targets = allowedReportTargets(report.status);

  async function act(status: ReportStatus) {
    setBusy(status);
    setError(null);
    try {
      await recordReportAction({ reportId: report.id, status, note });
      onChanged();
    } catch {
      setError('Could not reach the server. Try again once connected.');
    } finally {
      setBusy(null);
    }
  }

  async function openPhoto() {
    setPhotoBusy(true);
    setError(null);
    try {
      const { url } = await getPhoto(report.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('The private photograph is unavailable or access has expired.');
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <tr className="border-b border-line/70 align-top last:border-0">
      <td className="py-3 pr-4">
        <p className="font-medium text-ink">{siteName(sites, report.site_id)}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
          <MapPin className="size-3" aria-hidden />
          {new Date(report.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </td>
      <td className="py-3 pr-4">
        <p className="text-ink">{report.category}{report.subtype ? ` · ${report.subtype}` : ''}</p>
        <p className="mt-0.5 text-xs text-ink-muted">Severity {report.severity}</p>
        {report.note ? <p className="mt-1 text-xs text-ink-soft italic">{report.note}</p> : null}
      </td>
      <td className="py-3 pr-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[report.status]}`}>
          {STATUS_LABEL[report.status]}
        </span>
        {report.custodian_note ? <p className="mt-1 max-w-40 text-xs text-ink-muted">{report.custodian_note}</p> : null}
        <button
          type="button"
          onClick={() => void openPhoto()}
          disabled={photoBusy}
          className="mt-2 text-xs font-semibold text-sakshi underline-offset-4 hover:underline disabled:opacity-50"
        >
          {photoBusy ? 'Opening…' : 'View private photograph'}
        </button>
      </td>
      <td className="py-3">
        {report.status !== 'resolved' ? (
          <div className="flex flex-col gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="w-44 rounded-lg border border-line bg-ground px-2 py-1 text-xs text-ink placeholder:text-ink-muted focus:outline-2 focus:outline-offset-1 focus:outline-sakshi"
            />
            <div className="flex flex-wrap gap-1.5">
              {targets.includes('acknowledged') ? <button
                type="button"
                onClick={() => act('acknowledged')}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded-lg bg-sakshi/10 px-2.5 py-1 text-xs font-semibold text-sakshi transition hover:bg-sakshi/20 disabled:opacity-50"
              >
                {busy === 'acknowledged' ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                Acknowledge
              </button> : null}
              {targets.includes('in_progress') ? <button
                type="button"
                onClick={() => act('in_progress')}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded-lg bg-dhamma/10 px-2.5 py-1 text-xs font-semibold text-dhamma transition hover:bg-dhamma/20 disabled:opacity-50"
              >
                {busy === 'in_progress' ? <Loader2 className="size-3 animate-spin" /> : <Clock className="size-3" />}
                In progress
              </button> : null}
              {targets.includes('resolved') ? <button
                type="button"
                onClick={() => act('resolved')}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded-lg bg-tirtha/10 px-2.5 py-1 text-xs font-semibold text-tirtha transition hover:bg-tirtha/20 disabled:opacity-50"
              >
                {busy === 'resolved' ? <Loader2 className="size-3 animate-spin" /> : <ShieldCheck className="size-3" />}
                Resolved
              </button> : null}
            </div>
            {error ? <p className="text-xs text-earth">{error}</p> : null}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-ink-muted">
              {report.status_changed_at
                ? `Closed ${new Date(report.status_changed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                : 'Closed'}
            </p>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Reason to reopen (required)"
              className="w-44 rounded-lg border border-line bg-ground px-2 py-1 text-xs text-ink"
            />
            <button
              type="button"
              onClick={() => act('open')}
              disabled={busy !== null || note.trim().length === 0}
              className="rounded-lg bg-earth/10 px-2.5 py-1 text-xs font-semibold text-earth disabled:opacity-50"
            >
              Reopen
            </button>
            {error ? <p className="text-xs text-earth">{error}</p> : null}
          </div>
        )}
      </td>
    </tr>
  );
}

export default function CustodianDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [priorityBusy, setPriorityBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<30 | 90 | 365>(90);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, s, r] = await Promise.all([
        getDashboard({ siteId: siteFilter || undefined, days }),
        getSites(),
        getReports({
          siteId: siteFilter || undefined,
          status: (statusFilter || undefined) as ReportStatus | undefined,
        }),
      ]);
      setStats(d);
      setSites(s);
      setReports(r.items);
      setNextCursor(r.nextCursor);
    } catch (loadError) {
      if (loadError instanceof CustodianApiError && loadError.status === 401) {
        router.push('/login?next=/custodian');
        return;
      }
      setError(loadError instanceof Error ? loadError.message : 'Could not load the portal.');
    } finally {
      setLoading(false);
    }
  }, [days, router, siteFilter, statusFilter]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getReports({
        siteId: siteFilter || undefined,
        status: (statusFilter || undefined) as ReportStatus | undefined,
        cursor: nextCursor,
      });
      setReports((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load more reports.');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, siteFilter, statusFilter]);

  const changeUrgency = useCallback(async (vantageId: string, urgent: boolean) => {
    setPriorityBusy(vantageId);
    setError(null);
    try {
      await setVantageUrgency(vantageId, urgent);
      await load();
    } catch (priorityError) {
      setError(priorityError instanceof Error ? priorityError.message : 'Could not change survey priority.');
    } finally {
      setPriorityBusy(null);
    }
  }, [load]);

  // The timeout makes the network-triggered state transition asynchronous to the effect.
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openCount = stats?.reports_by_status.open ?? null;

  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [reports],
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-ink">Custodian dashboard</h1>
          <p className="mt-2 max-w-xl text-ink-soft">
            Coverage, condition reports and exports for the sites Sākṣī monitors. Visitors are the sensors; this is what
            they collected.
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <button className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink-soft">
            Sign out
          </button>
        </form>
      </header>

      {error ? (
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-earth/30 bg-earth/5 px-5 py-4 text-earth">
          <AlertTriangle className="size-5 shrink-0" aria-hidden />
          <p className="text-sm">{error}</p>
          <button
            type="button"
            onClick={load}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-earth/10 px-3 py-1.5 text-xs font-semibold text-earth hover:bg-earth/20"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Retry
          </button>
        </div>
      ) : null}

      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Coverage" value={stats ? `${stats.coverage_pct}%` : '—'} hint={stats ? `${stats.vantages_surveyed} of ${stats.vantages_total} vantages` : undefined} />
        <StatCard label="Captures" value={stats ? String(stats.captures_total) : '—'} />
        <StatCard label="Open reports" value={openCount !== null ? String(openCount) : '—'} />
        <StatCard label="Median align score" value={stats?.median_align_score != null ? stats.median_align_score.toFixed(2) : '—'} />
        <StatCard
          label="Median time to acknowledge"
          value={stats?.median_first_response_hours != null ? `${stats.median_first_response_hours}h` : '—'}
          hint={stats?.median_first_response_hours == null ? 'No responses yet' : undefined}
        />
        <StatCard label="Resolved" value={stats ? String(stats.reports_by_status.resolved ?? 0) : '—'} />
      </section>
      {stats ? (
        <p className="mt-3 text-sm text-ink-muted">
          Adopted-vantage commitments: {stats.commitments_overdue} overdue · {stats.commitments_due_soon} due in 30 days
        </p>
      ) : null}

      {stats?.trend.length ? (
        <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">Selected-window trend</h2>
            <p className="text-xs text-ink-muted"><span className="text-tirtha">■</span> cumulative coverage · <span className="text-earth">■</span> open reports</p>
          </div>
          <Trend points={stats.trend} />
        </section>
      ) : null}

      {stats?.commitments.length ? (
        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">Adopted vantages</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.commitments.map((commitment) => (
              <div key={commitment.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-ink">{commitment.vantage_id}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${commitment.due_state === 'overdue' ? 'bg-earth/10 text-earth' : 'bg-tirtha/10 text-tirtha'}`}>
                    {commitment.due_state.replace('_', ' ')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-soft">
                  {commitment.public_label ?? commitment.owner_kind} · due {new Date(commitment.next_due_at).toLocaleDateString('en-GB')}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {stats?.vantages.length ? (
        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">Survey priorities</h2>
          <p className="mt-1 text-sm text-ink-muted">Urgent flags are append-only custodian actions and move these viewpoints to the top of visitor quests.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.vantages.map((vantage) => (
              <div key={vantage.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
                <div>
                  <p className="font-semibold text-ink">{vantage.id}</p>
                  <p className="text-xs text-ink-muted">{siteName(sites, vantage.site_id)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void changeUrgency(vantage.id, !vantage.urgent)}
                  disabled={priorityBusy === vantage.id}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${vantage.urgent ? 'bg-earth/10 text-earth' : 'bg-ground-deep text-ink-soft'}`}
                >
                  {priorityBusy === vantage.id ? 'Saving…' : vantage.urgent ? 'Clear urgent' : 'Mark urgent'}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="">All sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name.en}</option>
            ))}
          </select>
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value) as 30 | 90 | 365)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            aria-label="Reporting window"
          >
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={365}>365 days</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus | '')}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="">All statuses</option>
            {(Object.keys(STATUS_LABEL) as ReportStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink-soft hover:bg-ground-deep"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Refresh
          </button>
        </div>

        <div className="flex gap-2">
          <a
            href={exportUrl('csv', { siteId: siteFilter || undefined, status: statusFilter || undefined })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-white hover:bg-ink-soft"
          >
            <Download className="size-4" aria-hidden />
            CSV
          </a>
          <a
            href={exportUrl('geojson', { siteId: siteFilter || undefined, status: statusFilter || undefined })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-ink hover:bg-ground-deep"
          >
            <FileJson className="size-4" aria-hidden />
            GeoJSON
          </a>
        </div>
      </section>

      <section className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-ink-muted">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Loading reports…
          </div>
        ) : sortedReports.length === 0 ? (
          <p className="py-16 text-center text-ink-muted">No reports match this filter.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs font-semibold tracking-wide text-ink-muted uppercase">
                <th className="px-6 py-3 font-semibold">Site</th>
                <th className="px-0 py-3 font-semibold">Finding</th>
                <th className="px-0 py-3 font-semibold">Status</th>
                <th className="px-0 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="[&>tr>td:first-child]:pl-6 [&>tr>td:last-child]:pr-6">
              {sortedReports.map((r) => (
                <ReportRow key={r.id} report={r} sites={sites} onChanged={load} />
              ))}
            </tbody>
          </table>
        )}
      </section>

      {nextCursor ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more reports'}
          </button>
        </div>
      ) : null}

      {stats?.per_site.length ? (
        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">Per-site trend</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.per_site.map((site) => (
              <div key={site.site_id} className="rounded-2xl border border-line bg-surface p-4">
                <p className="font-semibold text-ink">{siteName(sites, site.site_id)}</p>
                <p className="mt-2 text-sm text-ink-soft">
                  {site.coverage_pct}% coverage · {site.captures} captures · {site.open_reports} open
                </p>
                <Trend points={site.trend} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
