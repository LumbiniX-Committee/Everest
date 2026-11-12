import type { Metadata, Viewport } from 'next';

import './globals.css';

/*
 * Type: the Adobe Source pair, chosen for an institutional, scholarly voice
 * (the register of a museum catalogue or a UNESCO record) rather than a
 * friendly app template. Both carry every IAST mark the site's names need
 * (Sākṣī, Tīrtha: ā ī ṣ ṇ ṭ). Nepali falls through to Noto Devanagari. The
 * faces are self-hosted; see the @font-face rules at the top of globals.css.
 */
const PRELOAD = ['/fonts/source-sans-3-latin.woff2', '/fonts/source-serif-4-latin.woff2'];

export const metadata: Metadata = {
  metadataBase: new URL('https://saksi-beta.vercel.app'),
  /*
   * A template rather than a title, because the site is no longer one page.
   * Each page sets its own full title and this only fills the gap.
   */
  title: {
    default: 'Sākṣī: a real-time guide to Nepal',
    template: '%s',
  },
  description:
    'A real-time map explorer for the heritage sites of Lumbini and the Kathmandu Valley. Walk, and the places you reach speak, as deeply as you asked, from sources you can check. Everything else the app does exists so that walking through a place also leaves a record of it behind.',
  openGraph: {
    title: 'Sākṣī: A living map of a sacred landscape',
    description:
      'A real-time map explorer for heritage sites. Places speak as you reach them, at the depth you chose, from sources you can check, and every visit can leave a measurement behind.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Sākṣī: a lotus cradling the rising sun' }],
  },
  alternates: {
    languages: { en: '/en', ne: '/ne' },
  },
};

export const viewport: Viewport = {
  themeColor: '#0e6e62',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {PRELOAD.map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
