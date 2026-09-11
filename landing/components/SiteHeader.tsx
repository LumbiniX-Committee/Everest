'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { NAV } from '@/lib/site';

/**
 * The site's one navigation. Every public page used to open with a lone
 * "← Sākṣī" link back to the home page, which made the site a hub and spokes
 * rather than a set of pages you could move between.
 *
 * Client component only for the mobile disclosure. The links themselves are
 * plain anchors, so navigation works before hydration.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ground/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink"
          onClick={() => setOpen(false)}
        >
          Sākṣī
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-soft hover:bg-surface/70 hover:text-ink'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/#download"
          className="ml-auto rounded-xl bg-earth px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sandstone-deep lg:ml-0"
        >
          Get the app
        </Link>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
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
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block border-b border-line/60 py-3 text-ink-soft transition last:border-0 hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
