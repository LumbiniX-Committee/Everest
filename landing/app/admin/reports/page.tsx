'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { Empty, Forbidden, Loading, Notice, PageHeader, StatusBadge, inputClass, quietButton } from '@/components/admin/ui';
import { useAdminData } from '@/components/admin/useAdminData';
import { STATUS_LABEL, daysSince, relative, shortDate, type AdminOverview, type AdminReport, type ReportStatus } from '@/lib/adminApi';

type Page = { items: AdminReport[]; total: number; page: number; pageSize: number };
const STATUSES: ReportStatus[] = ['open', 'acknowledged', 'in_progress', 'resolved'];

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<Loading label="Loading reports" />}>
      <Reports />
    </Suspense>
  );
}

/**
 * Every condition report across all sites. Read-only on purpose: custodians
 * act on reports in their portal, and the admin sees what they did. Filters
 * live in the address, so a filtered view can be shared or bookmarked.
 */
function Reports() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get('status') ?? '';
  const site = params.get('site') ?? '';
  const page = Number(params.get('page')) || 0;
  const query = new URLSearchParams({ ...(status ? { status } : {}), ...(site ? { site } : {}), page: String(page) });
  const { data, error, forbidden, loading, loadedAt, reload } = useAdminData<Page>(`/api/admin/reports?${query}`);
  const sites = useAdminData<{ overview: AdminOverview }>('/api/admin?days=30');
  const [open, setOpen] = useState<string | null>(null);
  if (forbidden) return <Forbidden />;

  const go = (next: Record<string, string>) => {
    const merged = new URLSearchParams({ ...(status ? { status } : {}), ...(site ? { site } : {}), ...next });
    for (const [key, value] of [...merged.entries()]) if (!value || (key === 'page' && value === '0')) merged.delete(key);
    router.push(`/admin/reports${merged.size ? `?${merged}` : ''}`);
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Every condition report from every site, with what its custodians have done. Custodians act on reports in their own portal; this view is for oversight."
        loadedAt={loadedAt}
        loading={loading}
        onRefresh={() => void reload()}
      />

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter reports">
        <button type="button" onClick={() => go({ status: '', page: '' })} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${!status ? 'bg-ink text-white' : 'border border-line bg-surface text-ink-soft hover:bg-surface-secondary'}`} aria-pressed={!status}>
          All
        </button>
        {STATUSES.map((value) => (
          <button key={value} type="button" onClick={() => go({ status: value, page: '' })} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${status === value ? 'bg-ink text-white' : 'border border-line bg-surface text-ink-soft hover:bg-surface-secondary'}`} aria-pressed={status === value}>
            {STATUS_LABEL[value]}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-ink-soft">
          Site
          <select className={`${inputClass} max-w-[16rem]`} value={site} onChange={(e) => go({ site: e.target.value, page: '' })}>
            <option value="">All sites</option>
            {(sites.data?.overview.sites ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.name_en}</option>
            ))}
          </select>
        </label>
      </div>

      {error ? <Notice kind="error">{error}</Notice> : null}
      {!data ? (
        <Loading label="Loading reports" />
      ) : data.items.length === 0 ? (
        <Empty>{status || site ? 'No reports match these filters.' : 'No reports have been filed yet.'}</Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-surface-secondary/60 text-sm text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Site</th>
                  <th scope="col" className="px-4 py-3 font-medium">Problem</th>
                  <th scope="col" className="px-4 py-3 font-medium">Filed</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Last action</th>
                  <th scope="col" className="w-12 px-4 py-3"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((report) => {
                  const expanded = open === report.id;
                  const age = daysSince(report.recorded_at);
                  const stale = report.status === 'open' && !report.status_at && (age ?? 0) > 7;
                  return (
                    <ReportRows key={report.id} report={report} expanded={expanded} stale={stale} onToggle={() => setOpen(expanded ? null : report.id)} />
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-muted">
            <span className="tabular">{`${data.total.toLocaleString('en-GB')} report${data.total === 1 ? '' : 's'} · page ${page + 1} of ${pages}`}</span>
            <div className="flex gap-2">
              <button type="button" className={quietButton} disabled={page === 0} onClick={() => go({ page: String(page - 1) })}>
                <ChevronLeft className="size-4" aria-hidden /> Newer
              </button>
              <button type="button" className={quietButton} disabled={page + 1 >= pages} onClick={() => go({ page: String(page + 1) })}>
                Older <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportRows({ report, expanded, stale, onToggle }: { report: AdminReport; expanded: boolean; stale: boolean; onToggle: () => void }) {
  const last = report.actions[report.actions.length - 1];
  return (
    <>
      <tr className={`border-t border-line ${expanded ? 'bg-surface-secondary/40' : 'hover:bg-surface-secondary/30'}`}>
        <td className="px-4 py-3 font-medium text-ink">{report.site_name}</td>
        <td className="px-4 py-3 text-ink-soft">
          <span className="capitalize">{report.category.replace(/_/g, ' ')}</span>
          {report.subtype ? <span className="text-ink-muted">{` · ${report.subtype.replace(/_/g, ' ')}`}</span> : null}
          <span className="ml-2 rounded bg-surface-secondary px-1.5 py-0.5 text-xs text-ink-soft capitalize">{report.severity}</span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap tabular">
          <span className={stale ? 'font-semibold text-robe' : 'text-ink-soft'}>{relative(report.recorded_at)}</span>
        </td>
        <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
        <td className="px-4 py-3 text-ink-soft tabular">{last ? relative(last.at) : <span className="text-ink-muted">None yet</span>}</td>
        <td className="px-4 py-3">
          <button type="button" onClick={onToggle} aria-expanded={expanded} aria-label={expanded ? 'Hide details' : 'Show details'} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-secondary">
            <ChevronDown className={`size-5 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`} aria-hidden />
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className="bg-surface-secondary/40">
          <td colSpan={6} className="px-4 pt-1 pb-5">
            <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
              <div>
                <p className="text-sm font-medium text-ink-muted">The visitor wrote</p>
                <p className="mt-1 text-ink">{report.note ? `“${report.note}”` : <span className="text-ink-muted">No note.</span>}</p>
                <p className="mt-3 text-sm text-ink-muted tabular">{`Filed ${shortDate(report.recorded_at)} · report ${report.id}`}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-ink-muted">What the site has done</p>
                {report.actions.length ? (
                  <ol className="mt-2 space-y-3 border-l-2 border-line pl-4">
                    {report.actions.map((action, i) => (
                      <li key={`${action.at}-${i}`} className="relative">
                        <span aria-hidden className="absolute top-1.5 -left-[1.4rem] size-2.5 rounded-full bg-sandstone" />
                        <p className="text-ink"><span className="font-medium">{STATUS_LABEL[action.status]}</span> <span className="text-sm text-ink-muted tabular">{shortDate(action.at)}</span></p>
                        {action.note ? <p className="text-sm text-ink-soft">{action.note}</p> : null}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-1 text-ink-soft">Nothing yet. The report has been received and no custodian has acted.</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
