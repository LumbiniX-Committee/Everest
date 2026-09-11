'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type PublicCondition = {
  site_id: string;
  name: { en: string; ne: string | null };
  window_days: number;
  coverage_pct: number;
  vantages_total: number;
  vantages_surveyed: number;
  vantages: Array<{ id: string; last_survey_at: string | null }>;
  conditions: Array<{
    category: string;
    subtype: string | null;
    severity: string;
    reported_at: string;
    status: string;
    status_changed_at: string;
    history: Array<{ status: string; changed_at: string }>;
  }>;
};

export default function PublicConditionPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [days, setDays] = useState<30 | 90 | 365>(90);
  const [summary, setSummary] = useState<PublicCondition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/public/sites/${encodeURIComponent(siteId)}/condition?days=${days}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Condition history is unavailable.');
        return response.json() as Promise<PublicCondition>;
      })
      .then((nextSummary) => {
        setError(null);
        setSummary(nextSummary);
      })
      .catch((loadError) => {
        if ((loadError as Error).name !== 'AbortError') setError((loadError as Error).message);
      });
    return () => controller.abort();
  }, [days, siteId]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-semibold tracking-wide text-sakshi uppercase">Public condition record</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold text-ink">
        {summary?.name.en ?? 'Heritage site'}
      </h1>
      {summary?.name.ne ? <p className="mt-1 text-lg text-ink-soft">{summary.name.ne}</p> : null}
      <p className="mt-4 max-w-2xl text-ink-soft">
        This page publishes aggregate survey coverage and custodian-acknowledged conditions only.
        Visitor identities, notes, exact coordinates and private photographs are never shown.
      </p>

      <label className="mt-8 inline-flex items-center gap-3 text-sm text-ink-soft">
        Reporting window
        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value) as 30 | 90 | 365)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-ink"
        >
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>365 days</option>
        </select>
      </label>

      {error ? <p className="mt-8 rounded-xl bg-earth/10 p-4 text-earth">{error}</p> : null}
      {summary ? (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <Metric label="Coverage" value={`${summary.coverage_pct}%`} />
            <Metric label="Surveyed vantages" value={`${summary.vantages_surveyed} / ${summary.vantages_total}`} />
            <Metric label="Acknowledged conditions" value={String(summary.conditions.length)} />
          </section>

          <section className="mt-12">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">Vantage coverage</h2>
            <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
              {summary.vantages.map((vantage) => (
                <div key={vantage.id} className="flex justify-between gap-4 px-5 py-4 text-sm">
                  <span className="font-medium text-ink">{vantage.id}</span>
                  <span className="text-ink-muted">
                    {vantage.last_survey_at
                      ? new Date(vantage.last_survey_at).toLocaleDateString('en-GB')
                      : 'No survey recorded'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">Condition history</h2>
            <div className="mt-4 space-y-3">
              {summary.conditions.length ? summary.conditions.map((condition, index) => (
                <article key={`${condition.reported_at}-${condition.category}-${index}`} className="rounded-2xl border border-line bg-surface p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-ink">
                      {condition.category}{condition.subtype ? ` · ${condition.subtype}` : ''}
                    </p>
                    <span className="rounded-full bg-sakshi/10 px-3 py-1 text-xs font-semibold text-sakshi">
                      {condition.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">
                    Severity {condition.severity} · reported {new Date(condition.reported_at).toLocaleDateString('en-GB')}
                    {' · '}status updated {new Date(condition.status_changed_at).toLocaleDateString('en-GB')}
                  </p>
                  <ol className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
                    {condition.history.map((event) => (
                      <li key={`${event.status}-${event.changed_at}`} className="rounded-full bg-ground-deep px-2.5 py-1">
                        {event.status.replace('_', ' ')} · {new Date(event.changed_at).toLocaleDateString('en-GB')}
                      </li>
                    ))}
                  </ol>
                </article>
              )) : <p className="text-ink-muted">No custodian-acknowledged conditions in this window.</p>}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}
