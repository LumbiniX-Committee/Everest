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

export type QuestTask = {
  id: string;
  title: string;
  description: string;
  type: QuestTaskType;
  targetId?: string;
  requiredCount?: number;
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
