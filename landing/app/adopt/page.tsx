'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Coverage = {
  vantage_id: string;
  site_id: string;
  last_capture_at: string | null;
  survey_age_days: number | null;
  priority: number;
  urgent: boolean;
};

type Commitment = {
  id: string;
  vantage_id: string;
  owner_kind: 'individual' | 'school';
  public_label: string | null;
  next_due_at: string;
  active: boolean;
};

export default function AdoptVantagePage() {
  const router = useRouter();
  const [coverage, setCoverage] = useState<Coverage[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [selected, setSelected] = useState('');
  const [ownerKind, setOwnerKind] = useState<'individual' | 'school'>('individual');
  const [label, setLabel] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [renderedAt] = useState(() => Date.now());

  async function loadCommitments() {
    const response = await fetch('/api/adoptions', { cache: 'no-store' });
    setSignedIn(response.status !== 401);
    if (response.ok) setCommitments(await response.json() as Commitment[]);
  }

  useEffect(() => {
    fetch('/api/public/coverage?days=90')
      .then((response) => response.ok ? response.json() as Promise<Coverage[]> : [])
      .then((rows) => {
        setCoverage(rows);
        setSelected((current) => current || rows[0]?.vantage_id || '');
      });
    void fetch('/api/adoptions', { cache: 'no-store' }).then(async (response) => {
      setSignedIn(response.status !== 401);
      if (response.ok) setCommitments(await response.json() as Commitment[]);
    });
  }, []);

  async function adopt(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch('/api/adoptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vantage_id: selected, owner_kind: ownerKind, public_label: label || null }),
    });
    if (response.status === 401) {
      router.push('/login?next=/adopt');
      return;
    }
    const payload = await response.json() as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? 'Could not adopt this vantage.');
      return;
    }
    setMessage('Vantage adopted. The next survey is due in 90 days.');
    await loadCommitments();
  }

  async function endCommitment(id: string) {
    setMessage(null);
    const response = await fetch(`/api/adoptions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      setMessage(payload?.error ?? 'Could not end this commitment.');
      return;
    }
    setMessage('The commitment has ended. Its record remains in the audit trail.');
    await loadCommitments();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-semibold tracking-wide text-sakshi uppercase">Adopt a vantage</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold text-ink">
        Return to one viewpoint every quarter
      </h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Individuals and schools can commit to a 90-day resurvey. Adoption is recognition and responsibility,
        never a coupon, discount, transferable reward, or commercial placement.
      </p>

      {signedIn === false ? (
        <a href="/login?next=/adopt" className="mt-8 inline-flex rounded-xl bg-ink px-4 py-3 font-semibold text-white">
          Sign in to adopt
        </a>
      ) : (
        <form onSubmit={adopt} className="mt-8 space-y-4 rounded-2xl border border-line bg-surface p-6">
          <label className="block text-sm font-medium text-ink">
            Viewpoint
            <select
              required
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-ground px-4 py-3"
            >
              {coverage.map((item) => (
                <option key={item.vantage_id} value={item.vantage_id}>
                  {item.site_id} · {item.vantage_id}
                  {item.urgent ? ' · urgent' : item.survey_age_days == null ? ' · never surveyed' : ` · ${item.survey_age_days} days`}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-ink">
            Adopter
            <select
              value={ownerKind}
              onChange={(event) => setOwnerKind(event.target.value as 'individual' | 'school')}
              className="mt-2 w-full rounded-xl border border-line bg-ground px-4 py-3"
            >
              <option value="individual">Individual</option>
              <option value="school">School</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-ink">
            Public label (optional)
            <input
              value={label}
              maxLength={120}
              onChange={(event) => setLabel(event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-ground px-4 py-3"
            />
          </label>
          <button type="submit" disabled={!selected} className="rounded-xl bg-ink px-4 py-3 font-semibold text-white disabled:opacity-50">
            Adopt for quarterly resurvey
          </button>
          {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
        </form>
      )}

      {commitments.some((commitment) => commitment.active) ? (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-ink">Your commitments</h2>
          <div className="mt-4 space-y-3">
            {commitments.filter((commitment) => commitment.active).map((commitment) => (
              <div key={commitment.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-ink">{commitment.vantage_id}</p>
                  {new Date(commitment.next_due_at).getTime() < renderedAt ? (
                    <span className="rounded-full bg-earth/10 px-2 py-1 text-xs font-semibold text-earth">Overdue</span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  Next due {new Date(commitment.next_due_at).toLocaleDateString('en-GB')}
                </p>
                <button
                  type="button"
                  onClick={() => void endCommitment(commitment.id)}
                  className="mt-3 text-sm font-semibold text-earth underline-offset-4 hover:underline"
                >
                  End commitment
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
