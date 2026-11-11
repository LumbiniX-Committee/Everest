import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canUse, daysRemaining, isProActive, normaliseCode, priceFor } from './index.ts';

const NOW = new Date('2026-06-15T00:00:00Z');

test('prices follow the visitor type, defaulting to the foreign price', () => {
  assert.deepEqual(priceFor('nepali'), { amount: 1000, currency: 'NPR', period: 'month' });
  assert.deepEqual(priceFor('foreign'), { amount: 20, currency: 'USD', period: 'month' });
  assert.equal(priceFor('unset').currency, 'USD');
});

test('no code means no Pro', () => {
  assert.equal(isProActive({ expiresAt: null }, NOW), false);
  assert.equal(isProActive({ expiresAt: 'not a date' }, NOW), false);
});

test('Pro lasts through the grace period, then ends', () => {
  assert.equal(isProActive({ expiresAt: '2026-06-20T00:00:00Z' }, NOW), true);
  assert.equal(isProActive({ expiresAt: '2026-06-13T00:00:00Z' }, NOW), true, 'within grace');
  assert.equal(isProActive({ expiresAt: '2026-06-11T00:00:00Z' }, NOW), false, 'past grace');
});

test('days remaining counts the real expiry, not the grace period', () => {
  assert.equal(daysRemaining({ expiresAt: '2026-06-20T00:00:00Z' }, NOW), 5);
  assert.equal(daysRemaining({ expiresAt: '2026-06-13T00:00:00Z' }, NOW), 0);
  assert.equal(daysRemaining({ expiresAt: null }, NOW), null);
});

test('with gating off, every feature is open', () => {
  assert.equal(canUse('3d-views', { expiresAt: null }, false, NOW), true);
});

test('with gating on, Pro features need an active plan', () => {
  assert.equal(canUse('3d-views', { expiresAt: null }, true, NOW), false);
  assert.equal(canUse('3d-views', { expiresAt: '2026-06-20T00:00:00Z' }, true, NOW), true);
});

test('anything not named as a Pro feature can never be gated', () => {
  assert.equal(canUse('directions' as never, { expiresAt: null }, true, NOW), true);
});

test('typed codes are normalised', () => {
  assert.equal(normaliseCode(' saksi-ab12 cd34 '), 'SAKSIAB12CD34');
});
