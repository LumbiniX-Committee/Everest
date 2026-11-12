import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Devanagari, Noto_Serif_Devanagari, Source_Sans_3, Source_Serif_4 } from 'next/font/google';

import './globals.css';

/*
 * Type: the Adobe Source pair, chosen for an institutional, scholarly voice
 * (the register of a museum catalogue or a UNESCO record) rather than a
 * friendly app template. Both carry every IAST mark the site's names need
 * (Sākṣī, Tīrtha: ā ī ṣ ṇ ṭ), which several alternatives lack. Nepali text
 * falls through, glyph by glyph, to the matching Noto Devanagari face.
 */
const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600', '700'],
  variable: '--font-source-serif',
  display: 'swap',
});
const sourceSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-source-sans',
  display: 'swap',
});
const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['500', '600', '700'],
  variable: '--font-noto-serif-deva',
  display: 'swap',
});
const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-deva',
  display: 'swap',
});

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
    <html lang="en" className={`${sourceSerif.variable} ${sourceSans.variable} ${notoSerifDevanagari.variable} ${notoSansDevanagari.variable}`}>
      <body>{children}</body>
    </html>
  );
}
