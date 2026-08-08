/**
 * app/src/quests/riddles.ts — observation riddle checking.
 *
 * An observation riddle asks something answerable only by looking at the
 * monument in front of you (10-REVIEW §1). A wrong answer returns a hint, never
 * a penalty — there is no failure state and no score deduction, ever.
 *
 * The hint preferred is the riddle's own (seed/quests.json), falling back to the
 * shared "Seek further, traveller…" register in core/copy/failure-lines.ts.
 */

import type { RiddleAnswer, LocalisedText } from '../../shared/types.ts';
import { failureLineFor } from '../copy/failure-lines.ts';

/**
 * Normalise an answer for tolerant comparison: lower-case, trim, drop simple
 * punctuation, collapse whitespace, and strip a leading article. Devanagari is
 * left intact — its matras are combining marks and must not be stripped.
 */
export function normaliseAnswer(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"()\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^(the|a|an) /, '')
    .trim();
}

export interface RiddleResult {
  correct: boolean;
  /** Present only on a wrong answer. A hint, never a penalty. */
  hint?: LocalisedText;
}

export function checkRiddle(riddle: RiddleAnswer, answer: string, attempt = 0): RiddleResult {
  const given = normaliseAnswer(answer);
  const correct = riddle.accept.some((a) => normaliseAnswer(a) === given);
  if (correct) return { correct: true };
  return { correct: false, hint: riddle.hint ?? failureLineFor(attempt) };
}
