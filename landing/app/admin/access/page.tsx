'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';

import { Empty, Forbidden, Loading, Notice, PageHeader, Panel, inputClass, primaryButton, quietButton } from '@/components/admin/ui';
import { useAdminData } from '@/components/admin/useAdminData';
import { relative, setCustodian, shortDate, type AdminAdmin, type AdminCustodian } from '@/lib/adminApi';

type Access = { custodians: AdminCustodian[]; admins: AdminAdmin[]; sites: { id: string; name_en: string }[] };

/** Who may act on which site's reports, and who runs the console. Access is turned off, never deleted. */
export default function AdminAccessPage() {
  const { data, error, forbidden, loading, loadedAt, reload } = useAdminData<Access>('/api/admin/access');
  const [email, setEmail] = useState('');
  const [siteId, setSiteId] = useState('');
  const [role, setRole] = useState<'custodian' | 'manager'>('custodian');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  if (forbidden) return <Forbidden />;

  const run = async (key: string, task: () => Promise<string>) => {
    setBusy(key);
    setNotice(null);
    try {
      setNotice({ kind: 'success', text: await task() });
      await reload();
    } catch (taskError) {
      setNotice({ kind: 'error', text: taskError instanceof Error ? taskError.message : 'That did not work.' });
    } finally {
      setBusy(null);
    }
  };

  const shown = (data?.custodians ?? []).filter((c) => filter === 'all' || c.active);

  return (
    <div className="space-y-6">
      <PageHeader title="Access" description="Custodians act on reports for the sites they are given. Every change here is logged." loadedAt={loadedAt} loading={loading} onRefresh={() => void reload()} />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {notice ? <Notice kind={notice.kind}>{notice.text}</Notice> : null}

      <Panel title="Give someone access to a site" description="They need an account first: they sign in once at /login, or you add them in Supabase under Authentication.">
        <form
          className="grid gap-4 sm:grid-cols-[1.4fr_1.2fr_0.8fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            const siteName = data?.sites.find((s) => s.id === siteId)?.name_en ?? siteId;
            void run('grant', async () => {
              await setCustodian({ email, site_id: siteId, role, active: true });
              setEmail('');
              return `${email} can now act on reports at ${siteName}.`;
            });
          }}
        >
          <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
            Email
            <input required type="email" autoComplete="off" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@trust.org.np" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
            Site
            <select required className={inputClass} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              <option value="">Choose a site</option>
              {(data?.sites ?? []).map((site) => (
                <option key={site.id} value={site.id}>{site.name_en}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
            Role
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as 'custodian' | 'manager')}>
              <option value="custodian">Custodian</option>
              <option value="manager">Manager</option>
            </select>
          </label>
          <button className={primaryButton} disabled={busy === 'grant' || !data}>
            <UserPlus className="size-4" aria-hidden /> Grant access
          </button>
        </form>
      </Panel>

      <Panel
        title="Custodians"
        action={
          <div className="flex rounded-lg border border-line p-0.5 text-sm" role="group" aria-label="Which custodians">
            {(['active', 'all'] as const).map((value) => (
              <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-md px-3 py-1 font-medium ${filter === value ? 'bg-ink text-white' : 'text-ink-soft'}`}>
                {value === 'active' ? 'Active' : 'Everyone'}
              </button>
            ))}
          </div>
        }
      >
        {!data ? (
          <Loading />
        ) : shown.length === 0 ? (
          <Empty>{filter === 'active' ? 'No one has active site access yet.' : 'No one has ever been given site access.'}</Empty>
        ) : (
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="text-sm text-ink-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Person</th>
                  <th scope="col" className="px-5 py-3 font-medium">Site</th>
                  <th scope="col" className="px-5 py-3 font-medium">Role</th>
                  <th scope="col" className="px-5 py-3 font-medium">Since</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Change</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => {
                  const key = `${c.user_id}-${c.site_id}`;
                  return (
                    <tr key={key} className="border-t border-line">
                      <td className={`px-5 py-3 font-medium ${c.active ? 'text-ink' : 'text-ink-muted'}`}>
                        {c.email}
                        {c.active ? null : <span className="ml-2 rounded bg-surface-secondary px-1.5 py-0.5 text-xs font-normal">Off</span>}
                      </td>
                      <td className="px-5 py-3 text-ink-soft">{c.site_name}</td>
                      <td className="px-5 py-3 text-ink-soft capitalize">{c.role}</td>
                      <td className="px-5 py-3 text-ink-soft tabular">{shortDate(c.created_at)}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          className={quietButton}
                          disabled={busy === key}
                          onClick={() =>
                            void run(key, async () => {
                              await setCustodian({ email: c.email, site_id: c.site_id, role: c.role, active: !c.active });
                              return c.active ? `${c.email} no longer has access to ${c.site_name}.` : `${c.email} has access to ${c.site_name} again.`;
                            })
                          }
                        >
                          {c.active ? 'Turn off' : 'Turn on'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Admins" description="Admins are added with the service role (tools/grant-admin.mjs), never from this page.">
        {!data ? (
          <Loading />
        ) : (
          <ul className="divide-y divide-line">
            {data.admins.map((admin) => (
              <li key={admin.email} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <span className="font-medium text-ink">{admin.email}</span>
                {admin.note ? <span className="text-sm text-ink-muted">{admin.note}</span> : null}
                <span className="ml-auto text-sm text-ink-muted tabular">{`Admin since ${shortDate(admin.since)} · last signed in ${relative(admin.last_sign_in_at)}`}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
