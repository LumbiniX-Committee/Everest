'use client';

import { useState } from 'react';
import { Check, Copy, Download, KeyRound } from 'lucide-react';

import { Empty, Forbidden, Loading, Notice, PageHeader, Panel, StatTile, inputClass, primaryButton, quietButton } from '@/components/admin/ui';
import { useAdminData } from '@/components/admin/useAdminData';
import { issueCodes, revokeBatch, shortDate, type AdminBatch, type AdminOverview } from '@/lib/adminApi';

type Codes = { batches: AdminBatch[]; plans: AdminOverview['plans'] };

/** Pro codes: issue a labelled batch, watch it get used, revoke it. A code is shown once only. */
export default function AdminCodesPage() {
  const { data, error, forbidden, loading, loadedAt, reload } = useAdminData<Codes>('/api/admin/codes/batches');
  const [count, setCount] = useState(5);
  const [days, setDays] = useState(30);
  const [validDays, setValidDays] = useState(180);
  const [note, setNote] = useState('');
  const [codes, setCodes] = useState<{ note: string; list: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  if (forbidden) return <Forbidden />;

  const download = () => {
    if (!codes) return;
    const blob = new Blob([`Sākṣī Pro codes: ${codes.note}\n${days} days each\n\n${codes.list.join('\n')}\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saksi-pro-codes-${codes.note.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'batch'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pro codes" description="Codes unlock Pro in preview builds. Store builds open every feature, so codes matter there only once Pro is switched on." loadedAt={loadedAt} loading={loading} onRefresh={() => void reload()} />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {notice ? <Notice kind={notice.kind}>{notice.text}</Notice> : null}

      {data ? (
        <section aria-label="Pro in numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="On Pro now" value={data.plans.pro_active} />
          <StatTile label="Codes issued" value={data.plans.codes_issued} />
          <StatTile label="Still redeemable" value={data.plans.codes_live} />
          <StatTile label="Redemptions" value={data.plans.redemptions} />
        </section>
      ) : null}

      <Panel title="Issue a batch" description="Only a scrambled copy of each code is kept, so copy or download them as soon as they appear.">
        <form
          className="grid gap-4 sm:grid-cols-[0.6fr_0.6fr_0.7fr_1.6fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            setBusy('issue');
            setNotice(null);
            issueCodes({ count, days, valid_days: validDays, note })
              .then(async (result) => {
                setCodes({ note, list: result.codes });
                setCopied(false);
                setNote('');
                await reload();
              })
              .catch((issueError) => setNotice({ kind: 'error', text: issueError instanceof Error ? issueError.message : 'Could not issue codes.' }))
              .finally(() => setBusy(null));
          }}
        >
          <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
            How many
            <input type="number" min={1} max={200} required className={inputClass} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
            Days of Pro
            <input type="number" min={1} max={366} required className={inputClass} value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
            Redeem within
            <select className={inputClass} value={validDays} onChange={(e) => setValidDays(Number(e.target.value))}>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
            Who it is for
            <input required maxLength={200} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lumbini guides, December" />
          </label>
          <button className={primaryButton} disabled={busy === 'issue'}>
            <KeyRound className="size-4" aria-hidden /> Issue
          </button>
        </form>

        {codes ? (
          <div className="mt-5 rounded-xl border border-marigold/50 bg-marigold/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-ink">{`${codes.list.length} codes for “${codes.note}”. Shown once: save them now.`}</p>
              <div className="flex gap-2">
                <button type="button" className={quietButton} onClick={() => void navigator.clipboard.writeText(codes.list.join('\n')).then(() => setCopied(true))}>
                  {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                  {copied ? 'Copied' : 'Copy all'}
                </button>
                <button type="button" className={quietButton} onClick={download}>
                  <Download className="size-4" aria-hidden /> Download
                </button>
              </div>
            </div>
            <ul className="mt-3 grid gap-x-6 gap-y-1 font-mono text-[0.95rem] text-ink sm:grid-cols-2 lg:grid-cols-3">
              {codes.list.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Panel>

      <Panel title="Batches">
        {!data ? (
          <Loading />
        ) : data.batches.length === 0 ? (
          <Empty>No codes issued yet.</Empty>
        ) : (
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="text-sm text-ink-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Batch</th>
                  <th scope="col" className="px-5 py-3 font-medium">Issued</th>
                  <th scope="col" className="px-5 py-3 font-medium">Pro length</th>
                  <th scope="col" className="w-56 px-5 py-3 font-medium">Redeemed</th>
                  <th scope="col" className="px-5 py-3 font-medium">Redeem by</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Revoke</span></th>
                </tr>
              </thead>
              <tbody>
                {data.batches.map((batch) => {
                  const key = `${batch.note}-${batch.issued_on}-${batch.duration_days}`;
                  const share = batch.issued ? batch.redeemed / batch.issued : 0;
                  const allRevoked = batch.revoked >= batch.issued;
                  return (
                    <tr key={key} className="border-t border-line">
                      <td className="px-5 py-3 font-medium text-ink">
                        {batch.note ?? 'No note'}
                        {batch.revoked ? <span className="ml-2 rounded bg-robe/10 px-1.5 py-0.5 text-xs font-medium text-robe">{allRevoked ? 'Revoked' : `${batch.revoked} revoked`}</span> : null}
                      </td>
                      <td className="px-5 py-3 text-ink-soft tabular">{shortDate(batch.issued_on)}</td>
                      <td className="px-5 py-3 text-ink-soft tabular">{`${batch.duration_days} days`}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 rounded-full bg-surface-secondary">
                            <div className="h-2 rounded-full bg-sandstone" style={{ width: `${Math.min(100, share * 100)}%` }} />
                          </div>
                          <span className="text-sm text-ink-soft tabular">{`${batch.redeemed}/${batch.issued}`}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-ink-soft tabular">{shortDate(batch.valid_until)}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {allRevoked ? null : confirming === key ? (
                          <span className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex h-9 items-center rounded-lg bg-robe px-3 text-sm font-semibold text-white disabled:opacity-50"
                              disabled={busy === key}
                              onClick={() => {
                                setBusy(key);
                                revokeBatch({ note: batch.note, issued_on: batch.issued_on })
                                  .then(async (result) => {
                                    setNotice({ kind: 'success', text: `${result.revoked} codes revoked. Anyone who already redeemed keeps the time they were given.` });
                                    setConfirming(null);
                                    await reload();
                                  })
                                  .catch((revokeError) => setNotice({ kind: 'error', text: revokeError instanceof Error ? revokeError.message : 'Could not revoke.' }))
                                  .finally(() => setBusy(null));
                              }}
                            >
                              Revoke batch
                            </button>
                            <button type="button" className={quietButton} onClick={() => setConfirming(null)}>Keep</button>
                          </span>
                        ) : (
                          <button type="button" className={`${quietButton} text-robe`} onClick={() => setConfirming(key)}>Revoke…</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
