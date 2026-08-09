import { test } from 'node:test';
import assert from 'node:assert/strict';

import { trimToCompleteSentence } from './llm.ts';

/**
 * These guard the repair applied to a provider reply that ran out of room.
 *
 * The rule being tested is one-directional: it is always acceptable to drop a
 * partial sentence, and never acceptable to present one. Every case below is a
 * shape the provider actually produced against the reflection prompt while the
 * ceiling sat at 320 — the English guidance came back 741 characters long,
 * ending on the fragment `"I feel the wish`.
 */

test('trimToCompleteSentence drops a severed trailing clause', () => {
  const raw = 'You named the heaviness clearly. The teaching suggests naming what you feel, "I feel the wish';
  assert.equal(trimToCompleteSentence(raw), 'You named the heaviness clearly.');
});

test('trimToCompleteSentence keeps text that already ends on a full stop', () => {
  const raw = 'You looked at fear through four questions. Test this against your own experience.';
  assert.equal(trimToCompleteSentence(raw), raw);
});

test('trimToCompleteSentence honours the Devanagari danda', () => {
  // The Nepali path ends sentences with । — treating only Latin terminators as
  // complete would truncate every Nepali reflection back to nothing.
  const raw = 'तपाईंले भारी अनुभवलाई नाम दिनुभयो। यसको अर्थ तपाईं कमजोर';
  assert.equal(trimToCompleteSentence(raw), 'तपाईंले भारी अनुभवलाई नाम दिनुभयो।');
});

test('trimToCompleteSentence accepts question and exclamation endings', () => {
  assert.equal(trimToCompleteSentence('What do you notice? And then the'), 'What do you notice?');
  assert.equal(trimToCompleteSentence('Strive with diligence! The next'), 'Strive with diligence!');
});

test('trimToCompleteSentence returns empty when no sentence completed', () => {
  // The caller treats '' as a failed call and answers from the deterministic
  // path, so this is the case that prevents a fragment reaching the reader.
  assert.equal(trimToCompleteSentence('You notice that the sense of being stuck'), '');
  assert.equal(trimToCompleteSentence(''), '');
});

test('trimToCompleteSentence keeps only the last complete sentence boundary', () => {
  const raw = 'One. Two. Three incomplete';
  assert.equal(trimToCompleteSentence(raw), 'One. Two.');
});
