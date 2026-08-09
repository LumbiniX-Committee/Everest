import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { demoQuests } from '@/data';
import { tasksSatisfiedByReport, type ReportableTask } from '@/core';
import { findSite } from '@/data';
import { database } from '@/services';
import { usePractice } from '@/store/practice';
import type { MeritKind, QuestProgress, QuestWithProgress } from '@/types';

export type TaskCompletionResult = {
  progress: QuestProgress;
  questCompleted: boolean;
  rewardGranted: boolean;
};

export type QuestsContextValue = {
  /** False until initial DB hydration and default quest seeding complete. */
  hydrated: boolean;
  /** Full list of quests with their progress status. */
  quests: QuestWithProgress[];
  /** Quests currently in progress ('in_progress'). */
  inProgressQuests: QuestWithProgress[];
  /** Quests available to start ('not_started'). */
  availableQuests: QuestWithProgress[];
  /** Quests that have been finished ('completed'). */
  completedQuests: QuestWithProgress[];
  /** Helper to get a specific quest by ID. */
  getQuestById: (questId: string) => QuestWithProgress | undefined;
  /** Transition a quest from 'not_started' to 'in_progress'. */
  startQuest: (questId: string) => Promise<void>;
  /** Mark a task completed. Triggers Puṇya recognition when all tasks in quest are done. */
  completeTask: (questId: string, taskId: string) => Promise<TaskCompletionResult>;
  /**
   * Credit a filed condition report against any started quest that was asking
   * for one at this site. Returns how many tasks it satisfied.
   */
  creditConditionReport: (siteId: string) => Promise<number>;
  /** Reset all quest progress (for testing/debug). */
  resetQuests: () => Promise<void>;
  /** Re-query SQLite to synchronize local state. */
  refresh: () => Promise<void>;
};

const QuestsContext = createContext<QuestsContextValue | null>(null);

/**
 * Maps quest category to appropriate MeritKind for Puṇya recognition.
 */
function getMeritKindForCategory(category: string): MeritKind {
  switch (category) {
    case 'survey':
      return 'observation';
    case 'epigraphy':
      return 'study';
    case 'ecology':
      return 'witness';
    case 'monastic':
      return 'reflection';
    default:
      return 'witness';
  }
}

export function QuestsProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [quests, setQuests] = useState<QuestWithProgress[]>([]);
  const { recognise } = usePractice();

  const refresh = useCallback(async () => {
    try {
      // Seed the catalogue only when the table is empty. Re-seeding on every
      // mount (INSERT OR REPLACE) would silently revert any later edit to a
      // quest row; the guard is what makes the "if empty" comment true.
      let list = await database.listQuests();
      if (list.length === 0) {
        await database.seedDefaultQuests(demoQuests);
        list = await database.listQuests();
      }
      setQuests(list);
    } catch (error) {
      console.error('Failed to load quests from database:', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startQuest = useCallback(
    async (questId: string) => {
      await database.startQuest(questId);
      await refresh();
    },
    [refresh],
  );

  const completeTask = useCallback(
    async (questId: string, taskId: string): Promise<TaskCompletionResult> => {
      const updatedProgress = await database.completeQuestTask(questId, taskId);
      const quest = quests.find((q) => q.id === questId);

      const questCompleted = updatedProgress.status === 'completed';
      let rewardGranted = false;

      // Award Puṇya merit if quest is newly completed
      if (questCompleted && quest) {
        const meritKind = getMeritKindForCategory(quest.category);
        const targetSiteId = quest.tasks.find((t) => t.targetId)?.targetId;
        const meritResult = await recognise({
          kind: meritKind,
          siteId: targetSiteId,
        });
        rewardGranted = meritResult !== null;
      }

      await refresh();
      return {
        progress: updatedProgress,
        questCompleted,
        rewardGranted,
      };
    },
    [quests, recognise, refresh],
  );

  /**
   * Credits a condition report against any quest task that was asking for one
   * here.
   *
   * Called after the report is safely in the database, never before: a quest
   * tick that outlives the record it stands for is worse than an untidy quest
   * screen. Failure is swallowed for the same reason the caller keeps going —
   * the report is the artefact that matters, and a missed tick is recoverable
   * by opening the quest.
   *
   * Only tasks of a started quest are considered. Filing a report should not
   * silently enrol someone in a quest they never chose; it credits work they
   * were already doing.
   */
  const creditConditionReport = useCallback(
    async (siteId: string): Promise<number> => {
      const started = quests.filter((quest) => quest.progress.status !== 'not_started');

      const tasks: ReportableTask[] = started.flatMap((quest) =>
        quest.tasks.map((task) => ({
          questId: quest.id,
          taskId: task.id,
          type: task.type,
          targetId: task.targetId,
          completed: quest.progress.completedTasks.includes(task.id),
        })),
      );

      // findSite resolves the legacy ids the quests still use — ashoka-pillar
      // for ashokan-pillar, puskarini-pond for puskarini. Falling back to the
      // raw id keeps a target that is not a registered site matchable.
      const links = tasksSatisfiedByReport(tasks, siteId, (id: string) => findSite(id)?.id ?? id);

      for (const link of links) {
        try {
          await database.completeQuestTask(link.questId, link.taskId);
        } catch {
          // Keep going: one quest failing to update must not strand the others.
        }
      }

      if (links.length > 0) await refresh();
      return links.length;
    },
    [quests, refresh],
  );

  const resetQuests = useCallback(async () => {
    await database.resetQuestProgress();
    await refresh();
  }, [refresh]);

  const getQuestById = useCallback(
    (questId: string) => quests.find((q) => q.id === questId),
    [quests],
  );

  const inProgressQuests = useMemo(
    () => quests.filter((q) => q.progress.status === 'in_progress'),
    [quests],
  );

  const availableQuests = useMemo(
    () => quests.filter((q) => q.progress.status === 'not_started'),
    [quests],
  );

  const completedQuests = useMemo(
    () => quests.filter((q) => q.progress.status === 'completed'),
    [quests],
  );

  const value = useMemo(
    () => ({
      hydrated,
      quests,
      inProgressQuests,
      availableQuests,
      completedQuests,
      getQuestById,
      startQuest,
      completeTask,
      creditConditionReport,
      resetQuests: resetQuests,
      refresh,
    }),
    [
      hydrated,
      quests,
      inProgressQuests,
      availableQuests,
      completedQuests,
      getQuestById,
      startQuest,
      completeTask,
      creditConditionReport,
      resetQuests,
      refresh,
    ],
  );

  return <QuestsContext.Provider value={value}>{children}</QuestsContext.Provider>;
}

export function useQuests(): QuestsContextValue {
  const value = useContext(QuestsContext);
  if (!value) throw new Error('useQuests must be used inside <QuestsProvider>');
  return value;
}
