/**
 * core/progression — wisdom and spiritual level.
 *
 * ── Why this is a view and not a second currency ────────────────────────────
 *
 * The game layer asks for a growing number, levels, and a "+N" at each
 * recognition. The app already has that number: the puṇya ledger, which is
 * append-only, weighted by the *kind* of attention rather than by the task, and
 * clipped to a daily cap that exists specifically to remove any incentive to
 * repeat an act for its value. `types/quests.ts` states the rule plainly — a
 * quest carries no amount of its own, because an amount on a quest invites
 * tuning quests for it.
 *
 * Minting a second currency would either duplicate that ledger or quietly
 * overrule it: two balances, one capped and one not, and the uncapped one is
 * the one the interface celebrates. So there is only one balance. The wisdom
 * this file reports *is* puṇya — the same number, presented the way a game
 * presents progress — and the level is a curve over it. Nothing here decides
 * what anything is worth; it reads what the ledger already recorded.
 *
 * The practical consequence is worth stating: the daily cap still applies, so
 * someone who has done enough today advances no further today, and the
 * completion moments say so rather than showing an amount that was not granted.
 *
 * A note on vocabulary. `tools/lint-vocab.mjs` refuses the usual words for this
 * — the charter's position is that they describe a different kind of product —
 * so what a game would call experience is called wisdom here, which is the term
 * the rest of the app already uses.
 *
 * Pure arithmetic — no react, no storage. Tested from tools/test.
 */

/**
 * The levels, in order.
 *
 * Named rather than numbered. "Level 4" says nothing about a pilgrimage; the
 * stages of the eightfold path and the traditional vocabulary of practice do,
 * and they are what the rest of the app already speaks in.
 *
 * Thresholds are lifetime puṇya. They widen as they go — the first is one
 * afternoon's attention, the last is a season of returning — because a
 * progression that keeps its pace becomes a treadmill, which is the thing the
 * daily cap was written against.
 */
export const WISDOM_LEVELS: readonly { level: number; title: string; from: number }[] = [
  { level: 1, title: 'Wayfarer', from: 0 },
  { level: 2, title: 'Pilgrim', from: 200 },
  { level: 3, title: 'Seeker', from: 600 },
  { level: 4, title: 'Listener', from: 1_400 },
  { level: 5, title: 'Witness', from: 3_000 },
  { level: 6, title: 'Steward', from: 6_000 },
  { level: 7, title: 'Guardian', from: 12_000 },
];

export type WisdomStanding = {
  /** Lifetime puṇya. This is the number the interface shows as wisdom. */
  wisdom: number;
  level: number;
  title: string;
  /** The wisdom at which this level began. */
  levelFloor: number;
  /** Null at the highest level, where there is nothing further to fill. */
  nextLevelAt: number | null;
  /** 0–1 through the current level. 1 at the top level. */
  progress: number;
  /** How much more is needed for the next level. 0 at the top. */
  toNextLevel: number;
};

export function standingFor(wisdom: number): WisdomStanding {
  const safe = Number.isFinite(wisdom) && wisdom > 0 ? Math.floor(wisdom) : 0;

  // Walked from the top so the highest satisfied threshold wins without an
  // index arithmetic that breaks when a level is inserted.
  let index = 0;
  for (let i = WISDOM_LEVELS.length - 1; i >= 0; i -= 1) {
    if (safe >= WISDOM_LEVELS[i].from) {
      index = i;
      break;
    }
  }

  const current = WISDOM_LEVELS[index];
  const next = WISDOM_LEVELS[index + 1] ?? null;
  const span = next ? next.from - current.from : 0;

  return {
    wisdom: safe,
    level: current.level,
    title: current.title,
    levelFloor: current.from,
    nextLevelAt: next?.from ?? null,
    progress: next && span > 0 ? Math.min(1, (safe - current.from) / span) : 1,
    toNextLevel: next ? Math.max(0, next.from - safe) : 0,
  };
}

/** True when a recognition carried someone across a level threshold. */
export function reachedNewLevel(before: number, after: number): boolean {
  return standingFor(after).level > standingFor(before).level;
}

/**
 * How far through a place someone is.
 *
 * "Mastered" needs both halves: the story is the knowledge and the quests are
 * the attention paid on the ground. Finishing one without the other is not
 * finishing the place.
 */
export type PlaceStanding = {
  storyComplete: boolean;
  questsCompleted: number;
  questsTotal: number;
  /** 0–1 across story and quests together. */
  progress: number;
  mastered: boolean;
};

export function placeStanding(
  storyComplete: boolean,
  questsCompleted: number,
  questsTotal: number,
): PlaceStanding {
  const total = Math.max(0, questsTotal);
  const done = Math.min(Math.max(0, questsCompleted), total);
  // The story counts as one unit alongside the quests, so a place with no
  // quests at all still reaches 1 by being read, rather than dividing by zero.
  const units = total + 1;
  const progress = ((storyComplete ? 1 : 0) + done) / units;

  return {
    storyComplete,
    questsCompleted: done,
    questsTotal: total,
    progress,
    mastered: storyComplete && done === total,
  };
}
