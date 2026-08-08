import type { HeritageSite, Observation } from '@/types';
import type { SiteVisit } from '@/services/database';

/**
 * The Chaityāvalī register.
 *
 * State is derived from evidence, never stored. A site is witnessed because
 * observations exist, not because a flag was set — so the register cannot drift
 * out of step with the record it describes, and deleting an observation
 * correctly demotes the site rather than leaving a badge behind claiming
 * something that is no longer true.
 */

export type RegisterState = 'unvisited' | 'visited' | 'witnessed' | 'resurveyed';

export const REGISTER_LABELS: Record<RegisterState, string> = {
  unvisited: 'Not yet visited',
  visited: 'Visited',
  witnessed: 'Witnessed',
  resurveyed: 'Resurveyed',
};

/** One line each, in the register's own voice. */
export const REGISTER_MEANINGS: Record<RegisterState, string> = {
  unvisited: 'You have not stood here.',
  visited: 'You were here, but recorded nothing.',
  witnessed: 'You recorded a frame from a fixed viewpoint.',
  resurveyed: 'You returned to a viewpoint you had already recorded.',
};

export type RegisterEntry = {
  site: HeritageSite;
  state: RegisterState;
  observations: Observation[];
  /** Observations grouped by vantage, newest first within each. */
  seriesByVantage: Map<string, Observation[]>;
  visit?: SiteVisit;
  /** ISO instant of the most recent observation, if any. */
  lastRecordedAt?: string;
};

/**
 * Resurveyed means *returning to the same viewpoint*, not merely observing a
 * site twice. Two frames from two different vantages are two series of one; it
 * is the second frame at one vantage that first makes a comparison possible,
 * and comparison is the entire point.
 */
function stateFor(observations: Observation[], visit: SiteVisit | undefined): RegisterState {
  if (observations.length === 0) return visit ? 'visited' : 'unvisited';

  const perVantage = new Map<string, number>();
  for (const observation of observations) {
    perVantage.set(observation.vantageId, (perVantage.get(observation.vantageId) ?? 0) + 1);
  }
  for (const count of perVantage.values()) {
    if (count >= 2) return 'resurveyed';
  }
  return 'witnessed';
}

export function buildRegister(
  sites: HeritageSite[],
  observations: Observation[],
  visits: SiteVisit[],
): RegisterEntry[] {
  const visitBySite = new Map(visits.map((visit) => [visit.siteId, visit]));

  const bySite = new Map<string, Observation[]>();
  for (const observation of observations) {
    const list = bySite.get(observation.siteId);
    if (list) list.push(observation);
    else bySite.set(observation.siteId, [observation]);
  }

  const entries = sites.map((site) => {
    // listObservations already returns newest first; the grouping preserves it.
    const siteObservations = bySite.get(site.id) ?? [];
    const visit = visitBySite.get(site.id);

    const seriesByVantage = new Map<string, Observation[]>();
    for (const observation of siteObservations) {
      const list = seriesByVantage.get(observation.vantageId);
      if (list) list.push(observation);
      else seriesByVantage.set(observation.vantageId, [observation]);
    }

    return {
      site,
      state: stateFor(siteObservations, visit),
      observations: siteObservations,
      seriesByVantage,
      visit,
      lastRecordedAt: siteObservations[0]?.capturedAt,
    };
  });

  // Most-advanced register state first, alphabetical within a state. A register
  // is read to find what you have done and what is left, so the two ends both
  // need to be findable — sorting purely by name buries your own work among
  // places you have never been.
  const rank: Record<RegisterState, number> = {
    resurveyed: 0,
    witnessed: 1,
    visited: 2,
    unvisited: 3,
  };
  return entries.sort(
    (a, b) => rank[a.state] - rank[b.state] || a.site.name.localeCompare(b.site.name),
  );
}

export function summariseRegister(entries: RegisterEntry[]) {
  const counts: Record<RegisterState, number> = {
    unvisited: 0,
    visited: 0,
    witnessed: 0,
    resurveyed: 0,
  };
  for (const entry of entries) counts[entry.state] += 1;
  return {
    counts,
    total: entries.length,
    /** Sites with at least one recorded frame. */
    recorded: counts.witnessed + counts.resurveyed,
  };
}
