/**
 * app/src/merit/ledger.ts — the append-only, earning-only merit ledger.
 *
 * Charter non-negotiable #9, and the answer to the blockchain question
 * (10-REVIEW §3): merit is non-transferable because the ledger has no spend
 * column, no transfer, and no negative amounts. Non-transferability is a schema
 * decision, not a consensus mechanism.
 *
 * There is deliberately NO `spend()`, NO `transfer()`, and NO way to append a
 * non-positive amount. If you find yourself wanting one, re-read the charter.
 *
 * Pure TypeScript, no react-native import — runnable and tested today.
 */

import type { MeritEvent, DateOnly } from '../../shared/types.ts';

export class MeritLedger {
  private readonly events: MeritEvent[] = [];

  constructor(seed: MeritEvent[] = []) {
    for (const e of seed) this.append(e);
  }

  /**
   * The only mutation. Rejects zero, negative and non-integer amounts at
   * runtime — the type says `amount: number` but the ledger says `> 0 integer`.
   */
  append(event: MeritEvent): MeritEvent {
    if (typeof event.amount !== 'number' || Number.isNaN(event.amount)) {
      throw new Error('merit amount must be a number');
    }
    if (event.amount <= 0) {
      throw new Error(`merit is earning-only: amount must be > 0, got ${event.amount}`);
    }
    if (!Number.isInteger(event.amount)) {
      throw new Error(`merit amount must be an integer, got ${event.amount}`);
    }
    this.events.push(event);
    return event;
  }

  /** Lifetime balance — a fold over earnings, never a stored, mutable number. */
  get balance(): number {
    return this.events.reduce((n, e) => n + e.amount, 0);
  }

  totalForDay(day: DateOnly): number {
    return this.events
      .filter((e) => e.day === day)
      .reduce((n, e) => n + e.amount, 0);
  }

  /** Events matching a kind and ref, newest last. Used for the resurvey cooldown. */
  eventsFor(kind: MeritEvent['kind'], refId: string): MeritEvent[] {
    return this.events.filter((e) => e.kind === kind && e.ref_id === refId);
  }

  all(): readonly MeritEvent[] {
    return this.events;
  }
}
