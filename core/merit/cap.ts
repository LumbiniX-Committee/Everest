/**
 * app/src/merit/cap.ts — the daily cap that congratulates and stops.
 *
 * 05-CONTENT-SPEC §6 rule 1: at 200 merit for the day the app says "You've done
 * enough today" and stops awarding. It does not nag, and it does not hint at
 * what you'd earn tomorrow. This is an anti-craving mechanic, enforced in code.
 *
 * The cap number lives in shared/merit.ts because lane C enforces the same cap
 * server-side; two copies drift.
 */

import type { DateOnly } from '../../shared/types.ts';
import { MERIT } from '../../shared/merit.ts';
import { MeritLedger } from './ledger.ts';

export interface CapState {
  earnedToday: number;
  cap: number;
  /** cap - earnedToday, floored at 0. */
  remaining: number;
  /** true once the cap is reached — the app then congratulates and stops. */
  complete: boolean;
}

export function capState(ledger: MeritLedger, day: DateOnly): CapState {
  const earnedToday = ledger.totalForDay(day);
  const remaining = Math.max(0, MERIT.DAILY_CAP - earnedToday);
  return {
    earnedToday,
    cap: MERIT.DAILY_CAP,
    remaining,
    complete: earnedToday >= MERIT.DAILY_CAP,
  };
}
