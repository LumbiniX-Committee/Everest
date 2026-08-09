/**
 * Puṇya and practice.
 *
 * Read §11 and §27 of the brief before changing anything here. Puṇya is
 * recognition that an act of attention happened. It is not a score, not a
 * balance, and not spendable — there is deliberately no `spend`, no
 * `multiplier`, no `streak`, and no rank.
 *
 * The daily limit is the part that matters most. Most software is built to make
 * stopping feel like loss. This is built so that stopping is the completion.
 */

/** Why puṇya was recognised. Every event points at something the person did. */
export type MeritKind =
  /** A photograph recorded at a fixed vantage. */
  | 'witness'
  /** A condition report attached to that photograph. */
  | 'observation'
  /** Returning to a vantage already in the person's own series. */
  | 'resurvey'
  /** Reading an answer through to its sources. */
  | 'study'
  /** A reflection completed. */
  | 'reflection'
  /** Lumbini wisdom received. */
  | 'wisdom';

export const MERIT_LABELS: Record<MeritKind, string> = {
  witness: 'Witnessed',
  observation: 'Observed',
  resurvey: 'Returned',
  study: 'Studied',
  reflection: 'Reflected',
  wisdom: 'Lumbini Wisdom',
};

/**
 * Puṇya awarded per kind (05-CONTENT-SPEC §6).
 *
 * Weighted by the kind of attention, never by outcome — a stability finding and
 * a damage finding award the same (Charter #9, rule 5), so there is no incentive
 * to hope for damage. The daily cap, not scarcity between kinds, is what removes
 * the pull to optimise; reaching it says "enough", and that is the whole point.
 */
export const MERIT_WEIGHTS: Record<MeritKind, number> = {
  witness: 50,
  observation: 25,
  resurvey: 50,
  study: 30,
  reflection: 70,
  wisdom: 50,
};

/**
 * The daily puṇya cap. Reaching it completes the day and stops recognition —
 * never recording. "You've done enough today", and it must be true.
 */
export const DAILY_MERIT_CAP = 200;

/**
 * One recognised act.
 *
 * `amount` is the puṇya awarded — clipped to whatever remained under the daily
 * cap, so it can be 0 when the day was already complete. The event is still
 * written: the append-only ledger records that the act of attention happened,
 * even when no further merit followed.
 */
export type MeritEvent = {
  id: string;
  kind: MeritKind;
  /** Puṇya awarded for this act, after the daily cap. May be 0. */
  amount: number;
  /** ISO 8601, UTC. */
  occurredAt: string;
  /** What it was for. Absent for reflection and study. */
  siteId?: string;
  observationId?: string;
  /** One quiet line shown once, at the moment of recognition. */
  acknowledgement: string;
};

export type PracticeSummary = {
  /** Puṇya recognised today, local time. */
  todayMerit: number;
  /** True once `todayMerit >= DAILY_MERIT_CAP`. */
  dayComplete: boolean;
  /** Lifetime puṇya. Shown as a record, never as a target. Never spent. */
  balance: number;
  /** Distinct sites witnessed at least once. */
  sitesWitnessed: number;
  /** ISO date of the first recognised act, if any. */
  practiceBegan?: string;
};


