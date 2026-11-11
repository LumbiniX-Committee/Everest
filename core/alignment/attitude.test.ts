import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cameraElevationDeg } from './attitude.ts';

test('a phone held upright is level with the horizon', () => {
  assert.equal(cameraElevationDeg(90), 0);
});

test('tipping the phone back raises the camera, and forward lowers it', () => {
  assert.equal(cameraElevationDeg(100), 10);
  assert.equal(cameraElevationDeg(87), -3);
});

test('a phone flat on its back looks straight down', () => {
  assert.equal(cameraElevationDeg(0), -90);
});
