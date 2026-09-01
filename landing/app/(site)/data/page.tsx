import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Database, FileJson, Sheet } from 'lucide-react';

import { PageHero, Prose, Section } from '@/components/ui';
import { REPO_URL } from '@/lib/site';
import manifest from '@/public/data/manifest.json';

export const metadata: Metadata = {
  title: 'Sākṣī — Open data',
  description:
    'The heritage site register and its established photographic vantages, as GeoJSON and CSV, with coordinate provenance carried on every record. Built for a GIS, not for a screenshot.',
};

const files = [
  {
    Icon: FileJson,
    name: 'sites.geojson',
    what: 'Every site as a point feature, with region, zone, period, photography policy, viewpoint count and its cited sources.',
  },
  {
    Icon: Sheet,
    name: 'sites.csv',
    what: 'The same register as a spreadsheet, RFC 4180 and UTF-8, for anyone who is not opening a GIS today.',
  },
  {
    Icon: FileJson,
    name: 'vantages.geojson',
    what: 'The established photographic viewpoints: position, bearing, pitch, field of view, and the tolerances the app accepts an alignment within.',
  },
  {
    Icon: Database,
    name: 'manifest.json',
    what: 'What each file contains, when it was generated, the coordinate reference system, and the caveats that travel with it.',
  },
];

export default function DataPage() {
  return (
    <main>
      <PageHero
        eyebrow="Open data"
        title="The register, in a format a GIS actually reads"
        lede="Heritage inventory platforms are systems of record that wait to be fed. Saying Sākṣī should feed them is a promise until the data can leave without anyone having to ask, so here it is — coordinates, viewpoints, provenance and sources, regenerated from the same seed files the app ships with."
      />

      <Section kicker="The files" title="Four downloads, no registration">
        <div className="mt-8 space-y-4">
          {files.map(({ Icon, name, what }) => (
            <a
              key={name}
              href={`/data/${name}`}
              className="flex items-start gap-5 rounded-3xl border border-line bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tirtha/10 text-tirtha">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-mono text-sm font-semibold text-ink">{name}</span>
                <span className="mt-1.5 block leading-relaxed text-ink-soft">{what}</span>
              </span>
            </a>
          ))}
        </div>

        <dl className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
          {[
            { v: manifest.counts.sites, k: 'heritage sites' },
            {
              v: manifest.counts.sites_with_checked_coordinates,
              k: 'with coordinates checked against a gazetteer',
            },
            { v: manifest.counts.established_vantages, k: 'established viewpoints' },
          ].map(({ v, k }) => (
            <div key={k} className="bg-surface p-6">
              <dt className="font-[family-name:var(--font-display)] text-4xl font-semibold text-sakshi tabular-nums">
                {v}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-soft">{k}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 font-mono text-sm text-ink-muted">
          version {manifest.version} · {manifest.crs}
        </p>
      </Section>

      <Section tone="deep" kicker="Read this first" title="What the data does not claim">
        <Prose>
          <p>
            The same rule that governs the app governs the export:{' '}
            <strong>provenance travels with the measurement.</strong> Five of the
            fifteen sites carry a coordinate read off a document and never
            checked against a gazetteer. Those are exported with{' '}
            <code className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-sm">
              surveyed: false
            </code>
            , not quietly rounded into looking like a survey.
          </p>
        </Prose>

        <div className="mt-8 space-y-3">
          {manifest.caveats.map((c) => (
            <div
              key={c}
              className="flex gap-4 rounded-2xl border border-line border-l-4 border-l-earth bg-surface p-5"
            >
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-earth" aria-hidden />
              <p className="leading-relaxed text-ink-soft">{c}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="Licence" title="Not yet declared, and said so plainly">
        <Prose>
          <p>
            The project has not settled a licence, and inventing one on this page
            would be the export asserting something its own source does not.{' '}
            <code className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-sm">
              licence
            </code>{' '}
            in the manifest is therefore <code className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-sm">null</code>, and it will
            stay that way until there is a real answer.
          </p>
          <p>
            What can be said now: coordinates marked{' '}
            <code className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-sm">osm</code>{' '}
            derive from OpenStreetMap and carry ODbL obligations, every record
            names the sources behind it, and third-party media shipped with the
            app is itemised in{' '}
            <a href={`${REPO_URL}/blob/main/LICENCES.md`}>LICENCES.md</a>. If you
            want to redistribute this, talk to the maintainers first — that is a
            conversation we want to have, not a barrier.
          </p>
          <p>
            If you are a custodial institution, the{' '}
            <Link href="/for-custodians">custodian dashboard</Link> exports live
            condition reports on the same terms, and{' '}
            <Link href="/research">the research report</Link> sets out why we
            think this belongs in your inventory rather than in ours.
          </p>
        </Prose>
      </Section>
    </main>
  );
}
