import { test } from 'node:test';
import assert from 'node:assert/strict';

import { bracketGap, reticleColor, ALIGN_LOCK_THRESHOLD } from './reticle-math.ts';
import { color } from './tokens.ts';

test('brackets close as align approaches 1', () => {
  assert.equal(bracketGap(0, 26), 26); // fully open
  assert.equal(bracketGap(1, 26), 0); // fully closed
  assert.ok(bracketGap(0.5, 26) < bracketGap(0.25, 26));
});

test('bracket gap clamps out-of-range align', () => {
  assert.equal(bracketGap(-1, 26), 26);
  assert.equal(bracketGap(2, 26), 0);
});

test('reticle is amber while seeking, lapis at the gate', () => {
  assert.equal(reticleColor(0.5), color.seek);
  assert.equal(reticleColor(ALIGN_LOCK_THRESHOLD - 0.01), color.seek);
  assert.equal(reticleColor(ALIGN_LOCK_THRESHOLD), color.lock);
  assert.equal(reticleColor(1), color.lock);
});
