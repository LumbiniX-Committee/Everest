/**
 * app/src/merit/rules.ts — the award functions.
 *
 * Every way to earn merit goes through here, so the hard rules from
 * 05-CONTENT-SPEC §6 are enforced in one place:
 *
 *   - Awards are capped at the daily remaining (cap.ts). Past the cap, a
 *     completion still records but awards 0 — congratulate and stop.
 *   - Severity NEVER scales reward (rule 5). awardFirstReport takes no severity.
 *   - One merit-earning resurvey per vantage per user per 24h (rule 6).
 *   - Amounts come from shared/merit.ts, never inline literals.
 *
 * Side effects (id + timestamp) are injected via AwardContext so the logic is
 * deterministic in tests and free of node:crypto (which RN lacks).
 */

import type { MeritEvent, MeritKind, DateOnly } from '../../../shared/types.ts';
import { MERIT, RESURVEY_COOLDOWN_MS } from '../../../shared/merit.ts';
import { MeritLedger } from './ledger.ts';
import { capState } from './cap.ts';

export interface AwardContext {
  userId: string;
  /** The local day the award counts against, "YYYY-MM-DD". */
  day: DateOnly;
  /** ISO timestamp to stamp on the event. */
  nowIso: string;
  /** Epoch ms, for the resurvey cooldown comparison. */
  nowMs: number;
  /** Injected id generator — no node:crypto dependency in app logic. */
  uuid: () => string;
}

export interface AwardResult {
  awarded: number;
  /** true when the daily cap clipped the award (including to 0). */
  capped: boolean;
  /** true when a resurvey was refused by the 24h-per-vantage cooldown. */
  rateLimited: boolean;
  event: MeritEvent | null;
}

const NONE = (rateLimited = false): AwardResult => ({
  awarded: 0,
  capped: !rateLimited,
  rateLimited,
  event: null,
});

function grant(
  ledger: MeritLedger,
  kind: MeritKind,
  refId: string | null,
  requested: number,
  ctx: AwardContext,
): AwardResult {
  const { remaining } = capState(ledger, ctx.day);
  const amount = Math.min(requested, remaining);
  if (amount <= 0) return NONE(false);
  const event = ledger.append({
    id: ctx.uuid(),
    user_id: ctx.userId,
    kind,
    ref_id: refId,
    amount,
    day: ctx.day,
    created_at: ctx.nowIso,
  });
  return { awarded: amount, capped: amount < requested, rateLimited: false, event };
}

/**
 * A resurvey is merit-earning at most once per vantage per user per 24h. Returns
 * false if a resurvey for this vantage was awarded within the cooldown window.
 */
export function canAwardResurvey(ledger: MeritLedger, vantageId: string, nowMs: number): boolean {
  const prior = ledger.eventsFor('resurvey', vantageId);
  return !prior.some((e) => nowMs - Date.parse(e.created_at) < RESURVEY_COOLDOWN_MS);
}

/** Awarded whether or not anything changed — "nothing has changed" is valuable. */
export function awardResurvey(ledger: MeritLedger, vantageId: string, ctx: AwardContext): AwardResult {
  if (!canAwardResurvey(ledger, vantageId, ctx.nowMs)) return NONE(true);
  return grant(ledger, 'resurvey', vantageId, MERIT.resurvey, ctx);
}

export function awardCorroboration(ledger: MeritLedger, reportId: string, ctx: AwardContext): AwardResult {
  return grant(ledger, 'corroboration', reportId, MERIT.corroboration, ctx);
}

/**
 * First report of a condition. Deliberately takes NO severity argument — rule 5:
 * finding worse damage must never pay more.
 */
export function awardFirstReport(ledger: MeritLedger, reportId: string, ctx: AwardContext): AwardResult {
  return grant(ledger, 'first_report', reportId, MERIT.first_report, ctx);
}

/** Attention and observation quests. */
export function awardAttentionQuest(ledger: MeritLedger, questId: string, ctx: AwardContext): AwardResult {
  return grant(ledger, 'attention_quest', questId, MERIT.attention_quest, ctx);
}

export function awardPathQuest(ledger: MeritLedger, questId: string, ctx: AwardContext): AwardResult {
  return grant(ledger, 'path_quest', questId, MERIT.path_quest, ctx);
}

/** Translation, transcription, audio. */
export function awardContribution(ledger: MeritLedger, refId: string, ctx: AwardContext): AwardResult {
  return grant(ledger, 'contribution', refId, MERIT.contribution, ctx);
}
