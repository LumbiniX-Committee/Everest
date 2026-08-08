import {
  BookOpen,
  Camera,
  Check,
  Download,
  MapPin,
  Settings,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

import { formatBuildDate, getLatestBuild } from '@/lib/eas';

/**
 * The page re-resolves the latest EAS build on this interval, so publishing a
 * new APK updates the download button without a redeploy.
 *
 * Next parses this export statically and rejects an imported constant, so the
 * literal cannot be shared with REVALIDATE_SECONDS in lib/eas.ts. Keep the two
 * in step.
 */
export const revalidate = 300;

const pillars = [
  {
    name: 'Tīrtha',
    subtitle: 'Map & Pilgrimage',
    body: 'Discover sacred sites across the Lumbini plain and complete mindful quests that reward attention rather than speed.',
    Icon: MapPin,
    accent: 'text-tirtha',
    chip: 'bg-tirtha/10',
    rule: 'bg-tirtha',
  },
  {
    name: 'Sākṣī',
    subtitle: 'The Witness',
    body: 'Align AR ghost overlays to a fixed vantage and capture a conservation time-series — the same frame, returned to across years.',
    Icon: Camera,
    accent: 'text-sakshi',
    chip: 'bg-sakshi/10',
    rule: 'bg-sakshi',
  },
  {
    name: 'Dhamma',
    subtitle: 'The Teaching',
    body: 'A citation-locked wisdom engine. Every passage is grounded in the Pali canon and carries the reference it came from.',
    Icon: BookOpen,
    accent: 'text-dhamma',
    chip: 'bg-dhamma/10',
    rule: 'bg-dhamma',
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
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] bg-[radial-gradient(ellipse_at_top,rgba(200,148,50,0.18),transparent_65%)]"
        />

        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-24 text-center sm:pt-28 sm:pb-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-1.5 text-sm font-medium text-ink-soft shadow-sm">
            <span className="size-1.5 rounded-full bg-dhamma" />
            LumbiniX 2026
          </span>

          <h1 className="mt-8 font-[family-name:var(--font-display)] text-6xl leading-none font-semibold tracking-tight text-ink sm:text-8xl">
            Sākṣī
          </h1>

          <p className="mt-6 font-[family-name:var(--font-display)] text-2xl text-ink-soft italic sm:text-3xl">
            Strive on with heedfulness
          </p>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft">
            An AR conservation and pilgrimage companion for the sacred sites of
            Lumbini. Walk the tīrtha, witness a place as it changes, and read
            the teaching from the canon.
          </p>

          <div className="mt-12">
            <a
              href={build.apkUrl}
              className="inline-flex items-center gap-3 rounded-2xl bg-earth px-9 py-5 text-lg font-semibold text-white shadow-lg shadow-earth/25 transition hover:-translate-y-0.5 hover:bg-sandstone-deep hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-earth"
            >
              <Download className="size-6" aria-hidden />
              Download APK for Android
            </a>

            <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-ink-muted">
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
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map(({ name, subtitle, body, Icon, accent, chip, rule }) => (
            <article
              key={name}
              className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className={`absolute inset-x-0 top-0 h-1 ${rule}`} />

              <span
                className={`inline-flex size-12 items-center justify-center rounded-2xl ${chip} ${accent}`}
              >
                <Icon className="size-6" aria-hidden />
              </span>

              <h2 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
                {name}
              </h2>
              <p className={`mt-1 text-sm font-semibold tracking-wide uppercase ${accent}`}>
                {subtitle}
              </p>
              <p className="mt-4 leading-relaxed text-ink-soft">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Install instructions */}
      <section className="border-y border-line bg-ground-deep">
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

      <footer className="mx-auto max-w-6xl px-6 py-12 text-center">
        <p className="font-[family-name:var(--font-display)] text-lg text-ink">Sākṣī</p>
        <p className="mt-2 text-sm text-ink-muted">
          Built for LumbiniX 2026 · appamādena sampādetha
        </p>
      </footer>
    </main>
  );
}
