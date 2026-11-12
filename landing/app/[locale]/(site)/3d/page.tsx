import type { Metadata } from 'next';

import { ModelStage, ScanGallery } from '@/components/Nepal3D';
import { PageHero, Section } from '@/components/ui';
import { type Locale } from '@/lib/i18n';

const EN = {
  metaTitle: 'Nepal in 3D',
  metaDescription:
    'Turn Nepal’s monuments in 3D, place them in your room with your phone’s camera, and explore real scans of Lumbini, Swayambhu, Kathmandu and Patan by Nepali creators and university teams.',
  hero: {
    eyebrow: 'Nepal in 3D',
    title: 'Walk around a stupa from your desk',
    lede: 'Real scans and our own detailed models of the places, which you can place in your room through your phone’s camera, and more scans in their creators’ own player.',
  },
  modelsKicker: 'On the map',
  modelsTitle: 'Real scans and detailed models',
  scansKicker: 'Real scans',
  scansTitle: 'The places as they were captured',
};

const NE: typeof EN = {
  metaTitle: '3D मा नेपाल',
  metaDescription:
    'नेपालका स्मारक 3D मा घुमाउनुहोस्, फोनको क्यामेराले आफ्नो कोठामा राख्नुहोस्, र नेपाली निर्माता तथा विश्वविद्यालय टोलीले खिचेका लुम्बिनी, स्वयम्भू, काठमाडौं र पाटनका वास्तविक स्क्यान हेर्नुहोस्।',
  hero: {
    eyebrow: '3D मा नेपाल',
    title: 'आफ्नै टेबलबाट स्तूप परिक्रमा',
    lede: 'ठाउँहरूका वास्तविक स्क्यान र हाम्रा आफ्नै विस्तृत मोडेल, जसलाई फोनको क्यामेराले कोठामा राख्न सकिन्छ, र निर्माताकै प्लेयरमा थप स्क्यान।',
  },
  modelsKicker: 'नक्सामा',
  modelsTitle: 'वास्तविक स्क्यान र विस्तृत मोडेल',
  scansKicker: 'वास्तविक स्क्यान',
  scansTitle: 'खिचिएका बेलाका ठाउँहरू',
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const c = locale === 'ne' ? NE : EN;
  return {
    title: `Sākṣī: ${c.metaTitle}`,
    description: c.metaDescription,
    alternates: { languages: { en: '/en/3d', ne: '/ne/3d' } },
  };
}

export default async function Nepal3DPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const c = locale === 'ne' ? NE : EN;
  return (
    <main>
      <PageHero eyebrow={c.hero.eyebrow} title={c.hero.title} lede={c.hero.lede} />
      <Section kicker={c.modelsKicker} title={c.modelsTitle}>
        <div className="mt-8">
          <ModelStage locale={locale} />
        </div>
      </Section>
      <Section kicker={c.scansKicker} title={c.scansTitle}>
        <div className="mt-8">
          <ScanGallery locale={locale} />
        </div>
      </Section>
    </main>
  );
}
