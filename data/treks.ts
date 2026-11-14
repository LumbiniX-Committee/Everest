import { simplifyLine } from '@/core';
import type { Trek, TrekStop } from '@/types';

import { TREKS } from './generated/treks';

export { TREKS };

export function findTrek(id: string | undefined): Trek | undefined {
  return TREKS.find((trek) => trek.id === id);
}

export function trekStop(trek: Trek, id: string | null | undefined): TrekStop | undefined {
  return id ? trek.stops.find((stop) => stop.id === id) : undefined;
}

/** Every stop a day passes, in walking order, including where it starts and ends. */
export function dayStops(trek: Trek, dayIndex: number): TrekStop[] {
  const day = trek.days[dayIndex];
  if (!day || day.rest) return [];
  return [day.from, ...day.via, day.to]
    .map((id) => trekStop(trek, id))
    .filter((stop): stop is TrekStop => Boolean(stop));
}

/** The whole trek as one line, for drawing. */
export function trekLine(trek: Trek): [number, number][] {
  return trek.days.flatMap((day) => day.line);
}

/**
 * Douglas–Peucker tolerance for drawing. 15 m is under the width of a trail
 * line at the zooms a trek is seen at, and drops about 40% of the points.
 * Progress and distances always use the full line.
 */
export const TREK_DRAW_TOLERANCE_M = 15;

/** The whole trek, simplified for drawing. */
export function trekDrawLine(trek: Trek): [number, number][] {
  return simplifyLine(trekLine(trek), TREK_DRAW_TOLERANCE_M);
}

/** One day's trail, simplified for drawing. */
export function dayDrawLine(trek: Trek, dayIndex: number): [number, number][] {
  return simplifyLine(trek.days[dayIndex]?.line ?? [], TREK_DRAW_TOLERANCE_M);
}

/**
 * The trek's altitude profile, day after day. A day whose trail could not be
 * measured leaves a gap a few columns wide rather than being skipped, so the
 * chart never joins two days that are not next to each other. Also returns
 * where each later day starts, as a fraction of the profile, for day ticks.
 */
export function trekProfile(trek: Trek): { profile: (number | null)[]; dayStarts: number[] } {
  const walking = trek.days.filter((day) => !day.rest);
  const measured = walking.filter((day) => day.profile.length > 1);
  const average = measured.length ? measured.reduce((sum, day) => sum + day.profile.length, 0) / measured.length : 0;
  const gap = Math.max(3, Math.round(average / 4));
  const profile: (number | null)[] = [];
  const starts: number[] = [];
  for (const day of walking) {
    starts.push(profile.length);
    profile.push(...(day.profile.length > 1 ? day.profile : new Array<null>(gap).fill(null)));
  }
  return { profile, dayStarts: profile.length ? starts.slice(1).map((start) => start / profile.length) : [] };
}
