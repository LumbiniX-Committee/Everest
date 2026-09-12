'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { localeHref, otherLocale, swapLocaleInPathname, t, type Locale } from '@/lib/i18n';
import { NAV } from '@/lib/site';

/**
 * The site's one navigation. Every public page used to open with a lone
 * "← Sākṣī" link back to the home page, which made the site a hub and spokes
 * rather than a set of pages you could move between.
 *
 * Client component only for the mobile disclosure. The links themselves are
 * plain anchors, so navigation works before hydration.
 */
export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const next = otherLocale(locale);
  const switchHref = swapLocaleInPathname(pathname, next);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ground/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5">
        <Link
          href={localeHref(locale, '/')}
          className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink"
          onClick={() => setOpen(false)}
        >
          Sākṣī
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map(({ href, labelKey }) => {
            const fullHref = localeHref(locale, href);
            const active = pathname === fullHref;
            return (
              <Link
                key={href}
                href={fullHref}
                aria-current={active ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-soft hover:bg-surface/70 hover:text-ink'
                }`}
              >
                {t(locale, labelKey)}
              </Link>
            );
          })}
        </nav>

        <Link
          href={switchHref}
          className="ml-auto hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface/70 hover:text-ink lg:ml-0 lg:block"
        >
          {t(locale, 'nav.language')}
        </Link>

        <Link
          href={`${localeHref(locale, '/')}#download`}
          className="ml-auto rounded-xl bg-earth px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sandstone-deep lg:ml-0"
        >
          {t(locale, 'nav.getTheApp')}
        </Link>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? t(locale, 'nav.closeMenu') : t(locale, 'nav.openMenu')}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-line p-2 text-ink-soft transition hover:text-ink lg:hidden"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      {open ? (
        <nav
          id="site-menu"
          aria-label="Primary"
          className="border-t border-line bg-ground px-6 pb-4 lg:hidden"
        >
          {NAV.map(({ href, labelKey }) => (
            <Link
              key={href}
              href={localeHref(locale, href)}
              onClick={() => setOpen(false)}
              className="block border-b border-line/60 py-3 text-ink-soft transition last:border-0 hover:text-ink"
            >
              {t(locale, labelKey)}
            </Link>
          ))}
          <Link
            href={switchHref}
            onClick={() => setOpen(false)}
            className="block py-3 text-ink-soft transition hover:text-ink"
          >
            {t(locale, 'nav.language')}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
