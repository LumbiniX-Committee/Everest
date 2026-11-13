import Image from 'next/image';
import Link from 'next/link';

import { localeHref, t, type Locale } from '@/lib/i18n';
import { NAV, OWNER, REPO_URL } from '@/lib/site';

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

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:gap-8">
          <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
            {t(locale, 'footer.madeBy')}
          </p>
          {/* The logo as supplied, at its minimum width or more, with clear space around it. */}
          <a href={`mailto:${OWNER.email}`} className="w-fit p-2" aria-label={OWNER.legalName}>
            <Image src={OWNER.logo} alt={OWNER.legalName} width={156} height={45} unoptimized />
          </a>
          <address className="text-sm leading-relaxed text-ink-soft not-italic">
            {OWNER.legalName} · {OWNER.address[locale]}
            <br />
            <a href={`mailto:${OWNER.email}`} className="transition hover:text-ink">
              {OWNER.email}
            </a>
          </address>
        </div>

        <p className="mt-8 border-t border-line pt-6 text-sm text-ink-muted">
          {t(locale, 'footer.disclaimer')}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          © {OWNER.founded} {OWNER.legalName} · Reg. No. {OWNER.registrationNo} · PAN {OWNER.pan}.{' '}
          {t(locale, 'footer.rights')}
        </p>
      </div>
    </footer>
  );
}
