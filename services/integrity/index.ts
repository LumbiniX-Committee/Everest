import { demoDhammaEntries, demoPrecincts, demoQuests, findSite, findVantage } from '@/data';
import { MIN_GEOFENCE_RADIUS_M } from '@/types';

/**
 * Referential checks over the demo content, run once at startup.
 *
 * These exist because of a specific near-miss. A parallel branch migrated the
 * site list onto generated seed data and renamed ids along the way —
 * `ashoka-pillar` to `ashokan-pillar`, `puskarini-pond` to `puskarini`, and two
 * sites dropped entirely. Nothing in the type system notices: `findSite`
 * returns `undefined`, callers skip it, and arrivals quietly stop firing for
 * three quarters of the Sacred Garden while still looking like they work.
 *
 * A merge conflict would have been the easy case. This is the one where git is
 * satisfied and the app is wrong.
 */

export type IntegrityProblem = {
  /** Where the dangling reference lives, for someone who has to fix it. */
  where: string;
  message: string;
};

/**
 * Every site id referenced anywhere must resolve to a real site.
 *
 * Pure and dependency-free so it can be called from a test, a screen, or
 * startup without standing anything up.
 */
export function checkSiteReferences(): IntegrityProblem[] {
  const problems: IntegrityProblem[] = [];

  for (const precinct of demoPrecincts) {
    if (precinct.siteIds.length === 0) {
      problems.push({
        where: `precinct "${precinct.id}"`,
        message: 'has no sites, so arriving there could never show anything.',
      });
    }

    for (const siteId of precinct.siteIds) {
      if (!findSite(siteId)) {
        problems.push({
          where: `precinct "${precinct.id}"`,
          message: `references site "${siteId}", which does not exist. Arrivals there will silently skip it.`,
        });
      }
    }

    if (precinct.radiusMetres < MIN_GEOFENCE_RADIUS_M) {
      problems.push({
        where: `precinct "${precinct.id}"`,
        message: `radius ${precinct.radiusMetres} m is below the ${MIN_GEOFENCE_RADIUS_M} m floor; geofence events will be erratic.`,
      });
    }
  }

  for (const entry of demoDhammaEntries) {
    for (const siteId of entry.siteIds ?? []) {
      if (!findSite(siteId)) {
        problems.push({
          where: `dhamma entry "${entry.id}"`,
          message: `references site "${siteId}", which does not exist. This passage will never surface on arrival.`,
        });
      }
    }
  }

  /*
   * Quests were the case this file described and did not cover.
   *
   * Every quest task carries a `targetId` naming either a site or a vantage,
   * and that id is what makes a quest location-aware — it decides which quests
   * are offered where, and whether one is locked. Two of the four shipped
   * quests pointed at `ashoka-pillar` and `puskarini-pond`: the very ids the
   * note above says were renamed. Nothing failed. The quests simply belonged
   * to no place, so they were never offered anywhere and never locked
   * anywhere, which looks exactly like a quest system with nothing to do.
   */
  for (const quest of demoQuests) {
    for (const task of quest.tasks) {
      if (!task.targetId) continue;
      if (findSite(task.targetId) || findVantage(task.targetId)) continue;
      problems.push({
        where: `quest "${quest.id}", task "${task.id}"`,
        message: `targets "${task.targetId}", which is neither a site nor a vantage. This task can never be offered at a place or completed by reaching one.`,
      });
    }
  }

  return problems;
}

/**
 * Reports problems, loudly in development and quietly in production.
 *
 * Deliberately does not throw. A dangling site id degrades one feature; taking
 * the whole app down at launch over it would be a worse outcome than the bug,
 * and would do it to users rather than to whoever introduced it. `__DEV__` is
 * where the person who can fix it is standing.
 */
export function assertContentIntegrity(): IntegrityProblem[] {
  const problems = checkSiteReferences();
  if (problems.length === 0) return problems;

  if (__DEV__) {
    console.error(
      `[integrity] ${problems.length} dangling content reference${problems.length > 1 ? 's' : ''}:\n` +
        problems.map((p) => `  • ${p.where} ${p.message}`).join('\n') +
        '\nThese do not crash anything — they make features quietly do nothing.',
    );
  }

  return problems;
}
