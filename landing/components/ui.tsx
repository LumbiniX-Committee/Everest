import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * The handful of shapes every content page on this site repeats. Kept small on
 * purpose: a component earns its place here once a third page needs it, not
 * before.
 */

export function PageHero({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-[radial-gradient(ellipse_at_top,rgba(200,148,50,0.14),transparent_65%)]"
      />
      <div className="relative mx-auto max-w-4xl px-6 pt-16 pb-16 sm:pt-24">
        <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed text-ink-soft">{lede}</p>
        {children}
      </div>
    </section>
  );
}

export function Section({
  id,
  title,
  kicker,
  children,
  tone = 'ground',
}: {
  id?: string;
  title?: string;
  kicker?: string;
  children: ReactNode;
  tone?: 'ground' | 'deep';
}) {
  return (
    <section
      id={id}
      className={
        tone === 'deep' ? 'border-y border-line bg-ground-deep' : undefined
      }
    >
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        {kicker ? (
          <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
            {kicker}
          </p>
        ) : null}
        {title ? (
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
            {title}
          </h2>
        ) : null}
        <div className={title || kicker ? 'mt-8' : undefined}>{children}</div>
      </div>
    </section>
  );
}

/** Body copy at a readable measure. Paragraphs are spaced, not indented. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-5 text-lg leading-relaxed text-ink-soft [&_a]:text-earth [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-ink">
      {children}
    </div>
  );
}

export function Callout({
  title,
  children,
  Icon,
}: {
  title: string;
  children: ReactNode;
  Icon?: LucideIcon;
}) {
  // An accent rule down the left edge: without it, a callout sitting under a
  // list of cards reads as one more item in the list rather than as an aside
  // about them.
  return (
    <div className="mt-8 flex gap-5 rounded-3xl border border-line border-l-4 border-l-sakshi bg-surface p-7 shadow-sm">
      {Icon ? (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sakshi/10 text-sakshi">
          <Icon className="size-5" aria-hidden />
        </span>
      ) : null}
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        <div className="mt-2 leading-relaxed text-ink-soft">{children}</div>
      </div>
    </div>
  );
}

/** A numbered step in a sequence the reader is meant to follow in order. */
export function Steps({
  steps,
}: {
  steps: { title: string; body: ReactNode }[];
}) {
  return (
    <ol className="mt-8 space-y-4">
      {steps.map(({ title, body }, i) => (
        <li
          key={title}
          className="flex gap-5 rounded-2xl border border-line bg-surface p-6 shadow-sm"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary font-[family-name:var(--font-display)] text-lg font-semibold text-sandstone-deep">
            {i + 1}
          </span>
          <div>
            <h3 className="font-semibold text-ink">{title}</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Figures({
  items,
}: {
  items: { value: string; label: string; note?: string }[];
}) {
  return (
    <dl className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ value, label, note }) => (
        <div key={label} className="bg-surface p-6">
          <dt className="font-[family-name:var(--font-display)] text-4xl font-semibold text-sakshi">
            {value}
          </dt>
          <dd className="mt-2 text-sm leading-relaxed text-ink-soft">
            {label}
            {note ? <span className="mt-1 block text-ink-muted">{note}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A two-column claim: what a thing is, set against what it costs or refuses.
 * Used wherever the honest version of a statement is the second half of it.
 */
export function Ledger({
  rows,
  headings,
}: {
  rows: { left: ReactNode; right: ReactNode }[];
  headings: [string, string];
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
        <p className="bg-surface-secondary px-6 py-3 text-sm font-semibold tracking-wide text-ink-muted uppercase">
          {headings[0]}
        </p>
        <p className="hidden bg-surface-secondary px-6 py-3 text-sm font-semibold tracking-wide text-ink-muted uppercase sm:block">
          {headings[1]}
        </p>
        {rows.map((row, i) => (
          <div key={i} className="contents">
            <div className="bg-surface px-6 py-5 leading-relaxed text-ink">{row.left}</div>
            <div className="bg-surface px-6 py-5 leading-relaxed text-ink-soft">{row.right}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
