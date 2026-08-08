/**
 * shared/merit.ts — the merit table and its hard rules.
 *
 * Lives in shared/ because lane A enforces the cap client-side and lane C
 * enforces it server-side. Two copies of these numbers drift, and a cap the
 * server disagrees with is a bug you find on stage.
 *
 * Source: 05-CONTENT-SPEC.md §6.
 *
 * Changes by group agreement only.
 */

import type { MeritKind } from './types.ts';

export const MERIT: Record<MeritKind, number> & { DAILY_CAP: number } = {
  /** Awarded regardless of what the resurvey finds. "Nothing has changed" is a
   *  valuable observation, and paying more for damage pays people to find it. */
  resurvey: 50,
  corroboration: 25,
  /** NOT scaled by severity. Rule 5 below. */
  first_report: 25,
  attention_quest: 70,
  path_quest: 40,
  /** Translation, transcription, audio. */
  contribution: 30,

  DAILY_CAP: 200,
} as const;

/**
 * One merit-earning resurvey per vantage per user per 24 h (rule 6).
 */
export const RESURVEY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * The hard rules, restated here so nobody has to open the doc to check one.
 * Each is enforced in code, not by convention:
 *
 *  1. Daily cap at 200. On reaching it the app says "You've done enough today"
 *     and stops awarding. It does not nag and it does not hint at tomorrow.
 *     → app/src/merit/cap.ts
 *  2. No transfer between users. Ever. No secondary market, no fraud market.
 *     → there is no transfer function anywhere in this codebase
 *  3. No expiry. Nothing is lost by not playing.
 *     → nothing reads MeritEvent.created_at to expire anything
 *  4. No purchase. No in-app currency, no gacha, no loot.
 *  5. Severity does not scale reward. Finding worse damage must never pay more.
 *     → app/src/merit/rules.ts::awardFirstReport ignores severity
 *  6. One merit-earning resurvey per vantage per user per 24 h.
 *     → app/src/merit/rules.ts::canAwardResurvey
 *
 * And the structural one, Charter non-negotiable #9: the ledger is append-only
 * and earning-only. No spend column, no negative amounts, no balance transfer.
 * That is what makes merit non-transferable — a table shape, not a blockchain.
 */
export const MERIT_RULES_VERSION = 1;

/** Spending sinks. None of them touch money. */
export type MeritSink =
  /** Allocate merit against an itemised, sponsor-funded conservation need. The
   *  sponsor's money moves directly to the custodian; we never handle funds. */
  | 'directed_dana'
  /** Museum entry, monastery guesthouse meal, local craft. Tiers, not currency. */
  | 'partner_redemption'
  /** Named on a contributors' wall; attribution on photographs used in reports. */
  | 'recognition';
