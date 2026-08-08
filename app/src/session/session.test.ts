import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SessionCloseTracker, closeRitualTargetMs } from './closeRitual.ts';
import { shouldSuppressNotifications } from './notifications.ts';

test('the close ritual fires once after twenty minutes inside a sacred zone', () => {
  const t = new SessionCloseTracker();
  const target = closeRitualTargetMs(false);
  assert.equal(t.update({ insideSacredZone: true, nowMs: 0 }).shouldClose, false);
  assert.equal(t.update({ insideSacredZone: true, nowMs: target - 1 }).shouldClose, false);
  assert.equal(t.update({ insideSacredZone: true, nowMs: target }).shouldClose, true);
  // does not re-fire on the next tick
  assert.equal(t.update({ insideSacredZone: true, nowMs: target + 1000 }).shouldClose, false);
});

test('leaving the sacred zone resets the clock', () => {
  const t = new SessionCloseTracker();
  const target = closeRitualTargetMs(false);
  t.update({ insideSacredZone: true, nowMs: 0 });
  const left = t.update({ insideSacredZone: false, nowMs: target / 2 });
  assert.equal(left.elapsedMs, 0);
  // re-entering starts over
  t.update({ insideSacredZone: true, nowMs: target / 2 + 1 });
  assert.equal(t.update({ insideSacredZone: true, nowMs: target }).shouldClose, false);
});

test('debug close ritual is thirty seconds', () => {
  assert.equal(closeRitualTargetMs(true), 30_000);
  assert.equal(closeRitualTargetMs(false), 20 * 60 * 1000);
});

test('notifications are suppressed inside the Sacred Garden geofence', () => {
  assert.equal(shouldSuppressNotifications({ zone: 'sacred_garden', insideGeofence: true }), true);
  assert.equal(shouldSuppressNotifications({ zone: 'sacred_garden', insideGeofence: false }), false);
  assert.equal(shouldSuppressNotifications({ zone: 'monastic_east', insideGeofence: true }), false);
  assert.equal(shouldSuppressNotifications({ zone: null, insideGeofence: true }), false);
});
