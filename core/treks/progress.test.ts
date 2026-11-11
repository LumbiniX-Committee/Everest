import assert from 'node:assert/strict';
import { test } from 'node:test';

import { climbBetween, estimateTrekHours, stopIndices, trailProgress, type TrailPoint } from './progress.ts';

// A straight trail north, about 111 m between samples, out to a summit and back.
const out: TrailPoint[] = Array.from({ length: 11 }, (_, i) => [85, 28 + i * 0.001] as const);
const outAndBack: TrailPoint[] = [...out, ...out.slice(0, -1).reverse()];
const profile = outAndBack.map((_, i) => (i <= 10 ? 3000 + i * 50 : 3500 - (i - 10) * 50));
const stops = [
  { id: 'camp', latitude: 28, longitude: 85 },
  { id: 'summit', latitude: 28.01, longitude: 85 },
  { id: 'camp', latitude: 28, longitude: 85 },
];

test('stops are found in walking order on an out-and-back day', () => {
  assert.deepEqual(stopIndices(outAndBack, stops), [0, 10, 20]);
});

test('progress measures along the trail to the next stop, with the climb left', () => {
  const p = trailProgress(outAndBack, profile, stops, { latitude: 28.003, longitude: 85.0003 }, 10);
  assert.equal(p.onTrail, true);
  if (!p.onTrail) return;
  assert.equal(p.next?.id, 'summit');
  assert.ok(Math.abs(p.next!.alongM - 778) < 5, `along ${p.next!.alongM}`);
  assert.equal(p.next!.climbM, 350);
  assert.equal(p.altitudeM, 3150);
});

test('on the way back, the earlier index keeps the return leg', () => {
  const p = trailProgress(outAndBack, profile, stops, { latitude: 28.003, longitude: 85 }, 10, 12);
  assert.equal(p.onTrail, true);
  if (!p.onTrail) return;
  assert.equal(p.index, 17);
  assert.equal(p.next?.id, 'camp');
  assert.equal(p.next?.climbM, 0);
});

test('far from the trail, no progress is guessed', () => {
  const p = trailProgress(outAndBack, profile, stops, { latitude: 28.005, longitude: 85.01 }, 10);
  assert.equal(p.onTrail, false);
  assert.ok(p.distanceFromTrailM > 900);
});

test('a poor fix widens the margin before calling it off-trail', () => {
  const position = { latitude: 28.005, longitude: 85.0022 }; // about 216 m east
  assert.equal(trailProgress(outAndBack, profile, stops, position, 10).onTrail, false);
  assert.equal(trailProgress(outAndBack, profile, stops, position, 80).onTrail, true);
});

test('climb ignores model noise under 10 m and is null without data', () => {
  assert.equal(climbBetween([100, 105, 98, 104, 130], 0, 4), 30);
  assert.equal(climbBetween([null, null], 0, 1), null);
});

test('walking time slows at altitude', () => {
  assert.equal(estimateTrekHours(6000, 400, 0, 2000), 3);
  assert.ok(estimateTrekHours(6000, 400, 0, 5500) > 3);
});
