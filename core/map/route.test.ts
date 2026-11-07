import assert from 'node:assert/strict';
import { test } from 'node:test';

import { closestIndex, distanceFromRoute, isOffRoute, nextManeuver, type LngLat } from './route.ts';

// A path heading east from Lumbini's Sacred Garden, about 100 m per step.
const ROUTE: LngLat[] = [
  [83.275, 27.469],
  [83.276, 27.469],
  [83.277, 27.469],
  [83.277, 27.470],
];

test('finds the route point nearest the walker', () => {
  assert.equal(closestIndex(ROUTE, { latitude: 27.469, longitude: 83.2762 }), 1);
});

test('measures distance to the line, not just to its corners', () => {
  const onLine = distanceFromRoute(ROUTE, { latitude: 27.469, longitude: 83.2755 });
  assert.ok(onLine < 1, `expected on the line, got ${onLine}`);
  const off = distanceFromRoute(ROUTE, { latitude: 27.4695, longitude: 83.2755 });
  assert.ok(off > 50 && off < 60, `expected about 55 m off, got ${off}`);
});

test('names the next manoeuvre ahead, then none after the last', () => {
  const maneuvers = [
    { instruction: 'Walk east.', beginIndex: 0, lengthM: 200 },
    { instruction: 'Turn left.', beginIndex: 2, lengthM: 110 },
  ];
  assert.equal(nextManeuver(maneuvers, 1)?.instruction, 'Turn left.');
  assert.equal(nextManeuver(maneuvers, 2), null);
});

test('does not call a walker off route on a noisy fix', () => {
  assert.equal(isOffRoute(30, 40), false);
  assert.equal(isOffRoute(30, 5), true);
  assert.equal(isOffRoute(20, null), false);
});
