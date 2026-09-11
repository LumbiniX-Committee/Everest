/**
 * Quests, per MVP-PLAN §13: lightweight, and secondary. A quest names a kind of
 * attention worth paying. It does not gate content — nothing is locked behind
 * one — and completing it grants no score.
 *
 * There is no reward amount on the quest itself. Completion calls
 * `usePractice().recognise()`, which awards puṇya weighted by the *kind* of
 * attention (see MERIT_WEIGHTS) — never by quest, difficulty, or outcome — and
 * clips to the daily cap. Putting a number here would invite tuning quests for
 * points; the weighting lives with the act, not the quest.
 */
export type QuestCategory = 'survey' | 'epigraphy' | 'ecology' | 'monastic';

export type QuestDifficulty = 'easy' | 'moderate' | 'challenging';

export type QuestTaskType = 'observation' | 'site_visit' | 'condition_report' | 'reading';

/**
 * What a task asks you to bring back.
 *
 * A tick records that you said you did something. Evidence records what you
 * actually saw, which is the only thing this app can build a conservation
 * series out of — so tasks that can carry evidence should.
 */
export type QuestEvidenceKind =
  /** Standing somewhere is its own proof; asking for a photo of a gate is busywork. */
  | 'none'
  | 'photo'
  /** A number worth having: steps, courses of brick, visible cracks. */
  | 'count'
  | 'note';

export type QuestTask = {
  id: string;
  title: string;
  description: string;
  type: QuestTaskType;
  targetId?: string;
  requiredCount?: number;
  /** Defaults to 'none' — a task says what it wants back, or wants nothing. */
  evidence?: QuestEvidenceKind;
  /**
   * What someone should be able to see in the photograph, in one line.
   *
   * Written for a person first. It also gives the optional AI review something
   * concrete to compare against, which is the difference between "does this
   * look right" and a model inventing a standard of its own.
   */
  expectation?: string;
  /** The intended social framing for a photograph; never forces a person into frame. */
  photoMode?: 'solo' | 'group' | 'architecture' | 'detail' | 'creative' | 'sequence' | 'context';
  /** A place-specific boundary shown before evidence is collected. */
  safetyNote?: string;
  /** Physical evidence that completes this task without a manual checkbox. */
  autoComplete?: 'arrival' | 'vantage_capture';
};

/**
 * What an AI reviewer thought of a submission.
 *
 * Deliberately not a pass/fail. This app's whole claim is first-hand evidence,
 * and a model that adjudicates whether your observation is true would be
 * asserting something it cannot ground — the same failure §25 refuses on the
 * Dhamma surface, where the spec calls hallucinated scripture in Lumbini
 * catastrophic. The equivalent here is a hallucinated finding entering a
 * conservation record.
 *
 * So the reviewer advises and the person decides. `unavailable` is a first-
 * class outcome: Lumbini has patchy signal, and a quest must complete without
 * a network.
 */
export type QuestReviewVerdict = 'looks-right' | 'looks-wrong' | 'unsure' | 'unavailable';

export type QuestReview = {
  verdict: QuestReviewVerdict;
  /** What the reviewer says it can see. Shown to the person, never hidden. */
  comment: string;
  /** Recorded so a later reader knows which model said it, and when. */
  model?: string;
  reviewedAt: string;
};

/** One person's answer to one task. */
export type QuestSubmission = {
  questId: string;
  taskId: string;
  /** Local file URI. Never uploaded except by the sync service. */
  photoUri?: string;
  count?: number;
  note?: string;
  submittedAt: string;
  review?: QuestReview;
};

export type Quest = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  /**
   * Why this is worth doing. The part that distinguishes a quest from a
   * checklist, and the reason there is no reward field beside it.
   */
  intention: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  estimatedMinutes: number;
  icon: string;
  tasks: QuestTask[];
  createdAt: number;
};

export type QuestStatus = 'not_started' | 'in_progress' | 'completed';

export type QuestProgress = {
  questId: string;
  status: QuestStatus;
  completedTasks: string[];
  startedAt?: number;
  completedAt?: number;
};

export type QuestWithProgress = Quest & {
  progress: QuestProgress;
};

export type QuestFamily = 'witness' | 'path' | 'attention' | 'observation';

export type LocalizedString = {
  en: string;
  ne: string;
};

export type SeedRiddle = {
  accept: string[];
  hint: LocalizedString;
};

export type SeedQuest = {
  id: string;
  family: QuestFamily;
  title: LocalizedString;
  description: LocalizedString;
  siteId: string | null;
  vantageId?: string;
  merit: number;
  window?: { from: string; to: string };
  durationSeconds?: number;
  riddle?: SeedRiddle;
  centroid?: { lat: number; lon: number };
  radiusMeters?: number;
};

