/**
 * One place for the things every page on the public site repeats: where the
 * navigation goes, and the two reports the site links to.
 *
 * Copy that appears on more than one page lives here rather than being retyped,
 * because the version that gets edited is never the one you forgot about.
 */

export const NAV = [
  { href: '/how-it-works', labelKey: 'nav.howItWorks' },
  { href: '/technology', labelKey: 'nav.technology' },
  { href: '/research', labelKey: 'nav.research' },
  { href: '/for-custodians', labelKey: 'nav.forCustodians' },
  { href: '/data', labelKey: 'nav.data' },
  { href: '/ethics', labelKey: 'nav.ethics' },
  { href: '/privacy', labelKey: 'nav.privacy' },
] as const;

export const REPO_URL = 'https://github.com/LumbiniX-Committee/Everest';

/**
 * Copied into `public/reports/` by `scripts/copy-reports.mjs` before dev and
 * build, so `docs/` stays the single source and the site never serves a stale
 * duplicate that somebody forgot to re-export.
 */
export const REPORTS = {
  techStack: {
    href: '/reports/Sakshi-Tech-Stack.pdf',
    title: 'The Technology Stack, and What It Takes to Scale It',
    pages: 4,
    blurb:
      'The shipped stack judged against the four properties the evidence demands, the three seats that need replacing, and the trigger that promotes each rung of the scaling ladder.',
  },
  research: {
    href: '/reports/Sakshi-Research-and-Market.pdf',
    title: 'Research Foundations, Competitive Landscape, and Market',
    pages: 5,
    blurb:
      'What the literature already establishes about repeat photography and volunteer data quality, what is still moving in heritage damage detection and grounded generation, who else is in the field, and how large the opportunity is. 37 sources.',
  },
} as const;

/**
 * The three surfaces, in the order the app presents them. `en`/`ne` carry the
 * only parts that are prose; `name` is a Sanskrit/Pali word left as-is in both
 * languages, the way the app itself never translates its own surface names.
 */
export const SURFACES = [
  {
    name: 'Tīrtha',
    accent: 'text-tirtha',
    chip: 'bg-tirtha/10',
    rule: 'bg-tirtha',
    en: {
      means: 'a sacred crossing',
      subtitle: 'The explorer',
      body: 'The live map, and the front door. Your position against the heritage sites around you, a place that speaks as you reach it at the depth you chose, a fade between an old photograph and today, and routes that point at whatever has gone longest without a resurvey.',
    },
    ne: {
      means: 'एक पवित्र तीर्थस्थल',
      subtitle: 'अन्वेषक',
      body: 'प्रत्यक्ष नक्सा, र प्रवेशद्वार। तपाईंको वरपरका सम्पदा स्थलहरूसँग तपाईंको स्थिति, तपाईं पुगेपछि तपाईंले रोजेको गहिराइमा बोल्ने ठाउँ, पुरानो तस्बिर र आजबीचको बिस्तारै परिवर्तन, र सबैभन्दा लामो समयदेखि पुनः सर्वेक्षण नभएको ठाउँतिर देखाउने मार्गहरू।',
    },
  },
  {
    name: 'Sākṣī',
    accent: 'text-sakshi',
    chip: 'bg-sakshi/10',
    rule: 'bg-sakshi',
    en: {
      means: 'witness',
      subtitle: 'Evidence',
      body: 'The loop the whole product exists for: pick a viewpoint, line the phone up with it, take the photograph, and note the condition of what you can see. The record is written to the phone before anything reaches the network.',
    },
    ne: {
      means: 'साक्षी',
      subtitle: 'प्रमाण',
      body: 'सम्पूर्ण उत्पादन जुन लूपका लागि अस्तित्वमा छ: एउटा दृष्टिकोण छान्नुहोस्, फोनलाई त्यससँग मिलाउनुहोस्, तस्बिर खिच्नुहोस्, र तपाईंले देख्न सक्ने अवस्था टिप्नुहोस्। नेटवर्कमा केही पुग्नुअघि नै अभिलेख फोनमा लेखिन्छ।',
    },
  },
  {
    name: 'Dhamma',
    accent: 'text-dhamma',
    chip: 'bg-dhamma/10',
    rule: 'bg-dhamma',
    en: {
      means: 'the teaching',
      subtitle: 'Knowledge',
      body: 'Ask about Buddhist texts or heritage conservation and get an answer built only from real, cited passages, or an honest refusal when the sources will not support one.',
    },
    ne: {
      means: 'शिक्षा',
      subtitle: 'ज्ञान',
      body: 'बौद्ध धर्मग्रन्थ वा सम्पदा संरक्षणका बारेमा सोध्नुहोस् र वास्तविक, उद्धृत अंशहरूबाट मात्र बनेको जवाफ पाउनुहोस्, वा स्रोतले साथ नदिँदा इमानदार अस्वीकृति पाउनुहोस्।',
    },
  },
] as const;
