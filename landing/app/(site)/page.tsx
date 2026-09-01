import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Compass,
  Download,
  FileText,
  Settings,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

import { GreetingMonk } from '@/components/GreetingMonk';
import { Figures } from '@/components/ui';
import { formatBuildDate, getLatestBuild } from '@/lib/eas';
import { REPORTS, SURFACES } from '@/lib/site';

/**
 * The page re-resolves the latest EAS build on this interval, so publishing a
 * new APK updates the download button without a redeploy.
 *
 * Next parses this export statically and rejects an imported constant, so the
 * literal cannot be shared with REVALIDATE_SECONDS in lib/eas.ts. Keep the two
 * in step.
 */
export const revalidate = 300;

const loop = [
  { step: 'Stand at a fixed viewpoint', detail: 'A stored position, bearing and tilt — not "somewhere near the stupa".' },
  { step: 'Line the phone up with it', detail: 'GPS, compass and motion sensors together. It locks only when the match is genuinely good.' },
  { step: 'Photograph what is there today', detail: 'Written to the phone before anything touches the network.' },
  { step: 'Note the condition', detail: 'The AI proposes cracks as dashed outlines. You decide how serious it is.' },
  { step: 'A custodian acts on it', detail: 'The report reaches whoever is responsible for the site, and they can close it.' },
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

        {/*
          Two columns only once there is room for the figure to stand beside
          the wordmark. Below that the text stays centred and the figure falls
          to the end, which keeps the download button — the one thing this page
          exists to hand over — above the fold on a phone.
        */}
        <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-20 sm:pt-20 sm:pb-24">
          <div className="grid items-center gap-y-14 lg:grid-cols-[1fr_auto] lg:gap-x-16">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-1.5 text-sm font-medium text-ink-soft shadow-sm">
                <span className="size-1.5 rounded-full bg-dhamma" />
                Lumbini and the Kathmandu Valley
              </span>

              <h1 className="mt-8 font-[family-name:var(--font-display)] text-5xl leading-[1.03] font-semibold tracking-tight text-ink sm:text-7xl">
                A photograph is <span className="italic">evidence</span> when
                somebody knows where you stood
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-xl leading-relaxed text-ink-soft lg:mx-0">
                Sākṣī means <em>witness</em>. Go to a heritage site, stand at a
                fixed viewpoint, and photograph what is there today. Come back
                next year and the two frames line up — a record of how a place is
                changing, made by the people standing in front of it, and
                delivered to the institution that can act on it.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <a
                  href={build.apkUrl}
                  className="inline-flex items-center gap-3 rounded-2xl bg-earth px-8 py-4.5 text-lg font-semibold text-white shadow-lg shadow-earth/25 transition hover:-translate-y-0.5 hover:bg-sandstone-deep hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-earth"
                >
                  <Download className="size-6" aria-hidden />
                  Download for Android
                </a>

                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-7 py-4.5 text-lg font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  How it works
                  <ArrowRight className="size-5" aria-hidden />
                </Link>
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

            <GreetingMonk className="h-56 sm:h-72 lg:h-[27rem]" />
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="border-y border-line bg-ground-deep">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
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
            <em>exposed</em>. Only somebody standing in front of the wall can say
            whether the wall has moved — and heritage offices cannot afford to
            put a surveyor in front of every wall, every month, forever.
          </p>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            <strong className="font-semibold text-ink">
              Meanwhile a million people a year walk past those walls with a
              phone in their hand.
            </strong>{' '}
            Sākṣī turns that flow into the fieldwork nobody has budget for.
          </p>

          <Figures
            items={[
              { value: '1.17M', label: 'visitors to Lumbini in 2024', note: '+17% on the year before' },
              { value: '80%', label: 'of World Cultural Heritage sites under climate stress' },
              { value: '4', label: 'sites live today', note: 'Lumbini, Patan, Changu Narayan, Manga Hiti' },
              { value: '0', label: 'accounts or logins required to contribute' },
            ]}
          />

          <p className="mt-6 text-sm text-ink-muted">
            Sources and the full argument are in the{' '}
            <Link
              href="/research"
              className="underline decoration-line underline-offset-4 transition hover:text-ink"
            >
              research report
            </Link>
            .
          </p>
        </div>
      </section>

      {/* The loop */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
          The whole product
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
          Five steps, and everything else serves them
        </h2>

        <ol className="mt-8 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
          {loop.map(({ step, detail }, i) => (
            <li key={step} className="flex gap-5 p-6">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary font-[family-name:var(--font-display)] text-lg font-semibold text-sandstone-deep">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-ink">{step}</h3>
                <p className="mt-1.5 leading-relaxed text-ink-soft">{detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <Link
          href="/how-it-works"
          className="mt-8 inline-flex items-center gap-2 font-semibold text-earth underline underline-offset-4"
        >
          What the record keeps at each step
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      {/* Surfaces */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {SURFACES.map(({ name, means, subtitle, body, accent, chip, rule }) => (
            <article
              key={name}
              className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className={`absolute inset-x-0 top-0 h-1 ${rule}`} />
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${chip} ${accent}`}
              >
                {subtitle}
              </span>
              <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
                {name}
              </h2>
              <p className="mt-1 text-sm text-ink-muted italic">{means}</p>
              <p className="mt-4 leading-relaxed text-ink-soft">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Coverage acquisition */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="flex flex-col gap-8 rounded-3xl border border-line bg-surface p-8 shadow-sm sm:flex-row sm:items-start sm:p-10">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-tirtha/10 text-tirtha">
            <Compass className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink sm:text-3xl">
              Quests point at what nobody has checked lately
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Tīrtha does not send visitors to what is popular. A quest exists at
              a vantage because nobody has photographed it from that exact spot
              in a while, or at a spout because nobody knows whether it is still
              running. A visitor gets somewhere to go and something to notice;
              the record gets a resurvey it would not otherwise have had. Those
              are the same action, and the app is built so that doing one always
              does the other.
            </p>
          </div>
        </div>
      </section>

      {/* Custodians */}
      <section className="border-y border-line bg-ground-deep">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
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
              className="inline-flex items-center gap-2 rounded-2xl bg-earth px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-sandstone-deep"
            >
              For custodians
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/custodian"
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-6 py-3.5 font-semibold text-ink shadow-sm transition hover:shadow-md"
            >
              Open the dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Reports */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
          Read further
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
          The long-form case, in two documents
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[REPORTS.techStack, REPORTS.research].map(({ href, title, pages, blurb }) => (
            <a
              key={href}
              href={href}
              className="flex flex-col rounded-3xl border border-line bg-surface p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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
          ))}
        </div>
      </section>

      {/* Install instructions */}
      <section id="download" className="scroll-mt-20 border-t border-line bg-ground-deep">
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
