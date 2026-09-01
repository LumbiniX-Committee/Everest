import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Compass,
  Cpu,
  Download,
  FileText,
  Landmark,
  Navigation,
  Settings,
  ShieldCheck,
  Smartphone,
  WifiOff,
} from 'lucide-react';

import { AlignmentDial } from '@/components/AlignmentDial';
import { GreetingMonk } from '@/components/GreetingMonk';
import { MapExplorer } from '@/components/MapExplorer';
import { CountUp, Reveal } from '@/components/motion';
import { formatBuildDate, getLatestBuild } from '@/lib/eas';
import { REPORTS, SURFACES } from '@/lib/site';
import { SITES } from '@/lib/generated/explorer';

/**
 * The page re-resolves the latest EAS build on this interval, so publishing a
 * new APK updates the download button without a redeploy.
 *
 * Next parses this export statically and rejects an imported constant, so the
 * literal cannot be shared with REVALIDATE_SECONDS in lib/eas.ts. Keep the two
 * in step.
 */
export const revalidate = 300;

const vantageTotal = SITES.reduce((n, s) => n + s.vantages, 0);
const sourceTotal = SITES.reduce((n, s) => n + s.sources.length, 0);

/**
 * The map is what the product *is*; these are what make it hold up. Each one
 * exists because the explorer alone would be a guidebook, and a guidebook
 * leaves nothing behind.
 */
const identity = [
  {
    Icon: Compass,
    name: 'Wisdom that deepens as you move',
    body: 'A place speaks when you reach it, at the depth you asked for — a line, or the full record with its facts, its sources, and the canonical passages it rests on. The ladder is built from material that was already written and already cited, so more depth never means more confidence.',
    accent: 'text-tirtha',
    chip: 'bg-tirtha/10',
  },
  {
    Icon: Navigation,
    name: 'Navigation that points at the gaps',
    body: 'Routes are not generated from popularity. The next place the app sends you to is the viewpoint that has gone longest without a resurvey, or the water spout nobody has confirmed is still running. You get somewhere worth going; the record gets a reading it would not have had.',
    accent: 'text-tirtha',
    chip: 'bg-tirtha/10',
  },
  {
    Icon: ShieldCheck,
    name: 'Every reading is evidence, or says it is not',
    body: 'Standing at a marked viewpoint turns the phone into a survey instrument. It locks only when position, heading and tilt all agree and the GPS is accurate enough to mean it. Frame it by eye instead and the record says so, permanently.',
    accent: 'text-sakshi',
    chip: 'bg-sakshi/10',
  },
  {
    Icon: Cpu,
    name: 'AI that proposes and never decides',
    body: 'A damage detector runs on the handset and offers cracks as dashed outlines; a person confirms severity. The knowledge engine answers only from cited passages and refuses when the sources will not carry an answer. Neither is allowed the last word.',
    accent: 'text-dhamma',
    chip: 'bg-dhamma/10',
  },
  {
    Icon: WifiOff,
    name: 'Works where the signal does not',
    body: 'The map, the content and the knowledge base are all on the device. Every reading is written to a database on the phone before anything touches the network, because the moment you are standing there cannot be rescheduled.',
    accent: 'text-sakshi',
    chip: 'bg-sakshi/10',
  },
  {
    Icon: Landmark,
    name: 'It reaches the institution that can act',
    body: 'A report arrives on a custodian dashboard with coverage, median time to acknowledgement, and CSV and GeoJSON export for a real GIS workflow. Without that last step the rest is a very good guidebook.',
    accent: 'text-earth',
    chip: 'bg-earth/10',
  },
];

const installSteps = [
  {
    Icon: Download,
    title: 'Download the APK',
    body: 'Tap the button above on your Android device. Your browser may warn that this file type can harm your device — that notice appears for every APK, and it is safe to keep.',
  },
  {
    Icon: Settings,
    title: 'Allow installs from this source',
    body: 'Open the downloaded file. Android will offer to take you to Settings → Install unknown apps. Grant permission to whichever app you downloaded with — usually Chrome or Files.',
  },
  {
    Icon: Check,
    title: 'Install and open',
    body: 'Return to the file and tap Install. Grant camera and location when Sākṣī asks — the witness view cannot align to a vantage without them.',
  },
];

export default async function Home() {
  const build = await getLatestBuild();
  const builtOn = formatBuildDate(build.completedAt);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] bg-[radial-gradient(ellipse_at_top,rgba(200,148,50,0.18),transparent_65%)]"
        />

        <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-14 sm:pt-20">
          <div className="grid items-center gap-y-12 lg:grid-cols-[1fr_auto] lg:gap-x-16">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-1.5 text-sm font-medium text-ink-soft shadow-sm">
                <span className="size-1.5 animate-pulse rounded-full bg-dhamma" />
                Live across Lumbini and the Kathmandu Valley
              </span>

              <h1 className="mt-8 font-[family-name:var(--font-display)] text-5xl leading-[1.03] font-semibold tracking-tight text-ink sm:text-7xl">
                A living map of a<br className="hidden sm:block" /> sacred landscape
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-xl leading-relaxed text-ink-soft lg:mx-0">
                Sākṣī is a real-time map explorer for heritage sites. Walk, and
                the places you reach speak — as deeply as you asked them to, from
                sources you can check. Everything else the app does exists so
                that walking through a place also leaves a record of it behind.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <a
                  href="#explore"
                  className="inline-flex items-center gap-3 rounded-2xl bg-earth px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-earth/25 transition hover:-translate-y-0.5 hover:bg-sandstone-deep hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-earth"
                >
                  <Compass className="size-6" aria-hidden />
                  Explore the map
                </a>

                <a
                  href={build.apkUrl}
                  className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-7 py-4 text-lg font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Download className="size-5" aria-hidden />
                  Get the app
                </a>
              </div>

              <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-ink-muted lg:justify-start">
                <Smartphone className="size-4" aria-hidden />
                <span>Android 7.0 and above</span>
                <span aria-hidden>·</span>
                <span>
                  Version {build.version}
                  {build.buildNumber ? ` (build ${build.buildNumber})` : ''}
                </span>
                {builtOn ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>Built {builtOn}</span>
                  </>
                ) : null}
              </p>
            </div>

            <GreetingMonk className="h-52 sm:h-64 lg:h-[24rem]" />
          </div>
        </div>
      </section>

      {/* The explorer — the centrepiece */}
      <section id="explore" className="scroll-mt-20 border-y border-line bg-ground-deep">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <Reveal>
            <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
              The explorer
            </p>
            <h2 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
              Fifteen real places, their real coordinates, and everything they can
              say for themselves
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
              This is not a picture of the app. It is the app&rsquo;s own data —
              generated from the same seed files the phone ships with. Move the
              wisdom control and watch a place say more without ever saying
              anything it cannot source.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-10">
              <MapExplorer />
            </div>
          </Reveal>

          <Reveal delay={120}>
            <dl className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {[
                { v: SITES.length, k: 'heritage sites live', n: 'across two UNESCO regions' },
                { v: vantageTotal, k: 'established viewpoints', n: 'each a stored position, bearing and tilt' },
                { v: sourceTotal, k: 'cited records behind the content', n: 'UNESCO, survey and excavation reports' },
                { v: 3, k: 'depths a place can speak at', n: 'you choose; nothing arrives unasked' },
              ].map(({ v, k, n }) => (
                <div key={k} className="bg-surface p-6">
                  <dt className="font-[family-name:var(--font-display)] text-4xl font-semibold text-sakshi">
                    <CountUp value={v} />
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {k}
                    <span className="mt-1 block text-ink-muted">{n}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Identity */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <Reveal>
          <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
            What holds it up
          </p>
          <h2 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
            A map anyone can build. These are the parts that are ours.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Six commitments, each of which costs us something. Together they are
            the difference between an app that describes a place and one that
            can be trusted to have measured it.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {identity.map(({ Icon, name, body, accent, chip }, i) => (
            <Reveal key={name} delay={i * 60}>
              <article className="h-full rounded-3xl border border-line bg-surface p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sakshi/40 hover:shadow-lg">
                <span className={`inline-flex size-11 items-center justify-center rounded-2xl ${chip} ${accent}`}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl leading-snug font-semibold text-ink">
                  {name}
                </h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Alignment demo */}
      <section className="border-y border-line bg-ground-deep">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <Reveal>
            <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
              Try the mechanic
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
              What turns a photograph into a measurement
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
              Drag onto the stored viewpoint and the frame locks. Then switch the
              GPS off with the alignment still perfect — and watch it refuse. The
              tolerances below are the real ones the app ships with.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-10">
              <AlignmentDial />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Surfaces */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <Reveal>
          <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
            Three places, and only three
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
            The whole app, on one screen of navigation
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {SURFACES.map(({ name, means, subtitle, body, accent, chip, rule }, i) => (
            <Reveal key={name} delay={i * 70}>
              <article className="relative h-full overflow-hidden rounded-3xl border border-line bg-surface p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <span className={`absolute inset-x-0 top-0 h-1 ${rule}`} />
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${chip} ${accent}`}>
                  {subtitle}
                </span>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
                  {name}
                </h3>
                <p className="mt-1 text-sm text-ink-muted italic">{means}</p>
                <p className="mt-4 leading-relaxed text-ink-soft">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why it matters */}
      <section className="border-y border-line bg-ground-deep">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <Reveal>
            <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
              Why this exists
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
              The monitoring gap is not a data problem. It is a presence problem.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              A 2025 assessment found 80% of World Cultural Heritage sites under
              climate stress, and 98% hit by at least one climate-related extreme
              since 2000. UNESCO has built a live monitoring platform pulling in
              more than forty datasets. Satellites can say a site is{' '}
              <em>exposed</em>. Only somebody standing in front of the wall can
              say whether the wall has moved — and heritage offices cannot afford
              a surveyor in front of every wall, every month, forever.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              <strong className="font-semibold text-ink">
                Meanwhile a million people a year walk past those walls with a
                phone in their hand.
              </strong>{' '}
              Sākṣī turns that flow into the fieldwork nobody has budget for.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <dl className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {[
                { v: 1.17, dp: 2, suffix: 'M', k: 'visitors to Lumbini in 2024', n: '+17% on the year before' },
                { v: 80, suffix: '%', k: 'of World Cultural Heritage sites under climate stress' },
                { v: 624.6, dp: 1, prefix: '$', suffix: 'B', k: 'heritage tourism market, 2025', n: 'the channel, not the buyer' },
                { v: 0, k: 'accounts or logins required to contribute' },
              ].map(({ v, dp, prefix, suffix, k, n }) => (
                <div key={k} className="bg-surface p-6">
                  <dt className="font-[family-name:var(--font-display)] text-4xl font-semibold text-sakshi">
                    <CountUp value={v} decimals={dp} prefix={prefix} suffix={suffix} />
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {k}
                    {n ? <span className="mt-1 block text-ink-muted">{n}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-6 text-sm text-ink-muted">
              Sources, the competitive landscape, and the full argument are in the{' '}
              <Link
                href="/research"
                className="underline decoration-line underline-offset-4 transition hover:text-ink"
              >
                research report
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      {/* Custodians */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <Reveal>
          <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
            Closing the loop
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
            A report nobody reads is not evidence
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">
            The custodian dashboard shows coverage, median time to
            acknowledgement, and every open report by site and status, with CSV
            and GeoJSON export for a real GIS workflow. A custodian can
            acknowledge a report, mark it in progress, or resolve it with a note
            — from the web, or from the app. There is deliberately no login,
            because a heritage office should not need an IT project to start
            receiving evidence.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/for-custodians"
              className="inline-flex items-center gap-2 rounded-2xl bg-earth px-6 py-3.5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sandstone-deep"
            >
              For custodians
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/custodian"
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-6 py-3.5 font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Open the dashboard
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Reports */}
      <section className="border-t border-line bg-ground-deep">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <Reveal>
            <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
              Read further
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
              The long-form case, in two documents
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[REPORTS.techStack, REPORTS.research].map(({ href, title, pages, blurb }, i) => (
              <Reveal key={href} delay={i * 70}>
                <a
                  href={href}
                  className="flex h-full flex-col rounded-3xl border border-line bg-surface p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-sakshi/10 text-sakshi">
                    <FileText className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
                    {title}
                  </h3>
                  <p className="mt-3 grow leading-relaxed text-ink-soft">{blurb}</p>
                  <p className="mt-5 text-sm font-semibold text-earth">PDF · {pages} pages</p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Install */}
      <section id="download" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-sandstone/15 text-sandstone-deep">
              <ShieldCheck className="size-6" aria-hidden />
            </span>
            <h2 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-semibold text-ink">
              Installing the APK
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-ink-soft">
              Sākṣī is distributed directly rather than through the Play Store,
              so Android needs your permission once before it will install.
            </p>

            <a
              href={build.apkUrl}
              className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-earth px-8 py-4 font-semibold text-white shadow-lg shadow-earth/25 transition hover:-translate-y-0.5 hover:bg-sandstone-deep"
            >
              <Download className="size-5" aria-hidden />
              Download the APK
            </a>
          </div>

          <ol className="mt-12 space-y-4">
            {installSteps.map(({ Icon, title, body }, i) => (
              <li
                key={title}
                className="flex gap-5 rounded-2xl border border-line bg-surface p-6 shadow-sm"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-sandstone-deep">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold text-ink">
                    <span className="mr-2 text-ink-muted tabular-nums">{i + 1}.</span>
                    {title}
                  </h3>
                  <p className="mt-1.5 leading-relaxed text-ink-soft">{body}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-8 text-center text-sm text-ink-muted">
            Enabling &ldquo;Install from Unknown Sources&rdquo; applies only to the
            app you grant it to, and you can revoke it in Settings afterwards.
          </p>
        </div>
      </section>
    </main>
  );
}
