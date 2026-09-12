import Link from 'next/link';

import { localeHref, t, type Locale } from '@/lib/i18n';
import { NAV, REPO_URL } from '@/lib/site';

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="border-t border-line bg-ground-deep">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
              Sākṣī
            </p>
            <p className="mt-3 leading-relaxed text-ink-soft">{t(locale, 'footer.tagline')}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              {NAV.map(({ href, labelKey }) => (
                <Link
                  key={href}
                  href={localeHref(locale, href)}
                  className="text-ink-soft transition hover:text-ink"
                >
                  {t(locale, labelKey)}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/custodian" className="text-ink-soft transition hover:text-ink">
                {t(locale, 'nav.custodianDashboard')}
              </Link>
              <Link
                href={localeHref(locale, '/data')}
                className="text-ink-soft transition hover:text-ink"
              >
                {t(locale, 'nav.data')}
              </Link>
              <a href={REPO_URL} className="text-ink-soft transition hover:text-ink">
                {t(locale, 'nav.sourceCode')}
              </a>
              <Link
                href={`${localeHref(locale, '/')}#download`}
                className="text-ink-soft transition hover:text-ink"
              >
                {t(locale, 'nav.download')}
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-12 border-t border-line pt-6 text-sm text-ink-muted">
          {t(locale, 'footer.disclaimer')}
        </p>
      </div>
    </footer>
  );
}
