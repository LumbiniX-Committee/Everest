/**
 * One place for the things every page on the public site repeats: where the
 * navigation goes, and the two reports the site links to.
 *
 * Copy that appears on more than one page lives here rather than being retyped,
 * because the version that gets edited is never the one you forgot about.
 */

export const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/technology', label: 'Technology' },
  { href: '/research', label: 'Research' },
  { href: '/for-custodians', label: 'For custodians' },
  { href: '/ethics', label: 'Ethics' },
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

/** The three surfaces, in the order the app presents them. */
export const SURFACES = [
  {
    name: 'Tīrtha',
    means: 'a sacred crossing',
    subtitle: 'The explorer',
    body: 'The live map, and the front door. Your position against the heritage sites around you, a place that speaks as you reach it at the depth you chose, a fade between an old photograph and today, and routes that point at whatever has gone longest without a resurvey.',
    accent: 'text-tirtha',
    chip: 'bg-tirtha/10',
    rule: 'bg-tirtha',
  },
  {
    name: 'Sākṣī',
    means: 'witness',
    subtitle: 'Evidence',
    body: 'The loop the whole product exists for: pick a viewpoint, line the phone up with it, take the photograph, and note the condition of what you can see. The record is written to the phone before anything reaches the network.',
    accent: 'text-sakshi',
    chip: 'bg-sakshi/10',
    rule: 'bg-sakshi',
  },
  {
    name: 'Dhamma',
    means: 'the teaching',
    subtitle: 'Knowledge',
    body: 'Ask about Buddhist texts or heritage conservation and get an answer built only from real, cited passages — or an honest refusal when the sources will not support one.',
    accent: 'text-dhamma',
    chip: 'bg-dhamma/10',
    rule: 'bg-dhamma',
  },
] as const;
