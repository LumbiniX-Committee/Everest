import type { Observation, Vantage } from '@/types';

/**
 * Practice — the returning loop.
 *
 * Not a fourth navigation surface. "Practice" is what happens across all three
 * over time: coming back to the same vantage on a cadence, so a series exists
 * at all. It lives in its own module because the logic is about intervals and
 * recurrence rather than about any one screen, and it will be needed by Tīrtha
 * (which viewpoints are due) and Sākṣī (what you last recorded) alike.
 *
 * Only the scheduling primitives exist so far. Reminders, streaks and any
 * notion of contribution standing are deliberately absent — this app is not
 * built to be a game, and adding scoring later should require a decision, not
 * be something that arrives by accident because the helpers were already here.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Default cadence between observations at a vantage.
 *
 * A month is a compromise: short enough to catch monsoon damage and restoration
 * work, long enough that nothing meaningful is expected to change in between.
 * Individual vantages will eventually override this.
 */
export const DEFAULT_INTERVAL_DAYS = 30;

export type VantageDueState = {
  vantageId: string;
  /** Null when the series has not begun. */
  lastObservedAt: string | null;
  /** Null when never observed — "due" is not meaningful without a first frame. */
  daysSinceLast: number | null;
  due: boolean;
};

/** When was this vantage last witnessed, and is it due again? */
export function dueState(
  vantage: Vantage,
  observations: Observation[],
  intervalDays = DEFAULT_INTERVAL_DAYS,
  now = Date.now(),
): VantageDueState {
  const forVantage = observations
    .filter((observation) => observation.vantageId === vantage.id)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));

  const last = forVantage[0];
  if (!last) {
    return { vantageId: vantage.id, lastObservedAt: null, daysSinceLast: null, due: true };
  }

  const elapsed = now - new Date(last.capturedAt).getTime();
  const daysSinceLast = Math.floor(elapsed / DAY_MS);

  return {
    vantageId: vantage.id,
    lastObservedAt: last.capturedAt,
    daysSinceLast,
    due: daysSinceLast >= intervalDays,
  };
}

/** Vantages needing a return, most overdue first. */
export function dueVantages(
  vantages: Vantage[],
  observations: Observation[],
  intervalDays = DEFAULT_INTERVAL_DAYS,
  now = Date.now(),
): VantageDueState[] {
  return vantages
    .map((vantage) => dueState(vantage, observations, intervalDays, now))
    .filter((state) => state.due)
    .sort((a, b) => (b.daysSinceLast ?? Infinity) - (a.daysSinceLast ?? Infinity));
}
