import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canScan, candidateNote, detectorMessage, topCandidate } from './candidate.ts';

test('a detector that failed to load cannot scan', () => {
  // The regression this file exists for. 'error' used to count as available, so
  // the screen kept offering a scan that answered "still loading" forever.
  assert.equal(canScan('error'), false);
  assert.equal(canScan('unsupported'), false);
  assert.equal(canScan('no-model'), false);
  assert.equal(canScan('loading'), true);
  assert.equal(canScan('ready'), true);
});

test('every state that cannot scan says why, and every state that can stays quiet', () => {
  for (const status of ['error', 'unsupported', 'no-model'] as const) {
    const message = detectorMessage(status);
    assert.ok(message && message.length > 0, `${status} must explain itself`);
  }
  assert.equal(detectorMessage('ready'), null);
  assert.equal(detectorMessage('loading'), null);
});

test('the runtime’s own reason is preferred over the generic sentence', () => {
  assert.equal(
    detectorMessage('unsupported', 'onnxruntime-react-native: Module.install is not a function'),
    'onnxruntime-react-native: Module.install is not a function',
  );
  // A blank reason is not a reason.
  assert.equal(detectorMessage('unsupported', '   '), 'This build does not include the on-device scanner.');
});

test('the top candidate is the highest score, and nothing found is null', () => {
  assert.equal(topCandidate([]), null);
  const picked = topCandidate([
    { label: 'Crack', confidence: 0.41 },
    { label: 'Spalling', confidence: 0.88 },
    { label: 'Crack', confidence: 0.62 },
  ]);
  assert.equal(picked?.label, 'Spalling');
});

test('the note reports the model’s own score and asks for the judgment it cannot make', () => {
  const note = candidateNote('Crack', 0.8167);
  assert.match(note, /82% confidence/);
  assert.match(note, /crack/);
  assert.match(note, /urgent/);
  // Never a verdict: no severity word is asserted.
  assert.doesNotMatch(note, /\b(severe|critical|minor|urgent damage)\b/i);
});

test('a confidence outside 0 to 1 is clamped rather than printed', () => {
  assert.match(candidateNote('Crack', 1.4), /100% confidence/);
  assert.match(candidateNote('Crack', -0.2), /0% confidence/);
});
