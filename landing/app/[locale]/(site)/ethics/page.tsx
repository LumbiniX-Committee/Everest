import type { Metadata } from 'next';
import Link from 'next/link';
import { Ban, Camera, HandCoins, ShieldCheck } from 'lucide-react';

import { localeHref, type Locale } from '@/lib/i18n';

const ICONS = {
  'no-money': HandCoins,
  'no-sponsored': Ban,
  'evidence-not-inventory': Camera,
  attribution: ShieldCheck,
} as const;

const EN = {
  metaTitle: 'Ethics policy',
  metaDescription:
    'What Sākṣī will not do: no commercial funding from a site it monitors, no sponsored recommendations, no selling what a visitor witnesses.',
  kicker: 'Ethics',
  title: 'What Sākṣī will not do',
  intro:
    'Sākṣī asks an institution to trust a record it did not produce itself. That only works if the record cannot be bought. This is what we have committed not to do, stated plainly rather than left implied.',
  commitments: {
    'no-money': {
      title: 'No money from a site we monitor',
      body: 'We do not accept funding, in kind or in cash, from any commercial entity operating within a site Sākṣī monitors: a hotel, tour operator, shop, or restaurant inside or adjoining a monument zone. A conservation record has to be trusted by the institution reading it, and that trust does not survive a sponsor with a stake in what the record says.',
    },
    'no-sponsored': {
      title: 'No sponsored recommendations',
      body: 'The app will not carry coupons, sponsored listings, or paid placement of any kind: not for a restaurant, not for a guide, not for a shop. What a quest sends you toward is decided by where the record is thin, never by who paid for the mention.',
    },
    'evidence-not-inventory': {
      title: 'What you witness stays evidence, not inventory',
      body: 'Photographs and condition reports exist to build a monitoring record for the institution responsible for a site. They are not sold, licensed to advertisers, or repackaged as marketing imagery. Custodian accounts can read and act on reports; nothing else reads them.',
    },
    attribution: {
      title: 'Attribution before invention',
      body: 'Every fact the app states, in the Dhamma engine or on a site page, resolves to a named, checkable source. Where the evidence runs out, the app says so rather than filling the gap: a reconstruction is always labelled as one, and a claim with nowhere to point is not shown at all.',
    },
  },
  footnote:
    'This policy covers the project as it stands today. If a paid institutional licence or grant is ever taken on, it will be disclosed here, and it will never come from a commercial operator inside a site we monitor.',
  linkText: 'What this means for an institution deploying Sākṣī →',
};

const NE: typeof EN = {
  metaTitle: 'नैतिकता नीति',
  metaDescription:
    'साक्षीले नगर्ने कुराहरू: अनुगमन गर्ने ठाउँबाट व्यावसायिक लगानी छैन, प्रायोजित सिफारिस छैन, र आगन्तुकले साक्षी बसेको कुरा बेच्दैन।',
  kicker: 'नैतिकता',
  title: 'साक्षीले के गर्दैन',
  intro:
    'साक्षीले कुनै संस्थालाई आफूले नबनाएको अभिलेखमाथि भरोसा गर्न भन्छ। यो तब मात्र सम्भव हुन्छ जब त्यो अभिलेख किन्न नसकिने होस्। हामीले नगर्ने प्रतिबद्धता जनाएका कुरा यहाँ स्पष्ट रूपमा उल्लेख गरिएको छ, अनुमानमा छाडिएको छैन।',
  commitments: {
    'no-money': {
      title: 'हामी अनुगमन गर्ने ठाउँबाट पैसा लिँदैनौं',
      body: 'साक्षीले अनुगमन गर्ने कुनै पनि ठाउँभित्र सञ्चालित व्यावसायिक संस्थाबाट, जस्तै स्मारक क्षेत्रभित्र वा छेउमा रहेको होटल, ट्राभल अपरेटर, पसल, वा रेस्टुरेन्टबाट, हामी नगद वा जिन्सी कुनै पनि रूपमा सहयोग स्वीकार गर्दैनौं। संरक्षण अभिलेखलाई त्यसलाई पढ्ने संस्थाले भरोसा गर्नुपर्छ, र त्यो भरोसा अभिलेखमा के लेखिन्छ भन्नेमा स्वार्थ राख्ने प्रायोजकसँग टिक्दैन।',
    },
    'no-sponsored': {
      title: 'कुनै प्रायोजित सिफारिस छैन',
      body: 'एपले कुनै पनि प्रकारको कुपन, प्रायोजित सूची, वा तिरेर राखिने विज्ञापन बोक्दैन: न रेस्टुरेन्टका लागि, न गाइडका लागि, न पसलका लागि। कुनै अभियानले तपाईंलाई कहाँ पठाउँछ भन्ने कुरा अभिलेख कहाँ पातलो छ भन्नेले तय गर्छ, कसले उल्लेखको लागि पैसा तिर्यो भन्नेले होइन।',
    },
    'evidence-not-inventory': {
      title: 'तपाईंले साक्षी बसेको कुरा प्रमाण नै रहन्छ, सामग्री बन्दैन',
      body: 'तस्बिर र अवस्था प्रतिवेदनहरू कुनै ठाउँको जिम्मेवार संस्थाका लागि अनुगमन अभिलेख बनाउन अस्तित्वमा छन्। तिनलाई बेचिँदैन, विज्ञापनदातालाई लाइसेन्स दिइँदैन, वा मार्केटिङ छविको रूपमा पुनः प्रयोग गरिँदैन। संरक्षक खाताहरूले प्रतिवेदन पढ्न र त्यसमा कारबाही गर्न सक्छन्; अरू कसैले तिनलाई पढ्दैन।',
    },
    attribution: {
      title: 'आविष्कारभन्दा पहिले श्रेय',
      body: 'एपले भन्ने हरेक तथ्य, धम्म इन्जिनमा होस् वा कुनै ठाउँको पृष्ठमा, नामसहितको जाँच्न सकिने स्रोतमा पुग्छ। जहाँ प्रमाण सकिन्छ, एपले खाली ठाउँ भर्नुको सट्टा त्यही भन्छ: पुनर्निर्माणलाई सधैं पुनर्निर्माण भनेरै लेबल गरिन्छ, र कतै नअडिने दाबी देखाइँदैन।',
    },
  },
  footnote:
    'यो नीतिले परियोजना आजको अवस्थामा जस्तो छ त्यसलाई समेट्छ। यदि कहिल्यै तिरेको संस्थागत इजाजतपत्र वा अनुदान लिइयो भने, यो यहीं खुलासा गरिनेछ, र त्यो हामीले अनुगमन गर्ने ठाउँभित्रको कुनै व्यावसायिक सञ्चालकबाट कहिल्यै आउने छैन।',
  linkText: 'साक्षी लागू गर्ने संस्थाका लागि यसको अर्थ के हो →',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = locale === 'ne' ? NE : EN;
  return {
    title: `Sākṣī: ${c.metaTitle}`,
    description: c.metaDescription,
    alternates: { languages: { en: '/en/ethics', ne: '/ne/ethics' } },
  };
}

export default async function EthicsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const c = locale === 'ne' ? NE : EN;

  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-24 sm:pt-24">
        <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
          {c.kicker}
        </p>

        <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          {c.title}
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">{c.intro}</p>

        <div className="mt-14 space-y-6">
          {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((id) => {
            const Icon = ICONS[id];
            const { title, body } = c.commitments[id];
            return (
              <article
                key={id}
                className="flex gap-5 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-sandstone-deep">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-semibold text-ink">{title}</h2>
                  <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-14 text-sm leading-relaxed text-ink-muted">{c.footnote}</p>

        <p className="mt-8 text-sm">
          <Link
            href={localeHref(locale, '/for-custodians')}
            className="font-semibold text-earth underline underline-offset-4"
          >
            {c.linkText}
          </Link>
        </p>
      </section>
    </main>
  );
}
