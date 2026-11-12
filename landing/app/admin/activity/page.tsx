'use client';

import { Empty, Forbidden, Loading, Notice, PageHeader } from '@/components/admin/ui';
import { useAdminData } from '@/components/admin/useAdminData';
import { ACTION_LABEL, shortDate, type AdminAction } from '@/lib/adminApi';

function describe(action: AdminAction): string {
  const d = action.detail;
  switch (action.action) {
    case 'set_custodian':
      return `${d.active === false ? 'Turned off' : 'Granted'} ${String(d.role ?? 'custodian')} access to ${String(d.site_id ?? 'a site')}`;
    case 'issue_codes':
      return `${String(d.count)} codes, ${String(d.days)} days each${d.note ? `, “${String(d.note)}”` : ''}`;
    case 'revoke_batch':
      return `${String(d.count ?? 0)} codes in “${String(d.note ?? 'no note')}”, issued ${String(d.issued_on ?? '')}`;
    default:
      return '';
  }
}

/** Every change made through the console. The database refuses to edit or delete these rows. */
export default function AdminActivityPage() {
  const { data, error, forbidden, loading, loadedAt, reload } = useAdminData<{ actions: AdminAction[] }>('/api/admin/activity');
  if (forbidden) return <Forbidden />;
  return (
    <div className="space-y-6">
      <PageHeader title="Admin log" description="Every change made through this console, newest first. It cannot be edited or deleted." loadedAt={loadedAt} loading={loading} onRefresh={() => void reload()} />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {!data ? (
        <Loading label="Loading the log" />
      ) : data.actions.length === 0 ? (
        <Empty>No admin changes yet.</Empty>
      ) : (
        <ol className="rounded-xl border border-line bg-surface">
          {data.actions.map((action, i) => (
            <li key={`${action.created_at}-${i}`} className="grid gap-1 border-t border-line px-5 py-4 first:border-t-0 sm:grid-cols-[9rem_1fr_auto] sm:items-baseline sm:gap-6">
              <span className="text-sm text-ink-muted tabular">{`${shortDate(action.created_at)} ${new Date(action.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}</span>
              <div>
                <p className="font-medium text-ink">{ACTION_LABEL[action.action] ?? action.action}</p>
                {describe(action) ? <p className="text-sm text-ink-soft">{describe(action)}</p> : null}
              </div>
              <span className="text-sm text-ink-muted">{action.admin_email ?? 'Removed account'}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
