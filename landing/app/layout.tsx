import type { Metadata, Viewport } from 'next';

import './globals.css';

export const metadata: Metadata = {
  /*
   * A template rather than a title, because the site is no longer one page.
   * Each page sets its own full title and this only fills the gap.
   */
  title: {
    default: 'Sākṣī — A living map of a sacred landscape',
    template: '%s',
  },
  description:
    'A real-time map explorer for the heritage sites of Lumbini and the Kathmandu Valley. Walk, and the places you reach speak — as deeply as you asked, from sources you can check. Everything else the app does exists so that walking through a place also leaves a record of it behind.',
  openGraph: {
    title: 'Sākṣī — A living map of a sacred landscape',
    description:
      'A real-time map explorer for heritage sites. Places speak as you reach them, at the depth you chose, from sources you can check — and every visit can leave a measurement behind.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#f4f1e8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
