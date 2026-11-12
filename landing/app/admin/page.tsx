'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertTriangle, ArrowRight, Bug, MapPinned, ShieldAlert } from 'lucide-react';

import { Empty, Forbidden, Loading, Notice, PageHeader, Panel, StatTile, WeeklyBars, inputClass } from '@/components/admin/ui';
import { useAdminData } from '@/components/admin/useAdminData';
import { daysSince, relative, type AdminOverview, type WeeklyPoint } from '@/lib/adminApi';

const WINDOWS = [7, 30, 90, 365] as const;

/**
 * What needs the owner today, then how the service is doing. Attention items
 * come first because they are the only part of this page that asks for action.
 */
export default function AdminOverviewPage() {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);
  const { data, error, forbidden, loading, loadedAt, reload } = useAdminData<{ overview: AdminOverview; weekly: WeeklyPoint[] }>(`/api/admin?days=${days}`);
  if (forbidden) return <Forbidden />;
  const o = data?.overview;

  const attention = o
    ? [
        ...(o.reports.unanswered_week > 0
          ? [{ icon: AlertTriangle, text: `${o.reports.unanswered_week} report${o.reports.unanswered_week === 1 ? '' : 's'} filed over a week ago with no response from the site`, href: '/admin/reports?status=open' }]
          : []),
        ...o.sites
          .filter((site) => site.custodians === 0 && site.active)
          .slice(0, 1)
          .map(() => {
            const count = o.sites.filter((site) => site.custodians === 0 && site.active).length;
            return { icon: ShieldAlert, text: `${count} monitored site${count === 1 ? '' : 's'} with no custodian, so reports there cannot move`, href: '/admin/access' };
          }),
        ...(o.crashes.fatal_recent > 0
          ? [{ icon: Bug, text: `${o.crashes.fatal_recent} fatal crash${o.crashes.fatal_recent === 1 ? '' : 'es'} in the last ${days} days`, href: '/admin/crashes' }]
          : []),
      ]
    : [];

  const waiting = o ? o.sites.filter((site) => site.open > 0).sort((a, b) => (daysSince(b.oldest_open_at) ?? 0) - (daysSince(a.oldest_open_at) ?? 0)).slice(0, 6) : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description={`How Sākṣī is doing over the last ${days} days, compared with the ${days} days before.`}
        loadedAt={loadedAt}
        loading={loading}
        onRefresh={() => void reload()}
        actions={
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <span className="sr-only">Time window</span>
            <select className={inputClass} value={days} onChange={(e) => setDays(Number(e.target.value) as (typeof WINDOWS)[number])}>
              {WINDOWS.map((w) => (
                <option key={w} value={w}>{w === 365 ? 'Last 12 months' : `Last ${w} days`}</option>
              ))}
            </select>
          </label>
        }
      />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {!o ? (
        <Loading label="Loading the overview" />
      ) : (
        <>
          <section aria-labelledby="attention" className="rounded-xl border border-line bg-surface">
            <h2 id="attention" className="border-b border-line px-5 py-4 text-lg font-semibold text-ink">Needs attention</h2>
            {attention.length ? (
              <ul className="divide-y divide-line">
                {attention.map(({ icon: Icon, text, href }) => (
                  <li key={text}>
                    <Link href={href} className="flex items-center gap-3 px-5 py-4 text-ink hover:bg-surface-secondary/50">
                      <Icon className="size-5 shrink-0 text-robe" aria-hidden />
                      <span className="flex-1">{text}</span>
                      <ArrowRight className="size-4 text-ink-muted" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-5 text-ink-soft">Nothing is waiting on you. Every report has been answered within a week, every site has a custodian, and there were no fatal crashes.</p>
            )}
          </section>

          <section aria-label="Headline numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Reports filed" value={o.reports.recent} previous={o.reports.previous} hint={`vs previous ${days} days`} href="/admin/reports" />
            <StatTile label="Waiting on a site" value={o.reports.open} tone={o.reports.open > 0 ? 'alert' : 'plain'} hint="no action yet" href="/admin/reports?status=open" />
            <StatTile label="Photos received" value={o.observations.recent} previous={o.observations.previous} hint={`${o.observations.contributors_recent} contributors`} />
            <StatTile label="Accounts" value={o.accounts.total} hint={`${o.accounts.new_recent} new · ${o.accounts.with_email} with email`} />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Weekly activity" description="The last 12 weeks, Monday to Sunday.">
              <div className="grid gap-8 sm:grid-cols-2">
                <WeeklyBars title="Photos received" points={data.weekly} field="photos" />
                <WeeklyBars title="Reports filed" points={data.weekly} field="reports" />
              </div>
            </Panel>
            <Panel title="Where reports stand" description="Every report ever filed, by its current step.">
              <ReportFunnel reports={o.reports} />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Panel title="Oldest open reports, by site" action={<Link href="/admin/sites" className="text-sm font-medium text-sandstone-deep hover:underline">All sites</Link>}>
              {waiting.length ? (
                <ul className="divide-y divide-line">
                  {waiting.map((site) => {
                    const age = daysSince(site.oldest_open_at);
                    return (
                      <li key={site.id} className="flex items-center gap-3 py-3">
                        <MapPinned className="size-4 shrink-0 text-ink-muted" aria-hidden />
                        <Link href={`/admin/reports?site=${encodeURIComponent(site.id)}`} className="flex-1 font-medium text-ink hover:underline">{site.name_en}</Link>
                        <span className="text-sm text-ink-muted tabular">{site.open} open</span>
                        <span className={`w-24 text-right text-sm tabular ${age != null && age > 7 ? 'font-semibold text-robe' : 'text-ink-soft'}`}>{relative(site.oldest_open_at)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Empty>No site has an open report.</Empty>
              )}
            </Panel>
            <Panel title="Plans and people">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                {[
                  ['On Pro now', o.plans.pro_active],
                  ['Codes still redeemable', o.plans.codes_live],
                  ['Codes redeemed', o.plans.redemptions],
                  ['Active custodians', o.custodians_active],
                  ['Anonymous installs', o.accounts.anonymous],
                  ['Admins', o.accounts.admins],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-sm text-ink-muted">{label}</dt>
                    <dd className="mt-0.5 text-2xl font-semibold text-ink tabular">{Number(value).toLocaleString('en-GB')}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
          <p className="text-sm text-ink-muted">Counts come straight from the database. Nothing is estimated; a site with no photos shows 0 because none were received.</p>
        </>
      )}
    </div>
  );
}

function ReportFunnel({ reports }: { reports: AdminOverview['reports'] }) {
  const rows = [
    { label: 'Waiting', value: reports.open, bar: 'bg-robe/70', href: '/admin/reports?status=open' },
    { label: 'Acknowledged', value: reports.acknowledged, bar: 'bg-sandstone/60', href: '/admin/reports?status=acknowledged' },
    { label: 'In progress', value: reports.in_progress, bar: 'bg-sandstone', href: '/admin/reports?status=in_progress' },
    { label: 'Resolved', value: reports.resolved, bar: 'bg-tirtha', href: '/admin/reports?status=resolved' },
  ];
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (!total) return <Empty>No reports have been filed yet.</Empty>;
  return (
    <ul className="space-y-4">
      {rows.map((row) => (
        <li key={row.label}>
          <Link href={row.href} className="group block">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-ink group-hover:underline">{row.label}</span>
              <span className="text-ink-muted tabular">{`${row.value} · ${Math.round((row.value / total) * 100)}%`}</span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-surface-secondary">
              <div className={`h-2.5 rounded-full ${row.bar}`} style={{ width: `${row.value ? Math.max(2, (row.value / total) * 100) : 0}%` }} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
