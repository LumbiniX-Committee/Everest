'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Activity,
  Bug,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPinned,
  ShieldCheck,
  UserCog,
} from 'lucide-react';

import { request } from '@/lib/adminApi';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/reports', label: 'Reports', icon: ClipboardList },
  { href: '/admin/sites', label: 'Sites', icon: MapPinned },
  { href: '/admin/access', label: 'Access', icon: ShieldCheck },
  { href: '/admin/codes', label: 'Pro codes', icon: KeyRound },
  { href: '/admin/crashes', label: 'Crashes', icon: Bug },
  { href: '/admin/activity', label: 'Admin log', icon: Activity },
  { href: '/admin/account', label: 'Account', icon: UserCog },
] as const;

/**
 * The console's frame: a fixed sidebar on wide screens, a scrolling tab row on
 * phones. Navigation is real links, so every section has its own address and
 * the back button works.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    request<{ email: string | null }>('/api/admin/me')
      .then((me) => live && setEmail(me.email))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <div className="min-h-dvh bg-ground lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden bg-ink text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="px-6 pt-7 pb-6">
          <Link href="/admin" className="block">
            <span className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">Sākṣī</span>
            <span className="mt-0.5 block text-sm text-white/60">Admin console</span>
          </Link>
        </div>
        <nav aria-label="Admin sections" className="flex-1 px-3">
          <ul className="space-y-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const on = active(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={on ? 'page' : undefined}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.95rem] font-medium transition-colors ${
                      on ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {on ? <span aria-hidden className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-marigold" /> : null}
                    <Icon className="size-[18px] shrink-0" aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-white/10 px-6 py-5">
          <p className="truncate text-sm text-white/80" title={email ?? undefined}>{email ?? ' '}</p>
          <form action="/auth/signout" method="post" className="mt-2">
            <button className="inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white">
              <LogOut className="size-4" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 bg-ink text-white lg:hidden">
          <div className="flex items-center justify-between px-4 pt-3">
            <Link href="/admin" className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Sākṣī <span className="font-sans text-sm font-normal text-white/60">Admin</span>
            </Link>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg px-2 py-1.5 text-sm text-white/70" aria-label="Sign out">
                <LogOut className="size-5" aria-hidden />
              </button>
            </form>
          </div>
          <nav aria-label="Admin sections" className="overflow-x-auto">
            <ul className="flex gap-1 px-3 py-2">
              {NAV.map(({ href, label }) => {
                const on = active(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={on ? 'page' : undefined}
                      className={`block rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap ${on ? 'bg-white text-ink' : 'text-white/75'}`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
