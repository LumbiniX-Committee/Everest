import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  angleDelta,
  azimuthAtU,
  compassUsableAt,
  easeAngle,
  elevationAtV,
  lookFromRotation,
  uAtAzimuth,
  wrapDegrees,
} from './geometry.ts';

const near = (actual: number, expected: number, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not ${expected}`);

test('angles wrap into one turn', () => {
  assert.equal(wrapDegrees(370), 10);
  assert.equal(wrapDegrees(-10), 350);
  assert.equal(angleDelta(350, 10), 20);
  assert.equal(angleDelta(10, 350), -20);
});

test('image columns and compass directions round-trip around the north column', () => {
  assert.equal(azimuthAtU(0.485, 0.485), 0);
  near(azimuthAtU(0.735, 0.485), 90);
  near(azimuthAtU(0.235, 0.485), 270);
  near(uAtAzimuth(90, 0.485), 0.735);
  near(uAtAzimuth(270, 0.485), 0.235);
  near(uAtAzimuth(180, 0.9), 0.4);
});

test('the middle row of the image is the horizon', () => {
  assert.equal(elevationAtV(0.5), 0);
  assert.equal(elevationAtV(0), 90);
  assert.equal(elevationAtV(1), -90);
});

test('a phone held upright looks at the horizon in the direction alpha names', () => {
  const north = lookFromRotation(0, 90, 0);
  near(north.azimuth, 0);
  near(north.elevation, 0);
  // W3C alpha turns anticlockwise seen from above, so alpha 90 faces west.
  near(lookFromRotation(90, 90, 0).azimuth, 270);
  near(lookFromRotation(270, 90, 0).azimuth, 90);
});

test('tipping an upright phone back raises the view', () => {
  near(lookFromRotation(0, 100, 0).elevation, 10, 1e-9);
  near(lookFromRotation(0, 80, 0).elevation, -10, 1e-9);
});

test('a phone flat on its back looks at the ground', () => {
  near(lookFromRotation(0, 0, 0).elevation, -90);
});

test('a phone held in landscape still reports where its camera faces', () => {
  // Rolled 90° about its own y axis from flat: the back now faces west.
  const look = lookFromRotation(0, 0, 90);
  near(look.elevation, 0, 1e-9);
  near(look.azimuth, 270);
});

test('easing an angle takes the short way round', () => {
  assert.equal(easeAngle(null, 370, 0.5), 10);
  near(easeAngle(350, 10, 0.5), 0);
  near(easeAngle(10, 350, 0.5), 0);
});

test('the compass is trusted only while the phone is roughly upright', () => {
  assert.equal(compassUsableAt(0), true);
  assert.equal(compassUsableAt(-40), true);
  assert.equal(compassUsableAt(-80), false);
});
