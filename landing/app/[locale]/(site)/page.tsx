import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BedDouble,
  Check,
  Compass,
  Download,
  Mountain,
  Settings,
  ShieldCheck,
  Smartphone,
  WifiOff,
} from 'lucide-react';

import { HeroPlace } from '@/components/HeroPlace';
import { Provenance } from '@/components/Provenance';
import { ThreeVerbs } from '@/components/ThreeVerbs';
import { MapExplorer } from '@/components/MapExplorer';
import { CountUp, Reveal } from '@/components/motion';
import { formatBuildDate, getLatestBuild } from '@/lib/eas';
import { localeHref, type Locale } from '@/lib/i18n';
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

const MAYA = SITES.find((site) => site.id === 'maya-devi-temple')!;
const PILLAR = SITES.find((site) => site.id === 'ashokan-pillar')!;
const vantageTotal = SITES.reduce((n, s) => n + s.vantages, 0);
const sourceTotal = SITES.reduce((n, s) => n + s.sources.length, 0);

const INSTALL_ICONS = [Download, Settings, Check] as const;

/** What a visitor gets, beyond the map: shown right under the hero. */
const FEATURES = {
  en: [
    { icon: Mountain, title: 'Three treks, day by day', body: 'Poon Hill, Langtang and Everest Base Camp: distance, climb, walking time, where you sleep and how high, with a warning on days that climb too fast and a trail map that shows how far along you are.' },
    { icon: WifiOff, title: 'Maps that work offline', body: 'Save a city or a trek to your phone and the map, terrain and names still draw with no signal. Trek guides and site histories are always on the phone.' },
    { icon: BedDouble, title: 'Essentials nearby', body: 'Places to stay, eat, get medical help or money, from open map data, each with a number to call ahead and walking directions.' },
  ],
  ne: [
    { icon: Mountain, title: 'तीन ट्रेक, दिनदिनै', body: 'पुनहिल, लाङटाङ र सगरमाथा आधार शिविर: दूरी, उकालो, हिँडाइको समय, बास र उचाइ, धेरै छिटो उक्लिने दिनको चेतावनी र तपाईं कति पुग्नुभयो देखाउने पदमार्ग नक्सासहित।' },
    { icon: WifiOff, title: 'अफलाइन चल्ने नक्सा', body: 'सहर वा ट्रेकलाई फोनमा सुरक्षित गर्नुहोस्, सिग्नल नहुँदा पनि नक्सा, भू-आकृति र नाम देखिन्छन्। ट्रेक र सम्पदाको इतिहास सधैं फोनमै हुन्छ।' },
    { icon: BedDouble, title: 'नजिकका आवश्यक सेवा', body: 'बस्ने, खाने, स्वास्थ्य र पैसाका ठाउँ, खुला नक्सा डाटाबाट, पहिले फोन गर्ने नम्बर र हिँड्ने बाटोसहित।' },
  ],
};

const EN = {
  metaTitle: 'Sākṣī: a real-time guide to Nepal',
  metaDescription:
    'Heritage sites, treks and offline maps for visitors to Nepal: Lumbini, the Kathmandu Valley, Pokhara and Chitwan, Poon Hill, Langtang and Everest Base Camp. Every place speaks from sources you can check, and works when the signal does not.',
  hero: {
    badge: 'Lumbini · Kathmandu Valley · Pokhara · Chitwan · three treks',
    title: (
      <>
        Know where you are, as deeply as you want
      </>
    ),
    lede: 'A guide to Nepal’s heritage sites and treks that explains each place when you reach it, from a glance to the full history, and shows where every fact comes from. It keeps working when the signal doesn’t.',
    exploreCta: 'See it at Maya Devi',
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
      accent: 'text-sandstone-deep',
      chip: 'bg-surface-secondary',
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
      accent: 'text-sandstone-deep',
      chip: 'bg-surface-secondary',
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
  metaTitle: 'साक्षी: नेपालका लागि वास्तविक-समयको मार्गदर्शक',
  metaDescription:
    'नेपाल घुम्नेहरूका लागि सम्पदा स्थल, ट्रेक र अफलाइन नक्सा: लुम्बिनी, काठमाडौं उपत्यका, पोखरा र चितवन, पुनहिल, लाङटाङ र सगरमाथा आधार शिविर। हरेक ठाउँले जाँच्न सकिने स्रोतबाट बोल्छ, र सिग्नल नहुँदा पनि काम गर्छ।',
  hero: {
    badge: 'लुम्बिनी · काठमाडौं उपत्यका · पोखरा · चितवन · तीन ट्रेक',
    title: (
      <>
        तपाईं कहाँ हुनुहुन्छ, जति गहिरो चाहनुहुन्छ त्यति जान्नुहोस्
      </>
    ),
    lede: 'साक्षीले ठाउँ कहाँ छ देखाउँछ, त्यहाँसम्म हिँडाएर पुर्‍याउँछ, र पुगेपछि जाँच्न सकिने स्रोतबाट त्यसको बारेमा बताउँछ। यसले तपाईंका ट्रेक दिनदिनै बोक्छ, सिग्नल नहुँदाका लागि नक्सा सुरक्षित राख्छ, र हरेक भ्रमणलाई ठाउँ कसरी बदलिँदैछ भन्ने अभिलेखमा थप्छ।',
    exploreCta: 'मायादेवीमा हेर्नुहोस्',
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
      accent: 'text-sandstone-deep',
      chip: 'bg-surface-secondary',
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
      accent: 'text-sandstone-deep',
      chip: 'bg-surface-secondary',
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
        <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-14 sm:pt-20">
          <div className="grid items-center gap-y-14 lg:grid-cols-[1.05fr_1fr] lg:gap-x-16">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-1.5 text-sm font-medium text-ink-soft shadow-sm">
                <span className="size-1.5 rounded-full bg-sandstone" />
                {c.hero.badge}
              </span>

              <h1 className="mt-8 font-[family-name:var(--font-display)] text-5xl leading-[1.05] font-semibold tracking-tight text-balance text-ink sm:text-6xl xl:text-7xl">
                {c.hero.title}
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-xl leading-relaxed text-ink-soft lg:mx-0">
                {c.hero.lede}
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <a
                  href="#three-verbs"
                  className="inline-flex items-center gap-3 rounded-2xl bg-marigold px-8 py-4 text-lg font-semibold text-on-marigold shadow-lg shadow-earth/25 transition hover:-translate-y-0.5 hover:brightness-95 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-earth"
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

            <HeroPlace site={MAYA} locale={locale === 'ne' ? 'ne' : 'en'} />
          </div>
        </div>
      </section>

      <ThreeVerbs maya={MAYA} pillar={PILLAR} locale={locale === 'ne' ? 'ne' : 'en'} />

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
                  <dt className="font-[family-name:var(--font-display)] text-4xl font-semibold text-sandstone-deep">
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

      {/* Beyond the temple: treks, offline, essentials, as a list rather than look-alike cards */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24" aria-labelledby="beyond">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">{locale === 'ne' ? 'मन्दिरभन्दा पर' : 'Beyond the temple'}</p>
            <h2 id="beyond" className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight font-semibold text-ink sm:text-5xl">
              {locale === 'ne' ? 'लुम्बिनी, काठमाडौं, पोखरा, चितवन, र तीन ट्रेक' : 'Lumbini, Kathmandu, Pokhara, Chitwan, and three treks'}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              {locale === 'ne'
                ? 'यी ठाउँमा गहिरो जानकारी छ। बाँकी नेपालमा आधारभूत सूची, जसले थाहा नभएको कुरा थाहा छैन भन्छ।'
                : 'Deep where it has the records, basic everywhere else, and honest about which is which.'}
            </p>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {FEATURES[locale === 'ne' ? 'ne' : 'en'].map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-5 py-6">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-sandstone-deep">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold text-ink">{title}</h3>
                  <p className="mt-1 leading-relaxed text-ink-soft">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Provenance locale={locale === 'ne' ? 'ne' : 'en'} />

      {/* For institutions: the monitoring case, compressed to one band that links to its own pages */}
      <section className="border-t border-line bg-ground-deep" aria-labelledby="institutions">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
              {locale === 'ne' ? 'सम्पदा संस्थाहरूका लागि' : 'For heritage institutions'}
            </p>
            <h2 id="institutions" className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight font-semibold text-ink">
              {locale === 'ne' ? 'हरेक भ्रमणले हेरचाहकर्ताले काम गर्न सक्ने अभिलेख छोड्न सक्छ' : 'Every visit can leave a record a custodian can act on'}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">{c.custodiansBody}</p>
          </div>
          <ul className="divide-y divide-line self-end border-y border-line">
            {[
              { href: localeHref(locale, '/for-custodians'), label: c.custodiansCta1 },
              { href: '/custodian', label: c.custodiansCta2 },
              { href: localeHref(locale, '/research'), label: c.reportsTitle },
              { href: '/sites/patan-durbar-square/condition', label: `${c.transparencyKicker}: ${c.transparencyLinks.patan}` },
              { href: '/adopt', label: c.transparencyLinks.adopt },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="flex min-h-12 items-center justify-between gap-4 py-3 font-semibold text-ink hover:text-sandstone-deep">
                  {link.label}
                  <ArrowRight className="size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
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
              className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-marigold px-8 py-4 font-semibold text-on-marigold shadow-lg shadow-earth/25 transition hover:-translate-y-0.5 hover:brightness-95"
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
