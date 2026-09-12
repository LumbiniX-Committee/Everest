/**
 * Locale support for the public marketing site.
 *
 * Route-based, not a switch flipped at runtime: `/en/...` and `/ne/...` are
 * two fully static, separately rendered trees (see `app/[locale]/layout.tsx`),
 * which is what lets a Nepali reader land on a URL that says so and gives a
 * search engine something to index correctly.
 *
 * Scope, deliberately: this dictionary covers the chrome every page shares —
 * navigation, footer, language switcher, the download CTA. Each page's own
 * long-form content is translated in the page itself, next to the English it
 * replaces, because flattening paragraphs of marketing prose into a key-value
 * map makes the English harder to read without making the Nepali easier to
 * find. `/custodian`, `/login`, `/adopt` and `/sites/[siteId]/condition` are
 * authenticated or transactional, have their own tests, and serve a small
 * known set of custodians — out of scope for this pass, and left
 * English-only at their existing bare paths.
 */

export const LOCALES = ['en', 'ne'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

const EN = {
  'nav.howItWorks': 'How it works',
  'nav.technology': 'Technology',
  'nav.research': 'Research',
  'nav.forCustodians': 'For custodians',
  'nav.data': 'Open data',
  'nav.ethics': 'Ethics',
  'nav.privacy': 'Privacy',
  'nav.custodianDashboard': 'Custodian dashboard',
  'nav.sourceCode': 'Source code',
  'nav.download': 'Download',
  'nav.getTheApp': 'Get the app',
  'nav.openMenu': 'Open menu',
  'nav.closeMenu': 'Close menu',
  'nav.language': 'नेपालीमा पढ्नुहोस्',
  'footer.tagline':
    'A conservation-evidence platform that uses pilgrimage as its distribution channel. Built for LumbiniX 2026 by the LumbiniX-Committee team.',
  'footer.disclaimer':
    'Site and viewpoint coordinates are real but not all survey-grade, and the app labels the ones that are approximate. Nothing here is an official publication of the Lumbini Development Trust or UNESCO.',
} as const;

export type LandingCopyKey = keyof typeof EN;

const NE: Record<LandingCopyKey, string> = {
  'nav.howItWorks': 'यसरी काम गर्छ',
  'nav.technology': 'प्रविधि',
  'nav.research': 'अनुसन्धान',
  'nav.forCustodians': 'संरक्षकका लागि',
  'nav.data': 'खुला डेटा',
  'nav.ethics': 'नैतिकता',
  'nav.privacy': 'गोपनीयता',
  'nav.custodianDashboard': 'संरक्षक ड्यासबोर्ड',
  'nav.sourceCode': 'स्रोत कोड',
  'nav.download': 'डाउनलोड',
  'nav.getTheApp': 'एप प्राप्त गर्नुहोस्',
  'nav.openMenu': 'मेनु खोल्नुहोस्',
  'nav.closeMenu': 'मेनु बन्द गर्नुहोस्',
  'nav.language': 'Read in English',
  'footer.tagline':
    'तीर्थयात्रालाई आफ्नो वितरण मार्गको रूपमा प्रयोग गर्ने संरक्षण-प्रमाण प्लेटफर्म। LumbiniX 2026 का लागि LumbiniX-Committee टोलीद्वारा निर्मित।',
  'footer.disclaimer':
    'साइट र दृष्टिकोण निर्देशांक वास्तविक हुन् तर सबै सर्वेक्षण-स्तरका छैनन्, र अनुमानित भएकालाई एपले त्यसै लेबल गर्छ। यहाँ भएको कुनै पनि कुरा लुम्बिनी विकास कोष वा युनेस्कोको आधिकारिक प्रकाशन होइन।',
};

export function t(locale: Locale, key: LandingCopyKey): string {
  return locale === 'en' ? EN[key] : NE[key];
}

/** Prefixes an app-internal path with the current locale. `path` starts with `/`. */
export function localeHref(locale: Locale, path: string): string {
  return `/${locale}${path}`;
}

/** The same path under the other locale, for the language switcher. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ne' : 'en';
}

/**
 * Swaps the locale segment of a pathname produced by `usePathname()`, keeping
 * everything after it — including a nested route like `/en/data` → `/ne/data`
 * — so switching language never drops the reader back to the home page.
 */
export function swapLocaleInPathname(pathname: string, to: Locale): string {
  const segments = pathname.split('/');
  if (isLocale(segments[1] ?? '')) {
    segments[1] = to;
    return segments.join('/') || '/';
  }
  return `/${to}${pathname}`;
}
