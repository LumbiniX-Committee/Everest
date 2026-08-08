import { test } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeBbox, filterByScore } from './detect.ts';

test('a centred pixel box normalises to the same fraction of the frame', () => {
  // 100×100 box at (100,100) in a 400×400 image → quarter in, quarter wide.
  const n = normalizeBbox({ x1: 100, y1: 100, x2: 200, y2: 200 }, 400, 400);
  assert.equal(n.x, 0.25);
  assert.equal(n.y, 0.25);
  assert.equal(n.w, 0.25);
  assert.equal(n.h, 0.25);
});

test('corner order does not matter — min/max is taken', () => {
  const swapped = normalizeBbox({ x1: 200, y1: 200, x2: 100, y2: 100 }, 400, 400);
  assert.equal(swapped.x, 0.25);
  assert.equal(swapped.y, 0.25);
  assert.equal(swapped.w, 0.25);
  assert.equal(swapped.h, 0.25);
});

test('a box is clamped so it never spills past the frame edge', () => {
  const n = normalizeBbox({ x1: 300, y1: 300, x2: 900, y2: 900 }, 400, 400);
  // Origin clamps to within the frame and the size fills only what remains.
  assert.ok(n.x <= 1 && n.y <= 1);
  assert.ok(n.x + n.w <= 1.0000001);
  assert.ok(n.y + n.h <= 1.0000001);
});

test('zero image dimensions do not divide by zero', () => {
  const n = normalizeBbox({ x1: 0, y1: 0, x2: 10, y2: 10 }, 0, 0);
  assert.ok(Number.isFinite(n.x) && Number.isFinite(n.w));
});

test('score filter keeps only detections at or above the threshold', () => {
  // 0.25 is kept (>=), 0.24 is dropped — the boundary is inclusive.
  const kept = filterByScore(
    [{ score: 0.9 }, { score: 0.4 }, { score: 0.25 }, { score: 0.24 }],
    0.25,
  );
  assert.equal(kept.length, 3);
  assert.ok(kept.every((d) => d.score >= 0.25));
});
