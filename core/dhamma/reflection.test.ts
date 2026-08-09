import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateReflectionQuestions,
  parseGeneratedQuestions,
} from './reflection.ts';

test('parseGeneratedQuestions reads a clean JSON array', () => {
  const raw = '["What weighs on you?", "Where does it come from?", "Could it ease?", "One step?"]';
  const parsed = parseGeneratedQuestions(raw, 3, 4);
  assert.ok(parsed);
  assert.equal(parsed?.length, 4);
  assert.equal(parsed?.[0], 'What weighs on you?');
});

test('parseGeneratedQuestions extracts an array wrapped in prose or code fences', () => {
  const raw = 'Sure! Here you go:\n```json\n["Q one?", "Q two?", "Q three?"]\n```\nHope that helps.';
  const parsed = parseGeneratedQuestions(raw, 3, 4);
  assert.deepEqual(parsed, ['Q one?', 'Q two?', 'Q three?']);
});

test('parseGeneratedQuestions caps to max and drops empties and over-long items', () => {
  const long = 'x'.repeat(300);
  const raw = JSON.stringify(['One?', '   ', 'Two?', long, 'Three?', 'Four?', 'Five?']);
  const parsed = parseGeneratedQuestions(raw, 3, 4);
  assert.deepEqual(parsed, ['One?', 'Two?', 'Three?', 'Four?']);
});

test('parseGeneratedQuestions returns null below the minimum', () => {
  assert.equal(parseGeneratedQuestions('["only one?"]', 3, 4), null);
});

test('parseGeneratedQuestions returns null for non-array or malformed input', () => {
  assert.equal(parseGeneratedQuestions('not json at all', 3, 4), null);
  assert.equal(parseGeneratedQuestions('{"q": "one"}', 3, 4), null);
  assert.equal(parseGeneratedQuestions('', 3, 4), null);
});

test('generateReflectionQuestions falls back to the deterministic scaffold offline', async () => {
  // No provider is configured in the test environment, so this returns the
  // fixed four-question scaffold rather than a tailored set.
  const res = await generateReflectionQuestions({ user_input: 'I feel stuck at work', language: 'en' });
  assert.equal(res.distress_override, false);
  assert.equal(res.tier, 'fallback');
  assert.equal(res.language, 'en');
  assert.equal(res.questions.length, 4);
  assert.ok(res.questions.every((q) => typeof q === 'string' && q.length > 0));
});

test('generateReflectionQuestions returns the Nepali scaffold when asked', async () => {
  const res = await generateReflectionQuestions({ user_input: 'म अलमलमा छु', language: 'ne' });
  assert.equal(res.language, 'ne');
  assert.equal(res.questions.length, 4);
  // The Devanagari scaffold, not the English one.
  assert.match(res.questions.join(' '), /[ऀ-ॿ]/);
});

test('generateReflectionQuestions includes a site opening when a site is given', async () => {
  const res = await generateReflectionQuestions({
    user_input: 'thinking about beginnings',
    language: 'en',
    site_id: 'puskarini',
  });
  assert.ok(res.opening && res.opening.length > 0);
});

test('generateReflectionQuestions short-circuits to the crisis response on distress', async () => {
  const res = await generateReflectionQuestions({ user_input: 'I want to die', language: 'en' });
  assert.equal(res.distress_override, true);
  assert.equal(res.questions.length, 0);
  assert.ok((res.helplines?.length ?? 0) > 0);
});
