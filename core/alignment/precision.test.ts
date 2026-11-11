import assert from 'node:assert/strict';
import { test } from 'node:test';

import { headingQuality, meaningfulDistanceM, smoothFix } from './precision.ts';

const at = (dNorthM: number, accuracyM: number | null, t: number) => ({
  latitude: 27.4696 + dNorthM / 111_195,
  longitude: 83.2758,
  accuracyM,
  timestamp: t,
});
const northOf = (lat: number) => (lat - 27.4696) * 111_195;

test('a vague fix barely moves a good estimate', () => {
  const first = smoothFix(null, at(0, 4, 0));
  const next = smoothFix(first, at(20, 40, 1000));
  assert.ok(northOf(next.latitude) < 3, `moved ${northOf(next.latitude).toFixed(1)} m`);
});

test('a precise fix moves the estimate most of the way', () => {
  const first = smoothFix(null, at(0, 15, 0));
  const next = smoothFix(first, at(10, 3, 1000));
  assert.ok(northOf(next.latitude) > 8, `moved ${northOf(next.latitude).toFixed(1)} m`);
});

test('steady fixes tighten the estimate below any single fix', () => {
  let estimate = smoothFix(null, at(0, 8, 0));
  for (let i = 1; i <= 5; i += 1) estimate = smoothFix(estimate, at(0, 8, i * 1000));
  assert.ok(estimate.accuracyM < 8, `accuracy ${estimate.accuracyM.toFixed(1)}`);
});

test('a jump to a different place resets instead of averaging', () => {
  const first = smoothFix(null, at(0, 5, 0));
  const next = smoothFix(first, at(500, 5, 1000));
  assert.ok(Math.abs(northOf(next.latitude) - 500) < 1);
});

test('compass quality reads both platforms, and unknown is not good', () => {
  assert.equal(headingQuality(5, 'ios'), 'good');
  assert.equal(headingQuality(40, 'ios'), 'poor');
  assert.equal(headingQuality(3, 'android'), 'good');
  assert.equal(headingQuality(1, 'android'), 'poor');
  assert.equal(headingQuality(null, 'ios'), 'fair');
});

test('a distance inside the GPS uncertainty is not reported', () => {
  assert.equal(meaningfulDistanceM(0.8, 6), null);
  assert.equal(meaningfulDistanceM(5, 6), null);
  assert.equal(meaningfulDistanceM(14.6, 6), 15);
  assert.equal(meaningfulDistanceM(1.5, null), null);
});
