import type { Metadata } from 'next';
import Link from 'next/link';
import { Cpu, Database, FileText, Map as MapIcon, WifiOff } from 'lucide-react';

import { Callout, Ledger, PageHero, Prose, Section } from '@/components/ui';
import { type Locale } from '@/lib/i18n';
import { REPO_URL, REPORTS } from '@/lib/site';

const ICONS = {
  'device-record': WifiOff,
  'cloud-record': Database,
  vision: Cpu,
  answers: FileText,
  maps: MapIcon,
} as const;

const EN = {
  metaTitle: 'Technology',
  metaDescription:
    'React Native and Expo on the phone, an append-only SQLite ledger, Postgres with PostGIS and pgvector in the cloud, and two AI models that propose rather than decide. The full engineering report is a four-page PDF.',
  hero: {
    eyebrow: 'Technology',
    title: 'Built to still be readable in twenty years',
    lede: 'A conservation record is only worth making if it outlives the software that made it. That single requirement decides most of what follows: open formats, one database, records written locally first, and AI that is never allowed the last word.',
    cta: 'Read the full engineering report',
    ctaMeta: (pages: number) => `PDF · ${pages} pages`,
  },
  stackKicker: 'The stack',
  stackTitle: 'What each layer is, and why it is there',
  layers: {
    'device-record': {
      name: 'The record, on the device',
      stack: 'expo-sqlite (WAL) · versioned migrations',
      body: 'A real SQL database on the phone, written as an append-only ledger. Observations, condition reports and corrections are all inserts; a mistake is fixed by a row that supersedes another, never by overwriting it. This is what makes the offline guarantee structural rather than a promise.',
    },
    'cloud-record': {
      name: 'The record, in the cloud',
      stack: 'Postgres · PostGIS · pgvector · row-level security',
      body: 'One database, three extensions. PostGIS makes "what within 500 m has gone longest without a resurvey" an index rather than a loop, and makes the GeoJSON export a real GIS artefact. pgvector holds the knowledge corpus. Authorisation lives in the database, so the phone, the dashboard and any future integration share one rule set.',
    },
    vision: {
      name: 'Vision, on the phone',
      stack: 'ONNX Runtime with XNNPACK · a YOLO-family segmentation model',
      body: 'The damage detector runs on the handset, because the network is not there at the moment it is needed and because a photograph of a monument should not have to leave the country to be looked at. It proposes candidates as dashed outlines. A person confirms severity, and the report records that the AI assisted.',
    },
    answers: {
      name: 'Answers that can be checked',
      stack: 'retrieval → synthesis → verification, with a refusal path',
      body: 'The Dhamma engine retrieves passages from a fixed corpus: the Pali canon alongside the ICOMOS Venice and Burra Charters, UNESCO World Heritage records and named Kathmandu Valley archaeology, writes only from those passages, and checks that every claim resolves to one. When it cannot, it refuses. Source text and citations are never machine-translated.',
    },
    maps: {
      name: 'Maps that work without a signal',
      stack: 'MapLibre GL Native · vector tiles served from object storage',
      body: 'An open renderer over an open basemap, so a regional extract can be downloaded before a visit and used with no connection at all. And the map bill does not grow with the number of people we most want using it.',
    },
  },
  phoneCallout: {
    title: 'On the phone itself',
    body: 'The app is React Native on Expo, with file-based routing, and the New Architecture enabled, which the vision module requires. One codebase covers Android and iOS while still reaching the camera, GPS, compass and two AI runtimes through native modules.',
  },
  rulesKicker: 'The rules',
  rulesTitle: 'Five constraints the code actually enforces',
  rulesIntro:
    'These are not aspirations in a document. Several of them are checked automatically, and the build fails when one is broken.',
  ledgerHeadings: ['The rule', 'What it costs, and why we pay it'] as [string, string],
  ledgerRows: [
    {
      left: 'A measurement is never faked.',
      right:
        'An unknown reading is stored as unknown, never as zero. Some records are therefore less complete than they could appear to be: that is the point.',
    },
    {
      left: '"By eye" is never dressed up as "measured".',
      right:
        'A shot framed without a sensor lock is marked, and looks different. Fewer records read as authoritative, and the ones that do can be trusted.',
    },
    {
      left: 'The AI suggests; it never decides.',
      right:
        'The detector cannot set severity and the answer engine refuses rather than guesses. The product is slower and says "I do not know" more often than a competitor would.',
    },
    {
      left: 'Nothing is deleted.',
      right:
        'Corrections are added, not applied over the top. Storage grows and the history is heavier to read, but it stays auditable.',
    },
    {
      left: 'The device is the source of truth.',
      right:
        'Every write lands locally first. Synchronisation is harder to build than a straight API call, and the app keeps working where there is no signal at all.',
    },
  ],
  sixthRule: {
    before: 'A sixth rule has no technical cost and is enforced by a linter anyway:',
    strong: 'no gamification vocabulary',
    after:
      '. Streaks, XP, levels, badges and points reward volume, and volume is the wrong incentive for evidence. Merit here is',
    em: 'puṇya',
    tail: ': unscored, unspendable, and untransferable.',
  },
  opennessKicker: 'Openness',
  opennessTitle: 'Everything here has an exit',
  opennessBefore:
    'Each managed service in the stack is chosen so that leaving it is a migration rather than a rewrite. Postgres is Postgres. Object storage is a byte copy. SQLite and the map archive are files. MapLibre and the inference runtime are open source, and',
  opennessLinkLabel: 'the whole codebase is public',
  opennessAfter: '.',
  opennessSecond:
    'That matters more here than in most products. An institution being asked to build a decade of monitoring record on a piece of software is entitled to know what happens to that record if the people who wrote the software move on.',
};

const NE: typeof EN = {
  metaTitle: 'प्रविधि',
  metaDescription:
    'फोनमा React Native र Expo, थप-मात्र SQLite लेजर, क्लाउडमा PostGIS र pgvector सहितको Postgres, र निर्णय नगरी सुझाव मात्र दिने दुई AI मोडेल। पूरा इन्जिनियरिङ प्रतिवेदन चार-पृष्ठको PDF हो।',
  hero: {
    eyebrow: 'प्रविधि',
    title: 'बीस वर्षपछि पनि पढ्न सकिने गरी बनाइएको',
    lede: 'संरक्षण अभिलेख बनाउनु तब मात्र सार्थक हुन्छ जब यो बनाउने सफ्टवेयरभन्दा बढी समय टिक्छ। यही एउटा आवश्यकताले पछिका धेरैजसो कुरा तय गर्छ: खुला ढाँचाहरू, एउटै डाटाबेस, पहिले स्थानीय रूपमा लेखिने अभिलेखहरू, र कहिल्यै अन्तिम शब्द नपाउने AI।',
    cta: 'पूरा इन्जिनियरिङ प्रतिवेदन पढ्नुहोस्',
    ctaMeta: (pages: number) => `PDF · ${pages} पृष्ठ`,
  },
  stackKicker: 'स्ट्याक',
  stackTitle: 'हरेक तह के हो, र यो किन त्यहाँ छ',
  layers: {
    'device-record': {
      name: 'अभिलेख, डिभाइसमा',
      stack: 'expo-sqlite (WAL) · versioned migrations',
      body: 'फोनमा एउटा वास्तविक SQL डाटाबेस छ, जुन थप-मात्र लेजरको रूपमा लेखिन्छ। अवलोकन, अवस्था प्रतिवेदन र सुधारहरू सबै इन्सर्ट हुन्; कुनै गल्ती अर्को पङ्क्तिले प्रतिस्थापन गरेर सच्याइन्छ, कहिल्यै त्यसमाथि नलेखी। यसैले अफलाइन ग्यारेन्टीलाई वाचाभन्दा संरचनात्मक बनाउँछ।',
    },
    'cloud-record': {
      name: 'अभिलेख, क्लाउडमा',
      stack: 'Postgres · PostGIS · pgvector · row-level security',
      body: 'एउटै डाटाबेस, तीन विस्तार। PostGIS ले "500 मिटरभित्र सबैभन्दा लामो समयदेखि पुनः सर्वेक्षण नभएको के छ" भन्ने कुरालाई लूपभन्दा इन्डेक्स बनाउँछ, र GeoJSON निर्यातलाई साँचो GIS कलाकृति बनाउँछ। pgvector ले ज्ञान सामग्री राख्छ। प्राधिकरण डाटाबेसमै बस्छ, त्यसैले फोन, ड्यासबोर्ड र भविष्यको कुनै पनि एकीकरणले एउटै नियमसेट बाँड्छन्।',
    },
    vision: {
      name: 'दृष्टि, फोनमा',
      stack: 'ONNX Runtime with XNNPACK · a YOLO-family segmentation model',
      body: 'क्षति पत्ता लगाउने प्रणाली ह्यान्डसेटमै चल्छ, किनभने आवश्यक परेको क्षणमा नेटवर्क त्यहाँ हुँदैन र किनभने स्मारकको तस्बिर हेरिनका लागि देशबाहिर जानुपर्ने हुनु हुँदैन। यसले सम्भावित ठाउँहरू थोप्ला-थोप्ला रेखाको रूपमा सुझाउँछ। व्यक्तिले गम्भीरता पुष्टि गर्छ, र प्रतिवेदनले AI ले सघाएको कुरा दर्ता गर्छ।',
    },
    answers: {
      name: 'जाँच्न सकिने जवाफहरू',
      stack: 'retrieval → synthesis → verification, with a refusal path',
      body: 'धम्म इन्जिनले एउटा निश्चित सामग्रीबाट अंशहरू झिक्छ: पाली त्रिपिटकसँगै ICOMOS भेनिस र बुर्रा वडापत्र, UNESCO विश्व सम्पदा अभिलेख र नामाकित काठमाडौं उपत्यका पुरातत्त्व, ती अंशहरूबाट मात्र लेख्छ, र हरेक दाबी एउटामा पुग्छ भनी जाँच्छ। जब यो सक्दैन, यसले अस्वीकार गर्छ। स्रोत पाठ र उद्धरणहरू कहिल्यै मेसिन-अनुवाद गरिँदैनन्।',
    },
    maps: {
      name: 'सिग्नल नभएर पनि काम गर्ने नक्साहरू',
      stack: 'MapLibre GL Native · vector tiles served from object storage',
      body: 'एउटा खुला बेसम्यापमाथिको खुला रेन्डरर, त्यसैले भ्रमणअघि क्षेत्रीय उद्धरण डाउनलोड गर्न सकिन्छ र कुनै जडान नभई पनि प्रयोग गर्न सकिन्छ। र नक्सा बिल हामीले सबैभन्दा बढी प्रयोग गरोस् भन्ने चाहेका मानिसहरूको सङ्ख्यासँगै बढ्दैन।',
    },
  },
  phoneCallout: {
    title: 'फोनमा नै',
    body: 'एप React Native र Expo मा बनेको हो, फाइल-आधारित राउटिङसहित, र New Architecture सक्षम गरिएको छ, जुन दृष्टि मोड्युललाई चाहिन्छ। एउटै कोडबेसले क्यामेरा, GPS, कम्पास र दुई AI रनटाइमसम्म नेटिभ मोड्युलमार्फत पुग्दै Android र iOS दुवैलाई समेट्छ।',
  },
  rulesKicker: 'नियमहरू',
  rulesTitle: 'कोडले साँच्चै लागू गर्ने पाँच सीमाहरू',
  rulesIntro:
    'यी कुनै कागजातका आकांक्षा होइनन्। तीमध्ये धेरैलाई स्वचालित रूपमा जाँचिन्छ, र कुनै एक भङ्ग भएमा बिल्ड नै असफल हुन्छ।',
  ledgerHeadings: ['नियम', 'यसको मूल्य के हो, र हामी किन तिर्छौं'] as [string, string],
  ledgerRows: [
    {
      left: 'मापन कहिल्यै नक्कली बनाइँदैन।',
      right:
        'अज्ञात रिडिङ अज्ञात नै भनी भण्डारण गरिन्छ, कहिल्यै शून्य होइन। केही अभिलेख देखिनुभन्दा कम पूर्ण हुन्छन्: त्यही नै मुख्य कुरा हो।',
    },
    {
      left: '"आँखाले" गरिएको कहिल्यै "नापिएको" जस्तो देखाइँदैन।',
      right:
        'सेन्सर लक बिना फ्रेम गरिएको शट चिन्हित हुन्छ, र फरक देखिन्छ। कम अभिलेखहरू आधिकारिक देखिन्छन्, तर जे देखिन्छन् तिनलाई भरोसा गर्न सकिन्छ।',
    },
    {
      left: 'AI ले सुझाव दिन्छ; यसले कहिल्यै निर्णय गर्दैन।',
      right:
        'पत्ता लगाउने प्रणालीले गम्भीरता तय गर्न सक्दैन र जवाफ इन्जिनले अनुमान लगाउनुभन्दा अस्वीकार गर्छ। उत्पादन ढिलो छ र प्रतिस्पर्धीले भन्दाभन्दै बढी पटक "मलाई थाहा छैन" भन्छ।',
    },
    {
      left: 'केही पनि मेटाइँदैन।',
      right:
        'सुधारहरू माथि नथोपेर थपिन्छन्। भण्डारण बढ्छ र इतिहास पढ्न गाह्रो हुन्छ, तर यो जाँच्न सकिने नै रहन्छ।',
    },
    {
      left: 'डिभाइस नै साँचोको स्रोत हो।',
      right:
        'हरेक लेखाइ पहिले स्थानीय रूपमा पुग्छ। सोझो API कलभन्दा सिंक्रोनाइजेसन बनाउन गाह्रो छ, र सिग्नल नभएको ठाउँमा पनि एप काम गरिरहन्छ।',
    },
  ],
  sixthRule: {
    before: 'छैटौं नियमको कुनै प्राविधिक मूल्य छैन तर लिन्टरले जसरी नि यसलाई लागू गर्छ:',
    strong: 'कुनै खेलीकरण शब्दावली छैन',
    after:
      '। स्ट्रिक, XP, तह, ब्याज र अङ्कले परिमाणलाई इनाम दिन्छन्, र परिमाण प्रमाणका लागि गलत प्रोत्साहन हो। यहाँ मेरिट भनेको',
    em: 'पुण्य',
    tail: ' हो: अनस्कोर्ड, अखर्चनीय, र अहस्तान्तरणीय।',
  },
  opennessKicker: 'खुलापन',
  opennessTitle: 'यहाँ भएको हरेक कुराको बाहिरिने बाटो छ',
  opennessBefore:
    'स्ट्याकमा भएको हरेक व्यवस्थित सेवा यसरी छानिएको छ कि यसलाई छोड्नु पुनर्लेखन होइन, बरु आप्रवासन (माइग्रेसन) हो। Postgres नै Postgres हो। अब्जेक्ट भण्डारण एउटा बाइट प्रतिलिपि हो। SQLite र नक्सा अभिलेखागार फाइलहरू हुन्। MapLibre र इन्फरेन्स रनटाइम खुला स्रोत हुन्, र',
  opennessLinkLabel: 'सम्पूर्ण कोडबेस सार्वजनिक छ',
  opennessAfter: '।',
  opennessSecond:
    'यो कुरा धेरैजसो उत्पादनभन्दा यहाँ बढी मायने राख्छ। कुनै सफ्टवेयरको टुक्रामाथि दशकौंको अनुगमन अभिलेख बनाउन भनिएको संस्थाले सफ्टवेयर लेख्नेहरू अगाडि बढेपछि त्यो अभिलेखलाई के हुन्छ भनेर जान्न पाउनुपर्छ।',
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
    alternates: { languages: { en: '/en/technology', ne: '/ne/technology' } },
  };
}

export default async function TechnologyPage({
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
          href={REPORTS.techStack.href}
          className="mt-9 inline-flex items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-4 font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <FileText className="size-5 text-sakshi" aria-hidden />
          {c.hero.cta}
          <span className="text-sm font-normal text-ink-muted">
            {c.hero.ctaMeta(REPORTS.techStack.pages)}
          </span>
        </Link>
      </PageHero>

      <Section kicker={c.stackKicker} title={c.stackTitle}>
        <div className="mt-8 space-y-4">
          {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((id) => {
            const Icon = ICONS[id];
            const { name, stack, body } = c.layers[id];
            return (
              <article
                key={id}
                className="flex gap-5 rounded-3xl border border-line bg-surface p-7 shadow-sm"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sakshi/10 text-sakshi">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
                    {name}
                  </h3>
                  <p className="mt-1 font-mono text-sm text-ink-muted">{stack}</p>
                  <p className="mt-3 leading-relaxed text-ink-soft">{body}</p>
                </div>
              </article>
            );
          })}
        </div>

        <Callout title={c.phoneCallout.title} Icon={Cpu}>
          {c.phoneCallout.body}
        </Callout>
      </Section>

      <Section tone="deep" kicker={c.rulesKicker} title={c.rulesTitle}>
        <Prose>
          <p>{c.rulesIntro}</p>
        </Prose>

        <Ledger headings={c.ledgerHeadings} rows={c.ledgerRows} />

        <Prose>
          <p className="mt-8">
            {c.sixthRule.before} <strong>{c.sixthRule.strong}</strong>
            {c.sixthRule.after} <em>{c.sixthRule.em}</em>
            {c.sixthRule.tail}
          </p>
        </Prose>
      </Section>

      <Section kicker={c.opennessKicker} title={c.opennessTitle}>
        <Prose>
          <p>
            {c.opennessBefore} <a href={REPO_URL}>{c.opennessLinkLabel}</a>
            {c.opennessAfter}
          </p>
          <p>{c.opennessSecond}</p>
        </Prose>
      </Section>
    </main>
  );
}
