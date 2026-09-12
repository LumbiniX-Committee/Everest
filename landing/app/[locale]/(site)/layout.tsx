import { notFound } from 'next/navigation';

import { isLocale } from '@/lib/i18n';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

/**
 * Chrome for the public site. The custodian dashboard sits outside this group
 * on purpose: it is a tool someone works in, not a page they were navigated to,
 * and a marketing nav across the top of it would be noise.
 *
 * `lang` is set here rather than on `<html>` — see `app/[locale]/layout.tsx`
 * for why a nested layout cannot own that tag.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div lang={locale}>
      <SiteHeader locale={locale} />
      {children}
      <SiteFooter locale={locale} />
    </div>
  );
}
