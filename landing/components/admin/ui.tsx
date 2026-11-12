'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

import { STATUS_LABEL, type ReportStatus, type WeeklyPoint } from '@/lib/adminApi';

export function PageHeader({
  title,
  description,
  actions,
  loadedAt,
  onRefresh,
  loading,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  loadedAt?: Date | null;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-[family-name:var(--font-display)] text-[2rem] leading-tight font-semibold text-ink">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-ink-soft">{description}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink-soft hover:bg-surface-secondary disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden />
            <span className="tabular">{loadedAt ? `Updated ${loadedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Refresh'}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function Panel({ title, description, action, children, className = '' }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-surface ${className}`}>
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** A headline number. The change is against the previous window of the same length, and says so. */
export function StatTile({ label, value, previous, hint, tone = 'plain', href }: { label: string; value: number | string; previous?: number; hint?: string; tone?: 'plain' | 'alert'; href?: string }) {
  const numeric = typeof value === 'number' ? value : null;
  const delta = numeric != null && previous != null ? numeric - previous : null;
  const body = (
    <>
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p className={`mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tabular ${tone === 'alert' ? 'text-robe' : 'text-ink'}`}>
        {typeof value === 'number' ? value.toLocaleString('en-GB') : value}
      </p>
      <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 text-sm text-ink-muted">
        {delta != null ? (
          <span className={`inline-flex items-center gap-0.5 font-medium ${delta === 0 ? '' : delta > 0 ? 'text-tirtha' : 'text-ink-soft'}`}>
            {delta > 0 ? <ArrowUpRight className="size-4" aria-hidden /> : delta < 0 ? <ArrowDownRight className="size-4" aria-hidden /> : null}
            {delta === 0 ? 'No change' : `${delta > 0 ? '+' : ''}${delta.toLocaleString('en-GB')}`}
          </span>
        ) : null}
        {hint ? <span>{hint}</span> : null}
      </div>
    </>
  );
  const frame = `block rounded-xl border p-5 ${tone === 'alert' ? 'border-robe/30 bg-robe/[0.04]' : 'border-line bg-surface'}`;
  return href ? (
    <Link href={href} className={`${frame} transition-colors hover:border-sandstone/50`}>
      {body}
    </Link>
  ) : (
    <div className={frame}>{body}</div>
  );
}

const STATUS_STYLE: Record<ReportStatus, string> = {
  open: 'bg-robe/10 text-robe',
  acknowledged: 'bg-sandstone/10 text-sandstone-deep',
  in_progress: 'bg-sandstone/10 text-sandstone-deep',
  resolved: 'bg-tirtha/12 text-tirtha',
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium whitespace-nowrap ${STATUS_STYLE[status]}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Notice({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${kind === 'error' ? 'border-robe/30 bg-robe/5 text-robe' : 'border-tirtha/30 bg-tirtha/5 text-tirtha'}`}
    >
      {kind === 'error' ? <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> : <Check className="mt-0.5 size-4 shrink-0" aria-hidden />}
      <div>{children}</div>
    </div>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <p className="flex items-center gap-2 py-10 text-ink-muted">
      <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> {label}
    </p>
  );
}

export function Forbidden() {
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <ShieldCheck className="mx-auto size-10 text-sandstone-deep" aria-hidden />
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">Not an admin account</h1>
      <p className="mt-3 text-ink-soft">
        This account is signed in but is not a platform admin. Site custodians use the{' '}
        <Link className="font-semibold text-sandstone-deep underline underline-offset-4" href="/custodian">custodian portal</Link>.
      </p>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-surface-secondary/60 px-4 py-6 text-center text-ink-muted">{children}</p>;
}

/**
 * One series of weekly counts as bars. One series, so no legend: the title
 * names it. Bars start at zero, weeks with nothing show a hairline stub, and
 * each bar has a hover and focus tooltip; the table view carries the numbers.
 */
export function WeeklyBars({ title, points, field }: { title: string; points: WeeklyPoint[]; field: keyof Omit<WeeklyPoint, 'week'> }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const values = points.map((point) => Number(point[field]) || 0);
  const max = Math.max(1, ...values);
  const total = values.reduce((sum, value) => sum + value, 0);
  const W = 360;
  const H = 140;
  const gap = 4;
  const bar = (W - gap * (values.length - 1)) / Math.max(1, values.length);
  const label = (week: string) => new Date(week).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <figure className="min-w-0">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-ink">{title}</span>
        <span className="text-sm text-ink-muted tabular">{`${total.toLocaleString('en-GB')} in ${values.length} weeks`}</span>
      </figcaption>
      {table ? (
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-ink-muted">
            <tr>
              <th className="py-1 font-medium">Week of</th>
              <th className="py-1 text-right font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point, i) => (
              <tr key={point.week} className="border-t border-line/70">
                <td className="py-1">{label(point.week)}</td>
                <td className="py-1 text-right">{values[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative mt-3">
          <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label={`${title}, weekly, ${total} in all`}>
            <line x1="0" x2={W} y1={H} y2={H} className="stroke-line" strokeWidth="1" />
            {values.map((value, i) => {
              const h = value === 0 ? 1.5 : Math.max(3, (value / max) * (H - 8));
              const x = i * (bar + gap);
              return (
                <g key={points[i].week}>
                  <rect
                    x={x}
                    y={H - h}
                    width={bar}
                    height={h}
                    rx={Math.min(4, bar / 2)}
                    className={hover === i ? 'fill-sandstone-deep' : value === 0 ? 'fill-line' : 'fill-sandstone'}
                  />
                  <rect
                    x={x - gap / 2}
                    y={0}
                    width={bar + gap}
                    height={H}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`Week of ${label(points[i].week)}: ${value}`}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    className="cursor-default outline-none"
                  />
                </g>
              );
            })}
            <text x="0" y={H + 14} className="fill-ink-muted text-[10px]">{points[0] ? label(points[0].week) : ''}</text>
            <text x={W} y={H + 14} textAnchor="end" className="fill-ink-muted text-[10px]">This week</text>
          </svg>
          {hover != null ? (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white tabular"
              style={{ left: `${((hover * (bar + gap) + bar / 2) / W) * 100}%` }}
            >
              {`Week of ${label(points[hover].week)} · ${values[hover]}`}
            </div>
          ) : null}
        </div>
      )}
      <button type="button" onClick={() => setTable((on) => !on)} className="mt-2 text-sm font-medium text-sandstone-deep underline-offset-4 hover:underline">
        {table ? 'Show chart' : 'Show as table'}
      </button>
    </figure>
  );
}

export const inputClass =
  'h-10 rounded-lg border border-line bg-surface px-3 text-[0.95rem] text-ink placeholder:text-ink-muted/70 focus:border-sandstone focus:outline-none focus:ring-2 focus:ring-sandstone/20';
export const primaryButton =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sandstone px-4 text-sm font-semibold text-white hover:bg-sandstone-deep disabled:cursor-not-allowed disabled:opacity-50';
export const quietButton =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink-soft hover:bg-surface-secondary disabled:opacity-50';
