import assert from 'node:assert/strict';
import { test } from 'node:test';

import { reportTimeline } from './timeline.ts';

const recordedAt = '2026-11-01T08:00:00Z';

test('an unsent report is waiting, with no steps claimed', () => {
  const steps = reportTimeline({ recordedAt, synced: false, actions: [] });
  assert.deepEqual(steps.map((s) => s.key), ['waiting']);
});

test('a sent report with no action is received and nothing more', () => {
  const steps = reportTimeline({ recordedAt, synced: true, actions: [] });
  assert.deepEqual(steps.filter((s) => s.done).map((s) => s.key), ['received']);
  assert.equal(steps.find((s) => s.current)?.key, 'received');
});

test('steps follow the newest action, with its note and time', () => {
  const steps = reportTimeline({
    recordedAt,
    synced: true,
    actions: [
      { status: 'in_progress', note: 'Mason booked', at: '2026-11-03T09:00:00Z' },
      { status: 'acknowledged', note: null, at: '2026-11-02T09:00:00Z' },
    ],
  });
  assert.equal(steps.find((s) => s.current)?.key, 'in_progress');
  assert.equal(steps.find((s) => s.key === 'in_progress')?.note, 'Mason booked');
  assert.equal(steps.find((s) => s.key === 'resolved')?.done, false);
});

test('a reopened report goes back to received; history is not rewritten', () => {
  const steps = reportTimeline({
    recordedAt,
    synced: true,
    actions: [
      { status: 'resolved', note: null, at: '2026-11-03T09:00:00Z' },
      { status: 'open', note: 'Crack returned', at: '2026-11-05T09:00:00Z' },
    ],
  });
  assert.equal(steps.find((s) => s.current)?.key, 'received');
  assert.equal(steps.find((s) => s.key === 'resolved')?.done, false);
});
