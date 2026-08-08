import { test } from 'node:test';
import assert from 'node:assert/strict';

import { alignmentScore, ALIGN_LOCK_THRESHOLD } from './score.ts';

const base = { tolPosM: 8, tolHeadingDeg: 12 };

test('a dead-centre alignment with a good fix locks at 1', () => {
  const s = alignmentScore({
    ...base,
    distanceM: 0,
    headingDeltaDeg: 0,
    pitchDeltaDeg: 0,
    gpsAccuracyM: 5,
  });
  assert.equal(s.align, 1);
  assert.equal(s.canLock, true);
  assert.equal(s.blockedBy, null);
});

test('a great GPS fix cannot lock a photo facing the wrong way (heading floor)', () => {
  const s = alignmentScore({
    ...base,
    distanceM: 0,
    headingDeltaDeg: 11, // sHead ≈ 0.08, below the 0.5 floor
    pitchDeltaDeg: 0,
    gpsAccuracyM: 3,
  });
  assert.equal(s.canLock, false);
  assert.equal(s.blockedBy, 'heading');
});

test('a poor GPS fix blocks lock even with perfect angles', () => {
  const s = alignmentScore({
    ...base,
    distanceM: 0,
    headingDeltaDeg: 0,
    pitchDeltaDeg: 0,
    gpsAccuracyM: 20, // > 15 m
  });
  assert.equal(s.canLock, false);
  assert.equal(s.blockedBy, 'gps');
});

test('a missing pitch reading degrades to level, not a block', () => {
  const s = alignmentScore({
    ...base,
    distanceM: 0,
    headingDeltaDeg: 0,
    pitchDeltaDeg: null,
    gpsAccuracyM: 5,
  });
  assert.equal(s.sPitch, 1);
  assert.equal(s.canLock, true);
});

test('missing position or heading scores zero on that axis and cannot lock', () => {
  const noGps = alignmentScore({
    ...base,
    distanceM: null,
    headingDeltaDeg: 0,
    pitchDeltaDeg: 0,
    gpsAccuracyM: null,
  });
  assert.equal(noGps.sPos, 0);
  assert.equal(noGps.canLock, false);

  const noCompass = alignmentScore({
    ...base,
    distanceM: 0,
    headingDeltaDeg: null,
    pitchDeltaDeg: 0,
    gpsAccuracyM: 5,
  });
  assert.equal(noCompass.sHead, 0);
  assert.equal(noCompass.canLock, false);
});

test('align is the documented weighted sum', () => {
  const s = alignmentScore({
    ...base,
    distanceM: 4, // sPos = 0.5
    headingDeltaDeg: 6, // sHead = 0.5
    pitchDeltaDeg: 5, // sPitch = 0.5
    gpsAccuracyM: 5,
  });
  assert.ok(Math.abs(s.align - 0.5) < 1e-9);
  assert.ok(s.align < ALIGN_LOCK_THRESHOLD);
  assert.equal(s.canLock, false);
});
