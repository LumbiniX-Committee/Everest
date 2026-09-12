import { notFound } from 'next/navigation';

import { isLocale, LOCALES } from '@/lib/i18n';

/**
 * Statically prerenders both `/en/...` and `/ne/...`. The true root layout
 * (`app/layout.tsx`) still owns `<html>` and `<body>` — a nested layout
 * cannot replace them — so `lang` cannot vary on the `<html>` tag itself
 * without also localising `/custodian`, `/login` and `/adopt`, which this
 * pass deliberately does not. `app/[locale]/(site)/layout.tsx` sets `lang` on
 * a wrapping element instead, and each page sets its own
 * `metadata.alternates.languages`, which is what search engines actually key
 * locale discovery on.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return children;
}
