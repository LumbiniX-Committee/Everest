import assert from 'node:assert/strict';
import { test } from 'node:test';

import { reportBoard, type BoardReport } from './board.ts';

const base: Omit<BoardReport, 'id' | 'recordedAt' | 'synced'> = {
  observationId: 'obs',
  siteId: 'maya-devi-temple',
  category: 'structural',
  severity: 'moderate',
};

test('counts each report at its real step and never moves one on its own', () => {
  const board = reportBoard(
    [
      { ...base, id: 'a', recordedAt: '2026-11-01T08:00:00Z', synced: false },
      { ...base, id: 'b', recordedAt: '2026-11-02T08:00:00Z', synced: true },
      { ...base, id: 'c', recordedAt: '2026-11-03T08:00:00Z', synced: true },
    ],
    { c: [{ status: 'resolved', note: 'Repointed', at: '2026-11-09T10:00:00Z' }] },
  );
  assert.equal(board.counts.waiting, 1);
  assert.equal(board.counts.received, 1);
  assert.equal(board.counts.resolved, 1);
  assert.equal(board.open, 2);
});

test('lists the most recent activity first, with the custodian note', () => {
  const board = reportBoard(
    [
      { ...base, id: 'old', recordedAt: '2026-11-01T08:00:00Z', synced: true },
      { ...base, id: 'new', recordedAt: '2026-11-05T08:00:00Z', synced: true },
    ],
    { old: [{ status: 'acknowledged', note: 'Seen', at: '2026-11-10T08:00:00Z' }] },
  );
  assert.deepEqual(board.items.map((item) => item.id), ['old', 'new']);
  assert.equal(board.items[0].note, 'Seen');
  assert.equal(board.items[0].step, 'acknowledged');
});

test('an empty record is an empty board, not zeros dressed as activity', () => {
  const board = reportBoard([], {});
  assert.equal(board.items.length, 0);
  assert.equal(board.open, 0);
});
