import type { Metadata, Viewport } from 'next';
import { Mukta, Newsreader } from 'next/font/google';

import './globals.css';

// Headlines: an editorial serif, so the page reads like a well-made guidebook
// rather than an app template. Its latin-ext subset carries the IAST marks
// (ā ṣ ī) in Sākṣī; Devanagari headings fall through to Mukta, glyph by glyph.
const newsreader = Newsreader({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});
// Body and every Devanagari line.
const mukta = Mukta({
  subsets: ['latin', 'latin-ext', 'devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mukta',
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
    <html lang="en" className={`${newsreader.variable} ${mukta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
