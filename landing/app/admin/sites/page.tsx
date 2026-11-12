'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';

import { Empty, Forbidden, Loading, Notice, PageHeader, inputClass } from '@/components/admin/ui';
import { useAdminData } from '@/components/admin/useAdminData';
import { daysSince, relative, type AdminOverview, type AdminSite } from '@/lib/adminApi';

type SortKey = 'name' | 'open' | 'oldest' | 'photos' | 'custodians';

const SORTS: Record<SortKey, (a: AdminSite, b: AdminSite) => number> = {
  name: (a, b) => a.name_en.localeCompare(b.name_en),
  open: (a, b) => b.open - a.open || a.name_en.localeCompare(b.name_en),
  oldest: (a, b) => (daysSince(b.oldest_open_at) ?? -1) - (daysSince(a.oldest_open_at) ?? -1),
  photos: (a, b) => b.photos - a.photos,
  custodians: (a, b) => a.custodians - b.custodians,
};

/** Every monitored site: its open reports, how long the oldest has waited, its photos and who looks after it. */
export default function AdminSitesPage() {
  const { data, error, forbidden, loading, loadedAt, reload } = useAdminData<{ overview: AdminOverview }>('/api/admin?days=30');
  const [sort, setSort] = useState<SortKey>('open');
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const sites = data?.overview.sites ?? [];
    const q = query.trim().toLowerCase();
    return sites.filter((site) => !q || site.name_en.toLowerCase().includes(q) || site.id.includes(q)).sort(SORTS[sort]);
  }, [data, sort, query]);
  if (forbidden) return <Forbidden />;

  const header = (key: SortKey, label: string, align = 'text-left') => (
    <th scope="col" className={`px-4 py-3 font-medium ${align}`} aria-sort={sort === key ? 'descending' : 'none'}>
      <button type="button" onClick={() => setSort(key)} className={`inline-flex items-center gap-1 hover:text-ink ${sort === key ? 'text-ink' : ''}`}>
        {label}
        <ArrowUpDown className="size-3.5" aria-hidden />
      </button>
    </th>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Sites" description="The places Sākṣī monitors. A site with no custodian cannot move its reports forward." loadedAt={loadedAt} loading={loading} onRefresh={() => void reload()} />
      <input className={`${inputClass} w-full max-w-sm`} type="search" placeholder="Find a site" aria-label="Find a site" value={query} onChange={(e) => setQuery(e.target.value)} />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {!data ? (
        <Loading label="Loading sites" />
      ) : rows.length === 0 ? (
        <Empty>No site matches “{query}”.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-surface-secondary/60 text-sm text-ink-muted">
              <tr>
                {header('name', 'Site')}
                {header('open', 'Open reports', 'text-right')}
                {header('oldest', 'Oldest open')}
                <th scope="col" className="px-4 py-3 text-right font-medium">All reports</th>
                {header('photos', 'Photos', 'text-right')}
                <th scope="col" className="px-4 py-3 font-medium">Last photo</th>
                {header('custodians', 'Custodians', 'text-right')}
              </tr>
            </thead>
            <tbody>
              {rows.map((site) => {
                const age = daysSince(site.oldest_open_at);
                return (
                  <tr key={site.id} className="border-t border-line hover:bg-surface-secondary/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/reports?site=${encodeURIComponent(site.id)}`} className="font-medium text-ink hover:underline">{site.name_en}</Link>
                      <p className="text-sm text-ink-muted">{`${site.region_id.replace(/-/g, ' ')} · ${site.vantages} viewpoint${site.vantages === 1 ? '' : 's'}${site.active ? '' : ' · inactive'}`}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular">{site.open}</td>
                    <td className={`px-4 py-3 tabular ${age != null && age > 7 ? 'font-semibold text-robe' : 'text-ink-soft'}`}>{site.oldest_open_at ? relative(site.oldest_open_at) : '—'}</td>
                    <td className="px-4 py-3 text-right text-ink-soft tabular">{site.reports}</td>
                    <td className="px-4 py-3 text-right tabular">{site.photos}</td>
                    <td className="px-4 py-3 text-ink-soft tabular">{site.last_photo_at ? relative(site.last_photo_at) : 'None yet'}</td>
                    <td className="px-4 py-3 text-right tabular">
                      {site.custodians === 0 ? (
                        <Link href="/admin/access" className="font-semibold text-robe hover:underline">None · assign</Link>
                      ) : (
                        site.custodians
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
