import { test } from 'node:test';
import assert from 'node:assert/strict';

import { allocate, availableMerit } from './allocation.ts';
import type { Allocation, Need } from '../../shared/types.ts';

let n = 0;
const ctx = { userId: 'u1', nowIso: '2026-08-08T04:00:00Z', uuid: () => `a-${++n}` };
const need = (): Need => ({
  id: 'n1',
  site_id: 'puskarini',
  title: { en: '', ne: '' },
  description: { en: '', ne: '' },
  ne_review: 'pending',
  funded_by: '<sponsor>',
  target_npr: 180000,
  allocated_merit: 0,
  status: 'open',
});

test('available merit is balance minus what is already directed', () => {
  const allocs: Allocation[] = [
    { id: 'x', user_id: 'u1', need_id: 'n1', merit_spent: 40, created_at: '' },
    { id: 'y', user_id: 'u2', need_id: 'n1', merit_spent: 10, created_at: '' },
  ];
  assert.equal(availableMerit(100, allocs, 'u1'), 60);
});

test('allocating records the allocation and does not touch the ledger balance', () => {
  const nd = need();
  const allocs: Allocation[] = [];
  const r = allocate(nd, 30, 100, allocs, ctx);
  assert.equal(r.ok, true);
  assert.equal(allocs.length, 1);
  assert.equal(nd.allocated_merit, 30);
  // balance passed in is unchanged — the ledger is append-only, earning-only
  assert.equal(availableMerit(100, allocs, 'u1'), 70);
});

test('cannot direct more merit than is available', () => {
  const r = allocate(need(), 150, 100, [], ctx);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'insufficient_merit');
});

test('cannot allocate to a closed need or a non-positive amount', () => {
  const closed = { ...need(), status: 'complete' as const };
  assert.equal(allocate(closed, 10, 100, [], ctx).reason, 'need_closed');
  assert.equal(allocate(need(), 0, 100, [], ctx).reason, 'non_positive');
  assert.equal(allocate(need(), -5, 100, [], ctx).reason, 'non_positive');
});
