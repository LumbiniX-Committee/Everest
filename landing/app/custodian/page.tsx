'use client';

import { useEffect, useMemo, useState } from 'react';
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
  acknowledgeReport,
  apiUrl,
  exportUrl,
  getDashboard,
  getReports,
  getSites,
  type ConditionReport,
  type DashboardStats,
  type ReportStatus,
  type Site,
} from '@/lib/custodianApi';

/**
 * The custodian dashboard — §4 of the strategy doc, "the product you sell,
 * underbuilt right now." Every number here already existed in mock-api's
 * /dashboard response; nothing consumed it until this page.
 *
 * Deliberately no login. mock-api has no notion of a custodian account to log
 * into (`custodian_id` is a free-text field an acknowledgement carries, not a
 * credential), so a login screen here would be theatre over a door with no
 * lock. What "simple, no complex auth" means in practice: a name, kept in
 * this browser, attached to the acknowledgements this person makes.
 */

const STATUS_LABEL: Record<ReportStatus, string> = {
  open: 'Open',
  corroborated: 'Corroborated',
  acknowledged: 'Acknowledged',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

const STATUS_TONE: Record<ReportStatus, string> = {
  open: 'bg-earth/10 text-earth',
  corroborated: 'bg-dhamma/15 text-dhamma',
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

function ReportRow({
  report,
  sites,
  custodianId,
  onChanged,
}: {
  report: ConditionReport;
  sites: Site[];
  custodianId: string;
  onChanged: () => void;
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<ReportStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(status: 'acknowledged' | 'in_progress' | 'resolved') {
    setBusy(status);
    setError(null);
    try {
      await acknowledgeReport({ reportId: report.id, status, note, custodianId });
      onChanged();
    } catch {
      setError('Could not reach the server. Try again once connected.');
    } finally {
      setBusy(null);
    }
  }

  const canAct = report.status !== 'resolved';

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
        <p className="mt-0.5 text-xs text-ink-muted">severity {report.severity} · {report.corroborations} corroboration{report.corroborations === 1 ? '' : 's'}</p>
        {report.note ? <p className="mt-1 text-xs text-ink-soft italic">"{report.note}"</p> : null}
      </td>
      <td className="py-3 pr-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[report.status]}`}>
          {STATUS_LABEL[report.status]}
        </span>
        {report.custodian_note ? <p className="mt-1 max-w-40 text-xs text-ink-muted">{report.custodian_note}</p> : null}
      </td>
      <td className="py-3">
        {canAct ? (
          <div className="flex flex-col gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="w-44 rounded-lg border border-line bg-ground px-2 py-1 text-xs text-ink placeholder:text-ink-muted focus:outline-2 focus:outline-offset-1 focus:outline-sakshi"
            />
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => act('acknowledged')}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded-lg bg-sakshi/10 px-2.5 py-1 text-xs font-semibold text-sakshi transition hover:bg-sakshi/20 disabled:opacity-50"
              >
                {busy === 'acknowledged' ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                Acknowledge
              </button>
              <button
                type="button"
                onClick={() => act('in_progress')}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded-lg bg-dhamma/10 px-2.5 py-1 text-xs font-semibold text-dhamma transition hover:bg-dhamma/20 disabled:opacity-50"
              >
                {busy === 'in_progress' ? <Loader2 className="size-3 animate-spin" /> : <Clock className="size-3" />}
                In progress
              </button>
              <button
                type="button"
                onClick={() => act('resolved')}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded-lg bg-tirtha/10 px-2.5 py-1 text-xs font-semibold text-tirtha transition hover:bg-tirtha/20 disabled:opacity-50"
              >
                {busy === 'resolved' ? <Loader2 className="size-3 animate-spin" /> : <ShieldCheck className="size-3" />}
                Resolved
              </button>
            </div>
            {error ? <p className="text-xs text-earth">{error}</p> : null}
          </div>
        ) : (
          <p className="text-xs text-ink-muted">
            {report.acknowledged_at
              ? `Closed ${new Date(report.acknowledged_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
              : 'Closed'}
          </p>
        )}
      </td>
    </tr>
  );
}

export default function CustodianDashboard() {
  const configured = apiUrl().length > 0;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [custodianId, setCustodianId] = useState('');

  useEffect(() => {
    const stored = window.localStorage.getItem('saksi.custodian.name');
    if (stored) setCustodianId(stored);
  }, []);

  useEffect(() => {
    if (custodianId) window.localStorage.setItem('saksi.custodian.name', custodianId);
  }, [custodianId]);

  async function load() {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [d, s, r] = await Promise.all([
        getDashboard(),
        getSites(),
        getReports({
          site_id: siteFilter || undefined,
          status: (statusFilter || undefined) as ReportStatus | undefined,
        }),
      ]);
      setStats(d);
      setSites(s);
      setReports(r);
    } catch {
      setError('Could not reach the demo API. It may be asleep — try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [siteFilter, statusFilter]);

  const openCount = stats?.reports_by_status
    ? (stats.reports_by_status.open ?? 0) + (stats.reports_by_status.corroborated ?? 0)
    : null;

  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [reports],
  );

  if (!configured) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">Custodian dashboard</h1>
        <p className="mt-4 text-ink-soft">
          This page needs <code className="rounded bg-ground-deep px-1.5 py-0.5 text-sm">NEXT_PUBLIC_API_URL</code> set
          to the Sākṣī API (mock-api/server.mjs locally, or its deployed URL) at build time.
        </p>
      </main>
    );
  }

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
        <div className="flex flex-col items-end gap-2">
          <label className="text-xs font-medium text-ink-muted">Acting as</label>
          <input
            value={custodianId}
            onChange={(e) => setCustodianId(e.target.value)}
            placeholder="Your name or office"
            className="w-52 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:outline-2 focus:outline-offset-1 focus:outline-sakshi"
          />
        </div>
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
        <StatCard label="Open reports" value={openCount !== null ? String(openCount) : '—'} hint="Open + corroborated" />
        <StatCard label="Median align score" value={stats ? stats.median_align_score.toFixed(2) : '—'} />
        <StatCard
          label="Median time to acknowledge"
          value={stats?.median_ack_hours != null ? `${stats.median_ack_hours}h` : '—'}
          hint={stats?.median_ack_hours == null ? 'No acknowledgements yet' : undefined}
        />
        <StatCard label="Resolved" value={stats ? String(stats.reports_by_status.resolved ?? 0) : '—'} />
      </section>

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
            href={exportUrl('csv')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-white hover:bg-ink-soft"
          >
            <Download className="size-4" aria-hidden />
            CSV
          </a>
          <a
            href={exportUrl('geojson')}
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
                <ReportRow key={r.id} report={r} sites={sites} custodianId={custodianId} onChanged={load} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
