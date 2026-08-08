import type { Metadata, Viewport } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Sākṣī — Strive on with heedfulness',
  description:
    'An AR-powered conservation and pilgrimage companion for Lumbini. Walk the tīrtha, witness a site as it changes, and read the Dhamma from the canon. Download the Android APK.',
  openGraph: {
    title: 'Sākṣī — Strive on with heedfulness',
    description:
      'Walk the tīrtha, witness a site as it changes, and read the Dhamma from the canon.',
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
