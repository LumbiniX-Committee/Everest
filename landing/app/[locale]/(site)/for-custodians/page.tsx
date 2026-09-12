import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, Download, Gauge, MapPinned } from 'lucide-react';

import { Callout, PageHero, Prose, Section, Steps } from '@/components/ui';
import { localeHref, type Locale } from '@/lib/i18n';

const ICONS = {
  coverage: Gauge,
  acknowledgement: ClipboardCheck,
  reports: MapPinned,
  export: Download,
} as const;

const EN = {
  metaTitle: 'For custodians',
  metaDescription:
    'A condition report is only useful if someone responsible for the site sees it. The custodian dashboard shows coverage, time to acknowledgement, and every open report by site and status, with CSV and GeoJSON export.',
  hero: {
    eyebrow: 'For custodians',
    title: 'Evidence that arrives where someone can act on it',
    lede: 'A condition report a visitor files is worth nothing until it reaches the institution responsible for the site. The custodian surface is the half of this product that closes that loop, and it is the half we would build first if we had to start again.',
    cta: 'Open the dashboard',
  },
  dashboardKicker: 'The dashboard',
  dashboardTitle: 'What it shows you',
  features: {
    coverage: {
      title: 'Coverage, and how stale it is',
      body: 'Which vantages have been resurveyed recently and which have not been photographed in months. The gaps are the point: a quest in the app is generated from this, so the places nobody is looking at are exactly where the next visitor gets sent.',
    },
    acknowledgement: {
      title: 'Median time to acknowledgement',
      body: 'How long a report waits before a person responds to it. This number is on the dashboard because it measures the institution rather than the visitors, and because a loop that quietly stops closing is the failure mode that matters most.',
    },
    reports: {
      title: 'Every open report, by site and status',
      body: 'Acknowledge a report, mark it in progress, resolve it with a note, or explicitly reopen it with an explanation. Every action is appended to the history in the authenticated web portal; the visitor app has no privileged custodian controls.',
    },
    export: {
      title: 'CSV and GeoJSON export',
      body: 'The record leaves in formats a GIS actually reads, so the evidence can go into whatever system already holds your inventory. Nothing is trapped here.',
    },
  },
  onboardingKicker: 'Getting started',
  onboardingTitle: 'What a deployment actually needs',
  onboarding: [
    {
      title: 'Establish the vantages',
      body: 'A vantage is a stored position, bearing and tilt. Survey-grade coordinates from the responsible authority are what turn the app from a photo collection into a monitoring instrument. The catalogue now records a checkable source for every coordinate; partner custodians still verify each fixed point on the ground before treating it as operational.',
    },
    {
      title: 'Invite the responsible custodians',
      body: 'Accounts are invited manually and sign in by email magic link. Each membership names the sites that person can see, and every action is attributed from the authenticated session rather than a name typed into the browser.',
    },
    {
      title: 'Let the visitors do the surveying',
      body: 'Coverage accumulates from people who were going to visit anyway. Your cost is the attention to read what arrives; the fieldwork is already being paid for by tourism.',
    },
  ],
  callout: {
    title: 'Why access is invite-only',
    body: 'There is no public custodian registration. A magic link keeps the pilot lightweight while still giving each institution site-scoped access and a durable audit trail. Database policies enforce the same boundary even if a browser request is modified.',
  },
  finalKicker: 'What we will not do',
  finalTitle: 'The conditions attached to the record',
  final: {
    intro:
      'An institution is being asked to trust a record it did not produce itself. That trust does not survive a funder with a stake in what the record says, so the',
    ethicsLinkLabel: 'ethics policy',
    makesExplicit: 'makes the constraint explicit:',
    strongClaim: 'no money from any commercial entity operating inside a site the app monitors',
    afterStrong:
      ': no hotel, tour operator, shop or restaurant in or adjoining a monument zone. No sponsored recommendations. Nothing a visitor witnesses is sold, licensed to advertisers, or repackaged as marketing imagery.',
    secondParagraph:
      'Reports are read by custodian accounts and nothing else. Every fact the app states resolves to a named, checkable source, and where the evidence runs out the app says so rather than filling the gap.',
  },
};

const NE: typeof EN = {
  metaTitle: 'संरक्षकका लागि',
  metaDescription:
    'अवस्था प्रतिवेदन तब मात्र उपयोगी हुन्छ जब ठाउँको जिम्मेवार व्यक्तिले यसलाई देख्छ। संरक्षक ड्यासबोर्डले कभरेज, स्वीकृतिसम्मको समय, र ठाउँ र स्थितिअनुसार हरेक खुला प्रतिवेदन देखाउँछ, CSV र GeoJSON निर्यातसहित।',
  hero: {
    eyebrow: 'संरक्षकका लागि',
    title: 'प्रमाण जुन कारबाही गर्न सक्नेकहाँ पुग्छ',
    lede: 'आगन्तुकले पेस गरेको अवस्था प्रतिवेदन ठाउँको जिम्मेवार संस्थासम्म नपुगेसम्म केही मूल्यको हुँदैन। संरक्षक इन्टरफेस यो उत्पादनको त्यो आधा हो जसले त्यो लूपलाई बन्द गर्छ, र यदि हामीले फेरि सुरुदेखि बनाउनुपर्ने भए यही आधा पहिले बनाउने थियौं।',
    cta: 'ड्यासबोर्ड खोल्नुहोस्',
  },
  dashboardKicker: 'ड्यासबोर्ड',
  dashboardTitle: 'यसले तपाईंलाई के देखाउँछ',
  features: {
    coverage: {
      title: 'कभरेज, र यो कति पुरानो छ',
      body: 'कुन दृष्टिकोणहरू भर्खरै पुनः सर्वेक्षण गरिएका छन् र कुन महिनौंदेखि तस्बिर नखिचिएका छन्। खाली ठाउँहरू नै मुख्य कुरा हो: एपमा भएको अभियान यसैबाट उत्पन्न हुन्छ, त्यसैले कसैले नहेरेको ठाउँ नै अर्को आगन्तुक पठाइने ठाउँ हुन्छ।',
    },
    acknowledgement: {
      title: 'स्वीकृतिसम्मको मध्यम समय',
      body: 'कुनै व्यक्तिले जवाफ दिनुअघि प्रतिवेदनले कति समय पर्खन्छ। यो सङ्ख्या ड्यासबोर्डमा छ किनभने यसले आगन्तुकभन्दा संस्थालाई नाप्छ, र किनभने चुपचाप बन्द हुन छाड्ने लूप नै सबैभन्दा महत्त्वपूर्ण असफलता हो।',
    },
    reports: {
      title: 'ठाउँ र स्थितिअनुसार हरेक खुला प्रतिवेदन',
      body: 'प्रतिवेदन स्वीकार गर्नुहोस्, प्रगतिमा रहेको चिन्ह लगाउनुहोस्, टिप्पणीसहित समाधान गर्नुहोस्, वा स्पष्टीकरणसहित यसलाई फेरि खोल्नुहोस्। प्रमाणित वेब पोर्टलमा हरेक कारबाही इतिहासमा थपिन्छ; आगन्तुक एपमा कुनै विशेषाधिकार प्राप्त संरक्षक नियन्त्रण छैन।',
    },
    export: {
      title: 'CSV र GeoJSON निर्यात',
      body: 'अभिलेख GIS ले साँच्चै पढ्ने ढाँचामा बाहिर जान्छ, त्यसैले प्रमाण तपाईंको सूची पहिले नै भएको जुनसुकै प्रणालीमा जान सक्छ। यहाँ केही पनि थुनिँदैन।',
    },
  },
  onboardingKicker: 'सुरु गर्दै',
  onboardingTitle: 'एउटा डिप्लोइमेन्टलाई साँच्चै के चाहिन्छ',
  onboarding: [
    {
      title: 'दृष्टिकोणहरू स्थापित गर्नुहोस्',
      body: 'एउटा दृष्टिकोण भनेको भण्डारण गरिएको स्थान, दिशा र झुकाव हो। जिम्मेवार निकायबाट सर्वेक्षण-स्तरका निर्देशांकहरूले नै एपलाई तस्बिर सङ्ग्रहबाट अनुगमन उपकरणमा बदल्छन्। सूचीले अब हरेक निर्देशांकको लागि जाँच्न सकिने स्रोत दर्ता गर्छ; साझेदार संरक्षकहरूले भने हरेक स्थिर बिन्दुलाई सञ्चालनमा ल्याउनुअघि जमिनमा नै प्रमाणित गर्छन्।',
    },
    {
      title: 'जिम्मेवार संरक्षकहरूलाई आमन्त्रण गर्नुहोस्',
      body: 'खाताहरू म्यानुअल रूपमा आमन्त्रित गरिन्छन् र इमेल म्याजिक लिङ्कबाट साइन इन गरिन्छ। हरेक सदस्यताले त्यो व्यक्तिले देख्न सक्ने ठाउँहरू नामाकरण गर्छ, र हरेक कारबाही ब्राउजरमा टाइप गरिएको नामभन्दा प्रमाणित सत्रबाट श्रेय पाउँछ।',
    },
    {
      title: 'आगन्तुकहरूलाई सर्वेक्षण गर्न दिनुहोस्',
      body: 'जसरी नि भ्रमण गर्ने मानिसहरूबाट कभरेज सञ्चित हुन्छ। तपाईंको लागत भनेको आइपुगेको कुरा पढ्ने ध्यान मात्र हो; फिल्डवर्कको भुक्तानी पर्यटनले पहिले नै गरिसकेको छ।',
    },
  ],
  callout: {
    title: 'किन पहुँच आमन्त्रण-मात्र छ',
    body: 'कुनै सार्वजनिक संरक्षक दर्ता छैन। म्याजिक लिङ्कले हरेक संस्थालाई ठाउँ-सीमित पहुँच र दिगो लेखा परीक्षण ट्रेल दिँदै पाइलटलाई हल्का राख्छ। ब्राउजर अनुरोध परिवर्तन गरिए पनि डाटाबेस नीतिहरूले उही सीमा लागू गर्छन्।',
  },
  finalKicker: 'हामीले के गर्दैनौं',
  finalTitle: 'अभिलेखसँग जोडिएका सर्तहरू',
  final: {
    intro:
      'कुनै संस्थालाई आफूले नबनाएको अभिलेखमाथि भरोसा गर्न भनिँदैछ। त्यो भरोसा अभिलेखमा के लेखिन्छ भन्नेमा स्वार्थ राख्ने अनुदानदातासँग टिक्दैन, त्यसैले',
    ethicsLinkLabel: 'नैतिकता नीति',
    makesExplicit: 'ले यो सीमा स्पष्ट पार्छ:',
    strongClaim: 'एपले अनुगमन गर्ने ठाउँभित्र सञ्चालित कुनै पनि व्यावसायिक संस्थाबाट पैसा होइन',
    afterStrong:
      ': स्मारक क्षेत्रभित्र वा छेउमा कुनै होटल, ट्राभल अपरेटर, पसल वा रेस्टुरेन्ट होइन। कुनै प्रायोजित सिफारिस छैन। आगन्तुकले साक्षी बसेको कुनै पनि कुरा बेचिँदैन, विज्ञापनदातालाई लाइसेन्स दिइँदैन, वा मार्केटिङ छविको रूपमा पुनः प्रयोग गरिँदैन।',
    secondParagraph:
      'प्रतिवेदनहरू संरक्षक खाताहरूले मात्र पढ्छन्, अरू कसैले होइन। एपले भन्ने हरेक तथ्य नामसहितको जाँच्न सकिने स्रोतमा पुग्छ, र जहाँ प्रमाण सकिन्छ त्यहाँ एपले खाली ठाउँ भर्नुको सट्टा त्यही भन्छ।',
  },
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
    alternates: { languages: { en: '/en/for-custodians', ne: '/ne/for-custodians' } },
  };
}

export default async function ForCustodiansPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const c = locale === 'ne' ? NE : EN;

  return (
    <main>
      <PageHero eyebrow={c.hero.eyebrow} title={c.hero.title} lede={c.hero.lede}>
        <Link
          href="/custodian"
          className="mt-9 inline-flex items-center gap-3 rounded-2xl bg-earth px-6 py-4 font-semibold text-white shadow-lg shadow-earth/25 transition hover:-translate-y-0.5 hover:bg-sandstone-deep"
        >
          {c.hero.cta}
          <ArrowRight className="size-5" aria-hidden />
        </Link>
      </PageHero>

      <Section kicker={c.dashboardKicker} title={c.dashboardTitle}>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((id) => {
            const Icon = ICONS[id];
            const { title, body } = c.features[id];
            return (
              <article key={id} className="rounded-3xl border border-line bg-surface p-7 shadow-sm">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-tirtha/10 text-tirtha">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-semibold text-ink">{title}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{body}</p>
              </article>
            );
          })}
        </div>
      </Section>

      <Section tone="deep" kicker={c.onboardingKicker} title={c.onboardingTitle}>
        <Steps steps={c.onboarding} />

        <Callout title={c.callout.title}>{c.callout.body}</Callout>
      </Section>

      <Section kicker={c.finalKicker} title={c.finalTitle}>
        <Prose>
          <p>
            {c.final.intro}{' '}
            <Link href={localeHref(locale, '/ethics')}>{c.final.ethicsLinkLabel}</Link>{' '}
            {c.final.makesExplicit}{' '}
            <strong>{c.final.strongClaim}</strong>
            {c.final.afterStrong}
          </p>
          <p>{c.final.secondParagraph}</p>
        </Prose>
      </Section>
    </main>
  );
}
