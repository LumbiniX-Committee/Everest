import { test } from 'node:test';
import assert from 'node:assert/strict';

import { answerFromPlace, type GuidePlace } from './index.ts';

const mayaDevi: GuidePlace = {
  name: 'Maya Devi Temple',
  summary: 'The temple encloses the spot venerated as the birthplace of the Buddha.',
  description:
    'The Maya Devi Temple encloses the spot venerated for over two millennia as the birthplace of the Buddha. ' +
    'Inside lie the Marker Stone and the worn Nativity Sculpture showing Queen Maya Devi grasping a sal branch. ' +
    'Excavation revealed brick structures built in phases from the 3rd century BCE, laid over a still older shrine. ' +
    'The present whitewashed temple was rebuilt by the Lumbini Development Trust in 2003 to shelter these remains.',
  facts: [
    { label: 'Enshrines', value: 'Marker Stone and Nativity Sculpture' },
    { label: 'Earliest phase', value: '3rd c. BCE, over an older shrine' },
    { label: 'Present temple', value: 'Rebuilt by the Lumbini Development Trust, 2003' },
  ],
};

test('a "when" question is answered by the dated unit, not the whole description', () => {
  const answer = answerFromPlace('when was the present temple rebuilt?', mayaDevi);
  assert.ok(answer, 'expected a focused answer');
  assert.match(answer!, /2003/);
  // It must not just dump the opening summary sentence about the birthplace.
  assert.doesNotMatch(answer!, /two millennia/);
});

test('a "what is inside" question routes to the enshrines fact and the nativity sentence', () => {
  const answer = answerFromPlace('what is enshrined inside?', mayaDevi);
  assert.ok(answer);
  assert.match(answer!, /Marker Stone/);
});

test('an excavation question finds the excavation sentence', () => {
  const answer = answerFromPlace('when was it excavated?', mayaDevi);
  assert.ok(answer);
  assert.match(answer!, /3rd century BCE|3rd c\. BCE/);
});

test('an unrelated question returns null so the caller can fall back', () => {
  assert.equal(answerFromPlace('what is the wifi password?', mayaDevi), null);
});

test('an empty or stopword-only question returns null', () => {
  assert.equal(answerFromPlace('what is this?', mayaDevi), null);
  assert.equal(answerFromPlace('   ', mayaDevi), null);
});

test('a place with no material returns null rather than an empty string', () => {
  assert.equal(answerFromPlace('when was it built?', { name: 'Bare Site' }), null);
});

test('the answer only ever contains the place\'s own words', () => {
  // Every non-trivial token of the answer must come from the seed material, so
  // the guide cannot introduce a claim the site record does not carry.
  const answer = answerFromPlace('who is depicted in the sculpture?', mayaDevi);
  assert.ok(answer);
  const haystack = (
    mayaDevi.description +
    ' ' +
    (mayaDevi.facts ?? []).map((f) => `${f.label} ${f.value}`).join(' ')
  ).toLowerCase();
  for (const token of answer!.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/)) {
    if (token.length <= 2) continue;
    assert.ok(haystack.includes(token), `"${token}" is not from the seed material`);
  }
});
