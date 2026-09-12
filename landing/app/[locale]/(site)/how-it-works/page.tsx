import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Crosshair, ShieldAlert, Sparkles } from 'lucide-react';

import { Callout, PageHero, Prose, Section, Steps } from '@/components/ui';
import { localeHref, type Locale } from '@/lib/i18n';
import { SURFACES } from '@/lib/site';

const EN = {
  metaTitle: 'How it works',
  metaDescription:
    'A visitor stands at a fixed viewpoint, lines their phone up with it, and photographs what is there today. Years later the two photographs line up. Here is every step of that loop, and what the app records at each one.',
  hero: {
    eyebrow: 'How it works',
    title: 'One photograph, taken from a known spot on a known day',
    lede: 'Everything else in the app, the map, the history, the AI, the quests, exists to help you make, understand, act on, or care about that single thing. Here is the loop, step by step, and what the record keeps at each one.',
  },
  loopKicker: 'The loop',
  loopTitle: 'From standing there to a report someone acts on',
  evidenceKicker: 'What makes it evidence',
  evidenceTitle: 'The difference between a photo album and a monitoring record',
  evidenceIntro:
    'Anybody can photograph a monument. What makes a series usable to a conservator is that every frame carries enough information to be compared with the others, and that the record is honest about how good that information was.',
  callouts: {
    measurement: {
      title: 'A measurement is never faked',
      body: 'If the GPS never got a fix, the record stores unknown, not zero. Zero would read as a perfect reading, and one such row would quietly poison a decade of comparisons.',
    },
    byEye: {
      title: '"By eye" never dresses up as "measured"',
      body: 'Conditions are sometimes bad: dense tree cover, a crowd, a phone with a confused compass. You can still frame the shot by eye and record it. The record then says it was done by eye, and it looks different on screen. A refusal to lock is a valid outcome, never an error.',
    },
    neverDeleted: {
      title: 'Nothing is ever deleted',
      body: 'A photograph is evidence. A mistake is corrected by adding a new record that says what it supersedes, never by writing over the old one. That is what lets somebody in ten years reconstruct not just what was seen but what was believed at the time.',
    },
  },
  placesKicker: 'Where you do it',
  placesTitle: 'Three places, and only three',
  placesIntro:
    'The app has exactly three destinations. They are the idea of the product rather than a navigation convenience, which is why there is no Home, no Explore, no Profile and no Rewards tab. Adding one is meant to require a hard decision.',
  offlineKicker: 'Offline first',
  offlineTitle: 'It has to work where there is no signal',
  offline: [
    'A phone in the Sacred Garden at Lumbini can go hours without a usable connection, and the moment you are standing at the vantage is not reschedulable. So every record is written to a real database on the phone first, and synchronised afterwards whenever a network turns up.',
    'The map works from tiles already on the device. The reference content (sites, viewpoints, history, narration) ships inside the app. Even the knowledge engine has an offline path: the built-in collection of source texts still answers, and an optional small model can be downloaded to the phone to phrase those passages, though it is never permitted to add a fact of its own.',
  ],
  offlineClosing: {
    strong: 'The network is an optimisation, not a dependency.',
    rest: 'Nothing about the loop above requires one.',
  },
};

const NE: typeof EN = {
  metaTitle: 'यसरी काम गर्छ',
  metaDescription:
    'आगन्तुक एउटा स्थिर दृष्टिकोणमा उभिन्छ, फोनलाई त्यससँग मिलाउँछ, र आज त्यहाँ के छ भन्ने तस्बिर खिच्छ। वर्षौंपछि दुई तस्बिर मिल्छन्। त्यो लूपको हरेक चरण, र हरेकमा एपले के दर्ता गर्छ भन्ने यहाँ छ।',
  hero: {
    eyebrow: 'यसरी काम गर्छ',
    title: 'चिनिएको दिनमा चिनिएको ठाउँबाट खिचिएको एउटा तस्बिर',
    lede: 'एपमा भएका अरू सबै कुरा, नक्सा, इतिहास, AI, अभियानहरू, त्यही एउटा कुरा बनाउन, बुझ्न, त्यसमा कारबाही गर्न, वा त्यसको वास्ता गर्न मद्दत गर्नकै लागि अस्तित्वमा छन्। लूप यहाँ चरणैपिच्छे छ, र हरेक चरणमा अभिलेखले के राख्छ भन्ने पनि।',
  },
  loopKicker: 'लूप',
  loopTitle: 'त्यहाँ उभिनुदेखि कसैले कारबाही गर्ने प्रतिवेदनसम्म',
  evidenceKicker: 'यसलाई प्रमाण बनाउने कुरा',
  evidenceTitle: 'तस्बिर एल्बम र अनुगमन अभिलेखबीचको फरक',
  evidenceIntro:
    'जोसुकैले पनि स्मारकको तस्बिर खिच्न सक्छ। एउटा शृंखलालाई संरक्षकका लागि उपयोगी बनाउने कुरा भनेको हरेक फ्रेमले अरूसँग तुलना गर्न पुग्ने जानकारी बोकेको हुनु हो, र त्यो जानकारी कति राम्रो थियो भन्नेमा अभिलेख इमानदार हुनु हो।',
  callouts: {
    measurement: {
      title: 'मापन कहिल्यै नक्कली बनाइँदैन',
      body: 'यदि GPS ले कहिल्यै ठ्याक्कै स्थान भेट्टाएन भने, अभिलेखले अज्ञात भनी भण्डारण गर्छ, शून्य होइन। शून्यले एउटा उत्तम रिडिङजस्तो देखिन्थ्यो, र त्यस्तो एउटा पङ्क्तिले चुपचाप दशकौंको तुलनालाई बिगार्थ्यो।',
    },
    byEye: {
      title: '"आँखाले" कहिल्यै "नापिएको" जस्तो देखिँदैन',
      body: "अवस्था कहिलेकाहीं खराब हुन्छ: बाक्लो रूखको छहारी, भीड, वा दिशाभ्रमित कम्पास भएको फोन। तपाईंले फेरि पनि आँखाले अन्दाज गरेर शट फ्रेम गर्न र दर्ता गर्न सक्नुहुन्छ। त्यसपछि अभिलेखले यो आँखाले गरिएको हो भनी भन्छ, र स्क्रिनमा यो फरक देखिन्छ। लक नहुनु पनि मान्य नतिजा हो, कहिल्यै त्रुटि होइन।",
    },
    neverDeleted: {
      title: 'केही पनि कहिल्यै मेटाइँदैन',
      body: 'एउटा तस्बिर प्रमाण हो। कुनै गल्तीलाई नयाँ अभिलेख थपेर सच्याइन्छ जसले आफूले के प्रतिस्थापन गर्छ भनी बताउँछ, पुरानोमाथि नलेखी। यसैले गर्दा दस वर्षपछि कसैले के देखिएको थियो मात्र होइन, त्यसबेला के विश्वास गरिएको थियो भन्ने पनि पुनर्निर्माण गर्न सक्छ।',
    },
  },
  placesKicker: 'तपाईं कहाँ गर्नुहुन्छ',
  placesTitle: 'तीन ठाउँ, र तीनवटा मात्र',
  placesIntro:
    'एपमा ठ्याक्कै तीनवटा गन्तव्य छन्। तिनीहरू नेभिगेसनको सुविधाभन्दा उत्पादनको मूल विचार हुन्, त्यसैले कुनै Home, कुनै Explore, कुनै Profile र कुनै Rewards ट्याब छैन। थप्नु भनेको कठिन निर्णय लिनुपर्ने कुरा हो।',
  offlineKicker: 'पहिले अफलाइन',
  offlineTitle: 'जहाँ सिग्नल छैन त्यहाँ पनि यसले काम गर्नैपर्छ',
  offline: [
    'लुम्बिनीको पवित्र उद्यानमा फोनले प्रयोगयोग्य जडान बिना घण्टौं बिताउन सक्छ, र तपाईं दृष्टिकोणमा उभिएको क्षणलाई पछि सार्न मिल्दैन। त्यसैले हरेक अभिलेख पहिले फोनको वास्तविक डाटाबेसमा लेखिन्छ, र पछि नेटवर्क भेटिएपिच्छे सिंक्रोनाइज हुन्छ।',
    'नक्सा डिभाइसमा पहिले नै भएका टाइलहरूबाट काम गर्छ। सन्दर्भ सामग्री (ठाउँ, दृष्टिकोण, इतिहास, वर्णन) एपभित्रै ढुवानी हुन्छ। ज्ञान इन्जिनसँग समेत अफलाइन बाटो छ: स्रोत पाठहरूको निर्मित सङ्ग्रहले अझै जवाफ दिन्छ, र ती अंशहरूलाई वाक्यमा उतार्न फोनमा एउटा वैकल्पिक सानो मोडेल डाउनलोड गर्न सकिन्छ, यद्यपि यसलाई आफ्नै तर्फबाट कुनै तथ्य थप्ने अनुमति कहिल्यै छैन।',
  ],
  offlineClosing: {
    strong: 'नेटवर्क एउटा अनुकूलन हो, निर्भरता होइन।',
    rest: 'माथिको लूपमा कुनै पनि कुराले नेटवर्क माग्दैन।',
  },
};

function captureSteps(locale: Locale): { title: string; body: ReactNode }[] {
  if (locale === 'ne') {
    return [
      {
        title: 'ठाउँ, अनि दृष्टिकोण छान्नुहोस्',
        body: (
          <>
            एउटा <strong>दृष्टिकोण</strong> &ldquo;स्तूपको नजिकै कतै&rdquo; होइन। यो
            भण्डारण गरिएको स्थान, दिशा र झुकाव हो: जमिनमा एउटा बिन्दु र फर्किने दिशा।
            एपले हरेक ठाउँका लागि यस्ता दृष्टिकोणहरूको सेट राख्छ, र कुनै अभियानले
            सबैभन्दा धेरै तस्बिर खिचिएको ठाउँतिर होइन, सबैभन्दा लामो समयदेखि पुनः
            नभ्रमण गरिएको ठाउँतिर देखाउँछ।
          </>
        ),
      },
      {
        title: 'फोनलाई मिलाउनुहोस्',
        body: (
          <>
            तपाईंको स्थिति, दिशा र झुकाव भण्डारण गरिएको दृष्टिकोणसँग कति राम्ररी
            मिल्छ भनेर स्क्रिनले GPS, कम्पास र गति सेन्सरहरू सँगै प्रयोग गरेर स्कोर
            गर्छ। जब मिलान साँच्चै नजिक हुन्छ <em>र</em> GPS शुद्धता भर पर्न लायक
            हुन्छ, फ्रेम लक हुन्छ। सम्पूर्ण एपमा एउटै रङले लक भएको जनाउँछ, त्यसैले
            दिउँसोको उज्यालोमा पनि यो एकै नजरमा बुझिन्छ।
          </>
        ),
      },
      {
        title: 'तस्बिर खिच्नुहोस्',
        body: (
          <>
            तस्बिर फोनको आफ्नै भण्डारणमा लेखिन्छ र कतै पनि पठाइनुअघि नै डिभाइसको
            डाटाबेसमा दर्ता हुन्छ। कुनै खास दिन कुनै दृष्टिकोणबाट खिचिएको तस्बिर
            फेरि खिच्न सकिँदैन, त्यसैले फोन नै अभिलेख हो र नेटवर्क यसको प्रतिलिपि
            मात्र हो।
          </>
        ),
      },
      {
        title: 'देख्न सक्ने कुरा टिप्नुहोस्',
        body: (
          <>
            एउटा छोटो अवस्था प्रतिवेदन: के परिवर्तन भएको छ, के क्षतिग्रस्त देखिन्छ,
            के हराइरहेको छ। एपले तस्बिर हेर्छ र आफूले भेट्टाएको ठानेको दरारहरू
            सुझाउँछ, थोप्ला-थोप्ला रेखाको रूपमा कोरिएको, ताकि कसैले पनि सुझावलाई
            निष्कर्ष नठानोस्। यो कति गम्भीर छ भनेर तपाईंले नै निर्णय गर्नुहुन्छ। AI
            ले कहिल्यै गर्दैन।
          </>
        ),
      },
      {
        title: 'यो जिम्मेवार व्यक्तिसम्म पुग्छ',
        body: (
          <>
            प्रतिवेदन ठाउँको कभरेज र यसको स्वीकृतिसम्मको मध्यम समयसँगै संरक्षकको
            ड्यासबोर्डमा देखिन्छ। एउटा संरक्षकले यसलाई स्वीकार गर्न सक्छ, प्रगतिमा
            रहेको चिन्ह लगाउन सक्छ, वा टिप्पणीसहित समाधान गर्न सक्छ, र वास्तविक GIS
            वर्कफ्लोका लागि सम्पूर्ण सेटलाई CSV वा GeoJSON को रूपमा निर्यात गर्न
            सक्छ।{' '}
            <Link href={localeHref(locale, '/for-custodians')}>
              संरक्षक पक्षका बारे थप।
            </Link>
          </>
        ),
      },
    ];
  }

  return [
    {
      title: 'Pick a site, then a viewpoint',
      body: (
        <>
          A <strong>vantage</strong> is not &ldquo;somewhere near the stupa&rdquo;. It is a
          stored position, bearing and tilt: a spot on the ground and a direction
          to face. The app holds a set of them for each site, and a quest points at
          whichever one has gone longest without being revisited, rather than at
          whichever is most photographed.
        </>
      ),
    },
    {
      title: 'Line the phone up',
      body: (
        <>
          The screen scores how well your position, heading and tilt match the
          stored vantage, using GPS, compass and the motion sensors together. When
          the match is genuinely close <em>and</em> the GPS accuracy is good enough
          to trust, the frame locks. One colour in the whole app means locked, so
          it reads at a glance in daylight.
        </>
      ),
    },
    {
      title: 'Take the photograph',
      body: (
        <>
          The image is written to the phone&apos;s own storage and recorded in a
          database on the device before anything is sent anywhere. A photograph
          taken at a viewpoint on a particular day cannot be retaken, so the phone
          is the record and the network is a copy of it.
        </>
      ),
    },
    {
      title: 'Note what you can see',
      body: (
        <>
          A short condition report: what has changed, what looks damaged, what is
          missing. The app looks at the photograph and suggests cracks it thinks it
          has found, drawn as dashed outlines so nobody mistakes a suggestion for a
          finding. You decide how serious it is. The AI never does.
        </>
      ),
    },
    {
      title: 'It reaches whoever is responsible',
      body: (
        <>
          The report appears on the custodian&apos;s dashboard alongside the site&apos;s
          coverage and its median time to acknowledgement. A custodian can
          acknowledge it, mark it in progress, or resolve it with a note, and
          export the whole set as CSV or GeoJSON for a real GIS workflow.{' '}
          <Link href={localeHref(locale, '/for-custodians')}>More on the custodian side.</Link>
        </>
      ),
    },
  ];
}

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
    alternates: { languages: { en: '/en/how-it-works', ne: '/ne/how-it-works' } },
  };
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const c = locale === 'ne' ? NE : EN;

  return (
    <main>
      <PageHero eyebrow={c.hero.eyebrow} title={c.hero.title} lede={c.hero.lede} />

      <Section kicker={c.loopKicker} title={c.loopTitle}>
        <Steps steps={captureSteps(locale)} />
      </Section>

      <Section tone="deep" kicker={c.evidenceKicker} title={c.evidenceTitle}>
        <Prose>
          <p>{c.evidenceIntro}</p>
        </Prose>

        <Callout title={c.callouts.measurement.title} Icon={Crosshair}>
          {c.callouts.measurement.body}
        </Callout>

        <Callout title={c.callouts.byEye.title} Icon={ShieldAlert}>
          {c.callouts.byEye.body}
        </Callout>

        <Callout title={c.callouts.neverDeleted.title} Icon={Sparkles}>
          {c.callouts.neverDeleted.body}
        </Callout>
      </Section>

      <Section kicker={c.placesKicker} title={c.placesTitle}>
        <Prose>
          <p>{c.placesIntro}</p>
        </Prose>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {SURFACES.map(({ name, accent, chip, rule, en, ne }) => {
            const s = locale === 'ne' ? ne : en;
            return (
              <article
                key={name}
                className="relative overflow-hidden rounded-3xl border border-line bg-surface p-7 shadow-sm"
              >
                <span className={`absolute inset-x-0 top-0 h-1 ${rule}`} />
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${chip} ${accent}`}
                >
                  {s.subtitle}
                </span>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
                  {name}
                </h3>
                <p className="mt-1 text-sm text-ink-muted italic">{s.means}</p>
                <p className="mt-4 leading-relaxed text-ink-soft">{s.body}</p>
              </article>
            );
          })}
        </div>
      </Section>

      <Section tone="deep" kicker={c.offlineKicker} title={c.offlineTitle}>
        <Prose>
          {c.offline.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
          <p>
            <strong>{c.offlineClosing.strong}</strong> {c.offlineClosing.rest}
          </p>
        </Prose>
      </Section>
    </main>
  );
}
