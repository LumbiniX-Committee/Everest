import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Compass,
  Cpu,
  Download,
  FileText,
  Landmark,
  Navigation,
  Settings,
  ShieldCheck,
  Smartphone,
  WifiOff,
} from 'lucide-react';

import { AlignmentDial } from '@/components/AlignmentDial';
import { GreetingMonk } from '@/components/GreetingMonk';
import { MapExplorer } from '@/components/MapExplorer';
import { CountUp, Reveal } from '@/components/motion';
import { formatBuildDate, getLatestBuild } from '@/lib/eas';
import { localeHref, type Locale } from '@/lib/i18n';
import { REPORTS, SURFACES } from '@/lib/site';
import { SITES } from '@/lib/generated/explorer';

/**
 * The page re-resolves the latest EAS build on this interval, so publishing a
 * new APK updates the download button without a redeploy.
 *
 * Next parses this export statically and rejects an imported constant, so the
 * literal cannot be shared with REVALIDATE_SECONDS in lib/eas.ts. Keep the two
 * in step.
 */
export const revalidate = 300;

const vantageTotal = SITES.reduce((n, s) => n + s.vantages, 0);
const sourceTotal = SITES.reduce((n, s) => n + s.sources.length, 0);

const ICONS = {
  wisdom: Compass,
  navigation: Navigation,
  measurement: ShieldCheck,
  ai: Cpu,
  offline: WifiOff,
  custodian: Landmark,
} as const;

const INSTALL_ICONS = [Download, Settings, Check] as const;

const EN = {
  metaTitle: 'Sākṣī: A living map of a sacred landscape',
  metaDescription:
    'A real-time map explorer for the heritage sites of Lumbini and the Kathmandu Valley. Walk, and the places you reach speak, as deeply as you asked, from sources you can check. Everything else the app does exists so that walking through a place also leaves a record of it behind.',
  hero: {
    badge: 'Live across Lumbini and the Kathmandu Valley',
    title: (
      <>
        A living map of a<br className="hidden sm:block" /> sacred landscape
      </>
    ),
    lede: 'Sākṣī is a real-time map explorer for heritage sites. Walk, and the places you reach speak, as deeply as you asked them to, from sources you can check. Everything else the app does exists so that walking through a place also leaves a record of it behind.',
    exploreCta: 'Explore the map',
    getAppCta: 'Get the app',
    android: 'Android 7.0 and above',
    version: 'Version',
    build: (n: string) => `(build ${n})`,
    built: (date: string) => `Built ${date}`,
  },
  explorer: {
    kicker: 'The explorer',
    title:
      'Fifteen real places, their real coordinates, and everything they can say for themselves',
    lede: "This is not a picture of the app. It is the app's own data, generated from the same seed files the phone ships with. Move the wisdom control and watch a place say more without ever saying anything it cannot source.",
    stats: [
      { k: 'heritage sites live', n: 'across two UNESCO regions' },
      { k: 'established viewpoints', n: 'each a stored position, bearing and tilt' },
      { k: 'cited records behind the content', n: 'UNESCO, survey and excavation reports' },
      { k: 'depths a place can speak at', n: 'you choose; nothing arrives unasked' },
    ],
  },
  identityKicker: 'What holds it up',
  identityTitle: 'A map anyone can build. These are the parts that are ours.',
  identityLede:
    'Six commitments, each of which costs us something. Together they are the difference between an app that describes a place and one that can be trusted to have measured it.',
  identity: {
    wisdom: {
      name: 'Wisdom that deepens as you move',
      body: 'A place speaks when you reach it, at the depth you asked for: a line, or the full record with its facts, its sources, and the canonical passages it rests on. The ladder is built from material that was already written and already cited, so more depth never means more confidence.',
      accent: 'text-tirtha',
      chip: 'bg-tirtha/10',
    },
    navigation: {
      name: 'Navigation that points at the gaps',
      body: 'Routes are not generated from popularity. The next place the app sends you to is the viewpoint that has gone longest without a resurvey, or the water spout nobody has confirmed is still running. You get somewhere worth going; the record gets a reading it would not have had.',
      accent: 'text-tirtha',
      chip: 'bg-tirtha/10',
    },
    measurement: {
      name: 'Every reading is evidence, or says it is not',
      body: 'Standing at a marked viewpoint turns the phone into a survey instrument. It locks only when position, heading and tilt all agree and the GPS is accurate enough to mean it. Frame it by eye instead and the record says so, permanently.',
      accent: 'text-sakshi',
      chip: 'bg-sakshi/10',
    },
    ai: {
      name: 'AI that proposes and never decides',
      body: 'A damage detector runs on the handset and offers cracks as dashed outlines; a person confirms severity. The knowledge engine answers only from cited passages and refuses when the sources will not carry an answer. Neither is allowed the last word.',
      accent: 'text-dhamma',
      chip: 'bg-dhamma/10',
    },
    offline: {
      name: 'Works where the signal does not',
      body: 'The map, the content and the knowledge base are all on the device. Every reading is written to a database on the phone before anything touches the network, because the moment you are standing there cannot be rescheduled.',
      accent: 'text-sakshi',
      chip: 'bg-sakshi/10',
    },
    custodian: {
      name: 'It reaches the institution that can act',
      body: 'A report arrives on a custodian dashboard with coverage, median time to acknowledgement, and CSV and GeoJSON export for a real GIS workflow. Without that last step the rest is a very good guidebook.',
      accent: 'text-earth',
      chip: 'bg-earth/10',
    },
  },
  alignment: {
    kicker: 'Try the mechanic',
    title: 'What turns a photograph into a measurement',
    lede: 'Drag onto the stored viewpoint and the frame locks. Then switch the GPS off with the alignment still perfect: and watch it refuse. The tolerances below are the real ones the app ships with.',
  },
  surfaces: {
    kicker: 'Three places, and only three',
    title: 'The whole app, on one screen of navigation',
  },
  whyKicker: 'Why this exists',
  whyTitle: 'The monitoring gap is not a data problem. It is a presence problem.',
  whyP1: 'A 2025 assessment found 80% of World Cultural Heritage sites under climate stress, and 98% hit by at least one climate-related extreme since 2000. UNESCO has built a live monitoring platform pulling in more than forty datasets. Satellites can say a site is exposed. Only somebody standing in front of the wall can say whether the wall has moved, and heritage offices cannot afford a surveyor in front of every wall, every month, forever.',
  whyP2: {
    strong: 'Meanwhile a million people a year walk past those walls with a phone in their hand.',
    rest: 'Sākṣī turns that flow into the fieldwork nobody has budget for.',
  },
  whyStats: [
    { k: 'visitors to Lumbini in 2024', n: '+17% on the year before' },
    { k: 'of World Cultural Heritage sites under climate stress', n: null as string | null },
    { k: 'heritage tourism market, 2025', n: 'the channel, not the buyer' },
    { k: 'accounts or logins required to contribute', n: null as string | null },
  ],
  whyFootnote: {
    before: 'Sources, the competitive landscape, and the full argument are in the',
    linkLabel: 'research report',
    after: '.',
  },
  custodiansKicker: 'Closing the loop',
  custodiansTitle: 'A report nobody reads is not evidence',
  custodiansBody:
    'The custodian dashboard shows coverage, median time to acknowledgement, and every open report by site and status, with CSV and GeoJSON export for a real GIS workflow. A custodian can acknowledge a report, mark it in progress, or resolve it with a note through the responsive web portal. Invited staff sign in by email magic link and see only the sites assigned to them; the visitor app links to that portal instead of carrying a second privileged login.',
  custodiansCta1: 'For custodians',
  custodiansCta2: 'Open the dashboard',
  transparencyKicker: 'Public transparency',
  transparencyTitle: 'Follow the record without exposing the witness',
  transparencyLede:
    'Review rolling survey coverage and custodian-acknowledged condition history. Visitor identities, private notes, exact capture coordinates and unpublished photographs remain private.',
  transparencyLinks: {
    patan: 'Patan Durbar Square',
    changu: 'Changu Narayan',
    manga: 'Manga Hiti',
    adopt: 'Adopt a vantage',
  },
  reportsKicker: 'Read further',
  reportsTitle: 'The long-form case, in two documents',
  reportsPages: (pages: number) => `PDF · ${pages} pages`,
  install: {
    title: 'Installing the APK',
    lede: 'Sākṣī is distributed directly rather than through the Play Store, so Android needs your permission once before it will install.',
    cta: 'Download the APK',
    footnote:
      'Enabling "Install from Unknown Sources" applies only to the app you grant it to, and you can revoke it in Settings afterwards.',
  },
  installSteps: [
    {
      title: 'Download the APK',
      body: 'Tap the button above on your Android device. Your browser may warn that this file type can harm your device: that notice appears for every APK, and it is safe to keep.',
    },
    {
      title: 'Allow installs from this source',
      body: 'Open the downloaded file. Android will offer to take you to Settings → Install unknown apps. Grant permission to whichever app you downloaded with: usually Chrome or Files.',
    },
    {
      title: 'Install and open',
      body: 'Return to the file and tap Install. Grant camera and location when Sākṣī asks: the witness view cannot align to a vantage without them.',
    },
  ],
};

const NE: typeof EN = {
  metaTitle: 'साक्षी: एउटा पवित्र भू-दृश्यको जीवन्त नक्सा',
  metaDescription:
    'लुम्बिनी र काठमाडौं उपत्यकाका सम्पदा स्थलहरूका लागि एउटा प्रत्यक्ष-समय नक्सा अन्वेषक। हिँड्नुहोस्, र तपाईं पुगेका ठाउँहरू बोल्छन्, तपाईंले मागेको गहिराइमा, तपाईंले जाँच्न सक्ने स्रोतहरूबाट। एपले गर्ने अरू सबै कुरा यसैका लागि अस्तित्वमा छन्: कुनै ठाउँबाट हिँड्नुले पनि त्यसको अभिलेख छोडोस्।',
  hero: {
    badge: 'लुम्बिनी र काठमाडौं उपत्यकाभर सक्रिय',
    title: (
      <>
        एउटा पवित्र भू-दृश्यको<br className="hidden sm:block" /> जीवन्त नक्सा
      </>
    ),
    lede: 'साक्षी सम्पदा स्थलहरूका लागि एउटा प्रत्यक्ष-समय नक्सा अन्वेषक हो। हिँड्नुहोस्, र तपाईं पुगेका ठाउँहरू बोल्छन्, तपाईंले मागेको गहिराइमा, तपाईंले जाँच्न सक्ने स्रोतहरूबाट। एपले गर्ने अरू सबै कुरा यसैका लागि अस्तित्वमा छन्: कुनै ठाउँबाट हिँड्नुले पनि त्यसको अभिलेख छोडोस्।',
    exploreCta: 'नक्सा अन्वेषण गर्नुहोस्',
    getAppCta: 'एप प्राप्त गर्नुहोस्',
    android: 'Android 7.0 र माथि',
    version: 'संस्करण',
    build: (n: string) => `(बिल्ड ${n})`,
    built: (date: string) => `${date} मा निर्मित`,
  },
  explorer: {
    kicker: 'अन्वेषक',
    title: 'पन्ध्र वास्तविक ठाउँ, तिनका वास्तविक निर्देशांक, र तिनले आफैं भन्न सक्ने सबै कुरा',
    lede: 'यो एपको तस्बिर होइन। यो एपकै आफ्नै डेटा हो, फोनसँगै आउने उही सिड फाइलहरूबाट उत्पन्न गरिएको। ज्ञान नियन्त्रण चलाउनुहोस् र कुनै ठाउँले आफूले स्रोत दिन नसक्ने कुनै कुरा नभनी थप कुरा भन्ने कुरा हेर्नुहोस्।',
    stats: [
      { k: 'सक्रिय सम्पदा स्थलहरू', n: 'दुई UNESCO क्षेत्रभर' },
      { k: 'स्थापित दृष्टिकोणहरू', n: 'प्रत्येक भण्डारण गरिएको स्थान, दिशा र झुकाव' },
      { k: 'सामग्रीपछाडिका उद्धृत अभिलेखहरू', n: 'UNESCO, सर्वेक्षण र उत्खनन प्रतिवेदन' },
      { k: 'ठाउँले बोल्न सक्ने गहिराइहरू', n: 'तपाईंले छान्नुहुन्छ; नसोधी केही आउँदैन' },
    ],
  },
  identityKicker: 'यसलाई थाम्ने कुरा',
  identityTitle: 'जोसुकैले बनाउन सक्ने नक्सा। यी हाम्रा भागहरू हुन्।',
  identityLede:
    'छ प्रतिबद्धता, हरेकको आफ्नै मूल्य छ। सँगै तिनले कुनै ठाउँको वर्णन गर्ने एप र त्यसलाई नापेको भरोसा गर्न सकिने एपबीचको फरक बनाउँछन्।',
  identity: {
    wisdom: {
      name: 'चालसँगै गहिरिने ज्ञान',
      body: 'तपाईं पुगेपछि कुनै ठाउँ बोल्छ, तपाईंले मागेको गहिराइमा: एउटा लाइन, वा तथ्य, स्रोत, र आधारभूत खण्डहरूसहितको पूरा अभिलेख। यो सिँढी पहिले नै लेखिएको र पहिले नै उद्धृत गरिएको सामग्रीबाट बनेको छ, त्यसैले बढी गहिराइले कहिल्यै बढी निश्चितता जनाउँदैन।',
      accent: 'text-tirtha',
      chip: 'bg-tirtha/10',
    },
    navigation: {
      name: 'खाली ठाउँतिर देखाउने नेभिगेसन',
      body: 'मार्गहरू लोकप्रियताबाट उत्पन्न हुँदैनन्। एपले तपाईंलाई पठाउने अर्को ठाउँ भनेको सबैभन्दा लामो समयदेखि पुनः सर्वेक्षण नभएको दृष्टिकोण, वा अझै चलिरहेको हो भनी कसैले पुष्टि नगरेको धारा हो। तपाईं जानुपर्ने ठाउँमा पुग्नुहुन्छ; अभिलेखले नपाउने रिडिङ पाउँछ।',
      accent: 'text-tirtha',
      chip: 'bg-tirtha/10',
    },
    measurement: {
      name: 'हरेक रिडिङ प्रमाण हो, वा त्यो होइन भनी भन्छ',
      body: 'चिन्हित दृष्टिकोणमा उभिनुले फोनलाई सर्वेक्षण उपकरणमा बदल्छ। यो तब मात्र लक हुन्छ जब स्थिति, दिशा र झुकाव सबै मिल्छन् र GPS त्यसलाई अर्थपूर्ण बनाउने गरी शुद्ध हुन्छ। बरु आँखाले फ्रेम गर्नुभयो भने अभिलेखले त्यही भन्छ, सधैंका लागि।',
      accent: 'text-sakshi',
      chip: 'bg-sakshi/10',
    },
    ai: {
      name: 'सुझाव दिने, कहिल्यै निर्णय नगर्ने AI',
      body: 'क्षति पत्ता लगाउने प्रणाली ह्यान्डसेटमै चल्छ र दरारहरू थोप्ला-थोप्ला रेखाको रूपमा प्रस्तुत गर्छ; व्यक्तिले गम्भीरता पुष्टि गर्छ। ज्ञान इन्जिनले उद्धृत खण्डहरूबाट मात्र जवाफ दिन्छ र स्रोतले जवाफ धान्न नसक्दा अस्वीकार गर्छ। कसैलाई पनि अन्तिम शब्द दिइँदैन।',
      accent: 'text-dhamma',
      chip: 'bg-dhamma/10',
    },
    offline: {
      name: 'सिग्नल नभएको ठाउँमा पनि काम गर्छ',
      body: 'नक्सा, सामग्री र ज्ञान आधार सबै डिभाइसमा छन्। नेटवर्कमा केही पुग्नुअघि नै हरेक रिडिङ फोनको डाटाबेसमा लेखिन्छ, किनभने तपाईं त्यहाँ उभिएको क्षणलाई पछि सार्न मिल्दैन।',
      accent: 'text-sakshi',
      chip: 'bg-sakshi/10',
    },
    custodian: {
      name: 'यो कारबाही गर्न सक्ने संस्थासम्म पुग्छ',
      body: 'प्रतिवेदन कभरेज, स्वीकृतिसम्मको मध्यम समय, र वास्तविक GIS वर्कफ्लोका लागि CSV र GeoJSON निर्यातसहित संरक्षक ड्यासबोर्डमा पुग्छ। त्यो अन्तिम चरणबिना बाँकी सबै एउटा धेरै राम्रो गाइडबुक मात्र हो।',
      accent: 'text-earth',
      chip: 'bg-earth/10',
    },
  },
  alignment: {
    kicker: 'मेकानिक जाँच्नुहोस्',
    title: 'के कुराले तस्बिरलाई मापनमा बदल्छ',
    lede: 'भण्डारण गरिएको दृष्टिकोणमा तान्नुहोस् र फ्रेम लक हुन्छ। त्यसपछि मिलान अझै उत्तम छँदै GPS बन्द गर्नुहोस्: र यसले अस्वीकार गर्ने हेर्नुहोस्। तलका सहनशीलताहरू एपसँगै आउने वास्तविक सहनशीलता नै हुन्।',
  },
  surfaces: {
    kicker: 'तीन ठाउँ, र तीनवटा मात्र',
    title: 'सम्पूर्ण एप, नेभिगेसनको एउटै स्क्रिनमा',
  },
  whyKicker: 'यो किन अस्तित्वमा छ',
  whyTitle: 'अनुगमनको खाडल डेटा समस्या होइन। यो उपस्थितिको समस्या हो।',
  whyP1: 'सन् 2025 को एउटा मूल्याङ्कनले विश्व सांस्कृतिक सम्पदा स्थलहरूको 80% हावापानी तनावमा रहेको र 2000 देखि 98% ले कम्तीमा एक हावापानी-सम्बन्धी चरम घटना भोगेको भेट्टायो। UNESCO ले चालीसभन्दा बढी डेटासेट समेट्ने प्रत्यक्ष अनुगमन प्लेटफर्म बनाइसकेको छ। स्याटेलाइटहरूले कुनै ठाउँ जोखिममा छ भन्न सक्छन्। तर भित्तो चलेको छ कि छैन भन्ने कुरा भने भित्तोअगाडि उभिएको व्यक्तिले मात्र भन्न सक्छ, र सम्पदा कार्यालयहरूले हरेक भित्तोअगाडि, हरेक महिना, सधैंका लागि सर्वेक्षक राख्न सक्दैनन्।',
  whyP2: {
    strong: 'यसैबीच वर्षमा दस लाख मानिस हातमा फोन लिएर ती भित्ताहरू नजिकबाट हिँड्छन्।',
    rest: 'साक्षीले त्यो बहावलाई कसैसँग बजेट नभएको फिल्डवर्कमा बदल्छ।',
  },
  whyStats: [
    { k: '2024 मा लुम्बिनीका आगन्तुकहरू', n: 'अघिल्लो वर्षभन्दा +17%' },
    { k: 'विश्व सांस्कृतिक सम्पदा स्थलहरू हावापानी तनावमा', n: null },
    { k: 'सम्पदा पर्यटन बजार, 2025', n: 'च्यानल, ग्राहक होइन' },
    { k: 'योगदान गर्न आवश्यक खाता वा लगइन', n: null },
  ],
  whyFootnote: {
    before: 'स्रोतहरू, प्रतिस्पर्धी परिदृश्य, र पूरा तर्क',
    linkLabel: 'अनुसन्धान प्रतिवेदनमा',
    after: ' छन्।',
  },
  custodiansKicker: 'लूप बन्द गर्दै',
  custodiansTitle: 'कसैले नपढेको प्रतिवेदन प्रमाण होइन',
  custodiansBody:
    'संरक्षक ड्यासबोर्डले कभरेज, स्वीकृतिसम्मको मध्यम समय, र ठाउँ र स्थितिअनुसार हरेक खुला प्रतिवेदन देखाउँछ, वास्तविक GIS वर्कफ्लोका लागि CSV र GeoJSON निर्यातसहित। संरक्षकले प्रतिवेदन स्वीकार गर्न सक्छ, प्रगतिमा रहेको चिन्ह लगाउन सक्छ, वा रेस्पोन्सिभ वेब पोर्टलमार्फत टिप्पणीसहित समाधान गर्न सक्छ। आमन्त्रित कर्मचारी इमेल म्याजिक लिङ्कबाट साइन इन गर्छन् र आफूलाई तोकिएका ठाउँहरू मात्र देख्छन्; आगन्तुक एपले दोस्रो विशेषाधिकार प्राप्त लगइन बोक्नुको सट्टा त्यही पोर्टलमा लिङ्क गर्छ।',
  custodiansCta1: 'संरक्षकका लागि',
  custodiansCta2: 'ड्यासबोर्ड खोल्नुहोस्',
  transparencyKicker: 'सार्वजनिक पारदर्शिता',
  transparencyTitle: 'साक्षीलाई उजागर नगरी अभिलेख पछ्याउनुहोस्',
  transparencyLede:
    'निरन्तर सर्वेक्षण कभरेज र संरक्षकद्वारा स्वीकृत अवस्था इतिहास हेर्नुहोस्। आगन्तुकको पहिचान, निजी टिप्पणी, ठ्याक्कै कैद निर्देशांक र अप्रकाशित तस्बिरहरू निजी नै रहन्छन्।',
  transparencyLinks: {
    patan: 'Patan Durbar Square',
    changu: 'Changu Narayan',
    manga: 'Manga Hiti',
    adopt: 'एउटा दृष्टिकोण अपनाउनुहोस्',
  },
  reportsKicker: 'थप पढ्नुहोस्',
  reportsTitle: 'पूरा तर्क, दुई कागजातमा',
  reportsPages: (pages: number) => `PDF · ${pages} पृष्ठ`,
  install: {
    title: 'APK स्थापना गर्दै',
    lede: 'साक्षी Play Store मार्फत नभई प्रत्यक्ष रूपमा वितरण गरिन्छ, त्यसैले Android ले स्थापना गर्नुअघि एकपटक तपाईंको अनुमति माग्छ।',
    cta: 'APK डाउनलोड गर्नुहोस्',
    footnote:
      '"Install from Unknown Sources" सक्षम गर्नु तपाईंले अनुमति दिएको एपमा मात्र लागू हुन्छ, र तपाईंले पछि Settings मा गएर यसलाई खारेज गर्न सक्नुहुन्छ।',
  },
  installSteps: [
    {
      title: 'APK डाउनलोड गर्नुहोस्',
      body: 'आफ्नो Android डिभाइसमा माथिको बटन थिच्नुहोस्। तपाईंको ब्राउजरले यो फाइल प्रकारले तपाईंको डिभाइसलाई हानि गर्न सक्छ भनी चेतावनी दिन सक्छ: यो सूचना हरेक APK मा देखिन्छ, र यसलाई राख्नु सुरक्षित छ।',
    },
    {
      title: 'यो स्रोतबाट स्थापना अनुमति दिनुहोस्',
      body: 'डाउनलोड गरिएको फाइल खोल्नुहोस्। Android ले तपाईंलाई Settings → Install unknown apps मा लैजाने प्रस्ताव गर्नेछ। तपाईंले जुन एपबाट डाउनलोड गर्नुभयो त्यसलाई अनुमति दिनुहोस्: सामान्यतया Chrome वा Files।',
    },
    {
      title: 'स्थापना गरी खोल्नुहोस्',
      body: 'फाइलमा फर्किनुहोस् र Install थिच्नुहोस्। साक्षीले माग्दा क्यामेरा र स्थानको अनुमति दिनुहोस्: तिनीहरूबिना साक्षी दृश्यले कुनै दृष्टिकोणसँग मिलाउन सक्दैन।',
    },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = locale === 'ne' ? NE : EN;
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    openGraph: { title: c.metaTitle, description: c.metaDescription, type: 'website' },
    alternates: { languages: { en: '/en', ne: '/ne' } },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const c = locale === 'ne' ? NE : EN;
  const build = await getLatestBuild();
  const builtOn = formatBuildDate(build.completedAt);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] bg-[radial-gradient(ellipse_at_top,rgba(200,148,50,0.18),transparent_65%)]"
        />

        <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-14 sm:pt-20">
          <div className="grid items-center gap-y-12 lg:grid-cols-[1fr_auto] lg:gap-x-16">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-1.5 text-sm font-medium text-ink-soft shadow-sm">
                <span className="size-1.5 animate-pulse rounded-full bg-dhamma" />
                {c.hero.badge}
              </span>

              <h1 className="mt-8 font-[family-name:var(--font-display)] text-5xl leading-[1.03] font-semibold tracking-tight text-ink sm:text-7xl">
                {c.hero.title}
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-xl leading-relaxed text-ink-soft lg:mx-0">
                {c.hero.lede}
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <a
                  href="#explore"
                  className="inline-flex items-center gap-3 rounded-2xl bg-earth px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-earth/25 transition hover:-translate-y-0.5 hover:bg-sandstone-deep hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-earth"
                >
                  <Compass className="size-6" aria-hidden />
                  {c.hero.exploreCta}
                </a>

                <a
                  href={build.apkUrl}
                  className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-7 py-4 text-lg font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Download className="size-5" aria-hidden />
                  {c.hero.getAppCta}
                </a>
              </div>

              <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-ink-muted lg:justify-start">
                <Smartphone className="size-4" aria-hidden />
                <span>{c.hero.android}</span>
                <span aria-hidden>·</span>
                <span>
                  {c.hero.version} {build.version}
                  {build.buildNumber ? ` ${c.hero.build(build.buildNumber)}` : ''}
                </span>
                {builtOn ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>{c.hero.built(builtOn)}</span>
                  </>
                ) : null}
              </p>
            </div>

            <GreetingMonk className="h-52 sm:h-64 lg:h-[24rem]" />
          </div>
        </div>
      </section>

      {/* The explorer, the centrepiece */}
      <section id="explore" className="scroll-mt-20 border-y border-line bg-ground-deep">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <Reveal>
            <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
              {c.explorer.kicker}
            </p>
            <h2 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
              {c.explorer.title}
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {c.explorer.lede}
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-10">
              <MapExplorer />
            </div>
          </Reveal>

          <Reveal delay={120}>
            <dl className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {[
                { v: SITES.length, ...c.explorer.stats[0] },
                { v: vantageTotal, ...c.explorer.stats[1] },
                { v: sourceTotal, ...c.explorer.stats[2] },
                { v: 3, ...c.explorer.stats[3] },
              ].map(({ v, k, n }) => (
                <div key={k} className="bg-surface p-6">
                  <dt className="font-[family-name:var(--font-display)] text-4xl font-semibold text-sakshi">
                    <CountUp value={v} />
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {k}
                    <span className="mt-1 block text-ink-muted">{n}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Identity */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <Reveal>
          <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
            {c.identityKicker}
          </p>
          <h2 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
            {c.identityTitle}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {c.identityLede}
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((id, i) => {
            const Icon = ICONS[id];
            const { name, body, accent, chip } = c.identity[id];
            return (
              <Reveal key={id} delay={i * 60}>
                <article className="h-full rounded-3xl border border-line bg-surface p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sakshi/40 hover:shadow-lg">
                  <span
                    className={`inline-flex size-11 items-center justify-center rounded-2xl ${chip} ${accent}`}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl leading-snug font-semibold text-ink">
                    {name}
                  </h3>
                  <p className="mt-3 leading-relaxed text-ink-soft">{body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Alignment demo */}
      <section className="border-y border-line bg-ground-deep">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <Reveal>
            <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
              {c.alignment.kicker}
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
              {c.alignment.title}
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {c.alignment.lede}
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-10">
              <AlignmentDial />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Surfaces */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <Reveal>
          <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
            {c.surfaces.kicker}
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
            {c.surfaces.title}
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {SURFACES.map(({ name, accent, chip, rule, en, ne }, i) => {
            const s = locale === 'ne' ? ne : en;
            return (
              <Reveal key={name} delay={i * 70}>
                <article className="relative h-full overflow-hidden rounded-3xl border border-line bg-surface p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
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
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Why it matters */}
      <section className="border-y border-line bg-ground-deep">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <Reveal>
            <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
              {c.whyKicker}
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
              {c.whyTitle}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">{c.whyP1}</p>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              <strong className="font-semibold text-ink">{c.whyP2.strong}</strong> {c.whyP2.rest}
            </p>
          </Reveal>

          <Reveal delay={80}>
            <dl className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {[
                { v: 1.17, dp: 2, suffix: 'M', k: c.whyStats[0].k, n: c.whyStats[0].n },
                { v: 80, suffix: '%', k: c.whyStats[1].k, n: c.whyStats[1].n },
                {
                  v: 624.6,
                  dp: 1,
                  prefix: '$',
                  suffix: 'B',
                  k: c.whyStats[2].k,
                  n: c.whyStats[2].n,
                },
                { v: 0, k: c.whyStats[3].k, n: c.whyStats[3].n },
              ].map(({ v, dp, prefix, suffix, k, n }) => (
                <div key={k} className="bg-surface p-6">
                  <dt className="font-[family-name:var(--font-display)] text-4xl font-semibold text-sakshi">
                    <CountUp value={v} decimals={dp} prefix={prefix} suffix={suffix} />
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {k}
                    {n ? <span className="mt-1 block text-ink-muted">{n}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-6 text-sm text-ink-muted">
              {c.whyFootnote.before}{' '}
              <Link
                href={localeHref(locale, '/research')}
                className="underline decoration-line underline-offset-4 transition hover:text-ink"
              >
                {c.whyFootnote.linkLabel}
              </Link>
              {c.whyFootnote.after}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Custodians */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <Reveal>
          <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
            {c.custodiansKicker}
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
            {c.custodiansTitle}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">{c.custodiansBody}</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href={localeHref(locale, '/for-custodians')}
              className="inline-flex items-center gap-2 rounded-2xl bg-earth px-6 py-3.5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sandstone-deep"
            >
              {c.custodiansCta1}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/custodian"
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-6 py-3.5 font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {c.custodiansCta2}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Public transparency */}
      <section className="border-t border-line bg-ground-deep">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <Reveal>
            <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
              {c.transparencyKicker}
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
              {c.transparencyTitle}
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {c.transparencyLede}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <Link
                href="/sites/patan-durbar-square/condition"
                className="rounded-xl border border-line bg-surface px-4 py-2.5 font-semibold text-ink"
              >
                {c.transparencyLinks.patan}
              </Link>
              <Link
                href="/sites/changu-narayan/condition"
                className="rounded-xl border border-line bg-surface px-4 py-2.5 font-semibold text-ink"
              >
                {c.transparencyLinks.changu}
              </Link>
              <Link
                href="/sites/manga-hiti/condition"
                className="rounded-xl border border-line bg-surface px-4 py-2.5 font-semibold text-ink"
              >
                {c.transparencyLinks.manga}
              </Link>
              <Link href="/adopt" className="rounded-xl bg-ink px-4 py-2.5 font-semibold text-white">
                {c.transparencyLinks.adopt}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Reports */}
      <section className="border-t border-line bg-ground-deep">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <Reveal>
            <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
              {c.reportsKicker}
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
              {c.reportsTitle}
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[REPORTS.techStack, REPORTS.research].map(({ href, title, pages, blurb }, i) => (
              <Reveal key={href} delay={i * 70}>
                <a
                  href={href}
                  className="flex h-full flex-col rounded-3xl border border-line bg-surface p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-sakshi/10 text-sakshi">
                    <FileText className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
                    {title}
                  </h3>
                  <p className="mt-3 grow leading-relaxed text-ink-soft">{blurb}</p>
                  <p className="mt-5 text-sm font-semibold text-earth">{c.reportsPages(pages)}</p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Install */}
      <section id="download" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-sandstone/15 text-sandstone-deep">
              <ShieldCheck className="size-6" aria-hidden />
            </span>
            <h2 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-semibold text-ink">
              {c.install.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-ink-soft">
              {c.install.lede}
            </p>

            <a
              href={build.apkUrl}
              className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-earth px-8 py-4 font-semibold text-white shadow-lg shadow-earth/25 transition hover:-translate-y-0.5 hover:bg-sandstone-deep"
            >
              <Download className="size-5" aria-hidden />
              {c.install.cta}
            </a>
          </div>

          <ol className="mt-12 space-y-4">
            {c.installSteps.map(({ title, body }, i) => {
              const Icon = INSTALL_ICONS[i];
              return (
                <li
                  key={title}
                  className="flex gap-5 rounded-2xl border border-line bg-surface p-6 shadow-sm"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-sandstone-deep">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">
                      <span className="mr-2 text-ink-muted tabular-nums">{i + 1}.</span>
                      {title}
                    </h3>
                    <p className="mt-1.5 leading-relaxed text-ink-soft">{body}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="mt-8 text-center text-sm text-ink-muted">{c.install.footnote}</p>
        </div>
      </section>
    </main>
  );
}
