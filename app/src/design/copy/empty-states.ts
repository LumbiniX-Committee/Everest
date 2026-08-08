/**
 * app/src/design/copy/empty-states.ts — empty states as invitations.
 *
 * Source: 07-DESIGN-SYSTEM §6. Empty states are never blank and never apologise.
 * An empty resurvey list is genuinely good news in this product — everything is
 * current — and it should read that way. Errors are specific, never vague, and
 * do not say "Oops".
 *
 * ne strings drafted, marked pending.
 */

import type { LocalisedText, ReviewState } from '../../../../shared/types.ts';

export const emptyStatesReview: ReviewState = 'pending';

export const emptyStates = {
  /** No vantages need a resurvey — the good-news empty state from §6. */
  noResurveys: {
    en: 'Every viewpoint here is current. Nothing needs you today.',
    ne: 'यहाँका सबै दृश्यबिन्दु अद्यावधिक छन्। आज तपाईंलाई केही चाहिँदैन।',
  },
  /** No quests available at this location/time. */
  noQuests: {
    en: 'No practices here right now. Walk on, or come back at dawn.',
    ne: 'यहाँ अहिले कुनै अभ्यास छैन। अगाडि बढ्नुहोस्, वा बिहान फर्कनुहोस्।',
  },
  /** No captures yet in the chaityāvalī register. */
  noCaptures: {
    en: 'Your register is empty. Align to a viewpoint to begin.',
    ne: 'तपाईंको दर्ता खाली छ। सुरु गर्न दृश्यबिन्दुसँग मिलाउनुहोस्।',
  },
  /** No open condition reports at a site. */
  noReports: {
    en: 'No open conditions recorded here.',
    ne: 'यहाँ कुनै खुला अवस्था अभिलेख गरिएको छैन।',
  },
  /** Daily merit cap reached — congratulate and stop (05 §6 rule 1). */
  capReached: {
    en: "You've done enough today.",
    ne: 'तपाईंले आज पर्याप्त गर्नुभयो।',
  },
  /** The terminal card at the end of the quests list — the feed ends (charter). */
  endOfList: {
    en: "That's everything.",
    ne: 'यत्ति नै हो।',
  },
} as const satisfies Record<string, LocalisedText>;

export type EmptyStateKey = keyof typeof emptyStates;

/** Error copy: specific, never vague, never apologetic (07 §6). */
export const errorCopy = {
  offline: {
    en: "Couldn't reach the server. Saved to your device; it'll upload later.",
    ne: 'सर्भरमा पुग्न सकिएन। तपाईंको यन्त्रमा सुरक्षित; पछि अपलोड हुन्छ।',
  },
  loading: {
    en: 'Loading.',
    ne: 'लोड हुँदैछ।',
  },
} as const satisfies Record<string, LocalisedText>;
