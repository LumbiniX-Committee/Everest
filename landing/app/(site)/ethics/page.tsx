import type { Metadata } from 'next';
import Link from 'next/link';
import { Ban, Camera, HandCoins, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sākṣī — Ethics policy',
  description:
    'What Sākṣī will not do: no commercial funding from a site it monitors, no sponsored recommendations, no selling what a visitor witnesses.',
};

const commitments = [
  {
    Icon: HandCoins,
    title: 'No money from a site we monitor',
    body: 'We do not accept funding, in kind or in cash, from any commercial entity operating within a site Sākṣī monitors — a hotel, tour operator, shop, or restaurant inside or adjoining a monument zone. A conservation record has to be trusted by the institution reading it, and that trust does not survive a sponsor with a stake in what the record says.',
  },
  {
    Icon: Ban,
    title: 'No sponsored recommendations',
    body: 'The app will not carry coupons, sponsored listings, or paid placement of any kind — not for a restaurant, not for a guide, not for a shop. What a quest sends you toward is decided by where the record is thin, never by who paid for the mention.',
  },
  {
    Icon: Camera,
    title: 'What you witness stays evidence, not inventory',
    body: 'Photographs and condition reports exist to build a monitoring record for the institution responsible for a site. They are not sold, licensed to advertisers, or repackaged as marketing imagery. Custodian accounts can read and act on reports; nothing else reads them.',
  },
  {
    Icon: ShieldCheck,
    title: 'Attribution before invention',
    body: 'Every fact the app states, in the Dhamma engine or on a site page, resolves to a named, checkable source. Where the evidence runs out, the app says so rather than filling the gap — a reconstruction is always labelled as one, and a claim with nowhere to point is not shown at all.',
  },
];

export default function EthicsPage() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-24 sm:pt-24">
        <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
          Ethics
        </p>

        <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          What Sākṣī will not do
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
          Sākṣī asks an institution to trust a record it did not produce itself.
          That only works if the record cannot be bought. This is what we have
          committed not to do, stated plainly rather than left implied.
        </p>

        <div className="mt-14 space-y-6">
          {commitments.map(({ Icon, title, body }) => (
            <article
              key={title}
              className="flex gap-5 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-sandstone-deep">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold text-ink">{title}</h2>
                <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-14 text-sm leading-relaxed text-ink-muted">
          This policy covers the project as it stands today. If a paid
          institutional licence or grant is ever taken on, it will be
          disclosed here, and it will never come from a commercial operator
          inside a site we monitor.
        </p>

        <p className="mt-8 text-sm">
          <Link
            href="/for-custodians"
            className="font-semibold text-earth underline underline-offset-4"
          >
            What this means for an institution deploying Sākṣī →
          </Link>
        </p>
      </section>
    </main>
  );
}
