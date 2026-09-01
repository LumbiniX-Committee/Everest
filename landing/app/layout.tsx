import type { Metadata, Viewport } from 'next';

import './globals.css';

export const metadata: Metadata = {
  /*
   * A template rather than a title, because the site is no longer one page.
   * Each page sets its own full title and this only fills the gap.
   */
  title: {
    default: 'Sākṣī — Turning a visit into conservation evidence',
    template: '%s',
  },
  description:
    'Sākṣī means witness. Stand at a fixed viewpoint at a heritage site, photograph what is there today, and the frames line up into a record of how the place is changing — delivered to the institution that can act on it. Lumbini and the Kathmandu Valley.',
  openGraph: {
    title: 'Sākṣī — Turning a visit into conservation evidence',
    description:
      'Stand at a fixed viewpoint, photograph what is there today, and the frames line up into a monitoring record a custodian can act on.',
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
