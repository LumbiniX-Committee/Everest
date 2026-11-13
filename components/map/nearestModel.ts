import { MAP_SCANS } from '@/data/mapScans';
import type { Coordinate } from '@/types';
import { distanceMeters } from '@/utils';

/** The monument standing in 3D nearest to a point, or Maya Devi Temple. */
export function nearestModel(near?: Coordinate | null): [number, number] {
  const fallback = MAP_SCANS.find((scan) => scan.id === 'maya-devi-temple') ?? MAP_SCANS[0];
  const best = near
    ? [...MAP_SCANS].sort((a, b) => distanceMeters(near, a) - distanceMeters(near, b))[0]
    : fallback;
  return [best.longitude, best.latitude];
}
