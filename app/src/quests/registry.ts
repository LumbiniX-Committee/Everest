/**
 * app/src/quests/registry.ts — quest availability.
 *
 * Loads the quest catalogue (seed/quests.json) and works out, for a given
 * position, time and completion history, which quests are available. Two gates:
 * proximity (you must be near the site) and time window (q.first-light is
 * 05:30–07:00 only — raking dawn light reveals surface deterioration).
 *
 * Pure TypeScript; the caller supplies position and clock, so it is testable
 * without a device.
 */

import type { Coords, Quest, QuestState, QuestAvailability, TimeWindow } from '../../../shared/types.ts';
import { haversine } from '../../../shared/geo.ts';

/** A quest is "too far" beyond this multiple of the site geofence. */
export const QUEST_PROXIMITY_MULTIPLE = 4;

export interface QuestSite {
  coords: Coords;
  geofence_m: number;
}

export interface QuestEvalContext {
  pos?: Coords;
  /** Local minutes past midnight at the site, 0–1439. */
  minutesOfDay?: number;
  /** Quest ids already completed. */
  completed?: ReadonlySet<string>;
  /** Site lookup for the quest's site_id. */
  sites: ReadonlyMap<string, QuestSite>;
}

/** Parse "HH:MM" to minutes past midnight. */
export function parseHHMM(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

/** Is `minutes` inside the window? Handles windows that wrap past midnight. */
export function inWindow(window: TimeWindow, minutes: number): boolean {
  const from = parseHHMM(window.from);
  const to = parseHHMM(window.to);
  return from <= to ? minutes >= from && minutes <= to : minutes >= from || minutes <= to;
}

export function evaluateQuest(quest: Quest, ctx: QuestEvalContext): QuestState {
  const completed = ctx.completed?.has(quest.id) ?? false;

  let distance_m: number | null = null;
  const site = quest.site_id ? ctx.sites.get(quest.site_id) : undefined;
  if (site && ctx.pos) distance_m = Math.round(haversine(ctx.pos, site.coords));

  let availability: QuestAvailability;
  if (completed) {
    availability = 'completed';
  } else if (quest.window && ctx.minutesOfDay != null && !inWindow(quest.window, ctx.minutesOfDay)) {
    availability = 'outside_window';
  } else if (site && distance_m != null && distance_m > site.geofence_m * QUEST_PROXIMITY_MULTIPLE) {
    availability = 'too_far';
  } else {
    availability = 'available';
  }

  return { quest_id: quest.id, availability, distance_m, completed_at: null };
}

export function evaluateQuests(quests: Quest[], ctx: QuestEvalContext): QuestState[] {
  return quests.map((q) => evaluateQuest(q, ctx));
}
