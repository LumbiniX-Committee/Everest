import type { HomeHub } from '@/types';

/**
 * Where each starting area opens on the map.
 *
 * These are the town or site centres the map frames on first open, not
 * measurements of any monument, so nothing is recorded against them.
 */
export const HUB_CENTRES: Record<Exclude<HomeHub, 'unset' | 'near-me'>, [number, number]> = {
  lumbini: [83.2757, 27.4692],
  kathmandu: [85.324, 27.7083],
  pokhara: [83.9856, 28.2096],
  chitwan: [84.4334, 27.5291],
};

export function hubCentre(hub: HomeHub): [number, number] | null {
  return hub === 'unset' || hub === 'near-me' ? null : HUB_CENTRES[hub];
}
