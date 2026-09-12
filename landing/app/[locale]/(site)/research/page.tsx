import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';

import { Figures, Ledger, PageHero, Prose, Section } from '@/components/ui';
import { type Locale } from '@/lib/i18n';
import { REPORTS } from '@/lib/site';

const EN = {
  metaTitle: 'Research',
  metaDescription:
    'Repeat photography and volunteer data quality are settled science. Heritage damage detection and grounded generation are two years old. Here is what the literature supports, what it warns about, and where Sākṣī sits among the alternatives.',
  hero: {
    eyebrow: 'Research',
    title: 'What the evidence supports, and what it warns about',
    lede: 'Sākṣī claims that ordinary visitors, given a fixed viewpoint and an honest instrument, can produce a monitoring record a conservator will use. That breaks into four separable claims, and the literature answers each of them differently.',
    cta: 'Read the research and market report',
    ctaMeta: (pages: number) => `PDF · ${pages} pages · 37 sources`,
  },
  foundationsKicker: 'Foundations',
  foundationsTitle: 'The method is inherited, not invented',
  foundationsP1:
    'Repeat photography, returning to a fixed viewpoint and taking the same frame again, has been used in landscape and heritage science for well over a century, and there is now a heritage-specific review literature covering the whole chain: image registration, archival organisation, presentation of the comparison, and the conservation of rephotographic collections in their own right.',
  foundationsP2: {
    before: 'The question every institution asks first is whether non-experts produce data worth having. It has been answered quantitatively, most durably by the Snapshot Serengeti analysis:',
    strong: 'aggregated volunteer classifications agreed with expert-verified data on 98% of images',
    after:
      ', and 90% of images were correctly classified with just five volunteers each. Accuracy fell for rare cases, however, which carried higher false-positive and false-negative rates.',
  },
  figures1: [
    {
      value: '98%',
      label: 'Volunteer consensus agreement with expert-verified data',
      note: 'Snapshot Serengeti',
    },
    { value: '5', label: 'Volunteers per image needed for 90% correct classification' },
    { value: '2M+', label: 'Registered volunteers across the Zooniverse platform' },
    { value: '~100k', label: 'Volunteer classifications submitted per day, platform-wide' },
  ],
  foundationsP3: {
    before: 'Three design consequences follow, and all three are in the product:',
    strong1: 'redundancy at the vantage',
    mid1: ', because several observers per viewpoint beat one expert;',
    strong2: 'uncertainty carried on the record',
    mid2: ', because volunteer data is reliable in aggregate and has to be able to say when it is not; and',
    strong3: 'attention to the rare case',
    after:
      ', because the unusual condition, the one actually worth reporting, is exactly where non-expert accuracy is weakest, and therefore the one place a custodian’s confirmation is mandatory rather than optional.',
  },
  recentKicker: 'Recent work',
  recentTitle: 'Where the technical risk actually is',
  ledgerHeadings: ['The area', 'What the 2023–2026 literature says'] as [string, string],
  fieldKicker: 'The field',
  fieldTitle: 'Four neighbours, and the gap between them',
  fieldIntro:
    "There is no direct competitor. There are four well-populated adjacent categories, each of which owns one link in the chain that runs from a visitor's attention, through positioned evidence, to institutional action, and each of which stops before the next.",
  segments: {
    citizenScience: {
      name: 'Photo-monitoring citizen science',
      who: 'Chronolog · rePhotoSA · Zooniverse · iNaturalist',
      holds: 'Visitors really do produce usable image series at scale.',
      gap: 'Environmental rather than heritage, aligned by a fixed bracket rather than a sensor, and nothing downstream: the output is a time-lapse, not a report that reaches whoever is responsible for the site.',
    },
    inventoryPlatforms: {
      name: 'Heritage inventory platforms',
      who: 'Arches (Getty Conservation Institute and World Monuments Fund) · CollectiveAccess · CollectionSpace',
      holds: 'The institutional record of a site lives here, and Arches is very good at it.',
      gap: 'These systems do not acquire. Arches waits for a professional survey to be entered into it. This is a partner, not a rival: the right long-run posture is that Sākṣī feeds it.',
    },
    mobileGis: {
      name: 'Field data capture and mobile GIS',
      who: 'Esri Field Maps and Survey123 · Fulcrum · KoboToolbox · ODK',
      holds: 'Capable, general-purpose tools a heritage office would otherwise buy.',
      gap: 'Priced per seat, which structurally forbids the public from contributing, and with no concept of a vantage: they record where you were, not whether you stood where the last photograph was taken from.',
    },
    interpretation: {
      name: 'Visitor engagement and interpretation',
      who: 'Smartify · Bloomberg Connects · Google Arts & Culture · CyArk',
      holds: 'Where the funding in this space actually is, and at real scale.',
      gap: 'Interpretation flows one way. The visitor is an audience, and the site gets no information about its own condition from having been visited.',
    },
  },
  gapLabel: 'The gap',
  fieldClosing: {
    strong: 'Nothing in the survey spans all three links.',
    after:
      'The two capabilities that make spanning them possible, sensor-verified alignment to a stored vantage, and a custodian surface that acknowledges and closes a report, are precisely the two the adjacent categories each lack. The defensible position is not a feature; it is the loop.',
  },
  urgencyKicker: 'Urgency',
  urgencyTitle: 'The demand side is no longer speculative',
  figures2: [
    {
      value: '80%',
      label: 'of World Cultural Heritage sites under climate stress',
      note: '2025 assessment',
    },
    { value: '98%', label: 'have faced at least one climate-related extreme since 2000' },
    {
      value: '~73%',
      label: 'at high risk from water-related hazards',
      note: 'UNESCO, July 2025',
    },
    { value: '19%', label: 'built substantially of threatened materials such as stone and wood' },
  ],
  urgencyPara: {
    before:
      'UNESCO has since launched a live monitoring platform integrating more than forty datasets with near-real-time alerts. That is the single most encouraging signal in this research, and it is worth stating plainly:',
    strong: 'the institutions have built the dashboard and are short of the ground truth to fill it.',
    after:
      'Satellite and climate-model data can say a site is exposed. Only someone standing in front of the wall can say whether the wall has moved.',
  },
};

const NE: typeof EN = {
  metaTitle: 'अनुसन्धान',
  metaDescription:
    'पुनरावृत्ति फोटोग्राफी र स्वयंसेवक डेटा गुणस्तर स्थापित विज्ञान हुन्। सम्पदा क्षति पत्ता लगाउने र आधारित उत्पादन दुई वर्ष पुराना मात्र हुन्। साहित्यले के समर्थन गर्छ, यसले केबारे चेतावनी दिन्छ, र विकल्पहरूमध्ये साक्षी कहाँ बस्छ भन्ने यहाँ छ।',
  hero: {
    eyebrow: 'अनुसन्धान',
    title: 'प्रमाणले के समर्थन गर्छ, र यसले केबारे चेतावनी दिन्छ',
    lede: 'साक्षीले दाबी गर्छ कि सामान्य आगन्तुकहरूले, स्थिर दृष्टिकोण र इमानदार उपकरण पाएपछि, संरक्षकले प्रयोग गर्ने अनुगमन अभिलेख उत्पादन गर्न सक्छन्। यो चार अलग-अलग दाबीमा टुक्रिन्छ, र साहित्यले हरेकको फरक-फरक जवाफ दिन्छ।',
    cta: 'अनुसन्धान र बजार प्रतिवेदन पढ्नुहोस्',
    ctaMeta: (pages: number) => `PDF · ${pages} पृष्ठ · 37 स्रोत`,
  },
  foundationsKicker: 'जग',
  foundationsTitle: 'विधि विरासतमा पाइएको हो, आविष्कार गरिएको होइन',
  foundationsP1:
    'पुनरावृत्ति फोटोग्राफी, स्थिर दृष्टिकोणमा फर्किएर उही फ्रेम फेरि खिच्ने विधि, ल्यान्डस्केप र सम्पदा विज्ञानमा एक शताब्दीभन्दा बढी समयदेखि प्रयोग हुँदै आएको छ, र अहिले सम्पूर्ण शृंखला समेट्ने सम्पदा-विशिष्ट समीक्षा साहित्य पनि छ: तस्बिर दर्ता, अभिलेखालय व्यवस्थापन, तुलनाको प्रस्तुति, र पुनःफोटोग्राफिक सङ्ग्रहको आफ्नै संरक्षण।',
  foundationsP2: {
    before:
      'हरेक संस्थाले पहिले सोध्ने प्रश्न हो: के गैर-विशेषज्ञहरूले लायक डेटा उत्पादन गर्छन्? यसको मात्रात्मक जवाफ दिइसकिएको छ, सबैभन्दा टिकाउ रूपमा Snapshot Serengeti विश्लेषणले:',
    strong: 'सामूहिक स्वयंसेवक वर्गीकरणले 98% तस्बिरमा विशेषज्ञ-प्रमाणित डेटासँग मेल खायो',
    after:
      ', र जम्मा पाँच स्वयंसेवकसहित 90% तस्बिर सही वर्गीकृत भए। तर दुर्लभ अवस्थाहरूमा शुद्धता घट्यो, जसले उच्च झुटो-सकारात्मक र झुटो-नकारात्मक दर बोक्यो।',
  },
  figures1: [
    {
      value: '98%',
      label: 'विशेषज्ञ-प्रमाणित डेटासँग स्वयंसेवक सहमतिको मेल',
      note: 'Snapshot Serengeti',
    },
    { value: '5', label: '90% सही वर्गीकरणका लागि प्रति तस्बिर चाहिने स्वयंसेवक' },
    { value: '2M+', label: 'Zooniverse प्लेटफर्महरूभर दर्ता भएका स्वयंसेवकहरू' },
    { value: '~100k', label: 'प्लेटफर्महरूभर दैनिक पेस हुने स्वयंसेवक वर्गीकरण' },
  ],
  foundationsP3: {
    before: 'तीन डिजाइन परिणामहरू यसबाट निस्कन्छन्, र तीनवटै उत्पादनमा छन्:',
    strong1: 'दृष्टिकोणमा अतिरिक्तता',
    mid1: ', किनभने एक विशेषज्ञभन्दा प्रति दृष्टिकोण धेरै अवलोकनकर्ता राम्रो हुन्छ;',
    strong2: 'अभिलेखमा बोकिने अनिश्चितता',
    mid2: ', किनभने स्वयंसेवक डेटा समग्रमा भरपर्दो हुन्छ र यो नभएको बेला भन्न सक्नुपर्छ; र',
    strong3: 'दुर्लभ अवस्थामा ध्यान',
    after:
      ', किनभने असामान्य अवस्था, जुन साँच्चै प्रतिवेदन गर्नयोग्य छ, ठ्याक्कै त्यही हो जहाँ गैर-विशेषज्ञ शुद्धता सबैभन्दा कमजोर हुन्छ, र त्यसैले त्यो नै एक ठाउँ हो जहाँ संरक्षकको पुष्टि वैकल्पिक होइन, अनिवार्य हो।',
  },
  recentKicker: 'भर्खरको काम',
  recentTitle: 'प्राविधिक जोखिम साँच्चै कहाँ छ',
  ledgerHeadings: ['क्षेत्र', '2023–2026 को साहित्यले के भन्छ'] as [string, string],
  fieldKicker: 'क्षेत्र',
  fieldTitle: 'चार छिमेकी, र तिनीबीचको खाडल',
  fieldIntro:
    'यहाँ कुनै प्रत्यक्ष प्रतिस्पर्धी छैन। चार राम्ररी भरिएका छेउछाउका वर्गहरू छन्, जसमध्ये हरेकले आगन्तुकको ध्यानदेखि, स्थितिबद्ध प्रमाणहुँदै, संस्थागत कारबाहीसम्म पुग्ने शृंखलाको एउटा-एउटा कडी ओगट्छ, र हरेक अर्को कडीअघि नै रोकिन्छ।',
  segments: {
    citizenScience: {
      name: 'फोटो-अनुगमन नागरिक विज्ञान',
      who: 'Chronolog · rePhotoSA · Zooniverse · iNaturalist',
      holds: 'आगन्तुकहरूले साँच्चै ठूलो मात्रामा प्रयोगयोग्य तस्बिर शृंखला उत्पादन गर्छन्।',
      gap: 'सम्पदाभन्दा वातावरणीय, सेन्सरभन्दा स्थिर ब्र्याकेटले मिलाइएको, र त्यसपछि केही छैन: नतिजा एउटा टाइम-ल्याप्स हो, ठाउँको जिम्मेवार व्यक्तिसम्म पुग्ने प्रतिवेदन होइन।',
    },
    inventoryPlatforms: {
      name: 'सम्पदा सूची प्लेटफर्महरू',
      who: 'Arches (Getty Conservation Institute र World Monuments Fund) · CollectiveAccess · CollectionSpace',
      holds: 'ठाउँको संस्थागत अभिलेख यहीं बस्छ, र Arches यसमा धेरै राम्रो छ।',
      gap: 'यी प्रणालीले आफैं सङ्कलन गर्दैनन्। Arches ले व्यावसायिक सर्वेक्षण भित्र्याइनुको पर्खाइ गर्छ। यो प्रतिस्पर्धी होइन, साझेदार हो: साक्षीले यसलाई खुवाउनु नै दीर्घकालीन सही मुद्रा हो।',
    },
    mobileGis: {
      name: 'क्षेत्र डेटा सङ्कलन र मोबाइल GIS',
      who: 'Esri Field Maps र Survey123 · Fulcrum · KoboToolbox · ODK',
      holds: 'क्षमतावान्, सामान्य-उद्देश्यका उपकरणहरू जुन सम्पदा कार्यालयले अन्यथा किन्ने थियो।',
      gap: 'प्रति सिट मूल्य तोकिएको, जसले संरचनात्मक रूपमा सर्वसाधारणलाई योगदान गर्नबाट रोक्छ, र दृष्टिकोणको कुनै अवधारणा नभएको: तिनले तपाईं कहाँ हुनुहुन्थ्यो भनी दर्ता गर्छन्, अघिल्लो तस्बिर खिचिएकै ठाउँमा तपाईं उभिनुभयो कि भन्ने होइन।',
    },
    interpretation: {
      name: 'आगन्तुक सहभागिता र व्याख्या',
      who: 'Smartify · Bloomberg Connects · Google Arts & Culture · CyArk',
      holds: 'यो क्षेत्रमा साँच्चै जहाँ लगानी छ, र साँच्चै ठूलो मात्रामा।',
      gap: 'व्याख्या एकतर्फी बग्छ। आगन्तुक एउटा दर्शक हो, र भ्रमण भइसकेपछि पनि ठाउँले आफ्नो अवस्थाबारे कुनै जानकारी पाउँदैन।',
    },
  },
  gapLabel: 'खाडल',
  fieldClosing: {
    strong: 'सर्वेक्षणमा कुनै पनि कुराले तीनवटै कडी ओगट्दैन।',
    after:
      'तिनलाई जोड्न सक्षम बनाउने दुई क्षमताहरू, भण्डारण गरिएको दृष्टिकोणसँग सेन्सर-प्रमाणित मिलान, र प्रतिवेदन स्वीकार गरी बन्द गर्ने संरक्षक इन्टरफेस, ठ्याक्कै ती दुई हुन् जुन छेउछाउका वर्गहरूमध्ये हरेकमा छैन। बचाव गर्न सकिने स्थिति कुनै विशेषता होइन; यो लूप नै हो।',
  },
  urgencyKicker: 'आकस्मिकता',
  urgencyTitle: 'माग पक्ष अब काल्पनिक छैन',
  figures2: [
    {
      value: '80%',
      label: 'विश्व सांस्कृतिक सम्पदा स्थलहरू हावापानी तनावमा',
      note: '2025 मूल्याङ्कन',
    },
    { value: '98%', label: 'ले 2000 देखि कम्तीमा एक हावापानी-सम्बन्धी चरम घटना भोगेका छन्' },
    {
      value: '~73%',
      label: 'पानी-सम्बन्धी खतराबाट उच्च जोखिममा',
      note: 'UNESCO, जुलाई 2025',
    },
    { value: '19%', label: 'ढुङ्गा र काठजस्ता खतरामा परेका सामग्रीले पर्याप्त रूपमा बनेका' },
  ],
  urgencyPara: {
    before:
      'UNESCO ले तबदेखि चालीसभन्दा बढी डेटासेट समेटेर नजिक-वास्तविक-समयको अलर्टसहितको प्रत्यक्ष अनुगमन प्लेटफर्म सुरु गरिसकेको छ। यो यस अनुसन्धानमा सबैभन्दा उत्साहजनक सङ्केत हो, र यो स्पष्ट भन्नु उपयुक्त छ:',
    strong: 'संस्थाहरूले ड्यासबोर्ड बनाइसकेका छन् र यसलाई भर्ने ग्राउन्ड ट्रुथको कमी छ।',
    after:
      'स्याटेलाइट र हावापानी-मोडेल डेटाले कुनै ठाउँ जोखिममा छ भन्न सक्छ। भित्तो चलेको छ कि छैन भन्ने कुरा भने भित्तोअगाडि उभिएको व्यक्तिले मात्र भन्न सक्छ।',
  },
};

function ledgerRows(locale: Locale): { left: string; right: ReactNode }[] {
  if (locale === 'ne') {
    return [
      {
        left: 'सम्पदा सतहमा क्षति पत्ता लगाउने',
        right: (
          <>
            2026 को व्यवस्थित समीक्षाले 2020–2025 का 26 अनुसन्धानपत्र समेट्छ;
            एटेन्सन-बढाइएका U-Net भेरियन्ट र YOLO परिवार नै स्थापित संरचना हुन्,
            इटालियन र क्याप्पाडोसियन ठाउँहरूमा अन-डिभाइस प्रयोगसहित।{' '}
            <strong>खुला समस्या भनेको सामग्रीहरूभर सामान्यीकरण हो</strong>: इँटा,
            तह-तह ढुङ्गा, चूना प्लास्टर र क्षयीकृत बलौटे ढुङ्गाले उही चिरा-आकृति
            साझा गर्दैनन्। पत्ता लगाउने प्रणालीले सुझाव मात्र दिने र व्यक्तिले
            निर्णय गर्ने नियमको लागि यो नै सबैभन्दा बलियो तर्क हो।
          </>
        ),
      },
      {
        left: 'डिजिटल ट्विन र HBIM',
        right: (
          <>
            204 अध्ययनहरूको स्कोपिङ समीक्षाले यो क्षेत्र लेजर स्क्यानिङ, UAV
            फोटोग्रामेट्री, BIM र सेन्सर नेटवर्कमा टिकिरहेको भेट्टाउँछ: वर्षौंको
            अन्तरालमा उत्कृष्ट ज्यामिति उत्पादन गर्ने पुँजी-सघन स्ट्याक।{' '}
            <strong>साक्षी ट्विनमुनिको स्याम्पलिङ तह हो, यसको प्रतिस्पर्धी होइन</strong>:
            घना, मिति-अङ्कित, पोज-ट्याग गरिएका आगन्तुक तस्बिरहरू ठ्याक्कै त्यही
            हुन् जुन फोटोग्रामेट्री-सञ्चालित परिवर्तन अनुगमनले उपभोग गर्छ।
          </>
        ),
      },
      {
        left: 'आधारित उत्पादन (Grounded generation)',
        right: (
          <>
            2024 र 2026 बीचमा विश्वसनीयता नाप्न सकिने भयो: RAGTruth ले ~18,000
            स्प्यान-लेबल गरिएका उदाहरण दिन्छ, र सार्वजनिक लिडरबोर्डहरूले अब भ्रम
            दर प्रत्यक्ष ट्र्याक गर्छन्। असहज खोज के हो भने{' '}
            <strong>
              मोडेलहरूले सही सन्दर्भ अगाडि हुँदा पनि असमर्थित भनाइहरू ल्याइरहन्छन्
            </strong>
            , त्यसैले पुनःप्राप्ति गर्नु आधारित हुनुजस्तै होइन, र त्यसैले
            जाँच-अनि-अस्वीकार चरण वैकल्पिक होइन।
          </>
        ),
      },
      {
        left: 'फोनमा मोडेल चलाउने',
        right: (
          <>
            मोबाइल इन्फरेन्सका समीक्षाहरू बिल्डले व्यवहारमा पुगेको उही निष्कर्षमा
            मिल्छन्, र 1–4 अर्ब प्यारामिटर दायराका मोडेलहरू अब सीमित कार्यहरूका
            लागि भरपर्दो छन्, जुन ठ्याक्कै यहाँ तोकिएको काम हो: पुनःप्राप्त
            गरिएको अंशलाई वाक्यमा उतार्ने, कहिल्यै तथ्य नदाबी गर्ने।
          </>
        ),
      },
    ];
  }

  return [
    {
      left: 'Damage detection on heritage surfaces',
      right: (
        <>
          A 2026 systematic review covers 26 papers from 2020–2025;
          attention-augmented U-Net variants and the YOLO family are the
          settled architectures, with on-device deployments reported at
          Italian and Cappadocian sites.{' '}
          <strong>The open problem is generalisation across materials</strong>
          : brick, coursed stone, lime plaster and eroded sandstone do
          not share a crack morphology. That is the strongest argument
          for the rule that the detector proposes and a person disposes.
        </>
      ),
    },
    {
      left: 'Digital twins and HBIM',
      right: (
        <>
          A scoping review of 204 studies finds the field settling on
          laser scanning, UAV photogrammetry, BIM and sensor networks: a
          capital-intensive stack that produces exquisite geometry at
          intervals of years.{' '}
          <strong>
            Sākṣī is the sampling layer beneath a twin, not a competitor to it
          </strong>
          : dense, dated, pose-tagged visitor photographs are exactly
          what photogrammetry-driven change monitoring consumes.
        </>
      ),
    },
    {
      left: 'Grounded generation',
      right: (
        <>
          Faithfulness became measurable between 2024 and 2026: RAGTruth
          supplies ~18,000 span-labelled examples, and public
          leaderboards now track hallucination rates directly. The
          uncomfortable finding is that{' '}
          <strong>
            models still introduce unsupported statements even with the
            correct context in front of them
          </strong>
          , which is why retrieving is not the same as being grounded,
          and why the verify-then-refuse step is not optional.
        </>
      ),
    },
    {
      left: 'Running models on a phone',
      right: (
        <>
          Reviews of mobile inference converge on the same conclusion the
          build reached in practice, and models in the 1–4 billion
          parameter range are now credible for constrained tasks, which
          is exactly the task assigned here: rephrasing a retrieved
          passage, never asserting a fact.
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
    alternates: { languages: { en: '/en/research', ne: '/ne/research' } },
  };
}

export default async function ResearchPage({
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
          href={REPORTS.research.href}
          className="mt-9 inline-flex items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-4 font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <FileText className="size-5 text-sakshi" aria-hidden />
          {c.hero.cta}
          <span className="text-sm font-normal text-ink-muted">
            {c.hero.ctaMeta(REPORTS.research.pages)}
          </span>
        </Link>
      </PageHero>

      <Section kicker={c.foundationsKicker} title={c.foundationsTitle}>
        <Prose>
          <p>{c.foundationsP1}</p>
          <p>
            {c.foundationsP2.before} <strong>{c.foundationsP2.strong}</strong>
            {c.foundationsP2.after}
          </p>
        </Prose>

        <Figures items={c.figures1} />

        <Prose>
          <p className="mt-8">
            {c.foundationsP3.before} <strong>{c.foundationsP3.strong1}</strong>
            {c.foundationsP3.mid1} <strong>{c.foundationsP3.strong2}</strong>
            {c.foundationsP3.mid2} <strong>{c.foundationsP3.strong3}</strong>
            {c.foundationsP3.after}
          </p>
        </Prose>
      </Section>

      <Section tone="deep" kicker={c.recentKicker} title={c.recentTitle}>
        <Ledger headings={c.ledgerHeadings} rows={ledgerRows(locale)} />
      </Section>

      <Section kicker={c.fieldKicker} title={c.fieldTitle}>
        <Prose>
          <p>{c.fieldIntro}</p>
        </Prose>

        <div className="mt-8 space-y-4">
          {(Object.keys(c.segments) as (keyof typeof c.segments)[]).map((id) => {
            const { name, who, holds, gap } = c.segments[id];
            return (
              <article
                key={id}
                className="rounded-3xl border border-line border-t-2 border-t-sakshi bg-surface p-7 shadow-sm"
              >
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
                  {name}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">{who}</p>
                <p className="mt-4 leading-relaxed text-ink-soft">{holds}</p>
                <p className="mt-3 leading-relaxed text-ink-soft">
                  <span className="mr-2 text-sm font-semibold tracking-wide text-earth uppercase">
                    {c.gapLabel}
                  </span>
                  {gap}
                </p>
              </article>
            );
          })}
        </div>

        <Prose>
          <p className="mt-8">
            <strong>{c.fieldClosing.strong}</strong> {c.fieldClosing.after}
          </p>
        </Prose>
      </Section>

      <Section tone="deep" kicker={c.urgencyKicker} title={c.urgencyTitle}>
        <Figures items={c.figures2} />

        <Prose>
          <p className="mt-8">
            {c.urgencyPara.before} <strong>{c.urgencyPara.strong}</strong>{' '}
            {c.urgencyPara.after}
          </p>
        </Prose>
      </Section>
    </main>
  );
}
