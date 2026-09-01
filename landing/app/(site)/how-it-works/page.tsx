import type { Metadata } from 'next';
import Link from 'next/link';
import { Crosshair, ShieldAlert, Sparkles } from 'lucide-react';

import { Callout, PageHero, Prose, Section, Steps } from '@/components/ui';
import { SURFACES } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Sākṣī — How it works',
  description:
    'A visitor stands at a fixed viewpoint, lines their phone up with it, and photographs what is there today. Years later the two photographs line up. Here is every step of that loop, and what the app records at each one.',
};

const captureSteps = [
  {
    title: 'Pick a site, then a viewpoint',
    body: (
      <>
        A <strong>vantage</strong> is not "somewhere near the stupa". It is a
        stored position, bearing and tilt — a spot on the ground and a direction
        to face. The app holds a set of them for each site, and a quest points at
        whichever one has gone longest without being revisited, rather than at
        whichever is most photographed.
      </>
    ),
  },
  {
    title: 'Line the phone up',
    body: (
      <>
        The screen scores how well your position, heading and tilt match the
        stored vantage, using GPS, compass and the motion sensors together. When
        the match is genuinely close <em>and</em> the GPS accuracy is good enough
        to trust, the frame locks. One colour in the whole app means locked, so
        it reads at a glance in daylight.
      </>
    ),
  },
  {
    title: 'Take the photograph',
    body: (
      <>
        The image is written to the phone's own storage and recorded in a
        database on the device before anything is sent anywhere. A photograph
        taken at a viewpoint on a particular day cannot be retaken, so the phone
        is the record and the network is a copy of it.
      </>
    ),
  },
  {
    title: 'Note what you can see',
    body: (
      <>
        A short condition report: what has changed, what looks damaged, what is
        missing. The app looks at the photograph and suggests cracks it thinks it
        has found, drawn as dashed outlines so nobody mistakes a suggestion for a
        finding. You decide how serious it is. The AI never does.
      </>
    ),
  },
  {
    title: 'It reaches whoever is responsible',
    body: (
      <>
        The report appears on the custodian's dashboard alongside the site's
        coverage and its median time to acknowledgement. A custodian can
        acknowledge it, mark it in progress, or resolve it with a note, and
        export the whole set as CSV or GeoJSON for a real GIS workflow.{' '}
        <Link href="/for-custodians">More on the custodian side.</Link>
      </>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <main>
      <PageHero
        eyebrow="How it works"
        title="One photograph, taken from a known spot on a known day"
        lede="Everything else in the app — the map, the history, the AI, the quests — exists to help you make, understand, act on, or care about that single thing. Here is the loop, step by step, and what the record keeps at each one."
      />

      <Section kicker="The loop" title="From standing there to a report someone acts on">
        <Steps steps={captureSteps} />
      </Section>

      <Section
        tone="deep"
        kicker="What makes it evidence"
        title="The difference between a photo album and a monitoring record"
      >
        <Prose>
          <p>
            Anybody can photograph a monument. What makes a series usable to a
            conservator is that every frame carries enough information to be
            compared with the others, and that the record is honest about how
            good that information was.
          </p>
        </Prose>

        <Callout title="A measurement is never faked" Icon={Crosshair}>
          If the GPS never got a fix, the record stores <em>unknown</em>, not
          zero. Zero would read as a perfect reading, and one such row would
          quietly poison a decade of comparisons.
        </Callout>

        <Callout title='"By eye" never dresses up as "measured"' Icon={ShieldAlert}>
          Conditions are sometimes bad — dense tree cover, a crowd, a phone with
          a confused compass. You can still frame the shot by eye and record it.
          The record then says it was done by eye, and it looks different on
          screen. A refusal to lock is a valid outcome, never an error.
        </Callout>

        <Callout title="Nothing is ever deleted" Icon={Sparkles}>
          A photograph is evidence. A mistake is corrected by adding a new record
          that says what it supersedes, never by writing over the old one. That
          is what lets somebody in ten years reconstruct not just what was seen
          but what was believed at the time.
        </Callout>
      </Section>

      <Section kicker="Where you do it" title="Three places, and only three">
        <Prose>
          <p>
            The app has exactly three destinations. They are the idea of the
            product rather than a navigation convenience, which is why there is
            no Home, no Explore, no Profile and no Rewards tab. Adding one is
            meant to require a hard decision.
          </p>
        </Prose>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {SURFACES.map(({ name, means, subtitle, body, accent, chip, rule }) => (
            <article
              key={name}
              className="relative overflow-hidden rounded-3xl border border-line bg-surface p-7 shadow-sm"
            >
              <span className={`absolute inset-x-0 top-0 h-1 ${rule}`} />
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${chip} ${accent}`}
              >
                {subtitle}
              </span>
              <h3 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
                {name}
              </h3>
              <p className="mt-1 text-sm text-ink-muted italic">{means}</p>
              <p className="mt-4 leading-relaxed text-ink-soft">{body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        tone="deep"
        kicker="Offline first"
        title="It has to work where there is no signal"
      >
        <Prose>
          <p>
            A phone in the Sacred Garden at Lumbini can go hours without a usable
            connection, and the moment you are standing at the vantage is not
            reschedulable. So every record is written to a real database on the
            phone first, and synchronised afterwards whenever a network turns up.
          </p>
          <p>
            The map works from tiles already on the device. The reference content
            — sites, viewpoints, history, narration — ships inside the app. Even
            the knowledge engine has an offline path: the built-in collection of
            source texts still answers, and an optional small model can be
            downloaded to the phone to phrase those passages, though it is never
            permitted to add a fact of its own.
          </p>
          <p>
            <strong>The network is an optimisation, not a dependency.</strong>{' '}
            Nothing about the loop above requires one.
          </p>
        </Prose>
      </Section>
    </main>
  );
}
