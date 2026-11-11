import { haversine } from '@/core';
import type { Essential, EssentialKind } from '@/types';

import { ESSENTIALS } from './generated/essentials';

export { ESSENTIALS };

const metres = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) =>
  haversine({ lat: a.latitude, lon: a.longitude }, { lat: b.latitude, lon: b.longitude });

export function findEssential(id: string | null | undefined): Essential | undefined {
  return id ? ESSENTIALS.find((item) => item.id === id) : undefined;
}

/** Essentials in one hub or trek, optionally one kind or near one trek stop. */
export function essentialsFor(area: string, kind?: EssentialKind | null, near?: string | null): Essential[] {
  return ESSENTIALS.filter(
    (item) => item.area === area && (!kind || item.kind === kind) && (!near || item.near === near),
  );
}

/** Essentials within a radius, nearest first. */
export function essentialsNear(
  coordinate: { latitude: number; longitude: number },
  radiusM: number,
  kind?: EssentialKind | null,
): (Essential & { distanceM: number })[] {
  return ESSENTIALS.filter((item) => !kind || item.kind === kind)
    .map((item) => ({ ...item, distanceM: metres(coordinate, item.coordinate) }))
    .filter((item) => item.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM);
}
