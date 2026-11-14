import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TREKS } from '../../data/generated/treks.ts';

import { trailProgress } from './progress.ts';
import {
  altitudeFactor,
  climbAndDescent,
  cumulativeAlong,
  locateOnTrek,
  naismithHours,
  NAISMITH_PACE,
  orderStopsAlong,
  profileColumns,
  simplifyIndices,
  simplifyLine,
  snapToLine,
  splitStages,
  TREK_PACE,
  type LinePoint,
} from './route.ts';

// About 111 m between samples, straight north.
const straight: LinePoint[] = Array.from({ length: 11 }, (_, i) => [85, 28 + i * 0.001] as const);

test('Douglas–Peucker drops collinear vertices and keeps the ends', () => {
  assert.deepEqual(simplifyIndices(straight, 5), [0, 10]);
  assert.deepEqual(simplifyLine([[85, 28]], 5), [[85, 28]]);
});

test('Douglas–Peucker keeps a switchback wider than the tolerance', () => {
  // Out 111 m east, back, then north: a zigzag.
  const zigzag: LinePoint[] = [
    [85, 28],
    [85.0005, 28.0005],
    [85.001, 28.001],
    [85.0005, 28.0015],
    [85, 28.002],
  ];
  assert.deepEqual(simplifyIndices(zigzag, 10), [0, 2, 4]);
  // A tolerance wider than the zigzag flattens it.
  assert.deepEqual(simplifyIndices(zigzag, 200), [0, 4]);
});

test('simplified real trails keep their shape within the tolerance and shed vertices', () => {
  let before = 0;
  let after = 0;
  for (const trek of TREKS) {
    for (const day of trek.days.filter((d) => d.line.length > 2)) {
      const kept = simplifyLine(day.line, 15);
      before += day.line.length;
      after += kept.length;
      // Every dropped point lies within the tolerance of the simplified line.
      const along = cumulativeAlong(kept);
      for (const [longitude, latitude] of day.line) {
        const snap = snapToLine(kept, { latitude, longitude }, along)!;
        assert.ok(snap.distanceM <= 15.5, `${trek.id} day ${day.day}: ${snap.distanceM.toFixed(1)} m off`);
      }
      // Length changes little: corners are kept.
      const full = cumulativeAlong(day.line).at(-1)!;
      assert.ok(along.at(-1)! > full * 0.97, `${trek.id} day ${day.day} lost length`);
    }
  }
  assert.ok(after < before * 0.8, `kept ${after} of ${before}`);
});

test('snapping projects between vertices, not only onto them', () => {
  // Halfway between samples 3 and 4, 20 m east of the line.
  const snap = snapToLine(straight, { latitude: 28.0035, longitude: 85.0002 })!;
  assert.equal(snap.segment, 3);
  assert.ok(Math.abs(snap.alongM - 389.6) < 2, `along ${snap.alongM}`);
  assert.ok(Math.abs(snap.distanceM - 19.7) < 1, `off ${snap.distanceM}`);
});

test('stops are ordered as a whole, so one rough stop does not drag the rest to the end', () => {
  const outAndBack = [...straight, ...straight.slice(0, -1).reverse()];
  // A camp, the summit, back to camp: greedy and joint agree.
  const stops = [
    { latitude: 28, longitude: 85 },
    { latitude: 28.01, longitude: 85 },
    { latitude: 28, longitude: 85 },
  ];
  assert.deepEqual(orderStopsAlong(outAndBack, stops), [0, 10, 20]);
  // A mid stop placed roughly near the far end of the return leg would, taken
  // greedily, use up the line; the joint fit keeps the later stops reachable.
  const rough = [
    { latitude: 28, longitude: 85 },
    { latitude: 28.0049, longitude: 85.001 },
    { latitude: 28.01, longitude: 85 },
    { latitude: 28, longitude: 85 },
  ];
  const indices = orderStopsAlong(outAndBack, rough);
  assert.deepEqual([indices[0], indices[2], indices[3]], [0, 10, 20]);
  assert.ok(indices[1] <= 10);
});

test('Naismith: 5 km/h plus an hour per 600 m; trekking pace is slower', () => {
  assert.equal(naismithHours(10_000, 600, 0, NAISMITH_PACE), 3);
  assert.equal(naismithHours(6000, 400, 2000, TREK_PACE), 4);
  assert.equal(altitudeFactor(null), 1);
  assert.equal(altitudeFactor(3000), 1);
  assert.ok(Math.abs(altitudeFactor(5500) - 1.2) < 1e-9);
});

test('stages split a day at its stops with distance, climb and an estimate', () => {
  const profile = straight.map((_, i) => 3000 + i * 50);
  const stops = [
    { latitude: 28, longitude: 85 },
    { latitude: 28.005, longitude: 85 },
    { latitude: 28.01, longitude: 85 },
  ];
  const stages = splitStages(straight, profile, stops);
  assert.equal(stages.length, 2);
  assert.ok(Math.abs(stages[0].distanceM - 557) < 3);
  assert.equal(stages[0].ascentM, 250);
  assert.equal(stages[0].descentM, 0);
  assert.equal(stages[1].highestM, 3500);
  assert.ok(stages[0].estimatedHours != null && stages[0].estimatedHours > 0);
});

test('unmeasured climb stays null, never 0, and so does the estimate', () => {
  const stages = splitStages(straight, straight.map(() => null), [
    { latitude: 28, longitude: 85 },
    { latitude: 28.01, longitude: 85 },
  ]);
  assert.equal(stages[0].ascentM, null);
  assert.equal(stages[0].estimatedHours, null);
  assert.ok(stages[0].distanceM > 0);
  assert.equal(climbAndDescent([null, 3000], 0, 1), null);
});

test('progress includes estimated hours to the next stop and to the day’s end', () => {
  const profile = straight.map((_, i) => 3000 + i * 50);
  const stops = [
    { id: 'a', latitude: 28, longitude: 85 },
    { id: 'b', latitude: 28.01, longitude: 85 },
  ];
  const p = trailProgress(straight, profile, stops, { latitude: 28.0035, longitude: 85.0002 }, 5);
  assert.equal(p.onTrail, true);
  if (!p.onTrail) return;
  // Snapped between samples: 389 m walked, not 333 or 445.
  assert.ok(Math.abs(p.walkedM - 390) < 3, `walked ${p.walkedM}`);
  assert.ok(p.next?.estimatedHours != null);
  assert.ok(p.remainingEstimatedHours != null);
});

test('a position on another day’s trail is found', () => {
  const days = [
    { line: straight },
    { line: [] as LinePoint[], rest: true },
    { line: straight.map(([lon, lat]) => [lon + 0.05, lat] as const) },
  ];
  assert.deepEqual(locateOnTrek(days, { latitude: 28.004, longitude: 85.0501 }, 150)?.dayIndex, 2);
  assert.equal(locateOnTrek(days, { latitude: 28.004, longitude: 85.025 }, 150), null);
});

test('profile columns keep the highest sample and leave gaps as null', () => {
  assert.deepEqual(profileColumns([1, 5, 2, null, null, null, 3, 4], 4), [5, 2, null, 4]);
  assert.deepEqual(profileColumns([1, 2], 10), [1, 2]);
});
