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
