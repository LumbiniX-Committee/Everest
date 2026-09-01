import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';

import { Figures, Ledger, PageHero, Prose, Section } from '@/components/ui';
import { REPORTS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Sākṣī — Research',
  description:
    'Repeat photography and volunteer data quality are settled science. Heritage damage detection and grounded generation are two years old. Here is what the literature supports, what it warns about, and where Sākṣī sits among the alternatives.',
};

const segments = [
  {
    name: 'Photo-monitoring citizen science',
    who: 'Chronolog · rePhotoSA · Zooniverse · iNaturalist',
    holds: 'Visitors really do produce usable image series at scale.',
    gap: 'Environmental rather than heritage, aligned by a fixed bracket rather than a sensor, and nothing downstream: the output is a time-lapse, not a report that reaches whoever is responsible for the site.',
  },
  {
    name: 'Heritage inventory platforms',
    who: 'Arches (Getty Conservation Institute and World Monuments Fund) · CollectiveAccess · CollectionSpace',
    holds: 'The institutional record of a site lives here, and Arches is very good at it.',
    gap: 'These systems do not acquire. Arches waits for a professional survey to be entered into it. This is a partner, not a rival — the right long-run posture is that Sākṣī feeds it.',
  },
  {
    name: 'Field data capture and mobile GIS',
    who: 'Esri Field Maps and Survey123 · Fulcrum · KoboToolbox · ODK',
    holds: 'Capable, general-purpose tools a heritage office would otherwise buy.',
    gap: 'Priced per seat, which structurally forbids the public from contributing, and with no concept of a vantage: they record where you were, not whether you stood where the last photograph was taken from.',
  },
  {
    name: 'Visitor engagement and interpretation',
    who: 'Smartify · Bloomberg Connects · Google Arts & Culture · CyArk',
    holds: 'Where the funding in this space actually is, and at real scale.',
    gap: 'Interpretation flows one way. The visitor is an audience, and the site gets no information about its own condition from having been visited.',
  },
];

export default function ResearchPage() {
  return (
    <main>
      <PageHero
        eyebrow="Research"
        title="What the evidence supports, and what it warns about"
        lede="Sākṣī claims that ordinary visitors, given a fixed viewpoint and an honest instrument, can produce a monitoring record a conservator will use. That breaks into four separable claims, and the literature answers each of them differently."
      >
        <Link
          href={REPORTS.research.href}
          className="mt-9 inline-flex items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-4 font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <FileText className="size-5 text-sakshi" aria-hidden />
          Read the research and market report
          <span className="text-sm font-normal text-ink-muted">
            PDF · {REPORTS.research.pages} pages · 37 sources
          </span>
        </Link>
      </PageHero>

      <Section kicker="Foundations" title="The method is inherited, not invented">
        <Prose>
          <p>
            Repeat photography — returning to a fixed viewpoint and taking the
            same frame again — has been used in landscape and heritage science
            for well over a century, and there is now a heritage-specific review
            literature covering the whole chain: image registration, archival
            organisation, presentation of the comparison, and the conservation of
            rephotographic collections in their own right.
          </p>
          <p>
            The question every institution asks first is whether non-experts
            produce data worth having. It has been answered quantitatively, most
            durably by the Snapshot Serengeti analysis:{' '}
            <strong>
              aggregated volunteer classifications agreed with expert-verified
              data on 98% of images
            </strong>
            , and 90% of images were correctly classified with just five
            volunteers each — while accuracy fell for rare cases, which carried
            higher false-positive and false-negative rates.
          </p>
        </Prose>

        <Figures
          items={[
            { value: '98%', label: 'Volunteer consensus agreement with expert-verified data', note: 'Snapshot Serengeti' },
            { value: '5', label: 'Volunteers per image needed for 90% correct classification' },
            { value: '2M+', label: 'Registered volunteers across the Zooniverse platform' },
            { value: '~100k', label: 'Volunteer classifications submitted per day, platform-wide' },
          ]}
        />

        <Prose>
          <p className="mt-8">
            Three design consequences follow, and all three are in the product:{' '}
            <strong>redundancy at the vantage</strong>, because several observers
            per viewpoint beat one expert; <strong>uncertainty carried on the
            record</strong>, because volunteer data is reliable in aggregate and
            has to be able to say when it is not; and{' '}
            <strong>attention to the rare case</strong>, because the unusual
            condition — the one actually worth reporting — is exactly where
            non-expert accuracy is weakest, and therefore the one place a
            custodian's confirmation is mandatory rather than optional.
          </p>
        </Prose>
      </Section>

      <Section
        tone="deep"
        kicker="Recent work"
        title="Where the technical risk actually is"
      >
        <Ledger
          headings={['The area', 'What the 2023–2026 literature says']}
          rows={[
            {
              left: 'Damage detection on heritage surfaces',
              right: (
                <>
                  A 2026 systematic review covers 26 papers from 2020–2025;
                  attention-augmented U-Net variants and the YOLO family are the
                  settled architectures, with on-device deployments reported at
                  Italian and Cappadocian sites.{' '}
                  <strong>
                    The open problem is generalisation across materials
                  </strong>
                  : brick, coursed stone, lime plaster and eroded sandstone do
                  not share a crack morphology. That is the strongest argument
                  for the rule that the detector proposes and a person disposes.
                </>
              ),
            },
            {
              left: 'Digital twins and HBIM',
              right: (
                <>
                  A scoping review of 204 studies finds the field settling on
                  laser scanning, UAV photogrammetry, BIM and sensor networks —
                  a capital-intensive stack that produces exquisite geometry at
                  intervals of years.{' '}
                  <strong>
                    Sākṣī is the sampling layer beneath a twin, not a competitor
                    to it
                  </strong>
                  : dense, dated, pose-tagged visitor photographs are exactly
                  what photogrammetry-driven change monitoring consumes.
                </>
              ),
            },
            {
              left: 'Grounded generation',
              right: (
                <>
                  Faithfulness became measurable between 2024 and 2026 — RAGTruth
                  supplies ~18,000 span-labelled examples, and public
                  leaderboards now track hallucination rates directly. The
                  uncomfortable finding is that{' '}
                  <strong>
                    models still introduce unsupported statements even with the
                    correct context in front of them
                  </strong>
                  , which is why retrieving is not the same as being grounded,
                  and why the verify-then-refuse step is not optional.
                </>
              ),
            },
            {
              left: 'Running models on a phone',
              right: (
                <>
                  Reviews of mobile inference converge on the same conclusion the
                  build reached in practice, and models in the 1–4 billion
                  parameter range are now credible for constrained tasks — which
                  is exactly the task assigned here: rephrasing a retrieved
                  passage, never asserting a fact.
                </>
              ),
            },
          ]}
        />
      </Section>

      <Section kicker="The field" title="Four neighbours, and the gap between them">
        <Prose>
          <p>
            There is no direct competitor. There are four well-populated adjacent
            categories, each of which owns one link in the chain that runs from a
            visitor's attention, through positioned evidence, to institutional
            action — and each of which stops before the next.
          </p>
        </Prose>

        <div className="mt-8 space-y-4">
          {segments.map(({ name, who, holds, gap }) => (
            <article
              key={name}
              className="rounded-3xl border border-line border-t-2 border-t-sakshi bg-surface p-7 shadow-sm"
            >
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
                {name}
              </h3>
              <p className="mt-1 text-sm text-ink-muted">{who}</p>
              <p className="mt-4 leading-relaxed text-ink-soft">{holds}</p>
              <p className="mt-3 leading-relaxed text-ink-soft">
                <span className="mr-2 text-sm font-semibold tracking-wide text-earth uppercase">
                  The gap
                </span>
                {gap}
              </p>
            </article>
          ))}
        </div>

        <Prose>
          <p className="mt-8">
            <strong>Nothing in the survey spans all three links.</strong> The two
            capabilities that make spanning them possible — sensor-verified
            alignment to a stored vantage, and a custodian surface that
            acknowledges and closes a report — are precisely the two the adjacent
            categories each lack. The defensible position is not a feature; it is
            the loop.
          </p>
        </Prose>
      </Section>

      <Section tone="deep" kicker="Urgency" title="The demand side is no longer speculative">
        <Figures
          items={[
            { value: '80%', label: 'of World Cultural Heritage sites under climate stress', note: '2025 assessment' },
            { value: '98%', label: 'have faced at least one climate-related extreme since 2000' },
            { value: '~73%', label: 'at high risk from water-related hazards', note: 'UNESCO, July 2025' },
            { value: '19%', label: 'built substantially of threatened materials such as stone and wood' },
          ]}
        />

        <Prose>
          <p className="mt-8">
            UNESCO has since launched a live monitoring platform integrating more
            than forty datasets with near-real-time alerts. That is the single
            most encouraging signal in this research, and it is worth stating
            plainly:{' '}
            <strong>
              the institutions have built the dashboard and are short of the
              ground truth to fill it.
            </strong>{' '}
            Satellite and climate-model data can say a site is exposed. Only
            someone standing in front of the wall can say whether the wall has
            moved.
          </p>
        </Prose>
      </Section>
    </main>
  );
}
