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
  | 'reflection';

export const MERIT_LABELS: Record<MeritKind, string> = {
  witness: 'Witnessed',
  observation: 'Observed',
  resurvey: 'Returned',
  study: 'Studied',
  reflection: 'Reflected',
};

/**
 * One recognised act.
 *
 * There is no numeric weight. Counting acts is enough to show a practice; giving
 * them different point values immediately invites optimising for the expensive
 * ones, which is the behaviour this product exists to avoid.
 */
export type MeritEvent = {
  id: string;
  kind: MeritKind;
  /** ISO 8601, UTC. */
  occurredAt: string;
  /** What it was for. Absent for reflection and study. */
  siteId?: string;
  observationId?: string;
  /** One quiet line shown once, at the moment of recognition. */
  acknowledgement: string;
};

/**
 * How many recognised acts constitute a day's practice.
 *
 * Low on purpose. Reaching it should be normal, not aspirational — the message
 * at the end is "you've done enough today", and that has to be true.
 */
export const DAILY_PRACTICE_LIMIT = 5;

export type PracticeSummary = {
  /** Acts recognised today, local time. */
  todayCount: number;
  /** True once `todayCount >= DAILY_PRACTICE_LIMIT`. */
  dayComplete: boolean;
  /** Lifetime total. Shown as a record, never as a target. */
  totalCount: number;
  /** Distinct sites witnessed at least once. */
  sitesWitnessed: number;
  /** ISO date of the first recognised act, if any. */
  practiceBegan?: string;
};

/**
 * Quests.
 *
 * §13: lightweight, and secondary. A quest names a kind of attention worth
 * paying; it does not gate content, and nothing is locked behind one.
 */
export type QuestCategory =
  | 'witness'
  | 'attention'
  | 'pilgrimage'
  | 'stewardship'
  | 'dhamma'
  | 'reflection';

export const QUEST_CATEGORY_LABELS: Record<QuestCategory, string> = {
  witness: 'Witness',
  attention: 'Attention',
  pilgrimage: 'Pilgrimage',
  stewardship: 'Stewardship',
  dhamma: 'Dhamma',
  reflection: 'Reflection',
};

export type Quest = {
  id: string;
  category: QuestCategory;
  title: string;
  /** What this asks of the person, in one or two sentences. */
  description: string;
  /** Why it is worth doing. The part that distinguishes this from a checklist. */
  intention: string;
  /** How many qualifying acts complete it. */
  target: number;
  /** Site ids this quest concerns, when it is site-specific. */
  siteIds?: string[];
};

export type QuestProgress = {
  questId: string;
  /** Acts completed so far, 0…target. */
  completed: number;
  /** ISO 8601, UTC. Set once, when `completed` first reaches `target`. */
  completedAt?: string;
};
