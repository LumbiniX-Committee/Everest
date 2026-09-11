import Link from 'next/link';

import { NAV, REPO_URL } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ground-deep">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
              Sākṣī
            </p>
            <p className="mt-3 leading-relaxed text-ink-soft">
              A conservation-evidence platform that uses pilgrimage as its
              distribution channel. Built for LumbiniX 2026 by the
              LumbiniX-Committee team.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              {NAV.map(({ href, label }) => (
                <Link key={href} href={href} className="text-ink-soft transition hover:text-ink">
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/custodian" className="text-ink-soft transition hover:text-ink">
                Custodian dashboard
              </Link>
              <Link href="/data" className="text-ink-soft transition hover:text-ink">
                Open data
              </Link>
              <a href={REPO_URL} className="text-ink-soft transition hover:text-ink">
                Source code
              </a>
              <Link href="/#download" className="text-ink-soft transition hover:text-ink">
                Download
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-12 border-t border-line pt-6 text-sm text-ink-muted">
          Site and viewpoint coordinates are real but not all survey-grade, and
          the app labels the ones that are approximate. Nothing here is an
          official publication of the Lumbini Development Trust or UNESCO.
        </p>
      </div>
    </footer>
  );
}
