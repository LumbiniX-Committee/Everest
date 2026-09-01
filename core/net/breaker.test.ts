import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  decide,
  initialBreaker,
  onProbeFailure,
  onProbeSuccess,
  onRemoteFailure,
  OPEN_MS,
  UP_TTL_MS,
} from './breaker.ts';

test('fresh state probes rather than assuming', () => {
  assert.equal(decide(initialBreaker(), 1000), 'probe');
});

test('a successful probe is trusted without re-probing, until it goes stale', () => {
  const up = onProbeSuccess(initialBreaker(), 1000);
  assert.equal(decide(up, 1000), 'online');
  assert.equal(decide(up, 1000 + UP_TTL_MS - 1), 'online');
  // At and past the freshness horizon, probe again.
  assert.equal(decide(up, 1000 + UP_TTL_MS), 'probe');
});

test('a failed probe opens the breaker: the network is skipped for the cooldown', () => {
  const down = onProbeFailure(initialBreaker(), 5000);
  assert.equal(decide(down, 5000), 'offline');
  assert.equal(decide(down, 5000 + OPEN_MS - 1), 'offline');
  // After the cooldown, a probe is allowed again — a server that came back is found.
  assert.equal(decide(down, 5000 + OPEN_MS), 'probe');
});

test('a real call failing after the server looked up opens the breaker', () => {
  const up = onProbeSuccess(initialBreaker(), 1000);
  assert.equal(decide(up, 1200), 'online');
  const down = onRemoteFailure(up, 1200);
  // The very next question skips the network instead of paying the timeout again.
  assert.equal(decide(down, 1200), 'offline');
});

test('recovery: down, cooldown lapses, probe succeeds, back online', () => {
  let s = onProbeFailure(initialBreaker(), 0);
  assert.equal(decide(s, 100), 'offline');
  assert.equal(decide(s, OPEN_MS), 'probe');
  s = onProbeSuccess(s, OPEN_MS);
  assert.equal(decide(s, OPEN_MS), 'online');
});

test('transitions never read the previous state, only the clock', () => {
  // Each transition fully determines the next state from `now`, so a caller
  // cannot leave the machine in a stale hybrid.
  const a = onProbeSuccess(initialBreaker(), 42);
  const b = onProbeSuccess(onProbeFailure(initialBreaker(), 9), 42);
  assert.deepEqual(a, b);
});
