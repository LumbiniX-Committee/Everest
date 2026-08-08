/**
 * app/src/design/copy/failure-lines.ts — the six unpunishing lines.
 *
 * Source: 10-REVIEW §1 (steal their failure copy) + D task 6.4. When an
 * observation riddle is answered wrongly, the app shows a hint in the
 * "Seek further, traveller…" register — warm, unpunishing, on-voice. There is
 * NO failure state, NO penalty, NO score deduction, ever (05 §5).
 *
 * A specific riddle's own hint (seed/quests.json → riddle.hint) is preferred
 * when it exists; these are the generic fallbacks and the shared register.
 *
 * ne strings are drafted, marked pending — flip ne_review when a speaker checks.
 */

import type { LocalisedText, ReviewState } from '../../shared/types.ts';

export const failureLinesReview: ReviewState = 'pending';

export const failureLines: LocalisedText[] = [
  {
    en: 'Seek further, traveller — look again, there is no wrong turn here.',
    ne: 'अझ खोज्नुहोस्, यात्री — फेरि हेर्नुहोस्, यहाँ कुनै गलत बाटो छैन।',
  },
  {
    en: 'Not yet. Nothing is lost by looking longer.',
    ne: 'अहिलेसम्म होइन। अझ हेर्दा केही गुम्दैन।',
  },
  {
    en: 'The stone keeps its answer for the patient eye.',
    ne: 'ढुङ्गाले आफ्नो उत्तर धैर्यवान् आँखाका लागि राख्छ।',
  },
  {
    en: 'Close. Let your gaze rest on it a moment more.',
    ne: 'नजिक। आफ्नो नजर त्यसमा अझ केही क्षण रहन दिनुहोस्।',
  },
  {
    en: 'Every guess is a closer look. Try once more.',
    ne: 'हरेक अनुमान नजिकको अवलोकन हो। फेरि प्रयास गर्नुहोस्।',
  },
  {
    en: 'The answer is in front of you, not in the app.',
    ne: 'उत्तर तपाईंको अगाडि छ, एपमा होइन।',
  },
];

/** Deterministic pick so the same wrong answer does not flicker between lines. */
export function failureLineFor(attempt: number): LocalisedText {
  return failureLines[Math.abs(attempt) % failureLines.length];
}
