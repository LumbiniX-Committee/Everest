/**
 * Which quest tasks a condition report satisfies.
 *
 * Every seeded quest ends with a `condition_report` task naming a site — "File
 * Foundation Condition Assessment", "Report Pillar Fissure Condition". Filing an
 * actual condition report did nothing to them. The two halves both worked and
 * neither knew the other existed, so someone who photographed a crack, chose a
 * category and a severity, and filed it, then had to open the quest screen and
 * tick a box claiming they had done the thing they had just done.
 *
 * That is the gap the pitch calls "side quests for responsible tourism", and
 * closing it is a matching problem rather than a feature: the report already
 * carries everything the task was asking for.
 *
 * Pure and structural on purpose. It takes plain fields rather than the app's
 * `Quest` type so `core/` keeps its no-app-imports rule, and it takes the id
 * resolver as an argument rather than reaching for `@/data`.
 */

export type ReportableTask = {
  questId: string;
  taskId: string;
  /** Task type from the quest definition; only `condition_report` can match. */
  type: string;
  /** The site the task names. May be a legacy id. */
  targetId?: string;
  /** Already ticked — matching it again would be a no-op at best. */
  completed: boolean;
};

export type ReportLink = {
  questId: string;
  taskId: string;
};

/**
 * Matches on site identity, not on string equality.
 *
 * Quest tasks and site records disagree about ids by history: a task says
 * `ashoka-pillar` where the site is `ashokan-pillar`, and `puskarini-pond`
 * where the site is `puskarini`. Comparing raw strings would leave the feature
 * looking wired while silently matching nothing, which is the worst of both —
 * so both sides go through the resolver first.
 *
 * Where the resolver knows neither id, raw equality still applies. A task
 * pointing at something that is not a site in the registry can still be
 * satisfied by a report using the same id, and that is better than dropping it.
 * (`monastic-zone` is exactly this case today: the quest targets it and no such
 * site exists.)
 */
export function tasksSatisfiedByReport(
  tasks: ReportableTask[],
  reportSiteId: string,
  canonicalise: (id: string) => string,
): ReportLink[] {
  const target = canonicalise(reportSiteId);

  return tasks
    .filter((task) => {
      if (task.type !== 'condition_report') return false;
      if (task.completed) return false;
      if (!task.targetId) return false;
      return canonicalise(task.targetId) === target;
    })
    .map(({ questId, taskId }) => ({ questId, taskId }));
}
