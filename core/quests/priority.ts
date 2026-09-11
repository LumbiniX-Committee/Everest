export type CoveragePriority = {
  vantageId: string;
  siteId: string;
  priority: number;
};

export type PriorityQuest = {
  tasks: ReadonlyArray<{ targetId?: string }>;
};

/**
 * Stable, device-independent quest ranking. Unknown targets retain bundled
 * catalogue order, which is also the offline fallback.
 */
export function rankQuestsByCoverage<T extends PriorityQuest>(
  quests: readonly T[],
  rows: readonly CoveragePriority[],
  siteForTarget: (targetId: string) => string | undefined,
): T[] {
  const byVantage = new Map(rows.map((row) => [row.vantageId, row.priority]));
  const bySite = new Map<string, number>();
  rows.forEach((row) => {
    bySite.set(row.siteId, Math.max(bySite.get(row.siteId) ?? 0, row.priority));
  });
  const score = (quest: T) => Math.max(0, ...quest.tasks.map((task) => {
    if (!task.targetId) return 0;
    return byVantage.get(task.targetId) ?? bySite.get(siteForTarget(task.targetId) ?? '') ?? 0;
  }));

  return quests
    .map((quest, index) => ({ quest, index, score: score(quest) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ quest }) => quest);
}
