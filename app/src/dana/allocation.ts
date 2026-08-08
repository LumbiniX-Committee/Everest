/**
 * app/src/dana/allocation.ts — directed dāna.
 *
 * Merit determines allocation against an itemised, sponsor-funded conservation
 * need; the sponsor's money moves directly to the custodian. The app NEVER
 * handles funds (05-CONTENT-SPEC §6).
 *
 * Crucially, allocating does NOT deduct from the merit ledger — the ledger stays
 * append-only and earning-only (Charter #9). "Available to direct" is your
 * balance minus what you have already directed. This is what keeps merit
 * non-transferable while still letting you point it at good work.
 */

import type { Allocation, Need } from '../../../shared/types.ts';

export interface AllocateContext {
  userId: string;
  nowIso: string;
  uuid: () => string;
}

export interface AllocateResult {
  ok: boolean;
  reason?: 'insufficient_merit' | 'need_closed' | 'non_positive';
  allocation?: Allocation;
}

/** Merit still free to direct: lifetime balance minus everything already directed. */
export function availableMerit(balance: number, allocations: readonly Allocation[], userId: string): number {
  const directed = allocations
    .filter((a) => a.user_id === userId)
    .reduce((n, a) => n + a.merit_spent, 0);
  return Math.max(0, balance - directed);
}

/**
 * Direct `amount` merit toward `need`. Records an Allocation and increases the
 * need's allocated_merit. Never moves money, never touches the ledger.
 */
export function allocate(
  need: Need,
  amount: number,
  balance: number,
  existing: Allocation[],
  ctx: AllocateContext,
): AllocateResult {
  if (amount <= 0 || !Number.isInteger(amount)) return { ok: false, reason: 'non_positive' };
  if (need.status !== 'open') return { ok: false, reason: 'need_closed' };
  if (amount > availableMerit(balance, existing, ctx.userId)) {
    return { ok: false, reason: 'insufficient_merit' };
  }

  const allocation: Allocation = {
    id: ctx.uuid(),
    user_id: ctx.userId,
    need_id: need.id,
    merit_spent: amount,
    created_at: ctx.nowIso,
  };
  existing.push(allocation);
  need.allocated_merit += amount;
  return { ok: true, allocation };
}
