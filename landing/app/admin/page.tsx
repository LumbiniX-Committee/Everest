'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, Copy, KeyRound, Loader2, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';

import {
  AdminApiError,
  getConsole,
  issueCodes,
  revokeBatch,
  setCustodian,
  type AdminConsole,
} from '@/lib/adminApi';

/**
 * The owner's console. Every request is checked again by the route handler and
 * by the database function behind it; this page decides nothing about access.
 */

const WINDOWS = [7, 30, 90, 365] as const;
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : '—');
const daysAgo = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : null);

const ACTION_LABEL: Record<string, string> = {
  set_custodian: 'Changed site access',
  issue_codes: 'Issued Pro codes',
  revoke_batch: 'Revoked a code batch',
};

function Stat({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${warn ? 'border-robe/30 bg-robe/5' : 'border-line bg-surface'}`}>
      <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</p>
      <p className={`mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums ${warn ? 'text-robe' : 'text-ink'}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mt-10 rounded-3xl border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const input = 'rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink';
const button = 'inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-surface disabled:opacity-50';

export default function AdminPage() {
  const router = useRouter();
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);
  const [data, setData] = useState<AdminConsole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [siteId, setSiteId] = useState('');
  const [role, setRole] = useState<'custodian' | 'manager'>('custodian');

  const [count, setCount] = useState(5);
  const [codeDays, setCodeDays] = useState(30);
  const [note, setNote] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await getConsole(days));
    } catch (loadError) {
      if (loadError instanceof AdminApiError && loadError.status === 401) {
        router.push('/login?next=/admin');
        return;
      }
      if (loadError instanceof AdminApiError && loadError.status === 403) {
        setForbidden(true);
        return;
      }
      setError(loadError instanceof Error ? loadError.message : 'Could not load the admin console.');
    }
  }, [days, router]);

  // The timeout keeps the network-triggered state change out of the effect body.
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const run = async (key: string, task: () => Promise<string | void>) => {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const message = await task();
      if (message) setNotice(message);
      await load();
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : 'That did not work.');
    } finally {
      setBusy(null);
    }
  };

  if (forbidden) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <ShieldCheck className="mx-auto size-10 text-sandstone-deep" aria-hidden />
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">Not an admin account</h1>
        <p className="mt-3 text-ink-soft">
          This account is signed in but is not a platform admin. Site custodians use the{' '}
          <Link className="font-semibold text-sandstone-deep underline" href="/custodian">custodian portal</Link>.
        </p>
      </main>
    );
  }

  const o = data?.overview;
  const sites = o?.sites ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">Sākṣī</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-semibold text-ink">Admin console</h1>
          <p className="mt-2 max-w-xl text-ink-soft">
            The whole service at a glance: reports waiting on a site, who looks after each site, Pro codes and crashes.
            Nothing here deletes; every change is logged.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select aria-label="Time window" className={input} value={days} onChange={(e) => setDays(Number(e.target.value) as (typeof WINDOWS)[number])}>
            {WINDOWS.map((w) => (
              <option key={w} value={w}>{`Last ${w} days`}</option>
            ))}
          </select>
          <button type="button" onClick={() => void load()} className="rounded-lg border border-line bg-surface p-2 text-ink-soft" aria-label="Refresh">
            <RefreshCw className="size-4" aria-hidden />
          </button>
          <form action="/auth/signout" method="post">
            <button className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink-soft">Sign out</button>
          </form>
        </div>
      </header>

      {error ? (
        <div role="alert" className="mt-8 flex items-center gap-3 rounded-2xl border border-robe/30 bg-robe/5 px-5 py-4 text-robe">
          <AlertTriangle className="size-5 shrink-0" aria-hidden />
          <p className="text-sm">{error}</p>
        </div>
      ) : null}
      {notice ? (
        <div role="status" className="mt-8 flex items-center gap-3 rounded-2xl border border-tirtha/30 bg-tirtha/5 px-5 py-4 text-tirtha">
          <Check className="size-5 shrink-0" aria-hidden />
          <p className="text-sm">{notice}</p>
        </div>
      ) : null}

      {!o ? (
        <p className="mt-16 flex items-center gap-2 text-ink-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Loading the console
        </p>
      ) : (
        <>
          <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Waiting on a site" value={String(o.reports.open)} hint="Reports nobody has acted on" warn={o.reports.open > 0} />
            <Stat label="Unanswered > 7 days" value={String(o.reports.unanswered_week)} warn={o.reports.unanswered_week > 0} />
            <Stat label="Being worked on" value={String(o.reports.acknowledged + o.reports.in_progress)} />
            <Stat label="Resolved" value={String(o.reports.resolved)} />
            <Stat label="Photos received" value={String(o.observations.recent)} hint={`${o.observations.total} in all · ${o.observations.contributors_recent} contributors`} />
            <Stat label="Crashes" value={String(o.crashes.recent)} hint={`${o.crashes.fatal_recent} fatal`} warn={o.crashes.fatal_recent > 0} />
          </section>

          <Panel title="Sites">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs tracking-wide text-ink-muted uppercase">
                  <tr>
                    <th className="py-2 pr-4">Site</th>
                    <th className="py-2 pr-4">Open</th>
                    <th className="py-2 pr-4">Oldest open</th>
                    <th className="py-2 pr-4">All reports</th>
                    <th className="py-2">Custodians</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => {
                    const age = daysAgo(site.oldest_open_at);
                    return (
                      <tr key={site.id} className="border-t border-line">
                        <td className="py-3 pr-4 font-medium text-ink">{site.name_en}</td>
                        <td className="py-3 pr-4 tabular-nums">{site.open}</td>
                        <td className={`py-3 pr-4 tabular-nums ${age != null && age > 7 ? 'font-semibold text-robe' : ''}`}>
                          {age != null ? `${age} days` : '—'}
                        </td>
                        <td className="py-3 pr-4 tabular-nums">{site.reports}</td>
                        <td className={`py-3 tabular-nums ${site.custodians === 0 ? 'font-semibold text-robe' : ''}`}>
                          {site.custodians === 0 ? 'None: reports cannot move' : site.custodians}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Site access">
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void run('grant', async () => {
                  await setCustodian({ email, site_id: siteId, role, active: true });
                  setEmail('');
                  return `${email} can now act on reports for that site.`;
                });
              }}
            >
              <label className="grid gap-1 text-sm text-ink-soft">
                Email
                <input required type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@trust.org.np" />
              </label>
              <label className="grid gap-1 text-sm text-ink-soft">
                Site
                <select required className={input} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                  <option value="">Choose a site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name_en}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm text-ink-soft">
                Role
                <select className={input} value={role} onChange={(e) => setRole(e.target.value as 'custodian' | 'manager')}>
                  <option value="custodian">Custodian</option>
                  <option value="manager">Manager</option>
                </select>
              </label>
              <button className={button} disabled={busy === 'grant'}>
                <UserPlus className="size-4" aria-hidden /> Grant access
              </button>
            </form>
            <p className="mt-2 text-xs text-ink-muted">The person needs an account first: they sign in once, or you add them in Supabase under Authentication.</p>

            <ul className="mt-6 divide-y divide-line">
              {data.custodians.length === 0 ? <li className="py-3 text-sm text-ink-muted">No one has site access yet.</li> : null}
              {data.custodians.map((c) => (
                <li key={`${c.user_id}-${c.site_id}`} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <span className={`font-medium ${c.active ? 'text-ink' : 'text-ink-muted line-through'}`}>{c.email}</span>
                  <span className="text-ink-soft">{c.site_name}</span>
                  <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-ink-soft">{c.role}</span>
                  <span className="text-xs text-ink-muted">since {day(c.created_at)}</span>
                  <button
                    type="button"
                    disabled={busy === `toggle-${c.user_id}-${c.site_id}`}
                    onClick={() =>
                      void run(`toggle-${c.user_id}-${c.site_id}`, async () => {
                        await setCustodian({ email: c.email, site_id: c.site_id, role: c.role, active: !c.active });
                        return c.active ? `${c.email} no longer has access to ${c.site_name}.` : `${c.email} has access to ${c.site_name} again.`;
                      })
                    }
                    className="ml-auto rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft"
                  >
                    {c.active ? 'Turn off' : 'Turn on'}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Pro codes" action={<p className="text-sm text-ink-muted">{`${o.plans.pro_active} people on Pro now · ${o.plans.codes_live} codes still redeemable`}</p>}>
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void run('issue', async () => {
                  const result = await issueCodes({ count, days: codeDays, valid_days: 180, note });
                  setCodes(result.codes);
                  setCopied(false);
                  setNote('');
                  return `${result.codes.length} codes issued. Copy them now: only their hashes are kept.`;
                });
              }}
            >
              <label className="grid gap-1 text-sm text-ink-soft">
                How many
                <input type="number" min={1} max={200} className={`${input} w-24`} value={count} onChange={(e) => setCount(Number(e.target.value))} />
              </label>
              <label className="grid gap-1 text-sm text-ink-soft">
                Days of Pro
                <input type="number" min={1} max={366} className={`${input} w-24`} value={codeDays} onChange={(e) => setCodeDays(Number(e.target.value))} />
              </label>
              <label className="grid gap-1 text-sm text-ink-soft">
                Note (who or why)
                <input required maxLength={200} className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lumbini guides, December" />
              </label>
              <button className={button} disabled={busy === 'issue'}>
                <KeyRound className="size-4" aria-hidden /> Issue codes
              </button>
            </form>

            {codes.length ? (
              <div className="mt-4 rounded-2xl border border-sandstone/40 bg-sandstone/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-sandstone-deep">Shown once. Copy them before leaving this page.</p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold"
                    onClick={() => void navigator.clipboard.writeText(codes.join('\n')).then(() => setCopied(true))}
                  >
                    {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                    {copied ? 'Copied' : 'Copy all'}
                  </button>
                </div>
                <pre className="mt-3 overflow-x-auto font-mono text-sm text-ink">{codes.join('\n')}</pre>
              </div>
            ) : null}

            <ul className="mt-6 divide-y divide-line">
              {data.batches.length === 0 ? <li className="py-3 text-sm text-ink-muted">No codes issued yet.</li> : null}
              {data.batches.map((b) => (
                <li key={`${b.note}-${b.issued_on}-${b.duration_days}`} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <span className="font-medium text-ink">{b.note ?? 'No note'}</span>
                  <span className="text-ink-soft">{`${b.issued_on} · ${b.duration_days} days`}</span>
                  <span className="text-ink-muted">{`${b.redeemed} redeemed of ${b.issued}`}</span>
                  {b.revoked ? <span className="rounded-full bg-robe/10 px-2 py-0.5 text-xs text-robe">{`${b.revoked} revoked`}</span> : null}
                  {b.revoked < b.issued ? (
                    <button
                      type="button"
                      disabled={busy === `revoke-${b.note}-${b.issued_on}`}
                      onClick={() =>
                        void run(`revoke-${b.note}-${b.issued_on}`, async () => {
                          const result = await revokeBatch({ note: b.note, issued_on: b.issued_on });
                          return `${result.revoked} codes revoked. Anyone who already redeemed keeps the time they were given.`;
                        })
                      }
                      className="ml-auto rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-robe"
                    >
                      Revoke batch
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </Panel>

          <div className="grid gap-x-6 lg:grid-cols-2">
            <Panel title="Recent crashes">
              <ul className="divide-y divide-line">
                {data.crashes.length === 0 ? <li className="py-3 text-sm text-ink-muted">None received. Crash reports only come from visitors who turned them on.</li> : null}
                {data.crashes.map((c, i) => (
                  <li key={`${c.occurred_at}-${i}`} className="py-3 text-sm">
                    <p className={`font-medium ${c.fatal ? 'text-robe' : 'text-ink'}`}>{c.message}</p>
                    <p className="text-xs text-ink-muted">{`${day(c.occurred_at)} · ${c.platform} ${c.app_version}${c.route ? ` · ${c.route}` : ''}${c.fatal ? ' · fatal' : ''}`}</p>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Admin log">
              <ul className="divide-y divide-line">
                {data.actions.length === 0 ? <li className="py-3 text-sm text-ink-muted">No admin changes yet.</li> : null}
                {data.actions.map((a, i) => (
                  <li key={`${a.created_at}-${i}`} className="py-3 text-sm">
                    <p className="font-medium text-ink">{ACTION_LABEL[a.action] ?? a.action}</p>
                    <p className="text-xs text-ink-muted">{`${day(a.created_at)} · ${a.admin_email ?? 'removed account'}`}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </main>
  );
}
