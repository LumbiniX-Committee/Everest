/**
 * Where a trekker is along one day's trail, and what is left to the next stop.
 *
 * Pure, so the trail card and the tests read the same answers. Distances are
 * measured along the trail, not as the crow flies: on a switchback climb the
 * two differ by a factor of two or more.
 */
import { haversine } from '../../shared/geo.ts';

import { altitudeFactor, climbAndDescent, naismithHours, orderStopsAlong, snapToLine, toHalfHours, TREK_PACE } from './route.ts';

export type TrailPoint = readonly [longitude: number, latitude: number];
export type TrailStop = { id: string; latitude: number; longitude: number };
export type Position = { latitude: number; longitude: number };

/** Further than this from the trail, the trekker is told so instead of being placed on it. */
export const OFF_TRAIL_M = 150;

const metres = (a: Position, b: Position) =>
  haversine({ lat: a.latitude, lon: a.longitude }, { lat: b.latitude, lon: b.longitude });
const pointAt = ([longitude, latitude]: TrailPoint): Position => ({ latitude, longitude });

/** Distance along the line from its start to each point. */
export function cumulativeDistances(line: readonly TrailPoint[]): number[] {
  const out = [0];
  for (let i = 1; i < line.length; i += 1) out.push(out[i - 1] + metres(pointAt(line[i - 1]), pointAt(line[i])));
  return out;
}

/** Each stop's place on the line, in walking order: the best fit for all stops together. */
export function stopIndices(line: readonly TrailPoint[], stops: readonly TrailStop[]): number[] {
  return orderStopsAlong(line, stops);
}

/** Metres climbed between two line indices, using the same 10 m noise floor as the build. */
export function climbBetween(profile: readonly (number | null)[], start: number, end: number): number | null {
  let anchor: number | null = null;
  let up = 0;
  let seen = 0;
  for (let i = start; i <= end && i < profile.length; i += 1) {
    const value = profile[i];
    if (value == null) continue;
    seen += 1;
    if (anchor == null) {
      anchor = value;
      continue;
    }
    if (value - anchor >= 10) {
      up += value - anchor;
      anchor = value;
    } else if (anchor - value >= 10) {
      anchor = value;
    }
  }
  return seen > 1 ? Math.round(up) : null;
}

export type TrailProgress =
  | { onTrail: false; distanceFromTrailM: number }
  | {
      onTrail: true;
      distanceFromTrailM: number;
      /** Fraction of the day's trail behind you, 0 to 1. */
      fraction: number;
      walkedM: number;
      remainingM: number;
      /** The next stop ahead, or null once past the last. `estimatedHours` is an estimate (Naismith's rule), null without climb data. */
      next: { id: string; alongM: number; climbM: number | null; estimatedHours: number | null } | null;
      /** Estimated walking hours to the end of the day, without breaks; null without climb data. */
      remainingEstimatedHours: number | null;
      /** The elevation model's altitude at your point on the trail. */
      altitudeM: number | null;
    };

/**
 * Progress along one day.
 *
 * `previousIndex` is where the trekker was last time, so a return leg is not
 * mistaken for the outward one. A position worse than its own accuracy plus
 * the off-trail margin is reported as off the trail, with no progress guessed.
 */
export function trailProgress(
  line: readonly TrailPoint[],
  profile: readonly (number | null)[],
  stops: readonly TrailStop[],
  position: Position,
  accuracyM: number | null,
  previousIndex = 0,
): TrailProgress & { index: number } {
  if (line.length < 2) return { onTrail: false, distanceFromTrailM: Infinity, index: 0 };
  const margin = OFF_TRAIL_M + Math.min(accuracyM ?? 0, 100);
  const along = cumulativeDistances(line);
  // Snapped between vertices, not only to them: vertices are 120 m apart.
  const global = snapToLine(line, position, along)!;
  // Prefer a match at or ahead of last time when one is close enough.
  const ahead = previousIndex > 0 ? snapToLine(line, position, along, Math.max(0, previousIndex - 1))! : global;
  const match = ahead.distanceM <= margin ? ahead : global;
  if (match.distanceM > margin) return { onTrail: false, distanceFromTrailM: Math.round(match.distanceM), index: previousIndex };

  const total = along[along.length - 1];
  const indices = stopIndices(line, stops);
  const nextPosition = indices.findIndex((stopIndex) => along[stopIndex] > match.alongM + 1);
  const estimate = (fromIndex: number, toIndex: number, distanceM: number) => {
    const climb = climbAndDescent(profile, fromIndex, toIndex);
    return climb ? toHalfHours(naismithHours(distanceM, climb.ascentM, climb.descentM, TREK_PACE) * altitudeFactor(climb.highestM)) : null;
  };
  const next =
    nextPosition === -1
      ? null
      : (() => {
          const alongM = Math.round(along[indices[nextPosition]] - match.alongM);
          return {
            id: stops[nextPosition].id,
            alongM,
            climbM: climbBetween(profile, match.index, indices[nextPosition]),
            estimatedHours: estimate(match.index, indices[nextPosition], alongM),
          };
        })();
  const remainingM = Math.max(0, Math.round(total - match.alongM));
  return {
    onTrail: true,
    index: match.index,
    distanceFromTrailM: Math.round(match.distanceM),
    fraction: total > 0 ? match.alongM / total : 0,
    walkedM: Math.round(match.alongM),
    remainingM,
    next,
    remainingEstimatedHours: estimate(match.index, line.length - 1, remainingM),
    altitudeM: profile[match.index] ?? null,
  };
}

/**
 * Hours of walking, without breaks: Naismith's rule at trekking pace (TREK_PACE),
 * slowed above 3,500 m. The same rule the route build uses (tools/data/build-treks.mjs).
 * An estimate, and it says nothing about acclimatisation days.
 */
export function estimateTrekHours(distanceM: number, ascentM: number, descentM: number, maxAltM: number | null): number {
  return toHalfHours(naismithHours(distanceM, ascentM, descentM, TREK_PACE) * altitudeFactor(maxAltM));
}
