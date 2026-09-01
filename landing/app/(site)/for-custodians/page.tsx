import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, Download, Gauge, MapPinned } from 'lucide-react';

import { Callout, PageHero, Prose, Section, Steps } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Sākṣī — For custodians',
  description:
    'A condition report is only useful if someone responsible for the site sees it. The custodian dashboard shows coverage, time to acknowledgement, and every open report by site and status, with CSV and GeoJSON export.',
};

const features = [
  {
    Icon: Gauge,
    title: 'Coverage, and how stale it is',
    body: 'Which vantages have been resurveyed recently and which have not been photographed in months. The gaps are the point: a quest in the app is generated from this, so the places nobody is looking at are exactly where the next visitor gets sent.',
  },
  {
    Icon: ClipboardCheck,
    title: 'Median time to acknowledgement',
    body: 'How long a report waits before a person responds to it. This number is on the dashboard because it measures the institution rather than the visitors, and because a loop that quietly stops closing is the failure mode that matters most.',
  },
  {
    Icon: MapPinned,
    title: 'Every open report, by site and status',
    body: 'Acknowledge a report, mark it in progress, or resolve it with a note — from the web dashboard or from the equivalent screen in the app under Settings. The visitor who filed it sees that it was received.',
  },
  {
    Icon: Download,
    title: 'CSV and GeoJSON export',
    body: 'The record leaves in formats a GIS actually reads, so the evidence can go into whatever system already holds your inventory. Nothing is trapped here.',
  },
];

const onboarding = [
  {
    title: 'Establish the vantages',
    body: (
      <>
        A vantage is a stored position, bearing and tilt. Survey-grade
        coordinates from the responsible authority are what turn the app from a
        photo collection into a monitoring instrument, and replacing our
        approximate points with real ones is the single highest-value thing an
        institution can contribute.
      </>
    ),
  },
  {
    title: 'Name a custodian',
    body: (
      <>
        Someone who reads the reports. There is deliberately no login — a
        remembered name attached to what a device acknowledges, not an account —
        because a heritage office should not need an IT project to start
        receiving evidence.
      </>
    ),
  },
  {
    title: 'Let the visitors do the surveying',
    body: (
      <>
        Coverage accumulates from people who were going to visit anyway. Your
        cost is the attention to read what arrives; the fieldwork is already
        being paid for by tourism.
      </>
    ),
  },
];

export default function ForCustodiansPage() {
  return (
    <main>
      <PageHero
        eyebrow="For custodians"
        title="Evidence that arrives where someone can act on it"
        lede="A condition report a visitor files is worth nothing until it reaches the institution responsible for the site. The custodian surface is the half of this product that closes that loop, and it is the half we would build first if we had to start again."
      >
        <Link
          href="/custodian"
          className="mt-9 inline-flex items-center gap-3 rounded-2xl bg-earth px-6 py-4 font-semibold text-white shadow-lg shadow-earth/25 transition hover:-translate-y-0.5 hover:bg-sandstone-deep"
        >
          Open the dashboard
          <ArrowRight className="size-5" aria-hidden />
        </Link>
      </PageHero>

      <Section kicker="The dashboard" title="What it shows you">
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map(({ Icon, title, body }) => (
            <article key={title} className="rounded-3xl border border-line bg-surface p-7 shadow-sm">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-tirtha/10 text-tirtha">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 font-semibold text-ink">{title}</h3>
              <p className="mt-3 leading-relaxed text-ink-soft">{body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="deep" kicker="Getting started" title="What a deployment actually needs">
        <Steps steps={onboarding} />

        <Callout title="Why there is no login">
          The dashboard has no accounts and no password reset, and that is a
          decision rather than an omission. An acknowledgement carries a
          remembered custodian name, not an identity system. The barrier to a
          heritage office trying this should be opening a page, and the moment it
          becomes a procurement exercise most of them will never start.
        </Callout>
      </Section>

      <Section kicker="What we will not do" title="The conditions attached to the record">
        <Prose>
          <p>
            An institution is being asked to trust a record it did not produce
            itself. That trust does not survive a funder with a stake in what the
            record says, so the{' '}
            <Link href="/ethics">ethics policy</Link> makes the constraint
            explicit:{' '}
            <strong>
              no money from any commercial entity operating inside a site the app
              monitors
            </strong>{' '}
            — no hotel, tour operator, shop or restaurant in or adjoining a
            monument zone. No sponsored recommendations. Nothing a visitor
            witnesses is sold, licensed to advertisers, or repackaged as
            marketing imagery.
          </p>
          <p>
            Reports are read by custodian accounts and nothing else. Every fact
            the app states resolves to a named, checkable source, and where the
            evidence runs out the app says so rather than filling the gap.
          </p>
        </Prose>
      </Section>
    </main>
  );
}
