import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MeritLedger } from './ledger.ts';
import { capState } from './cap.ts';
import {
  awardResurvey,
  awardFirstReport,
  awardAttentionQuest,
  canAwardResurvey,
  type AwardContext,
} from './rules.ts';
import { MERIT } from '../../shared/merit.ts';
import type { MeritEvent } from '../../shared/types.ts';

let counter = 0;
function ctx(over: Partial<AwardContext> = {}): AwardContext {
  return {
    userId: 'u1',
    day: '2026-08-08',
    nowIso: '2026-08-08T04:00:00Z',
    nowMs: Date.parse('2026-08-08T04:00:00Z'),
    uuid: () => `id-${++counter}`,
    ...over,
  };
}

const ev = (over: Partial<MeritEvent>): MeritEvent => ({
  id: `e-${++counter}`,
  user_id: 'u1',
  kind: 'resurvey',
  ref_id: null,
  amount: 50,
  day: '2026-08-08',
  created_at: '2026-08-08T04:00:00Z',
  ...over,
});

test('ledger rejects zero, negative and non-integer amounts', () => {
  const l = new MeritLedger();
  assert.throws(() => l.append(ev({ amount: 0 })), /earning-only/);
  assert.throws(() => l.append(ev({ amount: -50 })), /earning-only/);
  assert.throws(() => l.append(ev({ amount: 12.5 })), /integer/);
  assert.equal(l.balance, 0);
});

test('balance is the sum of earnings', () => {
  const l = new MeritLedger([ev({ amount: 50 }), ev({ amount: 25, kind: 'corroboration' })]);
  assert.equal(l.balance, 75);
});

test('the daily cap refuses the award that would exceed 200', () => {
  const l = new MeritLedger();
  // four resurveys of distinct vantages = 200, exactly the cap
  for (let i = 0; i < 4; i++) {
    const r = awardResurvey(l, `v${i}`, ctx());
    assert.equal(r.awarded, 50);
  }
  assert.equal(l.totalForDay('2026-08-08'), 200);
  const cap = capState(l, '2026-08-08');
  assert.equal(cap.remaining, 0);
  assert.equal(cap.complete, true);

  // the fifth earns nothing — congratulate and stop
  const fifth = awardResurvey(l, 'v99', ctx());
  assert.equal(fifth.awarded, 0);
  assert.equal(fifth.capped, true);
  assert.equal(l.balance, 200);
});

test('the cap clips a partial award to exactly the remaining', () => {
  const l = new MeritLedger();
  awardResurvey(l, 'a', ctx()); // 50
  awardResurvey(l, 'b', ctx()); // 100
  awardResurvey(l, 'c', ctx()); // 150
  // attention quest wants 70 but only 50 remain
  const r = awardAttentionQuest(l, 'q.stillness', ctx());
  assert.equal(r.awarded, 50);
  assert.equal(r.capped, true);
  assert.equal(l.totalForDay('2026-08-08'), 200);
});

test('severity never scales the first-report reward', () => {
  const l = new MeritLedger();
  const mild = awardFirstReport(l, 'r-mild', ctx());
  const severe = awardFirstReport(l, 'r-severe', ctx());
  assert.equal(mild.awarded, MERIT.first_report);
  assert.equal(severe.awarded, MERIT.first_report);
  assert.equal(mild.awarded, severe.awarded);
});

test('one merit-earning resurvey per vantage per 24h', () => {
  const l = new MeritLedger();
  const first = awardResurvey(l, 'v1', ctx({ nowIso: '2026-08-08T04:00:00Z', nowMs: Date.parse('2026-08-08T04:00:00Z') }));
  assert.equal(first.awarded, 50);

  // 12h later — still inside the cooldown
  const tooSoon = awardResurvey(l, 'v1', ctx({ day: '2026-08-08', nowMs: Date.parse('2026-08-08T16:00:00Z') }));
  assert.equal(tooSoon.awarded, 0);
  assert.equal(tooSoon.rateLimited, true);
  assert.equal(canAwardResurvey(l, 'v1', Date.parse('2026-08-08T16:00:00Z')), false);

  // 25h later, next day — cooldown cleared
  const later = awardResurvey(l, 'v1', ctx({ day: '2026-08-09', nowIso: '2026-08-09T05:00:00Z', nowMs: Date.parse('2026-08-09T05:00:00Z') }));
  assert.equal(later.awarded, 50);
});

test('the cooldown is per-vantage, not global', () => {
  const l = new MeritLedger();
  awardResurvey(l, 'v1', ctx());
  const other = awardResurvey(l, 'v2', ctx());
  assert.equal(other.awarded, 50);
});
