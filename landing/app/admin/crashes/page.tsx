'use client';

import { useState } from 'react';

import { Empty, Forbidden, Loading, Notice, PageHeader, inputClass } from '@/components/admin/ui';
import { useAdminData } from '@/components/admin/useAdminData';
import { relative, shortDate, type CrashGroup } from '@/lib/adminApi';

const WINDOWS = [7, 30, 90, 365] as const;

/** Crashes from visitors who turned crash reports on, grouped by message. No user ids or stacks are shown. */
export default function AdminCrashesPage() {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);
  const { data, error, forbidden, loading, loadedAt, reload } = useAdminData<{ groups: CrashGroup[] }>(`/api/admin/crashes?days=${days}`);
  if (forbidden) return <Forbidden />;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Crashes"
        description="Sent only by visitors who turned on “Share crash reports”. Grouped by message; newest first."
        loadedAt={loadedAt}
        loading={loading}
        onRefresh={() => void reload()}
        actions={
          <select aria-label="Time window" className={inputClass} value={days} onChange={(e) => setDays(Number(e.target.value) as (typeof WINDOWS)[number])}>
            {WINDOWS.map((w) => (
              <option key={w} value={w}>{w === 365 ? 'Last 12 months' : `Last ${w} days`}</option>
            ))}
          </select>
        }
      />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {!data ? (
        <Loading label="Loading crashes" />
      ) : data.groups.length === 0 ? (
        <Empty>{`No crashes received in the last ${days} days.`}</Empty>
      ) : (
        <ul className="space-y-3">
          {data.groups.map((group) => (
            <li key={group.message} className={`rounded-xl border bg-surface p-5 ${group.fatal ? 'border-robe/30' : 'border-line'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="max-w-3xl font-medium break-words text-ink">{group.message}</p>
                <div className="flex items-center gap-2 text-sm">
                  {group.fatal ? <span className="rounded-full bg-robe/10 px-2.5 py-0.5 font-medium text-robe">{`${group.fatal} fatal`}</span> : null}
                  <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 font-medium text-ink-soft tabular">{`${group.occurrences}×`}</span>
                </div>
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                <div><dt className="text-ink-muted">Last seen</dt><dd className="text-ink tabular">{relative(group.last_seen)}</dd></div>
                <div><dt className="text-ink-muted">First seen</dt><dd className="text-ink tabular">{shortDate(group.first_seen)}</dd></div>
                <div><dt className="text-ink-muted">Versions</dt><dd className="text-ink">{group.versions.join(', ')}</dd></div>
                <div><dt className="text-ink-muted">Where</dt><dd className="break-words text-ink">{group.routes.length ? group.routes.join(', ') : group.platforms.join(', ')}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
